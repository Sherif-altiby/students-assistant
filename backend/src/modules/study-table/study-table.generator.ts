import { addCalendarDays, localWeekday } from './date-time';
import {
  GeneratorInput,
  GeneratorResult,
  GeneratorSubject,
  PlannedDay,
  PlannedMonth,
  PlannedWeek,
} from './study-table.types';

type GeneratorLessonRef = GeneratorSubject['units'][number]['lessons'][number];
interface QueuedLesson {
  subjectId: string;
  lesson: GeneratorLessonRef;
  isReview: boolean;
}

function orderedLessons(subject: GeneratorSubject) {
  return subject.units
    .slice()
    .sort(compareOrder)
    .flatMap((unit) => unit.lessons.slice().sort(compareOrder));
}

function compareOrder<T extends { order: number; id: string }>(a: T, b: T): number {
  return a.order - b.order || a.id.localeCompare(b.id);
}

/** Round-robin across subjects; each subject keeps its syllabus order. */
function takeRoundRobin(
  queues: Array<{ subjectId: string; lessons: GeneratorLessonRef[] }>,
  count: number
): QueuedLesson[] {
  const result: QueuedLesson[] = [];
  const positions = queues.map(() => 0);
  let remaining = queues.reduce((total, queue) => total + queue.lessons.length, 0);
  let index = 0;
  while (result.length < count && remaining > 0) {
    const queueIndex = index % queues.length;
    index += 1;
    const queue = queues[queueIndex];
    if (!queue) continue;
    const lesson = queue.lessons[positions[queueIndex] ?? 0];
    if (!lesson) continue;
    positions[queueIndex] = (positions[queueIndex] ?? 0) + 1;
    remaining -= 1;
    result.push({ subjectId: queue.subjectId, lesson, isReview: false });
  }
  return result;
}

/** Round-robin across subjects, cycling each subject's list so it never runs out. */
function takeCyclic(
  queues: Array<{ subjectId: string; lessons: GeneratorLessonRef[] }>,
  count: number
): QueuedLesson[] {
  const usable = queues.filter((queue) => queue.lessons.length > 0);
  const result: QueuedLesson[] = [];
  const cursor = new Map(usable.map((queue) => [queue.subjectId, 0]));
  let index = 0;
  while (usable.length && result.length < count) {
    const queue = usable[index % usable.length];
    index += 1;
    if (!queue) break;
    const position = cursor.get(queue.subjectId);
    if (position === undefined) throw new Error('Review queue cursor is missing');
    cursor.set(queue.subjectId, position + 1);
    const lesson = queue.lessons[position % queue.lessons.length];
    if (!lesson) throw new Error('Review queue lesson is missing');
    result.push({
      subjectId: queue.subjectId,
      lesson,
      isReview: true,
    });
  }
  return result;
}

/** How many sessions each eligible day receives (sums to `total`, never above `max`). */
function dayCountsFor(total: number, days: number, max: number): number[] {
  const counts = Array<number>(days).fill(0);
  if (!days || !total) return counts;
  if (total < days) {
    for (let index = 0; index < total; index += 1) {
      counts[Math.floor(((index + 0.5) * days) / total)]! += 1;
    }
    return counts;
  }
  const base = Math.floor(total / days);
  const extra = total % days;
  for (let day = 0; day < days; day += 1) {
    const getsExtra = Math.floor(((day + 1) * extra) / days) > Math.floor((day * extra) / days);
    counts[day] = Math.min(max, base + Number(getsExtra));
  }
  return counts;
}

