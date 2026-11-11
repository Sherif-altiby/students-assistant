import 'dotenv/config';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { prisma } from '../../src/config/prisma';
import { ingestBook } from '../../src/modules/ai/rag/ingestion.service';
import { ragService } from '../../src/modules/ai/rag/rag.service';

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('usage: npx tsx test/rag/test-chat.ts <file.pdf>');
    process.exit(1);
  }
  const buffer = fs.readFileSync(file);
  const user = await prisma.user.create({
    data: { name: 'rag-chat', email: `rag-chat-${randomUUID()}@example.test` },
  });

  try {
    const book = await prisma.book.create({
      data: { title: 'rag test book', ownerId: user.id, fileKey: `test/${randomUUID()}.pdf`, fileSize: buffer.length, status: 'PROCESSING' },
    });
    await ingestBook(book.id, buffer);

    const say = async (message: string, extra: { newConversation?: boolean } = {}) => {
      console.time(message);
      const r = await ragService.handleMessage({ userId: user.id, bookId: book.id, message, ...extra });
      console.timeEnd(message);
      console.log(`[${r.operation}] pages=${JSON.stringify(r.citedPages)} conv=${r.conversationId.slice(0, 8)}`);
      console.log(r.answer.slice(0, 350), '\n');
      return r;
    };

    await say('ما هي أنظمة الجداول الدراسية؟');
    await say('وضّح أكتر');
    await say('اشرح صفحة 3');
    await say('اشرح صفحة 99');
    await say('لخص الكتاب');
    await say('لخص الكتاب'); // should be instant: served from the cache
    await say('What is the project idea?'); // English question
    await say('ما هي فكرة المشروع؟', { newConversation: true });

    const convs = await prisma.aiConversation.findMany({ where: { userId: user.id }, select: { archivedAt: true, _count: { select: { messages: true } } } });
    console.log('conversations:', convs.map((c) => ({ archived: !!c.archivedAt, messages: c._count.messages })));
  } finally {
    await prisma.user.delete({ where: { id: user.id } }).catch((e) => console.error('cleanup failed:', e));
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('FAILED:', e);
  process.exit(1);
});