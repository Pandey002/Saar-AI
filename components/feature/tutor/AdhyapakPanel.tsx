"use client";

import { useEffect, useMemo, useState, useRef, type KeyboardEvent, type ClipboardEvent, type DragEvent, type ChangeEvent } from "react";
import { Paperclip, Sparkles, Send, Mic, Sparkle, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/Textarea";
import { withClientSessionHeaders } from "@/lib/clientSession";

interface TutorMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  createdAt: string;
  parsedDate?: Date;
}

interface AdhyapakPanelProps {
  topic: string;
  sourceText: string;
  onAsk: (question: string) => Promise<string>;
}

const INITIAL_MESSAGE = "What would you like to understand better?";

const CHIPS = ["Simplify this further", "Give a real-world analogy", "Test my knowledge"];

export function AdhyapakPanel({ topic, sourceText, onAsk }: AdhyapakPanelProps) {
  const storageKey = useMemo(
    () => `saar_adhyapak_chat::${createTopicHash(`${topic}::${sourceText.slice(0, 600)}`)}`,
    [sourceText, topic]
  );
  
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState("");
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

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
    if (typeof window === "undefined" || messages.length === 0) return;
    window.localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  useEffect(() => {
    // Scroll to bottom smoothly when messages change
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isSending]);

  async function handleSend(forcedDraft?: string) {
    const question = (forcedDraft || draft).trim();
    if (!question || isSending) return;

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
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    void handleSend();
  }

  async function processUploadedFile(file: File) {
    if (!file) return;
    
    setIsExtracting(true);
    setError("");
    
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/extract-file", withClientSessionHeaders({
        method: "POST",
        body: formData,
      }));
      
      const payload = await response.json();
      
      if (!response.ok || !payload.data) {
        throw new Error(payload.error || "Unable to parse the uploaded file.");
      }
      
      setDraft(prev => prev + (prev.length > 0 ? "\n\n" : "") + `[Attachment: ${file.name}]\n${payload.data.text}\n`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract text from file.");
    } finally {
      setIsExtracting(false);
    }
  }

  function handlePaste(event: ClipboardEvent) {
    const fileItem = Array.from(event.clipboardData.items).find((item) => item.kind === "file");
    if (!fileItem) return;

    const file = fileItem.getAsFile();
    if (!file) return;

    event.preventDefault();
    void processUploadedFile(new File([file], `screenshot-${Date.now()}.png`, { type: file.type || "image/png" }));
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      void processUploadedFile(file);
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
  }

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <section className="relative mx-auto flex w-full max-w-4xl flex-col pt-4 pb-28 md:pt-8 md:pb-36 min-h-[calc(100vh-80px)]">
      
      {/* Intro Overlay Card */}
      <div className="mb-8 rounded-[36px] bg-white p-8 px-8 sm:p-10 shadow-[0_8px_30px_rgba(16,42,67,0.04)] border border-line">
        <h2 className="text-[32px] sm:text-[38px] font-bold tracking-tight text-navy leading-none">
          Namaste, Scholar.
        </h2>
        <p className="mt-4 text-[17px] leading-relaxed text-slate-600 sm:max-w-2xl">
          Ready to dive back into <strong className="text-primary">{topic}</strong>? I've prepared some analogies to make the concepts feel like child's play. Let's begin our journey.
        </p>
      </div>

      {/* Focus Pill */}
      <div className="mb-10 flex justify-center">
         <div className="inline-flex items-center gap-2 rounded-full bg-slate-100/80 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 shadow-sm border border-line/60">
            <Sparkle className="h-3.5 w-3.5 text-primary" />
            CURRENT FOCUS: {topic.toUpperCase()}
         </div>
      </div>

      {/* Chat Flow */}
      <div className="flex flex-col gap-8 px-2 sm:px-6">
        {messages.map((message) => {
          const isUser = message.role === "user";
          return (
            <div key={message.id} className={`flex w-full gap-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
              {/* Adhyapak Avatar */}
              {!isUser && (
                <div className="shrink-0 pt-2 hidden sm:block">
                   <div className="flex h-11 w-11 items-center justify-center rounded-full bg-navy text-white shadow-md">
                      <Sparkles className="h-[22px] w-[22px] text-cyan-400" />
                   </div>
                </div>
              )}
              
              <div className={`flex flex-col ${isUser ? "items-end w-full sm:max-w-[85%] ml-auto" : "items-start w-full sm:max-w-[85%]"}`}>
                <div 
                  className={`rounded-[28px] px-5 py-3.5 text-[15.5px] leading-relaxed shadow-sm w-fit max-w-[95%] sm:max-w-full
                    ${isUser 
                        ? "bg-primary text-white rounded-br-[10px]" 
                        : "bg-surface border border-line/60 text-slate-700 rounded-bl-[10px]"
                    }`}
                >
                  <div className="whitespace-pre-wrap break-words">{message.content}</div>
                </div>
                
                <span className="mt-2.5 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {isUser ? "YOU" : "ADHYAPAK"} &bull; {formatTime(message.createdAt)}
                </span>
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex gap-4">
             <div className="shrink-0 pt-2 hidden sm:block">
                <div className="flex h-11 w-11 animate-pulse items-center justify-center rounded-full bg-slate-200 text-slate-400">
                   <Sparkles className="h-[22px] w-[22px]" />
                </div>
             </div>
             <div className="rounded-[32px] rounded-bl-[12px] border border-slate-100 bg-white px-6 py-5 text-[15.5px] text-slate-500 shadow-sm">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300"></span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: '150ms' }}></span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: '300ms' }}></span>
                </span>
             </div>
          </div>
        )}

        {error && (
          <div className="rounded-[24px] border border-red-100 bg-red-50 p-4 text-center text-[14px] text-red-600 shadow-sm mx-auto max-w-sm">
            {error}
          </div>
        )}
        
        {/* Invisible target for auto-scroll */}
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Sticky Bottom Input Frame */}
      <div className="fixed bottom-0 left-0 lg:left-[280px] right-0 bg-gradient-to-t from-canvas via-canvas to-transparent pt-12 pb-6 px-4 md:px-8 z-20">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center">
           
           {/* Prompt Chips */}
           <div className="mb-4 flex flex-wrap justify-center gap-2">
             {CHIPS.map((chip) => (
               <button 
                 key={chip} 
                 onClick={() => { setDraft(chip); handleSend(chip); }}
                 disabled={isSending}
                 className="rounded-full border border-line bg-surface px-4 py-2 text-[12px] font-semibold tracking-wide text-slate-600 transition hover:border-primary/40 hover:bg-white hover:text-primary shadow-sm disabled:opacity-50"
               >
                 {chip}
               </button>
             ))}
           </div>

           {/* Input Bar */}
           <div 
             className={`flex w-full items-end gap-3 rounded-[32px] border bg-surface p-2 shadow-[0_12px_40px_rgba(16,42,67,0.06)] transition-all duration-300 ${isExtracting ? "border-primary/50 ring-4 ring-primary/20 opacity-70" : "border-line focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10"}`}
             onPaste={handlePaste}
             onDrop={handleDrop}
             onDragOver={handleDragOver}
           >
              
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,.pdf,.txt,.md"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void processUploadedFile(file);
                  e.target.value = "";
                }}
              />

              <button disabled={isExtracting} onClick={() => fileInputRef.current?.click()} type="button" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition disabled:opacity-50">
                 {isExtracting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
              </button>
              
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isExtracting ? "Extracting meaning from image..." : "Ask Adhyapak anything... (Paste screenshot here)"}
                className="min-h-[44px] max-h-[160px] w-full resize-none border-0 bg-transparent py-3 text-[15px] shadow-none focus-visible:ring-0 text-slate-700 placeholder:text-slate-400 disabled:opacity-50"
                disabled={isExtracting}
                rows={1}
              />
              
              <button type="button" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition">
                 <Mic className="h-5 w-5" />
              </button>

              <button
                onClick={() => void handleSend()}
                disabled={isSending || draft.trim().length === 0}
                className="flex h-[46px] w-[46px] sm:h-[48px] sm:w-[48px] shrink-0 items-center justify-center rounded-[16px] bg-primary text-white shadow-md hover:bg-[#0891b2] hover:shadow-lg transition-all disabled:opacity-50 disabled:shadow-none"
              >
                <div className="rotate-[-45deg] relative left-0.5 top-0.5">
                  <Send className="h-[20px] w-[20px]" />
                </div>
              </button>
           </div>
           
           <div className="mt-4 flex w-full justify-center">
             <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                Adhyapak • Academic Mentor
             </p>
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
