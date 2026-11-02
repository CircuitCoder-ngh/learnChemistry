/* Lesson 6.1: Energy and heat. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const TAU = Math.PI * 2;
  const smooth = (x) => { const u = clamp(x); return u * u * (3 - 2 * u); };
  const tri = (x) => { const f = x - Math.floor(x); return f < 0.5 ? f * 2 : 2 - f * 2; };
  const EXO = C.fire, ENDO = C.cyan;

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
    gr.addColorStop(0, o.tail || '#E0561B'); gr.addColorStop(1, o.color || '#FFB23F');
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
  /** Marching dashed line around a rounded box. This is always the system boundary. */
  function sysBox(g, x, y, w, h, r, t, a = 1) {
    g.save(); g.globalAlpha *= a;
    Art.round(g, x, y, w, h, r);
    g.fillStyle = Art.alpha(C.pink, 0.1); g.fill();
    g.strokeStyle = C.pink; g.lineWidth = 5; g.setLineDash([15, 10]); g.lineDashOffset = -t * 26; g.stroke();
    g.restore();
  }
  function sysDisc(g, x, y, r, t, a = 1) {
    g.save(); g.globalAlpha *= a;
    const d = g.createRadialGradient(x, y - r * 0.2, r * 0.1, x, y, r);
    d.addColorStop(0, '#46306F'); d.addColorStop(1, '#22123F');
    g.fillStyle = d;
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    g.strokeStyle = C.pink; g.lineWidth = 6; g.setLineDash([17, 11]); g.lineDashOffset = -t * 26; g.stroke();
    g.restore();
  }
  /** Position bouncing inside a rectangle at a speed in units per second. Pure in t. */
  function drift(i, t, speed, x0, y0, x1, y1) {
    const wx = Math.max(1, x1 - x0), wy = Math.max(1, y1 - y0);
    const sx = speed * (0.7 + rand(i + 3.1) * 0.6), sy = speed * (0.7 + rand(i + 7.3) * 0.6);
    return [x0 + tri(rand(i + 1.7) + (t * sx) / (2 * wx)) * wx, y0 + tri(rand(i + 5.9) + (t * sy) / (2 * wy)) * wy];
  }
  /** Bouncing molecules with motion streaks: the faster, the longer the streak. */
  function buzzing(g, n, t, speed, box, f, s, seed = 0, alpha = 1) {
    const [x0, y0, x1, y1] = box;
    for (let i = 0; i < n; i++) {
      const id = i * 3 + seed;
      const [x, y] = drift(id, t, speed, x0, y0, x1, y1);
      if (speed > 70) {
        const [px, py] = drift(id, t - 0.07, speed, x0, y0, x1, y1);
        if (Math.hypot(px - x, py - y) < speed * 0.2) {
          g.strokeStyle = Art.alpha(C.ink, 0.24 * alpha); g.lineWidth = 7; g.lineCap = 'round';
          g.beginPath(); g.moveTo(px, py); g.lineTo(x, y); g.stroke();
        }
      }
      Art.molecule(g, x, y, s, f, { rot: rand(id) * TAU + t * (0.3 + speed * 0.012) * (i % 2 ? 1 : -1), labels: false, style: 'fill', atomScale: 1.28, alpha });
    }
  }
  function packet(g, x, y, r = 11, a = 1) {
    const prev = g.globalAlpha;
    g.globalAlpha = prev * a;
    Art.glow(g, x, y, r * 2.6, C.fire, 0.6);
    Art.ball(g, x, y, r, '#FFA63D');
    g.globalAlpha = prev;
  }
  /** A straight stacked bar. The total length never changes, which is the whole point. */
  function stackBar(g, x, y, w, h, frac, a, b) {
    g.save();
    Art.round(g, x, y, w, h, h / 2); g.clip();
    g.fillStyle = b; g.fillRect(x, y, w, h);
    g.fillStyle = a; g.fillRect(x, y, w * clamp(frac), h);
    g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(x, y, w, h * 0.35);
    g.restore();
    Art.round(g, x, y, w, h, h / 2); g.strokeStyle = '#1A0F2E'; g.lineWidth = 3; g.stroke();
  }
  function rock(g, x, y, r, rot, mood, t, look) {
    Art.ball(g, x, y, r, '#A79BC2');
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = 'rgba(40,24,70,.35)';
    [[-0.5, -0.5, 0.17], [0.55, -0.25, 0.13], [0.42, 0.55, 0.16], [-0.42, 0.58, 0.1]].forEach(([a, b, c]) => { g.beginPath(); g.arc(a * r, b * r, c * r, 0, TAU); g.fill(); });
    g.restore();
    Art.face(g, x, y, r, mood, { t, look });
  }
  const hillY = (x) => 172 + 200 * smooth((x - 170) / 470);
  function hill(g, W, H) {
    const d = g.createLinearGradient(0, 170, 0, H);
    d.addColorStop(0, '#4E8B58'); d.addColorStop(0.2, '#3C6B4B'); d.addColorStop(1, '#27372F');
    g.fillStyle = d;
    g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 10) g.lineTo(x, hillY(x));
    g.lineTo(W, H); g.closePath(); g.fill();
    g.strokeStyle = '#8EE6A0'; g.lineWidth = 4;
    g.beginPath();
    for (let x = 0; x <= W; x += 10) { if (x) g.lineTo(x, hillY(x)); else g.moveTo(x, hillY(x)); }
    g.stroke();
  }
  /** Wallet that heat is compared to. */
  function wallet(g, x, y, s = 1) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 72, 110, 13, 0, 0, TAU); g.fill();
    const b = g.createLinearGradient(0, -60, 0, 70);
    b.addColorStop(0, '#A86D3D'); b.addColorStop(1, '#6C4023');
    g.fillStyle = b; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    Art.round(g, -100, -60, 200, 130, 18); g.fill(); g.stroke();
    g.fillStyle = '#8B5730';
    Art.round(g, -100, -60, 200, 62, 18); g.fill(); g.stroke();
    g.setLineDash([7, 6]); g.strokeStyle = 'rgba(255,230,190,.6)'; g.lineWidth = 2.2;
    Art.round(g, -90, -50, 180, 110, 12); g.stroke(); g.setLineDash([]);
    g.fillStyle = C.sun; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
    g.beginPath(); g.arc(0, 2, 13, 0, TAU); g.fill(); g.stroke();
    g.restore();
  }
  function coin(g, x, y, r = 19) {
    Art.ball(g, x, y, r, '#FFC83D');
    Art.text(g, '$', x, y + 1, { font: 'display', size: r * 1.25, color: '#8A5A00' });
  }
  /** One of the small pictures of what is inside a system. */
  function sysPicture(g, kind, cx, cy, s, t) {
    if (kind === 'flame') {
      Art.flame(g, cx, cy + 70 * s, 150 * s, t, { kind: 'blue', wide: 0.95 });
      g.fillStyle = '#8F8DA6'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
      Art.round(g, cx - 34 * s, cy + 68 * s, 68 * s, 18 * s, 4); g.fill(); g.stroke();
    } else if (kind === 'pouch' || kind === 'coldpack') {
      const cold = kind === 'coldpack';
      g.save(); g.translate(cx, cy); g.scale(s, s);
      const b = g.createLinearGradient(0, -60, 0, 60);
      b.addColorStop(0, cold ? '#BFEFFF' : '#FFC69A'); b.addColorStop(1, cold ? '#3DA8E0' : '#D9652B');
      g.fillStyle = b; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
      Art.round(g, -75, -55, 150, 110, 18); g.fill(); g.stroke();
      g.setLineDash([6, 6]); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2.5;
      Art.round(g, -65, -45, 130, 90, 12); g.stroke(); g.setLineDash([]);
      for (let i = 0; i < 16; i++) {
        const x = -56 + rand(i + 2) * 112, y = -34 + rand(i + 9) * 68;
        g.fillStyle = cold ? 'rgba(255,255,255,.75)' : '#7A2F12';
        g.beginPath(); g.arc(x, y, 2.5 + rand(i) * 3, 0, TAU); g.fill();
      }
      g.restore();
    } else if (kind === 'ice' || kind === 'freeze') {
      g.save(); g.translate(cx, cy + 6 * s); g.scale(s, s);
      const a = 78;
      const f = g.createLinearGradient(-a / 2, -a / 2, a / 2, a / 2);
      f.addColorStop(0, '#E8FBFF'); f.addColorStop(1, '#7FCFF2');
      g.fillStyle = '#C8F0FF'; g.beginPath(); g.moveTo(-a / 2, -a / 2); g.lineTo(-a / 2 + 22, -a / 2 - 18); g.lineTo(a / 2 + 22, -a / 2 - 18); g.lineTo(a / 2, -a / 2); g.closePath(); g.fill();
      g.fillStyle = '#70C2E8'; g.beginPath(); g.moveTo(a / 2, -a / 2); g.lineTo(a / 2 + 22, -a / 2 - 18); g.lineTo(a / 2 + 22, a / 2 - 18); g.lineTo(a / 2, a / 2); g.closePath(); g.fill();
      g.fillStyle = f; g.fillRect(-a / 2, -a / 2, a, a);
      g.strokeStyle = 'rgba(16,8,32,.5)'; g.lineWidth = 2.5; g.strokeRect(-a / 2, -a / 2, a, a);
      if (kind === 'ice') {
        const d = (t * 0.6) % 1;
        g.fillStyle = C.water;
        g.beginPath(); g.arc(-8, a / 2 + 8 + d * 18, 6, 0, TAU); g.fill();
        g.fillStyle = 'rgba(70,185,240,.5)'; g.beginPath(); g.ellipse(4, a / 2 + 30, 60, 8, 0, 0, TAU); g.fill();
      }
      g.restore();
    } else if (kind === 'boil') {
      Art.beaker(g, cx, cy + 66 * s, 136 * s, 120 * s, { level: 0.8, ticks: false, inside: (gg, b) => Art.bubbles(gg, b.x0 + 8, b.x1 - 8, b.bottom - 6, b.top + 8, t, { n: 12, r: 6 }) });
    } else if (kind === 'steam') {
      Art.smoke(g, cx, cy + 64 * s, t, { n: 9, h: 130 * s, r: 14 * s, alpha: 0.42, spread: 26, color: '#F4F0FF' });
      for (let i = 0; i < 5; i++) {
        const x = cx - 54 * s + i * 27 * s, y = cy + 32 * s + (i % 2) * 13;
        g.fillStyle = C.water; g.beginPath(); g.arc(x, y, 7 * s, 0, TAU); g.fill();
        g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(x - 2, y - 2, 2, 0, TAU); g.fill();
      }
    } else if (kind === 'rock') {
      rock(g, cx, cy + 5 * s, 56 * s, 0.4, 'sleepy', t);
    } else if (kind === 'drink') {
      Art.beaker(g, cx, cy + 66 * s, 116 * s, 124 * s, { level: 0.76, ticks: false, liquid: '#C9863D', inside: (gg, b) => {
        for (let i = 0; i < 2; i++) { gg.fillStyle = 'rgba(232,251,255,.85)'; Art.round(gg, cx - 34 * s + i * 34 * s, b.top + 7 + i * 16, 28 * s, 28 * s, 5); gg.fill(); }
      } });
    }
  }

  /* ---------- Story 1: two kinds of energy ---------- */
  Lab.story('#story-kinds', {
    title: 'Energy of motion, energy of position',
    scenes: [
      {
        say: 'A rock at the top of a hill is not moving, but it holds energy. It could roll down and smash something. Stored energy like this is <b>potential energy</b>.',
        dur: 3,
        draw(g, p, t, { W, H }) {
          hill(g, W, H);
          const q = ease.back(seg(p, 0.05, 0.4));
          const rx = 104, r = 54;
          g.save(); g.translate(rx, hillY(rx) - r); g.scale(q, q); rock(g, 0, 0, r, 0.2, 'happy', t, [1, 0.4]); g.restore();
          Art.pill(g, 'Stored energy', 270, 96, { size: 26, color: C.violet, text: '#1A0F2E', alpha: seg(p, 0.45, 0.65) });
          Art.arrow(g, 202, 104, 164, 128, { color: C.violet, w: 5, p: seg(p, 0.5, 0.7) });
          // The stacked energy bar.
          const a = seg(p, 0.3, 0.7);
          g.save(); g.globalAlpha *= a;
          Art.text(g, 'Potential', 470, 60, { size: 24, align: 'left', color: C.violet });
          Art.text(g, 'Kinetic', 770, 60, { size: 24, align: 'right', color: C.cyan });
          stackBar(g, 470, 78, 300, 34, 1, C.violet, C.cyan);
          g.restore();
          Art.moe(g, 700, 376, 150, 'point', { t, flip: true });
        },
      },
      {
        say: 'Let it go. As it drops, potential energy turns into energy of motion, called <b>kinetic energy</b>. The bar never gets longer or shorter: energy only changes form.',
        dur: 3.8,
        draw(g, p, t, { W, H }) {
          hill(g, W, H);
          const q = ease.in(seg(p, 0.08, 0.8));
          const r = 54, rx = lerp(104, 690, q);
          const ry = hillY(rx) - r;
          const pe = (hillY(760) - hillY(rx)) / (hillY(760) - hillY(0));
          if (q > 0.05 && q < 0.98) {
            for (let i = 0; i < 4; i++) {
              const sp = 60 + i * 28;
              g.strokeStyle = `rgba(255,255,255,${0.35 - i * 0.06})`; g.lineWidth = 5; g.lineCap = 'round';
              g.beginPath(); g.moveTo(rx - sp - 30, ry - 30 + i * 22); g.lineTo(rx - sp, ry - 30 + i * 22); g.stroke();
            }
          }
          rock(g, rx, ry, r, rx * 0.03, p >= 0.8 ? 'wow' : 'grin', t, [1, 0.4]);
          Art.text(g, 'Potential', 470, 60, { size: 24, align: 'left', color: C.violet });
          Art.text(g, 'Kinetic', 770, 60, { size: 24, align: 'right', color: C.cyan });
          stackBar(g, 470, 78, 300, 34, pe, C.violet, C.cyan);
          Art.text(g, 'The total stays the same', 620, 142, { size: 24, color: C.sun, alpha: seg(p, 0.5, 0.75) });
        },
      },
      {
        say: 'Atoms and molecules work the same way. Every particle is moving, so every particle has kinetic energy. <b>Temperature</b> measures how fast they move on average.',
        dur: 3,
        draw(g, p, t, { W }) {
          const a = seg(p, 0, 0.3), b = seg(p, 0.3, 0.6);
          const boxes = [[50, 74, 330, 280, ENDO], [420, 74, 330, 280, EXO]];
          boxes.forEach(([x, y, w, h, c], i) => {
            const al = i ? b : a;
            if (al <= 0) return;
            g.save(); g.globalAlpha *= al;
            g.fillStyle = Art.alpha(c, 0.12); Art.round(g, x, y, w, h, 20); g.fill();
            g.strokeStyle = c; g.lineWidth = 4; g.stroke();
            g.save(); Art.round(g, x, y, w, h, 20); g.clip();
            buzzing(g, 5, t, i ? 240 : 26, [x + 40, y + 40, x + w - 40, y + h - 40], 'H2O', 34, i * 40);
            g.restore();
            g.restore();
          });
          Art.text(g, 'Cold water: slow', 215, 40, { font: 'display', size: 32, color: ENDO, alpha: a });
          Art.text(g, 'Hot water: fast', 585, 40, { font: 'display', size: 32, color: EXO, alpha: b });
          Art.text(g, 'Faster particles have more kinetic energy', 400, 404, { size: 28, alpha: seg(p, 0.65, 0.9) });
        },
      },
      {
        say: 'Particles have potential energy too. Atoms attract each other. Hold them apart and energy is stored, like a rock on a high shelf. Let them snap together and that energy comes out.',
        dur: 3.8,
        draw(g, p, t, { W }) {
          // Two shelves, high and low.
          const top = 150, low = 346;
          const shelf = (y, x0, x1) => {
            const s = g.createLinearGradient(0, y, 0, y + 16);
            s.addColorStop(0, '#9A7CC9'); s.addColorStop(1, '#56407F');
            g.fillStyle = s; Art.round(g, x0, y, x1 - x0, 16, 8); g.fill();
          };
          shelf(top, 60, 400); shelf(low, 380, 740);
          Art.text(g, 'Atoms apart: more potential energy', 230, 42, { size: 24, alpha: seg(p, 0, 0.2), maxW: 400 });
          Art.text(g, 'Bonded: less potential energy', 560, 394, { size: 24, alpha: seg(p, 0.65, 0.85) });
          const q = ease.in(seg(p, 0.25, 0.62));
          const x1 = lerp(130, 526, q), x2 = lerp(330, 594, q);
          const y = lerp(top - 50, low - 50, q);
          const snapped = p >= 0.62;
          if (q > 0 && q < 1) {
            g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 4; g.setLineDash([8, 8]);
            g.beginPath(); g.moveTo(130, top - 50); g.lineTo(x1, y); g.moveTo(330, top - 50); g.lineTo(x2, y); g.stroke(); g.setLineDash([]);
          }
          // Ghosts on the top shelf once the real atoms have left.
          if (q > 0) { Art.atom(g, 130, top - 50, 46, 'H', { label: false, alpha: 0.28 }); Art.atom(g, 330, top - 50, 46, 'H', { label: false, alpha: 0.28 }); }
          if (snapped) Art.bond(g, x1, y, x2, y, { width: 10 });
          Art.atom(g, x1, y, 46, 'H', { face: snapped ? 'grin' : 'happy', t, seed: 1, look: [1, 0.1] });
          Art.atom(g, x2, y, 46, 'H', { face: snapped ? 'grin' : 'happy', t, seed: 2, look: [-1, 0.1] });
          Art.arrow(g, 400, 150, 470, 268, { color: C.ink, w: 5, curve: -26, p: seg(p, 0.1, 0.3), dash: [10, 9], alpha: 0.55 });
          // Released energy spreads outward.
          const out = seg(p, 0.62, 0.8);
          if (out > 0) {
            for (let i = 0; i < 8; i++) {
              const a = (i / 8) * TAU + 0.2;
              const u = (t * 0.45 + i * 0.125) % 1;
              packet(g, 560 + Math.cos(a) * (70 + u * 150), low - 50 + Math.sin(a) * (40 + u * 130), 10, out * (1 - u));
            }
            Art.pill(g, 'Energy released', 560, 196, { size: 26, color: EXO, text: '#1A0F2E', alpha: out });
          }
          void W;
        },
      },
      {
        say: 'Burning methane puts it all together. <b>Chemical potential energy</b> turns into fast motion, which is <b>thermal energy</b>. Energy changed form. None of it was made from nothing.',
        dur: 4,
        draw(g, p, t) {
          Art.bunsen(g, 120, 386, 1.35, { air: 1, t });
          Art.text(g, 'What you see', 120, 42, { size: 24, color: C.dim, alpha: seg(p, 0, 0.2) });
          Art.zoom(g, 124, 190, 470, 168, 148, (gg, cx, cy, R) => {
            const speed = lerp(30, 170, seg(p, 0.35, 0.85));
            buzzing(gg, 2, t, speed, [cx - R * 0.7, cy - R * 0.7, cx + R * 0.7, cy + R * 0.7], 'CO2', 40, 3);
            buzzing(gg, 4, t, speed, [cx - R * 0.72, cy - R * 0.72, cx + R * 0.72, cy + R * 0.72], 'H2O', 38, 14);
            for (let i = 0; i < 6; i++) {
              const a = (i / 6) * TAU, u = (t * 0.4 + i / 6) % 1;
              packet(gg, cx + Math.cos(a) * u * R, cy + Math.sin(a) * u * R, 9, seg(p, 0.35, 0.6) * (1 - u));
            }
          }, { p: seg(p, 0.08, 0.3), rim: C.cyan });
          Art.formula(g, 'CH4 + 2 O2 -> CO2 + 2 H2O + heat', 470, 348, { size: 31, halo: true });
          const f = 1 - ease.inOut(seg(p, 0.35, 0.9));
          Art.text(g, 'Chemical potential', 262, 388, { size: 24, align: 'left', color: C.violet });
          Art.text(g, 'Thermal', 760, 388, { size: 24, align: 'right', color: EXO });
          stackBar(g, 262, 406, 498, 30, f, C.violet, EXO);
        },
      },
      {
        say: 'We measure energy in <b>joules</b>. Lifting an apple one meter takes about 1 J. Warming 1 g of water by 1 °C takes 1 <b>calorie</b>, or 4.184 J. A food <b>Calorie</b> is 1000 of those.',
        dur: 3.8,
        draw(g, p, t, { W }) {
          const tile = (i, big, sub, draw) => {
            const x = 30 + i * 253, q = ease.back(seg(p, 0.05 + i * 0.25, 0.3 + i * 0.25));
            if (q <= 0) return;
            g.save(); g.translate(x + 120, 225); g.scale(q, q); g.translate(-x - 120, -225);
            g.fillStyle = 'rgba(255,255,255,.08)'; Art.round(g, x, 40, 240, 370, 24); g.fill();
            g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 3; g.stroke();
            draw(x + 120);
            Art.text(g, big, x + 120, 300, { font: 'display', size: 36, color: C.sun });
            Art.text(g, sub, x + 120, 348, { size: 25 });
            g.restore();
          };
          tile(0, '1 joule', 'about one apple,', (x) => {
            const bob = Math.sin(t * 1.6) * 16;
            g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 3; g.setLineDash([6, 6]);
            g.beginPath(); g.moveTo(x + 64, 92); g.lineTo(x + 64, 232); g.stroke(); g.setLineDash([]);
            Art.arrow(g, x + 64, 232, x + 64, 92, { color: C.leaf, w: 5 });
            const ay = 160 + bob;
            Art.ball(g, x - 16, ay, 44, '#F2465A');
            g.strokeStyle = '#5C3A1E'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 16, ay - 40); g.quadraticCurveTo(x - 14, ay - 54, x - 6, ay - 60); g.stroke();
            g.fillStyle = '#3DDC84'; g.beginPath(); g.ellipse(x + 8, ay - 54, 15, 8, -0.5, 0, TAU); g.fill();
          });
          Art.text(g, 'lifted one meter', 150, 378, { size: 25, alpha: seg(p, 0.25, 0.35) });
          tile(1, '1 calorie', '= 4.184 J', (x) => {
            const dg = g.createRadialGradient(x - 12, 170, 6, x, 180, 64);
            dg.addColorStop(0, '#CDEFFF'); dg.addColorStop(0.5, '#58C0F2'); dg.addColorStop(1, '#1B6FB8');
            g.fillStyle = dg;
            g.beginPath(); g.moveTo(x, 94); g.bezierCurveTo(x + 16, 128, x + 54, 150, x + 54, 186);
            g.bezierCurveTo(x + 54, 220, x + 28, 240, x, 240); g.bezierCurveTo(x - 28, 240, x - 54, 220, x - 54, 186); g.bezierCurveTo(x - 54, 150, x - 16, 128, x, 94); g.fill();
            g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(x - 24, 186, 8, 15, 0.3, 0, TAU); g.fill();
            Art.text(g, '1 g', x, 192, { font: 'display', size: 36, color: '#fff', halo: true });
          });
          Art.text(g, 'warms 1 g water 1 °C', 403, 378, { size: 25, alpha: seg(p, 0.5, 0.6), maxW: 225 });
          tile(2, '1 Calorie', '= 1000 cal', (x) => {
            g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x, 238, 74, 12, 0, 0, TAU); g.fill();
            g.fillStyle = '#D69A58'; g.beginPath(); g.ellipse(x, 172, 80, 66, 0, 0, TAU); g.fill();
            g.fillStyle = '#FF7FBF'; g.beginPath(); g.ellipse(x, 164, 76, 56, 0, 0, TAU); g.fill();
            g.fillStyle = '#2D1B4E'; g.beginPath(); g.ellipse(x, 166, 22, 17, 0, 0, TAU); g.fill();
            for (let i = 0; i < 12; i++) {
              const a = (i / 12) * TAU, rr = 42 + (i % 2) * 8;
              g.save(); g.translate(x + Math.cos(a) * rr * 1.2, 164 + Math.sin(a) * rr * 0.86); g.rotate(a * 2);
              g.fillStyle = [C.sun, C.cyan, '#fff', C.leaf][i % 4]; g.fillRect(-7, -2.5, 14, 5); g.restore();
            }
          });
          Art.text(g, 'what food labels use', 656, 378, { size: 25, alpha: seg(p, 0.75, 0.85), maxW: 225 });
          void W;
        },
      },
    ],
  });

  /* ---------- Story 2: which way does heat go? ---------- */
  const BX = 400, BB = 386, BW = 290, BH = 262;
  const AIR = [[52, 186], [226, 66], [592, 62], [84, 256], [654, 130], [204, 206], [612, 226]];
  function airMolecules(g, t, amp, alpha = 1) {
    AIR.forEach(([x, y], i) => {
      const f = i % 3 === 0 ? 'O2' : 'N2';
      const fast = 1 + amp * 2.6;
      Art.molecule(g, x + wander(i * 2.1, t * fast) * (8 + amp * 28), y + wander(i * 3.3 + 9, t * fast) * (8 + amp * 26), 24, f, { rot: rand(i) * TAU + t * 0.4 * fast * (i % 2 ? 1 : -1), labels: false, style: 'fill', atomScale: 1.25, alpha });
    });
  }
  function beakerSystem(g, t, o = {}) {
    let inner = null;
    const liquid = o.liquid || '#7E57E8';
    Art.beaker(g, BX, BB, BW, BH, {
      level: 0.62, liquid, ticks: false,
      inside: (gg, b) => {
        inner = b;
        for (let i = 0; i < 5; i++) {
          const [x, y] = drift(i * 2 + 11, t, o.speed || 26, b.x0 + 44, b.top + 40, b.x1 - 44, b.bottom - 34);
          Art.molecule(gg, x, y, 30, i % 2 ? 'CH4' : 'O2', { rot: rand(i) * TAU + t * 0.5, labels: false, style: 'fill', atomScale: 1.2, alpha: 0.95 });
        }
      },
    });
    if (inner) sysBox(g, inner.x0 + 8, inner.top + 8, BW - 16, BB - inner.top - 16, 14, t, o.sysA === undefined ? 1 : o.sysA);
    return inner;
  }
  function roomThermometer(g, frac, label, a = 1) {
    g.save(); g.globalAlpha *= a;
    Art.thermometer(g, 722, 98, 228, frac, { w: 24, color: frac > 0.5 ? '#FF6A3D' : '#3DA8FF' });
    g.restore();
    Art.text(g, label, 722, 66, { size: 24, alpha: a });
  }
  const ARROWS_OUT = [[286, 318, 126, 318], [514, 318, 672, 318], [316, 262, 194, 124], [400, 246, 400, 84], [484, 262, 606, 124]];

  Lab.story('#story-flow', {
    title: 'Which way does the heat go?',
    scenes: [
      {
        say: 'Say a reaction is happening in this beaker. The reacting chemicals are what you care about, so they are the <b>system</b>. The dashed pink line is its boundary.',
        dur: 2.8,
        draw(g, p, t, { W, H }) {
          Art.bench(g, W, BB, H - BB);
          airMolecules(g, t, 0, 0.32);
          beakerSystem(g, t, { sysA: seg(p, 0.2, 0.5) });
          Art.pill(g, 'System', BX, 204, { size: 34, font: 'display', color: C.pink, text: '#fff', alpha: seg(p, 0.35, 0.6) });
          Art.text(g, 'the boundary', 692, 300, { size: 26, color: C.pink, alpha: seg(p, 0.5, 0.75) });
          Art.arrow(g, 602, 300, 548, 300, { color: C.pink, w: 5, head: 14, p: seg(p, 0.55, 0.8) });
        },
      },
      {
        say: 'Everything else is the <b>surroundings</b>: the glass, the bench, the air, you. The universe is just the system plus the surroundings.',
        dur: 3.2,
        draw(g, p, t, { W, H }) {
          const a = seg(p, 0.05, 0.4);
          const wash = g.createRadialGradient(BX, 230, 180, BX, 230, 520);
          wash.addColorStop(0, Art.alpha(C.cyan, 0)); wash.addColorStop(1, Art.alpha(C.cyan, 0.22 * a));
          g.fillStyle = wash; g.fillRect(0, 0, W, H);
          Art.bench(g, W, BB, H - BB);
          airMolecules(g, t, 0, lerp(0.32, 1, a));
          beakerSystem(g, t, { sysA: 0.55 });
          Art.pill(g, 'System', BX, 204, { size: 26, font: 'display', color: C.pink, text: '#fff', alpha: 0.75 });
          Art.pill(g, 'Surroundings', BX, 46, { size: 34, font: 'display', color: C.cyan, text: '#1A0F2E', alpha: a });
          const lab = (s, x, y, tx, ty, d) => {
            const al = seg(p, d, d + 0.2);
            Art.text(g, s, x, y, { size: 25, alpha: al, halo: true });
            Art.arrow(g, tx[0], tx[1], ty[0], ty[1], { color: C.ink, w: 3.5, head: 11, p: al });
          };
          lab('air', 118, 130, [102, 148], [70, 172], 0.3);
          lab('glass', 150, 300, [186, 300], [250, 300], 0.45);
          lab('bench', 660, 420, [612, 420], [560, 412], 0.6);
          Art.moe(g, 690, 386, 160, 'wave', { t, flip: true });
        },
      },
      {
        say: 'Think of the system as your wallet. Money going <b>out</b> gets a minus sign. Money coming <b>in</b> gets a plus sign. Heat works exactly the same way.',
        dur: 3.2,
        draw(g, p, t) {
          const a = seg(p, 0, 0.3), b = seg(p, 0.35, 0.65);
          Art.text(g, 'Money out', 230, 40, { font: 'display', size: 36, color: EXO, alpha: a });
          Art.text(g, 'Money in', 570, 40, { font: 'display', size: 36, color: ENDO, alpha: b });
          g.save(); g.globalAlpha *= a; wallet(g, 230, 216); g.restore();
          g.save(); g.globalAlpha *= b; wallet(g, 570, 216); g.restore();
          for (let i = 0; i < 3; i++) {
            const u = (t * 0.42 + i / 3) % 1;
            if (a > 0) { const q = ease.out(u); g.save(); g.globalAlpha *= a * (1 - u * u); coin(g, 230 + (i - 1) * 74 * q, 180 - q * 96, 19); g.restore(); }
            if (b > 0) { const q = ease.in(u); g.save(); g.globalAlpha *= b * Math.min(1, u * 5); coin(g, 570 + (i - 1) * 74 * (1 - q), 84 + q * 96, 19); g.restore(); }
          }
          Art.text(g, '−', 84, 216, { font: 'display', size: 74, color: EXO, alpha: a });
          Art.text(g, '+', 716, 216, { font: 'display', size: 74, color: ENDO, alpha: b });
          const c = seg(p, 0.7, 0.95);
          if (c > 0) {
            Art.pill(g, 'Heat out: q is negative', 222, 340, { size: 27, color: EXO, text: '#1A0F2E', alpha: c });
            Art.pill(g, 'Heat in: q is positive', 578, 340, { size: 27, color: ENDO, text: '#1A0F2E', alpha: c });
            Art.text(g, 'Always from the point of view of the system', 400, 410, { size: 25, alpha: c, color: C.sun });
          }
        },
      },
      {
        say: 'Now the chemicals give off heat. Heat flows <b>out</b> of the system, so the surroundings warm up and $q$ is <b>negative</b>. This is an <b>exothermic</b> process.',
        dur: 3.4,
        draw(g, p, t, { W, H }) {
          const a = ease.inOut(seg(p, 0.15, 0.85));
          const wash = g.createRadialGradient(BX, 280, 120, BX, 280, 560);
          wash.addColorStop(0, Art.alpha(EXO, 0.18 * a)); wash.addColorStop(1, Art.alpha(EXO, 0.32 * a));
          g.fillStyle = wash; g.fillRect(0, 0, W, H);
          Art.bench(g, W, BB, H - BB);
          airMolecules(g, t, a * 0.6);
          beakerSystem(g, t);
          ARROWS_OUT.forEach(([x1, y1, x2, y2], i) => heatArrow(g, x1, y1, x2, y2, t, { p: seg(p, 0.1 + i * 0.05, 0.45 + i * 0.05), w: 22 }));
          roomThermometer(g, lerp(0.42, 0.84, a), 'Air');
          Art.text(g, 'q < 0', 110, 54, { font: 'display', size: 54, color: C.sun, alpha: seg(p, 0.5, 0.7), halo: true });
          Art.pill(g, 'Exothermic', 110, 104, { size: 26, color: EXO, text: '#1A0F2E', alpha: seg(p, 0.55, 0.75) });
          Art.text(g, 'Heat leaves', 106, 372, { size: 26, alpha: seg(p, 0.6, 0.8), halo: true });
          Art.text(g, 'warmer', 722, 370, { size: 25, color: EXO, alpha: seg(p, 0.7, 0.9), halo: true });
        },
      },
      {
        say: 'Here the chemicals soak up heat instead. Heat flows <b>in</b> to the system, so the surroundings cool down and $q$ is <b>positive</b>. This is an <b>endothermic</b> process.',
        dur: 3.4,
        draw(g, p, t, { W, H }) {
          const a = ease.inOut(seg(p, 0.15, 0.85));
          const wash = g.createRadialGradient(BX, 280, 120, BX, 280, 560);
          wash.addColorStop(0, Art.alpha(ENDO, 0.1 * a)); wash.addColorStop(1, Art.alpha(ENDO, 0.28 * a));
          g.fillStyle = wash; g.fillRect(0, 0, W, H);
          Art.bench(g, W, BB, H - BB);
          airMolecules(g, t, 0.02);
          beakerSystem(g, t, { liquid: '#4E7CE8' });
          ARROWS_OUT.forEach(([x1, y1, x2, y2], i) => heatArrow(g, x2, y2, x1, y1, t, { p: seg(p, 0.1 + i * 0.05, 0.45 + i * 0.05), w: 22 }));
          // Frost creeping up the glass.
          for (let i = 0; i < 18; i++) {
            const fa = clamp(a * 2 - rand(i + 4));
            if (fa <= 0) continue;
            const side = i % 2 ? BX - BW / 2 : BX + BW / 2;
            g.fillStyle = `rgba(224,248,255,${0.75 * fa})`;
            Art.star(g, side + (rand(i + 3) - 0.5) * 12, BB - 12 - rand(i + 8) * 120, 5 + rand(i) * 5, rand(i) * 3);
          }
          roomThermometer(g, lerp(0.42, 0.12, a), 'Air');
          Art.text(g, 'q > 0', 110, 54, { font: 'display', size: 54, color: C.sun, alpha: seg(p, 0.5, 0.7), halo: true });
          Art.pill(g, 'Endothermic', 110, 104, { size: 26, color: ENDO, text: '#1A0F2E', alpha: seg(p, 0.55, 0.75) });
          Art.text(g, 'Heat enters', 106, 372, { size: 26, alpha: seg(p, 0.6, 0.8), halo: true });
          Art.text(g, 'cooler', 722, 370, { size: 25, color: ENDO, alpha: seg(p, 0.7, 0.9), halo: true });
        },
      },
      {
        say: 'Heat is never lost. Whatever the system loses, the surroundings gain. The two numbers are the same size with opposite signs: $q_{\\text{sys}} = -q_{\\text{surr}}$.',
        dur: 3.6,
        draw(g, p, t) {
          const q = ease.inOut(seg(p, 0.15, 0.8));
          const base = 340, h0 = 150, move = 90 * q;
          const col = (x, h, color) => {
            const gr = g.createLinearGradient(x - 70, 0, x + 70, 0);
            gr.addColorStop(0, Art.mix(color, '#ffffff', 0.2)); gr.addColorStop(1, Art.mix(color, '#12062A', 0.2));
            g.fillStyle = gr; Art.round(g, x - 80, base - h, 160, h, 12); g.fill();
            g.strokeStyle = '#1A0F2E'; g.lineWidth = 3; g.stroke();
          };
          col(190, h0 - move, C.pink);
          col(610, h0 + move, C.cyan);
          g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 3; g.setLineDash([8, 8]);
          g.beginPath(); g.moveTo(90, base - h0); g.lineTo(290, base - h0); g.moveTo(510, base - h0); g.lineTo(710, base - h0); g.stroke(); g.setLineDash([]);
          Art.text(g, 'System', 190, 372, { font: 'display', size: 32, color: C.pink });
          Art.text(g, 'Surroundings', 610, 372, { font: 'display', size: 32, color: C.cyan });
          heatArrow(g, 306, 210, 494, 210, t, { p: seg(p, 0.1, 0.4), w: 26 });
          Art.text(g, 'heat', 400, 170, { size: 26, color: EXO, alpha: seg(p, 0.3, 0.5) });
          for (let i = 0; i < 3; i++) packet(g, lerp(300, 500, (t * 0.5 + i / 3) % 1), 210, 9, seg(p, 0.2, 0.4) * 0.7);
          const a = seg(p, 0.6, 0.85);
          Art.text(g, '−50 kJ', 190, 136, { font: 'display', size: 44, color: C.sun, alpha: a });
          Art.text(g, '+50 kJ', 610, 72, { font: 'display', size: 44, color: C.sun, alpha: a });
          Art.text(g, 'Add them up and you get exactly zero', 400, 422, { size: 27, alpha: seg(p, 0.75, 0.95) });
        },
      },
      {
        say: 'Why does a cold pack feel cold? Cold does not flow into your hand. <b>Heat flows out of your hand and into the pack.</b> The pack is the system, so its $q$ is positive.',
        dur: 3.8,
        draw(g, p, t) {
          // The pack.
          const px = 400, py = 340;
          sysPicturePack(g, px, py);
          sysBox(g, px - 148, py - 62, 296, 124, 18, t, seg(p, 0.05, 0.25));
          Art.pill(g, 'System: the pack', 672, py + 16, { size: 25, color: C.pink, text: '#fff', alpha: seg(p, 0.1, 0.3) });
          // The hand comes down.
          const dy = (1 - ease.out(seg(p, 0, 0.25))) * -120;
          g.save(); g.translate(0, dy); hand(g, 400, 122); g.restore();
          Art.pill(g, 'Surroundings: your hand', 590, 46, { size: 25, color: C.cyan, text: '#1A0F2E', alpha: seg(p, 0.15, 0.35) });
          // Real heat arrows.
          [335, 400, 465].forEach((x, i) => heatArrow(g, x, 170, x, 278, t, { p: seg(p, 0.3 + i * 0.05, 0.6 + i * 0.05), w: 22 }));
          // The wrong idea, crossed out.
          const w = seg(p, 0.62, 0.8);
          if (w > 0) {
            Art.arrow(g, 150, 300, 150, 150, { color: ENDO, w: 11, head: 26, alpha: w * 0.8, dash: [14, 10] });
            Art.strike(g, 108, 192, 192, 268, seg(p, 0.72, 0.86), C.red, 9);
            Art.strike(g, 192, 192, 108, 268, seg(p, 0.78, 0.92), C.red, 9);
            Art.text(g, '"cold" flowing up', 122, 330, { size: 24, color: C.red, alpha: w, halo: true });
            Art.text(g, 'Not real', 150, 120, { size: 26, color: C.red, alpha: w, halo: true });
          }
          Art.text(g, 'q > 0', 660, 200, { font: 'display', size: 54, color: C.sun, alpha: seg(p, 0.5, 0.7), halo: true });
        },
      },
    ],
  });
  function sysPicturePack(g, x, y) {
    const b = g.createLinearGradient(0, y - 58, 0, y + 58);
    b.addColorStop(0, '#CFF3FF'); b.addColorStop(1, '#3DA8E0');
    g.fillStyle = b; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    Art.round(g, x - 136, y - 50, 272, 100, 18); g.fill(); g.stroke();
    Art.text(g, 'Cold pack', x, y + 2, { font: 'display', size: 32, color: '#123A66' });
    for (let i = 0; i < 12; i++) { g.fillStyle = 'rgba(255,255,255,.8)'; Art.star(g, x - 120 + rand(i + 2) * 240, y - 36 + rand(i + 9) * 72, 4 + rand(i) * 4, rand(i) * 3); }
  }
  function hand(g, x, y) {
    const skin = g.createLinearGradient(0, y - 90, 0, y + 50);
    skin.addColorStop(0, '#F3C6A2'); skin.addColorStop(1, '#DB9A70');
    g.fillStyle = skin; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    // Fingers hang down from the palm, wrist off to the right.
    [-96, -40, 16, 72].forEach((dx, i) => { Art.round(g, x + dx, y - 8, 48, 62 + (i === 1 || i === 2 ? 8 : 0), 22); g.fill(); g.stroke(); });
    g.beginPath(); g.moveTo(x - 108, y + 20); g.quadraticCurveTo(x - 118, y - 60, x - 60, y - 66); g.lineTo(x + 340, y - 92); g.lineTo(x + 340, y - 16); g.lineTo(x + 140, y + 4); g.quadraticCurveTo(x + 124, y + 28, x + 80, y + 18); g.lineTo(x - 108, y + 20); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(x - 108, y + 20); g.quadraticCurveTo(x - 118, y - 60, x - 60, y - 66); g.lineTo(x + 340, y - 92); g.moveTo(x + 340, y - 16); g.lineTo(x + 140, y + 4); g.stroke();
  }

  /* ---------- Bench: heat flow explorer ---------- */
  const FLOWS = {
    methane: { name: 'Burning methane', sys: 'the burning gas', pic: 'flame', q: -890.3, per: 'mol of methane', tex: '\\ce{CH4(g) + 2O2(g) -> CO2(g) + 2H2O(l)}', say: 'The flame heats everything nearby.' },
    warmer: { name: 'Hand warmer', sys: 'the iron inside', pic: 'pouch', q: -824.2, per: 'mol of iron(III) oxide', tex: '\\ce{2Fe(s) + 3/2 O2(g) -> Fe2O3(s)}', say: 'Iron powder rusts fast inside the pouch, and that warms your fingers.' },
    freeze: { name: 'Water freezing', sys: 'the water', pic: 'freeze', q: -6.01, per: 'mol of water', tex: '\\ce{H2O(l) -> H2O(s)}', say: 'Surprise: freezing gives off heat. The water hands it to the colder freezer air.' },
    condense: { name: 'Steam condensing', sys: 'the steam', pic: 'steam', q: -40.7, per: 'mol of water', tex: '\\ce{H2O(g) -> H2O(l)}', say: 'This is why a steam burn is so nasty. The steam dumps heat into whatever it lands on.' },
    coldpack: { name: 'Cold pack', sys: 'the chemicals', pic: 'coldpack', q: 25.7, per: 'mol of ammonium nitrate', tex: '\\ce{NH4NO3(s) -> NH4+(aq) + NO3^-(aq)}', say: 'The salt dissolves and pulls heat from your skin.' },
    melt: { name: 'Ice melting', sys: 'the ice', pic: 'ice', q: 6.01, per: 'mol of water', tex: '\\ce{H2O(s) -> H2O(l)}', say: 'The warmer room supplies the heat that melts the ice.' },
    boil: { name: 'Water boiling', sys: 'the water', pic: 'boil', q: 40.7, per: 'mol of water', tex: '\\ce{H2O(l) -> H2O(g)}', say: 'The stove has to keep supplying heat the whole time it boils.' },
  };
  const QUIZ = [
    { text: 'A campfire burns.', sys: 'the burning wood', dir: -1, pic: 'flame', why: 'Burning gives off heat. Heat leaves the wood and warms you.' },
    { text: 'A hand warmer heats up your fingers.', sys: 'the chemicals in the warmer', dir: -1, pic: 'pouch', why: 'Heat leaves the chemicals and enters your fingers.' },
    { text: 'Water freezes in an ice tray.', sys: 'the water', dir: -1, pic: 'freeze', why: 'Freezing is exothermic. The water loses heat to the freezer air.' },
    { text: 'Steam condenses on a cold mirror.', sys: 'the steam', dir: -1, pic: 'steam', why: 'The steam loses heat to the mirror as it turns to liquid.' },
    { text: 'An instant cold pack turns cold.', sys: 'the chemicals in the pack', dir: 1, pic: 'coldpack', why: 'The chemicals soak up heat from their surroundings, so $q$ is positive.' },
    { text: 'An ice cube melts on the counter.', sys: 'the ice', dir: 1, pic: 'ice', why: 'Heat enters the ice from the counter and the air.' },
    { text: 'Water boils on a stove.', sys: 'the water', dir: 1, pic: 'boil', why: 'Heat keeps entering the water from the stove.' },
    { text: 'Sweat evaporates off your skin.', sys: 'the sweat', dir: 1, pic: 'steam', why: 'Heat leaves your skin and enters the sweat. That is exactly why sweating cools you.' },
    { text: 'Limestone breaks apart in a hot kiln.', sys: 'the limestone', dir: 1, pic: 'rock', why: 'The reaction runs only while heat keeps entering. Stop heating and it stops.' },
    { text: 'Ice melts in your drink. Choose the ice.', sys: 'the ice', dir: 1, pic: 'drink', why: 'Heat enters the ice from the drink.' },
    { text: 'Ice melts in your drink. Now choose the drink.', sys: 'the drink', dir: -1, pic: 'drink', why: 'Same event, different system. The drink loses heat, so its $q$ is negative. Always check whose $q$ it is.' },
  ];
  const flow = { mode: 'explore', key: 'methane', n: 1, shown: 0.5, test: null, streak: 0, order: [], paid: false };
  function nextQuiz() {
    if (!flow.order.length) flow.order = QUIZ.map((_, i) => i).sort(() => Math.random() - 0.5);
    flow.test = { item: QUIZ[flow.order.pop()], answered: false, right: false };
  }
  Lab.stage('#c-flow', {
    label: 'A pink dashed circle marks the system. Fat orange arrows show heat leaving or entering it. A thermometer shows the surroundings.',
    draw(g, t, dt, s) {
      const cx = 290, cy = 232, r = 118;
      let dir, amt, pic, name, sysName, qText = '', reveal = true;
      if (flow.mode === 'explore') {
        const f = FLOWS[flow.key];
        const q = f.q * flow.n;
        dir = Math.sign(q); amt = Math.sqrt(Math.abs(q) / 4452); pic = f.pic; name = f.name; sysName = f.sys;
        qText = (q > 0 ? '+' : '−') + Lab.fmt(Math.abs(q), Math.abs(q) < 100 ? 1 : 0) + ' kJ';
      } else {
        const it = flow.test.item;
        dir = it.dir; amt = 0.42; pic = it.pic; name = ''; sysName = it.sys;
        reveal = flow.test.answered;
        if (reveal) qText = dir < 0 ? 'q < 0' : 'q > 0';
      }
      const target = reveal ? 0.42 - dir * (0.1 + amt * 0.3) : 0.42;
      flow.shown = lerp(flow.shown, target, clamp(dt * 3));
      const warm = flow.shown - 0.42;
      const wash = g.createRadialGradient(cx, cy, r, cx, cy, 620);
      const col = warm >= 0 ? EXO : ENDO;
      const lev = Math.abs(warm) * 1.1;
      wash.addColorStop(0, Art.alpha(col, 0.1 * Math.min(1, lev * 2))); wash.addColorStop(1, Art.alpha(col, lev));
      g.fillStyle = wash; g.fillRect(0, 0, s.W, s.H);
      // Air in the surroundings.
      [[60, 110], [486, 58], [60, 378], [498, 396], [212, 44]].forEach(([x, y], i) => {
        const fast = 1 + Math.max(0, warm) * 7;
        Art.molecule(g, x + wander(i * 2.4, t * fast) * (6 + Math.max(0, warm) * 44), y + wander(i * 3.9, t * fast) * (6 + Math.max(0, warm) * 34), 22, i % 2 ? 'O2' : 'N2', { rot: rand(i) * TAU + t * 0.4 * fast, labels: false, style: 'fill', atomScale: 1.2 });
      });
      Art.pill(g, 'Surroundings', 100, 30, { size: 25, color: C.cyan, text: '#1A0F2E' });
      sysDisc(g, cx, cy, r, t);
      sysPicture(g, pic, cx, cy + 6, 0.95, t);
      Art.pill(g, 'System: ' + sysName, cx, cy - r - 2, { size: 23, color: C.pink, text: '#fff' });
      // Heat arrows that agree with the sign.
      const angs = [-0.5, 0.2, 0.92, 1.67, 2.42, 3.64];
      const w = 13 + amt * 15;
      if (reveal) {
        angs.forEach((a) => {
          const c = Math.cos(a), d = Math.sin(a);
          const i0 = r - 4, i1 = r + 78;
          if (dir < 0) heatArrow(g, cx + c * i0, cy + d * i0, cx + c * i1, cy + d * i1, t, { w });
          else heatArrow(g, cx + c * i1, cy + d * i1, cx + c * i0, cy + d * i0, t, { w });
        });
      } else {
        angs.forEach((a, i) => {
          const c = Math.cos(a), d = Math.sin(a), rr = r + 42 + Math.sin(t * 2 + i) * 4;
          Art.text(g, '?', cx + c * rr, cy + d * rr, { font: 'display', size: 44, color: C.sun, halo: true });
        });
      }
      // The readout column.
      const X = 625;
      if (name) Art.text(g, name, X, 44, { font: 'display', size: 30, color: '#fff', maxW: 300 });
      else Art.text(g, 'For the system', X, 44, { size: 26, color: '#fff' });
      if (reveal) {
        Art.text(g, flow.mode === 'explore' ? 'q for the system' : 'The sign', X, 104, { size: 24, color: C.dim });
        Art.text(g, qText, X, 156, { font: 'display', size: 54, color: C.sun, maxW: 290 });
        Art.pill(g, dir < 0 ? 'Exothermic' : 'Endothermic', X, 214, { size: 27, color: dir < 0 ? EXO : ENDO, text: '#1A0F2E' });
      } else {
        Art.text(g, '?', X, 150, { font: 'display', size: 90, color: C.sun });
      }
      // Surroundings thermometer.
      Art.thermometer(g, 625, 262, 124, clamp(flow.shown), { w: 20, color: warm >= 0 ? '#FF6A3D' : '#3DA8FF', ticks: true });
      Art.text(g, reveal ? (dir < 0 ? 'warmer' : 'cooler') : 'air nearby', 716, 330, { size: 25, color: reveal ? (dir < 0 ? EXO : ENDO) : C.dim, maxW: 150 });
      void s;
    },
  });
  const flowFoot = Lab.$('#flow-foot');
  function paintFlow() {
    if (flow.mode === 'explore') {
      const f = FLOWS[flow.key], q = f.q * flow.n;
      const dirText = q < 0 ? 'Heat leaves the system, and the surroundings warm up.' : 'Heat enters the system, and the surroundings cool down.';
      flowFoot.innerHTML = Lab.texString(`<p>$${f.tex}$</p><p>${f.say} ${dirText} Each ${f.per} moves ${Math.abs(f.q)} kJ.</p>`);
    } else {
      const { item, answered, right } = flow.test;
      if (!answered) flowFoot.innerHTML = Lab.texString(`<p><b>${item.text}</b> The system is ${item.sys}.</p><p>In a row: ${flow.streak}. Get 5 in a row to discover an element.</p>`);
      else flowFoot.innerHTML = Lab.texString(`<p><b>${right ? 'Yes.' : 'Not this time.'}</b> ${item.why}</p><p>In a row: ${flow.streak}.</p>`);
    }
  }
  function setFlowMode(m) {
    flow.mode = m;
    Lab.$('#flow-explore').hidden = m !== 'explore';
    Lab.$('#flow-amount').hidden = m !== 'explore';
    Lab.$('#flow-test').hidden = m !== 'test';
    if (m === 'test') { nextQuiz(); paintTestButtons(); }
    paintFlow();
  }
  function paintTestButtons() {
    const done = flow.test && flow.test.answered;
    Lab.$('#flow-out').hidden = !!done;
    Lab.$('#flow-in').hidden = !!done;
    Lab.$('#flow-next').hidden = !done;
  }
  function answerFlow(dir) {
    const it = flow.test.item;
    if (flow.test.answered) return;
    flow.test.answered = true;
    flow.test.right = dir === it.dir;
    if (flow.test.right) {
      flow.streak++; Lab.sound.pop();
      if (flow.streak === 5 && !flow.paid) { flow.paid = true; Lab.collection.award(1); Lab.confetti(70); }
    } else { flow.streak = 0; Lab.sound.bad(); }
    paintTestButtons(); paintFlow();
  }
  Lab.segmented('#flow-mode', setFlowMode);
  Lab.segmented('#flow-key', (v) => { flow.key = v; paintFlow(); });
  Lab.bind('#flow-n', '#flow-n-out', (v) => Lab.fmt(v, 1) + ' mol', (v) => { flow.n = v; paintFlow(); });
  Lab.$('#flow-out').addEventListener('click', () => answerFlow(-1));
  Lab.$('#flow-in').addEventListener('click', () => answerFlow(1));
  Lab.$('#flow-next').addEventListener('click', () => { nextQuiz(); paintTestButtons(); paintFlow(); });
  paintFlow();

  /* ---------- Bench: teacup against bathtub ---------- */
  const TEA_G = 200, TUB_G = 150000, CW = 4.184, FUS = 334;
  const tub = { teaBase: 90, tubBase: 40, added: 0, tea: 90, bath: 40, shot: -10, duck: 0 };
  const teaNow = () => Math.min(100, tub.teaBase + (tub.added * 1000) / (TEA_G * CW));
  const tubNow = () => tub.tubBase + (tub.added * 1000) / (TUB_G * CW);
  function teacup(g, x, base, T, t) {
    g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(x, base + 4, 112, 13, 0, 0, TAU); g.fill();
    const sa = g.createLinearGradient(x - 110, 0, x + 110, 0);
    sa.addColorStop(0, '#FFFFFF'); sa.addColorStop(1, '#BDB3D6');
    g.fillStyle = sa; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
    g.beginPath(); g.ellipse(x, base - 4, 104, 12, 0, 0, TAU); g.fill(); g.stroke();
    g.lineWidth = 11; g.strokeStyle = '#1A0F2E';
    g.beginPath(); g.arc(x + 70, base - 60, 25, -1.2, 1.2); g.stroke();
    g.lineWidth = 6.5; g.strokeStyle = '#EFE9FA';
    g.beginPath(); g.arc(x + 70, base - 60, 25, -1.2, 1.2); g.stroke();
    const c = g.createLinearGradient(x - 72, 0, x + 72, 0);
    c.addColorStop(0, '#FFFFFF'); c.addColorStop(0.7, '#E7E1F5'); c.addColorStop(1, '#AEA3CC');
    g.fillStyle = c; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(x - 72, base - 92); g.quadraticCurveTo(x - 66, base - 8, x - 30, base - 8); g.lineTo(x + 30, base - 8); g.quadraticCurveTo(x + 66, base - 8, x + 72, base - 92); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#EFE9FA'; g.beginPath(); g.ellipse(x, base - 92, 72, 13, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = '#B5602A'; g.beginPath(); g.ellipse(x, base - 91, 62, 9, 0, 0, TAU); g.fill();
    Art.smoke(g, x, base - 96, t, { n: 7, h: 40 + T * 0.3, r: 8, alpha: clamp((T - 30) / 90) * 0.5, spread: 14, color: '#F4F0FF' });
  }
  function bathtub(g, x, base, T, t) {
    const w = 320, h = 118;
    g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(x, base + 4, w * 0.56, 13, 0, 0, TAU); g.fill();
    g.fillStyle = '#C9A24A'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
    [[-w * 0.36, 0], [w * 0.36, 0]].forEach(([dx]) => { g.beginPath(); g.ellipse(x + dx, base - 8, 15, 12, 0, 0, TAU); g.fill(); g.stroke(); });
    const b = g.createLinearGradient(0, base - h, 0, base);
    b.addColorStop(0, '#FFFFFF'); b.addColorStop(1, '#BDB3D6');
    g.fillStyle = b;
    g.beginPath(); g.moveTo(x - w / 2 - 6, base - h); g.quadraticCurveTo(x - w / 2 + 4, base - 12, x - w / 2 + 56, base - 12); g.lineTo(x + w / 2 - 56, base - 12); g.quadraticCurveTo(x + w / 2 - 4, base - 12, x + w / 2 + 6, base - h); g.closePath(); g.fill(); g.stroke();
    Art.round(g, x - w / 2 - 12, base - h - 7, w + 24, 15, 7); g.fillStyle = '#F4F0FF'; g.fill(); g.stroke();
    // Water line, seen from just above.
    g.fillStyle = '#58C0F2'; Art.round(g, x - w / 2 + 2, base - h + 8, w - 4, 10, 4); g.fill();
    // Duck.
    const dx = x + 104 + Math.sin(t * 0.8) * 18, dy = base - h + 6 + Math.sin(t * 1.7) * 1.5;
    g.fillStyle = '#FFD23F'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.2;
    g.beginPath(); g.ellipse(dx, dy - 8, 21, 13, 0, 0, TAU); g.fill(); g.stroke();
    g.beginPath(); g.arc(dx + 13, dy - 26, 11, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = '#FF8A2B'; g.beginPath(); g.moveTo(dx + 22, dy - 28); g.lineTo(dx + 33, dy - 25); g.lineTo(dx + 22, dy - 21); g.closePath(); g.fill();
    g.fillStyle = '#1A0F2E'; g.beginPath(); g.arc(dx + 15, dy - 29, 2, 0, TAU); g.fill();
    Art.smoke(g, x + 40, base - h, t, { n: 6, h: 36, r: 7, alpha: clamp((T - 30) / 70) * 0.4, spread: 20, color: '#F4F0FF' });
  }
  const tubStage = Lab.stage('#c-tub', {
    h: 490,
    bg: (g, W, H) => {
      const w = g.createLinearGradient(0, 0, 0, H);
      w.addColorStop(0, '#2C1B4D'); w.addColorStop(1, '#3E2A68');
      g.fillStyle = w; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(398, 0, 4, H);
    },
    label: 'A teacup and a bathtub, each with a thermometer reading, a magnifier of water molecules, and a bar showing how much ice it could melt.',
    draw(g, t, dt, s) {
      tub.tea = lerp(tub.tea, teaNow(), clamp(dt * 2.5));
      tub.bath = lerp(tub.bath, tubNow(), clamp(dt * 2.5));
      const L = 200, R = 600, base = 334;
      teacup(g, L, base, tub.tea, t);
      bathtub(g, R, base, tub.bath, t);
      // Same molecules, moving at different speeds. Exaggerated so you can see it.
      const sp = (T) => 26 + (T - 20) * 3.1;
      Art.zoom(g, L, base - 94, L, 104, 88, (gg, cx, cy, R2) => buzzing(gg, 3, t, sp(tub.tea), [cx - R2 * 0.6, cy - R2 * 0.6, cx + R2 * 0.6, cy + R2 * 0.6], 'H2O', 26, 2), { rim: C.cyan });
      Art.zoom(g, R - 30, base - 118, R - 30, 104, 88, (gg, cx, cy, R2) => buzzing(gg, 3, t, sp(tub.bath), [cx - R2 * 0.6, cy - R2 * 0.6, cx + R2 * 0.6, cy + R2 * 0.6], 'H2O', 26, 30), { rim: C.cyan });
      // Same 20 kJ dropping in as packets.
      const age = t - tub.shot;
      if (age < 1.6) {
        for (let k = 0; k < 2; k++) {
          const x = k ? R : L;
          for (let i = 0; i < 7; i++) {
            const u = clamp(age * 1.25 - i * 0.06);
            if (u <= 0 || u >= 1) continue;
            packet(g, x + (i - 3) * 16 + Math.sin(i + t * 4) * 5, lerp(34, base - 84, ease.in(u)), 10, 1 - u * 0.4);
          }
        }
      }
      Art.text(g, Lab.fmt(tub.tea, 1) + ' °C', L, 374, { font: 'display', size: 42, color: C.sun });
      Art.text(g, Lab.fmt(tub.bath, tub.added > 0 ? 2 : 1) + ' °C', R, 374, { font: 'display', size: 42, color: C.sun });
      const heatTea = (TEA_G * CW * tub.tea) / 1000, heatTub = (TUB_G * CW * tub.bath) / 1000;
      const iceTea = (heatTea * 1000) / FUS / 1000, iceTub = (heatTub * 1000) / FUS / 1000;
      const iceTxt = (kg) => (kg < 1 ? Math.round(kg * 1000) + ' g' : Lab.fmt(kg, 1) + ' kg');
      Art.text(g, 'Could melt ' + iceTxt(iceTea) + ' of ice', L, 416, { size: 25 });
      Art.text(g, 'Could melt ' + iceTxt(iceTub) + ' of ice', R, 416, { size: 25 });
      const max = (TUB_G * CW * 52) / 1000;
      Art.meter(g, 40, 442, 320, 26, heatTea / max, { color: C.pink });
      Art.meter(g, 440, 442, 320, 26, heatTub / max, { color: C.pink });
      void s;
    },
  });
  void tubStage;
  Lab.bind('#tub-tea', '#tub-tea-out', (v) => v + ' °C', (v) => { tub.teaBase = v; tub.added = 0; });
  Lab.bind('#tub-bath', '#tub-bath-out', (v) => v + ' °C', (v) => { tub.tubBase = v; tub.added = 0; });
  Lab.$('#tub-add').addEventListener('click', () => { tub.added += 20; tub.shot = tubStage.t; Lab.sound.pop(); });
  Lab.$('#tub-reset').addEventListener('click', () => { tub.added = 0; });

  /* ---------- Bench: specific heat race ---------- */
  const LANES = [
    { name: 'Water', c: 4.184, label: '= 4.184', draw: (g, x, y) => Art.beaker(g, x, y, 112, 74, { level: 0.82, ticks: false }) },
    { name: 'Sand', c: 0.84, label: '≈ 0.84', draw: (g, x, y) => {
      g.fillStyle = '#6E6A86'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x - 70, y - 10); g.lineTo(x + 70, y - 10); g.lineTo(x + 56, y); g.lineTo(x - 56, y); g.closePath(); g.fill(); g.stroke();
      const d = g.createLinearGradient(0, y - 70, 0, y - 8); d.addColorStop(0, '#F0D59C'); d.addColorStop(1, '#C49A55');
      g.fillStyle = d; g.beginPath(); g.moveTo(x - 62, y - 10); g.quadraticCurveTo(x - 20, y - 74, x, y - 74); g.quadraticCurveTo(x + 20, y - 74, x + 62, y - 10); g.closePath(); g.fill(); g.stroke();
      for (let i = 0; i < 24; i++) { g.fillStyle = `rgba(90,60,20,${0.2 + rand(i) * 0.4})`; const u = rand(i + 3) * 2 - 1, v = rand(i + 8); g.fillRect(x + u * (1 - v) * 54, y - 14 - v * 52, 2.4, 2.4); }
    } },
    { name: 'Iron', c: 0.45, label: '≈ 0.45', draw: (g, x, y) => {
      const f = g.createLinearGradient(x - 50, y - 70, x + 50, y); f.addColorStop(0, '#C4CAD6'); f.addColorStop(1, '#6C7485');
      g.fillStyle = '#8F97A8'; g.beginPath(); g.moveTo(x - 50, y - 66); g.lineTo(x - 34, y - 78); g.lineTo(x + 66, y - 78); g.lineTo(x + 50, y - 66); g.closePath(); g.fill();
      g.fillStyle = '#5C6475'; g.beginPath(); g.moveTo(x + 50, y - 66); g.lineTo(x + 66, y - 78); g.lineTo(x + 66, y - 12); g.lineTo(x + 50, y); g.closePath(); g.fill();
      g.fillStyle = f; g.fillRect(x - 50, y - 66, 100, 66); g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5; g.strokeRect(x - 50, y - 66, 100, 66);
    } },
    { name: 'Gold', c: 0.129, label: '≈ 0.129', draw: (g, x, y) => {
      const f = g.createLinearGradient(x - 60, y - 60, x + 60, y); f.addColorStop(0, '#FFF0A8'); f.addColorStop(0.5, '#FFC83D'); f.addColorStop(1, '#C08A12');
      g.fillStyle = f; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(x - 66, y); g.lineTo(x - 46, y - 64); g.lineTo(x + 46, y - 64); g.lineTo(x + 66, y); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.moveTo(x - 40, y - 58); g.lineTo(x + 40, y - 58); g.lineTo(x + 36, y - 46); g.lineTo(x - 36, y - 46); g.closePath(); g.fill();
    } },
  ];
  const race = { q: 0, m: 100, running: false, order: [] };
  const LANE_X = [122, 308, 494, 680];
  const T0 = 20, TGOAL = 80;
  const raceStage = Lab.stage('#c-race', {
    h: 490, bg: 'lab',
    label: 'Four samples on identical hot plates, each with a thermometer racing toward an 80 degree finish line.',
    draw(g, t, dt, s) {
      if (race.running) {
        const need = race.m * 4.184 * (TGOAL - T0);
        race.q = Math.min(need * 1.03, race.q + (need / 13) * dt);
        syncRaceSlider();
        if (race.q >= need * 1.03) { race.running = false; Lab.sound.fanfare(); Lab.$('#race-go').textContent = 'Start the race'; }
      }
      const finished = [];
      LANES.forEach((L, i) => {
        const need = race.m * L.c * (TGOAL - T0);
        if (race.q >= need) finished.push(i);
      });
      const benchTop = s.H - 70;
      const tTop = 92, tH = 236, tBase = tTop + tH;
      const yOf = (T) => tBase - (tH - 8) * (T / 100);
      Art.text(g, 'Each sample has received ' + Lab.fmt(race.q / 1000, 2) + ' kJ', 400, 26, { size: 26, color: C.sun });
      // Finish line.
      g.strokeStyle = C.leaf; g.lineWidth = 4; g.setLineDash([14, 10]);
      g.beginPath(); g.moveTo(26, yOf(TGOAL)); g.lineTo(s.W - 26, yOf(TGOAL)); g.stroke(); g.setLineDash([]);
      LANES.forEach((L, i) => {
        const x = LANE_X[i];
        const T = Math.min(TGOAL, T0 + race.q / (race.m * L.c));
        const done = finished.includes(i);
        // Hot plate with a coil that glows while heat is flowing.
        const on = race.q > 0 && !done;
        const pY = benchTop - 12;
        g.fillStyle = '#4A4560'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
        Art.round(g, x - 78, pY, 156, 14, 5); g.fill(); g.stroke();
        if (on) Art.glow(g, x, pY, 90, EXO, 0.35 + Math.sin(t * 6 + i) * 0.06);
        g.fillStyle = on ? '#FF6A2B' : '#5C5777'; Art.round(g, x - 66, pY - 3, 132, 6, 3); g.fill();
        L.draw(g, x, pY - 3, t, T);
        // Thermometer stands in the sample.
        const frac = T / 100;
        const heat = clamp((T - T0) / (TGOAL - T0));
        Art.thermometer(g, x, tTop, tH, frac, { w: 18, color: Art.mix('#3DA8FF', '#FF4D5E', heat), ticks: false });
        if (on) {
          for (let k = 0; k < 3; k++) {
            const u = (t * 0.9 + k / 3 + i * 0.13) % 1;
            packet(g, x - 34 + k * 34, lerp(pY - 2, pY - 42, u), 7, (1 - u) * 0.95);
          }
        }
        Art.text(g, Math.round(T) + ' °C', x, 62, { font: 'display', size: 32, color: done ? C.leaf : C.ink });
        if (done) {
          const place = race.order.indexOf(i) >= 0 ? race.order.indexOf(i) : finished.indexOf(i);
          const needKJ = (race.m * L.c * (TGOAL - T0)) / 1000;
          Art.pill(g, ['1st', '2nd', '3rd', '4th'][place], x + 54, yOf(TGOAL) + 30, { size: 22, color: C.sun, text: '#1A0F2E' });
          Art.text(g, Lab.fmt(needKJ, needKJ < 1 ? 2 : 1) + ' kJ', x - 54, yOf(TGOAL) + 30, { size: 22, color: C.leaf, halo: true });
        }
        Art.text(g, L.name, x, benchTop + 22, { font: 'display', size: 28, color: '#fff' });
        Art.text(g, 'c ' + L.label, x, benchTop + 52, { size: 22, color: '#FFE9C9', maxW: 178 });
      });
      finished.forEach((i) => { if (!race.order.includes(i)) race.order.push(i); });
      Art.text(g, '80 °C', 770, yOf(TGOAL) - 16, { size: 22, color: C.leaf, align: 'right', halo: true });
    },
  });
  void raceStage;
  function syncRaceSlider() {
    const el = Lab.$('#race-q');
    el.value = race.q / 1000;
    Lab.paintRange(el);
    Lab.$('#race-q-out').textContent = Lab.fmt(race.q / 1000, 2) + ' kJ';
  }
  Lab.bind('#race-q', '#race-q-out', (v) => Lab.fmt(v, 2) + ' kJ', (v) => { race.q = v * 1000; race.running = false; race.order = []; Lab.$('#race-go').textContent = 'Start the race'; });
  Lab.bind('#race-m', '#race-m-out', (v) => v + ' g', (v) => { race.m = v; race.q = 0; race.running = false; race.order = []; const el = Lab.$('#race-q'); el.max = (v * 4.184 * 62) / 1000; syncRaceSlider(); Lab.$('#race-go').textContent = 'Start the race'; });
  Lab.$('#race-go').addEventListener('click', () => {
    if (race.running) { race.running = false; Lab.$('#race-go').textContent = 'Keep racing'; return; }
    const need = race.m * 4.184 * (TGOAL - T0);
    if (race.q >= need) { race.q = 0; race.order = []; }
    race.running = true; Lab.$('#race-go').textContent = 'Pause'; Lab.sound.pop();
  });
  Lab.$('#race-reset').addEventListener('click', () => { race.q = 0; race.running = false; race.order = []; syncRaceSlider(); Lab.$('#race-go').textContent = 'Start the race'; });

  /* ---------- Bench: rearrange the heat equation ---------- */
  const MATS = { water: { name: 'water', c: 4.184, color: '#46B9F0' }, al: { name: 'aluminum', c: 0.90, color: '#C9C2D6' }, fe: { name: 'iron', c: 0.45, color: '#9AA3B2' }, cu: { name: 'copper', c: 0.385, color: '#D98A4A' } };
  const KNOWN = [['water', 4.184], ['ethanol', 2.44], ['aluminum', 0.90], ['iron', 0.45], ['copper', 0.385], ['gold', 0.129]];
  const sol = { x: 'q', dir: 1, sub: 'water', m: 100, dT: 25, q: 5, tiles: {} };
  const TILE = { q: { sym: 'q', color: EXO }, m: { sym: 'm', color: C.violet }, c: { sym: 'c', color: C.leaf }, dT: { sym: 'ΔT', color: C.cyan } };
  function solved() {
    const c = MATS[sol.sub].c, d = sol.dir;
    if (sol.x === 'q') return { q: sol.m * c * sol.dT * d, m: sol.m, c, dT: sol.dT * d };
    const q = sol.q * 1000 * d;
    if (sol.x === 'm') return { q, m: q / (c * sol.dT * d), c, dT: sol.dT * d };
    if (sol.x === 'c') return { q, m: sol.m, c: q / (sol.m * sol.dT * d), dT: sol.dT * d };
    return { q, m: sol.m, c, dT: q / (sol.m * c) };
  }
  function layout() {
    if (sol.x === 'q') return { q: [106, 92], m: [320, 92], c: [490, 92], dT: [660, 92], eq: 206, bar: null, times: [[405, 92], [575, 92]] };
    const others = ['m', 'c', 'dT'].filter((k) => k !== sol.x);
    const pos = { [sol.x]: [106, 104], q: [490, 52] };
    pos[others[0]] = [400, 158]; pos[others[1]] = [580, 158];
    return { ...pos, eq: 206, bar: [290, 690, 104], times: [[490, 158]] };
  }
  const solveStage = Lab.stage('#c-solve', {
    h: 470,
    label: 'The heat equation as four colored tiles that rearrange around the unknown, above a sample with heat arrows and two thermometers.',
    draw(g, t, dt) {
      const v = solved();
      const pos = layout();
      ['q', 'm', 'c', 'dT'].forEach((k) => {
        const tl = sol.tiles[k] || (sol.tiles[k] = { x: pos[k][0], y: pos[k][1] });
        tl.x = lerp(tl.x, pos[k][0], clamp(dt * 7)); tl.y = lerp(tl.y, pos[k][1], clamp(dt * 7));
      });
      if (pos.bar) {
        g.fillStyle = C.ink; Art.round(g, pos.bar[0], pos.bar[2] - 3, pos.bar[1] - pos.bar[0], 6, 3); g.fill();
      }
      Art.text(g, '=', pos.eq, pos[sol.x][1], { font: 'display', size: 52, color: C.ink });
      pos.times.forEach(([x, y]) => Art.text(g, '×', x, y, { font: 'display', size: 34, color: C.dim }));
      const val = {
        q: Lab.fmt(Math.abs(v.q) < 1000 ? v.q : v.q / 1000, Math.abs(v.q) < 1000 ? 0 : 2).replace('-', '−') + (Math.abs(v.q) < 1000 ? ' J' : ' kJ'),
        m: Lab.sig(v.m, 3) + ' g', c: sol.x === 'c' ? Lab.sig(v.c, 3) : String(v.c), dT: (v.dT > 0 ? '+' : '−') + Lab.sig(Math.abs(v.dT), 3) + ' °C',
      };
      ['q', 'm', 'c', 'dT'].forEach((k) => {
        const T = TILE[k], tl = sol.tiles[k], is = k === sol.x;
        const w = 132, h = is ? 106 : 88;
        g.save();
        if (is) Art.glow(g, tl.x, tl.y, 118, C.sun, 0.3 + Math.sin(t * 3) * 0.06);
        g.fillStyle = Art.mix(T.color, '#1A0F2E', 0.62); g.strokeStyle = is ? C.sun : T.color; g.lineWidth = is ? 5 : 3.5;
        Art.round(g, tl.x - w / 2, tl.y - h / 2, w, h, 18); g.fill(); g.stroke();
        Art.text(g, T.sym, tl.x, tl.y - (is ? 19 : 15), { font: 'display', size: is ? 40 : 32, color: is ? C.sun : T.color });
        Art.text(g, val[k], tl.x, tl.y + (is ? 26 : 22), { size: is ? 24 : 22, color: '#fff', maxW: w - 12 });
        g.restore();
      });
      // Below: the sample and what the sign means.
      const sy = 340, sx = 178, heating = v.q > 0;
      const mat = sol.x === 'c' ? { color: '#B9AFD2', name: 'mystery' } : MATS[sol.sub];
      const size = 40 + Math.cbrt(v.m) * 7;
      const box = Math.min(120, size);
      if (sol.sub === 'water' && sol.x !== 'c') {
        Art.beaker(g, sx, sy + 70, box + 34, box + 30, { level: 0.82, ticks: false });
      } else {
        const f = g.createLinearGradient(sx - box / 2, sy, sx + box / 2, sy + box);
        f.addColorStop(0, Art.mix(mat.color, '#ffffff', 0.3)); f.addColorStop(1, Art.mix(mat.color, '#000000', 0.2));
        g.fillStyle = f; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
        Art.round(g, sx - box / 2, sy + 70 - box, box, box, 7); g.fill(); g.stroke();
      }
      const ay = sy + 70 - box * 0.52;
      if (heating) {
        heatArrow(g, sx - box / 2 - 112, ay, sx - box / 2 - 18, ay, t, { w: 20 });
        heatArrow(g, sx + box / 2 + 112, ay, sx + box / 2 + 18, ay, t, { w: 20 });
      } else {
        heatArrow(g, sx - box / 2 - 18, ay, sx - box / 2 - 112, ay, t, { w: 20 });
        heatArrow(g, sx + box / 2 + 18, ay, sx + box / 2 + 112, ay, t, { w: 20 });
      }
      Art.text(g, heating ? 'Heat enters: q is positive' : 'Heat leaves: q is negative', sx + 24, 440, { size: 24, color: C.sun, maxW: 330 });
      // Thermometers before and after.
      const Ti = heating ? 20 : 100;
      const Tf = Ti + v.dT;
      const showF = clamp(Tf, -10, 110);
      const far = !Number.isFinite(Tf) || Tf > 110 || Tf < -10;
      const frac = (T) => clamp((T + 10) / 120);
      Art.thermometer(g, 480, 254, 138, frac(Ti), { w: 20, color: '#FF4D5E', ticks: false });
      Art.thermometer(g, 650, 254, 138, frac(showF), { w: 20, color: heating ? '#FF4D5E' : '#3DA8FF', ticks: false });
      Art.text(g, 'Start', 480, 426, { size: 22, color: C.dim });
      Art.text(g, 'End', 650, 426, { size: 22, color: C.dim });
      Art.text(g, Ti + ' °C', 480, 452, { font: 'display', size: 26 });
      Art.text(g, far ? 'off the scale' : Lab.fmt(Tf, Math.abs(Tf) < 100 ? 1 : 0) + ' °C', 650, 452, { font: 'display', size: 26, color: far ? C.red : C.sun, maxW: 190 });
      Art.arrow(g, 520, 324, 610, 324, { color: C.ink, w: 5, head: 15 });
      Art.text(g, val.dT, 565, 296, { size: 23, color: C.cyan, maxW: 120 });
    },
  });
  void solveStage;
  function paintSolve() {
    const v = solved();
    const unit = { c: '\\tfrac{\\text{J}}{\\text{g}\\cdot{}^\\circ\\text{C}}' };
    const qs = `${v.q < 0 ? '-' : ''}${Lab.fmt(Math.abs(v.q), 0).replace(/,/g, '{,}')}\\ \\text{J}`;
    const ds = `(${v.dT > 0 ? '+' : '-'}${Lab.sig(Math.abs(v.dT), 3)}\\ {}^\\circ\\text{C})`;
    let lines = '';
    const row = (s) => { lines += `<div class="calc-line">$$${s}$$</div>`; };
    const name = (sol.x === 'c' ? 'the mystery sample' : MATS[sol.sub].name);
    if (sol.x === 'q') {
      row('q = m\\,c\\,\\Delta T');
      row(`q = (${Lab.sig(v.m, 3)}\\ \\text{g})(${v.c}\\ ${unit.c})${ds} = ${qs}`);
    } else if (sol.x === 'm') {
      row('q = m\\,c\\,\\Delta T \\quad\\Rightarrow\\quad m = \\dfrac{q}{c\\,\\Delta T}');
      row(`m = \\dfrac{${qs}}{(${v.c}\\ ${unit.c})${ds}} = ${Lab.sig(v.m, 3)}\\ \\text{g}`);
    } else if (sol.x === 'c') {
      row('q = m\\,c\\,\\Delta T \\quad\\Rightarrow\\quad c = \\dfrac{q}{m\\,\\Delta T}');
      row(`c = \\dfrac{${qs}}{(${Lab.sig(v.m, 3)}\\ \\text{g})${ds}} = ${Lab.sig(v.c, 3)}\\ ${unit.c}`);
    } else {
      row('q = m\\,c\\,\\Delta T \\quad\\Rightarrow\\quad \\Delta T = \\dfrac{q}{m\\,c}');
      row(`\\Delta T = \\dfrac{${qs}}{(${Lab.sig(v.m, 3)}\\ \\text{g})(${v.c}\\ ${unit.c})} = ${v.dT > 0 ? '+' : '-'}${Lab.sig(Math.abs(v.dT), 3)}\\ {}^\\circ\\text{C}`);
    }
    let extra = `Heat ${v.q > 0 ? 'enters' : 'leaves'} ${name}, so $q$ is ${v.q > 0 ? 'positive' : 'negative'} and $\\Delta T$ is too.`;
    if (v.q < 0) extra = `Heat leaves ${name}, so $q$ and $\\Delta T$ are both negative.`;
    else extra = `Heat enters ${name}, so $q$ and $\\Delta T$ are both positive.`;
    if (sol.x === 'c') {
      let best = KNOWN[0], bd = Infinity;
      KNOWN.forEach((k) => { const d = Math.abs(Math.log(v.c / k[1])); if (d < bd) { bd = d; best = k; } });
      extra += bd < 0.08 ? ` That is close to <b>${best[0]}</b> (about ${best[1]}).` : ' That does not match anything in the table above.';
    }
    if (sol.x === 'dT' && Math.abs(v.dT) > 90) extra += ' A change this big would melt, boil or burn most samples, so the simple equation stops being reliable.';
    Lab.$('#solve-calc').innerHTML = Lab.texString(lines + `<p>${extra}</p>`);
    Lab.$('#solve-sub-wrap').style.opacity = sol.x === 'c' ? 0.4 : 1;
    Lab.$('#solve-m-wrap').style.opacity = sol.x === 'm' ? 0.4 : 1;
    Lab.$('#solve-t-wrap').style.opacity = sol.x === 'dT' ? 0.4 : 1;
    Lab.$('#solve-q-wrap').style.opacity = sol.x === 'q' ? 0.4 : 1;
    Lab.$('#solve-m').disabled = sol.x === 'm';
    Lab.$('#solve-t').disabled = sol.x === 'dT';
    Lab.$('#solve-q').disabled = sol.x === 'q';
    Lab.$$('#solve-sub button').forEach((b) => { b.disabled = sol.x === 'c'; });
  }
  Lab.segmented('#solve-x', (v) => { sol.x = v; paintSolve(); });
  Lab.segmented('#solve-dir', (v) => { sol.dir = +v; paintSolve(); });
  Lab.segmented('#solve-sub', (v) => { sol.sub = v; paintSolve(); });
  Lab.bind('#solve-m', '#solve-m-out', (v) => v + ' g', (v) => { sol.m = v; paintSolve(); });
  Lab.bind('#solve-t', '#solve-t-out', (v) => v + ' °C', (v) => { sol.dT = v; paintSolve(); });
  Lab.bind('#solve-q', '#solve-q-out', (v) => Lab.fmt(v, 1) + ' kJ', (v) => { sol.q = v; paintSolve(); });
  paintSolve();
});
