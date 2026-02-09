-- AlterTable
ALTER TABLE "Astrologer" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Astrologer" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Astrologer_isDeleted_idx" ON "Astrologer"("isDeleted");
