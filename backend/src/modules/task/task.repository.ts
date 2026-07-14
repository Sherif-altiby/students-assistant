import { prisma } from '../../config/prisma';

export const taskRepository = {
  create(data: { title: string; frequency: 'TODAY' | 'EVERY_DAY'; userId: string }) {
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
      frequency?: 'TODAY' | 'EVERY_DAY';
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

  findCompletion(taskId: string, date: Date) {
    return prisma.completedTask.findUnique({
      where: {
        taskId_date: {
          taskId,
          date,
        },
      },
    });
  },

  createCompletion(data: { userId: string; taskId: string; date: Date }) {
    return prisma.completedTask.create({
      data,
    });
  },
};
