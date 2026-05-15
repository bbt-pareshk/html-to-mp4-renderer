'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { RefreshCw, Monitor } from 'lucide-react';

interface Props {
  html: string;
  width?: number;
  height?: number;
  onLoad?: () => void;
}

const PreviewPanel = forwardRef<HTMLIFrameElement, Props>(
  ({ html, width = 450, height = 800, onLoad }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [scale, setScale] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);

    // Expose the raw iframe element to the parent via ref
    useImperativeHandle(ref, () => iframeRef.current as HTMLIFrameElement);

    useEffect(() => {
      if (!containerRef.current) return;
      const obs = new ResizeObserver(([entry]) => {
        const { width: cw, height: ch } = entry.contentRect;
        setScale(Math.min((cw - 32) / width, (ch - 32) / height, 1));
      });
      obs.observe(containerRef.current);
      return () => obs.disconnect();
    }, [width, height]);

    return (
      <div className="flex flex-col h-full bg-[#161b22]">
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#30363d] shrink-0">
          <div className="flex items-center gap-2 text-sm text-[#8b949e]">
            <Monitor size={14} />
            <span>Preview</span>
            <span className="text-xs text-[#484f58]">{width} × {height}px</span>
          </div>
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-white transition-colors px-2 py-1 rounded hover:bg-[#21262d]"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>

        <div
          ref={containerRef}
          className="flex-1 flex items-center justify-center overflow-hidden p-4"
        >
          <div
            style={{
              width, height,
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
              flexShrink: 0,
            }}
            className="rounded-lg overflow-hidden shadow-2xl border border-[#30363d]"
          >
            <iframe
              ref={iframeRef}
              key={refreshKey}
              srcDoc={html}
              title="HTML Preview"
              sandbox="allow-scripts allow-same-origin"
              style={{ width, height, border: 'none', display: 'block' }}
              onLoad={() => setTimeout(() => onLoad?.(), 600)}
            />
          </div>
        </div>
      </div>
    );
  }
);

PreviewPanel.displayName = 'PreviewPanel';
export default PreviewPanel;
