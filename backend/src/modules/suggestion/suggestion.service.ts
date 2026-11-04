import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import type { CreateSuggestionInput } from './suggestion.schema';

export const suggestionService = {
  create(userId: string, input: CreateSuggestionInput) {
    return prisma.suggestion.create({
      data: { userId, message: input.message },
      select: { id: true, message: true, createdAt: true },
    });
  },

  async list(params: { page: number; limit: number; search?: string }) {
    const where: Prisma.SuggestionWhereInput = params.search
      ? { message: { contains: params.search, mode: 'insensitive' } }
      : {};
    const [suggestions, total] = await Promise.all([
      prisma.suggestion.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          message: true,
          createdAt: true,
          user: { select: { name: true, email: true, role: true } },
        },
      }),
      prisma.suggestion.count({ where }),
    ]);

    return { suggestions, total, page: params.page, limit: params.limit };
  },
};
