import { createChatCompletion } from "@/lib/ai/client";
import { assignmentPrompt, explanationPrompt, summaryPrompt, revisionPrompt } from "@/lib/ai/prompts";
import { getOptionalWebContext } from "@/lib/ai/webContext";
import type {
  AIResponseEnvelope,
  AnalogyCardData,
  AssignmentResult,
  AssignmentSectionGroup,
  AssignmentOption,
  ClarificationPrompt,
  ConceptCardData,
  ExplanationResult,
  FormulaBlockData,
  FormulaVariable,
  InfoCardData,
  LanguageMode,
  MarkingSchemeItem,
  SummaryResult,
  VisualBlockData,
  RevisionResult
} from "@/types";

export class AmbiguousInputError extends Error {
  options: string[];

  constructor(message: string, options: string[]) {
    super(message);
    this.name = "AmbiguousInputError";
    this.options = options;
  }
}

export class RubbishInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RubbishInputError";
  }
}

function parseStructuredResponse<T>(raw: string): T {
  try {
    const data = JSON.parse(raw);
    
    if (data.isRubbish) {
      throw new RubbishInputError("We couldn't quite understand that. Could you please provide a clearer topic or input?");
    }
    
    if (data.isAmbiguous && Array.isArray(data.clarificationOptions)) {
      const options = data.clarificationOptions.filter(
        (option: unknown): option is string => typeof option === "string" && option.trim().length > 0
      );
      throw new AmbiguousInputError("We found multiple meanings. Choose the one you want Saar AI to focus on.", options);
    }
    
    return data as T;
  } catch (err: any) {
    if (err instanceof RubbishInputError || err instanceof AmbiguousInputError) {
      throw err;
    }
    throw new Error("The AI returned an invalid response format.");
  }
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function normalizeSections(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((section) => {
    const record = section as Record<string, unknown>;
    const rawSubsections = Array.isArray(record.subsections) ? record.subsections : [];

    return {
      heading: asString(record.heading),
      paragraph: asString(record.paragraph),
      points: asStringArray(record.points),
      subsections: rawSubsections.map((subsection) => {
        const subsectionRecord = subsection as Record<string, unknown>;

        return {
          heading: asString(subsectionRecord.heading),
          points: asStringArray(subsectionRecord.points),
        };
      }),
    };
  }).filter((section) => section.heading || section.paragraph || section.points.length > 0 || section.subsections.length > 0);
}

function normalizeConcepts(value: unknown): ConceptCardData[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const record = item as Record<string, unknown>;
      return {
        title: asString(record.title),
        explanation: asString(record.explanation),
      };
    })
    .filter((item) => item.title || item.explanation);
}

function normalizeVisualBlock(value: unknown): VisualBlockData | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const title = asString(record.title);
  const description = asString(record.description);
  const buttonLabel = asString(record.buttonLabel) || "Expand Diagram";

  if (!title && !description) {
    return null;
  }

  return { title, description, buttonLabel };
}

function normalizeAnalogyCard(value: unknown): AnalogyCardData | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const title = asString(record.title);
  const explanation = asString(record.explanation);
  const note = asString(record.note);

  if (!title && !explanation && !note) {
    return null;
  }

  return { title, explanation, note };
}

function normalizeFormulaVariables(value: unknown): FormulaVariable[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const record = item as Record<string, unknown>;
      return {
        label: asString(record.label),
        description: asString(record.description),
      };
    })
    .filter((item) => item.label || item.description);
}

function normalizeFormulaBlock(value: unknown): FormulaBlockData | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const expression = asString(record.expression);
  const caption = asString(record.caption);
  const variables = normalizeFormulaVariables(record.variables);

  if (!expression && !caption && variables.length === 0) {
    return null;
  }

  return { expression, caption, variables };
}

function normalizeInfoCards(value: unknown): InfoCardData[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const record = item as Record<string, unknown>;
      return {
        title: asString(record.title),
        description: asString(record.description),
        eyebrow: asString(record.eyebrow),
      };
    })
    .filter((item) => item.title || item.description || item.eyebrow);
}

function normalizeMarkingScheme(value: unknown): MarkingSchemeItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const record = item as Record<string, unknown>;
      return {
        label: asString(record.label),
        value: asString(record.value),
      };
    })
    .filter((item) => item.label || item.value);
}

