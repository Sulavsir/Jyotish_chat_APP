-- Insert default KUNDALI_REVIEW coin rate (must be in separate migration - PostgreSQL
-- cannot use a newly added enum value in the same transaction as ALTER TYPE ADD VALUE)
INSERT INTO "PlatformCoinRate" ("id", "rateType", "coins", "description", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'KUNDALI_REVIEW', 500, 'Coins for Full Kundali Review', NOW(), NOW())
ON CONFLICT ("rateType") DO NOTHING;
