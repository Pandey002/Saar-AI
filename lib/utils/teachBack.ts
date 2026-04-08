import type { ExplanationResult, SummaryResult } from "@/types";

export function buildSummaryTeachBackContext(data: SummaryResult) {
  const parts = [
    `Title: ${data.title}`,
    data.introduction ? `Introduction: ${data.introduction}` : "",
    data.coreConcepts.length > 0 ? `Core concepts: ${data.coreConcepts.join("; ")}` : "",
    ...data.sections.map((section) =>
      [
        `Section: ${section.heading}`,
        section.paragraph,
        section.points.join("; "),
        ...section.subsections.map((subsection) => `${subsection.heading}: ${subsection.points.join("; ")}`),
      ]
        .filter(Boolean)
        .join(" | ")
    ),
  ];

  return parts.filter(Boolean).join("\n");
}

export function buildExplanationTeachBackContext(data: ExplanationResult) {
  const parts = [
    `Title: ${data.title}`,
    data.introduction ? `Introduction: ${data.introduction}` : "",
    data.analogyCard?.explanation ? `Analogy: ${data.analogyCard.explanation}` : "",
    data.formulaBlock?.expression ? `Formula: ${data.formulaBlock.expression}` : "",
    data.keyTakeaways.length > 0 ? `Key takeaways: ${data.keyTakeaways.join("; ")}` : "",
    ...data.sections.map((section) =>
      [
        `Section: ${section.heading}`,
        section.paragraph,
        section.points.join("; "),
        ...section.subsections.map((subsection) => `${subsection.heading}: ${subsection.points.join("; ")}`),
      ]
        .filter(Boolean)
        .join(" | ")
    ),
  ];

  return parts.filter(Boolean).join("\n");
}
