"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, PlusCircle, Sparkles, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MathText } from "@/components/feature/results/MathText";
import { PointBullet } from "@/components/feature/results/CitationUI";
import type { ExamQuestion } from "@/types";
import type { SourceItem } from "@/lib/utils/citations";

interface ExamQuestionsSectionProps {
  questions: ExamQuestion[];
  sources?: SourceItem[];
  onAddToAssignment: (question: ExamQuestion) => void;
  onSolve: (question: ExamQuestion) => void;
}

export function ExamQuestionsSection({
  questions,
  sources,
  onAddToAssignment,
  onSolve,
}: ExamQuestionsSectionProps) {
  if (!questions || questions.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 space-y-6 pt-12 border-t border-slate-100">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-serif text-[34px] tracking-[-0.04em] text-slate-950">
            Questions an examiner would ask
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Based on the topic significance and typical Indian exam patterns.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {questions.map((question, index) => (
          <ExamQuestionCard
            key={`${index}`}
            question={question}
            index={index}
            sources={sources}
            onAddToAssignment={() => onAddToAssignment(question)}
            onSolve={() => onSolve(question)}
          />
        ))}
      </div>
    </section>
  );
}

function ExamQuestionCard({
  question,
  index,
  sources,
  onAddToAssignment,
  onSolve,
}: {
  question: ExamQuestion;
  index: number;
  sources?: SourceItem[];
  onAddToAssignment: () => void;
  onSolve: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`group overflow-hidden rounded-[28px] border transition-all duration-300 ${
        isExpanded
          ? "border-primary/20 bg-white shadow-[0_20px_50px_rgba(37,99,235,0.08)]"
          : "border-slate-200 bg-[#fbfdff] hover:border-slate-300 hover:bg-white hover:shadow-[0_12px_30px_rgba(15,23,42,0.04)]"
      }`}
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-start justify-between p-5 text-left"
      >
        <div className="flex flex-1 items-start gap-4">
          <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            Q{index + 1}
          </div>
          <div className="space-y-3">
            <h3 className="text-[17px] font-semibold leading-relaxed text-slate-900">
              <PointBullet 
                text={question.question} 
                sources={sources} 
                referenceId={`exam-q-${index}`}
                variant="inline"
              />
            </h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant={question.difficulty}>{question.difficulty}</Badge>
              <Badge variant="type">{question.type}</Badge>
              <Badge variant="relevance">{question.relevance}</Badge>
            </div>
          </div>
        </div>
        <div className="ml-4 mt-1">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          {question.options && question.options.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {question.options.map((option) => {
                const isAnswer = typeof question.answer === 'string' 
                  ? option.label === question.answer 
                  : option.label === question.answer.text;

                return (
                  <div
                    key={option.label}
                    className={`flex items-start gap-3 rounded-2xl border bg-white p-4 ${
                      isAnswer
                        ? "border-emerald-200 bg-emerald-50/30"
                        : "border-slate-200"
                    }`}
                  >
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      isAnswer ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
                    }`}>
                      {option.label}
                    </span>
                    <span className="text-[15px] leading-relaxed text-slate-700">
                      <MathText text={option.text} />
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Suggested Answer</p>
            <div className="mt-3 text-[15px] leading-relaxed text-slate-800">
              <PointBullet 
                text={question.answer} 
                sources={sources} 
                referenceId={`exam-ans-${index}`}
                variant="inline"
                prefix={question.type === "MCQ" ? "Correct Option: " : undefined}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onAddToAssignment();
              }}
              variant="secondary"
              className="gap-2 rounded-2xl bg-white shadow-sm border-slate-200 hover:bg-slate-50"
            >
              <PlusCircle className="h-4 w-4" />
              Add to Assignment
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onSolve();
              }}
              className="gap-2 rounded-2xl"
            >
              <MessageSquare className="h-4 w-4" />
              Solve this with AI
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ children, variant }: { children: string; variant: string }) {
  const styles: Record<string, string> = {
    easy: "bg-emerald-50 text-emerald-700 border-emerald-100",
    medium: "bg-amber-50 text-amber-700 border-amber-100",
    hard: "bg-rose-50 text-rose-700 border-rose-100",
    type: "bg-slate-100 text-slate-600 border-slate-200",
    relevance: "bg-blue-50 text-blue-700 border-blue-100",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
        styles[variant] || styles.type
      }`}
    >
      {children}
    </span>
  );
}
