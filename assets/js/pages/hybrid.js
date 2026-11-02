/* Lesson 8.5: Hybrid orbitals and MO theory. Sigma and pi counts and MO fillings come from HybridKit (bank/hybrid.js). */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander } = Lab;
  const C = Art.C;
  const K = window.HybridKit;
  const TAU = Math.PI * 2;
  const POS = C.cyan, NEG = C.pink;

  /* ---------- Orbital art ---------- */
  /** A teardrop lobe as a Path2D, starting at (x, y) and pointing along angle a. */
  function lobePath(x, y, a, L, W) {
    const c = Math.cos(a), s = Math.sin(a), P = new Path2D();
    const m = (u, v) => [x + u * c - v * s, y + u * s + v * c];
    const bez = (a1, b1, a2, b2, a3, b3) => { const A = m(a1, b1), B = m(a2, b2), D = m(a3, b3); P.bezierCurveTo(A[0], A[1], B[0], B[1], D[0], D[1]); };
    const M = m(0, 0); P.moveTo(M[0], M[1]);
    bez(L * 0.2, -W * 0.32, L * 0.36, -W, L * 0.66, -W);
    bez(L * 0.92, -W, L, -W * 0.5, L, 0);
    bez(L, W * 0.5, L * 0.92, W, L * 0.66, W);
    bez(L * 0.36, W, L * 0.2, W * 0.32, 0, 0);
    P.closePath();
    return P;
  }
  function fillLobe(g, P, cx, cy, R, color, alpha = 0.8) {
    const gr = g.createRadialGradient(cx - R * 0.25, cy - R * 0.3, R * 0.05, cx, cy, R);
    gr.addColorStop(0, Art.alpha(Art.mix(color, '#ffffff', 0.45), alpha)); gr.addColorStop(0.6, Art.alpha(color, alpha * 0.92)); gr.addColorStop(1, Art.alpha(Art.mix(color, '#12062A', 0.35), alpha * 0.82));
    g.fillStyle = gr; g.fill(P);
    g.strokeStyle = Art.alpha(Art.mix(color, '#ffffff', 0.3), Math.min(1, alpha + 0.1)); g.lineWidth = 2; g.stroke(P);
  }
  const circlePath = (x, y, R) => { const P = new Path2D(); P.arc(x, y, R, 0, TAU); return P; };
  /** Yellow glow where two shapes overlap, which is where the bond's electrons are. */
  function overlapGlow(g, A, B, x0, y0, x1, y1, alpha) {
    if (alpha <= 0) return;
    g.save(); g.clip(A); g.clip(B);
    const gr = g.createRadialGradient((x0 + x1) / 2, (y0 + y1) / 2, 2, (x0 + x1) / 2, (y0 + y1) / 2, Math.max(70, Math.hypot(x1 - x0, y1 - y0) * 0.7));
    gr.addColorStop(0, Art.alpha('#FFF4B0', 0.98 * alpha)); gr.addColorStop(1, Art.alpha(C.sun, 0.75 * alpha));
    g.fillStyle = gr; g.fillRect(x0 - 240, y0 - 240, x1 - x0 + 480, y1 - y0 + 480);
    g.restore();
  }
  const SPEC = {
    ss: { R: 92, dMin: 118, D0: 184, el: 'H' },
    pe: { L: 128, W: 52, dMin: 170, D0: 256, el: 'F' },
    ps: { L: 112, W: 58, dMin: 76, D0: 116, el: 'C' },
  };
  /** Draw two atoms and their orbitals at separation d, with the right atom twisted about the axis. Returns the overlap, 0 to 1. */
  function drawOverlap(g, mode, d, twist, cx, y, t, o = {}) {
    const S = SPEC[mode], xA = cx - d / 2, xB = cx + d / 2;
    const raw = clamp((S.D0 - d) / (S.D0 - S.dMin));
    let overlap = raw;
    if (mode === 'ss') {
      const A = circlePath(xA, y, S.R), B = circlePath(xB, y, S.R);
      fillLobe(g, A, xA, y, S.R, POS, 0.62); fillLobe(g, B, xB, y, S.R, POS, 0.62);
      overlapGlow(g, A, B, xA, y, xB, y, raw > 0 ? 0.9 : 0);
    } else if (mode === 'pe') {
      const AL = lobePath(xA, y, Math.PI, S.L, S.W), AR = lobePath(xA, y, 0, S.L, S.W);
      const BL = lobePath(xB, y, Math.PI, S.L, S.W), BR = lobePath(xB, y, 0, S.L, S.W);
      fillLobe(g, AL, xA - S.L * 0.6, y, S.L * 0.6, NEG, 0.6); fillLobe(g, AR, xA + S.L * 0.6, y, S.L * 0.6, POS, 0.68);
      fillLobe(g, BR, xB + S.L * 0.6, y, S.L * 0.6, NEG, 0.6); fillLobe(g, BL, xB - S.L * 0.6, y, S.L * 0.6, POS, 0.68);
      overlapGlow(g, AR, BL, xA, y, xB, y, raw > 0 ? 0.9 : 0);
    } else {
      const cosT = Math.cos(twist);
      overlap = raw * cosT;
      const LB = Math.max(1, S.L * Math.abs(cosT));
      g.strokeStyle = 'rgba(247,242,255,.55)'; g.lineWidth = 6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(xA, y); g.lineTo(xB, y); g.stroke();
      const Au = lobePath(xA, y, -Math.PI / 2, S.L, S.W), Ad = lobePath(xA, y, Math.PI / 2, S.L, S.W);
      // A twisted p orbital is foreshortened. At 90 degrees it points at you and looks round.
      const sinT = Math.abs(Math.sin(twist));
      const twisted = (dir) => { const P = new Path2D(); P.ellipse(xB, y + dir * LB * 0.55, S.W * 0.92, Math.max(S.W * sinT * 0.92, LB * 0.55), 0, 0, TAU); return P; };
      const Bu = twist > 0.02 ? twisted(-1) : lobePath(xB, y, -Math.PI / 2, LB, S.W), Bd = twist > 0.02 ? twisted(1) : lobePath(xB, y, Math.PI / 2, LB, S.W);
      fillLobe(g, Au, xA, y - S.L * 0.6, S.L * 0.6, POS, 0.66); fillLobe(g, Ad, xA, y + S.L * 0.6, S.L * 0.6, NEG, 0.66);
      fillLobe(g, Bd, xB, y + LB * 0.6, Math.max(S.W, LB * 0.6), NEG, 0.66); fillLobe(g, Bu, xB, y - LB * 0.6, Math.max(S.W, LB * 0.6), POS, 0.66);
      overlapGlow(g, Au, Bu, xA, y - S.L * 0.6, xB, y - S.L * 0.6, raw > 0 ? 0.92 * cosT : 0);
      overlapGlow(g, Ad, Bd, xA, y + S.L * 0.6, xB, y + S.L * 0.6, raw > 0 ? 0.92 * cosT : 0);
    }
    const face = o.face === false ? null : overlap > 0.5 ? 'happy' : 'sad';
    Art.atom(g, xA, y, 22, S.el, { face, t, seed: 1, look: [1, 0] });
    Art.atom(g, xB, y, 22, S.el, { face, t, seed: 2, look: [-1, 0] });
    return overlap;
  }
  function axisLine(g, x0, x1, y, alpha = 1) {
    g.save(); g.globalAlpha *= alpha;
    g.strokeStyle = 'rgba(247,242,255,.65)'; g.lineWidth = 2.5; g.setLineDash([9, 8]);
    g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); g.restore();
  }

  /* ---------- Story 1: sigma and pi ---------- */
  Lab.story('#story-overlap', {
    title: 'Two ways for orbitals to overlap',
    scenes: [
      {
        say: 'Two hydrogen atoms each bring a round <b>s orbital</b>. As they meet, the orbitals overlap head-on, and the shared electrons sit right on the line between the nuclei. This is a <b>sigma bond</b>, written $\\sigma$.',
        dur: 3.2,
        draw(g, p, t, { W }) {
          const q = ease.inOut(seg(p, 0.05, 0.7));
          drawOverlap(g, 'ss', lerp(430, SPEC.ss.dMin, q), 0, W / 2, 205, t);
          Art.text(g, 's + s', W / 2, 42, { font: 'display', size: 38 });
          Art.text(g, 'σ bond', W / 2, 356, { font: 'display', size: 50, color: C.sun, alpha: seg(p, 0.65, 0.85) });
          Art.text(g, 'electrons on the axis', W / 2, 406, { size: 28, alpha: seg(p, 0.72, 0.9) });
          axisLine(g, 40, 760, 205, seg(p, 0.72, 0.9) * 0.8);
        },
      },
      {
        say: 'Two p orbitals can do it too, if they point at each other. In $\\ce{F2}$, one lobe from each atom overlaps <b>end to end</b>. The electrons are still on the axis, so this is also a <b>sigma</b> bond.',
        dur: 3.2,
        draw(g, p, t, { W }) {
          const q = ease.inOut(seg(p, 0.05, 0.7));
          drawOverlap(g, 'pe', lerp(460, SPEC.pe.dMin, q), 0, W / 2, 205, t);
          Art.text(g, 'p + p, end to end', W / 2, 42, { font: 'display', size: 38 });
          Art.text(g, 'σ bond', W / 2, 356, { font: 'display', size: 50, color: C.sun, alpha: seg(p, 0.65, 0.85) });
          Art.text(g, 'still on the axis', W / 2, 406, { size: 28, alpha: seg(p, 0.72, 0.9) });
          axisLine(g, 40, 760, 205, seg(p, 0.72, 0.9) * 0.8);
        },
      },
      {
        say: 'But parallel p orbitals overlap <b>side by side</b>, above and below the axis. This is a <b>pi bond</b>, written $\\pi$. Its electrons are never on the axis: they sit in two regions, above and below it.',
        dur: 3.4,
        draw(g, p, t, { W }) {
          const q = ease.inOut(seg(p, 0.05, 0.7));
          drawOverlap(g, 'ps', lerp(400, SPEC.ps.dMin, q), 0, W / 2 - 80, 210, t);
          Art.text(g, 'p + p, side by side', W / 2, 42, { font: 'display', size: 38 });
          axisLine(g, 80, 560, 210, seg(p, 0.7, 0.9) * 0.8);
          Art.text(g, 'π bond', 640, 186, { font: 'display', size: 52, color: C.sun, alpha: seg(p, 0.65, 0.85) });
          Art.text(g, 'electrons above', 640, 244, { size: 25, alpha: seg(p, 0.72, 0.9) });
          Art.text(g, 'and below the axis', 640, 276, { size: 25, alpha: seg(p, 0.72, 0.9) });
        },
      },
      {
        say: 'Now twist one atom. A sigma bond does not care, since the overlap stays the same. But twisting a pi bond turns the p orbitals out of line and destroys the overlap. So <b>pi bonds lock the atoms in place</b>.',
        dur: 3.6,
        draw(g, p, t) {
          const tw = ease.inOut(seg(p, 0.15, 0.85)) * (Math.PI / 2);
          g.save(); g.translate(200, 205); g.scale(0.72, 0.72); drawOverlap(g, 'pe', SPEC.pe.dMin, 0, 0, 0, t); g.restore();
          g.save(); g.translate(600, 205); g.scale(0.92, 0.92); drawOverlap(g, 'ps', SPEC.ps.dMin, tw, 0, 0, t); g.restore();
          Art.text(g, 'Sigma', 200, 46, { font: 'display', size: 38 });
          Art.text(g, 'Pi', 600, 46, { font: 'display', size: 38 });
          Art.text(g, `${Math.round((tw * 180) / Math.PI)}° twist`, 400, 378, { font: 'display', size: 34, color: C.sun });
          Art.text(g, 'Overlap: full', 200, 400, { size: 26, color: C.leaf });
          const ov = Math.cos(tw);
          Art.text(g, ov < 0.05 ? 'Overlap: none' : `Overlap: ${Math.round(ov * 100)}%`, 600, 400, { size: 26, color: ov < 0.5 ? C.red : C.leaf });
        },
      },
      {
        say: 'Put it together. A <b>double bond</b> is one sigma plus one pi. A <b>triple bond</b> is one sigma plus two pi, at right angles to each other. Only one pair of orbitals can point straight along the axis.',
        dur: 3.4,
        draw(g, p, t) {
          const drawPi = (cx, y, half, alpha, color, lift, W) => {
            const up = new Path2D(); up.ellipse(cx, y - lift, half, W, 0, 0, TAU);
            const dn = new Path2D(); dn.ellipse(cx, y + lift, half, W, 0, 0, TAU);
            fillLobe(g, up, cx, y - lift, half, color, alpha); fillLobe(g, dn, cx, y + lift, half, color, alpha);
          };
          const q1 = ease.out(seg(p, 0.1, 0.45)), q2 = ease.out(seg(p, 0.45, 0.8));
          // Double bond.
          const y = 190, x1 = 110, x2 = 290;
          drawPi(200, y, 96, 0.72 * q1, NEG, 46, 26);
          Art.bond(g, x1, y, x2, y, { width: 12, color: C.cyan });
          Art.atom(g, x1, y, 36, 'C', { face: 'happy', t, seed: 1, look: [1, 0] });
          Art.atom(g, x2, y, 36, 'C', { face: 'happy', t, seed: 2, look: [-1, 0] });
          Art.text(g, 'Double bond', 200, 56, { font: 'display', size: 36 });
          Art.text(g, 'σ', 200, y + 30, { font: 'display', size: 28, color: C.cyan, halo: true });
          Art.text(g, 'π', 200, y - 46, { font: 'display', size: 28, color: '#fff', alpha: q1 });
          Art.text(g, '1 σ + 1 π', 200, 340, { font: 'display', size: 40, color: C.sun, alpha: q1 });
          // Triple bond.
          const X1 = 510, X2 = 690;
          drawPi(600, y, 92, 0.46 * q2, C.violet, 16, 42);
          drawPi(600, y, 96, 0.72 * q2, NEG, 46, 26);
          Art.bond(g, X1, y, X2, y, { width: 12, color: C.cyan });
          Art.atom(g, X1, y, 36, 'N', { face: 'grin', t, seed: 3, look: [1, 0] });
          Art.atom(g, X2, y, 36, 'N', { face: 'grin', t, seed: 4, look: [-1, 0] });
          Art.text(g, 'Triple bond', 600, 56, { font: 'display', size: 36, alpha: seg(p, 0.42, 0.6) });
          Art.text(g, '1 σ + 2 π', 600, 340, { font: 'display', size: 40, color: C.sun, alpha: q2 });
          Art.text(g, 'One pi is above and below. The other is in front and behind.', 400, 400, { size: 25, color: C.dim, alpha: seg(p, 0.75, 0.95) });
        },
      },
    ],
  });

  /* ---------- Bench: overlap explorer ---------- */
  const ov = { mode: 'ss', dv: 100, tw: 0, shown: 0 };
  const ovStage = Lab.stage('#c-overlap', {
    h: 420, label: 'Two atoms with orbitals that overlap as you slide them together. The overlap glows yellow.',
    draw(g, t, dt) {
      const S = SPEC[ov.mode];
      const d = lerp(S.dMin, 460, ov.dv / 100);
      const tw = (ov.tw * Math.PI) / 180;
      const overlap = drawOverlap(g, ov.mode, d, tw, 400, 190, t);
      ov.shown = lerp(ov.shown, overlap, clamp(dt * 8));
      if (ov.mode !== 'ps') axisLine(g, 30, 770, 190, overlap > 0 ? 0.8 : 0.25);
      else axisLine(g, 30, 770, 190, 0.55);
      // A twist mark for the right atom.
      if (ov.tw > 0) {
        const xB = 400 + d / 2;
        g.strokeStyle = C.sun; g.lineWidth = 4;
        g.beginPath(); g.ellipse(xB, 190, 16, 44, 0, -Math.PI / 2, Math.PI / 2); g.stroke();
      }
      const type = ov.mode === 'ps' ? 'π bond' : 'σ bond';
      const live = ov.shown > 0.03;
      Art.text(g, live ? type : 'No overlap yet', 400, 40, { font: 'display', size: 42, color: live ? C.sun : C.dim });
      // Overlap meter.
      g.fillStyle = 'rgba(14,6,30,.72)'; Art.round(g, 110, 362, 580, 40, 14); g.fill();
      const gr = g.createLinearGradient(110, 0, 690, 0); gr.addColorStop(0, C.fire); gr.addColorStop(1, C.sun);
      g.fillStyle = gr; if (ov.shown > 0.01) { Art.round(g, 114, 366, 572 * ov.shown, 32, 11); g.fill(); }
      Art.text(g, `Overlap: ${Math.round(clamp(ov.shown) * 100)}%`, 400, 382, { size: 25, color: '#fff', halo: true });
    },
  });
  function paintOv() {
    Lab.$('#ov-d-out').textContent = ov.dv >= 100 ? 'apart' : ov.dv === 0 ? 'bonded' : ov.dv + '%';
    Lab.$('#ov-t-out').textContent = ov.tw + '°';
    const S = SPEC[ov.mode], d = lerp(S.dMin, 460, ov.dv / 100), raw = clamp((S.D0 - d) / (S.D0 - S.dMin));
    let html;
    if (raw <= 0) html = '<p>The orbitals have not met yet, so there is no bond. Slide the atoms together.</p>';
    else if (ov.mode === 'ps') {
      html = ov.tw >= 88 ? '<p>At 90°, the p orbitals are at right angles and the overlap is <b>gone</b>. The pi bond has broken. That costs a lot of energy, which is why double bonds do not rotate at room temperature.</p>'
        : `<p>Side-by-side overlap gives a <b>pi bond</b>, with electrons above and below the axis. The stick between the atoms is the sigma bond that holds them close enough for this.${ov.tw > 0 ? ' Twisting pulls the p orbitals out of line, and the overlap drops.' : ' Now try twisting.'}</p>`;
    } else html = `<p>Head-on overlap gives a <b>sigma bond</b>, with electrons along the axis.${ov.tw > 0 ? ' You have twisted the atom, but the overlap has not changed at all. Single bonds rotate freely.' : ' Now try twisting.'}</p>`;
    Lab.$('#ov-say').innerHTML = html + '<p style="opacity:.75;margin-top:4px">A simplified 2D model. The overlap meter is a guide, not a calculation.</p>';
  }
  Lab.segmented('#ov-mode', (v) => { ov.mode = v; paintOv(); });
  Lab.bind('#ov-d', null, null, (v) => { ov.dv = v; paintOv(); });
  Lab.bind('#ov-t', null, null, (v) => { ov.tw = v; paintOv(); });
  void ovStage;

  /* ---------- A small canvas 3D helper ---------- */
  function proj(v, cam) {
    const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    const x1 = v[0] * cy + v[2] * sy, z1 = -v[0] * sy + v[2] * cy;
    const y2 = v[1] * cp - z1 * sp, z2 = v[1] * sp + z1 * cp;
    const f = 6 / (6 - z2);
    return { x: cam.cx + x1 * cam.s * f, y: cam.cy - y2 * cam.s * f, z: z2, f };
  }
  /** Lobes in canvas 3D, sorted back to front. */
  function lobes3D(g, list, cam, o = {}) {
    const C0 = proj([0, 0, 0], cam);
    const items = list.map((it) => ({ ...it, tip: proj(it.d.map((c) => c * (it.len || 1)), cam) })).sort((a, b) => a.tip.z - b.tip.z);
    items.forEach((it) => {
      const dx = it.tip.x - C0.x, dy = it.tip.y - C0.y, L = Math.hypot(dx, dy) || 1;
      const W = (it.w || cam.s * 0.3) * it.tip.f;
      const P = lobePath(C0.x, C0.y, Math.atan2(dy, dx), Math.max(W * 1.15, L), W);
      fillLobe(g, P, C0.x + dx * 0.6, C0.y + dy * 0.6, Math.max(W, L * 0.6), it.color, it.alpha === undefined ? 0.74 : it.alpha);
    });
    if (o.center) Art.atom(g, C0.x, C0.y, o.r || 22, o.center, { face: o.face, t: o.t });
    return items;
  }

  /* Box and arrow electrons. */
  function spin(g, x, y, up, h, color) {
    const a = up ? -1 : 1;
    g.strokeStyle = color; g.fillStyle = color; g.lineWidth = 3.4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y - a * (h / 2)); g.lineTo(x, y + a * (h / 2 - 5)); g.stroke();
    g.beginPath(); g.moveTo(x, y + a * (h / 2 + 2)); g.lineTo(x - 7, y + a * (h / 2 - 8)); g.lineTo(x + 7, y + a * (h / 2 - 8)); g.closePath(); g.fill();
  }
  function box(g, x, y, w, h, e, o = {}) {
    g.fillStyle = o.fill || 'rgba(14,6,30,.72)'; g.strokeStyle = o.stroke || 'rgba(247,242,255,.7)'; g.lineWidth = o.hi ? 4 : 2.5;
    Art.round(g, x - w / 2, y - h / 2, w, h, 8); g.fill(); g.stroke();
    const col = o.ecolor || C.cyan;
    if (e === 1) spin(g, x, y, true, h - 14, col);
    if (e === 2) { spin(g, x - 11, y, true, h - 14, col); spin(g, x + 11, y, false, h - 14, col); }
  }

  /* ---------- Story 2: hybrid orbitals ---------- */
  const t3 = 1 / Math.sqrt(3);
  const TET = [[t3, t3, t3], [t3, -t3, -t3], [-t3, t3, -t3], [-t3, -t3, t3]];
  const HY_C = [C.pink, C.cyan, C.sun, C.leaf];
  const camAt = (cx, cy, s, t, o = {}) => ({ cx, cy, s, yaw: (o.yaw === undefined ? 0.45 : o.yaw) + t * (o.spin === undefined ? 0.22 : o.spin), pitch: o.pitch === undefined ? 0.28 : o.pitch });
  Lab.story('#story-hybrid', {
    title: 'Mixing orbitals to fit the shape',
    scenes: [
      {
        say: 'Carbon has 4 valence electrons: 2 in the 2s orbital and 2 in the 2p orbitals. That shows just <b>2 unpaired electrons</b>, at 90°. But methane has <b>4 identical bonds</b>, at 109.5°. Something has to change.',
        dur: 3.4,
        draw(g, p, t) {
          const q = seg(p, 0.05, 0.3);
          Art.text(g, 'Carbon on its own', 220, 44, { font: 'display', size: 32, alpha: q });
          [[0, 1], [1, 1], [2, 0]].forEach(([i, e]) => box(g, 150 + i * 72, 150, 60, 54, e));
          box(g, 150, 300, 60, 54, 2);
          Art.text(g, '2p', 66, 150, { font: 'display', size: 34 });
          Art.text(g, '2s', 66, 300, { font: 'display', size: 34 });
          Art.arrow(g, 30, 340, 30, 90, { color: C.dim, w: 3, head: 12, alpha: q });
          Art.text(g, 'Energy', 30, 70, { size: 21, color: C.dim, align: 'left' });
          Art.text(g, 'only 2 unpaired', 240, 388, { size: 28, color: C.red, alpha: seg(p, 0.25, 0.45) });
          const a = seg(p, 0.4, 0.65);
          g.save(); g.globalAlpha *= a;
          const cam = camAt(590, 210, 128, t);
          const items = TET.map((d) => ({ d, el: 'H' }));
          const cen = proj([0, 0, 0], cam);
          items.map((it) => ({ ...it, tip: proj(it.d, cam) })).sort((x, y) => x.tip.z - y.tip.z).forEach((it) => {
            Art.bond(g, cen.x, cen.y, it.tip.x, it.tip.y, { width: 7 });
            Art.atom(g, it.tip.x, it.tip.y, 24 * it.tip.f, 'H', { face: 'happy', t });
          });
          Art.atom(g, cen.x, cen.y, 32, 'C', { face: 'wow', t });
          g.restore();
          Art.text(g, 'Methane', 590, 44, { font: 'display', size: 32, alpha: a });
          Art.text(g, '4 identical bonds', 590, 388, { size: 28, color: C.leaf, alpha: seg(p, 0.5, 0.7) });
        },
      },
      {
        say: 'The fix: the atom <b>mixes</b> its orbitals. One s and three p blend into four identical <b>sp³ hybrid orbitals</b>, all at the same energy. Think of mixing 1 cup of blue paint with 3 cups of yellow: you get 4 cups of the same green.',
        dur: 3.8,
        draw(g, p) {
          const q = ease.inOut(seg(p, 0.15, 0.8));
          const yMix = 220;
          const xs = [[160, 292], [232, 364], [304, 436], [160, 508]];
          Art.text(g, 'Before', 230, 40, { font: 'display', size: 28, alpha: 1 - seg(p, 0.15, 0.4) });
          Art.text(g, 'After: 4 sp³ orbitals', 400, 40, { font: 'display', size: 32, color: C.sun, alpha: seg(p, 0.7, 0.9) });
          xs.forEach(([xa, xb], i) => {
            const isS = i === 3;
            const y0 = isS ? 330 : 150;
            const x = lerp(xa, xb, q);
            const y = lerp(y0, yMix, q);
            const col = isS ? Art.mix('#3F6BFF', '#3DDC84', q) : Art.mix('#FFD23F', '#3DDC84', q);
            box(g, x, y, 60, 54, 1, { fill: Art.alpha(col, 0.42), stroke: col });
          });
          Art.text(g, '2p', 66, 150, { font: 'display', size: 32, alpha: 1 - seg(p, 0.15, 0.4) });
          Art.text(g, '2s', 66, 330, { font: 'display', size: 32, alpha: 1 - seg(p, 0.15, 0.4) });
          // Paint.
          const can = (x, y, color, label, a) => {
            g.save(); g.globalAlpha *= a; g.fillStyle = color; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
            Art.round(g, x - 24, y - 26, 48, 52, 10); g.fill(); g.stroke();
            g.restore();
            Art.text(g, label, x, y + 44, { size: 24, alpha: a });
          };
          const a = seg(p, 0.45, 0.7);
          can(190, 372, '#3F6BFF', '1 s', 1);
          Art.text(g, '+', 250, 372, { font: 'display', size: 40, color: C.dim });
          can(310, 372, '#FFD23F', '3 p', 1);
          can(600, 372, '#3DDC84', '4 identical', a);
          Art.text(g, 'mix', 455, 350, { font: 'display', size: 30, color: C.pink, alpha: seg(p, 0.3, 0.5) });
          Art.arrow(g, 390, 376, 540, 376, { color: C.pink, w: 5, p: seg(p, 0.3, 0.6) });
          Art.text(g, 'sp³', 400, 150, { font: 'display', size: 48, color: C.leaf, alpha: seg(p, 0.75, 0.95) });
        },
      },
      {
        say: 'Each sp³ orbital has one big lobe and one tiny lobe. The four big lobes point to the corners of a tetrahedron, exactly where VSEPR says the groups go. Each overlaps a hydrogen s orbital, making four <b>sigma</b> bonds.',
        dur: 3.4,
        draw(g, p, t) {
          const cam = camAt(290, 225, 165, t, { spin: 0.28 });
          const q = ease.out(seg(p, 0, 0.5));
          lobes3D(g, TET.map((d, i) => ({ d, color: HY_C[i], len: q, w: 44 * q + 2 })).concat(TET.map((d, i) => ({ d: d.map((c) => -c), color: HY_C[i], len: 0.26 * q, w: 15 * q + 1, alpha: 0.6 }))), cam, { center: 'C', r: 26, face: 'happy', t });
          const h = seg(p, 0.5, 0.8);
          if (h > 0) TET.forEach((d) => { const P = proj(d.map((c) => c * 1.14), cam); Art.atom(g, P.x, P.y, 25 * P.f, 'H', { alpha: h }); });
          Art.text(g, 'sp³', 640, 110, { font: 'display', size: 76, color: C.sun });
          Art.text(g, '4 groups', 640, 182, { font: 'display', size: 34 });
          Art.text(g, '109.5° apart', 640, 228, { size: 30, color: C.cyan });
          Art.text(g, 'No p left over', 640, 272, { size: 28, color: C.dim });
        },
      },
      {
        say: 'With 3 groups, the atom mixes one s and two p, making three <b>sp²</b> orbitals in a flat triangle. One p orbital is left out, standing straight up. In ethene, those leftover p orbitals overlap side by side to make the <b>pi bond</b>.',
        dur: 3.6,
        draw(g, p, t) {
          const y = 215, x1 = 210, x2 = 390;
          const q = ease.out(seg(p, 0.05, 0.5));
          // Leftover p orbitals, behind everything.
          [x1, x2].forEach((x) => {
            const u = lobePath(x, y, -Math.PI / 2, 106, 40), d = lobePath(x, y, Math.PI / 2, 106, 40);
            fillLobe(g, u, x, y - 62, 62, C.violet, 0.68 * q); fillLobe(g, d, x, y + 62, 62, C.violet, 0.68 * q);
          });
          const a = seg(p, 0.6, 0.85);
          const U = lobePath(x1, y, -Math.PI / 2, 106, 40), Ub = lobePath(x2, y, -Math.PI / 2, 106, 40);
          const D = lobePath(x1, y, Math.PI / 2, 106, 40), Db = lobePath(x2, y, Math.PI / 2, 106, 40);
          void U; void Ub; void D; void Db;
          // The pi region between the leftover p orbitals.
          g.fillStyle = Art.alpha(C.sun, 0.72 * a);
          g.beginPath(); g.ellipse(300, y - 62, 94, 34, 0, 0, TAU); g.fill();
          g.beginPath(); g.ellipse(300, y + 62, 94, 34, 0, 0, TAU); g.fill();
          // Sigma framework, flat in the plane.
          Art.bond(g, x1, y, x2, y, { width: 10, color: C.cyan });
          [[x1, -150], [x1, 150], [x2, -30], [x2, 30]].forEach(([x, deg], k) => {
            const r = (deg * Math.PI) / 180, X = x + Math.cos(r) * 120, Y = y + Math.sin(r) * 62;
            Art.bond(g, x, y, X, Y, { width: 7 });
            Art.atom(g, X, Y, 24, 'H', { seed: k });
          });
          Art.atom(g, x1, y, 30, 'C', { face: 'happy', t, seed: 1 });
          Art.atom(g, x2, y, 30, 'C', { face: 'happy', t, seed: 2 });
          Art.text(g, 'π', 300, y - 62, { font: 'display', size: 34, color: '#22123A', alpha: a });
          Art.text(g, 'σ', 300, y + 22, { font: 'display', size: 30, color: C.cyan, halo: true, alpha: a });
          Art.text(g, 'sp²', 660, 110, { font: 'display', size: 76, color: C.sun });
          Art.text(g, '3 groups', 660, 182, { font: 'display', size: 34 });
          Art.text(g, '120° apart', 660, 228, { size: 30, color: C.cyan });
          Art.text(g, '1 p left over', 660, 272, { size: 28, color: C.violet });
        },
      },
      {
        say: 'With 2 groups, the atom mixes one s and one p, making two <b>sp</b> orbitals pointing in opposite directions. Two p orbitals are left over. In ethyne, they make <b>two pi bonds</b>, giving a triple bond.',
        dur: 3.4,
        draw(g, p, t) {
          const y = 215, x1 = 210, x2 = 390;
          const q = ease.out(seg(p, 0.05, 0.5));
          const up = new Path2D(); up.ellipse(300, y - 56, 120, 34, 0, 0, TAU);
          const dn = new Path2D(); dn.ellipse(300, y + 56, 120, 34, 0, 0, TAU);
          const fr = new Path2D(); fr.ellipse(300, y, 118, 46, 0, 0, TAU);
          fillLobe(g, fr, 300, y, 118, C.violet, 0.48 * q);
          fillLobe(g, up, 300, y - 56, 110, C.sun, 0.7 * q); fillLobe(g, dn, 300, y + 56, 110, C.sun, 0.7 * q);
          Art.bond(g, x1, y, x2, y, { width: 10, color: C.cyan });
          Art.bond(g, x1, y, x1 - 120, y, { width: 7 }); Art.bond(g, x2, y, x2 + 120, y, { width: 7 });
          Art.atom(g, x1 - 120, y, 24, 'H', {}); Art.atom(g, x2 + 120, y, 24, 'H', {});
          Art.atom(g, x1, y, 30, 'C', { face: 'grin', t, seed: 1 }); Art.atom(g, x2, y, 30, 'C', { face: 'grin', t, seed: 2 });
          Art.text(g, 'sp', 680, 110, { font: 'display', size: 76, color: C.sun });
          Art.text(g, '2 groups', 680, 182, { font: 'display', size: 34 });
          Art.text(g, '180° apart', 680, 228, { size: 30, color: C.cyan });
          Art.text(g, '2 p left over', 680, 272, { size: 28, color: C.violet });
          Art.text(g, 'Linear: H-C≡C-H', 300, 360, { font: 'display', size: 34, alpha: seg(p, 0.5, 0.8) });
        },
      },
    ],
  });

  /* ---------- Bench: orbital mixer, a real s and p combination in 3D ---------- */
  const hyV = Chem3D.viewer('#v-hybrid', { height: 470, distance: 7.2, label: 'Atomic orbitals mixing into hybrid orbitals. Rotatable 3D model.' });
  const hy = { groups: 4, mix: 1, parts: [], group: null };
  const r2 = Math.SQRT1_2, r3 = Math.sqrt(3);
  const SETS = {
    // Each entry: pure orbital [c_s, v] and final hybrid [c_s, v]. Leftover p orbitals stay as they are.
    4: { name: 'sp³', ang: '109.5°', ex: 'CH₄', orbs: [
      { pure: [1, [0, 0, 0]], hyb: [0.5, TET[0].map((c) => (c * r3) / 2)], label: '2s' },
      { pure: [0, [1, 0, 0]], hyb: [0.5, TET[1].map((c) => (c * r3) / 2)], label: '2p' },
      { pure: [0, [0, 1, 0]], hyb: [0.5, TET[2].map((c) => (c * r3) / 2)], label: '2p' },
      { pure: [0, [0, 0, 1]], hyb: [0.5, TET[3].map((c) => (c * r3) / 2)], label: '2p' },
    ], left: [] },
    3: { name: 'sp²', ang: '120°', ex: 'C₂H₄', orbs: [
      { pure: [1, [0, 0, 0]], hyb: [1 / r3, [0, Math.sqrt(2 / 3), 0]], label: '2s' },
      { pure: [0, [1, 0, 0]], hyb: [1 / r3, [Math.sqrt(2 / 3) * 0.866, Math.sqrt(2 / 3) * -0.5, 0]], label: '2p' },
      { pure: [0, [0, 1, 0]], hyb: [1 / r3, [Math.sqrt(2 / 3) * -0.866, Math.sqrt(2 / 3) * -0.5, 0]], label: '2p' },
    ], left: [[0, 0, 1]] },
    2: { name: 'sp', ang: '180°', ex: 'C₂H₂', orbs: [
      { pure: [1, [0, 0, 0]], hyb: [r2, [r2, 0, 0]], label: '2s' },
      { pure: [0, [1, 0, 0]], hyb: [r2, [-r2, 0, 0]], label: '2p' },
    ], left: [[0, 1, 0], [0, 0, 1]] },
  };
  const SEG = 44, SEG2 = 30, SCALE = 1.0, POWER = 2.6;
  function lobeMesh(color, opacity) {
    const T = window.THREE;
    const n = (SEG + 1) * (SEG2 + 1);
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 3), 3));
    const idx = [];
    for (let i = 0; i < SEG2; i++) for (let j = 0; j < SEG; j++) { const a = i * (SEG + 1) + j, b = a + SEG + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    geo.setIndex(idx);
    const mat = hyV.atomMaterial(color, { opacity, roughness: 0.3 });
    mat.side = T.DoubleSide;
    return new T.Mesh(geo, mat);
  }
  /** Radius follows a power of c_s + |v| cos(theta), a true s and p mixture, drawn a little slimmer than a density plot so the lobes stay apart. */
  function shapeLobes(part, cs, v) {
    const T = window.THREE;
    const m = Math.hypot(v[0], v[1], v[2]);
    const norm = Math.hypot(cs, m) || 1;
    const c = cs / norm, vm = m / norm;
    const fillOne = (mesh, sign) => {
      const P = mesh.geometry.attributes.position;
      for (let i = 0; i <= SEG2; i++) {
        const th = (i / SEG2) * Math.PI, st = Math.sin(th), ct = Math.cos(th);
        const f = c + vm * ct, R = sign * f > 0 ? Math.pow(sign * f, POWER) * SCALE : 0;
        for (let j = 0; j <= SEG; j++) {
          const ph = (j / SEG) * TAU, k = i * (SEG + 1) + j;
          P.setXYZ(k, R * st * Math.cos(ph), R * ct, R * st * Math.sin(ph));
        }
      }
      P.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
    };
    fillOne(part.big, 1); fillOne(part.small, -1);
    const q = new T.Quaternion();
    if (m > 1e-5) q.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(v[0] / m, v[1] / m, v[2] / m));
    part.big.quaternion.copy(q); part.small.quaternion.copy(q);
    const pFrac = vm * vm;
    part.big.material.opacity = lerp(0.34, 0.86, pFrac);
    part.small.material.opacity = lerp(0.34, 0.8, pFrac);
    part.big.visible = true; part.small.visible = vm > 0.01;
  }
  function buildHybrid() {
    if (!hyV.ok) return;
    hyV.clear();
    const T = window.THREE, S = SETS[hy.groups];
    const group = new T.Group();
    hy.parts = S.orbs.map((_, i) => {
      const part = { big: lobeMesh(HY_C[i], 0.8), small: lobeMesh(Art.mix(HY_C[i], '#ffffff', 0.25), 0.75) };
      group.add(part.big); group.add(part.small);
      return part;
    });
    hy.left = S.left.map((v) => {
      const part = { big: lobeMesh('#B28DFF', 0.5), small: lobeMesh('#B28DFF', 0.5) };
      group.add(part.big); group.add(part.small);
      shapeLobes(part, 0, v);
      part.big.material.opacity = 0.42; part.small.material.opacity = 0.42;
      return part;
    });
    const nuc = new T.Mesh(new T.SphereGeometry(0.17, 24, 18), hyV.atomMaterial('#FFF4B0'));
    group.add(nuc);
    hyV.add(group);
    updateHybrid();
  }
  function updateHybrid() {
    const S = SETS[hy.groups], q = hy.mix;
    Lab.$('#hy-name').textContent = q > 0.98 ? S.name : q < 0.02 ? 'Not mixed' : 'Mixing';
    Lab.$('#hy-ang').textContent = q > 0.98 ? S.ang : 'not there yet';
    Lab.$('#hy-left').textContent = S.left.length;
    Lab.$('#hy-ex').textContent = S.ex;
    Lab.$('#hy-mix-out').textContent = Math.round(q * 100) + '%';
    const pureText = hy.groups === 4 ? 'one 2s and three 2p' : hy.groups === 3 ? 'one 2s and two 2p' : 'one 2s and one 2p';
    Lab.$('#hy-say').innerHTML = q < 0.02
      ? `<p>Before mixing: ${pureText} orbitals, each with its own shape${S.left.length ? `, plus the ${S.left.length} p orbital${S.left.length > 1 ? 's' : ''} that will stay out of it, in purple` : ''}. Now drag the slider.</p>`
      : q > 0.98
        ? `<p><b>${S.orbs.length} identical ${S.name} orbitals.</b> Each has one big lobe, used for a bond or a lone pair, and one small lobe. ${S.left.length ? `The purple p orbital${S.left.length > 1 ? 's are' : ' is'} left over, ready to form pi bonds.` : 'No p orbitals are left over, so these atoms make only sigma bonds.'} Each one is a true mix of s and p, with lobes drawn a little slimmer for clarity and one color per orbital.</p>`
        : '<p>Watch the s orbital add to one lobe of each p and subtract from the other. That is where the big lobe and the small lobe come from.</p>';
    if (!hyV.ok) return;
    S.orbs.forEach((o, i) => {
      const cs = lerp(o.pure[0], o.hyb[0], q);
      const v = o.pure[1].map((c, k) => lerp(c, o.hyb[1][k], q));
      shapeLobes(hy.parts[i], cs, v);
    });
    const labels = [];
    if (q < 0.08) {
      S.orbs.forEach((o, i) => { if (i === 0) labels.push({ p: [0, -1.5, 0], text: '2s' }); else labels.push({ p: o.pure[1].map((c) => c * 1.55), text: '2p' }); });
    } else if (q > 0.92) {
      const A = S.orbs[0].hyb[1], B = S.orbs[1].hyb[1];
      const ma = Math.hypot(...A), mb = Math.hypot(...B);
      const mid = [A[0] / ma + B[0] / mb, A[1] / ma + B[1] / mb, A[2] / ma + B[2] / mb];
      const mm = Math.hypot(...mid);
      const at = mm < 1e-3 ? [0, 0.72, 0] : mid.map((c) => (c / mm) * 0.92);
      labels.push({ p: at, text: S.ang });
      labels.push({ p: A.map((c) => (c / ma) * 2.42), text: S.name });
    }
    hyV.labels(labels);
  }
  Lab.segmented('#hy-type', (v) => { hy.groups = +v; buildHybrid(); if (!hyV.ok) updateHybrid(); });
  Lab.bind('#hy-mix', null, null, (v) => { hy.mix = v / 100; if (hy.parts.length || !hyV.ok) updateHybrid(); });
  buildHybrid();
  if (!hyV.ok) updateHybrid();

  /* ---------- Bench: bond dissector ---------- */
  const IDS = ['H2O', 'NH3', 'CO2', 'HCN', 'N2', 'CH2O', 'C2H6', 'C2H4', 'C2H2', 'HCOOH', 'CH3CN', 'C6H6'];
  const cnt = { mol: K.mol('H2O'), bonds: new Set(), atoms: new Set(), won: new Set() };
  function cntLay() {
    const m = cnt.mol, xs = m.atoms.map((a) => a.x), ys = m.atoms.map((a) => a.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const L = Math.min(190, x1 > x0 ? 620 / (x1 - x0) : 999, y1 > y0 ? 320 / (y1 - y0) : 999);
    const cx = 400, cy = 268;
    const r = clamp(L * 0.2, 22, 36);
    return { L, r, P: m.atoms.map((a) => ({ x: cx + (a.x - (x0 + x1) / 2) * L, y: cy + (a.y - (y0 + y1) / 2) * L, r: a.el === 'H' ? r * 0.76 : r })) };
  }
  function lpDirs(m, lay, i) {
    const n = m.atoms[i].lp;
    if (!n) return [];
    const nb = m.edges.filter((e) => e[0] === i || e[1] === i).map((e) => { const j = e[0] === i ? e[1] : e[0]; return Math.atan2(lay.P[j].y - lay.P[i].y, lay.P[j].x - lay.P[i].x); }).sort((a, b) => a - b);
    if (nb.length === 1) return n === 1 ? [nb[0] + Math.PI] : n === 2 ? [nb[0] + 2.1, nb[0] - 2.1] : [nb[0] + Math.PI, nb[0] + 1.57, nb[0] - 1.57];
    const gaps = nb.map((a, k) => { const b = nb[(k + 1) % nb.length]; return { a, s: ((b - a + TAU) % TAU) || TAU, n: 0 }; });
    for (let k = 0; k < n; k++) gaps.slice().sort((x, y) => y.s / (y.n + 1) - x.s / (x.n + 1))[0].n++;
    const out = [];
    gaps.forEach((g) => { for (let j = 0; j < g.n; j++) out.push(g.a + (g.s * (j + 1)) / (g.n + 1)); });
    return out;
  }
  const cntStage = Lab.stage('#c-count', {
    h: 480, label: 'A molecule whose bonds split into sigma and pi parts as you tap them.',
    onPointer(e) {
      const lay = cntLay(), m = cnt.mol;
      const a = lay.P.findIndex((q) => Math.hypot(e.x - q.x, e.y - q.y) < Math.max(q.r + 8, 30));
      const b = m.edges.findIndex(([i, j]) => Math.hypot(e.x - (lay.P[i].x + lay.P[j].x) / 2, e.y - (lay.P[i].y + lay.P[j].y) / 2) < Math.min(42, lay.L * 0.34));
      if (e.type === 'hover') { cntStage.canvas.style.cursor = a >= 0 || b >= 0 ? 'pointer' : 'default'; return; }
      if (e.type !== 'down') return;
      if (a >= 0) { if (m.atoms[a].el !== 'H') { cnt.atoms.add(a); Lab.sound.pop(); } }
      else if (b >= 0) { cnt.bonds.add(b); Lab.sound.pop(); }
      paintCnt();
    },
    draw(g, t) {
      const m = cnt.mol, lay = cntLay();
      m.edges.forEach(([i, j, order], k) => {
        const A = lay.P[i], B = lay.P[j];
        const open = cnt.bonds.has(k);
        if (open && order > 1) {
          const ang = Math.atan2(B.y - A.y, B.x - A.x), mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
          const half = Math.hypot(B.x - A.x, B.y - A.y) / 2 * 0.86;
          const n = [-Math.sin(ang), Math.cos(ang)];
          if (order === 3) {
            const fr = new Path2D(); fr.ellipse(mx, my, half, lay.r * 0.86, ang, 0, TAU);
            fillLobe(g, fr, mx, my, half, C.violet, 0.5);
          }
          [1, -1].forEach((s) => {
            const P = new Path2D(); P.ellipse(mx + n[0] * s * lay.r * 0.92, my + n[1] * s * lay.r * 0.92, half, lay.r * 0.46, ang, 0, TAU);
            fillLobe(g, P, mx + n[0] * s * lay.r * 0.92, my + n[1] * s * lay.r * 0.92, half * 0.8, C.pink, 0.78);
          });
        }
        if (open) {
          Art.bond(g, A.x, A.y, B.x, B.y, { width: Math.max(7, lay.r * 0.3), color: C.cyan });
        } else {
          Art.bond(g, A.x, A.y, B.x, B.y, { order, width: Math.max(4.5, lay.r * 0.18) });
        }
      });
      m.atoms.forEach((a, i) => {
        const P = lay.P[i];
        Art.atom(g, P.x, P.y, P.r, a.el, {});
        lpDirs(m, lay, i).forEach((d) => {
          const R = P.r + 13, x = P.x + Math.cos(d) * R, y = P.y + Math.sin(d) * R, ox = -Math.sin(d) * 7.5, oy = Math.cos(d) * 7.5;
          Art.ball(g, x + ox, y + oy, 5.2, C.electron); Art.ball(g, x - ox, y - oy, 5.2, C.electron);
        });
      });
      // Labels on opened items, drawn last so nothing covers them.
      m.edges.forEach(([i, j, order], k) => {
        if (!cnt.bonds.has(k)) return;
        const A = lay.P[i], B = lay.P[j], mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
        const words = 'σ' + (order === 2 ? ' + π' : order === 3 ? ' + 2π' : '');
        if (lay.L > 90 || order > 1) Art.text(g, words, mx, my + (order > 1 ? 0 : -18), { font: 'display', size: order > 1 ? 28 : 24, color: '#fff', halo: true });
      });
      m.atoms.forEach((a, i) => {
        if (!cnt.atoms.has(i)) return;
        const P = lay.P[i];
        const name = K.hybridOf(m, i);
        const yy = P.y - P.r - 26 < 74 ? P.y + P.r + 28 : P.y - P.r - 26;
        Art.pill(g, name, P.x, yy, { size: 24, color: C.sun, text: '#22123A' });
      });
      Art.formula(g, m.f, 26, 42, { size: 46, align: 'left' });
      const c = K.count(m);
      const sF = [...cnt.bonds].length, pF = [...cnt.bonds].reduce((a, k) => a + (m.edges[k][2] - 1), 0);
      const done = sF === c.sigma;
      Art.text(g, `σ ${sF}`, 650, 42, { font: 'display', size: 40, color: C.cyan });
      Art.text(g, `π ${pF}`, 736, 42, { font: 'display', size: 40, color: C.pink });
      if (done && cnt.atoms.size >= m.atoms.filter((a) => a.el !== 'H').length) Art.moe(g, 66, 470, 104, 'cheer', { t });
    },
  });
  function paintCnt() {
    const m = cnt.mol, c = K.count(m);
    const sF = cnt.bonds.size, pF = [...cnt.bonds].reduce((a, k) => a + (m.edges[k][2] - 1), 0);
    Lab.$('#cnt-name').textContent = m.name;
    Lab.$('#cnt-s').textContent = `${sF} of ${c.sigma}`;
    Lab.$('#cnt-p').textContent = `${pF} of ${c.pi}`;
    const heavy = m.atoms.map((a, i) => ({ a, i })).filter((x) => x.a.el !== 'H');
    const all = sF === c.sigma && cnt.atoms.size === heavy.length;
    let html;
    if (all) {
      const list = heavy.map((x) => `${x.a.el} is ${K.hybridOf(m, x.i)}`);
      const uniq = [...new Set(list)].join(', ');
      html = `<p><b>Total: ${c.sigma} sigma and ${c.pi} pi.</b> ${uniq}. Each atom's hybridization comes from its electron groups: atoms bonded to it plus its lone pairs.</p>`;
      if (!cnt.won.has(m.f)) { cnt.won.add(m.f); Lab.collection.award(1); Lab.sound.good(); }
    } else html = '<p>Tap a bond to split it into its parts: <b>blue</b> is sigma, <b>pink</b> and <b>purple</b> are pi. Tap an atom to see its hybridization. Hydrogen stays in its 1s orbital and is not hybridized.</p>';
    Lab.$('#cnt-say').innerHTML = html;
    cntStage.redraw();
  }
  function setCnt(id) { cnt.mol = K.mol(id); cnt.bonds = new Set(); cnt.atoms = new Set(); paintCnt(); }
  Lab.$('#cnt-mol').innerHTML = IDS.map((id, i) => `<button type="button" data-value="${id}" aria-pressed="${i === 0}">${Lab.fHTML(id)}</button>`).join('');
  Lab.segmented('#cnt-mol', setCnt);
  Lab.$('#cnt-all').addEventListener('click', () => { const m = cnt.mol; m.edges.forEach((_, k) => cnt.bonds.add(k)); m.atoms.forEach((a, i) => { if (a.el !== 'H') cnt.atoms.add(i); }); paintCnt(); });
  Lab.$('#cnt-reset').addEventListener('click', () => { cnt.bonds = new Set(); cnt.atoms = new Set(); paintCnt(); });
  paintCnt();

  /* ---------- Story 3: magnets and MO theory ---------- */
  function magnet(g, cx, top, o = {}) {
    const w = 106, gap = o.gap || 72;
    [-1, 1].forEach((s) => {
      const x = cx + s * (gap / 2 + w / 2);
      const m = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
      m.addColorStop(0, s < 0 ? '#E4576B' : '#5D7CFF'); m.addColorStop(1, s < 0 ? '#B02B40' : '#3753C4');
      g.fillStyle = m; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
      Art.round(g, x - w / 2, top, w, 142, 10); g.fill(); g.stroke();
      Art.text(g, s < 0 ? 'N' : 'S', x, top + 72, { font: 'display', size: 44, color: '#fff' });
    });
  }
  function pourScene(g, p, t, kind) {
    const cx = 400, topY = 120;
    const isO = kind === 'O2';
    const color = isO ? '#9CC8FF' : '#DCEFF8';
    // Dewar-style pouring flask at the top.
    g.save(); g.translate(cx + 96, 58); g.rotate(-0.62);
    Art.round(g, -46, -30, 96, 62, 10); g.fillStyle = 'rgba(214,240,255,.85)'; g.fill();
    g.strokeStyle = '#1A0F2E'; g.lineWidth = 3; g.stroke();
    g.fillStyle = color; Art.round(g, -38, -22, 80, 46, 8); g.fill();
    g.restore();
    magnet(g, cx, topY);
    const q = ease.inOut(seg(p, 0.05, 0.6));
    // The stream.
    if (!isO) {
      const y1 = lerp(92, 380, q);
      g.strokeStyle = Art.alpha(color, 0.9); g.lineWidth = 16; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx + 18, 90); g.quadraticCurveTo(cx + 2, 100, cx, y1); g.stroke();
      Art.smoke(g, cx, 370, t, { n: 7, h: 70, r: 12, color: '#F4FBFF', alpha: 0.3, spread: 40 });
    } else {
      const y1 = lerp(92, 214, q);
      g.strokeStyle = Art.alpha(color, 0.92); g.lineWidth = 16; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx + 18, 90); g.quadraticCurveTo(cx + 2, 100, cx, y1); g.stroke();
      const hold = ease.out(seg(p, 0.4, 0.8));
      if (hold > 0) {
        g.fillStyle = Art.alpha(color, 0.92);
        Art.round(g, cx - 35, 150 + (1 - hold) * 60, 70, 100 * hold + 8, 18); g.fill();
        g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(cx - 12, 172, 8, 14, 0.2, 0, TAU); g.fill();
      }
    }
    return { isO };
  }
  Lab.story('#story-mo', {
    title: 'The magnet test',
    scenes: [
      {
        say: 'Pour <b>liquid nitrogen</b> between the poles of a strong magnet. It falls straight through. Nitrogen is not attracted at all. This is called <b>diamagnetic</b>.',
        dur: 2.8,
        draw(g, p, t) {
          pourScene(g, p, t, 'N2');
          Art.text(g, 'Liquid N₂', 130, 80, { font: 'display', size: 36 });
          Art.text(g, 'falls straight through', 130, 124, { size: 24, color: C.dim, alpha: seg(p, 0.5, 0.7), maxW: 240 });
          Art.text(g, 'Not attracted', 400, 412, { font: 'display', size: 38, color: C.cyan, alpha: seg(p, 0.6, 0.8) });
        },
      },
      {
        say: 'Now pour <b>liquid oxygen</b>. It <b>sticks</b> between the poles, held up by the magnet. Oxygen is <b>paramagnetic</b>, and that means it must have <b>unpaired electrons</b>.',
        dur: 2.8,
        draw(g, p, t) {
          pourScene(g, p, t, 'O2');
          Art.text(g, 'Liquid O₂', 130, 80, { font: 'display', size: 36 });
          Art.text(g, 'held by the magnet', 130, 124, { size: 24, color: C.dim, alpha: seg(p, 0.6, 0.8), maxW: 240 });
          Art.text(g, 'Attracted!', 400, 412, { font: 'display', size: 40, color: C.pink, alpha: seg(p, 0.65, 0.85) });
          Art.moe(g, 690, 440, 130, 'wow', { t, flip: true });
        },
      },
      {
        say: 'But the Lewis structure of $\\ce{O2}$ shows every electron in a pair. So Lewis structures get this wrong. We need a better model.',
        dur: 2.6,
        draw(g, p, t) {
          const y = 180, d = 120;
          Art.bond(g, 400 - d, y, 400 + d, y, { order: 2, width: 9 });
          [-1, 1].forEach((s) => {
            const x = 400 + s * d;
            Art.atom(g, x, y, 62, 'O', { face: 'wow', t, seed: s + 3 });
            [[s * 84, -44], [s * 84, 44]].forEach(([dx, dy]) => { [-1, 1].forEach((k) => Art.electron(g, x + dx + (k * 9 * dy) / Math.abs(dy) * 0.4, y + dy + k * 9, 6)); });
          });
          Art.text(g, 'Lewis structure of O₂', 400, 52, { font: 'display', size: 34 });
          const a = seg(p, 0.35, 0.55);
          g.save(); g.globalAlpha *= a; g.fillStyle = Art.alpha(C.red, 0.18); Art.round(g, 150, 298, 500, 110, 20); g.fill(); g.restore();
          Art.text(g, 'Unpaired electrons shown: 0', 400, 332, { size: 30, color: C.red, alpha: a });
          Art.text(g, 'Unpaired electrons measured: 2', 400, 376, { size: 30, color: C.leaf, alpha: seg(p, 0.55, 0.75) });
        },
      },
      {
        say: 'In <b>molecular orbital theory</b>, atomic orbitals combine like waves. Added <b>in phase</b>, they build up between the nuclei. That is a <b>bonding</b> orbital, lower in energy. Added <b>out of phase</b>, they cancel at a <b>node</b>. That is an <b>antibonding</b> orbital, higher in energy.',
        dur: 3.8,
        draw(g, p) {
          const X0 = 40, X1 = 560, n1 = 200, n2 = 400;
          const q = ease.inOut(seg(p, 0.1, 0.65));
          const wave = (x) => [Math.exp(-(((x - n1) / 88) ** 2)), Math.exp(-(((x - n2) / 88) ** 2))];
          const plot = (y0, sign, amp) => {
            const xs = [], vs = [];
            for (let x = X0; x <= X1; x += 4) {
              const [A, B] = wave(x);
              const before = Math.abs(A) > Math.abs(B) ? A : sign * B;
              xs.push(x); vs.push((A + sign * B) * q + before * (1 - q));
            }
            [[1, C.cyan], [-1, C.pink]].forEach(([s2, color]) => {
              g.fillStyle = Art.alpha(color, 0.66); g.beginPath(); g.moveTo(X0, y0);
              xs.forEach((x, i) => g.lineTo(x, y0 - Math.max(0, s2 * vs[i]) * s2 * amp));
              g.lineTo(X1, y0); g.closePath(); g.fill();
            });
            g.strokeStyle = 'rgba(247,242,255,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(X0, y0); g.lineTo(X1, y0); g.stroke();
            [n1, n2].forEach((x) => Art.ball(g, x, y0, 8, '#FFF4B0'));
          };
          plot(136, -1, 64);
          plot(350, 1, 64);
          const a = seg(p, 0.55, 0.8);
          Art.text(g, 'Out of phase: antibonding', X0, 34, { size: 26, align: 'left', color: C.pink, alpha: a });
          Art.text(g, 'In phase: bonding', X0, 240, { size: 26, align: 'left', color: C.cyan, alpha: a });
          // Node marker.
          g.save(); g.globalAlpha *= a; g.strokeStyle = C.sun; g.lineWidth = 3; g.setLineDash([6, 6]);
          g.beginPath(); g.moveTo(300, 60); g.lineTo(300, 204); g.stroke(); g.restore();
          Art.text(g, 'node', 300, 216, { size: 24, color: C.sun, alpha: a });
          Art.text(g, 'build-up between nuclei', 300, 392, { size: 24, color: C.sun, alpha: a });
          // Ladder.
          const lx = 690;
          g.fillStyle = 'rgba(14,6,30,.6)'; Art.round(g, 590, 20, 196, 390, 16); g.fill();
          Art.text(g, 'Energy', 688, 46, { size: 22, color: C.dim });
          g.strokeStyle = C.pink; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(lx - 36, lerp(216, 100, q)); g.lineTo(lx + 36, lerp(216, 100, q)); g.stroke();
          g.strokeStyle = C.cyan; g.beginPath(); g.moveTo(lx - 36, lerp(216, 332, q)); g.lineTo(lx + 36, lerp(216, 332, q)); g.stroke();
          Art.text(g, 'antibonding', lx, 74, { size: 21, color: C.pink, alpha: a });
          Art.text(g, 'bonding', lx, 362, { size: 21, color: C.cyan, alpha: a });
        },
      },
      {
        say: 'Two atomic orbitals always give <b>two</b> molecular orbitals. Electrons in bonding orbitals hold the atoms together, and electrons in antibonding orbitals undo that. In $\\ce{H2}$, both electrons are bonding: <b>bond order 1</b>. In $\\ce{He2}$, two are bonding and two antibonding: <b>bond order 0</b>, so no molecule.',
        dur: 4,
        draw(g, p) {
          const panel = (cx, title, n, q, color) => {
            Art.text(g, title, cx, 48, { font: 'display', size: 40 });
            const yU = 140, yL = 280;
            box(g, cx, yU, 74, 56, n > 2 ? n - 2 : 0, { stroke: C.pink, ecolor: C.pink });
            box(g, cx, yL, 74, 56, Math.min(2, n), { stroke: C.cyan, ecolor: C.cyan });
            Art.text(g, 'σ*1s', cx + 74, yU, { size: 24, color: C.pink, align: 'left' });
            Art.text(g, 'σ1s', cx + 74, yL, { size: 24, color: C.cyan, align: 'left' });
            const bo = (Math.min(2, n) - Math.max(0, n - 2)) / 2;
            Art.text(g, `(${Math.min(2, n)} − ${Math.max(0, n - 2)}) ÷ 2 = ${bo}`, cx, 362, { font: 'display', size: 30, color, alpha: q });
            Art.text(g, bo ? 'It exists' : 'No bond, no molecule', cx, 406, { size: 27, color, alpha: q });
          };
          panel(210, 'H₂', 2, seg(p, 0.1, 0.4), C.leaf);
          panel(590, 'He₂', 4, seg(p, 0.45, 0.75), C.red);
        },
      },
    ],
  });

  /* ---------- Bench: MO diagram filler ---------- */
  const Y_SLOT = { 5: 76, 4: 150, 3: 226, 2: 298, 1: 396, 0: 480 };
  const MO_H = 590;
  const mo = { d: K.diatomic('O2'), k: 0, fill: K.fill('O', 0), y: {}, auto: false, autoT: 0, flash: 0, won: new Set(), msg: '', bad: null, badT: 0, swapT: -9, t: 0 };
  const LVX = 400, BW = 64, BH = 48;
  function boxX(level, b) { return level.boxes === 1 ? LVX : LVX + (b === 0 ? -38 : 38); }
  function placedLevels() {
    const out = mo.fill.levels.map((L) => L.e.map(() => 0));
    mo.fill.seq.slice(0, mo.k).forEach((s) => { out[s.level][s.box]++; });
    return out;
  }
  function moPick(e) {
    const hits = [];
    mo.fill.levels.forEach((L, li) => { L.e.forEach((_, b) => { if (Math.abs(e.x - boxX(L, b)) < BW / 2 + 4 && Math.abs(e.y - mo.y[L.id]) < BH / 2 + 6) hits.push({ li, b }); }); });
    return hits[0] || null;
  }
  const moStage = Lab.stage('#c-mo', {
    h: MO_H, label: 'A molecular orbital energy diagram. Atomic orbitals on both sides feed bonding and antibonding levels in the middle.',
    onPointer(e) {
      const hit = moPick(e);
      if (e.type === 'hover') { moStage.canvas.style.cursor = hit ? 'pointer' : 'default'; return; }
      if (e.type !== 'down' || !hit) return;
      if (mo.k >= mo.fill.n) { say('<p>All the electrons are placed. Clear the diagram or pick another molecule.</p>'); return; }
      const next = mo.fill.seq[mo.k];
      if (hit.li === next.level && hit.b === next.box) { mo.k++; Lab.sound.pop(); paintMO(); return; }
      mo.bad = hit; mo.badT = moStage.t; Lab.sound.bad();
      const placed = placedLevels();
      if (hit.li > next.level) say(`<p><b>Not yet.</b> ${mo.fill.levels[next.level].name} is lower in energy and still has room. Fill from the bottom up. This is the Aufbau principle.</p>`);
      else if (hit.li < next.level) say('<p><b>That level is full.</b> A box holds 2 electrons at most, with opposite spins. This is the Pauli principle.</p>');
      else if (placed[hit.li][hit.b] === 1) say(`<p><b>Hund's rule:</b> put one electron in each box of ${mo.fill.levels[hit.li].name} before you pair any up.</p>`);
      else say('<p>Fill the other box of this level first.</p>');
    },
    draw(g, t, dt) {
      mo.t = t;
      if (mo.auto) {
        mo.autoT += dt;
        if (mo.autoT > 0.26) { mo.autoT = 0; if (mo.k < mo.fill.n) { mo.k++; Lab.sound.pop(); paintMO(); } else { mo.auto = false; } }
      }
      const F = mo.fill;
      F.levels.forEach((L, i) => {
        const target = Y_SLOT[i] - 0;
        mo.y[L.id] = mo.y[L.id] === undefined ? target : lerp(mo.y[L.id], target, clamp(dt * 3.2));
      });
      const placed = placedLevels();
      // Correlation lines.
      g.strokeStyle = 'rgba(247,242,255,.22)'; g.lineWidth = 2; g.setLineDash([6, 8]);
      const AO_L = 110, AO_R = 690, Y2P = 212, Y2S = 438;
      const link = (x0, y0, x1, y1) => { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
      F.levels.forEach((L) => {
        const from = /2s/.test(L.name) ? Y2S : Y2P;
        const xl = L.boxes === 2 ? LVX - 38 - BW / 2 : LVX - BW / 2, xr = L.boxes === 2 ? LVX + 38 + BW / 2 : LVX + BW / 2;
        link(AO_L + 96, from, xl, mo.y[L.id]);
        link(AO_R - 96, from, xr, mo.y[L.id]);
      });
      g.setLineDash([]);
      // Atomic orbitals: electrons leave as they go into the molecule.
      const eachA = Math.ceil(F.n / 2), eachB = Math.floor(F.n / 2);
      const left = [Math.max(0, eachA - Math.ceil(mo.k / 2)), Math.max(0, eachB - Math.floor(mo.k / 2))];
      [[AO_L, 0], [AO_R, 1]].forEach(([x, side]) => {
        const n = left[side];
        const in2s = Math.min(2, n), in2p = Math.max(0, n - 2);
        const p = [0, 0, 0];
        for (let i = 0; i < in2p; i++) p[i % 3]++;
        [-1, 0, 1].forEach((k, i) => box(g, x + k * 62, Y2P, 56, 44, p[i], { ecolor: C.electron }));
        box(g, x, Y2S, 56, 44, in2s, { ecolor: C.electron });
        Art.text(g, '2p', x, Y2P - 44, { font: 'display', size: 28, color: C.dim });
        Art.text(g, '2s', x, Y2S - 44, { font: 'display', size: 28, color: C.dim });
        Art.text(g, mo.d.el + ' atom', x, 56, { font: 'display', size: 30 });
      });
      // Molecular orbitals.
      const shake = (li, b) => (mo.bad && mo.bad.li === li && mo.bad.b === b && t - mo.badT < 0.4 ? Math.sin((t - mo.badT) * 44) * 6 : 0);
      const next = F.seq[mo.k];
      F.levels.forEach((L, li) => {
        const y = mo.y[L.id], col = L.bonding ? C.cyan : C.pink;
        L.e.forEach((_, b) => {
          const isNext = next && next.level === li && next.box === b;
          box(g, boxX(L, b) + shake(li, b), y, BW, BH, placed[li][b], { stroke: col, ecolor: col, fill: isNext ? Art.alpha(C.sun, 0.14 + Math.sin(t * 4) * 0.08) : undefined, hi: isNext });
        });
        const lx = LVX - (L.boxes === 2 ? 38 + BW / 2 : BW / 2) - 12;
        Art.text(g, L.name, lx, y, { size: 25, color: col, align: 'right', halo: true });
      });
      // Order switch callout.
      if (t - mo.swapT < 2.6) {
        const a = clamp((2.6 - (t - mo.swapT)) * 2);
        Art.text(g, 'σ2p and π2p swap!', LVX + 90, Y_SLOT[3] + 36, { font: 'display', size: 28, color: C.sun, align: 'left', alpha: a, halo: true });
      }
      Art.formula(g, mo.d.id, LVX, 30, { size: 40 });
      // Tally.
      let bond = 0, anti = 0;
      F.levels.forEach((L, li) => { const s = placed[li].reduce((a, b) => a + b, 0); if (L.bonding) bond += s; else anti += s; });
      const bo = (bond - anti) / 2;
      Art.text(g, `Bond order = (${bond} − ${anti}) ÷ 2 = ${K.boText(bo)}`, 400, 554, { font: 'display', size: 30, color: mo.k === F.n ? C.sun : C.dim });
      Art.text(g, `${F.n - mo.k} left`, 110, 554, { size: 25, color: mo.k === F.n ? C.leaf : C.ink });
      if (mo.k === F.n) Art.text(g, F.para ? 'Paramagnetic' : 'Diamagnetic', 700, 554, { size: 25, color: F.para ? C.pink : C.cyan });
    },
  });
  function say(html) { Lab.$('#mo-say').innerHTML = Lab.texString(html); }
  function paintMO() {
    const F = mo.fill;
    let b = 0, a = 0;
    F.seq.slice(0, mo.k).forEach((s) => { if (F.levels[s.level].bonding) b++; else a++; });
    Lab.$('#mo-name').textContent = mo.d.name;
    Lab.$('#mo-b').textContent = b;
    Lab.$('#mo-a').textContent = a;
    Lab.$('#mo-o').textContent = K.boText((b - a) / 2);
    const done = mo.k === F.n;
    Lab.$('#mo-m').textContent = done ? (F.para ? `Paramagnetic, ${F.unpaired} unpaired` : 'Diamagnetic') : 'Keep filling';
    Lab.$('#mo-next').disabled = done;
    Lab.$('#mo-auto').disabled = done;
    const zFirst = EL[mo.d.el].z <= 7;
    const orderNote = zFirst ? 'For Li through N, π2p is below σ2p.' : 'For O, F and Ne, σ2p is below π2p.';
    if (!done) say(`<p>${F.n} valence electrons to place. ${orderNote} The glowing box is next. Tap it, or tap a wrong one to see why it is wrong.</p>`);
    else {
      const verdict = F.bo === 0 ? ' A bond order of 0 means this molecule is not stable.' : '';
      const mag = F.para ? ` The ${F.unpaired} unpaired electron${F.unpaired > 1 ? 's make' : ' makes'} it attracted to a magnet.` : ' All electrons are paired, so a magnet does not attract it.';
      say(`<p><b>Done.</b> Bond order $= \\dfrac{${F.bonding} - ${F.anti}}{2} = ${K.boText(F.bo)}$.${verdict}${mag}${mo.d.len ? ` Measured bond length: ${mo.d.len} pm.` : ''}</p>`);
      if (!mo.won.has(mo.d.id)) { mo.won.add(mo.d.id); Lab.collection.award(1); Lab.sound.good(); }
    }
  }
  function setMO(id) {
    const d = K.diatomic(id);
    const before = mo.fill.order.join();
    mo.d = d; mo.fill = K.fill(d.el, d.charge); mo.k = 0; mo.auto = false;
    // Keep level heights so the swap between N2 and O2 animates.
    if (before !== mo.fill.order.join()) mo.swapT = moStage.t;
    paintMO();
  }
  Lab.$('#mo-sp').innerHTML = K.DIATOMICS.map((d) => `<button type="button" data-value="${d.id}" aria-pressed="${d.id === 'O2'}">${Lab.fHTML(d.id)}</button>`).join('');
  Lab.segmented('#mo-sp', setMO);
  Lab.$('#mo-next').addEventListener('click', () => { if (mo.k < mo.fill.n) { mo.k++; Lab.sound.pop(); paintMO(); } });
  Lab.$('#mo-auto').addEventListener('click', () => { mo.auto = true; mo.autoT = 0; if (Lab.reducedMotion || Lab.isAuto) { mo.k = mo.fill.n; mo.auto = false; paintMO(); } });
  Lab.$('#mo-clear').addEventListener('click', () => { mo.k = 0; mo.auto = false; paintMO(); });
  paintMO();
  Lab.$('#mo-table').innerHTML = K.DIATOMICS.map((d) => {
    const f = K.fill(d.el, d.charge);
    return `<tr><td>$${K.tex(d.id)}$</td><td>${f.n}</td><td><b>${K.boText(f.bo)}</b></td><td>${f.unpaired}</td><td>${f.para ? 'Paramagnetic' : 'Diamagnetic'}</td><td>${d.len ? d.len + ' pm' : 'not stable'}</td></tr>`;
  }).join('');
  void wander;
});
