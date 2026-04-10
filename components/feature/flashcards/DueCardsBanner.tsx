"use client";

interface DueCardsBannerProps {
  dueCount: number;
  onStartReview: () => void;
  compact?: boolean;
}

export function DueCardsBanner({ dueCount, onStartReview, compact = false }: DueCardsBannerProps) {
  if (dueCount <= 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="rounded-[28px] border border-amber-200 bg-[linear-gradient(145deg,#fff3c6_0%,#fffaf0_58%,#ffffff_100%)] p-5 shadow-[0_24px_55px_rgba(217,119,6,0.12)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">Spaced Repetition</p>
        <p className="mt-3 text-xl font-semibold tracking-[-0.04em] text-slate-900">
          {dueCount} {dueCount === 1 ? "card is" : "cards are"} ready today
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Knock out a quick review session without leaving this workspace.
        </p>

        <div className="mt-5 rounded-[22px] border border-white/70 bg-white/70 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-600">Memory health</p>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            Reviewing now keeps older topics active before they start slipping.
          </p>
        </div>

        <button
          type="button"
          onClick={onStartReview}
          className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Start Review
        </button>
      </div>
    );
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
