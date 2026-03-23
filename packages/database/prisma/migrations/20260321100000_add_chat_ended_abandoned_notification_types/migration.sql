-- AlterEnum: add CHAT_ENDED and CHAT_ABANDONED to NotificationType
ALTER TYPE "NotificationType" ADD VALUE 'CHAT_ENDED';
ALTER TYPE "NotificationType" ADD VALUE 'CHAT_ABANDONED';
