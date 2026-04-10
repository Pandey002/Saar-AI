import { NextResponse } from "next/server";
import { updateFlashcardDeck } from "@/lib/flashcards/store";
import { getOrCreateSessionId } from "@/lib/serverSession";
import type { FlashcardCard } from "@/types";

export async function PATCH(request: Request, context: { params: Promise<{ deckId: string }> }) {
  try {
    const sessionId = await getOrCreateSessionId();
    const { deckId } = await context.params;
    const body = (await request.json()) as {
      title?: string;
      subject?: string;
      cards?: Array<Partial<FlashcardCard>>;
    };

    if (!deckId || !Array.isArray(body.cards)) {
      return NextResponse.json({ error: "Deck id and cards are required." }, { status: 400 });
    }

    const snapshot = await updateFlashcardDeck(sessionId, deckId, {
      title: body.title,
      subject: body.subject,
      cards: body.cards,
    });

    return NextResponse.json({ data: snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save flashcard deck.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
