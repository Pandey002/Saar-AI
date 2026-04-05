"use client";

import { Sparkles } from "lucide-react";
import { ConceptCard } from "@/components/feature/results/ConceptCard";
import { FollowUpChips } from "@/components/feature/results/FollowUpChips";
import { SectionBlock } from "@/components/feature/results/SectionBlock";
import type { SummaryResult } from "@/types";

interface SummaryResultPageProps {
  data: SummaryResult;
  expanded: boolean;
  onToggleDiagram: () => void;
  onFollowUp: (topic: string) => void;
}

export function SummaryResultPage({
  data,
  expanded,
  onToggleDiagram,
  onFollowUp,
}: SummaryResultPageProps) {
  return (
    <div className="space-y-8">
      <SectionBlock id="summary" eyebrow="Summary Experience" title="Core Concepts">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {data.concepts.map((concept) => (
            <ConceptCard key={`${concept.title}-${concept.explanation}`} title={concept.title} description={concept.explanation} />
          ))}
        </div>
      </SectionBlock>

      <SectionBlock title="Quick Understanding Map" className="bg-[linear-gradient(180deg,#f8fbff,white)]">
        <div className={`rounded-[24px] border border-dashed border-blue-200 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.16),transparent_55%),#edf5ff] p-8 transition-all ${expanded ? "min-h-[320px]" : "min-h-[220px]"}`}>
          <div className="mx-auto max-w-xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary shadow-[0_10px_24px_rgba(59,130,246,0.18)]">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-[22px] font-semibold tracking-[-0.03em] text-slate-900">
              {data.visualBlock?.title || "Visualized Study Diagram"}
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {data.visualBlock?.description}
            </p>
            <button
              type="button"
              onClick={onToggleDiagram}
              className="mt-6 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {expanded ? "Collapse Diagram" : data.visualBlock?.buttonLabel || "Expand Diagram"}
            </button>
          </div>
        </div>
      </SectionBlock>

      <div className="grid gap-6">
        {data.sections.map((section) => (
          <SectionBlock key={section.heading} title={section.heading}>
            {section.paragraph ? (
              <p className="max-w-4xl text-[15px] leading-7 text-slate-600">{section.paragraph}</p>
            ) : null}
            <ul className="mt-4 space-y-3">
              {section.points.map((point) => (
                <li key={point} className="flex gap-3 text-[14px] leading-6 text-slate-700">
                  <span className="mt-2 h-2 w-2 rounded-full bg-primary" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </SectionBlock>
        ))}
      </div>

      <FollowUpChips topics={data.relatedTopics} onSelect={onFollowUp} />
    </div>
  );
}
