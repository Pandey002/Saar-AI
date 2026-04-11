import { describe, expect, it } from "vitest";
import { POST, getPdfOcrErrorMessage } from "@/app/api/extract-file/route";

describe("/api/extract-file", () => {
  it("returns 400 when the file upload is missing", async () => {
    const request = new Request("http://localhost/api/extract-file", {
      method: "POST",
      body: new FormData(),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toMatch(/missing file upload/i);
  });

  it("maps missing native PDF dependencies to a clear scanned-PDF message", () => {
    const message = getPdfOcrErrorMessage(new Error("Failed to load native binding for @napi-rs/canvas"));

    expect(message).toMatch(/scanned pdf ocr dependencies are not available/i);
  });

  it("maps missing Google Vision credentials to a clear OCR configuration message", () => {
    const message = getPdfOcrErrorMessage(
      new Error("Could not load the default credentials. Browse to https://cloud.google.com/docs/authentication/getting-started for more information.")
    );

    expect(message).toMatch(/google cloud vision ocr is not configured yet/i);
  });
});
