import { ask } from "../answer";
import { emptyContext, type Answer } from "../types";

// How an answer is judged. A question carries what a person would expect to see
// in a good answer, written from the knowledge and not from the engine.

export interface Spec {
  q: string;
  /** Every one of these must be in the answer's text (any case). */
  all?: string[];
  /** At least one of these must be. */
  any?: string[];
  /** The assistant must decline: nothing grounded, nothing invented. */
  decline?: true;
  /** One of the answer's buttons must point here. */
  act?: string;
}

export const A = (q: string, ...all: string[]): Spec => ({ q, all });
export const ANY = (q: string, ...any: string[]): Spec => ({ q, any });
export const D = (q: string): Spec => ({ q, decline: true });
export const OPEN = (q: string, act: string): Spec => ({ q, act });

export const textOf = (a: Answer): string => a.blocks.map((b) => (b.type === "list" ? b.items.join(" ") : b.text)).join(" ");

export interface Verdict {
  q: string;
  ok: boolean;
  why: string;
  intent: string;
  said: string;
}

export function judge(spec: Spec): Verdict {
  const { answer } = ask(spec.q, emptyContext());
  const text = textOf(answer);
  const low = text.toLowerCase();
  const base = { q: spec.q, intent: answer.explain.intent, said: text.slice(0, 140) };
  if (spec.decline) {
    return answer.grounded ? { ...base, ok: false, why: "answered, but should have declined" } : { ...base, ok: true, why: "" };
  }
  if (!answer.grounded) return { ...base, ok: false, why: "declined, but should have answered" };
  const missing = (spec.all ?? []).filter((s) => !low.includes(s.toLowerCase()));
  if (missing.length > 0) return { ...base, ok: false, why: `missing ${missing.map((m) => `"${m}"`).join(", ")}` };
  if (spec.any && !spec.any.some((s) => low.includes(s.toLowerCase()))) return { ...base, ok: false, why: `none of ${spec.any.map((m) => `"${m}"`).join(", ")}` };
  if (spec.act && !answer.actions.some((a) => a.target.includes(spec.act as string))) return { ...base, ok: false, why: `no button to ${spec.act}` };
  return { ...base, ok: true, why: "" };
}

export function score(specs: Spec[]): { total: number; passed: number; failures: Verdict[] } {
  const verdicts = specs.map(judge);
  return { total: verdicts.length, passed: verdicts.filter((v) => v.ok).length, failures: verdicts.filter((v) => !v.ok) };
}
