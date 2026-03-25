-- Idempotent repair for Astrologer commission columns.
--
-- The original split migration (20260324120000) added five *CommissionPercent columns,
-- copied values from legacy "commissionRate", then dropped "commissionRate".
-- This migration is safe if that migration already ran (no-op) or if the DB is in a
-- partial/broken state.
--
-- Why copy from commissionRate when it exists: existing astrologers had one stored rate;
-- without copying, all would default to 10% and future coin splits would diverge from
-- their previous single-rate setting. Historical AstrologerCoinEarning rows are unchanged.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Astrologer' AND column_name = 'chatMessageCommissionPercent'
  ) THEN
    ALTER TABLE "Astrologer" ADD COLUMN "chatMessageCommissionPercent" DOUBLE PRECISION NOT NULL DEFAULT 10;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Astrologer' AND column_name = 'broadcastMessageCommissionPercent'
  ) THEN
    ALTER TABLE "Astrologer" ADD COLUMN "broadcastMessageCommissionPercent" DOUBLE PRECISION NOT NULL DEFAULT 10;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Astrologer' AND column_name = 'firstBroadcastCommissionPercent'
  ) THEN
    ALTER TABLE "Astrologer" ADD COLUMN "firstBroadcastCommissionPercent" DOUBLE PRECISION NOT NULL DEFAULT 10;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Astrologer' AND column_name = 'kundaliReviewCommissionPercent'
  ) THEN
    ALTER TABLE "Astrologer" ADD COLUMN "kundaliReviewCommissionPercent" DOUBLE PRECISION NOT NULL DEFAULT 10;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Astrologer' AND column_name = 'appointmentCommissionPercent'
  ) THEN
    ALTER TABLE "Astrologer" ADD COLUMN "appointmentCommissionPercent" DOUBLE PRECISION NOT NULL DEFAULT 10;
  END IF;
END $$;

-- One-time backfill from legacy column only if it is still present (e.g. migration order issues or manual DB edits).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Astrologer' AND column_name = 'commissionRate'
  ) THEN
    UPDATE "Astrologer"
    SET
      "chatMessageCommissionPercent" = CASE WHEN "commissionRate" > 0 THEN "commissionRate" ELSE 10 END,
      "broadcastMessageCommissionPercent" = CASE WHEN "commissionRate" > 0 THEN "commissionRate" ELSE 10 END,
      "firstBroadcastCommissionPercent" = CASE WHEN "commissionRate" > 0 THEN "commissionRate" ELSE 10 END,
      "kundaliReviewCommissionPercent" = CASE WHEN "commissionRate" > 0 THEN "commissionRate" ELSE 10 END,
      "appointmentCommissionPercent" = CASE WHEN "commissionRate" > 0 THEN "commissionRate" ELSE 10 END;

    ALTER TABLE "Astrologer" DROP COLUMN "commissionRate";
  END IF;
END $$;
