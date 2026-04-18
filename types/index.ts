export type StudyMode = "summary" | "explain" | "assignment" | "revision" | "solve" | "mocktest";
export type StudyRequestMode = StudyMode | "dependencies";

export type LanguageMode = "english" | "hinglish";
export type ExamType = "jee" | "neet" | "custom";
export type PreparationLevel = "beginner" | "intermediate" | "advanced";
export type StudyPlanPriority = "high" | "medium" | "low";
export type StudyPlanTaskType = "learn" | "revise" | "practice" | "mocktest";

export interface CitedPoint {
  text: string;
  citation?: string;
}

export interface ProcessingInput {
  sourceText: string;
  mode: StudyMode;
  language: LanguageMode;
  title?: string;
}

export interface StudySubsection {
  heading: string;
  points: (string | CitedPoint)[];
}

export interface StudySection {
  heading: string;
  paragraph: string;
  points: (string | CitedPoint)[];
  subsections: StudySubsection[];
}

export interface RealLifeExampleData {
  title?: string;
  body: string;
}

export interface ConceptCardData {
  title: string;
  explanation: (string | CitedPoint)[];
}

export interface VisualBlockData {
  title: string;
  description: (string | CitedPoint)[];
  buttonLabel: string;
}

export interface TopicImageData {
  imageUrl: string;
  title: string;
  description: string;
  sourceUrl: string;
  sourceLabel: string;
}

export interface AnalogyCardData {
  title: string;
  explanation: (string | CitedPoint)[];
  note?: string;
}

export interface FormulaVariable {
  label: string;
  description: string;
}

export interface FormulaBlockData {
  expression: string;
  latex?: string;
  caption: string;
  variables: FormulaVariable[];
}

export interface InfoCardData {
  title: string;
  description: (string | CitedPoint)[];
  eyebrow?: string;
}

export interface MarkingSchemeItem {
  label: string;
  value: string;
}

export interface AssignmentOption {
  label: string;
  text: string;
}

export interface ExamQuestion {
  question: string | CitedPoint;
  difficulty: "easy" | "medium" | "hard";
  type: "MCQ" | "short answer" | "long answer";
  relevance: "JEE" | "NEET" | "Board";
  options?: AssignmentOption[];
  answer: string | CitedPoint;
}

export interface SummaryResult {
  title: string;
  introduction: string;
  coreConcepts: (string | CitedPoint)[];
  sections: StudySection[];
  relatedTopics: string[];
  concepts: ConceptCardData[];
  visualBlock: VisualBlockData | null;
  examQuestions?: ExamQuestion[];
}

export interface ExplanationResult {
  title: string;
  introduction: string;
  coreConcepts: (string | CitedPoint)[];
  sections: StudySection[];
  relatedTopics: string[];
  analogyCard: AnalogyCardData | null;
  formulaBlock: FormulaBlockData | null;
  frameworkCards: InfoCardData[];
  keyTakeaways: (string | CitedPoint)[];
  examQuestions?: ExamQuestion[];
}

export interface AssignmentQuestion {
  question: string;
  answer: string;
  type: "mcq" | "analytical";
  options: AssignmentOption[];
  marks: number;
}

export interface AssignmentSubmission {
  questionKey: string;
  question: string;
  questionType: "mcq" | "analytical";
  marks: number;
  userAnswer: string;
  correctAnswer: string;
  options: AssignmentOption[];
}

export interface AssignmentEvaluationItem {
  questionKey: string;
  question: string;
  questionType: "mcq" | "analytical";
  isCorrect: boolean;
  score: number;
  maxScore: number;
  userAnswer: string;
  correctAnswer: string;
  feedback: string;
}

export interface AssignmentEvaluationResult {
  summary: string;
  totalScore: number;
  totalMarks: number;
  results: AssignmentEvaluationItem[];
}

export interface WorkspaceHistoryItem {
  id: string;
  title: string;
  introduction: string;
  sourceText: string;
  language: LanguageMode;
  mode: StudyMode;
  createdAt: string;
  resultData?: unknown;
}

export interface WorkspaceLibraryItem {
  id: string;
  title: string;
  introduction: string;
  sourceText: string;
  language: LanguageMode;
  lastMode: StudyMode;
  updatedAt: string;
  visits: number;
  resultData?: unknown;
}

