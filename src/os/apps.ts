import { flagship, projectById, projects } from "@/knowledge/projects";
import type { IconSpec } from "@/knowledge/schema";
import type { Size } from "./geometry";

// Everything that can be opened in a window. A project is an app too: its id is
// "project:" followed by the project id, so a window, a taskbar button and an
// answer's source chip all name it the same way.

export interface AppDef {
  id: string;
  title: string;
  icon: IconSpec;
  /** The size it opens at, before the screen's limits are applied. */
  size: Size;
  kind: "app" | "project";
  /** Where it opens on a wide screen: the middle, or the right-hand side. */
  anchor?: "right";
  /** Extra words that find it in Start. */
  keywords: string[];
  blurb: string;
}

const APPS: AppDef[] = [
  {
    id: "ask",
    title: "Ask Uzair",
    icon: { glyph: "Sparkles", from: "#2563eb", to: "#7c3aed" },
    size: { w: 460, h: 640 },
    kind: "app",
    anchor: "right",
    keywords: ["assistant", "ai", "chat", "question", "help", "search"],
    blurb: "Ask anything about Uzair",
  },
  {
    id: "projects",
    title: "Projects",
    icon: { glyph: "FolderOpen", from: "#d97706", to: "#fbbf24" },
    size: { w: 980, h: 560 },
    kind: "app",
    keywords: ["folder", "work", "portfolio", "explorer", "files", "builds"],
    blurb: "Every project, in one folder",
  },
  {
    id: "about",
    title: "About",
    icon: { glyph: "UserRound", from: "#0369a1", to: "#38bdf8" },
    size: { w: 760, h: 560 },
    kind: "app",
    keywords: ["bio", "who", "me", "profile", "uzair"],
    blurb: "Who Uzair is",
  },
  {
    id: "resume",
    title: "Resume",
    icon: { glyph: "FileText", from: "#475569", to: "#94a3b8" },
    size: { w: 780, h: 620 },
    kind: "app",
    keywords: ["cv", "education", "experience", "skills", "curriculum"],
    blurb: "Education, experience and skills",
  },
  {
    id: "research",
    title: "Research",
    icon: { glyph: "FlaskConical", from: "#047857", to: "#34d399" },
    size: { w: 760, h: 600 },
    kind: "app",
    keywords: ["paper", "ieee", "publication", "edge", "mobilenet", "raspberry"],
    blurb: "First-author IEEE submission",
  },
  {
    id: "contact",
    title: "Contact",
    icon: { glyph: "Mail", from: "#be185d", to: "#f472b6" },
    size: { w: 560, h: 520 },
    kind: "app",
    keywords: ["email", "mail", "linkedin", "github", "hire", "reach"],
    blurb: "Email, LinkedIn and GitHub",
  },
  {
    id: "settings",
    title: "Settings",
    icon: { glyph: "Settings", from: "#334155", to: "#64748b" },
    size: { w: 560, h: 480 },
    kind: "app",
    keywords: ["theme", "dark", "light", "motion", "personalise", "simple view"],
    blurb: "Theme, motion and simple view",
  },
];

const PROJECT_APPS: AppDef[] = projects.map((p) => ({
  id: `project:${p.id}`,
  title: p.name,
  icon: p.icon,
  size: p.kind === "flagship" ? { w: 1080, h: 720 } : { w: 820, h: 600 },
  kind: "project",
  keywords: [...p.aliases, ...p.tags, ...p.stack],
  blurb: p.tagline,
}));

export const ALL_APPS: AppDef[] = [...APPS, ...PROJECT_APPS];

const byId = new Map(ALL_APPS.map((a) => [a.id, a]));

export function appDef(id: string): AppDef | undefined {
  return byId.get(id);
}

/** The icons on the desktop, top to bottom, left column first: his projects, then the rest. */
export const DESKTOP_ORDER: string[] = [...flagship.map((p) => `project:${p.id}`), "projects", "ask", "about", "resume", "research", "contact"];

/** What Start pins, in order. */
export const PINNED: string[] = ["ask", "projects", "about", "resume", "research", "contact", ...flagship.map((p) => `project:${p.id}`), "settings"];

/** The buttons that stay on the taskbar even when nothing is open. */
export const TASKBAR_PINNED: string[] = ["ask", "projects", "about", "resume", "contact"];

/** A window id from a query string: "sayso" or "project:sayso" or "ask". */
export function resolveAppId(value: string): string | null {
  const v = value.trim().toLowerCase();
  if (byId.has(v)) return v;
  if (projectById(v)) return `project:${v}`;
  return null;
}
