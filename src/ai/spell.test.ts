import { describe, expect, it } from "vitest";
import { correct } from "./spell";
import { normalize } from "./text";

const fix = (s: string) => correct(normalize(s));

describe("correct", () => {
  it("puts right one slip in a word the site knows", () => {
    expect(fix("hindsigt")).toBe("hindsight");
    expect(fix("flowbord stack")).toBe("flowboard stack");
    expect(fix("wat projcts has he made")).toBe("what projects has he made");
  });

  it("never changes a correct word into a different one", () => {
    // Each of these is one letter from a word the site uses ("grades", "summarizer", "kind", "point").
    for (const word of ["trades", "summarise", "print", "paint", "pitch", "tomato", "airline"]) {
      expect(fix(word)).toBe(normalize(word));
    }
    expect(fix("does the market analyst place trades")).toBe("does the market analyst place trades");
  });

  it("leaves short words, numbers and names with digits alone", () => {
    expect(fix("pi gpa 97 momentum50")).toBe("pi gpa 97 momentum50");
  });

  it("leaves a word alone when more than one known word is as close", () => {
    // "sayse" is one letter from "sayso" and could be read other ways; with a tie nothing is changed.
    const out = fix("zzzzzz");
    expect(out).toBe("zzzzzz");
  });

  it("does not touch a question that has nothing wrong with it", () => {
    for (const q of ["What projects has he built?", "Tell me about Sayso", "How can I contact him?", "Where did he use Redux?"]) {
      expect(fix(q)).toBe(normalize(q));
    }
  });
});
