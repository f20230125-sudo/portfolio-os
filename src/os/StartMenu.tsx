"use client";

import { LayoutList, RotateCcw, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { person } from "@/knowledge/profile";
import { flagship } from "@/knowledge/projects";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { uiActions } from "@/store/uiSlice";
import { windowsActions } from "@/store/windowsSlice";
import { askAbout, openApp } from "./actions";
import { ALL_APPS, appDef, PINNED, type AppDef } from "./apps";
import { AppIcon, Mark } from "./icons";

/** How well an app matches what was typed: every word typed must match something, and the average counts. */
function score(def: AppDef, q: string): number {
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  const title = def.title.toLowerCase();
  const keywords = def.keywords.map((k) => k.toLowerCase());
  const blurb = def.blurb.toLowerCase();
  let total = 0;
  for (const w of words) {
    let s = 0;
    if (title === w) s = 100;
    else if (title.startsWith(w)) s = 80;
    else if (title.includes(w)) s = 60;
    else if (keywords.some((k) => k.split(/\s+/).some((part) => part.startsWith(w)))) s = 45;
    else if (keywords.some((k) => k.includes(w))) s = 30;
    else if (blurb.includes(w)) s = 15;
    if (s === 0) return 0;
    total += s;
  }
  return total / words.length;
}

export function StartMenu() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.ui.startOpen);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return [];
    return ALL_APPS.map((d) => ({ d, s: score(d, q) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 6)
      .map((r) => r.d);
  }, [q]);
  // The last row is always "ask Uzair this", so a question that matches nothing still goes somewhere.
  const rowCount = results.length + (q ? 1 : 0);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const away = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (ref.current?.contains(t) || t.closest("[data-start-toggle]")) return;
      dispatch(uiActions.closeStart());
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      dispatch(uiActions.closeStart());
      document.querySelector<HTMLElement>("[data-start-toggle]")?.focus();
    };
    document.addEventListener("pointerdown", away, true);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away, true);
      document.removeEventListener("keydown", esc);
    };
  }, [open, dispatch]);

  if (!open) return null;

  const run = (index: number) => {
    if (index < results.length) dispatch(openApp(results[index].id));
    else if (q) dispatch(askAbout(query.trim()));
    setQuery("");
    setActive(0);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!q) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % rowCount);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + rowCount) % rowCount);
    }
  };

  return (
    <div ref={ref} id="start-menu" className="start" role="dialog" aria-label="Start menu" onKeyDown={onKeyDown}>
      <form
        className="start-search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          run(Math.min(active, Math.max(0, rowCount - 1)));
        }}
      >
        <Search size={16} aria-hidden="true" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          placeholder="Search apps and projects, or ask a question"
          aria-label="Search apps and projects, or ask a question"
          maxLength={300}
          autoComplete="off"
        />
      </form>

      <div className="start-scroll">
        {q ? (
          <ul aria-label="Results" className="space-y-0.5 pt-1">
            {results.map((d, i) => (
              <li key={d.id}>
                <button type="button" className="start-row" data-active={active === i} onMouseEnter={() => setActive(i)} onClick={() => run(i)}>
                  <AppIcon icon={d.icon} size={30} />
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px]">{d.title}</span>
                    <span className="block truncate text-[12px] text-faint">{d.blurb}</span>
                  </span>
                </button>
              </li>
            ))}
            <li>
              <button type="button" className="start-row" data-active={active === results.length} onMouseEnter={() => setActive(results.length)} onClick={() => run(results.length)}>
                <span className="grid h-[30px] w-[30px] place-items-center rounded-lg bg-accent text-accent-fg"><Sparkles size={16} aria-hidden="true" /></span>
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px]">Ask Uzair: “{query.trim()}”</span>
                  <span className="block text-[12px] text-faint">Answer from what he has written</span>
                </span>
              </button>
            </li>
          </ul>
        ) : (
          <>
            <h2 className="eyebrow px-1 pb-1 pt-2">Pinned</h2>
            <ul className="start-grid">
              {PINNED.map((id) => {
                const d = appDef(id);
                if (!d) return null;
                return (
                  <li key={id}>
                    <button type="button" className="start-item w-full" onClick={() => dispatch(openApp(id))}>
                      <AppIcon icon={d.icon} size={38} />
                      <span>{d.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <h2 className="eyebrow px-1 pb-1 pt-4">Recommended</h2>
            <ul className="grid gap-0.5 sm:grid-cols-2">
              {flagship.map((p) => (
                <li key={p.id}>
                  <button type="button" className="start-row" onClick={() => dispatch(openApp(`project:${p.id}`))}>
                    <AppIcon icon={p.icon} size={30} />
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px]">{p.name}</span>
                      <span className="block truncate text-[12px] text-faint">{p.stack.slice(0, 3).join(", ")}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="start-foot">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-accent text-accent-fg"><Mark size={16} /></span>
          <span className="truncate text-[13px] font-medium">{person.name}</span>
        </div>
        <div className="flex gap-1.5">
          <a className="btn !min-h-8 !px-2.5" href="/simple" title="Switch to simple view">
            <LayoutList size={14} aria-hidden="true" /> <span className="hidden sm:inline">Simple view</span>
          </a>
          <button
            type="button"
            className="btn !min-h-8 !px-2.5"
            title="Close every window and start again"
            onClick={() => {
              dispatch(windowsActions.closeAll());
              dispatch(openApp("ask"));
            }}
          >
            <RotateCcw size={14} aria-hidden="true" /> <span className="hidden sm:inline">Restart</span>
          </button>
        </div>
      </div>
    </div>
  );
}
