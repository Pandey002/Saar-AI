import { createChatCompletion } from "@/lib/ai/client";
import { extractJSON } from "@/lib/ai/jsonUtils";
import { detectTopicType } from "@/lib/detectTopicType";
import {
  assignmentEvaluationPrompt,
  assignmentPrompt,
  conceptDependencyPrompt,
  explanationPrompt,
  mockTestEvaluationPrompt,
  mockTestPrompt,
  weakAreaRevisionPrompt,
  similarSolvePrompt,
  solvePrompt,
  summaryPrompt,
  summaryCorePrompt,
  summaryExtraPrompt,
  explanationPrompt,
  explanationCorePrompt,
  explanationExtraPrompt,
  mockTestPrompt,
  mockTestHeaderPrompt,
  mockTestSectionAPrompt,
  mockTestSectionBPrompt,
  teachBackEvaluationPrompt,
  revisionPrompt,
  examQuestionsPrompt
} from "@/lib/ai/prompts";
import { getSolveFramework } from "@/lib/solveFrameworks";
import { getOptionalWebContext } from "@/lib/ai/webContext";
import type {
  AIResponseEnvelope,
  AnalogyCardData,
  AssignmentEvaluationResult,
  AssignmentResult,
  AssignmentSectionGroup,
  AssignmentOption,
  AssignmentSubmission,
  ClarificationPrompt,
  ConceptDependencyGraphResult,
  ConceptGraphEdge,
  ConceptGraphNode,
  ConceptCardData,
  ExplanationResult,
  FormulaBlockData,
  FormulaVariable,
  InfoCardData,
  LanguageMode,
  MarkingSchemeItem,
  MockTestAnalysis,
  MockTestEvaluationResult,
  MockTestOption,
  MockTestQuestion,
  MockTestResult,
  MockTestSectionPerformance,
  MockTestSubmission,
  SummaryResult,
  TeachBackEvaluationResult,
  VisualBlockData,
  RevisionResult,
  SolveDifficulty,
  SolveSection,
  SolveResult,
  TopicType,
  WeakAreaRevisionPack,
  CitedPoint,
  StudySection,
  StudySubsection
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
    const cleaned = extractJSON(raw);
    const data = JSON.parse(cleaned);
    
    if (data.isRubbish) {
      throw new RubbishInputError("We couldn't quite understand that. Could you please provide a clearer topic or input?");
    }
    
    if (data.isAmbiguous && Array.isArray(data.clarificationOptions)) {
      const options = data.clarificationOptions.filter(
        (option: unknown): option is string => typeof option === "string" && option.trim().length > 0
      );
      throw new AmbiguousInputError("We found multiple meanings. Choose the one you want Vidya to focus on.", options);
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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
      points: (Array.isArray(record.points) ? record.points : []).map(normalizeCitedPoint).filter(Boolean) as (string | CitedPoint)[],
      subsections: rawSubsections.map((subsection) => {
        const subsectionRecord = subsection as Record<string, unknown>;
        const rawPoints = Array.isArray(subsectionRecord.points) ? subsectionRecord.points : [];

        return {
          heading: asString(subsectionRecord.heading),
          points: rawPoints.map(normalizeCitedPoint).filter(Boolean) as (string | CitedPoint)[],
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
      const rawExplanation = Array.isArray(record.explanation) ? record.explanation : [];
      return {
        title: asString(record.title),
        explanation: rawExplanation.map(normalizeCitedPoint).filter(Boolean) as CitedPoint[],
      };
    })
    .filter((item) => item.title || item.explanation.length > 0);
}

function normalizeConceptGraphNodes(value: unknown): ConceptGraphNode[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      const record = item as Record<string, unknown>;
      const levelValue = asString(record.level);
      const level: ConceptGraphNode["level"] =
        levelValue === "prerequisite" || levelValue === "core" || levelValue === "advanced"
          ? levelValue
          : ("prerequisite" as const);

      return {
        id: asString(record.id) || `concept-${index + 1}`,
        title: asString(record.title) || asString(record.label),
        level,
        description: asString(record.description),
        mastered: Boolean(record.mastered),
      };
    })
    .filter((item) => item.title.trim().length > 0);
}

function normalizeConceptGraphEdges(value: unknown): ConceptGraphEdge[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const record = item as Record<string, unknown>;
      return {
        from: asString(record.from),
        to: asString(record.to),
      };
    })
    .filter((item) => item.from && item.to);
}

function normalizeVisualBlock(value: unknown): VisualBlockData | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const title = asString(record.title);
  const rawDescription = Array.isArray(record.description) ? record.description : [];
  const description = rawDescription.map(normalizeCitedPoint).filter(Boolean) as (string | CitedPoint)[];
  const buttonLabel = asString(record.buttonLabel) || "Expand Diagram";

  if (!title && description.length === 0) {
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
  const rawExplanation = Array.isArray(record.explanation) ? record.explanation : [];
  const explanation = rawExplanation.map(normalizeCitedPoint).filter(Boolean) as CitedPoint[];
  const note = asString(record.note);

  if (!title && explanation.length === 0 && !note) {
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
      const rawDescription = Array.isArray(record.description) ? record.description : [];
      return {
        title: asString(record.title),
        description: rawDescription.map(normalizeCitedPoint).filter(Boolean) as (string | CitedPoint)[],
        eyebrow: asString(record.eyebrow),
      };
    })
    .filter((item) => item.title || item.description.length > 0 || item.eyebrow);
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

function normalizeAssignmentEvaluationResult(
  data: unknown,
  submissions: AssignmentSubmission[]
): AssignmentEvaluationResult {
  const record = data as Record<string, unknown>;
  const rawResults = Array.isArray(record.results) ? record.results : [];
  const totalMarks = submissions.reduce((sum, item) => sum + item.marks, 0);

  const results = submissions.map((submission) => {
    const matched = rawResults.find((item) => {
      const resultRecord = item as Record<string, unknown>;
      return asString(resultRecord.questionKey) === submission.questionKey;
    }) as Record<string, unknown> | undefined;

    const mcqEvaluation =
      submission.questionType === "mcq"
        ? evaluateMcqSubmission(submission)
        : null;
    const rawScore = matched ? Number(matched.score) : 0;
    const llmScore = Number.isFinite(rawScore)
      ? Math.max(0, Math.min(submission.marks, rawScore))
      : 0;
    const score = mcqEvaluation ? mcqEvaluation.score : llmScore;
    const isCorrect = mcqEvaluation ? mcqEvaluation.isCorrect : matched ? Boolean(matched.isCorrect) : false;
    const fallbackFeedback = mcqEvaluation
      ? mcqEvaluation.feedback
      : isCorrect
        ? "Great work! Your answer is correct."
        : `Your answer needs improvement. Correct answer: ${submission.correctAnswer}`;

    return {
      questionKey: submission.questionKey,
      question: submission.question,
      questionType: submission.questionType,
      isCorrect,
      score,
      maxScore: submission.marks,
      userAnswer: submission.userAnswer,
      correctAnswer: submission.correctAnswer,
      feedback:
        submission.questionType === "mcq"
          ? fallbackFeedback
          : matched
            ? asString(matched.feedback) || fallbackFeedback
            : fallbackFeedback,
    };
  });

  const totalScore = results.reduce((sum, item) => sum + item.score, 0);

  return {
    summary:
      asString(record.summary) ||
      `You scored ${totalScore} out of ${totalMarks}. Review the feedback below to improve the weaker answers.`,
    totalScore,
    totalMarks,
    results,
  };
}

function extractOptionLabel(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^([A-D])(?:[\.\)\s]|$)/i);
  return match ? match[1].toUpperCase() : trimmed.toUpperCase();
}

function findOptionText(options: AssignmentOption[], label: string) {
  return options.find((option) => option.label.toUpperCase() === label)?.text ?? "";
}

function evaluateMcqSubmission(submission: AssignmentSubmission) {
  const selectedLabel = extractOptionLabel(submission.userAnswer);
  const correctLabel = extractOptionLabel(submission.correctAnswer);
  const isCorrect = selectedLabel === correctLabel;
  const correctOptionText = findOptionText(submission.options, correctLabel);

  return {
    isCorrect,
    score: isCorrect ? submission.marks : 0,
    feedback: isCorrect
      ? "Great work! You selected the correct option."
      : `Your answer is not correct. You selected ${selectedLabel}, but the correct answer is ${correctLabel}${correctOptionText ? `. ${correctOptionText}` : ""}.`,
  };
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

function normalizeExamQuestions(value: unknown): any[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => {
    const record = item as Record<string, unknown>;
    const type = asString(record.type);
    const difficulty = asString(record.difficulty);
    const relevance = asString(record.relevance);

    return {
      question: normalizeCitedPoint(record.question),
      difficulty: difficulty === "easy" || difficulty === "hard" ? difficulty : "medium",
      type: type === "MCQ" || type === "long answer" ? type : "short answer",
      relevance: relevance === "JEE" || relevance === "NEET" || relevance === "CLAT" || relevance === "UPSC" ? relevance : "Board",
      options: type === "MCQ" ? normalizeMockTestOptions(record.options).slice(0, 4) : undefined,
      answer: normalizeCitedPoint(record.answer),
    };
  }).filter((item) => item.question && item.answer);
}

