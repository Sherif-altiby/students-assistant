ALTER TABLE "study_tables"
  ADD COLUMN "study_weekdays" INTEGER[] NOT NULL DEFAULT ARRAY[0, 1, 2, 3, 4, 5, 6],
  ADD COLUMN "max_sessions_per_day" INTEGER NOT NULL DEFAULT 3;

ALTER TABLE "study_sessions"
  ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

WITH ordered_sessions AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (PARTITION BY "day_id" ORDER BY "start_at", "created_at", "id") - 1 AS "position"
  FROM "study_sessions"
)
UPDATE "study_sessions" AS session
SET "order" = ordered_sessions."position"
FROM ordered_sessions
WHERE session."id" = ordered_sessions."id";

ALTER TABLE "study_sessions"
  DROP CONSTRAINT IF EXISTS "study_sessions_duration_check",
  DROP COLUMN "start_at",
  DROP COLUMN "end_at";

DROP INDEX IF EXISTS "study_sessions_user_id_start_at_end_at_idx";

CREATE INDEX "study_sessions_completed_at_late_notified_at_idx"
  ON "study_sessions"("completed_at", "late_notified_at");

CREATE INDEX "study_days_date_idx" ON "study_days"("date");
