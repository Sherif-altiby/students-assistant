/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[parent_phone]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_parent_phone_key" ON "users"("parent_phone");
