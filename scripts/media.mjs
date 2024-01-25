// Copies the pictures the project windows show into public/media, smaller.
// Run once by hand: `node scripts/media.mjs <scratch folder with the downloaded images>`.
// The outputs are committed, so the site never depends on this script or on
// the other repos being checked out.
import { copyFileSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "public", "media");
const ws = join(here, "..", "..");
const dl = process.argv[2];

// [source, project folder, output name]. PNGs become WebP; GIFs are copied.
const jobs = [
  [join(ws, "agent-desk/docs/screenshots/floor.png"), "agent-desk", "floor.webp"],
  [join(ws, "agent-desk/docs/screenshots/patch.png"), "agent-desk", "patch.webp"],
  [join(ws, "agent-desk/docs/screenshots/proposal.png"), "agent-desk", "proposal.webp"],
  [join(ws, "flowboard/docs/demo.gif"), "flowboard", "demo.gif"],
  [join(ws, "flowboard/docs/screenshots/run.png"), "flowboard", "run.webp"],
  [join(ws, "flowboard/docs/screenshots/failed.png"), "flowboard", "failed.webp"],
  [join(ws, "sayso/docs/demo.gif"), "sayso", "demo.gif"],
  [join(ws, "sayso/docs/screenshots/desk.png"), "sayso", "desk.webp"],
  [join(ws, "sayso/docs/screenshots/receipt-dark.png"), "sayso", "receipt-dark.webp"],
  [join(ws, "hindsight/docs/demo.gif"), "hindsight", "demo.gif"],
  [join(ws, "hindsight/docs/screenshots/run-agent-time.png"), "hindsight", "run-agent-time.webp"],
  [join(ws, "hindsight/docs/screenshots/overview.png"), "hindsight", "overview.webp"],
  [join(dl, "quant-edge-dark.png"), "quant-copilot", "edge-dark.webp"],
  [join(dl, "quant-volatility-light.png"), "quant-copilot", "volatility-light.webp"],
  [join(dl, "noodle-light.png"), "noodle", "light.webp"],
  [join(dl, "noodle-dark.png"), "noodle", "dark.webp"],
  [join(dl, "warehouse-er.png"), "property-warehouse", "er.webp"],
];

for (const [src, folder, name] of jobs) {
  const dir = join(out, folder);
  mkdirSync(dir, { recursive: true });
  const dest = join(dir, name);
  if (name.endsWith(".gif")) {
    copyFileSync(src, dest);
  } else {
    await sharp(src).resize({ width: 1280, withoutEnlargement: true }).webp({ quality: 80 }).toFile(dest);
  }
  console.log(`${folder}/${name}  ${(statSync(dest).size / 1024).toFixed(0)} KB`);
}
