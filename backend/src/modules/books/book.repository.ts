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

  // only the owner's own book (upload completion, delete)
  findOwned(userId: string, id: string) {
    return prisma.book.findFirst({
      where: { id, ownerId: userId },
      select: { id: true, status: true, progress: true, fileKey: true, fileSize: true },
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

  // ---------- per-student limits ----------
  countOwned(userId: string) {
    return prisma.book.count({ where: { ownerId: userId } });
  },

  countPendingUploads(userId: string, since: Date) {
    return prisma.book.count({
      where: { ownerId: userId, status: 'UPLOADING', createdAt: { gte: since } },
    });
  },

  async totalSize(userId: string): Promise<number> {
    const result = await prisma.book.aggregate({
      where: { ownerId: userId },
      _sum: { fileSize: true },
    });
    return result._sum.fileSize ?? 0;
  },

  // ---------- upload lifecycle ----------
  create(data: {
    id: string;
    title: string;
    language?: string;
    ownerId: string;
    fileKey: string;
    fileSize: number;
  }) {
    return prisma.book.create({
      data: {
        id: data.id,
        title: data.title,
        language: data.language ?? null,
        ownerId: data.ownerId,
        fileKey: data.fileKey,
        fileSize: data.fileSize,
        status: 'UPLOADING',
      },
      select: { id: true },
    });
  },

  async delete(id: string) {
    await prisma.book.deleteMany({ where: { id } });
  },

  // returns 1 if this call won the right to process the book, 0 otherwise
  async claimForProcessing(id: string): Promise<number> {
    const result = await prisma.book.updateMany({
      where: { id, status: { in: ['UPLOADING', 'FAILED'] } },
      data: { status: 'PROCESSING', progress: 0, failureReason: null },
    });
    return result.count;
  },

  setFileHash(id: string, fileHash: string) {
    return prisma.book.update({ where: { id }, data: { fileHash } });
  },

  markFailed(id: string, reason: string) {
    return prisma.book.updateMany({
      where: { id },
      data: { status: 'FAILED', failureReason: reason },
    });
  },

  // books left in PROCESSING by a server that stopped in the middle
  async failInterrupted(): Promise<number> {
    const result = await prisma.book.updateMany({
      where: { status: 'PROCESSING' },
      data: {
        status: 'FAILED',
        failureReason: 'انقطعت المعالجة بسبب إعادة تشغيل الخدمة، أعد المحاولة',
      },
    });
    return result.count;
  },

  // ---------- conversations ----------
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