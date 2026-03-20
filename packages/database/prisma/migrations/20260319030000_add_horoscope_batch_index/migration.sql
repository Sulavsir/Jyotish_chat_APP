-- Adds indexes to speed up horoscope batch reads

-- Covers batch endpoint:
-- GET /api/v1/horoscopes?category=...&date=...&language=...
CREATE INDEX IF NOT EXISTS "Horoscope_date_category_language_idx" ON "Horoscope"("date", "category", "language");