function normalizeAssignmentOptions(value: unknown): AssignmentOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const record = item as Record<string, unknown>;
      return {
        label: asString(record.label),
        text: asString(record.text),
      };
    })
    .filter((item) => item.label || item.text);
}

function normalizeAssignmentQuestion(value: unknown) {
  const record = value as Record<string, unknown>;
  const type = asString(record.type) === "mcq" ? "mcq" : "analytical";

  return {
    question: asString(record.question),
    answer: asString(record.answer),
    type,
    options: normalizeAssignmentOptions(record.options),
    marks: Number(record.marks) || 0,
  } as AssignmentResult["questions"][number];
}

function normalizeAssignmentSections(value: unknown): AssignmentSectionGroup[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const record = item as Record<string, unknown>;
      const rawQuestions = Array.isArray(record.questions) ? record.questions : [];
      return {
        heading: asString(record.heading),
        description: asString(record.description),
        marks: Number(record.marks) || 0,
        questions: rawQuestions.map(normalizeAssignmentQuestion).filter((question) => question.question || question.answer || question.options.length > 0),
      };
    })
    .filter((item) => item.heading || item.description || item.questions.length > 0);
}

function normalizeSummaryResult(data: unknown): SummaryResult {
  const record = data as Record<string, unknown>;

  return {
    title: asString(record.title),
    introduction: asString(record.introduction),
    coreConcepts: asStringArray(record.coreConcepts),
    sections: normalizeSections(record.sections),
    relatedTopics: asStringArray(record.relatedTopics),
    concepts: normalizeConcepts(record.concepts).length > 0
      ? normalizeConcepts(record.concepts)
      : asStringArray(record.coreConcepts).map((item) => splitConcept(item)),
    visualBlock: normalizeVisualBlock(record.visualBlock) ?? {
      title: "Visualized Field Interaction",
      description: "A diagram-ready placeholder that can expand into a fuller visual explanation of the topic.",
      buttonLabel: "Expand Diagram",
    },
  };
}

function normalizeExplanationResult(data: unknown): ExplanationResult {
  const record = data as Record<string, unknown>;

  return {
    title: asString(record.title),
    introduction: asString(record.introduction),
    coreConcepts: asStringArray(record.coreConcepts),
    sections: normalizeSections(record.sections),
    relatedTopics: asStringArray(record.relatedTopics),
    analogyCard: normalizeAnalogyCard(record.analogyCard) ?? buildFallbackAnalogy(record),
    formulaBlock: normalizeFormulaBlock(record.formulaBlock),
    frameworkCards: normalizeInfoCards(record.frameworkCards).length > 0
      ? normalizeInfoCards(record.frameworkCards)
      : normalizeSections(record.sections).slice(0, 4).map((section) => ({
          title: section.heading,
          description: section.paragraph || section.points[0] || "",
          eyebrow: "Framework",
        })),
    keyTakeaways: asStringArray(record.keyTakeaways).length > 0
      ? asStringArray(record.keyTakeaways)
      : asStringArray(record.coreConcepts),
  };
}

function normalizeAssignmentResult(data: unknown, sourceText: string): AssignmentResult {
  const record = data as Record<string, unknown>;
  const rawQuestions = Array.isArray(record.questions) ? record.questions : [];
  const normalizedQuestions = rawQuestions.map(normalizeAssignmentQuestion).filter((question) => question.question || question.answer);
  const normalizedInstructionList = asStringArray(record.instructionList);
  const normalizedSectionGroups = normalizeAssignmentSections(record.sectionGroups);
  const normalizedMarkingScheme = normalizeMarkingScheme(record.markingScheme);
  const fallback = buildGeneratedAssignmentFallback(sourceText);

  return {
    title: asString(record.title) || fallback.title,
    introduction: asString(record.introduction) || fallback.introduction,
    coreConcepts: asStringArray(record.coreConcepts).length > 0 ? asStringArray(record.coreConcepts) : fallback.coreConcepts,
    instructions:
      asString(record.instructions) ||
      buildInstructionList(normalizedInstructionList.join(". ")).join(". ") ||
      fallback.instructions,
    sections: normalizeSections(record.sections),
    questions: normalizedQuestions.length > 0 ? normalizedQuestions : fallback.questions,
    relatedTopics: asStringArray(record.relatedTopics).length > 0 ? asStringArray(record.relatedTopics) : fallback.relatedTopics,
    instructionList: normalizedInstructionList.length > 0 ? normalizedInstructionList : fallback.instructionList,
    sectionGroups: normalizedSectionGroups.length > 0
      ? normalizedSectionGroups
      : buildFallbackAssignmentSections(normalizedQuestions.length > 0 ? normalizedQuestions : fallback.questions),
    markingScheme: normalizedMarkingScheme.length > 0 ? normalizedMarkingScheme : fallback.markingScheme,
  };
}

