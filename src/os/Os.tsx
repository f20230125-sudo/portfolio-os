"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { openApp } from "./actions";
import { resolveAppId } from "./apps";
import { ContextMenuProvider } from "./ContextMenu";
import { Desktop } from "./Desktop";
import { StartMenu } from "./StartMenu";
import { Taskbar } from "./Taskbar";
import { PHONE_WIDTH, useViewport } from "./useViewport";
import { Window } from "./Window";

function SnapPreview() {
  const r = useAppSelector((s) => s.ui.snapPreview);
  if (!r) return null;
  return <div className="snap-preview" aria-hidden="true" style={{ left: r.x, top: r.y, width: r.w, height: r.h }} />;
}

/** The whole screen: wallpaper, icons, windows, taskbar and menus. */
export function Os() {
  const dispatch = useAppDispatch();
  const order = useAppSelector((s) => s.windows.order);
  const announce = useAppSelector((s) => s.windows.announce);
  const mobile = useAppSelector((s) => s.windows.viewport.w < PHONE_WIDTH);
  const reduceMotion = useAppSelector((s) => s.settings.reduceMotion);
  const started = useRef(false);
  useViewport();

  useEffect(() => {
    document.documentElement.dataset.reduceMotion = String(reduceMotion);
  }, [reduceMotion]);

  // On the first visit: open what the link asked for (?open=sayso,ask), or the assistant.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const wanted = new URLSearchParams(window.location.search)
      .get("open")
      ?.split(",")
      .map(resolveAppId)
      .filter((id): id is string => Boolean(id));
    if (wanted && wanted.length > 0) wanted.slice(0, 3).forEach((id) => dispatch(openApp(id)));
    else if (window.innerWidth >= PHONE_WIDTH) dispatch(openApp("ask"));
  }, [dispatch]);

  return (
    <ContextMenuProvider>
      <div className="os" data-mobile={mobile}>
        <div className="wallpaper" aria-hidden="true" />
        <Desktop />
        {order.map((id) => (
          <Window key={id} id={id} />
        ))}
        <SnapPreview />
        <Taskbar />
        <StartMenu />
        <p className="sr-only" role="status" aria-live="polite">{announce}</p>
      </div>
    </ContextMenuProvider>
  );
}
