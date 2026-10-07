import { z } from "zod";

// The shape of everything the site knows about Uzair. The desktop, the simple
// view and the assistant all read the same data, so they cannot disagree.
// Only the tests import this file at run time (to check the data); the site
// itself imports its types, which cost nothing in the bundle.

/** Where a fact came from. Nothing is published without one. */
export const sourceKind = z.enum(["cv", "readme", "linkedin", "github", "told"]);
export type SourceKind = z.infer<typeof sourceKind>;

export const projectKind = z.enum(["flagship", "llm", "quant", "data", "play"]);
export type ProjectKind = z.infer<typeof projectKind>;

/** The picture on a project's icon tile: a lucide icon name and two colours. */
export const iconSpec = z.object({
  glyph: z.string(),
  from: z.string(),
  to: z.string(),
});
export type IconSpec = z.infer<typeof iconSpec>;

export const media = z.object({
  src: z.string().startsWith("/media/"),
  alt: z.string().min(10),
});

export const liveSpec = z.object({
  url: z.url(),
  /** True once the site is known to allow being shown in a frame here. */
  frameable: z.boolean(),
  /** Only Sayso listens for the microphone. */
  microphone: z.boolean().optional(),
  /** One line under the frame, when what you do inside is kept apart from the real site. */
  note: z.string().optional(),
});
export type LiveSpec = z.infer<typeof liveSpec>;

export const project = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  /** Other names people use for it: "the airline one", "patch". */
  aliases: z.array(z.string()),
  kind: projectKind,
  tagline: z.string().max(140),
  pitch: z.string().min(40),
  /** Short, checkable claims: numbers, behaviours. */
  facts: z.array(z.string()).min(2),
  /** How it is built, and why. */
  decisions: z.array(z.string()),
  /** What it does not do, said plainly. */
  limits: z.array(z.string()),
  stack: z.array(z.string()).min(1),
  /** Words a visitor might use for it that are not in the text above. */
  tags: z.array(z.string()),
  code: z.url(),
  live: liveSpec.optional(),
  /** A page on the web that shows it working but is not framed here. */
  demoUrl: z.url().optional(),
  gif: media.optional(),
  shots: z.array(media),
  icon: iconSpec,
  /** Month of the last push, "2026-10". */
  updated: z.string().regex(/^\d{4}-\d{2}$/),
  /** Numbers in the text are true as of this day. */
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sources: z.array(sourceKind).min(1),
});
export type Project = z.infer<typeof project>;

export const skillGroup = z.object({
  id: z.string(),
  label: z.string(),
  skills: z.array(
    z.object({
      name: z.string(),
      aliases: z.array(z.string()).optional(),
      /** Ids of the projects that use it. */
      usedIn: z.array(z.string()),
      note: z.string().optional(),
    }),
  ),
});
export type SkillGroup = z.infer<typeof skillGroup>;

export const faq = z.object({
  id: z.string(),
  /** How a visitor might ask it. The first is shown as a suggestion. */
  questions: z.array(z.string()).min(1),
  answer: z.string().min(20),
  /** The window that backs the answer up. */
  app: z.string().optional(),
  sources: z.array(sourceKind).min(1),
});
export type Faq = z.infer<typeof faq>;

/** Things the site deliberately does not say, and what to answer instead. */
export const unknownTopic = z.object({
  id: z.string(),
  /** Words that bring the topic up. */
  triggers: z.array(z.string()),
  answer: z.string(),
});
export type UnknownTopic = z.infer<typeof unknownTopic>;
