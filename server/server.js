import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import { setupSocketHandlers } from './socket/socketHandler.js';

// Load environment variables
dotenv.config();

// Production guard: abort startup if required secrets are missing.
// This prevents the server from silently running with the fallback JWT secret.
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('[Server] FATAL: JWT_SECRET environment variable is not set. Aborting server startup.');
  process.exit(1);
}

// Connect to MongoDB
connectDB();

const app = express();

// Security headers — applied before CORS so they are always present.
// contentSecurityPolicy is disabled because WebRTC / Socket.io require
// broad connection permissions that CSP would otherwise block.
app.use(helmet({ contentSecurityPolicy: false }));

// Create HTTP server for Express and Socket.io
const server = http.createServer(app);

// Auth-specific rate limiter: 20 requests per 15 minutes per IP.
// Protects /api/auth/login and /api/auth/register from brute-force.
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
  skipSuccessfulRequests: false,
});

// CORS Configuration
// Normalize the allowed origin: trim whitespace and remove any trailing slash
// so that copy-paste differences in Render's dashboard don't cause silent failures.
const allowedOrigin = (process.env.CLIENT_URL || 'http://localhost:5173').trim().replace(/\/+$/, '');

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl / Postman / mobile apps) or matching origin
    if (!origin) {
      return callback(null, true);
    }
    // Normalize the incoming origin the same way
    const normalizedOrigin = origin.trim().replace(/\/+$/, '');
    if (normalizedOrigin === allowedOrigin || normalizedOrigin.startsWith('http://localhost')) {
      return callback(null, true);
    }
    console.warn(`[CORS] Blocked origin: "${origin}" (allowed: "${allowedOrigin}")`);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Apply CORS globally — cors() intercepts OPTIONS preflight requests directly
// and responds with 204 before any route or middleware runs. No separate
// app.options() handler is needed when using the app.use() form.
app.use(cors(corsOptions));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Korus server is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
// Auth routes get the brute-force rate limiter applied at the router level
app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/meetings', meetingRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Initialize Socket.io with the same CORS policy as Express
const io = new Server(server, {
  cors: {
    origin: corsOptions.origin,
    methods: corsOptions.methods,
    allowedHeaders: corsOptions.allowedHeaders,
    credentials: corsOptions.credentials,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Attach Socket.io event handlers
setupSocketHandlers(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`[Korus Server] Express backend with Socket.io running on port ${PORT}`);
  console.log(`[Korus Server] Health check available at http://localhost:${PORT}/api/health`);
});
