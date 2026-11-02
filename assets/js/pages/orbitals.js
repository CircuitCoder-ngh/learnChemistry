/* Lesson 7.3: Orbitals and quantum numbers. The star is the 3D viewer of real hydrogen wavefunctions. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const TAU = Math.PI * 2;
  const A0 = 52.9; // Bohr radius in pm.
  const LETTER = ['s', 'p', 'd', 'f', 'g', 'h'];
  const signed = (m) => (m > 0 ? '+' + m : m < 0 ? '−' + -m : '0');

  /* ---------- Real hydrogen wavefunctions, in atomic units ---------- */
  function laguerre(k, a, x) {
    if (k === 0) return 1;
    let L0 = 1, L1 = 1 + a - x;
    for (let i = 1; i < k; i++) { const L2 = ((2 * i + 1 + a - x) * L1 - (i + a) * L0) / (i + 1); L0 = L1; L1 = L2; }
    return L1;
  }
  /** Radial function, correct in shape (not normalized). */
  const Rnl = (n, l, r) => { const q = (2 * r) / n; return Math.pow(q, l) * Math.exp(-q / 2) * laguerre(n - l - 1, 2 * l + 1, q); };
  /** Real angular functions, keyed by the textbook name. */
  const ANGS = {
    s: () => 1,
    pz: (x, y, z, r) => z / r, px: (x, y, z, r) => x / r, py: (x, y, z, r) => y / r,
    dz2: (x, y, z, r) => (0.5 * (3 * z * z - r * r)) / (r * r),
    dxz: (x, y, z, r) => (1.732 * x * z) / (r * r), dyz: (x, y, z, r) => (1.732 * y * z) / (r * r),
    dxy: (x, y, z, r) => (1.732 * x * y) / (r * r), dx2y2: (x, y, z, r) => (0.866 * (x * x - y * y)) / (r * r),
    fz3: (x, y, z, r) => (0.5 * z * (5 * z * z - 3 * r * r)) / (r * r * r),
    fxz2: (x, y, z, r) => (0.612 * x * (5 * z * z - r * r)) / (r * r * r), fyz2: (x, y, z, r) => (0.612 * y * (5 * z * z - r * r)) / (r * r * r),
    fxyz: (x, y, z, r) => (1.936 * x * y * z) / (r * r * r), fzx2y2: (x, y, z, r) => (0.968 * z * (x * x - y * y)) / (r * r * r),
    fxx2y2: (x, y, z, r) => (0.791 * x * (x * x - 3 * y * y)) / (r * r * r), fyx2y2: (x, y, z, r) => (0.791 * y * (3 * x * x - y * y)) / (r * r * r),
  };
  function angKey(l, m) {
    if (l === 0) return 's';
    if (l === 1) return { '-1': 'py', 0: 'pz', 1: 'px' }[m];
    if (l === 2) return { '-2': 'dxy', '-1': 'dyz', 0: 'dz2', 1: 'dxz', 2: 'dx2y2' }[m];
    return { '-3': 'fyx2y2', '-2': 'fxyz', '-1': 'fyz2', 0: 'fz3', 1: 'fxz2', 2: 'fzx2y2', 3: 'fxx2y2' }[m];
  }
  const SUB = { s: '', pz: 'z', px: 'x', py: 'y', dz2: 'z²', dxz: 'xz', dyz: 'yz', dxy: 'xy', dx2y2: 'x²−y²', fz3: 'z³', fxz2: 'xz²', fyz2: 'yz²', fxyz: 'xyz', fzx2y2: 'z(x²−y²)', fxx2y2: 'x(x²−3y²)', fyx2y2: 'y(3x²−y²)' };
  const orbName = (n, l, m) => `${n}${LETTER[l]}${SUB[angKey(l, m)] || ''}`;
  const orbHTML = (n, l, m) => `${n}${LETTER[l]}${SUB[angKey(l, m)] ? `<sub>${SUB[angKey(l, m)]}</sub>` : ''}`;
  const PLANE = {
    s: 'xz', pz: 'xz', px: 'xz', py: 'yz', dz2: 'xz', dxz: 'xz', dyz: 'yz', dxy: 'xy', dx2y2: 'xy',
    fz3: 'xz', fxz2: 'xz', fyz2: 'yz', fxyz: 'diag', fzx2y2: 'xz', fxx2y2: 'xy', fyx2y2: 'xy',
  };
  const toXYZ = {
    xz: (u, v) => [u, 0, v], yz: (u, v) => [0, u, v], xy: (u, v) => [u, v, 0],
    diag: (u, v) => [u * 0.7071, u * 0.7071, v],
  };
  /** Radial distribution r²R². */
  const radialP = (n, l, r) => { const R = Rnl(n, l, r); return r * r * R * R; };
  const memoEnc = new Map();
  /** Radius, in a0, enclosing a fraction of the probability. */
  function rEnclose(n, l, frac) {
    const key = `${n}|${l}|${frac}`;
    if (memoEnc.has(key)) return memoEnc.get(key);
    const rTop = 80 + n * 12, N = 3000, dr = rTop / N;
    let total = 0;
    for (let i = 1; i <= N; i++) total += radialP(n, l, i * dr);
    let run = 0, ans = rTop;
    for (let i = 1; i <= N; i++) { run += radialP(n, l, i * dr); if (run / total >= frac) { ans = i * dr; break; } }
    memoEnc.set(key, ans);
    return ans;
  }
  /** Radii of the radial nodes, in a0, found by scanning for sign changes. */
  function radialNodes(n, l) {
    const out = [], rTop = 70 + n * 10, N = 4000;
    let prev = Rnl(n, l, 0.002);
    for (let i = 1; i <= N; i++) {
      const r = 0.002 + (i * rTop) / N, val = Rnl(n, l, r);
      if (prev * val < 0) out.push(r);
      prev = val;
    }
    return out;
  }
  function peakRadius(n, l) {
    let best = 0, at = 0;
    const rTop = 40 + n * 14;
    for (let r = 0.01; r < rTop; r += 0.01) { const v = radialP(n, l, r); if (v > best) { best = v; at = r; } }
    return at;
  }
  /** A cached cross-section image: cyan for plus phase, pink for minus phase, dark at nodes. */
  const memoSlice = new Map();
  function sliceImage(n, l, m, opts = {}) {
    const size = opts.size || 220;
    const span = opts.span || rEnclose(n, l, 0.97) * 1.06;
    const key = [n, l, m, size, span.toFixed(2)].join('|');
    if (memoSlice.has(key)) return memoSlice.get(key);
    const c = document.createElement('canvas'); c.width = c.height = size;
    const x = c.getContext('2d'), img = x.createImageData(size, size), d = img.data;
    const k = angKey(l, m), fn = ANGS[k], map = toXYZ[PLANE[k]];
    const vals = new Float32Array(size * size);
    let peak = 0;
    let peakP = { v: 0, u: 0, w: 0 }, peakM = { v: 0, u: 0, w: 0 };
    for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
      const u = ((i + 0.5) / size - 0.5) * 2 * span, v = (0.5 - (j + 0.5) / size) * 2 * span;
      const [px, py, pz] = map(u, v);
      const r = Math.hypot(px, py, pz) || 1e-6;
      const psi = Rnl(n, l, r) * fn(px, py, pz, r);
      vals[j * size + i] = psi;
      const dd = psi * psi;
      if (dd > peak) peak = dd;
      if (psi > 0 && dd > peakP.v) peakP = { v: dd, u: i / size, w: j / size };
      if (psi < 0 && dd > peakM.v) peakM = { v: dd, u: i / size, w: j / size };
    }
    for (let q = 0; q < vals.length; q++) {
      const psi = vals[q], v = Math.pow((psi * psi) / (peak || 1), 0.36);
      const o = q * 4;
      if (psi >= 0) { d[o] = 47 * v + 30 * v * v; d[o + 1] = 214 * v; d[o + 2] = 242 * v; } else { d[o] = 255 * v; d[o + 1] = 79 * v; d[o + 2] = 163 * v; }
      d[o + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    c._span = span; c._plus = peakP; c._minus = peakM;
    memoSlice.set(key, c);
    return c;
  }
  /** Draw a slice in a rounded box, with +/- labels on the biggest lobes. */
  function drawSlice(g, img, x, y, s, o = {}) {
    g.save();
    Art.round(g, x, y, s, s, 16); g.clip();
    g.imageSmoothingEnabled = true;
    g.fillStyle = '#000'; g.fillRect(x, y, s, s);
    g.drawImage(img, x, y, s, s);
    g.restore();
    g.strokeStyle = o.rim || 'rgba(255,255,255,.6)'; g.lineWidth = 3; Art.round(g, x, y, s, s, 16); g.stroke();
    if (o.signs) {
      if (img._plus.v > 0) Art.text(g, '+', x + img._plus.u * s, y + img._plus.w * s, { size: 30, font: 'display', color: '#fff', halo: true });
      if (img._minus.v > 0) Art.text(g, '−', x + img._minus.u * s, y + img._minus.w * s, { size: 30, font: 'display', color: '#fff', halo: true });
    }
    Art.ball(g, x + s / 2, y + s / 2, 4.5, C.sun);
  }
  /** Radial probability plot. */
  function plotRadial(g, x, y, w, hgt, n, l, rMaxA0, o = {}) {
    const q = o.q === undefined ? 1 : o.q;
    const N = Math.round(w);
    let peak = 0;
    const vals = [];
    for (let i = 0; i <= N; i++) { const v = radialP(n, l, (i / N) * rMaxA0 + 1e-4); vals.push(v); if (v > peak) peak = v; }
    const end = Math.round(N * q);
    const col = o.color || C.cyan;
    const gr = g.createLinearGradient(0, y - hgt, 0, y);
    gr.addColorStop(0, Art.alpha(col, 0.75)); gr.addColorStop(1, Art.alpha(col, 0.12));
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(x, y);
    for (let i = 0; i <= end; i++) g.lineTo(x + i, y - (vals[i] / peak) * hgt);
    g.lineTo(x + end, y); g.closePath(); g.fill();
    g.strokeStyle = col; g.lineWidth = 3.5; g.lineJoin = 'round';
    g.beginPath();
    for (let i = 0; i <= end; i++) { const X = x + i, Y = y - (vals[i] / peak) * hgt; if (i) g.lineTo(X, Y); else g.moveTo(X, Y); }
    g.stroke();
    g.strokeStyle = C.ink; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y - hgt - 8); g.lineTo(x, y); g.lineTo(x + w + 6, y); g.stroke();
    return (rA0) => x + (rA0 / rMaxA0) * w;
  }
  /** A 2D balloon drawing: a polar plot of the angular function. */
  function lobes2D(g, cx, cy, S, fn, o = {}) {
    const c1 = o.c1 || C.cyan, c2 = o.c2 || C.pink;
    [[1, c1], [-1, c2]].forEach(([sign, col]) => {
      g.beginPath();
      let any = false;
      for (let i = 0; i <= 240; i++) {
        const th = (i / 240) * TAU;
        const v = Math.max(0, sign * fn(th));
        if (v > 0.002) any = true;
        const x = cx + Math.cos(th) * v * S, y = cy - Math.sin(th) * v * S;
        if (i) g.lineTo(x, y); else g.moveTo(x, y);
      }
      if (!any) return;
      g.closePath();
      const gr = g.createRadialGradient(cx - S * 0.2, cy - S * 0.25, S * 0.05, cx, cy, S * 1.05);
      gr.addColorStop(0, Art.mix(col, '#ffffff', 0.55)); gr.addColorStop(0.65, col); gr.addColorStop(1, Art.mix(col, '#12062A', 0.42));
      g.fillStyle = gr; g.fill();
      g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5; g.stroke();
    });
    Art.ball(g, cx, cy, 5, C.sun);
  }

  /** Text with real subscripts: writes m_ℓ, m_s, p_x and so on properly on the canvas. */
  function rich(g, str, x, y, o = {}) {
    const size = o.size || 26;
    const fam = o.font === 'display' ? Art.FONT_DISPLAY : Art.FONT_BODY, wt = o.font === 'display' ? 400 : (o.weight || 700);
    const parts = String(str).split(/([mp]_[ℓsxyz])/).filter(Boolean).map((tk) => (/^[mp]_/.test(tk) ? { main: tk[0], sub: tk.slice(2) } : { main: tk }));
    const fMain = `${wt} ${size}px ${fam}`, fSub = `${wt} ${Math.max(16, size * 0.66)}px ${fam}`;
    let w = 0;
    parts.forEach((pt) => { g.font = fMain; pt.w = g.measureText(pt.main).width; w += pt.w; if (pt.sub) { g.font = fSub; pt.sw = g.measureText(pt.sub).width + 1; w += pt.sw; } });
    const al = o.align || 'center';
    let cx = al === 'center' ? x - w / 2 : al === 'right' ? x - w : x;
    const prev = g.globalAlpha;
    g.globalAlpha = prev * (o.alpha === undefined ? 1 : o.alpha);
    g.textAlign = 'left'; g.textBaseline = 'middle';
    const paint = (txt, px, py) => {
      if (o.halo) { g.lineJoin = 'round'; g.lineWidth = Math.max(3, size * 0.2); g.strokeStyle = 'rgba(23,12,41,.9)'; g.strokeText(txt, px, py); }
      g.fillStyle = o.color || C.ink; g.fillText(txt, px, py);
    };
    parts.forEach((pt) => {
      g.font = fMain; paint(pt.main, cx, y); cx += pt.w;
      if (pt.sub) { g.font = fSub; paint(pt.sub, cx, y + size * 0.24); cx += pt.sw; }
    });
    g.globalAlpha = prev;
  }

  /* A set of real 1s sightings, used by the first story. r follows r² e^(-2r) in atomic units. */
  const CLOUD = [];
  for (let i = 0; i < 2600; i++) {
    const r = -0.5 * Math.log((rand(i * 1.31 + 1) + 1e-5) * (rand(i * 2.17 + 3) + 1e-5) * (rand(i * 3.71 + 5) + 1e-5));
    const u = rand(i * 4.13 + 7) * 2 - 1, ph = rand(i * 5.19 + 9) * TAU, sq = Math.sqrt(1 - u * u);
    CLOUD.push({ r, x: r * sq * Math.cos(ph), y: r * u });
  }
  function drawCloud(g, cx, cy, a0px, count, alpha = 0.6, dot = 3.4) {
    g.fillStyle = `rgba(53,230,255,${alpha})`;
    for (let i = 0; i < count; i++) g.fillRect(cx + CLOUD[i].x * a0px - dot / 2, cy + CLOUD[i].y * a0px - dot / 2, dot, dot);
  }

  /* ---------- Story 1: from orbit to cloud ---------- */
  const r90_1s = rEnclose(1, 0, 0.9);
  Lab.story('#story-cloud', {
    title: 'Where is the electron?',
    scenes: [
      {
        say: 'Think of throwing darts. You <b>cannot predict</b> where any one dart lands. But throw hundreds, and a clear pattern appears, thick near the center and thin farther out.',
        dur: 4,
        draw(g, p, t) {
          const cx = 250, cy = 225, Rr = 190;
          const rings = ['#23405F', '#E8D9B8', '#23405F', '#E8D9B8', '#23405F', '#C7384D'];
          rings.forEach((col, i) => {
            g.fillStyle = col; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2;
            g.beginPath(); g.arc(cx, cy, Rr * (1 - i / 6.3), 0, TAU); g.fill(); g.stroke();
          });
          const N = 170, shown = Math.floor(N * ease.in(seg(p, 0.08, 0.92)) + (p > 0.03 ? 1 : 0));
          for (let i = 0; i < shown; i++) {
            const a = rand(i * 1.7 + 1) * TAU;
            const u1 = rand(i * 2.3 + 2), u2 = rand(i * 3.1 + 4);
            const d = Math.sqrt(-2 * Math.log(u1 + 1e-4)) * Math.abs(Math.cos(TAU * u2)) * 58;
            const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
            g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(x + 1.5, y + 2, 5, 0, TAU); g.fill();
            Art.ball(g, x, y, 5, C.sun);
          }
          Art.text(g, 'One dart: anyone\'s guess', 620, 120, { size: 28, font: 'display', alpha: seg(p, 0.05, 0.25) });
          Art.text(g, 'Many darts: a pattern', 620, 170, { size: 28, font: 'display', color: C.sun, alpha: seg(p, 0.6, 0.85) });
          Art.moe(g, 640, 440, 190, 'point', { t, flip: true });
        },
      },
      {
        say: 'Electrons are like that. Suppose you could spot a hydrogen electron over and over. Each dot is one sighting. No single dot is predictable, but together they build a <b>cloud</b>.',
        dur: 5.2,
        draw(g, p, t) {
          const cx = 280, cy = 225, a0 = 80;
          const count = Math.floor(lerp(0, CLOUD.length, ease.in(seg(p, 0.05, 0.96))));
          drawCloud(g, cx, cy, a0, count);
          Art.glow(g, cx, cy, 30, C.proton, 0.5);
          Art.proton(g, cx, cy, 13);
          if (count < 60) {
            const i = Math.max(0, count - 1);
            Art.electron(g, cx + CLOUD[i].x * a0, cy + CLOUD[i].y * a0, 10);
          }
          Art.text(g, count.toLocaleString('en-US'), 646, 164, { font: 'display', size: 60, color: C.sun });
          Art.text(g, 'sightings', 646, 214, { size: 28 });
          Art.text(g, 'Each dot is one place', 646, 290, { size: 24, color: C.cyan, alpha: seg(p, 0.1, 0.3) });
          Art.text(g, 'the electron was found', 646, 322, { size: 24, color: C.cyan, alpha: seg(p, 0.1, 0.3) });
          Art.text(g, 'This is a real 1s orbital', 646, 396, { size: 24, color: C.dim, alpha: seg(p, 0.7, 0.9) });
          void t;
        },
      },
      {
        say: 'How far out is it? Add up the dots at each distance. The most likely distance is <b>53 pm</b>, the same size as Bohr\'s first orbit. Bohr was close, but the electron has no sharp track.',
        dur: 4.4,
        draw(g, p) {
          const cx = 180, cy = 225, a0 = 56;
          const q = ease.inOut(seg(p, 0.1, 0.7));
          drawCloud(g, cx, cy, a0, 1700, 0.5, 2.8);
          Art.proton(g, cx, cy, 10);
          const peak = 1; // In a0, the 1s peak sits at exactly 1 Bohr radius.
          g.save(); g.globalAlpha *= seg(p, 0.6, 0.8);
          Art.ring(g, cx, cy, peak * a0, { color: C.sun, w: 4 });
          g.restore();
          const ox = 410, oy = 372, gw = 350, gh = 250;
          const X = plotRadial(g, ox, oy, gw, gh, 1, 0, 5, { q });
          [100, 200].forEach((pm) => {
            const x = X(pm / A0);
            g.fillStyle = C.ink; g.fillRect(x - 1, oy, 2.4, 9);
            Art.text(g, `${pm} pm`, x, oy + 28, { size: 22, color: C.dim });
          });
          const a = seg(p, 0.6, 0.8);
          g.save(); g.globalAlpha *= a; g.strokeStyle = C.sun; g.lineWidth = 3; g.setLineDash([6, 7]);
          g.beginPath(); g.moveTo(X(1), oy); g.lineTo(X(1), oy - gh); g.stroke(); g.restore();
          Art.text(g, '53 pm', X(1) + 56, oy - gh + 22, { size: 36, font: 'display', color: C.sun, align: 'left', alpha: a, halo: true });
          Art.text(g, 'most likely distance', X(1) + 56, oy - gh + 60, { size: 24, align: 'left', alpha: a, halo: true });
          Art.text(g, 'Distance from the nucleus', ox + gw / 2, oy + 60, { size: 24 });
          Art.text(g, 'Chance of being this far out', ox + 150, 44, { size: 24, color: C.cyan });
        },
      },
      {
        say: 'The cloud fades forever and has no edge. So we draw a boundary around <b>90 percent</b> of the dots. That region is what we call an <b>orbital</b>. It is the balloon in textbooks.',
        dur: 4.2,
        draw(g, p, t) {
          const cx = 280, cy = 225, a0 = 74;
          const rr = r90_1s * a0;
          drawCloud(g, cx, cy, a0, 2300, 0.55, 3.2);
          const q = ease.inOut(seg(p, 0.15, 0.6));
          Art.glow(g, cx, cy, 30, C.proton, 0.5);
          Art.proton(g, cx, cy, 11);
          if (q > 0) {
            g.save(); g.globalAlpha *= 0.26 * seg(p, 0.5, 0.8);
            const f = g.createRadialGradient(cx - rr * 0.3, cy - rr * 0.35, rr * 0.1, cx, cy, rr);
            f.addColorStop(0, '#FFFFFF'); f.addColorStop(1, C.cyan);
            g.fillStyle = f; g.beginPath(); g.arc(cx, cy, rr, 0, TAU); g.fill();
            g.restore();
            Art.ring(g, cx, cy, rr, { color: C.sun, w: 5, p: q });
          }
          const pct = Math.round(90 * ease.out(seg(p, 0.2, 0.72)));
          Art.text(g, pct + '%', 650, 170, { font: 'display', size: 76, color: C.sun });
          Art.text(g, 'of the dots are inside', 650, 232, { size: 26 });
          Art.text(g, 'Orbital', 650, 318, { size: 44, font: 'display', color: C.cyan, alpha: seg(p, 0.65, 0.85) });
          void t;
        },
      },
      {
        say: 'Do not mix up the two words. An <b>orbit</b> is a sharp path, and it is an old idea. An <b>orbital</b> is a cloud of probability. Modern chemistry uses orbitals.',
        dur: 3.4,
        draw(g, p, t) {
          const lx = 210, rx = 590, cy = 200;
          g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 4; g.beginPath(); g.arc(lx, cy, 118, 0, TAU); g.stroke();
          Art.proton(g, lx, cy, 14);
          const ang = t * 1.5;
          Art.atom(g, lx + Math.cos(ang) * 118, cy + Math.sin(ang) * 118, 18, 'e', { label: false, face: 'happy', t, color: C.electron });
          const a = seg(p, 0.35, 0.6);
          Art.strike(g, lx - 110, cy - 110, lx + 110, cy + 110, a, C.red, 9);
          Art.strike(g, lx + 110, cy - 110, lx - 110, cy + 110, a, C.red, 9);
          Art.text(g, 'Orbit', lx, 372, { size: 40, font: 'display', color: C.red });
          Art.text(g, 'A sharp path: outdated', lx, 416, { size: 25, alpha: seg(p, 0.1, 0.3) });
          drawCloud(g, rx, cy, 56, 1900, 0.55, 2.8);
          Art.proton(g, rx, cy, 10);
          Art.text(g, 'Orbital', rx, 372, { size: 40, font: 'display', color: C.leaf, alpha: seg(p, 0.55, 0.75) });
          Art.text(g, 'A cloud of probability', rx, 416, { size: 25, alpha: seg(p, 0.65, 0.85) });
        },
      },
    ],
  });

  /* ---------- Bench: the 3D orbital viewer ---------- */
  const O = { n: 3, l: 2, m: 0, mode: 'cloud', nodes: false, all: false, t0: 0 };
  const rMaxOf = (n) => (n === 1 ? 6 : n === 2 ? 14 : n === 3 ? 26 : 42);
  const scaleOf = (n) => 2.3 / (rMaxOf(n) * 0.72);
  const BALLOON_K = [0, 0.66, 0.78, 0.9, 1];
  const v = Chem3D.viewer('#orb-host', { height: 500, distance: 9.6, label: 'A real hydrogen orbital in 3D. Drag to turn it.', spin: -0.5, tilt: 0.28 });
  const overlay = document.createElement('div');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.cssText = 'position:absolute;left:16px;top:10px;font-family:var(--font-display);font-size:2.1rem;line-height:1.1;color:#FFD23F;pointer-events:none;text-shadow:0 2px 0 #1A0F2E';
  Lab.$('#orb-host').appendChild(overlay);
  const hint3D = document.createElement('div');
  hint3D.setAttribute('aria-hidden', 'true');
  hint3D.style.cssText = 'position:absolute;left:16px;bottom:10px;font-weight:700;color:#BFB2DA;pointer-events:none;font-size:.95rem';
  Lab.$('#orb-host').appendChild(hint3D);

  function makeDot() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    return new v.THREE.CanvasTexture(c);
  }
  const PALETTE = ['#2FD6F2', '#FF4FA3', '#FFD23F', '#3DDC84', '#B28DFF', '#FF8A2B', '#5B8CFF'];
  function sampleCloud(T, n, list, count, byOrbital) {
    const rMax = rMaxOf(n), scale = scaleOf(n);
    const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
    const cP = new T.Color('#2FD6F2'), cM = new T.Color('#FF4FA3');
    let made = 0;
    const each = Math.ceil(count / list.length);
    list.forEach(([l, m], which) => {
      const fn = ANGS[angKey(l, m)];
      let peak = 0;
      for (let i = 0; i < 6000; i++) {
        const r = Math.random() * rMax, u = Math.random() * 2 - 1, ph = Math.random() * TAU, sq = Math.sqrt(1 - u * u);
        const x = r * sq * Math.cos(ph), y = r * sq * Math.sin(ph), z = r * u;
        const R = Rnl(n, l, r), a = fn(x, y, z, r || 1e-6), w = R * R * a * a * r * r;
        if (w > peak) peak = w;
      }
      let got = 0, guard = 0;
      const hue = new T.Color(PALETTE[which % PALETTE.length]);
      while (got < each && made < count && guard < each * 600) {
        guard++;
        const r = Math.random() * rMax, u = Math.random() * 2 - 1, ph = Math.random() * TAU, sq = Math.sqrt(1 - u * u);
        const x = r * sq * Math.cos(ph), y = r * sq * Math.sin(ph), z = r * u;
        const R = Rnl(n, l, r), a = fn(x, y, z, r || 1e-6), w = R * R * a * a * r * r;
        if (Math.random() * peak * 1.05 > w) continue;
        // Shuffle-in so the reveal fills evenly across orbitals.
        pos[made * 3] = x * scale; pos[made * 3 + 1] = z * scale; pos[made * 3 + 2] = y * scale;
        const cc = byOrbital ? hue : (R * a >= 0 ? cP : cM);
        col[made * 3] = cc.r; col[made * 3 + 1] = cc.g; col[made * 3 + 2] = cc.b;
        made++; got++;
      }
    });
    // Random order, so that the reveal draws in like sightings.
    for (let i = made - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      for (let k = 0; k < 3; k++) {
        let tmp = pos[i * 3 + k]; pos[i * 3 + k] = pos[j * 3 + k]; pos[j * 3 + k] = tmp;
        tmp = col[i * 3 + k]; col[i * 3 + k] = col[j * 3 + k]; col[j * 3 + k] = tmp;
      }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(pos.subarray(0, made * 3), 3));
    geo.setAttribute('color', new T.BufferAttribute(col.subarray(0, made * 3), 3));
    const mat = new T.PointsMaterial({ size: 0.07, map: makeDot(), vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true });
    return new T.Points(geo, mat);
  }
  function balloonMesh(T, l, m, colorP, colorM) {
    const fn = ANGS[angKey(l, m)], segs = 96, out = [];
    const build = (sign, color) => {
      const pts = [], idx = [];
      for (let i = 0; i <= segs; i++) {
        const th = (i / segs) * Math.PI;
        for (let j = 0; j <= segs; j++) {
          const ph = (j / segs) * TAU;
          const x = Math.sin(th) * Math.cos(ph), y = Math.sin(th) * Math.sin(ph), z = Math.cos(th);
          const a = fn(x, y, z, 1), rr = sign * a > 0 ? Math.abs(a) : 0, R = l === 0 ? 1.5 : 2.05 * rr;
          pts.push(x * R, z * R, y * R);
        }
      }
      for (let i = 0; i < segs; i++) for (let j = 0; j < segs; j++) { const a = i * (segs + 1) + j, b = a + segs + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(pts, 3));
      geo.setIndex(idx); geo.computeVertexNormals();
      const mesh = new T.Mesh(geo, v.atomMaterial(color, { opacity: 0.86, roughness: 0.25 }));
      mesh.material.side = T.DoubleSide; mesh.material.depthWrite = true;
      return mesh;
    };
    out.push(build(1, colorP));
    if (l > 0) out.push(build(-1, colorM));
    return out;
  }
  function addAxes(T, g) {
    const line = (a, b) => g.add(new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(...a), new T.Vector3(...b)]), new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.26 })));
    line([-2.5, 0, 0], [2.5, 0, 0]); line([0, -2.5, 0], [0, 2.5, 0]); line([0, 0, -2.5], [0, 0, 2.5]);
    g.add(new T.Mesh(new T.SphereGeometry(0.06, 16, 12), v.atomMaterial('#FFD23F')));
  }
  const AXIS_LABELS = [{ p: [2.66, 0, 0], text: 'x', cls: 'is-axis' }, { p: [0, 2.66, 0], text: 'z', cls: 'is-axis' }, { p: [0, 0, 2.66], text: 'y', cls: 'is-axis' }];
  /** Golden surfaces for the nodes, in the same coordinates as the cloud. */
  function addNodeSurfaces() {
    const T = v.THREE, g = new T.Group();
    const key = angKey(O.l, O.m);
    const mat = () => new T.MeshBasicMaterial({ color: 0xFFD23F, transparent: true, opacity: 0.14, side: T.DoubleSide, depthWrite: false });
    if (O.mode === 'cloud') radialNodes(O.n, O.l).forEach((r) => {
      g.add(new T.Mesh(new T.SphereGeometry(r * scaleOf(O.n), 48, 32), mat()));
    });
    const plane = (rot) => {
      const grp = new T.Group();
      grp.add(new T.Mesh(new T.CircleGeometry(2.55, 64), mat()));
      const pts = [];
      for (let i = 0; i < 80; i++) { const a = (i / 80) * TAU; pts.push(new T.Vector3(Math.cos(a) * 2.55, Math.sin(a) * 2.55, 0)); }
      grp.add(new T.LineLoop(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0xFFD23F })));
      grp.rotation.set(rot[0], rot[1], rot[2]);
      g.add(grp);
    };
    const FLAT = [Math.PI / 2, 0, 0]; // Horizontal: the xy plane, since z is up on screen.
    const XZ = [0, 0, 0]; // The xz plane faces the y axis.
    const YZ = [0, Math.PI / 2, 0];
    const addCone = (angle) => {
      [1, -1].forEach((s) => {
        const hgt = 2.2, rad = hgt * Math.tan(angle);
        const c = new T.Mesh(new T.ConeGeometry(rad, hgt, 64, 1, true), mat());
        c.position.y = (s * hgt) / 2;
        if (s > 0) c.rotation.x = Math.PI;
        g.add(c);
      });
    };
    const maps = {
      pz: () => plane(FLAT), px: () => plane(YZ), py: () => plane(XZ),
      dxy: () => { plane(YZ); plane(XZ); }, dxz: () => { plane(FLAT); plane(YZ); }, dyz: () => { plane(FLAT); plane(XZ); },
      dx2y2: () => { plane([0, Math.PI / 4, 0]); plane([0, -Math.PI / 4, 0]); },
      dz2: () => addCone(Math.acos(1 / Math.sqrt(3))),
    };
    if (maps[key]) maps[key]();
    v.add(g);
  }
  function render3D() {
    if (!v.ok) return;
    const { n, l, m, mode, all } = O;
    const T = v.THREE;
    let host;
    let revealPts = null, balloons = [];
    if (!all && l <= 2) {
      v.orbital(n, l, m, mode);
      host = v.root.children[v.root.children.length - 1];
      if (mode === 'cloud') revealPts = host.children[0];
      else balloons = host.children.filter((c) => c.isMesh && c.geometry.attributes.position.count > 2000);
    } else {
      v.clear();
      const g = new T.Group();
      const list = all ? Array.from({ length: 2 * l + 1 }, (_, i) => [l, i - l]) : [[l, m]];
      if (mode === 'cloud') { revealPts = sampleCloud(T, n, list, all ? 32000 : 26000, all && l > 0); g.add(revealPts); }
      else list.forEach(([ll, mm], i) => {
        const c1 = all && l > 0 ? PALETTE[i % PALETTE.length] : '#2FD6F2';
        const c2 = all && l > 0 ? PALETTE[i % PALETTE.length] : '#FF4FA3';
        balloonMesh(T, ll, mm, c1, c2).forEach((mesh) => { balloons.push(mesh); g.add(mesh); });
      });
      addAxes(T, g);
      v.add(g);
      v.labels(AXIS_LABELS);
    }
    const k = BALLOON_K[n];
    if (revealPts) {
      const N = revealPts.geometry.attributes.position.count;
      let u = Lab.reducedMotion ? 1 : 0;
      revealPts.geometry.setDrawRange(0, Math.floor(N * u));
      v.animate((dt) => { if (u < 1) { u = Math.min(1, u + dt * 1.1); revealPts.geometry.setDrawRange(0, Math.floor(N * ease.out(u))); } });
    } else {
      let u = Lab.reducedMotion ? 1 : 0;
      balloons.forEach((b) => b.scale.setScalar(k * (u ? 1 : 0.2)));
      v.animate((dt) => { if (u < 1) { u = Math.min(1, u + dt * 2.2); balloons.forEach((b) => b.scale.setScalar(k * ease.back(u))); } });
    }
    if (O.nodes && !all) addNodeSurfaces();
    overlay.innerHTML = all ? `All of ${n}${LETTER[l]}` : orbHTML(n, l, m);
    hint3D.textContent = mode === 'balloon' ? 'Balloons are not to scale. The graph below is.' : 'Each dot is one possible sighting.';
    O.t0 = orbStage ? orbStage.t : 0;
    paintOrb();
  }
  function paintOrb() {
    const { n, l, m, all, mode } = O;
    const rn = n - l - 1, an = l;
    const name = `${n}${LETTER[l]}`;
    Lab.$('#orb-name').innerHTML = all ? name : orbHTML(n, l, m);
    Lab.$('#orb-rn').textContent = rn;
    Lab.$('#orb-an').textContent = an;
    Lab.$('#orb-count').textContent = `${2 * l + 1} orbital${l ? 's' : ''}, ${2 * (2 * l + 1)} electrons`;
    const pk = Math.round(peakRadius(n, l) * A0);
    let msg;
    if (all) msg = l === 0 ? `There is just one orbital in ${name}, so this is the whole subshell.` : `All ${2 * l + 1} ${name} orbitals at once. ${mode === 'cloud' ? 'Their clouds add up to a perfect sphere, which is why a full subshell is round.' : 'One color for each orbital.'}`;
    else msg = `This orbital has $n = ${n}$, $\\ell = ${l}$ and $m_\\ell = ${signed(m).replace('−', '-')}$. Its total of ${n - 1} node${n === 2 ? '' : 's'} is ${rn} radial and ${an} angular. The electron is most likely found about <b>${pk} pm</b> from the nucleus.`;
    if (!all && mode === 'balloon' && rn > 0) msg += ' Balloons hide radial nodes, so switch to Cloud to see them.';
    if (!all && l > 0) msg += ' <span style="opacity:.8">Strictly, real shapes like these are mixtures of the $m_\\ell$ states. Matching one shape to each $m_\\ell$ is a common simplification.</span>';
    Lab.$('#orb-foot').innerHTML = Lab.texString(`<p>${msg}</p>`);
  }
  // 2D companion: a slice through the orbital, and the true-size radial graph.
  const orbStage = Lab.stage('#c-orb2', {
    h: 300,
    label: 'Left: a cross-section of the orbital, with nodes dark and phase in color. Right: the chance of finding the electron at each distance from the nucleus.',
    draw(g, t) {
      const { n, l, m, all } = O;
      const mm = all ? 0 : m;
      const img = sliceImage(n, l, mm, { size: 240 });
      const s = 276;
      drawSlice(g, img, 12, 12, s, { signs: true });
      const widthPm = Math.round(img._span * 2 * A0);
      Art.text(g, `${widthPm.toLocaleString('en-US')} pm wide`, 12 + s / 2, 12 + s - 18, { size: 21, color: '#fff', halo: true });
      const q = ease.out(clamp((t - O.t0) * 1.6));
      const ox = 332, oy = 232, gw = 440, gh = 176, rMaxA0 = 1400 / A0;
      const X = plotRadial(g, ox, oy, gw, gh, n, l, rMaxA0, { q: Lab.reducedMotion ? 1 : q });
      [0, 500, 1000].forEach((pm) => {
        const x = X(pm / A0);
        g.fillStyle = C.ink; g.fillRect(x - 1, oy, 2.4, 8);
        Art.text(g, pm === 0 ? '0' : `${pm} pm`, x, oy + 24, { size: 21, color: C.dim });
      });
      Art.text(g, 'Distance from the nucleus', ox + gw / 2 + 30, oy + 52, { size: 22 });
      Art.text(g, 'Chance of being this far out', ox + 12, 22, { size: 22, color: C.cyan, align: 'left' });
      radialNodes(n, l).forEach((r) => {
        const x = X(r);
        if (x > ox + gw) return;
        g.strokeStyle = C.red; g.lineWidth = 3; g.beginPath(); g.arc(x, oy, 7, 0, TAU); g.stroke();
      });
      if (radialNodes(n, l).length) Art.text(g, 'red rings mark nodes', ox + gw, 56, { size: 21, color: C.red, align: 'right' });
    },
  });

  const lBtns = Lab.$$('#orb-l button');
  function paintLButtons() {
    lBtns.forEach((b) => {
      const ok = +b.dataset.value < O.n;
      b.disabled = !ok; b.style.opacity = ok ? 1 : 0.32;
      b.title = ok ? '' : `Not allowed: when n = ${O.n}, l stops at ${O.n - 1}`;
    });
    lSeg.set(String(O.l), false);
  }
  function buildMButtons() {
    const host = Lab.$('#orb-m');
    const opts = [];
    for (let m = -O.l; m <= O.l; m++) opts.push(m);
    host.innerHTML = opts.map((m) => {
      const sub = SUB[angKey(O.l, m)];
      const lab = O.l === 0 ? '0' : O.l <= 2 ? `${signed(m)} (${sub})` : signed(m);
      return `<button type="button" data-value="${m}" aria-pressed="${m === O.m}">${lab}</button>`;
    }).join('');
    Lab.$$('button', host).forEach((b) => b.addEventListener('click', () => {
      O.m = +b.dataset.value;
      Lab.$$('button', host).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      render3D();
    }));
  }
  const lSeg = Lab.segmented('#orb-l', (val) => {
    O.l = +val; O.m = 0; buildMButtons(); render3D();
  });
  Lab.segmented('#orb-n', (val) => {
    O.n = +val;
    if (O.l >= O.n) { O.l = O.n - 1; O.m = 0; buildMButtons(); }
    paintLButtons(); render3D();
  });
  Lab.segmented('#orb-mode', (val) => { O.mode = val; render3D(); });
  const chip = (sel, key) => {
    const b = Lab.$(sel);
    b.addEventListener('click', () => {
      O[key] = !O[key];
      b.classList.toggle('is-on', O[key]); b.setAttribute('aria-pressed', String(O[key]));
      render3D();
    });
  };
  chip('#orb-nodes', 'nodes'); chip('#orb-all', 'all');
  buildMButtons(); paintLButtons(); render3D();

  /* ---------- Story 2: four numbers ---------- */
  const fnS = () => 1, fnP = (th) => Math.cos(th), fnD = (th) => Math.sin(2 * th), fnF = (th) => Math.cos(3 * th);
  Lab.story('#story-numbers', {
    title: 'The electron address system',
    scenes: [
      {
        say: 'Every electron has an address of four numbers. Picture a city: <b>$n$</b> is the building, <b>$\\ell$</b> the floor, <b>$m_\\ell$</b> the room, and <b>$m_s$</b> the seat. No two electrons in an atom share all four.',
        dur: 4.6,
        draw(g, p, t) {
          const rows = [
            ['n', 'building', 'size and energy', C.pink], ['ℓ', 'floor', 'shape', C.sun],
            ['m_ℓ', 'room', 'direction', C.cyan], ['m_s', 'seat', 'spin', C.leaf],
          ];
          rows.forEach(([sym, a, b, col], i) => {
            const q = ease.back(seg(p, 0.05 + i * 0.2, 0.22 + i * 0.2));
            if (q <= 0) return;
            const y = 76 + i * 88;
            g.save(); g.translate(400, y); g.scale(q, q); g.translate(-400, -y);
            g.fillStyle = 'rgba(26,15,46,.72)'; Art.round(g, 60, y - 38, 680, 76, 22); g.fill();
            g.strokeStyle = col; g.lineWidth = 3; g.stroke();
            rich(g, sym, 124, y, { size: 46, font: 'display', color: col });
            Art.text(g, a, 330, y, { size: 36, font: 'display' });
            Art.text(g, b, 590, y, { size: 28, color: C.dim });
            g.restore();
          });
          void t;
        },
      },
      {
        say: '<b>$n$ is the building.</b> It is 1, 2, 3 and so on. A bigger $n$ means a bigger orbital with more energy. These three spheres are drawn to scale, each holding 90 percent of the electron.',
        dur: 4,
        draw(g, p) {
          const pxPerPm = 196 / (rEnclose(3, 0, 0.9) * A0);
          const items = [[1, 96], [2, 256], [3, 560]];
          items.forEach(([n, cx], i) => {
            const q = ease.back(seg(p, 0.08 + i * 0.22, 0.3 + i * 0.22));
            if (q <= 0) return;
            const rPm = rEnclose(n, 0, 0.9) * A0, rr = rPm * pxPerPm * q;
            const cy = 216;
            const gr = g.createRadialGradient(cx - rr * 0.3, cy - rr * 0.35, rr * 0.05, cx, cy, rr);
            gr.addColorStop(0, '#CFF8FF'); gr.addColorStop(0.65, C.cyan); gr.addColorStop(1, '#0E6E8C');
            g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
            g.beginPath(); g.arc(cx, cy, rr, 0, TAU); g.fill(); g.stroke();
            Art.ball(g, cx, cy, 5, C.sun);
            Art.text(g, `${n}s`, cx, i === 0 ? cy + rr + 28 : cy - 34, { size: 36, font: 'display', color: i === 0 ? C.ink : '#0A2A3A', alpha: q > 0.9 ? 1 : 0 });
            Art.text(g, `${Math.round(rPm)} pm`, cx, i === 0 ? cy + rr + 62 : cy + 32, { size: 26, color: i === 0 ? C.dim : '#0A2A3A', alpha: q > 0.9 ? 1 : 0 });
          });
          Art.text(g, 'n = 1', 96, 432, { size: 26, font: 'display', color: C.pink, alpha: seg(p, 0.1, 0.3) });
          Art.text(g, 'n = 2', 256, 432, { size: 26, font: 'display', color: C.pink, alpha: seg(p, 0.32, 0.52) });
          Art.text(g, 'n = 3', 560, 432, { size: 26, font: 'display', color: C.pink, alpha: seg(p, 0.54, 0.74) });
        },
      },
      {
        say: '<b>$\\ell$ is the floor.</b> It sets the shape and runs from 0 up to $n - 1$. So building 3 has floors 0, 1 and 2. Each floor has a letter: <b>s</b> is a sphere, <b>p</b> a dumbbell, <b>d</b> a clover, and <b>f</b> something fancier.',
        dur: 4.6,
        draw(g, p, t) {
          const items = [[0, 's', fnS, 'sphere', 62], [1, 'p', fnP, 'dumbbell', 76], [2, 'd', fnD, 'clover', 82], [3, 'f', fnF, 'flower', 82]];
          items.forEach(([l, name, fn, word, S], i) => {
            const cx = 110 + i * 193, cy = 186;
            const q = ease.back(seg(p, 0.08 + i * 0.18, 0.28 + i * 0.18));
            if (q <= 0) return;
            const wob = Math.sin(t * 0.8 + i) * 0.08;
            g.save(); g.translate(cx, cy); g.rotate(wob); g.scale(q, q); g.translate(-cx, -cy);
            lobes2D(g, cx, cy, S, fn);
            g.restore();
            Art.text(g, name, cx, 58, { size: 50, font: 'display', color: C.sun, alpha: q > 0.9 ? 1 : 0 });
            Art.text(g, `ℓ = ${l}`, cx, 318, { size: 30, font: 'display', alpha: q > 0.9 ? 1 : 0 });
            Art.text(g, word, cx, 358, { size: 26, color: C.dim, alpha: q > 0.9 ? 1 : 0 });
          });
          Art.text(g, 'Colors show the phase of the wave, not charge', 400, 416, { size: 25, color: C.cyan, alpha: seg(p, 0.8, 0.96) });
        },
      },
      {
        say: '<b>$m_\\ell$ is the room.</b> It sets the direction, and runs from $-\\ell$ to $+\\ell$. So p has three rooms, $m_\\ell = -1, 0, +1$: three dumbbells along three axes. d has five.',
        dur: 4.2,
        draw(g, p, t) {
          const items = [[-1, 'y'], [0, 'z'], [1, 'x']];
          items.forEach(([m, axis], i) => {
            const cx = 142 + i * 258, cy = 192;
            const q = ease.back(seg(p, 0.1 + i * 0.2, 0.32 + i * 0.2));
            if (q <= 0) return;
            g.save(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2.5;
            [[1, 0], [0, 1], [0.6, -0.6]].forEach(([ax, ay]) => {
              g.beginPath(); g.moveTo(cx - ax * 112, cy + ay * 112); g.lineTo(cx + ax * 112, cy - ay * 112); g.stroke();
            });
            g.restore();
            g.save(); g.translate(cx, cy); g.scale(q, q);
            if (axis === 'y') { g.transform(0.72, -0.72, 0, 1, 0, 0); g.scale(1, 0.72); }
            lobes2D(g, 0, 0, 92, (th) => (axis === 'z' ? Math.sin(th) : Math.cos(th)));
            g.restore();
            rich(g, `m_ℓ = ${signed(m)}`, cx, 344, { size: 32, font: 'display', color: C.cyan, alpha: q > 0.9 ? 1 : 0 });
            rich(g, `p_${axis}`, cx, 386, { size: 30, color: C.ink, alpha: q > 0.9 ? 1 : 0 });
          });
          void t;
        },
      },
      {
        say: '<b>$m_s$ is the seat.</b> Every orbital has two seats. Electrons act like tiny magnets pointing up or down, which we call <b>spin</b>: $m_s = +\\tfrac{1}{2}$ or $-\\tfrac{1}{2}$. So each orbital holds at most two electrons.',
        dur: 4,
        draw(g, p, t) {
          g.fillStyle = 'rgba(255,255,255,.07)'; g.strokeStyle = C.line; g.lineWidth = 4;
          Art.round(g, 140, 62, 520, 262, 34); g.fill(); g.stroke();
          Art.text(g, 'One orbital', 400, 36, { size: 28, font: 'display' });
          const a = ease.back(seg(p, 0.08, 0.3)), b = ease.back(seg(p, 0.34, 0.56));
          const ch = (x, q, up, label) => {
            if (q <= 0) return;
            const y = 188 + Math.sin(t * 2 + x) * 4;
            g.save(); g.translate(x, y); g.scale(q, q);
            Art.atom(g, 0, 0, 58, 'e', { label: false, face: 'happy', t, color: C.electron, look: [up ? 0 : 0, up ? -1 : 1] });
            g.restore();
            Art.arrow(g, x + 88, up ? y + 54 : y - 54, x + 88, up ? y - 54 : y + 54, { color: C.sun, w: 8, head: 16, p: q });
            Art.text(g, label, x, 362, { size: 36, font: 'display', color: C.leaf, alpha: q > 0.9 ? 1 : 0 });
          };
          ch(270, a, true, '+½');
          ch(530, b, false, '−½');
          Art.text(g, 'Not literally spinning. Spin is just the name.', 400, 416, { size: 25, color: C.dim, alpha: seg(p, 0.7, 0.9) });
        },
      },
      {
        say: 'Now count. Floors have <b>1, 3, 5 and 7</b> rooms, and each room seats 2. So s holds 2, p holds 6, d holds 10, and f holds 14. Building $n$ has <b>$n^2$</b> rooms and <b>$2n^2$</b> seats.',
        dur: 4.6,
        draw(g, p, t) {
          const rows = [['s', 1, C.pink], ['p', 3, C.sun], ['d', 5, C.cyan], ['f', 7, C.leaf]];
          rows.forEach(([name, k, col], i) => {
            const y = 66 + i * 76;
            const a = seg(p, 0.05 + i * 0.16, 0.2 + i * 0.16);
            Art.text(g, name, 60, y, { size: 44, font: 'display', color: col, alpha: a });
            for (let b = 0; b < k; b++) {
              const q = ease.back(seg(p, 0.08 + i * 0.16 + b * 0.012, 0.2 + i * 0.16 + b * 0.012));
              if (q <= 0) continue;
              const x = 106 + b * 54;
              g.save(); g.translate(x + 23, y); g.scale(q, q);
              g.fillStyle = Art.alpha(col, 0.2); g.strokeStyle = col; g.lineWidth = 3;
              Art.round(g, -23, -27, 46, 54, 8); g.fill(); g.stroke();
              Art.electron(g, -9, 0, 6); Art.electron(g, 9, 0, 6);
              g.restore();
            }
            Art.text(g, `${k} orbital${k > 1 ? 's' : ''}`, 560, y, { size: 26, align: 'left', alpha: a });
            Art.text(g, `${2 * k} e⁻`, 780, y, { size: 30, font: 'display', color: col, align: 'right', alpha: a });
          });
          const b = ease.back(seg(p, 0.76, 0.96));
          if (b > 0) {
            g.save(); g.translate(400, 392); g.scale(b, b);
            g.fillStyle = C.plum2; Art.round(g, -350, -36, 700, 72, 24); g.fill();
            g.strokeStyle = C.sun; g.lineWidth = 3; g.stroke();
            Art.text(g, 'Shell n: n² orbitals and 2n² electrons', 0, 2, { size: 32, font: 'display', color: C.sun });
            g.restore();
          }
          void t;
        },
      },
    ],
  });

  /* ---------- Bench: electron city ---------- */
  const city = { n: 3, l: 1, m: 0, s: 1, t0: 0 };
  const RW = 34, FH = 62, GROUND = 420;
  const BUILD = [];
  (function () {
    let x = 36;
    for (let n = 1; n <= 4; n++) {
      const w = (2 * n - 1) * RW + 34;
      BUILD.push({ n, x, w });
      x += w + 16;
    }
  })();
  const BCOL = ['', '#3A7BD5', '#2BA58A', '#C27A2C', '#B14A98'];
  function roomRect(b, l, m) {
    const y = GROUND - (l + 1) * FH + 8;
    const rooms = 2 * l + 1;
    const cx = b.x + 26 + (b.w - 26) / 2;
    return { x: cx + (m - 0.5) * RW + 1, y, w: RW - 2, h: FH - 16, rooms };
  }
  const cityStage = Lab.stage('#c-city', {
    h: 500,
    label: 'Four buildings, one for each value of n. Building n has n floors. Each floor has 1, 3, 5 or 7 rooms, and each room has 2 seats.',
    onPointer(e) {
      if (e.type === 'hover') { cityStage.canvas.style.cursor = hitRoom(e.x, e.y) ? 'pointer' : 'default'; return; }
      if (e.type !== 'down') return;
      const h = hitRoom(e.x, e.y);
      if (!h) return;
      if (h.n === city.n && h.l === city.l && h.m === city.m) city.s = -city.s;
      else { city.n = h.n; city.l = h.l; city.m = h.m; }
      city.t0 = cityStage.t;
      Lab.sound.pop();
      paintCity();
    },
    draw(g, t) {
      // Sky and ground.
      const sky = g.createLinearGradient(0, 0, 0, GROUND);
      sky.addColorStop(0, '#1B1140'); sky.addColorStop(1, '#42307A');
      g.fillStyle = sky; g.fillRect(0, 0, 800, GROUND);
      for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(255,255,255,${0.2 + 0.4 * rand(i)})`; g.fillRect(rand(i + 2) * 800, rand(i + 5) * 160, 2, 2); }
      g.fillStyle = '#3F2A20'; g.fillRect(0, GROUND, 800, 80);
      g.fillStyle = '#7F5A3B'; g.fillRect(0, GROUND, 800, 5);
      rich(g, `n = ${city.n},  ℓ = ${city.l},  m_ℓ = ${signed(city.m)},  m_s = ${city.s > 0 ? '+½' : '−½'}`, 400, 34, { size: 32, font: 'display', color: C.sun, halo: true });
      BUILD.forEach((b) => {
        const top = GROUND - b.n * FH;
        const sel = b.n === city.n;
        const body = g.createLinearGradient(b.x, 0, b.x + b.w, 0);
        body.addColorStop(0, Art.mix(BCOL[b.n], '#1A0F2E', sel ? 0.1 : 0.42)); body.addColorStop(1, Art.mix(BCOL[b.n], '#1A0F2E', sel ? 0.34 : 0.62));
        g.fillStyle = body; g.strokeStyle = sel ? C.sun : '#1A0F2E'; g.lineWidth = sel ? 4 : 3;
        Art.round(g, b.x, top, b.w, b.n * FH, 7); g.fill(); g.stroke();
        for (let l = 0; l < b.n; l++) {
          const fy = GROUND - (l + 1) * FH;
          if (l > 0) { g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(b.x + 2, fy + FH - 2, b.w - 4, 3); }
          const floorSel = sel && l === city.l;
          if (floorSel) { g.fillStyle = 'rgba(255,210,63,.18)'; g.fillRect(b.x + 3, fy + 2, b.w - 6, FH - 3); }
          Art.text(g, LETTER[l], b.x + 15, fy + FH / 2, { size: 24, font: 'display', color: floorSel ? C.sun : '#E5DBF7' });
          for (let m = -l; m <= l; m++) {
            const rr = roomRect(b, l, m);
            const on = floorSel && m === city.m;
            g.fillStyle = on ? '#FFF0A8' : '#1B1140'; g.strokeStyle = on ? C.sun : '#0F0920'; g.lineWidth = on ? 3 : 2;
            Art.round(g, rr.x, rr.y, rr.w, rr.h, 5); g.fill(); g.stroke();
            const sx = [rr.x + rr.w * 0.27, rr.x + rr.w * 0.73], sy = rr.y + rr.h * 0.72;
            g.fillStyle = on ? '#C9B98B' : '#47397A';
            g.beginPath(); g.arc(sx[0], sy, 5, 0, TAU); g.arc(sx[1], sy, 5, 0, TAU); g.fill();
            if (on) {
              const X = city.s > 0 ? sx[0] : sx[1];
              Art.electron(g, X, sy - 1 + Math.sin(t * 4) * 1.5, 8);
              Art.arrow(g, X, city.s > 0 ? sy + 6 : sy - 8, X, city.s > 0 ? sy - 8 : sy + 6, { color: '#07304A', w: 2.2, head: 5 });
            }
            if (floorSel) Art.text(g, signed(m), rr.x + rr.w / 2, rr.y + 12, { size: 20, color: on ? '#22123A' : '#fff' });
          }
        }
        Art.text(g, `n = ${b.n}`, b.x + b.w / 2, GROUND + 28, { size: 26, font: 'display', color: sel ? C.sun : C.ink });
        Art.text(g, `${2 * b.n * b.n} seats`, b.x + b.w / 2, GROUND + 58, { size: 22, color: sel ? C.sun : C.dim });
      });
      Art.moe(g, 700, 170, 96, 'point', { t, flip: true });
    },
  });
  function hitRoom(x, y) {
    for (const b of BUILD) {
      for (let l = 0; l < b.n; l++) for (let m = -l; m <= l; m++) {
        const rr = roomRect(b, l, m);
        if (x >= rr.x - 1 && x <= rr.x + rr.w + 1 && y >= rr.y - 6 && y <= rr.y + rr.h + 6) return { n: b.n, l, m };
      }
    }
    return null;
  }
  function paintCity() {
    const { n, l, m, s } = city;
    Lab.$('#city-n').textContent = n;
    Lab.$('#city-l').textContent = `${l} (${LETTER[l]})`;
    Lab.$('#city-m').textContent = signed(m);
    Lab.$('#city-s').textContent = s > 0 ? '+½' : '−½';
    Lab.$('#city-foot').innerHTML = Lab.texString(`<p>This is a <b>${n}${LETTER[l]}</b> electron. Building ${n} has floors 0 to ${n - 1}. Floor ${l} has ${2 * l + 1} room${l ? 's' : ''}, each with 2 seats. In all, this building has $${n}^2 = ${n * n}$ rooms and $2(${n * n}) = ${2 * n * n}$ seats. Tap a room to go there, and tap it again to swap seats.</p>`);
    cityStage.redraw();
  }
  paintCity();

  /* ---------- Bench: address checker ---------- */
  const chk = { n: 3, l: 3, m: 0, s: '+1/2' };
  function rules() {
    const { n, l, m, s } = chk;
    const r = [];
    r.push({ ok: n >= 1, text: n >= 1 ? `n = ${n} is 1 or more` : 'n must be 1 or more' });
    const maxL = n - 1;
    r.push({ ok: n >= 1 && l <= maxL, text: n < 1 ? 'ℓ needs a real n first' : l <= maxL ? `ℓ = ${l} is within 0 to ${maxL}` : `ℓ = ${l}, but it must be 0 to ${maxL}` });
    r.push({ ok: Math.abs(m) <= l, text: Math.abs(m) <= l ? `m_ℓ = ${signed(m)} is within ±${l}` : `m_ℓ = ${signed(m)}, but it must be within ±${l}` });
    const sOK = s === '+1/2' || s === '-1/2';
    const sTxt = s === '+1/2' ? '+½' : s === '-1/2' ? '−½' : s;
    r.push({ ok: sOK, text: sOK ? `m_s = ${sTxt} is allowed` : `m_s = ${sTxt}, but it must be +½ or −½` });
    return r;
  }
  Lab.stage('#c-check', {
    h: 360,
    label: 'Four rules checked one by one for the chosen quantum numbers. If all pass, a picture of the orbital appears.',
    draw(g, t) {
      const list = rules();
      const allOK = list.every((r) => r.ok);
      list.forEach((r, i) => {
        const y = 60 + i * 80;
        Art.ball(g, 50, y, 24, r.ok ? C.leaf : C.red);
        Art.text(g, r.ok ? '✓' : '✗', 50, y, { size: 26, color: '#fff' });
        rich(g, r.text, 86, y, { size: 26, align: 'left', color: r.ok ? C.ink : '#FFB3BA' });
      });
      const px = 590;
      if (allOK) {
        const { n, l, m } = chk;
        const name = l <= 3 ? `${n}${LETTER[l]}` : `${n}${LETTER[l]}`;
        if (l <= 3) {
          const img = sliceImage(n, l, m, { size: 180 });
          drawSlice(g, img, px - 90, 18, 180, { rim: C.leaf });
        } else {
          Art.moe(g, px, 200, 150, 'cheer', { t });
        }
        Art.text(g, name, px, 244, { size: 48, font: 'display', color: C.leaf });
        Art.text(g, 'This address is real', px, 296, { size: 26, color: C.leaf });
        if (l > 3) Art.text(g, 'No atom fills it, though', px, 332, { size: 22, color: C.dim });
      } else {
        Art.moe(g, px, 226, 180, 'oops', { t });
        Art.text(g, 'No such address', px, 270, { size: 34, font: 'display', color: C.red });
        const { n, l } = chk;
        if (n >= 1 && l >= n && l <= 5) Art.text(g, `There is no ${n}${LETTER[l]} orbital`, px, 314, { size: 24, color: '#FFB3BA' });
      }
    },
  });
  Lab.bind('#chk-n', '#chk-n-out', (x) => x, (x) => { chk.n = x; });
  Lab.bind('#chk-l', '#chk-l-out', (x) => `${x} (${LETTER[x]})`, (x) => { chk.l = x; });
  Lab.bind('#chk-m', '#chk-m-out', (x) => signed(x), (x) => { chk.m = x; });
  Lab.segmented('#chk-s', (x) => { chk.s = x; });

  /* ---------- Story 3: nodes ---------- */
  Lab.story('#story-nodes', {
    title: 'Nodes: the still points',
    scenes: [
      {
        say: 'Pluck a guitar string. It vibrates in fixed patterns called <b>standing waves</b>. Some points never move at all. Those still points are called <b>nodes</b>.',
        dur: 3.8,
        draw(g, p, t) {
          const x0 = 90, x1 = 710;
          [1, 2, 3].forEach((k, i) => {
            const y = 84 + i * 126;
            const a = seg(p, 0.05 + i * 0.2, 0.22 + i * 0.2);
            if (a <= 0) return;
            g.save(); g.globalAlpha *= a;
            [[0, '#6F6A8B']].forEach(() => {
              g.fillStyle = '#6F6A8B'; g.fillRect(x0 - 10, y - 26, 10, 52); g.fillRect(x1, y - 26, 10, 52);
            });
            const amp = 42 * Math.cos(t * (2.2 + k * 0.4));
            g.strokeStyle = 'rgba(47,214,242,.25)'; g.lineWidth = 3;
            for (const sign of [1, -1]) {
              g.beginPath();
              for (let x = x0; x <= x1; x += 4) { const yy = y - sign * 42 * Math.sin((k * Math.PI * (x - x0)) / (x1 - x0)); if (x === x0) g.moveTo(x, yy); else g.lineTo(x, yy); }
              g.stroke();
            }
            g.strokeStyle = C.cyan; g.lineWidth = 6; g.lineCap = 'round';
            g.beginPath();
            for (let x = x0; x <= x1; x += 4) { const yy = y - amp * Math.sin((k * Math.PI * (x - x0)) / (x1 - x0)); if (x === x0) g.moveTo(x, yy); else g.lineTo(x, yy); }
            g.stroke();
            for (let j = 1; j < k; j++) {
              const nx = x0 + ((x1 - x0) * j) / k;
              Art.ball(g, nx, y, 10, C.pink);
            }
            g.restore();
            Art.text(g, `${k - 1} node${k === 2 ? '' : 's'}`, 760, y - 44, { size: 22, align: 'right', color: k > 1 ? C.pink : C.dim, alpha: a });
          });
        },
      },
      {
        say: 'Electrons are waves too, so orbitals have nodes. In a slice through an s orbital, dark rings are <b>radial nodes</b>: spheres where the chance of finding the electron is exactly zero.',
        dur: 4.4,
        draw(g, p) {
          [[1, 0], [2, 0], [3, 0]].forEach(([n, l], i) => {
            const x = 28 + i * 256, S = 232, y = 62;
            const a = seg(p, 0.06 + i * 0.22, 0.26 + i * 0.22);
            if (a <= 0) return;
            g.save(); g.globalAlpha *= a;
            const img = sliceImage(n, l, 0, { size: 220 });
            drawSlice(g, img, x, y, S, { signs: false });
            g.restore();
            Art.text(g, `${n}s`, x + S / 2, 36, { size: 36, font: 'display', color: C.sun, alpha: a });
            const nodes = radialNodes(n, l);
            nodes.forEach((r) => {
              const rr = (r / img._span) * (S / 2);
              g.save(); g.globalAlpha *= a; g.setLineDash([5, 6]);
              Art.ring(g, x + S / 2, y + S / 2, rr, { color: C.sun, w: 2.5 });
              g.restore();
            });
            Art.text(g, `${nodes.length} radial node${nodes.length === 1 ? '' : 's'}`, x + S / 2, y + S + 34, { size: 26, alpha: a, color: nodes.length ? C.pink : C.ink });
          });
          Art.text(g, 'Dashed rings mark the nodes. Not to the same scale.', 400, 418, { size: 24, color: C.dim, alpha: seg(p, 0.75, 0.95) });
        },
      },
      {
        say: 'Colors flip across a node, as a wave goes from up to down. The electron does not hop across like a ball. It is one wave with two parts, <b>spread over both sides at once</b>.',
        dur: 4.2,
        draw(g, p) {
          const n = 2, l = 0;
          const img = sliceImage(n, l, 0, { size: 240 });
          const S = 300, x = 40, y = 70;
          drawSlice(g, img, x, y, S, { signs: false });
          const rNode = radialNodes(n, l)[0];
          const rrN = (rNode / img._span) * (S / 2);
          g.save(); g.setLineDash([5, 6]); Art.ring(g, x + S / 2, y + S / 2, rrN, { color: C.sun, w: 3, p: seg(p, 0.2, 0.5) }); g.restore();
          Art.text(g, 'A slice through 2s', x + S / 2, 42, { size: 26 });
          const ox = 410, oy = 240, gw = 350, gh = 130, rTop = img._span;
          const q = ease.inOut(seg(p, 0.15, 0.7));
          g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2.5;
          g.beginPath(); g.moveTo(ox, oy); g.lineTo(ox + gw, oy); g.stroke();
          let pk = 0;
          for (let i = 0; i <= 100; i++) pk = Math.max(pk, Math.abs(Rnl(n, l, (i / 100) * rTop) * Math.sqrt(1)));
          for (let i = 0; i < gw * q; i += 2) {
            const r = (i / gw) * rTop, psi = Rnl(n, l, r) / pk;
            g.fillStyle = psi >= 0 ? C.cyan : C.pink;
            g.fillRect(ox + i, psi >= 0 ? oy - psi * gh : oy, 2.2, Math.abs(psi) * gh);
          }
          const nx = ox + (rNode / rTop) * gw;
          Art.ring(g, nx, oy, 12, { color: C.sun, w: 3.5, p: seg(p, 0.45, 0.65) });
          Art.text(g, 'node', nx, oy + 40, { size: 26, font: 'display', color: C.sun, alpha: seg(p, 0.5, 0.7), halo: true });
          Art.text(g, 'wave height: up', ox + 12, oy - gh - 16, { size: 24, color: C.cyan, align: 'left', alpha: seg(p, 0.2, 0.4) });
          Art.text(g, 'wave height: down', ox + gw, oy + 88, { size: 24, color: C.pink, align: 'right', alpha: seg(p, 0.5, 0.7) });
          Art.text(g, 'Distance from the nucleus', ox + gw / 2, 382, { size: 22, color: C.dim });
        },
      },
      {
        say: 'A p orbital has a different kind of node: a flat plane through the nucleus. These are <b>angular nodes</b>. There are $\\ell$ of them. So p has 1, d has 2, and s has none.',
        dur: 4.4,
        draw(g, p) {
          [[2, 1, 0, 'Plane between the lobes', 'one'], [3, 2, 1, 'Two planes', 'two']].forEach(([n, l, m, cap], i) => {
            const S = 276, x = 62 + i * 400, y = 54;
            const a = seg(p, 0.08 + i * 0.3, 0.3 + i * 0.3);
            if (a <= 0) return;
            g.save(); g.globalAlpha *= a;
            drawSlice(g, sliceImage(n, l, m, { size: 230 }), x, y, S, { signs: true });
            g.restore();
            g.save(); g.globalAlpha *= a; g.strokeStyle = C.sun; g.lineWidth = 4; g.setLineDash([9, 8]);
            if (i === 0) { g.beginPath(); g.moveTo(x + 6, y + S / 2); g.lineTo(x + S - 6, y + S / 2); g.stroke(); }
            else { g.beginPath(); g.moveTo(x + 6, y + S / 2); g.lineTo(x + S - 6, y + S / 2); g.moveTo(x + S / 2, y + 6); g.lineTo(x + S / 2, y + S - 6); g.stroke(); }
            g.restore();
            Art.text(g, `${n}${LETTER[l]}`, x + S / 2, 28, { size: 34, font: 'display', color: C.sun, alpha: a });
            Art.text(g, cap, x + S / 2, y + S + 34, { size: 26, alpha: a });
          });
          Art.text(g, 'Slices. The + and − show phase.', 400, 418, { size: 24, color: C.dim, alpha: seg(p, 0.8, 0.96) });
        },
      },
      {
        say: 'Here is the whole rule. An orbital has <b>$n - 1$ nodes in total</b>. Of those, <b>$\\ell$ are angular</b> and the rest, <b>$n - \\ell - 1$, are radial</b>.',
        dur: 4,
        draw(g, p, t) {
          const rows = [['2s', 2, 0], ['2p', 2, 1], ['3s', 3, 0], ['3p', 3, 1], ['3d', 3, 2]];
          const cols = [190, 370, 540, 700];
          ['Orbital', 'Radial', 'Angular', 'Total'].forEach((h2, i) => Art.text(g, h2, cols[i], 42, { size: 28, font: 'display', color: [C.ink, C.pink, C.cyan, C.sun][i] }));
          rows.forEach(([nm, n, l], i) => {
            const y = 96 + i * 54;
            const a = seg(p, 0.08 + i * 0.13, 0.2 + i * 0.13);
            if (a <= 0) return;
            g.save(); g.globalAlpha *= a;
            g.fillStyle = 'rgba(255,255,255,.05)'; Art.round(g, 120, y - 24, 620, 48, 12); g.fill();
            g.restore();
            Art.text(g, nm, cols[0], y, { size: 32, font: 'display', alpha: a });
            Art.text(g, String(n - l - 1), cols[1], y, { size: 32, font: 'display', color: C.pink, alpha: a });
            Art.text(g, String(l), cols[2], y, { size: 32, font: 'display', color: C.cyan, alpha: a });
            Art.text(g, String(n - 1), cols[3], y, { size: 32, font: 'display', color: C.sun, alpha: a });
          });
          void t;
          const b = seg(p, 0.8, 0.96);
          Art.text(g, 'Check: radial + angular = total', 430, 400, { size: 28, color: C.leaf, alpha: b });
        },
      },
    ],
  });
});
