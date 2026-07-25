/*
  Warnings:

  - A unique constraint covering the columns `[invitation_token]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'DOCTOR');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "invitation_token" TEXT,
ADD COLUMN     "invitation_token_expires_at" TIMESTAMP(3),
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER',
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "phone" DROP DEFAULT,
ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "gender" DROP NOT NULL,
ALTER COLUMN "level" DROP NOT NULL,
ALTER COLUMN "track" DROP NOT NULL,
ALTER COLUMN "parent_phone" DROP NOT NULL,
ALTER COLUMN "country" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_invitation_token_key" ON "users"("invitation_token");
