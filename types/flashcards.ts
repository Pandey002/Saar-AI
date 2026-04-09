export type Rating = 1 | 2 | 4 | 5;

export type FlashcardType = "concept" | "formula" | "date" | "process" | "definition";

export interface FlashcardCard {
  id: string;
  deckId: string;
  sessionId: string;
  front: string;
  back: string;
  type: FlashcardType;
  tags: string[];
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewDate: string;
  lastReviewDate: string | null;
  createdAt: string;
}

export interface FlashcardDeck {
  id: string;
  sessionId: string;
  title: string;
  subject: string;
  cardCount: number;
  createdAt: string;
  cards: FlashcardCard[];
}

export interface FlashcardReviewLog {
  id: string;
  cardId: string;
  sessionId: string;
  rating: Rating;
  timeTakenMs: number | null;
  reviewedAt: string;
}

export interface FlashcardDeckSummary {
  decks: FlashcardDeck[];
  dueCards: FlashcardCard[];
}
