import { Server } from 'socket.io';

/**
 * Utility to emit real-time stats updates to admin clients
 * Emits to all connected admins in the 'admin' room
 */
export class AdminStatsEmitter {
  private static io: Server | null = null;

  /**
   * Initialize with Socket.IO server instance
   */
  static initialize(io: Server) {
    this.io = io;
    console.log('✅ AdminStatsEmitter initialized');
  }

  /**
   * Get the Socket.IO instance
   */
  private static getIo(): Server {
    if (!this.io) {
      throw new Error('AdminStatsEmitter not initialized. Call initialize() first.');
    }
    return this.io;
  }

  /**
   * Emit when a new user registers
   */
  static emitNewUser() {
    try {
      const io = this.getIo();
      io.to('admin').emit('user:new');
      console.log('📊 Emitted user:new to admin clients');
    } catch (error) {
      console.error('❌ Failed to emit user:new:', error);
    }
  }

  /**
   * Emit when a new astrologer is created
   */
  static emitNewAstrologer() {
    try {
      const io = this.getIo();
      io.to('admin').emit('astrologer:new');
      console.log('📊 Emitted astrologer:new to admin clients');
    } catch (error) {
      console.error('❌ Failed to emit astrologer:new:', error);
    }
  }

  /**
   * Emit when a new chat becomes active
   */
  static emitNewChat() {
    try {
      const io = this.getIo();
      io.to('admin').emit('chat:new');
      console.log('📊 Emitted chat:new to admin clients');
    } catch (error) {
      console.error('❌ Failed to emit chat:new:', error);
    }
  }

  /**
   * Emit when a chat ends (decrement active chats)
   */
  static emitChatEnded() {
    try {
      const io = this.getIo();
      io.to('admin').emit('chat:ended');
      console.log('📊 Emitted chat:ended to admin clients');
    } catch (error) {
      console.error('❌ Failed to emit chat:ended:', error);
    }
  }

  /**
   * Emit when new earnings are added
   */
  static emitNewEarning(amount: number) {
    try {
      const io = this.getIo();
      io.to('admin').emit('earning:new', { amount });
      console.log(`📊 Emitted earning:new to admin clients (amount: ${amount})`);
    } catch (error) {
      console.error('❌ Failed to emit earning:new:', error);
    }
  }

  /**
   * Emit when a new consultation is created (for today's consultations)
   */
  static emitNewConsultation() {
    try {
      const io = this.getIo();
      io.to('admin').emit('consultation:new');
      console.log('📊 Emitted consultation:new to admin clients');
    } catch (error) {
      console.error('❌ Failed to emit consultation:new:', error);
    }
  }

  /**
   * Emit a complete stats update (when stats are manually refreshed)
   */
  static emitStatsUpdate(stats: {
    totalUsers?: number;
    totalAstrologers?: number;
    activeChats?: number;
    totalEarnings?: number;
    pendingPayouts?: number;
    todayConsultations?: number;
  }) {
    try {
      const io = this.getIo();
      io.to('admin').emit('stats:update', stats);
      console.log('📊 Emitted stats:update to admin clients:', stats);
    } catch (error) {
      console.error('❌ Failed to emit stats:update:', error);
    }
  }
}


