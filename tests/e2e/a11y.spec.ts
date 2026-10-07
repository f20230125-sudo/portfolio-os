import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { gotoDesktop, openIcon } from "./helpers";

// Automated accessibility scans (WCAG 2.1 A and AA) of the desktop, with and
// without windows open, in both themes, and of the simple view.

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function scan(page: Page, what: string) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const summary = results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`);
  expect(summary, what).toEqual([]);
}

for (const theme of ["light", "dark"] as const) {
  test.describe(`${theme} theme`, () => {
    test.use({ colorScheme: theme });

    test("the desktop with the assistant open", async ({ page }) => {
      await gotoDesktop(page);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await scan(page, "desktop");
    });

    test("an answer with sources, actions and the fold-out open", async ({ page }) => {
      await gotoDesktop(page);
      await page.getByLabel("Ask a question about Uzair").fill("Tell me about Sayso");
      await page.keyboard.press("Enter");
      await page.getByText("How I answered").click();
      await scan(page, "answer");
    });

    test("each app window", async ({ page }) => {
      await gotoDesktop(page);
      for (const name of ["Sayso", "Projects", "About", "Resume", "Research", "Contact"]) {
        await openIcon(page, name);
        await scan(page, name);
        await page.getByRole("button", { name: `Close ${name}` }).click();
      }
    });

    test("a project's details tab and a project with no screenshot", async ({ page }) => {
      await gotoDesktop(page);
      const w = await openIcon(page, "Flowboard");
      await w.getByRole("tab", { name: "How it is built" }).click();
      await scan(page, "details");
      await w.getByRole("button", { name: "Close Flowboard" }).click();
      await page.goto("/?open=pokemon-aurora");
      await scan(page, "cover");
    });

    test("Start, its search results, a context menu and Settings", async ({ page }) => {
      await gotoDesktop(page);
      await page.getByRole("button", { name: "Start" }).click();
      await scan(page, "start");
      await page.getByLabel("Search apps and projects, or ask a question").fill("fl");
      await scan(page, "start search");
      await page.keyboard.press("Escape");
      await page.getByRole("option", { name: /^Sayso/ }).click({ button: "right" });
      await scan(page, "context menu");
      await page.keyboard.press("Escape");
      await page.goto("/?open=settings");
      await scan(page, "settings");
    });

    test("the simple view", async ({ page }) => {
      await page.goto("/simple");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await scan(page, "simple view");
    });
  });
}

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("the desktop and an open window", async ({ page }) => {
    await gotoDesktop(page);
    await scan(page, "phone desktop");
    await page.getByRole("option", { name: /^Sayso/ }).tap();
    await expect(page.getByRole("dialog", { name: "Sayso", exact: true })).toBeVisible();
    await scan(page, "phone window");
  });

  test("the simple view", async ({ page }) => {
    await page.goto("/simple");
    await scan(page, "phone simple");
  });
});
