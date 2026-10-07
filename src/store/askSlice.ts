import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { ask } from "@/ai/answer";
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

export const submitQuestion =
  (question: string): AppThunk =>
  (dispatch, getState) => {
    const text = question.trim().slice(0, 300);
    if (!text || getState().ask.pending) return;
    dispatch(askActions.userAsked(text));
    const run = () => {
      const { answer, context } = ask(text, getState().ask.context);
      dispatch(askActions.answered({ question: text, answer, context }));
    };
    if (answerDelay.ms <= 0) run();
    else setTimeout(run, answerDelay.ms);
  };
