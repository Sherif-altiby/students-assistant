import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

export interface FindByUserIdOptions {
  page: number;
  limit: number;
  search?: string;
}

export const studyTableRepository = {
  findById(id: string, userId: string) {
    return prisma.studyTable.findFirst({
      where: { id, userId },
      include: {
        subjects: { include: { subject: true } },
        days: {
          orderBy: { date: 'asc' },
          include: {
            sessions: {
              orderBy: [{ order: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
              include: {
                subject: true,
                lesson: {
                  include: { unit: true },
                },
              },
            },
          },
        },
      },
    });
  },

  async findByUserId(userId: string, options: FindByUserIdOptions) {
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
      data,
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
};
