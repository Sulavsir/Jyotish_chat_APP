-- Insert default KUNDALI_MATCH coin rate (must be separate - PostgreSQL enum ADD VALUE must commit first)
INSERT INTO "PlatformCoinRate" ("id", "rateType", "coins", "description", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'KUNDALI_MATCH', 300, 'Coins for Kundali Match request', NOW(), NOW())
ON CONFLICT ("rateType") DO NOTHING;