export interface AssignmentSectionGroup {
  heading: string;
  description: string;
  marks: number;
  questions: AssignmentQuestion[];
}

export interface AssignmentResult {
  title: string;
  introduction: string;
  coreConcepts: string[];
  instructions: string;
  sections: StudySection[];
  questions: AssignmentQuestion[];
  relatedTopics: string[];
  instructionList: string[];
  sectionGroups: AssignmentSectionGroup[];
  markingScheme: MarkingSchemeItem[];
}

export interface RevisionResult {
  mcqs: { question: string; options: string[]; answer: string }[];
  shortQuestions: { question: string; answer: string }[];
  keyConcepts: { term: string; definition: string }[];
}

export type PerformanceSource = "mocktest" | "assignment" | "revision";
export type PerformanceQuestionType = "mcq" | "analytical" | "revision";
export type PerformanceDifficulty = "easy" | "medium" | "hard" | "unknown";

export interface PerformanceLogEntry {
  id: string;
  userId: string;
  source: PerformanceSource;
  topic: string;
  concepts: string[];
  questionId: string;
  questionText: string;
  questionType: PerformanceQuestionType;
  difficulty: PerformanceDifficulty;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  score: number;
  maxScore: number;
  timeTakenSeconds: number | null;
  timestamp: string;
}

export interface PerformanceTopicInsight {
  topic: string;
  accuracy: number;
  averageTimeSeconds: number | null;
  attemptRate: number;
  repeatedMistakes: number;
  attempts: number;
  incorrectAttempts: number;
  weakConcepts: string[];
  weakQuestionTypes: PerformanceQuestionType[];
  suggestion: string;
  reason: string;
}

export interface PerformanceConceptInsight {
  concept: string;
  topic: string;
  accuracy: number;
  mistakeFrequency: number;
  attempts: number;
  suggestion: string;
}

export interface PerformanceQuestionTypeInsight {
  questionType: PerformanceQuestionType;
  accuracy: number;
  averageTimeSeconds: number | null;
  attempts: number;
  suggestion: string;
}

export interface PerformanceInsightSnapshot {
  generatedAt: string;
  totalAttempts: number;
  overview: string;
  improvementNeededIn: string;
  focusAreas: string[];
  weakTopics: PerformanceTopicInsight[];
  weakConcepts: PerformanceConceptInsight[];
  weakQuestionTypes: PerformanceQuestionTypeInsight[];
}

export interface WeakAreaRevisionMcq {
  question: string;
  options: string[];
  answer: string;
}

export interface WeakAreaRevisionCard {
  front: string;
  back: string;
}

export interface WeakAreaRevisionPack {
  topic: string;
  headline: string;
  conceptualExplanation: string;
  shortNotes: string[];
  practiceMcqs: WeakAreaRevisionMcq[];
  quickRevisionCards: WeakAreaRevisionCard[];
  generatedAt: string;
}

export type MockTestDifficulty = "easy" | "medium" | "hard";

export interface MockTestOption {
  label: string;
  text: string;
}

export interface MockTestMcqQuestion {
  id: string;
  type: "mcq";
  question: string;
  options: MockTestOption[];
  correctAnswer: string;
  marks: number;
  difficulty: MockTestDifficulty;
  explanation: (string | CitedPoint)[];
}

export interface MockTestAnalyticalQuestion {
  id: string;
  type: "analytical";
  question: string;
  sampleAnswer: string;
  marks: number;
  difficulty: MockTestDifficulty;
  explanation: (string | CitedPoint)[];
}

export type MockTestQuestion = MockTestMcqQuestion | MockTestAnalyticalQuestion;

export interface MockTestSection {
  id: string;
  title: string;
  description: string;
  questions: MockTestQuestion[];
}

export interface MockTestResult {
  title: string;
  introduction: string;
  instructions: string[];
  durationMinutes: number;
  negativeMarking: number;
  totalMarks: number;
  totalQuestions: number;
  markingScheme: MarkingSchemeItem[];
  sectionA: MockTestQuestion[];
  sectionB: MockTestQuestion[];
  sections: MockTestSection[];
  relatedTopics: string[];
}

