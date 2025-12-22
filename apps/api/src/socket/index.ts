import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { chatHandlers } from './chatHandlers';
import { notificationHandlers } from './notificationHandlers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface SocketUser {
  id: string;
  email: string;
  role: string;
}

// Store online users
const onlineUsers = new Map<string, string>(); // userId -> socketId

export function setupSocketHandlers(io: Server) {
  // Authentication middleware
  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, JWT_SECRET) as SocketUser;
      socket.data.user = decoded;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as SocketUser;
    console.log(`User connected: ${user.id}`);

    // Store online user
    onlineUsers.set(user.id, socket.id);

    // Broadcast user online status
    io.emit('user:status', { userId: user.id, status: 'online' });

    // Setup handlers
    chatHandlers(io, socket);
    notificationHandlers(io, socket);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.id}`);
      onlineUsers.delete(user.id);
      io.emit('user:status', { userId: user.id, status: 'offline' });
    });
  });
}

export { onlineUsers };

