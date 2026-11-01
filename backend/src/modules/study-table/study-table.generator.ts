import { addCalendarDays, localWeekday } from './date-time';
import {
  GeneratorInput,
  GeneratorResult,
  GeneratorSubject,
  PlannedDay,
  PlannedMonth,
  PlannedWeek,
} from './study-table.types';

function orderedLessons(subject: GeneratorSubject) {
  return subject.units
    .slice()
    .sort(compareOrder)
    .flatMap((unit) => unit.lessons.slice().sort(compareOrder));
}

function compareOrder<T extends { order: number; id: string }>(a: T, b: T): number {
  return a.order - b.order || a.id.localeCompare(b.id);
}

export function generateStudySessions(input: GeneratorInput): GeneratorResult {
  const subjectQueues = input.subjects
    .map((subject) => ({
      subjectId: subject.id,
      lessons: orderedLessons(subject).filter(
        (lesson) => !input.completedLessonIds.has(lesson.id),
      ),
    }))
    .filter((queue) => queue.lessons.length > 0);

  const lessonCount = subjectQueues.reduce((total, queue) => total + queue.lessons.length, 0);
  const totalLessons = input.subjects.reduce(
    (total, subject) => total + subject.units.reduce((unitTotal, unit) => unitTotal + unit.lessons.length, 0),
    0,
  );
  const eligibleDates: string[] = [];
  for (let date = input.startDate; date <= input.endDate; date = addCalendarDays(date, 1)) {
    if (input.schedule.studyWeekdays.includes(localWeekday(date))) eligibleDates.push(date);
  }

  const capacity = eligibleDates.length * input.schedule.maxSessionsPerDay;
  const assignCount = Math.min(capacity, lessonCount);
  const sessions: GeneratorResult['sessions'] = [];
  const perDayCount = new Map<string, number>();
  let queueIndex = 0;

  for (let index = 0; index < assignCount; index += 1) {
    while (!subjectQueues[queueIndex]!.lessons.length) {
      queueIndex = (queueIndex + 1) % subjectQueues.length;
    }
    const queue = subjectQueues[queueIndex]!;
    const lesson = queue.lessons.shift()!;
    queueIndex = (queueIndex + 1) % subjectQueues.length;

    const dateIndex = Math.min(
      eligibleDates.length - 1,
      Math.floor(((index + 0.5) * eligibleDates.length) / assignCount),
    );
    const date = eligibleDates[dateIndex]!;
    const order = perDayCount.get(date) ?? 0;
    perDayCount.set(date, order + 1);
    sessions.push({ subjectId: queue.subjectId, lessonId: lesson.id, date, order });
  }

  const unscheduledLessonsCount = lessonCount - sessions.length;
  return {
    sessions,
    totalLessons,
    selectedSubjectsCount: input.subjects.length,
    capacity,
    unscheduledLessonsCount,
    remainingLessonCount: unscheduledLessonsCount,
    suggestions: totalLessons === 0
      ? [{
        code: 'NO_LESSONS',
        message: 'لا توجد دروس متاحة للجدولة',
      }]
      : unscheduledLessonsCount > 0
      ? [
        {
          code: 'INCREASE_DAILY_CAPACITY',
          message: 'زد الحد الأقصى للجلسات اليومية',
        },
        {
          code: 'ADD_STUDY_DAYS',
          message: 'أضف أياماً أخرى للمذاكرة',
        },
        {
          code: 'EXTEND_DATE_RANGE',
          message: 'مدد نطاق تاريخ الجدول',
        },
      ]
      : [],
  };
}

export function groupGlobalPlan<TSession extends { date: string; order: number }>(
  startDate: string,
  endDate: string,
  sessions: TSession[],
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
      startDate: weekDays[0]!.date,
      endDate: weekDays[weekDays.length - 1]!.date,
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
