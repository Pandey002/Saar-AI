"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Download, Flag, Pause, Play, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionBlock } from "@/components/feature/results/SectionBlock";
import { Textarea } from "@/components/ui/Textarea";
import { withClientSessionHeaders, getClientSessionId } from "@/lib/clientSession";
import { recordPerformanceLogs } from "@/lib/performance/store";
import type { LanguageMode, MockTestEvaluationResult, MockTestResult, MockTestSubmission, PerformanceLogEntry } from "@/types";

interface MockTestPageProps {
  data: MockTestResult;
  sourceText: string;
  language: LanguageMode;
  onExit: () => void;
  onPersistResult?: (result: MockTestEvaluationResult) => void;
}

type TestStatus = "ready" | "running" | "paused" | "submitting" | "submitted";

export function MockTestPage({
  data,
  sourceText,
  language,
  onExit,
  onPersistResult,
}: MockTestPageProps) {
  const questions = useMemo(
    () =>
      data.sections.flatMap((section) =>
        section.questions.map((question, index) => ({
          ...question,
          sectionId: section.id,
          sectionTitle: section.title,
          displayNumber: `${section.id === "section-a" ? "A" : "B"}${index + 1}`,
        }))
      ),
    [data.sections]
  );
  const [status, setStatus] = useState<TestStatus>("ready");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [visitedQuestions, setVisitedQuestions] = useState<Record<string, boolean>>({});
  const [currentQuestionId, setCurrentQuestionId] = useState(questions[0]?.id ?? "");
  const [timeLeft, setTimeLeft] = useState(data.durationMinutes * 60);
  const [evaluation, setEvaluation] = useState<MockTestEvaluationResult | null>(null);
  const [submissionError, setSubmissionError] = useState("");
  const [showReviewAnswers, setShowReviewAnswers] = useState(false);
  const timeSpentRef = useRef<Record<string, number>>({});
  const activeQuestionStartedAtRef = useRef<number | null>(null);

  const currentQuestion = questions.find((question) => question.id === currentQuestionId) ?? questions[0] ?? null;
  const attemptedCount = useMemo(
    () => questions.filter((question) => (answers[question.id] ?? "").trim().length > 0).length,
    [answers, questions]
  );
  const warningMode = timeLeft <= 5 * 60;

  const syncQuestionTime = useCallback((nextQuestionId?: string) => {
    if (!currentQuestionId || activeQuestionStartedAtRef.current === null) {
      activeQuestionStartedAtRef.current = status === "running" ? Date.now() : null;
      return;
    }

    const elapsed = Math.max(0, Math.round((Date.now() - activeQuestionStartedAtRef.current) / 1000));
    timeSpentRef.current[currentQuestionId] = (timeSpentRef.current[currentQuestionId] ?? 0) + elapsed;
    activeQuestionStartedAtRef.current = status === "running" ? Date.now() : nextQuestionId ? Date.now() : null;
  }, [currentQuestionId, status]);

  const submitTest = useCallback(async (autoSubmitted: boolean) => {
    if (status === "submitting" || status === "submitted") {
      return;
    }

    syncQuestionTime();
    setStatus("submitting");
    setSubmissionError("");

    const submissions: MockTestSubmission[] = questions.map((question) => ({
      questionId: question.id,
      question: question.question,
      questionType: question.type,
      sectionId: question.sectionId,
      sectionTitle: question.sectionTitle,
      marks: question.marks,
      difficulty: question.difficulty,
      userAnswer: answers[question.id] ?? "",
      correctAnswer: question.type === "mcq" ? question.correctAnswer : question.sampleAnswer,
      options: question.type === "mcq" ? question.options : [],
      timeSpentSeconds: timeSpentRef.current[question.id] ?? 0,
    }));

    try {
      const response = await fetch("/api/mock-test/evaluate", withClientSessionHeaders({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceText, language, test: data, submissions, autoSubmitted }),
      }));
      const payload = (await response.json()) as { 
        data?: MockTestEvaluationResult; 
        performanceLogs?: Array<Omit<PerformanceLogEntry, "id" | "userId">>; 
        error?: string 
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error || "Unable to evaluate the mock test.");
      }

      if (payload.performanceLogs) {
        const sessionId = await getClientSessionId();
        await recordPerformanceLogs(sessionId, payload.performanceLogs);
      }

      setEvaluation(payload.data);
      setStatus("submitted");
      setShowReviewAnswers(true);
      onPersistResult?.(payload.data);
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : "Unable to evaluate the mock test.");
      setStatus("paused");
    }
  }, [answers, data, language, onPersistResult, questions, sourceText, status, syncQuestionTime]);

  useEffect(() => {
    setStatus("ready");
    setAnswers({});
    setFlagged({});
    setVisitedQuestions({});
    setCurrentQuestionId(questions[0]?.id ?? "");
    setTimeLeft(data.durationMinutes * 60);
    setEvaluation(null);
    setSubmissionError("");
    setShowReviewAnswers(false);
    timeSpentRef.current = {};
    activeQuestionStartedAtRef.current = null;
  }, [data, questions]);

  useEffect(() => {
    if (status !== "running") {
      return;
    }

    if (activeQuestionStartedAtRef.current === null) {
      activeQuestionStartedAtRef.current = Date.now();
    }

    const interval = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          void submitTest(true);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [status, submitTest]);

  function handleStartTest() {
    if (questions[0]?.id) {
      setVisitedQuestions({ [questions[0].id]: true });
    }
    setStatus("running");
    activeQuestionStartedAtRef.current = Date.now();
  }

  function handlePauseResume() {
    if (status === "running") {
      syncQuestionTime();
      setStatus("paused");
      return;
    }

    if (status === "paused") {
      setStatus("running");
      activeQuestionStartedAtRef.current = Date.now();
    }
  }

  function handleQuestionNavigation(nextQuestionId: string) {
    if (!nextQuestionId || nextQuestionId === currentQuestionId) {
      return;
    }

    syncQuestionTime(nextQuestionId);
    setCurrentQuestionId(nextQuestionId);
    setVisitedQuestions((previous) => ({ ...previous, [nextQuestionId]: true }));
  }

  function handleSubmitClick() {
    if (window.confirm("Submit the mock test now? You will not be able to edit answers after submission.")) {
      void submitTest(false);
    }
  }

  function handleExitClick() {
    if (status === "submitted" || window.confirm("Exit Mock Test Mode? Your in-progress attempt will be lost.")) {
      onExit();
    }
  }

  function handleAnswerChange(questionId: string, value: string) {
    if (status === "submitted" || status === "submitting") {
      return;
    }
    setAnswers((previous) => ({ ...previous, [questionId]: value }));
  }

  function handleToggleFlag(questionId: string) {
    setFlagged((previous) => ({ ...previous, [questionId]: !previous[questionId] }));
  }

  function handleDownloadPdf() {
    if (!evaluation || typeof window === "undefined") {
      return;
    }

    try {
      const printableWindow = window.open("", "_blank", "width=1000,height=800");
      if (!printableWindow) {
        alert("Please allow popups to download the result PDF.");
        return;
      }

      const reviewRows = questions.map((question) => {
        const result = evaluation.results.find((item) => item.questionId === question.id);
        return `
          <article style="border:1px solid #e2e8f0;border-radius:16px;padding:20px;margin-bottom:20px;page-break-inside:avoid;">
            <div style="display:flex;justify-content:space-between;gap:16px;margin-bottom:12px;">
              <strong style="font-size:16px;">${escapeHtml(question.question)}</strong>
              <span style="background:#f1f5f9;padding:4px 12px;border-radius:8px;font-weight:bold;">${result ? `${result.score}/${result.maxScore}` : "Pending"}</span>
            </div>
            <div style="margin:12px 0;padding:12px;background:#f8fafc;border-radius:12px;">
              <p style="margin:0;color:#475569;font-size:14px;"><strong>Your answer:</strong> ${escapeHtml(result?.userAnswer || "Unattempted")}</p>
              <p style="margin:8px 0 0;color:#0f172a;font-size:14px;"><strong>Correct answer:</strong> ${escapeHtml(result?.correctAnswer || "")}</p>
            </div>
            ${result?.feedback ? `<p style="margin:12px 0 0;color:#64748b;font-style:italic;font-size:13px;">AI Feedback: ${escapeHtml(result.feedback)}</p>` : ""}
          </article>
        `;
      }).join("");

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${escapeHtml(data.title)} Result</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #0f172a; line-height: 1.6; }
            h1 { font-size: 32px; margin-bottom: 8px; color: #0f172a; }
            .subtitle { color: #64748b; font-size: 18px; margin-bottom: 32px; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 32px 0; }
            .card { border: 1px solid #e2e8f0; border-radius: 20px; padding: 20px; background: #fff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .card strong { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 8px; }
            .card div { font-size: 24px; font-weight: bold; color: #0f172a; }
            h2 { font-size: 24px; margin: 48px 0 16px; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; }
            h3 { font-size: 18px; margin-top: 24px; color: #334155; }
            ul { padding-left: 20px; }
            li { margin-bottom: 8px; }
            @media print {
              body { margin: 20px; }
              .card { box-shadow: none; border: 1px solid #e2e8f0; }
            }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(data.title)}</h1>
          <p class="subtitle">${escapeHtml(evaluation.summary)}</p>
          
          <div class="grid">
            <div class="card"><strong>Total Score</strong><div>${evaluation.totalScore}/${evaluation.totalMarks}</div></div>
            <div class="card"><strong>Accuracy</strong><div>${evaluation.accuracy}%</div></div>
            <div class="card"><strong>Attempted</strong><div>${evaluation.attempted}/${evaluation.totalQuestions}</div></div>
          </div>

          <h2>AI Performance Analysis</h2>
          <p>${escapeHtml(evaluation.analysis.summary)}</p>
          
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
            <div>
              <h3>Strengths</h3>
              <ul>${evaluation.analysis.strengths.map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
            </div>
            <div>
              <h3>Areas for Improvement</h3>
              <ul>${evaluation.analysis.weaknesses.map(w => `<li>${escapeHtml(w)}</li>`).join("")}</ul>
            </div>
          </div>

          <h3>Learning Suggestions</h3>
          <ul>${evaluation.analysis.suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ul>

          <h2>Question-by-Question Review</h2>
          ${reviewRows}
          
          <footer style="margin-top:40px;padding-top:20px;border-top:1px solid #f1f5f9;text-align:center;color:#94a3b8;font-size:12px;">
            Generated by Sanctum. Focused study. Better results.
          </footer>
        </body>
        </html>
      `;

      printableWindow.document.write(html);
      printableWindow.document.close();
      
      // Give the browser a moment to parse and render before opening the print dialog
      setTimeout(() => {
        printableWindow.focus();
        printableWindow.print();
      }, 500);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Unable to generate PDF. Please try again or use your browser's print feature directly.");
    }
  }

  return (
    <div className="space-y-8">
      {status !== "submitted" ? (
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <SectionBlock eyebrow="Timed Mock Test" title={data.title}>
              <div className="rounded-[24px] bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_60%,#f8fafc_100%)] p-5">
                <p className="text-[15px] leading-7 text-slate-600">{data.introduction}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard label="Duration" value={`${data.durationMinutes} min`} />
                  <MetricCard label="Questions" value={String(data.totalQuestions)} />
                  <MetricCard label="Total Marks" value={String(data.totalMarks)} />
                  <MetricCard label="Negative" value={data.negativeMarking > 0 ? `-${data.negativeMarking}` : "None"} />
                </div>
                <div className="mt-5 rounded-[24px] border border-blue-200 bg-[linear-gradient(135deg,#dbeafe_0%,#eff6ff_45%,#ffffff_100%)] p-5 shadow-[0_18px_40px_rgba(37,99,235,0.10)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                    Test Instructions
                  </p>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {data.instructions.map((instruction) => (
                      <li
                        key={instruction}
                        className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-white/90 px-4 py-3 text-sm leading-6 text-slate-700"
                      >
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        <span>{instruction}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {status === "ready" ? (
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button onClick={handleStartTest} className="rounded-full px-6 py-3">Start Test</Button>
                    <Button variant="secondary" onClick={handleExitClick} className="rounded-full px-6 py-3">Exit</Button>
                  </div>
                ) : null}
              </div>
            </SectionBlock>

            {warningMode && status === "running" ? (
              <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-4 w-4" />
                  Final 5 minutes left. Review flagged and unattempted questions now.
                </div>
              </div>
            ) : null}

            {status !== "ready" && currentQuestion ? (
              <SectionBlock eyebrow={`${currentQuestion.sectionTitle} · ${currentQuestion.displayNumber}`} title={`Question ${questions.findIndex((item) => item.id === currentQuestion.id) + 1}`}>
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-[17px] leading-8 text-slate-900">{currentQuestion.question}</p>
                    <button
                      type="button"
                      onClick={() => handleToggleFlag(currentQuestion.id)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                        flagged[currentQuestion.id]
                          ? "border-amber-300 bg-amber-50 text-amber-700"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800"
                      }`}
                    >
                      <Flag className="h-4 w-4" />
                      {flagged[currentQuestion.id] ? "Flagged" : "Flag"}
                    </button>
                  </div>

                  {currentQuestion.type === "mcq" ? (
                    <div className="grid gap-3">
                      {currentQuestion.options.map((option) => {
                        const checked = (answers[currentQuestion.id] ?? "") === option.label;
                        return (
                          <label
                            key={`${currentQuestion.id}-${option.label}`}
                            className={`flex cursor-pointer items-start gap-3 rounded-[20px] border px-4 py-4 transition ${
                              checked ? "border-primary bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"
                            } ${(status === "paused" || status === "submitting") ? "pointer-events-none opacity-80" : ""}`}
                          >
                            <input
                              type="radio"
                              name={currentQuestion.id}
                              value={option.label}
                              checked={checked}
                              disabled={status === "paused" || status === "submitting"}
                              onChange={() => handleAnswerChange(currentQuestion.id, option.label)}
                              className="mt-1"
                            />
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                              <p className="mt-1 text-sm leading-6 text-slate-600">{option.text}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <Textarea
                      value={answers[currentQuestion.id] ?? ""}
                      onChange={(event) => handleAnswerChange(currentQuestion.id, event.target.value)}
                      disabled={status === "paused" || status === "submitting"}
                      className="min-h-[220px] rounded-[24px] border-slate-200 bg-[#fcfdff] p-4"
                      placeholder="Write your answer in clear exam-style steps, points, or explanation."
                    />
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-500">
                      Difficulty: <span className="font-semibold capitalize text-slate-700">{currentQuestion.difficulty}</span> · Marks: <span className="font-semibold text-slate-700">{currentQuestion.marks}</span>
                    </p>
                    <div className="flex gap-3">
                      <Button variant="secondary" onClick={() => {
                        const currentIndex = questions.findIndex((item) => item.id === currentQuestion.id);
                        if (currentIndex > 0) {
                          handleQuestionNavigation(questions[currentIndex - 1].id);
                        }
                      }} disabled={questions[0]?.id === currentQuestion.id}>Previous</Button>
                      <Button onClick={() => {
                        const currentIndex = questions.findIndex((item) => item.id === currentQuestion.id);
                        if (currentIndex < questions.length - 1) {
                          handleQuestionNavigation(questions[currentIndex + 1].id);
                        }
                      }} disabled={questions[questions.length - 1]?.id === currentQuestion.id}>Next</Button>
                    </div>
                  </div>
                </div>
              </SectionBlock>
            ) : null}

            {submissionError ? (
              <div className="rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                {submissionError}
              </div>
            ) : null}
          </div>
 
          <aside className="space-y-5 xl:sticky xl:top-24 xl:h-fit">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Exam Control</p>
              <div className={`mt-4 rounded-[24px] px-4 py-5 ${warningMode ? "bg-amber-50 text-amber-900" : "bg-slate-900 text-white"}`}>
                <div className="flex items-center gap-3">
                  <Clock3 className="h-5 w-5" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-80">Time Left</p>
                    <p className="mt-1 text-[32px] font-bold tracking-[-0.05em]">{formatTime(timeLeft)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <SidebarMetric label="Answered" value={`${attemptedCount}/${questions.length}`} tone="green" />
                <SidebarMetric label="Visited" value={`${Object.keys(visitedQuestions).length}/${questions.length}`} tone="blue" />
                <SidebarMetric label="Flagged" value={String(Object.values(flagged).filter(Boolean).length)} tone="amber" />
              </div>

              <div className="mt-5 space-y-3">
                {data.markingScheme.map((item) => (
                  <div key={`${item.label}-${item.value}`} className="flex items-center justify-between rounded-2xl bg-[#f8fafc] px-4 py-3">
                    <span className="text-sm font-medium text-slate-600">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-3">
                <Button onClick={handleSubmitClick} disabled={status === "ready" || status === "submitting"}>
                  {status === "submitting" ? "Submitting..." : "Submit Test"}
                </Button>
                <Button variant="secondary" onClick={handlePauseResume} disabled={status === "ready" || status === "submitting"}>
                  {status === "running" ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                  {status === "running" ? "Pause" : "Resume"}
                </Button>
                <Button variant="ghost" onClick={handleExitClick}>
                  <StopCircle className="mr-2 h-4 w-4" />
                  Exit
                </Button>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Question Navigator</p>
              <div className="mt-4 grid grid-cols-5 gap-2">
                {questions.map((question, index) => (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => handleQuestionNavigation(question.id)}
                    className={`rounded-2xl border px-0 py-3 text-sm font-semibold transition ${
                      currentQuestionId === question.id
                        ? "border-slate-900 bg-slate-900 text-white"
                        : flagged[question.id]
                          ? "border-amber-300 bg-amber-50 text-amber-700"
                          : (answers[question.id] ?? "").trim().length > 0
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : visitedQuestions[question.id]
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : "border-slate-200 bg-white text-slate-500"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid gap-2 text-xs text-slate-500">
                <LegendRow label="Answered" tone="green" />
                <LegendRow label="Visited" tone="blue" />
                <LegendRow label="Flagged" tone="amber" />
                <LegendRow label="Current" tone="dark" />
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      {evaluation ? (
        <div className="space-y-8">
          <SectionBlock eyebrow="Mock Test Result" title="Final Score">
            <div className="grid gap-4 lg:grid-cols-4">
              <ResultCard label="Score" value={`${evaluation.totalScore}/${evaluation.totalMarks}`} detail={evaluation.summary} />
              <ResultCard label="Accuracy" value={`${evaluation.accuracy}%`} detail="Based on attempted questions." />
              <ResultCard label="Attempted" value={`${evaluation.attempted}/${evaluation.totalQuestions}`} detail="Attempted vs total questions." />
              <ResultCard label="Time Use" value={formatTime(evaluation.totalTimeSpentSeconds)} detail={evaluation.analysis.timeEfficiency} />
            </div>
            {evaluation.autoSubmitted ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                The test was auto-submitted when the timer reached zero.
              </div>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={handleDownloadPdf}>
                <Download className="mr-2 h-4 w-4" />
                Download Result PDF
              </Button>
              <Button variant="secondary" onClick={() => setShowReviewAnswers((current) => !current)}>
                {showReviewAnswers ? "Hide Review" : "Review Answers"}
              </Button>
              <Button variant="ghost" onClick={onExit}>Exit Mock Test</Button>
            </div>
          </SectionBlock>

          <SectionBlock eyebrow="AI Feedback" title="Performance Analysis">
            <p className="text-[15px] leading-7 text-slate-600">{evaluation.analysis.summary}</p>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <FeedbackColumn title="Strengths" tone="green" items={evaluation.analysis.strengths} />
              <FeedbackColumn title="Weaknesses" tone="amber" items={evaluation.analysis.weaknesses} />
              <FeedbackColumn title="Suggestions" tone="blue" items={evaluation.analysis.suggestions} />
            </div>
          </SectionBlock>

          <SectionBlock eyebrow="Section Breakdown" title="Section-wise Performance">
            <div className="grid gap-4 lg:grid-cols-2">
              {evaluation.sectionPerformance.map((section) => (
                <div key={section.sectionId} className="rounded-[24px] border border-slate-200 bg-[#fcfdff] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
                      <p className="mt-2 text-sm text-slate-500">
                        Attempted {section.attempted}/{section.totalQuestions} · Accuracy {section.accuracy}%
                      </p>
                    </div>
                    <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                      {section.score}/{section.totalMarks}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionBlock>

          {showReviewAnswers ? (
            <SectionBlock eyebrow="Question Review" title="Review Answers">
              <div className="space-y-4">
                {questions.map((question, index) => {
                  const result = evaluation.results.find((item) => item.questionId === question.id);
                  if (!result) {
                    return null;
                  }

                  return (
                    <article key={question.id} className="rounded-[24px] border border-slate-200 bg-white p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                            <span>Question {index + 1}</span>
                            <span>·</span>
                            <span>{question.sectionTitle}</span>
                            <span>·</span>
                            <span className="capitalize">{question.difficulty}</span>
                          </div>
                          <h3 className="mt-2 text-lg font-semibold text-slate-900">{question.question}</h3>
                        </div>
                        <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                          result.score > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        }`}>
                          <CheckCircle2 className="h-4 w-4" />
                          {result.score}/{result.maxScore}
                        </div>
                      </div>
                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <ReviewBox label="Your Answer" value={result.userAnswer || "Unattempted"} />
                        <ReviewBox label="Correct Answer" value={result.correctAnswer} />
                      </div>
                      <div className="mt-4 rounded-2xl bg-[#f8fafc] px-4 py-3 text-sm leading-6 text-slate-600">
                        <strong className="text-slate-900">Feedback:</strong> {result.feedback}
                      </div>
                      {question.type === "mcq" ? (
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          {question.options.map((option) => {
                            const isCorrectOption = option.label === extractDisplayOption(result.correctAnswer);
                            const isChosenOption = option.label === (result.userAnswer || "").trim();
                            return (
                              <div
                                key={`${question.id}-${option.label}`}
                                className={`rounded-2xl border px-4 py-3 text-sm ${
                                  isCorrectOption
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                    : isChosenOption
                                      ? "border-rose-200 bg-rose-50 text-rose-700"
                                      : "border-slate-200 bg-white text-slate-600"
                                }`}
                              >
                                <span className="font-semibold">{option.label}.</span> {option.text}
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </SectionBlock>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-slate-900">{value}</p>
    </div>
  );
}

function SidebarMetric({ label, value, tone }: { label: string; value: string; tone: "green" | "blue" | "amber" }) {
  const toneClass = tone === "green" ? "bg-emerald-50 text-emerald-700" : tone === "blue" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700";
  return (
    <div className={`flex items-center justify-between rounded-2xl px-4 py-3 ${toneClass}`}>
      <span className="text-sm font-medium">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function LegendRow({ label, tone }: { label: string; tone: "green" | "blue" | "amber" | "dark" }) {
  const toneClass = tone === "green" ? "bg-emerald-100" : tone === "blue" ? "bg-blue-100" : tone === "amber" ? "bg-amber-100" : "bg-slate-900";
  return (
    <div className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded-full ${toneClass}`} />
      <span>{label}</span>
    </div>
  );
}

function ResultCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-[#fcfdff] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{label}</p>
      <p className="mt-3 text-[34px] font-bold tracking-[-0.05em] text-slate-900">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
    </div>
  );
}

function FeedbackColumn({ title, tone, items }: { title: string; tone: "green" | "amber" | "blue"; items: string[] }) {
  const classes = tone === "green" ? "border-emerald-200 bg-emerald-50/70" : tone === "amber" ? "border-amber-200 bg-amber-50/70" : "border-blue-200 bg-blue-50/70";
  return (
    <div className={`rounded-[24px] border p-5 ${classes}`}>
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-700" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReviewBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-[#fcfdff] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function escapeHtml(value: any) {
  const str = String(value ?? "");
  return str.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function extractDisplayOption(answer: string) {
  const trimmed = answer.trim();
  const match = trimmed.match(/^([A-D])(?:[\.\)\s]|$)/i);
  return match ? match[1].toUpperCase() : trimmed.toUpperCase();
}
