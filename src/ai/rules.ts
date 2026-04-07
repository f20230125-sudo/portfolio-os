import { hasPhrase } from "./text";
import type { Chunk } from "@/knowledge/chunks";

// The patterns that need no search: hellos, goodbyes, attempts to reprogram the
// assistant, requests it has no business answering. All of them read the
// normalised question, so capitals, punctuation and "don't" versus "do not"
// never matter.

const any = (n: string, res: RegExp[]) => res.some((re) => re.test(n));

export const isGreeting = (n: string): boolean =>
  n.split(" ").length <= 4 &&
  any(n, [/^(hi|hii|hello|hey|heya|hiya|yo|sup|howdy|hola|salam|namaste|greetings)\b/, /^good (morning|afternoon|evening|day)\b/, /^whats up$/, /^what is up$/]);

export const isThanks = (n: string): boolean => n.split(" ").length <= 6 && any(n, [/\bthank/, /\bthx\b/, /\bcheers\b/, /\bappreciate/]);

export const isGoodbye = (n: string): boolean =>
  n.split(" ").length <= 5 && any(n, [/^(bye|goodbye|cya|see you|see ya|later|good night|take care)\b/]);

export const isInjection = (n: string): boolean =>
  any(n, [
    /\bignore (all |any |your |the |my |every |previous |prior |above |earlier )*(instruction|prompt|rule|direction|guideline|context)/,
    /\bdisregard (all |any |your |the |previous |prior )*(instruction|prompt|rule|above)/,
    /\bforget (everything|all|your|what you)\b/,
    /\b(system|hidden|initial|original) (prompt|message|instruction)/,
    /\b(reveal|show|print|repeat|leak|tell me) (me )?(your|the) (prompt|instruction|rule|configuration|system)/,
    /\byou are now\b/,
    /\bpretend (to be|you are|youre)\b/,
    /\bact as (a|an|if|my|the)\b/,
    /\broleplay\b/,
    /\bjailbreak\b/,
    /\bdeveloper mode\b/,
    /\bdan mode\b/,
    /\bnew instructions?\b/,
    /\boverride (your|the|all)\b/,
    /\bbypass (your|the|all)\b/,
  ]);

/** Things a visitor might type that are not about Uzair, with what to say. */
export interface OffTopic {
  id: string;
  test: (n: string, raw: string) => boolean;
  reply: string;
  /** A window that is a fair answer to the real wish behind the request. */
  open?: { app: string; label: string };
}

export const offTopics: OffTopic[] = [
  {
    id: "joke",
    test: (n) => /\b(joke|funny|make me laugh|riddle|pun)\b/.test(n),
    reply: "I don't have jokes, since I only know what Uzair wrote down. His chatbot Noodle has plenty, though.",
    open: { app: "project:noodle", label: "Open Noodle" },
  },
  {
    id: "creative",
    test: (n) => /\b(write|compose|make up|generate) (me |us )?(a |an |the )?(poem|story|song|essay|haiku|limerick|email|letter|cover letter|speech|rap|lyrics)\b/.test(n) || /\b(sing|rap|tell me a story)\b/.test(n),
    reply: "I can't write new things; I can only find what Uzair has written down about himself. If you want his work to speak for itself, his projects are the place to look.",
    open: { app: "projects", label: "Open Projects" },
  },
  {
    id: "code",
    test: (n) => /\b(write|fix|debug|explain|generate|give me) (me )?(some |a |an |the |this |my )?(\w+ )?(code|script|function|program|regex|sql query|algorithm)\b/.test(n) || /\bleetcode\b/.test(n),
    reply: "I don't write code. I can only answer questions about Uzair. His code is public on GitHub if you'd like to read how he writes it.",
    open: { app: "contact", label: "Open Contact" },
  },
  {
    id: "weather",
    test: (n) => /\b(weather|temperature outside|forecast|rain|humid)\b/.test(n) && !/\bflowboard|heat check\b/.test(n),
    reply: "I can't check the weather. I only know about Uzair, his work and his studies.",
  },
  {
    id: "news",
    test: (n) => /\b(news|headlines|election|president|prime minister|stock price|bitcoin price|score of|who won|football|cricket match)\b/.test(n),
    reply: "That's outside what I know. I only know about Uzair, his work and his studies.",
  },
  {
    id: "math",
    test: (n, raw) => (/\d\s*[-+*/x^\u00d7\u00f7]\s*\d/.test(raw) && raw.replace(/[^a-z]/gi, "").length < 14) || /\b(solve|calculate|compute) (this|the|for)\b/.test(n),
    reply: "I'm not a calculator or a language model. I can only answer questions about Uzair. (His chatbot Noodle has a real equation solver, though.)",
    open: { app: "project:noodle", label: "Open Noodle" },
  },
  {
    id: "general",
    test: (n) => /\b(capital of|meaning of life|recipe|translate|horoscope|movie|lyrics|who invented|how to (cook|lose weight|make money)|best (restaurant|phone|laptop))\b/.test(n),
    reply: "That's outside what I know. I can answer questions about Uzair: his projects, studies, research, experience and how to reach him.",
  },
  {
    id: "self-opinion",
    test: (n) => /\bwhat do you (think|feel|believe|like)\b|\bdo you (like|love|hate|feel)\b|\bare you (happy|sad|alive|conscious|sentient)\b/.test(n),
    reply: "I don't have opinions or feelings; I'm a search over facts Uzair wrote. I can tell you what his projects do and what he has built.",
  },
];

