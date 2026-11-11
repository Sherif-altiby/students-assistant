// src/modules/books/book.service.ts
import { createHash, randomUUID } from 'node:crypto';
import { AppError, BadRequestError, ConflictError, NotFoundError } from '../../utils/AppError';
import { ingestBook } from '../ai/rag/ingestion.service';
import { ragService, type ChatInput } from '../ai/rag/rag.service';
import { bookRepository } from './book.repository';
import { storageService } from './storage.service';
import { MAX_BOOK_SIZE_BYTES } from './book.validation';

// ---- limits (change here) ----
const MAX_BOOKS_PER_USER = 20;
const MAX_PENDING_UPLOADS = 3; // uploads requested but not confirmed in the last hour
const PENDING_WINDOW_MS = 60 * 60 * 1000;
const MAX_TOTAL_BYTES = 1024 * 1024 * 1024; // 1 GB per student
const MAX_CONCURRENT_INGEST = 2; // each running ingestion holds a whole PDF in memory

// ---- tiny in-process limiter so many uploads do not process all at once ----
let running = 0;
const waiting: (() => void)[] = [];

async function acquireSlot(): Promise<void> {
  if (running < MAX_CONCURRENT_INGEST) {
    running++;
    return;
  }
  await new Promise<void>((resolve) => waiting.push(resolve)); // the slot is handed over directly
}

function releaseSlot(): void {
  const next = waiting.shift();
  if (next) next();
  else running--;
}

// Runs in the background after the upload is confirmed.
// ingestBook already marks the book FAILED with a clear reason when it fails.
async function processBook(book: { id: string; fileKey: string }): Promise<void> {
  await acquireSlot();
  try {
    let buffer: Buffer;
    try {
      buffer = await storageService.download(book.fileKey);
    } catch (err) {
      console.error(`[books] download failed for ${book.id}:`, err);
      await bookRepository.markFailed(book.id, 'تعذّر تحميل الملف، حاول مرة أخرى');
      return;
    }

    const fileHash = createHash('sha256').update(buffer).digest('hex');
    await bookRepository.setFileHash(book.id, fileHash).catch(() => undefined);

    await ingestBook(book.id, buffer).catch((err) =>
      console.error(`[books] ingestion failed for ${book.id}:`, err)
    );
  } finally {
    releaseSlot();
  }
}

// Gemini quota / overload errors must not reach the student as raw API errors
function toFriendlyAiError(err: unknown): never {
  if (err instanceof AppError) throw err;
  const status = (err as { status?: number })?.status;
  if (status === 429 || (typeof status === 'number' && status >= 500)) {
    console.error('[ai] provider unavailable:', status, String((err as Error)?.message).slice(0, 300));
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

  // ---------- upload step 1: ask for a temporary upload link ----------
  async requestUpload(
    userId: string,
    input: { title: string; fileSize: number; language?: 'ar' | 'en' }
  ) {
    const [owned, pending, totalBytes] = await Promise.all([
      bookRepository.countOwned(userId),
      bookRepository.countPendingUploads(userId, new Date(Date.now() - PENDING_WINDOW_MS)),
      bookRepository.totalSize(userId),
    ]);

    if (owned >= MAX_BOOKS_PER_USER) {
      throw new BadRequestError(
        `وصلت للحد الأقصى لعدد الكتب (${MAX_BOOKS_PER_USER}). احذف كتابًا لرفع كتاب جديد`,
        { code: 'BOOK_LIMIT_REACHED' }
      );
    }
    if (pending >= MAX_PENDING_UPLOADS) {
      throw new BadRequestError('لديك عمليات رفع غير مكتملة، أكملها أو انتظر قليلًا', {
        code: 'TOO_MANY_PENDING_UPLOADS',
      });
    }
    if (totalBytes + input.fileSize > MAX_TOTAL_BYTES) {
      throw new BadRequestError('تجاوزت المساحة المسموحة للكتب', { code: 'STORAGE_LIMIT_REACHED' });
    }

    // the key is generated here, never from the file name sent by the client
    const id = randomUUID();
    const fileKey = `books/${userId}/${id}.pdf`;

    await bookRepository.create({
      id,
      title: input.title,
      language: input.language,
      ownerId: userId,
      fileKey,
      fileSize: input.fileSize,
    });

    let uploadUrl: string;
    try {
      uploadUrl = await storageService.createUploadUrl(fileKey);
    } catch (err) {
      await bookRepository.delete(id);
      throw err;
    }

    return {
      bookId: id,
      uploadUrl,
      method: 'PUT' as const,
      headers: { 'Content-Type': 'application/pdf' },
      expiresInSeconds: storageService.uploadUrlTtlSeconds,
    };
  },

  // ---------- upload step 2: the file is in R2, verify it and start processing ----------
  async completeUpload(userId: string, id: string) {
    const book = await bookRepository.findOwned(userId, id);
    if (!book) throw new NotFoundError('الكتاب غير موجود');

    // calling it twice is harmless
    if (book.status === 'PROCESSING' || book.status === 'READY') {
      return { id: book.id, status: book.status, progress: book.progress };
    }

    const head = await storageService.head(book.fileKey);
    if (!head) {
      throw new BadRequestError('لم يتم رفع الملف بعد', { code: 'UPLOAD_MISSING' });
    }

    // the size is checked after the upload; a mismatch or a non-PDF is deleted
    const valid =
      head.size === book.fileSize &&
      head.size <= MAX_BOOK_SIZE_BYTES &&
      (await storageService.looksLikePdf(book.fileKey));
    if (!valid) {
      await storageService.remove(book.fileKey).catch(() => undefined);
      await bookRepository.delete(book.id);
      throw new BadRequestError('الملف غير صالح. يجب أن يكون PDF بنفس الحجم المعلن', {
        code: 'INVALID_FILE',
      });
    }

    const claimed = await bookRepository.claimForProcessing(book.id);
    if (claimed === 0) return { id: book.id, status: 'PROCESSING' as const, progress: 0 };

    void processBook(book).catch((err) => console.error('[books] processBook crashed:', err));
    return { id: book.id, status: 'PROCESSING' as const, progress: 0 };
  },

  async remove(userId: string, id: string) {
    const book = await bookRepository.findOwned(userId, id);
    if (!book) throw new NotFoundError('الكتاب غير موجود');
    if (book.status === 'PROCESSING') {
      throw new ConflictError('الكتاب قيد المعالجة، حاول بعد قليل');
    }

    // pages, chunks and summaries go with it (cascade); conversations stay
    await bookRepository.delete(book.id);
    await storageService
      .remove(book.fileKey)
      .catch((err) => console.error(`[books] could not delete ${book.fileKey} from R2:`, err));
  },

  // call once when the server starts
  async recoverInterruptedBooks() {
    const count = await bookRepository.failInterrupted();
    if (count > 0) console.log(`[books] marked ${count} interrupted book(s) as FAILED`);
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