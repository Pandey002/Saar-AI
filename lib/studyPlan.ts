import type {
  LanguageMode,
  PerformanceInsightSnapshot,
  PreparationLevel,
  StudyPlan,
  StudyPlanDay,
  StudyPlanInput,
  StudyPlanPriority,
  StudyPlanSubjectInput,
  StudyPlanTask,
  StudyPlanTaskType,
} from "@/types";

interface DayBucket extends StudyPlanDay {
  remainingHours: number;
}

const revisionOffsets = [2, 6, 13];

export function createDefaultStudyPlanInput(): StudyPlanInput {
  const today = new Date();
  const examDate = new Date(today);
  examDate.setDate(today.getDate() + 60);

  return {
    examType: "jee",
    examDate: toIsoDate(examDate),
    dailyStudyHours: 6,
    currentPreparationLevel: "intermediate",
    subjects: [
      {
        id: createId(),
        name: "Physics",
        topics: ["Electrostatics", "Current Electricity", "Modern Physics"],
        priority: "high",
      },
      {
        id: createId(),
        name: "Chemistry",
        topics: ["Atomic Structure", "Chemical Bonding", "Thermodynamics"],
        priority: "medium",
      },
      {
        id: createId(),
        name: "Mathematics",
        topics: ["Calculus", "Coordinate Geometry", "Probability"],
        priority: "high",
      },
    ],
  };
}

export function generateStudyPlan(
  input: StudyPlanInput,
  language: LanguageMode,
  performanceInsights: PerformanceInsightSnapshot | null
): StudyPlan {
  const normalized = normalizeInput(input);
  const weakTopics = collectWeakTopics(performanceInsights);
  const days = createDayBuckets(normalized.examDate, normalized.dailyStudyHours);
  const topics = buildTopicQueue(normalized.subjects, normalized.currentPreparationLevel, weakTopics);
  const learningWindowEnd = Math.max(0, days.length - Math.min(7, Math.ceil(days.length * 0.2)));

  let cursor = 0;

  topics.forEach((topic) => {
    const learnDayIndex = findDayIndex(days, cursor, learningWindowEnd, topic.learnHours);
    cursor = Math.min(learnDayIndex + 1, learningWindowEnd);

    scheduleTask(days, learnDayIndex, {
      id: createId(),
      subject: topic.subject,
      topic: topic.name,
      type: "learn",
      durationHours: topic.learnHours,
      completed: false,
    });

    const practiceDayIndex = findDayIndex(days, learnDayIndex, days.length - 1, topic.practiceHours);
    scheduleTask(days, practiceDayIndex, {
      id: createId(),
      subject: topic.subject,
      topic: topic.name,
      type: "practice",
      durationHours: topic.practiceHours,
      completed: false,
    });

    revisionOffsets.forEach((offset, revisionIndex) => {
      const targetDay = Math.min(days.length - 1, learnDayIndex + offset);
      scheduleTask(days, targetDay, {
        id: createId(),
        subject: topic.subject,
        topic: topic.name,
        type: "revise",
        durationHours: revisionHoursForIndex(revisionIndex, normalized.currentPreparationLevel),
        completed: false,
      });
    });
  });

  injectMockTests(days, normalized.dailyStudyHours, normalized.subjects, normalized.currentPreparationLevel);
  fillSparseDays(days, normalized.subjects, weakTopics, normalized.currentPreparationLevel);

  return {
    id: createId(),
    createdAt: new Date().toISOString(),
    language,
    input: normalized,
    weakTopics,
    days: days.map((day) => ({
      date: day.date,
      tasks: day.tasks,
      plannedHours: roundHours(day.tasks.reduce((sum, task) => sum + task.durationHours, 0)),
    })),
  };
}

export function calculateStudyPlanProgress(plan: StudyPlan | null) {
  if (!plan || plan.days.length === 0) {
    return {
      completedTasks: 0,
      totalTasks: 0,
      completionPercent: 0,
      consistencyStreak: 0,
    };
  }

  const allTasks = plan.days.flatMap((day) => day.tasks.map((task) => ({ ...task, date: day.date })));
  const completedTasks = allTasks.filter((task) => task.completed).length;
  const totalTasks = allTasks.length;
  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const completedDays = new Set(
    plan.days
      .filter((day) => day.tasks.length > 0 && day.tasks.every((task) => task.completed))
      .map((day) => day.date)
  );

  let consistencyStreak = 0;
  for (let index = 0; index < plan.days.length; index += 1) {
    const day = plan.days[index];
    if (!completedDays.has(day.date)) {
      break;
    }
    consistencyStreak += 1;
  }

  return { completedTasks, totalTasks, completionPercent, consistencyStreak };
}

