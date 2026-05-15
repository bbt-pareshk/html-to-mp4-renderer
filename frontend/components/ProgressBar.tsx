'use client';

import clsx from 'clsx';

interface Props {
  progress: number;   // 0–100
  status: string;
  label?: string;
}

const STATUS_LABELS: Record<string, string> = {
  queued:     'Queued — waiting for slot…',
  processing: 'Rendering frames…',
  completed:  'Complete',
  failed:     'Render failed',
};

export default function ProgressBar({ progress, status, label }: Props) {
  const displayLabel = label ?? STATUS_LABELS[status] ?? status;
  const isFailed = status === 'failed';

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <span className={clsx('text-xs', isFailed ? 'text-red-400' : 'text-[#8b949e]')}>
          {displayLabel}
        </span>
        <span className="text-xs text-[#484f58]">{progress}%</span>
      </div>

      <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-300',
            isFailed
              ? 'bg-red-500'
              : status === 'completed'
              ? 'bg-green-500'
              : 'bg-brand-500',
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
