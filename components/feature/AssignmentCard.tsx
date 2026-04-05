import { Card } from "@/components/ui/Card";
import type { AssignmentResult } from "@/types";

interface AssignmentCardProps {
  data: AssignmentResult;
}

export function AssignmentCard({ data }: AssignmentCardProps) {
  return (
    <Card className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Practice Questions</p>
          <h3 className="mt-2 text-xl font-semibold text-ink">Assignment pack with model answers.</h3>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-success">Ready to review</span>
      </div>

      <div className="rounded-xl border border-line bg-accent p-4 text-sm leading-6 text-slate-700">
        {data.instructions}
      </div>

      <div className="grid gap-4">
        {data.questions.map((item, index) => (
          <div key={item.question} className="rounded-xl border border-line bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Question {index + 1}</p>
            <p className="mt-3 text-base font-semibold text-ink">{item.question}</p>
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">{item.answer}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
