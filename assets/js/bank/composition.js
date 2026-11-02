/* Question bank for 3.2 Formulas from data. Everything is computed from real formulas and the element table. */
(function () {
  'use strict';
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const M = (s) => EL[s].mass;
  /** Atomic mass as a student would write it: hydrogen keeps its third decimal. */
  const AM = (s) => (s === 'H' ? '1.008' : EL[s].mass.toFixed(2));
  const orderOf = (f) => { const o = []; f.replace(/[A-Z][a-z]?/g, (m) => { if (!o.includes(m)) o.push(m); return m; }); return o; };
  const fmt = (sym, n) => sym + (n === 1 ? '' : n);

  /** Smallest whole-number formula from a molecular formula string. */
  function reduce(f) {
    const c = Bank.countAtoms(f), syms = orderOf(f);
    const k = syms.map((s) => c[s]).reduce((a, b) => gcd(a, b));
    return { f: syms.map((s) => fmt(s, c[s] / k)).join(''), n: k };
  }
  /** Run the pipeline. rows: [{ sym, grams }]. Returns every stage, or fails with k = 0 when no simple ratio exists. */
  function pipeline(rows) {
    const out = rows.map((r) => ({ sym: r.sym, grams: r.grams, mol: r.grams / M(r.sym) }));
    const small = Math.min(...out.map((r) => r.mol));
    out.forEach((r) => { r.ratio = r.mol / small; });
    let k = 0;
    for (let t = 1; t <= 8; t++) { if (out.every((r) => Math.abs(r.ratio * t - Math.round(r.ratio * t)) < 0.075 && Math.round(r.ratio * t) >= 1)) { k = t; break; } }
    out.forEach((r) => { r.whole = k ? Math.round(r.ratio * k) : 0; });
    return { rows: out, small, k, f: k ? out.map((r) => fmt(r.sym, r.whole)).join('') : '' };
  }
  function percents(f) {
    const c = Bank.countAtoms(f), total = Bank.molarMass(f);
    return orderOf(f).map((s) => ({ sym: s, n: c[s], mass: c[s] * M(s), pct: (100 * c[s] * M(s)) / total }));
  }
  /** Combustion analysis data for a compound of C, H and maybe O. */
  function burnData(f, sample) {
    const c = Bank.countAtoms(f), MF = Bank.molarMass(f), mol = sample / MF;
    return { co2: mol * c.C * Bank.molarMass('CO2'), h2o: (mol * c.H * Bank.molarMass('H2O')) / 2, sample };
  }
  /** Work a burn back to its formula, the way a student would. */
  function burnBack(co2, h2o, sample) {
    const nCO2 = co2 / Bank.molarMass('CO2'), nH2O = h2o / Bank.molarMass('H2O');
    const nC = nCO2, nH = 2 * nH2O, gC = nC * M('C'), gH = nH * M('H'), gO = Math.max(0, sample - gC - gH);
    const hasO = gO > sample * 0.005, nO = hasO ? gO / M('O') : 0;
    const rows = [{ sym: 'C', grams: gC }, { sym: 'H', grams: gH }];
    if (hasO) rows.push({ sym: 'O', grams: gO });
    return { nCO2, nH2O, nC, nH, gC, gH, gO, nO, hasO, res: pipeline(rows) };
  }
  Bank.compositionChem = { reduce, pipeline, percents, burnData, burnBack, orderOf, AM };

  const COMPOUNDS = [
    ['glucose', 'C6H12O6'], ['acetic acid', 'C2H4O2'], ['lactic acid', 'C3H6O3'], ['hydrogen peroxide', 'H2O2'], ['benzene', 'C6H6'], ['butane', 'C4H10'], ['propane', 'C3H8'], ['octane', 'C8H18'],
    ['dinitrogen tetroxide', 'N2O4'], ['iron(III) oxide', 'Fe2O3'], ['iron(II,III) oxide', 'Fe3O4'], ['aluminum oxide', 'Al2O3'], ['tetraphosphorus decoxide', 'P4O10'], ['potassium permanganate', 'KMnO4'], ['calcium carbonate', 'CaCO3'], ['sodium sulfate', 'Na2SO4'],
    ['ascorbic acid', 'C6H8O6'], ['ethyl acetate', 'C4H8O2'], ['copper(I) oxide', 'Cu2O'], ['chromium(III) oxide', 'Cr2O3'], ['manganese(VII) oxide', 'Mn2O7'], ['ethanol', 'C2H6O'], ['acetone', 'C3H6O'],
  ];
  const stepsFor = (res, rows) => {
    const sm = res.small, mid = res.rows;
    const lines = [
      `Assume a 100 g sample, so each percent becomes grams: ${rows.map((r) => `${r.grams.toFixed(2)} g ${r.sym}`).join(', ')}.`,
      `Divide by atomic mass to get moles: ${mid.map((r) => `$${r.grams.toFixed(2)} \\div ${AM(r.sym)} = ${r.mol.toFixed(3)}$ mol ${r.sym}`).join('; ')}.`,
      `Divide by the smallest, ${sm.toFixed(3)}: ${mid.map((r) => `${r.sym} ${r.ratio.toFixed(2)}`).join(', ')}.`,
    ];
    if (res.k > 1) lines.push(`Those are not all whole, so multiply each by ${res.k}: ${mid.map((r) => `${r.sym} ${(r.ratio * res.k).toFixed(2)}`).join(', ')}.`);
    lines.push(`The formula is $\\ce{${res.f}}$.`);
    return lines;
  };
  function empiricalProblem(r, pool) {
    const f = r.pick(pool)[1];
    const want = reduce(f).f, P = percents(f);
    const rows = P.map((x) => ({ sym: x.sym, grams: +x.pct.toFixed(2) }));
    const res = pipeline(rows);
    if (res.f !== want) throw new Error(`Pipeline gave ${res.f} for ${f}`);
    return {
      q: `A compound is ${P.map((x) => `${x.pct.toFixed(2)}% ${EL[x.sym].name.toLowerCase()}`).join(', ')} by mass. What is its empirical formula?`,
      accept: [want], placeholder: 'like CH2O',
      hint: 'Percent to mass, mass to mole, divide by small, multiply till whole.',
      steps: stepsFor(res, rows),
    };
  }
  const multiplierPool = COMPOUNDS.filter(([, f]) => { const p = pipeline(percents(f).map((x) => ({ sym: x.sym, grams: x.pct }))); return p.k > 1; });
  const simplePool = COMPOUNDS.filter(([, f]) => { const p = pipeline(percents(f).map((x) => ({ sym: x.sym, grams: x.pct }))); return p.k === 1; });
  const molPool = COMPOUNDS.filter(([, f]) => reduce(f).n > 1);
  const burnPool = COMPOUNDS.filter(([, f]) => { const c = Bank.countAtoms(f); return c.C && c.H && Object.keys(c).every((e) => 'CHO'.includes(e)); });

  Bank.add('composition', {
    quiz: [
      {
        q: 'Water, $\\ce{H2O}$, is 2 H atoms and 1 O atom. About what percent of its mass is hydrogen?',
        options: ['67%', '50%', '33%', '11%'],
        answer: 3,
        why: 'Hydrogen is $2(1.008) = 2.016$ out of 18.02, or 11.2%. The 67% is the share by count, not by mass.',
      },
      {
        q: 'What does an empirical formula show?',
        options: ['The exact number of atoms in one molecule', 'The smallest whole-number ratio of atoms', 'The percent by mass of each element', 'The shape of the molecule'],
        answer: 1,
        why: 'The molecular formula gives the real count. $\\ce{C6H12O6}$ and $\\ce{CH2O}$ share one empirical formula, $\\ce{CH2O}$.',
      },
      {
        q: 'Why do you convert grams to moles when finding an empirical formula?',
        options: ['Subscripts count atoms, and moles count atoms', 'Grams are hard to divide', 'It makes the numbers smaller', 'Formulas are always written in moles'],
        answer: 0,
        why: 'A mole is a count. So a mole ratio is an atom ratio, and that is what a subscript is. Mass ratios are not atom ratios, because atoms differ in mass.',
      },
      {
        q: 'After dividing by the smallest, you get C 1.00, H 1.33, O 1.00. What is next?',
        options: ['Round H to 1', 'Multiply all by 3', 'Multiply only H by 3', 'Divide all by 1.33'],
        answer: 1,
        why: '1.33 is a sign of thirds. Multiplying everything by 3 gives 3 : 4 : 3, so $\\ce{C3H4O3}$. Rounding throws away real information.',
      },
      {
        q: 'A compound has empirical formula $\\ce{CH2}$ and molar mass 56.1 g/mol. What is its molecular formula?',
        options: ['$\\ce{CH2}$', '$\\ce{C2H4}$', '$\\ce{C3H6}$', '$\\ce{C4H8}$'],
        answer: 3,
        why: '$\\ce{CH2}$ has a mass of about 14.03. $56.1 \\div 14.03 = 4$, so multiply every subscript by 4.',
      },
      {
        q: 'In a combustion analysis, you collected 0.10 mol of $\\ce{H2O}$. How many moles of H were in the sample?',
        options: ['0.05 mol', '0.10 mol', '0.20 mol', '0.30 mol'],
        answer: 2,
        why: 'Each water molecule holds 2 H, so moles of H is twice moles of $\\ce{H2O}$.',
      },
      {
        q: 'In combustion analysis, how do you find the oxygen in the original sample?',
        options: ['From the mass of $\\ce{CO2}$', 'From the mass of $\\ce{H2O}$', 'Subtract the mass of C and H from the sample mass', 'Weigh the $\\ce{O2}$ supplied'],
        answer: 2,
        why: 'Most of the O in the products came from the $\\ce{O2}$ supply, so it says nothing direct about the sample. Subtraction gets you what is left over.',
      },
      {
        q: 'Which pair of compounds have the same percent composition?',
        options: ['$\\ce{CO}$ and $\\ce{CO2}$', '$\\ce{C2H4}$ and $\\ce{C3H6}$', '$\\ce{H2O}$ and $\\ce{H2O2}$', '$\\ce{NO}$ and $\\ce{NO2}$'],
        answer: 1,
        why: 'Both reduce to the empirical formula $\\ce{CH2}$. The same ratio of atoms means the same mass percentages.',
      },
    ],
    gens: [
      {
        id: 'percent',
        title: 'Percent by mass',
        make(r) {
          const [name, f] = r.pick(COMPOUNDS);
          const P = percents(f), el = r.pick(P);
          // Work with the atomic masses as printed, so that "6 x 16.00" shows 96.00 and the steps add up.
          const shown = (x) => x.n * +AM(x.sym), total = P.reduce((a, x) => a + shown(x), 0), elMass = shown(el), pct = (100 * elMass) / total;
          return {
            q: `What is the percent by mass of ${EL[el.sym].name.toLowerCase()} in ${name}, $\\ce{${f}}$?`,
            answer: pct, unit: '%', tol: 0.015, answerText: pct.toFixed(1),
            hint: 'Multiply the atomic mass by how many of that atom are in the formula, divide by the molar mass, then multiply by 100.',
            steps: [
              `Molar mass of $\\ce{${f}}$: ${P.map((x) => `${x.n}(${AM(x.sym)})`).join(' + ')} = ${total.toFixed(2)} g/mol.`,
              `Mass of ${el.sym} in the formula: $${el.n} \\times ${AM(el.sym)} = ${elMass.toFixed(2)}$ g.`,
              `Percent: $\\dfrac{${elMass.toFixed(2)}}{${total.toFixed(2)}} \\times 100 = ${pct.toFixed(1)}\\%$.`,
            ],
          };
        },
      },
      {
        id: 'grams-in',
        title: 'Grams of an element',
        make(r) {
          const [name, f] = r.pick(COMPOUNDS);
          const P = percents(f), el = r.pick(P), g = r.num(5, 200, 1), ans = (g * el.pct) / 100;
          return {
            q: `How many grams of ${EL[el.sym].name.toLowerCase()} are in ${g} g of ${name}, $\\ce{${f}}$?`,
            answer: ans, unit: 'g', tol: 0.02,
            hint: 'Find the percent by mass first, then take that percent of the sample.',
            steps: [`${el.sym} is ${el.pct.toFixed(1)}% of the mass of $\\ce{${f}}$.`, `$${g}\\text{ g} \\times \\dfrac{${el.pct.toFixed(1)}}{100} = ${Lab.sig(ans, 3)}\\text{ g}$.`],
          };
        },
      },
      { id: 'empirical', title: 'Empirical formula', make(r) { return empiricalProblem(r, simplePool); } },
      { id: 'multiply', title: 'Empirical, multiply till whole', make(r) { return empiricalProblem(r, multiplierPool); } },
      {
        id: 'molecular',
        title: 'Molecular formula',
        make(r) {
          const [name, f] = r.pick(molPool);
          const e = reduce(f), Me = Bank.molarMass(e.f), MF = Bank.molarMass(f), c = Bank.countAtoms(f);
          const accept = [orderOf(f).map((s) => fmt(s, c[s])).join('')];
          return {
            q: `The empirical formula of ${name} is $\\ce{${e.f}}$, and its molar mass is ${MF.toFixed(2)} g/mol. What is its molecular formula?`,
            accept, placeholder: 'like C6H12O6',
            hint: 'Divide the molar mass by the mass of one empirical unit. Multiply every subscript by the result.',
            steps: [`Mass of one $\\ce{${e.f}}$ unit: ${Me.toFixed(2)} g/mol.`, `$n = ${MF.toFixed(2)} \\div ${Me.toFixed(2)} = ${e.n}$.`, `Multiply every subscript by ${e.n}: $\\ce{${accept[0]}}$.`],
          };
        },
      },
      {
        id: 'burn',
        title: 'Combustion analysis',
        make(r) {
          const f = r.pick(burnPool)[1];
          const sample = r.num(0.5, 3, 2), d = burnData(f, sample);
          const co2 = +d.co2.toFixed(3), h2o = +d.h2o.toFixed(3);
          const b = burnBack(co2, h2o, sample), want = reduce(f).f;
          if (b.res.f !== want) throw new Error(`Burn gave ${b.res.f} for ${f}`);
          return {
            q: `Burning ${sample.toFixed(2)} g of a compound of carbon, hydrogen${b.hasO ? ' and oxygen' : ''} gives ${co2.toFixed(3)} g of $\\ce{CO2}$ and ${h2o.toFixed(3)} g of $\\ce{H2O}$. What is its empirical formula?`,
            accept: [want], placeholder: 'like C2H6O',
            hint: 'Moles of C equals moles of CO2. Moles of H is twice moles of H2O. Subtract to find any O, then divide by the smallest.',
            steps: [
              `Carbon: $${co2} \\div 44.01 = ${b.nC.toFixed(4)}$ mol C, which is ${b.gC.toFixed(3)} g.`,
              `Hydrogen: $${h2o} \\div 18.02 = ${b.nH2O.toFixed(4)}$ mol $\\ce{H2O}$, so ${b.nH.toFixed(4)} mol H, which is ${b.gH.toFixed(3)} g.`,
              b.hasO ? `Oxygen by subtraction: $${sample.toFixed(2)} - ${b.gC.toFixed(3)} - ${b.gH.toFixed(3)} = ${b.gO.toFixed(3)}$ g, which is ${b.nO.toFixed(4)} mol.` : `Carbon and hydrogen account for the whole sample, so there is no oxygen.`,
              `Divide by the smallest: ${b.res.rows.map((x) => `${x.sym} ${x.ratio.toFixed(2)}`).join(', ')}.${b.res.k > 1 ? ` Multiply by ${b.res.k}.` : ''}`,
              `Empirical formula: $\\ce{${want}}$.`,
            ],
          };
        },
      },
      {
        id: 'n-value',
        title: 'How many units?',
        make(r) {
          const [name, f] = r.pick(molPool);
          const e = reduce(f), Me = Bank.molarMass(e.f), MF = Bank.molarMass(f);
          return {
            q: `${name[0].toUpperCase() + name.slice(1)} has the empirical formula $\\ce{${e.f}}$ and a molar mass of ${MF.toFixed(1)} g/mol. By what whole number do you multiply the subscripts?`,
            answer: e.n, tol: 0.001, answerText: String(e.n),
            hint: 'Divide the molar mass by the empirical formula mass.',
            steps: [`Empirical mass of $\\ce{${e.f}}$: ${Me.toFixed(2)} g/mol.`, `$${MF.toFixed(1)} \\div ${Me.toFixed(2)} = ${e.n}$.`],
          };
        },
      },
    ],
    cards: [
      { front: 'How do you find percent by mass?', back: '$n \\times$ atomic mass $\\div$ molar mass $\\times$ 100.' },
      { front: 'What is an empirical formula?', back: 'The smallest whole-number ratio of atoms in a compound.' },
      { front: 'What are the four steps from percent to empirical formula?', back: 'Percent to mass, mass to mole, divide by small, multiply till whole.' },
      { front: 'A ratio comes out as 1.5. What do you do?', back: 'Multiply all the ratios by 2. Never round it.' },
      { front: 'A ratio comes out as 1.33. What do you do?', back: 'Multiply all the ratios by 3.' },
      { front: 'How do you go from empirical to molecular formula?', back: '$n$ = molar mass $\\div$ empirical formula mass. Multiply each subscript by $n$.' },
      { front: 'In combustion analysis, how do you get moles of C?', back: 'Moles of C = moles of $\\ce{CO2}$.' },
      { front: 'In combustion analysis, how do you get moles of H?', back: 'Moles of H = 2 $\\times$ moles of $\\ce{H2O}$.' },
      { front: 'In combustion analysis, how do you find O in the sample?', back: 'Subtract the mass of C and H from the mass of the sample.' },
    ],
    terms: [
      { term: 'Percent composition', def: 'The percent by mass of each element in a compound.' },
      { term: 'Empirical formula', def: 'The smallest whole-number ratio of atoms in a compound.' },
      { term: 'Molecular formula', def: 'The actual number of atoms of each element in one molecule.' },
      { term: 'Combustion analysis', def: 'Finding a formula by burning a weighed sample and weighing the $\\ce{CO2}$ and $\\ce{H2O}$ it makes.' },
      { term: 'Empirical formula mass', def: 'The sum of the atomic masses in an empirical formula.' },
    ],
  });
})();
