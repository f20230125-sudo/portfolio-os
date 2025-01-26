import { expect, type Locator, type Page } from "@playwright/test";

/** Collects anything the page logs as an error, so a test can say there was none. */
export function watchConsole(page: Page): string[] {
  const problems: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") problems.push(m.text());
  });
  page.on("pageerror", (e) => problems.push(String(e)));
  return problems;
}

export async function gotoDesktop(page: Page, query = ""): Promise<void> {
  await page.goto(`/${query}`);
  await expect(page.getByRole("listbox", { name: "Desktop" })).toBeVisible();
}

export const icon = (page: Page, name: string): Locator => page.getByRole("option", { name: new RegExp(`^${name}(,| |$)`) });
export const win = (page: Page, name: string): Locator => page.getByRole("dialog", { name, exact: true });

export async function openIcon(page: Page, name: string): Promise<Locator> {
  await icon(page, name).dblclick();
  const w = win(page, name);
  await expect(w).toBeVisible();
  return w;
}

/** Where a window is, from the element itself. */
export async function boxOf(locator: Locator): Promise<{ x: number; y: number; width: number; height: number }> {
  const b = await locator.boundingBox();
  if (!b) throw new Error("not on screen");
  return b;
}

/** Drags from one point to another in a few steps, as a hand would. */
export async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }): Promise<void> {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, { steps: 4 });
  await page.mouse.move(to.x, to.y, { steps: 6 });
  await page.mouse.up();
}

export const DESKTOP_ICONS = ["Agent Desk", "Flowboard", "Sayso", "Hindsight", "Projects", "Ask Uzair", "About", "Resume", "Research", "Contact"] as const;
