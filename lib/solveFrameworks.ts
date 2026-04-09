import type { LanguageMode, TopicType } from "@/types";

export interface SolveFrameworkSection {
  id: string;
  title: string;
}

export interface SolveFramework {
  label: string;
  sections: SolveFrameworkSection[];
}

const HINGLISH_TITLES: Partial<Record<string, string>> = {
  understand: "Kya pucha ja raha hai",
  given: "Jo data diya gaya hai",
  formula: "Formula ya concept",
  steps: "Step-by-step solution",
  answer: "Final answer",
  verify: "Verify karo",
  tip: "Exam mein dhyan rakhna",
  causes: "Mukhya kaaran",
  events: "Kya hua tha",
  consequences: "Kya hua baad mein",
  context: "Background samajhna",
  mechanism: "Mechanism / process",
  recall: "Yaad karo pehle",
  approach: "Kaise approach karna hai",
  concept: "Kaunsa concept lag raha hai",
  analysis: "Analysis",
  diagram: "Conceptual setup",
  law: "Kaunsa law apply hoga",
  examples: "Real-world examples",
  text: "Relevant reference",
  themes: "Themes aur devices",
  complexity: "Time / space complexity",
  explanation: "Detailed explanation",
  diagram_note: "Diagram mein kya dikhana hai",
};

export const SOLVE_FRAMEWORKS: Record<TopicType, SolveFramework> = {
  math: {
    label: "Mathematical problem solving",
    sections: [
      { id: "understand", title: "What is being asked" },
      { id: "given", title: "Given information" },
      { id: "formula", title: "Formula / concept to apply" },
      { id: "steps", title: "Step-by-step solution" },
      { id: "answer", title: "Final answer" },
      { id: "verify", title: "Verification / sanity check" },
      { id: "tip", title: "Common mistake to avoid" },
    ],
  },
  physics: {
    label: "Physics problem solving",
    sections: [
      { id: "understand", title: "What is being asked" },
      { id: "given", title: "Known quantities" },
      { id: "diagram", title: "Conceptual diagram / setup" },
      { id: "law", title: "Law or principle applied" },
      { id: "formula", title: "Equation used" },
      { id: "steps", title: "Solution steps" },
      { id: "answer", title: "Answer with units" },
      { id: "tip", title: "Examiner's note" },
    ],
  },
  chemistry: {
    label: "Chemistry problem solving",
    sections: [
      { id: "understand", title: "What is being asked" },
      { id: "given", title: "Given data" },
      { id: "concept", title: "Concept / reaction type" },
      { id: "steps", title: "Step-by-step working" },
      { id: "answer", title: "Result" },
      { id: "tip", title: "Trick for exams" },
    ],
  },
  biology: {
    label: "Biology reasoning",
    sections: [
      { id: "understand", title: "What is being asked" },
      { id: "recall", title: "What you need to recall" },
      { id: "mechanism", title: "The mechanism / process" },
      { id: "answer", title: "Direct answer" },
      { id: "diagram_note", title: "Diagram points (if exam)" },
      { id: "tip", title: "Common confusion cleared" },
    ],
  },
  history: {
    label: "Historical reasoning",
    sections: [
      { id: "understand", title: "What is being asked" },
      { id: "context", title: "Background context" },
      { id: "causes", title: "Key causes / factors" },
      { id: "events", title: "What actually happened" },
      { id: "consequences", title: "Consequences / outcomes" },
      { id: "answer", title: "How to write this in exam" },
      { id: "tip", title: "Dates and names to remember" },
    ],
  },
  geography: {
    label: "Geography reasoning",
    sections: [
      { id: "understand", title: "What is being asked" },
      { id: "concept", title: "Geographic concept involved" },
      { id: "explanation", title: "Detailed explanation" },
      { id: "examples", title: "Real-world examples" },
      { id: "answer", title: "Exam answer structure" },
      { id: "tip", title: "Map / diagram tip" },
    ],
  },
  economics: {
    label: "Economics reasoning",
    sections: [
      { id: "understand", title: "What is being asked" },
      { id: "concept", title: "Economic concept / model" },
      { id: "analysis", title: "Analysis" },
      { id: "answer", title: "Conclusion" },
      { id: "tip", title: "Policy link / current example" },
    ],
  },
  literature: {
    label: "Literary analysis",
    sections: [
      { id: "understand", title: "What is being asked" },
      { id: "text", title: "Relevant extract / reference" },
      { id: "analysis", title: "Analysis and interpretation" },
      { id: "themes", title: "Themes / devices identified" },
      { id: "answer", title: "How to structure the answer" },
      { id: "tip", title: "Language to use in exam" },
    ],
  },
  logic: {
    label: "Logical / code problem",
    sections: [
      { id: "understand", title: "Problem breakdown" },
      { id: "approach", title: "Approach / algorithm" },
      { id: "steps", title: "Step-by-step solution" },
      { id: "answer", title: "Final answer / code" },
      { id: "complexity", title: "Time / space complexity" },
      { id: "tip", title: "Edge cases to check" },
    ],
  },
  general: {
    label: "Problem solving",
    sections: [
      { id: "understand", title: "What is being asked" },
      { id: "approach", title: "How to approach this" },
      { id: "steps", title: "Working through it" },
      { id: "answer", title: "Answer" },
      { id: "tip", title: "Key takeaway" },
    ],
  },
};

export function getSolveFramework(topicType: TopicType, language: LanguageMode = "english"): SolveFramework {
  const base = SOLVE_FRAMEWORKS[topicType] ?? SOLVE_FRAMEWORKS.general;

  if (language !== "hinglish") {
    return base;
  }

  return {
    label: base.label,
    sections: base.sections.map((section) => ({
      ...section,
      title: HINGLISH_TITLES[section.id] || section.title,
    })),
  };
}

export function getSolveFrameworkPromptBlock(language: LanguageMode) {
  return (Object.entries(SOLVE_FRAMEWORKS) as Array<[TopicType, SolveFramework]>)
    .map(([topicType, framework]) => {
      const localized = getSolveFramework(topicType, language);
      return `${topicType}: ${localized.label} -> ${localized.sections
        .map((section) => `${section.id} (${section.title})`)
        .join(", ")}`;
    })
    .join("\n");
}
