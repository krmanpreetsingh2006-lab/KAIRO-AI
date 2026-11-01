import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import chatRouter from './routes/chat.js';
import { apiLimiter } from './middleware/rateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from both root .env and server/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin === CLIENT_ORIGIN || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Request body parser with payload limit (supports images & documents)
app.use(express.json({ limit: '30mb' }));

// Apply rate limiting to all API requests
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const isKeyConfigured = Boolean(apiKey && apiKey.trim() !== '' && apiKey !== 'your_gemini_api_key_here');

  res.json({
    status: 'online',
    product: 'KAIRO AI',
    tagline: 'Intelligence Beyond Limits.',
    version: '1.0.1',
    timezone: 'Asia/Kolkata',
    model: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
    apiKeyConfigured: isKeyConfigured,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

// Chat stream route
app.use('/api/chat', chatRouter);

// Serve client static build in production if available
const clientBuildPath = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// Fallback to index.html for single-page app routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('KAIRO AI Backend Relay is running. Start the Vite dev client or run `npm run build` to serve the full app.');
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[KAIRO Server Fatal]:', err);
  res.status(500).json({
    error: 'Internal server error encountered in KAIRO AI relay.',
  });
});

export default app;
