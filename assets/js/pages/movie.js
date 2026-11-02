/* The movie: the whole course in one sitting. Moe digs from the grass to the final exam.

   Every picture is a pure function of the film time, so scrubbing and chapter jumps land on exactly
   the frame that playback shows. A chapter is a list of beats (one narrated line each) and one draw
   function. draw(g, b, t) gets b, a beat position (2.5 is halfway through the third line), so the
   choreography follows the words however long the narration runs. t is an ambient clock for idle
   life, which keeps ticking while the picture waits for the voice. */
Lab.ready(function () {
  'use strict';
  const canvas = Lab.$('#film-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const W = 800, H = 450, TAU = Math.PI * 2;
  const reduced = Lab.reducedMotion;
  canvas.dataset.vw = W;

  /* State for the frame being drawn. Never read between frames. */
  const F = { t: 0, talk: false, noMoe: false };

  /* ---------- Small helpers ---------- */
  const io = (b, a, c) => ease.inOut(seg(b, a, c));
  const eo = (b, a, c) => ease.out(seg(b, a, c));
  const bk = (b, a, c) => ease.back(seg(b, a, c));
  const inOutA = (b, a, a2, c, c2) => Math.min(seg(b, a, a2), 1 - seg(b, c, c2));
  const tri = (x) => { const m = ((x % 2) + 2) % 2; return m < 1 ? m : 2 - m; };
  function A(g, a, fn) {
    if (a <= 0.004) return;
    const p = g.globalAlpha;
    g.globalAlpha = p * Math.min(1, a);
    fn();
    g.globalAlpha = p;
  }
  function at(g, x, y, s, fn, rot) {
    g.save(); g.translate(x, y);
    if (rot) g.rotate(rot);
    g.scale(s, s); fn(); g.restore();
  }
  /** Back-eased pop around (x, y). The drawing code uses stage coordinates. */
  function pop(g, x, y, q, fn) {
    const c = clamp(q);
    if (c <= 0) return;
    g.save(); g.translate(x, y);
    const s = ease.back(c);
    g.scale(s, s); g.translate(-x, -y);
    g.globalAlpha *= Math.min(1, c * 1.6);
    fn(); g.restore();
  }
  const label = (g, s, x, y, o = {}) => Art.text(g, s, x, y, Object.assign({ size: 26, halo: true }, o));
  const big = (g, s, x, y, o = {}) => Art.text(g, s, x, y, Object.assign({ font: 'display', size: 34, halo: true }, o));
  function fw(g, f, size) {
    const p = g.globalAlpha; g.globalAlpha = 0;
    const w = Art.formula(g, f, -500, -500, { size }); g.globalAlpha = p;
    return w;
  }
  /** A chalky rounded panel for text over a busy background. */
  function panel(g, x, y, w, h, o = {}) {
    g.save();
    g.globalAlpha *= o.a === undefined ? 1 : o.a;
    g.fillStyle = o.fill || 'rgba(16,8,32,.72)';
    Art.round(g, x, y, w, h, o.r || 18); g.fill();
    if (o.stroke !== false) { g.strokeStyle = o.stroke || 'rgba(247,242,255,.3)'; g.lineWidth = o.lw || 2.5; g.stroke(); }
    g.restore();
  }
  /** A window into the particle world, clipped to a rounded box. */
  function win(g, x, y, w, h, fn, o = {}) {
    g.save();
    Art.round(g, x, y, w, h, o.r || 18); g.clip();
    const bg = g.createRadialGradient(x + w / 2, y + h * 0.4, 10, x + w / 2, y + h / 2, Math.max(w, h) * 0.75);
    bg.addColorStop(0, o.c1 || '#3A2466'); bg.addColorStop(1, o.c2 || '#170C29');
    g.fillStyle = bg; g.fillRect(x, y, w, h);
    fn();
    g.restore();
    g.strokeStyle = o.rim || 'rgba(214,240,255,.75)'; g.lineWidth = o.lw || 4;
    Art.round(g, x, y, w, h, o.r || 18); g.stroke();
  }
  /** Equation layout: items are { f, c, cq, a } terms or the strings '+' and '->'. Returns term centers. */
  function eqn(g, items, cx, y, size, o = {}) {
    const pad = size * 0.3;
    const L = items.map((it) => {
      if (typeof it === 'string') {
        const sym = it === '->' ? '→' : it;
        g.font = `400 ${size}px ${Art.FONT_DISPLAY}`;
        return { sym, w: g.measureText(sym).width + pad * 2 };
      }
      const ww = fw(g, it.f, size);
      let cw = 0;
      if (it.c) {
        g.font = `400 ${size}px ${Art.FONT_DISPLAY}`;
        cw = (g.measureText(it.c).width + size * 0.08) * (it.cq === undefined ? 1 : it.cq);
      }
      return Object.assign({}, it, { fw: ww, cw, w: ww + cw });
    });
    const total = L.reduce((s, p) => s + p.w, 0);
    let x = cx - total / 2;
    const out = [];
    L.forEach((p) => {
      if (p.sym) {
        Art.text(g, p.sym, x + p.w / 2, y, { font: 'display', size, color: C.dim, halo: true });
        out.push({ x: x + p.w / 2, x0: x, x1: x + p.w });
      } else {
        A(g, p.a === undefined ? 1 : p.a, () => {
          if (p.c && p.cw > 0.5) {
            const q = p.cq === undefined ? 1 : p.cq;
            g.save(); g.translate(x + p.cw * 0.46, y); g.scale(Math.max(0.01, q), Math.max(0.01, q));
            Art.text(g, p.c, 0, 0, { font: 'display', size, color: o.coefColor || C.sun, halo: true });
            g.restore();
          }
          Art.formula(g, p.f, x + p.cw, y, { size, colorize: o.colorize !== false, color: p.color, align: 'left', halo: true });
        });
        out.push({ x: x + p.cw + p.fw / 2, x0: x, x1: x + p.w, f0: x + p.cw });
      }
      x += p.w;
    });
    return out;
  }
  function walk(b, a, c, x0, x1, hops = 4) {
    const q = io(b, a, c);
    const moving = q > 0 && q < 1;
    return { x: lerp(x0, x1, q), hop: moving ? Math.abs(Math.sin(q * Math.PI * hops)) * 13 : 0, moving };
  }

  /* ---------- Moe, rigged. Built from the shared drawing in moe.js, so Moe looks the same everywhere,
     with arms that swing, pupils that look around, and a mouth that really talks. ---------- */
  const MOUTH_PARTS = { happy: 2, wave: 2, point: 2, cheer: 2, think: 1, wow: 1, oops: 1 };
  const INK = '#22123A';
  const rigs = {};
  function rig(mood) {
    if (rigs[mood]) return rigs[mood];
    const list = Moe.parts(mood).map((p) => Object.assign({}, p, { path: new Path2D(p.d) }));
    const n = MOUTH_PARTS[mood] || 2;
    const r = { body: [], armL: [], armR: [], face: [], mouth: list.slice(list.length - n) };
    const rest = list.slice(0, list.length - n);
    let arms = 0;
    for (let i = 0; i < rest.length; i++) {
      if (rest[i].sw === 20) {
        (arms === 0 ? r.armL : r.armR).push(rest[i], rest[i + 1], rest[i + 2]);
        arms++; i += 2;
      } else (arms < 2 ? r.body : r.face).push(rest[i]);
    }
    return (rigs[mood] = r);
  }
  const OPEN_MOUTH = new Path2D('M101 136C108 142 132 142 139 136C138 158 102 158 101 136Z');
  const OPEN_TEETH = new Path2D('M112 138.8h7.5v6.6h-7.5zM120.5 138.8h7.5v6.6h-7.5z');
  const HELMET_DOME = new Path2D('M60 66C56 2 184 2 180 66Z');
  const HELMET_BRIM = new Path2D('M48 62Q120 46 192 62Q196 74 186 74Q120 60 54 74Q44 74 48 62Z');
  const TOQUE = new Path2D('M76 50C52 42 54 8 82 10C88 -12 118 -14 126 2C140 -12 172 -6 166 16C190 18 186 46 164 50L160 66Q120 54 80 66Z');
  function moe(g, x, y, h, mood, o = {}) {
    if (F.noMoe && !o.force) return;
    const r = rig(mood), s = h / 260, t = o.t === undefined ? F.t : o.t;
    const talking = o.talk === undefined ? F.talk : o.talk;
    const mouth = talking ? 0.5 + 0.5 * Math.sin(t * 14 + 1.6 * Math.sin(t * 3.3)) : 0;
    const base = g.globalAlpha;
    const breathe = Math.sin(t * 2.1);
    g.save();
    g.translate(x, y - (o.hop || 0));
    const lean = talking ? Math.sin(t * 2.6) * 0.018 : 0;
    if (o.rot || lean) g.rotate((o.rot || 0) + lean);
    const sq = o.squash || 0;
    g.scale((o.flip ? -s : s) * (1 + sq), s * (1 - sq + breathe * 0.007));
    g.translate(-120, -260);
    g.lineJoin = 'round';
    const paint = (p) => {
      g.globalAlpha = base * (p.opacity || 1);
      if (p.fill && p.fill !== 'none') { g.fillStyle = p.fill; g.fill(p.path); }
      if (p.stroke) { g.strokeStyle = p.stroke; g.lineWidth = p.sw; g.lineCap = p.cap || 'butt'; g.stroke(p.path); }
    };
    let aL = 0, aR = 0;
    if (o.dig) { aL = Math.sin(t * 24) * 0.6; aR = -Math.sin(t * 24) * 0.6; }
    else if (mood === 'wave') aR = Math.sin(t * 7) * 0.3;
    else if (mood === 'cheer') { aL = Math.sin(t * 9) * 0.16; aR = -Math.sin(t * 9) * 0.16; }
    else if (talking) { aL = Math.sin(t * 3.1) * 0.1; aR = Math.sin(t * 2.7 + 1) * 0.1; }
    r.body.forEach(paint);
    const arm = (list, px, py, a) => { g.save(); g.translate(px, py); g.rotate(a); g.translate(-px, -py); list.forEach(paint); g.restore(); };
    arm(r.armL, 56, 164, aL);
    arm(r.armR, 184, 164, aR);
    const blink = (t + (o.seed || 0)) % 3.7 > 3.56;
    const lx = o.look ? o.look[0] * 7 : 0, ly = o.look ? o.look[1] * 6 : 0;
    r.face.forEach((p) => {
      if (p.eye) {
        if (blink) return;
        g.save(); g.translate(lx, ly); paint(p); g.restore();
      } else paint(p);
    });
    g.globalAlpha = base;
    if (blink) {
      g.strokeStyle = INK; g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(78, 84); g.lineTo(102, 84); g.moveTo(138, 84); g.lineTo(162, 84); g.stroke();
    }
    if (talking) {
      g.save(); g.translate(0, 136); g.scale(1, 0.34 + 0.66 * mouth); g.translate(0, -136);
      g.fillStyle = '#7B1E45'; g.strokeStyle = INK; g.lineWidth = 3.5; g.fill(OPEN_MOUTH); g.stroke(OPEN_MOUTH);
      g.restore();
      g.fillStyle = '#fff'; g.fill(OPEN_TEETH);
    } else r.mouth.forEach(paint);
    g.globalAlpha = base;
    if (o.helmet) {
      g.fillStyle = '#FFD23F'; g.strokeStyle = INK; g.lineWidth = 4;
      g.fill(HELMET_DOME); g.stroke(HELMET_DOME);
      g.fillStyle = '#F2B600'; g.fill(HELMET_BRIM); g.stroke(HELMET_BRIM);
      g.fillStyle = '#FFF7C9'; g.beginPath(); g.arc(120, 32, 15, 0, TAU); g.fill(); g.stroke();
    }
    if (o.chef) {
      g.fillStyle = '#FFFDF8'; g.strokeStyle = INK; g.lineWidth = 4; g.fill(TOQUE); g.stroke(TOQUE);
    }
    if (o.ring) {
      g.lineWidth = 34; g.strokeStyle = INK;
      g.beginPath(); g.ellipse(120, 214, 106, 30, 0, 0, TAU); g.stroke();
      g.lineWidth = 27; g.strokeStyle = '#FF4FA3'; g.stroke();
      g.lineWidth = 7; g.strokeStyle = 'rgba(255,255,255,.55)';
      g.beginPath(); g.ellipse(120, 210, 106, 30, 0, 3.5, 5.9); g.stroke();
    }
    if (o.sweat) {
      g.fillStyle = '#7FD8FF'; g.strokeStyle = INK; g.lineWidth = 2.5;
      const d = (t * 0.9) % 1;
      g.globalAlpha = base * (1 - d);
      g.beginPath(); g.ellipse(205, 60 + d * 40, 9, 13, 0, 0, TAU); g.fill(); g.stroke();
      g.globalAlpha = base;
    }
    if (o.bubble) {
      g.strokeStyle = 'rgba(190,240,255,.7)'; g.lineWidth = 6;
      g.fillStyle = 'rgba(160,225,255,.12)';
      g.beginPath(); g.arc(120, 132, 158, 0, TAU); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 8; g.lineCap = 'round';
      g.beginPath(); g.arc(120, 132, 138, -2.7, -1.9); g.stroke();
    }
    g.restore();
  }

  /* ---------- The earth: one layer per chapter ---------- */
  const LAYER = {
    surface: { rock: '#4A3226', back: ['#141038', '#2A1F5E'], dust: '#FFFFFF', seed: 1 },
    topsoil: { rock: '#533626', back: ['#24161A', '#402820'], dust: '#FFE6C8', decor: 'roots', seed: 2 },
    clay: { rock: '#70331F', back: ['#2B1216', '#4F2017'], dust: '#FFC9A8', decor: 'clay', seed: 3 },
    study: { rock: '#5E2B2A', back: ['#230F1E', '#421B25'], dust: '#FFD0C0', decor: 'study', seed: 4 },
    home: { rock: '#4B2C80', back: ['#1E1138', '#39215F'], dust: '#E3CCFF', decor: 'home', seed: 5 },
    gravel: { rock: '#454E68', back: ['#161B2D', '#292F47'], dust: '#D5DEFA', decor: 'gravel', seed: 6 },
    mine: { rock: '#354466', back: ['#131931', '#232F4F'], dust: '#FFE6B8', decor: 'mine', seed: 7 },
    water: { rock: '#14506F', back: ['#07203A', '#0D3E60'], dust: '#BCEBFF', decor: 'water', seed: 8 },
    warm: { rock: '#742D14', back: ['#2A0D0D', '#5A1E10'], dust: '#FFC090', decor: 'warm', seed: 9 },
    crystal: { rock: '#4E2074', back: ['#1B0C36', '#3A1260'], dust: '#F5C8FF', decor: 'crystal', seed: 10 },
    bedrock: { rock: '#383E56', back: ['#141622', '#25283A'], dust: '#D0D6F0', decor: 'bedrock', seed: 11 },
    gas: { rock: '#1C5A53', back: ['#0B2527', '#13413D'], dust: '#C8FFE0', decor: 'gas', seed: 12 },
    deep: { rock: '#3B214D', back: ['#120A22', '#291334'], dust: '#FFB080', decor: 'deep', seed: 13 },
    bottom: { rock: '#2F1D58', back: ['#100920', '#231343'], dust: '#FFE9A8', decor: 'hall', seed: 14 },
  };
  const TX = 250; // Where the tunnel runs.
  const wav = (x, s) => Math.sin(x * 0.013 + s) * 8 + Math.sin(x * 0.037 + s * 2.3) * 4 + Math.sin(x * 0.091 + s * 1.7) * 2;
  const CEIL = (x, s) => 28 + wav(x, s);
  const FLOOR = (x, s) => 422 + wav(x, s + 4) * 0.5;

  function stones(x, n, seed, x0, y0, x1, y1, col, alpha) {
    for (let i = 0; i < n; i++) {
      const px = lerp(x0, x1, rand(seed + i * 3.1)), py = lerp(y0, y1, rand(seed + i * 5.7)), r = 4 + rand(seed + i) * 13;
      x.globalAlpha = alpha * (0.5 + rand(seed + i * 2) * 0.5);
      x.fillStyle = col;
      x.beginPath(); x.ellipse(px, py, r * 1.25, r, rand(seed + i * 7) * 3, 0, TAU); x.fill();
      x.fillStyle = 'rgba(255,255,255,.22)';
      x.beginPath(); x.ellipse(px - r * 0.3, py - r * 0.34, r * 0.5, r * 0.22, -0.3, 0, TAU); x.fill();
    }
    x.globalAlpha = 1;
  }
  function ammonite(x, cx, cy, r, col) {
    x.strokeStyle = col; x.lineWidth = r * 0.14; x.lineCap = 'round';
    x.beginPath();
    for (let a = 0; a < 15; a += 0.2) {
      const rr = r * (a / 15);
      const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
      if (a === 0) x.moveTo(px, py); else x.lineTo(px, py);
    }
    x.stroke();
  }
  function crystalCluster(x, cx, cy, n, s, colors, flip) {
    for (let i = 0; i < n; i++) {
      const a = lerp(-0.7, 0.7, n === 1 ? 0.5 : i / (n - 1)) + (rand(i + cx) - 0.5) * 0.25;
      const len = s * (0.6 + rand(i + cy) * 0.7), w = s * 0.17;
      x.save(); x.translate(cx + (i - n / 2) * s * 0.17, cy); x.rotate(a + (flip ? Math.PI : 0));
      const col = colors[i % colors.length];
      const gr = x.createLinearGradient(-w, 0, w, 0);
      gr.addColorStop(0, Art.mix(col, '#ffffff', 0.45)); gr.addColorStop(0.5, col); gr.addColorStop(1, Art.mix(col, '#12062A', 0.45));
      x.fillStyle = gr; x.strokeStyle = 'rgba(16,6,34,.6)'; x.lineWidth = 1.5;
      x.beginPath(); x.moveTo(-w, 6); x.lineTo(-w, -len + w); x.lineTo(0, -len - w * 0.6); x.lineTo(w, -len + w); x.lineTo(w, 6); x.closePath(); x.fill(); x.stroke();
      x.restore();
    }
  }
  const DECOR = {
    roots(x, s) {
      x.lineCap = 'round';
      for (let i = 0; i < 9; i++) {
        const rx = 30 + i * 86 + rand(i + 3) * 40, len = 34 + rand(i + 7) * 62;
        if (Math.abs(rx - TX) < 80) continue;
        const cy = CEIL(rx, s);
        x.strokeStyle = i % 3 ? '#7A5A3A' : '#96734C'; x.lineWidth = 3 + rand(i) * 3.5;
        x.beginPath(); x.moveTo(rx, cy - 6);
        x.bezierCurveTo(rx + 14 * (rand(i + 9) - 0.5), cy + len * 0.4, rx + 26 * (rand(i + 2) - 0.5), cy + len * 0.7, rx + 18 * (rand(i + 5) - 0.5), cy + len);
        x.stroke();
      }
      const gr = x.createLinearGradient(680, 0, 712, 0);
      gr.addColorStop(0, '#FF9A3D'); gr.addColorStop(1, '#D9631A');
      x.fillStyle = gr; x.strokeStyle = '#1A0F2E'; x.lineWidth = 2.5;
      x.beginPath(); x.moveTo(674, 18); x.quadraticCurveTo(684, 74, 696, 104); x.quadraticCurveTo(708, 74, 718, 18); x.closePath(); x.fill(); x.stroke();
      x.strokeStyle = 'rgba(120,50,10,.8)'; x.lineWidth = 2;
      x.beginPath(); x.moveTo(684, 42); x.lineTo(696, 44); x.moveTo(708, 62); x.lineTo(698, 64); x.stroke();
      stones(x, 16, 5, 30, 300, 770, 400, '#6A4B38', 0.3);
    },
    clay(x, s) {
      for (let i = 0; i < 8; i++) {
        x.strokeStyle = `rgba(255,190,150,${0.05 + rand(i) * 0.05})`; x.lineWidth = 8 + rand(i + 2) * 18;
        x.beginPath();
        for (let p = 0; p <= W; p += 20) { const y = 60 + i * 48 + Math.sin(p * 0.009 + i) * 12 + wav(p, s + i) * 0.5; if (p) x.lineTo(p, y); else x.moveTo(p, y); }
        x.stroke();
      }
    },
    study(x, s) {
      DECOR.clay(x, s);
      x.fillStyle = 'rgba(0,0,0,.12)'; x.fillRect(0, 0, W, H);
    },
    home(x, s) {
      // A string of lights and a shelf: Moe lives here. The front door is drawn in the first scene.
      x.strokeStyle = 'rgba(247,226,180,.5)'; x.lineWidth = 2.5;
      x.beginPath();
      for (let p = 0; p <= W; p += 10) { const y = 58 + Math.abs(Math.sin(p * 0.012)) * 20; if (p) x.lineTo(p, y); else x.moveTo(p, y); }
      x.stroke();
      for (let i = 0; i < 13; i++) {
        const p = 30 + i * 62, y = 58 + Math.abs(Math.sin(p * 0.012)) * 20 + 8;
        const col = ['#FFD23F', '#FF7DBE', '#7FE3FF'][i % 3];
        Art.glow(x, p, y, 22, col, 0.55);
        x.fillStyle = col; x.beginPath(); x.ellipse(p, y, 5.5, 7.5, 0, 0, TAU); x.fill();
      }
      x.fillStyle = '#7A4A2B'; x.strokeStyle = '#1A0F2E'; x.lineWidth = 3;
      Art.round(x, 642, 170, 134, 11, 4); x.fill(); x.stroke();
      [[664, '#FF7DBE', 34], [700, '#7FE3FF', 44], [740, '#FFD23F', 30]].forEach(([px, col, hh]) => {
        x.fillStyle = Art.alpha(col, 0.75);
        Art.round(x, px - 11, 170 - hh, 22, hh, 7); x.fill(); x.stroke();
      });
    },
    gravel(x) {
      stones(x, 46, 2, 20, 50, 780, 400, '#55607E', 0.42);
      stones(x, 18, 9, 10, 370, 180, 425, '#6B7695', 0.8);
      stones(x, 18, 13, 620, 370, 790, 425, '#6B7695', 0.8);
    },
    mine(x, s) {
      stones(x, 30, 21, 20, 50, 780, 400, '#46547A', 0.35);
      x.fillStyle = '#6A4A2C'; x.strokeStyle = '#1A0F2E'; x.lineWidth = 3;
      [28, 756].forEach((px) => { x.fillRect(px, 30, 22, 400); x.strokeRect(px, 30, 22, 400); });
      x.fillRect(16, 42, 770, 20); x.strokeRect(16, 42, 770, 20);
      Art.glow(x, 640, 96, 70, '#FFC860', 0.5);
      x.fillStyle = '#FFE08A'; x.strokeStyle = '#1A0F2E'; x.beginPath(); x.ellipse(640, 92, 11, 16, 0, 0, TAU); x.fill(); x.stroke();
      x.strokeStyle = '#7C8AA8'; x.lineWidth = 4;
      for (let p = 0; p <= W; p += 44) { x.beginPath(); x.moveTo(p, 431); x.lineTo(p + 14, 444); x.stroke(); }
      x.strokeStyle = '#AAB6D0'; x.lineWidth = 3.5;
      x.beginPath(); x.moveTo(0, 430); x.lineTo(W, 430); x.stroke();
      void s;
    },
    water(x, s) {
      for (let i = 0; i < 12; i++) {
        const px = 40 + rand(i + 4) * 720;
        if (Math.abs(px - TX) < 70) continue;
        const cy = CEIL(px, s), len = 22 + rand(i + 8) * 50, w = 8 + rand(i + 2) * 9;
        x.fillStyle = '#1C6288'; x.strokeStyle = 'rgba(10,30,50,.6)'; x.lineWidth = 2;
        x.beginPath(); x.moveTo(px - w, cy - 6); x.lineTo(px, cy + len); x.lineTo(px + w, cy - 6); x.closePath(); x.fill(); x.stroke();
      }
      for (let i = 0; i < 16; i++) {
        x.strokeStyle = `rgba(150,225,255,${0.03 + rand(i) * 0.05})`; x.lineWidth = 4 + rand(i + 1) * 8;
        const px = rand(i + 11) * W;
        x.beginPath(); x.moveTo(px, 40); x.bezierCurveTo(px + 20, 140, px - 16, 260, px + 8, 400); x.stroke();
      }
    },
    warm(x) {
      x.lineCap = 'round'; x.lineJoin = 'round';
      for (let i = 0; i < 7; i++) {
        let px = rand(i + 30) * W, py = 40 + rand(i + 31) * 300;
        x.beginPath(); x.moveTo(px, py);
        for (let k = 0; k < 7; k++) { px += 26 + rand(i * 9 + k) * 40; py += (rand(i * 7 + k) - 0.5) * 56; x.lineTo(px, py); }
        x.strokeStyle = 'rgba(255,120,40,.1)'; x.lineWidth = 11; x.stroke();
        x.strokeStyle = 'rgba(255,170,70,.34)'; x.lineWidth = 3; x.stroke();
      }
    },
    crystal(x, s) {
      const cols = ['#FF7DD8', '#B28DFF', '#6FE7FF'];
      crystalCluster(x, 60, FLOOR(60, s) + 2, 5, 90, cols);
      crystalCluster(x, 740, FLOOR(740, s) + 2, 6, 110, cols);
      crystalCluster(x, 390, FLOOR(390, s) + 4, 4, 42, cols);
      crystalCluster(x, 600, CEIL(600, s) - 2, 5, 60, cols, true);
      crystalCluster(x, 90, CEIL(90, s) - 2, 4, 54, cols, true);
    },
    bedrock(x, s) {
      for (let i = 0; i < 360; i++) {
        x.fillStyle = `rgba(${rand(i) > 0.5 ? '235,235,255' : '10,10,24'},${0.04 + rand(i + 2) * 0.1})`;
        x.fillRect(rand(i + 3) * W, rand(i + 5) * H, 2 + rand(i + 7) * 3, 2 + rand(i + 9) * 3);
      }
      x.strokeStyle = 'rgba(8,8,20,.6)'; x.lineWidth = 3;
      x.beginPath(); x.moveTo(610, 30); x.lineTo(590, 150); x.lineTo(640, 260); x.lineTo(620, 420); x.stroke();
      ammonite(x, 92, 118, 32, 'rgba(235,225,200,.13)');
      void s;
    },
    gas(x, s) {
      for (let i = 0; i < 26; i++) {
        const r = 6 + rand(i) * 26;
        x.strokeStyle = `rgba(190,255,220,${0.05 + rand(i + 3) * 0.07})`; x.lineWidth = 2.5;
        x.beginPath(); x.arc(rand(i + 4) * W, 40 + rand(i + 5) * 360, r, 0, TAU); x.stroke();
      }
      void s;
    },
    deep(x, s) {
      for (let i = 0; i < 15; i++) {
        const px = i * 58 - 8, hh = 150 + rand(i + 2) * 130, w = 52;
        x.fillStyle = i % 2 ? '#241536' : '#2D1A42'; x.strokeStyle = 'rgba(8,4,18,.7)'; x.lineWidth = 3;
        x.beginPath(); x.moveTo(px, 450); x.lineTo(px, 450 - hh); x.lineTo(px + w * 0.3, 442 - hh); x.lineTo(px + w * 0.7, 442 - hh); x.lineTo(px + w, 450 - hh); x.lineTo(px + w, 450); x.closePath(); x.fill(); x.stroke();
      }
      const l = x.createLinearGradient(0, 330, 0, 450);
      l.addColorStop(0, 'rgba(255,90,30,0)'); l.addColorStop(1, 'rgba(255,90,30,.42)');
      x.fillStyle = l; x.fillRect(0, 330, W, 120);
      void s;
    },
    hall(x, s) {
      // Tall arches with gold trim, because the final exam deserves a dramatic room.
      for (let i = 0; i < 5; i++) {
        const cx = 80 + i * 160;
        const gr = x.createLinearGradient(cx - 62, 0, cx + 62, 0);
        gr.addColorStop(0, '#2A1A52'); gr.addColorStop(0.5, '#3E2A74'); gr.addColorStop(1, '#2A1A52');
        x.fillStyle = gr; x.strokeStyle = 'rgba(255,214,90,.5)'; x.lineWidth = 3;
        x.beginPath(); x.moveTo(cx - 60, 430); x.lineTo(cx - 60, 160); x.arc(cx, 160, 60, Math.PI, 0); x.lineTo(cx + 60, 430); x.closePath(); x.fill(); x.stroke();
      }
      x.fillStyle = '#4A3480'; x.strokeStyle = 'rgba(255,214,90,.8)'; x.lineWidth = 2.5;
      for (let i = 0; i < 6; i++) {
        const cx = i * 160;
        x.fillRect(cx - 11, 80, 22, 350); x.strokeRect(cx - 11, 80, 22, 350);
      }
      void s;
    },
  };

  const imgCache = new Map();
  let imgScale = 2;
  function chamberImage(L) {
    const key = L.seed + '|' + imgScale;
    let c = imgCache.get(key);
    if (c) { imgCache.delete(key); imgCache.set(key, c); return c; }
    c = document.createElement('canvas');
    c.width = Math.round(W * imgScale); c.height = Math.round(H * imgScale);
    const x = c.getContext('2d');
    x.scale(imgScale, imgScale);
    const s = L.seed * 1.7;
    const d = x.createLinearGradient(0, 0, 0, H);
    d.addColorStop(0, L.back[0]); d.addColorStop(1, L.back[1]);
    x.fillStyle = d; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 44; i++) {
      x.fillStyle = `rgba(${i % 2 ? '255,235,220' : '0,0,10'},${0.018 + rand(i + L.seed) * 0.035})`;
      x.beginPath(); x.ellipse(rand(i + 11) * W, rand(i + 23) * H, 18 + rand(i) * 70, 10 + rand(i + 2) * 34, rand(i + 3) * 3, 0, TAU); x.fill();
    }
    if (L.decor && L.decor !== 'crystal' && DECOR[L.decor]) DECOR[L.decor](x, s);
    // A pool of lamp light on the back wall.
    const lamp = x.createRadialGradient(W * 0.5, H * 0.42, 30, W * 0.5, H * 0.46, W * 0.58);
    lamp.addColorStop(0, 'rgba(255,245,230,.1)'); lamp.addColorStop(1, 'rgba(255,245,230,0)');
    x.fillStyle = lamp; x.fillRect(0, 0, W, H);
    // The rock frame: ceiling, floor, walls.
    const rockTexture = (path) => {
      x.save(); x.clip(path);
      const rg = x.createLinearGradient(0, 0, 0, H);
      rg.addColorStop(0, Art.mix(L.rock, '#000014', 0.14)); rg.addColorStop(0.5, L.rock); rg.addColorStop(1, Art.mix(L.rock, '#ffffff', 0.08));
      x.fillStyle = rg; x.fillRect(0, 0, W, H);
      for (let i = 0; i < 70; i++) {
        x.fillStyle = `rgba(${i % 3 ? '255,240,220' : '0,0,16'},${0.05 + rand(i + 2) * 0.09})`;
        const px = rand(i + 51) * W, py = i % 2 ? rand(i + 3) * 44 : 408 + rand(i + 3) * 42;
        x.beginPath(); x.ellipse(px, py, 3 + rand(i) * 9, 2 + rand(i + 1) * 5, rand(i) * 3, 0, TAU); x.fill();
      }
      x.restore();
    };
    const ceil = new Path2D(); ceil.moveTo(0, 0); ceil.lineTo(W, 0);
    for (let p = W; p >= 0; p -= 8) ceil.lineTo(p, CEIL(p, s));
    ceil.closePath();
    const floor = new Path2D(); floor.moveTo(0, H); floor.lineTo(W, H);
    for (let p = W; p >= 0; p -= 8) floor.lineTo(p, FLOOR(p, s));
    floor.closePath();
    const lw = new Path2D(); lw.moveTo(0, 0);
    for (let p = 0; p <= H; p += 10) lw.lineTo(8 + Math.sin(p * 0.03 + s) * 5 + Math.sin(p * 0.09 + s) * 3, p);
    lw.lineTo(0, H); lw.closePath();
    const rw = new Path2D(); rw.moveTo(W, 0);
    for (let p = 0; p <= H; p += 10) rw.lineTo(W - 8 - Math.sin(p * 0.031 + s * 2) * 5 - Math.sin(p * 0.08 + s) * 3, p);
    rw.lineTo(W, H); rw.closePath();
    [ceil, floor, lw, rw].forEach(rockTexture);
    x.strokeStyle = 'rgba(0,0,10,.4)'; x.lineWidth = 6; x.stroke(ceil);
    x.strokeStyle = 'rgba(255,255,255,.14)'; x.lineWidth = 3;
    x.beginPath();
    for (let p = 0; p <= W; p += 8) { if (p) x.lineTo(p, FLOOR(p, s)); else x.moveTo(p, FLOOR(p, s)); }
    x.stroke();
    if (L.decor === 'crystal') DECOR.crystal(x, s);
    // The hole Moe drops in through.
    const hy = CEIL(TX, s) - 2;
    const hole = x.createRadialGradient(TX, hy, 6, TX, hy, 62);
    hole.addColorStop(0, '#05020C'); hole.addColorStop(1, '#180C22');
    x.fillStyle = hole; x.strokeStyle = 'rgba(0,0,0,.5)'; x.lineWidth = 3;
    x.beginPath(); x.ellipse(TX, hy, 60, 24, 0, 0, TAU); x.fill(); x.stroke();
    x.strokeStyle = Art.mix(L.rock, '#ffffff', 0.25); x.lineWidth = 3;
    x.beginPath(); x.ellipse(TX, hy, 60, 24, 0, 0.3, Math.PI - 0.3); x.stroke();
    // Vignette.
    const v = x.createRadialGradient(W / 2, H / 2, H * 0.5, W / 2, H / 2, W * 0.66);
    v.addColorStop(0, 'rgba(6,2,16,0)'); v.addColorStop(1, 'rgba(6,2,16,.5)');
    x.fillStyle = v; x.fillRect(0, 0, W, H);
    imgCache.set(key, c);
    if (imgCache.size > 4) imgCache.delete(imgCache.keys().next().value);
    return c;
  }
  /** Ambient life on top of a chamber: drifting dust, and whatever that layer does. */
  function liveFX(g, L, t) {
    for (let i = 0; i < 12; i++) {
      const x = (rand(i + L.seed) * W + Math.sin(t * 0.13 + i) * 26 + W) % W;
      const y = 50 + ((rand(i + 40) * 340 + t * (5 + rand(i) * 6)) % 340);
      g.fillStyle = Art.alpha(L.dust, 0.05 + 0.12 * rand(i + 3));
      g.beginPath(); g.arc(x, y, 1.4 + rand(i + 5) * 2.2, 0, TAU); g.fill();
    }
    const d = L.decor;
    if (d === 'water') {
      for (let i = 0; i < 4; i++) {
        const px = 130 + i * 190 + rand(i) * 60, ph = (t * 0.45 + rand(i + 2)) % 1;
        g.fillStyle = 'rgba(150,225,255,.85)';
        g.beginPath(); g.ellipse(px, 50 + ph * ph * 340, 3.2, 5.5, 0, 0, TAU); g.fill();
      }
    } else if (d === 'crystal') {
      for (let i = 0; i < 8; i++) {
        const ph = (t * 0.5 + rand(i + 7)) % 1, q = Math.sin(ph * Math.PI);
        g.fillStyle = `rgba(255,255,255,${q * 0.9})`;
        const spots = [[40, 360], [78, 340], [720, 340], [762, 320], [598, 90], [90, 74], [392, 395], [742, 370]];
        Art.star(g, spots[i][0], spots[i][1], 3 + q * 7, ph * 2);
      }
    } else if (d === 'warm' || d === 'deep') {
      for (let i = 0; i < 12; i++) {
        const ph = (t * (0.13 + rand(i) * 0.14) + rand(i + 3)) % 1;
        const x = rand(i + 8) * W + Math.sin(t + i) * 12, y = 420 - ph * 380;
        g.fillStyle = `rgba(255,${130 + (rand(i + 4) * 90 | 0)},60,${(1 - ph) * 0.8})`;
        g.beginPath(); g.arc(x, y, 1.6 + rand(i + 5) * 2, 0, TAU); g.fill();
      }
    } else if (d === 'gas') {
      Art.bubbles(g, 30, 770, 425, 40, t * 0.45, { n: 11, r: 9, color: 'rgba(190,255,220,.42)' });
    }
  }
  function drawChamber(g, L, t) {
    g.drawImage(chamberImage(L), 0, 0, W, H);
    liveFX(g, L, t);
    if (L.decor === 'water') pool(g, t);
  }
  /** The flooded floor of the water table. */
  function pool(g, t, top = 398) {
    g.save();
    const gr = g.createLinearGradient(0, top, 0, H);
    gr.addColorStop(0, 'rgba(70,185,240,.62)'); gr.addColorStop(1, 'rgba(14,70,120,.95)');
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 14) g.lineTo(x, top + Math.sin(x * 0.03 + t * 1.6) * 2.4 + Math.sin(x * 0.011 - t) * 2);
    g.lineTo(W, H); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(210,245,255,.55)'; g.lineWidth = 2;
    g.beginPath();
    for (let x = 0; x <= W; x += 14) { const y = top + Math.sin(x * 0.03 + t * 1.6) * 2.4 + Math.sin(x * 0.011 - t) * 2; if (x) g.lineTo(x, y); else g.moveTo(x, y); }
    g.stroke();
    g.restore();
  }

  /** Earth between two chambers, with things buried in it. */
  function earth(g, LA, LB, y0, y1, t, seed) {
    const d = g.createLinearGradient(0, y0, 0, y1);
    d.addColorStop(0, Art.mix(LA.rock, '#ffffff', 0.08)); d.addColorStop(1, Art.mix(LB.rock, '#000014', 0.14));
    g.fillStyle = d; g.fillRect(0, y0, W, y1 - y0);
    for (let i = 0; i < 5; i++) {
      const yy = lerp(y0, y1, (i + 0.5) / 5);
      g.strokeStyle = 'rgba(0,0,10,.13)'; g.lineWidth = 14;
      g.beginPath(); g.moveTo(0, yy);
      for (let x = 0; x <= W; x += 40) g.lineTo(x, yy + wav(x, seed + i) * 1.5);
      g.stroke();
    }
    for (let i = 0; i < 26; i++) {
      const x = rand(seed + i * 3.3) * W, y = lerp(y0, y1, rand(seed + i * 1.9)), r = 5 + rand(seed + i) * 15;
      g.fillStyle = `rgba(${i % 2 ? '255,245,230' : '10,6,20'},${0.08 + rand(i + seed) * 0.13})`;
      g.beginPath(); g.ellipse(x, y, r * 1.3, r, rand(i) * 3, 0, TAU); g.fill();
    }
    // One buried curiosity per stretch of earth.
    const kind = seed % 4;
    const fx = 90, fy = lerp(y0, y1, 0.2 + 0.6 * rand(seed));
    if (kind === 0) ammonite(g, fx, fy, 34, 'rgba(240,230,205,.5)');
    else if (kind === 1) {
      g.strokeStyle = 'rgba(240,235,220,.5)'; g.lineWidth = 8; g.lineCap = 'round';
      g.beginPath(); g.moveTo(fx - 34, fy + 14); g.lineTo(fx + 34, fy - 14); g.stroke();
      g.fillStyle = 'rgba(240,235,220,.5)';
      [[-38, 8], [-30, 22], [30, -22], [38, -8]].forEach(([a, b]) => { g.beginPath(); g.arc(fx + a, fy + b, 8, 0, TAU); g.fill(); });
    } else if (kind === 2) {
      g.fillStyle = 'rgba(255,170,190,.55)'; g.strokeStyle = 'rgba(255,170,190,.55)'; g.lineWidth = 11; g.lineCap = 'round';
      g.beginPath(); g.moveTo(fx - 30, fy); g.bezierCurveTo(fx - 10, fy - 26, fx + 10, fy + 26, fx + 30, fy); g.stroke();
    } else crystalCluster(g, fx, fy + 20, 3, 44, ['#9FE6FF', '#D3B8FF']);
  }

  /** The wooden sign in the rock between chambers. */
  function chapterSign(g, x, y, n, title, depth) {
    const w = 450, h = 128;
    g.save();
    g.fillStyle = 'rgba(0,0,10,.35)'; Art.round(g, x - w / 2 + 6, y - h / 2 + 8, w, h, 16); g.fill();
    const gr = g.createLinearGradient(0, y - h / 2, 0, y + h / 2);
    gr.addColorStop(0, '#8C6238'); gr.addColorStop(1, '#5F3F24');
    g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 4;
    Art.round(g, x - w / 2, y - h / 2, w, h, 16); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(40,20,8,.35)'; g.lineWidth = 2.5;
    for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(x - w / 2 + 12, y - h / 2 + (h * i) / 4); g.lineTo(x + w / 2 - 12, y - h / 2 + (h * i) / 4 + wav(i * 90, n)); g.stroke(); }
    g.fillStyle = '#E9E4F5'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { g.beginPath(); g.arc(x + a * (w / 2 - 14), y + b * (h / 2 - 14), 5.5, 0, TAU); g.fill(); g.stroke(); });
    Art.text(g, `Chapter ${n}: ${depth}`, x, y - 32, { size: 24, color: '#FFD23F', halo: true });
    g.font = `400 40px ${Art.FONT_DISPLAY}`;
    const tw = g.measureText(title).width, size = tw > w - 40 ? Math.max(28, Math.floor(40 * (w - 40) / tw)) : 40;
    Art.text(g, title, x, y + 16, { font: 'display', size, color: '#fff', halo: true });
    g.restore();
  }

  /* ---------- Reusable pictures ---------- */
  function rock(g, x, y, s) {
    const gr = g.createLinearGradient(x - s, y - s, x + s, y + s);
    gr.addColorStop(0, '#B7ADC9'); gr.addColorStop(1, '#5A5270');
    g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    g.beginPath();
    [[-1, 0.62], [-0.86, -0.2], [-0.3, -0.72], [0.42, -0.76], [0.96, -0.1], [0.82, 0.62]].forEach(([a, b], i) => { if (i) g.lineTo(x + a * s, y + b * s); else g.moveTo(x + a * s, y + b * s); });
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.28)';
    g.beginPath(); g.ellipse(x - s * 0.28, y - s * 0.3, s * 0.26, s * 0.12, -0.4, 0, TAU); g.fill();
  }
  function waterMol(g, x, y, s, rot, o = {}) {
    Art.molecule(g, x, y, s, 'H2O', Object.assign({ rot, labels: false, style: 'fill', atomScale: 1.28 }, o));
  }
  /** Protons and neutrons, packed. Every ball is drawn, so the count is exact. */
  function nucleus(g, x, y, r, p, n, t, o = {}) {
    const total = p + n;
    const pts = [];
    for (let i = 0; i < total; i++) {
      const a = i * 2.39996, d = r * 1.42 * Math.sqrt(i + 0.35);
      pts.push({ i, x: x + Math.cos(a) * d + wander(i + 3, t * 1.6) * 1.2, y: y + Math.sin(a) * d + wander(i + 30, t * 1.6) * 1.2 });
    }
    // Alternate so both kinds mix evenly, then draw from the outside in.
    const kinds = [];
    let pl = p, nl = n;
    for (let i = 0; i < total; i++) { const useP = pl * total >= nl * total && (pl > nl || (i % 2 === 0 && pl > 0)); if (useP && pl > 0) { kinds.push('p'); pl--; } else if (nl > 0) { kinds.push('n'); nl--; } else { kinds.push('p'); pl--; } }
    if (o.glow) Art.glow(g, x, y, r * 6, '#FFD23F', 0.32 * o.glow);
    pts.slice().reverse().forEach((q) => {
      if (kinds[q.i] === 'p') { Art.ball(g, q.x, q.y, r, C.proton); if (r >= 9) Art.text(g, '+', q.x, q.y, { size: r * 1.4, color: '#fff' }); }
      else Art.ball(g, q.x, q.y, r, C.neutron);
    });
  }
  /** One hero atom: nucleus and electrons on two rings. Rings are a cartoon, and the film says so. */
  function atomRings(g, cx, cy, k, t, o = {}) {
    const a = o.a === undefined ? 1 : o.a;
    A(g, a, () => {
      g.strokeStyle = 'rgba(53,230,255,.35)'; g.lineWidth = 2.5;
      [72, 150].forEach((r) => { g.beginPath(); g.arc(cx, cy, r * k, 0, TAU); g.stroke(); });
      for (let i = 0; i < 2; i++) { const an = t * 2.2 + i * Math.PI; Art.electron(g, cx + Math.cos(an) * 72 * k, cy + Math.sin(an) * 72 * k, 8 * Math.max(0.7, k)); }
      for (let i = 0; i < 4; i++) { const an = -t * 1.25 + i * Math.PI / 2 + 0.4; Art.electron(g, cx + Math.cos(an) * 150 * k, cy + Math.sin(an) * 150 * k, 8 * Math.max(0.7, k)); }
      nucleus(g, cx, cy, 14 * k, 6, 6, t, { glow: o.glow === undefined ? 1 : o.glow });
    });
  }
  /** Small pictures for each layer of the course map. */
  function icon(g, i, x, y, s, t) {
    const dark = '#1A0F2E';
    g.save();
    if (i === 1) { // matter: an ice cube
      g.fillStyle = '#8FDBFF'; g.strokeStyle = dark; g.lineWidth = 2.5;
      Art.round(g, x - s, y - s, s * 2, s * 2, s * 0.4); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(x - s * 0.55, y - s * 0.55, s * 0.5, s * 0.22);
    } else if (i === 2) { // atom
      g.strokeStyle = C.electron; g.lineWidth = 2;
      [0, 1.05, 2.1].forEach((a) => { g.beginPath(); g.ellipse(x, y, s * 1.2, s * 0.46, a, 0, TAU); g.stroke(); });
      Art.ball(g, x, y, s * 0.36, C.proton);
    } else if (i === 3) { // table
      for (let k = 0; k < 9; k++) {
        if (k === 1) continue;
        g.fillStyle = ['#FF7DBE', '#FFD23F', '#7FE3FF'][k % 3];
        g.fillRect(x - s + (k % 3) * (s * 0.72), y - s * 0.95 + Math.floor(k / 3) * (s * 0.68), s * 0.6, s * 0.56);
      }
    } else if (i === 4) { // mole
      g.fillStyle = '#7A58A8'; g.strokeStyle = dark; g.lineWidth = 2.5;
      g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = '#E9FBFF'; g.strokeStyle = '#14B8CF'; g.lineWidth = 2.2;
      [-0.42, 0.42].forEach((d) => { g.beginPath(); g.arc(x + d * s, y - s * 0.16, s * 0.34, 0, TAU); g.fill(); g.stroke(); });
      g.fillStyle = '#FF9EBB'; g.beginPath(); g.ellipse(x, y + s * 0.42, s * 0.3, s * 0.22, 0, 0, TAU); g.fill();
    } else if (i === 5) { // flame
      Art.flame(g, x, y + s, s * 2.2, t, { kind: 'blue', wide: 1 });
    } else if (i === 6) { // recipe scale
      g.strokeStyle = '#EDE6F8'; g.lineWidth = 2.8; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x, y + s); g.lineTo(x, y - s * 0.8); g.moveTo(x - s, y - s * 0.6); g.lineTo(x + s, y - s * 0.6); g.stroke();
      Art.ball(g, x - s, y, s * 0.4, Art.elementColor('O')); Art.ball(g, x + s, y, s * 0.4, Art.elementColor('C'));
    } else if (i === 7) { // drop
      g.fillStyle = C.water; g.strokeStyle = dark; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(x, y - s * 1.2); g.bezierCurveTo(x + s * 0.5, y - s * 0.4, x + s, y, x + s * 0.8, y + s * 0.5);
      g.bezierCurveTo(x + s * 0.5, y + s * 1.2, x - s * 0.5, y + s * 1.2, x - s * 0.8, y + s * 0.5);
      g.bezierCurveTo(x - s, y, x - s * 0.5, y - s * 0.4, x, y - s * 1.2); g.fill(); g.stroke();
    } else if (i === 8) { // thermometer
      g.fillStyle = '#F4F0FF'; g.strokeStyle = dark; g.lineWidth = 2.2;
      Art.round(g, x - s * 0.24, y - s * 1.1, s * 0.48, s * 1.7, s * 0.24); g.fill(); g.stroke();
      g.fillStyle = C.red; g.beginPath(); g.arc(x, y + s * 0.7, s * 0.44, 0, TAU); g.fill(); g.stroke();
      g.fillRect(x - s * 0.1, y - s * 0.5, s * 0.2, s * 1.1);
    } else if (i === 9) { // orbital
      g.fillStyle = 'rgba(53,230,255,.7)';
      g.beginPath(); g.ellipse(x - s * 0.62, y, s * 0.6, s * 0.42, 0, 0, TAU); g.ellipse(x + s * 0.62, y, s * 0.6, s * 0.42, 0, 0, TAU); g.fill();
      Art.ball(g, x, y, s * 0.2, C.sun);
    } else if (i === 10) { // bond
      Art.bond(g, x - s * 0.7, y, x + s * 0.7, y, { width: 3 });
      Art.ball(g, x - s * 0.8, y, s * 0.55, Art.elementColor('O')); Art.ball(g, x + s * 0.8, y, s * 0.38, Art.elementColor('H'));
    } else if (i === 11) { // gas
      g.strokeStyle = '#BFFFE0'; g.lineWidth = 2.2; g.fillStyle = 'rgba(190,255,224,.25)';
      [[-0.6, 0.3, 0.5], [0.45, 0.45, 0.38], [0.1, -0.5, 0.6]].forEach(([a, b, r]) => { g.beginPath(); g.arc(x + a * s, y + b * s, r * s, 0, TAU); g.fill(); g.stroke(); });
    } else if (i === 12) { // crystal
      crystalCluster(g, x, y + s * 0.9, 3, s * 1.5, ['#FF7DD8', '#B28DFF', '#6FE7FF']);
    } else if (i === 13) { // exam
      g.fillStyle = '#FFFDF2'; g.strokeStyle = dark; g.lineWidth = 2.2;
      g.fillRect(x - s * 0.8, y - s, s * 1.6, s * 2); g.strokeRect(x - s * 0.8, y - s, s * 1.6, s * 2);
      g.strokeStyle = '#8878A8'; g.lineWidth = 2;
      [-0.5, -0.05, 0.4].forEach((d) => { g.beginPath(); g.moveTo(x - s * 0.5, y + d * s); g.lineTo(x + s * 0.5, y + d * s); g.stroke(); });
    }
    g.restore();
  }

  /* ---------- The surface: the night outside Moe's hole ---------- */
  let skyCanvas = null;
  function sky() {
    if (skyCanvas) return skyCanvas;
    const c = (skyCanvas = document.createElement('canvas'));
    c.width = W * 2; c.height = H * 2;
    const x = c.getContext('2d'); x.scale(2, 2);
    const d = x.createLinearGradient(0, 0, 0, H);
    d.addColorStop(0, '#0B0826'); d.addColorStop(0.55, '#231A5C'); d.addColorStop(1, '#5B3380');
    x.fillStyle = d; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 120; i++) {
      x.fillStyle = `rgba(255,250,235,${0.25 + rand(i) * 0.7})`;
      x.beginPath(); x.arc(rand(i + 5) * W, rand(i + 9) * H * 0.7, 0.5 + rand(i + 2) * 1.3, 0, TAU); x.fill();
    }
    Art.glow(x, 730, 72, 110, '#FFF3C9', 0.45);
    x.fillStyle = '#FFF6D8'; x.beginPath(); x.arc(730, 72, 34, 0, TAU); x.fill();
    x.fillStyle = 'rgba(214,196,150,.45)';
    [[718, 62, 7], [742, 84, 9], [724, 92, 4], [746, 58, 4]].forEach(([a, b, r]) => { x.beginPath(); x.arc(a, b, r, 0, TAU); x.fill(); });
    return c;
  }
  const UNDER = ['topsoil', 'clay', 'study', 'home', 'gravel', 'mine', 'water', 'warm', 'crystal', 'bedrock', 'gas', 'deep', 'bottom'];
  function surface(g, t, gy) {
    g.drawImage(sky(), 0, 0, W, H);
    for (let i = 0; i < 12; i++) {
      const q = 0.5 + 0.5 * Math.sin(t * (1 + rand(i)) + i * 2);
      g.fillStyle = `rgba(255,250,220,${q * 0.9})`;
      Art.star(g, rand(i + 70) * 640 + 10, rand(i + 80) * 150 + 8, 1.6 + q * 2.4, q);
    }
    // Far hills.
    g.fillStyle = '#231650';
    g.beginPath(); g.moveTo(0, gy);
    for (let x = 0; x <= W; x += 20) g.lineTo(x, gy - 34 - Math.sin(x * 0.006 + 1) * 26 - Math.sin(x * 0.017) * 8);
    g.lineTo(W, gy); g.closePath(); g.fill();
    g.fillStyle = '#1A2F4A';
    g.beginPath(); g.moveTo(0, gy);
    for (let x = 0; x <= W; x += 20) g.lineTo(x, gy - 14 - Math.sin(x * 0.009 + 3) * 16);
    g.lineTo(W, gy); g.closePath(); g.fill();
    // The strata, squeezed between the grass and the frame edge. They grow as the ground rises.
    const n = UNDER.length, top = gy + 12;
    UNDER.forEach((id, i) => {
      const L = LAYER[id], y = lerp(top, H + 6, i / n);
      g.fillStyle = Art.mix(L.rock, '#ffffff', 0.06);
      g.beginPath(); g.moveTo(0, H + 10);
      g.lineTo(0, y);
      for (let x = 0; x <= W + 22; x += 22) g.lineTo(x, y + wav(x, i * 2.1) * 0.45);
      g.lineTo(W + 22, H + 10); g.closePath(); g.fill();
    });
    // Grass.
    g.fillStyle = '#217A4A';
    g.beginPath(); g.moveTo(0, gy + 18);
    for (let x = 0; x <= W + 22; x += 22) g.lineTo(x, gy + 12 + Math.sin(x * 0.05) * 3);
    g.lineTo(W + 22, gy - 2); g.lineTo(0, gy - 2); g.closePath(); g.fill();
    g.fillStyle = '#2FA663';
    g.fillRect(0, gy - 6, W, 8);
    g.strokeStyle = '#49C97E'; g.lineWidth = 2.4; g.lineCap = 'round';
    g.beginPath();
    for (let i = 0; i < 90; i++) {
      const x = i * 9 + rand(i) * 6, h = 5 + rand(i + 3) * 9, sway = Math.sin(t * 1.3 + i) * 1.8;
      g.moveTo(x, gy - 4); g.quadraticCurveTo(x + sway * 0.4, gy - 4 - h * 0.6, x + sway, gy - 4 - h);
    }
    g.stroke();
  }
  function moundPath(g, x, y, s, front) {
    g.beginPath(); g.moveTo(x - 138 * s, y);
    g.bezierCurveTo(x - 110 * s, y - 28 * s, x - 86 * s, y - 56 * s, x - 56 * s, y - 62 * s);
    if (front) g.bezierCurveTo(x - 40 * s, y - 40 * s, x + 40 * s, y - 40 * s, x + 56 * s, y - 62 * s);
    else g.bezierCurveTo(x - 30 * s, y - 72 * s, x + 30 * s, y - 72 * s, x + 56 * s, y - 62 * s);
    g.bezierCurveTo(x + 86 * s, y - 56 * s, x + 110 * s, y - 28 * s, x + 138 * s, y);
    g.closePath();
  }
  /** The molehill. drawMoe runs between the back and the front so Moe stands in the hole. */
  function mound(g, x, y, s, inside) {
    const gr = g.createLinearGradient(0, y - 70 * s, 0, y);
    gr.addColorStop(0, '#7A5238'); gr.addColorStop(1, '#4A3020');
    moundPath(g, x, y, s, false);
    g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3; g.fill(); g.stroke();
    g.fillStyle = '#120818'; g.beginPath(); g.ellipse(x, y - 60 * s, 56 * s, 13 * s, 0, 0, TAU); g.fill();
    if (inside) inside();
    moundPath(g, x, y, s, true);
    g.fillStyle = gr; g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,230,200,.16)';
    for (let i = 0; i < 12; i++) { g.beginPath(); g.ellipse(x + (rand(i) - 0.5) * 190 * s, y - 8 * s - rand(i + 3) * 30 * s, (2 + rand(i + 1) * 4) * s, (1.5 + rand(i + 2) * 2.5) * s, 0, 0, TAU); g.fill(); }
  }
  function stump(g, x, y, w, h) {
    const gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    gr.addColorStop(0, '#5E3F24'); gr.addColorStop(0.5, '#8C6238'); gr.addColorStop(1, '#4A3020');
    g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(x - w / 2 - 8, y + h); g.lineTo(x + w / 2 + 8, y + h); g.lineTo(x + w / 2, y); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#C89A62'; g.beginPath(); g.ellipse(x, y, w / 2, 11, 0, 0, TAU); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(90,60,30,.7)'; g.lineWidth = 2;
    [0.7, 0.42].forEach((k) => { g.beginPath(); g.ellipse(x, y, (w / 2) * k, 11 * k, 0, 0, TAU); g.stroke(); });
  }
  /* A field of water molecules that fills the frame in the particle view. */
  const WATERS = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) WATERS.push({ x: -30 + c * 136 + (r % 2) * 68 + (rand(r * 9 + c) - 0.5) * 16, y: 46 + r * 118 + (rand(r + c * 7) - 0.5) * 16, rot: rand(r * 3 + c * 11) * TAU, seed: r * 7 + c });
  function waterField(g, t, skip) {
    WATERS.forEach((m) => {
      if (skip && Math.hypot(m.x - 400, m.y - 225) < 95) return;
      waterMol(g, m.x + wander(m.seed, t * 0.7) * 11, m.y + wander(m.seed + 40, t * 0.7) * 11, 40, m.rot + Math.sin(t * 0.5 + m.seed) * 0.45);
    });
  }
  /** The course map: every layer with its picture and the tunnel through them. p draws the tunnel on. */
  function courseMap(g, t, gy, q, p) {
    const n = UNDER.length, top = gy + 12;
    const bandH = (H - top) / n;
    const pts = [];
    for (let i = 0; i < n; i++) pts.push([400 + Math.sin(i * 1.02 + 0.5) * 300, top + bandH * (i + 0.55)]);
    A(g, q, () => {
      // The tunnel, as a smooth curve through every layer, drawn on as p grows.
      const steps = 180, last = Math.round(steps * clamp(p));
      const pos = (u) => {
        const f = u * (n - 1), i = Math.min(n - 2, Math.floor(f)), k = f - i;
        const P0 = pts[Math.max(0, i - 1)], P1 = pts[i], P2 = pts[i + 1], P3 = pts[Math.min(n - 1, i + 2)];
        const cr = (a, b0, c, d) => 0.5 * (2 * b0 + (c - a) * k + (2 * a - 5 * b0 + 4 * c - d) * k * k + (3 * b0 - a - 3 * c + d) * k * k * k);
        return [cr(P0[0], P1[0], P2[0], P3[0]), cr(P0[1], P1[1], P2[1], P3[1])];
      };
      if (last > 0) {
        g.save();
        g.lineCap = 'round'; g.lineJoin = 'round';
        const path = () => { g.beginPath(); const s0 = pos(0); g.moveTo(s0[0], s0[1]); for (let i = 1; i <= last; i++) { const q0 = pos(i / steps); g.lineTo(q0[0], q0[1]); } };
        path(); g.strokeStyle = '#0A0414'; g.lineWidth = 15; g.stroke();
        path(); g.strokeStyle = 'rgba(255,230,190,.2)'; g.lineWidth = 2; g.setLineDash([3, 9]); g.stroke();
        g.restore();
      }
      pts.forEach(([x, y], i) => {
        const qq = clamp((p * (n - 1) - i + 0.8) * 2.2);
        if (qq <= 0) return;
        at(g, x, y, ease.back(qq), () => {
          g.fillStyle = 'rgba(10,4,20,.72)';
          g.beginPath(); g.arc(0, 0, 19, 0, TAU); g.fill();
          icon(g, i + 1, 0, 0, 13, t);
        });
      });
    });
    return pts;
  }

  /* ---------- Chapters ---------- */
  const CH = [];

  /* 1. Seeing chemistry */
  CH.push({
    id: 'three', title: 'See it three ways', depth: 'The grass', layer: LAYER.surface,
    lessons: ['start'],
    exit: { x: TX, y: 356, h: 112 },
    floorY: 350,
    beats: [
      { say: "Hi! I'm <b>Moe</b>. I'm a mole, and I'm a chemist. Yes, I have heard the joke." },
      { say: 'Today we dig through all of <b>Chemistry 101</b>, from the grass to the final exam.' },
      { say: 'First, a trick. Here is water, the way you <b>see</b> it.' },
      { say: 'Zoom in. Keep going. Those are water molecules, always jiggling. That is the <b>particle view</b>.' },
      { say: 'And this is how chemists write it: <b>H₂O</b>. Two hydrogens, one oxygen. The <b>symbol view</b>.', speak: 'And this is how chemists write it: H 2 O. Two hydrogens, one oxygen. The symbol view.' },
      { say: 'See it, zoom it, write it. Same water, <b>three views</b>. Right. Claws out.' },
    ],
    exitBG(g, t) { surface(g, t, 350); mound(g, 700, 350, 0.62); },
    draw(g, b, t) {
      const mapQ = io(b, 0.92, 1.4) * (1 - io(b, 1.86, 2.2));
      const gy = b < 2 ? lerp(300, 70, mapQ) : lerp(70, 350, io(b, 1.86, 2.2));
      const zIn = ease.in(seg(b, 3.02, 3.62)), zOut = io(b, 4.96, 5.2);
      const zoomed = zIn * (1 - zOut);
      const z = lerp(1, 18, zoomed);
      const micro = seg(zoomed, 0.42, 0.86);
      const camX = lerp(400, 430, Math.min(1, zoomed * 3)), camY = lerp(225, 240, Math.min(1, zoomed * 3));
      const hillX = b < 2 ? lerp(640, 400, mapQ) : lerp(400, 700, io(b, 1.86, 2.2));
      const hillS = b < 2 ? lerp(1, 0.38, mapQ) : lerp(0.38, 0.62, io(b, 1.86, 2.2));
      const beaker = io(b, 2.0, 2.3) * (1 - io(b, 5.0, 5.2));
      if (micro < 1) {
        g.save();
        g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-camX, -camY);
        surface(g, t, gy);
        if (mapQ > 0.01) courseMap(g, t, gy, mapQ, b < 2 ? eo(b, 1.1, 1.82) : 1);
        // The hill, and Moe in it until the third line.
        const inHole = b < 2;
        mound(g, hillX, gy, hillS, () => {
          if (inHole) {
            const h = lerp(150, 58, mapQ);
            moe(g, hillX, gy - 36 * hillS, h, b < 1 ? 'wave' : 'point', { flip: false, look: b < 1 ? [0, 0.2] : [0, 1], hop: 0 });
          }
        });
        if (beaker > 0) {
          const by = gy - 62;
          A(g, beaker, () => {
            stump(g, 430, by, 150, 80);
            Art.beaker(g, 430, by, 150, 172, { level: 0.74, liquid: C.water, inside: (gg, box) => Art.bubbles(gg, box.x0 + 14, box.x1 - 14, box.bottom - 6, box.top + 8, t * 0.15, { n: 3, r: 3 }) });
          });
        }
        g.restore();
        if (b >= 2) {
          // Moe swoops out of the hole and lands on the grass by the stump.
          const q = io(b, 1.9, 2.24), x = lerp(hillX, 235, q), hh = lerp(58, 150, q);
          const lift = Math.sin(q * Math.PI) * 60;
          const m5 = io(b, 5.02, 5.3);
          A(g, 1 - micro, () => moe(g, lerp(lerp(x, TX, m5), camX + (lerp(x, TX, m5) - camX) * z, zoomed > 0 ? 1 : 0), lerp(gy + 6, camY + (gy + 6 - camY) * z, zoomed > 0 ? 1 : 0) - lift, lerp(hh, 112, m5) * z, b > 5 ? 'cheer' : 'point', { rot: q < 1 ? (1 - q) * -0.4 : 0, look: [1, 0] }));
        }
      }
      // Title card.
      const title = 1 - io(b, 0.72, 1.04);
      if (title > 0) {
        A(g, title, () => {
          const dy = (1 - title) * -24;
          big(g, 'The Mole Hole', 300, 118 + dy, { size: 78, color: '#FFD23F', haloColor: 'rgba(23,12,41,.95)' });
          label(g, 'The whole course in one sitting', 300, 180 + dy, { size: 30, color: '#fff' });
        });
        A(g, title * 0.95, () => {
          Art.atom(g, 90, 390 + wander(1, t) * 3, 30, 'C', { face: 'sleepy', t, label: false, seed: 1 });
          Art.atom(g, 196, 412 + wander(2, t) * 3, 22, 'H', { face: 'wink', t, label: false, seed: 2 });
          Art.atom(g, 708, 398 + wander(3, t) * 3, 34, 'O', { face: 'grin', t, label: false, look: [-1, 0], seed: 3 });
          Art.atom(g, 610, 416 + wander(4, t) * 3, 22, 'Na', { face: 'wow', t, label: false, seed: 4 });
        });
      }
      if (mapQ > 0.3 && b < 2.1) {
        const q = seg(mapQ, 0.5, 1);
        A(g, q, () => {
          big(g, 'Chemistry 101, top to bottom', 180, 34, { size: 26, color: '#fff' });
        });
        const fx = 400 + Math.sin(12 * 1.02 + 0.5) * 300;
        Art.pill(g, 'Final exam', fx + (fx > 400 ? -92 : 92), 426, { size: 24, font: 'display', color: C.pink, text: '#fff', alpha: seg(b, 1.62, 1.8) * (1 - seg(b, 1.86, 2)) });
      }
      if (beaker > 0.5 && zoomed < 0.1) Art.pill(g, 'What you see', 430, 64, { size: 26, font: 'display', color: C.pink, text: '#fff', alpha: seg(b, 2.22, 2.42) * (1 - seg(b, 3, 3.1)) });

      // The particle world.
      if (micro > 0) {
        A(g, micro, () => {
          Art.bg(g, W, H, 'micro', t);
          g.fillStyle = 'rgba(40,120,190,.26)'; g.fillRect(0, 0, W, H);
          const hq = io(b, 4.04, 4.34);
          const s = lerp(0.55, 1, eo(zIn, 0.5, 1));
          at(g, W / 2, H / 2, s, () => {
            g.translate(-W / 2, -H / 2);
            A(g, 1 - hq * 0.82, () => waterField(g, t, true));
            // The hero molecule.
            const ox = lerp(400, 268, hq), oy = lerp(214, 176, hq);
            const hx = lerp(30, 104, hq), hy = lerp(26, 96, hq);
            const rO = lerp(25, 68, hq), rH = lerp(18, 44, hq);
            if (hq > 0.02) A(g, hq, () => {
              Art.bond(g, ox, oy, ox - hx, oy + hy, { width: 9 });
              Art.bond(g, ox, oy, ox + hx, oy + hy, { width: 9 });
            });
            const look = hq > 0.5 ? [1, 0] : [0, 0];
            Art.atom(g, ox - hx, oy + hy, rH, 'H', { face: rH >= 18 ? 'happy' : null, t, seed: 1, look, label: hq > 0.6 ? 'H' : false });
            Art.atom(g, ox + hx, oy + hy, rH, 'H', { face: rH >= 18 ? 'happy' : null, t, seed: 2, look, label: hq > 0.6 ? 'H' : false });
            Art.atom(g, ox, oy, rO, 'O', { face: 'happy', t, seed: 3, look, label: hq > 0.6 ? 'O' : false });
          });
          Art.pill(g, 'The particle view', 400, 42, { size: 28, font: 'display', color: C.cyan, text: '#06222B', alpha: seg(b, 3.62, 3.82) * (1 - seg(b, 4.02, 4.18)) });
          const sym = seg(b, 4.28, 4.46);
          if (sym > 0) {
            Art.pill(g, 'The symbol view', 590, 52, { size: 28, font: 'display', color: C.pink, text: '#fff', alpha: sym });
            pop(g, 590, 160, sym, () => Art.formula(g, 'H2O', 590, 160, { size: 108, colorize: true, halo: true }));
            const r2 = seg(b, 4.46, 4.62), r3 = seg(b, 4.6, 4.76);
            label(g, '2 hydrogen atoms', 590, 268, { size: 30, color: '#fff', alpha: r2 });
            label(g, '1 oxygen atom', 590, 310, { size: 30, color: '#FF8A94', alpha: r3 });
          }
          moe(g, 712, 438, 104, b < 4.3 ? 'wow' : 'happy', { bubble: true, look: [-1, 0] });
        });
      }
      // Three views, side by side, over the night sky.
      const trip = seg(b, 5.04, 5.14);
      if (trip > 0) {
        const card = (i, x, title, color, fn) => {
          const q = bk(b, 5.06 + i * 0.1, 5.24 + i * 0.1);
          if (q <= 0) return;
          pop(g, x + 118, 130, seg(b, 5.06 + i * 0.1, 5.24 + i * 0.1), () => {
            win(g, x, 28, 236, 210, () => fn(x + 118, 140), { rim: color, c1: '#34205C', c2: '#160C28' });
            big(g, title, x + 118, 56, { size: 26, color });
          });
        };
        card(0, 26, 'What you see', '#FF8AC4', (cx, cy) => Art.beaker(g, cx, cy + 86, 112, 130, { level: 0.74, liquid: C.water }));
        card(1, 282, 'The particles', C.cyan, (cx, cy) => {
          [[-62, -36, 0.4], [34, -46, 2], [-22, 30, 3.8], [68, 34, 5.2], [-84, 66, 1.2]].forEach(([a, b0, r], i) => waterMol(g, cx + a + wander(i, t) * 5, cy + 16 + b0 + wander(i + 9, t) * 5, 28, r + Math.sin(t * 0.6 + i) * 0.4));
        });
        card(2, 538, 'The symbols', C.sun, (cx, cy) => Art.formula(g, 'H2O', cx, cy + 22, { size: 76, colorize: true }));
        big(g, 'Same water. Three views.', 545, 300, { size: 32, color: C.sun, alpha: seg(b, 5.4, 5.56) });
      }
    },
  });

  /* 2. Matter and measuring */
  CH.push({
    id: 'matter', title: 'Matter and measuring', depth: 'Topsoil', layer: LAYER.topsoil,
    lessons: ['matter', 'measurement', 'conversions'],
    enter: { x: 668, y: 426, h: 150 },
    exit: { x: 722, y: 426, h: 130 },
    beats: [
      { say: 'Topsoil. Everything here is <b>matter</b>: stuff with mass that takes up space.' },
      { say: '<b>Solid</b>: packed and shivering. <b>Liquid</b>: close and sliding. <b>Gas</b>: far apart and zooming. Same molecules, different energy.' },
      { say: 'Melting keeps the molecules the same: a <b>physical change</b>. Burning makes new substances: a <b>chemical change</b>.' },
      { say: 'To change units, multiply by a fraction worth exactly one, and <b>cancel</b>.' },
      { say: 'And an answer can only be as exact as your worst measurement. Those are <b>significant figures</b>.' },
    ],
    draw(g, b, t) {
      /* Beat 0: mass and space */
      const s0 = 1 - seg(b, 0.96, 1.06);
      if (s0 > 0 && b < 1.06) A(g, s0, () => {
        const drop = ease.bounce(seg(b, 0.1, 0.4));
        const top = 400 - 38;
        const rockY = lerp(100, top - 18, drop);
        A(g, seg(b, 0.02, 0.1), () => {
          Art.digitalScale(g, 176, 400, 230, drop > 0.5 ? '24.6 g' : '0.0 g', { size: 26 });
          rock(g, 176, rockY, 40);
          big(g, 'It has mass', 176, 70, { color: C.sun, alpha: seg(b, 0.32, 0.46) });
        });
        const dq = ease.in(seg(b, 0.5, 0.68));
        const level = lerp(0.4, 0.56, eo(b, 0.66, 0.84));
        A(g, seg(b, 0.42, 0.52), () => {
          const box = Art.cylinder(g, 440, 412, 96, 300, { level, liquid: C.water });
          const ry = lerp(62, box.bottom - 20, dq);
          rock(g, 440, ry, 26);
          big(g, 'It takes up space', 440, 74, { color: C.sun, alpha: seg(b, 0.72, 0.86) });
          Art.arrow(g, 504, lerp(412 - 14 - 274 * 0.4, box.surface, 1), 504, 412 - 14 - 274 * 0.4, { color: C.cyan, w: 4, both: true, head: 10, alpha: seg(b, 0.78, 0.9) });
        });
        moe(g, 668, 426, 150, 'point', { flip: true, look: [-1, 0] });
      });
      /* Beat 1: three states */
      const s1 = seg(b, 1, 1.06) * (1 - seg(b, 1.96, 2.04));
      if (s1 > 0 && b < 2.1) A(g, s1, () => {
        const X = [22, 232, 442], wW = 196, wY = 40, wH = 268, names = ['Solid', 'Liquid', 'Gas'];
        const focus = b < 1.32 ? 0 : b < 1.58 ? 1 : b < 1.82 ? 2 : -1;
        X.forEach((x, k) => {
          const on = seg(b, 1.03 + k * 0.26, 1.13 + k * 0.26);
          if (on <= 0) return;
          const cx = x + wW / 2, cy = wY + wH / 2;
          const dim = focus === -1 || focus === k ? 1 : 0.5;
          A(g, dim, () => pop(g, cx, cy, on, () => {
            win(g, x, wY, wW, wH, () => {
              if (k === 0) {
                for (let j = 0; j < 5; j++) for (let i = 0; i < 4; i++) {
                  const px = x + 32 + i * 44 + wander(i * 3 + j * 7, t * 6) * 2.4, py = wY + 40 + j * 47 + wander(i * 5 + j, t * 6) * 2.4;
                  waterMol(g, px, py, 21, (i + j) % 2 ? 0.3 : -0.3);
                }
              } else if (k === 1) {
                for (let i = 0; i < 13; i++) {
                  const px = x + 34 + (i % 4) * 44 + ((i >> 2) % 2) * 22 + wander(i + 3, t * 0.75) * 15;
                  const py = wY + 42 + Math.floor(i / 4) * 58 + wander(i + 21, t * 0.75) * 15;
                  waterMol(g, px, py, 21, rand(i) * TAU + t * 0.35 * (i % 2 ? 1 : -1));
                }
              } else {
                for (let i = 0; i < 5; i++) {
                  const px = x + 26 + (wW - 52) * tri(t * (0.31 + i * 0.043) + i * 0.71);
                  const py = wY + 26 + (wH - 52) * tri(t * (0.27 - i * 0.031) + i * 1.13 + 0.2);
                  waterMol(g, px, py, 21, t * (1.5 + i * 0.2) + i);
                }
              }
            }, { rim: focus === k ? C.sun : 'rgba(214,240,255,.75)', lw: focus === k ? 6 : 4 });
          }));
          big(g, names[k], cx, wY + wH + 26, { size: 32, alpha: on * dim, color: focus === k ? C.sun : C.ink });
        });
        const en = seg(b, 1.82, 1.92);
        Art.arrow(g, 36, 384, 624, 384, { color: C.fire, w: 9, head: 22, p: en });
        if (en > 0.3) Art.pill(g, 'Add energy', 326, 384, { size: 24, color: C.fire, text: '#1A0F2E', font: 'display', alpha: seg(en, 0.3, 1) });
        moe(g, 722, 426, 130, 'point', { flip: true, look: [-1, 0] });
      });
      /* Beat 2: physical and chemical */
      const s2 = seg(b, 2, 2.06) * (1 - seg(b, 2.96, 3.04));
      if (s2 > 0 && b < 3.1) A(g, s2, () => {
        const wY = 36, wH = 248;
        const q = io(b, 2.14, 2.42);
        win(g, 22, wY, 364, wH, () => {
          for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) {
            const k = i * 2 + j * 3;
            const nx = 74 + i * 82 + (j ? 34 : -6) + (rand(k + 2) - 0.5) * 22, ny = 150 + j * 70 + (i % 2 ? 26 : -8);
            const px = lerp(90 + i * 76, nx, q) + wander(k, t * (q > 0.5 ? 0.8 : 5)) * lerp(2.4, 8, q);
            const py = lerp(150 + j * 74, ny, q) + wander(k + 9, t * (q > 0.5 ? 0.8 : 5)) * lerp(2.4, 8, q);
            waterMol(g, px, py, 25, lerp(0.2 * ((i + j) % 2 ? 1 : -1), rand(k) * TAU + t * 0.3, q));
          }
          Art.formula(g, 'H2O -> H2O', 204, wY + 34, { size: 34, colorize: true, halo: true });
        }, { rim: C.leaf });
        big(g, 'Physical change', 204, 308, { size: 30, color: C.leaf });
        label(g, 'Melting. Still water.', 204, 346, { size: 25, color: '#fff' });
        // Right: two hydrogens and an oxygen trade partners. 4 H and 2 O on both sides.
        const rq = io(b, 2.56, 2.82);
        const appear = seg(b, 2.46, 2.56);
        A(g, appear, () => {
          win(g, 414, wY, 364, wH, () => {
            const path = (x0, y0, x1, y1, seed) => [lerp(x0, x1, rq), lerp(y0, y1, rq) + Math.sin(rq * Math.PI) * (rand(seed) - 0.5) * 70];
            const pts = {
              Oa: path(650, 176, 516, 152, 1), Ob: path(702, 176, 676, 196, 2),
              H1: path(468, 124, 474, 192, 3), H2: path(508, 124, 558, 192, 4),
              H3: path(468, 234, 634, 236, 5), H4: path(508, 234, 718, 236, 6),
            };
            const before = 1 - seg(rq, 0, 0.15), after = seg(rq, 0.85, 1);
            A(g, before, () => {
              Art.bond(g, pts.Oa[0], pts.Oa[1], pts.Ob[0], pts.Ob[1], { order: 2, width: 5 });
              Art.bond(g, pts.H1[0], pts.H1[1], pts.H2[0], pts.H2[1], { width: 5 });
              Art.bond(g, pts.H3[0], pts.H3[1], pts.H4[0], pts.H4[1], { width: 5 });
            });
            A(g, after, () => {
              Art.bond(g, pts.Oa[0], pts.Oa[1], pts.H1[0], pts.H1[1], { width: 5 });
              Art.bond(g, pts.Oa[0], pts.Oa[1], pts.H2[0], pts.H2[1], { width: 5 });
              Art.bond(g, pts.Ob[0], pts.Ob[1], pts.H3[0], pts.H3[1], { width: 5 });
              Art.bond(g, pts.Ob[0], pts.Ob[1], pts.H4[0], pts.H4[1], { width: 5 });
            });
            Art.burst(g, 596, 180, seg(rq, 0.05, 0.8), { n: 16, r: 110, size: 8 });
            ['H1', 'H2', 'H3', 'H4'].forEach((k, i) => Art.atom(g, pts[k][0], pts[k][1], 16, 'H', { label: false, seed: i }));
            Art.atom(g, pts.Oa[0], pts.Oa[1], 25, 'O', { face: rq > 0.1 && rq < 0.9 ? 'wow' : 'happy', t, seed: 1, label: false });
            Art.atom(g, pts.Ob[0], pts.Ob[1], 25, 'O', { face: rq > 0.1 && rq < 0.9 ? 'wow' : 'happy', t, seed: 2, label: false });
            Art.formula(g, '2H2 + O2 -> 2H2O', 596, wY + 34, { size: 34, colorize: true, halo: true });
          }, { rim: '#FF8AC4' });
          big(g, 'Chemical change', 596, 308, { size: 30, color: '#FF8AC4' });
          label(g, 'Burning. New substances.', 596, 346, { size: 25, color: '#fff' });
        });
        moe(g, 400, 438, 74, b < 2.5 ? 'happy' : 'wow', { look: [b < 2.5 ? -1 : 1, -0.4] });
      });
      /* Beat 3: cancel units */
      const s3 = seg(b, 3, 3.06) * (1 - seg(b, 3.96, 4.04));
      if (s3 > 0 && b < 4.1) A(g, s3, () => {
        // The tunnel, measured.
        const tp = eo(b, 3.04, 3.2);
        g.fillStyle = '#0A0414'; Art.round(g, 40, 72, 700 * tp + 20, 44, 22); g.fill();
        g.fillStyle = '#FFD23F'; g.fillRect(52, 118, 696 * tp, 15);
        g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
        for (let i = 0; i <= 25; i++) {
          const x = 52 + i * 27.84;
          if (x > 52 + 696 * tp) break;
          g.beginPath(); g.moveTo(x, 118); g.lineTo(x, i % 5 ? 126 : 133); g.stroke();
        }
        moe(g, 40 + 700 * tp, 116, 40, 'happy', { talk: false, flip: false });
        Art.pill(g, 'My tunnel: 1.25 km', 400, 52, { size: 26, font: 'display', color: C.plum2, text: '#fff', alpha: seg(b, 3.12, 3.22), stroke: C.sun });
        const yc = 262, sz = 48;
        const q1 = seg(b, 3.14, 3.24), q2 = seg(b, 3.28, 3.42), q3 = seg(b, 3.48, 3.62), q4 = seg(b, 3.66, 3.8);
        big(g, '1.25', 138, yc, { size: sz, align: 'right', alpha: q1 });
        big(g, 'km', 148, yc, { size: sz, align: 'left', alpha: q1 });
        big(g, '×', 244, yc, { size: 42, color: C.dim, alpha: q2 });
        pop(g, 360, yc, q2, () => {
          big(g, '1000', 348, yc - 40, { size: sz, align: 'right' });
          big(g, 'm', 358, yc - 40, { size: sz, align: 'left' });
          g.fillStyle = C.ink; Art.round(g, 272, yc - 3, 176, 6, 3); g.fill();
          big(g, '1', 348, yc + 40, { size: sz, align: 'right' });
          big(g, 'km', 358, yc + 40, { size: sz, align: 'left' });
        });
        Art.strike(g, 146, yc + 16, 214, yc - 16, q3, C.red, 7);
        Art.strike(g, 356, yc + 56, 424, yc + 24, q3, C.red, 7);
        big(g, '=', 484, yc, { size: 42, color: C.dim, alpha: q4 });
        big(g, '1250 m', 596, yc, { size: 54, color: C.sun, alpha: q4 });
        Art.pill(g, 'Top equals bottom, so this fraction equals 1', 330, 372, { size: 24, color: C.plum2, text: '#fff', alpha: seg(b, 3.38, 3.5) });
        moe(g, 722, 426, 110, 'point', { flip: true, look: [-1, -0.3] });
      });
      /* Beat 4: significant figures */
      const s4 = seg(b, 4, 4.06);
      if (s4 > 0) A(g, s4, () => {
        const x0 = 44, y0 = 86, wT = 230, hT = 140; // 3.456 by 2.1, to scale.
        const q0 = eo(b, 4.04, 4.18);
        g.fillStyle = 'rgba(255,210,63,.18)'; g.strokeStyle = C.sun; g.lineWidth = 4;
        g.fillRect(x0, y0, wT * q0, hT * q0); g.strokeRect(x0, y0, wT * q0, hT * q0);
        label(g, '3.456 cm', x0 + wT / 2, y0 - 22, { size: 30, alpha: seg(b, 4.12, 4.2) });
        label(g, '4 sig figs', x0 + wT / 2, y0 + 50, { size: 24, color: C.dim, alpha: seg(b, 4.28, 4.38) });
        label(g, '2.1 cm', x0 + wT + 12, y0 + hT / 2 - 8, { size: 30, align: 'left', alpha: seg(b, 4.14, 4.22) });
        label(g, '2 sig figs', x0 + wT + 12, y0 + hT / 2 + 26, { size: 24, align: 'left', color: C.sun, alpha: seg(b, 4.32, 4.42) });
        // Calculator.
        const cq = seg(b, 4.2, 4.3);
        A(g, cq, () => {
          const gr = g.createLinearGradient(0, 50, 0, 280);
          gr.addColorStop(0, '#5A4A80'); gr.addColorStop(1, '#2B1A4A');
          g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3.5;
          Art.round(g, 452, 44, 196, 230, 18); g.fill(); g.stroke();
          g.fillStyle = '#0F2A1E'; Art.round(g, 466, 58, 168, 62, 10); g.fill();
          Art.text(g, '7.2576', 624, 90, { font: 'display', size: 46, align: 'right', color: '#6CFFAF' });
          for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) {
            g.fillStyle = (i === 3) ? C.pink : '#CFC6E4'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2;
            Art.round(g, 468 + i * 41, 136 + j * 44, 33, 34, 8); g.fill(); g.stroke();
          }
        });
        // Rounding on the line below.
        const r1 = seg(b, 4.42, 4.52), r2 = seg(b, 4.56, 4.7), r3 = seg(b, 4.7, 4.82);
        big(g, '7.2576', 150, 330, { size: 52, alpha: r1 });
        Art.strike(g, 44, 348, 256, 312, r2, C.red, 7);
        Art.arrow(g, 276, 330, 362, 330, { color: C.sun, w: 7, p: r3 });
        big(g, '7.3 cm²', 480, 330, { size: 60, color: C.sun, alpha: r3 });
        label(g, '2 sig figs, the fewest going in', 330, 394, { size: 26, color: C.leaf, alpha: seg(b, 4.78, 4.9) });
        moe(g, 722, 426, 130, b > 4.7 ? 'cheer' : 'think', { flip: true, look: [-1, 0] });
      });
    },
  });

  /* 3. Inside the atom */
  CH.push({
    id: 'atom', title: 'Inside the atom', depth: 'Clay', layer: LAYER.clay,
    lessons: ['atoms', 'isotopes'],
    enter: { x: 690, y: 426, h: 130 },
    exit: { x: 712, y: 426, h: 130 },
    beats: [
      { say: 'Clay. Zoom into anything and you reach <b>atoms</b>. This one is carbon.' },
      { say: 'Positive <b>protons</b> and neutral <b>neutrons</b> huddle in the nucleus, with almost all the mass. Tiny, negative <b>electrons</b> zip around it.' },
      { say: 'Rutherford fired alpha particles at gold foil. Most flew straight through. A few <b>bounced back</b>! So an atom is mostly empty, around a tiny, dense center.' },
      { say: 'If the nucleus were a marble, the atom would be a stadium. You are mostly empty space too. Try not to take it personally.' },
      { say: 'Protons set the <b>element</b>: six is always carbon. Change the neutrons and you get an <b>isotope</b>.' },
    ],
    draw(g, b, t) {
      const lump = (x, y, s) => {
        const gr = g.createLinearGradient(x - s, y - s, x + s, y + s);
        gr.addColorStop(0, '#6A7382'); gr.addColorStop(1, '#2C313C');
        g.fillStyle = gr; g.strokeStyle = '#100820'; g.lineWidth = 3;
        g.beginPath();
        [[-1, 0.7], [-1.08, -0.1], [-0.6, -0.72], [0.2, -0.86], [0.92, -0.42], [1.02, 0.7]].forEach(([a, c], i) => { if (i) g.lineTo(x + a * s, y + c * s); else g.moveTo(x + a * s, y + c * s); });
        g.closePath(); g.fill(); g.stroke();
        g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 2.5;
        g.beginPath(); g.moveTo(x - 0.6 * s, y - 0.72 * s); g.lineTo(x - 0.3 * s, y + 0.1 * s); g.lineTo(x + 0.2 * s, y - 0.86 * s); g.moveTo(x - 0.3 * s, y + 0.1 * s); g.lineTo(x + 0.5 * s, y + 0.7 * s); g.stroke();
      };
      /* Beat 0 and 1: from a lump to the nucleus. */
      const aOut = 1 - seg(b, 1.94, 2.02);
      if (b < 2.02) A(g, aOut, () => {
        const z1 = ease.in(seg(b, 0.16, 0.5));
        const lumpZ = lerp(1, 9, z1);
        const gridA = seg(b, 0.34, 0.5);
        const heroQ = io(b, 0.54, 0.86); // Grow one atom until it opens up.
        if (gridA < 1) {
          at(g, 360, 290, lumpZ, () => lump(0, 0, 90));
          A(g, 1 - z1, () => label(g, 'A lump of charcoal', 360, 402, { size: 26 }));
        }
        if (gridA > 0) A(g, gridA * (1 - seg(heroQ, 0.7, 1)), () => {
          const s0 = lerp(0.42, 1, eo(b, 0.34, 0.54)) * lerp(1, 7, ease.in(heroQ));
          g.save(); g.translate(360, 232); g.scale(s0, s0);
          for (let j = -3; j <= 3; j++) for (let i = -4; i <= 4; i++) {
            const x = (i + (j % 2 ? 0.5 : 0)) * 92 + wander(i * 3 + j, t * 2) * 2.2, y = j * 80 + wander(i + j * 5, t * 2) * 2.2;
            const hero = i === 0 && j === 0;
            Art.atom(g, x, y, 34, 'C', { face: hero ? 'happy' : null, t, label: false, seed: 1 });
          }
          g.restore();
        });
        const cx = lerp(360, 276, io(b, 0.92, 1.1));
        const ring = seg(heroQ, 0.6, 1);
        atomRings(g, cx, 228, 1, t, { a: ring, glow: b > 1 ? seg(b, 1.5, 1.7) : 0.4 });
        if (ring > 0 && b < 1) {
          const la = ring * (1 - seg(b, 0.9, 0.96));
          big(g, 'Carbon', cx, 42, { size: 36, color: C.sun, alpha: la });
          label(g, 'A simplified model, not to scale', cx, 410, { size: 22, color: C.dim, alpha: la });
        }
        /* Name the parts. */
        const rows = [
          { y: 86, name: 'Proton', sub: '+1 charge, about 1 u', col: '#FF9AA4', d: 1.06, kind: 'p' },
          { y: 196, name: 'Neutron', sub: 'no charge, about 1 u', col: '#D5CFE0', d: 1.22, kind: 'n' },
          { y: 306, name: 'Electron', sub: '−1 charge, tiny mass', col: C.electron, d: 1.56, kind: 'e' },
        ];
        rows.forEach((r) => {
          const q = seg(b, r.d, r.d + 0.1);
          if (q <= 0) return;
          pop(g, 512, r.y, q, () => {
            if (r.kind === 'p') { Art.ball(g, 512, r.y, 30, C.proton); Art.face(g, 512, r.y - 2, 30, 'grin', { t, look: [-1, 0], seed: 1 }); }
            else if (r.kind === 'n') { Art.ball(g, 512, r.y, 30, C.neutron); Art.face(g, 512, r.y - 2, 30, 'sleepy', { t, seed: 2 }); }
            else { Art.glow(g, 512, r.y, 40, C.electron, 0.5); Art.ball(g, 512, r.y, 22, C.electron); Art.face(g, 512, r.y - 1, 22, 'wow', { t, look: [-1, 0], seed: 3 }); }
          });
          big(g, r.name, 556, r.y - 15, { size: 30, align: 'left', color: r.col, alpha: q });
          label(g, r.sub, 556, r.y + 19, { size: 23, align: 'left', alpha: q });
          const to = r.kind === 'e' ? [cx + 104, 228 + 106] : [cx + 26, 228 + (r.kind === 'p' ? -18 : 14)];
          Art.arrow(g, 478, r.y, to[0], to[1], { color: r.col, w: 4, p: seg(b, r.d + 0.03, r.d + 0.14), curve: r.kind === 'e' ? -10 : 0, alpha: 0.85 });
        });
        if (b > 1.34) Art.pill(g, 'Almost all the mass', cx + 8, 408, { size: 24, font: 'display', color: C.sun, text: '#1A0F2E', alpha: seg(b, 1.36, 1.46) });
        const mw = walk(b, 0.92, 1.08, 690, 66, 5);
        moe(g, mw.x, 426, lerp(130, 104, io(b, 0.92, 1.08)), b < 1 ? 'wow' : 'point', { hop: mw.hop, flip: b < 0.95, look: b < 1 ? [-1, 0] : [1, -0.8] });
      });
      /* Beat 2: gold foil */
      const s2 = seg(b, 2, 2.06) * (1 - seg(b, 2.96, 3.04));
      if (s2 > 0 && b < 3.1) A(g, s2, () => {
        const fx = 430;
        const nucs = [84, 186, 288];
        nucs.forEach((y) => {
          g.fillStyle = 'rgba(255,200,61,.1)'; g.strokeStyle = 'rgba(255,200,61,.35)'; g.lineWidth = 2;
          g.beginPath(); g.arc(fx, y, 50, 0, TAU); g.fill(); g.stroke();
        });
        // Source.
        const gr = g.createLinearGradient(0, 180, 0, 290);
        gr.addColorStop(0, '#6F6B8E'); gr.addColorStop(1, '#3A3656');
        g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
        Art.round(g, 30, 48, 64, 262, 14); g.fill(); g.stroke();
        big(g, 'α', 62, 178, { size: 44, color: '#FF8AC4' });
        // Fourteen go straight through; three get close to a nucleus.
        const ys = [62, 104, 130, 150, 168, 208, 226, 244, 262, 306];
        const rays = ys.map((y) => ({ y, kind: 0 }));
        rays.push({ y: 186, kind: 2 }, { y: 84, kind: 2, ph: 0.5 }, { y: 277, kind: 1, ang: -0.6 }, { y: 298, kind: 1, ang: 0.62 });
        const started = seg(b, 2.05, 2.12);
        rays.forEach((r, i) => {
          const speed = 620, cycle = 1.5;
          const ph = ((t / cycle + (r.ph === undefined ? rand(i * 3 + 1) : r.ph)) % 1);
          const s = ph * 900; // Distance traveled along the path.
          const hit = fx - 94;
          let x, y, tx, ty;
          if (s < hit) { x = 94 + s; y = r.y; tx = 94 + Math.max(0, s - 56); ty = r.y; }
          else {
            const after = s - hit;
            const ang = r.kind === 0 ? 0 : r.kind === 1 ? r.ang : Math.PI;
            x = fx + Math.cos(ang) * after; y = r.y + Math.sin(ang) * after;
            const tr = Math.max(0, after - 56);
            tx = fx + Math.cos(ang) * tr; ty = r.y + Math.sin(ang) * tr;
          }
          void speed;
          if (x > W + 10 || x < 96 || y < -10 || y > H + 10) return;
          const col = r.kind === 0 ? '#FF8AC4' : r.kind === 1 ? C.sun : C.red;
          A(g, started, () => {
            g.strokeStyle = Art.alpha(col, 0.5); g.lineWidth = 3;
            g.beginPath(); g.moveTo(tx, ty); g.lineTo(x, y); g.stroke();
            Art.ball(g, x, y, 7, col);
          });
        });
        nucs.forEach((y) => { Art.glow(g, fx, y, 18, '#FFC83D', 0.8); Art.ball(g, fx, y, 6, '#FFC83D'); });
        big(g, 'Gold foil', fx, 34, { size: 26, color: '#FFC83D', alpha: seg(b, 2.04, 2.14) });
        const r1 = seg(b, 2.3, 2.4), r2 = seg(b, 2.46, 2.56);
        panel(g, 508, 58, 262, 52, { a: r1 });
        big(g, 'Most go straight through', 639, 84, { size: 22, color: C.leaf, alpha: r1 });
        panel(g, 110, 40, 262, 52, { a: r2 });
        big(g, 'A few bounce back!', 241, 66, { size: 26, color: C.red, alpha: r2 });
        const r3 = seg(b, 2.72, 2.84);
        panel(g, 500, 336, 270, 82, { a: r3 });
        big(g, 'Mostly empty space', 635, 359, { size: 26, color: C.sun, alpha: r3 });
        big(g, 'A tiny, dense center', 635, 394, { size: 24, alpha: r3 });
        label(g, 'Bounces shown far more often than real', 336, 372, { size: 22, color: C.dim, alpha: r2 });
        moe(g, 70, 430, 112, 'wow', { look: [1, -0.5] });
      });
      /* Beat 3: marble in a stadium */
      const s3 = seg(b, 3, 3.06) * (1 - seg(b, 3.96, 4.04));
      if (s3 > 0 && b < 4.1) A(g, s3, () => {
        const cx = 340, cy = 226;
        const rq = eo(b, 3.04, 3.3);
        at(g, cx, cy, lerp(0.85, 1, rq), () => {
          g.translate(-cx, -cy);
          [[300, 176, '#544A70'], [278, 160, '#6A5F8C'], [254, 144, '#544A70'], [230, 128, '#6A5F8C'], [206, 112, '#3C7A50']].forEach(([rx, ry, col]) => {
            g.fillStyle = col; g.strokeStyle = 'rgba(16,6,34,.5)'; g.lineWidth = 2;
            g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.fill(); g.stroke();
          });
          g.strokeStyle = 'rgba(255,255,255,.65)'; g.lineWidth = 3;
          g.beginPath(); g.ellipse(cx, cy, 186, 96, 0, 0, TAU); g.stroke();
          g.beginPath(); g.moveTo(cx, cy - 96); g.lineTo(cx, cy + 96); g.stroke();
          g.beginPath(); g.arc(cx, cy, 34, 0, TAU); g.stroke();
          for (let i = 0; i < 26; i++) {
            const a = rand(i + 3) * TAU, k = 0.84 + rand(i + 4) * 0.14;
            g.fillStyle = ['#FF8AC4', '#FFD23F', '#7FE3FF', '#fff'][i % 4];
            g.beginPath(); g.arc(cx + Math.cos(a) * 300 * k, cy + Math.sin(a) * 176 * k, 2.6, 0, TAU); g.fill();
          }
        });
        const mp = seg(b, 3.16, 3.3);
        A(g, mp, () => {
          Art.ring(g, cx, cy, 16 + Math.sin(t * 4) * 3, { color: C.sun, w: 4 });
          Art.ball(g, cx, cy, 5, '#7FE3FF');
          for (let i = 0; i < 3; i++) {
            const a = t * (0.5 + i * 0.1) + i * 2.1;
            Art.electron(g, cx + Math.cos(a) * 262, cy + Math.sin(a) * 150, 6);
          }
        });
        big(g, 'The nucleus: a marble', cx, 176, { size: 26, color: C.sun, alpha: mp });
        Art.arrow(g, cx, 192, cx, cy - 20, { color: C.sun, w: 4, p: mp });
        big(g, 'The atom: the whole stadium', 340, 28, { size: 28, color: '#fff', alpha: seg(b, 3.3, 3.4) });
        moe(g, 712, 426, 146, b > 3.5 ? 'oops' : 'happy', { flip: true, look: [-1, 0] });
      });
      /* Beat 4: protons set the element */
      const s4 = seg(b, 4, 4.06);
      if (s4 > 0) A(g, s4, () => {
        const items = [
          { x: 112, p: 6, n: 6, sym: 'C', name: 'Carbon-12', d: 4.08 },
          { x: 322, p: 6, n: 8, sym: 'C', name: 'Carbon-14', d: 4.56 },
          { x: 544, p: 7, n: 7, sym: 'N', name: 'Nitrogen-14', d: 4.78 },
        ];
        items.forEach((it) => {
          const q = seg(b, it.d, it.d + 0.1);
          if (q <= 0) return;
          pop(g, it.x, 116, q, () => {
            Art.atom(g, it.x, 96, 44, it.sym, { face: 'happy', t, seed: it.p + it.n, look: [0, 0.4] });
            nucleus(g, it.x, 214, 11, it.p, it.n, t);
          });
          big(g, it.name, it.x, 288, { size: 28, color: it.sym === 'C' ? C.ink : '#8FB0FF', alpha: q });
          label(g, `${it.p} protons`, it.x, 322, { size: 24, color: '#FF9AA4', alpha: q });
          label(g, `${it.n} neutrons`, it.x, 352, { size: 24, color: '#D5CFE0', alpha: q });
        });
        const iso = seg(b, 4.68, 4.8);
        A(g, iso, () => {
          g.strokeStyle = C.leaf; g.lineWidth = 4; g.lineCap = 'round';
          g.beginPath(); g.moveTo(44, 376); g.lineTo(44, 390); g.lineTo(390, 390); g.lineTo(390, 376); g.stroke();
          big(g, 'Isotopes: the same element', 217, 412, { size: 26, color: C.leaf });
        });
        const nq = seg(b, 4.86, 4.96);
        big(g, 'One more proton:', 544, 392, { size: 24, color: C.pink, alpha: nq });
        big(g, 'a new element', 544, 420, { size: 24, color: C.pink, alpha: nq });
        moe(g, 712, 426, 130, b > 4.8 ? 'wow' : 'point', { flip: true, look: [-1, -0.4] });
      });
    },
  });

  /* 4. The periodic table */
  const FAM = { 'Alkali metal': '#FF7DBE', 'Alkaline earth metal': '#FFAE5C', 'Transition metal': '#9CA8FF', 'Post-transition metal': '#7FD6C2', Metalloid: '#B5E36B', Nonmetal: '#FFE27A', Halogen: '#5FE39C', 'Noble gas': '#7FE3FF', Lanthanide: '#D3B8FF', Actinide: '#E0A8E8' };
  const PT = { x0: 16, y0: 36, tw: 38, th: 40 };
  function ptTile(e) {
    const f = e.y >= 9;
    return { x: PT.x0 + (e.x - 1) * PT.tw, y: f ? 326 + (e.y - 9) * 25 : PT.y0 + (e.y - 1) * PT.th, w: PT.tw - 3, h: f ? 22 : PT.th - 3, f };
  }
  function ptable(g, fn) {
    g.save();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    window.ELEMENTS.forEach((e) => {
      const st = fn(e);
      if (!st || st.a <= 0.003) return;
      const b = ptTile(e);
      g.globalAlpha = st.a;
      g.fillStyle = st.color || FAM[e.family] || '#BBB';
      Art.round(g, b.x, b.y, b.w, b.h, 6); g.fill();
      if (st.stroke) { g.strokeStyle = st.stroke; g.lineWidth = 2.5; g.stroke(); }
      if (!b.f) {
        g.font = `400 20px ${Art.FONT_DISPLAY}`;
        g.fillStyle = st.ink || '#1A0F2E';
        g.fillText(st.text || e.sym, b.x + b.w / 2, b.y + b.h / 2 + 1);
      }
    });
    g.restore();
  }
  /** An atom with its outer shell: n electrons in 8 slots. */
  function shell(g, cx, cy, R, n, t, o = {}) {
    A(g, o.a === undefined ? 1 : o.a, () => {
      g.strokeStyle = 'rgba(53,230,255,.42)'; g.lineWidth = 2.5;
      g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();
      const rot = (o.rot === undefined ? t * 0.35 : o.rot);
      for (let i = 0; i < 8; i++) {
        const an = rot + (i / 8) * TAU;
        if (i < n) Art.electron(g, cx + Math.cos(an) * R, cy + Math.sin(an) * R, 7.5);
        else if (o.slots) {
          g.strokeStyle = 'rgba(247,242,255,.7)'; g.lineWidth = 2; g.setLineDash([3, 4]);
          g.beginPath(); g.arc(cx + Math.cos(an) * R, cy + Math.sin(an) * R, 8.5, 0, TAU); g.stroke(); g.setLineDash([]);
        }
      }
    });
  }
  CH.push({
    id: 'table', title: 'The periodic table', depth: 'Deep clay', layer: LAYER.study,
    lessons: ['periodic-intro', 'compounds', 'naming'],
    enter: { x: 745, y: 426, h: 118, flip: true },
    exit: { x: 745, y: 426, h: 118 },
    beats: [
      { say: '<b>Mendeleev</b> sorted the elements by mass and behavior, and left gaps for ones nobody had found yet. Then they turned up.' },
      { say: 'Columns are <b>groups</b>, which act like families. Rows are <b>periods</b>.' },
      { say: '<b>Alkali metals</b> want to lose one electron. <b>Halogens</b> want to gain one. <b>Noble gases</b> are full, and want nothing.' },
      { say: 'So sodium hands an electron to chlorine. Opposites attract, and that is <b>table salt</b>.' },
    ],
    draw(g, b, t) {
      const known = (e) => e.family !== 'Noble gas' && (e.year === 'Ancient' || !(+e.year > 1869));
      /* Beats 0 and 1: the table itself. */
      const tb = 1 - seg(b, 1.94, 2.02);
      if (tb > 0 && b < 2.02) A(g, tb, () => {
        const sweep = eo(b, 0.03, 0.42) * 118;
        const fillQ = seg(b, 0.72, 0.92);
        const col17 = seg(b, 1.08, 1.2), row3 = seg(b, 1.5, 1.62);
        ptable(g, (e) => {
          const on = clamp((sweep - e.z) / 5);
          if (b < 1) {
            if (e.sym === 'Ga' || e.sym === 'Ge') {
              const known2 = seg(b, 0.72, 0.8);
              return { a: Math.max(on, known2), color: known2 > 0.5 ? (FAM[e.family]) : '#3A2750', text: known2 > 0.5 ? e.sym : '?', ink: known2 > 0.5 ? '#1A0F2E' : C.sun, stroke: C.sun };
            }
            if (known(e)) return { a: on };
            return { a: Math.max(on * 0.2, fillQ), color: fillQ > 0.1 ? FAM[e.family] : '#3A2750', ink: fillQ > 0.5 ? '#1A0F2E' : 'rgba(247,242,255,.34)' };
          }
          const hl = (e.x === 17 && e.y <= 7 ? col17 : 0) + (e.y === 3 ? row3 : 0);
          return { a: 0.28 + 0.72 * Math.max(clamp(hl), 1 - seg(b, 1, 1.08)), stroke: hl > 0.5 ? '#fff' : null };
        });
        const n1 = seg(b, 0.08, 0.2) * (1 - seg(b, 0.96, 1.02));
        big(g, 'Mendeleev, 1869', 282, 58, { size: 32, color: C.sun, alpha: n1 });
        label(g, 'Known then: lit up', 282, 96, { size: 25, alpha: n1 * (1 - seg(b, 0.7, 0.8)) });
        const gap = seg(b, 0.42, 0.52) * (1 - seg(b, 0.66, 0.74));
        const ga = ptTile({ x: 13, y: 4 });
        if (gap > 0) {
          label(g, 'Two gaps! Unknown, for now', 282, 134, { size: 25, color: C.sun, alpha: gap });
          Art.arrow(g, 440, 148, ga.x + 2, ga.y + 8, { color: C.sun, w: 4, alpha: gap, curve: -8 });
        }
        const found = seg(b, 0.78, 0.88) * (1 - seg(b, 0.96, 1.02));
        label(g, 'They turned up!', 282, 134, { size: 26, color: C.leaf, alpha: found });
        Art.pill(g, 'Groups go down', 560, 56, { size: 24, font: 'display', color: C.plum2, text: '#fff', stroke: '#fff', alpha: col17 });
        if (col17 > 0) Art.arrow(g, 644, 58, 644, 96, { color: '#fff', w: 5, p: col17 });
        Art.pill(g, 'Periods go across', 282, 136 - 2, { size: 24, font: 'display', color: C.plum2, text: '#fff', stroke: '#fff', alpha: row3 });
        moe(g, 745, 426, 118, b < 1 ? 'happy' : 'point', { flip: true, look: [-1, -0.6] });
      });
      /* Beat 2: three families. */
      const s2 = seg(b, 2, 2.08) * (1 - seg(b, 2.94, 3.02));
      if (s2 > 0 && b < 3.1) A(g, s2, () => {
        const cards = [
          { x: 122, title: 'Alkali metals', sym: 'Na', n: 1, R: 76, face: 'sad', l1: '1 outer electron', l2: 'Wants to lose it', col: '#FF7DBE', d: 2.04 },
          { x: 356, title: 'Halogens', sym: 'Cl', n: 7, R: 76, face: 'grumpy', l1: '7 outer electrons', l2: 'Wants 1 more', col: '#5FE39C', d: 2.34 },
          { x: 590, title: 'Noble gases', sym: 'Ne', n: 8, R: 76, face: 'sleepy', l1: '8 outer electrons', l2: 'Full. No thanks.', col: '#7FE3FF', d: 2.62 },
        ];
        cards.forEach((c) => {
          const q = seg(b, c.d, c.d + 0.1);
          if (q <= 0) return;
          pop(g, c.x, 180, q, () => {
            panel(g, c.x - 108, 40, 216, 362, { stroke: c.col, lw: 3.5 });
            big(g, c.title, c.x, 72, { size: 28, color: c.col });
            shell(g, c.x, 184, c.R, c.n, t, { slots: c.n === 7 });
            Art.atom(g, c.x, 184, 42, c.sym, { face: c.face, t, seed: c.n, look: c.n === 1 ? [0.6, 0] : [0, 0] });
            label(g, c.l1, c.x, 298, { size: 23, color: '#fff' });
            big(g, c.l2, c.x, 344, { size: 24, color: c.col });
          });
        });
        moe(g, 745, 426, 110, 'point', { flip: true, look: [-1, -0.6] });
      });
      /* Beat 3: sodium gives chlorine an electron. */
      const s3 = seg(b, 3, 3.08);
      if (s3 > 0) A(g, s3, () => {
        const tr = io(b, 3.1, 3.42), meet = io(b, 3.5, 3.72);
        const cy = 170;
        const naX = lerp(108, 182, meet), clX = lerp(420, 288, meet);
        const naR = lerp(44, 32, seg(tr, 0.7, 1)), clR = lerp(46, 54, seg(tr, 0.7, 1));
        const done = tr >= 1;
        shell(g, clX, cy, 96, done ? 8 : 7, t, { rot: Math.PI / 8 + (done ? 0 : 0), slots: true, a: 1 - meet });
        // The traveling electron arcs from sodium's ring to chlorine's empty slot.
        const naR2 = 84;
        shell(g, naX, cy, naR2, 0, t, { a: 1 - seg(tr, 0.3, 0.8) });
        if (tr < 1 && tr > 0 || b < 3.1) {
          const fx = naX + naR2, fy = cy;
          const an = Math.PI / 8 + (7 / 8) * TAU;
          const tx = clX + Math.cos(an) * 96, ty = cy + Math.sin(an) * 96;
          const ex = lerp(fx, tx, tr), ey = lerp(fy, ty, tr) - Math.sin(tr * Math.PI) * 44;
          Art.electron(g, ex, ey, 9);
          label(g, 'e⁻', ex, ey - 26, { size: 24, color: C.electron });
        }
        Art.atom(g, naX, cy, naR, 'Na', { face: done ? 'happy' : 'sad', t, seed: 3, look: [1, 0], charge: done ? '+' : null });
        Art.atom(g, clX, cy, clR, 'Cl', { face: done ? 'grin' : 'grumpy', t, seed: 4, look: [-1, 0], charge: done ? '-' : null });
        Art.burst(g, (naX + clX) / 2, cy, seg(b, 3.68, 3.86), { n: 14, r: 90 });
        const f = seg(b, 3.7, 3.82);
        pop(g, 235, 280, f, () => Art.formula(g, 'NaCl', 235, 280, { size: 64, colorize: true, halo: true }));
        label(g, 'Na⁺ and Cl⁻ stick together', 235, 340, { size: 24, alpha: f });
        const lat = seg(b, 3.74, 3.88);
        if (lat > 0) pop(g, 560, 170, lat, () => {
          win(g, 442, 44, 236, 262, () => {
            for (let j = 0; j < 6; j++) for (let i = 0; i < 5; i++) {
              const na = (i + j) % 2 === 0, x = 470 + i * 46, y = 66 + j * 44;
              Art.atom(g, x + wander(i * 3 + j, t * 4) * 1.2, y + wander(i + j * 3, t * 4) * 1.2, na ? 15 : 22, na ? 'Na' : 'Cl', { label: false });
            }
          }, { rim: C.cyan });
          big(g, 'Table salt', 560, 340, { size: 32, color: C.sun });
        });
        moe(g, 745, 426, 118, b > 3.7 ? 'cheer' : 'wow', { flip: true, look: [-1, -0.5] });
      });
    },
  });

  /* 5. The mole */
  function egg(g, x, y, r) {
    const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.5, r * 0.1, x, y, r * 1.3);
    gr.addColorStop(0, '#FFFDF6'); gr.addColorStop(0.7, '#F6E7CC'); gr.addColorStop(1, '#C9AE86');
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(x, y - r * 1.28);
    g.bezierCurveTo(x + r * 0.78, y - r * 1.28, x + r, y - r * 0.2, x + r, y + r * 0.1);
    g.bezierCurveTo(x + r, y + r * 0.72, x + r * 0.56, y + r, x, y + r);
    g.bezierCurveTo(x - r * 0.56, y + r, x - r, y + r * 0.72, x - r, y + r * 0.1);
    g.bezierCurveTo(x - r, y - r * 0.2, x - r * 0.78, y - r * 1.28, x, y - r * 1.28);
    g.fill();
  }
  function spoon(g, x, y, s, fill) {
    g.save(); g.translate(x, y);
    g.fillStyle = '#C9C7DB'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    Art.round(g, 92 * s, -9 * s, 210 * s, 18 * s, 9 * s); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(0, 0, 112 * s, 66 * s, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = '#8F8DA6'; g.beginPath(); g.ellipse(0, 0, 98 * s, 54 * s, 0, 0, TAU); g.fill();
    if (fill > 0) {
      const w = g.createLinearGradient(0, -50 * s, 0, 50 * s);
      w.addColorStop(0, '#7FD8FF'); w.addColorStop(1, '#2B8FD8');
      g.fillStyle = w; g.beginPath(); g.ellipse(0, 3 * s, 92 * s * fill, 48 * s * fill, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(-30 * s, -18 * s, 26 * s * fill, 8 * s * fill, -0.3, 0, TAU); g.fill();
    }
    g.restore();
  }
  function frontDoor(x, s) {
    const fx = 92, fy = FLOOR(92, s);
    x.fillStyle = '#2C1730'; x.beginPath(); x.arc(fx, fy - 74, 82, 0, TAU); x.fill();
    const d = x.createRadialGradient(fx - 16, fy - 92, 6, fx, fy - 74, 74);
    d.addColorStop(0, '#A86B3C'); d.addColorStop(1, '#6E3F22');
    x.fillStyle = d; x.strokeStyle = '#1A0F2E'; x.lineWidth = 4;
    x.beginPath(); x.arc(fx, fy - 74, 70, 0, TAU); x.fill(); x.stroke();
    x.strokeStyle = 'rgba(30,14,10,.45)'; x.lineWidth = 3;
    for (let i = -2; i <= 2; i++) { const dx = i * 24, dy = Math.sqrt(4900 - dx * dx) - 4; x.beginPath(); x.moveTo(fx + dx, fy - 74 - dy); x.lineTo(fx + dx, fy - 74 + dy); x.stroke(); }
    x.fillStyle = '#FFD23F'; x.strokeStyle = '#1A0F2E'; x.beginPath(); x.arc(fx + 44, fy - 72, 8, 0, TAU); x.fill(); x.stroke();
    x.fillStyle = 'rgba(255,200,110,.9)'; x.beginPath(); x.arc(fx, fy - 104, 18, 0, TAU); x.fill(); x.stroke();
  }
  function island(g, x, y, w, color) {
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(x, y + 36, w * 0.58, 15, 0, 0, TAU); g.fill();
    const d = g.createLinearGradient(0, y - 18, 0, y + 40);
    d.addColorStop(0, '#6B4A32'); d.addColorStop(1, '#3B2A22');
    g.fillStyle = d;
    g.beginPath(); g.moveTo(x - w * 0.56, y - 2); g.quadraticCurveTo(x - w * 0.4, y + 44, x, y + 40); g.quadraticCurveTo(x + w * 0.4, y + 44, x + w * 0.56, y - 2); g.closePath(); g.fill();
    g.fillStyle = color; g.beginPath(); g.ellipse(x, y - 3, w * 0.56, 19, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,.26)'; g.beginPath(); g.ellipse(x - w * 0.14, y - 8, w * 0.28, 6, 0, 0, TAU); g.fill();
  }
  function plank(g, x1, x2, y, p) {
    const steps = 9, sag = 16;
    g.strokeStyle = '#D9C9A8'; g.lineWidth = 3.4;
    g.beginPath(); g.moveTo(x1, y); g.quadraticCurveTo((x1 + x2) / 2, y + sag * 2, x2, y); g.stroke();
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      if (u > p) break;
      const x = lerp(x1, x2, u), yy = y + 4 * sag * u * (1 - u);
      g.fillStyle = i % 2 ? '#A97F58' : '#8E6A48';
      Art.round(g, x - 8, yy - 3, 17, 9, 3); g.fill();
    }
  }
  CH.push({
    id: 'mole', title: 'The mole', depth: 'Mole country', layer: LAYER.home,
    lessons: ['mole', 'composition'],
    enter: { x: 440, y: 426, h: 170 },
    exit: { x: 650, y: 276, h: 96 },
    beats: [
      { say: 'Mole country. Home. This one is personal.' },
      { say: 'A <b>mole</b> is a counting word, like dozen, but much bigger: <b>6.022 × 10²³</b>.', speak: 'A mole is a counting word, like dozen, but much bigger: 6.022 times ten to the twenty third.' },
      { say: 'A mole of marbles would bury the Earth. A mole of water is <b>18 grams</b>, about a tablespoon.' },
      { say: 'Add up the atomic masses and you get the mass of one mole. Water is <b>18.02 grams per mole</b>.' },
      { say: 'That is your <b>bridge</b>: grams to moles to particles. Nearly every problem crosses it.' },
    ],
    draw(g, b, t) {
      /* Beat 0: home sweet home. */
      if (b < 1.1) A(g, 1 - seg(b, 0.94, 1.04), () => {
        const q = bk(b, 0.08, 0.3);
        at(g, 440, 148, Math.max(0.01, q), () => {
          big(g, 'Mole country', 0, 0, { size: 62, color: C.sun });
          label(g, 'Population: 6.022 × 10²³', 0, 56, { size: 30, color: '#fff' });
        });
        moe(g, 440, 426, 170, 'wave', { look: [0, 0.2] });
      });
      /* Beat 1: a counting word. */
      const s1 = seg(b, 1, 1.05) * (1 - seg(b, 1.96, 2.03));
      if (s1 > 0 && b < 2.1) A(g, s1, () => {
        big(g, '1 dozen = 12', 350, 62, { size: 42, alpha: seg(b, 1.04, 1.12) });
        for (let i = 0; i < 12; i++) {
          const q = seg(b, 1.08 + i * 0.015, 1.14 + i * 0.015);
          if (q > 0) pop(g, 97 + i * 46, 124, q, () => egg(g, 97 + i * 46, 124, 19));
        }
        big(g, '1 mole =', 350, 186, { size: 42, color: '#FF8AC4', alpha: seg(b, 1.32, 1.4) });
        const digits = '602,200,000,000,000,000,000,000';
        g.font = `400 36px ${Art.FONT_DISPLAY}`;
        const total = g.measureText(digits).width;
        const shown = Math.floor(digits.length * eo(b, 1.38, 1.72));
        if (shown > 0) big(g, digits.slice(0, shown), 350 - total / 2, 246, { size: 36, align: 'left', color: '#fff' });
        const pq = seg(b, 1.72, 1.84);
        if (pq > 0) pop(g, 350, 322, pq, () => {
          g.fillStyle = C.pink; Art.round(g, 146, 280, 408, 84, 26); g.fill();
          g.strokeStyle = '#1A0F2E'; g.lineWidth = 3.5; g.stroke();
          Art.text(g, '6.022 × 10²³', 350, 324, { font: 'display', size: 56, color: '#fff' });
        });
        label(g, "Avogadro's number", 350, 392, { size: 26, color: C.sun, alpha: seg(b, 1.82, 1.92) });
        const mw = walk(b, 1.02, 1.1, 440, 722, 3);
        moe(g, mw.x, 426, lerp(170, 130, io(b, 1.02, 1.1)), b > 1.75 ? 'wow' : 'point', { hop: mw.hop, flip: true, look: [-1, -0.4] });
      });
      /* Beat 2: marbles and water. */
      const s2 = seg(b, 2, 2.05) * (1 - seg(b, 2.96, 3.03));
      if (s2 > 0 && b < 3.1) A(g, s2, () => {
        const cx = 216, cy = 610, R = 350;
        const q = io(b, 2.06, 2.42);
        const colors = [C.pink, C.cyan, C.sun, C.leaf, C.fire, C.violet];
        g.save();
        Art.round(g, 0, 0, W, 450, 0); g.clip();
        for (let L = 3; L >= 0; L--) {
          const rr = R + 14 + L * 21, n = 58 + L * 4;
          for (let i = 0; i < n; i++) {
            const a = -Math.PI + (i / (n - 1)) * Math.PI;
            const local = clamp((q * 6 - L) * 1.2 - rand(i * 3 + L) * 0.7);
            if (local <= 0) continue;
            const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
            if (y > H + 16 || x < -16 || x > 470) continue;
            Art.ball(g, x, y - (1 - local) * 26, 11, colors[(i + L * 2) % 6]);
          }
        }
        const e = g.createRadialGradient(cx - 90, cy - 170, 40, cx, cy, R);
        e.addColorStop(0, '#5EC8FF'); e.addColorStop(1, '#14589E');
        g.fillStyle = e; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
        g.fillStyle = '#45C46F';
        [[cx - 130, cy - 318, 56, 16], [cx + 40, cy - 330, 76, 13], [cx + 150, cy - 290, 50, 18]].forEach(([x, y, rx, ry]) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0.1, 0, TAU); g.fill(); });
        g.restore();
        big(g, 'Earth', cx, 396, { size: 28 });
        big(g, '1 mole of marbles', cx, 60, { size: 30, color: '#FF8AC4', alpha: seg(b, 2.02, 2.12) });
        moe(g, cx, lerp(610 - R + 2, 610 - R - 86, q), 92, q > 0.7 ? 'oops' : 'happy', { look: [1, 0.2] });
        const rq = seg(b, 2.34, 2.46);
        A(g, rq, () => {
          big(g, '1 mole of water', 590, 60, { size: 30, color: C.cyan });
          spoon(g, 556, 196, 0.76, eo(b, 2.36, 2.56));
          big(g, '18 grams', 590, 292, { size: 46, color: C.sun });
          label(g, 'about a tablespoon', 590, 340, { size: 26, color: '#fff' });
        });
        label(g, 'Same number of things!', 590, 392, { size: 26, color: C.leaf, alpha: seg(b, 2.7, 2.82) });
      });
      /* Beat 3: molar mass. */
      const s3 = seg(b, 3, 3.05) * (1 - seg(b, 3.96, 4.03));
      if (s3 > 0 && b < 4.1) A(g, s3, () => {
        const mH = +EL.H.mass.toFixed(2), mO = +EL.O.mass.toFixed(2);
        const parts = [[92, 'H', mH, 38], [206, 'H', mH, 38], [346, 'O', mO, 54]];
        parts.forEach(([x, sym, m, r], i) => {
          const q = seg(b, 3.06 + i * 0.09, 3.16 + i * 0.09);
          if (q <= 0) return;
          pop(g, x, 112, q, () => Art.atom(g, x, 112, r, sym, { face: 'happy', t, seed: i, look: [0, 0.5] }));
          big(g, m.toFixed(2), x, 196, { size: 34, color: C.sun, alpha: seg(b, 3.24 + i * 0.09, 3.34 + i * 0.09) });
          if (i < 2) big(g, '+', i ? 270 : 149, 196, { size: 34, color: C.dim, alpha: seg(b, 3.3 + i * 0.09, 3.4 + i * 0.09) });
        });
        const tq = seg(b, 3.54, 3.66);
        g.fillStyle = Art.alpha(C.ink, 0.6 * tq); g.fillRect(50, 226, 340, 4);
        big(g, `${(mH * 2 + mO).toFixed(2)} g/mol`, 220, 276, { size: 52, color: '#FF8AC4', alpha: tq });
        label(g, 'The molar mass of water', 220, 330, { size: 25, alpha: seg(b, 3.62, 3.72) });
        const sq = seg(b, 3.68, 3.8);
        A(g, sq, () => {
          const top = Art.digitalScale(g, 556, 410, 240, `${(mH * 2 + mO).toFixed(2)} g`, { size: 26 }).top;
          Art.beaker(g, 556, top, 104, 112, { level: 0.42, liquid: C.water, ticks: false });
          big(g, '1 mole of H₂O', 556, 214, { size: 28, color: C.cyan });
        });
        moe(g, 722, 426, 130, b > 3.7 ? 'cheer' : 'point', { flip: b < 3.7, look: b < 3.7 ? [-1, -0.3] : [-1, 0] });
      });
      /* Beat 4: the bridge. */
      const s4 = seg(b, 4, 4.05);
      if (s4 > 0) A(g, s4, () => {
        const y = 260, X = [110, 380, 650];
        const cols = [C.sun, C.pink, C.cyan];
        plank(g, 176, 314, y - 12, 1);
        plank(g, 446, 584, y - 12, 1);
        Art.pill(g, '÷ 18.02 g/mol', 245, 200, { size: 23, color: C.plum2, text: '#fff', stroke: C.sun });
        Art.pill(g, '× 6.022 × 10²³', 515, 200, { size: 23, color: C.plum2, text: '#fff', stroke: C.cyan });
        X.forEach((x, i) => {
          island(g, x, y, 128, cols[i]);
          big(g, ['Grams', 'Moles', 'Particles'][i], x, y + 74, { size: 32, color: cols[i] });
        });
        Art.digitalScale(g, X[0], y - 16, 96, 'g', { size: 20 });
        const reach1 = seg(b, 4.3, 4.4), reach2 = seg(b, 4.7, 4.8);
        label(g, '36 g of water', X[0], y + 112, { size: 25 });
        label(g, '2.0 mol', X[1], y + 112, { size: 25, alpha: reach1 });
        label(g, '1.2 × 10²⁴ molecules', X[2], y + 112, { size: 25, alpha: reach2 });
        for (let i = 0; i < 6; i++) waterMol(g, X[2] - 46 + (i % 3) * 46 + (i > 2 ? 22 : 0) + wander(i, t) * 2, y - 26 - (i > 2 ? 26 : 0) + wander(i + 7, t) * 2, 14, i * 1.3);
        const w1 = walk(b, 4.08, 4.36, X[0], X[1], 6), w2 = walk(b, 4.46, 4.76, X[1], X[2], 6);
        const mx = b < 4.42 ? w1.x : w2.x, hop = b < 4.42 ? w1.hop : w2.hop;
        const onB = (mx > 190 && mx < 300) || (mx > 460 && mx < 570);
        moe(g, mx, y - 8 + (onB ? 14 : 0), 96, b > 4.78 ? 'cheer' : 'happy', { hop });
      });
    },
  });

  /* 6. Balancing and combustion */
  function checkMark(g, x, y, ok, a) {
    A(g, a, () => {
      g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = 8;
      g.strokeStyle = ok ? C.leaf : C.red;
      g.beginPath();
      if (ok) { g.moveTo(x - 14, y + 1); g.lineTo(x - 3, y + 12); g.lineTo(x + 16, y - 12); }
      else { g.moveTo(x - 12, y - 12); g.lineTo(x + 12, y + 12); g.moveTo(x + 12, y - 12); g.lineTo(x - 12, y + 12); }
      g.stroke();
    });
  }
  CH.push({
    id: 'burn', title: 'Balancing and burning', depth: 'Gravel', layer: LAYER.gravel,
    lessons: ['balancing', 'reaction-types', 'combustion'],
    enter: { x: 726, y: 426, h: 122, flip: true },
    exit: { x: 730, y: 426, h: 112 },
    beats: [
      { say: 'Gravel. Time to burn something. <b>Methane</b>, the gas in a kitchen stove, meets oxygen.' },
      { say: 'We get carbon dioxide and water. But count the atoms. They do not match, and atoms are never created or destroyed.' },
      { say: 'Fix carbon, then hydrogen, then oxygen. Change the <b>big numbers in front</b>, never the little ones inside.' },
      { say: 'Now watch. One carbon, four hydrogens and four oxygens go in, and they all come out, with <b>new partners</b>.' },
    ],
    draw(g, b, t) {
      /* Beat 0: the burner. */
      const s0 = 1 - seg(b, 0.94, 1.02);
      if (b < 1.04) A(g, s0, () => {
        Art.bunsen(g, 196, 420, 1.7, { air: 1, flame: seg(b, 0.04, 0.16), t });
        Art.zoom(g, 196, 190, 500, 196, 172, (gg, cx, cy) => {
          const q = eo(b, 0.4, 0.66);
          Art.molecule(gg, cx - 76 + wander(1, t) * 5, cy + 6 + wander(2, t) * 5, 58, 'CH4', { face: 'happy', t, atomScale: 1.42, rot: Math.sin(t * 0.5) * 0.25 });
          Art.molecule(gg, cx + 72 + wander(3, t) * 5, cy - 72 + wander(4, t) * 5, 52, 'O2', { face: 'wow', t, atomScale: 1.3, rot: Math.sin(t * 0.6) * 0.3, faceAll: true, alpha: q });
          Art.molecule(gg, cx + 76 + wander(5, t) * 5, cy + 64 + wander(6, t) * 5, 52, 'O2', { face: 'wow', t, atomScale: 1.3, rot: 0.4 + Math.sin(t * 0.7) * 0.3, faceAll: true, alpha: q });
        }, { p: seg(b, 0.14, 0.34) });
        big(g, 'Methane, CH₄', 400, 396, { size: 28, color: '#fff', alpha: seg(b, 0.3, 0.42) });
        big(g, 'Oxygen, O₂', 590, 396, { size: 28, color: '#FF8A94', alpha: seg(b, 0.58, 0.7) });
        moe(g, 726, 426, 122, 'point', { flip: true, look: [-1, -0.4] });
      });
      /* Beats 1 and 2: the atom ledger. */
      const led = seg(b, 1, 1.05) * (1 - seg(b, 2.95, 3.02));
      if (led > 0 && b < 3.1) A(g, led, () => {
        const qH = bk(b, 2.3, 2.46), qO = bk(b, 2.56, 2.72);
        const pos = eqn(g, [{ f: 'CH4' }, '+', { f: 'O2', c: '2', cq: clamp(qO, 0, 1.2) }, '->', { f: 'CO2' }, '+', { f: 'H2O', c: '2', cq: clamp(qH, 0, 1.2) }], 346, 56, 50);
        void pos;
        const rH = seg(b, 2.3, 2.46) > 0.5 ? 4 : 2, rO = seg(b, 2.3, 2.46) > 0.5 ? 4 : 3, lO = seg(b, 2.56, 2.72) > 0.5 ? 4 : 2;
        const rows = [
          { sym: 'C', y: 158, l: 1, r: 1, d: 1.2, fx: [2.02, 2.28] },
          { sym: 'H', y: 226, l: 4, r: rH, d: 1.32, fx: [2.28, 2.54] },
          { sym: 'O', y: 294, l: lO, r: rO, d: 1.44, fx: [2.54, 2.8] },
        ];
        label(g, 'Going in', 170, 112, { size: 26, color: C.dim, alpha: seg(b, 1.1, 1.2) });
        label(g, 'Coming out', 470, 112, { size: 26, color: C.dim, alpha: seg(b, 1.1, 1.2) });
        rows.forEach((r, i) => {
          const q = seg(b, r.d, r.d + 0.1);
          if (q <= 0) return;
          const active = b >= r.fx[0] && b < r.fx[1];
          A(g, q, () => {
            if (active) { g.fillStyle = 'rgba(255,210,63,.18)'; g.strokeStyle = C.sun; g.lineWidth = 3; Art.round(g, 22, r.y - 30, 640, 60, 18); g.fill(); g.stroke(); }
            big(g, String(r.l), 46, r.y, { size: 36, color: C.ink });
            for (let k = 0; k < r.l; k++) Art.atom(g, 262 - k * 42, r.y, 18, r.sym, { label: false });
            label(g, r.sym, 320, r.y, { size: 30 });
            for (let k = 0; k < r.r; k++) Art.atom(g, 378 + k * 42, r.y, 18, r.sym, { label: false });
            big(g, String(r.r), 572, r.y, { size: 36, color: C.ink });
            checkMark(g, 626, r.y, r.l === r.r, seg(b, 1.5 + i * 0.1, 1.58 + i * 0.1));
          });
        });
        const trap = seg(b, 2.74, 2.84);
        if (trap > 0) A(g, trap, () => {
          label(g, 'Never change a little number:', 210, 366, { size: 25 });
          Art.formula(g, 'H4O', 442, 366, { size: 38, colorize: true, halo: true });
          Art.strike(g, 406, 382, 478, 350, seg(b, 2.82, 2.92), C.red, 7);
        });
        moe(g, 726, 426, 112, b < 2 ? 'oops' : b > 2.7 ? 'happy' : 'think', { flip: true, look: [-1, -0.3] });
      });
      /* Beat 3: the reaction itself. Every atom has a seat on both sides. */
      const s3 = seg(b, 3, 3.05);
      if (s3 > 0) A(g, s3, () => {
        const rq = io(b, 3.26, 3.66);
        const shakeA = seg(b, 3.1, 3.26) * (1 - seg(rq, 0, 0.1));
        const flash = Math.sin(rq * Math.PI);
        if (flash > 0) Art.glow(g, 350, 190, 330 * flash + 60, C.fire, 0.55 * flash);
        const near = eo(b, 3.08, 3.26);
        const A0 = {
          C: [lerp(112, 150, near), 190], H1: [lerp(112, 150, near), 124], H2: [lerp(178, 216, near), 190], H3: [lerp(112, 150, near), 256], H4: [lerp(46, 84, near), 190],
          O1: [lerp(340, 306, near), 118], O2: [lerp(404, 370, near), 118], O3: [lerp(340, 306, near), 262], O4: [lerp(404, 370, near), 262],
        };
        const B0 = {
          C: [530, 112], O1: [456, 112], O2: [604, 112],
          O3: [430, 266], H1: [386, 298], H2: [474, 298],
          O4: [622, 266], H3: [578, 298], H4: [666, 298],
        };
        const sw = { C: 40, H1: -70, H2: 60, H3: 90, H4: -50, O1: -80, O2: 60, O3: 70, O4: -60 };
        const P = {};
        Object.keys(A0).forEach((k) => {
          const a = A0[k], c = B0[k];
          const j = shakeA * 3;
          P[k] = [lerp(a[0], c[0], rq) + Math.sin(t * 30 + k.charCodeAt(0)) * j, lerp(a[1], c[1], rq) + Math.sin(rq * Math.PI) * sw[k] + Math.cos(t * 27 + k.length) * j];
        });
        const bd = (a, c, o) => Art.bond(g, P[a][0], P[a][1], P[c][0], P[c][1], Object.assign({ width: 6 }, o));
        A(g, 1 - seg(rq, 0, 0.12), () => {
          ['H1', 'H2', 'H3', 'H4'].forEach((h) => bd('C', h));
          bd('O1', 'O2', { order: 2 }); bd('O3', 'O4', { order: 2 });
        });
        A(g, seg(rq, 0.88, 1), () => {
          bd('O1', 'C', { order: 2 }); bd('C', 'O2', { order: 2 });
          bd('O3', 'H1'); bd('O3', 'H2'); bd('O4', 'H3'); bd('O4', 'H4');
        });
        Art.burst(g, 350, 190, seg(rq, 0.12, 0.72), { n: 22, r: 220, size: 11, colors: [C.fire, C.sun, '#fff'] });
        const flying = rq > 0.03 && rq < 0.97;
        const face = flying ? 'wow' : rq >= 0.97 ? 'grin' : 'happy';
        Object.keys(P).forEach((k, i) => {
          const sym = k[0];
          Art.atom(g, P[k][0], P[k][1], sym === 'C' ? 36 : sym === 'O' ? 30 : 21, sym, { face, t, seed: i, look: flying ? [Math.sin(t * 6 + i), Math.cos(t * 5 + i)] : [rq > 0.9 ? 0 : 1, 0] });
        });
        A(g, seg(b, 3.74, 3.84), () => {
          g.save();
          Art.pill(g, '1 C, 4 H and 4 O on each side', 346, 36, { size: 25, font: 'display', color: C.leaf, text: '#0A2A18' });
          g.restore();
        });
        A(g, seg(b, 3.04, 3.12), () => eqn(g, [{ f: 'CH4' }, '+', { f: 'O2', c: '2' }, '->', { f: 'CO2' }, '+', { f: 'H2O', c: '2' }], 346, 378, 44));
        moe(g, 730, 426, 112, rq >= 0.9 ? 'cheer' : 'wow', { flip: true, look: [-1, -0.3] });
      });
    },
  });

  /* 7. Stoichiometry and limiting reactants */
  const CH4_S = (g, x, y, s, o = {}) => Art.molecule(g, x, y, s, 'CH4', Object.assign({ atomScale: 1.5 }, o));
  CH.push({
    id: 'stoich', title: 'Recipes and running out', depth: 'Deep gravel', layer: LAYER.mine,
    lessons: ['stoichiometry', 'limiting'],
    enter: { x: 716, y: 428, h: 130, flip: true },
    exit: { x: 66, y: 428, h: 112 },
    beats: [
      { say: 'A balanced equation is a <b>recipe</b>. The big numbers are mole ratios: one methane needs two oxygens.' },
      { say: 'Stoichiometry is always one road: grams to moles, moles to moles, moles to grams.' },
      { say: 'Burn 16 grams of methane. That is 1.0 mole, which makes 2.0 moles of water, or <b>36 grams</b>.' },
      { say: 'Now say you have three methanes and only four oxygens. Two methanes use up every oxygen.' },
      { say: 'Oxygen is the <b>limiting reactant</b>. It runs out first and decides how much you make. The spare methane just sulks.' },
    ],
    draw(g, b, t) {
      /* Beat 0: the recipe card. */
      if (b < 1.05) A(g, 1 - seg(b, 0.94, 1.03), () => {
        const q = seg(b, 0.04, 0.14);
        pop(g, 348, 214, q, () => {
          panel(g, 64, 76, 572, 306, { fill: 'rgba(22,34,44,.92)', stroke: '#B48B5A', lw: 7, r: 14 });
        });
        if (q > 0.7) {
          const pos = eqn(g, [{ f: 'CH4' }, '+', { f: 'O2', c: '2' }, '->', { f: 'CO2' }, '+', { f: 'H2O', c: '2' }], 350, 118, 46);
          const cols = [pos[0].x, pos[2].x, pos[4].x, pos[6].x];
          const amb = [1, 2, 1, 2], mols = ['CH4', 'O2', 'CO2', 'H2O'];
          cols.forEach((x, i) => {
            const qq = seg(b, 0.3 + i * 0.06, 0.38 + i * 0.06);
            if (qq <= 0) return;
            A(g, qq, () => {
              const n = amb[i];
              for (let k = 0; k < n; k++) {
                const my = n === 1 ? 202 : 178 + k * 50;
                Art.molecule(g, x, my, i === 2 ? 26 : 22, mols[i], { labels: false, style: 'fill', atomScale: 1.2, rot: Math.sin(t + i + k) * 0.15 });
              }
              big(g, `${n} mol`, x, 272, { size: 30, color: C.sun });
            });
          });
          big(g, 'The big numbers are mole ratios', 350, 334, { size: 28, color: '#fff', alpha: seg(b, 0.56, 0.66) });
        }
        moe(g, 716, 428, 130, 'point', { flip: true, chef: true, look: [-1, -0.2] });
      });
      /* Beats 1 and 2: the road. */
      const rd = seg(b, 1, 1.05) * (1 - seg(b, 2.95, 3.03));
      if (rd > 0 && b < 3.1) A(g, rd, () => {
        const X = [110, 300, 490, 680], Y = 146;
        // Road.
        g.fillStyle = '#5A4A3E'; g.fillRect(40, 350, 720, 34);
        g.fillStyle = '#FFE6A8';
        for (let i = 0; i < 14; i++) g.fillRect(52 + i * 52, 365, 26, 4);
        const sign = (i, title, col) => {
          const q = seg(b, 1.12 + i * 0.18, 1.2 + i * 0.18);
          if (q <= 0) return;
          pop(g, X[i], Y + 120, q, () => {
            g.fillStyle = '#6A4A2C'; g.fillRect(X[i] - 5, Y + 26, 10, 208);
            g.fillStyle = '#8C6238'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3.5;
            Art.round(g, X[i] - 80, Y - 30, 160, 60, 12); g.fill(); g.stroke();
            big(g, title, X[i], Y, { size: 30, color: col });
          });
        };
        sign(0, 'Grams', C.sun); sign(1, 'Moles', '#FF8AC4'); sign(2, 'Moles', '#FF8AC4'); sign(3, 'Grams', C.sun);
        const a = [seg(b, 1.28, 1.36), seg(b, 1.46, 1.54), seg(b, 1.64, 1.72)];
        for (let i = 0; i < 3; i++) Art.arrow(g, X[i] + 84, Y, X[i + 1] - 84, Y, { color: '#fff', w: 5, p: a[i] });
        const num = seg(b, 2.02, 2.1);
        const stepLabels = [['÷ molar mass', '÷ 16.04 g/mol'], ['× mole ratio', '× 2 H₂O / 1 CH₄'], ['× molar mass', '× 18.02 g/mol']];
        stepLabels.forEach(([gen, spec], i) => {
          const mx = (X[i] + X[i + 1]) / 2;
          label(g, gen, mx, Y - 58, { size: 24, alpha: a[i] * (1 - num) });
          label(g, spec, mx, Y - 58, { size: 24, color: C.cyan, alpha: num * seg(b, 2.16 + i * 0.24, 2.24 + i * 0.24) });
        });
        const vals = ['16 g CH₄', '1.0 mol CH₄', '2.0 mol H₂O', '36 g H₂O'];
        const reach = [2.08, 2.34, 2.58, 2.82];
        vals.forEach((v, i) => {
          const q = seg(b, reach[i], reach[i] + 0.08);
          if (q > 0) pop(g, X[i], 250, q, () => {
            panel(g, X[i] - 84, 224, 168, 52, { fill: 'rgba(16,8,32,.88)', stroke: i === 3 ? C.sun : 'rgba(247,242,255,.4)', lw: i === 3 ? 4 : 2.5 });
            big(g, v, X[i], 250, { size: 25, color: i === 3 ? C.sun : '#fff' });
          });
        });
        const legs = [walk(b, 2.1, 2.32, X[0], X[1], 4), walk(b, 2.36, 2.56, X[1], X[2], 4), walk(b, 2.6, 2.8, X[2], X[3], 4)];
        const leg = b < 2.34 ? 0 : b < 2.58 ? 1 : 2;
        const mw = legs[leg];
        const startX = lerp(716, X[0], io(b, 1.02, 1.1));
        moe(g, b < 2 ? startX : mw.x, 366, lerp(130, 96, io(b, 1.02, 1.1)), b > 2.84 ? 'cheer' : 'happy', { hop: b < 2 ? (b < 1.1 ? Math.abs(Math.sin(seg(b, 1.02, 1.1) * Math.PI * 4)) * 13 : 0) : mw.hop, flip: b < 1.1, look: [1, 0] });
      });
      /* Beats 3 and 4: what runs out first. 3 CH4 + 4 O2 gives 2 CO2 + 4 H2O, with 1 CH4 left. */
      const s3 = seg(b, 3, 3.05);
      if (s3 > 0) A(g, s3, () => {
        const group = io(b, 3.5, 3.72), burn = io(b, 4.03, 4.2);
        const CHX = [100, 240, 380];
        const O2 = [[80, 250, 66, 240], [180, 250, 134, 240], [280, 250, 206, 240], [380, 250, 274, 240]];
        const a = seg(b, 3.04, 3.12);
        label(g, '3 methane', 240, 74, { size: 28, color: '#fff', alpha: a * (1 - burn) });
        label(g, '4 oxygen', 240, 306, { size: 28, color: '#FF8A94', alpha: seg(b, 3.2, 3.3) * (1 - group) });
        // The two groups that react.
        const grp = seg(b, 3.66, 3.76) * (1 - burn);
        [[100], [240]].forEach(([cx], i) => {
          A(g, grp, () => {
            g.setLineDash([9, 7]); g.strokeStyle = C.leaf; g.lineWidth = 3.5;
            Art.round(g, cx - 66, 94, 132, 188, 16); g.stroke();
            g.setLineDash([]);
            void i;
          });
        });
        const reacted = 1 - burn;
        A(g, reacted, () => {
          CH4_S(g, CHX[0], 146, 34, { face: 'happy', t, seed: 1, look: [0, 1] });
          CH4_S(g, CHX[1], 146, 34, { face: 'happy', t, seed: 2, look: [0, 1] });
          O2.forEach(([x0, y0, x1, y1], i) => {
            const q = seg(b, 3.12 + i * 0.03, 3.2 + i * 0.03);
            if (q > 0) A(g, q, () => Art.molecule(g, lerp(x0, x1, group), lerp(y0, y1, group), 32, 'O2', { atomScale: 1.2, labels: false, rot: Math.sin(t + i) * 0.15 }));
          });
        });
        // The spare methane walks across to sulk.
        const sulk = io(b, 4.18, 4.42);
        const sx = lerp(CHX[2], 590, sulk), sy = lerp(146, 322, sulk);
        CH4_S(g, sx, sy + wander(3, t) * 1.5, 34, { face: group > 0.5 ? 'sad' : 'happy', t, seed: 3, look: [0, 0.6] });
        if (b >= 3.74 && b < 4.1) A(g, seg(b, 3.74, 3.84) * (1 - burn), () => {
          label(g, 'No oxygen left', 380, 232, { size: 24, color: '#FF9AA4' });
        });
        // Products: 2 CO2 and 4 H2O.
        const arrow = seg(b, 4.02, 4.12);
        if (arrow > 0) Art.arrow(g, 338, 190, 398, 190, { color: '#fff', w: 7, p: arrow });
        [[470, 84], [628, 84]].forEach(([x, y], i) => {
          const q = seg(b, 4.08 + i * 0.05, 4.16 + i * 0.05);
          if (q > 0) pop(g, x, y, q, () => Art.molecule(g, x, y, 36, 'CO2', { atomScale: 1.25, labels: false }));
        });
        [[440, 190], [528, 190], [616, 190], [704, 190]].forEach(([x, y], i) => {
          const q = seg(b, 4.18 + i * 0.04, 4.26 + i * 0.04);
          if (q > 0) pop(g, x, y, q, () => Art.molecule(g, x, y, 32, 'H2O', { atomScale: 1.25, labels: false, rot: Math.sin(t + i) * 0.14 }));
        });
        label(g, '2 CO₂ and 4 H₂O', 584, 252, { size: 26, color: C.sun, alpha: seg(b, 4.34, 4.44) });
        const lim = seg(b, 4.12, 4.22);
        A(g, lim, () => {
          label(g, 'Started with 3 CH₄ and 4 O₂', 196, 102, { size: 24, color: C.dim });
          big(g, 'Limiting: O₂', 190, 170, { size: 34, color: '#FF8AC4' });
          label(g, 'It ran out first', 190, 212, { size: 25 });
        });
        const ex = seg(b, 4.66, 4.76);
        big(g, 'Excess: CH₄', 590, 396, { size: 28, color: C.sun, alpha: ex });
        moe(g, 66, 428, 112, b > 4.1 ? 'think' : 'point', { look: [1, -0.4] });
      });
    },
  });

  /* 8. Water, solubility and precipitates */
  function nitrate(g, x, y, r, t, o = {}) {
    const R = r * 1.9;
    [0, 1, 2].forEach((i) => {
      const a = -Math.PI / 2 + (i / 3) * TAU + (o.rot || 0);
      Art.bond(g, x, y, x + Math.cos(a) * R, y + Math.sin(a) * R, { width: 4, order: i === 0 ? 2 : 1 });
    });
    [0, 1, 2].forEach((i) => {
      const a = -Math.PI / 2 + (i / 3) * TAU + (o.rot || 0);
      Art.atom(g, x + Math.cos(a) * R, y + Math.sin(a) * R, r * 0.82, 'O', { label: false });
    });
    Art.atom(g, x, y, r, 'N', { label: false, face: o.face, t, seed: 7, charge: o.charge });
  }
  /** A hydrated ion: water molecules around it, pointing the correct end at it. */
  function hydrated(g, x, y, sym, r, charge, q, t, n = 6) {
    const R = r + 34, pos = /\+/.test(charge);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + t * 0.28 + r;
      const px = x + Math.cos(a) * R * lerp(1.7, 1, q) + wander(i + r, t) * 2, py = y + Math.sin(a) * R * lerp(1.7, 1, q) + wander(i + r + 7, t) * 2;
      // O end toward a positive ion, H ends toward a negative ion.
      A(g, q, () => waterMol(g, px, py, 20, pos ? a - Math.PI / 2 : a + Math.PI / 2, { atomScale: 1.16 }));
    }
    Art.atom(g, x, y, r, sym, { label: sym, charge, face: q > 0.7 ? 'happy' : null, t, seed: r });
  }
  const POOL_FRONT = (g, t) => pool(g, t + 0.7, 410);
  CH.push({
    id: 'water', title: 'Water, salt and solids', depth: 'The water table', layer: LAYER.water,
    lessons: ['solutions', 'solubility', 'precipitation', 'acid-base', 'redox'],
    enter: { x: 716, y: 440, h: 124, flip: true },
    exit: { x: 716, y: 440, h: 124 },
    floorY: 400,
    beats: [
      { say: 'The water table! Water is <b>bent</b>, with a slightly negative oxygen end and slightly positive hydrogen ends.' },
      { say: 'So water pulls salt apart. Oxygen ends hug <b>sodium ions</b>, and hydrogen ends hug <b>chloride ions</b>.' },
      { say: '<b>Molarity</b> counts what dissolved: moles of solute per liter of solution.' },
      { say: 'Mix two clear solutions. Surprise, a white solid! Silver chloride does not dissolve, so it falls out as a <b>precipitate</b>.' },
      { say: 'Sodium and nitrate just watch. Cross out those <b>spectator ions</b>, and you have the <b>net ionic equation</b>.' },
    ],
    draw(g, b, t) {
      const paddle = (mood, look) => {
        moe(g, 716, 440 + Math.sin(t * 1.6) * 2.5, 124, mood, { flip: true, ring: true, look });
        POOL_FRONT(g, t);
      };
      /* Beat 0 */
      if (b < 1.05) A(g, 1 - seg(b, 0.94, 1.03), () => {
        const q = bk(b, 0.04, 0.2);
        const ox = 330, oy = 150;
        const Hx = 118, Hy = 92;
        at(g, ox, oy + 40, Math.max(0.01, q), () => {
          g.translate(-ox, -oy - 40);
          const glow = seg(b, 0.3, 0.46), g2 = seg(b, 0.6, 0.76);
          if (glow > 0) Art.glow(g, ox, oy, 150, C.cyan, 0.5 * glow);
          if (g2 > 0) { Art.glow(g, ox - Hx, oy + Hy, 100, C.pink, 0.55 * g2); Art.glow(g, ox + Hx, oy + Hy, 100, C.pink, 0.55 * g2); }
          Art.bond(g, ox, oy, ox - Hx, oy + Hy, { width: 11 });
          Art.bond(g, ox, oy, ox + Hx, oy + Hy, { width: 11 });
          Art.atom(g, ox - Hx, oy + Hy, 46, 'H', { face: 'happy', t, seed: 1, look: [0.4, -0.3] });
          Art.atom(g, ox + Hx, oy + Hy, 46, 'H', { face: 'happy', t, seed: 2, look: [-0.4, -0.3] });
          Art.atom(g, ox, oy, 72, 'O', { face: 'grin', t, seed: 3 });
        });
        const a1 = seg(b, 0.3, 0.42), a2 = seg(b, 0.6, 0.72);
        Art.pill(g, 'δ−', ox, 54, { size: 30, font: 'display', color: C.cyan, text: '#06222B', alpha: a1 });
        label(g, 'Slightly negative', 556, 112, { size: 26, color: C.cyan, alpha: a1 });
        Art.pill(g, 'δ+', ox - Hx - 72, 268, { size: 30, font: 'display', color: C.pink, text: '#fff', alpha: a2 });
        Art.pill(g, 'δ+', ox + Hx + 72, 268, { size: 30, font: 'display', color: C.pink, text: '#fff', alpha: a2 });
        label(g, 'Slightly positive', ox, 352, { size: 26, color: '#FF8AC4', alpha: a2 });
        paddle('point', [-1, -0.4]);
      });
      /* Beat 1: dissolving */
      const s1 = seg(b, 1, 1.05) * (1 - seg(b, 1.95, 2.03));
      if (s1 > 0 && b < 2.1) A(g, s1, () => {
        const q = (a, c) => io(b, a, c);
        win(g, 20, 34, 662, 358, () => {
          g.fillStyle = 'rgba(40,120,190,.22)'; g.fillRect(20, 34, 662, 358);
          const free = {};
          const moves = [
            { i: 3, j: 0, x: 346, y: 176, sym: 'Cl', d: 1.16 },
            { i: 3, j: 1, x: 480, y: 138, sym: 'Na', d: 1.3 },
            { i: 2, j: 0, x: 356, y: 322, sym: 'Na', d: 1.46 },
            { i: 3, j: 2, x: 540, y: 296, sym: 'Cl', d: 1.62 },
          ];
          moves.forEach((m) => { free[m.i + ',' + m.j] = m; });
          for (let j = 0; j < 5; j++) for (let i = 0; i < 4; i++) {
            if (free[i + ',' + j]) continue;
            const na = (i + j) % 2 === 1;
            Art.atom(g, 64 + i * 46 + wander(i * 3 + j, t * 5) * 1.3, 138 + j * 46 + wander(i + j * 3, t * 5) * 1.3, na ? 16 : 23, na ? 'Na' : 'Cl', { label: false });
          }
          moves.forEach((m) => {
            const u = q(m.d, m.d + 0.18);
            const x0 = 64 + m.i * 46, y0 = 138 + m.j * 46;
            const x = lerp(x0, m.x, u), y = lerp(y0, m.y, u) + Math.sin(u * Math.PI) * -18;
            hydrated(g, x, y, m.sym, m.sym === 'Na' ? 19 : 25, m.sym === 'Na' ? '+' : '-', seg(u, 0.3, 1), t, m.sym === 'Na' ? 5 : 6);
          });
          [[250, 96], [640, 110], [640, 214], [454, 240], [250, 372]].forEach(([wx, wy], i) => waterMol(g, wx + wander(i, t * 0.7) * 8, wy + wander(i + 5, t * 0.7) * 8, 20, i * 1.7 + t * 0.3));
        }, { rim: C.cyan });
        A(g, seg(b, 1.04, 1.12), () => Art.formula(g, 'NaCl(s) -> Na^+(aq) + Cl^-(aq)', 350, 62, { size: 34, colorize: true, halo: true }));
        paddle('wow', [-1, 0]);
      });
      /* Beat 2: molarity */
      const s2 = seg(b, 2, 2.05) * (1 - seg(b, 2.96, 3.03));
      if (s2 > 0 && b < 3.1) A(g, s2, () => {
        const cx = 170;
        g.fillStyle = '#1C6288'; g.strokeStyle = 'rgba(8,24,40,.8)'; g.lineWidth = 3;
        g.beginPath(); g.moveTo(40, 420); g.lineTo(58, 372); g.lineTo(282, 372); g.lineTo(300, 420); g.closePath(); g.fill(); g.stroke();
        Art.beaker(g, cx, 372, 172, 234, { level: 0.78, liquid: C.water, inside: (gg, box) => {
          for (let i = 0; i < 12; i++) {
            const na = i % 2 === 0;
            const x = box.x0 + 24 + (i % 4) * 42 + wander(i, t * 0.8) * 5, y = box.top + 28 + Math.floor(i / 4) * 54 + wander(i + 3, t * 0.8) * 5;
            Art.atom(gg, x, y, na ? 11 : 15, na ? 'Na' : 'Cl', { label: false });
          }
        } });
        label(g, '0.25 L of solution', cx, 106, { size: 25, alpha: seg(b, 2.16, 2.26) });
        const f = seg(b, 2.06, 2.18);
        A(g, f, () => {
          big(g, 'Molarity =', 412, 186, { size: 42, color: C.sun });
          big(g, 'moles of solute', 584 + 18, 148, { size: 26 });
          g.fillStyle = C.ink; Art.round(g, 502, 184, 202, 5, 2.5); g.fill();
          big(g, 'liters of solution', 584 + 18, 224, { size: 26 });
        });
        const e = seg(b, 2.5, 2.64);
        big(g, '0.50 mol ÷ 0.25 L', 470, 296, { size: 32, alpha: e });
        big(g, '= 2.0 M', 470, 342, { size: 44, color: C.sun, alpha: seg(b, 2.64, 2.76) });
        paddle('point', [-1, -0.3]);
      });
      /* Beat 3: mix, and a solid appears */
      const s3 = seg(b, 3, 3.05) * (1 - seg(b, 3.95, 4.03));
      if (s3 > 0 && b < 4.1) A(g, s3, () => {
        const tilt = io(b, 3.14, 3.28), back_ = io(b, 3.5, 3.62);
        const pour = seg(b, 3.26, 3.3) * (1 - seg(b, 3.5, 3.54));
        const mix = eo(b, 3.28, 3.52);
        const rot = tilt * (1 - back_) * 1.0;
        const clear = '#CDEBF5';
        const ax = 166, bx = 634, ay = 214;
        const lA = lerp(0.62, 0.1, mix);
        at(g, ax, ay, 1, () => Art.beaker(g, 0, 0, 100, 112, { level: lA, liquid: clear, ticks: false }), rot);
        at(g, bx, ay, 1, () => Art.beaker(g, 0, 0, 100, 112, { level: lA, liquid: clear, ticks: false }), -rot);
        A(g, 1 - tilt * 0.4, () => {
          Art.formula(g, 'AgNO3(aq)', ax - 8, 76, { size: 30, colorize: true, halo: true });
          Art.formula(g, 'NaCl(aq)', bx + 8, 76, { size: 30, colorize: true, halo: true });
          label(g, 'Clear', ax - 8, 112, { size: 23, color: C.dim });
          label(g, 'Clear', bx + 8, 112, { size: 23, color: C.dim });
        });
        if (pour > 0) A(g, pour, () => {
          g.strokeStyle = 'rgba(205,235,245,.85)'; g.lineWidth = 8; g.lineCap = 'round';
          const lipA = [ax + Math.cos(1) * 50 + Math.sin(1) * 112, ay + Math.sin(1) * 50 - Math.cos(1) * 112];
          const lipB = [bx - Math.cos(1) * 50 - Math.sin(1) * 112, lipA[1]];
          [lipA, lipB].forEach((l, i) => {
            g.beginPath(); g.moveTo(l[0], l[1]);
            g.quadraticCurveTo(l[0] + (i ? -22 : 22), l[1] + 26, 400 + (i ? 30 : -30) + Math.sin(t * 9 + i) * 2, 300);
            g.stroke();
          });
        });
        const settled = eo(b, 3.5, 3.84);
        Art.beaker(g, 400, 414, 220, 188, { level: lerp(0.1, 0.66, mix), liquid: clear, inside: (gg, box) => {
          const cloud = seg(mix, 0.3, 0.8);
          if (cloud <= 0) return;
          for (let i = 0; i < 60; i++) {
            const px = box.x0 + 12 + rand(i + 2) * (box.x1 - box.x0 - 24);
            const start = box.top + 10 + rand(i + 5) * (box.bottom - box.top - 34);
            const py = lerp(start, box.bottom - 9 - rand(i + 8) * 22, settled) + wander(i, t) * 3 * (1 - settled);
            gg.fillStyle = `rgba(255,255,255,${0.85 * cloud})`;
            gg.beginPath(); gg.arc(px + wander(i + 4, t) * 4 * (1 - settled), py, 2.6 + rand(i) * 2.8, 0, TAU); gg.fill();
          }
        } });
        const lab = seg(b, 3.62, 3.74);
        A(g, lab, () => {
          Art.formula(g, 'AgCl(s)', 400, 196, { size: 40, colorize: true, halo: true });
          big(g, 'A precipitate', 400, 152, { size: 30, color: C.sun });
          Art.arrow(g, 400, 220, 400, 372, { color: C.sun, w: 5, p: seg(b, 3.7, 3.82) });
        });
        paddle(b > 3.5 ? 'wow' : 'happy', [-1, 0]);
      });
      /* Beat 4: spectators and the net ionic equation */
      const s4 = seg(b, 4, 4.05);
      if (s4 > 0) A(g, s4, () => {
        const str = seg(b, 4.34, 4.5);
        const dim = 1 - 0.6 * str;
        const pos = eqn(g, [{ f: 'Ag^+' }, '+', { f: 'NO3^-', a: dim }, '+', { f: 'Na^+', a: dim }, '+', { f: 'Cl^-' }, '->', { f: 'AgCl(s)' }, '+', { f: 'Na^+', a: dim }, '+', { f: 'NO3^-', a: dim }], 340, 62, 31);
        [2, 4, 10, 12].forEach((i) => Art.strike(g, pos[i].x0 - 2, 76, pos[i].x1 + 2, 48, str, C.red, 6));
        // The pair that reacts.
        const snap = io(b, 4.08, 4.26);
        const ax = lerp(84, 138, snap), cx2 = lerp(320, 226, snap), cy = 186;
        Art.atom(g, cx2, cy, 46, 'Cl', { face: snap > 0.9 ? 'grin' : 'happy', t, seed: 2, look: [-1, 0], charge: '-' });
        Art.atom(g, ax, cy, 38, 'Ag', { face: snap > 0.9 ? 'grin' : 'happy', t, seed: 1, look: [1, 0], charge: '+' });
        Art.burst(g, 186, cy, seg(b, 4.2, 4.34), { n: 12, r: 70 });
        // The spectators watch from the side, unimpressed.
        const sq = seg(b, 4.18, 4.3);
        pop(g, 500, 196, sq, () => {
          panel(g, 372, 110, 272, 170, { fill: 'rgba(8,30,50,.7)', stroke: 'rgba(214,240,255,.5)' });
          Art.atom(g, 448, 184, 36, 'Na', { face: 'sleepy', t, seed: 3, charge: '+' });
          nitrate(g, 564, 186, 24, t, { face: 'sleepy', charge: '-' });
          big(g, 'Spectators', 508, 252, { size: 26, color: C.dim });
        });
        const nq = seg(b, 4.54, 4.68);
        if (nq > 0) {
          label(g, 'The net ionic equation', 330, 300, { size: 26, color: C.leaf, alpha: nq });
          A(g, nq, () => eqn(g, [{ f: 'Ag^+' }, '+', { f: 'Cl^-' }, '->', { f: 'AgCl(s)' }], 330, 354, 54));
        }
        paddle(b > 4.6 ? 'cheer' : 'point', [-1, -0.2]);
      });
    },
  });

  /* 9. Energy */
  function hill(g, x, y, w, h, y0, y1, yTop, p, color) {
    // A smooth reaction-energy curve from level y0 over a hump down to y1, drawn on with p.
    const fn = (u) => {
      const bump = Math.exp(-Math.pow((u - 0.46) / 0.13, 2));
      const step = ease.inOut(seg(u, 0.34, 0.66));
      const base = lerp(y0, y1, step);
      return y + base + (yTop - Math.min(y0, y1)) * bump;
    };
    g.save();
    g.strokeStyle = color; g.lineWidth = 6; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath();
    const n = 60;
    for (let i = 0; i <= n * p; i++) { const u = i / n, px = x + u * w, py = fn(u); if (i) g.lineTo(px, py); else g.moveTo(px, py); }
    g.stroke();
    g.restore();
    return fn;
  }
  CH.push({
    id: 'energy', title: 'Energy', depth: 'Warm rock', layer: LAYER.warm,
    lessons: ['energy', 'calorimetry', 'enthalpy'],
    enter: { x: 690, y: 426, h: 142, flip: true },
    exit: { x: 722, y: 426, h: 118 },
    beats: [
      { say: 'Warm rock. <b>Heat</b> always flows from hot to cold, until both match.' },
      { say: 'Reactions that give off heat are <b>exothermic</b>, like burning methane. Ones that soak up heat are <b>endothermic</b>, like a cold pack.' },
      { say: 'A classic trap: <b>breaking bonds costs energy</b>, and making bonds releases it. Burning pays out because you get back more than you spend.' },
      { say: 'To find heat, use <b>q = mcΔT</b>. Warming 100 grams of water by 10 degrees takes 4180 joules.', speak: 'To find heat, use q equals m c delta T. Warming 100 grams of water by 10 degrees takes 4180 joules.' },
    ],
    draw(g, b, t) {
      /* Beat 0: heat flows */
      if (b < 1.05) A(g, 1 - seg(b, 0.94, 1.03), () => {
        const q = io(b, 0.3, 0.9);
        const hot = lerp(80, 50, q), cold = lerp(20, 50, q);
        const block = (x, tmp, col, seed) => {
          const heat = (tmp - 20) / 60;
          g.save();
          Art.round(g, x, 186, 220, 196, 14); g.clip();
          g.fillStyle = col; g.fillRect(x, 186, 220, 196);
          for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) {
            const am = 1 + heat * 7.5;
            Art.atom(g, x + 30 + i * 40 + wander(i * 3 + j + seed, t * 7) * am, 214 + j * 46 + wander(i + j * 3 + seed, t * 7) * am, 15, 'Cu', { label: false });
          }
          g.restore();
          g.strokeStyle = 'rgba(247,242,255,.8)'; g.lineWidth = 3.5; Art.round(g, x, 186, 220, 196, 14); g.stroke();
        };
        block(66, hot, Art.mix('#3A1F66', '#D9431F', (hot - 20) / 60), 0);
        block(290, cold, Art.mix('#3A1F66', '#D9431F', (cold - 20) / 60), 50);
        Art.thermometer(g, 120, 46, 84, (hot + 10) / 100, { w: 13 });
        Art.thermometer(g, 344, 46, 84, (cold + 10) / 100, { w: 13 });
        big(g, `${Math.round(hot)} °C`, 150, 96, { size: 38, align: 'left', color: '#FFB08A' });
        big(g, `${Math.round(cold)} °C`, 374, 96, { size: 38, align: 'left', color: q > 0.95 ? '#FFB08A' : '#7FD8FF' });
        const flow = seg(b, 0.2, 0.3) * (1 - seg(q, 0.9, 1));
        if (flow > 0) {
          for (let i = 0; i < 3; i++) {
            const ph = (t * 0.7 + i / 3) % 1;
            A(g, flow * Math.sin(ph * Math.PI), () => Art.arrow(g, 200 + ph * 60, 240 + i * 50, 290 + ph * 60, 240 + i * 50, { color: C.sun, w: 7, head: 18 }));
          }
          big(g, 'Heat', 286, 164, { size: 30, color: C.sun, alpha: flow });
        }
        if (q >= 1) big(g, 'Same temperature now', 286, 164, { size: 28, color: C.leaf });
        moe(g, 690, 426, 142, 'oops', { flip: true, sweat: true, look: [-1, 0] });
      });
      /* Beat 1: exothermic and endothermic */
      const s1 = seg(b, 1, 1.05) * (1 - seg(b, 1.96, 2.03));
      if (s1 > 0 && b < 2.1) A(g, s1, () => {
        const box = (x, title, col) => {
          panel(g, x, 38, 332, 366, { stroke: col, lw: 3.5, fill: 'rgba(30,10,10,.72)' });
          big(g, title, x + 166, 70, { size: 32, color: col });
        };
        // Exothermic.
        const e = seg(b, 1.06, 1.14);
        A(g, e, () => {
          box(18, 'Exothermic', C.fire);
          const p = eo(b, 1.1, 1.36);
          const fn = hill(g, 42, 100, 284, 200, 60, 174, 16, p, C.fire);
          label(g, 'Reactants', 92, 132, { size: 22, alpha: seg(p, 0.05, 0.3) });
          label(g, 'Products', 232, 246, { size: 22, alpha: seg(p, 0.8, 1) });
          const u = p * 0.95;
          Art.ball(g, 42 + u * 284, fn(u) - 12, 11, C.sun);
          Art.arrow(g, 306, 168, 306, 262, { color: C.sun, w: 5, p: seg(b, 1.28, 1.36) });
          label(g, 'Heat out', 254, 180, { size: 23, color: C.sun, alpha: seg(b, 1.3, 1.38) });
          big(g, 'ΔH negative', 184, 326, { size: 26, color: '#fff', alpha: seg(b, 1.34, 1.42) });
          label(g, 'Burning CH₄: −890 kJ/mol', 184, 368, { size: 23, color: C.dim, alpha: seg(b, 1.38, 1.46) });
          Art.flame(g, 92, 216, 46, t, { kind: 'orange' });
        });
        // Endothermic.
        const n = seg(b, 1.52, 1.6);
        A(g, n, () => {
          box(358, 'Endothermic', '#7FD8FF');
          const p = eo(b, 1.56, 1.8);
          const fn = hill(g, 382, 100, 284, 200, 174, 60, 16, p, '#7FD8FF');
          label(g, 'Reactants', 432, 300, { size: 22, alpha: seg(p, 0.05, 0.3) });
          label(g, 'Products', 612, 132, { size: 22, alpha: seg(p, 0.8, 1) });
          const u = p * 0.95;
          Art.ball(g, 382 + u * 284, fn(u) - 12, 11, C.sun);
          Art.arrow(g, 646, 262, 646, 168, { color: '#7FD8FF', w: 5, p: seg(b, 1.74, 1.82) });
          label(g, 'Heat in', 594, 236, { size: 23, color: '#7FD8FF', alpha: seg(b, 1.74, 1.82) });
          big(g, 'ΔH positive', 524, 326, { size: 26, color: '#fff', alpha: seg(b, 1.78, 1.86) });
          label(g, 'A cold pack in your hand', 524, 368, { size: 23, color: C.dim, alpha: seg(b, 1.82, 1.9) });
        });
        moe(g, 738, 426, 96, 'point', { flip: true, look: [-1, -0.3] });
      });
      /* Beat 2: breaking and making bonds */
      const s2 = seg(b, 2, 2.05) * (1 - seg(b, 2.96, 3.03));
      if (s2 > 0 && b < 3.1) A(g, s2, () => {
        const yL = 270, yT = 96, yR = 362;
        // Levels.
        g.strokeStyle = 'rgba(247,242,255,.34)'; g.lineWidth = 3; g.setLineDash([8, 8]);
        g.beginPath(); g.moveTo(30, yL + 44); g.lineTo(600, yL + 44); g.stroke(); g.setLineDash([]);
        A(g, seg(b, 2.04, 2.12), () => {
          Art.molecule(g, 76, yL, 28, 'CH4', { labels: false, style: 'ball', atomScale: 1.2 });
          Art.molecule(g, 168, yL - 22, 26, 'O2', { labels: false, atomScale: 1.15 });
          Art.molecule(g, 168, yL + 22, 26, 'O2', { labels: false, atomScale: 1.15 });
        });
        const up = io(b, 2.14, 2.34);
        Art.arrow(g, 120, yL - 62, 232, yT + 18, { color: C.red, w: 8, p: up, curve: -16 });
        const lb = seg(b, 2.18, 2.28);
        big(g, 'Breaking bonds', 118, 138, { size: 25, color: '#FF9AA4', alpha: lb });
        label(g, 'costs energy', 118, 170, { size: 25, alpha: lb });
        // Atoms alone at the top: 1 C, 4 H, 4 O.
        const atoms = ['H', 'O', 'H', 'O', 'C', 'O', 'H', 'O', 'H'];
        atoms.forEach((s0, i) => {
          const q = seg(up, 0.5 + i * 0.05, 0.7 + i * 0.05);
          if (q > 0) pop(g, 268 + i * 34, yT, q, () => Art.atom(g, 268 + i * 34 + wander(i, t * 2) * 3, yT + wander(i + 9, t * 2) * 3, s0 === 'H' ? 11 : s0 === 'C' ? 18 : 16, s0, { label: false }));
        });
        label(g, 'All the atoms, alone', 404, 54, { size: 24, color: C.dim, alpha: seg(up, 0.7, 1) });
        const dn = io(b, 2.5, 2.72);
        Art.arrow(g, 560, yT + 18, 610, yR - 62, { color: C.leaf, w: 8, p: dn, curve: -22 });
        const lb2 = seg(b, 2.54, 2.64);
        big(g, 'Making bonds', 690, 168, { size: 25, color: C.leaf, alpha: lb2 });
        label(g, 'releases energy', 690, 200, { size: 25, alpha: lb2 });
        A(g, seg(dn, 0.8, 1), () => {
          Art.molecule(g, 550, yR, 28, 'CO2', { labels: false, atomScale: 1.15 });
          Art.molecule(g, 652, yR - 20, 24, 'H2O', { labels: false, atomScale: 1.15 });
          Art.molecule(g, 652, yR + 22, 24, 'H2O', { labels: false, atomScale: 1.15 });
        });
        const net = seg(b, 2.76, 2.86);
        Art.arrow(g, 362, yL + 44, 362, yR + 34, { color: C.sun, w: 6, p: net });
        big(g, 'Net: energy out', 262, yR + 18, { size: 26, color: C.sun, alpha: net });
        moe(g, 738, 426, 86, net > 0.5 ? 'cheer' : 'think', { flip: true, look: [-1, -0.4] });
      });
      /* Beat 3: q = mcΔT */
      const s3 = seg(b, 3, 3.05);
      if (s3 > 0) A(g, s3, () => {
        const q = io(b, 3.46, 3.86);
        Art.bunsen(g, 130, 424, 0.72, { air: 1, flame: seg(b, 3.1, 3.2), t });
        g.strokeStyle = '#9A94B3'; g.lineWidth = 5; g.lineCap = 'round';
        g.beginPath(); g.moveTo(60, 282); g.lineTo(200, 282); g.moveTo(74, 282); g.lineTo(56, 424); g.moveTo(186, 282); g.lineTo(204, 424); g.stroke();
        Art.beaker(g, 130, 278, 128, 140, { level: 0.68, liquid: C.water, inside: (gg, box) => Art.bubbles(gg, box.x0 + 14, box.x1 - 14, box.bottom - 4, box.top + 6, t * 0.5, { n: 4, r: 3 }) });
        Art.thermometer(g, 170, 66, 186, lerp(0.34, 0.54, q), { w: 12 });
        big(g, `${lerp(20, 30, q).toFixed(1)} °C`, 244, 100, { size: 32, align: 'left', color: '#FFB08A' });
        const f = seg(b, 3.06, 3.16);
        pop(g, 500, 176, f, () => big(g, 'q = m c ΔT', 500, 176, { size: 58, color: C.sun }));
        label(g, 'heat = mass × specific heat × temperature change', 500, 226, { size: 21, color: '#fff', alpha: seg(b, 3.14, 3.24) });
        const n = seg(b, 3.44, 3.54);
        big(g, '(100. g)(4.18 J/g·°C)(10.0 °C)', 500, 278, { size: 26, alpha: n });
        big(g, '= 4180 J', 500, 336, { size: 54, color: '#FF8AC4', alpha: seg(b, 3.74, 3.84) });
        moe(g, 738, 426, 104, b > 3.8 ? 'cheer' : 'point', { flip: true, look: [-1, -0.2] });
      });
    },
  });

  /* 10. Electrons and orbitals */
  function coloredFlame(g, x, y, h, t, col) {
    const layers = [[1, col, 0.82], [0.72, Art.mix(col, '#ffffff', 0.35), 0.9], [0.42, Art.mix(col, '#ffffff', 0.75), 1]];
    const f1 = Math.sin(t * 13 + x) * 0.05 + Math.sin(t * 21 + x) * 0.03;
    const sway = Math.sin(t * 9 + x) * h * 0.035 + Math.sin(t * 17) * h * 0.02;
    Art.glow(g, x, y - h * 0.45, h * 1.05, col, 0.35);
    layers.forEach(([s, c, a], i) => {
      const hh = h * s * (1 + f1 * (i + 1) * 0.7), w = h * 0.3 * s;
      g.fillStyle = Art.alpha(c, a);
      g.beginPath(); g.moveTo(x, y);
      g.bezierCurveTo(x - w * 1.25, y - hh * 0.12, x - w * 0.95 + sway * 0.3, y - hh * 0.56, x + sway * (1 + i * 0.25), y - hh);
      g.bezierCurveTo(x + w * 0.95 + sway * 0.3, y - hh * 0.56, x + w * 1.25, y - hh * 0.12, x, y);
      g.fill();
    });
  }
  // Electron clouds sampled from the real probability shapes (1s and 2p), then cached as sprites.
  const CLOUDS = {};
  function cloud(kind) {
    if (CLOUDS[kind]) return CLOUDS[kind];
    const S = 500;
    const c = document.createElement('canvas'); c.width = c.height = S;
    const x = c.getContext('2d');
    x.translate(S / 2, S / 2);
    x.globalCompositeOperation = 'lighter';
    let seed = kind === 's' ? 11 : 501;
    const r1 = () => rand((seed += 1.37));
    const gamma = (k) => { let s = 0; for (let i = 0; i < k; i++) s -= Math.log(Math.max(1e-6, r1())); return s; };
    for (let i = 0; i < 2400; i++) {
      let px, py;
      if (kind === 's') {
        const r = gamma(3) * 34, ct = 2 * r1() - 1, st = Math.sqrt(1 - ct * ct), ph = r1() * TAU;
        px = r * st * Math.cos(ph); py = r * ct;
      } else {
        const r = gamma(5) * 24;
        let ct = 0;
        for (let k = 0; k < 40; k++) { ct = 2 * r1() - 1; if (r1() < ct * ct) break; }
        const st = Math.sqrt(1 - ct * ct), ph = r1() * TAU;
        px = r * ct; py = r * st * Math.cos(ph);
      }
      if (Math.abs(px) > 245 || Math.abs(py) > 245) continue;
      x.fillStyle = 'rgba(70,225,255,.46)';
      x.beginPath(); x.arc(px, py, 1.4 + r1() * 1.8, 0, TAU); x.fill();
    }
    return (CLOUDS[kind] = c);
  }
  function waveTo(g, x0, y0, x1, y1, q, col) {
    if (q <= 0) return;
    const d = Math.hypot(x1 - x0, y1 - y0), nx = (x1 - x0) / d, ny = (y1 - y0) / d;
    g.save();
    g.strokeStyle = col; g.lineWidth = 4.5; g.lineCap = 'round';
    g.beginPath();
    const lead = q, tail = Math.max(0, q - 0.5);
    for (let u = tail; u <= lead; u += 0.008) {
      const a = Math.sin(u * d * 0.2) * 11, px = x0 + nx * d * u - ny * a, py = y0 + ny * d * u + nx * a;
      if (u === tail) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.stroke();
    g.restore();
  }
  CH.push({
    id: 'electrons', title: 'Electrons and orbitals', depth: 'Crystal seam', layer: LAYER.crystal,
    lessons: ['light', 'bohr', 'orbitals', 'configurations', 'trends'],
    enter: { x: 722, y: 426, h: 112, flip: true },
    exit: { x: 730, y: 426, h: 112 },
    beats: [
      { say: 'Crystal seam. Why does each element burn its own <b>color</b>? Electrons.' },
      { say: 'Electrons sit at set <b>energy levels</b>, like rungs on a ladder. One jumps up, falls back, and gives off light of one exact color.' },
      { say: 'The better picture is a cloud, not a circle. An <b>orbital</b> shows where an electron probably is. s is a sphere, p a dumbbell.' },
      { say: 'Electrons fill the lowest levels first, two per orbital. Oxygen\'s eight go <b>1s² 2s² 2p⁴</b>.', speak: "Electrons fill the lowest levels first, two per orbital. Oxygen's eight go 1 s 2, 2 s 2, 2 p 4." },
      { say: 'The outer ones are <b>valence electrons</b>, and they decide how an atom behaves.' },
    ],
    draw(g, b, t) {
      /* Beat 0: flame colors */
      if (b < 1.05) A(g, 1 - seg(b, 0.94, 1.03), () => {
        const F0 = [
          [112, 'Sodium', 'Na', '#FFC21A'], [278, 'Strontium', 'Sr', '#FF2D55'],
          [444, 'Copper', 'Cu', '#2DE8A8'], [610, 'Potassium', 'K', '#C58CFF'],
        ];
        F0.forEach(([x, name, sym, col], i) => {
          const q = seg(b, 0.06 + i * 0.09, 0.16 + i * 0.09);
          if (q <= 0) return;
          Art.bunsen(g, x, 424, 0.9, { flame: 0, t });
          coloredFlame(g, x, 424 - 83, 150 * q, t, col);
          big(g, sym, x, 124, { size: 44, color: col, alpha: q });
          label(g, name, x, 80, { size: 25, alpha: q });
        });
        moe(g, 722, 426, 112, 'think', { flip: true, look: [-1, -0.6] });
      });
      /* Beat 1: Bohr's ladder */
      const s1 = seg(b, 1, 1.05) * (1 - seg(b, 1.96, 2.03));
      if (s1 > 0 && b < 2.1) A(g, s1, () => {
        const up = io(b, 1.42, 1.5), down = io(b, 1.62, 1.68);
        const lvl = 2 + up - down; // n goes 2, then 3, then back to 2.
        const cx = 176, cy = 212;
        const radius = (n) => [0, 52, 104, 162][Math.round(n)];
        [1, 2, 3].forEach((n) => { g.strokeStyle = n === Math.round(lvl) ? 'rgba(53,230,255,.8)' : 'rgba(53,230,255,.3)'; g.lineWidth = 2.5; g.beginPath(); g.arc(cx, cy, radius(n), 0, TAU); g.stroke(); });
        Art.ball(g, cx, cy, 18, C.proton);
        Art.text(g, '+', cx, cy, { size: 25, color: '#fff' });
        const rr = lvl <= 2 ? 104 : lerp(104, 162, lvl - 2);
        const an = t * 1.2;
        Art.electron(g, cx + Math.cos(an) * rr, cy + Math.sin(an) * rr, 10);
        // Incoming energy.
        const inq = seg(b, 1.28, 1.44);
        if (inq > 0 && inq < 1) waveTo(g, 8, 26, cx + Math.cos(an) * 104, cy + Math.sin(an) * 104, inq, C.sun);
        // Ladder with rungs at hydrogen's real relative energies.
        const yOf = (n) => 336 - (1 - 1 / (n * n)) * 270;
        const LX = 430, RX = 560;
        g.strokeStyle = '#C9A87A'; g.lineWidth = 7; g.lineCap = 'round';
        g.beginPath(); g.moveTo(LX, 48); g.lineTo(LX, 352); g.moveTo(RX, 48); g.lineTo(RX, 352); g.stroke();
        [1, 2, 3].forEach((n) => {
          g.strokeStyle = n === Math.round(lvl) ? C.sun : '#C9A87A'; g.lineWidth = 8;
          g.beginPath(); g.moveTo(LX, yOf(n)); g.lineTo(RX, yOf(n)); g.stroke();
          label(g, `n = ${n}`, LX - 12, yOf(n), { size: 23, align: 'right' });
        });
        const ey = lvl <= 2 ? yOf(2) : lerp(yOf(2), yOf(3), lvl - 2);
        Art.electron(g, (LX + RX) / 2, ey - 16, 13);
        big(g, 'Energy levels', 495, 26, { size: 24, color: C.sun, alpha: seg(b, 1.1, 1.2) });
        // Falling back gives one exact color.
        const outq = seg(b, 1.62, 1.82);
        const sx0 = 350, sx1 = 650, sy = 396;
        const nm = (w) => lerp(sx0, sx1, (w - 380) / 320);
        const lit = seg(b, 1.8, 1.84);
        if (outq > 0 && outq < 1) waveTo(g, cx + 80, cy + 60, nm(656), sy - 12, outq * 1.5, '#FF4040');
        g.fillStyle = '#0A0414'; g.strokeStyle = 'rgba(247,242,255,.55)'; g.lineWidth = 2.5;
        Art.round(g, sx0 - 8, sy - 19, sx1 - sx0 + 16, 38, 8); g.fill(); g.stroke();
        A(g, lit, () => {
          g.fillStyle = '#FF3030'; g.fillRect(nm(656) - 3, sy - 16, 6, 32);
          Art.glow(g, nm(656), sy, 24, '#FF3030', 0.7);
        });
        const others = seg(b, 1.84, 1.92);
        A(g, others, () => {
          [[486, '#35E0FF'], [434, '#5B6CFF'], [410, '#9A4DFF']].forEach(([w, col]) => { g.fillStyle = col; g.fillRect(nm(w) - 2.5, sy - 16, 5, 32); });
        });
        label(g, '656 nm', nm(656) + 18, sy - 34, { size: 23, color: '#FF8080', alpha: lit });
        label(g, "Hydrogen's colors", 442, sy - 34, { size: 23, alpha: others });
        label(g, 'A model that only fits hydrogen', 170, 402, { size: 20, color: C.dim, alpha: seg(b, 1.1, 1.2) });
        moe(g, 730, 426, 112, 'point', { flip: true, look: [-1, -0.5] });
      });
      /* Beat 2: clouds */
      const s2 = seg(b, 2, 2.05) * (1 - seg(b, 2.96, 3.03));
      if (s2 > 0 && b < 3.1) A(g, s2, () => {
        const scx = 196, pcx = 500, cy = 214;
        const ring = 1 - seg(b, 2.28, 2.38);
        A(g, ring, () => {
          g.strokeStyle = 'rgba(53,230,255,.8)'; g.lineWidth = 3; g.beginPath(); g.arc(scx, cy, 110, 0, TAU); g.stroke();
          const an = t * 1.2;
          Art.electron(g, scx + Math.cos(an) * 110, cy + Math.sin(an) * 110, 10);
          Art.ball(g, scx, cy, 12, C.proton);
          label(g, 'Not really a path', scx, 370, { size: 26, color: '#FF9AA4' });
        });
        Art.strike(g, scx - 124, cy + 124, scx + 124, cy - 124, seg(b, 2.14, 2.24) * ring, C.red, 8);
        const sq = seg(b, 2.3, 2.46);
        A(g, sq, () => {
          g.save(); g.globalCompositeOperation = 'lighter';
          g.drawImage(cloud('s'), scx - 175, cy - 175, 350, 350);
          g.restore();
          Art.ball(g, scx, cy, 5, C.sun);
          big(g, 's orbital', scx, 370, { size: 30, color: C.cyan, alpha: seg(b, 2.62, 2.72) });
          label(g, 'a sphere', scx, 404, { size: 25, alpha: seg(b, 2.62, 2.72) });
        });
        const pq = seg(b, 2.72, 2.86);
        A(g, pq, () => {
          g.save(); g.globalCompositeOperation = 'lighter';
          g.drawImage(cloud('p'), pcx - 175, cy - 175, 350, 350);
          g.restore();
          Art.ball(g, pcx, cy, 5, C.sun);
          big(g, 'p orbital', pcx, 370, { size: 30, color: C.cyan });
          label(g, 'a dumbbell', pcx, 404, { size: 25 });
        });
        big(g, 'Where the electron probably is', 348, 40, { size: 28, color: C.sun, alpha: seg(b, 2.44, 2.54) });
        moe(g, 722, 426, 112, 'wow', { flip: true, look: [-1, 0] });
      });
      /* Beats 3 and 4: filling up */
      const s3 = seg(b, 3, 3.05);
      if (s3 > 0) A(g, s3, () => {
        const boxes = [
          { id: '1s', x: 66, y: 306 },
          { id: '2s', x: 172, y: 222 },
          { id: '2p', x: 290, y: 150 }, { id: '2p', x: 346, y: 150 }, { id: '2p', x: 402, y: 150 },
        ];
        const bw = 54, bh = 58;
        boxes.forEach((bx) => {
          g.fillStyle = 'rgba(16,8,32,.72)'; g.strokeStyle = 'rgba(247,242,255,.8)'; g.lineWidth = 3;
          Art.round(g, bx.x, bx.y, bw, bh, 8); g.fill(); g.stroke();
        });
        label(g, '1s', 66 + bw / 2, 306 + bh + 22, { size: 26 });
        label(g, '2s', 172 + bw / 2, 222 + bh + 22, { size: 26 });
        label(g, '2p', 346 + bw / 2, 150 + bh + 22, { size: 26 });
        // Order: 1s up, 1s down, 2s up, 2s down, then one in each 2p, then a pair.
        const fills = [[0, 1], [0, -1], [1, 1], [1, -1], [2, 1], [3, 1], [4, 1], [2, -1]];
        fills.forEach(([k, d], i) => {
          const q = bk(b, 3.1 + i * 0.075, 3.18 + i * 0.075);
          if (q <= 0) return;
          const bx = boxes[k];
          const x = bx.x + bw / 2 + (d > 0 ? -10 : 10), y = bx.y + bh / 2;
          const fromY = y - 40 * (1 - q);
          A(g, seg(q, 0, 0.6), () => {
            Art.arrow(g, x, fromY + (d > 0 ? 18 : -18), x, fromY + (d > 0 ? -18 : 18), { color: C.electron, w: 5, head: 13 });
          });
        });
        const e1 = seg(b, 3.2, 3.3), e2 = seg(b, 3.34, 3.44), e3 = seg(b, 3.62, 3.72);
        let cfg = '';
        if (e1 > 0) cfg += '1s²';
        if (e2 > 0) cfg += ' 2s²';
        if (e3 > 0) cfg += ' 2p⁴';
        if (cfg) big(g, cfg, 26, 72, { size: 48, align: 'left', color: C.sun });
        const val = seg(b, 4.06, 4.2);
        if (val > 0) {
          g.font = `400 48px ${Art.FONT_DISPLAY}`;
          const w1 = g.measureText('1s² ').width, w2 = g.measureText('1s² 2s² 2p⁴').width;
          A(g, val, () => { g.strokeStyle = C.pink; g.lineWidth = 4; Art.round(g, 26 + w1 - 8, 40, w2 - w1 + 16, 62, 14); g.stroke(); });
        }
        label(g, 'Energy goes up', 118, 130, { size: 23, color: C.dim, alpha: seg(b, 3.1, 3.2) });
        // Oxygen, with its two shells.
        const ox = 582, oy = 200;
        const oq = seg(b, 3.7, 3.82);
        pop(g, ox, oy, oq, () => {
          g.strokeStyle = 'rgba(53,230,255,.35)'; g.lineWidth = 2.5;
          g.beginPath(); g.arc(ox, oy, 70, 0, TAU); g.stroke();
          g.strokeStyle = val > 0.3 ? C.pink : 'rgba(53,230,255,.35)'; g.lineWidth = val > 0.3 ? 4 : 2.5;
          g.beginPath(); g.arc(ox, oy, 110, 0, TAU); g.stroke();
          for (let i = 0; i < 2; i++) { const an = t * 1.4 + i * Math.PI; Art.electron(g, ox + Math.cos(an) * 70, oy + Math.sin(an) * 70, 7); }
          for (let i = 0; i < 6; i++) { const an = -t * 0.6 + (i / 6) * TAU; Art.electron(g, ox + Math.cos(an) * 110, oy + Math.sin(an) * 110, 8 + val * 2); }
          Art.atom(g, ox, oy, 46, 'O', { face: val > 0.5 ? 'grin' : 'happy', t, seed: 2 });
        });
        big(g, '8 electrons', ox, 340, { size: 28, alpha: seg(b, 3.76, 3.86) * (1 - val) });
        big(g, '6 valence electrons', ox - 20, 340, { size: 28, color: '#FF8AC4', alpha: val });
        moe(g, 735, 426, 104, b > 4 ? 'point' : 'happy', { flip: true, look: [-1, -0.6] });
      });
    },
  });

  /* 11. Bonds and shapes */
  const proj3 = (v, ry, rx) => {
    const c = Math.cos(ry), s = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
    const x = v[0] * c + v[2] * s, z0 = -v[0] * s + v[2] * c;
    const y = v[1] * cx - z0 * sx, z = v[1] * sx + z0 * cx;
    return [x, y, z];
  };
  function balloon(g, x0, y0, x1, y1, w, col, alpha) {
    const a = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0);
    if (L < 2) return;
    g.save(); g.translate(x0, y0); g.rotate(a);
    g.globalAlpha *= alpha;
    const gr = g.createRadialGradient(L * 0.62, -w * 0.3, 2, L * 0.55, 0, L * 0.72);
    gr.addColorStop(0, Art.mix(col, '#ffffff', 0.6)); gr.addColorStop(0.5, col); gr.addColorStop(1, Art.mix(col, '#12062A', 0.42));
    g.fillStyle = gr; g.strokeStyle = 'rgba(16,6,34,.7)'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(0, 0);
    g.bezierCurveTo(L * 0.2, -w * 1.05, L * 0.98, -w * 1.1, L, 0);
    g.bezierCurveTo(L * 0.98, w * 1.1, L * 0.2, w * 1.05, 0, 0);
    g.fill(); g.stroke();
    g.restore();
  }
  const SHAPES = {
    line: { dirs: [[1, 0, 0], [-1, 0, 0]], center: 'C', outer: 'O', order: 2, f: 'CO2', name: 'A line', angle: '180°' },
    tri: { dirs: [[0, -1, 0], [Math.sqrt(3) / 2, 0.5, 0], [-Math.sqrt(3) / 2, 0.5, 0]], center: 'B', outer: 'F', order: 1, f: 'BF3', name: 'A triangle', angle: '120°' },
    tet: { dirs: [[0, -1, 0], [0.943, 0.333, 0], [-0.471, 0.333, 0.816], [-0.471, 0.333, -0.816]], center: 'C', outer: 'H', order: 1, f: 'CH4', name: 'A tetrahedron', angle: '109.5°' },
  };
  function shape3D(g, cx, cy, sh, R, morph, ry, rx, t) {
    const cols = ['#FF7DBE', '#FFD23F', '#7FE3FF', '#8BEB9E'];
    const pts = sh.dirs.map((d, i) => ({ i, p: proj3(d, ry, rx) })).sort((a, c) => a.p[2] - c.p[2]);
    const draw = (e) => {
      const persp = 1 + e.p[2] * 0.16;
      const x = cx + e.p[0] * R * persp, y = cy + e.p[1] * R * persp;
      if (morph < 1) balloon(g, cx, cy, x, y, 25 * persp, cols[e.i], 1 - morph);
      if (morph > 0) A(g, morph, () => {
        Art.bond(g, cx, cy, x, y, { width: 6, order: sh.order });
        Art.atom(g, x, y, (sh.outer === 'H' ? 19 : 26) * persp, sh.outer, { label: sh.outer });
      });
    };
    pts.filter((e) => e.p[2] < 0).forEach(draw);
    if (morph > 0) A(g, morph, () => Art.atom(g, cx, cy, 25, sh.center, { face: 'happy', t, seed: 4 }));
    else { g.fillStyle = '#1A0F2E'; g.beginPath(); g.arc(cx, cy, 7, 0, TAU); g.fill(); }
    pts.filter((e) => e.p[2] >= 0).forEach(draw);
  }
  CH.push({
    id: 'bonds', title: 'Bonds and shapes', depth: 'Bedrock', layer: LAYER.bedrock,
    lessons: ['ionic', 'covalent', 'lewis', 'vsepr', 'hybrid'],
    enter: { x: 400, y: 438, h: 78 },
    exit: { x: 730, y: 426, h: 112 },
    beats: [
      { say: 'Bedrock. Atoms bond to fill their outer shells. Metals hand electrons to nonmetals: <b>ionic</b>. Nonmetals share: <b>covalent</b>.' },
      { say: 'Sharing is not always fair. Oxygen pulls harder than hydrogen, so the bond is <b>polar</b>.' },
      { say: 'Electron groups push as far apart as they can, and that sets the <b>shape</b>. Two make a line, three a triangle, four a tetrahedron.' },
      { say: 'Water has four groups, but two are <b>lone pairs</b>, so it looks bent. That bend is why it could tug on our salt.' },
    ],
    draw(g, b, t) {
      /* Beat 0 */
      if (b < 1.05) A(g, 1 - seg(b, 0.94, 1.03), () => {
        const wY = 34, wH = 246;
        const q1 = io(b, 0.34, 0.5);
        const l = seg(b, 0.28, 0.36);
        A(g, l, () => {
          win(g, 22, wY, 364, wH, () => {
            const nx = 104, cx2 = 300, cy = wY + 118;
            Art.atom(g, nx, cy, lerp(40, 30, q1), 'Na', { face: q1 > 0.9 ? 'happy' : 'sad', t, seed: 1, look: [1, 0], charge: q1 > 0.9 ? '+' : null });
            Art.atom(g, cx2, cy, lerp(44, 52, q1), 'Cl', { face: q1 > 0.9 ? 'grin' : 'grumpy', t, seed: 2, look: [-1, 0], charge: q1 > 0.9 ? '-' : null });
            const ex = lerp(nx + 46, cx2 - 62, q1), ey = cy - Math.sin(q1 * Math.PI) * 54;
            Art.electron(g, ex, ey, 10);
          }, { rim: '#FFB08A' });
          big(g, 'Ionic', 204, 308, { size: 34, color: '#FFB08A' });
          label(g, 'Electrons handed over', 204, 346, { size: 25 });
        });
        const c = seg(b, 0.66, 0.74);
        A(g, c, () => {
          win(g, 414, wY, 364, wH, () => {
            const cx = 596, cy = wY + 118, d = lerp(84, 44, eo(b, 0.68, 0.82));
            Art.glow(g, cx, cy, 120, C.cyan, 0.36);
            Art.atom(g, cx - d, cy, 44, 'H', { face: 'happy', t, seed: 3, look: [1, 0] });
            Art.atom(g, cx + d, cy, 44, 'H', { face: 'happy', t, seed: 4, look: [-1, 0] });
            const wob = Math.sin(t * 3) * 7;
            Art.electron(g, cx - 2 + wob, cy - 15, 9);
            Art.electron(g, cx + 2 - wob, cy + 15, 9);
          }, { rim: C.cyan });
          big(g, 'Covalent', 596, 308, { size: 34, color: C.cyan });
          label(g, 'Electrons shared', 596, 346, { size: 25 });
        });
        moe(g, 400, 438, 78, b > 0.66 ? 'wow' : 'happy', { look: [b > 0.66 ? 1 : -1, -0.4] });
      });
      /* Beat 1: tug of war */
      const s1 = seg(b, 1, 1.06) * (1 - seg(b, 1.95, 2.03));
      if (s1 > 0 && b < 2.1) A(g, s1, () => {
        const pull = io(b, 1.14, 1.5);
        const shift = lerp(0, 64, pull) + Math.sin(t * 3) * 4 * pull;
        const hx = 152 + shift * 0.2, ox = 590 + shift * 0.2, y = 204;
        g.strokeStyle = '#1A0F2E'; g.lineWidth = 13; g.lineCap = 'round';
        const rope = () => { g.beginPath(); g.moveTo(hx + 30, y); g.quadraticCurveTo(370, y + 14 + Math.sin(t * 4) * 3, ox - 50, y); g.stroke(); };
        rope();
        g.strokeStyle = '#D9B98C'; g.lineWidth = 8; rope();
        const mid = 370 + shift;
        Art.glow(g, mid, y + 4, 56, C.cyan, 0.45);
        Art.electron(g, mid - 16, y + 3, 11);
        Art.electron(g, mid + 16, y + 3, 11);
        label(g, 'The shared electrons', 370, 148, { size: 25, color: C.cyan });
        Art.arrow(g, 370, 166, mid, y - 16, { color: C.cyan, w: 4, p: seg(b, 1.1, 1.2) });
        Art.atom(g, hx, y, 50, 'H', { face: pull > 0.5 ? 'sad' : 'grumpy', t, seed: 1, look: [1, 0] });
        Art.atom(g, ox, y, 80, 'O', { face: pull > 0.5 ? 'grin' : 'grumpy', t, seed: 2, look: [-1, 0] });
        const a = seg(b, 1.3, 1.42);
        Art.pill(g, 'δ+', hx, 118, { size: 30, font: 'display', color: C.pink, text: '#fff', alpha: a });
        Art.pill(g, 'δ−', ox, 90, { size: 30, font: 'display', color: C.cyan, text: '#06222B', alpha: a });
        big(g, `Pull: ${EL.H.en.toFixed(2)}`, hx, 292, { size: 28, alpha: seg(b, 1.16, 1.28) });
        big(g, `Pull: ${EL.O.en.toFixed(2)}`, ox, 318, { size: 28, color: '#FF8A94', alpha: seg(b, 1.2, 1.32) });
        label(g, 'Chemists call the pull electronegativity', 370, 370, { size: 24, alpha: seg(b, 1.5, 1.62) });
                moe(g, 722, 426, 102, 'think', { flip: true, look: [-1, -0.5] });
      });
      /* Beat 2: balloons become molecules */
      const s2 = seg(b, 2, 2.05) * (1 - seg(b, 2.96, 3.03));
      if (s2 > 0 && b < 3.1) A(g, s2, () => {
        const items = [[126, SHAPES.line, 2.14], [354, SHAPES.tri, 2.42], [582, SHAPES.tet, 2.66]];
        items.forEach(([x, sh, d], i) => {
          const q = seg(b, d, d + 0.1);
          if (q <= 0) return;
          const morph = io(b, 2.74, 2.88);
          const ry = (i === 2 ? 0.5 + t * 0.5 : Math.sin(t * 0.5 + i) * 0.45), rx = i === 2 ? 0.28 : Math.sin(t * 0.4 + i) * 0.2;
          pop(g, x, 170, q, () => shape3D(g, x, 170, sh, 100, morph, ry, rx, t));
          big(g, sh.name, x, 326, { size: 30, color: C.sun, alpha: q });
          big(g, sh.angle, x, 366, { size: 32, alpha: seg(b, d + 0.08, d + 0.16) });
          A(g, morph, () => Art.formula(g, sh.f, x, 404, { size: 28, colorize: true, halo: true }));
        });
        big(g, 'Groups spread out as far as they can', 370, 34, { size: 26, color: '#fff', alpha: seg(b, 2.04, 2.12) * (1 - seg(b, 2.8, 2.88)) });
        moe(g, 738, 426, 92, 'point', { flip: true, look: [-1, -0.3] });
      });
      /* Beat 3: water really is bent */
      const s3 = seg(b, 3, 3.05);
      if (s3 > 0) A(g, s3, () => {
        const cx = 262, cy = 196;
        const half = (104.5 / 2) * Math.PI / 180;
        const dirs = [
          { d: [Math.sin(half), Math.cos(half), 0], kind: 'H' },
          { d: [-Math.sin(half), Math.cos(half), 0], kind: 'H' },
          { d: [0.62, -0.68, 0.38], kind: 'L' },
          { d: [-0.62, -0.68, -0.38], kind: 'L' },
        ];
        const ry = Math.sin(t * 0.55) * 0.14, rx = 0;
        const R = 124;
        const P = dirs.map((e, i) => { const p = proj3(e.d, ry, rx), k = 1 + p[2] * 0.14; return Object.assign({}, e, { i, z: p[2], x: cx + p[0] * R * k, y: cy + p[1] * R * k, k }); }).sort((a, c) => a.z - c.z);
        const lq = seg(b, 3.26, 3.38);
        const atomq = seg(b, 3.06, 3.16);
        const each = (e) => {
          if (e.kind === 'L') {
            A(g, lq, () => {
              balloon(g, cx, cy, cx + (e.x - cx) * 1.14, cy + (e.y - cy) * 1.14, 30 * e.k, C.violet, 0.8);
              [-1, 1].forEach((s0) => Art.electron(g, cx + (e.x - cx) * 0.92 + s0 * 10, cy + (e.y - cy) * 0.92, 6));
            });
          } else A(g, atomq, () => Art.atom(g, e.x, e.y, 38 * e.k, 'H', { face: 'happy', t, seed: e.i, look: [0, -0.5] }));
        };
        P.filter((e) => e.kind === 'L').forEach(each);
        A(g, atomq, () => P.filter((e) => e.kind === 'H').forEach((e) => Art.bond(g, cx, cy, e.x, e.y, { width: 9 })));
        A(g, atomq, () => Art.atom(g, cx, cy, 56, 'O', { face: 'happy', t, seed: 9, look: [0.5, 0] }));
        P.filter((e) => e.kind === 'H').forEach(each);
        // The angle, drawn right on the molecule.
        const Hs = P.filter((e) => e.kind === 'H');
        const a1 = Math.atan2(Hs[0].y - cy, Hs[0].x - cx), a2 = Math.atan2(Hs[1].y - cy, Hs[1].x - cx);
        const aq = seg(b, 3.46, 3.56);
        A(g, aq, () => {
          g.strokeStyle = C.sun; g.lineWidth = 5; g.lineCap = 'round';
          g.beginPath(); g.arc(cx, cy, 78, Math.min(a1, a2), Math.max(a1, a2)); g.stroke();
          big(g, '104.5°', cx, cy + 108, { size: 30, color: C.sun });
        });
        const list = [
          ['4 electron groups', C.sun, 3.08, 30, 92],
          ['2 bonds', '#fff', 3.2, 26, 136],
          ['2 lone pairs', C.violet, 3.3, 26, 172],
          ['So the shape is bent', '#fff', 3.46, 26, 216],
        ];
        list.forEach(([s0, col, d, size, y]) => big(g, s0, 572, y, { size, color: col, alpha: seg(b, d, d + 0.1) }));
        const end = seg(b, 3.66, 3.78);
        A(g, end, () => {
          Art.pill(g, 'One end δ−, the other δ+', 572, 270, { size: 24, font: 'display', color: C.plum2, text: '#fff', stroke: C.cyan });
          big(g, 'Bent means polar', 572, 322, { size: 32, color: '#FF8AC4' });
        });
        moe(g, 730, 426, 112, 'point', { flip: true, look: [-1, -0.2] });
      });
    },
  });

  /* 12. Gases */
  function dial(g, x, y, r, frac, text) {
    g.fillStyle = '#F4F0FF'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 4;
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.stroke();
    const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25;
    g.strokeStyle = '#8878A8'; g.lineWidth = 3; g.lineCap = 'round';
    for (let i = 0; i <= 8; i++) {
      const a = lerp(a0, a1, i / 8);
      g.beginPath(); g.moveTo(x + Math.cos(a) * r * 0.76, y + Math.sin(a) * r * 0.76); g.lineTo(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9); g.stroke();
    }
    const n = lerp(a0, a1, clamp(frac));
    g.strokeStyle = C.red; g.lineWidth = 6;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(n) * r * 0.72, y + Math.sin(n) * r * 0.72); g.stroke();
    g.fillStyle = '#1A0F2E'; g.beginPath(); g.arc(x, y, 8, 0, TAU); g.fill();
    Art.text(g, text, x, y + r * 0.56, { font: 'display', size: 24, color: '#1A0F2E' });
  }
  CH.push({
    id: 'gases', title: 'Gases', depth: 'The gas pocket', layer: LAYER.gas,
    lessons: ['gas-laws', 'ideal-gas', 'kmt'],
    enter: { x: 84, y: 426, h: 130 },
    exit: { x: 722, y: 426, h: 110 },
    beats: [
      { say: 'A gas pocket. Do not light anything. Particles fly around, and <b>pressure</b> is just them hitting the walls.' },
      { say: 'Squeeze to half the volume, and pressure doubles. <b>Boyle\'s law</b>.' },
      { say: 'Double the kelvin temperature, and the volume doubles. <b>Charles\'s law</b>. Always use kelvin.' },
      { say: 'One equation holds it all: <b>PV = nRT</b>. One mole at 0 degrees Celsius and 1 atmosphere fills 22.4 liters.', speak: 'One equation holds it all: P V equals n R T. One mole at 0 degrees Celsius and 1 atmosphere fills 22.4 liters.' },
    ],
    draw(g, b, t) {
      /* Beats 0 to 2 share one piston. */
      const pistonA = 1 - seg(b, 2.94, 3.03);
      if (pistonA > 0 && b < 3.1) A(g, pistonA, () => {
        const squeeze = io(b, 1.1, 1.4), heat = io(b, 2.12, 2.6);
        const pos = lerp(lerp(0.88, 0.4, squeeze), 0.88, heat); // Gas height is 20 + 250 × pos: 240, then 120, then 240.
        const tempK = lerp(300, 600, heat);
        const cx = 330, baseY = 396;
        const flame = seg(b, 2.04, 2.16);
        if (flame > 0) [270, 330, 390].forEach((x, i) => Art.flame(g, x, 426, 30 * flame, t + i, { kind: 'blue', wide: 1 }));
        g.strokeStyle = '#9A94B3'; g.lineWidth = 6; g.lineCap = 'round';
        g.beginPath(); g.moveTo(216, 396); g.lineTo(202, 426); g.moveTo(444, 396); g.lineTo(458, 426); g.stroke();
        // Hits come more often in a smaller box and when the particles are hotter.
        const fast = 4.2 * clamp(Math.min(b, 2.3) - 1.26, 0, 1) + 2.4 * Math.max(0, b - 2.3);
        Art.piston(g, cx, baseY, 250, 300, pos, {
          inside(gg, box) {
            const hh = box.bottom - box.top;
            for (let i = 0; i < 12; i++) {
              const vx = 0.5 + (i % 4) * 0.022, vy = 0.56 + (i % 3) * 0.026;
              const fx = t * vx + (((i * 5) % 12) / 12) * 2 + fast * vx * 0.3, fy = t * vy + (((i * 7) % 12) / 12) * 2 + fast * vy;
              const ux = tri(fx), uy = tri(fy);
              const px = box.x0 + 20 + (box.x1 - box.x0 - 40) * ux, py = box.bottom - 20 - (hh - 40) * uy;
              Art.molecule(gg, px, py, 19, 'N2', { style: 'fill', atomScale: 1.28, labels: false, rot: t * (1.3 + i * 0.1) + i });
              // A little flash wherever a particle meets a wall. That is pressure.
              if (uy > 0.93) Art.glow(gg, px, box.top + 8, 26, C.sun, (uy - 0.93) * 11);
              else if (uy < 0.07) Art.glow(gg, px, box.bottom - 6, 26, C.sun, (0.07 - uy) * 11);
              if (ux > 0.95) Art.glow(gg, box.x1 - 6, py, 26, C.sun, (ux - 0.95) * 14);
              else if (ux < 0.05) Art.glow(gg, box.x0 + 6, py, 26, C.sun, (0.05 - ux) * 14);
            }
          },
        });
        const P = lerp(1, 2, squeeze);
        dial(g, 645, 118, 70, (P - 0.5) / 2.2, `${P.toFixed(1)} atm`);
        Art.thermometer(g, 506, 90, 204, 0.18 + 0.6 * ((tempK - 300) / 300), { w: 14 });
        big(g, `${Math.round(tempK)} K`, 506, 340, { size: 30, color: heat > 0 ? '#FFB08A' : C.ink });
        const a0 = seg(b, 0.2, 0.3) * (1 - seg(b, 0.96, 1.04));
        big(g, 'Pressure is', 645, 250, { size: 30, color: C.sun, alpha: a0 });
        label(g, 'hits on the walls', 645, 290, { size: 27, alpha: a0 });
        const a1 = seg(b, 1.12, 1.22) * (1 - seg(b, 1.96, 2.04));
        big(g, "Boyle's law", 645, 240, { size: 32, color: C.sun, alpha: a1 });
        label(g, 'Half the volume,', 645, 282, { size: 26, alpha: a1 });
        label(g, 'double the pressure', 645, 314, { size: 26, alpha: a1 });
        big(g, 'P₁V₁ = P₂V₂', 645, 362, { size: 32, color: '#FF8AC4', alpha: seg(b, 1.5, 1.62) * (1 - seg(b, 1.96, 2.04)) });
        const a2 = seg(b, 2.08, 2.18);
        big(g, "Charles's law", 645, 240, { size: 32, color: C.sun, alpha: a2 });
        label(g, 'Double the kelvins,', 645, 282, { size: 26, alpha: a2 });
        label(g, 'double the volume', 645, 314, { size: 26, alpha: a2 });
        big(g, 'V₁/T₁ = V₂/T₂', 645, 362, { size: 32, color: '#FF8AC4', alpha: seg(b, 2.5, 2.6) });
        big(g, 'Kelvin only!', 524, 398, { size: 24, color: '#FF9AA4', alpha: seg(b, 2.66, 2.76) });
        moe(g, 84, 426, 130, b < 1 ? 'oops' : b < 2 ? 'wow' : 'point', { look: [1, -0.3] });
      });
      /* Beat 3: PV = nRT */
      const s3 = seg(b, 3, 3.06);
      if (s3 > 0) A(g, s3, () => {
        const items = [['P', 170, 'pressure'], ['V', 262, 'volume'], ['=', 346, ''], ['n', 430, 'moles'], ['R', 522, 'constant'], ['T', 616, 'kelvins']];
        items.forEach(([s0, x, name], i) => {
          const q = seg(b, 3.06 + i * 0.035, 3.14 + i * 0.035);
          if (q <= 0) return;
          pop(g, x, 96, q, () => big(g, s0, x, 96, { size: 88, color: s0 === '=' ? C.dim : C.sun }));
          if (name) label(g, name, x, 160, { size: 22, alpha: seg(b, 3.2 + i * 0.03, 3.28 + i * 0.03) });
        });
        label(g, 'R = 0.08206 L·atm/(mol·K)', 400, 198, { size: 23, color: C.cyan, alpha: seg(b, 3.34, 3.44) });
        const cq = seg(b, 3.52, 3.62);
        pop(g, 178, 320, cq, () => {
          const x = 116, y = 266, s0 = 112, d = 34;
          g.strokeStyle = '#C8FFE0'; g.lineWidth = 3; g.lineJoin = 'round';
          g.fillStyle = 'rgba(127,243,208,.26)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + d, y - d * 0.62); g.lineTo(x + s0 + d, y - d * 0.62); g.lineTo(x + s0, y); g.closePath(); g.fill(); g.stroke();
          g.fillStyle = 'rgba(127,243,208,.16)'; g.beginPath(); g.moveTo(x + s0, y); g.lineTo(x + s0 + d, y - d * 0.62); g.lineTo(x + s0 + d, y + s0 - d * 0.62); g.lineTo(x + s0, y + s0); g.closePath(); g.fill(); g.stroke();
          g.fillStyle = 'rgba(127,243,208,.2)'; g.fillRect(x, y, s0, s0); g.strokeRect(x, y, s0, s0);
          for (let i = 0; i < 7; i++) {
            const px = x + 16 + (s0 - 32) * tri(t * (0.3 + i * 0.04) + i * 0.7), py = y + 16 + (s0 - 32) * tri(t * (0.27 + i * 0.05) + i * 1.3);
            Art.molecule(g, px, py, 13, 'N2', { style: 'fill', atomScale: 1.28, labels: false, rot: t + i });
          }
          big(g, '22.4 L', x + s0 / 2, y + s0 / 2, { size: 30, color: '#fff' });
          label(g, '28 cm on each side', x + s0 / 2 + 8, y + s0 + 28, { size: 22, color: C.dim });
        });
        label(g, '1 mole of any ideal gas', 480, 268, { size: 27, alpha: cq });
        label(g, 'at 0 °C and 1 atm', 480, 306, { size: 27, alpha: seg(b, 3.62, 3.72) });
        big(g, 'fills 22.4 L', 480, 358, { size: 46, color: C.sun, alpha: seg(b, 3.76, 3.86) });
        moe(g, 722, 426, 110, 'cheer', { flip: true, look: [-1, 0] });
      });
    },
  });

  /* 13. Liquids and solids */
  const W_SPOTS = [[70, 92, 0.5], [170, 88, 2.4], [268, 94, 4.2], [120, 156, 3.4], [220, 158, 0.2], [70, 222, 1.4], [170, 226, 5.4], [270, 220, 2.9]];
  function waterAtoms(x, y, s, rot) {
    const c = Math.cos(rot), d = Math.sin(rot);
    const pt = (ax, ay) => [x + (ax * c - ay * d) * s, y + (ax * d + ay * c) * s];
    return { O: pt(0, -0.25), H: [pt(-0.8, 0.38), pt(0.8, 0.38)] };
  }
  // Each hydrogen reaches for the nearest oxygen on another molecule. Worked out once, so the lines never flicker.
  const H_BONDS = [];
  W_SPOTS.forEach(([x, y, r], i) => {
    waterAtoms(x, y, 30, r).H.forEach((h, k) => {
      let best = -1, bd = 92;
      W_SPOTS.forEach(([x2, y2, r2], j) => {
        if (j === i) return;
        const o = waterAtoms(x2, y2, 30, r2).O, dd = Math.hypot(o[0] - h[0], o[1] - h[1]);
        if (dd < bd) { bd = dd; best = j; }
      });
      if (best >= 0) H_BONDS.push([i, k, best]);
    });
  });
  CH.push({
    id: 'phases', title: 'Liquids and solids', depth: 'Deep rock', layer: LAYER.deep,
    lessons: ['imf', 'phases', 'solids', 'solution-props'],
    enter: { x: 736, y: 426, h: 106, flip: true },
    exit: { x: 736, y: 426, h: 106 },
    beats: [
      { say: 'Deep rock. Water and methane weigh about the same, yet water boils at 100 degrees Celsius and methane at minus 162.' },
      { say: 'The difference is stickiness. <b>Hydrogen bonds</b> hold water together. Methane barely holds on at all.' },
      { say: 'Heat ice. The temperature climbs, stays <b>flat</b> while it melts, climbs, stays flat while it boils. On the flats, energy pulls molecules apart.' },
      { say: 'Cool things down and they lock into <b>solids</b>: ions in salt, molecules in ice, metal in a sea of electrons, one giant network in diamond.' },
    ],
    draw(g, b, t) {
      /* Beats 0 and 1: two molecules, nearly the same weight */
      const s0 = 1 - seg(b, 1.95, 2.03);
      if (b < 2.05) A(g, s0, () => {
        const hb = seg(b, 1.14, 1.3);
        const moved = W_SPOTS.map(([x, y, r], i) => ({ x: x + 20 + wander(i + 1, t * 0.8) * 4, y: y + 36 + wander(i + 9, t * 0.8) * 4, r: r + Math.sin(t * 0.7 + i) * 0.05 }));
        win(g, 20, 40, 320, 232, () => {
          if (hb > 0) A(g, hb, () => {
            g.strokeStyle = C.sun; g.lineWidth = 3.5; g.setLineDash([6, 6]); g.lineCap = 'round';
            H_BONDS.forEach(([i, k, j]) => {
              const a = waterAtoms(moved[i].x, moved[i].y, 30, moved[i].r).H[k];
              const o = waterAtoms(moved[j].x, moved[j].y, 30, moved[j].r).O;
              g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(o[0], o[1]); g.stroke();
            });
            g.setLineDash([]);
          });
          moved.forEach((m) => waterMol(g, m.x, m.y, 30, m.r));
        }, { rim: C.cyan });
        win(g, 362, 40, 320, 232, () => {
          for (let i = 0; i < 6; i++) {
            const px = 362 + 30 + 260 * tri(t * (0.3 + i * 0.012) + (i / 6) * 2), py = 40 + 30 + 172 * tri(t * (0.26 + i * 0.01) + (((i * 5) % 6) / 6) * 2);
            Art.molecule(g, px, py, 22, 'CH4', { style: 'fill', atomScale: 1.28, labels: false, rot: t * 0.9 + i });
          }
        }, { rim: '#FFB08A' });
        A(g, seg(b, 0.04, 0.14), () => {
          Art.formula(g, 'H2O', 180, 304, { size: 40, colorize: true, halo: true });
          label(g, '18 g/mol', 180, 346, { size: 26 });
          Art.formula(g, 'CH4', 522, 304, { size: 40, colorize: true, halo: true });
          label(g, '16 g/mol', 522, 346, { size: 26 });
        });
        big(g, 'Boils at 100 °C', 180, 390, { size: 30, color: C.sun, alpha: seg(b, 0.44, 0.56) });
        big(g, 'Boils at −162 °C', 522, 390, { size: 30, color: C.sun, alpha: seg(b, 0.7, 0.82) });
        A(g, hb, () => {
          panel(g, 60, 46, 240, 36, { fill: 'rgba(16,8,32,.9)', stroke: C.sun, r: 16 });
          Art.text(g, 'Hydrogen bonds', 180, 64, { font: 'display', size: 24, color: C.sun });
        });
        const w2 = seg(b, 1.56, 1.68);
        A(g, w2, () => {
          panel(g, 392, 46, 260, 36, { fill: 'rgba(16,8,32,.9)', stroke: '#FFB08A', r: 16 });
          Art.text(g, 'Hardly any stickiness', 522, 64, { font: 'display', size: 23, color: '#FFB08A' });
        });
        moe(g, 736, 426, 106, b < 1 ? 'wow' : 'think', { flip: true, look: [-1, -0.3] });
      });
      /* Beat 2: the heating curve. A sketch: the boiling flat really is the longest. */
      const s2 = seg(b, 2, 2.05) * (1 - seg(b, 2.96, 3.03));
      if (s2 > 0 && b < 3.1) A(g, s2, () => {
        const pts = [[116, 372], [168, 300], [252, 300], [350, 140], [580, 140], [636, 76]];
        const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
        const tot = lens.reduce((a, c) => a + c, 0);
        const prog = seg(b, 2.08, 2.84) * tot;
        panel(g, 18, 22, 668, 410, { fill: 'rgba(16,8,32,.5)', stroke: false, r: 20 });
        g.strokeStyle = 'rgba(247,242,255,.8)'; g.lineWidth = 4; g.lineCap = 'round';
        g.beginPath(); g.moveTo(90, 46); g.lineTo(90, 396); g.lineTo(664, 396); g.stroke();
        label(g, 'Temperature', 170, 38, { size: 23 });
        label(g, 'Heat added', 600, 420, { size: 23 });
        label(g, 'A sketch, not to scale', 300, 420, { size: 20, color: C.dim });
        label(g, '0 °C', 84, 300, { size: 23, align: 'right', alpha: seg(b, 2.2, 2.3) });
        label(g, '100 °C', 84, 140, { size: 23, align: 'right', alpha: seg(b, 2.44, 2.54) });
        g.strokeStyle = 'rgba(247,242,255,.2)'; g.lineWidth = 2; g.setLineDash([5, 7]);
        g.beginPath(); g.moveTo(90, 300); g.lineTo(168, 300); g.moveTo(90, 140); g.lineTo(350, 140); g.stroke(); g.setLineDash([]);
        let rem = prog, bx = pts[0][0], by = pts[0][1], segI = 0;
        g.lineWidth = 7; g.lineJoin = 'round';
        for (let i = 0; i < lens.length; i++) {
          const f = clamp(rem / lens[i]);
          const flat = i === 1 || i === 3;
          g.strokeStyle = flat ? C.sun : '#FF8AC4';
          const ex = lerp(pts[i][0], pts[i + 1][0], f), ey = lerp(pts[i][1], pts[i + 1][1], f);
          if (f > 0) { g.beginPath(); g.moveTo(pts[i][0], pts[i][1]); g.lineTo(ex, ey); g.stroke(); bx = ex; by = ey; segI = i + f; }
          rem -= lens[i];
          if (rem <= 0) break;
        }
        Art.ball(g, bx, by, 11, '#fff');
        big(g, 'Melting', 210, 274, { size: 25, color: C.sun, alpha: clamp(segI - 1) });
        big(g, 'Boiling', 465, 114, { size: 25, color: C.sun, alpha: clamp(segI - 3) });
        label(g, 'Ice', 124, 340, { size: 23, color: '#7FE3FF', alpha: seg(b, 2.1, 2.16), align: 'right' });
        label(g, 'Water', 282, 204, { size: 23, color: '#7FE3FF', alpha: clamp(segI - 2), align: 'right' });
        label(g, 'Steam', 628, 56, { size: 23, color: '#7FE3FF', alpha: clamp(segI - 4), align: 'right' });
        const note = seg(b, 2.76, 2.86);
        big(g, 'On a flat, energy', 456, 180, { size: 25, color: '#fff', alpha: note });
        big(g, 'pulls molecules apart', 456, 210, { size: 25, color: '#fff', alpha: note });
        // A window on what the molecules are doing at the moment.
        const cx = 576, cy = 312, R = 72;
        const mode = segI < 1 ? 0 : segI < 2 ? segI - 1 : segI < 3 ? 1 : segI < 4 ? 1 + (segI - 3) : 2;
        g.save();
        g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.clip();
        const bgc = g.createRadialGradient(cx, cy, 8, cx, cy, R);
        bgc.addColorStop(0, '#3A2466'); bgc.addColorStop(1, '#170C29');
        g.fillStyle = bgc; g.fillRect(cx - R, cy - R, R * 2, R * 2);
        for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
          const k = i + j * 3;
          const sx = cx - 40 + i * 40 + wander(k, t * 6) * 1.6, sy = cy - 40 + j * 40 + wander(k + 3, t * 6) * 1.6;
          const lx = cx - 42 + i * 42 + (j % 2 ? 12 : -8) + wander(k + 5, t * 0.8) * 11, ly = cy - 38 + j * 38 + wander(k + 7, t * 0.8) * 11;
          const gx = cx - R * 0.72 + 1.44 * R * tri(t * 0.36 + k * 0.5), gy = cy - R * 0.72 + 1.44 * R * tri(t * 0.31 + ((k * 3) % 4) * 0.5);
          const px = mode < 1 ? lerp(sx, lx, mode) : lerp(lx, gx, mode - 1), py = mode < 1 ? lerp(sy, ly, mode) : lerp(ly, gy, mode - 1);
          if (mode >= 2 && k > 3) continue;
          waterMol(g, px, py, 15, mode < 0.2 ? 0.2 : k * 1.3 + t * 0.5 * mode);
        }
        g.restore();
        g.strokeStyle = C.cyan; g.lineWidth = 5; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();
        moe(g, 738, 426, 104, 'point', { flip: true, look: [-1, -0.5] });
      });
      /* Beat 3: four kinds of solid */
      const s3 = seg(b, 3, 3.05);
      if (s3 > 0) A(g, s3, () => {
        const X = [24, 192, 360, 528], tw = 156, ty = 44, th = 228;
        const names = [['Ionic', 'salt', '#5FE39C'], ['Molecular', 'ice', '#7FE3FF'], ['Metallic', 'copper', '#FFB08A'], ['Network', 'diamond', '#D5CFE0']];
        X.forEach((x, k) => {
          const q = seg(b, 3.08 + k * 0.18, 3.18 + k * 0.18);
          if (q <= 0) return;
          const mx = x + tw / 2;
          pop(g, mx, ty + th / 2, q, () => {
            win(g, x, ty, tw, th, () => {
              if (k === 0) {
                for (let j = 0; j < 6; j++) for (let i = 0; i < 4; i++) {
                  const na = (i + j) % 2 === 0;
                  Art.atom(g, x + 26 + i * 36 + wander(i + j, t * 5) * 1, ty + 26 + j * 36 + wander(i * 2 + j, t * 5) * 1, na ? 12 : 17, na ? 'Na' : 'Cl', { label: false });
                }
              } else if (k === 1) {
                for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) {
                  waterMol(g, x + 44 + i * 70 + (j % 2 ? -8 : 8), ty + 36 + j * 52, 21, (i + j) % 2 ? 0.45 : -0.45);
                }
              } else if (k === 2) {
                for (let j = 0; j < 6; j++) for (let i = 0; i < 4; i++) {
                  Art.atom(g, x + 26 + i * 36 + wander(i + j, t * 5) * 1, ty + 26 + j * 36 + wander(i * 3 + j, t * 5) * 1, 15, 'Cu', { label: false, charge: null });
                }
                for (let i = 0; i < 14; i++) Art.electron(g, x + 10 + (tw - 20) * tri(t * (0.2 + rand(i) * 0.3) + i * 0.7), ty + 10 + (th - 20) * tri(t * (0.17 + rand(i + 5) * 0.3) + i * 1.3), 4.5);
              } else {
                // A flat slice through diamond: every carbon is bonded to its neighbors.
                const pts0 = [];
                for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) pts0.push([x + 34 + i * 44 + (j % 2 ? 22 : 0), ty + 30 + j * 42, i, j]);
                pts0.forEach(([px, py, i, j]) => {
                  pts0.forEach(([p2, q2, i2, j2]) => {
                    const adj = j2 === j + 1 && (j % 2 ? (i2 === i || i2 === i + 1) : (i2 === i || i2 === i - 1));
                    if (adj) Art.bond(g, px, py, p2, q2, { width: 4 });
                  });
                });
                pts0.forEach(([px, py]) => Art.atom(g, px, py, 13, 'C', { label: false }));
              }
            }, { rim: names[k][2] });
            big(g, names[k][0], mx, ty + th + 28, { size: 25, color: names[k][2] });
            label(g, names[k][1], mx, ty + th + 62, { size: 25 });
          });
        });
        moe(g, 736, 426, 106, b > 3.8 ? 'cheer' : 'point', { flip: true, look: [-1, -0.5] });
      });
    },
  });

  /* 14. The final exam */
  CH.push({
    id: 'exam', title: 'The final exam', depth: 'The bottom', layer: LAYER.bottom,
    lessons: ['stoichiometry', 'combustion', 'exam'],
    enter: { x: 724, y: 426, h: 150, flip: true },
    beats: [
      { say: 'The bottom. The <b>final exam</b>. If 8.0 grams of methane burns, how many grams of water form?' },
      { say: 'Everything you dug through. First, <b>balance</b> it.', min: 3.4 },
      { say: 'Grams to moles: divide by molar mass. <b>0.50 moles</b> of methane.', min: 3.8 },
      { say: 'Use the ratio: two waters per methane. <b>1.0 mole</b> of water.', min: 3.8 },
      { say: 'Moles to grams: <b>18 grams</b>. One mole of water, our tablespoon from before.', min: 4.6 },
      { say: 'You just dug through all of Chemistry 101. Every layer has lessons, labs and practice. So pick one and start digging. I\'ll be down here.', min: 8.4 },
    ],
    draw(g, b, t) {
      const INK2 = '#22123A';
      const out = seg(b, 4.96, 5.06);
      if (out < 1) A(g, 1 - out, () => {
        const pq = bk(b, 0.03, 0.16);
        at(g, 348, 224, Math.max(0.01, pq), () => {
          g.translate(-348, -224);
          g.fillStyle = 'rgba(6,2,16,.45)'; Art.round(g, 66, 46, 580, 376, 12); g.fill();
          g.fillStyle = '#FFFDF2'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3.5;
          Art.round(g, 58, 36, 580, 376, 12); g.fill(); g.stroke();
          Art.text(g, 'Final exam', 348, 70, { font: 'display', size: 36, color: '#C71585' });
          Art.para(g, 'If 8.0 g of methane burns, how many grams of water form?', 348, 96, 530, { size: 26, color: INK2, align: 'center', weight: 700, lh: 31 });
        });
        const row = (i, y, d, fn) => {
          const q = seg(b, d, d + 0.14);
          if (q <= 0) return;
          A(g, q, () => {
            g.fillStyle = '#C71585'; g.beginPath(); g.arc(90, y, 16, 0, TAU); g.fill();
            Art.text(g, String(i), 90, y + 1, { font: 'display', size: 22, color: '#fff' });
            fn();
          });
        };
        row(1, 196, 1.3, () => Art.formula(g, 'CH4 + 2O2 -> CO2 + 2H2O', 116, 196, { size: 32, color: INK2, align: 'left' }));
        row(2, 248, 2.32, () => Art.text(g, '8.0 g CH₄ ÷ 16.04 g/mol = 0.50 mol CH₄', 116, 248, { size: 24, align: 'left', color: INK2 }));
        row(3, 300, 3.32, () => Art.text(g, '0.50 mol CH₄ × 2 H₂O / 1 CH₄ = 1.0 mol H₂O', 116, 300, { size: 24, align: 'left', color: INK2 }));
        row(4, 352, 4.08, () => Art.text(g, '1.0 mol H₂O × 18.02 g/mol = 18 g H₂O', 116, 352, { size: 24, align: 'left', color: INK2 }));
        // The stamp lands.
        const st = seg(b, 4.32, 4.42);
        if (st > 0) {
          const k = lerp(2.4, 1, ease.out(st));
          at(g, 582, 66, k * 0.92, () => {
            g.globalAlpha *= st;
            g.strokeStyle = '#D5202F'; g.lineWidth = 5; Art.round(g, -48, -30, 96, 60, 12); g.stroke();
            Art.text(g, 'A+', 0, 2, { font: 'display', size: 44, color: '#D5202F' });
          }, -0.2);
        }
        const sq = seg(b, 4.5, 4.62);
        if (sq > 0) pop(g, 712, 150, sq, () => {
          spoon(g, 690, 184, 0.36, 1);
          big(g, '18 g', 706, 96, { size: 38, color: C.sun });
          label(g, '1 mole of water', 712, 134, { size: 20, color: '#fff' });
        });
        const happy = b >= 4.3;
        moe(g, 724, 426, 150, happy ? 'cheer' : b < 1 ? 'oops' : b < 2 ? 'think' : 'point', { flip: true, sweat: b < 1, look: [-1, b < 1 ? 0 : -0.3] });
      });
      /* The whole dig, one last look. */
      if (out > 0) A(g, out, () => {
        const gy = 70;
        surface(g, t, gy);
        const pts = courseMap(g, t, gy, 1, 1);
        mound(g, 400, gy, 0.38);
        const last = pts[pts.length - 1];
        moe(g, last[0] + 60, 446, 64, 'cheer', { look: [0, -1] });
        for (let i = 0; i < 46; i++) {
          const x = rand(i + 2) * W + Math.sin(t * (1 + rand(i)) + i) * 14;
          const y = ((rand(i + 6) * H + t * (40 + rand(i + 3) * 40)) % (H + 20)) - 10;
          g.fillStyle = [C.pink, C.sun, C.cyan, C.leaf, C.fire, C.violet][i % 6];
          at(g, x, y, 1, () => { g.fillRect(-4, -2.5, 8, 5); }, t * (2 + rand(i) * 2) + i);
        }
        const tq = bk(b, 5.14, 5.3) * (1 - seg(b, 5.84, 5.96));
        if (tq > 0) {
          at(g, W / 2, 196, tq, () => {
            panel(g, -290, -70, 580, 140, { fill: 'rgba(16,8,32,.88)', stroke: C.sun, lw: 4, r: 24 });
            Art.text(g, 'You dug through it all', 0, -22, { font: 'display', size: 44, color: C.sun });
            Art.text(g, 'Now pick a layer and go deeper', 0, 30, { size: 28, color: '#fff' });
          });
        }
      });
    },
  });

  /* ---------- The timeline ---------- */
  const WPS = 3.08, PAD = 0.25, DIG = 2.9, MIN_BEAT = 3.2;
  const plain = (s) => s.replace(/<[^>]+>/g, '');
  const SEGS = [], CUES = [];
  let clock = 0;
  CH.forEach((ch, i) => {
    ch.i = i;
    if (i > 0) {
      ch.start = clock;
      SEGS.push({ kind: 'dig', from: i - 1, to: i, start: clock, dur: DIG });
      clock += DIG;
    } else ch.start = 0;
    ch.beats.forEach((bt, k) => {
      const words = plain(bt.speak || bt.say).split(/\s+/).length;
      const dur = Math.max(bt.min || MIN_BEAT, words / WPS + PAD);
      const s = { kind: 'beat', ch: i, k, start: clock, dur, words, say: bt.say, speak: bt.speak || plain(bt.say), cue: CUES.length };
      SEGS.push(s); CUES.push(s);
      clock += dur;
    });
  });
  const TOTAL = clock;
  const segAt = (time) => {
    let lo = 0, hi = SEGS.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (SEGS[mid].start <= time + 1e-9) lo = mid; else hi = mid - 1;
    }
    return SEGS[lo];
  };

  /* ---------- Drawing a frame ---------- */
  let T = 0, amb = 0, playing = false, speaking = false, started = false;
  function drawBeat(g, s, time) {
    const ch = CH[s.ch], t = amb;
    const b = s.k + clamp((time - s.start) / s.dur);
    F.noMoe = false;
    F.talk = started && playing && (speaking || (time - s.start) < s.words / 2.9);
    if (ch.layer !== LAYER.surface) drawChamber(g, ch.layer, t);
    ch.draw(g, b, t);
  }
  function drawDig(g, s, time) {
    const A0 = CH[s.from], B0 = CH[s.to], t = amb;
    const u = clamp((time - s.start) / s.dur);
    const LA = A0.layer, LB = B0.layer;
    F.talk = false;
    if (reduced) {
      // Less motion: a simple cross-fade through the sign.
      if (u < 0.5) { if (A0.exitBG) A0.exitBG(g, t); else drawChamber(g, LA, t); }
      else drawChamber(g, LB, t);
      g.fillStyle = `rgba(13,7,24,${Math.sin(u * Math.PI) * 0.9})`; g.fillRect(0, 0, W, H);
      A(g, seg(u, 0.2, 0.35) * (1 - seg(u, 0.72, 0.86)), () => chapterSign(g, W / 2, H / 2, s.to + 1, B0.title, B0.depth));
      return;
    }
    const gap = 430, span = H + gap;
    const floorA = A0.floorY || 420, ceilB = span + 24;
    const q = seg(u, 0.16, 0.82);
    // Quick off the mark, slow past the sign, quick to the next chamber.
    const curve = (x) => { const e = ease.inOut(x); return e + (0.62 * Math.sin(TAU * e)) / TAU; };
    const cq = curve(q);
    const cam = cq * span;
    const my = lerp(floorA, ceilB, cq);
    const landing = seg(u, 0.93, 1);
    const shake = landing > 0 && landing < 1 ? Math.sin(landing * 34) * (1 - landing) * 3.5 : 0;
    g.save();
    g.translate(0, -cam + shake);
    // Chamber above, with the last picture fading away.
    if (cam < H + 40) {
      if (A0.exitBG) A0.exitBG(g, t); else drawChamber(g, LA, t);
      const c = 1 - seg(u, 0, 0.13);
      if (c > 0) {
        F.noMoe = true;
        A(g, c, () => A0.draw(g, A0.beats.length, t));
        F.noMoe = false;
      }
    }
    earth(g, LA, LB, H - 1, span + 1, t, s.to * 5 + 2);
    if (cam + H > span - 40) { g.save(); g.translate(0, span); drawChamber(g, LB, t); g.restore(); }
    // The tunnel behind Moe.
    const holeQ = eo(u, 0.08, 0.2);
    if (u > 0.08) {
      const yy = Math.min(my + 6, ceilB);
      g.fillStyle = '#0B0514';
      g.beginPath();
      g.moveTo(TX - 50, floorA);
      for (let y = floorA; y <= yy; y += 22) g.lineTo(TX - 50 + wav(y, 3) * 0.7, y);
      g.lineTo(TX + 50, yy);
      for (let y = yy; y >= floorA; y -= 22) g.lineTo(TX + 50 + wav(y, 7) * 0.7, y);
      g.closePath(); g.fill();
      g.fillStyle = '#0B0514';
      g.beginPath(); g.ellipse(TX, floorA, 60 * holeQ, 18 * holeQ, 0, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(255,240,220,.25)'; g.lineWidth = 3;
      g.beginPath(); g.ellipse(TX, floorA, 60 * holeQ, 18 * holeQ, 0, 0, Math.PI); g.stroke();
    }
    chapterSign(g, 548, H + gap / 2, s.to + 1, B0.title, B0.depth);
    // Moe.
    const ex = A0.exit || { x: 650, y: 426, h: 120 };
    const en = B0.enter || { x: 600, y: 426, h: 130 };
    if (u < 0.16) {
      const k = io(u, 0, 0.14);
      const hopTo = Math.sin(k * Math.PI);
      moe(g, lerp(ex.x, TX, k), lerp(ex.y, floorA + 4, k) - hopTo * 56, lerp(ex.h, 92, k), 'cheer', { helmet: k > 0.5, talk: false, flip: ex.x > TX, force: true });
    } else if (u < 0.82) {
      const r = eo(u, 0.16, 0.22);
      // Head first: Moe's feet are at my - 70 and the claws reach down into the rock.
      const wob = Math.sin(t * 26) * 2;
      Art.glow(g, TX, my + 92, 120, '#FFE9A0', 0.35);
      moe(g, TX + wob, my + lerp(0, -8, r), 92, 'cheer', { rot: r * Math.PI, dig: true, helmet: true, talk: false, force: true });
      for (let i = 0; i < 20; i++) {
        const ph = (t * 1.9 + i / 20) % 1;
        const a = -Math.PI / 2 + (rand(i + 2) - 0.5) * 2.1;
        const v = 110 + rand(i + 5) * 150;
        const px = TX + (rand(i + 8) - 0.5) * 50 + Math.cos(a) * v * ph;
        const py = my + 96 + Math.sin(a) * v * ph + 300 * ph * ph;
        g.fillStyle = Art.alpha(Art.mix(Art.mix(LA.rock, LB.rock, q), '#ffffff', 0.2 + rand(i) * 0.2), 1 - ph);
        g.beginPath(); g.arc(px, py, 2.5 + rand(i + 3) * 4, 0, TAU); g.fill();
      }
    } else {
      // Out through the ceiling, one somersault, and a landing.
      const f = seg(u, 0.82, 0.965);
      const y = lerp(span + 24, span + en.y, f * f);
      const x = lerp(TX, en.x, ease.out(f));
      const hh = lerp(92, en.h, f);
      const land = seg(u, 0.955, 1);
      moe(g, x, y, hh, f < 1 ? 'wow' : 'happy', { rot: (1 - ease.out(f)) * Math.PI * 1.0 * (en.x > TX ? 1 : -1), squash: Math.sin(land * Math.PI) * 0.16, helmet: f < 0.5, talk: false, flip: en.flip, force: true });
      if (land > 0) A(g, 1 - land, () => {
        for (let i = 0; i < 10; i++) {
          const a = Math.PI + (i / 9) * Math.PI, r = land * 62;
          g.fillStyle = 'rgba(255,240,220,.4)';
          g.beginPath(); g.arc(en.x + Math.cos(a) * r * 1.5, span + en.y + Math.sin(a) * r * 0.4, 7 + rand(i) * 6, 0, TAU); g.fill();
        }
      });
    }
    g.restore();
  }
  /** Depth gauge: the strata on the right edge, with Moe's depth marked. */
  function gauge(g, time, s) {
    const n = CH.length, y0 = 36, y1 = 414, x = 785, w = 7;
    const depth = s.kind === 'beat' ? s.ch + (time - CH[s.ch].start) / Math.max(1, chapterLen(s.ch)) : s.from + 1 + 0;
    const a = time < 1 ? 0 : clamp((time - 1) * 2) * 0.92;
    if (a <= 0) return;
    A(g, a, () => {
      for (let i = 0; i < n; i++) {
        g.fillStyle = Art.mix(CH[i].layer.rock, '#ffffff', 0.22);
        g.fillRect(x, lerp(y0, y1, i / n), w, (y1 - y0) / n - 1.2);
      }
      const my = lerp(y0, y1, clamp(depth / n));
      g.fillStyle = C.pink; g.strokeStyle = '#fff'; g.lineWidth = 2.2;
      g.beginPath(); g.arc(x + w / 2, my, 7, 0, TAU); g.fill(); g.stroke();
    });
  }
  const chapterLens = CH.map((ch, i) => (CH[i + 1] ? CH[i + 1].start : TOTAL) - ch.start);
  const chapterLen = (i) => chapterLens[i];
  function render() {
    const lint = window.__lint;
    if (lint) lint.begin(canvas);
    // Each frame starts from a clean canvas state, so no line style leaks between frames and scrubbing stays exact.
    ctx.save();
    const sx = canvas.width / W, sy = canvas.height / H;
    ctx.setTransform(sx, 0, 0, sy, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#0D0718'; ctx.fillRect(0, 0, W, H);
    const time = Math.min(T, TOTAL - 1e-4);
    const s = segAt(time);
    F.t = amb;
    if (s.kind === 'beat') drawBeat(ctx, s, time); else drawDig(ctx, s, time);
    ctx.setTransform(sx, 0, 0, sy, 0, 0);
    gauge(ctx, time, s);
    ctx.restore();
    if (lint) lint.end(canvas);
    syncUI(s, time);
  }
  function fit() {
    const stage = Lab.$('#film-stage');
    const full = document.fullscreenElement === player;
    if (full) {
      const r = stage.getBoundingClientRect();
      canvas.style.width = Math.floor(Math.min(r.width, (r.height * 16) / 9)) + 'px';
    } else canvas.style.width = '';
    const cssW = canvas.clientWidth || 800;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pw = Math.min(2240, Math.round(cssW * dpr));
    canvas.width = pw;
    canvas.height = Math.round((pw * 9) / 16);
    const want = pw > 1100 ? 2 : pw > 620 ? 1.5 : 1;
    if (want !== imgScale) { imgScale = want; imgCache.clear(); }
    render();
  }

  /* ---------- Player ---------- */
  const player = Lab.$('#film');
  const btnPlay = Lab.$('#film-play'), bigBtn = Lab.$('#film-big'), range = Lab.$('#film-range'), fill = Lab.$('#film-fill');
  const nowEl = Lab.$('#film-now'), capEl = Lab.$('#film-cap'), ccBtn = Lab.$('#film-cc'), fsBtn = Lab.$('#film-fs');
  const endEl = Lab.$('#film-end'), list = Lab.$('#film-chapters'), voiceBtn = Lab.$('#film-voice');
  const chapterNow = Lab.$('#film-now-chapter');
  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  Lab.$('#film-total').textContent = mmss(TOTAL);
  Lab.$('#film-length').textContent = `Runs ${mmss(TOTAL)} or a little longer, depending on your device's voice.`;
  range.max = TOTAL;
  bigBtn.querySelector('.film-big-label').textContent = 'Play the movie';

  // The longest caption holds the band's height so the page never jumps.
  const longest = CUES.reduce((a, c) => (plain(c.say).length > plain(a.say).length ? c : a), CUES[0]);
  Lab.$('#film-cap-ghost').innerHTML = longest.say;

  // A timeline painted in the colors of the strata, one block per chapter.
  const trackEl = Lab.$('#film-track');
  const blocks = (host) => { host.innerHTML = CH.map((ch, i) => `<span style="width:${(100 * chapterLen(i)) / TOTAL}%;background:${Art.mix(ch.layer.rock, '#ffffff', 0.34)}"></span>`).join(''); };
  blocks(trackEl);
  const fillIn = document.createElement('div');
  fillIn.className = 'film-fill-in';
  fillIn.innerHTML = CH.map((ch, i) => `<span style="width:${(100 * chapterLen(i)) / TOTAL}%;background:${Art.mix(ch.layer.rock, '#FFD23F', 0.62)}"></span>`).join('');
  fill.appendChild(fillIn);
  function sizeFill() { fillIn.style.width = trackEl.clientWidth + 'px'; }

  const lessonLink = (id) => { const l = Lab.lessonById(id) || Lab.extras.find((e) => e.id === id); return l ? `<a href="${l.href}">${l.title}</a>` : ''; };
  list.innerHTML = CH.map((ch, i) => `<li data-i="${i}">
      <button class="fc-jump" type="button" data-i="${i}"><span class="fc-num" style="--c:${Art.mix(ch.layer.rock, '#000000', 0.05)}">${i + 1}</span><span class="fc-title">${ch.title}</span><span class="fc-time">${mmss(ch.start)}</span></button>
      <p class="fc-links">Go deeper: ${ch.lessons.map(lessonLink).filter(Boolean).join(', ')}</p>
    </li>`).join('');
  const chapterItems = Lab.$$('li', list);
  Lab.$$('.fc-jump', list).forEach((b) => b.addEventListener('click', () => {
    seek(CH[+b.dataset.i].start + 0.01);
    play();
    player.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
  }));

  Lab.$('#film-transcript').innerHTML = CH.map((ch) => `<section>
      <h3><span>${ch.i + 1}. ${ch.title}</span><span class="fc-time">${mmss(ch.start)}</span></h3>
      <p>${ch.beats.map((bt) => plain(bt.say)).join(' ')}</p>
      <p class="from">Go deeper: ${ch.lessons.map(lessonLink).filter(Boolean).join(', ')}</p>
    </section>`).join('');

  Lab.$('#film-end-links').innerHTML = [['matter', 'Matter'], ['atoms', 'Atoms'], ['mole', 'The mole'], ['combustion', 'Burning fuels'], ['stoichiometry', 'Stoichiometry'], ['solubility', 'Solubility'], ['energy', 'Energy'], ['orbitals', 'Orbitals'], ['vsepr', 'Shapes'], ['ideal-gas', 'Gases'], ['phases', 'Phase changes']]
    .map(([id, name]) => `<a href="${id}.html">${name}</a>`).join('') + '<a href="exam.html">Exam simulator</a>';

  let lastCap = null, lastCh = -1, lastTimeText = '';
  function syncUI(s, time) {
    const txt = mmss(time);
    if (txt !== lastTimeText) {
      nowEl.textContent = txt; lastTimeText = txt;
      range.setAttribute('aria-valuetext', `${txt} of ${mmss(TOTAL)}`);
    }
    if (document.activeElement !== range || playing) range.value = T;
    fill.style.width = (100 * T) / TOTAL + '%';
    const chI = s.kind === 'beat' ? s.ch : s.to;
    if (chI !== lastCh) {
      chapterItems.forEach((li, i) => {
        li.classList.toggle('is-active', i === chI);
        const b = li.querySelector('button');
        if (i === chI) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      chapterNow.textContent = `Chapter ${chI + 1} of ${CH.length}: ${CH[chI].title}`;
      lastCh = chI;
    }
    const cap = started ? (s.kind === 'beat' ? s.say : '') : 'Press play to meet Moe. The voice starts when the film does.';
    if (cap !== lastCap) { capEl.innerHTML = cap; lastCap = cap; }
  }

  /* Voice: the browser reads each caption, and the timeline waits at the end of a line until it is done. */
  const synth = window.speechSynthesis;
  const voiceOK = !!(synth && window.SpeechSynthesisUtterance);
  let voiceOn = false, voice = null, utter = null, spokenIdx = -1, speakStart = 0, speakBudget = 0;
  function pickVoice() {
    const rank = (v) => (/natural|neural|online/i.test(v.name) ? 6 : 0) + (/google/i.test(v.name) ? 4 : 0)
      + (/samantha|aria|jenny|guy|daniel|karen|moira|serena|ava|allison/i.test(v.name) ? 3 : 0)
      + (/en[-_]US/i.test(v.lang) ? 2 : 0) + (v.localService ? 1 : 0);
    const en = synth.getVoices().filter((v) => /^en([-_]|$)/i.test(v.lang));
    en.sort((a, b) => rank(b) - rank(a));
    voice = en[0] || null;
  }
  const cueAt = (time) => { const s = segAt(time); return s.kind === 'beat' ? s.cue : -1; };
  const holdPoint = (k) => CUES[k].start + CUES[k].dur - 0.03;
  function speakCue(k) {
    if (!voiceOn || k < 0) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(CUES[k].speak);
    if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'en-US';
    u.rate = 1.04; u.pitch = 1.12;
    const done = () => { if (utter === u) { utter = null; speaking = false; } };
    u.onend = done; u.onerror = done;
    utter = u; speaking = true; spokenIdx = k; speakStart = performance.now();
    // Safety net: some engines never report that they finished, and the film must not wait forever.
    speakBudget = CUES[k].words / 1.7 + 2;
    synth.speak(u);
  }
  function hush() {
    if (!voiceOK) return;
    utter = null; speaking = false;
    synth.cancel();
  }
  function setVoice(on) {
    voiceOn = voiceOK && on;
    Lab.store.set('film-voice', on);
    voiceBtn.setAttribute('aria-pressed', String(voiceOn));
    voiceBtn.setAttribute('aria-label', voiceOn ? 'Turn voice off' : 'Turn voice on');
    voiceBtn.innerHTML = voiceOn ? Lab.icons.voice : Lab.icons.voiceOff;
    if (!voiceOn) hush();
    else if (playing) { const k = cueAt(T); if (k >= 0) speakCue(k); }
  }

  let raf = 0, last = 0;
  function loop(now) {
    raf = 0;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    if (!playing && started) return;
    amb += dt;
    if (playing) {
      if (voiceOn) {
        if (speaking && (now - speakStart) / 1000 > speakBudget) speaking = false;
        let next = T + dt;
        if (speaking && spokenIdx >= 0) next = Math.min(next, Math.max(T, holdPoint(spokenIdx)));
        T = next;
        const k = cueAt(T);
        if (k >= 0 && k !== spokenIdx) speakCue(k);
      } else T += dt;
      if (T >= TOTAL) {
        T = TOTAL; playing = false; hush();
        render();
        endEl.hidden = false;
        paintPlay();
        return;
      }
    }
    render();
    if (playing || (idleOK && visible)) raf = requestAnimationFrame(loop);
  }
  function kick() { if (!raf) { last = 0; raf = requestAnimationFrame(loop); } }
  function paintPlay() {
    btnPlay.innerHTML = playing ? Lab.icons.pause : Lab.icons.play;
    btnPlay.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  }
  function play() {
    if (T >= TOTAL) { T = 0; amb = 0; spokenIdx = -1; }
    started = true; playing = true;
    bigBtn.hidden = true; endEl.hidden = true;
    paintPlay();
    // Speaking inside the click handler also unlocks speech on phones.
    if (voiceOn) { const k = cueAt(T); if (k >= 0) speakCue(k); }
    kick();
    render();
  }
  function pause() { playing = false; hush(); paintPlay(); render(); }
  function toggle() { if (playing) pause(); else play(); }
  function seek(v) {
    T = clamp(v, 0, TOTAL);
    amb = T;
    hush();
    // Read the line if we land at its start. Otherwise wait for the next one.
    const k = cueAt(T);
    spokenIdx = k >= 0 && T - CUES[k].start < 0.4 ? -1 : k;
    started = true;
    bigBtn.hidden = true;
    endEl.hidden = T < TOTAL;
    render();
  }

  btnPlay.addEventListener('click', toggle);
  bigBtn.addEventListener('click', play);
  canvas.addEventListener('click', toggle);
  Lab.$('#film-replay').addEventListener('click', () => { seek(0); play(); });
  range.addEventListener('input', () => seek(+range.value));

  const setCC = (on) => {
    player.classList.toggle('no-cc', !on);
    ccBtn.setAttribute('aria-pressed', String(on));
    ccBtn.setAttribute('aria-label', on ? 'Turn captions off' : 'Turn captions on');
    Lab.store.set('film-cc', on);
  };
  setCC(Lab.store.get('film-cc', true));
  ccBtn.addEventListener('click', () => setCC(player.classList.contains('no-cc')));

  const fsAPI = player.requestFullscreen ? 'requestFullscreen' : player.webkitRequestFullscreen ? 'webkitRequestFullscreen' : null;
  fsBtn.innerHTML = Lab.icons.expand;
  if (!fsAPI) fsBtn.hidden = true;
  const toggleFS = () => {
    if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else { const r = player[fsAPI](); if (r && r.catch) r.catch(() => {}); }
  };
  fsBtn.addEventListener('click', toggleFS);
  document.addEventListener('fullscreenchange', () => requestAnimationFrame(fit));

  // Keys work anywhere on the page unless the reader is typing or using a link.
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const el = e.target, tag = el.tagName;
    if (tag === 'TEXTAREA' || tag === 'SELECT' || (tag === 'INPUT' && el !== range)) return;
    const key = e.key.toLowerCase();
    if (key === ' ' || key === 'k') {
      if (key === ' ' && (tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY')) return;
      e.preventDefault(); toggle();
    } else if (key === 'arrowright' || key === 'arrowleft') {
      e.preventDefault(); seek(T + (key === 'arrowright' ? 5 : -5));
      if (playing) kick();
    } else if (key === 'c') setCC(player.classList.contains('no-cc'));
    else if (key === 'v' && voiceOK) setVoice(!voiceOn);
    else if (key === 'f' && fsAPI) toggleFS();
  });

  if (voiceOK) {
    pickVoice();
    if (synth.addEventListener) synth.addEventListener('voiceschanged', pickVoice);
    setVoice(Lab.store.get('film-voice', true));
    voiceBtn.addEventListener('click', () => setVoice(!voiceOn));
    window.addEventListener('pagehide', hush);
  } else {
    voiceBtn.hidden = true;
    Lab.$('#film-voice-note').textContent = "This browser has no built-in speech, so the film runs on captions alone. On other devices, the voice varies.";
  }
  if (reduced) Lab.$('#film-motion-note').hidden = false;

  /* The title card stays alive before play, unless the viewer asked for less motion. */
  const idleOK = !reduced;
  let visible = true;
  new IntersectionObserver((es) => {
    visible = es[0].isIntersecting;
    if (visible && idleOK && !started) kick();
  }).observe(canvas);

  paintPlay();
  new ResizeObserver(() => { fit(); sizeFill(); }).observe(Lab.$('#film-stage'));
  fit(); sizeFill();
  if (document.fonts) {
    Promise.all([document.fonts.load(`400 40px ${Art.FONT_DISPLAY}`), document.fonts.load(`700 24px ${Art.FONT_BODY}`)]).catch(() => {}).then(render);
    if (document.fonts.ready) document.fonts.ready.then(render);
  }
  if (idleOK) kick();

  // Test hook: land on any moment of the film.
  window.__movie = {
    seek(v) { playing = false; if (voiceOK) hush(); paintPlay(); seek(v); return T; },
    now: () => T,
    total: TOTAL,
    chapters: CH.map((ch) => ({ title: ch.title, start: ch.start, beats: ch.beats.length })),
    /** Time at a chapter and beat position, for example at(2, 1.5). */
    at(ch, b) {
      const k = Math.min(Math.floor(b), CH[ch].beats.length - 1);
      const s = SEGS.find((x) => x.kind === 'beat' && x.ch === ch && x.k === k);
      return s.start + s.dur * clamp(b - k);
    },
    digAt(to, u) { const s = SEGS.find((x) => x.kind === 'dig' && x.to === to); return s.start + s.dur * u; },
    show(ch, b) { return this.seek(this.at(ch, b)); },
    words: () => CUES.reduce((a, c) => a + c.words, 0),
  };
});
