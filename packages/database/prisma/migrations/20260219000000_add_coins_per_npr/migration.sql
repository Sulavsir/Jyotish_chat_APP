-- Add COINS_PER_NPR to PlatformCoinRateType
ALTER TYPE "PlatformCoinRateType" ADD VALUE 'COINS_PER_NPR';

-- Note: INSERT moved to 20260219000001 (PostgreSQL enum ADD VALUE must commit first).
