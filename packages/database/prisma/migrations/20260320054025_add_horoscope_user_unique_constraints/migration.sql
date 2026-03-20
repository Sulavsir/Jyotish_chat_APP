/*
  Warnings:

  - A unique constraint covering the columns `[zodiacSign,date,category,language]` on the table `Horoscope` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[googleId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `location` to the `JyotishBookingRequest` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('MOBILE', 'DESKTOP');

-- CreateEnum
CREATE TYPE "AstrologerAccountStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'CHAT_ABANDONED';
ALTER TYPE "AuditAction" ADD VALUE 'CHAT_UNBLOCKED';
ALTER TYPE "AuditAction" ADD VALUE 'BROADCAST_MESSAGE_DISMISS';
ALTER TYPE "AuditAction" ADD VALUE 'COMPLAINT_CREATE';
ALTER TYPE "AuditAction" ADD VALUE 'COMPLAINT_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE 'COMPLAINT_RESOLVE';
ALTER TYPE "AuditAction" ADD VALUE 'COMPLAINT_DISMISS';
ALTER TYPE "AuditAction" ADD VALUE 'COMPLAINT_ESCALATE';
ALTER TYPE "AuditAction" ADD VALUE 'RATING_CREATE';

-- AlterEnum
ALTER TYPE "PlatformCoinRateType" ADD VALUE 'FIRST_BROADCAST_DISCOUNT';

-- DropIndex
DROP INDEX "Horoscope_zodiacSign_date_category_key";

-- DropIndex
DROP INDEX "Horoscope_zodiacSign_date_idx";

-- AlterTable
ALTER TABLE "Astrologer" ADD COLUMN     "accountStatus" "AstrologerAccountStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "inhouseAstrologer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "proofOfAstrology" TEXT,
ADD COLUMN     "registrationRequestedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionReason" TEXT;

-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "abandonReason" TEXT,
ADD COLUMN     "abandonedAt" TIMESTAMP(3),
ADD COLUMN     "abandonedBy" TEXT,
ADD COLUMN     "isAbandonedByAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastAstrologerReplyAt" TIMESTAMP(3),
ADD COLUMN     "lastClientMessageAt" TIMESTAMP(3),
ADD COLUMN     "turnBasedEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "waitingForReply" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "FonepayTransaction" ALTER COLUMN "type" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Horoscope" ALTER COLUMN "language" SET DEFAULT 'NEPALI';

-- AlterTable
ALTER TABLE "JyotishBookingRequest" ADD COLUMN     "location" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "currency" SET DEFAULT 'NPR';

-- AlterTable
ALTER TABLE "PricingPlan" ADD COLUMN     "coinPrice" INTEGER;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "deviceId" TEXT,
ADD COLUMN     "deviceName" TEXT,
ADD COLUMN     "deviceType" "DeviceType";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "gender" "Gender",
ADD COLUMN     "googleId" TEXT,
ALTER COLUMN "phone" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Astrologer_accountStatus_idx" ON "Astrologer"("accountStatus");

-- CreateIndex
CREATE INDEX "Chat_isAbandonedByAdmin_idx" ON "Chat"("isAbandonedByAdmin");

-- CreateIndex
CREATE INDEX "Chat_waitingForReply_idx" ON "Chat"("waitingForReply");

-- CreateIndex
CREATE INDEX "Horoscope_zodiacSign_date_category_language_idx" ON "Horoscope"("zodiacSign", "date", "category", "language");

-- CreateIndex
CREATE UNIQUE INDEX "Horoscope_zodiacSign_date_category_language_key" ON "Horoscope"("zodiacSign", "date", "category", "language");

-- CreateIndex
CREATE INDEX "Session_userId_deviceType_isRevoked_idx" ON "Session"("userId", "deviceType", "isRevoked");

-- CreateIndex
CREATE INDEX "Session_astrologerId_deviceType_isRevoked_idx" ON "Session"("astrologerId", "deviceType", "isRevoked");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
