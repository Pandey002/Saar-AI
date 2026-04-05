"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import { FileText, FileUp, Link2, Sparkles, GraduationCap } from "lucide-react";
import { PremiumResultsView } from "@/components/feature/PremiumResultsView";
import { LanguageSelector } from "@/components/feature/LanguageSelector";
import { ProfileMenu } from "@/components/feature/ProfileMenu";
import { StudyModeModal, StudyModeTrigger } from "@/components/feature/StudyModeModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/Textarea";
import { readFileAsText } from "@/lib/utils";
import type {
  AssignmentResult,
  ClarificationPrompt,
  ExplanationResult,
  FeatureItem,
  LanguageMode,
  StudyMode,
  SummaryResult,
  RevisionResult,
} from "@/types";

const featureItems: Array<FeatureItem & { icon: "line" | "explain" | "assignment" }> = [
  {
    title: "Summarize Complexities",
    description: "Turn dense 50-page PDFs into precise, actionable 5-minute summaries.",
    icon: "line",
  },
  {
    title: "Explain Mechanisms",
    description: "Break down complex theories using first-principles thinking and analogies.",
    icon: "explain",
  },
  {
    title: "Build Assignments",
    description: "Generate mock exams and research outlines from your primary sources.",
    icon: "assignment",
  },
];

const heroTitleByMode: Record<StudyMode, string> = {
  summary: "research",
  explain: "concepts",
  assignment: "syllabus",
  revision: "notes",
};

