"use client";

import { ConceptCard } from "@/components/feature/results/ConceptCard";
import { FollowUpChips } from "@/components/feature/results/FollowUpChips";
import { SectionBlock } from "@/components/feature/results/SectionBlock";
import { TopicImagePanel } from "@/components/feature/results/TopicImagePanel";
import type { SummaryResult } from "@/types";

interface SummaryResultPageProps {
  data: SummaryResult;
  sourceTopic: string;
  onFollowUp: (topic: string) => void;
}

export function SummaryResultPage({
  data,
  sourceTopic,
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
        <TopicImagePanel
          query={sourceTopic || data.title}
          title={data.visualBlock?.title || "Visualized Study Diagram"}
          subtitle={data.visualBlock?.description}
        />
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
