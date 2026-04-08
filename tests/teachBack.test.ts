import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/teach-back/evaluate/route";
import { teachBackEvaluationPrompt } from "@/lib/ai/prompts";
import { __testUtils } from "@/services/aiService";

describe("teach-back evaluation", () => {
  it("includes the supportive teach-back evaluation prompt contract", () => {
    const prompt = teachBackEvaluationPrompt("Osmosis is movement of water.", "Water moves into the raisin.");

    expect(prompt).toContain("The student just studied:");
    expect(prompt).toContain('"score": 0');
    expect(prompt).toContain("same language the student used");
  });

  it("normalizes teach-back evaluation results", () => {
    const result = __testUtils.normalizeTeachBackEvaluationResult({
      score: 88.4,
      understood_well: ["Definition of osmosis"],
      gaps: ["Why water moves across the membrane"],
      misconceptions: [],
      feedback: "You explained the core idea well.",
      next_step: "Review concentration difference once more.",
    });

    expect(result.score).toBe(88);
    expect(result.understoodWell).toEqual(["Definition of osmosis"]);
    expect(result.gaps).toEqual(["Why water moves across the membrane"]);
  });

  it("returns 400 when the teach-back payload is incomplete", async () => {
    const request = new Request("http://localhost/api/teach-back/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originalTopicSummary: "Osmosis summary" }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toMatch(/explain the topic in your own words/i);
  });
});
