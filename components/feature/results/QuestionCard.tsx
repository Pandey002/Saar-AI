import type { AssignmentQuestion } from "@/types";

interface QuestionCardProps {
  index: number;
  question: AssignmentQuestion;
  selectedOption?: string;
  onSelectOption?: (value: string) => void;
}

export function QuestionCard({ index, question, selectedOption, onSelectOption }: QuestionCardProps) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
            Q{String(index + 1).padStart(2, "0")}
          </p>
          <h3 className="mt-2 text-[16px] font-semibold leading-6 text-slate-900">
            {question.question}
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
                selectedOption === option.label
                  ? "border-primary bg-blue-50 text-slate-900"
                  : "border-slate-200 bg-[#f8fafc] text-slate-700 hover:border-slate-300"
              }`}
            >
              <input
                type="radio"
                name={`question-${index}`}
                value={option.label}
                checked={selectedOption === option.label}
                onChange={() => onSelectOption?.(option.label)}
                className="mt-1 h-4 w-4 accent-blue-600"
              />
              <span>
                <strong className="mr-2">{option.label}.</strong>
                {option.text}
              </span>
            </label>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl bg-[#f8fafc] p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">Model Answer</p>
          <p className="mt-2 text-sm leading-7 text-slate-600">{question.answer}</p>
        </div>
      )}
    </article>
  );
}
