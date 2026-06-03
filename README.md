# HTML → MP4 Renderer

Render any HTML/CSS/animation to a downloadable MP4 video — exactly as a browser would display it.

## Architecture

```
frontend/   Next.js 14 + Monaco Editor + Tailwind CSS  (port 3000)
backend/    Express + Puppeteer + FFmpeg                (port 3001)

Render pipeline:
  POST /api/render  →  Job queued
  Puppeteer loads HTML  →  frame-by-frame screenshot (30fps)
  FFmpeg encodes frames  →  libx264 MP4
  GET /api/status/:id  →  progress polling
  GET /output/:id.mp4  →  download
```

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18 + | |
| FFmpeg | any recent | Must be on PATH — see below |
| npm | 9 + | |

### Install FFmpeg

**Windows (winget):**
```
winget install Gyan.FFmpeg
```
Then restart your terminal so `ffmpeg` is on PATH.

**macOS:**
```
brew install ffmpeg
```

**Ubuntu/Debian:**
```
sudo apt install ffmpeg
```

Verify: `ffmpeg -version`

## Quick Start

### 1 — Backend

```bash
cd backend
npm install
cp .env.example .env      # edit if needed
npm run dev
```

Backend starts at **http://localhost:3001**

### 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend starts at **http://localhost:3000**

Open http://localhost:3000 in your browser.

## Usage

1. **Paste or type** HTML in the Monaco editor (left panel)
2. **Live preview** updates automatically (right panel, iframe)
3. **Pick a template** from the template strip for quick starts
4. **Set duration / FPS** in the bottom controls (5–30s, 15/24/30/60fps)
5. Click **Generate MP4** — progress bar shows frame capture → encode
6. **Download** the MP4 from the video player sidebar

## API

### `POST /api/render`

```json
{
  "html": "<html>...</html>",
  "duration": 5,
  "fps": 30,
  "watermark": false
}
```

Response:
```json
{ "success": true, "jobId": "uuid" }
```

### `GET /api/status/:jobId`

```json
{
  "jobId": "uuid",
  "status": "queued | processing | completed | failed",
  "progress": 75,
  "videoUrl": "/output/uuid.mp4",
  "error": null
}
```

### `GET /output/:jobId.mp4`

Direct download of the rendered video (served as static file).

## Configuration

Copy `backend/.env.example` to `backend/.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Backend port |
| `FRONTEND_URL` | http://localhost:3000 | CORS allow-list |
| `OUTPUT_DIR` | ../output | Where MP4s are stored |
| `TEMP_DIR` | ../temp | Temp frames directory |
| `MAX_CONCURRENT_JOBS` | 2 | Parallel render limit |
| `MAX_DURATION_SECONDS` | 60 | Cap per job |
| `FFMPEG_PATH` | _(system)_ | Absolute path if not on PATH |

## How Animations Work

The render engine uses three layers of animation control so CSS and JS animations are captured faithfully:

1. **Chrome DevTools Protocol** — `Animation.setPlaybackRate(0)` freezes all CSS animations; each frame seeks to `currentTime = i/fps * 1000` ms.
2. **Web Animations API** — `document.getAnimations()` paused and seeked per frame (belt-and-suspenders alongside CDP).
3. **requestAnimationFrame interception** — injected before page load, replaces native rAF. `window.__tickRAF(timestamp)` is called per frame so JS-driven animations (GSAP etc.) also advance correctly.
4. **`Date.now()` / `performance.now()` mocking** — overridden to return the current render timestamp so time-based JS animations are deterministic.

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── index.js              Express entry + static output serving
│   │   ├── config.js             All configuration in one place
│   │   ├── routes/
│   │   │   ├── render.js         POST /api/render
│   │   │   └── status.js         GET  /api/status/:id
│   │   └── services/
│   │       ├── jobQueue.js       In-memory job queue (EventEmitter)
│   │       ├── renderEngine.js   Puppeteer frame capture
│   │       └── videoEncoder.js   FFmpeg MP4 encode
│   └── package.json
│
└── frontend/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx              Main page (editor + preview + output)
    │   └── globals.css
    ├── components/
    │   ├── HtmlEditor.tsx        Monaco editor (dynamic, SSR-off)
    │   ├── PreviewPanel.tsx      iframe live preview with auto-scale
    │   ├── RenderControls.tsx    Duration / FPS / watermark controls
    │   ├── VideoPlayer.tsx       Inline player + download button
    │   └── ProgressBar.tsx       Job progress indicator
    └── lib/
        ├── api.ts                Backend client + polling helper
        └── templates.ts          5 built-in template presets
```

## Troubleshooting

**`ffmpeg: command not found`**
Install FFmpeg and ensure it's on PATH, or set `FFMPEG_PATH=/absolute/path/to/ffmpeg` in `.env`.

**Puppeteer fails to launch on Linux**
Add `--no-sandbox` (already included) and install Chromium deps:
```bash
npx puppeteer browsers install chrome
```

**CORS error in browser**
Ensure `FRONTEND_URL` in `backend/.env` matches the exact origin the frontend is served from.

**Tailwind CDN HTML not rendering styles in preview**
The preview iframe uses `sandbox="allow-scripts allow-same-origin"` which permits CDN fetch. If you see unstyled content, check your network/CSP settings.

**Output video is choppy**
Lower `MAX_CONCURRENT_JOBS` to 1 so the machine isn't splitting resources between renders.
