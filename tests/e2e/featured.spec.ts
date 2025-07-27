import { expect, test } from "@playwright/test";
import { featured } from "../../src/knowledge/projects";
import { boxOf, gotoDesktop, win } from "./helpers";

type Box = Awaited<ReturnType<typeof boxOf>>;
const overlaps = (a: Box, b: Box) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

for (const [width, height] of [[1440, 900], [1280, 720], [1920, 1080], [1024, 768]] as const) {
  test.describe(`featured work at ${width}x${height}`, () => {
    test.use({ viewport: { width, height } });

    test("shows three projects clear of the card, icons, taskbar and auto-opened assistant", async ({ page }) => {
      await gotoDesktop(page);
      const panel = page.getByRole("region", { name: "Featured work" });
      await expect(panel).toBeInViewport({ ratio: 1 });
      await expect(panel.getByRole("listitem")).toHaveCount(3);
      const p = await boxOf(panel);
      const c = await boxOf(page.getByRole("region", { name: "Mohammad Uzair Khan" }));
      expect(p.x).toBe(c.x);
      expect(p.width).toBe(c.width);
      expect(p.y).toBeGreaterThan(c.y + c.height);
      expect(p.y + p.height).toBeLessThanOrEqual(height - 48);
      expect(overlaps(p, c)).toBe(false);
      for (const icon of await page.getByRole("option").all()) {
        const i = await boxOf(icon);
        expect(overlaps(p, i)).toBe(false);
        expect(overlaps(c, i)).toBe(false);
      }
      if (width >= 1180) {
        await expect(win(page, "Ask Uzair")).toBeVisible();
        const a = await boxOf(win(page, "Ask Uzair"));
        expect(overlaps(p, a)).toBe(false);
        expect(overlaps(c, a)).toBe(false);
      } else await expect(page.getByRole("dialog")).toHaveCount(0);
      for (const project of featured) {
        const row = panel.getByRole("listitem").filter({ has: page.getByRole("heading", { name: project.name, exact: true }) });
        await expect(row.getByRole("heading")).toBeVisible();
        await expect(row.getByRole("link", { name: "Live site" })).toHaveAttribute("href", project.live!.url);
        await expect(row.getByRole("link", { name: "Live site" })).toHaveAttribute("target", "_blank");
        await expect(row.getByRole("link", { name: "Live site" })).toHaveAttribute("rel", "noopener noreferrer");
        await expect(row.getByRole("link", { name: "Code" })).toHaveAttribute("href", project.code);
        if (height > 800) await expect(row.getByRole("img")).toBeVisible();
        else await expect(row.getByRole("img")).toBeHidden();
      }
    });

    test("Open launches the project window and All projects opens the folder", async ({ page }) => {
      await gotoDesktop(page);
      const panel = page.getByRole("region", { name: "Featured work" });
      await panel.getByRole("listitem").nth(1).getByRole("button", { name: "Open", exact: true }).click();
      await expect(win(page, "Backroom")).toBeVisible();
      await win(page, "Backroom").getByRole("button", { name: "Close Backroom" }).click();
      await panel.getByRole("button", { name: "All projects", exact: true }).click();
      await expect(win(page, "Projects")).toBeVisible();
    });
  });
}

test("the server sends the panel, project names, taglines and links without needing scripts", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  const panel = page.getByRole("region", { name: "Featured work" });
  await expect(panel).toBeVisible();
  for (const p of featured) {
    await expect(panel.getByRole("heading", { name: p.name, exact: true })).toBeVisible();
    await expect(panel).toContainText(p.tagline);
  }
  await context.close();
});

test.describe("identity first on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("starts with his name, then featured work, then the scrollable icon grid", async ({ page }) => {
    await gotoDesktop(page);
    const scroll = page.locator(".desktop-content");
    const name = page.getByRole("heading", { name: "Mohammad Uzair Khan", exact: true });
    await expect(name).toBeInViewport({ ratio: 1 });
    expect(await scroll.evaluate((el) => el.scrollTop)).toBe(0);
    await expect(scroll.locator(".desktop-intro > :first-child")).toHaveAttribute("aria-labelledby", "profile-name");
    const card = await boxOf(page.getByRole("region", { name: "Mohammad Uzair Khan" }));
    const panel = await boxOf(page.getByRole("region", { name: "Featured work" }));
    expect(card.y + card.height).toBeLessThan(panel.y);
    for (const icon of await page.getByRole("option").all()) expect((await boxOf(icon)).y).toBeGreaterThan(panel.y + panel.height);
    await page.getByRole("option", { name: /^Contact/ }).scrollIntoViewIfNeeded();
    await expect(page.getByRole("option", { name: /^Contact/ })).toBeInViewport({ ratio: 1 });
    expect(await scroll.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  });

  for (const [folder, project] of [["Projects", "Backroom"], ["Data and analytics", "Rx Market Pulse"]] as const) {
    test(`one tap opens a project in ${folder}`, async ({ page }) => {
      await gotoDesktop(page);
      await page.getByRole("option", { name: folder, exact: true }).tap();
      const explorer = win(page, folder);
      await expect(explorer).toBeVisible();
      await explorer.getByRole("button", { name: /^Open / }).click();
      await expect(page.getByRole("dialog", { name: folder === "Projects" ? "Inbound" : "Rx Market Pulse", exact: true })).toBeVisible();
      await page.getByRole("button", { name: `Close ${folder === "Projects" ? "Inbound" : "Rx Market Pulse"}` }).click();
      await explorer.getByRole("list", { name: "Projects" }).getByRole("button", { name: new RegExp(`^${project}`) }).tap();
      await expect(win(page, project)).toBeVisible();
    });
  }
});
