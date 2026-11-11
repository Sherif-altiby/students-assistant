import 'dotenv/config';

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const CONTEXT = `[Page 1]
جدول عام يغطي السنة الدراسية. جدول يومي وأسبوعي مخصص لكل طالب. ربط الجدول بمواعيد الدروس والمدرسين.
إنشاء جداول مستقلة لكل مادة. جداول مراجعة للترم الأول والثاني. اكتشاف التعارضات بين المهام تلقائيا.`;

async function main() {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  for (const level of [undefined, 'minimal', 'low', 'medium', 'high']) {
    const config: Record<string, unknown> = {
      systemInstruction: 'Answer ONLY from the book context. Cite pages like (ص 1). Answer in Arabic.',
      maxOutputTokens: 4096,
      temperature: 0.3,
    };
    if (level) config.thinkingConfig = { thinkingLevel: level };

    const t0 = Date.now();
    try {
      const res = await ai.models.generateContent({
        model: MODEL,
        contents: `Context:\n${CONTEXT}\n\nQuestion: ما هي أنظمة الجداول الدراسية؟`,
        config,
      });
      console.log(`level=${level ?? '(not set)'}  ${Date.now() - t0} ms`);
      console.log('  usage:', JSON.stringify(res.usageMetadata));
    } catch (e) {
      console.log(`level=${level ?? '(not set)'}  ERROR:`, (e as Error).message.slice(0, 200));
    }
  }
}

main();