function normalizeRevisionResult(data: unknown): RevisionResult {
  const record = data as Record<string, unknown>;
  const rawMcqs = Array.isArray(record.mcqs) ? record.mcqs : [];
  const rawShortQuestions = Array.isArray(record.shortQuestions) ? record.shortQuestions : [];
  const rawKeyConcepts = Array.isArray(record.keyConcepts) ? record.keyConcepts : [];

  return {
    mcqs: rawMcqs.map((mcq) => {
      const mcqRecord = mcq as Record<string, unknown>;

      return {
        question: asString(mcqRecord.question),
        options: asStringArray(mcqRecord.options),
        answer: asString(mcqRecord.answer),
      };
    }).filter((mcq) => mcq.question || mcq.options.length > 0 || mcq.answer),
    shortQuestions: rawShortQuestions.map((question) => {
      const questionRecord = question as Record<string, unknown>;

      return {
        question: asString(questionRecord.question),
        answer: asString(questionRecord.answer),
      };
    }).filter((question) => question.question || question.answer),
    keyConcepts: rawKeyConcepts.map((concept) => {
      const conceptRecord = concept as Record<string, unknown>;

      return {
        term: asString(conceptRecord.term),
        definition: asString(conceptRecord.definition),
      };
    }).filter((concept) => concept.term || concept.definition),
  };
}

function splitConcept(item: string): ConceptCardData {
  const [left, ...rest] = item.split(":");
  if (rest.length === 0) {
    return {
      title: item,
      explanation: "Quick revision note for this concept.",
    };
  }

  return {
    title: left.trim(),
    explanation: rest.join(":").trim(),
  };
}

function buildFallbackAnalogy(record: Record<string, unknown>): AnalogyCardData | null {
  const introduction = asString(record.introduction);
  const sections = normalizeSections(record.sections);
  const fallback = sections[0]?.paragraph || sections[0]?.points[0] || introduction;

  if (!fallback) {
    return null;
  }

  return {
    title: "The Teacher's Analogy",
    explanation: fallback,
    note: "Use this intuition as the first mental model before going deeper.",
  };
}

