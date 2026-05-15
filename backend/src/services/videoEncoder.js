import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { createRequire } from 'module';
import { config } from '../config.js';

const execFileAsync = promisify(execFile);

// ffmpeg-static is a CJS package — use createRequire to load it from ESM
const require = createRequire(import.meta.url);
const ffmpegStatic = require('ffmpeg-static');

function getFFmpegBin() {
  // .env FFMPEG_PATH takes priority; fall back to bundled static binary
  if (config.ffmpegPath) return config.ffmpegPath;
  if (ffmpegStatic) return ffmpegStatic;
  throw new Error('No FFmpeg binary found. Set FFMPEG_PATH in .env or install ffmpeg-static.');
}

/**
 * @param {Object} opts
 * @param {string} opts.framesDir   - Directory containing frame_XXXXX.png files
 * @param {string} opts.outputFile  - Absolute path for output .mp4
 * @param {number} opts.fps
 * @param {number} opts.width
 * @param {number} opts.height
 * @param {boolean} opts.watermark
 */
export async function encodeVideo({ framesDir, outputFile, fps, width, height, watermark }) {
  const ffmpegBin = getFFmpegBin();
  const inputPattern = path.join(framesDir, 'frame_%05d.png');

  // libx264 requires even dimensions
  const safeWidth  = width  % 2 === 0 ? width  : width  + 1;
  const safeHeight = height % 2 === 0 ? height : height + 1;

  const vfFilters = [`scale=${safeWidth}:${safeHeight}`];
  if (watermark) {
    vfFilters.push("drawtext=text='HTML-to-MP4':fontsize=18:fontcolor=white@0.5:x=10:y=10");
  }

  // Use execFile + arg array — no shell involved, no quoting issues on Windows
  const args = [
    '-y',
    '-framerate', String(fps),
    '-i',         inputPattern,
    '-vcodec',    config.encode.codec,
    '-pix_fmt',   config.encode.pixelFormat,
    '-preset',    config.encode.preset,
    '-crf',       String(config.encode.crf),
    '-vf',        vfFilters.join(','),
    '-movflags',  '+faststart',
    outputFile,
  ];

  console.log(`[FFmpeg] binary: ${ffmpegBin}`);
  console.log(`[FFmpeg] encoding → ${outputFile}`);

  try {
    await execFileAsync(ffmpegBin, args, { maxBuffer: 100 * 1024 * 1024 });
  } catch (err) {
    // FFmpeg writes all progress to stderr; stderr on failure = real error message
    throw new Error(`FFmpeg failed: ${err.stderr || err.message}`);
  }

  const stat = await fs.stat(outputFile).catch(() => null);
  if (!stat || stat.size === 0) {
    throw new Error(`FFmpeg produced no output at ${outputFile}`);
  }
}
