import { StudyTableType } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../../utils/AppError';
import { prisma } from '../../config/prisma';
import { studyTableRepository } from './study-table.repository';
import { dateKey } from './date-time';
import { groupGlobalPlan } from './study-table.generator';
import {
  acquireUserStudyLock,
  addMonthName,
  createDays,
  dayDate,
  getSubjectTitlesForUser,
  getTimezone,
  sessionResponse,
  writeScope,
  getUpdatedRange,
} from './study-table.helpers';
import { StudyTableUpdateInput } from './study-table.schema';

export const studyTableCrudService = {
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
        ? {
            months: groupGlobalPlan(
              dateKey(table.startDate),
              dateKey(table.endDate),
              days.flatMap((day) => day.sessions)
            ),
          }
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
      const dateRangeChanged =
        range.startDate !== currentRange.startDate || range.endDate !== currentRange.endDate;

      const existingSessions = await tx.studySession.findMany({
        where: { studyTableId: tableId },
        select: { lessonId: true, subjectId: true, dayId: true },
      });
      if (input.subjects !== undefined && input.subjects !== 'ALL') {
        const outOfScope = existingSessions.filter(
          ({ subjectId }) => !input.subjects!.includes(subjectId)
        );
        if (outOfScope.length) {
          throw new BadRequestError('لا يمكن إزالة مادة مرتبطة بجلسات موجودة');
        }
      }
      const daysToRemove = dateRangeChanged
        ? await tx.studyDay.findMany({
            where: {
              studyTableId: tableId,
              OR: [
                { date: { lt: dayDate(range.startDate) } },
                { date: { gt: dayDate(range.endDate) } },
              ],
            },
            select: { id: true },
          })
        : [];
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
      const subjectUpdates =
        input.subjects === undefined
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
};