function normalizeMockTestOptions(value: unknown): MockTestOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      const record = item as Record<string, unknown>;
      return {
        label: asString(record.label) || String.fromCharCode(65 + index),
        text: asString(record.text),
      };
    })
    .filter((item) => item.text);
}

function normalizeMockTestDifficulty(value: unknown): MockTestQuestion["difficulty"] {
  const candidate = asString(value);
  return candidate === "easy" || candidate === "hard" ? candidate : "medium";
}

function normalizeMockTestQuestion(
  value: unknown,
  defaultId: string
): MockTestQuestion | null {
  const record = value as Record<string, unknown>;
  const type = asString(record.type) === "analytical" ? "analytical" : "mcq";
  const id = asString(record.id) || defaultId;
  const question = asString(record.question);
  const marks = Math.max(1, Number(record.marks) || (type === "mcq" ? 4 : 6));
  const difficulty = normalizeMockTestDifficulty(record.difficulty);
  const rawExplanation = Array.isArray(record.explanation) 
    ? record.explanation 
    : typeof record.explanation === "string" 
      ? [{ text: record.explanation }]
      : [];
  const explanation = rawExplanation.map(normalizeCitedPoint).filter(Boolean) as CitedPoint[];

  if (!question) {
    return null;
  }

  if (type === "analytical") {
    return {
      id,
      type,
      question,
      sampleAnswer: asString(record.sampleAnswer) || asString(record.correctAnswer),
      marks,
      difficulty,
      explanation,
    };
  }

  const options = normalizeMockTestOptions(record.options).slice(0, 4);
  if (options.length !== 4) {
    return null;
  }

  return {
    id,
    type,
    question,
    options,
    correctAnswer: asString(record.correctAnswer),
    marks,
    difficulty,
    explanation,
  };
}

function normalizeMockTestResult(data: unknown): MockTestResult {
  const record = data as Record<string, unknown>;
  const sectionA = (Array.isArray(record.sectionA) ? record.sectionA : [])
    .map((item, index) => normalizeMockTestQuestion(item, `section-a-${index + 1}`))
    .filter((item): item is MockTestQuestion => item !== null && item.type === "mcq");
  const sectionB = (Array.isArray(record.sectionB) ? record.sectionB : [])
    .map((item, index) => normalizeMockTestQuestion(item, `section-b-${index + 1}`))
    .filter((item): item is MockTestQuestion => item !== null && item.type === "analytical");
  const sections = [
    {
      id: "section-a",
      title: "Section A · MCQs",
      description: "Objective questions with single-correct answers.",
      questions: sectionA,
    },
    {
      id: "section-b",
      title: "Section B · Analytical",
      description: "Long-form reasoning and exam-style written responses.",
      questions: sectionB,
    },
  ].filter((section) => section.questions.length > 0);
  const totalMarks = sections.reduce(
    (sum, section) => sum + section.questions.reduce((sectionSum, question) => sectionSum + question.marks, 0),
    0
  );
  const totalQuestions = sections.reduce((sum, section) => sum + section.questions.length, 0);
  const durationMinutes = clamp(Number(record.durationMinutes) || 45, 30, 180);
  const negativeMarking = clamp(Number(record.negativeMarking) || 1, 0, 1);
  const markingScheme = normalizeMarkingScheme(record.markingScheme);

  return {
    title: asString(record.title) || "Timed Mock Test",
    introduction:
      asString(record.introduction) ||
      "A full-length mock test built from your source material with objective and analytical sections.",
    instructions:
      asStringArray(record.instructions).length > 0
        ? asStringArray(record.instructions)
        : [
            "Start the timer only when you are ready to attempt the full paper.",
            "Attempt MCQs carefully because incorrect responses may carry a penalty.",
            "Write analytical answers in clear exam-style steps or points.",
            "Review flagged questions before final submission.",
          ],
    durationMinutes,
    negativeMarking,
    totalMarks,
    totalQuestions,
    markingScheme:
      markingScheme.length > 0
        ? markingScheme
        : [
            { label: "Correct", value: "+4 marks" },
            { label: "Incorrect", value: negativeMarking > 0 ? `-${negativeMarking} mark` : "0" },
            { label: "Analytical", value: "Partial credit allowed" },
          ],
    sectionA,
    sectionB,
    sections,
    relatedTopics: asStringArray(record.relatedTopics).slice(0, 3),
  };
}

function normalizeMockTestAnalysis(value: unknown): MockTestAnalysis {
  const record = (value ?? {}) as Record<string, unknown>;
  return {
    summary:
      asString(record.summary) ||
      "You completed the mock test. Review your mistakes, weak concepts, and pacing before the next attempt.",
    strengths: asStringArray(record.strengths).slice(0, 4),
    weaknesses: asStringArray(record.weaknesses).slice(0, 4),
    suggestions: asStringArray(record.suggestions).slice(0, 4),
    timeEfficiency:
      asString(record.timeEfficiency) ||
      "Your pacing was steady overall. Spend a little more time on the toughest numerical or analytical questions.",
  };
}

function normalizeMockTestEvaluationResult(
  data: unknown,
  submissions: MockTestSubmission[],
  test: MockTestResult,
  autoSubmitted: boolean
): MockTestEvaluationResult {
  const record = data as Record<string, unknown>;
  const rawResults = Array.isArray(record.results) ? record.results : [];
  const totalQuestions = submissions.length;
  const totalTimeSpentSeconds = submissions.reduce((sum, item) => sum + item.timeSpentSeconds, 0);

  const results = submissions.map((submission) => {
    const matched = rawResults.find((item) => {
      const resultRecord = item as Record<string, unknown>;
      return asString(resultRecord.questionId) === submission.questionId;
    }) as Record<string, unknown> | undefined;

    if (submission.questionType === "mcq") {
      const selectedLabel = extractOptionLabel(submission.userAnswer);
      const correctLabel = extractOptionLabel(submission.correctAnswer);
      const isCorrect = selectedLabel === correctLabel;
      const score = isCorrect ? submission.marks : submission.userAnswer.trim() ? -test.negativeMarking : 0;
      const correctOptionText = findOptionText(submission.options as AssignmentOption[], correctLabel);

      return {
        questionId: submission.questionId,
        question: submission.question,
        questionType: submission.questionType,
        sectionId: submission.sectionId,
        sectionTitle: submission.sectionTitle,
        difficulty: submission.difficulty,
        isCorrect,
        score,
        maxScore: submission.marks,
        userAnswer: submission.userAnswer,
        correctAnswer: submission.correctAnswer,
        feedback: isCorrect
          ? "Great work! You picked the correct option."
          : submission.userAnswer.trim()
            ? `Incorrect. The correct answer is ${correctLabel}${correctOptionText ? `. ${correctOptionText}` : ""}.`
            : `Unattempted. The correct answer is ${correctLabel}${correctOptionText ? `. ${correctOptionText}` : ""}.`,
        timeSpentSeconds: submission.timeSpentSeconds,
      };
    }

    const rawScore = matched ? Number(matched.score) : 0;
    const score = clamp(Number.isFinite(rawScore) ? rawScore : 0, 0, submission.marks);
    const isCorrect = score >= submission.marks * 0.7;

    return {
      questionId: submission.questionId,
      question: submission.question,
      questionType: submission.questionType,
      sectionId: submission.sectionId,
      sectionTitle: submission.sectionTitle,
      difficulty: submission.difficulty,
      isCorrect,
      score,
      maxScore: submission.marks,
      userAnswer: submission.userAnswer,
      correctAnswer: submission.correctAnswer,
      feedback:
        (matched ? asString(matched.feedback) : "") ||
        "Review the model answer and tighten your structure, accuracy, and key supporting points.",
      timeSpentSeconds: submission.timeSpentSeconds,
    };
  });

  const totalScore = results.reduce((sum, item) => sum + item.score, 0);
  const attempted = results.filter((item) => item.userAnswer.trim().length > 0).length;
  const accuracy =
    attempted > 0
      ? Math.round(
          (results.filter((item) => item.userAnswer.trim().length > 0 && item.score > 0).length / attempted) * 100
        )
      : 0;

  const sectionPerformance: MockTestSectionPerformance[] = test.sections.map((section) => {
    const sectionResults = results.filter((item) => item.sectionId === section.id);
    const score = sectionResults.reduce((sum, item) => sum + item.score, 0);
    const totalMarks = sectionResults.reduce((sum, item) => sum + item.maxScore, 0);
    const attemptedCount = sectionResults.filter((item) => item.userAnswer.trim().length > 0).length;
    const correctCount = sectionResults.filter((item) => item.userAnswer.trim().length > 0 && item.score > 0).length;

    return {
      sectionId: section.id,
      title: section.title,
      score,
      totalMarks,
      attempted: attemptedCount,
      totalQuestions: sectionResults.length,
      accuracy: attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0,
    };
  });

  const analysis = normalizeMockTestAnalysis(record.analysis);

  return {
    summary:
      asString(record.summary) ||
      `You scored ${totalScore} out of ${test.totalMarks}. Review your section-wise performance and AI feedback below.`,
    totalScore,
    totalMarks: test.totalMarks,
    accuracy,
    attempted,
    totalQuestions,
    timeLimitSeconds: test.durationMinutes * 60,
    totalTimeSpentSeconds,
    autoSubmitted,
    sectionPerformance,
    results,
    analysis,
  };
}

