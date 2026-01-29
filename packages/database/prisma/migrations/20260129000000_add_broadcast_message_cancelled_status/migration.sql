-- AlterEnum
-- Add CANCELLED to BroadcastMessageStatus enum (client can cancel pending broadcast)
ALTER TYPE "BroadcastMessageStatus" ADD VALUE 'CANCELLED';
