import { NextResponse } from "next/server";
import {
  AmbiguousInputError,
  RubbishInputError,
  generateAssignment,
  generateExplanation,
  generateMockTest,
  generateRevision,
  generateSolve,
  generateSummary,
  toClarificationPrompt
} from "@/services/aiService";
import type { LanguageMode, StudyMode } from "@/types";

interface RequestBody {
  sourceText?: string;
  mode?: StudyMode;
  language?: LanguageMode;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const sourceText = body.sourceText?.trim();
    const mode = body.mode;
    const language = body.language ?? "english";

    if (!sourceText) {
      return NextResponse.json(
        { error: "Please provide notes or a topic for generation." },
        { status: 400 }
      );
    }

    if (!mode || !["summary", "explain", "assignment", "revision", "solve", "mocktest"].includes(mode)) {
      return NextResponse.json({ error: "Invalid mode selected." }, { status: 400 });
    }

    if (mode === "summary") {
      const result = await generateSummary(sourceText, language);
      return NextResponse.json(result);
    }

    if (mode === "explain") {
      const result = await generateExplanation(sourceText, language);
      return NextResponse.json(result);
    }

    if (mode === "revision") {
      const result = await generateRevision(sourceText, language);
      return NextResponse.json(result);
    }

    if (mode === "solve") {
      const result = await generateSolve(sourceText, language);
      return NextResponse.json(result);
    }

    if (mode === "mocktest") {
      const result = await generateMockTest(sourceText, language);
      return NextResponse.json(result);
    }

    const result = await generateAssignment(sourceText, language);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AmbiguousInputError) {
      return NextResponse.json({ clarification: toClarificationPrompt(error) }, { status: 200 });
    }

    if (error instanceof RubbishInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const message =
      error instanceof Error ? error.message : "Something went wrong while processing your request.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
