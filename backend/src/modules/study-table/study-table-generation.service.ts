import { BadRequestError, UnprocessableEntityError } from '../../utils/AppError';
import { prisma } from '../../config/prisma';
import { localDateKey } from './date-time';
import { generateStudySessions, groupGlobalPlan } from './study-table.generator';
import { getStudySessionStatus } from './study-table.status';
import type { GeneratorSubject } from './study-table.types';
import {
  acquireUserStudyLock,
  addMonthName,
  createTableRecord,
  getAvailableMonthRanges,
  getUserContext,
  listCatalog,
  savePlannedSessions,
  tableRange,
  validateRange,
  type Range,
} from './study-table.helpers';
import { CreateStudyTableInput, GenerateStudyTableInput } from './study-table.schema';

function indexLessons(subjects: GeneratorSubject[]) {
  return new Map(
    subjects.flatMap((subject) =>
      subject.units.flatMap((unit) =>
        unit.lessons.map((lesson) => [lesson.id, { lesson, unit, subject }] as const)
      )
    )
  );
}

function mapPlannedSessions(
  sessions: ReturnType<typeof generateStudySessions>['sessions'],
  lessonById: ReturnType<typeof indexLessons>,
  todayKey: string
) {
  return sessions.map((session) => {
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
      status: getStudySessionStatus(null, session.date, todayKey),
    };
  });
}

function makePlan(
  preview: boolean,
  range: Range,
  type: GenerateStudyTableInput['type'],
  generated: ReturnType<typeof generateStudySessions>,
  lessonById: ReturnType<typeof indexLessons>,
  todayKey: string
) {
  const sessions = mapPlannedSessions(generated.sessions, lessonById, todayKey);
  const months =
    type === 'GLOBAL' ? groupGlobalPlan(range.startDate, range.endDate, sessions) : undefined;
  return {
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
}

export const studyTableGenerationService = {
  async create(userId: string, input: CreateStudyTableInput) {
    const { timezone, subjectOwnerId } = await getUserContext(userId);
    const range = tableRange(input, timezone);
    validateRange(input.type, range);
    return prisma.$transaction(async (tx) => {
      await acquireUserStudyLock(tx, userId);
      return addMonthName(
        await createTableRecord(tx, userId, input, range, undefined, subjectOwnerId)
      );
    });
  },

  async getAvailableMonths(userId: string, count: number, now = new Date()) {
    const { timezone } = await getUserContext(userId);
    return getAvailableMonthRanges(timezone, count, now);
  },

  async generate(userId: string, input: GenerateStudyTableInput, preview: boolean) {
    const { timezone, subjectOwnerId } = await getUserContext(userId);
    const todayKey = localDateKey(new Date(), timezone);
    const { schedule, ...tableInput } = input;
    const range = tableRange(tableInput, timezone);
    validateRange(input.type, range);

    return prisma.$transaction(
      async (tx) => {
        if (!preview) await acquireUserStudyLock(tx, userId);
        const { subjects, completed } = await listCatalog(
          tx,
          tableInput.subjects,
          userId,
          subjectOwnerId
        );
        if (tableInput.subjects !== 'ALL' && subjects.length !== tableInput.subjects.length) {
          throw new BadRequestError('تتضمن المواد المحددة مادة غير موجودة');
        }
        const generated = generateStudySessions({
          startDate: range.startDate,
          endDate: range.endDate,
          subjects,
          completedLessonIds: completed,
          schedule,
          fillAllDays: input.type === 'GLOBAL',
        });
        const lessonById = indexLessons(subjects);
        const hasNoLessons = generated.totalLessons === 0 && !preview;
        const hasInsufficientGlobalCapacity =
          input.type === 'GLOBAL' && generated.unscheduledLessonsCount > 0 && !preview;
        if (preview || hasNoLessons || hasInsufficientGlobalCapacity) {
          const plan = makePlan(preview, range, input.type, generated, lessonById, todayKey);
          if (hasNoLessons) {
            throw new UnprocessableEntityError('لا توجد دروس متاحة للجدولة', {
              code: 'NO_LESSONS',
              details: plan,
            });
          }
          if (hasInsufficientGlobalCapacity) {
            throw new UnprocessableEntityError('لا توجد سعة كافية لإنهاء جميع الدروس', {
              code: 'INSUFFICIENT_CAPACITY',
              details: plan,
            });
          }
          return plan;
        }

        const table = await createTableRecord(
          tx,
          userId,
          tableInput,
          range,
          schedule,
          subjectOwnerId
        );
        const persistedSessions = await savePlannedSessions(
          tx,
          userId,
          table.id,
          generated.sessions
        );
        const responseSessions = persistedSessions.map((session) => {
          const catalog = lessonById.get(session.lessonId);
          if (!catalog) throw new BadRequestError('تعذر العثور على درس في الخطة');
          return {
            id: session.id,
            order: session.order,
            dayId: session.dayId,
            studyTableId: table.id,
            subjectId: session.subjectId,
            lessonId: session.lessonId,
            date: session.date,
            subject: { id: catalog.subject.id, title: catalog.subject.title },
            lesson: {
              id: catalog.lesson.id,
              title: catalog.lesson.title,
              unit: { id: catalog.unit.id, title: catalog.unit.title },
            },
            completedAt: null,
            lateNotifiedAt: null,
            status: getStudySessionStatus(null, session.date, todayKey),
          };
        });
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
          sessions: responseSessions,
          ...(input.type === 'GLOBAL'
            ? { months: groupGlobalPlan(range.startDate, range.endDate, responseSessions) }
            : {}),
        };
      },
      { maxWait: 10_000, timeout: 30_000 }
    );
  },
};
