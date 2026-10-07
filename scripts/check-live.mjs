// Opens the live portfolio in a real browser and checks that each app really
// runs inside its window: the frame loads, shows the app's own content, and
// nothing is refused. The tests in tests/e2e/live.spec.ts use stand-ins; this
// is the check against the real sites.
//
//   BASE_URL=https://uzair-khan-lac.vercel.app node scripts/check-live.mjs
//
// Pictures go to LOOK_DIR or ./.look.

import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://127.0.0.1:3050";
const out = process.env.LOOK_DIR ?? ".look";
mkdirSync(out, { recursive: true });

const APPS = [
  { id: "agent-desk", title: "Agent Desk", expect: /Patch|Floor|Agent/i },
  { id: "flowboard", title: "Flowboard", expect: /Flowboard|flow|Heat check/i },
  { id: "sayso", title: "Sayso", expect: /Sayso|Juno|Say what you need/i },
  { id: "hindsight", title: "Hindsight", expect: /Hindsight|run|agent/i },

];

const browser = await chromium.launch();
let bad = 0;
for (const app of APPS) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const problems = [];
  page.on("console", (m) => {
    if (m.type() === "error" && /frame|refused|csp|content security/i.test(m.text())) problems.push(m.text().slice(0, 200));
  });
  await page.goto(`${base}/?open=${app.id}&tab=live`);
  const win = page.getByRole("dialog", { name: app.title, exact: true });
  await win.waitFor();
  await win.getByRole("button", { name: "Run it here" }).click();
  const frame = page.frameLocator(`iframe[title="${app.title}, running live"]`);
  let text = "";
  try {
    await frame.locator("body").waitFor({ timeout: 20000 });
    await page.waitForTimeout(2500);
    text = (await frame.locator("body").innerText({ timeout: 10000 })).replace(/\s+/g, " ").slice(0, 120);
  } catch (e) {
    problems.push(String(e).split("\n")[0]);
  }
  const ok = app.expect.test(text) && problems.length === 0;
  if (!ok) bad += 1;
  console.log(`${ok ? "OK  " : "FAIL"} ${app.title.padEnd(11)} ${text || "(nothing shown)"}${problems.length ? `  [${problems.join(" | ")}]` : ""}`);
  await page.screenshot({ path: join(out, `live-${app.id}.png`) });
  await page.close();
}
await browser.close();
process.exit(bad ? 1 : 0);
