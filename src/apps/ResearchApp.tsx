"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { research } from "@/knowledge/profile";
import { useOs } from "@/os/useOs";

const R = 54;
const CIRC = 2 * Math.PI * R;

const PIPELINE = [
  { title: "PlantVillage", note: "10 tomato leaf classes" },
  { title: "MobileNetV2", note: "two-phase transfer learning" },
  { title: "INT8 quantisation", note: "TensorFlow Lite, 5.3 MB" },
  { title: "Raspberry Pi 4B", note: "about 250 ms an image" },
];

export default function ResearchApp() {
  const os = useOs();
  const accuracy = 97.33;
  return (
    <div className="mx-auto max-w-[780px] space-y-6 p-6">
      <header className="space-y-2">
        <p className="eyebrow">{research.role} · {research.years}</p>
        <h2 className="text-[20px] font-semibold leading-snug" data-selectable>{research.title}</h2>
        <p className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
          <span className="chip border-accent !text-accent">{research.status}</span>
          <span>Advisor: {research.advisor}</span>
        </p>
        <p className="text-[14.5px] leading-relaxed" data-selectable>{research.summary}</p>
      </header>

      <section aria-labelledby="res-results" className="grid items-center gap-5 sm:grid-cols-[180px_1fr]">
        <h3 id="res-results" className="sr-only">Results</h3>
        <figure className="mx-auto grid place-items-center">
          <svg width="168" height="168" viewBox="0 0 140 140" role="img" aria-label={`Test accuracy ${accuracy} percent`}>
            <circle cx="70" cy="70" r={R} fill="none" stroke="var(--surface-3)" strokeWidth="12" />
            <circle
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${(accuracy / 100) * CIRC} ${CIRC}`}
              transform="rotate(-90 70 70)"
            />
            <text x="70" y="68" textAnchor="middle" fontSize="26" fontWeight="600" fill="var(--fg)" className="tabular">97.33%</text>
            <text x="70" y="88" textAnchor="middle" fontSize="11" fill="var(--faint)">test accuracy</text>
          </svg>
        </figure>
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {research.metrics.map((m) => (
            <li key={m.label} className="panel p-3">
              <p className="text-[12px] text-faint">{m.label}</p>
              <p className="text-[19px] font-semibold leading-tight tabular">{m.value}</p>
              {m.note && <p className="mt-0.5 text-[12px] leading-snug text-muted">{m.note}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="res-pipeline">
        <h3 id="res-pipeline" className="eyebrow mb-2.5">From dataset to device</h3>
        <ol className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] sm:items-stretch">
          {PIPELINE.flatMap((step, i) => [
            <li key={step.title} className="panel p-3 text-center">
              <p className="text-[13.5px] font-semibold">{step.title}</p>
              <p className="text-[12px] text-muted">{step.note}</p>
            </li>,
            i < PIPELINE.length - 1 ? <li key={`${step.title}-arrow`} aria-hidden="true" className="hidden place-items-center text-faint sm:grid"><ArrowRight size={16} /></li> : null,
          ])}
        </ol>
      </section>

      <section aria-labelledby="res-stack">
        <h3 id="res-stack" className="eyebrow mb-2">Tools</h3>
        <ul className="flex flex-wrap gap-1.5">
          {research.stack.map((s) => (
            <li key={s} className="chip">{s}</li>
          ))}
        </ul>
      </section>

      <button type="button" className="btn" onClick={() => os.ask("Tell me about his research")}>
        <Sparkles size={14} aria-hidden="true" /> Ask the assistant about it
      </button>
    </div>
  );
}
