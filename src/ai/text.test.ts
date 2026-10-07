import { describe, expect, it } from "vitest";
import { distance, hasPhrase, normalize, stem, terms } from "./text";

describe("normalize", () => {
  it("ignores capitals, punctuation and extra spaces", () => {
    expect(normalize("  What's   his   STACK?!  ")).toBe("what is his stack");
  });
  it("reads contractions as their long form", () => {
    expect(normalize("Don't you know? He can't, it isn't")).toBe("do not you know he can not it is not");
  });
  it("keeps technology names whole", () => {
    expect(normalize("Next.js and Node.js, CI/CD, Q&A")).toBe("nextjs and nodejs cicd qa");
    expect(normalize("C++ or C#")).toBe("cpp or csharp");
    expect(normalize("Pokémon")).toBe("pokemon");
    expect(normalize("front-end, back-end, e-mail")).toBe("frontend backend email");
  });
  it("copes with nothing, symbols and very long input", () => {
    expect(normalize("")).toBe("");
    expect(normalize("?!?!?! 😀 ...")).toBe("");
    expect(normalize("a".repeat(5000)).length).toBe(5000);
  });
  it("strips markup characters instead of passing them on", () => {
    expect(normalize("<script>alert(1)</script>")).toBe("script alert 1 script");
  });
});

describe("stem", () => {
  it("treats forms of a word alike", () => {
    expect(stem("testing")).toBe(stem("tests"));
    expect(stem("tested")).toBe(stem("test"));
    expect(stem("projects")).toBe(stem("project"));
    expect(stem("based")).toBe(stem("base"));
    expect(stem("queries")).toBe(stem("query"));
    expect(stem("building")).toBe(stem("build"));
  });
  it("leaves short words and numbers alone", () => {
    expect(stem("api")).toBe("api");
    expect(stem("97")).toBe("97");
    expect(stem("string")).toBe("string");
    expect(stem("status")).toBe("status");
  });
});

describe("terms", () => {
  it("keeps the content words only", () => {
    expect(terms(normalize("What is the stack of Sayso?"))).toEqual(["stack", "sayso"]);
  });
});

describe("hasPhrase", () => {
  it("matches whole words, not parts of words", () => {
    expect(hasPhrase("what is his salary", "salary")).toBe(true);
    expect(hasPhrase("salaryman", "salary")).toBe(false);
    expect(hasPhrase("how old is he", "how old")).toBe(true);
    expect(hasPhrase("a household name", "old")).toBe(false);
  });
});

describe("distance", () => {
  it("counts a swapped pair of letters as one slip", () => {
    expect(distance("recieve", "receive")).toBe(1);
    expect(distance("sayso", "sayso")).toBe(0);
    expect(distance("flowbaord", "flowboard")).toBe(1);
  });
  it("gives up early on words that are far apart", () => {
    expect(distance("a", "abcdefgh", 2)).toBeGreaterThan(2);
  });
});
