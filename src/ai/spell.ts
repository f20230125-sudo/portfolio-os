import { chunks } from "@/knowledge/chunks";
import { distance, normalize, STOPWORDS } from "./text";

// Putting right a word that is one slip of the finger from one the site knows
// ("projcts", "hindsigt"), so the patterns that read a question see the word
// they expect. It only touches words of five letters or more that no passage
// uses, and only when exactly one known word is that close.

// Words the patterns in rules.ts look for, which a passage may never use.
const RULE_WORDS =
  "projects project portfolio built build made created experience education contact research available availability internship instructions instruction previous prompt pretend reveal ignore disregard forget override bypass weather salary birthday nationality citizenship hobbies religion address references transcript compensation expectation".split(
    " ",
  );

// Only words that carry meaning for this site are offered as corrections: the
// words in passage titles, passages' keywords (names of projects and
// technologies), and the words the rules look for. A correct English word that
// no passage uses ("print") is never "corrected" into one of them.
const WORDS = new Set<string>(RULE_WORDS);
for (const c of chunks) {
  for (const t of normalize(`${c.title} ${c.keywords.join(" ")}`).split(" ")) if (t.length >= 4) WORDS.add(t);
}

export function correct(norm: string): string {
  return norm
    .split(" ")
    .map((tok) => {
      if (tok.length < 5 || WORDS.has(tok) || STOPWORDS.has(tok) || /\d/.test(tok)) return tok;
      const limit = 1;
      let best: string | null = null;
      let bestD = limit + 1;
      let ties = 0;
      for (const w of WORDS) {
        if (Math.abs(w.length - tok.length) > limit) continue;
        const d = distance(tok, w, limit);
        if (d < bestD) {
          bestD = d;
          best = w;
          ties = 1;
        } else if (d === bestD) ties += 1;
      }
      return best && bestD <= limit && ties === 1 ? best : tok;
    })
    .join(" ");
}
