// Small UI helpers: keep these independent of retrieval and the knowledge chunks.
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "2026-10-18" as "18 October 2026". */
export const dayLabel = (iso: string): string => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTH_NAMES[m - 1]} ${y}`;
};

export const STARTERS = [
  "What projects has he built?",
  "Tell me about his research",
  "Where has he worked?",
  "How can I contact him?",
  "What is he looking for?",
];
