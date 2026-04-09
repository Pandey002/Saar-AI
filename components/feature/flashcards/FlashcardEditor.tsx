"use client";

import { useEffect, useState } from "react";
import type { FlashcardCard, FlashcardDeck, FlashcardType } from "@/types";

interface FlashcardEditorProps {
  deck: FlashcardDeck;
  onSave: (deckId: string, cards: FlashcardCard[]) => Promise<void>;
}

const cardTypes: FlashcardType[] = ["concept", "formula", "date", "process", "definition"];

export function FlashcardEditor({ deck, onSave }: FlashcardEditorProps) {
  const [cards, setCards] = useState(deck.cards);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setCards(deck.cards);
  }, [deck]);

  function updateCard(cardId: string, patch: Partial<FlashcardCard>) {
    setCards((current) =>
      current.map((card) => (card.id === cardId ? { ...card, ...patch } : card))
    );
  }

  function deleteCard(cardId: string) {
    setCards((current) => current.filter((card) => card.id !== cardId));
  }

  function addCard() {
    setCards((current) => [
      ...current,
      {
        id: `draft-${Date.now()}`,
        deckId: deck.id,
        sessionId: deck.sessionId,
        front: "",
        back: "",
        type: "concept",
        tags: [],
        easeFactor: 2.5,
        intervalDays: 1,
        repetitions: 0,
        nextReviewDate: new Date().toISOString().slice(0, 10),
        lastReviewDate: null,
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await onSave(deck.id, cards);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Flashcard Editor</p>
          <h2 className="mt-2 text-[30px] font-bold tracking-[-0.04em] text-slate-900">{deck.title}</h2>
        </div>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSaving}
          className="inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Deck"}
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {cards.map((card, index) => (
          <div key={card.id} className="rounded-[24px] border border-slate-200 bg-[#fbfdff] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-slate-900">Card {index + 1}</p>
              <div className="flex items-center gap-3">
                <select
                  value={card.type}
                  onChange={(event) => updateCard(card.id, { type: event.target.value as FlashcardType })}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
                >
                  {cardTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => deleteCard(card.id)}
                  className="rounded-full border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-900">Front</span>
                <textarea
                  value={card.front}
                  onChange={(event) => updateCard(card.id, { front: event.target.value })}
                  className="mt-2 min-h-[120px] w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-primary"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-900">Back</span>
                <textarea
                  value={card.back}
                  onChange={(event) => updateCard(card.id, { back: event.target.value })}
                  className="mt-2 min-h-[120px] w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-primary"
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addCard}
        className="mt-6 inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
      >
        Add card manually
      </button>
    </section>
  );
}
