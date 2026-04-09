"use client";

import { useMemo, useState } from "react";
import { FlashcardEditor } from "@/components/feature/flashcards/FlashcardEditor";
import { FlashcardReviewSession } from "@/components/feature/flashcards/FlashcardReviewSession";
import type { FlashcardCard, FlashcardDeck, Rating } from "@/types";

interface FlashcardsPanelProps {
  decks: FlashcardDeck[];
  dueCards: FlashcardCard[];
  onStartReview: () => void;
  isReviewing: boolean;
  onStopReview: () => void;
  onRateCard: (cardId: string, rating: Rating, timeTakenMs: number) => Promise<void>;
  onSaveDeck: (deckId: string, cards: FlashcardCard[]) => Promise<void>;
}

export function FlashcardsPanel({
  decks,
  dueCards,
  onStartReview,
  isReviewing,
  onStopReview,
  onRateCard,
  onSaveDeck,
}: FlashcardsPanelProps) {
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(decks[0]?.id ?? null);
  const selectedDeck = useMemo(
    () => decks.find((deck) => deck.id === selectedDeckId) ?? decks[0] ?? null,
    [decks, selectedDeckId]
  );

  if (isReviewing) {
    return (
      <FlashcardReviewSession cards={dueCards} onRateCard={onRateCard} onClose={onStopReview} />
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Flashcards</p>
        <h1 className="text-[36px] font-bold tracking-[-0.05em] text-slate-900 sm:text-[52px]">
          Revision Decks
        </h1>
        <p className="max-w-3xl text-[16px] leading-7 text-slate-500">
          Review due cards with active recall, then tune your decks before the next study cycle.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Due Today</p>
              <p className="mt-2 text-[34px] font-bold tracking-[-0.04em] text-slate-900">{dueCards.length}</p>
            </div>
            <button
              type="button"
              onClick={onStartReview}
              disabled={dueCards.length === 0}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Start Review
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {decks.length > 0 ? (
              decks.map((deck) => (
                <button
                  key={deck.id}
                  type="button"
                  onClick={() => setSelectedDeckId(deck.id)}
                  className={`w-full rounded-[22px] border px-4 py-4 text-left transition ${
                    selectedDeck?.id === deck.id
                      ? "border-primary bg-blue-50/60"
                      : "border-slate-200 bg-[#fbfdff] hover:border-slate-300"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{deck.title}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {deck.cardCount} cards • {deck.subject || "General"}
                  </p>
                </button>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-[#f8fafc] p-6 text-sm leading-6 text-slate-500">
                Save a summary or explain output as flashcards to build your first deck.
              </div>
            )}
          </div>
        </section>

        {selectedDeck ? (
          <FlashcardEditor deck={selectedDeck} onSave={onSaveDeck} />
        ) : (
          <section className="rounded-[32px] border border-dashed border-slate-200 bg-[#f8fafc] p-8 text-center text-slate-500">
            Your decks will appear here once you save study content as flashcards.
          </section>
        )}
      </div>
    </div>
  );
}
