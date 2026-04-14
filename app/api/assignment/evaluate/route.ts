import { NextResponse } from "next/server";
import { buildAssignmentPerformanceLogs } from "@/lib/performance/logging";
import { getOrCreateSessionId } from "@/lib/serverSession";
import { evaluateAssignment } from "@/services/aiService";
import type { AssignmentSubmission, LanguageMode } from "@/types";

interface RequestBody {
  sourceText?: string;
  language?: LanguageMode;
  submissions?: AssignmentSubmission[];
}

export async function POST(request: Request) {
  try {
    const sessionId = await getOrCreateSessionId();
    const body = (await request.json()) as RequestBody;
    const sourceText = body.sourceText?.trim();
    const language = body.language ?? "english";
    const submissions = Array.isArray(body.submissions) ? body.submissions : [];

    if (!sourceText) {
      return NextResponse.json({ error: "Missing assignment topic for evaluation." }, { status: 400 });
    }

    if (submissions.length === 0) {
      return NextResponse.json(
        { error: "Please answer at least one question before submitting." },
        { status: 400 }
      );
    }

    const result = await evaluateAssignment(sourceText, language, submissions);
    const performanceLogs = buildAssignmentPerformanceLogs(sourceText, submissions, result.data);

    return NextResponse.json({ 
      ...result,
      performanceLogs 
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong while evaluating your assignment.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
