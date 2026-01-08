import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ALL_APPS, appDef, DESKTOP_ORDER, PINNED, resolveAppId, TASKBAR_PINNED } from "@/os/apps";
import { chunks } from "./chunks";
import { faqs, unknowns } from "./faq";
import { certifications, education, experience, person, research, skillGroups } from "./profile";
import { flagship, olderProjects, projects } from "./projects";
import { faq, project, skillGroup, unknownTopic } from "./schema";

const publicDir = join(__dirname, "..", "..", "public");

describe("the data matches its schema", () => {
  it.each(projects.map((p) => [p.id, p] as const))("project %s", (_id, p) => {
    expect(project.safeParse(p).error?.issues ?? []).toEqual([]);
  });
  it.each(faqs.map((f) => [f.id, f] as const))("faq %s", (_id, f) => {
    expect(faq.safeParse(f).error?.issues ?? []).toEqual([]);
  });
  it.each(skillGroups.map((g) => [g.id, g] as const))("skill group %s", (_id, g) => {
    expect(skillGroup.safeParse(g).error?.issues ?? []).toEqual([]);
  });
  it.each(unknowns.map((u) => [u.id, u] as const))("unknown topic %s", (_id, u) => {
    expect(unknownTopic.safeParse(u).error?.issues ?? []).toEqual([]);
  });
});

describe("ids", () => {
  it("are unique", () => {
    const dup = (xs: string[]) => xs.filter((x, i) => xs.indexOf(x) !== i);
    expect(dup(projects.map((p) => p.id))).toEqual([]);
    expect(dup(chunks.map((c) => c.id))).toEqual([]);
    expect(dup(faqs.map((f) => f.id))).toEqual([]);
    expect(dup(ALL_APPS.map((a) => a.id))).toEqual([]);
  });

  it("every skill points at projects that exist", () => {
    const ids = new Set(projects.map((p) => p.id));
    const missing = skillGroups.flatMap((g) => g.skills.flatMap((s) => s.usedIn.filter((id) => !ids.has(id)).map((id) => `${s.name} -> ${id}`)));
    expect(missing).toEqual([]);
  });

  it("every passage points at a window that exists", () => {
    const missing = chunks.filter((c) => c.app && !appDef(c.app)).map((c) => `${c.id} -> ${c.app}`);
    expect(missing).toEqual([]);
  });

  it("every passage has a source, and numbers that change carry the day they were true", () => {
    expect(chunks.filter((c) => c.sources.length === 0).map((c) => c.id)).toEqual([]);
    const undated = chunks.filter((c) => /\btests?\b/.test(c.text) && /\d/.test(c.text) && c.kind === "fact" && !c.asOf).map((c) => c.id);
    expect(undated).toEqual([]);
  });
});

describe("what is on the desktop", () => {
  it("shows every flagship project, then the folder and the apps", () => {
    for (const p of flagship) expect(DESKTOP_ORDER).toContain(`project:${p.id}`);
    expect(DESKTOP_ORDER.slice(0, flagship.length)).toEqual(flagship.map((p) => `project:${p.id}`));
    for (const id of DESKTOP_ORDER) expect(appDef(id), id).toBeDefined();
  });

  it("every project, flagship or not, can be opened from the Projects folder and from Start's search", () => {
    for (const p of projects) expect(appDef(`project:${p.id}`), p.id).toBeDefined();
    expect(flagship.length + olderProjects.length).toBe(projects.length);
  });

  it("the pinned lists name real windows", () => {
    for (const id of [...PINNED, ...TASKBAR_PINNED]) expect(appDef(id), id).toBeDefined();
  });

  it("a link can name a window with or without the prefix", () => {
    expect(resolveAppId("sayso")).toBe("project:sayso");
    expect(resolveAppId("project:sayso")).toBe("project:sayso");
    expect(resolveAppId("ASK")).toBe("ask");
    expect(resolveAppId("../../etc/passwd")).toBeNull();
    expect(resolveAppId("")).toBeNull();
  });
});

describe("pictures", () => {
  const media = projects.flatMap((p) => [...(p.gif ? [p.gif] : []), ...p.shots].map((m) => [p.id, m.src] as const));
  it.each(media)("%s: %s exists", (_id, src) => {
    expect(existsSync(join(publicDir, src))).toBe(true);
  });
  it("every picture has alt text that says what it shows", () => {
    for (const p of projects) for (const m of [...(p.gif ? [p.gif] : []), ...p.shots]) expect(m.alt.length).toBeGreaterThan(20);
  });
});

describe("what must never be public", () => {
  const everything = JSON.stringify({ projects, faqs, unknowns, person, education, experience, research, certifications, skillGroups, chunks });

  it("holds no phone number", () => {
    // +971..., +91..., or any run of ten or more digits written like a phone number.
    expect(everything).not.toMatch(/\+\d[\d\s-]{8,}\d/);
    expect(everything).not.toMatch(/(?<![\d.])\d{3}[\s-]\d{3,4}[\s-]\d{3,4}(?![\d.])/);
  });

  it("names no email address except his public one", () => {
    const found = everything.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g) ?? [];
    expect([...new Set(found)]).toEqual([person.email]);
  });

  it("holds no grades or marks", () => {
    expect(everything).not.toMatch(/\bcgpa\b[^"]*\d/i);
    expect(everything).not.toMatch(/\b81\s?%/);
    expect(everything).not.toMatch(/7\.93|8\.5\+/);
  });

  it("holds no secret-looking strings", () => {
    expect(everything).not.toMatch(/AIza[\w-]{20,}|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|github_pat_/);
  });

  it("only links to sites he owns or that are well known", () => {
    const allowed = ["github.com", "linkedin.com", "vercel.app", "github.io", "raw.githubusercontent.com"];
    const urls = (JSON.stringify({ projects, person }).match(/https?:\/\/[^"\s)]+/g) ?? []).map((u) => new URL(u).hostname);
    for (const host of urls) expect(allowed.some((a) => host === a || host.endsWith(`.${a}`)), host).toBe(true);
  });

  it("every code link points at his own GitHub", () => {
    for (const p of projects) expect(p.code.startsWith(`${person.github}/`), p.id).toBe(true);
  });
});

describe("live sites", () => {
  it("are on https", () => {
    for (const p of projects) if (p.live) expect(p.live.url.startsWith("https://"), p.id).toBe(true);
  });
  it("only a site that listens for the microphone is allowed to ask for it", () => {
    expect(projects.filter((p) => p.live?.microphone).map((p) => p.id)).toEqual(["sayso"]);
  });
});
