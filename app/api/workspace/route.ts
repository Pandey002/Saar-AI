import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  clearWorkspaceCollection,
  createWorkspaceSessionId,
  getWorkspaceSnapshot,
  recordWorkspaceEntry,
} from "@/lib/workspace/store";
import type { LanguageMode, StudyMode } from "@/types";

const SESSION_COOKIE = "saar_workspace_session";

async function getOrCreateSessionId() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(SESSION_COOKIE)?.value;

  if (existing) {
    return existing;
  }

  const sessionId = createWorkspaceSessionId();
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
  const sessionId = await getOrCreateSessionId();
  const snapshot = await getWorkspaceSnapshot(sessionId);
  return NextResponse.json({ data: snapshot });
}

export async function POST(request: Request) {
  const sessionId = await getOrCreateSessionId();
  const body = (await request.json()) as {
    title?: string;
    introduction?: string;
    sourceText?: string;
    language?: LanguageMode;
    mode?: StudyMode;
    resultData?: unknown;
  };

  if (!body.sourceText?.trim()) {
    return NextResponse.json({ error: "Missing source text for workspace save." }, { status: 400 });
  }

  if (!body.mode || !["summary", "explain", "assignment", "revision", "solve"].includes(body.mode)) {
    return NextResponse.json({ error: "Invalid workspace mode." }, { status: 400 });
  }

  const snapshot = await recordWorkspaceEntry(sessionId, {
    title: body.title,
    introduction: body.introduction,
    sourceText: body.sourceText.trim(),
    language: body.language ?? "english",
    mode: body.mode,
    resultData: body.resultData,
  });

  return NextResponse.json({ data: snapshot });
}

export async function DELETE(request: Request) {
  const sessionId = await getOrCreateSessionId();
  const { searchParams } = new URL(request.url);
  const collection = searchParams.get("collection");

  if (collection !== "history" && collection !== "library") {
    return NextResponse.json({ error: "Invalid workspace collection." }, { status: 400 });
  }

  const snapshot = await clearWorkspaceCollection(sessionId, collection);
  return NextResponse.json({ data: snapshot });
}
