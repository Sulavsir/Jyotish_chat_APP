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
const allowedOrigins: string[] = [
  'http://localhost:3000',    // Web app
  'http://localhost:3001',    // Web app alternative
  'http://localhost:3002',    // Admin panel
  'http://192.168.0.206:3000',
  'http://192.168.0.206:3001',
  'http://192.168.0.206:3002',
  process.env.CORS_ORIGIN || '',
  process.env.FRONTEND_URL || '',
].filter((origin): origin is string => Boolean(origin) && origin !== '');

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
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
    origin: allowedOrigins,
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
