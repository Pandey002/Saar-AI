import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/extract-file/route";

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
});
