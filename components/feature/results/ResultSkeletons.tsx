"use client";

import { SectionBlock } from "@/components/feature/results/SectionBlock";
import { Skeleton } from "@/components/ui/Skeleton";

export function SummarySkeleton() {
  return (
    <div className="space-y-8">
      <SectionBlock id="summary" title="Core Concepts" eyebrow="Summary Experience">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-[24px] border border-slate-200 p-5">
              <Skeleton className="h-2 w-8" />
              <Skeleton className="mt-4 h-5 w-32" />
              <Skeleton className="mt-3 h-16 w-full" />
            </div>
          ))}
        </div>
      </SectionBlock>
      <SectionBlock title="Quick Understanding Map">
        <Skeleton className="h-56 w-full rounded-[24px]" />
      </SectionBlock>
    </div>
  );
}

export function ExplainSkeleton() {
  return (
    <div className="space-y-8">
      <SectionBlock title="The Teacher's Analogy" eyebrow="Explain Mode">
        <Skeleton className="h-36 w-full rounded-[24px]" />
      </SectionBlock>
      <Skeleton className="h-64 w-full rounded-[28px]" />
      <SectionBlock title="Theoretical Framework">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-36 w-full rounded-[24px]" />
          ))}
        </div>
      </SectionBlock>
    </div>
  );
}

export function AssignmentSkeleton() {
  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-6">
        <SectionBlock title="Instructions" eyebrow="Assignment Brief">
          <Skeleton className="h-40 w-full rounded-[24px]" />
        </SectionBlock>
        <SectionBlock title="Section A: Conceptual Accuracy" eyebrow="Marks Loading">
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-56 w-full rounded-[24px]" />
            ))}
          </div>
        </SectionBlock>
      </div>
      <Skeleton className="h-80 w-full rounded-[24px]" />
    </div>
  );
}

export function SolveSkeleton() {
  return (
    <div className="space-y-8">
      <SectionBlock title="What the question is asking" eyebrow="Problem Breakdown">
        <Skeleton className="h-24 w-full rounded-[24px]" />
      </SectionBlock>
      <SectionBlock title="Given Values">
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-32 rounded-full" />
          ))}
        </div>
      </SectionBlock>
      <Skeleton className="h-64 w-full rounded-[28px]" />
      <SectionBlock title="Step-by-Step Solution">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full rounded-[24px]" />
          ))}
        </div>
      </SectionBlock>
    </div>
  );
}
