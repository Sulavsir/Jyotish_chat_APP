-- AlterTable
ALTER TABLE "User" ADD COLUMN     "facebookId" TEXT,
ADD COLUMN     "appleId" TEXT;

-- Partial unique indexes (active users only) — mirrors unique_active_googleId
CREATE UNIQUE INDEX "unique_active_facebookId"
ON "User"("facebookId")
WHERE "isDeleted" = false AND "facebookId" IS NOT NULL;

CREATE UNIQUE INDEX "unique_active_appleId"
ON "User"("appleId")
WHERE "isDeleted" = false AND "appleId" IS NOT NULL;
