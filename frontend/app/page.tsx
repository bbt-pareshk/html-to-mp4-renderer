'use client';

import { useCallback, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import clsx from 'clsx';
import { Film, Code2, Eye, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

import PreviewPanel from '@/components/PreviewPanel';
import RenderControls, { type RenderOptions } from '@/components/RenderControls';
import ProgressBar from '@/components/ProgressBar';
import VideoPlayer from '@/components/VideoPlayer';
import { templates } from '@/lib/templates';
import { submitRender, waitForJob, videoDownloadUrl, type RenderJob } from '@/lib/api';
import { detectDurationFromDoc, detectDurationFromHTML } from '@/lib/detectDuration';

const HtmlEditor = dynamic(() => import('@/components/HtmlEditor'), { ssr: false });

type AppState = 'idle' | 'rendering' | 'done' | 'error';

const DEFAULT_HTML = templates[0].html;
const DEBOUNCE_MS  = 600;

export default function Home() {
  const [html, setHtml]             = useState(DEFAULT_HTML);
  const [previewHtml, setPreviewHtml] = useState(DEFAULT_HTML);
  const [renderOptions, setRenderOptions] = useState<RenderOptions>({
    duration: 5,
    fps: 30,
    watermark: false,
  });

  // Auto-duration state
  const [autoMode, setAutoMode]               = useState(false);
  const [detectedDuration, setDetectedDuration] = useState<number | null>(null);

  const [appState, setAppState] = useState<AppState>('idle');
  const [job, setJob]           = useState<RenderJob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showTemplates, setShowTemplates] = useState(false);
  const [activeTab, setActiveTab]         = useState<'editor' | 'preview'>('editor');

  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref forwarded into the right-panel PreviewPanel so we can read its iframe document
  const mainIframeRef = useRef<HTMLIFrameElement>(null);

  // Run detection — tries live iframe first, falls back to HTML string parsing
  const runDetection = useCallback((currentHtml: string) => {
    const doc = mainIframeRef.current?.contentDocument;
    const duration = doc
      ? detectDurationFromDoc(doc)
      : detectDurationFromHTML(currentHtml);
    setDetectedDuration(duration);
  }, []);

  // Called when the main preview iframe finishes loading its content
  const handlePreviewLoad = useCallback(() => {
    if (autoMode) runDetection(previewHtml);
  }, [autoMode, previewHtml, runDetection]);

  const handleHtmlChange = useCallback((value: string) => {
    setHtml(value);
    setDetectedDuration(null); // stale until next load
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setPreviewHtml(value), DEBOUNCE_MS);
  }, []);

  function handleAutoModeChange(enabled: boolean) {
    setAutoMode(enabled);
    if (enabled) {
      setDetectedDuration(null);
      // If the iframe is already loaded, detect immediately
      const doc = mainIframeRef.current?.contentDocument;
      if (doc?.body) {
        const duration = detectDurationFromDoc(doc);
        setDetectedDuration(duration);
      } else {
        // Fallback: parse from the HTML string right away
        setDetectedDuration(detectDurationFromHTML(previewHtml));
      }
    }
  }

  function applyTemplate(templateHtml: string) {
    setHtml(templateHtml);
    setPreviewHtml(templateHtml);
    setDetectedDuration(null);
    setShowTemplates(false);
    setActiveTab('editor');
  }

  async function handleGenerate() {
    if (!html.trim()) return;

    // Resolve effective duration: auto uses detected value (fallback 5s)
    const effectiveDuration = autoMode
      ? (detectedDuration ?? detectDurationFromHTML(html))
      : renderOptions.duration;

    setAppState('rendering');
    setVideoUrl(null);
    setErrorMsg(null);
    setJob(null);

    try {
      const { jobId } = await submitRender({
        html,
        duration: effectiveDuration,
        fps: renderOptions.fps,
        watermark: renderOptions.watermark,
      });
      const result = await waitForJob(jobId, setJob);
      setVideoUrl(videoDownloadUrl(result.videoUrl!));
      setAppState('done');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      setAppState('error');
    }
  }

  const isRendering = appState === 'rendering';

  return (
    <div className="flex h-screen overflow-hidden bg-[#0d1117] text-[#e6edf3]">

      {/* ── Left panel ── */}
      <div className="flex flex-col w-[520px] shrink-0 border-r border-[#30363d]">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#30363d] shrink-0">
          <div className="flex items-center gap-2">
            <Film size={18} className="text-brand-500" />
            <span className="font-semibold text-sm tracking-tight">HTML → MP4</span>
          </div>
          <span className="text-xs text-[#484f58] ml-auto">450 × 800 · Reels format</span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#30363d] shrink-0">
          {(['editor', 'preview'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors',
                activeTab === tab
                  ? 'border-brand-500 text-white'
                  : 'border-transparent text-[#8b949e] hover:text-white',
              )}
            >
              {tab === 'editor' ? <Code2 size={13} /> : <Eye size={13} />}
              {tab === 'editor' ? 'HTML Editor' : 'Live Preview'}
            </button>
          ))}
        </div>

        {/* Templates */}
        <div className="shrink-0 border-b border-[#30363d]">
          <button
            onClick={() => setShowTemplates(v => !v)}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-[#8b949e] hover:text-white transition-colors"
          >
            <Sparkles size={12} className="text-brand-500" />
            <span className="font-medium">Templates</span>
            {showTemplates
              ? <ChevronUp size={12} className="ml-auto" />
              : <ChevronDown size={12} className="ml-auto" />}
          </button>

          {showTemplates && (
            <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => applyTemplate(t.html)}
                  className="shrink-0 flex flex-col items-center gap-1 p-2.5 rounded-lg border border-[#30363d] hover:border-brand-500 hover:bg-[#161b22] transition-colors"
                >
                  <span className="text-2xl">{t.emoji}</span>
                  <span className="text-[10px] text-[#8b949e] whitespace-nowrap">{t.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Editor / mini preview */}
        <div className="flex-1 min-h-0 relative">
          <div className={clsx('absolute inset-0', activeTab !== 'editor' && 'hidden')}>
            <HtmlEditor value={html} onChange={handleHtmlChange} />
          </div>
          <div className={clsx('absolute inset-0', activeTab !== 'preview' && 'hidden')}>
            {/* Left-panel mini preview — no ref needed here */}
            <PreviewPanel html={previewHtml} />
          </div>
        </div>

        {/* Controls */}
        <div className="shrink-0 border-t border-[#30363d] p-5 flex flex-col gap-5 bg-[#0d1117]">
          <RenderControls
            options={renderOptions}
            onChange={setRenderOptions}
            autoMode={autoMode}
            detectedDuration={detectedDuration}
            onAutoModeChange={handleAutoModeChange}
            disabled={isRendering}
          />

          {(isRendering || appState === 'done' || appState === 'error') && job && (
            <ProgressBar
              progress={job.progress}
              status={job.status}
              label={
                appState === 'error'
                  ? errorMsg ?? 'Render failed'
                  : job.status === 'queued'
                  ? 'Queued — waiting for render slot…'
                  : job.status === 'processing'
                  ? job.progress < 82
                    ? `Capturing frames… ${job.progress}%`
                    : 'Encoding MP4…'
                  : undefined
              }
            />
          )}

          <button
            onClick={handleGenerate}
            disabled={isRendering || !html.trim()}
            className={clsx(
              'flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-sm transition-all',
              isRendering
                ? 'bg-[#21262d] text-[#484f58] cursor-not-allowed'
                : 'bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-900/40',
              !html.trim() && 'opacity-40 cursor-not-allowed',
            )}
          >
            {isRendering ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Rendering…
              </>
            ) : (
              <>
                <Film size={16} />
                Generate MP4
                {autoMode && detectedDuration !== null && (
                  <span className="ml-1 text-xs opacity-70">({detectedDuration}s)</span>
                )}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Right panel: large preview + video output ── */}
      <div className="flex-1 min-w-0 flex">
        <div className="flex-1 min-w-0">
          {/* Main preview — ref forwarded so we can read its iframe document for detection */}
          <PreviewPanel
            ref={mainIframeRef}
            html={previewHtml}
            onLoad={handlePreviewLoad}
          />
        </div>

        {(appState === 'done' || appState === 'error') && (
          <div className="w-72 shrink-0 border-l border-[#30363d] flex flex-col bg-[#161b22]">
            <div className="px-5 py-4 border-b border-[#30363d]">
              <h2 className="text-sm font-semibold">
                {appState === 'done' ? '✓ Render Complete' : '✗ Render Failed'}
              </h2>
            </div>

            <div className="flex-1 flex items-center justify-center p-5">
              {appState === 'done' && videoUrl ? (
                <VideoPlayer videoUrl={videoUrl} filename="render.mp4" />
              ) : (
                <div className="text-center">
                  <p className="text-red-400 text-sm font-medium mb-2">Render failed</p>
                  <p className="text-[#8b949e] text-xs">{errorMsg}</p>
                  <button
                    onClick={() => setAppState('idle')}
                    className="mt-4 text-xs text-brand-500 hover:underline"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
