-- AlterTable
ALTER TABLE "KundaliMatchRequest" ADD COLUMN "selectedConsultationQuestionIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
