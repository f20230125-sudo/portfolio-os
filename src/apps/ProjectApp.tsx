"use client";

import { ExternalLink, Play, RotateCw, Sparkles } from "lucide-react";
import { useState } from "react";
import { ASOF_LABEL } from "@/ai/compose";
import { projectById, kindLabels, type Project } from "@/knowledge/projects";
import type { LiveSpec } from "@/knowledge/schema";
import { AppIcon, GithubGlyph } from "@/os/icons";
import { useOs } from "@/os/useOs";

type Tab = "overview" | "live" | "details";

const asTab = (value: string | undefined, hasLive: boolean): Tab => (value === "details" || (value === "live" && hasLive) ? value : "overview");

export default function ProjectApp({ projectId, tab, nonce }: { projectId: string; tab?: string; nonce?: number }) {
  const p = projectById(projectId);
  const os = useOs();
  const [current, setCurrent] = useState<Tab>(() => asTab(tab, Boolean(p?.live)));
  const [seen, setSeen] = useState(nonce);
  // Asked again with a different tab (from an answer's button): follow it.
  if (nonce !== seen) {
    setSeen(nonce);
    if (tab) setCurrent(asTab(tab, Boolean(p?.live)));
  }
  if (!p) return <div className="p-6 text-faint">That project is not here.</div>;

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    ...(p.live ? [{ id: "live" as const, label: p.live.frameable ? "Live" : "Live site" }] : []),
    { id: "details", label: "How it is built" },
  ];

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3.5">
        <AppIcon icon={p.icon} size={44} />
        <div className="min-w-[14rem] flex-1">
          <p className="eyebrow">{kindLabels[p.kind]}</p>
          <h2 className="text-[18px] font-semibold leading-tight">{p.name}</h2>
          <p className="text-[13px] leading-snug text-muted" data-selectable>{p.tagline}</p>
        </div>
        <div className="seg" role="tablist" aria-label={`${p.name} sections`}>
          {tabs.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={current === t.id} id={`${p.id}-tab-${t.id}`} aria-controls={`${p.id}-panel`} onClick={() => setCurrent(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-auto" role="tabpanel" id={`${p.id}-panel`} aria-labelledby={`${p.id}-tab-${current}`}>
        {current === "overview" && <Overview p={p} goLive={() => setCurrent("live")} ask={() => os.ask(`Tell me about ${p.name}`)} />}
        {current === "live" && p.live && <LiveFrame name={p.name} live={p.live} preview={p.gif?.src ?? p.shots[0]?.src} />}
        {current === "details" && <Details p={p} ask={() => os.ask(`What were the key decisions in ${p.name}?`)} />}
      </div>
    </div>
  );
}

function Media({ p }: { p: Project }) {
  const items = [...(p.gif ? [p.gif] : []), ...p.shots];
  const [i, setI] = useState(0);
  if (items.length === 0) return <Cover p={p} />;
  const item = items[Math.min(i, items.length - 1)];
  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-line bg-surface-2">
        <img key={item.src} src={item.src} alt={item.alt} className="rise-in block max-h-[340px] w-full object-contain" loading="lazy" decoding="async" />
      </div>
      {items.length > 1 && (
        <div className="mt-2 flex gap-2" role="group" aria-label="Pictures">
          {items.map((m, idx) => (
            <button
              key={m.src}
              type="button"
              aria-label={`Show picture ${idx + 1} of ${items.length}${m.src.endsWith(".gif") ? ", the demo" : ""}`}
              aria-pressed={idx === i}
              onClick={() => setI(idx)}
              className={`h-12 w-20 overflow-hidden rounded-md border bg-surface-2 ${idx === i ? "border-accent ring-2 ring-accent/40" : "border-line"}`}
            >
              <img src={m.src} alt="" className="h-full w-full object-cover object-top" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** For a project with no screenshots: its icon large, on its own colours. */
function Cover({ p }: { p: Project }) {
  return (
    <div
      className="relative grid h-[200px] place-items-center overflow-hidden rounded-lg border border-line"
      style={{ background: `linear-gradient(135deg, ${p.icon.from}, ${p.icon.to})` }}
      role="img"
      aria-label={`${p.name}: no screenshot, the code is on GitHub`}
    >
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, #fff 0, transparent 40%), radial-gradient(circle at 80% 90%, #fff 0, transparent 35%)" }} />
      <div className="relative flex flex-col items-center gap-3 text-white">
        <AppIcon icon={{ ...p.icon, from: "rgb(255 255 255 / 0.22)", to: "rgb(255 255 255 / 0.1)" }} size={72} />
        <span className="text-[15px] font-medium">{p.name}</span>
      </div>
    </div>
  );
}

function Overview({ p, goLive, ask }: { p: Project; goLive: () => void; ask: () => void }) {
  return (
    <div className="space-y-5 px-5 py-4">
      <Media p={p} />
      <div className="flex flex-wrap gap-2">
        {p.live?.frameable ? (
          <button type="button" className="btn btn-primary" onClick={goLive}>
            <Play size={14} aria-hidden="true" /> Run it here
          </button>
        ) : p.live ? (
          <a className="btn btn-primary" href={p.live.url} target="_blank" rel="noopener noreferrer">
            Open the live site <ExternalLink size={14} aria-hidden="true" />
          </a>
        ) : null}
        <a className="btn" href={p.code} target="_blank" rel="noopener noreferrer">
          <GithubGlyph size={14} /> Code on GitHub
        </a>
        <button type="button" className="btn" onClick={ask}>
          <Sparkles size={14} aria-hidden="true" /> Ask about this
        </button>
      </div>
      <p className="text-[14px] leading-relaxed" data-selectable>{p.pitch}</p>
      <section aria-labelledby={`${p.id}-facts`}>
        <h3 id={`${p.id}-facts`} className="eyebrow mb-2">Key facts</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-[13.5px] leading-relaxed marker:text-faint" data-selectable>
          {p.facts.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <p className="mt-2 text-[12px] text-faint">Figures are as of {ASOF_LABEL}.</p>
      </section>
      <section aria-labelledby={`${p.id}-stack`}>
        <h3 id={`${p.id}-stack`} className="eyebrow mb-2">Built with</h3>
        <ul className="flex flex-wrap gap-1.5">
          {p.stack.map((s) => (
            <li key={s} className="chip">{s}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Details({ p, ask }: { p: Project; ask: () => void }) {
  return (
    <div className="space-y-5 px-5 py-4">
      {p.decisions.length > 0 && (
        <section aria-labelledby={`${p.id}-dec`}>
          <h3 id={`${p.id}-dec`} className="eyebrow mb-2">Decisions behind it</h3>
          <ul className="list-disc space-y-2 pl-5 text-[13.5px] leading-relaxed marker:text-faint" data-selectable>
            {p.decisions.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </section>
      )}
      {p.limits.length > 0 && (
        <section aria-labelledby={`${p.id}-lim`}>
          <h3 id={`${p.id}-lim`} className="eyebrow mb-2">Limits, said plainly</h3>
          <ul className="list-disc space-y-2 pl-5 text-[13.5px] leading-relaxed marker:text-faint" data-selectable>
            {p.limits.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </section>
      )}
      {p.decisions.length === 0 && p.limits.length === 0 && <p className="text-faint">The README for this one is short; the code is the best place to read how it works.</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn" onClick={ask}>
          <Sparkles size={14} aria-hidden="true" /> Ask the assistant
        </button>
        <a className="btn" href={p.code} target="_blank" rel="noopener noreferrer">
          <GithubGlyph size={14} /> Read the README
        </a>
      </div>
    </div>
  );
}

/** The real site, shown inside the window once the visitor asks for it. */
function LiveFrame({ name, live, preview }: { name: string; live: LiveSpec; preview?: string }) {
  const [started, setStarted] = useState(false);
  const [reloads, setReloads] = useState(0);

  if (!live.frameable) {
    return (
      <div className="mx-auto flex max-w-[520px] flex-col items-center gap-4 px-6 py-10 text-center">
        {preview && (
          <img src={preview} alt="" className="max-h-[200px] rounded-lg border border-line object-contain" loading="lazy" />
        )}
        <p className="text-[14px] leading-relaxed text-muted">{name} opens in its own tab.</p>
        {live.note && <p className="text-[12.5px] text-faint">{live.note}</p>}
        <a className="btn btn-primary" href={live.url} target="_blank" rel="noopener noreferrer">
          Open {name} <ExternalLink size={14} aria-hidden="true" />
        </a>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="mx-auto flex max-w-[520px] flex-col items-center gap-4 px-6 py-10 text-center">
        {preview && (
          <img src={preview} alt="" className="max-h-[200px] rounded-lg border border-line object-contain" loading="lazy" />
        )}
        <p className="text-[14px] leading-relaxed text-muted">This loads the real {name} inside the window, so it uses your connection while it is open.</p>
        <button type="button" className="btn btn-primary" onClick={() => setStarted(true)}>
          <Play size={14} aria-hidden="true" /> Run it here
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-3 py-1.5 text-[12.5px]">
        <button type="button" className="grid h-7 w-7 place-items-center rounded hover:bg-surface-3" aria-label={`Reload ${name}`} onClick={() => setReloads((n) => n + 1)}>
          <RotateCw size={14} />
        </button>
        <span className="min-w-0 flex-1 truncate rounded-full border border-line bg-surface px-3 py-1 font-mono text-[12px] text-muted" data-selectable>{live.url.replace(/^https:\/\//, "")}</span>
        <a className="btn !min-h-7 !px-2.5 text-[12.5px]" href={live.url} target="_blank" rel="noopener noreferrer">
          New tab <ExternalLink size={12} aria-hidden="true" />
        </a>
      </div>
      <iframe
        key={reloads}
        src={live.url}
        title={`${name}, running live`}
        className="min-h-0 w-full flex-1 border-0 bg-white"
        allow={live.microphone ? "microphone" : undefined}
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
      />
      <p className="border-t border-line bg-surface-2 px-3 py-1.5 text-[12px] text-faint">
        Blank or stuck? Use New tab above. {live.note ?? ""}
      </p>
    </div>
  );
}
