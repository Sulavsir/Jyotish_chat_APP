-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('APPOINTMENT', 'KUNDALI_REVIEW');

-- CreateEnum
CREATE TYPE "SlotType" AS ENUM ('APPOINTMENT', 'KUNDALI_REVIEW');

-- CreateEnum
CREATE TYPE "SlotStatus" AS ENUM ('AVAILABLE', 'BOOKED');

-- AlterEnum: add KUNDALI_REVIEW to PlatformCoinRateType
ALTER TYPE "PlatformCoinRateType" ADD VALUE 'KUNDALI_REVIEW';

-- AlterEnum: add KUNDALI_REVIEW to AstrologerCoinEarningSource
ALTER TYPE "AstrologerCoinEarningSource" ADD VALUE 'KUNDALI_REVIEW';

-- CreateTable: AstrologerSlot
CREATE TABLE "AstrologerSlot" (
    "id" TEXT NOT NULL,
    "astrologerId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "slotType" "SlotType" NOT NULL,
    "status" "SlotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "appointmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AstrologerSlot_pkey" PRIMARY KEY ("id")
);

-- AddColumn: Appointment.bookingType
ALTER TABLE "Appointment" ADD COLUMN "bookingType" "BookingType" NOT NULL DEFAULT 'APPOINTMENT';

-- AddColumn: Chat.appointmentId
ALTER TABLE "Chat" ADD COLUMN "appointmentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AstrologerSlot_appointmentId_key" ON "AstrologerSlot"("appointmentId");
CREATE INDEX "AstrologerSlot_astrologerId_idx" ON "AstrologerSlot"("astrologerId");
CREATE INDEX "AstrologerSlot_astrologerId_slotType_startAt_idx" ON "AstrologerSlot"("astrologerId", "slotType", "startAt");
CREATE INDEX "AstrologerSlot_status_idx" ON "AstrologerSlot"("status");
CREATE INDEX "Chat_appointmentId_idx" ON "Chat"("appointmentId");
CREATE INDEX "Appointment_bookingType_idx" ON "Appointment"("bookingType");

-- AddForeignKey: AstrologerSlot -> Astrologer
ALTER TABLE "AstrologerSlot" ADD CONSTRAINT "AstrologerSlot_astrologerId_fkey" FOREIGN KEY ("astrologerId") REFERENCES "Astrologer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: AstrologerSlot -> Appointment
ALTER TABLE "AstrologerSlot" ADD CONSTRAINT "AstrologerSlot_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Insert default KUNDALI_REVIEW coin rate
INSERT INTO "PlatformCoinRate" ("id", "rateType", "coins", "description", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'KUNDALI_REVIEW', 500, 'Coins for Full Kundali Review', NOW(), NOW())
ON CONFLICT ("rateType") DO NOTHING;
