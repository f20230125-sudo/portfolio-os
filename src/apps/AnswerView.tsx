"use client";

import { ChevronRight, ExternalLink, Mail } from "lucide-react";
import type { Action, Answer } from "@/ai/types";
import { useOs } from "@/os/useOs";

// One answer from the assistant: its lines, where they came from, what to press
// next, and a fold-out that shows how it was found.

function ActionButton({ a }: { a: Action }) {
  const os = useOs();
  if (a.kind === "link") {
    return (
      <a className="btn" href={a.target} target="_blank" rel="noopener noreferrer">
        {a.label}
        <ExternalLink size={13} aria-hidden="true" />
      </a>
    );
  }
  if (a.kind === "mail") {
    return (
      <a className="btn btn-primary" href={a.target}>
        <Mail size={14} aria-hidden="true" />
        {a.label}
      </a>
    );
  }
  return (
    <button type="button" className="btn" onClick={() => (a.kind === "ask" ? os.ask(a.target) : os.open(a.target, a.tab))}>
      {a.label}
      <ChevronRight size={14} aria-hidden="true" />
    </button>
  );
}

export function AnswerView({ answer, latest }: { answer: Answer; latest: boolean }) {
  const os = useOs();
  return (
    <div className="space-y-2.5 text-[14px] leading-relaxed" data-selectable>
      {answer.blocks.map((b, i) => {
        if (b.type === "p") return <p key={i}>{b.text}</p>;
        if (b.type === "note") return <p key={i} className="text-[12.5px] text-faint">{b.text}</p>;
        return (
          <ul key={i} className="list-disc space-y-1.5 pl-5 marker:text-faint">
            {b.items.map((it, j) => (
              <li key={j}>{it}</li>
            ))}
          </ul>
        );
      })}

      {answer.actions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {answer.actions.map((a) => (
            <ActionButton key={`${a.kind}:${a.target}:${a.tab ?? ""}`} a={a} />
          ))}
        </div>
      )}

      {answer.sources.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="eyebrow">From</span>
          {answer.sources.map((s) => (
            <button key={`${s.app}:${s.tab ?? ""}`} type="button" className="chip" onClick={() => os.open(s.app, s.tab)}>
              {s.label}
            </button>
          ))}
        </div>
      )}

      {latest && answer.followups.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1" aria-label="Suggested questions">
          {answer.followups.map((q) => (
            <button key={q} type="button" className="chip" onClick={() => os.ask(q)}>
              {q}
            </button>
          ))}
        </div>
      )}

      <details className="text-[12.5px] text-faint">
        <summary className="w-fit cursor-pointer select-none rounded py-0.5 hover:text-fg">How I answered</summary>
        <dl className="mt-1.5 space-y-1 rounded-md border border-line bg-surface-2 p-2.5 font-mono text-[11.5px] leading-snug">
          <div>
            <dt className="inline text-faint">Read as: </dt>
            <dd className="inline text-fg">{answer.explain.intent.replace("_", " ")}, because it {answer.explain.reason}</dd>
          </div>
          <div>
            <dt className="inline text-faint">Words used: </dt>
            <dd className="inline text-fg">{answer.explain.normalized || "(none)"}</dd>
          </div>
          {answer.explain.entities.length > 0 && (
            <div>
              <dt className="inline text-faint">Recognised: </dt>
              <dd className="inline text-fg">{answer.explain.entities.map((e) => `${e.label} (${e.kind})`).join(", ")}</dd>
            </div>
          )}
          {answer.explain.hits.length > 0 && (
            <div>
              <dt className="text-faint">Best passages found:</dt>
              <dd>
                <ol className="list-decimal pl-5 text-fg">
                  {answer.explain.hits.map((h) => (
                    <li key={h.id}>
                      {h.title} <span className="text-faint">· score {h.score}</span>
                    </li>
                  ))}
                </ol>
              </dd>
            </div>
          )}
          <div>
            <dt className="inline text-faint">Grounded: </dt>
            <dd className="inline text-fg">{answer.grounded ? "yes, from something Uzair wrote" : "no, this was a polite decline"}</dd>
          </div>
        </dl>
      </details>
    </div>
  );
}
