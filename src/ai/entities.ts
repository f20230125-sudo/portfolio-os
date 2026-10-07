import { projects } from "@/knowledge/projects";
import { skillGroups } from "@/knowledge/profile";
import { normalize } from "./text";

// Spotting the things a question is about: a project, a technology, an
// organisation. The longest phrase wins, so "quant trading copilot" is Quant
// Copilot and not the AI Trading Copilot that "trading copilot" would find.

export type EntityKind = "project" | "skill" | "org";

export interface Entity {
  kind: EntityKind;
  /** A project id, a skill name, or an organisation key. */
  id: string;
  label: string;
  /** What the visitor wrote that matched, after normalising. */
  phrase: string;
}

interface Entry {
  kind: EntityKind;
  id: string;
  label: string;
  phrase: string;
}

const ORGS: { id: string; label: string; phrases: string[] }[] = [
  { id: "bits", label: "BITS Pilani", phrases: ["bits pilani", "bits", "pilani", "bits dubai"] },
  { id: "amaani", label: "Amaani", phrases: ["amaani"] },
  { id: "ieee", label: "the IEEE paper", phrases: ["ieee", "ieee msn", "msn 2026"] },
  { id: "deriv", label: "Deriv", phrases: ["deriv"] },
  { id: "raspberry-pi", label: "Raspberry Pi", phrases: ["raspberry pi", "raspberry", "mobilenetv2", "mobilenet"] },
  { id: "linkedin", label: "LinkedIn", phrases: ["linkedin"] },
  { id: "github", label: "GitHub", phrases: ["github profile", "his github", "github account"] },
];

function buildEntries(): Entry[] {
  const out: Entry[] = [];
  const add = (kind: EntityKind, id: string, label: string, raw: string) => {
    const phrase = normalize(raw);
    if (phrase.length >= 2) out.push({ kind, id, label, phrase });
  };
  for (const p of projects) {
    add("project", p.id, p.name, p.name);
    for (const a of p.aliases) add("project", p.id, p.name, a);
  }
  for (const g of skillGroups) {
    for (const s of g.skills) {
      // "NumPy and pandas" and "Swagger/OpenAPI and Postman" are several tools.
      const parts = s.name.split(/\s+and\s+|\//).map((x) => x.trim());
      for (const part of parts) add("skill", s.name, s.name, part);
      add("skill", s.name, s.name, s.name);
      for (const a of s.aliases ?? []) add("skill", s.name, s.name, a);
    }
  }
  for (const o of ORGS) for (const phrase of o.phrases) add("org", o.id, o.label, phrase);
  // Longest first, so a longer phrase claims its words before a shorter one can.
  return out.sort((a, b) => b.phrase.length - a.phrase.length);
}

const ENTRIES = buildEntries();

/** Skill names too common in ordinary questions to count as being asked about. */
const TOO_GENERIC = new Set(["c", "pi", "next", "ts", "js", "py", "tf", "rest", "git", "ci", "css", "svg", "charts", "agents", "deployment", "hosting", "apis"]);

export function findEntities(normalized: string): Entity[] {
  const found: Entity[] = [];
  let rest = ` ${normalized} `;
  for (const e of ENTRIES) {
    if (e.kind === "skill" && TOO_GENERIC.has(e.phrase)) continue;
    const needle = ` ${e.phrase} `;
    if (!rest.includes(needle)) continue;
    // Take the words out so nothing shorter matches inside them.
    rest = rest.split(needle).join(" ".repeat(1));
    if (!found.some((f) => f.kind === e.kind && f.id === e.id)) {
      found.push({ kind: e.kind, id: e.id, label: e.label, phrase: e.phrase });
    }
  }
  return found;
}
