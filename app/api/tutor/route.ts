import { NextResponse } from "next/server";
import { createChatCompletion } from "@/lib/ai/client";
import { tutorPrompt } from "@/lib/ai/prompts";
import type { LanguageMode } from "@/types";

interface RequestBody {
  topic?: string;
  sourceText?: string;
  question?: string;
  language?: LanguageMode;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const topic = body.topic?.trim() ?? "";
    const sourceText = body.sourceText?.trim() ?? "";
    const question = body.question?.trim();
    const language = body.language ?? "english";

    if (!question) {
      return NextResponse.json({ error: "Please ask Adhyapak a question first." }, { status: 400 });
    }

    const result = await createChatCompletion(tutorPrompt(question, topic, sourceText, language));
    const parsed = JSON.parse(result.content) as { reply?: unknown };
    const reply = typeof parsed.reply === "string" ? parsed.reply.trim() : "";

    if (!reply) {
      throw new Error("Tutor response was empty.");
    }

    return NextResponse.json({
      data: {
        reply,
      },
      provider: result.provider,
      model: result.model,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong while asking Adhyapak.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
