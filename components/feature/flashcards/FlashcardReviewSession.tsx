"use client";

import { useMemo, useState } from "react";
import { calculateNextReview } from "@/lib/sm2";
import type { FlashcardCard, Rating } from "@/types";

interface FlashcardReviewSessionProps {
  cards: FlashcardCard[];
  onRateCard: (cardId: string, rating: Rating, timeTakenMs: number) => Promise<void>;
  onClose: () => void;
}

const ratingButtons: Array<{ label: string; rating: Rating; className: string }> = [
  { label: "Forgot", rating: 1, className: "border-red-200 bg-red-50 text-red-700" },
  { label: "Hard", rating: 2, className: "border-amber-200 bg-amber-50 text-amber-700" },
  { label: "Good", rating: 4, className: "border-blue-200 bg-blue-50 text-blue-700" },
  { label: "Easy", rating: 5, className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
];

function describeNextReview(days: number) {
  if (days <= 1) {
    return "Next review: tomorrow";
  }

  return `Next review: in ${days} days`;
}

export function FlashcardReviewSession({ cards, onRateCard, onClose }: FlashcardReviewSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [isSaving, setIsSaving] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [passedCount, setPassedCount] = useState(0);
  const [resetCount, setResetCount] = useState(0);

  const card = cards[currentIndex];
  const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;
  const isComplete = currentIndex >= cards.length;

  const preview = useMemo(() => {
    if (!card) {
      return null;
    }

    return ratingButtons.map((item) => ({
      ...item,
      next: calculateNextReview(card, item.rating),
    }));
  }, [card]);

  async function handleRate(rating: Rating) {
    if (!card) {
      return;
    }

    setIsSaving(true);
    const timeTakenMs = Date.now() - startedAt;

    try {
      await onRateCard(card.id, rating, timeTakenMs);
      setReviewedCount((count) => count + 1);
      if (rating >= 4) {
        setPassedCount((count) => count + 1);
      }
      if (rating < 3) {
        setResetCount((count) => count + 1);
      }

      setCurrentIndex((index) => index + 1);
      setTypedAnswer("");
      setRevealed(false);
      setStartedAt(Date.now());
    } finally {
      setIsSaving(false);
    }
  }

  if (isComplete) {
    return (
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Review Complete</p>
        <h2 className="mt-3 text-[34px] font-bold tracking-[-0.04em] text-slate-900">Session complete</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <SummaryStat label="Cards reviewed" value={String(reviewedCount)} />
          <SummaryStat label="Passed" value={String(passedCount)} />
          <SummaryStat label="Reset" value={String(resetCount)} />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Back to Flashcards
        </button>
      </section>
    );
  }

  if (!card) {
    return null;
  }

  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            Card {currentIndex + 1} of {cards.length}
          </p>
          <h2 className="mt-2 text-[30px] font-bold tracking-[-0.04em] text-slate-900">Daily Review</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          Close
        </button>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-8 rounded-[28px] border border-slate-200 bg-[#fbfdff] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{card.type}</p>
        <h3 className="mt-3 text-[28px] font-semibold tracking-[-0.03em] text-slate-900">{card.front}</h3>

        <label className="mt-6 block">
          <span className="text-sm font-semibold text-slate-900">Type your answer first</span>
          <textarea
            value={typedAnswer}
            onChange={(event) => setTypedAnswer(event.target.value)}
            placeholder="Try recalling the answer from memory before revealing it..."
            className="mt-3 min-h-[140px] w-full rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-700 outline-none transition focus:border-primary"
          />
        </label>

        {!revealed ? (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            disabled={!typedAnswer.trim()}
            className="mt-5 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reveal Answer
          </button>
        ) : (
          <div className="mt-6 space-y-5">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-900">Your answer</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{typedAnswer}</p>
            </div>

            <div className="rounded-[24px] border border-blue-100 bg-blue-50/70 p-5">
              <p className="text-sm font-semibold text-slate-900">Correct answer</p>
              <p className={`mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700 ${card.type === "formula" ? "font-mono" : ""}`}>
                {card.back}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {preview?.map((item) => (
                <button
                  key={`${card.id}-${item.rating}`}
                  type="button"
                  disabled={isSaving}
                  onClick={() => void handleRate(item.rating)}
                  className={`rounded-[22px] border px-4 py-4 text-left transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 ${item.className}`}
                >
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="mt-2 text-xs leading-5 text-current/80">
                    {describeNextReview(item.next.intervalDays)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-[#f8fafc] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-3 text-[30px] font-bold tracking-[-0.04em] text-slate-900">{value}</p>
    </div>
  );
}
