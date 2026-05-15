export interface Template {
  id: string;
  name: string;
  category: string;
  emoji: string;
  html: string;
}

export const templates: Template[] = [
  {
    id: 'gradient-pulse',
    name: 'Gradient Pulse',
    category: 'Abstract',
    emoji: '🌈',
    html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 450px; height: 800px; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    background: #0a0a0a;
    font-family: 'Inter', sans-serif;
  }
  .bg {
    position: absolute; inset: 0;
    background: conic-gradient(from 0deg at 50% 50%, #ff006e, #8338ec, #3a86ff, #06d6a0, #ff006e);
    animation: spin 8s linear infinite;
    filter: blur(60px);
    transform-origin: center;
    scale: 1.5;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .card {
    position: relative; z-index: 1;
    background: rgba(255,255,255,0.08);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 24px;
    padding: 48px 40px;
    text-align: center;
    animation: fadeUp 1s ease forwards;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(40px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  h1 { font-size: 3rem; font-weight: 800; color: #fff; line-height: 1.1; letter-spacing: -2px; }
  p  { margin-top: 16px; font-size: 1.1rem; color: rgba(255,255,255,0.6); }
  .badge {
    display: inline-block; margin-top: 24px;
    padding: 8px 20px; border-radius: 999px;
    background: rgba(255,255,255,0.15);
    color: #fff; font-size: 0.85rem; font-weight: 600;
    letter-spacing: 1px;
    animation: fadeUp 1s 0.3s ease both;
  }
</style>
</head>
<body>
<div class="bg"></div>
<div class="card">
  <h1>Make it<br/>Motion.</h1>
  <p>HTML rendered to MP4<br/>with pixel-perfect fidelity.</p>
  <div class="badge">✦ POWERED BY PUPPETEER</div>
</div>
</body>
</html>`,
  },
  {
    id: 'product-launch',
    name: 'Product Launch',
    category: 'Marketing',
    emoji: '🚀',
    html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<script src="https://cdn.tailwindcss.com"></script>
<style>
  body { width: 450px; height: 800px; overflow: hidden; margin: 0; }
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(60px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.8); }
    to   { opacity: 1; transform: scale(1); }
  }
  .slide  { animation: slideIn  0.7s cubic-bezier(.22,1,.36,1) both; }
  .scale  { animation: scaleIn  0.6s cubic-bezier(.22,1,.36,1) both; }
  .delay1 { animation-delay: 0.2s; }
  .delay2 { animation-delay: 0.45s; }
  .delay3 { animation-delay: 0.65s; }
</style>
</head>
<body>
<div class="w-full h-full bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex flex-col items-center justify-center px-10 gap-8">
  <!-- Logo -->
  <div class="scale w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-2xl shadow-purple-500/40">
    <span class="text-4xl">🚀</span>
  </div>

  <!-- Text -->
  <div class="text-center slide delay1">
    <div class="text-xs font-bold tracking-widest text-purple-400 uppercase mb-3">Launching Soon</div>
    <h1 class="text-5xl font-black text-white leading-none tracking-tight">The Future<br/>Is Here.</h1>
    <p class="mt-4 text-slate-400 text-base leading-relaxed">
      Build, ship, and scale your<br/>ideas faster than ever before.
    </p>
  </div>

  <!-- CTA -->
  <div class="slide delay2 flex flex-col gap-3 w-full">
    <button class="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-lg shadow-xl shadow-purple-500/30">
      Get Early Access
    </button>
    <button class="w-full py-4 rounded-2xl border border-white/10 text-white/60 font-medium text-base hover:bg-white/5">
      Learn More →
    </button>
  </div>

  <!-- Social proof -->
  <div class="slide delay3 flex items-center gap-2">
    <div class="flex -space-x-2">
      <div class="w-8 h-8 rounded-full bg-pink-500 border-2 border-slate-900"></div>
      <div class="w-8 h-8 rounded-full bg-blue-500 border-2 border-slate-900"></div>
      <div class="w-8 h-8 rounded-full bg-green-500 border-2 border-slate-900"></div>
    </div>
    <span class="text-slate-400 text-sm">+2,400 on the waitlist</span>
  </div>
</div>
</body>
</html>`,
  },
  {
    id: 'countdown-timer',
    name: 'Countdown Timer',
    category: 'Event',
    emoji: '⏱️',
    html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 450px; height: 800px; overflow: hidden;
    background: #000; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 48px;
    font-family: 'Helvetica Neue', Arial, sans-serif;
  }
  h2 { color: #fff; font-size: 1.4rem; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; opacity: 0.6; }
  .grid { display: flex; gap: 20px; }
  .unit {
    display: flex; flex-direction: column; align-items: center; gap: 8px;
  }
  .num {
    font-size: 5rem; font-weight: 900; color: #fff; line-height: 1;
    font-variant-numeric: tabular-nums;
    animation: tick 1s steps(1) infinite;
  }
  @keyframes tick {
    0%   { opacity: 1; }
    49%  { opacity: 1; }
    50%  { opacity: 0.3; }
    99%  { opacity: 0.3; }
    100% { opacity: 1; }
  }
  .lbl { font-size: 0.65rem; letter-spacing: 3px; color: rgba(255,255,255,0.35); text-transform: uppercase; }
  .colon { font-size: 4rem; font-weight: 900; color: rgba(255,255,255,0.2); line-height: 1; margin-top: -8px; animation: blink 1s step-start infinite; }
  @keyframes blink { 50% { opacity: 0; } }
  .cta { background: #fff; color: #000; padding: 16px 48px; border-radius: 999px; font-size: 1rem; font-weight: 700; letter-spacing: 1px; }
  .ring {
    width: 200px; height: 200px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.05);
    position: absolute;
    animation: expand 3s ease-out infinite;
  }
  @keyframes expand {
    0%   { transform: scale(0.6); opacity: 0.6; }
    100% { transform: scale(2);   opacity: 0; }
  }
</style>
</head>
<body>
<div class="ring" style="animation-delay:0s"></div>
<div class="ring" style="animation-delay:1s"></div>
<div class="ring" style="animation-delay:2s"></div>
<h2>Event Starts In</h2>
<div class="grid">
  <div class="unit"><div class="num">02</div><div class="lbl">Days</div></div>
  <div class="colon">:</div>
  <div class="unit"><div class="num" style="animation-delay:0.5s">14</div><div class="lbl">Hours</div></div>
  <div class="colon" style="animation-delay:0.5s">:</div>
  <div class="unit"><div class="num" style="animation-delay:0.25s">33</div><div class="lbl">Mins</div></div>
</div>
<div class="cta">Register Now</div>
</body>
</html>`,
  },
  {
    id: 'stats-reveal',
    name: 'Stats Reveal',
    category: 'Data',
    emoji: '📊',
    html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<script src="https://cdn.tailwindcss.com"></script>
<style>
  body { width: 450px; height: 800px; overflow: hidden; margin: 0; }
  @keyframes growBar {
    from { width: 0; }
    to   { width: var(--w); }
  }
  .bar { animation: growBar 1.2s cubic-bezier(.22,1,.36,1) both; }
  @keyframes countUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .stat { animation: countUp 0.6s ease both; }
</style>
</head>
<body>
<div class="w-full h-full bg-[#0f172a] flex flex-col justify-center px-10 gap-10">
  <div>
    <div class="text-xs text-blue-400 font-bold tracking-widest uppercase mb-2">Q2 Results</div>
    <h1 class="text-4xl font-black text-white">Growth<br/>Report 2024</h1>
  </div>

  <!-- Stats bars -->
  <div class="flex flex-col gap-6">
    <div class="stat" style="animation-delay:0.1s">
      <div class="flex justify-between text-sm mb-2">
        <span class="text-slate-400">Revenue</span>
        <span class="text-white font-bold">$4.2M</span>
      </div>
      <div class="h-2 bg-white/5 rounded-full overflow-hidden">
        <div class="bar h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" style="--w:84%; animation-delay:0.3s"></div>
      </div>
    </div>
    <div class="stat" style="animation-delay:0.25s">
      <div class="flex justify-between text-sm mb-2">
        <span class="text-slate-400">Users</span>
        <span class="text-white font-bold">128K</span>
      </div>
      <div class="h-2 bg-white/5 rounded-full overflow-hidden">
        <div class="bar h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full" style="--w:68%; animation-delay:0.5s"></div>
      </div>
    </div>
    <div class="stat" style="animation-delay:0.4s">
      <div class="flex justify-between text-sm mb-2">
        <span class="text-slate-400">NPS Score</span>
        <span class="text-white font-bold">72</span>
      </div>
      <div class="h-2 bg-white/5 rounded-full overflow-hidden">
        <div class="bar h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full" style="--w:72%; animation-delay:0.7s"></div>
      </div>
    </div>
    <div class="stat" style="animation-delay:0.55s">
      <div class="flex justify-between text-sm mb-2">
        <span class="text-slate-400">Retention</span>
        <span class="text-white font-bold">91%</span>
      </div>
      <div class="h-2 bg-white/5 rounded-full overflow-hidden">
        <div class="bar h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full" style="--w:91%; animation-delay:0.9s"></div>
      </div>
    </div>
  </div>

  <!-- Highlight -->
  <div class="stat border border-white/10 rounded-2xl p-6 bg-white/3" style="animation-delay:0.7s">
    <div class="text-slate-400 text-sm mb-1">Year-over-Year Growth</div>
    <div class="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">↑ 147%</div>
  </div>
</div>
</body>
</html>`,
  },
  {
    id: 'text-kinetic',
    name: 'Kinetic Text',
    category: 'Typography',
    emoji: '✦',
    html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 450px; height: 800px; overflow: hidden;
    background: #fff;
    font-family: 'Helvetica Neue', Arial, sans-serif;
    display: flex; align-items: center; justify-content: center;
  }
  .scene { position: relative; width: 100%; height: 100%; }
  .word {
    position: absolute; font-weight: 900; text-transform: uppercase;
    line-height: 1; white-space: nowrap;
  }
  @keyframes slideRight { from { transform: translateX(-120%); } to { transform: translateX(120%); } }
  @keyframes slideLeft  { from { transform: translateX( 120%); } to { transform: translateX(-120%); } }
  @keyframes scaleUp    { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
  .w1 { top: 15%;  left: 0; font-size: 5rem; color: #000; animation: slideRight 4s linear infinite; }
  .w2 { top: 30%;  left: 0; font-size: 3.5rem; color: #f43f5e; animation: slideLeft  5s linear infinite; }
  .w3 { top: 44%;  left: 0; font-size: 6rem; color: #000; animation: slideRight 3.5s linear infinite 0.5s; }
  .w4 { top: 60%;  left: 0; font-size: 4rem; color: #3b82f6; animation: slideLeft  4.5s linear infinite 0.2s; }
  .w5 { top: 74%;  left: 0; font-size: 5.5rem; color: #000; animation: slideRight 3s linear infinite 1s; }
  .center {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 2rem; font-weight: 900; color: #fff;
    background: #000;
    clip-path: inset(35% 5% 35% 5% round 16px);
    animation: scaleUp 2s ease-in-out infinite;
    z-index: 10;
  }
</style>
</head>
<body>
<div class="scene">
  <div class="word w1">CREATIVE •</div>
  <div class="word w2">DESIGN ◆ MOTION ◆</div>
  <div class="word w3">ANIMATE</div>
  <div class="word w4">RENDER • EXPORT •</div>
  <div class="word w5">PUBLISH ★</div>
  <div class="center">HTML → MP4</div>
</div>
</body>
</html>`,
  },
];
