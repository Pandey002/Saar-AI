"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";

interface StepRevealProps {
  content: string;
}

function splitSteps(content: string) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return content
      .split(/(?=\d+\.\s)/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return lines;
}

function stripStepPrefix(value: string) {
  return value.replace(/^\d+[\.\)]\s*/, "").trim();
}

export function StepReveal({ content }: StepRevealProps) {
  const steps = useMemo(() => splitSteps(content), [content]);
  const [revealedSteps, setRevealedSteps] = useState(1);

  if (steps.length === 0) {
    return null;
  }

  const visibleSteps = steps.slice(0, revealedSteps);
  const hasMore = revealedSteps < steps.length;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {visibleSteps.map((step, index) => (
          <div
            key={`${step}-${index}`}
            className="flex gap-4 rounded-[22px] border border-slate-200 bg-white p-4"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              {index + 1}
            </div>
            <p className="text-sm leading-7 text-slate-700">{stripStepPrefix(step)}</p>
          </div>
        ))}
      </div>

      {hasMore ? (
        <Button
          type="button"
          variant="secondary"
          onClick={() => setRevealedSteps((current) => Math.min(current + 1, steps.length))}
        >
          I tried it - show next step
        </Button>
      ) : (
        <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Well done! Check your working against this solution.
        </div>
      )}
    </div>
  );
}
