const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export interface RenderRequest {
  html: string;
  duration: number;
  fps: number;
  watermark: boolean;
  width: number;
  height: number;
}

export interface RenderJob {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  videoUrl: string | null;
  error: string | null;
  createdAt: number;
}

export async function submitRender(req: RenderRequest): Promise<{ jobId: string }> {
  const res = await fetch(`${BACKEND}/api/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Server error ${res.status}`);
  }

  return res.json();
}

export async function pollJob(jobId: string): Promise<RenderJob> {
  const res = await fetch(`${BACKEND}/api/status/${jobId}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Status check failed ${res.status}`);
  }

  return res.json();
}

/**
 * Resolves when the job reaches 'completed' or 'failed'.
 * Calls onUpdate on every poll tick.
 */
export async function waitForJob(
  jobId: string,
  onUpdate: (job: RenderJob) => void,
  intervalMs = 1000,
  signal?: AbortSignal,
): Promise<RenderJob> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new Error('Cancelled by user')); return; }

    const timer = setInterval(async () => {
      if (signal?.aborted) {
        clearInterval(timer);
        reject(new Error('Cancelled by user'));
        return;
      }
      try {
        const job = await pollJob(jobId);
        onUpdate(job);
        if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
          clearInterval(timer);
          if (job.status === 'completed') resolve(job);
          else reject(new Error(job.error ?? 'Render failed'));
        }
      } catch (err) {
        clearInterval(timer);
        reject(err);
      }
    }, intervalMs);

    signal?.addEventListener('abort', () => {
      clearInterval(timer);
      reject(new Error('Cancelled by user'));
    });
  });
}

export async function cancelRender(jobId: string): Promise<void> {
  await fetch(`${BACKEND}/api/cancel/${jobId}`, { method: 'POST' }).catch(() => {});
}

export function videoDownloadUrl(relativeUrl: string): string {
  return `${BACKEND}${relativeUrl}`;
}
