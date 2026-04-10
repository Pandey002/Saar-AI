"use client";

import { Button } from "@/components/ui/Button";
import { FollowUpChips } from "@/components/feature/results/FollowUpChips";
import { QuestionCard } from "@/components/feature/results/QuestionCard";
import { SectionBlock } from "@/components/feature/results/SectionBlock";
import { SidebarPanel } from "@/components/feature/results/SidebarPanel";
import type { AssignmentEvaluationResult, AssignmentResult } from "@/types";

interface AssignmentResultPageProps {
  data: AssignmentResult;
  responses: Record<string, string>;
  evaluation: AssignmentEvaluationResult | null;
  isEvaluating: boolean;
  evaluationError?: string;
  onChangeAnswer: (key: string, value: string) => void;
  onSubmitAssignment: () => void;
  onFollowUp: (topic: string) => void;
}

export function AssignmentResultPage({
  data,
  responses,
  evaluation,
  isEvaluating,
  evaluationError,
  onChangeAnswer,
  onSubmitAssignment,
  onFollowUp,
}: AssignmentResultPageProps) {
  return (
    <div className="assignment-result-page space-y-8">
      <div className="assignment-result-layout grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="assignment-result-main space-y-6">
          <SectionBlock id="assignment" title="Practice Instructions">
            <div className="rounded-[24px] bg-[#f8fafc] p-5">
              <p className="text-[15px] leading-7 text-slate-600">{data.instructions}</p>
              {data.instructionList.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {data.instructionList.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </SectionBlock>

          {data.sectionGroups.map((group, groupIndex) => (
            <SectionBlock
              key={group.heading}
              title={group.heading}
            >
              {group.description ? (
                <p className="text-[14px] leading-6 text-slate-500">{group.description}</p>
              ) : null}
              <div className="mt-5 space-y-4">
                {group.questions.map((question, index) => {
                  const questionKey = `${groupIndex}-${index}`;
                  const feedback = evaluation?.results.find((item) => item.questionKey === questionKey);
                  return (
                    <QuestionCard
                      key={questionKey}
                      index={index}
                      question={question}
                      response={responses[questionKey]}
                      feedback={feedback}
                      disabled={isEvaluating}
                      onChangeResponse={(value) => onChangeAnswer(questionKey, value)}
                    />
                  );
                })}
              </div>
            </SectionBlock>
          ))}

          <SectionBlock title="Submit Practice" className="assignment-submit-panel">
            <div className="rounded-[24px] bg-[#f8fafc] p-5">
              <p className="text-[15px] leading-7 text-slate-600">
                Submit your answers to get AI evaluation with per-question feedback and scoring.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <Button
                  type="button"
                  onClick={onSubmitAssignment}
                  disabled={isEvaluating}
                  className="rounded-full px-6 py-3"
                >
                  {isEvaluating ? "Checking answers..." : "Submit practice"}
                </Button>
                {evaluation ? (
                  <p className="text-sm font-medium text-slate-700">
                    Score: {evaluation.totalScore}/{evaluation.totalMarks}
                  </p>
                ) : null}
              </div>
              {evaluation ? (
                <p className="mt-4 text-sm leading-7 text-slate-700">{evaluation.summary}</p>
              ) : null}
              {evaluationError ? (
                <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {evaluationError}
                </p>
              ) : null}
            </div>
          </SectionBlock>
        </div>

        <div className="assignment-result-sidebar xl:sticky xl:top-24 xl:h-fit">
          <SidebarPanel
            title="Marking Scheme"
            subtitle="Practice layout with guided evaluation cues."
            items={data.markingScheme}
            onDownloadPdf={() => window.print()}
          />
        </div>
      </div>

      <FollowUpChips topics={data.relatedTopics} onSelect={onFollowUp} />
    </div>
  );
}
