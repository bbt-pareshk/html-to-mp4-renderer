import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  outputDir: path.resolve(process.env.OUTPUT_DIR || path.join(ROOT, 'output')),
  tempDir: path.resolve(process.env.TEMP_DIR || path.join(ROOT, 'temp')),
  maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS || '2', 10),
  maxDurationSeconds: parseInt(process.env.MAX_DURATION_SECONDS || '30', 10),
  ffmpegPath: process.env.FFMPEG_PATH || null,

  render: {
    defaultWidth: 450,
    defaultHeight: 800,
    defaultFps: 30,
    defaultDuration: 5,
    networkIdleTimeout: 30000,
    initialDelayMs: 1500,
  },

  encode: {
    codec: 'libx264',
    pixelFormat: 'yuv420p',
    preset: 'fast',
    crf: 23,
  },
};
