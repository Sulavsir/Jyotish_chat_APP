-- Structured venue + contact fields for Jyotish service bookings
ALTER TABLE "JyotishBookingRequest" ADD COLUMN "province" TEXT,
ADD COLUMN "district" TEXT,
ADD COLUMN "wardNo" TEXT,
ADD COLUMN "place" TEXT,
ADD COLUMN "tole" TEXT,
ADD COLUMN "nearestLandmark" TEXT,
ADD COLUMN "googleMapLink" TEXT,
ADD COLUMN "pujariCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "contactPhone" TEXT,
ADD COLUMN "contactPhoneAlt" TEXT;
