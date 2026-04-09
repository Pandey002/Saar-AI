"use client";

import { useEffect, useRef, useState, useTransition, type KeyboardEvent, type ChangeEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileText, FileUp, Link2, Sparkles, GraduationCap, History, Mic, Square } from "lucide-react";
import { DueCardsBanner } from "@/components/feature/flashcards/DueCardsBanner";
import { PremiumResultsView } from "@/components/feature/PremiumResultsView";
import { LanguageSelector } from "@/components/feature/LanguageSelector";
import { ProfileMenu } from "@/components/feature/ProfileMenu";
import { StudyModeModal, StudyModeTrigger } from "@/components/feature/StudyModeModal";
import { Card } from "@/components/ui/Card";
import { SparkleButton } from "@/components/ui/SparkleButton";
import { Tabs } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/Textarea";
import { readFileAsText } from "@/lib/utils";
import type {
  AssignmentResult,
  ClarificationPrompt,
  ExplanationResult,
  FeatureItem,
  FlashcardCard,
  FlashcardDeck,
  LanguageMode,
  RevisionResult,
  SolveResult,
  StudyMode,
  SummaryResult,
  WorkspaceHistoryItem,
  WorkspaceLibraryItem,
} from "@/types";

const featureItems: Array<FeatureItem & { icon: "line" | "explain" | "assignment" | "solve" }> = [
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
  {
    title: "Solve Problems",
    description: "Walk through quantitative problems step by step without skipping the intermediate logic.",
    icon: "solve",
  },
];

const heroTitleByMode: Record<StudyMode, string> = {
  summary: "research",
  explain: "concepts",
  assignment: "syllabus",
  revision: "notes",
  solve: "problems",
};

type WorkspacePanel = "dashboard" | "history" | "library" | "flashcards" | "settings" | "support";

interface WorkspacePayload {
  historyItems: WorkspaceHistoryItem[];
  libraryItems: WorkspaceLibraryItem[];
}

interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly 0: {
    readonly transcript: string;
  };
}

interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number;
  readonly results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

