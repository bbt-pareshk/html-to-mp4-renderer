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

const MAX_CAP_S     = 60;
const DEFAULT_S     = 5;
const MIN_S         = 5;  // raised from 3 — minimum for any detected animation
const INFINITE_LOOPS = 3; // treat infinite as N visible loops

function addBuffer(secs: number): number {
  // 25% headroom so the last frame of an animation isn't cut off
  const buf = Math.max(1, Math.round(secs * 0.25));
  return Math.min(Math.max(Math.ceil(secs) + buf, MIN_S), MAX_CAP_S);
}

/** Parse a single CSS <time> token ("2s", "300ms") → milliseconds, or 0. */
function parseTimeToken(tok: string): number {
  const v = parseFloat(tok);
  if (isNaN(v) || v < 0) return 0;
  if (tok.endsWith('ms')) return v;
  if (/^\d/.test(tok) && tok.endsWith('s')) return v * 1000;
  return 0;
}

/** Parse a comma-separated CSS time list ("0.5s, 1s") → milliseconds (max). */
function parseDurationStr(value: string): number {
  if (!value || value === 'none' || value === '0s') return 0;
  return value.split(',').reduce((max, part) => {
    return Math.max(max, parseTimeToken(part.trim()));
  }, 0);
}

/** Strategy 1: accurate, needs a loaded iframe Document */
export function detectDurationFromDoc(doc: Document): number {
  const win = doc.defaultView;
  if (!win) return DEFAULT_S;

  let maxMs = 0;

  // Web Animations API — each animation object carries its own timing,
  // so infinite vs finite is handled correctly per-animation.
  doc.getAnimations().forEach(anim => {
    try {
      const timing = anim.effect?.getTiming?.();
      if (!timing) return;
      const dur  = typeof timing.duration  === 'number' ? timing.duration : 0;
      const del  = typeof timing.delay     === 'number' ? Math.max(0, timing.delay) : 0;
      const iter = timing.iterations === Infinity
                 ? INFINITE_LOOPS
                 : typeof timing.iterations === 'number' ? timing.iterations
                 : 1;
      maxMs = Math.max(maxMs, del + dur * iter);
    } catch (_) {}
  });

  // Computed styles — process each animation on the element individually.
  // CSS lets you stack multiple animations with comma-separated values;
  // the old code took max(duration) + max(delay) which is wrong for mixed
  // finite/infinite sets. We zip the lists instead.
  doc.querySelectorAll('*').forEach(el => {
    try {
      const s = win.getComputedStyle(el as Element);

      const animDurs  = (s.animationDuration         || '').split(',');
      const animDels  = (s.animationDelay            || '').split(',');
      const animIters = (s.animationIterationCount   || '').split(',');
      const count = Math.max(animDurs.length, animDels.length, animIters.length);

      for (let i = 0; i < count; i++) {
        const dur     = parseDurationStr((animDurs [i % animDurs.length]  || '').trim());
        const del     = Math.max(0, parseDurationStr((animDels [i % animDels.length]  || '').trim()));
        const iterStr = (animIters[i % animIters.length] || '1').trim();
        const iter    = iterStr === 'infinite' ? INFINITE_LOOPS : (parseFloat(iterStr) || 1);
        maxMs = Math.max(maxMs, del + dur * iter);
      }

      // Transitions don't repeat — just delay + duration
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

  /**
   * Parse one comma-separated animation shorthand entry and return its
   * total duration (delay + animDuration × iterations) in milliseconds.
   *
   * CSS animation shorthand order (per spec):
   *   name | duration | timing-fn | delay | iteration-count | direction | fill-mode | play-state
   * The first <time> value is duration; the second is delay.
   * Iteration-count is a unitless integer or the keyword "infinite".
   */
  const parseAnimEntry = (entry: string): number => {
    // Strip CSS function calls (cubic-bezier, steps, etc.) to avoid misreading
    // their numeric arguments as durations or iteration counts.
    const clean = entry.trim().replace(/\([^)]*\)/g, '');
    const tokens = clean.split(/\s+/).filter(Boolean);

    const times: number[] = [];
    let iterCount = 1;

    for (const tok of tokens) {
      if (tok === 'infinite') { iterCount = INFINITE_LOOPS; continue; }
      const ms = parseTimeToken(tok);
      if (ms > 0) { times.push(ms); continue; }
      // Unitless positive integer that isn't a decimal → likely iteration-count.
      // (Direction/fill-mode/play-state keywords produce NaN.)
      const v = parseFloat(tok);
      if (!isNaN(v) && v > 0 && Number.isInteger(v)) iterCount = v;
    }

    const dur = times[0] ?? 0; // first <time> = animation-duration
    const del = times[1] ?? 0; // second <time> = animation-delay
    return del + dur * iterCount;
  };

  /** Parse one comma-separated transition shorthand entry → delay + duration (ms). */
  const parseTransitionEntry = (entry: string): number => {
    const clean = entry.trim().replace(/\([^)]*\)/g, '');
    const times = clean.split(/\s+/).filter(Boolean)
      .map(t => parseTimeToken(t))
      .filter(t => t > 0);
    const dur = times[0] ?? 0;
    const del = times[1] ?? 0;
    return del + dur;
  };

  // Strip CSS function calls (cubic-bezier, steps, …) from a value BEFORE splitting
  // on commas, so "cubic-bezier(0.25, 0.1, 0.25, 1)" doesn't get fragmented into
  // four fake animation entries at its internal commas.
  const stripFns = (v: string) => v.replace(/\([^)]*\)/g, '');

  for (const [, css] of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    // animation shorthand — parse duration + delay + iteration per comma-entry
    for (const [, v] of css.matchAll(/(?<![a-z-])animation\s*:\s*([^;}\n]+)/gi)) {
      for (const entry of stripFns(v).split(',')) {
        maxMs = Math.max(maxMs, parseAnimEntry(entry));
      }
    }

    // animation-duration alone (no shorthand) — iteration-count unknown,
    // so assume INFINITE_LOOPS as a safe conservative estimate.
    for (const [, v] of css.matchAll(/animation-duration\s*:\s*([^;}\n]+)/gi)) {
      for (const part of v.split(',')) {
        const ms = parseTimeToken(part.trim());
        if (ms > 0) maxMs = Math.max(maxMs, ms * INFINITE_LOOPS);
      }
    }

    // transition shorthand
    for (const [, v] of css.matchAll(/(?<![a-z-])transition\s*:\s*([^;}\n]+)/gi)) {
      for (const entry of stripFns(v).split(',')) {
        maxMs = Math.max(maxMs, parseTransitionEntry(entry));
      }
    }

    // transition-duration alone
    for (const [, v] of css.matchAll(/transition-duration\s*:\s*([^;}\n]+)/gi)) {
      for (const part of v.split(',')) {
        const ms = parseTimeToken(part.trim());
        if (ms > 0) maxMs = Math.max(maxMs, ms);
      }
    }
  }

  // Inline style attributes — handle animation/transition shorthands
  for (const [, style] of html.matchAll(/style\s*=\s*["']([^"']*)["']/gi)) {
    for (const [, v] of style.matchAll(/(?<![a-z-])animation\s*:\s*([^;"']+)/gi)) {
      for (const entry of stripFns(v).split(',')) maxMs = Math.max(maxMs, parseAnimEntry(entry));
    }
    for (const [, v] of style.matchAll(/animation-duration\s*:\s*([^;"']+)/gi)) {
      for (const part of v.split(',')) {
        const ms = parseTimeToken(part.trim());
        if (ms > 0) maxMs = Math.max(maxMs, ms * INFINITE_LOOPS);
      }
    }
  }

  const secs = maxMs / 1000;
  return secs > 0.3 ? addBuffer(secs) : DEFAULT_S;
}
