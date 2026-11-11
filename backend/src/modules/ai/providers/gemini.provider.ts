// src/modules/ai/providers/gemini.provider.ts
import type { AiProvider, GenerateTextInput, GenerateTextResult } from './ai-provider.interface';

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
// Gemini 3 thinks at "high" by default, which is slow and billed as output.
// "minimal" is not supported by gemini-3.8-flash (HTTP 400), so "low" is the floor.
const THINKING_LEVEL = process.env.GEMINI_THINKING_LEVEL || 'low';
const MAX_RETRIES = 3;
const DEFAULT_MAX_OUTPUT = 4096; // includes the model's internal "thinking" tokens

// @google/genai is ESM-only and this project is CommonJS -> dynamic import()
async function createClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  const { GoogleGenAI } = await import('@google/genai');
  return new GoogleGenAI({ apiKey });
}

let clientPromise: ReturnType<typeof createClient> | null = null;
function getClient() {
  if (!clientPromise) {
    clientPromise = createClient();
    clientPromise.catch(() => {
      clientPromise = null;
    });
  }
  return clientPromise;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const geminiProvider: AiProvider = {
  async generateText({ system, prompt, maxOutputTokens }: GenerateTextInput): Promise<GenerateTextResult> {
    for (let attempt = 0; ; attempt++) {
      try {
        const client = await getClient();
        const res = await client.models.generateContent({
          model: MODEL,
          contents: prompt,
          config: {
            systemInstruction: system,
            maxOutputTokens: maxOutputTokens ?? DEFAULT_MAX_OUTPUT,
            temperature: 0.3, // low: answers must stay close to the book text
            thinkingConfig: { thinkingLevel: THINKING_LEVEL as any },
          },
        });

        const text = (res.text ?? '').trim();
        if (!text) throw new Error('Gemini returned an empty answer');

        const usage = res.usageMetadata;
        return {
          text,
          inputTokens: usage?.promptTokenCount ?? null,
          // thinking tokens are billed as output, so they are counted here too
          outputTokens: (usage?.candidatesTokenCount ?? 0) + (usage?.thoughtsTokenCount ?? 0),
        };
      } catch (err) {
        const e = err as { status?: number; code?: number; message?: string };
        const status = e?.status ?? e?.code;
        // a per-DAY quota will not recover in a few seconds, so retrying is pointless
        const dailyQuota = status === 429 && /PerDay/i.test(e?.message ?? '');
        const retryable =
          !dailyQuota && (status === 429 || (typeof status === 'number' && status >= 500));
        if (!retryable || attempt >= MAX_RETRIES) throw err;
        await sleep(1000 * 2 ** attempt); // 1s, 2s, 4s
      }
    }
  }
};