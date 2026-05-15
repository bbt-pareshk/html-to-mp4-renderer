'use client';

import { Clock, Gauge, Droplets, Wand2 } from 'lucide-react';
import clsx from 'clsx';

export interface RenderOptions {
  duration: number;
  fps: number;
  watermark: boolean;
}

interface Props {
  options: RenderOptions;
  onChange: (opts: RenderOptions) => void;
  autoMode: boolean;
  detectedDuration: number | null;
  onAutoModeChange: (auto: boolean) => void;
  disabled?: boolean;
}

const MANUAL_DURATION_PRESETS = [5, 10, 15, 20, 30];
const FPS_PRESETS = [15, 24, 30, 60];

export default function RenderControls({
  options,
  onChange,
  autoMode,
  detectedDuration,
  onAutoModeChange,
  disabled,
}: Props) {
  const set = (patch: Partial<RenderOptions>) => onChange({ ...options, ...patch });

  return (
    <div className="flex flex-col gap-4">

      {/* Duration */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-[#8b949e] mb-2">
          <Clock size={12} />
          Duration
        </label>

        <div className="flex gap-2">
          {/* Auto button */}
          <button
            disabled={disabled}
            onClick={() => onAutoModeChange(!autoMode)}
            className={clsx(
              'flex items-center gap-1 px-2.5 py-1.5 rounded text-sm font-medium transition-colors shrink-0',
              autoMode
                ? 'bg-brand-600 text-white'
                : 'bg-[#21262d] text-[#8b949e] hover:text-white hover:bg-[#30363d]',
              disabled && 'opacity-40 cursor-not-allowed',
            )}
          >
            <Wand2 size={11} />
            Auto
          </button>

          {/* Manual presets */}
          {MANUAL_DURATION_PRESETS.map(d => (
            <button
              key={d}
              disabled={disabled}
              onClick={() => { onAutoModeChange(false); set({ duration: d }); }}
              className={clsx(
                'flex-1 py-1.5 rounded text-sm font-medium transition-colors',
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

        {/* Auto detection readout */}
        {autoMode && (
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {detectedDuration !== null ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                <span className="text-green-400 font-medium">
                  Detected: {detectedDuration}s
                </span>
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
            {(autoMode ? detectedDuration ?? '?' : options.duration)} × {options.fps} ={' '}
            {autoMode
              ? detectedDuration !== null ? detectedDuration * options.fps : '?'
              : options.duration * options.fps}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Format</span>
          <span className="text-[#8b949e]">450×800 MP4 (libx264)</span>
        </div>
      </div>
    </div>
  );
}
