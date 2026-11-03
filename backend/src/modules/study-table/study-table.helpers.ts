import { Prisma, StudyTableType } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../../utils/AppError';
import { prisma } from '../../config/prisma';
import {
  addCalendarDays,
  calendarDays,
  dateKey,
  localDateKey,
  monthlyRange,
  validateTimezone,
} from './date-time';
import { generateStudySessions } from './study-table.generator';
import { getSubjectScopeWhere } from './study-table.scope';
import { getSubjectTitlesForTrack } from '../subject/subject-tracks';
import { getStudySessionStatus } from './study-table.status';
import {
  CreateStudyTableInput,
  GenerateStudyTableInput,
  StudyTableUpdateInput,
} from './study-table.schema';
import { GeneratorSubject, StudyTableInput } from './study-table.types';

export type Transaction = Prisma.TransactionClient;
export type Range = {
  startDate: string;
  endDate: string;
  month?: number;
  year?: number;
  monthStartDate?: string;
  startsFromToday?: boolean;
};
export type SessionRecord = Prisma.StudySessionGetPayload<{
  include: { subject: true; lesson: { include: { unit: true } } };
}>;

export const sessionInclude = {
  subject: true,
  lesson: { include: { unit: true } },
} satisfies Prisma.StudySessionInclude;

export function dayDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export function dayCount(start: string, end: string): number {
  return (
    Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000) + 1
  );
}

export function addMonthName<T extends { month: number | null; year: number | null }>(table: T) {
  if (!table.month || !table.year) return table;
  return {
    ...table,
    monthName: new Intl.DateTimeFormat('ar-EG', {
      month: 'long',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(table.year, table.month - 1, 1))),
  };
}

export async function getTimezone(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  if (!user) throw new NotFoundError('المستخدم غير موجود');
  if (!validateTimezone(user.timezone)) {
    throw new BadRequestError('المنطقة الزمنية للمستخدم غير صالحة');
  }
  return user.timezone;
}

export async function getSubjectTitlesForUser(
  userId: string
): Promise<readonly string[] | undefined> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, track: true },
  });
  if (!user) throw new NotFoundError('المستخدم غير موجود');
  return user.role === 'USER' ? getSubjectTitlesForTrack(user.track) : undefined;
}

export function tableRange(input: StudyTableInput, timezone: string, now = new Date()): Range {
  if (input.type === 'MONTHLY') {
    return monthlyRange({ month: input.month, year: input.year, timezone, now });
  }
  if (input.type === 'WEEKLY') {
    return { startDate: input.startDate, endDate: addCalendarDays(input.startDate, 6) };
  }
  return { startDate: input.startDate, endDate: input.endDate! };
}

export function validateRange(type: StudyTableType, range: Range) {
  if (range.startDate > range.endDate) {
    throw new BadRequestError('تاريخ البداية يجب أن يسبق تاريخ النهاية');
  }
  const count = dayCount(range.startDate, range.endDate);
  if (type === StudyTableType.WEEKLY && count !== 7) {
    throw new BadRequestError('يجب أن يحتوي الجدول الأسبوعي على سبعة أيام');
  }
  if (type === StudyTableType.CUSTOM && count > 366) {
    throw new BadRequestError('يجب ألا تتجاوز الفترة المخصصة 366 يوماً');
  }
  if (type === StudyTableType.GLOBAL && count > 400) {
    throw new BadRequestError('يجب ألا تتجاوز الخطة الشاملة 400 يوم');
  }
}

export function getUpdatedRange(
  type: StudyTableType,
  currentRange: Range,
  input: StudyTableUpdateInput,
  timezone: string,
  now = new Date()
): Range {
  let range: Range = currentRange;
  if (type === StudyTableType.WEEKLY) {
    if (input.endDate || input.month !== undefined || input.year !== undefined) {
      throw new BadRequestError('يسمح بتغيير تاريخ البداية فقط في الجدول الأسبوعي');
    }
    if (input.startDate) {
      range = {
        ...currentRange,
        startDate: input.startDate,
        endDate: addCalendarDays(input.startDate, 6),
      };
    }
  } else if (type === StudyTableType.MONTHLY) {
    if (input.startDate || input.endDate) {
      throw new BadRequestError('يتم تغيير الشهر والسنة في الجداول الشهرية');
    }
    if (input.month !== undefined || input.year !== undefined) {
      const month = input.month ?? currentRange.month;
      const year = input.year ?? currentRange.year;
      if (!month) throw new BadRequestError('بيانات الشهر والسنة في الجدول غير مكتملة');
      range = monthlyRange({ month, year, timezone, now });
    }
  } else {
    if (input.month !== undefined || input.year !== undefined) {
      throw new BadRequestError('تغيير الشهر والسنة متاح للجداول الشهرية فقط');
    }
    range = {
      ...currentRange,
      startDate: input.startDate ?? currentRange.startDate,
      endDate: input.endDate ?? currentRange.endDate,
    };
  }
  validateRange(type, range);
  return range;
}

