"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { BookOpenText, Brain, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

interface TutorMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  createdAt: string;
}

interface AdhyapakPanelProps {
  topic: string;
  sourceText: string;
  onAsk: (question: string) => Promise<string>;
}

const INITIAL_MESSAGE = "What would you like to understand better?";

export function AdhyapakPanel({ topic, sourceText, onAsk }: AdhyapakPanelProps) {
  const storageKey = useMemo(
    () => `saar_adhyapak_chat::${createTopicHash(`${topic}::${sourceText.slice(0, 600)}`)}`,
    [sourceText, topic]
  );
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved) {
        const starter = [buildMessage("assistant", INITIAL_MESSAGE)];
        setMessages(starter);
        window.localStorage.setItem(storageKey, JSON.stringify(starter));
        return;
      }

      const parsed = JSON.parse(saved) as TutorMessage[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setMessages(parsed);
        return;
      }
    } catch {
      // Fall through to rebuilding a clean thread.
    }

    const starter = [buildMessage("assistant", INITIAL_MESSAGE)];
    setMessages(starter);
    window.localStorage.setItem(storageKey, JSON.stringify(starter));
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined" || messages.length === 0) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  async function handleSend() {
    const question = draft.trim();
    if (!question || isSending) {
      return;
    }

    const userMessage = buildMessage("user", question);
    setMessages((previous) => [...previous, userMessage]);
    setDraft("");
    setError("");
    setIsSending(true);

    try {
      const answer = await onAsk(question);
      setMessages((previous) => [...previous, buildMessage("assistant", answer)]);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Adhyapak could not respond right now."
      );
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    void handleSend();
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <aside className="rounded-[30px] border border-emerald-100 bg-[linear-gradient(160deg,#effcf6_0%,#f8fffc_55%,#ffffff_100%)] p-6 shadow-[0_20px_50px_rgba(16,185,129,0.08)]">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
          <Sparkles className="h-3.5 w-3.5" />
          Adhyapak
        </div>
        <h2 className="mt-4 text-[28px] font-semibold tracking-[-0.04em] text-slate-950">
          Socratic Tutor
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Learn step by step, ask follow-ups freely, and keep the focus on one concept at a time.
        </p>

        <div className="mt-6 space-y-4">
          <div className="rounded-[24px] border border-white/80 bg-white/90 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Current topic</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{topic || "New learning thread"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/80 bg-white/90 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <BookOpenText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Best prompts</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Ask for a simpler explanation, an example, a quiz question, or the next step after a confusing part.
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.07)]">
        <div className="border-b border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f6fffb_100%)] px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-600">Tutor Chat</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">Continue learning with Adhyapak</h3>
        </div>

        <div className="space-y-4 bg-[#fcfefe] px-5 py-5">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-3xl rounded-[24px] px-5 py-4 text-sm leading-7 shadow-sm ${
                  message.role === "user"
                    ? "bg-emerald-600 text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] opacity-70">
                  {message.role === "user" ? "You" : "Adhyapak"}
                </p>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {isSending ? (
            <div className="flex justify-start">
              <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
                Adhyapak is preparing a step-by-step explanation...
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-[20px] border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>

        <div className="border-t border-slate-100 bg-white px-5 py-5">
          <div className="rounded-[28px] border border-slate-200 bg-[#fbfdff] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Adhyapak to explain this in simpler words, test you, or guide you step by step."
              className="min-h-[110px] border-0 bg-transparent px-2 py-2 shadow-none focus-visible:ring-0"
            />
            <div className="flex items-center justify-between gap-3 px-2 pb-1 pt-2">
              <p className="text-xs text-slate-500">Press Enter to send, Shift+Enter for a new line.</p>
              <Button
                onClick={() => void handleSend()}
                disabled={isSending || draft.trim().length === 0}
                className="rounded-full bg-emerald-600 px-5 hover:bg-emerald-700"
              >
                <Send className="mr-2 h-4 w-4" />
                Ask Tutor
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function buildMessage(role: TutorMessage["role"], content: string): TutorMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

function createTopicHash(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash).toString(36);
}
