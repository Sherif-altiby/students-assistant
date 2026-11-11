-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "BookVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "BookModerationStatus" AS ENUM ('ACTIVE', 'HIDDEN');

-- CreateEnum
CREATE TYPE "BookProcessingStatus" AS ENUM ('UPLOADING', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "AiMessageRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "AiOperation" AS ENUM ('QUESTION', 'EXPLAIN_PAGE', 'SUMMARIZE', 'GENERATE_QUESTIONS', 'FLASHCARDS', 'CHECK_ANSWER', 'FOLLOW_UP');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'BOOK_READY';
ALTER TYPE "NotificationType" ADD VALUE 'BOOK_FAILED';

-- CreateTable
CREATE TABLE "ai_conversations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "book_id" TEXT,
    "book_title" TEXT NOT NULL,
    "title" TEXT,
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" "AiMessageRole" NOT NULL,
    "operation" "AiOperation",
    "content" TEXT NOT NULL,
    "cited_pages" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "start_page" INTEGER,
    "end_page" INTEGER,
    "input_tokens" INTEGER,
    "output_tokens" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "books" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "language" TEXT,
    "owner_id" TEXT NOT NULL,
    "subject_id" TEXT,
    "visibility" "BookVisibility" NOT NULL DEFAULT 'PRIVATE',
    "moderation" "BookModerationStatus" NOT NULL DEFAULT 'ACTIVE',
    "status" "BookProcessingStatus" NOT NULL DEFAULT 'UPLOADING',
    "failure_reason" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "page_count" INTEGER,
    "file_key" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_hash" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_pages" (
    "id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "page_number" INTEGER NOT NULL,
    "printed_label" TEXT,
    "text" TEXT NOT NULL,
    "low_quality" BOOLEAN NOT NULL DEFAULT false,
    "used_ocr" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "book_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_chunks" (
    "id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "page_number" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(768),

    CONSTRAINT "book_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_summary_cache" (
    "id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "start_page" INTEGER NOT NULL,
    "end_page" INTEGER NOT NULL,
    "language" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "book_summary_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_conversations_user_id_updated_at_idx" ON "ai_conversations"("user_id", "updated_at");

-- CreateIndex
CREATE INDEX "ai_conversations_book_id_idx" ON "ai_conversations"("book_id");

-- CreateIndex
CREATE INDEX "ai_messages_conversation_id_created_at_idx" ON "ai_messages"("conversation_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "books_file_key_key" ON "books"("file_key");

-- CreateIndex
CREATE INDEX "books_owner_id_idx" ON "books"("owner_id");

-- CreateIndex
CREATE INDEX "books_visibility_moderation_status_idx" ON "books"("visibility", "moderation", "status");

-- CreateIndex
CREATE INDEX "books_file_hash_idx" ON "books"("file_hash");

-- CreateIndex
CREATE UNIQUE INDEX "book_pages_book_id_page_number_key" ON "book_pages"("book_id", "page_number");

-- CreateIndex
CREATE INDEX "book_chunks_book_id_page_number_idx" ON "book_chunks"("book_id", "page_number");

-- CreateIndex
CREATE UNIQUE INDEX "book_summary_cache_book_id_start_page_end_page_language_key" ON "book_summary_cache"("book_id", "start_page", "end_page", "language");

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "study_subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_pages" ADD CONSTRAINT "book_pages_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_chunks" ADD CONSTRAINT "book_chunks_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_summary_cache" ADD CONSTRAINT "book_summary_cache_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Vector index for similarity search (cosine distance)
CREATE INDEX "book_chunks_embedding_idx"
ON "book_chunks" USING hnsw ("embedding" vector_cosine_ops);