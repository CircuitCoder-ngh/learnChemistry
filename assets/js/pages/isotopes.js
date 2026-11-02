/* Lesson 2.2: Build an atom. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const TAU = Math.PI * 2;
  const ISO = Bank.all.isotopes.iso;
  const Z_COLOR = '#FF8A94', A_COLOR = C.sun, Q_COLOR = C.cyan;

  /* ---------- Shared drawings ---------- */
  const bright = (col) => (Art.lum(col) < 0.45 ? Art.mix(col, '#ffffff', 0.5) : col);
  const chargeText = (q) => (q === 0 ? '' : `${Math.abs(q) > 1 ? Math.abs(q) : ''}${q > 0 ? '+' : '−'}`);
  /** Isotope symbol with mass number, atomic number and charge. */
  function nuclide(g, x, y, A, Z, s, q, size = 70, o = {}) {
    const sub = Math.max(20, size * 0.46);
    g.font = `400 ${size}px ${Art.FONT_DISPLAY}`;
    const w = g.measureText(s).width;
    const left = x - w / 2 - 5;
    const a = o.alpha === undefined ? 1 : o.alpha;
    Art.text(g, s, x, y, { font: 'display', size, color: o.color || C.ink, alpha: a });
    Art.text(g, String(A), left, y - size * 0.34, { font: 'display', size: sub, align: 'right', color: A_COLOR, alpha: a });
    Art.text(g, String(Z), left, y + size * 0.36, { font: 'display', size: sub, align: 'right', color: Z_COLOR, alpha: a });
    if (q) Art.text(g, chargeText(q), x + w / 2 + 5, y - size * 0.34, { font: 'display', size: sub, align: 'left', color: Q_COLOR, alpha: a });
  }
  /** A deterministic blob of protons and neutrons. */
  function cluster(g, cx, cy, np, nn, r, t, o = {}) {
    const total = np + nn;
    const list = [];
    let a = np, b = nn;
    for (let i = 0; i < total; i++) {
      const pickP = b === 0 || (a > 0 && (a / (a + b) >= 0.5 ? i % 2 === 0 : i % 2 === 1));
      if (pickP) { list.push('p'); a--; } else { list.push('n'); b--; }
    }
    const spacing = r * 1.3;
    for (let i = total - 1; i >= 0; i--) {
      const ang = i * 2.39996 + (o.spin || 0), d = Math.sqrt(i) * spacing;
      const x = cx + Math.cos(ang) * d + wander(i + 3, t) * r * 0.08, y = cy + Math.sin(ang) * d + wander(i + 11, t) * r * 0.08;
      if (list[i] === 'p') Art.proton(g, x, y, r); else Art.neutron(g, x, y, r);
    }
    return spacing * Math.sqrt(total) + r;
  }
  function shells(g, cx, cy, radii, counts, t, o = {}) {
    radii.forEach((R, i) => {
      if (!counts[i]) return;
      g.strokeStyle = 'rgba(47,214,242,.3)'; g.lineWidth = 2; g.setLineDash([5, 7]);
      g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke(); g.setLineDash([]);
      for (let k = 0; k < counts[i]; k++) {
        const a = t * (0.5 - i * 0.1) + (k / counts[i]) * TAU + i;
        Art.electron(g, cx + Math.cos(a) * R, cy + Math.sin(a) * R, o.er || 7);
      }
    });
  }
  /** Horizontal row of small particles, for counting. */
  function tally(g, x, y, n, kind, q, gap) {
    for (let i = 0; i < n; i++) {
      const k = ease.back(clamp(q * (n + 3) - i));
      if (k <= 0) continue;
      const px = x + i * gap;
      if (kind === 'p') Art.proton(g, px, y, 9 * k); else if (kind === 'n') Art.neutron(g, px, y, 9 * k); else Art.electron(g, px, y, 7 * k);
    }
  }
  /** A simple element card, as on the periodic table. */
  function idCard(g, x, y, w, h, s, name, Z, o = {}) {
    const col = Art.elementColor(s);
    g.save(); g.translate(x, y); if (o.scaleX !== undefined) g.scale(o.scaleX, 1);
    g.fillStyle = C.plum2; g.strokeStyle = col; g.lineWidth = 5;
    Art.round(g, -w / 2, -h / 2, w, h, 20); g.fill(); g.stroke();
    Art.text(g, String(Z), -w / 2 + 28, -h / 2 + 32, { font: 'display', size: 32, color: Z_COLOR });
    Art.text(g, s, 0, -8, { font: 'display', size: h * 0.42, color: bright(col) });
    Art.text(g, name, 0, h / 2 - 34, { size: 28 });
    g.restore();
  }

  /* ---------- Story 1: three jobs ---------- */
  Lab.story('#story-dials', {
    title: 'Three particles, three jobs',
    scenes: [
      {
        say: '<b>Protons set the element.</b> Six protons make carbon. Add one more and you have nitrogen, a totally different element. The proton count is the <b>atomic number</b>, $Z$.',
        dur: 4.2,
        draw(g, p, t, { W, H }) {
          const add = ease.inOut(seg(p, 0.35, 0.6));
          const has7 = add >= 1;
          const cx = 240, cy = H / 2 + 6;
          Art.glow(g, cx, cy, 170, C.proton, 0.2);
          if (!has7) cluster(g, cx, cy, 6, 0, 36, t);
          else cluster(g, cx, cy, 7, 0, 36, t);
          if (!has7 && add > 0) {
            const x = lerp(-20, cx + 60, add), y = lerp(70, cy - 30, add);
            Art.proton(g, x, y, 36);
          }
          const flip = seg(p, 0.6, 0.78);
          const s = flip < 0.5 ? ['C', 'Carbon', 6] : ['N', 'Nitrogen', 7];
          idCard(g, 590, H / 2 - 12, 280, 300, s[0], s[1], s[2], { scaleX: Math.max(0.02, Math.abs(1 - 2 * flip)) });
          Art.text(g, flip < 0.5 ? '6 protons' : '7 protons', cx, 40, { font: 'display', size: 36, color: Z_COLOR });
          Art.burst(g, 590, H / 2 - 12, seg(p, 0.72, 0.95), { r: 170, n: 18 });
          void W;
        },
      },
      {
        say: '<b>Neutrons change the mass, not the element.</b> Carbon with extra neutrons is still carbon, just heavier. Protons plus neutrons is the <b>mass number</b>, $A$.',
        dur: 4.2,
        draw(g, p, t, { H }) {
          const cx = 240, cy = H / 2 + 6;
          const q1 = ease.inOut(seg(p, 0.15, 0.42)), q2 = ease.inOut(seg(p, 0.52, 0.8));
          const nn = 6 + (q1 >= 1 ? 1 : 0) + (q2 >= 1 ? 1 : 0);
          Art.glow(g, cx, cy, 170, C.neutron, 0.16);
          cluster(g, cx, cy, 6, nn, 25, t);
          if (q1 > 0 && q1 < 1) Art.neutron(g, lerp(-20, cx + 40, q1), lerp(60, cy - 40, q1), 25);
          if (q2 > 0 && q2 < 1) Art.neutron(g, lerp(-20, cx + 30, q2), lerp(390, cy + 40, q2), 25);
          idCard(g, 600, 170, 260, 250, 'C', 'Carbon', 6);
          const A = 6 + nn;
          Art.text(g, `6 protons + ${nn} neutrons`, cx, 34, { font: 'display', size: 32 });
          Art.text(g, `A = ${A}`, 600, 342, { font: 'display', size: 60, color: A_COLOR });
          Art.text(g, `carbon-${A}`, 600, 402, { size: 30 });
        },
      },
      {
        say: '<b>Electrons change the charge.</b> Sodium has 11 protons and 11 electrons, so it is neutral. Lose one electron and the protons win by one: charge is <b>protons minus electrons</b>.',
        dur: 4.2,
        draw(g, p, t, { H }) {
          const cx = 250, cy = H / 2 + 4;
          const q = ease.inOut(seg(p, 0.3, 0.7));
          const counts = [2, 8, q > 0 ? 0 : 1];
          g.fillStyle = 'rgba(164,91,255,.1)'; g.beginPath(); g.arc(cx, cy, 190, 0, TAU); g.fill();
          shells(g, cx, cy, [64, 120, 178], counts, t, { er: 8 });
          if (q > 0 || p < 0.3) {
            g.strokeStyle = 'rgba(47,214,242,.25)'; g.lineWidth = 2; g.setLineDash([5, 7]); g.beginPath(); g.arc(cx, cy, 178, 0, TAU); g.stroke(); g.setLineDash([]);
          }
          Art.ball(g, cx, cy, 30, Art.elementColor('Na'));
          Art.text(g, '11+', cx, cy, { size: 26, color: '#fff' });
          if (q > 0) {
            const a = -0.5;
            Art.electron(g, lerp(cx + Math.cos(a) * 178, 760, q), lerp(cy + Math.sin(a) * 178, 60, q), 10);
          }
          const nowE = q >= 0.5 ? 10 : 11;
          Art.text(g, `11 protons, ${nowE} electrons`, 590, 110, { size: 30 });
          Art.text(g, `11 − ${nowE} =`, 530, 190, { font: 'display', size: 50 });
          Art.text(g, nowE === 10 ? '+1' : '0', 674, 190, { font: 'display', size: 62, color: Q_COLOR });
          const a2 = seg(p, 0.7, 0.86);
          Art.text(g, 'Na', 560, 300, { font: 'display', size: 96, color: Art.mix(Art.elementColor('Na'), '#fff', 0.2) });
          Art.text(g, '+', 626, 268, { font: 'display', size: 54, color: Q_COLOR, alpha: a2 });
          Art.text(g, a2 > 0.5 ? 'a positive ion, or cation' : 'a neutral atom', 590, 382, { size: 28, color: C.ink });
        },
      },
      {
        say: 'All of it fits in one symbol. The top left is the <b>mass number</b>, the bottom left is the <b>atomic number</b>, and the top right is the <b>charge</b>.',
        dur: 4.4,
        draw(g, p, t, { W, H }) {
          const a = seg(p, 0.05, 0.25), b = seg(p, 0.3, 0.5), c = seg(p, 0.55, 0.75);
          nuclide(g, W / 2 + 10, H / 2 + 6, 37, 17, 'Cl', -1, 170, { color: Art.elementColor('Cl') });
          Art.text(g, 'mass number A', 170, 54, { font: 'display', size: 30, color: A_COLOR, alpha: a });
          Art.text(g, 'protons + neutrons', 170, 90, { size: 25, alpha: a });
          Art.arrow(g, 180, 112, 232, 134, { color: A_COLOR, w: 6, p: a });
          Art.text(g, 'atomic number Z', 170, H - 86, { font: 'display', size: 30, color: Z_COLOR, alpha: b });
          Art.text(g, 'protons', 170, H - 50, { size: 25, alpha: b });
          Art.arrow(g, 180, H - 116, 232, H - 146, { color: Z_COLOR, w: 6, p: b });
          Art.text(g, 'charge', 680, 54, { font: 'display', size: 30, color: Q_COLOR, alpha: c });
          Art.text(g, 'protons − electrons', 650, 90, { size: 25, alpha: c });
          Art.arrow(g, 610, 114, 572, 136, { color: Q_COLOR, w: 6, p: c });
          void t;
        },
      },
      {
        say: 'Now read it. <b>17 protons</b> from the bottom number. <b>37 − 17 = 20 neutrons</b>. A charge of $-1$ means one extra electron, so <b>18 electrons</b>.',
        dur: 5,
        draw(g, p, t, { W }) {
          nuclide(g, 130, 225, 37, 17, 'Cl', -1, 110, { color: Art.elementColor('Cl') });
          const rows = [
            { y: 92, label: 'Protons', how: '17', kind: 'p', n: 17, col: Z_COLOR, gap: 21 },
            { y: 225, label: 'Neutrons', how: '37 − 17 = 20', kind: 'n', n: 20, col: C.ink, gap: 21 },
            { y: 358, label: 'Electrons', how: '17 + 1 = 18', kind: 'e', n: 18, col: Q_COLOR, gap: 21 },
          ];
          rows.forEach((r, i) => {
            const a = seg(p, 0.04 + i * 0.3, 0.16 + i * 0.3);
            Art.text(g, r.label, 290, r.y - 38, { font: 'display', size: 30, align: 'left', color: r.col, alpha: a });
            Art.text(g, r.how, 760, r.y - 38, { font: 'display', size: 32, align: 'right', color: C.sun, alpha: a });
            if (a > 0) tally(g, 300, r.y + 8, r.n, r.kind, seg(p, 0.08 + i * 0.3, 0.3 + i * 0.3), r.gap);
          });
          void t; void W;
        },
      },
    ],
  });

  /* ---------- Bench: the atom builder ---------- */
  const STABLE = {
    H: [1, 2], He: [3, 4], Li: [6, 7], Be: [9], B: [10, 11], C: [12, 13], N: [14, 15], O: [16, 17, 18], F: [19], Ne: [20, 21, 22], Na: [23], Mg: [24, 25, 26], Al: [27], Si: [28, 29, 30], P: [31], S: [32, 33, 34, 36], Cl: [35, 37], Ar: [36, 38, 40], K: [39, 41], Ca: [40, 42, 43, 44, 46, 48],
    Sc: [45], Ti: [46, 47, 48, 49, 50], V: [51], Cr: [50, 52, 53, 54], Mn: [55], Fe: [54, 56, 57, 58], Co: [59], Ni: [58, 60, 61, 62, 64], Cu: [63, 65], Zn: [64, 66, 67, 68, 70], Ga: [69, 71], Ge: [70, 72, 73, 74, 76], As: [75], Se: [74, 76, 77, 78, 80, 82], Br: [79, 81], Kr: [78, 80, 82, 83, 84, 86],
  };
  const ELS = window.ELEMENTS;
  const CX = 236, CY = 232, SHELL_R = [72, 114, 158, 204];
  const BINS = { p: { x: 12, w: 252, name: 'Protons', y: 468, h: 92 }, n: { x: 274, w: 252, name: 'Neutrons', y: 468, h: 92 }, e: { x: 536, w: 252, name: 'Electrons', y: 468, h: 92 } };
  const NR = 12;
  const MAX = { p: 36, n: 50, e: 36 };
  const GOALS = [
    { s: 'H', A: 1, q: 0, name: 'a hydrogen-1 atom' },
    { s: 'He', A: 4, q: 0, name: 'a helium-4 atom' },
    { s: 'C', A: 12, q: 0, name: 'a carbon-12 atom' },
    { s: 'C', A: 14, q: 0, name: 'a carbon-14 atom' },
    { s: 'H', A: 2, q: 0, name: 'deuterium, or hydrogen-2' },
    { s: 'Li', A: 7, q: 1, name: 'a lithium ion' },
    { s: 'O', A: 16, q: -2, name: 'an oxide ion' },
    { s: 'Na', A: 23, q: 1, name: 'a sodium ion' },
    { s: 'Cl', A: 37, q: -1, name: 'a chloride ion' },
    { s: 'Mg', A: 24, q: 2, name: 'a magnesium ion' },
    { s: 'S', A: 32, q: -2, name: 'a sulfide ion' },
    { s: 'Fe', A: 56, q: 3, name: 'an iron(III) ion' },
  ];
  const b = {
    nuc: [], els: [], fly: [], drag: null, msg: 'Drag a proton in. Watch the card on the right.', msgCol: C.ink, msgT: 0,
    bumpZ: -9, bumpA: -9, bumpQ: -9, mode: 'free', goal: 0, wonAt: -9, allDone: false, t: 0, mood: 'happy', moodT: -9,
  };
  const nP = () => b.nuc.filter((x) => x.k === 'p').length;
  const nN = () => b.nuc.filter((x) => x.k === 'n').length;
  const elOf = (z) => ELS[z - 1];
  function shellCounts(e) {
    if (e <= 2) return [e, 0, 0, 0];
    if (e <= 10) return [2, e - 2, 0, 0];
    if (e <= 18) return [2, 8, e - 10, 0];
    if (e <= 20) return [2, 8, 8, e - 18];
    if (e <= 30) return [2, 8, 8 + (e - 20), 2];
    return [2, 8, 18, 2 + (e - 30)];
  }
  function addNucleon(k, x, y) { b.nuc.push({ k, x: x === undefined ? CX + (Math.random() - 0.5) * 70 : x, y: y === undefined ? CY + (Math.random() - 0.5) * 70 : y }); }
  function addElectron(x, y) { b.els.push({ x: x === undefined ? CX + 180 : x, y: y === undefined ? CY : y }); }
  function setAtom(p, n, e) {
    b.nuc = []; b.els = [];
    for (let i = 0; i < p; i++) addNucleon('p');
    for (let i = 0; i < n; i++) addNucleon('n');
    for (let i = 0; i < e; i++) addElectron(CX + Math.cos(i) * 160, CY + Math.sin(i) * 160);
    paintBuild();
  }
  function say(msg, col) { b.msg = msg; b.msgCol = col; b.msgT = b.t; }
  function changed(kind, delta) {
    const p = nP(), n = nN(), name = elOf(p).name;
    if (kind === 'p') {
      b.bumpZ = b.t; b.bumpA = b.t; b.bumpQ = b.t;
      say(`${delta > 0 ? 'New element' : 'Different element'}: ${name.toLowerCase()}. Protons set the element.`, Z_COLOR);
      b.mood = 'wow'; b.moodT = b.t;
    } else if (kind === 'n') {
      b.bumpA = b.t;
      say(`Still ${name.toLowerCase()}, now ${name.toLowerCase()}-${p + n}. Neutrons set the isotope.`, A_COLOR);
      b.mood = 'point'; b.moodT = b.t;
    } else {
      b.bumpQ = b.t;
      const q = p - b.els.length;
      say(`Still ${name.toLowerCase()}. ${q === 0 ? 'Now it is neutral.' : `The charge is now ${chargeText(q)}.`} Electrons set the charge.`, Q_COLOR);
    }
    Lab.sound.pop();
    paintBuild();
    checkGoal();
  }
  function change(kind, delta, x, y) {
    if (delta > 0) {
      const count = kind === 'p' ? nP() : kind === 'n' ? nN() : b.els.length;
      if (count >= MAX[kind]) { say(`That is enough ${BINS[kind].name.toLowerCase()} for this builder.`, C.dim); return; }
      if (kind === 'e') addElectron(x, y); else addNucleon(kind, x === undefined ? undefined : x, y);
    } else if (kind === 'e') {
      if (!b.els.length) return;
      const gone = b.els.pop();
      b.fly.push({ k: 'e', x: gone.x, y: gone.y, born: b.t });
    } else {
      if (kind === 'p' && nP() <= 1) { say('An atom needs at least one proton, or it is not an element at all.', C.red); return; }
      const idx = b.nuc.map((v) => v.k).lastIndexOf(kind);
      if (idx < 0) return;
      const gone = b.nuc.splice(idx, 1)[0];
      b.fly.push({ k: kind, x: gone.x, y: gone.y, born: b.t });
    }
    changed(kind, delta);
  }
  function checkGoal() {
    if (b.mode !== 'goal' || b.allDone || b.t - b.wonAt < 1.8) return;
    const g = GOALS[b.goal];
    const Z = EL[g.s].z;
    if (nP() === Z && nN() === g.A - Z && b.els.length === Z - g.q) {
      b.wonAt = b.t;
      Lab.collection.award(1);
      Lab.confetti(50);
      b.mood = 'cheer'; b.moodT = b.t;
      say(`Yes! That is ${g.name}.`, C.leaf);
    }
  }
  function nextGoal() {
    b.goal++;
    if (b.goal >= GOALS.length) { b.allDone = true; b.goal = GOALS.length - 1; Lab.sound.fanfare(); Lab.confetti(120); say('All 12 built. You can read and write any atom now.', C.leaf); }
    paintBuild();
  }
  setAtom(6, 6, 6);
  const buildStage = Lab.stage('#c-build', {
    h: 570, drag: true,
    bg: (g, W, H) => {
      const r = g.createRadialGradient(CX, CY, 30, CX, CY, 520);
      r.addColorStop(0, '#34215E'); r.addColorStop(0.6, '#241439'); r.addColorStop(1, '#170C29');
      g.fillStyle = r; g.fillRect(0, 0, W, H);
    },
    label: 'An atom with a nucleus and electron shells, a card showing its isotope symbol, and three bins of protons, neutrons and electrons to drag from.',
    onPointer(e) {
      const inBin = (k) => { const B = BINS[k]; return e.x >= B.x && e.x <= B.x + B.w && e.y >= B.y && e.y <= B.y + B.h; };
      if (e.type === 'hover') {
        const near = ['p', 'n', 'e'].some(inBin) || Math.hypot(e.x - CX, e.y - CY) < 90 || b.els.some((el) => Math.hypot(el.x - e.x, el.y - e.y) < 26);
        buildStage.canvas.style.cursor = near ? 'grab' : 'default';
        return;
      }
      if (e.type === 'down') {
        for (const k of ['p', 'n', 'e']) if (inBin(k)) { b.drag = { k, x: e.x, y: e.y }; return; }
        // Pick up an electron or a nucleon already in the atom.
        let best = null, bd = 30;
        b.els.forEach((el, i) => { const d = Math.hypot(el.x - e.x, el.y - e.y); if (d < bd) { bd = d; best = { type: 'e', i }; } });
        b.nuc.forEach((n, i) => { const d = Math.hypot(n.x - e.x, n.y - e.y); if (d < bd) { bd = d; best = { type: 'n', i }; } });
        if (!best) return;
        if (best.type === 'e') {
          b.els.splice(best.i, 1);
          b.drag = { k: 'e', x: e.x, y: e.y, old: true };
          changed('e', -1);
        } else {
          const k = b.nuc[best.i].k;
          if (k === 'p' && nP() <= 1) { say('An atom needs at least one proton, or it is not an element at all.', C.red); return; }
          b.nuc.splice(best.i, 1);
          b.drag = { k, x: e.x, y: e.y, old: true };
          changed(k, -1);
        }
      } else if (e.type === 'move' && b.drag) { b.drag.x = e.x; b.drag.y = e.y; }
      else if (e.type === 'up' && b.drag) {
        const d = b.drag; b.drag = null;
        const inside = Math.hypot(d.x - CX, d.y - CY) < 222;
        if (inside) change(d.k, 1, d.x, d.y);
        else b.fly.push({ k: d.k, x: d.x, y: d.y, born: b.t });
      }
    },
    draw(g, t, dt) {
      b.t = t;
      const p = nP(), n = nN(), e = b.els.length;
      const el = elOf(p), A = p + n, q = p - e;
      const stable = (STABLE[el.sym] || []).includes(A);
      /* Goal auto-advance. */
      if (b.wonAt > 0 && !b.advanced && t - b.wonAt > 1.7) { b.advanced = true; nextGoal(); b.wonAt = -9; }
      if (b.wonAt < 0) b.advanced = false;
      /* Relax the nucleus: pull to the center, push apart where they overlap. */
      const shakeAmt = stable ? 0.1 : 1.1;
      b.nuc.forEach((a) => { a.x += (CX - a.x) * clamp(dt * 2.4); a.y += (CY - a.y) * clamp(dt * 2.4); });
      for (let it = 0; it < 3; it++) {
        for (let i = 0; i < b.nuc.length; i++) for (let j = i + 1; j < b.nuc.length; j++) {
          const a = b.nuc[i], c = b.nuc[j];
          const dx = a.x - c.x, dy = a.y - c.y, d = Math.hypot(dx, dy) || 0.01, min = NR * 1.65;
          if (d < min) { const m = (min - d) / 2 / d; a.x += dx * m; a.y += dy * m; c.x -= dx * m; c.y -= dy * m; }
        }
      }
      /* Electron shells. */
      const counts = shellCounts(e);
      let idx = 0;
      SHELL_R.forEach((R, i) => {
        if (counts[i] || i === counts.findIndex((c) => c === 0)) {
          g.strokeStyle = counts[i] ? 'rgba(47,214,242,.32)' : 'rgba(47,214,242,.14)'; g.lineWidth = 2; g.setLineDash([5, 7]);
          g.beginPath(); g.arc(CX, CY, R, 0, TAU); g.stroke(); g.setLineDash([]);
        }
        for (let k = 0; k < counts[i]; k++, idx++) {
          const a = t * (0.55 - i * 0.1) + (k / counts[i]) * TAU + i * 0.8;
          const tx = CX + Math.cos(a) * R, ty = CY + Math.sin(a) * R;
          const el2 = b.els[idx];
          if (el2) { el2.x += (tx - el2.x) * clamp(dt * 7); el2.y += (ty - el2.y) * clamp(dt * 7); }
        }
      });
      /* Dragging over the atom: a welcoming ring. */
      if (b.drag) {
        const over = Math.hypot(b.drag.x - CX, b.drag.y - CY) < 222;
        Art.ring(g, CX, CY, 220, { color: over ? C.leaf : 'rgba(255,255,255,.3)', w: 4, dash: [10, 10] });
      }
      /* Nucleus, deepest last. */
      const order = b.nuc.map((v, i) => [Math.hypot(v.x - CX, v.y - CY), i]).sort((u, v) => v[0] - u[0]);
      order.forEach(([, i]) => {
        const v = b.nuc[i];
        const sx = wander(i, t * 3) * shakeAmt, sy = wander(i + 5, t * 3) * shakeAmt;
        if (v.k === 'p') Art.proton(g, v.x + sx, v.y + sy, NR); else Art.neutron(g, v.x + sx, v.y + sy, NR);
      });
      b.els.forEach((v) => Art.electron(g, v.x, v.y, 7.5));
      /* Particles flying home to their bins. */
      b.fly = b.fly.filter((f) => t - f.born < 0.5);
      b.fly.forEach((f) => {
        const u = ease.inOut(clamp((t - f.born) / 0.5));
        const B = BINS[f.k];
        const x = lerp(f.x, B.x + 62, u), y = lerp(f.y, B.y + 40, u);
        if (f.k === 'p') Art.proton(g, x, y, NR); else if (f.k === 'n') Art.neutron(g, x, y, NR); else Art.electron(g, x, y, 7.5);
      });

      /* Right-hand card. */
      const bump = (t0) => 1 + 0.22 * Math.max(0, 1 - (t - t0) / 0.4) * Math.sin(clamp((t - t0) / 0.4) * Math.PI);
      const col = Art.elementColor(el.sym);
      const face = !stable ? 'wow' : q === 0 ? 'happy' : 'grin';
      Art.atom(g, 502, 74, 36, el.sym, { face, t, label: false, charge: q ? chargeText(q).replace('−', '-') : null, look: [1, 0] });
      const zb = bump(b.bumpZ), ab = bump(b.bumpA);
      const size = 84;
      g.save(); g.translate(660, 76); g.scale(Math.max(zb, ab), Math.max(zb, ab));
      nuclide(g, 0, 0, A, p, el.sym, q, size, { color: bright(col) });
      g.restore();
      Art.text(g, `${el.name}-${A}`, 636, 158, { font: 'display', size: 36, maxW: 300 });
      let px = 484;
      const kindText = q === 0 ? 'Neutral atom' : q > 0 ? `Cation, ${chargeText(q)}` : `Anion, ${chargeText(q)}`;
      px += Art.pill(g, kindText, px, 202, { size: 21, color: q === 0 ? C.plum2 : q > 0 ? '#C4326F' : '#1178B8', text: '#fff', align: 'left' }) + 8;
      Art.pill(g, stable ? 'Stable' : 'Unstable', px, 202, { size: 21, color: stable ? '#177A4B' : '#A63A2E', text: '#fff', align: 'left' });
      Art.text(g, `A = ${p} + ${n} = ${A}`, 484, 246, { size: 26, align: 'left', color: A_COLOR });
      Art.text(g, `charge = ${p} − ${e} = ${q > 0 ? '+' : q < 0 ? '−' : ''}${Math.abs(q)}`, 484, 282, { size: 26, align: 'left', color: Q_COLOR });
      const mAlpha = clamp((t - b.msgT) * 4);
      Art.para(g, b.msg, 484, 306, 304, { size: 22, weight: 700, color: b.msgCol, align: 'left', alpha: mAlpha, lh: 26 });

      /* Goal card or Moe. */
      const moodNow = t - b.moodT < 1.8 ? b.mood : 'happy';
      if (b.mode === 'goal') {
        g.fillStyle = 'rgba(255,210,63,.13)'; g.strokeStyle = C.sun; g.lineWidth = 3;
        Art.round(g, 484, 384, 304, 74, 16); g.fill(); g.stroke();
        const gl = GOALS[b.goal];
        if (b.allDone) Art.text(g, 'All 12 built!', 636, 421, { font: 'display', size: 34, color: C.leaf });
        else {
          Art.text(g, `Build ${b.goal + 1} of ${GOALS.length}`, 500, 421, { size: 23, align: 'left', color: C.sun });
          nuclide(g, 700, 421, gl.A, EL[gl.s].z, gl.s, gl.q, 46);
        }
      } else {
        Art.moe(g, 738, 462, 92, moodNow, { t, flip: true });
      }
      /* Bins. */
      ['p', 'n', 'e'].forEach((k) => {
        const B = BINS[k];
        const c = k === 'p' ? p : k === 'n' ? n : e;
        g.fillStyle = 'rgba(0,0,0,.26)'; Art.round(g, B.x, B.y + 6, B.w, B.h, 16); g.fill();
        g.fillStyle = C.plum2; g.strokeStyle = k === 'p' ? C.proton : k === 'n' ? C.neutron : C.cyan; g.lineWidth = 3;
        Art.round(g, B.x, B.y, B.w, B.h, 16); g.fill(); g.stroke();
        for (let i = 0; i < 6; i++) {
          const px2 = B.x + 28 + (i % 3) * 26 + (i > 2 ? 13 : 0), py2 = B.y + 62 - (i > 2 ? 26 : 0);
          if (k === 'p') Art.proton(g, px2, py2, 13); else if (k === 'n') Art.neutron(g, px2, py2, 13); else Art.electron(g, px2, py2, 9);
        }
        Art.text(g, B.name, B.x + 122, B.y + 30, { size: 24, align: 'left' });
        Art.text(g, String(c), B.x + 122, B.y + 64, { font: 'display', size: 36, align: 'left', color: k === 'p' ? Z_COLOR : k === 'n' ? C.ink : Q_COLOR });
      });
      /* The particle in your hand goes on top. */
      if (b.drag) {
        if (b.drag.k === 'p') Art.proton(g, b.drag.x, b.drag.y, NR * 1.2);
        else if (b.drag.k === 'n') Art.neutron(g, b.drag.x, b.drag.y, NR * 1.2);
        else Art.electron(g, b.drag.x, b.drag.y, 9);
      }
    },
  });
  function paintBuild() {
    const p = nP(), n = nN(), e = b.els.length;
    Lab.$('#p-val').textContent = p; Lab.$('#n-val').textContent = n; Lab.$('#e-val').textContent = e;
    const el = elOf(p), q = p - e;
    Lab.$('#build-say').innerHTML = `<p><b>${el.name}-${p + n}</b> has ${p} proton${p === 1 ? '' : 's'}, ${n} neutron${n === 1 ? '' : 's'} and ${e} electron${e === 1 ? '' : 's'}, so its charge is ${q === 0 ? 'zero' : chargeText(q)}. A simplified picture: electron shells are drawn as rings, but real electrons spread out in clouds, as you will see in the orbitals lesson.</p>`;
  }
  ['p', 'n', 'e'].forEach((k) => {
    Lab.$(`#${k}-plus`).addEventListener('click', () => change(k, 1));
    Lab.$(`#${k}-minus`).addEventListener('click', () => change(k, -1));
  });
  Lab.segmented('#build-mode', (v) => {
    b.mode = v;
    Lab.$('#build-skip').hidden = v !== 'goal';
    if (v === 'goal') { b.goal = 0; b.allDone = false; b.wonAt = -9; setAtom(1, 0, 0); say('Match the yellow box. Read it first, then build.', C.sun); }
    else { say('Free play. Try anything.', C.ink); }
  });
  Lab.$('#build-skip').addEventListener('click', () => { nextGoal(); });
  Lab.$('#build-reset').addEventListener('click', () => {
    if (b.allDone) { b.allDone = false; b.goal = 0; }
    setAtom(1, 0, 0); say('Hydrogen: the simplest atom there is. Add something.', C.ink);
  });
  buildStage.data.b = b;
  buildStage.data.setAtom = setAtom;

  /* ---------- Story 2: isotopes ---------- */
  function twin(g, x, y, R, s, np, nn, t, o = {}) {
    Art.glow(g, x, y, R * 1.2, Art.elementColor(s), 0.1);
    const er = o.er || 7;
    g.strokeStyle = 'rgba(47,214,242,.32)'; g.lineWidth = 2; g.setLineDash([5, 7]); g.beginPath(); g.arc(x, y, R, 0, TAU); g.stroke(); g.setLineDash([]);
    const ne = o.ne === undefined ? 1 : o.ne;
    for (let i = 0; i < ne; i++) {
      const a = t * 0.8 + (i / ne) * TAU + (o.seed || 0);
      Art.electron(g, x + Math.cos(a) * R, y + Math.sin(a) * R, er);
    }
    cluster(g, x, y, np, nn, o.r || 15, t, { spin: o.spin });
  }
  Lab.story('#story-iso', {
    title: 'Twins that weigh differently',
    scenes: [
      {
        say: 'All hydrogen atoms have <b>1 proton</b>. Most have no neutron at all. A rare few have one or two. These three are <b>isotopes</b> of hydrogen.',
        dur: 4,
        draw(g, p, t) {
          const cols = [
            { x: 140, A: 1, n: 0, name: 'hydrogen-1', nick: '0 neutrons' },
            { x: 400, A: 2, n: 1, name: 'hydrogen-2', nick: '1 neutron' },
            { x: 660, A: 3, n: 2, name: 'hydrogen-3', nick: '2 neutrons' },
          ];
          cols.forEach((c, i) => {
            const a = ease.out(seg(p, 0.05 + i * 0.26, 0.26 + i * 0.26));
            if (a <= 0) return;
            g.save(); g.globalAlpha *= a;
            nuclide(g, c.x + 6, 56, c.A, 1, 'H', 0, 56);
            twin(g, c.x, 214, 96, 'H', 1, c.n, t, { r: 26, seed: i, er: 9 });
            Art.text(g, c.name, c.x, 346, { font: 'display', size: 30 });
            Art.text(g, c.nick, c.x, 386, { size: 26, color: C.sun });
            g.restore();
          });
          Art.text(g, 'deuterium', 400, 424, { size: 23, color: C.dim, alpha: seg(p, 0.5, 0.6) });
          Art.text(g, 'tritium, radioactive', 660, 424, { size: 23, color: C.dim, alpha: seg(p, 0.76, 0.86) });
        },
      },
      {
        say: 'Carbon has isotopes too. Almost all of it is carbon-12. Only about 1 atom in 100 is carbon-13. Carbon-14 is a tiny, <b>radioactive</b> trace, and its slow decay is how we date ancient bones.',
        dur: 4.4,
        draw(g, p, t) {
          const cols = [
            { x: 140, A: 12, n: 6, pct: '98.9%' },
            { x: 400, A: 13, n: 7, pct: '1.1%' },
            { x: 660, A: 14, n: 8, pct: 'a trace' },
          ];
          cols.forEach((c, i) => {
            const a = ease.out(seg(p, 0.05 + i * 0.26, 0.26 + i * 0.26));
            if (a <= 0) return;
            g.save(); g.globalAlpha *= a;
            nuclide(g, c.x + 8, 56, c.A, 6, 'C', 0, 56, { color: '#AEB7C8' });
            twin(g, c.x, 214, 104, 'C', 6, c.n, t, { r: 15, seed: i, ne: 4, er: 7 });
            Art.text(g, `carbon-${c.A}`, c.x, 352, { font: 'display', size: 30 });
            Art.text(g, `${c.n} neutrons`, c.x, 392, { size: 25, color: C.dim });
            Art.text(g, c.pct, c.x, 426, { font: 'display', size: 28, color: C.sun });
            g.restore();
          });
        },
      },
      {
        say: 'Chlorine comes in two common isotopes. About <b>3 of every 4</b> atoms are chlorine-35, and 1 of every 4 is chlorine-37.',
        dur: 4,
        draw(g, p, t, { W, H }) {
          const a = ease.out(seg(p, 0, 0.3));
          g.save(); g.globalAlpha *= a;
          nuclide(g, 170, 62, 35, 17, 'Cl', 0, 64, { color: Art.elementColor('Cl') });
          nuclide(g, 630, 62, 37, 17, 'Cl', 0, 64, { color: Art.elementColor('Cl') });
          Art.text(g, '18 neutrons', 170, 124, { size: 26, color: C.dim });
          Art.text(g, '20 neutrons', 630, 124, { size: 26, color: C.dim });
          g.restore();
          // Four happy atoms: three of one, one of the other.
          const items = [[70, 0], [170, 0], [270, 0], [630, 1]];
          items.forEach(([x, k], i) => {
            const q = ease.back(seg(p, 0.3 + i * 0.1, 0.46 + i * 0.1));
            if (q <= 0) return;
            Art.atom(g, x, 232 + wander(i, t) * 3, 46 * q, 'Cl', { face: 'happy', t, seed: i, label: k ? '37' : '35', labelColor: '#0D2B1A' });
          });
          const c = seg(p, 0.72, 0.88);
          g.fillStyle = Art.alpha(C.plum2, c);
          Art.round(g, 40, H - 118, 460, 96, 22); g.fill();
          Art.round(g, 530, H - 118, 230, 96, 22); g.fill();
          Art.text(g, '75.76%', 270, H - 70, { font: 'display', size: 52, color: C.sun, alpha: c });
          Art.text(g, '24.24%', 645, H - 70, { font: 'display', size: 44, color: C.sun, alpha: c });
          void W;
        },
      },
      {
        say: "Chemistry is about <b>electrons</b>. Both chlorines have 17 protons, so both have the same 17 electrons as neutral atoms. They make exactly the same salt. Only the mass differs.",
        dur: 4.4,
        draw(g, p, t, { W }) {
          const row = (y, label, delay) => {
            const q = ease.inOut(seg(p, delay, delay + 0.3));
            const after = ease.back(seg(p, delay + 0.26, delay + 0.4));
            Art.atom(g, 90, y, 42, 'Na', { face: 'wink', t, seed: 1, look: [1, 0] });
            Art.text(g, '+', 158, y, { font: 'display', size: 40 });
            Art.atom(g, 234, y, 50, 'Cl', { face: 'grumpy', t, seed: 2, look: [-1, 0], label });
            if (q > 0 && q < 1) Art.electron(g, lerp(132, 190, q), y - 40 * Math.sin(q * Math.PI), 9);
            Art.arrow(g, 306, y, 386, y, { color: C.sun, w: 6, p: seg(p, delay + 0.2, delay + 0.3) });
            if (after > 0) {
              g.save(); g.translate(500, y); g.scale(after, after); g.translate(-500, -y);
              Art.atom(g, 462, y, 34, 'Na', { face: 'happy', t, seed: 3, charge: '+', look: [1, 0] });
              Art.atom(g, 536, y, 50, 'Cl', { face: 'happy', t, seed: 4, charge: '-', look: [-1, 0], label });
              g.restore();
              Art.text(g, 'NaCl', 690, y, { font: 'display', size: 50, alpha: after > 1 ? 1 : after });
            }
          };
          row(92, '35', 0.06);
          row(264, '37', 0.36);
          Art.text(g, 'Same electrons, same reaction', W / 2, 402, { font: 'display', size: 34, color: C.sun, alpha: seg(p, 0.8, 0.95) });
        },
      },
      {
        say: 'You will see an isotope written three ways. They all mean the same atom. The number after the name is always the <b>mass number</b>.',
        dur: 3.6,
        draw(g, p, t, { W, H }) {
          const a = ease.back(seg(p, 0.05, 0.28)), b2 = ease.back(seg(p, 0.32, 0.55)), c = ease.back(seg(p, 0.6, 0.83));
          const pop = (x, y, q, fn) => { if (q <= 0) return; g.save(); g.translate(x, y); g.scale(q, q); g.translate(-x, -y); fn(); g.restore(); };
          pop(150, H / 2, a, () => Art.text(g, 'carbon-14', 150, H / 2, { font: 'display', size: 50 }));
          pop(400, H / 2, b2, () => Art.text(g, '¹⁴C', 400, H / 2, { font: 'display', size: 80, color: '#AEB7C8' }));
          pop(640, H / 2, c, () => nuclide(g, 650, H / 2, 14, 6, 'C', 0, 96, { color: '#AEB7C8' }));
          Art.text(g, '=', 290, H / 2, { font: 'display', size: 52, color: C.dim, alpha: b2 > 0 ? 1 : 0 });
          Art.text(g, '=', 510, H / 2, { font: 'display', size: 52, color: C.dim, alpha: c > 0 ? 1 : 0 });
          Art.text(g, '14 protons and neutrons, 6 of them protons', W / 2, H - 74, { size: 28, color: C.sun, alpha: seg(p, 0.8, 0.95) });
          void t;
        },
      },
    ],
  });

  /* ---------- Bench: mass spectrometer ---------- */
  const SP = { xe: 196, ye: 110, floor: 448, srcX: 120, speed: 460 };
  const NAMES = { Cl: 'chlorine', Mg: 'magnesium', B: 'boron', Ne: 'neon', Cu: 'copper', Si: 'silicon', Br: 'bromine', Ag: 'silver' };
  const spec = { el: 'Cl', rate: 24, acc: 0, ions: [], counts: [], total: 0, hit: [], t: 0 };
  function radii(n) { return n === 2 ? [128, 262] : [116, 190, 264]; }
  function resetSpec() {
    const iso = ISO[spec.el];
    spec.ions = []; spec.counts = iso.map(() => 0); spec.total = 0; spec.hit = iso.map(() => -9); spec.acc = 0;
    paintSpecFoot();
  }
  function pathPoint(R, s) {
    const L1 = SP.xe - SP.srcX, L2 = (Math.PI / 2) * R, L3 = SP.floor - (SP.ye + R);
    if (s < L1) return [SP.srcX + s, SP.ye];
    if (s < L1 + L2) { const a = (s - L1) / R; return [SP.xe + Math.sin(a) * R, SP.ye + R - Math.cos(a) * R]; }
    return [SP.xe + R, SP.ye + R + (s - L1 - L2)];
  }
  const pathLen = (R) => SP.xe - SP.srcX + (Math.PI / 2) * R + (SP.floor - (SP.ye + R));
  const specStage = Lab.stage('#c-spec', {
    h: 520, label: 'Ions leave a source, speed up, bend in a magnet, and stack up on a detector. Lighter ions bend more. The stack heights show each isotope percentage.',
    draw(g, t, dt) {
      const iso = ISO[spec.el];
      const R = radii(iso.length);
      const col = Art.elementColor(spec.el);
      const { xe, ye, floor } = SP;
      // Spawn.
      spec.acc += dt * spec.rate;
      while (spec.acc > 1 && spec.ions.length < 90) {
        spec.acc -= 1;
        let u = Math.random() * 100, k = 0;
        while (k < iso.length - 1 && u > iso[k][2]) { u -= iso[k][2]; k++; }
        spec.ions.push({ k, s: 0 });
      }
      spec.acc = Math.min(spec.acc, 2);
      // Magnet: a wedge whose edge is exactly where the arcs end.
      const wedge = new Path2D();
      wedge.moveTo(xe - 6, ye - 30); wedge.lineTo(xe + 300, ye - 30); wedge.lineTo(xe + 300, ye + 300); wedge.closePath();
      const mg = g.createLinearGradient(xe, ye, xe + 260, ye + 240);
      mg.addColorStop(0, '#4A3C8C'); mg.addColorStop(1, '#2F2465');
      g.fillStyle = mg; g.fill(wedge);
      g.strokeStyle = '#8F76C2'; g.lineWidth = 3; g.lineJoin = 'round'; g.stroke(wedge);
      g.save(); g.clip(wedge);
      for (let i = 0; i < 9; i++) for (let j = 0; j < 8; j++) {
        const x = xe + 26 + i * 36, y = ye - 8 + j * 44;
        g.strokeStyle = 'rgba(255,255,255,.15)'; g.fillStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 1.6;
        g.beginPath(); g.arc(x, y, 6, 0, TAU); g.stroke();
        g.beginPath(); g.arc(x, y, 1.7, 0, TAU); g.fill();
      }
      g.restore();
      // Paths, faint.
      R.forEach((rr, i) => {
        g.strokeStyle = Art.alpha(col, 0.28); g.lineWidth = 3; g.setLineDash([6, 8]);
        g.beginPath();
        for (let s = 0; s <= pathLen(rr); s += 14) { const [x, y] = pathPoint(rr, s); if (s === 0) g.moveTo(x, y); else g.lineTo(x, y); }
        g.stroke(); g.setLineDash([]);
        void i;
      });
      // Source box.
      g.fillStyle = '#3A3056'; g.strokeStyle = '#8F76C2'; g.lineWidth = 3;
      Art.round(g, 22, ye - 50, 96, 100, 14); g.fill(); g.stroke();
      for (let i = 0; i < 5; i++) {
        const x = 46 + (i % 3) * 22 + wander(i, t) * 6, y = ye - 26 + Math.floor(i / 2) * 22 + wander(i + 5, t) * 6;
        Art.ball(g, x, y, 9, col);
      }
      const eu = (t * 0.9) % 1;
      Art.electron(g, lerp(30, 110, eu), ye - 36 + Math.sin(eu * 6) * 3, 5);
      // Speed-up plates.
      g.fillStyle = '#FF5A6B'; g.fillRect(132, ye - 46, 9, 36); g.fillRect(132, ye + 10, 9, 36);
      g.fillStyle = '#2FA8FF'; g.fillRect(172, ye - 46, 9, 36); g.fillRect(172, ye + 10, 9, 36);
      // Ions.
      for (let i = spec.ions.length - 1; i >= 0; i--) {
        const ion = spec.ions[i];
        ion.s += SP.speed * dt;
        const L = pathLen(R[ion.k]);
        if (ion.s >= L) {
          spec.counts[ion.k]++; spec.total++; spec.hit[ion.k] = t;
          spec.ions.splice(i, 1);
          continue;
        }
        const [x, y] = pathPoint(R[ion.k], ion.s);
        Art.ball(g, x, y, 7.5, col);
        g.fillStyle = '#1A0F2E'; g.fillRect(x - 3, y - 0.8, 6, 1.6); g.fillRect(x - 0.8, y - 3, 1.6, 6);
      }
      // Detector floor and stacks.
      g.fillStyle = '#17463B'; Art.round(g, xe + 40, floor, 300, 12, 5); g.fill();
      g.strokeStyle = '#7DFFB0'; g.lineWidth = 2; g.stroke();
      iso.forEach(([A, m, ab], i) => {
        const x = xe + R[i];
        const frac = spec.total ? spec.counts[i] / spec.total : 0;
        const h = frac * 200;
        const w = 56;
        if (h > 0.5) {
          const gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
          gr.addColorStop(0, Art.mix(col, '#ffffff', 0.25)); gr.addColorStop(0.6, col); gr.addColorStop(1, Art.mix(col, '#12062A', 0.35));
          g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
          Art.round(g, x - w / 2, floor - h, w, h + 2, Math.min(8, h / 2)); g.fill(); g.stroke();
        }
        if (t - spec.hit[i] < 0.25) Art.glow(g, x, floor - h, 34, '#7DFFB0', 0.8 * (1 - (t - spec.hit[i]) / 0.25));
        Art.text(g, `${(frac * 100).toFixed(frac < 0.1 ? 1 : 0)}%`, x, floor - h - 18, { font: 'display', size: 25, color: C.sun, halo: true });
        Art.text(g, `${Lab.sup(A)}${spec.el}`, x, floor + 36, { font: 'display', size: 28, color: bright(col) });
        void m; void ab;
      });
      // Step labels, on the things they name.
      Art.text(g, '1 ionize', 70, 36, { size: 23 });
      Art.text(g, '2 speed up', 158, ye + 76, { size: 23 });
      Art.text(g, '3 magnet bends', 386, 40, { size: 24, color: '#C9B8FF' });
      Art.text(g, '4 detector', 118, floor + 6, { size: 23, color: '#7DFFB0' });
      // Readouts on the right.
      const sum = iso.reduce((s, x, i) => s + x[1] * spec.counts[i], 0);
      const avg = spec.total ? sum / spec.total : 0;
      Art.text(g, `${spec.total.toLocaleString('en-US')} ions`, 664, 100, { font: 'display', size: 34 });
      Art.text(g, 'average so far', 664, 152, { size: 24, color: C.dim });
      Art.text(g, spec.total ? `${avg.toFixed(2)} u` : '—', 664, 196, { font: 'display', size: 48, color: C.pink });
      const trueAvg = iso.reduce((s, x) => s + (x[1] * x[2]) / 100, 0);
      Art.text(g, 'periodic table', 664, 250, { size: 24, color: C.dim });
      Art.text(g, `${trueAvg.toFixed(2)} u`, 664, 286, { font: 'display', size: 34, color: C.sun });
      Art.bubble(g, 'Light ions turn tighter.', 664, 396, { w: 220, side: 'down', size: 22 });
      Art.moe(g, 664, 510, 110, 'point', { t, flip: true });
    },
  });
  function paintSpecFoot() {
    const iso = ISO[spec.el];
    const lhs = iso.map(([, m, ab]) => `(${(ab / 100).toFixed(4)})(${m.toFixed(3)})`).join(' + ');
    const avg = iso.reduce((s, x) => s + (x[1] * x[2]) / 100, 0);
    Lab.$('#spec-foot').innerHTML = Lab.texString(`<p>For natural ${NAMES[spec.el]}: $${lhs} = ${avg.toFixed(2)}\\text{ u}$. The split between stacks is exaggerated so you can see it. In a real machine the paths are much closer together.</p>`);
  }
  Lab.segmented('#spec-el', (v) => { spec.el = v; resetSpec(); });
  Lab.bind('#spec-rate', '#spec-rate-out', (v) => String(v), (v) => { spec.rate = v; });
  Lab.$('#spec-clear').addEventListener('click', resetSpec);
  resetSpec();
  specStage.data.spec = spec;

  /* ---------- Bench: weighted average see-saw ---------- */
  const SAW = { x1: 158, x2: 642, y: 236 };
  const saw = { el: 'Cl', a: 24.24, mode: 'auto', xF: 400, tilt: 0, dragging: false, won: false };
  const isoPair = () => ISO[saw.el];
  const xOf = (m) => { const [a, b2] = isoPair(); return lerp(SAW.x1, SAW.x2, (m - a[1]) / (b2[1] - a[1])); };
  const mOf = (x) => { const [a, b2] = isoPair(); return lerp(a[1], b2[1], (x - SAW.x1) / (SAW.x2 - SAW.x1)); };
  const avgSaw = () => { const [a, b2] = isoPair(); return ((100 - saw.a) * a[1] + saw.a * b2[1]) / 100; };
  function pile(g, cx, baseY, n, s, t) {
    const r = 14.5; let left = n, row = 0;
    const maxRow = 7;
    while (left > 0) {
      const width = Math.min(left, Math.max(1, maxRow - row));
      for (let i = 0; i < width; i++) {
        const x = cx + (i - (width - 1) / 2) * (r * 1.9), y = baseY - r - row * (r * 1.66);
        Art.atom(g, x, y + wander(i + row * 5, t) * 0.4, r, s, { label: false });
      }
      left -= width; row++;
    }
    return baseY - r * 2 - (row - 1) * (r * 1.66);
  }
  const sawStage = Lab.stage('#c-saw', {
    h: 470, bg: 'lab', drag: true,
    label: 'A see-saw with piles of two isotopes at their masses. The triangle marks the balance point, which is the average atomic mass.',
    onPointer(e) {
      if (e.type === 'hover') { sawStage.canvas.style.cursor = saw.mode === 'hand' ? 'ew-resize' : 'default'; return; }
      if (saw.mode !== 'hand') return;
      if (e.type === 'down') saw.dragging = true;
      if ((e.type === 'down' || e.type === 'move') && saw.dragging) {
        saw.xF = clamp(e.x, SAW.x1, SAW.x2);
      }
      if (e.type === 'up') saw.dragging = false;
    },
    draw(g, t, dt) {
      const [a, b2] = isoPair();
      const col = Art.elementColor(saw.el);
      const avg = avgSaw();
      const xBal = xOf(avg);
      if (saw.mode === 'auto') saw.xF = lerp(saw.xF, xBal, clamp(dt * 6));
      // Torque about the triangle decides the tilt.
      const w1 = 100 - saw.a, w2 = saw.a;
      const torque = (w1 * (SAW.x1 - saw.xF) + w2 * (SAW.x2 - saw.xF)) / 100;
      const target = clamp(torque / 300, -1, 1) * 0.2;
      saw.tilt = lerp(saw.tilt, target, clamp(dt * 3.5));
      const near = Math.abs(saw.xF - xBal) < 7;
      const py = SAW.y;
      // Triangle.
      g.fillStyle = near ? C.leaf : C.sun; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(saw.xF, py + 10); g.lineTo(saw.xF - 52, 400); g.lineTo(saw.xF + 52, 400); g.closePath(); g.fill(); g.stroke();
      // Beam and piles, tilting together.
      g.save(); g.translate(saw.xF, py); g.rotate(saw.tilt); g.translate(-saw.xF, -py);
      const beam = g.createLinearGradient(0, py - 10, 0, py + 12);
      beam.addColorStop(0, '#C8A06B'); beam.addColorStop(1, '#7E5A36');
      g.fillStyle = beam; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
      Art.round(g, 40, py - 10, 720, 20, 8); g.fill(); g.stroke();
      const n2 = Math.round(saw.a / 5), n1 = 20 - n2;
      const top1 = n1 ? pile(g, SAW.x1, py - 10, n1, saw.el, t) : py - 10;
      const top2 = n2 ? pile(g, SAW.x2, py - 10, n2, saw.el, t) : py - 10;
      const label = (x, topY, iso, pct) => {
        Art.text(g, `${Lab.sup(iso[0])}${saw.el}`, x, topY - 54, { font: 'display', size: 34, color: bright(col), halo: true });
        Art.text(g, `${pct.toFixed(pct === Math.round(pct) ? 0 : 1)}%`, x, topY - 20, { font: 'display', size: 28, color: C.sun, halo: true });
      };
      label(SAW.x1, top1, a, 100 - saw.a);
      label(SAW.x2, top2, b2, saw.a);
      Art.text(g, `${a[1].toFixed(2)} u`, SAW.x1, py + 34, { size: 24, halo: true });
      Art.text(g, `${b2[1].toFixed(2)} u`, SAW.x2, py + 34, { size: 24, halo: true });
      g.restore();
      Art.ball(g, saw.xF, py, 10, '#E4DEF4');
      // Readout on the bench.
      const shown = saw.mode === 'hand' ? mOf(saw.xF) : avg;
      Art.text(g, saw.mode === 'hand' ? `Triangle at ${shown.toFixed(2)} u` : `Balance point: ${shown.toFixed(2)} u`, 400, 434, { font: 'display', size: 32, color: near ? C.leaf : C.sun });
      if (saw.mode === 'hand') {
        if (near && !saw.won && Math.abs(saw.tilt) < 0.02) {
          saw.won = true;
          Lab.sound.good();
          if (!Lab.store.get('isotopes:saw', false)) { Lab.store.set('isotopes:saw', true); Lab.collection.award(1); }
          Lab.confetti(50);
        }
        if (saw.won && near) Art.pill(g, 'Balanced!', saw.xF, 368, { size: 24, color: '#177A4B', text: '#fff', font: 'display' });
        else if (!saw.dragging) Art.text(g, 'Drag anywhere to move the triangle', 400, 36, { size: 25, color: C.sun, halo: true });
      }
      void w1;
    },
  });
  function paintSaw() {
    const [a, b2] = isoPair();
    const f2 = saw.a / 100, f1 = 1 - f2;
    const avg = avgSaw();
    const natural = a[1] * a[2] / 100 + b2[1] * b2[2] / 100;
    Lab.$('#saw-a-label').textContent = `Share that is ${Lab.sup(b2[0])}${saw.el}`;
    Lab.$('#saw-foot').innerHTML = Lab.texString(`<p>$(${f1.toFixed(4)})(${a[1].toFixed(2)}) + (${f2.toFixed(4)})(${b2[1].toFixed(2)}) = ${avg.toFixed(2)}\\text{ u}$. Each ball is about 5% of the atoms. Nature's value for ${NAMES[saw.el]} is <b>${natural.toFixed(2)} u</b>. Slide toward one isotope and watch the balance point chase it.</p>`);
  }
  function setSawA(v) {
    saw.a = v;
    const inp = Lab.$('#saw-a'); inp.value = v; Lab.paintRange(inp);
    Lab.$('#saw-a-out').textContent = `${Number(v).toFixed(1)}%`;
    saw.won = false;
    paintSaw();
  }
  Lab.bind('#saw-a', null, null, (v) => setSawA(v));
  const useNature = () => setSawA(+isoPair()[1][2].toFixed(1));
  Lab.segmented('#saw-el', (v) => { saw.el = v; useNature(); if (saw.mode === 'hand') saw.xF = 400; });
  Lab.segmented('#saw-mode', (v) => { saw.mode = v; saw.won = false; if (v === 'hand') saw.xF = 400; });
  Lab.$('#saw-real').addEventListener('click', useNature);
  useNature();
  void rand;
});
