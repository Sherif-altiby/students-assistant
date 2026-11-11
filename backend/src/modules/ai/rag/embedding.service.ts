// src/modules/ai/rag/embedding.service.ts

const MODEL = "gemini-embedding-001";

// Must match vector(768) in book.prisma. Never change one without the other.
export const EMBEDDING_DIMENSIONS = 768;

const BATCH_SIZE = 20;
const MAX_RETRIES = 4;

type EmbeddingTask = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

// @google/genai is ESM-only and this project is CommonJS,
// so the library is loaded with a dynamic import().
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
        // if creation failed, allow a retry on the next call
        clientPromise.catch(() => {
            clientPromise = null;
        });
    }
    return clientPromise;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
            const e = err as { status?: number; code?: number };
            const status = e?.status ?? e?.code;
            const retryable =
                status === 429 || (typeof status === "number" && status >= 500);
            if (!retryable || attempt >= MAX_RETRIES) throw err;
            await sleep(1000 * 2 ** attempt); // 1s, 2s, 4s, 8s
        }
    }
}

// Used at upload time: turns book chunks into vectors
export async function embedDocuments(texts: string[]): Promise<number[][]> {
    const out: number[][] = [];
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE);
        out.push(...(await embedBatch(batch, "RETRIEVAL_DOCUMENT")));
    }
    return out;
}

// Used at question time: turns the student's question into a vector
export async function embedQuery(text: string): Promise<number[]> {
    const [vector] = await embedBatch([text], "RETRIEVAL_QUERY");
    if (!vector) throw new Error("Embedding service returned no vector");
    return vector;
}

// Postgres expects vectors as the text "[0.1,0.2,...]"
export function toVectorLiteral(vector: number[]): string {
    return `[${vector.join(",")}]`;
}