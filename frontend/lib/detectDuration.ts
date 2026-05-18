/**
 * Two strategies for detecting animation duration:
 *
 * 1. detectDurationFromDoc  — reads live computed styles + Web Animations API
 *    from the preview iframe's Document. Most accurate; catches Tailwind CDN,
 *    external fonts, JS-driven animations, everything the browser resolved.
 *
 * 2. detectDurationFromHTML — regex fallback over the raw HTML string.
 *    Used when the iframe document is not yet accessible.
 */

const MAX_CAP_S = 60;
const DEFAULT_S = 5;
const MIN_S     = 3; // never return less than 3s for a detected animation

function addBuffer(secs: number): number {
  // 25% of detected duration, minimum 1s — gives more room for longer animations
  const buf = Math.max(1, Math.round(secs * 0.25));
  return Math.min(Math.max(Math.ceil(secs) + buf, MIN_S), MAX_CAP_S);
}

function parseDurationStr(value: string): number {
  if (!value || value === 'none' || value === '0s') return 0;
  return value.split(',').reduce((max, part) => {
    const t = part.trim();
    const v = parseFloat(t);
    if (isNaN(v)) return max;
    return Math.max(max, t.endsWith('ms') ? v : v * 1000);
  }, 0);
}

/** Strategy 1: accurate, needs a loaded iframe Document */
export function detectDurationFromDoc(doc: Document): number {
  const win = doc.defaultView;
  if (!win) return DEFAULT_S;

  let maxMs = 0;

  // Web Animations API — covers both CSS @keyframes and JS animations
  doc.getAnimations().forEach(anim => {
    try {
      const timing = anim.effect?.getTiming?.();
      if (!timing) return;
      const dur  = typeof timing.duration  === 'number' ? timing.duration : 0;
      const del  = typeof timing.delay     === 'number' ? Math.max(0, timing.delay) : 0;
      const iter = timing.iterations === Infinity         ? 1
                 : typeof timing.iterations === 'number'  ? timing.iterations
                 : 1;
      maxMs = Math.max(maxMs, del + dur * iter);
    } catch (_) {}
  });

  // Computed styles — catches animations not yet running (paused, delayed, display:none)
  doc.querySelectorAll('*').forEach(el => {
    try {
      const s = win.getComputedStyle(el as Element);

      const animDur  = parseDurationStr(s.animationDuration);
      const animDel  = Math.max(0, parseDurationStr(s.animationDelay));
      const iterStr  = s.animationIterationCount;
      const iter     = iterStr === 'infinite' ? 1 : (parseFloat(iterStr) || 1);
      maxMs = Math.max(maxMs, animDel + animDur * iter);

      const transDur = parseDurationStr(s.transitionDuration);
      const transDel = parseDurationStr(s.transitionDelay);
      maxMs = Math.max(maxMs, transDel + transDur);
    } catch (_) {}
  });

  const secs = maxMs / 1000;
  return secs > 0.3 ? addBuffer(secs) : DEFAULT_S;
}

/** Strategy 2: regex fallback over raw HTML string */
export function detectDurationFromHTML(html: string): number {
  let maxMs = 0;

  const scanTokens = (value: string) => {
    value.split(',').forEach(part =>
      part.trim().split(/\s+/).forEach(tok => {
        const v = parseFloat(tok);
        if (isNaN(v)) return;
        if (tok.endsWith('ms')) maxMs = Math.max(maxMs, v);
        else if (/^\d/.test(tok) && tok.endsWith('s')) maxMs = Math.max(maxMs, v * 1000);
      })
    );
  };

  // Extract <style> block content
  for (const [, css] of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    for (const [, v] of css.matchAll(/animation-duration\s*:\s*([^;}\n]+)/gi)) scanTokens(v);
    for (const [, v] of css.matchAll(/transition-duration\s*:\s*([^;}\n]+)/gi)) scanTokens(v);
    // animation shorthand: name | duration | timing | delay | iteration-count ...
    for (const [, v] of css.matchAll(/(?<![a-z-])animation\s*:\s*([^;}\n]+)/gi)) scanTokens(v);
    for (const [, v] of css.matchAll(/(?<![a-z-])transition\s*:\s*([^;}\n]+)/gi)) scanTokens(v);
  }

  // Inline style attributes
  for (const [, style] of html.matchAll(/style\s*=\s*["']([^"']*)["']/gi)) scanTokens(style);

  const secs = maxMs / 1000;
  return secs > 0.3 ? addBuffer(secs) : DEFAULT_S;
}