export interface MockTestSubmission {
  questionId: string;
  question: string;
  questionType: MockTestQuestion["type"];
  sectionId: string;
  sectionTitle: string;
  marks: number;
  difficulty: MockTestDifficulty;
  userAnswer: string;
  correctAnswer: string;
  options: MockTestOption[];
  timeSpentSeconds: number;
}

export interface MockTestEvaluationItem {
  questionId: string;
  question: string;
  questionType: MockTestQuestion["type"];
  sectionId: string;
  sectionTitle: string;
  difficulty: MockTestDifficulty;
  isCorrect: boolean;
  score: number;
  maxScore: number;
  userAnswer: string;
  correctAnswer: string;
  feedback: string;
  timeSpentSeconds: number;
}

export interface MockTestSectionPerformance {
  sectionId: string;
  title: string;
  score: number;
  totalMarks: number;
  attempted: number;
  totalQuestions: number;
  accuracy: number;
}

export interface MockTestAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  timeEfficiency: string;
}

export interface MockTestEvaluationResult {
  summary: string;
  totalScore: number;
  totalMarks: number;
  accuracy: number;
  attempted: number;
  totalQuestions: number;
  timeLimitSeconds: number;
  totalTimeSpentSeconds: number;
  autoSubmitted: boolean;
  sectionPerformance: MockTestSectionPerformance[];
  results: MockTestEvaluationItem[];
  analysis: MockTestAnalysis;
}

export type TopicType =
  | "math"
  | "physics"
  | "chemistry"
  | "biology"
  | "history"
  | "geography"
  | "economics"
  | "literature"
  | "logic"
  | "general";

export interface StudyPlanTask {
  id: string;
  subject: string;
  topic: string;
  type: StudyPlanTaskType;
  durationHours: number;
  completed: boolean;
  difficulty?: string;
}

export interface StudyPlanDay {
  date: string;
  tasks: StudyPlanTask[];
  plannedHours: number;
}

export interface StudyPlan {
  id: string;
  createdAt: string;
  language: LanguageMode;
  input: StudyPlanInput;
  weakTopics: string[];
  days: StudyPlanDay[];
}

export interface StudyPlanSubjectInput {
  id: string;
  name: string;
  priority: StudyPlanPriority;
  topics: string[];
}

export interface StudyPlanInput {
  examType: ExamType;
  examDate: string;
  dailyStudyHours: number;
  currentPreparationLevel: PreparationLevel;
  subjects: StudyPlanSubjectInput[];
}

export type SolveSectionType = "text" | "steps" | "formula" | "highlight" | "warning";

export type SolveDifficulty = "easy" | "medium" | "hard";

export interface SolveSection {
  id: string;
  title: string;
  content: string;
  type: SolveSectionType;
}

export interface SolveResult {
  topicType: TopicType;
  frameworkLabel: string;
  difficulty: SolveDifficulty;
  estimatedMarks: 2 | 3 | 5 | 8 | 10;
  sections: SolveSection[];
  relatedTopics: string[];
  confidenceCheck: string;
}

export interface TeachBackEvaluationResult {
  score: number;
  understoodWell: string[];
  gaps: string[];
  misconceptions: string[];
  feedback: string;
  nextStep: string;
}

export interface TeachBackAttempt {
  id: string;
  topicKey: string;
  topicTitle: string;
  submittedAt: string;
  studentExplanation: string;
  evaluation: TeachBackEvaluationResult;
}

export interface AIResponseEnvelope<T> {
  data: T;
  provider: string;
  model: string;
}

export interface ClarificationPrompt {
  message: string;
  options: string[];
}

export type ConceptNodeLevel = "prerequisite" | "core" | "advanced";

export interface ConceptGraphNode {
  id: string;
  title: string;
  level: ConceptNodeLevel;
  description: string;
  mastered?: boolean;
}

export interface ConceptGraphEdge {
  from: string;
  to: string;
}

export interface ConceptDependencyGraphResult {
  topic: string;
  prerequisites: string[];
  advanced: string[];
  studyPath: string[];
  nodes: ConceptGraphNode[];
  edges: ConceptGraphEdge[];
}

export type UserTier = "free" | "student" | "achiever" | "elite";

export interface FeatureItem {
  title: string;
  description: string;
}

export type {
  FlashcardCard,
  FlashcardDeck,
  FlashcardDeckSummary,
  FlashcardReviewLog,
  FlashcardType,
  Rating,
} from "./flashcards";
