// src/modules/doctor-chat/doctor-chat.socket.ts
import { Server, Socket } from "socket.io";
import { doctorChatService } from "./doctor-chat.service";
import { sendDoctorChatMessageSchema } from "./doctor-chat.schema";
import { toggleReactionSchema } from "./doctor-chat.validation";

export const DOCTOR_CHAT_EVENTS = {
  MESSAGE_SEND: "doctor-chat:message:send",
  MESSAGE_NEW: "doctor-chat:message:new",
  REACTION_ADD: "doctor-chat:reaction:add",           // client → server
  REACTION_UPDATED: "doctor-chat:reaction:updated",   // server → room
  MESSAGE_DELIVERED: "doctor-chat:message:delivered",
  MESSAGE_READ: "doctor-chat:message:read",
  DELIVERED_UPDATED: "doctor-chat:delivered:updated",
  READ_UPDATED: "doctor-chat:read:updated",
  ERROR: "doctor-chat:error",
  JOIN: "doctor-chat:join",
  LEAVE: "doctor-chat:leave",
} as const;

interface Ack {
  success: boolean;
  data?: unknown;
  message?: string;
}

export function registerDoctorChatHandlers(io: Server, socket: Socket) {
  // ── Send ──────────────────────────────────────────────
  socket.on(DOCTOR_CHAT_EVENTS.MESSAGE_SEND, async (payload, ack?: (res: Ack) => void) => {
    try {
      const dto = sendDoctorChatMessageSchema.parse(payload);
      const { chatId } = payload as { chatId?: string };

      if (!chatId) {
        ack?.({ success: false, message: "chatId is required" });
        return;
      }

      const senderId = socket.data.userId as string | undefined;
      if (!senderId) {
        ack?.({ success: false, message: "Unauthorized" });
        return;
      }

      const { message } = await doctorChatService.sendMessage(
        senderId,
        chatId,
        dto.content,
        dto.replyToId,
      );
      
      io.to(`chat:${chatId}`).emit(DOCTOR_CHAT_EVENTS.MESSAGE_NEW, message);
      ack?.({ success: true, data: message });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      ack?.({ success: false, message: errorMessage });
      socket.emit(DOCTOR_CHAT_EVENTS.ERROR, { message: errorMessage });
    }
  });

  // ── Delivered ─────────────────────────────────────────
  socket.on(DOCTOR_CHAT_EVENTS.MESSAGE_DELIVERED, async (chatId: string, ack?: (res: Ack) => void) => {
    try {
      const userId = socket.data.userId as string | undefined;
      if (!userId || !chatId) {
        ack?.({ success: false, message: "Unauthorized or missing chatId" });
        return;
      }

      await doctorChatService.markDelivered(userId, chatId);

      // Tell the room — the sender's ✓ flips to ✓✓
      io.to(`chat:${chatId}`).emit(DOCTOR_CHAT_EVENTS.DELIVERED_UPDATED, {
        chatId,
        deliveredAt: new Date().toISOString(),
        by: userId,
      });
      ack?.({ success: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      ack?.({ success: false, message: errorMessage });
    }
  });

  // ── Read ──────────────────────────────────────────────
  socket.on(DOCTOR_CHAT_EVENTS.MESSAGE_READ, async (chatId: string, ack?: (res: Ack) => void) => {
    try {
      const userId = socket.data.userId as string | undefined;
      if (!userId || !chatId) {
        ack?.({ success: false, message: "Unauthorized or missing chatId" });
        return;
      }

      await doctorChatService.markRead(userId, chatId);

      // Tell the room — the sender's ✓✓ flips to blue
      io.to(`chat:${chatId}`).emit(DOCTOR_CHAT_EVENTS.READ_UPDATED, {
        chatId,
        readAt: new Date().toISOString(),
        by: userId,
      });
      ack?.({ success: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      ack?.({ success: false, message: errorMessage });
    }
  });

  // ── Room ──────────────────────────────────────────────
  socket.on(DOCTOR_CHAT_EVENTS.JOIN, (chatId: string) => {
    if (chatId) socket.join(`chat:${chatId}`);
  });

  socket.on(DOCTOR_CHAT_EVENTS.LEAVE, (chatId: string) => {
    if (chatId) socket.leave(`chat:${chatId}`);
  });

  socket.on(DOCTOR_CHAT_EVENTS.REACTION_ADD, async (payload, ack?: (res: Ack) => void) => {
    try {
      const { messageId, type } = toggleReactionSchema.parse(payload);
      const { chatId } = payload as { chatId?: string };
      const userId = socket.data.userId as string | undefined;

      if (!chatId || !userId) {
        ack?.({ success: false, message: "chatId or user missing" });
        return;
      }

      const result = await doctorChatService.reactToMessage(userId, chatId, messageId, type);

      io.to(`chat:${chatId}`).emit(DOCTOR_CHAT_EVENTS.REACTION_UPDATED, {
        messageId: result.messageId,
        userId: result.userId,
        type: result.type,
        chatId,
      });
      ack?.({ success: true, data: result });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      ack?.({ success: false, message: errorMessage });
      socket.emit(DOCTOR_CHAT_EVENTS.ERROR, { message: errorMessage });
    }
  });
}