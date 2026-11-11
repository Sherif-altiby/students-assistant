-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('GENERAL_SECONDARY', 'AZHARI_SECONDARY');

-- CreateEnum
CREATE TYPE "Track" AS ENUM ('SCIENCE_MATH', 'SCIENCE_SCIENCE', 'SCIENCE', 'LITERARY');

-- CreateEnum
CREATE TYPE "StudyTableType" AS ENUM ('DATE_RANGE', 'NUMBER_OF_DAYS');

-- CreateEnum
CREATE TYPE "TaskFrequency" AS ENUM ('TODAY', 'EVERY_DAY');

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('LIKE', 'LOVE', 'SUPPORT');

-- CreateTable
CREATE TABLE "habits" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "habits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "completed_habits" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "habit_id" TEXT NOT NULL,

    CONSTRAINT "completed_habits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reply_to_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reactions" (
    "id" TEXT NOT NULL,
    "type" "ReactionType" NOT NULL,
    "user_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "frequency" "TaskFrequency" NOT NULL DEFAULT 'TODAY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_histories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "taskTitle" TEXT NOT NULL,
    "taskFrequency" "TaskFrequency" NOT NULL,

    CONSTRAINT "task_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '0000000000',
    "password" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "level" "EducationLevel" NOT NULL,
    "track" "Track" NOT NULL,
    "parent_phone" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "habits_user_id_idx" ON "habits"("user_id");

-- CreateIndex
CREATE INDEX "completed_habits_user_id_idx" ON "completed_habits"("user_id");

-- CreateIndex
CREATE INDEX "completed_habits_habit_id_idx" ON "completed_habits"("habit_id");

-- CreateIndex
CREATE UNIQUE INDEX "completed_habits_habit_id_date_key" ON "completed_habits"("habit_id", "date");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_user_id_message_id_key" ON "reactions"("user_id", "message_id");

-- CreateIndex
CREATE INDEX "study_days_study_table_id_idx" ON "study_days"("study_table_id");

-- CreateIndex
CREATE UNIQUE INDEX "study_days_study_table_id_date_key" ON "study_days"("study_table_id", "date");

-- CreateIndex
CREATE INDEX "study_lessons_chapter_id_idx" ON "study_lessons"("chapter_id");

-- CreateIndex
CREATE INDEX "study_lesson_completions_user_id_idx" ON "study_lesson_completions"("user_id");

-- CreateIndex
CREATE INDEX "study_lesson_completions_lesson_id_idx" ON "study_lesson_completions"("lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "study_lesson_completions_lesson_id_key" ON "study_lesson_completions"("lesson_id");

-- CreateIndex
CREATE INDEX "study_subjects_day_id_idx" ON "study_subjects"("day_id");

-- CreateIndex
CREATE INDEX "study_chapters_subject_id_idx" ON "study_chapters"("subject_id");

-- CreateIndex
CREATE INDEX "study_tables_userId_idx" ON "study_tables"("userId");

-- CreateIndex
CREATE INDEX "tasks_userId_idx" ON "tasks"("userId");

-- CreateIndex
CREATE INDEX "task_histories_userId_idx" ON "task_histories"("userId");

-- CreateIndex
CREATE INDEX "task_histories_taskId_idx" ON "task_histories"("taskId");

-- CreateIndex
CREATE INDEX "task_histories_date_idx" ON "task_histories"("date");

-- CreateIndex
CREATE UNIQUE INDEX "task_histories_taskId_date_key" ON "task_histories"("taskId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_parent_phone_key" ON "users"("parent_phone");

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "completed_habits" ADD CONSTRAINT "completed_habits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "completed_habits" ADD CONSTRAINT "completed_habits_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_days" ADD CONSTRAINT "study_days_study_table_id_fkey" FOREIGN KEY ("study_table_id") REFERENCES "study_tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_lessons" ADD CONSTRAINT "study_lessons_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "study_chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_lesson_completions" ADD CONSTRAINT "study_lesson_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_lesson_completions" ADD CONSTRAINT "study_lesson_completions_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "study_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_subjects" ADD CONSTRAINT "study_subjects_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "study_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_chapters" ADD CONSTRAINT "study_chapters_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "study_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_tables" ADD CONSTRAINT "study_tables_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_histories" ADD CONSTRAINT "task_histories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_histories" ADD CONSTRAINT "task_histories_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
