import { FormulaBlock } from "@/components/feature/results/FormulaBlock";
import { MathText } from "@/components/feature/results/MathText";
import { StepReveal } from "@/components/feature/results/StepReveal";
import type { SolveSection as SolveSectionData } from "@/types";

interface SolveSectionProps {
  section: SolveSectionData;
}

export function SolveSection({ section }: SolveSectionProps) {
  if (!section.content.trim()) {
    return null;
  }

  if (section.type === "steps") {
    return (
      <section className="rounded-[26px] border border-slate-200 bg-[#f8fbff] p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
        <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-slate-900">
          <MathText text={section.title} />
        </h2>
        <div className="mt-4">
          <StepReveal content={section.content} />
        </div>
      </section>
    );
  }

  if (section.type === "formula") {
    return (
      <FormulaBlock
        data={{
          expression: section.content,
          caption: section.title,
          variables: [],
        }}
      />
    );
  }

  if (section.type === "highlight") {
    return (
      <section className="rounded-[26px] border border-blue-200 bg-blue-50/70 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
        <h2 className="border-l-4 border-primary pl-4 text-[22px] font-semibold tracking-[-0.03em] text-slate-900">
          <MathText text={section.title} />
        </h2>
        <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
          <MathText text={section.content} />
        </p>
      </section>
    );
  }

  if (section.type === "warning") {
    return (
      <section className="rounded-[26px] border border-amber-200 bg-amber-50 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
        <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-amber-900">
          <MathText text={section.title} />
        </h2>
        <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
          <MathText text={section.content} />
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
      <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-slate-900">
        <MathText text={section.title} />
      </h2>
      <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
        <MathText text={section.content} />
      </p>
    </section>
  );
}
