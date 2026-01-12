import { Job } from 'bullmq';
import { prisma } from '@jyotish/database';
import { ParticipantType } from '@prisma/client';
import { formatDate, ZodiacSign } from '@jyotish/shared';
import { notificationQueue } from './index';

export async function horoscopeDeliveryProcessor(job: Job) {
  console.log('🌟 Starting daily horoscope delivery...');

  try {
    const today = formatDate(new Date());

    // Get all active horoscope subscriptions
    const subscriptions = await prisma.horoscopeSubscription.findMany({
      where: {
        isActive: true,
        frequency: 'DAILY',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            zodiacSign: true,
          },
        },
      },
    });

    console.log(`📧 Found ${subscriptions.length} active subscriptions`);

    // Process each subscription
    for (const subscription of subscriptions) {
      if (!subscription.user.zodiacSign) {
        console.log(`⚠️ User ${subscription.user.email} has no zodiac sign set, skipping...`);
        continue;
      }

      try {
        // Get today's horoscope for user's zodiac sign
        const horoscope = await prisma.horoscope.findFirst({
          where: {
            zodiacSign: subscription.user.zodiacSign,
            date: new Date(today),
            category: 'DAILY',
          },
        });

        if (!horoscope) {
          console.log(`⚠️ No horoscope found for ${subscription.user.zodiacSign} on ${today}`);
          continue;
        }

        // Create notification
        await prisma.notification.create({
          data: {
            userId: subscription.user.id,
            recipientType: ParticipantType.CLIENT,
            title: `Your Daily Horoscope - ${subscription.user.zodiacSign}`,
            message: horoscope.content.substring(0, 200) + '...', // Preview
            type: 'HOROSCOPE',
            metadata: {
              horoscopeId: horoscope.id,
              zodiacSign: horoscope.zodiacSign,
              date: today,
            },
          },
        });

        // Queue email notification (if email service is configured)
        await notificationQueue.add('send-email', {
          to: subscription.user.email,
          subject: `Your Daily Horoscope - ${subscription.user.zodiacSign}`,
          template: 'daily-horoscope',
          data: {
            name: subscription.user.name,
            zodiacSign: subscription.user.zodiacSign,
            horoscope: horoscope.content,
            date: today,
          },
        });

        console.log(`✅ Delivered horoscope to ${subscription.user.email}`);
      } catch (error) {
        console.error(`❌ Error delivering horoscope to ${subscription.user.email}:`, error);
      }
    }

    console.log('🌟 Daily horoscope delivery completed');
  } catch (error) {
    console.error('❌ Error in horoscope delivery processor:', error);
    throw error;
  }
}

