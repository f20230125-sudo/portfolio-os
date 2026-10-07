"use client";

import { LayoutList, Moon, RotateCcw, Sun } from "lucide-react";
import { useTheme } from "@/components/theme";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { settingsActions } from "@/store/settingsSlice";
import { windowsActions } from "@/store/windowsSlice";
import { openApp } from "@/os/actions";

const SHORTCUTS: [string, string][] = [
  ["Arrow keys", "Move between desktop icons"],
  ["Enter", "Open the icon that is selected"],
  ["Alt + arrow keys", "Move the window that has focus"],
  ["Alt + Shift + arrows", "Resize it"],
  ["Alt + any arrow on a snapped window", "Give it back its size"],
  ["Esc", "Close the Start menu or a context menu"],
];

export default function SettingsApp() {
  const dispatch = useAppDispatch();
  const { theme, toggleTheme } = useTheme();
  const reduce = useAppSelector((s) => s.settings.reduceMotion);

  return (
    <div className="mx-auto max-w-[520px] space-y-6 p-6">
      <h2 className="text-[20px] font-semibold">Settings</h2>

      <section aria-labelledby="set-theme" className="space-y-2">
        <h3 id="set-theme" className="eyebrow">Theme</h3>
        <div className="seg" role="group" aria-label="Theme">
          <button type="button" aria-pressed={theme === "light"} onClick={() => theme !== "light" && toggleTheme()}>
            <Sun size={14} className="mr-1.5 inline" aria-hidden="true" />Light
          </button>
          <button type="button" aria-pressed={theme === "dark"} onClick={() => theme !== "dark" && toggleTheme()}>
            <Moon size={14} className="mr-1.5 inline" aria-hidden="true" />Dark
          </button>
        </div>
      </section>

      <section aria-labelledby="set-motion" className="space-y-2">
        <h3 id="set-motion" className="eyebrow">Motion</h3>
        <label className="flex items-center gap-3 text-[14px]">
          <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={reduce} onChange={(e) => dispatch(settingsActions.setReduceMotion(e.target.checked))} />
          Reduce animations
        </label>
        <p className="text-[12.5px] text-faint">Windows already stay still if your device asks for less motion.</p>
      </section>

      <section aria-labelledby="set-view" className="space-y-2">
        <h3 id="set-view" className="eyebrow">View</h3>
        <div className="flex flex-wrap gap-2">
          <a className="btn" href="/simple">
            <LayoutList size={14} aria-hidden="true" /> Switch to simple view
          </a>
          <button
            type="button"
            className="btn"
            onClick={() => {
              dispatch(windowsActions.closeAll());
              dispatch(openApp("ask"));
            }}
          >
            <RotateCcw size={14} aria-hidden="true" /> Restart the desktop
          </button>
        </div>
        <p className="text-[12.5px] text-faint">Simple view is the same content as an ordinary page, with no windows.</p>
      </section>

      <section aria-labelledby="set-keys" className="space-y-2">
        <h3 id="set-keys" className="eyebrow">Keyboard</h3>
        <dl className="panel divide-y divide-line text-[13px]">
          {SHORTCUTS.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[190px_1fr] gap-3 px-3 py-2">
              <dt className="font-mono text-[12px]">{k}</dt>
              <dd className="text-muted">{v}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
