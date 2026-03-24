-- AlterTable
ALTER TABLE "BroadcastMessage" ADD COLUMN "expiresAt" TIMESTAMP(3);

-- Backfill: historical rows used a 10-minute window from createdAt
UPDATE "BroadcastMessage"
SET "expiresAt" = "createdAt" + INTERVAL '10 minutes'
WHERE "expiresAt" IS NULL;

ALTER TABLE "BroadcastMessage" ALTER COLUMN "expiresAt" SET NOT NULL;

-- CreateIndex
CREATE INDEX "BroadcastMessage_expiresAt_idx" ON "BroadcastMessage"("expiresAt");

-- CreateIndex
CREATE INDEX "BroadcastMessage_status_expiresAt_idx" ON "BroadcastMessage"("status", "expiresAt");
