import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { clampRect, defaultRect, moveRect, snapRect, workArea, type Rect, type Size, type SnapSide } from "@/os/geometry";

// Every open window: where it is, how it is shown, and in what order they stack.
// All the maths is in os/geometry.ts; this file only decides which of those
// functions to call, so each rule is a few lines and is tested without a browser.

export type WinMode = "normal" | SnapSide;

export interface WinProps {
  tab?: string;
  /** Changes whenever the same window is asked to show something again. */
  nonce?: number;
}

export interface Win {
  id: string;
  title: string;
  rect: Rect;
  /** Where the window goes back to from maximised or snapped. */
  restore: Rect | null;
  mode: WinMode;
  minimized: boolean;
  z: number;
  /** Bumped when something asks for the window to take keyboard focus. */
  focusNonce: number;
  props: WinProps;
}

export interface WindowsState {
  byId: Record<string, Win>;
  /** Order of opening: the taskbar lists windows this way. */
  order: string[];
  focusedId: string | null;
  zCounter: number;
  /** How many windows have ever been opened; spreads new ones out. */
  seq: number;
  viewport: Size;
  /** Said to screen readers when something opens, closes or hides. */
  announce: string;
}

export const initialWindows: WindowsState = {
  byId: {},
  order: [],
  focusedId: null,
  zCounter: 0,
  seq: 0,
  viewport: { w: 1280, h: 800 },
  announce: "",
};

export interface OpenPayload {
  id: string;
  title: string;
  size: Size;
  anchor?: "right";
  props?: WinProps;
}

/** The window nearest the front that is not hidden. */
export function frontmost(s: WindowsState, except?: string): string | null {
  let best: Win | null = null;
  for (const id of s.order) {
    const w = s.byId[id];
    if (!w || w.minimized || w.id === except) continue;
    if (!best || w.z > best.z) best = w;
  }
  return best ? best.id : null;
}

function bringToFront(s: WindowsState, id: string): void {
  const w = s.byId[id];
  if (!w) return;
  if (w.z !== s.zCounter || s.focusedId !== id) {
    s.zCounter += 1;
    w.z = s.zCounter;
  }
  s.focusedId = id;
}

function placeNew(s: WindowsState, p: OpenPayload): Rect {
  const base = defaultRect(p.size, s.viewport, s.seq);
  if (p.anchor === "right") {
    const wa = workArea(s.viewport);
    return clampRect({ ...base, x: wa.w - base.w - 36, y: 28 + (s.seq % 4) * 24 }, s.viewport);
  }
  return base;
}

const windowsSlice = createSlice({
  name: "windows",
  initialState: initialWindows,
  reducers: {
    open(s, a: PayloadAction<OpenPayload>) {
      const p = a.payload;
      const existing = s.byId[p.id];
      if (existing) {
        existing.minimized = false;
        existing.props = { ...existing.props, ...p.props };
        existing.focusNonce += 1;
        bringToFront(s, p.id);
        s.announce = `${existing.title} is in front`;
        return;
      }
      const rect = placeNew(s, p);
      s.seq += 1;
      s.zCounter += 1;
      s.byId[p.id] = { id: p.id, title: p.title, rect, restore: null, mode: "normal", minimized: false, z: s.zCounter, focusNonce: 1, props: p.props ?? {} };
      s.order.push(p.id);
      s.focusedId = p.id;
      s.announce = `Opened ${p.title}`;
    },
    close(s, a: PayloadAction<string>) {
      const w = s.byId[a.payload];
      if (!w) return;
      delete s.byId[a.payload];
      s.order = s.order.filter((id) => id !== a.payload);
      if (s.focusedId === a.payload) s.focusedId = frontmost(s);
      if (s.focusedId) s.byId[s.focusedId].focusNonce += 1;
      s.announce = `Closed ${w.title}`;
    },
    /** A click inside a window: bring it forward without taking keyboard focus from what was clicked. */
    focus(s, a: PayloadAction<string>) {
      const w = s.byId[a.payload];
      if (!w) return;
      w.minimized = false;
      bringToFront(s, a.payload);
    },
    /** A taskbar button: show it, or hide it if it is already in front. */
    activate(s, a: PayloadAction<string>) {
      const w = s.byId[a.payload];
      if (!w) return;
      if (!w.minimized && s.focusedId === a.payload) {
        w.minimized = true;
        s.focusedId = frontmost(s, a.payload);
        if (s.focusedId) s.byId[s.focusedId].focusNonce += 1;
        s.announce = `${w.title} minimised`;
        return;
      }
      w.minimized = false;
      w.focusNonce += 1;
      bringToFront(s, a.payload);
      s.announce = `${w.title} is in front`;
    },
    minimize(s, a: PayloadAction<string>) {
      const w = s.byId[a.payload];
      if (!w) return;
      w.minimized = true;
      if (s.focusedId === a.payload) {
        s.focusedId = frontmost(s, a.payload);
        if (s.focusedId) s.byId[s.focusedId].focusNonce += 1;
      }
      s.announce = `${w.title} minimised`;
    },
    toggleMax(s, a: PayloadAction<string>) {
      const w = s.byId[a.payload];
      if (!w) return;
      if (w.mode === "normal") {
        w.restore = w.rect;
        w.mode = "max";
        w.rect = snapRect("max", s.viewport);
        s.announce = `${w.title} maximised`;
      } else {
        w.rect = clampRect(w.restore ?? w.rect, s.viewport);
        w.mode = "normal";
        w.restore = null;
        s.announce = `${w.title} restored`;
      }
      bringToFront(s, a.payload);
    },
    snap(s, a: PayloadAction<{ id: string; side: SnapSide }>) {
      const w = s.byId[a.payload.id];
      if (!w) return;
      if (w.mode === "normal") w.restore = w.rect;
      w.mode = a.payload.side;
      w.rect = snapRect(a.payload.side, s.viewport);
      bringToFront(s, a.payload.id);
    },
    /** A window dragged or resized by hand: take the new rectangle as it is. */
    setRect(s, a: PayloadAction<{ id: string; rect: Rect }>) {
      const w = s.byId[a.payload.id];
      if (!w) return;
      w.rect = clampRect(a.payload.rect, s.viewport);
      w.mode = "normal";
      w.restore = null;
    },
    nudge(s, a: PayloadAction<{ id: string; dx: number; dy: number }>) {
      const w = s.byId[a.payload.id];
      if (!w) return;
      if (w.mode !== "normal") return;
      w.rect = moveRect(w.rect, a.payload.dx, a.payload.dy, s.viewport);
    },
    setViewport(s, a: PayloadAction<Size>) {
      s.viewport = a.payload;
      for (const w of Object.values(s.byId)) {
        if (w.mode === "normal") w.rect = clampRect(w.rect, a.payload);
        else w.rect = snapRect(w.mode, a.payload);
      }
    },
    /** "Show desktop": hide everything, or bring everything back if it is already hidden. */
    toggleDesktop(s) {
      const all = Object.values(s.byId);
      if (all.length === 0) return;
      const anyVisible = all.some((w) => !w.minimized);
      for (const w of all) w.minimized = anyVisible;
      if (anyVisible) {
        s.focusedId = null;
        s.announce = "Desktop shown";
      } else {
        s.focusedId = frontmost(s);
        s.announce = "Windows restored";
      }
    },
    closeAll(s) {
      s.byId = {};
      s.order = [];
      s.focusedId = null;
      s.announce = "All windows closed";
    },
  },
});

export const windowsActions = windowsSlice.actions;
export default windowsSlice.reducer;
