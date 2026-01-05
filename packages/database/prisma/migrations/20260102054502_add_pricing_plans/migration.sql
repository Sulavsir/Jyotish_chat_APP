/*
  Warnings:

  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[refreshTokenHash]` on the table `Session` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `chatId` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receiverType` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderType` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipientType` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `refreshTokenHash` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userType` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Made the column `phone` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ChatStatus" AS ENUM ('ACTIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "InstantChatRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BroadcastMessageStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ConsultationRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SessionUserType" AS ENUM ('CLIENT', 'ASTROLOGER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ParticipantType" AS ENUM ('CLIENT', 'ASTROLOGER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('USER_LOGIN', 'USER_LOGOUT', 'USER_REGISTER', 'USER_UPDATE', 'USER_DELETE', 'ASTROLOGER_LOGIN', 'ASTROLOGER_LOGOUT', 'ASTROLOGER_CREATE', 'ASTROLOGER_UPDATE', 'ASTROLOGER_DELETE', 'ADMIN_LOGIN', 'ADMIN_LOGOUT', 'ADMIN_ACTION', 'CHAT_START', 'CHAT_END', 'MESSAGE_SEND', 'MESSAGE_DELETE', 'MESSAGE_FLAG', 'CONSULTATION_CREATE', 'CONSULTATION_UPDATE', 'CONSULTATION_CANCEL', 'CONSULTATION_REQUEST_CREATE', 'CONSULTATION_REQUEST_ACCEPT', 'CONSULTATION_REQUEST_EXPIRE', 'CONSULTATION_REQUEST_CANCEL', 'INSTANT_CHAT_REQUEST_CREATE', 'INSTANT_CHAT_REQUEST_ACCEPT', 'INSTANT_CHAT_REQUEST_EXPIRE', 'INSTANT_CHAT_REQUEST_CANCEL', 'BROADCAST_MESSAGE_CREATE', 'BROADCAST_MESSAGE_ACCEPT', 'BROADCAST_MESSAGE_EXPIRE', 'PAYMENT_CREATE', 'PAYMENT_SUCCESS', 'PAYMENT_FAIL', 'SYSTEM_ACTION');

-- CreateEnum
CREATE TYPE "EarningStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED');

-- AlterEnum
ALTER TYPE "MessageType" ADD VALUE 'VIDEO';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'BROADCAST_MESSAGE';
ALTER TYPE "NotificationType" ADD VALUE 'BROADCAST_ACCEPTED';

-- DropForeignKey
ALTER TABLE "Consultation" DROP CONSTRAINT "Consultation_astrologerId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_senderId_fkey";

-- DropIndex
DROP INDEX "Session_token_idx";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "adminNotes" TEXT,
ADD COLUMN     "chatId" TEXT NOT NULL,
ADD COLUMN     "flaggedByAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "receiverType" "ParticipantType" NOT NULL,
ADD COLUMN     "senderType" "ParticipantType" NOT NULL;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "astrologerId" TEXT,
ADD COLUMN     "count" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "groupKey" TEXT,
ADD COLUMN     "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "recipientType" "ParticipantType" NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "accessToken" TEXT,
ADD COLUMN     "astrologerId" TEXT,
ADD COLUMN     "isRevoked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "refreshTokenHash" TEXT NOT NULL,
ADD COLUMN     "userType" "SessionUserType" NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "token" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "image",
ADD COLUMN     "isOnline" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profilePhoto" TEXT,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "phone" SET NOT NULL;

-- CreateTable
CREATE TABLE "Astrologer" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profilePhoto" TEXT,
    "bio" TEXT,
    "specialization" TEXT[],
    "experience" INTEGER,
    "rating" DOUBLE PRECISION DEFAULT 0.0,
    "totalConsultations" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "bankAccountDetails" JSONB,
    "documentVerification" JSONB,
    "availabilitySchedule" JSONB,
    "languages" TEXT[] DEFAULT ARRAY['English', 'Nepali']::TEXT[],
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Astrologer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "astrologerId" TEXT,
    "adminId" TEXT,
    "action" "AuditAction" NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AstrologerEarnings" (
    "id" TEXT NOT NULL,
    "astrologerId" TEXT NOT NULL,
    "consultationId" TEXT,
    "chatId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "commission" DOUBLE PRECISION NOT NULL,
    "netEarning" DOUBLE PRECISION NOT NULL,
    "status" "EarningStatus" NOT NULL DEFAULT 'PENDING',
    "payoutDate" TIMESTAMP(3),
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AstrologerEarnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OTPSession" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OTPSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "participant1Id" TEXT NOT NULL,
    "participant2Id" TEXT NOT NULL,
    "participant1Type" "ParticipantType" NOT NULL DEFAULT 'CLIENT',
    "participant2Type" "ParticipantType" NOT NULL DEFAULT 'ASTROLOGER',
    "consultationId" TEXT,
    "status" "ChatStatus" NOT NULL DEFAULT 'ACTIVE',
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "endedBy" TEXT,
    "endedAt" TIMESTAMP(3),
    "lastMessageAt" TIMESTAMP(3),
    "lastMessageText" TEXT,
    "participant1Read" BOOLEAN NOT NULL DEFAULT true,
    "participant2Read" BOOLEAN NOT NULL DEFAULT true,
    "isMonitoredByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstantChatRequest" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientName" TEXT,
    "clientPhoto" TEXT,
    "message" TEXT,
    "status" "InstantChatRequestStatus" NOT NULL DEFAULT 'PENDING',
    "acceptedBy" TEXT,
    "chatId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstantChatRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BroadcastMessage" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "status" "BroadcastMessageStatus" NOT NULL DEFAULT 'PENDING',
    "acceptedBy" TEXT,
    "chatId" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BroadcastMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationRequest" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "ConsultationType" NOT NULL,
    "description" TEXT,
    "preferredTime" TIMESTAMP(3),
    "duration" INTEGER NOT NULL DEFAULT 30,
    "status" "ConsultationRequestStatus" NOT NULL DEFAULT 'PENDING',
    "acceptedBy" TEXT,
    "consultationId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsultationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "chatNotifications" BOOLEAN NOT NULL DEFAULT true,
    "consultationNotifications" BOOLEAN NOT NULL DEFAULT true,
    "paymentNotifications" BOOLEAN NOT NULL DEFAULT true,
    "marketingNotifications" BOOLEAN NOT NULL DEFAULT false,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "soundEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceInNrs" INTEGER NOT NULL,
    "coins" INTEGER NOT NULL,
    "validityInDays" INTEGER,
    "isUnlimited" BOOLEAN NOT NULL DEFAULT false,
    "discountPercent" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Astrologer_phone_key" ON "Astrologer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Astrologer_email_key" ON "Astrologer"("email");

-- CreateIndex
CREATE INDEX "Astrologer_phone_idx" ON "Astrologer"("phone");

-- CreateIndex
CREATE INDEX "Astrologer_email_idx" ON "Astrologer"("email");

-- CreateIndex
CREATE INDEX "Astrologer_isActive_idx" ON "Astrologer"("isActive");

-- CreateIndex
CREATE INDEX "Astrologer_isOnline_idx" ON "Astrologer"("isOnline");

-- CreateIndex
CREATE INDEX "Astrologer_rating_idx" ON "Astrologer"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE INDEX "Admin_email_idx" ON "Admin"("email");

-- CreateIndex
CREATE INDEX "Admin_isActive_idx" ON "Admin"("isActive");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_astrologerId_idx" ON "AuditLog"("astrologerId");

-- CreateIndex
CREATE INDEX "AuditLog_adminId_idx" ON "AuditLog"("adminId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_resource_idx" ON "AuditLog"("resource");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_action_idx" ON "AuditLog"("userId", "action");

-- CreateIndex
CREATE INDEX "AuditLog_astrologerId_action_idx" ON "AuditLog"("astrologerId", "action");

-- CreateIndex
CREATE INDEX "AstrologerEarnings_astrologerId_idx" ON "AstrologerEarnings"("astrologerId");

-- CreateIndex
CREATE INDEX "AstrologerEarnings_status_idx" ON "AstrologerEarnings"("status");

-- CreateIndex
CREATE INDEX "AstrologerEarnings_createdAt_idx" ON "AstrologerEarnings"("createdAt");

-- CreateIndex
CREATE INDEX "AstrologerEarnings_astrologerId_status_idx" ON "AstrologerEarnings"("astrologerId", "status");

-- CreateIndex
CREATE INDEX "OTPSession_phoneNumber_idx" ON "OTPSession"("phoneNumber");

-- CreateIndex
CREATE INDEX "OTPSession_phoneNumber_verified_idx" ON "OTPSession"("phoneNumber", "verified");

-- CreateIndex
CREATE INDEX "OTPSession_expiresAt_idx" ON "OTPSession"("expiresAt");

-- CreateIndex
CREATE INDEX "Chat_participant1Id_idx" ON "Chat"("participant1Id");

-- CreateIndex
CREATE INDEX "Chat_participant2Id_idx" ON "Chat"("participant2Id");

-- CreateIndex
CREATE INDEX "Chat_consultationId_idx" ON "Chat"("consultationId");

-- CreateIndex
CREATE INDEX "Chat_lastMessageAt_idx" ON "Chat"("lastMessageAt");

-- CreateIndex
CREATE INDEX "Chat_status_idx" ON "Chat"("status");

-- CreateIndex
CREATE INDEX "Chat_isLocked_idx" ON "Chat"("isLocked");

-- CreateIndex
CREATE INDEX "Chat_isMonitoredByAdmin_idx" ON "Chat"("isMonitoredByAdmin");

-- CreateIndex
CREATE UNIQUE INDEX "Chat_participant1Id_participant2Id_key" ON "Chat"("participant1Id", "participant2Id");

-- CreateIndex
CREATE INDEX "InstantChatRequest_clientId_idx" ON "InstantChatRequest"("clientId");

-- CreateIndex
CREATE INDEX "InstantChatRequest_status_idx" ON "InstantChatRequest"("status");

-- CreateIndex
CREATE INDEX "InstantChatRequest_acceptedBy_idx" ON "InstantChatRequest"("acceptedBy");

-- CreateIndex
CREATE INDEX "InstantChatRequest_createdAt_idx" ON "InstantChatRequest"("createdAt");

-- CreateIndex
CREATE INDEX "InstantChatRequest_expiresAt_idx" ON "InstantChatRequest"("expiresAt");

-- CreateIndex
CREATE INDEX "InstantChatRequest_status_expiresAt_idx" ON "InstantChatRequest"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "BroadcastMessage_clientId_idx" ON "BroadcastMessage"("clientId");

-- CreateIndex
CREATE INDEX "BroadcastMessage_status_idx" ON "BroadcastMessage"("status");

-- CreateIndex
CREATE INDEX "BroadcastMessage_acceptedBy_idx" ON "BroadcastMessage"("acceptedBy");

-- CreateIndex
CREATE INDEX "BroadcastMessage_createdAt_idx" ON "BroadcastMessage"("createdAt");

-- CreateIndex
CREATE INDEX "BroadcastMessage_status_createdAt_idx" ON "BroadcastMessage"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ConsultationRequest_clientId_idx" ON "ConsultationRequest"("clientId");

-- CreateIndex
CREATE INDEX "ConsultationRequest_status_idx" ON "ConsultationRequest"("status");

-- CreateIndex
CREATE INDEX "ConsultationRequest_acceptedBy_idx" ON "ConsultationRequest"("acceptedBy");

-- CreateIndex
CREATE INDEX "ConsultationRequest_createdAt_idx" ON "ConsultationRequest"("createdAt");

-- CreateIndex
CREATE INDEX "ConsultationRequest_expiresAt_idx" ON "ConsultationRequest"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSettings_userId_key" ON "NotificationSettings"("userId");

-- CreateIndex
CREATE INDEX "NotificationSettings_userId_idx" ON "NotificationSettings"("userId");

-- CreateIndex
CREATE INDEX "PricingPlan_isActive_idx" ON "PricingPlan"("isActive");

-- CreateIndex
CREATE INDEX "PricingPlan_isFeatured_idx" ON "PricingPlan"("isFeatured");

-- CreateIndex
CREATE INDEX "PricingPlan_displayOrder_idx" ON "PricingPlan"("displayOrder");

-- CreateIndex
CREATE INDEX "Message_chatId_idx" ON "Message"("chatId");

-- CreateIndex
CREATE INDEX "Message_senderType_idx" ON "Message"("senderType");

-- CreateIndex
CREATE INDEX "Message_receiverType_idx" ON "Message"("receiverType");

-- CreateIndex
CREATE INDEX "Message_flaggedByAdmin_idx" ON "Message"("flaggedByAdmin");

-- CreateIndex
CREATE INDEX "Notification_astrologerId_idx" ON "Notification"("astrologerId");

-- CreateIndex
CREATE INDEX "Notification_astrologerId_isRead_idx" ON "Notification"("astrologerId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_groupKey_idx" ON "Notification"("groupKey");

-- CreateIndex
CREATE INDEX "Notification_userId_groupKey_isRead_idx" ON "Notification"("userId", "groupKey", "isRead");

-- CreateIndex
CREATE INDEX "Notification_astrologerId_groupKey_isRead_idx" ON "Notification"("astrologerId", "groupKey", "isRead");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshTokenHash_key" ON "Session"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "Session_astrologerId_idx" ON "Session"("astrologerId");

-- CreateIndex
CREATE INDEX "Session_refreshTokenHash_idx" ON "Session"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_isRevoked_idx" ON "Session"("userId", "isRevoked");

-- CreateIndex
CREATE INDEX "Session_astrologerId_isRevoked_idx" ON "Session"("astrologerId", "isRevoked");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_isOnline_idx" ON "User"("isOnline");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_astrologerId_fkey" FOREIGN KEY ("astrologerId") REFERENCES "Astrologer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AstrologerEarnings" ADD CONSTRAINT "AstrologerEarnings_astrologerId_fkey" FOREIGN KEY ("astrologerId") REFERENCES "Astrologer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_astrologerId_fkey" FOREIGN KEY ("astrologerId") REFERENCES "Astrologer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_participant1Id_fkey" FOREIGN KEY ("participant1Id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_participant2Id_fkey" FOREIGN KEY ("participant2Id") REFERENCES "Astrologer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_astrologerId_fkey" FOREIGN KEY ("astrologerId") REFERENCES "Astrologer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstantChatRequest" ADD CONSTRAINT "InstantChatRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstantChatRequest" ADD CONSTRAINT "InstantChatRequest_acceptedBy_fkey" FOREIGN KEY ("acceptedBy") REFERENCES "Astrologer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastMessage" ADD CONSTRAINT "BroadcastMessage_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastMessage" ADD CONSTRAINT "BroadcastMessage_acceptedBy_fkey" FOREIGN KEY ("acceptedBy") REFERENCES "Astrologer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationRequest" ADD CONSTRAINT "ConsultationRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationRequest" ADD CONSTRAINT "ConsultationRequest_acceptedBy_fkey" FOREIGN KEY ("acceptedBy") REFERENCES "Astrologer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_astrologerId_fkey" FOREIGN KEY ("astrologerId") REFERENCES "Astrologer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationSettings" ADD CONSTRAINT "NotificationSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
