ALTER TABLE "FonepayTransaction" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'QR';

CREATE INDEX "FonepayTransaction_type_idx" ON "FonepayTransaction"("type");
