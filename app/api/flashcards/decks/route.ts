import { NextResponse } from "next/server";
import { getFlashcardDeckSummary } from "@/lib/flashcards/store";
import { getOrCreateSessionId } from "@/lib/serverSession";

export async function GET() {
  try {
    const sessionId = await getOrCreateSessionId();
    const snapshot = await getFlashcardDeckSummary(sessionId);
    return NextResponse.json({ data: snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load flashcards.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
