import { expect, test } from "@playwright/test";
import { gotoDesktop, openIcon, watchConsole, win } from "./helpers";

test.describe("project windows", () => {
  test("show the pitch, key facts, stack and links, and picture buttons change the picture", async ({ page }) => {
    const errors = watchConsole(page);
    await gotoDesktop(page);
    const w = await openIcon(page, "Sayso");
    await expect(w.getByRole("heading", { name: "Sayso" })).toBeVisible();
    await expect(w.getByText("Key facts")).toBeVisible();
    await expect(w.getByRole("link", { name: /Code on GitHub/ })).toHaveAttribute("href", "https://github.com/f20230125-sudo/sayso");
    const first = await w.locator("img").first().getAttribute("src");
    await w.getByRole("button", { name: /Show picture 2/ }).click();
    expect(await w.locator("img").first().getAttribute("src")).not.toBe(first);
    expect(errors).toEqual([]);
  });

  test("every picture loads", async ({ page }) => {
    await gotoDesktop(page);
    const w = await openIcon(page, "Hindsight");
    const group = w.getByRole("group", { name: "Pictures" });
    await expect(group).toBeVisible();
    const buttons = group.getByRole("button");
    const n = await buttons.count();
    expect(n).toBeGreaterThan(1);
    for (let i = 0; i < n; i++) {
      await buttons.nth(i).click();
      const img = w.locator("img").first();
      await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    }
  });

  test("have tabs for the decisions and the limits", async ({ page }) => {
    await gotoDesktop(page);
    const w = await openIcon(page, "Flowboard");
    await w.getByRole("tab", { name: "How it is built" }).click();
    await expect(w.getByText("Decisions behind it")).toBeVisible();
    await expect(w.getByText("Limits, said plainly")).toBeVisible();
    await expect(w.getByText("No loops and no arithmetic")).toBeVisible();
    await w.getByRole("tab", { name: "Overview" }).click();
    await expect(w.getByText("Key facts")).toBeVisible();
  });

  test("a project with no live site has no live tab, and a cover instead of a screenshot when it has none", async ({ page }) => {
    await gotoDesktop(page);
    await openIcon(page, "Projects");
    await win(page, "Projects").getByRole("button", { name: /^Pokémon Aurora/ }).dblclick();
    const w = win(page, "Pokémon Aurora");
    await expect(w).toBeVisible();
    await expect(w.getByRole("tab")).toHaveText(["Overview", "How it is built"]);
    await expect(w.getByRole("img", { name: /no screenshot/ })).toBeVisible();
  });

  test("the assistant button inside a window asks about that project", async ({ page }) => {
    await gotoDesktop(page);
    const w = await openIcon(page, "Hindsight");
    await w.getByRole("button", { name: "Ask about this" }).click();
    await expect(win(page, "Ask Uzair")).toBeVisible();
    await expect(page.getByRole("log").getByText("Hindsight reads runs")).toBeVisible();
  });

});

test.describe("the Projects folder", () => {
  test("lists all fourteen, filters by folder, and opens one by double-click or Enter", async ({ page }) => {
    await gotoDesktop(page);
    const w = await openIcon(page, "Projects");
    const rows = w.getByRole("list", { name: "Projects" }).getByRole("button");
    await expect(rows).toHaveCount(14);
    const folders = w.getByRole("navigation", { name: "Project folders" });
    await folders.getByRole("button", { name: "Quant and markets" }).click();
    await expect(rows).toHaveCount(3);
    await folders.getByRole("button", { name: "Flagship" }).click();
    await expect(rows).toHaveCount(4);
    await rows.first().focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(win(page, "Flowboard")).toBeVisible();
  });

  test("a row's details show beside the list", async ({ page }) => {
    await gotoDesktop(page);
    const w = await openIcon(page, "Projects");
    await w.getByRole("button", { name: /^Hindsight/ }).click();
    await expect(w.getByRole("complementary", { name: "Hindsight details" })).toContainText("one timeline");
  });
});

test.describe("other windows", () => {
  test("Research shows the numbers", async ({ page }) => {
    await gotoDesktop(page);
    const w = await openIcon(page, "Research");
    await expect(w.getByRole("img", { name: "Test accuracy 97.33 percent" })).toBeVisible();
    await expect(w.getByText("0.963")).toBeVisible();
    await expect(w.getByText("Submitted to IEEE MSN 2026 (under review)")).toBeVisible();
  });

  test("Resume has his education, experience and skills", async ({ page }) => {
    await gotoDesktop(page);
    const w = await openIcon(page, "Resume");
    for (const h of ["Education", "Research and publications", "Experience", "Projects", "Technical skills", "Certifications"]) {
      await expect(w.getByRole("heading", { name: h })).toBeVisible();
    }
    await expect(w.getByText("Amaani")).toBeVisible();
  });

  test("Contact copies his email and builds a mail link", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await gotoDesktop(page);
    const w = await openIcon(page, "Contact");
    await w.getByRole("button", { name: "Copy" }).click();
    await expect(w.getByRole("button", { name: "Copied" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("uk4320930@gmail.com");
    await w.getByLabel("Subject").fill("Hello & welcome");
    const href = await w.getByRole("link", { name: "Open in my email app" }).getAttribute("href");
    expect(href).toContain("mailto:uk4320930@gmail.com?subject=Hello%20%26%20welcome");
  });

  test("Settings changes the theme and restarts the desktop", async ({ page }) => {
    await gotoDesktop(page);
    await page.getByRole("button", { name: "Start" }).click();
    await page.getByRole("dialog", { name: "Start menu" }).getByRole("button", { name: "Settings" }).click();
    const s = win(page, "Settings");
    await s.getByRole("button", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await s.getByLabel("Reduce animations").check();
    await expect(page.locator("html")).toHaveAttribute("data-reduce-motion", "true");
    await s.getByRole("button", { name: "Restart the desktop" }).click();
    await expect(win(page, "Settings")).toHaveCount(0);
    await expect(win(page, "Ask Uzair")).toBeVisible();
  });
});
