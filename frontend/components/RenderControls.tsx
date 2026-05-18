'use client';

import { Clock, Gauge, Droplets, Wand2, Monitor, Zap } from 'lucide-react';
import clsx from 'clsx';

export interface RenderOptions {
  duration: number;
  fps: number;
  watermark: boolean;
  width: number;
  height: number;
}

interface Props {
  options: RenderOptions;
  onChange: (opts: RenderOptions) => void;
  autoMode: boolean;
  detectedDuration: number | null;
  onAutoModeChange: (auto: boolean) => void;
  onSmartDetect?: () => void;
  disabled?: boolean;
}

const RESOLUTION_PRESETS = [
  { id: 'reels',     label: 'Reels',    width: 450, height: 800, ratio: '9:16' },
  { id: 'square',    label: 'Square',   width: 500, height: 500, ratio: '1:1'  },
  { id: 'landscape', label: 'Wide',     width: 800, height: 450, ratio: '16:9' },
  { id: 'portrait',  label: 'Portrait', width: 480, height: 600, ratio: '4:5'  },
] as const;

const MANUAL_DURATION_PRESETS = [5, 10, 15, 20, 30, 40, 50, 60];
const FPS_PRESETS = [15, 24, 30, 60];

export { RESOLUTION_PRESETS };

export default function RenderControls({
  options,
  onChange,
  autoMode,
  detectedDuration,
  onAutoModeChange,
  onSmartDetect,
  disabled,
}: Props) {
  const set = (patch: Partial<RenderOptions>) => onChange({ ...options, ...patch });

  return (
    <div className="flex flex-col gap-4">

      {/* Smart detect — sets canvas, fps, and duration in one click */}
      <button
        disabled={disabled}
        onClick={onSmartDetect}
        className={clsx(
          'flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs font-semibold transition-colors border',
          disabled
            ? 'opacity-40 cursor-not-allowed border-[#30363d] text-[#484f58]'
            : 'border-brand-500/50 text-brand-400 hover:bg-brand-600 hover:text-white hover:border-brand-600',
        )}
      >
        <Zap size={12} />
        Smart Detect — auto-select canvas, fps &amp; duration
      </button>

      {/* Canvas Size */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-[#8b949e] mb-2">
          <Monitor size={12} />
          Canvas Size
        </label>
        <div className="flex gap-2">
          {RESOLUTION_PRESETS.map(p => (
            <button
              key={p.id}
              disabled={disabled}
              onClick={() => set({ width: p.width, height: p.height })}
              className={clsx(
                'flex-1 flex flex-col items-center py-1.5 rounded text-xs font-medium transition-colors',
                options.width === p.width && options.height === p.height
                  ? 'bg-brand-600 text-white'
                  : 'bg-[#21262d] text-[#8b949e] hover:text-white hover:bg-[#30363d]',
                disabled && 'opacity-40 cursor-not-allowed',
              )}
            >
              <span>{p.label}</span>
              <span className="opacity-60" style={{ fontSize: 10 }}>{p.ratio}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-[#8b949e] mb-2">
          <Clock size={12} />
          Duration
        </label>

        <div className="flex gap-1.5 overflow-x-auto">
          <button
            disabled={disabled}
            onClick={() => onAutoModeChange(!autoMode)}
            className={clsx(
              'flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors shrink-0',
              autoMode
                ? 'bg-brand-600 text-white'
                : 'bg-[#21262d] text-[#8b949e] hover:text-white hover:bg-[#30363d]',
              disabled && 'opacity-40 cursor-not-allowed',
            )}
          >
            <Wand2 size={11} />
            Auto
          </button>

          {MANUAL_DURATION_PRESETS.map(d => (
            <button
              key={d}
              disabled={disabled}
              onClick={() => { onAutoModeChange(false); set({ duration: d }); }}
              className={clsx(
                'px-2.5 py-1.5 rounded text-xs font-medium transition-colors shrink-0',
                !autoMode && options.duration === d
                  ? 'bg-brand-600 text-white'
                  : 'bg-[#21262d] text-[#8b949e] hover:text-white hover:bg-[#30363d]',
                disabled && 'opacity-40 cursor-not-allowed',
              )}
            >
              {d}s
            </button>
          ))}
        </div>

        {autoMode && (
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {detectedDuration !== null ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                <span className="text-green-400 font-medium">Detected: {detectedDuration}s</span>
                <span className="text-[#484f58]">from longest animation</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#484f58] inline-block animate-pulse" />
                <span className="text-[#8b949e]">Detecting animations…</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* FPS */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-[#8b949e] mb-2">
          <Gauge size={12} />
          Frame Rate
        </label>
        <div className="flex gap-2">
          {FPS_PRESETS.map(f => (
            <button
              key={f}
              disabled={disabled}
              onClick={() => set({ fps: f })}
              className={clsx(
                'flex-1 py-1.5 rounded text-sm font-medium transition-colors',
                options.fps === f
                  ? 'bg-brand-600 text-white'
                  : 'bg-[#21262d] text-[#8b949e] hover:text-white hover:bg-[#30363d]',
                disabled && 'opacity-40 cursor-not-allowed',
              )}
            >
              {f}fps
            </button>
          ))}
        </div>
      </div>

      {/* Watermark */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-medium text-[#8b949e]">
          <Droplets size={12} />
          Watermark
        </label>
        <button
          disabled={disabled}
          onClick={() => set({ watermark: !options.watermark })}
          className={clsx(
            'relative w-9 h-5 rounded-full transition-colors',
            options.watermark ? 'bg-brand-600' : 'bg-[#30363d]',
            disabled && 'opacity-40 cursor-not-allowed',
          )}
          role="switch"
          aria-checked={options.watermark}
        >
          <span
            className={clsx(
              'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow',
              options.watermark ? 'translate-x-4' : 'translate-x-0.5',
            )}
          />
        </button>
      </div>

      {/* Summary */}
      <div className="text-xs text-[#484f58] border-t border-[#30363d] pt-3 flex flex-col gap-1">
        <div className="flex justify-between">
          <span>Total frames</span>
          <span className="text-[#8b949e]">
            {autoMode ? detectedDuration ?? '?' : options.duration} × {options.fps} ={' '}
            {autoMode
              ? detectedDuration !== null ? detectedDuration * options.fps : '?'
              : options.duration * options.fps}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Format</span>
          <span className="text-[#8b949e]">{options.width}×{options.height} MP4 (libx264)</span>
        </div>
      </div>
    </div>
  );
}
