import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dayLabel } from "@/ai/labels";
import { person } from "@/knowledge/profile";
import { projectById, projects } from "@/knowledge/projects";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.id }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = projectById(slug);
  if (!p) notFound();
  // A JPEG cut of the first screenshot (scripts/project-og.mjs): link previews do not all show WebP.
  const images = p.shots[0]
    ? [{ url: `/media/og/${p.id}.jpg`, width: 1200, height: 630, alt: p.shots[0].alt }]
    : [{ url: "/opengraph-image.png", alt: person.name }];
  return {
    title: p.name,
    description: p.tagline,
    alternates: { canonical: `/projects/${p.id}` },
    openGraph: {
      title: p.name,
      description: p.tagline,
      url: `/projects/${p.id}`,
      type: "website",
      siteName: person.name,
      images,
    },
    twitter: { card: "summary_large_image", title: p.name, description: p.tagline, images },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const p = projectById(slug);
  if (!p) notFound();
  const shot = p.shots[0];

  return (
    <div className="simple-page mx-auto max-w-[780px] px-5 py-8 text-[15px]">
      <header className="border-b border-line pb-5 text-[14px]">
        <Link className="link" href="/" prefetch={false}>{person.name}</Link>
      </header>
      <main className="py-6">
        <h1 className="text-[32px] font-semibold leading-tight">{p.name}</h1>
        <p className="mt-1 text-[17px] text-muted">{p.tagline}</p>
        <p className="mt-3 leading-relaxed">{p.pitch}</p>
        <p className="mt-3 text-[14px] text-muted">As of <time dateTime={p.asOf}>{dayLabel(p.asOf)}</time></p>
        <nav aria-label="Project links" className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[14px]">
          {p.live && <a className="link" href={p.live.url} rel="noopener noreferrer">Live site</a>}
          {p.demoUrl && <a className="link" href={p.demoUrl} rel="noopener noreferrer">Demo</a>}
          <a className="link" href={p.code} rel="noopener noreferrer">Code on GitHub</a>
          <Link className="link" href={`/?open=${p.id}`} prefetch={false}>Open on the desktop</Link>
        </nav>
        {shot && (
          <div className="mt-6 overflow-hidden rounded-lg border border-line bg-surface-2">
            <img src={shot.src} alt={shot.alt} className="block h-auto w-full" decoding="async" />
          </div>
        )}
        {[
          { id: "facts", title: "Key facts", items: p.facts },
          { id: "decisions", title: "Decisions behind it", items: p.decisions },
          { id: "limits", title: "Limits", items: p.limits },
          { id: "stack", title: "Built with", items: p.stack },
        ].filter((section) => section.items.length > 0).map((section) => (
          <section key={section.id} aria-labelledby={section.id} className="mt-6 border-t border-line pt-5">
            <h2 id={section.id} className="text-[22px] font-semibold">{section.title}</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5 leading-relaxed marker:text-faint">
              {section.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
        ))}
      </main>
      <footer className="border-t border-line pt-5 text-[14px] text-muted">
        <Link className="link" href="/simple" prefetch={false}>All projects and profile in the simple view</Link>
      </footer>
    </div>
  );
}
