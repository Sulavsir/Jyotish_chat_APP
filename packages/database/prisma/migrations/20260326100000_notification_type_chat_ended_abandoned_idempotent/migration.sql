
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'NotificationType'
      AND e.enumlabel = 'CHAT_ENDED'
  ) THEN
    ALTER TYPE "NotificationType" ADD VALUE 'CHAT_ENDED';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'NotificationType'
      AND e.enumlabel = 'CHAT_ABANDONED'
  ) THEN
    ALTER TYPE "NotificationType" ADD VALUE 'CHAT_ABANDONED';
  END IF;
END $$;

ALTER TABLE "AstrologerCoinEarning" ADD COLUMN IF NOT EXISTS "sourceDetail" TEXT;
