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
} from "lucide-react";
import { DropdownItem, DropdownMenu } from "@/components/ui/DropdownMenu";
import type { StudyMode } from "@/types";

type WorkspaceFeaturePanel = "history" | "flashcards" | "tutor";

interface FeatureDropdownsProps {
  activeMode: StudyMode;
  activePanel: WorkspaceFeaturePanel | "dashboard";
  onModeChange: (mode: StudyMode) => void;
  onPanelChange: (panel: WorkspaceFeaturePanel) => void;
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
    label: "Socratic Tutor",
    description: "Open Adhyapak for guided learning.",
    icon: <Brain className="h-4 w-4" />,
  },
];

export function FeatureDropdowns({
  activeMode,
  activePanel,
  onModeChange,
  onPanelChange,
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
            className="inline-flex items-center gap-3 rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-left shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_40px_rgba(15,23,42,0.1)]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-primary">
              {activeStudy.icon}
            </span>
            <span className="min-w-[150px]">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Study Modes
              </span>
              <span className="mt-1 block text-sm font-semibold text-slate-900">{activeStudy.label}</span>
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
                setStudyOpen(false);
                onModeChange(item.id);
              }}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                {item.icon}
              </span>
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
            className="inline-flex items-center gap-3 rounded-[20px] border border-emerald-200 bg-[linear-gradient(135deg,#f6fffb_0%,#ffffff_100%)] px-4 py-3 text-left shadow-[0_12px_30px_rgba(16,185,129,0.08)] transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-[0_18px_40px_rgba(16,185,129,0.12)]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              {activeWorkspace.icon}
            </span>
            <span className="min-w-[170px]">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-500">
                Workspace Tools
              </span>
              <span className="mt-1 block text-sm font-semibold text-slate-900">{activeWorkspace.label}</span>
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
                setWorkspaceOpen(false);
                onPanelChange(item.id);
              }}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                {item.icon}
              </span>
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
