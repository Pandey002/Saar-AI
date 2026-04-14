"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Download,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { getAppStateValue, setAppStateValue } from "@/lib/localDB";
import {
  calculateStudyPlanProgress,
  createDefaultStudyPlanInput,
  generateStudyPlan,
  getTaskTypeLabel,
  rescheduleTask,
  updateTaskInPlan,
} from "@/lib/studyPlan";
import type {
  LanguageMode,
  PerformanceInsightSnapshot,
  StudyPlan,
  StudyPlanInput,
  StudyPlanPriority,
  StudyPlanTask,
  StudyPlanTaskType,
  StudyPlanSubjectInput,
} from "@/types";

interface StudyPlanPanelProps {
  language: LanguageMode;
  performanceInsights: PerformanceInsightSnapshot | null;
  onStudyTopic: (topic: string) => void;
}

interface PersistedStudyPlanState {
  input: StudyPlanInput;
  plan: StudyPlan | null;
  selectedDate: string | null;
}

const storageKey = "studyPlanState";

export function StudyPlanPanel({
  language,
  performanceInsights,
  onStudyTopic,
}: StudyPlanPanelProps) {
  const [draft, setDraft] = useState<StudyPlanInput>(createDefaultStudyPlanInput());
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskDraft, setTaskDraft] = useState<{ subject: string; topic: string; type: StudyPlanTaskType }>({
    subject: "",
    topic: "",
    type: "learn",
  });

  useEffect(() => {
    let active = true;

    void (async () => {
      const saved = await getAppStateValue<PersistedStudyPlanState>(storageKey);
      if (!active) {
        return;
      }

      if (saved?.input) {
        setDraft(saved.input);
      }
      if (saved?.plan) {
        setPlan(saved.plan);
        setSelectedDate(saved.selectedDate || saved.plan.days[0]?.date || null);
      }

      setIsHydrated(true);
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    void setAppStateValue<PersistedStudyPlanState>(storageKey, {
      input: draft,
      plan,
      selectedDate,
    });
  }, [draft, isHydrated, plan, selectedDate]);

  const copy = getCopy(language);
  const progress = useMemo(() => calculateStudyPlanProgress(plan), [plan]);
  const selectedDay = plan?.days.find((day) => day.date === selectedDate) ?? plan?.days[0] ?? null;

  useEffect(() => {
    if (plan && !selectedDate) {
      setSelectedDate(plan.days[0]?.date ?? null);
    }
  }, [plan, selectedDate]);

  function handleGeneratePlan() {
    try {
      const nextPlan = generateStudyPlan(draft, language, performanceInsights);
      setPlan(nextPlan);
      setSelectedDate(nextPlan.days[0]?.date ?? null);
      setEditingTaskId(null);
    } catch (err) {
      console.error("Study plan generation failed:", err);
    }
  }

  function handleAddSubject() {
    setDraft((previous) => ({
      ...previous,
      subjects: [
        ...previous.subjects,
        {
          id: Math.random().toString(36).slice(2, 10),
          name: "",
          topics: [],
          priority: "medium",
        },
      ],
    }));
  }

  function handleUpdateSubject(subjectId: string, updater: (subject: StudyPlanSubjectInput) => StudyPlanSubjectInput) {
    setDraft((previous) => ({
      ...previous,
      subjects: previous.subjects.map((subject) => (subject.id === subjectId ? updater(subject) : subject)),
    }));
  }

  function handleRemoveSubject(subjectId: string) {
    setDraft((previous) => ({
      ...previous,
      subjects: previous.subjects.filter((subject) => subject.id !== subjectId),
    }));
  }

  function handleToggleTask(task: StudyPlanTask) {
    if (!plan) {
      return;
    }

    setPlan(updateTaskInPlan(plan, task.id, (current) => ({ ...current, completed: !current.completed })));
  }

  function beginEditTask(task: StudyPlanTask) {
    setEditingTaskId(task.id);
    setTaskDraft({
      subject: task.subject,
      topic: task.topic,
      type: task.type,
    });
  }

  function saveTaskEdit() {
    if (!plan || !editingTaskId) {
      return;
    }

    setPlan(
      updateTaskInPlan(plan, editingTaskId, (task) => ({
        ...task,
        subject: taskDraft.subject.trim() || task.subject,
        topic: taskDraft.topic.trim() || task.topic,
        type: taskDraft.type,
      }))
    );
    setEditingTaskId(null);
  }

  function moveTask(task: StudyPlanTask, date: string) {
    if (!plan) {
      return;
    }

    const dayIndex = plan.days.findIndex((day) => day.date === date);
    const nextDate = plan.days[Math.min(dayIndex + 1, plan.days.length - 1)]?.date;
    if (!nextDate || nextDate === date) {
      return;
    }

    setPlan(rescheduleTask(plan, task.id, nextDate));
    setSelectedDate(nextDate);
    setEditingTaskId(null);
  }

  function clearPlan() {
    setPlan(null);
    setSelectedDate(null);
    setEditingTaskId(null);
  }

  function exportPlan() {
    if (!plan) {
      return;
    }

    const printWindow = window.open("", "_blank", "width=1200,height=900");
    if (!printWindow) {
      window.alert("Please allow pop-ups so Saar AI can open the printable study plan.");
      return;
    }

    printWindow.document.write(buildStudyPlanPdf(plan, copy));
    printWindow.document.close();
  }

  return (
    <div className="space-y-8 pb-24">
      <header className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          {copy.eyebrow}
        </p>
        <h1 className="text-[36px] font-bold tracking-[-0.05em] text-slate-900 sm:text-[52px]">
          {copy.title}
        </h1>
        <p className="max-w-3xl text-[16px] leading-7 text-slate-500">
          {copy.subtitle}
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{copy.formTitle}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {copy.formSubtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDraft(createDefaultStudyPlanInput())}
              className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
              title={copy.resetTemplate}
            >
              <RefreshCcw className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {copy.examType}
                </span>
                <select
                  value={draft.examType}
                  onChange={(event) =>
                    setDraft((previous) => ({ ...previous, examType: event.target.value as StudyPlanInput["examType"] }))
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                >
                  <option value="jee">JEE</option>
                  <option value="neet">NEET</option>
                  <option value="custom">Custom</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {copy.examDate}
                </span>
                <Input
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={draft.examDate}
                  onChange={(event) => setDraft((previous) => ({ ...previous, examDate: event.target.value }))}
                  className="mt-2"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {copy.dailyHours}
                </span>
                <Input
                  type="number"
                  min={1}
                  max={16}
                  step={0.5}
                  value={draft.dailyStudyHours}
                  onChange={(event) =>
                    setDraft((previous) => ({
                      ...previous,
                      dailyStudyHours: Number(event.target.value || 0),
                    }))
                  }
                  className="mt-2"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {copy.preparationLevel}
                </span>
                <select
                  value={draft.currentPreparationLevel}
                  onChange={(event) =>
                    setDraft((previous) => ({
                      ...previous,
                      currentPreparationLevel: event.target.value as StudyPlanInput["currentPreparationLevel"],
                    }))
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                >
                  <option value="beginner">{copy.beginner}</option>
                  <option value="intermediate">{copy.intermediate}</option>
                  <option value="advanced">{copy.advanced}</option>
                </select>
              </label>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{copy.subjects}</p>
                  <p className="text-sm leading-6 text-slate-500">{copy.subjectsHint}</p>
                </div>
                <Button type="button" variant="secondary" onClick={handleAddSubject} className="gap-2 rounded-full px-4 py-2">
                  <Plus className="h-4 w-4" />
                  {copy.addSubject}
                </Button>
              </div>

              {draft.subjects.map((subject) => (
                <div key={subject.id} className="rounded-[24px] border border-slate-200 bg-[#fcfdff] p-4">
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_140px_auto]">
                    <label className="block">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        {copy.subjectName}
                      </span>
                      <Input
                        value={subject.name}
                        onChange={(event) =>
                          handleUpdateSubject(subject.id, (current) => ({ ...current, name: event.target.value }))
                        }
                        placeholder={copy.subjectPlaceholder}
                        className="mt-2"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        {copy.priority}
                      </span>
                      <select
                        value={subject.priority}
                        onChange={(event) =>
                          handleUpdateSubject(subject.id, (current) => ({
                            ...current,
                            priority: event.target.value as StudyPlanPriority,
                          }))
                        }
                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                      >
                        <option value="high">{copy.high}</option>
                        <option value="medium">{copy.medium}</option>
                        <option value="low">{copy.low}</option>
                      </select>
                    </label>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(subject.id)}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-red-200 hover:text-red-600"
                        title={copy.removeSubject}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <label className="mt-4 block">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      {copy.topics}
                    </span>
                    <Textarea
                      value={subject.topics.join("\n")}
                      onChange={(event) =>
                        handleUpdateSubject(subject.id, (current) => ({
                          ...current,
                          topics: event.target.value
                            .split(/\n|,/)
                            .map((topic) => topic.trim())
                            .filter(Boolean),
                        }))
                      }
                      className="mt-2 min-h-[120px] border-slate-200 bg-white"
                      placeholder={copy.topicsPlaceholder}
                    />
                  </label>
                </div>
              ))}
            </div>

            {performanceInsights?.weakTopics?.length ? (
              <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{copy.weakAreaBoost}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {performanceInsights.weakTopics.slice(0, 5).map((item, idx) => (
                    <span key={`${item.topic}-${idx}`} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-700">
                      {item.topic}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <Button
              type="button"
              onClick={handleGeneratePlan}
              className="w-full rounded-2xl py-3"
              disabled={!draft.examDate || draft.subjects.length === 0}
            >
              {copy.generate}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              icon={<CalendarDays className="h-4 w-4" />}
              label={copy.daysAvailable}
              value={plan ? String(plan.days.length) : "--"}
              detail={plan ? `${plan.input.dailyStudyHours}h ${copy.perDay}` : copy.generatePlanFirst}
            />
            <MetricCard
              icon={<ClipboardCheck className="h-4 w-4" />}
              label={copy.progress}
              value={`${progress.completionPercent}%`}
              detail={`${progress.completedTasks}/${progress.totalTasks} ${copy.tasksDone}`}
            />
            <MetricCard
              icon={<CheckCircle2 className="h-4 w-4" />}
              label={copy.consistency}
              value={`${progress.consistencyStreak}`}
              detail={copy.daysFullyDone}
            />
          </div>

          {plan ? (
            <>
              <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{copy.generatedPlan}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {copy.generatedSummary(plan)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="secondary" onClick={exportPlan} className="gap-2 rounded-full px-4 py-2">
                      <Download className="h-4 w-4" />
                      {copy.exportPdf}
                    </Button>
                    <Button type="button" variant="secondary" onClick={clearPlan} className="rounded-full px-4 py-2">
                      {copy.clearPlan}
                    </Button>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {plan.weakTopics.slice(0, 4).map((topic, idx) => (
                    <button
                      key={`${topic}-${idx}`}
                      type="button"
                      onClick={() => onStudyTopic(topic)}
                      className="rounded-[20px] border border-slate-200 bg-[#f8fafc] px-4 py-3 text-left transition hover:border-primary hover:text-primary"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        {copy.weakFocus}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{topic}</p>
                    </button>
                  ))}
                </div>
              </div>

              {selectedDay ? (
                <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{copy.dailyTasks}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {copy.dailyFor} {formatLongDate(selectedDay.date)}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                      {selectedDay.plannedHours}h
                    </span>
                  </div>

                  <div className="mt-6 space-y-4">
                    {selectedDay.tasks.map((task) => {
                      const isEditing = editingTaskId === task.id;
                      return (
                        <div
                          key={task.id}
                          className={`rounded-[24px] border p-4 transition ${
                            task.completed ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-[#fcfdff]"
                          }`}
                        >
                          {isEditing ? (
                            <div className="space-y-4">
                              <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)_160px]">
                                <Input
                                  value={taskDraft.subject}
                                  onChange={(event) => setTaskDraft((previous) => ({ ...previous, subject: event.target.value }))}
                                  placeholder={copy.subjectName}
                                />
                                <Input
                                  value={taskDraft.topic}
                                  onChange={(event) => setTaskDraft((previous) => ({ ...previous, topic: event.target.value }))}
                                  placeholder={copy.topic}
                                />
                                <select
                                  value={taskDraft.type}
                                  onChange={(event) => setTaskDraft((previous) => ({ ...previous, type: event.target.value as StudyPlanTaskType }))}
                                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                                >
                                  <option value="learn">{getTaskTypeLabel("learn", language)}</option>
                                  <option value="revise">{getTaskTypeLabel("revise", language)}</option>
                                  <option value="practice">{getTaskTypeLabel("practice", language)}</option>
                                  <option value="mocktest">{getTaskTypeLabel("mocktest", language)}</option>
                                </select>
                              </div>
                              <div className="flex flex-wrap gap-3">
                                <Button type="button" onClick={saveTaskEdit} className="rounded-full px-5 py-2">
                                  {copy.saveChanges}
                                </Button>
                                <Button type="button" variant="secondary" onClick={() => setEditingTaskId(null)} className="rounded-full px-5 py-2">
                                  {copy.cancel}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div className="flex gap-4">
                                <input
                                  type="checkbox"
                                  checked={task.completed}
                                  onChange={() => handleToggleTask(task)}
                                  className="mt-1 h-5 w-5 rounded border-slate-300 accent-blue-600"
                                />
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                                      {getTaskTypeLabel(task.type, language)}
                                    </span>
                                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-500">
                                      {task.durationHours}h
                                    </span>
                                    {task.difficulty ? (
                                      <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
                                        {task.difficulty}
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className={`mt-3 text-lg font-semibold ${task.completed ? "text-emerald-800 line-through" : "text-slate-900"}`}>
                                    {task.subject}: {task.topic}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button type="button" variant="secondary" onClick={() => onStudyTopic(task.topic)} className="gap-2 rounded-full px-4 py-2">
                                  {copy.openTopic}
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button type="button" variant="secondary" onClick={() => beginEditTask(task)} className="gap-2 rounded-full px-4 py-2">
                                  <Pencil className="h-4 w-4" />
                                  {copy.edit}
                                </Button>
                                <Button type="button" variant="secondary" onClick={() => moveTask(task, selectedDay.date)} className="rounded-full px-4 py-2">
                                  {copy.reschedule}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-[32px] border border-dashed border-slate-200 bg-[#f8fafc] p-8 text-center">
              <p className="text-lg font-semibold text-slate-900">{copy.emptyTitle}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">{copy.emptyDescription}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
        <div className="rounded-full bg-blue-50 p-2 text-primary">{icon}</div>
      </div>
      <p className="mt-4 text-[32px] font-bold tracking-[-0.04em] text-slate-900">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
    </div>
  );
}

function getCopy(language: LanguageMode) {
  return language === "hinglish"
    ? {
        eyebrow: "Study Planner",
        title: "Personalized Study Plan",
        subtitle: "Exam date, subjects, weak areas, aur daily hours ke basis par Saar AI aapke liye day-by-day plan banata hai.",
        formTitle: "Plan Setup",
        formSubtitle: "Basic details do, baaki scheduling Saar AI handle karega.",
        resetTemplate: "Reset template",
        examType: "Exam Type",
        examDate: "Exam Date",
        dailyHours: "Daily Study Hours",
        preparationLevel: "Preparation Level",
        beginner: "Beginner",
        intermediate: "Intermediate",
        advanced: "Advanced",
        subjects: "Subjects & Topics",
        subjectsHint: "Har subject ke topics newline ya comma se add karo.",
        addSubject: "Add Subject",
        subjectName: "Subject",
        subjectPlaceholder: "Physics / Biology / Custom",
        priority: "Priority",
        high: "High",
        medium: "Medium",
        low: "Low",
        removeSubject: "Remove subject",
        topics: "Topics",
        topicsPlaceholder: "Electrostatics\nCurrent Electricity\nCapacitance",
        weakAreaBoost: "Weak areas ko extra time diya jayega",
        generate: "Generate Study Plan",
        daysAvailable: "Days Available",
        perDay: "per day",
        progress: "Completion",
        tasksDone: "tasks done",
        consistency: "Consistency",
        daysFullyDone: "fully completed days",
        generatePlanFirst: "Generate plan first",
        generatedPlan: "Generated Plan",
        generatedSummary: (plan: StudyPlan) => `${plan.input.examType.toUpperCase()} target · ${plan.input.subjects.length} subjects · spaced revision + mock tests`,
        exportPdf: "Download PDF",
        clearPlan: "Clear Plan",
        weakFocus: "Weak Focus",
        calendarView: "Calendar View",
        calendarHint: "Kisi bhi day card par click karke us din ke tasks dekho.",
        dailyTasks: "Daily Task List",
        dailyFor: "Tasks for",
        saveChanges: "Save Changes",
        cancel: "Cancel",
        topic: "Topic",
        openTopic: "Open Topic",
        edit: "Edit",
        reschedule: "Reschedule",
        emptyTitle: "Plan abhi generate nahi hua",
        emptyDescription: "Left panel form fill karke apna personalized preparation roadmap banao.",
      }
    : {
        eyebrow: "Study Planner",
        title: "Personalized Study Plan",
        subtitle: "Saar AI turns your exam date, syllabus, weak areas, and available hours into a day-by-day preparation roadmap.",
        formTitle: "Plan Setup",
        formSubtitle: "Enter your exam details once and let Saar AI balance concepts, revision, practice, and mock tests.",
        resetTemplate: "Reset template",
        examType: "Exam Type",
        examDate: "Exam Date",
        dailyHours: "Daily Study Hours",
        preparationLevel: "Preparation Level",
        beginner: "Beginner",
        intermediate: "Intermediate",
        advanced: "Advanced",
        subjects: "Subjects & Topics",
        subjectsHint: "Add topics separated by commas or new lines for each subject.",
        addSubject: "Add Subject",
        subjectName: "Subject",
        subjectPlaceholder: "Physics / Biology / Custom",
        priority: "Priority",
        high: "High",
        medium: "Medium",
        low: "Low",
        removeSubject: "Remove subject",
        topics: "Topics",
        topicsPlaceholder: "Electrostatics\nCurrent Electricity\nCapacitance",
        weakAreaBoost: "Weak areas from performance insights will get extra attention",
        generate: "Generate Study Plan",
        daysAvailable: "Days Available",
        perDay: "per day",
        progress: "Completion",
        tasksDone: "tasks done",
        consistency: "Consistency",
        daysFullyDone: "fully completed days",
        generatePlanFirst: "Generate a plan first",
        generatedPlan: "Generated Plan",
        generatedSummary: (plan: StudyPlan) => `${plan.input.examType.toUpperCase()} target · ${plan.input.subjects.length} subjects · spaced revision and weekly mocks`,
        exportPdf: "Download PDF",
        clearPlan: "Clear Plan",
        weakFocus: "Weak Focus",
        calendarView: "Calendar View",
        calendarHint: "Click any day card to inspect the detailed tasks for that day.",
        dailyTasks: "Daily Task List",
        dailyFor: "Tasks for",
        saveChanges: "Save Changes",
        cancel: "Cancel",
        topic: "Topic",
        openTopic: "Open Topic",
        edit: "Edit",
        reschedule: "Reschedule",
        emptyTitle: "No study plan yet",
        emptyDescription: "Fill in the setup form and Saar AI will generate a structured preparation plan for you.",
      };
}

function formatDateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function formatLongDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatWeekday(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { weekday: "short" });
}

function buildStudyPlanPdf(plan: StudyPlan, copy: ReturnType<typeof getCopy>) {
  const escape = (value: string) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const sections = plan.days
    .map(
      (day) => `
        <section class="day">
          <div class="day-head">
            <h2>${escape(formatLongDate(day.date))}</h2>
            <span>${day.plannedHours}h planned</span>
          </div>
          <ul>
            ${day.tasks
              .map(
                (task) => `
                  <li>
                    <strong>${escape(task.subject)}</strong>: ${escape(task.topic)}
                    <span class="tag">${escape(getTaskTypeLabel(task.type, plan.language))}</span>
                    <span class="tag">${task.durationHours}h</span>
                  </li>
                `
              )
              .join("")}
          </ul>
        </section>
      `
    )
    .join("");

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escape(copy.title)}</title>
      <style>
        @page { size: A4; margin: 16mm; }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Arial, sans-serif; color: #0f172a; background: #eef4fb; }
        .page { max-width: 920px; margin: 0 auto; background: white; padding: 28px; }
        h1, h2 { margin: 0; }
        h1 { font-size: 34px; }
        h2 { font-size: 18px; }
        p { color: #475569; line-height: 1.7; }
        .summary { margin-top: 18px; padding: 18px; border-radius: 18px; border: 1px solid #dbe5f0; background: #f8fbff; }
        .meta { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 14px; }
        .meta span, .tag { display: inline-flex; align-items: center; padding: 8px 12px; border-radius: 999px; background: #eff6ff; color: #1d4ed8; font-size: 12px; font-weight: 700; }
        .day { margin-top: 22px; border: 1px solid #e2e8f0; border-radius: 18px; padding: 18px; background: #fcfdff; page-break-inside: avoid; }
        .day-head { display: flex; justify-content: space-between; gap: 12px; align-items: center; }
        ul { margin: 14px 0 0; padding-left: 18px; }
        li { margin: 10px 0; color: #334155; line-height: 1.7; }
        .tag { margin-left: 8px; background: #f8fafc; color: #475569; }
      </style>
    </head>
    <body>
      <div class="page">
        <h1>${escape(copy.title)}</h1>
        <div class="summary">
          <p>${escape(copy.generatedSummary(plan))}</p>
          <div class="meta">
            <span>${plan.days.length} days</span>
            <span>${plan.input.dailyStudyHours}h per day</span>
            <span>${escape(plan.input.currentPreparationLevel)}</span>
            <span>${escape(plan.input.examType.toUpperCase())}</span>
          </div>
        </div>
        ${sections}
      </div>
      <script>
        window.addEventListener("load", function () {
          setTimeout(function () { window.print(); }, 400);
        });
      </script>
    </body>
  </html>`;
}
