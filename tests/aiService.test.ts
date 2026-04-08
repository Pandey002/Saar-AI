import { describe, expect, it } from "vitest";
import { AmbiguousInputError, RubbishInputError, __testUtils } from "@/services/aiService";

describe("aiService normalization", () => {
  it("normalizes summary responses with fallback concept cards", () => {
    const result = __testUtils.normalizeSummaryResult({
      title: "Electrostatics",
      introduction: "Charge interaction basics.",
      coreConcepts: ["Electric field: Region around a charge"],
      sections: [{ heading: "Definition", paragraph: "Study of charges.", points: [], subsections: [] }],
      relatedTopics: ["Coulomb's Law", "Electric Potential", "Capacitance"],
    });

    expect(result.concepts).toEqual([
      { title: "Electric field", explanation: "Region around a charge" },
    ]);
    expect(result.visualBlock?.title).toBeTruthy();
  });

  it("rejects rubbish and ambiguous structured responses", () => {
    expect(() =>
      __testUtils.parseStructuredResponse('{ "isRubbish": true }')
    ).toThrow(RubbishInputError);

    expect(() =>
      __testUtils.parseStructuredResponse('{ "isAmbiguous": true, "clarificationOptions": ["AI", "Artificial Insemination"] }')
    ).toThrow(AmbiguousInputError);
  });

  it("builds assignment fallback sections when the model response is incomplete", () => {
    const result = __testUtils.normalizeAssignmentResult(
      {
        title: "",
        introduction: "",
        coreConcepts: [],
        instructionList: [],
        sectionGroups: [],
        relatedTopics: [],
      },
      "gravitation"
    );

    expect(result.sectionGroups).toHaveLength(2);
    expect(result.sectionGroups[0]?.questions).toHaveLength(5);
    expect(result.sectionGroups[1]?.questions).toHaveLength(3);
    expect(result.markingScheme).toHaveLength(3);
  });
});
