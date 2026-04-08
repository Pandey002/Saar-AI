"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { FormulaBlock } from "@/components/feature/results/FormulaBlock";
import { SectionBlock } from "@/components/feature/results/SectionBlock";
import type { SolveResult } from "@/types";

interface SolveOutputProps {
  data: SolveResult;
}

export function SolveOutput({ data }: SolveOutputProps) {
  return (
    <div className="space-y-8">
      <SectionBlock id="solve" eyebrow="Problem Breakdown" title="What the question is asking">
        <p className="text-[15px] leading-7 text-slate-700">{data.problemRestatement}</p>
      </SectionBlock>

      <SectionBlock title="Given Values">
        <div className="flex flex-wrap gap-3">
          {data.given.length > 0 ? (
            data.given.map((item) => (
              <span
                key={item}
                className="rounded-full border border-slate-200 bg-[#f8fafc] px-4 py-2 text-sm font-medium text-slate-700"
              >
                {item}
              </span>
            ))
          ) : (
            <p className="text-sm text-slate-500">No explicit given values were extracted.</p>
          )}
        </div>
      </SectionBlock>

      {data.formulaUsed ? (
        <FormulaBlock
          data={{
            expression: data.formulaUsed,
            caption: "Main formula or concept applied in this solution.",
            variables: [],
          }}
        />
      ) : null}

      <SectionBlock title="Step-by-Step Solution">
        <div className="space-y-4">
          {data.steps.map((step) => (
            <article
              key={`${step.stepNumber}-${step.action}-${step.result}`}
              className="rounded-[24px] border border-slate-200 bg-[#fcfdff] p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {step.stepNumber}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-semibold tracking-[-0.03em] text-slate-900">
                    {step.action}
                  </p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-[20px] bg-slate-50 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Working
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {step.working}
                      </p>
                    </div>
                    <div className="rounded-[20px] bg-blue-50/60 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                        Result
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{step.result}</p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock title="Final Answer" className="border-emerald-200 bg-[linear-gradient(180deg,#ecfdf5,#f7fff9)]">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-1 h-6 w-6 text-emerald-600" />
          <p className="text-[18px] font-semibold leading-8 text-emerald-800">{data.finalAnswer}</p>
        </div>
      </SectionBlock>

      <SectionBlock title="Common Mistakes" className="border-amber-200 bg-[linear-gradient(180deg,#fffaf0,#fff)]">
        {data.commonMistakes.length > 0 ? (
          <ul className="space-y-3">
            {data.commonMistakes.map((mistake) => (
              <li key={mistake} className="flex gap-3 text-[14px] leading-6 text-slate-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                <span>{mistake}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No common mistakes were highlighted for this problem.</p>
        )}
      </SectionBlock>
    </div>
  );
}
