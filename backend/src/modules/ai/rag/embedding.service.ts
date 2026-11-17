// src/modules/ai/rag/embedding.service.ts

// Keep these two exactly as in your current file.
const MODEL = "gemini-embedding-001";
export const EMBEDDING_DIMENSIONS = 768; // must match vector(768) in book.prisma

const BATCH_SIZE = 20;
const MAX_RETRIES = 8;
const MAX_WAIT_MS = 90_000;

// The free tier allows 30,000 embedding tokens per minute, so stay below it.
// On a paid plan, raise it in .env, e.g. EMBED_TOKENS_PER_MINUTE=1000000
const TOKENS_PER_MINUTE = Number(process.env.EMBED_TOKENS_PER_MINUTE) || 24_000;
const CHARS_PER_TOKEN = 2; // conservative estimate for Arabic

type EmbeddingTask = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// @google/genai is ESM-only and this project is CommonJS -> dynamic import()
async function createClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    const { GoogleGenAI } = await import("@google/genai");
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

// ---------- per-minute token budget ----------

const recent: { at: number; tokens: number }[] = [];
let queue: Promise<void> = Promise.resolve();

function estimateTokens(texts: string[]): number {
    return Math.ceil(texts.reduce((n, t) => n + t.length, 0) / CHARS_PER_TOKEN);
}

// Waits until sending `tokens` stays under the per-minute budget.
// Calls are queued, so two books processed at once cannot overshoot it together.
function waitForBudget(tokens: number): Promise<void> {
    const need = Math.min(tokens, TOKENS_PER_MINUTE);
    const turn = queue.then(async () => {
        for (; ;) {
            const now = Date.now();

            // forget requests older than one minute
            let oldest = recent[0];
            while (oldest && now - oldest.at >= 60_000) {
                recent.shift();
                oldest = recent[0];
            }

            const used = recent.reduce((n, r) => n + r.tokens, 0);
            if (used + need <= TOKENS_PER_MINUTE) {
                recent.push({ at: now, tokens: need });
                return;
            }

            // wait until the oldest request leaves the one-minute window
            await sleep(oldest ? oldest.at + 60_000 - now + 50 : 1000);
        }
    });
    queue = turn.catch(() => undefined);
    return turn;
}
// Gemini says how long to wait: "Please retry in 32.35s" or "retryDelay":"32s"
function retryDelayMs(err: unknown): number | null {
    const message = String((err as { message?: string })?.message ?? "");
    const match =
        message.match(/retry in ([\d.]+)s/i) ??
        message.match(/"retryDelay"\s*:\s*"([\d.]+)s"/i);
    return match ? Math.ceil(Number(match[1]) * 1000) : null;
}

// ---------- one request, with retries ----------

async function embedBatch(
    texts: string[],
    taskType: EmbeddingTask
): Promise<number[][]> {
    for (let attempt = 0; ; attempt++) {
        try {
            const client = await getClient();
            const res = await client.models.embedContent({
                model: MODEL,
                contents: texts,
                config: { taskType, outputDimensionality: EMBEDDING_DIMENSIONS },
            });

            const vectors = (res.embeddings ?? []).map((e) => e.values ?? []);

            if (vectors.length !== texts.length) {
                throw new Error(
                    `Expected ${texts.length} embeddings, got ${vectors.length}`
                );
            }
            for (const v of vectors) {
                if (v.length !== EMBEDDING_DIMENSIONS) {
                    throw new Error(
                        `Expected ${EMBEDDING_DIMENSIONS} dimensions, got ${v.length}`
                    );
                }
            }
            return vectors;
        } catch (err) {
            const e = err as { status?: number; code?: number; message?: string };
            const status = e?.status ?? e?.code;
            // a per-DAY quota will not recover in a minute, so retrying is pointless
            const dailyQuota = status === 429 && /PerDay/i.test(e?.message ?? "");
            const retryable =
                !dailyQuota &&
                (status === 429 || (typeof status === "number" && status >= 500));
            if (!retryable || attempt >= MAX_RETRIES) throw err;

            const hinted = retryDelayMs(err);
            await sleep(Math.min(MAX_WAIT_MS, (hinted ?? 1000 * 2 ** attempt) + 1000));
        }
    }
}

// Used at upload time: turns book chunks into vectors
export async function embedDocuments(texts: string[]): Promise<number[][]> {
    const out: number[][] = [];
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE);
        await waitForBudget(estimateTokens(batch));
        out.push(...(await embedBatch(batch, "RETRIEVAL_DOCUMENT")));
    }
    return out;
}

// Used at question time: one short text, so it does not wait for the budget
export async function embedQuery(text: string): Promise<number[]> {
    const [vector] = await embedBatch([text], "RETRIEVAL_QUERY");
    if (!vector) throw new Error("Gemini returned no embedding for the query");
    return vector;
}

// Postgres expects vectors as the text "[0.1,0.2,...]"
export function toVectorLiteral(vector: number[]): string {
    return `[${vector.join(",")}]`;
}