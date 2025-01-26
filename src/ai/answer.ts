import type { Chunk } from "@/knowledge/chunks";
import { chunkById } from "@/knowledge/chunks";
import { unknowns } from "@/knowledge/faq";
import { person } from "@/knowledge/profile";
import { flagship, projectById, type Project } from "@/knowledge/projects";
import {
  asOfNote,
  bioBlocks,
  chunkText,
  contactActions,
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
import { search, type Scored } from "./retrieve";
import {
  aspectKinds,
  hasAnaphora,
  isAboutAssistant,
  isGoodbye,
  isGreeting,
  isHowSiteBuilt,
  isIdentity,
  isInjection,
  isMore,
  isProjectsList,
  isThanks,
  offTopics,
  wantsLinks,
} from "./rules";
import { hasPhrase, normalize, terms } from "./text";
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
  const norm = normalize(raw);
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

  if (isAboutAssistant(norm)) return faq("faq:assistant-nature", "asks about the assistant itself");
  if (isHowSiteBuilt(norm)) return faq("faq:how-built", "asks how the site was built");

  if (isMore(norm)) return more(ctx);

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
    if (p) return aboutProject(p, norm, named.length === 0);
  }

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
    const d = aboutOrg(org);
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

  const hits = search(norm, { boostTopics: followsOn && ctx.topic ? [ctx.topic] : undefined, limit: 6 });
  const top = hits[0];
  // The more words a question has, the more of them the best passage must cover.
  const needed = contentTerms.length >= 3 ? MIN_COVERAGE_LONG : contentTerms.length === 2 ? MIN_COVERAGE_TWO : MIN_COVERAGE;
  if (!top || top.coverage < needed || top.score < MIN_SCORE) {
    if (isProjectsList(norm)) return projectsList();
    return unsure(hits);
  }

  // A curated answer wins when the question is close to one of its questions.
  if (top.chunk.kind === "faq" && top.coverage >= 0.55) {
    return { ...faq(top.chunk.id, "matches a prepared answer"), hits, coverage: top.coverage };
  }
  if (isProjectsList(norm) && top.chunk.topic !== "research" && top.chunk.topic !== "education") return projectsList();

  return fromHits(norm, hits);
}

function faq(id: string, reason: string): Draft {
  const c = chunkById.get(id);
  return {
    intent: id === "faq:assistant-nature" || id === "faq:how-built" ? "about_assistant" : "retrieval",
    reason,
    grounded: true,
    blocks: [para(chunkText(c))],
    used: c ? [c] : [],
    actions: c?.app && !c.app.startsWith("project:") ? [{ kind: "open", label: `Open ${c.app === "settings" ? "Settings" : c.app[0].toUpperCase() + c.app.slice(1)}`, target: c.app }] : undefined,
    topic: c?.topic ?? null,
  };
}

function projectsList(): Draft {
  return {
    intent: "projects_list",
    reason: "asks which projects he has built",
    grounded: true,
    blocks: projectsListBlocks(),
    used: findChunks(flagship.map((p) => `${p.id}:overview`)),
    actions: [{ kind: "open", label: "Open Projects", target: "projects" }],
    topic: "projects",
  };
}

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

function aboutProject(p: Project, norm: string, fromContext: boolean): Draft {
  const aspect = aspectKinds.find((a) => a.test.test(norm));
  const overview = chunkById.get(`${p.id}:overview`);
  const used: Chunk[] = [];
  let blocks: Block[] = [];
  let reason = fromContext ? `follows on from ${p.name}` : `names ${p.name}`;
  const actions = projectActions(p);

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
    if (overview) used.push(overview);
    const facts = p.facts.slice(0, 3);
    for (let i = 0; i < facts.length; i++) {
      const c = chunkById.get(`${p.id}:fact:${i}`);
      if (c) used.push(c);
    }
    blocks = [para(`${p.name}: ${p.tagline} ${p.pitch}`), { type: "list", items: facts }];
  }
  const note = asOfNote(used);
  if (note) blocks.push(note);
  return { intent: "project", reason, grounded: true, blocks, used, actions, topic: p.id };
}

function aboutOrg(org: Entity): Draft | null {
  switch (org.id) {
    case "bits":
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
        return { ...aboutProject(p, norm, false), hits, coverage: top.coverage, reason: `best matching passage is about ${p.name}` };
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
