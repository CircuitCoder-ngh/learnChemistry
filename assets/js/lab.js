/* The Mole Hole: core runtime. Loaded with `defer` on every page, first of the site scripts.
   Exposes window.Lab. Classic scripts only, so the site also works from file://.

   Holds: course map, helpers, storage, theme, header/rail/footer, progress, the element
   collection, toasts + confetti, sounds, KaTeX rendering, canvas stages, and the story player. */
(function () {
  'use strict';
  const Lab = (window.Lab = {});

  /* ---------- Course map: the single source of truth ---------- */
  Lab.course = [
    { id: 'u0', title: 'Start here', depth: 'The way in', lessons: [
      { id: 'start', num: '0', title: 'How to see chemistry', blurb: 'Three views of everything, and how big an atom really is' },
    ]},
    { id: 'u1', title: 'Matter and measurement', depth: 'Topsoil', lessons: [
      { id: 'matter', num: '1.1', title: 'What is stuff made of?', blurb: 'States, mixtures, and physical versus chemical change' },
      { id: 'measurement', num: '1.2', title: 'Measuring and significant figures', blurb: 'SI units, scientific notation, accuracy, and sig figs' },
      { id: 'conversions', num: '1.3', title: 'Unit conversions and density', blurb: 'The cancel-the-units trick that solves half of chemistry' },
    ]},
    { id: 'u2', title: 'Atoms, molecules and ions', depth: 'Clay', lessons: [
      { id: 'atoms', num: '2.1', title: 'Inside the atom', blurb: 'Protons, neutrons, electrons, and the gold foil surprise' },
      { id: 'isotopes', num: '2.2', title: 'Build an atom', blurb: 'Atomic number, mass number, isotopes, ions, average mass' },
      { id: 'periodic-intro', num: '2.3', title: 'Meet the periodic table', blurb: 'Groups, periods, metals, and the families you must know' },
      { id: 'compounds', num: '2.4', title: 'Ions and compounds', blurb: 'Ionic versus molecular, formulas, and polyatomic ions' },
      { id: 'naming', num: '2.5', title: 'Naming compounds', blurb: 'One flowchart for ionic, molecular, and acid names' },
    ]},
    { id: 'u3', title: 'The mole', depth: 'Mole country', lessons: [
      { id: 'mole', num: '3.1', title: 'The mole', blurb: 'The counting number that connects atoms to grams' },
      { id: 'composition', num: '3.2', title: 'Formulas from data', blurb: 'Percent composition, empirical and molecular formulas' },
    ]},
    { id: 'u4', title: 'Reactions and stoichiometry', depth: 'Gravel', lessons: [
      { id: 'balancing', num: '4.1', title: 'Balancing equations', blurb: 'Atoms are never lost, so both sides must match' },
      { id: 'reaction-types', num: '4.2', title: 'The five reaction types', blurb: 'Spot the pattern and predict the products' },
      { id: 'combustion', num: '4.3', title: 'Combustion equations', blurb: 'Burning fuels, balancing C then H then O, and soot' },
      { id: 'stoichiometry', num: '4.4', title: 'Stoichiometry', blurb: 'Grams to moles to moles to grams, every time' },
      { id: 'limiting', num: '4.5', title: 'Limiting reactants and yield', blurb: 'What runs out first, and how much you really get' },
    ]},
    { id: 'u5', title: 'Reactions in water', depth: 'The water table', lessons: [
      { id: 'solutions', num: '5.1', title: 'Solutions and molarity', blurb: 'Dissolving, electrolytes, molarity, and dilution' },
      { id: 'solubility', num: '5.2', title: 'Solubility rules', blurb: 'Which ionic compounds dissolve, and the exceptions' },
      { id: 'precipitation', num: '5.3', title: 'Precipitation and net ionic equations', blurb: 'Mix two clear liquids, get a solid, cross out spectators' },
      { id: 'acid-base', num: '5.4', title: 'Acids, bases and titration', blurb: 'Neutralization and finding an unknown with a color change' },
      { id: 'redox', num: '5.5', title: 'Oxidation and reduction', blurb: 'Following electrons with oxidation numbers' },
    ]},
    { id: 'u6', title: 'Energy and heat', depth: 'Warm rock', lessons: [
      { id: 'energy', num: '6.1', title: 'Energy and heat', blurb: 'Systems, exothermic versus endothermic, and q = mcΔT' },
      { id: 'calorimetry', num: '6.2', title: 'Calorimetry', blurb: 'Measuring heat with a coffee cup and a bomb' },
      { id: 'enthalpy', num: '6.3', title: "Enthalpy and Hess's law", blurb: 'Energy diagrams, stacking reactions, and bond energies' },
    ]},
    { id: 'u7', title: 'Electrons and the periodic table', depth: 'Crystal seam', lessons: [
      { id: 'light', num: '7.1', title: 'Light and photons', blurb: 'Waves, the spectrum, and the photoelectric effect' },
      { id: 'bohr', num: '7.2', title: 'Line spectra and the Bohr atom', blurb: 'Why each element glows its own colors' },
      { id: 'orbitals', num: '7.3', title: 'Orbitals and quantum numbers', blurb: 'Electron clouds in 3D, and the four numbers' },
      { id: 'configurations', num: '7.4', title: 'Electron configurations', blurb: 'Filling orbitals in order, for any atom or ion' },
      { id: 'trends', num: '7.5', title: 'Periodic trends', blurb: 'Size, ionization energy, and electronegativity explained' },
    ]},
    { id: 'u8', title: 'Bonds and molecular shape', depth: 'Bedrock', lessons: [
      { id: 'ionic', num: '8.1', title: 'Ionic bonds', blurb: 'Handing over electrons, lattices, and lattice energy' },
      { id: 'covalent', num: '8.2', title: 'Covalent bonds and polarity', blurb: 'Sharing, the energy well, and the tug of war' },
      { id: 'lewis', num: '8.3', title: 'Lewis structures', blurb: 'A recipe for drawing any molecule, plus formal charge' },
      { id: 'vsepr', num: '8.4', title: 'VSEPR and molecular shapes', blurb: 'Electron groups push apart, and that sets the shape' },
      { id: 'hybrid', num: '8.5', title: 'Hybrid orbitals and MO theory', blurb: 'Sigma, pi, sp³, and bond order' },
    ]},
    { id: 'u9', title: 'Gases', depth: 'Gas pocket', lessons: [
      { id: 'gas-laws', num: '9.1', title: 'Pressure and the gas laws', blurb: 'Squeeze it, heat it, add to it, and watch' },
      { id: 'ideal-gas', num: '9.2', title: 'The ideal gas law', blurb: 'PV = nRT, gas stoichiometry, and partial pressures' },
      { id: 'kmt', num: '9.3', title: 'Kinetic theory and real gases', blurb: 'Molecular speeds, effusion, and when gases misbehave' },
    ]},
    { id: 'u10', title: 'Liquids and solids', depth: 'Deep rock', lessons: [
      { id: 'imf', num: '10.1', title: 'Intermolecular forces', blurb: 'The stickiness between molecules that sets boiling points' },
      { id: 'phases', num: '10.2', title: 'Phase changes', blurb: 'Heating curves, vapor pressure, and phase diagrams' },
      { id: 'solids', num: '10.3', title: 'Solids and crystals', blurb: 'Unit cells and the four kinds of solid' },
    ]},
    { id: 'u11', title: 'Solution properties', depth: 'Hot springs', lessons: [
      { id: 'solution-props', num: '11.1', title: 'Solubility and colligative properties', blurb: "Like dissolves like, Henry's law, and why salt melts ice" },
    ]},
    { id: 'u12', title: 'Going deeper: next-term topics', depth: 'The mantle', bonus: true, lessons: [
      { id: 'kinetics', num: '12', title: 'Reaction rates', blurb: 'Collisions, rate laws, activation energy, catalysts' },
      { id: 'equilibrium', num: '13', title: 'Chemical equilibrium', blurb: "K, Q, and Le Chatelier's principle" },
      { id: 'ph', num: '14', title: 'pH and buffers', blurb: 'The pH scale, weak acids, and resisting change' },
      { id: 'thermo', num: '15', title: 'Entropy and free energy', blurb: 'Why things happen on their own' },
      { id: 'electrochem', num: '16', title: 'Batteries and electrochemistry', blurb: 'Turning redox into electricity' },
      { id: 'nuclear', num: '17', title: 'Nuclear chemistry', blurb: 'Decay, half-life, and fission' },
      { id: 'organic', num: '18', title: 'A first look at organic chemistry', blurb: 'Carbon chains and functional groups' },
    ]},
  ];
  /* Each unit has its own color, used for lesson banners, big ideas and worked-step numbers. */
  const UNIT_COLOR = {
    u0: '#1E9E6A', u1: '#2E8F4F', u2: '#B4562A', u3: '#7B3FF2', u4: '#3F6AA8', u5: '#0E7FC0', u6: '#CF3E22',
    u7: '#B321A8', u8: '#4F5A8C', u9: '#0F8F87', u10: '#4140BE', u11: '#0A8C9C', u12: '#D2500A',
  };
  Lab.unitColor = (id) => UNIT_COLOR[id] || '#7B3FF2';
  Lab.lessons = Lab.course.flatMap((u) => u.lessons.map((l) => Object.assign(l, { unit: u, href: l.id + '.html' })));
  Lab.lessonById = (id) => Lab.lessons.find((l) => l.id === id);
  Lab.extras = [
    { id: 'periodic-table', title: 'Periodic table', href: 'periodic-table.html' },
    { id: 'exam', title: 'Exam simulator', href: 'exam.html' },
    { id: 'flashcards', title: 'Flashcards', href: 'flashcards.html' },
    { id: 'cheat-sheet', title: 'Cheat sheet', href: 'cheat-sheet.html' },
    { id: 'glossary', title: 'Glossary', href: 'glossary.html' },
    { id: 'movie', title: 'The movie', href: 'movie.html' },
  ];

  /* ---------- Small utilities ---------- */
  Lab.$ = (sel, root = document) => (typeof sel === 'string' ? root.querySelector(sel) : sel);
  Lab.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  Lab.clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
  Lab.lerp = (a, b, t) => a + (b - a) * t;
  /** Map p to 0..1 inside the window [a, b]: the workhorse for scene choreography. */
  Lab.seg = (p, a, b) => Lab.clamp((p - a) / (b - a));
  Lab.ease = {
    linear: (t) => t,
    in: (t) => t * t * t,
    out: (t) => 1 - Math.pow(1 - t, 3),
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    back: (t) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    elastic: (t) => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin(((t * 10 - 0.75) * 2 * Math.PI) / 3) + 1),
    bounce: (t) => {
      const n = 7.5625, d = 2.75;
      if (t < 1 / d) return n * t * t;
      if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
      if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
      return n * (t -= 2.625 / d) * t + 0.984375;
    },
  };
  /** Repeatable pseudo-random from a seed: deterministic scenes depend on this. */
  Lab.rand = (seed) => { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  /** Smooth wander in -1..1, for thermal jiggle and bobbing. */
  Lab.wander = (seed, t) => Math.sin(t * (0.7 + Lab.rand(seed) * 1.3) + seed * 6.28) * 0.6 + Math.sin(t * (1.9 + Lab.rand(seed + 9) * 2.1) + seed * 2.1) * 0.4;

  /** Format with fixed decimals. */
  Lab.fmt = (n, d = 2) => (Number.isFinite(n) ? n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—');
  /** Format to N significant figures, as plain text. */
  Lab.sig = function (x, n = 3) {
    if (!Number.isFinite(x)) return '—';
    if (x === 0) return (0).toFixed(Math.max(0, n - 1));
    const e = Math.floor(Math.log10(Math.abs(x)));
    if (e >= n + 3 || e < -3) {
      const m = x / Math.pow(10, e);
      return m.toFixed(n - 1) + '\u00A0×\u00A010' + Lab.sup(e);
    }
    const d = Math.max(0, n - 1 - e);
    if (d === 0) { const f = Math.pow(10, e - n + 1); return String(Math.round(x / f) * f); }
    return x.toFixed(d);
  };
  Lab.sup = (e) => String(e).replace(/[-0-9]/g, (c) => '⁻⁰¹²³⁴⁵⁶⁷⁸⁹'['-0123456789'.indexOf(c)]);
  /** Turn "H2O" or "SO4^2-" into HTML with <sub>/<sup>. */
  Lab.fHTML = function (f) {
    return String(f).replace(/\^([0-9]*[+-])/g, '<sup>$1</sup>').replace(/([A-Za-z)\]])(\d+)/g, '$1<sub>$2</sub>');
  };

  Lab.store = {
    get(key, fallback = null) {
      try { const v = localStorage.getItem('mh:' + key); return v === null ? fallback : JSON.parse(v); }
      catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('mh:' + key, JSON.stringify(value)); } catch (e) { /* not remembered */ }
    },
  };

  /* ---------- Theme ---------- */
  const darkMQ = matchMedia('(prefers-color-scheme: dark)');
  Lab.theme = () => document.documentElement.dataset.theme || (darkMQ.matches ? 'dark' : 'light');
  Lab.color = (name) => getComputedStyle(document.documentElement).getPropertyValue('--' + name).trim();
  Lab.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // A `?shot` URL (screenshot tooling) freezes nothing but marks automation for debugging.
  Lab.isAuto = /[?&]shot\b/.test(location.search);

  /* ---------- Icons ---------- */
  const I = (d, extra = '') => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
  Lab.icons = {
    sun: I('<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>'),
    moon: I('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'),
    menu: I('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4.5" width="4.4" height="15" rx="1.4" fill="currentColor"/><rect x="13.6" y="4.5" width="4.4" height="15" rx="1.4" fill="currentColor"/></svg>',
    back: I('<path d="M14.5 5.5L8 12l6.5 6.5"/>'),
    next: I('<path d="M9.5 5.5L16 12l-6.5 6.5"/>'),
    replay: I('<path d="M4 12a8 8 0 1 0 2.6-5.9"/><path d="M4 4.5v4.2h4.2"/>'),
    voice: I('<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>'),
    voiceOff: I('<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>'),
    bell: I('<path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2h-15z"/><path d="M10 21h4"/>'),
    bellOff: I('<path d="M6 16.5V11a6 6 0 0 1 9-5.2M18 11v5.5l1.5 2H7"/><path d="M4 4l16 16"/><path d="M10 21h4"/>'),
    check: I('<path d="M5 12.5l4.5 4.5L19 7"/>'),
    x: I('<path d="M6 6l12 12M18 6L6 18"/>'),
    expand: I('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  };

  /* ---------- Sound (off until asked for) ---------- */
  let audio = null;
  Lab.sound = {
    get on() { return Lab.store.get('sound', false); },
    set on(v) { Lab.store.set('sound', !!v); },
    tone(freq, dur = 0.12, type = 'sine', gain = 0.06, when = 0) {
      if (!this.on) return;
      try {
        audio = audio || new (window.AudioContext || window.webkitAudioContext)();
        const o = audio.createOscillator(), g = audio.createGain(), t0 = audio.currentTime + when;
        o.type = type; o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g).connect(audio.destination);
        o.start(t0); o.stop(t0 + dur + 0.02);
      } catch (e) { /* no audio available */ }
    },
    pop() { this.tone(620, 0.09, 'triangle'); this.tone(930, 0.1, 'triangle', 0.05, 0.05); },
    good() { [523, 659, 784].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.06, i * 0.08)); },
    bad() { this.tone(220, 0.2, 'sawtooth', 0.025); this.tone(180, 0.24, 'sawtooth', 0.025, 0.1); },
    fanfare() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.06, i * 0.09)); },
  };

  /* ---------- Progress ---------- */
  Lab.progress = {
    all() { return Lab.store.get('done', {}); },
    isDone(id) { return !!this.all()[id]; },
    set(id, done) {
      const all = this.all();
      if (done) all[id] = Date.now(); else delete all[id];
      Lab.store.set('done', all);
      refreshProgress();
    },
    count() { const a = this.all(); return Lab.lessons.filter((l) => a[l.id]).length; },
  };

  /* ---------- The element collection: every correct answer discovers the next element ---------- */
  Lab.RANKS = [
    [0, 'Glassware washer'], [3, 'Lab assistant'], [10, 'Goggle wearer'], [20, 'Bench chemist'], [36, 'Titration ace'],
    [54, 'Reaction wrangler'], [72, 'Mole wizard'], [86, 'Periodic pro'], [103, 'Mad scientist'], [118, 'Nobel laureate'],
  ];
  Lab.collection = {
    count() { return Lab.clamp(Lab.store.get('elements', 0), 0, 118); },
    rank() { const n = this.count(); let r = Lab.RANKS[0][1]; Lab.RANKS.forEach(([k, name]) => { if (n >= k) r = name; }); return r; },
    award(n = 1) {
      const before = this.count();
      const after = Math.min(118, before + n);
      if (after === before) { Lab.sound.good(); return null; }
      Lab.store.set('elements', after);
      const el = window.ELEMENTS ? window.ELEMENTS[after - 1] : null;
      refreshCollection();
      const rankBefore = rankOf(before), rankAfter = rankOf(after);
      if (el) elementToast(el, rankBefore !== rankAfter ? rankAfter : null, after);
      Lab.sound.good();
      return el;
    },
  };
  function rankOf(n) { let r = Lab.RANKS[0][1]; Lab.RANKS.forEach(([k, name]) => { if (n >= k) r = name; }); return r; }

  function refreshCollection() {
    const n = Lab.collection.count();
    Lab.$$('[data-element-count]').forEach((el) => (el.textContent = n));
    Lab.$$('[data-rank]').forEach((el) => (el.textContent = Lab.collection.rank()));
    document.dispatchEvent(new CustomEvent('lab:collection', { detail: { count: n } }));
  }

  function toastHost() {
    let h = document.getElementById('toasts');
    if (!h) {
      h = document.createElement('div');
      h.id = 'toasts'; h.className = 'toasts';
      h.setAttribute('role', 'status'); h.setAttribute('aria-live', 'polite');
      document.body.appendChild(h);
    }
    return h;
  }
  function elementToast(el, newRank, n) {
    const h = toastHost();
    const t = document.createElement('a');
    t.className = 'toast element-toast'; t.href = `periodic-table.html#${el.sym}`;
    t.innerHTML = `<span class="el-tile" style="--el:${Lab.familyColor(el.family)}"><small>${el.z}</small><b>${el.sym}</b></span>
      <span class="toast-body"><strong>You discovered ${el.name}!</strong><span>${el.fact}</span>
      ${newRank ? `<em>New lab rank: ${newRank}</em>` : ''}</span>`;
    h.appendChild(t);
    Array.from(h.children).slice(0, -2).forEach((c) => c.remove());
    setTimeout(() => { t.classList.add('is-out'); setTimeout(() => t.remove(), 400); }, newRank ? 7000 : 5200);
    if (newRank || n === 118) Lab.confetti();
  }
  Lab.toast = function (html, ms = 3200) {
    const h = toastHost();
    const t = document.createElement('div');
    t.className = 'toast'; t.innerHTML = `<span class="toast-body">${html}</span>`;
    h.appendChild(t);
    setTimeout(() => { t.classList.add('is-out'); setTimeout(() => t.remove(), 400); }, ms);
  };

  /* Periodic-table family colors, used wherever elements appear as tiles. */
  const FAMILY = {
    'Nonmetal': '#18B26B', 'Noble gas': '#7B3FF2', 'Alkali metal': '#F0278F', 'Alkaline earth metal': '#FF7A1A',
    'Metalloid': '#0AA5C7', 'Halogen': '#10A58E', 'Post-transition metal': '#3D7BFF', 'Transition metal': '#D4A017',
    'Lanthanide': '#B0599F', 'Actinide': '#C2484F',
  };
  Lab.familyColor = (f) => FAMILY[f] || '#7A6E94';
  Lab.FAMILY = FAMILY;

  /* Confetti burst on a fixed overlay canvas. */
  Lab.confetti = function (n = 110) {
    if (Lab.reducedMotion) return;
    const c = document.createElement('canvas');
    c.className = 'confetti'; c.setAttribute('aria-hidden', 'true');
    document.body.appendChild(c);
    const dpr = Math.min(2, devicePixelRatio || 1);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    const g = c.getContext('2d'); g.scale(dpr, dpr);
    const colors = ['#F0278F', '#19C2E0', '#FFD23F', '#3DDC84', '#FF7A1A', '#A97BFF'];
    const bits = Array.from({ length: n }, (_, i) => ({
      x: innerWidth * 0.5 + (Math.random() - 0.5) * 240, y: innerHeight * 0.42,
      vx: (Math.random() - 0.5) * 900, vy: -350 - Math.random() * 620,
      s: 5 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - 0.5) * 14,
      c: colors[i % colors.length], round: i % 3 === 0,
    }));
    let last = performance.now(), t = 0;
    (function frame(now) {
      const dt = Math.min(0.04, (now - last) / 1000); last = now; t += dt;
      g.clearRect(0, 0, innerWidth, innerHeight);
      g.globalAlpha = Lab.clamp(3 - t);
      bits.forEach((b) => {
        b.vy += 1100 * dt; b.vx *= 0.992; b.x += b.vx * dt; b.y += b.vy * dt; b.r += b.vr * dt;
        g.save(); g.translate(b.x, b.y); g.rotate(b.r); g.fillStyle = b.c;
        if (b.round) { g.beginPath(); g.arc(0, 0, b.s * 0.5, 0, 6.3); g.fill(); }
        else g.fillRect(-b.s / 2, -b.s / 3, b.s, b.s * 0.66);
        g.restore();
      });
      if (t < 3) requestAnimationFrame(frame); else c.remove();
    })(last);
  };

  /* ---------- Chrome ---------- */
  const page = document.body.dataset.page || '';

  function buildHeader() {
    const host = document.getElementById('site-header');
    if (!host) return;
    host.className = 'topbar';
    const hasRail = !!document.getElementById('rail');
    const link = (href, label, id, cls = '') => `<a href="${href}" class="${cls}"${page === id ? ' aria-current="page"' : ''}>${label}</a>`;
    host.innerHTML = `
      <a class="skip-link" href="#main">Skip to the lesson</a>
      <div class="topbar-inner">
        ${hasRail ? `<button class="icon-btn rail-toggle" type="button" aria-label="Open course map" aria-expanded="false" aria-controls="rail">${Lab.icons.menu}</button>` : ''}
        <a class="brand" href="index.html"><span class="brand-moe" data-moe="wave"></span><span class="brand-name">The Mole Hole</span></a>
        <nav class="topnav" aria-label="Main">
          ${link('index.html#dig', 'Course', '__', 'hide-sm')}
          ${link('periodic-table.html', 'Periodic table', 'periodic-table', 'hide-sm')}
          ${link('exam.html', 'Exam simulator', 'exam', 'hide-sm')}
          ${link('cheat-sheet.html', 'Cheat sheet', 'cheat-sheet', 'hide-md')}
          <a class="element-count" href="periodic-table.html#collection" title="Elements discovered. Get answers right to find more.">
            <span class="ec-num"><span data-element-count>0</span><small>/118</small></span><span class="ec-rank" data-rank></span>
          </a>
          <button class="icon-btn sound-btn" type="button"></button>
          <button class="icon-btn theme-btn" type="button"></button>
        </nav>
      </div>`;
    const themeBtn = host.querySelector('.theme-btn');
    const paintTheme = () => {
      const dark = Lab.theme() === 'dark';
      themeBtn.innerHTML = dark ? Lab.icons.sun : Lab.icons.moon;
      themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    };
    paintTheme();
    themeBtn.addEventListener('click', () => {
      const t = Lab.theme() === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = t;
      Lab.store.set('theme', t);
      paintTheme();
      document.dispatchEvent(new CustomEvent('lab:theme', { detail: { theme: t } }));
    });
    darkMQ.addEventListener('change', paintTheme);

    const soundBtn = host.querySelector('.sound-btn');
    const paintSound = () => {
      soundBtn.innerHTML = Lab.sound.on ? Lab.icons.bell : Lab.icons.bellOff;
      soundBtn.setAttribute('aria-label', Lab.sound.on ? 'Turn sound effects off' : 'Turn sound effects on');
      soundBtn.setAttribute('aria-pressed', String(Lab.sound.on));
    };
    paintSound();
    soundBtn.addEventListener('click', () => { Lab.sound.on = !Lab.sound.on; paintSound(); Lab.sound.pop(); });
  }

  function buildRail() {
    const rail = document.getElementById('rail');
    if (!rail) return;
    const done = Lab.progress.all();
    let html = '<nav aria-label="Course map"><div class="rail-tunnel">';
    Lab.course.forEach((u) => {
      const hereUnit = u.lessons.some((l) => l.id === page);
      html += `<details class="rail-unit"${hereUnit ? ' open' : ''}><summary>${u.title}</summary><ol>`;
      u.lessons.forEach((l) => {
        const cur = l.id === page;
        html += `<li><a class="rail-link${done[l.id] ? ' is-done' : ''}" data-id="${l.id}" href="${l.href}"${cur ? ' aria-current="page"' : ''}>
          <span class="rail-num">${l.num}</span><span class="rail-title">${l.title}</span></a>`;
        if (cur) html += '<ol class="rail-sections" id="rail-sections"></ol>';
        html += '</li>';
      });
      html += '</ol></details>';
    });
    html += `</div><div class="rail-extras">${Lab.extras.map((e) => `<a href="${e.href}"${e.id === page ? ' aria-current="page"' : ''}>${e.title}</a>`).join('')}</div>`;
    html += '<div class="rail-progress"><span id="rail-progress-text"></span><div class="meter"><span id="rail-progress-bar"></span></div></div></nav>';
    rail.innerHTML = html;

    const secList = document.getElementById('rail-sections');
    const heads = Lab.$$('#main h2[id]');
    if (secList && heads.length) {
      heads.forEach((h) => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#${h.id}">${h.dataset.short || h.textContent}</a>`;
        secList.appendChild(li);
      });
      const links = Lab.$$('a', secList);
      const io = new IntersectionObserver((es) => {
        es.forEach((e) => {
          if (e.isIntersecting) links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
        });
      }, { rootMargin: '-15% 0px -70% 0px' });
      heads.forEach((h) => io.observe(h));
    }
    const toggle = document.querySelector('.rail-toggle');
    const scrim = document.createElement('div');
    scrim.className = 'rail-scrim';
    document.body.appendChild(scrim);
    const setOpen = (open) => {
      rail.classList.toggle('is-open', open);
      scrim.classList.toggle('is-open', open);
      if (toggle) toggle.setAttribute('aria-expanded', String(open));
    };
    if (toggle) toggle.addEventListener('click', () => setOpen(!rail.classList.contains('is-open')));
    scrim.addEventListener('click', () => setOpen(false));
    rail.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    const cur = rail.querySelector('[aria-current="page"]');
    if (cur && rail.scrollHeight > rail.clientHeight) rail.scrollTop = Math.max(0, cur.offsetTop - 120);
  }

  function refreshProgress() {
    const done = Lab.progress.all();
    Lab.$$('.rail-link').forEach((a) => a.classList.toggle('is-done', !!done[a.dataset.id]));
    const n = Lab.progress.count();
    const text = document.getElementById('rail-progress-text');
    const bar = document.getElementById('rail-progress-bar');
    if (text) text.textContent = `${n} of ${Lab.lessons.length} lessons finished`;
    if (bar) bar.style.width = (100 * n) / Lab.lessons.length + '%';
    Lab.$$('[data-progress-count]').forEach((el) => (el.textContent = n));
    document.dispatchEvent(new CustomEvent('lab:progress', { detail: { count: n } }));
  }

  /** Fill <header class="lesson-head" data-lesson> and #lesson-end from the course map. */
  function buildLessonParts() {
    const lesson = Lab.lessonById(page);
    if (lesson) document.documentElement.style.setProperty('--unit', UNIT_COLOR[lesson.unit.id] || '#7B3FF2');
    const num = document.getElementById('lesson-num');
    if (num && lesson) num.textContent = `Lesson ${lesson.num}`;
    const unit = document.getElementById('lesson-unit');
    if (unit && lesson) unit.textContent = lesson.unit.title;

    const host = document.getElementById('lesson-end');
    if (!host || !lesson) return;
    const idx = Lab.lessons.findIndex((l) => l.id === page);
    const prev = Lab.lessons[idx - 1], next = Lab.lessons[idx + 1];
    host.innerHTML = `
      <div class="lesson-done">
        <span class="moe-mini" data-moe="cheer"></span>
        <div><p class="lesson-done-q">Got it? Mark this lesson finished to light up its tunnel and find three new elements.</p>
        <button class="btn complete-btn" type="button"></button></div>
      </div>
      <nav class="pager" aria-label="Lesson navigation">
        ${prev ? `<a href="${prev.href}"><span class="pager-dir">Back to ${prev.num}</span><span class="pager-title">${prev.title}</span></a>` : '<span></span>'}
        ${next ? `<a class="is-next" href="${next.href}"><span class="pager-dir">Next up, ${next.num}</span><span class="pager-title">${next.title}</span></a>` : '<a class="is-next" href="exam.html"><span class="pager-dir">You made it</span><span class="pager-title">Take the exam simulator</span></a>'}
      </nav>`;
    const btn = host.querySelector('.complete-btn');
    const paint = () => {
      const d = Lab.progress.isDone(page);
      btn.classList.toggle('is-done', d);
      btn.textContent = d ? 'Finished. Click to undo' : 'Mark lesson finished';
    };
    btn.addEventListener('click', () => {
      const d = !Lab.progress.isDone(page);
      Lab.progress.set(page, d);
      paint();
      if (d) {
        Lab.confetti(); Lab.sound.fanfare();
        // Only the first finish pays out.
        const paid = Lab.store.get('paid', {});
        if (!paid[page]) { paid[page] = 1; Lab.store.set('paid', paid); Lab.collection.award(3); }
      }
    });
    paint();
  }

  function buildFooter() {
    const host = document.getElementById('site-footer');
    if (!host) return;
    host.className = 'site-footer';
    host.innerHTML = `<div class="site-footer-inner">
      <p>The Mole Hole teaches first-year college chemistry for free. It follows the standard course sequence, and your own instructor's rules and syllabus always win.</p>
      <nav aria-label="Footer"><a href="index.html">Home</a>${Lab.extras.map((e) => `<a href="${e.href}">${e.title}</a>`).join('')}<a href="about.html">Sources</a></nav>
    </div>`;
  }

  /* ---------- Math and chemical notation ----------
     Anywhere in page text: $\ce{2H2 + O2 -> 2H2O}$ inline, $$...$$ display. Write \$ for a literal dollar. */
  function fallbackTex(src) {
    return src.replace(/\\ce\{([^}]*)\}/g, '$1').replace(/\\text\{([^}]*)\}/g, '$1').replace(/\\(?:,|;|!)/g, ' ').replace(/\\times/g, '×').replace(/\\cdot/g, '·').replace(/[{}\\]/g, '');
  }
  function texHTML(src, display) {
    if (window.katex) {
      try { return window.katex.renderToString(src, { displayMode: display, throwOnError: false, strict: false }); }
      catch (e) { /* fall through */ }
    }
    return `<span class="tex-fallback">${fallbackTex(src)}</span>`;
  }
  /** Split on math. Plain text goes through `plain`, math through KaTeX, and \\$ becomes a literal dollar. */
  function mapMath(s, plain) {
    const re = /\$\$([\s\S]+?)\$\$|\\\$|\$([^$\n]+?)\$/g;
    let out = '', last = 0, m;
    while ((m = re.exec(s))) {
      out += plain(s.slice(last, m.index));
      if (m[0] === '\\$') out += '$';
      else if (m[1] !== undefined) out += texHTML(m[1], true);
      else out += texHTML(m[2], false);
      last = m.index + m[0].length;
    }
    return out + plain(s.slice(last));
  }
  /** Convert an HTML string containing $...$ into HTML with math rendered. */
  Lab.texString = (s) => mapMath(String(s), (t) => t);
  const SKIP = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA', 'SVG', 'CANVAS']);
  /** Render every $...$ in text nodes under root. Safe to call repeatedly. */
  Lab.renderTex = function (root = document.body) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (!n.nodeValue || n.nodeValue.indexOf('$') < 0) return NodeFilter.FILTER_REJECT;
        let p = n.parentElement;
        while (p && p !== root) { if (SKIP.has(p.tagName) || p.classList.contains('katex')) return NodeFilter.FILTER_REJECT; p = p.parentElement; }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const todo = [];
    while (walker.nextNode()) todo.push(walker.currentNode);
    todo.forEach((n) => {
      // A text node holds literal text, so escape what sits around the math, and leave the math itself alone.
      const html = mapMath(n.nodeValue, (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
      const span = document.createElement('span');
      span.innerHTML = html;
      n.replaceWith(...span.childNodes);
    });
  };

  /* ---------- Form helpers ---------- */
  Lab.paintRange = function (input) {
    const min = +input.min || 0, max = +input.max || 100;
    input.style.setProperty('--fill', ((+input.value - min) / (max - min)) * 100 + '%');
  };
  function wireRanges() {
    Lab.$$('input[type="range"]').forEach((r) => {
      Lab.paintRange(r);
      r.addEventListener('input', () => Lab.paintRange(r));
    });
  }
  /** Bind a range to an output element and callback. fmt(value) returns the output text. */
  Lab.bind = function (input, out, fmt, onChange) {
    input = Lab.$(input); out = out ? Lab.$(out) : null;
    const update = () => {
      if (out) out.innerHTML = fmt ? fmt(+input.value) : input.value;
      if (input.type === 'range') Lab.paintRange(input);
      if (onChange) onChange(+input.value);
    };
    input.addEventListener('input', update);
    update();
    return input;
  };
  /** Segmented control: <div class="seg"><button data-value=...>. Returns {set, value}. */
  Lab.seg_ = null;
  Lab.segmented = function (el, onChange) {
    el = Lab.$(el);
    const btns = Lab.$$('button', el);
    const set = (v, fire = true) => {
      btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === v)));
      if (fire && onChange) onChange(v);
    };
    btns.forEach((b) => b.addEventListener('click', () => set(b.dataset.value)));
    return { set, get value() { const b = btns.find((x) => x.getAttribute('aria-pressed') === 'true'); return b ? b.dataset.value : null; } };
  };

  /* ---------- Canvas stage ----------
     A stage draws in fixed virtual coordinates (default 800 by 450), scaled to fit its box and
     the device pixel ratio. Text size is virtual too, so nothing below 20 virtual px, please.

     const s = Lab.stage('#canvas-or-host', { w, h, bg, draw(g, t, dt, s), animate, onPointer, drag });
     - draw is called each frame while the stage is on screen.
     - animate:false draws on demand: call s.redraw() after state changes.
     - onPointer(e): e.type is 'down', 'move', 'up' or 'hover'; e.x, e.y are virtual coordinates.
     - drag:true stops touch scrolling on the canvas (use only when the canvas needs dragging). */
  const allStages = [];
  Lab.stage = function (target, opts = {}) {
    target = Lab.$(target);
    let canvas = target;
    if (!target) throw new Error('Lab.stage: target not found');
    if (target.tagName !== 'CANVAS') { canvas = document.createElement('canvas'); target.appendChild(canvas); }
    const W = opts.w || 800, H = opts.h || 450;
    canvas.classList.add('stage-canvas');
    canvas.style.aspectRatio = `${W} / ${H}`;
    canvas.setAttribute('role', canvas.getAttribute('role') || 'img');
    if (opts.label) canvas.setAttribute('aria-label', opts.label);
    if (opts.drag) canvas.style.touchAction = 'none';
    const g = canvas.getContext('2d');
    const s = { canvas, g, W, H, t: 0, scale: 1, playing: opts.animate !== false && !Lab.reducedMotion, visible: false, data: {} };
    let raf = 0, last = 0;

    const fit = () => {
      const cssW = canvas.clientWidth || (canvas.parentElement && canvas.parentElement.clientWidth) || W;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const scale = cssW / W;
      const pw = Math.max(1, Math.round(cssW * dpr)), ph = Math.max(1, Math.round((cssW * H / W) * dpr));
      if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
      s.scale = scale; s.dpr = dpr;
      render(0);
    };
    canvas.dataset.vw = W;
    function render(dt) {
      if (window.__lint) window.__lint.begin(canvas);
      g.setTransform((canvas.width / W), 0, 0, (canvas.height / H), 0, 0);
      if (opts.bg !== 'none') {
        if (typeof opts.bg === 'function') opts.bg(g, W, H, s.t);
        else if (window.Art) window.Art.bg(g, W, H, opts.bg || 'micro', s.t);
      } else g.clearRect(0, 0, W, H);
      if (opts.draw) opts.draw(g, s.t, dt, s);
      if (window.__lint) window.__lint.end(canvas);
    }
    const frame = (now) => {
      raf = 0;
      if (!s.playing || !s.visible) return;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now; s.t += dt;
      render(dt);
      raf = requestAnimationFrame(frame);
    };
    const kick = () => { if (!raf && s.playing && s.visible) { last = 0; raf = requestAnimationFrame(frame); } };
    s.redraw = () => { if (!raf) render(0); };
    s.play = () => { s.playing = true; kick(); };
    s.pause = () => { s.playing = false; };
    s.fit = fit;
    /** Advance time by hand, used by screenshot tools. */
    s.advance = (secs) => { const steps = Math.ceil(secs / 0.033); for (let i = 0; i < steps; i++) { s.t += 0.033; render(0.033); } };

    new IntersectionObserver((es) => { s.visible = es[0].isIntersecting; if (s.visible) kick(); }, { threshold: 0.01 }).observe(canvas);
    new ResizeObserver(fit).observe(canvas);
    fit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => s.redraw());

    if (opts.onPointer) {
      const toV = (e) => {
        const r = canvas.getBoundingClientRect();
        return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H, raw: e };
      };
      let down = false;
      canvas.addEventListener('pointerdown', (e) => { down = true; try { canvas.setPointerCapture(e.pointerId); } catch (x) { /* synthetic event */ } opts.onPointer({ type: 'down', ...toV(e) }); s.redraw(); });
      canvas.addEventListener('pointermove', (e) => { opts.onPointer({ type: down ? 'move' : 'hover', ...toV(e) }); s.redraw(); });
      const up = (e) => { if (down) { down = false; opts.onPointer({ type: 'up', ...toV(e) }); s.redraw(); } };
      canvas.addEventListener('pointerup', up);
      canvas.addEventListener('pointercancel', up);
    }
    if (Lab.reducedMotion && opts.animate !== false && opts.playButton !== false) {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'stage-play';
      btn.innerHTML = Lab.icons.play + '<span>Play animation</span>';
      canvas.parentElement.appendChild(btn);
      btn.addEventListener('click', () => { if (s.playing) { s.pause(); btn.innerHTML = Lab.icons.play + '<span>Play animation</span>'; } else { s.play(); btn.innerHTML = Lab.icons.pause + '<span>Pause</span>'; } });
    }
    allStages.push(s);
    return s;
  };
  Lab._stages = allStages;

  /* ---------- Story player: learner-paced animated explanations ----------
     Lab.story('#host', {
       title: 'What is a mole?',
       w, h, bg,
       scenes: [{ say: 'One short caption. May use <b> and $math$.', speak: 'optional text for the voice',
                  dur: 3.5, draw(g, p, t, info) {...} }, ...]
     });
     draw must be a pure function of p (0..1 progress through this scene, eased by you) and
     t (seconds since scene start, keeps rising after p reaches 1, use it for idle motion).
     Scenes never rely on state left by earlier frames, so Back, Next and screenshots all work. */
  const allStories = [];
  const voice = {
    get on() { return Lab.store.get('voice', false); },
    set on(v) { Lab.store.set('voice', !!v); },
    available: 'speechSynthesis' in window,
  };
  const plain = (html) => {
    const d = document.createElement('div');
    d.innerHTML = String(html).replace(/\$[^$]*\$/g, ' ');
    return d.textContent.replace(/\s+/g, ' ').trim();
  };
  Lab.story = function (host, opts) {
    host = Lab.$(host);
    if (!host) throw new Error('Lab.story: host not found');
    const scenes = opts.scenes;
    const id = 'story' + allStories.length;
    host.classList.add('story');
    host.innerHTML = `
      <div class="story-head">
        <h3 class="story-title">${opts.title || ''}</h3>
        ${voice.available ? '<button class="story-voice icon-btn" type="button"></button>' : ''}
      </div>
      <div class="story-stage"><canvas></canvas></div>
      <p class="story-say" id="${id}-say" aria-live="polite"></p>
      <div class="story-bar">
        <button class="story-btn story-back" type="button" aria-label="Previous step">${Lab.icons.back}</button>
        <button class="story-btn story-play" type="button"></button>
        <div class="story-pips" role="group" aria-label="Jump to step">${scenes.map((_, i) => `<button type="button" class="story-pip" data-i="${i}" aria-label="Step ${i + 1} of ${scenes.length}"></button>`).join('')}</div>
        <button class="btn story-next" type="button"><span>Next</span>${Lab.icons.next}</button>
      </div>
      <details class="story-transcript"><summary>Read all the steps as text</summary><ol>${scenes.map((s) => `<li>${s.say}</li>`).join('')}</ol></details>`;
    Lab.renderTex(host.querySelector('.story-transcript'));
    const say = host.querySelector('.story-say');
    const backBtn = host.querySelector('.story-back');
    const playBtn = host.querySelector('.story-play');
    const nextBtn = host.querySelector('.story-next');
    const pips = Lab.$$('.story-pip', host);
    const voiceBtn = host.querySelector('.story-voice');

    let i = 0, sceneT = 0, autoPlay = false, speaking = false, holdT = 0, isPaused = false;
    const paused = () => isPaused;
    const stage = Lab.stage(host.querySelector('canvas'), {
      w: opts.w || 800, h: opts.h || 450, bg: opts.bg || 'micro', playButton: false,
      label: (opts.title ? opts.title + '. ' : '') + 'Animated illustration. The caption below describes each step.',
      draw(g, _t, dt, st) {
        const sc = scenes[i];
        if (!paused()) sceneT += dt;
        const dur = sc.dur || 3;
        const p = Lab.reducedMotion ? 1 : Lab.clamp(sceneT / dur);
        g.save();
        try { sc.draw(g, p, Lab.reducedMotion ? dur : sceneT, { W: st.W, H: st.H, i, n: scenes.length, stage: st }); }
        finally { g.restore(); }
        const finished = p >= 1;
        nextBtn.classList.toggle('is-ready', finished && i < scenes.length - 1);
        if (finished && autoPlay && !speaking && !paused()) {
          holdT += dt;
          if (holdT > (opts.hold || 1.4)) { if (i < scenes.length - 1) go(i + 1); else { autoPlay = false; paintPlay(); } }
        }
      },
    });
    function paintPlay() {
      const on = autoPlay && !paused();
      playBtn.innerHTML = on ? Lab.icons.pause : Lab.icons.play;
      playBtn.setAttribute('aria-label', on ? 'Pause' : 'Play all steps');
    }
    function speak(text) {
      if (!voice.available) return;
      speechSynthesis.cancel(); speaking = false;
      if (!voice.on || !stage.visible) return;
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1; speaking = true;
      u.onend = u.onerror = () => { speaking = false; };
      speechSynthesis.speak(u);
    }
    function go(n, settle) {
      i = Lab.clamp(n, 0, scenes.length - 1);
      const sc = scenes[i];
      sceneT = settle ? (sc.dur || 3) + 0.4 : 0;
      holdT = 0;
      say.innerHTML = Lab.texString(sc.say);
      pips.forEach((b, k) => { b.classList.toggle('is-on', k === i); b.classList.toggle('is-seen', k < i); });
      backBtn.disabled = i === 0;
      nextBtn.disabled = i === scenes.length - 1;
      nextBtn.classList.remove('is-ready');
      if (!settle) speak(sc.speak || plain(sc.say));
      stage.redraw();
    }
    backBtn.addEventListener('click', () => { autoPlay = false; isPaused = false; paintPlay(); go(i - 1); });
    nextBtn.addEventListener('click', () => { isPaused = false; paintPlay(); go(i + 1); });
    pips.forEach((b) => b.addEventListener('click', () => { autoPlay = false; isPaused = false; paintPlay(); go(+b.dataset.i); }));
    playBtn.addEventListener('click', () => {
      if (autoPlay && !paused()) { isPaused = true; if (voice.available) speechSynthesis.cancel(); }
      else {
        isPaused = false; autoPlay = true;
        if (i === scenes.length - 1 && sceneT >= (scenes[i].dur || 3)) go(0); else speak(scenes[i].speak || plain(scenes[i].say));
      }
      paintPlay();
    });
    if (voiceBtn) {
      const paintVoice = () => {
        voiceBtn.innerHTML = voice.on ? Lab.icons.voice : Lab.icons.voiceOff;
        voiceBtn.setAttribute('aria-label', voice.on ? 'Turn off read-aloud' : 'Read the steps aloud');
        voiceBtn.setAttribute('aria-pressed', String(voice.on));
        voiceBtn.title = voice.on ? 'Read-aloud is on' : 'Read the steps aloud';
      };
      paintVoice();
      voiceBtn.addEventListener('click', () => { voice.on = !voice.on; paintVoice(); document.dispatchEvent(new Event('lab:voice')); if (voice.on) speak(scenes[i].speak || plain(scenes[i].say)); else speechSynthesis.cancel(); });
      document.addEventListener('lab:voice', paintVoice);
    }
    // Keyboard: left and right arrows step when focus is in the story.
    host.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); }
    });
    paintPlay();
    const api = { host, stage, scenes, go: (n, settle = true) => go(n, settle), get index() { return i; }, render() { stage.redraw(); } };
    allStories.push(api);
    // Renders once KaTeX is present; scripts are deferred so it is already loaded.
    go(0);
    return api;
  };
  Lab._stories = allStories;

  /* ---------- Moe: inject the mascot into [data-moe] slots ---------- */
  function placeMoe(root = document) {
    if (!window.Moe) return;
    Lab.$$('[data-moe]', root).forEach((el) => {
      if (el.dataset.moeDone) return;
      el.dataset.moeDone = '1';
      el.innerHTML = window.Moe.svg(el.dataset.moe || 'happy');
    });
  }
  Lab.placeMoe = placeMoe;

  /* ---------- Reveal-a-step worked examples ----------
     <div class="worked"><ol><li>step</li>...</ol></div> becomes one-at-a-time steps. */
  function buildWorked() {
    Lab.$$('.worked').forEach((w) => {
      if (w.dataset.built) return;
      w.dataset.built = '1';
      const steps = Lab.$$(':scope > ol > li', w);
      if (!steps.length) return;
      steps.forEach((s, i) => { if (i > 0) s.hidden = true; });
      const bar = document.createElement('div');
      bar.className = 'worked-bar';
      bar.innerHTML = '<button type="button" class="btn ghost small worked-next">Show next step</button><button type="button" class="linkish worked-all">Show all</button>';
      w.appendChild(bar);
      const next = bar.querySelector('.worked-next');
      const all = bar.querySelector('.worked-all');
      const finish = () => { bar.hidden = true; };
      next.addEventListener('click', () => {
        const h = steps.find((s) => s.hidden);
        if (h) { h.hidden = false; h.classList.add('just-in'); Lab.sound.pop(); }
        if (!steps.some((s) => s.hidden)) finish();
      });
      all.addEventListener('click', () => { steps.forEach((s) => (s.hidden = false)); finish(); });
      if (steps.length === 1) finish();
    });
  }
  Lab.buildWorked = buildWorked;

  /* ---------- Init ---------- */
  const readyFns = [];
  let isReady = false;
  /** Run page code after the shared chrome is in place. */
  Lab.ready = (fn) => { if (isReady) fn(); else readyFns.push(fn); };

  function init() {
    buildHeader();
    buildRail();
    buildLessonParts();
    buildFooter();
    placeMoe();
    refreshProgress();
    refreshCollection();
    wireRanges();
    buildWorked();
    isReady = true;
    readyFns.forEach((fn) => {
      try { fn(); } catch (e) { console.error(e); }
    });
    if (window.Bank) window.Bank.mountAll();
    placeMoe();
    Lab.renderTex(document.getElementById('main') || document.body);
    wireRanges();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
