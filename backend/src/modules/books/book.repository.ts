// src/modules/books/book.repository.ts
import { prisma } from '../../config/prisma';

const bookSelect = {
  id: true,
  title: true,
  language: true,
  subjectId: true,
  visibility: true,
  status: true,
  progress: true,
  pageCount: true,
  failureReason: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const bookRepository = {
  // owner always; another student only for PUBLIC + ACTIVE + READY books
  findAccessible(userId: string, id: string) {
    return prisma.book.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          { visibility: 'PUBLIC', moderation: 'ACTIVE', status: 'READY' },
        ],
      },
      select: bookSelect,
    });
  },

  listByOwner(userId: string, skip: number, take: number) {
    return Promise.all([
      prisma.book.findMany({
        where: { ownerId: userId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take,
        select: bookSelect,
      }),
      prisma.book.count({ where: { ownerId: userId } }),
    ]);
  },

  listConversations(userId: string, bookId: string) {
    return prisma.aiConversation.findMany({
      where: { userId, bookId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, archivedAt: true, createdAt: true, updatedAt: true },
    });
  },

  findConversation(userId: string, bookId: string, id: string) {
    return prisma.aiConversation.findFirst({ where: { id, userId, bookId }, select: { id: true } });
  },

  async lastMessages(conversationId: string, limit: number) {
    const rows = await prisma.aiMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        role: true,
        operation: true,
        content: true,
        citedPages: true,
        startPage: true,
        endPage: true,
        createdAt: true,
      },
    });
    return rows.reverse(); // oldest first, ready to display
  },
};