import type { Faq, UnknownTopic } from "./schema";

// Answers Uzair's facts do not spell out on their own, written once here so the
// assistant never has to improvise. They describe what can be seen in his work;
// they do not claim anything about his character that the work does not show.

export const faqs: Faq[] = [
  {
    id: "stand-out",
    questions: [
      "What makes his projects different?",
      "Why should we hire him?",
      "What sets Uzair apart?",
      "What is he good at?",
      "What are his strengths?",
    ],
    answer:
      "I can only point at what his repositories show. They share one habit: they show their work. Answers carry their sources, model output is checked against a schema, results are measured on sentences or data written before tuning, and every README has a Limits section that says what the project does not do. Sayso's own README says its rules need a model or a second try for about one fresh sentence in five, and Hindsight's lists the bugs its own tests missed.",
    app: "about",
    sources: ["readme", "cv"],
  },
  {
    id: "weaknesses",
    questions: ["What are his weaknesses?", "What is he bad at?", "What does he need to improve?"],
    answer:
      "Uzair hasn't written a self-assessment, and I won't invent one. What I can show is how he treats limits: each project lists them plainly. The topics he says he is still learning (LLM agent architectures, Google Cloud, Vertex AI) are the honest signs of where he is growing. For a real answer, email him.",
    app: "contact",
    sources: ["cv", "linkedin"],
  },
  {
    id: "best-project",
    questions: [
      "Which project should I look at first?",
      "What is his best project?",
      "What is his most impressive project?",
      "Where should I start?",
      "What is his favourite project?",
    ],
    answer:
      "It depends what you are hiring for. For front-end and agent interfaces, start with Sayso. For data visualisation and accessibility, Hindsight. For state management and an engine with real tests, Flowboard. For agents that are careful about cost and safety, Agent Desk. For statistics, Quant Copilot. Each one opens in a window here, with its demo, its numbers and the decisions behind it.",
    app: "projects",
    sources: ["readme", "cv"],
  },
  {
    id: "looking-for",
    questions: [
      "What is he looking for?",
      "What kind of role does he want?",
      "Is he open to work?",
      "Is he available?",
      "Is he looking for a job?",
      "Is he open to internships?",
      "Can I hire him?",
    ],
    answer:
      "His LinkedIn profile says he is open to work in Dubai, on-site, hybrid or remote, and his headline is Aspiring AI Engineer. He expects to graduate in 2027 and is aiming at AI and software engineering roles. I don't have role types, start dates or notice periods, so for those email him directly.",
    app: "contact",
    sources: ["linkedin", "cv"],
  },
  {
    id: "how-built",
    questions: [
      "How was this site built?",
      "How does this website work?",
      "What is this site made with?",
      "Did he build the windows himself?",
      "How do you work?",
    ],
    answer:
      "This desktop is a small window manager written for the job, with no windowing library: drag, resize, snap, minimise, maximise and stacking are plain functions with unit tests, held in a Redux Toolkit store. It is built with Next.js, React, TypeScript and Tailwind. I am not a language model. I am a search over about {{chunks}} short passages Uzair wrote, with a little intent routing, and everything runs in your browser: no server sees your question. The Simple view under Start shows the same content as a plain page.",
    app: "settings",
    sources: ["told"],
  },
  {
    id: "assistant-nature",
    questions: [
      "Are you an AI?",
      "Are you ChatGPT?",
      "Which model are you?",
      "Are you a real person?",
      "Is this an LLM?",
      "What are you?",
      "Do you use an API?",
    ],
    answer:
      "I'm not a language model and I don't call one. I'm a small search engine written in TypeScript that runs in your browser: it reads your question, finds the passages about Uzair that match, and answers from them, with sources. That means I can't improvise, I say I don't know when I don't, and nothing you type leaves this page.",
    sources: ["told"],
  },
  {
    id: "privacy",
    questions: ["Do you store my questions?", "Is my question sent anywhere?", "Is this private?", "Do you track me?"],
    answer:
      "No. Your questions are answered inside this page and are never sent to a server. This site has no analytics, no cookies and no account. Your theme choice is saved in your browser and nothing else is.",
    sources: ["told"],
  },
  {
    id: "learning",
    questions: ["What is he learning now?", "What is he working on?", "What are his next steps?", "What does he want to learn?"],
    answer:
      "He is going deeper on LLM agent architectures and on Google Cloud, including Vertex AI, and working through the AWS Cloud Technical Essentials course. His newest builds are Sayso, Hindsight and this desktop.",
    sources: ["linkedin", "cv", "told"],
  },
  {
    id: "testing-habit",
    questions: ["Does he write tests?", "How does he test his code?", "Does he care about testing?", "Does he use CI?"],
    answer:
      "Yes, and it shows in the numbers. As of 7 October 2026: Agent Desk has 469 pytest tests, Flowboard 319 unit and 37 end-to-end tests, Sayso 370 unit and 59 end-to-end tests, Hindsight 289 unit and 98 end-to-end tests. The front-end projects add axe accessibility scans in light and dark themes, and CI runs everything on each push, including a Docker build and a Kubernetes manifest applied to a test cluster.",
    app: "projects",
    sources: ["cv", "readme"],
  },
  {
    id: "front-end-skills",
    questions: ["Is he a front-end developer?", "Does he know React?", "Can he do front-end work?", "What front-end experience does he have?"],
    answer:
      "Yes. His four newest projects are front-end heavy: React 19, Next.js, TypeScript, Redux Toolkit, Zod, Tailwind and React Flow, with accessibility tested by axe and a hand-written SVG timeline in Hindsight that uses no chart library. This desktop, with its own window manager, is another example.",
    app: "project:sayso",
    sources: ["cv", "readme"],
  },
  {
    id: "backend-skills",
    questions: ["Is he a backend developer?", "Does he know backend?", "What backend experience does he have?", "Can he do APIs?"],
    answer:
      "Yes. He was a backend developer intern at Amaani in 2025, building RESTful APIs in Python and Flask and documenting them with Swagger/OpenAPI and Postman. His own projects use FastAPI, Flask, SQLite and DuckDB, and Flowboard has a REST relay hardened against SSRF.",
    app: "resume",
    sources: ["cv"],
  },
  {
    id: "free-to-use",
    questions: ["Is this free?", "Does this cost anything?", "Do the demos cost money?"],
    answer:
      "Everything here is free to use. Uzair built the projects so that nothing can bill anyone: the AI features use your own free key, a sample reply, or his own Claude plan on his own PC.",
    sources: ["readme"],
  },
  {
    id: "contact-how",
    questions: ["How can I contact him?", "How do I reach Uzair?", "What is his email?", "How do I get in touch?"],
    answer:
      "Email is best: uk4320930@gmail.com. He is also on LinkedIn and GitHub, and the Contact window has all three.",
    app: "contact",
    sources: ["cv", "linkedin", "github"],
  },
];

