import type { RealLifeExampleData, StudySection } from "@/types";

const REAL_LIFE_EXAMPLE_HEADING = /^real[- ]life example$/i;

function collectText(section: StudySection) {
  const subsectionPoints = section.subsections.flatMap((subsection) => subsection.points);

  return [section.paragraph, ...section.points, ...subsectionPoints]
    .map((item) => item.trim())
    .filter(Boolean)
    .join(" ");
}

export function extractRealLifeExamples(sections: StudySection[]): RealLifeExampleData[] {
  return sections
    .filter((section) => REAL_LIFE_EXAMPLE_HEADING.test(section.heading.trim()))
    .map((section) => ({
      title: section.heading.trim(),
      body: collectText(section),
    }))
    .filter((item) => item.body);
}

export function filterOutRealLifeExamples(sections: StudySection[]) {
  return sections.filter((section) => !REAL_LIFE_EXAMPLE_HEADING.test(section.heading.trim()));
}
