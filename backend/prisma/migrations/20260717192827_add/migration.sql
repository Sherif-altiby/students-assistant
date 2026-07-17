/*
  Warnings:

  - You are about to drop the `completed_tasks` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "completed_tasks" DROP CONSTRAINT "completed_tasks_taskId_fkey";

-- DropForeignKey
ALTER TABLE "completed_tasks" DROP CONSTRAINT "completed_tasks_userId_fkey";

-- DropTable
DROP TABLE "completed_tasks";

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

-- CreateIndex
CREATE INDEX "task_histories_userId_idx" ON "task_histories"("userId");

-- CreateIndex
CREATE INDEX "task_histories_taskId_idx" ON "task_histories"("taskId");

-- CreateIndex
CREATE INDEX "task_histories_date_idx" ON "task_histories"("date");

-- CreateIndex
CREATE UNIQUE INDEX "task_histories_taskId_date_key" ON "task_histories"("taskId", "date");

-- AddForeignKey
ALTER TABLE "task_histories" ADD CONSTRAINT "task_histories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_histories" ADD CONSTRAINT "task_histories_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
