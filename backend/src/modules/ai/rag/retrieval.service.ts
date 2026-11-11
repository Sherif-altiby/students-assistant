// src/modules/ai/rag/retrieval.service.ts
import { prisma } from '../../../config/prisma';
import { BadRequestError, NotFoundError } from '../../../utils/AppError';
import { embedQuery, toVectorLiteral } from './embedding.service';

export interface RetrievedChunk {
  pageNumber: number;
  content: string;
  distance: number; // cosine distance: 0 = identical meaning, 2 = opposite
}

// One central access check. Every service must call this before touching a book.
// Owner: always. Another student: only PUBLIC + ACTIVE + READY.
export async function assertCanAccessBook(userId: string, bookId: string) {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: {
      id: true,
      title: true,
      language: true,
      ownerId: true,
      visibility: true,
      moderation: true,
      status: true,
      pageCount: true,
    },
  });

  const isOwner = book?.ownerId === userId;
  const isShared =
    book?.visibility === 'PUBLIC' && book.moderation === 'ACTIVE' && book.status === 'READY';

  // same error for "missing" and "not yours", so ids cannot be probed
  if (!book || (!isOwner && !isShared)) throw new NotFoundError('الكتاب غير موجود');

  if (book.status !== 'READY') {
    throw new BadRequestError('الكتاب لم يكتمل تجهيزه بعد', { code: 'BOOK_NOT_READY' });
  }
  return book;
}

// Full text of one page (PDF page index, 1-based)
export async function getPage(bookId: string, pageNumber: number) {
  return prisma.bookPage.findUnique({
    where: { bookId_pageNumber: { bookId, pageNumber } },
    select: { pageNumber: true, printedLabel: true, text: true, lowQuality: true },
  });
}

// Pages in a range, in order (used by summaries)
export async function getPagesRange(bookId: string, startPage: number, endPage: number) {
  return prisma.bookPage.findMany({
    where: { bookId, pageNumber: { gte: startPage, lte: endPage } },
    orderBy: { pageNumber: 'asc' },
    select: { pageNumber: true, text: true },
  });
}

// Search by meaning: the chunks closest to the question
export async function searchChunks(
  bookId: string,
  question: string,
  limit = 6
): Promise<RetrievedChunk[]> {
  const literal = toVectorLiteral(await embedQuery(question));

  const rows = await prisma.$queryRaw<
    { page_number: number; content: string; distance: number }[]
  >`
    SELECT page_number, content, (embedding <=> ${literal}::vector) AS distance
    FROM "book_chunks"
    WHERE book_id = ${bookId}
    ORDER BY embedding <=> ${literal}::vector
    LIMIT ${limit}`;

  return rows.map((r) => ({
    pageNumber: r.page_number,
    content: r.content,
    distance: Number(r.distance),
  }));
}