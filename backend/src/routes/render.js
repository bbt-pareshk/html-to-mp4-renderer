import express from 'express';
import { jobQueue } from '../services/jobQueue.js';
import { config } from '../config.js';

const router = express.Router();

router.post('/', (req, res) => {
  const {
    html,
    duration = config.render.defaultDuration,
    fps = config.render.defaultFps,
    width = config.render.defaultWidth,
    height = config.render.defaultHeight,
    watermark = false,
  } = req.body;

  if (!html || typeof html !== 'string' || html.trim().length === 0) {
    return res.status(400).json({ error: 'html field is required and must be a non-empty string.' });
  }

  if (typeof duration !== 'number' || duration < 1 || duration > config.maxDurationSeconds) {
    return res.status(400).json({
      error: `duration must be a number between 1 and ${config.maxDurationSeconds}.`,
    });
  }

  if (typeof fps !== 'number' || fps < 1 || fps > 60) {
    return res.status(400).json({ error: 'fps must be between 1 and 60.' });
  }

  const jobId = jobQueue.enqueue({ html, duration, fps, width, height, watermark });

  res.status(202).json({ success: true, jobId });
});

export default router;
