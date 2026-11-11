// src/modules/ai/rag/chunker.ts

export interface TextChunk {
  pageNumber: number;
  position: number; // order of the chunk inside the whole book (0-based)
  content: string;
}

const TARGET_SIZE = 900; // wanted chunk length in characters
const OVERLAP = 150; // text repeated from the end of the previous chunk
const MIN_CHUNK = 40; // smaller chunks carry no useful meaning
const MAX_UNIT = TARGET_SIZE - OVERLAP;

// splits a long sentence by words so that no unit is bigger than max
function hardSplit(text: string, max: number): string[] {
  const out: string[] = [];
  let current = "";
  for (const word of text.split(/\s+/)) {
    if (current && current.length + word.length + 1 > max) {
      out.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) out.push(current);
  return out;
}

// breaks a page into sentences / lines, each at most MAX_UNIT long
function splitUnits(text: string): string[] {
  const units: string[] = [];
  for (const part of text.split(/(?<=[.!?؟۔])\s+|\n+/)) {
    const unit = part.trim();
    if (!unit) continue;
    if (unit.length > MAX_UNIT) units.push(...hardSplit(unit, MAX_UNIT));
    else units.push(unit);
  }
  return units;
}

// last ~OVERLAP characters of a chunk, cut at a word boundary
function tail(text: string): string {
  if (text.length <= OVERLAP) return text;
  const part = text.slice(-OVERLAP);
  const firstSpace = part.indexOf(" ");
  return firstSpace === -1 ? part : part.slice(firstSpace + 1);
}

export function chunkPage(text: string): string[] {
  const units = splitUnits(text);
  const chunks: string[] = [];
  let current = "";

  for (const unit of units) {
    if (current && current.length + unit.length + 1 > TARGET_SIZE) {
      chunks.push(current);
      current = `${tail(current)} ${unit}`;
    } else {
      current = current ? `${current} ${unit}` : unit;
    }
  }
  if (current) chunks.push(current);

  return chunks.filter((c) => c.length >= MIN_CHUNK);
}

// Chunks the whole book. `position` keeps the reading order across pages.
export function chunkBook(
  pages: { pageNumber: number; text: string }[]
): TextChunk[] {
  const result: TextChunk[] = [];
  let position = 0;
  for (const page of pages) {
    for (const content of chunkPage(page.text)) {
      result.push({ pageNumber: page.pageNumber, position: position++, content });
    }
  }
  return result;
}