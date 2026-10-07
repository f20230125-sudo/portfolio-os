"use client";

import { ExternalLink, FolderOpen, LayoutList, MessageCircle, Moon, Settings as SettingsIcon, Sun, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";
import { useTheme } from "@/components/theme";
import { projectById } from "@/knowledge/projects";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { uiActions } from "@/store/uiSlice";
import { windowsActions } from "@/store/windowsSlice";
import { openApp } from "./actions";
import { appDef, DESKTOP_ORDER, type AppDef } from "./apps";
import { useContextMenu, type MenuItem } from "./ContextMenu";
import { GithubGlyph, AppIcon } from "./icons";
import { useOs } from "./useOs";

const open = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

/** The menu for right-clicking an icon, or a project in any list. */
export function itemMenu(def: AppDef, run: { open: (id: string) => void; ask: (q: string) => void }): MenuItem[] {
  const items: MenuItem[] = [{ label: "Open", icon: <FolderOpen size={14} />, onSelect: () => run.open(def.id) }];
  if (def.kind === "project") {
    const p = projectById(def.id.slice("project:".length));
    if (p?.live) items.push({ label: "Open live site in a new tab", icon: <ExternalLink size={14} />, onSelect: () => open(p.live!.url) });
    if (p) items.push({ label: "View code on GitHub", icon: <GithubGlyph size={14} />, onSelect: () => open(p.code) });
    items.push({ separator: true }, { label: `Ask about ${def.title}`, icon: <MessageCircle size={14} />, onSelect: () => run.ask(`Tell me about ${def.title}`) });
  }
  return items;
}

/** Which icon is nearest in a direction, measured from the centres of the icons on screen. */
function neighbour(from: HTMLElement, key: string, all: HTMLElement[]): HTMLElement | null {
  const a = from.getBoundingClientRect();
  const ax = a.left + a.width / 2;
  const ay = a.top + a.height / 2;
  let best: HTMLElement | null = null;
  let bestScore = Infinity;
  for (const el of all) {
    if (el === from) continue;
    const b = el.getBoundingClientRect();
    const dx = b.left + b.width / 2 - ax;
    const dy = b.top + b.height / 2 - ay;
    const along = key === "ArrowRight" ? dx : key === "ArrowLeft" ? -dx : key === "ArrowDown" ? dy : -dy;
    if (along <= 4) continue;
    const across = key === "ArrowRight" || key === "ArrowLeft" ? Math.abs(dy) : Math.abs(dx);
    const score = along + across * 3;
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }
  return best;
}

export function Desktop() {
  const dispatch = useAppDispatch();
  const os = useOs();
  const menu = useContextMenu();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const selected = useAppSelector((s) => s.ui.selectedIcon);
  const mobile = useAppSelector((s) => s.windows.viewport.w < 768);
  const ref = useRef<HTMLDivElement>(null);

  const defs = DESKTOP_ORDER.map(appDef).filter((d): d is AppDef => Boolean(d));

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) return;
      const all = [...(ref.current?.querySelectorAll<HTMLElement>("[data-icon]") ?? [])];
      const here = (e.target as HTMLElement).closest<HTMLElement>("[data-icon]");
      if (!here) return;
      const next = neighbour(here, e.key, all);
      if (!next) return;
      e.preventDefault();
      next.focus();
      dispatch(uiActions.selectIcon(next.dataset.icon ?? null));
    },
    [dispatch],
  );

  const background: MenuItem[] = [
    { label: "Ask Uzair", icon: <MessageCircle size={14} />, onSelect: () => os.open("ask") },
    { label: "Open Projects", icon: <FolderOpen size={14} />, onSelect: () => os.open("projects") },
    { separator: true },
    { label: theme === "dark" ? "Switch to light theme" : "Switch to dark theme", icon: theme === "dark" ? <Sun size={14} /> : <Moon size={14} />, onSelect: toggleTheme },
    { label: "Show or hide windows", icon: <EyeOff size={14} />, onSelect: () => dispatch(windowsActions.toggleDesktop()) },
    { label: "Switch to simple view", icon: <LayoutList size={14} />, onSelect: () => router.push("/simple") },
    { label: "Settings", icon: <SettingsIcon size={14} />, onSelect: () => dispatch(openApp("settings")) },
  ];

  return (
    <div
      ref={ref}
      className="desktop"
      role="listbox"
      aria-label="Desktop"
      onKeyDown={onKeyDown}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) dispatch(uiActions.selectIcon(null));
      }}
      onContextMenu={(e) => {
        if (e.target !== e.currentTarget) return;
        e.preventDefault();
        menu.show({ x: e.clientX, y: e.clientY }, background);
      }}
    >
      {defs.map((d, i) => (
        <div
          key={d.id}
          role="option"
          aria-selected={selected === d.id}
          aria-label={`${d.title}${d.kind === "project" ? ", project" : ""}`}
          data-icon={d.id}
          tabIndex={selected === d.id || (selected === null && i === 0) ? 0 : -1}
          className="dicon"
          onFocus={() => dispatch(uiActions.selectIcon(d.id))}
          onClick={(e) => {
            dispatch(uiActions.selectIcon(d.id));
            const touch = (e.nativeEvent as PointerEvent).pointerType === "touch" || mobile;
            if (touch) os.open(d.id);
          }}
          onDoubleClick={() => os.open(d.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              os.open(d.id);
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dispatch(uiActions.selectIcon(d.id));
            menu.show({ x: e.clientX, y: e.clientY }, itemMenu(d, os));
          }}
        >
          <AppIcon icon={d.icon} size={46} />
          <span className="dicon-label">{d.title}</span>
        </div>
      ))}
    </div>
  );
}
