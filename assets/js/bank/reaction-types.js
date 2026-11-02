/* Question bank for 4.2 The five reaction types. Products come from ion charges and are balanced and atom-checked in code. */
(function () {
  'use strict';
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const lcm = (a, b) => (a * b) / gcd(a, b);

  /** Smallest whole coefficients, by row reduction. Atoms are checked before returning. */
  function balance(L, R) {
    const terms = L.concat(R), cts = terms.map((f) => Bank.countAtoms(f));
    const els = [...new Set(cts.flatMap((c) => Object.keys(c)))];
    const M = els.map((e) => terms.map((_, j) => (cts[j][e] || 0) * (j < L.length ? 1 : -1)));
    const n = terms.length, pivots = [];
    let row = 0;
    for (let col = 0; col < n && row < M.length; col++) {
      let p = row;
      while (p < M.length && !M[p][col]) p++;
      if (p === M.length) continue;
      [M[row], M[p]] = [M[p], M[row]];
      for (let r = 0; r < M.length; r++) {
        if (r === row || !M[r][col]) continue;
        const a = M[row][col], b = M[r][col];
        M[r] = M[r].map((v, k) => v * a - M[row][k] * b);
        const g = M[r].reduce((x, y) => gcd(x, y), 0);
        if (g > 1) M[r] = M[r].map((v) => v / g);
      }
      pivots.push(col); row++;
    }
    const free = [];
    for (let c = 0; c < n; c++) if (!pivots.includes(c)) free.push(c);
    if (free.length !== 1) throw new Error('No unique balance for ' + terms.join(' '));
    let D = 1;
    pivots.forEach((c, i) => { D = lcm(D, Math.abs(M[i][c])); });
    const x = new Array(n).fill(0);
    x[free[0]] = D;
    pivots.forEach((c, i) => { x[c] = (-M[i][free[0]] * D) / M[i][c]; });
    const g = x.reduce((u, v) => gcd(u, v), 0), co = x.map((v) => Math.abs(v) / g);
    els.forEach((e) => {
      let tot = 0;
      cts.forEach((c, i) => { tot += (c[e] || 0) * co[i] * (i < L.length ? 1 : -1); });
      if (tot !== 0 || co.some((v) => !Number.isInteger(v))) throw new Error('Atom check failed for ' + terms.join(' '));
    });
    return co;
  }
  const cf = (n) => (n === 1 ? '' : String(n));
  const side = (fs, co, off = 0) => fs.map((f, i) => cf(co[i + off]) + f).join(' + ');
  const eqTex = (L, R, co) => `$\\ce{${side(L, co)}}$ $\\rightarrow$ $\\ce{${side(R, co, L.length)}}$`;

  /* Ions, with charges, so that formulas come out of the arithmetic. */
  const CAT = { Na: 1, K: 1, Li: 1, Ag: 1, Mg: 2, Ca: 2, Ba: 2, Zn: 2, Cu: 2, Pb: 2, Fe: 3, Al: 3, H: 1 };
  const ANI = { Cl: 1, Br: 1, I: 1, F: 1, NO3: 1, OH: 1, O: 2, S: 2, SO4: 2, CO3: 2, PO4: 3 };
  const POLY = new Set(['NO3', 'OH', 'SO4', 'CO3', 'PO4']);
  /** The formula from ion charges. charge overrides the cation's usual charge, as for iron(II). */
  function ionic(cat, ani, charge) {
    if (cat === 'H' && ani === 'OH') return 'H2O';
    const c = charge || CAT[cat], a = ANI[ani], L = lcm(c, a), nc = L / c, na = L / a;
    const A = na === 1 ? ani : POLY.has(ani) ? `(${ani})${na}` : `${ani}${na}`;
    return (nc === 1 ? cat : cat + nc) + A;
  }
  const NAMES = {
    Na: 'sodium', K: 'potassium', Li: 'lithium', Ag: 'silver', Mg: 'magnesium', Ca: 'calcium', Ba: 'barium', Zn: 'zinc', Cu: 'copper', Pb: 'lead', Fe: 'iron', Al: 'aluminum',
    Cl: 'chlorine', Br: 'bromine', I: 'iodine', F: 'fluorine', O: 'oxygen', S: 'sulfur',
  };
  const NONMETAL = { Cl: 'Cl2', Br: 'Br2', I: 'I2', F: 'F2', O: 'O2', S: 'S' };

  /* Reaction makers: each returns { L, R, co, kind }. */
  function combo(metal, non) {
    const L = [metal, NONMETAL[non]], R = [ionic(metal, non)];
    return { kind: 'combo', L, R, co: balance(L, R) };
  }
  function decomp(metal) {
    // A metal carbonate, heated, gives the metal oxide and carbon dioxide.
    const L = [ionic(metal, 'CO3')], R = [ionic(metal, 'O'), 'CO2'];
    return { kind: 'decomp', L, R, co: balance(L, R) };
  }
  function single(metal, salt, ani, charge) {
    const L = [metal, ionic(salt, ani)];
    const R = [ionic(metal, ani, charge), salt === 'H' ? 'H2' : salt];
    return { kind: 'single', L, R, co: balance(L, R) };
  }
  function double(c1, a1, c2, a2) {
    const L = [ionic(c1, a1), ionic(c2, a2)], R = [ionic(c1, a2), ionic(c2, a1)];
    return { kind: 'double', L, R, co: balance(L, R) };
  }
  function burn(f) {
    const L = [f, 'O2'], R = ['CO2', 'H2O'];
    return { kind: 'burn', L, R, co: balance(L, R) };
  }
  const extra = (kind, list) => list.map(([L, R]) => ({ kind, L, R, co: balance(L, R) }));
  /* Pools: each one is a real textbook reaction. Single displacement uses pairs that really go. */
  const POOL = {
    combo: () => [['Na', 'Cl'], ['K', 'Br'], ['Mg', 'O'], ['Ca', 'Cl'], ['Al', 'Cl'], ['Li', 'O'], ['Al', 'O'], ['Zn', 'S'], ['Mg', 'Br'], ['Ca', 'O'], ['Na', 'S'], ['Fe', 'Cl']].map(([m, n]) => combo(m, n)).concat(extra('combo', [[['N2', 'H2'], ['NH3']], [['CaO', 'H2O'], ['Ca(OH)2']], [['SO3', 'H2O'], ['H2SO4']], [['H2', 'O2'], ['H2O']]])),
    decomp: () => ['Ca', 'Mg', 'Zn', 'Cu', 'Ba', 'Pb'].map(decomp).concat(extra('decomp', [[['H2O'], ['H2', 'O2']], [['H2O2'], ['H2O', 'O2']], [['KClO3'], ['KCl', 'O2']], [['NaHCO3'], ['Na2CO3', 'H2O', 'CO2']]])),
    single: () => [['Zn', 'Cu', 'SO4'], ['Fe', 'Cu', 'SO4', 2], ['Mg', 'H', 'Cl'], ['Zn', 'H', 'Cl'], ['Al', 'H', 'Cl'], ['Cu', 'Ag', 'NO3'], ['Zn', 'Ag', 'NO3'], ['Al', 'Cu', 'Cl'], ['Mg', 'Cu', 'SO4'], ['Fe', 'H', 'Cl', 2]].map(([m, s, a, q]) => single(m, s, a, q)).concat(extra('single', [[['Cl2', 'NaBr'], ['NaCl', 'Br2']], [['Br2', 'KI'], ['KBr', 'I2']]])),
    double: () => [['Ag', 'NO3', 'Na', 'Cl'], ['Ba', 'Cl', 'Na', 'SO4'], ['Pb', 'NO3', 'K', 'I'], ['Na', 'OH', 'H', 'Cl'], ['Ca', 'Cl', 'Na', 'CO3'], ['Fe', 'Cl', 'Na', 'OH'], ['Cu', 'SO4', 'Na', 'OH'], ['Ag', 'NO3', 'K', 'Br'], ['Na', 'PO4', 'Ca', 'Cl'], ['K', 'OH', 'H', 'NO3']].map(([a, b, c, d]) => double(a, b, c, d)),
    burn: () => ['CH4', 'C3H8', 'C2H6', 'C4H10', 'C2H4', 'C2H2', 'C5H12', 'C8H18', 'CH3OH', 'C2H5OH'].map(burn),
  };
  const KIND = {
    combo: { name: 'combination', shape: 'Two or more things make one product.' },
    decomp: { name: 'decomposition', shape: 'One reactant breaks into two or more products.' },
    single: { name: 'single displacement', shape: 'A lone element replaces another element in a compound.' },
    double: { name: 'double displacement', shape: 'Two compounds swap partners.' },
    burn: { name: 'combustion', shape: 'A fuel reacts with oxygen, giving carbon dioxide and water.' },
  };
  const ALL = () => Object.keys(POOL).flatMap((k) => POOL[k]());
  /** Show products in a predictable order. Accepts either order when typed. */
  function productForms(R, co) {
    const perms = (list) => (list.length < 2 ? [list] : list.flatMap((x, i) => perms(list.filter((_, k) => k !== i)).map((rest) => [x].concat(rest))));
    const a = R.map((f, i) => cf(co[i]) + f);
    return perms(a).map((x) => x.join('+')).concat(perms(R).map((x) => x.join('+')));
  }
  Bank.reactionChem = { POOL, KIND, ALL, eqTex, balance, ionic, combo, decomp, single, double, burn, cf, productForms, CAT, ANI, NAMES };

  const predict = (x) => {
    const coR = x.co.slice(x.L.length);
    return {
      q: `Predict the products: $\\ce{${x.L.join(' + ')}}$ $\\rightarrow$ ?  Type the products with a + between them. Coefficients are optional.`,
      accept: productForms(x.R, coR),
      placeholder: 'like MgCl2 + H2',
      hint: `This is ${KIND[x.kind].name}: ${KIND[x.kind].shape} Use ion charges to write each formula.`,
      steps: [
        `Pattern: ${KIND[x.kind].name}. ${KIND[x.kind].shape}`,
        `Products: $\\ce{${x.R.join(' + ')}}$. Charges set each subscript.`,
        `Balanced: ${eqTex(x.L, x.R, x.co)}.`,
      ],
    };
  };

  Bank.add('reaction-types', {
    quiz: [
      {
        q: 'Which pattern is a single displacement?',
        options: ['$\\ce{A + B}$ $\\rightarrow$ $\\ce{AB}$', '$\\ce{AB}$ $\\rightarrow$ $\\ce{A + B}$', '$\\ce{A + BC}$ $\\rightarrow$ $\\ce{AC + B}$', '$\\ce{AB + CD}$ $\\rightarrow$ $\\ce{AD + CB}$'],
        answer: 2,
        why: 'One lone element takes the place of another in a compound. The first is combination, the second decomposition, and the last double displacement.',
      },
      {
        q: 'What type is $\\ce{2KClO3}$ $\\rightarrow$ $\\ce{2KCl + 3O2}$?',
        options: ['Combination', 'Decomposition', 'Single displacement', 'Combustion'],
        answer: 1,
        why: 'One reactant breaks into more than one product. $\\ce{O2}$ on the right does not make it combustion: in combustion, $\\ce{O2}$ is on the left.',
      },
      {
        q: 'What type is $\\ce{AgNO3 + NaCl}$ $\\rightarrow$ $\\ce{AgCl + NaNO3}$?',
        options: ['Combination', 'Decomposition', 'Single displacement', 'Double displacement'],
        answer: 3,
        why: 'Two compounds swap partners: silver goes with chloride, and sodium goes with nitrate. No lone element appears on either side.',
      },
      {
        q: 'What products do you expect from $\\ce{Mg + 2HCl}$?',
        options: ['$\\ce{MgH2 + Cl2}$', '$\\ce{MgCl2 + H2}$', '$\\ce{MgCl + H}$', 'No change is possible, as the pattern has no answer'],
        answer: 1,
        why: 'Magnesium takes the place of hydrogen. $\\ce{Mg^2+}$ needs two $\\ce{Cl-}$, and hydrogen leaves as diatomic $\\ce{H2}$.',
      },
      {
        q: 'What is the correct formula when aluminum reacts with chlorine?',
        options: ['$\\ce{AlCl}$', '$\\ce{AlCl2}$', '$\\ce{AlCl3}$', '$\\ce{Al3Cl}$'],
        answer: 2,
        why: '$\\ce{Al^3+}$ needs three $\\ce{Cl-}$ for the charges to cancel. Subscripts come from charges, not from the $\\ce{Cl2}$ you started with.',
      },
      {
        q: 'What does heating calcium carbonate, $\\ce{CaCO3}$, produce?',
        options: ['$\\ce{Ca + C + O2}$', '$\\ce{CaO + CO2}$', '$\\ce{CaC + O3}$', '$\\ce{CaO2 + CO}$'],
        answer: 1,
        why: 'Metal carbonates decompose on heating to the metal oxide and carbon dioxide. Counting atoms: Ca 1, C 1, O 3 on both sides.',
      },
      {
        q: 'A pattern predicts $\\ce{Cu + ZnSO4}$ $\\rightarrow$ $\\ce{CuSO4 + Zn}$. In the lab, nothing happens. Why?',
        options: ['The equation is not balanced', 'Copper is less reactive than zinc, so it cannot displace it', 'Sulfate blocks all reactions', 'Copper is not a metal'],
        answer: 1,
        why: 'A pattern says what would form, not whether it will. The activity series ranks zinc above copper, so only zinc can push copper out, and not the reverse.',
      },
      {
        q: 'Which of these is both combination and combustion?',
        options: ['$\\ce{CH4 + 2O2}$ $\\rightarrow$ $\\ce{CO2 + 2H2O}$', '$\\ce{2H2 + O2}$ $\\rightarrow$ $\\ce{2H2O}$', '$\\ce{2H2O}$ $\\rightarrow$ $\\ce{2H2 + O2}$', '$\\ce{CaO + CO2}$ $\\rightarrow$ $\\ce{CaCO3}$'],
        answer: 1,
        why: 'Hydrogen burns in oxygen, so it is combustion, and it gives one product, so it is also combination.',
      },
    ],
    gens: [
      {
        id: 'classify',
        title: 'Classify the equation',
        make(r) {
          const k = r.pick(Object.keys(POOL)), x = r.pick(POOL[k]());
          const names = Object.keys(KIND).map((K) => KIND[K].name), right = KIND[k].name;
          // Something burning in O2 to one product is both combination and combustion, so combustion cannot be a wrong option.
          const twoHats = k === 'combo' && x.L.includes('O2');
          const mc = r.mc(right, names.filter((n) => n !== right && !(twoHats && n === KIND.burn.name)));
          return {
            q: `What type of reaction is ${eqTex(x.L, x.R, x.co)}?`,
            choices: mc.choices, answer: mc.answer,
            steps: [`Look at the shape: ${x.L.length} on the left, ${x.R.length} on the right.`, `${KIND[k].shape} That is ${right}.`],
          };
        },
      },
      { id: 'p-combo', title: 'Predict: combination', make(r) { return predict(r.pick(POOL.combo())); } },
      { id: 'p-decomp', title: 'Predict: decomposition', make(r) { return predict(r.pick(POOL.decomp())); } },
      { id: 'p-single', title: 'Predict: single displacement', make(r) { return predict(r.pick(POOL.single())); } },
      { id: 'p-double', title: 'Predict: double displacement', make(r) { return predict(r.pick(POOL.double())); } },
      { id: 'p-burn', title: 'Predict: combustion', make(r) { return predict(r.pick(POOL.burn())); } },
      {
        id: 'formula',
        title: 'Write the product formula',
        make(r) {
          const cat = r.pick(['Na', 'K', 'Mg', 'Ca', 'Al', 'Fe', 'Zn', 'Ag']), ani = r.pick(['Cl', 'Br', 'O', 'S', 'NO3', 'SO4', 'OH', 'PO4', 'CO3']);
          const f = ionic(cat, ani), c = CAT[cat], a = ANI[ani];
          const sign = (n) => (n === 1 ? '' : n);
          return {
            q: `Cation $\\ce{${cat}^{${sign(c)}+}}$ meets anion $\\ce{${ani}^{${sign(a)}-}}$. What is the formula of the compound?`,
            accept: [f], placeholder: 'like CaCl2',
            hint: 'The total positive charge must cancel the total negative charge.',
            steps: [`Charges of +${c} and −${a} cancel at a total of ${lcm(c, a)}.`, `That takes ${lcm(c, a) / c} of the cation and ${lcm(c, a) / a} of the anion: $\\ce{${f}}$.`],
          };
        },
      },
    ],
    cards: [
      { front: 'Pattern for combination', back: '$\\ce{A + B}$ $\\rightarrow$ $\\ce{AB}$. Many make one.' },
      { front: 'Pattern for decomposition', back: '$\\ce{AB}$ $\\rightarrow$ $\\ce{A + B}$. One makes many.' },
      { front: 'Pattern for single displacement', back: '$\\ce{A + BC}$ $\\rightarrow$ $\\ce{AC + B}$. A lone element replaces another.' },
      { front: 'Pattern for double displacement', back: '$\\ce{AB + CD}$ $\\rightarrow$ $\\ce{AD + CB}$. Two compounds swap partners.' },
      { front: 'Pattern for combustion', back: 'Fuel + $\\ce{O2}$ $\\rightarrow$ $\\ce{CO2 + H2O}$.' },
      { front: 'What are the four steps for predicting products?', back: 'Name the pattern, swap partners, fix formulas with charges, then balance.' },
      { front: 'What does a metal carbonate give when heated?', back: 'The metal oxide and $\\ce{CO2}$.' },
      { front: 'When does a single displacement really happen?', back: 'When the lone element is more reactive than the one it replaces.' },
      { front: 'When does a double displacement really happen?', back: 'When a solid, a gas or water forms.' },
    ],
    terms: [
      { term: 'Combination reaction', def: 'Two or more substances form one product. Also called synthesis.' },
      { term: 'Decomposition reaction', def: 'One substance breaks down into two or more products.' },
      { term: 'Single displacement', def: 'A lone element replaces another element in a compound.' },
      { term: 'Double displacement', def: 'Two compounds swap partners. Also called metathesis.' },
      { term: 'Neutralization', def: 'An acid and a base react to give a salt and water. It is a kind of double displacement.' },
      { term: 'Precipitate', def: 'A solid that forms when two solutions are mixed.' },
    ],
  });
})();
