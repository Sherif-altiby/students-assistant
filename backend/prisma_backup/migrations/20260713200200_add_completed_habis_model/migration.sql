/*
  Warnings:

  - You are about to drop the column `completed` on the `habits` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "habits" DROP COLUMN "completed";

-- CreateTable
CREATE TABLE "completed_habits" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "habit_id" TEXT NOT NULL,

    CONSTRAINT "completed_habits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "completed_habits_user_id_idx" ON "completed_habits"("user_id");

-- CreateIndex
CREATE INDEX "completed_habits_habit_id_idx" ON "completed_habits"("habit_id");

-- CreateIndex
CREATE UNIQUE INDEX "completed_habits_habit_id_date_key" ON "completed_habits"("habit_id", "date");

-- AddForeignKey
ALTER TABLE "completed_habits" ADD CONSTRAINT "completed_habits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "completed_habits" ADD CONSTRAINT "completed_habits_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
