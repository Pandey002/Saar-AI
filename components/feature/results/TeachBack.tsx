"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { SectionBlock } from "@/components/feature/results/SectionBlock";
import { withClientSessionHeaders, getClientSessionId } from "@/lib/clientSession";
import { recordPerformanceLogs } from "@/lib/performance/store";
import type { PerformanceLogEntry, TeachBackAttempt, TeachBackEvaluationResult } from "@/types";

interface TeachBackProps {
  topicKey: string;
  topicTitle: string;
  originalTopicSummary: string;
  onStudyGaps: (gapTopics: string) => void;
}

const STORAGE_KEY = "saar_teach_back_attempts";

export function TeachBack({
  topicKey,
  topicTitle,
  originalTopicSummary,
  onStudyGaps,
}: TeachBackProps) {
  const [studentExplanation, setStudentExplanation] = useState("");
  const [evaluation, setEvaluation] = useState<TeachBackEvaluationResult | null>(null);
  const [history, setHistory] = useState<TeachBackAttempt[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const allAttempts = readTeachBackAttempts();
    const scoped = allAttempts.filter((attempt) => attempt.topicKey === topicKey);
    setHistory(scoped);
    setEvaluation(scoped[0]?.evaluation ?? null);
  }, [topicKey]);

  const scoreTone = useMemo(() => getScoreTone(evaluation?.score ?? 0), [evaluation?.score]);

  async function handleSubmit() {
    const trimmed = studentExplanation.trim();
    if (!trimmed) {
      setError("Write your explanation first so Saar AI can check your understanding.");
      return;
    }

    setIsChecking(true);
    setError("");

    try {
      const response = await fetch("/api/teach-back/evaluate", withClientSessionHeaders({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicTitle,
          originalTopicSummary,
          studentExplanation: trimmed,
        }),
      }));
      const payload = (await response.json()) as {
        data?: TeachBackEvaluationResult;
        performanceLogs?: Array<Omit<PerformanceLogEntry, "id" | "userId">>;
        error?: string;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error || "Unable to check your understanding.");
      }

      if (payload.performanceLogs) {
        const sessionId = await getClientSessionId();
        await recordPerformanceLogs(sessionId, payload.performanceLogs);
      }

      const attempt: TeachBackAttempt = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        topicKey,
        topicTitle,
        submittedAt: new Date().toISOString(),
        studentExplanation: trimmed,
        evaluation: payload.data,
      };

      const nextHistory = [attempt, ...history].slice(0, 10);
      setEvaluation(payload.data);
      setHistory(nextHistory);
      writeTeachBackAttempts(topicKey, nextHistory);
      window.dispatchEvent(new CustomEvent("saar-performance-updated"));
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to check your understanding."
      );
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <SectionBlock
      title="Think you got it? Explain it back in your own words"
      eyebrow="Teach-Back"
      className="bg-[linear-gradient(180deg,#ffffff,#f8fafc)]"
    >
      <div className="space-y-5">
        <Textarea
          value={studentExplanation}
          onChange={(event) => setStudentExplanation(event.target.value)}
          placeholder="Explain the topic as if you were teaching a friend. Hinglish is fine."
          className="min-h-[160px]"
        />

        <div className="flex flex-wrap items-center gap-4">
          <Button onClick={handleSubmit} disabled={isChecking}>
            {isChecking ? "Checking understanding..." : "Check my understanding"}
          </Button>
          {history.length > 0 ? (
            <p className="text-sm text-slate-500">
              Previous scores: {history.slice(0, 5).map((attempt) => attempt.evaluation.score).join(", ")}
            </p>
          ) : null}
        </div>

        {error ? (
          <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {evaluation ? (
          <div className="space-y-6 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-full border-4 text-xl font-bold ${scoreTone.ring} ${scoreTone.text} ${scoreTone.bg}`}
                >
                  {evaluation.score}
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Understanding Score
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Keep refining your explanation until the weak spots become easy to say clearly.
                  </p>
                </div>
              </div>

              {evaluation.gaps.length > 0 ? (
                <Button
                  variant="secondary"
                  onClick={() => onStudyGaps(evaluation.gaps.join(", "))}
                >
                  Study the gaps
                </Button>
              ) : null}
            </div>

            <TeachBackList
              title="Understood well"
              items={evaluation.understoodWell}
              icon="success"
              emptyMessage="The tutor did not call out any clearly mastered points yet."
            />

            <TeachBackList
              title="Gaps to review"
              items={evaluation.gaps}
              icon="warning"
              emptyMessage="No major gaps were identified."
            />

            {evaluation.misconceptions.length > 0 ? (
              <TeachBackList
                title="Misconceptions"
                items={evaluation.misconceptions}
                icon="error"
                emptyMessage=""
              />
            ) : null}

            <blockquote className="rounded-[20px] border-l-4 border-primary bg-[#f8fbff] px-5 py-4 text-[15px] leading-7 text-slate-700">
              {evaluation.feedback}
            </blockquote>

            <div className="rounded-[20px] bg-[#fff8e8] px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                Next step
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{evaluation.nextStep}</p>
            </div>
          </div>
        ) : null}
      </div>
    </SectionBlock>
  );
}

function TeachBackList({
  title,
  items,
  icon,
  emptyMessage,
}: {
  title: string;
  items: string[];
  icon: "success" | "warning" | "error";
  emptyMessage: string;
}) {
  return (
    <div>
      <h3 className="text-[17px] font-semibold tracking-[-0.03em] text-slate-900">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
              <span className="mt-0.5">
                {icon === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : null}
                {icon === "warning" ? (
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                ) : null}
                {icon === "error" ? (
                  <XCircle className="h-4 w-4 text-red-600" />
                ) : null}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : emptyMessage ? (
        <p className="mt-3 text-sm leading-6 text-slate-500">{emptyMessage}</p>
      ) : null}
    </div>
  );
}

function getScoreTone(score: number) {
  if (score <= 50) {
    return {
      ring: "border-red-200",
      text: "text-red-700",
      bg: "bg-red-50",
    };
  }

  if (score <= 79) {
    return {
      ring: "border-amber-200",
      text: "text-amber-700",
      bg: "bg-amber-50",
    };
  }

  return {
    ring: "border-emerald-200",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
  };
}

function readTeachBackAttempts() {
  if (typeof window === "undefined") {
    return [] as TeachBackAttempt[];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as TeachBackAttempt[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeTeachBackAttempts(topicKey: string, topicHistory: TeachBackAttempt[]) {
  const current = readTeachBackAttempts().filter((attempt) => attempt.topicKey !== topicKey);
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([...topicHistory, ...current].slice(0, 100))
  );
}