export function getSessionCompletionUpdate(
  completed: boolean,
  existingCompletedAt: Date | null,
  now = new Date()
): { completedAt: Date | null; lateNotifiedAt?: null } {
  return completed
    ? { completedAt: existingCompletedAt ?? now }
    : { completedAt: null, lateNotifiedAt: null };
}

export function tableType(type: CreateStudyTableInput['type']): StudyTableType {
  switch (type) {
    case 'WEEKLY':
      return StudyTableType.WEEKLY;
    case 'MONTHLY':
      return StudyTableType.MONTHLY;
    case 'CUSTOM':
      return StudyTableType.CUSTOM;
    case 'GLOBAL':
      return StudyTableType.GLOBAL;
  }
}

export async function acquireUserStudyLock(tx: Transaction, userId: string) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))::text`;
}

export async function assertSubjectScope(
  tx: Transaction,
  tableId: string,
  allSubjects: boolean,
  subjectId: string,
  subjectTitles?: readonly string[]
) {
  if (subjectTitles !== undefined) {
    const subject = await tx.studySubject.findFirst({
      where: { id: subjectId, title: { in: [...subjectTitles] } },
      select: { id: true },
    });
    if (!subject) throw new BadRequestError('المادة غير متاحة للمسار الدراسي');
  }
  if (allSubjects) return;
  const subject = await tx.studyTableSubject.findUnique({
    where: { studyTableId_subjectId: { studyTableId: tableId, subjectId } },
    select: { id: true },
  });
  if (!subject) throw new BadRequestError('المادة خارج نطاق هذا الجدول');
}

export async function assertLessonSubject(tx: Transaction, lessonId: string, subjectId: string) {
  const lesson = await tx.studyLesson.findFirst({
    where: { id: lessonId, unit: { subjectId } },
    select: { id: true },
  });
  if (!lesson) throw new BadRequestError('الدرس لا يتبع المادة المحددة');
}

export async function writeScope(
  tx: Transaction,
  tableId: string,
  scope: StudyTableInput['subjects'],
  subjectTitles?: readonly string[]
) {
  if (scope !== 'ALL') {
    const count = await tx.studySubject.count({
      where: {
        id: { in: scope },
        ...(subjectTitles ? { title: { in: [...subjectTitles] } } : {}),
      },
    });
    if (count !== scope.length) throw new BadRequestError('تتضمن المواد المحددة مادة غير موجودة');
  }
  await tx.studyTableSubject.deleteMany({ where: { studyTableId: tableId } });
  if (scope === 'ALL') return { allSubjects: true };
  await tx.studyTableSubject.createMany({
    data: scope.map((subjectId) => ({ studyTableId: tableId, subjectId })),
  });
  return { allSubjects: false };
}

export async function createDays(tx: Transaction, tableId: string, range: Range) {
  await tx.studyDay.createMany({
    data: calendarDays(range.startDate, range.endDate).map((date) => ({
      studyTableId: tableId,
      date: dayDate(date),
    })),
    skipDuplicates: true,
  });
}

export function getAvailableMonthRanges(timezone: string, count: number, now: Date) {
  const today = localDateKey(now, timezone);
  const currentYear = Number(today.slice(0, 4));
  const currentMonth = Number(today.slice(5, 7));

  const months = Array.from({ length: count }, (_, index) => {
    const absoluteMonth = currentYear * 12 + currentMonth - 1 + index;
    const year = Math.floor(absoluteMonth / 12);
    const month = (absoluteMonth % 12) + 1;
    const range = monthlyRange({ month, year, timezone, now });
    const monthName = new Intl.DateTimeFormat('ar-EG', {
      month: 'long',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, 1)));

    return {
      month,
      year,
      label: `${monthName} ${year}`,
      isCurrent: index === 0,
      startDate: range.startDate,
      endDate: range.endDate,
      remainingDays: dayCount(range.startDate, range.endDate),
    };
  });

  return { today, months };
}

export async function listCatalog(
  tx: Transaction,
  scope: StudyTableInput['subjects'],
  userId: string,
  subjectTitles?: readonly string[]
): Promise<{ subjects: GeneratorSubject[]; completed: Set<string> }> {
  const [subjects, completionRows] = await Promise.all([
    tx.studySubject.findMany({
      where: getSubjectScopeWhere(scope, subjectTitles),
      orderBy: { title: 'asc' },
      include: {
        units: {
          orderBy: [{ order: 'asc' }, { id: 'asc' }],
          include: { lessons: { orderBy: [{ order: 'asc' }, { id: 'asc' }] } },
        },
      },
    }),
    tx.studyLessonCompletion.findMany({
      where: { userId },
      select: { lessonId: true },
    }),
  ]);
  return {
    subjects: subjects.map((subject) => ({
      id: subject.id,
      title: subject.title,
      units: subject.units.map((unit) => ({
        id: unit.id,
        title: unit.title,
        order: unit.order,
        lessons: unit.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          order: lesson.order,
        })),
      })),
    })),
    completed: new Set(completionRows.map(({ lessonId }) => lessonId)),
  };
}

export async function createTableRecord(
  tx: Transaction,
  userId: string,
  input: StudyTableInput,
  range: Range,
  schedule?: GenerateStudyTableInput['schedule'],
  subjectTitles?: readonly string[]
) {
  const allSubjects = input.subjects === 'ALL';
  const table = await tx.studyTable.create({
    data: {
      title: input.title,
      type: tableType(input.type),
      startDate: dayDate(range.startDate),
      endDate: dayDate(range.endDate),
      month: range.month,
      year: range.year,
      allSubjects,
      userId,
      ...(schedule
        ? {
            studyWeekdays: schedule.studyWeekdays,
            maxSessionsPerDay: schedule.maxSessionsPerDay,
          }
        : {}),
    },
  });
  if (!allSubjects) await writeScope(tx, table.id, input.subjects, subjectTitles);
  await createDays(tx, table.id, range);
  return table;
}

export function sessionResponse(session: SessionRecord, date: string, timezone: string) {
  return {
    id: session.id,
    order: session.order,
    dayId: session.dayId,
    studyTableId: session.studyTableId,
    subjectId: session.subjectId,
    lessonId: session.lessonId,
    date,
    subject: { id: session.subject.id, title: session.subject.title },
    lesson: {
      id: session.lesson.id,
      title: session.lesson.title,
      unit: {
        id: session.lesson.unit.id,
        title: session.lesson.unit.title,
      },
    },
    completedAt: session.completedAt,
    lateNotifiedAt: session.lateNotifiedAt,
    status: getStudySessionStatus(session, date, timezone),
  };
}

export async function savePlannedSessions(
  tx: Transaction,
  userId: string,
  tableId: string,
  plan: GenerateStudyTableResult['sessions']
) {
  if (!plan.length) return;
  const dates = [...new Set(plan.map(({ date }) => date))];
  const days = await tx.studyDay.findMany({
    where: { studyTableId: tableId, date: { in: dates.map(dayDate) } },
    select: { id: true, date: true },
  });
  const dayMap = new Map(days.map((day) => [dateKey(day.date), day.id]));
  await tx.studySession.createMany({
    data: plan.map((session) => {
      const dayId = dayMap.get(session.date);
      if (!dayId) throw new BadRequestError('تعذر إنشاء يوم الجلسة');
      return {
        userId,
        studyTableId: tableId,
        dayId,
        subjectId: session.subjectId,
        lessonId: session.lessonId,
        order: session.order,
      };
    }),
  });
}

export type GenerateStudyTableResult = ReturnType<typeof generateStudySessions>;

export async function reorderDay(tx: Transaction, dayId: string, sessionId: string, order: number) {
  const sessions = await tx.studySession.findMany({
    where: { dayId },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    select: { id: true },
  });
  const reordered = sessions.filter((session) => session.id !== sessionId);
  reordered.splice(Math.min(order, reordered.length), 0, { id: sessionId });
  await Promise.all(
    reordered.map((session, index) =>
      tx.studySession.update({ where: { id: session.id }, data: { order: index } })
    )
  );
}

export async function reindexDay(tx: Transaction, dayId: string) {
  const sessions = await tx.studySession.findMany({
    where: { dayId },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    select: { id: true },
  });
  await Promise.all(
    sessions.map(({ id }, order) => tx.studySession.update({ where: { id }, data: { order } }))
  );
}

export function percentage(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}

export type StudySessionResponse = ReturnType<typeof sessionResponse>;
