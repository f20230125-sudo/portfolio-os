import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ask } from "@/ai/answer";
import { emptyContext } from "@/ai/types";
import { askAbout } from "@/os/actions";
import { answerDelay, submitQuestion } from "./askSlice";
import { makeStore } from "./store";

const originalDelay = answerDelay.ms;
beforeEach(() => { answerDelay.ms = 0; });
afterEach(() => {
  answerDelay.ms = originalDelay;
  vi.useRealTimers();
});

describe("lazy assistant submission", () => {
  it("returns the same answer and follow-up context after the import settles", async () => {
    const store = makeStore();
    const expected = ask("Tell me about Backroom", emptyContext());
    const reply = store.dispatch(submitQuestion("  Tell me about Backroom  "));
    expect(store.getState().ask.pending).toBe(true);
    await reply;
    expect(store.getState().ask.messages[1]).toMatchObject({ role: "assistant", answer: expected.answer });
    expect(store.getState().ask.context).toEqual(expected.context);
    const followup = ask("What is it built with?", expected.context);
    await store.dispatch(submitQuestion("What is it built with?"));
    expect(store.getState().ask.messages[3]).toMatchObject({ role: "assistant", answer: followup.answer });
    expect(store.getState().ask.pending).toBe(false);
  });

  it("ignores blank questions and repeated submissions while pending", async () => {
    const store = makeStore();
    await store.dispatch(submitQuestion("  "));
    expect(store.getState().ask.messages).toEqual([]);
    const first = store.dispatch(submitQuestion("Tell me about Backroom"));
    await store.dispatch(submitQuestion("Tell me about Inbound"));
    await first;
    expect(store.getState().ask.messages).toHaveLength(2);
  });

  it("keeps the answer delay and lets OS callers await the reply", async () => {
    vi.useFakeTimers();
    answerDelay.ms = 320;
    const store = makeStore();
    const reply = store.dispatch(askAbout("Tell me about Backroom"));
    expect(store.getState().windows.focusedId).toBe("ask");
    await vi.dynamicImportSettled();
    await vi.advanceTimersByTimeAsync(319);
    expect(store.getState().ask.pending).toBe(true);
    expect(store.getState().ask.messages).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    await reply;
    expect(store.getState().ask.pending).toBe(false);
    expect(store.getState().ask.messages).toHaveLength(2);
  });

  it("says the assistant could not load, instead of waiting for ever, when its code fails to download", async () => {
    vi.resetModules();
    vi.doMock("@/ai/answer", () => {
      throw new Error("ChunkLoadError");
    });
    const { submitQuestion: submit } = await import("./askSlice");
    const { makeStore: make } = await import("./store");
    const store = make();
    await store.dispatch(submit("Tell me about Backroom"));
    const reply = store.getState().ask.messages[1];
    expect(store.getState().ask.pending).toBe(false);
    expect(reply).toMatchObject({ role: "assistant", answer: { grounded: false, actions: [{ kind: "ask", target: "Tell me about Backroom" }] } });
    vi.doUnmock("@/ai/answer");
    vi.resetModules();
  });
});
