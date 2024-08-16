import type { Chunk } from "@/knowledge/chunks";
import { chunkById } from "@/knowledge/chunks";
import { faqs, unknowns } from "@/knowledge/faq";
import { person } from "@/knowledge/profile";
import { featured, projectById, type Project } from "@/knowledge/projects";
import {
  appLabel,
  asOfNote,
  bioBlocks,
  chunkText,
  contactActions,
  cvActions,
  educationBlocks,
  experienceBlocks,
  findChunks,
  followupsFor,
  para,
  projectActions,
  projectsListBlocks,
  researchBlocks,
  skillBlocks,
  skillsOverviewBlocks,
  uniqueChips,
} from "./compose";
import { findEntities, type Entity } from "./entities";
import { correct } from "./spell";
import { synonymsOf } from "./synonyms";
import { search, type Scored } from "./retrieve";
import {
  aspectKinds,
  hasAnaphora,
  isAboutAssistant,
  isCvRequest,
  isGoodbye,
  isGreeting,
  isHowSiteBuilt,
  isIdentity,
  isLiveProjects,
  isInjection,
  isMore,
  isProjectsList,
  isThanks,
  offTopics,
  wantsLinks,
} from "./rules";
import { hasPhrase, normalize, stem, terms } from "./text";
import { emptyContext, type Action, type Answer, type Block, type Context, type Explanation, type Intent } from "./types";

// The whole assistant: a question and what was said so far go in; an answer and
// the new memory come out. Nothing here touches the network or the page, so it
// is tested directly, and nothing in it runs text as an instruction.

const MAX_QUESTION = 300;
/** Below this share of the question covered by the best passage, the answer is "I don't know". */
const MIN_COVERAGE = 0.4;
const MIN_COVERAGE_TWO = 0.55;
const MIN_COVERAGE_LONG = 0.5;
const MIN_SCORE = 1.6;

export interface Result {
  answer: Answer;
  context: Context;
}

interface Draft {
  intent: Intent;
  reason: string;
  grounded: boolean;
  blocks: Block[];
  used: Chunk[];
  actions?: Action[];
  topic?: string | null;
  followups?: string[];
  hits?: Scored[];
  coverage?: number;
}

export function ask(question: string, previous: Context = emptyContext()): Result {
  const raw = question.slice(0, MAX_QUESTION);
  const norm = correct(normalize(raw));
  const entities = findEntities(norm);
  const draft = decide(raw, norm, entities, previous);
  return finish(draft, norm, entities, previous);
}

