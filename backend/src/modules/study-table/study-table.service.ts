import { Prisma, StudyTableType } from '@prisma/client';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnprocessableEntityError,
} from '../../utils/AppError';
import { prisma } from '../../config/prisma';
import { logger } from '../../utils/logger';
import { pdfService } from './pdf.service';
import { studyTableRepository } from './study-table.repository';
import {
  addCalendarDays,
  calendarDays,
  dateKey,
  localDateKey,
  monthlyRange,
  validateTimezone,
} from './date-time';
import { generateStudySessions, groupGlobalPlan } from './study-table.generator';
import { getSubjectScopeWhere } from './study-table.scope';
import { getSubjectTitlesForTrack } from '../subject/subject-tracks';
import { getStudySessionStatus } from './study-table.status';
import {
  CreateStudyTableInput,
  GenerateStudyTableInput,
  SessionInput,
  SessionReplaceInput,
  StudyTableUpdateInput,
} from './study-table.schema';
import { GeneratorSubject, StudyTableInput, StudyTableProgress } from './study-table.types';

type Transaction = Prisma.TransactionClient;
export type Range = {
  startDate: string;
  endDate: string;
  month?: number;
  year?: number;
  monthStartDate?: string;
  startsFromToday?: boolean;
};
type SessionRecord = Prisma.StudySessionGetPayload<{
  include: { subject: true; lesson: { include: { unit: true } } };
}>;

const sessionInclude = {
  subject: true,
  lesson: { include: { unit: true } },
} satisfies Prisma.StudySessionInclude;

function dayDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

function dayCount(start: string, end: string): number {
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000) + 1;
}

function addMonthName<T extends { month: number | null; year: number | null }>(table: T) {
  if (!table.month || !table.year) return table;
  return {
    ...table,
    monthName: new Intl.DateTimeFormat('ar-EG', {
      month: 'long',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(table.year, table.month - 1, 1))),
  };
}

async function getTimezone(userId: string): Promise<string> {
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

async function getSubjectTitlesForUser(userId: string): Promise<readonly string[] | undefined> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, track: true },
  });
  if (!user) throw new NotFoundError('المستخدم غير موجود');
  return user.role === 'USER' ? getSubjectTitlesForTrack(user.track) : undefined;
}

function tableRange(input: StudyTableInput, timezone: string, now = new Date()): Range {
  if (input.type === 'MONTHLY') {
    return monthlyRange({ month: input.month, year: input.year, timezone, now });
  }
  if (input.type === 'WEEKLY') {
    return { startDate: input.startDate, endDate: addCalendarDays(input.startDate, 6) };
  }
  return { startDate: input.startDate, endDate: input.endDate! };
}

function validateRange(type: StudyTableType, range: Range) {
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
  now = new Date(),
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
  now = new Date(),
): { completedAt: Date | null; lateNotifiedAt?: null } {
  return completed
    ? { completedAt: existingCompletedAt ?? now }
    : { completedAt: null, lateNotifiedAt: null };
}

function tableType(type: CreateStudyTableInput['type']): StudyTableType {
  switch (type) {
    case 'WEEKLY': return StudyTableType.WEEKLY;
    case 'MONTHLY': return StudyTableType.MONTHLY;
    case 'CUSTOM': return StudyTableType.CUSTOM;
    case 'GLOBAL': return StudyTableType.GLOBAL;
  }
}

