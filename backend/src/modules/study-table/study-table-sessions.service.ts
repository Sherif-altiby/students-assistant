import { ConflictError, BadRequestError, NotFoundError } from '../../utils/AppError';
import { prisma } from '../../config/prisma';
import { dateKey, localDateKey } from './date-time';
import {
  acquireUserStudyLock,
  assertSessionReferences,
  dayDate,
  forgetLessonCompletions,
  getSessionCompletionUpdate,
  getUserContext,
  reindexDay,
  reorderDay,
  sessionInclude,
  sessionResponse,
  updateSessionAssignments,
} from './study-table.helpers';
import { SessionInput, SessionReplaceInput } from './study-table.schema';

export const studyTableSessionsService = {
  async createSession(userId: string, tableId: string, input: SessionInput) {
    const { timezone, subjectOwnerId } = await getUserContext(userId);
    const todayKey = localDateKey(new Date(), timezone);
    return prisma.$transaction(async (tx) => {
      await acquireUserStudyLock(tx, userId);
      const table = await tx.studyTable.findFirst({
        where: { id: tableId, userId },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          allSubjects: true,
          selectedLessonIds: true,
        },
      });
      if (!table) throw new NotFoundError('جدول المذاكرة غير موجود');
      if (input.date && input.dayId) throw new BadRequestError('حدد اليوم أو التاريخ وليس كليهما');
      const day = input.dayId
        ? await tx.studyDay.findFirst({ where: { id: input.dayId, studyTableId: tableId } })
        : input.date
          ? await tx.studyDay.findUnique({
              where: {
                studyTableId_date: { studyTableId: tableId, date: dayDate(input.date) },
              },
            })
          : null;
      if (!day) throw new BadRequestError('يوم المذاكرة غير موجود في الجدول');
      await assertSessionReferences(
        tx,
        table.id,
        table.allSubjects,
        table.selectedLessonIds,
        [input],
        subjectOwnerId
      );
      const duplicate = await tx.studySession.findFirst({
        where: { studyTableId: tableId, lessonId: input.lessonId },
        select: { id: true },
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
      const finalOrder =
        input.order === undefined ? count : await reorderDay(tx, day.id, session.id, input.order);
      return sessionResponse({ ...session, order: finalOrder }, dateKey(day.date), todayKey);
    });
  },

  async updateSession(userId: string, sessionId: string, input: Partial<SessionInput>) {
    const { timezone, subjectOwnerId } = await getUserContext(userId);
    const todayKey = localDateKey(new Date(), timezone);
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
      await assertSessionReferences(
        tx,
        current.studyTableId,
        current.studyTable.allSubjects,
        current.studyTable.selectedLessonIds,
        [{ subjectId, lessonId }],
        subjectOwnerId
      );
      if (lessonId !== current.lessonId) {
        const duplicate = await tx.studySession.findFirst({
          where: { studyTableId: current.studyTableId, lessonId, id: { not: current.id } },
          select: { id: true },
        });
        if (duplicate) throw new ConflictError('لا يمكن إضافة الدرس نفسه أكثر من مرة إلى الجدول');
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
      if (lessonId !== current.lessonId) {
        await forgetLessonCompletions(tx, userId, [current.lessonId]);
      }
      const normalizedOrder = await reorderDay(tx, targetDay.id, session.id, order);
      if (targetDay.id !== current.dayId) await reindexDay(tx, current.dayId);
      return sessionResponse(
        { ...session, order: normalizedOrder },
        dateKey(targetDay.date),
        todayKey
      );
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
      await tx.studySession.delete({ where: { id: session.id } });
      await forgetLessonCompletions(tx, userId, [session.lessonId]);
      await reindexDay(tx, session.dayId);
    });
  },

  async replaceDaySessions(userId: string, dayId: string, inputs: SessionReplaceInput[]) {
    const { timezone, subjectOwnerId } = await getUserContext(userId);
    const todayKey = localDateKey(new Date(), timezone);
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
      await assertSessionReferences(
        tx,
        day.studyTableId,
        day.studyTable.allSubjects,
        day.studyTable.selectedLessonIds,
        inputs,
        subjectOwnerId
      );
      const existing = await tx.studySession.findMany({
        where: { dayId },
        select: {
          id: true,
          order: true,
          lessonId: true,
          subjectId: true,
          completedAt: true,
          lateNotifiedAt: true,
        },
      });
      const existingByLesson = new Map(existing.map((session) => [session.lessonId, session]));
      const orderedInputs = inputs
        .map((input, index) => ({ input, index }))
        .sort(
          (a, b) => (a.input.order ?? a.index) - (b.input.order ?? b.index) || a.index - b.index
        );
      const retainedLessonIds = new Set(lessonIds);
      const removedSessions = existing.filter(({ lessonId }) => !retainedLessonIds.has(lessonId));
      if (removedSessions.length) {
        await tx.studySession.deleteMany({
          where: { id: { in: removedSessions.map(({ id }) => id) } },
        });
      }
      const newSessions = [];
      const retainedUpdates = [];
      for (const [order, { input }] of orderedInputs.entries()) {
        const current = existingByLesson.get(input.lessonId);
        if (current) {
          retainedUpdates.push({
            id: current.id,
            subjectId: input.subjectId,
            order,
            currentSubjectId: current.subjectId,
            currentOrder: current.order,
          });
        } else {
          newSessions.push({
            userId,
            studyTableId: day.studyTableId,
            dayId,
            subjectId: input.subjectId,
            lessonId: input.lessonId,
            order,
          });
        }
      }
      await updateSessionAssignments(tx, retainedUpdates);
      if (newSessions.length) await tx.studySession.createMany({ data: newSessions });
      await forgetLessonCompletions(
        tx,
        userId,
        removedSessions.map(({ lessonId }) => lessonId)
      );
      const rows = await tx.studySession.findMany({
        where: { dayId },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        include: sessionInclude,
      });
      return rows.map((session) => sessionResponse(session, dateKey(day.date), todayKey));
    });
  },

  async completeSession(userId: string, sessionId: string, completed: boolean) {
    const { timezone } = await getUserContext(userId);
    const todayKey = localDateKey(new Date(), timezone);
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
      if (completionUpdate.completedAt !== null) {
        await tx.studyLessonCompletion.upsert({
          where: { userId_lessonId: { userId, lessonId: current.lessonId } },
          create: {
            userId,
            lessonId: current.lessonId,
            completedAt: completionUpdate.completedAt,
          },
          update: { completedAt: completionUpdate.completedAt },
        });
      } else {
        await forgetLessonCompletions(tx, userId, [current.lessonId]);
      }
      return sessionResponse(updated, dateKey(current.day.date), todayKey);
    });
  },
};