function decide(raw: string, norm: string, entities: Entity[], ctx: Context): Draft {
  if (!/[a-z0-9]/.test(norm)) {
    return { intent: "unsure", reason: "no words in the question", grounded: false, blocks: [para("I didn't catch a question there. Try asking about his projects, studies, research or how to reach him.")], used: [] };
  }

  if (isInjection(norm)) {
    return {
      intent: "injection",
      reason: "the question tries to change the assistant's instructions",
      grounded: false,
      blocks: [para("There's no prompt here to override: I'm a search over facts Uzair wrote, and I can't be reprogrammed from the chat. Ask me about his work, studies or projects and I'll answer from what he's written.")],
      used: [],
    };
  }
  if (isGreeting(norm)) {
    return {
      intent: "greeting",
      reason: "a greeting",
      grounded: false,
      blocks: [para("Hi! I'm the assistant on Uzair's desktop. I can tell you about his projects, studies, research and experience, or how to reach him. Each answer shows where it came from.")],
      used: [],
      topic: null,
    };
  }
  if (isThanks(norm)) {
    return { intent: "thanks", reason: "thanks", grounded: false, blocks: [para("You're welcome. Anything else you'd like to know about Uzair?")], used: [], topic: ctx.topic };
  }
  if (isGoodbye(norm)) {
    return { intent: "goodbye", reason: "a goodbye", grounded: false, blocks: [para("Bye! If you'd like to talk to Uzair himself, the Contact window has his email.")], used: [], actions: contactActions().slice(0, 1) };
  }

  for (const u of unknowns) {
    if (u.triggers.some((t) => hasPhrase(norm, t))) {
      return { intent: "unknown_topic", reason: `asks for ${u.id}, which is not published on this site`, grounded: false, blocks: [para(u.answer)], used: [], actions: contactActions().slice(0, 1) };
    }
  }

  for (const o of offTopics) {
    if (o.test(norm, raw)) {
      return {
        intent: "off_topic",
        reason: `a request outside the site (${o.id})`,
        grounded: false,
        blocks: [para(o.reply)],
        used: [],
        actions: o.open ? [{ kind: "open", label: o.open.label, target: o.open.app }] : undefined,
        topic: ctx.topic,
      };
    }
  }

  if (isCvRequest(norm)) return faq("faq:cv", "asks for his CV as a file or a page");
  if (isAboutAssistant(norm)) return faq("faq:assistant-nature", "asks about the assistant itself");
  if (isHowSiteBuilt(norm)) return faq("faq:how-built", "asks how the site was built");

  if (isMore(norm)) return more(ctx);

  // A question that is, nearly word for word, one of the prepared ones gets the prepared answer,
  // unless it names a project, which a project's own answer would serve better.
  const prepared = closestPrepared(norm);
  if (prepared && prepared.score >= (entities.some((e) => e.kind === "project") ? 0.9 : 0.7)) {
    return { ...faq(`faq:${prepared.id}`, "is one of the questions Uzair prepared an answer for"), coverage: prepared.score };
  }

  // Which topic is the visitor on? A named one, or the last one if they said "it".
  const named = entities.filter((e) => e.kind === "project");
  const contentTerms = terms(norm);
  // "it" and "what stack?" carry on from the last topic, but only when nothing
  // else is named, so "tell me about his research" never sticks to a project.
  const aspectAsked = aspectKinds.some((a) => a.test.test(norm));
  const followsOn = entities.length === 0 && Boolean(ctx.topic) && (hasAnaphora(norm) || (aspectAsked && contentTerms.length <= 3));
  const projectTopic = ctx.topic ? projectById(ctx.topic) : undefined;
  const topicIds = named.length > 0 ? named.map((e) => e.id) : followsOn && projectTopic ? [projectTopic.id] : [];

  if (topicIds.length >= 2) return compare(topicIds.map((id) => projectById(id)).filter((p): p is Project => Boolean(p)));
  if (topicIds.length === 1) {
    const p = projectById(topicIds[0]);
    if (p) return aboutProject(p, norm, named.length === 0, raw);
  }

  // A technology may name the research hardware, but an attribute question is
  // about the paper's evidence, not whether the skill appears on his CV.
  const researchSubject = /\b(research|paper|model|raspberry|mobilenetv2|mobilenet|plantvillage|ieee)\b/.test(norm);
  const skillQuestion = /\b(know|skill|used|use|experience|familiar)\b/.test(norm) && !/\b(his|the) (research|paper|model)\b/.test(norm);
  if (researchSubject && !skillQuestion) return aboutResearch(norm, raw);

  const skillEntities = entities.filter((e) => e.kind === "skill").slice(0, 3);
  if (skillEntities.length > 0) {
    const built = skillEntities.map((s) => skillBlocks(s.id)).filter((b): b is NonNullable<ReturnType<typeof skillBlocks>> => Boolean(b));
    if (built.length > 0) {
      const used: Project[] = [];
      for (const b of built) for (const p of b.used) if (!used.some((u) => u.id === p.id)) used.push(p);
      const actions: Action[] = used.slice(0, 2).map((p) => ({ kind: "open" as const, label: `Open ${p.name}`, target: `project:${p.id}` }));
      if (built.some((b) => b.blocks.some((x) => x.type === "p" && /IEEE/.test(x.text)))) actions.push({ kind: "open", label: "Open Research", target: "research" });
      return {
        intent: "skill_usage",
        reason: `names ${skillEntities.map((s) => s.label).join(" and ")}`,
        grounded: true,
        blocks: built.flatMap((b) => b.blocks),
        used: findChunks(used.slice(0, 3).map((p) => `${p.id}:overview`)),
        actions,
        topic: used.length === 1 ? used[0].id : "skills",
        followups: used.length > 0 ? [`Tell me about ${used[0].name}`, "What projects has he built?", "Which project should I look at first?"] : undefined,
      };
    }
  }

  const org = entities.find((e) => e.kind === "org");
  if (org) {
    const d = aboutOrg(org, norm);
    if (d) return d;
  }

  if (isIdentity(norm)) {
    return {
      intent: "retrieval",
      reason: "asks who Uzair is",
      grounded: true,
      blocks: bioBlocks(),
      used: findChunks(["person:bio"]),
      actions: [{ kind: "open", label: "Open About", target: "about" }],
      topic: "person",
    };
  }

  if (isLiveProjects(norm)) return projectsList();

  // "Cloud experience" is a question about cloud: the word "experience" says what kind of thing is wanted, not what.
  const withoutGeneric = norm
    .split(" ")
    .filter((t) => !GENERIC_ASK.has(stem(t)))
    .join(" ");
  // The words "CV" and "resume" are rare enough to pull any question to the CV answer. A real request for
  // the file was handled above, so here they only say where something is written ("skills on his resume"):
  // search for the rest of the question, and keep the CV answer for when nothing else is left.
  const mentionsCv = /\b(cv|resume|curriculum vitae)\b/.test(norm);
  const withoutCv = norm.replace(/\b(cv|resume|curriculum vitae)\b/g, " ").replace(/\s+/g, " ").trim();
  const searched = mentionsCv ? (terms(withoutCv).length > 0 ? withoutCv : norm) : terms(withoutGeneric).length > 0 ? withoutGeneric : norm;
  const hits = search(searched, { boostTopics: followsOn && ctx.topic ? [ctx.topic] : undefined, limit: 6 });
  const top = hits[0];
  // The more words a question has, the more of them the best passage must cover.
  const needed = contentTerms.length >= 3 ? MIN_COVERAGE_LONG : contentTerms.length === 2 ? MIN_COVERAGE_TWO : MIN_COVERAGE;
  if (!top || top.coverage < needed || top.score < MIN_SCORE) {
    if (isProjectsList(norm)) return projectsList();
    return unsure(hits);
  }

  // "What projects has he built?" lists them; "what did he build for fun?" is a question about which.
  const topicTerms = contentTerms.filter((t) => !LIST_WORDS.has(t));
  if (isProjectsList(norm) && topicTerms.length === 0) return projectsList();
  // A curated answer wins when the question is close to one of its questions.
  if (top.chunk.kind === "faq" && top.coverage >= 0.55) {
    return { ...faq(top.chunk.id, "matches a prepared answer"), hits, coverage: top.coverage };
  }

  return fromHits(norm, hits);
}

