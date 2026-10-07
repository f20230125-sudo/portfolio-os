import { describe, expect, it } from "vitest";
import { clampRect, defaultRect, GRAB_W, MIN_H, MIN_W, moveRect, resizeRect, restoreUnderPointer, snapRect, snapZone, TASKBAR_H, TITLE_H, workArea } from "./geometry";

const vp = { w: 1280, h: 800 };
const wa = workArea(vp);

describe("workArea", () => {
  it("leaves the taskbar out", () => {
    expect(wa).toEqual({ x: 0, y: 0, w: 1280, h: 800 - TASKBAR_H });
  });
});

describe("clampRect", () => {
  it("never lets the title bar leave the top or the taskbar", () => {
    expect(clampRect({ x: 100, y: -50, w: 600, h: 400 }, vp).y).toBe(0);
    expect(clampRect({ x: 100, y: 5000, w: 600, h: 400 }, vp).y).toBe(wa.h - TITLE_H);
  });
  it("keeps a grabbable part of the title bar on screen sideways", () => {
    expect(clampRect({ x: -5000, y: 10, w: 600, h: 400 }, vp).x).toBe(GRAB_W - 600);
    expect(clampRect({ x: 5000, y: 10, w: 600, h: 400 }, vp).x).toBe(1280 - GRAB_W);
  });
  it("shrinks a window that is bigger than the screen and grows one that is too small", () => {
    const big = clampRect({ x: 0, y: 0, w: 9999, h: 9999 }, vp);
    expect([big.w, big.h]).toEqual([wa.w, wa.h]);
    const small = clampRect({ x: 0, y: 0, w: 10, h: 10 }, vp);
    expect([small.w, small.h]).toEqual([MIN_W, MIN_H]);
  });
  it("survives a screen smaller than the minimum size", () => {
    const r = clampRect({ x: 0, y: 0, w: 600, h: 600 }, { w: 200, h: 200 });
    expect(r.w).toBeLessThanOrEqual(200);
    expect(r.h).toBeLessThanOrEqual(200 - TASKBAR_H);
    expect(Number.isFinite(r.x + r.y)).toBe(true);
  });
});

describe("resizeRect", () => {
  const start = { x: 200, y: 100, w: 600, h: 400 };
  it("pins the opposite edge when pulling the west handle", () => {
    const r = resizeRect(start, "w", -50, 0, vp);
    expect(r).toEqual({ x: 150, y: 100, w: 650, h: 400 });
    expect(r.x + r.w).toBe(800);
  });
  it("pins the bottom-right corner when pulling the north-west handle", () => {
    const r = resizeRect(start, "nw", 40, 30, vp);
    expect(r.x + r.w).toBe(800);
    expect(r.y + r.h).toBe(500);
    expect(r).toEqual({ x: 240, y: 130, w: 560, h: 370 });
  });
  it("stops at the minimum size without moving the pinned edge", () => {
    const r = resizeRect(start, "w", 5000, 0, vp);
    expect(r.w).toBe(MIN_W);
    expect(r.x + r.w).toBe(800);
    const b = resizeRect(start, "n", 0, 5000, vp);
    expect(b.h).toBe(MIN_H);
    expect(b.y + b.h).toBe(500);
  });
  it("cannot grow past the work area", () => {
    const r = resizeRect(start, "se", 9999, 9999, vp);
    expect(r.x + r.w).toBe(vp.w);
    expect(r.y + r.h).toBe(wa.h);
    const l = resizeRect(start, "nw", -9999, -9999, vp);
    expect(l.x).toBe(0);
    expect(l.y).toBe(0);
  });
  it("respects a larger minimum size", () => {
    expect(resizeRect(start, "e", -9999, 0, vp, { w: 480, h: 300 }).w).toBe(480);
  });
});

describe("snap", () => {
  it("snaps to the sides and the top, and nowhere else", () => {
    expect(snapZone({ x: 0, y: 300 }, vp)).toBe("left");
    expect(snapZone({ x: 1279, y: 300 }, vp)).toBe("right");
    expect(snapZone({ x: 600, y: 0 }, vp)).toBe("max");
    expect(snapZone({ x: 600, y: 300 }, vp)).toBeNull();
  });
  it("the top edge wins over a corner", () => {
    expect(snapZone({ x: 0, y: 0 }, vp)).toBe("max");
  });
  it("halves fill the work area exactly, with no gap or overlap", () => {
    const l = snapRect("left", vp);
    const r = snapRect("right", vp);
    expect(l.x + l.w).toBe(r.x);
    expect(r.x + r.w).toBe(vp.w);
    expect(l.h).toBe(wa.h);
    expect(snapRect("max", vp)).toEqual(wa);
  });
  it("splits an odd width without losing a pixel", () => {
    const odd = { w: 1281, h: 800 };
    const l = snapRect("left", odd);
    const r = snapRect("right", odd);
    expect(l.w + r.w).toBe(1281);
  });
});

describe("defaultRect", () => {
  it("opens the first window in the middle and stays on screen", () => {
    const r = defaultRect({ w: 800, h: 560 }, vp, 2);
    expect(r.w).toBe(800);
    expect(Math.abs(r.x + r.w / 2 - vp.w / 2)).toBeLessThan(2);
    expect(r.y).toBeGreaterThanOrEqual(0);
  });
  it("steps later windows so they do not sit exactly on one another", () => {
    const a = defaultRect({ w: 700, h: 500 }, vp, 0);
    const b = defaultRect({ w: 700, h: 500 }, vp, 1);
    expect(b.x).not.toBe(a.x);
    expect(b.y).not.toBe(a.y);
  });
  it("shrinks a window asked for at more than the screen", () => {
    const r = defaultRect({ w: 5000, h: 5000 }, { w: 800, h: 600 }, 0);
    expect(r.w).toBeLessThanOrEqual(800);
    expect(r.h).toBeLessThanOrEqual(600 - TASKBAR_H);
  });
});

describe("restoreUnderPointer", () => {
  it("keeps the pointer at the same fraction along the title bar", () => {
    const restore = { x: 200, y: 100, w: 600, h: 400 };
    const frame = snapRect("max", vp);
    const r = restoreUnderPointer(restore, frame, { x: 640, y: 10 }, vp);
    expect(r.w).toBe(600);
    expect(640 - r.x).toBeCloseTo(300, 0);
  });
  it("puts a window grabbed at the left edge back with its left edge under the pointer", () => {
    const r = restoreUnderPointer({ x: 200, y: 100, w: 600, h: 400 }, snapRect("max", vp), { x: 0, y: 5 }, vp);
    expect(r.x).toBeLessThanOrEqual(0);
  });
});

describe("moveRect", () => {
  it("moves by the delta and stays reachable", () => {
    expect(moveRect({ x: 100, y: 100, w: 500, h: 300 }, 20, -10, vp)).toEqual({ x: 120, y: 90, w: 500, h: 300 });
    expect(moveRect({ x: 100, y: 10, w: 500, h: 300 }, 0, -500, vp).y).toBe(0);
  });
});
