-- Add missing tables/columns that exist in schema but were never migrated.
-- These are required for: tips, complaints, ratings, user plans, admin chat, broadcast dismissals.

-- User.coins (coin balance - used by coin.service)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "coins" INTEGER NOT NULL DEFAULT 0;

-- TipAudience enum + DailyTip (used by tip.service)
CREATE TYPE "TipAudience" AS ENUM ('CLIENT', 'JYOTISH', 'BOTH');
CREATE TABLE "DailyTip" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "language" "QuestionnaireLanguage" NOT NULL DEFAULT 'ENGLISH',
    "audience" "TipAudience" NOT NULL DEFAULT 'BOTH',
    "text" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DailyTip_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "DailyTip_date_language_audience_isActive_idx" ON "DailyTip"("date", "language", "audience", "isActive");

-- Complaint enums + Complaint (used by complaintController, adminController)
CREATE TYPE "ComplaintStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'RESOLVED', 'DISMISSED', 'ESCALATED');
CREATE TYPE "ComplaintCategory" AS ENUM ('NO_RESPONSE', 'SLOW_RESPONSE', 'INAPPROPRIATE_BEHAVIOR', 'POOR_SERVICE_QUALITY', 'TECHNICAL_ISSUE', 'BILLING_ISSUE', 'OTHER');
CREATE TYPE "ComplaintPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "astrologerId" TEXT NOT NULL,
    "chatId" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ComplaintCategory" NOT NULL,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "ComplaintPriority" NOT NULL DEFAULT 'MEDIUM',
    "attachmentUrl" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Complaint_clientId_idx" ON "Complaint"("clientId");
CREATE INDEX "Complaint_astrologerId_idx" ON "Complaint"("astrologerId");
CREATE INDEX "Complaint_chatId_idx" ON "Complaint"("chatId");
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");
CREATE INDEX "Complaint_category_idx" ON "Complaint"("category");
CREATE INDEX "Complaint_priority_idx" ON "Complaint"("priority");
CREATE INDEX "Complaint_createdAt_idx" ON "Complaint"("createdAt");
CREATE INDEX "Complaint_status_createdAt_idx" ON "Complaint"("status", "createdAt");
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_astrologerId_fkey" FOREIGN KEY ("astrologerId") REFERENCES "Astrologer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Rating (used by rating.service)
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "astrologerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Rating_chatId_key" ON "Rating"("chatId");
CREATE INDEX "Rating_clientId_idx" ON "Rating"("clientId");
CREATE INDEX "Rating_astrologerId_idx" ON "Rating"("astrologerId");
CREATE INDEX "Rating_rating_idx" ON "Rating"("rating");
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_astrologerId_fkey" FOREIGN KEY ("astrologerId") REFERENCES "Astrologer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- UserPlan (used by coin.service, pricing.service)
CREATE TABLE "UserPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "purchasedWith" TEXT NOT NULL DEFAULT 'MONEY',
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserPlan_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "UserPlan_userId_idx" ON "UserPlan"("userId");
CREATE INDEX "UserPlan_userId_isActive_idx" ON "UserPlan"("userId", "isActive");
CREATE INDEX "UserPlan_expiresAt_idx" ON "UserPlan"("expiresAt");
CREATE INDEX "UserPlan_planId_idx" ON "UserPlan"("planId");
ALTER TABLE "UserPlan" ADD CONSTRAINT "UserPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserPlan" ADD CONSTRAINT "UserPlan_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PricingPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- BroadcastMessageDismissal (astrologer dismisses broadcast requests)
CREATE TABLE "BroadcastMessageDismissal" (
    "id" TEXT NOT NULL,
    "broadcastMessageId" TEXT NOT NULL,
    "astrologerId" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BroadcastMessageDismissal_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BroadcastMessageDismissal_broadcastMessageId_astrologerId_key" ON "BroadcastMessageDismissal"("broadcastMessageId", "astrologerId");
CREATE INDEX "BroadcastMessageDismissal_broadcastMessageId_idx" ON "BroadcastMessageDismissal"("broadcastMessageId");
CREATE INDEX "BroadcastMessageDismissal_astrologerId_idx" ON "BroadcastMessageDismissal"("astrologerId");
CREATE INDEX "BroadcastMessageDismissal_dismissedAt_idx" ON "BroadcastMessageDismissal"("dismissedAt");
ALTER TABLE "BroadcastMessageDismissal" ADD CONSTRAINT "BroadcastMessageDismissal_broadcastMessageId_fkey" FOREIGN KEY ("broadcastMessageId") REFERENCES "BroadcastMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BroadcastMessageDismissal" ADD CONSTRAINT "BroadcastMessageDismissal_astrologerId_fkey" FOREIGN KEY ("astrologerId") REFERENCES "Astrologer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AdminChat + AdminChatMessage (used by adminChat.service)
CREATE TYPE "AdminChatStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'CLOSED');
CREATE TYPE "AdminChatSenderType" AS ENUM ('USER', 'ADMIN');
CREATE TABLE "AdminChat" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "astrologerId" TEXT,
    "adminId" TEXT,
    "status" "AdminChatStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastMessageAt" TIMESTAMP(3),
    "lastMessageText" TEXT,
    "userRead" BOOLEAN NOT NULL DEFAULT true,
    "adminRead" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdminChat_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AdminChat_userId_idx" ON "AdminChat"("userId");
CREATE INDEX "AdminChat_astrologerId_idx" ON "AdminChat"("astrologerId");
CREATE INDEX "AdminChat_adminId_idx" ON "AdminChat"("adminId");
CREATE INDEX "AdminChat_status_idx" ON "AdminChat"("status");
CREATE INDEX "AdminChat_lastMessageAt_idx" ON "AdminChat"("lastMessageAt");
CREATE INDEX "AdminChat_createdAt_idx" ON "AdminChat"("createdAt");
ALTER TABLE "AdminChat" ADD CONSTRAINT "AdminChat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminChat" ADD CONSTRAINT "AdminChat_astrologerId_fkey" FOREIGN KEY ("astrologerId") REFERENCES "Astrologer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminChat" ADD CONSTRAINT "AdminChat_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "AdminChatMessage" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderType" "AdminChatSenderType" NOT NULL,
    "content" TEXT NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "metadata" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdminChatMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AdminChatMessage_chatId_idx" ON "AdminChatMessage"("chatId");
CREATE INDEX "AdminChatMessage_senderId_idx" ON "AdminChatMessage"("senderId");
CREATE INDEX "AdminChatMessage_senderType_idx" ON "AdminChatMessage"("senderType");
CREATE INDEX "AdminChatMessage_createdAt_idx" ON "AdminChatMessage"("createdAt");
ALTER TABLE "AdminChatMessage" ADD CONSTRAINT "AdminChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "AdminChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
