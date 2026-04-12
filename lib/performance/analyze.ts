import type {
  PerformanceConceptInsight,
  PerformanceInsightSnapshot,
  PerformanceLogEntry,
  PerformanceQuestionType,
  PerformanceQuestionTypeInsight,
  PerformanceTopicInsight,
} from "@/types";

const FAST_TIME_BY_TYPE: Record<PerformanceQuestionType, number> = {
  mcq: 45,
  analytical: 140,
  revision: 30,
};

const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "analytical",
  "answer",
  "because",
  "below",
  "between",
  "concept",
  "define",
  "describe",
  "discuss",
  "does",
  "each",
  "explain",
  "from",
  "have",
  "into",
  "itself",
  "more",
  "most",
  "note",
  "only",
  "question",
  "revise",
  "short",
  "should",
  "their",
  "there",
  "these",
  "this",
  "topic",
  "under",
  "what",
  "when",
  "which",
  "write",
  "your",
]);

export function analyzePerformance(logs: PerformanceLogEntry[]): PerformanceInsightSnapshot {
  const sortedLogs = [...logs].sort((left, right) => right.timestamp.localeCompare(left.timestamp));
  if (sortedLogs.length === 0) {
    return {
      generatedAt: new Date().toISOString(),
      totalAttempts: 0,
      overview: "No performance data yet. Complete a mock test, assignment, or revision review to let Saar AI detect your weak areas automatically.",
      improvementNeededIn: "Your first graded attempt",
      focusAreas: [],
      weakTopics: [],
      weakConcepts: [],
      weakQuestionTypes: [],
    };
  }

  const topicMap = new Map<string, PerformanceLogEntry[]>();
  const conceptMap = new Map<string, PerformanceLogEntry[]>();
  const questionTypeMap = new Map<PerformanceQuestionType, PerformanceLogEntry[]>();

  for (const log of sortedLogs) {
    const topicKey = normalizeLabel(log.topic) || "General Study";
    const topicEntries = topicMap.get(topicKey) ?? [];
    topicEntries.push(log);
    topicMap.set(topicKey, topicEntries);

    const concepts = log.concepts.length > 0 ? log.concepts : [topicKey];
    for (const concept of concepts) {
      const conceptKey = `${topicKey}::${normalizeLabel(concept) || topicKey}`;
      const conceptEntries = conceptMap.get(conceptKey) ?? [];
      conceptEntries.push(log);
      conceptMap.set(conceptKey, conceptEntries);
    }

    const typeEntries = questionTypeMap.get(log.questionType) ?? [];
    typeEntries.push(log);
    questionTypeMap.set(log.questionType, typeEntries);
  }

  const weakTopics = Array.from(topicMap.entries())
    .map(([topic, entries]) => buildTopicInsight(topic, entries))
    .filter((item) => isWeakTopic(item))
    .sort(sortByWeakness)
    .slice(0, 6);

  const weakConcepts = Array.from(conceptMap.entries())
    .map(([key, entries]) => buildConceptInsight(key, entries))
    .filter((item) => item.mistakeFrequency >= 2 || item.accuracy < 60)
    .sort((left, right) => {
      if (right.mistakeFrequency !== left.mistakeFrequency) {
        return right.mistakeFrequency - left.mistakeFrequency;
      }
      return left.accuracy - right.accuracy;
    })
    .slice(0, 8);

  const weakQuestionTypes = Array.from(questionTypeMap.entries())
    .map(([questionType, entries]) => buildQuestionTypeInsight(questionType, entries))
    .filter((item) => item.accuracy < 70 || hasSlowIncorrectPattern(questionTypeMap.get(item.questionType) ?? []))
    .sort((left, right) => left.accuracy - right.accuracy)
    .slice(0, 3);

  const focusAreas = Array.from(
    new Set([
      ...weakTopics.map((item) => item.topic),
      ...weakConcepts.map((item) => item.concept),
      ...weakQuestionTypes.map((item) => questionTypeLabel(item.questionType)),
    ])
  ).slice(0, 5);

  const weakestTopic = weakTopics[0]?.topic ?? weakConcepts[0]?.topic ?? "accuracy under timed practice";
  const overview = buildOverview(weakTopics, weakConcepts, weakQuestionTypes);

  return {
    generatedAt: new Date().toISOString(),
    totalAttempts: sortedLogs.length,
    overview,
    improvementNeededIn: weakestTopic,
    focusAreas,
    weakTopics,
    weakConcepts,
    weakQuestionTypes,
  };
}

