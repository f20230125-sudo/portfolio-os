"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { openApp } from "./actions";
import { resolveAppId } from "./apps";
import { ContextMenuProvider } from "./ContextMenu";
import { Desktop } from "./Desktop";
import { ProfileCard } from "./ProfileCard";
import { StartMenu } from "./StartMenu";
import { Taskbar } from "./Taskbar";
import { PHONE_WIDTH, useViewport } from "./useViewport";
import { Window } from "./Window";

/**
 * The assistant opens by itself only where it fits beside the profile card (the
 * card is 420px wide from 216px in; the assistant is 460px at the right edge).
 * On a narrower screen the card is what a visitor should see first.
 */
const ASK_OPENS_FROM = 1180;

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

  // On the first visit: open what the link asked for (?open=sayso,ask), or the assistant on a wide screen.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab") ?? undefined;
    const wanted = params
      .get("open")
      ?.split(",")
      .map(resolveAppId)
      .filter((id): id is string => Boolean(id));
    if (wanted && wanted.length > 0) wanted.slice(0, 3).forEach((id, i) => dispatch(openApp(id, i === 0 && tab ? { tab } : undefined)));
    else if (window.innerWidth >= ASK_OPENS_FROM) dispatch(openApp("ask"));
  }, [dispatch]);

  return (
    <ContextMenuProvider>
      <div className="os" data-mobile={mobile}>
        <div className="wallpaper" aria-hidden="true" />
        <Desktop />
        <ProfileCard />
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
