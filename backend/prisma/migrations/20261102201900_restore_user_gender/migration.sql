CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

ALTER TABLE "users"
ADD COLUMN "gender" "Gender";
