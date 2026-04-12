import { NextResponse } from "next/server";
import { cacheWeakAreaRevisionPack, getCachedWeakAreaRevisionPack } from "@/lib/performance/store";
import { getOrCreateSessionId } from "@/lib/serverSession";
import { generateWeakAreaRevision } from "@/services/aiService";
import type { LanguageMode, PerformanceQuestionType } from "@/types";

interface RequestBody {
  topic?: string;
  language?: LanguageMode;
  weakConcepts?: string[];
  weakQuestionTypes?: PerformanceQuestionType[];
  reason?: string;
}

export async function POST(request: Request) {
  try {
    const sessionId = await getOrCreateSessionId();
    const body = (await request.json()) as RequestBody;
    const topic = body.topic?.trim();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required to generate targeted revision." }, { status: 400 });
    }

    const cached = await getCachedWeakAreaRevisionPack(sessionId, topic);
    if (cached) {
      return NextResponse.json({ data: cached });
    }

    const result = await generateWeakAreaRevision(
      topic,
      body.language ?? "english",
      Array.isArray(body.weakConcepts) ? body.weakConcepts : [],
      Array.isArray(body.weakQuestionTypes) ? body.weakQuestionTypes : [],
      body.reason?.trim() || "This area was detected as weak from repeated mistakes and low accuracy."
    );

    await cacheWeakAreaRevisionPack(sessionId, topic, result.data);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate targeted revision.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
