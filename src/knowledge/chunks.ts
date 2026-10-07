import { faqs } from "./faq";
import { certifications, education, experience, person, research, skillGroups } from "./profile";
import { projects } from "./projects";
import type { SourceKind } from "./schema";

// The knowledge, cut into short passages the assistant can find and quote.
// Everything is generated from the typed data, so a fact written once shows up
// in the window, in the simple view and in an answer.

export type ChunkKind =
  | "overview"
  | "fact"
  | "decision"
  | "limit"
  | "stack"
  | "bio"
  | "habit"
  | "education"
  | "experience"
  | "research"
  | "skills"
  | "contact"
  | "availability"
  | "faq";

export interface Chunk {
  id: string;
  kind: ChunkKind;
  /** What the passage is about: a project id, or "person", "research", and so on. */
  topic: string;
  title: string;
  text: string;
  /** Extra words that should find this passage; they weigh more than the text. */
  keywords: string[];
  /** The window that backs the passage up, and which tab of it. */
  app?: string;
  tab?: "overview" | "live" | "details";
  sources: SourceKind[];
  /** Set where the text holds numbers that change as the code does. */
  asOf?: string;
}

const list = (items: readonly string[]): string => {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
};

function projectChunks(): Chunk[] {
  const out: Chunk[] = [];
  for (const p of projects) {
    const app = `project:${p.id}`;
    out.push({
      id: `${p.id}:overview`,
      kind: "overview",
      topic: p.id,
      title: p.name,
      text: `${p.name}: ${p.tagline} ${p.pitch}`,
      keywords: [...p.aliases, ...p.tags, p.name],
      app,
      tab: "overview",
      sources: p.sources,
    });
    p.facts.forEach((fact, i) =>
      out.push({
        id: `${p.id}:fact:${i}`,
        kind: "fact",
        topic: p.id,
        title: p.name,
        text: fact,
        keywords: [p.name, ...p.aliases],
        app,
        tab: "overview",
        sources: p.sources,
        asOf: /\btests?\b|\d/.test(fact) ? p.asOf : undefined,
      }),
    );
    p.decisions.forEach((d, i) =>
      out.push({
        id: `${p.id}:decision:${i}`,
        kind: "decision",
        topic: p.id,
        title: `${p.name}, a decision`,
        text: d,
        keywords: ["decision", "design", "why", "built", "architecture", p.name, ...p.aliases],
        app,
        tab: "details",
        sources: p.sources,
      }),
    );
    if (p.limits.length > 0) {
      out.push({
        id: `${p.id}:limits`,
        kind: "limit",
        topic: p.id,
        title: `${p.name}, limits`,
        text: p.limits.join(" "),
        keywords: ["limit", "limits", "limitation", "weakness", "cannot", "does not", "missing", "problem", "caveat", p.name, ...p.aliases],
        app,
        tab: "details",
        sources: p.sources,
      });
    }
    out.push({
      id: `${p.id}:stack`,
      kind: "stack",
      topic: p.id,
      title: `${p.name}, stack`,
      text: `${p.name} is built with ${list(p.stack)}.`,
      keywords: ["stack", "built with", "technology", "technologies", "tech", "language", "framework", "libraries", p.name, ...p.aliases, ...p.stack],
      app,
      tab: "overview",
      sources: p.sources,
    });
  }
  return out;
}

