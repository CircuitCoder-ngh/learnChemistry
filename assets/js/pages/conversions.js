/* Lesson 1.3: Unit conversions and density. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const TAU = Math.PI * 2;

  /* ---------- Shared: a paper fraction card with units that can be crossed out ---------- */
  function sideText(g, x, y, val, unit, size, strikeP, o = {}) {
    g.font = `400 ${size}px ${Art.FONT_DISPLAY}`;
    const a = val + ' ', wa = g.measureText(a).width, wu = g.measureText(unit).width;
    const left = x - (wa + wu) / 2;
    const col = o.color || '#22123A';
    Art.text(g, a, left, y, { font: 'display', size, align: 'left', color: col });
    Art.text(g, unit, left + wa, y, { font: 'display', size, align: 'left', color: strikeP > 0 ? Art.mix(col, '#FF2A48', 0.5) : (o.unitColor || col) });
    if (strikeP > 0) Art.strike(g, left + wa - 4, y + size * 0.4, left + wa + wu + 4, y - size * 0.4, strikeP, '#FF2A48', 5);
  }
  function fracCard(g, x, y, w, h, top, bot, o = {}) {
    g.save();
    const squash = o.flip === undefined ? 1 : o.flip;
    g.translate(x + w / 2, y + h / 2); g.scale(1, Math.max(0.03, Math.abs(squash))); g.translate(-(x + w / 2), -(y + h / 2));
    if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
    g.fillStyle = o.fill || '#FFFDF2'; g.strokeStyle = o.stroke || '#1A0F2E'; g.lineWidth = o.lw || 3;
    Art.round(g, x, y, w, h, 14); g.fill(); g.stroke();
    g.fillStyle = '#22123A'; g.fillRect(x + 14, y + h / 2 - 1.5, w - 28, 3);
    const size = o.size || 27;
    sideText(g, x + w / 2, y + h * 0.27, top[0], top[1], size, o.st || 0);
    sideText(g, x + w / 2, y + h * 0.74, bot[0], bot[1], size, o.sb || 0);
    g.restore();
  }

  /* ---------- Story 1: a fraction equal to 1 ---------- */
  function rulerBar(g, x, y, w, h, n, col, label) {
    g.fillStyle = col; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
    Art.round(g, x, y, w, h, 8); g.fill(); g.stroke();
    if (n > 1) { g.strokeStyle = 'rgba(16,8,32,.5)'; g.lineWidth = 1.5; for (let i = 1; i < n; i++) { const xx = x + (w * i) / n; g.beginPath(); g.moveTo(xx, y + 2); g.lineTo(xx, y + h - 2); g.stroke(); } }
    Art.text(g, label, x + w / 2, y + h / 2 + 1, { font: 'display', size: 36, color: '#22123A' });
  }
  Lab.story('#story-factor', {
    title: 'Multiplying by 1',
    scenes: [
      {
        say: 'One kilometer and 1000 meters are the same distance, with two different names. Put them side by side: they match exactly.',
        dur: 2.8,
        draw(g, p, t) {
          const q = ease.out(seg(p, 0.05, 0.35)), r = ease.out(seg(p, 0.35, 0.65));
          rulerBar(g, 80, 110, 640 * q, 76, 1, C.sun, q > 0.6 ? '1 km' : '');
          rulerBar(g, 80, 226, 640 * r, 76, 60, C.cyan, r > 0.6 ? '1000 m' : '');
          const e = seg(p, 0.7, 0.88);
          Art.text(g, 'Same distance', 400, 366, { font: 'display', size: 42, alpha: e });
          g.setLineDash([9, 8]); g.strokeStyle = Art.alpha(C.ink, e); g.lineWidth = 3;
          g.beginPath(); g.moveTo(80, 90); g.lineTo(80, 322); g.moveTo(720, 90); g.lineTo(720, 322); g.stroke(); g.setLineDash([]);
          void t;
        },
      },
      {
        say: 'So write them as a fraction. The top and bottom are the same amount, so this fraction equals exactly <b>1</b>. That makes it a <b>conversion factor</b>.',
        dur: 2.8,
        draw(g, p, t) {
          const q = ease.back(seg(p, 0.05, 0.35));
          g.save(); g.translate(290, 210); g.scale(q, q); g.translate(-290, -210);
          fracCard(g, 150, 110, 280, 200, ['1000', 'm'], ['1', 'km'], { size: 54 });
          g.restore();
          const e = seg(p, 0.4, 0.62);
          Art.text(g, '=', 492, 210, { font: 'display', size: 80, alpha: e });
          Art.text(g, '1', 590, 210, { font: 'display', size: 130, color: C.sun, alpha: e });
          Art.moe(g, 710, 430, 130, 'point', { t, flip: true });
        },
      },
      {
        say: 'You can write it either way up. Both versions equal 1, so you get to choose. That choice is the whole trick.',
        dur: 2.8,
        draw(g, p, t) {
          const f = Math.cos(seg(p, 0.25, 0.6) * Math.PI);
          const showFlip = f < 0;
          fracCard(g, 90, 110, 260, 190, ['1000', 'm'], ['1', 'km'], { size: 50 });
          Art.text(g, '= 1', 220, 350, { font: 'display', size: 42, color: C.sun });
          fracCard(g, 450, 110, 260, 190, showFlip ? ['1', 'km'] : ['1000', 'm'], showFlip ? ['1000', 'm'] : ['1', 'km'], { size: 50, flip: f });
          Art.text(g, '= 1', 580, 350, { font: 'display', size: 42, color: C.sun, alpha: seg(p, 0.6, 0.8) });
          Art.arrow(g, 370, 205, 430, 205, { color: C.pink, w: 7, both: true, p: seg(p, 0.1, 0.25) });
          void t;
        },
      },
      {
        say: 'To change km into m, put the km you want to lose on the <b>bottom</b>. Now km on top and km on the bottom cancel, and you are left with meters.',
        dur: 3.4,
        draw(g, p, t) {
          const st = seg(p, 0.32, 0.5), sb = seg(p, 0.5, 0.66);
          sideText(g, 158, 205, '2.50', 'km', 48, st, { color: C.ink });
          Art.text(g, '×', 290, 205, { font: 'display', size: 56 });
          fracCard(g, 340, 100, 250, 210, ['1000', 'm'], ['1', 'km'], { size: 50, sb });
          const e = seg(p, 0.7, 0.88);
          Art.text(g, '=', 622, 205, { font: 'display', size: 56, alpha: e });
          Art.text(g, '2500', 714, 178, { font: 'display', size: 48, color: C.leaf, alpha: e });
          Art.text(g, 'm', 714, 234, { font: 'display', size: 48, color: C.leaf, alpha: e });
          if (seg(p, 0.15, 0.3) > 0) {
            Art.arrow(g, 170, 266, 410, 276, { color: C.pink, w: 5, curve: 46, p: seg(p, 0.15, 0.3) });
            Art.text(g, 'lose this one', 200, 372, { size: 28, color: C.pink, alpha: seg(p, 0.18, 0.3) });
          }
          Art.text(g, 'With 3 sig figs: 2.50 × 10³ m', 540, 372, { size: 27, color: C.sun, alpha: e });
          void t;
        },
      },
      {
        say: 'Flip it the wrong way and the units warn you. Nothing cancels, and you get km²/m, which is nonsense. <b>The units catch your mistake for free.</b>',
        dur: 3.2,
        draw(g, p, t) {
          sideText(g, 158, 180, '2.50', 'km', 48, 0, { color: C.ink });
          Art.text(g, '×', 290, 180, { font: 'display', size: 56 });
          fracCard(g, 340, 76, 250, 210, ['1', 'km'], ['1000', 'm'], { size: 50, stroke: C.red, lw: 5 });
          const e = seg(p, 0.35, 0.55);
          Art.text(g, '=', 628, 180, { font: 'display', size: 56, alpha: e });
          Art.text(g, '0.00250', 716, 128, { font: 'display', size: 34, color: '#FF8A94', alpha: e });
          Art.text(g, 'km²/m', 716, 200, { font: 'display', size: 32, color: '#FF8A94', alpha: e });
          const c = seg(p, 0.6, 0.8);
          if (c > 0) Art.ring(g, 716, 200, 56, { color: C.red, w: 5, p: c });
          Art.text(g, 'A km² per meter is not a distance.', 340, 366, { font: 'display', size: 29, color: C.sun, alpha: seg(p, 0.72, 0.9) });
          Art.moe(g, 700, 442, 130, 'oops', { t, flip: true });
        },
      },
      {
        say: 'Need several steps? Keep going. Each fraction cancels the unit left by the one before. Hours to minutes to seconds, in one line.',
        dur: 4,
        draw(g, p, t) {
          const a = seg(p, 0.2, 0.34), b = seg(p, 0.34, 0.46), c = seg(p, 0.58, 0.7), d = seg(p, 0.7, 0.82);
          sideText(g, 100, 180, '3.00', 'h', 42, a, { color: C.ink });
          Art.text(g, '×', 192, 180, { font: 'display', size: 46 });
          fracCard(g, 220, 92, 200, 178, ['60', 'min'], ['1', 'h'], { size: 40, st: c, sb: b, alpha: seg(p, 0.05, 0.18) });
          Art.text(g, '×', 448, 180, { font: 'display', size: 46, alpha: seg(p, 0.45, 0.55) });
          fracCard(g, 476, 92, 200, 178, ['60', 's'], ['1', 'min'], { size: 40, sb: d, alpha: seg(p, 0.45, 0.56) });
          const e = seg(p, 0.84, 0.96);
          Art.text(g, '= 10,800 s', 400, 340, { font: 'display', size: 52, color: C.leaf, alpha: e });
          Art.text(g, 'With 3 sig figs: 1.08 × 10⁴ s', 400, 396, { size: 28, color: C.sun, alpha: e });
          void t;
        },
      },
    ],
  });

  /* ---------- Bench: cancel the units ---------- */
  const F = (tv, tu, bv, bu) => ({ top: [tv, tu], bot: [bv, bu] });
  const PROBLEMS = [
    { v: 2.5, sf: 3, show: '2.50', num: ['km'], den: [], goalN: ['m'], goalD: [], ask: 'Change 2.50 km into m', tray: [F('1000', 'm', '1', 'km'), F('100', 'cm', '1', 'm'), F('60', 's', '1', 'min')] },
    { v: 355, sf: 3, show: '355', num: ['mL'], den: [], goalN: ['L'], goalD: [], ask: 'Change 355 mL into L', tray: [F('1000', 'mL', '1', 'L'), F('1', 'mL', '1', 'cm³'), F('1000', 'g', '1', 'kg')] },
    { v: 12, sf: 3, show: '12.0', num: ['in'], den: [], goalN: ['cm'], goalD: [], ask: 'Change 12.0 in into cm', tray: [F('2.54', 'cm', '1', 'in'), F('12', 'in', '1', 'ft'), F('100', 'cm', '1', 'm')] },
    { v: 3, sf: 3, show: '3.00', num: ['h'], den: [], goalN: ['s'], goalD: [], ask: 'Change 3.00 h into s', tray: [F('60', 'min', '1', 'h'), F('60', 's', '1', 'min'), F('1000', 'm', '1', 'km'), F('24', 'h', '1', 'day')] },
    { v: 750, sf: 3, show: '750.', num: ['mg'], den: [], goalN: ['kg'], goalD: [], ask: 'Change 750. mg into kg', tray: [F('1000', 'mg', '1', 'g'), F('1000', 'g', '1', 'kg'), F('100', 'cm', '1', 'm')] },
    { v: 1.5, sf: 3, show: '1.50', num: ['m', 'm', 'm'], den: [], goalN: ['cm', 'cm', 'cm'], goalD: [], ask: 'Change 1.50 m³ into cm³. Remember, m³ is m × m × m', tray: [F('100', 'cm', '1', 'm'), F('1000', 'mm', '1', 'm')] },
    { v: 60, sf: 3, show: '60.0', num: ['mi'], den: ['h'], goalN: ['m'], goalD: ['s'], ask: 'Change 60.0 mi/h into m/s', tray: [F('1.609', 'km', '1', 'mi'), F('1000', 'm', '1', 'km'), F('60', 'min', '1', 'h'), F('60', 's', '1', 'min')] },
  ];
  const CA = { idx: 0, flips: PROBLEMS[0].tray.map(() => ({ up: true, t0: -9 })), chain: [], chainT: 0, solvedT: -1, paid: {} };
  const fnum = (s) => parseFloat(s);
  function setProblem(i) {
    CA.idx = i; CA.chain = [];
    CA.flips = PROBLEMS[i].tray.map(() => ({ up: true, t0: -9 }));
    CA.solvedT = -1;
    paintCancelFoot();
  }
  const cardOf = (c) => (c.up ? c.card : { top: c.card.bot, bot: c.card.top });
  function analyse() {
    const P = PROBLEMS[CA.idx];
    const nums = P.num.map((u, i) => ({ u, where: 's', i, t0: 0, off: false }));
    const dens = P.den.map((u, i) => ({ u, where: 'd', i, t0: 0, off: false }));
    let val = P.v, sf = P.sf;
    CA.chain.forEach((c, k) => {
      const f = cardOf(c);
      nums.push({ u: f.top[1], where: 't', i: k, t0: c.t0, off: false });
      dens.push({ u: f.bot[1], where: 'b', i: k, t0: c.t0, off: false });
      val *= fnum(f.top[0]) / fnum(f.bot[0]);
      if (f.top[0] === '1.609' || f.bot[0] === '1.609') sf = Math.min(sf, 4);
    });
    dens.forEach((d) => {
      const n = nums.find((x) => !x.off && x.u === d.u);
      if (n) { n.off = d.off = true; n.ct = d.ct = Math.max(n.t0, d.t0); }
    });
    const rn = nums.filter((n) => !n.off).map((n) => n.u), rd = dens.filter((n) => !n.off).map((n) => n.u);
    const same = (a, b) => a.length === b.length && [...a].sort().join() === [...b].sort().join();
    return { nums, dens, val, sf, rn, rd, done: CA.chain.length > 0 && same(rn, P.goalN) && same(rd, P.goalD) };
  }
  const SUPS = { 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶' };
  const unitStr = (rn, rd) => {
    const part = (l) => { const c = {}; l.forEach((u) => (c[u] = (c[u] || 0) + 1)); return Object.keys(c).map((u) => u + (c[u] > 1 ? SUPS[c[u]] || '^' + c[u] : '')).join('·'); };
    const a = part(rn) || '1', b = part(rd);
    return b ? `${a}/${b}` : a;
  };
  const withSF = (x, sf) => {
    if (x === 0) return '0';
    const e = Math.floor(Math.log10(Math.abs(x)) + 1e-12);
    if (e >= sf || e < -3) return `${(x / Math.pow(10, e)).toFixed(sf - 1)} × 10${Lab.sup(e)}`;
    return parseFloat(x.toPrecision(sf)).toFixed(Math.max(0, sf - 1 - e));
  };
  const CARDW = 130, CARDH = 104, CHY = 62;
  function chainLayout() {
    const P = PROBLEMS[CA.idx];
    const startW = 62 + (P.den.length ? 120 : P.num.length * 36 + 30);
    const n = CA.chain.length, gap = 24;
    const total = startW + n * (CARDW + gap);
    const x0 = Math.max(10, 400 - total / 2);
    return { x0, startW, boxes: CA.chain.map((_, i) => ({ x: x0 + startW + gap + i * (CARDW + gap), y: CHY, w: CARDW, h: CARDH })) };
  }
  const trayLayout = () => {
    const n = PROBLEMS[CA.idx].tray.length, w = 150, gap = 22;
    const x0 = 400 - (n * w + (n - 1) * gap) / 2;
    return Array.from({ length: n }, (_, i) => ({ x: x0 + i * (w + gap), y: 296, w, h: 104, fx: x0 + i * (w + gap) + w / 2, fy: 432 }));
  };
  const caStage = Lab.stage('#c-cancel', {
    h: 470,
    label: 'A starting quantity followed by a chain of fraction cards. Units on top and bottom are crossed out when they match. Below is a tray of fractions to add and flip.',
    onPointer(e) {
      const hit = (b) => e.x >= b.x && e.x <= b.x + b.w && e.y >= b.y && e.y <= b.y + b.h;
      const flipHit = (b) => Math.abs(e.x - b.fx) < 62 && Math.abs(e.y - b.fy) < 26;
      if (e.type === 'hover') {
        caStage.canvas.style.cursor = trayLayout().some((b) => hit(b) || flipHit(b)) || chainLayout().boxes.some(hit) ? 'pointer' : 'default';
        return;
      }
      if (e.type !== 'down') return;
      const lay = chainLayout();
      const ci = lay.boxes.findIndex(hit);
      if (ci >= 0) { CA.chain.splice(ci, 1); CA.chainT = caStage.t; CA.solvedT = -1; Lab.sound.pop(); paintCancelFoot(); return; }
      const tray = trayLayout();
      const fi = tray.findIndex(flipHit);
      if (fi >= 0) { const s = CA.flips[fi]; s.up = !s.up; s.t0 = caStage.t; Lab.sound.pop(); return; }
      const ti = tray.findIndex(hit);
      if (ti >= 0 && CA.chain.length < 4) {
        const s = CA.flips[ti];
        CA.chain.push({ card: PROBLEMS[CA.idx].tray[ti], up: s.up, t0: caStage.t });
        CA.chainT = caStage.t;
        Lab.sound.pop();
        const res = analyse();
        if (res.done) {
          CA.solvedT = caStage.t; Lab.sound.good();
          if (!CA.paid[CA.idx]) { CA.paid[CA.idx] = 1; Lab.collection.award(1); }
        }
        paintCancelFoot();
      }
    },
    draw(g, t) {
      const P = PROBLEMS[CA.idx], res = analyse(), lay = chainLayout();
      const prog = (tok) => (tok.off ? (Lab.reducedMotion ? 1 : clamp((t - tok.ct - 0.25) / 0.3)) : 0);
      Art.text(g, P.ask, 400, 28, { size: 27, color: C.sun });
      /* The starting quantity. */
      const yMid = CHY + CARDH / 2;
      const x0 = lay.x0;
      let cursor = x0;
      if (P.den.length) {
        Art.text(g, P.show, cursor, yMid, { font: 'display', size: 34, align: 'left' });
        g.font = `400 34px ${Art.FONT_DISPLAY}`; cursor += g.measureText(P.show).width + 12;
        const nt = res.nums.find((n) => n.where === 's'), dt = res.dens.find((n) => n.where === 'd');
        g.fillStyle = C.ink; g.fillRect(cursor, yMid - 1.5, 54, 3);
        sideTextU(g, cursor + 27, yMid - 24, nt.u, 30, prog(nt));
        sideTextU(g, cursor + 27, yMid + 26, dt.u, 30, prog(dt));
      } else {
        Art.text(g, P.show, cursor, yMid, { font: 'display', size: 34, align: 'left' });
        g.font = `400 34px ${Art.FONT_DISPLAY}`; cursor += g.measureText(P.show).width + 12;
        res.nums.filter((n) => n.where === 's').forEach((n, i) => {
          g.font = `400 32px ${Art.FONT_DISPLAY}`;
          const w = g.measureText(n.u).width;
          if (i) { Art.text(g, '·', cursor + 4, yMid, { font: 'display', size: 32 }); cursor += 12; }
          sideTextU(g, cursor + w / 2, yMid, n.u, 32, prog(n));
          cursor += w + 4;
        });
      }
      /* The chain. */
      lay.boxes.forEach((b, i) => {
        const c = CA.chain[i], f = cardOf(c);
        const nt = res.nums.find((n) => n.where === 't' && n.i === i), dt = res.dens.find((n) => n.where === 'b' && n.i === i);
        const q = Lab.reducedMotion ? 1 : ease.back(clamp((t - c.t0) * 5));
        Art.text(g, '×', b.x - 13, yMid, { font: 'display', size: 30 });
        g.save(); g.translate(b.x + b.w / 2, b.y + b.h / 2); g.scale(q, q); g.translate(-(b.x + b.w / 2), -(b.y + b.h / 2));
        fracCard(g, b.x, b.y, b.w, b.h, f.top, f.bot, { st: prog(nt), sb: prog(dt), size: 25 });
        g.restore();
      });
      if (!CA.chain.length) Art.text(g, 'Tap a fraction below to start the chain', 400, CHY + CARDH + 2, { size: 24, color: C.dim });
      /* The running answer. */
      const us = unitStr(res.rn, res.rd);
      const good = res.done;
      const bad = !good && CA.chain.length > 0 && res.rn.length + res.rd.length > P.goalN.length + P.goalD.length;
      const col = good ? C.leaf : bad ? '#FF8A94' : C.ink;
      g.fillStyle = good ? Art.alpha(C.leaf, 0.18) : 'rgba(255,255,255,.06)'; g.strokeStyle = good ? C.leaf : 'rgba(255,255,255,.2)'; g.lineWidth = 3;
      Art.round(g, 60, 186, 680, 62, 18); g.fill(); g.stroke();
      Art.text(g, `= ${withSF(res.val, res.sf)} ${us}`, 300, 217, { font: 'display', size: 34, color: col });
      Art.text(g, good ? 'Done! Units match' : bad ? 'Units got worse. Flip it?' : `You want ${unitStr(P.goalN, P.goalD)}`, 730, 217, { size: 24, align: 'right', color: good ? C.leaf : bad ? '#FF8A94' : C.dim });
      if (good && CA.solvedT >= 0 && t - CA.solvedT < 1) Art.burst(g, 300, 217, t - CA.solvedT, { r: 180, n: 20 });
      /* The tray. */
      Art.text(g, 'Tap a fraction to use it. Flip it first if you need to.', 400, 274, { size: 23, color: C.dim });
      trayLayout().forEach((b, i) => {
        const card = P.tray[i], s = CA.flips[i];
        const u = Lab.reducedMotion ? 1 : clamp((t - s.t0) / 0.32);
        const squash = Math.cos(u * Math.PI);
        const showNew = u > 0.5;
        const up = showNew ? s.up : !s.up;
        fracCard(g, b.x, b.y, b.w, b.h, up ? card.top : card.bot, up ? card.bot : card.top, { size: 26, flip: u >= 1 ? 1 : squash });
        g.fillStyle = C.plum2; g.strokeStyle = C.cyan; g.lineWidth = 3;
        Art.round(g, b.fx - 56, b.fy - 21, 112, 42, 21); g.fill(); g.stroke();
        Art.text(g, 'Flip', b.fx, b.fy + 1, { font: 'display', size: 25, color: C.cyan });
      });
    },
  });
  function sideTextU(g, x, y, unit, size, p) {
    Art.text(g, unit, x, y, { font: 'display', size, color: p > 0 ? '#FF8A94' : C.ink });
    if (p > 0) {
      g.font = `400 ${size}px ${Art.FONT_DISPLAY}`;
      const w = g.measureText(unit).width / 2 + 4;
      Art.strike(g, x - w, y + size * 0.4, x + w, y - size * 0.4, p, '#FF2A48', 5);
    }
  }
  function paintCancelFoot() {
    const res = analyse(), P = PROBLEMS[CA.idx], el = Lab.$('#ca-foot');
    if (res.done) el.innerHTML = `<p><b>That is it.</b> Only ${unitStr(P.goalN, P.goalD)} is left, so the number must be right. The answer has ${res.sf} sig figs, because the factors are exact${P.tray.some((c) => c.top[0] === '1.609') ? ', and 1.609 has more digits than 60.0' : ''}.</p>`;
    else if (P.num.length === 3) el.innerHTML = '<p>m³ is really m × m × m, so you must cancel the meter <b>three times</b>. Use the same fraction three times. Yes, you can.</p>';
    else if (P.den.length) el.innerHTML = '<p>Careful: h is on the <b>bottom</b> of mi/h, so to cancel it you need h on the <b>top</b>. Flip that fraction.</p>';
    else el.innerHTML = '<p>Pick the fraction that has the unit you want to lose, and make sure that unit sits on the bottom. Some fractions here are decoys.</p>';
    caStage.redraw();
  }
  Lab.segmented('#ca-prob', (v) => { setProblem(+v); });
  Lab.$('#ca-clear').addEventListener('click', () => { CA.chain = []; CA.solvedT = -1; paintCancelFoot(); });
  setProblem(0);

  /* ---------- Isometric cubes ---------- */
  function isoFaces(g, ox, oy, u, i, j, k, cols, a = 1) {
    const px = (x, y, z) => [ox + (x - y) * u * 0.866, oy + (x + y) * u * 0.5 - z * u];
    const quad = (pts, c) => {
      g.fillStyle = c; g.beginPath(); pts.forEach((p, n) => (n ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fill();
      if (u >= 6) { g.strokeStyle = 'rgba(16,8,32,.55)'; g.lineWidth = u > 18 ? 2 : 1; g.stroke(); }
    };
    g.save(); g.globalAlpha *= a;
    quad([px(i, j, k + 1), px(i + 1, j, k + 1), px(i + 1, j + 1, k + 1), px(i, j + 1, k + 1)], cols[0]);
    quad([px(i, j + 1, k + 1), px(i + 1, j + 1, k + 1), px(i + 1, j + 1, k), px(i, j + 1, k)], cols[1]);
    quad([px(i + 1, j, k + 1), px(i + 1, j + 1, k + 1), px(i + 1, j + 1, k), px(i + 1, j, k)], cols[2]);
    g.restore();
  }
  const COLS = ['#FFB3D9', C.pink, '#B81F71'];
  const COLS2 = ['#9DEBFF', C.cyan, '#128AA3'];
  /** A cube of n little cubes, drawing only what can be seen. reveal(i,j,k) gives 0..1 for pop-in. */
  function cubeOf(g, ox, oy, u, n, reveal, cols = COLS) {
    for (let k = 0; k < n; k++) for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      if (i < n - 1 && j < n - 1 && k < n - 1) continue;
      const a = reveal ? reveal(i, j, k) : 1;
      if (a <= 0) continue;
      isoFaces(g, ox, oy, u, i, j, k, cols, a);
    }
  }
  /** A large cube with its faces ruled into n parts, for when there are too many to draw one by one. */
  function ruledCube(g, ox, oy, U, n, p = 1) {
    const px = (x, y, z) => [ox + (x - y) * U * 0.866, oy + (x + y) * U * 0.5 - z * U];
    const face = (a, b, c, d, col) => { g.fillStyle = col; g.beginPath(); [a, b, c, d].forEach((q, m) => (m ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.closePath(); g.fill(); g.strokeStyle = '#1A0F2E'; g.lineWidth = 3; g.stroke(); };
    const h = p;
    face(px(0, 0, h), px(1, 0, h), px(1, 1, h), px(0, 1, h), COLS[0]);
    face(px(0, 1, h), px(1, 1, h), px(1, 1, 0), px(0, 1, 0), COLS[1]);
    face(px(1, 0, h), px(1, 1, h), px(1, 1, 0), px(1, 0, 0), COLS[2]);
    g.strokeStyle = 'rgba(16,8,32,.35)'; g.lineWidth = 1;
    g.beginPath();
    for (let m = 1; m < n; m++) {
      const f = m / n;
      let a = px(f, 0, h), b = px(f, 1, h); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]);
      a = px(0, f, h); b = px(1, f, h); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]);
      a = px(f, 1, h); b = px(f, 1, 0); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]);
      a = px(1, f, h); b = px(1, f, 0); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]);
      if (f <= h) { a = px(0, 1, f); b = px(1, 1, f); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); a = px(1, 0, f); b = px(1, 1, f); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); }
    }
    g.stroke();
  }
  /* ---------- Story 2: squared and cubed ---------- */
  Lab.story('#story-cube', {
    title: 'Why cubing changes everything',
    scenes: [
      {
        say: 'A meter stick is 100 cm long. In one direction, the number is <b>100</b>. So far, so good.',
        dur: 2.6,
        draw(g, p, t) {
          const q = ease.out(seg(p, 0.05, 0.6)), x0 = 70, w = 660, n = 100;
          g.fillStyle = 'rgba(255,255,255,.08)'; Art.round(g, x0, 170, w, 70, 8); g.fill();
          g.fillStyle = C.sun; Art.round(g, x0, 170, w * q, 70, 8); g.fill();
          g.strokeStyle = 'rgba(34,18,58,.55)'; g.lineWidth = 1.5;
          for (let i = 1; i < n; i++) { const x = x0 + (w * i) / n; if (x > x0 + w * q) break; g.beginPath(); g.moveTo(x, 170); g.lineTo(x, i % 10 ? 196 : 240); g.stroke(); }
          Art.text(g, '1 m', 400, 120, { font: 'display', size: 44 });
          Art.text(g, `${Math.round(q * 100)} cm`, 400, 296, { font: 'display', size: 54, color: C.sun });
          Art.text(g, '1 m = 100 cm', 400, 370, { font: 'display', size: 38, alpha: seg(p, 0.65, 0.85) });
          void t;
        },
      },
      {
        say: 'A square meter is a square 100 cm on each side. It holds 100 rows of 100, which is <b>10,000 cm²</b>. Not 100.',
        dur: 3,
        draw(g, p, t) {
          const q = ease.inOut(seg(p, 0.05, 0.62)), S = 330, x0 = 40, y0 = 66;
          g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x0, y0, S, S);
          g.fillStyle = C.cyan; g.fillRect(x0, y0 + S - S * q, S, S * q);
          g.strokeStyle = 'rgba(16,8,32,.4)'; g.lineWidth = 0.8;
          g.beginPath();
          for (let i = 1; i < 100; i++) { const f = (S * i) / 100; g.moveTo(x0 + f, y0 + S - S * q); g.lineTo(x0 + f, y0 + S); if (f < S * q) { g.moveTo(x0, y0 + S - f); g.lineTo(x0 + S, y0 + S - f); } }
          g.stroke();
          g.strokeStyle = '#1A0F2E'; g.lineWidth = 3; g.strokeRect(x0, y0, S, S);
          Art.text(g, '100 cm', x0 + S / 2, 36, { size: 26 });
          Art.text(g, '100 cm', x0 + S + 12, y0 + S / 2, { size: 26, align: 'left' });
          const a = seg(p, 0.64, 0.86);
          Art.text(g, '100 × 100', 640, 120, { font: 'display', size: 40, alpha: a });
          Art.text(g, '= 10,000 cm²', 640, 176, { font: 'display', size: 38, color: C.cyan, alpha: a });
          Art.text(g, '1 m² = 10⁴ cm²', 640, 320, { size: 30, alpha: a });
          void t;
        },
      },
      {
        say: 'A cubic meter is 100 layers of that square. That makes 100 × 100 × 100, a stunning <b>1,000,000 cm³</b>. This one fact costs students more points than any other in this lesson.',
        dur: 3.8,
        draw(g, p, t) {
          const h = ease.inOut(seg(p, 0.05, 0.62));
          ruledCube(g, 240, 196, 190, 100, Math.max(0.01, h));
          const a = seg(p, 0.6, 0.76);
          Art.text(g, '100 cm', 112, 372, { size: 26, alpha: a, halo: true });
          Art.text(g, '100 cm', 368, 372, { size: 26, alpha: a, halo: true });
          Art.text(g, '100 cm', 414, 272, { size: 26, alpha: a, align: 'left', halo: true });
          Art.text(g, '100 × 100 × 100', 626, 76, { font: 'display', size: 34, alpha: a });
          Art.text(g, '= 1,000,000', 626, 140, { font: 'display', size: 46, color: C.pink, alpha: seg(p, 0.7, 0.88) });
          Art.text(g, 'little cubes', 626, 188, { size: 28, alpha: seg(p, 0.7, 0.88) });
          Art.text(g, '1 m³ = 10⁶ cm³', 620, 340, { font: 'display', size: 38, color: C.sun, alpha: seg(p, 0.82, 0.98) });
          void t;
        },
      },
      {
        say: 'So when a unit is cubed, cube the conversion factor. <b>Cube the number too.</b> The number 100 becomes 1,000,000. The most common wrong answer stops at 100.',
        dur: 3.4,
        draw(g, p, t) {
          const a = seg(p, 0.05, 0.3);
          g.save(); g.globalAlpha *= a;
          fracCard(g, 70, 90, 220, 170, ['100', 'cm'], ['1', 'm'], { size: 44 });
          g.restore();
          Art.text(g, '3', 306, 84, { font: 'display', size: 62, color: C.sun, alpha: a });
          Art.text(g, '=', 366, 174, { font: 'display', size: 54, alpha: seg(p, 0.3, 0.45) });
          g.save(); g.globalAlpha *= seg(p, 0.3, 0.45);
          fracCard(g, 410, 90, 320, 170, ['1,000,000', 'cm³'], ['1', 'm³'], { size: 44 });
          g.restore();
          const w = seg(p, 0.55, 0.72);
          Art.text(g, '1 m³ = 100 cm³', 300, 340, { font: 'display', size: 40, color: '#FF8A94', alpha: w });
          if (seg(p, 0.72, 0.84) > 0) Art.strike(g, 130, 356, 470, 322, seg(p, 0.72, 0.84), C.red, 7);
          Art.text(g, 'Wrong', 300, 392, { size: 28, color: '#FF8A94', alpha: seg(p, 0.76, 0.86) });
          Art.moe(g, 660, 444, 150, 'oops', { t, flip: true });
        },
      },
      {
        say: 'Here is the pair chemists use every day. A cube 10 cm on a side holds <b>1 liter</b>, which is 1000 cm³. So each little cube, <b>1 cm³</b>, is exactly <b>1 mL</b>.',
        dur: 4,
        draw(g, p, t) {
          const out = ease.inOut(seg(p, 0.55, 0.8));
          const u = 20, n = 10, ox = 214, oy = 232;
          cubeOf(g, ox, oy, u, n, (i, j, k) => {
            if (i === n - 1 && j === n - 1 && k === n - 1 && out > 0) return 0;
            return clamp(seg(p, 0.02, 0.5) * 16 - k * 1.2);
          });
          if (out > 0) {
            const x = lerp(ox, 590, out), y = lerp(oy, 278, out);
            isoFaces(g, x, y, lerp(u, 60, out), 0, 0, 0, COLS2);
            Art.text(g, '1 cm³ = 1 mL', 590, 186, { font: 'display', size: 34, color: C.cyan, alpha: out, halo: true });
            Art.text(g, 'a bit smaller than', 590, 372, { size: 25, alpha: out });
            Art.text(g, 'a sugar cube', 590, 404, { size: 25, alpha: out });
          }
          const a = seg(p, 0.42, 0.6);
          Art.text(g, '10 cm', 70, 362, { size: 26, alpha: a, halo: true });
          Art.text(g, '1 L = 1000 cm³', 580, 74, { font: 'display', size: 40, color: C.pink, alpha: a });
          Art.text(g, '= 1000 mL', 580, 126, { font: 'display', size: 34, alpha: a });
          void t;
        },
      },
    ],
  });

  /* ---------- Bench: cube of cubes ---------- */
  const CU = { n: 4, t0: 0, prev: 1 };
  const cuStage = Lab.stage('#c-cube', {
    label: 'A cube built of many small cubes, with the count along an edge, on a face and in the whole cube.',
    draw(g, t) {
      const n = CU.n, u = Math.min(46, 200 / n);
      const since = Lab.reducedMotion ? 9 : t - CU.t0;
      const ox = 260, oy = 225 - (n * u * 0.5 - n * u) * 0.5 - n * u * 0.5 + 8;
      cubeOf(g, ox, oy, u, n, (i, j, k) => {
        const added = Math.max(i, j, k) >= CU.prev;
        return added ? clamp(since * 3 - (i + j + k) * 0.02) : 1;
      });
      // Highlight one row along an edge in sun.
      const px = (x, y, z) => [ox + (x - y) * u * 0.866, oy + (x + y) * u * 0.5 - z * u];
      const a = px(0, n, 0), b = px(n, n, 0);
      Art.arrow(g, a[0] + 6, a[1] + 26, b[0] + 6, b[1] + 26, { color: C.sun, w: 5, both: true, head: 12 });
      Art.text(g, `${n} cm`, (a[0] + b[0]) / 2 - 34, (a[1] + b[1]) / 2 + 58, { font: 'display', size: 30, color: C.sun, halo: true });
      const x = 620;
      Art.text(g, `${n} × ${n} × ${n}`, x, 110, { font: 'display', size: 40 });
      Art.text(g, `= ${n * n * n}`, x, 176, { font: 'display', size: 64, color: C.pink });
      Art.text(g, n * n * n === 1 ? 'little cube' : 'little cubes', x, 232, { size: 27 });
      Art.text(g, `${n * n * n} cm³ = ${n * n * n} mL`, x, 292, { font: 'display', size: 30, color: C.cyan });
      if (n === 10) {
        Art.pill(g, 'Exactly 1 liter', x, 356, { size: 30, color: C.leaf, text: '#06301C', font: 'display' });
        Art.moe(g, 90, 442, 120, 'cheer', { t });
      } else {
        Art.text(g, `Doubling the edge gives`, x, 346, { size: 23, color: C.dim });
        Art.text(g, `8 times the volume`, x, 376, { size: 23, color: C.dim });
      }
    },
  });
  Lab.bind('#cu-n', '#cu-n-out', (v) => `${v} cm`, (v) => {
    CU.prev = CU.n; CU.n = v; CU.t0 = cuStage.t;
    Lab.$('#cu-a').textContent = `${v} cm`;
    Lab.$('#cu-b').textContent = `${v * v} cm²`;
    Lab.$('#cu-c').textContent = `${v * v * v} cm³`;
    cuStage.redraw();
  });

  /* ---------- Story 3: density ---------- */
  const DENS = { water: 1.0, Al: EL.Al.density, Fe: EL.Fe.density, Au: EL.Au.density };
  function block(g, x, y, s, top, side, front, label, col = '#22123A') {
    const d = s * 0.3;
    g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
    g.fillStyle = side; g.beginPath(); g.moveTo(x + s, y); g.lineTo(x + s + d, y - d * 0.6); g.lineTo(x + s + d, y + s - d * 0.6); g.lineTo(x + s, y + s); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = top; g.beginPath(); g.moveTo(x, y); g.lineTo(x + d, y - d * 0.6); g.lineTo(x + s + d, y - d * 0.6); g.lineTo(x + s, y); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = front; g.fillRect(x, y, s, s); g.strokeRect(x, y, s, s);
    if (label) Art.text(g, label, x + s / 2, y + s / 2, { font: 'display', size: 24, color: col });
  }
  Lab.story('#story-density', {
    title: 'How packed is it?',
    scenes: [
      {
        say: 'Two blocks, exactly the same size. Put them on a balance. The iron is far heavier. Same volume, very different mass.',
        dur: 3,
        draw(g, p, t, { W, H }) {
          Art.bgLab(g, W, H);
          const tilt = ease.elastic(seg(p, 0.2, 0.9));
          Art.balance(g, 400, H - 70, 560, -tilt * 0.9, {
            drawLeft: (gg, x, y) => block(gg, x - 42, y - 78, 74, '#C7CCD8', '#6E7486', '#9AA3B2', 'iron', '#22123A'),
            drawRight: (gg, x, y) => block(gg, x - 42, y - 78, 74, '#FFF7DE', '#D8C89C', '#F6EBC8', 'foam', '#22123A'),
          });
          Art.text(g, 'Same size', 400, 60, { font: 'display', size: 40, color: C.sun });
          Art.text(g, 'Different mass', 400, 106, { font: 'display', size: 34, alpha: seg(p, 0.5, 0.7) });
          void t;
        },
      },
      {
        say: 'Zoom in to see why. Iron atoms are heavy and packed tight. A light material has lighter atoms and more empty space. That difference is <b>density</b>.',
        dur: 3.2,
        draw(g, p, t) {
          const R = 150, cy = 200;
          Art.text(g, 'Iron', 200, 26, { font: 'display', size: 36, alpha: seg(p, 0.05, 0.2) });
          Art.text(g, 'Light foam', 600, 26, { font: 'display', size: 36, alpha: seg(p, 0.35, 0.5) });
          Art.zoom(g, 200, cy, 200, cy, R, (gg, x, y, r) => {
            for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) {
              const ax = x + (i + (j % 2 ? 0.5 : 0)) * 50 + wander(i * 3 + j, t) * 1.5, ay = y + j * 43 + wander(i + j * 5, t) * 1.5;
              if (Math.hypot(ax - x, ay - y) < r + 20) Art.atom(gg, ax, ay, 24, 'Fe', { label: false, face: i === 0 && j === 0 ? 'happy' : null, t });
            }
          }, { p: seg(p, 0.05, 0.3) });
          Art.zoom(g, 600, cy, 600, cy, R, (gg, x, y) => {
            [[-70, -60], [52, -82], [-14, 12], [86, 40], [-82, 72], [24, 96]].forEach(([dx, dy], i) => {
              Art.atom(gg, x + dx + wander(i, t) * 3, y + dy + wander(i + 30, t) * 3, 19, 'C', { label: false, face: i === 2 ? 'happy' : null, t });
              Art.atom(gg, x + dx + 28 + wander(i, t) * 3, y + dy + 14 + wander(i + 30, t) * 3, 11, 'H', { label: false });
            });
          }, { p: seg(p, 0.35, 0.6) });
          Art.text(g, 'Heavy atoms, packed close', 200, 392, { size: 26, alpha: seg(p, 0.25, 0.4) });
          Art.text(g, 'Light atoms, lots of space', 600, 392, { size: 26, alpha: seg(p, 0.55, 0.7) });
          Art.text(g, 'A simplified 2D model', 400, 430, { size: 22, color: C.dim, alpha: seg(p, 0.7, 0.85) });
        },
      },
      {
        say: '<b>Density</b> is mass divided by volume: how many grams fit in each milliliter. These bars show how much 1 mL of each weighs.',
        dur: 3.2,
        draw(g, p, t) {
          Art.text(g, 'd = m / V', 400, 44, { font: 'display', size: 50, color: C.sun, alpha: seg(p, 0, 0.15) });
          const rows = [['Water', DENS.water, C.water], ['Aluminum', DENS.Al, '#C9C2D6'], ['Iron', DENS.Fe, Art.elementColor('Fe')], ['Gold', DENS.Au, Art.elementColor('Au')]];
          const max = 19.3, base = 390, top = 110;
          rows.forEach(([name, d, col], i) => {
            const q = ease.out(seg(p, 0.18 + i * 0.16, 0.42 + i * 0.16));
            const x = 150 + i * 170, h = (base - top - 30) * (d / max) * q;
            g.fillStyle = col; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
            Art.round(g, x - 50, base - h, 100, h, 8); g.fill(); g.stroke();
            Art.text(g, name, x, base + 28, { size: 25 });
            Art.text(g, `${d.toFixed(d < 10 ? 2 : 1)} g/mL`, x, base - h - 22, { font: 'display', size: 25, color: C.sun, alpha: q });
          });
          void t;
        },
      },
      {
        say: 'Forget the rearranging? Use the <b>density triangle</b>. Cover the thing you want, and what remains is the formula. Across the bottom means multiply. Top over bottom means divide.',
        dur: 4.6,
        draw(g, p, t) {
          const cx = 250, top = 60, base = 380, half = 200;
          g.fillStyle = C.plum2; g.strokeStyle = C.sun; g.lineWidth = 5;
          g.beginPath(); g.moveTo(cx, top); g.lineTo(cx + half, base); g.lineTo(cx - half, base); g.closePath(); g.fill(); g.stroke();
          const midY = 248;
          const hw = half * ((midY - top) / (base - top));
          g.beginPath(); g.moveTo(cx - hw, midY); g.lineTo(cx + hw, midY); g.moveTo(cx, midY); g.lineTo(cx, base); g.stroke();
          const stage = p < 0.36 ? 0 : p < 0.68 ? 1 : 2;
          const spots = [[cx, 180, 'm'], [cx - 72, 316, 'd'], [cx + 72, 316, 'V']];
          const cover = ['d', 'V', 'm'][stage];
          spots.forEach(([x, y, s]) => {
            if (s === cover) {
              Art.glow(g, x, y, 60, C.pink, 0.6);
              g.fillStyle = C.pink; g.beginPath(); g.arc(x, y, 42, 0, TAU); g.fill();
              Art.text(g, '?', x, y + 2, { font: 'display', size: 54, color: '#fff' });
            } else Art.text(g, s, x, y, { font: 'display', size: 66 });
          });
          const lines = [['Find d', 'd = m ÷ V'], ['Find V', 'V = m ÷ d'], ['Find m', 'm = d × V']];
          lines.forEach(([a, b], i) => {
            const on = i <= stage;
            const y = 110 + i * 100;
            Art.text(g, a, 490, y, { size: 27, align: 'left', color: i === stage ? C.pink : C.dim, alpha: on ? 1 : 0.25 });
            Art.text(g, b, 490, y + 38, { font: 'display', size: 38, align: 'left', color: i === stage ? C.sun : C.ink, alpha: on ? 1 : 0.25 });
          });
          void t;
        },
      },
      {
        say: 'A lumpy rock has no easy volume to calculate. So drop it in water. The level rises by exactly the rock\'s volume. This is <b>water displacement</b>.',
        dur: 4.2,
        draw(g, p, t, { W, H }) {
          Art.bgLab(g, W, H);
          const base = H - 70, cx = 200, h = 330;
          const fall = ease.in(seg(p, 0.14, 0.34)), rise = ease.out(seg(p, 0.32, 0.5));
          const lvl = lerp(0.3, 0.38, rise);
          const hScale = h - 26;
          const surfaceAt = (l) => base - 14 - hScale * l;
          const yRock = lerp(24, base - 44, Math.min(1, fall * 1 + (fall >= 1 ? 0 : 0)));
          const rock = (gg, x, y) => {
            const gr = gg.createLinearGradient(x - 28, y - 22, x + 28, y + 22);
            gr.addColorStop(0, '#B7B3C4'); gr.addColorStop(1, '#5C5870');
            gg.fillStyle = gr; gg.strokeStyle = '#1A0F2E'; gg.lineWidth = 2.5;
            gg.beginPath(); gg.moveTo(x - 30, y + 6); gg.lineTo(x - 18, y - 20); gg.lineTo(x + 12, y - 24); gg.lineTo(x + 30, y - 2); gg.lineTo(x + 18, y + 22); gg.lineTo(x - 16, y + 22); gg.closePath(); gg.fill(); gg.stroke();
          };
          Art.cylinder(g, cx, base, 110, h, { level: lvl, ticks: false });
          g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2;
          for (let v = 0; v <= 100; v += 5) {
            const y = surfaceAt(v / 100);
            g.beginPath(); g.moveTo(cx + 55, y); g.lineTo(cx + 55 - (v % 10 ? 8 : 16), y); g.stroke();
            if (v % 10 === 0 && v >= 20 && v <= 50) Art.text(g, String(v), cx + 66, y, { size: 22, align: 'left' });
          }
          rock(g, cx, yRock);
          const y0 = surfaceAt(0.3), y1 = surfaceAt(0.38);
          const a = seg(p, 0.52, 0.66), b = seg(p, 0.66, 0.8), c = seg(p, 0.8, 0.94);
          g.setLineDash([7, 7]); g.strokeStyle = Art.alpha(C.sun, a); g.lineWidth = 3;
          g.beginPath(); g.moveTo(cx - 55, y0); g.lineTo(cx + 150, y0); g.moveTo(cx - 55, y1); g.lineTo(cx + 150, y1); g.stroke(); g.setLineDash([]);
          Art.text(g, 'Before: 30.0 mL', 370, 80, { size: 28, align: 'left', alpha: a });
          Art.text(g, 'After: 38.0 mL', 370, 120, { size: 28, align: 'left', alpha: a });
          Art.text(g, 'Volume = 38.0 − 30.0 = 8.0 mL', 370, 176, { font: 'display', size: 28, align: 'left', color: C.cyan, alpha: b });
          Art.text(g, 'Mass from a balance = 21.6 g', 370, 228, { size: 28, align: 'left', alpha: c });
          Art.text(g, 'd = 21.6 g ÷ 8.0 mL', 370, 280, { font: 'display', size: 32, align: 'left', alpha: c });
          Art.text(g, '= 2.7 g/mL', 370, 330, { font: 'display', size: 46, align: 'left', color: C.sun, alpha: c });
          void t;
        },
      },
    ],
  });

  /* ---------- Bench: float or sink ---------- */
  const LIQ = {
    ethanol: { name: 'ethanol', d: 0.79, color: '#D9D4F2', alpha: 0.4 },
    water: { name: 'water', d: 1.0, color: C.water, alpha: 0.5 },
    brine: { name: 'very salty water', d: 1.2, color: '#7FD6D0', alpha: 0.5 },
    mercury: { name: 'mercury', d: EL.Hg.density, color: '#C7CCD8', alpha: 0.96 },
  };
  const BLOCKS = [
    { name: 'cork', d: 0.24, c: '#C9925A' },
    { name: 'pine', d: 0.5, c: '#E8C48C' },
    { name: 'ice', d: 0.92, c: '#D6F2FF' },
    { name: 'egg', d: 1.03, c: '#F6E7CC', egg: true },
    { name: 'aluminum', d: EL.Al.density, c: '#BDC3CF' },
    { name: 'iron', d: EL.Fe.density, c: '#7C8294' },
    { name: 'gold', d: EL.Au.density, c: '#FFC83D' },
  ];
  const TW = { x0: 110, x1: 690, floor: 438, h: 240 };
  const BW = 92, BH = 62;
  const TA = { liq: 'water', drag: null, gx: 0, gy: 0, found: {} };
  const shelfX = (i) => 50 + i * 116.6;
  BLOCKS.forEach((b, i) => Object.assign(b, { i, x: shelfX(i), y: 52, vy: 0, inTank: false }));
  const baseSurface = () => TW.floor - TW.h;
  function subFraction(b, surf) {
    const top = b.y - BH / 2, bot = b.y + BH / 2;
    return clamp((bot - surf) / BH);
  }
  function currentSurface() {
    let s = baseSurface();
    BLOCKS.forEach((b) => { if (b.inTank && b !== TA.drag) s -= subFraction(b, baseSurface()) * 7; });
    return s;
  }
  function stepTank(dt) {
    const L = LIQ[TA.liq], surf = currentSurface(), G = 800;
    BLOCKS.forEach((b) => {
      if (!b.inTank || b === TA.drag) return;
      const f = subFraction(b, surf);
      let a = G;
      if (f > 0) {
        const ratio = (L.d * f) / b.d;
        let net = 1 - ratio;
        // Nearly neutral things still move at a watchable speed, in the true direction.
        if (f >= 1 && Math.abs(net) < 0.14) net = 0.14 * Math.sign(net || 1);
        a = G * net - b.vy * (1.2 + 7 * f);
      }
      b.vy = clamp(b.vy + a * dt, -240, 460); b.y += b.vy * dt;
      // A block shoved up by a much denser liquid comes to rest on the surface instead of leaving the tank.
      if (b.y < surf - BH * 0.55) { b.y = surf - BH * 0.55; b.vy = 0; }
      if (b.y > TW.floor - BH / 2) { b.y = TW.floor - BH / 2; b.vy = Math.abs(b.vy) > 40 ? -b.vy * 0.2 : 0; }
    });
    /* Blocks in the tank push each other sideways rather than overlap. */
    const inside = BLOCKS.filter((b) => b.inTank && b !== TA.drag);
    for (let i = 0; i < inside.length; i++) for (let j = i + 1; j < inside.length; j++) {
      const A = inside[i], B = inside[j], dx = B.x - A.x, dy = B.y - A.y;
      if (Math.abs(dx) < BW + 4 && Math.abs(dy) < BH) {
        const push = ((BW + 4 - Math.abs(dx)) / 2) * Math.min(1, dt * 12) * (dx >= 0 ? 1 : -1);
        A.x -= push; B.x += push;
      }
    }
    inside.forEach((b) => { b.x = clamp(b.x, TW.x0 + BW / 2 + 6, TW.x1 - BW / 2 - 6); });
  }
  function drawBlock(g, b, t) {
    const x = b.x - BW / 2, y = b.y - BH / 2;
    g.fillStyle = 'rgba(0,0,0,.18)';
    if (b.egg) {
      const gr = g.createRadialGradient(b.x - 12, b.y - 12, 4, b.x, b.y, 44);
      gr.addColorStop(0, '#FFFDF6'); gr.addColorStop(1, '#D8BE92');
      g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
      g.beginPath(); g.ellipse(b.x, b.y, 44, 31, 0, 0, TAU); g.fill(); g.stroke();
    } else {
      const gr = g.createLinearGradient(x, y, x, y + BH);
      gr.addColorStop(0, Art.mix(b.c, '#ffffff', 0.38)); gr.addColorStop(1, Art.mix(b.c, '#100820', 0.2));
      g.fillStyle = gr; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
      Art.round(g, x, y, BW, BH, 9); g.fill(); g.stroke();
    }
    const dark = Art.lum(b.c) > 0.45;
    Art.text(g, b.name, b.x, b.y - 12, { size: b.name.length > 6 ? 20 : 23, color: dark ? '#22123A' : '#fff' });
    Art.text(g, b.d >= 10 ? b.d.toFixed(1) : b.d.toFixed(2), b.x, b.y + 14, { font: 'display', size: 22, color: dark ? '#22123A' : '#fff' });
    void t;
  }
  const taStage = Lab.stage('#c-tank', {
    h: 470, drag: true, bg: 'lab',
    label: 'A tank of liquid and a shelf of seven labeled blocks. Dragged blocks float at the true depth for their density or sink to the bottom.',
    onPointer(e) {
      if (e.type === 'hover') { taStage.canvas.style.cursor = BLOCKS.some((b) => Math.abs(e.x - b.x) < BW / 2 && Math.abs(e.y - b.y) < BH / 2) ? 'grab' : 'default'; return; }
      if (e.type === 'down') {
        const hit = [...BLOCKS].reverse().find((b) => Math.abs(e.x - b.x) < BW / 2 + 4 && Math.abs(e.y - b.y) < BH / 2 + 8);
        if (hit) { TA.drag = hit; TA.gx = e.x - hit.x; TA.gy = e.y - hit.y; hit.vy = 0; }
      } else if (e.type === 'move' && TA.drag) {
        TA.drag.x = clamp(e.x - TA.gx, BW / 2, 800 - BW / 2); TA.drag.y = clamp(e.y - TA.gy, BH / 2, TW.floor - BH / 2);
      } else if (e.type === 'up' && TA.drag) {
        const b = TA.drag; TA.drag = null;
        if (b.x > TW.x0 && b.x < TW.x1 && b.y > 95) { b.inTank = true; b.vy = 0; explain(b); Lab.sound.pop(); }
        else { b.inTank = false; b.x = shelfX(b.i); b.y = 52; b.vy = 0; }
      }
    },
    draw(g, t, dt, st) {
      if (dt > 0) { const n = Math.max(1, Math.round(dt / 0.008)); for (let i = 0; i < n; i++) stepTank(dt / n); }
      const L = LIQ[TA.liq], surf = currentSurface();
      /* Shelf. */
      g.fillStyle = '#7F5A3B'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5; Art.round(g, 6, 84, 788, 12, 4); g.fill(); g.stroke();
      /* Tank back. */
      g.fillStyle = 'rgba(16,8,32,.45)'; g.fillRect(TW.x0, 130, TW.x1 - TW.x0, TW.floor - 130);
      /* Things in the tank, then the liquid over them. */
      BLOCKS.forEach((b) => { if (b.inTank && b !== TA.drag) drawBlock(g, b, t); });
      const lq = g.createLinearGradient(0, surf, 0, TW.floor);
      lq.addColorStop(0, Art.alpha(Art.mix(L.color, '#ffffff', 0.12), L.alpha)); lq.addColorStop(1, Art.alpha(Art.mix(L.color, '#000030', 0.2), Math.min(1, L.alpha + 0.12)));
      g.fillStyle = lq;
      g.beginPath(); g.moveTo(TW.x0, surf);
      for (let x = TW.x0; x <= TW.x1; x += 16) g.lineTo(x, surf + Math.sin(x * 0.03 + t * 2) * 2);
      g.lineTo(TW.x1, TW.floor); g.lineTo(TW.x0, TW.floor); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.65)'; g.lineWidth = 2.5; g.beginPath();
      for (let x = TW.x0; x <= TW.x1; x += 16) { const y = surf + Math.sin(x * 0.03 + t * 2) * 2; if (x === TW.x0) g.moveTo(x, y); else g.lineTo(x, y); }
      g.stroke();
      /* Glass. */
      g.strokeStyle = 'rgba(18,7,40,.6)'; g.lineWidth = 7; g.beginPath(); g.moveTo(TW.x0, 124); g.lineTo(TW.x0, TW.floor + 3); g.lineTo(TW.x1, TW.floor + 3); g.lineTo(TW.x1, 124); g.stroke();
      g.strokeStyle = C.glass; g.lineWidth = 4; g.stroke();
      /* Labels. */
      Art.text(g, `${L.name[0].toUpperCase() + L.name.slice(1)}: ${L.d >= 10 ? L.d.toFixed(1) : L.d.toFixed(2)} g/mL`, 400, 118, { font: 'display', size: 25, color: C.sun, halo: true });
      /* Blocks on the shelf, and the dragged one on top of everything. */
      BLOCKS.forEach((b) => { if (!b.inTank && b !== TA.drag) drawBlock(g, b, t); });
      if (TA.drag) drawBlock(g, TA.drag, t);
      /* Verdicts on blocks that have settled. */
      BLOCKS.forEach((b) => {
        if (!b.inTank || b === TA.drag) return;
        const sink = b.d > L.d;
        const yy = b.y + BH / 2 + 15, ok = yy < TW.floor;
        if (ok && !sink) Art.text(g, `${Math.round((b.d / L.d) * 100)}% under`, b.x, yy, { size: 20, color: L.alpha > 0.9 ? '#22123A' : '#fff', halo: L.alpha < 0.9 });
      });
      void st;
    },
  });
  const verb = (b) => (b.d > LIQ[TA.liq].d ? 'sinks' : 'floats');
  function explain(b) {
    const L = LIQ[TA.liq];
    const fmt = (d) => (d >= 10 ? d.toFixed(1) : d.toFixed(2));
    const cmp = b.d > L.d ? 'more' : 'less';
    Lab.$('#ta-foot').innerHTML = `<p><b>${b.name[0].toUpperCase() + b.name.slice(1)} ${verb(b)}.</b> At ${fmt(b.d)} g/mL it is ${cmp} dense than ${L.name} at ${fmt(L.d)} g/mL.${b.d < L.d ? ` Exactly ${Math.round((b.d / L.d) * 100)}% of it sits under the surface.` : ''}</p>`;
    if (b.name === 'egg' && b.d < L.d && !TA.found.egg) { TA.found.egg = 1; Lab.collection.award(1); Lab.toast('<strong>You floated an egg.</strong><span>Salt makes water denser than the egg.</span>'); }
    if (b.name === 'iron' && b.d < L.d && !TA.found.iron) { TA.found.iron = 1; Lab.collection.award(1); Lab.toast('<strong>You floated iron.</strong><span>Mercury is denser than solid iron.</span>'); }
  }
  Lab.segmented('#ta-liq', (v) => {
    TA.liq = v;
    BLOCKS.forEach((b) => { b.vy = 0; if (b.inTank) explain(b); });
    taStage.redraw();
  });
  Lab.$('#ta-empty').addEventListener('click', () => { BLOCKS.forEach((b) => { b.inTank = false; b.x = shelfX(b.i); b.y = 52; b.vy = 0; }); taStage.redraw(); });

  /* ---------- Bench: three linked thermometers ---------- */
  const TE = { c: 20 };
  const Y0 = 424, Y1 = 62, Tmin = -273.15, Tmax = 150;
  const yOfC = (c) => lerp(Y0, Y1, (c - Tmin) / (Tmax - Tmin));
  const cOfY = (y) => clamp(Tmin + ((Y0 - y) / (Y0 - Y1)) * (Tmax - Tmin), Tmin, Tmax);
  const toK = (c) => c + 273.15, toF = (c) => 1.8 * c + 32;
  const MARKS = [[100, 'Water boils', C.fire], [37, 'Your body', C.pink], [0, 'Water freezes', C.cyan], [-40, 'Scales agree', C.leaf], [-273.15, 'Absolute zero', C.sun]];
  const SPOTS = Array.from({ length: 16 }, (_, i) => ({ x: rand(i * 3.1), y: rand(i * 7.7), a: rand(i * 2.2) * TAU, seed: i }));
  const teStage = Lab.stage('#c-temp', {
    h: 470, drag: true,
    label: 'Fahrenheit, Celsius and Kelvin thermometers side by side with their liquid at the same height, and a box of particles that speed up as the temperature rises.',
    onPointer(e) {
      if ((e.type === 'down' || e.type === 'move') && e.x < 400 && (e.type === 'down' || TE.drag)) {
        TE.drag = true; setTemp(cOfY(e.y));
      }
      if (e.type === 'up') TE.drag = false;
    },
    draw(g, t) {
      const c = TE.c, yNow = yOfC(c);
      /* Landmarks run across all three scales. */
      MARKS.forEach(([mc, name, col]) => {
        const y = yOfC(mc);
        g.setLineDash([7, 7]); g.strokeStyle = Art.alpha(col, 0.7); g.lineWidth = 2.5;
        g.beginPath(); g.moveTo(40, y); g.lineTo(404, y); g.stroke(); g.setLineDash([]);
        Art.text(g, name, 412, y, { size: 22, align: 'left', color: col, halo: true });
      });
      const therm = (x, unit, val, ticks) => {
        Art.text(g, `${val}`, x, 26, { font: 'display', size: 24, color: C.sun });
        g.fillStyle = 'rgba(255,255,255,.13)'; g.strokeStyle = C.glass; g.lineWidth = 3;
        Art.round(g, x - 11, Y1 - 8, 22, Y0 - Y1 + 16, 11); g.fill(); g.stroke();
        g.beginPath(); g.arc(x, Y0 + 14, 15, 0, TAU); g.fill(); g.stroke();
        const col = c < 0 ? '#5BB8FF' : '#FF4D5E';
        g.fillStyle = col; Art.round(g, x - 5.5, yNow, 11, Y0 + 14 - yNow, 5.5); g.fill();
        g.beginPath(); g.arc(x, Y0 + 14, 11, 0, TAU); g.fill();
        ticks.forEach(([v, lab]) => {
          const y = lab === undefined ? 0 : v;
          g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2;
          g.beginPath(); g.moveTo(x + 13, y); g.lineTo(x + 20, y); g.stroke();
          Art.text(g, lab, x - 16, y, { size: 20, align: 'right', color: C.ink, halo: true });
        });
      };
      const fmt1 = (v) => String(v.toFixed(1)).replace('-', '−');
      const lab = (v) => String(parseFloat(v.toFixed(2))).replace('-', '−');
      /* Only the landmark readings are printed, so the scale stays readable. */
      therm(112, '°F', `${fmt1(toF(c))} °F`, MARKS.map(([m]) => [yOfC(m), lab(toF(m))]));
      therm(232, '°C', `${fmt1(c)} °C`, MARKS.map(([m]) => [yOfC(m), lab(m)]));
      therm(352, 'K', `${toK(c).toFixed(2)} K`, MARKS.map(([m]) => [yOfC(m), lab(toK(m))]));
      /* A band linking the three liquid tops. */
      g.fillStyle = Art.alpha(C.sun, 0.9); g.fillRect(90, yNow - 1.5, 284, 3);
      /* Particle box. */
      const bx = 590, by = 40, bw = 196, bh = 226;
      g.fillStyle = 'rgba(16,8,32,.8)'; Art.round(g, bx, by, bw, bh, 12); g.fill();
      g.strokeStyle = C.cyan; g.lineWidth = 4; g.stroke();
      const K = toK(c), speed = Math.sqrt(K / 293) * 0.45;
      const tri = (v) => { const k = ((v % 2) + 2) % 2; return k > 1 ? 2 - k : k; };
      /* Position is a pure function of a running clock, so speed changes stay smooth. */
      TE.clock = (TE.clock || 0) + (TE.lastT === undefined ? 0 : (t - TE.lastT) * speed);
      TE.lastT = t;
      const zero = K < 0.5;
      SPOTS.forEach((s, i) => {
        const r = 11;
        const x = bx + r + 4 + tri(s.x * 2 + TE.clock * (0.6 + rand(i) * 0.5) * Math.cos(s.a) * 1.3) * (bw - 2 * r - 8);
        const y = by + r + 4 + tri(s.y * 2 + TE.clock * (0.6 + rand(i + 9) * 0.5) * Math.sin(s.a) * 1.3) * (bh - 2 * r - 8);
        Art.atom(g, x, y, r + 3, 'Ne', { label: false, face: null, t });
      });
      Art.text(g, zero ? 'Lowest energy' : K < 60 ? 'Barely moving' : K < 290 ? 'Moving slowly' : K < 340 ? 'Moving fast' : 'Moving very fast', bx + bw / 2, by + bh + 26, { size: 24, color: zero ? C.sun : C.ink });
      Art.text(g, 'Particle speed', bx + bw / 2, by - 18, { size: 22, color: C.dim });
      Art.moe(g, 688, 462, 130, zero ? 'wow' : c < 0 ? 'oops' : c > 90 ? 'oops' : 'happy', { t, bob: false });
    },
  });
  function setTemp(c) {
    TE.c = c;
    const s = Lab.$('#te-c'); s.value = c; Lab.paintRange(s);
    Lab.$('#te-c-out').textContent = `${c.toFixed(2).replace('-', '−')} °C`;
    const f = c.toFixed(2), kv = (c + 273.15).toFixed(2), fv = toF(c).toFixed(2);
    const sub = c < 0 ? `(${f})` : f;
    Lab.$('#te-foot').innerHTML = Lab.texString(`<p>$T_{\\text{K}} = ${sub} + 273.15 = ${kv}\\text{ K}$</p><p>$T_{^\\circ\\text{F}} = 1.8 \\times ${sub} + 32 = ${fv}\\ ^\\circ\\text{F}$</p>`);
    teStage.redraw();
  }
  Lab.$('#te-c').addEventListener('input', (e) => setTemp(+e.target.value));
  const teSeg = Lab.segmented('#te-jump', (v) => {
    if (Lab.reducedMotion) { setTemp(+v); return; }
    const from = TE.c, to = +v, t0 = performance.now();
    (function run(now) {
      const u = clamp((now - t0) / 700);
      setTemp(lerp(from, to, ease.inOut(u)));
      if (u < 1) requestAnimationFrame(run);
    })(t0);
  });
  void teSeg;
  setTemp(20);
});
