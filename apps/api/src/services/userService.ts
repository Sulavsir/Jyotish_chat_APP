/**
 * User Service
 * Business logic for user operations
 */

import { prisma } from '@jyotish/database';

/**
 * Get all astrologers (for clients)
 * NOTE: Includes isOnline field - clients CAN see which astrologers are online
 */
export const getAstrologers = async (limit = 10, onlineOnly = true) => {
  const astrologers = await prisma.astrologer.findMany({
    where: {
      isActive: true,
      ...(onlineOnly ? { isOnline: true } : {}), // Filter by online status
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      profilePhoto: true,
      isOnline: true, // ✅ Clients CAN see astrologer online status
      createdAt: true,
    },
    take: limit,
    orderBy: [
      { isOnline: 'desc' }, // Online astrologers first
      { createdAt: 'desc' },
    ],
  });

  // Map to match the expected format (add role field for consistency)
  return astrologers.map((astrologer) => ({
    ...astrologer,
    role: 'ASTROLOGER',
  }));
};

/**
 * Get all clients (for astrologers)
 * NOTE: Does NOT include isOnline - astrologers cannot see which clients are online
 * They can only see online status in active chat conversations
 */
export const getClients = async (limit = 10) => {
  const clients = await prisma.user.findMany({
    where: {
      role: 'CLIENT',
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      profilePhoto: true,
      role: true,
      zodiacSign: true,
      // isOnline: EXCLUDED - astrologers should NOT see client online status in list
      createdAt: true,
    },
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
  });

  return clients;
};

/**
 * Get users the current user can chat with
 */
export const getChatableUsers = async (userId: string, userRole: string) => {
  if (userRole === 'ASTROLOGER') {
    // Astrologers can chat with clients
    return getClients(20);
  } else {
    // Clients can chat with astrologers
    return getAstrologers(20);
  }
};
