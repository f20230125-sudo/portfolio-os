// Makes the link-preview picture for each project page: the project's first
// screenshot cut to 1200x630 from the top, as a JPEG, because not every site
// that unfurls links (LinkedIn among them) shows WebP.
//
//   node scripts/project-og.mjs
//
// Writes public/media/og/<id>.jpg. Run it again after changing a screenshot.

import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { projects } from "../src/knowledge/projects.ts";

mkdirSync(join("public", "media", "og"), { recursive: true });
let made = 0;
for (const p of projects) {
  const shot = p.shots[0];
  if (!shot) continue;
  const src = join("public", shot.src);
  if (!existsSync(src)) throw new Error(`${p.id}: missing ${src}`);
  await sharp(src)
    .resize(1200, 630, { fit: "cover", position: "top" })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(join("public", "media", "og", `${p.id}.jpg`));
  made += 1;
}
console.log(`wrote ${made} preview images`);
