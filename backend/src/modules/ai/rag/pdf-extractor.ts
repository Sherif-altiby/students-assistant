// src/modules/ai/rag/pdf-extractor.ts

export interface ExtractedPage {
  pageNumber: number; // index inside the PDF file (1-based)
  printedLabel: string | null; // number printed on the page, if the PDF has labels
  text: string;
  lowQuality: boolean; // true when the page has (almost) no text, e.g. a scanned page
}

const MAX_PAGES = 2000;
const LOW_QUALITY_MIN_CHARS = 30;

// pdfjs-dist is ESM-only and this project is CommonJS. This form also stops
// TypeScript from turning import() into require() when compiled with tsc.
const dynamicImport = new Function("s", "return import(s)") as (
  s: string
) => Promise<any>;

function cleanText(raw: string): string {
  return (
    raw
      // Postgres cannot store the NUL character in a text column
      .replace(/\u0000/g, "")
      // symbol-font bullets come out as private-use characters
      .replace(/[\uE000-\uF8FF]/g, "\u2022")
      // converts Arabic presentation forms (U+FE70-FEFF) to normal letters
      .normalize("NFKC")
      .replace(/[ \t\u00A0]+/g, " ")
      .replace(/ *\n */g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

export async function extractPages(
  buffer: Buffer,
  onProgress?: (done: number, total: number) => void
): Promise<ExtractedPage[]> {
  const pdfjs = await dynamicImport("pdfjs-dist/legacy/build/pdf.mjs");

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer), // copy: pdfjs takes ownership of the memory it is given
    useSystemFonts: true,
    isEvalSupported: false,
    disableFontFace: true,
    verbosity: 0,
  });

  const doc = await loadingTask.promise;

  try {
    if (doc.numPages > MAX_PAGES) {
      throw new Error(`PDF has ${doc.numPages} pages, the limit is ${MAX_PAGES}`);
    }

    const labels: string[] | null = await doc.getPageLabels();
    const pages: ExtractedPage[] = [];

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();

      let raw = "";
      let lastY: number | null = null;

      for (const item of content.items) {
        if (typeof item.str !== "string") continue; // skip marked-content entries
        const y: number = item.transform[5];
        if (lastY !== null && Math.abs(y - lastY) > 2 && !raw.endsWith("\n")) {
          raw += "\n";
        }
        raw += item.str;
        if (item.hasEOL) raw += "\n";
        lastY = y;
      }

      const text = cleanText(raw);
      pages.push({
        pageNumber: i,
        printedLabel: labels?.[i - 1] ?? null,
        text,
        lowQuality: text.length < LOW_QUALITY_MIN_CHARS,
      });

      page.cleanup(); // frees memory, important for large books
      onProgress?.(i, doc.numPages);
    }

    return pages;
  } finally {
    await loadingTask.destroy();
  }
}