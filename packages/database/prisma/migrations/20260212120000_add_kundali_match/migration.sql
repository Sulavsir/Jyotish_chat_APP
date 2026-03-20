-- Add KUNDALI_MATCH to PlatformCoinRateType
ALTER TYPE "PlatformCoinRateType" ADD VALUE 'KUNDALI_MATCH';

-- CreateEnum KundaliMatchStatus
CREATE TYPE "KundaliMatchStatus" AS ENUM ('PENDING', 'REVIEWED');

-- CreateTable KundaliMatchRequest
CREATE TABLE "KundaliMatchRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "boyDateOfBirth" TIMESTAMP(3) NOT NULL,
    "boyTimeOfBirth" TEXT NOT NULL,
    "boyPlaceOfBirth" TEXT NOT NULL,
    "girlDateOfBirth" TIMESTAMP(3) NOT NULL,
    "girlTimeOfBirth" TEXT NOT NULL,
    "girlPlaceOfBirth" TEXT NOT NULL,
    "status" "KundaliMatchStatus" NOT NULL DEFAULT 'PENDING',
    "adminReviewMessage" TEXT,
    "coinsDeducted" INTEGER NOT NULL,
    "coinTransactionId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KundaliMatchRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KundaliMatchRequest_userId_idx" ON "KundaliMatchRequest"("userId");
CREATE INDEX "KundaliMatchRequest_status_idx" ON "KundaliMatchRequest"("status");
CREATE INDEX "KundaliMatchRequest_createdAt_idx" ON "KundaliMatchRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "KundaliMatchRequest" ADD CONSTRAINT "KundaliMatchRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KundaliMatchRequest" ADD CONSTRAINT "KundaliMatchRequest_reviewedByAdminId_fkey" FOREIGN KEY ("reviewedByAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Note: INSERT for KUNDALI_MATCH moved to next migration (PostgreSQL enum ADD VALUE must commit first).
