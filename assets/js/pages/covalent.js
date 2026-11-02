/* Lesson 8.2: Covalent bonds and polarity. The energy curve is a real Morse potential from CovalentKit. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander } = Lab;
  const C = Art.C;
  const K = window.CovalentKit;
  const TAU = Math.PI * 2;

  function eDot(g, x, y, r = 7, alpha = 1) {
    if (alpha <= 0) return;
    const prev = g.globalAlpha;
    g.globalAlpha = prev * alpha;
    g.fillStyle = Art.alpha(C.electron, 0.26); g.beginPath(); g.arc(x, y, r * 1.9, 0, TAU); g.fill();
    Art.ball(g, x, y, r, C.electron);
    g.globalAlpha = prev;
  }
  /** A soft blue electron cloud. Overlapping clouds brighten, which is where the shared electrons are. */
  function cloud(g, x, y, R, alpha = 1, color = '#3FB9F0') {
    const prevOp = g.globalCompositeOperation;
    g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(x, y, 0, x, y, R);
    gr.addColorStop(0, Art.alpha(color, 0.5 * alpha)); gr.addColorStop(0.55, Art.alpha(color, 0.24 * alpha)); gr.addColorStop(1, Art.alpha(color, 0));
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, R, 0, TAU); g.fill();
    g.globalCompositeOperation = prevOp;
  }

  /* ---------- Story 1: sharing ---------- */
  const H_Y = 210;
  Lab.story('#story-share', {
    title: 'How two hydrogen atoms bond',
    scenes: [
      {
        say: 'Here are two hydrogen atoms, far apart. Each has <b>one electron</b> and would like two. Neither will give its electron away.',
        dur: 2.6,
        draw(g, p, t) {
          [[170, 1], [630, -1]].forEach(([x, look], k) => {
            cloud(g, x, H_Y, 108);
            Art.atom(g, x, H_Y, 48, 'H', { face: 'sad', t, seed: k, look: [look, 0] });
            const a = t * (k ? -1.3 : 1.3) + k;
            eDot(g, x + Math.cos(a) * 78, H_Y + Math.sin(a) * 78, 9);
            Art.text(g, 'one electron', x, 354, { size: 28, color: C.cyan, alpha: seg(p, 0.2 + k * 0.2, 0.4 + k * 0.2) });
          });
          Art.bubble(g, 'I want two.', 400, 150, { w: 200, size: 26, side: 'down', alpha: seg(p, 0.55, 0.75) });
          Art.moe(g, 400, 430, 104, 'happy', { t });
        },
      },
      {
        say: 'Bring them closer. Now each electron feels <b>both</b> nuclei. The left nucleus pulls on the right electron, and the right nucleus pulls on the left electron. These are <b>attractions</b>.',
        dur: 3.2,
        draw(g, p, t) {
          const q = ease.inOut(seg(p, 0, 0.4));
          const d = lerp(230, 125, q);
          const x1 = 400 - d, x2 = 400 + d;
          cloud(g, x1, H_Y, 108); cloud(g, x2, H_Y, 108);
          Art.atom(g, x1, H_Y, 44, 'H', { face: 'wow', t, look: [1, 0], seed: 1 });
          Art.atom(g, x2, H_Y, 44, 'H', { face: 'wow', t, look: [-1, 0], seed: 2 });
          const e1 = { x: x1 + 64, y: H_Y - 26 }, e2 = { x: x2 - 64, y: H_Y + 26 };
          eDot(g, e1.x, e1.y, 9); eDot(g, e2.x, e2.y, 9);
          const a = seg(p, 0.4, 0.75);
          Art.arrow(g, e2.x - 20, e2.y + 10, x1 + 40, H_Y + 34, { color: C.leaf, w: 6, head: 20, p: a, curve: 16 });
          Art.arrow(g, e1.x + 20, e1.y - 10, x2 - 40, H_Y - 34, { color: C.leaf, w: 6, head: 20, p: a, curve: 16 });
          Art.text(g, 'attraction', 400, 96, { font: 'display', size: 36, color: C.leaf, alpha: seg(p, 0.65, 0.85) });
          Art.text(g, 'each nucleus pulls on the other electron', 400, 356, { size: 27, alpha: seg(p, 0.75, 0.95) });
        },
      },
      {
        say: 'But there are <b>repulsions</b> too. The two positive nuclei push apart, and so do the two electrons. Too close and the pushing wins. A bond forms at the distance where pull and push <b>balance</b>.',
        dur: 3.2,
        draw(g, p, t) {
          const q = ease.inOut(seg(p, 0, 0.35));
          const d = lerp(125, 92, q);
          const x1 = 400 - d, x2 = 400 + d;
          cloud(g, x1, H_Y, 108); cloud(g, x2, H_Y, 108);
          Art.atom(g, x1, H_Y, 40, 'H', { face: 'grumpy', t, seed: 1, look: [1, 0] });
          Art.atom(g, x2, H_Y, 40, 'H', { face: 'grumpy', t, seed: 2, look: [-1, 0] });
          Art.arrow(g, x1 - 46, H_Y, x1 - 126, H_Y, { color: C.red, w: 8, head: 24, p: seg(p, 0.3, 0.55) });
          Art.arrow(g, x2 + 46, H_Y, x2 + 126, H_Y, { color: C.red, w: 8, head: 24, p: seg(p, 0.3, 0.55) });
          eDot(g, 400 + wander(1, t) * 3, H_Y - 62, 9); eDot(g, 400 + wander(2, t) * 3, H_Y + 62, 9);
          Art.arrow(g, 400, H_Y - 80, 400, H_Y - 128, { color: C.red, w: 6, head: 18, p: seg(p, 0.45, 0.7) });
          Art.arrow(g, 400, H_Y + 80, 400, H_Y + 128, { color: C.red, w: 6, head: 18, p: seg(p, 0.45, 0.7) });
          Art.text(g, 'nuclei repel', 130, 130, { font: 'display', size: 32, color: C.red, alpha: seg(p, 0.45, 0.6) });
          Art.text(g, 'electrons repel', 610, 74, { font: 'display', size: 32, color: C.red, alpha: seg(p, 0.6, 0.75) });
          Art.text(g, 'Pull and push balance at one distance.', 400, 396, { size: 28, color: C.sun, alpha: seg(p, 0.75, 0.95) });
        },
      },
      {
        say: 'At that distance, the two clouds overlap. Both electrons spend time between the nuclei, and <b>each atom can count both</b>. Each hydrogen now sees 2 electrons. That is a <b>covalent bond</b>.',
        dur: 3,
        draw(g, p, t) {
          const q = ease.inOut(seg(p, 0, 0.5));
          const d = 80;
          const x1 = 400 - d, x2 = 400 + d;
          cloud(g, x1, H_Y, 130); cloud(g, x2, H_Y, 130);
          cloud(g, 400, H_Y, 80, q, '#7FE3FF');
          Art.atom(g, x1, H_Y, 40, 'H', { face: 'grin', t, seed: 1, look: [1, 0] });
          Art.atom(g, x2, H_Y, 40, 'H', { face: 'grin', t, seed: 2, look: [-1, 0] });
          eDot(g, 400, H_Y - 24 + wander(1, t * 1.2) * 4, 10);
          eDot(g, 400, H_Y + 24 + wander(2, t * 1.2) * 4, 10);
          Art.ring(g, x1, H_Y, 134, { color: Art.alpha(C.leaf, 0.85), w: 4, dash: [8, 7], p: seg(p, 0.45, 0.75) });
          Art.ring(g, x2, H_Y, 134, { color: Art.alpha(C.sun, 0.85), w: 4, dash: [8, 7], p: seg(p, 0.55, 0.85) });
          Art.text(g, 'sees 2', 120, 112, { font: 'display', size: 32, color: C.leaf, alpha: seg(p, 0.6, 0.8) });
          Art.text(g, 'sees 2', 680, 112, { font: 'display', size: 32, color: C.sun, alpha: seg(p, 0.7, 0.9) });
          Art.text(g, 'The shared pair sits between the nuclei.', 400, 400, { size: 28, alpha: seg(p, 0.7, 0.9) });
        },
      },
      {
        say: 'Chemists write this as a dash: <b>H-H</b>. Each dash is one shared pair. For $\\ce{H2}$, the nuclei end up <b>74 pm</b> apart, and it takes <b>436 kJ/mol</b> to pull them apart again.',
        dur: 3,
        draw(g, p, t, { W }) {
          const q = ease.back(seg(p, 0, 0.35));
          Art.bond(g, W / 2 - 110, 170, W / 2 + 110, 170, { width: 12 });
          Art.atom(g, W / 2 - 110, 170, 62 * q, 'H', { face: 'happy', t, seed: 1 });
          Art.atom(g, W / 2 + 110, 170, 62 * q, 'H', { face: 'happy', t, seed: 2 });
          Art.text(g, 'shared pair', W / 2, 62, { font: 'display', size: 32, color: C.cyan, alpha: seg(p, 0.2, 0.4) });
          Art.arrow(g, W / 2, 84, W / 2, 158, { color: C.cyan, w: 5, head: 16, p: seg(p, 0.25, 0.45) });
          Art.text(g, '74 pm', 230, 300, { font: 'display', size: 62, color: C.sun, alpha: seg(p, 0.35, 0.55) });
          Art.text(g, 'bond length', 230, 356, { size: 28, alpha: seg(p, 0.4, 0.6) });
          Art.text(g, '436 kJ/mol', 570, 300, { font: 'display', size: 62, color: C.pink, alpha: seg(p, 0.6, 0.8) });
          Art.text(g, 'bond energy', 570, 356, { size: 28, alpha: seg(p, 0.65, 0.85) });
        },
      },
    ],
  });

  /* ---------- Bench: H2 energy well ---------- */
  const W_H = 540;
  const R_MIN = 35, R_MAX = 320;
  const X0 = 130, SCALE = 2; // Stage units per pm on the shared axis.
  const xOf = (r) => X0 + r * SCALE;
  const rOf = (x) => clamp((x - X0) / SCALE, R_MIN, R_MAX);
  const yOf = (E) => 244 + ((350 - E) / 850) * 256;
  const well = { r: 240, v: 0, dragging: false, mode: 'roll', trail: [] };
  const wellStage = Lab.stage('#c-well', {
    h: W_H, label: 'Two hydrogen atoms above an energy curve with a minimum at 74 picometers. The right atom lines up with a dot on the curve.',
    onPointer(e) {
      if (e.type === 'hover') { wellStage.canvas.style.cursor = 'ew-resize'; return; }
      if (e.type === 'down') { well.dragging = true; well.v = 0; well.r = rOf(e.x); }
      if (e.type === 'move' && well.dragging) { well.r = rOf(e.x); well.v = 0; }
      if (e.type === 'up') well.dragging = false;
      paintWell();
    },
    draw(g, t, dt) {
      if (!well.dragging && well.mode === 'roll') {
        const sub = 4, h = Math.min(dt, 0.05) / sub;
        for (let i = 0; i < sub; i++) {
          const a = -K.morseSlope(well.r) * 130 - 1.5 * well.v;
          well.v += a * h; well.r += well.v * h;
          if (well.r < R_MIN) { well.r = R_MIN; well.v = Math.abs(well.v) * 0.4; }
          if (well.r > R_MAX) { well.r = R_MAX; well.v = 0; }
        }
        if (Math.abs(well.v) > 0.2 && Math.floor(t * 8) !== Math.floor((t - dt) * 8)) paintWell();
      }
      const r = well.r, E = K.morse(r), slope = K.morseSlope(r);
      // Top: the atoms, on the same scale as the axis below.
      const overlap = clamp(1 - (r - 74) / 130);
      const xL = xOf(0), xR = xOf(r), yA = 112;
      cloud(g, xL, yA, 104); cloud(g, xR, yA, 104);
      if (overlap > 0) cloud(g, (xL + xR) / 2, yA, 66, overlap, '#7FE3FF');
      const mood = r < 56 ? 'grumpy' : Math.abs(r - 74) < 22 ? 'grin' : r < 170 ? 'happy' : 'sad';
      Art.atom(g, xL, yA, 34, 'H', { face: mood, t, look: [1, 0], seed: 1 });
      Art.atom(g, xR, yA, 34, 'H', { face: mood, t, look: [-1, 0], seed: 2 });
      const mid = (xL + xR) / 2;
      const a1 = t * 1.6, a2 = t * 1.6 + 2;
      const homeL = { x: xL + Math.cos(a1) * 62, y: yA + Math.sin(a1) * 62 }, homeR = { x: xR + Math.cos(a2) * 62, y: yA + Math.sin(a2) * 62 };
      const shareL = { x: mid, y: yA - 26 + wander(1, t) * 4 }, shareR = { x: mid, y: yA + 26 + wander(2, t) * 4 };
      eDot(g, lerp(homeL.x, shareL.x, overlap), lerp(homeL.y, shareL.y, overlap), 8);
      eDot(g, lerp(homeR.x, shareR.x, overlap), lerp(homeR.y, shareR.y, overlap), 8);
      // Force arrow.
      const push = -slope; // Positive means pushed apart.
      const size = clamp(Math.abs(push) * 7, 0, 90);
      if (size > 8) Art.arrow(g, xR + (push > 0 ? 42 : -42), yA - 52, xR + (push > 0 ? 42 + size : -42 - size), yA - 52, { color: push > 0 ? C.red : C.leaf, w: 7, head: 20 });
      const msg = r < 58 ? ['Too close: the nuclei repel', C.red] : Math.abs(r - 74) < 7 ? ['The bond: lowest energy', C.leaf] : r < 200 ? ['Attraction pulls them in', C.cyan] : ['Far apart: they barely notice', C.dim];
      Art.text(g, msg[0], 780, 30, { font: 'display', size: 30, color: msg[1], align: 'right', halo: true });
      // Link the atom to the dot on the curve.
      g.strokeStyle = 'rgba(247,242,255,.28)'; g.lineWidth = 2.5; g.setLineDash([6, 7]);
      g.beginPath(); g.moveTo(xR, yA + 42); g.lineTo(xR, yOf(clamp(E, -436, 350))); g.stroke(); g.setLineDash([]);
      // Bottom: the graph.
      g.save();
      g.fillStyle = 'rgba(14,6,30,.5)'; Art.round(g, 60, 226, 730, 298, 16); g.fill();
      g.beginPath(); g.rect(60, 232, 730, 280); g.clip();
      const pts = [];
      for (let q = 30; q <= 322; q += 2) pts.push([xOf(q), yOf(K.morse(q))]);
      // Well shading.
      const shade = g.createLinearGradient(0, yOf(0), 0, yOf(-436));
      shade.addColorStop(0, 'rgba(61,220,132,0)'); shade.addColorStop(1, 'rgba(61,220,132,.3)');
      g.fillStyle = shade; g.beginPath();
      pts.forEach((q, i) => { if (q[1] >= yOf(0)) { g.lineTo(q[0], q[1]); } else if (i === 0) g.moveTo(q[0], yOf(0)); });
      g.lineTo(xOf(322), yOf(0)); g.lineTo(xOf(36), yOf(0)); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(247,242,255,.35)'; g.lineWidth = 2; g.setLineDash([7, 7]);
      g.beginPath(); g.moveTo(70, yOf(0)); g.lineTo(790, yOf(0)); g.stroke(); g.setLineDash([]);
      g.strokeStyle = C.sun; g.lineWidth = 6; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.stroke();
      // The minimum.
      g.strokeStyle = Art.alpha(C.leaf, 0.85); g.lineWidth = 2.5; g.setLineDash([6, 6]);
      g.beginPath(); g.moveTo(xOf(74), yOf(-436)); g.lineTo(xOf(74), 502); g.moveTo(70, yOf(-436)); g.lineTo(xOf(74), yOf(-436)); g.stroke(); g.setLineDash([]);
      g.restore();
      Art.text(g, '74 pm', xOf(74) + 8, 500, { size: 22, color: C.leaf, align: 'left' });
      Art.text(g, '−436', 66, yOf(-436) - 18, { size: 22, color: C.leaf, align: 'left' });
      Art.text(g, '0', 66, yOf(0) - 16, { size: 22, color: C.dim, align: 'left' });
      Art.text(g, 'Energy, kJ/mol', 240, 254, { size: 22, color: C.dim, align: 'left' });
      Art.text(g, 'Separate atoms: zero energy', 770, yOf(0) - 18, { size: 22, color: C.dim, align: 'right' });
      Art.text(g, 'Distance between nuclei', 770, 500, { size: 22, color: C.dim, align: 'right' });
      Art.arrow(g, 620, 464, 760, 464, { color: C.dim, w: 3, head: 10 });
      const yBall = yOf(clamp(E, -436, 350));
      Art.glow(g, xR, yBall, 34, C.pink, 0.7);
      Art.ball(g, xR, yBall, 13, C.pink);
    },
  });
  wellStage.canvas.style.touchAction = 'pan-y';
  function paintWell() {
    const r = well.r, E = K.morse(r), s = K.morseSlope(r);
    Lab.$('#well-r').textContent = Math.round(r) + ' pm';
    Lab.$('#well-e').textContent = (E < 0 ? '−' : '+') + Math.abs(Math.round(E)) + ' kJ/mol';
    Lab.$('#well-f').textContent = Math.abs(s) < 0.15 ? (r > 200 ? 'Almost none' : 'Balanced') : s > 0 ? 'Pulled together' : 'Pushed apart';
    Lab.$('#well-say').innerHTML = r < 67 ? 'The nuclei are jammed together and the energy shoots up. The atoms get pushed apart.'
      : Math.abs(r - 74) < 7 ? '<b>This is the bond.</b> Attraction and repulsion balance at the bottom of the well. Getting out of here takes 436 kJ/mol, which is the <b>bond energy</b>.'
        : r < 200 ? 'The clouds overlap more as the atoms get closer, and the energy keeps dropping. The slope of the curve is the force pulling them in.'
          : 'At this distance, the atoms hardly feel each other. The energy is close to zero. Our zero means separate atoms.';
  }
  Lab.segmented('#well-mode', (v) => { well.mode = v; well.v = 0; });
  Lab.$('#well-pull').addEventListener('click', () => { well.r = 300; well.v = 0; Lab.sound.pop(); paintWell(); });
  Lab.$('#well-push').addEventListener('click', () => { well.r = 40; well.v = 0; Lab.sound.pop(); paintWell(); });
  paintWell();
  if (Lab.isAuto) window.__well = (r) => { well.mode = 'stay'; well.r = r; paintWell(); wellStage.redraw(); };

  /* ---------- Bench: bond strength tester ---------- */
  const ord = { fam: 'C-C', E: 0, gaps: [0, 0, 0] };
  const ordStage = Lab.stage('#c-orders', {
    h: 460, label: 'Single, double and triple bonds drawn to scale with bars for their bond energies. Bonds snap when you put in enough energy.',
    draw(g, t, dt) {
      const F = K.FAMILIES[ord.fam];
      const rows = F.rows;
      const y0 = rows.length === 3 ? 92 : 150, gapY = 134;
      // Energy marker line.
      const barX = 372, barW = 396, MAX = 1100;
      const xE = barX + (ord.E / MAX) * barW;
      rows.forEach(([order, len, energy], i) => {
        const y = y0 + i * gapY;
        const broken = ord.E >= energy;
        ord.gaps[i] = lerp(ord.gaps[i], broken ? 1 : 0, clamp(dt * 5));
        const q = ord.gaps[i];
        const stress = clamp(ord.E / energy);
        const amp = 1 + stress * 8;
        const freq = 1.6 + Math.sqrt(energy) * 0.26;
        const vib = Math.sin(t * freq + i) * amp * (1 - q);
        const half = (len * 0.72) / 2 + vib + stress * 8 * (1 - q) + q * 44;
        const cx = 170;
        const ra = 40, rb = 40;
        if (q < 0.4) Art.bond(g, cx - half, y, cx + half, y, { order, width: 7, color: stress > 0.8 ? C.fire : undefined });
        else { Art.burst(g, cx, y, seg(q, 0.4, 0.98), { r: 60, seed: i }); }
        Art.atom(g, cx - half, y, ra, F.a, { face: q > 0.5 ? 'sad' : stress > 0.7 ? 'grumpy' : 'happy', t, seed: i, look: [1, 0] });
        Art.atom(g, cx + half, y, rb, F.b, { face: q > 0.5 ? 'sad' : stress > 0.7 ? 'grumpy' : 'happy', t, seed: i + 5, look: [-1, 0] });
        Art.text(g, ['Single', 'Double', 'Triple'][i], barX, y - 44, { font: 'display', size: 28, align: 'left', color: broken ? C.red : C.ink });
        Art.text(g, `${len} pm`, barX + 118, y - 44, { size: 25, align: 'left', color: C.cyan });
        // Energy bar.
        g.fillStyle = 'rgba(14,6,30,.72)'; Art.round(g, barX, y - 22, barW, 44, 12); g.fill();
        const bw = (energy / MAX) * barW;
        const gr = g.createLinearGradient(barX, 0, barX + bw, 0);
        gr.addColorStop(0, broken ? '#8A3B4A' : '#2FA36A'); gr.addColorStop(1, broken ? C.red : C.leaf);
        g.fillStyle = gr; Art.round(g, barX + 3, y - 19, Math.max(12, bw - 6), 38, 10); g.fill();
        Art.text(g, `${energy} kJ/mol`, barX + 14, y + 1, { size: 25, align: 'left', color: '#fff', halo: true });
        if (broken) Art.text(g, 'Snap!', cx, y + 56, { font: 'display', size: 28, color: C.red, alpha: q });
      });
      // The line showing the energy supplied.
      const top = y0 - 36, bot = y0 + (rows.length - 1) * gapY + 36;
      if (ord.E > 0) {
        g.strokeStyle = C.sun; g.lineWidth = 4; g.setLineDash([9, 7]);
        g.beginPath(); g.moveTo(xE, top); g.lineTo(xE, bot); g.stroke(); g.setLineDash([]);
      }
      Art.text(g, 'To scale', 170, 24, { size: 22, color: C.dim });
    },
  });
  function paintOrders() {
    const F = K.FAMILIES[ord.fam];
    const rows = F.rows;
    const broken = rows.filter((r) => ord.E >= r[2]).length;
    const dbl = rows[1], sgl = rows[0];
    const ratio = (dbl[2] / sgl[2]).toFixed(2);
    let extra = '';
    if (ord.fam === 'N-N') extra = ' The N≡N triple bond is why $\\ce{N2}$ gas is so unreactive. Lone pairs make the N-N single bond unusually weak.';
    else if (ord.fam === 'O-O') extra = ' Oxygen has no common triple bond between two O atoms.';
    else extra = ` A double bond here is ${ratio} times as strong as a single.`;
    Lab.$('#ord-say').innerHTML = Lab.texString(`${broken === 0 ? 'All the bonds hold.' : broken === rows.length ? 'All the bonds have snapped.' : `${broken} of ${rows.length} snapped.`} More pairs mean shorter and stronger. Stronger bonds also vibrate faster, like a stiffer spring.${extra}`);
  }
  Lab.segmented('#ord-fam', (v) => { ord.fam = v; ord.gaps = [0, 0, 0]; paintOrders(); });
  Lab.bind('#ord-e', '#ord-e-out', (v) => v + ' kJ/mol', (v) => { ord.E = v; paintOrders(); ordStage.redraw(); });
  Lab.$('#hx-table').innerHTML = K.HX.map(([b, len, e]) => `<tr><td><b>${b}</b></td><td>${len}</td><td>${e}</td></tr>`).join('');

  /* ---------- The tug of war, used in both the story and the bench ---------- */
  const radOf = (e) => clamp(EL[e].rcov * 0.5, 44, 70);
  /** Draws the two atoms pulling a rope. q eases in the pull: 0 is even, 1 is the true difference. */
  function tug(g, a, b, q, t, o = {}) {
    const W = 800, yR = o.y || 170;
    const d = (EL[b].en - EL[a].en) * q;
    const abs = Math.abs(d);
    const ionic = abs > K.CUT.high;
    const frac = clamp(abs / 2.4) * Math.sign(d);
    const xA = 124 - Math.max(0, -frac) * 14 + Math.max(0, frac) * 26;
    const xB = 676 + Math.max(0, frac) * 14 - Math.max(0, -frac) * 26;
    const knot = lerp(400, frac > 0 ? xB - radOf(b) - 34 : xA + radOf(a) + 34, Math.abs(frac));
    const rA = radOf(a), rB = radOf(b);
    // Rope.
    const sag = 6 + (1 - Math.abs(frac)) * 8;
    const tense = wander(3, t * 6) * Math.abs(frac) * 2;
    if (!ionic) {
      g.strokeStyle = '#D9C9A8'; g.lineWidth = 8; g.lineCap = 'round';
      g.beginPath(); g.moveTo(xA + rA * 0.8, yR); g.quadraticCurveTo((xA + knot) / 2, yR + sag + tense, knot, yR); g.quadraticCurveTo((xB + knot) / 2, yR + sag - tense, xB - rB * 0.8, yR); g.stroke();
    } else {
      g.strokeStyle = 'rgba(217,201,168,.35)'; g.lineWidth = 6; g.setLineDash([12, 12]);
      g.beginPath(); g.moveTo(xA + rA, yR); g.lineTo(xB - rB, yR); g.stroke(); g.setLineDash([]);
    }
    // Shared electrons.
    cloud(g, knot, yR, 64 + abs * 14, 1, '#7FE3FF');
    eDot(g, knot, yR - 13 + wander(1, t) * 2, 10); eDot(g, knot, yR + 13 + wander(2, t) * 2, 10);
    // Atoms.
    const winA = d < -0.02, winB = d > 0.02;
    Art.atom(g, xA, yR, rA, a, { face: !winA && !winB ? 'happy' : winA ? 'grin' : ionic ? 'sad' : 'grumpy', t, look: [1, 0], seed: 1, charge: ionic ? (winA ? '-' : '+') : null });
    Art.atom(g, xB, yR, rB, b, { face: !winA && !winB ? 'happy' : winB ? 'grin' : ionic ? 'sad' : 'grumpy', t, look: [-1, 0], seed: 2, charge: ionic ? (winB ? '-' : '+') : null });
    // Partial charges and dipole arrow.
    const pol = abs >= K.CUT.low && !ionic;
    if (pol) {
      const al = o.partial === undefined ? 1 : o.partial;
      Art.text(g, winB ? 'δ+' : 'δ−', xA, yR - rA - 30, { font: 'display', size: 36, color: winB ? '#FF7AB8' : '#6EC6FF', alpha: al });
      Art.text(g, winB ? 'δ−' : 'δ+', xB, yR - rB - 30, { font: 'display', size: 36, color: winB ? '#6EC6FF' : '#FF7AB8', alpha: al });
      const y = yR - 92, x0 = winB ? xA + rA + 40 : xB - rB - 40, x1 = winB ? xB - rB - 40 : xA + rA + 40;
      Art.arrow(g, x0, y, x1, y, { color: C.cyan, w: 7, head: 22, alpha: al });
      const cx = lerp(x0, x1, 0.12);
      g.save(); g.globalAlpha *= al; g.strokeStyle = C.cyan; g.lineWidth = 6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx, y - 12); g.lineTo(cx, y + 12); g.stroke(); g.restore();
    }
    void W;
    return { knot, ionic, abs };
  }
  /** The nonpolar to ionic scale, with a marker. */
  function scaleBar(g, y, value, alpha = 1) {
    const x0 = 60, x1 = 740, MAX = 3.4, X = (v) => lerp(x0, x1, v / MAX);
    const prev = g.globalAlpha; g.globalAlpha = prev * alpha;
    const zones = [[0, K.CUT.low, '#3DDC84'], [K.CUT.low, K.CUT.high, '#FFD23F'], [K.CUT.high, MAX, '#FF5A6B']];
    zones.forEach(([a, b, col], i) => {
      g.fillStyle = Art.alpha(col, 0.86);
      Art.round(g, X(a) + (i ? 1.5 : 0), y, X(b) - X(a) - 3, 26, 8); g.fill();
    });
    Art.text(g, 'Polar', X((K.CUT.low + K.CUT.high) / 2), y + 13, { size: 21, color: '#22123A' });
    Art.text(g, 'Ionic', X((K.CUT.high + MAX) / 2), y + 13, { size: 21, color: '#22123A' });
    Art.text(g, 'Non', X(K.CUT.low / 2), y + 13, { size: 20, color: '#22123A' });
    [0.4, 1.8].forEach((v) => Art.text(g, String(v), X(v), y + 44, { size: 21, color: C.dim }));
    const mx = X(clamp(value, 0, MAX));
    g.fillStyle = '#fff'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(mx, y - 1); g.lineTo(mx - 15, y - 25); g.lineTo(mx + 15, y - 25); g.closePath(); g.fill(); g.stroke();
    g.globalAlpha = prev;
  }

  /* ---------- Story 2: polar bonds ---------- */
  Lab.story('#story-polar', {
    title: 'From fair sharing to no sharing at all',
    scenes: [
      {
        say: 'Two identical atoms pull equally hard, so the shared pair stays right in the middle. This is a <b>nonpolar covalent</b> bond. Chlorine has a difference of exactly 0.',
        dur: 2.8,
        draw(g, p, t) {
          tug(g, 'Cl', 'Cl', 1, t);
          Art.text(g, 'Nonpolar covalent', 400, 296, { font: 'display', size: 42, color: C.leaf, alpha: seg(p, 0.3, 0.55) });
          Art.text(g, '|3.16 − 3.16| = 0', 400, 346, { size: 26, alpha: seg(p, 0.4, 0.6) });
          scaleBar(g, 384, 0, seg(p, 0.5, 0.75));
        },
      },
      {
        say: 'Now hydrogen and chlorine. Chlorine pulls harder, so the electrons shift its way. Cl gets a <b>partial negative</b> charge, $\\delta-$, and H gets a <b>partial positive</b> charge, $\\delta+$. This is <b>polar covalent</b>.',
        dur: 3.4,
        draw(g, p, t) {
          const q = ease.inOut(seg(p, 0.1, 0.55));
          tug(g, 'H', 'Cl', q, t, { partial: seg(p, 0.5, 0.75) });
          Art.text(g, 'Polar covalent', 400, 296, { font: 'display', size: 42, color: C.sun, alpha: seg(p, 0.55, 0.75) });
          Art.text(g, '|3.16 − 2.20| = 0.96', 400, 346, { size: 26, alpha: seg(p, 0.6, 0.8) });
          scaleBar(g, 384, 0.96 * q, seg(p, 0.1, 0.3));
        },
      },
      {
        say: 'The arrow is a <b>dipole</b>. It points at the more electronegative atom, the negative end. The little cross marks the positive end. This notation appears on every exam.',
        dur: 2.8,
        draw(g, p, t) {
          tug(g, 'H', 'Cl', 1, t, { partial: 1 });
          const a = seg(p, 0.2, 0.5);
          g.fillStyle = Art.alpha(C.plum2, 0.95 * a); Art.round(g, 90, 280, 620, 112, 18); g.fill();
          Art.text(g, 'Arrow points to the negative end', 400, 316, { size: 30, color: C.cyan, alpha: a });
          Art.text(g, 'Cross is at the positive end', 400, 358, { size: 30, color: '#FF7AB8', alpha: seg(p, 0.45, 0.7) });
          Art.moe(g, 730, 438, 90, 'point', { t, flip: true });
        },
      },
      {
        say: 'Keep raising the difference. In $\\ce{NaCl}$, the difference is 2.23, and chlorine wins outright. The electron has effectively moved over. Now you have ions, and an <b>ionic</b> bond. There is no sharp line: it is one <b>smooth scale</b>.',
        dur: 3.4,
        draw(g, p, t) {
          const q = ease.inOut(seg(p, 0.1, 0.6));
          tug(g, 'Na', 'Cl', q, t, { partial: 0 });
          Art.text(g, 'Ionic', 400, 296, { font: 'display', size: 46, color: C.red, alpha: seg(p, 0.6, 0.8) });
          Art.text(g, '|3.16 − 0.93| = 2.23', 400, 346, { size: 26, alpha: seg(p, 0.65, 0.85) });
          scaleBar(g, 384, 2.23 * q, seg(p, 0.1, 0.3));
        },
      },
    ],
  });

  /* ---------- Bench: electronegativity tug of war ---------- */
  const TUG_ELS = ['H', 'Li', 'Na', 'K', 'Mg', 'Al', 'C', 'Si', 'N', 'P', 'O', 'S', 'F', 'Cl', 'Br', 'I'];
  const tugS = { a: 'H', b: 'Cl', shown: 0.96, q: 1, t0: 0, found: false };
  const tugStage = Lab.stage('#c-tug', {
    h: 450, label: 'Two atoms in a tug of war over a shared electron pair, with a scale from nonpolar to ionic below them.',
    draw(g, t, dt) {
      const age = t - tugS.t0;
      tugS.q = ease.out(clamp(age * 1.6));
      const r = tug(g, tugS.a, tugS.b, tugS.q, t);
      const d = K.diff(tugS.a, tugS.b);
      const kind = K.classify(tugS.a, tugS.b);
      Art.text(g, K.LABEL[kind], 400, 298, { font: 'display', size: 42, color: kind === 'nonpolar' ? C.leaf : kind === 'polar' ? C.sun : C.red, alpha: tugS.q });
      Art.text(g, `|${EL[tugS.a].en.toFixed(2)} − ${EL[tugS.b].en.toFixed(2)}| = ${d.toFixed(2)}`, 400, 344, { size: 26, alpha: tugS.q });
      scaleBar(g, 388, d * tugS.q);
      void r; void dt;
    },
  });
  function paintTug() {
    const { a, b } = tugS;
    const d = K.diff(a, b), kind = K.classify(a, b);
    Lab.$('#tug-en').textContent = `${a} ${EL[a].en.toFixed(2)}, ${b} ${EL[b].en.toFixed(2)}`;
    Lab.$('#tug-d').textContent = d.toFixed(2);
    Lab.$('#tug-k').textContent = K.LABEL[kind];
    const neg = K.negEnd(a, b), pos = neg === a ? b : a;
    const metal = (e) => /metal/i.test(EL[e].family || '') && !/non|loid/i.test(EL[e].family || '');
    let html;
    if (a === b) html = `<p>Identical atoms pull with identical strength. The pair is shared perfectly, so the bond is <b>nonpolar</b>.</p>`;
    else if (kind === 'nonpolar') html = `<p>${neg} pulls a little harder, but the difference is small. The bond is close enough to equal sharing to call it <b>nonpolar</b>.</p>`;
    else if (kind === 'polar') html = `<p>${neg} pulls harder, so it is $\\delta-$ and ${pos} is $\\delta+$. The arrow points to ${neg}.${d > 1.5 ? ' That is close to the ionic cutoff, so textbooks might label it differently.' : ''}</p>`;
    else html = `<p>${neg} wins outright: the electrons sit on ${neg} almost all the time. This acts like ${pos} cation and ${neg} anion, so it is an <b>ionic</b> bond.${metal(a) === metal(b) ? ' Most exams call only metal and nonmetal pairs ionic, so treat this one with care.' : ''}</p>`;
    Lab.$('#tug-say').innerHTML = Lab.texString(html);
    if (kind === 'polar' && d < 0.5 && !tugS.found) { tugS.found = true; Lab.collection.award(1); Lab.toast('Barely polar. You found one!'); }
  }
  const chips = (host, sel) => { Lab.$(host).innerHTML = TUG_ELS.map((e) => `<button type="button" data-value="${e}" aria-pressed="${e === sel}">${e}</button>`).join(''); };
  chips('#tug-a', 'H'); chips('#tug-b', 'Cl');
  Lab.segmented('#tug-a', (v) => { tugS.a = v; tugS.t0 = tugStage.t; paintTug(); });
  Lab.segmented('#tug-b', (v) => { tugS.b = v; tugS.t0 = tugStage.t; paintTug(); });
  paintTug();
});
