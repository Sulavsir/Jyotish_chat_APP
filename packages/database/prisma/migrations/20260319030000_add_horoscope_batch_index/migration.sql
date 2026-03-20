-- Adds language column to Horoscope (was missing) and index for batch reads

-- Add language column if missing (Horoscope batch endpoint requires it)
ALTER TABLE "Horoscope" ADD COLUMN IF NOT EXISTS "language" "QuestionnaireLanguage" NOT NULL DEFAULT 'ENGLISH';

-- Covers batch endpoint: GET /api/v1/horoscopes?category=...&date=...&language=...
CREATE INDEX IF NOT EXISTS "Horoscope_date_category_language_idx" ON "Horoscope"("date", "category", "language");

