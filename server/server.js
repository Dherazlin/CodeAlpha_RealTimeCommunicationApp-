import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import { setupSocketHandlers } from './socket/socketHandler.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Create HTTP server for Express and Socket.io
const server = http.createServer(app);

// CORS Configuration
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
const corsOriginValidator = (origin, callback) => {
  // Allow requests with no origin (like mobile apps or curl/Postman) or matching origin
  if (!origin || origin === allowedOrigin || origin.startsWith('http://localhost:')) {
    callback(null, true);
  } else {
    callback(new Error('CORS blocked origin'));
  }
};

app.use(
  cors({
    origin: corsOriginValidator,
    credentials: true,
  })
);

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

// Authentication Routes
app.use('/api/auth', authRoutes);

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

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: corsOriginValidator,
    methods: ['GET', 'POST'],
    credentials: true,
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
