import type { SkillGroup, SourceKind } from "./schema";

// Facts about Uzair himself. Sources: his CV (numbers checked on 7 October
// 2026), his LinkedIn profile, his GitHub profile README and his projects'
// READMEs. Grades and phone numbers are left out on purpose; see unknowns.ts.

export const person = {
  name: "Mohammad Uzair Khan",
  short: "Uzair",
  role: "Data science, analytics & AI",
  tagline: "Builds AI systems that show their work.",
  // How the site's own pages say it. The assistant keeps to openToWork below, which names where it comes from.
  status: "Open to work in Dubai: on-site, hybrid or remote",
  // A one-page copy of his CV, without phone numbers or grades (see unknowns in faq.ts).
  cv: { url: "/cv/Mohammad-Uzair-Khan-CV.pdf", label: "Download CV (PDF)" },
  // The same CV tailored to data analyst roles: data and BI projects first. Same privacy rules.
  cvAnalyst: { url: "/cv/Mohammad-Uzair-Khan-CV-Data-Analyst.pdf", label: "Data analyst CV (PDF)" },
  // Tailored to digital data roles (digital performance, dashboards, WordPress, platforms). Same privacy rules.
  cvDigital: { url: "/cv/Mohammad-Uzair-Khan-CV-Digital-Data-Solutions.pdf", label: "Digital data CV (PDF)" },
  linkedinHeadline: "Aspiring AI Engineer | CS @ BITS Pilani Dubai | Python · Gemini API · RAG · Claude | 1st Author, IEEE Paper on Edge AI",
  location: "Dubai, UAE",
  timeZone: "Asia/Dubai",
  email: "uk4320930@gmail.com",
  github: "https://github.com/f20230125-sudo",
  githubHandle: "f20230125-sudo",
  linkedin: "https://www.linkedin.com/in/mohammad-uzair-khan-2b24b0355/",
  summary:
    "Mohammad Uzair Khan, who goes by Uzair, is a Computer Science undergraduate at BITS Pilani, Dubai Campus, based in Dubai. He analyses large public datasets (US Medicaid, Medicare formularies, drug prices, the NPI registry, clinical trials) with Python, SQL, Excel and Power BI, evaluates AI and retrieval systems against held-out baselines, and builds LLM agents, front-end interfaces for AI, quant tools and edge machine learning. His projects share one habit: they show their work, with sources, checks and honest limits.",
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
      { name: "TypeScript", aliases: ["ts"], usedIn: ["flowboard", "sayso", "hindsight", "agent-desk", "ai-market-analyst", "rx-market-pulse", "pharma-evidence", "signaldesk-ai", "footnote"] },
      { name: "JavaScript", aliases: ["js"], usedIn: ["noodle", "pokemon-aurora"] },
      { name: "Python", aliases: ["py"], usedIn: ["rx-market-pulse", "payer-access-intelligence", "field-force-planner", "drug-price-watch", "trial-pipeline-benchmark", "pharma-evidence", "signaldesk-ai", "footnote", "agent-desk", "quant-copilot", "ai-trading-copilot", "document-qa-agent", "ticket-triage-agent", "pr-diff-summarizer", "support-triage-pipeline", "property-data-warehouse"], note: "Also at Amaani." },
      { name: "Java", usedIn: [] },
      { name: "SQL", usedIn: ["rx-market-pulse", "payer-access-intelligence", "field-force-planner", "drug-price-watch", "trial-pipeline-benchmark", "signaldesk-ai", "property-data-warehouse", "agent-desk"] },
      { name: "C", usedIn: [] },
      { name: "LaTeX", aliases: ["latex"], usedIn: [] },
    ],
  },
  {
    id: "data",
    label: "Data analysis and BI",
    skills: [
      { name: "Power BI", aliases: ["powerbi", "dax", "business intelligence"], usedIn: ["rx-market-pulse", "payer-access-intelligence"], note: "Star schemas and DAX measures; Rx Market Pulse's report was checked in Power BI Desktop." },
      { name: "Excel", aliases: ["spreadsheets", "spreadsheet", "sumifs", "index match", "excel modelling", "excel modeling"], usedIn: ["rx-market-pulse", "payer-access-intelligence", "field-force-planner", "drug-price-watch", "trial-pipeline-benchmark"], note: "Live-formula models, checked against independent Python recalculations." },
      { name: "Data cleaning and harmonisation", aliases: ["data cleaning", "data harmonisation", "data harmonization", "data transformation", "etl", "data wrangling"], usedIn: ["rx-market-pulse", "trial-pipeline-benchmark", "payer-access-intelligence", "drug-price-watch", "field-force-planner"] },
      { name: "Data-quality checks", aliases: ["data quality", "data validation", "scorecard", "reconciliation"], usedIn: ["rx-market-pulse", "trial-pipeline-benchmark", "drug-price-watch", "field-force-planner", "payer-access-intelligence", "property-data-warehouse"] },
      { name: "Data analysis", aliases: ["data analytics", "analytics", "data analyst", "kpi", "kpis"], usedIn: ["rx-market-pulse", "payer-access-intelligence", "field-force-planner", "drug-price-watch", "trial-pipeline-benchmark"] },
      { name: "Forecasting and backtesting", aliases: ["forecasting", "forecast", "time series", "backtesting", "wape"], usedIn: ["rx-market-pulse", "quant-copilot"] },
      { name: "Model evaluation", aliases: ["evaluation", "evals", "held out", "held-out", "baseline", "bootstrap", "statistics"], usedIn: ["pharma-evidence", "signaldesk-ai", "footnote", "quant-copilot"], note: "Held-out splits frozen before inference, same-model baselines and bootstrap intervals." },
    ],
  },
  {
    id: "frontend",
    label: "Front-end",
    skills: [
      { name: "React", aliases: ["reactjs"], usedIn: ["flowboard", "sayso", "hindsight", "agent-desk", "ai-market-analyst", "quant-copilot"] },
      { name: "Next.js", aliases: ["nextjs", "next"], usedIn: ["flowboard", "sayso", "hindsight", "agent-desk", "ai-market-analyst", "quant-copilot", "rx-market-pulse", "drug-price-watch", "field-force-planner", "trial-pipeline-benchmark", "pharma-evidence", "footnote"] },
      { name: "Redux Toolkit", aliases: ["redux", "rtk", "rtk query", "state management"], usedIn: ["flowboard", "sayso", "hindsight"] },
      { name: "React Flow", aliases: ["xyflow", "reactflow"], usedIn: ["flowboard"] },
      { name: "Tailwind CSS", aliases: ["tailwind", "css"], usedIn: ["sayso", "hindsight", "flowboard", "ai-market-analyst"] },
      { name: "Zod", aliases: ["schema validation"], usedIn: ["flowboard", "sayso", "hindsight"] },
      { name: "Accessibility", aliases: ["a11y", "wcag", "axe"], usedIn: ["flowboard", "sayso", "hindsight"], note: "WCAG checks with axe in both themes." },
      { name: "SVG charts", aliases: ["svg", "data visualisation", "data visualization", "charts", "dataviz"], usedIn: ["hindsight", "quant-copilot", "rx-market-pulse", "drug-price-watch", "field-force-planner", "trial-pipeline-benchmark"] },
    ],
  },
  {
    id: "ai",
    label: "Generative AI and LLMs",
    skills: [
      { name: "Claude API and Claude Code", aliases: ["claude", "anthropic", "claude code"], usedIn: ["agent-desk", "quant-copilot", "ai-trading-copilot", "noodle"] },
      { name: "Gemini API", aliases: ["gemini", "google ai"], usedIn: ["signaldesk-ai", "footnote", "document-qa-agent", "ticket-triage-agent", "pr-diff-summarizer", "support-triage-pipeline", "ai-market-analyst", "flowboard"] },
      { name: "Agentic tool-calling", aliases: ["tool calling", "tool use", "function calling", "agents", "agentic"], usedIn: ["signaldesk-ai", "rx-market-pulse", "footnote", "ai-market-analyst", "ai-trading-copilot", "quant-copilot", "sayso", "agent-desk"] },
      { name: "RAG", aliases: ["retrieval", "retrieval augmented generation", "retrieval-augmented generation"], usedIn: ["footnote", "pharma-evidence", "signaldesk-ai", "document-qa-agent", "ai-trading-copilot"] },
      { name: "BM25", aliases: ["keyword search", "lexical search"], usedIn: ["footnote", "pharma-evidence", "signaldesk-ai"] },
      { name: "Natural language inference", aliases: ["nli", "deberta", "transformers.js", "onnx", "onnx runtime"], usedIn: ["pharma-evidence"], note: "A pretrained INT8 DeBERTa model run in the browser; not trained or fine-tuned here." },
      { name: "FAISS", aliases: ["vector search", "vector store"], usedIn: ["document-qa-agent"] },
      { name: "Structured output", aliases: ["pydantic", "json schema", "typed output"], usedIn: ["ticket-triage-agent", "pr-diff-summarizer", "ai-market-analyst", "sayso", "agent-desk"] },
      { name: "Prompt engineering", aliases: ["prompting", "prompts"], usedIn: [] },
    ],
  },
  {
    id: "ml",
    label: "Machine learning",
    skills: [
      { name: "NumPy and pandas", aliases: ["numpy", "pandas"], usedIn: ["quant-copilot", "ai-trading-copilot", "document-qa-agent", "field-force-planner"] },
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
      { name: "DuckDB", usedIn: ["rx-market-pulse", "payer-access-intelligence", "field-force-planner", "drug-price-watch", "trial-pipeline-benchmark", "pharma-evidence", "property-data-warehouse"] },
      { name: "Redis", usedIn: ["signaldesk-ai"] },
      { name: "MySQL", usedIn: [] },
    ],
  },
  {
    id: "devops",
    label: "Testing and DevOps",
    skills: [
      { name: "Vitest", usedIn: ["flowboard", "sayso", "hindsight", "ai-market-analyst"] },
      { name: "Playwright", aliases: ["e2e", "end to end", "end-to-end"], usedIn: ["flowboard", "sayso", "hindsight", "rx-market-pulse", "drug-price-watch", "field-force-planner", "trial-pipeline-benchmark", "pharma-evidence", "footnote"] },
      { name: "pytest", usedIn: ["rx-market-pulse", "drug-price-watch", "field-force-planner", "trial-pipeline-benchmark", "payer-access-intelligence", "footnote", "agent-desk", "ai-trading-copilot", "document-qa-agent", "ticket-triage-agent", "pr-diff-summarizer"] },
      { name: "GitHub Actions", aliases: ["ci", "ci/cd", "cicd", "continuous integration"], usedIn: ["agent-desk", "flowboard", "sayso", "hindsight", "ai-trading-copilot", "ai-market-analyst", "property-data-warehouse", "drug-price-watch", "payer-access-intelligence", "footnote"] },
      { name: "Docker", usedIn: ["flowboard", "sayso", "hindsight"] },
      { name: "Kubernetes", aliases: ["k8s", "kind cluster"], usedIn: ["flowboard", "sayso", "hindsight"], note: "Manifest applied to a kind cluster in CI." },
      { name: "Vercel", aliases: ["deployment", "hosting"], usedIn: ["agent-desk", "flowboard", "sayso", "hindsight", "rx-market-pulse", "drug-price-watch", "field-force-planner", "trial-pipeline-benchmark", "pharma-evidence", "signaldesk-ai", "footnote"] },
      { name: "Git and GitHub", aliases: ["git", "github"], usedIn: [] },
      { name: "AWS", usedIn: [], note: "AWS Cloud Technical Essentials is in progress." },
      { name: "Raspberry Pi", aliases: ["raspberry pi 4b", "pi"], usedIn: [], note: "Deployed the IEEE model on a Raspberry Pi 4B." },
    ],
  },
];
