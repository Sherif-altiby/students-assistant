-- CreateTable
CREATE TABLE "lesson_dates" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "teacher" TEXT NOT NULL,
    "dayName" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_dates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lesson_dates_user_id_dayName_idx" ON "lesson_dates"("user_id", "dayName");

-- AddForeignKey
ALTER TABLE "lesson_dates" ADD CONSTRAINT "lesson_dates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
