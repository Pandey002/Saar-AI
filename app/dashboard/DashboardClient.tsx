"use client";

import { useEffect, useRef, useState, useTransition, type ClipboardEvent, type DragEvent, type KeyboardEvent, type ChangeEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Camera, FileText, FileUp, ImageIcon, ScanText, Sparkles, GraduationCap, Mic, Square, Clock3, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { DueCardsBanner } from "@/components/feature/flashcards/DueCardsBanner";
import { FeatureDropdowns } from "@/components/feature/navigation/FeatureDropdowns";
import { PremiumResultsView } from "@/components/feature/PremiumResultsView";
import { LanguageSelector } from "@/components/feature/LanguageSelector";
import { ProfileMenu } from "@/components/feature/ProfileMenu";
import { GuestBanner } from "@/components/feature/navigation/GuestBanner";
import { Card } from "@/components/ui/Card";
import { SparkleButton } from "@/components/ui/SparkleButton";
import { Textarea } from "@/components/ui/Textarea";
import { Tooltip } from "@/components/ui/Tooltip";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { withClientSessionHeaders, getClientSessionId } from "@/lib/clientSession";
import { flashcardStore, getAppStateValue, getStorageEstimate, pendingReviewStore, sessionStore, setAppStateValue, type FlashcardRecord, performanceStore } from "@/lib/localDB";
import { calculateNextReview, isDueToday } from "@/lib/sm2";
import { createClient } from "@/lib/supabase/client";
import { syncOfflineData } from "@/lib/syncEngine";
import { getPerformanceInsights, recordPerformanceLogs } from "@/lib/performance/store";
import { readFileAsText } from "@/lib/utils";
import type {
  AssignmentResult,
  ClarificationPrompt,
  ConceptDependencyGraphResult,
  ExplanationResult,
  FeatureItem,
  FlashcardCard,
  FlashcardDeck,
  LanguageMode,
  MockTestResult,
  PerformanceInsightSnapshot,
  PerformanceTopicInsight,
  WeakAreaRevisionPack,
  RevisionResult,
  SolveResult,
  StudyMode,
  StudyRequestMode,
  SummaryResult,
  WorkspaceHistoryItem,
  WorkspaceLibraryItem,
  UserTier,
} from "@/types";
import { getUserTier, getPersistentTier, canAccessMode, canAccessTool, TIER_PERMISSIONS } from "@/lib/tiers";
import { PricingModal } from "@/components/feature/PricingModal";


const featureItems: Array<FeatureItem & { icon: "line" | "explain" | "assignment" | "mocktest" | "solve" }> = [
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
    title: "Practice Smarter",
    description: "Generate untimed practice questions with guided answer checking and feedback.",
    icon: "assignment",
  },
  {
    title: "Take Mock Tests",
    description: "Simulate real exam pressure with timed MCQs, analytics, and AI feedback.",
    icon: "mocktest",
  },
];

const heroTitleByMode: Record<StudyMode, string> = {
  summary: "research",
  explain: "concepts",
  assignment: "syllabus",
  revision: "notes",
  mocktest: "exam prep",
  solve: "problems",
};

type WorkspacePanel = "dashboard" | "history" | "library" | "flashcards" | "studyPlan" | "settings" | "support" | "tutor" | "profile";

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
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  }

  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

