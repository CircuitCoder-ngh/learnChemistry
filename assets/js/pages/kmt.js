/* Lesson 9.3: Kinetic theory and real gases. Story gas is pure in t; every bench is a real sim or a real formula. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, rand, wander } = Lab;
  const C = Art.C;
  const TAU = Math.PI * 2;
  const R_J = 8.314, R_ATM = 0.08206;

  /* ---------- Shared drawing helpers ---------- */
  const steady = (t, v, w, h) => ({ phx: (t * v) / w, phy: (t * v) / h, ratex: v / w, ratey: v / h });
  function spark(g, x, y, age, s = 1) {
    const a = 1 - age;
    g.save(); g.globalAlpha *= a;
    g.fillStyle = C.sun; Art.star(g, x, y, 15 * s * (0.5 + 0.5 * a), age * 2);
    g.fillStyle = '#fff'; Art.star(g, x, y, 7 * s * (0.5 + 0.5 * a), age * 2 + 0.4);
    g.restore();
  }
  const particle = (g, f, x, y, bond, rot, o = {}) => {
    if (Art.moleculeData(f)) Art.molecule(g, x, y, bond, f, Object.assign({ rot, style: 'fill', atomScale: 1.28, labels: false }, o));
    else Art.atom(g, x, y, bond * 0.82, f, Object.assign({ label: false }, o));
  };
  /** Position of bouncing particle i inside a box at a moment, as a pure function. */
  function gasAt(i, m, box, seed, r) {
    const w = Math.max(1, box.x1 - box.x0 - 2 * r), h = Math.max(1, box.y1 - box.y0 - 2 * r);
    const kx = 0.6 + rand(seed + i * 1.31) * 0.8, ky = 0.6 + rand(seed + i * 2.17) * 0.8;
    const u = rand(seed + i * 3.7) * 2 + m.phx * kx, v = rand(seed + i * 5.9) * 2 + m.phy * ky;
    const mu = ((u % 2) + 2) % 2, mv = ((v % 2) + 2) % 2;
    return { x: box.x0 + r + w * (mu < 1 ? mu : 2 - mu), y: box.y0 + r + h * (mv < 1 ? mv : 2 - mv), mu, mv, kx, ky };
  }
  function gasField(g, box, n, m, o = {}) {
    const seed = o.seed || 1, r = o.r || 15, bond = o.bond || 13;
    for (let i = 0; i < n; i++) {
      const q = gasAt(i, m, box, seed, r);
      if (o.sparks) {
        const ax = (q.mu % 1) / (m.ratex * q.kx), ay = (q.mv % 1) / (m.ratey * q.ky), fl = 0.17;
        if (ax < fl) spark(g, q.mu < 1 ? box.x0 : box.x1, q.y, ax / fl);
        if (ay < fl) spark(g, q.x, q.mv < 1 ? box.y0 : box.y1, ay / fl);
      }
      const f = typeof o.formula === 'function' ? o.formula(i) : (o.formula || 'N2');
      particle(g, f, q.x, q.y, bond, rand(seed + i) * 6.28 + (m.phx + m.phy) * 0.9 * (0.5 + rand(i)));
    }
  }
  function axes(g, b, o) {
    const X = (v) => b.x + ((v - o.xmin) / (o.xmax - o.xmin)) * b.w;
    const Y = (v) => b.y + b.h - ((v - o.ymin) / (o.ymax - o.ymin)) * b.h;
    g.fillStyle = 'rgba(14,6,30,.62)';
    Art.round(g, b.x, b.y, b.w, b.h, 8); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.1)'; g.lineWidth = 2;
    (o.xticks || []).forEach((v) => { g.beginPath(); g.moveTo(X(v), b.y); g.lineTo(X(v), b.y + b.h); g.stroke(); });
    (o.yticks || []).forEach((v) => { g.beginPath(); g.moveTo(b.x, Y(v)); g.lineTo(b.x + b.w, Y(v)); g.stroke(); });
    g.strokeStyle = C.ink; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(b.x, b.y + b.h); g.lineTo(b.x + b.w, b.y + b.h); g.stroke();
    const fx = o.xfmt || String, fy = o.yfmt || String;
    (o.xticks || []).forEach((v) => Art.text(g, fx(v), X(v), b.y + b.h + 17, { size: 20, color: C.dim }));
    (o.yticks || []).forEach((v) => Art.text(g, fy(v), b.x - 8, Y(v), { size: 20, align: 'right', color: C.dim }));
    if (o.ylabel) Art.text(g, o.ylabel, b.x + 10, b.y + 18, { size: 22, align: 'left', color: o.yc || C.ink });
    if (o.xlabel) Art.text(g, o.xlabel, b.x + b.w, b.y + b.h + 17 + (o.xlabelDrop || 0), { size: 21, align: 'right', color: o.xc || C.ink });
    return { X, Y };
  }
  function frac(g, top, bot, x, y, o = {}) {
    const size = o.size || 30;
    g.font = `400 ${size}px ${Art.FONT_DISPLAY}`;
    const w = Math.max(g.measureText(top).width, g.measureText(bot).width) + 12;
    Art.text(g, top, x, y - size * 0.62, { font: 'display', size, color: o.color, alpha: o.alpha });
    Art.text(g, bot, x, y + size * 0.72, { font: 'display', size, color: o.color, alpha: o.alpha });
    g.save(); g.globalAlpha *= o.alpha === undefined ? 1 : o.alpha;
    g.strokeStyle = o.color || C.ink; g.lineWidth = 3.5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - w / 2, y + 1); g.lineTo(x + w / 2, y + 1); g.stroke();
    g.restore();
    return w;
  }
  const boxFrame = (g, b, r = 10) => { g.strokeStyle = C.glass; g.lineWidth = 5; g.lineJoin = 'round'; Art.round(g, b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0, r); g.stroke(); };
  const boxFill = (g, b, r = 10) => { g.fillStyle = 'rgba(14,6,30,.6)'; Art.round(g, b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0, r); g.fill(); };
  const clipBox = (g, b, r = 10) => { Art.round(g, b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0, r); g.clip(); };

  /* ---------- Story 1: the five postulates ---------- */
  const numberTag = (g, n, text, a = 1) => {
    g.save(); g.globalAlpha *= a;
    g.fillStyle = C.pink; g.beginPath(); g.arc(46, 38, 24, 0, TAU); g.fill();
    Art.text(g, String(n), 46, 40, { font: 'display', size: 32, color: '#fff' });
    Art.text(g, text, 82, 38, { font: 'display', size: 32, align: 'left', color: C.sun });
    g.restore();
  };
  Lab.story('#story-postulates', {
    title: 'Five ideas that explain every gas',
    scenes: [
      {
        say: 'Idea one: a gas is mostly <b>empty space</b>. At room conditions, if you squashed all the molecules together, they would fill about 0.1% of the box.',
        dur: 3.6,
        draw(g, p, t) {
          numberTag(g, 1, 'Mostly empty space', seg(p, 0, 0.15));
          const A = { x0: 50, x1: 370, y0: 92, y1: 400 }, B = { x0: 430, x1: 750, y0: 92, y1: 400 };
          boxFill(g, A);
          g.save(); clipBox(g, A);
          gasField(g, A, 11, steady(t, 170, 260, 250), { seed: 3, bond: 9, r: 12 });
          g.restore();
          boxFrame(g, A);
          Art.text(g, 'even this is drawn too big', (A.x0 + A.x1) / 2, 426, { size: 23, color: C.dim, alpha: seg(p, 0.2, 0.4) });
          const a = seg(p, 0.3, 0.5);
          if (a > 0) {
            g.save(); g.globalAlpha *= a;
            boxFill(g, B); boxFrame(g, B);
            // A square holding 0.1% of the box's area is truly this small.
            const s = Math.sqrt(0.001 * (B.x1 - B.x0) * (B.y1 - B.y0));
            const sx = B.x0 + 28, sy = B.y1 - 28 - s;
            g.fillStyle = C.sun; g.fillRect(sx, sy, s, s);
            g.restore();
            const c = seg(p, 0.55, 0.8);
            Art.ring(g, sx + s / 2, sy + s / 2, 30, { color: C.pink, w: 5, p: c });
            Art.text(g, 'all the molecules,', 620, 260, { size: 27, alpha: c });
            Art.text(g, 'squashed together', 620, 294, { size: 27, alpha: c });
            Art.arrow(g, 514, 310, sx + 34, sy - 16, { color: C.pink, w: 5, p: c });
          }
        },
      },
      {
        say: 'Idea two: particles fly in <b>straight lines</b>, in random directions, and they never stop. They only change course when they hit something.',
        dur: 3.4,
        draw(g, p, t) {
          numberTag(g, 2, 'Straight lines, always moving', seg(p, 0, 0.15));
          const b = { x0: 60, x1: 740, y0: 86, y1: 424 };
          boxFill(g, b);
          g.save(); clipBox(g, b);
          const m = steady(t, 150, 440, 290), mFar = steady(t, 150, 440, 290);
          gasField(g, b, 8, mFar, { seed: 9, bond: 15, r: 20 });
          // One particle leaves a trail of straight segments.
          const pathAt = (s) => gasAt(0, steady(s, 150, 440, 290), b, 41, 30);
          g.strokeStyle = C.pink; g.lineWidth = 5; g.lineCap = 'round'; g.setLineDash([3, 12]);
          g.beginPath();
          const span = 1 + 7 * seg(p, 0.05, 0.9);
          for (let i = 0; i <= 180; i++) {
            const q = pathAt(t - span + (i / 180) * span);
            if (i) g.lineTo(q.x, q.y); else g.moveTo(q.x, q.y);
          }
          g.stroke(); g.setLineDash([]);
          const q = pathAt(t);
          Art.glow(g, q.x, q.y, 62, C.pink, 0.45);
          Art.molecule(g, q.x, q.y, 44, 'N2', { rot: t * 1.2, style: 'fill', atomScale: 1.15, labels: false, face: 'happy', faceAll: true, t });
          g.restore();
          boxFrame(g, b);
          void m;
        },
      },
      {
        say: 'Idea three: gas particles <b>ignore each other</b>. No attraction and no repulsion, except at the instant they collide. They fly past as if the other were not there.',
        dur: 3.4,
        draw(g, p, t) {
          numberTag(g, 3, 'No pull, no push', seg(p, 0, 0.15));
          // Two particles on straight, unbent paths that pass close by.
          const T0 = 4.4, u = ((t / T0) + 0.14) % 1;
          const ax = lerp(60, 740, u), ay = 186, bx = lerp(740, 60, u), by = 306;
          g.save(); g.setLineDash([3, 14]); g.lineCap = 'round'; g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 5;
          g.beginPath(); g.moveTo(40, ay); g.lineTo(760, ay); g.moveTo(40, by); g.lineTo(760, by); g.stroke(); g.restore();
          Art.molecule(g, ax, ay, 46, 'N2', { rot: t * 0.9, style: 'fill', atomScale: 1.14, labels: false, face: 'happy', faceAll: true, look: [1, 0.4], t });
          Art.molecule(g, bx, by, 46, 'O2', { rot: -t * 0.8, style: 'fill', atomScale: 1.14, labels: false, face: 'happy', faceAll: true, look: [-1, -0.4], t });
          const a = seg(p, 0.3, 0.55);
          if (a > 0) {
            // A crossed-out spring between them in the middle of the frame.
            const cy = 246, cx = 400;
            g.save(); g.globalAlpha *= a;
            g.strokeStyle = C.cyan; g.lineWidth = 5; g.lineJoin = 'round';
            g.beginPath();
            for (let i = 0; i <= 12; i++) {
              const y = cy - 44 + (i / 12) * 88, x = cx + (i % 2 ? 22 : -22) * (i === 0 || i === 12 ? 0 : 1);
              if (i) g.lineTo(x, y); else g.moveTo(x, y);
            }
            g.stroke(); g.restore();
            Art.strike(g, cx - 42, cy + 42, cx + 42, cy - 42, seg(p, 0.5, 0.65), C.red, 8);
          }
          Art.text(g, 'no bending, no slowing', 400, 396, { size: 28, alpha: seg(p, 0.6, 0.8) });
        },
      },
      {
        say: 'Idea four: collisions are <b>elastic</b>. Energy passes from one particle to the other, but the total stays the same. That is why gases never run down.',
        dur: 3.4,
        draw(g, p, t) {
          numberTag(g, 4, 'Elastic collisions', seg(p, 0, 0.15));
          // Head-on with equal masses, so they swap velocities. Speeds are 2 to 1, so KE is 4 to 1.
          const T0 = 4, ph = ((t / T0) + 0.05) % 1, before = ph < 0.5;
          const f = before ? ph * 2 : (ph - 0.5) * 2;
          const midX = 262, r = 46, L = 78;
          const ax = before ? midX - r - (1 - f) * 2 * L : midX - r - f * L;
          const bx = before ? midX + r + (1 - f) * L : midX + r + f * 2 * L;
          Art.atom(g, ax, 240, r, 'N', { face: before ? 'grin' : 'happy', t, label: false, look: [1, 0] });
          Art.atom(g, bx, 240, r, 'O', { face: before ? 'happy' : 'grin', t, label: false, look: [-1, 0] });
          // Arrow length shows each particle's speed.
          const arrow = (x, v) => { if (Math.abs(v) > 0) Art.arrow(g, x - v / 2, 240 - r - 22, x + v / 2, 240 - r - 22, { color: C.sun, w: 7 }); };
          arrow(ax, before ? 84 : -42); arrow(bx, before ? -42 : 84);
          if (!before && f < 0.2) Art.burst(g, midX, 240, f / 0.2, { n: 14, r: 96, size: 9 });
          // Energy bars.
          const keA = before ? 0.8 : 0.2, keB = before ? 0.2 : 0.8;
          const bx0 = 540, by = 356, k = 214;
          const bar = (x, v, col, name) => {
            g.fillStyle = col; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
            Art.round(g, x, by - v * k, 58, v * k, 6); g.fill(); g.stroke();
            Art.text(g, name, x + 29, by + 24, { size: 22 });
          };
          bar(bx0, keA, Art.elementColor('N'), 'left');
          bar(bx0 + 72, keB, Art.elementColor('O'), 'right');
          g.fillStyle = Art.elementColor('N'); g.strokeStyle = '#1A0F2E';
          Art.round(g, bx0 + 148, by - keA * k, 58, keA * k, 6); g.fill(); g.stroke();
          g.fillStyle = Art.elementColor('O');
          g.fillRect(bx0 + 148, by - k, 58, keB * k); g.strokeRect(bx0 + 148, by - k, 58, keB * k);
          Art.text(g, 'total', bx0 + 177, by + 24, { size: 22, color: C.sun });
          g.strokeStyle = C.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(bx0 - 8, by); g.lineTo(bx0 + 216, by); g.stroke();
          Art.text(g, 'kinetic energy', bx0 + 104, 118, { size: 25, color: C.dim });
          Art.text(g, 'the total stays the same', bx0 + 104, 416, { size: 24, color: C.sun, alpha: seg(p, 0.4, 0.6) });
        },
      },
      {
        say: 'Idea five: average kinetic energy depends only on <b>Kelvin temperature</b>. It is $\\frac{3}{2}RT$ per mole. Four times the Kelvin temperature means four times the average energy.',
        speak: 'Idea five: average kinetic energy depends only on Kelvin temperature. It is three halves R T per mole. Four times the Kelvin temperature means four times the average energy.',
        dur: 3.6,
        draw(g, p, t) {
          numberTag(g, 5, 'Temperature is average energy', seg(p, 0, 0.15));
          const panel = (x0, T, a, name) => {
            if (a <= 0) return;
            g.save(); g.globalAlpha *= a;
            const b = { x0, x1: x0 + 310, y0: 88, y1: 300 };
            boxFill(g, b);
            g.save(); clipBox(g, b);
            gasField(g, b, 10, steady(t, 70 * Math.sqrt(T / 200), 220, 150), { seed: 6, bond: 13, r: 17, sparks: T > 400 });
            g.restore();
            boxFrame(g, b);
            Art.text(g, name, x0 + 155, 326, { font: 'display', size: 30, color: T > 400 ? C.fire : C.cyan });
            const ke = 1.5 * R_J * T / 1000;
            const w = (ke / 10) * 310;
            g.fillStyle = 'rgba(255,255,255,.12)'; Art.round(g, x0, 354, 310, 26, 13); g.fill();
            g.fillStyle = C.sun; Art.round(g, x0, 354, Math.max(26, w * seg(p, 0.5, 0.85)), 26, 13); g.fill();
            Art.text(g, `average KE: ${ke.toFixed(2)} kJ/mol`, x0 + 155, 410, { size: 25 });
            g.restore();
          };
          panel(50, 200, seg(p, 0.08, 0.3), '200 K');
          panel(440, 800, seg(p, 0.28, 0.5), '800 K');
          Art.text(g, '× 4', 400, 196, { font: 'display', size: 34, color: C.sun, alpha: seg(p, 0.5, 0.7) });
        },
      },
    ],
  });

  /* ---------- Bench: the live speed histogram ---------- */
  const HW = 800, HH = 490;
  const HB = { x0: 22, y0: 26, x1: 372, y1: 464 };
  const V300 = 150; // rms sim speed at 300 K, in stage units per second
  const REAL300 = Math.sqrt((3 * R_J * 300) / 0.02802); // real N2 rms at 300 K, m/s
  const toReal = REAL300 / V300;
  const hist = {
    T: 300, NB: 40, vmax: 2000, bins: new Float32Array(40), hitRate: 0, hits: 0, maxV: 0, rms: 0, spike: 0,
    box: new Sim.Box({ x0: HB.x0 + 3, y0: HB.y0 + 3, x1: HB.x1 - 3, y1: HB.y1 - 3, speed: V300, seed: 31 }),
  };
  hist.box.add({ n: 140, r: 5, kind: 'N2', mass: 1 });
  hist.box.onHit = () => { hist.hits++; };
  const rawBins = () => {
    const raw = new Float32Array(hist.NB), P = hist.box.particles;
    for (const q of P) {
      const v = Math.hypot(q.vx, q.vy) * toReal;
      const k = Math.min(hist.NB - 1, Math.floor((v / hist.vmax) * hist.NB));
      raw[k] += 1 / P.length;
    }
    return raw;
  };
  const scaleSpeeds = () => {
    const P = hist.box.particles;
    let s = 0;
    for (const q of P) s += q.vx * q.vx + q.vy * q.vy;
    const k = (V300 * Math.sqrt(hist.T / 300)) / Math.sqrt(s / P.length);
    for (const q of P) { q.vx *= k; q.vy *= k; }
  };
  /** Same speed, random directions. The histogram collapses to a spike, then collisions spread it out. */
  const sameSpeed = () => {
    const v = V300 * Math.sqrt(hist.T / 300);
    hist.box.particles.forEach((q, i) => { const a = rand(i * 7.3 + performance.now() * 0.001) * TAU; q.vx = Math.cos(a) * v; q.vy = Math.sin(a) * v; });
    hist.bins = rawBins();
  };
  // Settle quietly before the first look, so the page opens at equilibrium.
  scaleSpeeds();
  for (let i = 0; i < 500; i++) hist.box.step(0.012);
  hist.bins = rawBins();
  const histStage = Lab.stage('#c-hist', {
    w: HW, h: HH,
    label: 'A box of gas particles beside a live histogram of their speeds, with a smooth theory curve drawn on top.',
    draw(g, t, dt) {
      if (dt) {
        hist.box.step(dt / 2); hist.box.step(dt / 2);
        const raw = rawBins(), k = clamp(dt / 1.1);
        for (let i = 0; i < hist.NB; i++) hist.bins[i] += (raw[i] - hist.bins[i]) * k;
        hist.hitRate += (hist.hits - hist.hitRate * dt) / 1.0;
        hist.hits = 0;
      }
      const P = hist.box.particles;
      let s = 0, mx = 0;
      for (const q of P) { const v2 = q.vx * q.vx + q.vy * q.vy; s += v2; if (v2 > mx) mx = v2; }
      hist.rms = Math.sqrt(s / P.length) * toReal; hist.maxV = Math.sqrt(mx) * toReal;
      // The box.
      boxFill(g, HB, 12);
      g.save(); clipBox(g, HB, 12);
      for (const q of P) particle(g, 'N2', q.x, q.y, 7.4, q.rot * 3);
      const tr = P[0];
      Art.ring(g, tr.x, tr.y, 15, { color: C.pink, w: 4 });
      g.restore();
      boxFrame(g, HB, 12);
      // The histogram.
      const b = { x: 438, y: 60, w: 340, h: 366 };
      const yMax = 0.17;
      const A = axes(g, b, { xmin: 0, xmax: hist.vmax, ymin: 0, ymax: yMax, xticks: [0, 500, 1000, 1500], xlabel: 'm/s', xfmt: (v) => String(v) });
      Art.text(g, 'share of the particles', b.x, 40, { size: 22, align: 'left', color: C.ink });
      const bw = b.w / hist.NB;
      g.save(); g.beginPath(); g.rect(b.x, b.y, b.w, b.h); g.clip();
      for (let i = 0; i < hist.NB; i++) {
        const h = (hist.bins[i] / yMax) * b.h;
        if (h < 0.5) continue;
        const gr = g.createLinearGradient(0, b.y + b.h - h, 0, b.y + b.h);
        gr.addColorStop(0, C.cyan); gr.addColorStop(1, Art.mix(C.cyan, '#1A0F2E', 0.6));
        g.fillStyle = gr;
        g.fillRect(b.x + i * bw + 0.8, b.y + b.h - h, bw - 1.6, h);
      }
      // The 2D theory curve for this exact energy.
      const sig2 = (hist.rms * hist.rms) / 2, dv = hist.vmax / hist.NB;
      g.strokeStyle = C.sun; g.lineWidth = 4; g.lineJoin = 'round';
      g.beginPath();
      for (let i = 0; i <= 120; i++) {
        const v = (i / 120) * hist.vmax, f = (v / sig2) * Math.exp((-v * v) / (2 * sig2)) * dv;
        const x = A.X(v), y = A.Y(f);
        if (i) g.lineTo(x, y); else g.moveTo(x, y);
      }
      g.stroke();
      g.restore();
      const peakV = Math.sqrt(sig2);
      const peakF = (peakV / sig2) * Math.exp(-0.5) * dv;
      const lx = Math.min(A.X(peakV) + 30, b.x + b.w - 160);
      Art.text(g, '2D model curve', lx, Math.max(A.Y(peakF) - 20, b.y + 22), { size: 22, align: 'left', color: C.sun, halo: true });
      // rms marker.
      g.save(); g.setLineDash([8, 7]); g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(A.X(hist.rms), b.y + 44); g.lineTo(A.X(hist.rms), b.y + b.h); g.stroke(); g.restore();
      Art.text(g, 'rms ' + Math.round(hist.rms), Math.min(A.X(hist.rms), b.x + b.w - 52), b.y + 30, { font: 'display', size: 22, color: '#fff', halo: true });
      // Where the ringed particle is right now.
      const tv = Math.hypot(tr.vx, tr.vy) * toReal;
      const tx = A.X(Math.min(tv, hist.vmax));
      g.fillStyle = C.pink; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(tx, b.y + b.h - 2); g.lineTo(tx - 11, b.y + b.h - 22); g.lineTo(tx + 11, b.y + b.h - 22); g.closePath(); g.fill(); g.stroke();
      Art.text(g, 'the ringed one', clamp(tx, b.x + 74, b.x + b.w - 74), b.y + b.h - 38, { size: 21, color: C.pink, halo: true });
      if (dt && Math.floor(t * 5) !== Math.floor((t - dt) * 5)) {
        Lab.$('#hist-rms').textContent = Math.round(hist.rms) + ' m/s';
        Lab.$('#hist-max').textContent = Math.round(hist.maxV) + ' m/s';
        Lab.$('#hist-hits').textContent = String(Math.round(Math.max(0, hist.hitRate)));
      }
    },
  });
  Lab.bind('#hist-t', '#hist-t-out', (v) => `${v} K = ${v - 273} °C`, (v) => {
    hist.T = v; scaleSpeeds();
    Lab.$('#hist-rms').textContent = Math.round(V300 * Math.sqrt(v / 300) * toReal) + ' m/s';
    Lab.$('#hist-max').textContent = Math.round(Math.max(...hist.box.particles.map((q) => Math.hypot(q.vx, q.vy))) * toReal) + ' m/s';
    histStage.redraw();
  });
  Lab.$('#hist-same').addEventListener('click', () => { sameSpeed(); Lab.sound.pop(); histStage.redraw(); });

  /* ---------- Bench: real Maxwell-Boltzmann curves ---------- */
  const MB = {
    H2: { M: 0.002016, name: 'H2', col: '#F4F6FB' }, He: { M: 0.004003, name: 'He', col: '#7FF3F3' }, H2O: { M: 0.01802, name: 'H2O', col: '#FF8A94' },
    N2: { M: 0.02802, name: 'N2', col: '#7DA2FF' }, O2: { M: 0.032, name: 'O2', col: '#FF6B7D' }, CO2: { M: 0.04401, name: 'CO2', col: '#C2CBDE' }, Xe: { M: 0.1313, name: 'Xe', col: '#55C0DE' },
  };
  const mb = { T: 300, on: ['He', 'N2', 'CO2'] };
  const uRms = (T, M) => Math.sqrt((3 * R_J * T) / M);
  const fMB = (v, T, M) => { const a = M / (2 * R_J * T); return 4 * Math.PI * Math.pow(a / Math.PI, 1.5) * v * v * Math.exp(-a * v * v); };
  const mbStage = Lab.stage('#c-mb', {
    h: 540,
    label: 'Maxwell-Boltzmann speed curves for the chosen gases, with a racing lane for each gas showing its rms speed.',
    draw(g, t) {
      const b = { x: 54, y: 30, w: 720, h: 300 };
      const vMax = 2500, yMax = 0.0042;
      const A = axes(g, b, { xmin: 0, xmax: vMax, ymin: 0, ymax: yMax, xticks: [0, 500, 1000, 1500], xlabel: 'speed (m/s)' });
      Art.text(g, 'share of molecules', b.x + 10, b.y + 18, { size: 22, align: 'left', color: C.dim });
      g.save(); g.beginPath(); g.rect(b.x, b.y, b.w, b.h); g.clip();
      mb.on.forEach((k) => {
        const G = MB[k];
        g.beginPath();
        for (let i = 0; i <= 220; i++) {
          const v = (i / 220) * vMax, y = A.Y(fMB(v, mb.T, G.M));
          if (i) g.lineTo(A.X(v), y); else g.moveTo(A.X(v), y);
        }
        g.lineTo(A.X(vMax), A.Y(0)); g.lineTo(A.X(0), A.Y(0)); g.closePath();
        g.fillStyle = Art.alpha(G.col, 0.14); g.fill();
        g.strokeStyle = G.col; g.lineWidth = 4; g.lineJoin = 'round';
        g.beginPath();
        for (let i = 0; i <= 220; i++) {
          const v = (i / 220) * vMax, y = A.Y(fMB(v, mb.T, G.M));
          if (i) g.lineTo(A.X(v), y); else g.moveTo(A.X(v), y);
        }
        g.stroke();
      });
      g.restore();
      // Label each curve at its peak, with leader-free placement above it.
      const placed = [];
      mb.on.slice().sort((p, q) => MB[q].M - MB[p].M).forEach((k) => {
        const G = MB[k], vp = Math.sqrt((2 * R_J * mb.T) / G.M);
        let lx = A.X(Math.min(vp, vMax * 0.95)), ly = Math.max(A.Y(fMB(vp, mb.T, G.M)) - 24, b.y + 52);
        placed.forEach((q) => { if (Math.abs(q.x - lx) < 64 && Math.abs(q.y - ly) < 34) ly = q.y - 36; });
        ly = Math.max(ly, b.y + 16);
        placed.push({ x: lx, y: ly });
        Art.formula(g, G.name, lx, ly, { size: 28, color: G.col, halo: true });
      });
      // The panel for the first gas.
      const key = mb.on[0] && MB[mb.on[0]];
      if (key) {
        const vp = Math.sqrt((2 * R_J * mb.T) / key.M), va = Math.sqrt((8 * R_J * mb.T) / (Math.PI * key.M)), vr = uRms(mb.T, key.M);
        const px = 492, py = 48;
        g.fillStyle = 'rgba(30,18,60,.92)'; Art.round(g, px, py, 276, 156, 14); g.fill();
        Art.formula(g, key.name, px + 16, py + 24, { size: 26, color: key.col, align: 'left' });
        Art.text(g, `at ${mb.T} K`, px + 60, py + 24, { size: 22, align: 'left', color: C.dim });
        const row = (y, label, v, col) => {
          Art.text(g, label, px + 16, y, { size: 21, align: 'left', color: col });
          Art.text(g, Math.round(v).toLocaleString('en-US') + ' m/s', px + 260, y, { font: 'display', size: 23, align: 'right', color: col });
        };
        row(py + 62, 'most likely', vp, C.leaf);
        row(py + 94, 'average', va, C.cyan);
        row(py + 126, 'rms', vr, C.sun);
        // Tick marks on the curve for these three.
        [[vp, C.leaf], [va, C.cyan], [vr, C.sun]].forEach(([v, col]) => {
          if (v > vMax) return;
          const y = A.Y(fMB(v, mb.T, key.M));
          g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.moveTo(A.X(v), y); g.lineTo(A.X(v), b.y + b.h); g.stroke();
          Art.ball(g, A.X(v), y, 6, col);
        });
      }
      // Racing lanes: bar length and runner speed both follow the rms speed.
      const lane0 = 416, laneH = 46, x0 = 150, x1 = 776;
      const vScale = (x1 - x0) / vMax;
      mb.on.forEach((k, i) => {
        const G = MB[k], vr = uRms(mb.T, G.M), y = lane0 + i * laneH;
        Art.formula(g, G.name, 62, y, { size: 26, color: G.col, align: 'center' });
        g.fillStyle = 'rgba(255,255,255,.08)'; Art.round(g, x0, y - 15, x1 - x0, 30, 15); g.fill();
        const w = Math.min(x1 - x0, vr * vScale);
        g.fillStyle = Art.alpha(G.col, 0.6); Art.round(g, x0, y - 15, Math.max(30, w), 30, 15); g.fill();
        // The runner zips along its bar.
        const u = (t * vr * 0.32) / Math.max(w, 60), m = ((u % 2) + 2) % 2, f = m < 1 ? m : 2 - m;
        const rx = x0 + 18 + (Math.max(w, 60) - 36) * f;
        particle(g, k, rx, y, k === 'He' || k === 'Xe' ? 15 : 13, t * 3);
        Art.text(g, Math.round(vr).toLocaleString('en-US') + ' m/s', Math.min(x0 + w + 12, x1 - 118), y, { font: 'display', size: 24, align: 'left', color: '#fff', halo: true });
      });
      const ke = (1.5 * R_J * mb.T) / 1000;
      if (mb.on.length) Art.text(g, `rms speed. Average KE is ${ke.toFixed(2)} kJ/mol for every gas here.`, 400, 376, { size: 23, color: C.sun });
    },
  });
  function paintMB() {
    const rows = mb.on.map((k) => {
      const G = MB[k], gMol = G.M * 1000;
      return `<li>$\\ce{${k}}$: $u_\\text{rms} = \\sqrt{\\dfrac{3(8.314)(${mb.T})}{${G.M}}} = \\mathbf{${Math.round(uRms(mb.T, G.M))}\\text{ m/s}}$, using $M = ${G.M}$ kg/mol, not ${+gMol.toFixed(2)}.</li>`;
    }).join('');
    Lab.$('#mb-foot').innerHTML = Lab.texString(`<ul style="margin:0;padding-left:1.2em">${rows}</ul><p style="margin-top:8px">Curves are the real 3D Maxwell-Boltzmann distribution. Heat a gas and its peak moves right, drops lower and spreads out. A heavier gas does the opposite.</p>`);
    mbStage.redraw();
  }
  Lab.$$('#mb-gases button').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.value;
    if (mb.on.includes(k)) { if (mb.on.length > 1) mb.on = mb.on.filter((x) => x !== k); }
    else { mb.on.push(k); if (mb.on.length > 3) mb.on.shift(); }
    Lab.$$('#mb-gases button').forEach((x) => x.setAttribute('aria-pressed', String(mb.on.includes(x.dataset.value))));
    paintMB();
  }));
  Lab.bind('#mb-t', '#mb-t-out', (v) => `${v} K = ${v - 273} °C`, (v) => { mb.T = v; paintMB(); });

  /* ---------- Story 2: why lighter means faster ---------- */
  Lab.story('#story-graham', {
    title: 'Why lighter gases leak faster',
    scenes: [
      {
        say: 'Punch a tiny hole in a box and leave empty space outside. Particles escape only when they happen to reach the hole. Faster particles reach it <b>more often</b>.',
        dur: 3,
        draw(g, p, t) {
          const b = { x0: 40, x1: 430, y0: 60, y1: 400 };
          boxFill(g, b);
          g.save(); clipBox(g, b);
          gasField(g, b, 15, steady(t, 160, 320, 280), { seed: 12, formula: 'O2', bond: 15, r: 20 });
          g.restore();
          // Wall with a pinhole on the right.
          const hy = 230, hw = 20;
          g.strokeStyle = C.glass; g.lineWidth = 6; g.lineCap = 'round';
          g.beginPath(); g.moveTo(b.x1, hy - hw); g.lineTo(b.x1, b.y0); g.lineTo(b.x0, b.y0); g.lineTo(b.x0, b.y1); g.lineTo(b.x1, b.y1); g.lineTo(b.x1, hy + hw); g.stroke();
          // Escapers stream out in a fan.
          const a = seg(p, 0.15, 0.4);
          g.save(); g.globalAlpha *= a;
          for (let i = 0; i < 6; i++) {
            const u = ((t * 0.24 + i / 6) % 1);
            const ang = (rand(i + 3) - 0.5) * 0.9;
            const d = u * 340;
            particle(g, 'O2', b.x1 + Math.cos(ang) * d, hy + Math.sin(ang) * d, 15, t * 2 + i);
          }
          g.restore();
          Art.text(g, 'pinhole', b.x1 + 8, hy - 60, { size: 26, align: 'left', color: C.sun, alpha: seg(p, 0.1, 0.25) });
          Art.arrow(g, b.x1 + 34, hy - 44, b.x1 + 8, hy - 18, { color: C.sun, w: 5, alpha: seg(p, 0.1, 0.25) });
          Art.text(g, 'empty space', 620, 90, { size: 28, color: C.dim, alpha: seg(p, 0.3, 0.5) });
          Art.text(g, 'This is effusion.', 620, 386, { font: 'display', size: 34, color: C.sun, alpha: seg(p, 0.65, 0.85) });
        },
      },
      {
        say: 'At the same temperature, all gases have the <b>same average kinetic energy</b>. So a heavy particle must move slowly and a light one must move fast. Oxygen is about 16 times heavier than hydrogen, and about 4 times slower.',
        dur: 3.6,
        draw(g, p, t) {
          const lanes = [
            { y: 110, f: 'H2', name: 'H₂: 2 g/mol', rate: 1, col: C.ink, bond: 46, speed: '1,920 m/s at 25 °C' },
            { y: 290, f: 'O2', name: 'O₂: 32 g/mol', rate: 0.25, col: '#FF8A94', bond: 44, speed: '482 m/s at 25 °C' },
          ];
          lanes.forEach((L, i) => {
            const a = ease.out(seg(p, 0.05 + i * 0.25, 0.28 + i * 0.25));
            if (a <= 0) return;
            g.save(); g.globalAlpha *= a;
            Art.text(g, L.name, 40, L.y - 58, { font: 'display', size: 30, align: 'left', color: L.col });
            Art.text(g, L.speed, 40, L.y + 62, { size: 25, align: 'left', color: C.dim });
            g.fillStyle = 'rgba(255,255,255,.08)'; Art.round(g, 40, L.y - 34, 520, 68, 34); g.fill();
            const u = t * L.rate * 0.95, m = ((u % 2) + 2) % 2, f = m < 1 ? m : 2 - m;
            Art.molecule(g, 90 + f * 420, L.y, L.bond, L.f, { rot: t * 2 * L.rate, style: 'fill', atomScale: i ? 1.1 : 1.2, labels: false, face: 'happy', faceAll: true, t });
            // Same KE bar.
            g.fillStyle = C.sun; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
            Art.round(g, 596, L.y - 18, 164, 36, 18); g.fill(); g.stroke();
            Art.text(g, 'same KE', 678, L.y, { size: 24, color: '#22123A' });
            g.restore();
          });
          Art.text(g, 'Lighter means faster.', 400, 416, { font: 'display', size: 34, color: C.sun, alpha: seg(p, 0.7, 0.9) });
        },
      },
      {
        say: 'Set the two kinetic energies equal and solve. The ½ cancels, and taking the square root gives <b>Graham\'s law</b>: rate depends on the square root of molar mass, with the other gas on top.',
        speak: 'Set the two kinetic energies equal and solve. The one half cancels, and taking the square root gives Graham\'s law: rate depends on the square root of molar mass, with the other gas on top.',
        dur: 4,
        draw(g, p) {
          const a = seg(p, 0.03, 0.2), b = seg(p, 0.26, 0.42), c = seg(p, 0.5, 0.66), d = seg(p, 0.72, 0.9);
          Art.text(g, '½ M₁ u₁²  =  ½ M₂ u₂²', 400, 64, { font: 'display', size: 44, alpha: a });
          Art.strike(g, 188, 84, 216, 40, seg(p, 0.18, 0.28), C.red, 5);
          Art.strike(g, 412, 84, 440, 40, seg(p, 0.18, 0.28), C.red, 5);
          Art.text(g, 'Rearrange:', 120, 166, { size: 26, color: C.dim, alpha: b });
          frac(g, 'u₁²', 'u₂²', 300, 166, { size: 38, alpha: b });
          Art.text(g, '=', 380, 168, { font: 'display', size: 40, alpha: b });
          frac(g, 'M₂', 'M₁', 450, 166, { size: 38, alpha: b });
          Art.text(g, 'Square root:', 120, 278, { size: 26, color: C.dim, alpha: c });
          frac(g, 'u₁', 'u₂', 300, 278, { size: 38, alpha: c });
          Art.text(g, '=', 380, 280, { font: 'display', size: 40, alpha: c });
          g.save(); g.globalAlpha *= c;
          g.strokeStyle = C.ink; g.lineWidth = 3.5; g.lineJoin = 'round';
          g.beginPath(); g.moveTo(414, 280); g.lineTo(424, 318); g.lineTo(436, 236); g.lineTo(490, 236); g.stroke();
          g.restore();
          frac(g, 'M₂', 'M₁', 462, 278, { size: 34, alpha: c });
          if (d > 0) {
            g.fillStyle = Art.alpha(C.plum2, 0.95 * d); Art.round(g, 118, 352, 564, 84, 22); g.fill();
            Art.text(g, 'rate₁ ÷ rate₂ = √(M₂ ÷ M₁)', 400, 394, { font: 'display', size: 38, color: C.sun, alpha: d });
          }
          Art.moe(g, 660, 340, 130, 'point', { t: p * 3, flip: true });
        },
      },
    ],
  });

  /* ---------- Bench: the effusion race ---------- */
  const RG = { H2: 2.016, He: 4.003, CH4: 16.04, N2: 28.02, O2: 32.0, CO2: 44.01 };
  const RACE_N = 60;
  const RC = { y0: 30, y1: 276, w: 190 };
  const LANE = [{ x0: 22 }, { x0: 238 }];
  const race = { a: 'H2', b: 'O2', pick: null, run: false, t: 0, done: false, sides: [], log: [[], []] };
  const HOLE = 26;
  function buildSide(i, key) {
    const x0 = LANE[i].x0, x1 = x0 + RC.w;
    const cx = (x0 + x1) / 2;
    const M = RG[key];
    const v = 230 * Math.sqrt(32 / M) * race.scale; // speeds carry the true 1/sqrt(M) ratio
    const box = new Sim.Box({ x0: x0 + 3, y0: RC.y0 + 3, x1: x1 - 3, y1: RC.y1 - 3, speed: v, seed: 7 + i * 13, collide: true });
    box.add({ n: RACE_N, r: 3, kind: key, mass: 1 });
    // Give all sides the same exact rms, then let collisions shape the distribution.
    let s = 0;
    for (const q of box.particles) s += q.vx * q.vx + q.vy * q.vy;
    const k = v / Math.sqrt(s / RACE_N);
    for (const q of box.particles) { q.vx *= k; q.vy *= k; }
    for (let n = 0; n < 240; n++) box.step(0.005);
    box.wallHits = 0;
    const side = { key, box, cx, M, v, gone: [], out: 0, half: null };
    box.onWall = (q) => {
      if (!race.run || race.done) return;
      if (q.vy < 0 && q.y >= box.y1 - q.r - 0.5 && Math.abs(q.x - cx) < HOLE) {
        q.escape = true;
      }
    };
    return side;
  }
  function resetRace() {
    // A time scale keeps the slower gas finishing in a watchable time, without changing the ratio.
    const slowM = Math.max(RG[race.a], RG[race.b]);
    race.scale = clamp(Math.sqrt(slowM / 32), 0.45, 2.2);
    race.run = false; race.t = 0; race.done = false;
    race.sides = [buildSide(0, race.a), buildSide(1, race.b)];
    race.log = [[[0, 0]], [[0, 0]]];
    paintRace();
    raceStage && raceStage.redraw();
  }
  const predicted = () => Math.sqrt(RG[race.b] / RG[race.a]); // rate of left over rate of right
  function paintRace(result) {
    const r = predicted(), A = race.a, B = race.b;
    const fast = RG[A] < RG[B] ? A : B, slow = RG[A] < RG[B] ? B : A;
    const big = Math.max(r, 1 / r);
    let html = `<p>Graham's law predicts: $\\dfrac{\\text{rate}_{\\ce{${fast}}}}{\\text{rate}_{\\ce{${slow}}}} = \\sqrt{\\dfrac{${RG[slow].toFixed(2)}}{${RG[fast].toFixed(2)}}} = \\mathbf{${big.toFixed(2)}}$.</p>`;
    if (A === B) html = '<p>Same gas on both sides. Graham\'s law predicts a tie, but small numbers can still give either side a lead. Try it a few times.</p>';
    if (result) html += `<p>${result}</p>`;
    Lab.$('#race-foot').innerHTML = Lab.texString(html);
  }
  const FINISH = RACE_N / 2;
  const raceStage = Lab.stage('#c-race', {
    h: 470,
    label: 'Two boxes of gas with a pinhole in the floor of each, a tally of escaped particles, and a live graph comparing them with the theory.',
    draw(g, t, dt) {
      if (dt && race.sides.length) {
        if (race.run && !race.done) race.t += dt;
        race.sides.forEach((S, i) => {
          S.box.step(dt / 2); S.box.step(dt / 2);
          const leaving = S.box.particles.filter((q) => q.escape);
          if (leaving.length) {
            S.box.remove((q) => q.escape);
            leaving.forEach((q) => { S.gone.push({ x: q.x, y: q.y, vx: q.vx, vy: Math.abs(q.vy), rot: q.rot, age: 0 }); S.out++; });
            if (S.half === null && S.out >= FINISH) S.half = race.t;
            race.log[i].push([race.t, S.out]);
          }
          S.gone = S.gone.filter((q) => { q.age += dt; q.x += q.vx * dt; q.y += q.vy * dt; return q.age < 1.1 && q.y < 390; });
        });
        if (race.run && !race.done && race.sides.every((S) => S.half !== null)) {
          race.done = true;
          const [A, B] = race.sides;
          const measured = B.half / A.half; // left rate over right rate
          const leader = A.half < B.half ? 'a' : 'b';
          const r = predicted();
          const fastIsA = RG[race.a] <= RG[race.b];
          const showM = fastIsA ? measured : 1 / measured, showP = fastIsA ? r : 1 / r;
          let verdict = `Race measured: the lighter gas was <b>${showM.toFixed(2)} times</b> faster, where the law says ${showP.toFixed(2)}.`;
          if (race.a === race.b) verdict = `Each side reached 30 escaped within ${(Math.abs(A.half - B.half)).toFixed(1)} s of the other.`;
          const correct = (race.a === race.b && race.pick === 'tie') || (race.a !== race.b && race.pick === (RG[race.a] < RG[race.b] ? 'a' : 'b'));
          if (race.pick) {
            if (correct) {
              verdict += ' And you called it.';
              if (!race.awarded) { race.awarded = true; Lab.collection.award(1); Lab.confetti(60); } else Lab.sound.good();
            } else verdict += ' Your prediction did not hold. Lighter gases are the ones that leak faster.';
          }
          void leader;
          paintRace(verdict);
        }
      }
      // Boxes.
      race.sides.forEach((S, i) => {
        const x0 = LANE[i].x0, x1 = x0 + RC.w, b = { x0, x1, y0: RC.y0, y1: RC.y1 };
        boxFill(g, b, 8);
        g.save(); clipBox(g, b, 8);
        for (const q of S.box.particles) particle(g, S.key, q.x, q.y, S.key === 'He' ? 8 : 8, q.rot * 4);
        g.restore();
        g.strokeStyle = C.glass; g.lineWidth = 5; g.lineCap = 'round';
        g.beginPath(); g.moveTo(S.cx - HOLE, RC.y1); g.lineTo(x0, RC.y1); g.lineTo(x0, RC.y0); g.lineTo(x1, RC.y0); g.lineTo(x1, RC.y1); g.lineTo(S.cx + HOLE, RC.y1); g.stroke();
        if (!race.run || race.done) {
          g.fillStyle = '#B2ACC9'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
          Art.round(g, S.cx - HOLE - 6, RC.y1 - 4, HOLE * 2 + 12, 10, 3); g.fill(); g.stroke();
        }
        S.gone.forEach((q) => { g.save(); g.globalAlpha *= clamp(1.1 - q.age); particle(g, S.key, q.x, q.y, 8, q.rot * 4); g.restore(); });
        // Tally.
        const yy = 330;
        Art.formula(g, S.key, S.cx, yy - 14 + 6, { size: 30, colorize: true, halo: true });
        Art.text(g, `${RG[S.key].toFixed(2)} g/mol`, S.cx, yy + 22, { size: 21, color: C.dim });
        const y2 = 390;
        g.fillStyle = 'rgba(255,255,255,.1)'; Art.round(g, x0, y2, RC.w, 26, 13); g.fill();
        g.fillStyle = S.half !== null ? C.leaf : C.cyan; Art.round(g, x0, y2, Math.max(26, (Math.min(S.out, FINISH) / FINISH) * RC.w), 26, 13); g.fill();
        Art.text(g, `${S.out} escaped`, S.cx, y2 + 13, { size: 20, color: '#fff', halo: true });
        Art.text(g, S.half !== null ? `30 out at ${S.half.toFixed(1)} s` : 'race to 30', S.cx, y2 + 48, { size: 22, color: S.half !== null ? C.leaf : C.dim });
      });
      // The graph.
      const b = { x: 500, y: 58, w: 282, h: 292 };
      const tMax = Math.max(12, race.t * 1.1);
      const A = axes(g, b, { xmin: 0, xmax: tMax, ymin: 0, ymax: RACE_N, xticks: [0, Math.round(tMax / 2), Math.round(tMax)], yticks: [20, 40, 60], xlabel: '', xfmt: (v) => v + ' s' });
      Art.text(g, 'particles escaped', b.x, 36, { size: 23, align: 'left' });
      g.save(); g.beginPath(); g.rect(b.x, b.y, b.w, b.h); g.clip();
      const cols = [C.cyan, C.pink];
      race.sides.forEach((S, i) => {
        // 2D kinetic theory: dN/dt = -N * vbar * hole / (pi * Area), for a hole in a wall.
        const vbar = S.v * 0.886;
        const width = HOLE * 2, area = (RC.w - 12) * (RC.y1 - RC.y0 - 12);
        const tau = (Math.PI * area) / (vbar * width);
        g.save(); g.setLineDash([9, 8]); g.strokeStyle = Art.alpha(cols[i], 0.6); g.lineWidth = 3.4;
        g.beginPath();
        for (let k = 0; k <= 60; k++) {
          const tt = (k / 60) * tMax, y = A.Y(RACE_N * (1 - Math.exp(-tt / tau)));
          if (k) g.lineTo(A.X(tt), y); else g.moveTo(A.X(tt), y);
        }
        g.stroke(); g.restore();
        g.strokeStyle = cols[i]; g.lineWidth = 4.5; g.lineJoin = 'round';
        g.beginPath();
        race.log[i].forEach((pt, k) => { const x = A.X(pt[0]), y = A.Y(pt[1]); if (k) g.lineTo(x, y); else g.moveTo(x, y); });
        if (race.log[i].length) g.lineTo(A.X(race.t), A.Y(S.out));
        g.stroke();
      });
      g.restore();
      race.sides.forEach((S, i) => {
        Art.formula(g, S.key, b.x + 26 + i * 80, b.y + 28, { size: 26, color: cols[i], align: 'left' });
      });
      Art.text(g, 'solid: this race', b.x + b.w - 8, b.y + b.h - 58, { size: 20, align: 'right', color: C.ink, halo: true });
      Art.text(g, 'dashed: theory', b.x + b.w - 8, b.y + b.h - 30, { size: 20, align: 'right', color: C.dim, halo: true });
      if (!race.run) Art.pill(g, 'Press Open the holes', 236, 150, { size: 26, color: C.plum2, text: '#fff', font: 'display' });
      void t;
    },
  });
  const raceA = Lab.segmented('#race-a', (v) => { race.a = v; resetRace(); });
  const raceB = Lab.segmented('#race-b', (v) => { race.b = v; resetRace(); });
  void raceA; void raceB;
  Lab.segmented('#race-pick', (v) => { race.pick = v; });
  Lab.$('#race-go').addEventListener('click', () => { if (!race.run) { race.run = true; Lab.sound.pop(); } });
  Lab.$('#race-reset').addEventListener('click', resetRace);
  resetRace();

  /* ---------- Story 3: diffusion ---------- */
  const walk = (seed, n, step) => {
    const pts = [[0, 0]];
    for (let i = 1; i <= n; i++) {
      const a = rand(seed + i * 3.3) * TAU, d = step * (0.5 + rand(seed + i * 5.1));
      pts.push([pts[i - 1][0] + Math.cos(a) * d, pts[i - 1][1] + Math.sin(a) * d]);
    }
    return pts;
  };
  const ZIG = walk(4, 36, 44);
  Lab.story('#story-diffusion', {
    title: 'A very crowded walk',
    scenes: [
      {
        say: 'Open a perfume bottle across the room. Its molecules slowly spread through the air until you can smell them. That spreading is <b>diffusion</b>.',
        dur: 3.6,
        draw(g, p, t) {
          // Bottle.
          const bx = 100, by = 390;
          const gl = g.createLinearGradient(bx - 40, 0, bx + 40, 0);
          gl.addColorStop(0, '#E070C0'); gl.addColorStop(0.5, '#FFB3E6'); gl.addColorStop(1, '#B04099');
          g.fillStyle = gl; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
          Art.round(g, bx - 42, by - 100, 84, 100, 14); g.fill(); g.stroke();
          g.fillStyle = '#E8E4F5'; Art.round(g, bx - 15, by - 126, 30, 26, 4); g.fill(); g.stroke();
          // A cloud whose edge grows like the square root of time: random walks do that.
          const spread = ease.out(seg(p, 0.05, 1));
          for (let i = 0; i < 44; i++) {
            const a = (rand(i + 1) - 0.5) * Math.PI * 0.9 - 0.2;
            const d = Math.sqrt(rand(i * 2 + 3)) * 600 * spread;
            const x = bx + 8 + Math.cos(a) * d + wander(i, t) * 16, y = 234 + Math.sin(a) * d * 0.3 + wander(i + 9, t) * 16;
            Art.ball(g, x, y, 7, C.pink);
          }
          Art.moe(g, 696, 412, 170, spread > 0.75 ? 'wow' : 'happy', { t, flip: true });
          Art.bubble(g, 'Smells like roses.', 650, 196, { w: 220, side: 'down', alpha: seg(p, 0.76, 0.92) });
          Art.text(g, 'perfume molecules', 330, 40, { size: 26, color: C.pink, alpha: seg(p, 0.3, 0.5), halo: true });
        },
      },
      {
        say: 'The molecules fly at hundreds of meters per second, so why does it take minutes? In air, each one suffers <b>billions of collisions every second</b>, with just about 70 nm between hits. Its path is a tangled zigzag.',
        speak: 'The molecules fly at hundreds of meters per second, so why does it take minutes? In air, each one suffers billions of collisions every second, with just about 70 nanometers between hits. Its path is a tangled zigzag.',
        dur: 4,
        draw(g, p, t) {
          const ox = 230, oy = 196;
          const n = Math.floor(lerp(1, ZIG.length - 1, ease.inOut(seg(p, 0.03, 0.8))));
          g.strokeStyle = C.pink; g.lineWidth = 3.5; g.lineJoin = 'round';
          g.beginPath();
          for (let i = 0; i <= n; i++) { const x = ox + ZIG[i][0], y = oy + ZIG[i][1]; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
          g.stroke();
          for (let i = 1; i <= n; i += 2) spark(g, ox + ZIG[i][0], oy + ZIG[i][1], 0.55, 0.75);
          const cur = ZIG[n];
          Art.atom(g, ox + cur[0], oy + cur[1], 18, 'C', { label: false, face: 'wow', t });
          Art.ball(g, ox, oy, 7, C.sun);
          Art.text(g, 'start', ox, oy + 26, { size: 22, color: C.sun, halo: true });
          // Compare to a straight flight.
          const a = seg(p, 0.5, 0.75);
          if (a > 0) {
            Art.arrow(g, 40, 420, 760, 420, { color: C.leaf, w: 7, p: a });
            Art.text(g, 'if nothing got in the way, it would cross the room in a blink', 400, 390, { size: 22, color: C.leaf, alpha: a, halo: true });
          }
          const c = seg(p, 0.1, 0.3);
          Art.text(g, 'about 200 m/s', 610, 56, { font: 'display', size: 32, color: C.sun, alpha: c });
          Art.text(g, 'but getting nowhere fast', 610, 94, { size: 25, alpha: seg(p, 0.45, 0.65) });
          Art.text(g, 'billions of hits a second', 610, 176, { size: 25, color: C.pink, alpha: seg(p, 0.25, 0.45) });
          Art.text(g, 'about 70 nm between hits', 610, 214, { size: 25, color: C.pink, alpha: seg(p, 0.3, 0.5) });
        },
      },
      {
        say: 'A classic demonstration. Cotton balls soaked in ammonia and hydrochloric acid sit at opposite ends of a tube. The gases meet and form a white ring of $\\ce{NH4Cl}$. Look where the ring appears.',
        speak: 'A classic demonstration. Cotton balls soaked in ammonia and hydrochloric acid sit at opposite ends of a tube. The gases meet and form a white ring of ammonium chloride. Look where the ring appears.',
        dur: 4.4,
        draw(g, p, t) {
          const x0 = 80, x1 = 720, y = 214, len = x1 - x0;
          const ringF = 0.594;
          const q = ease.inOut(seg(p, 0.08, 0.82));
          const nh3X = x0 + len * ringF * q, hclX = x1 - len * (1 - ringF) * q;
          // Gas fronts.
          for (let i = 0; i < 18; i++) {
            const f = rand(i + 2);
            Art.molecule(g, lerp(x0 + 18, Math.max(nh3X - 10, x0 + 18), f), y + (rand(i + 7) - 0.5) * 66 + wander(i, t) * 3, 13, 'NH3', { rot: t + i, style: 'fill', atomScale: 1.2, labels: false });
            Art.molecule(g, lerp(x1 - 18, Math.min(hclX + 10, x1 - 18), f), y + (rand(i + 13) - 0.5) * 66 + wander(i + 3, t) * 3, 15, 'HCl', { rot: -t + i, style: 'fill', atomScale: 1.2, labels: false });
          }
          // White ring.
          const rq = seg(p, 0.8, 0.95);
          if (rq > 0) {
            const rx = x0 + len * ringF;
            g.fillStyle = Art.alpha('#FFFFFF', 0.92 * rq);
            g.beginPath(); g.ellipse(rx, y, 14, 46, 0, 0, TAU); g.fill();
            Art.glow(g, rx, y, 60, '#FFFFFF', 0.5 * rq);
            Art.text(g, 'NH₄Cl ring', rx, y + 96, { font: 'display', size: 30, color: '#fff', alpha: rq });
          }
          // The tube, drawn over the gas.
          g.strokeStyle = 'rgba(18,7,40,.7)'; g.lineWidth = 8; g.lineCap = 'round';
          g.beginPath(); g.moveTo(x0, y - 50); g.lineTo(x1, y - 50); g.moveTo(x0, y + 50); g.lineTo(x1, y + 50); g.stroke();
          g.strokeStyle = C.glass; g.lineWidth = 4;
          g.beginPath(); g.moveTo(x0, y - 50); g.lineTo(x1, y - 50); g.moveTo(x0, y + 50); g.lineTo(x1, y + 50); g.stroke();
          // Cotton plugs.
          const cotton = (x) => { for (let i = 0; i < 9; i++) { g.fillStyle = '#F5F2FA'; g.beginPath(); g.arc(x + (rand(i + x) - 0.5) * 26, y + (rand(i * 2 + x) - 0.5) * 78, 16, 0, TAU); g.fill(); } };
          cotton(x0 - 2); cotton(x1 + 2);
          Art.formula(g, 'NH3', x0 + 26, y - 106, { size: 34, colorize: true, halo: true });
          Art.text(g, '17.03 g/mol', x0 + 26, y - 70, { size: 21, color: C.dim });
          Art.formula(g, 'HCl', x1 - 26, y - 106, { size: 34, colorize: true, halo: true });
          Art.text(g, '36.46 g/mol', x1 - 26, y - 70, { size: 21, color: C.dim });
          Art.text(g, 'Ammonia is lighter, so it travels farther.', 400, 396, { size: 27, alpha: seg(p, 0.86, 1) });
        },
      },
      {
        say: 'Graham\'s law predicts it. Ammonia moves $\\sqrt{36.46/17.03} = 1.46$ times as fast, so the ring forms about <b>59%</b> of the way along, nearer the HCl end. It is only a rough guide, since both gases also have to push through air.',
        speak: 'Graham\'s law predicts it. Ammonia moves 1.46 times as fast, so the ring forms about 59 percent of the way along, nearer the hydrochloric acid end. It is only a rough guide, since both gases also have to push through air.',
        dur: 3.6,
        draw(g, p) {
          const x0 = 70, x1 = 730, len = x1 - x0, y = 300;
          const a = seg(p, 0.05, 0.25);
          Art.text(g, 'speed ratio', 200, 60, { size: 26, color: C.dim, alpha: a });
          frac(g, 'rate of NH₃', 'rate of HCl', 400, 60, { size: 26, alpha: a });
          Art.text(g, '= 1.46', 600, 62, { font: 'display', size: 40, color: C.sun, alpha: a });
          const q = ease.inOut(seg(p, 0.25, 0.8));
          const L = len * 0.594 * q, R = len * 0.406 * q;
          g.fillStyle = 'rgba(255,255,255,.08)'; Art.round(g, x0, y - 34, len, 68, 34); g.fill();
          g.fillStyle = Art.elementColor('N'); g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
          Art.round(g, x0, y - 34, Math.max(30, L), 68, 18); g.fill(); g.stroke();
          g.fillStyle = Art.elementColor('Cl');
          Art.round(g, x1 - Math.max(30, R), y - 34, Math.max(30, R), 68, 18); g.fill(); g.stroke();
          const b = seg(p, 0.72, 0.9);
          Art.text(g, '59%', x0 + len * 0.297, y, { font: 'display', size: 44, color: '#fff', alpha: b });
          Art.text(g, '41%', x1 - len * 0.203, y, { font: 'display', size: 44, color: '#0B2A18', alpha: b });
          Art.formula(g, 'NH3', x0 + 40, y - 74, { size: 30, colorize: true, halo: true });
          Art.formula(g, 'HCl', x1 - 40, y - 74, { size: 30, colorize: true, halo: true });
          Art.text(g, 'the ring', x0 + len * 0.594, y + 80, { font: 'display', size: 30, color: C.sun, alpha: b });
          Art.arrow(g, x0 + len * 0.594, y + 58, x0 + len * 0.594, y + 38, { color: C.sun, w: 6, alpha: b });
        },
      },
    ],
  });

  /* ---------- Van der Waals, used by the story and the bench ---------- */
  const VDW = { He: { a: 0.0341, b: 0.0237, f: 'He' }, H2: { a: 0.244, b: 0.0266, f: 'H2' }, N2: { a: 1.39, b: 0.0391, f: 'N2' }, CO2: { a: 3.59, b: 0.0427, f: 'CO2' }, NH3: { a: 4.17, b: 0.0371, f: 'NH3' } };
  const pVdw = (G, T, Vm) => (R_ATM * T) / (Vm - G.b) - G.a / (Vm * Vm);
  const zOf = (G, T, Vm) => (pVdw(G, T, Vm) * Vm) / (R_ATM * T);
  /** Walk in from a large volume and stop if the gas branch ends (the point where it would condense). */
  function zCurve(G, T, pMax) {
    const pts = [];
    let last = -1, endVm = null;
    for (let i = 0; i <= 500; i++) {
      const Vm = 40 * Math.pow((G.b * 1.05) / 40, i / 500);
      const P = pVdw(G, T, Vm);
      if (P < last) { endVm = Vm; break; }
      last = P;
      if (P > pMax) break;
      pts.push([P, (P * Vm) / (R_ATM * T), Vm]);
    }
    return { pts, endVm };
  }

  /* ---------- Story 4: real gases ---------- */
  const miniBox = (g, b, draw) => { boxFill(g, b); g.save(); clipBox(g, b); draw(); g.restore(); boxFrame(g, b); };
  Lab.story('#story-real', {
    title: 'Two small lies in the ideal gas law',
    scenes: [
      {
        say: 'The ideal law works beautifully when a gas is <b>spread out and hot</b>. Squeeze it hard and cool it down, and it starts to go wrong by a lot. Two postulates are to blame.',
        dur: 3.2,
        draw(g, p, t) {
          const A = { x0: 40, x1: 370, y0: 56, y1: 340 }, B = { x0: 430, x1: 760, y0: 56, y1: 340 };
          const a = ease.out(seg(p, 0.05, 0.3)), b = ease.out(seg(p, 0.3, 0.55));
          g.save(); g.globalAlpha *= a;
          miniBox(g, A, () => gasField(g, A, 6, steady(t, 210, 250, 210), { seed: 4, bond: 14, r: 18 }));
          Art.text(g, 'low pressure, high temperature', 205, 372, { size: 23 });
          Art.text(g, 'almost perfectly ideal', 205, 410, { font: 'display', size: 28, color: C.leaf });
          g.restore();
          g.save(); g.globalAlpha *= b;
          miniBox(g, B, () => {
            const pts = [];
            for (let i = 0; i < 26; i++) {
              const q = gasAt(i, steady(t, 36, 250, 210), B, 16, 22);
              pts.push(q);
            }
            g.strokeStyle = 'rgba(47,214,242,.45)'; g.lineWidth = 3; g.setLineDash([5, 6]);
            pts.forEach((q, i) => pts.slice(i + 1).forEach((u) => { if (Math.hypot(q.x - u.x, q.y - u.y) < 62) { g.beginPath(); g.moveTo(q.x, q.y); g.lineTo(u.x, u.y); g.stroke(); } }));
            g.setLineDash([]);
            pts.forEach((q, i) => particle(g, 'N2', q.x, q.y, 16, rand(i) * 6 + t * 0.3));
          });
          Art.text(g, 'high pressure, low temperature', 595, 372, { size: 23 });
          Art.text(g, 'not ideal at all', 595, 410, { font: 'display', size: 28, color: C.red });
          g.restore();
        },
      },
      {
        say: 'First lie: particles have no volume. They do. In a squeezed gas they block part of the box, so the <b>free space is smaller than V</b>. Less room means more hits, so the real pressure runs <b>higher</b> than ideal.',
        dur: 3.8,
        draw(g, p, t) {
          const b = { x0: 40, x1: 370, y0: 56, y1: 386 };
          miniBox(g, b, () => {
            const N = 15;
            for (let i = 0; i < N; i++) {
              const col = i % 5, row = Math.floor(i / 5);
              const x = b.x0 + 54 + col * 56 + wander(i, t * 1.5) * 6, y = b.y0 + 68 + row * 96 + wander(i + 8, t * 1.5) * 6;
              const rG = lerp(0, 30, seg(p, 0.15, 0.4));
              if (rG > 0) { g.fillStyle = 'rgba(255,90,107,.28)'; g.beginPath(); g.arc(x, y, rG, 0, TAU); g.fill(); }
              Art.molecule(g, x, y, 20, 'N2', { rot: i + t * 0.4, style: 'fill', atomScale: 1.2, labels: false });
            }
          });
          Art.text(g, 'taken by the molecules', 205, 416, { size: 24, color: '#FF8A94', alpha: seg(p, 0.25, 0.45) });
          // Volume bar: V split into blocked and free.
          const bx = 420, bw = 340;
          const a = seg(p, 0.4, 0.6);
          g.save(); g.globalAlpha *= a;
          Art.text(g, 'the box: V', bx, 88, { size: 25, align: 'left' });
          g.fillStyle = C.cyan; Art.round(g, bx, 106, bw, 42, 10); g.fill();
          g.fillStyle = 'rgba(255,90,107,.9)'; Art.round(g, bx + bw - 80, 106, 80, 42, 10); g.fill();
          Art.text(g, 'V − nb', bx + (bw - 80) / 2, 127, { font: 'display', size: 28, color: '#0B2A18' });
          Art.text(g, 'nb', bx + bw - 40, 127, { font: 'display', size: 28, color: '#fff' });
          g.restore();
          // Pressure bars.
          const c = ease.out(seg(p, 0.6, 0.85));
          Art.text(g, 'ideal P', bx, 216, { size: 25, align: 'left', alpha: c });
          g.fillStyle = 'rgba(255,255,255,.3)'; Art.round(g, bx + 96, 198, 190 * c, 36, 10); g.fill();
          Art.text(g, 'real P', bx, 274, { size: 25, align: 'left', alpha: c });
          g.fillStyle = C.pink; Art.round(g, bx + 96, 256, 240 * c, 36, 10); g.fill();
          Art.text(g, 'higher!', bx + 180, 348, { font: 'display', size: 40, color: C.pink, alpha: seg(p, 0.82, 0.96) });
        },
      },
      {
        say: 'Second lie: particles ignore each other. They do not. A particle about to hit the wall gets tugged <b>back</b> by its neighbors, so it hits more softly. That makes the real pressure <b>lower</b> than ideal.',
        dur: 3.8,
        draw(g, p, t) {
          const wall = 420;
          const lane = (y, tug, a) => {
            if (a <= 0) return;
            g.save(); g.globalAlpha *= a;
            const u = ((t * 0.32 + (tug ? 0 : 0.1)) % 1);
            const f = ease.in(u);
            const x = lerp(170, wall - 36, f);
            if (tug) {
              const nb = [[x - 96, y - 44], [x - 112, y + 34], [x - 66, y + 54]];
              g.strokeStyle = C.cyan; g.lineWidth = 3.5; g.setLineDash([6, 6]);
              nb.forEach(([nx, ny]) => { g.beginPath(); g.moveTo(x, y); g.lineTo(nx, ny); g.stroke(); });
              g.setLineDash([]);
              nb.forEach(([nx, ny], i) => Art.molecule(g, nx, ny, 22, 'N2', { rot: i + t * 0.3, style: 'fill', atomScale: 1.2, labels: false }));
              Art.arrow(g, x - 26, y - 34, x - 86, y - 34, { color: C.red, w: 6 });
            }
            Art.molecule(g, x, y, 26, 'N2', { rot: t * 1.1, style: 'fill', atomScale: 1.2, labels: false, face: tug ? 'sad' : 'happy', faceAll: false, t });
            if (u > 0.88) spark(g, wall, y, (u - 0.88) / 0.12, tug ? 0.7 : 1.9);
            g.restore();
          };
          // A permanent wall.
          g.fillStyle = '#FF7ABB'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
          g.fillRect(wall, 30, 22, 390); g.strokeRect(wall, 30, 22, 390);
          lane(126, false, seg(p, 0.05, 0.25));
          lane(310, true, seg(p, 0.3, 0.5));
          Art.text(g, 'alone: a hard hit', 480, 126 - 40, { size: 26, align: 'left', color: C.sun, alpha: seg(p, 0.1, 0.3) });
          Art.text(g, 'tugged: a soft hit', 480, 310 - 86, { size: 26, align: 'left', color: C.sun, alpha: seg(p, 0.35, 0.55) });
          const c = ease.out(seg(p, 0.6, 0.85));
          Art.text(g, 'ideal P', 480, 280, { size: 25, align: 'left', alpha: c });
          g.fillStyle = 'rgba(255,255,255,.3)'; Art.round(g, 572, 262, 190 * c, 36, 10); g.fill();
          Art.text(g, 'real P', 480, 336, { size: 25, align: 'left', alpha: c });
          g.fillStyle = C.cyan; Art.round(g, 572, 318, 118 * c, 36, 10); g.fill();
          Art.text(g, 'lower!', 620, 394, { font: 'display', size: 40, color: C.cyan, alpha: seg(p, 0.82, 0.96) });
        },
      },
      {
        say: 'Johannes van der Waals patched both lies. Add a term for lost pressure, subtract a term for lost volume. The constant <b>a</b> measures stickiness. The constant <b>b</b> measures size. Each gas has its own.',
        dur: 3.8,
        draw(g, p) {
          const y = 124;
          const a0 = seg(p, 0.03, 0.2), a1 = seg(p, 0.24, 0.42), a2 = seg(p, 0.5, 0.68);
          Art.text(g, '(', 40, y, { font: 'display', size: 76, alpha: a0 });
          Art.text(g, 'P', 92, y, { font: 'display', size: 64, color: C.ink, alpha: a0 });
          Art.text(g, '+', 150, y, { font: 'display', size: 54, color: C.cyan, alpha: a1 });
          Art.text(g, 'a', 204, y, { font: 'display', size: 62, color: C.cyan, alpha: a1 });
          frac(g, 'n²', 'V²', 268, y, { size: 38, color: C.cyan, alpha: a1 });
          Art.text(g, ')(', 336, y, { font: 'display', size: 76, alpha: a0 });
          Art.text(g, 'V', 402, y, { font: 'display', size: 64, alpha: a0 });
          Art.text(g, '−', 462, y, { font: 'display', size: 54, color: C.pink, alpha: a2 });
          Art.text(g, 'nb', 526, y, { font: 'display', size: 62, color: C.pink, alpha: a2 });
          Art.text(g, ')', 586, y, { font: 'display', size: 76, alpha: a0 });
          Art.text(g, '= nRT', 684, y, { font: 'display', size: 56, color: C.sun, alpha: a0 });
          // Explanations.
          g.save(); g.globalAlpha *= a1;
          Art.arrow(g, 210, 222, 210, 178, { color: C.cyan, w: 6 });
          g.fillStyle = 'rgba(47,214,242,.14)'; Art.round(g, 30, 232, 350, 180, 18); g.fill();
          Art.text(g, 'attractions', 205, 268, { font: 'display', size: 32, color: C.cyan });
          Art.text(g, 'Sticky molecules hit softly,', 205, 312, { size: 23 });
          Art.text(g, 'so add pressure back.', 205, 344, { size: 23 });
          Art.text(g, 'Large a: very sticky', 205, 382, { size: 23, color: C.dim });
          g.restore();
          g.save(); g.globalAlpha *= a2;
          Art.arrow(g, 520, 222, 520, 178, { color: C.pink, w: 6 });
          g.fillStyle = 'rgba(255,79,163,.14)'; Art.round(g, 420, 232, 350, 180, 18); g.fill();
          Art.text(g, 'molecule size', 595, 268, { font: 'display', size: 32, color: C.pink });
          Art.text(g, 'Molecules block space,', 595, 312, { size: 23 });
          Art.text(g, 'so subtract that volume.', 595, 344, { size: 23 });
          Art.text(g, 'Large b: bulky molecules', 595, 382, { size: 23, color: C.dim });
          g.restore();
        },
      },
      {
        say: 'To measure the damage, use the <b>compressibility factor</b> $Z = PV/nRT$. An ideal gas always gives exactly 1. A dip means attractions are winning. A rise means size is winning. Helium is so small and unsticky that it hardly dips at all.',
        speak: 'To measure the damage, use the compressibility factor, Z equals P V over n R T. An ideal gas always gives exactly 1. A dip means attractions are winning. A rise means size is winning. Helium is so small and unsticky that it hardly dips at all.',
        dur: 4,
        draw(g, p) {
          const b = { x: 74, y: 28, w: 690, h: 356 };
          const A = axes(g, b, { xmin: 0, xmax: 800, ymin: 0.2, ymax: 2.2, xticks: [200, 400, 600], yticks: [0.5, 1, 1.5, 2], xlabel: 'pressure (atm)', ylabel: 'Z', yfmt: (v) => v.toFixed(1), yc: C.sun });
          // Ideal line.
          const a0 = seg(p, 0.02, 0.2);
          g.save(); g.globalAlpha *= a0; g.setLineDash([12, 9]); g.strokeStyle = '#fff'; g.lineWidth = 3.5;
          g.beginPath(); g.moveTo(A.X(0), A.Y(1)); g.lineTo(A.X(800), A.Y(1)); g.stroke(); g.restore();
          Art.text(g, 'ideal gas: Z = 1', A.X(640), A.Y(1) + 24, { size: 23, alpha: a0, halo: true });
          const curves = [[VDW.He, 300, C.cyan, 'He'], [VDW.N2, 300, '#7DA2FF', 'N₂'], [VDW.CO2, 350, C.pink, 'CO₂']];
          g.save(); g.beginPath(); g.rect(b.x, b.y, b.w, b.h); g.clip();
          curves.forEach(([G, T, col], i) => {
            const q = seg(p, 0.15 + i * 0.16, 0.42 + i * 0.16);
            if (q <= 0) return;
            const { pts } = zCurve(G, T, 800);
            const n = Math.floor(pts.length * q);
            g.strokeStyle = col; g.lineWidth = 5; g.lineJoin = 'round'; g.beginPath();
            for (let k = 0; k < n; k++) { const x = A.X(pts[k][0]), y = A.Y(pts[k][1]); if (k) g.lineTo(x, y); else g.moveTo(x, y); }
            g.stroke();
          });
          g.restore();
          const lab2 = seg(p, 0.72, 0.9);
          Art.text(g, 'He', A.X(250), A.Y(1.42), { font: 'display', size: 28, color: C.cyan, alpha: lab2, halo: true });
          Art.text(g, 'N₂', A.X(655), A.Y(1.86), { font: 'display', size: 28, color: '#7DA2FF', alpha: lab2, halo: true });
          Art.text(g, 'CO₂', A.X(350), A.Y(0.68), { font: 'display', size: 28, color: C.pink, alpha: lab2, halo: true });
          Art.text(g, 'attractions win', A.X(165), A.Y(0.34), { font: 'display', size: 25, color: C.sun, alpha: seg(p, 0.8, 0.95), halo: true });
          Art.text(g, 'size wins', A.X(560), A.Y(2.05), { font: 'display', size: 25, color: C.sun, alpha: seg(p, 0.85, 1), halo: true });
        },
      },
    ],
  });

  /* ---------- Bench: ideal or real? ---------- */
  const RB = { x0: 22, y0: 30, x1: 322, y1: 330 };
  const realS = { gas: 'CO2', u: 62, T: 400, box: new Sim.Box({ x0: RB.x0 + 3, y0: RB.y0 + 3, x1: RB.x1 - 3, y1: RB.y1 - 3, speed: 150, seed: 51 }), rShown: 8 };
  const vmOf = (u) => 0.06 * Math.pow(25 / 0.06, u / 100);
  realS.box.add({ n: 28, r: 8, kind: 'gas', mass: 1 });
  const realState = () => {
    const G = VDW[realS.gas], Vm = vmOf(realS.u), T = realS.T;
    const curve = zCurve(G, T, 800);
    const condenses = curve.endVm !== null && Vm <= curve.endVm;
    const Pi = (R_ATM * T) / Vm;
    const Pr = pVdw(G, T, Vm);
    return { G, Vm, T, Pi, Pr, Z: (Pr * Vm) / (R_ATM * T), condenses, curve };
  };
  const realStage = Lab.stage('#c-real', {
    h: 450,
    label: 'A zoomed view of gas molecules beside a graph of the compressibility factor Z against pressure, with a dot at the current state.',
    draw(g, t, dt) {
      const s = realState(), G = s.G;
      // Molecules fill a share of the frame that tracks b / Vm. Attraction lines grow with a and with cooling.
      const phi = clamp((1.5 * G.b) / s.Vm, 0.0, 0.62);
      const area = (RB.x1 - RB.x0) * (RB.y1 - RB.y0), N = realS.box.particles.length;
      const rTarget = clamp(Math.sqrt((phi * area) / (N * Math.PI)), 6, 26);
      realS.rShown = dt ? lerp(realS.rShown, rTarget, clamp(dt * 6)) : rTarget;
      const P = realS.box.particles;
      P.forEach((q) => { q.r = realS.rShown; });
      const spd = 150 * Math.sqrt(s.T / 300);
      if (dt) {
        realS.box.step(dt / 2); realS.box.step(dt / 2);
        let e = 0; for (const q of P) e += q.vx * q.vx + q.vy * q.vy;
        const k = (spd * Math.sqrt(P.length)) / Math.sqrt(e);
        for (const q of P) { q.vx *= k; q.vy *= k; }
      }
      boxFill(g, RB, 10);
      g.save(); clipBox(g, RB, 10);
      const stick = clamp((G.a / 4.17) * (450 / s.T));
      const reach = realS.rShown * 3.4;
      if (stick > 0.03) {
        g.lineWidth = 3; g.setLineDash([5, 6]); g.strokeStyle = Art.alpha(C.cyan, 0.2 + 0.6 * stick);
        for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
          const d = Math.hypot(P[i].x - P[j].x, P[i].y - P[j].y);
          if (d < reach) { g.beginPath(); g.moveTo(P[i].x, P[i].y); g.lineTo(P[j].x, P[j].y); g.stroke(); }
        }
        g.setLineDash([]);
      }
      const bond = realS.rShown * 1.05;
      P.forEach((q) => particle(g, G.f, q.x, q.y, G.f === 'He' ? realS.rShown * 1.15 : bond, q.rot * 3));
      g.restore();
      boxFrame(g, RB, 10);
      Art.text(g, s.condenses ? 'condensing!' : s.Z < 0.985 ? 'attractions win' : s.Z > 1.015 ? 'size wins' : 'nearly ideal', (RB.x0 + RB.x1) / 2, 362, { font: 'display', size: 30, color: s.condenses ? C.cyan : Math.abs(s.Z - 1) < 0.015 ? C.leaf : C.sun });
      // Two pressure bars, on a shared scale.
      const pMaxBar = Math.max(s.Pi, s.condenses ? 0 : s.Pr, 1e-6) * 1.02;
      const bar = (y, label, v, col) => {
        Art.text(g, label, RB.x0, y, { size: 21, align: 'left', color: C.dim });
        g.fillStyle = 'rgba(255,255,255,.1)'; Art.round(g, RB.x0 + 62, y - 12, 238, 24, 12); g.fill();
        g.fillStyle = col; Art.round(g, RB.x0 + 62, y - 12, Math.max(24, (Math.max(v, 0) / pMaxBar) * 238), 24, 12); g.fill();
      };
      bar(398, 'ideal', s.Pi, C.cyan);
      if (!s.condenses) bar(430, 'real', s.Pr, C.pink);
      // The Z graph.
      const b = { x: 396, y: 30, w: 380, h: 366 };
      const A = axes(g, b, { xmin: 0, xmax: 800, ymin: 0, ymax: 2.2, xticks: [0, 200, 400], yticks: [0.5, 1, 1.5, 2], yfmt: (v) => v.toFixed(1), ylabel: 'Z', xlabel: 'P (atm)', yc: C.sun });
      g.save(); g.setLineDash([10, 8]); g.strokeStyle = '#fff'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(A.X(0), A.Y(1)); g.lineTo(A.X(800), A.Y(1)); g.stroke(); g.restore();
      Art.text(g, 'ideal', A.X(770), A.Y(1) + 20, { size: 21, color: '#fff', align: 'right', halo: true });
      g.save(); g.beginPath(); g.rect(b.x, b.y, b.w, b.h); g.clip();
      g.strokeStyle = C.pink; g.lineWidth = 5; g.lineJoin = 'round'; g.beginPath();
      s.curve.pts.forEach((pt, i) => { const x = A.X(pt[0]), y = A.Y(pt[1]); if (i) g.lineTo(x, y); else g.moveTo(x, y); });
      g.stroke();
      g.restore();
      // End-of-curve note for a gas that condenses.
      if (s.curve.endVm !== null && s.curve.pts.length) {
        const e = s.curve.pts[s.curve.pts.length - 1];
        Art.ring(g, A.X(e[0]), A.Y(e[1]), 12, { color: C.cyan, w: 4 });
        Art.text(g, 'liquid by here', clamp(A.X(e[0]) + 16, b.x + 8, b.x + b.w - 130), A.Y(e[1]) + 28, { size: 22, align: 'left', color: C.cyan, halo: true });
      }
      if (!s.condenses) {
        const px = s.Pr, py = s.Z;
        if (px <= 800 && px >= 0 && py <= 2.2) {
          Art.glow(g, A.X(px), A.Y(py), 26, C.sun, 0.8);
          Art.ball(g, A.X(px), A.Y(py), 11, C.sun);
        } else Art.pill(g, 'off this chart', b.x + b.w - 90, b.y + 26, { size: 22, color: C.plum2, text: '#fff' });
      }
      void t;
    },
  });
  function paintReal() {
    const s = realState();
    const fm = (x) => (x >= 100 ? Lab.fmt(x, 0) : Lab.fmt(x, 2));
    Lab.$('#real-pi').textContent = fm(s.Pi) + ' atm';
    Lab.$('#real-pr').textContent = s.condenses ? 'Liquid forms' : fm(s.Pr) + ' atm';
    Lab.$('#real-z').textContent = s.condenses ? '—' : s.Z.toFixed(3);
    const tip = s.condenses
      ? 'At this temperature the gas would <b>condense</b> before reaching this volume, so the gas equations stop applying. Raise the temperature to get back to a gas.'
      : s.Z > 1.015 ? `$Z$ is above 1, so the molecules' <b>size</b> is pushing the pressure above the ideal value.`
        : s.Z < 0.985 ? `$Z$ is below 1, so <b>attractions</b> are pulling the pressure below the ideal value.`
          : `$Z$ is about 1, so this gas is behaving <b>almost ideally</b> here. Can you find a state where the ideal law is off by more than 20%?`;
    const eq = s.condenses ? '' : `<div class="calc-line" data-overflow-ok style="overflow-x:auto">$$P = \\dfrac{nRT}{V - nb} - a\\dfrac{n^2}{V^2} = \\dfrac{(0.08206)(${s.T})}{${s.Vm.toPrecision(3)} - ${s.G.b}} - \\dfrac{${s.G.a}}{(${s.Vm.toPrecision(3)})^2} = ${fm(s.Pr).replace(/,/g, '')}\\text{ atm}$$</div>`;
    Lab.$('#real-foot').innerHTML = Lab.texString(`<p>${tip}</p>${eq}`);
    realStage.redraw();
  }
  Lab.segmented('#real-gas', (v) => { realS.gas = v; paintReal(); });
  Lab.bind('#real-v', '#real-v-out', (v) => { const V = vmOf(v); return (V >= 1 ? V.toFixed(1) : V.toFixed(3)) + ' L'; }, (v) => { realS.u = v; paintReal(); });
  Lab.bind('#real-t', '#real-t-out', (v) => `${v} K`, (v) => { realS.T = v; paintReal(); });
});
