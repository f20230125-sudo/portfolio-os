import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { score } from "./judge";
import { setA } from "./setA";
import { setB } from "./setB";

// Runs the evaluation sets through the assistant and writes the result to
// docs/eval.json, which the README quotes. The numbers are produced here, never
// typed in. Run alone with `npm run eval`.

const out = join(__dirname, "..", "..", "..", "docs", "eval.json");

describe("evaluation", () => {
  it("scores set A, and writes what it found", () => {
    const shape = (s: ReturnType<typeof score>) => ({
      total: s.total,
      passed: s.passed,
      percent: Math.round((s.passed / s.total) * 1000) / 10,
      failures: s.failures.map((f) => ({ q: f.q, why: f.why, intent: f.intent, said: f.said })),
    });
    const a = score(setA);
    const b = score(setB);
    writeFileSync(out, JSON.stringify({ generated: "by src/ai/eval/eval.test.ts", setA: shape(a), setB: shape(b) }, null, 2));
    expect(a.total).toBeGreaterThanOrEqual(150);
    expect(b.total).toBe(40);
    // A floor, so a change that makes the assistant worse is caught. Set A was tuned to, and set B
    // was fixed after its first scoring (see docs/eval-first-run.json for the honest first numbers).
    expect(a.passed / a.total).toBeGreaterThanOrEqual(0.97);
    expect(b.passed / b.total).toBeGreaterThanOrEqual(0.9);
  });
});
