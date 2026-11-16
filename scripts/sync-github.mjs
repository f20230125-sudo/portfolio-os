// Keeps the portfolio in step with GitHub: every public repository of the owner
// that is not already written up by hand in src/knowledge/projects.ts gets an
// entry made from what GitHub knows (description, topics, languages, website)
// and from its README. No model writes anything: the text is the README's own
// sentences, cleaned, or plain facts from the repository's metadata.
//
//   node scripts/sync-github.mjs            write the entries, pictures and state
//   node scripts/sync-github.mjs --check    say whether anything would change (writes nothing)
//   node scripts/sync-github.mjs --hold     undo this run's additions after the site's checks failed
//   node scripts/sync-github.mjs --dry      print what would be written
//
// Settings are in github-sync.config.json. A repository is left out when it is
// a fork, archived, a template, empty, named in "ignore", carries the opt-out
// topic, or has no README worth reading. GITHUB_TOKEN is used when present
// (GitHub Actions provides one); without it the public API allows 60 calls an hour.

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { project as projectSchema } from "../src/knowledge/schema.ts";
import { projects as allProjects } from "../src/knowledge/projects.ts";
import { person } from "../src/knowledge/profile.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src", "knowledge", "github-projects.ts");
const STATE = join(ROOT, "src", "knowledge", "github-sync.json");
const RESULT = join(ROOT, ".local", "sync-result.json");
const config = JSON.parse(readFileSync(join(ROOT, "github-sync.config.json"), "utf8"));

/** Bump when the way entries are written changes, so every entry is made again. */
const GENERATOR = 1;
const KIND = "recent";
const mode = process.argv.includes("--check") ? "check" : process.argv.includes("--hold") ? "hold" : process.argv.includes("--dry") ? "dry" : "write";

// ------------------------------------------------------------------ GitHub

