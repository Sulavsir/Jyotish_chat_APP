-- Insert default COINS_PER_NPR coin rate (must be separate - PostgreSQL enum ADD VALUE must commit first)
INSERT INTO "PlatformCoinRate" ("id", "rateType", "coins", "description", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'COINS_PER_NPR', 1, 'Purchase rate: coins per NPR (e.g., 1 = 1 coin per NPR, 2 = 2 coins per NPR)', NOW(), NOW())
ON CONFLICT ("rateType") DO NOTHING;
