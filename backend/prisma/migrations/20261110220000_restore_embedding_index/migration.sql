-- Restore vector index for similarity search (cosine distance)
CREATE INDEX IF NOT EXISTS "book_chunks_embedding_idx"
ON "book_chunks" USING hnsw ("embedding" vector_cosine_ops);