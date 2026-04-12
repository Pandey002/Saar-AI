import { describe, expect, it } from "vitest";
import { analyzePerformance } from "@/lib/performance/analyze";
import type { PerformanceLogEntry } from "@/types";

function createLog(overrides: Partial<PerformanceLogEntry>): PerformanceLogEntry {
  return {
    id: `log-${Math.random()}`,
    userId: "user-1",
    source: "mocktest",
    topic: "Electrostatics",
    concepts: ["Coulomb's Law"],
    questionId: "q1",
    questionText: "Solve a Coulomb's law numerical.",
    questionType: "mcq",
    difficulty: "medium",
    userAnswer: "A",
    correctAnswer: "B",
    isCorrect: false,
    score: 0,
    maxScore: 4,
    timeTakenSeconds: 90,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

describe("analyzePerformance", () => {
  it("marks weak topics and concepts from repeated low-accuracy mistakes", () => {
    const snapshot = analyzePerformance([
      createLog({ questionId: "q1" }),
      createLog({ questionId: "q2", questionText: "Numerical application of Coulomb's law" }),
      createLog({ questionId: "q3", questionText: "Conceptual question on electric force" }),
      createLog({
        questionId: "q4",
        questionType: "analytical",
        difficulty: "hard",
        questionText: "Explain Coulomb's law with derivation",
      }),
    ]);

    expect(snapshot.weakTopics[0]?.topic).toBe("Electrostatics");
    expect(snapshot.weakConcepts.some((item) => item.concept.includes("Coulomb"))).toBe(true);
    expect(snapshot.improvementNeededIn).toBe("Electrostatics");
  });
});
