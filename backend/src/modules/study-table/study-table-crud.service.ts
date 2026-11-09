import { Prisma, StudyTableType } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../../utils/AppError';
import { prisma } from '../../config/prisma';
import { getSubjectAccessWhere } from '../subject/subject-access';
import { dateKey, localDateKey } from './date-time';
import { groupGlobalPlan } from './study-table.generator';
import type { StudyTablePdfData } from './pdf.service';
import {
  acquireUserStudyLock,
  addMonthName,
  createDays,
  dayDate,
  forgetLessonCompletions,
  getUserContext,
  sessionResponse,
  writeScope,
  getUpdatedRange,
} from './study-table.helpers';
import { StudyTableUpdateInput } from './study-table.schema';

export const studyTableCrudService = {
  async getMyTables(userId: string, options: { page: number; limit: number; search?: string }) {
    const where: Prisma.StudyTableWhereInput = {
      userId,
      ...(options.search?.trim()
        ? { title: { contains: options.search.trim(), mode: 'insensitive' } }
        : {}),
    };
    const [data, totalItems] = await Promise.all([
      prisma.studyTable.findMany({
        where,
        include: { subjects: { include: { subject: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      prisma.studyTable.count({ where }),
    ]);
    const totalPages = Math.ceil(totalItems / options.limit);
    return {
      data: data.map(addMonthName),
      pagination: {
        currentPage: options.page,
        totalPages,
        totalItems,
        itemsPerPage: options.limit,
        hasNextPage: options.page < totalPages,
        hasPrevPage: options.page > 1,
      },
    };
  },

  async getById(userId: string, tableId: string) {
    const userContext = await getUserContext(userId);
    const table = await prisma.studyTable.findFirst({
      where: { id: tableId, userId },
      select: {
        id: true,
        title: true,
        type: true,
        startDate: true,
        endDate: true,
        month: true,
        year: true,
        allSubjects: true,
        selectedLessonIds: true,
        studyWeekdays: true,
        maxSessionsPerDay: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        subjects: {
          where:
            userContext.subjectOwnerId === undefined
              ? {}
              : { subject: getSubjectAccessWhere(userContext.subjectOwnerId) },
          select: {
            id: true,
            studyTableId: true,
            subjectId: true,
            createdAt: true,
            subject: { select: { id: true, title: true, createdAt: true } },
          },
        },
        days: {
          orderBy: { date: 'asc' },
          select: {
            id: true,
            date: true,
            studyTableId: true,
            createdAt: true,
            sessions: {
              where:
                userContext.subjectOwnerId === undefined
                  ? {}
                  : { subject: getSubjectAccessWhere(userContext.subjectOwnerId) },
              orderBy: [{ order: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
              select: {
                id: true,
                order: true,
                dayId: true,
                studyTableId: true,
                subjectId: true,
                lessonId: true,
                completedAt: true,
                lateNotifiedAt: true,
                subject: { select: { id: true, title: true } },
                lesson: {
                  select: {
                    id: true,
                    title: true,
                    unit: { select: { id: true, title: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!table) throw new NotFoundError('جدول المذاكرة غير موجود');
    const { timezone } = userContext;
    const todayKey = localDateKey(new Date(), timezone);
    const days = table.days.map((day) => ({
      id: day.id,
      date: dateKey(day.date),
      studyTableId: day.studyTableId,
      createdAt: day.createdAt,
      sessions: day.sessions.map((session) =>
        sessionResponse(session, dateKey(day.date), todayKey)
      ),
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

  async getPdfData(userId: string, tableId: string): Promise<StudyTablePdfData> {
    const { subjectOwnerId } = await getUserContext(userId);
    const table = await prisma.studyTable.findFirst({
      where: { id: tableId, userId },
      select: {
        title: true,
        type: true,
        startDate: true,
        endDate: true,
        days: {
          orderBy: { date: 'asc' },
          select: {
            date: true,
            sessions: {
              where:
                subjectOwnerId === undefined
                  ? {}
                  : { subject: getSubjectAccessWhere(subjectOwnerId) },
              orderBy: [{ order: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
              select: {
                order: true,
                subject: { select: { title: true } },
                lesson: {
                  select: {
                    title: true,
                    unit: { select: { id: true, title: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!table) throw new NotFoundError('جدول المذاكرة غير موجود');
    const days = table.days.map((day) => ({
      date: dateKey(day.date),
      sessions: day.sessions.map((session) => ({
        ...session,
        date: dateKey(day.date),
      })),
    }));
    const sessions = days.flatMap(({ sessions: daySessions }) => daySessions);
    return {
      ...table,
      days,
      months:
        table.type === StudyTableType.GLOBAL
          ? groupGlobalPlan(dateKey(table.startDate), dateKey(table.endDate), sessions)
          : [],
    };
  },

  async update(userId: string, tableId: string, input: StudyTableUpdateInput) {
    const { timezone, subjectOwnerId } = await getUserContext(userId);
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

      if (input.subjects !== undefined && input.subjects !== 'ALL') {
        const outOfScopeCount = await tx.studySession.count({
          where: {
            studyTableId: tableId,
            subjectId: { notIn: input.subjects },
          },
        });
        if (outOfScopeCount > 0) {
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
        await tx.studyDay.deleteMany({ where: { id: { in: removedDayIds } } });
        await forgetLessonCompletions(
          tx,
          userId,
          removedSessions.map(({ lessonId }) => lessonId)
        );
      }
      const subjectUpdates =
        input.subjects === undefined
          ? {}
          : await writeScope(tx, tableId, input.subjects, subjectOwnerId);
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
      await tx.studyTable.delete({ where: { id: tableId } });
      await forgetLessonCompletions(
        tx,
        userId,
        sessions.map(({ lessonId }) => lessonId)
      );
    });
  },
};
