import fs from "node:fs";
import { extractPages } from "../../src/modules/ai/rag/pdf-extractor";

const file = process.argv[2];
const pageToShow = Number(process.argv[3] ?? 1);

if (!file) {
  console.error("usage: npx tsx test/rag/test-extract.ts <file.pdf> [page]");
  process.exit(1);
}

// keeps Node alive while pdfjs works (a silent exit means the event loop ran empty)
const keepAlive = setInterval(() => {}, 1000);
process.on("exit", (code) => console.log("process exit, code:", code));

console.log("reading:", file, "size:", fs.statSync(file).size, "bytes");

extractPages(fs.readFileSync(file), (done, total) => {
  if (done % 20 === 0 || done === total) console.log(`progress ${done}/${total}`);
})
  .then((pages) => {
    const empty = pages.filter((p) => p.lowQuality).length;
    console.log(`pages: ${pages.length}, low quality: ${empty}`);
    console.log(`labels sample: ${pages.slice(0, 5).map((p) => p.printedLabel).join(", ")}`);
    const p = pages.find((x) => x.pageNumber === pageToShow);
    console.log(`--- page ${pageToShow} (${p?.text.length ?? 0} chars) ---`);
    console.log(p?.text.slice(0, 600));
  })
  .catch((e) => console.error("FAILED:", e))
  .finally(() => clearInterval(keepAlive));