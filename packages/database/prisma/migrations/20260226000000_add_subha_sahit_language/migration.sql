-- Add SubhaSahitLanguage enum and language column to SubhaSahitDate

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubhaSahitLanguage') THEN
    CREATE TYPE "SubhaSahitLanguage" AS ENUM ('EN', 'NE', 'HI');
  END IF;
END$$;

ALTER TABLE "SubhaSahitDate"
  ADD COLUMN IF NOT EXISTS "language" "SubhaSahitLanguage" NOT NULL DEFAULT 'EN';

-- Update existing indexes to include language dimension
DROP INDEX IF EXISTS "SubhaSahitDate_date_isActive_idx";
DROP INDEX IF EXISTS "SubhaSahitDate_occasion_idx";
DROP INDEX IF EXISTS "SubhaSahitDate_date_occasion_isActive_idx";

CREATE INDEX "SubhaSahitDate_date_language_isActive_idx" ON "SubhaSahitDate"("date", "language", "isActive");
CREATE INDEX "SubhaSahitDate_occasion_language_idx" ON "SubhaSahitDate"("occasion", "language");
CREATE INDEX "SubhaSahitDate_date_occasion_language_isActive_idx" ON "SubhaSahitDate"("date", "occasion", "language", "isActive");