/** Things the site will not say, and what to say instead. */
export const unknowns: UnknownTopic[] = [
  {
    id: "salary",
    triggers: ["salary", "pay expectation", "expected pay", "compensation", "ctc", "how much does he earn", "stipend", "expected salary"],
    answer: "Uzair hasn't put pay expectations on this site, and that is a conversation for email: uk4320930@gmail.com.",
  },
  {
    id: "age",
    triggers: ["how old", "his age", "birthday", "date of birth", "born", "dob"],
    answer: "His age and birthday aren't on this site. What is public is that he started at BITS Pilani Dubai in 2023 and expects to graduate in 2027.",
  },
  {
    id: "phone",
    triggers: ["phone number", "whatsapp", "call him", "mobile number", "telephone", "cell number", "contact number", "number to call", "his number", "give me his number"],
    answer: "I don't hold a phone number on this site. Email is the best way to reach him: uk4320930@gmail.com.",
  },
  {
    id: "grades",
    triggers: ["cgpa", "gpa", "grades", "his marks", "school marks", "transcript", "academic performance", "class rank"],
    answer: "Grades aren't published on this site. He shares them on his CV when he applies, so email him and ask: uk4320930@gmail.com.",
  },
  {
    id: "personal",
    triggers: ["married", "girlfriend", "boyfriend", "wife", "family", "parents", "religion", "politics", "political", "dating"],
    answer: "That's personal, so it isn't on this site and I won't guess. I can talk about his work, studies and projects.",
  },
  {
    id: "hobbies",
    triggers: ["hobbies", "hobby", "free time", "outside work", "outside of work", "interests outside", "likes to do"],
    answer: "Uzair hasn't listed hobbies here. What I can say is that two of his projects are just for fun: Pokémon Aurora, a fan-made game where every sprite and song is generated in code, and Noodle, an offline chatbot with 11 games.",
  },
  {
    id: "languages-spoken",
    triggers: ["languages does he speak", "spoken languages", "does he speak", "fluent in", "speak arabic", "speak hindi", "speak english", "mother tongue"],
    answer: "He hasn't listed spoken languages here, though his writing is in English. Email him if it matters for a role.",
  },
  {
    id: "visa",
    triggers: ["visa", "nationality", "citizen", "citizenship", "work permit", "passport", "residency", "sponsorship"],
    answer: "Work authorisation isn't something I know. He is based in Dubai, and any visa or permit question is best asked by email: uk4320930@gmail.com.",
  },
  {
    id: "address",
    triggers: ["home address", "street address", "where exactly does he live", "his address"],
    answer: "Dubai, UAE is as specific as this site gets.",
  },
  {
    id: "references",
    triggers: ["references", "referee", "referees", "recommendation letter", "reference letter"],
    answer: "I don't have references on this site. His advisor on the IEEE paper is Prof. Pranav M. Pawar, and anything beyond that is a conversation to start by email: uk4320930@gmail.com.",
  },
];
