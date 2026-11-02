/* The periodic table: a study reference first, the element collection game second.
   Tiles are real buttons in a CSS grid; color modes only repaint them. */
Lab.ready(function () {
  'use strict';
  const { $, $$, clamp, ease, seg, lerp } = Lab;
  const C = Art.C;
  const E = window.ELEMENTS;

  /* ---------- Data clean-up ----------
     The table is PubChem's. These few entries are shown differently here on purpose:
     - Discovery years PubChem lists that contradict the standard account of who isolated the element.
     - Palladium's common oxidation states are +2 and +4 (PubChem lists +3, +2).
     - Gas densities in the file are in g/cm3, and are displayed in g/L. */
  const YEAR_FIX = { Al: '1825', Ca: '1808', F: '1886', Si: '1824', Ru: '1844' };
  const OX_FIX = { Pd: '+4, +2' };
  const NOTE = {
    He: 'Helium stays liquid at normal pressure, even near absolute zero. Freezing it takes about 25 atm.',
    As: 'At normal pressure arsenic turns straight from solid to gas at 887 K. Melting it takes high pressure.',
    C: 'At normal pressure carbon turns straight from solid to gas, so these two values are approximate.',
  };

  /* Elements with no stable isotopes (and no standard atomic weight). */
  const unstable = (z) => z === 43 || z === 61 || (z >= 84 && z <= 89) || z >= 93;
  const neverSeen = (z) => z >= 100; // Never made in visible amounts: state and melting point are predictions.
  function massText(e) {
    if (unstable(e.z)) return `[${Math.round(e.mass)}]`;
    if (Number.isInteger(e.mass)) return e.mass < 100 ? e.mass.toFixed(1) : String(e.mass);
    return String(+e.mass.toFixed(e.mass < 100 ? 3 : 2));
  }
  function stateOf(e) {
    if (neverSeen(e.z)) return 'Unknown';
    return e.state;
  }
  const tidyOx = (e) => {
    const raw = OX_FIX[e.sym] || e.ox || '';
    return raw.split(',').map((s) => s.trim()).filter(Boolean).map((s) => {
      const n = parseInt(s, 10);
      if (Number.isNaN(n)) return s;
      return n > 0 ? '+' + n : n < 0 ? '−' + -n : '0';
    });
  };

  /* ---------- Electrons: everything comes from the config string ---------- */
  const FILL = ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p', '6s', '4f', '5d', '6p', '7s', '5f', '6d', '7p'];
  const CAP = { s: 2, p: 6, d: 10, f: 14 };
  function subshells(e) {
    const m = {};
    const core = /\[(\w+)\]/.exec(e.config);
    if (core) Object.assign(m, subshells(EL[core[1]]));
    e.config.replace(/\[\w+\]/, '').trim().split(/\s+/).forEach((tok) => {
      const r = /^(\d)([spdf])(\d+)$/.exec(tok);
      if (r) m[r[1] + r[2]] = +r[3];
    });
    return m;
  }
  function shellsOf(e) {
    const s = [];
    const m = subshells(e);
    Object.keys(m).forEach((k) => { const n = +k[0]; s[n - 1] = (s[n - 1] || 0) + m[k]; });
    return Array.from(s, (v) => v || 0);
  }
  const fmtSub = (k, n) => `<span class="nowrap">${k}<sup>${n}</sup></span>`;
  function configShort(e) {
    const coreM = /\[(\w+)\]/.exec(e.config);
    const m = subshells(e);
    const coreSub = coreM ? subshells(EL[coreM[1]]) : {};
    const parts = FILL.filter((k) => m[k] && !coreSub[k]).map((k) => fmtSub(k, m[k]));
    return (coreM ? `[${coreM[1]}] ` : '') + parts.join(' ');
  }
  function configFull(e) {
    const m = subshells(e);
    return FILL.filter((k) => m[k]).map((k) => fmtSub(k, m[k])).join(' ');
  }
  function breaksFilling(e) {
    const real = subshells(e);
    let left = e.z;
    for (const k of FILL) {
      const take = Math.min(left, CAP[k[1]]);
      if ((real[k] || 0) !== take) return true;
      left -= take;
    }
    return false;
  }
  const CONFIG_NOTE = {
    Cr: 'An exam favorite. A half-filled 3d set is extra stable, so one 4s electron moves up. The simple filling order would say 4s² 3d⁴.',
    Cu: 'An exam favorite. A completely filled 3d set is extra stable, so one 4s electron moves up. The simple filling order would say 4s² 3d⁹.',
    Mo: 'Same story as chromium, its neighbor above: a half-filled d set wins.',
    Ag: 'Same story as copper, its neighbor above: a filled d set wins.',
    Au: 'Same story as copper: a filled d set wins.',
  };

  function shellNote(e, shells) {
    const out = shells[shells.length - 1];
    if (e.sym === 'H') return 'One electron, one shell. Hydrogen can lose it, share it, or gain a second one.';
    switch (e.family) {
      case 'Noble gas': return e.z >= 118 ? 'Its outer shell counts as full, though few atoms have ever existed to test it.' : 'A full outer shell. That is why noble gases rarely react.';
      case 'Alkali metal': return 'One lonely outer electron, and it is easy to lose. That makes a +1 ion.';
      case 'Alkaline earth metal': return 'Two outer electrons, which it tends to lose. That makes a +2 ion.';
      case 'Halogen': return 'Seven outer electrons, one short of a full shell. That is why it grabs one and makes a −1 ion.';
      case 'Transition metal':
        if (e.sym === 'Pd') return 'Palladium is the odd one out. Its 5s stays empty, so shell 4 is its outer shell.';
        return 'Its d electrons fill an inner shell. Several of them can take part in bonding, so it can form different ions.';
      case 'Lanthanide': case 'Actinide': return 'This family fills f orbitals buried deep inside the atom, so its members all act a lot alike.';
      default: return `${out} valence electrons on the outer shell.`;
    }
  }

  /* ---------- Colors ---------- */
  const rgb = (c) => {
    if (c[0] === '#') { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    return c.match(/[\d.]+/g).slice(0, 3).map(Number);
  };
  const relLum = (c) => {
    const [r, g, b] = rgb(c).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a, b) => { const A = relLum(a), B = relLum(b); return (Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05); };
  const ink = (c) => (contrast(c, '#1A0F2E') >= contrast(c, '#FFFFFF') ? '#1A0F2E' : '#FFFFFF');
  /* Each heat map is one hue, dark for low and bright for high, so bright always means more. */
  const RAMP = {
    pink: ['#3B1540', '#E0208A', '#FFE3F2'],
    cyan: ['#10304C', '#109CC4', '#DDFAFF'],
    sun: ['#3B2A14', '#E39A06', '#FFF6CF'],
    violet: ['#261C5E', '#7E5CF2', '#EBE3FF'],
  };
  const rampColor = (r, t) => { t = clamp(t); return t < 0.5 ? Art.mix(r[0], r[1], t * 2) : Art.mix(r[1], r[2], (t - 0.5) * 2); };
  const NO_DATA = '#2B1A4A';

  /* ---------- Color modes ---------- */
  const fam = (key, label) => ({ key, label, color: Lab.familyColor(key) });
  const best = (get) => {
    const have = E.filter((e) => get(e) != null);
    const hi = have.reduce((a, b) => (get(b) > get(a) ? b : a));
    const lo = have.reduce((a, b) => (get(b) < get(a) ? b : a));
    return { hi, lo, max: get(hi), min: get(lo) };
  };
  const fmtDensity = (v) => (v < 0.01 ? String(+v.toPrecision(1)) : v < 1 ? v.toFixed(2) : v.toFixed(v < 10 ? 2 : 1));
  const MODES = {
    family: {
      key: (e) => e.family,
      items: [fam('Alkali metal', 'Alkali metals'), fam('Alkaline earth metal', 'Alkaline earth metals'), fam('Transition metal', 'Transition metals'), fam('Post-transition metal', 'Post-transition metals'), fam('Metalloid', 'Metalloids'), fam('Nonmetal', 'Other nonmetals'), fam('Halogen', 'Halogens'), fam('Noble gas', 'Noble gases'), fam('Lanthanide', 'Lanthanides'), fam('Actinide', 'Actinides')],
      note: () => 'Elements in the same column behave alike. Tap a family in the key to spotlight it. Hydrogen sits in group 1, but it is a nonmetal.',
    },
    state: {
      key: stateOf,
      items: [{ key: 'Solid', label: 'Solid', color: '#B9A9E6' }, { key: 'Liquid', label: 'Liquid', color: '#FF4FA3' }, { key: 'Gas', label: 'Gas', color: '#2FD6F2' }, { key: 'Unknown', label: 'Not known', color: null }],
      note: () => 'At 25 °C and 1 atm. Only bromine and mercury are liquid. Gallium and cesium melt just above that. Nobody has made enough of the hatched elements to look at one.',
    },
    block: {
      key: (e) => e.block,
      items: [{ key: 's', label: 's block', color: '#FF4FA3' }, { key: 'p', label: 'p block', color: '#FFD23F' }, { key: 'd', label: 'd block', color: '#2FD6F2' }, { key: 'f', label: 'f block', color: '#3DDC84' }],
      note: () => 'A block is named for the subshell its newest electrons fill. Helium sits on the far right, yet its electrons are 1s², so it counts as s block.',
    },
    en: {
      heat: 'pink', title: 'Electronegativity', unit: 'Pauling scale', get: (e) => e.en, fmt: (v) => v.toFixed(2),
      note: (b) => `How hard an atom pulls on electrons it shares. It rises going right and going up. Highest: ${b.hi.name}, ${b.max.toFixed(2)}. Most noble gases have no value, since they rarely share.`,
    },
    rcov: {
      heat: 'cyan', title: 'Covalent radius', unit: 'pm', get: (e) => e.rcov, fmt: (v) => String(v),
      note: (b) => `Half the distance between two bonded atoms. It grows going down and going left. Largest: ${b.hi.name}, ${b.max} pm. Smallest: ${b.lo.name}, ${b.min} pm.`,
    },
    ie: {
      heat: 'sun', title: 'First ionization energy', unit: 'eV', get: (e) => e.ie, fmt: (v) => v.toFixed(2),
      note: (b) => `The energy it takes to pull off one electron. It rises going right and going up. Highest: ${b.hi.name}, ${b.max.toFixed(2)} eV. Lowest: ${b.lo.name}, ${b.min.toFixed(2)} eV. Multiply by 96.49 for kJ/mol.`,
    },
    density: {
      heat: 'violet', title: 'Density', unit: 'g/cm³', get: (e) => e.density, fmt: fmtDensity,
      note: (b) => `How much mass fits in each cm³. It peaks in the middle of period 6. Highest: ${b.hi.name}, ${b.max.toFixed(2)} g/cm³. Gases barely register on this scale.`,
    },
  };
  Object.values(MODES).forEach((m) => {
    if (m.heat) Object.assign(m, best(m.get));
    else m.map = Object.fromEntries(m.items.map((i) => [i.key, i]));
  });

  /* ---------- Build the grid ---------- */
  const grid = $('#pt-grid');
  let html = '';
  for (let x = 1; x <= 18; x++) html += `<span class="pt-gn" style="grid-column:${x + 1};grid-row:1">${x === 1 ? 'Group 1' : x}</span>`;
  for (let y = 1; y <= 7; y++) html += `<span class="pt-pn" style="grid-column:1;grid-row:${y + 1}">${y === 1 ? 'Period 1' : y}</span>`;
  html += '<span class="pt-fname" style="grid-column:2 / span 2;grid-row:10">Lanthanides</span><span class="pt-fname" style="grid-column:2 / span 2;grid-row:11">Actinides</span>';
  html += '<button type="button" class="pt-gapcell" data-f="Lanthanide" style="grid-column:4;grid-row:7" aria-label="Spotlight the lanthanides, elements 57 to 71, in the row below"><span>57–71</span></button>';
  html += '<button type="button" class="pt-gapcell" data-f="Actinide" style="grid-column:4;grid-row:8" aria-label="Spotlight the actinides, elements 89 to 103, in the row below"><span>89–103</span></button>';
  html += `<div class="pt-inset" style="grid-column:4 / span 10;grid-row:2 / span 3">
    <div class="pv" id="pv"><small id="pv-z"></small><b id="pv-sym"></b><span id="pv-name"></span><i id="pv-val"></i></div>
    <div class="pt-legend" id="legend-inset"></div>
  </div>`;
  E.forEach((e) => {
    html += `<button type="button" class="pt-tile" data-sym="${e.sym}" style="grid-column:${e.x + 1};grid-row:${e.y + 1};--x:${e.x}">
      <span class="z">${e.z}</span><b class="sym">${e.sym}</b><span class="nm">${e.name}</span><span class="val"></span></button>`;
  });
  grid.innerHTML = html;
  const tiles = new Map($$('.pt-tile', grid).map((b) => [b.dataset.sym, b]));

  /* ---------- Paint ---------- */
  let mode = 'family';
  let spot = null; // A function picking the elements to spotlight, or null.
  let spotKey = null;

  function paintTile(e, btn, m) {
    let color, val, missing = false;
    if (m.heat) {
      const v = m.get(e);
      if (v == null) { color = NO_DATA; val = 'no data'; missing = true; }
      else { color = rampColor(RAMP[m.heat], (v - m.min) / (m.max - m.min)); val = m.fmt(v); }
    } else {
      color = m.map[m.key(e)].color; val = massText(e);
      if (!color) { color = NO_DATA; missing = true; }
    }
    btn.style.setProperty('--c', color);
    btn.style.setProperty('--t', missing ? '#D9CFF0' : ink(color));
    btn.classList.toggle('is-missing', missing);
    btn.querySelector('.val').textContent = val;
    const extra = m.heat ? `${m.title} ${missing ? 'no data' : val + ' ' + m.unit}` : `${(m.map[m.key(e)] || {}).label || ''}, atomic mass ${massText(e)}`;
    btn.setAttribute('aria-label', `${e.name}, atomic number ${e.z}. ${extra}`);
  }
  function legendHTML() {
    const m = MODES[mode];
    if (m.heat) {
      const r = RAMP[m.heat];
      return `<div class="lg-heat"><p class="lg-title">${m.title}${m.unit === 'Pauling scale' ? ', Pauling scale' : `, in ${m.unit}`}</p>
        <div class="lg-bar" style="background:linear-gradient(90deg,${r[0]},${r[1]},${r[2]})"></div>
        <div class="lg-ticks"><span>${m.fmt(m.min)}</span><span>${m.fmt((m.min + m.max) / 2)}</span><span>${m.fmt(m.max)}</span></div>
        <p class="lg-miss"><i></i>Hatched means no data</p></div>`;
    }
    return `<div class="lg-chips">${m.items.map((i) => `<button type="button" class="lg-chip${i.color ? '' : ' is-hatch'}" data-key="${i.key}" aria-pressed="${spotKey === i.key}">
      <i style="${i.color ? `background:${i.color}` : ''}"></i>${i.label}</button>`).join('')}</div>`;
  }
  function paintLegend() {
    const h = legendHTML();
    $('#legend-top').innerHTML = h;
    $('#legend-inset').innerHTML = h;
  }
  function paintSpot() {
    E.forEach((e) => tiles.get(e.sym).classList.toggle('is-dim', !!spot && !spot(e)));
    $$('.pt-gapcell', grid).forEach((b) => b.setAttribute('aria-pressed', String(spotKey === b.dataset.f)));
  }
  function paint() {
    const m = MODES[mode];
    E.forEach((e) => paintTile(e, tiles.get(e.sym), m));
    paintLegend();
    paintSpot();
    $('#pt-note').textContent = m.note(m);
    preview(selected || hovered || EL.H);
  }
  function setSpot(key, fn) {
    if (spotKey === key) { spotKey = null; spot = null; }
    else { spotKey = key; spot = fn; }
    paintLegend();
    paintSpot();
  }

  /* ---------- The big preview tile in the gap at the top of the table ---------- */
  let hovered = null;
  function preview(e) {
    const m = MODES[mode];
    const btn = tiles.get(e.sym);
    const pv = $('#pv');
    pv.style.setProperty('--c', btn.style.getPropertyValue('--c'));
    pv.style.setProperty('--t', btn.style.getPropertyValue('--t'));
    pv.classList.toggle('is-missing', btn.classList.contains('is-missing'));
    $('#pv-z').textContent = e.z;
    $('#pv-sym').textContent = e.sym;
    $('#pv-name').textContent = e.name;
    let val = massText(e);
    if (m.heat) { const v = m.get(e); val = v == null ? 'no data' : `${m.fmt(v)}${m.unit === 'Pauling scale' ? '' : ' ' + m.unit}`; }
    $('#pv-val').textContent = val;
  }
  grid.addEventListener('pointerover', (ev) => {
    const b = ev.target.closest('.pt-tile');
    if (b) { hovered = EL[b.dataset.sym]; preview(hovered); }
  });
  grid.addEventListener('focusin', (ev) => {
    const b = ev.target.closest('.pt-tile');
    if (b) { hovered = EL[b.dataset.sym]; preview(hovered); }
  });

  /* ---------- Tools ---------- */
  Lab.segmented('#pt-mode', (v) => {
    mode = v; spot = null; spotKey = null;
    $('#pt-find').value = '';
    paint();
  });
  [$('#legend-top'), $('#legend-inset')].forEach((host) => host.addEventListener('click', (ev) => {
    const b = ev.target.closest('.lg-chip');
    if (!b) return;
    const key = b.dataset.key, m = MODES[mode];
    $('#pt-find').value = '';
    setSpot(key, (e) => m.key(e) === key);
    Lab.sound.pop();
  }));
  grid.addEventListener('click', (ev) => {
    const gap = ev.target.closest('.pt-gapcell');
    if (gap) { const f = gap.dataset.f; setSpot(f, (e) => e.family === f); return; }
    const t = ev.target.closest('.pt-tile');
    if (t) { openElement(EL[t.dataset.sym], t); Lab.sound.pop(); }
  });
  const fitBtn = $('#pt-fit');
  fitBtn.addEventListener('click', () => {
    const on = grid.classList.toggle('is-fit');
    fitBtn.setAttribute('aria-pressed', String(on));
    fitBtn.textContent = on ? 'Show bigger tiles' : 'Fit whole table';
  });
  /* Find: by name, symbol, or atomic number. Enter opens the first match. */
  const findMatches = (q) => {
    q = q.trim().toLowerCase();
    if (!q) return [];
    return E.filter((e) => e.sym.toLowerCase() === q || String(e.z) === q || e.name.toLowerCase().startsWith(q));
  };
  const find = $('#pt-find');
  find.addEventListener('input', () => {
    const q = find.value.trim();
    spotKey = null; spot = null;
    if (q) {
      const list = findMatches(q);
      spot = (e) => list.includes(e);
      spotKey = '__find';
      if (list[0]) tiles.get(list[0].sym).scrollIntoView({ block: 'nearest', inline: 'center', behavior: Lab.reducedMotion ? 'auto' : 'smooth' });
    }
    paintLegend();
    paintSpot();
  });
  find.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter') return;
    ev.preventDefault();
    const list = findMatches(find.value);
    if (list[0]) openElement(list[0], tiles.get(list[0].sym));
  });
  /* Arrow keys walk the table. */
  const atXY = new Map(E.map((e) => [`${e.x},${e.y}`, e]));
  grid.addEventListener('keydown', (ev) => {
    const b = ev.target.closest('.pt-tile');
    const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[ev.key];
    if (!b || !d) return;
    ev.preventDefault();
    let { x, y } = EL[b.dataset.sym];
    for (let i = 0; i < 18; i++) {
      x += d[0]; y += d[1];
      const hit = atXY.get(`${x},${y}`);
      if (hit) { tiles.get(hit.sym).focus(); return; }
      if (x < 1 || x > 18 || y < 1 || y > 10) return;
    }
  });

  /* ---------- Detail panel ---------- */
  const panel = $('#el-panel');
  const scrim = $('#el-scrim');
  let selected = null;
  let returnFocus = null;
  $('#el-close').innerHTML = Lab.icons.x;

  const bohr = { el: null, shells: [], t0: 0, mood: 'happy' };
  const moodOf = (e) => (e.family === 'Noble gas' ? 'happy' : e.family === 'Halogen' ? 'grumpy' : e.family === 'Alkali metal' ? 'wink' : 'happy');
  const bohrStage = Lab.stage('#bohr', {
    w: 600, h: 600, bg: 'micro', label: 'A Bohr-style diagram of the electron shells of the chosen element.',
    draw(g, t) {
      const e = bohr.el;
      if (!e) return;
      const cx = 300, cy = 300, shells = bohr.shells, n = shells.length;
      const rN = n <= 2 ? 54 : n <= 4 ? 44 : 34;
      const gap = Math.min(80, (272 - rN - 6) / n);
      const elapsed = Lab.reducedMotion ? 9 : t - bohr.t0;
      const big = shells.reduce((a, b) => a + b, 0) > 36;
      const er = n >= 6 ? 6.5 : n === 5 ? 7 : n === 4 ? 8 : 10;
      for (let i = 0; i < n; i++) {
        const R = rN + gap * (i + 1);
        const outer = i === n - 1;
        const a = seg(elapsed, i * 0.09, i * 0.09 + 0.25);
        g.strokeStyle = Art.alpha(outer ? C.sun : C.ink, (outer ? 0.55 : 0.2) * a);
        g.lineWidth = outer ? 2.6 : 2;
        g.beginPath(); g.arc(cx, cy, R, 0, 6.2832); g.stroke();
        const count = shells[i];
        const spin = t * (0.95 / (1 + i * 0.55));
        const color = outer ? C.sun : C.electron;
        for (let k = 0; k < count; k++) {
          const q = ease.back(seg(elapsed, i * 0.09 + k * 0.01, i * 0.09 + k * 0.01 + 0.28));
          if (q <= 0) continue;
          const ang = spin + (k / count) * 6.2832 + i * 0.7 - 1.5708;
          const x = cx + Math.cos(ang) * R, y = cy + Math.sin(ang) * R;
          if (outer && !big) Art.glow(g, x, y, er * 2.6, color, 0.5);
          Art.ball(g, x, y, Math.max(0.01, er * q), color);
        }
      }
      Art.atom(g, cx, cy, rN, e.sym, { face: bohr.mood, t, seed: e.z, look: [Math.sin(t * 0.6) * 0.5, 0] });
      Art.pill(g, `${e.z} proton${e.z === 1 ? '' : 's'}`, 16, 34, { align: 'left', size: 23, color: '#7A1F3D', text: '#FFD7E0' });
      Art.pill(g, `${e.z} electron${e.z === 1 ? '' : 's'}`, 584, 34, { align: 'right', size: 23, color: '#0E4A5C', text: '#CFF7FF' });
    },
  });

  const tempText = (k) => {
    const c = k - 273.15;
    const cText = Math.abs(c) >= 100 ? String(Math.round(c)) : c.toFixed(1);
    return `${+k.toFixed(2)} K <small>(${cText.replace('-', '−')} °C)</small>`;
  };
  function stat(label, value, frac, help) {
    const missing = value == null;
    const bar = frac === undefined ? '' : `<span class="stat-bar${missing ? ' is-none' : ''}"><i style="width:${missing ? 0 : Math.round(clamp(frac) * 100)}%"></i></span>`;
    return `<div class="stat"><dt>${label}</dt><dd class="stat-v">${missing ? '<span class="stat-none">No value</span>' : value}</dd>${bar}${help ? `<dd class="stat-help">${help}</dd>` : ''}</div>`;
  }
  const rangeOf = (key) => MODES[key];
  const frac = (key, v) => { const m = rangeOf(key); return v == null ? undefined : (v - m.min) / (m.max - m.min); };

  function renderPanel(e) {
    const color = Lab.familyColor(e.family);
    const top = $('#el-top');
    top.style.setProperty('--c', color);
    top.style.setProperty('--t', ink(color));
    $('#el-z').textContent = e.z;
    $('#el-sym').textContent = e.sym;
    $('#el-title').textContent = e.name;
    const where = e.group ? `group ${e.group}, period ${e.period}` : `period ${e.period}`;
    $('#el-sub').textContent = `${e.family}, ${where}, ${e.block} block`;

    const mass = massText(e);
    const massNum = e.mass.toFixed(e.mass < 100 ? 2 : 1);
    $('#el-mass').innerHTML = `
      <div class="mass-card"><span class="mass-label">Atomic number</span><b>${e.z}</b><small>${e.z} proton${e.z === 1 ? '' : 's'} in every atom</small></div>
      <div class="mass-card"><span class="mass-label">Atomic mass</span><b>${mass} ${unstable(e.z) ? '' : 'u'}</b>
      <small>${unstable(e.z) ? 'No stable isotopes. This is the mass number of a long-lived one.' : `One mole has a mass of about ${massNum} g.`}</small></div>`;

    const shells = shellsOf(e);
    bohr.el = e; bohr.shells = shells; bohr.mood = moodOf(e); bohr.t0 = bohrStage.t;
    bohrStage.canvas.setAttribute('aria-label', `Bohr-style diagram of ${e.name}: nucleus with ${e.z} protons, electrons in shells of ${shells.join(', ')}.`);
    bohrStage.redraw();
    $('#el-shells').innerHTML = `<p class="shell-chips">${shells.map((c, i) => `<span class="shell-chip${i === shells.length - 1 ? ' is-outer' : ''}">Shell ${i + 1}: <b>${c}</b></span>`).join('')}</p>
      <p class="shell-note">${shellNote(e, shells)}</p>
      <p class="shell-honest">A simplified model. Real electrons live in fuzzy <a href="orbitals.html">orbitals</a>, not neat circles.</p>`;

    const isGas = e.state === 'Gas';
    const stateWord = neverSeen(e.z) ? `Predicted ${e.state.replace('Expected to be a ', '').toLowerCase()}` : e.state;
    const densityText = e.density == null ? null : isGas ? `${+(e.density * 1000).toPrecision(4)} g/L` : `${e.density} g/cm³`;
    const kj = (ev) => Math.round(ev * 96.485);
    const estimate = neverSeen(e.z) ? 'An estimate. Nobody has measured it.' : '';
    const ox = tidyOx(e);
    const year = YEAR_FIX[e.sym] || e.year;
    const predicted = e.z >= 104 ? '<p class="cfg-note">Predicted. Too few atoms have been made to measure it.</p>' : '';
    const note = CONFIG_NOTE[e.sym] || (breaksFilling(e) ? 'A real-life exception to the simple filling order.' : '');
    const fullCfg = configFull(e);
    const shortCfg = configShort(e);

    $('#el-body').innerHTML = `
      <h3 class="el-h">Electron configuration</h3>
      <p class="cfg">${shortCfg}</p>
      ${shortCfg !== fullCfg ? `<p class="cfg-full"><span>Written out in full:</span> ${fullCfg}</p>` : ''}
      ${note ? `<p class="cfg-note">${note}</p>` : ''}${predicted}

      <h3 class="el-h">Properties</h3>
      <dl class="stats">
        ${stat('State at room temperature', stateWord)}
        ${stat('Density', densityText, frac('density', e.density), isGas ? 'For this gas, at 0 °C and 1 atm' : '')}
        ${stat('Electronegativity', e.en == null ? null : e.en.toFixed(2), e.en == null ? 0 : frac('en', e.en), 'Pauling scale')}
        ${stat('First ionization energy', e.ie == null ? null : `${e.ie} eV <small>(${kj(e.ie)} kJ/mol)</small>`, e.ie == null ? 0 : frac('ie', e.ie))}
        ${stat('Covalent radius', e.rcov == null ? null : `${e.rcov} pm`, e.rcov == null ? 0 : frac('rcov', e.rcov))}
        ${stat('Van der Waals radius', e.rvdw == null ? null : `${+e.rvdw} pm`)}
        ${stat('Electron affinity', e.ea == null ? null : `${e.ea} eV <small>(${kj(e.ea)} kJ/mol)</small>`, undefined, e.ea == null ? '' : 'Energy released on gaining an electron')}
        ${stat('Melting point', e.mp == null ? null : tempText(e.mp), undefined, e.mp == null ? '' : estimate)}
        ${stat('Boiling point', e.bp == null ? null : tempText(e.bp))}
      </dl>
      ${NOTE[e.sym] ? `<p class="cfg-note">${NOTE[e.sym]}</p>` : ''}

      <h3 class="el-h">Oxidation states</h3>
      ${ox.length ? `<p class="ox-chips">${ox.map((s) => `<span class="ox-chip ${s[0] === '+' ? 'is-pos' : s[0] === '−' ? 'is-neg' : ''}">${s}</span>`).join('')}</p><p class="el-small">The common ones, not a complete list.${e.z >= 104 ? ' Predicted for this element.' : ''}</p>` : '<p class="el-small">Not known yet.</p>'}

      <h3 class="el-h">Discovered</h3>
      <p class="el-year">${year === 'Ancient' ? 'Known since ancient times' : year}</p>

      <div class="moe-says el-moe"><div class="moe-pic" data-moe="happy"></div><div class="bubble"><p>${e.fact}</p></div></div>`;
    Lab.placeMoe(panel);

    const prev = E[e.z - 2], next = E[e.z];
    const pb = $('#el-prev'), nb = $('#el-next');
    pb.hidden = !prev; nb.hidden = !next;
    if (prev) pb.textContent = `Back to ${prev.name}`;
    if (next) nb.textContent = `Next: ${next.name}`;
    $('#el-scroll').scrollTop = 0;
  }

  function markSelected(e) {
    $$('.is-selected').forEach((b) => b.classList.remove('is-selected'));
    if (e) {
      tiles.get(e.sym).classList.add('is-selected');
      const ct = $(`#coll-grid [data-sym="${e.sym}"]`);
      if (ct) ct.classList.add('is-selected');
    }
  }
  function setHash(h) {
    try { history.replaceState(null, '', location.pathname + location.search + h); } catch (x) { /* file:// on some browsers */ }
  }
  function openElement(e, fromBtn, keepHash) {
    const wasOpen = !panel.hidden;
    if (!wasOpen) returnFocus = fromBtn || document.activeElement;
    selected = e;
    panel.hidden = false;
    scrim.classList.add('is-on');
    renderPanel(e);
    markSelected(e);
    preview(e);
    if (!keepHash) setHash('#' + e.sym);
    requestAnimationFrame(() => {
      panel.classList.add('is-open');
      if (!wasOpen) $('#el-close').focus({ preventScroll: true });
    });
  }
  function closePanel() {
    if (panel.hidden) return;
    panel.classList.remove('is-open');
    scrim.classList.remove('is-on');
    selected = null;
    markSelected(null);
    setHash('');
    const done = () => { if (!panel.classList.contains('is-open')) panel.hidden = true; };
    if (Lab.reducedMotion) done(); else setTimeout(done, 260);
    if (returnFocus && returnFocus.focus) returnFocus.focus({ preventScroll: true });
  }
  $('#el-close').addEventListener('click', closePanel);
  scrim.addEventListener('click', closePanel);
  $('#el-prev').addEventListener('click', () => { if (selected && selected.z > 1) openElement(E[selected.z - 2]); });
  $('#el-next').addEventListener('click', () => { if (selected && selected.z < 118) openElement(E[selected.z]); });
  document.addEventListener('keydown', (ev) => {
    if (panel.hidden) return;
    if (ev.key === 'Escape') { closePanel(); return; }
    if (panel.contains(document.activeElement) && selected) {
      if (ev.key === 'ArrowRight' && selected.z < 118) { ev.preventDefault(); openElement(E[selected.z]); }
      if (ev.key === 'ArrowLeft' && selected.z > 1) { ev.preventDefault(); openElement(E[selected.z - 2]); }
    }
  });

  /* ---------- Three little maps of the table's shape ---------- */
  function miniMap(title, text, pick) {
    let cells = '';
    E.forEach((e) => {
      if (e.y > 7) return;
      const col = pick(e);
      cells += `<i style="grid-column:${e.x};grid-row:${e.y};${col ? `background:${col}` : ''}"></i>`;
    });
    return `<div class="mini"><div class="mini-map" aria-hidden="true">${cells}</div><h3>${title}</h3><p>${text}</p></div>`;
  }
  const metalClass = (e) => (e.family === 'Metalloid' ? '#0AA5C7' : ['Nonmetal', 'Halogen', 'Noble gas'].includes(e.family) ? '#18B26B' : '#D4A017');
  $('#mini-row').innerHTML = [
    miniMap('Columns are groups', 'Same column, same number of outer electrons, so similar chemistry. Group 17, the halogens, all grab one electron.', (e) => (e.x === 17 ? '#FF4FA3' : null)),
    miniMap('Rows are periods', 'Each new row starts a new electron shell. Period 3 runs from sodium to argon, adding one electron each step.', (e) => (e.y === 3 ? '#FFD23F' : null)),
    miniMap('Metals and the staircase', 'Metals (gold here) fill the left and middle. Nonmetals (green) sit top right. Metalloids (blue) run down the staircase between them.', metalClass),
  ].join('');

  /* ---------- The collection game ---------- */
  const collGrid = $('#coll-grid');
  collGrid.innerHTML = E.map((e) => `<button type="button" class="ct" data-sym="${e.sym}" style="grid-column:${e.x};grid-row:${e.y > 7 ? e.y - 1 : e.y};--c:${Lab.familyColor(e.family)};--t:${ink(Lab.familyColor(e.family))}" aria-label="${e.name}"><small>${e.z}</small><b>${e.sym}</b></button>`).join('');
  const collTiles = $$('.ct', collGrid);
  collGrid.addEventListener('click', (ev) => {
    const b = ev.target.closest('.ct');
    if (b) openElement(EL[b.dataset.sym], b);
  });
  const ladder = $('#ladder');
  ladder.innerHTML = Lab.RANKS.map(([k, name]) => `<li class="rung" data-k="${k}"><span class="rung-n">${k}</span><span class="rung-name">${name}</span><span class="rung-moe" data-moe="wave"></span></li>`).join('');
  Lab.placeMoe(ladder);

  let shownCount = null;
  function paintCollection() {
    const n = Lab.collection.count();
    const grew = shownCount !== null && n > shownCount && n - shownCount <= 8;
    collTiles.forEach((t, i) => {
      const z = i + 1, lit = z <= n;
      t.classList.toggle('is-lit', lit);
      t.classList.toggle('is-next', z === n + 1);
      const e = E[i];
      t.setAttribute('aria-label', `${e.name}, atomic number ${e.z}, ${lit ? 'discovered' : z === n + 1 ? 'next to discover' : 'not discovered yet'}`);
      if (grew && z > shownCount && z <= n && !Lab.reducedMotion) {
        t.style.animationDelay = (z - shownCount - 1) * 90 + 'ms';
        t.classList.remove('just-lit'); void t.offsetWidth; t.classList.add('just-lit');
      }
    });
    $$('[data-coll-count]').forEach((b) => { b.textContent = n; });
    $('#coll-bar').style.width = (100 * n) / 118 + '%';
    $('#coll-rank').textContent = Lab.collection.rank();
    const nextRank = Lab.RANKS.find(([k]) => k > n);
    const nextEl = E[n];
    let msg;
    if (!nextEl) msg = 'You found all 118. There is nothing left to discover, unless someone makes element 119.';
    else msg = `Next up: <b>${nextEl.name}</b>.` + (nextRank ? ` ${nextRank[0] - n} more to reach ${nextRank[1]}.` : '');
    $('#coll-next').innerHTML = msg;
    let current = 0;
    Lab.RANKS.forEach(([k]) => { if (n >= k) current = k; });
    $$('.rung', ladder).forEach((r) => {
      const k = +r.dataset.k;
      r.classList.toggle('is-reached', k <= n);
      r.classList.toggle('is-current', k === current);
      if (k === current) r.setAttribute('aria-current', 'step'); else r.removeAttribute('aria-current');
    });
    $('#pt-under-count').textContent = `You have discovered ${n} of 118 elements.`;
    shownCount = n;
  }
  document.addEventListener('lab:collection', paintCollection);

  /* ---------- Start ---------- */
  paint();
  paintCollection();
  function handleHash() {
    const h = decodeURIComponent(location.hash.slice(1)).split(/[?&]/)[0];
    if (!h) return;
    if (h === 'collection') {
      if (!panel.hidden) closePanel();
      const t = $('#collection');
      if (t) requestAnimationFrame(() => t.scrollIntoView({ block: 'start' }));
      setHash('#collection');
      return;
    }
    const e = EL[h] || E.find((x) => x.sym.toLowerCase() === h.toLowerCase() || x.name.toLowerCase() === h.toLowerCase());
    if (e) {
      openElement(e, tiles.get(e.sym), true);
      setHash('#' + e.sym);
    }
  }
  window.addEventListener('hashchange', handleHash);
  handleHash();
  void lerp;
});
