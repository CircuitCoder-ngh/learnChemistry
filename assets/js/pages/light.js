/* Lesson 7.1: Light and photons. Physics is computed from h and c, and photon colors from a wavelength-to-RGB function. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const TAU = Math.PI * 2;
  const h = 6.626e-34, c = 2.998e8, eV = 1.602e-19, NA = 6.022e23;
  const photonJ = (nm) => (h * c) / (nm * 1e-9);
  const photonEV = (nm) => photonJ(nm) / eV;
  const freqHz = (nm) => c / (nm * 1e-9);

  /* ---------- Wavelength to color (after Dan Bruton's approximation) ---------- */
  function waveRGB(nm) {
    let r = 0, gr = 0, b = 0;
    if (nm >= 380 && nm < 440) { r = (440 - nm) / 60; b = 1; }
    else if (nm >= 440 && nm < 490) { gr = (nm - 440) / 50; b = 1; }
    else if (nm >= 490 && nm < 510) { gr = 1; b = (510 - nm) / 20; }
    else if (nm >= 510 && nm < 580) { r = (nm - 510) / 70; gr = 1; }
    else if (nm >= 580 && nm < 645) { r = 1; gr = (645 - nm) / 65; }
    else if (nm >= 645 && nm <= 750) { r = 1; }
    let f = 1;
    if (nm >= 380 && nm < 420) f = 0.62 + (0.38 * (nm - 380)) / 40;
    else if (nm > 700 && nm <= 750) f = 0.62 + (0.38 * (750 - nm)) / 50;
    const v = (x) => Math.round(255 * Math.pow(x * f, 0.8));
    return [v(r), v(gr), v(b)];
  }
  /** The drawing color for any wavelength. Invisible light gets a muted stand-in color. */
  function lightColor(nm) {
    if (nm < 380) return '#C9B6FF';
    if (nm > 750) return '#C96A5A';
    const [r, gg, b] = waveRGB(nm);
    return `rgb(${r},${gg},${b})`;
  }
  /** The same color, lifted so that it reads as text on the dark stage. */
  const textColor = (nm) => Art.mix(lightColor(nm), '#ffffff', nm < 450 ? 0.5 : 0.28);
  function colorName(nm) {
    if (nm < 380) return 'ultraviolet';
    if (nm < 450) return 'violet';
    if (nm < 495) return 'blue';
    if (nm < 570) return 'green';
    if (nm < 590) return 'yellow';
    if (nm < 620) return 'orange';
    if (nm <= 750) return 'red';
    return 'infrared';
  }

  /* ---------- Drawing helpers ---------- */
  /** A glowing sine line. phase is in cycles and moves the wave to the right as it grows. */
  function waveLine(g, x0, x1, ym, amp, lam, phase, color, o = {}) {
    const path = new Path2D();
    let first = true;
    for (let x = x0; x <= x1 + 0.5; x += 3) {
      const y = ym - amp * Math.sin(TAU * ((x - (o.x00 || 0)) / lam - phase));
      if (first) { path.moveTo(x, y); first = false; } else path.lineTo(x, y);
    }
    g.save();
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = Art.alpha(color, 0.22); g.lineWidth = (o.w || 6) * 3.4; g.stroke(path);
    g.strokeStyle = color; g.lineWidth = o.w || 6; g.stroke(path);
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = (o.w || 6) * 0.3; g.stroke(path);
    g.restore();
  }
  /** One photon: a little packet of wave inside a fading envelope. Travels along ang. */
  function photon(g, x, y, nm, o = {}) {
    const len = o.len || 76, amp = o.amp || 15, ang = o.ang || 0, col = lightColor(nm);
    const lam = o.lam || clamp(nm * 0.042, 6, 40);
    const ph = o.phase || 0;
    g.save();
    g.translate(x, y); g.rotate(ang);
    if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
    Art.glow(g, 0, 0, len * 0.6, col, 0.42);
    g.strokeStyle = col; g.lineWidth = o.w || 4; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath();
    const sd = len * 0.25;
    for (let s = -len / 2; s <= len / 2; s += 1.5) {
      const env = Math.exp(-(s * s) / (2 * sd * sd));
      const yy = amp * env * Math.sin((TAU * s) / lam + ph);
      if (s === -len / 2) g.moveTo(s, yy); else g.lineTo(s, yy);
    }
    g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = (o.w || 4) * 0.3; g.stroke();
    g.restore();
  }
  /** A bench lamp, with the head at (x, y) and the opening pointing along ang. */
  function lamp(g, x, y, ang, col, on = 1) {
    g.save();
    g.translate(x, y); g.rotate(ang);
    if (on > 0) Art.glow(g, 34, 0, 62, col, 0.5 * on);
    const shade = g.createLinearGradient(0, -28, 0, 28);
    shade.addColorStop(0, '#B9B3D3'); shade.addColorStop(0.5, '#ECE8FA'); shade.addColorStop(1, '#6F6A8B');
    g.fillStyle = shade; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(-34, -14); g.lineTo(10, -30); g.lineTo(10, 30); g.lineTo(-34, 14); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = on > 0 ? Art.mix(col, '#ffffff', 0.55) : '#55506E';
    g.beginPath(); g.ellipse(11, 0, 8, 28, 0, 0, TAU); g.fill(); g.stroke();
    g.restore();
  }
  function duck(g, x, y, s, tilt) {
    g.save();
    g.translate(x, y); g.rotate(tilt); g.scale(s, s);
    g.fillStyle = '#FFD23F'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(-36, -8);
    g.quadraticCurveTo(-46, -24, -34, -24);
    g.quadraticCurveTo(-16, -6, 6, -10);
    g.quadraticCurveTo(38, -8, 30, 10);
    g.quadraticCurveTo(0, 26, -28, 12);
    g.quadraticCurveTo(-38, 4, -36, -8); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.arc(20, -28, 19, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = '#FF8A2B';
    g.beginPath(); g.moveTo(36, -32); g.lineTo(52, -26); g.lineTo(36, -20); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#22123A'; g.beginPath(); g.arc(25, -34, 3.6, 0, TAU); g.fill();
    g.strokeStyle = '#E2A800'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(-16, -2); g.quadraticCurveTo(0, 10, 14, -2); g.stroke();
    g.restore();
  }
  function seaScene(g, W, H, ym, amp, lam, phase) {
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#2A1A58'); sky.addColorStop(0.6, '#5C3C8E'); sky.addColorStop(1, '#8C5BA8');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    Art.glow(g, 660, 92, 130, '#FFD23F', 0.7);
    g.fillStyle = '#FFE27A'; g.beginPath(); g.arc(660, 92, 42, 0, TAU); g.fill();
    const yAt = (x) => ym - amp * Math.sin(TAU * (x / lam - phase));
    const water = g.createLinearGradient(0, ym - amp, 0, H);
    water.addColorStop(0, '#3CC0F0'); water.addColorStop(1, '#10407E');
    g.fillStyle = water;
    g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 6) g.lineTo(x, yAt(x));
    g.lineTo(W, H); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 4;
    g.beginPath();
    for (let x = 0; x <= W; x += 6) { if (x === 0) g.moveTo(x, yAt(x)); else g.lineTo(x, yAt(x)); }
    g.stroke();
    return yAt;
  }

  /* ---------- Story 1: anatomy of a wave ---------- */
  Lab.story('#story-wave', {
    title: 'What is a wave?',
    scenes: [
      {
        say: 'A <b>wave</b> is a wiggle that travels. The sea wave rolls to the right, but the duck only bobs up and down. The wiggle moves on. The water stays put.',
        dur: 3.2,
        draw(g, p, t, { W, H }) {
          const lam = 300, phase = t * 0.32;
          const yAt = seaScene(g, W, H, 270, 46, lam, phase);
          const dx = 300, slope = (yAt(dx + 4) - yAt(dx - 4)) / 8;
          duck(g, dx, yAt(dx) - 6, 1.35, Math.atan(slope) * 0.7);
          Art.arrow(g, 150, 80, 440, 80, { color: '#fff', w: 7, p: seg(p, 0.2, 0.6) });
          Art.text(g, 'The wave travels', 295, 44, { size: 30, font: 'display', alpha: seg(p, 0.3, 0.6), halo: true });
          const y = yAt(dx) - 6;
          Art.arrow(g, dx - 94, 214, dx - 94, 320, { color: C.sun, w: 6, both: true, p: seg(p, 0.55, 0.8) });
          Art.text(g, 'The duck only bobs', dx - 94, 372, { size: 30, font: 'display', color: C.sun, alpha: seg(p, 0.6, 0.85), halo: true });
          void y;
        },
      },
      {
        say: 'Name the parts. The top is a <b>crest</b> and the bottom is a <b>trough</b>. The distance from crest to crest is the <b>wavelength</b>, written $\\lambda$. The height above the middle is the <b>amplitude</b>.',
        dur: 4.6,
        draw(g, p, t) {
          const lam = 260, ym = 262, amp = 92;
          const x00 = 130 - lam / 4;
          const draw = ease.inOut(seg(p, 0, 0.2));
          g.save(); g.strokeStyle = C.line; g.lineWidth = 2.5; g.setLineDash([9, 9]);
          g.beginPath(); g.moveTo(30, ym); g.lineTo(770, ym); g.stroke(); g.restore();
          waveLine(g, 30, lerp(30, 770, draw), ym, amp, lam, 0, C.cyan, { w: 8, x00 });
          const a = seg(p, 0.2, 0.34), b = seg(p, 0.34, 0.48), cc = seg(p, 0.5, 0.72), d = seg(p, 0.76, 0.96);
          if (a > 0) {
            Art.ring(g, 650, ym - amp, 26, { color: C.sun, p: a });
            Art.text(g, 'crest', 650, ym - amp - 50, { size: 32, font: 'display', color: C.sun, alpha: a });
          }
          if (b > 0) {
            Art.ring(g, 260, ym + amp, 26, { color: C.sun, p: b });
            Art.text(g, 'trough', 260, ym + amp + 50, { size: 32, font: 'display', color: C.sun, alpha: b });
          }
          if (cc > 0) {
            g.save(); g.globalAlpha *= cc; g.strokeStyle = C.pink; g.lineWidth = 3; g.setLineDash([6, 7]);
            g.beginPath(); g.moveTo(130, ym - amp - 8); g.lineTo(130, 94); g.moveTo(390, ym - amp - 8); g.lineTo(390, 94); g.stroke(); g.restore();
            Art.arrow(g, 130, 94, 390, 94, { color: C.pink, w: 6, both: true, p: cc });
            Art.text(g, 'wavelength λ', 260, 56, { size: 36, font: 'display', color: C.pink, alpha: cc });
          }
          if (d > 0) {
            Art.arrow(g, 650, ym, 650, ym - amp + 8, { color: C.leaf, w: 7, both: true, p: d });
            Art.text(g, 'amplitude', 650, ym + 44, { size: 30, font: 'display', color: C.leaf, alpha: d, halo: true });
          }
          void t;
        },
      },
      {
        say: '<b>Frequency</b>, written $\\nu$, counts how many crests pass a spot each second. One crest each second is 1 <b>hertz</b>, or 1 Hz. Visible light runs at about 500 trillion Hz.',
        dur: 3,
        draw(g, p, t) {
          const lam = 240, ym = 200, amp = 74, speed = 240;
          const phase = (t * speed) / lam;
          const gx = 460;
          waveLine(g, 40, 770, ym, amp, lam, phase, C.cyan, { w: 7 });
          // Where is the nearest crest to the gate?
          const c0 = ((gx / lam - phase - 0.25) % 1 + 1) % 1;
          const near = Math.min(c0, 1 - c0);
          const flash = clamp(1 - near * 9);
          g.fillStyle = '#8E86A8'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
          Art.round(g, gx - 8, 80, 16, 240, 6); g.fill(); g.stroke();
          if (flash > 0) Art.glow(g, gx, 110, 90, C.sun, 0.8 * flash);
          g.fillStyle = Art.mix('#7A6E94', C.sun, flash);
          g.beginPath(); g.arc(gx, 80, 22, 0, TAU); g.fill(); g.stroke();
          const count = Math.floor(t + 0.333);
          g.fillStyle = 'rgba(26,15,46,.86)'; Art.round(g, 90, 322, 620, 104, 24); g.fill();
          Art.text(g, String(count), 164, 362, { font: 'display', size: 50, color: C.sun });
          Art.text(g, 'crests passed', 164, 402, { size: 22 });
          Art.text(g, String(Math.floor(t)), 356, 362, { font: 'display', size: 50, color: C.cyan });
          Art.text(g, 'seconds', 356, 402, { size: 22 });
          Art.text(g, '1 Hz', 572, 362, { font: 'display', size: 50, color: C.pink, alpha: seg(p, 0.5, 0.8) });
          Art.text(g, 'one crest per second', 572, 402, { size: 22, alpha: seg(p, 0.5, 0.8) });
        },
      },
      {
        say: 'Now a race. Both waves leave together and move at the same speed. The violet wave has a <b>shorter wavelength</b>, so more crests cross the line. Short wavelength means <b>high frequency</b>.',
        dur: 4,
        draw(g, p) {
          const front = lerp(50, 690, ease.inOut(seg(p, 0.04, 0.84)));
          const rows = [{ nm: 700, ym: 92, name: 'Red' }, { nm: 400, ym: 270, name: 'Violet' }];
          rows.forEach((row) => {
            const lam = row.nm * 0.3, col = lightColor(row.nm);
            g.save(); g.beginPath(); g.rect(40, row.ym - 80, front - 40 + 8, 160); g.clip();
            waveLine(g, 50, front, row.ym, 52, lam, 0, col, { w: 7, x00: 50 });
            g.restore();
            Art.ball(g, front, row.ym - 52 * Math.sin((TAU * (front - 50)) / lam), 11, col);
            const crests = Math.floor((front - 50) / lam + 0.75);
            const a = seg(p, 0.78, 0.95);
            Art.text(g, `${row.name}, ${row.nm} nm: ${crests} crests crossed`, 370, row.ym + 76, { size: 28, color: textColor(row.nm), alpha: a, halo: true });
          });
          // Finish line.
          for (let y = 30; y < 430; y += 20) {
            g.fillStyle = Math.floor(y / 20) % 2 ? '#fff' : '#22123A';
            g.fillRect(698, y, 10, 20); g.fillStyle = Math.floor(y / 20) % 2 ? '#22123A' : '#fff'; g.fillRect(708, y, 10, 20);
          }
          Art.text(g, 'Both arrive together: same speed', 370, 416, { font: 'display', size: 30, color: C.sun, alpha: seg(p, 0.86, 1), halo: true });
        },
      },
      {
        say: 'Here is a tiny example. If 5 waves pass each second and each is 2 m long, then the wave moves 10 m each second. Speed is <b>wavelength times frequency</b>.',
        dur: 4.4,
        draw(g, p, t) {
          const x0 = 60, w = 136, y = 160;
          for (let i = 0; i < 5; i++) {
            const q = ease.back(seg(p, 0.08 + i * 0.09, 0.2 + i * 0.09));
            if (q <= 0) continue;
            const cx = x0 + w * (i + 0.5);
            g.save(); g.translate(cx, y); g.scale(q, q); g.translate(-cx, -y);
            g.fillStyle = 'rgba(47,214,242,.1)'; Art.round(g, cx - w / 2 + 5, y - 60, w - 10, 120, 18); g.fill();
            g.save(); g.beginPath(); g.rect(cx - w / 2, y - 62, w, 124); g.clip();
            waveLine(g, cx - w / 2, cx + w / 2, y, 36, w, -0.25 - Math.sin(t * 2 + i) * 0, C.cyan, { w: 6, x00: cx - w / 2 });
            g.restore();
            Art.text(g, '2 m', cx, y + 84, { size: 26, color: C.ink });
            g.restore();
          }
          Art.text(g, '5 waves pass each second', 400, 56, { size: 32, font: 'display', alpha: seg(p, 0.05, 0.2) });
          const a = seg(p, 0.6, 0.76);
          Art.arrow(g, x0, 280, x0 + w * 5, 280, { color: C.sun, w: 6, both: true, p: a });
          Art.text(g, '5 × 2 m = 10 m each second', 400, 318, { size: 32, font: 'display', color: C.sun, alpha: a });
          const b = ease.back(seg(p, 0.8, 0.98));
          if (b > 0) {
            g.save(); g.translate(400, 392); g.scale(b, b);
            g.fillStyle = C.pink; Art.round(g, -290, -38, 580, 76, 26); g.fill();
            Art.text(g, 'speed = wavelength × frequency', 0, 2, { size: 30, font: 'display', color: '#fff' });
            g.restore();
          }
        },
      },
      {
        say: 'Light is a wiggle of <b>electric and magnetic fields</b>, so it needs no water and can cross empty space. It always moves at the same speed, $c = 2.998 \\times 10^{8}$ m/s. So $c = \\lambda\\nu$.',
        dur: 4,
        draw(g, p, t, { W }) {
          const ax0 = 60, ax1 = 740, ym = 190;
          const phase = t * 0.45, lam = 220;
          const reveal = ease.inOut(seg(p, 0.05, 0.5));
          const xEnd = lerp(ax0, ax1, reveal);
          // Magnetic field: drawn in depth along a slanted direction.
          g.save(); g.lineWidth = 2;
          for (let x = ax0; x <= xEnd; x += 14) {
            const s = Math.sin(TAU * (x / lam - phase));
            g.strokeStyle = Art.alpha(C.cyan, 0.34);
            g.beginPath(); g.moveTo(x, ym); g.lineTo(x - 56 * s, ym + 62 * s); g.stroke();
            g.strokeStyle = Art.alpha(C.pink, 0.34);
            g.beginPath(); g.moveTo(x, ym); g.lineTo(x, ym - 106 * s); g.stroke();
          }
          g.restore();
          const curve = (ox, oy, col) => {
            g.strokeStyle = Art.alpha(col, 0.25); g.lineWidth = 15; g.lineCap = 'round'; g.lineJoin = 'round';
            const path = new Path2D();
            for (let x = ax0; x <= xEnd; x += 4) { const s = Math.sin(TAU * (x / lam - phase)); if (x === ax0) path.moveTo(x + ox * s, ym + oy * s); else path.lineTo(x + ox * s, ym + oy * s); }
            g.stroke(path); g.strokeStyle = col; g.lineWidth = 5; g.stroke(path);
          };
          curve(-56, 62, C.cyan);
          curve(0, -106, C.pink);
          Art.arrow(g, ax0, ym, ax1 + 30, ym, { color: '#fff', w: 5, p: reveal });
          Art.text(g, 'electric field', 170, 52, { size: 28, color: C.pink, alpha: seg(p, 0.42, 0.6), halo: true });
          Art.text(g, 'magnetic field', 170, 298, { size: 28, color: C.cyan, alpha: seg(p, 0.48, 0.66), halo: true });
          const b = ease.back(seg(p, 0.7, 0.92));
          if (b > 0) {
            g.save(); g.translate(W / 2, 382); g.scale(b, b);
            g.fillStyle = C.plum2; Art.round(g, -210, -44, 420, 88, 28); g.fill();
            g.strokeStyle = C.sun; g.lineWidth = 3; g.stroke();
            Art.text(g, 'c = λν', 0, 2, { size: 56, font: 'display', color: C.sun });
            g.restore();
          }
        },
      },
    ],
  });

  /* ---------- Bench: wave explorer ---------- */
  const wv = { nm: 520, amp: 70, shownNm: 520, shownAmp: 70, phase: 0 };
  Lab.stage('#c-wave', {
    h: 400,
    label: 'A lamp sends a colored wave to the right, through a gate that flashes for each crest. The wavelength and amplitude are marked.',
    draw(g, t, dt) {
      wv.shownNm = lerp(wv.shownNm, wv.nm, clamp(dt * 9) || 1);
      wv.shownAmp = lerp(wv.shownAmp, wv.amp, clamp(dt * 9) || 1);
      const nm = wv.shownNm, amp = wv.shownAmp;
      const scale = 0.5, lam = nm * scale; // 1 px is 2 nm on the stage.
      const col = lightColor(nm), speed = 150;
      wv.phase += (dt * speed) / lam;
      const ym = 205, x0 = 96, gx = 660;
      const vis = nm >= 380 && nm <= 750;
      const bright = amp / 100;
      // Wash of color across the stage: brighter light means a stronger wash.
      if (vis) { g.fillStyle = Art.alpha(col, 0.05 + 0.1 * bright); g.fillRect(0, 0, 800, 400); }
      g.save(); g.strokeStyle = C.line; g.lineWidth = 2; g.setLineDash([8, 9]);
      g.beginPath(); g.moveTo(x0, ym); g.lineTo(780, ym); g.stroke(); g.restore();
      g.save(); if (!vis) g.setLineDash([]);
      g.globalAlpha = vis ? 0.45 + 0.55 * bright : 0.65;
      waveLine(g, x0, 790, ym, amp * 1.25, lam, wv.phase, col, { w: 7, x00: x0 });
      g.restore();
      lamp(g, 50, ym, 0, col, vis ? bright : 0.15);
      // Gate that flashes each time a crest goes through.
      const f = ((gx - x0) / lam - wv.phase - 0.25);
      const near = Math.abs(f - Math.round(f));
      const flash = clamp(1 - near * 8);
      g.fillStyle = '#8E86A8'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
      Art.round(g, gx - 6, 58, 12, 290, 5); g.fill(); g.stroke();
      if (flash > 0) Art.glow(g, gx, 56, 62, C.sun, 0.85 * flash);
      g.fillStyle = Art.mix('#7A6E94', C.sun, flash);
      g.beginPath(); g.arc(gx, 54, 18, 0, TAU); g.fill(); g.stroke();
      // A marker that rides crest to crest, fading out before it jumps back.
      const topY = ym - amp * 1.25;
      const arrowY = Math.max(44, topY - 26);
      const kRaw = (130 - x0) / lam - 0.25 - wv.phase;
      const kMark = Math.ceil(kRaw);
      const xA = x0 + lam * (0.25 + wv.phase + kMark), xB = xA + lam;
      const fade = clamp(Math.sin(Math.PI * clamp((kMark - kRaw))) * 3.2);
      if (xB < 650) {
        g.save(); g.globalAlpha *= fade;
        g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; g.setLineDash([4, 6]);
        g.beginPath(); g.moveTo(xA, topY); g.lineTo(xA, arrowY); g.moveTo(xB, topY); g.lineTo(xB, arrowY); g.stroke();
        g.setLineDash([]);
        Art.arrow(g, xA, arrowY, xB, arrowY, { color: C.pink, w: 4, head: 11, both: true });
        g.restore();
      }
      Art.text(g, `λ = ${Math.round(wv.nm)} nm`, 28, 34, { size: 32, font: 'display', color: C.pink, align: 'left', halo: true });
      Art.text(g, `${colorName(wv.nm)}`, 28, 374, { size: 34, font: 'display', color: textColor(wv.nm), align: 'left', halo: true });
      if (!vis) Art.text(g, 'Your eyes cannot see this one', 400, 374, { size: 24, color: C.dim, halo: true });
      Art.text(g, 'Slowed about 10¹⁵ times', 772, 374, { size: 22, color: C.dim, align: 'right', halo: true, alpha: vis ? 1 : 0 });
    },
  });
  function paintWave() {
    Lab.$('#wave-freq').textContent = Lab.sig(freqHz(wv.nm), 3) + ' Hz';
    Lab.$('#wave-e').textContent = Lab.sig(photonJ(wv.nm), 3) + ' J';
  }
  Lab.bind('#wave-nm', '#wave-nm-out', (v) => v + ' nm', (v) => { wv.nm = v; paintWave(); });
  Lab.bind('#wave-amp', '#wave-amp-out', (v) => v + '%', (v) => { wv.amp = v; paintWave(); });

  /* ---------- Bench: the spectrum ---------- */
  const REGIONS = [
    { name: 'Gamma rays', short: 'Gamma', lo: -14, hi: -11, use: 'They come from atomic nuclei. Doctors use them to treat cancer, and they can break any chemical bond.' },
    { name: 'X-rays', short: 'X-ray', lo: -11, hi: -8, use: 'They pass through skin but are stopped by bone, which is why they make medical images.' },
    { name: 'Ultraviolet', short: 'UV', lo: -8, hi: Math.log10(380e-9), use: 'These photons have enough energy to break bonds in your skin cells. That is a sunburn.' },
    { name: 'Visible light', short: '', lo: Math.log10(380e-9), hi: Math.log10(750e-9), use: 'This is the tiny slice your eyes evolved to see. Atoms give off and absorb a lot of it.' },
    { name: 'Infrared', short: 'Infrared', lo: Math.log10(750e-9), hi: -3, use: 'You feel it as warmth. It makes molecules vibrate, and TV remotes send it too.' },
    { name: 'Microwaves', short: 'Microwave', lo: -3, hi: 0, use: 'They make water molecules spin, which heats your soup. Wi-Fi uses them as well.' },
    { name: 'Radio waves', short: 'Radio', lo: 0, hi: 3, use: 'The longest waves and the weakest photons. FM radio waves are about 3 m long.' },
  ];
  const LO = -13, HI = 3;
  const VLO = Math.log10(360e-9), VHI = Math.log10(770e-9);
  const spec = { x: 0.5, view: 'all', zoom: 0, logL: -6.27 };
  const bandStops = [[-14, '#E44FD0'], [-11, '#A65CFF'], [-8, '#6D5BFF'], [Math.log10(380e-9), '#7B4DFF'], [Math.log10(750e-9), '#C43A2E'], [-3, '#8E3247'], [0, '#54396F'], [3, '#2C3F73']];
  function bandColor(L) {
    const nm = Math.pow(10, L) * 1e9;
    if (nm >= 380 && nm <= 750) return lightColor(nm);
    for (let i = 0; i < bandStops.length - 1; i++) {
      const [a, ca] = bandStops[i], [b, cb] = bandStops[i + 1];
      if (L >= a && L <= b) return Art.mix(ca, cb, (L - a) / (b - a));
    }
    return '#2C3F73';
  }
  const fmtLen = (m) => {
    if (m < 1e-9) return Lab.sig(m * 1e12, 3) + ' pm';
    if (m < 1e-6) return Lab.sig(m * 1e9, 3) + ' nm';
    if (m < 1e-3) return Lab.sig(m * 1e6, 3) + ' µm';
    if (m < 1) return Lab.sig(m * 1e3, 3) + ' mm';
    if (m < 1000) return Lab.sig(m, 3) + ' m';
    return Lab.sig(m / 1000, 3) + ' km';
  };
  const regionOf = (L) => REGIONS.find((r) => L >= r.lo && L < r.hi) || (L < -11 ? REGIONS[0] : REGIONS[6]);
  const SIZES = [
    { L: -10, name: 'atom', draw: (g, x, y) => { Art.ball(g, x, y, 13, C.cyan); } },
    { L: -7, name: 'virus', draw: (g, x, y) => { g.strokeStyle = C.leaf; g.lineWidth = 3; for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; g.beginPath(); g.moveTo(x + Math.cos(a) * 11, y + Math.sin(a) * 11); g.lineTo(x + Math.cos(a) * 19, y + Math.sin(a) * 19); g.stroke(); } Art.ball(g, x, y, 12, C.leaf); } },
    { L: -5, name: 'cell', draw: (g, x, y) => { g.fillStyle = 'rgba(255,138,43,.35)'; g.strokeStyle = C.fire; g.lineWidth = 3; g.beginPath(); g.ellipse(x, y, 24, 17, 0.3, 0, TAU); g.fill(); g.stroke(); Art.ball(g, x + 3, y, 7, C.fire); } },
    { L: -3, name: 'pinhead', draw: (g, x, y) => { g.fillStyle = '#C9C7DB'; g.fillRect(x - 2, y - 6, 4, 28); Art.ball(g, x, y - 10, 11, '#C9C7DB'); } },
    { L: 0, name: 'Moe', draw: (g, x, y, t) => { Art.moe(g, x, y + 24, 56, 'happy', { t }); } },
    { L: 2, name: 'tower', draw: (g, x, y) => { g.fillStyle = '#6F6A8B'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2; g.fillRect(x - 13, y - 22, 26, 46); g.strokeRect(x - 13, y - 22, 26, 46); g.fillStyle = C.sun; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) g.fillRect(x - 8 + j * 11, y - 16 + i * 13, 5, 7); } },
  ];
  const VIS_NAMES = [[410, 'violet'], [470, 'blue'], [530, 'green'], [580, 'yellow'], [615, 'orange'], [690, 'red']];
  const bx0 = 24, bw = 752, bandY = 208, bandH = 58;
  const specLoHi = () => [lerp(LO, VLO, spec.zoom), lerp(HI, VHI, spec.zoom)];
  const specX = (L) => { const [lo, hi] = specLoHi(); return bx0 + ((L - lo) / (hi - lo)) * bw; };
  function setSpecFromX(px) {
    const [lo, hi] = specLoHi();
    spec.logL = clamp(lerp(lo, hi, clamp((px - bx0) / bw)), lo, hi);
    syncSpecSlider();
    paintSpec();
  }
  const specStage = Lab.stage('#c-spec', {
    h: 460, drag: true,
    label: 'The electromagnetic spectrum as a band from gamma rays to radio waves, with objects for scale and a draggable marker.',
    onPointer(e) {
      if (e.type === 'hover') { specStage.canvas.style.cursor = e.y > bandY - 50 && e.y < bandY + bandH + 40 ? 'ew-resize' : 'default'; return; }
      if (e.type === 'down') spec.drag = e.y > bandY - 70 && e.y < bandY + bandH + 80;
      if (e.type === 'up') { spec.drag = false; return; }
      if (spec.drag) setSpecFromX(e.x);
    },
    draw(g, t, dt) {
      const target = spec.view === 'vis' ? 1 : 0;
      spec.zoom = dt ? lerp(spec.zoom, target, clamp(dt * 4)) : target;
      if (Math.abs(spec.zoom - target) < 0.002) spec.zoom = target;
      const [lo, hi] = specLoHi();
      const L = clamp(spec.logL, lo, hi);
      const m = Math.pow(10, L), nm = m * 1e9;
      const reg = regionOf(L);
      const col = bandColor(L);
      const wide = 1 - spec.zoom;
      // Headline.
      Art.text(g, reg.name, 24, 34, { font: 'display', size: 38, align: 'left', color: nm >= 380 && nm <= 750 ? lightColor(nm) : Art.mix(col, '#ffffff', 0.45), halo: true });
      Art.text(g, fmtLen(m), 776, 34, { font: 'display', size: 38, align: 'right', color: C.sun, halo: true });
      // A sketch of the wave, not to scale in the wide view.
      const lamPx = lerp(lerp(7, 230, clamp((L + 13) / 16)), nm * 0.26, spec.zoom);
      g.save(); g.beginPath(); g.rect(0, 62, 800, 96); g.clip();
      waveLine(g, 24, 776, 110, 28, lamPx, t * (42 / lamPx), nm >= 380 && nm <= 750 ? col : Art.mix(col, '#ffffff', 0.3), { w: lamPx < 12 ? 2.6 : 5 });
      g.restore();
      // Energy arrow.
      Art.arrow(g, 250, 180, 110, 180, { color: C.sun, w: 4, head: 12, alpha: wide > 0.5 ? 1 : 1 });
      Art.text(g, 'More energy per photon', 266, 180, { size: 22, color: C.sun, align: 'left', halo: true });
      // The band, one column at a time.
      for (let x = 0; x < bw; x += 2) {
        const LL = lerp(lo, hi, x / bw);
        g.fillStyle = bandColor(LL);
        g.fillRect(bx0 + x, bandY, 2.4, bandH);
      }
      g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 3; Art.round(g, bx0, bandY, bw, bandH, 6); g.stroke();
      // Region labels inside the band.
      REGIONS.forEach((r) => {
        if (!r.short || wide < 0.5) return;
        const a = specX(Math.max(r.lo, lo)), b = specX(Math.min(r.hi, hi));
        Art.text(g, r.short, (a + b) / 2, bandY + bandH / 2 + 1, { size: r.short.length > 7 ? 20 : 22, color: '#fff', halo: true, alpha: clamp(wide * 2 - 1) });
      });
      if (wide > 0.5) {
        // Wedge from the thin visible slice out to a rainbow bar below.
        const xa = specX(REGIONS[3].lo), xb = specX(REGIONS[3].hi);
        const a = clamp(wide * 2 - 1);
        g.save(); g.globalAlpha *= a;
        const rx0 = xa - 150, rx1 = xa + 150, ry = 300;
        g.fillStyle = 'rgba(255,255,255,.08)';
        g.beginPath(); g.moveTo(xa, bandY + bandH); g.lineTo(xb, bandY + bandH); g.lineTo(rx1, ry); g.lineTo(rx0, ry); g.closePath(); g.fill();
        for (let x = 0; x < rx1 - rx0; x += 2) { g.fillStyle = lightColor(lerp(380, 750, x / (rx1 - rx0))); g.fillRect(rx0 + x, ry, 2.5, 22); }
        g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 2.5; g.strokeRect(rx0, ry, rx1 - rx0, 22);
        g.restore();
        Art.text(g, 'Visible light', xa, 340, { size: 24, color: '#fff', alpha: a, halo: true });
        // Things this big.
        Art.text(g, 'As long as:', 24, 346, { size: 22, color: C.dim, alpha: a, align: 'left' });
        SIZES.forEach((s) => {
          const x = specX(s.L);
          g.save(); g.globalAlpha *= a;
          g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 2; g.setLineDash([3, 5]);
          g.beginPath(); g.moveTo(x, bandY + bandH); g.lineTo(x, s.L === -7 ? 280 : 380); g.stroke(); g.setLineDash([]);
          s.draw(g, x, 400, t);
          g.restore();
          Art.text(g, s.name, x, 442, { size: 22, alpha: a });
        });
      } else {
        // Color names under the zoomed band, and a nm ruler.
        const a = clamp(spec.zoom * 2 - 1);
        for (let w = 400; w <= 750; w += 50) {
          const x = specX(Math.log10(w * 1e-9));
          g.fillStyle = Art.alpha('#ffffff', 0.8 * a); g.fillRect(x - 1, bandY + bandH, 2.4, 10);
          if (w % 100 === 0) Art.text(g, w + ' nm', x, bandY + bandH + 28, { size: 22, alpha: a });
        }
        VIS_NAMES.forEach(([w, name], i) => {
          const x = specX(Math.log10(w * 1e-9));
          const by = i % 2 ? 402 : 342, col = lightColor(w);
          g.save(); g.globalAlpha *= a;
          g.strokeStyle = Art.alpha(col, 0.5); g.lineWidth = 2; g.setLineDash([3, 5]);
          g.beginPath(); g.moveTo(x, bandY + bandH + 34); g.lineTo(x, by - 16); g.stroke(); g.setLineDash([]);
          Art.glow(g, x, by, 30, col, 0.75); Art.ball(g, x, by, 14, col); g.restore();
          Art.text(g, name, x, by + 32, { size: 26, font: 'display', color: textColor(w), alpha: a, halo: true });
        });
      }
      // The marker.
      const mx = specX(L);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(mx - 4, bandY - 12, 8, bandH + 24);
      g.fillStyle = '#fff'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
      Art.round(g, mx - 5, bandY - 12, 10, bandH + 24, 4); g.fill(); g.stroke();
      g.fillStyle = C.pink; g.beginPath(); g.arc(mx, bandY + bandH / 2, 9, 0, TAU); g.fill(); g.stroke();
    },
  });
  function sliderToL(v) { const [lo, hi] = spec.view === 'vis' ? [VLO, VHI] : [LO, HI]; return lerp(lo, hi, v / 1000); }
  function syncSpecSlider() {
    const [lo, hi] = spec.view === 'vis' ? [VLO, VHI] : [LO, HI];
    const inp = Lab.$('#spec-x');
    inp.value = Math.round(((spec.logL - lo) / (hi - lo)) * 1000);
    Lab.paintRange(inp);
  }
  function paintSpec() {
    const m = Math.pow(10, spec.logL);
    const nu = c / m, E = h * nu;
    Lab.$('#spec-x-out').textContent = fmtLen(m);
    Lab.$('#spec-freq').textContent = Lab.sig(nu, 3) + ' Hz';
    Lab.$('#spec-e').textContent = Lab.sig(E, 3) + ' J';
    const kJ = (E * NA) / 1000;
    Lab.$('#spec-m').textContent = Lab.sig(kJ, 3) + ' kJ/mol';
    const r = regionOf(spec.logL);
    const compare = kJ > 350 ? 'More than a typical C–C bond (about 350 kJ/mol), so a photon like this can break one.' : 'Less than a typical C–C bond (about 350 kJ/mol), so a photon like this cannot break one.';
    Lab.$('#spec-foot').innerHTML = `<p><b>${r.name}.</b> ${r.use} ${compare} Region boundaries are approximate.</p>`;
  }
  Lab.segmented('#spec-view', (v) => {
    spec.view = v;
    if (v === 'vis') spec.logL = clamp(spec.logL, Math.log10(380e-9), Math.log10(750e-9));
    if (v === 'vis' && (spec.logL <= Math.log10(380e-9) || spec.logL >= Math.log10(750e-9))) spec.logL = Math.log10(530e-9);
    syncSpecSlider(); paintSpec();
    specStage.redraw();
  });
  Lab.$('#spec-x').addEventListener('input', (e) => { spec.logL = sliderToL(+e.target.value); paintSpec(); specStage.redraw(); });
  spec.logL = Math.log10(530e-9);
  syncSpecSlider();
  paintSpec();

  /* ---------- Story 2: photons ---------- */
  function energyBar(g, x, y, w, frac, col, label, value, a = 1) {
    g.save(); g.globalAlpha *= a;
    Art.text(g, label, x, y - 24, { size: 26, align: 'left', color: Art.mix(col, '#ffffff', 0.4) });
    Art.text(g, value, x + w, y - 24, { size: 26, align: 'right', font: 'display', color: C.sun });
    Art.meter(g, x, y, w, 26, frac, { color: col });
    g.restore();
  }
  Lab.story('#story-photon', {
    title: 'Light comes in packets',
    scenes: [
      {
        say: 'A ball on a ramp can stop at any height. A ball on stairs can only rest on a step. In 1900, Max Planck found that energy behaves like the stairs. It comes in fixed steps called <b>quanta</b>.',
        dur: 4,
        draw(g, p, t) {
          const groundY = 372;
          const shape = (x0, x1, top) => {
            const gr = g.createLinearGradient(0, top, 0, groundY);
            gr.addColorStop(0, '#8D6BD8'); gr.addColorStop(1, '#4B3288');
            g.fillStyle = gr;
            g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
          };
          // Ramp.
          shape(50, 370, 130);
          g.beginPath(); g.moveTo(50, groundY); g.lineTo(370, 130); g.lineTo(370, groundY); g.closePath(); g.fill(); g.stroke();
          // Stairs.
          shape(430, 750, 130);
          g.beginPath(); g.moveTo(430, groundY);
          const steps = 4, sw = 80, sh = (groundY - 130) / steps;
          for (let i = 0; i < steps; i++) { g.lineTo(430 + i * sw, groundY - (i + 1) * sh); g.lineTo(430 + (i + 1) * sw, groundY - (i + 1) * sh); }
          g.lineTo(750, groundY); g.closePath(); g.fill(); g.stroke();
          const u = (Math.sin(t * 1.1) + 1) / 2;
          // Ball rolling smoothly.
          const bx = lerp(90, 342, u), by = groundY - (bx - 50) * ((groundY - 130) / 320);
          Art.atom(g, bx - 14, by - 22, 24, 'O', { label: false, face: 'happy', t, color: C.sun });
          // Ball hopping between steps.
          const raw = u * (steps - 1), k = Math.floor(raw), f = raw - k;
          const hop = ease.inOut(clamp((f - 0.72) / 0.28));
          const stepAt = (i) => [430 + (i + 0.5) * sw, groundY - (i + 1) * sh];
          const A = stepAt(k), B = stepAt(Math.min(steps - 1, k + 1));
          const sx = lerp(A[0], B[0], hop), sy = lerp(A[1], B[1], hop) - Math.sin(hop * Math.PI) * 32;
          Art.atom(g, sx, sy - 24, 24, 'O', { label: false, face: 'happy', t, color: C.cyan });
          Art.text(g, 'Any height at all', 210, 60, { size: 32, font: 'display', color: C.sun });
          Art.text(g, 'Only certain heights', 590, 60, { size: 32, font: 'display', color: C.cyan, alpha: seg(p, 0.25, 0.5) });
          Art.text(g, 'What physics expected', 210, 412, { size: 26, color: C.dim });
          Art.text(g, 'What energy really does', 590, 412, { size: 26, color: C.ink, alpha: seg(p, 0.5, 0.8) });
        },
      },
      {
        say: 'Light works the same way. It arrives as tiny packets called <b>photons</b>. Each one is a little bundle of wave, and it either lands whole or not at all.',
        dur: 3.4,
        draw(g, p, t) {
          lamp(g, 62, 280, 0, lightColor(520), 1);
          const n = 7;
          for (let i = 0; i < n; i++) {
            const ph = (i / n + t * 0.17) % 1;
            const x = lerp(120, 830, ph);
            const y = 280 + (rand(i + 1) - 0.5) * 130;
            const alpha = seg(p, 0.05 + i * 0.05, 0.2 + i * 0.05);
            photon(g, x, y, 520, { len: 110, amp: 26, phase: t * 8, lam: 30, alpha, w: 6 });
          }
          Art.pill(g, 'one photon', 500, 62, { size: 30, color: C.pink, alpha: seg(p, 0.55, 0.75), font: 'display', text: '#fff' });
          const a = seg(p, 0.6, 0.8);
          photon(g, 500, 130, 520, { len: 170, amp: 36, phase: t * 8, lam: 44, alpha: a, w: 8 });
          Art.text(g, 'A photon is one packet of light energy', 400, 414, { size: 30, alpha: seg(p, 0.75, 0.95), halo: true });
        },
      },
      {
        say: 'A photon\'s energy depends on its frequency: $E = h\\nu$. The number $h$ is <b>Planck\'s constant</b>. A violet photon has much more energy than a red one.',
        dur: 4,
        draw(g, p, t) {
          const rows = [{ nm: 700, y: 118, name: 'Red, 700 nm' }, { nm: 400, y: 274, name: 'Violet, 400 nm' }];
          rows.forEach((r, i) => {
            const a = seg(p, 0.08 + i * 0.3, 0.26 + i * 0.3);
            const col = lightColor(r.nm);
            photon(g, 110, r.y, r.nm, { len: 150, amp: 40, lam: r.nm * 0.066, phase: t * 7, alpha: a, w: 7 });
            const E = photonJ(r.nm);
            const grow = ease.out(seg(p, 0.14 + i * 0.3, 0.36 + i * 0.3));
            energyBar(g, 240, r.y, 500, (E / 5.5e-19) * grow, col, r.name, Lab.sig(E, 3) + ' J', a);
          });
          const b = ease.back(seg(p, 0.76, 0.96));
          if (b > 0) {
            g.save(); g.translate(400, 384); g.scale(b, b);
            g.fillStyle = C.pink; Art.round(g, -320, -38, 640, 76, 26); g.fill();
            Art.text(g, 'E = hν', -180, 2, { size: 44, font: 'display', color: '#fff' });
            Art.text(g, 'h = 6.626 × 10⁻³⁴ J·s', 110, 2, { size: 30, color: '#fff' });
            g.restore();
          }
        },
      },
      {
        say: 'One photon has almost no energy, but chemists count by the mole. A mole of photons is comparable to a mole of <b>chemical bonds</b>. That is why ultraviolet light can burn skin and red light cannot.',
        dur: 4.4,
        draw(g, p) {
          const kj = (nm) => (photonJ(nm) * NA) / 1000;
          const list = [{ nm: 700, name: 'Red' }, { nm: 550, name: 'Green' }, { nm: 400, name: 'Violet' }, { nm: 300, name: 'UV' }];
          const base = 366, hScale = 260 / 450, xs = [134, 290, 446, 602];
          // The bond line.
          const bondY = base - 350 * hScale;
          list.forEach((r, i) => {
            const E = kj(r.nm);
            const q = ease.out(seg(p, 0.08 + i * 0.13, 0.28 + i * 0.13));
            const bh = E * hScale * q;
            const col = lightColor(r.nm);
            const gr = g.createLinearGradient(0, base - bh, 0, base);
            gr.addColorStop(0, Art.mix(col, '#ffffff', 0.2)); gr.addColorStop(1, Art.mix(col, '#1A0F2E', 0.35));
            g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
            Art.round(g, xs[i] - 48, base - bh, 96, bh, 10); g.fill(); g.stroke();
            Art.text(g, r.name, xs[i], base + 26, { size: 26 });
            Art.text(g, String(Math.round(E)), xs[i], base - bh + 28, { font: 'display', size: 32, color: '#fff', alpha: q, halo: true });
          });
          const a = seg(p, 0.66, 0.84);
          g.save(); g.globalAlpha *= a; g.strokeStyle = C.red; g.lineWidth = 5; g.setLineDash([12, 10]);
          g.beginPath(); g.moveTo(66, bondY); g.lineTo(694, bondY); g.stroke(); g.restore();
          Art.text(g, 'C–C bond', 696, bondY - 16, { size: 22, color: C.red, alpha: a, halo: true });
          Art.text(g, 'about 350', 696, bondY + 16, { size: 22, color: C.red, alpha: a, halo: true });
          Art.text(g, 'Energy per mole of photons, in kJ/mol', 400, 36, { size: 28, font: 'display' });
          Art.text(g, 'Only the UV photon can break it.', 400, 426, { size: 26, color: C.leaf, alpha: seg(p, 0.84, 1), halo: true });
        },
      },
      {
        say: '<b>Brightness</b> is how many photons arrive each second. A bright lamp sends more packets, but each packet has the same energy as one from a dim lamp of that color.',
        dur: 3.6,
        draw(g, p, t) {
          const nm = 520, col = lightColor(nm);
          const row = (y, n, label, seed) => {
            lamp(g, 60, y, 0, col, n > 6 ? 1 : 0.35);
            for (let i = 0; i < n; i++) {
              const ph = (rand(i + seed) + t * 0.2) % 1;
              const x = lerp(116, 790, ph);
              const yy = y + (rand(i * 3 + seed) - 0.5) * 84;
              photon(g, x, yy, nm, { len: 64, amp: 13, lam: 18, phase: t * 8, alpha: seg(p, 0.05, 0.3), w: 4 });
            }
            Art.text(g, label, 116, y - 66, { size: 28, font: 'display', align: 'left', halo: true });
          };
          row(118, 3, 'Dim lamp: a few photons', 3);
          row(306, 16, 'Bright lamp: many photons', 9);
          Art.text(g, 'Same color means the same energy per photon', 400, 416, { size: 28, color: C.sun, alpha: seg(p, 0.6, 0.9), halo: true });
        },
      },
    ],
  });

  /* ---------- Story 3: the photoelectric effect ---------- */
  /** A simple drawing of the apparatus. Shared by the story scenes. */
  function apparatus(g, o = {}) {
    const y0 = o.y0 || 180, y1 = o.y1 || 340, xL = 170, xR = 650;
    g.strokeStyle = '#D9D1EC'; g.lineWidth = 5; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(xL, y1 - 20); g.lineTo(xL, 406); g.lineTo(xR, 406); g.lineTo(xR, y1 - 20); g.stroke();
    // Tube.
    g.fillStyle = 'rgba(214,240,255,.07)'; g.strokeStyle = C.glass; g.lineWidth = 4;
    Art.round(g, 110, y0 - 24, 600, y1 - y0 + 48, 54); g.fill(); g.stroke();
    // Metal plate and collector.
    const plate = g.createLinearGradient(xL - 16, 0, xL + 16, 0);
    plate.addColorStop(0, '#6F7482'); plate.addColorStop(0.5, '#E2E6EE'); plate.addColorStop(1, '#8F95A3');
    g.fillStyle = plate; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    Art.round(g, xL - 16, y0, 32, y1 - y0, 6); g.fill(); g.stroke();
    g.fillStyle = '#8F8DA6'; Art.round(g, xR - 8, y0, 16, y1 - y0, 5); g.fill(); g.stroke();
    // Current meter.
    g.fillStyle = '#F4F0FF'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    g.beginPath(); g.arc(410, 406, 34, 0, TAU); g.fill(); g.stroke();
    const needle = -Math.PI / 2 - 0.9 + 1.8 * clamp(o.current || 0);
    g.strokeStyle = C.red; g.lineWidth = 4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(410, 416); g.lineTo(410 + Math.cos(needle) * 28, 416 + Math.sin(needle) * 28); g.stroke();
    return { xL, xR, y0, y1 };
  }
  /** Photons arcing from a lamp to the plate. Pure in t. */
  function beam(g, n, nm, t, plateX, y0, y1) {
    const col = lightColor(nm);
    g.fillStyle = Art.alpha(col, 0.13);
    g.beginPath(); g.moveTo(420, 96); g.lineTo(plateX + 16, y0); g.lineTo(plateX + 16, y1); g.closePath(); g.fill();
    const ang = Math.atan2(240 - 96, plateX - 420);
    for (let i = 0; i < n; i++) {
      const ph = ((i * 0.618) + t * 0.65) % 1;
      const ty = lerp(y0 + 10, y1 - 10, rand(i * 2 + 3));
      photon(g, lerp(420, plateX + 22, ph), lerp(96, ty, ph), nm, { ang, len: 56, amp: 11, lam: nm * 0.03, phase: t * 9, w: 3.5 });
    }
    lamp(g, 448, 70, Math.atan2(240 - 70, plateX - 448), col, 1);
  }
  Lab.story('#story-pe', {
    title: 'The experiment that broke the wave idea',
    scenes: [
      {
        say: 'First, the parts. A clean <b>metal plate</b> sits in a glass tube with no air. A <b>collector</b> waits across the gap, and a <b>meter</b> reads any current. A lamp shines on the plate.',
        dur: 3.8,
        draw(g, p, t) {
          const ap = apparatus(g, {});
          lamp(g, 448, 70, Math.atan2(170, -278), lightColor(560), seg(p, 0.75, 0.9));
          const lab = (s, x, y, a) => Art.pill(g, s, x, y, { size: 26, color: C.plum2, text: C.sun, alpha: a, stroke: C.sun });
          lab('metal plate', 170, 130, seg(p, 0.05, 0.22));
          lab('collector', 650, 130, seg(p, 0.28, 0.45));
          lab('current meter', 590, 410, seg(p, 0.5, 0.65));
          lab('lamp', 590, 58, seg(p, 0.72, 0.88));
          for (let i = 0; i < 6; i++) Art.electron(g, ap.xL + 20 + wander(i, t) * 1.4, ap.y0 + 14 + i * 26, 8);
        },
      },
      {
        say: 'If light were only a wave, a brighter wave should shake electrons loose. So use a <b>very bright red</b> lamp on sodium. Nothing comes out. The meter sits at zero. Physicists were baffled.',
        dur: 3.8,
        draw(g, p, t) {
          const ap = apparatus(g, { current: 0 });
          beam(g, 14, 680, t, ap.xL, ap.y0, ap.y1);
          for (let i = 0; i < 6; i++) Art.electron(g, ap.xL + 20 + Math.sin(t * 24 + i) * 2.6, ap.y0 + 14 + i * 26, 8);
          Art.text(g, 'Very bright, red', 240, 56, { size: 32, font: 'display', color: textColor(680), halo: true });
          const a = ease.back(seg(p, 0.5, 0.75));
          if (a > 0) {
            g.save(); g.translate(440, 258); g.scale(a, a);
            Art.text(g, 'No electrons!', 0, 0, { size: 42, font: 'display', color: C.red, halo: true });
            g.restore();
          }
          Art.moe(g, 730, 448, 90, 'oops', { t });
        },
      },
      {
        say: 'Now try a <b>dim violet</b> lamp. Electrons fly out right away, even from this weak light. The color matters more than the brightness.',
        dur: 3.8,
        draw(g, p, t) {
          const ap = apparatus(g, { current: 0.55 * seg(p, 0.15, 0.4) });
          beam(g, 3, 405, t, ap.xL, ap.y0, ap.y1);
          for (let i = 0; i < 6; i++) {
            const ph = (i / 6 + t * 0.55) % 1;
            const on = p > 0.1;
            const y = lerp(ap.y0 + 14 + i * 26, 258 + (i - 2.5) * 20, ph);
            if (on) Art.electron(g, lerp(ap.xL + 22, ap.xR - 12, ph), y, 9);
          }
          Art.text(g, 'Dim, violet', 240, 56, { size: 32, font: 'display', color: textColor(405), halo: true });
          Art.text(g, 'Electrons!', 620, 110, { size: 38, font: 'display', color: C.leaf, alpha: seg(p, 0.2, 0.45), halo: true });
        },
      },
      {
        say: 'Einstein explained it in 1905. <b>One photon gives its energy to one electron</b>, all at once. The electron sits in a pit. If one photon cannot lift it out, it falls back, however many photons try.',
        dur: 5,
        draw(g, p, t) {
          const pit = (cx, nm, name, kick, ok) => {
            const top = 150, depth = 170;
            const ground = g.createLinearGradient(0, top, 0, top + depth + 60);
            ground.addColorStop(0, '#6F7482'); ground.addColorStop(1, '#3A3F4D');
            g.fillStyle = ground; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
            g.beginPath(); g.moveTo(cx - 180, top); g.lineTo(cx - 55, top); g.lineTo(cx - 55, top + depth); g.lineTo(cx + 55, top + depth); g.lineTo(cx + 55, top); g.lineTo(cx + 180, top); g.lineTo(cx + 180, top + depth + 60); g.lineTo(cx - 180, top + depth + 60); g.closePath(); g.fill(); g.stroke();
            const bottom = top + depth - 15;
            Art.arrow(g, cx - 76, top + depth - 4, cx - 76, top + 4, { color: C.sun, w: 4, head: 11, both: true });
            Art.text(g, 'escape cost', cx - 112, top + depth + 28, { size: 22, color: C.sun });
            const cyc = (t * 0.6) % 1;
            const inP = seg(cyc, 0, 0.3);
            const col = lightColor(nm);
            // Photon arrives.
            if (inP < 1) photon(g, lerp(cx - 200, cx, inP), lerp(40, bottom, inP), nm, { ang: Math.atan2(bottom - 40, 200), len: 70, amp: 15, lam: nm * 0.035, phase: t * 9, alpha: 1 - inP * 0.3 });
            const up = seg(cyc, 0.3, 0.62), dn = seg(cyc, 0.62, 0.92);
            let ey = bottom, ex = cx;
            if (ok) {
              ey = bottom - (bottom - top + 50) * ease.out(up);
              ex = cx + 130 * ease.inOut(seg(cyc, 0.5, 1));
            } else {
              ey = bottom - kick * Math.sin(Math.PI * clamp(up * 0.5 + dn * 0.5));
            }
            if (cyc > 0.3) Art.glow(g, ex, ey, 34, col, 0.5);
            Art.electron(g, ex, ey, 15);
            Art.text(g, name, cx, 52, { size: 32, font: 'display', color: textColor(nm), halo: true });
            const kickH = ok ? depth + 44 : kick;
            Art.arrow(g, cx + 76, top + depth - 4, cx + 76, top + depth - 4 - kickH, { color: textColor(nm), w: 5, head: 12 });
            Art.text(g, 'one kick', cx + 118, top + depth + 28, { size: 22, color: textColor(nm) });
          };
          pit(210, 680, 'Red photon', 96, false);
          pit(590, 405, 'Violet photon', 0, true);
          Art.text(g, 'Falls back', 210, 410, { size: 28, font: 'display', color: C.red, alpha: seg(p, 0.45, 0.65) });
          Art.text(g, 'Escapes', 590, 410, { size: 28, font: 'display', color: C.leaf, alpha: seg(p, 0.45, 0.65) });
        },
      },
      {
        say: 'The energy needed to escape is the <b>work function</b>, $\\phi$. Any extra becomes speed: $KE = h\\nu - \\phi$. The lowest frequency that works is the <b>threshold frequency</b>, $\\nu_0$.',
        dur: 4.6,
        draw(g, p) {
          const ox = 110, oy = 372, gw = 620, gh = 280;
          const nuMax = 12, keMax = 3.2;
          const X = (nu) => ox + (nu / nuMax) * gw;
          const Y = (ke) => oy - (ke / keMax) * gh;
          g.strokeStyle = C.ink; g.lineWidth = 4; g.lineCap = 'round';
          g.beginPath(); g.moveTo(ox, oy - gh - 14); g.lineTo(ox, oy); g.lineTo(ox + gw + 14, oy); g.stroke();
          Art.text(g, 'KE of the electrons', 268, 58, { size: 26, color: C.cyan });
          Art.text(g, 'Frequency of the light', ox + gw, oy + 26, { size: 26, align: 'right' });
          const phi = 2.3, nu0 = ((phi * eV) / h) / 1e14;
          const draw = ease.inOut(seg(p, 0.1, 0.62));
          g.strokeStyle = C.red; g.lineWidth = 7;
          g.beginPath(); g.moveTo(ox, oy); g.lineTo(X(Math.min(nu0, nuMax * draw)), oy); g.stroke();
          if (nuMax * draw > nu0) {
            const end = nuMax * draw;
            g.strokeStyle = C.leaf;
            g.beginPath(); g.moveTo(X(nu0), Y(0)); g.lineTo(X(end), Y((h * end * 1e14) / eV - phi)); g.stroke();
          }
          const a = seg(p, 0.42, 0.56);
          Art.ring(g, X(nu0), oy, 16, { color: C.sun, p: a });
          Art.text(g, 'threshold ν₀', X(nu0), oy + 54, { size: 26, color: C.sun, alpha: a, align: 'center' });
          Art.text(g, 'No electrons', ox + 150, oy - 34, { size: 26, color: C.red, alpha: seg(p, 0.15, 0.3) });
          Art.text(g, 'Sodium', ox + gw - 30, 112, { size: 26, color: C.leaf, align: 'right', alpha: seg(p, 0.6, 0.72) });
          const b = ease.back(seg(p, 0.72, 0.95));
          if (b > 0) {
            g.save(); g.translate(330, 136); g.scale(b, b);
            g.fillStyle = C.pink; Art.round(g, -150, -34, 300, 68, 22); g.fill();
            Art.text(g, 'KE = hν − φ', 0, 2, { size: 36, font: 'display', color: '#fff' });
            g.restore();
          }
        },
      },
    ],
  });

  /* ---------- Bench: the photoelectric lab ---------- */
  const METALS = {
    Cs: { name: 'Cesium', phi: 2.1 }, Na: { name: 'Sodium', phi: 2.3 }, Zn: { name: 'Zinc', phi: 4.3 }, Pt: { name: 'Platinum', phi: 5.6 },
    X: { name: 'Mystery metal', phi: 3.3 },
  };
  const pe = { metal: 'Na', nm: 650, rate: 7, photons: [], electrons: [], flashes: [], spawn: 0, I: 0, solved: false };
  const newMystery = () => { METALS.X.phi = Math.round((2.4 + Math.random() * 2.6) * 20) / 20; };
  newMystery();
  const plateX = 92, collX = 446, tubeY0 = 178, tubeY1 = 332;
  const lampPos = [212, 60];
  const peStage = Lab.stage('#c-pe', {
    h: 470,
    label: 'A lamp shines photons on a metal plate in a vacuum tube. Electrons fly to a collector if the photons have enough energy. A meter reads the current and a graph plots kinetic energy against frequency.',
    draw(g, t, dt) {
      const m = METALS[pe.metal];
      const E = photonEV(pe.nm), phi = m.phi;
      const can = E > phi;
      const col = lightColor(pe.nm);
      const ang = Math.atan2(255 - lampPos[1], plateX - lampPos[0]);
      // Spawn photons.
      pe.spawn += dt * pe.rate * 1.6;
      while (pe.spawn >= 1) {
        pe.spawn -= 1;
        pe.photons.push({ u: 0, y: lerp(tubeY0 + 12, tubeY1 - 12, Math.random()), ph: Math.random() * 6 });
      }
      // Tube and wires.
      g.strokeStyle = '#D9D1EC'; g.lineWidth = 5; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(plateX, tubeY1); g.lineTo(plateX, 412); g.lineTo(collX, 412); g.lineTo(collX, tubeY1); g.stroke();
      g.fillStyle = 'rgba(214,240,255,.07)'; g.strokeStyle = C.glass; g.lineWidth = 4;
      Art.round(g, 40, tubeY0 - 26, 462, tubeY1 - tubeY0 + 52, 50); g.fill(); g.stroke();
      // Beam.
      if (pe.rate > 0) {
        g.fillStyle = Art.alpha(col, 0.03 + 0.016 * pe.rate);
        g.beginPath(); g.moveTo(lampPos[0], lampPos[1]); g.lineTo(plateX + 15, tubeY0); g.lineTo(plateX + 15, tubeY1); g.closePath(); g.fill();
      }
      // Metal plate.
      const mc = { Cs: '#E9D9A0', Na: '#D6DAE3', Zn: '#A9B4C2', Pt: '#E8E8EE', X: '#9BA3B5' }[pe.metal];
      const pl = g.createLinearGradient(plateX - 16, 0, plateX + 16, 0);
      pl.addColorStop(0, Art.mix(mc, '#1A0F2E', 0.45)); pl.addColorStop(0.5, Art.mix(mc, '#ffffff', 0.45)); pl.addColorStop(1, Art.mix(mc, '#1A0F2E', 0.2));
      g.fillStyle = pl; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
      Art.round(g, plateX - 15, tubeY0, 30, tubeY1 - tubeY0, 6); g.fill(); g.stroke();
      g.fillStyle = '#8F8DA6'; Art.round(g, collX - 7, tubeY0, 14, tubeY1 - tubeY0, 5); g.fill(); g.stroke();
      // Electrons waiting in the surface.
      const shake = clamp(pe.rate / 10) * 2.8;
      for (let i = 0; i < 6; i++) Art.electron(g, plateX + 8 + Math.sin(t * 22 + i * 1.7) * shake, tubeY0 + 16 + (i * (tubeY1 - tubeY0 - 32)) / 5, 7);
      // Photons.
      pe.photons = pe.photons.filter((ph) => {
        ph.u += dt * 1.25;
        const x = lerp(lampPos[0], plateX + 18, ph.u), y = lerp(lampPos[1], ph.y, ph.u);
        if (ph.u >= 1) {
          pe.flashes.push({ x: plateX + 18, y: ph.y, u: 0, ok: can });
          if (can) {
            const KE = E - phi;
            pe.electrons.push({ x: plateX + 18, y: ph.y, vx: 90 + 170 * Math.sqrt(KE), vy: (Math.random() - 0.5) * 18, trail: [] });
          }
          return false;
        }
        photon(g, x, y, pe.nm, { ang: Math.atan2(ph.y - lampPos[1], plateX - lampPos[0]), len: 52, amp: 10, lam: clamp(pe.nm * 0.03, 8, 22), phase: t * 9 + ph.ph, w: 3.2 });
        return true;
      });
      // Flashes at the plate.
      pe.flashes = pe.flashes.filter((f) => {
        f.u += dt * 3.2;
        if (f.u >= 1) return false;
        Art.glow(g, f.x, f.y, 26 + f.u * 16, f.ok ? C.sun : col, 0.8 * (1 - f.u));
        return true;
      });
      // Freed electrons.
      pe.electrons = pe.electrons.filter((el) => {
        el.x += el.vx * dt; el.y += el.vy * dt;
        g.strokeStyle = 'rgba(53,230,255,.25)'; g.lineWidth = 5; g.lineCap = 'round';
        g.beginPath(); g.moveTo(el.x - el.vx * 0.09, el.y - el.vy * 0.09); g.lineTo(el.x, el.y); g.stroke();
        Art.electron(g, el.x, el.y, 9);
        return el.x < collX - 8;
      });
      // Current meter.
      const target = can ? pe.rate / 10 : 0;
      pe.I = dt ? lerp(pe.I, target, clamp(dt * 2.6)) : target;
      const mX = 268, mY = 412;
      g.fillStyle = '#F4F0FF'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
      g.beginPath(); g.arc(mX, mY, 38, 0, TAU); g.fill(); g.stroke();
      const needle = -Math.PI / 2 - 1 + 2 * pe.I;
      g.strokeStyle = C.red; g.lineWidth = 4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(mX, mY + 12); g.lineTo(mX + Math.cos(needle) * 32, mY + 12 + Math.sin(needle) * 32); g.stroke();
      Art.text(g, 'current', 372, 437, { size: 24, color: pe.I > 0.02 ? C.leaf : C.dim });
      // Lamp.
      lamp(g, lampPos[0] + 22 * Math.cos(ang + Math.PI), lampPos[1] + 22 * Math.sin(ang + Math.PI), ang, col, pe.rate > 0 ? 0.3 + pe.rate * 0.07 : 0);
      Art.text(g, pe.nm < 380 ? 'Invisible UV' : colorName(pe.nm), 24, 34, { size: 26, font: 'display', color: textColor(pe.nm), align: 'left', halo: true });
      // Energy bars: the kid-level picture of the whole experiment.
      const bx = 298, by = 34, bH = 16;
      const barW = 200 / 7;
      const Ecap = Math.min(E, 7);
      Art.text(g, `photon ${E.toFixed(2)} eV`, bx, by - 16, { size: 22, align: 'left', color: textColor(pe.nm) });
      g.fillStyle = 'rgba(255,255,255,.12)'; Art.round(g, bx, by, 200, bH, 8); g.fill();
      g.fillStyle = col; Art.round(g, bx, by, Math.max(8, Ecap * barW), bH, 8); g.fill();
      if (can) { g.fillStyle = C.leaf; Art.round(g, bx + phi * barW, by, Math.max(4, (Ecap - phi) * barW), bH, 8); g.fill(); }
      Art.text(g, pe.metal === 'X' && !pe.solved ? 'escape cost ?' : `escape cost ${phi.toFixed(2)} eV`, bx, by + 38, { size: 22, align: 'left', color: C.sun });
      g.fillStyle = 'rgba(255,255,255,.12)'; Art.round(g, bx, by + 54, 200, bH, 8); g.fill();
      if (!(pe.metal === 'X' && !pe.solved)) { g.fillStyle = C.sun; Art.round(g, bx, by + 54, phi * barW, bH, 8); g.fill(); }
      if (can) Art.text(g, pe.metal === 'X' && !pe.solved ? 'Left over: speed' : `Left over: ${(E - phi).toFixed(2)} eV`, bx, by + 92, { size: 22, align: 'left', color: C.leaf });
      if (!can && pe.rate > 0) Art.text(g, 'Photon too weak', 268, 255, { size: 30, font: 'display', color: C.red, halo: true });
      if (pe.rate === 0) Art.text(g, 'Lamp is off', 268, 255, { size: 30, font: 'display', color: C.dim, halo: true });
      // Graph.
      g.fillStyle = 'rgba(26,15,46,.72)'; Art.round(g, 516, 14, 272, 442, 18); g.fill();
      const ox = 566, oy = 372, gw = 206, gh = 300, nuMax = 17, keMax = 5;
      const X = (nu) => ox + (nu / nuMax) * gw, Y = (ke) => oy - (ke / keMax) * gh;
      Art.text(g, 'KE in eV', ox - 28, 44, { size: 22, align: 'left', color: C.cyan });
      g.strokeStyle = C.ink; g.lineWidth = 3;
      g.beginPath(); g.moveTo(ox, oy - gh - 4); g.lineTo(ox, oy); g.lineTo(ox + gw + 6, oy); g.stroke();
      for (let k = 1; k <= 4; k++) { g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(ox - 6, Y(k) - 1, 6, 2.4); Art.text(g, String(k), ox - 22, Y(k), { size: 22, color: C.dim }); }
      const hEV = h / eV;
      const nu0 = (phi / hEV) / 1e14;
      g.strokeStyle = C.red; g.lineWidth = 6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(ox, oy); g.lineTo(X(Math.min(nu0, nuMax)), oy); g.stroke();
      if (nu0 < nuMax) {
        g.strokeStyle = C.leaf;
        const nuEnd = Math.min(nuMax, nu0 + (keMax / hEV) / 1e14);
        g.beginPath(); g.moveTo(X(nu0), oy); g.lineTo(X(nuEnd), Y(hEV * (nuEnd * 1e14) - phi)); g.stroke();
      }
      const nuNow = freqHz(pe.nm) / 1e14, keNow = Math.max(0, E - phi);
      g.fillStyle = C.sun; g.fillRect(X(nu0) - 1.5, oy, 3, 10);
      Art.text(g, 'ν₀', X(nu0), oy + 26, { size: 24, color: C.sun });
      Art.text(g, 'frequency', ox + gw / 2, oy + 58, { size: 22 });
      Art.glow(g, X(Math.min(nuNow, nuMax)), Y(Math.min(keNow, keMax)), 24, col, 0.9);
      Art.ball(g, X(Math.min(nuNow, nuMax)), Y(Math.min(keNow, keMax)), 10, pe.nm < 380 ? '#C9B6FF' : col);
    },
  });
  function paintPE() {
    const m = METALS[pe.metal];
    const E = photonEV(pe.nm), phi = m.phi;
    const hide = pe.metal === 'X' && !pe.solved;
    Lab.$('#pe-e').textContent = E.toFixed(2) + ' eV';
    Lab.$('#pe-phi').textContent = hide ? '?' : phi.toFixed(2) + ' eV';
    Lab.$('#pe-ke').textContent = E > phi ? (hide ? 'flying' : (E - phi).toFixed(2) + ' eV') : 'no electrons';
    Lab.$('#pe-quest').hidden = pe.metal !== 'X';
    const lam0 = Math.round((h * c) / (phi * eV) * 1e9);
    let msg;
    if (pe.metal === 'X') msg = 'A mystery metal has a hidden work function. Find its threshold wavelength by hunting with the slider.';
    else if (E > phi) msg = `<b>Electrons fly.</b> Each photon brings ${E.toFixed(2)} eV and pays ${phi.toFixed(2)} eV to escape, leaving ${(E - phi).toFixed(2)} eV of kinetic energy. Move the brightness: the current changes, but the leftover energy does not.`;
    else msg = `<b>No electrons.</b> Each photon brings only ${E.toFixed(2)} eV, and ${m.name.toLowerCase()} needs ${phi.toFixed(2)} eV. Turn brightness all the way up and see if it helps. Threshold wavelength here: ${lam0} nm.`;
    if (pe.metal === 'Pt' && E <= phi) msg += ' Can you free electrons from platinum with visible light?';
    Lab.$('#pe-foot').innerHTML = `<p>${msg}</p>`;
  }
  Lab.segmented('#pe-metal', (v) => { pe.metal = v; if (v === 'X') { pe.solved = false; Lab.$('#pe-guess').value = ''; } paintPE(); peStage.redraw(); });
  Lab.bind('#pe-nm', '#pe-nm-out', (v) => v + ' nm', (v) => { pe.nm = v; paintPE(); peStage.redraw(); });
  Lab.bind('#pe-rate', '#pe-rate-out', (v) => (v === 0 ? 'off' : v + ' of 10'), (v) => { pe.rate = v; pe.spawn = 0; peStage.redraw(); });
  Lab.$('#pe-check').addEventListener('click', () => {
    const v = parseFloat(Lab.$('#pe-guess').value);
    const msg = Lab.$('#pe-msg');
    if (!Number.isFinite(v)) { msg.textContent = 'Type a number in eV first.'; return; }
    const phi = METALS.X.phi;
    if (Math.abs(v - phi) <= 0.06) {
      if (!pe.solved) { pe.solved = true; Lab.collection.award(1); Lab.confetti(60); }
      msg.textContent = `Yes. This metal has a work function of ${phi.toFixed(2)} eV, so its threshold wavelength is ${Math.round(((h * c) / (phi * eV)) * 1e9)} nm.`;
    } else {
      Lab.sound.bad();
      msg.textContent = v > phi ? 'Too high. If that were right, this color would not free any electrons.' : 'Too low. Check your threshold wavelength again: the photon energy right at the edge equals the work function.';
    }
    paintPE();
  });
  Lab.$('#pe-new').addEventListener('click', () => { newMystery(); pe.solved = false; Lab.$('#pe-guess').value = ''; Lab.$('#pe-msg').textContent = 'A new metal is in the tube. Lower the wavelength until electrons just start to fly.'; paintPE(); });
  paintPE();
});
