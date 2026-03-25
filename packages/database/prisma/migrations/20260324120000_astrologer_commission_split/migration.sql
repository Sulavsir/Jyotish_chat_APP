-- Split single commissionRate into per-source commission percentages (default 10%).

ALTER TABLE "Astrologer" ADD COLUMN "chatMessageCommissionPercent" DOUBLE PRECISION NOT NULL DEFAULT 10;
ALTER TABLE "Astrologer" ADD COLUMN "broadcastMessageCommissionPercent" DOUBLE PRECISION NOT NULL DEFAULT 10;
ALTER TABLE "Astrologer" ADD COLUMN "firstBroadcastCommissionPercent" DOUBLE PRECISION NOT NULL DEFAULT 10;
ALTER TABLE "Astrologer" ADD COLUMN "kundaliReviewCommissionPercent" DOUBLE PRECISION NOT NULL DEFAULT 10;
ALTER TABLE "Astrologer" ADD COLUMN "appointmentCommissionPercent" DOUBLE PRECISION NOT NULL DEFAULT 10;

-- Preserve legacy single rate when > 0; otherwise use platform default 10%.
UPDATE "Astrologer"
SET
  "chatMessageCommissionPercent" = CASE WHEN "commissionRate" > 0 THEN "commissionRate" ELSE 10 END,
  "broadcastMessageCommissionPercent" = CASE WHEN "commissionRate" > 0 THEN "commissionRate" ELSE 10 END,
  "firstBroadcastCommissionPercent" = CASE WHEN "commissionRate" > 0 THEN "commissionRate" ELSE 10 END,
  "kundaliReviewCommissionPercent" = CASE WHEN "commissionRate" > 0 THEN "commissionRate" ELSE 10 END,
  "appointmentCommissionPercent" = CASE WHEN "commissionRate" > 0 THEN "commissionRate" ELSE 10 END;

ALTER TABLE "Astrologer" DROP COLUMN "commissionRate";
