/*
  Warnings:

  - You are about to drop the `completed_habits` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `habits` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `study_chapters` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `study_days` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `study_lesson_completions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `study_lessons` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `study_subjects` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `study_tables` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `task_histories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tasks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "completed_habits" DROP CONSTRAINT "completed_habits_habit_id_fkey";

-- DropForeignKey
ALTER TABLE "completed_habits" DROP CONSTRAINT "completed_habits_user_id_fkey";

-- DropForeignKey
ALTER TABLE "habits" DROP CONSTRAINT "habits_user_id_fkey";

-- DropForeignKey
ALTER TABLE "study_chapters" DROP CONSTRAINT "study_chapters_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "study_days" DROP CONSTRAINT "study_days_study_table_id_fkey";

-- DropForeignKey
ALTER TABLE "study_lesson_completions" DROP CONSTRAINT "study_lesson_completions_lesson_id_fkey";

-- DropForeignKey
ALTER TABLE "study_lesson_completions" DROP CONSTRAINT "study_lesson_completions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "study_lessons" DROP CONSTRAINT "study_lessons_chapter_id_fkey";

-- DropForeignKey
ALTER TABLE "study_subjects" DROP CONSTRAINT "study_subjects_day_id_fkey";

-- DropForeignKey
ALTER TABLE "study_tables" DROP CONSTRAINT "study_tables_userId_fkey";

-- DropForeignKey
ALTER TABLE "task_histories" DROP CONSTRAINT "task_histories_taskId_fkey";

-- DropForeignKey
ALTER TABLE "task_histories" DROP CONSTRAINT "task_histories_userId_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_userId_fkey";

-- DropTable
DROP TABLE "completed_habits";

-- DropTable
DROP TABLE "habits";

-- DropTable
DROP TABLE "study_chapters";

-- DropTable
DROP TABLE "study_days";

-- DropTable
DROP TABLE "study_lesson_completions";

-- DropTable
DROP TABLE "study_lessons";

-- DropTable
DROP TABLE "study_subjects";

-- DropTable
DROP TABLE "study_tables";

-- DropTable
DROP TABLE "task_histories";

-- DropTable
DROP TABLE "tasks";

-- DropTable
DROP TABLE "users";

-- DropEnum
DROP TYPE "EducationLevel";

-- DropEnum
DROP TYPE "Gender";

-- DropEnum
DROP TYPE "StudyTableType";

-- DropEnum
DROP TYPE "TaskFrequency";

-- DropEnum
DROP TYPE "Track";