export function deriveConcepts(topic: string, questionText: string, fallback: string[] = []) {
  const candidates = [...fallback];
  const normalizedTopic = normalizeLabel(topic);
  if (normalizedTopic) {
    candidates.push(normalizedTopic);
  }

  const sanitized = questionText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4 && !STOP_WORDS.has(token));

  for (const token of sanitized.slice(0, 6)) {
    candidates.push(toTitleCase(token));
  }

  return Array.from(new Set(candidates.map((item) => normalizeLabel(item)).filter(Boolean))).slice(0, 4);
}

function buildTopicInsight(topic: string, entries: PerformanceLogEntry[]): PerformanceTopicInsight {
  const attempted = entries.filter((entry) => entry.userAnswer.trim().length > 0).length;
  const correct = entries.filter((entry) => entry.isCorrect).length;
  const incorrect = entries.length - correct;
  const times = entries.map((entry) => entry.timeTakenSeconds).filter((value): value is number => typeof value === "number");
  const questionTypes = Array.from(new Set(entries.filter((entry) => !entry.isCorrect).map((entry) => entry.questionType))).slice(0, 3);
  const weakConcepts = summarizeWeakConcepts(entries);
  const accuracy = percentage(correct, entries.length);
  const attemptRate = percentage(attempted, entries.length);
  const averageTimeSeconds = times.length > 0 ? Math.round(times.reduce((sum, value) => sum + value, 0) / times.length) : null;
  const repeatedMistakes = getRepeatedMistakes(entries);
  const reason = buildWeakReason(entries, accuracy, repeatedMistakes, averageTimeSeconds);

  return {
    topic,
    accuracy,
    averageTimeSeconds,
    attemptRate,
    repeatedMistakes,
    attempts: entries.length,
    incorrectAttempts: incorrect,
    weakConcepts,
    weakQuestionTypes: questionTypes,
    suggestion: buildTopicSuggestion(accuracy, questionTypes, weakConcepts),
    reason,
  };
}

function buildConceptInsight(key: string, entries: PerformanceLogEntry[]): PerformanceConceptInsight {
  const [topic, conceptLabel] = key.split("::");
  const accuracy = percentage(entries.filter((entry) => entry.isCorrect).length, entries.length);
  const mistakeFrequency = entries.filter((entry) => !entry.isCorrect).length;

  return {
    topic,
    concept: conceptLabel,
    accuracy,
    mistakeFrequency,
    attempts: entries.length,
    suggestion:
      accuracy < 60
        ? `Rebuild ${conceptLabel} using one clear explanation and 3 quick recall questions.`
        : `Keep ${conceptLabel} fresh with one short practice set and spaced recall.`,
  };
}

function buildQuestionTypeInsight(
  questionType: PerformanceQuestionType,
  entries: PerformanceLogEntry[]
): PerformanceQuestionTypeInsight {
  const accuracy = percentage(entries.filter((entry) => entry.isCorrect).length, entries.length);
  const times = entries.map((entry) => entry.timeTakenSeconds).filter((value): value is number => typeof value === "number");
  const averageTimeSeconds = times.length > 0 ? Math.round(times.reduce((sum, value) => sum + value, 0) / times.length) : null;

  return {
    questionType,
    accuracy,
    averageTimeSeconds,
    attempts: entries.length,
    suggestion:
      questionType === "analytical"
        ? "Practice structure first: point, explanation, and example."
        : questionType === "mcq"
          ? "Do short timed sets to improve speed and elimination."
          : "Use fast recall loops with short revision cards.",
  };
}

