"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Save, Trash2, X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import type { FlashcardCard, FlashcardDeck, FlashcardType } from "@/types";
import { Flashcard } from "./Flashcard";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

interface FlashcardEditorProps {
  deck: FlashcardDeck;
  onSave: (deckId: string, cards: FlashcardCard[]) => Promise<void>;
}

const cardTypes: FlashcardType[] = ["concept", "formula", "date", "process", "definition"];

export function FlashcardEditor({ deck, onSave }: FlashcardEditorProps) {
  const [cards, setCards] = useState(deck.cards);
  const [isSaving, setIsSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    setCards(deck.cards);
  }, [deck]);

  const updateCard = useCallback((index: number, patch: Partial<FlashcardCard>) => {
    setCards((current) => {
      const next = [...current];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }, []);

  const deleteCard = (index: number) => {
    setCards((current) => current.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
    else if (editingIndex !== null && editingIndex > index) setEditingIndex(editingIndex - 1);
  };

  const addCard = () => {
    const newCard: FlashcardCard = {
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
    };
    setCards((current) => [...current, newCard]);
    setEditingIndex(cards.length);
  };

  async function handleSave() {
    setIsSaving(true);
    try {
      await onSave(deck.id, cards);
    } finally {
      setIsSaving(false);
    }
  }

  // Handle Keyboard Navigation and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is actively typing in an input
      if (
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLInputElement
      ) {
        if (e.key === "Escape") {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      if (e.key === "Escape") {
        setEditingIndex(null);
      } else if (editingIndex !== null) {
        if (e.key === "ArrowLeft" && editingIndex > 0) {
          setEditingIndex(editingIndex - 1);
        } else if (e.key === "ArrowRight" && editingIndex < cards.length - 1) {
          setEditingIndex(editingIndex + 1);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingIndex, cards.length]);

  return (
    <section className="space-y-8 pb-20">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-12 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold uppercase tracking-widest text-primary">
              Editor
            </span>
          </div>
          <h2 className="mt-2 text-[34px] font-bold tracking-[-0.04em] text-slate-900">{deck.title}</h2>
          <p className="text-sm font-medium text-slate-400">Manage your cards through direct interaction</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={addCard}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            <Plus className="h-4 w-4" />
            Add Card
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save Deck"}
          </button>
        </div>
      </div>

      {/* Serial List of Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, index) => (
          <div 
            key={card.id} 
            className="group relative cursor-pointer"
            onClick={() => setEditingIndex(index)}
          >
            <div className="absolute -left-2 -top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white font-bold text-slate-900 shadow-sm border border-slate-100">
               {index + 1}
            </div>
            
            <div className="absolute right-4 top-4 z-20 opacity-0 transition-opacity group-hover:opacity-100">
               <div className="rounded-full bg-white/80 p-2 text-slate-400 backdrop-blur-sm hover:text-primary">
                  <Maximize2 className="h-4 w-4" />
               </div>
            </div>

            <Flashcard 
              card={card} 
              className="!h-[240px] pointer-events-none" 
            />
          </div>
        ))}

        <button
          onClick={addCard}
          className="flex h-[240px] w-full flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-slate-100 bg-slate-50/50 text-slate-300 transition hover:border-primary/20 hover:bg-slate-50 hover:text-primary"
        >
          <Plus className="h-8 w-8 text-current" />
          <span className="mt-2 text-sm font-bold uppercase tracking-widest text-current">New Card</span>
        </button>
      </div>

      {/* Pop-out Editor Modal */}
      {editingIndex !== null && cards[editingIndex] && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" 
            onClick={() => setEditingIndex(null)}
          />
          
          {/* Modal Container */}
          <div className="relative z-[10000] w-full max-w-[460px] animate-in zoom-in-95 fade-in duration-300 slide-in-from-bottom-5">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4 text-white">
                <span className="text-[32px] font-black italic opacity-30">
                  {String(editingIndex + 1).padStart(2, '0')}
                </span>
                <div>
                   <h3 className="text-xl font-bold">Edit Card</h3>
                   <p className="text-xs font-medium opacity-60 flex-wrap">Flippable interface</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                 <button
                   onClick={(e) => { e.stopPropagation(); deleteCard(editingIndex); }}
                   className="rounded-full bg-red-500/10 p-3 text-red-400 transition hover:bg-red-500 hover:text-white"
                 >
                   <Trash2 className="h-5 w-5" />
                 </button>
                 <button
                   onClick={() => setEditingIndex(null)}
                   className="rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
                 >
                   <X className="h-5 w-5" />
                 </button>
              </div>
            </div>

            <div className="relative flex flex-col items-center gap-8">
               {/* Previous Button */}
               <button
                 disabled={editingIndex === 0}
                 onClick={(e) => { e.stopPropagation(); setEditingIndex(editingIndex - 1); }}
                 className="absolute -left-16 md:-left-24 top-1/2 -translate-y-1/2 z-50 rounded-full bg-white/10 p-4 text-white backdrop-blur-md transition hover:bg-white/20 hover:scale-105 active:scale-95 disabled:opacity-0 disabled:pointer-events-none sm:flex hidden"
               >
                 <ChevronLeft className="h-8 w-8" />
               </button>

               <Flashcard 
                key={cards[editingIndex].id}
                card={cards[editingIndex]} 
                isEditing={true}
                flexible={true}
                onUpdate={(patch) => updateCard(editingIndex, patch)}
                className="w-full shadow-[0_32px_120px_rgba(0,0,0,0.5)]"
              />

              {/* Next Button */}
              <button
                 disabled={editingIndex === cards.length - 1}
                 onClick={(e) => { e.stopPropagation(); setEditingIndex(editingIndex + 1); }}
                 className="absolute -right-16 md:-right-24 top-1/2 -translate-y-1/2 z-50 rounded-full bg-white/10 p-4 text-white backdrop-blur-md transition hover:bg-white/20 hover:scale-105 active:scale-95 disabled:opacity-0 disabled:pointer-events-none sm:flex hidden"
               >
                 <ChevronRight className="h-8 w-8" />
               </button>

               {/* Configuration Bar */}
               <div className="flex w-full flex-col sm:flex-row items-center justify-between gap-4 rounded-[28px] sm:rounded-full bg-white/5 p-2 px-4 sm:px-6 backdrop-blur-xl border border-white/10">
                  <div className="flex items-center gap-4 w-full sm:w-auto overflow-hidden">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 hidden sm:block">Category</span>
                     <select
                        value={cards[editingIndex].type}
                        onChange={(event) => updateCard(editingIndex, { type: event.target.value as FlashcardType })}
                        className="bg-transparent text-sm font-bold text-white outline-none transition focus:text-primary w-full"
                      >
                        {cardTypes.map((type) => (
                          <option key={type} value={type} className="text-slate-900">
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </option>
                        ))}
                      </select>
                  </div>
                  
                  <div className="h-8 w-[1px] bg-white/10" />

                  <div className="flex items-center gap-2 sm:hidden">
                    <button
                      disabled={editingIndex === 0}
                      onClick={() => setEditingIndex(editingIndex - 1)}
                      className="rounded-full p-2 text-white disabled:opacity-20"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="text-sm font-bold text-white">{editingIndex + 1} / {cards.length}</span>
                    <button
                      disabled={editingIndex === cards.length - 1}
                      onClick={() => setEditingIndex(editingIndex + 1)}
                      className="rounded-full p-2 text-white disabled:opacity-20"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>

                  <button
                    onClick={() => setEditingIndex(null)}
                    className="rounded-full bg-white px-6 py-2 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
                  >
                    Done
                  </button>
               </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
