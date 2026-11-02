/* Question bank for 4.5 Limiting reactants and yield. Every equation is checked for balance when this file loads. */
(function () {
  'use strict';
  const parse = (s) => {
    const side = (x) => x.split(' + ').map((t) => { const m = /^(\d*)(.+)$/.exec(t.trim()); return { n: m[1] ? +m[1] : 1, f: m[2] }; });
    const [l, r] = s.split(' -> ');
    const rx = { s, r: side(l), p: side(r) };
    const tally = (list) => { const c = {}; list.forEach(({ n, f }) => { const a = Bank.countAtoms(f); for (const e in a) c[e] = (c[e] || 0) + a[e] * n; }); return c; };
    const a = tally(rx.r), b = tally(rx.p);
    Object.keys(Object.assign({}, a, b)).forEach((e) => { if (a[e] !== b[e]) throw new Error('Unbalanced equation: ' + s); });
    return rx;
  };
  /* Each has exactly two reactants. */
  const RX = [
    '2H2 + O2 -> 2H2O', 'N2 + 3H2 -> 2NH3', 'CH4 + 2O2 -> CO2 + 2H2O', 'C3H8 + 5O2 -> 3CO2 + 4H2O', '2Mg + O2 -> 2MgO',
    '4Al + 3O2 -> 2Al2O3', '2Al + 3Cl2 -> 2AlCl3', '4Fe + 3O2 -> 2Fe2O3', 'Zn + I2 -> ZnI2', '2Na + Cl2 -> 2NaCl',
    'Fe2O3 + 3CO -> 2Fe + 3CO2', '2Al + Fe2O3 -> Al2O3 + 2Fe', 'Zn + 2HCl -> ZnCl2 + H2', 'CaCO3 + 2HCl -> CaCl2 + H2O + CO2', '2NO + O2 -> 2NO2',
    '2SO2 + O2 -> 2SO3', 'CO + 2H2 -> CH3OH', 'SiO2 + 2C -> Si + 2CO', 'AgNO3 + NaCl -> AgCl + NaNO3', 'BaCl2 + Na2SO4 -> BaSO4 + 2NaCl',
    'H2 + Cl2 -> 2HCl', 'Mg + 2HCl -> MgCl2 + H2', '2Al + 6HCl -> 2AlCl3 + 3H2', 'TiCl4 + 2Mg -> Ti + 2MgCl2', '2KI + Pb(NO3)2 -> PbI2 + 2KNO3',
  ].map(parse);
  const COUNTABLE = RX.filter((x) => /^(2H2 \+ O2|N2 \+ 3H2|CH4 \+ 2O2|2Na \+ Cl2|2NO \+ O2|2SO2 \+ O2|CO \+ 2H2|H2 \+ Cl2)/.test(x.s));
  const M = (f) => Bank.molarMass(f);
  const ce = (f) => `\\ce{${f}}`;
  const eqT = (rx) => `\\ce{${rx.s}}`;
  const m2 = (f) => M(f).toFixed(2);
  const sup = /\s*×\s*10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/;
  const tn = (x, n = 3) => Lab.sig(x, n).replace(sup, (m, e) => ' \\times 10^{' + e.replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => '-0123456789'['⁻⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)]) + '}');

  /** Pick a reaction and masses with a clear limiting reactant. surprise: limiting one has more grams. */
  function makeCase(r, o = {}) {
    for (let tries = 0; tries < 200; tries++) {
      const rx = r.pick(RX);
      const [A, B] = rx.r;
      const ga = +r.num(M(A.f) * 0.1, M(A.f) * 1.8, 3).toPrecision(3), gb = +r.num(M(B.f) * 0.1, M(B.f) * 1.8, 3).toPrecision(3);
      const na = ga / M(A.f), nb = gb / M(B.f), ra = na / A.n, rb = nb / B.n;
      const hi = Math.max(ra, rb), lo = Math.min(ra, rb);
      if (hi / lo < 1.2 || hi / lo > 5) continue;
      const limA = ra < rb;
      const moreMass = limA ? ga > gb : gb > ga;
      if (o.surprise && !moreMass) continue;
      const L = limA ? A : B, E = limA ? B : A;
      return { rx, A, B, ga, gb, na, nb, ra, rb, L, E, limA, runs: lo, moreMass, gL: limA ? ga : gb, gE: limA ? gb : ga, nL: limA ? na : nb, nE: limA ? nb : na };
    }
    throw new Error('No case found');
  }
  const toMoles = (c) => [
    `Change both to moles. $${ce(c.A.f)}$: $${tn(c.ga)}\\ \\cancel{\\text{g}} \\times \\dfrac{1\\text{ mol}}{${m2(c.A.f)}\\ \\cancel{\\text{g}}} = ${tn(c.na, 4)}\\text{ mol}$. $${ce(c.B.f)}$: $${tn(c.gb)}\\ \\cancel{\\text{g}} \\times \\dfrac{1\\text{ mol}}{${m2(c.B.f)}\\ \\cancel{\\text{g}}} = ${tn(c.nb, 4)}\\text{ mol}$.`,
  ];
  const runsStep = (c) => `Divide each by its coefficient. $${ce(c.A.f)}$: $${tn(c.na, 4)} \\div ${c.A.n} = ${tn(c.ra, 4)}$. $${ce(c.B.f)}$: $${tn(c.nb, 4)} \\div ${c.B.n} = ${tn(c.rb, 4)}$. The smaller is <b>$${ce(c.L.f)}$</b>, so it is limiting.`;

  Bank.add('limiting', {
    quiz: [
      {
        q: 'What is the limiting reactant?',
        options: ['The reactant with the smallest mass', 'The reactant that runs out first', 'The reactant with the smallest coefficient', 'The reactant listed first in the equation'],
        answer: 1,
        why: 'It runs out first, so the reaction stops. Mass and coefficient alone cannot tell you. You need moles compared with the coefficients.',
      },
      {
        q: 'In $\\ce{2H2 + O2 -> 2H2O}$, you mix 4 molecules of $\\ce{H2}$ with 6 molecules of $\\ce{O2}$. What is present at the end?',
        options: ['4 $\\ce{H2O}$ only', '4 $\\ce{H2O}$ and 4 $\\ce{O2}$', '6 $\\ce{H2O}$ and 1 $\\ce{H2}$', '10 $\\ce{H2O}$'],
        answer: 1,
        why: '4 $\\ce{H2}$ needs only 2 $\\ce{O2}$, so it makes 4 $\\ce{H2O}$. That leaves $6 - 2 = 4$ $\\ce{O2}$ unused. The $\\ce{H2}$ is limiting, even though the $\\ce{O2}$ was used too.',
      },
      {
        q: 'A student says "I have 20 g of $\\ce{I2}$ and 10 g of Zn, so Zn must be limiting." The reaction is $\\ce{Zn + I2 -> ZnI2}$. Are they right?',
        options: ['Yes, because Zn has the smaller mass', 'Yes, because Zn is listed first', 'No. $\\ce{I2}$ is limiting, because 20 g of it is fewer moles than 10 g of Zn', 'No. Neither is limiting, because the coefficients are equal'],
        answer: 2,
        why: '20 g of $\\ce{I2}$ is 0.079 mol, and 10 g of Zn is 0.153 mol. With a 1 to 1 recipe, $\\ce{I2}$ runs out first. Grams alone can never decide this.',
      },
      {
        q: 'Which statement about the excess reactant is true?',
        options: ['It does not react at all', 'It reacts until the limiting reactant is gone, and some is left', 'It always has more grams than the limiting reactant', 'It always has more moles than the limiting reactant'],
        answer: 1,
        why: 'The excess reactant is used too, just not completely. It can have fewer moles than the limiting reactant: in $\\ce{N2 + 3H2 -> 2NH3}$, 2 mol $\\ce{N2}$ with 3 mol $\\ce{H2}$ leaves $\\ce{N2}$ in excess.',
      },
      {
        q: 'Can both reactants be completely used up?',
        options: ['Never', 'Always', 'Yes, when they are mixed in the exact ratio of the coefficients', 'Yes, whenever they have equal masses'],
        answer: 2,
        why: 'If the moles match the coefficients exactly, both run out together. Equal masses almost never do that.',
      },
      {
        q: 'Using method 2, one reactant could make 12.0 g of product and the other could make 8.0 g. How much product really forms?',
        options: ['20.0 g', '12.0 g', '10.0 g', '8.0 g'],
        answer: 3,
        why: 'The reaction stops when the first reactant runs out. The smaller amount is the real one, and the two are never added together.',
      },
      {
        q: 'What is the theoretical yield?',
        options: ['What you measure at the end of an experiment', 'The most product you can make, calculated from the limiting reactant', 'The total mass of all the reactants', 'The product you could make from the excess reactant'],
        answer: 1,
        why: 'It is a calculated maximum, based on the limiting reactant. The measured amount is the actual yield.',
      },
      {
        q: 'A student finds a percent yield of 108%. What is the most likely reason?',
        options: ['The product is still wet or impure', 'Extra atoms formed during the reaction', 'The reaction was very efficient', 'The limiting reactant was used correctly'],
        answer: 0,
        why: 'Atoms cannot appear from nowhere. A yield over 100% almost always means extra mass such as water, or an error in the calculation.',
      },
    ],

    gens: [
      {
        id: 'count-molecules',
        title: 'Count the molecules',
        make(r) {
          const rx = r.pick(COUNTABLE);
          const [A, B] = rx.r, P = rx.p[0];
          let na, nb, runsA, runsB;
          do { na = A.n * r.int(1, 6); nb = B.n * r.int(1, 6); runsA = na / A.n; runsB = nb / B.n; } while (runsA === runsB);
          const limA = runsA < runsB, runs = Math.min(runsA, runsB), L = limA ? A : B, E = limA ? B : A;
          const made = runs * P.n, left = (limA ? nb : na) - runs * E.n;
          return {
            q: `A container holds ${na} molecules or atoms of $${ce(A.f)}$ and ${nb} of $${ce(B.f)}$. They react by $${eqT(rx)}$. How many $${ce(P.f)}$ can form?`,
            answer: made, unit: 'units', tol: 0.001, answerText: String(made),
            hint: 'Divide what you have by each coefficient to see how many times the recipe runs.',
            steps: [
              `Recipe runs from $${ce(A.f)}$: $${na} \\div ${A.n} = ${runsA}$. Recipe runs from $${ce(B.f)}$: $${nb} \\div ${B.n} = ${runsB}$.`,
              `The smaller number wins, so $${ce(L.f)}$ is limiting and the recipe runs ${runs} times.`,
              `Each run makes ${P.n} $${ce(P.f)}$, so $${runs} \\times ${P.n} = ${made}$ form. Left over: ${left} of $${ce(E.f)}$.`,
            ],
          };
        },
      },
      {
        id: 'which-limiting-mol',
        title: 'Which is limiting? (moles)',
        make(r) {
          const c = (function () {
            for (;;) {
              const rx = r.pick(RX), [A, B] = rx.r;
              const na = r.num(0.2, 4, 2), nb = r.num(0.2, 4, 2);
              const ra = na / A.n, rb = nb / B.n, hi = Math.max(ra, rb), lo = Math.min(ra, rb);
              if (hi / lo >= 1.2) return { rx, A, B, na, nb, ra, rb, limA: ra < rb };
            }
          })();
          const right = `$${ce(c.limA ? c.A.f : c.B.f)}$`, wrong = `$${ce(c.limA ? c.B.f : c.A.f)}$`;
          const mc = r.mc(right, [wrong, 'Neither, both run out together']);
          return {
            q: `In $${eqT(c.rx)}$, you mix ${c.na} mol of $${ce(c.A.f)}$ with ${c.nb} mol of $${ce(c.B.f)}$. Which is the limiting reactant?`,
            choices: mc.choices, answer: mc.answer,
            steps: [
              `Divide each by its coefficient. $${ce(c.A.f)}$: $${c.na} \\div ${c.A.n} = ${tn(c.ra)}$. $${ce(c.B.f)}$: $${c.nb} \\div ${c.B.n} = ${tn(c.rb)}$.`,
              `The smaller number belongs to ${right}, so it runs out first.`,
            ],
          };
        },
      },
      {
        id: 'which-limiting-g',
        title: 'Which is limiting? (grams)',
        make(r) {
          const c = makeCase(r, { surprise: r.next() < 0.6 });
          const right = `$${ce(c.L.f)}$`, wrong = `$${ce(c.E.f)}$`;
          const mc = r.mc(right, [wrong, 'Neither, both run out together']);
          return {
            q: `In $${eqT(c.rx)}$, you mix ${tn(c.ga)} g of $${ce(c.A.f)}$ with ${tn(c.gb)} g of $${ce(c.B.f)}$. Which is the limiting reactant?`,
            choices: mc.choices, answer: mc.answer,
            steps: [...toMoles(c), runsStep(c), c.moreMass ? `Notice that ${right} has <b>more</b> grams and still runs out first.` : 'Comparing grams would have worked this time, but only by luck. Always use moles.'],
          };
        },
      },
      {
        id: 'product-mol',
        title: 'Moles of product',
        make(r) {
          for (;;) {
            const rx = r.pick(RX), [A, B] = rx.r, P = r.pick(rx.p);
            const na = r.num(0.2, 4, 2), nb = r.num(0.2, 4, 2);
            const ra = na / A.n, rb = nb / B.n, hi = Math.max(ra, rb), lo = Math.min(ra, rb);
            if (hi / lo < 1.2) continue;
            const limA = ra < rb, L = limA ? A : B, nL = limA ? na : nb, ans = (nL * P.n) / L.n;
            return {
              q: `In $${eqT(rx)}$, you mix ${na} mol of $${ce(A.f)}$ with ${nb} mol of $${ce(B.f)}$. How many moles of $${ce(P.f)}$ can form?`,
              answer: ans, unit: 'mol',
              hint: 'Find the limiting reactant first. Then use its moles in the mole ratio.',
              steps: [
                `Divide by coefficients. $${ce(A.f)}$: $${na} \\div ${A.n} = ${tn(ra)}$. $${ce(B.f)}$: $${nb} \\div ${B.n} = ${tn(rb)}$. So $${ce(L.f)}$ is limiting.`,
                `Use the limiting reactant. $${nL}\\ \\cancel{\\text{mol }${ce(L.f)}} \\times \\dfrac{${P.n}\\text{ mol }${ce(P.f)}}{${L.n}\\ \\cancel{\\text{mol }${ce(L.f)}}} = ${tn(ans)}\\text{ mol }${ce(P.f)}$.`,
              ],
            };
          }
        },
      },
      {
        id: 'product-g',
        title: 'Grams of product',
        make(r) {
          const c = makeCase(r);
          const P = r.pick(c.rx.p);
          const np = (c.nL * P.n) / c.L.n, ans = np * M(P.f);
          return {
            q: `In $${eqT(c.rx)}$, ${tn(c.ga)} g of $${ce(c.A.f)}$ reacts with ${tn(c.gb)} g of $${ce(c.B.f)}$. What mass of $${ce(P.f)}$ can form?`,
            answer: ans, unit: 'g',
            hint: 'Change both to moles, find the limiting reactant, then go across and up.',
            steps: [
              ...toMoles(c), runsStep(c),
              `<b>Across:</b> $${tn(c.nL, 4)}\\ \\cancel{\\text{mol }${ce(c.L.f)}} \\times \\dfrac{${P.n}\\text{ mol }${ce(P.f)}}{${c.L.n}\\ \\cancel{\\text{mol }${ce(c.L.f)}}} = ${tn(np, 4)}\\text{ mol }${ce(P.f)}$.`,
              `<b>Up:</b> $${tn(np, 4)}\\ \\cancel{\\text{mol}} \\times \\dfrac{${m2(P.f)}\\text{ g}}{1\\ \\cancel{\\text{mol}}} = ${tn(ans)}\\text{ g }${ce(P.f)}$.`,
            ],
          };
        },
      },
      {
        id: 'excess-left',
        title: 'Excess left over',
        make(r) {
          const c = makeCase(r);
          const usedMol = c.runs * c.E.n, usedG = usedMol * M(c.E.f), leftG = c.gE - usedG;
          return {
            q: `In $${eqT(c.rx)}$, ${tn(c.ga)} g of $${ce(c.A.f)}$ reacts with ${tn(c.gb)} g of $${ce(c.B.f)}$. What mass of the excess reactant is left over?`,
            answer: leftG, unit: 'g', tol: 0.03,
            hint: 'Use the limiting reactant to find how much excess gets used, then subtract from what you started with.',
            steps: [
              ...toMoles(c), runsStep(c),
              `Find how much $${ce(c.E.f)}$ gets used. $${tn(c.nL, 4)}\\ \\cancel{\\text{mol }${ce(c.L.f)}} \\times \\dfrac{${c.E.n}\\text{ mol }${ce(c.E.f)}}{${c.L.n}\\ \\cancel{\\text{mol }${ce(c.L.f)}}} = ${tn(usedMol, 4)}\\text{ mol}$, which is $${tn(usedMol, 4)} \\times ${m2(c.E.f)} = ${tn(usedG, 4)}$ g.`,
              `Subtract. $${tn(c.gE)} - ${tn(usedG, 4)} = ${tn(leftG)}$ g of $${ce(c.E.f)}$ left over.`,
            ],
          };
        },
      },
      {
        id: 'percent-yield',
        title: 'Percent yield',
        make(r) {
          const th = r.num(5, 90, 1), pct = r.int(52, 97), act = +((th * pct) / 100).toPrecision(3);
          const f = r.pick(['MgO', 'NH3', 'AgCl', 'CaO', 'Fe', 'CO2', 'Cu']);
          const ans = (act / th) * 100;
          return {
            q: `A reaction has a theoretical yield of ${tn(th)} g of $${ce(f)}$. You collect ${tn(act)} g. What is the percent yield?`,
            answer: ans, unit: '%',
            hint: 'Actual goes on top, theoretical goes on the bottom.',
            steps: [`$\\text{percent yield} = \\dfrac{\\text{actual}}{\\text{theoretical}} \\times 100\\%$`, `$\\dfrac{${tn(act)}\\ \\cancel{\\text{g}}}{${tn(th)}\\ \\cancel{\\text{g}}} \\times 100\\% = ${tn(ans)}\\%$`],
          };
        },
      },
      {
        id: 'actual-from-percent',
        title: 'Actual yield from percent',
        make(r) {
          const rx = r.pick(RX.filter((x) => x.p.length >= 1));
          const L = r.pick(rx.r), P = r.pick(rx.p);
          const g0 = +r.num(M(L.f) * 0.15, M(L.f) * 1.5, 3).toPrecision(3);
          const pct = r.int(60, 95);
          const n = g0 / M(L.f), np = (n * P.n) / L.n, th = np * M(P.f), act = (th * pct) / 100;
          const other = rx.r.find((x) => x.f !== L.f);
          return {
            q: `In $${eqT(rx)}$, ${tn(g0)} g of $${ce(L.f)}$ reacts with plenty of $${ce(other.f)}$. The percent yield is ${pct}%. What mass of $${ce(P.f)}$ do you collect?`,
            answer: act, unit: 'g',
            hint: 'Find the theoretical yield first. Then multiply it by the percent, written as a decimal.',
            steps: [
              `"Plenty of" means $${ce(L.f)}$ is limiting. Go down: $${tn(g0)} \\div ${m2(L.f)} = ${tn(n, 4)}$ mol.`,
              `Go across: $${tn(n, 4)} \\times \\dfrac{${P.n}}{${L.n}} = ${tn(np, 4)}$ mol of $${ce(P.f)}$.`,
              `Go up: $${tn(np, 4)} \\times ${m2(P.f)} = ${tn(th, 4)}$ g. That is the theoretical yield.`,
              `Take the percent: $${tn(th, 4)}\\text{ g} \\times ${(pct / 100).toFixed(2)} = ${tn(act)}\\text{ g}$.`,
            ],
          };
        },
      },
      {
        id: 'exam-full',
        title: 'Exam style, start to finish',
        make(r) {
          const c = makeCase(r);
          const P = r.pick(c.rx.p);
          const np = (c.nL * P.n) / c.L.n, th = np * M(P.f), pct = r.int(62, 94), act = +((th * pct) / 100).toPrecision(3);
          const ans = (act / th) * 100;
          return {
            q: `${tn(c.ga)} g of $${ce(c.A.f)}$ and ${tn(c.gb)} g of $${ce(c.B.f)}$ react by $${eqT(c.rx)}$. You collect ${tn(act)} g of $${ce(P.f)}$. What is the percent yield?`,
            answer: ans, unit: '%',
            hint: 'Three jobs: find the limiting reactant, find the theoretical yield, then divide.',
            steps: [
              ...toMoles(c), runsStep(c),
              `Theoretical yield: $${tn(c.nL, 4)} \\times \\dfrac{${P.n}}{${c.L.n}} = ${tn(np, 4)}$ mol of $${ce(P.f)}$, and $${tn(np, 4)} \\times ${m2(P.f)} = ${tn(th, 4)}$ g.`,
              `Percent yield: $\\dfrac{${tn(act)}}{${tn(th, 4)}} \\times 100\\% = ${tn(ans)}\\%$.`,
            ],
          };
        },
      },
    ],

    cards: [
      { front: 'What is a limiting reactant?', back: 'The reactant that runs out first. It sets how much product can form.' },
      { front: 'What is an excess reactant?', back: 'The reactant with some left over at the end. It still reacts until the limiting reactant is gone.' },
      { front: 'How do you find the limiting reactant?', back: 'Change masses to moles, then divide each by its coefficient. The smallest result is limiting.' },
      { front: 'Is the reactant with the smallest mass always limiting?', back: 'No. Heavy molecules give few moles per gram, so a sample with more grams can run out first.' },
      { front: 'What is method 2 for limiting reactants?', back: 'Calculate the product from each reactant. The smaller amount is what really forms, and that reactant is limiting.' },
      { front: 'How do you find the excess left over?', back: 'Use the limiting reactant and the mole ratio to find how much excess is used. Subtract from the starting amount.' },
      { front: 'What is percent yield?', back: 'Actual yield divided by theoretical yield, times 100%.' },
      { front: 'What does a yield above 100% usually mean?', back: 'The product is still wet or impure, or a calculation is wrong. Atoms cannot appear from nowhere.' },
    ],

    terms: [
      { term: 'Limiting reactant', def: 'The reactant that runs out first in a reaction. It decides how much product can form.' },
      { term: 'Excess reactant', def: 'A reactant with some left over after the limiting reactant is used up.' },
      { term: 'Theoretical yield', def: 'The most product a reaction can make, calculated from the limiting reactant.' },
      { term: 'Actual yield', def: 'The amount of product measured in a real experiment.' },
      { term: 'Percent yield', def: 'Actual yield divided by theoretical yield, times 100%.' },
    ],
  });
})();
