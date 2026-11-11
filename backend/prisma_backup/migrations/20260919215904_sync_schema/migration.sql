/*
  Warnings:

  - The values [GENERAL_SECONDARY,AZHARI_SECONDARY] on the enum `EducationLevel` will be removed. If these variants are still used in the database, this will fail.
  - The values [SCIENCE_MATH,SCIENCE_SCIENCE,SCIENCE,LITERARY] on the enum `Track` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `gender` on the `users` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EducationLevel_new" AS ENUM ('SECONDARY_GENERAL', 'SECONDARY_AZHARI', 'BACHELOR');
ALTER TABLE "users" ALTER COLUMN "level" TYPE "EducationLevel_new" USING ("level"::text::"EducationLevel_new");
ALTER TYPE "EducationLevel" RENAME TO "EducationLevel_old";
ALTER TYPE "EducationLevel_new" RENAME TO "EducationLevel";
DROP TYPE "public"."EducationLevel_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Track_new" AS ENUM ('SECONDARY_FIRST_YEAR', 'SECONDARY_SECOND_YEAR', 'SECONDARY_THIRD_SCIENCE_MATH', 'SECONDARY_THIRD_SCIENCE_SCIENCE', 'SECONDARY_THIRD_LITERARY', 'BACHELOR_FIRST_YEAR', 'BACHELOR_SECOND_MEDICAL', 'BACHELOR_SECOND_BUSINESS', 'BACHELOR_SECOND_ARTS');
ALTER TABLE "users" ALTER COLUMN "track" TYPE "Track_new" USING ("track"::text::"Track_new");
ALTER TYPE "Track" RENAME TO "Track_old";
ALTER TYPE "Track_new" RENAME TO "Track";
DROP TYPE "public"."Track_old";
COMMIT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "gender";

-- DropEnum
DROP TYPE "Gender";
