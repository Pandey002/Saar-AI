import { NextResponse } from "next/server";
import { buildMockTestPerformanceLogs } from "@/lib/performance/logging";
import { recordPerformanceLogs } from "@/lib/performance/store";
import { getOrCreateSessionId } from "@/lib/serverSession";
import { evaluateMockTest } from "@/services/aiService";
import type { LanguageMode, MockTestResult, MockTestSubmission } from "@/types";

interface RequestBody {
  sourceText?: string;
  language?: LanguageMode;
  test?: MockTestResult;
  submissions?: MockTestSubmission[];
  autoSubmitted?: boolean;
}

export async function POST(request: Request) {
  try {
    const sessionId = await getOrCreateSessionId();
    const body = (await request.json()) as RequestBody;
    const sourceText = body.sourceText?.trim();
    const language = body.language ?? "english";
    const test = body.test;
    const submissions = Array.isArray(body.submissions) ? body.submissions : [];
    const autoSubmitted = Boolean(body.autoSubmitted);

    if (!sourceText) {
      return NextResponse.json({ error: "Missing mock test topic for evaluation." }, { status: 400 });
    }

    if (!test) {
      return NextResponse.json({ error: "Missing mock test payload." }, { status: 400 });
    }

    if (submissions.length === 0) {
      return NextResponse.json({ error: "Please answer at least one question before submitting." }, { status: 400 });
    }

    const result = await evaluateMockTest(sourceText, language, test, submissions, autoSubmitted);
    await recordPerformanceLogs(
      sessionId,
      buildMockTestPerformanceLogs(sourceText, submissions, result.data)
    );
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong while evaluating your mock test.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
