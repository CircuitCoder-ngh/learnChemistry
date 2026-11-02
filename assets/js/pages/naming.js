/* Lesson 2.5: Naming compounds. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const TAU = Math.PI * 2;
  const K = Bank.all.naming.kit;
  const PREFIX = K.PREFIX;

  /** Art.formula, but keeps formulas with carbon in plain ink, since dark carbon is hard to read on the stage. */
  const F = (g, f, x, y, o = {}) => Art.formula(g, f, x, y, Object.assign({}, o, { colorize: o.colorize !== false && !/C(?![a-z])/.test(f) }));
  const qText = (q) => `${Math.abs(q) > 1 ? Math.abs(q) : ''}${q > 0 ? '+' : '-'}`;
  /** A capsule showing an ion's formula and charge, colored by the sign of its charge. */
  function ionChip(g, x, y, ion, o = {}) {
    const size = o.size || 34;
    const txt = `${ion.f}^${qText(ion.q)}`;
    g.save(); g.globalAlpha = 0; const w = Art.formula(g, txt, -900, -900, { size }); g.restore();
    const pad = size * 0.5, h = size * 1.5, cw = w + pad * 2;
    g.fillStyle = ion.q > 0 ? '#7A1D54' : '#134A78'; g.strokeStyle = ion.q > 0 ? '#FF7AB6' : '#5BBDFF'; g.lineWidth = 3;
    Art.round(g, x - cw / 2, y - h / 2, cw, h, h / 2); g.fill(); g.stroke();
    Art.formula(g, txt, x, y, { size, color: '#fff' });
    return cw;
  }
  function textW(g, s, size, font = 'display') {
    g.font = `${font === 'display' ? 400 : 700} ${size}px ${font === 'display' ? Art.FONT_DISPLAY : Art.FONT_BODY}`;
    return g.measureText(s).width;
  }
  /** A tidy clump of atoms, for showing counts. */
  function atomRow(g, x, y, n, sym, r, t, seed = 0) {
    const gap = r * 2.05;
    for (let i = 0; i < n; i++) Art.atom(g, x + (i - (n - 1) / 2) * gap, y + wander(i + seed, t) * 1.5, r, sym, { label: r >= 10 ? sym : false });
  }

  /* ---------- Bench: the flowchart ---------- */
  const N = {
    A: { x: 400, y: 50, w: 320, h: 76, lines: ['Does it start with H', 'and act as an acid?'], side: -1 },
    C: { x: 172, y: 176, w: 250, h: 76, lines: ['Is there oxygen', 'in the anion?'], side: 1 },
    B: { x: 610, y: 176, w: 250, h: 76, lines: ['Is there a metal', 'or ammonium?'], side: -1 },
    E: { x: 468, y: 292, w: 276, h: 76, lines: ['Can the metal have', 'several charges?'], side: -1 },
    Lh: { x: 82, y: 416, w: 150, h: 96, tag: 'Acid', lines: ['hydro-', '-ic acid'], col: '#FF7AB6' },
    Lo: { x: 238, y: 416, w: 150, h: 96, tag: 'Acid', lines: ['-ate to -ic', '-ite to -ous'], col: '#FF7AB6' },
    Lf: { x: 394, y: 416, w: 150, h: 96, tag: 'Ionic', lines: ['cation', '+ anion'], col: '#5BD6F5' },
    Lv: { x: 550, y: 416, w: 150, h: 96, tag: 'Ionic', lines: ['metal (III)', '+ anion'], col: '#5BD6F5' },
    Lm: { x: 708, y: 416, w: 150, h: 96, tag: 'Molecular', lines: ['prefixes', '+ -ide'], col: '#7DFFB0' },
  };
  const EDGES = [
    ['A', 'C', 'Yes', 240, 50, 172, 138, -0.25],
    ['A', 'B', 'No', 560, 50, 610, 138, 0.25],
    ['C', 'Lh', 'No', 120, 214, 82, 368, 0],
    ['C', 'Lo', 'Yes', 216, 214, 238, 368, 0],
    ['B', 'E', 'Yes', 556, 214, 500, 254, 0],
    ['B', 'Lm', 'No', 668, 214, 708, 368, 0],
    ['E', 'Lf', 'No', 420, 330, 394, 368, 0],
    ['E', 'Lv', 'Yes', 516, 330, 550, 368, 0],
  ];
  const fl = { item: null, i: 0, mode: 'show', arriveT: 0, shakeT: -9, shake: null, t: 0, prevNode: 'A', extra: false };
  const flowStage = Lab.stage('#c-flow', {
    h: 590,
    bg: (g, W, H) => { const r = g.createRadialGradient(W / 2, 240, 40, W / 2, 240, 620); r.addColorStop(0, '#2E1C52'); r.addColorStop(1, '#170C29'); g.fillStyle = r; g.fillRect(0, 0, W, H); },
    label: 'A flowchart of questions. A compound walks down it, answering whether it is an acid, whether it has a metal, and whether that metal has several charges, to reach a naming rule.',
    draw(g, t) {
      fl.t = t;
      const it = fl.item;
      const path = it && !it.error ? it.path : [];
      const here = path[Math.min(fl.i, path.length - 1)];
      const onPath = (id) => path.includes(id);
      const reached = (id) => path.indexOf(id) >= 0 && path.indexOf(id) <= fl.i;
      // Edges.
      EDGES.forEach(([a, b, label, x1, y1, x2, y2, bend]) => {
        const passed = reached(a) && reached(b) && onPath(a) && onPath(b) && path.indexOf(b) === path.indexOf(a) + 1;
        const off = reached(a) && path.indexOf(a) < fl.i && !passed;
        const col = passed ? C.sun : off ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.4)';
        Art.arrow(g, x1, y1, x2, y2, { color: col, w: passed ? 6 : 4, head: 13, curve: bend ? bend * 150 : 0 });
        const mx = (x1 + x2) / 2 + (bend ? bend * 110 : 0), my = (y1 + y2) / 2 + (bend ? -12 : 0);
        Art.pill(g, label, mx, my, { size: 20, color: passed ? C.sun : off ? '#2C1E49' : C.plum2, text: passed ? '#22123A' : off ? '#6F5F90' : '#fff' });
      });
      // Nodes.
      Object.keys(N).forEach((id) => {
        const n = N[id];
        const isHere = id === here;
        const done = reached(id) && !isHere;
        const dim = path.length && fl.i >= path.length - 1 && !onPath(id);
        const shake = fl.shake === id && t - fl.shakeT < 0.4 ? Math.sin((t - fl.shakeT) * 50) * 7 * (1 - (t - fl.shakeT) / 0.4) : 0;
        const x = n.x + shake;
        g.save();
        if (dim) g.globalAlpha *= 0.32;
        if (isHere) Art.glow(g, x, n.y, n.w * 0.8, C.sun, 0.4);
        g.fillStyle = n.tag ? '#2B1A4A' : C.plum2;
        g.strokeStyle = isHere ? C.sun : done ? C.leaf : n.tag ? n.col : '#8F76C2'; g.lineWidth = isHere ? 5 : 3;
        Art.round(g, x - n.w / 2, n.y - n.h / 2, n.w, n.h, 16); g.fill(); g.stroke();
        if (n.tag) {
          Art.text(g, n.tag, x, n.y - 28, { font: 'display', size: 24, color: n.col });
          Art.text(g, n.lines[0], x, n.y + 2, { size: 21 });
          Art.text(g, n.lines[1], x, n.y + 30, { size: 21 });
        } else {
          Art.text(g, n.lines[0], x, n.y - 15, { size: 23 });
          Art.text(g, n.lines[1], x, n.y + 15, { size: 23 });
        }
        g.restore();
      });
      // Moe walks the path.
      if (here && N[here]) {
        const place = (id) => { const n = N[id]; if (!n.tag) return [n.x + (n.side || 1) * (n.w / 2 + 28), n.y + n.h / 2]; return [n.x + n.w / 2 - 28, n.y - n.h / 2]; };
        const prev = N[fl.prevNode] ? place(fl.prevNode) : place(here);
        const u = ease.inOut(clamp((t - fl.arriveT) / 0.55));
        const [hx, hy] = place(here);
        const mx = lerp(prev[0], hx, u), my = lerp(prev[1], hy, u) - Math.sin(u * Math.PI) * 30;
        Art.moe(g, mx, my, 62, u < 1 ? 'happy' : N[here].tag ? 'cheer' : 'think', { t, flip: mx > 400, bob: u >= 1 });
      }
      // The compound and its name.
      if (it && !it.error) {
        g.fillStyle = 'rgba(0,0,0,.3)'; Art.round(g, 14, 482, 772, 96, 20); g.fill();
        F(g, it.show, 40, 530, { size: 40, align: 'left' });
        const done = fl.i >= it.path.length - 1 && (!it.hydrate || fl.extra);
        const leafDone = fl.i >= it.path.length - 1;
        const w = 40 + textW(g, it.show, 40) + 24;
        const sx = Math.max(250, w + 30);
        const name = done ? it.name : leafDone && it.hydrate ? it.name.replace(/ \w+hydrate$/, '') + ' ...' : it.kind === 'ionic' && leafDone ? it.name : '?';
        const q = ease.back(clamp((t - fl.arriveT - 0.2) * 3));
        Art.text(g, name, sx, 530, { font: 'display', size: name === '?' ? 44 : Math.min(34, 34 * (520 / Math.max(520, textW(g, name, 34)))), color: done ? C.sun : C.dim, align: 'left', alpha: name === '?' ? 0.6 : q, maxW: 786 - sx - 6 });
      } else if (it && it.error) {
        Art.text(g, 'Try another formula', 400, 530, { font: 'display', size: 34, color: C.red });
      }
    },
  });
  const actions = Lab.$('#fl-actions');
  function flowFoot() {
    const it = fl.item, foot = Lab.$('#fl-foot');
    if (!it) return;
    if (it.error) { foot.innerHTML = `<p>${it.error}</p>`; return; }
    const id = it.path[Math.min(fl.i, it.path.length - 1)];
    let msg = '';
    if (fl.mode === 'me' && N[id] && !N[id].tag && !fl.answeredWrong) msg = `<b>Your call.</b> For $\\ce{${it.tex}}$: ${N[id].lines.join(' ')}`;
    else if (fl.answeredWrong) msg = `<b>Not this time.</b> ${it.why[id]}`;
    else if (id === 'Sp') msg = it.note;
    else if (N[id] && N[id].tag) {
      msg = it.why.leaf;
      if (it.hydrate && fl.extra) msg += ` It also has ${it.hydrate} water${it.hydrate > 1 ? 's' : ''}, so add <b>${K.hydrateWord(it.hydrate)}</b>.`;
      if (!it.hydrate || fl.extra) msg += ` The name is <b>${it.name}</b>.`;
    } else msg = it.why[id];
    foot.innerHTML = Lab.texString(`<p>${msg}</p>`);
  }
  function flowButtons() {
    const it = fl.item;
    actions.innerHTML = '';
    if (!it || it.error) return;
    const id = it.path[Math.min(fl.i, it.path.length - 1)];
    const last = fl.i >= it.path.length - 1;
    const add = (label, cls, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = `btn small ${cls}`; b.textContent = label; b.addEventListener('click', fn); actions.appendChild(b); return b; };
    const isQ = N[id] && !N[id].tag;
    if (fl.mode === 'me' && isQ && !last) {
      const nextId = it.path[fl.i + 1];
      const correctYes = EDGES.some((e) => e[0] === id && e[1] === nextId && e[2] === 'Yes');
      const pick = (yes) => {
        if (yes === correctYes) { fl.answeredWrong = false; Lab.sound.good(); stepFlow(); } else { fl.shake = id; fl.shakeT = fl.t; fl.answeredWrong = true; Lab.sound.bad(); flowFoot(); }
      };
      add('Yes', 'sun', () => pick(true));
      add('No', 'cyan', () => pick(false));
    } else if (!last || (it.hydrate && !fl.extra)) add('Take the next step', '', stepFlow);
    add('Start over', 'ghost', () => setFlow(it.raw));
    const presets = ['NaCl', 'K2O', 'CaBr2', 'AlCl3', 'FeCl2', 'FeCl3', 'CuO', 'Cu2O', 'PbO2', 'SnF2', 'Na2SO4', 'Ca(OH)2', 'Mg3(PO4)2', 'KMnO4', 'Cr2(SO4)3', 'NH4NO3', '(NH4)2CO3', 'CO2', 'SO3', 'PCl5', 'SF6', 'N2O', 'P4O10', 'HF', 'HBr', 'H2S', 'HNO3', 'H2SO3', 'H3PO4', 'HClO', 'MgSO4·7H2O', 'CoCl2·6H2O', 'H2O', 'NH3'];
    add('Surprise me', 'ghost', () => { Lab.$$('#fl-pick button').forEach((b) => b.setAttribute('aria-pressed', 'false')); setFlow(presets[Math.floor(Math.random() * presets.length)]); });
  }
  function stepFlow() {
    const it = fl.item;
    if (fl.i < it.path.length - 1) {
      fl.prevNode = it.path[fl.i]; fl.i++; fl.arriveT = flowStage.t; Lab.sound.pop();
      if (fl.i >= it.path.length - 1 && !it.hydrate) { Lab.sound.good(); }
    } else if (it.hydrate && !fl.extra) { fl.extra = true; fl.arriveT = flowStage.t; Lab.sound.good(); }
    flowFoot(); flowButtons();
  }
  function setFlow(raw) {
    const it = K.analyze(raw);
    it.raw = raw;
    if (!it.error) {
      it.show = String(raw).replace(/\s*[.*]\s*/g, '·').replace(/\s+/g, '').replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (c) => '₀₁₂₃₄₅₆₇₈₉'.indexOf(c));
      it.tex = it.show.replace('·', '*');
    }
    fl.item = it; fl.i = 0; fl.extra = false; fl.prevNode = 'A'; fl.arriveT = flowStage.t; fl.answeredWrong = false;
    flowFoot(); flowButtons();
  }
  Lab.segmented('#fl-pick', (v) => setFlow(v));
  Lab.segmented('#fl-mode', (v) => { fl.mode = v; fl.answeredWrong = false; setFlow(fl.item ? fl.item.raw : 'Fe2O3'); });
  Lab.$('#fl-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = Lab.$('#fl-input').value;
    Lab.$$('#fl-pick button').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    setFlow(v);
  });
  setFlow('Fe2O3');
  flowStage.data.fl = fl;
  flowStage.data.set = setFlow;
  flowStage.data.step = stepFlow;

  /* ---------- Story 1: ionic names ---------- */
  function word(g, s, x, y, o = {}) { Art.text(g, s, x, y, Object.assign({ font: 'display', size: 44 }, o)); }
  const nameBand = (g, W, H, s, a, col = C.sun) => {
    if (a <= 0) return;
    g.fillStyle = Art.alpha(C.plum2, a); Art.round(g, 60, H - 92, W - 120, 72, 24); g.fill();
    Art.text(g, s, W / 2, H - 55, { font: 'display', size: 40, color: col, alpha: a, maxW: W - 150 });
  };
  Lab.story('#story-ionic', {
    title: 'Say the cation, then the anion',
    scenes: [
      {
        say: 'To name $\\ce{NaCl}$, say the metal, <b>sodium</b>. Then say the nonmetal with its ending changed to <b>-ide</b>: chlorine becomes <b>chloride</b>. That is all there is to it.',
        dur: 4,
        draw(g, p, t, { W, H }) {
          Art.atom(g, 220, 136, 62, 'Na', { face: 'happy', t, charge: '+', look: [1, 0] });
          Art.atom(g, 580, 136, 86, 'Cl', { face: 'happy', t, charge: '-', look: [-1, 0] });
          word(g, 'sodium', 220, 268, { color: Art.elementColor('Na'), alpha: seg(p, 0.1, 0.25) });
          const q = seg(p, 0.35, 0.6);
          const old = 'chlorine', root = 'chlor';
          const w1 = textW(g, root, 44), wEnd = textW(g, 'ine', 44), wNew = textW(g, 'ide', 44);
          const x0 = 580 - (w1 + (q > 0.5 ? wNew : wEnd)) / 2;
          Art.text(g, root, x0, 268, { font: 'display', size: 44, color: Art.elementColor('Cl'), align: 'left', alpha: seg(p, 0.15, 0.3) });
          if (q < 0.5) Art.text(g, 'ine', x0 + w1, 268 - q * 40, { font: 'display', size: 44, color: Art.elementColor('Cl'), align: 'left', alpha: seg(p, 0.15, 0.3) * (1 - q * 2) });
          else Art.text(g, 'ide', x0 + w1, 268 - (1 - q) * 40, { font: 'display', size: 44, color: C.sun, align: 'left', alpha: (q - 0.5) * 2 });
          nameBand(g, W, H, 'sodium chloride', seg(p, 0.72, 0.9));
          void old;
        },
      },
      {
        say: 'Here are the anions you need. Every single-atom anion ends in <b>-ide</b>, from fluoride to phosphide.',
        dur: 3.8,
        draw(g, p, t) {
          const list = [['F', 'fluoride'], ['Cl', 'chloride'], ['Br', 'bromide'], ['I', 'iodide'], ['O', 'oxide'], ['S', 'sulfide'], ['N', 'nitride'], ['P', 'phosphide']];
          list.forEach(([s, n], i) => {
            const col = i % 4, row = Math.floor(i / 4);
            const x = 104 + col * 197, y = 112 + row * 210;
            const q = ease.back(seg(p, 0.03 + i * 0.09, 0.18 + i * 0.09));
            if (q <= 0) return;
            g.save(); g.translate(x, y); g.scale(q, q);
            Art.atom(g, 0, -4, 54, s, { face: 'happy', t, seed: i, charge: i < 4 ? '-' : i < 6 ? '2-' : '3-' });
            Art.text(g, n, 0, 88, { font: 'display', size: 30, color: C.sun });
            g.restore();
          });
        },
      },
      {
        say: 'Ionic names have <b>no number words</b>. $\\ce{CaCl2}$ is just calcium chloride. Calcium is always $+2$ and chloride is always $-1$, so the ratio has to be 1 to 2. Saying "dichloride" adds nothing.',
        dur: 4.4,
        draw(g, p, t, { W, H }) {
          F(g, 'CaCl2', W / 2, 46, { size: 58 });
          Art.atom(g, 200, 178, 62, 'Ca', { face: 'happy', t, charge: '2+', look: [1, 0] });
          Art.atom(g, 470, 166, 60, 'Cl', { face: 'happy', t, charge: '-', seed: 1, look: [-1, 0] });
          Art.atom(g, 620, 214, 60, 'Cl', { face: 'happy', t, charge: '-', seed: 2, look: [-1, 0] });
          Art.text(g, '+2  −1  −1  =  0', W / 2, 310, { font: 'display', size: 34, color: C.sun, alpha: seg(p, 0.15, 0.35) });
          const a = seg(p, 0.4, 0.55);
          Art.text(g, 'calcium dichloride', 225, H - 56, { font: 'display', size: 33, color: C.red, alpha: a });
          Art.strike(g, 80, H - 42, 370, H - 70, seg(p, 0.5, 0.65));
          Art.text(g, 'calcium chloride', 580, H - 56, { font: 'display', size: 38, color: C.leaf, alpha: seg(p, 0.66, 0.82) });
        },
      },
      {
        say: 'Polyatomic ions just keep their own names, and ammonium counts as the cation. The subscripts are still not said out loud.',
        dur: 3.6,
        draw(g, p, t) {
          const rows = [
            ['Na2SO4', { f: 'Na', q: 1 }, { f: 'SO4', q: -2 }, 'sodium sulfate'],
            ['Ca(OH)2', { f: 'Ca', q: 2 }, { f: 'OH', q: -1 }, 'calcium hydroxide'],
            ['NH4NO3', { f: 'NH4', q: 1 }, { f: 'NO3', q: -1 }, 'ammonium nitrate'],
          ];
          rows.forEach(([f, c, a, n], i) => {
            const q = ease.out(seg(p, 0.05 + i * 0.28, 0.25 + i * 0.28));
            if (q <= 0) return;
            const y = 80 + i * 142;
            g.save(); g.globalAlpha *= q; g.translate((1 - q) * -20, 0);
            g.fillStyle = C.plum2; Art.round(g, 22, y - 60, 756, 120, 22); g.fill();
            F(g, f, 40, y, { size: 42, align: 'left' });
            ionChip(g, 340, y, c, { size: 26 });
            ionChip(g, 470, y, a, { size: 26 });
            Art.text(g, n, 762, y, { font: 'display', size: 28, color: C.sun, align: 'right', maxW: 220 });
            g.restore();
          });
          void t;
        },
      },
      {
        say: 'Iron and chlorine make <b>two different compounds</b>, with different colors. "Iron chloride" could mean either. So we add a <b>Roman numeral</b> showing the charge on the iron.',
        dur: 4.6,
        draw(g, p, t, { H }) {
          const column = (x, f, ionQ, nCl, liquid, name, a) => {
            if (a <= 0) return;
            g.save(); g.globalAlpha *= a;
            Art.beaker(g, x, 244, 170, 180, { level: 0.74, liquid, ticks: false });
            F(g, f, x, 34, { size: 46 });
            Art.atom(g, x - 54, 300, 28, 'Fe', { charge: ionQ, label: 'Fe' });
            for (let i = 0; i < nCl; i++) Art.atom(g, x + 4 + i * 44, 300, 22, 'Cl', { label: false, charge: null });
            g.restore();
            Art.text(g, name, x, H - 60, { font: 'display', size: 33, color: C.sun, alpha: seg(p, 0.7, 0.9) });
          };
          column(210, 'FeCl2', '2+', 2, '#B8D98A', 'iron(II) chloride', ease.out(seg(p, 0.05, 0.3)));
          column(590, 'FeCl3', '3+', 3, '#D9962B', 'iron(III) chloride', ease.out(seg(p, 0.35, 0.6)));
          Art.text(g, 'Same elements, different compound', 400, H - 22, { size: 25, color: C.dim, alpha: seg(p, 0.85, 1) });
          void t;
        },
      },
      {
        say: 'To find the numeral, work backward from the anion. Oxide is always $-2$. In $\\ce{Cu2O}$, two coppers share $+2$, so each is <b>+1</b>: copper(I). In $\\ce{CuO}$, one copper is <b>+2</b>: copper(II).',
        dur: 5,
        draw(g, p, t, { H }) {
          const col = (x, f, nCu, each, name, powder, a, u) => {
            if (a <= 0) return;
            g.save(); g.globalAlpha *= a;
            g.fillStyle = C.plum2; Art.round(g, x - 186, 18, 372, H - 36, 24); g.fill();
            F(g, f, x, 60, { size: 54 });
            // A dish of the real powder.
            g.fillStyle = powder; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
            g.beginPath(); g.ellipse(x, 136, 104, 26, 0, 0, TAU); g.fill(); g.stroke();
            g.fillStyle = 'rgba(255,255,255,.14)'; g.beginPath(); g.ellipse(x - 26, 128, 44, 9, -0.1, 0, TAU); g.fill();
            atomRow(g, x, 214, nCu, 'Cu', 28, t, nCu);
            Art.text(g, nCu === 2 ? '2 Cu must total +2' : '1 Cu must total +2', x, 262, { size: 25, alpha: u });
            Art.text(g, `each one is +${each}`, x, 300, { font: 'display', size: 32, color: C.pink, alpha: seg(u, 0.4, 1) });
            Art.text(g, name, x, 362, { font: 'display', size: 34, color: C.sun, alpha: seg(u, 0.75, 1) });
            g.restore();
          };
          col(204, 'Cu2O', 2, 1, 'copper(I) oxide', '#B02A1E', ease.out(seg(p, 0.03, 0.2)), seg(p, 0.15, 0.48));
          col(596, 'CuO', 1, 2, 'copper(II) oxide', '#1E1C24', ease.out(seg(p, 0.48, 0.65)), seg(p, 0.6, 0.94));
        },
      },
    ],
  });

  /* ---------- Story 2: molecular names ---------- */
  Lab.story('#story-mol', {
    title: 'Names that count atoms',
    scenes: [
      {
        say: 'Nitrogen and oxygen can combine in many ways: at least six different compounds. No charges tell you which one you have, so the <b>name must say how many</b> of each atom.',
        dur: 3.6,
        draw(g, p, t) {
          const list = [['N2O', 2, 1], ['NO', 1, 1], ['N2O3', 2, 3], ['NO2', 1, 2], ['N2O4', 2, 4], ['N2O5', 2, 5]];
          list.forEach(([f, a, b], i) => {
            const q = ease.back(seg(p, 0.05 + i * 0.11, 0.22 + i * 0.11));
            if (q <= 0) return;
            const col = i % 3, row = Math.floor(i / 3);
            const x = 140 + col * 260, y = 112 + row * 210;
            g.save(); g.translate(x, y); g.scale(q, q);
            g.fillStyle = C.plum2; Art.round(g, -118, -92, 236, 184, 22); g.fill();
            F(g, f, 0, -54, { size: 46 });
            atomRow(g, 0, 16, a, 'N', 21, t, i);
            atomRow(g, 0, 62, b, 'O', 21, t, i + 4);
            g.restore();
          });
        },
      },
      {
        say: 'The counting words are <b>prefixes</b>. You have to memorize these ten. Most are also found in everyday words, such as tricycle, octopus and decade.',
        dur: 4.4,
        draw(g, p, t) {
          for (let n = 1; n <= 10; n++) {
            const q = ease.out(seg(p, 0.02 + n * 0.07, 0.14 + n * 0.07));
            if (q <= 0) continue;
            const col = n <= 5 ? 0 : 1;
            const i = (n - 1) % 5;
            const x = col ? 416 : 22, y = 54 + i * 84;
            g.save(); g.globalAlpha *= q; g.translate((1 - q) * -14, 0);
            g.fillStyle = C.plum2; Art.round(g, x, y - 34, 364, 68, 16); g.fill();
            Art.text(g, String(n), x + 34, y, { font: 'display', size: 36, color: C.pink });
            Art.text(g, PREFIX[n], x + 66, y, { font: 'display', size: 34, color: C.sun, align: 'left' });
            for (let k = 0; k < n; k++) {
              const dx = x + 188 + (k % 5) * 33, dy = y + (n > 5 ? (k < 5 ? -15 : 15) : 0);
              Art.ball(g, dx, dy + wander(k + n, t) * 0.8, 13, n % 2 ? '#7DD3FC' : '#F9A8D4');
            }
            g.restore();
          }
        },
      },
      {
        say: 'Now build one. $\\ce{N2O5}$ has 2 nitrogens, so <b>dinitrogen</b>. Then 5 oxygens, so penta + oxide. The prefix loses its last vowel before another vowel, giving <b>pentoxide</b>.',
        dur: 5,
        draw(g, p, t, { W, H }) {
          F(g, 'N2O5', W / 2, 48, { size: 62 });
          atomRow(g, 200, 142, 2, 'N', 34, t, 1);
          atomRow(g, 560, 142, 5, 'O', 32, t, 3);
          const a = seg(p, 0.12, 0.3);
          Art.text(g, 'di + nitrogen', 200, 226, { size: 28, alpha: a });
          word(g, 'dinitrogen', 200, 276, { color: C.sun, size: 42, alpha: seg(p, 0.25, 0.4) });
          const b = seg(p, 0.42, 0.55);
          Art.text(g, 'penta + oxide', 560, 226, { size: 28, alpha: b });
          // The dropped vowel floats away.
          const d = seg(p, 0.58, 0.8);
          const size = 42, parts = ['pent', 'a', 'oxide'];
          const w = parts.map((s) => textW(g, s, size));
          const closed = ease.inOut(d);
          const total = w[0] + w[2] + w[1] * (1 - closed);
          let x = 560 - total / 2;
          if (b > 0) {
            Art.text(g, parts[0], x, 276, { font: 'display', size, color: C.sun, align: 'left', alpha: seg(p, 0.5, 0.6) });
            x += w[0];
            Art.text(g, parts[1], x, 276 - closed * 44, { font: 'display', size, color: C.red, align: 'left', alpha: seg(p, 0.5, 0.6) * (1 - closed) });
            x += w[1] * (1 - closed);
            Art.text(g, parts[2], x, 276, { font: 'display', size, color: C.sun, align: 'left', alpha: seg(p, 0.5, 0.6) });
          }
          nameBand(g, W, H, 'dinitrogen pentoxide', seg(p, 0.82, 0.96));
        },
      },
      {
        say: 'One special rule: <b>never put mono- on the first element</b>. $\\ce{CO}$ is carbon monoxide, and $\\ce{CO2}$ is carbon dioxide. The second element always gets its prefix, even if it is just one.',
        dur: 4.4,
        draw(g, p, t, { H }) {
          Art.molecule(g, 210, 118, 104, 'CO', { face: 'happy', faceAll: true, t, look: [1, 0] });
          Art.molecule(g, 590, 118, 92, 'CO2', { face: 'happy', t });
          const a = seg(p, 0.1, 0.25);
          Art.text(g, 'monocarbon monoxide', 210, 236, { font: 'display', size: 30, color: C.red, alpha: a });
          Art.strike(g, 60, 250, 360, 222, seg(p, 0.25, 0.42));
          word(g, 'carbon monoxide', 210, 302, { size: 36, color: C.sun, alpha: seg(p, 0.42, 0.58) });
          word(g, 'carbon dioxide', 590, 302, { size: 36, color: C.sun, alpha: seg(p, 0.6, 0.76) });
          Art.text(g, 'No mono- on the first element', 400, H - 56, { font: 'display', size: 34, color: C.leaf, alpha: seg(p, 0.76, 0.92) });
        },
      },
      {
        say: 'A few molecules are so common that everyone just uses their <b>common names</b>. You are expected to know these three on sight.',
        dur: 3.4,
        draw(g, p, t, { H }) {
          [['H2O', 'water', 150, 74], ['NH3', 'ammonia', 400, 74], ['CH4', 'methane', 650, 62]].forEach(([f, n, x, sz], i) => {
            const q = ease.back(seg(p, 0.05 + i * 0.2, 0.28 + i * 0.2));
            if (q <= 0) return;
            g.save(); g.translate(x, 122); g.scale(q, q);
            Art.molecule(g, 0, 0, sz, f, { face: 'happy', t, seed: i });
            g.restore();
            F(g, f, x, 244, { size: 42 });
            Art.text(g, n, x, 294, { font: 'display', size: 36, color: C.sun, alpha: clamp(q) });
          });
          const a2 = seg(p, 0.76, 0.9);
          if (a2 > 0) {
            g.fillStyle = Art.alpha(C.plum2, a2); Art.round(g, 60, H - 94, 680, 70, 22); g.fill();
            Art.text(g, 'Nobody says dihydrogen monoxide. Except at parties.', 400, H - 59, { size: 25, alpha: a2, maxW: 650 });
          }
        },
      },
    ],
  });

  /* ---------- Story 3: acid names ---------- */
  function morph(g, cx, y, pre, root, oldEnd, newEnd, tail, q, size = 54) {
    // q 0: root + oldEnd. q 1: pre + root + newEnd + tail.
    const flip = ease.inOut(seg(q, 0, 0.4)), grow = ease.back(seg(q, 0.3, 0.7)), acid = seg(q, 0.6, 1);
    const wPre = pre ? textW(g, pre, size) : 0, wRoot = textW(g, root, size), wOld = textW(g, oldEnd, size), wNew = textW(g, newEnd, size), wTail = textW(g, ' ' + tail, size);
    const widthA = wRoot + wOld, widthB = wPre + wRoot + wNew + wTail;
    const total = lerp(widthA, widthB, ease.inOut(seg(q, 0.3, 0.8)));
    let x = cx - total / 2;
    if (pre && grow > 0) Art.text(g, pre, x, y, { font: 'display', size, color: C.pink, align: 'left', alpha: clamp(grow) });
    x += wPre * clamp(ease.inOut(seg(q, 0.3, 0.8)));
    Art.text(g, root, x, y, { font: 'display', size, color: C.ink, align: 'left' });
    x += wRoot;
    if (flip < 0.5) Art.text(g, oldEnd, x, y - flip * 50, { font: 'display', size, color: C.cyan, align: 'left', alpha: 1 - flip * 2 });
    else Art.text(g, newEnd, x, y + (1 - flip) * 50, { font: 'display', size, color: C.sun, align: 'left', alpha: (flip - 0.5) * 2 });
    x += flip < 0.5 ? wOld : wNew;
    Art.text(g, ' ' + tail, x, y, { font: 'display', size, color: C.sun, align: 'left', alpha: acid });
  }
  function acidTop(g, f, ion, t) {
    Art.atom(g, 150, 88, 44, 'H', { face: 'happy', t, charge: '+', look: [1, 0] });
    Art.text(g, '+', 262, 88, { font: 'display', size: 44, color: C.dim });
    ionChip(g, 370, 88, ion, { size: 34 });
    Art.arrow(g, 462, 88, 530, 88, { color: C.dim, w: 5 });
    F(g, f, 650, 88, { size: 70 });
  }
  function ruleBand(g, W, s, a) {
    if (a <= 0) return;
    g.fillStyle = Art.alpha('#7A1D54', a); Art.round(g, 110, 330, W - 220, 78, 24); g.fill();
    Art.text(g, s, W / 2, 370, { font: 'display', size: 36, color: '#fff', alpha: a });
  }
  Lab.story('#story-acid', {
    title: 'The anion sets the name',
    scenes: [
      {
        say: 'An <b>acid</b> releases $\\ce{H+}$ in water. Written as a formula, it looks like hydrogen followed by an anion. So name the anion first, then use its ending to get the acid name.',
        dur: 3.8,
        draw(g, p, t, { H }) {
          Art.bench(g, 800, H - 52, 52);
          Art.beaker(g, 180, H - 52, 220, 250, { level: 0.76, liquid: C.water, ticks: false });
          Art.text(g, 'HCl(aq)', 180, H - 24, { font: 'display', size: 28 });
          Art.zoom(g, 220, H - 170, 550, 192, 172, (gg, cx, cy) => {
            const pts = [[-80, -70], [70, -86], [-104, 44], [34, 26], [116, 70], [-28, 112]];
            pts.forEach(([x, y], i) => {
              const px = cx + x + wander(i, t) * 7, py = cy + y + wander(i + 9, t) * 7;
              if (i % 2) Art.atom(gg, px, py, 36, 'Cl', { charge: '-', face: i === 1 ? 'happy' : null, t });
              else Art.atom(gg, px, py, 22, 'H', { charge: '+' });
            });
          }, { p: seg(p, 0.08, 0.3) });
          Art.text(g, 'H⁺ + the anion', 550, H - 34, { size: 27, color: C.sun, alpha: seg(p, 0.5, 0.7), halo: true });
        },
      },
      {
        say: 'If the anion ends in <b>-ide</b>, the acid is <b>hydro-</b>...<b>-ic acid</b>. Chloride becomes hydrochloric acid. These anions have no oxygen in them.',
        dur: 3.8,
        draw(g, p, t, { W }) {
          acidTop(g, 'HCl', { f: 'Cl', q: -1 }, t);
          morph(g, W / 2, 232, 'hydro', 'chlor', 'ide', 'ic', 'acid', seg(p, 0.2, 0.85));
          ruleBand(g, W, '-ide   becomes   hydro- -ic', seg(p, 0.75, 0.92));
        },
      },
      {
        say: 'If the anion ends in <b>-ate</b>, the ending changes to <b>-ic</b>. Nitrate becomes nitric acid. Rhyme: "I <b>ate</b> something <b>ic</b>ky."',
        dur: 3.8,
        draw(g, p, t, { W }) {
          acidTop(g, 'HNO3', { f: 'NO3', q: -1 }, t);
          morph(g, W / 2, 232, '', 'nitr', 'ate', 'ic', 'acid', seg(p, 0.2, 0.85));
          ruleBand(g, W, '-ate   becomes   -ic', seg(p, 0.75, 0.92));
        },
      },
      {
        say: 'If the anion ends in <b>-ite</b>, the ending changes to <b>-ous</b>. Nitrite becomes nitrous acid. Rhyme: "That Spr<b>ite</b> is delici<b>ous</b>."',
        dur: 3.8,
        draw(g, p, t, { W }) {
          acidTop(g, 'HNO2', { f: 'NO2', q: -1 }, t);
          morph(g, W / 2, 232, '', 'nitr', 'ite', 'ous', 'acid', seg(p, 0.2, 0.85));
          ruleBand(g, W, '-ite   becomes   -ous', seg(p, 0.75, 0.92));
        },
      },
      {
        say: 'The number of H equals the <b>charge of the anion</b>. Sulfate is $2-$, so $\\ce{H2SO4}$. Phosphate is $3-$, so $\\ce{H3PO4}$. And two names keep extra letters so they sound right: sulf<b>ur</b>ic and phosph<b>or</b>ic.',
        dur: 5,
        draw(g, p, t) {
          const rows = [
            [{ f: 'SO4', q: -2 }, 2, 'H2SO4', 'sulfuric acid', 'sulfate'],
            [{ f: 'PO4', q: -3 }, 3, 'H3PO4', 'phosphoric acid', 'phosphate'],
          ];
          rows.forEach(([ion, n, f, name, an], i) => {
            const q = ease.out(seg(p, 0.05 + i * 0.42, 0.25 + i * 0.42));
            if (q <= 0) return;
            const y = 118 + i * 212;
            g.save(); g.globalAlpha *= q;
            g.fillStyle = C.plum2; Art.round(g, 22, y - 96, 756, 192, 24); g.fill();
            ionChip(g, 124, y - 26, ion, { size: 32 });
            Art.text(g, an, 124, y + 40, { size: 25, color: C.dim });
            atomRow(g, 340, y - 26, n, 'H', 22, t, i);
            Art.text(g, `needs ${n} H⁺`, 340, y + 40, { size: 25, color: C.dim });
            F(g, f, 616, y - 26, { size: 50 });
            Art.text(g, name, 616, y + 40, { font: 'display', size: 30, color: C.sun, maxW: 300 });
            g.restore();
          });
        },
      },
    ],
  });

  /* ---------- Bench: heating a hydrate ---------- */
  const hy = { w: 5, burn: false, wet: 0, t: 0, lastN: 5 };
  const nOf = (w) => (w > 4 ? 5 : w > 2 ? 3 : w > 0.2 ? 1 : 0);
  const THRESH = [4, 4, 2, 2, 0.2];
  const hydName = (n) => (n === 0 ? 'anhydrous copper(II) sulfate' : `copper(II) sulfate ${K.hydrateWord(n)}`);
  Lab.stage('#c-hyd', {
    h: 470, bg: 'lab',
    label: 'Blue copper sulfate crystals in a dish above a burner. As water leaves, the crystals turn white. A magnifier shows water molecules leaving the ions.',
    draw(g, t, dt) {
      hy.t = t;
      if (hy.burn) hy.w = Math.max(0, hy.w - dt * 0.55);
      if (hy.wet > 0) { hy.wet = Math.max(0, hy.wet - dt); hy.w = Math.min(5, hy.w + dt * 2.2); }
      const n = nOf(hy.w);
      if (n !== hy.lastN) { hy.lastN = n; paintHy(); if (n === 0) Lab.sound.good(); }
      const benchY = 400;
      // Tripod and burner.
      g.strokeStyle = '#8D8AA5'; g.lineWidth = 6; g.lineCap = 'round';
      [[120, 400, 140, 244], [300, 400, 280, 244]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); });
      g.strokeStyle = '#6E6A86'; g.lineWidth = 7; g.beginPath(); g.moveTo(128, 244); g.lineTo(292, 244); g.stroke();
      Art.bunsen(g, 210, benchY, 0.92, { air: 1, flame: hy.burn ? 1 : 0, t });
      // Dish and crystals.
      const col = Art.mix('#EDF2F7', '#2B8FE0', hy.w / 5);
      g.fillStyle = '#E4E0F0'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(120, 196); g.quadraticCurveTo(210, 276, 300, 196); g.closePath(); g.fill(); g.stroke();
      for (let i = 0; i < 40; i++) {
        const a = rand(i), b2 = rand(i + 3);
        const x = 146 + a * 128, y = 200 - Math.sin(a * Math.PI) * 26 * b2 + 2;
        const s = 11 + rand(i + 7) * 7;
        g.save(); g.translate(x, y); g.rotate(rand(i + 5) * 1.6);
        g.fillStyle = Art.mix(col, i % 3 ? '#ffffff' : '#10243F', 0.14); g.strokeStyle = 'rgba(26,15,46,.45)'; g.lineWidth = 1.5;
        g.fillRect(-s / 2, -s / 2, s, s); g.strokeRect(-s / 2, -s / 2, s, s);
        g.restore();
      }
      if (hy.burn && hy.w > 0.05) Art.smoke(g, 210, 176, t, { n: 12, h: 150, r: 13, color: '#EAF4FF', alpha: 0.5, spread: 34, speed: 0.5 });
      if (hy.wet > 0) {
        for (let i = 0; i < 5; i++) { const u = (t * 1.6 + i / 5) % 1; g.fillStyle = C.water; g.beginPath(); g.arc(210 + (i - 2) * 16, lerp(70, 190, u), 6, 0, TAU); g.fill(); }
      }
      Art.text(g, hy.w > 2.5 ? 'blue crystals' : hy.w > 0.3 ? 'turning pale' : 'white powder', 210, 134 - (hy.burn ? 26 : 0) - (hy.burn ? 0 : 0), { font: 'display', size: 28, color: Art.mix('#EDF2F7', '#7CC4FF', hy.w / 5), halo: true });
      // Magnifier.
      Art.zoom(g, 240, 198, 586, 170, 150, (gg, cx, cy) => {
        Art.atom(gg, cx - 40, cy + 2, 36, 'Cu', { charge: '2+', label: 'Cu', face: 'happy', t, look: [1, 0] });
        // Sulfate as a small cluster.
        const sx = cx + 54, sy = cy + 4;
        for (let i = 0; i < 4; i++) { const a = -Math.PI / 2 + (i / 4) * TAU; Art.bond(gg, sx, sy, sx + Math.cos(a) * 34, sy + Math.sin(a) * 34, { width: 4 }); }
        for (let i = 0; i < 4; i++) { const a = -Math.PI / 2 + (i / 4) * TAU; Art.atom(gg, sx + Math.cos(a) * 34, sy + Math.sin(a) * 34, 15, 'O', { label: false }); }
        Art.atom(gg, sx, sy, 19, 'S', { label: 'S' });
        // Five waters, leaving in stages.
        const homes = [[-98, -72], [20, -102], [104, -52], [-102, 62], [72, 88]];
        homes.forEach(([hx, hyy], i) => {
          const gone = clamp((THRESH[i] + 0.8 - hy.w) / 0.8);
          if (gone >= 1) return;
          const x = cx + hx + wander(i, t) * 3 + gone * (hx > 0 ? 24 : -24), y = cy + hyy + wander(i + 6, t) * 3 - gone * 90;
          Art.molecule(gg, x, y, 30, 'H2O', { rot: rand(i) * 6 + Math.sin(t + i) * 0.2, labels: false, style: 'fill', atomScale: 1.2, alpha: 1 - gone });
        });
      }, { p: 1 });
      F(g, n === 0 ? 'CuSO4' : n === 1 ? 'CuSO4·H2O' : `CuSO4·${n}H2O`, 586, 362, { size: 44, halo: true });
      Art.text(g, hydName(n), 400, 438, { font: 'display', size: 33, color: n === 0 ? '#fff' : '#9AD8FF', maxW: 760 });
    },
  });
  function paintHy() {
    const n = nOf(hy.w);
    const m = 1.6 + 0.18 * n;
    Lab.$('#hy-mass').textContent = `${m.toFixed(2)} g`;
    Lab.$('#hy-n').textContent = String(n);
    const end = n === 0 ? ' All the water is gone. The solid lost 0.90 g, which is 36% of its original mass. Chemists call a salt with no water <b>anhydrous</b>. Add water back and it turns blue again, getting warm as it does.' : '';
    Lab.$('#hy-foot').innerHTML = `<p><b>${hydName(n)[0].toUpperCase() + hydName(n).slice(1)}.</b> The water really is part of the crystal, and its color. Real crystals lose water in these same steps: 5 waters, then 3, then 1, then none.${end}</p>`;
    Lab.$('#hy-burn').textContent = hy.burn ? 'Turn off the burner' : 'Light the burner';
  }
  Lab.$('#hy-burn').addEventListener('click', () => { hy.burn = !hy.burn; hy.wet = 0; paintHy(); });
  Lab.$('#hy-wet').addEventListener('click', () => { hy.burn = false; hy.wet = 2.4; paintHy(); });
  paintHy();

  /* ---------- Bench: the naming trainer ---------- */
  const tr = { cats: new Set(Object.keys(K.CATEGORY)), dir: 'both', prob: null, phase: 'ask', streak: 0, best: Lab.store.get('best:naming-trainer', 0), solved: 0, tries: 0, t0: 0, t: 0, cat: null, last: '' };
  const input = Lab.$('#tr-input'), foot = Lab.$('#tr-foot'), nextBtnT = Lab.$('#tr-next'), checkBtn = Lab.$('#tr-check');
  const strict = (s) => String(s).replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (c) => '₀₁₂₃₄₅₆₇₈₉'.indexOf(c)).replace(/[\s_^·.*]/g, '');
  function newProblem() {
    const rng = Bank.rng();
    const cats = [...tr.cats];
    let p, cat;
    for (let i = 0; i < 12; i++) {
      cat = rng.pick(cats);
      const d = tr.dir === 'both' ? rng.pick(['name', 'formula']) : tr.dir;
      p = K.CATEGORY[cat].make(rng, d);
      if (p.q !== tr.last) break;
    }
    tr.last = p.q; tr.prob = p; tr.cat = cat; tr.phase = 'ask'; tr.tries = 0; tr.t0 = trainStage.t;
    input.value = ''; input.disabled = false;
    input.placeholder = p.placeholder || 'Your answer';
    checkBtn.disabled = false;
    nextBtnT.textContent = 'Skip';
    foot.innerHTML = Lab.texString(`<p>${p.dir === 'name' ? 'Type the name of this compound.' : 'Type the formula. Numbers can be plain, such as Al2O3.'}</p>`);
    input.focus({ preventScroll: true });
  }
  function reveal(ok) {
    tr.phase = ok ? 'right' : 'wrong'; tr.t0 = trainStage.t;
    input.disabled = true; checkBtn.disabled = true;
    nextBtnT.textContent = 'Next problem';
    const p = tr.prob;
    const ans = p.dir === 'name' ? p.answerName : `$\\ce{${p.formula.replace('·', '*')}}$`;
    foot.innerHTML = Lab.texString(`<p>${ok ? '<b>Correct!</b>' : `The answer is <b>${ans}</b>.`}</p><ol style="margin:6px 0 0;padding-left:1.3em">${p.steps.map((s) => `<li>${s}</li>`).join('')}</ol>`);
    nextBtnT.focus({ preventScroll: true });
  }
  Lab.$('#tr-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (tr.phase !== 'ask') { newProblem(); return; }
    const p = tr.prob;
    const raw = input.value;
    if (!raw.trim()) return;
    const correct = p.dir === 'formula' ? p.accept.some((a) => strict(a) === strict(raw)) : Bank.matchText(raw, p.accept);
    if (correct) {
      tr.streak++; tr.solved++;
      if (tr.streak > tr.best) { tr.best = tr.streak; Lab.store.set('best:naming-trainer', tr.best); }
      if (tr.streak % 5 === 0) { Lab.collection.award(1); Lab.confetti(50); } else Lab.sound.good();
      reveal(true);
      return;
    }
    if (p.dir === 'formula' && Bank.matchText(raw, p.accept)) {
      foot.innerHTML = '<p><b>So close.</b> Check your capitals: every element symbol starts with a capital, and only the first letter is one.</p>';
      Lab.sound.bad();
      return;
    }
    tr.tries++;
    Lab.sound.bad();
    if (tr.tries === 1) {
      foot.innerHTML = Lab.texString(`<p><b>Not yet.</b> ${p.hint || 'Try once more.'}</p>`);
      input.select();
    } else { tr.streak = 0; reveal(false); }
  });
  nextBtnT.addEventListener('click', () => { if (tr.phase === 'ask') tr.streak = 0; newProblem(); });
  const catHost = Lab.$('#tr-cats');
  catHost.innerHTML = Object.keys(K.CATEGORY).map((k) => `<button type="button" class="chip is-on" data-k="${k}" aria-pressed="true">${K.CATEGORY[k].label}</button>`).join('');
  Lab.$$('.chip', catHost).forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.k;
    if (tr.cats.has(k)) { if (tr.cats.size === 1) return; tr.cats.delete(k); } else tr.cats.add(k);
    b.classList.toggle('is-on', tr.cats.has(k));
    b.setAttribute('aria-pressed', String(tr.cats.has(k)));
    newProblem();
  }));
  Lab.segmented('#tr-dir', (v) => { tr.dir = v; newProblem(); });
  function drawParts(g, p, q, t) {
    const P = p.parts, y = 262;
    if (!P) return;
    g.save(); g.globalAlpha *= clamp(q);
    if (P.kind === 'ionic') {
      const a = P.c, b = P.a;
      ionChip(g, 200, y - 40, a, { size: 32 });
      ionChip(g, 600, y - 40, b, { size: 32 });
      Art.text(g, `${P.nc} × (+${a.q})`, 200, y + 22, { font: 'display', size: 34, color: '#FF9AD0' });
      Art.text(g, `${P.na} × (−${-b.q})`, 600, y + 22, { font: 'display', size: 34, color: '#7DC8FF' });
      Art.text(g, '+', 400, y - 40, { font: 'display', size: 44 });
      Art.text(g, `+${P.nc * a.q} − ${P.nc * a.q} = 0`, 400, y + 22, { font: 'display', size: 30, color: C.leaf });
    } else if (P.kind === 'molecular') {
      const { p: pp, sec, first } = P.m;
      const r1 = Math.min(30, 150 / pp.n1), r2 = Math.min(30, 165 / pp.n2);
      atomRow(g, 210, y - 44, pp.n1, pp.e1, r1, t, 1);
      atomRow(g, 590, y - 44, pp.n2, pp.e2, r2, t, 5);
      Art.text(g, first, 210, y + 22, { font: 'display', size: 34, color: C.sun });
      Art.text(g, sec.word, 590, y + 22, { font: 'display', size: 34, color: C.sun });
    } else if (P.kind === 'acid') {
      ionChip(g, 170, y - 30, P.a, { size: 34 });
      Art.text(g, P.a.name, 170, y + 26, { size: 26, color: C.dim });
      Art.arrow(g, 300, y - 20, 420, y - 20, { color: C.sun, w: 6 });
      Art.text(g, `${P.a.acid} acid`, 610, y - 20, { font: 'display', size: 38, color: C.sun, maxW: 360 });
      Art.text(g, P.a.name.endsWith('ide') ? 'hydro- ... -ic' : P.a.name.endsWith('ate') ? '-ate to -ic' : '-ite to -ous', 360, y + 26, { size: 26, color: C.pink });
    } else if (P.kind === 'hydrate') {
      Art.text(g, P.base, 230, y - 24, { font: 'display', size: 32, color: C.ink, maxW: 400 });
      F(g, P.f, 230, y + 26, { size: 34 });
      Art.text(g, '+', 448, y, { font: 'display', size: 44 });
      for (let i = 0; i < P.n; i++) Art.molecule(g, 510 + (i % 5) * 54, y - 54 + Math.floor(i / 5) * 40 + wander(i, t) * 1.5, 18, 'H2O', { labels: false, style: 'fill', atomScale: 1.2, rot: i });
      Art.text(g, K.hydrateWord(P.n), 620, y + 36, { font: 'display', size: 30, color: C.sun });
    }
    g.restore();
  }
  const trainStage = Lab.stage('#c-train', {
    h: 400,
    label: 'The compound or name to answer. After you answer, its parts and charges appear below.',
    draw(g, t) {
      tr.t = t;
      const p = tr.prob;
      if (!p) return;
      Art.text(g, `${tr.streak} in a row`, 22, 26, { size: 23, color: tr.streak ? C.sun : C.dim, align: 'left' });
      Art.text(g, `Best: ${tr.best}`, 778, 26, { size: 23, color: C.dim, align: 'right' });
      const done = tr.phase !== 'ask';
      const u = done ? ease.inOut(clamp((t - tr.t0) / 0.45)) : 0;
      const y = lerp(170, 104, u);
      Art.text(g, p.dir === 'name' ? 'Name this compound' : 'Write this formula', 400, lerp(66, 56, u) - 6, { size: 24, color: C.dim, alpha: 1 - u });
      if (p.dir === 'name') F(g, p.formula, 400, y, { size: 76 });
      else Art.text(g, p.answerName, 400, y, { font: 'display', size: 50, color: C.sun, maxW: 750 });
      if (!done) {
        Art.moe(g, 400, 392, 120, 'think', { t });
        return;
      }
      const q = clamp((t - tr.t0 - 0.2) * 2.4);
      drawParts(g, p, q, t);
      const r = ease.back(clamp((t - tr.t0 - 0.5) * 3));
      if (r > 0) {
        const ans = p.dir === 'name' ? p.answerName : p.formula;
        g.save(); g.translate(400, 358); g.scale(r, r);
        g.fillStyle = tr.phase === 'right' ? '#177A4B' : '#7A2A3F'; Art.round(g, -372, -32, 744, 64, 22); g.fill();
        if (p.dir === 'name') Art.text(g, ans, 0, 1, { font: 'display', size: 34, color: '#fff', maxW: 720 });
        else Art.formula(g, ans, 0, 0, { size: 40, color: '#fff' });
        g.restore();
      }
    },
  });
  newProblem();
  trainStage.data.tr = tr;
  void K.ionTex;
});