export function generateStudySessions(input: GeneratorInput): GeneratorResult {
  const allQueues = input.subjects.map((subject) => ({
    subjectId: subject.id,
    lessons: orderedLessons(subject),
  }));
  const pendingQueues = allQueues
    .map((queue) => ({
      subjectId: queue.subjectId,
      lessons: queue.lessons.filter((lesson) => !input.completedLessonIds.has(lesson.id)),
    }))
    .filter((queue) => queue.lessons.length > 0);

  const totalLessons = allQueues.reduce((total, queue) => total + queue.lessons.length, 0);
  const pendingCount = pendingQueues.reduce((total, queue) => total + queue.lessons.length, 0);
  const skippedCompletedCount = totalLessons - pendingCount;

  const eligibleDates: string[] = [];
  for (let date = input.startDate; date <= input.endDate; date = addCalendarDays(date, 1)) {
    if (input.schedule.studyWeekdays.includes(localWeekday(date))) eligibleDates.push(date);
  }
  const dayTotal = eligibleDates.length;
  const capacity = dayTotal * input.schedule.maxSessionsPerDay;

  // 1) Pending (not yet completed) lessons come first.
  const pendingScheduled = takeRoundRobin(pendingQueues, Math.min(capacity, pendingCount));

  // 2) fillAllDays: top up with review sessions until every eligible day has one.
  let queued: QueuedLesson[] = pendingScheduled;
  if (input.fillAllDays && totalLessons > 0 && queued.length < dayTotal) {
    const scheduledIds = new Set(pendingScheduled.map(({ lesson }) => lesson.id));
    const reviewQueues = allQueues.map((queue) => ({
      subjectId: queue.subjectId,
      lessons: queue.lessons.filter((lesson) => !scheduledIds.has(lesson.id)),
    }));
    const hasReviewPool = reviewQueues.some((queue) => queue.lessons.length > 0);
    const reviews = takeCyclic(hasReviewPool ? reviewQueues : allQueues, dayTotal - queued.length);
    queued = [...pendingScheduled, ...reviews];
  }

  const dayCounts = dayCountsFor(queued.length, dayTotal, input.schedule.maxSessionsPerDay);
  const sessions: GeneratorResult['sessions'] = [];
  let lessonIndex = 0;
  for (let dayIndex = 0; dayIndex < dayTotal; dayIndex += 1) {
    for (let order = 0; order < (dayCounts[dayIndex] ?? 0); order += 1) {
      const item = queued[lessonIndex++];
      const date = eligibleDates[dayIndex];
      if (!item || !date) throw new Error('Generated session plan is incomplete');
      sessions.push({
        subjectId: item.subjectId,
        lessonId: item.lesson.id,
        date,
        order,
        ...(item.isReview ? { isReview: true } : {}),
      });
    }
  }

  const reviewCount = sessions.filter((session) => session.isReview).length;
  const scheduledCount = sessions.length;
  const unscheduledLessonsCount = pendingCount - pendingScheduled.length;
  return {
    sessions,
    totalLessons,
    scheduledCount,
    reviewCount,
    eligibleDaysCount: dayTotal,
    skippedCompletedCount,
    selectedSubjectsCount: input.subjects.length,
    capacity,
    unscheduledLessonsCount,
    suggestions:
      totalLessons === 0
        ? [{ code: 'NO_LESSONS', message: 'لا توجد دروس متاحة للجدولة' }]
        : pendingCount === 0 && scheduledCount === 0
          ? [{ code: 'ALL_LESSONS_COMPLETED', message: 'كل دروس المواد المختارة مكتملة' }]
          : unscheduledLessonsCount > 0
            ? [
                { code: 'INCREASE_DAILY_CAPACITY', message: 'زد الحد الأقصى للجلسات اليومية' },
                { code: 'ADD_STUDY_DAYS', message: 'أضف أياماً أخرى للمذاكرة' },
                { code: 'EXTEND_DATE_RANGE', message: 'مدد نطاق تاريخ الجدول' },
              ]
            : [],
  };
}

export function groupGlobalPlan<TSession extends { date: string; order: number }>(
  startDate: string,
  endDate: string,
  sessions: TSession[]
): PlannedMonth<TSession>[] {
  const sessionByDate = new Map<string, TSession[]>();
  for (const session of sessions) {
    const current = sessionByDate.get(session.date) ?? [];
    current.push(session);
    sessionByDate.set(session.date, current);
  }
  const monthGroups = new Map<string, PlannedDay<TSession>[]>();
  for (let date = startDate; date <= endDate; date = addCalendarDays(date, 1)) {
    const [year, month] = date.split('-').map(Number);
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const days = monthGroups.get(monthKey) ?? [];
    days.push({
      date,
      sessions: (sessionByDate.get(date) ?? []).sort((a, b) => a.order - b.order),
    });
    monthGroups.set(monthKey, days);
  }

  return [...monthGroups.entries()].map(([key, days]) => {
    const [yearText, monthText] = key.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    const monthStart = `${key}-01`;
    const firstWeekday = localWeekday(monthStart);
    const weeks = new Map<number, PlannedDay<TSession>[]>();
    for (const day of days) {
      const dayNumber = Number(day.date.slice(8, 10));
      const week = Math.floor((firstWeekday + dayNumber - 1) / 7) + 1;
      const weekDays = weeks.get(week) ?? [];
      weekDays.push(day);
      weeks.set(week, weekDays);
    }
    const plannedWeeks: PlannedWeek<TSession>[] = [...weeks.entries()].map(([week, weekDays]) => ({
      week,
      startDate: weekDays[0]?.date ?? throwEmptyWeek(),
      endDate: weekDays.at(-1)?.date ?? throwEmptyWeek(),
      days: weekDays,
    }));
    return {
      year,
      month,
      monthName: new Intl.DateTimeFormat('ar-EG', {
        month: 'long',
        timeZone: 'UTC',
      }).format(new Date(Date.UTC(year, month - 1, 1))),
      weeks: plannedWeeks,
    };
  });
}

function throwEmptyWeek(): never {
  throw new Error('Cannot group an empty global-plan week');
}
