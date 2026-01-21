-- CreateEnum
CREATE TYPE "JyotishBookingType" AS ENUM ('PANDIT', 'VAASTU');

-- CreateEnum
CREATE TYPE "JyotishBookingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "JyotishBookingRequest" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "JyotishBookingType" NOT NULL,
    "category" TEXT NOT NULL,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "details" TEXT,
    "status" "JyotishBookingStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JyotishBookingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JyotishBookingRequest_clientId_idx" ON "JyotishBookingRequest"("clientId");

-- CreateIndex
CREATE INDEX "JyotishBookingRequest_type_idx" ON "JyotishBookingRequest"("type");

-- CreateIndex
CREATE INDEX "JyotishBookingRequest_status_idx" ON "JyotishBookingRequest"("status");

-- CreateIndex
CREATE INDEX "JyotishBookingRequest_bookingDate_idx" ON "JyotishBookingRequest"("bookingDate");

-- CreateIndex
CREATE INDEX "JyotishBookingRequest_type_status_idx" ON "JyotishBookingRequest"("type", "status");

-- CreateIndex
CREATE INDEX "JyotishBookingRequest_status_createdAt_idx" ON "JyotishBookingRequest"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "JyotishBookingRequest" ADD CONSTRAINT "JyotishBookingRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

