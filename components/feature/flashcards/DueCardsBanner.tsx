"use client";

interface DueCardsBannerProps {
  dueCount: number;
  onStartReview: () => void;
}

export function DueCardsBanner({ dueCount, onStartReview }: DueCardsBannerProps) {
  if (dueCount <= 0) {
    return null;
  }

  return (
    <div className="mt-6 rounded-[28px] border border-amber-200 bg-[linear-gradient(135deg,#fff7db_0%,#ffffff_100%)] px-5 py-5 shadow-[0_18px_40px_rgba(148,163,184,0.12)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">Spaced Repetition</p>
          <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-slate-900">
            You have {dueCount} {dueCount === 1 ? "card" : "cards"} due today.
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            A short review session now will keep these topics alive in long-term memory.
          </p>
        </div>

        <button
          type="button"
          onClick={onStartReview}
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Start Review
        </button>
      </div>
    </div>
  );
}
