/* Question bank for 5.2 Solubility rules, plus window.Solubility: the one and only copy of the rules.
   The grid, the speed game, every practice problem here and the precipitation lesson's lab all
   ask this file, so they cannot disagree.

     Solubility.isSoluble('Ag', 'Cl')  => { formula, name, status, soluble, slight, rule, exception, reason, note, color, colorName, solutionColor }
     Solubility.lookup('AgCl')         => the same, found by formula
     Solubility.mix(saltA, saltB)      => molecular, complete ionic and net ionic equations, checked for atoms and charge
     Solubility.drawIon(g, x, y, r, id, opts)  draws any ion on a canvas (needs Art at call time)

   status is 'soluble', 'slight' or 'insoluble'. 'slight' covers the borderline compounds that tables disagree on. */
(function () {
  'use strict';
  const S = (window.Solubility = {});
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);

  /* ---------- The ions ---------- */
  const cat = (id, f, z, name, kind, extra) => Object.assign({ id, f, z, name, kind, type: 'cation', poly: false }, extra);
  const an = (id, f, z, name, kind, extra) => Object.assign({ id, f, z, name, kind, type: 'anion', poly: false }, extra);
  S.cations = [
    cat('Li', 'Li', 1, 'lithium', 'group1', { size: 0.8 }),
    cat('Na', 'Na', 1, 'sodium', 'group1', { size: 0.88 }),
    cat('K', 'K', 1, 'potassium', 'group1', { size: 1.0 }),
    cat('NH4', 'NH4', 1, 'ammonium', 'ammonium', { poly: true, size: 1.08 }),
    cat('Mg', 'Mg', 2, 'magnesium', 'group2', { size: 0.78 }),
    cat('Ca', 'Ca', 2, 'calcium', 'group2', { size: 0.88 }),
    cat('Sr', 'Sr', 2, 'strontium', 'group2', { size: 0.94 }),
    cat('Ba', 'Ba', 2, 'barium', 'group2', { size: 1.0 }),
    cat('Al', 'Al', 3, 'aluminum', 'metal', { size: 0.72 }),
    cat('Mn', 'Mn', 2, 'manganese(II)', 'metal', { size: 0.82, solution: '#F2CFE0' }),
    cat('Fe2', 'Fe', 2, 'iron(II)', 'metal', { size: 0.8, solution: '#BFE7B6' }),
    cat('Fe3', 'Fe', 3, 'iron(III)', 'metal', { size: 0.74, solution: '#E8AE3C' }),
    cat('Ni', 'Ni', 2, 'nickel', 'metal', { size: 0.76, solution: '#4FCB8A' }),
    cat('Cu', 'Cu', 2, 'copper(II)', 'metal', { size: 0.76, solution: '#2A86E8' }),
    cat('Zn', 'Zn', 2, 'zinc', 'metal', { size: 0.78 }),
    cat('Ag', 'Ag', 1, 'silver', 'grump', { size: 0.94 }),
    cat('Hg2', 'Hg2', 2, 'mercury(I)', 'grump', { poly: true, size: 1.06 }),
    cat('Pb', 'Pb', 2, 'lead(II)', 'grump', { size: 0.96 }),
  ];
  S.anions = [
    an('NO3', 'NO3', -1, 'nitrate', 'always', { poly: true, size: 1.08 }),
    an('C2H3O2', 'C2H3O2', -1, 'acetate', 'always', { poly: true, size: 1.16 }),
    an('ClO3', 'ClO3', -1, 'chlorate', 'always', { poly: true, size: 1.12 }),
    an('ClO4', 'ClO4', -1, 'perchlorate', 'always', { poly: true, size: 1.18 }),
    an('Cl', 'Cl', -1, 'chloride', 'halide', { size: 1.1 }),
    an('Br', 'Br', -1, 'bromide', 'halide', { size: 1.16 }),
    an('I', 'I', -1, 'iodide', 'halide', { size: 1.26 }),
    an('SO4', 'SO4', -2, 'sulfate', 'sulfate', { poly: true, size: 1.18 }),
    an('CO3', 'CO3', -2, 'carbonate', 'cops', { poly: true, size: 1.1 }),
    an('PO4', 'PO4', -3, 'phosphate', 'cops', { poly: true, size: 1.18 }),
    an('S', 'S', -2, 'sulfide', 'cops', { size: 1.1 }),
    an('OH', 'OH', -1, 'hydroxide', 'hydroxide', { poly: true, size: 0.98 }),
  ];
  const byId = {};
  S.cations.concat(S.anions).forEach((i) => { byId[i.id] = i; });
  S.ion = (id) => (typeof id === 'string' ? byId[id] : id);

  /** Ion as text that both mhchem and Art.formula understand: 'Ca^2+', 'SO4^2-', 'Ag^+'. */
  S.ionText = function (id) {
    const i = S.ion(id), n = Math.abs(i.z);
    return `${i.f}^${n > 1 ? n : ''}${i.z > 0 ? '+' : '-'}`;
  };
  /** The charge alone, as Art.atom wants it: '+', '2+', '-', '3-'. */
  S.chargeText = function (id) {
    const i = S.ion(id), n = Math.abs(i.z);
    return `${n > 1 ? n : ''}${i.z > 0 ? '+' : '-'}`;
  };
  /** Ion as a TeX string: $\ce{SO4^2-}$. */
  S.ionTex = (id) => `$\\ce{${S.ionText(id)}}$`;
  /** Formula with sub and sup tags, for plain HTML where KaTeX would be too heavy (the grid has 216 cells). */
  S.html = function (f) {
    return String(f)
      .replace(/\^([0-9]*)([+-])/g, (_, n, s) => `<sup>${n}${s === '-' ? '−' : '+'}</sup>`)
      .replace(/([A-Za-z)\]])(\d+)/g, '$1<sub>$2</sub>');
  };

  /** The neutral formula from the charges: cations and anions must cancel. */
  S.units = function (c, a) {
    c = S.ion(c); a = S.ion(a);
    const g = gcd(c.z, -a.z);
    return { nc: -a.z / g, na: c.z / g };
  };
  S.formula = function (c, a) {
    c = S.ion(c); a = S.ion(a);
    const { nc, na } = S.units(c, a);
    const cs = nc > 1 ? (c.poly ? `(${c.f})${nc}` : `${c.f}${nc}`) : c.f;
    const as = na > 1 ? (a.poly ? `(${a.f})${na}` : `${a.f}${na}`) : a.f;
    return cs + as;
  };

  /* ---------- The rules, in the order you ask them. The first rule that matches decides. ---------- */
  S.tiers = {
    always: { title: 'Always soluble', color: '#2FD6F2' },
    usually: { title: 'Usually soluble', color: '#3DDC84' },
    rarely: { title: 'Usually insoluble', color: '#FF8A2B' },
  };
  S.rules = [
    {
      id: 'r1', n: 1, tier: 'always', short: 'Group 1 and ammonium',
      title: 'Group 1 ions and ammonium',
      say: 'Check the cation first. $\\ce{Li+}$, $\\ce{Na+}$, $\\ce{K+}$ and $\\ce{NH4+}$ dissolve with everything. This rule beats every other rule.',
    },
    {
      id: 'r2', n: 2, tier: 'always', short: 'Nitrate, acetate, chlorate, perchlorate',
      title: 'Nitrate, acetate, chlorate and perchlorate',
      say: 'These big anions with a charge of only 1− dissolve with every cation. Silver and mercury(I) acetate sit near the borderline, so they are marked.',
    },
    {
      id: 'r3', n: 3, tier: 'usually', short: 'Chloride, bromide, iodide',
      title: 'Chlorides, bromides and iodides',
      say: 'Halides dissolve, except with the grumpy three: $\\ce{Ag+}$, $\\ce{Pb^2+}$ and $\\ce{Hg2^2+}$.',
    },
    {
      id: 'r4', n: 4, tier: 'usually', short: 'Sulfate',
      title: 'Sulfates',
      say: 'Sulfates dissolve, except with $\\ce{Ba^2+}$, $\\ce{Sr^2+}$, $\\ce{Pb^2+}$ and $\\ce{Hg2^2+}$. $\\ce{Ca^2+}$ and $\\ce{Ag+}$ are only slightly soluble.',
    },
    {
      id: 'r5', n: 5, tier: 'rarely', short: 'Carbonate, phosphate, sulfide',
      title: 'Carbonates, phosphates and sulfides',
      say: 'These stay solid unless rule 1 rescues them. Tables disagree on the sulfides of $\\ce{Ca^2+}$, $\\ce{Sr^2+}$ and $\\ce{Ba^2+}$, so they are marked.',
    },
    {
      id: 'r6', n: 6, tier: 'rarely', short: 'Hydroxide',
      title: 'Hydroxides',
      say: 'These stay solid unless rule 1 rescues them. $\\ce{Ba(OH)2}$ dissolves well, while $\\ce{Ca(OH)2}$ and $\\ce{Sr(OH)2}$ dissolve only slightly.',
    },
  ];
  S.rule = (id) => S.rules.find((r) => r.id === id);

  /* The exception lists, kept as data so the words on the page and the code cannot drift apart. */
  const HALIDE_NO = ['Ag', 'Pb', 'Hg2'];
  const SULFATE_NO = ['Ba', 'Sr', 'Pb', 'Hg2'];
  const SULFATE_SLIGHT = ['Ca', 'Ag'];
  const HYDROXIDE_SLIGHT = ['Ca', 'Sr'];
  const HYDROXIDE_YES = ['Ba'];
  const SULFIDE_SLIGHT = ['Ca', 'Sr', 'Ba'];
  const ACETATE_SLIGHT = ['Ag', 'Hg2'];
  S.exceptions = { halide: HALIDE_NO, sulfate: SULFATE_NO, sulfateSlight: SULFATE_SLIGHT, hydroxideSlight: HYDROXIDE_SLIGHT, hydroxideYes: HYDROXIDE_YES, sulfideSlight: SULFIDE_SLIGHT, acetateSlight: ACETATE_SLIGHT };

  const plural = { nitrate: 'Nitrates', acetate: 'Acetates', chlorate: 'Chlorates', perchlorate: 'Perchlorates', chloride: 'Chlorides', bromide: 'Bromides', iodide: 'Iodides', sulfate: 'Sulfates', carbonate: 'Carbonates', phosphate: 'Phosphates', sulfide: 'Sulfides', hydroxide: 'Hydroxides' };
  const ce = (id) => S.ionTex(id);

  function decide(c, a) {
    const P = plural[a.name], low = P.toLowerCase();
    if (c.kind === 'group1' || c.kind === 'ammonium') {
      const who = c.kind === 'group1' ? `${ce(c)} is a group 1 ion` : `${ce(c)} is ammonium`;
      if (c.id === 'Li' && a.id === 'PO4') {
        return { rule: 'r1', status: 'slight', exception: true, reason: `${who}, so rule 1 says it dissolves. Lithium phosphate is the one real crack in that rule: only about 0.003 M dissolves. On an exam, follow your table.` };
      }
      const even = (a.kind === 'cops' || a.kind === 'hydroxide') ? `, even with ${a.name}` : '';
      return { rule: 'r1', status: 'soluble', reason: `${who}. Rule 1 beats everything${even}, so it dissolves.` };
    }
    if (a.kind === 'always') {
      if (a.id === 'C2H3O2' && ACETATE_SLIGHT.includes(c.id)) {
        return { rule: 'r2', status: 'slight', exception: true, reason: `Acetates are almost always soluble, but ${ce(c)} is near the borderline. Silver acetate reaches only about 0.06 M, so some tables call it slightly soluble.` };
      }
      const even = c.kind === 'grump' ? ` Even ${ce(c)} cannot stop it.` : '';
      return { rule: 'r2', status: 'soluble', reason: `${P} dissolve with every cation.${even}` };
    }
    if (a.kind === 'halide') {
      if (HALIDE_NO.includes(c.id)) return { rule: 'r3', status: 'insoluble', exception: true, reason: `${P} usually dissolve, but ${ce(c)} is one of the three exceptions (${ce('Ag')}, ${ce('Pb')}, ${ce('Hg2')}). It stays solid.` };
      return { rule: 'r3', status: 'soluble', reason: `${P} usually dissolve, and ${ce(c)} is not one of the three exceptions (${ce('Ag')}, ${ce('Pb')}, ${ce('Hg2')}).` };
    }
    if (a.kind === 'sulfate') {
      if (SULFATE_NO.includes(c.id)) return { rule: 'r4', status: 'insoluble', exception: true, reason: `Sulfates usually dissolve, but ${ce(c)} is an exception (${ce('Ba')}, ${ce('Sr')}, ${ce('Pb')}, ${ce('Hg2')}). It stays solid.` };
      if (SULFATE_SLIGHT.includes(c.id)) return { rule: 'r4', status: 'slight', exception: true, reason: `Sulfates usually dissolve, but ${ce(c)} is on the borderline. Most tables call this slightly soluble, and some call it insoluble.` };
      return { rule: 'r4', status: 'soluble', reason: `Sulfates usually dissolve, and ${ce(c)} is not one of the exceptions (${ce('Ba')}, ${ce('Sr')}, ${ce('Pb')}, ${ce('Hg2')}, with ${ce('Ca')} and ${ce('Ag')} only slight).` };
    }
    if (a.kind === 'cops') {
      if (a.id === 'S' && SULFIDE_SLIGHT.includes(c.id)) return { rule: 'r5', status: 'slight', exception: true, reason: `Sulfides are usually insoluble, but tables differ on ${ce(c)}. Many list it as an exception, others do not, and in water it reacts rather than simply dissolving.` };
      return { rule: 'r5', status: 'insoluble', reason: `${P} are usually insoluble. Only group 1 and ammonium rescue them, and ${ce(c)} is neither.` };
    }
    // Hydroxide.
    if (HYDROXIDE_YES.includes(c.id)) return { rule: 'r6', status: 'soluble', exception: true, reason: `Hydroxides are usually insoluble, but ${ce(c)} is an exception. Barium hydroxide dissolves well enough to count as a strong base.` };
    if (HYDROXIDE_SLIGHT.includes(c.id)) return { rule: 'r6', status: 'slight', exception: true, reason: `Hydroxides are usually insoluble, but ${ce(c)} dissolves a little. Most tables call this slightly soluble, and some say moderately.` };
    return { rule: 'r6', status: 'insoluble', reason: `Hydroxides are usually insoluble. Only group 1, ammonium, and to some degree $\\ce{Ca^2+}$, $\\ce{Sr^2+}$, $\\ce{Ba^2+}$ escape, and ${ce(c)} does not.` };
  }

  /* ---------- Real colors of the solids, where well known. Key: cation|anion. ---------- */
  const COL = {
    white: ['#F4F2EC', 'white'], cream: ['#F1E5BC', 'cream'], paleYellow: ['#F4E58A', 'pale yellow'], yellow: ['#F2DC55', 'yellow'],
    gold: ['#FFCF1F', 'bright yellow'], black: ['#26252B', 'black'], brown: ['#6E4225', 'dark brown'], rust: ['#B5502A', 'rust brown'],
    paleBlue: ['#79C2EE', 'pale blue'], blueGreen: ['#4FB5A5', 'blue-green'], green: ['#58C27D', 'green'], paleGreen: ['#C2E5B6', 'pale green'],
    palePink: ['#F3CBD3', 'pale pink'], salmon: ['#F0A58F', 'salmon pink'], tan: ['#C9A66B', 'yellow-tan'], yellowGreen: ['#CFD86A', 'yellow-green'],
    offWhite: ['#E4E6E2', 'off-white'],
  };
  const SOLID_COLORS = {
    'Ag|Cl': 'white', 'Ag|Br': 'cream', 'Ag|I': 'yellow', 'Ag|SO4': 'white', 'Ag|CO3': 'paleYellow', 'Ag|PO4': 'yellow', 'Ag|S': 'black', 'Ag|OH': 'brown', 'Ag|C2H3O2': 'white',
    'Pb|Cl': 'white', 'Pb|Br': 'white', 'Pb|I': 'gold', 'Pb|SO4': 'white', 'Pb|CO3': 'white', 'Pb|PO4': 'white', 'Pb|S': 'black', 'Pb|OH': 'white',
    'Hg2|Cl': 'white', 'Hg2|Br': 'cream', 'Hg2|I': 'yellowGreen', 'Hg2|SO4': 'white', 'Hg2|CO3': 'tan', 'Hg2|PO4': 'white', 'Hg2|S': 'black', 'Hg2|OH': 'black', 'Hg2|C2H3O2': 'white',
    'Mn|CO3': 'palePink', 'Mn|PO4': 'palePink', 'Mn|S': 'salmon', 'Mn|OH': 'palePink',
    'Fe2|CO3': 'paleGreen', 'Fe2|PO4': 'offWhite', 'Fe2|S': 'black', 'Fe2|OH': 'paleGreen',
    'Fe3|CO3': 'rust', 'Fe3|PO4': 'paleYellow', 'Fe3|S': 'black', 'Fe3|OH': 'rust',
    'Ni|CO3': 'paleGreen', 'Ni|PO4': 'paleGreen', 'Ni|S': 'black', 'Ni|OH': 'green',
    'Cu|CO3': 'blueGreen', 'Cu|PO4': 'paleBlue', 'Cu|S': 'black', 'Cu|OH': 'paleBlue',
  };
  /* Cells where the simple rule is right about "not dissolving" but real chemistry goes further.
     note: shown wherever the cell is explained. real: the solid that actually forms. */
  const NOTES = {
    'NH4|OH': { note: 'There is no solid to buy here. This is really ammonia in water, $\\ce{NH3 + H2O}$, often written $\\ce{NH4OH}$.', skipGame: true },
    'Ag|OH': { note: 'Silver hydroxide does not last. It turns straight into dark brown silver oxide, $\\ce{Ag2O}$.', skipGame: true },
    'Hg2|OH': { note: 'This does not last either. Mercury(I) and hydroxide give a black mix of $\\ce{HgO}$ and $\\ce{Hg}$.', skipGame: true },
    'Hg2|S': { note: 'This falls apart at once into black $\\ce{HgS}$ and $\\ce{Hg}$.', skipGame: true },
    'Mg|S': { note: 'Magnesium sulfide reacts with water, giving $\\ce{Mg(OH)2}$ and $\\ce{H2S}$, rather than sitting there as $\\ce{MgS}$.', skipGame: true },
    'Al|S': { note: 'This cannot sit in water. It reacts to give white $\\ce{Al(OH)3}$ and $\\ce{H2S}$ gas.', skipGame: true },
    'Fe3|S': { note: 'This does not last in water. Iron(III) oxidizes sulfide, leaving black $\\ce{FeS}$ and sulfur.', skipGame: true },
    'Al|CO3': { note: 'This cannot sit in water. It reacts to give white $\\ce{Al(OH)3}$ and bubbles of $\\ce{CO2}$.', skipGame: true },
    'Fe3|CO3': { note: 'This cannot sit in water. It reacts to give rust brown $\\ce{Fe(OH)3}$ and bubbles of $\\ce{CO2}$.', skipGame: true },
    'Cu|I': { note: 'The rule says soluble, but a redox reaction sneaks in. $\\ce{Cu^2+}$ and $\\ce{I-}$ give white solid $\\ce{CuI}$, stained tan by brown $\\ce{I2}$.', skipGame: true },
    'Fe3|I': { note: 'The rule says soluble, but a redox reaction sneaks in. $\\ce{Fe^3+}$ and $\\ce{I-}$ give $\\ce{Fe^2+}$ and brown $\\ce{I2}$.', skipGame: true },
    'Pb|Cl': { note: 'The least stubborn exception: about 0.04 M dissolves in cold water, and it dissolves well in hot water. Every table still lists it as an exception.' },
    'Pb|Br': { note: 'Like $\\ce{PbCl2}$, this dissolves noticeably in hot water.' },
    'K|ClO4': { note: 'Potassium perchlorate is one of the least soluble "soluble" salts, at about 0.1 M. That is still far above the cutoff.' },
    'Ba|OH': { note: 'About 0.2 M at room temperature. Some tables say moderately soluble.' },
    'Ca|OH': { note: 'About 0.02 M. Limewater is exactly this solution.' },
    'Ca|SO4': { note: 'About 0.015 M. Gypsum and plaster are this compound.' },
    'Ag|SO4': { note: 'About 0.03 M.' },
    'Ba|SO4': { note: 'So insoluble that doctors have patients drink it for X-rays. Free $\\ce{Ba^2+}$ is toxic, but almost none dissolves.' },
    'Ca|CO3': { note: 'This is limestone, chalk and seashells.' },
    'Zn|S': { note: 'A rare white sulfide. Most other sulfides on this grid are black.' },
    'Mn|S': { note: 'A rare pink sulfide. Most other sulfides on this grid are black.' },
  };

  /** The one function everything calls. Ion ids or ion objects. */
  S.isSoluble = function (cation, anion) {
    const c = S.ion(cation), a = S.ion(anion);
    if (!c || !a) throw new Error('Unknown ion in isSoluble: ' + cation + ', ' + anion);
    const d = decide(c, a);
    const key = c.id + '|' + a.id;
    const extra = NOTES[key] || {};
    const solid = d.status === 'soluble' ? null : COL[SOLID_COLORS[key] || 'white'];
    return {
      cation: c, anion: a, key,
      formula: S.formula(c, a),
      name: `${c.name} ${a.name}`,
      status: d.status,
      soluble: d.status === 'soluble',
      slight: d.status === 'slight',
      insoluble: d.status === 'insoluble',
      rule: d.rule,
      exception: !!d.exception,
      reason: d.reason,
      note: extra.note || '',
      inGame: !extra.skipGame && d.status !== 'slight',
      color: solid ? solid[0] : null,
      colorName: solid ? solid[1] : null,
      solutionColor: c.solution || null,
    };
  };
  /** Every cell, rows then columns. */
  S.all = function () {
    const out = [];
    S.cations.forEach((c) => S.anions.forEach((a) => out.push(S.isSoluble(c, a))));
    return out;
  };
  const index = {};
  S.lookup = function (formula) {
    if (!Object.keys(index).length) S.all().forEach((r) => { index[r.formula] = r; });
    return index[formula] || null;
  };

  /* ---------- Mixing two solutions: equations computed from the charges, then checked ---------- */
  /** Solutions on the shelf of the precipitation lab. Every one of them is a soluble salt according to the rules. */
  S.reagents = [
    ['Ag', 'NO3'], ['Pb', 'NO3'], ['Ba', 'Cl'], ['Ca', 'Cl'], ['Cu', 'SO4'], ['Fe3', 'Cl'], ['Ni', 'Cl'], ['Zn', 'SO4'], ['Al', 'NO3'],
    ['Na', 'Cl'], ['K', 'I'], ['Na', 'SO4'], ['Na', 'CO3'], ['Na', 'PO4'], ['Na', 'OH'], ['Na', 'S'], ['K', 'NO3'], ['NH4', 'Cl'],
  ].map(([c, a]) => ({ c, a, id: S.formula(c, a), formula: S.formula(c, a), name: `${S.ion(c).name} ${S.ion(a).name}` }));

  /** Atoms in a formula, with no dependency on the bank runtime. Handles (Hg2)3(PO4)2. */
  S.countAtoms = function (f) {
    const stack = [{}];
    const re = /([A-Z][a-z]?)(\d*)|(\()|(\))(\d*)/g;
    let m;
    while ((m = re.exec(f))) {
      if (m[1]) { const top = stack[stack.length - 1]; top[m[1]] = (top[m[1]] || 0) + (m[2] ? +m[2] : 1); }
      else if (m[3]) stack.push({});
      else { const inner = stack.pop(), k = m[5] ? +m[5] : 1, top = stack[stack.length - 1]; for (const e in inner) top[e] = (top[e] || 0) + inner[e] * k; }
    }
    return stack[0];
  };
  /* A term is { n, f, phase, z } where f is the formula without charge, z the charge. */
  const term = (n, f, phase, z = 0) => ({ n, f, phase, z });
  const ionTerm = (n, id, phase = 'aq') => { const i = S.ion(id); return { n, f: i.f, phase, z: i.z, ion: i.id, ionText: S.ionText(i) }; };
  S.termText = function (t, withPhase = true) {
    const body = t.ionText || t.f;
    return `${t.n > 1 ? t.n : ''}${body}${withPhase ? `(${t.phase})` : ''}`;
  };
  /** Text for mhchem or Art.formula: '2Ag^+(aq) + SO4^2-(aq) -> Ag2SO4(s)'. */
  S.sideText = (terms, withPhase = true) => terms.map((t) => S.termText(t, withPhase)).join(' + ');
  S.eqText = (eq, withPhase = true) => `${S.sideText(eq.left, withPhase)} -> ${S.sideText(eq.right, withPhase)}`;
  /** The same equation as separate pieces of math, so a long one can wrap on a narrow screen. */
  S.eqTex = function (eq, withPhase = true) {
    const side = (terms) => terms.map((t) => `$\\ce{${S.termText(t, withPhase)}}$`).join(' + ');
    return `${side(eq.left)} $\\rightarrow$ ${side(eq.right)}`;
  };
  /** Balance check: atoms and total charge on both sides. Returns { ok, atoms, charge, leftCharge, rightCharge }. */
  S.checkEq = function (eq) {
    const tally = (side) => {
      const atoms = {}; let charge = 0;
      side.forEach((t) => {
        const c = S.countAtoms(t.f);
        for (const e in c) atoms[e] = (atoms[e] || 0) + c[e] * t.n;
        charge += t.z * t.n;
      });
      return { atoms, charge };
    };
    const L = tally(eq.left), R = tally(eq.right);
    const keys = new Set(Object.keys(L.atoms).concat(Object.keys(R.atoms)));
    let atoms = true;
    keys.forEach((k) => { if ((L.atoms[k] || 0) !== (R.atoms[k] || 0)) atoms = false; });
    return { ok: atoms && L.charge === R.charge, atoms, charge: L.charge === R.charge, leftCharge: L.charge, rightCharge: R.charge };
  };

  /* What a real flask does when the plain rules are not the whole story. Key: 'cation|anion' of the pair that meets. */
  const REAL_FLASK = {
    'Fe3|CO3': { say: 'In a real flask, iron(III) carbonate never forms. You get rust brown $\\ce{Fe(OH)3}$ and bubbles: $\\ce{2Fe^3+(aq) + 3CO3^2-(aq) + 3H2O(l) -> 2Fe(OH)3(s) + 3CO2(g)}$.', color: 'rust', bubbles: true },
    'Al|CO3': { say: 'In a real flask, aluminum carbonate never forms. You get white $\\ce{Al(OH)3}$ and bubbles: $\\ce{2Al^3+(aq) + 3CO3^2-(aq) + 3H2O(l) -> 2Al(OH)3(s) + 3CO2(g)}$.', color: 'white', bubbles: true },
    'Al|S': { say: 'In a real flask, aluminum sulfide never forms. You get white $\\ce{Al(OH)3}$ and smelly gas: $\\ce{2Al^3+(aq) + 3S^2-(aq) + 6H2O(l) -> 2Al(OH)3(s) + 3H2S(g)}$.', color: 'white', bubbles: true },
    'Fe3|S': { say: 'In a real flask, iron(III) oxidizes sulfide, so you get black $\\ce{FeS}$ and sulfur: $\\ce{2Fe^3+(aq) + 3S^2-(aq) -> 2FeS(s) + S(s)}$.', color: 'black' },
    'Cu|I': { say: 'The rules predict no precipitate, but a redox reaction sneaks in: $\\ce{2Cu^2+(aq) + 4I^-(aq) -> 2CuI(s) + I2(aq)}$. A real flask turns muddy brown. Lesson 5.5 explains why.', tint: '#9A6A2A', murky: true },
    'Fe3|I': { say: 'The rules predict no precipitate, but a redox reaction sneaks in: $\\ce{2Fe^3+(aq) + 2I^-(aq) -> 2Fe^2+(aq) + I2(aq)}$. A real flask turns brown. Lesson 5.5 explains why.', tint: '#9A6A2A' },
    'NH4|OH': { say: 'No solid forms, but this is not really "no reaction". Ammonium and hydroxide make ammonia, which you can smell: $\\ce{NH4+(aq) + OH^-(aq) -> NH3(aq) + H2O(l)}$. Lesson 5.4 explains why.' },
  };
  /* How a borderline solid behaves at about 0.1 M, which is what a teaching lab would use. */
  const SLIGHT_SHOWS = { 'Ca|SO4': true, 'Ag|SO4': true, 'Ca|OH': true };

  /**
   * Mix two reagents. Returns { same, kind:'none'|'precip'|'slight', pairs, molecular, complete, net, spectators, solids, particles, real }.
   * Coefficients come from the charges: each cation brings Q units of positive charge, each anion Q units of negative.
   */
  S.mix = function (A, B) {
    const c1 = S.ion(A.c), a1 = S.ion(A.a), c2 = S.ion(B.c), a2 = S.ion(B.a);
    const r = { A, B, same: A.c === B.c && A.a === B.a };
    if (r.same) { r.kind = 'none'; r.pairs = []; r.solids = []; r.spectators = []; return r; }
    const P1 = S.isSoluble(c1, a2), P2 = S.isSoluble(c2, a1);
    r.pairs = [P1, P2];
    r.shareIon = c1.id === c2.id || a1.id === a2.id;
    const uA = S.units(c1, a1), uB = S.units(c2, a2), uP1 = S.units(c1, a2), uP2 = S.units(c2, a1);
    const chA = uA.nc * c1.z, chB = uB.nc * c2.z, chP1 = uP1.nc * c1.z, chP2 = uP2.nc * c2.z;
    const Q = lcm(lcm(chA, chB), lcm(chP1, chP2));
    let nA = Q / chA, nB = Q / chB, nP1 = Q / chP1, nP2 = Q / chP2;
    const g = gcd(gcd(gcd(nA, nB), nP1), nP2);
    nA /= g; nB /= g; nP1 /= g; nP2 /= g;
    // Silver hydroxide really forms Ag2O + H2O, which needs an even number of AgOH.
    const needsOxide = (p) => p.key === 'Ag|OH';
    if ((needsOxide(P1) && nP1 % 2) || (needsOxide(P2) && nP2 % 2)) { nA *= 2; nB *= 2; nP1 *= 2; nP2 *= 2; }

    const phaseOf = (p) => (p.soluble ? 'aq' : 's');
    const solidsNow = [P1, P2].filter((p) => !p.soluble);
    r.solids = solidsNow;
    // Lists used by the ion swarm: how many of each ion to draw per reaction.
    r.counts = { c1: nA * uA.nc, a1: nA * uA.na, c2: nB * uB.nc, a2: nB * uB.na };

    // A shared ion means the same two compounds on both sides: nothing to swap.
    if (r.shareIon) {
      r.kind = 'none';
      r.solids = [];
      r.spectators = [c1, a1, c2, a2].filter((v, i, l) => l.findIndex((x) => x.id === v.id) === i);
      return r;
    }
    const splitSalt = (n, c, a) => { const u = S.units(c, a); return [ionTerm(n * u.nc, c.id), ionTerm(n * u.na, a.id)]; };
    const prodTerms = (n, p) => {
      if (p.key === 'Ag|OH') return [term(n / 2, 'Ag2O', 's'), term(n / 2, 'H2O', 'l')];
      return [term(n, p.formula, phaseOf(p))];
    };
    r.molecular = {
      left: [term(nA, A.formula || S.formula(c1, a1), 'aq'), term(nB, B.formula || S.formula(c2, a2), 'aq')],
      right: prodTerms(nP1, P1).concat(prodTerms(nP2, P2)),
    };
    r.complete = {
      left: splitSalt(nA, c1, a1).concat(splitSalt(nB, c2, a2)),
      right: (P1.soluble ? splitSalt(nP1, c1, a2) : prodTerms(nP1, P1)).concat(P2.soluble ? splitSalt(nP2, c2, a1) : prodTerms(nP2, P2)),
    };
    const rightIons = {};
    r.complete.right.forEach((t) => { if (t.ion) rightIons[t.ion] = (rightIons[t.ion] || 0) + t.n; });
    r.spectators = [];
    const netLeft = [];
    r.complete.left.forEach((t) => {
      const cancel = Math.min(t.n, rightIons[t.ion] || 0);
      if (cancel > 0) { r.spectators.push(S.ion(t.ion)); rightIons[t.ion] -= cancel; }
      if (t.n - cancel > 0) netLeft.push(Object.assign({}, t, { n: t.n - cancel }));
    });
    const netRight = [];
    r.complete.right.forEach((t) => {
      if (!t.ion) { netRight.push(Object.assign({}, t)); return; }
      const left = rightIons[t.ion] || 0;
      if (left > 0) { netRight.push(Object.assign({}, t, { n: left })); rightIons[t.ion] = 0; }
    });
    if (netLeft.length === 0) {
      r.kind = 'none';
      r.solids = [];
      r.net = null;
    } else {
      const k = netLeft.concat(netRight).reduce((acc, t) => gcd(acc, t.n), 0);
      r.net = { left: netLeft.map((t) => Object.assign({}, t, { n: t.n / k })), right: netRight.map((t) => Object.assign({}, t, { n: t.n / k })) };
      const anyFull = solidsNow.some((p) => p.insoluble);
      r.kind = anyFull ? 'precip' : 'slight';
      r.hazy = !anyFull && solidsNow.some((p) => SLIGHT_SHOWS[p.key]);
    }
    r.checks = {
      molecular: S.checkEq(r.molecular),
      complete: S.checkEq(r.complete),
      net: r.net ? S.checkEq(r.net) : { ok: true },
    };
    r.ok = r.checks.molecular.ok && r.checks.complete.ok && r.checks.net.ok;
    // Surprises from the real flask.
    const real = REAL_FLASK[P1.key] || REAL_FLASK[P2.key];
    if (real) {
      r.real = Object.assign({}, real);
      if (real.color && COL[real.color]) r.real.colorHex = COL[real.color][0];
    }
    return r;
  };

  /** Runs every rule check, every reagent pair and every equation. Returns a list of problems (empty is good). */
  S.selfTest = function () {
    const out = [];
    const known = {
      AgCl: 'insoluble', PbCl2: 'insoluble', PbI2: 'insoluble', Hg2Cl2: 'insoluble', BaSO4: 'insoluble', PbSO4: 'insoluble', CaSO4: 'slight',
      CaCO3: 'insoluble', 'Ca3(PO4)2': 'insoluble', 'Fe(OH)3': 'insoluble', 'Cu(OH)2': 'insoluble', 'Ca(OH)2': 'slight', NaOH: 'soluble',
      K2CO3: 'soluble', '(NH4)2S': 'soluble', AgNO3: 'soluble', Ag2SO4: 'slight', 'Ba(OH)2': 'soluble', 'Sr(OH)2': 'slight', 'Mg(OH)2': 'insoluble',
      SrSO4: 'insoluble', Hg2SO4: 'insoluble', AgBr: 'insoluble', AgI: 'insoluble', PbBr2: 'insoluble', Hg2I2: 'insoluble', MgSO4: 'soluble', CuSO4: 'soluble',
      'Pb(NO3)2': 'soluble', 'Hg2(NO3)2': 'soluble', 'Pb(C2H3O2)2': 'soluble', BaCl2: 'soluble', CaCl2: 'soluble', FeCl3: 'soluble', 'Al2(SO4)3': 'soluble',
      'Fe2(SO4)3': 'soluble', '(Hg2)3(PO4)2': 'insoluble', Ag3PO4: 'insoluble', Ag2CO3: 'insoluble', ZnS: 'insoluble', CuS: 'insoluble', PbS: 'insoluble',
      Na3PO4: 'soluble', Li2CO3: 'soluble', '(NH4)3PO4': 'soluble', NH4OH: 'soluble', KClO4: 'soluble', 'Ba(ClO4)2': 'soluble',
    };
    for (const f in known) {
      const r = S.lookup(f);
      if (!r) out.push('no cell for ' + f);
      else if (r.status !== known[f]) out.push(`${f}: expected ${known[f]}, got ${r.status}`);
    }
    S.all().forEach((r) => {
      const c = S.countAtoms(r.formula), u = S.units(r.cation, r.anion);
      if (u.nc * r.cation.z + u.na * r.anion.z !== 0) out.push('not neutral: ' + r.formula);
      if (!r.reason || !S.rule(r.rule)) out.push('no reason: ' + r.formula);
      if (r.status !== 'soluble' && !r.color) out.push('no color: ' + r.formula);
      if (!Object.keys(c).length) out.push('no atoms: ' + r.formula);
    });
    S.reagents.forEach((a) => {
      if (S.isSoluble(a.c, a.a).status !== 'soluble') out.push('reagent is not soluble: ' + a.formula);
      S.reagents.forEach((b) => {
        const m = S.mix(a, b);
        if (m.molecular && !m.ok) out.push(`unbalanced: ${a.formula} + ${b.formula}: ${JSON.stringify(m.checks)}`);
        if (m.kind === 'precip' && !m.net) out.push(`precipitate without net: ${a.formula} + ${b.formula}`);
      });
    });
    return out;
  };

  /* ---------- Drawing any ion. Atoms keep their element colors. ---------- */
  const POLY = {
    NO3: { center: 'N', outer: 'O', n: 3 }, CO3: { center: 'C', outer: 'O', n: 3 }, ClO3: { center: 'Cl', outer: 'O', n: 3 },
    ClO4: { center: 'Cl', outer: 'O', n: 4 }, SO4: { center: 'S', outer: 'O', n: 4 }, PO4: { center: 'P', outer: 'O', n: 4 },
    NH4: { center: 'N', outer: 'H', n: 4, small: true },
  };
  /**
   * Solubility.drawIon(g, x, y, r, 'SO4', { face, look, t, seed, rot, alpha, label, charge })
   * r is the size in stage units (a sodium ion drawn at r has radius 0.88 r). Set scaled:false to use r exactly.
   */
  S.drawIon = function (g, x, y, r, id, o = {}) {
    const Art = window.Art;
    const ion = S.ion(id);
    const R = o.scaled === false ? r : r * (ion.size || 1);
    const prev = g.globalAlpha;
    if (o.alpha !== undefined) g.globalAlpha = prev * o.alpha;
    const charge = o.charge === false ? null : S.chargeText(ion);
    if (!ion.poly) {
      Art.atom(g, x, y, R, ion.f, { face: o.face, look: o.look, t: o.t, seed: o.seed, charge, label: o.label === false ? false : ion.f, glow: o.glow });
      g.globalAlpha = prev;
      return;
    }
    if (o.glow) Art.glow(g, x, y, R * 1.9, Art.elementColor(POLY[ion.id] ? POLY[ion.id].center : 'O'), 0.45 * o.glow);
    const rot = o.rot || 0;
    if (POLY[ion.id]) {
      const P = POLY[ion.id], rc = R * (P.small ? 0.74 : 0.66), ro = R * (P.small ? 0.36 : 0.5), d = R * (P.small ? 0.72 : 0.68);
      for (let i = 0; i < P.n; i++) {
        const a = rot - Math.PI / 2 + (i / P.n) * Math.PI * 2;
        Art.ball(g, x + Math.cos(a) * d, y + Math.sin(a) * d, ro, Art.elementColor(P.outer));
      }
      Art.ball(g, x, y, rc, Art.elementColor(P.center));
    } else if (ion.id === 'OH') {
      const a = rot + 0.5;
      Art.ball(g, x + Math.cos(a) * R * 0.72, y + Math.sin(a) * R * 0.72, R * 0.46, Art.elementColor('H'));
      Art.ball(g, x - Math.cos(a) * R * 0.18, y - Math.sin(a) * R * 0.18, R * 0.82, Art.elementColor('O'));
    } else if (ion.id === 'Hg2') {
      Art.ball(g, x - R * 0.42, y, R * 0.66, Art.elementColor('Hg'));
      Art.ball(g, x + R * 0.42, y, R * 0.66, Art.elementColor('Hg'));
    } else if (ion.id === 'C2H3O2') {
      const c = Math.cos(rot), s = Math.sin(rot);
      const pts = [['H', -1.02, -0.5, 0.26], ['H', -1.1, 0.3, 0.26], ['H', -0.62, 0.72, 0.26], ['O', 0.84, -0.56, 0.44], ['O', 0.84, 0.56, 0.44], ['C', -0.6, 0, 0.52], ['C', 0.3, 0, 0.52]];
      pts.forEach(([el, px, py, pr]) => Art.ball(g, x + (px * c - py * s) * R, y + (px * s + py * c) * R, pr * R, Art.elementColor(el)));
    }
    if (o.face && R >= 18) Art.face(g, x, y - R * 0.1, R * 0.82, o.face, { look: o.look, t: o.t, seed: o.seed });
    if (o.label !== false) Art.formula(g, ion.f, x, y + (o.face ? R * 0.66 : 0), { size: Math.max(14, R * (o.face ? 0.42 : 0.56)), color: '#fff', halo: true });
    if (charge) {
      const br = Math.max(11, R * 0.42), bx = x + R * 0.82, by = y - R * 0.82;
      g.fillStyle = ion.z > 0 ? '#FF3D7F' : '#1FA5FF';
      g.strokeStyle = '#1A0F2E'; g.lineWidth = 2;
      g.beginPath(); g.arc(bx, by, br, 0, 6.283); g.fill(); g.stroke();
      g.font = `700 ${br * 1.26}px ${Art.FONT_BODY}`;
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(charge.replace('-', '−'), bx, by + 0.5);
    }
    g.globalAlpha = prev;
  };

  /* ---------- Handy lists for questions ---------- */
  const pool = () => S.all().filter((r) => r.inGame);
  S.pool = pool;
  const statusWord = (r) => (r.status === 'soluble' ? 'soluble' : 'insoluble');

  /* ---------- The bank ---------- */
  Bank.add('solubility', {
    quiz: [
      {
        q: 'What does "insoluble" really mean?',
        options: ['Not one single ion ever dissolves', 'So little dissolves, under about 0.01 M, that it looks like none did', 'The compound reacts with water and vanishes', 'It floats on top of the water'],
        answer: 1,
        why: 'Insoluble is not zero. Even $\\ce{AgCl}$ puts a tiny number of ions in the water, about $1 \\times 10^{-5}$ M. The word means below a practical cutoff of about 0.01 M.',
      },
      {
        q: 'Why does $\\ce{NaCl}$ dissolve while $\\ce{AgCl}$ does not?',
        options: ['Sodium is lighter than silver', 'Chlorine is different in each one', 'In NaCl, water\'s pull on the ions beats the crystal\'s grip. In AgCl, the crystal wins.', 'AgCl molecules are too big to fit between water molecules'],
        answer: 2,
        why: 'Dissolving is a tug of war. The ions are attracted to each other in the crystal and to water around them. Whichever pull wins decides what you see.',
      },
      {
        q: 'Which compound is soluble in water?',
        options: ['$\\ce{CaCO3}$', '$\\ce{K2CO3}$', '$\\ce{Ag2CO3}$', '$\\ce{PbCO3}$'],
        answer: 1,
        why: 'Carbonates are usually insoluble, but $\\ce{K+}$ is a group 1 ion and rule 1 beats everything.',
      },
      {
        q: 'Which compound is insoluble in water?',
        options: ['$\\ce{Pb(NO3)2}$', '$\\ce{KI}$', '$\\ce{PbI2}$', '$\\ce{MgCl2}$'],
        answer: 2,
        why: 'Iodides usually dissolve, but $\\ce{Pb^2+}$ is one of the three exceptions. $\\ce{Pb(NO3)2}$ dissolves because nitrates always do.',
      },
      {
        q: 'Which of these cations makes a chloride insoluble?',
        options: ['$\\ce{Cu^2+}$', '$\\ce{Ca^2+}$', '$\\ce{Ag+}$', '$\\ce{Al^3+}$'],
        answer: 2,
        why: 'The halide exceptions are $\\ce{Ag+}$, $\\ce{Pb^2+}$ and $\\ce{Hg2^2+}$. Calcium is a sulfate exception, not a chloride exception.',
      },
      {
        q: 'Which sulfate dissolves well in water?',
        options: ['$\\ce{BaSO4}$', '$\\ce{PbSO4}$', '$\\ce{SrSO4}$', '$\\ce{MgSO4}$'],
        answer: 3,
        why: 'Magnesium is not on the sulfate exception list. Barium, strontium and lead sulfates all stay solid.',
      },
      {
        q: 'What is the best way to describe $\\ce{Ca(OH)2}$?',
        options: ['Very soluble, like $\\ce{NaOH}$', 'Slightly soluble, and tables differ on the exact wording', 'Completely insoluble, with no ions in the water', 'It has no solubility, since it is not a real compound'],
        answer: 1,
        why: 'About 0.02 M dissolves, just above the usual cutoff. Most tables say slightly soluble. Use the table your instructor gives you.',
      },
      {
        q: 'You check $\\ce{(NH4)2CO3}$. Carbonates are usually insoluble. What do you conclude?',
        options: ['Soluble, because ammonium beats everything', 'Insoluble, because carbonates are insoluble', 'Slightly soluble, because the rules cancel out', 'You cannot tell without an experiment'],
        answer: 0,
        why: 'Ask about the cation first. Ammonium, like group 1 ions, makes every compound soluble.',
      },
      {
        q: 'Mercury(I) chloride is written $\\ce{Hg2Cl2}$, not $\\ce{HgCl}$. Why?',
        options: ['Mercury has two protons', 'Mercury(I) always travels as a pair, $\\ce{Hg2^2+}$', 'Chlorine always comes in pairs in compounds', 'It is a typo that stuck'],
        answer: 1,
        why: 'The mercury(I) ion is two bonded mercury atoms with a total charge of 2+. It takes two $\\ce{Cl-}$ to balance, giving $\\ce{Hg2Cl2}$.',
      },
    ],

    gens: [
      {
        id: 'will-it',
        title: 'Will it dissolve?',
        make(r) {
          const list = pool();
          // Favor the cases that catch people.
          const tricky = list.filter((x) => x.exception || (x.rule === 'r1' && (x.anion.kind === 'cops' || x.anion.kind === 'hydroxide')) || (x.rule === 'r2' && x.cation.kind === 'grump'));
          const x = r.next() < 0.6 ? r.pick(tricky) : r.pick(list);
          const choices = ['Soluble', 'Insoluble'];
          return {
            q: `Is $\\ce{${x.formula}}$ (${x.name}) soluble or insoluble in water?`,
            choices,
            answer: x.soluble ? 0 : 1,
            steps: [`The first rule that fits is rule ${S.rule(x.rule).n}: ${S.rule(x.rule).title.toLowerCase()}.`, x.reason, `So $\\ce{${x.formula}}$ is ${statusWord(x)}.`],
          };
        },
      },
      {
        id: 'odd-one-insoluble',
        title: 'Find the insoluble one',
        make(r) {
          const list = pool();
          const bad = r.pick(list.filter((x) => x.insoluble));
          const good = r.shuffle(list.filter((x) => x.soluble && (x.cation.id === bad.cation.id || x.anion.id === bad.anion.id || x.rule === 'r1'))).slice(0, 3);
          const mc = r.mc(`$\\ce{${bad.formula}}$`, good.map((x) => `$\\ce{${x.formula}}$`));
          return {
            q: `Four bottles hold ${mc.choices.join(', ')}. Which one is insoluble in water?`,
            choices: mc.choices,
            answer: mc.answer,
            steps: [`$\\ce{${bad.formula}}$: ${bad.reason}`].concat(good.map((x) => `$\\ce{${x.formula}}$: ${x.reason}`)),
          };
        },
      },
      {
        id: 'odd-one-soluble',
        title: 'Find the soluble one',
        make(r) {
          const list = pool();
          const good = r.pick(list.filter((x) => x.soluble && (x.exception || x.rule === 'r1' || x.rule === 'r2' || x.cation.kind === 'grump')));
          const bad = r.shuffle(list.filter((x) => x.insoluble && (x.cation.id === good.cation.id || x.anion.id === good.anion.id || x.rule === 'r4' || x.rule === 'r3'))).slice(0, 3);
          const mc = r.mc(`$\\ce{${good.formula}}$`, bad.map((x) => `$\\ce{${x.formula}}$`));
          return {
            q: `Four bottles hold ${mc.choices.join(', ')}. Which one is soluble in water?`,
            choices: mc.choices,
            answer: mc.answer,
            steps: [`$\\ce{${good.formula}}$: ${good.reason}`].concat(bad.map((x) => `$\\ce{${x.formula}}$: ${x.reason}`)),
          };
        },
      },
      {
        id: 'which-rule',
        title: 'Which rule decides it?',
        make(r) {
          const x = r.pick(pool());
          const rule = S.rule(x.rule);
          const mc = r.mc(rule.title, r.shuffle(S.rules.filter((q) => q.id !== rule.id)).slice(0, 3).map((q) => q.title));
          return {
            q: `Ask the questions in order. Which rule decides whether $\\ce{${x.formula}}$ dissolves?`,
            choices: mc.choices,
            answer: mc.answer,
            steps: ['Check the cation first: group 1 or ammonium settles it at once.', 'Then check the anion: nitrate, acetate, chlorate, perchlorate, then the halides, then sulfate, then the rest.', x.reason],
          };
        },
      },
      {
        id: 'write-solid',
        title: 'Write the solid',
        make(r) {
          const x = r.pick(pool().filter((p) => p.insoluble));
          return {
            q: `${S.ionTex(x.cation)} meets ${S.ionTex(x.anion)} in water. They form an insoluble solid. Write its formula, for example CaCO3.`,
            accept: [x.formula],
            placeholder: 'Formula',
            hint: 'Pick the numbers so the positive and negative charges cancel.',
            steps: [
              `The charges are ${S.chargeText(x.cation).replace('-', '−')} and ${S.chargeText(x.anion).replace('-', '−')}.`,
              `It takes ${S.units(x.cation, x.anion).nc} of the cation and ${S.units(x.cation, x.anion).na} of the anion to cancel them.`,
              `That gives $\\ce{${x.formula}}$. ${x.reason}`,
            ],
          };
        },
      },
      {
        id: 'separate',
        title: 'Exam style: separate two ions',
        make(r) {
          // Pick two cations and an anion that drags out only the first one.
          const options = [];
          ['Cl', 'SO4', 'I', 'Br'].forEach((a) => {
            S.cations.filter((c) => c.kind !== 'group1' && c.kind !== 'ammonium').forEach((c1) => {
              S.cations.filter((c) => c.kind !== 'group1' && c.kind !== 'ammonium').forEach((c2) => {
                const R1 = S.isSoluble(c1, a), R2 = S.isSoluble(c2, a);
                if (R1.insoluble && R2.soluble && R2.inGame) options.push([c1, c2, S.ion(a)]);
              });
            });
          });
          const [c1, c2, a] = r.pick(options);
          const wrong = S.anions.filter((x) => x.id !== a.id).filter((x) => {
            const R1 = S.isSoluble(c1, x), R2 = S.isSoluble(c2, x);
            return !(R1.insoluble && R2.soluble);
          });
          const wrongPick = r.shuffle(wrong).slice(0, 3);
          const mc = r.mc(S.ionTex(a), wrongPick.map((x) => S.ionTex(x)));
          return {
            q: `A solution holds ${S.ionTex(c1)} and ${S.ionTex(c2)}. Which ion could you add to make a solid of the first one, while the second stays dissolved?`,
            choices: mc.choices,
            answer: mc.answer,
            steps: [
              `With ${S.ionTex(a)}: $\\ce{${S.formula(c1, a)}}$ is insoluble, and $\\ce{${S.formula(c2, a)}}$ is soluble. That leaves ${S.ionTex(c2)} behind.`,
            ].concat(wrongPick.map((x) => `With ${S.ionTex(x)}: $\\ce{${S.formula(c1, x)}}$ is ${S.isSoluble(c1, x).status} and $\\ce{${S.formula(c2, x)}}$ is ${S.isSoluble(c2, x).status}, so this does not separate them cleanly.`)),
          };
        },
      },
    ],

    cards: [
      { front: 'What makes a compound always soluble, no matter what else it holds?', back: 'A group 1 cation ($\\ce{Li+}$, $\\ce{Na+}$, $\\ce{K+}$...) or ammonium ($\\ce{NH4+}$). Nitrate, acetate, chlorate and perchlorate anions do it too.' },
      { front: 'Which three cations break the halide rule?', back: 'The grumpy three: $\\ce{Ag+}$, $\\ce{Pb^2+}$, $\\ce{Hg2^2+}$. Their chlorides, bromides and iodides stay solid.' },
      { front: 'Which cations make a sulfate insoluble?', back: '$\\ce{Ba^2+}$, $\\ce{Sr^2+}$, $\\ce{Pb^2+}$, $\\ce{Hg2^2+}$. $\\ce{Ca^2+}$ and $\\ce{Ag+}$ are slightly soluble.' },
      { front: 'Which anions are usually insoluble?', back: 'Carbonate, phosphate, sulfide and hydroxide, unless the cation is group 1 or ammonium.' },
      { front: 'Which hydroxides escape the insoluble rule?', back: 'Group 1 and ammonium fully, $\\ce{Ba(OH)2}$ well, and $\\ce{Ca(OH)2}$ and $\\ce{Sr(OH)2}$ slightly.' },
      { front: 'What does insoluble mean in numbers?', back: 'Less than about 0.01 M dissolves. It is never exactly zero.' },
      { front: 'What color is the $\\ce{PbI2}$ precipitate?', back: 'Bright yellow.' },
      { front: 'What color is the $\\ce{Cu(OH)2}$ precipitate?', back: 'Pale blue.' },
      { front: 'What color is the $\\ce{Fe(OH)3}$ precipitate?', back: 'Rust brown.' },
      { front: 'What color are $\\ce{AgCl}$ and $\\ce{BaSO4}$?', back: 'White.' },
    ],

    terms: [
      { term: 'Soluble', def: 'Dissolves well in water. As a rule of thumb, more than about 0.01 M dissolves.' },
      { term: 'Insoluble', def: 'So little dissolves, under about 0.01 M, that it looks like none did. It is never exactly zero.' },
      { term: 'Slightly soluble', def: 'A borderline compound, close to the 0.01 M cutoff. Tables disagree on the wording for these.' },
      { term: 'Hydration', def: 'Water molecules surrounding a dissolved ion, with their oppositely charged ends pointing toward it.' },
      { term: 'Lattice', def: 'The repeating, tightly packed arrangement of ions in an ionic solid.' },
      { term: 'Precipitate', def: 'An insoluble solid that forms in a solution and falls out of it.' },
      { term: 'Ammonium', def: 'The polyatomic ion $\\ce{NH4+}$. It behaves like a group 1 ion for solubility.' },
    ],
  });
})();
