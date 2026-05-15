'use client';

import { useRef, useState } from 'react';
import { Download, Play, Pause, RotateCcw } from 'lucide-react';

interface Props {
  videoUrl: string;      // Full URL including backend origin
  filename?: string;
}

export default function VideoPlayer({ videoUrl, filename = 'render.mp4' }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

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
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          className="block"
          style={{ width: 225, height: 400 }}   // 0.5× of 450×800
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
      <a
        href={videoUrl}
        download={filename}
        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors w-full justify-center"
      >
        <Download size={16} />
        Download MP4
      </a>

      <p className="text-xs text-[#484f58] text-center">
        450 × 800px · libx264 · yuv420p
      </p>
    </div>
  );
}
