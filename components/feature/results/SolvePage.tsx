"use client";

import { useState } from "react";
import { ArrowRight, Layers3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FollowUpChips } from "@/components/feature/results/FollowUpChips";
import { MathText } from "@/components/feature/results/MathText";
import { SolveSection } from "@/components/feature/results/SolveSection";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import type { LanguageMode, SolveDifficulty, SolveResult, TopicType } from "@/types";

interface SolvePageProps {
  data: SolveResult;
  sourceText: string;
  language: LanguageMode;
  onFollowUp: (topic: string) => void;
}

const difficultyColor: Record<SolveDifficulty, string> = {
  easy: "bg-[#EAF3DE] text-[#27500A]",
  medium: "bg-[#FAEEDA] text-[#633806]",
  hard: "bg-[#FCEBEB] text-[#791F1F]",
};

function labelForTopicType(topicType: TopicType) {
  return topicType.charAt(0).toUpperCase() + topicType.slice(1);
}

export function SolvePage({ data, sourceText, language, onFollowUp }: SolvePageProps) {
  const [similarProblem, setSimilarProblem] = useState("");
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
  const [similarError, setSimilarError] = useState("");

  async function handleGenerateSimilar() {
    setIsLoadingSimilar(true);
    setSimilarError("");

    try {
      const response = await fetch("/api/solve/similar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceText,
          topicType: data.topicType,
          difficulty: data.difficulty,
          language,
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.data) {
        throw new Error(payload.error || "Unable to generate a similar problem.");
      }

      setSimilarProblem(payload.data);
    } catch (error) {
      setSimilarError(
        error instanceof Error ? error.message : "Unable to generate a similar problem."
      );
    } finally {
      setIsLoadingSimilar(false);
    }
  }

  return (
    <>
    <LoadingOverlay isVisible={isLoadingSimilar} message="generating a similar problem..." />
    <div className="space-y-8">
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-primary">
            {labelForTopicType(data.topicType)}
          </span>
          <span
            className={`rounded-full px-4 py-2 text-sm font-semibold ${difficultyColor[data.difficulty]}`}
          >
            {data.difficulty}
          </span>
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
            {data.estimatedMarks} marks
          </span>
        </div>

        <div className="mt-5 rounded-[24px] border border-slate-200 bg-[#f8fbff] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary shadow-sm">
              <Layers3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                <MathText text={data.frameworkLabel} />
              </p>
              <p className="text-sm leading-6 text-slate-500">
                Vidya selected a framework that matches this question type instead of forcing a generic math template.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-5">
        {data.sections.map((section) => (
          <SolveSection key={`${section.id}-${section.title}`} section={section} />
        ))}
      </div>

      <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
        <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-slate-900">
          Confidence check
        </h2>
        <p className="mt-4 text-[15px] leading-7 text-slate-700">
          <MathText text={data.confidenceCheck} />
        </p>
      </section>

      <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-slate-900">
              Solve a similar problem
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Generate one more exam-style question at a similar level and solve it next.
            </p>
          </div>
          <Button type="button" onClick={handleGenerateSimilar} disabled={isLoadingSimilar}>
            {isLoadingSimilar ? "Generating..." : "Solve a similar problem"}
          </Button>
        </div>

        {similarError ? (
          <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {similarError}
          </p>
        ) : null}

        {similarProblem ? (
          <div className="mt-5 rounded-[22px] border border-slate-200 bg-[#f8fafc] p-5">
            <p className="text-sm font-semibold text-slate-900">Generated problem</p>
            <p className="mt-3 text-[15px] leading-7 text-slate-700">
              <MathText text={similarProblem} />
            </p>
            <div className="mt-4">
              <Button type="button" variant="secondary" onClick={() => onFollowUp(similarProblem)}>
                Solve this too
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      <FollowUpChips topics={data.relatedTopics} onSelect={onFollowUp} />
    </div>
    </>
  );
}
