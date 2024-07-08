// Captures the first screen of each agent and automation project's live site for its window.
// Run once by hand: `node scripts/capture-agents.mjs`. Outputs are committed under public/media.
import { mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "public", "media");

const sites = [
  ["inbound", "https://inbound-scout.vercel.app/"],
  ["backroom", "https://backroom-ops.vercel.app/"],
  ["order-desk", "https://order-desk-ops.vercel.app/"],
  ["loopdesk", "https://loopdesk-sigma.vercel.app/"],
  ["scopedesk", "https://scopedesk-chi.vercel.app/"],
  ["followdesk", "https://followdesk-phi.vercel.app/"],
  ["invoice-ready", "https://invoice-ready-ae.vercel.app/"],
  ["quote-desk", "https://quote-desk-ae.vercel.app/"],
  ["content-desk", "https://content-desk-ae.vercel.app/"],
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
for (const [id, url] of sites) {
  await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(1500);
  const png = await page.screenshot();
  mkdirSync(join(out, id), { recursive: true });
  const dest = join(out, id, "overview.webp");
  await sharp(png).resize({ width: 1280, withoutEnlargement: true }).webp({ quality: 80 }).toFile(dest);
  console.log(`${id}/overview.webp  ${(statSync(dest).size / 1024).toFixed(0)} KB`);
}
await browser.close();
