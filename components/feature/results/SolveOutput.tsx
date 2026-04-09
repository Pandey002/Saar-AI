"use client";

import { SectionBlock } from "@/components/feature/results/SectionBlock";
import type { SolveResult } from "@/types";

interface SolveOutputProps {
  data: SolveResult;
}

export function SolveOutput({ data }: SolveOutputProps) {
  return (
    <div className="space-y-8">
      <SectionBlock title="Solve Mode">
        <p className="text-[15px] leading-7 text-slate-700">
          {data.frameworkLabel} for a {data.topicType} question.
        </p>
      </SectionBlock>

      {data.sections.map((section) => (
        <SectionBlock key={`${section.id}-${section.title}`} title={section.title}>
          <p className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
            {section.content}
          </p>
        </SectionBlock>
      ))}
    </div>
  );
}
