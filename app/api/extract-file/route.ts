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
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const result = await extractStructuredNotesFromImage(buffer);

        return NextResponse.json({
          data: {
            text: result.text,
            ocrText: result.ocrText,
            title: result.structure.title,
            sourceKind: "image",
            shouldAutoGenerate: true,
            structure: result.structure,
            imageHash: result.imageHash,
          },
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Couldn’t clearly read the image. Try uploading a clearer photo.";

        return NextResponse.json({ error: message }, { status: 500 });
      }
    }

    if (lowerName.endsWith(".pdf") || file.type === "application/pdf") {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const pdfHash = createHash("sha256").update(buffer).digest("hex");

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

        if (text && text.replace(/\s+/g, " ").trim().length >= 120) {
          return NextResponse.json({ data: { text, sourceKind: "document", shouldAutoGenerate: false } });
        }
      } catch (error) {
        void error;
      }

      try {
        const { renderPdfPagesToImages } = await import("@/lib/ocr/pdfToImages");
        const images = await renderPdfPagesToImages(buffer);
        const result = await extractStructuredNotesFromImages(images, pdfHash);

        return NextResponse.json({
          data: {
            text: result.text,
            ocrText: result.ocrText,
            title: result.structure.title,
            sourceKind: "image",
            shouldAutoGenerate: true,
            structure: result.structure,
            imageHash: result.imageHash,
          },
        });
      } catch (error) {
        const message = getPdfOcrErrorMessage(error);

        return NextResponse.json({ error: message }, { status: 500 });
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

export function getPdfOcrErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Couldn’t clearly read the PDF. Try uploading a clearer scan.";
  }

  const normalizedMessage = error.message.toLowerCase();

  if (
    normalizedMessage.includes("native binding") ||
    normalizedMessage.includes("module did not self-register") ||
    normalizedMessage.includes("cannot find module '@napi-rs/canvas") ||
    normalizedMessage.includes("cannot find module 'sharp'")
  ) {
    return "Scanned PDF OCR dependencies are not available on the server yet. Typed PDFs still work, and image note uploads are supported.";
  }

  if (
    normalizedMessage.includes("default credentials") ||
    normalizedMessage.includes("google_cloud_vision_credentials_json")
  ) {
    return "Google Cloud Vision OCR is not configured yet. Add the Vision credentials and try the PDF again.";
  }

  return error.message;
}
