/* Lesson 2.1: Inside the atom. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const TAU = Math.PI * 2;
  const GOLD = Art.elementColor('Au');
  const ALPHA = '#FF4FA3';

  /* ---------- Shared little drawings ---------- */
  /** A row of countable mass blocks: one block per gram. */
  function blocks(g, x, y, n, w, color, q = 1) {
    for (let i = 0; i < n; i++) {
      const k = ease.back(clamp(q * (n + 3) - i));
      if (k <= 0) continue;
      g.fillStyle = color; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2;
      Art.round(g, x + i * w + (w - 2) * (1 - k) * 0.5, y + (w - 2) * (1 - k) * 0.5, (w - 2) * k, (w - 2) * k, 4); g.fill(); g.stroke();
    }
  }
  /** A gold atom in Thomson's picture: positive pudding with electrons stuck in it. */
  function pudding(g, x, y, R, t, o = {}) {
    const gr = g.createRadialGradient(x - R * 0.3, y - R * 0.35, R * 0.1, x, y, R);
    gr.addColorStop(0, '#FFE3C2'); gr.addColorStop(0.6, '#F0A86A'); gr.addColorStop(1, '#B9643A');
    g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    g.beginPath(); g.arc(x, y, R, 0, TAU); g.fill(); g.stroke();
    const n = o.n || 7;
    for (let i = 0; i < n; i++) {
      const a = i * 2.39996 + 0.6, d = Math.sqrt((i + 0.6) / n) * R * 0.8;
      const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
      if (i % 2) {
        Art.text(g, '+', px, py, { size: Math.max(18, R * 0.3), color: '#9A3412' });
      } else {
        Art.electron(g, px + wander(i, t * 0.5) * 2, py + wander(i + 7, t * 0.5) * 2, Math.max(4.5, R * 0.1));
      }
    }
  }
  /** A gold atom in Rutherford's picture: a thin electron haze and a tiny, heavy nucleus. */
  function nuclear(g, x, y, R, nr, t, o = {}) {
    const col = o.color || GOLD;
    const gr = g.createRadialGradient(x, y, 0, x, y, R);
    gr.addColorStop(0, Art.alpha(C.cyan, 0.16)); gr.addColorStop(0.75, Art.alpha(C.cyan, 0.09)); gr.addColorStop(1, Art.alpha(C.cyan, 0));
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, R, 0, TAU); g.fill();
    g.strokeStyle = Art.alpha(C.cyan, 0.22); g.lineWidth = 1.5; g.setLineDash([4, 6]);
    g.beginPath(); g.arc(x, y, R * 0.96, 0, TAU); g.stroke(); g.setLineDash([]);
    const n = o.n || 4;
    for (let i = 0; i < n; i++) {
      const a = t * (0.5 + rand(i + 3) * 0.7) + rand(i + 1) * TAU + (o.seed || 0);
      const d = R * (0.42 + rand(i + 6) * 0.42);
      Art.electron(g, x + Math.cos(a) * d, y + Math.sin(a) * d * (0.72 + rand(i + 9) * 0.28), clamp(R * 0.06, 3, 7));
    }
    Art.glow(g, x, y, nr * 3.4, col, 0.55);
    Art.ball(g, x, y, nr, col);
  }
  /** Trace an alpha particle past a nucleus at the origin, using real repulsion. Memoized, so scenes stay pure. */
  const pathMemo = new Map();
  function alphaPath(b, r0, startX = -320, maxLen = 900) {
    const key = [b, r0, startX, maxLen].join('|');
    if (pathMemo.has(key)) return pathMemo.get(key);
    const lam = r0 * 1.4, v0 = 1, h = r0 / 60;
    const A = 0.5 * v0 * v0 * r0 * Math.exp(r0 / lam);
    let x = startX, y = b, vx = v0, vy = 0, len = 0, safety = 0;
    const pts = [[x, y]];
    while (len < maxLen && safety++ < 60000) {
      const r = Math.max(0.01, Math.hypot(x, y));
      const F = A * Math.exp(-r / lam) * (1 / (r * r) + 1 / (r * lam));
      vx += (F * x / r) * h; vy += (F * y / r) * h;
      x += vx * h; y += vy * h;
      len += Math.hypot(vx, vy) * h;
      if (safety % 6 === 0) pts.push([x, y]);
    }
    pathMemo.set(key, pts);
    return pts;
  }
  /** Draw a path up to fraction q, with a glowing head. Returns the head position. */
  function drawTrack(g, ox, oy, pts, q, color = ALPHA, o = {}) {
    const n = Math.max(1, Math.floor(pts.length * clamp(q)));
    g.save();
    g.strokeStyle = Art.alpha(color, o.alpha || 0.55); g.lineWidth = o.w || 3; g.lineCap = 'round'; g.lineJoin = 'round';
    if (o.dash) g.setLineDash(o.dash);
    g.beginPath(); g.moveTo(ox + pts[0][0], oy + pts[0][1]);
    for (let i = 1; i < n; i++) g.lineTo(ox + pts[i][0], oy + pts[i][1]);
    g.stroke(); g.restore();
    const h = pts[n - 1];
    if (q < 1 || o.head) { Art.glow(g, ox + h[0], oy + h[1], 16, color, 0.6); Art.ball(g, ox + h[0], oy + h[1], o.r || 7, color); }
    return [ox + h[0], oy + h[1]];
  }
  function leadBox(g, x, y, w, h, label) {
    const gr = g.createLinearGradient(x, y, x, y + h);
    gr.addColorStop(0, '#7E8496'); gr.addColorStop(1, '#474C5E');
    g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    Art.round(g, x, y, w, h, 10); g.fill(); g.stroke();
    if (label) Art.text(g, label, x + w / 2, y + h / 2, { size: 24, color: '#fff' });
  }

  /* ---------- Story 1: three clues ---------- */
  const hAfter = [[-104, -8], [-14, -8], [8, 92], [98, 92]];
  const hBefore = [[-112, 22], [-54, 22], [-4, 98], [54, 98]];
  const oBefore = [[-6, -82], [62, -82]];
  const oAfter = [[-59, -36], [53, 64]];
  function rearranging(g, cx, cy, q, t, scale = 1, faces = true) {
    const pos = (a, b, i) => [cx + lerp(a[0], b[0], q) * scale + wander(i, t) * 3, cy + lerp(a[1], b[1], q) * scale + wander(i + 5, t) * 3];
    const O = oBefore.map((b, i) => pos(b, oAfter[i], i));
    const H = hBefore.map((b, i) => pos(b, hAfter[i], i + 2));
    const before = 1 - clamp(q * 2.2), after = clamp((q - 0.55) * 2.2);
    if (before > 0) {
      g.save(); g.globalAlpha *= before;
      Art.bond(g, O[0][0], O[0][1], O[1][0], O[1][1], { order: 2, width: 5 });
      Art.bond(g, H[0][0], H[0][1], H[1][0], H[1][1], { width: 5 });
      Art.bond(g, H[2][0], H[2][1], H[3][0], H[3][1], { width: 5 });
      g.restore();
    }
    if (after > 0) {
      g.save(); g.globalAlpha *= after;
      Art.bond(g, O[0][0], O[0][1], H[0][0], H[0][1], { width: 5 });
      Art.bond(g, O[0][0], O[0][1], H[1][0], H[1][1], { width: 5 });
      Art.bond(g, O[1][0], O[1][1], H[2][0], H[2][1], { width: 5 });
      Art.bond(g, O[1][0], O[1][1], H[3][0], H[3][1], { width: 5 });
      g.restore();
    }
    H.forEach((h) => Art.atom(g, h[0], h[1], 20 * scale, 'H', {}));
    O.forEach((o, i) => Art.atom(g, o[0], o[1], 31 * scale, 'O', { face: faces ? (q > 0.7 ? 'happy' : 'wow') : null, t, seed: i }));
  }
  function miniH2O(g, x, y, s, rot = 0) { Art.molecule(g, x, y, s, 'H2O', { rot, style: 'ball', labels: false }); }

  Lab.story('#story-clues', {
    title: 'Three clues, and one big idea',
    scenes: [
      {
        say: '<b>Clue 1: mass never changes.</b> Seal hydrogen and oxygen in a flask and set them off. The atoms swap partners, but the scale does not move. This is the <b>law of conservation of mass</b>.',
        dur: 4.6,
        draw(g, p, t, { W, H }) {
          Art.bench(g, W, H - 62, 62);
          const q = ease.inOut(seg(p, 0.34, 0.72));
          const sc = Art.digitalScale(g, 190, H - 60, 300, '50.00 g', { size: 22 });
          const fx = Art.flask(g, 190, sc.top, 190, 250, { level: q * 0.14, liquid: C.water });
          g.fillStyle = '#6E4B31'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
          Art.round(g, 190 - 27, fx.neckY - 24, 54, 38, 6); g.fill(); g.stroke();
          const flash = seg(p, 0.3, 0.46);
          if (flash > 0 && flash < 1) { Art.glow(g, 190, sc.top - 90, 110, C.sun, 0.7 * (1 - flash)); Art.burst(g, 190, sc.top - 90, flash, { n: 16, r: 90 }); }
          Art.text(g, 'sealed flask', 190, 36, { size: 26, color: C.dim });
          Art.zoom(g, 225, sc.top - 90, 585, 182, 158, (gg, cx, cy) => rearranging(gg, cx, cy, q, t, 0.92), { p: seg(p, 0, 0.18) });
          Art.text(g, q < 0.5 ? 'before' : 'after', 585, 46, { size: 26, color: C.cyan, alpha: seg(p, 0.1, 0.2), halo: true });
          Art.text(g, '4 H and 2 O, before and after', 585, 364, { size: 26, color: C.sun, alpha: seg(p, 0.72, 0.9), halo: true });
          Art.text(g, 'Same reading', 190, H - 26, { font: 'display', size: 28, alpha: seg(p, 0.72, 0.9) });
        },
      },
      {
        say: '<b>Clue 2: a recipe that never changes.</b> Any sample of water has about 8 g of oxygen for every 1 g of hydrogen. This is the <b>law of definite proportions</b>.',
        dur: 4.2,
        draw(g, p, t, { W, H }) {
          const a = seg(p, 0, 0.15), b = seg(p, 0.42, 0.57);
          const O = Art.elementColor('O'), Hc = Art.elementColor('H');
          // Small sample.
          g.save(); g.globalAlpha *= a;
          Art.beaker(g, 200, 212, 120, 130, { level: 0.5, liquid: C.water, ticks: false });
          Art.text(g, '9 g of water', 200, 48, { font: 'display', size: 30 });
          g.restore();
          if (a > 0) {
            blocks(g, 200 - 108, 248, 8, 24, O, seg(p, 0.1, 0.38));
            blocks(g, 200 - 108 + 8 * 24, 248, 1, 24, Hc, seg(p, 0.1, 0.38));
          }
          Art.text(g, '8 g O + 1 g H', 200, 298, { size: 27, alpha: seg(p, 0.28, 0.4) });
          // Big sample.
          g.save(); g.globalAlpha *= b;
          Art.beaker(g, 590, 212, 164, 150, { level: 0.72, liquid: C.water, ticks: false });
          Art.text(g, '18 g of water', 590, 48, { font: 'display', size: 30 });
          g.restore();
          if (b > 0) {
            blocks(g, 590 - 162, 248, 16, 18, O, seg(p, 0.5, 0.74));
            blocks(g, 590 - 162 + 16 * 18, 248, 2, 18, Hc, seg(p, 0.5, 0.74));
          }
          Art.text(g, '16 g O + 2 g H', 590, 298, { size: 27, alpha: seg(p, 0.68, 0.78) });
          const c = ease.back(seg(p, 0.78, 0.94));
          if (c > 0) {
            g.save(); g.translate(W / 2, H - 76); g.scale(c, c);
            g.fillStyle = C.pink; Art.round(g, -290, -38, 580, 76, 26); g.fill();
            Art.text(g, 'Both have 8 g O per 1 g H', 0, 2, { font: 'display', size: 36, color: '#fff' });
            g.restore();
          }
          void t;
        },
      },
      {
        say: '<b>Clue 3: only whole-number jumps.</b> Carbon and oxygen make two compounds. With the same 12 g of carbon, one has 16 g of oxygen and the other has 32 g, a 1 to 2 ratio. This is the <b>law of multiple proportions</b>.',
        dur: 4.6,
        draw(g, p, t, { W, H }) {
          const O = Art.elementColor('O');
          const a = seg(p, 0, 0.2), b = seg(p, 0.32, 0.52);
          g.save(); g.globalAlpha *= a;
          Art.molecule(g, 215, 124, 96, 'CO', { face: 'happy', t, faceAll: true, look: [1, 0] });
          Art.text(g, 'carbon monoxide', 215, 42, { size: 27, color: C.dim });
          g.restore();
          g.save(); g.globalAlpha *= b;
          Art.molecule(g, 585, 124, 84, 'CO2', { face: 'happy', t, look: [0, 1] });
          Art.text(g, 'carbon dioxide', 585, 42, { size: 27, color: C.dim });
          g.restore();
          // Oxygen blocks: 1 block = 2 g, at the same scale on both sides.
          const y0 = 228, w = 19;
          if (a > 0) {
            blocks(g, 215 - 8 * w / 2 - 0, y0, 8, w, O, seg(p, 0.12, 0.3));
            Art.text(g, '16 g O per 12 g C', 215, y0 + 54, { size: 27, alpha: seg(p, 0.2, 0.32) });
          }
          if (b > 0) {
            blocks(g, 585 - 16 * w / 2, y0, 16, w, O, seg(p, 0.44, 0.66));
            Art.text(g, '32 g O per 12 g C', 585, y0 + 54, { size: 27, alpha: seg(p, 0.55, 0.68) });
          }
          Art.arrow(g, 300, y0 + 8, 420, y0 + 8, { color: C.sun, w: 6, p: seg(p, 0.66, 0.78), curve: -24 });
          Art.text(g, 'exactly double', W / 2 - 40, y0 - 30, { size: 25, color: C.sun, alpha: seg(p, 0.72, 0.82), halo: true });
          const c = ease.back(seg(p, 0.8, 0.95));
          if (c > 0) {
            g.save(); g.translate(W / 2, H - 70); g.scale(c, c);
            g.fillStyle = C.pink; Art.round(g, -320, -38, 640, 76, 26); g.fill();
            Art.text(g, 'You can add one whole atom, never half', 0, 2, { font: 'display', size: 33, color: '#fff' });
            g.restore();
          }
        },
      },
      {
        say: "<b>John Dalton</b> saw what these clues meant. Around 1805 he said matter comes in tiny particles called atoms. His <b>atomic theory</b> explains all three laws.",
        dur: 5,
        draw(g, p, t, { W }) {
          const tile = (i, x, y, text, draw) => {
            const q = ease.out(seg(p, 0.03 + i * 0.22, 0.2 + i * 0.22));
            if (q <= 0) return;
            g.save(); g.globalAlpha *= q; g.translate(0, (1 - q) * 18);
            g.fillStyle = C.plum2; Art.round(g, x, y, 370, 196, 20); g.fill();
            Art.text(g, text, x + 185, y + 34, { size: 24 });
            draw(x + 185, y + 118);
            g.restore();
          };
          tile(0, 22, 18, 'Matter is made of atoms', (x, y) => {
            for (let i = 0; i < 12; i++) Art.atom(g, x - 110 + (i % 4) * 60 + (Math.floor(i / 4) % 2) * 26 + wander(i, t) * 2, y - 45 + Math.floor(i / 4) * 42, 22, ['Au', 'S', 'Cu'][Math.floor(i / 4)], { label: false });
          });
          tile(1, 408, 18, 'One element, one kind of atom', (x, y) => {
            for (let i = 0; i < 3; i++) Art.atom(g, x - 120 + i * 40, y - 10 + wander(i, t) * 2, 21, 'O', { label: false });
            for (let i = 0; i < 3; i++) Art.atom(g, x + 40 + i * 40, y - 10 + wander(i + 4, t) * 2, 21, 'Cl', { label: false });
            Art.text(g, 'oxygen', x - 80, y + 40, { size: 22, color: C.dim });
            Art.text(g, 'chlorine', x + 80, y + 40, { size: 22, color: C.dim });
          });
          tile(2, 22, 232, 'Compounds use whole numbers', (x, y) => {
            Art.molecule(g, x - 95, y, 52, 'H2O', { labels: false, rot: Math.sin(t * 0.7) * 0.1 });
            Art.molecule(g, x + 95, y, 50, 'CO2', { labels: false, rot: Math.sin(t * 0.6 + 1) * 0.1 });
            Art.text(g, '2 H, 1 O', x - 95, y + 50, { size: 22, color: C.dim });
            Art.text(g, '1 C, 2 O', x + 95, y + 50, { size: 22, color: C.dim });
          });
          tile(3, 408, 232, 'Reactions only rearrange', (x, y) => {
            const q = 0.5 - 0.5 * Math.cos(t * 1.1);
            g.save(); g.translate(x + 2, y + 2); g.scale(0.5, 0.5); g.translate(10, -8);
            rearranging(g, 0, 0, ease.inOut(q), t, 1, false);
            g.restore();
          });
          void W;
        },
      },
      {
        say: 'Dalton got a lot right, but he also said atoms cannot be split. He also thought all atoms of an element are identical. <b>Both ideas turned out to be wrong.</b> Atoms have parts inside.',
        dur: 3.8,
        draw(g, p, t, { W, H }) {
          const q = ease.inOut(seg(p, 0.2, 0.62));
          const cx = 300, cy = H / 2 + 6, R = 150;
          const gap = q * 46;
          const half = (dir) => {
            g.save();
            g.translate(dir * gap, 0); g.rotate(dir * q * 0.04);
            g.beginPath();
            // A jagged crack down the middle of the marble.
            const pts = [[0, -R - 6], [18, -R * 0.62], [-14, -R * 0.3], [20, 0], [-16, R * 0.32], [14, R * 0.66], [0, R + 6]];
            g.moveTo(cx + pts[0][0], cy + pts[0][1]);
            pts.forEach(([x, y]) => g.lineTo(cx + x, cy + y));
            g.lineTo(cx + dir * (R + 20), cy + R + 6); g.lineTo(cx + dir * (R + 20), cy - R - 6); g.closePath(); g.clip();
            Art.ball(g, cx, cy, R, '#E2C074');
            g.restore();
          };
          half(-1); half(1);
          const fly = ease.out(seg(p, 0.42, 0.85));
          for (let i = 0; i < 5; i++) {
            const a = -1.3 + i * 0.65, d = 40 + fly * (120 + i * 18);
            Art.electron(g, cx + Math.cos(a) * d * 1.1 + wander(i, t) * 3, cy + Math.sin(a) * d * 0.9 - 8 + wander(i + 8, t) * 3, 9 * clamp(fly * 3));
          }
          Art.text(g, 'something tinier is in here', 300, 34, { size: 26, color: C.cyan, alpha: seg(p, 0.6, 0.8), halo: true });
          Art.bubble(g, "Dalton's marble needs an update.", 640, 240, { w: 260, side: 'down', size: 25, alpha: seg(p, 0.7, 0.86) });
          Art.moe(g, 640, H - 20, 170, 'oops', { t, flip: true });
          void W;
        },
      },
    ],
  });

  /* ---------- Bench: cathode ray tube ---------- */
  const tube = { v: 60, shown: 60, metal: 'Cu', flip: 0 };
  const TUBE_Y = 200, PLATE_X0 = 322, PLATE_X1 = 522, SCREEN_X = 716;
  const beamY = (x, v) => {
    const a = (v / 100) * (26 / ((PLATE_X1 - PLATE_X0) * (PLATE_X1 - PLATE_X0)));
    if (x <= PLATE_X0) return TUBE_Y;
    if (x <= PLATE_X1) return TUBE_Y - a * (x - PLATE_X0) * (x - PLATE_X0);
    const L = PLATE_X1 - PLATE_X0;
    return TUBE_Y - a * L * L - 2 * a * L * (x - PLATE_X1);
  };
  const METAL_COLOR = { Cu: Art.elementColor('Cu'), Fe: '#8D97A8', Pt: Art.elementColor('Pt') };
  Lab.stage('#c-tube', {
    h: 410, label: 'A glass tube. An electron beam leaves the cathode, passes between two charged plates, and lands on a glowing screen. The beam bends toward the positive plate.',
    draw(g, t, dt) {
      tube.shown = lerp(tube.shown, tube.v, clamp(dt * 7));
      const v = tube.shown;
      // Wires and battery, behind the glass.
      g.strokeStyle = '#8A7CA8'; g.lineWidth = 4; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(105, 240); g.lineTo(105, 362); g.lineTo(226, 362); g.lineTo(226, 270); g.stroke();
      // Glass tube.
      const body = new Path2D();
      body.moveTo(90, 118); body.quadraticCurveTo(60, 200, 90, 282); body.lineTo(250, 282); body.quadraticCurveTo(330, 318, 520, 318);
      body.lineTo(690, 318); body.quadraticCurveTo(748, 318, 748, 262); body.lineTo(748, 138); body.quadraticCurveTo(748, 82, 690, 82);
      body.lineTo(520, 82); body.quadraticCurveTo(330, 82, 250, 118); body.closePath();
      const glass = g.createLinearGradient(0, 82, 0, 318);
      glass.addColorStop(0, 'rgba(214,240,255,.16)'); glass.addColorStop(0.5, 'rgba(214,240,255,.04)'); glass.addColorStop(1, 'rgba(214,240,255,.1)');
      g.fillStyle = glass; g.fill(body);
      // Screen.
      const scr = g.createLinearGradient(SCREEN_X - 8, 0, SCREEN_X + 16, 0);
      scr.addColorStop(0, '#1E4D3E'); scr.addColorStop(1, '#0F2A22');
      g.fillStyle = scr; Art.round(g, SCREEN_X - 6, 96, 18, 208, 6); g.fill();
      // Cathode and anode.
      g.fillStyle = METAL_COLOR[tube.metal]; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
      Art.round(g, 96, 158, 18, 84, 4); g.fill(); g.stroke();
      Art.text(g, '−', 105, 198, { size: 22, color: '#1A0F2E' });
      g.fillStyle = '#A9A6C2';
      Art.round(g, 218, 128, 16, 62, 4); g.fill(); g.stroke();
      Art.round(g, 218, 210, 16, 62, 4); g.fill(); g.stroke();
      // Plates, colored by the sign of their charge.
      const pos = '#FF5A6B', neg = '#2FA8FF', off = '#8C86A5';
      const mag = clamp(Math.abs(v) / 25);
      const topCol = Art.mix(off, v >= 0 ? pos : neg, mag), botCol = Art.mix(off, v >= 0 ? neg : pos, mag);
      const plate = (y, col, sign) => {
        g.fillStyle = col; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
        Art.round(g, PLATE_X0, y, PLATE_X1 - PLATE_X0, 18, 6); g.fill(); g.stroke();
        if (Math.abs(v) > 4) for (let i = 0; i < 5; i++) Art.text(g, sign, PLATE_X0 + 22 + i * 39, y + 8, { size: 20, color: '#fff' });
      };
      plate(TUBE_Y - 76, topCol, v >= 0 ? '+' : '−');
      plate(TUBE_Y + 58, botCol, v >= 0 ? '−' : '+');
      // The beam itself.
      g.save();
      g.globalCompositeOperation = 'lighter';
      [[12, 0.1], [5, 0.3], [2, 0.75]].forEach(([w, a]) => {
        g.strokeStyle = Art.alpha(C.electron, a); g.lineWidth = w; g.lineCap = 'round';
        g.beginPath(); g.moveTo(114, TUBE_Y);
        for (let x = 240; x <= SCREEN_X - 4; x += 14) g.lineTo(x, beamY(x, v));
        g.stroke();
      });
      g.restore();
      for (let i = 0; i < 18; i++) {
        const u = ((t * 0.55 + i / 18) % 1);
        const x = lerp(116, SCREEN_X - 6, u);
        Art.electron(g, x, beamY(x, v), 5.5);
      }
      const spotY = beamY(SCREEN_X, v);
      Art.glow(g, SCREEN_X + 2, spotY, 46, '#7DFFB0', 0.85);
      g.fillStyle = '#E9FFF2'; g.beginPath(); g.arc(SCREEN_X + 2, spotY, 7, 0, TAU); g.fill();
      // Faint marks where the undeflected beam would land.
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.setLineDash([5, 6]); g.lineWidth = 2;
      g.beginPath(); g.moveTo(SCREEN_X - 24, TUBE_Y); g.lineTo(SCREEN_X + 14, TUBE_Y); g.stroke(); g.setLineDash([]);
      // Glass outline on top.
      g.lineJoin = 'round';
      g.strokeStyle = 'rgba(18,7,40,.6)'; g.lineWidth = 7; g.stroke(body);
      g.strokeStyle = C.glass; g.lineWidth = 3.6; g.stroke(body);
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(330, 94); g.quadraticCurveTo(450, 90, 640, 92); g.stroke();
      // Labels.
      const names = { Cu: 'copper cathode', Fe: 'iron cathode', Pt: 'platinum cathode' };
      Art.text(g, names[tube.metal], 130, 56, { size: 24, color: METAL_COLOR[tube.metal] === '#8D97A8' ? C.ink : METAL_COLOR[tube.metal] });
      Art.arrow(g, 112, 72, 104, 148, { color: C.dim, w: 3, head: 9 });
      Art.text(g, 'charged plates', 422, 46, { size: 24 });
      Art.text(g, 'glowing screen', 660, 366, { size: 24 });
      Art.arrow(g, 696, 348, 716, 312, { color: C.dim, w: 3, head: 9 });
      Art.text(g, 'electrons', 282, 168, { size: 23, color: C.cyan, halo: true });
      g.fillStyle = '#FFD23F'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
      Art.round(g, 146, 347, 40, 30, 6); g.fill(); g.stroke();
      Art.text(g, '−', 156, 361, { size: 22, color: '#1A0F2E' });
      Art.text(g, '+', 176, 361, { size: 20, color: '#1A0F2E' });
      Art.text(g, 'high voltage', 166, 394, { size: 22, color: C.dim });
      if (Math.abs(v) < 5) Art.text(g, 'No charge, so the beam runs straight', 470, 395, { size: 23, color: C.sun, align: 'left', maxW: 320 });
    },
  });
  const paintTube = () => {
    const d = Lab.$('#tube-dir');
    d.textContent = Math.abs(tube.v) < 5 ? 'Straight ahead' : tube.v > 0 ? 'Top plate (+)' : 'Bottom plate (+)';
  };
  Lab.bind('#tube-v', '#tube-v-out', (v) => (Math.abs(v) < 5 ? 'Off' : v > 0 ? `Top + ${v}%` : `Top − ${-v}%`), (v) => { tube.v = v; paintTube(); });
  Lab.segmented('#tube-metal', (v) => { tube.metal = v; });

  /* ---------- Story 2: the gold foil surprise ---------- */
  function apparatus(g, cx, cy, R, t, o = {}) {
    // Screen ring.
    g.save();
    g.strokeStyle = '#1E6B58'; g.lineWidth = 14; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();
    g.strokeStyle = 'rgba(125,255,176,.35)'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, R - 7, 0, TAU); g.stroke();
    g.restore();
    // Foil.
    const foilH = o.foilH || 96;
    const f = g.createLinearGradient(cx - 5, 0, cx + 5, 0);
    f.addColorStop(0, '#FFE79A'); f.addColorStop(1, '#D79A1E');
    g.fillStyle = f; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2;
    Art.round(g, cx - 5, cy - foilH / 2, 10, foilH, 3); g.fill(); g.stroke();
    void t;
  }
  Lab.story('#story-foil', {
    title: 'The experiment that should have been boring',
    scenes: [
      {
        say: "After the electron, Thomson needed somewhere to put them. He pictured a blob of positive charge with electrons stuck in it, like raisins in a pudding. People call this the <b>plum pudding model</b>.",
        dur: 3.6,
        draw(g, p, t, { W, H }) {
          const q = ease.back(seg(p, 0, 0.35));
          g.save(); g.translate(290, H / 2 + 8); g.scale(q, q); g.translate(-290, -H / 2 - 8);
          pudding(g, 290, H / 2 + 8, 175, t, { n: 16 });
          g.restore();
          Art.text(g, 'positive pudding', 290, 40, { size: 28, color: '#FFD3A8', alpha: seg(p, 0.35, 0.5) });
          Art.text(g, 'electrons stuck in it', 630, 96, { size: 26, color: C.cyan, alpha: seg(p, 0.5, 0.65) });
          Art.arrow(g, 548, 112, 410, 160, { color: C.cyan, w: 4, p: seg(p, 0.52, 0.68) });
          Art.bubble(g, 'Finally, a model I could eat.', 660, 262, { w: 230, side: 'down', size: 24, alpha: seg(p, 0.7, 0.85) });
          Art.moe(g, 660, H - 16, 170, 'happy', { t, flip: true });
          void W;
        },
      },
      {
        say: "To test it, Rutherford's team fired <b>alpha particles</b> at thin <b>gold foil</b>. Alphas come from radium. They are fast, heavy and positive. A <b>screen</b> around the foil flashes wherever one lands.",
        dur: 5,
        draw(g, p, t, { W, H }) {
          const cx = 510, cy = H / 2 + 6, R = 180;
          const a = ease.out(seg(p, 0, 0.18)), b = ease.out(seg(p, 0.2, 0.36)), c = ease.out(seg(p, 0.42, 0.58)), d = ease.out(seg(p, 0.64, 0.8));
          g.save(); g.globalAlpha *= d; apparatus(g, cx, cy, R, t, { foilH: 0.01 }); g.restore();
          if (c > 0) {
            g.save(); g.globalAlpha *= c;
            const f = g.createLinearGradient(cx - 5, 0, cx + 5, 0);
            f.addColorStop(0, '#FFE79A'); f.addColorStop(1, '#D79A1E');
            g.fillStyle = f; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2;
            Art.round(g, cx - 6, cy - 62, 12, 124, 3); g.fill(); g.stroke();
            g.restore();
          }
          // Lead box.
          g.save(); g.globalAlpha *= a;
          leadBox(g, 40, cy - 56, 150, 112);
          Art.glow(g, 104, cy, 34, C.sun, 0.9); Art.ball(g, 104, cy, 13, '#F4F27F');
          g.fillStyle = '#170C29'; g.fillRect(150, cy - 7, 42, 14);
          g.restore();
          Art.text(g, 'radium in', 112, cy - 94, { size: 25, alpha: a });
          Art.text(g, 'a lead box', 112, cy - 68 + 0, { size: 25, alpha: a });
          // Beam.
          if (b > 0) {
            const reach = lerp(190, c > 0 ? cx - 6 : 330, b);
            for (let i = 0; i < 7; i++) {
              const u = (t * 0.6 + i / 7) % 1;
              const x = lerp(192, reach, u);
              Art.ball(g, x, cy, 7, ALPHA);
            }
          }
          Art.text(g, 'alpha beam', 320, cy + 42, { size: 25, color: C.pink, alpha: b, halo: true });
          Art.text(g, 'gold foil', cx + 74, cy, { size: 25, color: GOLD, alpha: c, halo: true });
          Art.text(g, 'glowing screen', cx, 28, { size: 26, color: '#7DFFB0', alpha: d, halo: true });
          void W;
        },
      },
      {
        say: 'Pudding charge is spread thin. So everyone <b>expected</b> every heavy alpha to punch straight through, like a cannonball through tissue paper.',
        dur: 3.8,
        draw(g, p, t, { W, H }) {
          [78, 226, 374].forEach((y, i) => { g.globalAlpha = seg(p, 0, 0.2); pudding(g, 400, y + 4, 66, t, { n: 7 }); g.globalAlpha = 1; void i; });
          Art.text(g, 'What everyone predicted', 170, 34, { size: 26, color: C.sun, alpha: seg(p, 0.1, 0.25) });
          const go = seg(p, 0.15, 1);
          for (let i = 0; i < 11; i++) {
            const y0 = 36 + i * 38;
            const u = ((t * 0.42 + rand(i + 3)) % 1);
            const x = lerp(-10, W + 10, u);
            const wobble = Math.sin((x - 400) / 34) * (Math.abs(x - 400) < 100 ? 2.2 : 0);
            if (go <= 0) continue;
            g.strokeStyle = Art.alpha(ALPHA, 0.16); g.lineWidth = 2;
            g.beginPath(); g.moveTo(0, y0); g.lineTo(W, y0); g.stroke();
            Art.glow(g, x, y0 + wobble, 14, ALPHA, 0.5);
            Art.ball(g, x, y0 + wobble, 7, ALPHA);
          }
          Art.pill(g, 'All straight through', 640, H - 36, { size: 26, color: C.leaf, text: '#0D2B1A', alpha: seg(p, 0.6, 0.8) });
        },
      },
      {
        say: 'Instead, most went straight, some bent, and a very few <b>bounced back</b>. Rutherford said it was as if "you fired a 15-inch shell at a piece of tissue paper and it came back and hit you."',
        dur: 5.2,
        draw(g, p, t, { W, H }) {
          const cx = 370, cy = H / 2 + 4, R = 196;
          apparatus(g, cx, cy, R, t);
          leadBox(g, 18, cy - 28, 60, 56);
          g.strokeStyle = Art.alpha(ALPHA, 0.4); g.lineWidth = 3; g.beginPath(); g.moveTo(78, cy); g.lineTo(cx, cy); g.stroke();
          const tracks = [
            { ang: 0.015, at: 0.05 }, { ang: -0.02, at: 0.1 }, { ang: 0.01, at: 0.16 }, { ang: -0.05, at: 0.22 }, { ang: 0.05, at: 0.28 },
            { ang: 0.42, at: 0.42, big: 1 }, { ang: -0.7, at: 0.54, big: 1 }, { ang: 2.95, at: 0.7, big: 2 },
          ];
          tracks.forEach((k) => {
            const u = seg(p, k.at, k.at + 0.14);
            if (u <= 0) return;
            const ex = cx + Math.cos(k.ang) * (R - 8), ey = cy + Math.sin(k.ang) * (R - 8);
            g.strokeStyle = Art.alpha(k.big ? C.sun : ALPHA, k.big ? 0.9 : 0.5); g.lineWidth = k.big ? 3.5 : 2.5;
            g.beginPath(); g.moveTo(cx, cy); g.lineTo(lerp(cx, ex, u), lerp(cy, ey, u)); g.stroke();
            if (u < 1) Art.ball(g, lerp(cx, ex, u), lerp(cy, ey, u), 7, ALPHA);
            else {
              const pulse = 0.65 + 0.35 * Math.sin(t * 3 + k.ang * 9);
              Art.glow(g, ex, ey, k.big ? 44 : 26, '#7DFFB0', 0.9 * pulse);
              g.fillStyle = '#E9FFF2'; g.beginPath(); g.arc(ex, ey, k.big ? 7 : 4.5, 0, TAU); g.fill();
            }
          });
          Art.text(g, 'most go straight', cx + 196 + 8, cy + 40, { size: 24, color: C.ink, align: 'left', alpha: seg(p, 0.26, 0.38), halo: true });
          Art.text(g, 'one came back!', 136, 92, { size: 27, color: C.sun, alpha: seg(p, 0.84, 0.94), halo: true });
          Art.arrow(g, 136, 112, cx - 192 + 6, cy - 10, { color: C.sun, w: 4, p: seg(p, 0.86, 0.96), curve: 10 });
          Art.moe(g, 700, H - 16, 150, p > 0.8 ? 'wow' : 'think', { t, flip: true });
          void W;
        },
      },
      {
        say: 'Only one picture fits. All the positive charge and almost all the mass sit in a tiny center, the <b>nucleus</b>. Most alphas miss it by a mile. Close ones bend. A head-on one turns around.',
        dur: 5.4,
        draw(g, p, t, { W, H }) {
          const cx = 390, cy = H / 2 + 12, R = 188;
          nuclear(g, cx, cy, R, 15, t, { n: 7 });
          Art.text(g, 'nucleus', cx + 30, cy + 34, { size: 24, color: GOLD, align: 'left', halo: true, alpha: seg(p, 0, 0.15) });
          const tr = (b, a, label, lx, ly, col) => {
            const q = ease.linear(seg(p, a, a + 0.26));
            if (q <= 0) return;
            drawTrack(g, cx, cy, alphaPath(b, 22, -390, 760), q, col, { w: 4, alpha: 0.8 });
            Art.text(g, label, lx, ly, { size: 24, color: col, alpha: seg(p, a + 0.22, a + 0.3), halo: true, align: 'left' });
          };
          tr(-132, 0.08, 'far miss: straight', 440, 56, C.cyan);
          tr(34, 0.36, 'close: bends', 590, 300, C.sun);
          tr(1.2, 0.62, 'head on: comes back', 16, 194, ALPHA);
          Art.text(g, 'Nucleus drawn thousands of times too big', W / 2, H - 22, { size: 22, color: C.dim, alpha: seg(p, 0.8, 0.95) });
        },
      },
      {
        say: 'So each thing they saw tells you something. Learn these three lines. They are the classic <b>exam question</b> about this experiment.',
        dur: 4,
        draw(g, p, t, { W }) {
          const rows = [
            { y: 74, a: 'Most went straight', b: 'mostly empty space', icon: (x, y) => { g.strokeStyle = C.cyan; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 46, y); g.lineTo(x + 46, y); g.stroke(); Art.ball(g, x + 46, y, 8, ALPHA); } },
            { y: 214, a: 'A few bent', b: 'a positive center', icon: (x, y) => { g.strokeStyle = C.sun; g.lineWidth = 5; g.beginPath(); g.moveTo(x - 46, y + 18); g.quadraticCurveTo(x + 4, y + 18, x + 46, y - 24); g.stroke(); Art.ball(g, x + 46, y - 24, 8, ALPHA); } },
            { y: 354, a: 'Rare ones bounced', b: 'tiny, heavy center', icon: (x, y) => { g.strokeStyle = ALPHA; g.lineWidth = 5; g.beginPath(); g.moveTo(x - 46, y - 10); g.quadraticCurveTo(x + 62, y - 10, x + 2, y + 2); g.quadraticCurveTo(x - 20, y + 10, x - 46, y + 12); g.stroke(); Art.ball(g, x - 46, y + 12, 8, ALPHA); } },
          ];
          rows.forEach((r, i) => {
            const q = ease.out(seg(p, 0.05 + i * 0.28, 0.24 + i * 0.28));
            if (q <= 0) return;
            g.save(); g.globalAlpha *= q; g.translate((1 - q) * -20, 0);
            g.fillStyle = C.plum2; Art.round(g, 26, r.y - 56, W - 52, 112, 24); g.fill();
            r.icon(100, r.y);
            Art.text(g, r.a, 170, r.y, { size: 28, align: 'left', font: 'display' });
            Art.arrow(g, 442, r.y, 482, r.y, { color: C.dim, w: 5 });
            Art.text(g, r.b, 500, r.y, { size: 28, align: 'left', color: C.sun, font: 'display' });
            g.restore();
          });
          void t;
        },
      },
    ],
  });

  /* ---------- Bench: gold foil simulator ---------- */
  const FOIL = { cx: 292, cy: 268, ring: 232, beam: 190, atomR: 46, atomYs: [-110, 0, 110] };
  const METALS = { Au: { Z: 79, name: 'gold', color: GOLD }, Ag: { Z: 47, name: 'silver', color: Art.elementColor('Ag') }, Al: { Z: 13, name: 'aluminum', color: Art.elementColor('Al') } };
  const foil = {
    model: 'pudding', metal: 'Au', speed: 1, auto: true, aim: 0, shots: [], hits: [], ghosts: [], counts: [0, 0, 0], acc: 0, bounceT: -99, t: 0, showAim: 0,
  };
  const V0 = 470, LAM = 3, A_PER_Z = 28200;
  function fireAlpha(y, aimed) {
    if (foil.shots.length > 90) return;
    foil.shots.push({ x: 62, y: FOIL.cy + y, vx: V0 * foil.speed, vy: 0, trail: [], path: [], aimed });
  }
  function stepFoil(dt) {
    const h = 1 / 700;
    const steps = Math.max(1, Math.round(dt / h));
    const Z = METALS[foil.metal].Z;
    const A = A_PER_Z * Z;
    const nuclei = FOIL.atomYs.map((yy) => [FOIL.cx, FOIL.cy + yy]);
    for (let k = foil.shots.length - 1; k >= 0; k--) {
      const s = foil.shots[k];
      let gone = false;
      for (let i = 0; i < steps && !gone; i++) {
        for (const [nx, ny] of nuclei) {
          const dx = s.x - nx, dy = s.y - ny;
          const r = Math.max(0.7, Math.hypot(dx, dy));
          if (foil.model === 'nuclear') {
            if (r < 60) {
              const F = A * Math.exp(-r / LAM) * (1 / (r * r) + 1 / (r * LAM));
              s.vx += (F * dx / r) * h; s.vy += (F * dy / r) * h;
            }
          } else if (r < FOIL.atomR) {
            // Thomson's spread-out charge: a gentle push that barely matters.
            const F = (Z * 2.2 * r) / FOIL.atomR;
            s.vx += (F * dx / r) * h; s.vy += (F * dy / r) * h;
          }
        }
        s.x += s.vx * h; s.y += s.vy * h;
        const rx = s.x - FOIL.cx, ry = s.y - FOIL.cy;
        if (rx * rx + ry * ry > FOIL.ring * FOIL.ring && rx * s.vx + ry * s.vy > 0) {
          gone = true;
          const defl = Math.abs(Math.atan2(s.vy, s.vx)) * 180 / Math.PI;
          const cls = defl < 10 ? 0 : defl < 90 ? 1 : 2;
          foil.counts[cls]++;
          foil.hits.push({ a: Math.atan2(ry, rx), born: foil.t, cls });
          if (foil.hits.length > 420) foil.hits.shift();
          if (defl > 22) { foil.ghosts.push({ pts: s.path.slice(), born: foil.t, cls }); if (foil.ghosts.length > 12) foil.ghosts.shift(); }
          if (cls === 2) {
            foil.bounceT = foil.t;
            Lab.sound.pop();
            if (s.aimed && defl > 150 && !Lab.store.get('atoms:bounce', false)) {
              Lab.store.set('atoms:bounce', true);
              Lab.collection.award(1); Lab.confetti(70);
              Lab.toast('You bounced one straight back. That is the shot that changed chemistry.');
            }
          }
          foil.shots.splice(k, 1);
        }
      }
      if (!gone) {
        s.trail.push([s.x, s.y]); if (s.trail.length > 16) s.trail.shift();
        s.path.push([s.x, s.y]);
      }
    }
  }
  const foilStage = Lab.stage('#c-foil', {
    h: 540,
    bg: (g, W, H) => {
      const r = g.createRadialGradient(FOIL.cx, FOIL.cy, 40, FOIL.cx, FOIL.cy, 620);
      r.addColorStop(0, '#2D1C52'); r.addColorStop(0.7, '#1C1033'); r.addColorStop(1, '#120826');
      g.fillStyle = r; g.fillRect(0, 0, W, H);
    },
    label: 'A gun fires alpha particles at a column of gold atoms inside a ring-shaped screen. Each landing shows as a flash, and three counters tally straight, bent and bounced shots.',
    onPointer(e) {
      if (e.type === 'hover') { foilStage.canvas.style.cursor = e.x < 540 ? 'crosshair' : 'default'; return; }
      if (e.type !== 'down' || e.x > 540) return;
      const y = clamp(e.y - FOIL.cy, -FOIL.beam, FOIL.beam);
      foil.aim = Math.round(y);
      const inp = Lab.$('#foil-aim'); inp.value = foil.aim; inp.dispatchEvent(new Event('input'));
      fireAlpha(foil.aim, true);
    },
    draw(g, t, dt) {
      foil.t = t;
      if (foil.auto) {
        foil.acc += dt * 11;
        while (foil.acc > 1) { foil.acc -= 1; fireAlpha((Math.random() * 2 - 1) * FOIL.beam, false); }
      }
      stepFoil(dt);
      const { cx, cy, ring } = FOIL;
      // Ring screen.
      g.strokeStyle = '#17463B'; g.lineWidth = 16; g.beginPath(); g.arc(cx, cy, ring, 0, TAU); g.stroke();
      g.strokeStyle = 'rgba(125,255,176,.28)'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, ring - 8, 0, TAU); g.stroke();
      foil.hits.forEach((h) => {
        const age = t - h.born;
        const x = cx + Math.cos(h.a) * ring, y = cy + Math.sin(h.a) * ring;
        const fade = clamp(1 - age / 14);
        if (fade <= 0) return;
        if (age < 0.5) Art.glow(g, x, y, h.cls ? 46 : 26, '#7DFFB0', (1 - age / 0.5) * (h.cls ? 1 : 0.7));
        g.fillStyle = h.cls === 2 ? `rgba(255,214,84,${fade})` : h.cls === 1 ? `rgba(160,255,200,${fade})` : `rgba(160,255,200,${fade * 0.55})`;
        g.beginPath(); g.arc(x, y, h.cls ? 5 : 3, 0, TAU); g.fill();
      });
      // Atoms in the foil.
      const Z = METALS[foil.metal].Z;
      const nr = 2 + 2.6 * Math.cbrt(Z / 79);
      FOIL.atomYs.forEach((yy, i) => {
        if (foil.model === 'nuclear') nuclear(g, cx, cy + yy, FOIL.atomR, nr, t, { color: METALS[foil.metal].color, seed: i * 2, n: 4 });
        else pudding(g, cx, cy + yy, FOIL.atomR, t, { n: 7 });
      });
      // Ghost tracks for the dramatic ones.
      foil.ghosts.forEach((gh) => {
        const a = clamp(1 - (t - gh.born) / 7);
        if (a <= 0 || !gh.pts.length) return;
        g.strokeStyle = gh.cls === 2 ? Art.alpha(C.sun, a) : Art.alpha(ALPHA, a * 0.8); g.lineWidth = gh.cls === 2 ? 3.5 : 2.5; g.lineJoin = 'round';
        g.beginPath(); g.moveTo(gh.pts[0][0], gh.pts[0][1]);
        for (let i = 1; i < gh.pts.length; i++) g.lineTo(gh.pts[i][0], gh.pts[i][1]);
        g.stroke();
      });
      // Live shots.
      foil.shots.forEach((s) => {
        if (s.trail.length > 1) {
          g.strokeStyle = Art.alpha(ALPHA, 0.45); g.lineWidth = 3; g.lineCap = 'round';
          g.beginPath(); g.moveTo(s.trail[0][0], s.trail[0][1]);
          for (let i = 1; i < s.trail.length; i++) g.lineTo(s.trail[i][0], s.trail[i][1]);
          g.stroke();
        }
        Art.ball(g, s.x, s.y, 6, ALPHA);
      });
      // Gun.
      leadBox(g, 8, cy - FOIL.beam - 18, 52, FOIL.beam * 2 + 36);
      g.fillStyle = '#170C29'; g.fillRect(52, cy - FOIL.beam, 8, FOIL.beam * 2);
      const aimY = cy + foil.aim;
      g.fillStyle = C.sun;
      g.beginPath(); g.moveTo(56, aimY); g.lineTo(38, aimY - 10); g.lineTo(38, aimY + 10); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,210,63,.4)'; g.lineWidth = 2; g.setLineDash([6, 8]);
      g.beginPath(); g.moveTo(58, aimY); g.lineTo(cx - 6, aimY); g.stroke(); g.setLineDash([]);
      Art.text(g, 'alpha gun', 62, 28, { size: 22, color: C.dim });
      // Foil name.
      Art.text(g, `${METALS[foil.metal].name} foil`, cx, 28, { size: 24, color: METALS[foil.metal].color, halo: true });
      // Counters.
      const total = foil.counts[0] + foil.counts[1] + foil.counts[2];
      const rows = [
        { label: 'Almost straight', sub: 'under 10°', color: '#7DFFB0' },
        { label: 'Bent', sub: '10° to 90°', color: C.pink },
        { label: 'Bounced back', sub: 'over 90°', color: C.sun },
      ];
      const px = 556, pw = 232;
      Art.text(g, `${total} shots`, px, 36, { font: 'display', size: 34, align: 'left' });
      rows.forEach((r, i) => {
        const y = 78 + i * 90, n = foil.counts[i];
        const f = total ? n / total : 0;
        Art.text(g, r.label, px, y, { size: 23, align: 'left' });
        Art.meter(g, px, y + 18, pw, 18, Math.max(f, 0), { color: r.color });
        Art.text(g, String(n), px, y + 56, { font: 'display', size: 28, color: r.color, align: 'left' });
        Art.text(g, total ? `${(f * 100).toFixed(f < 0.1 && f > 0 ? 1 : 0)}%` : '0%', px + pw, y + 56, { size: 24, align: 'right', color: C.dim });
      });
      const bounced = t - foil.bounceT < 2.4;
      if (bounced) Art.bubble(g, 'It came back!', 640, 408, { w: 180, side: 'down', size: 23 });
      Art.moe(g, 640, 534, 118, bounced ? 'wow' : foil.model === 'pudding' ? 'think' : 'happy', { t });
      Art.text(g, foil.model === 'pudding' ? 'plum pudding atoms' : 'nuclear atoms', cx, 522, { size: 24, color: foil.model === 'pudding' ? '#FFD3A8' : C.cyan, halo: true });
    },
  });
  Lab.segmented('#foil-model', (v) => { foil.model = v; foil.shots.length = 0; clearFoil(); });
  Lab.segmented('#foil-metal', (v) => { foil.metal = v; clearFoil(); });
  function clearFoil() { foil.hits.length = 0; foil.ghosts.length = 0; foil.counts = [0, 0, 0]; foil.bounceT = -99; }
  Lab.bind('#foil-speed', '#foil-speed-out', (v) => `${v}%`, (v) => { foil.speed = v / 100; });
  Lab.bind('#foil-aim', '#foil-aim-out', (v) => (v === 0 ? 'Dead center' : v > 0 ? `${v} below` : `${-v} above`), (v) => { foil.aim = v; });
  Lab.$('#foil-one').addEventListener('click', () => fireAlpha(foil.aim, true));
  Lab.$('#foil-many').addEventListener('click', () => { for (let i = 0; i < 20; i++) fireAlpha((Math.random() * 2 - 1) * FOIL.beam, false); });
  Lab.$('#foil-clear').addEventListener('click', clearFoil);
  const autoBtn = Lab.$('#foil-auto');
  autoBtn.addEventListener('click', () => {
    foil.auto = !foil.auto;
    autoBtn.textContent = foil.auto ? 'Stop firing' : 'Keep firing';
    autoBtn.setAttribute('aria-pressed', String(foil.auto));
  });
  // Handy for screenshots and for reduced-motion users: run the sim forward without waiting.
  foilStage.data.foil = foil;
  foilStage.data.sim = (n) => { for (let i = 0; i < n; i++) { fireAlpha((Math.random() * 2 - 1) * FOIL.beam, false); for (let k = 0; k < 90 && foil.shots.length; k++) stepFoil(0.033); } };
  foilStage.data.run = (secs) => { const n = Math.round(secs / 0.033); for (let i = 0; i < n; i++) foilStage.advance(0.033); };

  /* ---------- Bench: zoom to scale ---------- */
  const zb = { mode: 'atom', v: 0, shown: 0, fly: false };
  const ZMAX = 15000;
  const R0 = 188;              // Atom radius in stage units at zoom 1.
  const toZ = (v) => Math.pow(ZMAX, v / 100);
  const PM_PER_UNIT = 288 / (2 * R0), M_PER_UNIT = 300 / (2 * R0);
  const NUC_R = (7e-3 / PM_PER_UNIT);  // Nucleus radius in stage units at zoom 1: 7 fm is 0.007 pm.
  const MARBLE_R = (0.0075 / M_PER_UNIT);
  const nucleons = (() => {
    // Packed into a sphere: 79 protons and 118 neutrons, drawn back to front.
    const N = 197, pts = [];
    for (let i = 0; i < N; i++) {
      const y = 1 - (2 * (i + 0.5)) / N;
      const rr = Math.sqrt(1 - y * y), th = i * 2.39996;
      const rad = Math.cbrt(rand(i * 1.3 + 4)) * 0.84 + 0.08;
      pts.push({ x: Math.cos(th) * rr * rad, y: y * rad, z: Math.sin(th) * rr * rad, p: rand(i * 7.7 + 1) < 79 / 197 });
    }
    return pts.sort((a, b) => a.z - b.z);
  })();
  const electrons = Array.from({ length: 79 }, (_, i) => {
    const a = rand(i * 3.1 + 2) * TAU, d = Math.pow(rand(i * 1.9 + 5), 0.62) * R0;
    return { a, d, sp: 0.12 + rand(i + 9) * 0.3 };
  });
  function niceBar(unitsPerBase, ladder) {
    // ladder: [[value in base units, 'label']], returns the rung whose bar is 90 to 260 units long.
    for (const [val, label] of ladder) { const len = val * unitsPerBase; if (len >= 90 && len <= 300) return { len, label }; }
    return null;
  }
  const PM_LADDER = [[500, '500 pm'], [200, '200 pm'], [100, '100 pm'], [50, '50 pm'], [20, '20 pm'], [10, '10 pm'], [5, '5 pm'], [2, '2 pm'], [1, '1 pm'], [0.5, '500 fm'], [0.2, '200 fm'], [0.1, '100 fm'], [0.05, '50 fm'], [0.02, '20 fm'], [0.01, '10 fm'], [0.005, '5 fm'], [0.002, '2 fm'], [0.001, '1 fm']];
  const M_LADDER = [[500, '500 m'], [200, '200 m'], [100, '100 m'], [50, '50 m'], [20, '20 m'], [10, '10 m'], [5, '5 m'], [2, '2 m'], [1, '1 m'], [0.5, '50 cm'], [0.2, '20 cm'], [0.1, '10 cm'], [0.05, '5 cm'], [0.02, '2 cm'], [0.01, '1 cm'], [0.005, '5 mm'], [0.002, '2 mm']];
  function viewLabel(z) {
    if (zb.mode === 'atom') {
      const pm = (800 / z) * PM_PER_UNIT;
      return pm >= 1 ? `${Lab.sig(pm, 3)} pm` : `${Lab.sig(pm * 1000, 3)} fm`;
    }
    const m = (800 / z) * M_PER_UNIT;
    return m >= 1 ? `${Lab.sig(m, 3)} m` : m >= 0.01 ? `${Lab.sig(m * 100, 3)} cm` : `${Lab.sig(m * 1000, 3)} mm`;
  }
  function drawNucleus(g, x, y, r, t) {
    if (r < 3) { g.fillStyle = GOLD; g.beginPath(); g.arc(x, y, Math.max(0.6, r), 0, TAU); g.fill(); return; }
    if (r < 18) { Art.glow(g, x, y, r * 2.4, GOLD, 0.5); Art.ball(g, x, y, r, GOLD); return; }
    Art.glow(g, x, y, r * 1.5, GOLD, 0.4);
    const br = r * 0.2;
    nucleons.forEach((n, i) => {
      const jx = wander(i, t * 0.9) * br * 0.05, jy = wander(i + 3, t * 0.9) * br * 0.05;
      Art.ball(g, x + n.x * r + jx, y + n.y * r + jy, br, n.p ? C.proton : C.neutron);
    });
  }
  function drawStadium(g, cx, cy, z, t) {
    const S = z;
    const inView = (r) => r * S > 1;
    // Bowl and stands.
    if (S < 60) {
      g.fillStyle = '#3A3A52'; g.beginPath(); g.arc(cx, cy, R0 * S, 0, TAU); g.fill();
      const rings = 7;
      for (let i = 0; i < rings; i++) {
        const r = R0 * S * (1 - (i + 0.4) / (rings + 3.2));
        g.strokeStyle = i % 2 ? '#C0395E' : '#E0C04A'; g.lineWidth = R0 * S * 0.042;
        g.setLineDash([R0 * S * 0.022, R0 * S * 0.012]);
        g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke();
      }
      g.setLineDash([]);
      g.strokeStyle = '#1A0F2E'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, R0 * S, 0, TAU); g.stroke();
      // Running track.
      g.fillStyle = '#C8553D'; g.beginPath(); g.ellipse(cx, cy, 100 * S, 74 * S, 0, 0, TAU); g.fill();
    }
    // The pitch: stripes in stage-space, clipped to the visible window.
    const pw = 72 * S, ph = 46 * S;   // About 114 m by 73 m.
    g.save();
    g.beginPath(); g.rect(Math.max(0, cx - pw), Math.max(0, cy - ph), Math.min(800, cx + pw) - Math.max(0, cx - pw), Math.min(470, cy + ph) - Math.max(0, cy - ph)); g.clip();
    g.fillStyle = '#2E8B4A'; g.fillRect(0, 0, 800, 470);
    const sw = (6 / M_PER_UNIT) * S;
    if (sw > 2) {
      const i0 = Math.floor((0 - cx) / sw), i1 = Math.ceil((800 - cx) / sw);
      for (let i = i0; i <= i1; i++) {
        if ((i + 4000) % 2) { g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(cx + i * sw, 0, sw, 470); }
      }
    }
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = clamp(0.1 / M_PER_UNIT * S, 1.5, 22);
    if (S < 200) { g.strokeRect(cx - pw, cy - ph, pw * 2, ph * 2); g.beginPath(); g.moveTo(cx, cy - ph); g.lineTo(cx, cy + ph); g.stroke(); }
    const circ = (9.15 / M_PER_UNIT) * S;
    if (circ < 2200) { g.beginPath(); g.arc(cx, cy, circ, 0, TAU); g.stroke(); }
    // Grass blades at close range.
    if (S > 3500) {
      const cell = 0.009 * S, a = seg(S, 3500, 6000);
      const x0 = Math.floor((0 - cx) / cell), x1 = Math.ceil((800 - cx) / cell);
      const y0 = Math.floor((0 - cy) / cell), y1 = Math.ceil((470 - cy) / cell);
      g.lineCap = 'round'; g.lineWidth = cell * 0.2;
      for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
        const hx = rand(i * 12.9 + j * 78.2), hy = rand(i * 37.1 + j * 11.7);
        const bx = cx + (i + hx) * cell, by = cy + (j + hy) * cell;
        g.strokeStyle = Art.alpha(hx > 0.5 ? '#3DAA5C' : '#247A3D', a);
        g.beginPath(); g.moveTo(bx, by + cell * 0.45); g.quadraticCurveTo(bx + cell * 0.1, by, bx + (hy - 0.5) * cell * 0.7, by - cell * 0.5); g.stroke();
      }
    }
    // Moe for scale, two and a half meters from the middle.
    const moeH = (1 / M_PER_UNIT) * S;
    const mx = cx - (2.6 / M_PER_UNIT) * S;
    if (moeH > 30 && moeH < 900 && mx > -moeH) {
      Art.moe(g, mx, cy + moeH * 0.45, moeH, 'think', { t, bob: false });
      if (moeH < 340) Art.text(g, 'Moe, for scale', mx, cy + moeH * 0.45 + 22, { size: 22, halo: true });
    }
    // The marble.
    const mr = MARBLE_R * S;
    if (mr < 3) { g.fillStyle = '#BDF3FF'; g.beginPath(); g.arc(cx, cy, Math.max(0.8, mr), 0, TAU); g.fill(); }
    else {
      g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(cx + mr * 0.14, cy + mr * 0.94, mr * 0.9, mr * 0.26, 0, 0, TAU); g.fill();
      Art.ball(g, cx, cy, mr, '#39C6E8');
      g.save(); g.beginPath(); g.arc(cx, cy, mr * 0.96, 0, TAU); g.clip();
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = mr * 0.12; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx - mr * 0.7, cy + mr * 0.2); g.bezierCurveTo(cx - mr * 0.2, cy - mr * 0.5, cx + mr * 0.2, cy + mr * 0.7, cx + mr * 0.8, cy - mr * 0.1); g.stroke();
      g.strokeStyle = 'rgba(255,79,163,.7)';
      g.beginPath(); g.moveTo(cx - mr * 0.5, cy + mr * 0.7); g.bezierCurveTo(cx - mr * 0.1, cy + mr * 0.2, cx + mr * 0.3, cy + mr * 0.9, cx + mr * 0.7, cy + mr * 0.45); g.stroke();
      g.restore();
    }
    void inView;
  }
  const zoomStage = Lab.stage('#c-zoom', {
    h: 470,
    bg: (g, W, H) => { g.fillStyle = '#120826'; g.fillRect(0, 0, W, H); },
    label: 'A true-to-scale zoom from a whole atom, through empty space, down to its nucleus, with an optional stadium comparison.',
    draw(g, t, dt) {
      if (zb.fly) {
        zb.v = Math.min(100, zb.v + dt * 11);
        const inp = Lab.$('#zoom-z'); inp.value = zb.v; Lab.paintRange(inp);
        paintZoom();
        if (zb.v >= 100) zb.fly = false;
      }
      zb.shown = lerp(zb.shown, zb.v, clamp(dt * 6));
      const Z = toZ(zb.shown);
      const cx = 400, cy = 235;
      if (zb.mode === 'atom') {
        // Space, then the electron cloud.
        const rr = R0 * Z;
        if (rr < 5000) {
          const gr = g.createRadialGradient(cx, cy, 0, cx, cy, rr);
          gr.addColorStop(0, Art.alpha(C.cyan, 0.22)); gr.addColorStop(0.7, Art.alpha(C.cyan, 0.14)); gr.addColorStop(1, Art.alpha(C.cyan, 0));
          g.fillStyle = gr; g.fillRect(0, 0, 800, 470);
        } else { g.fillStyle = Art.alpha(C.cyan, 0.2); g.fillRect(0, 0, 800, 470); }
        electrons.forEach((e, i) => {
          const a = e.a + t * e.sp;
          const x = cx + Math.cos(a) * e.d * Z, y = cy + Math.sin(a) * e.d * Z * (0.9 + rand(i) * 0.1);
          if (x < -40 || x > 840 || y < -40 || y > 510) return;
          const pr = Math.min(9, 3 + Math.log10(Z) * 2);
          Art.electron(g, x + wander(i, t) * 2, y + wander(i + 4, t) * 2, pr);
        });
        const nr = NUC_R * Z;
        drawNucleus(g, cx, cy, nr, t);
      } else drawStadium(g, cx, cy, Z, t);

      const big = zb.mode === 'atom' ? NUC_R * Z : MARBLE_R * Z;
      // Marker for something too small to see.
      if (big < 6) {
        const a = clamp((6 - big) / 3);
        const rr = 19 + Math.sin(t * 3) * 2;
        g.save(); g.globalAlpha *= a;
        Art.ring(g, cx, cy, rr, { color: C.sun, w: 4, dash: [7, 6] });
        Art.arrow(g, cx + 118, cy - 82, cx + rr + 8, cy - rr * 0.6, { color: C.sun, w: 4 });
        Art.text(g, zb.mode === 'atom' ? 'the nucleus is in here' : 'the marble is in here', cx + 170, cy - 134, { size: 25, color: C.sun, halo: true });
        Art.text(g, 'too small to draw', cx + 170, cy - 104, { size: 22, color: C.ink, halo: true });
        g.restore();
      }
      // Story text that changes as you dive.
      let msg = '';
      if (zb.mode === 'atom') {
        msg = Z < 2.5 ? 'A gold atom: a cloud of electrons' : Z < 900 ? 'Keep going. Mostly nothing here' : big < 30 ? 'Is that it?' : 'The nucleus: 79 protons, 118 neutrons';
      } else {
        msg = Z < 2.5 ? 'The atom as a stadium' : Z < 40 ? 'The pitch is still mostly empty' : Z < 900 ? 'Where is the marble?' : 'The whole nucleus: one marble';
      }
      Art.text(g, msg, cx, 36, { font: 'display', size: 34, halo: true, color: big > 30 ? C.sun : C.ink });
      // Scale bar.
      const bar = zb.mode === 'atom' ? niceBar(Z / PM_PER_UNIT, PM_LADDER) : niceBar(Z / M_PER_UNIT, M_LADDER);
      if (bar) {
        const bx = 34, by = 438;
        g.fillStyle = '#fff'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2;
        g.beginPath(); g.rect(bx, by, bar.len, 7); g.fill(); g.stroke();
        Art.text(g, bar.label, bx + bar.len / 2, by - 18, { size: 22, halo: true });
      }
    },
  });
  function paintZoom() {
    const Z = toZ(zb.v);
    Lab.$('#zoom-z-out').textContent = `× ${Z < 100 ? Z.toFixed(1) : Lab.fmt(Math.round(Z / 10) * 10, 0)}`;
    Lab.$('#zoom-view').textContent = viewLabel(Z);
  }
  Lab.bind('#zoom-z', null, null, (v) => { zb.v = v; zb.fly = false; paintZoom(); });
  Lab.segmented('#zoom-mode', (v) => { zb.mode = v; paintZoom(); });
  Lab.$('#zoom-fly').addEventListener('click', () => { if (zb.v >= 99) zb.v = 0, zb.shown = 0; zb.fly = true; });
  paintZoom();

  /* ---------- Bench: the balance ---------- */
  const bal = { left: 'p', n: 200, tilt: -1, won: false };
  const MASS = { p: 1.00728, n: 1.00866, e: 0.000549 };
  const BAL_EQ = { p: 1836, n: 1839 };
  function balanceRig(g, x, y, armW, tilt, strings, drawL, drawR) {
    const ang = clamp(tilt, -1, 1) * 0.14;
    const col = '#E4DEF4';
    g.save();
    g.lineCap = 'round'; g.fillStyle = col; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
    const baseY = y;
    g.beginPath(); g.moveTo(x - 90, baseY); g.quadraticCurveTo(x, baseY - 18, x + 90, baseY); g.closePath(); g.fill(); g.stroke();
    const beamY = 66;
    g.strokeStyle = '#1A0F2E'; g.lineWidth = 13; g.beginPath(); g.moveTo(x, baseY - 8); g.lineTo(x, beamY); g.stroke();
    g.strokeStyle = col; g.lineWidth = 9; g.beginPath(); g.moveTo(x, baseY - 8); g.lineTo(x, beamY); g.stroke();
    const dx = Math.cos(ang) * armW, dy = Math.sin(ang) * armW;
    const L = [x - dx, beamY - dy], R = [x + dx, beamY + dy];
    g.strokeStyle = '#1A0F2E'; g.lineWidth = 12; g.beginPath(); g.moveTo(L[0], L[1]); g.lineTo(R[0], R[1]); g.stroke();
    g.strokeStyle = col; g.lineWidth = 8; g.beginPath(); g.moveTo(L[0], L[1]); g.lineTo(R[0], R[1]); g.stroke();
    g.fillStyle = C.pink; g.beginPath(); g.arc(x, beamY, 11, 0, TAU); g.fill();
    const pan = (P, draw) => {
      const py = P[1] + strings, pw = 104;
      g.strokeStyle = 'rgba(228,222,244,.75)'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(P[0], P[1]); g.lineTo(P[0] - pw, py); g.moveTo(P[0], P[1]); g.lineTo(P[0] + pw, py); g.stroke();
      if (draw) draw(P[0], py);
      g.fillStyle = col; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(P[0] - pw - 8, py); g.quadraticCurveTo(P[0], py + 24, P[0] + pw + 8, py); g.closePath(); g.fill(); g.stroke();
    };
    pan(L, drawL); pan(R, drawR);
    g.restore();
  }
  const EACH_DOT = 25;
  Lab.stage('#c-balance', {
    h: 440, bg: 'lab',
    label: 'A balance with one proton or neutron on the left pan and a pile of electrons on the right pan.',
    draw(g, t, dt) {
      const L = MASS[bal.left], R = bal.n * MASS.e;
      const target = clamp(((R - L) / L) * 2.6, -1, 1);
      bal.tilt = lerp(bal.tilt, target, clamp(dt * 3.6));
      const level = bal.n === BAL_EQ[bal.left];
      balanceRig(g, 400, 370, 232, bal.tilt, 186, (x, y) => {
        Art.atom(g, x, y - 44, 42, bal.left, { color: bal.left === 'p' ? C.proton : C.neutron, label: bal.left === 'p' ? 'p+' : 'n', face: level ? 'grin' : 'grumpy', t, look: [1, 0], labelColor: bal.left === 'p' ? '#fff' : '#22123A' });
      }, (x, y) => {
        // Pile of electrons: one dot stands for 25.
        const dots = Math.max(1, Math.round(bal.n / EACH_DOT));
        const rowsMax = 16;
        let drawn = 0, row = 0;
        for (let width = rowsMax; drawn < dots && row < 13; width--, row++) {
          for (let i = 0; i < width && drawn < dots; i++, drawn++) {
            const px = x + (i - (width - 1) / 2) * 12.6;
            const py = y - 8 - row * 11;
            g.fillStyle = C.electron; g.strokeStyle = '#06324A'; g.lineWidth = 1.2;
            g.beginPath(); g.arc(px + wander(drawn, t) * 0.8, py, 5.6, 0, TAU); g.fill(); g.stroke();
          }
        }
      });
      Art.text(g, bal.left === 'p' ? 'one proton' : 'one neutron', 150, 404, { size: 28, font: 'display', color: bal.left === 'p' ? '#FFB3BC' : C.ink, halo: true });
      Art.text(g, `${bal.n.toLocaleString('en-US')} electrons`, 650, 392, { size: 28, font: 'display', color: C.cyan, halo: true });
      Art.text(g, 'each dot is 25 electrons', 650, 424, { size: 21, color: C.ink, halo: true });
      if (level) {
        Art.pill(g, `Level at about ${BAL_EQ[bal.left].toLocaleString('en-US')} electrons`, 400, 26, { size: 25, color: C.leaf, text: '#0D2B1A', font: 'display' });
        Art.moe(g, 278, 372, 92, 'cheer', { t, bob: false });
      }
    },
  });
  function paintBal() {
    Lab.$('#bal-l').textContent = `${MASS[bal.left].toFixed(4)} u`;
    Lab.$('#bal-r').textContent = `${(bal.n * MASS.e).toFixed(4)} u`;
    if (bal.n === BAL_EQ[bal.left] && !bal.won) {
      bal.won = true;
      if (!Lab.store.get('atoms:balance', false)) { Lab.store.set('atoms:balance', true); Lab.collection.award(1); }
      Lab.sound.good();
    }
  }
  const balInp = Lab.$('#bal-n');
  Lab.bind(balInp, '#bal-n-out', (v) => v.toLocaleString('en-US'), (v) => {
    // Snap to the level point so it can be found on a phone slider.
    const eq = BAL_EQ[bal.left];
    if (Math.abs(v - eq) <= 14) { v = eq; balInp.value = v; Lab.paintRange(balInp); Lab.$('#bal-n-out').textContent = v.toLocaleString('en-US'); }
    bal.n = v; paintBal();
  });
  Lab.segmented('#bal-left', (v) => { bal.left = v; bal.won = false; balInp.dispatchEvent(new Event('input')); paintBal(); });
  paintBal();
});
