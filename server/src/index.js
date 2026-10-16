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
// In-memory request log buffer for diagnostics
const recentRequests = [];

app.use((req, res, next) => {
  const reqInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    headers: req.headers,
    body: null,
    rawBody: null,
    responseStatus: null,
    responseBody: null,
  };

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    reqInfo.responseStatus = res.statusCode;
    try {
      reqInfo.responseBody = typeof data === 'string' ? JSON.parse(data) : data;
    } catch {
      reqInfo.responseBody = String(data).slice(0, 500);
    }
    return originalSend.apply(res, arguments);
  };

  req._reqInfo = reqInfo;
  recentRequests.unshift(reqInfo);
  if (recentRequests.length > 30) recentRequests.pop();

  next();
});

// Helper to auto-repair malformed JSON strings from ERP / external systems
function repairMalformedJson(jsonStr) {
  if (typeof jsonStr !== 'string') return jsonStr;
  let str = jsonStr.trim();

  // 1. Repair unescaped double quotes like 40"", => 40\"",
  str = str.replace(/([^:\s\\[{,])""(\s*[,}\]])/g, '$1\\""$2');

  // 2. Repair trailing extra curly braces e.g. ...}]} } => ...}]}
  let openBraces = 0;
  let closeBraces = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '{') openBraces++;
    else if (str[i] === '}') closeBraces++;
  }

  while (closeBraces > openBraces && str.endsWith('}')) {
    str = str.slice(0, -1).trim();
    closeBraces--;
  }

  return str;
}

// 1. Read body robustly using Express built-in text parser
app.use(express.text({ type: ['application/json', 'text/*', '*/*'], limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// 2. Parse and auto-repair JSON
app.use((req, res, next) => {
  if (typeof req.body === 'string') {
    const raw = req.body.trim();
    req.rawBody = raw;
    if (req._reqInfo) req._reqInfo.rawBody = raw;

    if (!raw) {
      req.body = {};
      return next();
    }

    try {
      req.body = JSON.parse(raw);
    } catch (firstErr) {
      try {
        const repaired = repairMalformedJson(raw);
        req.body = JSON.parse(repaired);
        console.log('✅ [AUTO-REPAIR] Sukses memperbaiki unescaped quote pada payload JSON dari aplikasi utama!');
      } catch (secondErr) {
        console.error('❌ [JSON PARSE FAILED] Parsing failed:', firstErr.message);
        return next(firstErr);
      }
    }
  }

  if (req._reqInfo) {
    req._reqInfo.body = req.body;
  }
  console.log(`\n📥 [REQUEST] ${req.method} ${req.originalUrl}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('📦 [BODY]:', JSON.stringify(req.body).slice(0, 300));
  }
  next();
});

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

// Debug endpoint to inspect recent API requests from main application
app.get('/api/debug/requests', (req, res) => {
  res.json({
    success: true,
    count: recentRequests.length,
    requests: recentRequests,
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
  console.error('Unhandled Server Error:', err.message);
  if (err.type === 'entity.parse.failed') {
    console.error('❌ [BODY PARSER FAILED] Raw Body received was:');
    console.error(req.rawBody || err.body);
  }
  const statusCode = err.status || (err.type === 'entity.parse.failed' ? 400 : 500);
  res.status(statusCode).json({
    success: false,
    message: err.type === 'entity.parse.failed'
      ? `Format JSON pada body request tidak valid: ${err.message}`
      : (err.message || 'Terjadi kesalahan pada internal server'),
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
