"use client";

import { Moon, Search, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { uiActions } from "@/store/uiSlice";
import { windowsActions } from "@/store/windowsSlice";
import { askAbout, openApp } from "./actions";
import { appDef, TASKBAR_PINNED } from "./apps";
import { AppIcon, Mark } from "./icons";

function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // Read after mount: the server cannot know the visitor's moment.
    const tick = () => setNow(new Date());
    tick();
    const t = setInterval(tick, 20_000);
    return () => clearInterval(t);
  }, []);
  const time = now?.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" }) ?? "";
  const date = now?.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dubai" }) ?? "";
  return (
    <div className="tb-clock" role="timer" aria-label={now ? `Dubai time ${time}, ${date}` : "Dubai time"} title="Dubai, UAE (GST)">
      <span className="tabular" suppressHydrationWarning>{time || " "}</span>
      <span className="tb-date tabular text-[11px] text-muted" suppressHydrationWarning>{date || " "}</span>
    </div>
  );
}

export function Taskbar() {
  const dispatch = useAppDispatch();
  const { theme, toggleTheme } = useTheme();
  const startOpen = useAppSelector((s) => s.ui.startOpen);
  const order = useAppSelector((s) => s.windows.order);
  const byId = useAppSelector((s) => s.windows.byId);
  const focusedId = useAppSelector((s) => s.windows.focusedId);
  const [query, setQuery] = useState("");

  // Pinned apps stay; any other open window gets a button while it is open.
  const ids = [...TASKBAR_PINNED, ...order.filter((id) => !TASKBAR_PINNED.includes(id))];

  return (
    <nav className="taskbar" aria-label="Taskbar">
      <div />
      <div className="tb-group">
        <button type="button" className="tb-btn" data-start-toggle aria-label="Start" aria-pressed={startOpen} aria-expanded={startOpen} aria-controls="start-menu" onClick={() => dispatch(uiActions.toggleStart())}>
          <span className="text-accent"><Mark size={22} /></span>
        </button>
        <form
          className="tb-search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (!query.trim()) return;
            dispatch(askAbout(query));
            setQuery("");
          }}
        >
          <Search size={15} aria-hidden="true" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ask anything about Uzair" aria-label="Ask anything about Uzair" maxLength={300} autoComplete="off" />
        </form>
        {ids.map((id) => {
          const def = appDef(id);
          if (!def) return null;
          const win = byId[id];
          const isFront = Boolean(win) && !win.minimized && focusedId === id;
          return (
            <button
              key={id}
              type="button"
              className="tb-btn"
              data-open={Boolean(win)}
              data-task={id}
              aria-pressed={isFront}
              aria-label={`${def.title}${win ? (win.minimized ? ", minimised" : ", open") : ""}`}
              title={def.title}
              onClick={() => dispatch(win ? windowsActions.activate(id) : openApp(id))}
            >
              <AppIcon icon={def.icon} size={26} />
            </button>
          );
        })}
      </div>
      <div className="tb-tray">
        <button type="button" className="tb-btn" aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} onClick={toggleTheme}>
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <Clock />
        <button type="button" className="tb-show" aria-label="Show desktop" title="Show desktop" onClick={() => dispatch(windowsActions.toggleDesktop())} />
      </div>
    </nav>
  );
}
