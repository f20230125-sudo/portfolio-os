import type { Entity } from "./entities";

export type Intent =
  | "greeting"
  | "thanks"
  | "goodbye"
  | "about_assistant"
  | "injection"
  | "off_topic"
  | "unknown_topic"
  | "identity"
  | "projects_list"
  | "project"
  | "skill_usage"
  | "experience"
  | "education"
  | "research"
  | "skills"
  | "contact"
  | "resume"
  | "more"
  | "retrieval"
  | "unsure";

export interface SourceChip {
  label: string;
  /** The window id to open: "sayso" is "project:sayso". */
  app: string;
  tab?: "overview" | "live" | "details";
}

export type ActionKind = "open" | "link" | "mail" | "ask" | "download";

export interface Action {
  kind: ActionKind;
  label: string;
  /** A window id for open, a URL for link, mail and download, a question for ask. */
  target: string;
  tab?: "overview" | "live" | "details";
}

export type Block = { type: "p"; text: string } | { type: "list"; items: string[] } | { type: "note"; text: string };

export interface Hit {
  id: string;
  title: string;
  score: number;
}

export interface Explanation {
  normalized: string;
  intent: Intent;
  reason: string;
  entities: Entity[];
  hits: Hit[];
  /** How much of what was asked the best passage covered, 0 to 1. */
  coverage: number;
}

export interface Answer {
  /** Whether the answer comes from something Uzair wrote, as opposed to a polite decline. */
  grounded: boolean;
  blocks: Block[];
  sources: SourceChip[];
  actions: Action[];
  followups: string[];
  explain: Explanation;
}

/** What the assistant remembers between questions in one conversation. */
export interface Context {
  topic: string | null;
  /** Passages already said, so "tell me more" brings something new. */
  seen: string[];
  turns: number;
}

export const emptyContext = (): Context => ({ topic: null, seen: [], turns: 0 });
