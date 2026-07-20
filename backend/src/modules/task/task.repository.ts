// src/modules/task/task.repository.ts

import { prisma } from '../../config/prisma';
import { TaskFrequency } from '@prisma/client';

export const taskRepository = {
  create(data: { title: string; frequency: TaskFrequency; userId: string }) {
    return prisma.task.create({
      data,
    });
  },

  findById(id: string) {
    return prisma.task.findUnique({
      where: {
        id,
      },
    });
  },

  findByUserId(userId: string) {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.task.findMany({
      where: {
        userId,
        OR: [
          {
            frequency: 'EVERY_DAY',
          },
          {
            frequency: 'TODAY',
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  update(
    id: string,
    data: {
      title?: string;
      frequency?: TaskFrequency;
    }
  ) {
    return prisma.task.update({
      where: {
        id,
      },
      data,
    });
  },

  delete(id: string) {
    return prisma.task.delete({
      where: {
        id,
      },
    });
  },

  // Task History methods
  findHistoryByTaskAndDate(taskId: string, date: Date) {
    return prisma.taskHistory.findUnique({
      where: {
        taskId_date: {
          taskId,
          date,
        },
      },
    });
  },

  createHistory(data: {
    userId: string;
    taskId: string;
    date: Date;
    taskTitle: string;
    taskFrequency: TaskFrequency;
  }) {
    return prisma.taskHistory.create({
      data: {
        ...data,
        completedAt: new Date(),
      },
    });
  },

  getHistoryByDate(userId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.taskHistory.findMany({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        task: true,
      },
      orderBy: {
        completedAt: 'asc',
      },
    });
  },

  getHistoryDays(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    return prisma.taskHistory.groupBy({
      by: ['date'],
      where: {
        userId,
      },
      _count: {
        taskId: true,
      },
      _min: {
        completedAt: true,
      },
      _max: {
        completedAt: true,
      },
      orderBy: {
        date: 'desc',
      },
      skip,
      take: limit,
    });
  },

  async getHistoryDaysCount(userId: string) {
    const result = await prisma.taskHistory.groupBy({
      by: ['date'],
      where: {
        userId,
      },
      _count: {
        taskId: true,
      },
    });

    return result.length;
  },

  getHistoryByDateRange(userId: string, startDate: Date, endDate: Date) {
    return prisma.taskHistory.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        task: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
  },

  deleteHistoryByTaskId(taskId: string) {
    return prisma.taskHistory.deleteMany({
      where: {
        taskId,
      },
    });
  },

  getTaskHistory(taskId: string) {
    return prisma.taskHistory.findMany({
      where: {
        taskId,
      },
      orderBy: {
        date: 'desc',
      },
    });
  },

  getCompletedTasksByIds(taskIds: string[]) {
    return prisma.task.findMany({
      where: {
        id: {
          in: taskIds,
        },
      },
    });
  },

  getHistoryDayWithTasks(userId: string, date: Date) {
    // Create date objects in local timezone
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    // Start of day in local timezone
    const startOfDay = new Date(year, month, day, 0, 0, 0, 0);

    // End of day in local timezone
    const endOfDay = new Date(year, month, day, 23, 59, 59, 999);

    return prisma.taskHistory.findMany({
      where: {
        userId,
        completedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        task: true,
      },
      orderBy: {
        completedAt: 'asc',
      },
    });
  },

  findFirstTaskDate(userId: string) {
    return prisma.task.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });
  },

  getProgressHistory(userId: string, fromDate: Date) {
    return prisma.taskHistory.findMany({
      where: {
        userId,
        date: { gte: fromDate },
      },
      select: {
        date: true,
        taskFrequency: true,
      },
      orderBy: { date: 'asc' },
    });
  },

  getDistinctHistoryDates(userId: string) {
    return prisma.taskHistory.findMany({
      where: { userId },
      select: { date: true },
      distinct: ['date'],
      orderBy: { date: 'asc' },
    });
  },
};
