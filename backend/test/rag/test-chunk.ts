import fs from "node:fs";
import { extractPages } from "../../src/modules/ai/rag/pdf-extractor";
import { chunkBook } from "../../src/modules/ai/rag/chunker";

const file = process.argv[2];
if (!file) {
  console.error("usage: npx tsx test/rag/test-chunk.ts <file.pdf>");
  process.exit(1);
}

extractPages(fs.readFileSync(file))
  .then((pages) => {
    const chunks = chunkBook(pages);
    const sizes = chunks.map((c) => c.content.length);
    console.log(`pages: ${pages.length}, chunks: ${chunks.length}`);
    console.log(`size min/max: ${Math.min(...sizes)} / ${Math.max(...sizes)}`);
    for (const c of chunks.slice(0, 2)) {
      console.log(`--- page ${c.pageNumber}, position ${c.position}, ${c.content.length} chars ---`);
      console.log(c.content);
    }
  })
  .catch((e) => console.error("FAILED:", e));