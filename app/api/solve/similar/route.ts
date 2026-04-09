import { NextResponse } from "next/server";
import { generateSimilarSolveProblem } from "@/services/aiService";
import type { LanguageMode, SolveDifficulty, TopicType } from "@/types";

interface RequestBody {
  sourceText?: string;
  topicType?: TopicType;
  difficulty?: SolveDifficulty;
  language?: LanguageMode;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const sourceText = body.sourceText?.trim();

    if (!sourceText) {
      return NextResponse.json({ error: "Missing original problem for similar generation." }, { status: 400 });
    }

    const topicType = body.topicType ?? "general";
    const difficulty = body.difficulty ?? "medium";
    const language = body.language ?? "english";
    const result = await generateSimilarSolveProblem(sourceText, topicType, difficulty, language);

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to generate a similar problem.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
