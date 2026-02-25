-- Add COINS_PER_NPR to PlatformCoinRateType
ALTER TYPE "PlatformCoinRateType" ADD VALUE 'COINS_PER_NPR';

-- Insert default COINS_PER_NPR coin rate (1 = 1 coin per NPR, meaning 1 coin = 1 NPR)
INSERT INTO "PlatformCoinRate" ("id", "rateType", "coins", "description", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'COINS_PER_NPR', 1, 'Purchase rate: coins per NPR (e.g., 1 = 1 coin per NPR, 2 = 2 coins per NPR)', NOW(), NOW())
ON CONFLICT ("rateType") DO NOTHING;