const PREPARED = faqs.flatMap((f) => f.questions.map((q) => ({ id: f.id, tokens: new Set(normalize(q).split(" ").filter(Boolean)) })));

/** The prepared question that shares the largest part of its words with this one. */
function closestPrepared(norm: string): { id: string; score: number } | null {
  const words = new Set(norm.split(" ").filter(Boolean));
  if (words.size < 3) return null;
  let best: { id: string; score: number } | null = null;
  for (const p of PREPARED) {
    let shared = 0;
    for (const w of words) if (p.tokens.has(w)) shared += 1;
    const score = shared / (words.size + p.tokens.size - shared);
    if (!best || score > best.score) best = { id: p.id, score };
  }
  return best;
}

/** Words that say "list them" without saying which, so they do not count as a topic. */
const LIST_WORDS = new Set(["project", "build", "built", "made", "make", "create", "app", "portfolio", "work", "repo", "list", "show", "see", "name", "all", "everyth", "applic", "done", "have", "has"].map(stem));

function faq(id: string, reason: string): Draft {
  const c = chunkById.get(id);
  return {
    intent: id === "faq:assistant-nature" || id === "faq:how-built" ? "about_assistant" : id === "faq:cv" ? "resume" : "retrieval",
    reason,
    grounded: true,
    blocks: chunkText(c).split("\n").map(para),
    used: c ? [c] : [],
    actions:
      id === "faq:best-project"
        ? featured.map((p) => ({ kind: "open" as const, label: `Open ${p.name}`, target: `project:${p.id}` }))
        : id === "faq:cv"
        ? cvActions()
        : c?.app === "contact"
          ? contactActions()
          : c?.app && !c.app.startsWith("project:")
            ? [{ kind: "open", label: `Open ${appLabel(c.app)}`, target: c.app }]
            : undefined,
    topic: c?.topic ?? null,
  };
}

function projectsList(): Draft {
  return {
    intent: "projects_list",
    reason: "asks which projects he has built",
    grounded: true,
    blocks: projectsListBlocks(),
    used: findChunks(featured.map((p) => `${p.id}:overview`)),
    actions: [...featured.map((p) => ({ kind: "open" as const, label: `Open ${p.name}`, target: `project:${p.id}` })), { kind: "open", label: "All projects", target: "projects" }],
    topic: "projects",
  };
}

/** Words that say "tell me what he has" without saying about what, so they do not count as a topic. */
const GENERIC_ASK = new Set(["experience", "know", "knowledge", "skill", "expertise", "background", "proficient"].map(stem));

/** Asked about the time before university, or before a university already named. */
const asksBefore = (norm: string): boolean => /\b(before|previous|previously|earlier|prior|used to)\b/.test(norm);

function compare(ps: Project[]): Draft {
  const list = ps.slice(0, 3);
  return {
    intent: "project",
    reason: `names ${list.length} projects`,
    grounded: true,
    blocks: [
      para(`Here they are side by side:`),
      { type: "list", items: list.map((p) => `${p.name}: ${p.tagline} Built with ${p.stack.slice(0, 5).join(", ")}.`) },
    ],
    used: findChunks(list.map((p) => `${p.id}:overview`)),
    actions: list.slice(0, 3).map((p) => ({ kind: "open" as const, label: `Open ${p.name}`, target: `project:${p.id}` })),
    topic: list[0].id,
  };
}

