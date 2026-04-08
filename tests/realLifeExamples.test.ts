import { describe, expect, it } from "vitest";
import { explanationPrompt, summaryPrompt } from "@/lib/ai/prompts";
import { extractRealLifeExamples, filterOutRealLifeExamples } from "@/lib/utils/realLifeExamples";

describe("real-life examples", () => {
  it("includes the real-life example instruction in summary and explain prompts", () => {
    const summary = summaryPrompt("osmosis", "english");
    const explain = explanationPrompt("gdp", "english");

    expect(summary).toContain("After explaining each concept, always add a section called 'Real-life example'");
    expect(explain).toContain("After explaining each concept, always add a section called 'Real-life example'");
  });

  it("extracts real-life example sections and removes them from the main section flow", () => {
    const sections = [
      {
        heading: "Definition",
        paragraph: "What the concept means.",
        points: [],
        subsections: [],
      },
      {
        heading: "Real-life example",
        paragraph: "Think of a crowded Mumbai local train at rush hour.",
        points: ["Movement slows because too many people are pushing through."],
        subsections: [],
      },
    ];

    expect(extractRealLifeExamples(sections)).toEqual([
      {
        title: "Real-life example",
        body: "Think of a crowded Mumbai local train at rush hour. Movement slows because too many people are pushing through.",
      },
    ]);
    expect(filterOutRealLifeExamples(sections)).toHaveLength(1);
    expect(filterOutRealLifeExamples(sections)[0]?.heading).toBe("Definition");
  });
});
