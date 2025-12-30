import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { chatHandlers } from './chatHandlers';
import { notificationHandlers } from './notificationHandlers';
import { consultationRequestHandlers } from './consultationRequestHandlers';
import { setupInstantChatHandlers, expireOldInstantChatRequests } from './instantChatHandlers';
import { broadcastMessageHandlers } from './broadcastMessageHandlers';
import { AUTH_CONFIG } from '../constants';

interface SocketUser {
  id: string;
  email: string;
  role: string;
}

// Store online users
const onlineUsers = new Map<string, string>(); // userId -> socketId

export function setupSocketHandlers(io: Server) {
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

      const decoded = jwt.verify(token, AUTH_CONFIG.JWT_SECRET) as SocketUser;
      socket.data.user = decoded;
      console.log('✅ Socket authenticated for user:', decoded.id);
      next();
    } catch (error) {
      console.error('❌ Socket auth failed:', error instanceof Error ? error.message : error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as SocketUser;
    console.log(`User connected: ${user.id} (${user.role})`);

    // Store userId and userRole in socket.data for handlers
    socket.data.userId = user.id;
    socket.data.userRole = user.role;

    // Store online user
    onlineUsers.set(user.id, socket.id);

    // Broadcast user online status
    io.emit('user:status', { userId: user.id, status: 'online' });

    // Join user-specific room for targeted messages
    socket.join(`user:${user.id}`);

    // If astrologer, join astrologers room for broadcast messages
    if (user.role === 'ASTROLOGER') {
      socket.join('astrologers');
      console.log(`Astrologer ${user.id} joined astrologers room`);
    }

    // Setup handlers
    chatHandlers(io, socket);
    notificationHandlers(io, socket);
    consultationRequestHandlers(io, socket);
    setupInstantChatHandlers(io, socket);
    broadcastMessageHandlers(io, socket);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.id}`);
      onlineUsers.delete(user.id);
      io.emit('user:status', { userId: user.id, status: 'offline' });
    });
  });

  // Set up periodic job to expire old instant chat requests (every minute)
  setInterval(() => {
    expireOldInstantChatRequests();
  }, 60000); // 60 seconds
}

export { onlineUsers };
