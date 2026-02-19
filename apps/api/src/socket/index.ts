import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { UserRole } from '@jyotish/shared';
import { chatHandlers } from './chatHandlers';
import { notificationHandlers } from './notificationHandlers';
import { consultationRequestHandlers } from './consultationRequestHandlers';
import { setupInstantChatHandlers, expireOldInstantChatRequests } from './instantChatHandlers';
import { broadcastMessageHandlers } from './broadcastMessageHandlers';
import { adminChatHandlers } from './adminChatHandlers';
import { AUTH_CONFIG } from '../constants';
import { initializeAdminMonitor } from '../utils/admin-monitor';
import { AdminStatsEmitter } from '../utils/admin-stats-emitter';
import { prisma } from '@jyotish/database';

interface SocketUser {
  id: string;
  email: string;
  role: string;
}

// Store online users
const onlineUsers = new Map<string, string>(); // userId -> socketId

export function setupSocketHandlers(io: Server) {
  // Initialize admin monitor
  initializeAdminMonitor(io);

  // Initialize admin stats emitter for real-time dashboard updates
  AdminStatsEmitter.initialize(io);

  // Authentication middleware - reads access token from httpOnly cookie
  io.use((socket: Socket, next) => {
    try {
      // Get cookies from handshake headers
      const cookies = socket.handshake.headers.cookie;

      if (!cookies) {
        console.error('❌ Socket auth failed: No cookies provided');
        return next(new Error('Authentication error'));
      }

      // Parse cookies to get accessToken
      const cookieObj: Record<string, string> = {};
      cookies.split(';').forEach((cookie) => {
        const [key, value] = cookie.trim().split('=');
        cookieObj[key] = value;
      });

      const token = cookieObj.accessToken;

      if (!token) {
        console.error('❌ Socket auth failed: No access token in cookies');
        return next(new Error('Authentication error'));
      }

      if (!AUTH_CONFIG.JWT_SECRET) {
        console.error('❌ Socket auth failed: JWT_SECRET not configured');
        return next(new Error('Server configuration error'));
      }

      const decoded = jwt.verify(token, AUTH_CONFIG.JWT_SECRET, {
        algorithms: [AUTH_CONFIG.JWT_ALGORITHM],
      }) as SocketUser;
      socket.data.user = decoded;
      console.log('✅ Socket authenticated for user:', decoded.id);
      next();
    } catch (error) {
      console.error('❌ Socket auth failed:', error instanceof Error ? error.message : error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const user = socket.data.user as SocketUser;
    console.log(`User connected: ${user.id} (${user.role})`);

    // Store userId and userRole in socket.data for handlers
    socket.data.userId = user.id;
    socket.data.userRole = user.role;

    // Store online user
    onlineUsers.set(user.id, socket.id);

    // Update isOnline status in database
    try {
      if (user.role === UserRole.CLIENT) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isOnline: true },
        });
      } else if (user.role === UserRole.ASTROLOGER) {
        const astrologer = await prisma.astrologer.update({
          where: { id: user.id },
          data: { isOnline: true },
          select: { name: true },
        });
        console.log(`✅ Astrologer ${user.id} marked as online in database`);

        // Emit astrologer-specific event when connecting
        io.emit('astrologer:status_changed', {
          astrologerId: user.id,
          name: astrologer.name,
          isOnline: true,
        });
      }
    } catch (error) {
      console.error(`Error updating online status for ${user.id}:`, error);
    }

    // Send list of currently online users to the newly connected user
    const currentlyOnlineUserIds = Array.from(onlineUsers.keys());
    socket.emit('user:onlineList', { userIds: currentlyOnlineUserIds });
    console.log(
      `✅ Sent online users list to ${user.id}: ${currentlyOnlineUserIds.length} users online`
    );

    // Broadcast user online status to all clients
    io.emit('user:status', { userId: user.id, status: 'online' });

    // Join user-specific room for targeted messages
    socket.join(`user:${user.id}`);

    // If astrologer, join astrologers room and per-astrologer room (for Redis adapter / multi-instance)
    if (user.role === UserRole.ASTROLOGER) {
      socket.join('astrologers');
      socket.join(`astrologer:${user.id}`);
      console.log(`Astrologer ${user.id} joined astrologers room`);
    }

    // If admin, join admin room for monitoring
    if (user.role === UserRole.ADMIN) {
      socket.join('admin');
      console.log(`✅ Admin ${user.id} joined admin monitoring room`);
    }

    // Setup handlers
    chatHandlers(io, socket);
    notificationHandlers(io, socket);
    consultationRequestHandlers(io, socket);
    setupInstantChatHandlers(io, socket);
    broadcastMessageHandlers(io, socket);
    adminChatHandlers(io, socket);

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${user.id}`);
      onlineUsers.delete(user.id);
      io.emit('user:status', { userId: user.id, status: 'offline' });

      // Update isOnline status in database
      try {
        if (user.role === UserRole.CLIENT) {
          await prisma.user.update({
            where: { id: user.id },
            data: { isOnline: false },
          });
        } else if (user.role === UserRole.ASTROLOGER) {
          const astrologer = await prisma.astrologer.update({
            where: { id: user.id },
            data: { isOnline: false },
            select: { name: true },
          });
          console.log(`✅ Astrologer ${user.id} marked as offline in database`);

          // Emit astrologer-specific event when disconnecting
          io.emit('astrologer:status_changed', {
            astrologerId: user.id,
            name: astrologer.name,
            isOnline: false,
          });
        }
      } catch (error) {
        console.error(`Error updating offline status for ${user.id}:`, error);
      }
    });
  });

  // Set up periodic job to expire old instant chat requests (every minute)
  setInterval(() => {
    expireOldInstantChatRequests();
  }, 60000); // 60 seconds
}

export { onlineUsers };
