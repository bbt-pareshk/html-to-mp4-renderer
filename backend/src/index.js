import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import renderRouter from './routes/render.js';
import statusRouter from './routes/status.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Ensure output/temp dirs exist on startup
fs.mkdirSync(config.outputDir, { recursive: true });
fs.mkdirSync(config.tempDir, { recursive: true });

// In production set CORS_ORIGIN=https://your-app.vercel.app
// Leave unset (or set to *) to allow all origins during development / initial deploy
const corsOrigin = process.env.CORS_ORIGIN || config.frontendUrl || '*';

app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json({ limit: '10mb' }));

// Serve rendered MP4 files
app.use('/output', express.static(config.outputDir));

// API routes
app.use('/api/render', renderRouter);
app.use('/api/status', statusRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`[Backend] Running on http://localhost:${config.port}`);
  console.log(`[Backend] Output dir: ${config.outputDir}`);
});
