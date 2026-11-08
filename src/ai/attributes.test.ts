import { describe, expect, it } from "vitest";
import { ask } from "./answer";
import { textOf } from "./eval/judge";
import { featured } from "@/knowledge/projects";

describe("short recruiter answers", () => {
  for (const q of ["What projects has he built?", "Which project should I look at first?", "Where should I start?"]) {
    it(q, () => {
      const a = ask(q).answer;
      const words = textOf(a).trim().split(/\s+/).length;
      expect(words).toBeGreaterThanOrEqual(60);
      expect(words).toBeLessThanOrEqual(110);
      for (const p of featured) expect(a.actions).toContainEqual({ kind: "open", label: `Open ${p.name}`, target: `project:${p.id}` });
      if (q === "What projects has he built?") {
        expect(textOf(a)).toContain("7 more agent and automation projects");
        expect(textOf(a)).not.toContain("7 Flagship");
      } else {
        expect(textOf(a)).toMatch(new RegExp(`^Start with ${featured[0].name}:`));
        expect(textOf(a)).toContain(featured[0].tagline);
      }
    });
  }
});

describe("attributes before summaries", () => {
  it("does not treat unfamiliar descriptive wording as a missing integration", () => {
    const a = ask("Can Agent Desk publish LinkedIn updates unattended?").answer;
    expect(a.grounded).toBe(true);
    expect(textOf(a)).toMatch(/drafts|without a click/);
  });
  it("keeps write safeguards as well as measured attributes", () => {
    const a = ask("what stops agent desk from breaking my repos").answer;
    expect(a.grounded).toBe(true);
    expect(textOf(a)).toMatch(/click|no delete|dry-run|allow-list/);
  });
  it.each([
    "What is the research model's battery life?",
    "What is Backroom's latency?",
    "Does Flowboard support Salesforce?",
    "Does Inbound use Rust?",
    "What is Sayso's speech recognition accuracy?",
    "Does Inbound support Exchange on its live site?",
    "Can Agent Desk post to Mastodon by itself?",
    "Can Agent Desk post to mastodon by itself?",
    "Can Backroom dispatch emails through SendGrid?",
    "Does Flowboard support cycles in Salesforce?",
  ])("does not substitute a related summary for %s", (q) => {
    const a = ask(q).answer;
    expect(a.grounded).toBe(false);
    expect(textOf(a)).toContain("not on record");
  });
});
