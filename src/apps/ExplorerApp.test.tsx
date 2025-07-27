// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it } from "vitest";
import { makeStore } from "@/store/store";
import { windowsActions } from "@/store/windowsSlice";
import ExplorerApp from "./ExplorerApp";

afterEach(cleanup);

function setup(width = 1440, initialFilter?: "data") {
  const store = makeStore();
  store.dispatch(windowsActions.setViewport({ w: width, h: 844 }));
  render(<Provider store={store}><ExplorerApp initialFilter={initialFilter} /></Provider>);
  const rows = within(screen.getByRole("list", { name: "Projects" }));
  return { store, rows };
}

describe("opening a project from Explorer", () => {
  it("selects on desktop click and opens the selected project with the visible action", () => {
    const { store, rows } = setup();
    fireEvent.click(rows.getByRole("button", { name: /^Backroom/ }));
    expect(store.getState().windows.order).toEqual([]);
    // This action lives outside the details aside, which is hidden on narrower screens.
    fireEvent.click(screen.getByRole("button", { name: "Open Backroom" }));
    expect(store.getState().windows.order).toEqual(["project:backroom"]);
  });

  it.each(["double-click", "Enter"])("opens on desktop %s", (action) => {
    const { store, rows } = setup();
    const row = rows.getByRole("button", { name: /^Backroom/ });
    if (action === "Enter") fireEvent.keyDown(row, { key: "Enter" });
    else fireEvent.doubleClick(row);
    expect(store.getState().windows.order).toEqual(["project:backroom"]);
  });

  it.each([undefined, "data"] as const)("opens a project with one phone click in %s", (filter) => {
    const { store, rows } = setup(390, filter);
    const project = filter ? "Rx Market Pulse" : "Backroom";
    fireEvent.click(rows.getByRole("button", { name: new RegExp(`^${project}`) }));
    expect(store.getState().windows.order).toEqual([filter ? "project:rx-market-pulse" : "project:backroom"]);
  });

  it("opens on a touch pointer even at a desktop width", () => {
    const { store, rows } = setup();
    const event = new MouseEvent("click", { bubbles: true });
    Object.defineProperty(event, "pointerType", { value: "touch" });
    fireEvent(rows.getByRole("button", { name: /^Backroom/ }), event);
    expect(store.getState().windows.order).toEqual(["project:backroom"]);
  });
});
