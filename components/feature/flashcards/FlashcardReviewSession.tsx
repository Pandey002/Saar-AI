"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateNextReview } from "@/lib/sm2";
import type { FlashcardCard, Rating } from "@/types";
import { Flashcard } from "./Flashcard";

interface FlashcardReviewSessionProps {
  cards: FlashcardCard[];
  onRateCard: (cardId: string, rating: Rating, timeTakenMs: number) => Promise<void>;
  onClose: () => void;
}

const ratingButtons: Array<{ label: string; rating: Rating; className: string }> = [
  { label: "Forgot", rating: 1, className: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100" },
  { label: "Hard", rating: 2, className: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100" },
  { label: "Good", rating: 4, className: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100" },
  { label: "Easy", rating: 5, className: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
];

function describeNextReview(days: number) {
  if (days <= 1) {
    return "Next review: tomorrow";
  }

  return `Next review: in ${days} days`;
}

export function FlashcardReviewSession({ cards, onRateCard, onClose }: FlashcardReviewSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [hasFlippedOnce, setHasFlippedOnce] = useState(false);
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

      handleNext();
    } finally {
      setIsSaving(false);
    }
  }

  function handleNext() {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((index) => index + 1);
      setIsFlipped(false);
      setStartedAt(Date.now());
    } else {
      setCurrentIndex(cards.length); // Mark as complete
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setCurrentIndex((index) => index - 1);
      setIsFlipped(false);
      setStartedAt(Date.now());
    }
  }

  function handleFlip(flipped: boolean) {
    setIsFlipped(flipped);
    if (flipped && !hasFlippedOnce) {
      setHasFlippedOnce(true);
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
    <section className="relative rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            Review Session
          </p>
          <h2 className="mt-2 text-[24px] font-bold tracking-[-0.04em] text-slate-900 sm:text-[30px]">
            {card.type.charAt(0).toUpperCase() + card.type.slice(1)} Card
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="group rounded-full border border-slate-100 p-2 text-slate-400 transition hover:border-slate-200 hover:text-slate-900"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-slate-400">
           <span>Progress</span>
           <span>{currentIndex + 1} of {cards.length}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-50">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center">
        <div className="relative w-full max-w-[500px]">
          <Flashcard 
            card={card} 
            index={currentIndex} 
            total={cards.length}
            isFlipped={isFlipped}
            onFlip={handleFlip}
            showHint={!hasFlippedOnce}
            flexible={true}
          />
          
          {/* Navigation Arrows */}
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="absolute -left-4 top-1/2 -translate-y-1/2 rounded-full border border-slate-100 bg-white p-2.5 text-slate-400 shadow-sm transition hover:border-slate-200 hover:text-slate-900 disabled:opacity-0 sm:-left-12"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === cards.length - 1}
            className="absolute -right-4 top-1/2 -translate-y-1/2 rounded-full border border-slate-100 bg-white p-2.5 text-slate-400 shadow-sm transition hover:border-slate-200 hover:text-slate-900 disabled:opacity-0 sm:-right-12"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Rating Controls - Only visible after flip */}
        <div className={cn(
          "mt-10 w-full max-w-[600px] transition-all duration-500",
          isFlipped ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        )}>
          <p className="mb-4 text-center text-sm font-semibold text-slate-500">How well did you know this?</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {preview?.map((item) => (
              <button
                key={`${card.id}-${item.rating}`}
                type="button"
                disabled={isSaving}
                onClick={() => void handleRate(item.rating)}
                className={cn(
                  "flex flex-col rounded-[22px] border px-4 py-4 text-left transition",
                  "hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
                  item.className
                )}
              >
                <span className="text-sm font-bold">{item.label}</span>
                <span className="mt-1 text-[10px] font-medium opacity-70">
                  {describeNextReview(item.next.intervalDays)}
                </span>
              </button>
            ))}
          </div>
        </div>
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