export default function DashboardPage() {
  const [mode, setMode] = useState<StudyMode>("summary");
  const [language, setLanguage] = useState<LanguageMode>("english");
  const [sourceText, setSourceText] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  /* Combined results for the editorial view */
  const [summaryData, setSummaryData] = useState<SummaryResult | null>(null);
  const [explainData, setExplainData] = useState<ExplanationResult | null>(null);
  const [assignmentData, setAssignmentData] = useState<AssignmentResult | null>(null);
  const [revisionData, setRevisionData] = useState<RevisionResult | null>(null);
  const [clarification, setClarification] = useState<ClarificationPrompt | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);
  const [generatingMode, setGeneratingMode] = useState<StudyMode | null>(null);
  const responseCacheRef = useRef(new Map<string, unknown>());

  // Initialize lang from localstorage
  useEffect(() => {
    const saved = window.localStorage.getItem("saar_language_preference") as LanguageMode;
    if (saved === "english" || saved === "hinglish") {
      setLanguage(saved);
    }
  }, []);

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const lowerName = file.name.toLowerCase();
    const allowedExtensions = [".txt", ".md", ".json"];

    if (!allowedExtensions.some((extension) => lowerName.endsWith(extension))) {
      setError("Basic upload currently supports .txt, .md, and .json files. Paste PDF text directly for now.");
      return;
    }

    try {
      const text = await readFileAsText(file);
      setSourceText(text);
      setFileName(file.name);
      setError("");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to read the uploaded file.");
    }
  }

  async function callStudyApi(studyMode: StudyMode, text: string, lang: LanguageMode) {
    const response = await fetch("/api/study", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceText: text, mode: studyMode, language: lang }),
    });
    const payload = await response.json();
    if (!response.ok || "error" in payload) {
      throw new Error(payload.error || "Unable to process.");
    }
    return payload;
  }

  function getCacheKey(studyMode: StudyMode, text: string, lang: LanguageMode) {
    return `${studyMode}::${lang}::${text.trim().toLowerCase()}`;
  }

  function applyPayloadToState(targetMode: StudyMode, payload: any) {
    if ("clarification" in payload) {
      setClarification(payload.clarification);
      setError("");
      return;
    }

    if (targetMode === "summary") setSummaryData(payload.data);
    if (targetMode === "explain") setExplainData(payload.data);
    if (targetMode === "assignment") setAssignmentData(payload.data);
    if (targetMode === "revision") setRevisionData(payload.data);
    setClarification(null);
    setError("");
  }

  function clearResultsForMode(targetMode: StudyMode) {
    if (targetMode === "summary") setSummaryData(null);
    if (targetMode === "explain") setExplainData(null);
    if (targetMode === "assignment") setAssignmentData(null);
    if (targetMode === "revision") setRevisionData(null);
  }

  function handleGenerateForMode(
    targetMode: StudyMode,
    text: string,
    lang: LanguageMode,
    options?: { force?: boolean }
  ) {
    const cacheKey = getCacheKey(targetMode, text, lang);

    // Check cache
    if (!options?.force) {
      const cachedPayload = responseCacheRef.current.get(cacheKey);
      if (cachedPayload) {
        clearResultsForMode(targetMode);
        applyPayloadToState(targetMode, cachedPayload);
        return;
      }
    }

    setGeneratingMode(targetMode);
    startTransition(async () => {
      try {
        clearResultsForMode(targetMode);
        const payload = await callStudyApi(targetMode, text, lang);
        responseCacheRef.current.set(cacheKey, payload);
        applyPayloadToState(targetMode, payload);
      } catch (requestError) {
        setClarification(null);
        setError(requestError instanceof Error ? requestError.message : "Something went wrong.");
      } finally {
        setGeneratingMode(null);
      }
    });
  }

  function buildClarifiedInput(originalText: string, option: string) {
    const trimmedOriginal = originalText.trim();
    const trimmedOption = option.trim();
    const wordCount = trimmedOriginal.split(/\s+/).filter(Boolean).length;

    if (wordCount <= 12) {
      return trimmedOption;
    }

    return `${trimmedOriginal}\n\nClarification: Focus on "${trimmedOption}".`;
  }

  function handleClarificationSelect(option: string) {
    const clarifiedText = buildClarifiedInput(sourceText, option);
    clearResultsForMode(mode);
    setSourceText(clarifiedText);
    setClarification(null);
    setError("");
    handleGenerateForMode(mode, clarifiedText, language, { force: true });
  }

  function handleLanguageChange(nextLanguage: LanguageMode) {
    if (nextLanguage === language) {
      return;
    }

    setLanguage(nextLanguage);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("saar_language_preference", nextLanguage);
    }

    if (showResults && sourceText.trim()) {
      clearResultsForMode(mode);
      setClarification(null);
      setError("");
      handleGenerateForMode(mode, sourceText, nextLanguage);
    }
  }

  function handleSubmit() {
    setError("");
    setClarification(null);

    if (sourceText.trim().length === 0) {
      setError("Please add some material or a topic so Saar AI can generate notes.");
      return;
    }

    setShowResults(true);
    handleGenerateForMode(mode, sourceText, language);
  }

  function handleModeChange(newMode: StudyMode) {
    setMode(newMode);
    if (showResults) {
      handleGenerateForMode(newMode, sourceText, language);
    }
  }

  function handleNewSession() {
    setShowResults(false);
    setSummaryData(null);
    setExplainData(null);
    setAssignmentData(null);
    setRevisionData(null);
    setClarification(null);
    setSourceText("");
    setFileName("");
    setError("");
  }

  /* ─── RESULTS VIEW ─── */
  if (showResults) {
    return (
      <PremiumResultsView
        sourceText={sourceText}
        summaryData={summaryData}
        explainData={explainData}
        assignmentData={assignmentData}
        revisionData={revisionData}
        activeMode={mode}
        isGenerating={generatingMode === mode}
        error={error}
        clarification={clarification}
        onClarificationSelect={handleClarificationSelect}
        onModeSelect={handleModeChange}
        onNewSession={handleNewSession}
      />
    );
  }

  /* ─── INPUT VIEW ─── */
  return (
    <main className="min-h-screen w-full bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.05),transparent_20%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] text-ink">
      <div className="px-8 pb-5 pt-3 lg:px-12">
        <header className="relative flex flex-col gap-4 border-b border-slate-200/80 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold tracking-tight text-primary">Saar AI</Link>
          </div>

          <div className="flex justify-center sm:absolute sm:left-1/2 sm:-translate-x-1/2">
            <Tabs value={mode} onChange={handleModeChange} />
          </div>

          <div className="flex items-center gap-3 justify-end">
            <LanguageSelector value={language} onChange={handleLanguageChange} />
            <StudyModeTrigger onClick={() => setIsModeModalOpen(true)} />
            <ProfileMenu onResetWorkspace={handleNewSession} />
          </div>
        </header>

        <StudyModeModal 
          isOpen={isModeModalOpen} 
          onClose={() => setIsModeModalOpen(false)} 
          value={mode} 
          onChange={handleModeChange} 
        />

        <section className="mx-auto max-w-[760px] px-2 pb-10 pt-10 sm:pt-12">
          <h1 className="text-[36px] font-semibold leading-[0.95] tracking-[-0.08em] text-slate-900 sm:text-[62px]">
            Transform your {heroTitleByMode[mode]}
            <br />
            <span className="text-primary">into clarity.</span>
          </h1>
          <p className="mt-5 max-w-[560px] text-[15px] leading-7 text-slate-500">
            Upload notes or type a topic to begin. Our AI architect constructs your academic path in seconds.
          </p>
        </section>

        <section className="mx-auto max-w-[920px]">
          <Card className="overflow-hidden rounded-xl border border-slate-100 bg-white p-0 shadow-[0_30px_80px_rgba(148,163,184,0.12)]">
            <div className="px-5 pb-0 pt-6 sm:px-7">
              <div className="flex items-center gap-3 text-[15px] text-slate-300">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>What are we exploring today? Paste text, a link, or just a topic...</span>
              </div>

              <Textarea
                value={sourceText}
                onChange={(event) => setSourceText(event.target.value)}
                className="mt-4 min-h-[180px] rounded-none border-0 px-0 py-0 text-[15px] text-slate-700 shadow-none focus:border-transparent focus:ring-0 sm:min-h-[210px]"
                placeholder=""
              />
            </div>

            <div className="flex flex-col gap-3 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50">
                  <FileUp className="h-3.5 w-3.5" />
                  <span>{fileName ? `Loaded: ${fileName}` : "Upload notes"}</span>
                  <input className="hidden" type="file" accept=".txt,.md,.json" onChange={handleFileUpload} />
                </label>
                <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500">
                  <Link2 className="h-3.5 w-3.5" />
                  <span>Paste URL</span>
                </div>
              </div>

              <Button onClick={handleSubmit} disabled={isPending} className="rounded-md px-5 py-2 text-xs shadow-md">
                {isPending ? "Generating..." : "Generate →"}
              </Button>
            </div>
          </Card>

          {error ? <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger">{error}</p> : null}

          {shouldSuggestHinglish(sourceText, language) ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-slate-700">
              <p>Looks like you&apos;re writing in Hinglish. Switch output to Hinglish?</p>
              <button
                type="button"
                onClick={() => handleLanguageChange("hinglish")}
                className="mt-3 rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
              >
                Switch to Hinglish
              </button>
            </div>
          ) : null}

          {/* Loading state */}
          {isPending && (
            <div className="mt-10 flex flex-col items-center gap-4 py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <p className="text-[15px] font-medium text-slate-500">
                Saar AI is analyzing your material across all dimensions...
              </p>
              <p className="text-[13px] text-slate-400">
                Generating summary, explanation, and assessments
              </p>
            </div>
          )}

          {!isPending && (
            <div className="mt-10 grid gap-4 md:grid-cols-[1fr_1fr_1fr_108px]">
              {featureItems.map((item) => (
                <Card key={item.title} className="min-h-[132px] rounded-none border-0 bg-[#f2f6fb] p-5 shadow-none">
                  <div className="space-y-4">
                    {item.icon === "line" ? <div className="h-1.5 w-4 rounded-full bg-primary" /> : null}
                    {item.icon === "explain" ? <GraduationCap className="h-4 w-4 text-primary" /> : null}
                    {item.icon === "assignment" ? <FileText className="h-4 w-4 text-primary" /> : null}
                    <div className="space-y-2">
                      <h2 className="text-lg font-semibold tracking-[-0.04em] text-slate-800">{item.title}</h2>
                      <p className="max-w-[230px] text-sm leading-6 text-slate-500">{item.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
              <div className="hidden rounded-md bg-[linear-gradient(145deg,#949494,#7c7c7c)] opacity-70 md:block" />
            </div>
          )}
        </section>

        <section className="mx-auto max-w-[920px] pb-16 pt-10" />

        <footer className="flex flex-col gap-4 border-t border-slate-200/80 pt-5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-300 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2024 Saar AI editorial. Soft-minimal system.</p>
          <div className="flex gap-6">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Methodology</span>
          </div>
        </footer>
      </div>
    </main>
  );
}

function shouldSuggestHinglish(sourceText: string, language: LanguageMode) {
  if (language !== "english") {
    return false;
  }

  const trimmed = sourceText.trim().toLowerCase();
  if (!trimmed) {
    return false;
  }

  return /\b(kya|kaise|kyun|ka|ki|ke|hai|hota|hoti|hote|aur|matlab|samjhao|batao|karna|hona)\b/.test(trimmed);
}
