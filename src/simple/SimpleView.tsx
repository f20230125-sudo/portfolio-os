import Link from "next/link";
import { ASOF_LABEL } from "@/ai/compose";
import { certifications, education, experience, person, research, skillGroups } from "@/knowledge/profile";
import { flagship, kindLabels, olderProjects, type Project } from "@/knowledge/projects";

// The whole site as one ordinary page, rendered on the server from the same
// data as the desktop. For anyone who would rather read than click, for screen
// readers, search engines, printing, and browsers with scripts off.

function ProjectBlock({ p }: { p: Project }) {
  return (
    <article className="border-t border-line py-5 first:border-t-0" id={p.id}>
      <h3 className="text-[18px] font-semibold">{p.name}</h3>
      <p className="mt-0.5 text-[14px] text-muted">{kindLabels[p.kind]} · {p.stack.join(", ")}</p>
      <p className="mt-2 leading-relaxed">{p.tagline} {p.pitch}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed marker:text-faint">
        {p.facts.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      {p.limits.length > 0 && (
        <p className="mt-2 text-[14px] text-muted">
          <strong className="font-semibold text-fg">Limits: </strong>
          {p.limits.join(" ")}
        </p>
      )}
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[14px]">
        {p.live && (
          <a className="link" href={p.live.url} rel="noopener noreferrer">
            {p.live.frameable ? "Try it live" : "Live site"}
          </a>
        )}
        <a className="link" href={p.code} rel="noopener noreferrer">Code on GitHub</a>
      </p>
    </article>
  );
}

export function SimpleView() {
  const u = education.university;
  const e = experience[0];
  return (
    <div className="simple-page mx-auto max-w-[780px] px-5 py-8 text-[15px]">
      <header className="border-b border-line pb-6">
        <p className="no-print mb-4 text-[14px]">
          <Link className="link" href="/">Open the desktop version</Link>
        </p>
        <h1 className="text-[32px] font-semibold leading-tight">{person.name}</h1>
        <p className="mt-1 text-[17px] text-muted">{person.role} · {person.location}</p>
        <p className="mt-3 leading-relaxed">{person.summary}</p>
        <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[14px]">
          <a className="link" href={`mailto:${person.email}`}>{person.email}</a>
          <a className="link" href={person.linkedin} rel="noopener noreferrer">LinkedIn</a>
          <a className="link" href={person.github} rel="noopener noreferrer">GitHub</a>
        </p>
        <p className="mt-3 text-[14px] text-muted">{person.openToWork}</p>
      </header>

      <main>
        <section aria-labelledby="s-projects" className="py-6">
          <h2 id="s-projects" className="mb-1 text-[22px] font-semibold">Projects</h2>
          <p className="text-[14px] text-muted">The four flagship apps are live on the web. Figures are as of {ASOF_LABEL}.</p>
          {flagship.map((p) => (
            <ProjectBlock key={p.id} p={p} />
          ))}
          <h3 className="mt-4 text-[17px] font-semibold text-muted">Earlier builds</h3>
          {olderProjects.map((p) => (
            <ProjectBlock key={p.id} p={p} />
          ))}
        </section>

        <section aria-labelledby="s-research" className="border-t border-line py-6">
          <h2 id="s-research" className="mb-2 text-[22px] font-semibold">Research</h2>
          <h3 className="text-[17px] font-semibold">{research.title}</h3>
          <p className="text-[14px] text-muted">{research.role} · {research.status} · advisor {research.advisor}</p>
          <p className="mt-2 leading-relaxed">{research.summary}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-faint">
            {research.metrics.map((m) => (
              <li key={m.label}>
                {m.label}: {m.value}
                {m.note ? ` (${m.note})` : ""}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="s-experience" className="border-t border-line py-6">
          <h2 id="s-experience" className="mb-2 text-[22px] font-semibold">Experience</h2>
          <h3 className="text-[17px] font-semibold">{e.role}, {e.org}</h3>
          <p className="text-[14px] text-muted">{e.orgNote} · {e.place} · {e.program} · {e.when}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-faint">
            {e.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="s-education" className="border-t border-line py-6">
          <h2 id="s-education" className="mb-2 text-[22px] font-semibold">Education</h2>
          <h3 className="text-[17px] font-semibold">{u.name}</h3>
          <p className="text-[14px] text-muted">{u.degree} · started {u.started} · expected {u.expected}</p>
          <p className="mt-2">Relevant coursework: {u.coursework.join(", ")}.</p>
          <p className="mt-2 text-[14px] text-muted">{education.school.level}, {education.school.name}, {education.school.place}, {education.school.year}.</p>
        </section>

        <section aria-labelledby="s-skills" className="border-t border-line py-6">
          <h2 id="s-skills" className="mb-2 text-[22px] font-semibold">Skills</h2>
          <dl className="space-y-1.5">
            {skillGroups.map((g) => (
              <div key={g.id} className="grid gap-x-4 sm:grid-cols-[190px_1fr]">
                <dt className="font-semibold">{g.label}</dt>
                <dd className="text-muted">{g.skills.map((s) => s.name).join(", ")}</dd>
              </div>
            ))}
          </dl>
          <h3 className="mt-5 text-[17px] font-semibold">Certifications</h3>
          <ul className="mt-1 list-disc pl-5 marker:text-faint">
            {certifications.map((c) => (
              <li key={c.name}>
                {c.name}, {c.by}
                {c.when ? ` (${c.when})` : ""}
                {c.status === "in progress" ? ", in progress" : ""}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-line pt-5 text-[14px] text-muted">
        <p>
          Prefer the interactive version? <Link className="link" href="/">Open the desktop</Link>, where each project runs in a window and an assistant answers questions about him.
        </p>
      </footer>
    </div>
  );
}
