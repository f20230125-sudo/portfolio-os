// Retakes the pictures in the README from the running site.
//
//   node scripts/screenshots.mjs [name]   (site running on http://127.0.0.1:3050; a name retakes just that picture)
//
// The Live window loads the real Sayso, which only allows the deployed portfolio to frame it, so that
// one picture is taken from the deployed site (LIVE_URL), not from the local one.
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://127.0.0.1:3050";
const dir = "docs/screenshots";
mkdirSync(dir, { recursive: true });

const only = process.argv[2];
const browser = await chromium.launch();
const shot = async (name, { width = 1440, height = 900, scheme = "light", touch = false }, steps) => {
  if (only && only !== name) return;
  const page = await browser.newPage({ viewport: { width, height }, colorScheme: scheme, timezoneId: "Asia/Dubai", reducedMotion: "reduce", hasTouch: touch });
  await page.goto(base);
  await page.getByRole("listbox", { name: "Desktop" }).waitFor();
  await steps(page);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${dir}/${name}.png` });
  await page.close();
};
const ask = async (page, q) => {
  const input = page.getByLabel("Ask a question about Uzair");
  await input.fill(q);
  await input.press("Enter");
  await page.getByText("How I answered").last().waitFor();
};
const open = (page, name) => page.getByRole("option", { name: new RegExp(`^${name}`) }).dblclick();

await shot("desktop", {}, async (page) => {
  await ask(page, "Where did he use Redux?");
});

await shot("live", {}, async (page) => {
  await page.goto(`${process.env.LIVE_URL ?? "https://uzair-khan-lac.vercel.app"}/?open=sayso&tab=live`);
  await page.getByRole("button", { name: "Run it here" }).click();
  await page.frameLocator('iframe[title="Sayso, running live"]').getByText("Hello").waitFor({ timeout: 30000 });
});

await shot("projects", {}, async (page) => {
  await open(page, "Projects");
  await page.getByRole("dialog", { name: "Projects", exact: true }).waitFor();
});

await shot("start", {}, async (page) => {
  await page.getByRole("button", { name: "Start" }).click();
  await page.getByLabel("Search apps and projects, or ask a question").fill("react");
});

await shot("dark", { scheme: "dark" }, async (page) => {
  await ask(page, "Tell me about his research");
  await open(page, "Research");
  await page.getByRole("dialog", { name: "Research", exact: true }).waitFor();
});

await shot("snap", {}, async (page) => {
  await open(page, "Hindsight");
  await open(page, "Flowboard");
  const w = page.getByRole("dialog", { name: "Flowboard", exact: true });
  const t = await w.locator(".win-title").boundingBox();
  await page.mouse.move(t.x + 300, t.y + 18);
  await page.mouse.down();
  await page.mouse.move(t.x + 200, t.y + 100, { steps: 4 });
  await page.mouse.move(1438, 400, { steps: 6 });
  await page.mouse.up();
  await page.getByRole("dialog", { name: "Hindsight", exact: true }).locator(".win-title").click({ position: { x: 100, y: 10 } });
});

await shot("phone", { width: 390, height: 844, touch: true }, async (page) => {
  await page.getByRole("option", { name: /^Sayso/ }).tap();
});

await shot("phone-desktop", { width: 390, height: 844, touch: true }, async () => {});

if (!only || only === "simple") {
  const simple = await browser.newPage({ viewport: { width: 1000, height: 900 }, reducedMotion: "reduce" });
  await simple.goto(`${base}/simple`);
  await simple.screenshot({ path: `${dir}/simple.png` });
}

await browser.close();
console.log("saved pictures to docs/screenshots");
