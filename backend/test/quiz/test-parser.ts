// test/quiz/test-parser.ts
import { parseQuizRequest } from '../../src/modules/quiz/quiz.parser';

const messages = [
  'i need quiz on first 10 pages of pdf',
  'اعملي كويز على أول 10 صفحات',
  'quiz on pages 20 to 35, 15 questions',
  'اعملي كويز من صفحة ٢٠ إلى ٣٥',
  'quiz about page 7',
  'اختبرني في صفحات 5-12 عدد الأسئلة 8 سؤال',
  'quiz on first 100 pages',
  'i need a quiz',
];

for (const m of messages) {
  console.log(m, '\n  ->', JSON.stringify(parseQuizRequest(m)));
}