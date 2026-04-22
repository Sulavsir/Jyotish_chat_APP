-- AlterTable
ALTER TABLE "KundaliMatchRequest" ADD COLUMN     "boyPlaceOfBirthType" TEXT,
ADD COLUMN     "boyPlaceOfBirthPradeshId" TEXT,
ADD COLUMN     "boyPlaceOfBirthDistrictId" TEXT,
ADD COLUMN     "boyPlaceOfBirthLocation" TEXT,
ADD COLUMN     "girlPlaceOfBirthType" TEXT,
ADD COLUMN     "girlPlaceOfBirthPradeshId" TEXT,
ADD COLUMN     "girlPlaceOfBirthDistrictId" TEXT,
ADD COLUMN     "girlPlaceOfBirthLocation" TEXT;

-- AddForeignKey
ALTER TABLE "KundaliMatchRequest" ADD CONSTRAINT "KundaliMatchRequest_boyPlaceOfBirthPradeshId_fkey" FOREIGN KEY ("boyPlaceOfBirthPradeshId") REFERENCES "NepalGeography"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KundaliMatchRequest" ADD CONSTRAINT "KundaliMatchRequest_boyPlaceOfBirthDistrictId_fkey" FOREIGN KEY ("boyPlaceOfBirthDistrictId") REFERENCES "NepalGeography"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KundaliMatchRequest" ADD CONSTRAINT "KundaliMatchRequest_girlPlaceOfBirthPradeshId_fkey" FOREIGN KEY ("girlPlaceOfBirthPradeshId") REFERENCES "NepalGeography"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KundaliMatchRequest" ADD CONSTRAINT "KundaliMatchRequest_girlPlaceOfBirthDistrictId_fkey" FOREIGN KEY ("girlPlaceOfBirthDistrictId") REFERENCES "NepalGeography"("id") ON DELETE SET NULL ON UPDATE CASCADE;
