export interface SmartSettings {
  width: number;
  height: number;
  fps: number;
}

const PRESETS = [
  { width: 450, height: 800 },  // 9:16 Reels
  { width: 500, height: 500 },  // 1:1 Square
  { width: 800, height: 450 },  // 16:9 Wide
  { width: 480, height: 600 },  // 4:5 Portrait
] as const;

function snapToPreset(w: number, h: number) {
  const ratio = w / h;
  return PRESETS.reduce((best, p) =>
    Math.abs(p.width / p.height - ratio) < Math.abs(best.width / best.height - ratio) ? p : best
  );
}

function fpsFromMinMs(minMs: number): number {
  if (minMs < 400)  return 60; // fast transitions need more frames
  if (minMs < 1000) return 30; // standard
  return 24;                   // slow/cinematic animations
}

export function detectSmartSettingsFromDoc(doc: Document): SmartSettings {
  const win = doc.defaultView;

  // Resolution — read body computed dimensions and snap to nearest preset
  let width = 450, height = 800;
  if (win && doc.body) {
    const s = win.getComputedStyle(doc.body);
    const bw = parseFloat(s.width);
    const bh = parseFloat(s.height);
    if (bw > 0 && bh > 0) {
      const p = snapToPreset(bw, bh);
      width  = p.width;
      height = p.height;
    }
  }

  // FPS — use the fastest animation/transition duration as the signal
  let minMs = Infinity;
  if (win) {
    doc.querySelectorAll('*').forEach(el => {
      try {
        const s = win.getComputedStyle(el as Element);
        for (const prop of [s.animationDuration, s.transitionDuration]) {
          if (!prop || prop === 'none') continue;
          prop.split(',').forEach(part => {
            const v = parseFloat(part.trim());
            if (isNaN(v) || v <= 0) return;
            const ms = part.trim().endsWith('ms') ? v : v * 1000;
            if (ms < minMs) minMs = ms;
          });
        }
      } catch (_) {}
    });
  }

  return { width, height, fps: fpsFromMinMs(minMs) };
}

export function detectSmartSettingsFromHTML(html: string): SmartSettings {
  // Resolution from body { width / height } in <style>
  let width = 450, height = 800;
  const wMatch = html.match(/body[^{]*\{[^}]*width\s*:\s*(\d+)px/i);
  const hMatch = html.match(/body[^{]*\{[^}]*height\s*:\s*(\d+)px/i);
  if (wMatch && hMatch) {
    const p = snapToPreset(parseInt(wMatch[1]), parseInt(hMatch[1]));
    width  = p.width;
    height = p.height;
  }

  // FPS from smallest time value found in <style> blocks
  let minMs = Infinity;
  for (const [, css] of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    for (const m of css.matchAll(/(\d+(?:\.\d+)?)(ms|s)\b/g)) {
      const v = parseFloat(m[1]);
      const ms = m[2] === 'ms' ? v : v * 1000;
      if (ms > 0 && ms < minMs) minMs = ms;
    }
  }

  return { width, height, fps: fpsFromMinMs(minMs) };
}
