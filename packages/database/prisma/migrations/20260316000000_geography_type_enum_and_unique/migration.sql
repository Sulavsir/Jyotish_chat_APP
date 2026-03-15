-- CreateEnum GeographyType (only valid values: PROVINCE, DISTRICT)
CREATE TYPE "GeographyType" AS ENUM ('PROVINCE', 'DISTRICT');

-- CreateTable NepalGeography (unified provinces and districts)
CREATE TABLE "NepalGeography" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "type" "GeographyType" NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "NepalGeography_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: same name allowed under different parents (e.g. Kathmandu in Bagmati), prevents duplicates
CREATE UNIQUE INDEX "NepalGeography_nameEn_parentId_key" ON "NepalGeography"("nameEn", "parentId");
CREATE INDEX "NepalGeography_type_idx" ON "NepalGeography"("type");
CREATE INDEX "NepalGeography_parentId_idx" ON "NepalGeography"("parentId");

-- Migrate data from NepalProvince and NepalDistrict (preserve ids so existing FKs keep working)
INSERT INTO "NepalGeography" ("id", "nameEn", "type", "parentId")
SELECT "id", "nameEn", 'PROVINCE'::"GeographyType", NULL FROM "NepalProvince";

INSERT INTO "NepalGeography" ("id", "nameEn", "type", "parentId")
SELECT "id", "nameEn", 'DISTRICT'::"GeographyType", "provinceId" FROM "NepalDistrict";

-- Drop old FKs from User and ClientProfile
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_placeOfBirthPradeshId_fkey";
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_placeOfBirthDistrictId_fkey";
ALTER TABLE "ClientProfile" DROP CONSTRAINT IF EXISTS "ClientProfile_placeOfBirthPradeshId_fkey";
ALTER TABLE "ClientProfile" DROP CONSTRAINT IF EXISTS "ClientProfile_placeOfBirthDistrictId_fkey";

-- Add self-reference for districts -> province
ALTER TABLE "NepalGeography" ADD CONSTRAINT "NepalGeography_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "NepalGeography"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Re-add FKs to NepalGeography
ALTER TABLE "User" ADD CONSTRAINT "User_placeOfBirthPradeshId_fkey" FOREIGN KEY ("placeOfBirthPradeshId") REFERENCES "NepalGeography"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_placeOfBirthDistrictId_fkey" FOREIGN KEY ("placeOfBirthDistrictId") REFERENCES "NepalGeography"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ClientProfile" ADD CONSTRAINT "ClientProfile_placeOfBirthPradeshId_fkey" FOREIGN KEY ("placeOfBirthPradeshId") REFERENCES "NepalGeography"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ClientProfile" ADD CONSTRAINT "ClientProfile_placeOfBirthDistrictId_fkey" FOREIGN KEY ("placeOfBirthDistrictId") REFERENCES "NepalGeography"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop old tables
DROP TABLE "NepalDistrict";
DROP TABLE "NepalProvince";
