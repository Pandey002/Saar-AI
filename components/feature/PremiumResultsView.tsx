"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  GraduationCap,
  HelpCircle,
  Minus,
  PlusCircle,
  Settings,
} from "lucide-react";
import { SectionBlock } from "@/components/feature/results/SectionBlock";
import { TitleHeader } from "@/components/feature/results/TitleHeader";
import { AssignmentResultPage } from "@/components/feature/results/AssignmentResultPage";
import { ExplainResultPage } from "@/components/feature/results/ExplainResultPage";
import { AssignmentSkeleton, ExplainSkeleton, SummarySkeleton } from "@/components/feature/results/ResultSkeletons";
import { SummaryResultPage } from "@/components/feature/results/SummaryResultPage";
import type {
  AssignmentResult,
  ClarificationPrompt,
  ExplanationResult,
  RevisionResult,
  SummaryResult,
} from "@/types";

interface PremiumResultsViewProps {
  sourceText: string;
  summaryData: SummaryResult | null;
  explainData: ExplanationResult | null;
  assignmentData: AssignmentResult | null;
  revisionData: RevisionResult | null;
  activeMode: "summary" | "explain" | "assignment" | "revision";
  isGenerating: boolean;
  error?: string;
  clarification: ClarificationPrompt | null;
  onClarificationSelect: (option: string) => void;
  onModeSelect: (mode: "summary" | "explain" | "assignment" | "revision") => void;
  onNewSession: () => void;
}

export function PremiumResultsView({
  sourceText,
  summaryData,
  explainData,
  assignmentData,
  revisionData,
  activeMode,
  isGenerating,
  error,
  clarification,
  onClarificationSelect,
  onModeSelect,
  onNewSession,
}: PremiumResultsViewProps) {
  const [diagramExpanded, setDiagramExpanded] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  const title = useMemo(() => {
    if (activeMode === "summary") return summaryData?.title || deriveTitle(sourceText);
    if (activeMode === "explain") return explainData?.title || deriveTitle(sourceText);
    if (activeMode === "assignment") return assignmentData?.title || deriveTitle(sourceText);
    return deriveTitle(sourceText);
  }, [activeMode, assignmentData?.title, explainData?.title, sourceText, summaryData?.title]);

  const subtitle = useMemo(() => {
    if (activeMode === "summary") return summaryData?.introduction || defaultSubtitle();
    if (activeMode === "explain") return explainData?.introduction || defaultSubtitle();
    if (activeMode === "assignment") return assignmentData?.introduction || defaultSubtitle();
    return defaultSubtitle();
  }, [activeMode, assignmentData?.introduction, explainData?.introduction, summaryData?.introduction]);

  const breadcrumb = deriveBreadcrumb(title);

  return (
    <div className="flex min-h-screen w-full bg-[#f6f8fc] font-sans text-ink">
      <aside className="sticky top-0 flex h-screen w-[250px] shrink-0 flex-col border-r border-slate-200 bg-[#f8fafc]">
        <div className="px-6 pb-2 pt-5">
          <Link href="/" className="text-lg font-bold tracking-tight text-primary">
            Saar AI
          </Link>
          <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {breadcrumb}
          </div>
        </div>

        <div className="px-4 pb-4 pt-3">
          <button
            type="button"
            onClick={onNewSession}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-[13px] font-semibold text-white shadow-[0_18px_40px_rgba(37,99,235,0.24)] transition hover:bg-blue-700"
          >
            <PlusCircle className="h-4 w-4" />
            New Session
          </button>
        </div>

        <nav className="flex flex-1 flex-col px-3">
          <SidebarLink icon={<Minus className="h-3.5 w-3.5" />} label="Summary" active={activeMode === "summary"} onClick={() => onModeSelect("summary")} />
          <SidebarLink icon={<GraduationCap className="h-3.5 w-3.5" />} label="Explain" active={activeMode === "explain"} onClick={() => onModeSelect("explain")} />
          <SidebarLink icon={<FileText className="h-3.5 w-3.5" />} label="Assignment" active={activeMode === "assignment"} onClick={() => onModeSelect("assignment")} />
          <div className="my-5 h-px bg-slate-200" />
          <SidebarLink icon={<Settings className="h-3.5 w-3.5" />} label="Settings" />
          <SidebarLink icon={<HelpCircle className="h-3.5 w-3.5" />} label="Support" />
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/85 px-8 py-3 backdrop-blur-md">
          <nav className="flex items-center gap-6 text-[13px] font-medium">
            <a href="/dashboard" className="text-primary underline underline-offset-4 decoration-2">Dashboard</a>
            <a href="#" className="text-slate-400 hover:text-slate-700">History</a>
            <a href="#" className="text-slate-400 hover:text-slate-700">Library</a>
          </nav>
          <button type="button" className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100">
            <Settings className="h-4 w-4" />
          </button>
        </div>

        <div className="mx-auto max-w-6xl px-8 py-10 lg:px-12">
          <TitleHeader eyebrow={breadcrumb} title={title} subtitle={subtitle} />

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
                    className="rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-primary hover:text-primary"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <div className="mt-10">
            {activeMode === "summary" ? (
              isGenerating && !summaryData ? (
                <SummarySkeleton />
              ) : summaryData ? (
                <SummaryResultPage
                  data={summaryData}
                  expanded={diagramExpanded}
                  onToggleDiagram={() => setDiagramExpanded((value) => !value)}
                  onFollowUp={onClarificationSelect}
                />
              ) : null
            ) : null}

            {activeMode === "explain" ? (
              isGenerating && !explainData ? (
                <ExplainSkeleton />
              ) : explainData ? (
                <ExplainResultPage data={explainData} onFollowUp={onClarificationSelect} />
              ) : null
            ) : null}

            {activeMode === "assignment" ? (
              isGenerating && !assignmentData ? (
                <AssignmentSkeleton />
              ) : assignmentData ? (
                <AssignmentResultPage
                  data={assignmentData}
                  selectedAnswers={selectedAnswers}
                  onSelectAnswer={(key, value) => setSelectedAnswers((previous) => ({ ...previous, [key]: value }))}
                  onFollowUp={onClarificationSelect}
                />
              ) : null
            ) : null}

            {activeMode === "revision" && revisionData ? (
              <RevisionFallback data={revisionData} />
            ) : null}
          </div>
        </div>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-8 py-5 sm:flex-row lg:px-12">
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

function RevisionFallback({ data }: { data: RevisionResult }) {
  return (
    <SectionBlock title="Revision Mode" eyebrow="Quick Recall">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[24px] bg-[#f8fafc] p-5">
          <h3 className="text-[16px] font-semibold text-slate-900">Key Concepts</h3>
          <ul className="mt-4 space-y-2">
            {data.keyConcepts.map((item) => (
              <li key={`${item.term}-${item.definition}`} className="text-sm leading-6 text-slate-600">
                <strong className="text-slate-900">{item.term}:</strong> {item.definition}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[24px] bg-[#f8fafc] p-5">
          <h3 className="text-[16px] font-semibold text-slate-900">Short Questions</h3>
          <div className="mt-4 space-y-4">
            {data.shortQuestions.map((item) => (
              <div key={`${item.question}-${item.answer}`}>
                <p className="text-sm font-semibold text-slate-900">{item.question}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{item.answer}</p>
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