async function gh(path, accept = "application/vnd.github+json") {
  const headers = { Accept: accept, "User-Agent": "portfolio-sync", "X-GitHub-Api-Version": "2022-11-28" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub ${res.status} for ${path}: ${(await res.text()).slice(0, 200)}`);
  return accept.includes("raw") ? res.text() : res.json();
}

async function listRepos(owner) {
  const all = [];
  for (let page = 1; page <= 10; page += 1) {
    const batch = await gh(`/users/${owner}/repos?type=owner&per_page=100&page=${page}`);
    if (!batch || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

// ------------------------------------------------------------------ reading a README

/** Markdown to plain words: no pictures, badges, links, code or HTML. */
function plain(text) {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(^|[\s(])[*_]([^*_\n]+)[*_](?=[\s).,;:!?]|$)/g, "$1$2")
    .replace(/\s+/g, " ")
    .trim();
}

/** Splits a README into its title, the paragraphs before the first section, and its sections. */
function readReadme(md) {
  const text = md.replace(/<!--[\s\S]*?-->/g, "").replace(/```[\s\S]*?```/g, "\n").replace(/~~~[\s\S]*?~~~/g, "\n");
  const doc = { title: "", intro: [], sections: [] };
  let section = null;
  let para = [];
  // A list item may run over several lines; it is kept open until a blank line or the next item.
  let item = null;
  const flush = () => {
    if (item !== null) {
      const b = plain(item.join(" "));
      item = null;
      if (b && section) section.bullets.push(b);
    }
    const p = plain(para.join(" "));
    para = [];
    if (!p) return;
    (section ? section.paragraphs : doc.intro).push(p);
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    const bullet = /^(?:[-*+]|\d+[.)])\s+(.*)$/.exec(line);
    if (heading) {
      flush();
      const title = plain(heading[2].replace(/#+$/, ""));
      if (heading[1].length === 1 && !doc.title && doc.sections.length === 0) doc.title = title;
      else {
        section = { heading: title, paragraphs: [], bullets: [] };
        doc.sections.push(section);
      }
    } else if (bullet) {
      flush();
      item = [bullet[1]];
    } else if (!line || line.startsWith("|") || /^[-=*_]{3,}$/.test(line) || line.startsWith(">")) {
      flush();
    } else if (item !== null) {
      item.push(line);
    } else {
      para.push(line);
    }
  }
  flush();
  return doc;
}

// ------------------------------------------------------------------ what may be published

// The same rules the site's own tests apply to everything it says (src/knowledge/knowledge.test.ts).
const FORBIDDEN = [
  /\+\d[\d\s-]{8,}\d/,
  /(?<![\d.])\d{3}[\s-]\d{3,4}[\s-]\d{3,4}(?![\d.])/,
  /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/,
  /\bcgpa\b/i,
  /\b81\s?%/,
  /7\.93|8\.5\+/,
  /AIza[\w-]{20,}|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|github_pat_/,
  /https?:\/\//,
];
const publishable = (s) => !FORBIDDEN.some((re) => re.test(s));
const ALLOWED_HOSTS = ["vercel.app", "github.io"];

const sentences = (s) => s.split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/).map((x) => x.trim()).filter(Boolean);

/** As much of the text as fits, ending at the end of a sentence where it can. */
function fit(text, max) {
  if (text.length <= max) return text;
  let out = "";
  for (const s of sentences(text)) {
    if ((out ? out.length + 1 : 0) + s.length > max) break;
    out = out ? `${out} ${s}` : s;
  }
  if (out) return out;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 40)).replace(/[,;:\s]+$/, "")}…`;
}

const endStop = (s) => (/[.!?…]$/.test(s) ? s : `${s}.`);

/** What the sections whose heading matches say: their list items, or failing that the opening sentence of each paragraph. */
function pick(doc, pattern, max, proseToo = pattern) {
  const out = [];
  // A line about the repository's own files ("generated by scripts/render.py") says nothing to a visitor.
  const aboutFiles = /\b[\w/-]+\.(py|json|ts|tsx|js|mjs|md|ya?ml|sh|csv|sql|toml)\b|\bscripts\//i;
  const add = (text) => {
    const t = endStop(fit(text, 260));
    if (out.length < max && text.length >= 25 && publishable(text) && !aboutFiles.test(text) && !out.includes(t)) out.push(t);
  };
  const matching = doc.sections.filter((s) => pattern.test(s.heading));
  for (const s of matching) for (const b of s.bullets) add(b);
  if (out.length === 0) for (const s of matching.filter((m) => proseToo.test(m.heading))) for (const p of s.paragraphs) add(sentences(p)[0] ?? p);
  return out;
}

const FEATURES = /feature|what it does|what's (in|inside)|highlight|result|capabilit|overview|key |include|at a glance|summary|what you (get|can)/i;
// A results section is mostly tables and run notes: its list items are facts, its paragraphs usually are not.
const FEATURES_PROSE = /feature|what it does|highlight|overview|at a glance|summary|what you (get|can)/i;
const DECISIONS = /how it works|architecture|design|decision|approach|under the hood|pipeline|method/i;
const LIMITS = /limit|caveat|known issue|not (yet|included|done)|out of scope|honest|what it (does not|doesn't)/i;

// ------------------------------------------------------------------ making an entry

const TECH = [
  ["Next.js", /\bnext\.?js\b/i],
  ["React", /\breact\b/i],
  ["Tailwind CSS", /\btailwind/i],
  ["Redux", /\bredux\b/i],
  ["Node.js", /\bnode\.?js\b/i],
  ["Express", /\bexpress(\.js)?\b/],
  ["Flask", /\bflask\b/i],
  ["FastAPI", /\bfastapi\b/i],
  ["Django", /\bdjango\b/i],
  ["Streamlit", /\bstreamlit\b/i],
  ["SQLite", /\bsqlite\b/i],
  ["PostgreSQL", /\bpostgres(ql)?\b/i],
  ["DuckDB", /\bduckdb\b/i],
  ["pandas", /\bpandas\b/i],
  ["NumPy", /\bnumpy\b/i],
  ["scikit-learn", /\bscikit-learn\b|\bsklearn\b/i],
  ["PyTorch", /\bpytorch\b/i],
  ["TensorFlow", /\btensorflow\b/i],
  ["XGBoost", /\bxgboost\b/i],
  ["LightGBM", /\blightgbm\b/i],
  ["ONNX", /\bonnx\b/i],
  ["Playwright", /\bplaywright\b/i],
  ["Vitest", /\bvitest\b/i],
  ["pytest", /\bpytest\b/i],
  ["Docker", /\bdocker\b/i],
  ["GitHub Actions", /\bgithub actions\b/i],
  ["Power BI", /\bpower ?bi\b/i],
  ["Plotly", /\bplotly\b/i],
  ["D3", /\bd3(\.js)?\b/i],
  ["Recharts", /\brecharts\b/i],
  ["MCP", /\bmodel context protocol\b|\bMCP\b/],
];

const GLYPHS = [
  [/\bagents?\b|\bbot\b|assistant|copilot/i, "Bot"],
  [/inbox|e-?mail|gmail/i, "Inbox"],
  [/invoice|receipt|billing/i, "Receipt"],
  [/price|pricing/i, "Tag"],
  [/pharma|drug|medicine|clinical|\brx\b/i, "Pill"],
  [/forecast|predict|time series/i, "ChartSpline"],
  [/trading|market|stock|quant/i, "ChartCandlestick"],
  [/radar|monitor|watch|alert|tracker/i, "Radar"],
  [/map|geo|territor|location/i, "MapPinned"],
  [/search|retriev|\brag\b|filings?|document/i, "FileSearch"],
  [/dashboard|analytics|report|chart|visuali/i, "ChartLine"],
  [/warehouse|database|\bsql\b|\betl\b|pipeline/i, "Database"],
  [/workflow|automation|orchestrat/i, "Workflow"],
  [/game|puzzle|play/i, "Gamepad2"],
  [/security|audit|compliance/i, "ShieldCheck"],
  [/research|paper|experiment|benchmark/i, "FlaskConical"],
];
const COLOURS = [
  ["#1d4ed8", "#60a5fa"],
  ["#6d28d9", "#a78bfa"],
  ["#0f766e", "#2dd4bf"],
  ["#b45309", "#fbbf24"],
  ["#be185d", "#f472b6"],
  ["#15803d", "#4ade80"],
  ["#b91c1c", "#f87171"],
  ["#334155", "#94a3b8"],
  ["#0369a1", "#38bdf8"],
  ["#7e22ce", "#c084fc"],
];
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthYear = (iso) => `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
const dayMonthYear = (iso) => `${Number(iso.slice(8, 10))} ${monthYear(iso)}`;

const pretty = (repoName) =>
  repoName
    .split(/[-_.]+/)
    .filter(Boolean)
    .map((w) => (/^(ai|ml|api|sql|ui|rag|llm|nlp|etl|bi|cv|os|mcp|uae|gcc)$/i.test(w) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");

// What an entry is made from. The time of the last push is deliberately not part of it: a repository
// whose own robot commits every hour would otherwise have its entry rewritten, and the site redeployed,
// every hour. An entry is made again only when the README, the description, the website or the topics change.
const fingerprint = (r, readmeSha) => [readmeSha ?? "no-readme", r.description ?? "", r.homepage ?? "", (r.topics ?? []).join(","), `v${GENERATOR}`].join("|");

function liveUrl(homepage) {
  if (!homepage) return null;
  try {
    const u = new URL(homepage);
    if (u.protocol !== "https:") return null;
    if (!ALLOWED_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`))) return null;
    return u.href.replace(/\/$/, "");
  } catch {
    return null;
  }
}

