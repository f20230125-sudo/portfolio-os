"use client";

import { Copy, Minus, Square, X } from "lucide-react";
import { memo, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { uiActions } from "@/store/uiSlice";
import { windowsActions } from "@/store/windowsSlice";
import { appDef } from "./apps";
import { AppView } from "./AppView";
import { clampRect, resizeRect, restoreUnderPointer, snapRect, snapZone, type Handle, type Rect, type SnapSide } from "./geometry";
import { AppIcon } from "./icons";
import { PHONE_WIDTH } from "./useViewport";

const HANDLES: Handle[] = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
const KEY_STEP = 24;

const frame = (r: Rect) => `translate(${r.x}px, ${r.y}px)`;

/**
 * One window. While it is dragged or resized the new rectangle is written
 * straight onto the element, and only handed to the store when the pointer is
 * let go, so the rest of the page does not redraw sixty times a second.
 */
function WindowImpl({ id }: { id: string }) {
  const dispatch = useAppDispatch();
  const win = useAppSelector((s) => s.windows.byId[id]);
  const focused = useAppSelector((s) => s.windows.focusedId === id);
  const vp = useAppSelector((s) => s.windows.viewport);
  const ref = useRef<HTMLDivElement>(null);
  const mobile = vp.w < PHONE_WIDTH;
  const focusNonce = win?.focusNonce;
  const minimized = win?.minimized;

  // When something asks for the window ("open", a taskbar click), give it
  // keyboard focus, unless the app inside already took it for an input.
  useEffect(() => {
    const el = ref.current;
    if (!el || minimized) return;
    if (!el.contains(document.activeElement)) el.focus({ preventScroll: true });
  }, [focusNonce, minimized]);

  if (!win) return null;
  const def = appDef(id);
  const maximised = win.mode === "max";

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || mobile) return;
    if ((e.target as HTMLElement).closest("button")) return;
    const el = ref.current;
    if (!el) return;
    dispatch(windowsActions.focus(id));
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    const start = { x: e.clientX, y: e.clientY };
    const startRect = win.rect;
    let base: Rect = startRect;
    let moved = false;
    let current: Rect = startRect;
    let zone: SnapSide | null = null;

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      if (!moved) {
        if (Math.hypot(dx, dy) < 4) return;
        moved = true;
        document.body.dataset.dragging = "1";
        // Pulling a maximised or snapped window by its title bar lets go of it.
        if (win.mode !== "normal") base = restoreUnderPointer(win.restore ?? startRect, startRect, start, vp);
      }
      current = clampRect({ ...base, x: base.x + dx, y: base.y + dy }, vp);
      el.style.transform = frame(current);
      el.style.width = `${current.w}px`;
      el.style.height = `${current.h}px`;
      const next = snapZone({ x: ev.clientX, y: ev.clientY }, vp);
      if (next !== zone) {
        zone = next;
        dispatch(uiActions.setSnapPreview(next ? snapRect(next, vp) : null));
      }
    };
    const onEnd = () => {
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onEnd);
      handle.removeEventListener("pointercancel", onEnd);
      delete document.body.dataset.dragging;
      dispatch(uiActions.setSnapPreview(null));
      if (!moved) return;
      dispatch(windowsActions.setRect({ id, rect: current }));
      if (zone) dispatch(windowsActions.snap({ id, side: zone }));
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onEnd);
    handle.addEventListener("pointercancel", onEnd);
  };

  const startResize = (handleName: Handle) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || mobile || maximised) return;
    const el = ref.current;
    if (!el) return;
    e.stopPropagation();
    dispatch(windowsActions.focus(id));
    const grip = e.currentTarget;
    grip.setPointerCapture(e.pointerId);
    const start = { x: e.clientX, y: e.clientY };
    const startRect = win.rect;
    let current = startRect;
    document.body.dataset.dragging = "1";
    const onMove = (ev: PointerEvent) => {
      current = resizeRect(startRect, handleName, ev.clientX - start.x, ev.clientY - start.y, vp);
      el.style.transform = frame(current);
      el.style.width = `${current.w}px`;
      el.style.height = `${current.h}px`;
    };
    const onEnd = () => {
      grip.removeEventListener("pointermove", onMove);
      grip.removeEventListener("pointerup", onEnd);
      grip.removeEventListener("pointercancel", onEnd);
      delete document.body.dataset.dragging;
      dispatch(windowsActions.setRect({ id, rect: current }));
    };
    grip.addEventListener("pointermove", onMove);
    grip.addEventListener("pointerup", onEnd);
    grip.addEventListener("pointercancel", onEnd);
  };

  // Alt+arrows move the window and Alt+Shift+arrows resize it, for people who do not use a mouse.
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!e.altKey || mobile || e.target !== e.currentTarget) return;
    const dir: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const d = dir[e.key];
    if (!d) return;
    e.preventDefault();
    if (win.mode !== "normal") {
      dispatch(windowsActions.toggleMax(id));
      return;
    }
    if (e.shiftKey) {
      dispatch(windowsActions.setRect({ id, rect: resizeRect(win.rect, "se", d[0] * KEY_STEP, d[1] * KEY_STEP, vp) }));
    } else {
      dispatch(windowsActions.nudge({ id, dx: d[0] * KEY_STEP, dy: d[1] * KEY_STEP }));
    }
  };

  const style: React.CSSProperties = mobile ? { zIndex: win.z } : { transform: frame(win.rect), width: win.rect.w, height: win.rect.h, zIndex: win.z };

  return (
    <div
      ref={ref}
      className="win"
      role="dialog"
      aria-label={win.title}
      tabIndex={-1}
      data-win={id}
      data-focused={focused}
      data-min={win.minimized}
      data-mode={mobile ? "mobile" : win.mode}
      style={style}
      onPointerDownCapture={() => {
        if (!focused) dispatch(windowsActions.focus(id));
      }}
      onKeyDown={onKeyDown}
    >
      <div className="win-title" onPointerDown={startDrag} onDoubleClick={() => !mobile && dispatch(windowsActions.toggleMax(id))}>
        {def ? <AppIcon icon={def.icon} size={18} /> : null}
        <span className="win-title-text">{win.title}</span>
        <div className="win-controls">
          {!mobile && (
            <button type="button" aria-label={`Minimise ${win.title}`} onClick={() => dispatch(windowsActions.minimize(id))}>
              <Minus size={15} />
            </button>
          )}
          {!mobile && (
            <button type="button" aria-label={maximised ? `Restore ${win.title}` : `Maximise ${win.title}`} onClick={() => dispatch(windowsActions.toggleMax(id))}>
              {maximised ? <Copy size={12} /> : <Square size={12} />}
            </button>
          )}
          <button type="button" className="close" aria-label={`Close ${win.title}`} onClick={() => dispatch(windowsActions.close(id))}>
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="win-body">
        <AppView id={id} props={win.props} focusNonce={win.focusNonce} />
      </div>
      {!mobile && !maximised && HANDLES.map((h) => <div key={h} className={`rz rz-${h}`} onPointerDown={startResize(h)} aria-hidden="true" />)}
    </div>
  );
}

export const Window = memo(WindowImpl);
