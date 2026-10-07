// A quick look at the running site: opens windows and saves a picture of each.
// For checking the look by eye while building.
//
//   node scripts/look.mjs [light|dark] [width] [height] [name]
//
// Needs the site on http://127.0.0.1:3050, or wherever BASE_URL says, so the
// live site can be checked the same way. Pictures go to LOOK_DIR or ./.look.

import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const theme = process.argv[2] === "dark" ? "dark" : "light";
const width = Number(process.argv[3] ?? 1440);
const height = Number(process.argv[4] ?? 900);
const only = process.argv[5] ?? "all";
const out = process.env.LOOK_DIR ?? ".look";
const base = process.env.BASE_URL ?? "http://127.0.0.1:3050";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const problems = [];

async function scene(name, steps) {
  if (only !== "all" && only !== name) return;
  const page = await browser.newPage({ viewport: { width, height }, colorScheme: theme, timezoneId: "Asia/Dubai" });
  page.on("console", (m) => {
    if (m.type() === "error") problems.push(`${name}: ${m.text()}`);
  });
  page.on("pageerror", (e) => problems.push(`${name}: ${e}`));
  let n = 0;
  const snap = async (label) => {
    n += 1;
    await page.waitForTimeout(450);
    await page.screenshot({ path: join(out, `${theme}-${width}x${height}-${name}-${String(n).padStart(2, "0")}-${label}.png`) });
  };
  await page.goto(base);
  await page.getByRole("heading", { level: 1 }).waitFor({ state: "attached" });
  try {
    await steps({ page, snap });
  } catch (e) {
    problems.push(`${name}: ${String(e).split("\n")[0]}`);
    await snap("stuck");
  }
  await page.close();
}

const open = (page, name) => page.getByRole("option", { name: new RegExp(`^${name}`) }).dblclick();

await scene("home", async ({ snap }) => {
  await snap("desktop");
});

await scene("ask", async ({ page, snap }) => {
  const input = page.getByLabel("Ask a question about Uzair");
  await input.fill("Tell me about Sayso");
  await input.press("Enter");
  await page.getByText("How I answered").first().waitFor();
  await snap("sayso-answer");
  await input.fill("what stack did it use?");
  await input.press("Enter");
  await page.waitForTimeout(700);
  await snap("follow-up");
});

await scene("project", async ({ page, snap }) => {
  await open(page, "Sayso");
  await page.getByRole("dialog", { name: "Sayso" }).waitFor();
  await snap("sayso");
  await page.getByRole("tab", { name: "How it is built" }).click();
  await snap("details");
});

await scene("explorer", async ({ page, snap }) => {
  await open(page, "Projects");
  await page.getByRole("dialog", { name: "Projects" }).waitFor();
  await snap("projects");
});

await scene("apps", async ({ page, snap }) => {
  for (const app of ["About", "Resume", "Research", "Contact"]) {
    await open(page, app);
    await page.getByRole("dialog", { name: app }).waitFor();
  }
  await snap("four-windows");
});

await scene("start", async ({ page, snap }) => {
  await page.getByRole("button", { name: "Start" }).click();
  await snap("start-menu");
  await page.getByLabel("Search apps and projects, or ask a question").fill("flow");
  await snap("start-search");
});

await scene("snap", async ({ page, snap }) => {
  const title = page.locator(".win-title").first();
  const box = await title.boundingBox();
  await page.mouse.move(box.x + 200, box.y + 14);
  await page.mouse.down();
  await page.mouse.move(box.x + 100, box.y + 100, { steps: 4 });
  await page.mouse.move(2, 300, { steps: 6 });
  await snap("snap-preview");
  await page.mouse.up();
  await snap("snapped-left");
});

await browser.close();
console.log(problems.length ? `PROBLEMS:\n${problems.join("\n")}` : "No console errors.");
