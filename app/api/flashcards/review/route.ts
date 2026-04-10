import { NextResponse } from "next/server";
import { getDueFlashcards, recordFlashcardReview } from "@/lib/flashcards/store";
import { getOrCreateSessionId } from "@/lib/serverSession";
import type { Rating } from "@/types";

export async function GET(request: Request) {
  try {
    const sessionId = await getOrCreateSessionId();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 50) || 50, 50);
    const dueCards = await getDueFlashcards(sessionId, limit);

    return NextResponse.json({ data: dueCards });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load due cards.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sessionId = await getOrCreateSessionId();
    const body = (await request.json()) as {
      cardId?: string;
      rating?: Rating;
      timeTakenMs?: number;
    };

    if (!body.cardId || !body.rating || ![1, 2, 4, 5].includes(body.rating)) {
      return NextResponse.json({ error: "Valid cardId and rating are required." }, { status: 400 });
    }

    const result = await recordFlashcardReview(sessionId, {
      cardId: body.cardId,
      rating: body.rating,
      timeTakenMs: body.timeTakenMs,
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save review result.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
