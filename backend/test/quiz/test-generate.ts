// test/quiz/test-generate.ts
import 'dotenv/config';
import { generateQuiz } from '../../src/modules/quiz/quiz.generator';

const pages = [
  {
    pageNumber: 1,
    text: 'الخلية هي الوحدة الأساسية للحياة في جميع الكائنات الحية. تحتوي الخلية على النواة التي تحمل المادة الوراثية وتتحكم في أنشطة الخلية. يحيط بالخلية غشاء بلازمي يتحكم في دخول المواد وخروجها.',
  },
  {
    pageNumber: 2,
    text: 'الميتوكندريا هي مصنع الطاقة في الخلية، حيث تنتج الطاقة على شكل ATP من خلال التنفس الخلوي. أما البلاستيدات الخضراء فتوجد في الخلايا النباتية فقط، وتقوم بعملية البناء الضوئي لتحويل الضوء إلى طاقة كيميائية.',
  },
  {
    pageNumber: 3,
    text: 'الخلية النباتية لها جدار خلوي من السيلولوز يمنحها الشكل والدعم، بينما لا تملك الخلية الحيوانية جدارًا خلويًا. تحتوي الخلية النباتية أيضًا على فجوة عصارية كبيرة تخزن الماء والمواد الغذائية.',
  },
];

const TIMEOUT_MS = 120_000;

async function main() {
  console.log('1) started');
  console.log('2) GEMINI_API_KEY set:', Boolean(process.env.GEMINI_API_KEY));
  console.log('3) GEMINI_MODEL:', process.env.GEMINI_MODEL ?? '(default)');
  console.log('4) calling Gemini, this can take up to 1 minute...');

  const t0 = Date.now();
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`No answer after ${TIMEOUT_MS / 1000}s`)),
      TIMEOUT_MS
    )
  );

  const quiz = await Promise.race([
    generateQuiz({
      pages,
      startPage: 1,
      endPage: 3,
      questionCount: 6,
      language: 'ar',
    }),
    timeout,
  ]);

  console.log(`5) done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.log('Title:', quiz.title);
  console.log('Tokens in/out:', quiz.inputTokens, quiz.outputTokens, '\n');

  quiz.questions.forEach((q, i) => {
    console.log(`${i + 1}. [${q.type}] ${q.prompt}`);
    q.options.forEach((o, j) => console.log(`     ${j}) ${o}`));
    console.log(
      `   answer: ${q.correctAnswer}  | page: ${q.pageNumber} | topic: ${q.topic}`
    );
    console.log(`   why: ${q.explanation}\n`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('FAILED:', e);
    process.exit(1);
  });