// src/modules/quiz/quiz.parser.ts

export const MAX_QUIZ_PAGES = 30;
export const DEFAULT_QUESTION_COUNT = 10;
export const MIN_QUESTION_COUNT = 5;
export const MAX_QUESTION_COUNT = 20;

export type QuizLanguage = 'ar' | 'en';

export type ParsedQuizRequest =
  | {
      ok: true;
      startPage: number;
      endPage: number;
      questionCount: number;
      language: QuizLanguage;
    }
  | { ok: false; reason: 'NO_RANGE' | 'BAD_RANGE' | 'RANGE_TOO_LARGE' };

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

function normalizeDigits(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
}

const PAGE_WORD = String.raw`(?:pages?|pp?\.?|(?:ال)?صفح(?:ات|ة|ه)|ص)`;

// "first 10 pages" / "أول 10 صفحات"
const FIRST_RE = new RegExp(
  String.raw`(?<![\p{L}])(?:first|أول|اول)\s*(\d{1,4})\s*${PAGE_WORD}(?![\p{L}])`,
  'iu'
);

// "pages 20 to 35" / "من صفحة 20 إلى 35" / "pages 20-35"
const RANGE_RE = new RegExp(
  String.raw`(?<![\p{L}])${PAGE_WORD}\s*(?:من\s*|from\s*)?(\d{1,4})\s*(?:to|until|through|-|–|—|إلى|الى|حتى|ل)\s*(\d{1,4})`,
  'iu'
);

// "page 5" / "صفحة 5"
const SINGLE_RE = new RegExp(
  String.raw`(?<![\p{L}])${PAGE_WORD}\s*(\d{1,4})`,
  'iu'
);

// "15 questions" / "15 سؤال"
const COUNT_RE =
  /(?<![\p{L}\d])(\d{1,2})\s*(?:questions?|أسئلة|اسئلة|أسئله|اسئله|سؤال)/iu;

export function detectLanguage(text: string): QuizLanguage {
  const arabic = (text.match(/[\u0600-\u06FF]/g) ?? []).length;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  return arabic > latin ? 'ar' : 'en';
}

export function parseQuizRequest(message: string): ParsedQuizRequest {
  const text = normalizeDigits(message);
  const language = detectLanguage(text);

  let start: number;
  let end: number;

  const range = RANGE_RE.exec(text);
  const first = FIRST_RE.exec(text);
  const single = SINGLE_RE.exec(text);

  if (range) {
    start = Number(range[1]);
    end = Number(range[2]);
  } else if (first) {
    start = 1;
    end = Number(first[1]);
  } else if (single) {
    start = Number(single[1]);
    end = start;
  } else {
    return { ok: false, reason: 'NO_RANGE' };
  }

  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start) {
    return { ok: false, reason: 'BAD_RANGE' };
  }
  if (end - start + 1 > MAX_QUIZ_PAGES) {
    return { ok: false, reason: 'RANGE_TOO_LARGE' };
  }

  const countMatch = COUNT_RE.exec(text);
  const requested = countMatch ? Number(countMatch[1]) : DEFAULT_QUESTION_COUNT;
  const questionCount = Math.min(
    MAX_QUESTION_COUNT,
    Math.max(MIN_QUESTION_COUNT, requested)
  );

  return { ok: true, startPage: start, endPage: end, questionCount, language };
}