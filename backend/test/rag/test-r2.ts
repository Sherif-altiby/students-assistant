// test/rag/test-r2.ts
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { storageService } from '../../src/modules/books/storage.service';

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('usage: npx tsx test/rag/test-r2.ts <file.pdf>');
    process.exit(1);
  }
  const buffer = fs.readFileSync(file);
  const key = `test/${randomUUID()}.pdf`;

  try {
    const url = await storageService.createUploadUrl(key);
    console.log('1) upload link created');

    // same request a browser would send
    const put = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/pdf' },
      body: buffer,
    });
    console.log('2) upload status:', put.status);
    if (!put.ok) {
      console.log((await put.text()).slice(0, 400));
      return;
    }

    const head = await storageService.head(key);
    console.log('3) size in R2:', head?.size, '| local size:', buffer.length);
    console.log('4) looks like PDF:', await storageService.looksLikePdf(key));

    const downloaded = await storageService.download(key);
    console.log('5) downloaded bytes:', downloaded.length, '| identical:', downloaded.equals(buffer));
  } finally {
    await storageService.remove(key).catch(() => undefined);
    console.log('6) test file deleted:', (await storageService.head(key).catch(() => 'error')) === null);
  }
}

main().catch((e) => {
  console.error('FAILED:', e);
  process.exit(1);
});