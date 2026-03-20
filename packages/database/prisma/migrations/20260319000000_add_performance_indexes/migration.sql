-- Performance indexes migration
-- Adds missing compound and single-field indexes identified as causing slow queries in production.

-- ─── Chat ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "Chat_status_idx" ON "Chat"("status");
CREATE INDEX IF NOT EXISTS "Chat_participant1Id_status_idx" ON "Chat"("participant1Id", "status");
CREATE INDEX IF NOT EXISTS "Chat_participant2Id_status_idx" ON "Chat"("participant2Id", "status");

-- ─── Message ─────────────────────────────────────────────────────────────────
-- Covers getUserChats unread count (N queries → 1 groupBy) and getUnreadCount
CREATE INDEX IF NOT EXISTS "Message_chatId_receiverId_isRead_idx" ON "Message"("chatId", "receiverId", "isRead");
CREATE INDEX IF NOT EXISTS "Message_receiverId_isRead_idx" ON "Message"("receiverId", "isRead");

-- ─── BroadcastMessage ────────────────────────────────────────────────────────
-- Covers pending-check (clientId + status) and broadcast-linked chat lookup
CREATE INDEX IF NOT EXISTS "BroadcastMessage_clientId_status_idx" ON "BroadcastMessage"("clientId", "status");
CREATE INDEX IF NOT EXISTS "BroadcastMessage_chatId_idx" ON "BroadcastMessage"("chatId");

-- ─── Payment ─────────────────────────────────────────────────────────────────
-- Covers admin transaction history (ORDER BY createdAt) and user+status lookups
CREATE INDEX IF NOT EXISTS "Payment_createdAt_idx" ON "Payment"("createdAt");
CREATE INDEX IF NOT EXISTS "Payment_userId_status_idx" ON "Payment"("userId", "status");
CREATE INDEX IF NOT EXISTS "Payment_userId_createdAt_idx" ON "Payment"("userId", "createdAt");

-- ─── CoinTransaction ─────────────────────────────────────────────────────────
-- Covers admin sidebar count (type + reason) and dashboard aggregates
CREATE INDEX IF NOT EXISTS "CoinTransaction_type_reason_idx" ON "CoinTransaction"("type", "reason");
CREATE INDEX IF NOT EXISTS "CoinTransaction_userId_type_idx" ON "CoinTransaction"("userId", "type");
CREATE INDEX IF NOT EXISTS "CoinTransaction_type_reason_createdAt_idx" ON "CoinTransaction"("type", "reason", "createdAt");

-- ─── AstrologerCoinEarning ───────────────────────────────────────────────────
-- Covers earnings lookup by chat, transaction, and broadcast message
CREATE INDEX IF NOT EXISTS "AstrologerCoinEarning_chatId_idx" ON "AstrologerCoinEarning"("chatId");
CREATE INDEX IF NOT EXISTS "AstrologerCoinEarning_coinTransactionId_idx" ON "AstrologerCoinEarning"("coinTransactionId");
CREATE INDEX IF NOT EXISTS "AstrologerCoinEarning_broadcastMessageId_idx" ON "AstrologerCoinEarning"("broadcastMessageId");
