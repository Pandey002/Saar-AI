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
} from "lucide-react";
import { AdhyapakPanel } from "@/components/feature/tutor/AdhyapakPanel";
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
import { withClientSessionHeaders } from "@/lib/clientSession";
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
  PerformanceTopicInsight,
  RevisionResult,
  StudyMode,
  SolveResult,
  SummaryResult,
  WeakAreaRevisionPack,
  WorkspaceHistoryItem,
  WorkspaceLibraryItem,
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
  workspacePanel: "dashboard" | "history" | "library" | "flashcards" | "studyPlan" | "settings" | "support" | "tutor";
  onWorkspacePanelChange: (panel: "dashboard" | "history" | "library" | "flashcards" | "studyPlan" | "settings" | "support" | "tutor") => void;
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
  onFlashcardsRefresh: () => Promise<void>;
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
  onAddQuestionToAssignment,
  onSolveQuestion,
  embeddedDashboard = false,
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
    email: "guest@saar.ai",
    focusArea: "Structured study and exam preparation",
    appearance: "light" as "light" | "night",
  });
  const [settingsDraft, setSettingsDraft] = useState(savedSettings);

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
    if (activeMode === "solve") return deriveTitle(sourceText);
    return deriveTitle(sourceText);
  }, [activeMode, assignmentData?.title, explainData?.title, mockTestData?.title, sourceText, summaryData?.title]);

  const subtitle = useMemo(() => {
    if (activeMode === "summary") return summaryData?.introduction || defaultSubtitle();
    if (activeMode === "explain") return explainData?.introduction || defaultSubtitle();
    if (activeMode === "assignment") return assignmentData?.introduction || defaultSubtitle();
    if (activeMode === "mocktest") return mockTestData?.introduction || "A timed, exam-style mock paper generated from your topic or notes.";
    if (activeMode === "solve") return "A worked solution generated step by step from your problem statement.";
    return defaultSubtitle();
  }, [activeMode, assignmentData?.introduction, explainData?.introduction, mockTestData?.introduction, summaryData?.introduction]);

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
      const result = (await response.json()) as { data?: { cards?: unknown[] }; error?: string };

      if (!response.ok || !result.data) {
        throw new Error(result.error || "Unable to save flashcards.");
      }

      setFlashcardMessage(`${result.data.cards?.length ?? 0} cards saved to your library.`);
      await onFlashcardsRefresh();
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

      setAssignmentEvaluation(payload.data);
      persistQuizResult(payload.data);
      await onRefreshPerformanceInsights();
      window.dispatchEvent(new CustomEvent("saar-performance-updated"));
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
      window.dispatchEvent(new CustomEvent("saar-performance-updated"));
    }
  }

  if (embeddedDashboard) {
    return (
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
    );
  }

  return (
    <div className="results-shell flex min-h-screen w-full bg-canvas font-sans text-ink">
      <aside className="results-shell-sidebar sticky top-0 flex h-screen w-[260px] shrink-0 flex-col border-r border-line bg-surface shadow-sm">
        <div className="px-6 pb-2 pt-6">
          <Link href="/" className="brand-link font-serif text-[24px] font-extrabold tracking-tight text-navy">
            Saar AI
          </Link>
          <div className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            {breadcrumb}
          </div>
        </div>

        <div className="px-4 pb-4 pt-3">
          <button
            type="button"
            onClick={onNewSession}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3 text-[13px] font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98]"
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
                  className={`flex w-full items-start gap-3 border-l-4 py-4 pr-4 pl-3 transition ${
                    isActive
                      ? "border-primary bg-primary/10 text-navy"
                      : "border-transparent text-slate-500 hover:bg-black/5 hover:text-navy"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition ${
                      isActive ? "bg-primary/10 text-primary" : "bg-slate-100/80 text-slate-400"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-[15px] font-bold tracking-tight ${isActive ? "text-navy" : "text-slate-900"}`}>{item.label}</span>
                    <span className={`mt-0.5 block text-xs leading-5 ${isActive ? "text-slate-600" : "text-slate-400"}`}>{item.description}</span>
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
            <SidebarLink icon={<BookMarked className="h-3.5 w-3.5" />} label="Library" active={workspacePanel === "library"} onClick={() => onWorkspacePanelChange("library")} />
            <SidebarLink icon={<CalendarDays className="h-3.5 w-3.5" />} label="Study Plan" active={workspacePanel === "studyPlan"} onClick={() => onWorkspacePanelChange("studyPlan")} />
            <SidebarLink icon={<Settings className="h-3.5 w-3.5" />} label="Settings" active={workspacePanel === "settings"} onClick={() => onWorkspacePanelChange("settings")} />
            <SidebarLink icon={<HelpCircle className="h-3.5 w-3.5" />} label="Support" active={workspacePanel === "support"} onClick={() => onWorkspacePanelChange("support")} />
          </div>
        </div>
      </aside>

      <main className="results-shell-main flex-1 overflow-y-auto bg-canvas">
        <div className="results-shell-topbar sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface/95 px-8 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="hidden flex-wrap items-center gap-2 xl:flex">
              {workspaceToolButtons.map((item) => {
                const isActive = workspacePanel === item.id;
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "primary" : "secondary"}
                    onClick={() => onWorkspacePanelChange(item.id)}
                    className="gap-2 rounded-full px-4 py-2"
                  >
                    {item.icon}
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-slate-400 lg:flex">
              <Search className="h-4 w-4" />
              <span className="min-w-[220px] text-left text-sm">Search workspace...</span>
            </div>
            <div className="flex items-center gap-2 xl:hidden">
              {workspaceToolButtons.map((item) => {
                const isActive = workspacePanel === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onWorkspacePanelChange(item.id)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
                      isActive
                        ? "border-primary bg-primary text-white"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                    }`}
                    aria-label={item.label}
                    title={item.label}
                  >
                    {item.icon}
                  </button>
                );
              })}
            </div>
            <button type="button" className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100">
              <Bell className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => onWorkspacePanelChange("settings")} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100">
              <Settings className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onWorkspacePanelChange("support")}
              className="hidden items-center gap-3 rounded-full bg-slate-100 px-3 py-1.5 transition hover:bg-slate-200 sm:flex"
            >
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-800">Saar AI User</p>
                <p className="text-[11px] text-slate-400">Workspace Profile</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                <UserCircle2 className="h-5 w-5" />
              </div>
            </button>
          </div>
        </div>

        <div className={`results-shell-content w-full px-6 lg:px-8 xl:px-10 ${workspacePanel === "dashboard" && activeMode === "summary" ? "pb-10 pt-6" : "py-10"}`}>
          {workspacePanel === "dashboard" && activeMode !== "summary" ? (
            <TitleHeader
              eyebrow={activeMode === "assignment" ? "" : breadcrumb}
              title={title}
              subtitle={subtitle}
            />
          ) : null}

          {workspacePanel === "dashboard" && activeStudyPath ? (
            <section className="mt-6 rounded-[28px] border border-blue-200 bg-[linear-gradient(135deg,#eff6ff_0%,#f8fbff_100%)] p-5">
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
                onUpdateSettings={(field, value) =>
                  setSettingsDraft((previous) => ({ ...previous, [field]: value }))
                }
                hasUnsavedChanges={JSON.stringify(savedSettings) !== JSON.stringify(settingsDraft)}
                onDiscardChanges={() => setSettingsDraft(savedSettings)}
                onSaveSettings={() => setSavedSettings(settingsDraft)}
              />
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
                />
              ) : null
            ) : null}

            {workspacePanel === "dashboard" && activeMode === "explain" ? (
              isGenerating && !explainData ? (
                <ExplainSkeleton />
              ) : explainData ? (
                <ExplainResultPage
                  data={explainData}
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
              ) : null
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
              © 2024 Saar AI Editorial. Soft-minimal ISM.
            </p>
            <div className="flex gap-6 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-300">
              <span>Privacy</span>
              <span>Terms</span>
              <span>Methodology</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
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
      className={`mt-1 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-medium transition ${
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
  return "An editorial deep-dive generated by Saar AI based on your study material.";
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
          A refined timeline of your intellectual exploration. Revisit past Saar AI sessions, saved topics, and recent study work.
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
          subtitle="Based on your latest Saar AI activity"
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
    appearance: "light" | "night";
  };
  onUpdateSettings: (
    field: "fullName" | "email" | "focusArea" | "appearance",
    value: string
  ) => void;
  hasUnsavedChanges: boolean;
  onDiscardChanges: () => void;
  onSaveSettings: () => void;
}) {
  return (
    <div className="space-y-8 pb-24">
      <header className="space-y-3">
        <h1 className="text-[36px] font-bold tracking-[-0.05em] text-slate-900 sm:text-[52px]">
          Workspace Settings
        </h1>
        <p className="max-w-3xl text-[16px] leading-7 text-slate-500">
          Customize your Saar AI workspace. Manage your study identity, visual preferences, and saved workspace behavior.
        </p>
      </header>

      <div className="space-y-10">
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Profile</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Update your workspace identity and basic contact information.
            </p>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-[20px] bg-slate-900 text-white">
                <UserCircle2 className="h-10 w-10" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-slate-900">{settingsDraft.fullName}</p>
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm text-slate-500">Saar AI Workspace Member</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Full Name</span>
                <input
                  value={settingsDraft.fullName}
                  onChange={(event) => onUpdateSettings("fullName", event.target.value)}
                  className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 text-sm text-slate-700 outline-none transition focus:border-primary"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Email Address</span>
                <input
                  value={settingsDraft.email}
                  onChange={(event) => onUpdateSettings("email", event.target.value)}
                  className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 text-sm text-slate-700 outline-none transition focus:border-primary"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Focus Area</span>
                <Textarea
                  value={settingsDraft.focusArea}
                  onChange={(event) => onUpdateSettings("focusArea", event.target.value)}
                  className="mt-2 min-h-[110px] rounded-2xl border-slate-200 bg-[#f8fafc]"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Appearance</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Adjust the interface to match your study workflow and reduce visual strain.
            </p>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <div className="grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => onUpdateSettings("appearance", "light")}
                className={`rounded-[24px] border p-4 text-left transition ${
                  settingsDraft.appearance === "light"
                    ? "border-primary shadow-[0_0_0_3px_rgba(37,99,235,0.12)]"
                    : "border-slate-200"
                }`}
              >
                <div className="flex h-32 items-center justify-center rounded-[18px] bg-[#f8fafc]">
                  <SunMedium className="h-8 w-8 text-primary" />
                </div>
                <p className="mt-4 text-lg font-semibold text-slate-900">Light Workspace</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">Bright, airy, and ideal for long reading sessions.</p>
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings("appearance", "night")}
                className={`rounded-[24px] border p-4 text-left transition ${
                  settingsDraft.appearance === "night"
                    ? "border-primary shadow-[0_0_0_3px_rgba(37,99,235,0.12)]"
                    : "border-slate-200"
                }`}
              >
                <div className="flex h-32 items-center justify-center rounded-[18px] bg-slate-900">
                  <Moon className="h-8 w-8 text-white" />
                </div>
                <p className="mt-4 text-lg font-semibold text-slate-900">Night Focus</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">A darker palette concept for low-light revision moods.</p>
              </button>
            </div>

            <div className="mt-6 rounded-[24px] bg-[#f8fafc] p-5">
              <h3 className="text-lg font-semibold text-slate-900">Study Output Language</h3>
              <div className="mt-4 flex gap-3">
                <Button variant={language === "english" ? "primary" : "secondary"} onClick={() => onLanguageChange("english")}>
                  English
                </Button>
                <Button variant={language === "hinglish" ? "primary" : "secondary"} onClick={() => onLanguageChange("hinglish")}>
                  Hinglish
                </Button>
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
            <h2 className="text-xl font-semibold text-slate-900">Workspace Data</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Clean up locally stored activity when you want a fresh start.
            </p>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <div className="mb-5 rounded-[20px] bg-[#f8fafc] px-4 py-4">
              <p className="text-sm font-semibold text-slate-900">Offline storage</p>
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

      <div className="fixed bottom-6 right-8 z-20 flex items-center gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-3 shadow-[0_20px_50px_rgba(15,23,42,0.14)]">
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
    <SectionBlock eyebrow="Workspace" title="Support">
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
