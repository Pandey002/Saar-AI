import { NextResponse } from "next/server";
import { createChatCompletion } from "@/lib/ai/client";
import { generateFlashcardDeck } from "@/lib/flashcards/store";
import { getOrCreateSessionId } from "@/lib/serverSession";
import type { FlashcardType, LanguageMode } from "@/types";

function parseCards(raw: string) {
  const parsed = JSON.parse(raw) as { cards?: Array<Record<string, unknown>> };
  const cards = Array.isArray(parsed.cards) ? parsed.cards : [];

  return cards
    .map((card) => ({
      front: String(card.front ?? "").trim(),
      back: String(card.back ?? "").trim(),
      type: (["concept", "formula", "date", "process", "definition"].includes(String(card.type))
        ? String(card.type)
        : "concept") as FlashcardType,
      tags: Array.isArray(card.tags) ? card.tags.map((tag) => String(tag)) : [],
    }))
    .filter((card) => card.front && card.back)
    .slice(0, 12);
}

export async function POST(request: Request) {
  try {
    const sessionId = await getOrCreateSessionId();
    const body = (await request.json()) as {
      topic?: string;
      sourceContent?: string;
      language?: LanguageMode;
      examTarget?: string;
    };

    if (!body.topic?.trim() || !body.sourceContent?.trim()) {
      return NextResponse.json({ error: "Topic and source content are required." }, { status: 400 });
    }

    const language = body.language ?? "english";
    const examTarget = body.examTarget?.trim() || "school exams";

    const prompt = `
Create 8-12 spaced repetition flashcards for an Indian student studying "${body.topic.trim()}" for ${examTarget}.

Source: ${body.sourceContent.trim()}

Rules:
- One concept per card only
- Front: a question or incomplete statement, never just a term
- Back: max 2-3 lines
- For formulas: front = "Formula for X?", back = formula + when to use it
- For processes: one card per step
- Language: ${language} (use Hinglish if specified - full Latin script, no Devanagari)
- type field: concept | formula | date | process | definition

Return only valid JSON:
{ "cards": [{ "front": "", "back": "", "type": "", "tags": [] }] }
`.trim();

    const result = await createChatCompletion(prompt);
    const cards = parseCards(result.content);

    if (cards.length === 0) {
      return NextResponse.json({ error: "Unable to generate flashcards for this topic." }, { status: 500 });
    }

    const createdDeckId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const createdAt = new Date().toISOString();

    return NextResponse.json({
      data: {
        deckId: createdDeckId,
        title: `${body.topic.trim()} Flashcards`,
        subject: body.topic.trim(),
        cards: cards,
        createdAt,
      },
      provider: result.provider,
      model: result.model,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate flashcards.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
