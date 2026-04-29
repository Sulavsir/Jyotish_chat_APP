import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { setupSwagger } from './config/swagger';
import { errorHandler } from './middleware/error-handler';
import { setupSocketHandlers } from './socket';
import { setSocketInstance } from './utils/socket-instance';
import { getSocketRedisAdapter, closeSocketRedisClients } from './config/socket-redis';
import routes from './routes';
import { setupRecurringJobs } from './workers';
import { getVersion } from './controllers/version.controller';
import { maintenanceMiddleware } from './middleware/maintenance.middleware';
import { getFrontendOrigin } from './constants/frontend.constants';

// Load environment variables from apps/api/.env only (MAINTENANCE_MODE defaults off when unset)
const envPath = path.resolve(__dirname, '../.env');
const envResult = dotenv.config({ path: envPath });
const isDevelopment = process.env.NODE_ENV === 'development';

if (envResult.error) {
  if (isDevelopment) {
    console.warn('⚠️ Warning: Could not load .env file:', envResult.error.message);
  }
} else if (isDevelopment) {
  console.log('✅ Environment variables loaded from:', envPath);
  // Verify SMTP config is loaded (only in development)
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  if (smtpHost && smtpUser && smtpPassword) {
    console.log('✅ SMTP configuration detected in environment');
  } else {
    console.warn('⚠️ SMTP configuration not found in environment variables');
  }
}

