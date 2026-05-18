import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';

/**
 * @typedef {Object} RenderConfig
 * @property {string} html
 * @property {number} duration
 * @property {number} fps
 * @property {number} width
 * @property {number} height
 * @property {boolean} watermark
 */

/**
 * @typedef {Object} Job
 * @property {string} id
 * @property {'queued'|'processing'|'completed'|'failed'|'cancelled'} status
 * @property {number} progress
 * @property {RenderConfig} config
 * @property {number} createdAt
 * @property {string|null} videoUrl
 * @property {string|null} error
 */

class JobQueue extends EventEmitter {
  constructor() {
    super();
    /** @type {Map<string, Job>} */
    this.jobs = new Map();
    /** @type {string[]} */
    this.queue = [];
    this.active = 0;
    this.maxConcurrent = config.maxConcurrentJobs;
    /** @type {Map<string, AbortController>} */
    this._controllers = new Map();
  }

  /**
   * @param {RenderConfig} renderConfig
   * @returns {string} jobId
   */
  enqueue(renderConfig) {
    const jobId = uuidv4();
    /** @type {Job} */
    const job = {
      id: jobId,
      status: 'queued',
      progress: 0,
      config: renderConfig,
      createdAt: Date.now(),
      videoUrl: null,
      error: null,
    };

    this.jobs.set(jobId, job);
    this.queue.push(jobId);
    this.emit('enqueued', job);
    this._processNext();

    return jobId;
  }

  /** @param {string} jobId */
  getJob(jobId) {
    return this.jobs.get(jobId) || null;
  }

  /** @param {string} jobId */
  cancel(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    if (job.status === 'queued') {
      const idx = this.queue.indexOf(jobId);
      if (idx > -1) this.queue.splice(idx, 1);
      this._update(jobId, { status: 'cancelled', error: 'Cancelled by user' });
      return true;
    }
    if (job.status === 'processing') {
      this._controllers.get(jobId)?.abort();
      return true;
    }
    return false;
  }

  /** @param {string} jobId @param {Partial<Job>} updates */
  _update(jobId, updates) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    Object.assign(job, updates);
    this.emit('jobUpdated', { ...job });
  }

  async _processNext() {
    if (this.active >= this.maxConcurrent || this.queue.length === 0) return;

    const jobId = this.queue.shift();
    this.active++;
    this._update(jobId, { status: 'processing', progress: 0 });

    const controller = new AbortController();
    this._controllers.set(jobId, controller);

    try {
      const { renderHTML } = await import('./renderEngine.js');
      const videoUrl = await renderHTML(
        this.jobs.get(jobId).config,
        (progress) => this._update(jobId, { progress }),
        controller.signal,
      );
      this._update(jobId, { status: 'completed', progress: 100, videoUrl });
    } catch (err) {
      if (controller.signal.aborted) {
        this._update(jobId, { status: 'cancelled', error: 'Cancelled by user' });
      } else {
        console.error(`[Job ${jobId}] Failed:`, err.message);
        this._update(jobId, { status: 'failed', error: err.message });
      }
    } finally {
      this._controllers.delete(jobId);
      this.active--;
      this._processNext();
    }
  }

  /** Prune completed/failed/cancelled jobs older than ttlMs (default 1 hour) */
  pruneOldJobs(ttlMs = 3600_000) {
    const cutoff = Date.now() - ttlMs;
    const terminal = new Set(['completed', 'failed', 'cancelled']);
    for (const [id, job] of this.jobs) {
      if (terminal.has(job.status) && job.createdAt < cutoff) {
        this.jobs.delete(id);
      }
    }
  }
}

export const jobQueue = new JobQueue();

// Prune old jobs every 30 minutes
setInterval(() => jobQueue.pruneOldJobs(), 30 * 60 * 1000).unref();