function normalizeCitedPoint(value: unknown): CitedPoint | string {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const text = asString(record.text);
    const citation = asString(record.citation);
    
    if (text) {
      return { text, citation: citation || undefined };
    }
  }

  return "";
}

function normalizeStudySubsection(value: unknown): StudySubsection | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const rawPoints = Array.isArray(record.points) ? record.points : [];

  return {
    heading: asString(record.heading),
    points: rawPoints.map(normalizeCitedPoint).filter(Boolean),
  };
}

function normalizeStudySection(value: unknown): StudySection | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const rawPoints = Array.isArray(record.points) ? record.points : [];
  const rawSubsections = Array.isArray(record.subsections) ? record.subsections : [];

  return {
    heading: asString(record.heading),
    paragraph: asString(record.paragraph),
    points: rawPoints.map(normalizeCitedPoint).filter(Boolean),
    subsections: rawSubsections.map(normalizeStudySubsection).filter(Boolean) as StudySubsection[],
  };
}

function normalizeSummaryResult(data: unknown): SummaryResult {
  const record = data as Record<string, unknown>;
  const rawCoreConcepts = Array.isArray(record.coreConcepts) ? record.coreConcepts : [];

  return {
    title: asString(record.title),
    introduction: asString(record.introduction),
    coreConcepts: rawCoreConcepts.map(normalizeCitedPoint).filter(Boolean),
    sections: normalizeSections(record.sections),
    relatedTopics: asStringArray(record.relatedTopics),
    concepts: normalizeConcepts(record.concepts).length > 0
      ? normalizeConcepts(record.concepts)
      : rawCoreConcepts.map((item) => {
          const pt = normalizeCitedPoint(item);
          return {
            title: typeof pt === "string" ? pt : pt.text,
            explanation: [pt],
          };
        }),
    visualBlock: normalizeVisualBlock(record.visualBlock) ?? {
      title: "Visualized Field Interaction",
      description: ["A diagram-ready placeholder that can expand into a fuller visual explanation of the topic."],
      buttonLabel: "Expand Diagram",
    },
  };
}

