import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { extractStructuredNotesFromImage } from "@/services/ocrService";
import { extractStructuredNotesFromImages } from "@/services/ocrService";

const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024;
export const runtime = "nodejs";
export const maxDuration = 60; // Allow up to 60s for vision processing

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // 1. Handle Vision JSON Requests (base64 images from browser)
    if (contentType.includes("application/json")) {
      const { base64Images, isVision } = await request.json();
      
      if (isVision && base64Images?.length > 0) {
        const { extractTextFromVisionUrls } = await import("@/services/ocrService");
        try {
          const result = await extractTextFromVisionUrls(base64Images);
          return NextResponse.json({ 
            data: { 
              text: result.text, 
              title: result.structure.title,
              sourceKind: "document", 
              shouldAutoGenerate: false 
            } 
          });
        } catch (error: any) {
          console.error("Vision extraction error:", error);
          const message = error.message || "Unknown vision error";
          return NextResponse.json({ 
            error: `Vision extraction failed: ${message}. Check your Vercel Environment Variables and function logs.` 
          }, { status: 500 });
        }
      }
    }

    // 2. Handle Traditional FormData Requests
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
      // Re-enabled for the free access period
      // return NextResponse.json({ error: "Image OCR is currently disabled (Billing limits). Please upload a text-based PDF or text file." }, { status: 400 });
      
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      try {
        const result = await extractStructuredNotesFromImage(buffer);
        return NextResponse.json({ data: { text: result.text, sourceKind: "document", shouldAutoGenerate: false } });
      } catch (ocrError) {
        console.error("OCR Error:", ocrError);
        return NextResponse.json({ error: "Failed to read image. Please ensure the photo is clear." }, { status: 500 });
      }
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
        let text = parsed.text?.trim() || "";

        // Text Cleaning: Remove extra spaces and normalize line breaks
        text = text
          .replace(/[ \t]+/g, " ")             // Replace multiple spaces/tabs with single space
          .replace(/\n{3,}/g, "\n\n")         // Normalize 3+ newlines to double newlines
          .replace(/^ +| +$/gm, "");           // Trim trailing spaces on each line

        // Limit Handling: Truncate at 250,000 characters (approx 100 pages)
        if (text.length > 250000) {
          text = text.slice(0, 250000) + "\n\n[...Text truncated due to 100-page limit...]";
        }

        if (text.length > 50) {
          return NextResponse.json({ data: { text, sourceKind: "document", shouldAutoGenerate: false } });
        }
        
        return NextResponse.json({ error: "This PDF appears to be scanned or unreadable. Please upload a text-based PDF." }, { status: 400 });
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
