/* Lesson 9.1: Pressure and the gas laws.
   Story gas is a pure function of time (bouncing triangle waves). The gas lab is a real Sim.Box. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, rand, wander } = Lab;
  const C = Art.C;
  const TAU = Math.PI * 2;
  const R_GAS = 0.08206; // L atm / (mol K)

  /* ---------- Shared drawing helpers ---------- */

  /** Art.zoom draws an arc of radius R - 7, which throws while the lens is still tiny. Skip those few frames. */
  const zoom = (g, fx, fy, cx, cy, r, inside, o = {}) => { if (r * ease.back(clamp(o.p === undefined ? 1 : o.p)) > 8) Art.zoom(g, fx, fy, cx, cy, r, inside, o); };

  /** Integral of rateOf(q) over a scene, where q = t / dur holds at 1 after dur. Keeps moving walls pure. */
  function flow(t, dur, rateOf) {
    const T = Math.min(t, dur), N = 30;
    let s = 0;
    for (let i = 0; i < N; i++) s += rateOf(((i + 0.5) / N) * (T / dur));
    s *= T / N;
    if (t > dur) s += (t - dur) * rateOf(1);
    return s;
  }
  /** Phases for gasField when speed and box size change through a scene. */
  function motion(t, dur, vOf, wOf, hOf) {
    const q = clamp(t / dur);
    return {
      phx: flow(t, dur, (s) => vOf(s) / wOf(s)), phy: flow(t, dur, (s) => vOf(s) / hOf(s)),
      ratex: vOf(q) / wOf(q), ratey: vOf(q) / hOf(q),
    };
  }
  const steady = (t, v, w, h) => ({ phx: (t * v) / w, phy: (t * v) / h, ratex: v / w, ratey: v / h });

  function spark(g, x, y, age) {
    const a = 1 - age;
    g.save();
    g.globalAlpha *= a;
    g.fillStyle = C.sun;
    Art.star(g, x, y, 15 * (0.5 + 0.5 * a), age * 2);
    g.fillStyle = '#fff';
    Art.star(g, x, y, 7 * (0.5 + 0.5 * a), age * 2 + 0.4);
    g.restore();
  }
  /** Bouncing molecules inside box. Particles keep their identity however the box changes. */
  function gasField(g, box, n, m, o = {}) {
    const seed = o.seed || 1, r = o.r || 15, bond = o.bond || 13;
    const w = Math.max(1, box.x1 - box.x0 - 2 * r), h = Math.max(1, box.y1 - box.y0 - 2 * r);
    for (let i = 0; i < n; i++) {
      const kx = 0.6 + rand(seed + i * 1.31) * 0.8, ky = 0.6 + rand(seed + i * 2.17) * 0.8;
      const u = rand(seed + i * 3.7) * 2 + m.phx * kx, v = rand(seed + i * 5.9) * 2 + m.phy * ky;
      const mu = ((u % 2) + 2) % 2, mv = ((v % 2) + 2) % 2;
      const x = box.x0 + r + w * (mu < 1 ? mu : 2 - mu), y = box.y0 + r + h * (mv < 1 ? mv : 2 - mv);
      if (o.sparks !== false) {
        const ax = (mu % 1) / (m.ratex * kx), ay = (mv % 1) / (m.ratey * ky), fl = 0.17;
        if (ax < fl && (!o.only || o.only(mu < 1 ? 'L' : 'R'))) spark(g, mu < 1 ? box.x0 : box.x1, y, ax / fl);
        if (ay < fl && (!o.only || o.only(mv < 1 ? 'T' : 'B'))) spark(g, x, mv < 1 ? box.y0 : box.y1, ay / fl);
      }
      const q = o.pop ? o.pop(i) : 1;
      if (q <= 0) continue;
      const f = o.mix && i % 5 === 4 ? 'O2' : (o.formula || 'N2');
      Art.molecule(g, x, y, bond * q, f, { rot: rand(seed + i) * 6.28 + (o.spin === undefined ? (m.phx + m.phy) * 0.9 : o.spin) * (0.5 + rand(i)), style: 'fill', atomScale: 1.28, labels: false });
    }
  }

  /** Dark glass chamber back, with a heat tint. */
  function chamberBack(g, x0, x1, floor, top, T = 300) {
    const hot = clamp((T - 300) / 300), cold = clamp((300 - T) / 200);
    const gr = g.createLinearGradient(0, top, 0, floor);
    gr.addColorStop(0, 'rgba(30,18,60,.75)');
    gr.addColorStop(1, hot > 0 ? Art.alpha(Art.mix('#2A1A52', '#C2410C', hot * 0.75), 0.85) : Art.alpha(Art.mix('#2A1A52', '#1565C0', cold * 0.75), 0.85));
    g.fillStyle = gr; g.fillRect(x0, top, x1 - x0, floor - top);
  }
  /** Glass walls and metal floor, drawn in front of the gas. */
  function chamberFront(g, x0, x1, floor, top) {
    g.lineCap = 'round';
    g.strokeStyle = 'rgba(18,7,40,.7)'; g.lineWidth = 9;
    g.beginPath(); g.moveTo(x0, top); g.lineTo(x0, floor); g.lineTo(x1, floor); g.lineTo(x1, top); g.stroke();
    g.strokeStyle = C.glass; g.lineWidth = 5;
    g.beginPath(); g.moveTo(x0, top); g.lineTo(x0, floor); g.lineTo(x1, floor); g.lineTo(x1, top); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.2)';
    Art.round(g, x0 + 8, top + 8, 6, floor - top - 26, 3); g.fill();
  }
  /** Piston head (y is its bottom face) with a rod running off the top of the stage. */
  function pistonHead(g, x0, x1, y, o = {}) {
    const h = o.h || 30, cx = (x0 + x1) / 2, rodTop = o.rodTop === undefined ? -6 : o.rodTop;
    const rod = g.createLinearGradient(cx - 13, 0, cx + 13, 0);
    rod.addColorStop(0, '#6F6A8B'); rod.addColorStop(0.45, '#E2DEF2'); rod.addColorStop(1, '#5E5A7B');
    g.fillStyle = rod; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
    g.fillRect(cx - 13, rodTop, 26, y - h - rodTop + 2);
    g.strokeRect(cx - 13, rodTop, 26, y - h - rodTop + 2);
    const head = g.createLinearGradient(0, y - h, 0, y);
    head.addColorStop(0, '#E8E4F5'); head.addColorStop(0.5, '#B2ACC9'); head.addColorStop(1, '#6F6A8B');
    g.fillStyle = head;
    Art.round(g, x0 + 3, y - h, x1 - x0 - 6, h, 6); g.fill(); g.stroke();
    g.fillStyle = 'rgba(26,15,46,.3)';
    g.fillRect(x0 + 3, y - 7, x1 - x0 - 6, 3);
    if (o.label) Art.text(g, o.label, cx, y - h / 2 - 2, { size: 20, color: '#1F1236' });
    if (o.pins) {
      [x0 - 3, x1 + 3].forEach((px, i) => {
        const dir = i ? 1 : -1;
        g.fillStyle = C.red; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
        Art.round(g, Math.min(px, px + dir * 22) - (i ? 0 : 0), y - h + 5, 22, 18, 5); g.fill(); g.stroke();
      });
    }
  }
  /** Heat source under a chamber: flames when hot, frost when cold. */
  function heater(g, x0, x1, y, h, T, t) {
    const hot = clamp((T - 300) / 300), cold = clamp((300 - T) / 200);
    const body = g.createLinearGradient(0, y, 0, y + h);
    body.addColorStop(0, Art.mix(Art.mix('#7D7798', '#FF6A2B', hot), '#8FD6FF', cold));
    body.addColorStop(1, '#3A3456');
    g.fillStyle = body; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
    Art.round(g, x0 + 8, y + 2, x1 - x0 - 16, h - 2, 7); g.fill(); g.stroke();
    if (hot > 0.02) {
      for (let i = 0; i < 6; i++) Art.flame(g, x0 + 34 + ((x1 - x0 - 68) * i) / 5, y + h - 3, (12 + hot * 30) * (0.8 + 0.3 * rand(i)), t + i * 0.7, { wide: 1.1 });
    }
    if (cold > 0.02) {
      g.strokeStyle = Art.alpha('#E8F8FF', 0.9); g.lineWidth = 2.4; g.lineCap = 'round';
      for (let i = 0; i < 7; i++) {
        const fx = x0 + 28 + ((x1 - x0 - 56) * i) / 6, fy = y + h * 0.54, s = 6 + 7 * cold;
        for (let a = 0; a < 3; a++) {
          const an = (a / 3) * Math.PI;
          g.beginPath(); g.moveTo(fx - Math.cos(an) * s, fy - Math.sin(an) * s); g.lineTo(fx + Math.cos(an) * s, fy + Math.sin(an) * s); g.stroke();
        }
      }
    }
  }
  /** A round pressure dial. Readout sits on an LCD below the face. */
  function gauge(g, x, y, R, val, o = {}) {
    const max = o.max || 10, step = o.step || 2, A0 = Math.PI * 0.75, SW = Math.PI * 1.5;
    const ang = (v) => A0 + SW * clamp(v / max, 0, 1.03);
    g.save();
    g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.arc(x + 2, y + 5, R + 1, 0, TAU); g.fill();
    const b = g.createLinearGradient(x - R, y - R, x + R, y + R);
    b.addColorStop(0, '#F1EDFB'); b.addColorStop(0.5, '#9D97B9'); b.addColorStop(1, '#514B6C');
    g.fillStyle = b; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    g.beginPath(); g.arc(x, y, R, 0, TAU); g.fill(); g.stroke();
    const f = g.createRadialGradient(x, y - R * 0.3, R * 0.1, x, y, R * 0.92);
    f.addColorStop(0, '#3C2A68'); f.addColorStop(1, '#170C29');
    g.fillStyle = f; g.beginPath(); g.arc(x, y, R * 0.9, 0, TAU); g.fill();
    const band = (a, c, col) => { g.strokeStyle = col; g.lineWidth = R * 0.075; g.beginPath(); g.arc(x, y, R * 0.8, ang(a), ang(c)); g.stroke(); };
    band(0, max * 0.6, C.leaf); band(max * 0.6, max * 0.85, C.sun); band(max * 0.85, max, C.red);
    g.lineCap = 'round';
    for (let v = 0; v <= max + 1e-6; v += step / 2) {
      const a = ang(v), major = Math.abs(v / step - Math.round(v / step)) < 1e-6;
      g.strokeStyle = major ? '#fff' : 'rgba(255,255,255,.55)'; g.lineWidth = major ? 3 : 2;
      g.beginPath(); g.moveTo(x + Math.cos(a) * R * 0.86, y + Math.sin(a) * R * 0.86);
      g.lineTo(x + Math.cos(a) * R * (major ? 0.7 : 0.75), y + Math.sin(a) * R * (major ? 0.7 : 0.75)); g.stroke();
      if (major) Art.text(g, String(Math.round(v * 10) / 10), x + Math.cos(a) * R * 0.53, y + Math.sin(a) * R * 0.53, { size: 20, color: '#F2ECFF' });
    }
    Art.text(g, o.unit || 'atm', x, y + R * 0.32, { size: 20, color: C.dim });
    const needle = (v, col, w, len) => {
      const a = ang(v);
      g.save(); g.translate(x, y); g.rotate(a);
      g.fillStyle = col; g.beginPath(); g.moveTo(-R * 0.1, -w); g.lineTo(R * len, 0); g.lineTo(-R * 0.1, w); g.closePath(); g.fill();
      g.restore();
    };
    if (o.ghost !== undefined) { g.globalAlpha *= 0.95; needle(o.ghost, 'rgba(47,214,242,.75)', 4.5, 0.8); }
    needle(val, C.pink, 6.5, 0.74);
    g.fillStyle = '#E8E4F5'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
    g.beginPath(); g.arc(x, y, R * 0.1, 0, TAU); g.fill(); g.stroke();
    const lw = o.lcdW || 124, lh = o.lcdH || 40, ly = y + R * 0.62;
    g.fillStyle = '#0F2A1E'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    Art.round(g, x - lw / 2, ly, lw, lh, 9); g.fill(); g.stroke();
    Art.text(g, o.readout || Lab.fmt(val, 2) + ' atm', x, ly + lh / 2 + 1, { size: o.lcdSize || 26, color: '#6CFFAF', font: 'display' });
    g.restore();
  }
  /** Plot frame. Returns value-to-stage mappers. box: {x, y, w, h}. */
  function axes(g, b, o) {
    const X = (v) => b.x + ((v - o.xmin) / (o.xmax - o.xmin)) * b.w;
    const Y = (v) => b.y + b.h - ((v - o.ymin) / (o.ymax - o.ymin)) * b.h;
    g.fillStyle = 'rgba(14,6,30,.62)';
    Art.round(g, b.x, b.y, b.w, b.h, 8); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.1)'; g.lineWidth = 2;
    (o.xticks || []).forEach((v) => { g.beginPath(); g.moveTo(X(v), b.y); g.lineTo(X(v), b.y + b.h); g.stroke(); });
    (o.yticks || []).forEach((v) => { g.beginPath(); g.moveTo(b.x, Y(v)); g.lineTo(b.x + b.w, Y(v)); g.stroke(); });
    g.strokeStyle = C.ink; g.lineWidth = 3; g.lineCap = 'round';
    const ax = o.xmin < 0 && o.xmax > 0 ? X(0) : b.x;
    g.beginPath(); g.moveTo(ax, b.y); g.lineTo(ax, b.y + b.h); g.moveTo(b.x, b.y + b.h); g.lineTo(b.x + b.w, b.y + b.h); g.stroke();
    const fx = o.xfmt || String, fy = o.yfmt || String;
    (o.xticks || []).forEach((v) => Art.text(g, fx(v), X(v), b.y + b.h + 16, { size: 20, color: C.dim }));
    (o.yticks || []).forEach((v) => Art.text(g, fy(v), b.x - 8, Y(v), { size: 20, align: 'right', color: C.dim }));
    if (o.ylabel) Art.text(g, o.ylabel, b.x + 8, b.y + 16, { size: 22, align: 'left', color: o.yc || C.ink, halo: true });
    if (o.xlabel) Art.text(g, o.xlabel, b.x + b.w - (o.xrow ? 0 : 6), o.xrow ? b.y + b.h + 16 : b.y + b.h - 18, { size: o.xrow ? 21 : 22, align: 'right', color: o.xc || C.ink, halo: !o.xrow });
    return { X, Y };
  }
  /** A balloon, tied at the bottom. */
  function balloon(g, x, y, rx, ry, col = '#FF4FA3') {
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(x, y + ry + 8); g.bezierCurveTo(x - 16, y + ry + 40, x + 16, y + ry + 60, x, y + ry + 96); g.stroke();
    g.fillStyle = Art.mix(col, '#000000', 0.2);
    g.beginPath(); g.moveTo(x - 8, y + ry + 12); g.lineTo(x + 8, y + ry + 12); g.lineTo(x, y + ry - 2); g.closePath(); g.fill();
    const gr = g.createRadialGradient(x - rx * 0.35, y - ry * 0.4, rx * 0.1, x, y, Math.max(rx, ry) * 1.1);
    gr.addColorStop(0, Art.mix(col, '#ffffff', 0.62)); gr.addColorStop(0.5, col); gr.addColorStop(1, Art.mix(col, '#2A0A3A', 0.45));
    g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.55)';
    g.beginPath(); g.ellipse(x - rx * 0.42, y - ry * 0.5, rx * 0.16, ry * 0.11, -0.6, 0, TAU); g.fill();
  }

  /* ---------- Story 1: what pressure is ---------- */
  const brick = (g, x, y, w, h) => {
    const gr = g.createLinearGradient(x, y, x + w, y + h);
    gr.addColorStop(0, '#E2704B'); gr.addColorStop(1, '#8E3A22');
    g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    Art.round(g, x, y, w, h, 6); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(255,220,190,.28)'; g.lineWidth = 2;
    for (let yy = y + 26; yy < y + h - 8; yy += 26) { g.beginPath(); g.moveTo(x + 6, yy); g.lineTo(x + w - 6, yy); g.stroke(); }
  };
  Lab.story('#story-pressure', {
    title: 'What pushes on the walls?',
    scenes: [
      {
        say: 'A balloon is hollow, yet it stays round. Something inside is pushing the rubber <b>outward</b>. Zoom in and you find a crowd of flying gas particles.',
        dur: 3.6,
        draw(g, p, t, { H }) {
          const q = ease.back(seg(p, 0, 0.3));
          g.save(); g.translate(190, 190); g.scale(q, q); g.translate(-190, -190);
          balloon(g, 190, 180, 122 + Math.sin(t * 1.4) * 2, 142 + Math.sin(t * 1.4) * 2);
          g.restore();
          Art.text(g, 'a balloon', 190, H - 32, { size: 28, alpha: seg(p, 0.2, 0.4) });
          zoom(g, 278, 150, 560, 216, 186, (gg, cx, cy, R) => {
            const wallX = cx + R * 0.62;
            const box = { x0: cx - R - 20, x1: wallX, y0: cy - R, y1: cy + R };
            gasField(gg, box, 13, steady(t, 150, box.x1 - box.x0, box.y1 - box.y0), { seed: 4, mix: true, bond: 28, r: 32, only: (w) => w === 'R' });
            const rub = gg.createLinearGradient(wallX, 0, wallX + 90, 0);
            rub.addColorStop(0, '#FF7ABB'); rub.addColorStop(1, '#C21F75');
            gg.fillStyle = rub; gg.fillRect(wallX, cy - R, 90, R * 2);
            Art.text(gg, 'rubber', wallX + 36, cy + 8, { size: 22, color: '#fff', halo: true });
          }, { p: seg(p, 0.28, 0.62) });
          Art.text(g, 'air particles, flying fast', 545, H - 30, { size: 26, color: C.cyan, alpha: seg(p, 0.7, 0.9), halo: true });
        },
      },
      {
        say: 'Follow just one. It flies in a straight line until it hits the wall, then bounces off. That bounce is a <b>tiny push</b> on the wall.',
        dur: 3.4,
        draw(g, p, t) {
          // The wall.
          const wx = 610;
          const wall = g.createLinearGradient(wx, 0, 800, 0);
          wall.addColorStop(0, '#FF7ABB'); wall.addColorStop(1, '#8E1D5C');
          g.fillStyle = wall; g.fillRect(wx, 0, 200, 450);
          g.strokeStyle = '#1A0F2E'; g.lineWidth = 4; g.beginPath(); g.moveTo(wx, 0); g.lineTo(wx, 450); g.stroke();
          Art.text(g, 'wall', 708, 72, { font: 'display', size: 34, color: '#fff', halo: true });
          // The path, drawn as a zigzag so the still frame explains itself.
          const imp = [wx - 62, 226];
          g.save(); g.setLineDash([3, 14]); g.lineCap = 'round'; g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 5;
          g.beginPath(); g.moveTo(60, 60); g.lineTo(imp[0], imp[1]); g.lineTo(60, 392); g.stroke(); g.restore();
          // Period 2.6 s: in along the top path, out along the bottom path.
          const T0 = 2.6, ph = ((t / T0) + 0.08) % 1;
          const f = ph < 0.5 ? ph * 2 : (1 - ph) * 2; // 0 far, 1 at wall
          const x = lerp(60, imp[0], f), y = ph < 0.5 ? lerp(60, imp[1], f) : lerp(392, imp[1], f);
          const sinceHit = ph < 0.5 ? 1 : (ph - 0.5) * T0;
          // The push on the wall.
          const pushA = Math.max(clamp(1 - sinceHit / 0.9), 0);
          if (pushA > 0) {
            Art.burst(g, wx, imp[1], (0.9 - pushA * 0.9) / 0.9, { n: 12, r: 70 });
            Art.arrow(g, wx + 12, imp[1], wx + 128, imp[1], { color: C.sun, w: 12, alpha: 0.35 + 0.65 * pushA });
          } else Art.arrow(g, wx + 12, imp[1], wx + 128, imp[1], { color: C.sun, w: 12, alpha: 0.35 });
          Art.text(g, 'tiny push', wx + 96, imp[1] + 50, { size: 28, color: C.sun, halo: true });
          Art.molecule(g, x, y, 62, 'N2', { face: 'happy', faceAll: true, look: ph < 0.5 ? [1, 0.3] : [-1, 0.3], t, rot: 0.5 + t * 0.7, labels: false, style: 'fill', atomScale: 1.12 });
          Art.text(g, 'in', 300, 104, { size: 26, color: C.dim, alpha: seg(p, 0.1, 0.3) });
          Art.text(g, 'out', 300, 348, { size: 26, color: C.dim, alpha: seg(p, 0.1, 0.3) });
        },
      },
      {
        say: 'One particle gives a spiky little tap. Trillions of them, every instant, add up to a <b>steady push</b>. You never feel the separate taps.',
        dur: 3.6,
        draw(g, p, t) {
          const box = { x0: 30, x1: 390, y0: 52, y1: 412 };
          g.fillStyle = 'rgba(14,6,30,.55)'; Art.round(g, box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0, 8); g.fill();
          gasField(g, box, 16, steady(t, 170, 330, 330), { seed: 9, only: (w) => w === 'R', mix: true, bond: 17 });
          g.fillStyle = '#FF7ABB'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
          g.fillRect(box.x1, box.y0, 16, box.y1 - box.y0); g.strokeRect(box.x1, box.y0, 16, box.y1 - box.y0);
          Art.text(g, 'the wall feels every hit', 214, 28, { size: 24, color: C.sun, alpha: seg(p, 0.05, 0.25) });
          // Two strip charts of force against time.
          const strip = (y, h, title, col, val, a) => {
            if (a <= 0) return;
            g.save(); g.globalAlpha *= a;
            const X0 = 454, X1 = 776;
            g.fillStyle = 'rgba(14,6,30,.62)'; Art.round(g, X0, y, X1 - X0, h, 8); g.fill();
            Art.text(g, title, X0, y - 24, { size: 24, align: 'left', color: col });
            g.strokeStyle = col; g.lineWidth = 4; g.lineJoin = 'round';
            g.beginPath();
            for (let i = 0; i <= 150; i++) {
              const u = i / 150, s = t - (1 - u) * 5;
              const yy = y + h - 8 - val(s) * (h - 20);
              if (i) g.lineTo(lerp(X0 + 8, X1 - 8, u), yy); else g.moveTo(lerp(X0 + 8, X1 - 8, u), yy);
            }
            g.stroke();
            g.restore();
          };
          strip(90, 106, 'Push from one particle', C.cyan, (s) => {
            const fr = ((s * 0.9 % 1) + 1) % 1;
            return Math.exp(-Math.pow(Math.min(fr, 1 - fr) / 0.03, 2));
          }, seg(p, 0.2, 0.42));
          strip(270, 106, 'Push from trillions', C.pink, (s) => 0.58 + 0.015 * wander(3, s * 7), seg(p, 0.55, 0.78));
          Art.text(g, 'time', 765, 396, { size: 20, align: 'right', color: C.dim, alpha: seg(p, 0.6, 0.8) });
          Art.text(g, 'steady push', 616, 300, { size: 26, color: '#fff', alpha: seg(p, 0.7, 0.9), halo: true });
        },
      },
      {
        say: 'Same brick, same force. On a small area the force is concentrated, so the foam dents deeply. <b>Pressure</b> is force divided by area.',
        dur: 3.6,
        draw(g, p, t) {
          Art.text(g, 'P = F ÷ A', 400, 56, { font: 'display', size: 54, color: C.sun, alpha: seg(p, 0.72, 0.9) });
          const fy = 330;
          const q = ease.bounce(seg(p, 0.06, 0.42));
          const q2 = ease.bounce(seg(p, 0.14, 0.5));
          // Foam block, dented by each brick.
          const dent1 = 42 * q, dent2 = 10.5 * q2;
          const foam = g.createLinearGradient(0, fy, 0, 440);
          foam.addColorStop(0, '#F7E08A'); foam.addColorStop(1, '#B98F33');
          g.fillStyle = foam; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
          g.beginPath();
          g.moveTo(40, fy); g.lineTo(130, fy);
          g.quadraticCurveTo(160, fy, 170, fy + dent1); g.lineTo(230, fy + dent1); g.quadraticCurveTo(240, fy, 270, fy);
          g.lineTo(440, fy); g.quadraticCurveTo(452, fy, 460, fy + dent2); g.lineTo(700, fy + dent2); g.quadraticCurveTo(708, fy, 720, fy);
          g.lineTo(760, fy); g.lineTo(760, 448); g.lineTo(40, 448); g.closePath(); g.fill(); g.stroke();
          // Bricks drop in.
          const drop1 = lerp(-260, 0, q), drop2 = lerp(-260, 0, q2);
          brick(g, 170, fy + dent1 - 182 + drop1, 60, 182);
          brick(g, 460, fy + dent2 - 62 + drop2, 240, 62);
          // Force arrows are the same size: same weight.
          const a = seg(p, 0.5, 0.68);
          const topL = fy + dent1 - 182 - 8, topR = fy + dent2 - 62 - 8;
          Art.arrow(g, 200, topL - 86, 200, topL, { color: C.fire, w: 9, p: a });
          Art.arrow(g, 580, topR - 86, 580, topR, { color: C.fire, w: 9, p: a });
          Art.text(g, '100 N', 222, topL - 44, { size: 28, color: C.fire, align: 'left', alpha: a, halo: true });
          Art.text(g, '100 N', 602, topR - 44, { size: 28, color: C.fire, align: 'left', alpha: a, halo: true });
          const c = seg(p, 0.62, 0.82);
          Art.text(g, 'small area: deep dent', 200, 402, { size: 26, color: '#2A1500', alpha: c });
          Art.text(g, 'big area: shallow dent', 580, 402, { size: 26, color: '#2A1500', alpha: c });
          void t;
        },
      },
      {
        say: 'Air has weight too. The air above one square meter of ground weighs about 10 tonnes! It pushes in <b>every direction</b>, and the air inside you pushes back, so you do not get crushed.',
        speak: 'Air has weight too. The air above one square meter of ground weighs about ten tonnes. It pushes in every direction, and the air inside you pushes back, so you do not get crushed.',
        dur: 4,
        draw(g, p, t, { W, H }) {
          // Space fading down to blue, with air thickening toward the ground.
          const sky = g.createLinearGradient(0, 0, 0, H);
          sky.addColorStop(0, '#0B0620'); sky.addColorStop(0.5, '#1F3A7A'); sky.addColorStop(1, '#58B7F0');
          g.fillStyle = sky; g.fillRect(0, 0, W, H);
          for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * rand(i)})`; g.beginPath(); g.arc(rand(i + 3) * W, rand(i + 5) * 110, 1.2 + rand(i + 7) * 1.4, 0, TAU); g.fill(); }
          g.fillStyle = '#3F8F4F'; g.fillRect(0, H - 54, W, 54);
          g.fillStyle = '#2E6E3C'; g.fillRect(0, H - 54, W, 6);
          // The column over one square meter.
          const q = ease.inOut(seg(p, 0.05, 0.45));
          const cx = 210, top = lerp(H - 54, 6, q), hw = 74;
          g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(cx - hw, top, hw * 2, H - 54 - top);
          g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 3; g.setLineDash([10, 8]);
          g.beginPath(); g.moveTo(cx - hw, top); g.lineTo(cx - hw, H - 54); g.moveTo(cx + hw, top); g.lineTo(cx + hw, H - 54); g.stroke(); g.setLineDash([]);
          // Particles get more crowded lower down.
          for (let i = 0; i < 46; i++) {
            const dep = Math.pow(rand(i + 11), 0.5);
            const y = lerp(10, H - 66, dep);
            if (y < top) continue;
            const x = cx - hw + 10 + rand(i + 23) * (hw * 2 - 20) + wander(i, t) * 3;
            Art.ball(g, x, y + wander(i + 9, t) * 3, 3.5 + dep * 3, i % 5 === 4 ? '#FF4D5E' : '#4C7DFF');
          }
          Art.text(g, 'all this air', cx, 56, { size: 26, color: '#fff', alpha: seg(p, 0.4, 0.55), halo: true });
          Art.text(g, '1 square meter', cx, H - 26, { size: 24, color: '#fff', alpha: seg(p, 0.15, 0.3), halo: true });
          const c = seg(p, 0.45, 0.62);
          if (c > 0) {
            g.fillStyle = Art.alpha(C.plum, 0.88 * c); Art.round(g, 40, 180, 340, 92, 18); g.fill();
            Art.text(g, 'about 10,000 kg', cx, 212, { font: 'display', size: 36, color: C.sun, alpha: c });
            Art.text(g, 'that push is 1 atm', cx, 248, { size: 25, alpha: c });
          }
          // Moe with arrows from every side.
          const mx = 590, my = H - 54;
          Art.moe(g, mx, my, 170, 'happy', { t });
          const ar = seg(p, 0.6, 0.85);
          const centre = [mx, my - 85];
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * TAU - Math.PI / 2;
            if (Math.sin(a) > 0.5) continue; // Skip the ones that would point up out of the ground.
            const o = 148 + Math.sin(t * 2 + i) * 3, n = 104;
            Art.arrow(g, centre[0] + Math.cos(a) * o, centre[1] + Math.sin(a) * o, centre[0] + Math.cos(a) * n, centre[1] + Math.sin(a) * n, { color: C.sun, w: 6, p: ar });
          }
          Art.text(g, 'air pushes from', mx, 66, { size: 25, color: '#fff', alpha: seg(p, 0.75, 0.9), halo: true });
          Art.text(g, 'every direction', mx, 96, { size: 25, color: '#fff', alpha: seg(p, 0.75, 0.9), halo: true });
        },
      },
    ],
  });

  /* ---------- Barometer art, used by the story and the bench ---------- */
  const SILVER = (g, x0, x1) => {
    const m = g.createLinearGradient(x0, 0, x1, 0);
    m.addColorStop(0, '#7E889C'); m.addColorStop(0.35, '#F2F5FA'); m.addColorStop(0.7, '#AEB6C6'); m.addColorStop(1, '#68717F');
    return m;
  };
  /** Draw dish, tube and mercury column. dishY is the mercury surface. mmToU sets the scale. */
  function barometer(g, cx, dishY, mm, mmToU, tubeTop, o = {}) {
    const tw = o.tw || 46, x0 = cx - tw / 2, x1 = cx + tw / 2;
    const dw = o.dw || 220, dishB = dishY + 34;
    // Dish behind the tube.
    g.fillStyle = SILVER(g, cx - dw / 2, cx + dw / 2);
    g.fillRect(cx - dw / 2 + 2, dishY, dw - 4, dishB - dishY);
    // Column.
    const lvl = dishY - mm * mmToU;
    g.fillStyle = 'rgba(214,240,255,.08)'; g.fillRect(x0, tubeTop, tw, dishY - tubeTop);
    g.fillStyle = SILVER(g, x0, x1);
    g.fillRect(x0 + 2, lvl, tw - 4, dishY + 18 - lvl);
    g.fillStyle = 'rgba(255,255,255,.75)';
    g.beginPath(); g.ellipse(cx, lvl, tw / 2 - 2, 5, 0, 0, TAU); g.fill();
    // Tube outline: closed at top, open at the bottom, under the surface.
    const tube = new Path2D();
    tube.moveTo(x0, dishY + 20); tube.lineTo(x0, tubeTop + tw / 2); tube.arc(cx, tubeTop + tw / 2, tw / 2, Math.PI, 0); tube.lineTo(x1, dishY + 20);
    g.lineJoin = 'round'; g.strokeStyle = 'rgba(18,7,40,.6)'; g.lineWidth = 7; g.stroke(tube);
    g.strokeStyle = C.glass; g.lineWidth = 3.6; g.stroke(tube);
    // Dish glass.
    const d = new Path2D();
    d.moveTo(cx - dw / 2, dishY - 16); d.lineTo(cx - dw / 2, dishB - 6); d.quadraticCurveTo(cx - dw / 2, dishB, cx - dw / 2 + 8, dishB); d.lineTo(cx + dw / 2 - 8, dishB); d.quadraticCurveTo(cx + dw / 2, dishB, cx + dw / 2, dishB - 6); d.lineTo(cx + dw / 2, dishY - 16);
    g.strokeStyle = 'rgba(18,7,40,.6)'; g.lineWidth = 7; g.stroke(d);
    g.strokeStyle = C.glass; g.lineWidth = 3.6; g.stroke(d);
    return { lvl };
  }
  function ruler(g, x, dishY, mmToU, max, every, labelEvery, color = C.ink) {
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineCap = 'round';
    for (let v = 0; v <= max; v += every) {
      const y = dishY - v * mmToU, major = v % labelEvery === 0;
      g.lineWidth = major ? 3 : 2;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (major ? 16 : 9), y); g.stroke();
      if (major && v > 0) Art.text(g, String(v), x + 24, y, { size: 20, align: 'left', color });
    }
  }
  const airArrows = (g, cx, dw, dishY, len, p, col = C.cyan) => {
    [-0.36, 0.36].forEach((f) => {
      [-22, 22].forEach((off) => {
        const x = cx + f * dw + off;
        Art.arrow(g, x, dishY - 28 - len, x, dishY - 26, { color: col, w: 7, p });
      });
    });
  };

  /* ---------- Story 2: Torricelli's barometer ---------- */
  Lab.story('#story-baro', {
    title: "Torricelli's tube",
    bg: 'lab',
    scenes: [
      {
        say: 'Fill a long glass tube, closed at one end, with liquid <b>mercury</b>. Set a dish of mercury beside it. That is all the equipment you need.',
        dur: 3,
        draw(g, p, t) {
          const y0 = 72, tw = 46, cx = 300, bot = 372;
          const fill = ease.inOut(seg(p, 0.08, 0.7));
          // Upright tube: closed at the bottom, open at the top, filling up.
          const lvl = lerp(bot - 12, y0 + 8, fill);
          g.fillStyle = SILVER(g, cx - tw / 2, cx + tw / 2);
          Art.round(g, cx - tw / 2 + 2, lvl, tw - 4, bot - lvl, 18); g.fill();
          g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(cx, lvl, tw / 2 - 2, 5, 0, 0, TAU); g.fill();
          const tube = new Path2D();
          tube.moveTo(cx - tw / 2, y0); tube.lineTo(cx - tw / 2, bot - tw / 2); tube.arc(cx, bot - tw / 2, tw / 2, Math.PI, 0, true); tube.lineTo(cx + tw / 2, y0);
          g.strokeStyle = 'rgba(18,7,40,.6)'; g.lineWidth = 7; g.stroke(tube);
          g.strokeStyle = C.glass; g.lineWidth = 3.6; g.stroke(tube);
          // Pouring stream.
          if (fill > 0 && fill < 1) { g.fillStyle = SILVER(g, cx - 5, cx + 5); g.fillRect(cx - 5, 8, 10, lvl - 8); }
          // Dish.
          const dx = 590, dy = 340, dw = 220;
          g.fillStyle = SILVER(g, dx - dw / 2, dx + dw / 2); g.fillRect(dx - dw / 2 + 2, dy, dw - 4, 34);
          g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(dx - dw / 2 + 2, dy, dw - 4, 4);
          const d = new Path2D();
          d.moveTo(dx - dw / 2, dy - 18); d.lineTo(dx - dw / 2, dy + 34); d.lineTo(dx + dw / 2, dy + 34); d.lineTo(dx + dw / 2, dy - 18);
          g.strokeStyle = 'rgba(18,7,40,.6)'; g.lineWidth = 7; g.stroke(d);
          g.strokeStyle = C.glass; g.lineWidth = 3.6; g.stroke(d);
          const a = seg(p, 0.6, 0.8);
          Art.text(g, 'mercury', 408, 196, { size: 30, color: C.ink, alpha: a, halo: true });
          Art.arrow(g, 356, 196, cx + 32, 196, { color: C.ink, w: 4, alpha: a });
          Art.text(g, 'glass tube', 300, 42, { size: 28, alpha: a, halo: true });
          Art.text(g, 'a dish of mercury', dx, 280, { size: 28, alpha: seg(p, 0.7, 0.9), halo: true });
          Art.moe(g, 118, 382, 190, 'point', { t });
        },
      },
      {
        say: 'Flip the tube upside down into the dish. The mercury starts to pour out, then <b>stops</b>, leaving a gap at the top. Nothing is holding it. Or is there?',
        speak: 'Flip the tube upside down into the dish. The mercury starts to pour out, then stops, leaving a gap at the top. Nothing is holding it. Or is there?',
        dur: 4.4,
        draw(g, p, t) {
          const cx = 400, dishY = 338, mmToU = 0.34, top = 12;
          const flip = ease.inOut(seg(p, 0, 0.4)), fall = seg(p, 0.45, 0.9);
          if (flip < 1) {
            // Dish waits below while the tube turns over.
            g.fillStyle = SILVER(g, cx - 110, cx + 110); g.fillRect(cx - 108, dishY, 216, 34);
            const d = new Path2D();
            d.moveTo(cx - 110, dishY - 16); d.lineTo(cx - 110, dishY + 34); d.lineTo(cx + 110, dishY + 34); d.lineTo(cx + 110, dishY - 16);
            g.strokeStyle = C.glass; g.lineWidth = 3.6; g.stroke(d);
            g.save();
            g.translate(cx, lerp(190, 176, flip)); g.rotate(flip * Math.PI);
            g.fillStyle = SILVER(g, -21, 21); Art.round(g, -21, -150, 42, 300, 16); g.fill();
            g.strokeStyle = C.glass; g.lineWidth = 3.6;
            g.beginPath(); g.moveTo(-23, -152); g.lineTo(-23, 128); g.arc(0, 128, 23, Math.PI, 0, true); g.lineTo(23, -152); g.stroke();
            g.restore();
          } else {
            // Falls and overshoots slightly before settling at 760 mm.
            const start = 840, mm = fall <= 0 ? start : 760 + (start - 760) * Math.exp(-fall * 5) * Math.cos(fall * 13);
            barometer(g, cx, dishY, mm, mmToU, top);
            const a = seg(p, 0.86, 0.98);
            Art.text(g, 'it stops here!', cx + 60, dishY - 760 * mmToU, { size: 30, align: 'left', color: C.sun, alpha: a, halo: true });
            Art.arrow(g, cx + 54, dishY - 760 * mmToU, cx + 28, dishY - 760 * mmToU, { color: C.sun, w: 5, alpha: a });
            Art.text(g, 'a gap', cx + 60, top + 26, { size: 28, align: 'left', alpha: a, halo: true });
            Art.arrow(g, cx + 54, top + 26, cx + 28, top + 26, { color: C.ink, w: 4, alpha: a });
            Art.moe(g, 138, 384, 170, 'think', { t, alpha: a });
            Art.bubble(g, 'Why did it stop?', 150, 200, { w: 220, side: 'down', alpha: a });
          }
        },
      },
      {
        say: 'The gap is almost empty, so nothing pushes down from above. But <b>the air pushes down on the dish</b>, and that push holds the column up.',
        dur: 3.4,
        draw(g, p, t) {
          const cx = 370, dishY = 338, mmToU = 0.34, top = 12, dw = 460;
          const a = seg(p, 0.1, 0.4);
          // Air particles raining down on the dish, on both sides of the tube.
          if (a > 0) {
            g.save(); g.globalAlpha *= a;
            [[cx - dw / 2 + 6, cx - 34], [cx + 34, cx + dw / 2 - 6]].forEach(([x0, x1], i) => {
              const b = { x0, x1, y0: 170, y1: dishY - 2 };
              gasField(g, b, 7, steady(t, 130, x1 - x0 - 30, dishY - 172 - 30), { seed: 20 + i * 9, mix: true, bond: 12, r: 14, only: (w) => w === 'B' });
            });
            g.restore();
          }
          barometer(g, cx, dishY, 760, mmToU, top, { dw });
          airArrows(g, cx, dw * 0.8, dishY, 72 + Math.sin(t * 2.2) * 3, a);
          Art.text(g, 'air pushes down', cx - dw / 2 - 26, 140, { size: 27, align: 'left', color: C.cyan, alpha: seg(p, 0.2, 0.4), halo: true });
          // Upward push inside the column.
          const up = seg(p, 0.4, 0.68);
          Art.arrow(g, cx, dishY + 4, cx, dishY - 206, { color: C.pink, w: 10, p: up });
          Art.text(g, 'column held up', cx + 44, 140, { size: 27, align: 'left', color: C.pink, alpha: seg(p, 0.5, 0.7), halo: true });
          const gapA = seg(p, 0.65, 0.85);
          Art.text(g, 'almost empty: no', cx + 44, 28, { size: 27, align: 'left', alpha: gapA, halo: true });
          Art.text(g, 'push from above', cx + 44, 60, { size: 27, align: 'left', alpha: gapA, halo: true });
          Art.arrow(g, cx, 24, cx, 58, { color: C.dim, w: 5, alpha: gapA });
          Art.strike(g, cx - 15, 28, cx + 15, 56, seg(p, 0.78, 0.92), C.red, 5);
        },
      },
      {
        say: 'At sea level the column stands <b>760 mm</b> tall. That height is a pressure reading. We call this push <b>1 atmosphere</b>, and the same value goes by several names.',
        dur: 3.6,
        draw(g, p) {
          const cx = 160, dishY = 344, mmToU = 0.36, top = 14;
          barometer(g, cx, dishY, 760, mmToU, top, { dw: 200 });
          ruler(g, cx + 34, dishY, mmToU, 800, 100, 200);
          const hl = seg(p, 0.05, 0.25);
          const y760 = dishY - 760 * mmToU;
          g.strokeStyle = Art.alpha(C.sun, hl); g.lineWidth = 3; g.setLineDash([9, 7]);
          g.beginPath(); g.moveTo(cx - 40, y760); g.lineTo(cx + 124, y760); g.stroke(); g.setLineDash([]);
          Art.text(g, '760 mm', cx + 130, y760, { font: 'display', size: 28, align: 'left', color: C.sun, alpha: hl, halo: true });
          // The units card.
          const rows = [['1 atm', C.sun], ['760 mmHg', C.ink], ['760 torr', C.ink], ['101.325 kPa', C.ink]];
          rows.forEach(([txt, col], i) => {
            const a = ease.out(seg(p, 0.22 + i * 0.14, 0.4 + i * 0.14));
            if (a <= 0) return;
            const y = 76 + i * 78;
            g.fillStyle = Art.alpha(C.plum, 0.9 * a); Art.round(g, 450, y - 32, 300, 64, 18); g.fill();
            Art.text(g, txt, 600, y, { font: 'display', size: 38, color: col, alpha: a });
            if (i) Art.text(g, '=', 420, y - 39, { font: 'display', size: 38, color: C.pink, alpha: a });
          });
        },
      },
      {
        say: 'Why mercury? It is <b>13.6 times</b> denser than water, so the column is short enough to fit in a room. A water barometer would need a tube <b>over 10 meters</b> tall.',
        speak: 'Why mercury? It is 13.6 times denser than water, so the column is short enough to fit in a room. A water barometer would need a tube over 10 meters tall.',
        dur: 3.6,
        draw(g, p, t, { H }) {
          const ground = H - 70;
          // Everything here is to one scale, so the mercury tube really is that small.
          const u = 35; // stage units per meter
          const q = ease.inOut(seg(p, 0.08, 0.7));
          const hHg = 0.76 * u, hW = 10.33 * u * q;
          // A three-story building for scale, about 10 m tall.
          const bx = 590, bw = 170, bh = 10 * u;
          const wall = g.createLinearGradient(bx, 0, bx + bw, 0);
          wall.addColorStop(0, '#6A5A92'); wall.addColorStop(1, '#46396E');
          g.fillStyle = wall; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
          g.fillRect(bx, ground - bh, bw, bh); g.strokeRect(bx, ground - bh, bw, bh);
          for (let f = 0; f < 3; f++) for (let w = 0; w < 3; w++) {
            g.fillStyle = (f + w) % 2 ? '#FFE27A' : '#2B2150';
            Art.round(g, bx + 18 + w * 50, ground - bh + 22 + f * 112, 34, 62, 4); g.fill(); g.stroke();
          }
          Art.text(g, '3-story building', bx + bw / 2, ground + 34, { size: 24, color: '#fff' });
          // Water tube.
          const wx = 480;
          const w = g.createLinearGradient(wx - 20, 0, wx + 20, 0);
          w.addColorStop(0, '#2B8FD8'); w.addColorStop(0.5, '#8ADCFF'); w.addColorStop(1, '#2B8FD8');
          g.fillStyle = w; g.fillRect(wx - 20, ground - hW, 40, hW);
          g.strokeStyle = C.glass; g.lineWidth = 3.4; g.strokeRect(wx - 20, 3, 40, ground - 3);
          const a = seg(p, 0.66, 0.84);
          Art.text(g, 'water', wx - 34, 60, { size: 26, align: 'right', alpha: a, halo: true });
          Art.text(g, '10.3 m', wx - 34, 94, { font: 'display', size: 36, align: 'right', color: C.sun, alpha: a, halo: true });
          // Mercury tube and Moe, both to scale.
          const hx = 300;
          g.fillStyle = SILVER(g, hx - 13, hx + 13); g.fillRect(hx - 13, ground - hHg, 26, hHg);
          g.strokeStyle = C.glass; g.lineWidth = 3.4; g.strokeRect(hx - 13, ground - hHg - 8, 26, hHg + 8);
          Art.text(g, 'mercury', hx, ground - hHg - 66, { size: 26, halo: true });
          Art.text(g, '0.76 m', hx, ground - hHg - 34, { font: 'display', size: 30, color: C.sun, halo: true });
          Art.moe(g, 112, ground + 2, 62, 'wow', { t, bob: false });
          Art.bubble(g, 'I need a taller lab.', 112, ground - 66, { w: 170, side: 'down', alpha: seg(p, 0.76, 0.9) });
        },
      },
    ],
  });

  /* ---------- Bench: barometer up a mountain ---------- */
  const atmAt = (h) => Math.pow(1 - 2.25577e-5 * h, 5.25588);
  const baro = { h: 0, shown: 0 };
  const PLACES = [[0, 'Sea level'], [1609, 'Denver'], [3640, 'La Paz'], [8849, 'Mt. Everest']];
  const baroStage = Lab.stage('#c-baro', {
    label: 'A mercury barometer beside a mountain. As the climber goes up, the air thins and the mercury column gets shorter.',
    bg(g, W, H) {
      const s = g.createLinearGradient(0, 0, 0, H);
      s.addColorStop(0, '#120A33'); s.addColorStop(0.55, '#2C2C78'); s.addColorStop(1, '#3E76B8');
      g.fillStyle = s; g.fillRect(0, 0, W, H);
    },
    draw(g, t, dt) {
      baro.shown = lerp(baro.shown, baro.h, dt ? clamp(dt * 6) : 1);
      const h = baro.shown, atm = atmAt(h), mm = atm * 760;
      const base = 402, peakY = 74;
      const yOf = (a) => base - (a / 9000) * (base - peakY);
      // Air dots: crowded low, thin high, in true proportion to the air pressure at each height.
      for (let i = 0; i < 230; i++) {
        const aU = rand(i + 2) * 9400;
        if (rand(i + 41) > atmAt(aU)) continue;
        const x = 330 + rand(i + 17) * 470 + wander(i, t) * 4, y = yOf(aU) + wander(i + 5, t) * 4;
        Art.ball(g, x, y, 4.5, i % 5 === 4 ? '#FF4D5E' : '#6E97FF');
      }
      // Mountain.
      const m = g.createLinearGradient(0, peakY, 0, base);
      m.addColorStop(0, '#7A7F9C'); m.addColorStop(0.5, '#4C5578'); m.addColorStop(1, '#2E3E4E');
      g.fillStyle = m; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
      const px = 610;
      g.beginPath(); g.moveTo(370, base); g.lineTo(460, 300); g.lineTo(510, 258); g.lineTo(px, peakY); g.lineTo(690, 200); g.lineTo(735, 250); g.lineTo(800, 330); g.lineTo(800, base); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#F2F6FF';
      g.beginPath(); g.moveTo(px, peakY); g.lineTo(px - 42, peakY + 76); g.lineTo(px - 22, peakY + 64); g.lineTo(px - 6, peakY + 92); g.lineTo(px + 12, peakY + 60); g.lineTo(px + 32, peakY + 72); g.closePath(); g.fill();
      Art.bench(g, 800, base, 450 - base);
      // Barometer at the climber's altitude.
      const cx = 182, dishY = 372, mmToU = 0.4;
      barometer(g, cx, dishY, mm, mmToU, 40, { dw: 290 });
      ruler(g, cx + 32, dishY, mmToU, 800, 100, 200);
      [cx - 112, cx - 68, cx + 106].forEach((ax) => Art.arrow(g, ax, dishY - 28 - (14 + 62 * atm), ax, dishY - 26, { color: C.cyan, w: 7 }));
      Art.text(g, 'air', cx - 90, dishY - 54 - (14 + 62 * atm), { size: 24, color: C.cyan, halo: true });
      Art.text(g, Lab.fmt(mm, 0) + ' mmHg', cx - 34, dishY - mm * mmToU, { font: 'display', size: 26, align: 'right', color: C.sun, halo: true, maxW: 110 });
      // Climber on the west slope.
      const u = clamp(h / 8849), my = yOf(h);
      const slope = [[370, base], [460, 300], [510, 258], [px, peakY]];
      let mx = 370;
      for (let i = 0; i < slope.length - 1; i++) if (my <= slope[i][1] && my >= slope[i + 1][1]) mx = lerp(slope[i][0], slope[i + 1][0], (slope[i][1] - my) / (slope[i][1] - slope[i + 1][1]));
      if (my < peakY) mx = px;
      void u;
      Art.moe(g, mx, my + 3, 62, h > 7000 ? 'wow' : 'cheer', { t, bob: false });
      // Landmarks on the right.
      PLACES.forEach(([a, name]) => {
        const y = yOf(a);
        const near = Math.abs(h - a) < 320;
        const yy = a === 0 ? y - 16 : y;
        Art.text(g, name, 788, yy, { size: 22, align: 'right', color: near ? C.sun : '#fff', halo: true });
        g.fillStyle = near ? C.sun : 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(a === 0 ? 800 : 796, y + (a === 0 ? -14 : 14), 0, 0, TAU); g.fill();
      });
    },
  });
  const paintBaro = () => {
    const atm = atmAt(baro.h);
    Lab.$('#baro-atm').textContent = atm.toFixed(3) + ' atm';
    Lab.$('#baro-mm').textContent = (atm * 760).toFixed(0) + ' mmHg';
    Lab.$('#baro-kpa').textContent = (atm * 101.325).toFixed(1) + ' kPa';
    baroStage.redraw();
  };
  Lab.bind('#baro-h', '#baro-h-out', (v) => v.toLocaleString('en-US') + ' m', (v) => { baro.h = v; if (Lab.reducedMotion) baro.shown = v; paintBaro(); });

  /* ---------- Story 3: the four laws at the particle level ---------- */
  const SC = { x0: 56, x1: 286, floor: 388, top: 26, kv: 12 };
  /** One law, as a before-to-after animation. spec gives V, T, n as functions of q (0..1). */
  function lawScene(spec) {
    return {
      say: spec.say, speak: spec.speak, dur: 4.2,
      draw(g, p, t) {
        const dur = 4.2;
        const qOf = (s) => ease.inOut(seg(s, 0.22, 0.78));
        const q = qOf(p);
        const V = spec.V(q), T = spec.T(q), n = spec.n(q), P = (n * R_GAS * T) / V;
        const heightOf = (v) => v * SC.kv;
        const yHead = SC.floor - heightOf(V);
        chamberBack(g, SC.x0, SC.x1, SC.floor, yHead, T);
        const box = { x0: SC.x0 + 2, x1: SC.x1 - 2, y0: yHead, y1: SC.floor };
        const m = motion(t, dur, (s) => 150 * Math.sqrt(spec.T(qOf(s)) / 300), () => SC.x1 - SC.x0 - 30, (s) => Math.max(40, heightOf(spec.V(qOf(s))) - 30));
        const N = Math.round(spec.n(1) * 16), N0 = Math.round(spec.n(0) * 16);
        gasField(g, box, N, m, { seed: 3, bond: 14, r: 17, pop: (i) => (i < N0 ? 1 : ease.back(clamp((q - (i - N0) / (N - N0) * 0.7) / 0.3))) });
        chamberFront(g, SC.x0, SC.x1, SC.floor, SC.top);
        pistonHead(g, SC.x0, SC.x1, yHead, { label: spec.head, pins: spec.pins });
        heater(g, SC.x0, SC.x1, SC.floor + 2, 44, T, t);
        // Which way the piston is being driven.
        if (spec.drive) Art.arrow(g, SC.x1 + 28, yHead - 40, SC.x1 + 28, yHead + 44, { color: C.sun, w: 8, p: seg(p, 0.15, 0.3), alpha: 1 - seg(p, 0.82, 0.98) });

        gauge(g, 410, 118, 92, P, { max: 4, step: 1, readout: Lab.fmt(P, 2) + ' atm', lcdW: 122, lcdH: 38, lcdSize: 25 });
        // Readouts below the gauge.
        const col = (name) => (spec.changes.includes(name) ? C.sun : C.dim);
        Art.text(g, `V = ${Lab.fmt(V, 1)} L`, 336, 268, { size: 25, align: 'left', color: col('V') });
        Art.text(g, `T = ${Lab.fmt(T, 0)} K`, 336, 306, { size: 25, align: 'left', color: col('T') });
        Art.text(g, `n = ${Lab.fmt(n, 2)} mol`, 336, 344, { size: 25, align: 'left', color: col('n') });

        // Mini graph.
        const b = { x: 574, y: 62, w: 200, h: 186 };
        const A = axes(g, b, spec.axes);
        g.strokeStyle = Art.alpha(C.cyan, 0.9); g.lineWidth = 4; g.lineJoin = 'round';
        g.beginPath();
        for (let i = 0; i <= 40; i++) {
          const pt = spec.curve(i / 40);
          if (i) g.lineTo(A.X(pt[0]), A.Y(pt[1])); else g.moveTo(A.X(pt[0]), A.Y(pt[1]));
        }
        g.stroke();
        const dot = spec.dot({ V, T, n, P });
        Art.glow(g, A.X(dot[0]), A.Y(dot[1]), 22, C.pink, 0.8);
        Art.ball(g, A.X(dot[0]), A.Y(dot[1]), 9, C.pink);

        Art.text(g, spec.name, 660, 26, { font: 'display', size: 32, color: C.pink });
        const a = seg(p, 0.72, 0.9);
        if (a > 0) {
          g.fillStyle = Art.alpha(C.plum2, 0.95 * a); Art.round(g, 510, 318, 278, 112, 18); g.fill();
          Art.text(g, spec.big, 649, 354, { font: 'display', size: 34, color: C.sun, alpha: a });
          Art.text(g, spec.small, 649, 398, { size: 25, alpha: a });
        }
      },
    };
  }
  const summaryCard = (g, x, y, w, h, name, tag, eq, col, draw) => {
    g.fillStyle = 'rgba(14,6,30,.6)'; Art.round(g, x, y, w, h, 18); g.fill();
    g.strokeStyle = Art.alpha(col, 0.8); g.lineWidth = 3; g.stroke();
    draw(x + 72, y + h / 2);
    Art.text(g, name, x + 148, y + 40, { font: 'display', size: 32, align: 'left', color: col });
    Art.text(g, tag, x + 148, y + 86, { size: 23, align: 'left' });
    Art.text(g, eq, x + 148, y + 128, { font: 'display', size: 28, align: 'left', color: C.sun });
  };
  Lab.story('#story-why', {
    title: 'What the particles are doing',
    scenes: [
      lawScene({
        say: 'Same gas, same temperature, less room. Particles reach the walls sooner, so they hit <b>more often</b>. Halve the volume and the pressure doubles. That is <b>Boyle\'s law</b>.',
        name: "Boyle's law", head: 'Pushed down', drive: true, changes: ['V'],
        V: (q) => lerp(24.6, 12.3, q), T: () => 300, n: () => 1,
        axes: { xmin: 0, xmax: 30, ymin: 0, ymax: 3, xticks: [10, 20], yticks: [1, 2], ylabel: 'P', xlabel: 'V' },
        curve: (u) => { const v = lerp(9, 29, u); return [v, (R_GAS * 300) / v]; },
        dot: ({ V, P }) => [V, P],
        big: 'P × V stays', small: 'V halves, P doubles',
      }),
      lawScene({
        say: 'Heat the gas and particles fly faster and hit harder. The free piston rises until the pressure is back to 1 atm. Double the Kelvin temperature and the volume doubles. That is <b>Charles\'s law</b>.',
        name: "Charles's law", head: 'Free to slide', changes: ['V', 'T'],
        V: (q) => lerp(12.3, 24.6, q), T: (q) => lerp(300, 600, q), n: () => 0.5,
        axes: { xmin: 0, xmax: 700, ymin: 0, ymax: 30, xticks: [300, 600], yticks: [10, 20], ylabel: 'V', xlabel: 'T' },
        curve: (u) => { const T = lerp(0, 680, u); return [T, (0.5 * R_GAS * T) / 1]; },
        dot: ({ T, V }) => [T, V],
        big: 'V ÷ T stays', small: 'T doubles, V doubles',
      }),
      lawScene({
        say: 'Pin the piston and heat. The gas cannot spread out, so faster particles hit harder and more often. Double the Kelvin temperature and the pressure doubles. That is <b>Gay-Lussac\'s law</b>.',
        name: "Gay-Lussac's law", head: 'Pinned', pins: true, changes: ['P', 'T'],
        V: () => 12.3, T: (q) => lerp(300, 600, q), n: () => 0.5,
        axes: { xmin: 0, xmax: 700, ymin: 0, ymax: 3, xticks: [300, 600], yticks: [1, 2], ylabel: 'P', xlabel: 'T' },
        curve: (u) => { const T = lerp(0, 680, u); return [T, (0.5 * R_GAS * T) / 12.3]; },
        dot: ({ T, P }) => [T, P],
        big: 'P ÷ T stays', small: 'T doubles, P doubles',
      }),
      lawScene({
        say: 'Add more gas at the same temperature. More particles means more hits, so the piston rises until the pressure is back to 1 atm. Double the moles and the volume doubles. That is <b>Avogadro\'s law</b>.',
        name: "Avogadro's law", head: 'Free to slide', changes: ['V', 'n'],
        V: (q) => lerp(12.3, 24.6, q), T: () => 300, n: (q) => lerp(0.5, 1, q),
        axes: { xmin: 0, xmax: 1.2, ymin: 0, ymax: 30, xticks: [0.5, 1], yticks: [10, 20], ylabel: 'V', xlabel: 'n', xfmt: (v) => v.toFixed(1) },
        curve: (u) => { const n = lerp(0, 1.15, u); return [n, n * R_GAS * 300]; },
        dot: ({ n, V }) => [n, V],
        big: 'V ÷ n stays', small: 'n doubles, V doubles',
      }),
      {
        say: 'Four laws, one pattern. Hold two things still and the other two are tied together. Only Boyle\'s pair moves in <b>opposite directions</b>. The other three go up together.',
        dur: 2.8,
        draw(g, p, t) {
          const icon = (kind) => (x, y) => {
            const bw = 46, hh = kind === 'boyle' ? 22 + Math.sin(t * 1.6) * 12 : 34;
            g.fillStyle = 'rgba(214,240,255,.12)'; g.fillRect(x - bw, y - 54, bw * 2, 108);
            const f = y + 54;
            const hd = kind === 'charles' || kind === 'avo' ? 70 + Math.sin(t * 1.6) * 20 : kind === 'gay' ? 62 : 66 + Math.sin(t * 1.6) * 26;
            const box = { x0: x - bw, x1: x + bw, y0: f - hd, y1: f };
            void hh;
            const count = kind === 'avo' ? 5 + Math.round(1.5 + Math.sin(t * 1.6) * 2) : 5;
            gasField(g, box, count, steady(t, kind === 'charles' || kind === 'gay' ? 110 + Math.sin(t * 1.6) * 40 : 110, 60, 60), { seed: 3, bond: 8, r: 11, sparks: false });
            g.strokeStyle = C.glass; g.lineWidth = 3.4; g.beginPath(); g.moveTo(x - bw, y - 54); g.lineTo(x - bw, f); g.lineTo(x + bw, f); g.lineTo(x + bw, y - 54); g.stroke();
            g.fillStyle = kind === 'gay' ? C.red : '#B2ACC9'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2;
            Art.round(g, x - bw + 2, f - hd - 10, bw * 2 - 4, 10, 3); g.fill(); g.stroke();
          };
          const cards = [
            [16, 18, "Boyle", 'less V, more P', 'P₁V₁ = P₂V₂', C.pink, 'boyle'],
            [408, 18, 'Charles', 'more T, more V', 'V₁/T₁ = V₂/T₂', C.cyan, 'charles'],
            [16, 232, 'Gay-Lussac', 'more T, more P', 'P₁/T₁ = P₂/T₂', C.fire, 'gay'],
            [408, 232, 'Avogadro', 'more n, more V', 'V₁/n₁ = V₂/n₂', C.leaf, 'avo'],
          ];
          cards.forEach((c, i) => {
            Art.popIn(g, c[0] + 188, c[1] + 100, seg(p, 0.05 + i * 0.18, 0.3 + i * 0.18), (gg) => {
              gg.translate(-(c[0] + 188), -(c[1] + 100));
              summaryCard(gg, c[0], c[1], 376, 200, c[2], c[3], c[4], c[5], icon(c[6]));
            });
          });
        },
      },
    ],
  });

  /* ---------- Bench: the gas lab, a real particle simulation ---------- */
  const LW = 800, LH = 540;
  const LX0 = 96, LX1 = 356, FLOOR = 452, KV = 7.6;
  const INSET = 4, RP = 4, V300 = 190, PER_MOL = 20;
  const YB = FLOOR - INSET;
  const CENTERS_W = LX1 - LX0 - 2 * INSET - 2 * RP;
  /* Converts wall momentum flux in the 2D sim into atm, using only the model's fixed geometry and speed scale.
     2D kinetic theory: P2D = N m <v²> / (2 w h), with h = KV * V and N = PER_MOL * n. */
  const CAL = (R_GAS * 300 * 2 * CENTERS_W * KV) / (PER_MOL * V300 * V300);
  const box = new Sim.Box({ x0: LX0 + INSET, x1: LX1 - INSET, y0: 0, y1: YB, speed: V300, temperature: 1, seed: 17 });
  const lab = {
    mode: 'free', V: 24.618, T: 300, n: 1, Vgoal: 24.618, Pfix: 1, pts: [], strip: [], stripT: 0, view: 'a',
    flux: 1, hitsNow: 0, hitRate: 20, sparks: [], puffs: [], dragging: false, dragOff: 0, shake: 0,
    mission: 0, hold: 0, banner: 0, bannerText: '', done: {}, last: null, footKey: '',
  };
  const pNow = () => (lab.n * R_GAS * lab.T) / lab.V;
  const y0For = (V) => YB - KV * V - 2 * RP;
  box.setBounds(LX0 + INSET, y0For(lab.V), LX1 - INSET, YB);
  box.add({ n: Math.round(lab.n * PER_MOL), r: RP, kind: 'N2', mass: 1 });
  box.onWall = (p) => {
    lab.hitsNow++;
    if (lab.sparks.length > 26) return;
    const dT = p.y - p.r - box.y0, dB = box.y1 - p.y - p.r, dL = p.x - p.r - box.x0, dR = box.x1 - p.x - p.r;
    const m = Math.min(dT, dB, dL, dR);
    let x = p.x, y = p.y;
    if (m === dT) y = box.y0 - INSET; else if (m === dB) y = box.y1 + INSET; else if (m === dL) x = box.x0 - INSET; else x = box.x1 + INSET;
    lab.sparks.push({ x, y, age: 0, onPiston: m === dT });
  };
  function syncCount() {
    const want = Math.round(lab.n * PER_MOL);
    let have = box.particles.length;
    if (have < want) {
      box.add({ n: want - have, r: RP, kind: 'N2', mass: 1 });
      for (let i = have; i < want; i++) {
        const q = box.particles[i], a = (rand(i * 3.1 + have) - 0.5) * 1.2;
        const v = V300 * Math.sqrt(lab.T / 300);
        q.x = box.x0 + RP + 2; q.y = clamp(FLOOR - 26, box.y0 + RP, box.y1 - RP);
        q.vx = Math.cos(a) * v; q.vy = Math.sin(a) * v;
        lab.puffs.push({ x: q.x, y: q.y, age: 0 });
      }
    } else if (have > want) {
      const gone = box.particles.slice(want);
      gone.forEach((q) => lab.puffs.push({ x: q.x, y: q.y, age: 0 }));
      box.particles.length = want;
    }
    have = want;
  }
  /** Keep the particle energy exactly on the set temperature, whatever got added or removed. */
  function thermostat() {
    let s = 0;
    const P = box.particles;
    for (const q of P) s += q.vx * q.vx + q.vy * q.vy;
    if (!P.length || s === 0) return;
    const want = P.length * V300 * V300 * (lab.T / 300), k = Math.sqrt(want / s);
    for (const q of P) { q.vx *= k; q.vy *= k; }
  }

  const MISSIONS = {
    free: [],
    boyle: [
      { say: 'Squeeze the gas until the gauge reads <b>2.00 atm</b>. Predict the volume first: $P_1V_1 = P_2V_2$.', ok: () => Math.abs(pNow() - 2) < 0.04, win: 'Yes. $(1.00)(24.6) = (2.00)(12.3)$, so the volume halved.' },
      { say: 'Now pull the piston up until the gauge reads <b>0.50 atm</b>.', ok: () => Math.abs(pNow() - 0.5) < 0.015, win: 'Yes. Half the pressure, twice the starting volume: 49.2 L.' },
    ],
    charles: [
      { say: 'The gas is at 300 K and 24.6 L. <b>Double the volume</b> to 49.2 L. What temperature does it need? It is not double the Celsius.', ok: () => Math.abs(lab.Vgoal - 49.2) < 0.9, win: 'Yes. 600 K is double 300 K. In Celsius that is 27 °C up to 327 °C, far more than double.' },
      { say: 'Now <b>halve</b> the starting volume, to 12.3 L.', ok: () => Math.abs(lab.Vgoal - 12.3) < 0.4, win: 'Yes. 150 K is half of 300 K. That is $-123$ °C, and it works because Kelvin starts at true zero.' },
    ],
    gay: [
      { say: 'The piston is pinned at 24.6 L. Heat the gas to reach exactly <b>1.50 atm</b>.', ok: () => Math.abs(pNow() - 1.5) < 0.02, win: 'Yes. 1.5 times the pressure takes 1.5 times the Kelvin temperature: 450 K.' },
      { say: 'Now cool it down to <b>0.50 atm</b>.', ok: () => Math.abs(pNow() - 0.5) < 0.012, win: 'Yes. Half the pressure at half the Kelvin temperature: 150 K.' },
    ],
    avo: [
      { say: 'Let gas out through the valve until the volume is <b>12.3 L</b>. How many moles is that?', ok: () => Math.abs(lab.Vgoal - 12.3) < 0.2, win: 'Yes. 0.50 mol. Half the particles need half the room at the same $P$ and $T$.' },
      { say: 'Now pump in gas until the volume is <b>36.9 L</b>.', ok: () => Math.abs(lab.Vgoal - 36.9) < 0.2, win: 'Yes. 1.50 mol. Volume grows in step with moles.' },
    ],
  };
  const LAW_NAME = { boyle: "Boyle's law", charles: "Charles's law", gay: "Gay-Lussac's law", avo: "Avogadro's law" };
  const PLOT = {
    boyle: {
      a: { xrow: true, xmin: 0, xmax: 55, ymin: 0, ymax: 6, xticks: [10, 20, 30, 40], yticks: [2, 4, 6], ylabel: 'P (atm)', xlabel: 'V (L)', yc: C.pink, xc: C.cyan, map: (s) => [s.V, s.P], curve: () => Array.from({ length: 60 }, (_, i) => { const v = lerp(5.4, 54, i / 59); return [v, (R_GAS * 300) / v]; }), viewName: 'P against V' },
      b: { xrow: true, xmin: 0, xmax: 0.2, ymin: 0, ymax: 6, xticks: [0.05, 0.1], yticks: [2, 4, 6], ylabel: 'P (atm)', xlabel: '1/V (per L)', yc: C.pink, xc: C.cyan, xfmt: (v) => v.toFixed(2), map: (s) => [1 / s.V, s.P], curve: () => [[0, 0], [0.2, R_GAS * 300 * 0.2]], viewName: 'P against 1/V' },
    },
    charles: {
      a: { xrow: true, xmin: 0, xmax: 650, ymin: 0, ymax: 55, xticks: [200, 400], yticks: [20, 40], ylabel: 'V (L)', xlabel: 'T (K)', yc: C.cyan, xc: C.fire, map: (s) => [s.T, s.V], curve: () => [[0, 0], [650, 650 * R_GAS]], viewName: 'Against Kelvin' },
      b: { xrow: true, xmin: -300, xmax: 400, ymin: 0, ymax: 55, xticks: [-200, 0, 200], xfmt: (v) => (v < 0 ? '−' + -v : String(v)), yticks: [20, 40], ylabel: 'V (L)', xlabel: 'T (°C)', yc: C.cyan, xc: C.fire, map: (s) => [s.T - 273.15, s.V], curve: () => [[-273.15, 0], [400, 673.15 * R_GAS]], zero: true, viewName: 'Against Celsius' },
    },
    gay: {
      a: { xrow: true, xmin: 0, xmax: 650, ymin: 0, ymax: 2.4, xticks: [200, 400], yticks: [1, 2], ylabel: 'P (atm)', xlabel: 'T (K)', yc: C.pink, xc: C.fire, map: (s) => [s.T, s.P], curve: () => [[0, 0], [650, (650 * R_GAS) / 24.618]], viewName: 'Against Kelvin' },
      b: { xrow: true, xmin: -300, xmax: 400, ymin: 0, ymax: 2.4, xticks: [-200, 0, 200], xfmt: (v) => (v < 0 ? '−' + -v : String(v)), yticks: [1, 2], ylabel: 'P (atm)', xlabel: 'T (°C)', yc: C.pink, xc: C.fire, map: (s) => [s.T - 273.15, s.P], curve: () => [[-273.15, 0], [400, (673.15 * R_GAS) / 24.618]], zero: true, viewName: 'Against Celsius' },
    },
    avo: {
      a: { xrow: true, xmin: 0, xmax: 2.2, ymin: 0, ymax: 55, xticks: [0.5, 1, 1.5], yticks: [20, 40], ylabel: 'V (L)', xlabel: 'n (mol)', yc: C.cyan, xc: C.leaf, xfmt: (v) => v.toFixed(1), map: (s) => [s.n, s.V], curve: () => [[0, 0], [2.2, 2.2 * R_GAS * 300]] },
    },
  };
  const elV = Lab.$('#lab-v'), elT = Lab.$('#lab-t'), elN = Lab.$('#lab-n');
  const ctlV = Lab.$('#ctl-v'), ctlT = Lab.$('#ctl-t'), ctlN = Lab.$('#ctl-n');
  const outV = Lab.$('#lab-v-out'), outT = Lab.$('#lab-t-out'), outN = Lab.$('#lab-n-out');
  const lockCtl = (ctl, input, locked) => { input.disabled = locked; ctl.style.opacity = locked ? 0.5 : 1; };
  function paintOuts() {
    outV.textContent = lab.V.toFixed(1) + ' L' + (elV.disabled ? ' (set by the gas)' : '');
    if (lab.mode === 'gay') outV.textContent = lab.V.toFixed(1) + ' L (pinned)';
    outT.textContent = `${Math.round(lab.T)} K = ${Math.round(lab.T - 273.15)} °C` + (elT.disabled ? ' (locked)' : '');
    outN.textContent = lab.n.toFixed(2) + ' mol' + (elN.disabled ? ' (locked)' : '');
    elV.value = lab.V; Lab.paintRange(elV);
    elT.value = lab.T; Lab.paintRange(elT);
    elN.value = lab.n; Lab.paintRange(elN);
  }
  function resetPoints() { lab.pts = []; lab.strip = []; lab.stripT = 0; lab.last = null; }
  const viewSeg = Lab.segmented('#lab-view', (v) => { lab.view = v; });
  function setMode(mode) {
    lab.mode = mode;
    lab.view = 'a'; viewSeg.set('a', false);
    resetPoints();
    lab.T = 300; lab.n = 1; lab.Pfix = 1; lab.V = 24.618; lab.Vgoal = 24.618;
    lab.hold = 0; lab.banner = 0;
    const firstOpen = (MISSIONS[mode] || []).findIndex((_, i) => !lab.done[mode + i]);
    lab.mission = firstOpen < 0 ? (MISSIONS[mode] || []).length : firstOpen;
    lockCtl(ctlV, elV, !(mode === 'free' || mode === 'boyle'));
    lockCtl(ctlT, elT, !(mode === 'free' || mode === 'charles' || mode === 'gay'));
    lockCtl(ctlN, elN, !(mode === 'free' || mode === 'avo'));
    // Graph view buttons.
    const vs = Lab.$('#lab-view');
    const pl = PLOT[mode];
    if (pl && pl.b) {
      vs.style.display = '';
      Lab.$('#lab-view-a').textContent = pl.a.viewName;
      Lab.$('#lab-view-b').textContent = pl.b.viewName;
    } else vs.style.display = 'none';
    syncCount(); thermostat();
    box.setBounds(LX0 + INSET, y0For(lab.V), LX1 - INSET, YB);
    lab.flux = pNow() / CAL;
    paintOuts(); paintFoot(); paintLabReadouts();
    labStage.redraw();
  }
  function paintLabReadouts() {
    const P = pNow();
    Lab.$('#lab-atm').textContent = Lab.fmt(P, 2) + ' atm';
    Lab.$('#lab-mm').textContent = Lab.fmt(P * 760, 0) + ' mmHg';
    Lab.$('#lab-kpa').textContent = Lab.fmt(P * 101.325, 1) + ' kPa';
  }
  function paintFoot() {
    const foot = Lab.$('#lab-foot');
    const list = MISSIONS[lab.mode] || [];
    let html;
    if (lab.mode === 'free') {
      html = '<p><b>Free play.</b> Nothing is locked. Change anything and see the gauge respond. Can you find a way to push the needle off the dial? Can you get it below 0.1 atm?</p>';
    } else if (lab.mission >= list.length) {
      const next = ['boyle', 'charles', 'gay', 'avo'].find((m) => MISSIONS[m].some((_, i) => !lab.done[m + i]));
      html = `<p><b>${LAW_NAME[lab.mode]}: all missions done.</b> ${next ? `Next, try ${LAW_NAME[next]}.` : 'That is all four laws. You have earned your lab coat.'}</p>`;
    } else {
      const prevWin = lab.mission > 0 ? `<p>${list[lab.mission - 1].win}</p>` : '';
      html = `${prevWin}<p><b>${LAW_NAME[lab.mode]}, mission ${lab.mission + 1} of ${list.length}.</b> ${list[lab.mission].say}</p>`;
    }
    if (html !== lab.footKey) { lab.footKey = html; foot.innerHTML = Lab.texString(html); }
  }

  const labStage = Lab.stage('#c-lab', {
    w: LW, h: LH, drag: true,
    label: 'A gas cylinder with a movable piston, a heater, a gas valve, a pressure gauge and a live graph of the measurements.',
    bg(g, W, H) { Art.bgLab(g, W, H, 30); },
    onPointer(e) {
      const headY = y0For(lab.V) - INSET;
      const onHead = e.x > LX0 - 10 && e.x < LX1 + 10 && e.y > headY - 56 && e.y < headY + 24;
      const canDrag = lab.mode === 'free' || lab.mode === 'boyle';
      if (e.type === 'hover') { labStage.canvas.style.cursor = onHead ? (canDrag ? 'ns-resize' : 'not-allowed') : 'default'; return; }
      if (e.type === 'down' && onHead) {
        if (canDrag) { lab.dragging = true; lab.dragOff = e.y - headY; } else { lab.shake = 0.5; Lab.sound.bad(); }
      }
      if (e.type === 'move' && lab.dragging) {
        const y = e.y - lab.dragOff;
        // Invert y0For: headY = YB - KV*V - 2*RP - INSET.
        lab.V = clamp((YB - 2 * RP - INSET - y) / KV, 6, 50);
        lab.Vgoal = lab.V;
        box.setBounds(LX0 + INSET, y0For(lab.V), LX1 - INSET, YB);
        paintOuts(); paintLabReadouts();
      }
      if (e.type === 'up') lab.dragging = false;
    },
    draw(g, t, dt) {
      /* --- Physics --- */
      if (lab.mode === 'charles' || lab.mode === 'avo') lab.Vgoal = (lab.n * R_GAS * lab.T) / lab.Pfix;
      else if (!lab.dragging && lab.mode !== 'gay') lab.Vgoal = lab.V;
      if (Math.abs(lab.V - lab.Vgoal) > 1e-3) {
        lab.V = dt ? lab.V + (lab.Vgoal - lab.V) * (1 - Math.exp(-dt * 5)) : lab.Vgoal;
        lab.V = clamp(lab.V, 3, 60);
        box.setBounds(LX0 + INSET, y0For(lab.V), LX1 - INSET, YB);
        paintOuts();
      }
      if (dt) {
        box.wallHits = 0;
        box.step(dt / 2); box.step(dt / 2);
        thermostat();
        const hS = Math.max(1, CENTERS_W), hH = KV * lab.V;
        const flux = box.wallHits / (2 * (hS + hH));
        lab.flux += (flux - lab.flux * dt) / 2.2;
        lab.hitRate += (lab.hitsNow - lab.hitRate * dt) / 1.3;
        lab.hitsNow = 0;
      }
      const P = pNow();
      const measured = lab.flux * CAL;

      /* --- Graph points: each one is the real state at that moment --- */
      if (dt) {
        // The piston is still catching up while it moves, so plot the state it is heading to.
        const settled = Math.abs(lab.V - lab.Vgoal) < 0.3;
        const key = { boyle: lab.V, charles: lab.T, gay: lab.T, avo: lab.n }[lab.mode];
        const gap = { boyle: 1.1, charles: 18, gay: 18, avo: 0.09 }[lab.mode];
        if (lab.mode !== 'free' && (lab.last === null || Math.abs(key - lab.last) >= gap) && lab.pts.length < 140) {
          lab.pts.push({ V: lab.Vgoal, T: lab.T, n: lab.n, P: (lab.n * R_GAS * lab.T) / lab.Vgoal });
          lab.last = key;
        }
        lab.stripT += dt;
        if (lab.mode === 'free' && (!lab.strip.length || lab.stripT - lab.strip[lab.strip.length - 1][0] > 0.2)) {
          lab.strip.push([lab.stripT, P]);
          if (lab.strip.length > 110) lab.strip.shift();
        }
        // Missions.
        const list = MISSIONS[lab.mode] || [];
        if (lab.mission < list.length) {
          if (list[lab.mission].ok() && settled) lab.hold += dt; else lab.hold = 0;
          if (lab.hold > 0.7) {
            lab.done[lab.mode + lab.mission] = true;
            lab.hold = 0; lab.mission++;
            lab.banner = 2.4;
            lab.bannerText = 'Mission complete';
            Lab.sound.good();
            if (lab.mission >= list.length) { Lab.collection.award(1); Lab.confetti(70); }
            paintFoot();
          }
        }
        lab.banner = Math.max(0, lab.banner - dt);
        lab.shake = Math.max(0, lab.shake - dt);
        if (Math.floor(t * 8) !== Math.floor((t - dt) * 8)) paintLabReadouts();
      }

      /* --- Chamber --- */
      const yHead = y0For(lab.V) - INSET + (lab.shake > 0 ? Math.sin(t * 50) * 3 * lab.shake : 0);
      chamberBack(g, LX0, LX1, FLOOR, yHead, lab.T);
      // Faint streak behind each particle shows its speed.
      g.lineCap = 'round'; g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 5;
      g.save(); g.beginPath(); g.rect(LX0, yHead, LX1 - LX0, FLOOR - yHead); g.clip();
      for (const q of box.particles) {
        g.beginPath(); g.moveTo(q.x, q.y); g.lineTo(q.x - q.vx * 0.055, q.y - q.vy * 0.055); g.stroke();
      }
      for (const q of box.particles) {
        Art.molecule(g, q.x, q.y, 10.5, 'N2', { rot: q.rot * 3, style: 'fill', atomScale: 1.28, labels: false });
      }
      g.restore();
      // Sparks where particles hit walls.
      lab.sparks = lab.sparks.filter((s) => (s.age += dt) < 0.2);
      lab.sparks.forEach((s) => spark(g, s.x, s.y, s.age / 0.2));
      lab.puffs = lab.puffs.filter((s) => (s.age += dt) < 0.5);
      lab.puffs.forEach((s) => Art.burst(g, s.x, s.y, s.age / 0.5, { n: 8, r: 26, size: 5 }));
      chamberFront(g, LX0, LX1, FLOOR, 18);
      // Gas valve, on the left.
      g.fillStyle = '#8F89AB'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
      g.fillRect(66, FLOOR - 34, LX0 - 66, 16); g.strokeRect(66, FLOOR - 34, LX0 - 66, 16);
      g.fillStyle = lab.mode === 'avo' || lab.mode === 'free' ? C.leaf : '#6F6A8B';
      g.beginPath(); g.arc(78, FLOOR - 26, 13, 0, TAU); g.fill(); g.stroke();
      // Piston.
      const pinned = lab.mode === 'gay';
      const floats = lab.mode === 'charles' || lab.mode === 'avo';
      pistonHead(g, LX0, LX1, yHead, { label: pinned ? 'Pinned in place' : floats ? 'Free: stays at 1 atm' : 'Drag me', pins: pinned });
      heater(g, LX0, LX1, FLOOR + 2, 56, lab.T, t);
      Art.text(g, lab.T > 300 ? 'heating' : lab.T < 300 ? 'cooling' : 'room temperature', (LX0 + LX1) / 2, FLOOR + 30, { size: 20, color: '#fff', halo: true });
      Art.text(g, 'gas valve', 50, FLOOR + 14, { size: 20, color: C.dim });
      // Volume ruler.
      g.lineCap = 'round';
      for (let v = 0; v <= 50; v += 5) {
        const y = y0For(v) - INSET;
        const major = v % 10 === 0;
        g.strokeStyle = major ? '#fff' : 'rgba(255,255,255,.6)'; g.lineWidth = major ? 3 : 2;
        g.beginPath(); g.moveTo(LX1 + 3, y); g.lineTo(LX1 + (major ? 13 : 8), y); g.stroke();
        if (major && v > 0) Art.text(g, String(v), LX1 + 16, y, { size: 20, align: 'left', color: C.ink });
      }
      Art.text(g, 'L', LX1 + 21, y0For(0) - INSET, { size: 20, color: C.dim });
      // Thermometer on the left.
      Art.thermometer(g, 42, 120, 300, clamp(lab.T / 620), { w: 16, ticks: true });
      Art.text(g, Math.round(lab.T) + ' K', 46, 92, { font: 'display', size: 25, color: C.fire, halo: true });

      if (lab.banner > 0) {
        const a = clamp(lab.banner * 2);
        Art.pill(g, lab.bannerText, (LX0 + LX1) / 2, Math.max(yHead + 44, 100), { size: 26, color: C.leaf, text: '#0B2A18', font: 'display', alpha: a });
      }

      /* --- Gauge --- */
      gauge(g, 498, 116, 98, P, { max: 10, step: 2, ghost: Math.min(measured, 10.3), lcdW: 136, lcdH: 42, lcdSize: 28, readout: Lab.fmt(P, 2) + ' atm' });
      if (P > 10) Art.pill(g, 'Off the dial', 498, 22, { size: 22, color: C.red, text: '#fff', font: 'display' });

      /* --- Variable readouts --- */
      const row = (y, letter, val, col, locked, sub) => {
        Art.pill(g, letter, 622, y, { size: 24, color: col, text: '#1A0F2E', font: 'display' });
        Art.text(g, val, 644, y, { font: 'display', size: 29, align: 'left', color: '#fff' });
        if (sub) Art.text(g, sub, 644, y + 28, { size: 20, align: 'left', color: C.dim });
        if (locked) {
          const lx = 780;
          g.fillStyle = C.sun; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2;
          Art.round(g, lx - 11, y - 3, 22, 17, 4); g.fill(); g.stroke();
          g.strokeStyle = C.sun; g.lineWidth = 3.5; g.beginPath(); g.arc(lx, y - 3, 7, Math.PI, 0); g.stroke();
        }
      };
      const lockedV = lab.mode === 'gay', lockedT = lab.mode === 'boyle' || lab.mode === 'avo', lockedN = lab.mode !== 'free' && lab.mode !== 'avo';
      row(36, 'V', lab.V.toFixed(1) + ' L', C.cyan, lockedV);
      row(82, 'T', Math.round(lab.T) + ' K', C.fire, lockedT, Math.round(lab.T - 273.15) + ' °C');
      row(154, 'n', lab.n.toFixed(2) + ' mol', C.leaf, lockedN);
      const hitsTxt = String(Math.round(Math.max(0, lab.hitRate)));
      Art.text(g, hitsTxt, 662, 196, { font: 'display', size: 28, align: 'right', color: C.sun });
      Art.text(g, 'hits/second', 670, 196, { size: 21, align: 'left', color: C.dim });

      /* --- Live plot --- */
      const PB = { x: 448, y: 276, w: 330, h: 196 };
      if (lab.mode === 'free') {
        const span = 22;
        const tmax = Math.max(span, lab.stripT);
        const peak = Math.max(4, ...lab.strip.map((s) => s[1]));
        const ymax = peak <= 4 ? 4 : peak <= 6 ? 6 : peak <= 10 ? 10 : peak <= 20 ? 20 : 30;
        const ticks = ymax <= 6 ? (ymax === 4 ? [1, 2, 3, 4] : [2, 4, 6]) : ymax === 10 ? [5, 10] : ymax === 20 ? [10, 20] : [10, 20, 30];
        const A = axes(g, PB, { xmin: tmax - span, xmax: tmax, ymin: 0, ymax, yticks: ticks, ylabel: 'P (atm)', xlabel: 'time', yc: C.pink });
        g.strokeStyle = C.pink; g.lineWidth = 4; g.lineJoin = 'round';
        g.beginPath();
        lab.strip.forEach((s, i) => { const x = A.X(s[0]), y = A.Y(s[1]); if (i) g.lineTo(x, y); else g.moveTo(x, y); });
        g.stroke();
        if (lab.strip.length) { const s = lab.strip[lab.strip.length - 1]; Art.ball(g, A.X(s[0]), A.Y(s[1]), 8, C.pink); }
        Art.text(g, 'P = nRT ÷ V', 610, 240, { font: 'display', size: 28, color: C.sun });
      } else {
        const pl = PLOT[lab.mode][lab.view] || PLOT[lab.mode].a;
        const A = axes(g, PB, pl);
        if (lab.pts.length >= 3) {
          const pts = pl.curve();
          g.strokeStyle = Art.alpha(C.cyan, 0.65); g.lineWidth = 3.5; g.setLineDash([9, 8]); g.lineJoin = 'round';
          g.save(); g.beginPath(); g.rect(PB.x, PB.y, PB.w, PB.h); g.clip();
          g.beginPath();
          pts.forEach((pt, i) => { if (i) g.lineTo(A.X(pt[0]), A.Y(pt[1])); else g.moveTo(A.X(pt[0]), A.Y(pt[1])); });
          g.stroke(); g.restore(); g.setLineDash([]);
          if (pl.zero) {
            const zx = A.X(-273.15), zy = A.Y(0);
            Art.ring(g, zx, zy, 14, { color: C.sun, w: 4 });
            Art.text(g, '−273 °C', zx + 20, zy - 26, { size: 22, align: 'left', color: C.sun, halo: true });
          }
        }
        lab.pts.forEach((s) => {
          const pt = pl.map(s);
          Art.ball(g, A.X(pt[0]), A.Y(pt[1]), 7, C.sun);
        });
        const cur = pl.map({ V: lab.V, T: lab.T, n: lab.n, P });
        Art.glow(g, A.X(cur[0]), A.Y(cur[1]), 24, C.pink, 0.8);
        Art.ball(g, A.X(cur[0]), A.Y(cur[1]), 10, C.pink);
        // The constant that really does stay constant.
        const k = {
          boyle: `P × V = ${Lab.fmt(P * lab.V, 1)} L·atm`,
          charles: `V ÷ T = ${Lab.fmt(lab.V / lab.T, 4)} L/K`,
          gay: `P ÷ T = ${Lab.fmt(P / lab.T, 5)} atm/K`,
          avo: `V ÷ n = ${Lab.fmt(lab.V / lab.n, 1)} L/mol`,
        }[lab.mode];
        Art.text(g, k, 610, 240, { font: 'display', size: 28, color: C.leaf });
      }
    },
  });
  Lab.segmented('#lab-mode', setMode);
  const onV = () => { lab.V = +elV.value; lab.Vgoal = lab.V; box.setBounds(LX0 + INSET, y0For(lab.V), LX1 - INSET, YB); paintOuts(); paintLabReadouts(); labStage.redraw(); };
  const onT = () => { lab.T = +elT.value; paintOuts(); paintLabReadouts(); labStage.redraw(); };
  const onN = () => { lab.n = +elN.value; syncCount(); paintOuts(); paintLabReadouts(); labStage.redraw(); };
  elV.addEventListener('input', onV);
  elT.addEventListener('input', onT);
  elN.addEventListener('input', onN);
  Lab.$('#lab-clear').addEventListener('click', () => { resetPoints(); labStage.redraw(); });
  setMode('free');

  /* ---------- Story 4: why Kelvin ---------- */
  const miniCyl = (g, x, floor, hw, height, T, t, o = {}) => {
    const yH = floor - height;
    chamberBack(g, x - hw, x + hw, floor, yH, T);
    const b = { x0: x - hw + 2, x1: x + hw - 2, y0: yH, y1: floor };
    gasField(g, b, o.n || 9, steady(t, 140 * Math.sqrt(T / 300), hw * 2 - 30, Math.max(40, height - 30)), { seed: o.seed || 5, bond: 13, r: 15, sparks: o.sparks });
    chamberFront(g, x - hw, x + hw, floor, o.top === undefined ? floor - 310 : o.top);
    pistonHead(g, x - hw, x + hw, yH, { h: 22, rodTop: o.top === undefined ? floor - 340 : o.top - 26 });
  };
  Lab.story('#story-kelvin', {
    title: 'The trap, and the way out',
    scenes: [
      {
        say: 'A gas sits at 10 °C. Double it to 20 °C and you might expect double the volume. Look what really happens. It grows by just <b>3.5%</b>.',
        dur: 3.8,
        draw(g, p, t) {
          const floor = 400, H1 = 130;
          const q = ease.inOut(seg(p, 0.3, 0.65));
          miniCyl(g, 170, floor, 88, H1, 283, t, { seed: 5 });
          Art.text(g, '10 °C', 170, 40, { font: 'display', size: 44, color: C.cyan });
          Art.arrow(g, 290, 240, 422, 240, { color: C.pink, w: 8, p: seg(p, 0.08, 0.26) });
          Art.text(g, '"twice as hot"?', 356, 200, { size: 25, color: C.pink, alpha: seg(p, 0.12, 0.3) });
          const H2 = lerp(H1, H1 * 1.0353, q);
          miniCyl(g, 560, floor, 88, H2, 293, t, { seed: 5 });
          Art.text(g, '20 °C', 560, 40, { font: 'display', size: 44, color: C.fire });
          // Ghost of what a naive doubling would look like.
          const a = seg(p, 0.5, 0.72);
          g.save(); g.setLineDash([12, 10]); g.strokeStyle = Art.alpha(C.red, a); g.lineWidth = 4;
          const yG = floor - H1 * 2;
          g.beginPath(); g.moveTo(460, yG); g.lineTo(660, yG); g.stroke(); g.restore();
          Art.text(g, 'the double you expected', 560, yG - 22, { size: 23, color: C.red, alpha: a, halo: true });
          g.strokeStyle = Art.alpha(C.leaf, seg(p, 0.65, 0.8)); g.lineWidth = 4;
          const c = seg(p, 0.7, 0.9);
          if (c > 0) {
            g.fillStyle = Art.alpha(C.plum2, 0.95 * c); Art.round(g, 678, 268, 112, 88, 16); g.fill();
            Art.text(g, 'only', 734, 288, { size: 24, alpha: c });
            Art.text(g, '3.5%', 734, 326, { font: 'display', size: 36, color: C.sun, alpha: c });
          }
        },
      },
      {
        say: 'Zero on the Celsius scale is only where water freezes. Particles at 0 °C still fly at hundreds of meters per second. Celsius zero is <b>not real zero</b>.',
        dur: 3.6,
        draw(g, p, t) {
          // Twin scale.
          const x = 250, yTop = 44, yBot = 404;
          const yOf = (k) => lerp(yBot, yTop, k / 400);
          g.fillStyle = 'rgba(255,255,255,.1)'; g.strokeStyle = C.glass; g.lineWidth = 3;
          Art.round(g, x - 20, yTop - 10, 40, yBot - yTop + 26, 20); g.fill(); g.stroke();
          const fill = ease.out(seg(p, 0.05, 0.3));
          g.fillStyle = '#FF4D5E';
          Art.round(g, x - 10, lerp(yBot, yOf(273), fill), 20, yBot + 8 - lerp(yBot, yOf(273), fill), 10); g.fill();
          [[373, '100 °C', 'water boils'], [273, '0 °C', 'water freezes'], [0, '−273 °C', 'absolute zero']].forEach(([k, c, lab2], i) => {
            const y = yOf(k), a = seg(p, 0.14 + i * 0.12, 0.3 + i * 0.12);
            g.strokeStyle = Art.alpha('#fff', a); g.lineWidth = 3;
            g.beginPath(); g.moveTo(x - 30, y); g.lineTo(x + 30, y); g.stroke();
            Art.text(g, k + ' K', x + 42, y, { font: 'display', size: 30, align: 'left', color: C.sun, alpha: a });
            Art.text(g, c, x - 42, y - 14, { font: 'display', size: 28, align: 'right', color: C.cyan, alpha: a });
            Art.text(g, lab2, x - 42, y + 15, { size: 20, align: 'right', color: C.dim, alpha: a });
          });
          // Particles at 0 °C are anything but still.
          zoom(g, x + 34, yOf(273), 600, 196, 158, (gg, cx, cy, R) => {
            const b = { x0: cx - R, x1: cx + R, y0: cy - R, y1: cy + R };
            gasField(gg, b, 11, steady(t, 180, R * 2 - 40, R * 2 - 40), { seed: 8, bond: 24, r: 28, sparks: false });
          }, { p: seg(p, 0.42, 0.7) });
          const c = seg(p, 0.68, 0.88);
          Art.text(g, 'at 0 °C: about 490 m/s', 600, 384, { font: 'display', size: 28, color: C.sun, alpha: c, halo: true });
          Art.text(g, 'not stopped at all!', 600, 418, { size: 24, alpha: c, halo: true });
        },
      },
      {
        say: 'Plot volume against Celsius for any gas sample. Follow the straight line down and it reaches zero volume at <b>−273.15 °C</b>. Every sample points at that same spot.',
        speak: 'Plot volume against Celsius for any gas sample. Follow the straight line down and it reaches zero volume at minus 273.15 degrees Celsius. Every sample points at that same spot.',
        dur: 4,
        draw(g, p) {
          const b = { x: 80, y: 40, w: 680, h: 344 };
          const A = axes(g, b, { xmin: -300, xmax: 200, ymin: 0, ymax: 6, xticks: [-200, -100, 0, 100, 200], yticks: [2, 4, 6], ylabel: 'volume (L)', xlabel: 'temperature (°C)', xfmt: (v) => (v < 0 ? '−' + -v : String(v)) });
          const lines = [[0.05, C.pink], [0.1, C.cyan], [0.15, C.leaf]];
          lines.forEach(([n, col], i) => {
            const vOf = (c) => n * R_GAS * (c + 273.15);
            const q = seg(p, 0.06 + i * 0.1, 0.24 + i * 0.1);
            // Measured part as a solid line, with measurement dots.
            const start = -60, end = 190;
            g.strokeStyle = col; g.lineWidth = 5; g.lineCap = 'round';
            g.beginPath(); g.moveTo(A.X(start), A.Y(vOf(start)));
            const e = lerp(start, end, q);
            g.lineTo(A.X(e), A.Y(vOf(e))); g.stroke();
            for (let c = start; c <= e; c += 50) Art.ball(g, A.X(c), A.Y(vOf(c)), 7, col);
            // Dashed projection.
            const r = ease.inOut(seg(p, 0.42 + i * 0.05, 0.78));
            if (r > 0) {
              g.save(); g.setLineDash([10, 9]); g.strokeStyle = col; g.lineWidth = 4;
              g.beginPath(); g.moveTo(A.X(start), A.Y(vOf(start)));
              const low = lerp(start, -273.15, r);
              g.lineTo(A.X(low), A.Y(vOf(low))); g.stroke(); g.restore();
            }
          });
          const z = seg(p, 0.76, 0.94);
          if (z > 0) {
            Art.ring(g, A.X(-273.15), A.Y(0), 20, { color: C.sun, w: 5, p: z });
            Art.text(g, '−273.15 °C', A.X(-273.15) + 2, A.Y(2.6), { font: 'display', size: 34, align: 'left', color: C.sun, alpha: z, halo: true });
            Art.arrow(g, A.X(-273.15) + 40, A.Y(2.6) + 22, A.X(-273.15) + 8, A.Y(0) - 26, { color: C.sun, w: 5, alpha: z });
          }
          Art.text(g, 'measured', A.X(110), A.Y(1.15), { size: 25, color: C.ink, alpha: seg(p, 0.3, 0.45), halo: true });
          Art.text(g, 'projected', A.X(-150), A.Y(0.5), { size: 25, align: 'left', color: C.ink, alpha: seg(p, 0.6, 0.75), halo: true });
          Art.text(g, '0 °C is not zero volume', A.X(-8), A.Y(5.2), { size: 24, align: 'right', color: C.cyan, alpha: seg(p, 0.8, 0.95), halo: true });
        },
      },
      {
        say: 'That spot is <b>absolute zero</b>, the coldest anything can be. The Kelvin scale starts there, at 0 K. Real gases turn to liquid before they get close, so the last stretch of the line is a projection.',
        dur: 3.8,
        draw(g, p, t) {
          const x = 180, y = 214, cool = ease.inOut(seg(p, 0.05, 0.75));
          const T = lerp(300, 3, cool);
          // Same molecule cooling down: its jiggle shrinks with the speed.
          const amp = 46 * Math.sqrt(T / 300);
          const jx = wander(1, t * 5) * amp, jy = wander(4, t * 5) * amp;
          Art.glow(g, x, y, 170, Art.mix(C.cyan, C.fire, T / 300), 0.25);
          Art.molecule(g, x + jx, y + jy, 76, 'N2', { face: cool > 0.75 ? 'sleepy' : 'happy', faceAll: true, t, rot: t * (T / 300) * 2 + 0.2, style: 'fill', atomScale: 1.05, labels: false });
          Art.thermometer(g, 400, 58, 304, clamp(T / 320), { w: 18 });
          Art.text(g, Math.round(T) + ' K', 400, 26, { font: 'display', size: 32, color: T < 60 ? C.cyan : C.fire });
          const c = seg(p, 0.7, 0.9);
          if (c > 0) {
            g.fillStyle = Art.alpha(C.plum2, 0.95 * c); Art.round(g, 470, 60, 310, 200, 22); g.fill();
            Art.text(g, '0 K', 625, 110, { font: 'display', size: 56, color: C.sun, alpha: c });
            Art.text(g, '= −273.15 °C', 625, 168, { font: 'display', size: 34, color: C.ink, alpha: c });
            Art.text(g, 'absolute zero', 625, 218, { size: 26, color: C.dim, alpha: c });
          }
          Art.text(g, cool > 0.9 ? 'nearly still' : 'slowing down', x, 372, { size: 26, color: C.dim, alpha: seg(p, 0.1, 0.25) });
          Art.text(g, 'Colder means slower.', 625, 322, { size: 28, color: C.cyan, alpha: seg(p, 0.2, 0.4) });
          Art.text(g, 'Nothing can go below 0 K.', 625, 362, { size: 26, alpha: seg(p, 0.8, 0.95) });
        },
      },
      {
        say: 'So add 273.15 first. 10 °C is about 283 K. Double the Kelvin temperature to 566 K and the volume really does <b>double</b>.',
        dur: 3.6,
        draw(g, p, t) {
          const floor = 412, H1 = 130;
          const q = ease.inOut(seg(p, 0.4, 0.8));
          const T = lerp(283, 566, q);
          miniCyl(g, 150, floor, 88, H1, 283, t, { seed: 5, top: 112 });
          miniCyl(g, 620, floor, 88, lerp(H1, H1 * 2, q), T, t, { seed: 5, top: 112 });
          // Conversion.
          const a = seg(p, 0.04, 0.2), b = seg(p, 0.2, 0.36);
          Art.text(g, '10 °C', 150, 34, { font: 'display', size: 38, color: C.cyan, alpha: a });
          Art.text(g, '+ 273 = 283 K', 150, 76, { font: 'display', size: 30, color: C.sun, alpha: b });
          Art.arrow(g, 262, 290, 508, 290, { color: C.leaf, w: 9, p: seg(p, 0.34, 0.5) });
          Art.text(g, '× 2 in Kelvin', 385, 248, { font: 'display', size: 32, color: C.leaf, alpha: seg(p, 0.4, 0.55) });
          Art.text(g, Math.round(T) + ' K', 620, 34, { font: 'display', size: 38, color: C.fire });
          Art.text(g, Math.round(T - 273) + ' °C', 620, 76, { size: 28, color: C.dim });
          const c = seg(p, 0.8, 0.95);
          if (c > 0) {
            Art.popIn(g, 385, 364, c, (gg) => {
              gg.fillStyle = C.leaf; Art.round(gg, -134, -36, 268, 72, 22); gg.fill();
              Art.text(gg, '2 × the volume', 0, 2, { font: 'display', size: 32, color: '#0B2A18' });
            });
          }
        },
      },
    ],
  });

  /* ---------- Bench: the doubling test ---------- */
  const dbl = { c: 20, t0: 0, shownL: 1, shownR: 1 };
  const dblStage = Lab.stage('#c-double', {
    h: 440,
    label: 'Two cylinders. On the left the Celsius temperature is doubled and the gas barely grows. On the right the Kelvin temperature is doubled and the volume doubles.',
    draw(g, t, dt) {
      const c1 = dbl.c, c2 = c1 * 2, k1 = c1 + 273.15;
      const rL = (c2 + 273.15) / k1, rR = 2;
      dbl.shownL = dt ? lerp(dbl.shownL, rL, clamp(dt * 7)) : rL;
      const floor = 402, H1 = 118, hw = 96;
      const col = (x, ratio, Tk, title, col1, sub, ok) => {
        Art.text(g, title, x, 30, { font: 'display', size: 30, color: col1 });
        Art.text(g, sub, x, 66, { size: 24, color: C.ink });
        const hNow = H1 * ratio;
        miniCyl(g, x, floor, hw, hNow, Tk, t, { seed: 5, top: 100, n: 10 });
        // The "before" mark.
        g.save(); g.setLineDash([10, 9]); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 3;
        g.beginPath(); g.moveTo(x - hw - 16, floor - H1); g.lineTo(x + hw + 16, floor - H1); g.stroke(); g.restore();
        Art.text(g, 'before', x - hw + 18, floor - H1 + 18, { size: 21, align: 'left', color: '#fff', halo: true });
        // Verdict.
        g.fillStyle = ok ? C.leaf : C.red;
        Art.round(g, x + hw + 18, 250, 116, 72, 16); g.fill();
        Art.text(g, ok ? '× 2.00' : '× ' + ratio.toFixed(2), x + hw + 76, 286, { font: 'display', size: 30, color: ok ? '#0B2A18' : '#fff' });
      };
      col(150, dbl.shownL, c2 + 273.15, 'Double the Celsius', C.red, `${c1} °C to ${c2} °C`, false);
      col(560, rR, k1 * 2, 'Double the Kelvin', C.leaf, `${Math.round(k1)} K to ${Math.round(k1 * 2)} K`, true);
    },
  });
  void dblStage;
  Lab.bind('#dbl-t', '#dbl-t-out', (v) => `${v} °C = ${Math.round(v + 273.15)} K`, (v) => {
    dbl.c = v;
    const k1 = v + 273.15, ratio = (2 * v + 273.15) / k1;
    Lab.$('#dbl-foot').innerHTML = Lab.texString(`<p>Doubling ${v} °C to ${2 * v} °C only multiplies the volume by $\\frac{${Lab.fmt(2 * v + 273.15, 2).replace(/,/g, '')}\\text{ K}}{${Lab.fmt(k1, 2).replace(/,/g, '')}\\text{ K}} = ${ratio.toFixed(3)}$. To really double it, you need ${Math.round(k1 * 2)} K, which is <b>${Math.round(k1 * 2 - 273.15)} °C</b>.</p>`);
    dblStage.redraw();
  });
});