function normalizeExplanationResult(data: unknown): ExplanationResult {
  const record = data as Record<string, unknown>;
  const rawCoreConcepts = Array.isArray(record.coreConcepts) ? record.coreConcepts : [];
  const rawTakeaways = Array.isArray(record.keyTakeaways) ? record.keyTakeaways : [];

  return {
    title: asString(record.title),
    introduction: asString(record.introduction),
    coreConcepts: rawCoreConcepts.map(normalizeCitedPoint).filter(Boolean),
    sections: normalizeSections(record.sections),
    relatedTopics: asStringArray(record.relatedTopics),
    analogyCard: normalizeAnalogyCard(record.analogyCard) ?? buildFallbackAnalogy(record),
    formulaBlock: normalizeFormulaBlock(record.formulaBlock),
    frameworkCards: normalizeInfoCards(record.frameworkCards).length > 0
      ? normalizeInfoCards(record.frameworkCards)
      : normalizeSections(record.sections).slice(0, 4).map((section) => ({
          title: section.heading,
          description: section.paragraph ? [section.paragraph] : (section.points[0] ? [section.points[0]] : []),
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
  const normalizedMarkingScheme = normalizeMarkingScheme(record.markingScheme);
  const fallback = buildGeneratedAssignmentFallback(sourceText);
  const candidateSectionGroups = normalizeAssignmentSections(record.sectionGroups);
  const shouldPreferFallback = prefersTopicAwareFallback(sourceText);
  const normalizedSectionGroups = ensureMinimumAssignmentSections(
    shouldPreferFallback || hasLowQualityAssignmentContent(candidateSectionGroups, sourceText)
      ? fallback.sectionGroups
      : candidateSectionGroups,
    fallback.sectionGroups
  );
  const flattenedQuestions =
    normalizedSectionGroups.length > 0
      ? normalizedSectionGroups.flatMap((group) => group.questions)
      : normalizedQuestions.length > 0
        ? normalizedQuestions
        : fallback.questions;

  return {
    title: asString(record.title) || fallback.title,
    introduction: asString(record.introduction) || fallback.introduction,
    coreConcepts: asStringArray(record.coreConcepts).length > 0 ? asStringArray(record.coreConcepts) : fallback.coreConcepts,
    instructions:
      asString(record.instructions) ||
      buildInstructionList(normalizedInstructionList.join(". ")).join(". ") ||
      fallback.instructions,
    sections: normalizeSections(record.sections),
    questions: flattenedQuestions,
    relatedTopics: asStringArray(record.relatedTopics).length > 0 ? asStringArray(record.relatedTopics) : fallback.relatedTopics,
    instructionList: normalizedInstructionList.length > 0 ? normalizedInstructionList : fallback.instructionList,
    sectionGroups:
      normalizedSectionGroups.length > 0
        ? normalizedSectionGroups
        : buildFallbackAssignmentSections(flattenedQuestions),
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

function normalizeTeachBackEvaluationResult(data: unknown): TeachBackEvaluationResult {
  const record = data as Record<string, unknown>;
  const rawScore = Number(record.score);

  return {
    score: Number.isFinite(rawScore) ? Math.max(0, Math.min(100, Math.round(rawScore))) : 0,
    understoodWell: asStringArray(record.understood_well),
    gaps: asStringArray(record.gaps),
    misconceptions: asStringArray(record.misconceptions),
    feedback:
      asString(record.feedback) ||
      "You are making progress. Tighten the weaker parts and try explaining it once more in simpler words.",
    nextStep:
      asString(record.next_step) ||
      "Review the core definition and one worked example before trying again.",
  };
}

function normalizeTopicType(value: unknown, sourceText: string): TopicType {
  const candidate = asString(value) as TopicType;
  const allowed: TopicType[] = [
    "math",
    "physics",
    "chemistry",
    "biology",
    "history",
    "geography",
    "economics",
    "literature",
    "logic",
    "general",
  ];

  return allowed.includes(candidate) ? candidate : detectTopicType(sourceText);
}

function normalizeSolveDifficulty(value: unknown): SolveDifficulty {
  const candidate = asString(value) as SolveDifficulty;
  return candidate === "easy" || candidate === "medium" || candidate === "hard"
    ? candidate
    : "medium";
}

function normalizeEstimatedMarks(value: unknown): 2 | 3 | 5 | 8 | 10 {
  const marks = Number(value);
  if (marks === 2 || marks === 3 || marks === 5 || marks === 8 || marks === 10) {
    return marks;
  }

  return 5;
}

function normalizeSolveSections(value: unknown): SolveSection[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const record = item as Record<string, unknown>;
      const type = asString(record.type);
      const normalizedType: SolveSection["type"] =
        type === "steps" ||
        type === "formula" ||
        type === "highlight" ||
        type === "warning"
          ? type
          : "text";

      return {
        id: asString(record.id),
        title: asString(record.title),
        content: asString(record.content),
        type: normalizedType,
      };
    })
    .filter((section) => section.id || section.title || section.content);
}

function buildSolveFallback(sourceText: string, topicType: TopicType): SolveResult {
  const framework = getSolveFramework(topicType, "english");
  const topic = sourceText.trim() || "this question";

  const baseSections: SolveSection[] = framework.sections
    .map((section) => {
      if (section.id === "understand") {
        return {
          id: section.id,
          title: section.title,
          content: `This question is asking you to work through ${topic} carefully and identify the exact concept or argument needed for the answer.`,
          type: "text" as const,
        };
      }

      if (section.id === "steps") {
        return {
          id: section.id,
          title: section.title,
          content:
            "1. Identify the exact concept, rule, or chapter being tested.\n2. Separate what is given from what must be proved, calculated, or explained.\n3. Work through the answer in a logical order without skipping reasoning.\n4. End with a direct final answer in exam language.",
          type: "steps" as const,
        };
      }

      if (section.id === "answer") {
        return {
          id: section.id,
          title: section.title,
          content: `Write a direct, well-structured answer for ${topic} using the correct concept first, then support it with the key reasoning.`,
          type: "highlight" as const,
        };
      }

      if (section.id === "tip") {
        return {
          id: section.id,
          title: section.title,
          content: "Do not jump to the final answer too quickly. Examiners usually reward the method, logic, and structure, not just the conclusion.",
          type: "warning" as const,
        };
      }

      return {
        id: section.id,
        title: section.title,
        content: `Use this section to organize the important reasoning for ${topic}.`,
        type: "text" as const,
      };
    })
    .filter((section) => section.content);

  return {
    topicType,
    frameworkLabel: framework.label,
    difficulty: "medium",
    estimatedMarks: 5,
    sections: baseSections,
    relatedTopics: [
      `${framework.label} basics`,
      `${topic} practice questions`,
      `${topic} revision`,
    ],
    confidenceCheck: `Can you explain the method for ${topic} in your own words without looking at the solution?`,
  };
}

function normalizeWeakAreaRevisionPack(data: unknown, topic: string): WeakAreaRevisionPack {
  const record = data as Record<string, unknown>;
  const practiceMcqs = Array.isArray(record.practiceMcqs)
    ? record.practiceMcqs
        .map((item) => {
          const entry = item as Record<string, unknown>;
          const options = asStringArray(entry.options).slice(0, 4);
          const answer = asString(entry.answer);
          if (!asString(entry.question) || options.length !== 4 || !answer || !options.includes(answer)) {
            return null;
          }

          return {
            question: asString(entry.question),
            options,
            answer,
          };
        })
        .filter((item): item is WeakAreaRevisionPack["practiceMcqs"][number] => item !== null)
        .slice(0, 3)
    : [];

  const quickRevisionCards = Array.isArray(record.quickRevisionCards)
    ? record.quickRevisionCards
        .map((item) => {
          const entry = item as Record<string, unknown>;
          const front = asString(entry.front);
          const back = asString(entry.back);
          return front && back ? { front, back } : null;
        })
        .filter((item): item is WeakAreaRevisionPack["quickRevisionCards"][number] => item !== null)
        .slice(0, 3)
    : [];

  return {
    topic,
    headline: asString(record.headline) || `Revision burst for ${topic}`,
    conceptualExplanation:
      asString(record.conceptualExplanation) ||
      `Rebuild the core idea behind ${topic} before attempting more questions.`,
    shortNotes: asStringArray(record.shortNotes).slice(0, 4),
    practiceMcqs,
    quickRevisionCards,
    generatedAt: new Date().toISOString(),
  };
}

function normalizeSolveResult(data: unknown, sourceText: string): SolveResult {
  const record = data as Record<string, unknown>;
  const topicType = normalizeTopicType(record.topicType, sourceText);
  const fallback = buildSolveFallback(sourceText, topicType);
  const sections = normalizeSolveSections(record.sections);

  return {
    topicType,
    frameworkLabel: getSolveFramework(topicType).label,
    difficulty: normalizeSolveDifficulty(record.difficulty),
    estimatedMarks: normalizeEstimatedMarks(record.estimatedMarks),
    sections: sections.length > 0 ? sections : fallback.sections,
    relatedTopics: asStringArray(record.relatedTopics).length > 0 ? asStringArray(record.relatedTopics).slice(0, 3) : fallback.relatedTopics,
    confidenceCheck: asString(record.confidenceCheck) || fallback.confidenceCheck,
  };
}

export const __testUtils = {
  parseStructuredResponse,
  normalizeSummaryResult,
  normalizeExplanationResult,
  normalizeAssignmentResult,
  normalizeAssignmentEvaluationResult,
  normalizeRevisionResult,
  normalizeSolveResult,
  normalizeTeachBackEvaluationResult,
};

function normalizeSimilarSolveProblem(data: unknown, sourceText: string) {
  const record = data as Record<string, unknown>;
  const problem = asString(record.problem).trim();

  if (problem) {
    return problem;
  }

  return `Solve a similar problem based on: ${sourceText.trim()}`;
}

function splitConcept(item: string): ConceptCardData {
  const [left, ...rest] = item.split(":");
  if (rest.length === 0) {
    return {
      title: item,
      explanation: ["Quick revision note for this concept."],
    };
  }

  return {
    title: left.trim(),
    explanation: [rest.join(":").trim()],
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
    explanation: [fallback],
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

function ensureMinimumAssignmentSections(
  groups: AssignmentSectionGroup[],
  fallbackGroups: AssignmentSectionGroup[]
): AssignmentSectionGroup[] {
  if (groups.length === 0) {
    return fallbackGroups;
  }

  const mcqs = groups
    .flatMap((group) => group.questions)
    .filter((question) => question.type === "mcq" && question.options.length > 0);
  const analytical = groups
    .flatMap((group) => group.questions)
    .filter((question) => question.type === "analytical");

  const fallbackMcqs = fallbackGroups[0]?.questions ?? [];
  const fallbackAnalytical = fallbackGroups[1]?.questions ?? [];

  const finalMcqs = [...mcqs, ...fallbackMcqs].slice(0, 5).map((question) => ({
    ...question,
    type: "mcq" as const,
    marks: 2,
  }));
  const finalAnalytical = [...analytical, ...fallbackAnalytical].slice(0, 3).map((question) => ({
    ...question,
    type: "analytical" as const,
    marks: 5,
    options: [],
  }));

  return [
    {
      heading: groups[0]?.heading || "Section A: Conceptual Accuracy",
      description:
        groups[0]?.description || "Answer the objective questions by selecting the best option.",
      marks: finalMcqs.reduce((sum, question) => sum + question.marks, 0),
      questions: finalMcqs,
    },
    {
      heading: groups[1]?.heading || "Section B: Analytical Application",
      description:
        groups[1]?.description || "Write detailed long answers with clear reasoning and structure.",
      marks: finalAnalytical.reduce((sum, question) => sum + question.marks, 0),
      questions: finalAnalytical,
    },
  ];
}

function buildFallbackAssignmentSections(questions: AssignmentResult["questions"]): AssignmentSectionGroup[] {
  const firstHalf = questions.slice(0, 5).map((question) => ({
    ...question,
    type: (question.options.length > 0 ? "mcq" : "analytical") as "mcq" | "analytical",
    marks: question.marks || 2,
  }));
  const secondHalf = questions.slice(5, 8).map((question) => ({
    ...question,
    type: (question.options.length > 0 ? "mcq" : "analytical") as "mcq" | "analytical",
    marks: question.marks || 5,
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
  const topic = sanitizeTopic(sourceText);
  const displayTopic = formatTopicDisplay(topic);
  const isUsIranTopic =
    /(u\.?s\.?|united states).*(iran)|iran.*(u\.?s\.?|united states)/i.test(topic);
  const title = `${displayTopic} Assignment`;
  const introduction = `A structured practice set designed to test understanding, application, and explanation of ${displayTopic}.`;
  const coreConcepts = isUsIranTopic
    ? [
        "Historical background from the Shah era to the 1979 revolution",
        "Nuclear tensions, sanctions, and regional rivalry",
        "Strategic consequences for the Middle East and global energy routes",
      ]
    : [
        `${displayTopic} fundamentals`,
        "Core terminology and first principles",
        "Exam-style application and reasoning",
      ];
  const instructionList = [
    "Answer all questions clearly and in order.",
    "Use precise terminology wherever possible.",
    "For analytical responses, explain the reasoning behind your answer.",
  ];
  const instructions = instructionList.join(" ");
  const questions = buildTopicAwareFallbackQuestions(topic);

  return {
    title,
    introduction,
    coreConcepts,
    instructions,
    sections: [],
    questions,
    relatedTopics: [
      isUsIranTopic ? "The Iranian Revolution and hostage crisis" : `${displayTopic} examples`,
      isUsIranTopic ? "The JCPOA and nuclear diplomacy" : `${displayTopic} in real life`,
      isUsIranTopic ? "Proxy warfare and Gulf security" : `${displayTopic} practice questions`,
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

function formatTopicDisplay(value: string) {
  if (/(u\.?s\.?|united states).*(iran)|iran.*(u\.?s\.?|united states)/i.test(value)) {
    return "U.S.-Iran Conflict";
  }

  return toHeadline(value);
}

function sanitizeTopic(sourceText: string) {
  return sourceText.replace(/\s+/g, " ").trim() || "the topic";
}

function slugifyConceptId(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "concept";
}

function pathExists(
  edges: ConceptGraphEdge[],
  start: string,
  target: string,
  seen = new Set<string>()
): boolean {
  if (start === target) {
    return true;
  }

  if (seen.has(start)) {
    return false;
  }

  seen.add(start);

  return edges
    .filter((edge) => edge.from === start)
    .some((edge) => pathExists(edges, edge.to, target, seen));
}

function normalizeConceptDependencyGraph(data: unknown, sourceText: string): ConceptDependencyGraphResult {
  const record = data as Record<string, unknown>;
  const topic = asString(record.topic) || formatTopicDisplay(sanitizeTopic(sourceText));
  const topicId = slugifyConceptId(topic);
  const nodeMap = new Map<string, ConceptGraphNode>();

  const addNode = (node: ConceptGraphNode) => {
    if (!node.title.trim()) {
      return;
    }

    const id = slugifyConceptId(node.id || node.title);
    const existing = nodeMap.get(id);

    if (existing) {
      nodeMap.set(id, {
        ...existing,
        description: existing.description || node.description,
        level: existing.level === "core" ? existing.level : node.level,
      });
      return;
    }

    nodeMap.set(id, {
      ...node,
      id,
      description: node.description || `Study ${node.title} to strengthen this learning path.`,
      mastered: Boolean(node.mastered),
    });
  };

  normalizeConceptGraphNodes(record.nodes).forEach(addNode);

  asStringArray(record.prerequisites)
    .slice(0, 6)
    .forEach((title) =>
      addNode({
        id: title,
        title,
        level: "prerequisite",
        description: `Build this before taking on ${topic}.`,
        mastered: false,
      })
    );

  addNode({
    id: topicId,
    title: topic,
    level: "core",
    description: `Main topic Vidya is guiding you through right now.`,
    mastered: false,
  });

  asStringArray(record.advanced)
    .slice(0, 3)
    .forEach((title) =>
      addNode({
        id: title,
        title,
        level: "advanced",
        description: `Explore this after you are comfortable with ${topic}.`,
        mastered: false,
      })
    );

  const rawNodes = Array.from(nodeMap.values())
    .map((node) =>
      node.title.trim().toLowerCase() === topic.trim().toLowerCase()
        ? { ...node, id: topicId, level: "core" as const }
        : node
    )
    .slice(0, 8);

  const nodeIds = new Set(rawNodes.map((node) => node.id));
  const edges: ConceptGraphEdge[] = [];

  normalizeConceptGraphEdges(record.edges).forEach((edge) => {
    const normalized = {
      from: slugifyConceptId(edge.from),
      to: slugifyConceptId(edge.to),
    };

    if (!nodeIds.has(normalized.from) || !nodeIds.has(normalized.to) || normalized.from === normalized.to) {
      return;
    }

    const duplicate = edges.some((item) => item.from === normalized.from && item.to === normalized.to);
    if (duplicate || pathExists(edges, normalized.to, normalized.from)) {
      return;
    }

    edges.push(normalized);
  });

  const prerequisiteNodes = rawNodes.filter((node) => node.level === "prerequisite");
  const advancedNodes = rawNodes.filter((node) => node.level === "advanced");

  prerequisiteNodes.forEach((node) => {
    const exists = edges.some((edge) => edge.from === node.id && edge.to === topicId);
    if (!exists && !pathExists(edges, topicId, node.id)) {
      edges.push({ from: node.id, to: topicId });
    }
  });

  advancedNodes.forEach((node) => {
    const exists = edges.some((edge) => edge.from === topicId && edge.to === node.id);
    if (!exists && !pathExists(edges, node.id, topicId)) {
      edges.push({ from: topicId, to: node.id });
    }
  });

  const studyPath = [
    ...new Set(
      [
        ...asStringArray(record.studyPath),
        ...prerequisiteNodes.map((node) => node.title),
        topic,
      ].filter(Boolean)
    ),
  ];

  return {
    topic,
    prerequisites: prerequisiteNodes.map((node) => node.title),
    advanced: advancedNodes.map((node) => node.title),
    studyPath,
    nodes: rawNodes,
    edges,
  };
}

function isUsableConceptDependencyGraph(graph: ConceptDependencyGraphResult) {
  return (
    graph.topic.trim().length > 0 &&
    graph.nodes.length >= 3 &&
    graph.edges.length >= 2 &&
    graph.studyPath.length >= 2
  );
}

function buildFallbackConceptLabels(topic: string, topicType: TopicType) {
  switch (topicType) {
    case "math":
      return {
        prerequisites: ["Basic Definitions", "Core Formula Patterns", "Worked Examples"],
        advanced: ["Advanced Applications", "Exam Strategy"],
      };
    case "physics":
      return {
        prerequisites: ["Basic Definitions", "Units and Quantities", "Core Principles"],
        advanced: ["Problem Solving", "Real-World Applications"],
      };
    case "chemistry":
      return {
        prerequisites: ["Basic Definitions", "Key Reactions", "Core Concepts"],
        advanced: ["Applications", "Mechanism Analysis"],
      };
    case "biology":
      return {
        prerequisites: ["Basic Definitions", "Structure and Function", "Core Processes"],
        advanced: ["Applications", "Comparative Analysis"],
      };
    case "history":
      return {
        prerequisites: ["Historical Background", "Key Events", "Main Causes"],
        advanced: ["Consequences", "Critical Analysis"],
      };
    case "geography":
      return {
        prerequisites: ["Basic Definitions", "Location and Context", "Key Processes"],
        advanced: ["Case Studies", "Human Impact"],
      };
    case "economics":
      return {
        prerequisites: ["Basic Definitions", "Core Mechanisms", "Key Indicators"],
        advanced: ["Policy Impact", "Case Analysis"],
      };
    case "literature":
      return {
        prerequisites: ["Context", "Key Themes", "Important Devices"],
        advanced: ["Interpretation", "Critical Evaluation"],
      };
    case "logic":
      return {
        prerequisites: ["Basic Definitions", "Core Rules", "Worked Examples"],
        advanced: ["Optimization", "Edge Cases"],
      };
    default:
      return {
        prerequisites: ["Basic Definitions", "Background", "Core Ideas"],
        advanced: ["Applications", "Deeper Analysis"],
      };
  }
}

function buildFallbackConceptDependencyGraph(sourceText: string): ConceptDependencyGraphResult {
  const topic = formatTopicDisplay(sanitizeTopic(sourceText));
  const topicId = slugifyConceptId(topic);
  const topicType = detectTopicType(topic);
  const labels = buildFallbackConceptLabels(topic, topicType);

  const prerequisites = labels.prerequisites.map((label) => `${label} of ${topic}`);
  const advanced = labels.advanced.map((label) => `${label} of ${topic}`);

  const nodes: ConceptGraphNode[] = [
    ...prerequisites.map((title) => ({
      id: slugifyConceptId(title),
      title,
      level: "prerequisite" as const,
      description: `Build this before moving into ${topic}.`,
      mastered: false,
    })),
    {
      id: topicId,
      title: topic,
      level: "core" as const,
      description: `Main topic Vidya is guiding you through right now.`,
      mastered: false,
    },
    ...advanced.map((title) => ({
      id: slugifyConceptId(title),
      title,
      level: "advanced" as const,
      description: `Explore this after you are comfortable with ${topic}.`,
      mastered: false,
    })),
  ];

  const edges: ConceptGraphEdge[] = [
    { from: slugifyConceptId(prerequisites[0]), to: slugifyConceptId(prerequisites[1]) },
    { from: slugifyConceptId(prerequisites[1]), to: slugifyConceptId(prerequisites[2]) },
    { from: slugifyConceptId(prerequisites[2]), to: topicId },
    ...advanced.map((title) => ({
      from: topicId,
      to: slugifyConceptId(title),
    })),
  ];

  return {
    topic,
    prerequisites,
    advanced,
    studyPath: [...prerequisites, topic],
    nodes,
    edges,
  };
}

function hasLowQualityAssignmentContent(
  groups: AssignmentSectionGroup[],
  sourceText: string
) {
  if (groups.length === 0) {
    return true;
  }

  const flattened = groups.flatMap((group) => group.questions);
  if (flattened.length < 8) {
    return true;
  }

  const topic = sanitizeTopic(sourceText).toLowerCase();
  const genericPatterns = [
    /core idea behind/i,
    /exam-relevant focus/i,
    /best analytical approach/i,
    /strongest concluding takeaway/i,
    /definition, process, and significance/i,
    /how .* works/i,
    /\bthe topic\b/i,
    /\bthe concept\b/i,
    /\bmain cause\b/i,
    /\bmain consequence\b/i,
    /\bmost affected\b/i,
  ];

  const weakQuestions = flattened.filter((question) => {
    const combined = `${question.question} ${question.answer} ${question.options.map((option) => option.text).join(" ")}`;
    const genericHit = genericPatterns.some((pattern) => pattern.test(combined));
    const topicWords = topic.split(/\W+/).filter((word) => word.length > 3);
    const topicMentions = topicWords.filter((word) => combined.toLowerCase().includes(word)).length;

    return genericHit || topicMentions === 0;
  });

  if (/(u\.?s\.?|united states).*(iran)|iran.*(u\.?s\.?|united states)/i.test(topic)) {
    const anchorTerms = [
      "1979",
      "revolution",
      "hostage",
      "jcpoa",
      "nuclear",
      "sanctions",
      "soleimani",
      "strait of hormuz",
      "proxy",
      "gulf",
    ];
    const combinedText = flattened
      .map((question) => `${question.question} ${question.answer} ${question.options.map((option) => option.text).join(" ")}`)
      .join(" ")
      .toLowerCase();
    const anchorMatches = anchorTerms.filter((term) => combinedText.includes(term)).length;

    if (anchorMatches < 4) {
      return true;
    }
  }

  if (/\b(conflict|war|relations|geopolitics)\b/i.test(topic)) {
    const analyticalQuestions = flattened.filter((question) => question.type === "analytical");
    const coverageChecks = [
      analyticalQuestions.some((question) => /\b(background|history|historical|roots|origin)\b/i.test(question.question)),
      analyticalQuestions.some((question) => /\b(causes|factors|developments|actors|mechanisms|phases)\b/i.test(question.question)),
      analyticalQuestions.some((question) => /\b(consequences|effects|impact|de-escalation|diplomacy|economy)\b/i.test(question.question)),
    ];

    if (coverageChecks.includes(false)) {
      return true;
    }
  }

  return weakQuestions.length >= 2;
}

function buildTopicAwareFallbackQuestions(topic: string): AssignmentResult["questions"] {
  if (/(u\.?s\.?|united states).*(iran)|iran.*(u\.?s\.?|united states)/i.test(topic)) {
    return buildUsIranConflictFallback(topic);
  }

  if (/\b(conflict|war|dispute|relations|geopolitics|foreign policy|international relations)\b/i.test(topic)) {
    return buildConflictFallback(topic);
  }

  return buildGeneralFallbackQuestions(topic);
}

function prefersTopicAwareFallback(sourceText: string) {
  const topic = sanitizeTopic(sourceText);
  const wordCount = topic.split(/\s+/).filter(Boolean).length;

  if (wordCount > 8) {
    return false;
  }

  return /(u\.?s\.?|united states).*(iran)|iran.*(u\.?s\.?|united states)|\b(conflict|war|relations|geopolitics|foreign policy|current affairs)\b/i.test(
    topic
  );
}

function buildUsIranConflictFallback(topic: string): AssignmentResult["questions"] {
  return [
    {
      question: "Which event most directly transformed U.S.-Iran relations from alliance to hostility?",
      answer: "B. The 1979 Iranian Revolution and the hostage crisis.",
      type: "mcq",
      options: [
        { label: "A", text: "The Camp David Accords between Egypt and Israel." },
        { label: "B", text: "The 1979 Iranian Revolution and the hostage crisis." },
        { label: "C", text: "The end of the Cold War in 1991." },
        { label: "D", text: "The creation of the United Nations in 1945." },
      ],
      marks: 2,
    },
    {
      question: "What has been one of the central long-term issues in the U.S.-Iran conflict?",
      answer: "C. Disputes over Iran's nuclear programme and sanctions.",
      type: "mcq",
      options: [
        { label: "A", text: "A border dispute over shared territory." },
        { label: "B", text: "Competition over membership in NATO." },
        { label: "C", text: "Disputes over Iran's nuclear programme and sanctions." },
        { label: "D", text: "Control of the Panama Canal." },
      ],
      marks: 2,
    },
    {
      question: "Why is the Strait of Hormuz strategically important in discussions of U.S.-Iran tensions?",
      answer: "A. It is a vital route for global oil shipments, so instability there can affect energy markets.",
      type: "mcq",
      options: [
        { label: "A", text: "It is a vital route for global oil shipments, so instability there can affect energy markets." },
        { label: "B", text: "It is the formal border between the United States and Iran." },
        { label: "C", text: "It is where the United Nations headquarters is located." },
        { label: "D", text: "It is the only place where Iran can trade internationally." },
      ],
      marks: 2,
    },
    {
      question: "Which statement best describes the 2015 Joint Comprehensive Plan of Action (JCPOA)?",
      answer: "D. It was an agreement intended to limit Iran's nuclear activities in return for sanctions relief.",
      type: "mcq",
      options: [
        { label: "A", text: "It was a military alliance formed between Iran and the United States." },
        { label: "B", text: "It was a trade pact focused on agricultural exports." },
        { label: "C", text: "It permanently resolved every conflict between both countries." },
        { label: "D", text: "It was an agreement intended to limit Iran's nuclear activities in return for sanctions relief." },
      ],
      marks: 2,
    },
    {
      question: "Which development sharply escalated tensions in January 2020?",
      answer: "B. The U.S. killing of Iranian General Qasem Soleimani in a drone strike.",
      type: "mcq",
      options: [
        { label: "A", text: "Iran joining the European Union." },
        { label: "B", text: "The U.S. killing of Iranian General Qasem Soleimani in a drone strike." },
        { label: "C", text: "A joint U.S.-Iran naval exercise in the Gulf." },
        { label: "D", text: "The signing of a permanent peace treaty." },
      ],
      marks: 2,
    },
    {
      question: "Explain the historical background of the U.S.-Iran conflict. In your answer, include the pre-1979 relationship, the 1979 revolution, and the hostage crisis.",
      answer: "A strong answer should explain that the U.S. and Iran were close under the Shah, then relations collapsed after the 1979 Iranian Revolution and the U.S. embassy hostage crisis, which created long-term mistrust and shaped later sanctions and hostility.",
      type: "analytical",
      options: [],
      marks: 5,
    },
    {
      question: "Analyse the main causes of continuing tension between the United States and Iran. Refer to the nuclear issue, regional influence, sanctions, and proxy conflicts.",
      answer: "A strong answer should identify the nuclear programme and sanctions as central issues, explain rivalry over regional influence in the Middle East, and mention how proxy groups and security concerns keep the confrontation active even without full-scale direct war.",
      type: "analytical",
      options: [],
      marks: 5,
    },
    {
      question: "Assess the wider consequences of the U.S.-Iran conflict for the Middle East and the world economy.",
      answer: "A strong answer should discuss risks to regional stability, pressure on countries such as Iraq and Gulf states, possible disruption to oil shipping through the Strait of Hormuz, effects on global energy prices, and the importance of diplomacy to prevent escalation.",
      type: "analytical",
      options: [],
      marks: 5,
    },
  ];
}

function buildConflictFallback(topic: string): AssignmentResult["questions"] {
  return [
    {
      question: `Which factor is most important when explaining the origins of ${topic}?`,
      answer: "C. The historical grievances, strategic interests, and trigger events that led to confrontation.",
      type: "mcq",
      options: [
        { label: "A", text: "Only the personal opinions of one leader." },
        { label: "B", text: "A single random event with no background." },
        { label: "C", text: "The historical grievances, strategic interests, and trigger events that led to confrontation." },
        { label: "D", text: "Purely cultural differences with no political or security element." },
      ],
      marks: 2,
    },
    {
      question: `What kind of evidence best helps a student understand ${topic}?`,
      answer: "A. Key actors, timeline, causes, major turning points, and consequences.",
      type: "mcq",
      options: [
        { label: "A", text: "Key actors, timeline, causes, major turning points, and consequences." },
        { label: "B", text: "Only one quotation with no context." },
        { label: "C", text: "A list of countries unrelated to the issue." },
        { label: "D", text: "General statements that avoid concrete detail." },
      ],
      marks: 2,
    },
    {
      question: `Which question is most relevant to analysing ${topic}?`,
      answer: "D. How the conflict developed, who is involved, and what effects it has had.",
      type: "mcq",
      options: [
        { label: "A", text: "Which unrelated invention was made in the same decade?" },
        { label: "B", text: "What is the longest river in the world?" },
        { label: "C", text: "How many school subjects mention the topic by name?" },
        { label: "D", text: "How the conflict developed, who is involved, and what effects it has had." },
      ],
      marks: 2,
    },
    {
      question: `Which statement best reflects the role of diplomacy in ${topic}?`,
      answer: "B. Diplomacy can reduce escalation by addressing grievances, security concerns, and negotiated terms.",
      type: "mcq",
      options: [
        { label: "A", text: "Diplomacy never matters once tension begins." },
        { label: "B", text: "Diplomacy can reduce escalation by addressing grievances, security concerns, and negotiated terms." },
        { label: "C", text: "Diplomacy only matters for domestic elections." },
        { label: "D", text: "Diplomacy always produces immediate permanent peace." },
      ],
      marks: 2,
    },
    {
      question: `Which outcome is commonly examined when studying ${topic}?`,
      answer: "C. Its political, economic, humanitarian, and regional consequences.",
      type: "mcq",
      options: [
        { label: "A", text: "Only whether it changed school timetables." },
        { label: "B", text: "Only whether it produced one famous speech." },
        { label: "C", text: "Its political, economic, humanitarian, and regional consequences." },
        { label: "D", text: "Only the weather conditions during one event." },
      ],
      marks: 2,
    },
    {
      question: `Explain the background and immediate causes of ${topic}.`,
      answer: `A strong answer should identify the historical context, name the principal actors, and explain the major trigger events or disputes that caused ${topic} to escalate.`,
      type: "analytical",
      options: [],
      marks: 5,
    },
    {
      question: `Analyse the main phases, actors, or mechanisms involved in ${topic}.`,
      answer: `A strong answer should describe how ${topic} unfolded, identify the main state or non-state actors, and explain the strategic or political mechanisms that sustained the conflict.`,
      type: "analytical",
      options: [],
      marks: 5,
    },
    {
      question: `Discuss the consequences of ${topic} and evaluate possible paths toward de-escalation.`,
      answer: `A strong answer should cover the key consequences of ${topic}, such as political instability, economic costs, or humanitarian impact, and then evaluate realistic diplomatic or policy options for reducing tension.`,
      type: "analytical",
      options: [],
      marks: 5,
    },
  ];
}

function buildGeneralFallbackQuestions(topic: string): AssignmentResult["questions"] {
  return [
    {
      question: `Which option best identifies the main focus of ${topic}?`,
      answer: `B. The central definition, components, and significance of ${topic}.`,
      type: "mcq",
      options: [
        { label: "A", text: "Only isolated facts with no connection." },
        { label: "B", text: `The central definition, components, and significance of ${topic}.` },
        { label: "C", text: "Only opinions unrelated to the source." },
        { label: "D", text: "A summary of a different topic entirely." },
      ],
      marks: 2,
    },
    {
      question: `What makes an explanation of ${topic} most useful for exam preparation?`,
      answer: "A. Clear definitions, specific points, and accurate examples or applications.",
      type: "mcq",
      options: [
        { label: "A", text: "Clear definitions, specific points, and accurate examples or applications." },
        { label: "B", text: "Very vague language and repeated filler." },
        { label: "C", text: "Only one memorized line with no explanation." },
        { label: "D", text: "Points copied without understanding." },
      ],
      marks: 2,
    },
    {
      question: `Which revision method best helps a student remember ${topic}?`,
      answer: "D. Linking key terms to their meaning, structure, and relevance.",
      type: "mcq",
      options: [
        { label: "A", text: "Skipping the main idea and reading only the heading." },
        { label: "B", text: "Learning unrelated facts from another chapter." },
        { label: "C", text: "Ignoring examples and applications completely." },
        { label: "D", text: "Linking key terms to their meaning, structure, and relevance." },
      ],
      marks: 2,
    },
    {
      question: `Which type of statement is most accurate in an answer about ${topic}?`,
      answer: "C. A statement that defines the topic and explains how its major parts fit together.",
      type: "mcq",
      options: [
        { label: "A", text: "A statement that stays too broad to be checked." },
        { label: "B", text: "A statement that avoids the actual subject." },
        { label: "C", text: "A statement that defines the topic and explains how its major parts fit together." },
        { label: "D", text: "A statement based only on personal opinion." },
      ],
      marks: 2,
    },
    {
      question: `Which conclusion would strengthen an answer on ${topic}?`,
      answer: "B. A brief conclusion that restates the key insight and why it matters.",
      type: "mcq",
      options: [
        { label: "A", text: "A final line that introduces a completely new subject." },
        { label: "B", text: "A brief conclusion that restates the key insight and why it matters." },
        { label: "C", text: "A repeated heading with no content." },
        { label: "D", text: "An unrelated example with no link to the topic." },
      ],
      marks: 2,
    },
    {
      question: `Explain the meaning and key features of ${topic}.`,
      answer: `A strong answer should define ${topic} clearly and explain its main features, components, or principles in a logical sequence.`,
      type: "analytical",
      options: [],
      marks: 5,
    },
    {
      question: `Analyse how ${topic} works or why it is important.`,
      answer: `A strong answer should explain the core mechanism, process, or reasoning behind ${topic} and show why it matters in context.`,
      type: "analytical",
      options: [],
      marks: 5,
    },
    {
      question: `Discuss the applications, effects, or significance of ${topic}.`,
      answer: `A strong answer should connect ${topic} to relevant outcomes, examples, or implications and end with a concise evaluative conclusion.`,
      type: "analytical",
      options: [],
      marks: 5,
    },
  ];
}

export async function generateSummary(
  sourceText: string,
  language: LanguageMode,
  isSourceParam?: boolean
): Promise<AIResponseEnvelope<SummaryResult>> {
  const isSource = isSourceParam ?? (sourceText.trim().length > 250 || sourceText.trim().split(/\n/).length > 2);
  const webContext = await getOptionalWebContext(sourceText);

  // Trigger all 3 completions in parallel
  const [coreRes, extraRes, examRes] = await Promise.allSettled([
    createChatCompletion(summaryCorePrompt(sourceText, language, isSource, webContext)),
    createChatCompletion(summaryExtraPrompt(sourceText, language, isSource)),
    createChatCompletion(examQuestionsPrompt(sourceText, language, sourceText, isSource))
  ]);

  // Handle core response
  if (coreRes.status === "rejected") {
    throw new Error(`Failed to generate core summary: ${coreRes.reason}`);
  }
  
  const mainData = normalizeSummaryResult(parseStructuredResponse(coreRes.value.content));

  // Merge extra data if successful
  if (extraRes.status === "fulfilled") {
    try {
      const extraPayload = parseStructuredResponse<any>(extraRes.value.content);
      mainData.concepts = extraPayload.concepts || mainData.concepts;
      mainData.visualBlock = extraPayload.visualBlock || mainData.visualBlock;
      mainData.relatedTopics = extraPayload.relatedTopics || mainData.relatedTopics;
    } catch {
      // Fail silently for extra content
    }
  }

  // Merge exam questions if successful
  if (examRes.status === "fulfilled") {
    try {
      const examPayload = parseStructuredResponse<{ questions: any[] }>(examRes.value.content);
      mainData.examQuestions = normalizeExamQuestions(examPayload.questions);
    } catch {
      // Fail silently for exam questions
    }
  }

  return {
    data: mainData,
    provider: coreRes.value.provider,
    model: coreRes.value.model
  };
}

export async function generateExplanation(
  sourceText: string,
  language: LanguageMode,
  isSourceParam?: boolean
): Promise<AIResponseEnvelope<ExplanationResult>> {
  const isSource = isSourceParam ?? (sourceText.trim().length > 250 || sourceText.trim().split(/\n/).length > 2);
  const webContext = await getOptionalWebContext(sourceText);

  // Trigger all 3 completions in parallel
  const [coreRes, extraRes, examRes] = await Promise.allSettled([
    createChatCompletion(explanationCorePrompt(sourceText, language, isSource, webContext)),
    createChatCompletion(explanationExtraPrompt(sourceText, language)),
    createChatCompletion(examQuestionsPrompt(sourceText, language, sourceText, isSource))
  ]);

  // Handle core response
  if (coreRes.status === "rejected") {
    throw new Error(`Failed to generate core explanation: ${coreRes.reason}`);
  }

  const mainData = normalizeExplanationResult(parseStructuredResponse(coreRes.value.content));

  // Merge extra data if successful
  if (extraRes.status === "fulfilled") {
    try {
      const extraPayload = parseStructuredResponse<any>(extraRes.value.content);
      mainData.frameworkCards = extraPayload.frameworkCards || mainData.frameworkCards;
      mainData.coreConcepts = extraPayload.coreConcepts || mainData.coreConcepts;
      mainData.keyTakeaways = extraPayload.keyTakeaways || mainData.keyTakeaways;
      mainData.relatedTopics = extraPayload.relatedTopics || mainData.relatedTopics;
    } catch {
      // Fail silently
    }
  }

  // Merge exam questions if successful
  if (examRes.status === "fulfilled") {
    try {
      const examPayload = parseStructuredResponse<{ questions: any[] }>(examRes.value.content);
      mainData.examQuestions = normalizeExamQuestions(examPayload.questions);
    } catch {
      // Fail silently
    }
  }

  return {
    data: mainData,
    provider: coreRes.value.provider,
    model: coreRes.value.model
  };
}

export async function generateAssignment(
  sourceText: string,
  language: LanguageMode,
  isSourceParam?: boolean
): Promise<AIResponseEnvelope<AssignmentResult>> {
  const isSource = isSourceParam ?? (sourceText.trim().length > 250 || sourceText.trim().split(/\n/).length > 2);
  const webContext = await getOptionalWebContext(sourceText);
  const result = await createChatCompletion(assignmentPrompt(sourceText, language, isSource, webContext));

  return {
    data: normalizeAssignmentResult(parseStructuredResponse(result.content), sourceText),
    provider: result.provider,
    model: result.model
  };
}

export async function evaluateAssignment(
  sourceText: string,
  language: LanguageMode,
  submissions: AssignmentSubmission[]
): Promise<AIResponseEnvelope<AssignmentEvaluationResult>> {
  const serializedSubmissions = JSON.stringify(submissions, null, 2);
  const result = await createChatCompletion(
    assignmentEvaluationPrompt(language, sourceText, serializedSubmissions)
  );

  return {
    data: normalizeAssignmentEvaluationResult(
      parseStructuredResponse(result.content),
      submissions
    ),
    provider: result.provider,
    model: result.model
  };
}

export async function generateRevision(
  sourceText: string,
  language: LanguageMode,
  isSourceParam?: boolean
): Promise<AIResponseEnvelope<RevisionResult>> {
  const isSource = isSourceParam ?? (sourceText.trim().length > 250 || sourceText.trim().split(/\n/).length > 2);
  const webContext = await getOptionalWebContext(sourceText);
  const result = await createChatCompletion(revisionPrompt(sourceText, language, isSource, webContext));

  return {
    data: normalizeRevisionResult(parseStructuredResponse(result.content)),
    provider: result.provider,
    model: result.model
  };
}

export async function generateConceptDependencies(
  sourceText: string,
  language: LanguageMode
): Promise<AIResponseEnvelope<ConceptDependencyGraphResult>> {
  try {
    const result = await createChatCompletion(conceptDependencyPrompt(sourceText, language));
    const graph = normalizeConceptDependencyGraph(parseStructuredResponse(result.content), sourceText);

    return {
      data: isUsableConceptDependencyGraph(graph) ? graph : buildFallbackConceptDependencyGraph(sourceText),
      provider: result.provider,
      model: result.model,
    };
  } catch {
    return {
      data: buildFallbackConceptDependencyGraph(sourceText),
      provider: "fallback",
      model: "heuristic-learning-path",
    };
  }
}

export async function generateMockTest(
  sourceText: string,
  language: LanguageMode,
  difficulty: "easy" | "medium" | "hard" = "medium",
  testMode: "standard" | "competitive" = "standard",
  durationMinutes: number = 60,
  isSourceParam?: boolean
): Promise<AIResponseEnvelope<MockTestResult>> {
  const truncatedSource = sourceText.length > 7000 ? sourceText.slice(0, 7000) + "..." : sourceText;
  const webContext = await getOptionalWebContext(truncatedSource);
  const isSource = isSourceParam ?? (truncatedSource.trim().length > 250 || truncatedSource.trim().split(/\n/).length > 2);

  // Trigger parallel completions for header and both sections
  const [headerRes, sectionARes, sectionBRes] = await Promise.allSettled([
    createChatCompletion(mockTestHeaderPrompt(truncatedSource, language, difficulty, testMode, durationMinutes)),
    createChatCompletion(mockTestSectionAPrompt(truncatedSource, language, difficulty, testMode)),
    createChatCompletion(mockTestSectionBPrompt(truncatedSource, language, difficulty, testMode))
  ]);

  if (headerRes.status === "rejected") {
    throw new Error(`Failed to generate test header: ${headerRes.reason}`);
  }

  const headerData = parseStructuredResponse<any>(headerRes.value.content);
  
  let sectionA: MockTestQuestion[] = [];
  if (sectionARes.status === "fulfilled") {
    try {
      const aPayload = parseStructuredResponse<{ questions: MockTestQuestion[] }>(sectionARes.value.content);
      sectionA = aPayload.questions || [];
    } catch {
      // Fail silently for section questions
    }
  }

  let sectionB: MockTestQuestion[] = [];
  if (sectionBRes.status === "fulfilled") {
    try {
      const bPayload = parseStructuredResponse<{ questions: MockTestQuestion[] }>(sectionBRes.value.content);
      sectionB = bPayload.questions || [];
    } catch {
      // Fail silently for section questions
    }
  }

  const finalData = normalizeMockTestResult({
    ...headerData,
    sectionA,
    sectionB,
    relatedTopics: [] // Extra cleanup if needed
  });

  return {
    data: finalData,
    provider: headerRes.value.provider,
    model: headerRes.value.model,
  };
}

export async function evaluateMockTest(
  sourceText: string,
  language: LanguageMode,
  test: MockTestResult,
  submissions: MockTestSubmission[],
  autoSubmitted: boolean
): Promise<AIResponseEnvelope<MockTestEvaluationResult>> {
  const truncatedSource = sourceText.length > 7000 ? sourceText.slice(0, 7000) + "..." : sourceText;
  const serializedContext = JSON.stringify(
    {
      autoSubmitted,
      durationMinutes: test.durationMinutes,
      totalMarks: test.totalMarks,
      totalQuestions: test.totalQuestions,
      // Minimal submission data to save tokens
      submissions: submissions.map(s => ({
        questionId: s.questionId,
        question: s.questionType === "analytical" ? s.question : undefined,
        questionType: s.questionType,
        userAnswer: s.userAnswer,
        correctAnswer: s.correctAnswer,
        marks: s.marks
      })),
    },
    null,
    2
  );
  const result = await createChatCompletion(
    mockTestEvaluationPrompt(language, truncatedSource, serializedContext),
    1500 // Lower max_tokens for evaluation to fit within TPM limits
  );

  return {
    data: normalizeMockTestEvaluationResult(
      parseStructuredResponse(result.content),
      submissions,
      test,
      autoSubmitted
    ),
    provider: result.provider,
    model: result.model,
  };
}

export async function generateSolve(
  sourceText: string,
  language: LanguageMode
): Promise<AIResponseEnvelope<SolveResult>> {
  const result = await createChatCompletion(solvePrompt(sourceText, language));

  return {
    data: normalizeSolveResult(parseStructuredResponse(result.content), sourceText),
    provider: result.provider,
    model: result.model,
  };
}

export async function generateSimilarSolveProblem(
  sourceText: string,
  topicType: TopicType,
  difficulty: SolveDifficulty,
  language: LanguageMode
): Promise<AIResponseEnvelope<string>> {
  const result = await createChatCompletion(
    similarSolvePrompt(sourceText, topicType, difficulty, language)
  );

  return {
    data: normalizeSimilarSolveProblem(parseStructuredResponse(result.content), sourceText),
    provider: result.provider,
    model: result.model,
  };
}

export async function evaluateTeachBack(
  originalTopicSummary: string,
  studentExplanation: string
): Promise<AIResponseEnvelope<TeachBackEvaluationResult>> {
  const result = await createChatCompletion(
    teachBackEvaluationPrompt(originalTopicSummary, studentExplanation)
  );

  return {
    data: normalizeTeachBackEvaluationResult(parseStructuredResponse(result.content)),
    provider: result.provider,
    model: result.model,
  };
}

export async function generateWeakAreaRevision(
  topic: string,
  language: LanguageMode,
  weakConcepts: string[],
  weakQuestionTypes: string[],
  reason: string
): Promise<AIResponseEnvelope<WeakAreaRevisionPack>> {
  const result = await createChatCompletion(
    weakAreaRevisionPrompt(topic, language, weakConcepts, weakQuestionTypes, reason)
  );

  return {
    data: normalizeWeakAreaRevisionPack(parseStructuredResponse(result.content), topic),
    provider: result.provider,
    model: result.model,
  };
}

export function toClarificationPrompt(error: AmbiguousInputError): ClarificationPrompt {
  return {
    message: error.message,
    options: error.options
  };
}
