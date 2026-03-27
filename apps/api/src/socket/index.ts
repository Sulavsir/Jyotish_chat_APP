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
import * as socketPresence from './socketPresence';

interface SocketUser {
  id: string;
  email: string;
  role: string;
}

export function setupSocketHandlers(io: Server) {
  initializeAdminMonitor(io);
  AdminStatsEmitter.initialize(io);

  io.use((socket: Socket, next) => {
    try {
      const cookies = socket.handshake.headers.cookie;

      if (!cookies) {
        console.error('❌ Socket auth failed: No cookies provided');
        return next(new Error('Authentication error'));
      }

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

    socket.data.userId = user.id;
    socket.data.userRole = user.role;

    const prevSocketCount = socketPresence.getSocketCount(user.id);
    const isFirstSocket = prevSocketCount === 0;
    socketPresence.registerSocket(user.id, socket.id, user.role);

    try {
      if (user.role === UserRole.CLIENT) {
        if (isFirstSocket) {
          await prisma.user.update({
            where: { id: user.id },
            data: { isOnline: true },
          });
          io.emit('user:status', { userId: user.id, status: 'online' });
        }
      } else if (user.role === UserRole.ASTROLOGER && isFirstSocket) {
        // DB `isOnline` is only changed by login, logout, toggle, or admin flows — not by sockets.
        const astrologer = await prisma.astrologer.findUnique({
          where: { id: user.id },
          select: { name: true, isOnline: true },
        });
        if (astrologer?.isOnline) {
          io.emit('user:status', { userId: user.id, status: 'online' });
        }
      }
    } catch (error) {
      console.error(`Error restoring online status for ${user.id}:`, error);
    }

    const currentlyOnlineUserIds = socketPresence.getOnlineUserIds();
    socket.emit('user:onlineList', { userIds: currentlyOnlineUserIds });
    console.log(
      `✅ Sent online users list to ${user.id}: ${currentlyOnlineUserIds.length} users online`
    );

    socket.join(`user:${user.id}`);

    if (user.role === UserRole.ASTROLOGER) {
      socket.join('astrologers');
      socket.join(`astrologer:${user.id}`);
      console.log(`Astrologer ${user.id} joined astrologers room`);
    }

    if (user.role === UserRole.ADMIN) {
      socket.join('admin');
      console.log(`✅ Admin ${user.id} joined admin monitoring room`);
    }

    chatHandlers(io, socket);
    notificationHandlers(io, socket);
    consultationRequestHandlers(io, socket);
    setupInstantChatHandlers(io, socket);
    broadcastMessageHandlers(io, socket);
    adminChatHandlers(io, socket);

    socket.on('disconnect', async () => {
      const lastSocket = socketPresence.unregisterSocket(user.id, socket.id, user.role);
      if (!lastSocket) {
        console.log(`Socket closed for ${user.id} (other tabs still connected)`);
        return;
      }

      console.log(`User fully disconnected: ${user.id}`);
      io.emit('user:status', { userId: user.id, status: 'offline' });

      try {
        if (user.role === UserRole.CLIENT) {
          await prisma.user.update({
            where: { id: user.id },
            data: { isOnline: false },
          });
        }
        // Astrologer DB isOnline is unchanged on disconnect (persists until logout or explicit toggle).
      } catch (error) {
        console.error(`Error handling disconnect for ${user.id}:`, error);
      }
    });
  });

  setInterval(() => {
    expireOldInstantChatRequests();
  }, 60000);
}
