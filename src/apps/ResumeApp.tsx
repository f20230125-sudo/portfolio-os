"use client";

import { Download, FileText } from "lucide-react";
import { certifications, education, experience, person, research, skillGroups } from "@/knowledge/profile";
import { flagship } from "@/knowledge/projects";
import { useOs } from "@/os/useOs";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const id = `resume-${title.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="border-t border-line pt-4 first:border-t-0 first:pt-0">
      <h3 id={id} className="mb-2.5 text-[13px] font-semibold uppercase tracking-wider text-muted">{title}</h3>
      {children}
    </section>
  );
}

function Row({ title, right, sub, subRight }: { title: string; right?: string; sub?: string; subRight?: string }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <p className="text-[14.5px] font-semibold">{title}</p>
        {right && <p className="text-[13px] text-muted">{right}</p>}
      </div>
      {(sub || subRight) && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 text-[13px] italic text-muted">
          <p>{sub}</p>
          <p>{subRight}</p>
        </div>
      )}
    </div>
  );
}

export default function ResumeApp() {
  const os = useOs();
  const u = education.university;
  const e = experience[0];
  return (
    <div className="mx-auto max-w-[760px] space-y-4 p-6" data-selectable>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-semibold leading-tight">{person.name}</h2>
          <p className="text-[13.5px] text-muted">{person.location} · {person.email}</p>
          <p className="text-[13px] text-muted">linkedin.com/in/mohammad-uzair-khan-2b24b0355 · github.com/{person.githubHandle}</p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <a className="btn btn-primary" href={person.cv.url} download>
            <Download size={14} aria-hidden="true" /> {person.cv.label}
          </a>
          <a className="btn" href="/simple">
            <FileText size={14} aria-hidden="true" /> Printable version
          </a>
        </div>
      </header>

      <Section title="Education">
        <Row title={u.name} right={person.location} sub={u.degree} subRight={`Expected ${u.expected}`} />
        <p className="mt-1.5 text-[13.5px] leading-relaxed">Relevant coursework: {u.coursework.join(", ")}.</p>
        <div className="mt-3">
          <Row title={education.school.name} right={education.school.place} sub={education.school.level} subRight={education.school.year} />
        </div>
      </Section>

      <Section title="Research and publications">
        <Row title={research.title} right={research.years} sub={`${research.role}; ${research.status}; advisor ${research.advisor}`} />
        <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[13.5px] leading-relaxed marker:text-faint">
          <li>Trained a MobileNetV2 classifier (10 disease classes, PlantVillage) with two-phase transfer learning, reaching 97.33% test accuracy (macro-F1 0.963, mean AUC 0.994).</li>
          <li>Compressed it to 5.3 MB and 1.4 million parameters with INT8 post-training quantisation (TensorFlow Lite) with negligible accuracy loss.</li>
          <li>Deployed it on a Raspberry Pi 4B for real-time on-device inference: about 250 ms per image, 3.6 FPS, 3.2 W.</li>
        </ul>
        <button type="button" className="link no-print mt-2 text-[13px]" onClick={() => os.open("research")}>
          Open the research window
        </button>
      </Section>

      <Section title="Experience">
        <Row title={`${e.role}, ${e.org} (travel-tech startup)`} right={e.place} sub={e.program} subRight={e.when} />
        <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[13.5px] leading-relaxed marker:text-faint">
          {e.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </Section>

      <Section title="Projects">
        <ul className="space-y-2.5">
          {flagship.map((p) => (
            <li key={p.id}>
              <button type="button" className="text-left" onClick={() => os.open(`project:${p.id}`)}>
                <span className="text-[14.5px] font-semibold hover:underline">{p.name}</span>
                <span className="text-[13px] text-muted"> · {p.stack.slice(0, 5).join(", ")}</span>
              </button>
              <p className="text-[13.5px] leading-relaxed">{p.tagline}</p>
            </li>
          ))}
        </ul>
        <button type="button" className="link no-print mt-2 text-[13px]" onClick={() => os.open("projects")}>
          See all fourteen in the Projects folder
        </button>
      </Section>

      <Section title="Technical skills">
        <dl className="space-y-1 text-[13.5px] leading-relaxed">
          {skillGroups.map((g) => (
            <div key={g.id} className="grid grid-cols-[150px_1fr] gap-3">
              <dt className="font-semibold">{g.label}</dt>
              <dd className="text-muted">{g.skills.map((s) => s.name).join(", ")}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Certifications">
        <ul className="list-disc space-y-1 pl-5 text-[13.5px] marker:text-faint">
          {certifications.map((c) => (
            <li key={c.name}>
              {c.name}, {c.by}
              {c.when ? ` (${c.when})` : ""}
              {c.status === "in progress" ? " (in progress)" : ""}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
