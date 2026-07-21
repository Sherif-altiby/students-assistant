import { ReactionType } from '@prisma/client';
import { prisma } from '../../config/prisma';

const messageInclude = {
  user: { select: { id: true, name: true } },
  replyTo: {
    select: {
      id: true,
      content: true,
      user: { select: { id: true, name: true } },
    },
  },
  reactions: { select: { id: true, type: true, userId: true } },
} as const;

export const chatRepository = {
  createMessage(data: { userId: string; content: string; replyToId?: string }) {
    return prisma.message.create({
      data,
      include: messageInclude,
    });
  },

  findMessageById(id: string) {
    return prisma.message.findUnique({ where: { id } });
  },

  getHistory(cursor?: string, limit = 30) {
    return prisma.message.findMany({
      take: limit,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      orderBy: { createdAt: 'desc' },
      include: messageInclude,
    });
  },

  upsertReaction(userId: string, messageId: string, type: ReactionType) {
    return prisma.reaction.upsert({
      where: { userId_messageId: { userId, messageId } },
      update: { type },
      create: { userId, messageId, type },
    });
  },

  removeReaction(userId: string, messageId: string) {
    return prisma.reaction.delete({
      where: { userId_messageId: { userId, messageId } },
    });
  },

  findReaction(userId: string, messageId: string) {
    return prisma.reaction.findUnique({
      where: { userId_messageId: { userId, messageId } },
    });
  },
};
