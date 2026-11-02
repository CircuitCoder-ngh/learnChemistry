/* Question bank for 2.4 Ions and compounds. The ion data is also handed to the page script. */
(function () {
  const CATIONS = [
    { f: 'Li', q: 1, name: 'lithium' }, { f: 'Na', q: 1, name: 'sodium' }, { f: 'K', q: 1, name: 'potassium' }, { f: 'Rb', q: 1, name: 'rubidium' }, { f: 'Cs', q: 1, name: 'cesium' },
    { f: 'Ag', q: 1, name: 'silver' }, { f: 'NH4', q: 1, name: 'ammonium', poly: true, art: ['N', 'H', 4] },
    { f: 'Mg', q: 2, name: 'magnesium' }, { f: 'Ca', q: 2, name: 'calcium' }, { f: 'Sr', q: 2, name: 'strontium' }, { f: 'Ba', q: 2, name: 'barium' }, { f: 'Zn', q: 2, name: 'zinc' },
    { f: 'Fe', q: 2, name: 'iron(II)' }, { f: 'Cu', q: 2, name: 'copper(II)' }, { f: 'Pb', q: 2, name: 'lead(II)' }, { f: 'Sn', q: 2, name: 'tin(II)' }, { f: 'Ni', q: 2, name: 'nickel(II)' },
    { f: 'Al', q: 3, name: 'aluminum' }, { f: 'Fe', q: 3, name: 'iron(III)' }, { f: 'Cr', q: 3, name: 'chromium(III)' }, { f: 'Sn', q: 4, name: 'tin(IV)' },
  ];
  const ANIONS = [
    { f: 'F', q: -1, name: 'fluoride' }, { f: 'Cl', q: -1, name: 'chloride' }, { f: 'Br', q: -1, name: 'bromide' }, { f: 'I', q: -1, name: 'iodide' },
    { f: 'O', q: -2, name: 'oxide' }, { f: 'S', q: -2, name: 'sulfide' }, { f: 'N', q: -3, name: 'nitride' }, { f: 'P', q: -3, name: 'phosphide' },
  ];
  // core: the ten most often required. art: [center atom, outer atom, how many].
  const POLY = [
    { f: 'NH4', q: 1, name: 'ammonium', core: true, art: ['N', 'H', 4] },
    { f: 'OH', q: -1, name: 'hydroxide', core: true, art: ['O', 'H', 1] },
    { f: 'NO3', q: -1, name: 'nitrate', core: true, art: ['N', 'O', 3] },
    { f: 'NO2', q: -1, name: 'nitrite', art: ['N', 'O', 2] },
    { f: 'C2H3O2', q: -1, name: 'acetate', core: true, alt: ['CH3COO'] },
    { f: 'CN', q: -1, name: 'cyanide', art: ['C', 'N', 1] },
    { f: 'MnO4', q: -1, name: 'permanganate', art: ['Mn', 'O', 4] },
    { f: 'HCO3', q: -1, name: 'hydrogen carbonate', alt_names: ['bicarbonate'], core: true, art: ['C', 'O', 3] },
    { f: 'ClO4', q: -1, name: 'perchlorate', art: ['Cl', 'O', 4] },
    { f: 'ClO3', q: -1, name: 'chlorate', art: ['Cl', 'O', 3] },
    { f: 'ClO2', q: -1, name: 'chlorite', art: ['Cl', 'O', 2] },
    { f: 'ClO', q: -1, name: 'hypochlorite', art: ['Cl', 'O', 1] },
    { f: 'HSO4', q: -1, name: 'hydrogen sulfate', alt_names: ['bisulfate'], art: ['S', 'O', 4] },
    { f: 'H2PO4', q: -1, name: 'dihydrogen phosphate', art: ['P', 'O', 4] },
    { f: 'SO4', q: -2, name: 'sulfate', core: true, art: ['S', 'O', 4] },
    { f: 'SO3', q: -2, name: 'sulfite', core: true, art: ['S', 'O', 3] },
    { f: 'CO3', q: -2, name: 'carbonate', core: true, art: ['C', 'O', 3] },
    { f: 'CrO4', q: -2, name: 'chromate', art: ['Cr', 'O', 4] },
    { f: 'Cr2O7', q: -2, name: 'dichromate' },
    { f: 'HPO4', q: -2, name: 'hydrogen phosphate', art: ['P', 'O', 4] },
    { f: 'O2', q: -2, name: 'peroxide', art: ['O', 'O', 1] },
    { f: 'PO4', q: -3, name: 'phosphate', core: true, art: ['P', 'O', 4] },
  ];
  POLY.forEach((p) => { p.poly = true; });
  const POLY_ANIONS = POLY.filter((p) => p.q < 0);
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const part = (ion, n) => (n === 1 ? ion.f : ion.poly ? `(${ion.f})${n}` : `${ion.f}${n}`);
  const ratio = (cat, an) => { const a = cat.q, b = -an.q, g2 = gcd(a, b); return [b / g2, a / g2]; };
  const formula = (cat, an) => { const [nc, na] = ratio(cat, an); return part(cat, nc) + part(an, na); };
  const chargeTex = (q) => `${Math.abs(q) > 1 ? Math.abs(q) : ''}${q > 0 ? '+' : '-'}`;
  const ionTex = (ion) => `\\ce{${ion.f}^{${chargeTex(ion.q)}}}`;
  const signed = (q) => `${q > 0 ? '+' : '-'}${Math.abs(q)}`;
  // Pairs that do not exist as stable compounds, so the drill should not teach them.
  const NEVER = new Set(['Fe3|I', 'Cu2|I', 'Cu2|CN', 'Al3|CO3', 'Fe3|CO3', 'Cr3|CO3', 'Sn2|O2', 'Fe2|O2', 'Fe3|O2', 'Cr3|O2', 'Sn4|O2', 'Pb2|O2']);
  const OXIDIZERS = new Set(['MnO4', 'Cr2O7', 'CrO4', 'ClO', 'ClO2', 'ClO3', 'ClO4', 'NO3', 'O2']);
  const REDUCERS = new Set(['Fe2', 'Sn2']);
  const pairOK = (c, a) => !(REDUCERS.has(`${c.f}${c.q}`) && OXIDIZERS.has(a.f) && a.f !== 'NO3') && !NEVER.has(`${c.f}${c.q}|${a.f}`) && !(c.poly && a.f === 'O2') && !(c.f === 'NH4' && (a.f === 'N' || a.f === 'P' || a.f === 'O'));

  function pickPair(r, polyOnly) {
    const pool = polyOnly ? POLY_ANIONS : ANIONS.concat(POLY_ANIONS);
    for (let i = 0; i < 40; i++) {
      const c = r.pick(CATIONS), a = r.pick(pool);
      if (pairOK(c, a)) return [c, a];
    }
    return [CATIONS[1], ANIONS[1]];
  }
  const formulaSteps = (c, a) => {
    const [nc, na] = ratio(c, a);
    const tot = nc * c.q;
    return [
      `Write the ions: $${ionTex(c)}$ and $${ionTex(a)}$.`,
      `Balance the charges: ${nc} × (${signed(c.q)}) and ${na} × (${signed(a.q)}) make $+${tot}$ and $-${tot}$, which add to zero.`,
      `So the formula is $\\ce{${formula(c, a)}}$.${a.poly && na > 1 ? ' Parentheses show there is more than one polyatomic ion.' : ''}`,
    ];
  };
  const ionicList = ['NaCl', 'KBr', 'CaO', 'MgCl2', 'Al2O3', 'Na2S', 'K2O', 'CaF2', 'FeCl3', 'CuO', 'LiF', 'BaI2', 'Ca(OH)2', 'Na2SO4', 'NH4Cl', 'KNO3', 'Mg3(PO4)2', '(NH4)2CO3', 'AgNO3', 'ZnS'];
  const molecularList = ['H2O', 'CO2', 'NH3', 'CH4', 'SO2', 'NO2', 'PCl3', 'CCl4', 'N2O', 'SF6', 'HCl', 'C6H12O6', 'P2O5', 'CS2', 'NF3', 'H2S', 'OF2', 'C2H5OH'];

  Bank.add('compounds', {
    quiz: [
      {
        q: 'A calcium atom loses 2 electrons. What does it become?',
        options: ['A cation with a $2+$ charge', 'An anion with a $2-$ charge', 'A cation with a $2-$ charge', 'A different element'],
        answer: 0,
        why: 'Losing negative electrons leaves extra positive charge, so it is a cation, $\\ce{Ca^2+}$. It is still calcium, since the protons did not change.',
      },
      {
        q: 'Which compound is molecular?',
        options: ['$\\ce{KCl}$', '$\\ce{MgO}$', '$\\ce{SO2}$', '$\\ce{NH4Cl}$'],
        answer: 2,
        why: 'Sulfur and oxygen are both nonmetals. The others are ionic, including $\\ce{NH4Cl}$, which contains the ammonium ion.',
      },
      {
        q: 'What does the formula $\\ce{MgCl2}$ tell you?',
        options: ['One molecule has 1 Mg and 2 Cl', 'The crystal has 1 $\\ce{Mg^2+}$ for every 2 $\\ce{Cl-}$', 'It contains a $\\ce{Cl2}$ molecule', 'It has 2 Mg for every 1 Cl'],
        answer: 1,
        why: 'Ionic formulas give the ratio of ions in the crystal. There are no separate molecules and no bonded $\\ce{Cl2}$ pair.',
      },
      {
        q: 'What is the correct formula for calcium phosphate?',
        options: ['$\\ce{CaPO4}$', '$\\ce{Ca2(PO4)3}$', '$\\ce{Ca3(PO4)2}$', '$\\ce{Ca3PO4}$'],
        answer: 2,
        why: '$\\ce{Ca^2+}$ and $\\ce{PO4^3-}$: three calciums make $+6$ and two phosphates make $-6$.',
      },
      {
        q: 'What is the charge on chromium in $\\ce{Cr2O3}$?',
        options: ['$+2$', '$+3$', '$+6$', '$-3$'],
        answer: 1,
        why: 'Three oxides total $-6$, so two chromiums total $+6$. Each is $+3$. Students who answer $+2$ have read the subscript instead of doing the math.',
      },
      {
        q: 'How many oxygen atoms does one formula unit of $\\ce{Al2(SO4)3}$ contain?',
        options: ['4', '7', '12', '3'],
        answer: 2,
        why: 'The 3 multiplies everything inside the parentheses: $3 \\times 4 = 12$ oxygen atoms.',
      },
      {
        q: 'Which is a correctly simplified formula?',
        options: ['$\\ce{Ca2O2}$', '$\\ce{Mg2F4}$', '$\\ce{BaO}$', '$\\ce{K2Cl2}$'],
        answer: 2,
        why: 'Ionic formulas use the smallest whole-number ratio. The others reduce to $\\ce{CaO}$, $\\ce{MgF2}$ and $\\ce{KCl}$.',
      },
      {
        q: 'Sulfate is $\\ce{SO4^2-}$. What is sulfite?',
        options: ['$\\ce{SO3^2-}$', '$\\ce{SO5^2-}$', '$\\ce{SO3-}$', '$\\ce{S^2-}$'],
        answer: 0,
        why: 'The -ite ion has one less oxygen than the -ate ion, and the same charge. $\\ce{S^2-}$ is sulfide.',
      },
      {
        q: 'Glucose has the molecular formula $\\ce{C6H12O6}$. What is its empirical formula?',
        options: ['$\\ce{C6H12O6}$', '$\\ce{CH2O}$', '$\\ce{C2H4O2}$', '$\\ce{CHO}$'],
        answer: 1,
        why: 'Divide every subscript by the largest factor they share, which is 6.',
      },
    ],

    gens: [
      {
        id: 'write',
        title: 'Write the ionic formula',
        make(r) {
          const [c, a] = pickPair(r, false);
          const f = formula(c, a);
          return {
            q: `Write the formula of the compound of $${ionTex(c)}$ and $${ionTex(a)}$.`,
            accept: [f],
            placeholder: 'Formula, such as Al2O3',
            hint: 'Find the smallest numbers of each ion that make the charges add to zero.',
            steps: formulaSteps(c, a),
          };
        },
      },
      {
        id: 'write-poly',
        title: 'Formulas with polyatomic ions',
        make(r) {
          const [c, a] = pickPair(r, true);
          const f = formula(c, a);
          return {
            q: `Write the formula of ${c.name} ${a.name}. The ions are $${ionTex(c)}$ and $${ionTex(a)}$.`,
            accept: [f],
            placeholder: 'Use parentheses if needed',
            hint: 'If you need more than one polyatomic ion, put it in parentheses.',
            steps: formulaSteps(c, a),
          };
        },
      },
      {
        id: 'charge',
        title: 'Find the metal charge',
        make(r) {
          const metals = [['Fe', [2, 3]], ['Cu', [1, 2]], ['Cr', [2, 3, 6]], ['Mn', [2, 3, 4, 7]], ['Sn', [2, 4]], ['Pb', [2, 4]], ['Co', [2, 3]], ['Ni', [2, 3]], ['Ti', [3, 4]], ['Au', [1, 3]], ['V', [3, 5]]];
          const anions = [ANIONS[1], ANIONS[2], ANIONS[4], POLY.find((p) => p.f === 'SO4'), POLY.find((p) => p.f === 'NO3'), POLY.find((p) => p.f === 'OH'), POLY.find((p) => p.f === 'PO4'), ANIONS[0]];
          for (let i = 0; i < 40; i++) {
            const [m, list] = r.pick(metals);
            const q = r.pick(list);
            const an = r.pick(anions);
            if (q > 4 && an.f !== 'O') continue;
            const cat = { f: m, q };
            const [nc, na] = ratio(cat, an);
            const f = part(cat, nc) + part(an, na);
            return {
              q: `What is the charge on each ${EL[m].name.toLowerCase()} ion in $\\ce{${f}}$?`,
              answer: q, tol: 0, answerText: `+${q}`,
              placeholder: 'Such as 3',
              hint: `Find the total negative charge first. The anion has a charge of ${signed(an.q)}.`,
              steps: [
                `The anions total ${na} × (${signed(an.q)}) = $-${na * -an.q}$.`,
                `The formula is neutral, so ${nc === 1 ? `the ${m}` : `the ${nc} ${m} ions`} must total $+${na * -an.q}$.`,
                nc === 1 ? `So the ion is $\\ce{${m}^{${q}+}}$.` : `Divide: $\\dfrac{+${na * -an.q}}{${nc}} = +${q}$, so each ion is $\\ce{${m}^{${q}+}}$.`,
              ],
            };
          }
          return null;
        },
      },
      {
        id: 'classify',
        title: 'Ionic or molecular?',
        make(r) {
          const ionic = r.next() < 0.5;
          const f = r.pick(ionic ? ionicList : molecularList);
          const right = ionic ? 'Ionic' : 'Molecular';
          const opts = r.mc(right, [ionic ? 'Molecular' : 'Ionic']);
          const why = f.includes('NH4') ? 'It contains the ammonium ion, $\\ce{NH4+}$, so it is ionic even though it has no metal.' : ionic ? 'It contains a metal and a nonmetal part, so it is made of ions.' : 'It contains only nonmetals, so it is made of separate molecules.';
          return { q: `Is $\\ce{${f}}$ ionic or molecular?`, choices: opts.choices, answer: opts.answer, steps: [why] };
        },
      },
      {
        id: 'poly-formula',
        title: 'Polyatomic name to formula',
        make(r) {
          const p = r.pick(POLY);
          const tex = `${p.f}${chargeTex(p.q)}`;
          return {
            q: `Write the formula and charge of <b>${p.name}</b>. Use ^ for the charge, as in Mg^2+.`,
            accept: [`${p.f}${chargeTex(p.q)}`, `${p.f}^${chargeTex(p.q)}`].concat((p.alt || []).map((a) => `${a}${chargeTex(p.q)}`)),
            placeholder: 'Such as Mg^2+',
            hint: `It has a ${chargeTex(p.q)} charge. What goes with it?`,
            steps: [`${p.name[0].toUpperCase() + p.name.slice(1)} is $${ionTex(p)}$.`, `Typed answer: ${tex}.`],
          };
        },
      },
      {
        id: 'poly-name',
        title: 'Polyatomic formula to name',
        make(r) {
          const p = r.pick(POLY);
          return {
            q: `Name the ion $${ionTex(p)}$.`,
            accept: [p.name].concat(p.alt_names || []),
            placeholder: 'Name',
            hint: 'Do you remember how -ate and -ite differ?',
            steps: [`$${ionTex(p)}$ is <b>${p.name}</b>.`],
          };
        },
      },
      {
        id: 'count-atoms',
        title: 'Count atoms and ions',
        make(r) {
          const pairs = [];
          for (let i = 0; i < 12 && !pairs.length; i++) { const [c, a] = pickPair(r, true); const [nc, na] = ratio(c, a); if (na > 1 || nc > 1) pairs.push([c, a, nc, na]); }
          const [c, a, nc, na] = pairs[0] || [CATIONS[8], POLY[2], 1, 2];
          const f = part(c, nc) + part(a, na);
          const counts = Bank.countAtoms(f);
          const kind = r.pick(['atom', 'ions']);
          if (kind === 'ions') {
            return {
              q: `How many ions are in one formula unit of $\\ce{${f}}$?`,
              answer: nc + na, tol: 0, answerText: String(nc + na),
              hint: 'Polyatomic ions count as one ion each.',
              steps: [`${nc} cation${nc > 1 ? 's' : ''} and ${na} anion${na > 1 ? 's' : ''}: $${nc} + ${na} = ${nc + na}$ ions. A polyatomic ion counts as one.`],
            };
          }
          const el = r.pick(Object.keys(counts));
          const inside = Object.keys(Bank.countAtoms(a.f)).includes(el);
          const inCat = Bank.countAtoms(c.f)[el] || 0;
          return {
            q: `How many ${EL[el].name.toLowerCase()} atoms are in one formula unit of $\\ce{${f}}$?`,
            answer: counts[el], tol: 0, answerText: String(counts[el]),
            hint: 'A number after parentheses multiplies everything inside.',
            steps: inside && inCat
              ? [`The ${el} is in both ions. Each $\\ce{${c.f}}$ holds ${inCat}, and there ${nc > 1 ? `are ${nc}` : 'is 1'}. Each $\\ce{${a.f}}$ holds ${Bank.countAtoms(a.f)[el]}, and there ${na > 1 ? `are ${na}` : 'is 1'}.`, `$${nc} \\times ${inCat} + ${na} \\times ${Bank.countAtoms(a.f)[el]} = ${counts[el]}$.`]
              : inside
              ? [`Each $\\ce{${a.f}}$ holds ${Bank.countAtoms(a.f)[el]} ${el}, and there ${na > 1 ? `are ${na}` : 'is 1'} in the formula.`, `$${Bank.countAtoms(a.f)[el]} \\times ${na} = ${counts[el]}$.`]
              : [`Count ${el} in the cation part: ${counts[el]}.`],
          };
        },
      },
      {
        id: 'empirical',
        title: 'Empirical from molecular',
        make(r) {
          const list = [['C6H12O6', 'CH2O'], ['H2O2', 'HO'], ['C2H4', 'CH2'], ['C2H6', 'CH3'], ['C6H6', 'CH'], ['C2H2', 'CH'], ['N2O4', 'NO2'], ['P4O10', 'P2O5'], ['C4H10', 'C2H5'], ['C3H6', 'CH2'], ['C2H4O2', 'CH2O'], ['N2H4', 'NH2'], ['H2O', 'H2O'], ['CO2', 'CO2'], ['C8H18', 'C4H9'], ['B2H6', 'BH3'], ['C4H8O2', 'C2H4O'], ['C5H10', 'CH2'], ['S2Cl2', 'SCl'], ['C6H14', 'C3H7']];
          const [m, e] = r.pick(list);
          const nums = Object.values(Bank.countAtoms(m));
          const k = nums.reduce((a, b) => gcd(a, b));
          return {
            q: `What is the empirical formula of $\\ce{${m}}$?`,
            accept: [e],
            placeholder: 'Formula',
            hint: 'Divide every subscript by the largest number that goes into all of them.',
            steps: k > 1 ? [`The subscripts ${nums.join(', ')} are all divisible by ${k}.`, `Divide each by ${k}: $\\ce{${e}}$.`] : [`The subscripts ${nums.join(', ')} share no common factor, so it is already simplest: $\\ce{${e}}$.`],
          };
        },
      },
    ],

    cards: [
      { front: 'Cation', back: 'A positive ion, formed when an atom loses electrons. Metals form cations.' },
      { front: 'Anion', back: 'A negative ion, formed when an atom gains electrons. Nonmetals form anions.' },
      { front: 'Ionic compound', back: 'Cations and anions held in a crystal lattice. Usually a metal and a nonmetal.' },
      { front: 'Molecular compound', back: 'Separate molecules of nonmetal atoms sharing electrons.' },
      { front: 'Formula unit', back: 'The smallest ratio of ions in an ionic compound.' },
      { front: 'How do you write an ionic formula?', back: 'Use the smallest whole numbers of ions that make the total charge zero.' },
      { front: 'Nitrate', back: '$\\ce{NO3-}$' }, { front: 'Sulfate', back: '$\\ce{SO4^2-}$' }, { front: 'Carbonate', back: '$\\ce{CO3^2-}$' }, { front: 'Phosphate', back: '$\\ce{PO4^3-}$' },
      { front: 'Hydroxide', back: '$\\ce{OH-}$' }, { front: 'Ammonium', back: '$\\ce{NH4+}$' }, { front: 'Acetate', back: '$\\ce{C2H3O2-}$' },
      { front: '-ate versus -ite', back: 'The -ite ion has one less oxygen than the -ate ion, with the same charge.' },
      { front: 'Empirical versus molecular formula', back: 'Empirical is the simplest ratio. Molecular is the actual count of atoms in a molecule.' },
    ],

    terms: [
      { term: 'Ionic compound', def: 'A compound made of positive and negative ions held together in a lattice by their attraction.' },
      { term: 'Molecular compound', def: 'A compound made of separate molecules, in which nonmetal atoms share electrons.' },
      { term: 'Molecule', def: 'A separate group of atoms bonded together by shared electrons.' },
      { term: 'Crystal lattice', def: 'A regular, repeating arrangement of particles in a solid.' },
      { term: 'Polyatomic ion', def: 'A group of bonded atoms that carries a charge as a unit, such as sulfate.' },
      { term: 'Empirical formula', def: 'The simplest whole-number ratio of atoms in a compound.' },
      { term: 'Molecular formula', def: 'The actual number of each kind of atom in one molecule.' },
    ],
  });
  Bank.all.compounds.kit = { CATIONS, ANIONS, POLY, POLY_ANIONS, ratio, formula, part, gcd, chargeTex, pairOK };
})();
