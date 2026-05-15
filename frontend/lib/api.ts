const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export interface RenderRequest {
  html: string;
  duration: number;
  fps: number;
  watermark: boolean;
}

export interface RenderJob {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
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
): Promise<RenderJob> {
  return new Promise((resolve, reject) => {
    const timer = setInterval(async () => {
      try {
        const job = await pollJob(jobId);
        onUpdate(job);

        if (job.status === 'completed' || job.status === 'failed') {
          clearInterval(timer);
          if (job.status === 'completed') resolve(job);
          else reject(new Error(job.error ?? 'Render failed'));
        }
      } catch (err) {
        clearInterval(timer);
        reject(err);
      }
    }, intervalMs);
  });
}

export function videoDownloadUrl(relativeUrl: string): string {
  return `${BACKEND}${relativeUrl}`;
}
