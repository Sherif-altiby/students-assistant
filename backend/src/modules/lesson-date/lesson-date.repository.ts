// src/modules/lesson-date/lesson-date.repository.ts

import { prisma } from '../../config/prisma';
import { DayOfWeek } from '@prisma/client';

export const lessonDateRepository = {
  create(data: {
    subject: string;
    teacher: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    userId: string;
  }) {
    return prisma.lessonDate.create({ data });
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

  update(
    id: string,
    data: Partial<{
      subject: string;
      teacher: string;
      dayOfWeek: DayOfWeek;
      startTime: string;
      endTime: string;
    }>
  ) {
    return prisma.lessonDate.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.lessonDate.delete({ where: { id } });
  },

  // Finds an existing lesson for this user, on the same day, whose time
  // range overlaps [startTime, endTime). Relies on startTime/endTime being
  // zero-padded "HH:mm" strings, which sort/compare correctly as text.
  // Standard interval-overlap test: A overlaps B iff A.start < B.end AND B.start < A.end.
  findConflicting(params: {
    userId: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    excludeId?: string;
  }) {
    const { userId, dayOfWeek, startTime, endTime, excludeId } = params;

    return prisma.lessonDate.findFirst({
      where: {
        userId,
        dayOfWeek,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });
  },
};