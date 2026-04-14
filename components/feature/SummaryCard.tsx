import { Card } from "@/components/ui/Card";
import type { SummaryResult } from "@/types";

interface SummaryCardProps {
  data: SummaryResult;
}

export function SummaryCard({ data }: SummaryCardProps) {
  return (
    <Card className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Executive Summary</p>
          <h3 className="mt-2 text-xl font-semibold text-ink">{data.title}</h3>
        </div>
        <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">Generated</span>
      </div>

      <section className="space-y-3">
        <p className="text-sm leading-7 text-slate-600">{data.introduction}</p>
      </section>

      <section className="space-y-3">
        {data.coreConcepts.map((point, index) => {
          const pointText = typeof point === "string" ? point : point.text;
          return (
            <div key={index} className="rounded-xl bg-accent px-4 py-3 text-sm leading-6 text-slate-700">
              {pointText}
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {data.sections.slice(0, 2).map((section) => (
          <div key={section.heading} className="rounded-xl border border-line bg-white p-4">
            <p className="text-sm font-semibold text-ink">{section.heading}</p>
            {section.paragraph ? <p className="mt-3 text-sm leading-6 text-slate-600">{section.paragraph}</p> : null}
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {section.points.map((point, index) => {
                const pointText = typeof point === "string" ? point : point.text;
                return (
                  <li key={index} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{pointText}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>
    </Card>
  );
}
