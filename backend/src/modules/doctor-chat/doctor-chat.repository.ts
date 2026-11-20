// src/modules/doctor-chat/doctor-chat.repository.ts
import type { BookingStatus, ReactionType } from '@prisma/client';
import { prisma } from '../../config/prisma';

const userSelect = { id: true, name: true } as const;

const messageSelect = {
  id: true,
  chatId: true,
  senderId: true,
  content: true,
  createdAt: true,
  deliveredAt: true,
  readAt: true,
  sender: { select: userSelect },
  replyTo: {
    select: {
      id: true,
      content: true,
      sender: { select: userSelect },
    },
  },
  reactions: {
    select: { id: true, type: true, userId: true },
  },
} as const;

const chatSelect = {
  id: true,
  doctorId: true,
  studentId: true,
  doctor: { select: userSelect },
  student: { select: userSelect },
} as const;

const participantFilter = (userId: string) => ({
  OR: [{ doctorId: userId }, { studentId: userId }],
});

export const doctorChatRepository = {
  findBookingParties(bookingId: string) {
    return prisma.sessionBooking.findUnique({
      where: { id: bookingId },
      select: { userId: true, status: true, slot: { select: { doctorId: true } } },
    });
  },

  async hasEligibleBooking(
    doctorId: string,
    studentId: string,
    statuses: readonly BookingStatus[],
  ): Promise<boolean> {
    const count = await prisma.sessionBooking.count({
      where: { userId: studentId, status: { in: [...statuses] }, slot: { doctorId } },
    });
    return count > 0;
  },

  upsertChat(doctorId: string, studentId: string) {
    return prisma.doctorChat.upsert({
      where: { doctorId_studentId: { doctorId, studentId } },
      create: { doctorId, studentId },
      update: {},
      select: { id: true },
    });
  },

  findChatForUser(chatId: string, userId: string) {
    return prisma.doctorChat.findFirst({
      where: { id: chatId, ...participantFilter(userId) },
      select: chatSelect,
    });
  },

  listForUser(userId: string, take = 100) {
    return prisma.doctorChat.findMany({
      where: participantFilter(userId),
      orderBy: [{ lastMessageAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
      take,
      select: {
        ...chatSelect,
        lastMessageAt: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, senderId: true, createdAt: true },
        },
        _count: {
          select: { messages: { where: { readAt: null, senderId: { not: userId } } } },
        },
      },
    });
  },

  findMessages(chatId: string, take: number, before?: string) {
    return prisma.doctorChatMessage.findMany({
      where: { chatId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
      ...(before ? { cursor: { id: before }, skip: 1 } : {}),
      select: messageSelect,
    });
  },

  // NEW: used by the reaction handler to verify the message belongs to the chat
  findMessageById(messageId: string) {
    return prisma.doctorChatMessage.findUnique({
      where: { id: messageId },
      select: { id: true, chatId: true },
    });
  },

  async createMessage(
    chatId: string,
    senderId: string,
    content: string,
    replyToId?: string | null,
  ) {
    const now = new Date();
    const [message] = await prisma.$transaction([
      prisma.doctorChatMessage.create({
        data: { chatId, senderId, content, replyToId: replyToId ?? null, createdAt: now },
        select: messageSelect,
      }),
      prisma.doctorChat.update({ where: { id: chatId }, data: { lastMessageAt: now } }),
    ]);
    return message;
  },

  // NEW: upsert a reaction (same user, same message = replace type)
  upsertReaction(messageId: string, userId: string, type: ReactionType) {
    return prisma.doctorChatReaction.upsert({
      where: { messageId_userId: { messageId, userId } },
      create: { messageId, userId, type },
      update: { type },
      select: { id: true, type: true, userId: true },
    });
  },

  deleteReaction(messageId: string, userId: string) {
    return prisma.doctorChatReaction.deleteMany({
      where: { messageId, userId },
    });
  },


  findReaction(messageId: string, userId: string) {
    return prisma.doctorChatReaction.findUnique({
      where: { messageId_userId: { messageId, userId } },
      select: { id: true, type: true },
    });
  },

  markDelivered(chatId: string, recipientId: string) {
    return prisma.doctorChatMessage.updateMany({
      where: { chatId, senderId: { not: recipientId }, deliveredAt: null },
      data: { deliveredAt: new Date() },
    });
  },

  markRead(chatId: string, readerId: string) {
    const now = new Date();
    return prisma.doctorChatMessage.updateMany({
      where: { chatId, senderId: { not: readerId }, readAt: null },
      data: { readAt: now, deliveredAt: now },
    });
  },
};

export type ChatRow = NonNullable<Awaited<ReturnType<typeof doctorChatRepository.findChatForUser>>>;
export type ChatListRow = Awaited<ReturnType<typeof doctorChatRepository.listForUser>>[number];
export type MessageRow = Awaited<ReturnType<typeof doctorChatRepository.findMessages>>[number];