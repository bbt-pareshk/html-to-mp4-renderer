import express from 'express';
import { jobQueue } from '../services/jobQueue.js';

const router = express.Router();

router.get('/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobQueue.getJob(jobId);

  if (!job) {
    return res.status(404).json({ error: `Job ${jobId} not found.` });
  }

  res.json({
    jobId: job.id,
    status: job.status,      // queued | processing | completed | failed
    progress: job.progress,  // 0–100
    videoUrl: job.videoUrl,  // non-null when completed
    error: job.error,        // non-null when failed
    createdAt: job.createdAt,
  });
});

export default router;
