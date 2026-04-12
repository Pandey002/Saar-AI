import { NextResponse } from "next/server";
import { buildTeachBackPerformanceLog } from "@/lib/performance/logging";
import { recordPerformanceLogs } from "@/lib/performance/store";
import { getOrCreateSessionId } from "@/lib/serverSession";
import { evaluateTeachBack } from "@/services/aiService";

interface RequestBody {
  originalTopicSummary?: string;
  studentExplanation?: string;
  topicTitle?: string;
}

export async function POST(request: Request) {
  try {
    const sessionId = await getOrCreateSessionId();
    const body = (await request.json()) as RequestBody;
    const originalTopicSummary = body.originalTopicSummary?.trim();
    const studentExplanation = body.studentExplanation?.trim();
    const topicTitle = body.topicTitle?.trim() || originalTopicSummary?.split("\n")[0]?.slice(0, 80) || "Revision Topic";

    if (!originalTopicSummary) {
      return NextResponse.json(
        { error: "Missing study summary for teach-back evaluation." },
        { status: 400 }
      );
    }

    if (!studentExplanation) {
      return NextResponse.json(
        { error: "Please explain the topic in your own words before checking understanding." },
        { status: 400 }
      );
    }

    const result = await evaluateTeachBack(originalTopicSummary, studentExplanation);
    await recordPerformanceLogs(sessionId, [
      buildTeachBackPerformanceLog(topicTitle, studentExplanation, result.data),
    ]);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong while checking the teach-back response.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
