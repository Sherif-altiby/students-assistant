import 'dotenv/config';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { prisma } from '../../src/config/prisma';
import { ingestBook } from '../../src/modules/ai/rag/ingestion.service';
import { assertCanAccessBook, searchChunks } from '../../src/modules/ai/rag/retrieval.service';
import { geminiProvider } from '../../src/modules/ai/providers/gemini.provider';

async function main() {
  const file = process.argv[2];
  const question = process.argv[3] ?? 'ما هي أنظمة الجداول الدراسية؟';
  if (!file) {
    console.error('usage: npx tsx test/rag/test-answer.ts <file.pdf> ["question"]');
    process.exit(1);
  }
  const buffer = fs.readFileSync(file);

  const mk = (name: string) =>
    prisma.user.create({ data: { name, email: `${name}-${randomUUID()}@example.test` } });
  const owner = await mk('rag-owner');
  const other = await mk('rag-other');

  try {
    const book = await prisma.book.create({
      data: {
        title: 'rag test book',
        ownerId: owner.id,
        fileKey: `test/${randomUUID()}.pdf`,
        fileSize: buffer.length,
        status: 'PROCESSING',
      },
    });
    await ingestBook(book.id, buffer);

    // access checks
    await assertCanAccessBook(owner.id, book.id);
    console.log('owner access: OK');
    await assertCanAccessBook(other.id, book.id).then(
      () => console.log('other student access: UNEXPECTEDLY ALLOWED'),
      (e) => console.log('other student access: denied ->', e.message)
    );

    // search + answer
    const chunks = await searchChunks(book.id, question, 6);
    console.log('top pages:', chunks.map((c) => `${c.pageNumber} (${c.distance.toFixed(3)})`).join(', '));

    const context = chunks.map((c) => `[Page ${c.pageNumber}]\n${c.content}`).join('\n\n');
    const answer = await geminiProvider.generateText({
      system:
        'You are a study assistant. Answer ONLY from the provided book context. ' +
        'Cite pages like (p. 12). If the answer is not in the context, say so. ' +
        "Answer in the same language as the student's question.",
      prompt: `Context:\n${context}\n\nQuestion: ${question}`,
    });
    console.log('--- answer ---');
    console.log(answer.text);
    console.log('tokens:', answer.inputTokens, '/', answer.outputTokens);
  } finally {
    await prisma.user.deleteMany({ where: { id: { in: [owner.id, other.id] } } });
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('FAILED:', e);
  process.exit(1);
});