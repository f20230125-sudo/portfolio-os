import { describe, expect, it } from "vitest";
import { snapRect, TASKBAR_H } from "@/os/geometry";
import reducer, { frontmost, initialWindows, windowsActions as w, type OpenPayload, type WindowsState } from "./windowsSlice";

const open = (id: string, extra: Partial<OpenPayload> = {}): OpenPayload => ({ id, title: id.toUpperCase(), size: { w: 600, h: 400 }, ...extra });
const run = (state: WindowsState, ...actions: Parameters<typeof reducer>[1][]) => actions.reduce(reducer, state);
const start = (): WindowsState => reducer(initialWindows, w.setViewport({ w: 1280, h: 800 }));

describe("opening", () => {
  it("opens a window in front and focused", () => {
    const s = run(start(), w.open(open("a")));
    expect(s.order).toEqual(["a"]);
    expect(s.focusedId).toBe("a");
    expect(s.byId.a.z).toBeGreaterThan(0);
    expect(s.announce).toBe("Opened A");
  });

  it("opening a window that is already open brings it forward, restores it and does not duplicate it", () => {
    let s = run(start(), w.open(open("a")), w.open(open("b")), w.minimize("a"));
    expect(s.byId.a.minimized).toBe(true);
    s = run(s, w.open(open("a")));
    expect(s.order).toEqual(["a", "b"]);
    expect(s.byId.a.minimized).toBe(false);
    expect(s.focusedId).toBe("a");
    expect(s.byId.a.z).toBeGreaterThan(s.byId.b.z);
  });

  it("asks an open window to take focus again, and carries new props", () => {
    let s = run(start(), w.open(open("p", { props: { tab: "overview", nonce: 1 } })));
    const before = s.byId.p.focusNonce;
    s = run(s, w.open(open("p", { props: { tab: "live", nonce: 2 } })));
    expect(s.byId.p.focusNonce).toBe(before + 1);
    expect(s.byId.p.props).toEqual({ tab: "live", nonce: 2 });
  });

  it("does not stack new windows exactly on one another", () => {
    const s = run(start(), w.open(open("a")), w.open(open("b")));
    expect(s.byId.a.rect).not.toEqual(s.byId.b.rect);
  });

  it("opens an anchored window on the right-hand side", () => {
    const s = run(start(), w.open(open("ask", { anchor: "right" })));
    expect(s.byId.ask.rect.x + s.byId.ask.rect.w).toBeGreaterThan(1280 - 80);
  });
});

describe("stacking and focus", () => {
  it("a click raises a window above the others", () => {
    const s = run(start(), w.open(open("a")), w.open(open("b")), w.focus("a"));
    expect(s.focusedId).toBe("a");
    expect(s.byId.a.z).toBeGreaterThan(s.byId.b.z);
  });

  it("clicking the window already in front changes nothing", () => {
    const a = run(start(), w.open(open("a")));
    expect(run(a, w.focus("a")).byId.a.z).toBe(a.byId.a.z);
  });

  it("closing the front window hands focus to the next one forward", () => {
    const s = run(start(), w.open(open("a")), w.open(open("b")), w.open(open("c")), w.focus("a"), w.close("a"));
    expect(s.focusedId).toBe("c");
    expect(s.order).toEqual(["b", "c"]);
    expect(s.byId.a).toBeUndefined();
  });

  it("closing the last window leaves nothing focused", () => {
    const s = run(start(), w.open(open("a")), w.close("a"));
    expect(s.focusedId).toBeNull();
    expect(s.order).toEqual([]);
  });

  it("closing a window behind the front one leaves focus where it was", () => {
    const s = run(start(), w.open(open("a")), w.open(open("b")), w.close("a"));
    expect(s.focusedId).toBe("b");
  });

  it("ignores messages about windows that are not there", () => {
    const s = start();
    expect(run(s, w.close("zzz"), w.focus("zzz"), w.minimize("zzz"), w.toggleMax("zzz"), w.activate("zzz"))).toEqual(s);
  });
});

describe("the taskbar button", () => {
  it("hides the window in front, and shows it again on the next press", () => {
    let s = run(start(), w.open(open("a")), w.open(open("b")));
    s = run(s, w.activate("b"));
    expect(s.byId.b.minimized).toBe(true);
    expect(s.focusedId).toBe("a");
    s = run(s, w.activate("b"));
    expect(s.byId.b.minimized).toBe(false);
    expect(s.focusedId).toBe("b");
  });

  it("brings a window that is behind others to the front instead of hiding it", () => {
    let s = run(start(), w.open(open("a")), w.open(open("b")));
    s = run(s, w.activate("a"));
    expect(s.byId.a.minimized).toBe(false);
    expect(s.focusedId).toBe("a");
  });

  it("frontmost skips hidden windows", () => {
    const s = run(start(), w.open(open("a")), w.open(open("b")), w.minimize("b"));
    expect(frontmost(s)).toBe("a");
    expect(frontmost(s, "a")).toBeNull();
  });
});

