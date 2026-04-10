"use client";

import type { ReactNode } from "react";
import { BookOpen, Clock3, Flame, Target, TrendingUp } from "lucide-react";
import type { StudyMode, WorkspaceHistoryItem, WorkspaceLibraryItem } from "@/types";

export interface SavedQuizResult {
  id: string;
  sourceText: string;
  title: string;
  scorePercent: number;
  totalScore: number;
  totalMarks: number;
  weakAreas: string[];
  submittedAt: string;
}

interface StudyProgressDashboardProps {
  historyItems: WorkspaceHistoryItem[];
  libraryItems: WorkspaceLibraryItem[];
  quizResults: SavedQuizResult[];
  onStudyTopic: (topic: string) => void;
}

type SubjectCoverage = {
  subject: string;
  sessions: number;
  minutes: number;
};

const modeBaseMinutes: Record<StudyMode, number> = {
  summary: 14,
  explain: 18,
  assignment: 24,
  mocktest: 42,
  revision: 10,
  solve: 16,
};

export function StudyProgressDashboard({
  historyItems,
  libraryItems,
  quizResults,
  onStudyTopic,
}: StudyProgressDashboardProps) {
  const totalMinutes = historyItems.reduce((sum, item) => sum + estimateStudyMinutes(item), 0);
  const uniqueTopics = getUniqueTopics(historyItems);
  const streakDays = getCurrentStreak(historyItems);
  const averageQuizScore = quizResults.length
    ? Math.round(
        quizResults.reduce((sum, item) => sum + item.scorePercent, 0) / quizResults.length
      )
    : null;

  const activityBars = buildActivityBars(historyItems);
  const subjectCoverage = buildSubjectCoverage(historyItems);
  const weakAreas = buildWeakAreas(quizResults, historyItems);
  const topicCoverage = uniqueTopics.slice(0, 8);
  const latestQuizResults = quizResults.slice(0, 6).reverse();
  const topSubject = subjectCoverage[0]?.subject ?? "No data yet";
  const coverageBreadth = subjectCoverage.length;

  return (
    <section className="space-y-8">
      <div className="grid gap-4 xl:grid-cols-4">
        <ProgressMetricCard
          icon={<BookOpen className="h-4 w-4" />}
          eyebrow="Topics Covered"
          value={String(uniqueTopics.length)}
          detail={coverageBreadth > 0 ? `${coverageBreadth} subject lanes active` : "Start a study session to populate this"}
        />
        <ProgressMetricCard
          icon={<Clock3 className="h-4 w-4" />}
          eyebrow="Time Spent"
          value={formatMinutes(totalMinutes)}
          detail={`${historyItems.length} tracked sessions`}
        />
        <ProgressMetricCard
          icon={<Target className="h-4 w-4" />}
          eyebrow="Quiz Scores"
          value={averageQuizScore === null ? "--" : `${averageQuizScore}%`}
          detail={
            averageQuizScore === null
              ? "Submit a practice set to start tracking scores"
              : `${quizResults.length} graded practice attempts`
          }
        />
        <ProgressMetricCard
          icon={<Flame className="h-4 w-4" />}
          eyebrow="Study Streak"
          value={`${streakDays} day${streakDays === 1 ? "" : "s"}`}
          detail={streakDays > 0 ? "Based on consecutive active days" : "Come back tomorrow to begin a streak"}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <ChartCard
          eyebrow="Activity Rhythm"
          title="Study streaks across the last 7 days"
          subtitle="Each bar represents your number of Saar AI sessions for that day."
        >
          <div className="mt-6 grid h-52 grid-cols-7 gap-3">
            {activityBars.map((bar) => (
              <div key={bar.label} className="flex h-full flex-col justify-end gap-3">
                <div className="flex-1 rounded-[22px] bg-slate-100 p-2">
                  <div
                    className="w-full rounded-[16px] bg-[linear-gradient(180deg,#2563eb_0%,#60a5fa_100%)] transition-all"
                    style={{ height: `${Math.max(bar.heightPercent, bar.count > 0 ? 16 : 0)}%` }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-900">{bar.count}</p>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">{bar.label}</p>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard
          eyebrow="Subject Spread"
          title="Coverage across subjects"
          subtitle={`Most active lane: ${topSubject}`}
        >
          <div className="mt-6 space-y-4">
            {subjectCoverage.length > 0 ? (
              subjectCoverage.map((entry) => (
                <div key={entry.subject} className="space-y-2">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-slate-900">{entry.subject}</p>
                      <p className="text-slate-500">
                        {entry.sessions} sessions · {formatMinutes(entry.minutes)}
                      </p>
                    </div>
                    <p className="font-semibold text-slate-700">
                      {Math.round((entry.sessions / subjectCoverage[0].sessions) * 100)}%
                    </p>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#0f172a_0%,#2563eb_65%,#7dd3fc_100%)]"
                      style={{
                        width: `${Math.max(
                          10,
                          Math.round((entry.sessions / subjectCoverage[0].sessions) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <EmptyChartMessage message="Subject coverage will appear once you generate a few sessions." />
            )}
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <ChartCard
          eyebrow="Weak Areas"
          title="Concepts that need another pass"
          subtitle="Detected from your lower-scoring quiz attempts and recent study history."
        >
          <div className="mt-6 space-y-3">
            {weakAreas.length > 0 ? (
              weakAreas.map((area) => (
                <button
                  key={area.topic}
                  type="button"
                  onClick={() => onStudyTopic(area.topic)}
                  className="flex w-full items-center justify-between rounded-[22px] border border-slate-200 bg-[#fcfdff] px-4 py-4 text-left transition hover:border-primary hover:bg-blue-50/40"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{area.topic}</p>
                    <p className="mt-1 text-sm text-slate-500">{area.reason}</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Review
                  </div>
                </button>
              ))
            ) : (
              <EmptyChartMessage message="No weak areas yet. Complete a few practice sessions and Saar AI will flag the patterns." />
            )}
          </div>
        </ChartCard>

        <ChartCard
          eyebrow="Topic Coverage"
          title="Subjects and themes you have touched"
          subtitle="A snapshot of your recent study spread across the workspace."
        >
          <div className="mt-6 flex flex-wrap gap-3">
            {topicCoverage.length > 0 ? (
              topicCoverage.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => onStudyTopic(topic)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-primary hover:text-primary"
                >
                  {topic}
                </button>
              ))
            ) : (
              <EmptyChartMessage message="Your recently covered topics will show up here." />
            )}
          </div>

          <div className="mt-8 rounded-[24px] bg-[#f8fafc] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                  Quiz Trend
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  Recent quiz performance
                </p>
              </div>
              <p className="text-sm text-slate-500">
                {latestQuizResults.length > 0 ? `${latestQuizResults.length} recent attempts` : "No attempts yet"}
              </p>
            </div>

            {latestQuizResults.length > 0 ? (
              <div className="mt-5 flex items-end gap-3">
                {latestQuizResults.map((result) => (
                  <div key={result.id} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-32 w-full items-end rounded-[18px] bg-white p-2">
                      <div
                        className="w-full rounded-[14px] bg-[linear-gradient(180deg,#0f172a_0%,#2563eb_100%)]"
                        style={{ height: `${Math.max(12, result.scorePercent)}%` }}
                      />
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{result.scorePercent}%</p>
                    <p className="line-clamp-2 text-center text-[11px] uppercase tracking-[0.08em] text-slate-400">
                      {shortenLabel(result.title)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5">
                <EmptyChartMessage message="Quiz bars will appear here after you submit practice sessions." />
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CompactInsightCard
          title="Library depth"
          value={`${libraryItems.length} saved sources`}
          description="Persistent topics you can reopen without repasting material."
        />
        <CompactInsightCard
          title="Momentum"
          value={
            historyItems.length > 0
              ? `${Math.round(totalMinutes / Math.max(historyItems.length, 1))} min/session`
              : "No sessions yet"
          }
          description="Average estimated time invested per study session."
        />
      </div>
    </section>
  );
}

function ProgressMetricCard({
  icon,
  eyebrow,
  value,
  detail,
}: {
  icon: ReactNode;
  eyebrow: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
        <div className="rounded-full bg-blue-50 p-2 text-primary">{icon}</div>
      </div>
      <p className="mt-4 text-[34px] font-bold tracking-[-0.04em] text-slate-900">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
    </div>
  );
}

function ChartCard({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:p-7">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-[28px] font-bold tracking-[-0.05em] text-slate-900">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{subtitle}</p>
      {children}
    </div>
  );
}

function CompactInsightCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-[#fcfdff] p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{title}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function EmptyChartMessage({ message }: { message: string }) {
  return (
    <div className="rounded-[22px] border border-dashed border-slate-200 bg-[#f8fafc] px-4 py-5 text-sm text-slate-500">
      {message}
    </div>
  );
}

function buildActivityBars(historyItems: WorkspaceHistoryItem[]) {
  const today = new Date();
  const counts = new Map<string, number>();

  historyItems.forEach((item) => {
    const key = formatDayKey(new Date(item.createdAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const key = formatDayKey(date);
    return {
      label: date.toLocaleDateString("en-IN", { weekday: "short" }).slice(0, 3),
      count: counts.get(key) ?? 0,
    };
  });

  const maxCount = Math.max(...days.map((day) => day.count), 1);
  return days.map((day) => ({
    ...day,
    heightPercent: Math.round((day.count / maxCount) * 100),
  }));
}

function buildSubjectCoverage(historyItems: WorkspaceHistoryItem[]): SubjectCoverage[] {
  const coverageMap = new Map<string, SubjectCoverage>();

  historyItems.forEach((item) => {
    const subject = detectSubject(item.title, item.sourceText);
    const current = coverageMap.get(subject) ?? { subject, sessions: 0, minutes: 0 };
    current.sessions += 1;
    current.minutes += estimateStudyMinutes(item);
    coverageMap.set(subject, current);
  });

  return Array.from(coverageMap.values()).sort((left, right) => right.sessions - left.sessions);
}

function buildWeakAreas(quizResults: SavedQuizResult[], historyItems: WorkspaceHistoryItem[]) {
  const lowScores = quizResults
    .filter((item) => item.scorePercent < 70)
    .sort((left, right) => left.scorePercent - right.scorePercent)
    .slice(0, 3)
    .map((item) => ({
      topic: item.title,
      reason:
        item.weakAreas.length > 0
          ? `Low score: ${item.scorePercent}%. Focus on ${item.weakAreas[0]}.`
          : `Low score: ${item.scorePercent}%. This topic needs reinforcement.`,
    }));

  if (lowScores.length > 0) {
    return lowScores;
  }

  return getUniqueTopics(historyItems)
    .slice(0, 3)
    .map((topic) => ({
      topic,
      reason: "Only lightly covered so far. A follow-up explanation could improve retention.",
    }));
}

function getUniqueTopics(historyItems: WorkspaceHistoryItem[]) {
  const seen = new Set<string>();
  const topics: string[] = [];

  historyItems.forEach((item) => {
    const topic = cleanTopicLabel(item.title || item.sourceText);
    const normalized = topic.toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      topics.push(topic);
    }
  });

  return topics;
}

function estimateStudyMinutes(item: WorkspaceHistoryItem) {
  const textLengthFactor = Math.min(12, Math.ceil(item.sourceText.trim().split(/\s+/).filter(Boolean).length / 35));
  return modeBaseMinutes[item.mode] + textLengthFactor;
}

function getCurrentStreak(historyItems: WorkspaceHistoryItem[]) {
  if (historyItems.length === 0) {
    return 0;
  }

  const activeDays = new Set(historyItems.map((item) => formatDayKey(new Date(item.createdAt))));
  const today = new Date();
  let streak = 0;

  for (let offset = 0; offset < 365; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const key = formatDayKey(date);

    if (activeDays.has(key)) {
      streak += 1;
      continue;
    }

    if (offset === 0) {
      continue;
    }

    break;
  }

  return streak;
}

function formatDayKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

function detectSubject(...candidates: string[]) {
  const haystack = candidates.join(" ").toLowerCase();
  const subjectMatchers: Array<{ subject: string; keywords: string[] }> = [
    { subject: "History", keywords: ["war", "independence", "history", "revolution", "empire"] },
    { subject: "Physics", keywords: ["motion", "force", "physics", "energy", "velocity"] },
    { subject: "Chemistry", keywords: ["chemistry", "reaction", "molecule", "acid", "base"] },
    { subject: "Biology", keywords: ["biology", "cell", "dna", "evolution", "ecosystem"] },
    { subject: "Mathematics", keywords: ["algebra", "calculus", "equation", "geometry", "math"] },
    { subject: "Geography", keywords: ["geography", "climate", "map", "river", "geopolitics"] },
    { subject: "Political Science", keywords: ["politics", "iran", "government", "conflict", "policy"] },
  ];

  const match = subjectMatchers.find((entry) =>
    entry.keywords.some((keyword) => haystack.includes(keyword))
  );

  return match?.subject ?? "General Studies";
}

function shortenLabel(value: string) {
  return cleanTopicLabel(value).slice(0, 18);
}

function cleanTopicLabel(value: string) {
  return value.replace(/\s+/g, " ").trim();
}
