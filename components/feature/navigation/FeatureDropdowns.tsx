"use client";

import { useState } from "react";
import {
  Brain,
  ChevronDown,
  Clock3,
  FileText,
  GraduationCap,
  History,
  Sigma,
  Sparkles,
  Lock,
  BarChart3,
} from "lucide-react";
import { DropdownItem, DropdownMenu } from "@/components/ui/DropdownMenu";
import type { StudyMode, UserTier } from "@/types";
import { canAccessMode, canAccessTool } from "@/lib/tiers";

type WorkspaceFeaturePanel = "history" | "flashcards" | "tutor" | "analyzer";

interface FeatureDropdownsProps {
  activeMode: StudyMode;
  activePanel: WorkspaceFeaturePanel | "dashboard";
  onModeChange: (mode: StudyMode) => void;
  onPanelChange: (panel: WorkspaceFeaturePanel) => void;
  tier: UserTier;
  className?: string;
}

const studyItems: Array<{
  id: StudyMode;
  label: string;
  description: string;
  icon: React.ReactNode;
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

const workspaceItems: Array<{
  id: WorkspaceFeaturePanel;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    id: "analyzer",
    label: "Analyze",
    description: "Review progress and weak areas.",
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    id: "history",
    label: "History",
    description: "Reopen past sessions quickly.",
    icon: <History className="h-4 w-4" />,
  },
  {
    id: "flashcards",
    label: "Flashcards",
    description: "Review saved cards and due decks.",
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    id: "tutor",
    label: "Adhyapak",
    description: "Open Adhyapak for guided learning.",
    icon: <Brain className="h-4 w-4" />,
  },
];

export function FeatureDropdowns({
  activeMode,
  activePanel,
  onModeChange,
  onPanelChange,
  tier,
  className = "",
}: FeatureDropdownsProps) {
  const [studyOpen, setStudyOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const activeStudy = studyItems.find((item) => item.id === activeMode) ?? studyItems[0];
  const activeWorkspace =
    workspaceItems.find((item) => item.id === activePanel) ?? {
      label: "Workspace Tools",
      description: "History, flashcards, and tutor tools.",
      icon: <History className="h-4 w-4" />,
    };

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <DropdownMenu
        isOpen={studyOpen}
        onClose={() => setStudyOpen(false)}
        align="left"
        trigger={
          <button
            type="button"
            onClick={() => setStudyOpen((previous) => !previous)}
            className="inline-flex items-center gap-3 rounded-[20px] border border-line/80 bg-surface px-4 py-3 text-left shadow-[0_12px_30px_rgba(16,42,67,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-line hover:shadow-[0_18px_40px_rgba(16,42,67,0.08)]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {activeStudy.icon}
            </span>
            <span className="min-w-[150px] tablet:min-w-0">
              <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 tablet:hidden">
                Study Modes
              </span>
              <span className="mt-1 block text-sm font-bold text-navy tablet:mt-0">{activeStudy.label}</span>
            </span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${studyOpen ? "rotate-180" : ""}`} />
          </button>
        }
      >
        <div className="space-y-1">
          {studyItems.map((item) => (
            <DropdownItem
              key={item.id}
              isActive={activeMode === item.id}
              onClick={() => {
                if (!canAccessMode(tier, item.id)) return;
                setStudyOpen(false);
                onModeChange(item.id);
              }}
              className={!canAccessMode(tier, item.id) ? "opacity-60 grayscale-[0.5]" : ""}
            >
              <div className="relative">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  {item.icon}
                </span>
                {!canAccessMode(tier, item.id) && (
                  <div className="absolute -right-1 -top-1 rounded-full bg-white p-0.5 shadow-sm">
                    <Lock className="h-2.5 w-2.5 text-slate-400" />
                  </div>
                )}
              </div>
              <span>
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className="block text-xs font-medium text-slate-400">{item.description}</span>
              </span>
            </DropdownItem>
          ))}
        </div>
      </DropdownMenu>

      <DropdownMenu
        isOpen={workspaceOpen}
        onClose={() => setWorkspaceOpen(false)}
        align="left"
        trigger={
          <button
            type="button"
            onClick={() => setWorkspaceOpen((previous) => !previous)}
            className="inline-flex items-center gap-3 rounded-[20px] border border-indigo-200/60 bg-[linear-gradient(135deg,#f5f7ff_0%,#F8FAFC_100%)] px-4 py-3 text-left shadow-[0_12px_30px_rgba(79,70,229,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-indigo-300/80 hover:shadow-[0_18px_40px_rgba(79,70,229,0.1)]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              {activeWorkspace.icon}
            </span>
            <span className="min-w-[170px] tablet:min-w-0">
              <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-400 tablet:hidden">
                Workspace Tools
              </span>
              <span className="mt-1 block text-sm font-bold text-navy tablet:mt-0">{activeWorkspace.label}</span>
            </span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${workspaceOpen ? "rotate-180" : ""}`} />
          </button>
        }
      >
        <div className="space-y-1">
          {workspaceItems.map((item) => (
            <DropdownItem
              key={item.id}
              isActive={activePanel === item.id}
              onClick={() => {
                if (item.id === "flashcards" && !canAccessTool(tier, "canUseFlashcards")) return;
                if (item.id === "tutor" && !canAccessTool(tier, "canUseAdhyapak")) return;
                setWorkspaceOpen(false);
                onPanelChange(item.id);
              }}
              className={((item.id === "flashcards" && !canAccessTool(tier, "canUseFlashcards")) || (item.id === "tutor" && !canAccessTool(tier, "canUseAdhyapak"))) ? "opacity-60 grayscale-[0.5]" : ""}
            >
              <div className="relative">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  {item.icon}
                </span>
                {((item.id === "flashcards" && !canAccessTool(tier, "canUseFlashcards")) || (item.id === "tutor" && !canAccessTool(tier, "canUseAdhyapak"))) && (
                  <div className="absolute -right-1 -top-1 rounded-full bg-white p-0.5 shadow-sm">
                    <Lock className="h-2.5 w-2.5 text-slate-400" />
                  </div>
                )}
              </div>
              <span>
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className="block text-xs font-medium text-slate-400">{item.description}</span>
              </span>
            </DropdownItem>
          ))}
        </div>
      </DropdownMenu>
    </div>
  );
}
