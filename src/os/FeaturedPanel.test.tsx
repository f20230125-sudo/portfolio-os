// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, expect, it } from "vitest";
import { featured } from "@/knowledge/projects";
import { makeStore } from "@/store/store";
import { FeaturedPanel } from "./FeaturedPanel";

afterEach(cleanup);

it("renders curated evidence and opens projects through the OS", () => {
  const store = makeStore();
  render(<Provider store={store}><FeaturedPanel /></Provider>);
  const panel = within(screen.getByRole("region", { name: "Featured work" }));
  const rows = panel.getAllByRole("listitem");
  expect(rows).toHaveLength(featured.length);
  featured.forEach((p, i) => {
    const row = within(rows[i]);
    expect(row.getByRole("heading").textContent).toBe(p.name);
    expect(row.getByText(p.tagline)).toBeTruthy();
    const image = row.getByRole("img", { name: p.shots[0].alt });
    expect(image.getAttribute("loading")).toBe(i === 0 ? "eager" : "lazy");
    expect(image.getAttribute("width")).toBe("192");
    expect(image.getAttribute("height")).toBe("120");
    expect(row.getByRole("link", { name: "Live site" }).getAttribute("href")).toBe(p.live?.url);
    expect(row.getByRole("link", { name: "Code" }).getAttribute("href")).toBe(p.code);
    fireEvent.click(row.getByRole("button", { name: "Open" }));
    expect(store.getState().windows.focusedId).toBe(`project:${p.id}`);
  });
  fireEvent.click(panel.getByRole("button", { name: "All projects" }));
  expect(store.getState().windows.focusedId).toBe("projects");
});
