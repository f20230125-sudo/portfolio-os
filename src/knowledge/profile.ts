import type { SkillGroup, SourceKind } from "./schema";

// Facts about Uzair himself. Sources: his CV (numbers checked on 7 October
// 2026), his LinkedIn profile, his GitHub profile README and his projects'
// READMEs. Grades and phone numbers are left out on purpose; see unknowns.ts.

export const person = {
  name: "Mohammad Uzair Khan",
  short: "Uzair",
  role: "Software & AI engineer",
  headline: "I build AI systems that show their work.",
  linkedinHeadline: "Aspiring AI Engineer | CS @ BITS Pilani Dubai | Python · Gemini API · RAG · Claude | 1st Author, IEEE Paper on Edge AI",
  location: "Dubai, UAE",
  timeZone: "Asia/Dubai",
  email: "uk4320930@gmail.com",
  github: "https://github.com/f20230125-sudo",
  githubHandle: "f20230125-sudo",
  linkedin: "https://www.linkedin.com/in/mohammad-uzair-khan-2b24b0355/",
  summary:
    "Mohammad Uzair Khan, who goes by Uzair, is a Computer Science undergraduate at BITS Pilani, Dubai Campus, based in Dubai. He builds LLM agents, front-end interfaces for AI, retrieval pipelines, quant tools and edge machine learning, and his projects share one habit: they show their work, with sources, checks and honest limits.",
  openToWork:
    "His LinkedIn profile says he is open to work in Dubai, on-site, hybrid or remote.",
  graduating: "Expected 2027",
  learning: ["LLM agent architectures", "Google Cloud", "Vertex AI"],
  habits: [
    "Grounded answers: results come from retrieved documents, computed values and tool calls rather than a model's memory, and they carry their sources.",
    "Typed, validated output: model replies are constrained by schemas and checked again before anything uses them.",
    "Statistical honesty: backtests face a null test, models train on time-ordered splits, and a planted-edge control proves the pipeline can find signal.",
    "Graceful degradation: every layer has a fallback, so a missing key or a dead network never breaks a demo.",
    "Tests where they matter: end-to-end and accessibility tests, and numbers measured on sentences written before tuning.",
  ],
} as const;

export const education = {
  university: {
    name: "BITS Pilani, Dubai Campus",
    degree: "B.E. Computer Science",
    expected: "2027",
    started: "2023",
    coursework: [
      "Data Structures and Algorithms",
      "Operating Systems",
      "Computer Networks",
      "Machine Learning",
      "Large Language Models",
      "Database Management Systems",
    ],
  },
  school: { name: "Bishop Conrad Senior Secondary School", place: "Bareilly, India", year: "2023", level: "Senior Secondary (Class XII)" },
} as const;

export const experience = [
  {
    id: "amaani",
    role: "Backend Developer Intern",
    org: "Amaani",
    orgNote: "a Dubai travel-tech startup",
    place: "Dubai, UAE",
    program: "Practice School (PS-1) at BITS Pilani",
    when: "Jun 2025 to Aug 2025",
    bullets: [
      "Developed and maintained backend services in Python (Flask), building RESTful APIs for core travel-booking features.",
      "Documented API contracts with Swagger/OpenAPI and validated endpoints end to end with Postman; implemented request validation and data models.",
    ],
    skills: ["Python", "Flask", "REST APIs", "Swagger/OpenAPI", "Postman"],
    sources: ["cv", "linkedin"] as SourceKind[],
  },
] as const;

