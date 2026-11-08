import type { Spec } from "./judge";

// Written before the post-M3 regression fix, from the source knowledge.
// These are on-record attributes phrased with synonyms, not unknown features.
export const setD: Spec[] = [
  { q: "How accurate is his tomato leaf model?", all: ["97.33%"] },
  { q: "Can Agent Desk post to LinkedIn by itself?", all: ["Pitch only drafts", "Uzair presses Post himself"] },
  { q: "Can Backroom dispatch emails automatically?", all: ["never sent"] },
  { q: "Can Inbound erase messages?", all: ["cannot send, delete, label or change mail"] },
  { q: "Does Flowboard support cycles?", all: ["No loops"] },
  { q: "Does Hindsight compress the pauses for a human?", all: ["Agent time squeezes each wait for a person"] },
];
