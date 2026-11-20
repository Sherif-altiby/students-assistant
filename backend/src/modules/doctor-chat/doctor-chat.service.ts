// src/modules/doctor-chat/doctor-chat.service.ts
import { ForbiddenError, NotFoundError } from '../../utils/AppError';
import { doctorChatRepository as repo, type ChatRow } from './doctor-chat.repository';
import { CHAT_BOOKING_STATUSES, isParticipant, otherParticipantId } from './doctor-chat.policy';
import { toChatDetail, toChatListItem, toMessage } from './doctor-chat.mapper';
import type { MessagesPage, ReactionType } from './doctor-chat.types';

async function requireChat(userId: string, chatId: string): Promise<ChatRow> {
  const chat = await repo.findChatForUser(chatId, userId);
  if (!chat) throw new NotFoundError('المحادثة غير موجودة');
  return chat;
}

const isWritable = (chat: ChatRow) =>
  repo.hasEligibleBooking(chat.doctorId, chat.studentId, CHAT_BOOKING_STATUSES);

export const doctorChatService = {
  async openFromBooking(userId: string, bookingId: string) {
    const booking = await repo.findBookingParties(bookingId);
    const parties = booking && { doctorId: booking.slot.doctorId, studentId: booking.userId };
    if (!booking || !parties || !isParticipant(parties, userId)) {
      throw new NotFoundError('الحجز غير موجود');
    }
    if (!CHAT_BOOKING_STATUSES.includes(booking.status)) {
      throw new ForbiddenError('لا يمكن بدء محادثة لهذا الحجز');
    }
    const chat = await repo.upsertChat(parties.doctorId, parties.studentId);
    return { chatId: chat.id };
  },

  async listChats(userId: string) {
    const chats = await repo.listForUser(userId);
    return chats.map((chat) => toChatListItem(chat, userId));
  },

  async getChat(userId: string, chatId: string) {
    const chat = await requireChat(userId, chatId);
    return toChatDetail(chat, userId, await isWritable(chat));
  },

  async listMessages(userId: string, chatId: string, limit: number, before?: string): Promise<MessagesPage> {
    await requireChat(userId, chatId);
    const rows = await repo.findMessages(chatId, limit + 1, before);
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const oldest = page.at(-1);
    return {
      messages: page.reverse().map(toMessage),
      nextCursor: hasMore && oldest ? oldest.id : null,
    };
  },

  async sendMessage(userId: string, chatId: string, content: string, replyToId?: string | null) {
    const chat = await requireChat(userId, chatId);
    if (!(await isWritable(chat))) {
      throw new ForbiddenError('هذه المحادثة للقراءة فقط');
    }

    // Guard: replyToId must be a message in the same chat
    if (replyToId) {
      const parent = await repo.findMessageById(replyToId);
      if (!parent || parent.chatId !== chatId) {
        throw new NotFoundError('الرسالة المُرد عليها غير موجودة');
      }
    }

    const message = await repo.createMessage(chatId, userId, content, replyToId);
    return {
      message: toMessage(message),
      recipientId: otherParticipantId(chat, userId),
    };
  },

  // NEW: toggle a reaction on a message. Same user + same message = replace,
  // same user + same type = remove (toggle off).
  async reactToMessage(userId: string, chatId: string, messageId: string, type: ReactionType) {
    const chat = await requireChat(userId, chatId);
    if (!(await isWritable(chat))) {
      throw new ForbiddenError('هذه المحادثة للقراءة فقط');
    }

    const message = await repo.findMessageById(messageId);
    if (!message || message.chatId !== chatId) {
      throw new NotFoundError('الرسالة غير موجودة');
    }

    // We need the current reaction to decide toggle semantics
    const existing = await repo.findReaction(messageId, userId);
    if (existing?.type === type) {
      await repo.deleteReaction(messageId, userId);
      return { messageId, userId, type: null as ReactionType | null };
    }

    const saved = await repo.upsertReaction(messageId, userId, type);
    return {
      messageId,
      userId,
      type: saved.type as ReactionType,
      id: saved.id,
    };
  },

  async markDelivered(userId: string, chatId: string): Promise<void> {
    await requireChat(userId, chatId);
    await repo.markDelivered(chatId, userId);
  },

  async markRead(userId: string, chatId: string): Promise<void> {
    await requireChat(userId, chatId);
    await repo.markRead(chatId, userId);
  },
};