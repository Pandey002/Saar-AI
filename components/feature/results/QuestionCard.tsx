import { MathText } from "@/components/feature/results/MathText";
import { Textarea } from "@/components/ui/Textarea";
import type { AssignmentQuestion } from "@/types";

interface QuestionCardProps {
  index: number;
  question: AssignmentQuestion;
  response?: string;
  feedback?: {
    isCorrect: boolean;
    score: number;
    maxScore: number;
    feedback: string;
    correctAnswer: string;
  };
  disabled?: boolean;
  onChangeResponse?: (value: string) => void;
}

export function QuestionCard({
  index,
  question,
  response,
  feedback,
  disabled = false,
  onChangeResponse,
}: QuestionCardProps) {
  return (
    <article className="question-card rounded-[24px] border border-line bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="question-card-eyebrow text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
            Q{String(index + 1).padStart(2, "0")}
          </p>
          <h3 className="mt-2 text-[16px] font-semibold leading-6 text-ink">
            <MathText text={question.question} />
          </h3>
        </div>
        {question.marks > 0 ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
            {question.marks} marks
          </span>
        ) : null}
      </div>

      {question.type === "mcq" && question.options.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {question.options.map((option) => (
            <label
              key={`${question.question}-${option.label}`}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                response === option.label
                  ? "border-primary bg-primary/10 text-ink"
                  : "border-line bg-[#F6F3E6] text-muted hover:border-muted"
              }`}
            >
              <input
                type="radio"
                name={`question-${index}`}
                value={option.label}
                checked={response === option.label}
                onChange={() => onChangeResponse?.(option.label)}
                disabled={disabled}
                className="mt-1 h-4 w-4 accent-blue-600"
              />
              <span>
                <strong className="mr-2">{option.label}.</strong>
                <MathText text={option.text} />
              </span>
            </label>
          ))}
        </div>
      ) : (
        <div className="mt-5">
          <Textarea
            value={response ?? ""}
            onChange={(event) => onChangeResponse?.(event.target.value)}
            disabled={disabled}
            maxLength={2000}
            className="min-h-[220px] rounded-[24px] border-line bg-canvas text-[15px] leading-7 text-ink"
            placeholder="Write your detailed answer here..."
          />
          <div className="mt-2 flex items-center justify-between text-[12px] text-slate-400">
            <span>Write a complete long-form answer for this 5-mark question.</span>
            <span>{(response ?? "").length}/2000</span>
          </div>
        </div>
      )}

      {feedback ? (
        <div
          className={`mt-5 rounded-2xl border px-4 py-4 ${
            feedback.isCorrect
              ? "border-emerald-200 bg-emerald-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p
              className={`text-sm font-semibold ${
                feedback.isCorrect ? "text-emerald-700" : "text-amber-800"
              }`}
            >
              {feedback.isCorrect ? "Great work!" : "Needs improvement"}
            </p>
            <span className="rounded-full bg-surface px-3 py-1 text-[11px] font-semibold text-slate-500">
              {feedback.score}/{feedback.maxScore} marks
            </span>
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            <MathText text={feedback.feedback} />
          </p>
          {!feedback.isCorrect ? (
            <p className="mt-3 text-sm leading-7 text-slate-600">
              <span className="font-semibold text-slate-900">Correct answer:</span>{" "}
              <MathText text={feedback.correctAnswer} />
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