export const research = {
  title: "Lightweight Deep Learning for Tomato Leaf Disease Detection on Edge Devices",
  role: "First author",
  status: "Submitted to IEEE MSN 2026 (under review)",
  advisor: "Prof. Pranav M. Pawar",
  years: "2025 to 2026",
  summary:
    "A MobileNetV2 classifier for tomato leaf disease, trained with two-phase transfer learning, compressed with INT8 post-training quantisation and deployed on a Raspberry Pi 4B for real-time on-device inference.",
  metrics: [
    { label: "Test accuracy", value: "97.33%", note: "10 disease classes, PlantVillage dataset" },
    { label: "Macro-F1", value: "0.963", note: "" },
    { label: "Mean AUC", value: "0.994", note: "" },
    { label: "Model size", value: "5.3 MB", note: "1.4 million parameters, INT8 TensorFlow Lite" },
    { label: "Latency", value: "~250 ms", note: "per image on a Raspberry Pi 4B, about 3.6 FPS" },
    { label: "Power", value: "~3.2 W", note: "on the Raspberry Pi 4B" },
  ],
  stack: ["TensorFlow", "Keras", "TensorFlow Lite", "MobileNetV2", "Raspberry Pi 4B", "PlantVillage"],
} as const;

export const certifications = [
  { name: "The Ultimate Job Ready Data Science Course", by: "CodeWithHarry", when: "2026", status: "completed" },
  { name: "AWS Cloud Technical Essentials", by: "Coursera", when: "", status: "in progress" },
] as const;

/**
 * Skills, grouped as on his CV, with the projects that use each. The "used in"
 * links are what lets the assistant answer "where did he use Redux?".
 */
