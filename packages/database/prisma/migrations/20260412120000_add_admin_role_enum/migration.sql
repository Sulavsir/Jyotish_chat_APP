-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('FULL', 'USER_SUPPORT');

-- AlterTable
ALTER TABLE "Admin" ADD COLUMN "adminRole" "AdminRole" NOT NULL DEFAULT 'FULL';
