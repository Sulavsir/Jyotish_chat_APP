-- Ensure gen_random_uuid() is available (built-in in PG 13+; otherwise from pgcrypto)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateTable
CREATE TABLE "BroadcastQuestionPricing" (
    "id" TEXT NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "amountNr" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BroadcastQuestionPricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BroadcastQuestionPricing_questionCount_key" ON "BroadcastQuestionPricing"("questionCount");

-- CreateIndex
CREATE INDEX "BroadcastQuestionPricing_questionCount_idx" ON "BroadcastQuestionPricing"("questionCount");

-- Seed default pricing: 1=100, 2=190, 3=270, 4=340, 5=400, 6=450, 7=500, 8=540, 9=570, 10=600 (example tier)
INSERT INTO "BroadcastQuestionPricing" ("id", "questionCount", "amountNr", "createdAt", "updatedAt")
SELECT gen_random_uuid(), n, CASE n WHEN 1 THEN 100 WHEN 2 THEN 190 WHEN 3 THEN 270 WHEN 4 THEN 340 WHEN 5 THEN 400 WHEN 6 THEN 450 WHEN 7 THEN 500 WHEN 8 THEN 540 WHEN 9 THEN 570 WHEN 10 THEN 600 ELSE 100 * n END, NOW(), NOW()
FROM generate_series(1, 20) AS n;