function aboutProject(p: Project, norm: string, fromContext: boolean, raw: string): Draft {
  const aspect = aspectKinds.find((a) => a.test.test(norm));
  const overview = chunkById.get(`${p.id}:overview`);
  const used: Chunk[] = [];
  let blocks: Block[] = [];
  let reason = fromContext ? `follows on from ${p.name}` : `names ${p.name}`;
  const actions = projectActions(p);

  const detail = projectDetail(p, norm);
  const broad = detail.replace(/\b(project|app|built|build|work|works|stack|tech|technology|technologies|programming|language|languages|framework|frameworks|library|libraries|written|made|limit|limits|limitation|limitations|weakness|weaknesses|cannot|missing|problem|problems|caveat|caveats|downside|drawback|decision|decisions|design|architecture|approach|tradeoff|reason|test|tests|testing|tested|coverage|qa|ci|well|biggest|number|numbers|result|results|accuracy|metric|metrics|statistics|performance|score|benchmark|have|has|use|uses|like|know|return)\b/g, " ");
  const measurementAsked = MEASUREMENTS.some((m) => m.ask.test(detail));
  const attributeAsked = /\b(supports?|integrates?|connects?|exports?)\b/.test(detail) || measurementAsked;
  const linkRequest = wantsLinks(norm) && !attributeAsked;
  if ((terms(broad).filter((t) => !LIST_WORDS.has(t)).length > 0 || measurementAsked) && !linkRequest) {
    const specific = specificHits(p, norm, raw);
    // A metric needs a covering measurement passage; topic-wide word overlap
    // alone must not turn speech accuracy into text-parser accuracy, for example.
    if (specific.length === 0 && (missingAttribute(detail, p.id, raw) || measurementAsked)) return notOnRecord(p.name, p.id, [overview].filter((c): c is Chunk => Boolean(c)), actions);
    if (specific.length > 0) {
      const used = specific.map((h) => h.chunk);
      const blocks: Block[] = used.map((c) => para(c.text));
      const note = asOfNote(used);
      if (note) blocks.push(note);
      return { intent: "project", reason: `${reason}, asks for a particular attribute`, grounded: true, blocks, used, actions, topic: p.id, hits: specific, coverage: specific[0].coverage };
    }
  }

  if (aspect?.label === "stack") {
    const c = chunkById.get(`${p.id}:stack`);
    if (c) used.push(c);
    blocks = [para(chunkText(c))];
    reason += ", asks about its stack";
  } else if (aspect?.label === "limits") {
    const c = chunkById.get(`${p.id}:limits`);
    if (c) {
      used.push(c);
      blocks = [para(`Limits of ${p.name}, as its README states them:`), { type: "list", items: p.limits }];
    } else {
      blocks = [para(`${p.name}'s README doesn't list limits. Its tagline: ${p.tagline}`)];
    }
    reason += ", asks about its limits";
  } else if (aspect?.label === "decisions") {
    const cs = p.decisions.map((_, i) => chunkById.get(`${p.id}:decision:${i}`)).filter((c): c is Chunk => Boolean(c));
    used.push(...cs);
    blocks = cs.length > 0 ? [para(`How ${p.name} is built, and why:`), { type: "list", items: p.decisions }] : [para(`${p.name}: ${p.tagline}`)];
    reason += ", asks about its design";
  } else if (aspect?.label === "tests") {
    const idx = p.facts.map((f, i) => (/\btests?\b|ci\b|axe|playwright|vitest|pytest/i.test(f) ? i : -1)).filter((i) => i >= 0);
    const cs = idx.map((i) => chunkById.get(`${p.id}:fact:${i}`)).filter((c): c is Chunk => Boolean(c));
    used.push(...cs);
    blocks = cs.length > 0 ? [para(`On testing ${p.name}:`), { type: "list", items: cs.map((c) => c.text) }] : [para(`${p.name}'s README doesn't give test figures. ${p.tagline}`)];
    reason += ", asks about testing";
  } else if (aspect?.label === "numbers") {
    const cs = p.facts.slice(0, 4).map((_, i) => chunkById.get(`${p.id}:fact:${i}`)).filter((c): c is Chunk => Boolean(c));
    used.push(...cs);
    blocks = [para(`The numbers behind ${p.name}:`), { type: "list", items: cs.map((c) => c.text) }];
    reason += ", asks for numbers";
  } else if (wantsLinks(norm)) {
    if (overview) used.push(overview);
    blocks = [
      para(`${p.name}: ${p.tagline}`),
      para(p.live ? (p.live.frameable ? "It runs inside its window here, and these are the links." : "The live site and the code are linked below.") : "It has no live site; the code is on GitHub."),
    ];
    reason += ", asks for a link";
  } else {
    const specific = specificHits(p, norm, raw);
    if (specific.length > 0) {
      // A question about something particular in the project: say that, not the whole overview.
      used.push(...specific.map((h) => h.chunk));
      blocks = specific.length === 1 ? [para(specific[0].chunk.text)] : [{ type: "list", items: specific.map((h) => h.chunk.text) }];
      reason += ", asks about something particular in it";
    } else {
      if (overview) used.push(overview);
      const facts = p.facts.slice(0, 3);
      for (let i = 0; i < facts.length; i++) {
        const c = chunkById.get(`${p.id}:fact:${i}`);
        if (c) used.push(c);
      }
      blocks = [para(`${p.name}: ${p.tagline} ${p.pitch}`), { type: "list", items: facts }];
    }
  }
  const note = asOfNote(used);
  if (note) blocks.push(note);
  return { intent: "project", reason, grounded: true, blocks, used, actions, topic: p.id };
}