function buildInstructionList(instructions: string) {
  if (!instructions) {
    return [];
  }

  return instructions
    .split(/[\.\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function buildFallbackAssignmentSections(questions: AssignmentResult["questions"]): AssignmentSectionGroup[] {
  const firstHalf = questions.slice(0, 2).map((question, index) => ({
    ...question,
    type: (question.options.length > 0 ? "mcq" : "analytical") as "mcq" | "analytical",
    marks: question.marks || 2 + index,
  }));
  const secondHalf = questions.slice(2).map((question, index) => ({
    ...question,
    type: "analytical" as "mcq" | "analytical",
    marks: question.marks || 5 + index,
  }));

  const groups: AssignmentSectionGroup[] = [];

  if (firstHalf.length > 0) {
    groups.push({
      heading: "Section A: Conceptual Accuracy",
      description: "Short-response and concept-check questions.",
      marks: firstHalf.reduce((sum, question) => sum + question.marks, 0),
      questions: firstHalf,
    });
  }

  if (secondHalf.length > 0) {
    groups.push({
      heading: "Section B: Analytical Application",
      description: "Long-form responses that test reasoning and structure.",
      marks: secondHalf.reduce((sum, question) => sum + question.marks, 0),
      questions: secondHalf,
    });
  }

  return groups;
}

function buildGeneratedAssignmentFallback(sourceText: string): AssignmentResult {
  const topic = sourceText.trim() || "the topic";
  const title = `${toHeadline(topic)} Assignment`;
  const introduction = `A structured practice set designed to test understanding, application, and explanation of ${topic}.`;
  const coreConcepts = [
    `${toHeadline(topic)} fundamentals`,
    "Core terminology and first principles",
    "Exam-style application and reasoning",
  ];
  const instructionList = [
    "Answer all questions clearly and in order.",
    "Use precise terminology wherever possible.",
    "For analytical responses, explain the reasoning behind your answer.",
  ];
  const instructions = instructionList.join(" ");
  const questions: AssignmentResult["questions"] = [
    {
      question: `Which option best captures the core idea behind ${topic}?`,
      answer: `The strongest answer is the one that identifies the main principle of ${topic} and connects it to its purpose or outcome.`,
      type: "mcq",
      options: [
        { label: "A", text: "It is only a list of facts with no deeper principle." },
        { label: "B", text: `It explains a core principle that helps us understand how ${topic} works.` },
        { label: "C", text: "It applies only in rare situations and has no wider relevance." },
        { label: "D", text: "It cannot be connected to exam-based interpretation." },
      ],
      marks: 2,
    },
    {
      question: `Which statement is most useful when revising ${topic} quickly before an exam?`,
      answer: `Choose the statement that links definition, mechanism, and significance in one concise line.`,
      type: "mcq",
      options: [
        { label: "A", text: "A broad but vague statement without examples or logic." },
        { label: "B", text: "A concise explanation of definition, process, and significance." },
        { label: "C", text: "A disconnected fact that does not explain the concept." },
        { label: "D", text: `A statement that ignores the main mechanism of ${topic}.` },
      ],
      marks: 2,
    },
    {
      question: `Explain the main mechanism or structure of ${topic} in a well-organized paragraph.`,
      answer: `A strong answer should define ${topic}, describe its main process or structure, and show why it matters in the broader concept.`,
      type: "analytical",
      options: [],
      marks: 5,
    },
    {
      question: `Write an analytical note on the importance, effects, or applications of ${topic}.`,
      answer: `An effective response should connect ${topic} to outcomes, uses, or implications and end with a concise takeaway.`,
      type: "analytical",
      options: [],
      marks: 6,
    },
  ];

  return {
    title,
    introduction,
    coreConcepts,
    instructions,
    sections: [],
    questions,
    relatedTopics: [
      `${toHeadline(topic)} examples`,
      `${toHeadline(topic)} in real life`,
      `${toHeadline(topic)} practice questions`,
    ],
    instructionList,
    sectionGroups: buildFallbackAssignmentSections(questions),
    markingScheme: [
      { label: "Concept Accuracy", value: "40%" },
      { label: "Applied Reasoning", value: "35%" },
      { label: "Clarity & Structure", value: "25%" },
    ],
  };
}

function toHeadline(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function toClarificationPrompt(error: AmbiguousInputError): ClarificationPrompt {
  return {
    message: error.message,
    options: error.options
  };
}

export async function generateSummary(
  sourceText: string,
  language: LanguageMode
): Promise<AIResponseEnvelope<SummaryResult>> {
  const webContext = await getOptionalWebContext(sourceText);
  const result = await createChatCompletion(summaryPrompt(sourceText, language, webContext));

  return {
    data: normalizeSummaryResult(parseStructuredResponse(result.content)),
    provider: result.provider,
    model: result.model
  };
}

export async function generateExplanation(
  sourceText: string,
  language: LanguageMode
): Promise<AIResponseEnvelope<ExplanationResult>> {
  const webContext = await getOptionalWebContext(sourceText);
  const result = await createChatCompletion(explanationPrompt(sourceText, language, webContext));

  return {
    data: normalizeExplanationResult(parseStructuredResponse(result.content)),
    provider: result.provider,
    model: result.model
  };
}

export async function generateAssignment(
  sourceText: string,
  language: LanguageMode
): Promise<AIResponseEnvelope<AssignmentResult>> {
  const webContext = await getOptionalWebContext(sourceText);
  const result = await createChatCompletion(assignmentPrompt(sourceText, language, webContext));

  return {
    data: normalizeAssignmentResult(parseStructuredResponse(result.content), sourceText),
    provider: result.provider,
    model: result.model
  };
}

export async function generateRevision(
  sourceText: string,
  language: LanguageMode
): Promise<AIResponseEnvelope<RevisionResult>> {
  const webContext = await getOptionalWebContext(sourceText);
  const result = await createChatCompletion(revisionPrompt(sourceText, language, webContext));

  return {
    data: normalizeRevisionResult(parseStructuredResponse(result.content)),
    provider: result.provider,
    model: result.model
  };
}
