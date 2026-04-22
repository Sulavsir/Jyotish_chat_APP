-- CreateTable
CREATE TABLE "SubhaSahitOccasionMeta" (
    "id" TEXT NOT NULL,
    "language" "SubhaSahitLanguage" NOT NULL,
    "occasion" TEXT NOT NULL,
    "pujaItems" TEXT,
    "estimatedTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubhaSahitOccasionMeta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubhaSahitOccasionMeta_language_occasion_key" ON "SubhaSahitOccasionMeta"("language", "occasion");

-- CreateIndex
CREATE INDEX "SubhaSahitOccasionMeta_language_idx" ON "SubhaSahitOccasionMeta"("language");