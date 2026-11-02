/* Lesson 3.2: Formulas from data. All numbers on stage come from Bank.compositionChem and the element table. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const Chem = Bank.compositionChem;
  const TAU = Math.PI * 2;
  const AM = Chem.AM;

  function strip(g, x, y, w, h, o = {}) {
    g.fillStyle = o.fill || 'rgba(18,8,36,.78)'; Art.round(g, x, y, w, h, Math.min(20, h / 2)); g.fill();
    g.strokeStyle = o.stroke || 'rgba(255,255,255,.14)'; g.lineWidth = 2.5; g.stroke();
  }
  /** Draw a pie from slices [{ sym, frac }], labeling each wedge on the wedge. */
  function pie(g, cx, cy, R, slices, o = {}) {
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(cx + 6, cy + R + 8, R * 0.9, 12, 0, 0, TAU); g.fill();
    let a = -Math.PI / 2;
    slices.forEach((s) => {
      const da = s.frac * TAU; if (da <= 0.0005) return;
      const col = Art.elementColor(s.sym);
      const gr = g.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R * 1.1);
      gr.addColorStop(0, Art.mix(col, '#ffffff', 0.28)); gr.addColorStop(0.7, col); gr.addColorStop(1, Art.mix(col, '#12062A', 0.3));
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, a, a + da); g.closePath(); g.fill();
      g.strokeStyle = '#1A0F2E'; g.lineWidth = 3; g.stroke();
      a += da;
    });
    a = -Math.PI / 2;
    slices.forEach((s) => {
      const da = s.frac * TAU; if (da <= 0.0005) return;
      const m = a + da / 2, big = s.frac > 0.12;
      const lx = cx + Math.cos(m) * R * (big ? 0.58 : 1.2), ly = cy + Math.sin(m) * R * (big ? 0.58 : 1.2);
      if (!big) { g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(cx + Math.cos(m) * R * 0.92, cy + Math.sin(m) * R * 0.92); g.lineTo(cx + Math.cos(m) * R * 1.08, cy + Math.sin(m) * R * 1.08); g.stroke(); }
      if (s.frac > 0.002 && o.labels !== false) {
        Art.text(g, s.sym, lx, ly - (big ? 16 : 13), { font: 'display', size: big ? 32 : 24, halo: true, color: '#fff' });
        Art.text(g, (s.frac * 100).toFixed(1) + '%', lx, ly + (big ? 16 : 13), { font: 'display', size: big ? 28 : 22, halo: true, color: C.sun });
      }
      a += da;
    });
  }

  /* ---------- Story 1: count or mass? ---------- */
  const PH = 2 * EL.H.mass, PO = EL.O.mass, TOTAL = PH + PO;
  Lab.story('#story-percent', {
    title: 'What is water mostly made of?',
    scenes: [
      {
        say: 'Count the atoms in water. Two of the three are hydrogen, so by <b>count</b>, water is about 67% hydrogen.',
        dur: 3,
        draw(g, p, t) {
          Art.molecule(g, 230, 190, 110, 'H2O', { face: 'happy', faceAll: true, t });
          Art.formula(g, 'H2O', 230, 60, { size: 54, colorize: true });
          Art.text(g, '3 atoms: 2 H and 1 O', 230, 340, { size: 28, alpha: seg(p, 0.2, 0.45) });
          const q = ease.inOut(seg(p, 0.25, 0.7));
          if (q > 0) pie(g, 590, 210, 140, [{ sym: 'H', frac: (2 / 3) * q }, { sym: 'O', frac: (1 / 3) * q }, { sym: 'C', frac: 0 }]);
          Art.text(g, 'by count', 590, 42, { font: 'display', size: 34, color: C.cyan, alpha: seg(p, 0.5, 0.7) });
          Art.text(g, 'mostly hydrogen?', 590, 392, { size: 26, color: C.sun, alpha: seg(p, 0.7, 0.9) });
        },
      },
      {
        say: 'Now weigh them. One oxygen atom has a mass of 16.00 u. Two hydrogens together have a mass of only 2.016 u. The oxygen wins easily.',
        dur: 3.2,
        draw(g, p, t) {
          const tilt = lerp(0, 1, ease.elastic(seg(p, 0.1, 0.8)));
          Art.balance(g, 400, 410, 520, tilt, {
            drawLeft: (gg, x, y) => { Art.atom(gg, x - 28, y - 22, 26, 'H', { face: 'wow', t }); Art.atom(gg, x + 28, y - 22, 26, 'H', { face: 'wow', t, seed: 2 }); },
            drawRight: (gg, x, y) => { Art.atom(gg, x, y - 46, 52, 'O', { face: 'grin', t }); },
          });
          const a = seg(p, 0.5, 0.75);
          Art.text(g, '2 × 1.008 = 2.016 u', 150, 64, { font: 'display', size: 30, color: '#E6ECF6', alpha: a });
          Art.text(g, '16.00 u', 650, 64, { font: 'display', size: 40, color: '#FF8A94', alpha: a });
        },
      },
      {
        say: 'Slice the pie by <b>mass</b> and it flips. Water is only 11.2% hydrogen and 88.8% oxygen. Same molecule, very different picture.',
        dur: 3.4,
        draw(g, p, t) {
          const q = ease.inOut(seg(p, 0.05, 0.75));
          const fh = lerp(2 / 3, PH / TOTAL, q);
          pie(g, 400, 236, 168, [{ sym: 'H', frac: fh }, { sym: 'O', frac: 1 - fh }]);
          Art.text(g, q < 0.5 ? 'by count' : 'by mass', 130, 70, { font: 'display', size: 44, color: q < 0.5 ? C.cyan : C.pink });
          Art.moe(g, 700, 430, 130, q > 0.8 ? 'wow' : 'happy', { t, flip: true });
        },
      },
      {
        say: 'That is <b>percent composition</b>. Take the mass of one element in the formula, divide by the whole molar mass, and multiply by 100.',
        dur: 3.6,
        draw(g, p, t, { W }) {
          const row = (y, sym, top, bottom, ans, q) => {
            const pr = g.globalAlpha; g.globalAlpha = pr * q;
            Art.atom(g, 80, y, 30, sym, { face: 'happy', t, seed: y });
            Art.text(g, top, 330, y - 28, { font: 'display', size: 32 });
            g.fillStyle = C.ink; g.fillRect(190, y - 3, 280, 4);
            Art.text(g, bottom, 330, y + 28, { font: 'display', size: 32 });
            Art.text(g, '× 100 =', 544, y, { size: 30, color: C.dim });
            Art.text(g, ans, 700, y, { font: 'display', size: 46, color: C.sun });
            g.globalAlpha = pr;
          };
          row(120, 'H', `2 × ${AM('H')} = ${PH.toFixed(3)}`, `${TOTAL.toFixed(2)} g/mol`, (100 * PH / TOTAL).toFixed(1) + '%', seg(p, 0.05, 0.3));
          row(270, 'O', `1 × ${AM('O')} = ${PO.toFixed(2)}`, `${TOTAL.toFixed(2)} g/mol`, (100 * PO / TOTAL).toFixed(1) + '%', seg(p, 0.4, 0.65));
          strip(g, 210, 368, 380, 58);
          Art.text(g, '11.2% + 88.8% = 100%', W / 2, 397, { font: 'display', size: 32, color: C.leaf, alpha: seg(p, 0.75, 0.95) });
        },
      },
    ],
  });

  /* ---------- Bench: the percent pie builder ---------- */
  const pb = { f: 'H2O', order: ['H', 'O'], counts: { H: 2, O: 1 }, shown: {}, custom: false, pulse: 0 };
  const pbFormula = () => pb.order.map((s) => s + (pb.counts[s] === 1 ? '' : pb.counts[s])).join('');
  const pieStage = Lab.stage('#c-pie', {
    label: 'A pie chart of a compound by mass, next to each element multiplied by its atomic mass.',
    draw(g, t, dt) {
      const total = pb.order.reduce((s, e) => s + pb.counts[e] * +AM(e), 0); // Printed masses, so each row's multiplication is true.
      if (!total) {
        Art.text(g, 'Tap an atom below to start', 400, 210, { font: 'display', size: 36, color: C.dim });
        Art.moe(g, 400, 410, 130, 'point', { t });
        return;
      }
      pb.order.forEach((e) => { const f = (pb.counts[e] * +AM(e)) / total; pb.shown[e] = lerp(pb.shown[e] === undefined ? 0 : pb.shown[e], f, clamp(dt * 7)); });
      Art.formula(g, pbFormula(), 34, 50, { size: pb.order.length > 3 || pbFormula().length > 8 ? 42 : 54, align: 'left', colorize: true });
      const n = pb.order.length, rh = Math.min(78, 250 / n), y0 = 106 + rh / 2;
      pb.order.forEach((e, i) => {
        const y = y0 + i * rh, c = pb.counts[e], m = +AM(e);
        for (let k = 0; k < Math.min(c, 3); k++) Art.atom(g, 46 + k * 18, y, Math.min(21, rh * 0.3), e, { label: k === Math.min(c, 3) - 1 ? e : false });
        Art.text(g, `${c} × ${AM(e)} =`, 256, y, { size: 25, align: 'right', color: C.dim });
        Art.text(g, (c * m).toFixed(2), 350, y, { font: 'display', size: 32, align: 'right', color: C.sun });
      });
      g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(30, 366, 320, 3);
      Art.text(g, 'Total', 34, 396, { size: 28, align: 'left' });
      Art.text(g, total.toFixed(2) + ' g/mol', 350, 396, { font: 'display', size: 34, align: 'right', color: C.pink });
      pie(g, 590, 222, 158, pb.order.map((e) => ({ sym: e, frac: pb.shown[e] })));
    },
  });
  function paintPie() {
    const total = pb.order.reduce((s, e) => s + pb.counts[e] * EL[e].mass, 0);
    if (!total) { Lab.$('#pie-foot').innerHTML = '<p>Add some atoms and the pie builds itself.</p>'; return; }
    const heavy = pb.order.slice().sort((a, b) => pb.counts[b] * EL[b].mass - pb.counts[a] * EL[a].mass)[0];
    const atoms = pb.order.reduce((s, e) => s + pb.counts[e], 0);
    Lab.$('#pie-foot').innerHTML = Lab.texString(`<p>$\\ce{${pbFormula()}}$ has ${atoms} atom${atoms > 1 ? 's' : ''}, and ${EL[heavy].name.toLowerCase()} makes up <b>${((100 * pb.counts[heavy] * EL[heavy].mass) / total).toFixed(1)}%</b> of its mass.</p>`);
  }
  function setPie(f) {
    pb.order = Chem.orderOf(f); pb.counts = Bank.countAtoms(f); pb.shown = {};
    paintPie();
  }
  const pieSeg = Lab.segmented('#pie-pick', (v) => setPie(v));
  Lab.$$('[data-add]').forEach((b) => b.addEventListener('click', () => {
    const e = b.dataset.add;
    if (!pb.order.includes(e)) { if (pb.order.length >= 5) { Lab.toast('That is plenty of elements. Clear it to start again.'); return; } pb.order.push(e); pb.counts[e] = 0; }
    pb.counts[e] = Math.min(20, pb.counts[e] + 1);
    Lab.$$('#pie-pick button').forEach((x) => x.setAttribute('aria-pressed', 'false'));
    Lab.sound.pop(); paintPie(); pieStage.redraw();
  }));
  Lab.$('#pie-clear').addEventListener('click', () => { pb.order = []; pb.counts = {}; pb.shown = {}; Lab.$$('#pie-pick button').forEach((x) => x.setAttribute('aria-pressed', 'false')); paintPie(); });
  void pieSeg;
  paintPie();

  /* ---------- Pipeline: shared drawing ---------- */
  const COLS = [{ x: 186, label: 'Grams' }, { x: 340, label: 'Moles' }, { x: 498, label: '÷ smallest' }, { x: 668, label: 'Whole' }];
  /** Pipe headers with bubbles running through them. active is the highlighted stage. */
  function pipeHead(g, t, active, flow) {
    const y = 38;
    g.fillStyle = '#4A3772'; Art.round(g, 92, y - 11, 660, 22, 11); g.fill();
    g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5; g.stroke();
    if (flow) for (let i = 0; i < 12; i++) {
      const u = ((t * 0.16 + i / 12) % 1);
      g.fillStyle = 'rgba(255,210,63,.75)'; g.beginPath(); g.arc(92 + u * 660, y, 5, 0, TAU); g.fill();
    }
    COLS.forEach((c, i) => { Art.pill(g, c.label, c.x, y, { size: 22, color: i === active ? C.pink : C.plum2, text: '#fff', stroke: i === active ? '#fff' : 'rgba(255,255,255,.3)' }); });
  }
  function cell(g, x, y, str, q, o = {}) {
    if (q <= 0) return;
    Art.popIn(g, x, y, q, (gg) => Art.text(gg, str, 0, 0, { font: 'display', size: o.size || 30, color: o.color || C.ink }));
  }
  const fmtNum = (v) => (v >= 100 ? v.toFixed(1) : v >= 10 ? v.toFixed(2) : v.toFixed(3));

  /* ---------- Story 2: the pipeline, one move at a time ---------- */
  const DEMO_IN = [{ sym: 'C', grams: 40.0 }, { sym: 'H', grams: 6.71 }, { sym: 'O', grams: 53.29 }];
  const DEMO = Chem.pipeline(DEMO_IN);
  const demoRows = DEMO.rows;
  function demoFrame(g, t, stage, p) {
    pipeHead(g, t, stage, true);
    demoRows.forEach((r, i) => {
      const y = 112 + i * 84;
      Art.atom(g, 76, y, 32, r.sym, { face: 'happy', t, seed: i });
      if (stage === -1) return;
      const q = (k) => (k < stage ? 1 : k === stage ? ease.out(seg(p, 0.15 + i * 0.16, 0.4 + i * 0.16)) : 0);
      cell(g, COLS[0].x, y, r.grams.toFixed(2) + ' g', q(0));
      cell(g, COLS[1].x, y, r.mol.toFixed(2), q(1));
      cell(g, COLS[2].x, y, r.ratio.toFixed(2), q(2), { color: C.sun });
      cell(g, COLS[3].x, y, String(r.whole), q(3), { color: C.leaf, size: 46 });
    });
  }
  Lab.story('#story-pipe', {
    title: 'Percent to mass, mass to mole, divide by small',
    scenes: [
      {
        say: 'Say a lab reports 40.00% carbon, 6.71% hydrogen and 53.29% oxygen. First move, <b>percent to mass</b>: pretend you have exactly 100 g, and each percent turns straight into grams.',
        dur: 3.4,
        draw(g, p, t, { W }) { demoFrame(g, t, 0, p); strip(g, 170, 370, 460, 58); Art.text(g, 'Assume a 100 g sample', W / 2, 399, { font: 'display', size: 32, color: C.sun, alpha: seg(p, 0.6, 0.85) }); },
      },
      {
        say: 'Second move, <b>mass to mole</b>. Atoms are counted in moles, so divide each mass by its atomic mass. Now these numbers are proportional to the number of atoms.',
        dur: 3.4,
        draw(g, p, t, { W }) { demoFrame(g, t, 1, p); strip(g, 130, 370, 540, 58); Art.text(g, `40.00 ÷ ${AM('C')} = 3.33 mol C`, W / 2, 399, { font: 'display', size: 30, color: C.sun, alpha: seg(p, 0.3, 0.55) }); },
      },
      {
        say: 'Third move, <b>divide by small</b>. The smallest is 3.33, so divide all of them by 3.33. The ratio pops out as 1 to 2 to 1.',
        dur: 3.2,
        draw(g, p, t, { W }) { demoFrame(g, t, 2, p); strip(g, 170, 370, 460, 58); Art.text(g, 'Every number ÷ 3.33', W / 2, 399, { font: 'display', size: 32, color: C.sun, alpha: seg(p, 0.3, 0.55) }); },
      },
      {
        say: 'They are whole numbers, so those are your subscripts. The <b>empirical formula</b> is $\\ce{CH2O}$. If you had gotten something like 1.5, you would multiply first.',
        dur: 3.2,
        draw(g, p, t, { W }) {
          demoFrame(g, t, 3, p);
          strip(g, 170, 366, 460, 66, { stroke: C.leaf });
          Art.popIn(g, W / 2, 399, seg(p, 0.55, 0.8), (gg) => Art.formula(gg, 'CH2O', 0, 0, { size: 50, colorize: true }));
          Art.moe(g, 712, 448, 80, p > 0.8 ? 'cheer' : 'happy', { t });
        },
      },
    ],
  });

  /* ---------- Bench: the formula pipeline ---------- */
  const SETS = {
    a: [['C', 40.0], ['H', 6.71], ['O', 53.29]],
    b: [['Fe', 69.94], ['O', 30.06]],
    c: [['C', 81.71], ['H', 18.29]],
    d: [['K', 24.74], ['Mn', 34.76], ['O', 40.5]],
    e: [['C', 40.92], ['H', 4.58], ['O', 54.5]],
  };
  const ELS = ['C', 'H', 'O', 'N', 'S', 'P', 'Na', 'K', 'Ca', 'Mg', 'Al', 'Fe', 'Cu', 'Mn', 'Cr', 'Cl'];
  Lab.$('#pipe-rows').innerHTML = [0, 1, 2, 3].map((i) => `<div><label class="ctl-label" for="pe-${i}">Element ${i + 1}</label>
      <div style="display:flex;gap:6px"><select id="pe-${i}" style="width:5em"><option value="">none</option>${ELS.map((e) => `<option value="${e}">${e}</option>`).join('')}</select>
      <input type="number" id="pp-${i}" min="0" max="100" step="0.01" aria-label="Percent for element ${i + 1}" placeholder="%"></div></div>`).join('');
  const pipe = { res: null, t0: -99, sum: 100, err: null };
  const pipeStage = Lab.stage('#c-pipe', {
    label: 'Each element moves through grams, moles, dividing by the smallest, and whole numbers, ending in a formula.',
    draw(g, t) {
      const R = pipe.res, el = t - pipe.t0, step = 0.85;
      const active = !R ? -1 : Math.min(3, Math.floor(el / step));
      pipeHead(g, t, active, !!R && el < step * 5);
      if (!R) {
        Art.text(g, pipe.err || 'Enter your data, then press the run button', 400, 220, { font: 'display', size: 30, color: pipe.err ? C.red : C.dim, maxW: 740 });
        return;
      }
      const n = R.rows.length, rh = Math.min(84, 280 / n), y0 = 76 + rh / 2 + (280 - rh * n) / 2;
      R.rows.forEach((r, i) => {
        const y = y0 + i * rh, q = (k) => ease.out(clamp((el - k * step - i * 0.1) * 3));
        Art.atom(g, 76, y, Math.min(32, rh * 0.4), r.sym, { face: r.sym.length < 3 ? 'happy' : null, t, seed: i });
        cell(g, COLS[0].x, y, r.grams.toFixed(2) + ' g', q(0));
        cell(g, COLS[1].x, y, fmtNum(r.mol), q(1));
        const notWhole = Math.abs(r.ratio - Math.round(r.ratio)) > 0.075;
        cell(g, COLS[2].x, y, r.ratio.toFixed(2), q(2), { color: notWhole ? C.pink : C.sun });
        if (R.k) cell(g, COLS[3].x, y, (R.k > 1 ? `× ${R.k} = ` : '') + r.whole, q(3), { color: C.leaf, size: R.k > 1 ? 32 : 44 });
      });
      const qf = clamp((el - 4 * step) * 2.4);
      if (R.k) {
        strip(g, 150, 372, 500, 64, { stroke: C.leaf });
        Art.popIn(g, 400, 404, qf, (gg) => Art.formula(gg, R.f, 0, 0, { size: 46, colorize: true }));
      } else if (qf > 0) {
        strip(g, 80, 372, 640, 64, { stroke: C.red });
        Art.text(g, 'No simple whole-number ratio. Check the data.', 400, 404, { size: 28, color: C.red, alpha: qf });
      }
    },
  });
  function loadSet(k) {
    const S = SETS[k];
    for (let i = 0; i < 4; i++) { Lab.$('#pe-' + i).value = S[i] ? S[i][0] : ''; Lab.$('#pp-' + i).value = S[i] ? S[i][1] : ''; }
    runPipe();
  }
  function runPipe() {
    const rows = [], seen = new Set();
    let dup = false;
    for (let i = 0; i < 4; i++) {
      const e = Lab.$('#pe-' + i).value, v = parseFloat(Lab.$('#pp-' + i).value);
      if (e && v > 0) { if (seen.has(e)) dup = true; seen.add(e); rows.push({ sym: e, grams: v }); }
    }
    pipe.t0 = pipeStage.t;
    const foot = Lab.$('#pipe-foot');
    if (rows.length < 2 || dup) {
      pipe.res = null; pipe.err = dup ? 'Each element should appear only once' : 'Enter at least two elements with percentages';
      foot.innerHTML = '<p>A compound needs at least two different elements.</p>';
      return;
    }
    pipe.err = null;
    pipe.res = Chem.pipeline(rows);
    const sum = rows.reduce((s, r) => s + r.grams, 0);
    const warn = Math.abs(sum - 100) > 0.5 ? ` <b>Your percentages add up to ${sum.toFixed(2)}, not 100.</b> The pipeline still works on the masses, but check your data.` : '';
    const R = pipe.res;
    let say;
    if (!R.k) say = 'These numbers do not reduce to a simple ratio. Real data can be off, but not this far.';
    else if (R.k === 1) say = `Dividing by the smallest, ${fmtNum(R.small)}, gave whole numbers straight away, so the empirical formula is $\\ce{${R.f}}$.`;
    else say = `Dividing by the smallest, ${fmtNum(R.small)}, left numbers that are not whole. Multiplying them all by <b>${R.k}</b> fixes that, so the empirical formula is $\\ce{${R.f}}$.`;
    foot.innerHTML = Lab.texString(`<p>${say}${warn}</p>`);
    Lab.sound.pop();
  }
  Lab.segmented('#pipe-pick', loadSet);
  Lab.$('#pipe-run').addEventListener('click', () => { Lab.$$('#pipe-pick button').forEach((x) => x.setAttribute('aria-pressed', 'false')); runPipe(); });
  loadSet('a');

  /* ---------- Bench: stack up the empirical units ---------- */
  const STACKS = [
    { e: 'CH2O', f: 'C6H12O6', name: 'glucose' }, { e: 'CH', f: 'C6H6', name: 'benzene' }, { e: 'NO2', f: 'N2O4', name: 'dinitrogen tetroxide' },
    { e: 'P2O5', f: 'P4O10', name: 'tetraphosphorus decoxide' }, { e: 'C2H5', f: 'C4H10', name: 'butane' },
  ];
  const st = { i: 0, n: 1, won: new Set(), shown: 1, tWin: -9 };
  function stackPaint() {
    const S = STACKS[st.i], Me = Bank.molarMass(S.e), MF = Bank.molarMass(S.f), ok = Math.abs(st.n * Me - MF) < 0.05, N = Math.round(MF / Me);
    Lab.$('#stack-foot').innerHTML = Lab.texString(ok
      ? `<p><b>Exactly right.</b> $n = ${MF.toFixed(2)} \\div ${Me.toFixed(2)} = ${N}$. Multiply each subscript in $\\ce{${S.e}}$ by ${N} to get $\\ce{${S.f}}$, which is ${S.name}.</p>`
      : `<p>The compound has a molar mass of <b>${MF.toFixed(2)} g/mol</b>. One $\\ce{${S.e}}$ unit weighs ${Me.toFixed(2)} g/mol. How many units does it take?</p>`);
    Lab.$('#stack-minus').disabled = st.n <= 1;
    Lab.$('#stack-plus').disabled = st.n >= 8;
  }
  const stackStage = Lab.stage('#c-stack', {
    h: 430, bg: 'lab', label: 'Empirical formula blocks stacked on a scale, climbing toward the target molar mass.',
    draw(g, t, dt) {
      const S = STACKS[st.i], Me = Bank.molarMass(S.e), MF = Bank.molarMass(S.f), ok = Math.abs(st.n * Me - MF) < 0.05;
      st.shown = lerp(st.shown, st.n * Me, clamp(dt * 8));
      if (Math.abs(st.shown - st.n * Me) < 0.02) st.shown = st.n * Me;
      const benchY = 430 - 70, cx = 250, w = 260, bh = 34, top = benchY - 40;
      for (let i = 0; i < st.n; i++) {
        const y = top - (i + 1) * bh;
        const col = ok ? '#1E7A52' : '#5B3F96';
        const gr = g.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
        gr.addColorStop(0, Art.mix(col, '#ffffff', 0.2)); gr.addColorStop(1, Art.mix(col, '#12062A', 0.2));
        g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
        Art.round(g, cx - w / 2 + 40, y, w - 80, bh - 2, 8); g.fill(); g.stroke();
        Art.formula(g, S.e, cx, y + bh / 2 - 1, { size: 24, color: '#fff' });
      }
      Art.digitalScale(g, cx, benchY + 2, 300, st.shown.toFixed(2) + ' g/mol', { size: 22 });
      // The right side: target and the running result.
      Art.text(g, 'target molar mass', 590, 46, { size: 25, color: C.dim });
      Art.text(g, MF.toFixed(2), 590, 90, { font: 'display', size: 54, color: C.sun });
      const frac = clamp((st.n * Me) / MF, 0, 1.3);
      Art.meter(g, 440, 130, 300, 24, frac / 1.3, { color: ok ? C.leaf : frac > 1 ? C.red : C.cyan });
      g.fillStyle = C.ink; g.fillRect(440 + 300 / 1.3 - 1.5, 124, 3, 36);
      const c = Bank.countAtoms(S.e), now = Chem.orderOf(S.e).map((s) => s + (c[s] * st.n === 1 ? '' : c[s] * st.n)).join('');
      Art.text(g, 'you have', 590, 196, { size: 25, color: C.dim });
      Art.formula(g, now, 590, 242, { size: 54, colorize: true });
      Art.text(g, `${st.n} × ${Me.toFixed(2)}`, 590, 292, { size: 28 });
      if (ok) {
        Art.pill(g, S.name, 590, 336, { size: 26, color: C.leaf, text: '#07301A', maxW: 300 });
        Art.burst(g, 590, 240, clamp((t - st.tWin) / 1.2), { n: 18, r: 150 });
      } else if (frac > 1) Art.text(g, 'Too heavy. Take one away.', 590, 336, { size: 26, color: C.red });
    },
  });
  function stackSet(n) {
    st.n = clamp(n, 1, 8);
    const S = STACKS[st.i], ok = Math.abs(st.n * Bank.molarMass(S.e) - Bank.molarMass(S.f)) < 0.05;
    if (ok) { st.tWin = stackStage.t; if (!st.won.has(st.i)) { st.won.add(st.i); Lab.collection.award(1); } else Lab.sound.good(); } else Lab.sound.pop();
    stackPaint();
  }
  Lab.segmented('#stack-pick', (v) => { st.i = +v; st.n = 1; st.shown = Bank.molarMass(STACKS[st.i].e); stackPaint(); });
  Lab.$('#stack-plus').addEventListener('click', () => stackSet(st.n + 1));
  Lab.$('#stack-minus').addEventListener('click', () => stackSet(st.n - 1));
  stackPaint();

  /* ---------- Bench: the combustion train ---------- */
  const UNK = ['C2H6O', 'C6H12O6', 'C6H6', 'C4H8O2', 'C3H8'];
  const tr = { i: 0, m: 1, p: 0, burning: false, done: false, shown: false };
  const TRAIN_Y = 150;
  function tube(g, x0, x1, y, h) {
    g.fillStyle = 'rgba(214,240,255,.08)'; Art.round(g, x0, y - h / 2, x1 - x0, h, h / 2); g.fill();
    g.strokeStyle = Art.C.glass; g.lineWidth = 3; g.stroke();
  }
  function absorber(g, x, label, col, fill, sym, t) {
    const w = 118, h = 66, y = TRAIN_Y;
    g.fillStyle = 'rgba(214,240,255,.1)'; Art.round(g, x - w / 2, y - h / 2, w, h, 20); g.fill();
    for (let i = 0; i < 26; i++) {
      const px = x - w / 2 + 12 + rand(i * 2.3 + x) * (w - 24), py = y - h / 2 + 10 + rand(i * 4.1 + x) * (h - 20);
      g.fillStyle = Art.alpha(col, 0.55); g.beginPath(); g.arc(px, py, 3.6, 0, TAU); g.fill();
    }
    // Captured molecules collect inside.
    const n = Math.round(fill * 6);
    for (let i = 0; i < n; i++) Art.molecule(g, x - 44 + (i % 3) * 44, y - 15 + Math.floor(i / 3) * 30 + wander(i, t) * 1.5, 13, sym, { style: 'fill', atomScale: 1.2, labels: false });
    g.strokeStyle = Art.C.glass; g.lineWidth = 3.5; Art.round(g, x - w / 2, y - h / 2, w, h, 20); g.stroke();
    Art.text(g, label, x, y - 62, { font: 'display', size: 24, color: C.cyan, halo: true });
    // A holder down to the scale.
    g.fillStyle = '#6E6A86'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2; g.fillRect(x - 5, y + h / 2, 10, 362 - (y + h / 2)); g.strokeRect(x - 5, y + h / 2, 10, 362 - (y + h / 2));
  }
  Lab.stage('#c-train', {
    h: 470, bg: (g, W, H) => Art.bgLab(g, W, H, 70),
    label: 'Oxygen passes over a burning sample in a furnace. A first tube traps water and a second tube traps carbon dioxide, each on its own scale.',
    draw(g, t, dt) {
      if (tr.burning) {
        tr.p = Math.min(1, tr.p + dt / 5);
        if (tr.p >= 1) { tr.burning = false; tr.done = true; Lab.$('#train-show').disabled = false; Lab.sound.good(); paintTrain(); }
      }
      const p = tr.p, f = UNK[tr.i], d = Chem.burnData(f, tr.m);
      const benchY = 400;
      // Oxygen tank.
      const tk = g.createLinearGradient(20, 0, 88, 0); tk.addColorStop(0, '#2E7DA8'); tk.addColorStop(0.4, '#7FD0F0'); tk.addColorStop(1, '#1F5C80');
      g.fillStyle = tk; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3; Art.round(g, 22, 80, 66, benchY - 80, 22); g.fill(); g.stroke();
      g.fillStyle = '#9A94B3'; g.fillRect(46, 64, 18, 18); g.strokeRect(46, 64, 18, 18);
      Art.formula(g, 'O2', 55, 240, { size: 34, color: '#06222B' });
      // The long glass tube.
      tube(g, 54, 770, TRAIN_Y, 30);
      // Furnace.
      const glow = tr.burning ? 0.85 + Math.sin(t * 9) * 0.1 : tr.done ? 0.25 : 0.4;
      g.fillStyle = '#4B4560'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3; Art.round(g, 132, 96, 196, 108, 16); g.fill(); g.stroke();
      const inner = g.createLinearGradient(0, 110, 0, 190);
      inner.addColorStop(0, Art.alpha('#FF6A13', 0.9 * glow)); inner.addColorStop(0.5, Art.alpha('#FFD27A', glow)); inner.addColorStop(1, Art.alpha('#FF6A13', 0.9 * glow));
      g.fillStyle = inner; Art.round(g, 146, 112, 168, 76, 10); g.fill();
      Art.glow(g, 230, 150, 150, '#FF8A2B', 0.34 * glow);
      // Sample boat with the sample shrinking away.
      g.fillStyle = '#E5E2F2'; g.beginPath(); g.moveTo(198, 158); g.lineTo(262, 158); g.lineTo(252, 174); g.lineTo(208, 174); g.closePath(); g.fill(); g.stroke();
      const sz = (1 - p) * 26;
      if (sz > 1) { g.fillStyle = '#8A5CC2'; g.beginPath(); g.ellipse(230, 158, sz, sz * 0.5, 0, Math.PI, 0); g.fill(); }
      Art.text(g, 'furnace', 230, 72, { font: 'display', size: 24, color: C.fire, halo: true });
      Art.pill(g, `${tr.m.toFixed(1)} g sample`, 230, 226, { size: 22, color: C.plum2, text: '#fff' });
      // Absorbers on scales.
      absorber(g, 450, 'traps H₂O', '#E8E4F4', p, 'H2O', t);
      absorber(g, 630, 'traps CO₂', '#BDEFB0', p, 'CO2', t);
      Art.digitalScale(g, 450, benchY, 172, `+${(d.h2o * p).toFixed(3)} g`, { size: 22 });
      Art.digitalScale(g, 630, benchY, 172, `+${(d.co2 * p).toFixed(3)} g`, { size: 22 });
      // Gas in the tube.
      const N = 18;
      for (let i = 0; i < N; i++) {
        const u = (t * 0.07 + i / N) % 1, x = 70 + u * 700, y = TRAIN_Y + Math.sin(t * 2 + i) * 6;
        const kind = tr.burning ? i % 3 : 0;
        if (kind === 0) { if (x < 196 || x > 264) Art.molecule(g, x, y, 12, 'O2', { style: 'fill', atomScale: 1.2, labels: false, rot: i }); }
        else if (kind === 1) { if (x < 196) Art.molecule(g, x, y, 12, 'O2', { style: 'fill', atomScale: 1.2, labels: false, rot: i }); else if (x > 264 && x < 448) Art.molecule(g, x, y, 13, 'H2O', { style: 'fill', atomScale: 1.2, labels: false, rot: i }); }
        else { if (x < 196) Art.molecule(g, x, y, 12, 'O2', { style: 'fill', atomScale: 1.2, labels: false, rot: i }); else if (x > 264 && x < 628) Art.molecule(g, x, y, 11, 'CO2', { style: 'fill', atomScale: 1.2, labels: false, rot: i }); }
      }
      Art.arrow(g, 740, 110, 786, 110, { color: C.dim, w: 4 });
      Art.text(g, 'O₂ out', 740, 82, { size: 22, color: C.dim });
      // Status on the bench.
      strip(g, 110, 416, 580, 46);
      Art.text(g, tr.done ? 'Now work back to the formula' : tr.burning ? 'Burning...' : 'Weighed sample, ready to burn', 400, 439, { font: 'display', size: 26, color: tr.done ? C.leaf : C.ink });
    },
  });
  function paintTrain(showWork) {
    const f = UNK[tr.i], d = Chem.burnData(f, tr.m), foot = Lab.$('#train-foot');
    if (!tr.done) { foot.innerHTML = Lab.texString(`<p>Burn the unknown and read the two scales. One tells you the water and the other tells you the $\\ce{CO2}$.</p>`); return; }
    const co2 = +d.co2.toFixed(3), h2o = +d.h2o.toFixed(3), b = Chem.burnBack(co2, h2o, tr.m);
    if (!showWork) { foot.innerHTML = Lab.texString(`<p>You collected <b>${h2o.toFixed(3)} g of $\\ce{H2O}$</b> and <b>${co2.toFixed(3)} g of $\\ce{CO2}$</b> from ${tr.m.toFixed(1)} g of sample. Try it on paper before you press the button.</p>`); return; }
    const rows = b.res.rows;
    const lines = [
      `<b>Carbon:</b> $${co2.toFixed(3)} \\div 44.01 = ${b.nC.toFixed(4)}$ mol $\\ce{CO2}$, so ${b.nC.toFixed(4)} mol C, which is ${b.gC.toFixed(3)} g.`,
      `<b>Hydrogen:</b> $${h2o.toFixed(3)} \\div 18.02 = ${b.nH2O.toFixed(4)}$ mol $\\ce{H2O}$, and each has 2 H, so ${b.nH.toFixed(4)} mol H, which is ${b.gH.toFixed(3)} g.`,
      b.hasO ? `<b>Oxygen:</b> $${tr.m.toFixed(1)} - ${b.gC.toFixed(3)} - ${b.gH.toFixed(3)} = ${b.gO.toFixed(3)}$ g, which is ${b.nO.toFixed(4)} mol O.` : `<b>Oxygen:</b> C and H add up to the whole sample, so there is none.`,
      `<b>Ratio:</b> dividing by the smallest gives ${rows.map((r) => `${r.sym} ${r.ratio.toFixed(2)}`).join(', ')}${b.res.k > 1 ? `, and multiplying by ${b.res.k} makes them whole` : ''}.`,
      `<b>Empirical formula: $\\ce{${b.res.f}}$.</b>`,
    ];
    foot.innerHTML = Lab.texString(lines.map((l) => `<p>${l}</p>`).join(''));
  }
  Lab.segmented('#train-pick', (v) => { tr.i = +v; tr.p = 0; tr.burning = false; tr.done = false; Lab.$('#train-show').disabled = true; paintTrain(); });
  Lab.bind('#train-m', '#train-m-out', (v) => v.toFixed(1) + ' g', (v) => { tr.m = v; tr.p = 0; tr.burning = false; tr.done = false; Lab.$('#train-show').disabled = true; paintTrain(); });
  Lab.$('#train-burn').addEventListener('click', () => { tr.p = 0; tr.done = false; tr.burning = true; Lab.$('#train-show').disabled = true; paintTrain(); Lab.sound.pop(); });
  Lab.$('#train-show').addEventListener('click', () => { paintTrain(true); Lab.collection.award(1); });
  paintTrain();
});
