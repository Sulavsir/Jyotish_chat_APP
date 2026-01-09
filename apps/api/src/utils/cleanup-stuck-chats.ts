/**
 * Utility to cleanup stuck chats
 * Run this if users are still seeing "active chat" errors after the fix
 */

import { prisma } from '@jyotish/database';

/**
 * Find and fix chats that are marked as ACTIVE but should be ENDED
 * - Chats with endedAt date but still ACTIVE
 * - Chats that are locked but still ACTIVE
 */
export async function cleanupStuckChats() {
  console.log('🔍 Looking for stuck chats...');

  // Find chats that have endedAt but are still ACTIVE
  const stuckChats = await prisma.chat.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { endedAt: { not: null } }, // Has endedAt but still ACTIVE
        { isLocked: true }, // Is locked but still ACTIVE
      ],
    },
    select: {
      id: true,
      status: true,
      isLocked: true,
      endedAt: true,
      endedBy: true,
      participant1Id: true,
      participant2Id: true,
      createdAt: true,
    },
  });

  if (stuckChats.length === 0) {
    console.log('✅ No stuck chats found!');
    return { fixed: 0, chats: [] };
  }

  console.log(`❌ Found ${stuckChats.length} stuck chats:`);
  stuckChats.forEach((chat) => {
    console.log(`  - Chat ${chat.id}: endedAt=${chat.endedAt}, isLocked=${chat.isLocked}`);
  });

  // Fix all stuck chats
  const result = await prisma.chat.updateMany({
    where: {
      id: { in: stuckChats.map((c) => c.id) },
    },
    data: {
      status: 'ENDED',
      isLocked: true,
      endedAt: new Date(), // Set to now if not already set
    },
  });

  console.log(`✅ Fixed ${result.count} stuck chats!`);

  return {
    fixed: result.count,
    chats: stuckChats,
  };
}

/**
 * Run cleanup if this file is executed directly
 */
if (require.main === module) {
  cleanupStuckChats()
    .then((result) => {
      console.log('\n✅ Cleanup complete:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Cleanup failed:', error);
      process.exit(1);
    });
}