async function acquireUserStudyLock(tx: Transaction, userId: string) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))::text`;
}

async function assertSubjectScope(
  tx: Transaction,
  tableId: string,
  allSubjects: boolean,
  subjectId: string,
  subjectTitles?: readonly string[],
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

async function assertLessonSubject(tx: Transaction, lessonId: string, subjectId: string) {
  const lesson = await tx.studyLesson.findFirst({
    where: { id: lessonId, unit: { subjectId } },
    select: { id: true },
  });
  if (!lesson) throw new BadRequestError('الدرس لا يتبع المادة المحددة');
}

async function writeScope(
  tx: Transaction,
  tableId: string,
  scope: StudyTableInput['subjects'],
  subjectTitles?: readonly string[],
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

async function createDays(tx: Transaction, tableId: string, range: Range) {
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

async function listCatalog(
  tx: Transaction,
  scope: StudyTableInput['subjects'],
  userId: string,
  subjectTitles?: readonly string[],
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

async function createTableRecord(
  tx: Transaction,
  userId: string,
  input: StudyTableInput,
  range: Range,
  schedule?: GenerateStudyTableInput['schedule'],
  subjectTitles?: readonly string[],
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
      ...(schedule ? {
        studyWeekdays: schedule.studyWeekdays,
        maxSessionsPerDay: schedule.maxSessionsPerDay,
      } : {}),
    },
  });
  if (!allSubjects) await writeScope(tx, table.id, input.subjects, subjectTitles);
  await createDays(tx, table.id, range);
  return table;
}

function sessionResponse(session: SessionRecord, date: string, timezone: string) {
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

async function savePlannedSessions(
  tx: Transaction,
  userId: string,
  tableId: string,
  plan: GenerateStudyTableResult['sessions'],
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

type GenerateStudyTableResult = ReturnType<typeof generateStudySessions>;

async function reorderDay(tx: Transaction, dayId: string, sessionId: string, order: number) {
  const sessions = await tx.studySession.findMany({
    where: { dayId },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    select: { id: true },
  });
  const reordered = sessions.filter((session) => session.id !== sessionId);
  reordered.splice(Math.min(order, reordered.length), 0, { id: sessionId });
  await Promise.all(reordered.map((session, index) =>
    tx.studySession.update({ where: { id: session.id }, data: { order: index } }),
  ));
}

async function reindexDay(tx: Transaction, dayId: string) {
  const sessions = await tx.studySession.findMany({
    where: { dayId },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    select: { id: true },
  });
  await Promise.all(sessions.map(({ id }, order) =>
    tx.studySession.update({ where: { id }, data: { order } }),
  ));
}

function percentage(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}

export const studyTableService = {
  async create(userId: string, input: CreateStudyTableInput) {
    const timezone = await getTimezone(userId);
    const subjectTitles = await getSubjectTitlesForUser(userId);
    const range = tableRange(input, timezone);
    validateRange(tableType(input.type), range);
    return prisma.$transaction(async (tx) => {
      await acquireUserStudyLock(tx, userId);
      return addMonthName(await createTableRecord(tx, userId, input, range, undefined, subjectTitles));
    });
  },

  async getAvailableMonths(userId: string, count: number, now = new Date()) {
    const timezone = await getTimezone(userId);
    return getAvailableMonthRanges(timezone, count, now);
  },

  async generate(userId: string, input: GenerateStudyTableInput, preview: boolean) {
    const timezone = await getTimezone(userId);
    const subjectTitles = await getSubjectTitlesForUser(userId);
    const { schedule, ...tableInput } = input;
    const range = tableRange(tableInput, timezone);
    validateRange(tableType(input.type), range);

    const { subjects, completed } = await prisma.$transaction((tx) =>
      listCatalog(tx, tableInput.subjects, userId, subjectTitles),
    );
    if (tableInput.subjects !== 'ALL' && subjects.length !== tableInput.subjects.length) {
      throw new BadRequestError('تتضمن المواد المحددة مادة غير موجودة');
    }
    const generated = generateStudySessions({
      type: tableType(input.type),
      startDate: range.startDate,
      endDate: range.endDate,
      subjects,
      completedLessonIds: completed,
      schedule,
    });
    if (generated.sessions.length === 0) {
      const lessonCount = subjects.reduce(
        (total, subject) => total + subject.units.reduce((unitTotal, unit) => unitTotal + unit.lessons.length, 0),
        0,
      );
      const completedCount = subjects.reduce(
        (total, subject) => total + subject.units.reduce(
          (unitTotal, unit) => unitTotal + unit.lessons.filter((lesson) => completed.has(lesson.id)).length,
          0,
        ),
        0,
      );
      logger.debug('Study table generation found no lessons', {
        subjects: subjects.length,
        units: subjects.reduce((total, subject) => total + subject.units.length, 0),
        lessons: lessonCount,
        completed: completedCount,
      });
    }
    const lessonById = new Map(subjects.flatMap((subject) =>
      subject.units.flatMap((unit) => unit.lessons.map((lesson) => [
        lesson.id,
        { lesson, unit, subject },
      ] as const)),
    ));
    const sessions = generated.sessions.map((session) => {
      const catalog = lessonById.get(session.lessonId);
      if (!catalog) throw new BadRequestError('تعذر العثور على درس في الخطة');
      return {
        ...session,
        subject: { id: catalog.subject.id, title: catalog.subject.title },
        lesson: {
          id: catalog.lesson.id,
          title: catalog.lesson.title,
          unit: { id: catalog.unit.id, title: catalog.unit.title },
        },
        status: getStudySessionStatus({}, session.date, timezone),
      };
    });
    const months = input.type === 'GLOBAL'
      ? groupGlobalPlan(range.startDate, range.endDate, sessions)
      : undefined;
    const plan = {
      preview,
      range,
      sessions,
      ...(months ? { months } : {}),
      capacity: generated.capacity,
      totalLessons: generated.totalLessons,
      scheduledCount: generated.scheduledCount,
      skippedCompletedCount: generated.skippedCompletedCount,
      selectedSubjectsCount: generated.selectedSubjectsCount,
      unscheduledLessonsCount: generated.unscheduledLessonsCount,
      suggestions: generated.suggestions,
    };

    if (generated.totalLessons === 0 && !preview) {
      throw new UnprocessableEntityError('لا توجد دروس متاحة للجدولة', {
        code: 'NO_LESSONS',
        details: plan,
      });
    }
    if (input.type === 'GLOBAL' && generated.unscheduledLessonsCount > 0 && !preview) {
      throw new UnprocessableEntityError('لا توجد سعة كافية لإنهاء جميع الدروس', {
        code: 'INSUFFICIENT_CAPACITY',
        details: plan,
      });
    }
    if (preview) return plan;

    return prisma.$transaction(async (tx) => {
      await acquireUserStudyLock(tx, userId);
      const table = await createTableRecord(tx, userId, tableInput, range, schedule);
      await savePlannedSessions(tx, userId, table.id, generated.sessions);
      const days = await tx.studyDay.findMany({
        where: { studyTableId: table.id },
        orderBy: { date: 'asc' },
        include: {
          sessions: {
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
            include: sessionInclude,
          },
        },
      });
      const persistedSessions = days.flatMap((day) =>
        day.sessions.map((session) => sessionResponse(session, dateKey(day.date), timezone)),
      );
      return {
        tableId: table.id,
        range,
        capacity: generated.capacity,
        totalLessons: generated.totalLessons,
        scheduledCount: generated.scheduledCount,
        skippedCompletedCount: generated.skippedCompletedCount,
        selectedSubjectsCount: generated.selectedSubjectsCount,
        unscheduledLessonsCount: generated.unscheduledLessonsCount,
        suggestions: generated.suggestions,
        sessions: persistedSessions,
        ...(input.type === 'GLOBAL'
          ? { months: groupGlobalPlan(range.startDate, range.endDate, persistedSessions) }
          : {}),
      };
    });
  },

  getMyTables(userId: string, options: { page: number; limit: number; search?: string }) {
    return studyTableRepository.findByUserId(userId, options).then((result) => ({
      ...result,
      data: result.data.map(addMonthName),
    }));
  },

  async getById(userId: string, tableId: string) {
    const [table, timezone, subjectTitles] = await Promise.all([
      studyTableRepository.findById(tableId, userId),
      getTimezone(userId),
      getSubjectTitlesForUser(userId),
    ]);
    if (!table) throw new NotFoundError('جدول المذاكرة غير موجود');
    const days = table.days.map((day) => ({
      id: day.id,
      date: dateKey(day.date),
      studyTableId: day.studyTableId,
      createdAt: day.createdAt,
      sessions: day.sessions
        .filter(({ subject }) => !subjectTitles || subjectTitles.includes(subject.title))
        .map((session) => sessionResponse(session, dateKey(day.date), timezone)),
    }));
    return {
      ...addMonthName(table),
      days,
      ...(table.type === StudyTableType.GLOBAL
        ? { months: groupGlobalPlan(
          dateKey(table.startDate),
          dateKey(table.endDate),
          days.flatMap((day) => day.sessions),
        ) }
        : {}),
    };
  },

  async update(userId: string, tableId: string, input: StudyTableUpdateInput) {
    const timezone = await getTimezone(userId);
    const subjectTitles = await getSubjectTitlesForUser(userId);
    return prisma.$transaction(async (tx) => {
      await acquireUserStudyLock(tx, userId);
      const table = await tx.studyTable.findFirst({ where: { id: tableId, userId } });
      if (!table) throw new NotFoundError('جدول المذاكرة غير موجود');
      const currentRange = {
        startDate: dateKey(table.startDate),
        endDate: dateKey(table.endDate),
        month: table.month ?? undefined,
        year: table.year ?? undefined,
      };
      const range = getUpdatedRange(table.type, currentRange, input, timezone);
      const dateRangeChanged = range.startDate !== currentRange.startDate
        || range.endDate !== currentRange.endDate;

      const existingSessions = await tx.studySession.findMany({
        where: { studyTableId: tableId },
        select: { lessonId: true, subjectId: true, dayId: true },
      });
      if (input.subjects !== undefined && input.subjects !== 'ALL') {
        const outOfScope = existingSessions.filter(({ subjectId }) => !input.subjects!.includes(subjectId));
        if (outOfScope.length) {
          throw new BadRequestError('لا يمكن إزالة مادة مرتبطة بجلسات موجودة');
        }
      }
      const daysToRemove = dateRangeChanged ? await tx.studyDay.findMany({
        where: {
          studyTableId: tableId,
          OR: [
            { date: { lt: dayDate(range.startDate) } },
            { date: { gt: dayDate(range.endDate) } },
          ],
        },
        select: { id: true },
      }) : [];
      if (daysToRemove.length) {
        const removedDayIds = daysToRemove.map(({ id }) => id);
        const removedSessions = await tx.studySession.findMany({
          where: { dayId: { in: removedDayIds } },
          select: { lessonId: true },
        });
        if (removedSessions.length) {
          await tx.studyLessonCompletion.deleteMany({
            where: {
              userId,
              lessonId: { in: removedSessions.map(({ lessonId }) => lessonId) },
            },
          });
        }
        await tx.studyDay.deleteMany({ where: { id: { in: removedDayIds } } });
      }
      const subjectUpdates = input.subjects === undefined
        ? {}
        : await writeScope(tx, tableId, input.subjects, subjectTitles);
      const updated = await tx.studyTable.update({
        where: { id: tableId },
        data: {
          title: input.title,
          startDate: dayDate(range.startDate),
          endDate: dayDate(range.endDate),
          month: range.month ?? null,
          year: range.year ?? null,
          ...subjectUpdates,
        },
      });
      await createDays(tx, tableId, range);
      return addMonthName(updated);
    });
  },

  async delete(userId: string, tableId: string) {
    await prisma.$transaction(async (tx) => {
      await acquireUserStudyLock(tx, userId);
      const table = await tx.studyTable.findFirst({
        where: { id: tableId, userId },
        select: { id: true },
      });
      if (!table) throw new NotFoundError('جدول المذاكرة غير موجود');
      const sessions = await tx.studySession.findMany({
        where: { studyTableId: tableId },
        select: { lessonId: true },
      });
      if (sessions.length) {
        await tx.studyLessonCompletion.deleteMany({
          where: {
            userId,
            lessonId: { in: sessions.map(({ lessonId }) => lessonId) },
          },
        });
      }
      await tx.studyTable.delete({ where: { id: tableId } });
    });
  },

  async createSession(userId: string, tableId: string, input: SessionInput) {
    const timezone = await getTimezone(userId);
    const subjectTitles = await getSubjectTitlesForUser(userId);
    return prisma.$transaction(async (tx) => {
      await acquireUserStudyLock(tx, userId);
      const table = await tx.studyTable.findFirst({
        where: { id: tableId, userId },
        select: { id: true, startDate: true, endDate: true, allSubjects: true },
      });
      if (!table) throw new NotFoundError('جدول المذاكرة غير موجود');
      if (input.date && input.dayId) throw new BadRequestError('حدد اليوم أو التاريخ وليس كليهما');
      const day = input.dayId
        ? await tx.studyDay.findFirst({ where: { id: input.dayId, studyTableId: tableId } })
        : await tx.studyDay.findUnique({
          where: { studyTableId_date: { studyTableId: tableId, date: dayDate(input.date!) } },
        });
      if (!day) throw new BadRequestError('يوم المذاكرة غير موجود في الجدول');
      await assertSubjectScope(tx, table.id, table.allSubjects, input.subjectId, subjectTitles);
      await assertLessonSubject(tx, input.lessonId, input.subjectId);
      const duplicate = await tx.studySession.findUnique({
        where: { studyTableId_lessonId: { studyTableId: tableId, lessonId: input.lessonId } },
      });
      if (duplicate) throw new ConflictError('لا يمكن إضافة الدرس نفسه أكثر من مرة إلى الجدول');
      const count = await tx.studySession.count({ where: { dayId: day.id } });
      const session = await tx.studySession.create({
        data: {
          userId,
          studyTableId: tableId,
          dayId: day.id,
          subjectId: input.subjectId,
          lessonId: input.lessonId,
          order: input.order ?? count,
        },
        include: sessionInclude,
      });
      if (input.order !== undefined) await reorderDay(tx, day.id, session.id, input.order);
      const reordered = await tx.studySession.findUniqueOrThrow({
        where: { id: session.id },
        include: sessionInclude,
      });
      return sessionResponse(reordered, dateKey(day.date), timezone);
    });
  },

  async updateSession(userId: string, sessionId: string, input: SessionInput) {
    const timezone = await getTimezone(userId);
    const subjectTitles = await getSubjectTitlesForUser(userId);
    return prisma.$transaction(async (tx) => {
      await acquireUserStudyLock(tx, userId);
      const current = await tx.studySession.findFirst({
        where: { id: sessionId, userId },
        include: { studyTable: true, day: true },
      });
      if (!current) throw new NotFoundError('جلسة المذاكرة غير موجودة');
      if (input.date && input.dayId) throw new BadRequestError('حدد اليوم أو التاريخ وليس كليهما');
      const targetDay = input.dayId
        ? await tx.studyDay.findFirst({
          where: { id: input.dayId, studyTableId: current.studyTableId },
        })
        : input.date
          ? await tx.studyDay.findUnique({
            where: {
              studyTableId_date: {
                studyTableId: current.studyTableId,
                date: dayDate(input.date),
              },
            },
          })
          : current.day;
      if (!targetDay) throw new BadRequestError('يوم المذاكرة غير موجود في الجدول');
      const subjectId = input.subjectId ?? current.subjectId;
      const lessonId = input.lessonId ?? current.lessonId;
      await assertSubjectScope(
        tx,
        current.studyTableId,
        current.studyTable.allSubjects,
        subjectId,
        subjectTitles,
      );
      await assertLessonSubject(tx, lessonId, subjectId);
      if (lessonId !== current.lessonId) {
        const duplicate = await tx.studySession.findFirst({
          where: { studyTableId: current.studyTableId, lessonId, id: { not: current.id } },
          select: { id: true },
        });
        if (duplicate) throw new ConflictError('لا يمكن إضافة الدرس نفسه أكثر من مرة إلى الجدول');
        await tx.studyLessonCompletion.deleteMany({ where: { userId, lessonId: current.lessonId } });
      }
      const order = input.order ?? (
        targetDay.id === current.dayId
          ? current.order
          : await tx.studySession.count({ where: { dayId: targetDay.id } })
      );
      const session = await tx.studySession.update({
        where: { id: current.id },
        data: {
          subjectId,
          lessonId,
          dayId: targetDay.id,
          order,
          ...(lessonId !== current.lessonId ? { completedAt: null, lateNotifiedAt: null } : {}),
        },
        include: sessionInclude,
      });
      await reorderDay(tx, targetDay.id, session.id, order);
      if (targetDay.id !== current.dayId) await reindexDay(tx, current.dayId);
      const reordered = await tx.studySession.findUniqueOrThrow({
        where: { id: session.id },
        include: sessionInclude,
      });
      return sessionResponse(reordered, dateKey(targetDay.date), timezone);
    });
  },

  async deleteSession(userId: string, sessionId: string) {
    await prisma.$transaction(async (tx) => {
      await acquireUserStudyLock(tx, userId);
      const session = await tx.studySession.findFirst({
        where: { id: sessionId, userId },
        select: { id: true, lessonId: true, dayId: true },
      });
      if (!session) throw new NotFoundError('جلسة المذاكرة غير موجودة');
      await tx.studyLessonCompletion.deleteMany({
        where: { userId, lessonId: session.lessonId },
      });
      await tx.studySession.delete({ where: { id: session.id } });
      await reindexDay(tx, session.dayId);
    });
  },

  async replaceDaySessions(userId: string, dayId: string, inputs: SessionReplaceInput[]) {
    const timezone = await getTimezone(userId);
    const subjectTitles = await getSubjectTitlesForUser(userId);
    return prisma.$transaction(async (tx) => {
      await acquireUserStudyLock(tx, userId);
      const day = await tx.studyDay.findFirst({
        where: { id: dayId, studyTable: { userId } },
        include: { studyTable: true },
      });
      if (!day) throw new NotFoundError('يوم المذاكرة غير موجود');
      const lessonIds = inputs.map(({ lessonId }) => lessonId);
      if (new Set(lessonIds).size !== lessonIds.length) {
        throw new ConflictError('لا يمكن إضافة الدرس نفسه أكثر من مرة إلى اليوم');
      }
      const otherOccurrences = await tx.studySession.findMany({
        where: {
          studyTableId: day.studyTableId,
          dayId: { not: day.id },
          lessonId: { in: lessonIds },
        },
        select: { lessonId: true },
      });
      if (otherOccurrences.length) {
        throw new ConflictError('لا يمكن إضافة الدرس نفسه أكثر من مرة إلى الجدول');
      }
      for (const input of inputs) {
        await assertSubjectScope(
          tx,
          day.studyTableId,
          day.studyTable.allSubjects,
          input.subjectId,
          subjectTitles,
        );
        await assertLessonSubject(tx, input.lessonId, input.subjectId);
      }
      const existing = await tx.studySession.findMany({
        where: { dayId },
        select: { lessonId: true, completedAt: true },
      });
      const oldLessonIds = existing.map(({ lessonId }) => lessonId);
      const lessonsToForget = oldLessonIds.filter((lessonId) => !lessonIds.includes(lessonId));
      if (lessonsToForget.length) {
        await tx.studyLessonCompletion.deleteMany({
          where: { userId, lessonId: { in: lessonsToForget } },
        });
      }
      const completionByLesson = new Map(existing.map(({ lessonId, completedAt }) => [lessonId, completedAt]));
      const orderedInputs = inputs
        .map((input, index) => ({ input, index }))
        .sort((a, b) => (a.input.order ?? a.index) - (b.input.order ?? b.index) || a.index - b.index);
      await tx.studySession.deleteMany({ where: { dayId } });
      if (inputs.length) {
        await tx.studySession.createMany({
          data: orderedInputs.map(({ input }, index) => ({
            userId,
            studyTableId: day.studyTableId,
            dayId,
            subjectId: input.subjectId,
            lessonId: input.lessonId,
            order: input.order ?? index,
            completedAt: completionByLesson.get(input.lessonId) ?? null,
          })),
        });
      }
      const rows = await tx.studySession.findMany({
        where: { dayId },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        include: sessionInclude,
      });
      return rows.map((session) => sessionResponse(session, dateKey(day.date), timezone));
    });
  },

  async completeSession(userId: string, sessionId: string, completed: boolean) {
    const timezone = await getTimezone(userId);
    return prisma.$transaction(async (tx) => {
      await acquireUserStudyLock(tx, userId);
      const current = await tx.studySession.findFirst({
        where: { id: sessionId, userId },
        include: { day: true },
      });
      if (!current) throw new NotFoundError('جلسة المذاكرة غير موجودة');
      const completionUpdate = getSessionCompletionUpdate(completed, current.completedAt);
      const updated = await tx.studySession.update({
        where: { id: current.id },
        data: {
          ...completionUpdate,
        },
        include: sessionInclude,
      });
      if (completed) {
        await tx.studyLessonCompletion.upsert({
          where: { userId_lessonId: { userId, lessonId: current.lessonId } },
          create: { userId, lessonId: current.lessonId, completedAt: completionUpdate.completedAt! },
          update: { completedAt: completionUpdate.completedAt! },
        });
      } else {
        await tx.studyLessonCompletion.deleteMany({
          where: { userId, lessonId: current.lessonId },
        });
      }
      return sessionResponse(updated, dateKey(current.day.date), timezone);
    });
  },

  async getProgress(userId: string, tableId: string): Promise<StudyTableProgress> {
    const [table, timezone] = await Promise.all([
      prisma.studyTable.findFirst({
        where: { id: tableId, userId },
        include: {
          days: {
            include: {
              sessions: {
                include: { subject: true, lesson: { include: { unit: true } } },
              },
            },
          },
        },
      }),
      getTimezone(userId),
    ]);
    if (!table) throw new NotFoundError('جدول المذاكرة غير موجود');
    const today = localDateKey(new Date(), timezone);
    const subjects = new Map<string, StudyTableProgress['subjects'][number]>();
    let completed = 0;
    let upcoming = 0;
    let inProgress = 0;
    let late = 0;
    let total = 0;

    for (const day of table.days) {
      for (const session of day.sessions) {
        total += 1;
        const status = getStudySessionStatus(session, day.date, timezone);
        const subject = subjects.get(session.subjectId) ?? {
          subjectId: session.subjectId,
          subjectTitle: session.subject.title,
          total: 0,
          completed: 0,
          upcoming: 0,
          inProgress: 0,
          late: 0,
          percent: 0,
          units: [],
        };
        const unit = subject.units.find(({ unitId }) => unitId === session.lesson.unitId)
          ?? {
            unitId: session.lesson.unitId,
            unitTitle: session.lesson.unit.title,
            total: 0,
            completed: 0,
            upcoming: 0,
            inProgress: 0,
            late: 0,
            percent: 0,
          };
        if (!subject.units.some(({ unitId }) => unitId === unit.unitId)) subject.units.push(unit);
        subject.total += 1;
        unit.total += 1;
        if (status === 'COMPLETED') {
          completed += 1;
          subject.completed += 1;
          unit.completed += 1;
        } else if (status === 'UPCOMING') {
          upcoming += 1;
          subject.upcoming += 1;
          unit.upcoming += 1;
        } else if (status === 'IN_PROGRESS') {
          inProgress += 1;
          subject.inProgress += 1;
          unit.inProgress += 1;
        } else {
          late += 1;
          subject.late += 1;
          unit.late += 1;
        }
        subjects.set(session.subjectId, subject);
      }
    }
    const subjectProgress = [...subjects.values()].map((subject) => ({
      ...subject,
      percent: percentage(subject.completed, subject.total),
      units: subject.units.map((unit) => ({
        ...unit,
        percent: percentage(unit.completed, unit.total),
      })),
    }));
    return {
      total,
      completed,
      upcoming,
      inProgress,
      late,
      percent: percentage(completed, total),
      byStatus: {
        COMPLETED: completed,
        UPCOMING: upcoming,
        IN_PROGRESS: inProgress,
        LATE: late,
      },
      asOfDate: today,
      subjects: subjectProgress,
    };
  },

  async getConflicts(_userId: string) {
    return [];
  },

  async generatePDF(userId: string, tableId: string): Promise<Buffer> {
    const table = await this.getById(userId, tableId);
    return pdfService.generateStudyTablePDF(table);
  },
};

export type StudySessionResponse = ReturnType<typeof sessionResponse>;