/**
 * What, inside one project, the question is really about. The project's own
 * name is taken out of the question first, since it matches every passage of
 * the project equally; what is left must be found well in the project's facts
 * and decisions. An unanswered attribute must be declined, rather than being
 * replaced by a grounded overview.
 */
function projectDetail(p: Project, norm: string): string {
  // Remove whole names, not every word from every alias: "LinkedIn" in a
  // posting question is still useful even if "LinkedIn agent" is an alias.
  let detail = ` ${norm} `;
  for (const name of [p.name, ...p.aliases].map(normalize).sort((a, b) => b.length - a.length)) {
    detail = detail.replaceAll(` ${name} `, " ");
  }
  return detail.trim();
}

// These words frame a question without naming a product, format or metric.
// Missing one of them is not evidence that the requested attribute is unknown.
const ATTRIBUTE_FILLER = new Set(terms("support integrate connect offer use need keep without itself automatically automatic autonomous autonomously allow enable handle work project app built build stack tech technology programming written made limit limitation weakness missing problem caveat downside drawback decision design architecture approach tradeoff reason test testing coverage qa ci well biggest number result metric statistic performance benchmark have like know return live site first audit take read see check"));

function attributeDetail(detail: string): string {
  // Keep original words: feeding already stemmed words into search would stem
  // them twice (for example, "erase" -> "eras" -> "era").
  return detail.split(" ").filter((t) => terms(t).length > 0 && !ATTRIBUTE_FILLER.has(stem(t)) && !LIST_WORDS.has(stem(t))).join(" ");
}

/** Only an absent content attribute warrants "not on record"; use no fuzzy
 * spelling here, since a nearby product name is not evidence of an integration.
 * Evidence can be anywhere in this entity, and can use a synonym.
 */
function missingAttribute(detail: string, topic: string, raw: string): boolean {
  const vocabulary = new Set(chunksOf(topic).flatMap((id) => {
    const c = chunkById.get(id);
    return c ? terms(normalize(`${c.text} ${c.keywords.join(" ")}`)) : [];
  }));
  const missing = terms(attributeDetail(detail)).filter((t) => !vocabulary.has(t) && !synonymsOf(t).some((s) => vocabulary.has(s)));
  if (missing.length === 0) return false;
  // A yes/no question or an unfamiliar descriptive word is not, by itself,
  // an unknown attribute. Require an explicit capability/metric request or
  // a named product/format. Check the target after the capability verb so
  // incidental wording before it does not cause a decline.
  const capability = detail.match(/\b(?:supports?|integrates?|connects?|exports?|imports?|uses?|formats?|protocols?|providers?|versions?)\b(.*)/)?.[1];
  const destination = detail.match(/\b(?:to|with|via|through|using|as)\b(.*)/)?.[1];
  const metric = MEASUREMENTS.some((m) => m.ask.test(detail)) || /\b(battery|capacity)\b/.test(detail);
  const named = terms(normalize((raw.match(/\b[A-Z][A-Za-z0-9]+\b/g) ?? []).join(" ")));
  const targets = new Set([...terms(capability ?? ""), ...terms(destination ?? ""), ...named]);
  return missing.some((t) => metric || targets.has(t));
}

function specificHits(p: Project, norm: string, raw: string): Scored[] {
  let rest = projectDetail(p, norm).replace(/\b(support|supports|integrate|integrates|connect|connects|offer|offers|use|uses|need|needs|keep|down|without)\b/g, " ");
  // Indirect requests for write safeguards and adapter compatibility still
  // need the relevant evidence, rather than a tour of the whole project.
  if (/\b(stop|stops|prevent|protect)\b.*\b(break|breaking|harm|damage)\b/.test(rest)) rest = "safety writes";
  else rest = rest.replace(/\bworks? with (my|our|other|custom) (own )?(agents?|apps?|tools?)\b/, "adapter format");
  if (terms(rest).filter((t) => !LIST_WORDS.has(t)).length === 0) return [];
  if (missingAttribute(projectDetail(p, norm), p.id, raw)) return [];
  const focused = attributeDetail(rest);
  const hits = search(focused || rest, { onlyTopics: [p.id], limit: 12 }).filter((h) => h.coverage >= 0.4 && h.score >= MIN_SCORE && attributeSupported(rest, h.chunk));
  const top = hits[0];
  if (!top) return [];
  return hits.filter((h, i) => i === 0 || (h.score >= top.score * 0.7 && h.coverage >= 0.5)).slice(0, 2);
}

