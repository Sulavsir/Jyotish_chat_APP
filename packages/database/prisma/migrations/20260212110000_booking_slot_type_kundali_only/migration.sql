-- Consolidate BookingType and SlotType to KUNDALI_REVIEW only (Appointment for Full Kundali Review).
-- Step 1: Ensure all existing data uses KUNDALI_REVIEW (map APPOINTMENT -> KUNDALI_REVIEW via text).
UPDATE "Appointment" SET "bookingType" = 'KUNDALI_REVIEW' WHERE "bookingType" = 'APPOINTMENT';
UPDATE "AstrologerSlot" SET "slotType" = 'KUNDALI_REVIEW' WHERE "slotType" = 'APPOINTMENT';

-- Step 2: BookingType - drop default, convert to text, drop enum, create new enum, convert back.
ALTER TABLE "Appointment" ALTER COLUMN "bookingType" DROP DEFAULT;
ALTER TABLE "Appointment" ALTER COLUMN "bookingType" TYPE text;
DROP TYPE "BookingType";
CREATE TYPE "BookingType" AS ENUM ('KUNDALI_REVIEW');
ALTER TABLE "Appointment" ALTER COLUMN "bookingType" TYPE "BookingType" USING "bookingType"::"BookingType";
ALTER TABLE "Appointment" ALTER COLUMN "bookingType" SET DEFAULT 'KUNDALI_REVIEW'::"BookingType";

-- Step 3: SlotType - convert to text, drop enum, create new enum, convert back.
ALTER TABLE "AstrologerSlot" ALTER COLUMN "slotType" TYPE text;
DROP TYPE "SlotType";
CREATE TYPE "SlotType" AS ENUM ('KUNDALI_REVIEW');
ALTER TABLE "AstrologerSlot" ALTER COLUMN "slotType" TYPE "SlotType" USING "slotType"::"SlotType";
