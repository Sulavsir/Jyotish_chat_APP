import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { QUEUE_NAMES } from '@jyotish/shared';
import { horoscopeDeliveryProcessor } from './horoscopeDelivery';
import { notificationProcessor } from './notification';
import { consultationReminderProcessor } from './consultationReminder';
import { appointmentSessionProcessor } from './appointmentSession';

// Redis connection
const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

// Create queues
export const horoscopeQueue = new Queue(QUEUE_NAMES.HOROSCOPE_DELIVERY, {
  connection: redisConnection,
});

export const notificationQueue = new Queue(QUEUE_NAMES.NOTIFICATION, {
  connection: redisConnection,
});

export const consultationReminderQueue = new Queue(QUEUE_NAMES.CONSULTATION_REMINDER, {
  connection: redisConnection,
});

export const appointmentSessionQueue = new Queue(QUEUE_NAMES.APPOINTMENT_SESSION, {
  connection: redisConnection,
});

// Create workers
const horoscopeWorker = new Worker(
  QUEUE_NAMES.HOROSCOPE_DELIVERY,
  horoscopeDeliveryProcessor,
  { connection: redisConnection }
);

const notificationWorker = new Worker(
  QUEUE_NAMES.NOTIFICATION,
  notificationProcessor,
  { connection: redisConnection }
);

const consultationReminderWorker = new Worker(
  QUEUE_NAMES.CONSULTATION_REMINDER,
  consultationReminderProcessor,
  { connection: redisConnection }
);

const appointmentSessionWorker = new Worker(
  QUEUE_NAMES.APPOINTMENT_SESSION,
  appointmentSessionProcessor,
  { connection: redisConnection }
);

// Worker event listeners
horoscopeWorker.on('completed', (job) => {
  console.log(`✅ Horoscope delivery job ${job.id} completed`);
});

horoscopeWorker.on('failed', (job, err) => {
  console.error(`❌ Horoscope delivery job ${job?.id} failed:`, err);
});

notificationWorker.on('completed', (job) => {
  console.log(`✅ Notification job ${job.id} completed`);
});

notificationWorker.on('failed', (job, err) => {
  console.error(`❌ Notification job ${job?.id} failed:`, err);
});

// Setup recurring jobs
export async function setupRecurringJobs() {
  // Daily horoscope delivery at 9 AM every day
  await horoscopeQueue.add(
    'daily-horoscope-delivery',
    {},
    {
      repeat: {
        pattern: '0 9 * * *', // Cron expression: Every day at 9 AM
      },
    }
  );

  // Consultation reminders - check every 15 minutes
  await consultationReminderQueue.add(
    'consultation-reminder-check',
    {},
    {
      repeat: {
        pattern: '*/15 * * * *', // Every 15 minutes
      },
    }
  );

  // Appointment session: session start notifications + session end (every minute)
  await appointmentSessionQueue.add(
    'appointment-session-check',
    {},
    {
      repeat: {
        pattern: '* * * * *', // Every minute
      },
    }
  );

  console.log('📅 Recurring jobs scheduled successfully');
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Closing workers...');
  await horoscopeWorker.close();
  await notificationWorker.close();
  await consultationReminderWorker.close();
  await appointmentSessionWorker.close();
  await redisConnection.quit();
});