/** One portfolio entry from one repository, or the reason there cannot be one. */
function makeEntry(repo, readme, languages, takenIds) {
  const doc = readReadme(readme);
  const prose = [...doc.intro, ...doc.sections.flatMap((s) => s.paragraphs)].filter((p) => p.length >= 30 && publishable(p));
  const description = plain(repo.description ?? "");
  const words = plain(readme).length;
  if (words < config.minReadmeChars) return { skip: `README is too short (${words} characters; ${config.minReadmeChars} needed)` };

  let id = repo.name.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!id) return { skip: "name has no letters or digits" };
  if (takenIds.has(id)) id = `${id}-repo`;
  if (takenIds.has(id)) return { skip: `the id ${id} is already used` };

  const name = doc.title && doc.title.length <= 40 && publishable(doc.title) && !/^readme$/i.test(doc.title) ? doc.title.replace(/[:.\s]+$/, "") : pretty(repo.name);

  // The one line under the name: GitHub's description if it fits whole, else the README's opening sentence, else a cut.
  const opening = sentences(doc.intro.find((p) => publishable(p)) ?? "")[0] ?? "";
  const candidates = [description, opening].filter((c) => c && publishable(c));
  if (candidates.length === 0) return { skip: "no description on GitHub and no opening paragraph in the README" };
  const lead = candidates.find((c) => c.length <= 138) ?? candidates[0];
  const tagline = endStop(fit(lead, 138));

  const langTotal = Object.values(languages).reduce((a, b) => a + b, 0);
  const langs = Object.entries(languages)
    .map(([lang, bytes]) => ({ lang, share: langTotal ? bytes / langTotal : 0 }))
    .sort((a, b) => b.share - a.share);
  const mainLang = langs[0];

  // The paragraph under it: the README's opening, without repeating the line above.
  const rest = prose.slice(0, 3).join(" ");
  let pitch = fit(rest.startsWith(lead) ? rest.slice(lead.length).trim() : rest, 420);
  if (pitch.length < 40) pitch = fit(rest, 420);
  if (pitch.length < 40) pitch = `${endStop(lead)} The repository's README on GitHub describes how it works${mainLang ? `; most of the code is ${mainLang.lang}` : ""}.`;

  const facts = pick(doc, FEATURES, 4, FEATURES_PROSE);
  if (mainLang && facts.length < 5) facts.push(`Written mainly in ${mainLang.lang}: ${Math.round(mainLang.share * 100)}% of the code, by GitHub's count.`);
  if (facts.length < 5) facts.push(`Public on GitHub since ${monthYear(repo.created_at)}.`);

  const decisions = pick(doc, DECISIONS, 4);
  const limits = pick(doc, LIMITS, 4);

  const haystack = `${readme}\n${(repo.topics ?? []).join(" ")}`;
  const stack = [...langs.filter((l) => l.share >= 0.08).slice(0, 3).map((l) => l.lang), ...TECH.filter(([, re]) => re.test(haystack)).map(([label]) => label)];
  const uniqueStack = [...new Set(stack)].slice(0, 8);
  if (uniqueStack.length === 0) uniqueStack.push(repo.language ?? "GitHub");

  const about = `${repo.name} ${description} ${(repo.topics ?? []).join(" ")} ${doc.title}`;
  const glyph = GLYPHS.find(([re]) => re.test(about))?.[1] ?? "Sparkles";
  const [from, to] = COLOURS[hash(repo.name) % COLOURS.length];

  const spaced = repo.name.toLowerCase().replace(/[-_.]+/g, " ");
  const live = liveUrl(repo.homepage);

  const entry = {
    id,
    name,
    aliases: spaced !== name.toLowerCase() ? [spaced] : [],
    kind: KIND,
    tagline,
    pitch,
    facts,
    decisions,
    limits,
    stack: uniqueStack,
    tags: (repo.topics ?? []).filter((t) => t !== config.optOutTopic).slice(0, 8),
    code: `${person.github}/${repo.name}`,
    ...(live ? { live: { url: live, frameable: false } } : {}),
    shots: [],
    icon: { glyph, from, to },
    updated: repo.pushed_at.slice(0, 7),
    asOf: repo.pushed_at.slice(0, 10),
    sources: ["github", "readme"],
  };

  const parsed = projectSchema.safeParse(entry);
  if (!parsed.success) return { skip: `does not fit the site's schema: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}` };
  if (!publishable(JSON.stringify({ ...entry, code: "", live: undefined }))) return { skip: "its text holds something the site never publishes (a phone number, an address, a link or a key)" };
  return { entry };
}

