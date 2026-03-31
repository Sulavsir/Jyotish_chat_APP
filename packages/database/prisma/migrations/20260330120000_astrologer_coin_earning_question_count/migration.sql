-- Optional: number of questions represented by one earning row (e.g. direct multi-question bundle).
ALTER TABLE "AstrologerCoinEarning" ADD COLUMN IF NOT EXISTS "questionCount" INTEGER;