const MEASUREMENTS = [
  { ask: /\b(latency|fast|quick|speed|fps|inference time)\b/, evidence: /\b(ms|fps|frames per second|latency|seconds?)\b/i },
  { ask: /\b(power|watts?)\b/, evidence: /\b(w|watts?|power)\b/i },
  { ask: /\b(size|big|small|parameters?)\b/, evidence: /\b(mb|kb|parameters?|size)\b/i },
  { ask: /\b(accuracy|accurate|precision|precise)\b/, evidence: /%|\b(accuracy|precision|correctly)\b/i },
];

/** Numbers must match the requested measurement, not merely the same subject. */
function attributeSupported(query: string, chunk: Chunk): boolean {
  return MEASUREMENTS.every((m) => !m.ask.test(query) || m.evidence.test(chunk.text));
}

function notOnRecord(name: string, topic: string, known: Chunk[], actions: Action[]): Draft {
  return {
    intent: "unknown_topic", reason: `the requested attribute of ${name} is not on record`, grounded: false,
    blocks: [para(`That detail about ${name} is not on record.`), ...(known[0] ? [para(`What is documented: ${known[0].text.split(". ")[0]}.`)] : [])],
    used: known, actions, topic,
  };
}

function aboutResearch(norm: string, raw: string): Draft {
  const detail = norm.replace(/\b(research|paper|model|raspberry pi(?: 4b)?|raspberry|mobilenetv2|mobilenet|plantvillage|ieee(?: msn)?(?: 2026)?)\b/g, " ").replace(/\b(checks?|see|read)\b/g, " ");
  const actions: Action[] = [{ kind: "open", label: "Open Research", target: "research" }];
  if (terms(detail).length === 0) return { intent: "research", reason: "asks about his research", grounded: true, blocks: researchBlocks(), used: findChunks(["research:overview", "research:accuracy"]), actions, topic: "research" };
  if (missingAttribute(detail, "research", raw)) return notOnRecord("his research", "research", findChunks(["research:overview"]), actions);
  // Subject descriptions ("tomato leaf") belong to the overview, but need not
  // recur in a results passage. Rank the requested attribute on its own.
  const subject = new Set(terms(normalize(chunkById.get("research:overview")?.text ?? "")));
  const focused = attributeDetail(detail).split(" ").filter((t) => !subject.has(stem(t))).join(" ");
  const hits = search(focused || detail, { onlyTopics: ["research"], limit: 12 }).filter((h) => attributeSupported(detail, h.chunk));
  const top = hits[0];
  if (!top || top.coverage < 0.4 || top.score < MIN_SCORE) return notOnRecord("his research", "research", findChunks(["research:overview"]), actions);
  return { intent: "research", reason: "asks for a research attribute", grounded: true, blocks: [para(top.chunk.text)], used: [top.chunk], actions, topic: "research", hits, coverage: top.coverage };
}

function schoolDraft(): Draft {
  return { intent: "education", reason: "asks about the time before university", grounded: true, blocks: [para(chunkText(chunkById.get("education:school")))], used: findChunks(["education:school"]), actions: [{ kind: "open", label: "Open Resume", target: "resume" }], topic: "education" };
}

function aboutOrg(org: Entity, norm: string): Draft | null {
  switch (org.id) {
    case "bits":
      if (asksBefore(norm)) return schoolDraft();
      return { intent: "education", reason: "names the university", grounded: true, blocks: educationBlocks(), used: findChunks(["education:university", "education:coursework"]), actions: [{ kind: "open", label: "Open Resume", target: "resume" }], topic: "education" };
    case "amaani":
      return { intent: "experience", reason: "names his internship", grounded: true, blocks: experienceBlocks(), used: findChunks(["experience:amaani"]), actions: [{ kind: "open", label: "Open Resume", target: "resume" }], topic: "experience" };
    case "ieee":
    case "raspberry-pi":
      return { intent: "research", reason: "names his paper", grounded: true, blocks: researchBlocks(), used: findChunks(["research:overview", "research:accuracy"]), actions: [{ kind: "open", label: "Open Research", target: "research" }], topic: "research" };
    case "deriv": {
      const ds = ["ai-market-analyst", "support-triage-pipeline"].map((id) => projectById(id)).filter((p): p is Project => Boolean(p));
      return {
        intent: "project",
        reason: "names Deriv",
        grounded: true,
        blocks: [para("Two of his projects relate to Deriv. One was built for a technical assessment for their AI Engineer internship; the other is modelled on what their product does, with a market-data client for their public API:"), { type: "list", items: ds.map((p) => `${p.name}: ${p.tagline}`) }],
        used: findChunks(ds.map((p) => `${p.id}:overview`)),
        actions: ds.map((p) => ({ kind: "open" as const, label: `Open ${p.name}`, target: `project:${p.id}` })),
        topic: ds[0].id,
      };
    }
    case "linkedin":
    case "github":
      return { intent: "contact", reason: "asks for a profile link", grounded: true, blocks: [para(chunkText(chunkById.get("contact:email")))], used: findChunks(["contact:email"]), actions: contactActions(), topic: "contact" };
    default:
      return null;
  }
}

