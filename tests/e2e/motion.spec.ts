import { expect, test } from "@playwright/test";
import { boxOf, drag, gotoDesktop, icon, openIcon, watchConsole, win } from "./helpers";

// The other tests run with reduced motion, so nothing is moving when they
// measure. These run with motion on: a window that animates away must still
// end up gone, hidden or back, and nothing may be left half way.
test.use({ reducedMotion: "no-preference" });

test.describe("with animations on", () => {
  test("the desktop arrives: every icon and the profile card end fully shown", async ({ page }) => {
    const problems = watchConsole(page);
    await gotoDesktop(page);
    await expect.poll(async () => page.locator(".dicon").evaluateAll((els) => els.every((e) => getComputedStyle(e).opacity === "1"))).toBe(true);
    await expect.poll(async () => page.locator(".profile-card").evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
    await expect(icon(page, "Inbound")).toBeVisible();
    expect(problems).toEqual([]);
  });

  test("a closed window plays out and is then removed", async ({ page }) => {
    await gotoDesktop(page);
    const w = await openIcon(page, "About");
    await w.getByRole("button", { name: "Close About" }).click();
    await expect(w).toHaveCount(0);
    // Its opener gets the keyboard back, as without motion.
    await expect(icon(page, "About")).toBeFocused();
  });

  test("closing twice in a hurry closes once", async ({ page }) => {
    await gotoDesktop(page);
    const w = await openIcon(page, "About");
    const close = w.getByRole("button", { name: "Close About" });
    await close.dispatchEvent("click");
    await close.dispatchEvent("click");
    await expect(w).toHaveCount(0);
    await expect(win(page, "Ask Uzair")).toBeVisible();
  });

  test("minimise shrinks a window away and its taskbar button brings it back to the same place", async ({ page }) => {
    await gotoDesktop(page);
    const w = await openIcon(page, "Contact");
    await expect.poll(async () => w.evaluate((e) => e.getAnimations().length)).toBe(0);
    const before = await boxOf(w);
    await w.getByRole("button", { name: "Minimise Contact" }).click();
    await expect(w).toBeHidden();
    const task = page.getByRole("navigation", { name: "Taskbar" }).getByRole("button", { name: /^Contact/ });
    await expect(task).toHaveAccessibleName("Contact, minimised");
    await task.click();
    await expect(w).toBeVisible();
    await expect.poll(async () => w.evaluate((e) => e.getAnimations().length)).toBe(0);
    const after = await boxOf(w);
    expect(Math.round(after.x)).toBe(Math.round(before.x));
    expect(Math.round(after.y)).toBe(Math.round(before.y));
    expect(Math.round(after.width)).toBe(Math.round(before.width));
    // The button of the window in front puts it away again.
    await task.click();
    await expect(w).toBeHidden();
  });

  test("show desktop hides every window and brings them all back", async ({ page }) => {
    await gotoDesktop(page);
    const about = await openIcon(page, "About");
    const ask = win(page, "Ask Uzair");
    const show = page.getByRole("button", { name: "Show desktop" });
    await show.click();
    await expect(about).toBeHidden();
    await expect(ask).toBeHidden();
    await show.click();
    await expect(about).toBeVisible();
    await expect(ask).toBeVisible();
  });

  test("maximise glides to the full work area and back", async ({ page }) => {
    await gotoDesktop(page);
    const w = await openIcon(page, "About");
    await expect.poll(async () => w.evaluate((e) => e.getAnimations().length)).toBe(0);
    const before = await boxOf(w);
    await w.getByRole("button", { name: "Maximise About" }).click();
    await expect.poll(async () => Math.round((await boxOf(w)).width)).toBe(1440);
    expect(Math.round((await boxOf(w)).height)).toBe(900 - 48);
    await w.getByRole("button", { name: "Restore About" }).click();
    await expect.poll(async () => Math.round((await boxOf(w)).width)).toBe(Math.round(before.width));
    await expect.poll(async () => Math.round((await boxOf(w)).x)).toBe(Math.round(before.x));
  });

  test("a dragged window follows the pointer without lag", async ({ page }) => {
    await gotoDesktop(page);
    const w = await openIcon(page, "About");
    await expect.poll(async () => w.evaluate((e) => e.getAnimations().length)).toBe(0);
    const before = await boxOf(w);
    const title = await boxOf(w.locator(".win-title"));
    await page.mouse.move(title.x + 200, title.y + 18);
    await page.mouse.down();
    await page.mouse.move(title.x + 160, title.y + 58, { steps: 4 });
    await page.mouse.move(title.x + 120, title.y + 98, { steps: 4 });
    // Measured while the button is still down: the window is already where the pointer took it.
    expect(Math.round((await boxOf(w)).x - before.x)).toBe(-80);
    expect(Math.round((await boxOf(w)).y - before.y)).toBe(80);
    await page.mouse.up();
    expect(Math.round((await boxOf(w)).x - before.x)).toBe(-80);
  });

  test("resizing from the left edge over the featured pictures is not cut short", async ({ page }) => {
    await gotoDesktop(page);
    const w = await openIcon(page, "Contact");
    await expect.poll(async () => w.evaluate((e) => e.getAnimations().length)).toBe(0);
    const b = await boxOf(w);
    await drag(page, { x: b.x + 2, y: b.y + b.height / 2 }, { x: b.x + 2000, y: b.y + b.height / 2 });
    await expect.poll(async () => Math.round((await boxOf(w)).width)).toBe(320);
  });

  test("the Start menu plays out and is then removed", async ({ page }) => {
    await gotoDesktop(page);
    const start = page.getByRole("button", { name: "Start" });
    await start.click();
    const menu = page.getByRole("dialog", { name: "Start menu" });
    await expect(menu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await start.click();
    await expect(menu).toBeVisible();
    await menu.getByRole("button", { name: "About", exact: true }).click();
    await expect(win(page, "About")).toBeVisible();
    await expect(menu).toHaveCount(0);
  });

  test("the theme changes through the reveal and stays changed", async ({ page }) => {
    const problems = watchConsole(page);
    await gotoDesktop(page);
    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();
    // The marker that styles the reveal is gone once it has played.
    await expect(page.locator("html")).not.toHaveAttribute("data-theme-switch", "1");
    await page.getByRole("button", { name: "Switch to light theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    expect(problems).toEqual([]);
  });

  test("turning on Reduce animations in Settings stops the wallpaper", async ({ page }) => {
    await gotoDesktop(page);
    const running = () => page.locator(".bloom-a").evaluate((e) => getComputedStyle(e).animationName);
    expect(await running()).toBe("drift-a");
    await page.getByRole("button", { name: "Start" }).click();
    await page.getByLabel("Search apps and projects, or ask a question").fill("settings");
    await page.getByRole("dialog", { name: "Start menu" }).getByRole("button", { name: /^Settings/ }).first().click();
    await win(page, "Settings").getByLabel("Reduce animations").check();
    await expect.poll(running).toBe("none");
  });
});
