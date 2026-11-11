/*
  Warnings:

  - You are about to drop the column `createdAt` on the `lesson_dates` table. All the data in the column will be lost.
  - You are about to drop the column `dayName` on the `lesson_dates` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `lesson_dates` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `lesson_dates` table. All the data in the column will be lost.
  - Added the required column `day_of_week` to the `lesson_dates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `end_time` to the `lesson_dates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_time` to the `lesson_dates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `lesson_dates` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "lesson_dates_user_id_dayName_idx";

-- AlterTable
ALTER TABLE "lesson_dates" DROP COLUMN "createdAt",
DROP COLUMN "dayName",
DROP COLUMN "endTime",
DROP COLUMN "startTime",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "day_of_week" "DayOfWeek" NOT NULL,
ADD COLUMN     "end_time" TEXT NOT NULL,
ADD COLUMN     "start_time" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "lesson_dates_user_id_idx" ON "lesson_dates"("user_id");

-- CreateIndex
CREATE INDEX "lesson_dates_user_id_day_of_week_idx" ON "lesson_dates"("user_id", "day_of_week");
