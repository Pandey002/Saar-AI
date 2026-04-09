import type { FlashcardCard, Rating } from "@/types";

const MIN_EASE_FACTOR = 1.3;

export type Card = FlashcardCard;

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function calculateNextReview(card: Card, rating: Rating): Card {
  const today = new Date();
  const quality = rating;
  const updated = { ...card };

  if (quality < 3) {
    updated.repetitions = 0;
    updated.intervalDays = 1;
  } else if (updated.repetitions === 0) {
    updated.repetitions = 1;
    updated.intervalDays = 1;
  } else if (updated.repetitions === 1) {
    updated.repetitions = 2;
    updated.intervalDays = 6;
  } else {
    updated.repetitions += 1;
    updated.intervalDays = Math.max(1, Math.round(updated.intervalDays * updated.easeFactor));
  }

  const nextEaseFactor =
    updated.easeFactor +
    (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  updated.easeFactor = Math.max(MIN_EASE_FACTOR, Number(nextEaseFactor.toFixed(2)));
  updated.lastReviewDate = formatDate(today);
  updated.nextReviewDate = formatDate(addDays(today, updated.intervalDays));

  return updated;
}

export function isDueToday(card: Card) {
  const today = formatDate(new Date());
  return card.nextReviewDate <= today;
}
