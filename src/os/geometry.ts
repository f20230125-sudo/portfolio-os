// The maths of windows: where they may sit, how they resize, where they snap.
// Plain functions with no React and no DOM, so they are tested directly.

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Size {
  w: number;
  h: number;
}
export interface Point {
  x: number;
  y: number;
}

export const TASKBAR_H = 48;
export const TITLE_H = 36;
export const MIN_W = 320;
export const MIN_H = 220;
/** How much of a window's title bar must stay on screen sideways, so it can always be grabbed. */
export const GRAB_W = 120;
/** How close to a screen edge a pointer must be to snap. */
export const SNAP_EDGE = 6;
/** Room left around a window opened at its preferred size. */
const MARGIN = 24;

const clamp = (n: number, lo: number, hi: number): number => Math.min(Math.max(n, lo), Math.max(lo, hi));

/** The part of the screen windows may use: everything above the taskbar. */
export function workArea(vp: Size): Rect {
  return { x: 0, y: 0, w: vp.w, h: Math.max(0, vp.h - TASKBAR_H) };
}

/** Keeps a window usable: not smaller than the minimum, not larger than the screen, title bar reachable. */
export function clampRect(r: Rect, vp: Size, min: Size = { w: MIN_W, h: MIN_H }): Rect {
  const wa = workArea(vp);
  const w = clamp(r.w, Math.min(min.w, wa.w), wa.w);
  const h = clamp(r.h, Math.min(min.h, wa.h), wa.h);
  const x = clamp(r.x, GRAB_W - w, wa.w - GRAB_W);
  const y = clamp(r.y, 0, wa.h - TITLE_H);
  return { x, y, w, h };
}

export type Handle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

/**
 * A window being resized from one handle. The edge opposite the handle stays
 * where it is; a window never gets smaller than `min` or leaves the work area.
 */
export function resizeRect(start: Rect, handle: Handle, dx: number, dy: number, vp: Size, min: Size = { w: MIN_W, h: MIN_H }): Rect {
  const wa = workArea(vp);
  let left = start.x;
  let top = start.y;
  let right = start.x + start.w;
  let bottom = start.y + start.h;
  if (handle.includes("e")) right = clamp(right + dx, left + min.w, wa.w);
  if (handle.includes("w")) left = clamp(left + dx, 0, right - min.w);
  if (handle.includes("s")) bottom = clamp(bottom + dy, top + min.h, wa.h);
  if (handle.includes("n")) top = clamp(top + dy, 0, bottom - min.h);
  return { x: left, y: top, w: right - left, h: bottom - top };
}

export type SnapSide = "left" | "right" | "max";

/** Which snap, if any, the pointer is asking for by touching a screen edge. */
export function snapZone(p: Point, vp: Size): SnapSide | null {
  if (p.y <= SNAP_EDGE) return "max";
  if (p.x <= SNAP_EDGE) return "left";
  if (p.x >= vp.w - SNAP_EDGE) return "right";
  return null;
}

export function snapRect(side: SnapSide, vp: Size): Rect {
  const wa = workArea(vp);
  if (side === "max") return wa;
  const half = Math.floor(wa.w / 2);
  return side === "left" ? { x: 0, y: 0, w: half, h: wa.h } : { x: half, y: 0, w: wa.w - half, h: wa.h };
}

/** Where a new window goes: the first in the middle, later ones stepping down and to the right. */
export function defaultRect(pref: Size, vp: Size, index: number): Rect {
  const wa = workArea(vp);
  const w = clamp(pref.w, Math.min(MIN_W, wa.w), Math.max(0, wa.w - MARGIN * 2));
  const h = clamp(pref.h, Math.min(MIN_H, wa.h), Math.max(0, wa.h - MARGIN * 2));
  const step = index % 8;
  const x = Math.round((wa.w - w) / 2 + (step - 2) * 32);
  const y = Math.round((wa.h - h) / 2 + (step - 2) * 28);
  return clampRect({ x, y, w, h }, vp);
}

/**
 * A maximised or snapped window pulled by its title bar returns to its old
 * size, with the pointer at the same relative place along the title bar.
 */
export function restoreUnderPointer(restore: Rect, frame: Rect, pointer: Point, vp: Size): Rect {
  const ratio = frame.w > 0 ? (pointer.x - frame.x) / frame.w : 0.5;
  const x = Math.round(pointer.x - restore.w * clamp(ratio, 0, 1));
  const y = Math.round(pointer.y - TITLE_H / 2);
  return clampRect({ x, y, w: restore.w, h: restore.h }, vp);
}

/** Moves a window by a delta and keeps it reachable. */
export function moveRect(r: Rect, dx: number, dy: number, vp: Size): Rect {
  return clampRect({ ...r, x: r.x + dx, y: r.y + dy }, vp);
}
