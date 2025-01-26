import { expect, test } from "@playwright/test";
import { gotoDesktop, watchConsole } from "./helpers";

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test.describe("on a phone", () => {
  test("starts at the desktop with every icon in a grid, and no window in the way", async ({ page }) => {
    const errors = watchConsole(page);
    await gotoDesktop(page);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const n = await page.getByRole("option").count();
    expect(n).toBe(10);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
    expect(errors).toEqual([]);
  });

  test("one tap opens a window that fills the screen above the taskbar", async ({ page }) => {
    await gotoDesktop(page);
    await page.getByRole("option", { name: /^Sayso/ }).tap();
    const w = page.getByRole("dialog", { name: "Sayso", exact: true });
    await expect(w).toBeVisible();
    const b = (await w.boundingBox())!;
    expect(Math.round(b.x)).toBe(0);
    expect(Math.round(b.width)).toBe(390);
    expect(Math.round(b.height)).toBe(844 - 48);
    await expect(w.getByRole("button", { name: /Minimise|Maximise/ })).toHaveCount(0);
  });

  test("only the window in front is shown, and closing it shows the one behind", async ({ page }) => {
    await gotoDesktop(page);
    await page.getByRole("option", { name: /^About/ }).tap();
    await page.getByRole("option", { name: /^About/ }).waitFor({ state: "attached" });
    await page.getByRole("button", { name: "Resume" }).tap();
    await expect(page.getByRole("dialog", { name: "Resume", exact: true })).toBeVisible();
    await expect(page.getByRole("dialog", { name: "About", exact: true })).toBeHidden();
    await page.getByRole("button", { name: "Close Resume" }).tap();
    await expect(page.getByRole("dialog", { name: "About", exact: true })).toBeVisible();
  });

  test("the taskbar fits, with Start, the pinned apps and the clock", async ({ page }) => {
    await gotoDesktop(page);
    const bar = (await page.getByRole("navigation", { name: "Taskbar" }).boundingBox())!;
    expect(Math.round(bar.width)).toBe(390);
    await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
    await expect(page.getByRole("timer")).toBeVisible();
  });

  test("the assistant is usable with the on-screen keyboard's Enter", async ({ page }) => {
    await gotoDesktop(page);
    await page.getByRole("button", { name: "Ask Uzair" }).tap();
    await page.getByLabel("Ask a question about Uzair").fill("What projects has he built?");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("log").getByText("flagship projects")).toBeVisible();
  });

  test("Start fits the screen", async ({ page }) => {
    await gotoDesktop(page);
    await page.getByRole("button", { name: "Start" }).tap();
    const start = (await page.getByRole("dialog", { name: "Start menu" }).boundingBox())!;
    expect(start.x).toBeGreaterThanOrEqual(0);
    expect(start.x + start.width).toBeLessThanOrEqual(390);
  });

  test("the simple view does not scroll sideways", async ({ page }) => {
    await page.goto("/simple");
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  });
});
