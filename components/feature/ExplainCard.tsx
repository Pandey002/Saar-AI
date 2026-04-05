import { Card } from "@/components/ui/Card";
import type { ExplanationResult } from "@/types";

interface ExplainCardProps {
  data: ExplanationResult;
}

export function ExplainCard({ data }: ExplainCardProps) {
  const firstSection = data.sections[0];

  return (
    <Card className="space-y-6">
      <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Concept Explanation</p>
            <h3 className="mt-2 text-2xl font-semibold text-ink">{data.title}</h3>
          </div>
          <p className="text-sm leading-7 text-slate-600">{data.introduction}</p>
        </div>

        <div className="rounded-xl border border-line bg-accent p-5">
          <p className="text-sm font-semibold text-ink">Core Concepts</p>
          <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
            {data.coreConcepts.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {firstSection ? (
        <div className="rounded-xl border border-line bg-white p-5">
          <p className="text-sm font-semibold text-ink">{firstSection.heading}</p>
          {firstSection.paragraph ? (
            <p className="mt-3 text-sm leading-7 text-slate-600">{firstSection.paragraph}</p>
          ) : null}
          <ul className="mt-3 space-y-3 text-sm leading-7 text-slate-600">
            {firstSection.points.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
