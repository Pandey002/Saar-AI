import { NextResponse } from "next/server";
import { evaluateTeachBack } from "@/services/aiService";

interface RequestBody {
  originalTopicSummary?: string;
  studentExplanation?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const originalTopicSummary = body.originalTopicSummary?.trim();
    const studentExplanation = body.studentExplanation?.trim();

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
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong while checking the teach-back response.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
