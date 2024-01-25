"use client";

import { SendHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { STARTERS } from "@/ai/compose";
import { AppIcon } from "@/os/icons";
import { appDef } from "@/os/apps";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { submitQuestion } from "@/store/askSlice";
import { AnswerView } from "./AnswerView";

const ICON = appDef("ask")!.icon;

export default function AskApp({ focusNonce }: { focusNonce: number }) {
  const dispatch = useAppDispatch();
  const messages = useAppSelector((s) => s.ask.messages);
  const pending = useAppSelector((s) => s.ask.pending);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant")?.id;

  // Ready to type whenever the window is brought up.
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, [focusNonce]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, pending]);

  const send = (text: string) => {
    if (!text.trim()) return;
    dispatch(submitQuestion(text));
    setDraft("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <AppIcon icon={ICON} size={36} />
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold leading-tight">Ask Uzair</h2>
          <p className="text-[12.5px] leading-snug text-faint">Not a language model: it searches facts Uzair wrote, shows its sources, and says so when it does not know.</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 py-4" role="log" aria-live="polite" aria-label="Conversation">
        <div className="mx-auto flex max-w-[640px] flex-col gap-4">
          <div className="rise-in max-w-[92%] self-start rounded-2xl rounded-tl-sm bg-surface-2 px-3.5 py-3 text-[14px] leading-relaxed">
            <p data-selectable>Hi, I&apos;m the assistant on Uzair&apos;s desktop. Ask me about his projects, studies, research or experience, or how to reach him. I answer only from what he has written, and I show where each answer came from.</p>
            {messages.length === 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Suggested questions">
                {STARTERS.slice(0, 4).map((q) => (
                  <button key={q} type="button" className="chip" onClick={() => send(q)}>
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="rise-in max-w-[85%] self-end rounded-2xl rounded-tr-sm bg-accent px-3.5 py-2 text-[14px] text-accent-fg" data-selectable>
                {m.text}
              </div>
            ) : (
              <div key={m.id} className="rise-in max-w-[94%] self-start rounded-2xl rounded-tl-sm bg-surface-2 px-3.5 py-3">
                <AnswerView answer={m.answer} latest={m.id === lastAssistant} />
              </div>
            ),
          )}

          {pending && (
            <div className="self-start rounded-2xl rounded-tl-sm bg-surface-2 px-4 py-3" role="status" aria-label="Looking for an answer">
              <span className="flex gap-1" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="thinking-dot h-1.5 w-1.5 rounded-full bg-faint" style={{ animationDelay: `${i * 160}ms` }} />
                ))}
              </span>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <form
        className="flex items-center gap-2 border-t border-line bg-surface-2 px-3 py-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
      >
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={300}
          placeholder="Ask about Uzair's projects, studies, research…"
          aria-label="Ask a question about Uzair"
          autoComplete="off"
          className="h-10 min-w-0 flex-1 rounded-lg border border-line-strong bg-surface px-3 text-[14px] outline-none focus:border-accent"
        />
        <button type="submit" className="btn btn-primary h-10 w-10 !p-0" aria-label="Send question" disabled={pending || !draft.trim()}>
          <SendHorizontal size={17} />
        </button>
      </form>
    </div>
  );
}
