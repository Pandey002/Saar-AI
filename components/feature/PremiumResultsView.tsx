"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Brain,
  Bell,
  FileText,
  GraduationCap,
  History,
  CalendarDays,
  Clock3,
  BookMarked,
  CheckCircle2,
  HelpCircle,
  Image as ImageIcon,
  Moon,
  PlusCircle,
  RotateCcw,
  Search,
  Settings,
  Sigma,
  Sparkles,
  SunMedium,
  UserCircle2,
  Lock,
  X,
  Menu,
  BarChart3,
} from "lucide-react";
import { canAccessTool } from "@/lib/tiers";
import { AdhyapakPanel } from "@/components/feature/tutor/AdhyapakPanel";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import {
  StudyProgressDashboard,
  type SavedQuizResult,
} from "@/components/feature/dashboard/StudyProgressDashboard";
import { Button } from "@/components/ui/Button";
import { FlashcardsPanel } from "@/components/feature/flashcards/FlashcardsPanel";
import { StudyPlanPanel } from "@/components/feature/study-plan/StudyPlanPanel";
import { MathText } from "@/components/feature/results/MathText";
import { Textarea } from "@/components/ui/Textarea";
import { SectionBlock } from "@/components/feature/results/SectionBlock";
import { TitleHeader } from "@/components/feature/results/TitleHeader";
import { AssignmentResultPage } from "@/components/feature/results/AssignmentResultPage";
import { ExplainResultPage } from "@/components/feature/results/ExplainResultPage";
import { MockTestPage } from "@/components/feature/results/MockTestPage";
import { AssignmentSkeleton, ExplainSkeleton, SolveSkeleton, SummarySkeleton } from "@/components/feature/results/ResultSkeletons";
import { SolvePage } from "@/components/feature/results/SolvePage";
import { SummaryResultPage } from "@/components/feature/results/SummaryResultPage";
import { withClientSessionHeaders, getClientSessionId } from "@/lib/clientSession";
import { getPerformanceInsights, recordPerformanceLogs } from "@/lib/performance/store";
import type {
  AssignmentEvaluationResult,
  AssignmentResult,
  ClarificationPrompt,
  ConceptDependencyGraphResult,
  ExplanationResult,
  FlashcardCard,
  FlashcardDeck,
  LanguageMode,
  MockTestEvaluationResult,
  MockTestResult,
  PerformanceInsightSnapshot,
  PerformanceLogEntry,
  PerformanceTopicInsight,
  RevisionResult,
  StudyMode,
  SolveResult,
  SummaryResult,
  WeakAreaRevisionPack,
  WorkspaceHistoryItem,
  WorkspaceLibraryItem,
  UserTier,
} from "@/types";

interface PremiumResultsViewProps {
  sourceText: string;
  language: LanguageMode;
  summaryData: SummaryResult | null;
  explainData: ExplanationResult | null;
  assignmentData: AssignmentResult | null;
  mockTestData: MockTestResult | null;
  revisionData: RevisionResult | null;
  solveData: SolveResult | null;
  activeMode: StudyMode;
  isGenerating: boolean;
  error?: string;
  clarification: ClarificationPrompt | null;
  onClarificationSelect: (option: string) => void;
  onStudyGapTopics: (topic: string) => void;
  onModeSelect: (mode: StudyMode) => void;
  onNewSession: () => void;
  workspacePanel: "dashboard" | "history" | "library" | "flashcards" | "studyPlan" | "settings" | "support" | "tutor" | "profile" | "analyzer";
  onWorkspacePanelChange: (panel: "dashboard" | "history" | "library" | "flashcards" | "studyPlan" | "settings" | "support" | "tutor" | "profile" | "analyzer") => void;
  user?: any;
  historyItems: WorkspaceHistoryItem[];
  libraryItems: WorkspaceLibraryItem[];
  flashcardDecks: FlashcardDeck[];
  dueFlashcards: FlashcardCard[];
  isReviewingFlashcards: boolean;
  onOpenHistoryItem: (item: WorkspaceHistoryItem) => void;
  onOpenLibraryItem: (item: WorkspaceLibraryItem) => void;
  onClearHistory: () => void;
  onClearLibrary: () => void;
  onStartFlashcardReview: () => void;
  onStopFlashcardReview: () => void;
  onRateFlashcard: (cardId: string, rating: 1 | 2 | 4 | 5, timeTakenMs: number) => Promise<void>;
  performanceInsights: PerformanceInsightSnapshot | null;
  isLoadingPerformanceInsights: boolean;
  weakAreaRevisionPack: WeakAreaRevisionPack | null;
  isGeneratingWeakAreaRevision: boolean;
  onGenerateWeakAreaRevision: (area: PerformanceTopicInsight) => Promise<void>;
  onRefreshPerformanceInsights: () => Promise<void>;
  onSaveFlashcardDeck: (deckId: string, cards: FlashcardCard[]) => Promise<void>;
  onFlashcardsRefresh: (newDeck?: { deckId: string; title: string; subject: string; cards: FlashcardCard[]; createdAt: string }) => Promise<void>;
  onLanguageChange: (value: LanguageMode) => void;
  showRealLifeExamples: boolean;
  onShowRealLifeExamplesChange: (value: boolean) => void;
  storageStats: { usage: number; quota: number } | null;
  onClearOldData: () => Promise<void>;
  onRequestLearningGraph: (topic: string) => Promise<ConceptDependencyGraphResult>;
  onLoadLearningTopic: (topic: string) => void;
  onStartLearningPath: (steps: string[]) => void;
  activeStudyPath: { steps: string[]; currentIndex: number } | null;
  onAdvanceStudyPath: () => void;
  onDismissStudyPath: () => void;
  onTutorAsk: (question: string) => Promise<string>;
  onAddQuestionToAssignment?: (question: any) => void;
  onSolveQuestion?: (question: any) => void;
  embeddedDashboard?: boolean;
  mockTestDifficulty: "easy" | "medium" | "hard";
  setMockTestDifficulty: (val: "easy" | "medium" | "hard") => void;
  mockTestDuration: number;
  setMockTestDuration: (val: number) => void;
  mockTestMode: "standard" | "competitive";
  setMockTestMode: (val: "standard" | "competitive") => void;
  onStartMockTest: () => void;
  tier: UserTier;
  actionMessage?: string | null;
  onClearActionMessage?: () => void;
  onShowToast?: (message: string) => void;
  unlockedFeatures?: Set<string>;
  onRequestAdUnlock?: (id: string, name: string) => void;
}

const studyModeButtons: Array<{
  id: StudyMode;
  label: string;
  description: string;
  icon: ReactNode;
}> = [
  {
    id: "summary",
    label: "Summary",
    description: "Quick overviews and revision-ready notes.",
    icon: <GraduationCap className="h-4 w-4" />,
  },
  {
    id: "explain",
    label: "Explain",
    description: "Deep understanding with examples and clarity.",
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    id: "assignment",
    label: "Practice",
    description: "Guided questions and answer checking.",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    id: "mocktest",
    label: "Mock Test",
    description: "Timed exam simulation and review.",
    icon: <Clock3 className="h-4 w-4" />,
  },
  {
    id: "solve",
    label: "Solve",
    description: "Step-by-step help for problem solving.",
    icon: <Sigma className="h-4 w-4" />,
  },
];

