// src/modules/doctor-chat/doctor-chat.mapper.ts
import type { ChatListRow, ChatRow, MessageRow } from './doctor-chat.repository';
import type {
  ChatUser,
  DoctorChatDetail,
  DoctorChatListItem,
  DoctorChatMessageDto,
  ReactionType,
} from './doctor-chat.types';

function otherUserOf(chat: ChatRow | ChatListRow, userId: string): ChatUser {
  return chat.doctorId === userId
    ? { ...chat.student, role: 'STUDENT' }
    : { ...chat.doctor, role: 'DOCTOR' };
}

export const toMessage = (m: MessageRow): DoctorChatMessageDto => ({
  id: m.id,
  chatId: m.chatId,
  senderId: m.senderId,
  content: m.content,
  createdAt: m.createdAt,
  deliveredAt: m.deliveredAt,
  readAt: m.readAt,
  sender: m.sender,
  replyTo: m.replyTo
    ? {
        id: m.replyTo.id,
        content: m.replyTo.content,
        sender: m.replyTo.sender,
      }
    : null,
  reactions: m.reactions.map((r) => ({
    id: r.id,
    type: r.type as ReactionType,
    userId: r.userId,
  })),
});

export const toChatListItem = (chat: ChatListRow, userId: string): DoctorChatListItem => ({
  id: chat.id,
  otherUser: otherUserOf(chat, userId),
  lastMessage: chat.messages[0] ?? null,
  lastMessageAt: chat.lastMessageAt,
  unreadCount: chat._count.messages,
});

export const toChatDetail = (chat: ChatRow, userId: string, canSend: boolean): DoctorChatDetail => ({
  id: chat.id,
  otherUser: otherUserOf(chat, userId),
  canSend,
});