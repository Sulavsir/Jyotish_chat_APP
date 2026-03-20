-- Indexes for admin sidebar-counts and dashboard queries
-- User.createdAt: newUsersToday count (createdAt >= today)
CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt");
