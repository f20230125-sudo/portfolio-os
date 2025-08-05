import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { projectById } from "../../src/knowledge/projects";
import { watchConsole } from "./helpers";

const backroom = projectById("backroom")!;

test("Backroom renders its copy, screenshot, links, metadata and security headers", async ({ page }) => {
  const errors = watchConsole(page);
  const response = await page.goto("/projects/backroom");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Backroom", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Code on GitHub" })).toHaveAttribute("href", backroom.code);
  await expect(page.getByRole("link", { name: "Open on the desktop" })).toHaveAttribute("href", "/?open=backroom");
  await expect(page.getByRole("link", { name: "Live site" })).toHaveAttribute("href", backroom.live!.url);
  await expect(page).toHaveTitle("Backroom · Uzair Khan");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", backroom.tagline);
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(new URL(canonical!).pathname).toBe("/projects/backroom");
  for (const selector of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) {
    const url = new URL((await page.locator(selector).getAttribute("content"))!);
    expect(url.origin).toBe(new URL(canonical!).origin);
    expect(url.pathname).toBe("/media/og/backroom.jpg");
    expect((await page.request.get(url.pathname)).headers()["content-type"]).toBe("image/jpeg");
  }
  const image = page.getByRole("img", { name: backroom.shots[0].alt });
  await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  expect(response?.headers()["content-security-policy"]).toContain("img-src 'self' data: blob:");
  expect(response?.headers()["x-frame-options"]).toBe("DENY");
  expect(errors).toEqual([]);
  await page.getByRole("link", { name: "Open on the desktop" }).click();
  await expect(page.getByRole("dialog", { name: "Backroom", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Share link" })).toHaveAttribute("target", "_blank");
});

test("unknown project slugs return HTTP 404", async ({ request }) => {
  const response = await request.get("/projects/no-such-project");
  expect(response.status()).toBe(404);
});

test("project content and navigation work with JavaScript disabled", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${test.info().project.use.baseURL}/projects/backroom`);
  await expect(page.getByRole("heading", { level: 1, name: "Backroom", exact: true })).toBeVisible();
  for (const fact of backroom.facts) await expect(page.getByText(fact, { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "All projects and profile in the simple view" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mohammad Uzair Khan");
  await expect(page.locator("#backroom").getByRole("link", { name: "Share link" })).toHaveAttribute("href", "/projects/backroom");
  await context.close();
});

for (const theme of ["light", "dark"] as const) {
  test(`Backroom has no axe violations in ${theme} theme`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem("portfolio-os:theme", value), theme);
    await page.goto("/projects/backroom");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
  });
}
