import { AppError, NotFoundError } from "../../utils/AppError";
import { chatRepository } from "./chat.repository";
import { SendMessageInput, ReactInput } from "./chat.types";
 
export const chatService = {
  async sendMessage({ userId, content, replyToId }: SendMessageInput) {
    if (replyToId) {
      const parent = await chatRepository.findMessageById(replyToId);
      if (!parent) throw new NotFoundError("Message you are replying to does not exist");
    }

    return chatRepository.createMessage({ userId, content, replyToId });
  },

  async getHistory(cursor?: string, limit = 30) {
    const messages = await chatRepository.getHistory(cursor, limit);
    // reverse so client renders oldest -> newest
    return messages.reverse();
  },

  async react({ userId, messageId, type }: ReactInput) {
    const message = await chatRepository.findMessageById(messageId);
    if (!message) throw new NotFoundError("Message not found");

    const existing = await chatRepository.findReaction(userId, messageId);

    // toggle off if same reaction sent again
    if (existing && existing.type === type) {
      await chatRepository.removeReaction(userId, messageId);
      return { messageId, userId, type: null };
    }

    const reaction = await chatRepository.upsertReaction(userId, messageId, type);
    return { messageId, userId, type: reaction.type };
  },
};