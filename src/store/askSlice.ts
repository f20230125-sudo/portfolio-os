import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { emptyContext, type Answer, type Context } from "@/ai/types";
import type { AppThunk } from "./store";

// The conversation with the assistant. The answers themselves come from
// src/ai, which knows nothing about Redux; this slice only keeps them.

export type Message =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "assistant"; answer: Answer; question: string };

export interface AskState {
  messages: Message[];
  context: Context;
  /** True for the moment between a question and its answer, so the dots can show. */
  pending: boolean;
  nextId: number;
}

const initialState: AskState = { messages: [], context: emptyContext(), pending: false, nextId: 1 };

const askSlice = createSlice({
  name: "ask",
  initialState,
  reducers: {
    userAsked(s, a: PayloadAction<string>) {
      s.messages.push({ id: s.nextId++, role: "user", text: a.payload });
      s.pending = true;
    },
    answered(s, a: PayloadAction<{ question: string; answer: Answer; context: Context }>) {
      s.messages.push({ id: s.nextId++, role: "assistant", answer: a.payload.answer, question: a.payload.question });
      s.context = a.payload.context;
      s.pending = false;
    },
    clear() {
      return initialState;
    },
  },
});

export const askActions = askSlice.actions;
export default askSlice.reducer;

/** The short pause before an answer, so it reads as a reply and not a flash. Tests set it to 0. */
export const answerDelay = { ms: 320 };

/** The reply when the assistant's code fails to load: not grounded, and it offers a retry. */
export function loadFailed(question: string): Answer {
  return {
    grounded: false,
    blocks: [{ type: "p", text: "The assistant could not load just now, so I cannot answer yet. Check the connection and ask again, or reload the page." }],
    sources: [],
    actions: [{ kind: "ask", label: "Ask again", target: question }],
    followups: [],
    explain: { normalized: question, intent: "unsure", reason: "The assistant's code failed to load.", entities: [], hits: [], coverage: 0 },
  };
}

export const submitQuestion =
  (question: string): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const text = question.trim().slice(0, 300);
    if (!text || getState().ask.pending) return;
    dispatch(askActions.userAsked(text));
    // Load and pause together: a cold import need not add to the reading delay.
    const delay = answerDelay.ms > 0 ? new Promise<void>((resolve) => setTimeout(resolve, answerDelay.ms)) : undefined;
    let result: { answer: Answer; context: Context };
    try {
      const { ask } = await import("@/ai/answer");
      await delay;
      result = ask(text, getState().ask.context);
    } catch {
      // The engine's code could not be fetched (offline, or the site was redeployed mid-visit).
      // Say so instead of leaving the typing dots up for ever.
      await delay;
      result = { answer: loadFailed(text), context: getState().ask.context };
    }
    dispatch(askActions.answered({ question: text, ...result }));
  };
