'use client';

import { useRef, useState } from 'react';
import { Download, Play, Pause, RotateCcw } from 'lucide-react';

interface Props {
  videoUrl: string;
  filename?: string;
  width?: number;
  height?: number;
}

export default function VideoPlayer({ videoUrl, filename = 'render.mp4', width = 450, height = 800 }: Props) {
  const MAX_W = 240;
  const scale = Math.min(MAX_W / width, 380 / height);
  const displayWidth  = Math.round(width  * scale);
  const displayHeight = Math.round(height * scale);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    try {
      // Fetch with explicit response validation so a truncated download throws
      // rather than silently saving a partial file.
      const res = await fetch(videoUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      if (blob.size === 0) throw new Error('Empty response from server');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab so the browser can download natively
      window.open(videoUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  }

  function restart() {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play();
    setPlaying(true);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Video */}
      <div className="relative rounded-xl overflow-hidden border border-[#30363d] shadow-2xl">
        <video
          ref={videoRef}
          src={videoUrl}
          loop
          playsInline
          crossOrigin="anonymous"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          className="block"
          style={{ width: displayWidth, height: displayHeight }}
        />

        {/* Overlay controls */}
        <div
          className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 hover:opacity-100 transition-opacity bg-black/30 cursor-pointer"
          onClick={togglePlay}
        >
          <button
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          >
            {playing
              ? <Pause size={18} className="text-white" />
              : <Play size={18} className="text-white ml-0.5" />}
          </button>
          <button
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
            onClick={(e) => { e.stopPropagation(); restart(); }}
          >
            <RotateCcw size={16} className="text-white" />
          </button>
        </div>
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors w-full justify-center"
      >
        {downloading ? (
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <Download size={16} />
        )}
        {downloading ? 'Downloading…' : 'Download MP4'}
      </button>

      <p className="text-xs text-[#484f58] text-center">
        {width} × {height}px · libx264 · yuv420p
      </p>
    </div>
  );
}
