"use client";

import { FollowUpChips } from "@/components/feature/results/FollowUpChips";
import { QuestionCard } from "@/components/feature/results/QuestionCard";
import { SectionBlock } from "@/components/feature/results/SectionBlock";
import { SidebarPanel } from "@/components/feature/results/SidebarPanel";
import type { AssignmentResult } from "@/types";

interface AssignmentResultPageProps {
  data: AssignmentResult;
  selectedAnswers: Record<string, string>;
  onSelectAnswer: (key: string, value: string) => void;
  onFollowUp: (topic: string) => void;
}

export function AssignmentResultPage({
  data,
  selectedAnswers,
  onSelectAnswer,
  onFollowUp,
}: AssignmentResultPageProps) {
  return (
    <div className="space-y-8">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          <SectionBlock id="assignment" title="Instructions" eyebrow="Assignment Brief">
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

          {data.sectionGroups.map((group) => (
            <SectionBlock
              key={group.heading}
              title={group.heading}
              eyebrow={`${group.marks} Marks`}
            >
              {group.description ? (
                <p className="text-[14px] leading-6 text-slate-500">{group.description}</p>
              ) : null}
              <div className="mt-5 space-y-4">
                {group.questions.map((question, index) => {
                  const questionKey = `${group.heading}-${index}`;
                  return (
                    <QuestionCard
                      key={questionKey}
                      index={index}
                      question={question}
                      selectedOption={selectedAnswers[questionKey]}
                      onSelectOption={(value) => onSelectAnswer(questionKey, value)}
                    />
                  );
                })}
              </div>
            </SectionBlock>
          ))}
        </div>

        <div className="xl:sticky xl:top-24 xl:h-fit">
          <SidebarPanel
            title="Marking Scheme"
            subtitle="Export-friendly assignment layout with evaluation cues."
            items={data.markingScheme}
            onPrint={() => window.print()}
            onExport={() => window.print()}
          />
        </div>
      </div>

      <FollowUpChips topics={data.relatedTopics} onSelect={onFollowUp} />
    </div>
  );
}
