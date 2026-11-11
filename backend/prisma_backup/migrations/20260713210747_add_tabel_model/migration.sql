-- CreateEnum
CREATE TYPE "StudyTableType" AS ENUM ('DATE_RANGE', 'NUMBER_OF_DAYS');

-- CreateTable
CREATE TABLE "study_tables" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "StudyTableType" NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_days" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "study_table_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_subjects" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "day_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_chapters" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_lessons" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "chapter_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_lesson_completions" (
    "id" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,

    CONSTRAINT "study_lesson_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "study_tables_userId_idx" ON "study_tables"("userId");

-- CreateIndex
CREATE INDEX "study_days_study_table_id_idx" ON "study_days"("study_table_id");

-- CreateIndex
CREATE UNIQUE INDEX "study_days_study_table_id_date_key" ON "study_days"("study_table_id", "date");

-- CreateIndex
CREATE INDEX "study_subjects_day_id_idx" ON "study_subjects"("day_id");

-- CreateIndex
CREATE INDEX "study_chapters_subject_id_idx" ON "study_chapters"("subject_id");

-- CreateIndex
CREATE INDEX "study_lessons_chapter_id_idx" ON "study_lessons"("chapter_id");

-- CreateIndex
CREATE INDEX "study_lesson_completions_user_id_idx" ON "study_lesson_completions"("user_id");

-- CreateIndex
CREATE INDEX "study_lesson_completions_lesson_id_idx" ON "study_lesson_completions"("lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "study_lesson_completions_lesson_id_key" ON "study_lesson_completions"("lesson_id");

-- AddForeignKey
ALTER TABLE "study_tables" ADD CONSTRAINT "study_tables_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_days" ADD CONSTRAINT "study_days_study_table_id_fkey" FOREIGN KEY ("study_table_id") REFERENCES "study_tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_subjects" ADD CONSTRAINT "study_subjects_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "study_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_chapters" ADD CONSTRAINT "study_chapters_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "study_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_lessons" ADD CONSTRAINT "study_lessons_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "study_chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_lesson_completions" ADD CONSTRAINT "study_lesson_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_lesson_completions" ADD CONSTRAINT "study_lesson_completions_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "study_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
