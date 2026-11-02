/* Lesson 6.2: Calorimetry. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const TAU = Math.PI * 2;
  const CW = 4.184;
  const EXO = C.fire, ENDO = C.cyan;
  const tri = (x) => { const f = x - Math.floor(x); return f < 0.5 ? f * 2 : 2 - f * 2; };
  const fmtQ = (j) => (j > 0 ? '+' : j < 0 ? '−' : '') + (Math.abs(j) < 1000 ? Math.round(Math.abs(j)) + ' J' : Lab.fmt(Math.abs(j) / 1000, 2) + ' kJ');

  /* ---------- Drawing helpers for this lesson ---------- */

  /** A fat arrow of heat with chevrons that run in the direction of flow. Heat is always this color. */
  function heatArrow(g, x1, y1, x2, y2, t, o = {}) {
    const p = o.p === undefined ? 1 : clamp(o.p);
    if (p <= 0) return;
    const w = o.w || 20, head = o.head || w * 1.25;
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, L = len * p;
    const bodyEnd = Math.max(0, L - head);
    g.save();
    g.translate(x1, y1); g.rotate(Math.atan2(dy, dx));
    if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
    g.beginPath();
    g.moveTo(0, -w / 2); g.lineTo(bodyEnd, -w / 2); g.lineTo(bodyEnd, -w); g.lineTo(L, 0); g.lineTo(bodyEnd, w); g.lineTo(bodyEnd, w / 2); g.lineTo(0, w / 2); g.closePath();
    const gr = g.createLinearGradient(0, 0, L, 0);
    gr.addColorStop(0, '#E0561B'); gr.addColorStop(1, '#FFB23F');
    g.fillStyle = gr; g.fill();
    g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5; g.stroke();
    g.clip();
    const gap = 30, off = (t * 54) % gap;
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = Math.max(3, w * 0.2); g.lineCap = 'round'; g.lineJoin = 'round';
    for (let s = off - gap; s < L; s += gap) {
      g.beginPath(); g.moveTo(s - w * 0.32, -w * 0.32); g.lineTo(s, 0); g.lineTo(s - w * 0.32, w * 0.32); g.stroke();
    }
    g.restore();
  }
  function drift(i, t, speed, x0, y0, x1, y1) {
    const wx = Math.max(1, x1 - x0), wy = Math.max(1, y1 - y0);
    const sx = speed * (0.7 + rand(i + 3.1) * 0.6), sy = speed * (0.7 + rand(i + 7.3) * 0.6);
    return [x0 + tri(rand(i + 1.7) + (t * sx) / (2 * wx)) * wx, y0 + tri(rand(i + 5.9) + (t * sy) / (2 * wy)) * wy];
  }
  function buzzing(g, n, t, speed, box, f, s, seed = 0) {
    const [x0, y0, x1, y1] = box;
    for (let i = 0; i < n; i++) {
      const id = i * 3 + seed;
      const [x, y] = drift(id, t, speed, x0, y0, x1, y1);
      if (speed > 70) {
        const [px, py] = drift(id, t - 0.07, speed, x0, y0, x1, y1);
        if (Math.hypot(px - x, py - y) < speed * 0.2) {
          g.strokeStyle = 'rgba(247,242,255,.24)'; g.lineWidth = 6; g.lineCap = 'round';
          g.beginPath(); g.moveTo(px, py); g.lineTo(x, y); g.stroke();
        }
      }
      Art.molecule(g, x, y, s, f, { rot: rand(id) * TAU + t * (0.3 + speed * 0.012) * (i % 2 ? 1 : -1), labels: false, style: 'fill', atomScale: 1.28 });
    }
  }
  function packet(g, x, y, r = 11, a = 1) {
    if (a <= 0) return;
    const prev = g.globalAlpha;
    g.globalAlpha = prev * a;
    Art.glow(g, x, y, r * 2.6, C.fire, 0.6);
    Art.ball(g, x, y, r, '#FFA63D');
    g.globalAlpha = prev;
  }
  /** Marching dashed line. This is always the system boundary. */
  function sysLine(g, build, t, a = 1, fill = true) {
    g.save(); g.globalAlpha *= a;
    build();
    if (fill) { g.fillStyle = Art.alpha(C.pink, 0.14); g.fill(); }
    g.strokeStyle = C.pink; g.lineWidth = 4.5; g.setLineDash([12, 9]); g.lineDashOffset = -t * 24; g.stroke();
    g.restore();
  }
  /** Nested foam cups in cutaway. Returns the water box. inside() is clipped to the water. */
  function foamCup(g, cx, base, w, h, o = {}) {
    const top = base - h, bw = w * 0.74, wall = o.wall || Math.max(14, w * 0.082);
    const xL = (y) => cx - lerp(bw / 2, w / 2, (base - y) / h);
    const xR = (y) => cx + lerp(bw / 2, w / 2, (base - y) / h);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(cx, base + 3, w * 0.48, 11, 0, 0, TAU); g.fill();
    const outer = new Path2D();
    outer.moveTo(xL(top), top); outer.lineTo(xL(base) + 4, base - 4); outer.quadraticCurveTo(xL(base), base, xL(base) + 8, base);
    outer.lineTo(xR(base) - 8, base); outer.quadraticCurveTo(xR(base), base, xR(base) - 4, base - 4); outer.lineTo(xR(top), top); outer.closePath();
    const foam = g.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
    foam.addColorStop(0, '#FFFDF6'); foam.addColorStop(0.6, '#EFE9DB'); foam.addColorStop(1, '#C4BBA8');
    g.fillStyle = foam; g.fill(outer);
    g.save(); g.clip(outer);
    for (let i = 0; i < 70; i++) {
      g.fillStyle = `rgba(150,130,100,${0.12 + rand(i + 2) * 0.22})`;
      g.beginPath(); g.arc(cx - w / 2 + rand(i + 5) * w, top + rand(i + 9) * h, 1.2 + rand(i) * 2.2, 0, TAU); g.fill();
    }
    g.restore();
    g.strokeStyle = '#1A0F2E'; g.lineWidth = 3; g.stroke(outer);
    const inner = new Path2D();
    inner.moveTo(xL(top) + wall, top); inner.lineTo(xL(base - wall) + wall, base - wall); inner.lineTo(xR(base - wall) - wall, base - wall); inner.lineTo(xR(top) - wall, top); inner.closePath();
    g.fillStyle = '#21133D'; g.fill(inner);
    const level = o.level === undefined ? 0.7 : o.level;
    const surface = base - wall - (h - wall - 6) * level;
    const box = { x0: xL(surface) + wall, x1: xR(surface) - wall, xB0: xL(base - wall) + wall, xB1: xR(base - wall) - wall, top: surface, bottom: base - wall, rim: top, cx };
    g.save(); g.clip(inner);
    const wat = g.createLinearGradient(0, surface, 0, base - wall);
    const warm = o.warm || 0;
    wat.addColorStop(0, Art.mix('#6FD0F7', warm > 0 ? '#FFC9A0' : '#D8F6FF', Math.abs(warm)));
    wat.addColorStop(1, Art.mix('#1F7FC4', warm > 0 ? '#7B6FC4' : '#6FC8F0', Math.abs(warm)));
    g.fillStyle = wat; g.fillRect(cx - w, surface, w * 2, base - surface);
    if (o.inside) o.inside(g, box);
    g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(cx - w, surface, w * 2, 4);
    g.restore();
    g.strokeStyle = 'rgba(18,7,40,.7)'; g.lineWidth = 2.5; g.stroke(inner);
    // Seam that shows the two nested cups.
    g.strokeStyle = 'rgba(140,120,90,.55)'; g.lineWidth = 2;
    [[xL(top) + wall / 2, xL(base - 6) + wall / 2], [xR(top) - wall / 2, xR(base - 6) - wall / 2]].forEach(([a, b]) => { g.beginPath(); g.moveTo(a, top + 2); g.lineTo(b, base - 6); g.stroke(); });
    return box;
  }
  function lid(g, cx, y, w) {
    const l = g.createLinearGradient(0, y, 0, y + 22);
    l.addColorStop(0, '#FFFDF6'); l.addColorStop(1, '#CFC6B4');
    g.fillStyle = l; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    Art.round(g, cx - w / 2 - 12, y, w + 24, 22, 9); g.fill(); g.stroke();
  }
  function stirrer(g, x, topY, botY, t) {
    const dy = Math.sin(t * 3) * 7;
    g.strokeStyle = '#D8D2EA'; g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, topY + dy); g.lineTo(x, botY + dy); g.stroke();
    g.lineWidth = 4.5; g.beginPath(); g.ellipse(x, botY + dy, 20, 6.5, 0, 0, TAU); g.stroke();
    g.fillStyle = C.sun; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5; g.beginPath(); g.arc(x, topY + dy - 3, 8, 0, TAU); g.fill(); g.stroke();
  }
  /** A probe thermometer with a digital reading. */
  function probe(g, x, botY, text, o = {}) {
    const boxY = o.boxY, bw = o.w || 126, bh = 52, bx = o.boxX === undefined ? x + 42 : o.boxX;
    g.strokeStyle = '#1A0F2E'; g.lineWidth = 9; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, boxY + bh / 2 - 2); g.lineTo(x, botY); g.stroke();
    g.strokeStyle = '#D8D2EA'; g.lineWidth = 5.5;
    g.beginPath(); g.moveTo(x, boxY + bh / 2 - 2); g.lineTo(x, botY); g.stroke();
    g.fillStyle = '#FF5A6B'; g.beginPath(); g.arc(x, botY, 5.5, 0, TAU); g.fill();
    g.fillStyle = '#3B2F52'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    Art.round(g, bx - bw / 2, boxY - bh / 2, bw, bh, 11); g.fill(); g.stroke();
    g.fillStyle = '#0F2A1E'; Art.round(g, bx - bw / 2 + 6, boxY - bh / 2 + 6, bw - 12, bh - 12, 6); g.fill();
    Art.text(g, text, bx, boxY + 1, { font: 'display', size: o.size || 25, color: '#6CFFAF', maxW: bw - 16 });
  }
  function metalBlock(g, x, y, a, color, hot = 0, t = 0) {
    if (hot > 0) Art.glow(g, x, y, a * 1.3, C.fire, 0.5 * hot);
    const f = g.createLinearGradient(x - a / 2, y - a / 2, x + a / 2, y + a / 2);
    f.addColorStop(0, Art.mix(color, '#ffffff', 0.35)); f.addColorStop(1, Art.mix(color, '#000000', 0.18));
    g.fillStyle = f; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
    Art.round(g, x - a / 2, y - a / 2, a, a, Math.min(7, a * 0.14)); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.35)'; Art.round(g, x - a * 0.36, y - a * 0.38, a * 0.5, a * 0.13, 3); g.fill();
    void t;
  }
  /** The boundary view: metal atoms on the left, water on the right, heat crossing between them. */
  function interfaceView(gg, cx, cy, R, t, sym, Tm, Tw, flow) {
    const amp = 0.8 + clamp((Tm - 20) / 160) * 5;
    const spd = 3 + clamp((Tm - 20) / 160) * 9;
    for (let j = -3; j <= 3; j++) for (let i = -3; i <= 0; i++) {
      const x = cx - 16 + i * 40 + (j % 2 ? 0 : -20), y = cy + j * 37;
      if (Math.hypot(x - cx, y - cy) > R + 12) continue;
      const id = i * 11 + j * 7;
      Art.atom(gg, x + wander(id, t * spd) * amp, y + wander(id + 40, t * spd) * amp, 18, sym, { label: false });
    }
    buzzing(gg, 4, t, 24 + clamp((Tw - 5) / 95) * 170, [cx + 40, cy - R * 0.68, cx + R * 0.74, cy + R * 0.68], 'H2O', 25, 6);
    if (flow > 0) {
      for (let i = 0; i < 4; i++) {
        const u = (t * 0.55 + i / 4) % 1;
        packet(gg, cx - 20 + u * R * 0.82, cy - R * 0.5 + i * (R * 0.33), 9, flow * (1 - u));
      }
    }
  }
  /** Two bars around a zero line. Up is positive, down is negative. They always match. */
  function ledgerBars(g, x1, x2, zeroY, qA, qB, maxQ, maxH, nameA, nameB, labelY) {
    const hA = clamp(Math.abs(qA) / maxQ) * maxH, hB = clamp(Math.abs(qB) / maxQ) * maxH;
    const bar = (x, q, h) => {
      const up = q >= 0;
      const col = up ? C.leaf : C.pink;
      g.fillStyle = col; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
      if (h > 1) { Art.round(g, x - 27, up ? zeroY - h : zeroY, 54, h, 7); g.fill(); g.stroke(); }
    };
    bar(x1, qA, hA); bar(x2, qB, hB);
    g.strokeStyle = C.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(x1 - 42, zeroY); g.lineTo(x2 + 42, zeroY); g.stroke();
    Art.text(g, fmtQ(qA), x1, qA >= 0 ? zeroY - hA - 16 : zeroY + hA + 16, { font: 'display', size: 21, color: C.sun, halo: true, maxW: 86 });
    Art.text(g, fmtQ(qB), x2, qB >= 0 ? zeroY - hB - 16 : zeroY + hB + 16, { font: 'display', size: 21, color: C.sun, halo: true, maxW: 86 });
    Art.text(g, nameA, x1, labelY, { size: 22, color: '#fff', maxW: 90 });
    Art.text(g, nameB, x2, labelY, { size: 22, color: '#fff', maxW: 90 });
  }

  /* ---------- The worked scenario used throughout story 1: computed, not typed ---------- */
  const D = (() => {
    const mM = 50, cM = 0.45, TM = 100, mW = 100, TW = 20;
    const a = mM * cM, b = mW * CW, Tf = (a * TM + b * TW) / (a + b);
    return { mM, cM, TM, mW, TW, a, b, Tf, q: b * (Tf - TW) };
  })();
  const FE = '#9AA3B2';

  /* ---------- Story 1: hot metal meets cool water ---------- */
  Lab.story('#story-drop', {
    title: 'Hot metal meets cool water',
    scenes: [
      {
        say: 'Meet the <b>coffee cup calorimeter</b>. Two foam cups keep heat in, a lid stops steam escaping, a stirrer mixes the water, and a thermometer reads its temperature.',
        dur: 3.4,
        draw(g, p, t, { W, H }) {
          Art.bench(g, W, 416, H - 416);
          const cx = 340, base = 416, w = 290, h = 236;
          const q = (a) => seg(p, a, a + 0.14);
          foamCup(g, cx, base, w, h, { level: 0.72 });
          const top = base - h;
          stirrer(g, cx - 66, top - 62, base - 56, t);
          probe(g, cx + 74, base - 52, '20.0 °C', { boxY: top - 72, boxX: cx + 118 });
          lid(g, cx, top - 18, w);
          const lab = (s, x, y, x1, y1, x2, y2, d, col) => {
            Art.text(g, s, x, y, { font: 'display', size: 28, color: col || C.sun, alpha: q(d), halo: true });
            Art.arrow(g, x1, y1, x2, y2, { color: col || C.sun, w: 4, head: 12, p: q(d) });
          };
          lab('Foam cups', 88, 290, 88, 312, 212, 342, 0.05);
          lab('Water', 672, 322, 626, 322, 452, 322, 0.25, ENDO);
          lab('Lid', 672, 186, 640, 186, 510, 186, 0.45);
          lab('Stirrer', 110, 96, 164, 100, 262, 118, 0.6);
          lab('Thermometer', 674, 92, 584, 96, 524, 104, 0.75);
        },
      },
      {
        say: 'Here are the players. The iron is hot, so its atoms jiggle fast. The water is cool, so its molecules move slowly. Heat is about to flow from <b>hot to cold</b>.',
        dur: 3,
        draw(g, p, t, { W, H }) {
          Art.bench(g, W, 410, H - 410);
          const a = seg(p, 0, 0.3), b = seg(p, 0.3, 0.6);
          g.save(); g.globalAlpha *= a;
          metalBlock(g, 190, 362, 92, FE, 0.8);
          Art.zoom(g, 190, 330, 190, 176, 124, (gg, cx, cy, R) => {
            for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) {
              const x = cx + i * 40 + (j % 2 ? 20 : 0), y = cy + j * 37;
              if (Math.hypot(x - cx, y - cy) > R + 14) continue;
              const id = i * 11 + j * 7;
              Art.atom(gg, x + wander(id, t * 11) * 6, y + wander(id + 40, t * 11) * 6, 18, 'Fe', { label: false, face: i === 0 && j === 0 ? 'wow' : null, t });
            }
          }, { rim: EXO, p: 1 });
          g.restore();
          g.save(); g.globalAlpha *= b;
          foamCup(g, 610, 408, 150, 96, { level: 0.74 });
          Art.zoom(g, 610, 330, 610, 176, 124, (gg, cx, cy, R) => buzzing(gg, 5, t, 30, [cx - R * 0.66, cy - R * 0.66, cx + R * 0.66, cy + R * 0.66], 'H2O', 32, 8), { rim: ENDO, p: 1 });
          g.restore();
          Art.pill(g, 'Iron, 100 °C', 190, 28, { size: 25, color: EXO, text: '#1A0F2E', alpha: a });
          Art.pill(g, 'Water, 20 °C', 610, 28, { size: 25, color: ENDO, text: '#1A0F2E', alpha: b });
          heatArrow(g, 332, 176, 468, 176, t, { p: seg(p, 0.65, 0.9), w: 24 });
          Art.text(g, 'heat', 400, 134, { size: 28, color: EXO, alpha: seg(p, 0.75, 0.95) });
        },
      },
      {
        say: 'In it goes. Fast iron atoms bump slow water molecules and pass along some energy. The iron slows down and the water speeds up. That transfer of energy is <b>heat</b>.',
        dur: 3.6,
        draw(g, p, t, { W, H }) {
          Art.bench(g, W, 416, H - 416);
          const cx = 180, base = 416, w = 256, h = 210, top = base - h;
          const fall = ease.in(seg(p, 0.03, 0.26));
          const u = seg(p, 0.26, 1);
          const Tm = lerp(100, 60, u), Tw = lerp(20, 21.5, u);
          let box = null;
          const inWater = fall >= 1;
          foamCup(g, cx, base, w, h, {
            level: 0.72, warm: u * 0.12,
            inside: (gg, b) => {
              box = b;
              if (inWater) {
                metalBlock(gg, cx, b.bottom - 40, 72, FE, 0.8 * (1 - u * 0.5));
                [[-1, 0], [1, 0], [0, -1]].forEach(([dx, dy]) => heatArrow(gg, cx + dx * 42, b.bottom - 40 + dy * 42, cx + dx * 78, b.bottom - 40 + dy * 78, t, { w: 12, head: 15, alpha: seg(p, 0.3, 0.45) }));
              }
            },
          });
          if (!inWater) metalBlock(g, cx, lerp(40, base - 57, fall), 72, FE, 0.8);
          const sp = seg(p, 0.25, 0.36);
          if (sp > 0 && sp < 1 && box) {
            for (let i = 0; i < 10; i++) {
              const a = -Math.PI * (0.1 + 0.8 * rand(i + 3)), d = 30 + rand(i) * 80;
              g.fillStyle = Art.alpha(C.water, 1 - sp);
              g.beginPath(); g.arc(cx + Math.cos(a) * d * sp, box.top + Math.sin(a) * d * sp * 1.4 + sp * sp * 60, 5, 0, TAU); g.fill();
            }
          }
          Art.zoom(g, cx, base - 60, 544, 206, 186, (gg, zx, zy, R) => interfaceView(gg, zx, zy, R, t, 'Fe', Tm, Tw, seg(p, 0.35, 0.5)), { p: seg(p, 0.3, 0.5), rim: C.cyan });
          Art.text(g, 'iron atoms', 450, 410, { size: 25, color: '#FFB48F', alpha: seg(p, 0.5, 0.7), halo: true });
          Art.text(g, 'water', 656, 410, { size: 25, color: ENDO, alpha: seg(p, 0.5, 0.7), halo: true });
          void top;
        },
      },
      {
        say: 'The iron cools fast and the water warms slowly until they meet at the <b>same temperature</b>. Then the net flow stops. This is <b>thermal equilibrium</b>.',
        dur: 3.8,
        draw(g, p, t) {
          const x0 = 104, x1 = 740, y0 = 372, y1 = 44;
          const yT = (T) => lerp(y0, y1, T / 110);
          const xt = (u) => lerp(x0, x1, u);
          g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 2;
          [20, 40, 60, 80, 100].forEach((T) => {
            g.beginPath(); g.moveTo(x0, yT(T)); g.lineTo(x1, yT(T)); g.stroke();
            Art.text(g, T + ' °C', x0 - 12, yT(T), { size: 21, align: 'right', color: C.dim });
          });
          g.strokeStyle = C.ink; g.lineWidth = 3.5;
          g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0); g.lineTo(x1, y0); g.stroke();
          Art.text(g, 'time', (x0 + x1) / 2, 402, { size: 24, color: C.dim });
          const prog = ease.inOut(seg(p, 0.05, 0.75));
          const curve = (T0, col) => {
            g.strokeStyle = col; g.lineWidth = 8; g.lineCap = 'round'; g.lineJoin = 'round';
            g.beginPath();
            for (let i = 0; i <= 60; i++) {
              const u = (i / 60) * prog;
              const T = D.Tf + (T0 - D.Tf) * Math.exp(-u * 6);
              const X = xt(u), Y = yT(T);
              if (i) g.lineTo(X, Y); else g.moveTo(X, Y);
            }
            g.stroke();
            const T = D.Tf + (T0 - D.Tf) * Math.exp(-prog * 6);
            Art.ball(g, xt(prog), yT(T), 12, col);
          };
          curve(D.TM, EXO);
          curve(D.TW, ENDO);
          Art.text(g, 'iron', xt(0.1) + 30, yT(100) + 16, { font: 'display', size: 30, color: EXO, alpha: seg(p, 0.05, 0.2) });
          Art.text(g, 'water', xt(0.04) + 28, yT(20) + 24, { font: 'display', size: 28, color: ENDO, alpha: seg(p, 0.05, 0.2), halo: true });
          const a = seg(p, 0.72, 0.9);
          if (a > 0) {
            Art.ring(g, xt(1), yT(D.Tf), 26, { color: C.sun, w: 5, p: a });
            Art.text(g, 'Both at ' + D.Tf.toFixed(1) + ' °C', 560, yT(D.Tf) - 62, { font: 'display', size: 40, color: C.sun, alpha: a });
          }
        },
      },
      {
        say: 'Why so close to the water? Draw each heat as a block. Its height is $mc$ and its width is the temperature change. Area is heat. <b>The two areas must match</b>, and water is a very tall block.',
        dur: 4,
        draw(g, p, t) {
          const y0 = 362, x0 = 80, x1 = 720;
          const xT = (T) => lerp(x0, x1, (T - 20) / 80);
          const k = 240 / D.b;
          const hW = D.b * k * ease.out(seg(p, 0.2, 0.45)), hM = D.a * k * ease.out(seg(p, 0.45, 0.7));
          const xF = xT(D.Tf);
          g.strokeStyle = C.ink; g.lineWidth = 4; g.beginPath(); g.moveTo(x0 - 16, y0); g.lineTo(x1 + 16, y0); g.stroke();
          [[20, '20 °C'], [100, '100 °C']].forEach(([T, s]) => {
            g.lineWidth = 3; g.beginPath(); g.moveTo(xT(T), y0); g.lineTo(xT(T), y0 + 12); g.stroke();
            Art.text(g, s, xT(T), y0 + 32, { size: 24, color: C.dim });
          });
          if (hW > 0) { const f = g.createLinearGradient(0, y0 - hW, 0, y0); f.addColorStop(0, '#7FD8FF'); f.addColorStop(1, '#2B8FD8'); g.fillStyle = f; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5; g.fillRect(x0, y0 - hW, xF - x0, hW); g.strokeRect(x0, y0 - hW, xF - x0, hW); }
          if (hM > 0) { const f = g.createLinearGradient(xF, 0, x1, 0); f.addColorStop(0, '#FFB23F'); f.addColorStop(1, '#E0561B'); g.fillStyle = f; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5; g.fillRect(xF, y0 - hM, x1 - xF, hM); g.strokeRect(xF, y0 - hM, x1 - xF, hM); }
          Art.text(g, 'Water: tall and thin', 136, 62, { size: 27, color: ENDO, align: 'left', alpha: seg(p, 0.3, 0.45) });
          Art.text(g, 'mc = ' + D.b.toFixed(0) + ' J/°C', 136, 96, { size: 24, align: 'left', alpha: seg(p, 0.3, 0.45) });
          Art.text(g, 'Iron: short and wide', 410, 262, { size: 27, color: EXO, alpha: seg(p, 0.55, 0.7) });
          Art.text(g, 'mc = ' + D.a.toFixed(1) + ' J/°C', 410, 296, { size: 24, alpha: seg(p, 0.55, 0.7) });
          Art.arrow(g, xF + 32, 190, xF + 2, y0 - 4, { color: C.sun, w: 5, head: 14, p: seg(p, 0.7, 0.85) });
          Art.pill(g, 'Final: ' + D.Tf.toFixed(1) + ' °C', xF + 116, 168, { size: 26, color: C.sun, text: '#1A0F2E', alpha: seg(p, 0.72, 0.85) });
          Art.text(g, 'Same area, same heat', 400, 428, { font: 'display', size: 32, color: C.sun, alpha: seg(p, 0.85, 1) });
        },
      },
      {
        say: 'Now the bookkeeping. The iron lost exactly what the water gained. So $q_{\\text{iron}} + q_{\\text{water}} = 0$. <b>Same size, opposite sign.</b> The arrow goes out of the iron and into the water.',
        dur: 3.4,
        draw(g, p, t) {
          const q = ease.inOut(seg(p, 0.15, 0.6));
          const z = 224, H0 = 138;
          const qk = (D.q / 1000).toFixed(2);
          Art.text(g, 'Iron', 170, 38, { font: 'display', size: 36, color: EXO });
          Art.text(g, 'Water', 630, 38, { font: 'display', size: 36, color: ENDO });
          // Bars.
          g.strokeStyle = C.ink; g.lineWidth = 4;
          g.beginPath(); g.moveTo(60, z); g.lineTo(280, z); g.moveTo(520, z); g.lineTo(740, z); g.stroke();
          g.fillStyle = C.pink; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
          Art.round(g, 110, z, 120, Math.max(1, H0 * q), 10); g.fill(); g.stroke();
          g.fillStyle = C.leaf;
          Art.round(g, 570, z - H0 * q, 120, Math.max(1, H0 * q), 10); g.fill(); g.stroke();
          heatArrow(g, 296, z, 504, z, t, { w: 30, p: seg(p, 0.1, 0.45) });
          Art.text(g, 'heat', 400, z - 58, { size: 28, color: EXO, alpha: seg(p, 0.3, 0.5) });
          Art.text(g, '−' + qk + ' kJ', 170, z + H0 + 34, { font: 'display', size: 42, color: C.sun, alpha: seg(p, 0.45, 0.65) });
          Art.text(g, '+' + qk + ' kJ', 630, z + 40, { font: 'display', size: 42, color: C.sun, alpha: seg(p, 0.45, 0.65) });
          Art.text(g, 'lost', 170, z + 62, { size: 26, color: '#fff', alpha: seg(p, 0.5, 0.7), halo: true });
          Art.text(g, 'gained', 630, z - 66, { size: 26, color: '#1A0F2E', alpha: seg(p, 0.5, 0.7) });
          Art.text(g, 'Adds up to zero', 400, 412, { font: 'display', size: 32, color: C.ink, alpha: seg(p, 0.7, 0.9) });
        },
      },
    ],
  });

  /* ---------- Bench: coffee cup lab ---------- */
  const METALS = {
    Al: { name: 'aluminum', c: 0.90, d: 2.70, color: '#C9C7D6', sym: 'Al' },
    Fe: { name: 'iron', c: 0.45, d: 7.87, color: '#9AA3B2', sym: 'Fe' },
    Cu: { name: 'copper', c: 0.385, d: 8.96, color: '#D98A4A', sym: 'Cu' },
    Au: { name: 'gold', c: 0.129, d: 19.3, color: '#F7C631', sym: 'Au' },
  };
  const RX = {
    NaOH: { name: 'NaOH', f: 'NaOH', dH: -44.5, tex: '\\ce{NaOH(s) -> Na+(aq) + OH-(aq)}', color: '#F4F2FA', ions: ['Na', 'OH'] },
    NH4NO3: { name: '$\\ce{NH4NO3}$', f: 'NH4NO3', dH: 25.7, tex: '\\ce{NH4NO3(s) -> NH4+(aq) + NO3^-(aq)}', color: '#F4F2FA', ions: ['NH4', 'NO3'] },
    KCl: { name: 'KCl', f: 'KCl', dH: 17.2, tex: '\\ce{KCl(s) -> K+(aq) + Cl-(aq)}', color: '#F4F2FA', ions: ['K', 'Cl'] },
    HCl: { name: 'HCl and NaOH', mix: true, dH: -55.8, tex: '\\ce{H+(aq) + OH-(aq) -> H2O(l)}', ions: ['H', 'OH'] },
  };
  /** An ion in the magnifier, in true element colors. */
  function ion(g, kind, x, y, r, t) {
    const rot = t * 0.7;
    const around = (sym, n, d, rr) => {
      for (let i = 0; i < n; i++) {
        const a = rot + (i / n) * TAU;
        Art.atom(g, x + Math.cos(a) * d, y + Math.sin(a) * d, rr, sym, { label: false });
      }
    };
    if (kind === 'Na') Art.atom(g, x, y, r, 'Na', { charge: '+' });
    else if (kind === 'K') Art.atom(g, x, y, r * 1.05, 'K', { charge: '+' });
    else if (kind === 'Cl') Art.atom(g, x, y, r * 1.05, 'Cl', { charge: '-' });
    else if (kind === 'H') Art.atom(g, x, y, r * 0.7, 'H', { charge: '+' });
    else if (kind === 'OH') {
      Art.atom(g, x + Math.cos(rot) * r * 0.9, y + Math.sin(rot) * r * 0.9, r * 0.56, 'H', { label: false });
      Art.atom(g, x, y, r * 0.92, 'O', { charge: '-' });
    } else if (kind === 'NH4') {
      around('H', 4, r * 0.95, r * 0.46);
      Art.atom(g, x, y, r * 0.86, 'N', { charge: '+' });
    } else if (kind === 'NO3') {
      around('O', 3, r * 0.98, r * 0.56);
      Art.atom(g, x, y, r * 0.8, 'N', { charge: '-' });
    }
  }
  const KRATE = 0.62;
  const cup = { mode: 'metal', metal: 'Fe', m1: 50, tm: 100, mw: 100, tw: 20, rx: 'NaOH', state: 'ready', t0: 0, painted: false };
  function cupModel() {
    if (cup.mode === 'metal') {
      const M = METALS[cup.metal];
      const a = cup.m1 * M.c, b = cup.mw * CW;
      const Tf = (a * cup.tm + b * cup.tw) / (a + b);
      return { Tf, a, b, qFull: b * (Tf - cup.tw) };
    }
    const R = RX[cup.rx];
    let n, mass;
    if (R.mix) { n = (cup.m1 / 1000) * 1.0; mass = 2 * cup.m1; }
    else { n = cup.m1 / Bank.molarMass(R.f); mass = cup.mw + cup.m1; }
    const qSys = R.dH * 1000 * n;
    const dT = -qSys / (mass * CW);
    return { Tf: cup.tw + dT, n, mass, qSys, dT, qFull: -qSys };
  }
  const levelFor = (mass) => lerp(0.42, 0.86, clamp((mass - 40) / 220));
  const cupStage = Lab.stage('#c-cup', {
    h: 520, bg: 'lab',
    label: 'A foam cup calorimeter with a thermometer, a live graph of temperature against time, a magnifier of the particles, and two bars showing the heat lost and gained.',
    onPointer() {},
    draw(g, t) {
      const m = cupModel();
      const metalMode = cup.mode === 'metal';
      const R = metalMode ? null : RX[cup.rx];
      const Me = metalMode ? METALS[cup.metal] : null;
      let el = cup.state === 'ready' ? -1 : t - cup.t0;
      if (Lab.reducedMotion && cup.state !== 'ready') el = 99;
      const fallRaw = clamp(el / 0.55);
      const fall = ease.in(fallRaw);
      const u = el < 0.55 ? 0 : 1 - Math.exp(-(el - 0.55) * KRATE);
      if (el > 8 && cup.state !== 'done') { cup.state = 'done'; }
      const Tw = cup.tw + (m.Tf - cup.tw) * u;
      const Tm = metalMode ? cup.tm + (m.Tf - cup.tm) * u : 0;
      const qW = m.qFull * u;
      const cx = 188, base = 450, w = 256, h = 222, top = base - h;
      const started = cup.state !== 'ready';
      const mass = metalMode ? cup.mw : (R.mix ? (started ? lerp(cup.m1, 2 * cup.m1, fallRaw) : cup.m1) : cup.mw);
      const warm = clamp((Tw - cup.tw) / 30, -1, 1) * 0.55;
      const a = metalMode ? clamp(Math.cbrt(cup.m1 / Me.d) * 17, 26, 84) : 0;
      let box = null;
      foamCup(g, cx, base, w, h, {
        level: levelFor(mass), warm,
        inside: (gg, b) => {
          box = b;
          if (!started) return;
          const my = b.bottom - Math.max(a / 2, 4) - 2;
          if (metalMode && fallRaw >= 1) {
            metalBlock(gg, cx, my, a, Me.color, clamp((Tm - 60) / 120) * 0.9);
            const f = clamp(Math.abs(Tm - Tw) / 20);
            if (f > 0.04 && Tm > Tw) {
              heatArrow(gg, cx - a / 2 - 2, my, cx - a / 2 - 34, my, t, { w: 11, head: 14, alpha: f });
              heatArrow(gg, cx + a / 2 + 2, my, cx + a / 2 + 34, my, t, { w: 11, head: 14, alpha: f });
              heatArrow(gg, cx, my - a / 2 - 2, cx, my - a / 2 - 34, t, { w: 11, head: 14, alpha: f });
            }
          } else if (!metalMode && fallRaw >= 1) {
            const sy = (b.top + b.bottom) / 2 + 8, f = clamp((1 - u) * 1.15);
            if (!R.mix) {
              for (let i = 0; i < 7; i++) {
                const s = (7 - i * 0.2) * clamp(1.15 - u * 1.2 - i * 0.03);
                if (s > 0.5) Art.ball(gg, cx - 26 + (i % 4) * 17 + wander(i, t) * 2, sy + 2 - (i % 2) * 12, s, '#F4F2FA');
              }
            }
            sysLine(gg, () => { gg.beginPath(); gg.arc(cx, sy, 34, 0, TAU); }, t, Math.max(0.5, f));
            if (f > 0.03) {
              const out = R.dH < 0;
              const fa = clamp((1 - u) * 7);
              [[-1, 0], [1, 0], [0, -1]].forEach(([dx, dy]) => {
                const x1 = cx + dx * 38, y1 = sy + dy * 38, x2 = cx + dx * 84, y2 = sy + dy * 84;
                if (out) heatArrow(gg, x1, y1, x2, y2, t, { w: 13, head: 17, alpha: fa });
                else heatArrow(gg, x2, y2, x1, y1, t, { w: 13, head: 17, alpha: fa });
              });
            }
          }
        },
      });
      // Falling things.
      if (metalMode) {
        const startY = 92;
        if (!started) {
          g.strokeStyle = 'rgba(255,255,255,.65)'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, 0); g.lineTo(cx, startY - a / 2); g.stroke();
          metalBlock(g, cx, startY, a, Me.color, clamp((cup.tm - 60) / 120) * 0.9);
          Art.text(g, cup.tm + ' °C', cx - a / 2 - 14, startY - 16, { font: 'display', size: 30, color: EXO, align: 'right', halo: true });
          Art.text(g, Me.name, cx - a / 2 - 14, startY + 18, { size: 24, align: 'right', halo: true });
        } else if (fallRaw < 1) {
          metalBlock(g, cx, lerp(startY, box ? box.bottom - a / 2 : base - 40, fall), a, Me.color, 0.7);
        }
      } else if (!R.mix) {
        if (!started) {
          // A little dish of the solid, ready to tip.
          const dx = cx, dy = 118;
          g.fillStyle = '#E4DEF4'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
          g.beginPath(); g.moveTo(dx - 56, dy); g.quadraticCurveTo(dx, dy + 34, dx + 56, dy); g.closePath(); g.fill(); g.stroke();
          for (let i = 0; i < 9; i++) Art.ball(g, dx - 30 + (i % 5) * 15, dy - 2 - (i > 4 ? 10 : 0), 7, '#F4F2FA');
          Art.text(g, cup.m1.toFixed(1) + ' g', dx - 70, dy - 2, { font: 'display', size: 28, color: C.sun, align: 'right', halo: true });
        } else if (fallRaw < 1) {
          for (let i = 0; i < 9; i++) Art.ball(g, cx - 28 + (i % 5) * 14, lerp(120, box ? box.top + 22 : 340, ease.in(clamp(fallRaw * 1.4 - (i % 4) * 0.1))), 6.5, '#F4F2FA');
        }
      } else {
        // Pouring the second solution from a beaker.
        const pour = started && fallRaw < 1;
        if (!started || pour) {
          const bx = cx - 96, by = 140;
          g.save(); g.translate(bx, by); g.rotate(pour ? 0.9 * Math.min(1, fallRaw * 4) : 0);
          Art.beaker(g, 0, 0, 90, 92, { level: 0.74, ticks: false, liquid: '#B9A8FF' });
          g.restore();
          if (pour) { g.fillStyle = Art.alpha('#B9A8FF', 0.85); Art.round(g, cx - 6, 122, 12, top + 90 - 122, 6); g.fill(); }
          if (!started) Art.text(g, 'NaOH', bx + 52, by - 44, { font: 'display', size: 28, color: C.sun, align: 'left', halo: true });
        }
        if (!started) Art.text(g, 'HCl', cx, top + 34, { font: 'display', size: 28, color: C.sun, halo: true });
      }
      stirrer(g, cx - 64, top - 74, base - 46, t);
      probe(g, cx + 64, base - 44, Lab.fmt(Tw, 1) + ' °C', { boxY: top - 94, boxX: cx + 108, size: 27 });
      if (!metalMode && started) {
        Art.text(g, 'Water: surroundings', cx, top + 26, { size: 21, color: ENDO, halo: true, maxW: 196 });
        Art.text(g, 'Reaction: system', cx, top + 52, { size: 21, color: '#FF8AC4', halo: true, maxW: 196 });
      }
      const lidDown = ease.out(clamp((el - 0.5) / 0.35));
      if (lidDown > 0) { g.save(); g.globalAlpha *= lidDown; lid(g, cx, top - 18 - (1 - lidDown) * 44, w); g.restore(); }

      /* The live graph. */
      const gx0 = 470, gx1 = 780, gy0 = 240, gy1 = 28;
      const Ts = metalMode ? [cup.tm, cup.tw, m.Tf] : [cup.tw, m.Tf];
      const span = Math.max(0.5, Math.max(...Ts) - Math.min(...Ts));
      const hi = Math.max(...Ts) + span * 0.08, lo = Math.min(...Ts) - span * 0.2;
      const tickTxt = (T) => (span < 6 ? Lab.fmt(T, 1) : Math.round(T)) + ' °C';
      const yT = (T) => lerp(gy0, gy1, (T - lo) / (hi - lo));
      const xt = (s) => lerp(gx0, gx1, clamp(s / 8));
      g.fillStyle = 'rgba(20,10,40,.55)'; Art.round(g, gx0 - 62, gy1 - 16, gx1 - gx0 + 72, gy0 - gy1 + 56, 14); g.fill();
      g.strokeStyle = C.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(gx0, gy1 - 4); g.lineTo(gx0, gy0); g.lineTo(gx1, gy0); g.stroke();
      Art.text(g, 'time', gx0 + 42, gy0 + 22, { size: 22, color: C.dim });
      Art.text(g, tickTxt(hi), gx0 - 8, gy1 + 4, { size: 20, align: 'right', color: C.dim });
      Art.text(g, tickTxt(lo), gx0 - 8, gy0 - 8, { size: 20, align: 'right', color: C.dim });
      const elapsed = started ? clamp(el - 0.55, 0, 8) : 0;
      const line = (T0, col) => {
        g.strokeStyle = col; g.lineWidth = 6; g.lineCap = 'round'; g.lineJoin = 'round';
        g.beginPath();
        const N = 50;
        for (let i = 0; i <= N; i++) {
          const s = (i / N) * elapsed;
          const T = m.Tf + (T0 - m.Tf) * Math.exp(-s * KRATE);
          if (i) g.lineTo(xt(s), yT(T)); else g.moveTo(xt(s), yT(T));
        }
        g.stroke();
        const T = m.Tf + (T0 - m.Tf) * Math.exp(-elapsed * KRATE);
        Art.ball(g, xt(elapsed), yT(T), 9, col);
      };
      if (metalMode) line(cup.tm, EXO);
      line(cup.tw, ENDO);
      if (metalMode) Art.text(g, 'metal', gx0 + 62, yT(cup.tm) + 2, { size: 23, color: EXO, halo: true });
      const wy = yT(cup.tw);
      Art.text(g, 'water', gx0 + 62, m.Tf >= cup.tw ? wy + 20 : wy - 22, { size: 23, color: ENDO, halo: true });
      if (u > 0.8) {
        g.strokeStyle = C.sun; g.lineWidth = 2.5; g.setLineDash([7, 7]);
        g.beginPath(); g.moveTo(gx0, yT(m.Tf)); g.lineTo(gx1, yT(m.Tf)); g.stroke(); g.setLineDash([]);
        const above = yT(m.Tf) > gy1 + 60;
        Art.text(g, m.Tf.toFixed(1) + ' °C', gx1 - 6, yT(m.Tf) + (above ? -22 : 22), { font: 'display', size: 28, color: C.sun, align: 'right', halo: true });
      }

      /* The magnifier. */
      const zx = 540, zy = 372, zR = 94;
      const fromX = cx + 18, fromY = box ? (box.top + box.bottom) / 2 : 360;
      if (metalMode) {
        Art.zoom(g, fromX, fromY, zx, zy, zR, (gg, ax, ay, RR) => interfaceView(gg, ax, ay, RR, t, Me.sym, started ? Tm : cup.tm, Tw, started && fallRaw >= 1 ? clamp((Tm - Tw) / 15) : 0), { rim: C.cyan });
      } else {
        Art.zoom(g, fromX, fromY, zx, zy, zR, (gg, ax, ay, RR) => {
          const sp = 24 + clamp((Tw - 5) / 80) * 170;
          buzzing(gg, 3, t, sp, [ax - RR * 0.72, ay - RR * 0.72, ax + RR * 0.72, ay + RR * 0.72], 'H2O', 24, 21);
          if (started && fallRaw >= 1) {
            const [i1, i2] = R.ions;
            for (let k = 0; k < 2; k++) {
              const on = clamp(u * 3 - k * 0.3);
              if (on <= 0) continue;
              const [x, y] = drift(k * 5 + 40, t, sp * 0.8, ax - RR * 0.6, ay - RR * 0.6, ax + RR * 0.6, ay + RR * 0.6);
              g.save(); g.globalAlpha *= on; ion(gg, k ? i2 : i1, x, y, 20, t); g.restore();
            }
          }
        }, { rim: C.cyan });
      }

      /* The heat ledger. */
      const big = Math.max(1, Math.abs(m.qFull));
      const nameA = metalMode ? 'Metal' : 'Reaction';
      ledgerBars(g, 672, 752, 362, -qW, qW, big, 66, nameA, 'Water', 484);
    },
  });
  function paintCupControls() {
    const metal = cup.mode === 'metal';
    const R = RX[cup.rx];
    Lab.$('#cup-metal-pick').hidden = !metal;
    Lab.$('#cup-rx-pick').hidden = metal;
    Lab.$('#cup-tm-wrap').hidden = !metal;
    Lab.$('#cup-mw-wrap').hidden = !metal && R.mix;
    const m1 = Lab.$('#cup-m1');
    const label = Lab.$('#cup-m1-label');
    if (metal) { m1.min = 10; m1.max = 300; m1.step = 10; label.textContent = 'Mass of metal'; }
    else if (R.mix) { m1.min = 25; m1.max = 100; m1.step = 5; label.textContent = 'Volume of each 1.00 M solution'; }
    else { m1.min = 1; m1.max = 10; m1.step = 0.5; label.textContent = 'Mass of solid'; }
    if (+m1.value < +m1.min || +m1.value > +m1.max || cup.boundTo !== (metal ? 'm' : R.mix ? 'v' : 's')) m1.value = metal ? 50 : R.mix ? 50 : 5;
    cup.boundTo = metal ? 'm' : R.mix ? 'v' : 's';
    cup.m1 = +m1.value;
    Lab.paintRange(m1);
    Lab.$('#cup-m1-out').textContent = metal ? cup.m1 + ' g' : R.mix ? cup.m1 + ' mL' : cup.m1.toFixed(1) + ' g';
    Lab.$('#cup-go').textContent = metal ? 'Drop the metal in' : R.mix ? 'Pour in the NaOH' : 'Tip in the solid';
  }
  function paintCupFoot() {
    const foot = Lab.$('#cup-foot');
    const m = cupModel();
    const started = cup.state !== 'ready';
    if (cup.mode === 'metal') {
      const M = METALS[cup.metal];
      if (!started) {
        foot.innerHTML = Lab.texString(`<p><b>Before you drop it, guess.</b> Will the final temperature land closer to the ${M.name} at ${cup.tm} °C, or the water at ${cup.tw} °C? Particle speeds in the magnifier are exaggerated so you can see them.</p>`);
        return;
      }
      foot.innerHTML = Lab.texString(`<div class="calc-line">$$(${cup.m1})(${M.c})(T_f - ${cup.tm}) + (${cup.mw})(4.184)(T_f - ${cup.tw}) = 0$$</div>
        <div class="calc-line">$$T_f = \\dfrac{${(m.a * cup.tm + m.b * cup.tw).toFixed(0)}}{${(m.a + m.b).toFixed(1)}} = ${m.Tf.toFixed(1)}\\ {}^\\circ\\text{C}$$</div>
        <p>The water gained ${Lab.fmt(m.qFull, 0)} J, and the ${M.name} lost exactly that. ${m.b > m.a ? 'The water has the larger $mc$, so it changed temperature less.' : 'With this much metal, the metal has the larger $mc$, so it changed temperature less.'}</p>`);
    } else {
      const R = RX[cup.rx];
      if (!started) {
        foot.innerHTML = Lab.texString(`<p>$${R.tex}$</p><p><b>The reacting chemicals are the system. The water is the surroundings.</b> Before you start, guess: will the thermometer go up or down? ${R.mix ? 'Each solution is 1.00 M, and its density is taken as 1.00 g/mL.' : ''}</p>`);
        return;
      }
      const dT = m.dT, qw = m.mass * CW * dT;
      const massLine = `${m.mass}\\ \\text{g}`;
      const moles = R.mix ? `n = (${(cup.m1 / 1000).toFixed(3)}\\ \\text{L})(1.00\\ \\text{mol/L}) = ${m.n.toFixed(4)}\\ \\text{mol}` : `n = \\dfrac{${cup.m1}\\ \\text{g}}{${Bank.molarMass(R.f).toFixed(2)}\\ \\text{g/mol}} = ${m.n.toFixed(4)}\\ \\text{mol}`;
      const sgn = (x, d) => (x > 0 ? '+' : '-') + Math.abs(x).toFixed(d);
      foot.innerHTML = Lab.texString(`<div class="calc-line">$$q_{\\text{water}} = (${massLine})(4.184)(${sgn(dT, 2)}) = ${sgn(qw, 0)}\\ \\text{J}$$</div>
        <div class="calc-line">$$q_{\\text{rxn}} = -\\,q_{\\text{water}} = ${sgn(-qw / 1000, 2)}\\ \\text{kJ}$$</div>
        <div class="calc-line">$$${moles}$$</div>
        <div class="calc-line">$$\\Delta H = \\dfrac{q_{\\text{rxn}}}{n} = ${sgn(-qw / 1000 / m.n, 1)}\\ \\text{kJ/mol}$$</div>
        <p>The water got <b>${dT > 0 ? 'hotter' : 'colder'}</b>, so heat ${dT > 0 ? 'left' : 'entered'} the reaction: <b>${dT > 0 ? 'exothermic, $\\Delta H$ negative' : 'endothermic, $\\Delta H$ positive'}</b>.</p>`);
    }
  }
  function cupReset() { cup.state = 'ready'; paintCupFoot(); Lab.$('#cup-go').disabled = false; }
  Lab.segmented('#cup-mode', (v) => { cup.mode = v; paintCupControls(); cupReset(); });
  Lab.segmented('#cup-metal', (v) => { cup.metal = v; cupReset(); });
  Lab.segmented('#cup-rx', (v) => { cup.rx = v; paintCupControls(); cupReset(); });
  Lab.bind('#cup-m1', null, null, (v) => {
    cup.m1 = v;
    const metal = cup.mode === 'metal', R = RX[cup.rx];
    Lab.$('#cup-m1-out').textContent = metal ? v + ' g' : R.mix ? v + ' mL' : v.toFixed(1) + ' g';
    cupReset();
  });
  Lab.bind('#cup-tm', '#cup-tm-out', (v) => v + ' °C', (v) => { cup.tm = v; cupReset(); });
  Lab.bind('#cup-mw', '#cup-mw-out', (v) => v + ' g', (v) => { cup.mw = v; cupReset(); });
  Lab.bind('#cup-tw', '#cup-tw-out', (v) => v + ' °C', (v) => { cup.tw = v; cupReset(); });
  Lab.$('#cup-go').addEventListener('click', () => {
    if (cup.state !== 'ready') return;
    cup.state = 'running'; cup.t0 = cupStage.t; Lab.sound.pop();
    Lab.$('#cup-go').disabled = true;
    paintCupFoot();
    cupStage.redraw();
  });
  Lab.$('#cup-reset').addEventListener('click', cupReset);
  paintCupControls();
  cupReset();

  /* ---------- Bench: balance the heat ---------- */
  const bl = { metal: 'Fe', mM: 200, TM: 120, mW: 80, TW: 20, guess: 70, solved: false, paid: false, flash: 0 };
  const blModel = () => {
    const M = METALS[bl.metal];
    const a = bl.mM * M.c, b = bl.mW * CW;
    const Tf = (a * bl.TM + b * bl.TW) / (a + b);
    const qw = b * (bl.guess - bl.TW), qm = a * (bl.TM - bl.guess);
    return { M, a, b, Tf, qw, qm, ok: Math.abs(bl.guess - Tf) <= Math.max(0.5, (bl.TM - bl.TW) * 0.008) };
  };
  function newBlocks() {
    for (let k = 0; k < 40; k++) {
      bl.metal = ['Al', 'Fe', 'Cu', 'Au'][Math.floor(Math.random() * 4)];
      bl.mM = (2 + Math.floor(Math.random() * 16)) * 25;
      bl.mW = (4 + Math.floor(Math.random() * 12)) * 10;
      bl.TM = (12 + Math.floor(Math.random() * 18)) * 5;
      bl.TW = 15 + Math.floor(Math.random() * 16);
      const r = (bl.mM * METALS[bl.metal].c) / (bl.mW * CW);
      const Tguess = (r * bl.TM + bl.TW) / (r + 1);
      if (r > 0.22 && r < 4 && Tguess < 95) break;
    }
    bl.solved = false; bl.paid = false;
    const el = Lab.$('#blocks-t');
    el.min = bl.TW; el.max = bl.TM;
    // Start at a guess that is visibly wrong.
    const f = blModel().Tf;
    bl.guess = f > (bl.TW + bl.TM) / 2 ? bl.TW + (bl.TM - bl.TW) * 0.2 : bl.TW + (bl.TM - bl.TW) * 0.8;
    el.value = bl.guess;
    Lab.paintRange(el);
    Lab.$('#blocks-t-out').textContent = bl.guess.toFixed(1) + ' °C';
    paintBlocks();
  }
  function checkBlocks() {
    const m = blModel();
    if (m.ok && !bl.solved) {
      bl.solved = true;
      if (!bl.paid) { bl.paid = true; Lab.collection.award(1); Lab.confetti(60); }
      paintBlocks();
    } else if (!m.ok && bl.solved) { bl.solved = false; paintBlocks(); }
  }
  function paintBlocks() {
    const m = blModel();
    const foot = Lab.$('#blocks-foot');
    let h = `<p><b>${bl.mM} g of ${m.M.name}</b> ($c = ${m.M.c}$) at ${bl.TM} °C goes into <b>${bl.mW} g of water</b> at ${bl.TW} °C. Each block's height is $mc$, its width is the temperature change, and its area is the heat.</p>`;
    if (bl.solved) {
      h += `<div class="calc-line">$$T_f = \\dfrac{(${bl.mM})(${m.M.c})(${bl.TM}) + (${bl.mW})(4.184)(${bl.TW})}{(${bl.mM})(${m.M.c}) + (${bl.mW})(4.184)} = ${m.Tf.toFixed(1)}\\ {}^\\circ\\text{C}$$</div>`;
    }
    foot.innerHTML = Lab.texString(h);
  }
  const xOfT = (T) => lerp(70, 730, (T - bl.TW) / (bl.TM - bl.TW));
  const TOfx = (x) => lerp(bl.TW, bl.TM, clamp((x - 70) / 660));
  const blocksStage = Lab.stage('#c-blocks', {
    h: 470, drag: true,
    label: 'Two heat blocks on a temperature axis. A draggable line sets the final temperature, and a beam on top tilts toward the larger heat.',
    onPointer(e) {
      if (e.type === 'hover') { blocksStage.canvas.style.cursor = 'ew-resize'; return; }
      if (e.type === 'down' || e.type === 'move') {
        bl.guess = clamp(TOfx(e.x), bl.TW, bl.TM);
        const el = Lab.$('#blocks-t'); el.value = bl.guess; Lab.paintRange(el);
        Lab.$('#blocks-t-out').textContent = bl.guess.toFixed(1) + ' °C';
      }
      if (e.type === 'up') checkBlocks();
    },
    draw(g, t) {
      const m = blModel();
      const y0 = 404, maxH = 186;
      const k = maxH / Math.max(m.a, m.b);
      const hW = m.b * k, hM = m.a * k;
      const xG = xOfT(bl.guess), x0 = 70, x1 = 730;
      // Blocks.
      const w1 = g.createLinearGradient(0, y0 - hW, 0, y0); w1.addColorStop(0, '#7FD8FF'); w1.addColorStop(1, '#2B8FD8');
      g.fillStyle = w1; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
      if (xG > x0) { g.fillRect(x0, y0 - hW, xG - x0, hW); g.strokeRect(x0, y0 - hW, xG - x0, hW); }
      const w2 = g.createLinearGradient(xG, 0, x1, 0); w2.addColorStop(0, '#FFB23F'); w2.addColorStop(1, '#E0561B');
      g.fillStyle = w2;
      if (x1 > xG) { g.fillRect(xG, y0 - hM, x1 - xG, hM); g.strokeRect(xG, y0 - hM, x1 - xG, hM); }
      if (xG - x0 > 110) Art.text(g, 'Water', (x0 + xG) / 2, y0 - 26, { font: 'display', size: 28, color: '#0D3A63', maxW: xG - x0 - 12 });
      if (x1 - xG > 110) Art.text(g, m.M.name, (xG + x1) / 2, y0 - Math.min(26, hM / 2), { font: 'display', size: 28, color: '#4A1D00', maxW: x1 - xG - 12 });
      // Axis.
      g.strokeStyle = C.ink; g.lineWidth = 4; g.beginPath(); g.moveTo(x0 - 18, y0); g.lineTo(x1 + 18, y0); g.stroke();
      Art.text(g, bl.TW + ' °C', x0, y0 + 30, { size: 25, color: ENDO });
      Art.text(g, bl.TM + ' °C', x1, y0 + 30, { size: 25, color: EXO });
      // Beam.
      const tilt = clamp((m.qm - m.qw) / (m.qm + m.qw), -1, 1) * 0.16;
      const bx = 400, by = 66, bL = 226;
      const dx = Math.cos(tilt) * bL, dy = Math.sin(tilt) * bL;
      g.strokeStyle = m.ok ? C.leaf : C.ink; g.lineWidth = 8; g.lineCap = 'round';
      g.beginPath(); g.moveTo(bx - dx, by - dy); g.lineTo(bx + dx, by + dy); g.stroke();
      g.fillStyle = m.ok ? C.leaf : C.sun; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(bx, by + 4); g.lineTo(bx - 16, by + 34); g.lineTo(bx + 16, by + 34); g.closePath(); g.fill(); g.stroke();
      const qLab = (q) => Lab.fmt(q / 1000, 2) + ' kJ';
      Art.text(g, 'Water gains', bx - dx - 10, by - dy + 24, { size: 23, color: ENDO, align: 'center' });
      Art.text(g, qLab(m.qw), bx - dx - 10, by - dy + 54, { font: 'display', size: 30, color: C.sun });
      Art.text(g, 'Metal loses', bx + dx + 10, by + dy + 24, { size: 23, color: EXO, align: 'center' });
      Art.text(g, qLab(m.qm), bx + dx + 10, by + dy + 54, { font: 'display', size: 30, color: C.sun });
      // Handle.
      const hy = 200;
      g.strokeStyle = m.ok ? C.leaf : C.pink; g.lineWidth = 5;
      g.beginPath(); g.moveTo(xG, hy); g.lineTo(xG, y0 + 12); g.stroke();
      g.fillStyle = m.ok ? C.leaf : C.pink; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
      g.beginPath(); g.arc(xG, hy, 24, 0, TAU); g.fill(); g.stroke();
      Art.text(g, '↔', xG, hy, { size: 30, color: '#fff' });
      const lblX = clamp(xG, 120, 680);
      Art.text(g, bl.guess.toFixed(1) + ' °C', lblX, 442, { font: 'display', size: 30, color: m.ok ? C.leaf : C.sun, halo: true, maxW: 130 });
      if (m.ok) {
        Art.ring(g, xG, hy, 32 + Math.sin(t * 5) * 3, { color: C.leaf, w: 4 });
        Art.pill(g, 'Balanced', 400, 128, { size: 28, font: 'display', color: C.leaf, text: '#1A0F2E' });
      }
    },
  });
  Lab.bind('#blocks-t', null, null, (v) => { bl.guess = v; Lab.$('#blocks-t-out').textContent = (+v).toFixed(1) + ' °C'; checkBlocks(); });
  Lab.$('#blocks-new').addEventListener('click', newBlocks);
  newBlocks();
  void blocksStage;

  /* ---------- The bomb calorimeter drawing ---------- */
  function bombCal(g, cx, base, s, o = {}) {
    const t = o.t || 0;
    const W = 420 * s, H = 310 * s, x0 = cx - W / 2, y0 = base - H;
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(cx, base + 3, W * 0.54, 12, 0, 0, TAU); g.fill();
    // Insulated jacket.
    const j = g.createLinearGradient(x0, 0, x0 + W, 0);
    j.addColorStop(0, '#7A6F9B'); j.addColorStop(0.5, '#A79BC2'); j.addColorStop(1, '#5E5480');
    g.fillStyle = j; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    Art.round(g, x0, y0, W, H, 16 * s); g.fill(); g.stroke();
    g.save(); Art.round(g, x0, y0, W, H, 16 * s); g.clip();
    g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 3;
    for (let i = -20; i < 40; i++) { g.beginPath(); g.moveTo(x0 + i * 22, y0); g.lineTo(x0 + i * 22 + H, y0 + H); g.stroke(); }
    g.restore();
    // Water bath.
    const pad = 22 * s, wx0 = x0 + pad, wx1 = x0 + W - pad, wy0 = y0 + 46 * s, wy1 = base - pad;
    const warm = clamp(o.warm || 0);
    const wat = g.createLinearGradient(0, wy0, 0, wy1);
    wat.addColorStop(0, Art.mix('#6FD0F7', '#FFC9A0', warm * 0.75)); wat.addColorStop(1, Art.mix('#1F7FC4', '#7B6FC4', warm * 0.75));
    g.fillStyle = '#21133D'; g.fillRect(wx0, y0 + 12 * s, wx1 - wx0, wy1 - y0 - 12 * s);
    g.fillStyle = wat; g.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
    g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(wx0, wy0, wx1 - wx0, 4);
    // Steel bomb.
    const bw = 158 * s, bh = 176 * s, bx0 = cx - bw / 2, by0 = wy0 + 20 * s, by1 = by0 + bh;
    const st = g.createLinearGradient(bx0, 0, bx0 + bw, 0);
    st.addColorStop(0, '#6F7486'); st.addColorStop(0.35, '#D8DCE6'); st.addColorStop(1, '#565B6D');
    g.fillStyle = st; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    Art.round(g, bx0, by0, bw, bh, 14 * s); g.fill(); g.stroke();
    const wall = 15 * s, ix0 = bx0 + wall, ix1 = bx0 + bw - wall, iy0 = by0 + 24 * s, iy1 = by1 - wall;
    const flash = clamp(o.flash || 0), glow = clamp(o.glow || 0);
    const inner = g.createRadialGradient(cx, (iy0 + iy1) / 2, 6, cx, (iy0 + iy1) / 2, bw * 0.7);
    inner.addColorStop(0, Art.mix('#3A2466', '#FFD24F', Math.max(flash, glow * 0.55)));
    inner.addColorStop(1, Art.mix('#1A0F2E', '#D9501B', Math.max(flash * 0.9, glow * 0.5)));
    g.fillStyle = inner; Art.round(g, ix0, iy0, ix1 - ix0, iy1 - iy0, 8 * s); g.fill();
    g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5; g.stroke();
    // Gas inside.
    g.save(); Art.round(g, ix0, iy0, ix1 - ix0, iy1 - iy0, 8 * s); g.clip();
    const gas = o.burned ? 'CO2' : 'O2';
    const sp = o.burned ? 120 : 30;
    for (let i = 0; i < 4; i++) {
      const [x, y] = drift(i * 4 + 3, t, sp, ix0 + 26 * s, iy0 + 22 * s, ix1 - 26 * s, iy1 - 52 * s);
      Art.molecule(g, x, y, (gas === 'CO2' ? 16 : 20) * s, gas, { rot: rand(i) * TAU + t * 0.6, labels: false, style: 'fill', atomScale: 1.2 });
    }
    g.restore();
    // Sample cup and wires.
    const scy = iy1 - 16 * s;
    g.strokeStyle = '#FFD23F'; g.lineWidth = 3 * s;
    g.beginPath(); g.moveTo(cx - 30 * s, iy0 - 6 * s); g.lineTo(cx - 30 * s, scy - 26 * s); g.lineTo(cx - 5 * s, scy - 14 * s); g.moveTo(cx + 30 * s, iy0 - 6 * s); g.lineTo(cx + 30 * s, scy - 26 * s); g.lineTo(cx + 5 * s, scy - 14 * s); g.stroke();
    g.fillStyle = '#D8D2EA'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(cx - 30 * s, scy - 8 * s); g.lineTo(cx + 30 * s, scy - 8 * s); g.lineTo(cx + 22 * s, scy + 10 * s); g.lineTo(cx - 22 * s, scy + 10 * s); g.closePath(); g.fill(); g.stroke();
    if (!o.burned) { g.fillStyle = o.sampleColor || '#2C313C'; g.beginPath(); g.ellipse(cx, scy - 10 * s, 18 * s, 8 * s, 0, 0, TAU); g.fill(); }
    if (o.spark > 0 && o.spark < 1) {
      g.strokeStyle = '#FFF7C9'; g.lineWidth = 3.5 * s; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(cx - 5 * s, scy - 14 * s);
      for (let i = 1; i < 5; i++) g.lineTo(cx - 5 * s + i * 2.5 * s, scy - 14 * s + Math.sin(t * 90 + i * 2) * 8 * s);
      g.lineTo(cx + 5 * s, scy - 14 * s); g.stroke();
      Art.glow(g, cx, scy - 14 * s, 42 * s, '#FFE27A', 0.9);
    }
    if (flash > 0) {
      Art.glow(g, cx, (iy0 + iy1) / 2, 120 * s * (0.6 + flash), '#FFD24F', 0.7 * flash);
      g.save(); Art.round(g, ix0, iy0, ix1 - ix0, iy1 - iy0, 8 * s); g.clip();
      Art.flame(g, cx, scy - 8 * s, 118 * s * flash, t, { kind: 'orange', wide: 1.2 });
      g.restore();
    }
    // Screw lid and bolts.
    const l = g.createLinearGradient(0, by0 - 4 * s, 0, by0 + 22 * s);
    l.addColorStop(0, '#E8EBF2'); l.addColorStop(1, '#868B9D');
    g.fillStyle = l; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    Art.round(g, bx0 - 12 * s, by0 - 2 * s, bw + 24 * s, 24 * s, 7 * s); g.fill(); g.stroke();
    g.fillStyle = '#4A4F60';
    for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(bx0 + 10 * s + (i * (bw - 20 * s)) / 4, by0 + 10 * s, 4.5 * s, 0, TAU); g.fill(); }
    // Stirrer on the left.
    const sx = x0 + 62 * s;
    g.strokeStyle = '#D8D2EA'; g.lineWidth = 6 * s; g.lineCap = 'round';
    g.beginPath(); g.moveTo(sx, y0 - 26 * s); g.lineTo(sx, wy1 - 24 * s); g.stroke();
    const pw = Math.cos(t * 7) * 24 * s;
    g.lineWidth = 8 * s; g.beginPath(); g.moveTo(sx - pw, wy1 - 24 * s); g.lineTo(sx + pw, wy1 - 24 * s); g.stroke();
    g.fillStyle = '#8F8DA6'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
    Art.round(g, sx - 22 * s, y0 - 48 * s, 44 * s, 24 * s, 6); g.fill(); g.stroke();
    // Thermometer on the right.
    probe(g, x0 + W - 62 * s, wy1 - 30 * s, o.reading || '20.00 °C', { boxY: y0 - 30 * s, boxX: x0 + W - 62 * s, w: 136, size: 26 });
    return { x0, y0, W, H, wx0, wx1, wy0, wy1, bx0, by0, bw, bh, ix0, ix1, iy0, iy1 };
  }
  const STAGE_LAB = (g, W, H) => {
    const w = g.createLinearGradient(0, 0, 0, H);
    w.addColorStop(0, '#2C1B4D'); w.addColorStop(1, '#3E2A68');
    g.fillStyle = w; g.fillRect(0, 0, W, H);
  };

  /* ---------- Story 2: the bomb calorimeter ---------- */
  const EX = { m: 1.5, M: Bank.molarMass('C6H12O6'), dH: -2803, Cc: 10 };
  EX.n = EX.m / EX.M; EX.q = -EX.dH * EX.n; EX.dT = +(EX.q / EX.Cc).toFixed(2);
  Lab.story('#story-bomb', {
    title: 'Burning something in a steel can',
    bg: STAGE_LAB,
    scenes: [
      {
        say: 'Meet the <b>bomb calorimeter</b>. A sample sits in a sealed steel can full of oxygen. The can sits in water, inside an insulated jacket, with a stirrer and a thermometer.',
        dur: 3.4,
        draw(g, p, t, { W, H }) {
          Art.bench(g, W, 420, H - 420);
          const c = bombCal(g, 400, 420, 0.98, { t });
          const q = (a) => seg(p, a, a + 0.14);
          const lab = (s, x, y, x1, y1, x2, y2, d, col) => {
            Art.text(g, s, x, y, { font: 'display', size: 26, color: col || C.sun, alpha: q(d), halo: true, maxW: 180 });
            Art.arrow(g, x1, y1, x2, y2, { color: col || C.sun, w: 4, head: 12, p: q(d) });
          };
          lab('Steel bomb', 94, 170, 150, 182, c.bx0 - 6, 200, 0.05);
          lab('Water', 88, 300, 136, 300, c.wx0 + 22, 300, 0.25, ENDO);
          lab('Sample', 712, 360, 664, 360, 418, 372, 0.45);
          lab('Insulated jacket', 696, 254, 680, 274, 604, 300, 0.6);
          lab('Stirrer', 118, 50, 172, 56, 240, 74, 0.75);
        },
      },
      {
        say: 'The steel cannot stretch, so the <b>volume stays constant</b>. The gases cannot push anything out of the way. That means the heat measured here is the change in <b>internal energy</b>, written $\\Delta E$.',
        dur: 3.2,
        draw(g, p, t, { W, H }) {
          Art.bench(g, W, 420, H - 420);
          const c = bombCal(g, 250, 420, 0.86, { t });
          const q = seg(p, 0.2, 0.5);
          // Gas pushes, the walls push back.
          for (let i = 0; i < 3; i++) {
            const y = c.iy0 + 22 + i * 44;
            Art.arrow(g, c.ix0 + 26, y, c.ix0 + 3, y, { color: C.sun, w: 4, head: 11, p: q, alpha: 0.8 + Math.sin(t * 5 + i) * 0.2 });
            Art.arrow(g, c.ix1 - 26, y, c.ix1 - 3, y, { color: C.sun, w: 4, head: 11, p: q, alpha: 0.8 + Math.sin(t * 5 + i) * 0.2 });
          }
          Art.pill(g, 'Volume cannot change', 610, 110, { size: 28, color: C.sun, text: '#1A0F2E', alpha: seg(p, 0.3, 0.5) });
          Art.text(g, 'No expansion, so no work', 610, 168, { size: 25, alpha: seg(p, 0.45, 0.65) });
          Art.text(g, 'All the energy leaves as heat', 610, 206, { size: 24, alpha: seg(p, 0.55, 0.75), maxW: 330 });
          const a = seg(p, 0.7, 0.9);
          if (a > 0) {
            g.fillStyle = Art.alpha(C.plum2, a); Art.round(g, 492, 254, 236, 96, 22); g.fill();
            Art.text(g, 'q = ΔE', 610, 302, { font: 'display', size: 52, color: C.sun, alpha: a });
          }
        },
      },
      {
        say: 'A small electric spark sets it off. The sample burns in a flash, turning into $\\ce{CO2}$ and $\\ce{H2O}$. All of this happens inside the sealed can.',
        dur: 3,
        draw(g, p, t, { W, H }) {
          Art.bench(g, W, 420, H - 420);
          const sp = seg(p, 0.1, 0.34), fl = seg(p, 0.32, 0.6), fade = seg(p, 0.65, 1);
          const flash = Math.sin(fl * Math.PI * 0.5) * (1 - fade * 0.82);
          bombCal(g, 400, 420, 0.98, { t, spark: sp, flash, burned: fl > 0.5, glow: fl });
          if (fl > 0 && fl < 1) Art.burst(g, 400, 260, fl, { n: 18, r: 160, size: 9, colors: [C.sun, C.fire, '#fff'] });
          Art.pill(g, 'Spark', 650, 354, { size: 26, color: C.sun, text: '#1A0F2E', alpha: sp });
          Art.arrow(g, 610, 354, 416, 364, { color: C.sun, w: 4, head: 12, p: sp });
          Art.text(g, 'C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O', 400, 26, { font: 'display', size: 27, alpha: seg(p, 0.5, 0.75), color: C.ink, halo: true });
        },
      },
      {
        say: 'The heat escapes through the steel into the water. Water and steel are the <b>surroundings</b>. They warm up, so the reaction lost heat and $q_{\\text{rxn}}$ is <b>negative</b>.',
        dur: 3.8,
        draw(g, p, t, { W, H }) {
          Art.bench(g, W, 420, H - 420);
          const u = ease.inOut(seg(p, 0.15, 0.95));
          const T = 24 + EX.dT * u;
          const c = bombCal(g, 300, 420, 0.98, { t, burned: true, glow: 0.5 * (1 - u * 0.75), warm: u * 0.7, reading: T.toFixed(2) + ' °C' });
          // System line inside the bomb.
          sysLine(g, () => Art.round(g, c.ix0 + 3, c.iy0 + 3, c.ix1 - c.ix0 - 6, c.iy1 - c.iy0 - 6, 6), t, seg(p, 0, 0.2), false);
          const midY = (c.iy0 + c.iy1) / 2;
          heatArrow(g, c.bx0 + 12, midY, c.wx0 + 14, midY, t, { w: 17, head: 22, p: seg(p, 0.1, 0.35) });
          heatArrow(g, c.bx0 + c.bw - 12, midY, c.wx1 - 14, midY, t, { w: 17, head: 22, p: seg(p, 0.15, 0.4) });
          Art.pill(g, 'System', 660, 120, { size: 28, font: 'display', color: C.pink, text: '#fff', alpha: seg(p, 0.15, 0.3) });
          Art.text(g, 'the burning sample', 660, 158, { size: 24, alpha: seg(p, 0.15, 0.3), maxW: 240 });
          Art.pill(g, 'Surroundings', 660, 218, { size: 28, font: 'display', color: C.cyan, text: '#1A0F2E', alpha: seg(p, 0.3, 0.45) });
          Art.text(g, 'steel and water', 660, 256, { size: 24, alpha: seg(p, 0.3, 0.45) });
          Art.text(g, 'q < 0', 660, 330, { font: 'display', size: 60, color: C.sun, alpha: seg(p, 0.55, 0.75) });
          Art.text(g, 'for the reaction', 660, 380, { size: 24, alpha: seg(p, 0.55, 0.75) });
        },
      },
      {
        say: 'Multiply the temperature rise by the heat capacity of the whole calorimeter, $C_{\\text{cal}}$. That gives the heat it gained. <b>Flip the sign</b> for the reaction. Then divide by moles.',
        dur: 4.2,
        draw(g, p, t) {
          const line = (s, y, d, o = {}) => Art.text(g, s, o.x || 400, y, Object.assign({ size: 30, alpha: seg(p, d, d + 0.14) }, o));
          Art.text(g, '1.50 g of glucose, in a 10.0 kJ/°C calorimeter', 400, 40, { size: 25, color: C.dim, alpha: seg(p, 0, 0.1) });
          line('ΔT = +' + EX.dT.toFixed(2) + ' °C', 96, 0.05, { color: C.cyan, font: 'display', size: 34 });
          line('q cal = (10.0 kJ/°C)(' + EX.dT.toFixed(2) + ' °C) = +' + (EX.Cc * EX.dT).toFixed(1) + ' kJ', 164, 0.22);
          const qq = EX.Cc * EX.dT;
          const f = seg(p, 0.42, 0.62);
          if (f > 0) {
            g.fillStyle = Art.alpha(C.pink, 0.22 * f); Art.round(g, 136, 202, 528, 66, 20); g.fill();
            g.strokeStyle = Art.alpha(C.pink, f); g.lineWidth = 3; g.stroke();
          }
          line('q rxn = −q cal = −' + qq.toFixed(1) + ' kJ', 235, 0.42, { color: C.sun, font: 'display', size: 36 });
          line('moles = 1.50 g ÷ ' + EX.M.toFixed(2) + ' g/mol = ' + (1.5 / EX.M).toFixed(5) + ' mol', 312, 0.6, { size: 27, maxW: 720 });
          const a = seg(p, 0.78, 0.92);
          if (a > 0) {
            g.fillStyle = Art.alpha(C.plum2, a); Art.round(g, 160, 354, 480, 70, 22); g.fill();
            Art.text(g, Lab.sig(-qq / (1.5 / EX.M), 3).replace('-', '−') + ' kJ per mole', 400, 390, { font: 'display', size: 38, color: C.leaf, alpha: a });
          }
          void t;
        },
      },
      {
        say: 'A coffee cup is open to the air, so <b>pressure</b> stays constant and $q = \\Delta H$. A bomb is sealed, so <b>volume</b> stays constant and $q = \\Delta E$. The two values are usually close.',
        dur: 3.4,
        draw(g, p, t, { W, H }) {
          Art.bench(g, W, 400, H - 400);
          g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(398, 0, 4, 400);
          const a = seg(p, 0, 0.3), b = seg(p, 0.35, 0.65);
          g.save(); g.globalAlpha *= a;
          foamCup(g, 200, 400, 210, 180, { level: 0.68 });
          lid(g, 200, 400 - 180 - 16, 210);
          for (let i = 0; i < 4; i++) {
            const y = 112 + Math.sin(t * 2 + i) * 5;
            Art.arrow(g, 96 + i * 70, y - 40, 96 + i * 70, y + 20, { color: C.cyan, w: 5, head: 15 });
          }
          Art.text(g, 'Air presses from above', 200, 52, { size: 24, color: C.cyan, maxW: 340 });
          g.restore();
          g.save(); g.globalAlpha *= b;
          bombCal(g, 600, 400, 0.72, { t, reading: '24.00 °C' });
          g.restore();
          Art.text(g, 'q = ΔH', 200, 432, { font: 'display', size: 36, color: C.sun, alpha: seg(p, 0.2, 0.35) });
          Art.text(g, 'q = ΔE', 600, 432, { font: 'display', size: 36, color: C.sun, alpha: seg(p, 0.55, 0.7) });
          void W;
        },
      },
    ],
  });

  /* ---------- Bench: fire the bomb ---------- */
  const FUELS = {
    C: { name: 'carbon', f: 'C', dE: -393.5, color: '#2C313C', eq: '\\ce{C(s) + O2(g) -> CO2(g)}' },
    glucose: { name: 'glucose', f: 'C6H12O6', dE: -2803, color: '#F4F2FA', eq: '\\ce{C6H12O6(s) + 6O2(g) -> 6CO2(g) + 6H2O(l)}' },
    sucrose: { name: 'table sugar', f: 'C12H22O11', dE: -5640, color: '#F4F2FA', eq: '\\ce{C12H22O11(s) + 12O2(g) -> 12CO2(g) + 11H2O(l)}' },
  };
  const bomb = { fuel: 'C', m: 1, Cc: 10, state: 'ready', t0: 0 };
  const bombModel = () => {
    const F = FUELS[bomb.fuel], M = Bank.molarMass(F.f);
    const n = bomb.m / M, q = -F.dE * n, dT = q / bomb.Cc;
    return { F, M, n, q, dT };
  };
  const bombStage = Lab.stage('#c-bomb', {
    h: 480, bg: 'lab',
    label: 'A cutaway bomb calorimeter next to a live graph of temperature, with the heat of the calorimeter and the reaction shown as numbers.',
    draw(g, t) {
      const m = bombModel();
      let el = bomb.state === 'ready' ? -1 : t - bomb.t0;
      if (Lab.reducedMotion && bomb.state !== 'ready') el = 99;
      const started = el >= 0;
      const sp = started ? clamp(el / 0.35) : 0;
      const flRaw = started ? clamp((el - 0.3) / 0.5) : 0;
      const flash = started ? Math.sin(Math.min(1, flRaw) * Math.PI * 0.5) * clamp(1 - (el - 0.8) / 1.2, 0.15, 1) : 0;
      const u = el < 0.5 ? 0 : 1 - Math.exp(-(el - 0.5) * 0.65);
      const Tw = 22 + m.dT * u;
      const base = 410;
      const c = bombCal(g, 232, base, 1, { t, spark: sp < 1 ? sp : 0, flash, burned: flRaw > 0.5, glow: flRaw * (1 - u * 0.85), warm: clamp((Tw - 22) / 8) * 0.8, reading: Tw.toFixed(2) + ' °C', sampleColor: m.F.color });
      if (flRaw > 0 && flRaw < 1) Art.burst(g, 232, base - 150, flRaw, { n: 18, r: 170, size: 9, colors: [C.sun, C.fire, '#fff'] });
      const f = started ? clamp(1 - u * 1.05) : 0;
      if (flRaw > 0.5 && f > 0.03) {
        const midY = (c.iy0 + c.iy1) / 2;
        heatArrow(g, c.bx0 + 12, midY, c.wx0 + 12, midY, t, { w: 17, head: 22, alpha: f });
        heatArrow(g, c.bx0 + c.bw - 12, midY, c.wx1 - 12, midY, t, { w: 17, head: 22, alpha: f });
      }
      // Graph.
      const gx0 = 524, gx1 = 780, gy0 = 216, gy1 = 28;
      g.fillStyle = 'rgba(20,10,40,.55)'; Art.round(g, gx0 - 68, gy1 - 18, gx1 - gx0 + 78, gy0 - gy1 + 58, 14); g.fill();
      g.strokeStyle = C.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(gx0, gy1 - 4); g.lineTo(gx0, gy0); g.lineTo(gx1, gy0); g.stroke();
      Art.text(g, 'time', (gx0 + gx1) / 2, gy0 + 22, { size: 22, color: C.dim });
      const top = Math.max(26, 22 + m.dT + 1);
      const yT = (T) => lerp(gy0, gy1, (T - 21) / (top - 21));
      const xt = (s) => lerp(gx0, gx1, clamp(s / 8));
      Art.text(g, Lab.fmt(top, 0) + ' °C', gx0 - 8, gy1 + 4, { size: 20, align: 'right', color: C.dim });
      Art.text(g, '21 °C', gx0 - 8, gy0 - 8, { size: 20, align: 'right', color: C.dim });
      const elapsed = started ? clamp(el, 0, 8) : 0;
      g.strokeStyle = C.cyan; g.lineWidth = 6; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
      for (let i = 0; i <= 50; i++) {
        const s = (i / 50) * elapsed;
        const uu = s < 0.5 ? 0 : 1 - Math.exp(-(s - 0.5) * 0.65);
        const T = 22 + m.dT * uu;
        if (i) g.lineTo(xt(s), yT(T)); else g.moveTo(xt(s), yT(T));
      }
      g.stroke();
      Art.ball(g, xt(elapsed), yT(Tw), 9, C.cyan);
      // Numbers.
      const X = 618;
      const dTshown = m.dT * u, qc = bomb.Cc * dTshown;
      Art.text(g, 'ΔT = +' + dTshown.toFixed(2) + ' °C', X, 280, { font: 'display', size: 32, color: C.cyan, maxW: 340 });
      Art.text(g, 'Calorimeter: q = ' + (qc > 0.04 ? '+' : '') + Lab.fmt(qc, 1) + ' kJ', X, 326, { size: 24, color: C.leaf, maxW: 340 });
      Art.text(g, 'Reaction: q = ' + (qc > 0.04 ? '−' : '') + Lab.fmt(qc, 1) + ' kJ', X, 362, { size: 24, color: C.pink, maxW: 340 });
      if (!started) Art.text(g, 'Press Ignite', X, 396, { size: 24, color: C.sun, alpha: 0.7 + Math.sin(t * 3) * 0.3 });
      Art.text(g, m.F.name + ', ' + bomb.m.toFixed(1) + ' g', 232, base + 34, { font: 'display', size: 26, color: '#fff' });
    },
  });
  function paintBomb() {
    const m = bombModel();
    const foot = Lab.$('#bomb-foot');
    const qT = m.q;
    let h = `<p>$${m.F.eq.replace(' -> ', ' ->}$ $\\ce{')}$</p>`;
    if (bomb.state === 'ready') {
      h += `<p><b>The sample is the system. The steel and the water are the surroundings.</b> Press Ignite to burn it.</p>`;
    } else {
      h += `<div class="calc-line">$$q_{\\text{cal}} = (${bomb.Cc.toFixed(1)})(${m.dT.toFixed(2)}) = +${qT.toFixed(1)}\\ \\text{kJ}$$</div>
        <div class="calc-line">$$q_{\\text{rxn}} = -${qT.toFixed(1)}\\ \\text{kJ}$$</div>
        <div class="calc-line">$$n = \\dfrac{${bomb.m.toFixed(1)}\\ \\text{g}}{${m.M.toFixed(2)}\\ \\text{g/mol}} = ${m.n.toFixed(4)}\\ \\text{mol}$$</div>
        <div class="calc-line">$$\\Delta E = \\dfrac{-${qT.toFixed(1)}\\ \\text{kJ}}{${m.n.toFixed(4)}\\ \\text{mol}} = ${Lab.fmt(-qT / m.n, 0).replace('-', '-').replace(',', '{,}')}\\ \\text{kJ/mol}$$</div>
        <p>These three fuels do not change the number of gas moles, so here $\\Delta E$ and $\\Delta H$ are practically the same.</p>`;
    }
    foot.innerHTML = Lab.texString(h);
  }
  const bombReset = () => { bomb.state = 'ready'; Lab.$('#bomb-go').disabled = false; paintBomb(); };
  Lab.segmented('#bomb-fuel', (v) => { bomb.fuel = v; bombReset(); });
  Lab.bind('#bomb-m', '#bomb-m-out', (v) => v.toFixed(1) + ' g', (v) => { bomb.m = v; bombReset(); });
  Lab.bind('#bomb-c', '#bomb-c-out', (v) => v.toFixed(1) + ' kJ/°C', (v) => { bomb.Cc = v; bombReset(); });
  Lab.$('#bomb-go').addEventListener('click', () => {
    if (bomb.state !== 'ready') return;
    bomb.state = 'run'; bomb.t0 = bombStage.t; Lab.sound.pop();
    Lab.$('#bomb-go').disabled = true;
    paintBomb();
    bombStage.redraw();
  });
  Lab.$('#bomb-reset').addEventListener('click', bombReset);
  paintBomb();
});
