import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { projects } from "@/knowledge/projects";
import sitemap from "@/app/sitemap";
import { dynamicParams, generateMetadata, generateStaticParams } from "./[slug]/page";

describe("shareable project routes", () => {
  it("generates one valid params entry and sitemap URL for every project", () => {
    const params = generateStaticParams();
    expect(dynamicParams).toBe(false);
    expect(params).toEqual(projects.map((p) => ({ slug: p.id })));
    expect(new Set(params.map((p) => p.slug)).size).toBe(projects.length);
    const entries = sitemap().filter((entry) => new URL(entry.url).pathname.startsWith("/projects/"));
    expect(entries).toHaveLength(projects.length);
    for (const p of projects) {
      expect(p.id).toMatch(/^[a-z0-9-]+$/);
      expect(entries.filter((entry) => new URL(entry.url).pathname === `/projects/${p.id}`)).toHaveLength(1);
    }
  });

  it.each(projects)("uses $id's existing copy and screenshot (or site fallback) in metadata", async (p) => {
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: p.id }) });
    expect(metadata.title).toBe(p.name);
    expect(metadata.description).toBe(p.tagline);
    expect(metadata.alternates?.canonical).toBe(`/projects/${p.id}`);
    const images = p.shots[0]
      ? [{ url: `/media/og/${p.id}.jpg`, width: 1200, height: 630, alt: p.shots[0].alt }]
      : [{ url: "/opengraph-image.png", alt: "Mohammad Uzair Khan" }];
    if (p.shots[0]) expect(existsSync(join("public", "media", "og", `${p.id}.jpg`)), "run node scripts/project-og.mjs").toBe(true);
    expect(metadata.openGraph).toMatchObject({ title: p.name, description: p.tagline, images });
    expect(metadata.twitter).toMatchObject({ title: p.name, description: p.tagline, images });
  });

  it("rejects unknown project metadata", async () => {
    await expect(generateMetadata({ params: Promise.resolve({ slug: "no-such-project" }) })).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });
});
