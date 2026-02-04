-- CreateEnum
CREATE TYPE "QuestionnaireLanguage" AS ENUM ('NEPALI', 'HINDI', 'ENGLISH');

-- AlterTable
ALTER TABLE "QuestionCategory" ADD COLUMN "language" "QuestionnaireLanguage" NOT NULL DEFAULT 'ENGLISH';

-- CreateIndex
CREATE INDEX "QuestionCategory_language_idx" ON "QuestionCategory"("language");

-- CreateIndex
CREATE INDEX "QuestionCategory_isActive_language_idx" ON "QuestionCategory"("isActive", "language");