/** The retrieval result, shaped by what the best passage is about. */
function fromHits(norm: string, hits: Scored[]): Draft {
  const top = hits[0];
  const c = top.chunk;
  const base = { hits, coverage: top.coverage, grounded: true as const };

  if (c.kind === "faq") {
    return { ...base, ...faq(c.id, "matches a prepared answer") };
  }
  switch (c.topic) {
    case "person": {
      if (c.kind === "habit") {
        return { ...base, intent: "retrieval", reason: "asks how he builds", blocks: [para("These are the habits that show up across his repositories:"), { type: "list", items: [...person.habits] }], used: findChunks(["person:habit:0", "person:habit:1"]), actions: [{ kind: "open", label: "Open About", target: "about" }], topic: "person" };
      }
      return { ...base, intent: "retrieval", reason: "about the person", blocks: [para(chunkText(c))], used: [c], actions: [{ kind: "open", label: "Open About", target: "about" }], topic: "person" };
    }
    case "education":
      if (asksBefore(norm) && hits.some((h) => h.chunk.id === "education:school")) return { ...base, ...schoolDraft() };
      if (c.id === "education:university" || c.id === "education:coursework") {
        return { ...base, intent: "education", reason: "about his studies", blocks: educationBlocks(), used: findChunks(["education:university", "education:coursework"]), actions: [{ kind: "open", label: "Open Resume", target: "resume" }], topic: "education" };
      }
      return { ...base, intent: "education", reason: "about his studies", blocks: [para(chunkText(c))], used: [c], actions: [{ kind: "open", label: "Open Resume", target: "resume" }], topic: "education" };
    case "experience":
      return { ...base, intent: "experience", reason: "about his work experience", blocks: experienceBlocks(), used: findChunks(["experience:amaani", "experience:amaani:0"]), actions: [{ kind: "open", label: "Open Resume", target: "resume" }], topic: "experience" };
    case "research":
      if (c.id === "research:overview") {
        return { ...base, intent: "research", reason: "about his paper", blocks: researchBlocks(), used: findChunks(["research:overview", "research:accuracy"]), actions: [{ kind: "open", label: "Open Research", target: "research" }], topic: "research" };
      }
      return { ...base, intent: "research", reason: "about his paper", blocks: [para(chunkText(c))], used: [c], actions: [{ kind: "open", label: "Open Research", target: "research" }], topic: "research" };
    case "skills": {
      const generic = /\b(skill|know|stack|technolog|tool|can he do|good at)/.test(norm);
      return generic
        ? { ...base, intent: "skills", reason: "asks what he knows", blocks: skillsOverviewBlocks(), used: [c], actions: [{ kind: "open", label: "Open Resume", target: "resume" }], topic: "skills" }
        : { ...base, intent: "skills", reason: "asks about a skill group", blocks: [para(chunkText(c))], used: [c], actions: [{ kind: "open", label: "Open Resume", target: "resume" }], topic: "skills" };
    }
    case "contact":
      return {
        ...base,
        intent: "contact",
        reason: "asks how to reach him or whether he is available",
        blocks: c.id === "availability" ? [para(chunkText(chunkById.get("availability"))), para(chunkText(chunkById.get("contact:email")))] : [para(chunkText(chunkById.get("contact:email"))), para(chunkText(chunkById.get("availability")))],
        used: findChunks(["availability", "contact:email"]),
        actions: contactActions(),
        topic: "contact",
      };
    default: {
      // A passage inside one project, or several projects at once.
      const distinct: Scored[] = [];
      for (const h of hits) {
        if (h.score < top.score * 0.55) break;
        if (!projectById(h.chunk.topic)) continue;
        if (distinct.some((d) => d.chunk.topic === h.chunk.topic)) continue;
        distinct.push(h);
        if (distinct.length === 3) break;
      }
      if (distinct.length <= 1) {
        const p = projectById(c.topic);
        if (!p) return { ...base, intent: "retrieval", reason: "best matching passage", blocks: [para(chunkText(c))], used: [c], topic: c.topic };
        // The project was not named, so "testing" in the question is not a request for its tests:
        // answer with the passage that matched, and offer the project.
        return { ...base, intent: "retrieval", reason: `best matching passage is about ${p.name}`, blocks: [para(c.kind === "overview" ? `${p.name}: ${p.tagline} ${p.pitch}` : chunkText(c))], used: [c], actions: projectActions(p), topic: p.id };
      }
      const names = distinct.map((d) => projectById(d.chunk.topic)?.name ?? d.chunk.title);
      return {
        ...base,
        intent: "retrieval",
        reason: `matches passages in ${names.join(", ")}`,
        blocks: [
          para(`That comes up in ${distinct.length} of his projects:`),
          { type: "list", items: distinct.map((d) => `${projectById(d.chunk.topic)?.name}: ${d.chunk.kind === "overview" ? (projectById(d.chunk.topic)?.tagline ?? "") : d.chunk.text}`) },
        ],
        used: distinct.map((d) => d.chunk),
        actions: distinct.slice(0, 3).map((d) => ({ kind: "open" as const, label: `Open ${projectById(d.chunk.topic)?.name}`, target: `project:${d.chunk.topic}` })),
        topic: distinct[0].chunk.topic,
      };
    }
  }
}

