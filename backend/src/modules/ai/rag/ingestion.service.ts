// src/modules/ai/rag/ingestion.service.ts
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { AppError, UnprocessableEntityError } from '../../../utils/AppError';
import { extractPages } from './pdf-extractor';
import { chunkBook } from './chunker';
import { embedDocuments, toVectorLiteral } from './embedding.service';

const PAGE_INSERT_BATCH = 100; // pages saved per query
const EMBED_BATCH = 60; // chunks embedded and saved together
const MAX_LOW_QUALITY_RATIO = 0.5; // more than half empty pages = scanned book

// Progress map: 0-30 reading the PDF, 35 pages saved, 40-95 embeddings, 100 done.

// Writes only when the percentage grows, so a big book does not cause
// thousands of tiny updates.
function createProgressWriter(bookId: string) {
  let last = -1;
  return async (value: number) => {
    const percent = Math.min(99, Math.max(0, Math.round(value)));
    if (percent <= last) return;
    last = percent;
    await prisma.book.update({ where: { id: bookId }, data: { progress: percent } });
  };
}

export async function ingestBook(bookId: string, buffer: Buffer): Promise<void> {
  const writeProgress = createProgressWriter(bookId);

  try {
    await prisma.book.update({
      where: { id: bookId },
      data: { status: 'PROCESSING', progress: 0, failureReason: null },
    });

    // a retry must start from a clean state
    await prisma.bookChunk.deleteMany({ where: { bookId } });
    await prisma.bookPage.deleteMany({ where: { bookId } });

    // 1) read the PDF page by page
    const pages = await extractPages(buffer, (done, total) => {
      void writeProgress((done / total) * 30).catch(() => undefined); // best effort
    });

    const lowQualityCount = pages.filter((p) => p.lowQuality).length;
    if (pages.length === 0 || lowQualityCount / pages.length > MAX_LOW_QUALITY_RATIO) {
      throw new UnprocessableEntityError(
        'لا يحتوي الكتاب على نص كافٍ، ويبدو أنه ممسوح ضوئيًا (صور) ولا يمكن قراءته حاليًا'
      );
    }

    // 2) save the full text of each page (used for "explain page X")
    for (let i = 0; i < pages.length; i += PAGE_INSERT_BATCH) {
      await prisma.bookPage.createMany({
        data: pages.slice(i, i + PAGE_INSERT_BATCH).map((p) => ({
          bookId,
          pageNumber: p.pageNumber,
          printedLabel: p.printedLabel,
          text: p.text,
          lowQuality: p.lowQuality,
        })),
      });
    }
    await prisma.book.update({ where: { id: bookId }, data: { pageCount: pages.length } });
    await writeProgress(35);

    // 3) cut into chunks, embed them, and save the vectors
    const chunks = chunkBook(pages);
    if (chunks.length === 0) {
      throw new UnprocessableEntityError('لم يتم العثور على نص كافٍ في الكتاب');
    }

    for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
      const batch = chunks.slice(i, i + EMBED_BATCH);
      const vectors = await embedDocuments(batch.map((c) => c.content));

      const values = batch.map((chunk, j) => {
        const vector = vectors[j];
        if (!vector) throw new Error('Missing embedding for a chunk');
        return Prisma.sql`(${randomUUID()}, ${bookId}, ${chunk.pageNumber}, ${chunk.position}, ${chunk.content}, ${toVectorLiteral(vector)}::vector)`;
      });

      // raw SQL because Prisma cannot write the vector column directly
      await prisma.$executeRaw`
        INSERT INTO "book_chunks" ("id", "book_id", "page_number", "position", "content", "embedding")
        VALUES ${Prisma.join(values)}`;

      await writeProgress(40 + ((i + batch.length) / chunks.length) * 55);
    }

    await prisma.book.update({
      where: { id: bookId },
      data: { status: 'READY', progress: 100, pageCount: pages.length, failureReason: null },
    });
  } catch (error) {
    console.error(`[ingestion] book ${bookId} failed:`, error);

    const reason =
      error instanceof AppError && error.isOperational
        ? error.message
        : 'حدث خطأ أثناء معالجة الكتاب، حاول مرة أخرى';

    // do not leave a half-processed book behind
    await prisma.bookChunk.deleteMany({ where: { bookId } }).catch(() => undefined);
    await prisma.bookPage.deleteMany({ where: { bookId } }).catch(() => undefined);
    await prisma.book
      .update({ where: { id: bookId }, data: { status: 'FAILED', failureReason: reason } })
      .catch(() => undefined);

    throw error;
  }
}