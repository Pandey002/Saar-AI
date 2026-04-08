import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/study/route";

describe("/api/study", () => {
  it("returns 400 when sourceText is missing", async () => {
    const request = new Request("http://localhost/api/study", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "summary", language: "english" }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toMatch(/provide notes or a topic/i);
  });

  it("returns 400 when mode is invalid", async () => {
    const request = new Request("http://localhost/api/study", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceText: "momentum", mode: "invalid", language: "english" }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toMatch(/invalid mode/i);
  });
});
