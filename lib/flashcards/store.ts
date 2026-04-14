import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { calculateNextReview, isDueToday } from "@/lib/sm2";
import { hasSupabaseServerConfig, supabaseServerFetch } from "@/lib/supabase/server";
import type { FlashcardCard, FlashcardDeck, FlashcardDeckSummary, FlashcardReviewLog, FlashcardType, Rating } from "@/types";

interface LocalFlashcardStore {
  decks: FlashcardDeck[];
  reviewLog: FlashcardReviewLog[];
}

const DATA_DIRECTORY = path.join(process.cwd(), "data");
const FLASHCARD_FILE = path.join(DATA_DIRECTORY, "flashcards.json");
const DECKS_TABLE = "flashcard_decks";
const CARDS_TABLE = "flashcards";
const REVIEW_LOG_TABLE = "review_log";

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIRECTORY, { recursive: true });
    try {
      await fs.access(FLASHCARD_FILE);
    } catch {
      await fs.writeFile(FLASHCARD_FILE, JSON.stringify({}, null, 2), "utf8");
    }
  } catch {
    // Silent fail for EROFS in production
  }
}

async function readStore(): Promise<Record<string, LocalFlashcardStore>> {
  await ensureDataFile();

  try {
    const content = await fs.readFile(FLASHCARD_FILE, "utf8");
    const parsed = JSON.parse(content) as Record<string, LocalFlashcardStore>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStore(store: Record<string, LocalFlashcardStore>) {
  try {
    await ensureDataFile();
    await fs.writeFile(FLASHCARD_FILE, JSON.stringify(store, null, 2), "utf8");
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("Local persistence failed:", err);
    }
    // Silent fail on read-only systems
  }
}

function mapDeckRow(row: Record<string, unknown>, cards: FlashcardCard[]): FlashcardDeck {
  return {
    id: String(row.id ?? ""),
    sessionId: String(row.session_id ?? ""),
    title: String(row.title ?? "Untitled Deck"),
    subject: String(row.subject ?? ""),
    cardCount: Number(row.card_count ?? cards.length),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    cards,
  };
}

function mapCardRow(row: Record<string, unknown>): FlashcardCard {
  return {
    id: String(row.id ?? ""),
    deckId: String(row.deck_id ?? ""),
    sessionId: String(row.session_id ?? ""),
    front: String(row.front ?? ""),
    back: String(row.back ?? ""),
    type: (row.type as FlashcardType) ?? "concept",
    tags: Array.isArray(row.tags) ? row.tags.map((tag) => String(tag)) : [],
    easeFactor: Number(row.ease_factor ?? 2.5),
    intervalDays: Number(row.interval_days ?? 1),
    repetitions: Number(row.repetitions ?? 0),
    nextReviewDate: String(row.next_review_date ?? today()),
    lastReviewDate: row.last_review_date ? String(row.last_review_date) : null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapReviewRow(row: Record<string, unknown>): FlashcardReviewLog {
  return {
    id: String(row.id ?? ""),
    cardId: String(row.card_id ?? ""),
    sessionId: String(row.session_id ?? ""),
    rating: Number(row.rating ?? 4) as Rating,
    timeTakenMs: row.time_taken_ms ? Number(row.time_taken_ms) : null,
    reviewedAt: String(row.reviewed_at ?? new Date().toISOString()),
  };
}

function createCard(sessionId: string, deckId: string, card: { front: string; back: string; type: FlashcardType; tags?: string[] }): FlashcardCard {
  return {
    id: randomUUID(),
    deckId,
    sessionId,
    front: card.front.trim(),
    back: card.back.trim(),
    type: card.type,
    tags: card.tags?.filter(Boolean) ?? [],
    easeFactor: 2.5,
    intervalDays: 1,
    repetitions: 0,
    nextReviewDate: today(),
    lastReviewDate: null,
    createdAt: new Date().toISOString(),
  };
}

async function readSupabaseDeckSummary(sessionId: string): Promise<FlashcardDeckSummary> {
  const decksQuery = new URLSearchParams({
    select: "*",
    session_id: `eq.${sessionId}`,
    order: "created_at.desc",
  });
  const cardsQuery = new URLSearchParams({
    select: "*",
    session_id: `eq.${sessionId}`,
    order: "created_at.asc",
  });

  const [deckResponse, cardResponse] = await Promise.all([
    supabaseServerFetch(`/rest/v1/${DECKS_TABLE}?${decksQuery.toString()}`),
    supabaseServerFetch(`/rest/v1/${CARDS_TABLE}?${cardsQuery.toString()}`),
  ]);

  if (!deckResponse.ok || !cardResponse.ok) {
    throw new Error((!deckResponse.ok ? await deckResponse.text() : "") || (!cardResponse.ok ? await cardResponse.text() : ""));
  }

  const deckRows = (await deckResponse.json()) as Array<Record<string, unknown>>;
  const cardRows = (await cardResponse.json()) as Array<Record<string, unknown>>;
  const cards = cardRows.map(mapCardRow);
  const decks = deckRows.map((row) =>
    mapDeckRow(
      row,
      cards.filter((card) => card.deckId === String(row.id ?? ""))
    )
  );

  return {
    decks,
    dueCards: cards.filter(isDueToday).slice(0, 50),
  };
}

async function createSupabaseDeckWithCards(
  sessionId: string,
  payload: { title: string; subject: string; cards: Array<{ front: string; back: string; type: FlashcardType; tags?: string[] }> }
) {
  const deckId = randomUUID();
  const createdAt = new Date().toISOString();
  const cards = payload.cards.map((card) => createCard(sessionId, deckId, card));

  const deckResponse = await supabaseServerFetch(`/rest/v1/${DECKS_TABLE}`, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify([
      {
        id: deckId,
        session_id: sessionId,
        title: payload.title,
        subject: payload.subject,
        card_count: cards.length,
        created_at: createdAt,
      },
    ]),
  });

  if (!deckResponse.ok) {
    throw new Error(await deckResponse.text());
  }

  const cardResponse = await supabaseServerFetch(`/rest/v1/${CARDS_TABLE}`, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(
      cards.map((card) => ({
        id: card.id,
        deck_id: card.deckId,
        session_id: card.sessionId,
        front: card.front,
        back: card.back,
        type: card.type,
        tags: card.tags,
        ease_factor: card.easeFactor,
        interval_days: card.intervalDays,
        repetitions: card.repetitions,
        next_review_date: card.nextReviewDate,
        last_review_date: card.lastReviewDate,
        created_at: card.createdAt,
      }))
    ),
  });

  if (!cardResponse.ok) {
    throw new Error(await cardResponse.text());
  }

  return {
    deckId,
    cards,
  };
}

export async function getFlashcardDeckSummary(sessionId: string): Promise<FlashcardDeckSummary> {
  if (hasSupabaseServerConfig()) {
    try {
      return await readSupabaseDeckSummary(sessionId);
    } catch {
      // Fall back to local persistence when Supabase schema is unavailable.
    }
  }

  const store = await readStore();
  const snapshot = store[sessionId] ?? { decks: [], reviewLog: [] };
  const cards = snapshot.decks.flatMap((deck) => deck.cards);

  return {
    decks: snapshot.decks,
    dueCards: cards.filter(isDueToday).slice(0, 50),
  };
}

export async function generateFlashcardDeck(
  sessionId: string,
  payload: { title: string; subject: string; cards: Array<{ front: string; back: string; type: FlashcardType; tags?: string[] }> }
) {
  if (hasSupabaseServerConfig()) {
    try {
      await createSupabaseDeckWithCards(sessionId, payload);
      return await readSupabaseDeckSummary(sessionId);
    } catch {
      // Fall back to local persistence when Supabase schema is unavailable.
    }
  }

  const store = await readStore();
  const snapshot = store[sessionId] ?? { decks: [], reviewLog: [] };
  const deckId = randomUUID();
  const createdAt = new Date().toISOString();
  const cards = payload.cards.map((card) => createCard(sessionId, deckId, card));

  const deck: FlashcardDeck = {
    id: deckId,
    sessionId,
    title: payload.title,
    subject: payload.subject,
    cardCount: cards.length,
    createdAt,
    cards,
  };

  store[sessionId] = {
    ...snapshot,
    decks: [deck, ...snapshot.decks],
  };

  await writeStore(store);
  return {
    decks: store[sessionId].decks,
    dueCards: store[sessionId].decks.flatMap((item) => item.cards).filter(isDueToday).slice(0, 50),
  };
}

export async function updateFlashcardDeck(
  sessionId: string,
  deckId: string,
  payload: { title?: string; subject?: string; cards: Array<Partial<FlashcardCard>> }
) {
  const sanitizedCards = payload.cards
    .map((card) => ({
      ...card,
      front: String(card.front ?? "").trim(),
      back: String(card.back ?? "").trim(),
      type: (card.type as FlashcardType) ?? "concept",
      tags: Array.isArray(card.tags) ? card.tags.map((tag) => String(tag)) : [],
    }))
    .filter((card) => card.front && card.back);

  if (hasSupabaseServerConfig()) {
    try {
      const deleteQuery = new URLSearchParams({ deck_id: `eq.${deckId}`, session_id: `eq.${sessionId}` });
      const deleteResponse = await supabaseServerFetch(`/rest/v1/${CARDS_TABLE}?${deleteQuery.toString()}`, {
        method: "DELETE",
      });

      if (!deleteResponse.ok) {
        throw new Error(await deleteResponse.text());
      }

      if (sanitizedCards.length > 0) {
        const insertResponse = await supabaseServerFetch(`/rest/v1/${CARDS_TABLE}`, {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(
            sanitizedCards.map((card) => {
              const createdCard = createCard(sessionId, deckId, {
                front: card.front,
                back: card.back,
                type: card.type,
                tags: card.tags,
              });
              return {
                id: createdCard.id,
                deck_id: createdCard.deckId,
                session_id: createdCard.sessionId,
                front: createdCard.front,
                back: createdCard.back,
                type: createdCard.type,
                tags: createdCard.tags,
                ease_factor: createdCard.easeFactor,
                interval_days: createdCard.intervalDays,
                repetitions: createdCard.repetitions,
                next_review_date: createdCard.nextReviewDate,
                last_review_date: createdCard.lastReviewDate,
                created_at: createdCard.createdAt,
              };
            })
          ),
        });

        if (!insertResponse.ok) {
          throw new Error(await insertResponse.text());
        }
      }

      const deckQuery = new URLSearchParams({ id: `eq.${deckId}`, session_id: `eq.${sessionId}` });
      const updateResponse = await supabaseServerFetch(`/rest/v1/${DECKS_TABLE}?${deckQuery.toString()}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          title: payload.title,
          subject: payload.subject,
          card_count: sanitizedCards.length,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error(await updateResponse.text());
      }

      return await readSupabaseDeckSummary(sessionId);
    } catch {
      // Fall back to local persistence when Supabase schema is unavailable.
    }
  }

  const store = await readStore();
  const snapshot = store[sessionId] ?? { decks: [], reviewLog: [] };

  store[sessionId] = {
    ...snapshot,
    decks: snapshot.decks.map((deck) =>
      deck.id === deckId
        ? {
            ...deck,
            title: payload.title ?? deck.title,
            subject: payload.subject ?? deck.subject,
            cardCount: sanitizedCards.length,
            cards: sanitizedCards.map((card) =>
              createCard(sessionId, deckId, {
                front: card.front,
                back: card.back,
                type: card.type,
                tags: card.tags,
              })
            ),
          }
        : deck
    ),
  };

  await writeStore(store);
  return {
    decks: store[sessionId].decks,
    dueCards: store[sessionId].decks.flatMap((deck) => deck.cards).filter(isDueToday).slice(0, 50),
  };
}

export async function getDueFlashcards(sessionId: string, limit = 50) {
  const snapshot = await getFlashcardDeckSummary(sessionId);
  return snapshot.dueCards.slice(0, limit);
}

export async function recordFlashcardReview(
  sessionId: string,
  payload: { cardId: string; rating: Rating; timeTakenMs?: number }
) {
  if (hasSupabaseServerConfig()) {
    try {
      const cardQuery = new URLSearchParams({ id: `eq.${payload.cardId}`, session_id: `eq.${sessionId}`, select: "*" });
      const cardResponse = await supabaseServerFetch(`/rest/v1/${CARDS_TABLE}?${cardQuery.toString()}`);

      if (!cardResponse.ok) {
        throw new Error(await cardResponse.text());
      }

      const [cardRow] = (await cardResponse.json()) as Array<Record<string, unknown>>;
      if (!cardRow) {
        throw new Error("Flashcard not found.");
      }

      const existingCard = mapCardRow(cardRow);
      const updatedCard = calculateNextReview(existingCard, payload.rating);
      const deckQuery = new URLSearchParams({
        id: `eq.${existingCard.deckId}`,
        session_id: `eq.${sessionId}`,
        select: "*",
      });
      const deckResponse = await supabaseServerFetch(`/rest/v1/${DECKS_TABLE}?${deckQuery.toString()}`);
      const [deckRow] = deckResponse.ok ? ((await deckResponse.json()) as Array<Record<string, unknown>>) : [];
      const topic = String(deckRow?.subject ?? deckRow?.title ?? existingCard.front ?? "Revision Deck");
      const patchQuery = new URLSearchParams({ id: `eq.${updatedCard.id}`, session_id: `eq.${sessionId}` });
      const patchResponse = await supabaseServerFetch(`/rest/v1/${CARDS_TABLE}?${patchQuery.toString()}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          ease_factor: updatedCard.easeFactor,
          interval_days: updatedCard.intervalDays,
          repetitions: updatedCard.repetitions,
          next_review_date: updatedCard.nextReviewDate,
          last_review_date: updatedCard.lastReviewDate,
        }),
      });

      if (!patchResponse.ok) {
        throw new Error(await patchResponse.text());
      }

      const reviewResponse = await supabaseServerFetch(`/rest/v1/${REVIEW_LOG_TABLE}`, {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify([
          {
            id: randomUUID(),
            card_id: payload.cardId,
            session_id: sessionId,
            rating: payload.rating,
            time_taken_ms: payload.timeTakenMs ?? null,
            reviewed_at: new Date().toISOString(),
          },
        ]),
      });

      if (!reviewResponse.ok) {
        throw new Error(await reviewResponse.text());
      }

      return {
        card: updatedCard,
        dueCards: await getDueFlashcards(sessionId),
        performanceContext: {
          topic,
          cardFront: updatedCard.front,
          cardBack: updatedCard.back,
          concepts: updatedCard.tags,
        },
      };
    } catch {
      // Fall back to local persistence when Supabase schema is unavailable.
    }
  }

  const store = await readStore();
  const snapshot = store[sessionId] ?? { decks: [], reviewLog: [] };
  let reviewedCard: FlashcardCard | null = null;

  const decks = snapshot.decks.map((deck) => ({
    ...deck,
    cards: deck.cards.map((card) => {
      if (card.id !== payload.cardId) {
        return card;
      }

      reviewedCard = calculateNextReview(card, payload.rating);
      return reviewedCard;
    }),
  }));

  if (!reviewedCard) {
    throw new Error("Flashcard not found.");
  }
  const finalizedCard = reviewedCard as FlashcardCard;

  const reviewedDeck = decks.find((deck) => deck.cards.some((card) => card.id === payload.cardId));

  const reviewLog: FlashcardReviewLog = {
    id: randomUUID(),
    cardId: payload.cardId,
    sessionId,
    rating: payload.rating,
    timeTakenMs: payload.timeTakenMs ?? null,
    reviewedAt: new Date().toISOString(),
  };

  store[sessionId] = {
    decks,
    reviewLog: [reviewLog, ...snapshot.reviewLog],
  };

  await writeStore(store);
  return {
    card: finalizedCard,
    dueCards: decks.flatMap((deck) => deck.cards).filter(isDueToday).slice(0, 50),
    performanceContext: {
      topic: reviewedDeck?.subject || reviewedDeck?.title || finalizedCard.front || "Revision Deck",
      cardFront: finalizedCard.front,
      cardBack: finalizedCard.back,
      concepts: finalizedCard.tags,
    },
  };
}

export async function getFlashcardReviewLog(sessionId: string) {
  if (hasSupabaseServerConfig()) {
    try {
      const query = new URLSearchParams({
        select: "*",
        session_id: `eq.${sessionId}`,
        order: "reviewed_at.desc",
        limit: "100",
      });
      const response = await supabaseServerFetch(`/rest/v1/${REVIEW_LOG_TABLE}?${query.toString()}`);
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const rows = (await response.json()) as Array<Record<string, unknown>>;
      return rows.map(mapReviewRow);
    } catch {
      // Fall back to local persistence when Supabase schema is unavailable.
    }
  }

  const store = await readStore();
  return (store[sessionId] ?? { decks: [], reviewLog: [] }).reviewLog;
}