function buildOverview(
  weakTopics: PerformanceTopicInsight[],
  weakConcepts: PerformanceConceptInsight[],
  weakQuestionTypes: PerformanceQuestionTypeInsight[]
) {
  if (weakTopics.length === 0 && weakConcepts.length === 0 && weakQuestionTypes.length === 0) {
    return "Your recent performance looks stable. Keep practicing to maintain retention and pacing.";
  }

  const topicLine = weakTopics[0]
    ? `You are losing the most marks in ${weakTopics[0].topic} (${weakTopics[0].accuracy}% accuracy).`
    : "";
  const conceptLine = weakConcepts[0]
    ? `The concept that repeats most often in mistakes is ${weakConcepts[0].concept}.`
    : "";
  const questionTypeLine = weakQuestionTypes[0]
    ? `${questionTypeLabel(weakQuestionTypes[0].questionType)} questions need extra attention.`
    : "";

  return [topicLine, conceptLine, questionTypeLine].filter(Boolean).join(" ");
}

function buildWeakReason(
  entries: PerformanceLogEntry[],
  accuracy: number,
  repeatedMistakes: number,
  averageTimeSeconds: number | null
) {
  if (accuracy < 60) {
    return `Accuracy is at ${accuracy}% across ${entries.length} attempts.`;
  }

  if (repeatedMistakes >= 3) {
    return `The same topic caused ${repeatedMistakes} repeated mistakes.`;
  }

  if (averageTimeSeconds !== null && hasSlowIncorrectPattern(entries)) {
    return `Responses are taking longer than expected and still leading to errors.`;
  }

  return "Recent attempts show this area needs another revision cycle.";
}

function buildTopicSuggestion(
  accuracy: number,
  weakQuestionTypes: PerformanceQuestionType[],
  weakConcepts: string[]
) {
  const firstConcept = weakConcepts[0];
  const typeHint = weakQuestionTypes[0];

  if (accuracy < 45 && firstConcept) {
    return `Start with short notes on ${firstConcept}, then do one guided practice set.`;
  }

  if (typeHint === "analytical") {
    return "Revise the concept, then practice writing 2 structured analytical answers.";
  }

  if (typeHint === "mcq") {
    return "Do a timed MCQ burst after revising the core formula or definition.";
  }

  return "Use a short concept recap, then test yourself with focused retrieval.";
}

function summarizeWeakConcepts(entries: PerformanceLogEntry[]) {
  const conceptCounts = new Map<string, number>();

  entries
    .filter((entry) => !entry.isCorrect)
    .forEach((entry) => {
      const concepts = entry.concepts.length > 0 ? entry.concepts : [entry.topic];
      concepts.forEach((concept) => {
        const key = normalizeLabel(concept);
        if (key) {
          conceptCounts.set(key, (conceptCounts.get(key) ?? 0) + 1);
        }
      });
    });

  return Array.from(conceptCounts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([concept]) => concept);
}

function getRepeatedMistakes(entries: PerformanceLogEntry[]) {
  const incorrectQuestions = new Map<string, number>();
  entries
    .filter((entry) => !entry.isCorrect)
    .forEach((entry) => {
      incorrectQuestions.set(entry.questionId, (incorrectQuestions.get(entry.questionId) ?? 0) + 1);
    });

  return Array.from(incorrectQuestions.values()).filter((count) => count >= 1).length;
}

function hasSlowIncorrectPattern(entries: PerformanceLogEntry[]) {
  return entries.some((entry) => {
    if (entry.isCorrect || typeof entry.timeTakenSeconds !== "number") {
      return false;
    }

    return entry.timeTakenSeconds > FAST_TIME_BY_TYPE[entry.questionType];
  });
}

function isWeakTopic(topic: PerformanceTopicInsight) {
  return (
    topic.accuracy < 60 ||
    topic.repeatedMistakes >= 3 ||
    (topic.averageTimeSeconds !== null && topic.averageTimeSeconds > 75 && topic.incorrectAttempts > 0)
  );
}

function sortByWeakness(left: PerformanceTopicInsight, right: PerformanceTopicInsight) {
  if (left.accuracy !== right.accuracy) {
    return left.accuracy - right.accuracy;
  }

  if (right.repeatedMistakes !== left.repeatedMistakes) {
    return right.repeatedMistakes - left.repeatedMistakes;
  }

  return right.incorrectAttempts - left.incorrectAttempts;
}

function percentage(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function normalizeLabel(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function questionTypeLabel(questionType: PerformanceQuestionType) {
  if (questionType === "mcq") {
    return "MCQ accuracy";
  }

  if (questionType === "analytical") {
    return "Analytical writing";
  }

  return "Revision recall";
}
