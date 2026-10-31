/*
  Warnings:

  - You are about to drop the column `day_id` on the `study_subjects` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,lesson_id]` on the table `study_lesson_completions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[title]` on the table `study_subjects` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "study_subjects" DROP CONSTRAINT "study_subjects_day_id_fkey";

-- DropIndex
DROP INDEX "study_lesson_completions_lesson_id_key";

-- DropIndex
DROP INDEX "study_subjects_day_id_idx";

-- AlterTable
ALTER TABLE "study_chapters" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "parent_id" TEXT;

-- AlterTable
ALTER TABLE "study_lessons" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "parent_id" TEXT;

-- AlterTable
ALTER TABLE "study_subjects" DROP COLUMN "day_id";

-- CreateTable
CREATE TABLE "study_day_subjects" (
    "id" TEXT NOT NULL,
    "day_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_day_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_day_lessons" (
    "id" TEXT NOT NULL,
    "day_subject_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,

    CONSTRAINT "study_day_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "study_day_subjects_day_id_idx" ON "study_day_subjects"("day_id");

-- CreateIndex
CREATE INDEX "study_day_subjects_subject_id_idx" ON "study_day_subjects"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "study_day_subjects_day_id_subject_id_key" ON "study_day_subjects"("day_id", "subject_id");

-- CreateIndex
CREATE INDEX "study_day_lessons_lesson_id_idx" ON "study_day_lessons"("lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "study_day_lessons_day_subject_id_lesson_id_key" ON "study_day_lessons"("day_subject_id", "lesson_id");

-- CreateIndex
CREATE INDEX "study_chapters_parent_id_idx" ON "study_chapters"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "study_lesson_completions_user_id_lesson_id_key" ON "study_lesson_completions"("user_id", "lesson_id");

-- CreateIndex
CREATE INDEX "study_lessons_parent_id_idx" ON "study_lessons"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "study_subjects_title_key" ON "study_subjects"("title");

-- AddForeignKey
ALTER TABLE "study_day_subjects" ADD CONSTRAINT "study_day_subjects_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "study_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_day_subjects" ADD CONSTRAINT "study_day_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "study_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_day_lessons" ADD CONSTRAINT "study_day_lessons_day_subject_id_fkey" FOREIGN KEY ("day_subject_id") REFERENCES "study_day_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_day_lessons" ADD CONSTRAINT "study_day_lessons_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "study_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_lessons" ADD CONSTRAINT "study_lessons_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "study_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_chapters" ADD CONSTRAINT "study_chapters_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "study_chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