// Construct DATABASE_URL from individual DB variables if not set
if (!process.env.DATABASE_URL && process.env.DB_HOST) {
  const dbUser = process.env.DB_USER || 'postgres';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5432';
  const dbName = process.env.DB_NAME || 'jyotish';

  process.env.DATABASE_URL = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?schema=public`;
  console.log('🔧 DATABASE_URL constructed from individual DB variables');
}

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error('❌ ERROR: JWT_SECRET environment variable is not set in .env file');
  process.exit(1);
}

if (!process.env.ENCRYPTION_KEY) {
  console.error('❌ ERROR: ENCRYPTION_KEY environment variable is not set in .env file');
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1);
const httpServer = createServer(app);

/** Background tick: broadcast timer expiry + auto-assign (see runBroadcastExpirySweepThrottled). */
let broadcastExpireSweepInterval: ReturnType<typeof setInterval> | null = null;

// Initialize Socket.io with network access
const normalizeOrigin = (raw: string): string => raw.trim().replace(/\/+$/, '');

// Build allowed origins list once (normalized, no duplicates)
const getAllowedOrigins = (): string[] => {
  const corsOrigin = process.env.CORS_ORIGIN || '';
  const list = corsOrigin
    .split(',')
    .map((url) => normalizeOrigin(url))
    .filter(Boolean);
  const set = new Set(list);
  set.add(normalizeOrigin(getFrontendOrigin()));
  return Array.from(set);
};

let cachedAllowedOrigins: string[] | null = null;
const getAllowedOriginsCached = (): string[] => {
  if (cachedAllowedOrigins === null) {
    cachedAllowedOrigins = getAllowedOrigins();
  }
  return cachedAllowedOrigins;
};

const debugCors = process.env.DEBUG_CORS === '1' || process.env.DEBUG_CORS === 'true';

const allowEmptyOrigin =
  process.env.NODE_ENV !== 'production' || process.env.CORS_ALLOW_EMPTY_ORIGIN !== '0';

// Function to check if origin is allowed. Production: only origins in CORS_ORIGIN are allowed.
const isOriginAllowed = (origin: string | undefined): boolean => {
  const hasOrigin = origin && origin !== 'null';

  if (!hasOrigin) {
    if (allowEmptyOrigin) {
      return true;
    }
    if (debugCors) {
      console.warn('[CORS] Rejected request with no Origin (production strict mode)');
    }
    return false;
  }

  const normalizedOrigin = normalizeOrigin(origin);

  if (process.env.NODE_ENV !== 'production') {
    if (normalizedOrigin.includes('localhost') || normalizedOrigin.includes('127.0.0.1')) {
      return true;
    }
    if (
      /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}/.test(normalizedOrigin) ||
      /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(normalizedOrigin) ||
      /^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}/.test(normalizedOrigin)
    ) {
      return true;
    }
  }

  const allowedOrigins = getAllowedOriginsCached();
  const isAllowed = allowedOrigins.length > 0 && allowedOrigins.includes(normalizedOrigin);

  if (debugCors && !isAllowed) {
    console.warn('[CORS] Rejected origin:', normalizedOrigin, '| Allowed:', allowedOrigins);
  }

  return isAllowed;
};

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(compression());
app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Parse cookies for httpOnly refresh token
app.use(morgan('dev'));

// Maintenance: 503 on /api/v1 and /api-docs; /health and /api/version stay available
app.use(maintenanceMiddleware);

// Global API rate limit (per IP). Set RATE_LIMIT_MAX=0 to disable. For 10k+ concurrent traffic, use multiple instances + load balancer.
const rateLimitMax = Math.max(0, parseInt(process.env.RATE_LIMIT_MAX ?? '500', 10));
const rateLimitWindowMs = Math.max(1000, parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10)); // 1 min default
if (rateLimitMax > 0) {
  app.use(
    '/api',
    rateLimit({
      windowMs: rateLimitWindowMs,
      max: rateLimitMax,
      message: { success: false, message: 'Too many requests, please try again later.' },
      standardHeaders: true,
      legacyHeaders: false,
    })
  );
}

// Serve static files from uploads directory with CORS headers
app.use('/uploads', cors(), express.static(path.join(__dirname, '../uploads')));

// Jyotish notification rings (Flutter/web can fetch or map cue → bundled asset)
app.use(
  '/static/notifications-ring',
  cors(),
  express.static(path.join(__dirname, '../Notifications_ring_bell'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.mpeg') || filePath.endsWith('.mp3')) {
        res.setHeader('Content-Type', 'audio/mpeg');
      }
    },
  })
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Force-update endpoint for Flutter app (no /v1 - at /api/version)
app.get('/api/version', getVersion);
app.get('/api/version/', getVersion);

// API Routes
app.use('/api/v1', routes);

// Setup Swagger documentation
setupSwagger(app);

// Error handler (must be last)
app.use(errorHandler);

// Start server (async so we can attach Socket.io Redis adapter when Redis is configured)
async function start() {
  const adapter = await getSocketRedisAdapter();
  if (adapter) {
    io.adapter(adapter);
  }

  setupSocketHandlers(io);
  setSocketInstance(io);

  const { startAppointmentChatEnderWorker } = await import('./workers/appointmentChatEnder');
  startAppointmentChatEnderWorker();

  // Schedule BullMQ recurring jobs (horoscope delivery, consultation reminders, appointment sessions)
  try {
    await setupRecurringJobs();
  } catch (err) {
    console.error('Failed to setup recurring jobs:', err);
  }

  const PORT = Number(process.env.PORT) || 4000;
  const HOST = '0.0.0.0';

  httpServer.listen(PORT, HOST, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 Local: http://localhost:${PORT}/api-docs`);
    console.log(`🌐 Network: http://192.168.0.206:${PORT}/api-docs`);
    console.log(`🔌 WebSocket server ready on all interfaces`);

    const { runBroadcastExpirySweepThrottled } = await import('./services/broadcastMessage.service');
    const tickMs = Math.max(
      5000,
      parseInt(process.env.BROADCAST_EXPIRE_SWEEP_TICK_MS ?? '10000', 10)
    );
    void runBroadcastExpirySweepThrottled();
    broadcastExpireSweepInterval = setInterval(() => {
      void runBroadcastExpirySweepThrottled();
    }, tickMs);
    console.log(
      `⏱️ Broadcast expiry / auto-assign tick every ${tickMs}ms (work is throttled; override with BROADCAST_EXPIRE_SWEEP_TICK_MS)`
    );
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

async function gracefulShutdown(signal: string) {
  console.log(`${signal} received: closing HTTP server`);
  if (broadcastExpireSweepInterval) {
    clearInterval(broadcastExpireSweepInterval);
    broadcastExpireSweepInterval = null;
  }
  await closeSocketRedisClients();
  httpServer.close(() => {
    console.log('HTTP server closed');
  });
}

process.on('SIGTERM', () => {
  void gracefulShutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void gracefulShutdown('SIGINT');
});

export { io };
