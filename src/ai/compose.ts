import { chunkById, chunks, type Chunk } from "@/knowledge/chunks";
import { education, experience, person, research, skillGroups } from "@/knowledge/profile";
import { flagship, olderProjects, projectById, projects, type Project } from "@/knowledge/projects";
import { passageCount } from "./retrieve";
import type { Action, Block, SourceChip } from "./types";

// Building the pieces of an answer from the knowledge: the lines, the source
// chips that open the matching window, the buttons, and the follow-up
// questions. No searching happens here.

export const ASOF_LABEL = "7 October 2026";

export const STARTERS = [
  "What projects has he built?",
  "Tell me about his research",
  "Where has he worked?",
  "How can I contact him?",
  "What is he looking for?",
];

const text = (c: Chunk | undefined): string => (c ? c.text.replace("{{chunks}}", String(passageCount)) : "");

export const para = (t: string): Block => ({ type: "p", text: t });

export function chip(c: Chunk): SourceChip | null {
  if (!c.app) return null;
  if (c.app.startsWith("project:")) {
    const p = projectById(c.app.slice("project:".length));
    return { label: p ? `${p.name}` : c.title, app: c.app, tab: c.tab };
  }
  return { label: appLabel(c.app), app: c.app };
}

export function appLabel(app: string): string {
  switch (app) {
    case "about":
      return "About";
    case "resume":
      return "Resume";
    case "research":
      return "Research";
    case "contact":
      return "Contact";
    case "projects":
      return "Projects";
    case "settings":
      return "Settings";
    case "ask":
      return "Ask Uzair";
    default:
      return app.startsWith("project:") ? (projectById(app.slice(8))?.name ?? app) : app;
  }
}

export function uniqueChips(used: Chunk[], max = 3): SourceChip[] {
  const out: SourceChip[] = [];
  for (const c of used) {
    const s = chip(c);
    if (!s) continue;
    if (out.some((o) => o.app === s.app && o.tab === s.tab)) continue;
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

/** A note about when counted figures were true, if the passages used hold any. */
export function asOfNote(used: Chunk[]): Block | null {
  const counted = used.some((c) => c.asOf && /\btests?\b/i.test(c.text) && /\d/.test(c.text));
  return counted ? { type: "note", text: `Test counts are as of ${ASOF_LABEL}.` } : null;
}

export function projectActions(p: Project, opts: { openFirst?: boolean } = {}): Action[] {
  const out: Action[] = [{ kind: "open", label: `Open ${p.name}`, target: `project:${p.id}` }];
  if (p.live) {
    if (p.live.frameable) out.push({ kind: "open", label: "Run it here", target: `project:${p.id}`, tab: "live" });
    else out.push({ kind: "link", label: "Live site", target: p.live.url });
  }
  out.push({ kind: "link", label: "Code on GitHub", target: p.code });
  return opts.openFirst ? out : out.slice(0, 3);
}

export function contactActions(): Action[] {
  return [
    { kind: "mail", label: "Email Uzair", target: `mailto:${person.email}` },
    { kind: "link", label: "LinkedIn", target: person.linkedin },
    { kind: "link", label: "GitHub", target: person.github },
  ];
}

export function projectsListBlocks(): Block[] {
  return [
    para("These are the four flagship projects. Each opens in its own window with a demo, the numbers and the decisions behind it:"),
    { type: "list", items: flagship.map((p) => `${p.name}: ${p.tagline}`) },
    para(`There are ${olderProjects.length} older builds in the Projects folder too, from RAG services and a trading research desk to a data warehouse, a chatbot and a game.`),
  ];
}

export function skillBlocks(name: string): { blocks: Block[]; used: Project[]; groupLabel: string } | null {
  for (const g of skillGroups) {
    const s = g.skills.find((x) => x.name === name);
    if (!s) continue;
    const used = s.usedIn.map((id) => projectById(id)).filter((p): p is Project => Boolean(p));
    const blocks: Block[] = [];
    if (used.length > 0) {
      const names = used.map((p) => p.name);
      const head = names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
      blocks.push(para(`${s.name} is on his CV under ${g.label}, and he uses it in ${head}.`));
    } else {
      blocks.push(para(`${s.name} is on his CV under ${g.label}.${s.note ? "" : " No project here is built mainly with it."}`));
    }
    if (s.note) blocks.push(para(s.note));
    return { blocks, used, groupLabel: g.label };
  }
  return null;
}

export function skillsOverviewBlocks(): Block[] {
  return [
    para("His CV groups his skills like this:"),
    {
      type: "list",
      items: skillGroups.map((g) => `${g.label}: ${g.skills.map((s) => s.name).join(", ")}`),
    },
  ];
}

export function educationBlocks(): Block[] {
  const u = education.university;
  return [
    para(`Uzair studies ${u.degree} at ${u.name}, where he started in ${u.started} and expects to graduate in ${u.expected}.`),
    para(`Relevant coursework: ${u.coursework.join(", ")}.`),
  ];
}

export function experienceBlocks(): Block[] {
  const e = experience[0];
  return [
    para(`${e.role} at ${e.org}, ${e.orgNote}, ${e.when}, through ${e.program}.`),
    { type: "list", items: [...e.bullets] },
  ];
}

export function researchBlocks(): Block[] {
  return [
    para(`${research.role} on "${research.title}". Status: ${research.status}. ${research.summary}`),
    { type: "list", items: research.metrics.slice(0, 4).map((m) => `${m.label}: ${m.value}${m.note ? ` (${m.note})` : ""}`) },
  ];
}

export function bioBlocks(): Block[] {
  return [para(person.summary), para(person.openToWork)];
}

/** Questions worth asking next, given what was just talked about. */
export function followupsFor(topic: string | null, seen: ReadonlySet<string>): string[] {
  const out: string[] = [];
  const p = topic ? projectById(topic) : undefined;
  if (p) {
    if (!seen.has(`${p.id}:stack`)) out.push(`What is ${p.name} built with?`);
    if (p.decisions.length > 0 && !p.decisions.some((_, i) => seen.has(`${p.id}:decision:${i}`))) out.push(`What were the key decisions in ${p.name}?`);
    if (p.limits.length > 0 && !seen.has(`${p.id}:limits`)) out.push(`What are the limits of ${p.name}?`);
    if (p.live) out.push(`Where can I try ${p.name}?`);
    out.push("What else has he built?");
    return out.slice(0, 3);
  }
  switch (topic) {
    case "education":
      return ["Tell me about his research", "Where has he worked?", "What does he know?"];
    case "experience":
      return ["Tell me about his research", "What projects has he built?", "What backend experience does he have?"];
    case "research":
      return ["Where has he worked?", "What projects has he built?", "How was the model deployed?"];
    case "skills":
      return ["Where did he use Redux?", "What projects has he built?", "Which project should I look at first?"];
    case "contact":
      return ["What projects has he built?", "Tell me about his research", "Which project should I look at first?"];
    case "projects":
      return ["Which project should I look at first?", "Tell me about Sayso", "What did he build for fun?"];
    case "person":
      return ["What projects has he built?", "What makes his projects different?", "What is he looking for?"];
    default:
      return ["What projects has he built?", "Tell me about his research", "How can I contact him?"];
  }
}

export function findChunks(ids: string[]): Chunk[] {
  return ids.map((id) => chunkById.get(id)).filter((c): c is Chunk => Boolean(c));
}

export const allProjects = projects;
export const chunkText = text;
export const chunkTotal = chunks.length;
