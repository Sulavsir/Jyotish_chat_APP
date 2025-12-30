/**
 * User Service
 * Business logic for user operations
 */

import { prisma } from '@jyotish/database';

/**
 * Get all astrologers
 */
export const getAstrologers = async (limit = 10) => {
  const astrologers = await prisma.user.findMany({
    where: {
      role: 'ASTROLOGER',
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      profilePhoto: true,
      role: true,
      createdAt: true,
    },
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
  });

  return astrologers;
};

/**
 * Get all clients (for astrologers)
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

