ALTER TABLE "study_tables"
ADD COLUMN "selected_lesson_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
