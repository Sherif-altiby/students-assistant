ALTER TYPE "Role" ADD VALUE 'PARENT';

CREATE TYPE "ParentStudentLinkStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED');

DROP INDEX IF EXISTS "users_parent_phone_key";
CREATE INDEX "users_parent_phone_idx" ON "users"("parent_phone");

CREATE TABLE "parent_student_links" (
  "id" TEXT NOT NULL,
  "parent_id" TEXT NOT NULL,
  "student_id" TEXT NOT NULL,
  "status" "ParentStudentLinkStatus" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "parent_student_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "parent_student_links_parent_id_student_id_key"
  ON "parent_student_links"("parent_id", "student_id");
CREATE INDEX "parent_student_links_parent_id_status_idx"
  ON "parent_student_links"("parent_id", "status");
CREATE INDEX "parent_student_links_student_id_status_idx"
  ON "parent_student_links"("student_id", "status");

ALTER TABLE "parent_student_links"
  ADD CONSTRAINT "parent_student_links_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "parent_student_links_student_id_fkey"
  FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
