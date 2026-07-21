import { Server, Socket } from "socket.io";
import { chatService } from "./chat.service";
import { sendMessageSchema, reactSchema } from "./chat.schema";
import { CHAT_EVENTS } from "./chat.events";

const ROOM = "general";

export function registerChatHandlers(io: Server, socket: Socket) {
  socket.join(ROOM);

  socket.on(CHAT_EVENTS.MESSAGE_SEND, async (payload, ack?: (res: unknown) => void) => {
    try {
      const dto = sendMessageSchema.parse(payload);
      const message = await chatService.sendMessage({
        userId: socket.data.userId,
        content: dto.content,
        replyToId: dto.replyToId,
      });

      io.to(ROOM).emit(CHAT_EVENTS.MESSAGE_NEW, message);
      ack?.({ success: true, data: message });
    } catch (err) {
      handleSocketError(socket, ack, err);
    }
  });

  socket.on(CHAT_EVENTS.REACTION_ADD, async (payload, ack?: (res: unknown) => void) => {
    try {
      const dto = reactSchema.parse(payload);
      const result = await chatService.react({
        userId: socket.data.userId,
        messageId: dto.messageId,
        type: dto.type,
      });

      io.to(ROOM).emit(CHAT_EVENTS.REACTION_UPDATED, result);
      ack?.({ success: true, data: result });
    } catch (err) {
      handleSocketError(socket, ack, err);
    }
  });
}

function handleSocketError(socket: Socket, ack: ((res: unknown) => void) | undefined, err: unknown) {
  const message = err instanceof Error ? err.message : "Something went wrong";
  ack?.({ success: false, message });
  socket.emit(CHAT_EVENTS.ERROR, { message });
}