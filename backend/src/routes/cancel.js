import express from 'express';
import { jobQueue } from '../services/jobQueue.js';

const router = express.Router();

router.post('/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobQueue.getJob(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
    return res.status(400).json({ error: `Job already ${job.status}` });
  }

  jobQueue.cancel(jobId);
  res.json({ success: true, jobId });
});

export default router;
