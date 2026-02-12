-- CreateEnum
CREATE TYPE "PlatformCoinRateType" AS ENUM ('CHAT_PER_MESSAGE', 'BROADCAST_PER_MESSAGE', 'BROADCAST_SEND', 'APPOINTMENT');

-- CreateEnum
CREATE TYPE "AstrologerCoinEarningSource" AS ENUM ('CHAT_MESSAGE', 'BROADCAST_MESSAGE', 'APPOINTMENT');

-- CreateTable
CREATE TABLE "PlatformCoinRate" (
    "id" TEXT NOT NULL,
    "rateType" "PlatformCoinRateType" NOT NULL,
    "coins" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformCoinRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AstrologerCoinEarning" (
    "id" TEXT NOT NULL,
    "astrologerId" TEXT NOT NULL,
    "coinTransactionId" TEXT,
    "chatId" TEXT,
    "broadcastMessageId" TEXT,
    "appointmentId" TEXT,
    "source" "AstrologerCoinEarningSource" NOT NULL,
    "clientCoinsDeducted" INTEGER NOT NULL,
    "commissionPercent" DOUBLE PRECISION NOT NULL,
    "astrologerCoinsEarned" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AstrologerCoinEarning_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformCoinRate_rateType_key" ON "PlatformCoinRate"("rateType");

-- CreateIndex
CREATE INDEX "PlatformCoinRate_rateType_idx" ON "PlatformCoinRate"("rateType");

-- CreateIndex
CREATE INDEX "AstrologerCoinEarning_astrologerId_idx" ON "AstrologerCoinEarning"("astrologerId");

-- CreateIndex
CREATE INDEX "AstrologerCoinEarning_createdAt_idx" ON "AstrologerCoinEarning"("createdAt");

-- CreateIndex
CREATE INDEX "AstrologerCoinEarning_astrologerId_createdAt_idx" ON "AstrologerCoinEarning"("astrologerId", "createdAt");

-- AddForeignKey
ALTER TABLE "AstrologerCoinEarning" ADD CONSTRAINT "AstrologerCoinEarning_astrologerId_fkey" FOREIGN KEY ("astrologerId") REFERENCES "Astrologer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

--  Defaults when admin has not set: chat 200, broadcast 100, appointment 300.
INSERT INTO "PlatformCoinRate" ("id", "rateType", "coins", "description", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), 'CHAT_PER_MESSAGE', 200, 'Coins per message in direct chat', NOW(), NOW()),
  (gen_random_uuid(), 'BROADCAST_PER_MESSAGE', 100, 'Coins per message in broadcast-accepted chat', NOW(), NOW()),
  (gen_random_uuid(), 'BROADCAST_SEND', 100, 'Coins to send a broadcast message', NOW(), NOW()),
  (gen_random_uuid(), 'APPOINTMENT', 300, 'Coins for appointment', NOW(), NOW())
ON CONFLICT ("rateType") DO NOTHING;
