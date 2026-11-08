ALTER TABLE "users"
  DROP COLUMN "level",
  DROP COLUMN "track";

DROP TYPE "EducationLevel";
DROP TYPE "Track";

DROP INDEX "study_subjects_title_key";

ALTER TABLE "study_subjects"
  ADD COLUMN "owner_id" TEXT;

CREATE UNIQUE INDEX "study_subjects_owner_id_title_key"
  ON "study_subjects"("owner_id", "title");
CREATE INDEX "study_subjects_owner_id_idx"
  ON "study_subjects"("owner_id");

ALTER TABLE "study_subjects"
  ADD CONSTRAINT "study_subjects_owner_id_fkey"
  FOREIGN KEY ("owner_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