// ------------------------------------------------------------------ pictures

async function capture(entry) {
  if (!entry.live) return false;
  let chromium;
  let sharp;
  try {
    ({ chromium } = await import("@playwright/test"));
    sharp = (await import("sharp")).default;
  } catch {
    return false;
  }
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
    await page.goto(entry.live.url, { waitUntil: "load", timeout: 45_000 });
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(1200);
    const png = await page.screenshot({ type: "png" });
    const dir = join(ROOT, "public", "media", entry.id);
    mkdirSync(dir, { recursive: true });
    await sharp(png).resize({ width: 1280 }).webp({ quality: 80 }).toFile(join(dir, "overview.webp"));
    mkdirSync(join(ROOT, "public", "media", "og"), { recursive: true });
    await sharp(png).resize(1200, 630, { fit: "cover", position: "top" }).flatten({ background: "#ffffff" }).jpeg({ quality: 80, mozjpeg: true }).toFile(join(ROOT, "public", "media", "og", `${entry.id}.jpg`));
    return true;
  } catch (e) {
    console.log(`  no picture for ${entry.id}: ${String(e).split("\n")[0]}`);
    return false;
  } finally {
    await browser?.close();
  }
}

const shotFor = (entry) => ({
  src: `/media/${entry.id}/overview.webp`,
  alt: `The first screen of ${entry.name}'s live site, as it looked when this entry was made on ${dayMonthYear(entry.asOf)}.`,
});

