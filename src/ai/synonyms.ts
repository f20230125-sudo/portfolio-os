import { normalize, stem, tokens } from "./text";

// Words that mean nearly the same thing for this site. A question that says
// "resume" should find a passage that says "CV". Each group is stemmed the same
// way as the passages, and a match through a synonym counts for less than a
// match on the very word.

const GROUPS: string[][] = [
  ["cv", "resume", "curriculum", "vitae"],
  ["university", "college", "bits", "pilani", "degree", "study", "student", "education", "campus"],
  ["job", "employment", "career", "intern", "internship", "experience", "position", "employer", "company", "amaani"],
  ["paper", "research", "publication", "publish", "ieee", "journal", "academic"],
  ["project", "build", "built", "made", "app", "application", "portfolio", "create", "develop"],
  ["contact", "email", "reach", "message", "mail", "touch"],
  ["hire", "hiring", "recruit", "available", "availability", "opening"],
  ["skill", "tech", "technology", "tool", "stack", "proficient", "framework", "library"],
  ["test", "testing", "qa", "coverage", "verify", "verified"],
  ["fast", "quick", "speed", "performance", "latency"],
  ["secure", "security", "safe", "safety", "protect", "ssrf", "csp", "attack", "injection"],
  ["live", "demo", "deployed", "hosted", "website", "try", "online"],
  ["code", "repo", "repository", "source", "github", "git"],
  ["accessible", "accessibility", "a11y", "wcag", "axe", "screen reader"],
  ["chart", "graph", "visualisation", "visualization", "dataviz", "plot", "timeline", "diagram"],
  ["agent", "agentic", "bot", "assistant", "copilot"],
  ["game", "gaming", "play", "fun", "playful"],
  ["free", "cost", "money", "price", "paid", "cheap"],
  ["edge", "embedded", "device", "hardware", "raspberry", "mobilenetv2", "tflite"],
  ["trading", "quant", "finance", "market", "stock", "backtest"],
  ["strength", "skilled", "talented", "excellent"],
  ["weakness", "limit", "limitation", "flaw", "drawback", "caveat", "shortcoming"],
  ["decision", "design", "architecture", "reason", "tradeoff", "approach"],
  ["learn", "studying", "growing", "upskill", "currently"],
  ["location", "located", "based", "city", "country", "dubai", "uae"],
  ["frontend", "ui", "interface", "client", "react", "nextjs"],
  ["backend", "server", "api", "rest", "flask", "fastapi"],
  ["database", "sql", "duckdb", "sqlite", "warehouse", "mysql"],
  ["llm", "gpt", "gemini", "claude", "model", "genai"],
  ["rag", "retrieval", "embedding", "faiss", "vector"],
  ["state", "redux", "store", "rtk"],
  ["name", "called", "named"],
  ["require", "need", "must", "optional", "necessary", "mandatory"],
  ["find", "found", "discover", "discovered", "uncover", "reveal", "revealed"],
  ["receive", "arrive", "send", "sent", "accept", "import", "hand over"],
  ["accuracy", "accurate", "precision", "correct", "result", "score"],
  ["impressive", "best", "favourite", "favorite", "proud", "highlight", "flagship", "showcase", "standout"],
];

const map = new Map<string, Set<string>>();
for (const group of GROUPS) {
  const stems = group.flatMap((w) => tokens(normalize(w)).map(stem));
  for (const s of stems) {
    const set = map.get(s) ?? new Set<string>();
    for (const t of stems) if (t !== s) set.add(t);
    map.set(s, set);
  }
}

/** Other stemmed words that mean about the same as this stemmed word. */
export function synonymsOf(term: string): string[] {
  return [...(map.get(term) ?? [])];
}
