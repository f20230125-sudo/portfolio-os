import { expect, test, type Page } from "@playwright/test";
import { gotoDesktop, icon, win } from "./helpers";

test.use({ reducedMotion: "reduce" });

async function closeWithKeyboard(page: Page, name: string) {
  await win(page, name).getByRole("button", { name: `Close ${name}`, exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(win(page, name)).toHaveCount(0);
}

test("Tab raises a back window; closing restores its desktop opener", async ({ page }) => {
  await gotoDesktop(page);
  await icon(page, "Inbound").focus();
  await page.keyboard.press("Enter");
  const inbound = win(page, "Inbound");
  await expect(inbound).toHaveAttribute("data-focused", "true");
  await icon(page, "Backroom").focus();
  await page.keyboard.press("Enter");
  await expect(win(page, "Backroom")).toHaveAttribute("data-focused", "true");
  // The desktop icons precede the windows in DOM order. Tab from the last
  // desktop control enters the first open window (the initial assistant).
  // Continue to Inbound using real Tab presses, without focusing its controls.
  await icon(page, "Contact").focus();
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press("Tab");
    if (await inbound.evaluate((el) => el.contains(document.activeElement))) break;
  }
  await expect(inbound).toHaveAttribute("data-focused", "true");
  await expect(win(page, "Backroom")).toHaveAttribute("data-focused", "false");
  await closeWithKeyboard(page, "Inbound");
  await expect(icon(page, "Inbound")).toBeFocused();
  await expect(page.locator("body")).not.toBeFocused();
});

test("closing restores a featured Open button or a pinned taskbar button", async ({ page }) => {
  await gotoDesktop(page);
  const open = page.locator('[data-featured="inbound"]').getByRole("button", { name: "Open", exact: true });
  await open.focus();
  await page.keyboard.press("Enter");
  await expect(win(page, "Inbound")).toBeVisible();
  await closeWithKeyboard(page, "Inbound");
  await expect(open).toBeFocused();
  const task = page.locator('[data-task="projects"]');
  await task.focus();
  await page.keyboard.press("Enter");
  await expect(win(page, "Projects")).toBeVisible();
  await win(page, "Projects").getByRole("button", { name: "Minimise Projects", exact: true }).focus();
  await page.keyboard.press("Enter");
  await task.focus();
  await page.keyboard.press("Enter");
  await expect(win(page, "Projects")).toHaveAttribute("data-min", "false");
  await closeWithKeyboard(page, "Projects");
  await expect(task).toBeFocused();
});

test("a vanished Start opener falls back to the next window, then the selected icon", async ({ page }) => {
  await gotoDesktop(page, "?open=about");
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.getByRole("dialog", { name: "Start menu" }).getByRole("button", { name: "Research", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(win(page, "Research")).toBeVisible();
  await closeWithKeyboard(page, "Research");
  await expect(win(page, "About")).toBeFocused();
  await closeWithKeyboard(page, "About");
  await expect(page.locator('[data-icon][tabindex="0"]')).toBeFocused();
});

for (const name of ["Inbound", "Agent Desk"]) {
  test(`${name} tabs wrap with arrows and support Home/End and roving tabindex`, async ({ page }) => {
    await gotoDesktop(page);
    await icon(page, name).focus();
    await page.keyboard.press("Enter");
    const w = win(page, name);
    const tabs = w.getByRole("tab");
    const count = await tabs.count();
    const check = async (index: number) => {
      await expect(tabs.nth(index)).toBeFocused();
      await expect(tabs.nth(index)).toHaveAttribute("aria-selected", "true");
      await expect(w.locator('[role="tab"][tabindex="0"]')).toHaveCount(1);
      for (let i = 0; i < count; i++) await expect(tabs.nth(i)).toHaveAttribute("tabindex", i === index ? "0" : "-1");
      const panel = w.getByRole("tabpanel");
      await expect(panel).toHaveCount(1);
      await expect(panel).toHaveAttribute("id", await tabs.nth(index).getAttribute("aria-controls") as string);
      await expect(panel).toHaveAttribute("aria-labelledby", await tabs.nth(index).getAttribute("id") as string);
    };
    await tabs.first().focus();
    await check(0);
    await page.keyboard.press("ArrowLeft");
    await check(count - 1);
    await page.keyboard.press("ArrowRight");
    await check(0);
    await page.keyboard.press("ArrowRight");
    await check(1);
    await page.keyboard.press("End");
    await check(count - 1);
    await page.keyboard.press("Home");
    await check(0);
    await page.keyboard.press("Tab");
    await expect(w.getByRole("tabpanel")).toBeFocused();
  });
}
