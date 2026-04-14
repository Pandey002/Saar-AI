import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { extractStructuredNotesFromImage } from "@/services/ocrService";
import { extractStructuredNotesFromImages } from "@/services/ocrService";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file upload." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Uploaded file exceeds the 10MB limit." },
        { status: 400 }
      );
    }

    const lowerName = file.name.toLowerCase();

    if (file.type.startsWith("image/") || [".png", ".jpg", ".jpeg"].some((extension) => lowerName.endsWith(extension))) {
      return NextResponse.json({ error: "Image OCR is currently disabled (Billing limits). Please upload a text-based PDF or text file." }, { status: 400 });
    }

    if (lowerName.endsWith(".pdf") || file.type === "application/pdf") {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      try {
        const pdfParseModule = (await import("pdf-parse")) as unknown as {
          default?: (dataBuffer: Buffer) => Promise<{ text?: string }>;
        };
        const parsePdf = pdfParseModule.default;

        if (!parsePdf) {
          throw new Error("PDF parser is not available.");
        }

        const parsed = await parsePdf(buffer);
        const text = parsed.text?.trim();

        if (text && text.length > 5) {
          return NextResponse.json({ data: { text, sourceKind: "document", shouldAutoGenerate: false } });
        }
        
        return NextResponse.json({ error: "No readable text found in PDF. Scanned PDFs require OCR, which is currently disabled." }, { status: 400 });
      } catch (error) {
        return NextResponse.json({ error: "Failed to parse PDF file. Ensure it is a valid text-based PDF." }, { status: 500 });
      }
    }

    const text = await file.text();
    if (!text.trim()) {
      return NextResponse.json({ error: "Uploaded file is empty." }, { status: 400 });
    }

    return NextResponse.json({ data: { text, sourceKind: "document", shouldAutoGenerate: false } });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to process the uploaded file.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export function getPdfOcrErrorMessage(error: Error): string {
  const message = error.message.toLowerCase();
  
  if (message.includes("napi-rs/canvas")) {
    return "Scanned PDF OCR dependencies are not available in this environment. Please use a text-based PDF.";
  }
  
  if (message.includes("credentials") || message.includes("google cloud vision")) {
    return "Google Cloud Vision OCR is not configured yet. Please check your service account credentials.";
  }
  
  return error.message;
}
