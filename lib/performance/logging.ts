import { deriveConcepts } from "@/lib/performance/analyze";
import type {
  AssignmentEvaluationResult,
  AssignmentSubmission,
  MockTestEvaluationResult,
  MockTestSubmission,
  PerformanceLogEntry,
  PerformanceQuestionType,
  PerformanceSource,
  TeachBackEvaluationResult,
} from "@/types";

export function buildAssignmentPerformanceLogs(
  topic: string,
  submissions: AssignmentSubmission[],
  evaluation: AssignmentEvaluationResult
): Array<Omit<PerformanceLogEntry, "id" | "userId">> {
  return evaluation.results.map((result) => {
    const submission = submissions.find((item) => item.questionKey === result.questionKey);
    const questionText = submission?.question ?? result.question;
    return buildPerformanceEntry({
      source: "assignment",
      topic,
      questionId: result.questionKey,
      questionText,
      questionType: result.questionType,
      difficulty: "medium",
      userAnswer: result.userAnswer,
      correctAnswer: result.correctAnswer,
      isCorrect: result.isCorrect,
      score: result.score,
      maxScore: result.maxScore,
      timeTakenSeconds: null,
      concepts: deriveConcepts(topic, questionText),
      timestamp: new Date().toISOString(),
    });
  });
}

export function buildMockTestPerformanceLogs(
  topic: string,
  submissions: MockTestSubmission[],
  evaluation: MockTestEvaluationResult
): Array<Omit<PerformanceLogEntry, "id" | "userId">> {
  return evaluation.results.map((result) => {
    const submission = submissions.find((item) => item.questionId === result.questionId);
    const questionText = submission?.question ?? result.question;
    return buildPerformanceEntry({
      source: "mocktest",
      topic,
      questionId: result.questionId,
      questionText,
      questionType: result.questionType,
      difficulty: result.difficulty,
      userAnswer: result.userAnswer,
      correctAnswer: result.correctAnswer,
      isCorrect: result.isCorrect,
      score: result.score,
      maxScore: result.maxScore,
      timeTakenSeconds: result.timeSpentSeconds,
      concepts: deriveConcepts(topic, questionText),
      timestamp: new Date().toISOString(),
    });
  });
}

export function buildTeachBackPerformanceLog(
  topic: string,
  studentExplanation: string,
  evaluation: TeachBackEvaluationResult
): Omit<PerformanceLogEntry, "id" | "userId"> {
  const missedConcepts = evaluation.gaps.length > 0 ? evaluation.gaps : deriveConcepts(topic, studentExplanation);
  const normalizedScore = Math.max(0, Math.min(100, evaluation.score));
  return buildPerformanceEntry({
    source: "revision",
    topic,
    questionId: `teach-back-${Date.now()}`,
    questionText: `Teach-back on ${topic}`,
    questionType: "revision",
    difficulty: "medium",
    userAnswer: studentExplanation,
    correctAnswer: evaluation.understoodWell.join("; "),
    isCorrect: normalizedScore >= 70 && evaluation.gaps.length === 0 && evaluation.misconceptions.length === 0,
    score: normalizedScore,
    maxScore: 100,
    timeTakenSeconds: null,
    concepts: missedConcepts,
    timestamp: new Date().toISOString(),
  });
}

export function buildFlashcardPerformanceLog(payload: {
  topic: string;
  cardFront: string;
  cardBack: string;
  rating: 1 | 2 | 4 | 5;
  timeTakenMs?: number | null;
  concepts?: string[];
}) {
  const score = payload.rating >= 4 ? 1 : 0;
  return buildPerformanceEntry({
    source: "revision",
    topic: payload.topic,
    questionId: `flashcard-${payload.cardFront.slice(0, 32)}-${Date.now()}`,
    questionText: payload.cardFront,
    questionType: "revision",
    difficulty: "easy",
    userAnswer: `Flashcard rating ${payload.rating}`,
    correctAnswer: payload.cardBack,
    isCorrect: score === 1,
    score,
    maxScore: 1,
    timeTakenSeconds:
      typeof payload.timeTakenMs === "number" ? Math.max(1, Math.round(payload.timeTakenMs / 1000)) : null,
    concepts:
      payload.concepts && payload.concepts.length > 0
        ? payload.concepts
        : deriveConcepts(payload.topic, `${payload.cardFront} ${payload.cardBack}`),
    timestamp: new Date().toISOString(),
  });
}

function buildPerformanceEntry(entry: {
  source: PerformanceSource;
  topic: string;
  questionId: string;
  questionText: string;
  questionType: PerformanceQuestionType;
  difficulty: "easy" | "medium" | "hard" | "unknown";
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  score: number;
  maxScore: number;
  timeTakenSeconds: number | null;
  concepts: string[];
  timestamp: string;
}): Omit<PerformanceLogEntry, "id" | "userId"> {
  return {
    source: entry.source,
    topic: entry.topic.trim() || "General Study",
    concepts: entry.concepts,
    questionId: entry.questionId,
    questionText: entry.questionText,
    questionType: entry.questionType,
    difficulty: entry.difficulty,
    userAnswer: entry.userAnswer,
    correctAnswer: entry.correctAnswer,
    isCorrect: entry.isCorrect,
    score: entry.score,
    maxScore: entry.maxScore,
    timeTakenSeconds: entry.timeTakenSeconds,
    timestamp: entry.timestamp,
  };
}
