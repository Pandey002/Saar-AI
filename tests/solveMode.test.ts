import { describe, expect, it } from "vitest";
import { solvePrompt } from "@/lib/ai/prompts";
import { __testUtils } from "@/services/aiService";

describe("solve mode", () => {
  it("includes the adaptive solve instructions in the prompt", () => {
    const prompt = solvePrompt("Ek block ka acceleration nikalo", "hinglish");

    expect(prompt).toContain("You are Vidya's Solve engine");
    expect(prompt).toContain('"topicType"');
    expect(prompt).toContain("Do NOT use math/physics structure for history");
  });

  it("normalizes solve results into the UI shape", () => {
    const result = __testUtils.normalizeSolveResult(
      {
        topicType: "physics",
        difficulty: "medium",
        estimatedMarks: 5,
        sections: [
          {
            id: "formula",
            title: "Equation used",
            content: "F = ma",
            type: "formula",
          },
          {
            id: "steps",
            title: "Solution steps",
            content: "1. Rearrange the formula\n2. Substitute the values\n3. Compute acceleration",
            type: "steps",
          },
        ],
        relatedTopics: ["Newton's Second Law", "Force and Motion"],
        confidenceCheck: "Can you derive acceleration from force and mass again on your own?",
      },
      "A 2kg block has force 10N. Find acceleration."
    );

    expect(result.topicType).toBe("physics");
    expect(result.sections[0]?.type).toBe("formula");
    expect(result.sections[1]?.type).toBe("steps");
    expect(result.confidenceCheck).toContain("acceleration");
  });
});