/**
 * Asking for the CV itself, as a file or a page: "can I download his CV",
 * "where is his resume", "his cv". Not asking about what is on it ("is Redux on
 * his CV", "what does his resume say"), which is a question about him.
 */
export const isCvRequest = (n: string): boolean => {
  if (!/\b(cv|resume|curriculum vitae)\b/.test(n)) return false;
  if (n.split(" ").length <= 3) return true;
  if (/\b(download|pdf|attach|attachment|send me|email me|share)\b/.test(n)) return true;
  if (/\b(on|in|from|says?|said|lists?|listed|contains?|mentions?|includes?|about|under|section|writes?|wrote)\b/.test(n)) return false;
  return /\b(where|find|get|see|view|read|access|have|show|copy|link|file|print|open)\b/.test(n);
};

export const isMore = (n: string): boolean =>
  n.split(" ").length <= 5 && any(n, [/^(tell me )?more\b/, /^go on\b/, /^continue\b/, /^what else\b/, /^anything else\b/, /^elaborate\b/, /^expand\b/, /^and\b\s*\w{0,6}$/, /^keep going\b/]);

export const hasAnaphora = (n: string): boolean => /\b(it|its|this|that|there|these|those|the project|same one|this one|that one)\b/.test(n);

export const isAboutAssistant = (n: string): boolean =>
  any(n, [
    /\bwho are you\b/,
    /\bwhat are you\b/,
    /\bare you (an? )?(ai|bot|robot|human|real|person|chatgpt|gpt|llm|claude|gemini|language model|assistant)\b/,
    /\bwhich (model|llm|ai)\b/,
    /\bwhat (model|llm) (are|do) you\b/,
    /\bhow do you work\b/,
    /\bhow (are|were) you (built|made|trained|programmed)\b/,
    /\bwho (made|built|created|wrote) you\b/,
    /\bwhat can you do\b/,
    /\bwhat can i ask\b/,
    /\bwhat should i ask\b/,
    /^help$/,
    /\bdo you use (an? )?(api|openai|chatgpt|gpt|llm|model)\b/,
    /\bare you (powered|backed) by\b/,
  ]);

export const isHowSiteBuilt = (n: string): boolean =>
  any(n, [
    /\bhow (was|is) (this|the) (site|website|page|portfolio|desktop|os|thing) (built|made|created|coded)\b/,
    /\bwhat (is|was) (this|the) (site|website|portfolio|desktop) (built|made) (with|using|in|on)\b/,
    /\bhow does (this|the) (site|website|portfolio|desktop|window manager) work\b/,
    /\b(this|the) (site|website|portfolio|desktop)'?s? (tech )?stack\b/,
    /\bdid he (build|make|write|code) (the|this) (windows?|window manager|desktop|site|website)\b/,
  ]);

export const isProjectsList = (n: string): boolean =>
  any(n, [
    /\bhow many (projects|apps|applications|repos|repositories|builds)\b/,
    /\b(what|which|list|show|see|all|tell|name|any)\b.*\b(projects|builds|apps|applications|portfolio|repos|repositories|work)\b/,
    /\bwhat (has|did|have) (he|uzair|you)\b.*\b(built|made|created|build|make|done)\b/,
    /\bhis (projects|builds|work|portfolio|repos|repositories)\b/,
    /^(projects|portfolio|his work|his projects)$/,
  ]);

export const isIdentity = (n: string): boolean =>
  any(n, [
    /\bwho is (he|uzair|mohammad|mohammad uzair khan|this guy|this person)\b/,
    /\b(tell me|talk) about (him|himself|uzair|yourself)\b/,
    /\babout (him|uzair)\b/,
    /\bintroduce (him|uzair|yourself)\b/,
    /\bwho is the (owner|person|developer|engineer)\b/,
    /\bsummar(y|ise|ize) (of )?(him|uzair|his profile|his background)\b/,
    /^(about|about me|bio|profile|summary)$/,
  ]);

/** Words in a project question that say which part of the project is wanted. */
export const aspectKinds: { test: RegExp; kinds: Chunk["kind"][]; label: string }[] = [
  { test: /\b(stack|built with|made with|technolog|tech|language|framework|librar|written in|uses what|use what)\b/, kinds: ["stack"], label: "stack" },
  { test: /\b(limit|weak|cannot|can not|missing|problem|caveat|downside|drawback|not done|flaw|wrong|fail)/, kinds: ["limit"], label: "limits" },
  { test: /\b(decision|decide|why|design|architect|approach|how does it work|how is it built|how was it built|how it works|trade ?off|reason)/, kinds: ["decision"], label: "decisions" },
  { test: /\b(tests?|testing|tested|coverage|qa|ci|pytest|vitest|playwright|axe)\b/, kinds: ["fact"], label: "tests" },
  { test: /\b(number|result|accuracy|metric|stat|measure|how many|how much|performance|score|fast|benchmark)/, kinds: ["fact"], label: "numbers" },
];

export const wantsLinks = (n: string): boolean =>
  hasPhrase(n, "live") || /\b(link|url|demo|try|website|site|repo|repository|source code)\b/.test(n) || /\bwhere can i (see|find|try|use|run|open|get)\b/.test(n);
