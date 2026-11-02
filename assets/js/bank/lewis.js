/* Question bank for 8.3 Lewis structures, plus LewisKit: the engine that works out every structure.
   Nothing about a structure is typed in by hand except which atoms are connected. The recipe below
   counts the electrons, places them, makes multiple bonds and computes formal charges. Kit.verify()
   proves the electron totals match the drawing. The page and the practice gym both read from here. */
(function () {
  'use strict';
  const Kit = (window.LewisKit = {});
  const E = (s) => window.EL[s];

  /** Valence electrons from the group number, main-group elements only. */
  Kit.valence = (s) => { if (s === 'He') return 2; const g = E(s).group; return g <= 2 ? g : g - 10; };
  /** How many electrons this atom needs around it before the recipe calls it satisfied. */
  Kit.target = (s) => (s === 'H' ? 2 : s === 'Be' ? 4 : s === 'B' || s === 'Al' ? 6 : 8);

  /* ---------- Molecule layouts: only the connections and a 2D position, in bond lengths ---------- */
  const rad = (d) => (d * Math.PI) / 180;
  /** One central atom with outer atoms at compass angles. 0 is right, 90 is up. */
  const star = (c, outer, angles) => ({
    atoms: [{ el: c, x: 0, y: 0 }].concat(outer.map((s, i) => ({ el: s, x: Math.cos(rad(angles[i])), y: -Math.sin(rad(angles[i])) }))),
    edges: outer.map((_, i) => [0, i + 1]),
  });
  /** A straight chain, left to right. */
  const line = (list) => ({
    atoms: list.map((s, i) => ({ el: s, x: i - (list.length - 1) / 2, y: 0 })),
    edges: list.slice(1).map((_, i) => [i, i + 1]),
  });
  const custom = (atoms, edges) => ({ atoms: atoms.map(([el, x, y]) => ({ el, x, y })), edges });

  const defs = [
    // Starter molecules.
    ['H2O', 'Water', 0, 'simple', star('O', ['H', 'H'], [215, 325])],
    ['NH3', 'Ammonia', 0, 'simple', star('N', ['H', 'H', 'H'], [180, 270, 0])],
    ['CH4', 'Methane', 0, 'simple', star('C', ['H', 'H', 'H', 'H'], [90, 0, 270, 180])],
    ['HF', 'Hydrogen fluoride', 0, 'simple', line(['H', 'F'])],
    ['F2', 'Fluorine', 0, 'simple', line(['F', 'F'])],
    ['H2S', 'Hydrogen sulfide', 0, 'simple', star('S', ['H', 'H'], [215, 325])],
    ['CCl4', 'Carbon tetrachloride', 0, 'simple', star('C', ['Cl', 'Cl', 'Cl', 'Cl'], [90, 0, 270, 180])],
    ['NF3', 'Nitrogen trifluoride', 0, 'simple', star('N', ['F', 'F', 'F'], [180, 270, 0])],
    ['H2O2', 'Hydrogen peroxide', 0, 'simple', custom([['O', -0.5, 0], ['O', 0.5, 0], ['H', -1.2, 0.72], ['H', 1.2, -0.72]], [[0, 1], [0, 2], [1, 3]])],
    ['CH3OH', 'Methanol', 0, 'simple', custom([['C', -0.6, 0], ['O', 0.4, 0], ['H', -0.6, -1], ['H', -0.6, 1], ['H', -1.6, 0], ['H', 1.15, 0.66]], [[0, 1], [0, 2], [0, 3], [0, 4], [1, 5]])],
    // Multiple bonds.
    ['CO2', 'Carbon dioxide', 0, 'multiple', star('C', ['O', 'O'], [180, 0])],
    ['HCN', 'Hydrogen cyanide', 0, 'multiple', line(['H', 'C', 'N'])],
    ['N2', 'Nitrogen', 0, 'multiple', line(['N', 'N'])],
    ['O2', 'Oxygen', 0, 'multiple', line(['O', 'O'])],
    ['CO', 'Carbon monoxide', 0, 'multiple', line(['C', 'O'])],
    ['CH2O', 'Formaldehyde', 0, 'multiple', star('C', ['O', 'H', 'H'], [90, 210, 330])],
    ['C2H4', 'Ethene', 0, 'multiple', custom([['C', -0.5, 0], ['C', 0.5, 0], ['H', -1.2, -0.72], ['H', -1.2, 0.72], ['H', 1.2, -0.72], ['H', 1.2, 0.72]], [[0, 1], [0, 2], [0, 3], [1, 4], [1, 5]])],
    ['C2H2', 'Ethyne', 0, 'multiple', line(['H', 'C', 'C', 'H'])],
    ['CS2', 'Carbon disulfide', 0, 'multiple', star('C', ['S', 'S'], [180, 0])],
    // Ions.
    ['OH^-', 'Hydroxide', -1, 'ion', line(['O', 'H'])],
    ['NH4^+', 'Ammonium', 1, 'ion', star('N', ['H', 'H', 'H', 'H'], [90, 0, 270, 180])],
    ['H3O^+', 'Hydronium', 1, 'ion', star('O', ['H', 'H', 'H'], [180, 270, 0])],
    ['CN^-', 'Cyanide', -1, 'ion', line(['C', 'N'])],
    ['ClO3^-', 'Chlorate', -1, 'ion', star('Cl', ['O', 'O', 'O'], [180, 270, 0])],
    ['ClO4^-', 'Perchlorate', -1, 'ion', star('Cl', ['O', 'O', 'O', 'O'], [90, 0, 270, 180])],
    ['SO4^2-', 'Sulfate', -2, 'ion', star('S', ['O', 'O', 'O', 'O'], [90, 0, 270, 180])],
    ['PO4^3-', 'Phosphate', -3, 'ion', star('P', ['O', 'O', 'O', 'O'], [90, 0, 270, 180])],
    ['SCN^-', 'Thiocyanate', -1, 'ion', line(['S', 'C', 'N'])],
    // Resonance.
    ['O3', 'Ozone', 0, 'resonance', star('O', ['O', 'O'], [210, 330])],
    ['NO2^-', 'Nitrite', -1, 'resonance', star('N', ['O', 'O'], [210, 330])],
    ['NO3^-', 'Nitrate', -1, 'resonance', star('N', ['O', 'O', 'O'], [90, 210, 330])],
    ['CO3^2-', 'Carbonate', -2, 'resonance', star('C', ['O', 'O', 'O'], [90, 210, 330])],
    ['SO2', 'Sulfur dioxide', 0, 'resonance', star('S', ['O', 'O'], [210, 330])],
    ['SO3', 'Sulfur trioxide', 0, 'resonance', star('S', ['O', 'O', 'O'], [90, 210, 330])],
    ['N2O', 'Nitrous oxide', 0, 'resonance', line(['N', 'N', 'O'])],
    ['HNO3', 'Nitric acid', 0, 'resonance', custom([['N', 0, 0], ['O', 0, -1], ['O', 0.87, 0.5], ['O', -0.87, 0.5], ['H', -1.67, -0.1]], [[0, 1], [0, 2], [0, 3], [3, 4]])],
    // Too few.
    ['BF3', 'Boron trifluoride', 0, 'few', star('B', ['F', 'F', 'F'], [90, 210, 330])],
    ['BeCl2', 'Beryllium chloride', 0, 'few', star('Be', ['Cl', 'Cl'], [180, 0])],
    ['AlCl3', 'Aluminum chloride', 0, 'few', star('Al', ['Cl', 'Cl', 'Cl'], [90, 210, 330])],
    // Odd.
    ['NO', 'Nitric oxide', 0, 'odd', line(['N', 'O'])],
    ['NO2', 'Nitrogen dioxide', 0, 'odd', star('N', ['O', 'O'], [210, 330])],
    // Too many.
    ['PCl5', 'Phosphorus pentachloride', 0, 'many', star('P', ['Cl', 'Cl', 'Cl', 'Cl', 'Cl'], [90, 270, 0, 150, 210])],
    ['SF4', 'Sulfur tetrafluoride', 0, 'many', Object.assign(star('S', ['F', 'F', 'F', 'F'], [90, 270, 180, 0]), { lpAng: { 0: [45] } })],
    ['SF6', 'Sulfur hexafluoride', 0, 'many', star('S', ['F', 'F', 'F', 'F', 'F', 'F'], [90, 30, 330, 270, 210, 150])],
    ['ClF3', 'Chlorine trifluoride', 0, 'many', star('Cl', ['F', 'F', 'F'], [90, 270, 180])],
    ['BrF5', 'Bromine pentafluoride', 0, 'many', star('Br', ['F', 'F', 'F', 'F', 'F'], [90, 18, 162, 216, 324])],
    ['XeF2', 'Xenon difluoride', 0, 'many', Object.assign(star('Xe', ['F', 'F'], [180, 0]), { lpAng: { 0: [90, 215, 325] } })],
    ['XeF4', 'Xenon tetrafluoride', 0, 'many', Object.assign(star('Xe', ['F', 'F', 'F', 'F'], [45, 135, 225, 315]), { lpAng: { 0: [90, 270] } })],
    ['I3^-', 'Triiodide', -1, 'many', Object.assign(star('I', ['I', 'I'], [180, 0]), { lpAng: { 0: [90, 215, 325] } })],
  ];
  Kit.GROUPS = { simple: 'Start here', multiple: 'Multiple bonds', ion: 'Ions', resonance: 'Resonance', few: 'Too few electrons', odd: 'Odd electrons', many: 'Expanded octet' };

  /* ---------- Electron bookkeeping ---------- */
  const clone = (st) => ({ order: st.order.slice(), lp: st.lp.slice(), rad: st.rad.slice(), left: st.left });
  const bondSum = (mol, st, i) => mol.edges.reduce((a, e, k) => a + (e[0] === i || e[1] === i ? st.order[k] : 0), 0);
  /** Electrons an atom sees: its lone electrons plus both electrons of every bond it is in. */
  Kit.around = (mol, st, i) => 2 * st.lp[i] + st.rad[i] + 2 * bondSum(mol, st, i);
  /** Formal charge = valence electrons - lone electrons - half of the bonding electrons. */
  Kit.fc = (mol, st, i) => Kit.valence(mol.atoms[i].el) - 2 * st.lp[i] - st.rad[i] - bondSum(mol, st, i);
  Kit.fcs = (mol, st) => mol.atoms.map((_, i) => Kit.fc(mol, st, i));
  /** Lower is better: small formal charges first, then any negative charge on the more electronegative atom. */
  Kit.score = (mol, st) => {
    let s = 0;
    mol.atoms.forEach((a, i) => { const f = Kit.fc(mol, st, i); s += Math.abs(f) * 10 + f * E(a.el).en; });
    return s;
  };
  Kit.neighbors = (mol, i) => mol.edges.flatMap((e, k) => (e[0] === i ? [{ j: e[1], k }] : e[1] === i ? [{ j: e[0], k }] : []));
  Kit.terminal = (mol, i) => Kit.neighbors(mol, i).length === 1;

  /** Run the recipe. Returns the list of frames a student would pass through. */
  function solve(mol) {
    const n = mol.atoms.length;
    const total = mol.atoms.reduce((a, x) => a + Kit.valence(x.el), 0) - mol.charge;
    let st = { order: mol.edges.map(() => 0), lp: Array(n).fill(0), rad: Array(n).fill(0), left: total };
    const frames = [];
    const push = (kind, extra) => { frames.push(Object.assign({ kind, st: clone(st) }, extra)); };
    const en = (i) => E(mol.atoms[i].el).en;
    push('count');
    push('skeleton');
    // Single bonds.
    st.order = st.order.map(() => 1); st.left -= 2 * mol.edges.length;
    push('connect');
    // Outer atoms first, most electronegative first.
    const outer = mol.atoms.map((_, i) => i).filter((i) => Kit.terminal(mol, i) && mol.atoms[i].el !== 'H').sort((a, b) => en(b) - en(a));
    const inner = mol.atoms.map((_, i) => i).filter((i) => !Kit.terminal(mol, i));
    outer.forEach((i) => {
      const need = Math.max(0, (8 - Kit.around(mol, st, i)) / 2), give = Math.min(need, Math.floor(st.left / 2));
      st.lp[i] += give; st.left -= 2 * give;
    });
    push('outer');
    // Whatever is left goes on the inner atoms, neediest first. Ties go to the more electronegative atom.
    const pool = inner.length ? inner : outer;
    const beforeCentral = st.left;
    while (st.left >= 2) {
      const i = pool.slice().sort((a, b) => (Kit.around(mol, st, a) - Kit.around(mol, st, b)) || (en(b) - en(a)))[0];
      st.lp[i]++; st.left -= 2;
    }
    if (st.left === 1) {
      // An odd electron sits on the atom with the least electrons around it, the less electronegative in a tie.
      const i = (inner.length ? inner : outer.slice().sort((a, b) => en(a) - en(b))).slice().sort((a, b) => (Kit.around(mol, st, a) - Kit.around(mol, st, b)) || (en(a) - en(b)))[0];
      st.rad[i] = 1; st.left = 0;
    }
    push('central', { gave: beforeCentral });
    // Short of an octet? A neighbor shares a lone pair.
    let guard = 0;
    for (;;) {
      if (guard++ > 12) break;
      const short = mol.atoms.map((_, i) => i).filter((i) => Kit.target(mol.atoms[i].el) - Kit.around(mol, st, i) >= 2);
      if (!short.length) break;
      let best = null;
      short.forEach((a) => {
        Kit.neighbors(mol, a).forEach(({ j, k }) => {
          if (st.lp[j] < 1 || st.order[k] >= 3 || mol.atoms[j].el === 'H') return;
          const t = clone(st); t.lp[j]--; t.order[k]++;
          const s = Kit.score(mol, t);
          if (!best || s < best.s - 1e-9) best = { s, t, a, j, k };
        });
      });
      if (!best) break;
      st = best.t;
      push('promote', { edge: best.k, from: best.j, to: best.a });
    }
    const octetIndex = frames.length;
    push('check');
    push('fc');
    // Period 3 and beyond can hold more than 8, which can lower the formal charges.
    let expanded = false;
    for (;;) {
      if (guard++ > 24) break;
      const centers = mol.atoms.map((_, i) => i).filter((i) => !Kit.terminal(mol, i) && E(mol.atoms[i].el).period >= 3 && Kit.fc(mol, st, i) > 0);
      let move = null;
      centers.forEach((c) => {
        Kit.neighbors(mol, c).forEach(({ j, k }) => {
          if (move || st.lp[j] < 1 || st.order[k] >= 3 || Kit.fc(mol, st, j) >= 0) return;
          move = { c, j, k };
        });
      });
      if (!move) break;
      st = clone(st); st.lp[move.j]--; st.order[move.k]++; expanded = true;
      push('expand', { edge: move.k, from: move.j, to: move.c });
    }
    return { frames, total, octet: frames[octetIndex].st, best: frames[frames.length - 1].st, expanded };
  }

  /** Throws if a structure breaks a rule of electron bookkeeping. */
  Kit.verify = function (mol, st) {
    const inDrawing = 2 * st.order.reduce((a, b) => a + b, 0) + 2 * st.lp.reduce((a, b) => a + b, 0) + st.rad.reduce((a, b) => a + b, 0);
    if (inDrawing + st.left !== mol.total) throw new Error(`${mol.id}: drawing holds ${inDrawing} electrons, total is ${mol.total}`);
    if (st.left === 0) {
      const sum = Kit.fcs(mol, st).reduce((a, b) => a + b, 0);
      if (sum !== mol.charge) throw new Error(`${mol.id}: formal charges add to ${sum}, charge is ${mol.charge}`);
    }
    mol.atoms.forEach((a, i) => { if (a.el === 'H' && Kit.around(mol, st, i) > 2) throw new Error(`${mol.id}: H has more than 2 electrons`); });
    return true;
  };

  Kit.classify = function (mol, st) {
    let kind = 'octet';
    mol.atoms.forEach((a, i) => {
      const n = Kit.around(mol, st, i);
      if (a.el === 'H') return;
      if (n % 2) kind = 'odd';
      else if (n < 8 && kind !== 'odd') kind = 'few';
      else if (n > 8 && kind === 'octet') kind = 'many';
    });
    return kind;
  };

  const cache = {};
  Kit.ids = defs.map((d) => d[0]);
  Kit.get = function (id) {
    if (cache[id]) return cache[id];
    const d = defs.find((x) => x[0] === id);
    if (!d) throw new Error('Unknown Lewis species ' + id);
    const mol = { id: d[0], name: d[1], charge: d[2], group: d[3], f: d[0], atoms: d[4].atoms, edges: d[4].edges, lpAng: d[4].lpAng || {} };
    Object.assign(mol, solve(mol));
    mol.frames.forEach((fr) => Kit.verify(mol, fr.st));
    mol.kind = Kit.classify(mol, mol.octet);
    mol.centers = mol.atoms.map((_, i) => i).filter((i) => !Kit.terminal(mol, i));
    cache[id] = mol;
    return mol;
  };
  /** Number of lone pairs and bonding pairs in a state. */
  Kit.pairs = (st) => ({ bond: st.order.reduce((a, b) => a + b, 0), lone: st.lp.reduce((a, b) => a + b, 0) });
  /** Grouped valence sum as display text, for example 4 + 2×6. */
  Kit.sumParts = function (mol) {
    const seen = [];
    mol.atoms.forEach((a) => { const s = seen.find((x) => x.el === a.el); if (s) s.n++; else seen.push({ el: a.el, n: 1 }); });
    return seen.map((s) => ({ el: s.el, n: s.n, v: Kit.valence(s.el) }));
  };
  /** Display name: H2O, or NH4^+ in KaTeX form. */
  Kit.tex = (id) => `\\ce{${id.replace('^', '^{').replace(/\^\{(.*)$/, '^{$1}')}}`;

  /* ---------- Candidate structures for the formal charge court ---------- */
  const cand = (label, atoms, edges, order, lp) => ({ label, atoms: atoms.map((el, i) => ({ el, x: i - (atoms.length - 1) / 2, y: 0 })), edges, st: { order, lp, rad: atoms.map(() => 0), left: 0 } });
  Kit.CASES = [
    { id: 'CO2', title: 'CO2', charge: 0, list: [
      cand('O=C=O', ['O', 'C', 'O'], [[0, 1], [1, 2]], [2, 2], [2, 0, 2]),
      cand('O≡C−O', ['O', 'C', 'O'], [[0, 1], [1, 2]], [3, 1], [1, 0, 3]),
      cand('C=O=O', ['C', 'O', 'O'], [[0, 1], [1, 2]], [2, 2], [2, 0, 2]),
    ] },
    { id: 'OCN^-', title: 'OCN^-', charge: -1, list: [
      cand('O=C=N', ['O', 'C', 'N'], [[0, 1], [1, 2]], [2, 2], [2, 0, 2]),
      cand('O≡C−N', ['O', 'C', 'N'], [[0, 1], [1, 2]], [3, 1], [1, 0, 3]),
      cand('O−C≡N', ['O', 'C', 'N'], [[0, 1], [1, 2]], [1, 3], [3, 0, 1]),
    ] },
    { id: 'N2O', title: 'N2O', charge: 0, list: [
      cand('N=N=O', ['N', 'N', 'O'], [[0, 1], [1, 2]], [2, 2], [2, 0, 2]),
      cand('N≡N−O', ['N', 'N', 'O'], [[0, 1], [1, 2]], [3, 1], [1, 0, 3]),
      cand('N−N≡O', ['N', 'N', 'O'], [[0, 1], [1, 2]], [1, 3], [3, 0, 1]),
    ] },
    { id: 'SCN^-', title: 'SCN^-', charge: -1, list: [
      cand('S=C=N', ['S', 'C', 'N'], [[0, 1], [1, 2]], [2, 2], [2, 0, 2]),
      cand('S≡C−N', ['S', 'C', 'N'], [[0, 1], [1, 2]], [3, 1], [1, 0, 3]),
      cand('S−C≡N', ['S', 'C', 'N'], [[0, 1], [1, 2]], [1, 3], [3, 0, 1]),
    ] },
    { id: 'HCN', title: 'HCN', charge: 0, list: [
      cand('H−C≡N', ['H', 'C', 'N'], [[0, 1], [1, 2]], [1, 3], [0, 0, 1]),
      cand('H−N≡C', ['H', 'N', 'C'], [[0, 1], [1, 2]], [1, 3], [0, 0, 1]),
    ] },
  ];
  /** Fill in totals and pick the winner by the formal charge rules. Throws if a candidate is miscounted. */
  Kit.cases = function () {
    Kit.CASES.forEach((c) => {
      if (c.done) return;
      c.done = true;
      c.list.forEach((s) => {
        s.charge = c.charge; s.id = c.id + ' ' + s.label;
        s.total = s.atoms.reduce((a, x) => a + Kit.valence(x.el), 0) - c.charge;
        Kit.verify(s, s.st);
        s.fcs = Kit.fcs(s, s.st);
        s.sumAbs = s.fcs.reduce((a, f) => a + Math.abs(f), 0);
        s.score = Kit.score(s, s.st);
      });
      c.best = c.list.reduce((b, s, i) => (s.score < c.list[b].score - 1e-9 ? i : b), 0);
    });
    return Kit.CASES;
  };

  /* ---------- Question bank ---------- */
  const texOf = Kit.tex;
  const names = { H: 'hydrogen', C: 'carbon', N: 'nitrogen', O: 'oxygen', F: 'fluorine', S: 'sulfur', Cl: 'chlorine', P: 'phosphorus', B: 'boron', Be: 'beryllium', Al: 'aluminum', Br: 'bromine', I: 'iodine', Xe: 'xenon' };
  const fmtFC = (f) => (f > 0 ? '+' + f : f < 0 ? '−' + -f : '0');
  const countSteps = (mol) => {
    const parts = Kit.sumParts(mol);
    const sum = parts.map((p) => (p.n > 1 ? `${p.n}(${p.v})` : `${p.v}`)).join(' + ');
    const adj = mol.charge > 0 ? ` - ${mol.charge}` : mol.charge < 0 ? ` + ${-mol.charge}` : '';
    return { sum, adj, parts };
  };

  Bank.add('lewis', {
    quiz: [
      {
        q: 'How many valence electrons do you count for $\\ce{CO3^{2-}}$?',
        options: ['22', '24', '26', '28'],
        answer: 1,
        why: 'Carbon brings 4 and three oxygens bring 18, which makes 22. The 2- charge means 2 extra electrons: 24. The tempting 22 forgets the charge.',
      },
      {
        q: 'In a Lewis structure, what does one dash between two atoms stand for?',
        options: ['One shared electron', 'Two shared electrons', 'One lone pair', 'One transferred electron'],
        answer: 1,
        why: 'A dash is a bonding pair, two electrons shared between the two atoms. A double bond is four electrons.',
      },
      {
        q: 'Which atom goes in the middle of the skeleton for $\\ce{NF3}$?',
        options: ['Fluorine, since there are three of them', 'Nitrogen, since it is less electronegative', 'Hydrogen, since it is the lightest', 'Either one, since it does not matter'],
        answer: 1,
        why: 'The least electronegative atom goes in the center (never hydrogen). Fluorine is the most electronegative element, so it is always on the outside.',
      },
      {
        q: 'You finished the recipe for $\\ce{CO2}$ and carbon only has 4 electrons around it, with no electrons left to place. What do you do?',
        options: ['Add 4 more electrons to carbon', 'Remove an oxygen', 'Turn lone pairs on oxygen into double bonds', 'Leave it, since carbon is an exception'],
        answer: 2,
        why: 'You cannot add electrons, because the total is fixed. Each oxygen shares a lone pair instead, giving $\\ce{O=C=O}$. Carbon now sees 8 and the count stays at 16.',
      },
      {
        q: 'Formal charge for an atom equals:',
        options: ['Valence electrons minus lone electrons minus half the bonding electrons', 'Valence electrons minus all electrons around the atom', 'The oxidation number of the atom', 'Number of bonds minus number of lone pairs'],
        answer: 0,
        why: 'The atom gets all of its lone electrons and half of each bond. Using all the bonding electrons is the classic slip, and oxidation number assigns bonds differently.',
      },
      {
        q: 'What does resonance in $\\ce{O3}$ actually mean?',
        options: ['The molecule flips quickly between two forms', 'Half the molecules are one form and half are the other', 'One real structure with both bonds identical, in between single and double', 'The electrons leave the molecule and come back'],
        answer: 2,
        why: 'Each drawing is an incomplete picture. The real molecule is a single hybrid. Both O-O bonds measure the same, about 128 pm, between a single bond (148 pm) and a double bond (121 pm).',
      },
      {
        q: 'Which molecule has a central atom with fewer than 8 electrons in its best Lewis structure?',
        options: ['$\\ce{NH3}$', '$\\ce{BF3}$', '$\\ce{CCl4}$', '$\\ce{SF6}$'],
        answer: 1,
        why: 'Boron is content with 6. A B=F double bond would put a positive formal charge on fluorine, the most electronegative element. $\\ce{SF6}$ also breaks the octet rule, but with too many electrons, 12.',
      },
      {
        q: 'Why can sulfur hold 12 electrons in $\\ce{SF6}$ when oxygen could never do that?',
        options: ['Sulfur has more valence electrons than oxygen', 'Sulfur is in period 3, so it is bigger and has room for more neighbors', 'Fluorine donates extra electrons', 'Oxygen is a noble gas'],
        answer: 1,
        why: 'Period 2 atoms are limited to 8. Atoms in period 3 and below can expand. Sulfur and oxygen have the same number of valence electrons, so that cannot be the reason.',
      },
      {
        q: 'Two Lewis structures of $\\ce{OCN^-}$ have the same smallest formal charges. One puts $-1$ on O and the other puts $-1$ on N. Which is better?',
        options: ['The one with $-1$ on O', 'The one with $-1$ on N', 'They tie', 'Neither one, since a negative charge is not allowed'],
        answer: 0,
        why: 'When formal charges tie, the negative one belongs on the more electronegative atom. O (3.44) beats N (3.04).',
      },
    ],

    gens: [
      {
        id: 'valence',
        title: 'Count valence electrons',
        make(r) {
          const id = r.pick(['H2O', 'NH3', 'CO2', 'HCN', 'CH2O', 'C2H4', 'NO3^-', 'CO3^2-', 'SO4^2-', 'PO4^3-', 'NH4^+', 'H3O^+', 'OH^-', 'CN^-', 'ClO3^-', 'SF6', 'XeF4', 'PCl5', 'O3', 'SO2', 'BF3', 'I3^-', 'SCN^-', 'HNO3']);
          const mol = Kit.get(id);
          const { sum, adj, parts } = countSteps(mol);
          return {
            q: `How many valence electrons must the Lewis structure of $${texOf(id)}$ show in total?`,
            answer: mol.total, unit: 'electrons', tol: 0, answerText: String(mol.total),
            hint: mol.charge ? 'Add the group numbers, then adjust: a negative charge adds electrons, a positive charge removes them.' : 'Read each atom\'s valence electrons from its group, then add.',
            steps: [
              `Valence electrons from the group: ${parts.map((p) => `${p.el} has ${p.v}`).join(', ')}.`,
              `Add one for every atom: $${sum}${mol.charge ? ' = ' + (mol.total + mol.charge) : ''}$.`,
              mol.charge ? `The charge is ${mol.charge > 0 ? '+' : '−'}${Math.abs(mol.charge)}, so ${mol.charge > 0 ? 'remove' : 'add'} ${Math.abs(mol.charge)}: $${mol.total + mol.charge}${adj} = ${mol.total}$ electrons.` : `The molecule is neutral, so the total is ${mol.total} electrons.`,
            ],
          };
        },
      },
      {
        id: 'central-lp',
        title: 'Lone pairs on the central atom',
        make(r) {
          const id = r.pick(['H2O', 'NH3', 'CH4', 'NF3', 'H2S', 'O3', 'NO2^-', 'SF4', 'ClF3', 'BrF5', 'XeF2', 'XeF4', 'I3^-', 'BF3', 'PCl5', 'NH4^+', 'H3O^+', 'ClO3^-', 'SF6']);
          const mol = Kit.get(id);
          const c = mol.centers[0], lp = mol.octet.lp[c];
          const bonds = Kit.neighbors(mol, c).length;
          const pairs = Kit.pairs(mol.octet);
          const outerUse = mol.total - 2 * pairs.bond - 2 * lp;
          return {
            q: `In the Lewis structure of $${texOf(id)}$, how many lone pairs sit on the central ${mol.atoms[c].el} atom?`,
            answer: lp, tol: 0, answerText: String(lp),
            hint: 'Count the electrons, draw single bonds, fill the outer atoms, then see what is left for the center.',
            steps: [
              `Total valence electrons: ${mol.total}.`,
              `Bonds to the center use $${bonds} \\times 2 = ${bonds * 2}$ electrons${pairs.bond > bonds ? ` (and multiple bonds use ${2 * pairs.bond - bonds * 2} more)` : ''}.`,
              `Outer atoms take ${outerUse} electrons as lone pairs.`,
              `What is left goes on the center: ${2 * lp} electrons, which is ${lp} lone pair${lp === 1 ? '' : 's'}.`,
            ],
          };
        },
      },
      {
        id: 'fc',
        title: 'Formal charge on an atom',
        make(r) {
          const id = r.pick(['NH4^+', 'H3O^+', 'OH^-', 'CN^-', 'CO', 'O3', 'NO3^-', 'CO3^2-', 'NO2^-', 'N2O', 'ClO3^-', 'SO4^2-', 'PO4^3-', 'I3^-', 'ClO4^-', 'SO2']);
          const mol = Kit.get(id);
          const st = mol.octet;
          const i = r.int(0, mol.atoms.length - 1);
          const a = mol.atoms[i];
          const lone = 2 * st.lp[i] + st.rad[i];
          const bondE = 2 * Kit.neighbors(mol, i).reduce((s, x) => s + st.order[x.k], 0);
          const f = Kit.fc(mol, st, i);
          const v = Kit.valence(a.el);
          const desc = Kit.neighbors(mol, i).map((x) => ['single', 'double', 'triple'][st.order[x.k] - 1] + ' bond').join(' and ');
          return {
            q: `In the ${mol.kind === 'octet' ? 'octet-rule ' : ''}Lewis structure of $${texOf(id)}$, one ${names[a.el] || a.el} atom has ${st.lp[i]} lone pair${st.lp[i] === 1 ? '' : 's'} and ${Kit.neighbors(mol, i).length > 2 ? Kit.neighbors(mol, i).length + ' bonds totalling ' + bondE + ' electrons' : 'a ' + desc}. What is its formal charge?`,
            answer: f, tol: 0, answerText: fmtFC(f),
            hint: 'Formal charge = valence electrons, minus lone electrons, minus half of the bonding electrons.',
            steps: [
              `${a.el} brings ${v} valence electrons.`,
              `It has ${lone} lone electrons and ${bondE} bonding electrons, so half of those is ${bondE / 2}.`,
              `Formal charge $= ${v} - ${lone} - \\dfrac{${bondE}}{2} = ${f}$.`,
            ],
          };
        },
      },
      {
        id: 'pairs',
        title: 'Count the pairs',
        make(r) {
          const id = r.pick(['H2O', 'NH3', 'CO2', 'HCN', 'CH2O', 'N2', 'C2H2', 'C2H4', 'NO3^-', 'CO3^2-', 'O3', 'SF4', 'XeF4', 'PCl5', 'CH3OH', 'H2O2', 'NF3']);
          const mol = Kit.get(id);
          const { bond, lone } = Kit.pairs(mol.octet);
          const askLone = r.pick([true, false]);
          const ans = askLone ? lone : bond;
          return {
            q: `In the Lewis structure of $${texOf(id)}$, how many ${askLone ? 'lone pairs' : 'bonding pairs'} are there in total, counting the whole ${mol.charge ? 'ion' : 'molecule'}?`,
            answer: ans, tol: 0, answerText: String(ans),
            hint: 'A single bond is one bonding pair, a double bond is two and a triple bond is three.',
            steps: [
              `Total electrons: ${mol.total}, which is ${mol.total / 2} pairs.`,
              `Bonding pairs in the structure: ${bond}. Lone pairs: ${lone}.`,
              `Check: $${bond} + ${lone} = ${bond + lone}$ pairs, which matches ${mol.total / 2}.`,
            ],
          };
        },
      },
      {
        id: 'kind',
        title: 'Does it obey the octet rule?',
        make(r) {
          const id = r.pick(['H2O', 'CO2', 'NH4^+', 'NO3^-', 'HCN', 'BF3', 'BeCl2', 'AlCl3', 'NO', 'NO2', 'PCl5', 'SF4', 'SF6', 'XeF2', 'XeF4', 'ClF3', 'I3^-', 'BrF5']);
          const mol = Kit.get(id);
          const labels = { octet: 'Every atom obeys the octet rule (H has 2)', few: 'Too few electrons on an atom (incomplete octet)', odd: 'An odd number of electrons (free radical)', many: 'Too many electrons on the center (expanded octet)' };
          const order = ['octet', 'few', 'odd', 'many'];
          const c = mol.centers.length ? mol.centers[0] : 0;
          const n = Kit.around(mol, mol.octet, c);
          return {
            q: `Which best describes the Lewis structure of $${texOf(id)}$?`,
            choices: order.map((k) => labels[k]), answer: order.indexOf(mol.kind),
            steps: [
              `Total valence electrons: ${mol.total}${mol.total % 2 ? ', an odd number' : ''}.`,
              `The ${mol.atoms[c].el} atom ends up with ${n} electrons around it.`,
              `So: ${labels[mol.kind][0].toLowerCase() + labels[mol.kind].slice(1)}.`,
            ],
          };
        },
      },
      {
        id: 'bond-order',
        title: 'Resonance and average bond order',
        make(r) {
          const [id, forms] = r.pick([['O3', 2], ['NO2^-', 2], ['CO3^2-', 3], ['NO3^-', 3], ['SO3', 3]]);
          const mol = Kit.get(id);
          const c = mol.centers[0];
          const nb = Kit.neighbors(mol, c);
          const pairs = nb.reduce((a, x) => a + mol.octet.order[x.k], 0);
          const bo = pairs / nb.length;
          return {
            q: `In the octet-rule drawing of $${texOf(id)}$, the double bond can go in any of ${forms} equal places. What is the average bond order of each bond to the central atom?`,
            answer: bo, tol: 0.015, answerText: Number.isInteger(bo) ? String(bo) : bo.toFixed(2),
            hint: 'Average bond order = total bonding pairs to the center, divided by the number of places they spread over.',
            steps: [
              `One drawing has ${pairs} bonding pairs to the center, spread over ${nb.length} equal bonds.`,
              `Average bond order $= \\dfrac{${pairs}}{${nb.length}} = ${bo.toFixed(2)}$.`,
              'Every bond is the same in the real molecule, somewhere between a single and a double bond.',
            ],
          };
        },
      },
      {
        id: 'best',
        title: 'Pick the best structure',
        make(r) {
          const c = r.pick(Kit.cases());
          const s = c.list;
          const texLabel = (x) => x.label.replace('−', '-').replace('≡', '#');
          const fcLine = (x) => x.atoms.map((a, i) => `${a.el} ${fmtFC(x.fcs[i])}`).join(', ');
          return {
            q: `Which skeleton and bond arrangement is the best Lewis structure for $${texOf(c.id)}$? Use formal charges.`,
            choices: s.map((x) => `$\\ce{${texLabel(x)}}$`), answer: c.best,
            steps: s.map((x) => `${x.label}: formal charges ${fcLine(x)}.`).concat([
              `Smallest charges win, and any negative charge goes on the most electronegative atom, so the best is ${s[c.best].label}.`,
            ]),
          };
        },
      },
    ],

    cards: [
      { front: 'Step 1 of every Lewis structure', back: 'Count valence electrons. Add one per negative charge, subtract one per positive charge.' },
      { front: 'Which atom goes in the center?', back: 'The least electronegative atom. Never hydrogen, which only forms one bond.' },
      { front: 'What is the octet rule?', back: 'Atoms tend to end up with 8 electrons around them, counting lone pairs and both electrons of every bond. Hydrogen only needs 2.' },
      { front: 'What if the center is short of an octet and you have no electrons left?', back: 'Turn a lone pair on an outer atom into a shared pair, making a double or triple bond.' },
      { front: 'Formal charge formula', back: 'Valence electrons minus lone electrons minus half of the bonding electrons.' },
      { front: 'What is resonance?', back: 'When one drawing cannot show the real molecule. The real structure is a hybrid of all the valid drawings, with identical in-between bonds.' },
      { front: 'Three kinds of octet exception', back: 'Too few (B, Be, as in $\\ce{BF3}$), odd electrons (as in $\\ce{NO}$), too many (period 3 and beyond, as in $\\ce{SF6}$).' },
      { front: 'Which structure is best?', back: 'The one with the smallest formal charges, with any negative charge on the most electronegative atom.' },
    ],

    terms: [
      { term: 'Lewis structure', def: 'A drawing of a molecule that shows every valence electron as a bond or a lone pair.' },
      { term: 'Lone pair', def: 'Two valence electrons on one atom, not shared with another atom.' },
      { term: 'Bonding pair', def: 'Two electrons shared between two atoms, drawn as a dash.' },
      { term: 'Octet rule', def: 'Atoms tend to end up with 8 valence electrons around them. Hydrogen needs 2.' },
      { term: 'Formal charge', def: 'Valence electrons minus lone electrons minus half of the bonding electrons. A bookkeeping charge on one atom.' },
      { term: 'Resonance', def: 'Two or more valid Lewis structures that differ only in where electrons are placed. The real molecule is a blend of them.' },
      { term: 'Resonance hybrid', def: 'The single real structure that resonance drawings describe together.' },
      { term: 'Free radical', def: 'A species with an unpaired electron, such as $\\ce{NO}$.' },
      { term: 'Expanded octet', def: 'More than 8 electrons around an atom in period 3 or below, as in $\\ce{SF6}$.' },
      { term: 'Incomplete octet', def: 'Fewer than 8 electrons around an atom, as with boron in $\\ce{BF3}$.' },
    ],
  });
})();
