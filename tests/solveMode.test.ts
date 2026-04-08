import { describe, expect, it } from "vitest";
import { solvePrompt } from "@/lib/ai/prompts";
import { __testUtils } from "@/services/aiService";

describe("solve mode", () => {
  it("includes the step-by-step solve instructions in the prompt", () => {
    const prompt = solvePrompt("Ek block ka acceleration nikalo", "hinglish");

    expect(prompt).toContain("Walk through the solution step by step");
    expect(prompt).toContain('"problem_restatement"');
    expect(prompt).toContain("If the student writes the problem in Hinglish, answer in Hinglish");
  });

  it("normalizes solve results into the UI shape", () => {
    const result = __testUtils.normalizeSolveResult({
      problem_restatement: "Find the acceleration of the block.",
      given: ["Force = 10 N", "Mass = 2 kg"],
      formula_used: "F = ma",
      steps: [
        {
          step_number: 1,
          action: "Rearrange the formula",
          working: "a = F / m = 10 / 2",
          result: "a = 5 m/s^2",
        },
      ],
      final_answer: "5 m/s^2",
      common_mistakes: ["Using m = F / a by mistake"],
    });

    expect(result.formulaUsed).toBe("F = ma");
    expect(result.steps[0]?.stepNumber).toBe(1);
    expect(result.finalAnswer).toBe("5 m/s^2");
  });
});
