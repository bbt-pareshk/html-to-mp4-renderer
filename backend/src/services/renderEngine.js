import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { encodeVideo } from './videoEncoder.js';

/**
 * Injected into the page to intercept rAF and mock timing APIs.
 * Safe to call multiple times — guards with a flag so it only installs once.
 */
const RAF_INTERCEPTOR = `
(function () {
  if (window.__renderEngineInstalled) return;
  window.__renderEngineInstalled = true;

  const _callbacks = new Map();
  let _id = 0;

  window.__rafCallbacks = _callbacks;

  window.requestAnimationFrame = (cb) => {
    const id = ++_id;
    _callbacks.set(id, cb);
    return id;
  };
  window.cancelAnimationFrame = (id) => _callbacks.delete(id);

  window.__tickRAF = (timestamp) => {
    const cbs = [..._callbacks.values()];
    _callbacks.clear();
    cbs.forEach(cb => { try { cb(timestamp); } catch (_) {} });
  };

  window.__renderTime = 0;
  window.__setRenderTime = (ms) => { window.__renderTime = ms; };

  const _startReal = Date.now();
  Date.now = () => _startReal + window.__renderTime;
  performance.now = () => window.__renderTime;
})();
`;

/**
 * Renders HTML to a sequence of PNG frames, then encodes to MP4.
 *
 * @param {import('./jobQueue.js').RenderConfig} renderConfig
 * @param {(progress: number) => void} onProgress  0–100
 * @returns {Promise<string>} relative URL path to the output video
 */
export async function renderHTML(renderConfig, onProgress, signal = null) {
  const {
    html,
    duration = config.render.defaultDuration,
    fps = config.render.defaultFps,
    width = config.render.defaultWidth,
    height = config.render.defaultHeight,
    watermark = false,
  } = renderConfig;

  const clampedDuration = Math.min(duration, config.maxDurationSeconds);
  const jobId = uuidv4();
  const framesDir = path.join(config.tempDir, `frames_${jobId}`);
  const outputFile = path.join(config.outputDir, `${jobId}.mp4`);

  await fs.mkdir(framesDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--disable-accelerated-2d-canvas',
      '--disable-background-networking',
      '--font-render-hinting=none',
    ],
  });

  try {
    const page = await browser.newPage();

    await page.setViewport({ width, height, deviceScaleFactor: 1 });

    // Best-effort pre-load injection (fires on navigation in some Puppeteer builds)
    await page.evaluateOnNewDocument(RAF_INTERCEPTOR);

    // Enable CDP Animation domain before content loads so we can collect IDs
    const cdp = await page.createCDPSession();
    await cdp.send('Animation.enable');

    // Collect every animation ID the browser creates during page load
    const animationIds = [];
    cdp.on('Animation.animationCreated', ({ animation }) => {
      if (animation?.id) animationIds.push(animation.id);
    });

    // Load HTML — no sanitization, full fidelity
    await page.setContent(html, {
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: config.render.networkIdleTimeout,
    });

    // Allow fonts/images/lazy scripts to settle
    await new Promise(r => setTimeout(r, config.render.initialDelayMs));

    // Inject interceptor NOW (post-load) — this is the reliable path for setContent()
    await page.evaluate(RAF_INTERCEPTOR);

    // Freeze CSS animations at t=0 via CDP
    await cdp.send('Animation.setPlaybackRate', { playbackRate: 0 });

    // Belt-and-suspenders: also freeze via Web Animations API
    await page.evaluate(() => {
      document.getAnimations().forEach(a => {
        try { a.pause(); a.currentTime = 0; } catch (_) {}
      });
    });

    const totalFrames = Math.floor(fps * clampedDuration);
    const msPerFrame = 1000 / fps;

    console.log(`[Render ${jobId}] ${totalFrames} frames @ ${fps}fps, ${clampedDuration}s, ${animationIds.length} CDP animations tracked`);

    for (let i = 0; i < totalFrames; i++) {
      if (signal?.aborted) throw new Error('Render cancelled');
      const currentMs = i * msPerFrame;

      // 1. Seek all CDP-tracked animations (most reliable for @keyframes)
      if (animationIds.length > 0) {
        await cdp.send('Animation.seekAnimations', {
          animations: animationIds,
          currentTime: currentMs,
        }).catch(() => {});
      }

      // 2. Seek via Web Animations API (catches dynamically created animations)
      await page.evaluate((t) => {
        document.getAnimations().forEach(a => {
          try { a.currentTime = t; } catch (_) {}
        });
      }, currentMs);

      // 3. Advance JS time + tick pending rAF callbacks (defensive: may not be installed)
      await page.evaluate((t) => {
        if (typeof window.__setRenderTime === 'function') window.__setRenderTime(t);
        if (typeof window.__tickRAF === 'function') window.__tickRAF(t);
      }, currentMs);

      const framePath = path.join(framesDir, `frame_${String(i).padStart(5, '0')}.png`);
      await page.screenshot({ path: framePath, type: 'png', clip: { x: 0, y: 0, width, height } });

      // Progress: frames = 0–80%
      onProgress(Math.round(((i + 1) / totalFrames) * 80));
    }

    await browser.close();

    onProgress(82);
    console.log(`[Render ${jobId}] Encoding ${totalFrames} frames to MP4…`);

    await encodeVideo({ framesDir, outputFile, fps, width, height, watermark });

    onProgress(97);

    // Clean up temp frames
    await fs.rm(framesDir, { recursive: true, force: true });

    const videoUrl = `/output/${jobId}.mp4`;
    console.log(`[Render ${jobId}] Done → ${videoUrl}`);
    return videoUrl;
  } catch (err) {
    await browser.close().catch(() => {});
    await fs.rm(framesDir, { recursive: true, force: true }).catch(() => {});
    throw err;
  }
}