export function getTaskTypeLabel(type: StudyPlanTaskType, language: LanguageMode) {
  const labels = {
    english: {
      learn: "Concepts",
      revise: "Revision",
      practice: "Practice",
      mocktest: "Mock Test",
    },
    hinglish: {
      learn: "Concepts",
      revise: "Revision",
      practice: "Practice",
      mocktest: "Mock Test",
    },
  } as const;

  return labels[language][type];
}

export function updateTaskInPlan(
  plan: StudyPlan,
  taskId: string,
  updater: (task: StudyPlanTask) => StudyPlanTask
) {
  return {
    ...plan,
    days: plan.days.map((day) => ({
      ...day,
      tasks: day.tasks.map((task) => (task.id === taskId ? updater(task) : task)),
      plannedHours: roundHours(
        day.tasks.map((task) => (task.id === taskId ? updater(task) : task)).reduce((sum, task) => sum + task.durationHours, 0)
      ),
    })),
  };
}

export function rescheduleTask(plan: StudyPlan, taskId: string, targetDate: string) {
  let movedTask: StudyPlanTask | null = null;

  const daysWithoutTask = plan.days.map((day) => {
    const task = day.tasks.find((item) => item.id === taskId);
    if (task) {
      movedTask = task;
    }

    const nextTasks = day.tasks.filter((item) => item.id !== taskId);
    return {
      ...day,
      tasks: nextTasks,
      plannedHours: roundHours(nextTasks.reduce((sum, item) => sum + item.durationHours, 0)),
    };
  });

  if (!movedTask) {
    return plan;
  }

  return {
    ...plan,
    days: daysWithoutTask.map((day) => {
      if (day.date !== targetDate) {
        return day;
      }

      const nextTasks = [...day.tasks, movedTask as StudyPlanTask];
      return {
        ...day,
        tasks: nextTasks,
        plannedHours: roundHours(nextTasks.reduce((sum, item) => sum + item.durationHours, 0)),
      };
    }),
  };
}

function normalizeInput(input: StudyPlanInput): StudyPlanInput {
  const subjects = input.subjects
    .map((subject) => ({
      ...subject,
      name: subject.name.trim(),
      topics: subject.topics.map((topic) => topic.trim()).filter(Boolean),
    }))
    .filter((subject) => subject.name && subject.topics.length > 0);

  return {
    ...input,
    dailyStudyHours: clampNumber(input.dailyStudyHours, 1, 16),
    subjects,
  };
}

function buildTopicQueue(
  subjects: StudyPlanSubjectInput[],
  preparationLevel: PreparationLevel,
  weakTopics: string[]
) {
  return subjects
    .flatMap((subject) =>
      subject.topics.map((topic, index) => {
        const weakBoost = weakTopics.some((item) => normalize(item).includes(normalize(topic)) || normalize(topic).includes(normalize(item))) ? 1.25 : 1;
        const priorityFactor = priorityWeight(subject.priority);
        const prepFactor = preparationWeight(preparationLevel);
        const learnHours = roundHours(clampNumber(1.2 * priorityFactor * prepFactor * weakBoost, 0.8, 2.6));
        const practiceHours = roundHours(clampNumber(0.75 * priorityFactor * weakBoost, 0.5, 1.5));

        return {
          subject: subject.name,
          name: topic,
          order: index,
          score: priorityFactor * weakBoost,
          learnHours,
          practiceHours,
        };
      })
    )
    .sort((left, right) => right.score - left.score || left.order - right.order);
}

function createDayBuckets(examDateIso: string, dailyStudyHours: number) {
  const today = startOfDay(new Date());
  const examDate = startOfDay(new Date(examDateIso));
  const totalDays = Math.max(1, differenceInDays(today, examDate) + 1);

  return Array.from({ length: totalDays }, (_, index): DayBucket => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return {
      date: toIsoDate(date),
      tasks: [] as StudyPlanTask[],
      plannedHours: 0,
      remainingHours: dailyStudyHours,
    };
  });
}

function findDayIndex(days: DayBucket[], preferredStart: number, maxIndex: number, durationHours: number) {
  for (let index = Math.max(0, preferredStart); index <= maxIndex; index += 1) {
    if (days[index].remainingHours >= durationHours) {
      return index;
    }
  }

  let bestIndex = Math.max(0, preferredStart);
  for (let index = Math.max(0, preferredStart); index <= maxIndex; index += 1) {
    if (days[index].remainingHours > days[bestIndex].remainingHours) {
      bestIndex = index;
    }
  }

  return bestIndex;
}

