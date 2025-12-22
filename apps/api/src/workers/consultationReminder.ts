import { Job } from 'bullmq';
import { prisma } from '@jyotish/database';
import { notificationQueue } from './index';

export async function consultationReminderProcessor(job: Job) {
  console.log('⏰ Checking for consultation reminders...');

  try {
    // Get consultations scheduled in the next 24 hours
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingConsultations = await prisma.consultation.findMany({
      where: {
        scheduledAt: {
          gte: now,
          lte: tomorrow,
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        astrologer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(`📋 Found ${upcomingConsultations.length} upcoming consultations`);

    for (const consultation of upcomingConsultations) {
      const hoursUntil = (consultation.scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Send reminder 24 hours before
      if (hoursUntil <= 24 && hoursUntil > 23) {
        await sendConsultationReminder(consultation, '24 hours');
      }
      // Send reminder 1 hour before
      else if (hoursUntil <= 1 && hoursUntil > 0.75) {
        await sendConsultationReminder(consultation, '1 hour');
      }
    }

    console.log('⏰ Consultation reminder check completed');
  } catch (error) {
    console.error('❌ Error in consultation reminder processor:', error);
    throw error;
  }
}

async function sendConsultationReminder(consultation: any, timeframe: string) {
  const scheduledTime = consultation.scheduledAt.toLocaleString();

  // Notify client
  await prisma.notification.create({
    data: {
      userId: consultation.client.id,
      title: 'Consultation Reminder',
      message: `Your consultation with ${consultation.astrologer.name} is scheduled in ${timeframe} (${scheduledTime})`,
      type: 'CONSULTATION_REMINDER',
      metadata: {
        consultationId: consultation.id,
        timeframe,
      },
    },
  });

  // Notify astrologer
  await prisma.notification.create({
    data: {
      userId: consultation.astrologer.id,
      title: 'Consultation Reminder',
      message: `You have a consultation with ${consultation.client.name} scheduled in ${timeframe} (${scheduledTime})`,
      type: 'CONSULTATION_REMINDER',
      metadata: {
        consultationId: consultation.id,
        timeframe,
      },
    },
  });

  // Queue email notifications
  await notificationQueue.add('send-email', {
    to: consultation.client.email,
    subject: 'Consultation Reminder',
    template: 'consultation-reminder',
    data: {
      clientName: consultation.client.name,
      astrologerName: consultation.astrologer.name,
      scheduledTime,
      timeframe,
    },
  });

  console.log(`✅ Sent ${timeframe} reminder for consultation ${consultation.id}`);
}

