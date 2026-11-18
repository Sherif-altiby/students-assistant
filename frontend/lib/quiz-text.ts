import type { QuizLanguage, ReviewQuestion } from "@/types/quiz";

// Quiz content direction follows the quiz language, not the app language
export const dirOf = (language: QuizLanguage) =>
  language === "ar" ? "rtl" : "ltr";

export const pageLabel = (language: QuizLanguage, page: number) =>
  language === "ar" ? `ص ${page}` : `p. ${page}`;

export const tfLabel = (language: QuizLanguage, value: boolean) =>
  language === "ar" ? (value ? "صح" : "خطأ") : value ? "True" : "False";

export const hasArabic = (text: string) => /[\u0600-\u06FF]/.test(text);

// null = not answered. For MCQ the server already sends the option text.
export function displayYourAnswer(
  question: ReviewQuestion,
  language: QuizLanguage,
): string | null {
  const value = question.yourAnswer;
  if (value === null) return null;
  if (question.type === "TRUE_FALSE") {
    if (value === "true") return tfLabel(language, true);
    if (value === "false") return tfLabel(language, false);
  }
  return value;
}