const workspaceToolButtons: Array<{
  id: "history" | "flashcards" | "tutor";
  label: string;
  icon: ReactNode;
}> = [
  {
    id: "history",
    label: "History",
    icon: <History className="h-4 w-4" />,
  },
  {
    id: "flashcards",
    label: "Flashcards",
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    id: "tutor",
    label: "Adhyapak",
    icon: <Brain className="h-4 w-4" />,
  },
];

export function PremiumResultsView({
  sourceText,
  language,
  summaryData,
  explainData,
  assignmentData,
  mockTestData,
  revisionData,
  solveData,
  activeMode,
  isGenerating,
  error,
  clarification,
  onClarificationSelect,
  onStudyGapTopics,
  onModeSelect,
  onNewSession,
  workspacePanel,
  onWorkspacePanelChange,
  historyItems,
  libraryItems,
  flashcardDecks,
  dueFlashcards,
  isReviewingFlashcards,
  onOpenHistoryItem,
  onOpenLibraryItem,
  onClearHistory,
  onClearLibrary,
  onStartFlashcardReview,
  onStopFlashcardReview,
  onRateFlashcard,
  performanceInsights,
  isLoadingPerformanceInsights,
  weakAreaRevisionPack,
  isGeneratingWeakAreaRevision,
  onGenerateWeakAreaRevision,
  onRefreshPerformanceInsights,
  onSaveFlashcardDeck,
  onFlashcardsRefresh,
  onLanguageChange,
  showRealLifeExamples,
  onShowRealLifeExamplesChange,
  storageStats,
  onClearOldData,
  onRequestLearningGraph,
  onLoadLearningTopic,
  onStartLearningPath,
  activeStudyPath,
  onAdvanceStudyPath,
  onDismissStudyPath,
  onTutorAsk,
  tier,
  onAddQuestionToAssignment,
  onSolveQuestion,
  embeddedDashboard = false,
  mockTestDifficulty,
  setMockTestDifficulty,
  mockTestDuration,
  setMockTestDuration,
  mockTestMode,
  setMockTestMode,
  onStartMockTest,
  actionMessage,
  onClearActionMessage,
  onShowToast,
  user,
  unlockedFeatures = new Set(),
  onRequestAdUnlock,
}: PremiumResultsViewProps) {
  const [quizResults, setQuizResults] = useState<SavedQuizResult[]>([]);
  const [assignmentResponses, setAssignmentResponses] = useState<Record<string, string>>({});
  const [assignmentEvaluation, setAssignmentEvaluation] = useState<AssignmentEvaluationResult | null>(null);
  const [isEvaluatingAssignment, setIsEvaluatingAssignment] = useState(false);
  const [assignmentEvaluationError, setAssignmentEvaluationError] = useState("");
  const [isSavingFlashcards, setIsSavingFlashcards] = useState(false);
  const [flashcardMessage, setFlashcardMessage] = useState("");
  const [savedSettings, setSavedSettings] = useState({
    fullName: "Guest User",
    email: "guest@vidya.ai",
    focusArea: "Structured study and exam preparation",
  });
  const [settingsDraft, setSettingsDraft] = useState(savedSettings);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setAssignmentResponses({});
    setAssignmentEvaluation(null);
    setAssignmentEvaluationError("");
  }, [assignmentData]);

  useEffect(() => {
    setFlashcardMessage("");
  }, [activeMode, sourceText, summaryData, explainData]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const saved = window.localStorage.getItem("saar_quiz_results");
      if (!saved) {
        setQuizResults([]);
        return;
      }

      const parsed = JSON.parse(saved) as SavedQuizResult[];
      setQuizResults(Array.isArray(parsed) ? parsed : []);
    } catch {
      setQuizResults([]);
    }
  }, []);

  const title = useMemo(() => {
    if (activeMode === "summary") return summaryData?.title || deriveTitle(sourceText);
    if (activeMode === "explain") return explainData?.title || deriveTitle(sourceText);
    if (activeMode === "assignment") return assignmentData?.title || deriveTitle(sourceText);
    if (activeMode === "mocktest") return mockTestData?.title || deriveTitle(sourceText);
    if (activeMode === "solve") return solveData?.title || deriveTitle(sourceText);
    return deriveTitle(sourceText);
  }, [activeMode, assignmentData?.title, explainData?.title, mockTestData?.title, solveData?.title, sourceText, summaryData?.title]);

  const subtitle = useMemo(() => {
    if (activeMode === "summary") return summaryData?.introduction || defaultSubtitle();
    if (activeMode === "explain") return explainData?.introduction || defaultSubtitle();
    if (activeMode === "assignment") return assignmentData?.introduction || defaultSubtitle();
    if (activeMode === "mocktest") return mockTestData?.introduction || "A timed, exam-style mock paper generated from your topic or notes.";
    if (activeMode === "solve") return solveData?.confidenceCheck || "A worked solution generated step by step from your problem statement.";
    return defaultSubtitle();
  }, [activeMode, assignmentData?.introduction, explainData?.introduction, mockTestData?.introduction, summaryData?.introduction, solveData?.confidenceCheck]);

  const breadcrumb = deriveBreadcrumb(title);

  async function handleSaveAsFlashcards() {
    const payload = buildFlashcardPayload(activeMode, title, sourceText, summaryData, explainData);
    if (!payload) {
      return;
    }

    setIsSavingFlashcards(true);
    setFlashcardMessage("");

    try {
      const response = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: payload.topic,
          sourceContent: payload.sourceContent,
          language,
          examTarget: "Board exams / JEE / NEET revision",
        }),
      });
      const result = (await response.json()) as { 
        data?: { deckId: string; title: string; subject: string; cards: FlashcardCard[]; createdAt: string }; 
        error?: string 
      };

      if (!response.ok || !result.data) {
        throw new Error(result.error || "Unable to save flashcards.");
      }

      // Save locally to IndexedDB immediately to bypass EROFS issues
      if (result.data) {
        if (onShowToast) {
          onShowToast(`${result.data.cards?.length ?? 0} flashcards saved to the flashcards section.`);
        } else {
          setFlashcardMessage(`${result.data.cards?.length ?? 0} flashcards saved to the flashcards section.`);
        }
        await onFlashcardsRefresh(result.data); // result.data contains { deckId, title, subject, cards, createdAt }
      }
    } catch (saveError) {
      setFlashcardMessage(saveError instanceof Error ? saveError.message : "Unable to save flashcards.");
    } finally {
      setIsSavingFlashcards(false);
    }
  }

  async function handleAssignmentSubmit() {
    if (!assignmentData) {
      return;
    }

    const submissions = assignmentData.sectionGroups.flatMap((group, groupIndex) =>
      group.questions.map((question, index) => {
        const questionKey = `${groupIndex}-${index}`;
        return {
          questionKey,
          question: question.question,
          questionType: question.type,
          marks: question.marks,
          userAnswer: (assignmentResponses[questionKey] ?? "").trim(),
          correctAnswer: question.answer,
          options: question.options,
        };
      })
    );

    const unanswered = submissions.filter((item) => item.userAnswer.length === 0);
    if (unanswered.length > 0) {
      setAssignmentEvaluationError("Please answer all questions before submitting.");
      return;
    }

    setAssignmentEvaluationError("");
    setIsEvaluatingAssignment(true);

    try {
      const response = await fetch("/api/assignment/evaluate", withClientSessionHeaders({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceText,
          language,
          submissions,
        }),
      }));

      const payload = await response.json();
      if (!response.ok || "error" in payload) {
        throw new Error(payload.error || "Unable to evaluate assignment.");
      }

      const performanceLogs = payload.performanceLogs as Array<Omit<PerformanceLogEntry, "id" | "userId">>;
      if (performanceLogs) {
        const sessionId = await getClientSessionId();
        await recordPerformanceLogs(sessionId, performanceLogs);
      }

      setAssignmentEvaluation(payload.data);
      persistQuizResult(payload.data);
      await onRefreshPerformanceInsights();
      window.dispatchEvent(new CustomEvent("vidya-performance-updated"));
    } catch (submitError) {
      setAssignmentEvaluationError(
        submitError instanceof Error ? submitError.message : "Unable to evaluate assignment."
      );
    } finally {
      setIsEvaluatingAssignment(false);
    }
  }

  function persistQuizResultEntry(nextEntry: SavedQuizResult) {
    if (typeof window === "undefined") {
      return;
    }

    try {
      setQuizResults((previous) => {
        const nextResults = [nextEntry, ...previous].slice(0, 24);
        window.localStorage.setItem("saar_quiz_results", JSON.stringify(nextResults));
        return nextResults;
      });
    } catch {
      // Keep assignment grading successful even if local persistence is unavailable.
    }
  }

  function persistQuizResult(result: AssignmentEvaluationResult) {
    const weakAreas = result.results
      .filter((item) => item.maxScore > 0 && item.score / item.maxScore < 0.6)
      .map((item) => item.question)
      .slice(0, 3);

    persistQuizResultEntry({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sourceText,
      title,
      scorePercent: result.totalMarks > 0 ? Math.round((result.totalScore / result.totalMarks) * 100) : 0,
      totalScore: result.totalScore,
      totalMarks: result.totalMarks,
      weakAreas,
      submittedAt: new Date().toISOString(),
    });
  }

  function persistMockTestResult(result: MockTestEvaluationResult) {
    persistQuizResultEntry({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sourceText,
      title,
      scorePercent: result.totalMarks > 0 ? Math.round((result.totalScore / result.totalMarks) * 100) : 0,
      totalScore: result.totalScore,
      totalMarks: result.totalMarks,
      weakAreas: result.analysis.weaknesses.slice(0, 3),
      submittedAt: new Date().toISOString(),
    });
    void onRefreshPerformanceInsights();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("vidya-performance-updated"));
    }
  }

  const isOverlayActive = isEvaluatingAssignment || isGeneratingWeakAreaRevision;
  const overlayMessage = isEvaluatingAssignment 
    ? "evaluation results" 
    : (isGeneratingWeakAreaRevision ? "revision pack" : "");

    if (embeddedDashboard) {
    return (
      <>
        <LoadingOverlay isVisible={isOverlayActive} message={`preparing your ${overlayMessage}...`} />
        <StudyProgressDashboard
        historyItems={historyItems}
        libraryItems={libraryItems}
        quizResults={quizResults}
        performanceInsights={performanceInsights}
        weakAreaRevisionPack={weakAreaRevisionPack}
        isLoadingPerformanceInsights={isLoadingPerformanceInsights}
        isGeneratingWeakAreaRevision={isGeneratingWeakAreaRevision}
        onGenerateWeakAreaRevision={onGenerateWeakAreaRevision}
        onStudyTopic={onStudyGapTopics}
      />
      </>
    );
  }

  return (
    <>
    <LoadingOverlay isVisible={isOverlayActive} message={`preparing your ${overlayMessage}...`} />
    <div className="results-shell flex min-h-screen w-full bg-canvas font-sans text-ink">
      <aside className="results-shell-sidebar sticky top-0 hidden lg:flex h-screen w-[240px] shrink-0 flex-col border-r border-line bg-[#F6F3E6] shadow-sm">
        <div className="px-5 pb-2 pt-5">
          <Link href="/" className="brand-link font-serif text-[22px] font-extrabold tracking-tight text-navy">
            Vidya
          </Link>
          <div className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            {breadcrumb}
          </div>
        </div>

        <div className="px-4 pb-4 pt-3">
          <button
            type="button"
            onClick={onNewSession}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-[13px] font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98]"
          >
            <PlusCircle className="h-4 w-4" />
            New Session
          </button>
        </div>

        <div className="px-4">
          <div className="space-y-2">
            <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Study Modes
            </p>
            {studyModeButtons.map((item) => {
              const isActive = workspacePanel === "dashboard" && activeMode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onWorkspacePanelChange("dashboard");
                    onModeSelect(item.id);
                  }}
                  className={`flex w-full items-start gap-3 border-l-4 py-3 pr-4 pl-3 transition ${
                    isActive
                      ? "border-primary bg-primary/10 text-navy"
                      : "border-transparent text-slate-500 hover:bg-black/5 hover:text-navy"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] transition ${
                      isActive ? "bg-primary/10 text-primary" : "bg-black/5 text-muted"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-[14px] font-bold tracking-tight ${isActive ? "text-ink" : "text-ink"}`}>{item.label}</span>
                    <span className={`mt-0.5 block text-[11px] leading-5 ${isActive ? "text-muted" : "text-muted"}`}>{item.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex flex-1 flex-col">
          <p className="px-6 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Quick Links
          </p>
          <div className="mt-3 space-y-1">
            <SidebarLink icon={<BarChart3 className="h-3.5 w-3.5" />} label="Analyze" active={workspacePanel === "analyzer"} onClick={() => onWorkspacePanelChange("analyzer")} />
            <SidebarLink icon={<BookMarked className="h-3.5 w-3.5" />} label="Library" active={workspacePanel === "library"} onClick={() => onWorkspacePanelChange("library")} />
            <SidebarLink icon={<CalendarDays className="h-3.5 w-3.5" />} label="Study Plan" active={workspacePanel === "studyPlan"} onClick={() => onWorkspacePanelChange("studyPlan")} />
            <SidebarLink icon={<Settings className="h-3.5 w-3.5" />} label="Settings" active={workspacePanel === "settings"} onClick={() => onWorkspacePanelChange("settings")} />
            <SidebarLink icon={<HelpCircle className="h-3.5 w-3.5" />} label="Help" active={workspacePanel === "support"} onClick={() => onWorkspacePanelChange("support")} />
          </div>
        </div>
      </aside>

      <main className="results-shell-main flex-1 overflow-y-auto bg-canvas">
        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-[60] bg-black/50 lg:hidden" onClick={() => setIsMobileSidebarOpen(false)}>
            <div className="h-full w-[280px] bg-[#F6F3E6] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <Link href="/" className="brand-link font-serif text-[22px] font-extrabold tracking-tight text-navy">
                  Vidya
                </Link>
                <button type="button" onClick={() => setIsMobileSidebarOpen(false)}>
                  <X className="h-6 w-6 text-slate-400" />
                </button>
              </div>
              <div className="mt-8 space-y-2">
                <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Study Modes
                </p>
                {studyModeButtons.map((item) => {
                  const isActive = workspacePanel === "dashboard" && activeMode === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onWorkspacePanelChange("dashboard");
                        onModeSelect(item.id);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`flex w-full items-start gap-3 border-l-4 py-3 pr-4 pl-3 transition ${
                        isActive
                          ? "border-primary bg-primary/10 text-navy"
                          : "border-transparent text-slate-500 hover:bg-black/5 hover:text-navy"
                      }`}
                    >
                      <span className={isActive ? "text-primary" : "text-muted"}>{item.icon}</span>
                      <span className="text-[14px] font-bold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="results-shell-topbar sticky top-0 z-10 flex items-center justify-between border-b border-line bg-[#F6F3E6] px-4 py-2 lg:px-6">
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              className="p-2 text-slate-500 lg:hidden" 
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="hidden flex-wrap items-center gap-2 xl:flex">
               {workspaceToolButtons.map((item) => {
                const toolId = item.id === "tutor" ? "canUseAdhyapak" : "canUseFlashcards";
                const isPermitted = canAccessTool(tier, toolId as any) || unlockedFeatures.has(toolId);
                const isActive = workspacePanel === item.id;
                
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (!isPermitted) {
                        onRequestAdUnlock?.(toolId, item.label);
                        return;
                      }
                      onWorkspacePanelChange(item.id);
                    }}
                    className={`group flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold transition-all ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-[#0E1B2B]/[0.06] text-muted hover:bg-[#0E1B2B]/[0.12] hover:text-ink"
                    }`}
                  >
                    <span className={isActive ? "text-primary" : "text-muted opacity-80"}>
                      {item.icon}
                    </span>
                    <span className="flex items-center gap-1.5">
                      {item.label}
                      {!isPermitted && (
                        <span className="flex h-4 items-center rounded bg-emerald-100 px-1 text-[9px] font-black uppercase text-emerald-700">
                          Unlock
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 xl:hidden">
              {workspaceToolButtons.map((item) => {
                const toolId = item.id === "tutor" ? "canUseAdhyapak" : "canUseFlashcards";
                const isPermitted = canAccessTool(tier, toolId as any) || unlockedFeatures.has(toolId);
                const isActive = workspacePanel === item.id;
                
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (!isPermitted) {
                        onRequestAdUnlock?.(toolId, item.label);
                        return;
                      }
                      onWorkspacePanelChange(item.id);
                    }}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
                      isActive
                        ? "border-primary bg-primary text-white"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                    }`}
                    aria-label={item.label}
                    title={item.label}
                  >
                    {!isPermitted ? <Sparkles className="h-3.5 w-3.5" /> : item.icon}
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={() => onWorkspacePanelChange("settings")} className="rounded-full p-2 text-muted transition hover:bg-black/5">
              <Settings className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onWorkspacePanelChange("profile")}
              className="hidden items-center gap-2 rounded-full bg-black/5 px-2.5 py-1 transition hover:bg-black/10 sm:flex"
            >
              <div className="text-right">
                <p className="text-xs font-semibold text-ink">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Guest User"}
                </p>
                <p className="text-[11px] text-muted">Personal Account</p>
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white font-bold text-[10px]">
                {user ? (user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()) : <UserCircle2 className="h-5 w-5" />}
              </div>
            </button>
          </div>
        </div>

        <div className={`results-shell-content w-full mobile:px-4 tablet:px-[5%] px-5 lg:px-6 xl:px-8 ${workspacePanel === "dashboard" && activeMode === "summary" ? "pb-8 pt-6" : "py-8"}`}>
          {actionMessage && (
            <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
               <div className="flex items-center justify-between gap-4 rounded-[20px] bg-emerald-600/95 p-3.5 pl-5 pr-4 text-white shadow-2xl backdrop-blur-md">
                 <div className="flex items-center gap-3">
                   <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                     <CheckCircle2 className="h-5 w-5" />
                   </div>
                   <p className="text-[14px] font-semibold tracking-tight">{actionMessage}</p>
                 </div>
                 <div className="flex items-center gap-2">
                    <Button
                      onClick={() => onModeSelect("assignment")}
                      className="h-8 rounded-xl bg-white px-4 text-[12px] font-bold text-emerald-700 hover:bg-white/90"
                    >
                      View Practice Set
                    </Button>
                    <button
                      onClick={onClearActionMessage}
                      className="ml-1 rounded-lg p-1 hover:bg-white/10 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                 </div>
               </div>
            </div>
          )}

          {workspacePanel === "dashboard" && activeMode !== "summary" ? (
            <TitleHeader
              eyebrow={activeMode === "assignment" ? "" : breadcrumb}
              title={title}
              subtitle={subtitle}
            />
          ) : null}

          {workspacePanel === "dashboard" && activeStudyPath ? (
            <section className="mt-6 rounded-[28px] border border-line bg-[#F6F3E6] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Study Path Active</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">
                    Step {activeStudyPath.currentIndex + 1} of {activeStudyPath.steps.length}: {activeStudyPath.steps[activeStudyPath.currentIndex]}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {activeStudyPath.currentIndex < activeStudyPath.steps.length - 1
                      ? `Next up: ${activeStudyPath.steps[activeStudyPath.currentIndex + 1]}`
                      : "You have reached the main target topic in this guided path."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {activeStudyPath.currentIndex < activeStudyPath.steps.length - 1 ? (
                    <Button onClick={onAdvanceStudyPath} className="rounded-2xl px-5">
                      Continue to Next Step
                    </Button>
                  ) : null}
                  <Button variant="secondary" onClick={onDismissStudyPath} className="rounded-2xl px-5">
                    End Study Path
                  </Button>
                </div>
              </div>
            </section>
          ) : null}

          {error ? (
            <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {clarification ? (
            <section className="mt-8 rounded-[28px] border border-amber-200 bg-amber-50/80 p-6">
              <p className="text-sm font-semibold text-slate-900">{clarification.message}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {clarification.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onClarificationSelect(option)}
                    className="rounded-full border border-amber-300 bg-surface px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-primary hover:text-primary"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <div className={workspacePanel === "dashboard" && activeMode === "summary" ? "mt-4" : "mt-10"}>
            {workspacePanel === "analyzer" ? (
              <StudyProgressDashboard
                historyItems={historyItems}
                libraryItems={libraryItems}
                quizResults={quizResults}
                performanceInsights={performanceInsights}
                weakAreaRevisionPack={weakAreaRevisionPack}
                isLoadingPerformanceInsights={isLoadingPerformanceInsights}
                isGeneratingWeakAreaRevision={isGeneratingWeakAreaRevision}
                onGenerateWeakAreaRevision={onGenerateWeakAreaRevision}
                onStudyTopic={onStudyGapTopics}
              />
            ) : null}

            {workspacePanel === "history" ? (
              <HistoryPanel items={historyItems} onOpen={onOpenHistoryItem} onClear={onClearHistory} />
            ) : null}

            {workspacePanel === "library" ? (
              <LibraryPanel items={libraryItems} onOpen={onOpenLibraryItem} onClear={onClearLibrary} />
            ) : null}

            {workspacePanel === "flashcards" ? (
              <FlashcardsPanel
                decks={flashcardDecks}
                dueCards={dueFlashcards}
                isReviewing={isReviewingFlashcards}
                onStartReview={onStartFlashcardReview}
                onStopReview={onStopFlashcardReview}
                onRateCard={onRateFlashcard}
                onSaveDeck={onSaveFlashcardDeck}
              />
            ) : null}

            {workspacePanel === "studyPlan" ? (
              <StudyPlanPanel
                language={language}
                performanceInsights={performanceInsights}
                onStudyTopic={onStudyGapTopics}
              />
            ) : null}

            {workspacePanel === "tutor" ? (
              <AdhyapakPanel topic={title} sourceText={sourceText} onAsk={onTutorAsk} />
            ) : null}

            {workspacePanel === "settings" ? (
              <SettingsPanel
                language={language}
                onLanguageChange={onLanguageChange}
                onClearHistory={onClearHistory}
                onClearLibrary={onClearLibrary}
                showRealLifeExamples={showRealLifeExamples}
                onShowRealLifeExamplesChange={onShowRealLifeExamplesChange}
                storageStats={storageStats}
                onClearOldData={onClearOldData}
                settingsDraft={settingsDraft}
                tier={tier}
                onUpdateSettings={(field, value) =>
                  setSettingsDraft((previous) => ({ ...previous, [field]: value }))
                }
                hasUnsavedChanges={JSON.stringify(savedSettings) !== JSON.stringify(settingsDraft)}
                onDiscardChanges={() => setSettingsDraft(savedSettings)}
                onSaveSettings={() => setSavedSettings(settingsDraft)}
              />
            ) : null}

            {workspacePanel === "profile" ? (
              <ProfilePanel user={user} onOpenSettings={() => onWorkspacePanelChange("settings")} />
            ) : null}

            {workspacePanel === "support" ? (
              <SupportPanel onNewSession={onNewSession} onOpenSettings={() => onWorkspacePanelChange("settings")} />
            ) : null}

            {workspacePanel === "dashboard" && activeMode === "summary" ? (
              isGenerating && !summaryData ? (
                <SummarySkeleton />
              ) : summaryData ? (
                <SummaryResultPage
                  data={summaryData}
                  language={language}
                  sourceTopic={sourceText}
                  onFollowUp={onClarificationSelect}
                  onStudyGaps={onStudyGapTopics}
                  showRealLifeExamples={showRealLifeExamples}
                  onSaveAsFlashcards={() => void handleSaveAsFlashcards()}
                  isSavingFlashcards={isSavingFlashcards}
                  flashcardMessage={flashcardMessage}
                  onRequestLearningGraph={onRequestLearningGraph}
                  onLoadLearningTopic={onLoadLearningTopic}
                  onStartLearningPath={onStartLearningPath}
                  onAddQuestionToAssignment={onAddQuestionToAssignment}
                  onSolveQuestion={onSolveQuestion}
                  onAskDoubt={() => onWorkspacePanelChange("tutor")}
                  tier={tier}
                  unlockedFeatures={unlockedFeatures}
                  onRequestAdUnlock={onRequestAdUnlock}
                />
              ) : null
            ) : null}

            {workspacePanel === "dashboard" && activeMode === "explain" ? (
              isGenerating && !explainData ? (
                <ExplainSkeleton />
              ) : explainData ? (
                <ExplainResultPage
                  data={explainData}
                  language={language}
                  sourceTopic={sourceText}
                  onFollowUp={onClarificationSelect}
                  onStudyGaps={onStudyGapTopics}
                  showRealLifeExamples={showRealLifeExamples}
                  onSaveAsFlashcards={() => void handleSaveAsFlashcards()}
                  isSavingFlashcards={isSavingFlashcards}
                  flashcardMessage={flashcardMessage}
                  onRequestLearningGraph={onRequestLearningGraph}
                  onLoadLearningTopic={onLoadLearningTopic}
                  onStartLearningPath={onStartLearningPath}
                  onAddQuestionToAssignment={onAddQuestionToAssignment}
                  onSolveQuestion={onSolveQuestion}
                  onAskDoubt={() => onWorkspacePanelChange("tutor")}
                  tier={tier}
                  unlockedFeatures={unlockedFeatures}
                  onRequestAdUnlock={onRequestAdUnlock}
                />
              ) : null
            ) : null}

            {workspacePanel === "dashboard" && activeMode === "assignment" ? (
              isGenerating && !assignmentData ? (
                <AssignmentSkeleton />
              ) : assignmentData ? (
                <AssignmentResultPage
                  data={assignmentData}
                  responses={assignmentResponses}
                  evaluation={assignmentEvaluation}
                  isEvaluating={isEvaluatingAssignment}
                  evaluationError={assignmentEvaluationError}
                  onChangeAnswer={(key, value) => {
                    setAssignmentResponses((previous) => ({ ...previous, [key]: value }));
                    setAssignmentEvaluation(null);
                    setAssignmentEvaluationError("");
                  }}
                  onSubmitAssignment={handleAssignmentSubmit}
                  onFollowUp={onClarificationSelect}
                />
              ) : null
            ) : null}

            {workspacePanel === "dashboard" && activeMode === "mocktest" ? (
              isGenerating && !mockTestData ? (
                <AssignmentSkeleton />
              ) : mockTestData ? (
                <MockTestPage
                  data={mockTestData}
                  sourceText={sourceText}
                  language={language}
                  onExit={onNewSession}
                  onPersistResult={persistMockTestResult}
                />
              ) : (
                <div className="mx-auto max-w-4xl tablet:max-w-[90%] mobile:max-w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <header className="mb-10 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">Final Countdown</p>
                    <h2 className="mt-2 font-serif text-[42px] mobile:text-[32px] font-bold tracking-tight text-navy">Exam Setup</h2>
                    <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-500">
                      Vidya is ready to generate your specialized mock test. Select your difficulty and mode below to begin the 30-question simulation.
                    </p>
                  </header>

                  <div className="overflow-hidden rounded-[32px] border border-emerald-100 bg-[#F6F3E6] p-8 mobile:p-5 shadow-[0_20px_50px_rgba(5,150,105,0.06)]">
                    <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600/10 text-emerald-600">
                          <Clock3 className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-navy">Tailor your Paper</h3>
                          <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-0.5">30 Total Questions Grounded in Source</p>
                        </div>
                      </div>
                      <div className="flex rounded-2xl bg-white/40 p-1.5 shadow-sm border border-emerald-100/20">
                        <button
                          type="button"
                          onClick={() => setMockTestMode("standard")}
                          className={`rounded-xl px-5 py-2 text-xs font-bold transition-all duration-300 ${
                            mockTestMode === "standard"
                              ? "bg-navy text-white shadow-lg scale-[1.02]"
                              : "text-slate-600 hover:bg-white/60"
                          }`}
                        >
                          Standard Prep
                        </button>
                        <button
                          type="button"
                          onClick={() => setMockTestMode("competitive")}
                          className={`rounded-xl px-5 py-2 text-xs font-bold transition-all duration-300 ${
                            mockTestMode === "competitive"
                              ? "bg-navy text-white shadow-lg scale-[1.02]"
                              : "text-slate-600 hover:bg-white/60"
                          }`}
                        >
                          Competitive
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-8 sm:grid-cols-2">
                      <div className="space-y-3">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Exam Difficulty</label>
                        <div className="grid grid-cols-1 gap-2">
                          {["easy", "medium", "hard"].map((level) => (
                            <button
                              key={level}
                              type="button"
                              onClick={() => setMockTestDifficulty(level as any)}
                              className={`flex items-center justify-between rounded-2xl border px-5 py-3 transition-all ${
                                mockTestDifficulty === level
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20"
                                  : "border-slate-200 bg-white/50 text-slate-600 hover:border-emerald-300"
                              }`}
                            >
                              <span className="text-sm font-bold capitalize">{level}</span>
                              {mockTestDifficulty === level && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Time Limit</label>
                            <span className="text-sm font-bold text-emerald-700">{mockTestDuration} mins</span>
                          </div>
                          <input
                            type="range"
                            min="30"
                            max="120"
                            step="5"
                            value={mockTestDuration}
                            onChange={(e) => setMockTestDuration(parseInt(e.target.value))}
                            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-emerald-200 accent-emerald-600 transition hover:bg-emerald-300"
                          />
                        </div>

                        <div className="rounded-2xl bg-white/40 p-4">
                          <p className="text-[11px] leading-relaxed text-slate-500">
                             {mockTestMode === "competitive" 
                               ? "🔥 Pure Competitive Mode: 30 MCQs including Assertion-Reasoning and multi-step problems based strictly on your content." 
                               : "⚖️ Balanced Prep: 20 MCQs and 10 analytical questions (Short & Long Answer) derived from your study material."}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-10 flex flex-col items-center gap-4 border-t border-emerald-100 pt-8">
                       <button
                        type="button"
                        onClick={onStartMockTest}
                        className="group relative flex w-full max-w-sm items-center justify-center gap-3 overflow-hidden rounded-2xl bg-navy py-4 font-serif text-[18px] font-bold text-white shadow-xl transition-all hover:bg-slate-800 active:scale-95"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-transparent opacity-0 transition group-hover:opacity-100" />
                        Start Final Simulation
                        <Sparkles className="h-5 w-5 transition group-hover:rotate-12" />
                      </button>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300">
                        Designed for board exams and competitive entrance patterns
                      </p>
                    </div>
                  </div>
                </div>
              )
            ) : null}

            {workspacePanel === "dashboard" && activeMode === "revision" && revisionData ? (
              <RevisionFallback data={revisionData} />
            ) : null}

            {workspacePanel === "dashboard" && activeMode === "solve" ? (
              isGenerating && !solveData ? (
                <SolveSkeleton />
              ) : solveData ? (
                <SolvePage
                  data={solveData}
                  sourceText={sourceText}
                  language={language}
                  onFollowUp={onClarificationSelect}
                />
              ) : null
            ) : null}
          </div>
        </div>

        <footer className="results-shell-footer border-t border-slate-200 bg-white">
          <div className="flex w-full flex-col items-center justify-between gap-4 px-6 py-5 sm:flex-row lg:px-8 xl:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-300">
              © 2026 Vidya Editorial. Soft-minimal ISM.
            </p>
            <div className="flex gap-6 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-300">
              <button type="button" onClick={() => alert("Privacy Policy coming soon...")} className="cursor-pointer transition hover:text-slate-500">Privacy</button>
              <button type="button" onClick={() => alert("Terms of Service coming soon...")} className="cursor-pointer transition hover:text-slate-500">Terms</button>
              <button type="button" onClick={() => alert("Methodology details coming soon...")} className="cursor-pointer transition hover:text-slate-500">Methodology</button>
            </div>
          </div>
        </footer>
      </main>
    </div>
    </>
  );
}

function buildFlashcardPayload(
  activeMode: PremiumResultsViewProps["activeMode"],
  title: string,
  sourceText: string,
  summaryData: SummaryResult | null,
  explainData: ExplanationResult | null
) {
  if (activeMode === "summary" && summaryData) {
    return {
      topic: summaryData.title || title,
      sourceContent: [
        summaryData.introduction,
        ...summaryData.concepts.map((concept) => `${concept.title}: ${concept.explanation}`),
        ...summaryData.sections.map((section) => `${section.heading}: ${section.paragraph} ${section.points.join(". ")}`),
      ].join("\n\n"),
    };
  }

  if (activeMode === "explain" && explainData) {
    return {
      topic: explainData.title || title,
      sourceContent: [
        explainData.introduction,
        ...explainData.coreConcepts,
        ...explainData.frameworkCards.map((card) => `${card.title}: ${card.description}`),
        ...explainData.sections.map((section) => `${section.heading}: ${section.paragraph} ${section.points.join(". ")}`),
        ...explainData.keyTakeaways,
      ].join("\n\n"),
    };
  }

  if (sourceText.trim()) {
    return {
      topic: title,
      sourceContent: sourceText,
    };
  }

  return null;
}

function RevisionFallback({ data }: { data: RevisionResult }) {
  return (
    <SectionBlock title="Revision Mode" eyebrow="Quick Recall">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[24px] bg-[#f8fafc] p-5">
          <h3 className="text-[16px] font-semibold text-slate-900">Key Concepts</h3>
          <ul className="mt-4 space-y-2">
            {data.keyConcepts.map((item) => (
              <li key={`${item.term}-${item.definition}`} className="text-sm leading-6 text-slate-600">
                <strong className="text-slate-900"><MathText text={item.term} />:</strong>{" "}
                <MathText text={item.definition} />
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[24px] bg-[#f8fafc] p-5">
          <h3 className="text-[16px] font-semibold text-slate-900">Short Questions</h3>
          <div className="mt-4 space-y-4">
            {data.shortQuestions.map((item) => (
              <div key={`${item.question}-${item.answer}`}>
                <p className="text-sm font-semibold text-slate-900"><MathText text={item.question} /></p>
                <p className="mt-1 text-sm leading-6 text-slate-600"><MathText text={item.answer} /></p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionBlock>
  );
}

function SidebarLink({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mt-1 flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-medium transition ${
        active ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:bg-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function deriveTitle(sourceText: string): string {
  const firstLine = sourceText.trim().split("\n")[0] || "";
  if (firstLine.length > 5 && firstLine.length < 80) {
    return firstLine.replace(/^#+\s*/, "");
  }
  const words = sourceText.trim().split(/\s+/).slice(0, 6).join(" ");
  return words.length > 3 ? words + "..." : "Study Analysis";
}

function deriveBreadcrumb(title: string): string {
  const words = title.split(/\s+/).slice(0, 3).join(" ").toUpperCase();
  return words || "STUDY MATERIAL";
}

function defaultSubtitle() {
  return "An editorial deep-dive generated by Vidya based on your study material.";
}

function HistoryPanel({
  items,
  onOpen,
  onClear,
}: {
  items: WorkspaceHistoryItem[];
  onOpen: (item: WorkspaceHistoryItem) => void;
  onClear: () => void;
}) {
  const totalHours = (items.length * 1.8).toFixed(1);
  const mostStudiedTopic = items[0]?.title || "No sessions yet";
  const groupedItems = groupHistoryByDate(items);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Activity Log</p>
        <h1 className="text-[36px] font-bold tracking-[-0.05em] text-slate-900 sm:text-[52px]">
          Chronological Journey
        </h1>
        <p className="max-w-3xl text-[16px] leading-7 text-slate-500">
          A refined timeline of your intellectual exploration. Revisit past Vidya sessions, saved topics, and recent study work.
        </p>
      </header>

      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            <Clock3 className="h-4 w-4" />
            Timeline
          </div>
          <button type="button" onClick={onClear} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-900">
            <RotateCcw className="h-4 w-4" />
            Clear history
          </button>
        </div>

        <div className="mt-8 space-y-8">
          {groupedItems.length > 0 ? groupedItems.map((group) => (
            <div key={group.label} className="grid gap-4 md:grid-cols-[120px_minmax(0,1fr)]">
              <div className="pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {group.label}
                </p>
              </div>
              <div className="space-y-4 border-l border-slate-100 pl-6">
                {group.items.map((item) => (
                  <div key={item.id} className="relative">
                    <span className="absolute -left-[31px] top-8 h-3 w-3 rounded-full border-4 border-white bg-primary shadow-sm" />
                    <div className="rounded-[24px] border border-slate-200 bg-[#fcfdff] p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                              <span>{capitalize(item.mode)}</span>
                              <span>{formatTimeOnly(item.createdAt)}</span>
                              <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold uppercase tracking-[0.08em] text-slate-500">
                                Saved
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button variant="secondary" onClick={() => onOpen(item)} className="rounded-xl px-5">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )) : <EmptyState title="No history yet" description="Generate a summary, explanation, or assignment and it will appear here." />}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <StatsCard
          eyebrow="Total Deep Work"
          title={`${totalHours}h`}
          subtitle="+12% from previous month"
          chips={[`${items.length} sessions`, "Tracked locally"]}
        />
        <StatsCard
          eyebrow="Most Studied Topic"
          title={mostStudiedTopic}
          subtitle="Based on your latest Vidya activity"
          chips={[`${items.length} sessions`, "Structured notes", "Assignment practice"]}
        />
      </div>
    </div>
  );
}

function LibraryPanel({
  items,
  onOpen,
  onClear,
}: {
  items: WorkspaceLibraryItem[];
  onOpen: (item: WorkspaceLibraryItem) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Saved Sources</p>
        <h1 className="text-[36px] font-bold tracking-[-0.05em] text-slate-900 sm:text-[52px]">
          Knowledge Library
        </h1>
        <p className="max-w-3xl text-[16px] leading-7 text-slate-500">
          Your persistent study source shelf. Reopen important topics, note dumps, and imported references without re-pasting content.
        </p>
      </header>

      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-8">
        <PanelHeader
          description="Saved sources are tracked per workspace session and updated whenever you revisit the same study material."
          actionLabel="Clear library"
          onAction={onClear}
        />

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {items.length > 0 ? (
            items.map((item) => (
              <div
                key={item.id}
                className="rounded-[24px] border border-slate-200 bg-[#fcfdff] p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-slate-900">{item.title}</p>
                    <p className="text-sm leading-6 text-slate-500">{item.introduction}</p>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    {item.visits} visits
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span>{capitalize(item.lastMode)}</span>
                  <span>{formatDate(item.updatedAt)}</span>
                  <span>{item.language === "hinglish" ? "Hinglish" : "English"}</span>
                </div>

                <div className="mt-5">
                  <Button variant="secondary" onClick={() => onOpen(item)} className="rounded-xl px-5">
                    Open Source
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="No saved sources yet"
              description="Generate content from a topic, document, or imported URL and it will appear here."
            />
          )}
        </div>
      </div>
    </div>
  );
}


function SettingsPanel({
  language,
  onLanguageChange,
  onClearHistory,
  onClearLibrary,
  showRealLifeExamples,
  onShowRealLifeExamplesChange,
  storageStats,
  onClearOldData,
  settingsDraft,
  onUpdateSettings,
  hasUnsavedChanges,
  onDiscardChanges,
  onSaveSettings,
  tier,
}: {
  language: LanguageMode;
  onLanguageChange: (value: LanguageMode) => void;
  onClearHistory: () => void;
  onClearLibrary: () => void;
  showRealLifeExamples: boolean;
  onShowRealLifeExamplesChange: (value: boolean) => void;
  storageStats: { usage: number; quota: number } | null;
  onClearOldData: () => Promise<void>;
  settingsDraft: {
    fullName: string;
    email: string;
    focusArea: string;
  };
  onUpdateSettings: (
    field: "fullName" | "email" | "focusArea",
    value: string
  ) => void;
  hasUnsavedChanges: boolean;
  onDiscardChanges: () => void;
  onSaveSettings: () => void;
  tier: UserTier;
}) {
  return (
    <div className="space-y-6 pb-16">
      <header className="space-y-2">
        <h1 className="text-[30px] font-bold tracking-[-0.05em] text-slate-900 sm:text-[44px]">
          Workspace Settings
        </h1>
        <p className="max-w-3xl text-[15px] leading-6 text-slate-500">
          Customize your Vidya workspace. Manage your study identity, visual preferences, and saved workspace behavior.
        </p>
      </header>

      <div className="space-y-8">
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              Update your workspace identity and basic contact information.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <UserCircle2 className="h-8 w-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-semibold text-slate-900">{settingsDraft.fullName}</p>
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <p className="text-[13px] text-slate-500">Vidya Workspace Member</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Full Name</span>
                <input
                  value={settingsDraft.fullName}
                  onChange={(event) => onUpdateSettings("fullName", event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-3 text-[14px] text-slate-700 outline-none transition focus:border-primary"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Email Address</span>
                <input
                  value={settingsDraft.email}
                  onChange={(event) => onUpdateSettings("email", event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-3 text-[14px] text-slate-700 outline-none transition focus:border-primary"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Focus Area</span>
                <Textarea
                  value={settingsDraft.focusArea}
                  onChange={(event) => onUpdateSettings("focusArea", event.target.value)}
                  className="mt-1.5 min-h-[90px] rounded-xl border-slate-200 bg-[#f8fafc] px-3 text-[14px]"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Preferences</h2>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              Customize your learning experience and study output settings.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <div className="rounded-2xl bg-[#f8fafc] p-4">
              <h3 className="text-lg font-semibold text-slate-900">Study Output Language</h3>
              <div className="mt-4 flex gap-3">
                <Button 
                  variant={language === "english" ? "primary" : "secondary"} 
                  onClick={() => onLanguageChange("english")}
                >
                  English
                </Button>
                <div className="relative">
                  <Button 
                    variant={language === "hinglish" ? "primary" : "secondary"} 
                    onClick={() => {
                      if (!canAccessTool(tier, "canUseHinglish")) return;
                      onLanguageChange("hinglish");
                    }}
                    className={!canAccessTool(tier, "canUseHinglish") ? "opacity-60" : ""}
                  >
                    Hinglish
                  </Button>
                  {!canAccessTool(tier, "canUseHinglish") && (
                    <div className="absolute -right-2 -top-2 rounded-full bg-white p-1 shadow-sm border border-slate-100">
                      <Lock className="h-2.5 w-2.5 text-slate-400" />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between rounded-[20px] border border-slate-200 bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Show real-life examples</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Display India-rooted everyday analogies in summary and explain outputs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onShowRealLifeExamplesChange(!showRealLifeExamples)}
                  aria-pressed={showRealLifeExamples}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                    showRealLifeExamples ? "bg-primary" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                      showRealLifeExamples ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Workspace Data</h2>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              Clean up locally stored activity when you want a fresh start.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <div className="mb-4 rounded-[16px] bg-[#f8fafc] px-4 py-3">
              <p className="text-[13px] font-semibold text-slate-900">Offline storage</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {storageStats
                  ? `${formatMegabytes(storageStats.usage)} MB used of ${formatMegabytes(storageStats.quota)} MB available on this device.`
                  : "Storage availability will appear here when the browser exposes it."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={onClearHistory}>Clear history</Button>
              <Button variant="secondary" onClick={onClearLibrary}>Clear library</Button>
              <Button variant="secondary" onClick={() => void onClearOldData()}>Clear old data</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-8 z-20 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_20px_50px_rgba(15,23,42,0.14)]">
        <Button variant="secondary" onClick={onDiscardChanges} disabled={!hasUnsavedChanges}>
          Discard Changes
        </Button>
        <Button onClick={onSaveSettings} disabled={!hasUnsavedChanges}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}

function SupportPanel({
  onNewSession,
  onOpenSettings,
}: {
  onNewSession: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <SectionBlock eyebrow="Workspace" title="Help">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[24px] bg-[#f8fafc] p-5">
          <h3 className="text-lg font-semibold text-slate-900">Quick Help</h3>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li>Use History to reopen recent sessions and Library to revisit saved topics.</li>
            <li>Practice mode supports answer submission with AI-based feedback and scoring.</li>
            <li>Settings lets you switch between English and Hinglish anytime.</li>
          </ul>
        </div>
        <div className="rounded-[24px] bg-[#f8fafc] p-5">
          <h3 className="text-lg font-semibold text-slate-900">Actions</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Use these shortcuts if the workspace feels stuck or you want to start clean.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={onNewSession}>Start new session</Button>
            <Button variant="secondary" onClick={onOpenSettings}>Open settings</Button>
          </div>
        </div>
      </div>
    </SectionBlock>
  );
}

function PanelHeader({
  description,
  actionLabel,
  onAction,
}: {
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm leading-6 text-slate-500">{description}</p>
      <button type="button" onClick={onAction} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900">
        <RotateCcw className="h-4 w-4" />
        {actionLabel}
      </button>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-slate-200 bg-[#f8fafc] p-8 text-center">
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimeOnly(value: string) {
  const date = new Date(value);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatMegabytes(value: number) {
  return (value / (1024 * 1024)).toFixed(1);
}

function groupHistoryByDate(items: WorkspaceHistoryItem[]) {
  const groups = new Map<string, WorkspaceHistoryItem[]>();

  items.forEach((item) => {
    const date = new Date(item.createdAt);
    const today = new Date();
    const sameDay =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    const label = sameDay
      ? "Today"
      : isYesterday
        ? "Yesterday"
        : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }).toUpperCase();

    groups.set(label, [...(groups.get(label) ?? []), item]);
  });

  return Array.from(groups.entries()).map(([label, groupedItems]) => ({
    label,
    items: groupedItems,
  }));
}

function StatsCard({
  eyebrow,
  title,
  subtitle,
  chips,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  chips: string[];
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
      <h3 className="mt-3 text-[34px] font-bold tracking-[-0.04em] text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <span key={chip} className="rounded-full bg-[#f8fafc] px-3 py-1.5 text-xs font-medium text-slate-500">
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}
function ProfilePanel({ 
  user, 
  onOpenSettings 
}: { 
  user: any; 
  onOpenSettings: () => void;
}) {
  const email = user?.email || "Guest User";
  const fullName = user?.user_metadata?.full_name || email.split('@')[0];
  const provider = user?.app_metadata?.provider || (user ? "Email" : "None");
  const isPro = !!user; // For now assuming logged in users are Pro in this view

  const handleSignOut = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <SectionBlock eyebrow="Personal Account" title="User Profile">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="flex flex-col items-center rounded-2xl border border-line bg-white p-6 text-center shadow-sm">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-400 text-2xl font-bold text-white shadow-lg">
              {fullName.charAt(0).toUpperCase()}
            </div>
            <h3 className="mt-4 text-lg font-bold text-ink">{fullName}</h3>
            <p className="mt-1 text-[13px] text-muted">{email}</p>
            <div className={`mt-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${isPro ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-400"}`}>
              {isPro ? "Pro Tier" : "Guest Mode"}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-ink mb-5">Account Information</h3>
            <div className="space-y-4 text-sm">
              <ProfileItem label="Email" value={email} />
              <ProfileItem label="Full Name" value={fullName} />
              <ProfileItem label="Account Type" value={isPro ? "Premium Subscription" : "Guest (Limited Features)"} />
              <ProfileItem label="Auth Provider" value={capitalize(provider)} />
              <ProfileItem label="Member Since" value={user?.created_at ? formatDate(user.created_at) : "N/A"} />
            </div>
            <div className="mt-8 pt-5 border-t border-line flex flex-wrap gap-3">
              <Button onClick={onOpenSettings} variant="secondary" className="rounded-xl px-5 text-[13px]">
                Edit Settings
              </Button>
              {user && (
                <button
                  onClick={handleSignOut}
                  className="rounded-xl border border-red-200 bg-red-50 px-5 py-2 text-[13px] font-bold text-red-600 transition hover:bg-red-100"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>

          {!user && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
              <h3 className="text-lg font-bold text-primary mb-2">Sync your sessions</h3>
              <p className="text-sm text-ink/70 leading-6">
                You are currently in guest mode. Your study history and flashcards are only saved on this device. Create an account to access your sanctuary from anywhere.
              </p>
              <div className="mt-6">
                <Link href="/signup">
                  <Button className="rounded-2xl shadow-lg shadow-primary/20">Sign Up Now</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </SectionBlock>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-line/50 last:border-0">
      <span className="text-sm font-medium text-muted">{label}</span>
      <span className="text-sm font-semibold text-ink">{value}</span>
    </div>
  );
}
