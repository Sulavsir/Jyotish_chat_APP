-- CreateTable
CREATE TABLE "NepaliDate" (
    "id" SERIAL NOT NULL,
    "englishDate" DATE NOT NULL,
    "nepaliDate" TEXT NOT NULL,
    "days" TEXT NOT NULL,

    CONSTRAINT "NepaliDate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NepaliDate_englishDate_idx" ON "NepaliDate"("englishDate");

-- CreateIndex
CREATE INDEX "NepaliDate_nepaliDate_idx" ON "NepaliDate"("nepaliDate");
