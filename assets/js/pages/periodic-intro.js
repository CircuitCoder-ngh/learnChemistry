/* Lesson 2.3: Meet the periodic table. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const TAU = Math.PI * 2;
  const ELS = window.ELEMENTS;
  const bright = (col) => (Art.lum(col) < 0.42 ? Art.mix(col, '#ffffff', 0.5) : col);
  const metalKind = (e) => (['Nonmetal', 'Halogen', 'Noble gas'].includes(e.family) ? 'nonmetal' : e.family === 'Metalloid' ? 'metalloid' : 'metal');
  const DIATOMIC = ['H', 'N', 'O', 'F', 'Cl', 'Br', 'I'];
  const KIND_COL = { metal: '#C9931E', metalloid: '#0AA5C7', nonmetal: '#1EA866' };

  /* ---------- Shared drawings ---------- */
  function miniTable(g, x0, y0, tw, th, fill) {
    ELS.forEach((e) => {
      const y = e.y <= 7 ? y0 + (e.y - 1) * th : y0 + 7.4 * th + (e.y - 9) * th;
      g.fillStyle = fill(e);
      g.fillRect(x0 + (e.x - 1) * tw, y, tw - 1.6, th - 1.6);
    });
  }
  function card(g, x, y, s, m, o = {}) {
    const w = o.w || 52, h = o.h || 70;
    g.save(); g.translate(x, y);
    if (o.rot) g.rotate(o.rot);
    if (o.glow) Art.glow(g, 0, 0, 52, o.glow, 0.7);
    g.fillStyle = o.fill || '#FFF6DF'; g.strokeStyle = o.stroke || '#1A0F2E'; g.lineWidth = o.lw || 2.5;
    if (o.dash) g.setLineDash(o.dash);
    Art.round(g, -w / 2, -h / 2, w, h, 8); g.fill(); g.stroke(); g.setLineDash([]);
    Art.text(g, s, 0, -h * 0.14, { font: 'display', size: o.size || 28, color: o.text || '#3A2466' });
    if (m !== undefined && m !== '') Art.text(g, String(m), 0, h * 0.28, { size: 20, color: '#6E5A8C' });
    g.restore();
  }

  /* ---------- Story 1: why this shape ---------- */
  const ROW1 = [['Li', 7], ['Be', 9], ['B', 11], ['C', 12], ['N', 14], ['O', 16], ['F', 19]];
  const ROW2 = [['Na', 23], ['Mg', 24], ['Al', 27], ['Si', 28], ['P', 31], ['S', 32], ['Cl', 35]];
  const ALL14 = ROW1.concat(ROW2);
  const lineX = (i) => 38 + i * 56.6;
  Lab.story('#story-why', {
    title: "Mendeleev's cards",
    scenes: [
      {
        say: 'Mendeleev wrote each element and its <b>atomic mass</b> on a card. Then he lined them up from lightest to heaviest.',
        dur: 3.6,
        draw(g, p, t, { W, H }) {
          ALL14.forEach(([s, m], i) => {
            const q = ease.back(seg(p, 0.04 + i * 0.05, 0.18 + i * 0.05));
            if (q <= 0) return;
            card(g, lineX(i), lerp(-60, 226, q) + Math.sin(t + i) * 1.6, s, m, { rot: (1 - q) * (i % 2 ? 0.3 : -0.3) });
          });
          Art.text(g, 'lightest', 70, 306, { size: 25, color: C.dim, alpha: seg(p, 0.2, 0.3) });
          Art.text(g, 'heaviest', 730, 306, { size: 25, color: C.dim, alpha: seg(p, 0.8, 0.9) });
          Art.arrow(g, 134, 306, 666, 306, { color: C.dim, w: 4, p: seg(p, 0.25, 0.85) });
          Art.text(g, 'One long line of cards', W / 2, 90, { font: 'display', size: 38, alpha: seg(p, 0.75, 0.9) });
          void H;
        },
      },
      {
        say: 'Then he saw it. <b>Properties repeat.</b> Every so often a new card behaves just like an earlier one. Lithium and sodium are both soft metals that fizz in water. Fluorine and chlorine are both harsh, reactive gases.',
        dur: 4.6,
        draw(g, p, t) {
          const hi = { 0: C.pink, 7: C.pink, 6: C.leaf, 13: C.leaf };
          ALL14.forEach(([s, m], i) => {
            const on = hi[i] && seg(p, i < 7 ? 0.1 : 0.45, i < 7 ? 0.25 : 0.6);
            card(g, lineX(i), 266, s, m, { glow: on ? hi[i] : null, stroke: on ? hi[i] : undefined, lw: on ? 4 : 2.5 });
          });
          Art.arrow(g, lineX(0), 226, lineX(7), 226, { color: C.pink, w: 5, curve: -90, p: seg(p, 0.15, 0.42) });
          Art.text(g, 'soft, fizz in water', lineX(3.5), 96, { size: 26, color: C.pink, alpha: seg(p, 0.3, 0.42), halo: true });
          Art.arrow(g, lineX(6), 306, lineX(13), 306, { color: C.leaf, w: 5, curve: 90, p: seg(p, 0.5, 0.76) });
          Art.text(g, 'harsh, reactive gases', lineX(9.5), 410, { size: 26, color: C.leaf, alpha: seg(p, 0.66, 0.78), halo: true });
          void t;
        },
      },
      {
        say: 'So he cut the line and <b>stacked</b> it, so the look-alikes sit in the same column. Each column is now a family. A row is called a <b>period</b>, because the pattern repeats periodically.',
        dur: 4.4,
        draw(g, p, t, { W }) {
          const q = ease.inOut(seg(p, 0.08, 0.6));
          ALL14.forEach(([s, m], i) => {
            const col = i % 7, row = i < 7 ? 0 : 1;
            const x = lerp(lineX(i), 118 + col * 94, q), y = lerp(216, row ? 300 : 160, q);
            const on = col === 0 ? C.pink : col === 6 ? C.leaf : null;
            card(g, x, y, s, m, { w: 66, h: 88, size: 34, stroke: on && q > 0.9 ? on : undefined, lw: on && q > 0.9 ? 4 : 2.5 });
          });
          const a = seg(p, 0.62, 0.78);
          g.strokeStyle = Art.alpha(C.sun, a); g.lineWidth = 5; g.setLineDash([9, 8]);
          Art.round(g, 118 + 3 * 94 - 44, 104, 88, 252, 16); g.stroke(); g.setLineDash([]);
          Art.text(g, 'a column, or group', 118 + 3 * 94, 58, { font: 'display', size: 30, color: C.sun, alpha: a });
          const b = seg(p, 0.78, 0.92);
          Art.text(g, 'row = period', W / 2, 400, { font: 'display', size: 30, color: C.cyan, alpha: b });
          Art.arrow(g, 40, 372, 760, 372, { color: C.cyan, w: 4, both: true, p: b });
          void t;
        },
      },
      {
        say: 'His boldest move: he left <b>gaps</b>. Below silicon he saw a hole and predicted an unknown element. Fifteen years later germanium turned up and almost exactly matched.',
        dur: 5,
        draw(g, p, t, { H }) {
          const x = 130;
          card(g, x, 90, 'Si', 28, { w: 88, h: 100, size: 40 });
          const f = seg(p, 0.68, 0.78);
          if (f < 0.5) card(g, x, 214, '?', '', { w: 88, h: 100, size: 52, fill: 'rgba(255,255,255,.08)', text: C.sun, stroke: C.sun, lw: 4, dash: [8, 6] });
          else card(g, x, 214, 'Ge', 73, { w: 88, h: 100, size: 40, stroke: C.leaf, lw: 4, glow: C.leaf });
          card(g, x, 338, 'Sn', 119, { w: 88, h: 100, size: 40 });
          const a = ease.out(seg(p, 0.14, 0.32));
          g.save(); g.globalAlpha *= a; g.translate((1 - a) * 30, 0);
          g.fillStyle = C.plum2; Art.round(g, 230, 60, 530, 158, 22); g.fill();
          Art.text(g, 'Predicted in 1871', 256, 96, { font: 'display', size: 30, align: 'left', color: C.sun });
          Art.text(g, 'mass about 72', 256, 142, { size: 28, align: 'left' });
          Art.text(g, 'density about 5.5 g/cm³', 256, 182, { size: 28, align: 'left' });
          g.restore();
          const b = ease.out(seg(p, 0.5, 0.68));
          g.save(); g.globalAlpha *= b; g.translate((1 - b) * 30, 0);
          g.fillStyle = C.plum2; Art.round(g, 230, 240, 530, 158, 22); g.fill();
          Art.text(g, 'Found in 1886: germanium', 256, 276, { font: 'display', size: 30, align: 'left', color: C.leaf });
          Art.text(g, `mass ${EL.Ge.mass.toFixed(1)}`, 256, 322, { size: 28, align: 'left' });
          Art.text(g, `density ${EL.Ge.density.toFixed(2)} g/cm³`, 256, 362, { size: 28, align: 'left' });
          g.restore();
          if (b >= 1) Art.moe(g, 700, 398, 100, 'wow', { t, flip: true });
          void H;
        },
      },
      {
        say: 'Today the table is ordered by <b>atomic number</b>, which fixed a few oddballs. Columns are <b>groups</b>, numbered 1 to 18. Rows are <b>periods</b>, numbered 1 to 7. The two loose rows really belong in periods 6 and 7, moved down to keep the table short.',
        dur: 5,
        draw(g, p, t, { W }) {
          const tw = 37, th = 37, x0 = 112, y0 = 58;
          const a = seg(p, 0.22, 0.4), b = seg(p, 0.5, 0.68), c = seg(p, 0.74, 0.9);
          miniTable(g, x0, y0, tw, th, (e) => {
            if (e.y > 7) return Art.mix('#3B2763', '#B0599F', c);
            if (e.x === 17) return Art.mix('#3B2763', C.pink, a);
            if (e.y === 4) return Art.mix('#3B2763', C.cyan, b);
            return '#3B2763';
          });
          Art.text(g, 'group 17', x0 + 16.5 * tw, 34, { font: 'display', size: 28, color: C.pink, alpha: a });
          Art.text(g, 'period 4', 10, y0 + 3.5 * th + 2, { font: 'display', size: 26, color: C.cyan, alpha: b, align: 'left' });
          Art.text(g, 'lanthanides and actinides', W / 2, 418, { size: 25, color: '#E4A7D6', alpha: c, halo: true });
          void t;
        },
      },
    ],
  });

  /* ---------- Story 2: reading a tile ---------- */
  function bigTile(g, cx, cy, w, h, e, o = {}) {
    const col = Lab.familyColor(e.family);
    g.fillStyle = C.plum2; g.strokeStyle = col; g.lineWidth = 6;
    Art.round(g, cx - w / 2, cy - h / 2, w, h, 22); g.fill(); g.stroke();
    const dimZ = o.hi && o.hi !== 'z', dimS = o.hi && o.hi !== 's', dimM = o.hi && o.hi !== 'm';
    Art.text(g, String(e.z), cx, cy - h * 0.34, { font: 'display', size: h * 0.14, color: Art.alpha(C.ink, dimZ ? 0.35 : 1) });
    Art.text(g, e.sym, cx, cy - h * 0.06, { font: 'display', size: h * 0.3, color: Art.alpha(bright(Art.elementColor(e.sym)), dimS ? 0.35 : 1) });
    Art.text(g, e.name, cx, cy + h * 0.2, { size: h * 0.082, color: Art.alpha(C.ink, dimS ? 0.35 : 1) });
    Art.text(g, e.mass.toFixed(2), cx, cy + h * 0.36, { size: h * 0.1, weight: 700, color: Art.alpha(C.ink, dimM ? 0.35 : 1) });
  }
  Lab.story('#story-tile', {
    title: 'What a tile tells you',
    scenes: [
      {
        say: 'The number on top is the <b>atomic number</b>. It counts protons. Every iron atom in the universe has exactly 26 protons. It is also how the table is ordered.',
        dur: 3,
        draw(g, p, t, { H }) {
          const cx = 260, cy = H / 2;
          bigTile(g, cx, cy, 300, 380, EL.Fe, { hi: 'z' });
          Art.ring(g, cx, cy - 129, 48, { color: C.sun, p: seg(p, 0.15, 0.45), w: 6 });
          Art.text(g, '26 protons', 590, 150, { font: 'display', size: 46, color: C.sun, alpha: seg(p, 0.4, 0.6) });
          Art.text(g, 'atomic number', 590, 200, { size: 30, alpha: seg(p, 0.45, 0.65) });
          Art.arrow(g, 460, 150, 316, 110, { color: C.sun, w: 6, p: seg(p, 0.4, 0.65) });
          cluster(g, 590, 310, seg(p, 0.5, 0.9), t);
        },
      },
      {
        say: 'Next is the <b>symbol</b>, one or two letters. The first is always a capital, the second always lowercase. Some come from old Latin names: Fe from <b>ferrum</b>, Na from natrium, K from kalium, Au from aurum.',
        dur: 3.4,
        draw(g, p, t, { H }) {
          const cx = 260, cy = H / 2;
          bigTile(g, cx, cy, 300, 380, EL.Fe, { hi: 's' });
          const list = [['Fe', 'ferrum', 'iron'], ['Na', 'natrium', 'sodium'], ['K', 'kalium', 'potassium'], ['Au', 'aurum', 'gold'], ['Pb', 'plumbum', 'lead']];
          list.forEach(([s, l, n], i) => {
            const y = 76 + i * 76, a = ease.out(seg(p, 0.1 + i * 0.13, 0.26 + i * 0.13));
            if (a <= 0) return;
            g.save(); g.globalAlpha *= a;
            Art.text(g, s, 470, y, { font: 'display', size: 40, color: bright(Art.elementColor(s)) });
            Art.text(g, l, 524, y - 16, { size: 24, align: 'left', color: C.sun });
            Art.text(g, n, 524, y + 16, { size: 24, align: 'left', color: C.dim });
            g.restore();
          });
          void t;
        },
      },
      {
        say: 'The decimal at the bottom is the <b>average atomic mass</b>, in u. It is the same number in grams per mole, which you will use constantly. Note it is an average, not a count of protons and neutrons.',
        dur: 3.4,
        draw(g, p, t, { H }) {
          const cx = 260, cy = H / 2;
          bigTile(g, cx, cy, 300, 380, EL.Fe, { hi: 'm' });
          const a = seg(p, 0.15, 0.4);
          g.strokeStyle = Art.alpha(C.sun, a); g.lineWidth = 6;
          Art.round(g, cx - 92, cy + 112, 184, 52, 16); g.stroke();
          Art.arrow(g, 480, 180, 356, cy + 138, { color: C.sun, w: 6, p: seg(p, 0.3, 0.55) });
          Art.text(g, '55.85 u', 620, 128, { font: 'display', size: 56, color: C.sun, alpha: seg(p, 0.35, 0.55) });
          Art.text(g, 'average mass of one atom', 620, 180, { size: 26, alpha: seg(p, 0.4, 0.6) });
          Art.text(g, '55.85 g/mol', 620, 300, { font: 'display', size: 44, color: C.pink, alpha: seg(p, 0.65, 0.85) });
          Art.text(g, 'mass of one mole of atoms', 620, 346, { size: 26, alpha: seg(p, 0.7, 0.9) });
          void t;
        },
      },
      {
        say: 'Careful with capitals. <b>Co</b> is cobalt, a single metal element. <b>CO</b> is carbon monoxide, a deadly gas made of two elements. One small letter changes everything.',
        dur: 3.6,
        draw(g, p, t, { H }) {
          const a = ease.back(seg(p, 0.05, 0.3)), b = ease.back(seg(p, 0.4, 0.65));
          Art.popIn(g, 210, 200, a, (gg) => { Art.atom(gg, 0, 0, 96, 'Co', { face: 'happy', t, look: [1, 0] }); });
          Art.text(g, 'Co', 210, 54, { font: 'display', size: 62, color: bright(Art.elementColor('Co')), alpha: seg(p, 0.05, 0.2) });
          Art.text(g, 'cobalt, one element', 190, 340, { size: 27, alpha: seg(p, 0.2, 0.35) });
          Art.popIn(g, 580, 200, b, (gg) => { Art.molecule(gg, 0, 0, 124, 'CO', { face: 'grumpy', faceAll: true, t, look: [-1, 0] }); });
          Art.text(g, 'CO', 580, 54, { font: 'display', size: 62, color: C.pink, alpha: seg(p, 0.4, 0.55) });
          Art.text(g, 'carbon monoxide, two elements', 580, 340, { size: 27, alpha: seg(p, 0.55, 0.7) });
          Art.text(g, 'Check your capitals on every exam', 400, H - 44, { font: 'display', size: 34, color: C.sun, alpha: seg(p, 0.8, 0.95) });
        },
      },
    ],
  });
  /** A nucleus of 26 protons and 30 neutrons, for the first tile scene. */
  function cluster(g, cx, cy, q, t) {
    const n = 56;
    for (let i = n - 1; i >= 0; i--) {
      const k = ease.back(clamp(q * (n + 10) - (n - 1 - i) * 0.9));
      if (k <= 0) continue;
      const a = i * 2.39996, d = Math.sqrt(i) * 11.4;
      const x = cx + Math.cos(a) * d + wander(i, t) * 0.8, y = cy + Math.sin(a) * d + wander(i + 3, t) * 0.8;
      Art.ball(g, x, y, 11 * k, i % 56 < 26 ? C.proton : C.neutron);
    }
  }

  /* ---------- Bench: table explorer ---------- */
  const T = { x0: 32, y0: 28, w: 42.2, h: 45, fy: 366, H: 520 };
  const tileX = (e) => T.x0 + (e.x - 1) * T.w;
  const tileY = (e) => (e.y <= 7 ? T.y0 + (e.y - 1) * T.h : T.fy + (e.y - 9) * T.h);
  const tb = { mode: 'groups', prev: 'groups', modeT: 0, sel: EL.Fe, hover: null, fam: null, t: 0 };
  const stateKind = (e) => (e.state.startsWith('Expected') ? 'unknown' : e.state.toLowerCase());
  const STATE_COL = { solid: '#6F6A93', liquid: '#2F9BFF', gas: '#F0569E', unknown: '#3B2F52' };
  const FAM_LABELS = [
    ['Alkali metal', 'Alkali metals'], ['Alkaline earth metal', 'Alkaline earths'], ['Transition metal', 'Transition metals'], ['Post-transition metal', 'Other metals'],
    ['Metalloid', 'Metalloids'], ['Nonmetal', 'Nonmetals'], ['Halogen', 'Halogens'], ['Noble gas', 'Noble gases'], ['Lanthanide', 'Lanthanides'], ['Actinide', 'Actinides'],
  ];
  const chargeOf = (e) => {
    if (e.sym === 'H') return '+1 or −1';
    const g2 = e.group;
    if (!g2) return 'Varies';
    if (g2 === 1) return '+1';
    if (g2 === 2) return '+2';
    if (g2 >= 3 && g2 <= 12) return e.sym === 'Ag' ? '+1' : e.sym === 'Zn' || e.sym === 'Cd' ? '+2' : 'Varies';
    if (g2 === 13) return e.sym === 'B' ? 'Shares electrons' : '+3';
    if (g2 === 14) return e.sym === 'C' || e.sym === 'Si' ? 'Shares electrons' : e.sym === 'Sn' || e.sym === 'Pb' ? '+2 or +4' : 'Varies';
    if (g2 === 15) return e.sym === 'N' || e.sym === 'P' ? '−3' : 'Varies';
    if (g2 === 16) return e.sym === 'O' || e.sym === 'S' || e.sym === 'Se' ? '−2' : 'Varies';
    if (g2 === 17) return '−1';
    return 'None';
  };
  function tileLook(e, mode, sel, fam) {
    // Returns [fill, textColor].
    const dim = '#2C1E49', dimT = '#6F5F90';
    switch (mode) {
      case 'number': return ['#3B2763', C.ink];
      case 'metal': return [KIND_COL[metalKind(e)], '#fff'];
      case 'family': {
        const c = Lab.familyColor(e.family);
        if (fam && e.family !== fam) return [dim, dimT];
        return [c, '#fff'];
      }
      case 'state': { const k = stateKind(e); return [STATE_COL[k], k === 'unknown' ? dimT : '#fff']; }
      case 'diatomic': return DIATOMIC.includes(e.sym) ? [Art.elementColor(e.sym), Art.lum(Art.elementColor(e.sym)) > 0.6 ? '#22123A' : '#fff'] : [dim, dimT];
      case 'charge': {
        const c = chargeOf(e);
        if (c.startsWith('+') && !c.includes('or')) return ['#D62D7E', '#fff'];
        if (c.startsWith('−')) return ['#1178B8', '#fff'];
        if (c === 'None') return ['#5C4A85', '#fff'];
        if (c === 'Varies' || c.includes('or')) return ['#6E5A2E', '#FFE9A8'];
        return [dim, dimT];
      }
      default: { // groups
        if (!sel) return ['#3B2763', C.ink];
        const sameG = sel.group && e.group === sel.group, sameP = sel.y <= 7 && e.y === sel.y;
        if (sameG && sameP) return [C.sun, '#22123A'];
        if (sameG) return ['#D62D7E', '#fff'];
        if (sameP) return ['#0F93B2', '#fff'];
        return ['#35235A', '#BBAED6'];
      }
    }
  }
  const tableStage = Lab.stage('#c-table', {
    h: T.H,
    bg: (g, W, H) => { const r = g.createLinearGradient(0, 0, 0, H); r.addColorStop(0, '#21123C'); r.addColorStop(1, '#170C29'); g.fillStyle = r; g.fillRect(0, 0, W, H); },
    label: 'The periodic table of 118 elements. Tap a tile to inspect it. The view changes to show groups, metals, families, states, charges or diatomic elements.',
    onPointer(e) {
      const hit = ELS.find((x) => { const X = tileX(x), Y = tileY(x); return e.x >= X && e.x < X + T.w && e.y >= Y && e.y < Y + T.h; });
      if (e.type === 'hover') { tb.hover = hit || null; tableStage.canvas.style.cursor = hit ? 'pointer' : 'default'; return; }
      if (e.type === 'down') {
        if (hit) { tb.sel = hit; Lab.sound.pop(); paintTb(); return; }
        if (tb.mode === 'family') {
          const pick = legendHit(e.x, e.y);
          tb.fam = pick === tb.fam ? null : pick;
        }
      }
    },
    draw(g, t) {
      tb.t = t;
      const trans = t - tb.modeT;
      // Group numbers along the top.
      for (let i = 1; i <= 18; i++) {
        const lit = tb.mode === 'groups' && tb.sel && tb.sel.group === i;
        let txt = String(i), col = lit ? C.pink : '#8878A8';
        if (tb.mode === 'charge') {
          const map = { 1: '+1', 2: '+2', 13: '+3', 15: '−3', 16: '−2', 17: '−1', 18: '0' };
          txt = map[i] || ''; col = i <= 13 ? '#FF7AB6' : i === 18 ? C.dim : '#5BBDFF';
        }
        if (txt) Art.text(g, txt, T.x0 + (i - 0.5) * T.w, 14, { size: tb.mode === 'charge' ? 22 : 20, color: col, font: tb.mode === 'charge' ? 'display' : 'body' });
      }
      for (let i = 1; i <= 7; i++) {
        const lit = tb.mode === 'groups' && tb.sel && tb.sel.y === i;
        Art.text(g, String(i), 16, T.y0 + (i - 0.5) * T.h, { size: 20, color: lit ? C.cyan : '#8878A8' });
      }
      ELS.forEach((e, idx) => {
        const X = tileX(e), Y = tileY(e);
        const delay = tb.mode === 'number' ? idx * 0.012 : (e.x + e.y) * 0.022;
        const u = ease.inOut(clamp((trans - delay) / 0.28));
        const [f1, t1] = tileLook(e, tb.prev, tb.prevSel, tb.prevFam);
        const [f2, t2] = tileLook(e, tb.mode, tb.sel, tb.fam);
        const fill = u >= 1 ? f2 : Art.mix(f1, f2, u);
        const pop = u > 0 && u < 1 ? Math.sin(u * Math.PI) * 2.5 : 0;
        const isHover = tb.hover === e;
        g.fillStyle = isHover ? Art.mix(fill, '#ffffff', 0.25) : fill;
        Art.round(g, X + 1.2 - pop * 0.5, Y + 1.2 - pop, T.w - 2.4 + pop, T.h - 2.4 + pop, 7); g.fill();
        g.fillStyle = 'rgba(255,255,255,.08)';
        Art.round(g, X + 2.6, Y + 2.6 - pop, T.w - 5.2, (T.h - 5) * 0.42, 5); g.fill();
        const showNum = tb.mode === 'number';
        const liq = tb.mode === 'state' && stateKind(e) === 'liquid';
        Art.text(g, showNum ? String(e.z) : e.sym, X + T.w / 2, Y + T.h / 2 - pop * 0.6 + 1, { font: 'display', size: showNum ? (e.z > 99 ? 20 : 22) : 23, color: u >= 1 ? t2 : (u > 0.5 ? t2 : t1) });
        if (liq) { Art.glow(g, X + T.w / 2, Y + T.h / 2, 46, C.water, 0.6 + Math.sin(t * 3) * 0.2); }
      });
      // A sweep that follows atomic number.
      if (tb.mode === 'number') {
        const z = Math.floor((t * 7) % 118);
        const e = ELS[z];
        const X = tileX(e), Y = tileY(e);
        Art.glow(g, X + T.w / 2, Y + T.h / 2, 34, C.sun, 0.8);
        g.strokeStyle = C.sun; g.lineWidth = 3; Art.round(g, X + 1, Y + 1, T.w - 2, T.h - 2, 7); g.stroke();
      }
      // The diatomic seven.
      if (tb.mode === 'diatomic') {
        const pt = (s) => { const e = EL[s]; return [tileX(e) + T.w / 2, tileY(e) + T.h / 2]; };
        const q = ease.inOut(clamp((trans - 0.3) / 0.9));
        const route = ['N', 'O', 'F', 'Cl', 'Br', 'I'].map(pt);
        g.strokeStyle = C.sun; g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round';
        g.beginPath(); g.moveTo(route[0][0], route[0][1]);
        const segs = route.length - 1, upto = q * segs;
        for (let i = 1; i <= segs; i++) {
          if (i <= upto) g.lineTo(route[i][0], route[i][1]);
          else if (i - 1 < upto) { const f = upto - (i - 1); g.lineTo(lerp(route[i - 1][0], route[i][0], f), lerp(route[i - 1][1], route[i][1], f)); }
        }
        g.stroke();
        ELS.filter((x) => DIATOMIC.includes(x.sym)).forEach((e) => Art.text(g, e.sym, tileX(e) + T.w / 2, tileY(e) + T.h / 2 + 1, { font: 'display', size: 23, color: Art.lum(Art.elementColor(e.sym)) > 0.6 ? '#22123A' : '#fff' }));
        const a = clamp((trans - 1) / 0.5);
        Art.text(g, 'starts at element 7, makes a 7', 620, 400 - 0, { size: 22, color: C.sun, alpha: a, halo: true });
      }
      // Selected tile.
      if (tb.sel) {
        const X = tileX(tb.sel), Y = tileY(tb.sel);
        g.strokeStyle = '#fff'; g.lineWidth = 3.5;
        Art.round(g, X, Y, T.w, T.h, 8); g.stroke();
      }
      drawInspector(g, t);
      drawBottom(g, t);
    },
  });
  function drawInspector(g, t) {
    const e = tb.sel;
    const x = T.x0 + 2 * T.w + 4, y = T.y0 + 1, w = 116, h = 3 * T.h - 6;
    const col = Lab.familyColor(e.family);
    g.fillStyle = C.plum2; g.strokeStyle = col; g.lineWidth = 4;
    Art.round(g, x, y, w, h, 14); g.fill(); g.stroke();
    Art.text(g, String(e.z), x + w / 2, y + 22, { font: 'display', size: 22 });
    Art.text(g, e.sym, x + w / 2, y + 62, { font: 'display', size: 50, color: bright(Art.elementColor(e.sym)) });
    Art.text(g, e.mass < 100 ? e.mass.toFixed(2) : e.mass.toFixed(1), x + w / 2, y + 108, { size: 20 });
    const tx = x + w + 12;
    Art.text(g, e.name, tx, y + 18, { font: 'display', size: 30, align: 'left', color: C.sun });
    const k = tb.mode === 'metal' ? metalKind(e)[0].toUpperCase() + metalKind(e).slice(1) : e.family;
    Art.text(g, k, tx, y + 54, { size: 22, align: 'left', maxW: 300 });
    Art.text(g, e.group ? `Group ${e.group}, period ${e.period}` : `Period ${e.period}`, tx, y + 84, { size: 22, align: 'left', color: C.dim });
    const stateWord = e.state.startsWith('Expected') ? 'Too short-lived to test' : e.state;
    Art.text(g, tb.mode === 'charge' ? `Ion charge: ${chargeOf(e)}` : stateWord, tx, y + 113, { size: 22, align: 'left', color: tb.mode === 'charge' ? C.pink : C.dim, maxW: 300 });
    void t;
  }
  function legendBoxes() {
    // Two rows of tappable family names under the table.
    const rows = [FAM_LABELS.slice(0, 4), FAM_LABELS.slice(4)];
    const out = [];
    rows.forEach((row, ri) => {
      const g = tableStage.g;
      g.font = `700 20px ${Art.FONT_BODY}`;
      const widths = row.map((r) => g.measureText(r[1]).width + 24);
      const total = widths.reduce((a, b) => a + b, 0) + (row.length - 1) * 8;
      let x = 400 - total / 2;
      row.forEach((r, i) => { out.push({ fam: r[0], label: r[1], x, y: 460 + ri * 31, w: widths[i], h: 28 }); x += widths[i] + 8; });
    });
    return out;
  }
  function legendHit(x, y) { const b = legendBoxes().find((k) => x >= k.x && x <= k.x + k.w && y >= k.y && y <= k.y + k.h); return b ? b.fam : tb.fam; }
  function drawBottom(g, t) {
    const y = 486;
    if (tb.mode === 'family') {
      legendBoxes().forEach((b) => {
        const on = !tb.fam || tb.fam === b.fam;
        g.fillStyle = on ? Lab.familyColor(b.fam) : '#2C1E49';
        Art.round(g, b.x, b.y, b.w, b.h, 9); g.fill();
        Art.text(g, b.label, b.x + b.w / 2, b.y + 14.5, { size: 20, color: on ? '#fff' : '#8878A8' });
      });
      return;
    }
    if (tb.mode === 'metal') {
      [['Metals', 'metal', 180], ['Metalloids, on the staircase', 'metalloid', 400], ['Nonmetals', 'nonmetal', 636]].forEach(([l, k, x]) => {
        Art.pill(g, l, x, y, { size: 22, color: KIND_COL[k], text: '#fff' });
      });
      return;
    }
    if (tb.mode === 'state') {
      [['Solid', 'solid', 150], ['Liquid: just Br and Hg', 'liquid', 362], ['Gas', 'gas', 568], ['Too short-lived', 'unknown', 690]].forEach(([l, k, x]) => {
        Art.pill(g, l, x, y, { size: 22, color: STATE_COL[k], text: '#fff' });
      });
      return;
    }
    const msg = {
      groups: 'Tap any tile. Its group lights up pink and its period lights up blue.',
      number: 'Atomic number climbs by one each step. Follow the yellow square.',
      charge: 'Metals lose electrons, nonmetals gain them. Transition metals vary.',
      diatomic: 'H, N, O, F, Cl, Br, I: these seven travel in pairs.',
    }[tb.mode];
    Art.text(g, msg, 400, y, { size: 22, color: C.ink, maxW: 780 });
    void t;
  }
  function paintTb() {
    const e = tb.sel;
    Lab.$('#tb-foot').innerHTML = `<p><b>${e.name}</b>: ${e.fact} <a href="periodic-table.html#${e.sym}" style="color:#2FD6F2">See it in the full table</a>.</p>` + (tb.mode === 'metal' ? '<p>Textbooks disagree about a few elements near the staircase, such as polonium and astatine. Use the list your instructor gives you.</p>' : '');
  }
  Lab.segmented('#tb-mode', (v) => {
    tb.prev = tb.mode; tb.prevSel = tb.sel; tb.prevFam = tb.fam;
    tb.mode = v; tb.modeT = tableStage.t; tb.fam = null;
    paintTb();
  });
  paintTb();

  /* ---------- Bench: hammer and bulb ---------- */
  const SAMPLES = {
    Cu: { name: 'copper', kind: 'metal', col: '#D98A4A', shine: true, bends: true, cond: 1 },
    Al: { name: 'aluminum', kind: 'metal', col: '#C9CCD6', shine: true, bends: true, cond: 1 },
    Fe: { name: 'iron', kind: 'metal', col: '#8D97A8', shine: true, bends: true, cond: 0.85 },
    S: { name: 'sulfur', kind: 'nonmetal', col: '#FFD23F', shine: false, bends: false, cond: 0 },
    I: { name: 'iodine', kind: 'nonmetal', col: '#5B4A6B', shine: false, bends: false, cond: 0, note: 'Iodine crystals have a dark, slightly metallic gleam, but they crumble and do not conduct.' },
    C: { name: 'graphite', kind: 'nonmetal', col: '#4C5260', shine: false, bends: false, cond: 0.7, note: 'Graphite is the famous exception: a nonmetal that conducts electricity. That is why pencil lead can close a circuit.' },
    Si: { name: 'silicon', kind: 'metalloid', col: '#7F8BA0', shine: true, bends: false, cond: 0.22, note: 'Silicon looks shiny like a metal but shatters like a nonmetal, and it conducts a little. That in-between behavior, called semiconducting, is why computer chips are made of it.' },
  };
  const hb = { el: 'Cu', hitT: -99, wired: false, t: 0 };
  const hitDone = () => hb.hitT > 0 && hb.t - hb.hitT > 0.22;
  const hammerStage = Lab.stage('#c-hammer', {
    bg: 'lab', h: 460,
    label: 'A hammer above an anvil holding a sample on the left. On the right a battery, a light bulb and a small piece of the sample in a circuit.',
    draw(g, t) {
      hb.t = t;
      const s = SAMPLES[hb.el];
      const benchY = 390;
      // Anvil.
      const ax = 214, topY = 320;
      g.fillStyle = '#4B4A63'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(ax - 104, topY); g.lineTo(ax + 104, topY); g.lineTo(ax + 84, topY + 22); g.lineTo(ax + 42, topY + 28); g.lineTo(ax + 62, benchY); g.lineTo(ax - 62, benchY); g.lineTo(ax - 42, topY + 28); g.lineTo(ax - 84, topY + 22); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(ax - 96, topY + 2, 192, 5);
      // Sample on the anvil.
      const since = t - hb.hitT;
      const hit = hb.hitT > 0 && since > 0.16;
      const q = hit ? ease.out(clamp((since - 0.16) / 0.25)) : 0;
      const metalLook = (x, y, w, h) => {
        const gr = g.createLinearGradient(x, y, x, y + h);
        gr.addColorStop(0, Art.mix(s.col, '#ffffff', s.shine ? 0.55 : 0.1)); gr.addColorStop(0.5, s.col); gr.addColorStop(1, Art.mix(s.col, '#000000', 0.35));
        g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
        Art.round(g, x, y, w, h, Math.min(8, h / 2)); g.fill(); g.stroke();
        if (s.shine) { g.fillStyle = 'rgba(255,255,255,.5)'; Art.round(g, x + w * 0.1, y + 4, w * 0.3, Math.max(3, h * 0.14), 3); g.fill(); }
      };
      if (s.bends) {
        const w = lerp(116, 190, q), h = lerp(58, 20, q);
        metalLook(ax - w / 2, topY - h, w, h);
      } else if (!hit) {
        lump(g, ax, topY, s, 1);
      } else {
        // It shatters.
        for (let i = 0; i < 14; i++) {
          const dir = rand(i + 2) * Math.PI + Math.PI;
          const fly = ease.out(clamp((since - 0.16) / 0.7));
          const dist = (40 + rand(i * 3) * 110) * fly;
          const x = ax + Math.cos(dir) * dist;
          const land = fly >= 1;
          const y = land ? topY - 6 - rand(i + 4) * 6 : topY - 10 + Math.sin(dir) * dist * 0.8 + fly * fly * 40;
          const r = 6 + rand(i + 9) * 9;
          g.save(); g.translate(clamp(x, ax - 100, ax + 100), Math.min(y, topY - 4)); g.rotate(rand(i) * 6 + fly * 3);
          g.fillStyle = Art.mix(s.col, i % 3 ? '#000000' : '#ffffff', 0.2); g.strokeStyle = '#1A0F2E'; g.lineWidth = 2;
          g.beginPath(); g.moveTo(-r, r * 0.6); g.lineTo(r * 0.2, -r); g.lineTo(r, r * 0.7); g.closePath(); g.fill(); g.stroke();
          g.restore();
        }
      }
      // Hammer.
      const px = 44, py = 196, L = 178;
      const aRest = -1.0, aHit = s.bends ? (hit ? 0.53 : 0.46) : 0.46;
      let a = aRest;
      if (hb.hitT > 0) {
        if (since < 0.16) a = lerp(aRest, aHit, ease.in(clamp(since / 0.16)));
        else if (since < 0.3) a = aHit;
        else if (since < 0.9) a = lerp(aHit, aRest, ease.inOut((since - 0.3) / 0.6));
      }
      g.save(); g.translate(px, py); g.rotate(a);
      g.strokeStyle = '#1A0F2E'; g.lineWidth = 15; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.lineTo(L, 0); g.stroke();
      g.strokeStyle = '#A97F58'; g.lineWidth = 10; g.beginPath(); g.moveTo(0, 0); g.lineTo(L, 0); g.stroke();
      const hg = g.createLinearGradient(L - 20, 0, L + 20, 0);
      hg.addColorStop(0, '#6F6A8B'); hg.addColorStop(0.5, '#C8C4DC'); hg.addColorStop(1, '#6F6A8B');
      g.fillStyle = hg; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
      Art.round(g, L - 26, -44, 52, 88, 8); g.fill(); g.stroke();
      g.restore();
      if (hb.hitT > 0 && since > 0.14 && since < 0.5) Art.burst(g, ax, topY - 30, (since - 0.14) / 0.36, { r: 90, n: 12 });
      if (since < 2) { /* a quick shake sits in the burst */ }
      Art.text(g, s.name, 306, 150, { font: 'display', size: 34, color: bright(s.col) });

      // Circuit on the right.
      const bx = 450, by = 360, sx = 590, sy = 370, lx = 714, ly = 240;
      const wires = [[bx + 40, by], [sx - 50, by]];
      g.strokeStyle = '#E4DEF4'; g.lineWidth = 4; g.lineCap = 'round'; g.lineJoin = 'round';
      const wire1 = [[bx + 34, by], [sx - 52, by]];
      const wire2 = [[sx + 52, by], [lx, by], [lx, ly + 44]];
      const wire3 = [[lx - 18, ly + 28], [lx - 60, ly + 28], [lx - 60, 300], [bx - 40, 300], [bx - 40, by], [bx - 34, by]];
      if (hb.wired) {
        [wire1, wire2, wire3].forEach((w) => { g.beginPath(); w.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); });
      } else {
        const loose = [wire1[0], [bx + 74, by - 4]];
        g.beginPath(); loose.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
        g.beginPath(); wire3.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
        g.beginPath(); [[lx, by], [lx, ly + 44]].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
        g.beginPath(); [[lx, by], [lx - 44, by - 6]].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
      }
      void wires;
      // Battery.
      g.fillStyle = '#FFD23F'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
      Art.round(g, bx - 34, by - 22, 68, 44, 8); g.fill(); g.stroke();
      g.fillStyle = '#1A0F2E'; Art.round(g, bx + 34, by - 8, 7, 16, 2); g.fill();
      Art.text(g, '+', bx + 18, by, { size: 26, color: '#1A0F2E' });
      Art.text(g, '−', bx - 18, by, { size: 26, color: '#1A0F2E' });
      // Small test piece.
      if (s.bends) metalLook(sx - 50, sy - 26, 100, 34);
      else lump(g, sx, sy + 8, s, 0.72);
      const on = hb.wired ? s.cond : 0;
      Art.bulb(g, lx, ly, 34, on);
      if (hb.wired && s.cond > 0) {
        const path = wire1.concat([[sx + 52, by]], wire2.slice(1), wire3);
        // Electrons drift around the loop, faster with better conductors.
        const lens = []; let total = 0;
        for (let i = 1; i < path.length; i++) { const d = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); lens.push(d); total += d; }
        for (let k = 0; k < 14; k++) {
          let s2 = (((t * 90 * s.cond) + (k / 14) * total) % total);
          let i = 0; while (i < lens.length - 1 && s2 > lens[i]) { s2 -= lens[i]; i++; }
          const f = s2 / lens[i];
          Art.electron(g, lerp(path[i][0], path[i + 1][0], f), lerp(path[i][1], path[i + 1][1], f), 5);
        }
      }
      // Report card.
      const tested = { bends: hitDone() && hb.hitT > 0, cond: hb.wired };
      const rows = [
        ['Shiny?', s.shine ? 'Yes' : 'No', true],
        ['When hit?', s.bends ? 'It bends' : 'It shatters', tested.bends],
        ['Conducts?', s.cond > 0.6 ? 'Yes' : s.cond > 0 ? 'A little' : 'No', tested.cond],
      ];
      g.fillStyle = 'rgba(26,15,46,.62)'; Art.round(g, 410, 22, 372, 168, 18); g.fill();
      rows.forEach(([q2, a2, known], i) => {
        const y = 52 + i * 34;
        Art.text(g, q2, 430, y, { size: 24, align: 'left', color: C.dim });
        Art.text(g, known ? a2 : '?', 762, y, { font: 'display', size: 26, align: 'right', color: known ? C.sun : C.faint });
      });
      if (tested.bends && tested.cond) {
        Art.pill(g, `So it is a ${s.kind}`, 596, 162, { size: 26, font: 'display', color: KIND_COL[s.kind], text: '#fff' });
      } else Art.text(g, 'Run both tests', 596, 162, { size: 24, color: C.faint });
    },
  });
  function lump(g, x, baseY, s, k) {
    const w = 118 * k, h = 66 * k;
    const gr = g.createRadialGradient(x - w * 0.15, baseY - h * 0.8, 3, x, baseY - h * 0.4, w * 0.7);
    gr.addColorStop(0, Art.mix(s.col, '#ffffff', s.shine ? 0.55 : 0.25)); gr.addColorStop(1, Art.mix(s.col, '#000000', 0.25));
    g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(x - w * 0.5, baseY);
    g.lineTo(x - w * 0.46, baseY - h * 0.52); g.lineTo(x - w * 0.22, baseY - h * 0.94); g.lineTo(x + w * 0.1, baseY - h); g.lineTo(x + w * 0.38, baseY - h * 0.72); g.lineTo(x + w * 0.5, baseY - h * 0.28); g.lineTo(x + w * 0.5, baseY); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(16,6,34,.4)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(x - w * 0.22, baseY - h * 0.94); g.lineTo(x - w * 0.1, baseY - h * 0.4); g.lineTo(x + w * 0.38, baseY - h * 0.72); g.moveTo(x - w * 0.1, baseY - h * 0.4); g.lineTo(x + w * 0.1, baseY); g.stroke();
  }
  function paintHb() {
    const s = SAMPLES[hb.el];
    const verdict = { metal: 'Metals bend instead of breaking, because their atoms can slide past each other, and they conduct because their electrons can move.', nonmetal: 'Most nonmetals are brittle and do not let electrons flow.', metalloid: 'Metalloids mix the two.' }[s.kind];
    Lab.$('#hb-foot').innerHTML = `<p><b>${s.name[0].toUpperCase() + s.name.slice(1)} is a ${s.kind}.</b> ${s.note || verdict}</p>`;
    Lab.$('#hb-wire').textContent = hb.wired ? 'Disconnect the circuit' : 'Connect the circuit';
  }
  const freshSample = () => { hb.hitT = -99; };
  Lab.segmented('#hb-el', (v) => { hb.el = v; hb.wired = false; freshSample(); paintHb(); });
  Lab.$('#hb-hit').addEventListener('click', () => { freshSample(); hb.hitT = Math.max(0.001, hammerStage.t); Lab.sound.pop(); });
  Lab.$('#hb-wire').addEventListener('click', () => { hb.wired = !hb.wired; paintHb(); Lab.sound.pop(); });
  Lab.$('#hb-new').addEventListener('click', () => { freshSample(); hb.wired = false; paintHb(); });
  paintHb();

  /* ---------- Bench: the family album ---------- */
  const FAM = {
    alkali: {
      go: 'Drop it in the water',
      els: ['Li', 'Na', 'K', 'Rb', 'Cs'],
      data: {
        Li: { power: 0.12, flame: null, life: 11, note: 'Lithium fizzes steadily and floats, with no flame.' },
        Na: { power: 0.36, flame: '#FFC531', life: 6, note: 'Sodium melts into a silver ball and skids around. It can catch fire with a yellow flame.' },
        K: { power: 0.6, flame: '#C78BFF', life: 4, note: 'Potassium bursts into a lilac flame right away.' },
        Rb: { power: 0.84, flame: '#E64FB4', life: 1.2, boom: 0.65, note: 'Rubidium ignites at once and pops violently.' },
        Cs: { power: 1, flame: '#8C8CFF', life: 0.7, boom: 1, note: 'Cesium explodes the moment it touches water, and can shatter the container.' },
      },
    },
    earth: {
      go: 'Add it to the water',
      els: ['Mg', 'Ca', 'Sr', 'Ba'],
      data: {
        Mg: { rate: 0.12, note: 'Magnesium barely reacts with cold water. A few bubbles appear, slowly. Hot steam is another story.' },
        Ca: { rate: 0.5, note: 'Calcium fizzes at a steady pace. The water turns cloudy with calcium hydroxide.' },
        Sr: { rate: 0.75, note: 'Strontium reacts faster than calcium.' },
        Ba: { rate: 1, note: 'Barium fizzes hard. It is reactive, but still calmer than an alkali metal.' },
      },
    },
    halogen: {
      go: 'Lower in hot sodium',
      els: ['F', 'Cl', 'Br', 'I'],
      data: {
        F: { gas: 'rgba(230,240,150,', solid: null, liquid: null, power: 1, state: 'pale yellow gas', note: 'Fluorine is the most reactive element of all. It is too dangerous to use in a school lab.', x: 'NaF' },
        Cl: { gas: 'rgba(170,220,70,', power: 0.75, state: 'yellow-green gas', note: 'Hot sodium burns brightly in chlorine and makes a white smoke of tiny salt crystals.', x: 'NaCl' },
        Br: { gas: 'rgba(190,80,50,', liquid: '#7A2415', power: 0.5, state: 'red-brown liquid', note: 'Bromine is one of only two elements that are liquid at room temperature. Its vapor is also red-brown.', x: 'NaBr' },
        I: { gas: 'rgba(150,70,210,', solid: '#3F2E52', power: 0.28, state: 'dark solid, violet vapor', note: 'Iodine is a dark solid with violet vapor, and the slowest reactor of the four.', x: 'NaI' },
      },
    },
    noble: {
      go: 'Switch on the power',
      els: ['He', 'Ne', 'Ar', 'Kr', 'Xe'],
      data: {
        He: { glow: '#FFB88A', note: 'Helium glows a pinkish orange. It does not form any stable compounds under ordinary conditions.' },
        Ne: { glow: '#FF5A2B', note: 'Neon glows the red-orange of classic signs.' },
        Ar: { glow: '#B48CFF', note: 'Argon glows violet, and it makes up about 1% of the air you are breathing.' },
        Kr: { glow: '#E6E4FF', note: 'Krypton glows a pale whitish lilac.' },
        Xe: { glow: '#7FB2FF', note: 'Xenon glows blue. It is heavy enough to form a few real compounds, such as $\\ce{XeF2}$, under the right conditions.' },
      },
    },
    trans: {
      go: 'Show its ions',
      els: ['Fe', 'Cu', 'Cr', 'Mn', 'Co', 'Ni'],
      data: {
        Fe: { ions: [['Fe^2+', '#B8D98A', 'pale green'], ['Fe^3+', '#D9962B', 'yellow-brown']], note: 'Iron has two common charges, and they differ in color. This is why names like iron(II) and iron(III) exist.' },
        Cu: { ions: [['Cu^2+', '#2B8FE0', 'bright blue'], ['Cu^+', '#E0E8F0', 'colorless in most salts']], note: 'Copper(II) is the familiar blue. Copper(I) is usually found in solids, because it does not last long in water.' },
        Cr: { ions: [['Cr^3+', '#5F9F6B', 'green'], ['Cr2O7^2-', '#F07A1E', 'orange']], note: 'Chromium means color. It gives green and orange compounds, and its name comes from the Greek word for color.' },
        Mn: { ions: [['Mn^2+', '#F2C4D4', 'pale pink'], ['MnO4^-', '#7A1FA0', 'deep purple']], note: 'Manganese goes from almost colorless at $+2$ to intense purple in permanganate.' },
        Co: { ions: [['Co^2+', '#EC6C96', 'pink'], ['Co^2+', '#3D5FE0', 'blue with lots of chloride']], note: 'The same cobalt ion can look pink or blue, depending on what surrounds it in the solution.' },
        Ni: { ions: [['Ni^2+', '#3FB56E', 'green']], note: 'Nickel almost always forms $\\ce{Ni^2+}$, which is green in water.' },
      },
    },
  };
  const fm = { fam: 'alkali', el: 'Na', t0: -99, t: 0 };
  const FORM = {
    alkali: (s) => `2${s} + 2H2O -> 2${s}OH + H2`,
    earth: (s) => `${s} + 2H2O -> ${s}(OH)2 + H2`,
    halogen: (s) => `2Na + ${s}2 -> 2Na${s}`,
  };
  function waterDish(g, cx, baseY, w, h, tint, t, inside) {
    Art.beaker(g, cx, baseY, w, h, { level: 0.62, liquid: C.water, ticks: false, inside: (gg, box) => { if (inside) inside(gg, box); void t; } });
    void tint;
  }
  function alkaliScene(g, t, tau) {
    const s = fm.el, d = FAM.alkali.data[s];
    const cx = 270, baseY = 410, w = 400, h = 210;
    const started = tau >= 0;
    const col = Art.elementColor(s);
    const surface = baseY - (h - 12) * 0.62;
    const dropT = 0.5;
    const inWater = started && tau > dropT;
    const r = tau - dropT;
    const alive = inWater ? clamp(1 - r / d.life) : 1;
    const boom = d.boom && inWater ? clamp(r / d.life) : 0;
    const shake = boom > 0 && boom < 1 ? (Math.sin(t * 80) * 6 * d.boom) : 0;
    g.save(); g.translate(shake, shake * 0.4);
    // Position of the metal: it skids in a fast loop whose speed follows reactivity.
    const speed = 0.9 + d.power * 6;
    const px = (u) => cx + Math.sin(u * speed) * 160 * (0.3 + d.power * 0.7) + Math.sin(u * speed * 0.37 + 1) * 20;
    waterDish(g, cx, baseY, w, h, null, t, (gg, box) => {
      if (inWater) {
        // A pink wake of hydroxide, from the phenolphthalein indicator.
        const n = Math.min(18, Math.floor(r * 7) + 1);
        for (let i = 0; i < n; i++) {
          const u = Math.min(r, d.life) * (i / n);
          const spread = 20 + (r - u) * 26;
          const alpha = clamp(0.32 - (r - u) * 0.02, 0.1, 0.32);
          const gr = gg.createRadialGradient(px(u), box.top + 16, 2, px(u), box.top + 16, spread + 24);
          gr.addColorStop(0, `rgba(255,70,170,${alpha})`); gr.addColorStop(1, 'rgba(255,70,170,0)');
          gg.fillStyle = gr; gg.fillRect(box.x0, box.top, box.x1 - box.x0, box.bottom - box.top);
        }
      }
    });
    if (!started) {
      Art.text(g, s, cx, 96, { font: 'display', size: 40, color: bright(col) });
      g.fillStyle = col; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3; Art.round(g, cx - 26, 126, 52, 34, 8); g.fill(); g.stroke();
    } else if (!inWater) {
      const y = lerp(126, surface - 16, ease.in(clamp(tau / dropT)));
      g.fillStyle = col; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3; Art.round(g, cx - 26, y, 52, 34, 8); g.fill(); g.stroke();
    } else if (alive > 0) {
      const x = px(r), y = surface - 4;
      const R = 24 * Math.sqrt(alive) + 5;
      // Fizz.
      const fizz = 6 + d.power * 14;
      for (let i = 0; i < fizz; i++) {
        const ph = (t * (1.2 + rand(i) * 1.6) + rand(i + 3)) % 1;
        const bx = x + (rand(i + 7) - 0.5) * 52 * (1 + ph);
        const by = y - ph * 40 + 6;
        g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.6;
        g.beginPath(); g.arc(bx, by, 2.4 + rand(i + 2) * 2.6, 0, TAU); g.stroke();
      }
      if (d.flame) {
        const hF = (70 + d.power * 110) * (0.7 + alive * 0.3);
        Art.glow(g, x, y - hF * 0.45, hF, d.flame, 0.55);
        const fl = 1 + Math.sin(t * 19) * 0.09;
        g.fillStyle = Art.alpha(d.flame, 0.8);
        g.beginPath(); g.moveTo(x - R, y); g.bezierCurveTo(x - R * 1.4, y - hF * 0.3, x - R * 0.2, y - hF * 0.7 * fl, x + Math.sin(t * 13) * 7, y - hF * fl);
        g.bezierCurveTo(x + R * 0.2, y - hF * 0.7 * fl, x + R * 1.4, y - hF * 0.3, x + R, y); g.fill();
        g.fillStyle = 'rgba(255,255,230,.8)';
        g.beginPath(); g.moveTo(x - R * 0.5, y); g.quadraticCurveTo(x, y - hF * 0.55 * fl, x + R * 0.5, y); g.fill();
      }
      Art.ball(g, x, y, R, '#D5D8E4');
    }
    // Explosion.
    if (boom > 0) {
      const b = clamp(r / (d.life + 1.1));
      if (b < 1) {
        Art.glow(g, cx, surface - 20, 340 * d.boom * Math.sin(b * Math.PI), d.flame, 0.9);
        Art.burst(g, cx, surface - 20, b, { r: 300, n: 32, colors: ['#fff', d.flame, C.water, C.sun] });
        for (let i = 0; i < 24; i++) {
          const a = -Math.PI * (0.1 + rand(i) * 0.8), v = 90 + rand(i + 4) * 240 * d.boom;
          const dx = Math.cos(a) * v * b, dy = Math.sin(a) * v * b + 260 * b * b;
          g.fillStyle = 'rgba(120,200,255,.85)';
          g.beginPath(); g.arc(cx + dx * 1.2, surface + dy, 3 + rand(i + 5) * 4, 0, TAU); g.fill();
        }
      }
    }
    g.restore();
    // Particle view: the outer electron is what makes this happen.
    Art.zoom(g, cx + 120, surface + 40, 636, 158, 130, (gg, zx, zy) => {
      const cycle = ((t * 0.45) % 1);
      const u = ease.inOut(seg(cycle, 0.1, 0.5));
      Art.atom(gg, zx - 62, zy, 50, s, { face: u > 0.5 ? 'happy' : 'wink', t, look: [1, 0], charge: u > 0.9 ? '+' : null });
      Art.molecule(gg, zx + 74, zy + 8, 40, 'H2O', { rot: Math.sin(t) * 0.1, labels: false, face: u > 0.9 ? 'wow' : 'happy', t, look: [-1, 0] });
      if (u < 1) Art.electron(gg, lerp(zx - 12, zx + 56, u), zy - 26 * Math.sin(u * Math.PI), 8);
    }, { p: 1 });
    Art.text(g, 'gives away its 1 outer electron', 636, 306, { size: 22, color: C.cyan, halo: true, maxW: 320 });
    // Reactivity meter.
    Art.text(g, 'Reactivity', 636, 346, { size: 23, color: C.dim });
    Art.meter(g, 500, 364, 272, 20, d.power, { color: d.power > 0.8 ? C.red : d.power > 0.4 ? C.fire : C.leaf });
    Art.formula(g, FORM.alkali(s), 636, 416, { size: 25, color: C.ink });
    if (started && r > d.life + 1.2) Art.text(g, d.boom ? 'That was the whole sample.' : 'All used up. The water is now basic.', cx, 90, { size: 25, color: C.sun, halo: true, maxW: 460 });
    if (!started) Art.text(g, 'Pink shows the base that forms', cx, 44, { size: 24, color: '#FF9AD0', halo: true });
  }
  function earthScene(g, t, tau) {
    const s = fm.el, d = FAM.earth.data[s];
    const cx = 250, baseY = 404, w = 300, h = 310;
    const started = tau >= 0;
    const col = Art.elementColor(s);
    const q = started ? clamp((tau - 0.5) / 1.2) : 0;
    const box = Art.beaker(g, cx, baseY, w, h, {
      level: 0.72, liquid: C.water, ticks: false,
      inside: (gg, b) => {
        if (q > 0) {
          // Cloudy hydroxide, more for faster reactors.
          gg.fillStyle = `rgba(255,255,255,${0.32 * d.rate * clamp(tau / 5)})`;
          gg.fillRect(b.x0, b.top, b.x1 - b.x0, b.bottom - b.top);
          Art.bubbles(gg, cx - 40, cx + 40, b.bottom - 34, b.top + 4, t, { n: Math.round(3 + d.rate * 26), r: 5 });
        }
      },
    });
    const y = started ? lerp(64, baseY - 24, ease.bounce(clamp(tau / 0.8))) : 64;
    g.fillStyle = col; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    Art.round(g, cx - 32, y - 18, 64, 36, 8); g.fill(); g.stroke();
    if (!started) Art.text(g, s, cx, 28, { font: 'display', size: 34, color: bright(col) });
    void box;
    Art.text(g, 'Bubbles of H₂', 580, 80, { size: 26, color: C.ink });
    Art.meter(g, 450, 104, 300, 24, q * d.rate, { color: C.cyan });
    Art.zoom(g, cx + 30, baseY - 130, 600, 266, 104, (gg, zx, zy) => {
      Art.atom(gg, zx - 42, zy + 6, 46, s, { face: 'happy', t, charge: q > 0.5 ? '2+' : null, look: [1, 0] });
      const cycle = (t * 0.5) % 1;
      Art.electron(gg, lerp(zx + 8, zx + 74, cycle), zy - 30 + Math.sin(cycle * 6) * 4, 7);
      Art.electron(gg, lerp(zx + 8, zx + 74, (cycle + 0.5) % 1), zy + 26, 7);
    }, { p: 1 });
    Art.text(g, 'gives away 2 electrons', 600, 396, { size: 23, color: C.cyan, halo: true });
    Art.formula(g, FORM.earth(s), 400, 432, { size: 26 });
  }
  function halogenScene(g, t, tau) {
    const s = fm.el, d = FAM.halogen.data[s];
    const cx = 250, baseY = 396, w = 250, h = 320;
    const started = tau >= 0;
    const q = started ? clamp((tau - 0.7) / 3) : 0;
    const col = Art.elementColor(s);
    Art.flask(g, cx, baseY, w, h, { level: 0 });
    // Halogen inside the flask, clipped by hand.
    g.save();
    const neckW = w * 0.3, neckH = h * 0.3, top = baseY - h;
    g.beginPath(); g.moveTo(cx - neckW / 2, top + 5); g.lineTo(cx - neckW / 2, top + neckH); g.lineTo(cx - w / 2 + 4, baseY - 18); g.quadraticCurveTo(cx - w / 2 - 3, baseY, cx - w / 2 + 18, baseY); g.lineTo(cx + w / 2 - 18, baseY); g.quadraticCurveTo(cx + w / 2 + 3, baseY, cx + w / 2 - 4, baseY - 18); g.lineTo(cx + neckW / 2, top + neckH); g.lineTo(cx + neckW / 2, top + 5); g.closePath(); g.clip();
    const fade = 1 - q * 0.8;
    const gr = g.createLinearGradient(0, baseY, 0, top);
    gr.addColorStop(0, d.gas + (0.8 * fade).toFixed(2) + ')'); gr.addColorStop(1, d.gas + (0.2 * fade).toFixed(2) + ')');
    g.fillStyle = gr; g.fillRect(cx - w, top, w * 2, h);
    if (d.liquid) { g.fillStyle = d.liquid; g.fillRect(cx - w, baseY - 40, w * 2, 40); }
    if (d.solid) for (let i = 0; i < 12; i++) { g.fillStyle = d.solid; const px = cx - 80 + i * 14 + rand(i) * 6; g.fillRect(px, baseY - 14 - rand(i + 3) * 14, 13, 14); }
    if (q > 0) {
      // White salt smoke.
      Art.smoke(g, cx, baseY - 60 - q * 40, t, { n: 16, h: 170, r: 26, color: '#FFFFFF', alpha: 0.65 * q, spread: 60, speed: 0.3 });
    }
    g.restore();
    // Sodium on a spoon.
    const sy = started ? lerp(baseY - h - 70, baseY - 120, ease.inOut(clamp(tau / 0.7))) : baseY - h - 70;
    g.strokeStyle = '#C9C7DB'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx, sy - 90); g.lineTo(cx, sy + 16); g.stroke();
    g.fillStyle = '#C9C7DB'; g.beginPath(); g.ellipse(cx, sy + 20, 20, 8, 0, 0, TAU); g.fill();
    Art.ball(g, cx, sy + 8, 12, '#EAEAF2');
    if (q > 0 && q < 1) {
      Art.glow(g, cx, sy + 8, 40 + 90 * d.power, '#FFC531', 0.9 * d.power * (0.75 + Math.sin(t * 25) * 0.25));
      Art.burst(g, cx, sy + 8, (t * 1.2) % 1, { r: 60 + 60 * d.power, n: 10 });
    }
    Art.text(g, d.state, cx, 432, { size: 24, color: C.sun, halo: true });
    // Molecule zoom: halogens pair up.
    const moved = started && q > 0.3;
    Art.zoom(g, cx + 70, baseY - 120, 600, 168, 128, (gg, zx, zy) => {
      if (!moved) {
        Art.molecule(gg, zx - 8, zy - 40, 70, `${s}2`, { rot: Math.sin(t * 0.8) * 0.2, face: 'happy', faceAll: true, t });
        Art.molecule(gg, zx + 12, zy + 58, 58, `${s}2`, { rot: 0.5 + Math.sin(t * 0.6) * 0.2 });
      } else {
        for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
          const na = (i + j + 4) % 2 === 0;
          Art.atom(gg, zx + i * 74 + wander(i + j * 5, t) * 2, zy + j * 74 + wander(i * 3 + j, t) * 2, na ? 28 : 37, na ? 'Na' : s, { charge: i === 0 && j === 0 ? (na ? '+' : '-') : null, label: false, face: i === 0 && j === 0 ? 'happy' : null, t });
        }
      }
    }, { p: 1 });
    Art.text(g, moved ? `${d.x}: a crystal of ions` : `${s}₂: atoms in pairs`, 600, 324, { size: 24, color: C.cyan, halo: true });
    Art.formula(g, FORM.halogen(s), 600, 372, { size: 26 });
    Art.text(g, 'Reactivity', 600, 410, { size: 22, color: C.dim });
    Art.meter(g, 470, 426, 260, 18, d.power, { color: d.power > 0.8 ? C.red : d.power > 0.4 ? C.fire : C.leaf });
    void col;
  }
  function nobleScene(g, t, tau) {
    const s = fm.el, d = FAM.noble.data[s];
    const started = tau >= 0;
    const on = started ? clamp(tau / 0.4) : 0;
    const flick = 0.86 + 0.14 * Math.sin(t * 40) * Math.sin(t * 13);
    const x0 = 70, x1 = 530, y = 130;
    if (on > 0) { Art.glow(g, (x0 + x1) / 2, y, 280, d.glow, 0.4 * on * flick); }
    // Discharge tube.
    g.save();
    g.fillStyle = on > 0 ? Art.alpha(d.glow, 0.75 * on * flick) : 'rgba(214,240,255,.08)';
    Art.round(g, x0, y - 40, x1 - x0, 80, 40); g.fill();
    if (on > 0) { g.fillStyle = Art.alpha('#ffffff', 0.55 * on * flick); Art.round(g, x0 + 22, y - 12, x1 - x0 - 44, 24, 12); g.fill(); }
    g.strokeStyle = C.glass; g.lineWidth = 4; Art.round(g, x0, y - 40, x1 - x0, 80, 40); g.stroke();
    g.fillStyle = '#6F6A8B'; g.fillRect(x0 - 18, y - 14, 26, 28); g.fillRect(x1 - 8, y - 14, 26, 28);
    g.restore();
    g.strokeStyle = '#8A7CA8'; g.lineWidth = 4; g.beginPath(); g.moveTo(x0 - 18, y); g.lineTo(30, y); g.lineTo(30, 240); g.lineTo(x1 + 40, 240); g.lineTo(x1 + 40, y); g.lineTo(x1 + 18, y); g.stroke();
    g.fillStyle = C.sun; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3; Art.round(g, 240, 220, 120, 40, 8); g.fill(); g.stroke();
    Art.text(g, 'High voltage', 300, 240, { size: 20, color: '#1A0F2E' });
    Art.text(g, EL[s].name, 300, 60, { font: 'display', size: 38, color: on > 0 ? d.glow : C.ink });
    // The unreactive test.
    const a = seg(tau, 1, 2);
    Art.atom(g, 150, 360, 52, s, { face: 'sleepy', t, look: [1, 0] });
    Art.atom(g, 340, 360, 40, 'Na', { face: a > 0.6 ? 'sad' : 'wink', t, look: [-1, 0] });
    Art.text(g, 'Want my electron?', 340, 296, { size: 23, alpha: a, color: C.ink, halo: true });
    Art.text(g, 'No thanks.', 150, 290, { size: 23, alpha: seg(tau, 1.8, 2.4), color: C.dim, halo: true });
    // Zoom on a full shell.
    Art.zoom(g, 520, 130, 640, 286, 132, (gg, zx, zy) => {
      const n = s === 'He' ? 2 : 8;
      gg.strokeStyle = 'rgba(47,214,242,.45)'; gg.lineWidth = 2; gg.setLineDash([5, 6]); gg.beginPath(); gg.arc(zx, zy, 92, 0, TAU); gg.stroke(); gg.setLineDash([]);
      Art.atom(gg, zx, zy, 38, s, { face: 'sleepy', t, label: false });
      for (let i = 0; i < n; i++) { const an = t * 0.5 + (i / n) * TAU; Art.electron(gg, zx + Math.cos(an) * 92, zy + Math.sin(an) * 92, 7); }
    }, { p: 1 });
    Art.text(g, s === 'He' ? 'full shell: 2 electrons' : 'full shell: 8 electrons', 640, 440, { size: 22, color: C.cyan, halo: true });
    Art.text(g, s === 'He' ? '' : '', 0, 0, { size: 20 });
  }
  function transScene(g, t, tau) {
    const s = fm.el, d = FAM.trans.data[s];
    const started = tau >= 0;
    const q = started ? ease.out(clamp(tau / 1)) : 0;
    const n = d.ions.length;
    const xs = n === 1 ? [250] : [150, 400];
    Art.bench(g, 800, 366, 104);
    d.ions.forEach(([f, col, word], i) => {
      const x = xs[i];
      const qq = started ? ease.out(clamp((tau - i * 0.5) / 0.9)) : 0;
      const shown = Art.mix('#BFE7FF', col, qq);
      Art.beaker(g, x, 366, 180, 220, { level: 0.74, liquid: shown, ticks: false, inside: (gg, b) => {
        for (let k = 0; k < 5; k++) {
          const px = lerp(b.x0 + 20, b.x1 - 20, rand(k + i * 5)) + wander(k, t) * 6;
          const py = lerp(b.top + 20, b.bottom - 16, rand(k + 9 + i * 3)) + wander(k + 4, t) * 6;
          gg.fillStyle = 'rgba(255,255,255,.35)'; gg.beginPath(); gg.arc(px, py, 5, 0, TAU); gg.fill();
        }
      } });
      if (started) {
        Art.formula(g, f, x, 400, { size: 32, color: '#fff', alpha: qq });
        Art.text(g, word, x, 438, { size: 22, color: C.sun, alpha: qq, maxW: 240 });
      } else Art.text(g, '?', x, 400, { font: 'display', size: 34, color: C.dim });
    });
    // Tile on the right.
    bigTile(g, 650, 170, 176, 230, EL[s]);
    Art.text(g, 'many charges', 650, 318, { font: 'display', size: 26, color: C.sun, alpha: q });
    Art.text(g, 'colorful ions', 650, 348, { font: 'display', size: 26, color: C.pink, alpha: q });
    void n;
  }
  const familyStage = Lab.stage('#c-family', {
    h: 470, bg: 'micro',
    label: 'An animated experiment for the chosen element family: alkali metals in water, alkaline earths in water, sodium with halogens, glowing noble gases, or colored transition metal ions.',
    draw(g, t) {
      fm.t = t;
      const tau = fm.t0 > 0 ? t - fm.t0 : -1;
      if (fm.fam === 'alkali') alkaliScene(g, t, tau);
      else if (fm.fam === 'earth') earthScene(g, t, tau);
      else if (fm.fam === 'halogen') halogenScene(g, t, tau);
      else if (fm.fam === 'noble') nobleScene(g, t, tau);
      else transScene(g, t, tau);
    },
  });
  function buildMembers() {
    const f = FAM[fm.fam];
    const host = Lab.$('#fm-el');
    host.innerHTML = f.els.map((s) => `<button type="button" data-value="${s}" aria-pressed="${s === fm.el}">${EL[s].name}</button>`).join('');
    Lab.segmented(host, (v) => { fm.el = v; fm.t0 = -99; paintFm(); });
    Lab.$('#fm-go').textContent = f.go;
  }
  function paintFm() {
    const d = FAM[fm.fam].data[fm.el];
    Lab.$('#fm-foot').innerHTML = Lab.texString(`<p>${d.note}</p>`);
  }
  Lab.segmented('#fm-fam', (v) => {
    fm.fam = v; fm.t0 = -99;
    fm.el = { alkali: 'Na', earth: 'Ca', halogen: 'Cl', noble: 'Ne', trans: 'Fe' }[v];
    buildMembers(); paintFm();
  });
  Lab.$('#fm-go').addEventListener('click', () => { fm.t0 = Math.max(0.0001, familyStage.t); Lab.sound.pop(); });
  buildMembers(); paintFm();
  familyStage.data.fm = fm;

  /* ---------- Story 3: predicting ion charges ---------- */
  function shellAtom(g, x, y, R, s, inner, outer, o = {}) {
    const col = Art.elementColor(s);
    Art.glow(g, x, y, R * 1.2, col, 0.12);
    g.strokeStyle = 'rgba(47,214,242,.4)'; g.lineWidth = 2; g.setLineDash([5, 6]); g.beginPath(); g.arc(x, y, R, 0, TAU); g.stroke(); g.setLineDash([]);
    Art.atom(g, x, y, R * 0.42, s, { face: o.face, t: o.t, label: s, charge: o.charge, seed: o.seed, look: o.look });
    for (let i = 0; i < outer; i++) {
      const a = (o.t || 0) * 0.4 + (i / Math.max(outer, 1)) * TAU;
      Art.electron(g, x + Math.cos(a) * R, y + Math.sin(a) * R, 7.5);
    }
    void inner;
  }
  function loseGain(g, s, x, y, R, startOuter, delta, q, t, ionText, target, o = {}) {
    // delta < 0: lose electrons. delta > 0: gain electrons.
    const u = ease.inOut(q);
    const settled = u >= 0.98;
    const finalOuter = delta < 0 ? 8 : startOuter + delta;
    const showOuter = delta < 0 ? (settled ? 0 : startOuter) : startOuter;
    g.strokeStyle = 'rgba(47,214,242,.4)'; g.lineWidth = 2; g.setLineDash([5, 6]); g.beginPath(); g.arc(x, y, R, 0, TAU); g.stroke(); g.setLineDash([]);
    if (delta < 0 && settled) {
      g.strokeStyle = 'rgba(61,220,132,.8)'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, R * 0.72, 0, TAU); g.stroke();
      for (let i = 0; i < 8; i++) { const a = t * 0.35 + (i / 8) * TAU; Art.electron(g, x + Math.cos(a) * R * 0.72, y + Math.sin(a) * R * 0.72, 6.5); }
    }
    for (let i = 0; i < showOuter && delta < 0; i++) {
      const a = t * 0.2 - 0.7 + (i / Math.max(showOuter, 1)) * TAU;
      const fx = x + Math.cos(a) * R, fy = y + Math.sin(a) * R;
      Art.electron(g, lerp(fx, x + (o.toX || 300), u), lerp(fy, y - 130 + i * 24, u), 8);
    }
    if (delta > 0) {
      for (let i = 0; i < startOuter; i++) { const a = t * 0.3 + (i / finalOuter) * TAU; Art.electron(g, x + Math.cos(a) * R, y + Math.sin(a) * R, 7.5); }
      for (let i = 0; i < delta; i++) {
        const a = t * 0.3 + ((startOuter + i) / finalOuter) * TAU;
        const fx = x + Math.cos(a) * R, fy = y + Math.sin(a) * R;
        Art.electron(g, lerp(x + (o.toX || -300), fx, u), lerp(y - 130 + i * 24, fy, u), 8);
      }
    }
    Art.atom(g, x, y, R * 0.46, s, { face: settled ? 'happy' : 'grumpy', t, look: [delta < 0 ? 1 : -1, 0], charge: settled ? ionText : null, label: s });
    if (target) Art.text(g, target, x, y + R + 30, { size: 24, color: C.leaf, alpha: seg(q, 0.9, 1), halo: true });
  }
  const STRIP = [[1, '+1', 'Na'], [2, '+2', 'Mg'], [13, '+3', 'Al'], [15, '−3', 'N'], [16, '−2', 'O'], [17, '−1', 'Cl'], [18, '0', 'Ne']];
  Lab.story('#story-ions', {
    title: 'Why the group predicts the charge',
    scenes: [
      {
        say: 'Noble gases have <b>full outer shells</b>, so they are stable and content. Every atom nearby would love to have the same number of electrons as its nearest noble gas.',
        dur: 3.4,
        draw(g, p, t, { W, H }) {
          const q = ease.back(seg(p, 0.05, 0.4));
          if (q > 0) {
            g.save(); g.translate(W / 2 - 150, H / 2); g.scale(q, q); g.translate(-(W / 2 - 150), -H / 2);
            shellAtom(g, W / 2 - 150, H / 2, 170, 'Ne', 2, 8, { face: 'sleepy', t });
            g.restore();
          }
          Art.text(g, 'neon', W / 2 - 150, 30, { font: 'display', size: 32, alpha: seg(p, 0.2, 0.4) });
          Art.text(g, '8 outer electrons', 620, 170, { font: 'display', size: 32, color: C.cyan, alpha: seg(p, 0.4, 0.6) });
          Art.text(g, 'Nothing left to want', 620, 216, { size: 27, alpha: seg(p, 0.5, 0.7) });
          Art.moe(g, 660, H - 16, 130, 'happy', { t, flip: true });
        },
      },
      {
        say: '<b>Sodium</b>, in group 1, has one lonely outer electron. Giving it away leaves a full shell underneath, the same as neon. It has one more proton than electrons, so it becomes $\\ce{Na+}$.',
        dur: 4,
        draw(g, p, t, { H }) {
          loseGain(g, 'Na', 260, H / 2 + 6, 150, 1, -1, seg(p, 0.15, 0.6), t, '+', 'matches neon', { toX: 480 });
          Art.text(g, 'group 1', 620, 110, { font: 'display', size: 46, color: C.sun, alpha: seg(p, 0, 0.2) });
          Art.text(g, '1 outer electron', 620, 165, { size: 28, alpha: seg(p, 0.05, 0.25) });
          Art.text(g, 'Na⁺', 620, 270, { font: 'display', size: 88, color: Art.elementColor('Na'), alpha: seg(p, 0.6, 0.8) });
          Art.text(g, 'charge +1', 620, 340, { font: 'display', size: 34, color: C.pink, alpha: seg(p, 0.65, 0.85) });
        },
      },
      {
        say: 'Next door, <b>magnesium</b> in group 2 gives away two electrons, making $\\ce{Mg^2+}$. <b>Aluminum</b> in group 13 gives away three, making $\\ce{Al^3+}$. Metals lose electrons.',
        dur: 4.2,
        draw(g, p, t, { H }) {
          loseGain(g, 'Mg', 190, H / 2 + 22, 124, 2, -2, seg(p, 0.1, 0.45), t, '2+', 'matches neon', { toX: 190 });
          loseGain(g, 'Al', 590, H / 2 + 22, 124, 3, -3, seg(p, 0.5, 0.85), t, '3+', 'matches neon', { toX: 190 });
          Art.text(g, 'group 2: Mg²⁺', 190, 46, { font: 'display', size: 34, color: Art.elementColor('Mg'), alpha: seg(p, 0.05, 0.2) });
          Art.text(g, 'group 13: Al³⁺', 590, 46, { font: 'display', size: 34, color: Art.elementColor('Al'), alpha: seg(p, 0.5, 0.65) });
        },
      },
      {
        say: 'Nonmetals go the other way, because <b>gaining</b> is easier than losing. Chlorine needs 1 more electron to match argon, so it becomes $\\ce{Cl-}$. Oxygen needs 2 to match neon, so it becomes $\\ce{O^2-}$.',
        dur: 4.2,
        draw(g, p, t, { H }) {
          loseGain(g, 'Cl', 210, H / 2 + 22, 126, 7, 1, seg(p, 0.1, 0.45), t, '-', 'matches argon', { toX: -190 });
          loseGain(g, 'O', 590, H / 2 + 22, 126, 6, 2, seg(p, 0.5, 0.85), t, '2-', 'matches neon', { toX: -190 });
          Art.text(g, 'group 17: Cl⁻', 210, 46, { font: 'display', size: 34, color: Art.elementColor('Cl'), alpha: seg(p, 0.05, 0.2) });
          Art.text(g, 'group 16: O²⁻', 590, 46, { font: 'display', size: 34, color: '#FF8A94', alpha: seg(p, 0.5, 0.65) });
        },
      },
      {
        say: 'So the charge is written right on the table. Transition metals are the exception: they <b>vary</b>, and groups 14 and most of 15 tend to share electrons instead. Those wait for the bonding lessons.',
        dur: 4.4,
        draw(g, p, t, { W }) {
          const tw = 41.5, th = 44, x0 = 26, y0 = 72;
          const fill = (e) => {
            const a = seg(p, 0.05, 0.3);
            if (e.y > 7) return '#2C1E49';
            if ([1].includes(e.group) && e.sym !== 'H') return Art.mix('#3B2763', '#D62D7E', a);
            if (e.group === 2) return Art.mix('#3B2763', '#D62D7E', a);
            if (['Al', 'Ga'].includes(e.sym)) return Art.mix('#3B2763', '#D62D7E', a);
            if (['N', 'P', 'O', 'S', 'Se', 'F', 'Cl', 'Br', 'I'].includes(e.sym)) return Art.mix('#3B2763', '#1178B8', seg(p, 0.3, 0.55));
            if (e.group === 18) return Art.mix('#3B2763', '#5C4A85', seg(p, 0.5, 0.65));
            if (e.group >= 3 && e.group <= 12) return Art.mix('#3B2763', '#6E5A2E', seg(p, 0.65, 0.85));
            return '#3B2763';
          };
          ELS.filter((e) => e.y <= 7).forEach((e) => {
            const x = x0 + (e.x - 1) * tw, y = y0 + (e.y - 1) * th;
            g.fillStyle = fill(e); Art.round(g, x + 1, y + 1, tw - 2, th - 2, 6); g.fill();
          });
          STRIP.forEach(([gr, ch], i) => {
            const a = seg(p, 0.05 + i * 0.09, 0.2 + i * 0.09);
            Art.text(g, ch, x0 + (gr - 0.5) * tw, 44, { font: 'display', size: 28, color: gr <= 13 ? '#FF7AB6' : gr === 18 ? C.dim : '#5BBDFF', alpha: a });
          });
          Art.text(g, 'charge varies', x0 + 7.5 * tw, y0 + 3.6 * th, { font: 'display', size: 30, color: '#FFE9A8', alpha: seg(p, 0.72, 0.88), halo: true });
          void W; void t;
        },
      },
    ],
  });

  /* ---------- Story 4: diatomic pairs ---------- */
  const PAIRS = [['H2', 'hydrogen', 'gas'], ['N2', 'nitrogen', 'gas'], ['O2', 'oxygen', 'gas'], ['F2', 'fluorine', 'gas'], ['Cl2', 'chlorine', 'gas'], ['Br2', 'bromine', 'liquid'], ['I2', 'iodine', 'solid']];
  Lab.story('#story-pairs', {
    title: 'The seven that travel in pairs',
    scenes: [
      {
        say: 'A lone oxygen atom is unhappy and reactive. Two of them bond and both are content. So the oxygen you breathe is always $\\ce{O2}$, called a <b>diatomic</b> molecule.',
        dur: 3.4,
        draw(g, p, t, { W, H }) {
          const q = ease.inOut(seg(p, 0.2, 0.7));
          const done = q >= 0.98;
          const cy = H / 2 - 20;
          if (!done) {
            Art.atom(g, lerp(120, W / 2 - 62, q), cy, 72, 'O', { face: 'grumpy', t, look: [1, 0], seed: 1 });
            Art.atom(g, lerp(680, W / 2 + 62, q), cy, 72, 'O', { face: 'grumpy', t, look: [-1, 0], seed: 2 });
          } else {
            Art.molecule(g, W / 2, cy, 158, 'O2', { face: 'grin', faceAll: true, t });
          }
          Art.text(g, done ? 'O₂' : 'O + O', W / 2, H - 76, { font: 'display', size: 52, color: done ? C.sun : C.dim });
          Art.burst(g, W / 2, cy, seg(p, 0.7, 0.98), { r: 200 });
        },
      },
      {
        say: 'Seven elements do this: <b>H, N, O, F, Cl, Br and I</b>. All seven are written with a 2 when they stand alone. Bromine is a liquid at room temperature, and iodine is a solid. The rest are gases.',
        dur: 4.6,
        draw(g, p, t, { H }) {
          const xs = [84, 200, 316, 432, 548, 664, 110];
          PAIRS.forEach(([f, n, st], i) => {
            const q = ease.back(seg(p, 0.03 + i * 0.1, 0.17 + i * 0.1));
            if (q <= 0) return;
            const row = i < 4 ? 0 : 1;
            const x = row ? 170 + (i - 4) * 230 : 110 + i * 193;
            const y = row ? 312 : 112;
            g.save(); g.translate(x, y); g.scale(q, q); g.translate(-x, -y);
            Art.molecule(g, x, y - 4 + wander(i, t) * 3, 74, f, { face: 'happy', faceAll: true, t, seed: i, rot: Math.sin(t * 0.7 + i) * 0.08 });
            Art.text(g, n, x, y + 58, { size: 25 });
            Art.text(g, st, x, y + 88, { size: 23, color: st === 'gas' ? C.dim : C.sun });
            g.restore();
          });
          void xs; void H;
        },
      },
      {
        say: 'To remember them, look at the table. Start at <b>element 7</b>, nitrogen. Go right to oxygen, fluorine, then down to chlorine, bromine and iodine. You just drew a <b>7</b>. Then add hydrogen, off by itself.',
        dur: 4.6,
        draw(g, p, t, { W }) {
          const tw = 40, th = 42, x0 = 40, y0 = 26;
          ELS.filter((e) => e.y <= 7).forEach((e) => {
            const x = x0 + (e.x - 1) * tw, y = y0 + (e.y - 1) * th;
            const on = DIATOMIC.includes(e.sym);
            const a = seg(p, 0.05, 0.25);
            g.fillStyle = on ? Art.mix('#3B2763', Art.elementColor(e.sym), a) : '#3A2A5E';
            Art.round(g, x + 1, y + 1, tw - 2, th - 2, 6); g.fill();
          });
          const pt = (s) => [x0 + (EL[s].x - 0.5) * tw, y0 + (EL[s].y - 0.5) * th];
          const route = ['N', 'O', 'F', 'Cl', 'Br', 'I'].map(pt);
          const q = ease.inOut(seg(p, 0.3, 0.75));
          for (let i = 1; i < route.length; i++) {
            const f = clamp(q * (route.length - 1) - (i - 1));
            if (f > 0) Art.arrow(g, route[i - 1][0], route[i - 1][1], lerp(route[i - 1][0], route[i][0], f), lerp(route[i - 1][1], route[i][1], f), { color: C.sun, w: 6, head: i === route.length - 1 ? 16 : 1 });
          }
          DIATOMIC.forEach((sym) => { const [lx, ly] = pt(sym); Art.text(g, sym, lx, ly + 1, { font: 'display', size: 22, color: Art.lum(Art.elementColor(sym)) > 0.6 ? '#22123A' : '#fff', halo: sym !== 'H', haloColor: Art.alpha(Art.elementColor(sym), 0.9) }); });
          Art.ring(g, pt('H')[0], pt('H')[1], 30, { color: C.pink, p: seg(p, 0.78, 0.95), w: 5 });
          Art.text(g, 'HONClBrIF', W / 2 - 40, 390, { font: 'display', size: 46, color: C.sun, alpha: seg(p, 0.7, 0.88), halo: true });
          void t;
        },
      },
    ],
  });
  void lerp;
});