describe("maximise and snap", () => {
  it("maximises to the work area and restores to exactly where it was", () => {
    let s = run(start(), w.open(open("a")));
    const before = s.byId.a.rect;
    s = run(s, w.toggleMax("a"));
    expect(s.byId.a.mode).toBe("max");
    expect(s.byId.a.rect).toEqual({ x: 0, y: 0, w: 1280, h: 800 - TASKBAR_H });
    s = run(s, w.toggleMax("a"));
    expect(s.byId.a.mode).toBe("normal");
    expect(s.byId.a.rect).toEqual(before);
  });

  it("snaps left and right, and keeps the original size to return to", () => {
    let s = run(start(), w.open(open("a")));
    const before = s.byId.a.rect;
    s = run(s, w.snap({ id: "a", side: "left" }));
    expect(s.byId.a.rect).toEqual(snapRect("left", s.viewport));
    s = run(s, w.snap({ id: "a", side: "right" }));
    expect(s.byId.a.rect).toEqual(snapRect("right", s.viewport));
    s = run(s, w.toggleMax("a"));
    expect(s.byId.a.rect).toEqual(before);
  });

  it("dragging a window by hand ends any snap", () => {
    let s = run(start(), w.open(open("a")), w.snap({ id: "a", side: "left" }));
    s = run(s, w.setRect({ id: "a", rect: { x: 100, y: 100, w: 500, h: 300 } }));
    expect(s.byId.a.mode).toBe("normal");
    expect(s.byId.a.restore).toBeNull();
  });

  it("will not park a window where its title bar cannot be reached", () => {
    const s = run(start(), w.open(open("a")), w.setRect({ id: "a", rect: { x: 100, y: 5000, w: 500, h: 300 } }));
    expect(s.byId.a.rect.y).toBeLessThan(800 - TASKBAR_H);
  });

  it("nudging a snapped window does nothing", () => {
    const s = run(start(), w.open(open("a")), w.snap({ id: "a", side: "left" }));
    expect(run(s, w.nudge({ id: "a", dx: 20, dy: 20 })).byId.a.rect).toEqual(s.byId.a.rect);
  });
});

describe("when the screen changes size", () => {
  it("keeps free windows reachable on a smaller screen", () => {
    let s = run(start(), w.open(open("a")), w.setRect({ id: "a", rect: { x: 900, y: 500, w: 600, h: 400 } }));
    s = run(s, w.setViewport({ w: 800, h: 600 }));
    const r = s.byId.a.rect;
    expect(r.x).toBeLessThan(800);
    expect(r.y).toBeLessThan(600 - TASKBAR_H);
    expect(r.w).toBeLessThanOrEqual(800);
  });

  it("re-fits maximised and snapped windows to the new screen", () => {
    let s = run(start(), w.open(open("a")), w.open(open("b")), w.toggleMax("a"), w.snap({ id: "b", side: "right" }));
    s = run(s, w.setViewport({ w: 1000, h: 700 }));
    expect(s.byId.a.rect).toEqual(snapRect("max", s.viewport));
    expect(s.byId.b.rect).toEqual(snapRect("right", s.viewport));
  });
});

describe("show desktop", () => {
  it("hides every window, then brings them all back", () => {
    let s = run(start(), w.open(open("a")), w.open(open("b")), w.toggleDesktop());
    expect(Object.values(s.byId).every((x) => x.minimized)).toBe(true);
    expect(s.focusedId).toBeNull();
    s = run(s, w.toggleDesktop());
    expect(Object.values(s.byId).every((x) => !x.minimized)).toBe(true);
    expect(s.focusedId).toBe("b");
  });

  it("does nothing with nothing open", () => {
    const s = start();
    expect(run(s, w.toggleDesktop())).toEqual(s);
  });
});

describe("close all", () => {
  it("empties the screen", () => {
    const s = run(start(), w.open(open("a")), w.open(open("b")), w.closeAll());
    expect(s.order).toEqual([]);
    expect(s.byId).toEqual({});
    expect(s.focusedId).toBeNull();
  });
});
