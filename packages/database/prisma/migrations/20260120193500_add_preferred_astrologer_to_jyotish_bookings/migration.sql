-- AlterTable
ALTER TABLE "JyotishBookingRequest" ADD COLUMN "preferredAstrologerId" TEXT;

-- CreateIndex
CREATE INDEX "JyotishBookingRequest_preferredAstrologerId_idx" ON "JyotishBookingRequest"("preferredAstrologerId");

-- AddForeignKey
ALTER TABLE "JyotishBookingRequest"
ADD CONSTRAINT "JyotishBookingRequest_preferredAstrologerId_fkey"
FOREIGN KEY ("preferredAstrologerId") REFERENCES "Astrologer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