function personChunks(): Chunk[] {
  const c: Chunk[] = [];
  c.push({
    id: "person:bio",
    kind: "bio",
    topic: "person",
    title: "About Uzair",
    text: person.summary,
    keywords: ["who", "about", "bio", "introduce", "tell me about", "summary", "background", "profile", person.name, person.short],
    app: "about",
    sources: ["cv", "linkedin", "github"],
  });
  c.push({
    id: "person:location",
    kind: "bio",
    topic: "person",
    title: "Where he is based",
    text: `Uzair is based in ${person.location}, studying at BITS Pilani, Dubai Campus.`,
    keywords: ["where", "location", "based", "live", "lives", "city", "country", "dubai", "uae", "time zone", "timezone"],
    app: "about",
    sources: ["cv", "linkedin"],
  });
  person.habits.forEach((h, i) =>
    c.push({
      id: `person:habit:${i}`,
      kind: "habit",
      topic: "person",
      title: "How he builds",
      text: h,
      keywords: ["habit", "habits", "style", "approach", "philosophy", "principles", "how he builds", "engineering", "values"],
      app: "about",
      sources: ["readme", "cv"],
    }),
  );

  const u = education.university;
  c.push({
    id: "education:university",
    kind: "education",
    topic: "education",
    title: "University",
    text: `Uzair studies ${u.degree} at ${u.name}. He started in ${u.started} and expects to graduate in ${u.expected}.`,
    keywords: ["education", "university", "college", "degree", "study", "studies", "student", "bits", "pilani", "graduate", "graduation", "year", "batch", "major"],
    app: "resume",
    sources: ["cv", "linkedin"],
  });
  c.push({
    id: "education:coursework",
    kind: "education",
    topic: "education",
    title: "Coursework",
    text: `Relevant coursework: ${list(u.coursework)}.`,
    keywords: ["coursework", "courses", "subjects", "classes", "modules", "curriculum", "learned", "taken"],
    app: "resume",
    sources: ["cv"],
  });
  const s = education.school;
  c.push({
    id: "education:school",
    kind: "education",
    topic: "education",
    title: "School",
    text: `Before university he finished ${s.level} at ${s.name} in ${s.place}, in ${s.year}.`,
    keywords: ["school", "high school", "secondary", "class xii", "12th", "twelfth", "bareilly", "india", "previous education"],
    app: "resume",
    sources: ["cv"],
  });

  for (const e of experience) {
    c.push({
      id: `experience:${e.id}`,
      kind: "experience",
      topic: "experience",
      title: `${e.role} at ${e.org}`,
      text: `Uzair was a ${e.role} at ${e.org}, ${e.orgNote}, from ${e.when}, through ${e.program}.`,
      keywords: ["experience", "work", "job", "jobs", "intern", "internship", "employment", "worked", "career", "company", "amaani", "professional", "travel", "startup"],
      app: "resume",
      sources: [...e.sources],
    });
    e.bullets.forEach((b, i) =>
      c.push({
        id: `experience:${e.id}:${i}`,
        kind: "experience",
        topic: "experience",
        title: `${e.org}, what he did`,
        text: b,
        keywords: ["amaani", "intern", "internship", "backend", "flask", "rest", "api", "swagger", "openapi", "postman", "work", "did", "responsibilities"],
        app: "resume",
        sources: [...e.sources],
      }),
    );
  }

  c.push({
    id: "research:overview",
    kind: "research",
    topic: "research",
    title: research.title,
    text: `${research.role} on a paper: "${research.title}". Status: ${research.status}. ${research.summary}`,
    keywords: ["research", "paper", "publication", "published", "ieee", "msn", "edge", "tomato", "plant", "mobilenetv2", "raspberry pi", "first author", "deep learning", "advisor", "thesis"],
    app: "research",
    sources: ["cv", "linkedin", "github"],
  });
  c.push({
    id: "research:accuracy",
    kind: "research",
    topic: "research",
    title: "Research results",
    text: "The model reached 97.33% test accuracy on 10 disease classes of the PlantVillage dataset, with a macro-F1 of 0.963 and a mean AUC of 0.994.",
    keywords: ["accuracy", "results", "f1", "auc", "score", "performance", "97.33", "metrics", "paper"],
    app: "research",
    sources: ["cv"],
  });
  c.push({
    id: "research:edge",
    kind: "research",
    topic: "research",
    title: "Research on the Raspberry Pi",
    text: "INT8 post-training quantisation with TensorFlow Lite compressed the model to 5.3 MB and 1.4 million parameters with negligible accuracy loss. On a Raspberry Pi 4B it runs in about 250 ms per image, roughly 3.6 frames per second at about 3.2 W.",
    keywords: ["raspberry pi", "edge", "quantization", "quantisation", "int8", "tflite", "latency", "fps", "power", "deployment", "size", "compressed"],
    app: "research",
    sources: ["cv"],
  });

  c.push({
    id: "certifications",
    kind: "education",
    topic: "education",
    title: "Certifications",
    text: `Certifications: ${certifications.map((x) => `${x.name} (${x.by}${x.when ? `, ${x.when}` : ""}, ${x.status})`).join("; ")}.`,
    keywords: ["certification", "certifications", "certificate", "certificates", "courses", "coursera", "aws", "codewithharry", "data science"],
    app: "resume",
    sources: ["cv"],
  });

  for (const g of skillGroups) {
    const names = g.skills.map((x) => x.name);
    c.push({
      id: `skills:${g.id}`,
      kind: "skills",
      topic: "skills",
      title: g.label,
      text: `${g.label}: ${list(names)}.`,
      keywords: ["skills", "skill", "technologies", "tech", "stack", "know", "knows", "tools", "proficient", g.label, ...g.skills.flatMap((x) => [x.name, ...(x.aliases ?? [])])],
      app: "resume",
      sources: ["cv"],
    });
  }

  c.push({
    id: "contact:email",
    kind: "contact",
    topic: "contact",
    title: "How to contact him",
    text: `Email is best: ${person.email}. He is also on LinkedIn (linkedin.com/in/mohammad-uzair-khan-2b24b0355) and GitHub (github.com/${person.githubHandle}).`,
    keywords: ["contact", "email", "mail", "reach", "linkedin", "github", "message", "get in touch", "hire", "social", "profile", "links"],
    app: "contact",
    sources: ["cv", "linkedin", "github"],
  });
  c.push({
    id: "availability",
    kind: "availability",
    topic: "contact",
    title: "Availability",
    text: `${person.openToWork} He expects to graduate in ${education.university.expected}. For role types, start dates or notice, email him.`,
    keywords: ["available", "availability", "open to work", "hire", "hiring", "job", "looking", "internship", "full-time", "full time", "remote", "hybrid", "on-site", "onsite", "relocate", "start date", "notice"],
    app: "contact",
    sources: ["linkedin"],
  });
  c.push({
    id: "person:learning",
    kind: "bio",
    topic: "person",
    title: "What he is learning",
    text: `He is going deeper on ${list(person.learning)}.`,
    keywords: ["learning", "studying", "next", "currently", "now", "growing", "interested"],
    app: "about",
    sources: ["linkedin", "github"],
  });

  for (const f of faqs) {
    c.push({
      id: `faq:${f.id}`,
      kind: "faq",
      topic: f.id,
      title: f.questions[0],
      text: f.answer,
      keywords: f.questions,
      app: f.app,
      sources: f.sources,
    });
  }
  return c;
}

export const chunks: Chunk[] = [...projectChunks(), ...personChunks()];

export const chunkById = new Map(chunks.map((c) => [c.id, c]));
