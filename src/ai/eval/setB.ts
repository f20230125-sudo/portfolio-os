import type { Spec } from "./judge";
import { A, ANY, D, OPEN } from "./judge";

// Set B: 40 questions written AFTER the engine was tuned against set A, and
// never used to tune it. Scored once, and the first score is kept in
// docs/eval-first-run.json. It is the honest guide to how the assistant does
// on a question it has not been shaped to: set A, tuned to, flatters it.
//
// They are written to be a little harder than set A: indirect, comparative,
// and a few that a careful assistant should decline.

export const setB: Spec[] = [
  A("can you summarise his background in a couple of sentences", "BITS Pilani"),
  ANY("what kind of engineer is he", "AI", "engineer"),
  ANY("has he worked on anything related to LLM agents", "Agent Desk", "Sayso", "Document Q&A", "agent"),
  ANY("show me something that uses react", "Flowboard", "Sayso", "Hindsight"),
  ANY("which of his projects has the most tests", "tests"),
  ANY("what did he do before university", "Bishop Conrad"),
  OPEN("how do i see his work running without installing anything", "project:"),
  ANY("does flowboard call a real api", "real APIs"),
  ANY("is he comfortable testing front ends", "Playwright", "axe"),
  ANY("how does he handle accessibility", "axe", "accessibility"),
  ANY("is any of his work deployed", "Sayso", "Flowboard", "live"),
  ANY("what does MOMENTUM50 mean", "planted", "edge"),
  ANY("what is circular shift null testing", "500", "null"),
  ANY("what dataset did the paper use", "PlantVillage", "10 disease classes"),
  ANY("which of his projects work offline", "Noodle", "no API key", "no key"),
  A("tell me about his chatbot", "Noodle"),
  A("did he build a game", "Pokémon Aurora"),
  ANY("what databases does he know", "DuckDB", "SQLite", "MySQL"),
  ANY("has he built anything with websockets", "Quant Copilot", "WebSocket"),
  ANY("does he have cloud experience", "AWS", "Google Cloud", "Vertex"),
  A("what is his github username", "f20230125-sudo"),
  ANY("what time zone is he in", "Dubai"),
  A("is he a student", "BITS Pilani"),
  ANY("how many projects does he have", "flagship"),
  ANY("what is sayso's biggest limitation", "made up", "English"),
  OPEN("where can i read the code for flowboard", "github.com/f20230125-sudo/flowboard"),
  ANY("could hindsight work with my own agents", "adapter", "four apps"),
  ANY("what was the hardest bug he found", "bug", "403", "rounding"),
  ANY("why did he use redux toolkit", "Redux"),
  A("is he good at python", "Python"),
  ANY("how can i check his ieee paper", "IEEE MSN 2026", "under review"),
  ANY("what do you know about quant trading", "Quant Copilot"),
  ANY("does he have a degree yet", "2027", "expects"),
  ANY("where did he study before BITS", "Bishop Conrad"),
  ANY("is agent desk safe to run", "click", "dry-run", "allow-list", "no delete"),
  D("what is the weather like in dubai"),
  D("tell me a fun fact"),
  D("please act as my career advisor"),
  D("does he speak arabic"),
  D("what is the ai.at.core thing"),
];