// ------------------------------------------------------------------ files

const HEADER = `// GENERATED by scripts/sync-github.mjs from Uzair's public GitHub repositories. Do not edit by hand:
// the next sync overwrites it. To leave a repository out, add its name to "ignore" in
// github-sync.config.json or give it the "${config.optOutTopic}" topic on GitHub. To write a project up
// properly, add it to projects.ts; the sync then drops its entry here.

import type { Project } from "./schema";

export const githubProjects: Project[] = `;

const readState = () => (existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : { repos: {} });
const writeOut = (entries) => writeFileSync(OUT, `${HEADER}${JSON.stringify(entries, null, 2)};\n`);
const writeState = (state) => writeFileSync(STATE, `${JSON.stringify({ repos: Object.fromEntries(Object.entries(state.repos).sort(([a], [b]) => a.localeCompare(b))) }, null, 2)}\n`);
const removeMedia = (id) => {
  rmSync(join(ROOT, "public", "media", id), { recursive: true, force: true });
  rmSync(join(ROOT, "public", "media", "og", `${id}.jpg`), { force: true });
};

// ------------------------------------------------------------------ the run

const curated = allProjects.filter((p) => p.kind !== KIND);
const existing = new Map(allProjects.filter((p) => p.kind === KIND).map((p) => [p.id, p]));
const curatedRepos = new Set(curated.map((p) => p.code.toLowerCase()));
const curatedIds = new Set(curated.map((p) => p.id));

if (mode === "hold") {
  // The site's checks failed with this run's entries in place: put back what was there before, and do
  // not try these versions again. A repository is tried again as soon as it changes on GitHub.
  if (!existsSync(RESULT)) throw new Error("nothing to hold: no sync has run here");
  const result = JSON.parse(readFileSync(RESULT, "utf8"));
  const state = readState();
  const entries = new Map(existing);
  for (const change of result.changes) {
    if (change.previous) entries.set(change.id, change.previous);
    else {
      entries.delete(change.id);
      if (!curatedIds.has(change.id)) removeMedia(change.id);
    }
    state.repos[change.repo] = { ...state.repos[change.repo], id: change.previous ? change.id : undefined, held: "the site's own checks failed with this entry in place" };
    console.log(`held back ${change.repo}`);
  }
  writeOut([...entries.values()]);
  writeState(state);
  process.exit(0);
}

