import { NextResponse } from "next/server";
import {
  AmbiguousInputError,
  RubbishInputError,
  generateAssignment,
  generateConceptDependencies,
  generateExplanation,
  generateExplanationCore,
  generateExplanationExtra,
  generateExplanationExams,
  generateMockTest,
  generateRevision,
  generateSolve,
  generateSummary,
  generateSummaryCore,
  generateSummaryExtra,
  generateSummaryExams,
  streamSummaryCore,
  streamSummaryExtra,
  streamSummaryExams,
  streamExplanationCore,
  streamExplanationExtra,
  toClarificationPrompt
} from "@/services/aiService";
import { countDailyGenerations } from "@/lib/workspace/store";
import { getOrCreateSessionId } from "@/lib/serverSession";
import { createClient } from "@/lib/supabase/server";
import type { LanguageMode, StudyRequestMode } from "@/types";

interface RequestBody {
  sourceText?: string;
  mode?: StudyRequestMode;
  subMode?: "core" | "extra" | "exams";
  language?: LanguageMode;
  isSource?: boolean;
  stream?: boolean;
}

export async function POST(request: Request) {
  try {
    const sessionId = await getOrCreateSessionId();
    
    // Check if user is admin to bypass limits
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const isAdmin = user?.email === "hkbatish592002@gmail.com";
    
    const body = (await request.json()) as RequestBody;
    const subMode = body.subMode;
    const isCoreRequest = !subMode || subMode === "core";

    // Daily quota check: Max 5 topics per day (bypassed for Admin)
    // Only check quota for core requests to allow parallel loading of extra content
    if (isCoreRequest) {
      const usageCount = await countDailyGenerations(sessionId);
      if (usageCount >= 5 && !isAdmin) {
        return NextResponse.json(
          { error: "Sorry... you've used your 5 free topics for today! Come back tomorrow to continue your journey to the top!" },
          { status: 429 }
        );
      }
    }

    const sourceText = body.sourceText?.trim();
    const mode = body.mode;
    const language = body.language ?? "english";
    const isSource = !!body.isSource;

    if (!sourceText) {
      return NextResponse.json(
        { error: "Please provide notes or a topic for generation." },
        { status: 400 }
      );
    }

    if (sourceText.length > 15000) {
      return NextResponse.json(
        { error: "The input text is too long (over 15,000 characters). Please provide a shorter excerpt or summary." },
        { status: 400 }
      );
    }

    if (!mode || !["summary", "explain", "assignment", "revision", "solve", "mocktest", "dependencies"].includes(mode)) {
      return NextResponse.json({ error: "Invalid mode selected." }, { status: 400 });
    }

    const shouldStream = !!body.stream;

    if (shouldStream) {
      let streamPromise: Promise<ReadableStream<string>>;
      
      if (mode === "summary") {
        if (subMode === "core") streamPromise = streamSummaryCore(sourceText, language, isSource);
        else if (subMode === "extra") streamPromise = streamSummaryExtra(sourceText, language);
        else if (subMode === "exams") streamPromise = streamSummaryExams(sourceText, language);
        else streamPromise = streamSummaryCore(sourceText, language, isSource); // fallback
      } else if (mode === "explain") {
        if (subMode === "core") streamPromise = streamExplanationCore(sourceText, language, isSource);
        else if (subMode === "extra") streamPromise = streamExplanationExtra(sourceText, language);
        else if (subMode === "exams") streamPromise = streamSummaryExams(sourceText, language);
        else streamPromise = streamExplanationCore(sourceText, language, isSource); // fallback
      } else {
        return NextResponse.json({ error: "Streaming not supported for this mode." }, { status: 400 });
      }

      try {
        const aiStream = await streamPromise;
        const encoder = new TextEncoder();
        
        const responseStream = new ReadableStream({
          async start(controller) {
            const reader = aiStream.getReader();
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                // SSE format: data: <chunk>\n\n
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: value })}\n\n`));
              }
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            } catch (err) {
              controller.error(err);
            } finally {
              controller.close();
            }
          }
        });

        return new Response(responseStream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
          }
        });
      } catch (streamError) {
        console.error("Streaming error:", streamError);
        return NextResponse.json({ error: "Streaming initialization failed." }, { status: 500 });
      }
    }

    if (mode === "summary") {
      if (subMode === "core") {
        const result = await generateSummaryCore(sourceText, language, isSource);
        return NextResponse.json(result);
      }
      if (subMode === "extra") {
        const result = await generateSummaryExtra(sourceText, language, isSource);
        return NextResponse.json(result);
      }
      if (subMode === "exams") {
        const result = await generateSummaryExams(sourceText, language, isSource);
        return NextResponse.json(result);
      }
      const result = await generateSummary(sourceText, language, isSource);
      return NextResponse.json(result);
    }

    if (mode === "explain") {
      if (subMode === "core") {
        const result = await generateExplanationCore(sourceText, language, isSource);
        return NextResponse.json(result);
      }
      if (subMode === "extra") {
        const result = await generateExplanationExtra(sourceText, language);
        return NextResponse.json(result);
      }
      if (subMode === "exams") {
        const result = await generateExplanationExams(sourceText, language, isSource);
        return NextResponse.json(result);
      }
      const result = await generateExplanation(sourceText, language, isSource);
      return NextResponse.json(result);
    }

    if (mode === "revision") {
      const result = await generateRevision(sourceText, language);
      return NextResponse.json(result);
    }

    if (mode === "dependencies") {
      const result = await generateConceptDependencies(sourceText, language);
      return NextResponse.json(result);
    }

    if (mode === "solve") {
      const result = await generateSolve(sourceText, language);
      return NextResponse.json(result);
    }

    if (mode === "mocktest") {
      const difficulty = (body as any).difficulty ?? "medium";
      const testMode = (body as any).testMode ?? "standard";
      const durationMinutes = (body as any).durationMinutes ?? 60;
      const result = await generateMockTest(sourceText, language, difficulty, testMode, durationMinutes);
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
