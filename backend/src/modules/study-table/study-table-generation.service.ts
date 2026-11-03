import { BadRequestError, UnprocessableEntityError } from '../../utils/AppError';
import { prisma } from '../../config/prisma';
import { logger } from '../../utils/logger';
import { dateKey } from './date-time';
import { generateStudySessions, groupGlobalPlan } from './study-table.generator';
import { getStudySessionStatus } from './study-table.status';
import {
  acquireUserStudyLock,
  addMonthName,
  createTableRecord,
  getAvailableMonthRanges,
  getSubjectTitlesForUser,
  getTimezone,
  listCatalog,
  savePlannedSessions,
  sessionInclude,
  sessionResponse,
  tableRange,
  tableType,
  validateRange,
} from './study-table.helpers';
import { CreateStudyTableInput, GenerateStudyTableInput } from './study-table.schema';

export const studyTableGenerationService = {
  async create(userId: string, input: CreateStudyTableInput) {
    const timezone = await getTimezone(userId);
    const subjectTitles = await getSubjectTitlesForUser(userId);
    const range = tableRange(input, timezone);
    validateRange(tableType(input.type), range);
    return prisma.$transaction(async (tx) => {
      await acquireUserStudyLock(tx, userId);
      return addMonthName(
        await createTableRecord(tx, userId, input, range, undefined, subjectTitles)
      );
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
      listCatalog(tx, tableInput.subjects, userId, subjectTitles)
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
        (total, subject) =>
          total + subject.units.reduce((unitTotal, unit) => unitTotal + unit.lessons.length, 0),
        0
      );
      const completedCount = subjects.reduce(
        (total, subject) =>
          total +
          subject.units.reduce(
            (unitTotal, unit) =>
              unitTotal + unit.lessons.filter((lesson) => completed.has(lesson.id)).length,
            0
          ),
        0
      );
      logger.debug('Study table generation found no lessons', {
        subjects: subjects.length,
        units: subjects.reduce((total, subject) => total + subject.units.length, 0),
        lessons: lessonCount,
        completed: completedCount,
      });
    }
    const lessonById = new Map(
      subjects.flatMap((subject) =>
        subject.units.flatMap((unit) =>
          unit.lessons.map((lesson) => [lesson.id, { lesson, unit, subject }] as const)
        )
      )
    );
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
    const months =
      input.type === 'GLOBAL'
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
        day.sessions.map((session) => sessionResponse(session, dateKey(day.date), timezone))
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
};
