-- CreateEnum
CREATE TYPE "QuestionnaireLanguage" AS ENUM ('NEPALI', 'HINDI', 'ENGLISH');

-- CreateTable (QuestionCategory was missing - this migration originally only added language to it)
CREATE TABLE "QuestionCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT,
    "language" "QuestionnaireLanguage" NOT NULL DEFAULT 'ENGLISH',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionItem" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuestionCategory_isActive_idx" ON "QuestionCategory"("isActive");
CREATE INDEX "QuestionCategory_sortOrder_idx" ON "QuestionCategory"("sortOrder");
CREATE INDEX "QuestionCategory_language_idx" ON "QuestionCategory"("language");
CREATE INDEX "QuestionCategory_isActive_sortOrder_idx" ON "QuestionCategory"("isActive", "sortOrder");
CREATE INDEX "QuestionCategory_isActive_language_idx" ON "QuestionCategory"("isActive", "language");

-- CreateIndex
CREATE INDEX "QuestionItem_categoryId_idx" ON "QuestionItem"("categoryId");
CREATE INDEX "QuestionItem_isActive_idx" ON "QuestionItem"("isActive");
CREATE INDEX "QuestionItem_sortOrder_idx" ON "QuestionItem"("sortOrder");

-- AddForeignKey
ALTER TABLE "QuestionItem" ADD CONSTRAINT "QuestionItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "QuestionCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
