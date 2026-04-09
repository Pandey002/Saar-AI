import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getFlashcardDeckSummary } from "@/lib/flashcards/store";

const SESSION_COOKIE = "saar_workspace_session";

async function getOrCreateSessionId() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(SESSION_COOKIE)?.value;

  if (existing) {
    return existing;
  }

  const sessionId = crypto.randomUUID();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return sessionId;
}

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