function more(ctx: Context): Draft {
  const topic = ctx.topic;
  if (!topic) {
    return { intent: "more", reason: "asks for more, with nothing discussed yet", grounded: false, blocks: [para("More of what? Ask me about a project, his studies, his research or how to reach him.")], used: [] };
  }
  const p = projectById(topic);
  const order = (p
    ? [`${p.id}:overview`, ...p.facts.map((_, i) => `${p.id}:fact:${i}`), ...p.decisions.map((_, i) => `${p.id}:decision:${i}`), `${p.id}:limits`, `${p.id}:stack`]
    : chunksOf(topic)
  ).filter((id) => chunkById.has(id));
  const next = order.filter((id) => !ctx.seen.includes(id)).slice(0, 2);
  if (next.length === 0) {
    return { intent: "more", reason: "everything on this topic has been said", grounded: false, blocks: [para("That's everything I have on that. Want to hear about something else?")], used: [], topic };
  }
  const used = findChunks(next);
  return {
    intent: "more",
    reason: "asks for more on the last topic",
    grounded: true,
    blocks: [{ type: "list", items: used.map((c) => c.text.replace("{{chunks}}", "")) }],
    used,
    actions: p ? projectActions(p) : undefined,
    topic,
  };
}

function chunksOf(topic: string): string[] {
  return [...chunkById.values()].filter((c) => c.topic === topic).map((c) => c.id);
}

function unsure(hits: Scored[]): Draft {
  const near: string[] = [];
  for (const h of hits) {
    const label = projectById(h.chunk.topic)?.name ?? (h.chunk.kind === "faq" ? h.chunk.title : h.chunk.title);
    if (!near.includes(label)) near.push(label);
    if (near.length === 2) break;
  }
  const blocks: Block[] = [para("I don't have that. It isn't something Uzair has told me, and I'd rather say so than guess.")];
  if (near.length > 0) blocks.push(para(`The closest things I do know about: ${near.join(" and ")}.`));
  return {
    intent: "unsure",
    reason: "no passage covered enough of the question",
    grounded: false,
    blocks,
    used: [],
    actions: contactActions().slice(0, 1),
    hits,
    coverage: hits[0]?.coverage ?? 0,
    followups: ["What projects has he built?", "Tell me about his research", "How can I contact him?"],
  };
}

function finish(d: Draft, norm: string, entities: Entity[], prev: Context): Result {
  const seen = [...new Set([...prev.seen, ...d.used.map((c) => c.id)])];
  const topic = d.topic === undefined ? prev.topic : d.topic;
  // A decline or a greeting suggests the usual starting points, not the last project.
  const plain = !d.grounded && d.intent !== "thanks" && d.intent !== "more";
  const followups = (d.followups ?? followupsFor(plain ? null : (topic ?? null), new Set(seen))).filter((q) => normalize(q) !== norm).slice(0, 3);
  const explain: Explanation = {
    normalized: norm,
    intent: d.intent,
    reason: d.reason,
    entities,
    hits: (d.hits ?? []).slice(0, 3).map((h) => ({ id: h.chunk.id, title: h.chunk.title, score: Math.round(h.score * 100) / 100 })),
    coverage: Math.round((d.coverage ?? 0) * 100) / 100,
  };
  return {
    answer: { grounded: d.grounded, blocks: d.blocks, sources: uniqueChips(d.used), actions: d.actions ?? [], followups, explain },
    context: { topic, seen, turns: prev.turns + 1 },
  };
}
