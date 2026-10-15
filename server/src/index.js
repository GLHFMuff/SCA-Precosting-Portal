import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { testConnection, getDbStatus } from './db/connection.js';
import precostingRoutes from './routes/precostingRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import authRoutes from './routes/authRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverEnvPath = path.resolve(__dirname, '../.env');
const cwdEnvPath = path.resolve(process.cwd(), 'server/.env');

if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
} else if (fs.existsSync(cwdEnvPath)) {
  dotenv.config({ path: cwdEnvPath });
} else {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const configuredOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // allow same-origin, curl, server-to-server, or matched origins
    if (!origin || configuredOrigins.includes('*') || configuredOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Static files for garment uploads
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = getDbStatus();
  res.json({
    status: 'ok',
    service: 'Cloth Precosting Portal API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: {
      client: dbStatus.client,
      connected: dbStatus.isConnected,
      mode: dbStatus.isConnected ? `${dbStatus.client.toUpperCase()} Database` : 'Integrated In-Memory Store (Fallback)',
    },
  });
});

// API Routes
app.use('/api/precostings', precostingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);

// Serve frontend static build if dist exists (Production Standalone Mode)
const distPath = path.resolve(__dirname, '../../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Root route if dist is not yet built
  app.get('/', (req, res) => {
    res.json({
      message: 'Cloth Precosting Portal API is running!',
      docs: {
        health: 'GET /api/health',
        precostings: 'GET /api/precostings',
        dashboardStats: 'GET /api/dashboard/stats',
        authLogin: 'POST /api/auth/login',
      },
    });
  });
}

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan pada internal server',
  });
});

// Start Server & Test DB
app.listen(PORT, async () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Cloth Precosting Backend Server aktif di:`);
  console.log(`   URL: http://localhost:${PORT}`);
  console.log(`   API Base: http://localhost:${PORT}/api`);
  console.log(`======================================================`);

  await testConnection();
});
