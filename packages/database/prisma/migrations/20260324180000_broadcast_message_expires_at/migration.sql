
DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'BroadcastMessage'
      AND column_name = 'expiresAt'
  ) THEN
    ALTER TABLE "BroadcastMessage" ADD COLUMN "expiresAt" TIMESTAMP(3);
  END IF;
END
$migration$;

-- Backfill: historical rows used a 10-minute window from createdAt
UPDATE "BroadcastMessage"
SET "expiresAt" = "createdAt" + INTERVAL '10 minutes'
WHERE "expiresAt" IS NULL;

ALTER TABLE "BroadcastMessage" ALTER COLUMN "expiresAt" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "BroadcastMessage_expiresAt_idx" ON "BroadcastMessage"("expiresAt");

CREATE INDEX IF NOT EXISTS "BroadcastMessage_status_expiresAt_idx" ON "BroadcastMessage"("status", "expiresAt");
