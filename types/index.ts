export type StudyMode = "summary" | "explain" | "assignment" | "revision" | "solve";

export type LanguageMode = "english" | "hinglish";

export interface ProcessingInput {
  sourceText: string;
  mode: StudyMode;
  language: LanguageMode;
  title?: string;
}

export interface StudySubsection {
  heading: string;
  points: string[];
}

export interface StudySection {
  heading: string;
  paragraph: string;
  points: string[];
  subsections: StudySubsection[];
}

export interface RealLifeExampleData {
  title?: string;
  body: string;
}

export interface ConceptCardData {
  title: string;
  explanation: string;
}

export interface VisualBlockData {
  title: string;
  description: string;
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
  explanation: string;
  note: string;
}

export interface FormulaVariable {
  label: string;
  description: string;
}

export interface FormulaBlockData {
  expression: string;
  caption: string;
  variables: FormulaVariable[];
}

export interface InfoCardData {
  title: string;
  description: string;
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

export interface SummaryResult {
  title: string;
  introduction: string;
  coreConcepts: string[];
  sections: StudySection[];
  relatedTopics: string[];
  concepts: ConceptCardData[];
  visualBlock: VisualBlockData | null;
}

export interface ExplanationResult {
  title: string;
  introduction: string;
  coreConcepts: string[];
  sections: StudySection[];
  relatedTopics: string[];
  analogyCard: AnalogyCardData | null;
  formulaBlock: FormulaBlockData | null;
  frameworkCards: InfoCardData[];
  keyTakeaways: string[];
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

export interface FeatureItem {
  title: string;
  description: string;
}
