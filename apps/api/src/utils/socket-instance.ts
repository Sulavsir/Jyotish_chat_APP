/**
 * Socket.io Instance Singleton
 * Allows controllers to access the io instance for broadcasting
 */

import { Server } from 'socket.io';

let ioInstance: Server | null = null;

export function setSocketInstance(io: Server) {
  ioInstance = io;
}

export function getSocketInstance(): Server {
  if (!ioInstance) {
    throw new Error('Socket.io instance not initialized');
  }
  return ioInstance;
}

