CREATE TYPE "StudyTableType_new" AS ENUM ('WEEKLY', 'MONTHLY', 'CUSTOM', 'GLOBAL');
ALTER TABLE "study_tables"
  ALTER COLUMN "type" TYPE "StudyTableType_new"
  USING (
    CASE
      WHEN "type"::text IN ('DATE_RANGE', 'NUMBER_OF_DAYS') THEN 'CUSTOM'
      ELSE "type"::text
    END
  )::"StudyTableType_new";
DROP TYPE "StudyTableType";
ALTER TYPE "StudyTableType_new" RENAME TO "StudyTableType";

ALTER TABLE "study_tables"
  ADD COLUMN "month" INTEGER,
  ADD COLUMN "year" INTEGER,
  ADD COLUMN "all_subjects" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "users"
  ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Africa/Cairo';

DROP TABLE "study_day_lessons";
DROP TABLE "study_day_subjects";

CREATE TYPE "NotificationType" AS ENUM ('LATE_STUDY', 'DATE_CONFLICT');

CREATE TABLE "study_table_subjects" (
  "id" TEXT NOT NULL,
  "study_table_id" TEXT NOT NULL,
  "subject_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "study_table_subjects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "study_sessions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "study_table_id" TEXT NOT NULL,
  "day_id" TEXT NOT NULL,
  "subject_id" TEXT NOT NULL,
  "lesson_id" TEXT NOT NULL,
  "start_at" TIMESTAMPTZ(3) NOT NULL,
  "end_at" TIMESTAMPTZ(3) NOT NULL,
  "completed_at" TIMESTAMPTZ(3),
  "late_notified_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "data" JSONB,
  "dedupe_key" TEXT,
  "read_at" TIMESTAMP(3),
  "resolved_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "study_table_subjects_study_table_id_subject_id_key"
  ON "study_table_subjects"("study_table_id", "subject_id");
CREATE INDEX "study_table_subjects_subject_id_idx"
  ON "study_table_subjects"("subject_id");
CREATE UNIQUE INDEX "study_sessions_study_table_id_lesson_id_key"
  ON "study_sessions"("study_table_id", "lesson_id");
CREATE INDEX "study_sessions_user_id_start_at_end_at_idx"
  ON "study_sessions"("user_id", "start_at", "end_at");
CREATE INDEX "study_sessions_day_id_idx" ON "study_sessions"("day_id");
CREATE INDEX "study_sessions_subject_id_idx" ON "study_sessions"("subject_id");
CREATE INDEX "study_sessions_lesson_id_idx" ON "study_sessions"("lesson_id");
ALTER TABLE "study_sessions"
  ADD CONSTRAINT "study_sessions_duration_check"
  CHECK (
    "end_at" > "start_at"
    AND "end_at" - "start_at" >= INTERVAL '5 minutes'
    AND "end_at" - "start_at" <= INTERVAL '8 hours'
  );
CREATE UNIQUE INDEX "notifications_dedupe_key_key" ON "notifications"("dedupe_key");
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");
CREATE INDEX "notifications_user_id_type_resolved_at_idx"
  ON "notifications"("user_id", "type", "resolved_at");

ALTER TABLE "study_table_subjects"
  ADD CONSTRAINT "study_table_subjects_study_table_id_fkey"
  FOREIGN KEY ("study_table_id") REFERENCES "study_tables"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "study_table_subjects_subject_id_fkey"
  FOREIGN KEY ("subject_id") REFERENCES "study_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_sessions"
  ADD CONSTRAINT "study_sessions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "study_sessions_study_table_id_fkey"
  FOREIGN KEY ("study_table_id") REFERENCES "study_tables"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "study_sessions_day_id_fkey"
  FOREIGN KEY ("day_id") REFERENCES "study_days"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "study_sessions_subject_id_fkey"
  FOREIGN KEY ("subject_id") REFERENCES "study_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "study_sessions_lesson_id_fkey"
  FOREIGN KEY ("lesson_id") REFERENCES "study_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
