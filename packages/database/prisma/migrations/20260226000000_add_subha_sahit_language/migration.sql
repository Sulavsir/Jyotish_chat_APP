-- CreateEnum
CREATE TYPE "SubhaSahitLanguage" AS ENUM ('EN', 'NE', 'HI');

-- CreateTable (SubhaSahitDate was missing - this migration originally only added language)
CREATE TABLE "SubhaSahitDate" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "language" "SubhaSahitLanguage" NOT NULL DEFAULT 'EN',
    "occasion" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubhaSahitDate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SubhaSahitDate_date_language_isActive_idx" ON "SubhaSahitDate"("date", "language", "isActive");
CREATE INDEX "SubhaSahitDate_occasion_language_idx" ON "SubhaSahitDate"("occasion", "language");
CREATE INDEX "SubhaSahitDate_date_occasion_language_isActive_idx" ON "SubhaSahitDate"("date", "occasion", "language", "isActive");

