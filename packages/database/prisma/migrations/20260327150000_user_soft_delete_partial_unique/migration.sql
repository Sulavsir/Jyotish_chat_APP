-- User soft delete + partial unique indexes (active users only).
-- Allows re-registration with same phone/email after soft delete without clearing identifiers.

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "User_isDeleted_idx" ON "User"("isDeleted");

-- Drop global unique constraints (replaced by partial uniques below)
DROP INDEX IF EXISTS "User_email_key";
DROP INDEX IF EXISTS "User_phone_key";
DROP INDEX IF EXISTS "User_googleId_key";

CREATE UNIQUE INDEX "unique_active_email"
ON "User"("email")
WHERE "isDeleted" = false AND "email" IS NOT NULL;

CREATE UNIQUE INDEX "unique_active_phone"
ON "User"("phone")
WHERE "isDeleted" = false AND "phone" IS NOT NULL;

CREATE UNIQUE INDEX "unique_active_googleId"
ON "User"("googleId")
WHERE "isDeleted" = false AND "googleId" IS NOT NULL;
