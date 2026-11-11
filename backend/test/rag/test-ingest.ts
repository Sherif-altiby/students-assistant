import 'dotenv/config';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { prisma } from '../../src/config/prisma';
import { ingestBook } from '../../src/modules/ai/rag/ingestion.service';
import { embedQuery, toVectorLiteral } from '../../src/modules/ai/rag/embedding.service';

async function main() {
  const file = process.argv[2];
  const question = process.argv[3] ?? 'ما هي أنظمة الجداول الدراسية؟';
  if (!file) {
    console.error('usage: npx tsx test/rag/test-ingest.ts <file.pdf> ["question"]');
    process.exit(1);
  }

  const buffer = fs.readFileSync(file);

  // temporary user: deleting it also deletes its book, pages and chunks (cascade)
  const user = await prisma.user.create({
    data: { name: 'rag test user', email: `rag-test-${randomUUID()}@example.test` },
  });

  try {
    const book = await prisma.book.create({
      data: {
        title: 'rag test book',
        ownerId: user.id,
        fileKey: `test/${randomUUID()}.pdf`,
        fileSize: buffer.length,
        status: 'PROCESSING',
      },
    });

    console.time('ingest');
    await ingestBook(book.id, buffer);
    console.timeEnd('ingest');

    const saved = await prisma.book.findUniqueOrThrow({ where: { id: book.id } });
    const pages = await prisma.bookPage.count({ where: { bookId: book.id } });
    const chunks = await prisma.bookChunk.count({ where: { bookId: book.id } });
    console.log({
      status: saved.status,
      progress: saved.progress,
      pageCount: saved.pageCount,
      pages,
      chunks,
    });

    const qVec = await embedQuery(question);
    const literal = toVectorLiteral(qVec);
    const rows = await prisma.$queryRaw<
      { page_number: number; distance: number; preview: string }[]
    >`
      SELECT page_number, (embedding <=> ${literal}::vector) AS distance, left(content, 80) AS preview
      FROM "book_chunks"
      WHERE book_id = ${book.id}
      ORDER BY embedding <=> ${literal}::vector
      LIMIT 3`;
    console.log('question:', question);
    console.log(rows);
  } finally {
    await prisma.user.delete({ where: { id: user.id } }).catch((e) => {
      console.error('could not delete the test user:', e);
    });
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('FAILED:', e);
  process.exit(1);
});