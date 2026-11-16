"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { motionOk } from "@/os/motion";
import { THEME_STORAGE_KEY } from "./themeScript";

// Light or dark. The choice lives on <html data-theme="..."> (set before the
// first paint by the script in themeScript.ts) and in localStorage. React reads
// it from the page instead of keeping its own copy, so the two cannot disagree.

export type Theme = "light" | "dark";

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function writeTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage may be switched off. The theme still changes for this visit.
  }
  for (const listener of listeners) listener();
}

type Point = { x: number; y: number };

/**
 * Changes the theme. Where the browser can, the new theme spreads in a circle
 * from the point that was clicked (the taskbar's sun or moon); otherwise, and
 * with reduced motion, it simply changes.
 */
function switchTheme(next: Theme, origin?: Point): void {
  const doc = document as Document & { startViewTransition?: (update: () => void) => { finished: Promise<void> } };
  if (typeof doc.startViewTransition !== "function" || !motionOk()) {
    writeTheme(next);
    return;
  }
  const root = document.documentElement;
  const x = origin?.x ?? window.innerWidth - 96;
  const y = origin?.y ?? window.innerHeight - 24;
  root.style.setProperty("--vt-x", `${x}px`);
  root.style.setProperty("--vt-y", `${y}px`);
  root.style.setProperty("--vt-r", `${Math.ceil(Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)))}px`);
  root.dataset.themeSwitch = "1";
  const done = () => {
    delete root.dataset.themeSwitch;
  };
  doc.startViewTransition(() => flushSync(() => writeTheme(next))).finished.then(done, done);
}

type ThemeContextValue = { theme: Theme; toggleTheme: (origin?: Point) => void };

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The server cannot know the visitor's theme; it renders "light" and the
  // client corrects itself right after hydration.
  const theme = useSyncExternalStore<Theme>(subscribe, readTheme, () => "light");
  const toggleTheme = useCallback((origin?: Point) => switchTheme(readTheme() === "dark" ? "light" : "dark", typeof origin?.x === "number" ? origin : undefined), []);
  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside <ThemeProvider>.");
  return value;
}
