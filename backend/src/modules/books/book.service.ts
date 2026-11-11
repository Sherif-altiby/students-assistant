// src/modules/books/book.service.ts
import { AppError, NotFoundError } from '../../utils/AppError';
import { ragService, type ChatInput } from '../ai/rag/rag.service';
import { bookRepository } from './book.repository';

// Gemini quota / overload errors must not reach the student as raw API errors
function toFriendlyAiError(err: unknown): never {
  if (err instanceof AppError) throw err;
  const status = (err as { status?: number })?.status;
  if (status === 429 || (typeof status === 'number' && status >= 500)) {
    console.error('[ai] provider unavailable:', status);
    throw new AppError('خدمة الذكاء الاصطناعي مشغولة حاليًا، حاول بعد قليل', 503, true, {
      code: 'AI_UNAVAILABLE',
    });
  }
  throw err;
}

export const bookService = {
  async listMine(userId: string, page: number, limit: number) {
    const [books, totalItems] = await bookRepository.listByOwner(userId, (page - 1) * limit, limit);
    const totalPages = Math.ceil(totalItems / limit);
    return {
      books,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  },

  // used by the frontend to poll status/progress while a book is processing
  async getOne(userId: string, id: string) {
    const book = await bookRepository.findAccessible(userId, id);
    if (!book) throw new NotFoundError('الكتاب غير موجود');

    const { ownerId, failureReason, ...rest } = book;
    const isOwner = ownerId === userId;
    return { ...rest, isOwner, ...(isOwner ? { failureReason } : {}) };
  },

  async chat(input: ChatInput) {
    try {
      return await ragService.handleMessage(input);
    } catch (err) {
      return toFriendlyAiError(err);
    }
  },

  async listConversations(userId: string, bookId: string) {
    const book = await bookRepository.findAccessible(userId, bookId);
    if (!book) throw new NotFoundError('الكتاب غير موجود');
    return bookRepository.listConversations(userId, bookId);
  },

  async listMessages(userId: string, bookId: string, conversationId: string, limit: number) {
    const conversation = await bookRepository.findConversation(userId, bookId, conversationId);
    if (!conversation) throw new NotFoundError('المحادثة غير موجودة');
    return bookRepository.lastMessages(conversationId, limit);
  },
};