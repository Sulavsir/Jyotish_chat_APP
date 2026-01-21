-- CreateTable
CREATE TABLE "DashboardRotatingCopy" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardRotatingCopy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DashboardRotatingCopy_isActive_idx" ON "DashboardRotatingCopy"("isActive");

-- CreateIndex
CREATE INDEX "DashboardRotatingCopy_sortOrder_idx" ON "DashboardRotatingCopy"("sortOrder");

-- CreateIndex
CREATE INDEX "DashboardRotatingCopy_isActive_sortOrder_idx" ON "DashboardRotatingCopy"("isActive", "sortOrder");

