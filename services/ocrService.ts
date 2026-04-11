import { createHash } from "node:crypto";
import { createChatCompletion } from "@/lib/ai/client";
import { handwrittenNotesStructuringPrompt } from "@/lib/ai/prompts";
import { extractDocumentTextFromImage } from "@/lib/ocr/googleVision";
import { preprocessNotesImage } from "@/lib/ocr/preprocessImage";

export interface StructuredNotesResult {
  title: string;
  introduction: string;
  sections: Array<{
    heading: string;
    points: string[];
  }>;
  keyConcepts: string[];
  formulas: string[];
  diagramExplanation: string;
  cleanedText: string;
}

export interface ExtractedNotesPayload {
  text: string;
  ocrText: string;
  structure: StructuredNotesResult;
  imageHash: string;
}

const imageOcrCache = new Map<string, ExtractedNotesPayload>();

export async function extractStructuredNotesFromImage(imageBuffer: Buffer) {
  const imageHash = createHash("sha256").update(imageBuffer).digest("hex");
  const cached = imageOcrCache.get(imageHash);

  if (cached) {
    return { ...cached, fromCache: true };
  }

  const preprocessed = await preprocessNotesImage(imageBuffer);
  const ocrResult = await extractDocumentTextFromImage(preprocessed);
  const ocrText = ocrResult.fullTextAnnotation?.text?.trim() ?? "";

  if (!ocrText) {
    throw new Error("Couldn’t clearly read the image. Try uploading a clearer photo.");
  }

  const structured = await structureHandwrittenNotes(ocrText);
  const payload: ExtractedNotesPayload = {
    text: formatStructuredNotesAsSource(structured),
    ocrText,
    structure: structured,
    imageHash,
  };

  imageOcrCache.set(imageHash, payload);
  return { ...payload, fromCache: false };
}

export async function structureOcrText(ocrText: string, cacheKey?: string) {
  const normalizedKey = cacheKey?.trim();
  if (normalizedKey) {
    const cached = imageOcrCache.get(normalizedKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }
  }

  if (!ocrText.trim()) {
    throw new Error("Couldn’t clearly read the image. Try uploading a clearer photo.");
  }

  const structure = await structureHandwrittenNotes(ocrText);
  const payload: ExtractedNotesPayload = {
    text: formatStructuredNotesAsSource(structure),
    ocrText,
    structure,
    imageHash: normalizedKey ?? "",
  };

  if (normalizedKey) {
    imageOcrCache.set(normalizedKey, payload);
  }

  return { ...payload, fromCache: false };
}

export async function extractStructuredNotesFromImages(imageBuffers: Buffer[], cacheKey?: string) {
  const ocrChunks: string[] = [];

  for (const imageBuffer of imageBuffers) {
    const preprocessed = await preprocessNotesImage(imageBuffer);
    const ocrResult = await extractDocumentTextFromImage(preprocessed);
    const ocrText = ocrResult.fullTextAnnotation?.text?.trim() ?? "";

    if (ocrText) {
      ocrChunks.push(ocrText);
    }
  }

  return structureOcrText(ocrChunks.join("\n\n"), cacheKey);
}

async function structureHandwrittenNotes(ocrText: string) {
  const result = await createChatCompletion(handwrittenNotesStructuringPrompt(ocrText));
  const parsed = JSON.parse(result.content) as Partial<StructuredNotesResult>;

  const sections = Array.isArray(parsed.sections)
    ? parsed.sections
        .map((section) => ({
          heading: typeof section?.heading === "string" ? section.heading.trim() : "",
          points: Array.isArray(section?.points)
            ? section.points.filter((point): point is string => typeof point === "string" && point.trim().length > 0)
            : [],
        }))
        .filter((section) => section.heading || section.points.length > 0)
    : [];

  return {
    title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : "Handwritten Notes",
    introduction:
      typeof parsed.introduction === "string" && parsed.introduction.trim()
        ? parsed.introduction.trim()
        : "Cleaned and organized from handwritten notes.",
    sections,
    keyConcepts: Array.isArray(parsed.keyConcepts)
      ? parsed.keyConcepts.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [],
    formulas: Array.isArray(parsed.formulas)
      ? parsed.formulas.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [],
    diagramExplanation:
      typeof parsed.diagramExplanation === "string" ? parsed.diagramExplanation.trim() : "",
    cleanedText: typeof parsed.cleanedText === "string" ? parsed.cleanedText.trim() : ocrText,
  };
}

function formatStructuredNotesAsSource(structure: StructuredNotesResult) {
  const blocks = [
    structure.title,
    structure.introduction,
    structure.sections
      .map((section) => `${section.heading}\n${section.points.map((point) => `- ${point}`).join("\n")}`)
      .join("\n\n"),
    structure.keyConcepts.length > 0 ? `Key Concepts\n${structure.keyConcepts.map((item) => `- ${item}`).join("\n")}` : "",
    structure.formulas.length > 0 ? `Formulas\n${structure.formulas.map((item) => `- ${item}`).join("\n")}` : "",
    structure.diagramExplanation ? `Diagram Explanation\n- ${structure.diagramExplanation}` : "",
    structure.cleanedText ? `Clean OCR Notes\n${structure.cleanedText}` : "",
  ].filter(Boolean);

  return blocks.join("\n\n");
}
