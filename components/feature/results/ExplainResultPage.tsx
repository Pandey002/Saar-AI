"use client";

import { FollowUpChips } from "@/components/feature/results/FollowUpChips";
import { FormulaBlock } from "@/components/feature/results/FormulaBlock";
import { InfoCard } from "@/components/feature/results/InfoCard";
import { SectionBlock } from "@/components/feature/results/SectionBlock";
import { TopicImagePanel } from "@/components/feature/results/TopicImagePanel";
import type { ExplanationResult } from "@/types";

interface ExplainResultPageProps {
  data: ExplanationResult;
  sourceTopic: string;
  onFollowUp: (topic: string) => void;
}

export function ExplainResultPage({ data, sourceTopic, onFollowUp }: ExplainResultPageProps) {
  return (
    <div className="space-y-8">
      <SectionBlock id="explain-visual" eyebrow="Visual Context" title="Topic Reference">
        <TopicImagePanel
          query={sourceTopic || data.title}
          title={data.title}
          subtitle={data.introduction}
          compact
        />
      </SectionBlock>

      {data.analogyCard ? (
        <SectionBlock id="explain" eyebrow="The Teacher's Analogy" title={data.analogyCard.title}>
          <div className="rounded-[24px] border border-blue-100 bg-blue-50/70 p-6">
            <p className="text-[15px] leading-7 text-slate-700">{data.analogyCard.explanation}</p>
            {data.analogyCard.note ? (
              <p className="mt-4 rounded-2xl bg-white/80 px-4 py-3 text-sm leading-6 text-slate-500">
                {data.analogyCard.note}
              </p>
            ) : null}
          </div>
        </SectionBlock>
      ) : null}

      {data.formulaBlock ? <FormulaBlock data={data.formulaBlock} /> : null}

      <SectionBlock title="Theoretical Framework">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {data.frameworkCards.map((card) => (
            <InfoCard key={`${card.title}-${card.description}`} title={card.title} description={card.description} eyebrow={card.eyebrow} />
          ))}
        </div>
      </SectionBlock>

      <SectionBlock title="Step-by-Step Understanding">
        <div className="space-y-4">
          {data.sections.map((section) => (
            <div key={section.heading} className="rounded-[24px] bg-[#f8fafc] p-5">
              <h3 className="text-[18px] font-semibold tracking-[-0.03em] text-slate-900">{section.heading}</h3>
              {section.paragraph ? (
                <p className="mt-3 text-[14px] leading-7 text-slate-600">{section.paragraph}</p>
              ) : null}
              {section.points.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {section.points.map((point) => (
                    <li key={point} className="flex gap-3 text-[14px] leading-6 text-slate-700">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock title="Key Takeaways">
        <div className="flex flex-wrap gap-3">
          {data.keyTakeaways.map((item) => (
            <span key={item} className="rounded-full bg-[#f3f0ff] px-4 py-2 text-sm font-medium text-slate-700">
              {item}
            </span>
          ))}
        </div>
      </SectionBlock>

      <FollowUpChips topics={data.relatedTopics} onSelect={onFollowUp} />
    </div>
  );
}
