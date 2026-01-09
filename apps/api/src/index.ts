import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { setupSwagger } from './config/swagger';
import { errorHandler } from './middleware/error-handler';
import { setupSocketHandlers } from './socket';
import { setSocketInstance } from './utils/socket-instance';
import routes from './routes';

// Load environment variables from the API directory
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error('❌ ERROR: JWT_SECRET environment variable is not set in .env file');
  process.exit(1);
}

if (!process.env.ENCRYPTION_KEY) {
  console.error('❌ ERROR: ENCRYPTION_KEY environment variable is not set in .env file');
  process.exit(1);
}

// Log to verify env is loaded (remove in production)
console.log('🔧 Environment loaded from:', envPath);
console.log('🔑 JWT_SECRET:', process.env.JWT_SECRET ? '✓ Set' : '✗ Not set');
console.log('🔑 ENCRYPTION_KEY:', process.env.ENCRYPTION_KEY ? '✓ Set' : '✗ Not set');
console.log('📱 SMS_AUTH_TOKEN:', process.env.SMS_AUTH_TOKEN ? '✓ Set' : '✗ Not set');

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io with network access
// Function to check if origin is allowed
const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) {
    console.log('✅ CORS: Allowing request with no origin');
    return true; // Allow requests with no origin (like mobile apps)
  }

  console.log('🔍 CORS: Checking origin:', origin);

  // In development, allow all localhost and local network origins
  if (process.env.NODE_ENV !== 'production') {
    // Allow localhost on any port
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      console.log('✅ CORS: Allowed localhost origin');
      return true;
    }

    // Allow any local network IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    if (
      origin.match(/^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}/) ||
      origin.match(/^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}/) ||
      origin.match(/^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}/)
    ) {
      console.log('✅ CORS: Allowed local network origin');
      return true;
    }
  }

  // Production: only allow specific origins
  const allowedOrigins = [process.env.CORS_ORIGIN || '', process.env.FRONTEND_URL || ''].filter(
    Boolean
  );

  const isAllowed = allowedOrigins.includes(origin);
  console.log(isAllowed ? '✅ CORS: Allowed by whitelist' : '❌ CORS: Origin not allowed');
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

// Serve static files from uploads directory with CORS headers
app.use('/uploads', cors(), express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1', routes);

// Setup Swagger documentation
setupSwagger(app);

// Socket.io setup
setupSocketHandlers(io);
setSocketInstance(io); // Make io accessible to controllers

// Start appointment chat ender worker
import { startAppointmentChatEnderWorker } from './workers/appointmentChatEnder';
startAppointmentChatEnderWorker();

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = Number(process.env.PORT) || 4000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

httpServer.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Local: http://localhost:${PORT}/api-docs`);
  console.log(`🌐 Network: http://192.168.0.206:${PORT}/api-docs`);
  console.log(`🔌 WebSocket server ready on all interfaces`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
  });
});

export { io };
