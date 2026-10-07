import { chunks, type Chunk } from "@/knowledge/chunks";
import { synonymsOf } from "./synonyms";
import { distance, normalize, stem, terms } from "./text";

// BM25 over the passages, with three small additions: words in a passage's
// title and keywords weigh more than words in its text, a word that is nearly a
// word we know (a slip of the finger) is read as that word, and a word reached
// through a synonym counts for less than the word itself.

const K1 = 1.2;
const B = 0.75;
const FIELD_WEIGHT = { title: 3, keywords: 2.2, text: 1 } as const;

interface Doc {
  chunk: Chunk;
  tf: Map<string, number>;
  length: number;
}

function indexTerms(text: string): string[] {
  return terms(normalize(text));
}

const docs: Doc[] = chunks.map((chunk) => {
  const tf = new Map<string, number>();
  const bump = (list: string[], weight: number) => {
    for (const t of list) tf.set(t, (tf.get(t) ?? 0) + weight);
  };
  bump(indexTerms(chunk.title), FIELD_WEIGHT.title);
  bump(chunk.keywords.flatMap(indexTerms), FIELD_WEIGHT.keywords);
  const text = indexTerms(chunk.text);
  bump(text, FIELD_WEIGHT.text);
  let length = 0;
  for (const v of tf.values()) length += v;
  return { chunk, tf, length };
});

const df = new Map<string, number>();
for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
const N = docs.length;
const AVG_LEN = docs.reduce((n, d) => n + d.length, 0) / N;
const VOCAB = [...df.keys()];

export const passageCount = N;

const idf = (term: string): number => {
  const n = df.get(term) ?? 0;
  return Math.log(1 + (N - n + 0.5) / (n + 0.5));
};

export interface QueryTerm {
  term: string;
  weight: number;
  /** Terms that stand in for one word the passages never use: matching any one of them counts once. */
  group?: string;
}

/** The words of a question as the index will look for them. */
export function queryTerms(normalized: string): QueryTerm[] {
  const out = new Map<string, number>();
  const groups = new Map<string, string>();
  const put = (term: string, weight: number, group?: string) => {
    out.set(term, Math.max(out.get(term) ?? 0, weight));
    if (group) groups.set(term, group);
  };
  for (const original of terms(normalized)) {
    let base = original;
    let weight = 1;
    if (!df.has(base) && base.length >= 5) {
      // A slip of the finger: the closest word we know, if it is close enough.
      const limit = base.length >= 8 ? 2 : 1;
      let best: string | null = null;
      let bestD = limit + 1;
      for (const v of VOCAB) {
        if (Math.abs(v.length - base.length) > limit) continue;
        const d = distance(base, v, limit);
        if (d < bestD || (d === bestD && best !== null && (df.get(v) ?? 0) > (df.get(best) ?? 0))) {
          best = v;
          bestD = d;
        }
      }
      if (best && bestD <= limit) {
        base = best;
        weight = 0.8;
      }
    }
    const known = df.has(base);
    const synonyms = synonymsOf(base).filter((s) => df.has(s));
    if (known) {
      put(base, weight);
      for (const syn of synonyms) put(syn, 0.45, base);
    } else if (synonyms.length > 0) {
      // A word the passages never use, but whose meaning they do: it counts as
      // being matched when one of its synonyms is.
      for (const syn of synonyms) put(syn, 0.8, `via:${base}`);
    } else {
      // Not in any passage and nothing like one: it still counts against how
      // well a passage covers the question, so "how tall is he" is not answered.
      put(base, weight);
    }
  }
  return [...out].map(([term, weight]) => ({ term, weight, group: groups.get(term) }));
}

export interface Scored {
  chunk: Chunk;
  score: number;
  /** Share of the question's weight this passage matched, 0 to 1. */
  coverage: number;
}

export interface SearchOptions {
  /** Passages about this topic score higher. */
  boostTopics?: string[];
  boostFactor?: number;
  /** Only search these topics. */
  onlyTopics?: string[];
  /** Passages of these kinds score higher, for "what is the stack" and the like. */
  boostKinds?: Chunk["kind"][];
  limit?: number;
}

export function search(normalized: string, opts: SearchOptions = {}): Scored[] {
  const q = queryTerms(normalized);
  if (q.length === 0) return [];
  // What a perfect match could earn: used to say how well a passage covers the question.
  // Each thing asked counts once: a word with several stand-ins is one thing.
  const worth = new Map<string, number>();
  for (const x of q) if (x.weight >= 0.8) worth.set(x.group ?? x.term, Math.max(worth.get(x.group ?? x.term) ?? 0, idf(x.term) * x.weight));
  const total = [...worth.values()].reduce((n, v) => n + v, 0) || 1;
  const scored: Scored[] = [];
  for (const d of docs) {
    if (opts.onlyTopics && !opts.onlyTopics.includes(d.chunk.topic)) continue;
    let score = 0;
    const got = new Map<string, number>();
    for (const { term, weight, group } of q) {
      const f = d.tf.get(term);
      if (!f) continue;
      const w = idf(term) * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * d.length) / AVG_LEN))) * weight;
      score += w;
      if (weight >= 0.8) got.set(group ?? term, Math.max(got.get(group ?? term) ?? 0, idf(term) * weight));
      // A synonym of a word that was asked for counts as most of the way to having it.
      else if (group) got.set(group, Math.max(got.get(group) ?? 0, idf(group) * 0.7));
    }
    if (score === 0) continue;
    const matched = [...got.values()].reduce((n, v) => n + v, 0);
    const coverage = Math.min(1, matched / total);
    // A passage that answers more of what was asked beats one that answers a part of it very strongly.
    score *= 0.6 + 0.8 * coverage;
    if (opts.boostTopics?.includes(d.chunk.topic)) score *= opts.boostFactor ?? 1.8;
    if (opts.boostKinds?.includes(d.chunk.kind)) score *= 1.5;
    scored.push({ chunk: d.chunk, score, coverage });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, opts.limit ?? 5);
}

/** Exposed for tests. */
export const _internals = { stem, idf, docs };