const owner = new URL(person.github).pathname.replace(/\//g, "");
const repos = await listRepos(owner);
const state = readState();
const next = { repos: {} };
const entries = [];
const changes = [];
const log = [];

for (const repo of repos.sort((a, b) => b.created_at.localeCompare(a.created_at))) {
  const why = repo.fork
    ? "fork"
    : repo.archived
      ? "archived"
      : repo.private
        ? "private"
        : repo.is_template
          ? "template"
          : repo.size === 0
            ? "empty"
            : repo.name.toLowerCase() === owner.toLowerCase()
              ? "profile repository"
              : config.ignore.map((n) => n.toLowerCase()).includes(repo.name.toLowerCase())
                ? "in the ignore list"
                : (repo.topics ?? []).includes(config.optOutTopic)
                  ? `has the ${config.optOutTopic} topic`
                  : curatedRepos.has(`${person.github}/${repo.name}`.toLowerCase())
                    ? "written up by hand"
                    : null;
  if (why) {
    if (why !== "written up by hand" && why !== "fork") log.push(`skip ${repo.name}: ${why}`);
    continue;
  }

  // One call for each repository that is not written up by hand: which version of its README is current.
  const readmeFile = await gh(`/repos/${owner}/${repo.name}/readme`);
  const print = fingerprint(repo, readmeFile?.sha);
  const before = state.repos[repo.name];
  if (before && before.fingerprint === print) {
    // Nothing changed on GitHub since the last look: keep what is there (an entry, or the reason there is none).
    next.repos[repo.name] = before;
    const kept = before.id ? existing.get(before.id) : undefined;
    if (kept) entries.push(kept);
    continue;
  }

  if (mode === "check") {
    changes.push({ repo: repo.name });
    continue;
  }

  const readme = readmeFile?.content ? Buffer.from(readmeFile.content, "base64").toString("utf8") : "";
  const languages = (await gh(`/repos/${owner}/${repo.name}/languages`)) ?? {};
  const taken = new Set([...curatedIds, ...entries.map((e) => e.id)]);
  const made = makeEntry(repo, readme, languages, taken);
  const previous = before?.id ? existing.get(before.id) : undefined;

  if (made.skip) {
    log.push(`skip ${repo.name}: ${made.skip}`);
    next.repos[repo.name] = { fingerprint: print, skipped: made.skip };
    if (previous) changes.push({ repo: repo.name, id: previous.id, previous, removed: true });
    continue;
  }

  const entry = made.entry;
  const hadShot = Boolean(previous?.shots.length) && previous.live?.url === entry.live?.url;
  if (hadShot) entry.shots = previous.shots;
  else if (entry.live && mode === "write" && (await capture(entry))) entry.shots = [shotFor(entry)];

  entries.push(entry);
  next.repos[repo.name] = { fingerprint: print, id: entry.id };
  changes.push({ repo: repo.name, id: entry.id, previous: previous ?? null });
  log.push(`${previous ? "update" : "add"} ${repo.name} -> ${entry.id}${entry.shots.length ? " (with a picture)" : ""}`);
}

// Entries whose repository is gone, private now, ignored, or written up by hand since.
const kept = new Set(entries.map((e) => e.id));
for (const [id, old] of existing) {
  if (kept.has(id)) continue;
  const repoName = old.code.split("/").pop();
  if (!changes.some((c) => c.id === id)) changes.push({ repo: repoName, id, previous: old, removed: true });
  log.push(`remove ${id}`);
  if (mode === "write" && !curatedIds.has(id)) removeMedia(id);
}

if (mode !== "check") for (const line of log) console.log(line);

if (mode === "check") {
  const changed = changes.length > 0;
  console.log(changed ? `changed: ${[...new Set(changes.map((c) => c.repo))].join(", ")}` : "nothing to do");
  if (process.env.GITHUB_OUTPUT) writeFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`, { flag: "a" });
  process.exit(0);
}

if (mode === "dry") {
  console.log(JSON.stringify(entries.filter((e) => changes.some((c) => c.id === e.id)), null, 2));
  process.exit(0);
}

writeOut(entries);
writeState(next);
mkdirSync(dirname(RESULT), { recursive: true });
writeFileSync(RESULT, JSON.stringify({ changes: changes.filter((c) => c.id) }, null, 2));

const added = changes.filter((c) => c.id && !c.previous && !c.removed).map((c) => c.id);
const updated = changes.filter((c) => c.id && c.previous && !c.removed).map((c) => c.id);
const removed = changes.filter((c) => c.removed).map((c) => c.id);
const summary = [added.length && `added ${added.join(", ")}`, updated.length && `updated ${updated.join(", ")}`, removed.length && `removed ${removed.join(", ")}`].filter(Boolean).join("; ");
console.log(summary ? `Sync projects from GitHub: ${summary}` : "nothing to do");
if (process.env.GITHUB_OUTPUT) writeFileSync(process.env.GITHUB_OUTPUT, `summary=${summary}\n`, { flag: "a" });