function scheduleTask(days: DayBucket[], dayIndex: number, task: StudyPlanTask) {
  const bucket = days[Math.max(0, Math.min(dayIndex, days.length - 1))];
  bucket.tasks.push(task);
  bucket.remainingHours = Math.max(0, roundHours(bucket.remainingHours - task.durationHours));
}

function injectMockTests(
  days: DayBucket[],
  dailyStudyHours: number,
  subjects: StudyPlanSubjectInput[],
  preparationLevel: PreparationLevel
) {
  if (days.length < 7 || subjects.length === 0) {
    return;
  }

  for (let index = 6; index < days.length; index += 7) {
    const progress = index / Math.max(days.length - 1, 1);
    const difficulty = progress < 0.35 ? "easy" : progress < 0.7 ? "medium" : "hard";
    const durationHours = roundHours(clampNumber(Math.min(dailyStudyHours * 0.45, 3), 1.25, 3));
    scheduleTask(days, index, {
      id: createId(),
      subject: subjects.map((subject) => subject.name).join(" + "),
      topic: difficulty === "easy" ? "Weekly mixed-topic checkpoint" : difficulty === "medium" ? "Weekly mock with timed sections" : "Full-pressure mock test",
      type: "mocktest",
      durationHours,
      completed: false,
      difficulty,
    });
  }
}

function fillSparseDays(
  days: DayBucket[],
  subjects: StudyPlanSubjectInput[],
  weakTopics: string[],
  preparationLevel: PreparationLevel
) {
  const primarySubject = subjects[0]?.name || "General Studies";
  const fallbackTopic = weakTopics[0] || subjects[0]?.topics[0] || "Key formulas and concepts";
  const revisionHours = revisionHoursForIndex(1, preparationLevel);

  days.forEach((day, index) => {
    const hasLearn = day.tasks.some((task) => task.type === "learn");
    const hasRevision = day.tasks.some((task) => task.type === "revise");
    const hasPractice = day.tasks.some((task) => task.type === "practice");

    if (!hasRevision && day.remainingHours >= revisionHours) {
      scheduleTask(days, index, {
        id: createId(),
        subject: primarySubject,
        topic: fallbackTopic,
        type: "revise",
        durationHours: revisionHours,
        completed: false,
      });
    }

    if (!hasPractice && day.remainingHours >= 0.5) {
      scheduleTask(days, index, {
        id: createId(),
        subject: primarySubject,
        topic: `${fallbackTopic} drills`,
        type: "practice",
        durationHours: 0.5,
        completed: false,
      });
    }

    if (!hasLearn && index < Math.max(1, Math.floor(days.length * 0.65)) && day.remainingHours >= 0.75) {
      scheduleTask(days, index, {
        id: createId(),
        subject: primarySubject,
        topic: `Buffer learning: ${fallbackTopic}`,
        type: "learn",
        durationHours: 0.75,
        completed: false,
      });
    }
  });
}

function collectWeakTopics(performanceInsights: PerformanceInsightSnapshot | null) {
  if (!performanceInsights) {
    return [];
  }

  const weakTopics = Array.isArray(performanceInsights.weakTopics) ? performanceInsights.weakTopics : [];
  const weakConcepts = Array.isArray(performanceInsights.weakConcepts) ? performanceInsights.weakConcepts : [];
  const focusAreas = Array.isArray(performanceInsights.focusAreas) ? performanceInsights.focusAreas : [];

  const allTopics = [
    ...weakTopics.map((item) => item?.topic ?? ""),
    ...weakConcepts.map((item) => item?.concept ?? ""),
    ...focusAreas,
  ]
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  return Array.from(new Set(allTopics)).slice(0, 8);
}

function priorityWeight(priority: StudyPlanPriority) {
  return priority === "high" ? 1.35 : priority === "medium" ? 1 : 0.75;
}

function preparationWeight(level: PreparationLevel) {
  return level === "beginner" ? 1.35 : level === "intermediate" ? 1 : 0.8;
}

function revisionHoursForIndex(index: number, level: PreparationLevel) {
  const base = level === "beginner" ? 0.75 : level === "intermediate" ? 0.6 : 0.45;
  return roundHours(base + index * 0.1);
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function roundHours(value: number) {
  return Math.round(value * 100) / 100;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function toIsoDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function differenceInDays(from: Date, to: Date) {
  const milliseconds = startOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.floor(milliseconds / (1000 * 60 * 60 * 24));
}

function createId() {
  return Math.random().toString(36).slice(2, 10);
}
