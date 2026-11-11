// scripts/dev-ingest.ts  (development only)
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { prisma } from '../src/config/prisma';
import { ingestBook } from '../src/modules/ai/rag/ingestion.service';

async function main() {
  const [file, email] = process.argv.slice(2);
  if (!file || !email) {
    console.error('usage: npx tsx scripts/dev-ingest.ts <file.pdf> <user email>');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) throw new Error(`No user with email ${email}. Register it first.`);

  const buffer = fs.readFileSync(file);
  const book = await prisma.book.create({
    data: {
      title: path.basename(file, path.extname(file)),
      ownerId: user.id,
      fileKey: `dev/${randomUUID()}.pdf`,
      fileSize: buffer.length,
      status: 'PROCESSING',
    },
  });

  await ingestBook(book.id, buffer);
  console.log('book ready, id =', book.id);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('FAILED:', e);
  process.exit(1);
});