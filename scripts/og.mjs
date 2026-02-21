// Takes the picture shown when the link is shared (src/app/opengraph-image.png):
// the desktop with a project window and the assistant mid-conversation.
//
//   node scripts/og.mjs        (with the site running on http://127.0.0.1:3050)
import { copyFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://127.0.0.1:3050";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, colorScheme: "light", timezoneId: "Asia/Dubai", reducedMotion: "reduce" });
await page.goto(`${base}/?open=ask`);
await page.getByRole("dialog", { name: "Ask Uzair", exact: true }).waitFor();
const input = page.getByLabel("Ask a question about Uzair");
await input.fill("Where did he use Redux?");
await input.press("Enter");
await page.getByText("Redux Toolkit is on his CV").first().waitFor();
await page.waitForTimeout(600);
await page.screenshot({ path: "src/app/opengraph-image.png" });
copyFileSync("src/app/opengraph-image.png", "src/app/twitter-image.png");
await browser.close();
console.log("saved src/app/opengraph-image.png");
