// src/modules/quiz/quiz.grader.ts
import type { QuizLanguage } from './quiz.parser';

export interface GradableQuestion {
  id: string;
  type: 'MCQ' | 'TRUE_FALSE' | 'FILL_BLANK';
  correctAnswer: string;
  acceptedAnswers: string[];
  topic: string | null;
  pageNumber: number | null;
}

export interface WeakPoint {
  topic: string;
  pages: number[];
  wrong: number;
  total: number;
}

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function normalizeText(input: string): string {
  return input
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)))
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // tashkeel + tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(?:ال|the |an |a )/, '');
}

function parseTrueFalse(raw: string): boolean | null {
  const a = normalizeText(raw);
  if (['true', 'صح', 'صحيح'].includes(a)) return true;
  if (['false', 'خطا', 'غلط'].includes(a)) return false;
  return null;
}

export function gradeAnswer(
  question: GradableQuestion,
  answer: string | undefined
): boolean {
  if (answer === undefined) return false;
  const given = answer.trim();
  if (!given) return false;

  if (question.type === 'MCQ') return given === question.correctAnswer;

  if (question.type === 'TRUE_FALSE') {
    const value = parseTrueFalse(given);
    return value !== null && String(value) === question.correctAnswer;
  }

  const normalized = normalizeText(given);
  if (!normalized) return false;
  return [question.correctAnswer, ...question.acceptedAnswers].some(
    (expected) => normalizeText(expected) === normalized
  );
}

// Groups the wrong answers by topic. Topics with no mistakes are left out.
export function computeWeakPoints(
  questions: GradableQuestion[],
  correct: Map<string, boolean>,
  language: QuizLanguage
): WeakPoint[] {
  const groups = new Map<
    string,
    { topic: string; pages: Set<number>; wrong: number; total: number }
  >();

  for (const q of questions) {
    const label =
      q.topic ??
      (q.pageNumber !== null
        ? language === 'ar'
          ? `صفحة ${q.pageNumber}`
          : `Page ${q.pageNumber}`
        : language === 'ar'
          ? 'عام'
          : 'General');

    let group = groups.get(label);
    if (!group) {
      group = { topic: label, pages: new Set(), wrong: 0, total: 0 };
      groups.set(label, group);
    }
    group.total++;
    if (q.pageNumber !== null) group.pages.add(q.pageNumber);
    if (!correct.get(q.id)) group.wrong++;
  }

  return [...groups.values()]
    .filter((g) => g.wrong > 0)
    .sort((a, b) => b.wrong / b.total - a.wrong / a.total || b.wrong - a.wrong)
    .map((g) => ({
      topic: g.topic,
      pages: [...g.pages].sort((x, y) => x - y),
      wrong: g.wrong,
      total: g.total,
    }));
}