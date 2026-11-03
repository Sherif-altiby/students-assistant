import { ConflictError, BadRequestError, NotFoundError } from '../../utils/AppError';
import { prisma } from '../../config/prisma';
import { dateKey } from './date-time';
import {
  acquireUserStudyLock,
  assertLessonSubject,
  assertSubjectScope,
  dayDate,
  getSessionCompletionUpdate,
  getSubjectTitlesForUser,
  getTimezone,
  reindexDay,
  reorderDay,
  sessionInclude,
  sessionResponse,
} from './study-table.helpers';
import { SessionInput, SessionReplaceInput } from './study-table.schema';

export const studyTableSessionsService = {
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
        subjectTitles
      );
      await assertLessonSubject(tx, lessonId, subjectId);
      if (lessonId !== current.lessonId) {
        const duplicate = await tx.studySession.findFirst({
          where: { studyTableId: current.studyTableId, lessonId, id: { not: current.id } },
          select: { id: true },
        });
        if (duplicate) throw new ConflictError('لا يمكن إضافة الدرس نفسه أكثر من مرة إلى الجدول');
        await tx.studyLessonCompletion.deleteMany({
          where: { userId, lessonId: current.lessonId },
        });
      }
      const order =
        input.order ??
        (targetDay.id === current.dayId
          ? current.order
          : await tx.studySession.count({ where: { dayId: targetDay.id } }));
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
          subjectTitles
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
      const completionByLesson = new Map(
        existing.map(({ lessonId, completedAt }) => [lessonId, completedAt])
      );
      const orderedInputs = inputs
        .map((input, index) => ({ input, index }))
        .sort(
          (a, b) => (a.input.order ?? a.index) - (b.input.order ?? b.index) || a.index - b.index
        );
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
          create: {
            userId,
            lessonId: current.lessonId,
            completedAt: completionUpdate.completedAt!,
          },
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
};
