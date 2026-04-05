import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import type { StudyMode } from "@/types";

interface ResultSkeletonProps {
  mode: StudyMode;
}

export function ResultSkeleton({ mode }: ResultSkeletonProps) {
  if (mode === "explain") {
    return (
      <Card className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-9/12" />
          </div>
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </Card>
    );
  }

  if (mode === "assignment") {
    return (
      <Card className="space-y-4">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-16 w-full rounded-xl" />
        {[0, 1, 2].map((item) => (
          <div key={item} className="space-y-3 rounded-xl border border-line p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-10/12" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ))}
      </Card>
    );
  }

  return (
    <Card className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-72" />
        </div>
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      {[0, 1, 2].map((item) => (
        <Skeleton key={item} className="h-16 w-full rounded-xl" />
      ))}
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    </Card>
  );
}
