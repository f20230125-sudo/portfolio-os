"use client";

import { Sparkles } from "lucide-react";
import { education, person } from "@/knowledge/profile";
import { Mark } from "@/os/icons";
import { useOs } from "@/os/useOs";

const FACTS: [string, string][] = [
  ["Name", person.name],
  ["Role", person.role],
  ["Based in", person.location],
  ["Studying", `${education.university.degree}, ${education.university.name}`],
  ["Graduating", education.university.expected],
  ["Currently learning", person.learning.join(", ")],
  ["Work status", person.status],
];

const TILES: { value: string; label: string }[] = [
  { value: "97.33%", label: "accuracy of the model in his IEEE paper, running on a Raspberry Pi 4B" },
  { value: "4", label: "flagship apps, each live on the web" },
  { value: "1st", label: "author on a paper submitted to IEEE MSN 2026" },
  { value: "2027", label: "expected graduation, BITS Pilani Dubai" },
];

export default function AboutApp() {
  const os = useOs();
  return (
    <div className="mx-auto grid max-w-[880px] gap-6 p-5 md:grid-cols-[220px_1fr]">
      <aside className="flex flex-col items-center gap-3 text-center md:items-start md:text-left">
        <div
          className="grid h-32 w-32 place-items-center rounded-3xl text-white shadow-md"
          style={{ background: "linear-gradient(145deg, #1d4ed8, #7c3aed)" }}
          role="img"
          aria-label="Uzair's mark, a triangle inside a triangle"
        >
          <Mark size={64} />
        </div>
        <div>
          <h2 className="text-[20px] font-semibold leading-tight">{person.name}</h2>
          <p className="text-[13.5px] text-muted">{person.role}</p>
          <p className="text-[13px] text-faint">{person.location}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => os.ask("Tell me about Uzair")}>
          <Sparkles size={14} aria-hidden="true" /> Ask about him
        </button>
      </aside>

      <div className="space-y-6">
        <section aria-labelledby="about-bio">
          <h3 id="about-bio" className="eyebrow mb-2">About</h3>
          <p className="text-[15px] leading-relaxed" data-selectable>{person.summary}</p>
        </section>

        <ul className="grid gap-2.5 sm:grid-cols-2" aria-label="Numbers">
          {TILES.map((t) => (
            <li key={t.value} className="panel p-3.5">
              <p className="text-[26px] font-semibold leading-none tabular">{t.value}</p>
              <p className="mt-1.5 text-[12.5px] leading-snug text-muted">{t.label}</p>
            </li>
          ))}
        </ul>

        <section aria-labelledby="about-habits">
          <h3 id="about-habits" className="eyebrow mb-2">How he builds</h3>
          <ul className="list-disc space-y-1.5 pl-5 text-[13.5px] leading-relaxed marker:text-faint" data-selectable>
            {person.habits.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="about-facts">
          <h3 id="about-facts" className="eyebrow mb-2">At a glance</h3>
          <dl className="panel divide-y divide-line text-[13.5px]" data-selectable>
            {FACTS.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[130px_1fr] gap-3 px-3.5 py-2">
                <dt className="text-faint">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
