/* Question bank for 4.1 Balancing equations. Coefficients are solved by linear algebra and atom-checked. */
(function () {
  'use strict';
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);

  /** Solve for the smallest whole-number coefficients. Throws if there is no unique answer. */
  function solve(L, R) {
    const terms = L.concat(R), counts = terms.map((f) => Bank.countAtoms(f));
    const els = [];
    counts.forEach((c) => Object.keys(c).forEach((e) => { if (!els.includes(e)) els.push(e); }));
    const M = els.map((e) => terms.map((_, j) => (counts[j][e] || 0) * (j < L.length ? 1 : -1)));
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
    if (free.length !== 1) throw new Error('No unique answer for ' + terms.join(' '));
    const f = free[0];
    let D = 1;
    pivots.forEach((c, i) => { D = lcm(D, Math.abs(M[i][c])); });
    const x = new Array(n).fill(0);
    x[f] = D;
    pivots.forEach((c, i) => { x[c] = (-M[i][f] * D) / M[i][c]; });
    const g = x.reduce((a, b) => gcd(a, b), 0);
    const out = x.map((v) => Math.abs(v) / g);
    if (!isBalanced(L, R, out) || out.some((v) => !Number.isInteger(v) || v <= 0)) throw new Error('Check failed for ' + terms.join(' '));
    return out;
  }
  function sides(L, R, co) {
    const lt = {}, rt = {};
    L.forEach((f, i) => { const c = Bank.countAtoms(f); for (const e in c) lt[e] = (lt[e] || 0) + c[e] * co[i]; });
    R.forEach((f, i) => { const c = Bank.countAtoms(f); for (const e in c) rt[e] = (rt[e] || 0) + c[e] * co[L.length + i]; });
    return { lt, rt };
  }
  function isBalanced(L, R, co) {
    const { lt, rt } = sides(L, R, co);
    const keys = new Set([...Object.keys(lt), ...Object.keys(rt)]);
    return [...keys].every((e) => lt[e] === rt[e]);
  }

  /* The balancer's list, in rising difficulty. units are polyatomic ions best counted whole. */
  const E = (level, L, R, units = [], tip = '') => ({ level, L, R, units, tip });
  const EQUATIONS = [
    E(1, ['H2', 'O2'], ['H2O'], [], 'Oxygen is short on the right. Start there.'),
    E(1, ['N2', 'H2'], ['NH3'], [], 'Nitrogen first. The right needs 2 N.'),
    E(1, ['Na', 'Cl2'], ['NaCl'], [], 'Chlorine comes in pairs. Fix it first.'),
    E(1, ['Mg', 'O2'], ['MgO'], [], 'Oxygen comes in pairs, so the right needs 2.'),
    E(2, ['Al', 'O2'], ['Al2O3'], [], 'The right has 3 O and the left comes in 2s. What do 2 and 3 share?'),
    E(2, ['Fe', 'O2'], ['Fe2O3'], [], 'The same 2 and 3 puzzle as aluminum.'),
    E(2, ['KClO3'], ['KCl', 'O2'], [], 'K and Cl already match. Only oxygen needs work.'),
    E(2, ['CH4', 'O2'], ['CO2', 'H2O'], [], 'Carbon, then hydrogen, then oxygen last.'),
    E(3, ['AgNO3', 'Cu'], ['Cu(NO3)2', 'Ag'], ['NO3'], 'Count nitrate as one thing. The scale still weighs real atoms.'),
    E(3, ['Na2SO4', 'BaCl2'], ['BaSO4', 'NaCl'], ['SO4'], 'Sulfate matches already. Look at Na and Cl.'),
    E(3, ['Ca(OH)2', 'HCl'], ['CaCl2', 'H2O'], [], 'Cl first, then hydrogen, then oxygen.'),
    E(3, ['Na3PO4', 'CaCl2'], ['Ca3(PO4)2', 'NaCl'], ['PO4'], 'Start with the biggest formula. Ca, then phosphate, then Na.'),
    E(4, ['C2H6', 'O2'], ['CO2', 'H2O'], [], 'C, then H, then O. You will hit a fraction, so double everything.'),
    E(4, ['Al', 'HCl'], ['AlCl3', 'H2'], [], 'Hydrogen comes in pairs on the right, and Cl in threes. What do 2 and 3 share?'),
    E(4, ['Fe2O3', 'CO'], ['Fe', 'CO2'], [], 'Each CO picks up one O. How many O does Fe2O3 give away?'),
    E(4, ['H3PO4', 'Ca(OH)2'], ['Ca3(PO4)2', 'H2O'], ['PO4'], 'Biggest formula first. Then Ca, then phosphate, then H, then O.'),
    E(4, ['C4H10', 'O2'], ['CO2', 'H2O'], [], 'Same as ethane, with bigger numbers.'),
    E(4, ['NH3', 'O2'], ['NO', 'H2O'], [], 'Nitrogen, then hydrogen, then oxygen. Expect a fraction.'),
  ];
  EQUATIONS.forEach((q) => { q.answer = solve(q.L, q.R); });
  // Extra equations only for the practice gym, so it stays fresh after the balancer is done.
  const EXTRA = [
    [1, ['K', 'Br2'], ['KBr']], [1, ['Ca', 'O2'], ['CaO']], [1, ['H2', 'Cl2'], ['HCl']], [1, ['Li', 'O2'], ['Li2O']], [1, ['Zn', 'HCl'], ['ZnCl2', 'H2']], [1, ['SO2', 'O2'], ['SO3']], [1, ['H2O2'], ['H2O', 'O2']],
    [2, ['P', 'O2'], ['P2O5']], [2, ['Na', 'H2O'], ['NaOH', 'H2']], [2, ['C3H8', 'O2'], ['CO2', 'H2O']], [2, ['NaHCO3'], ['Na2CO3', 'H2O', 'CO2']], [2, ['Fe', 'Cl2'], ['FeCl3']], [2, ['CaCO3', 'HCl'], ['CaCl2', 'CO2', 'H2O']],
    [3, ['Pb(NO3)2', 'KI'], ['PbI2', 'KNO3']], [3, ['Al', 'CuSO4'], ['Al2(SO4)3', 'Cu']], [3, ['Fe(OH)3', 'H2SO4'], ['Fe2(SO4)3', 'H2O']], [3, ['Al2(SO4)3', 'NaOH'], ['Al(OH)3', 'Na2SO4']], [3, ['Ba(NO3)2', 'Na3PO4'], ['Ba3(PO4)2', 'NaNO3']],
    [3, ['C2H5OH', 'O2'], ['CO2', 'H2O']], [3, ['FeS2', 'O2'], ['Fe2O3', 'SO2']], [3, ['C8H18', 'O2'], ['CO2', 'H2O']], [3, ['NO2', 'H2O'], ['HNO3', 'NO']], [3, ['Cu', 'HNO3'], ['Cu(NO3)2', 'NO2', 'H2O']],
  ].map(([level, L, R]) => ({ level, L, R, answer: solve(L, R) }));

  const cf = (n) => (n === 1 ? '' : String(n));
  const sideCe = (fs, co, off = 0) => fs.map((f, i) => cf(co[i + off]) + f).join(' + ');
  /** Rendered equation that can wrap at the arrow on a narrow phone. */
  const eqTex = (L, R, co) => `$\\ce{${sideCe(L, co)}}$ $\\rightarrow$ $\\ce{${sideCe(R, co, L.length)}}$`;
  const bareTex = (L, R) => eqTex(L, R, new Array(L.length + R.length).fill(1));
  const coefForms = (co) => [co.join(','), co.join(', '), co.join(' ')];

  /** The order to fix elements in: rare first, H then O last. Used for hints and worked steps. */
  function fixOrder(L, R) {
    const all = L.concat(R), seen = {};
    all.forEach((f) => Object.keys(Bank.countAtoms(f)).forEach((e) => { seen[e] = (seen[e] || 0) + 1; }));
    const rest = Object.keys(seen).filter((e) => e !== 'H' && e !== 'O').sort((a, b) => seen[a] - seen[b]);
    if (seen.H) rest.push('H');
    if (seen.O) rest.push('O');
    return rest;
  }
  function checkLine(L, R, co) {
    const { lt, rt } = sides(L, R, co);
    return Object.keys(lt).map((e) => `${e}: ${lt[e]} and ${rt[e]}`).join('. ') + '.';
  }
  function balanceProblem(q) {
    const ones = new Array(q.L.length + q.R.length).fill(1);
    const { lt, rt } = sides(q.L, q.R, ones);
    const order = fixOrder(q.L, q.R);
    return {
      q: `Balance ${bareTex(q.L, q.R)}. Type all the coefficients in order, separated by commas. Include any 1s.`,
      accept: coefForms(q.answer),
      placeholder: q.answer.map(() => '?').join(', '),
      hint: `Work through the elements in this order: ${order.join(', ')}. Change only the numbers in front.`,
      steps: [
        `Count with every coefficient at 1. ${Object.keys(lt).map((e) => `${e}: ${lt[e]} and ${rt[e]}`).join('. ')}.`,
        `Fix elements in this order, leaving H and O for last: ${order.join(', ')}.`,
        `The smallest whole numbers that work: ${eqTex(q.L, q.R, q.answer)}.`,
        `Check. ${checkLine(q.L, q.R, q.answer)}`,
      ],
    };
  }
  const POOL = EQUATIONS.concat(EXTRA);
  const byLevel = (a, b) => POOL.filter((q) => q.level >= a && q.level <= b);

  Bank.balancingChem = { solve, sides, isBalanced, EQUATIONS, fixOrder, eqTex, cf };

  Bank.add('balancing', {
    quiz: [
      {
        q: 'Why must a chemical equation be balanced?',
        options: ['So it looks tidy', 'Because atoms are not created or destroyed in a reaction', 'Because molecules are not changed in a reaction', 'Because each side needs the same number of molecules'],
        answer: 1,
        why: 'Atoms only change partners. Molecules do change, and the number of molecules can differ: $\\ce{2H2 + O2}$ has 3 molecules and makes only 2 $\\ce{H2O}$.',
      },
      {
        q: 'How many oxygen atoms are in $\\ce{3Ca(NO3)2}$?',
        options: ['6', '9', '18', '12'],
        answer: 2,
        why: 'Each nitrate has 3 O, the subscript 2 gives 6 O per formula unit, and the coefficient 3 gives 18.',
      },
      {
        q: 'To balance $\\ce{H2 + O2}$ $\\rightarrow$ $\\ce{H2O}$, a student writes $\\ce{H2 + O2}$ $\\rightarrow$ $\\ce{H2O2}$. What is wrong?',
        options: ['The atoms do not match', 'Nothing, it is balanced', 'They changed a subscript, so it describes a different product', 'They should have written $\\ce{H4O2}$'],
        answer: 2,
        why: 'The atoms do match, which is why this trap works. But $\\ce{H2O2}$ is hydrogen peroxide, not water. The only legal change is a coefficient: $\\ce{2H2 + O2}$ $\\rightarrow$ $\\ce{2H2O}$.',
      },
      {
        q: 'Which elements should you usually leave until last?',
        options: ['Metals', 'Carbon and nitrogen', 'Hydrogen and oxygen', 'Whichever has the biggest subscript'],
        answer: 2,
        why: 'H and O tend to appear in several formulas at once, so fixing them early gets undone. Pure $\\ce{O2}$ and $\\ce{H2}$ can also be adjusted without disturbing anything else.',
      },
      {
        q: 'You are balancing and get $\\tfrac{5}{2}\\ce{O2}$. What do you do?',
        options: ['Multiply every coefficient by 2', 'Round to 3', 'Multiply just the $\\ce{O2}$ by 2', 'Start over, because fractions mean a mistake'],
        answer: 0,
        why: 'A fraction is a normal stop on the way. Multiply every term by the denominator so the equation stays balanced.',
      },
      {
        q: 'Which equation is correctly balanced?',
        options: ['$\\ce{Fe + O2}$ $\\rightarrow$ $\\ce{Fe2O3}$', '$\\ce{2Fe + 3O2}$ $\\rightarrow$ $\\ce{2Fe2O3}$', '$\\ce{4Fe + 3O2}$ $\\rightarrow$ $\\ce{2Fe2O3}$', '$\\ce{4Fe + 6O2}$ $\\rightarrow$ $\\ce{2Fe2O3}$'],
        answer: 2,
        why: 'Fe: 4 and $2 \\times 2 = 4$. O: $3 \\times 2 = 6$ and $2 \\times 3 = 6$. The second has 2 Fe on the left and 4 on the right.',
      },
      {
        q: 'In $\\ce{2Na(s) + 2H2O(l)}$ $\\rightarrow$ $\\ce{2NaOH(aq) + H2(g)}$, what does (aq) mean?',
        options: ['It is a liquid', 'It contains water molecules in its formula', 'It is dissolved in water', 'It is a gas in water'],
        answer: 2,
        why: 'Aqueous means dissolved in water. Pure water itself is labeled (l), for liquid.',
      },
      {
        q: 'A balanced equation has the same number of which on both sides?',
        options: ['Molecules', 'Moles of substance', 'Atoms of each element', 'Coefficients'],
        answer: 2,
        why: 'Only atoms of each element, and therefore total mass, must match. The number of molecules or moles can differ.',
      },
    ],
    gens: [
      { id: 'easy', title: 'Balance: warm up', make(r) { return balanceProblem(r.pick(byLevel(1, 1))); } },
      { id: 'medium', title: 'Balance: trickier', make(r) { return balanceProblem(r.pick(byLevel(2, 2))); } },
      { id: 'hard', title: 'Balance: expert', make(r) { return balanceProblem(r.pick(byLevel(3, 4))); } },
      {
        id: 'count',
        title: 'Count the atoms',
        make(r) {
          const [f, parts] = r.pick([['Ca(NO3)2', 'Ca, N, O'], ['Al2(SO4)3', 'Al, S, O'], ['Mg(OH)2', 'Mg, O, H'], ['Fe2(CO3)3', 'Fe, C, O'], ['(NH4)2SO4', 'N, H, S, O'], ['Ca3(PO4)2', 'Ca, P, O'], ['C6H12O6', 'C, H, O'], ['Al(NO3)3', 'Al, N, O'], ['K2Cr2O7', 'K, Cr, O']]);
          void parts;
          const c = r.int(2, 6), counts = Bank.countAtoms(f), el = r.pick(Object.keys(counts));
          const each = counts[el], total = c * each;
          return {
            q: `How many ${EL[el].name.toLowerCase()} atoms are shown by $\\ce{${c}${f}}$?`,
            answer: total, unit: 'atoms', tol: 0.001, answerText: String(total),
            hint: 'Find how many are in one formula, including anything multiplied by parentheses. Then multiply by the coefficient.',
            steps: [`One $\\ce{${f}}$ holds ${each} ${el}.`, `The coefficient multiplies everything: $${c} \\times ${each} = ${total}$.`],
          };
        },
      },
      {
        id: 'is-balanced',
        title: 'Balanced or not?',
        make(r) {
          const q = r.pick(POOL), co = q.answer.slice();
          const broken = r.int(0, 1) === 1;
          if (broken) { const i = r.int(0, co.length - 1); co[i] = co[i] + (co[i] > 1 && r.int(0, 1) ? -1 : 1); }
          const ok = isBalanced(q.L, q.R, co);
          const { lt, rt } = sides(q.L, q.R, co);
          const off = Object.keys(lt).find((e) => lt[e] !== rt[e]);
          return {
            q: `Is this equation balanced? ${eqTex(q.L, q.R, co)}`,
            choices: ['Yes, balanced', 'No, not balanced'], answer: ok ? 0 : 1,
            steps: [`Count each element. ${checkLine(q.L, q.R, co)}`, ok ? 'Every element matches, so it is balanced.' : `${EL[off].name} does not match: ${lt[off]} on the left and ${rt[off]} on the right.`],
          };
        },
      },
      {
        id: 'legal',
        title: 'Which fix is legal?',
        make(r) {
          const q = r.pick(POOL.filter((x) => x.R.length === 1 && x.answer[x.answer.length - 1] > 1));
          const f = q.R[0], c = q.answer[q.answer.length - 1];
          const wrongF = f.replace(/([A-Z][a-z]?)(\d*)$/, (m, s, d) => s + (d ? +d + 1 : 2));
          const right = `Write a coefficient, such as $\\ce{${c}${f}}$`;
          const mc = r.mc(right, [`Change $\\ce{${f}}$ to $\\ce{${wrongF}}$`, `Change the formula on the left by adding a subscript`, `Remove one atom from the right side`]);
          return {
            q: `In ${bareTex(q.L, q.R)}, the atoms do not match. Which change is allowed?`,
            choices: mc.choices, answer: mc.answer,
            steps: ['You may only change coefficients. Changing a subscript turns a substance into a different one, and atoms cannot be erased.', `Done properly, the answer is ${eqTex(q.L, q.R, q.answer)}.`],
          };
        },
      },
      {
        id: 'fractions',
        title: 'Clear the fraction',
        make(r) {
          const pick = r.pick([[['Al', 'O2'], ['Al2O3']], [['Fe', 'O2'], ['Fe2O3']], [['C2H6', 'O2'], ['CO2', 'H2O']], [['C4H10', 'O2'], ['CO2', 'H2O']], [['C2H2', 'O2'], ['CO2', 'H2O']], [['H2', 'O2'], ['H2O']], [['Mg', 'O2'], ['MgO']], [['Na', 'Cl2'], ['NaCl']]]);
          const co = solve(pick[0], pick[1]);
          // Rewrite so that O2 or Cl2 carries the fraction: divide all terms by the coefficient of the second reactant's partner.
          const denom = 2;
          const texOf = (v) => (v % denom === 0 ? (v / denom === 1 ? '' : String(v / denom)) : `\\tfrac{${v}}{${denom}}`);
          const all = pick[0].concat(pick[1]);
          const shown = all.map((f, i) => `${texOf(co[i])}\\ce{${f}}`);
          const left = shown.slice(0, pick[0].length).join(' + '), right = shown.slice(pick[0].length).join(' + ');
          return {
            q: `Someone wrote $${left} \\rightarrow ${right}$. Type the smallest whole-number coefficients in order, separated by commas.`,
            accept: coefForms(co),
            placeholder: co.map(() => '?').join(', '),
            hint: 'Multiply every coefficient by the denominator.',
            steps: [`The denominators are 2, so multiply every term by 2.`, `Result: ${eqTex(pick[0], pick[1], co)}.`, `Check. ${checkLine(pick[0], pick[1], co)}`],
          };
        },
      },
      {
        id: 'phase',
        title: 'Read the tags',
        make(r) {
          // Each tag only appears on substances that really occur that way, so nobody meets H2O(aq) or AgCl(g).
          const set = [['$\\text{(aq)}$', 'dissolved in water', ['NaCl', 'CO2', 'HCl']], ['$\\text{(s)}$', 'a solid', ['NaCl', 'Fe', 'AgCl']], ['$\\text{(g)}$', 'a gas', ['CO2', 'H2O', 'HCl']], ['$\\text{(l)}$', 'a pure liquid', ['H2O']]];
          const [tag, right, subs] = r.pick(set);
          const mc = r.mc(right, set.map((x) => x[1]).filter((x) => x !== right));
          const ex = `$\\ce{${r.pick(subs)}}$`;
          return {
            q: `In an equation you see ${ex}${tag}. What does the tag say?`,
            choices: mc.choices, answer: mc.answer,
            steps: [`${tag} means ${right}.`, 'Tags tell you the state of each substance. They never change how you balance.'],
          };
        },
      },
    ],
    cards: [
      { front: 'What must match on both sides of a balanced equation?', back: 'The number of atoms of each element.' },
      { front: 'What can you change to balance an equation?', back: 'Only coefficients. Never subscripts.' },
      { front: 'What does a coefficient do?', back: 'It multiplies every atom in the formula that follows it.' },
      { front: 'How many O atoms in $\\ce{2Al2(SO4)3}$?', back: '$2 \\times 3 \\times 4 = 24$.' },
      { front: 'What order should you balance elements in?', back: 'Biggest formula first, then rare elements, polyatomic ions as units, then H, then O.' },
      { front: 'What do you do with a fractional coefficient?', back: 'Multiply every coefficient by the denominator.' },
      { front: 'Balance $\\ce{H2 + O2}$ $\\rightarrow$ $\\ce{H2O}$.', back: '$\\ce{2H2 + O2}$ $\\rightarrow$ $\\ce{2H2O}$' },
      { front: 'Balance $\\ce{Al + O2}$ $\\rightarrow$ $\\ce{Al2O3}$.', back: '$\\ce{4Al + 3O2}$ $\\rightarrow$ $\\ce{2Al2O3}$' },
      { front: 'What do (s), (l), (g) and (aq) mean?', back: 'Solid, liquid, gas, and dissolved in water.' },
    ],
    terms: [
      { term: 'Chemical equation', def: 'A symbolic record of a reaction, with reactants on the left and products on the right.' },
      { term: 'Reactant', def: 'A substance present before a reaction, written on the left.' },
      { term: 'Product', def: 'A substance formed by a reaction, written on the right.' },
      { term: 'Coefficient', def: 'The number in front of a formula. It multiplies every atom in that formula.' },
      { term: 'Subscript', def: 'The small number after an atom or group in a formula. It is part of what the substance is, so you never change it to balance.' },
      { term: 'Law of conservation of mass', def: 'Matter is not created or destroyed in a chemical reaction, so total mass stays the same.' },
      { term: 'Balanced equation', def: 'An equation with the same number of atoms of each element on both sides, using the smallest whole-number coefficients.' },
      { term: 'Aqueous', def: 'Dissolved in water. Written (aq) in an equation.' },
    ],
  });
})();
