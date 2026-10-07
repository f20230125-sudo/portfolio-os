// Turning a question into plain words the rest of the engine can compare.
// Everything here is a pure function: no state, no network.

const CONTRACTIONS: [RegExp, string][] = [
  [/\bwhat's\b/g, "what is"],
  [/\bwho's\b/g, "who is"],
  [/\bwhere's\b/g, "where is"],
  [/\bhow's\b/g, "how is"],
  [/\bthat's\b/g, "that is"],
  [/\bit's\b/g, "it is"],
  [/\bhe's\b/g, "he is"],
  [/\bshe's\b/g, "she is"],
  [/\bthere's\b/g, "there is"],
  [/\blet's\b/g, "let us"],
  [/\bi'm\b/g, "i am"],
  [/\byou're\b/g, "you are"],
  [/\bthey're\b/g, "they are"],
  [/\bwe're\b/g, "we are"],
  [/\bcan't\b/g, "can not"],
  [/\bcannot\b/g, "can not"],
  [/\bwon't\b/g, "will not"],
  [/\bdon't\b/g, "do not"],
  [/\bdoesn't\b/g, "does not"],
  [/\bdidn't\b/g, "did not"],
  [/\bisn't\b/g, "is not"],
  [/\baren't\b/g, "are not"],
  [/\bwasn't\b/g, "was not"],
  [/\bhasn't\b/g, "has not"],
  [/\bhaven't\b/g, "have not"],
  [/\bi've\b/g, "i have"],
  [/\bi'd\b/g, "i would"],
  [/\bi'll\b/g, "i will"],
  [/\bhe'd\b/g, "he would"],
  [/\bn't\b/g, " not"],
];

// Words that should stay one token, written the way people write them.
const KEEP_WHOLE: [RegExp, string][] = [
  [/next\.?\s?js/g, "nextjs"],
  [/node\.?\s?js/g, "nodejs"],
  [/react\.?\s?js/g, "react"],
  [/ci\s?\/\s?cd/g, "cicd"],
  [/q\s?&\s?a/g, "qa"],
  [/c\+\+/g, "cpp"],
  [/c#/g, "csharp"],
  [/\bf1\b/g, "fone"],
  [/\bk8s\b/g, "kubernetes"],
  [/\bai\.at\.core\b/g, "aiatcore"],
  [/\be[- ]?mail\b/g, "email"],
  [/\bpoke\s?mon\b/g, "pokemon"],
  [/pokémon/g, "pokemon"],
  [/\bfront[- ]end\b/g, "frontend"],
  [/\bback[- ]end\b/g, "backend"],
  [/\bfull[- ]stack\b/g, "fullstack"],
  [/\bopen[- ]source\b/g, "opensource"],
  [/\bread[- ]?me\b/g, "readme"],
  [/\bun[- ]?known\b/g, "unknown"],
];

export function normalize(input: string): string {
  let s = input.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
  s = s.replace(/[‘’ʼ]/g, "'");
  for (const [re, to] of CONTRACTIONS) s = s.replace(re, to);
  for (const [re, to] of KEEP_WHOLE) s = s.replace(re, to);
  s = s.replace(/[^a-z0-9%\s']/g, " ").replace(/'/g, "").replace(/\s+/g, " ").trim();
  return s;
}

export const STOPWORDS = new Set(
  (
    "a an the and or but if of to in on at by for with from as is are was were be been being am do does did done have has had " +
    "it its this that these those there here he him his she her they them their i me my we us our you your " +
    "what which who whom whose when where why how can could would should will shall may might must " +
    "about into over under again then than too very just so also not no yes please tell show give let " +
    "any some all each every more most much many such own same other another " +
    "uzair uzairs khan mohammad mr"
  ).split(" "),
);

/** Light suffix stripping, applied the same way to questions and passages. */
export function stem(word: string): string {
  if (word.length <= 3 || /^\d/.test(word)) return word;
  let w = word;
  if (w.endsWith("ies") && w.length > 4) w = `${w.slice(0, -3)}y`;
  else if (w.endsWith("sses")) w = w.slice(0, -2);
  else if (w.endsWith("ss") || w.endsWith("us") || w.endsWith("is")) return w;
  else if (w.endsWith("es") && w.length > 4 && /(ch|sh|x|z|s)es$/.test(w)) w = w.slice(0, -2);
  else if (w.endsWith("s") && w.length > 3) w = w.slice(0, -1);
  if (w.length > 5 && w.endsWith("ing") && /[aeiouy]/.test(w.slice(0, -3))) {
    w = w.slice(0, -3);
    if (/([^aeiou])\1$/.test(w) && !/(ll|ss|zz)$/.test(w)) w = w.slice(0, -1);
  } else if (w.length > 4 && w.endsWith("ed") && /[aeiouy]/.test(w.slice(0, -2))) {
    w = w.slice(0, -2);
    if (/([^aeiou])\1$/.test(w) && !/(ll|ss|zz)$/.test(w)) w = w.slice(0, -1);
  } else if (w.length > 5 && w.endsWith("ly")) w = w.slice(0, -2);
  else if (w.length > 6 && w.endsWith("ation")) w = `${w.slice(0, -5)}e`;
  else if (w.length > 6 && w.endsWith("ment")) w = w.slice(0, -4);
  // "base", "based" and "basing" all end up as "bas".
  if (w.length >= 4 && w.endsWith("e")) w = w.slice(0, -1);
  return w;
}

export function tokens(normalized: string): string[] {
  return normalized.split(" ").filter(Boolean);
}

/** Content words, stemmed. */
export function terms(normalized: string): string[] {
  return tokens(normalized)
    .filter((t) => !STOPWORDS.has(t))
    .map(stem);
}

/** True if the phrase appears in the text as whole words. */
export function hasPhrase(normalized: string, phrase: string): boolean {
  const p = normalize(phrase);
  if (!p) return false;
  return ` ${normalized} `.includes(` ${p} `);
}

/** Edit distance with transpositions, for forgiving small slips of the finger. */
export function distance(a: string, b: string, limit = 3): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  const m = a.length;
  const n = b.length;
  const d: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[m][n];
}
