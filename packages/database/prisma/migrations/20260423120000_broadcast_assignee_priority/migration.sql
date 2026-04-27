-- CreateTable
CREATE TABLE "BroadcastAssigneePriority" (
    "id" TEXT NOT NULL,
    "astrologerId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BroadcastAssigneePriority_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BroadcastAssigneePriority_astrologerId_key" ON "BroadcastAssigneePriority"("astrologerId");

-- CreateIndex
CREATE INDEX "BroadcastAssigneePriority_priority_idx" ON "BroadcastAssigneePriority"("priority");

-- AddForeignKey
ALTER TABLE "BroadcastAssigneePriority" ADD CONSTRAINT "BroadcastAssigneePriority_astrologerId_fkey" FOREIGN KEY ("astrologerId") REFERENCES "Astrologer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
