import { NextResponse } from "next/server";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

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

        if (!text) {
          return NextResponse.json(
            { error: "No readable text was found in the PDF." },
            { status: 400 }
          );
        }

        return NextResponse.json({ data: { text } });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to extract text from the uploaded PDF.";

        return NextResponse.json({ error: message }, { status: 500 });
      }
    }

    const text = await file.text();
    if (!text.trim()) {
      return NextResponse.json({ error: "Uploaded file is empty." }, { status: 400 });
    }

    return NextResponse.json({ data: { text } });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to process the uploaded file.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