export default function DashboardClient() {
  const searchParams = useSearchParams();
  const { isOnline } = useOnlineStatus();
  const [mode, setMode] = useState<StudyMode>("summary");
  const [language, setLanguage] = useState<LanguageMode>("english");
  const [showRealLifeExamples, setShowRealLifeExamples] = useState(true);
  const [sourceText, setSourceText] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceDraft, setVoiceDraft] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const [isExtractingNotes, setIsExtractingNotes] = useState(false);
  const [notesProcessingPhase, setNotesProcessingPhase] = useState<"idle" | "uploading" | "extracting" | "analyzing" | "structuring">("idle");
  const [extractedFileContent, setExtractedFileContent] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [tier, setTier] = useState<UserTier>("free");
  const [isGuest, setIsGuest] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [summaryData, setSummaryData] = useState<SummaryResult | null>(null);
  const [explainData, setExplainData] = useState<ExplanationResult | null>(null);
  const [assignmentData, setAssignmentData] = useState<AssignmentResult | null>(null);
  const [mockTestData, setMockTestData] = useState<MockTestResult | null>(null);
  const [revisionData, setRevisionData] = useState<RevisionResult | null>(null);
  const [solveData, setSolveData] = useState<SolveResult | null>(null);
  const [clarification, setClarification] = useState<ClarificationPrompt | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [generatingMode, setGeneratingMode] = useState<StudyMode | null>(null);
  const [showSolveExamples, setShowSolveExamples] = useState(false);
  const [historyItems, setHistoryItems] = useState<WorkspaceHistoryItem[]>([]);
  const [libraryItems, setLibraryItems] = useState<WorkspaceLibraryItem[]>([]);
  const [flashcardDecks, setFlashcardDecks] = useState<FlashcardDeck[]>([]);
  const [dueFlashcards, setDueFlashcards] = useState<FlashcardCard[]>([]);
  const [isReviewingFlashcards, setIsReviewingFlashcards] = useState(false);
  const [workspacePanel, setWorkspacePanel] = useState<WorkspacePanel>("dashboard");
  const [storageStats, setStorageStats] = useState<{ usage: number; quota: number } | null>(null);
  const [performanceInsights, setPerformanceInsights] = useState<PerformanceInsightSnapshot | null>(null);
  const [isLoadingPerformanceInsights, setIsLoadingPerformanceInsights] = useState(false);
  const [weakAreaRevisionPack, setWeakAreaRevisionPack] = useState<WeakAreaRevisionPack | null>(null);
  const [isGeneratingWeakAreaRevision, setIsGeneratingWeakAreaRevision] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [activeStudyPath, setActiveStudyPath] = useState<{ steps: string[]; currentIndex: number } | null>(null);
  const [mockTestDifficulty, setMockTestDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [mockTestDuration, setMockTestDuration] = useState(60);
  const [mockTestMode, setMockTestMode] = useState<"standard" | "competitive">("standard");
  const [showMockTestConfig, setShowMockTestConfig] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const responseCacheRef = useRef(new Map<string, unknown>());
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const dictatedPrefixRef = useRef("");
  const sessionIdRef = useRef("");
  const notesPhaseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    sessionIdRef.current = getClientSessionId();

    const saved = window.localStorage.getItem("saar_language_preference") as LanguageMode;
    if (saved === "english" || saved === "hinglish") {
      setLanguage(saved);
    }

    const savedRealLifeExamples = window.localStorage.getItem("saar_show_real_life_examples");
    if (savedRealLifeExamples !== null) {
      setShowRealLifeExamples(savedRealLifeExamples !== "false");
    }

    void loadOfflineWorkspaceSnapshot();
    void loadOfflineFlashcardSnapshot();
    void loadOfflinePerformanceInsights();
    void refreshStorageStats();

    const checkAuthStatus = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      const userTier = getUserTier(user);
      setTier(userTier);
      setIsGuest(!user);

      if (user) {
        // Fetch persistent tier from DB
        const dbTier = await getPersistentTier(supabase, user.id);
        setTier(dbTier);
      }
      
      setIsAuthLoading(false);

      if (!user) {
        // Transient guest data logic:
        // Clear old guest data on each new session start to ensure it's not "permanent"
        const lastGuestSession = window.localStorage.getItem("saar_guest_session_active");
        if (!lastGuestSession) {
          await Promise.all([
            sessionStore.clear(),
            flashcardStore.clear(),
            performanceStore.clearLogs(""), // Clear all generic logs
          ]);
          window.localStorage.setItem("saar_guest_session_active", "true");
        }
      } else {
        window.localStorage.removeItem("saar_guest_session_active");
        void syncOfflineData(sessionIdRef.current).catch(() => undefined);
      }
    };

    void checkAuthStatus();

    const handleBeforeInstallPrompt = async (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);

      const dismissed = await getAppStateValue<boolean>("installPromptDismissed");
      if (dismissed) {
        return;
      }

      const sessions = await sessionStore.getAll();
      setShowInstallPrompt(sessions.length >= 3);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    const handlePerformanceUpdated = () => {
      void loadPerformanceInsights();
    };
    window.addEventListener("vidya-performance-updated", handlePerformanceUpdated);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("vidya-performance-updated", handlePerformanceUpdated);
    };
  }, []);

  useEffect(() => {
    if (!isOnline) {
      return;
    }

    void loadWorkspaceSnapshot();
    void loadFlashcardSnapshot();
    void loadPerformanceInsights();
    void refreshStorageStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

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
    return () => {
      if (notesPhaseTimeoutRef.current) {
        clearTimeout(notesPhaseTimeoutRef.current);
      }

      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  useEffect(() => {
    window.localStorage.setItem(
      "saar_show_real_life_examples",
      String(showRealLifeExamples)
    );
  }, [showRealLifeExamples]);

  useEffect(() => {
    void refreshInstallPromptState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installPromptEvent]);

  useEffect(() => {
    const requestedPanel = searchParams.get("panel");
    if (
      requestedPanel === "history" ||
      requestedPanel === "library" ||
      requestedPanel === "flashcards" ||
      requestedPanel === "studyPlan" ||
      requestedPanel === "tutor" ||
      requestedPanel === "settings" ||
      requestedPanel === "support"
    ) {
      setWorkspacePanel(requestedPanel);
      setShowResults(true);
      setShowAnalyzer(false);
      return;
    }

    setWorkspacePanel("dashboard");
  }, [searchParams]);

  async function loadWorkspaceSnapshot() {
    try {
      // First, always load from IndexedDB
      await loadOfflineWorkspaceSnapshot();

      if (isOnline) {
        const response = await fetch("/api/workspace", withClientSessionHeaders({ cache: "no-store" }));
        const payload = (await response.json()) as { data?: WorkspacePayload; error?: string };

        if (response.ok && payload.data) {
          // Mirror server data to local IndexedDB
          await mirrorWorkspaceSnapshotToIndexedDb(payload.data.historyItems);
          // Re-load everything from IndexedDB to ensure a unified state
          await loadOfflineWorkspaceSnapshot();
        }
      }
    } catch (loadError) {
      console.warn("Server workspace sync failed (local persisted):", loadError);
    }
  }

  async function loadFlashcardSnapshot(newDeck?: { deckId: string; title: string; subject: string; cards: FlashcardCard[]; createdAt: string }) {
    try {
      if (newDeck) {
        // Save newly generated deck to local IndexedDB immediately
        await Promise.all(
          newDeck.cards.map((card) =>
            flashcardStore.save({
              id: card.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              deckId: newDeck.deckId,
              sessionId: sessionIdRef.current,
              deckTitle: newDeck.title,
              deckSubject: newDeck.subject,
              deckCreatedAt: newDeck.createdAt,
              front: card.front,
              back: card.back,
              type: card.type,
              tags: card.tags,
              easeFactor: card.easeFactor || 2.5,
              intervalDays: card.intervalDays || 1,
              repetitions: card.repetitions || 0,
              nextReviewDate: card.nextReviewDate || new Date().toISOString().slice(0, 10),
              lastReviewDate: card.lastReviewDate || null,
              createdAt: card.createdAt || new Date().toISOString(),
              synced: false,
            })
          )
        );
      }

      // First, always load from IndexedDB to ensure UI responsiveness and offline support
      await loadOfflineFlashcardSnapshot();

      if (isOnline) {
        // Then, try to sync from the server if online (fails gracefully on EROFS)
        const response = await fetch("/api/flashcards/decks", withClientSessionHeaders({ cache: "no-store" }));
        const payload = (await response.json()) as {
          data?: { decks: FlashcardDeck[]; dueCards: FlashcardCard[] };
          error?: string;
        };

        if (response.ok && payload.data) {
          // Mirror server data to local IndexedDB
          await mirrorFlashcardsToIndexedDb(payload.data.decks);
          // Re-load everything from IndexedDB to ensure a unified state (Local + Synced)
          await loadOfflineFlashcardSnapshot();
        }
      }
    } catch (loadError) {
      console.warn("Server flashcard sync failed (local persisted):", loadError);
    }
  }

  async function loadOfflineWorkspaceSnapshot() {
    const records = await sessionStore.getAll();
    setHistoryItems(buildWorkspaceHistoryItems(records));
    setLibraryItems(buildWorkspaceLibraryItems(records));
  }

  async function loadOfflineFlashcardSnapshot() {
    const records = await flashcardStore.getAll();
    const decks = buildFlashcardDecks(records);
    setFlashcardDecks(decks);
    setDueFlashcards(decks.flatMap((deck) => deck.cards).filter(isDueToday).slice(0, 50));
  }

  async function loadOfflinePerformanceInsights() {
    const cachedInsights = await getAppStateValue<PerformanceInsightSnapshot>("performanceInsights");
    const cachedRevision = await getAppStateValue<WeakAreaRevisionPack>("weakAreaRevisionPack");
    setPerformanceInsights(cachedInsights);
    setWeakAreaRevisionPack(cachedRevision);
  }

  async function mirrorWorkspaceSnapshotToIndexedDb(items: WorkspaceHistoryItem[]) {
    await Promise.all(
      items.map((item) =>
        sessionStore.save({
          id: item.id,
          topic: item.title,
          mode: item.mode,
          language: item.language,
          sourceText: item.sourceText,
          output: item.resultData ?? null,
          subject: item.title,
          topicType: item.mode === "solve" && item.resultData && typeof item.resultData === "object" && "topicType" in item.resultData
            ? ((item.resultData as { topicType?: SolveResult["topicType"] }).topicType ?? "general")
            : "general",
          createdAt: item.createdAt,
          synced: true,
        })
      )
    );
    await refreshInstallPromptState();
  }

  async function mirrorFlashcardsToIndexedDb(decks: FlashcardDeck[]) {
    await Promise.all(
      decks.flatMap((deck) =>
        deck.cards.map((card) =>
          flashcardStore.save({
            ...flashcardToRecord(card, deck),
            synced: true,
          })
        )
      )
    );
    void refreshStorageStats();
  }

  async function loadPerformanceInsights() {
    setIsLoadingPerformanceInsights(true);

    try {
      const sessionId = await getClientSessionId();
      const snapshot = await getPerformanceInsights(sessionId);
      setPerformanceInsights(snapshot);
      await setAppStateValue("performanceInsights", snapshot);
    } catch (loadError) {
      const cached = await getAppStateValue<PerformanceInsightSnapshot>("performanceInsights");
      if (cached) {
        setPerformanceInsights(cached);
      } else if (!isOnline) {
        setError("You’re offline. Cached weak-area insights will appear when available.");
      }
      if (isOnline && !cached) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load performance insights.");
      }
    } finally {
      setIsLoadingPerformanceInsights(false);
    }
  }

  async function persistSessionLocally(
    targetMode: StudyMode,
    data: Record<string, unknown> & { title?: string; introduction?: string },
    text: string,
    lang: LanguageMode
  ) {
    const sessionId = window.crypto.randomUUID();
    await sessionStore.save({
      id: sessionId,
      topic: data.title?.trim() || text.trim().split("\n")[0]?.slice(0, 80) || "Study Session",
      mode: targetMode,
      language: lang,
      sourceText: text,
      output: data,
      subject: data.title?.trim() || "",
      topicType: targetMode === "solve" && typeof data.topicType === "string" ? (data.topicType as SolveResult["topicType"]) : "general",
      createdAt: new Date().toISOString(),
      synced: false,
    });
    await loadOfflineWorkspaceSnapshot();
    await refreshInstallPromptState();
    void refreshStorageStats();
    return sessionId;
  }

  async function refreshStorageStats() {
    const estimate = await getStorageEstimate();
    setStorageStats(estimate);
  }

  async function refreshInstallPromptState() {
    if (!installPromptEvent) {
      return;
    }

    const dismissed = await getAppStateValue<boolean>("installPromptDismissed");
    const sessions = await sessionStore.getAll();
    setShowInstallPrompt(Boolean(!dismissed && sessions.length >= 3));
  }

  function applyStoredResult(
    targetMode: StudyMode,
    resultData: unknown,
    text: string,
    lang: LanguageMode
  ) {
    if (!resultData) {
      if (isOnline) {
        handleGenerateForMode(targetMode, text, lang);
      }
      return;
    }

    clearResultsForMode(targetMode);
    setSourceText(text);
    setLanguage(lang);
    setMode(targetMode);
    responseCacheRef.current.set(getCacheKey(targetMode, text, lang), { data: resultData });
    if (targetMode === "summary") setSummaryData(resultData as SummaryResult);
    if (targetMode === "explain") setExplainData(resultData as ExplanationResult);
    if (targetMode === "assignment") setAssignmentData(resultData as AssignmentResult);
    if (targetMode === "mocktest") setMockTestData(resultData as MockTestResult);
    if (targetMode === "revision") setRevisionData(resultData as RevisionResult);
    if (targetMode === "solve") setSolveData(resultData as SolveResult);
    setClarification(null);
    setError("");
  }


  async function processUploadedFile(file: File) {
    if (!file) {
      return;
    }

    const lowerName = file.name.toLowerCase();
    const allowedExtensions = [".txt", ".md", ".json", ".pdf", ".png", ".jpg", ".jpeg"];
    const isImage = file.type.startsWith("image/") || [".png", ".jpg", ".jpeg"].some((extension) => lowerName.endsWith(extension));
    const requiresServerExtraction = isImage || lowerName.endsWith(".pdf");

    if (!allowedExtensions.some((extension) => lowerName.endsWith(extension))) {
      setError("Uploads currently support JPG, PNG, TXT, MD, JSON, and PDF files.");
      return;
    }

    setError("");
    setIsExtractingNotes(requiresServerExtraction);
    setNotesProcessingPhase(isImage ? "uploading" : requiresServerExtraction ? "extracting" : "idle");

    if (isImage) {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      setImagePreviewUrl(URL.createObjectURL(file));
    }

    if (notesPhaseTimeoutRef.current) {
      clearTimeout(notesPhaseTimeoutRef.current);
      notesPhaseTimeoutRef.current = null;
    }

    try {
      if (!isOnline && requiresServerExtraction) {
        throw new Error("Connect to the internet to scan notes or extract text from PDFs. Saved sessions still stay available offline.");
      }

      if (requiresServerExtraction) {
        if (isImage) {
          setNotesProcessingPhase("extracting");
          notesPhaseTimeoutRef.current = setTimeout(() => {
            setNotesProcessingPhase("structuring");
          }, 900);
        } else {
          setNotesProcessingPhase("analyzing");
        }
      }

      const extracted = requiresServerExtraction
        ? await extractTextFromFile(file)
        : { text: await readFileAsText(file), shouldAutoGenerate: false, sourceKind: "document" as const };

      if (notesPhaseTimeoutRef.current) {
        clearTimeout(notesPhaseTimeoutRef.current);
        notesPhaseTimeoutRef.current = null;
      }

      setExtractedFileContent(extracted.text);
      setFileName(file.name);

      if (extracted.sourceKind === "image") {
        setImagePreviewUrl(URL.createObjectURL(file));
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to read the uploaded file.");
    } finally {
      setIsExtractingNotes(false);
      setNotesProcessingPhase("idle");
      setIsDragActive(false);
    }
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    try {
      await processUploadedFile(file as File);
    } finally {
      event.target.value = "";
    }
  }

  function handleNotesPaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const imageItem = Array.from(event.clipboardData.items).find((item) => item.type.startsWith("image/"));

    if (!imageItem) {
      return;
    }

    const file = imageItem.getAsFile();
    if (!file) {
      return;
    }

    event.preventDefault();
    void processUploadedFile(new File([file], `notes-${Date.now()}.png`, { type: file.type || "image/png" }));
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }
    setIsDragActive(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }

    void processUploadedFile(file);
  }

  async function callStudyApi(
    studyMode: StudyRequestMode, 
    text: string, 
    lang: LanguageMode, 
    isSource: boolean = false
  ) {
    const response = await fetch("/api/study", withClientSessionHeaders({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        sourceText: text, 
        mode: studyMode, 
        language: lang, 
        isSource,
        difficulty: studyMode === "mocktest" ? mockTestDifficulty : undefined,
        testMode: studyMode === "mocktest" ? mockTestMode : undefined,
        durationMinutes: studyMode === "mocktest" ? mockTestDuration : undefined,
      }),
    }));
    const payload = await response.json();
    if (!response.ok || "error" in payload) {
      throw new Error(payload.error || "Unable to process.");
    }
    return payload;
  }

  function getCacheKey(studyMode: StudyRequestMode, text: string, lang: LanguageMode) {
    const base = `${studyMode}::${lang}::${text.trim().toLowerCase()}`;
    if (studyMode === "mocktest") {
      return `${base}::${mockTestDifficulty}::${mockTestMode}::${mockTestDuration}`;
    }
    return base;
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
    if (targetMode === "mocktest") setMockTestData(payload.data);
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
    const sessionId = await persistSessionLocally(targetMode, data, text, lang);

    try {
      const response = await fetch("/api/workspace", withClientSessionHeaders({
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
      }));
      const payload = (await response.json()) as { data?: WorkspacePayload };

      if (response.ok && payload.data) {
        setHistoryItems(payload.data.historyItems);
        setLibraryItems(payload.data.libraryItems);
        await sessionStore.markSynced([sessionId]);
        void mirrorWorkspaceSnapshotToIndexedDb(payload.data.historyItems);
      }
    } catch {
      // Keep generation working even if persistence fails.
    }
  }

  function clearResultsForMode(targetMode: StudyMode) {
    if (targetMode === "summary") setSummaryData(null);
    if (targetMode === "explain") setExplainData(null);
    if (targetMode === "assignment") setAssignmentData(null);
    if (targetMode === "mocktest") setMockTestData(null);
    if (targetMode === "revision") setRevisionData(null);
    if (targetMode === "solve") setSolveData(null);
  }

  function handleGenerateForMode(
    targetMode: StudyMode,
    text: string,
    lang: LanguageMode,
    options?: { force?: boolean }
  ) {
    // Permission check
    if (!canAccessMode(tier, targetMode)) {
      setShowPricing(true);
      return;
    }

    // Quota check for free tier (Open Access Pivot)
    if (tier === "free") {
      const today = new Date().toISOString().split("T")[0];
      const todayInputs = historyItems.filter(item => item.createdAt.startsWith(today)).length;
      
      if (todayInputs >= (TIER_PERMISSIONS.free.maxDailyInputs || 5)) {
        setError("Sorry... you've used your 5 free topics for today! Come back tomorrow to continue your journey to the top!");
        return;
      }
    }

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
        const isSource = !!fileName || !!imagePreviewUrl || text.trim().length > 250 || text.trim().split(/\n/).length > 2;
        const payload = await callStudyApi(targetMode, text, lang, isSource);
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

  const getEffectiveSourceText = (manualText: string) => {
    const trimmedManual = manualText.trim();
    if (extractedFileContent && trimmedManual) {
      return `${extractedFileContent}\n\n[Instruction/Context]: ${trimmedManual}`;
    }
    return extractedFileContent || trimmedManual;
  };

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
    setActiveStudyPath(null);
    setWorkspacePanel("dashboard");
    handleGenerateForMode(mode, clarifiedText, language, { force: true });
  }

  function openTopicInExplainMode(topic: string) {
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

  function handleStudyGapTopics(topic: string) {
    setActiveStudyPath(null);
    openTopicInExplainMode(topic);
  }

  async function handleRequestLearningGraph(topic: string) {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      throw new Error("Please choose a topic first.");
    }

    const cacheKey = getCacheKey("dependencies", trimmedTopic, language);
    const cachedPayload = responseCacheRef.current.get(cacheKey) as
      | { data?: ConceptDependencyGraphResult }
      | undefined;

    if (cachedPayload?.data) {
      return cachedPayload.data;
    }

    const payload = (await callStudyApi("dependencies", trimmedTopic, language)) as {
      data?: ConceptDependencyGraphResult;
      clarification?: ClarificationPrompt;
      error?: string;
    };

    if (payload.clarification) {
      throw new Error("Please make the topic a bit more specific so Vidya can map the learning path.");
    }

    if (!payload.data) {
      throw new Error(payload.error || "Unable to build the learning path.");
    }

    responseCacheRef.current.set(cacheKey, payload);
    return payload.data;
  }

  function handleStartLearningPath(steps: string[]) {
    const normalizedSteps = [...new Set(steps.map((step) => step.trim()).filter(Boolean))];
    if (normalizedSteps.length === 0) {
      return;
    }

    setActiveStudyPath({
      steps: normalizedSteps,
      currentIndex: 0,
    });
    openTopicInExplainMode(normalizedSteps[0]);
  }

  function handleAdvanceStudyPath() {
    if (!activeStudyPath) {
      return;
    }

    const nextIndex = activeStudyPath.currentIndex + 1;
    if (nextIndex >= activeStudyPath.steps.length) {
      setActiveStudyPath(null);
      return;
    }

    setActiveStudyPath({
      ...activeStudyPath,
      currentIndex: nextIndex,
    });
    openTopicInExplainMode(activeStudyPath.steps[nextIndex]);
  }

  function handleLanguageChange(nextLanguage: LanguageMode) {
    if (nextLanguage === language) {
      return;
    }

    if (nextLanguage === "hinglish" && !canAccessTool(tier, "canUseHinglish")) {
      setError("Hinglish is a Student tier feature. Please upgrade to continue.");
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
      if (isOnline) handleGenerateForMode(mode, sourceText, nextLanguage);
    }
  }

  function handleSubmit() {
    setError("");
    setClarification(null);
    setActiveStudyPath(null);
    if (!isOnline) {
      setError("Connect to the internet to generate new content. Your saved sessions and flashcards still work offline.");
      return;
    }
 
    const effectiveText = getEffectiveSourceText(sourceText);
    if (!effectiveText) {
      setError("Please add some material, a topic, or upload a document so Vidya can generate notes.");
      return;
    }


    if (mode === "mocktest" && !mockTestData) {
      setShowResults(true);
      setShowAnalyzer(false);
      setWorkspacePanel("dashboard");
      return;
    }

    setShowResults(true);
    setShowAnalyzer(false);
    setWorkspacePanel("dashboard");
    handleGenerateForMode(mode, getEffectiveSourceText(sourceText), language);
  }

  function handleStartMockTest() {
    setShowMockTestConfig(false);
    setShowResults(true);
    setShowAnalyzer(false);
    setWorkspacePanel("dashboard");
    handleGenerateForMode("mocktest", getEffectiveSourceText(sourceText), language, { force: true });
  }

  function handleAnalyze() {
    setError("");
    setClarification(null);
    setShowResults(false);
    setShowAnalyzer(true);
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
    if (!canAccessMode(tier, newMode)) {
      setError(`Mode restricted: ${newMode} is not available in the ${tier} plan.`);
      return;
    }

    setMode(newMode);
    setShowMockTestConfig(false);
    setWorkspacePanel("dashboard");
    if (newMode !== "explain") {
      setActiveStudyPath(null);
    }
    if (showResults && isOnline && newMode !== "mocktest") {
      handleGenerateForMode(newMode, getEffectiveSourceText(sourceText), language);
    }
  }

  function handleNewSession() {
    recognitionRef.current?.stop();
    setIsListening(false);
    setVoiceDraft("");
    setIsReviewingFlashcards(false);
    setShowResults(false);
    setShowAnalyzer(false);
    setWorkspacePanel("dashboard");
    setSummaryData(null);
    setExplainData(null);
    setAssignmentData(null);
    setMockTestData(null);
    setRevisionData(null);
    setSolveData(null);
    setClarification(null);
    setActiveStudyPath(null);
    setSourceText("");
    setFileName("");
    setExtractedFileContent("");
    setImagePreviewUrl("");
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

    applyStoredResult(targetMode, item.resultData, item.sourceText, item.language);
  }

  async function handleClearHistory() {
    await clearWorkspaceCollection("history");
  }

  async function handleClearLibrary() {
    await clearWorkspaceCollection("library");
  }

  async function clearWorkspaceCollection(collection: "history" | "library") {
    try {
      // Always clear locally first for immediate UI response and offline safety
      if (collection === "history") {
        await sessionStore.clear(); // We clear all since history is everything for now
      } else {
        // Library is a subset of history based on mode in this app
        await sessionStore.clear(); 
      }
      
      // Update local state immediately
      await loadOfflineWorkspaceSnapshot();

      // Then try to sync the deletion to the server
      const response = await fetch(`/api/workspace?collection=${collection}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        const payload = (await response.json()) as { data?: WorkspacePayload };
        if (payload.data) {
          setHistoryItems(payload.data.historyItems);
          setLibraryItems(payload.data.libraryItems);
          void mirrorWorkspaceSnapshotToIndexedDb(payload.data.historyItems);
        }
      }
    } catch (clearError) {
      console.warn(`Server ${collection} clearing failed (local purged):`, clearError);
    }
  }

  function handleOpenFeaturePanel(panel: "history" | "flashcards" | "tutor") {
    setShowResults(true);
    setWorkspacePanel(panel);
    if (panel !== "flashcards") {
      setIsReviewingFlashcards(false);
    }
  }

  async function handleTutorAsk(question: string) {
    if (!isOnline) {
      throw new Error("Connect to the internet to ask Adhyapak questions. Your saved notes and flashcards are still available offline.");
    }
    
    const topic =
      titleFromCurrentMode(mode, summaryData, explainData, assignmentData, mockTestData, solveData) ||
      sourceText.trim().split("\n")[0] ||
      sourceText.trim();
    const response = await fetch("/api/tutor", withClientSessionHeaders({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        sourceText,
        question,
        language,
      }),
    }));
    const payload = (await response.json()) as { data?: { reply?: string }; error?: string };

    if (!response.ok || !payload.data?.reply) {
      throw new Error(payload.error || "Unable to generate a tutor response right now.");
    }

    return payload.data.reply;
  }

  function handleStartFlashcardReview() {
    setShowResults(true);
    setWorkspacePanel("flashcards");
    setIsReviewingFlashcards(true);
  }

  async function handleRateFlashcard(cardId: string, rating: 1 | 2 | 4 | 5, timeTakenMs: number) {
    const currentCard = flashcardDecks.flatMap((deck) => deck.cards).find((card) => card.id === cardId);
    if (!currentCard) {
      throw new Error("Unable to find that flashcard.");
    }

    const updatedCard = calculateNextReview(currentCard, rating);

    setFlashcardDecks((previous) =>
      previous.map((deck) => ({
        ...deck,
        cards: deck.cards.map((card) => (card.id === cardId ? updatedCard : card)),
      }))
    );
    setDueFlashcards((previous) =>
      previous
        .map((card) => (card.id === cardId ? updatedCard : card))
        .filter(isDueToday)
    );

    await flashcardStore.save(flashcardToRecord(updatedCard, flashcardDecks.find((deck) => deck.id === updatedCard.deckId)));
    const reviewRecordId = window.crypto.randomUUID();
    let reviewSynced = false;

    if (isOnline) {
      try {
        const response = await fetch("/api/flashcards/review", withClientSessionHeaders({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardId,
            rating,
            timeTakenMs,
          }),
        }));

        if (response.ok) {
          reviewSynced = true;
          const payload = await response.json();
          if (payload.performanceLogs) {
            const sessionId = await getClientSessionId();
            await recordPerformanceLogs(sessionId, payload.performanceLogs);
          }
        } else {
          reviewSynced = false;
        }
      } catch {
        reviewSynced = false;
      }
    }

    await pendingReviewStore.save({
      id: reviewRecordId,
      cardId,
      sessionId: currentCard.sessionId || sessionIdRef.current,
      rating,
      timeTakenMs,
      reviewedAt: new Date().toISOString(),
      synced: reviewSynced,
    });

    if (reviewSynced) {
      await loadPerformanceInsights();
    }

    void refreshStorageStats();
  }

  async function handleGenerateWeakAreaRevision(area: PerformanceTopicInsight) {
    if (!isOnline) {
      setError("Connect to the internet to generate a targeted revision pack for this weak area.");
      return;
    }

    setIsGeneratingWeakAreaRevision(true);
    setError("");

    try {
      const response = await fetch(
        "/api/performance/revision",
        withClientSessionHeaders({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: area.topic,
            language,
            weakConcepts: area.weakConcepts,
            weakQuestionTypes: area.weakQuestionTypes,
            reason: area.reason,
          }),
        })
      );
      const payload = (await response.json()) as { data?: WeakAreaRevisionPack; error?: string };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error || "Unable to generate targeted revision.");
      }

      setWeakAreaRevisionPack(payload.data);
      await setAppStateValue("weakAreaRevisionPack", payload.data);
    } catch (revisionError) {
      setError(revisionError instanceof Error ? revisionError.message : "Unable to generate targeted revision.");
    } finally {
      setIsGeneratingWeakAreaRevision(false);
    }
  }

  async function handleSaveFlashcardDeck(deckId: string, cards: FlashcardCard[]) {
    if (!isOnline) {
      setError("Connect to the internet to save deck edits. You can still review saved cards offline.");
      return;
    }

    // Local save first
    const currentDeck = flashcardDecks.find((deck) => deck.id === deckId);
    if (currentDeck) {
      const updatedDecks = flashcardDecks.map(d => d.id === deckId ? { ...d, cards } : d);
      setFlashcardDecks(updatedDecks);
      void mirrorFlashcardsToIndexedDb(updatedDecks);
    }

    try {
      const response = await fetch(`/api/flashcards/decks/${deckId}`, withClientSessionHeaders({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: currentDeck?.title,
          subject: currentDeck?.subject,
          cards,
        }),
      }));
      const payload = (await response.json()) as {
        data?: { decks: FlashcardDeck[]; dueCards: FlashcardCard[] };
        error?: string;
      };

      if (response.ok && payload.data) {
        setFlashcardDecks(payload.data.decks);
        setDueFlashcards(payload.data.dueCards);
        void mirrorFlashcardsToIndexedDb(payload.data.decks);
      }
    } catch (err) {
      console.warn("Server deck save skipped (local persisted):", err);
    }
  }

  async function handleInstallApp() {
    if (!installPromptEvent) {
      return;
    }

    await installPromptEvent.prompt();
    const result = await installPromptEvent.userChoice;
    if (result.outcome !== "accepted") {
      await dismissInstallPrompt();
      return;
    }

    setShowInstallPrompt(false);
  }

  async function dismissInstallPrompt() {
    setShowInstallPrompt(false);
    await setAppStateValue("installPromptDismissed", true);
  }

  async function handleClearOldData() {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    await sessionStore.deleteSyncedOlderThan(cutoff);
    await loadOfflineWorkspaceSnapshot();
    await refreshStorageStats();
  }

  function handleSolveQuestion(question: any) {
    const questionText = typeof question.question === "string" ? question.question : question.question.text;
    setSourceText(questionText);
    setMode("solve");
    setWorkspacePanel("dashboard");
    setShowResults(true);
    handleGenerateForMode("solve", questionText, language, { force: true });
  }

  function handleAddQuestionToAssignment(question: any) {
    const questionText = typeof question.question === "string" ? question.question : question.question.text;
    const answerText = typeof question.answer === "string" ? question.answer : question.answer.text;

    const newQuestion = {
      question: questionText,
      answer: answerText,
      type: (question.type === "MCQ" ? "mcq" : "analytical") as "mcq" | "analytical",
      options: question.options || [],
      marks: question.difficulty === "hard" ? 5 : question.difficulty === "medium" ? 3 : 2,
    };

    setAssignmentData((prev) => {
      const updated = prev ? {
        ...prev,
        questions: [...prev.questions, newQuestion],
        sectionGroups: prev.sectionGroups.length > 0 
          ? prev.sectionGroups.map((g, i) => i === 0 ? {
              ...g,
              questions: [...g.questions, newQuestion],
              marks: g.marks + newQuestion.marks
            } : g)
          : [{
              heading: "Selected Questions",
              description: "Questions added from your study session.",
              marks: newQuestion.marks,
              questions: [newQuestion],
            }]
      } : {
        title: "Custom Practice Set",
        introduction: `Curated questions based on "${summaryData?.title || explainData?.title || "your study session"}".`,
        coreConcepts: [],
        instructions: "Solve the following questions to test your understanding.",
        sections: [],
        questions: [newQuestion],
        relatedTopics: [],
        instructionList: ["Read each question carefully.", "Submit your answers for AI evaluation."],
        sectionGroups: [
          {
            heading: "Selected Questions",
            description: "Questions added from your results.",
            marks: newQuestion.marks,
            questions: [newQuestion],
          },
        ],
        markingScheme: [
          { label: "Correct", value: "Full marks" },
          { label: "Partial", value: "Based on depth" },
        ],
      };

      // Trigger background persistence
      void persistWorkspaceEntry("assignment", updated, sourceText, language);
      return updated;
    });

    setActionMessage("Question added to your practice set!");
    setTimeout(() => setActionMessage(null), 5000);
  }


  const activeLoadingAction = generatingMode 
    ? `preparing your ${generatingMode} results` 
    : (isExtractingNotes ? "analyzing your notes structure" : null);

  if (showResults) {
    return (
      <>
        <LoadingOverlay isVisible={activeLoadingAction !== null} message={activeLoadingAction || ""} />
        <PremiumResultsView
        sourceText={sourceText}
        language={language}
        summaryData={summaryData}
        explainData={explainData}
        assignmentData={assignmentData}
        mockTestData={mockTestData}
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
        onAddQuestionToAssignment={handleAddQuestionToAssignment}
        onSolveQuestion={handleSolveQuestion}
        actionMessage={actionMessage}
        onClearActionMessage={() => setActionMessage(null)}
        performanceInsights={performanceInsights}
        isLoadingPerformanceInsights={isLoadingPerformanceInsights}
        weakAreaRevisionPack={weakAreaRevisionPack}
        isGeneratingWeakAreaRevision={isGeneratingWeakAreaRevision}
        onGenerateWeakAreaRevision={handleGenerateWeakAreaRevision}
        onRefreshPerformanceInsights={loadPerformanceInsights}
        onSaveFlashcardDeck={handleSaveFlashcardDeck}
        onFlashcardsRefresh={loadFlashcardSnapshot}
        onLanguageChange={handleLanguageChange}
        tier={tier}
        showRealLifeExamples={showRealLifeExamples}
        onShowRealLifeExamplesChange={setShowRealLifeExamples}
        storageStats={storageStats}
        onClearOldData={handleClearOldData}
        onRequestLearningGraph={handleRequestLearningGraph}
        onLoadLearningTopic={openTopicInExplainMode}
        onStartLearningPath={handleStartLearningPath}
        activeStudyPath={activeStudyPath}
        onAdvanceStudyPath={handleAdvanceStudyPath}
        onDismissStudyPath={() => setActiveStudyPath(null)}
        onTutorAsk={handleTutorAsk}
        mockTestDifficulty={mockTestDifficulty}
        setMockTestDifficulty={setMockTestDifficulty}
        mockTestDuration={mockTestDuration}
        setMockTestDuration={setMockTestDuration}
        mockTestMode={mockTestMode}
        setMockTestMode={setMockTestMode}
        onStartMockTest={handleStartMockTest}
        user={user}
      />
      <PricingModal 
        isOpen={showPricing} 
        onClose={() => setShowPricing(false)} 
        currentTier={tier} 
      />
      </>
    );
  }

  return (
    <main className="min-h-screen w-full bg-canvas text-ink font-sans">
      <LoadingOverlay isVisible={activeLoadingAction !== null} message={activeLoadingAction || ""} />
      <div className="px-8 pb-5 pt-3 lg:px-12">
        <header className="flex flex-col gap-4 border-b border-line py-3">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <Link href="/" className="brand-link flex items-center gap-2.5 text-[26px] font-extrabold tracking-[-0.04em] text-primary">
                Vidya
              </Link>
            </div>


            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-end lg:gap-3">
              <FeatureDropdowns
                activeMode={mode}
                activePanel={
                  workspacePanel === "history" || workspacePanel === "flashcards" || workspacePanel === "tutor"
                    ? workspacePanel
                    : "dashboard"
                }
                onModeChange={handleModeChange}
                onPanelChange={handleOpenFeaturePanel}
                tier={tier}
              />
              <div className="flex items-center justify-end gap-3 hidden sm:flex">
                <LanguageSelector value={language} onChange={handleLanguageChange} />
                <ProfileMenu onResetWorkspace={handleNewSession} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
            <span className="rounded-full bg-white/80 px-3 py-1.5 text-slate-600 shadow-sm">
              Active mode: {mode === "assignment" ? "Practice" : mode === "mocktest" ? "Mock Test" : mode === "solve" ? "Solve" : mode === "explain" ? "Explain" : "Summary"}
            </span>
            <span className="rounded-full bg-white/80 px-3 py-1.5 text-slate-500 shadow-sm">
              Workspace: {workspacePanel === "dashboard" ? "Results" : workspacePanel === "tutor" ? "Socratic Tutor" : workspacePanel}
            </span>
          </div>
        </header>

        <section className="mx-auto max-w-[1100px] px-2 pb-10 pt-10 sm:pt-12">
            {showInstallPrompt && (
              <div className="mb-6 rounded-2xl bg-primary/10 p-6 text-center border border-primary/20">
                <Sparkles className="mx-auto mb-4 h-10 w-10 text-primary" />
                <h3 className="text-lg font-bold text-ink">Install Vidya</h3>
                <p className="mt-2 text-sm text-muted">Install the app for the full experience.</p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
                  <button
                    onClick={handleInstallApp}
                    className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white transition hover:bg-emerald/90"
                  >
                    Install Now
                  </button>
                  <button
                    onClick={dismissInstallPrompt}
                    className="rounded-xl border border-line bg-white px-6 py-2.5 text-sm font-bold text-ink transition hover:bg-canvas"
                  >
                    Not Now
                  </button>
                </div>
              </div>
            )}

            {isGuest && !isAuthLoading && <GuestBanner />}

          <div className="mb-6 text-center lg:mb-10">
            <h1 className="mx-auto max-w-4xl font-serif text-[28px] font-bold leading-[1.05] tracking-[-0.03em] text-navy sm:text-[42px]">
              Transform your {heroTitleByMode[mode]}
              <br />
              <span className="italic text-primary">into clarity.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-[520px] text-[14px] leading-6 text-slate-500">
              Upload notes, scan handwritten pages, import a PDF, or paste a live URL to begin. Vidya converts rough material into a structured learning workflow.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[920px]">
          <div className="premium-trail-container w-full shadow-[0_30px_70px_rgba(5,150,105,0.2)]">
          <Card
            className={`w-full overflow-hidden rounded-[24px] border-line bg-surface p-0 shadow-card transition ${
              isDragActive ? "border-primary/50 ring-4 ring-primary/10" : "border-line/60 shadow-none"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="px-5 pb-0 pt-6 sm:px-7">
              <label 
                htmlFor="main-source-textarea" 
                className="flex cursor-pointer items-center gap-2.5 text-[15px] font-medium text-slate-500 transition hover:text-primary"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span>What are we exploring today? <span className="font-normal text-slate-400">Paste text, drop a note image, or upload a document...</span></span>
              </label>

              <div className="mt-3">
                <Textarea
                  id="main-source-textarea"
                  value={sourceText}
                  onChange={(event) => setSourceText(event.target.value)}
                  onKeyDown={handleSourceTextareaKeyDown}
                  onPaste={handleNotesPaste}
                  className="min-h-[140px] rounded-none border-0 px-0 py-0 text-[15px] text-slate-700 shadow-none focus:border-transparent focus:ring-0 sm:min-h-[160px]"
                  placeholder=""
                />

                {imagePreviewUrl ? (
                  <div className="mt-4 rounded-[24px] border border-slate-200 bg-surface p-4">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      <ImageIcon className="h-4 w-4" />
                      Notes Preview
                    </div>
                    <div className="mt-3 overflow-hidden rounded-[18px] border border-slate-200 bg-surface">
                      <Image
                        src={imagePreviewUrl}
                        alt="Uploaded notes preview"
                        width={1200}
                        height={900}
                        unoptimized
                        className="max-h-[280px] w-full object-contain"
                      />
                    </div>
                  </div>
                ) : null}

                {isExtractingNotes ? (
                  <div className="mt-4 rounded-[24px] border border-emerald-100 bg-[linear-gradient(135deg,#f0fdf4_0%,#f8fffb_100%)] px-4 py-4 text-sm text-slate-700">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-600">
                      {notesProcessingPhase === "uploading"
                        ? "Uploading notes"
                        : notesProcessingPhase === "extracting"
                          ? "Vision OCR Processing"
                          : notesProcessingPhase === "analyzing"
                            ? "Document Analysis"
                            : "Structuring Content"}
                    </p>
                    <p className="mt-2 leading-6">
                      {notesProcessingPhase === "uploading"
                        ? "Preparing your handwritten notes for OCR..."
                        : notesProcessingPhase === "extracting"
                          ? "Extracting text from the image with Vision OCR..."
                          : notesProcessingPhase === "analyzing"
                            ? "Extracting and cleaning text from your PDF document..."
                            : "Structuring content into clean, exam-ready study material..."}
                    </p>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      disabled={!isVoiceSupported}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        isListening
                          ? "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300"
                          : "border-emerald-200 bg-primary text-white shadow-md shadow-emerald-200/50 hover:bg-emerald-700"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {isListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      {isListening ? "Stop dictation" : "Voice to text"}
                    </button>
                    <p className="text-xs leading-5 text-slate-500">
                      {isListening
                        ? "Listening now. Speak naturally and tap again when you're done."
                        : isVoiceSupported
                          ? "Dictate your topic, doubt, or notes and Vidya will paste it here."
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
                    <div className="mt-4 grid gap-3 rounded-2xl bg-surface p-4 text-sm text-slate-700 sm:grid-cols-2">
                      <p><strong>Math:</strong> Solve: 2x² + 5x - 3 = 0</p>
                      <p><strong>Physics:</strong> A ball is thrown at 20m/s at 45°. Find max height.</p>
                      <p><strong>History:</strong> What were the main causes of the First World War?</p>
                      <p><strong>Biology:</strong> Explain the process of DNA replication.</p>
                      <p><strong>Chemistry:</strong> Balance: Fe + HCl → FeCl₂ + H₂</p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Mock Test Config has been moved to PremiumResultsView */}
            </div>

            <div className="border-t border-line bg-surface px-5 py-4 sm:px-7">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="flex flex-col gap-3 sm:flex-row">
                  {!fileName ? (
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-3 text-[13px] font-bold text-white shadow-lg shadow-emerald-200/50 transition-all hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-300/60 active:scale-[0.98]">
                      <Camera className="h-4 w-4" />
                      <span>Upload Notes</span>
                      <input className="hidden" type="file" accept=".txt,.md,.json,.pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" onChange={handleFileUpload} />
                    </label>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-[13px] font-bold text-white shadow-lg shadow-emerald-200/50">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="max-w-[150px] truncate">{fileName}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => {
                          setFileName("");
                          setExtractedFileContent("");
                          setImagePreviewUrl("");
                        }}
                        className="ml-2 rounded-full bg-black/20 p-1 hover:bg-black/40 transition-colors"
                        title="Remove file"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  </div>

                <div className="flex flex-wrap items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={isPending}
                    className="inline-flex items-center justify-center rounded-xl bg-[#0E1B2B] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white shadow-lg transition hover:bg-[#1e293b] hover:shadow-xl hover:shadow-slate-200/50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Analyze
                  </button>
                  <Tooltip
                    content={isOnline ? "" : "Connect to internet to generate new content"}
                    position="top"
                  >
                    <span className="inline-flex">
                      <SparkleButton
                        onClick={handleSubmit}
                        disabled={!isOnline || isPending}
                        label={
                          !isOnline
                            ? "Generate unavailable offline"
                            : isPending
                              ? "Generating..."
                              : "Generate ->"
                        }
                        className="text-xs"
                      />
                    </span>
                  </Tooltip>
                </div>
              </div>
            </div>
          </Card>
          </div>

          {error ? <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger">{error}</p> : null}

          {shouldSuggestHinglish(sourceText, language) ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-slate-700">
              <p>Looks like you&apos;re writing in Hinglish. Switch output to Hinglish?</p>
              <button
                type="button"
                onClick={() => handleLanguageChange("hinglish")}
                className="mt-3 rounded-full border border-amber-300 bg-surface px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
              >
                Switch to Hinglish
              </button>
            </div>
          ) : null}

          {isPending && (
            <div className="mt-10 flex flex-col items-center gap-4 py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <p className="text-[15px] font-medium text-slate-500">
                Vidya is analyzing your material across all dimensions...
              </p>
              <p className="text-[13px] text-slate-400">
                Generating structured study output for the selected mode
              </p>
            </div>
          )}

          {!isPending && showAnalyzer ? (
            <div className="mt-10 rounded-[32px] border border-slate-200 bg-surface/80 p-6 shadow-card sm:p-7">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                    Performance Analyzer
                  </p>
                  <h2 className="mt-3 text-[32px] font-bold tracking-[-0.05em] text-slate-900">
                    Study dashboard for your recent progress
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Review coverage, streaks, weak areas, and quiz trends before you start your next topic.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAnalyzer(false)}
                  className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Hide analyzer
                </button>
              </div>

              <PremiumResultsView
                sourceText={sourceText}
                language={language}
                summaryData={summaryData}
                explainData={explainData}
                assignmentData={assignmentData}
                mockTestData={mockTestData}
                revisionData={revisionData}
                solveData={solveData}
                activeMode={mode}
                isGenerating={false}
                error=""
                clarification={null}
                onClarificationSelect={handleClarificationSelect}
                onStudyGapTopics={handleStudyGapTopics}
                onModeSelect={handleModeChange}
                onNewSession={handleNewSession}
                workspacePanel="dashboard"
                onWorkspacePanelChange={setWorkspacePanel}
                historyItems={historyItems}
                libraryItems={libraryItems}
                flashcardDecks={flashcardDecks}
                dueFlashcards={dueFlashcards}
                isReviewingFlashcards={false}
                onOpenHistoryItem={(item) => handleOpenWorkspaceItem(item)}
                onOpenLibraryItem={(item) => handleOpenWorkspaceItem(item, item.lastMode)}
                onClearHistory={handleClearHistory}
                onClearLibrary={handleClearLibrary}
                onStartFlashcardReview={handleStartFlashcardReview}
                onStopFlashcardReview={() => setIsReviewingFlashcards(false)}
                onAddQuestionToAssignment={handleAddQuestionToAssignment}
                onSolveQuestion={handleSolveQuestion}
                actionMessage={actionMessage}
                onClearActionMessage={() => setActionMessage(null)}
                onRateFlashcard={handleRateFlashcard}
                performanceInsights={performanceInsights}
                isLoadingPerformanceInsights={isLoadingPerformanceInsights}
                weakAreaRevisionPack={weakAreaRevisionPack}
                isGeneratingWeakAreaRevision={isGeneratingWeakAreaRevision}
                onGenerateWeakAreaRevision={handleGenerateWeakAreaRevision}
                onRefreshPerformanceInsights={loadPerformanceInsights}
                onSaveFlashcardDeck={handleSaveFlashcardDeck}
                onFlashcardsRefresh={loadFlashcardSnapshot}
                onLanguageChange={handleLanguageChange}
                tier={tier}
                showRealLifeExamples={showRealLifeExamples}
                onShowRealLifeExamplesChange={setShowRealLifeExamples}
                storageStats={storageStats}
                onClearOldData={handleClearOldData}
                onRequestLearningGraph={handleRequestLearningGraph}
                onLoadLearningTopic={openTopicInExplainMode}
                onStartLearningPath={handleStartLearningPath}
                activeStudyPath={activeStudyPath}
                onAdvanceStudyPath={handleAdvanceStudyPath}
                onDismissStudyPath={() => setActiveStudyPath(null)}
                onTutorAsk={handleTutorAsk}
                mockTestDifficulty={mockTestDifficulty}
                setMockTestDifficulty={setMockTestDifficulty}
                mockTestDuration={mockTestDuration}
                setMockTestDuration={setMockTestDuration}
                mockTestMode={mockTestMode}
                setMockTestMode={setMockTestMode}
                onStartMockTest={handleStartMockTest}
                user={user}
                embeddedDashboard
              />
            </div>
          ) : null}

          {!isPending && (
            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {featureItems.map((item, index) => (
                <Card
                  key={item.title}
                  className={`group min-h-[220px] rounded-[24px] border p-5 shadow-[0_22px_55px_rgba(148,163,184,0.12)] transition hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(59,130,246,0.16)] ${
                    index === 0
                      ? "border-blue-200 bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)]"
                      : "border-slate-200 bg-[linear-gradient(180deg,#fbfdff_0%,#f3f7fc_100%)]"
                  }`}
                >
                  <div className="flex h-full flex-col">
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${
                          index === 0
                            ? "border-emerald-200 bg-emerald-50 text-primary shadow-sm"
                            : "border-line bg-surface text-ink"
                        }`}
                      >
                        {item.icon === "line" ? <div className="h-1.5 w-4 rounded-full bg-primary" /> : null}
                        {item.icon === "explain" ? <GraduationCap className="h-4 w-4" /> : null}
                        {item.icon === "assignment" ? <FileText className="h-4 w-4" /> : null}
                        {item.icon === "mocktest" ? <Clock3 className="h-4 w-4" /> : null}
                        {item.icon === "solve" ? <Sparkles className="h-4 w-4" /> : null}
                      </div>
                      <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
                        0{index + 1}
                      </span>
                    </div>

                    <div className="mt-6 space-y-3">
                      <h2 className="max-w-[210px] text-[18px] font-semibold leading-[1.15] tracking-[-0.03em] text-slate-900 sm:text-[20px]">
                        {item.title}
                      </h2>
                      <p className="max-w-[240px] text-[13px] leading-6 text-slate-600">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-auto pt-6">
                      <div className="h-px w-full bg-[linear-gradient(90deg,rgba(37,99,235,0.18),rgba(148,163,184,0))]" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="mx-auto max-w-[920px] pb-16 pt-10" />

        <footer className="flex flex-col gap-4 border-t border-slate-200/80 pt-5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-300 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 Vidya editorial. Soft-minimal system.</p>
          <div className="flex gap-6">
            <button type="button" onClick={() => alert("Privacy Policy coming soon...")} className="cursor-pointer transition hover:text-slate-500">Privacy</button>
            <button type="button" onClick={() => alert("Terms of Service coming soon...")} className="cursor-pointer transition hover:text-slate-500">Terms</button>
            <button type="button" onClick={() => alert("Methodology details coming soon...")} className="cursor-pointer transition hover:text-slate-500">Methodology</button>
          </div>
        </footer>
      </div>
      <PricingModal 
        isOpen={showPricing} 
        onClose={() => setShowPricing(false)} 
        currentTier={tier} 
      />
    </main>
  );
}

async function extractTextFromFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/extract-file", withClientSessionHeaders({
    method: "POST",
    body: formData,
  }));
  const payload = (await response.json()) as {
    data?: {
      text: string;
      title?: string;
      sourceKind?: "image" | "document";
      shouldAutoGenerate?: boolean;
    };
    error?: string;
  };

  if (!response.ok || !payload.data) {
    throw new Error(payload.error || "Unable to parse the uploaded file.");
  }

  return {
    text: payload.data.text,
    title: payload.data.title,
    sourceKind: payload.data.sourceKind ?? "document",
    shouldAutoGenerate: Boolean(payload.data.shouldAutoGenerate),
  };
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

function titleFromCurrentMode(
  mode: StudyMode,
  summaryData: SummaryResult | null,
  explainData: ExplanationResult | null,
  assignmentData: AssignmentResult | null,
  mockTestData: MockTestResult | null,
  solveData: SolveResult | null
) {
  if (mode === "summary") {
    return summaryData?.title || "";
  }

  if (mode === "explain") {
    return explainData?.title || "";
  }

  if (mode === "assignment") {
    return assignmentData?.title || "";
  }

  if (mode === "mocktest") {
    return mockTestData?.title || "";
  }

  if (mode === "solve") {
    return solveData?.frameworkLabel || "";
  }

  return "";
}


function buildWorkspaceHistoryItems(records: Awaited<ReturnType<typeof sessionStore.getAll>>): WorkspaceHistoryItem[] {
  return records.map((record) => ({
    id: record.id,
    title: deriveSessionTitle(record),
    introduction: deriveSessionIntroduction(record),
    sourceText: record.sourceText,
    language: record.language,
    mode: record.mode,
    createdAt: record.createdAt,
    resultData: record.output,
  }));
}

function buildWorkspaceLibraryItems(records: Awaited<ReturnType<typeof sessionStore.getAll>>): WorkspaceLibraryItem[] {
  const grouped = new Map<string, WorkspaceLibraryItem>();

  records.forEach((record) => {
    const key = `${record.language}:${record.sourceText.trim().toLowerCase()}`;
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        id: `library-${record.id}`,
        title: deriveSessionTitle(record),
        introduction: deriveSessionIntroduction(record),
        sourceText: record.sourceText,
        language: record.language,
        lastMode: record.mode,
        updatedAt: record.createdAt,
        visits: 1,
        resultData: record.output,
      });
      return;
    }

    grouped.set(key, {
      ...existing,
      visits: existing.visits + 1,
      updatedAt: existing.updatedAt > record.createdAt ? existing.updatedAt : record.createdAt,
      lastMode: existing.updatedAt > record.createdAt ? existing.lastMode : record.mode,
      resultData: existing.updatedAt > record.createdAt ? existing.resultData : record.output,
    });
  });

  return Array.from(grouped.values()).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function buildFlashcardDecks(records: FlashcardRecord[]): FlashcardDeck[] {
  const grouped = new Map<string, FlashcardDeck>();

  records.forEach((record) => {
    const existing = grouped.get(record.deckId);
    const card: FlashcardCard = {
      id: record.id,
      deckId: record.deckId,
      sessionId: record.sessionId,
      front: record.front,
      back: record.back,
      type: record.type,
      tags: record.tags,
      easeFactor: record.easeFactor,
      intervalDays: record.intervalDays,
      repetitions: record.repetitions,
      nextReviewDate: record.nextReviewDate,
      lastReviewDate: record.lastReviewDate,
      createdAt: record.createdAt,
    };

    if (!existing) {
      grouped.set(record.deckId, {
        id: record.deckId,
        sessionId: record.sessionId,
        title: record.deckTitle,
        subject: record.deckSubject,
        cardCount: 1,
        createdAt: record.deckCreatedAt,
        cards: [card],
      });
      return;
    }

    existing.cards.push(card);
    existing.cardCount = existing.cards.length;
  });

  return Array.from(grouped.values()).sort((left, right) => {
    const timeA = left.createdAt || "";
    const timeB = right.createdAt || "";
    return timeB.localeCompare(timeA);
  });
}

function deriveSessionTitle(record: { topic: string; sourceText: string; output: unknown }) {
  if (record.output && typeof record.output === "object" && "title" in record.output && typeof record.output.title === "string") {
    return record.output.title.trim() || record.topic || record.sourceText.trim().slice(0, 80) || "Study Session";
  }

  return record.topic || record.sourceText.trim().split("\n")[0]?.slice(0, 80) || "Study Session";
}

function deriveSessionIntroduction(record: { sourceText: string; output: unknown }) {
  if (record.output && typeof record.output === "object" && "introduction" in record.output && typeof record.output.introduction === "string") {
    return record.output.introduction.trim() || record.sourceText.trim().slice(0, 140);
  }

  return record.sourceText.trim().slice(0, 140) || "Saved study session.";
}

function flashcardToRecord(card: FlashcardCard, deck?: FlashcardDeck): FlashcardRecord {
  return {
    id: card.id,
    deckId: card.deckId,
    sessionId: card.sessionId,
    deckTitle: deck?.title ?? "Revision Deck",
    deckSubject: deck?.subject ?? "",
    deckCreatedAt: deck?.createdAt ?? card.createdAt,
    front: card.front,
    back: card.back,
    type: card.type,
    tags: card.tags,
    easeFactor: card.easeFactor,
    intervalDays: card.intervalDays,
    repetitions: card.repetitions,
    nextReviewDate: card.nextReviewDate,
    lastReviewDate: card.lastReviewDate,
    createdAt: card.createdAt,
    synced: true,
  };
}
