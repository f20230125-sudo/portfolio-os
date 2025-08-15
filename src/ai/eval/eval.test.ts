import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { score, textOf } from "./judge";
import { ask } from "../answer";
import { setA } from "./setA";
import { setB } from "./setB";
import { setC } from "./setC";
import { setD } from "./setD";

// Runs the evaluation sets through the assistant and writes the result to
// docs/eval.json, which the README quotes. The numbers are produced here, never
// typed in. Run alone with `npm run eval`.

const out = join(__dirname, "..", "..", "..", "docs", "eval.json");

describe("evaluation", () => {
  it("scores sets A, B, C and D, and writes what it found", () => {
    const shape = (s: ReturnType<typeof score>) => ({
      total: s.total,
      passed: s.passed,
      percent: Math.round((s.passed / s.total) * 1000) / 10,
      failures: s.failures.map((f) => ({ q: f.q, why: f.why, intent: f.intent, said: f.said })),
    });
    const a = score(setA);
    const b = score(setB);
    const c = score(setC);
    const d = score(setD);
    const broad = ["What projects has he built?", "Which project should I look at first?"].map((q) => {
      const text = textOf(ask(q).answer);
      return { q, words: text.trim().split(/\s+/).length, text };
    });
    writeFileSync(out, JSON.stringify({ generated: "by src/ai/eval/eval.test.ts", setA: shape(a), setB: shape(b), setC: { ...shape(c), independent: false }, setD: { ...shape(d), independent: false }, broad }, null, 2));
    expect(a.total).toBeGreaterThanOrEqual(150);
    expect(b.total).toBe(40);
    // A floor, so a change that makes the assistant worse is caught. Set A was tuned to, and set B
    // was fixed after its first scoring (see docs/eval-first-run.json for the honest first numbers).
    expect(a.passed).toBeGreaterThanOrEqual(165);
    expect(b.passed).toBeGreaterThanOrEqual(39);
    expect(c.total).toBe(8);
    expect(c.passed).toBe(8);
    expect(d.total).toBe(6);
    expect(d.passed).toBe(6);
  });
});