export default function DashboardClient() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<StudyMode>("summary");
  const [language, setLanguage] = useState<LanguageMode>("english");
  const [showRealLifeExamples, setShowRealLifeExamples] = useState(true);
  const [sourceText, setSourceText] = useState("");
  const [fileName, setFileName] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isImportingUrl, setIsImportingUrl] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceDraft, setVoiceDraft] = useState("");

  const [summaryData, setSummaryData] = useState<SummaryResult | null>(null);
  const [explainData, setExplainData] = useState<ExplanationResult | null>(null);
  const [assignmentData, setAssignmentData] = useState<AssignmentResult | null>(null);
  const [revisionData, setRevisionData] = useState<RevisionResult | null>(null);
  const [solveData, setSolveData] = useState<SolveResult | null>(null);
  const [clarification, setClarification] = useState<ClarificationPrompt | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);
  const [generatingMode, setGeneratingMode] = useState<StudyMode | null>(null);
  const [showSolveExamples, setShowSolveExamples] = useState(false);
  const [historyItems, setHistoryItems] = useState<WorkspaceHistoryItem[]>([]);
  const [libraryItems, setLibraryItems] = useState<WorkspaceLibraryItem[]>([]);
  const [flashcardDecks, setFlashcardDecks] = useState<FlashcardDeck[]>([]);
  const [dueFlashcards, setDueFlashcards] = useState<FlashcardCard[]>([]);
  const [isReviewingFlashcards, setIsReviewingFlashcards] = useState(false);
  const [workspacePanel, setWorkspacePanel] = useState<WorkspacePanel>("dashboard");
  const responseCacheRef = useRef(new Map<string, unknown>());
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const dictatedPrefixRef = useRef("");

  useEffect(() => {
    const saved = window.localStorage.getItem("saar_language_preference") as LanguageMode;
    if (saved === "english" || saved === "hinglish") {
      setLanguage(saved);
    }

    const savedRealLifeExamples = window.localStorage.getItem("saar_show_real_life_examples");
    if (savedRealLifeExamples !== null) {
      setShowRealLifeExamples(savedRealLifeExamples !== "false");
    }

    void loadWorkspaceSnapshot();
    void loadFlashcardSnapshot();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsVoiceSupported(Boolean(Recognition));

    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "saar_show_real_life_examples",
      String(showRealLifeExamples)
    );
  }, [showRealLifeExamples]);

  useEffect(() => {
    const requestedPanel = searchParams.get("panel");
    if (
      requestedPanel === "history" ||
      requestedPanel === "library" ||
      requestedPanel === "flashcards" ||
      requestedPanel === "settings" ||
      requestedPanel === "support"
    ) {
      setWorkspacePanel(requestedPanel);
      setShowResults(true);
      return;
    }

    setWorkspacePanel("dashboard");
  }, [searchParams]);

  async function loadWorkspaceSnapshot() {
    try {
      const response = await fetch("/api/workspace", { cache: "no-store" });
      const payload = (await response.json()) as { data?: WorkspacePayload; error?: string };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error || "Unable to load workspace.");
      }

      setHistoryItems(payload.data.historyItems);
      setLibraryItems(payload.data.libraryItems);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load workspace.");
    }
  }

  async function loadFlashcardSnapshot() {
    try {
      const response = await fetch("/api/flashcards/decks", { cache: "no-store" });
      const payload = (await response.json()) as {
        data?: { decks: FlashcardDeck[]; dueCards: FlashcardCard[] };
        error?: string;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error || "Unable to load flashcards.");
      }

      setFlashcardDecks(payload.data.decks);
      setDueFlashcards(payload.data.dueCards);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load flashcards.");
    }
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const lowerName = file.name.toLowerCase();
    const allowedExtensions = [".txt", ".md", ".json", ".pdf"];

    if (!allowedExtensions.some((extension) => lowerName.endsWith(extension))) {
      setError("Uploads currently support .txt, .md, .json, and .pdf files.");
      return;
    }

    setError("");

    try {
      const text = lowerName.endsWith(".pdf")
        ? await extractTextFromFile(file)
        : await readFileAsText(file);

      setSourceText(text);
      setFileName(file.name);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to read the uploaded file.");
    } finally {
      event.target.value = "";
    }
  }

  async function handleImportUrl() {
    const trimmedUrl = urlInput.trim();
    if (!trimmedUrl) {
      setError("Please enter a URL to import.");
      return;
    }

    setIsImportingUrl(true);
    setError("");

    try {
      const response = await fetch("/api/extract-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl }),
      });
      const payload = (await response.json()) as {
        data?: { text: string; title?: string };
        error?: string;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error || "Unable to import the URL.");
      }

      setSourceText(payload.data.text);
      setFileName(payload.data.title ? `Imported from ${payload.data.title}` : "Imported URL");
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Unable to import the URL.");
    } finally {
      setIsImportingUrl(false);
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

  function applyPayloadToState(targetMode: StudyMode, payload: any, text: string, lang: LanguageMode) {
    if ("clarification" in payload) {
      setClarification(payload.clarification);
      setError("");
      return;
    }

    if (targetMode === "summary") setSummaryData(payload.data);
    if (targetMode === "explain") setExplainData(payload.data);
    if (targetMode === "assignment") setAssignmentData(payload.data);
    if (targetMode === "revision") setRevisionData(payload.data);
    if (targetMode === "solve") setSolveData(payload.data);
    setClarification(null);
    setError("");
    void persistWorkspaceEntry(targetMode, payload.data, text, lang);
  }

  async function persistWorkspaceEntry(
    targetMode: StudyMode,
    data: Record<string, unknown> & { title?: string; introduction?: string },
    text: string,
    lang: LanguageMode
  ) {
    try {
      const response = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          introduction: data.introduction,
          sourceText: text,
          language: lang,
          mode: targetMode,
          resultData: data,
        }),
      });
      const payload = (await response.json()) as { data?: WorkspacePayload };

      if (response.ok && payload.data) {
        setHistoryItems(payload.data.historyItems);
        setLibraryItems(payload.data.libraryItems);
      }
    } catch {
      // Keep generation working even if persistence fails.
    }
  }

  function clearResultsForMode(targetMode: StudyMode) {
    if (targetMode === "summary") setSummaryData(null);
    if (targetMode === "explain") setExplainData(null);
    if (targetMode === "assignment") setAssignmentData(null);
    if (targetMode === "revision") setRevisionData(null);
    if (targetMode === "solve") setSolveData(null);
  }

  function handleGenerateForMode(
    targetMode: StudyMode,
    text: string,
    lang: LanguageMode,
    options?: { force?: boolean }
  ) {
    const cacheKey = getCacheKey(targetMode, text, lang);

    if (!options?.force) {
      const cachedPayload = responseCacheRef.current.get(cacheKey);
      if (cachedPayload) {
        clearResultsForMode(targetMode);
        applyPayloadToState(targetMode, cachedPayload, text, lang);
        return;
      }
    }

    setGeneratingMode(targetMode);
    startTransition(async () => {
      try {
        clearResultsForMode(targetMode);
        const payload = await callStudyApi(targetMode, text, lang);
        responseCacheRef.current.set(cacheKey, payload);
        applyPayloadToState(targetMode, payload, text, lang);
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
    setWorkspacePanel("dashboard");
    handleGenerateForMode(mode, clarifiedText, language, { force: true });
  }

  function handleStudyGapTopics(topic: string) {
    const explainTopic = topic.trim();
    if (!explainTopic) {
      return;
    }

    setMode("explain");
    setSourceText(explainTopic);
    setClarification(null);
    setError("");
    setShowResults(true);
    setWorkspacePanel("dashboard");
    handleGenerateForMode("explain", explainTopic, language, { force: true });
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
    setWorkspacePanel("dashboard");
    handleGenerateForMode(mode, sourceText, language);
  }

  function handleSourceTextareaKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();

    if (isPending) {
      return;
    }

    handleSubmit();
  }

  function handleModeChange(newMode: StudyMode) {
    setMode(newMode);
    setWorkspacePanel("dashboard");
    if (showResults) {
      handleGenerateForMode(newMode, sourceText, language);
    }
  }

  function handleNewSession() {
    recognitionRef.current?.stop();
    setIsListening(false);
    setVoiceDraft("");
    setIsReviewingFlashcards(false);
    setShowResults(false);
    setWorkspacePanel("dashboard");
    setSummaryData(null);
    setExplainData(null);
    setAssignmentData(null);
    setRevisionData(null);
    setSolveData(null);
    setClarification(null);
    setSourceText("");
    setFileName("");
    setUrlInput("");
    setError("");
  }

  function getVoiceLanguage(currentLanguage: LanguageMode) {
    return currentLanguage === "hinglish" ? "hi-IN" : "en-IN";
  }

  function mergeDictation(prefix: string, dictatedText: string) {
    const cleanedDictation = dictatedText.trim();

    if (!cleanedDictation) {
      return prefix;
    }

    const trimmedPrefix = prefix.replace(/\s+$/, "");
    if (!trimmedPrefix) {
      return cleanedDictation;
    }

    return `${trimmedPrefix}\n${cleanedDictation}`;
  }

  function stopVoiceInput() {
    recognitionRef.current?.stop();
    setIsListening(false);
    setVoiceDraft("");
  }

  function handleVoiceInput() {
    if (typeof window === "undefined") {
      return;
    }

    if (isListening) {
      stopVoiceInput();
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setError("Voice input is not supported in this browser.");
      return;
    }

    recognitionRef.current?.stop();

    const recognition = new Recognition();
    dictatedPrefixRef.current = sourceText.trim();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = getVoiceLanguage(language);

    recognition.onresult = (event) => {
      let transcript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const chunk = result[0]?.transcript?.trim();

        if (!chunk) {
          continue;
        }

        transcript = `${transcript} ${chunk}`.trim();
      }

      setVoiceDraft(transcript);
      setSourceText(mergeDictation(dictatedPrefixRef.current, transcript));
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setVoiceDraft("");

      if (event.error === "not-allowed") {
        setError("Microphone access was blocked. Please allow microphone permission and try again.");
        return;
      }

      if (event.error === "no-speech") {
        setError("I couldn't hear anything. Try speaking a little closer to the microphone.");
        return;
      }

      setError("Voice input stopped unexpectedly. Please try again.");
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
      setVoiceDraft("");
    };

    recognitionRef.current = recognition;
    setError("");
    setIsListening(true);
    recognition.start();
  }

  function handleOpenWorkspaceItem(
    item: WorkspaceHistoryItem | WorkspaceLibraryItem,
    preferredMode?: StudyMode
  ) {
    const targetMode = preferredMode ?? ("mode" in item ? item.mode : item.lastMode);
    setSourceText(item.sourceText);
    setLanguage(item.language);
    setMode(targetMode);
    setShowResults(true);
    setWorkspacePanel("dashboard");
    setError("");
    setClarification(null);

    if (typeof window !== "undefined") {
      window.localStorage.setItem("saar_language_preference", item.language);
    }

    handleGenerateForMode(targetMode, item.sourceText, item.language);
  }

  async function handleClearHistory() {
    await clearWorkspaceCollection("history");
  }

  async function handleClearLibrary() {
    await clearWorkspaceCollection("library");
  }

  async function clearWorkspaceCollection(collection: "history" | "library") {
    try {
      const response = await fetch(`/api/workspace?collection=${collection}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { data?: WorkspacePayload; error?: string };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error || `Unable to clear ${collection}.`);
      }

      setHistoryItems(payload.data.historyItems);
      setLibraryItems(payload.data.libraryItems);
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : `Unable to clear ${collection}.`);
    }
  }

  function handleOpenFlashcardsPanel() {
    setShowResults(true);
    setWorkspacePanel("flashcards");
    setIsReviewingFlashcards(false);
  }

  function handleStartFlashcardReview() {
    setShowResults(true);
    setWorkspacePanel("flashcards");
    setIsReviewingFlashcards(true);
  }

  async function handleRateFlashcard(cardId: string, rating: 1 | 2 | 4 | 5, timeTakenMs: number) {
    const response = await fetch("/api/flashcards/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, rating, timeTakenMs }),
    });
    const payload = (await response.json()) as {
      data?: { dueCards: FlashcardCard[] };
      error?: string;
    };

    if (!response.ok || !payload.data) {
      throw new Error(payload.error || "Unable to save review result.");
    }

    setDueFlashcards(payload.data.dueCards);
    await loadFlashcardSnapshot();
  }

  async function handleSaveFlashcardDeck(deckId: string, cards: FlashcardCard[]) {
    const currentDeck = flashcardDecks.find((deck) => deck.id === deckId);
    const response = await fetch(`/api/flashcards/decks/${deckId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: currentDeck?.title,
        subject: currentDeck?.subject,
        cards,
      }),
    });
    const payload = (await response.json()) as {
      data?: { decks: FlashcardDeck[]; dueCards: FlashcardCard[] };
      error?: string;
    };

    if (!response.ok || !payload.data) {
      throw new Error(payload.error || "Unable to save flashcard deck.");
    }

    setFlashcardDecks(payload.data.decks);
    setDueFlashcards(payload.data.dueCards);
  }

  if (showResults) {
    return (
      <PremiumResultsView
        sourceText={sourceText}
        language={language}
        summaryData={summaryData}
        explainData={explainData}
        assignmentData={assignmentData}
        revisionData={revisionData}
        solveData={solveData}
        activeMode={mode}
        isGenerating={generatingMode === mode}
        error={error}
        clarification={clarification}
        onClarificationSelect={handleClarificationSelect}
        onStudyGapTopics={handleStudyGapTopics}
        onModeSelect={handleModeChange}
        onNewSession={handleNewSession}
        workspacePanel={workspacePanel}
        onWorkspacePanelChange={setWorkspacePanel}
        historyItems={historyItems}
        libraryItems={libraryItems}
        flashcardDecks={flashcardDecks}
        dueFlashcards={dueFlashcards}
        isReviewingFlashcards={isReviewingFlashcards}
        onOpenHistoryItem={(item) => handleOpenWorkspaceItem(item)}
        onOpenLibraryItem={(item) => handleOpenWorkspaceItem(item, item.lastMode)}
        onClearHistory={handleClearHistory}
        onClearLibrary={handleClearLibrary}
        onStartFlashcardReview={handleStartFlashcardReview}
        onStopFlashcardReview={() => setIsReviewingFlashcards(false)}
        onRateFlashcard={handleRateFlashcard}
        onSaveFlashcardDeck={handleSaveFlashcardDeck}
        onFlashcardsRefresh={loadFlashcardSnapshot}
        onLanguageChange={handleLanguageChange}
        showRealLifeExamples={showRealLifeExamples}
        onShowRealLifeExamplesChange={setShowRealLifeExamples}
      />
    );
  }

  return (
    <main className="min-h-screen w-full bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.05),transparent_20%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] text-ink">
      <div className="px-8 pb-5 pt-3 lg:px-12">
        <header className="relative flex flex-col gap-4 border-b border-slate-200/80 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center">
            <Link href="/" className="brand-link text-xl font-bold tracking-tight text-primary">
              Saar AI
            </Link>
          </div>

          <div className="flex justify-center sm:absolute sm:left-1/2 sm:-translate-x-1/2">
            <Tabs value={mode} onChange={handleModeChange} />
          </div>

          <div className="flex items-center justify-end gap-3">
            <Link
              href="/dashboard?panel=history"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              <History className="h-4 w-4" />
              History
            </Link>
            <button
              type="button"
              onClick={handleOpenFlashcardsPanel}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              <Sparkles className="h-4 w-4" />
              Flashcards
            </button>
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
            Upload notes, import a PDF, or paste a live URL to begin. Saar AI converts the source into a structured learning workflow.
          </p>
          <DueCardsBanner dueCount={dueFlashcards.length} onStartReview={handleStartFlashcardReview} />
        </section>

        <section className="mx-auto max-w-[920px]">
          <Card className="overflow-hidden rounded-xl border border-slate-100 bg-white p-0 shadow-[0_30px_80px_rgba(148,163,184,0.12)]">
            <div className="px-5 pb-0 pt-6 sm:px-7">
              <div className="flex items-center gap-3 text-[15px] text-slate-300">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>What are we exploring today? Paste text, a live URL, or upload a document...</span>
              </div>

              <div className="mt-4">
                <Textarea
                  value={sourceText}
                  onChange={(event) => setSourceText(event.target.value)}
                  onKeyDown={handleSourceTextareaKeyDown}
                  className="min-h-[180px] rounded-none border-0 px-0 py-0 text-[15px] text-slate-700 shadow-none focus:border-transparent focus:ring-0 sm:min-h-[210px]"
                  placeholder=""
                />

                <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      disabled={!isVoiceSupported}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        isListening
                          ? "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {isListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      {isListening ? "Stop dictation" : "Voice to text"}
                    </button>
                    <p className="text-xs leading-5 text-slate-500">
                      {isListening
                        ? "Listening now. Speak naturally and tap again when you're done."
                        : isVoiceSupported
                          ? "Dictate your topic, doubt, or notes and Saar AI will paste it here."
                          : "Voice input is available in supported browsers with microphone access."}
                    </p>
                  </div>

                  {isListening && voiceDraft ? (
                    <div className="max-w-[360px] rounded-2xl border border-rose-100 bg-rose-50/70 px-4 py-3 text-sm text-slate-700">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-rose-600">
                        Live transcript
                      </p>
                      <p className="mt-1 leading-6">{voiceDraft}</p>
                    </div>
                  ) : null}
                </div>
              </div>

              {mode === "solve" ? (
                <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-4">
                  <p className="text-sm leading-6 text-slate-700">
                    Paste your exact question, doubt, or problem. Works for any subject - maths,
                    history, chemistry, biology, literature.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowSolveExamples((current) => !current)}
                    className="mt-3 text-sm font-semibold text-primary transition hover:text-blue-700"
                  >
                    {showSolveExamples ? "Hide examples" : "What can I paste here?"}
                  </button>

                  {showSolveExamples ? (
                    <div className="mt-4 grid gap-3 rounded-2xl bg-white p-4 text-sm text-slate-700 sm:grid-cols-2">
                      <p><strong>Math:</strong> Solve: 2x² + 5x - 3 = 0</p>
                      <p><strong>Physics:</strong> A ball is thrown at 20m/s at 45°. Find max height.</p>
                      <p><strong>History:</strong> What were the main causes of the First World War?</p>
                      <p><strong>Biology:</strong> Explain the process of DNA replication.</p>
                      <p><strong>Chemistry:</strong> Balance: Fe + HCl → FeCl₂ + H₂</p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-7">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50">
                    <FileUp className="h-3.5 w-3.5" />
                    <span>{fileName ? `Loaded: ${fileName}` : "Upload txt, md, json, or PDF"}</span>
                    <input className="hidden" type="file" accept=".txt,.md,.json,.pdf,application/pdf" onChange={handleFileUpload} />
                  </label>
                  <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500">
                    <Link2 className="h-3.5 w-3.5 shrink-0" />
                    <input
                      value={urlInput}
                      onChange={(event) => setUrlInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void handleImportUrl();
                        }
                      }}
                      placeholder="Paste article or notes URL"
                      className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => void handleImportUrl()}
                      disabled={isImportingUrl}
                      className="rounded-md bg-slate-900 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isImportingUrl ? "Importing" : "Import URL"}
                    </button>
                  </div>
                </div>

                <SparkleButton
                  onClick={handleSubmit}
                  disabled={isPending}
                  label={isPending ? "Generating..." : "Generate ->"}
                  className="text-xs"
                />
              </div>
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

          {isPending && (
            <div className="mt-10 flex flex-col items-center gap-4 py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <p className="text-[15px] font-medium text-slate-500">
                Saar AI is analyzing your material across all dimensions...
              </p>
              <p className="text-[13px] text-slate-400">
                Generating structured study output for the selected mode
              </p>
            </div>
          )}

          {!isPending && (
            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_108px]">
              {featureItems.map((item) => (
                <Card key={item.title} className="min-h-[132px] rounded-none border-0 bg-[#f2f6fb] p-5 shadow-none">
                  <div className="space-y-4">
                    {item.icon === "line" ? <div className="h-1.5 w-4 rounded-full bg-primary" /> : null}
                    {item.icon === "explain" ? <GraduationCap className="h-4 w-4 text-primary" /> : null}
                    {item.icon === "assignment" ? <FileText className="h-4 w-4 text-primary" /> : null}
                    {item.icon === "solve" ? <Sparkles className="h-4 w-4 text-primary" /> : null}
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
          <p>&copy; 2026 Saar AI editorial. Soft-minimal system.</p>
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

async function extractTextFromFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/extract-file", {
    method: "POST",
    body: formData,
  });
  const payload = (await response.json()) as { data?: { text: string }; error?: string };

  if (!response.ok || !payload.data) {
    throw new Error(payload.error || "Unable to parse the uploaded file.");
  }

  return payload.data.text;
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
