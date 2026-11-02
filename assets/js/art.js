/* The Mole Hole: drawing library. Every function draws in the stage's virtual coordinates
   on a plain CanvasRenderingContext2D, so it mixes freely with raw canvas calls.

   Palette rule: atoms always use their element color, in every figure on the site.
   See docs/AUTHORING.md for the catalogue with examples. */
(function () {
  'use strict';
  const Art = (window.Art = {});
  const TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  Art.FONT_DISPLAY = '"Lilita One", "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';
  Art.FONT_BODY = '"Atkinson Hyperlegible Next", "Atkinson Hyperlegible", "Trebuchet MS", sans-serif';

  /* Colors that read well on the dark stage. */
  Art.C = {
    ink: '#F7F2FF', dim: '#BFB2DA', faint: '#8878A8', line: 'rgba(247,242,255,.28)',
    night: '#1A0F2E', plum: '#2B1A4A', plum2: '#3B2763',
    pink: '#FF4FA3', cyan: '#2FD6F2', sun: '#FFD23F', leaf: '#3DDC84', fire: '#FF8A2B', violet: '#B28DFF', red: '#FF5A6B', blue: '#5B8CFF',
    electron: '#35E6FF', proton: '#FF5A6B', neutron: '#B7ADC9', water: '#46B9F0', glass: 'rgba(214,240,255,.85)',
  };

  /* ---------- Color helpers ---------- */
  function hex(c) {
    if (c[0] !== '#') {
      const m = c.match(/[\d.]+/g).map(Number);
      return [m[0], m[1], m[2]];
    }
    if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
    const n = parseInt(c.slice(1, 7), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  Art.mix = (a, b, t) => {
    const A = hex(a), B = hex(b);
    return `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)},${Math.round(A[1] + (B[1] - A[1]) * t)},${Math.round(A[2] + (B[2] - A[2]) * t)})`;
  };
  Art.alpha = (c, a) => { const A = hex(c); return `rgba(${A[0]},${A[1]},${A[2]},${a})`; };
  Art.lum = (c) => { const A = hex(c); return (0.2126 * A[0] + 0.7152 * A[1] + 0.0722 * A[2]) / 255; };

  /* Element colors: CPK conventions, tuned to stay vivid on the dark stage. */
  const ELEMENT_COLOR = {
    H: '#F4F6FB', He: '#7FF3F3', Li: '#C77DFF', Be: '#B5F23B', B: '#FFB3A7', C: '#5A6475', N: '#4C7DFF', O: '#FF4D5E', F: '#9AF04B', Ne: '#FF9F7A',
    Na: '#A45BFF', Mg: '#6FE36F', Al: '#C9C2D6', Si: '#E8C48C', P: '#FF9A2E', S: '#FFD23F', Cl: '#3DDC84', Ar: '#7BD7E6', K: '#8F5BFF', Ca: '#5BE05B',
    Ti: '#C2C8D2', Cr: '#8A99C7', Mn: '#B58CD9', Fe: '#E8743B', Co: '#5C7CF0', Ni: '#5FD08A', Cu: '#D98A4A', Zn: '#8C93D6', Br: '#C4514E', Ag: '#C8CDD6',
    Sn: '#9AA7B5', I: '#9B3FD6', Ba: '#2FD27A', Pt: '#D5D5E0', Au: '#FFC83D', Hg: '#B8B8D0', Pb: '#7E8496', U: '#3DAA6D', Rb: '#7A4BD6', Sr: '#3FD0A0', Cs: '#6C3FC0', Kr: '#5CC8DC', Xe: '#4AA8C4',
    e: '#35E6FF',
  };
  Art.elementColor = function (sym) {
    if (ELEMENT_COLOR[sym]) return ELEMENT_COLOR[sym];
    const e = window.EL && window.EL[sym];
    return e && e.cpk ? e.cpk : '#A79BC2';
  };

  /* ---------- Backgrounds ---------- */
  Art.bg = function (g, W, H, kind = 'micro', t = 0) {
    if (kind === 'lab') return Art.bgLab(g, W, H);
    if (kind === 'soil') return Art.bgSoil(g, W, H);
    const r = g.createRadialGradient(W * 0.5, H * 0.42, 40, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
    r.addColorStop(0, '#3A2466'); r.addColorStop(0.55, '#26163F'); r.addColorStop(1, '#170C29');
    g.fillStyle = r; g.fillRect(0, 0, W, H);
    // A few slow motes give the micro world some depth without competing with the content.
    for (let i = 0; i < 26; i++) {
      const a = Lab.rand(i + 0.3), b = Lab.rand(i + 7.7);
      const x = (a * W + Math.sin(t * 0.12 + i) * 16 + W) % W;
      const y = (b * H + Math.cos(t * 0.1 + i * 2) * 12 + H) % H;
      g.fillStyle = `rgba(214,190,255,${0.05 + 0.06 * Lab.rand(i + 3)})`;
      g.beginPath(); g.arc(x, y, 1.2 + 2.2 * Lab.rand(i + 5), 0, TAU); g.fill();
    }
  };
  /** A lab wall and bench. Returns the y of the bench top; default counter height 70. */
  Art.bgLab = function (g, W, H, benchH = 70) {
    const w = g.createLinearGradient(0, 0, 0, H);
    w.addColorStop(0, '#2C1B4D'); w.addColorStop(1, '#3E2A68');
    g.fillStyle = w; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(255,255,255,.035)'; g.lineWidth = 2;
    const s = 64;
    for (let y = 0; y < H - benchH; y += s) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
      for (let x = (y / s) % 2 ? 0 : s / 2; x < W; x += s) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + s); g.stroke(); }
    }
    Art.bench(g, W, H - benchH, benchH);
    return H - benchH;
  };
  Art.bench = function (g, W, y, h) {
    const b = g.createLinearGradient(0, y, 0, y + h);
    b.addColorStop(0, '#7F5A3B'); b.addColorStop(0.14, '#6A4830'); b.addColorStop(1, '#3F2A20');
    g.fillStyle = b; g.fillRect(0, y, W, h);
    g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(0, y, W, 3);
  };
  Art.bgSoil = function (g, W, H) {
    const d = g.createLinearGradient(0, 0, 0, H);
    d.addColorStop(0, '#3A2340'); d.addColorStop(1, '#231330');
    g.fillStyle = d; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) {
      const x = Lab.rand(i + 11) * W, y = Lab.rand(i + 23) * H, r = 3 + Lab.rand(i + 37) * 10;
      g.fillStyle = `rgba(255,220,190,${0.03 + Lab.rand(i + 2) * 0.05})`;
      g.beginPath(); g.ellipse(x, y, r * 1.3, r, Lab.rand(i) * 3, 0, TAU); g.fill();
    }
  };

  /* ---------- Text ---------- */
  /**
   * Art.text(g, 'Label', x, y, { size:24, color, align:'center', base:'middle', weight:700, font:'body'|'display', halo:true, maxW })
   * Keep size at 20 or more. halo puts a dark edge around text so it reads over anything.
   */
  Art.text = function (g, str, x, y, o = {}) {
    const size = o.size || 24;
    const family = o.font === 'display' ? Art.FONT_DISPLAY : Art.FONT_BODY;
    const weight = o.font === 'display' ? 400 : (o.weight || 700);
    g.font = `${o.italic ? 'italic ' : ''}${weight} ${size}px ${family}`;
    g.textAlign = o.align || 'center';
    g.textBaseline = o.base || 'middle';
    const alpha = o.alpha === undefined ? 1 : o.alpha;
    const prev = g.globalAlpha;
    g.globalAlpha = prev * alpha;
    if (o.halo !== false && o.halo !== undefined) {
      g.lineJoin = 'round'; g.lineWidth = Math.max(3, size * 0.2); g.strokeStyle = o.haloColor || 'rgba(23,12,41,.9)';
      g.strokeText(str, x, y, o.maxW);
    }
    g.fillStyle = o.color || Art.C.ink;
    g.fillText(str, x, y, o.maxW);
    g.globalAlpha = prev;
  };
  /** Split text into lines that fit maxW at the current g.font. */
  Art.wrap = function (g, str, maxW) {
    const words = String(str).split(/\s+/);
    const lines = []; let line = '';
    words.forEach((w) => {
      const test = line ? line + ' ' + w : w;
      if (g.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
    });
    if (line) lines.push(line);
    return lines;
  };
  /** Multi-line wrapped text, returns the bottom y. */
  Art.para = function (g, str, x, y, maxW, o = {}) {
    const size = o.size || 22, lh = o.lh || size * 1.28;
    g.font = `${o.weight || 600} ${size}px ${o.font === 'display' ? Art.FONT_DISPLAY : Art.FONT_BODY}`;
    const lines = Art.wrap(g, str, maxW);
    lines.forEach((l, i) => Art.text(g, l, x, y + i * lh, Object.assign({ base: 'top' }, o, { size })));
    return y + lines.length * lh;
  };

  /** Parse "Ca(OH)2", "SO4^2-", "2H2O", "CO2(g)". Tokens: {t, kind:'n'|'sub'|'sup'}. */
  function parseFormula(f) {
    const tokens = [];
    // Charges, then runs of digits, then any other single character. Nothing is ever dropped:
    // a lost "/" would quietly turn 7/2 into 72.
    const re = /\^([0-9]*[+\-])|(\d+)|([\s\S])/g;
    let m, prevCh = '';
    f = f.replace(/->/g, '→').replace(/<=>/g, '⇌');
    while ((m = re.exec(f))) {
      if (m[1] !== undefined) { tokens.push({ t: m[1], kind: 'sup' }); prevCh = ''; continue; }
      if (m[2] !== undefined) {
        const isSub = /[A-Za-z)\]]/.test(prevCh);
        tokens.push({ t: m[2], kind: isSub ? 'sub' : 'n' }); prevCh = '0'; continue;
      }
      tokens.push({ t: m[3], kind: 'n' }); prevCh = m[3];
    }
    return tokens;
  }
  /**
   * Draw a chemical formula with proper subscripts. Art.formula(g, 'Ca(OH)2', x, y, { size, color, align, colorize, alpha, halo })
   * colorize:true paints each element in its own color. Returns the width drawn.
   */
  Art.formula = function (g, f, x, y, o = {}) {
    const size = o.size || 30;
    const font = (s) => `${o.font === 'body' ? 700 : 400} ${s}px ${o.font === 'body' ? Art.FONT_BODY : Art.FONT_DISPLAY}`;
    const toks = parseFormula(f);
    let w = 0;
    toks.forEach((t) => {
      g.font = font(t.kind === 'n' ? size : size * 0.66);
      t.w = g.measureText(t.t).width;
      w += t.w;
    });
    const align = o.align || 'center';
    let cx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    g.textAlign = 'left';
    g.textBaseline = 'alphabetic';
    const baseY = y + size * 0.36;
    const prevAlpha = g.globalAlpha;
    if (o.alpha !== undefined) g.globalAlpha = prevAlpha * o.alpha;
    toks.forEach((tok, i) => {
      g.font = font(tok.kind === 'n' ? size : size * 0.66);
      const yy = tok.kind === 'sub' ? baseY + size * 0.2 : tok.kind === 'sup' ? baseY - size * 0.42 : baseY;
      let col = o.color || Art.C.ink;
      if (o.colorize && tok.kind === 'n' && /[A-Z]/.test(tok.t)) {
        const next = toks[i + 1];
        const sym = next && /^[a-z]$/.test(next.t) ? tok.t + next.t : tok.t;
        col = Art.elementColor(sym);
        if (Art.lum(col) < 0.45) col = Art.mix(col, '#ffffff', 0.5);
        tok.c = col;
      } else if (o.colorize && /^[a-z]$/.test(tok.t) && toks[i - 1] && toks[i - 1].c) col = toks[i - 1].c;
      if (o.halo) { g.lineJoin = 'round'; g.lineWidth = size * 0.16; g.strokeStyle = 'rgba(23,12,41,.9)'; g.strokeText(tok.t, cx, yy); }
      g.fillStyle = col;
      g.fillText(tok.t, cx, yy);
      cx += tok.w;
    });
    g.globalAlpha = prevAlpha;
    return w;
  };

  /** A rounded label. Art.pill(g, 'Oxygen', x, y, { color, text, size, pad }). */
  Art.pill = function (g, str, x, y, o = {}) {
    const size = o.size || 22;
    g.font = `${o.font === 'display' ? 400 : 700} ${size}px ${o.font === 'display' ? Art.FONT_DISPLAY : Art.FONT_BODY}`;
    const w = g.measureText(str).width + (o.pad || size * 0.9);
    const h = size * 1.55;
    const prev = g.globalAlpha;
    g.globalAlpha = prev * (o.alpha === undefined ? 1 : o.alpha);
    const left = o.align === 'left' ? x : o.align === 'right' ? x - w : x - w / 2;
    g.fillStyle = o.color || Art.C.plum2;
    Art.round(g, left, y - h / 2, w, h, h / 2); g.fill();
    if (o.stroke) { g.strokeStyle = o.stroke; g.lineWidth = 2.5; g.stroke(); }
    g.globalAlpha = prev * (o.alpha === undefined ? 1 : o.alpha);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = o.text || (Art.lum(hexOf(o.color || Art.C.plum2)) > 0.55 ? '#1A0F2E' : '#fff');
    g.fillText(str, left + w / 2, y + size * 0.04);
    g.globalAlpha = prev;
    return w;
  };
  function hexOf(c) { return c; }
  Art.round = function (g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath();
    g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  };
  /** A comic speech bubble; (x, y) is where the tail points. Art.bubble(g, text, x, y, { w, size, side:'up'|'down'|'left'|'right' }). */
  Art.bubble = function (g, str, x, y, o = {}) {
    const size = o.size || 22, maxW = o.w || 300, pad = 14;
    g.font = `700 ${size}px ${Art.FONT_BODY}`;
    const lines = Art.wrap(g, str, maxW - pad * 2);
    const w = Math.min(maxW, Math.max(...lines.map((l) => g.measureText(l).width)) + pad * 2);
    const lh = size * 1.22, h = lines.length * lh + pad * 1.5, tail = 16;
    const side = o.side || 'down';
    let bx = x - w / 2, by = y - h - tail;
    if (side === 'up') by = y + tail;
    if (side === 'left') { bx = x + tail; by = y - h / 2; }
    if (side === 'right') { bx = x - w - tail; by = y - h / 2; }
    bx += o.dx || 0; by += o.dy || 0;
    const prev = g.globalAlpha;
    g.globalAlpha = prev * (o.alpha === undefined ? 1 : o.alpha);
    g.fillStyle = o.color || '#FFFDF2'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    Art.round(g, bx, by, w, h, 16); g.fill(); g.stroke();
    g.beginPath();
    if (side === 'down') { const cx = Lab.clamp(x, bx + 22, bx + w - 22); g.moveTo(cx - 11, by + h - 1.5); g.lineTo(x, y); g.lineTo(cx + 11, by + h - 1.5); }
    if (side === 'up') { const cx = Lab.clamp(x, bx + 22, bx + w - 22); g.moveTo(cx - 11, by + 1.5); g.lineTo(x, y); g.lineTo(cx + 11, by + 1.5); }
    if (side === 'left') { const cy = Lab.clamp(y, by + 18, by + h - 18); g.moveTo(bx + 1.5, cy - 10); g.lineTo(x, y); g.lineTo(bx + 1.5, cy + 10); }
    if (side === 'right') { const cy = Lab.clamp(y, by + 18, by + h - 18); g.moveTo(bx + w - 1.5, cy - 10); g.lineTo(x, y); g.lineTo(bx + w - 1.5, cy + 10); }
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = o.color || '#FFFDF2';
    if (side === 'down') g.fillRect(Lab.clamp(x, bx + 22, bx + w - 22) - 9, by + h - 4, 18, 4.5);
    if (side === 'up') g.fillRect(Lab.clamp(x, bx + 22, bx + w - 22) - 9, by - 0.5, 18, 4.5);
    if (side === 'left') g.fillRect(bx - 0.5, Lab.clamp(y, by + 18, by + h - 18) - 8, 4.5, 16);
    if (side === 'right') g.fillRect(bx + w - 4, Lab.clamp(y, by + 18, by + h - 18) - 8, 4.5, 16);
    g.fillStyle = '#22123A'; g.textAlign = 'center'; g.textBaseline = 'top';
    lines.forEach((l, i) => g.fillText(l, bx + w / 2, by + pad * 0.8 + i * lh));
    g.globalAlpha = prev;
  };

  /* ---------- Arrows and marks ---------- */
  /**
   * Arrow from (x1,y1) to (x2,y2). o: { color, w, head, curve (bend in px), p (0..1 draws part of it), dash, both }
   */
  Art.arrow = function (g, x1, y1, x2, y2, o = {}) {
    const p = o.p === undefined ? 1 : clamp(o.p);
    if (p <= 0) return;
    const color = o.color || Art.C.ink, lw = o.w || 5, head = o.head || lw * 3;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    const bend = o.curve || 0;
    const cx = mx - (dy / len) * bend, cy = my + (dx / len) * bend;
    const at = (t) => [(1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2, (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2];
    g.save();
    g.strokeStyle = color; g.fillStyle = color; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
    if (o.dash) g.setLineDash(o.dash);
    if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
    g.beginPath(); g.moveTo(x1, y1);
    const N = 26; let tip = [x1, y1], prev = [x1, y1];
    for (let i = 1; i <= N; i++) { const t = (i / N) * p; prev = tip; tip = at(t); g.lineTo(tip[0], tip[1]); }
    g.stroke(); g.setLineDash([]);
    const a = Math.atan2(tip[1] - prev[1], tip[0] - prev[0]);
    const hd = (px, py, ang) => {
      g.beginPath(); g.moveTo(px + Math.cos(ang) * head * 0.45, py + Math.sin(ang) * head * 0.45);
      g.lineTo(px + Math.cos(ang + 2.5) * head, py + Math.sin(ang + 2.5) * head);
      g.lineTo(px + Math.cos(ang - 2.5) * head, py + Math.sin(ang - 2.5) * head);
      g.closePath(); g.fill();
    };
    hd(tip[0], tip[1], a);
    if (o.both) hd(x1, y1, Math.atan2(y1 - cy, x1 - cx));
    g.restore();
  };
  /** Chalky circle around something, drawn on with p. */
  Art.ring = function (g, x, y, r, o = {}) {
    g.save();
    g.strokeStyle = o.color || Art.C.sun; g.lineWidth = o.w || 5; g.lineCap = 'round';
    if (o.dash) g.setLineDash(o.dash);
    g.beginPath(); g.arc(x, y, r, -1.6, -1.6 + TAU * clamp(o.p === undefined ? 1 : o.p)); g.stroke();
    g.restore();
  };
  /** A slash through something (crossing out a unit or a spectator ion). */
  Art.strike = function (g, x1, y1, x2, y2, p = 1, color = '#FF5A6B', w = 5) {
    g.save(); g.strokeStyle = color; g.lineWidth = w; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 + (x2 - x1) * clamp(p), y1 + (y2 - y1) * clamp(p)); g.stroke();
    g.restore();
  };
  /** Sparkle burst at p in 0..1. Deterministic. */
  Art.burst = function (g, x, y, p, o = {}) {
    if (p <= 0 || p >= 1) return;
    const n = o.n || 14, R = o.r || 80, colors = o.colors || [Art.C.sun, Art.C.pink, Art.C.cyan, '#fff'];
    const e = 1 - Math.pow(1 - p, 3);
    g.save();
    g.globalAlpha *= 1 - p * p;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + Lab.rand(i + (o.seed || 0)) * 0.6;
      const d = R * e * (0.55 + Lab.rand(i + 5 + (o.seed || 0)) * 0.6);
      const s = (o.size || 7) * (1 - p * 0.6);
      g.fillStyle = colors[i % colors.length];
      Art.star(g, x + Math.cos(a) * d, y + Math.sin(a) * d, s, a + p * 3);
    }
    g.restore();
  };
  Art.star = function (g, x, y, r, rot = 0) {
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = rot + (i / 8) * TAU, rr = i % 2 ? r * 0.42 : r;
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      if (i) g.lineTo(px, py); else g.moveTo(px, py);
    }
    g.closePath(); g.fill();
  };
  /** Soft colored glow. */
  Art.glow = function (g, x, y, r, color, a = 0.6) {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, Art.alpha(color, a)); gr.addColorStop(1, Art.alpha(color, 0));
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  };

  /* ---------- Atoms ---------- */
  const sprites = new Map();
  function sphere(color, r) {
    const key = color + '|' + Math.round(r * 2);
    let c = sprites.get(key);
    if (c) return c;
    const S = 3, pad = 3;
    const size = Math.ceil((r + pad) * 2 * S);
    c = document.createElement('canvas'); c.width = c.height = size;
    const x = c.getContext('2d');
    x.scale(S, S); x.translate(r + pad, r + pad);
    const g1 = x.createRadialGradient(-r * 0.38, -r * 0.42, r * 0.05, 0, 0, r * 1.05);
    g1.addColorStop(0, Art.mix(color, '#ffffff', 0.62));
    g1.addColorStop(0.4, color);
    g1.addColorStop(0.82, Art.mix(color, '#12062A', 0.32));
    g1.addColorStop(1, Art.mix(color, '#12062A', 0.55));
    x.fillStyle = g1; x.beginPath(); x.arc(0, 0, r, 0, TAU); x.fill();
    // Bounced light along the lower right edge keeps dark atoms from sinking into the background.
    const rim = x.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.72, -r * 0.2, -r * 0.2, r * 1.26);
    rim.addColorStop(0, 'rgba(255,255,255,0)');
    rim.addColorStop(0.72, 'rgba(255,255,255,0)');
    rim.addColorStop(1, Art.lum(color) < 0.3 ? 'rgba(190,170,255,.55)' : 'rgba(255,255,255,.28)');
    x.save(); x.beginPath(); x.arc(0, 0, r, 0, TAU); x.clip();
    x.fillStyle = rim; x.fillRect(-r - 2, -r - 2, r * 2 + 4, r * 2 + 4); x.restore();
    // Glossy highlight.
    x.fillStyle = 'rgba(255,255,255,.72)';
    x.beginPath(); x.ellipse(-r * 0.36, -r * 0.5, r * 0.26, r * 0.15, -0.6, 0, TAU); x.fill();
    x.fillStyle = 'rgba(255,255,255,.5)';
    x.beginPath(); x.arc(-r * 0.62, -r * 0.2, r * 0.05, 0, TAU); x.fill();
    sprites.set(key, c);
    c._pad = pad;
    return c;
  }
  /** Just the glossy ball. */
  Art.ball = function (g, x, y, r, color) {
    const c = sphere(color, r);
    const s = r + c._pad;
    g.drawImage(c, x - s, y - s, s * 2, s * 2);
  };

  /** A cute face. mood: 'happy','grin','wow','sad','grumpy','sleepy','wink','love'. look: [-1..1, -1..1] pupil direction. */
  Art.face = function (g, x, y, r, mood = 'happy', o = {}) {
    const look = o.look || [0, 0];
    const eyeX = r * 0.3, eyeY = -r * 0.14, eyeR = r * 0.21;
    const dark = '#22123A';
    const blink = o.t !== undefined && ((o.t + (o.seed || 0) * 1.7) % 4.1) > 3.96;
    const mouthColor = o.mouthColor || dark;
    g.save();
    g.translate(x, y);
    const drawEye = (ex, wink) => {
      if (blink || wink || mood === 'sleepy') {
        g.strokeStyle = dark; g.lineWidth = Math.max(1.6, r * 0.075); g.lineCap = 'round';
        g.beginPath(); g.moveTo(ex - eyeR * 0.85, eyeY); g.quadraticCurveTo(ex, eyeY + (mood === 'sleepy' ? eyeR * 0.5 : -eyeR * 0.1), ex + eyeR * 0.85, eyeY); g.stroke();
        return;
      }
      const big = mood === 'wow' ? 1.18 : 1;
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ex, eyeY, eyeR * big, eyeR * 1.12 * big, 0, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(34,18,58,.55)'; g.lineWidth = Math.max(1, r * 0.03); g.stroke();
      const px = ex + look[0] * eyeR * 0.42, py = eyeY + look[1] * eyeR * 0.42;
      g.fillStyle = dark; g.beginPath(); g.arc(px, py, eyeR * 0.62 * big, 0, TAU); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(px + eyeR * 0.2, py - eyeR * 0.24, eyeR * 0.2, 0, TAU); g.fill();
    };
    drawEye(-eyeX, false);
    drawEye(eyeX, mood === 'wink');
    if (mood === 'grumpy' || mood === 'sad') {
      g.strokeStyle = dark; g.lineWidth = Math.max(1.6, r * 0.08); g.lineCap = 'round';
      const tilt = mood === 'grumpy' ? 1 : -1;
      g.beginPath(); g.moveTo(-eyeX - eyeR, eyeY - eyeR * 1.35 - tilt * eyeR * 0.25); g.lineTo(-eyeX + eyeR, eyeY - eyeR * 1.35 + tilt * eyeR * 0.25); g.stroke();
      g.beginPath(); g.moveTo(eyeX + eyeR, eyeY - eyeR * 1.35 - tilt * eyeR * 0.25); g.lineTo(eyeX - eyeR, eyeY - eyeR * 1.35 + tilt * eyeR * 0.25); g.stroke();
    }
    g.strokeStyle = mouthColor; g.lineWidth = Math.max(1.8, r * 0.085); g.lineCap = 'round';
    const my = r * 0.17;
    g.beginPath();
    if (mood === 'wow') { g.fillStyle = '#7B1E45'; g.ellipse(0, my + r * 0.04, r * 0.11, r * 0.14, 0, 0, TAU); g.fill(); }
    else if (mood === 'grin') {
      g.fillStyle = '#7B1E45'; g.moveTo(-r * 0.24, my - r * 0.02); g.quadraticCurveTo(0, my + r * 0.42, r * 0.24, my - r * 0.02); g.closePath(); g.fill();
      g.fillStyle = '#fff'; g.fillRect(-r * 0.15, my - r * 0.02, r * 0.3, r * 0.08);
    }
    else if (mood === 'sad' || mood === 'grumpy') { g.moveTo(-r * 0.16, my + r * 0.11); g.quadraticCurveTo(0, my - r * 0.07, r * 0.16, my + r * 0.11); g.stroke(); }
    else if (mood === 'sleepy') { g.moveTo(-r * 0.09, my + r * 0.06); g.lineTo(r * 0.09, my + r * 0.06); g.stroke(); }
    else { g.moveTo(-r * 0.17, my); g.quadraticCurveTo(0, my + r * 0.22, r * 0.17, my); g.stroke(); }
    if (['happy', 'grin', 'wink', 'love'].includes(mood)) {
      g.fillStyle = 'rgba(255,90,140,.38)';
      g.beginPath(); g.ellipse(-r * 0.54, r * 0.08, r * 0.13, r * 0.08, 0, 0, TAU); g.fill();
      g.beginPath(); g.ellipse(r * 0.54, r * 0.08, r * 0.13, r * 0.08, 0, 0, TAU); g.fill();
    }
    g.restore();
  };

  /**
   * Art.atom(g, x, y, r, 'O', { face:'happy', look:[1,0], t, seed, label, color, charge:'2-', glow, alpha, labelColor })
   * label:false hides the symbol. With a face, the symbol sits low on the belly.
   */
  Art.atom = function (g, x, y, r, sym, o = {}) {
    const color = o.color || Art.elementColor(sym);
    const prev = g.globalAlpha;
    if (o.alpha !== undefined) g.globalAlpha = prev * o.alpha;
    if (o.glow) Art.glow(g, x, y, r * 1.9, color, 0.45 * o.glow);
    Art.ball(g, x, y, r, color);
    const showLabel = o.label !== false && (o.label || sym);
    const lc = o.labelColor || (Art.lum(color) > 0.62 ? '#22123A' : '#fff');
    if (o.face) {
      Art.face(g, x, y - r * 0.08, r, o.face, { look: o.look, t: o.t, seed: o.seed, mouthColor: Art.lum(color) < 0.32 ? '#fff' : undefined });
      if (showLabel && r >= 18) {
        const fs = Math.max(13, r * 0.46);
        g.font = `400 ${fs}px ${Art.FONT_DISPLAY}`;
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = lc;
        g.fillText(o.label || sym, x, y + r * 0.68);
      }
    } else if (showLabel && r >= 9) {
      const str = o.label || sym;
      const fs = str.length > 2 ? r * 0.72 : str.length === 2 ? r * 0.84 : r * 1.02;
      g.font = `400 ${fs}px ${Art.FONT_DISPLAY}`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = lc;
      g.fillText(str, x, y + r * 0.05);
    }
    if (o.charge) {
      const br = Math.max(11, r * 0.42);
      const bx = x + r * 0.74, by = y - r * 0.74;
      const pos = /\+/.test(o.charge);
      g.fillStyle = pos ? '#FF3D7F' : '#1FA5FF';
      g.strokeStyle = '#1A0F2E'; g.lineWidth = 2;
      g.beginPath(); g.arc(bx, by, br, 0, TAU); g.fill(); g.stroke();
      g.font = `700 ${br * 1.26}px ${Art.FONT_BODY}`;
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(o.charge.replace('-', '−'), bx, by + 0.5);
    }
    g.globalAlpha = prev;
  };

  /** An electron: a glowing cyan dot. */
  Art.electron = function (g, x, y, r = 7, o = {}) {
    Art.glow(g, x, y, r * 2.6, o.color || Art.C.electron, 0.55);
    Art.ball(g, x, y, r, o.color || Art.C.electron);
    if (o.label) Art.text(g, '−', x, y - 0.5, { size: r * 1.7, color: '#06324A' });
  };
  Art.proton = function (g, x, y, r = 12) { Art.ball(g, x, y, r, Art.C.proton); Art.text(g, '+', x, y, { size: r * 1.5, color: '#fff' }); };
  Art.neutron = function (g, x, y, r = 12) { Art.ball(g, x, y, r, Art.C.neutron); };

  /* ---------- Molecules ---------- */
  // Unit bond length is 1. Atoms: [sym, x, y]; bonds: [i, j, order].
  const k = 0.5, s3 = Math.sqrt(3) / 2;
  const MOLS = {
    H2: { a: [['H', -k, 0], ['H', k, 0]], b: [[0, 1, 1]] },
    O2: { a: [['O', -k, 0], ['O', k, 0]], b: [[0, 1, 2]] },
    N2: { a: [['N', -k, 0], ['N', k, 0]], b: [[0, 1, 3]] },
    F2: { a: [['F', -k, 0], ['F', k, 0]], b: [[0, 1, 1]] },
    Cl2: { a: [['Cl', -k, 0], ['Cl', k, 0]], b: [[0, 1, 1]] },
    Br2: { a: [['Br', -k, 0], ['Br', k, 0]], b: [[0, 1, 1]] },
    I2: { a: [['I', -k, 0], ['I', k, 0]], b: [[0, 1, 1]] },
    HCl: { a: [['H', -k, 0], ['Cl', k, 0]], b: [[0, 1, 1]] },
    HF: { a: [['H', -k, 0], ['F', k, 0]], b: [[0, 1, 1]] },
    CO: { a: [['C', -k, 0], ['O', k, 0]], b: [[0, 1, 3]] },
    NO: { a: [['N', -k, 0], ['O', k, 0]], b: [[0, 1, 2]] },
    NaCl: { a: [['Na', -k, 0], ['Cl', k, 0]], b: [] },
    H2O: { a: [['O', 0, -0.25], ['H', -0.8, 0.38], ['H', 0.8, 0.38]], b: [[0, 1, 1], [0, 2, 1]] },
    H2S: { a: [['S', 0, -0.25], ['H', -0.85, 0.42], ['H', 0.85, 0.42]], b: [[0, 1, 1], [0, 2, 1]] },
    CO2: { a: [['O', -1, 0], ['C', 0, 0], ['O', 1, 0]], b: [[0, 1, 2], [1, 2, 2]] },
    SO2: { a: [['S', 0, -0.25], ['O', -0.92, 0.36], ['O', 0.92, 0.36]], b: [[0, 1, 2], [0, 2, 2]] },
    NO2: { a: [['N', 0, -0.25], ['O', -0.92, 0.36], ['O', 0.92, 0.36]], b: [[0, 1, 2], [0, 2, 1]] },
    O3: { a: [['O', 0, -0.25], ['O', -0.92, 0.36], ['O', 0.92, 0.36]], b: [[0, 1, 2], [0, 2, 1]] },
    NH3: { a: [['N', 0, -0.12], ['H', -0.9, 0.3], ['H', 0.9, 0.3], ['H', 0, 0.82]], b: [[0, 1, 1], [0, 2, 1], [0, 3, 1]] },
    CH4: { a: [['C', 0, 0], ['H', 0, -1], ['H', 1, 0], ['H', 0, 1], ['H', -1, 0]], b: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]] },
    H2O2: { a: [['O', -k, 0], ['O', k, 0], ['H', -1.05, -0.72], ['H', 1.05, 0.72]], b: [[0, 1, 1], [0, 2, 1], [1, 3, 1]] },
    C2H5OH: {
      a: [['C', -1.3, 0.25], ['C', 0, -0.25], ['O', 1.25, 0.25], ['H', 2, -0.35], ['H', -1.3, 1.25], ['H', -2.25, -0.1], ['H', -1.55, -0.7], ['H', 0, -1.25], ['H', 0.1, 0.72]],
      b: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [0, 4, 1], [0, 5, 1], [0, 6, 1], [1, 7, 1], [1, 8, 1]],
    },
    CH3OH: { a: [['C', -0.55, 0], ['O', 0.65, 0], ['H', 1.35, -0.6], ['H', -0.55, -1.05], ['H', -1.6, 0], ['H', -0.55, 1.05]], b: [[0, 1, 1], [1, 2, 1], [0, 3, 1], [0, 4, 1], [0, 5, 1]] },
    C2H2: { a: [['C', -k, 0], ['C', k, 0], ['H', -1.45, 0], ['H', 1.45, 0]], b: [[0, 1, 3], [0, 2, 1], [1, 3, 1]] },
    C2H4: { a: [['C', -k, 0], ['C', k, 0], ['H', -1.05, -0.85], ['H', -1.05, 0.85], ['H', 1.05, -0.85], ['H', 1.05, 0.85]], b: [[0, 1, 2], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]] },
  };
  /** Build a straight-chain alkane CnH2n+2 as a zigzag. */
  function alkane(n) {
    // Drawn flat like a Lewis structure: an H above and below each C, plus one on each end.
    const a = [], b = [];
    const x0 = -(n - 1) / 2;
    for (let i = 0; i < n; i++) a.push(['C', x0 + i, 0]);
    for (let i = 0; i < n - 1; i++) b.push([i, i + 1, 1]);
    const addH = (c, hx, hy) => { a.push(['H', hx, hy]); b.push([c, a.length - 1, 1]); };
    for (let i = 0; i < n; i++) { addH(i, x0 + i, -1); addH(i, x0 + i, 1); }
    addH(0, x0 - 1, 0);
    addH(n - 1, x0 + n, 0);
    return { a, b };
  }
  Art.moleculeData = function (f) {
    if (MOLS[f]) return MOLS[f];
    const m = /^C(\d+)H(\d+)$/.exec(f);
    if (m && +m[2] === 2 * +m[1] + 2) return (MOLS[f] = alkane(+m[1]));
    return null;
  };
  const RADIUS = { H: 0.56, C: 0.82, N: 0.8, O: 0.78, F: 0.72, Cl: 0.98, S: 1, Na: 1.1, Br: 1.05, I: 1.15, P: 1 };
  /**
   * Art.molecule(g, x, y, s, 'H2O', { rot, style:'ball'|'fill', face, look, t, alpha, label, bondColor, scale, showLabels })
   * s is the bond length in stage units. Known names: see MOLS; any straight alkane such as C3H8 works too.
   * 'ball' (default) draws ball and stick, 'fill' overlaps atoms. Returns false if the formula is unknown.
   */
  Art.molecule = function (g, x, y, s, f, o = {}) {
    const m = Art.moleculeData(f);
    if (!m) return false;
    const rot = o.rot || 0, c = Math.cos(rot), d = Math.sin(rot);
    const fill = o.style === 'fill';
    const atomR = (sym) => (RADIUS[sym] || 0.9) * s * (fill ? 0.62 : 0.42) * (o.atomScale || 1);
    const pts = m.a.map(([sym, ax, ay]) => ({ sym, x: x + (ax * c - ay * d) * s, y: y + (ax * d + ay * c) * s }));
    const prev = g.globalAlpha;
    if (o.alpha !== undefined) g.globalAlpha = prev * o.alpha;
    if (!fill) {
      m.b.forEach(([i, j, order]) => Art.bond(g, pts[i].x, pts[i].y, pts[j].x, pts[j].y, { order, width: Math.max(3, s * 0.11), color: o.bondColor }));
    }
    const order = pts.map((_, i) => i).sort((a, b) => (fill ? (pts[a].sym === 'H' ? 1 : -1) - (pts[b].sym === 'H' ? 1 : -1) : 0));
    order.forEach((i) => {
      const p = pts[i];
      const r = atomR(p.sym);
      const big = p.sym !== 'H' || m.a.length <= 3;
      const showFace = o.face && (i === 0 || (o.faceAll && r >= 14));
      Art.atom(g, p.x, p.y, r, p.sym, {
        label: o.labels === false ? false : (r >= 9 ? p.sym : false),
        face: showFace ? o.face : null, look: o.look, t: o.t, seed: i + (o.seed || 0),
      });
      void big;
    });
    g.globalAlpha = prev;
    return true;
  };
  /** A stick bond, with parallel lines for double and triple. */
  Art.bond = function (g, x1, y1, x2, y2, o = {}) {
    const order = o.order || 1, w = o.width || 6;
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    g.save();
    g.lineCap = 'round';
    const gap = w * 1.5;
    const offs = order === 1 ? [0] : order === 2 ? [-gap / 2, gap / 2] : [-gap, 0, gap];
    offs.forEach((off) => {
      g.strokeStyle = 'rgba(16,6,34,.75)'; g.lineWidth = w + 2.5;
      g.beginPath(); g.moveTo(x1 + nx * off, y1 + ny * off); g.lineTo(x2 + nx * off, y2 + ny * off); g.stroke();
      g.strokeStyle = o.color || '#D9D1EC'; g.lineWidth = w;
      g.beginPath(); g.moveTo(x1 + nx * off, y1 + ny * off); g.lineTo(x2 + nx * off, y2 + ny * off); g.stroke();
    });
    g.restore();
  };

  /* ---------- Glassware and lab gear ---------- */
  function liquidGrad(g, c, x0, x1, y0, y1) {
    const gr = g.createLinearGradient(x0, y0, x1, y1);
    gr.addColorStop(0, Art.alpha(Art.mix(c, '#ffffff', 0.18), 0.82));
    gr.addColorStop(1, Art.alpha(Art.mix(c, '#000030', 0.2), 0.92));
    return gr;
  }
  function glassStroke(g, path, w = 3.4) {
    g.lineJoin = 'round'; g.lineCap = 'round';
    g.strokeStyle = 'rgba(18,7,40,.6)'; g.lineWidth = w + 3; g.stroke(path);
    g.strokeStyle = Art.C.glass; g.lineWidth = w; g.stroke(path);
  }
  /**
   * Art.beaker(g, cx, baseY, w, h, { level:0..1, liquid:color, ticks:true, label, inside(g, box) })
   * inside is drawn clipped to the liquid (draw particles there). Returns { x0, x1, top, bottom, surface }.
   */
  Art.beaker = function (g, cx, baseY, w, h, o = {}) {
    const x0 = cx - w / 2, x1 = cx + w / 2, top = baseY - h;
    const r = Math.min(16, w * 0.1);
    const body = new Path2D();
    body.moveTo(x0 - 7, top - 4);
    body.lineTo(x0, top + 8);
    body.lineTo(x0, baseY - r); body.quadraticCurveTo(x0, baseY, x0 + r, baseY);
    body.lineTo(x1 - r, baseY); body.quadraticCurveTo(x1, baseY, x1, baseY - r);
    body.lineTo(x1, top + 4); body.lineTo(x1 + 2, top - 2);
    g.fillStyle = 'rgba(214,240,255,.06)'; g.fill(body);
    const level = clamp(o.level === undefined ? 0 : o.level);
    const surface = baseY - (h - 12) * level;
    if (level > 0) {
      g.save(); g.clip(body);
      g.fillStyle = liquidGrad(g, o.liquid || Art.C.water, x0, x1, surface, baseY);
      g.fillRect(x0, surface, w, baseY - surface);
      if (o.inside) o.inside(g, { x0, x1, top: surface, bottom: baseY });
      g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(x0, surface, w, 4);
      g.restore();
    } else if (o.inside) { g.save(); g.clip(body); o.inside(g, { x0, x1, top, bottom: baseY }); g.restore(); }
    if (o.ticks !== false) {
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2;
      for (let i = 1; i <= 4; i++) {
        const y = baseY - (h - 12) * (i / 5);
        g.beginPath(); g.moveTo(x1 - 6, y); g.lineTo(x1 - (i % 2 ? 26 : 16), y); g.stroke();
      }
    }
    glassStroke(g, body);
    g.fillStyle = 'rgba(255,255,255,.26)';
    Art.round(g, x0 + 9, top + 18, 7, h * 0.6, 3.5); g.fill();
    if (o.label) Art.text(g, o.label, cx, baseY + 24, { size: o.labelSize || 22, color: Art.C.ink, halo: true });
    return { x0, x1, top, bottom: baseY, surface };
  };
  /** Conical (Erlenmeyer) flask. Same options as beaker. */
  Art.flask = function (g, cx, baseY, w, h, o = {}) {
    const neckW = w * 0.3, neckH = h * 0.3;
    const x0 = cx - w / 2, x1 = cx + w / 2, top = baseY - h;
    const body = new Path2D();
    body.moveTo(cx - neckW / 2 - 4, top); body.lineTo(cx - neckW / 2, top + 5);
    body.lineTo(cx - neckW / 2, top + neckH);
    body.lineTo(x0 + 4, baseY - 18); body.quadraticCurveTo(x0 - 3, baseY, x0 + 18, baseY);
    body.lineTo(x1 - 18, baseY); body.quadraticCurveTo(x1 + 3, baseY, x1 - 4, baseY - 18);
    body.lineTo(cx + neckW / 2, top + neckH); body.lineTo(cx + neckW / 2, top + 5); body.lineTo(cx + neckW / 2 + 4, top);
    g.fillStyle = 'rgba(214,240,255,.06)'; g.fill(body);
    const level = clamp(o.level === undefined ? 0 : o.level);
    const surface = baseY - (h - neckH - 6) * level;
    if (level > 0) {
      g.save(); g.clip(body);
      g.fillStyle = liquidGrad(g, o.liquid || Art.C.water, x0, x1, surface, baseY);
      g.fillRect(x0 - 5, surface, w + 10, baseY - surface);
      if (o.inside) o.inside(g, { x0, x1, top: surface, bottom: baseY });
      g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(x0 - 5, surface, w + 10, 4);
      g.restore();
    }
    glassStroke(g, body);
    g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx - neckW / 2 - w * 0.1, baseY - h * 0.2); g.lineTo(cx - neckW / 2 + 2, top + neckH + h * 0.1); g.stroke();
    if (o.label) Art.text(g, o.label, cx, baseY + 24, { size: o.labelSize || 22, color: Art.C.ink, halo: true });
    return { x0, x1, top, bottom: baseY, surface, neckY: top };
  };
  /** Test tube standing vertically; (cx, topY) is the rim. */
  Art.testTube = function (g, cx, topY, w, h, o = {}) {
    const x0 = cx - w / 2, x1 = cx + w / 2, bottom = topY + h, r = w / 2;
    const body = new Path2D();
    body.moveTo(x0 - 3, topY); body.lineTo(x0, topY + 3); body.lineTo(x0, bottom - r); body.arc(cx, bottom - r, r, Math.PI, 0, true); body.lineTo(x1, topY + 3); body.lineTo(x1 + 3, topY);
    g.fillStyle = 'rgba(214,240,255,.06)'; g.fill(body);
    const level = clamp(o.level === undefined ? 0 : o.level);
    const surface = bottom - (h - 10) * level;
    if (level > 0) {
      g.save(); g.clip(body);
      g.fillStyle = liquidGrad(g, o.liquid || Art.C.water, x0, x1, surface, bottom);
      g.fillRect(x0, surface, w, bottom - surface);
      if (o.inside) o.inside(g, { x0, x1, top: surface, bottom });
      g.restore();
    }
    glassStroke(g, body, 3);
    g.fillStyle = 'rgba(255,255,255,.28)'; Art.round(g, x0 + w * 0.2, topY + 12, Math.max(3, w * 0.12), h * 0.6, 3); g.fill();
    return { x0, x1, top: topY, bottom, surface };
  };
  /** Burette: tall thin tube with a stopcock; (cx, topY) is the top. open: 0..1. Returns the tip position. */
  Art.burette = function (g, cx, topY, w, h, o = {}) {
    const box = Art.testTube(g, cx, topY, w, h, { level: 0 });
    void box;
    const x0 = cx - w / 2, bottom = topY + h;
    const level = clamp(o.level === undefined ? 0.8 : o.level);
    g.save();
    g.beginPath(); g.rect(x0 + 2, topY + 3 + (h - 12) * (1 - level), w - 4, (h - 12) * level);
    g.fillStyle = Art.alpha(o.liquid || Art.C.water, 0.8); g.fill(); g.restore();
    g.fillStyle = '#2B1A4A'; g.strokeStyle = Art.C.glass; g.lineWidth = 2.5;
    Art.round(g, cx - 5, bottom - 6, 10, 26, 4); g.fill(); g.stroke();
    const open = clamp(o.open || 0);
    g.save(); g.translate(cx, bottom + 8); g.rotate(open * 1.4);
    g.fillStyle = o.valveColor || Art.C.sun; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2;
    Art.round(g, -19, -5, 38, 10, 5); g.fill(); g.stroke(); g.restore();
    if (o.ticks !== false) {
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.6;
      for (let i = 0; i <= 10; i++) {
        const y = topY + 8 + ((h - 20) * i) / 10;
        g.beginPath(); g.moveTo(cx + w / 2 - 1, y); g.lineTo(cx + w / 2 - (i % 5 ? 6 : 11), y); g.stroke();
      }
    }
    return { tipX: cx, tipY: bottom + 22 };
  };
  /** Graduated cylinder; level 0..1. Returns { surface, x0, x1, top, bottom }. */
  Art.cylinder = function (g, cx, baseY, w, h, o = {}) {
    const x0 = cx - w / 2, x1 = cx + w / 2, top = baseY - h;
    const level = clamp(o.level === undefined ? 0 : o.level);
    const surface = baseY - 14 - (h - 26) * level;
    g.fillStyle = 'rgba(214,240,255,.07)'; g.fillRect(x0, top, w, h - 12);
    if (level > 0) {
      g.fillStyle = liquidGrad(g, o.liquid || Art.C.water, x0, x1, surface, baseY);
      g.fillRect(x0 + 1.5, surface, w - 3, baseY - 14 - surface);
      // The meniscus: liquid curves up the glass, you read the bottom.
      g.fillStyle = 'rgba(255,255,255,.4)';
      g.beginPath(); g.moveTo(x0 + 1.5, surface - 5); g.quadraticCurveTo(cx, surface + 7, x1 - 1.5, surface - 5); g.lineTo(x1 - 1.5, surface); g.lineTo(x0 + 1.5, surface); g.closePath(); g.fill();
      if (o.inside) { g.save(); g.beginPath(); g.rect(x0 + 1.5, surface, w - 3, baseY - 14 - surface); g.clip(); o.inside(g, { x0, x1, top: surface, bottom: baseY - 14 }); g.restore(); }
    }
    const body = new Path2D();
    body.moveTo(x0 - 4, top); body.lineTo(x0, top + 5); body.lineTo(x0, baseY - 12); body.moveTo(x1, baseY - 12); body.lineTo(x1, top + 5); body.lineTo(x1 + 4, top);
    glassStroke(g, body, 3);
    g.fillStyle = 'rgba(214,240,255,.5)'; g.strokeStyle = 'rgba(18,7,40,.6)'; g.lineWidth = 2;
    Art.round(g, cx - w * 0.8, baseY - 12, w * 1.6, 12, 5); g.fill(); g.stroke();
    if (o.ticks !== false) {
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.8;
      for (let i = 1; i <= 10; i++) {
        const y = baseY - 14 - ((h - 26) * i) / 10;
        g.beginPath(); g.moveTo(x1 - 2, y); g.lineTo(x1 - (i % 5 ? 8 : 15), y); g.stroke();
      }
    }
    return { x0, x1, top, bottom: baseY - 14, surface };
  };
  /** Flame. kind: 'orange' (candle or starved of air), 'blue' (plenty of oxygen). Base at (x, y). */
  Art.flame = function (g, x, y, h, t, o = {}) {
    const kind = o.kind || 'orange';
    const layers = kind === 'blue'
      ? [[1, '#3D7BFF', 0.55], [0.72, '#52C8FF', 0.85], [0.42, '#C8F4FF', 0.95]]
      : [[1, '#FF6A13', 0.85], [0.74, '#FFB01F', 0.95], [0.46, '#FFF2A6', 1]];
    const f1 = Math.sin(t * 13) * 0.05 + Math.sin(t * 21 + 1) * 0.03;
    const sway = Math.sin(t * 9) * h * 0.035 + Math.sin(t * 17) * h * 0.02;
    Art.glow(g, x, y - h * 0.45, h * 1.05, kind === 'blue' ? '#3D7BFF' : '#FF8A2B', 0.3);
    layers.forEach(([s, c, a], i) => {
      const hh = h * s * (1 + f1 * (i + 1) * 0.7), w = h * 0.34 * s * (o.wide || 1);
      g.fillStyle = Art.alpha(c, a);
      g.beginPath(); g.moveTo(x, y);
      g.bezierCurveTo(x - w * 1.25, y - hh * 0.12, x - w * 0.95 + sway * 0.3, y - hh * 0.56, x + sway * (1 + i * 0.25), y - hh);
      g.bezierCurveTo(x + w * 0.95 + sway * 0.3, y - hh * 0.56, x + w * 1.25, y - hh * 0.12, x, y);
      g.fill();
    });
  };
  /** Bunsen burner. air: 0 (closed: lazy yellow flame) to 1 (open: hot blue cone). flame: 0..1 height. Base at (x, y). */
  Art.bunsen = function (g, x, y, s = 1, o = {}) {
    const air = clamp(o.air === undefined ? 1 : o.air), fl = clamp(o.flame === undefined ? 1 : o.flame), t = o.t || 0;
    g.save();
    g.fillStyle = '#6E6A86'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
    Art.round(g, x - 34 * s, y - 13 * s, 68 * s, 13 * s, 5 * s); g.fill(); g.stroke();
    const barrel = g.createLinearGradient(x - 10 * s, 0, x + 10 * s, 0);
    barrel.addColorStop(0, '#6F6B8E'); barrel.addColorStop(0.45, '#D2CFE6'); barrel.addColorStop(1, '#5E5A7B');
    g.fillStyle = barrel;
    Art.round(g, x - 10 * s, y - 92 * s, 20 * s, 80 * s, 3 * s); g.fill(); g.stroke();
    g.fillStyle = '#FFD23F';
    Art.round(g, x - 12 * s, y - 34 * s, 24 * s, 14 * s, 3 * s); g.fill(); g.stroke();
    g.fillStyle = '#1A0F2E';
    g.beginPath(); g.ellipse(x, y - 27 * s, 5.5 * s * (0.25 + air * 0.75), 4 * s, 0, 0, TAU); g.fill();
    g.fillStyle = '#FF5A6B'; g.fillRect(x + 28 * s, y - 9 * s, 26 * s, 6 * s);
    g.restore();
    if (fl > 0) {
      const fy = y - 92 * s, h = (70 + air * 26) * s * fl;
      if (air < 0.5) Art.flame(g, x, fy, h * 1.3, t, { kind: 'orange', wide: 1.05 });
      else {
        Art.flame(g, x, fy, h, t, { kind: 'blue', wide: 0.72 });
        g.fillStyle = 'rgba(130,230,255,.9)';
        g.beginPath(); g.moveTo(x - 7 * s, fy); g.lineTo(x, fy - h * 0.48); g.lineTo(x + 7 * s, fy); g.closePath(); g.fill();
      }
    }
    return { flameX: x, flameY: y - 92 * s };
  };
  /** Thermometer. frac 0..1 fill. (x, y) is the top. */
  Art.thermometer = function (g, x, y, h, frac, o = {}) {
    const w = o.w || 15, bulb = w * 1.0;
    const color = o.color || '#FF4D5E';
    const yb = y + h;
    g.fillStyle = 'rgba(255,255,255,.14)'; g.strokeStyle = Art.C.glass; g.lineWidth = 3;
    Art.round(g, x - w / 2, y, w, h, w / 2); g.fill(); g.stroke();
    g.beginPath(); g.arc(x, yb, bulb, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = color;
    const top = yb - (h - 8) * clamp(frac);
    Art.round(g, x - w * 0.26, top, w * 0.52, yb - top, w * 0.26); g.fill();
    g.beginPath(); g.arc(x, yb, bulb * 0.72, 0, TAU); g.fill();
    if (o.ticks !== false) {
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.8;
      for (let i = 1; i <= 8; i++) {
        const ty = yb - ((h - 8) * i) / 9;
        g.beginPath(); g.moveTo(x + w / 2 + 3, ty); g.lineTo(x + w / 2 + (i % 2 ? 8 : 12), ty); g.stroke();
      }
    }
    if (o.label) Art.text(g, o.label, x, y - 18, { size: o.size || 22, color: Art.C.ink, halo: true });
    return { top };
  };
  /** Two-pan balance. tilt: -1 (left down) to 1 (right down). drawLeft/drawRight(g, x, y) draw on the pans. */
  Art.balance = function (g, x, y, w, tilt = 0, o = {}) {
    const ang = clamp(tilt, -1, 1) * 0.16;
    const col = o.color || '#E4DEF4';
    g.save();
    g.lineCap = 'round';
    g.fillStyle = col; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(x - w * 0.2, y); g.quadraticCurveTo(x, y - 14, x + w * 0.2, y); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = col; g.lineWidth = 9;
    const beamY = y - 120;
    g.beginPath(); g.moveTo(x, y - 8); g.lineTo(x, beamY); g.stroke();
    const dx = Math.cos(ang) * w * 0.5, dy = Math.sin(ang) * w * 0.5;
    const L = [x - dx, beamY - dy], R = [x + dx, beamY + dy];
    g.lineWidth = 8; g.beginPath(); g.moveTo(L[0], L[1]); g.lineTo(R[0], R[1]); g.stroke();
    g.fillStyle = Art.C.pink; g.beginPath(); g.arc(x, beamY, 10, 0, TAU); g.fill();
    const pan = (P, draw) => {
      const py = P[1] + 74, pw = w * 0.2;
      g.strokeStyle = 'rgba(228,222,244,.7)'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(P[0], P[1]); g.lineTo(P[0] - pw, py); g.moveTo(P[0], P[1]); g.lineTo(P[0] + pw, py); g.stroke();
      g.fillStyle = col; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(P[0] - pw - 6, py); g.quadraticCurveTo(P[0], py + 18, P[0] + pw + 6, py); g.closePath(); g.fill(); g.stroke();
      if (draw) draw(g, P[0], py);
    };
    pan(L, o.drawLeft); pan(R, o.drawRight);
    g.restore();
  };
  /** Digital scale with a readout. (x, y) is the base center; items sit on y - 34. */
  Art.digitalScale = function (g, x, y, w, readout, o = {}) {
    g.save();
    g.fillStyle = '#D8D2EA'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
    Art.round(g, x - w / 2, y - 30, w, 30, 8); g.fill(); g.stroke();
    g.fillStyle = '#F4F0FF'; Art.round(g, x - w * 0.42, y - 38, w * 0.84, 9, 4); g.fill(); g.stroke();
    g.fillStyle = '#0F2A1E';
    Art.round(g, x - w * 0.3, y - 25, w * 0.6, 21, 4); g.fill();
    Art.text(g, readout, x, y - 13.5, { size: o.size || 19, color: '#6CFFAF' });
    g.restore();
    return { top: y - 38 };
  };
  /** Cylinder with a movable piston. Returns the gas box. pos 0 (down) to 1 (up). */
  Art.piston = function (g, cx, baseY, w, h, pos, o = {}) {
    const x0 = cx - w / 2, x1 = cx + w / 2, top = baseY - h;
    const py = baseY - 20 - (h - 50) * clamp(pos);
    g.fillStyle = 'rgba(214,240,255,.06)'; g.fillRect(x0, top, w, h);
    if (o.inside) { g.save(); g.beginPath(); g.rect(x0, py, w, baseY - py); g.clip(); o.inside(g, { x0, x1, top: py, bottom: baseY }); g.restore(); }
    const head = g.createLinearGradient(0, py - 22, 0, py);
    head.addColorStop(0, '#B8B2CF'); head.addColorStop(1, '#6F6A8B');
    g.fillStyle = head; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
    Art.round(g, x0 + 2, py - 22, w - 4, 22, 4); g.fill(); g.stroke();
    g.fillStyle = '#9A94B3'; g.fillRect(cx - 9, top - 40, 18, py - 22 - (top - 40)); g.strokeRect(cx - 9, top - 40, 18, py - 22 - (top - 40));
    g.fillStyle = '#D8D2EA'; Art.round(g, cx - 38, top - 52, 76, 14, 5); g.fill(); g.stroke();
    const body = new Path2D();
    body.moveTo(x0, top); body.lineTo(x0, baseY); body.lineTo(x1, baseY); body.lineTo(x1, top);
    glassStroke(g, body, 4.4);
    return { x0, x1, top: py, bottom: baseY };
  };
  /** Light bulb used for conductivity. glow 0..1. (x, y) is the bulb center. */
  Art.bulb = function (g, x, y, r, glow = 0) {
    if (glow > 0) Art.glow(g, x, y, r * (2 + glow * 2.4), '#FFD23F', 0.25 + 0.6 * glow);
    g.fillStyle = Art.mix('#3B2F52', '#FFE97A', clamp(glow));
    g.strokeStyle = Art.C.glass; g.lineWidth = 3;
    g.beginPath(); g.arc(x, y, r, 0.66, Math.PI - 0.66, true); g.lineTo(x - r * 0.4, y + r * 1.1); g.lineTo(x + r * 0.4, y + r * 1.1); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = glow > 0.1 ? '#FFF7C9' : 'rgba(255,255,255,.5)'; g.lineWidth = 2.2;
    g.beginPath(); g.moveTo(x - r * 0.25, y + r * 0.6); g.lineTo(x - r * 0.25, y); g.quadraticCurveTo(x, y - r * 0.4, x + r * 0.25, y); g.lineTo(x + r * 0.25, y + r * 0.6); g.stroke();
    g.fillStyle = '#9A94B3'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2;
    Art.round(g, x - r * 0.44, y + r * 1.1, r * 0.88, r * 0.46, 3); g.fill(); g.stroke();
  };
  /**
   * The signature Mole Hole view: a magnifying circle showing the particle world inside something visible.
   * Art.zoom(g, fromX, fromY, cx, cy, r, drawInside(g, cx, cy, r), { p })
   */
  Art.zoom = function (g, fx, fy, cx, cy, r, inside, o = {}) {
    const p = clamp(o.p === undefined ? 1 : o.p);
    if (p <= 0) return;
    const R = r * Lab.ease.back(p);
    if (R < 8) return; // Too small to see yet, and the inner highlight arc needs a positive radius.
    const dx = cx - fx, dy = cy - fy, d = Math.hypot(dx, dy) || 1;
    const nx = -dy / d, ny = dx / d;
    g.save();
    g.fillStyle = 'rgba(255,255,255,.1)';
    g.beginPath(); g.moveTo(fx, fy); g.lineTo(cx + nx * R, cy + ny * R); g.lineTo(cx - nx * R, cy - ny * R); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; g.setLineDash([6, 6]);
    g.beginPath(); g.moveTo(fx, fy); g.lineTo(cx + nx * R, cy + ny * R); g.moveTo(fx, fy); g.lineTo(cx - nx * R, cy - ny * R); g.stroke();
    g.setLineDash([]);
    g.save();
    g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.clip();
    const bg = g.createRadialGradient(cx, cy - R * 0.2, R * 0.1, cx, cy, R);
    bg.addColorStop(0, o.bg1 || '#2E1D55'); bg.addColorStop(1, o.bg2 || '#150A28');
    g.fillStyle = bg; g.fillRect(cx - R, cy - R, R * 2, R * 2);
    if (inside) inside(g, cx, cy, R);
    g.restore();
    g.strokeStyle = o.rim || Art.C.cyan; g.lineWidth = 6;
    g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2.5;
    g.beginPath(); g.arc(cx, cy, R - 7, -2.7, -1.9); g.stroke();
    g.restore();
  };
  /** Bubbles rising from y1 to y0 between x0 and x1. Deterministic in t. */
  Art.bubbles = function (g, x0, x1, y1, y0, t, o = {}) {
    const n = o.n || 12;
    g.save();
    for (let i = 0; i < n; i++) {
      const sp = 0.28 + Lab.rand(i + 2) * 0.5;
      const ph = (t * sp + Lab.rand(i + 4)) % 1;
      const x = x0 + (x1 - x0) * Lab.rand(i + 8) + Math.sin(t * 3 + i) * 3;
      const y = y1 + (y0 - y1) * ph;
      const r = (o.r || 5) * (0.5 + Lab.rand(i + 6)) * (0.6 + ph * 0.6);
      g.strokeStyle = o.color || 'rgba(255,255,255,.75)'; g.lineWidth = 1.8;
      g.fillStyle = 'rgba(255,255,255,.14)';
      g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.stroke();
    }
    g.restore();
  };
  /** Wispy rising steam or smoke. */
  Art.smoke = function (g, x, y, t, o = {}) {
    const n = o.n || 9, H = o.h || 90, c = o.color || '#D8D2EA';
    for (let i = 0; i < n; i++) {
      const ph = (t * (o.speed || 0.35) + i / n) % 1;
      const px = x + Math.sin(ph * 6 + i * 1.4 + t) * (6 + ph * (o.spread || 18));
      const py = y - ph * H;
      const r = (o.r || 9) * (0.5 + ph * 1.4);
      g.fillStyle = Art.alpha(c, (o.alpha || 0.28) * Math.sin(ph * Math.PI));
      g.beginPath(); g.arc(px, py, r, 0, TAU); g.fill();
    }
  };
  /** Horizontal bar meter with a label. */
  Art.meter = function (g, x, y, w, h, frac, o = {}) {
    g.fillStyle = 'rgba(255,255,255,.12)'; Art.round(g, x, y, w, h, h / 2); g.fill();
    if (frac > 0) { g.fillStyle = o.color || Art.C.cyan; Art.round(g, x, y, Math.max(h, w * clamp(frac)), h, h / 2); g.fill(); }
    g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 2; Art.round(g, x, y, w, h, h / 2); g.stroke();
  };
  /** Moe on canvas. mood: happy, wave, cheer, point, think, wow, oops. (x, y) is between the feet. */
  Art.moe = function (g, x, y, height, mood = 'happy', o = {}) { if (window.Moe) window.Moe.draw(g, x, y, height, mood, o); };
  /** Fade/scale helper for popping things in: Art.popIn(g, x, y, p, () => draw at origin). */
  Art.popIn = function (g, x, y, p, draw) {
    const q = clamp(p);
    if (q <= 0) return;
    const s = Lab.ease.back(q);
    g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha *= q; draw(g); g.restore();
  };
})();
