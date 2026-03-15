-- AlterTable Chat: add reopenedAfterEnded for broadcast vs instant chat fee when chat is reopened
ALTER TABLE "Chat" ADD COLUMN "reopenedAfterEnded" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable NepalProvince
CREATE TABLE "NepalProvince" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,

    CONSTRAINT "NepalProvince_pkey" PRIMARY KEY ("id")
);

-- CreateTable NepalDistrict
CREATE TABLE "NepalDistrict" (
    "id" TEXT NOT NULL,
    "provinceId" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,

    CONSTRAINT "NepalDistrict_pkey" PRIMARY KEY ("id")
);

-- User place of birth fields
ALTER TABLE "User" ADD COLUMN "placeOfBirthType" TEXT;
ALTER TABLE "User" ADD COLUMN "placeOfBirthPradeshId" TEXT;
ALTER TABLE "User" ADD COLUMN "placeOfBirthDistrictId" TEXT;
ALTER TABLE "User" ADD COLUMN "placeOfBirthLocation" TEXT;

-- ClientProfile place of birth fields
ALTER TABLE "ClientProfile" ADD COLUMN "placeOfBirthType" TEXT;
ALTER TABLE "ClientProfile" ADD COLUMN "placeOfBirthPradeshId" TEXT;
ALTER TABLE "ClientProfile" ADD COLUMN "placeOfBirthDistrictId" TEXT;
ALTER TABLE "ClientProfile" ADD COLUMN "placeOfBirthLocation" TEXT;

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "NepalProvince_nameEn_key" ON "NepalProvince"("nameEn");
CREATE UNIQUE INDEX IF NOT EXISTS "NepalDistrict_provinceId_nameEn_key" ON "NepalDistrict"("provinceId", "nameEn");
CREATE INDEX IF NOT EXISTS "NepalDistrict_provinceId_idx" ON "NepalDistrict"("provinceId");

-- Foreign keys
ALTER TABLE "NepalDistrict" ADD CONSTRAINT "NepalDistrict_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "NepalProvince"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_placeOfBirthPradeshId_fkey" FOREIGN KEY ("placeOfBirthPradeshId") REFERENCES "NepalProvince"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_placeOfBirthDistrictId_fkey" FOREIGN KEY ("placeOfBirthDistrictId") REFERENCES "NepalDistrict"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ClientProfile" ADD CONSTRAINT "ClientProfile_placeOfBirthPradeshId_fkey" FOREIGN KEY ("placeOfBirthPradeshId") REFERENCES "NepalProvince"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ClientProfile" ADD CONSTRAINT "ClientProfile_placeOfBirthDistrictId_fkey" FOREIGN KEY ("placeOfBirthDistrictId") REFERENCES "NepalDistrict"("id") ON DELETE SET NULL ON UPDATE CASCADE;
