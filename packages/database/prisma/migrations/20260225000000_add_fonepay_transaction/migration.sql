-- CreateTable
CREATE TABLE "FonepayTransaction" (
    "id" TEXT NOT NULL,
    "prn" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "fonepayTraceId" TEXT,
    "remarks1" TEXT,
    "remarks2" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FonepayTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FonepayTransaction_prn_key" ON "FonepayTransaction"("prn");

-- CreateIndex
CREATE INDEX "FonepayTransaction_prn_idx" ON "FonepayTransaction"("prn");

-- CreateIndex
CREATE INDEX "FonepayTransaction_status_idx" ON "FonepayTransaction"("status");

-- CreateIndex
CREATE INDEX "FonepayTransaction_createdAt_idx" ON "FonepayTransaction"("createdAt");
