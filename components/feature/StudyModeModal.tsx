"use client";

import { useEffect } from "react";
import { GraduationCap, X, FileText, Sparkles, Target, Sigma, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/Tooltip";
import type { StudyMode } from "@/types";

interface StudyModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: StudyMode;
  onChange: (value: StudyMode) => void;
}

const modes: Array<{ id: StudyMode; title: string; description: string; icon: React.ReactNode }> = [
  {
    id: "summary",
    title: "Summary Mode",
    description: "Get concise, quick overviews of large texts.",
    icon: <Target className="h-5 w-5" />
  },
  {
    id: "explain",
    title: "Explain Mode",
    description: "Deep-dives with analogies and core concepts unlocked.",
    icon: <Sparkles className="h-5 w-5" />
  },
  {
    id: "assignment",
    title: "Practice Mode",
    description: "Untimed guided practice with answer evaluation and feedback.",
    icon: <FileText className="h-5 w-5" />
  },
  {
    id: "mocktest",
    title: "Mock Test Mode",
    description: "Timed exam simulation with scoring, analytics, and review.",
    icon: <Clock3 className="h-5 w-5" />
  },
  {
    id: "solve",
    title: "Solve Mode",
    description: "Step-by-step walkthroughs for Maths, Physics, and Chemistry problems.",
    icon: <Sigma className="h-5 w-5" />
  }
];

export function StudyModeModal({ isOpen, onClose, value, onChange }: StudyModeModalProps) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Modal Window */}
      <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Study Modes</h2>
              <p className="text-xs text-slate-500">Select how Sanctum processes your material.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-3 p-6 sm:grid-cols-2 bg-slate-50">
          {modes.map((mode) => {
            const isActive = value === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => {
                  onChange(mode.id);
                  onClose();
                }}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all",
                  isActive
                    ? "border-primary bg-blue-50/50 shadow-sm ring-1 ring-primary"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                )}
              >
                <div className={cn("rounded-lg p-2 flex items-center justify-center", isActive ? "bg-primary text-white" : "bg-slate-100 text-slate-600")}>
                  {mode.icon}
                </div>
                <h3 className={cn("mt-1 text-sm font-bold", isActive ? "text-primary" : "text-slate-800")}>
                  {mode.title}
                </h3>
                <p className="text-xs leading-5 text-slate-500">
                  {mode.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function StudyModeTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Tooltip content="Study Modes">
      <button 
        type="button" 
        onClick={onClick}
        className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none"
      >
        <GraduationCap className="h-5 w-5" />
      </button>
    </Tooltip>
  );
}
