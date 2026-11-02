// src/modules/lesson-date/lesson-date.repository.ts

import { prisma } from '../../config/prisma';
import { DayOfWeek } from '@prisma/client';

export const lessonDateRepository = {
  createForDays(data: Array<{
    subject: string;
    teacher: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    userId: string;
  }>) {
    return prisma.$transaction(async (tx) => {
      const firstLesson = data.at(0);
      if (!firstLesson) throw new Error('At least one lesson day is required');
      const { userId } = firstLesson;
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${userId})::bigint) IS NULL`;

      for (const lesson of data) {
        const conflict = await tx.lessonDate.findFirst({
          where: {
            userId,
            dayOfWeek: lesson.dayOfWeek,
            startTime: { lt: lesson.endTime },
            endTime: { gt: lesson.startTime },
          },
        });
        if (conflict) return { status: 'conflict' as const, conflict };
      }

      const lessons = await Promise.all(
        data.map((lesson) => tx.lessonDate.create({ data: lesson })),
      );
      return { status: 'created' as const, lessons };
    });
  },

  findById(id: string) {
    return prisma.lessonDate.findUnique({ where: { id } });
  },

  findByUserId(userId: string) {
    return prisma.lessonDate.findMany({
      where: { userId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  },

  updateWithConflictCheck(params: {
    id: string;
    userId: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    data: Partial<{
      subject: string;
      teacher: string;
      dayOfWeek: DayOfWeek;
      startTime: string;
      endTime: string;
    }>;
  }) {
    return prisma.$transaction(async (tx) => {
      const { id, userId, dayOfWeek, startTime, endTime, data } = params;
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${userId})::bigint) IS NULL`;

      const conflict = await tx.lessonDate.findFirst({
        where: {
          userId,
          dayOfWeek,
          id: { not: id },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      });
      if (conflict) return { status: 'conflict' as const, conflict };

      const lesson = await tx.lessonDate.update({ where: { id }, data });
      return { status: 'updated' as const, lesson };
    });
  },

  delete(id: string) {
    return prisma.lessonDate.delete({ where: { id } });
  },

};