export const skillGroups: SkillGroup[] = [
  {
    id: "languages",
    label: "Languages",
    skills: [
      { name: "TypeScript", aliases: ["ts"], usedIn: ["flowboard", "sayso", "hindsight", "agent-desk", "ai-market-analyst"] },
      { name: "JavaScript", aliases: ["js"], usedIn: ["noodle", "pokemon-aurora"] },
      { name: "Python", aliases: ["py"], usedIn: ["agent-desk", "quant-copilot", "ai-trading-copilot", "document-qa-agent", "ticket-triage-agent", "pr-diff-summarizer", "support-triage-pipeline", "property-data-warehouse"], note: "Also at Amaani." },
      { name: "Java", usedIn: [] },
      { name: "SQL", usedIn: ["property-data-warehouse", "agent-desk"] },
      { name: "C", usedIn: [] },
      { name: "LaTeX", aliases: ["latex"], usedIn: [] },
    ],
  },
  {
    id: "frontend",
    label: "Front-end",
    skills: [
      { name: "React", aliases: ["reactjs"], usedIn: ["flowboard", "sayso", "hindsight", "agent-desk", "ai-market-analyst", "quant-copilot"] },
      { name: "Next.js", aliases: ["nextjs", "next"], usedIn: ["flowboard", "sayso", "hindsight", "agent-desk", "ai-market-analyst", "quant-copilot"] },
      { name: "Redux Toolkit", aliases: ["redux", "rtk", "rtk query", "state management"], usedIn: ["flowboard", "sayso", "hindsight"] },
      { name: "React Flow", aliases: ["xyflow", "reactflow"], usedIn: ["flowboard"] },
      { name: "Tailwind CSS", aliases: ["tailwind", "css"], usedIn: ["sayso", "hindsight", "flowboard", "ai-market-analyst"] },
      { name: "Zod", aliases: ["schema validation"], usedIn: ["flowboard", "sayso", "hindsight"] },
      { name: "Accessibility", aliases: ["a11y", "wcag", "axe"], usedIn: ["flowboard", "sayso", "hindsight"], note: "WCAG checks with axe in both themes." },
      { name: "SVG charts", aliases: ["svg", "data visualisation", "data visualization", "charts", "dataviz"], usedIn: ["hindsight", "quant-copilot"] },
    ],
  },
  {
    id: "ai",
    label: "Generative AI and LLMs",
    skills: [
      { name: "Claude API and Claude Code", aliases: ["claude", "anthropic", "claude code"], usedIn: ["agent-desk", "quant-copilot", "ai-trading-copilot", "noodle"] },
      { name: "Gemini API", aliases: ["gemini", "google ai"], usedIn: ["document-qa-agent", "ticket-triage-agent", "pr-diff-summarizer", "support-triage-pipeline", "ai-market-analyst", "flowboard"] },
      { name: "Agentic tool-calling", aliases: ["tool calling", "tool use", "function calling", "agents", "agentic"], usedIn: ["ai-market-analyst", "ai-trading-copilot", "quant-copilot", "sayso", "agent-desk"] },
      { name: "RAG", aliases: ["retrieval", "retrieval augmented generation", "retrieval-augmented generation"], usedIn: ["document-qa-agent", "ai-trading-copilot"] },
      { name: "FAISS", aliases: ["vector search", "vector store"], usedIn: ["document-qa-agent"] },
      { name: "Structured output", aliases: ["pydantic", "json schema", "typed output"], usedIn: ["ticket-triage-agent", "pr-diff-summarizer", "ai-market-analyst", "sayso", "agent-desk"] },
      { name: "Prompt engineering", aliases: ["prompting", "prompts"], usedIn: [] },
    ],
  },
  {
    id: "ml",
    label: "Machine learning",
    skills: [
      { name: "NumPy and pandas", aliases: ["numpy", "pandas"], usedIn: ["quant-copilot", "ai-trading-copilot", "document-qa-agent"] },
      { name: "scikit-learn", aliases: ["sklearn"], usedIn: ["ai-trading-copilot"] },
      { name: "TensorFlow and Keras", aliases: ["tensorflow", "keras", "tf"], usedIn: [], note: "Used in the IEEE edge-ML paper." },
      { name: "TensorFlow Lite", aliases: ["tflite", "quantisation", "quantization", "edge ml", "edge ai"], usedIn: [], note: "INT8 quantisation in the IEEE paper." },
      { name: "Transfer learning", usedIn: [], note: "Two-phase transfer learning in the IEEE paper." },
    ],
  },
  {
    id: "backend",
    label: "Backend and databases",
    skills: [
      { name: "FastAPI", usedIn: ["agent-desk", "quant-copilot", "ai-trading-copilot"] },
      { name: "Flask", usedIn: ["document-qa-agent"], note: "Also at Amaani." },
      { name: "REST API design", aliases: ["rest", "rest api", "rest apis", "api design", "apis"], usedIn: ["flowboard", "sayso", "document-qa-agent"], note: "And at Amaani." },
      { name: "Swagger/OpenAPI and Postman", aliases: ["swagger", "openapi", "postman"], usedIn: [], note: "At Amaani." },
      { name: "SQLite", usedIn: ["agent-desk"] },
      { name: "DuckDB", usedIn: ["property-data-warehouse"] },
      { name: "MySQL", usedIn: [] },
    ],
  },
  {
    id: "devops",
    label: "Testing and DevOps",
    skills: [
      { name: "Vitest", usedIn: ["flowboard", "sayso", "hindsight", "ai-market-analyst"] },
      { name: "Playwright", aliases: ["e2e", "end to end", "end-to-end"], usedIn: ["flowboard", "sayso", "hindsight"] },
      { name: "pytest", usedIn: ["agent-desk", "ai-trading-copilot", "document-qa-agent", "ticket-triage-agent", "pr-diff-summarizer"] },
      { name: "GitHub Actions", aliases: ["ci", "ci/cd", "cicd", "continuous integration"], usedIn: ["agent-desk", "flowboard", "sayso", "hindsight", "ai-trading-copilot", "ai-market-analyst", "property-data-warehouse"] },
      { name: "Docker", usedIn: ["flowboard", "sayso", "hindsight"] },
      { name: "Kubernetes", aliases: ["k8s", "kind"], usedIn: ["flowboard", "sayso", "hindsight"], note: "Manifest applied to a kind cluster in CI." },
      { name: "Vercel", aliases: ["deployment", "hosting"], usedIn: ["agent-desk", "flowboard", "sayso", "hindsight"] },
      { name: "Git and GitHub", aliases: ["git", "github"], usedIn: [] },
      { name: "AWS", usedIn: [], note: "AWS Cloud Technical Essentials is in progress." },
      { name: "Raspberry Pi", aliases: ["raspberry pi 4b", "pi"], usedIn: [], note: "Deployed the IEEE model on a Raspberry Pi 4B." },
    ],
  },
];
