/**
 * Appointment Chat Ender Worker
 * Automatically ends chats for premium astrologers when appointment time expires
 */

import { prisma } from '@jyotish/database';
import { getSocketInstance } from '../utils/socket-instance';

/**
 * Check and end chats for expired appointments
 * This should be run periodically (e.g., every minute)
 */
export async function endExpiredAppointmentChats() {
  try {
    const now = new Date();

    // Find all active chats with premium astrologers that have appointments
    const activeChats = await prisma.chat.findMany({
      where: {
        status: 'ACTIVE',
        isLocked: false,
        consultationId: {
          not: null,
        },
      },
      include: {
        astrologerParticipant: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });

    for (const chat of activeChats) {
      // Only process premium astrologers
      if (chat.astrologerParticipant.category !== 'PREMIUM') {
        continue;
      }

      // Get the appointment
      const appointment = await prisma.appointment.findUnique({
        where: { id: chat.consultationId! },
        select: {
          scheduledAt: true,
          duration: true,
          status: true,
        },
      });

      if (!appointment) {
        continue;
      }

      // Calculate appointment end time
      const appointmentEndTime = new Date(appointment.scheduledAt);
      appointmentEndTime.setMinutes(appointmentEndTime.getMinutes() + appointment.duration);

      // If appointment time has expired, end the chat
      if (now > appointmentEndTime) {
        await prisma.chat.update({
          where: { id: chat.id },
          data: {
            status: 'ENDED',
            endedAt: now,
            endedBy: 'SYSTEM',
          },
        });

        // Notify both participants via socket
        const io = getSocketInstance();
        if (io) {
          const message = `Your appointment time with ${chat.astrologerParticipant.name} has ended. Please book another appointment to continue chatting.`;
          
          io.to(`user_${chat.participant1Id}`).emit('chat:ended', {
            chatId: chat.id,
            reason: 'APPOINTMENT_EXPIRED',
            message,
          });

          io.to(`user_${chat.participant2Id}`).emit('chat:ended', {
            chatId: chat.id,
            reason: 'APPOINTMENT_EXPIRED',
            message: 'Appointment time has ended. The chat has been closed.',
          });
        }

        console.log(`✅ Auto-ended chat ${chat.id} - Appointment expired`);
      }
    }
  } catch (error) {
    console.error('❌ Error ending expired appointment chats:', error);
  }
}

// Run every minute
export function startAppointmentChatEnderWorker() {
  // Run immediately
  endExpiredAppointmentChats();

  // Then run every minute
  const interval = setInterval(endExpiredAppointmentChats, 60 * 1000);

  console.log('✅ Appointment chat ender worker started');

  return () => {
    clearInterval(interval);
    console.log('🛑 Appointment chat ender worker stopped');
  };
}

