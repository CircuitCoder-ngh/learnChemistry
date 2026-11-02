/* Question bank for 5.1 Solutions and molarity. Every equation is checked for balance when this file loads. */
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
  /* Reactions between two dissolved reactants. */
  const RX = [
    'HCl + NaOH -> NaCl + H2O', 'H2SO4 + 2NaOH -> Na2SO4 + 2H2O', '2HCl + Ca(OH)2 -> CaCl2 + 2H2O', 'AgNO3 + NaCl -> AgCl + NaNO3',
    'CaCl2 + 2AgNO3 -> 2AgCl + Ca(NO3)2', 'BaCl2 + Na2SO4 -> BaSO4 + 2NaCl', 'Pb(NO3)2 + 2KI -> PbI2 + 2KNO3', '3NaOH + H3PO4 -> Na3PO4 + 3H2O',
    'AlCl3 + 3AgNO3 -> 3AgCl + Al(NO3)3', 'Na2CO3 + 2HCl -> 2NaCl + H2O + CO2',
  ].map(parse);
  const SOLUTES = ['NaCl', 'KCl', 'KNO3', 'CaCl2', 'MgCl2', 'Na2SO4', 'CuSO4', 'NaOH', 'K2CO3', 'NH4Cl', 'AgNO3', 'C6H12O6', 'C12H22O11', 'CH3OH', 'Al(NO3)3', 'FeCl3'];
  /* Compounds with their ions: [cation TeX, count, anion TeX, count]. */
  const SALTS = [
    ['NaCl', 'Na+', 1, 'Cl-', 1], ['CaCl2', 'Ca^2+', 1, 'Cl-', 2], ['MgCl2', 'Mg^2+', 1, 'Cl-', 2], ['FeCl3', 'Fe^3+', 1, 'Cl-', 3], ['AlCl3', 'Al^3+', 1, 'Cl-', 3],
    ['Na2SO4', 'Na+', 2, 'SO4^2-', 1], ['K2SO4', 'K+', 2, 'SO4^2-', 1], ['Al2(SO4)3', 'Al^3+', 2, 'SO4^2-', 3], ['Fe2(SO4)3', 'Fe^3+', 2, 'SO4^2-', 3], ['Ca(NO3)2', 'Ca^2+', 1, 'NO3-', 2],
    ['Mg(NO3)2', 'Mg^2+', 1, 'NO3-', 2], ['Al(NO3)3', 'Al^3+', 1, 'NO3-', 3], ['K3PO4', 'K+', 3, 'PO4^3-', 1], ['Na3PO4', 'Na+', 3, 'PO4^3-', 1], ['(NH4)2SO4', 'NH4+', 2, 'SO4^2-', 1], ['K2CO3', 'K+', 2, 'CO3^2-', 1],
  ];
  const M = (f) => Bank.molarMass(f);
  const ce = (f) => `\\ce{${f}}`;
  const m2 = (f) => M(f).toFixed(2);
  const sup = /\s*×\s*10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/;
  const tn = (x, n = 3) => Lab.sig(x, n).replace(sup, (m, e) => ' \\times 10^{' + e.replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => '-0123456789'['⁻⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)]) + '}');
  /** A molarity with 3 sig figs in a sensible range. */
  const molar = (r) => +r.pick([0.100, 0.125, 0.150, 0.200, 0.250, 0.300, 0.400, 0.500, 0.750, 1.00]);
  const mL = (r) => r.pick([25.0, 50.0, 75.0, 100, 125, 150, 200, 250, 300, 400, 500, 750]);
  const ml3 = (v) => (v >= 100 && v % 10 === 0 ? `${v}.` : v.toFixed(v < 100 ? 1 : 0));
  /** Problems that dissolve a solute stay below this molarity. A 48 M salt solution cannot exist. */
  const MAX_M = 3;

  Bank.add('solutions', {
    quiz: [
      {
        q: 'In a glass of salt water, what is the solvent?',
        options: ['The salt', 'The water', 'The glass', 'The ions'],
        answer: 1,
        why: 'The solvent does the dissolving, and it is usually present in the larger amount. Here that is water. Salt is the solute.',
      },
      {
        q: 'When NaCl dissolves, which way do water molecules point around a $\\ce{Na+}$ ion?',
        options: ['Oxygen toward the ion', 'Hydrogen toward the ion', 'Randomly, with no pattern', 'They do not come near it'],
        answer: 0,
        why: 'The oxygen end of water is slightly negative, so it is attracted to the positive ion. Around $\\ce{Cl-}$ the hydrogen ends point in.',
      },
      {
        q: 'What does a sugar solution contain?',
        options: ['Carbon, hydrogen and oxygen ions', 'Sugar ions and water', 'Whole sugar molecules surrounded by water', 'Solid sugar too small to see, with no water around it'],
        answer: 2,
        why: 'Sugar is molecular. It dissolves as whole molecules, gives no ions, and is a nonelectrolyte.',
      },
      {
        q: 'Which is a weak electrolyte?',
        options: ['$\\ce{NaCl}$', '$\\ce{HCl}$', '$\\ce{CH3COOH}$', '$\\ce{C2H5OH}$'],
        answer: 2,
        why: 'Acetic acid only slightly splits into ions. NaCl and HCl split completely, and ethanol does not split at all.',
      },
      {
        q: 'Solution A is 1 M HCl. Solution B is 1 M acetic acid. Which makes a conductivity bulb brighter, and why?',
        options: ['B, because acetic acid molecules are larger', 'They match, since both are 1 M', 'A, because HCl splits completely, giving far more ions', 'A, because HCl has more atoms per molecule'],
        answer: 2,
        why: 'Same concentration of compound, very different concentration of ions. Brightness follows ions, and HCl is a strong electrolyte.',
      },
      {
        q: 'You dissolve 1.00 mol of NaCl in 1.00 L of water. Why is the molarity not exactly 1.00 M?',
        options: ['The salt adds to the volume, so there is more than 1.00 L of solution', 'The salt loses mass when it dissolves', 'NaCl splits into two ions', 'Molarity only works for acids'],
        answer: 0,
        why: 'Molarity uses liters of solution. To make exactly 1.00 M, dissolve the salt, then add water up to the 1.00 L mark.',
      },
      {
        q: 'You add water to a solution until its volume doubles. What happens?',
        options: ['Moles double and molarity stays the same', 'Moles stay the same and molarity halves', 'Moles halve and molarity halves', 'Nothing changes'],
        answer: 1,
        why: 'Water adds no solute, so the moles stay fixed. The same moles in twice the volume means half the molarity.',
      },
      {
        q: 'What is the concentration of $\\ce{Cl-}$ in 0.20 M $\\ce{CaCl2}$?',
        options: ['0.10 M', '0.20 M', '0.40 M', '0.60 M'],
        answer: 2,
        why: 'Each $\\ce{CaCl2}$ gives 2 $\\ce{Cl-}$, so $0.20 \\times 2 = 0.40$ M. The 0.60 M answer is the total of all ions.',
      },
    ],

    gens: [
      {
        id: 'molarity-basic',
        title: 'Find molarity',
        make(r) {
          const n = r.pick([0.100, 0.150, 0.200, 0.250, 0.300, 0.400, 0.500, 0.750, 1.20, 1.50]);
          let v = mL(r);
          while (n / (v / 1000) > MAX_M) v = mL(r);
          const L = v / 1000, ans = n / L, f = r.pick(SOLUTES);
          return {
            q: `You dissolve ${tn(n)} mol of $${ce(f)}$ and make ${ml3(v)} mL of solution. What is the molarity?`,
            answer: ans, unit: 'M',
            hint: 'Change mL to L first. Then divide moles by liters.',
            steps: [
              `Change to liters: $${ml3(v)}\\ \\cancel{\\text{mL}} \\times \\dfrac{1\\text{ L}}{1000\\ \\cancel{\\text{mL}}} = ${tn(L)}\\text{ L}$.`,
              `$M = \\dfrac{\\text{mol}}{\\text{L}} = \\dfrac{${tn(n)}\\text{ mol}}{${tn(L)}\\text{ L}} = ${tn(ans)}\\text{ M}$.`,
            ],
          };
        },
      },
      {
        id: 'molarity-grams',
        title: 'Molarity from grams',
        make(r) {
          const f = r.pick(SOLUTES), g0 = +r.num(M(f) * 0.04, M(f) * 0.9, 3).toPrecision(3), n = g0 / M(f);
          let v = mL(r);
          while (n / (v / 1000) > MAX_M) v = mL(r);
          const L = v / 1000, ans = n / L;
          return {
            q: `You dissolve ${tn(g0)} g of $${ce(f)}$ and make ${ml3(v)} mL of solution. What is the molarity?`,
            answer: ans, unit: 'M',
            hint: 'Two changes first: grams to moles, and mL to L.',
            steps: [
              `Grams to moles. Molar mass of $${ce(f)}$ is ${m2(f)} g/mol: $${tn(g0)}\\ \\cancel{\\text{g}} \\times \\dfrac{1\\text{ mol}}{${m2(f)}\\ \\cancel{\\text{g}}} = ${tn(n, 4)}\\text{ mol}$.`,
              `mL to L: $${ml3(v)}\\text{ mL} = ${tn(L)}\\text{ L}$.`,
              `$M = \\dfrac{${tn(n, 4)}\\text{ mol}}{${tn(L)}\\text{ L}} = ${tn(ans)}\\text{ M}$.`,
            ],
          };
        },
      },
      {
        id: 'moles-from-mv',
        title: 'Moles from molarity',
        make(r) {
          const c = molar(r), v = mL(r), L = v / 1000, ans = c * L, f = r.pick(SOLUTES);
          return {
            q: `How many moles of $${ce(f)}$ are in ${ml3(v)} mL of ${tn(c)} M solution?`,
            answer: ans, unit: 'mol',
            hint: 'Moles equals molarity times liters.',
            steps: [`Change to liters: $${ml3(v)}\\text{ mL} = ${tn(L)}\\text{ L}$.`, `Liters cancel: $${tn(L)}\\ \\cancel{\\text{L}} \\times \\dfrac{${tn(c)}\\text{ mol}}{1\\ \\cancel{\\text{L}}} = ${tn(ans)}\\text{ mol}$.`],
          };
        },
      },
      {
        id: 'grams-needed',
        title: 'Grams to weigh out',
        make(r) {
          const f = r.pick(SOLUTES), c = molar(r), v = mL(r), L = v / 1000, n = c * L, ans = n * M(f);
          return {
            q: `What mass of $${ce(f)}$ do you need to make ${ml3(v)} mL of ${tn(c)} M solution?`,
            answer: ans, unit: 'g',
            hint: 'Liters times molarity gives moles. Moles times molar mass gives grams.',
            steps: [
              `Change to liters: $${ml3(v)}\\text{ mL} = ${tn(L)}\\text{ L}$.`,
              `Find moles: $${tn(L)}\\ \\cancel{\\text{L}} \\times \\dfrac{${tn(c)}\\text{ mol}}{1\\ \\cancel{\\text{L}}} = ${tn(n, 4)}\\text{ mol}$.`,
              `Find grams: $${tn(n, 4)}\\ \\cancel{\\text{mol}} \\times \\dfrac{${m2(f)}\\text{ g}}{1\\ \\cancel{\\text{mol}}} = ${tn(ans)}\\text{ g}$.`,
            ],
          };
        },
      },
      {
        id: 'volume-needed',
        title: 'Volume of solution',
        make(r) {
          const n = r.pick([0.0250, 0.0500, 0.100, 0.150, 0.200, 0.250, 0.300]), c = molar(r), L = n / c, ans = L * 1000, f = r.pick(SOLUTES);
          return {
            q: `What volume of ${tn(c)} M $${ce(f)}$ holds ${tn(n)} mol? Answer in mL.`,
            answer: ans, unit: 'mL',
            hint: 'Liters equals moles divided by molarity. Then change to mL.',
            steps: [`$\\text{L} = \\dfrac{\\text{mol}}{M} = ${tn(n)}\\ \\cancel{\\text{mol}} \\times \\dfrac{1\\text{ L}}{${tn(c)}\\ \\cancel{\\text{mol}}} = ${tn(L)}\\text{ L}$.`, `Change to mL: $${tn(L)}\\ \\cancel{\\text{L}} \\times \\dfrac{1000\\text{ mL}}{1\\ \\cancel{\\text{L}}} = ${tn(ans)}\\text{ mL}$.`],
          };
        },
      },
      {
        id: 'dilution-m2',
        title: 'Dilution: new molarity',
        make(r) {
          const m1 = r.pick([0.500, 1.00, 1.50, 2.00, 3.00, 6.00, 12.0]), v1 = r.pick([10.0, 20.0, 25.0, 50.0, 100]), w = r.pick([50, 100, 150, 200, 300, 400]);
          const v2 = v1 + w, ans = (m1 * v1) / v2;
          return {
            q: `You add ${w}. mL of water to ${ml3(v1)} mL of ${tn(m1)} M solution. What is the new molarity?`,
            answer: ans, unit: 'M',
            hint: '$V_2$ is the total volume: stock plus water.',
            steps: [
              `Total volume: $V_2 = ${ml3(v1)} + ${w}. = ${v2}$ mL.`,
              `Rearrange $M_1V_1 = M_2V_2$ to get $M_2 = \\dfrac{M_1V_1}{V_2}$.`,
              `$M_2 = \\dfrac{${tn(m1)}\\text{ M} \\times ${ml3(v1)}\\ \\cancel{\\text{mL}}}{${v2}\\ \\cancel{\\text{mL}}} = ${tn(ans)}\\text{ M}$.`,
            ],
          };
        },
      },
      {
        id: 'dilution-v1',
        title: 'Dilution: how much stock?',
        make(r) {
          const m1 = r.pick([1.00, 2.00, 3.00, 6.00, 12.0, 18.0]), m2 = r.pick([0.100, 0.200, 0.250, 0.500]), v2 = r.pick([100, 250, 500, 1000]);
          const ans = (m2 * v2) / m1;
          return {
            q: `What volume of ${tn(m1)} M stock do you need to make ${v2}. mL of ${tn(m2)} M solution? Answer in mL.`,
            answer: ans, unit: 'mL',
            hint: 'Rearrange the dilution equation for $V_1$.',
            steps: [
              `Start with $M_1V_1 = M_2V_2$ and divide both sides by $M_1$: $V_1 = \\dfrac{M_2V_2}{M_1}$.`,
              `$V_1 = \\dfrac{${tn(m2)}\\ \\cancel{\\text{M}} \\times ${v2}.\\text{ mL}}{${tn(m1)}\\ \\cancel{\\text{M}}} = ${tn(ans)}\\text{ mL}$.`,
              `Add water up to a total of ${v2}. mL. That takes $${v2} - ${tn(ans)}$, or about ${tn(v2 - ans)} mL of water.`,
            ],
          };
        },
      },
      {
        id: 'ion-conc',
        title: 'Ion concentration',
        make(r) {
          const [f, cat, nc, an, na] = r.pick(SALTS), c = r.pick([0.0500, 0.100, 0.150, 0.200, 0.250, 0.300, 0.500, 0.750]);
          const pickCat = r.next() < 0.5, ion = pickCat ? cat : an, k = pickCat ? nc : na, ans = c * k;
          return {
            q: `What is the concentration of $${ce(ion)}$ in ${tn(c)} M $${ce(f)}$?`,
            answer: ans, unit: 'M',
            hint: 'Write how the compound splits. Multiply by the number of that ion.',
            steps: [
              `Split it: $\\ce{${f} -> ${nc > 1 ? nc : ''}${cat} + ${na > 1 ? na : ''}${an}}$. Polyatomic ions stay in one piece.`,
              `Each $${ce(f)}$ gives ${k} $${ce(ion)}$, so $${tn(c)}\\text{ M} \\times ${k} = ${tn(ans)}\\text{ M}$.`,
            ],
          };
        },
      },
      {
        id: 'electrolyte-sort',
        title: 'Strong, weak or non?',
        make(r) {
          const items = [['NaCl', 0], ['KNO3', 0], ['HCl', 0], ['HNO3', 0], ['NaOH', 0], ['CaCl2', 0], ['H2SO4', 0], ['KOH', 0], ['HBr', 0], ['CH3COOH', 1], ['NH3', 1], ['HF', 1], ['H2CO3', 1], ['C12H22O11', 2], ['C6H12O6', 2], ['C2H5OH', 2], ['CH3OH', 2]];
          const [f, k] = r.pick(items), names = ['Strong electrolyte', 'Weak electrolyte', 'Nonelectrolyte'];
          const why = ['It splits completely into ions in water. Soluble ionic compounds, strong acids and strong bases all do.', 'Only a small fraction splits into ions. Weak acids and weak bases behave this way.', 'It dissolves as whole molecules with no ions at all.'];
          return {
            q: `What kind of electrolyte is $${ce(f)}$ in water?`,
            choices: names.slice(), answer: k,
            steps: [`$${ce(f)}$ is a <b>${names[k].toLowerCase()}</b>. ${why[k]}`],
          };
        },
      },
      {
        id: 'solution-stoich',
        title: 'Reacting solutions',
        make(r) {
          const rx = r.pick(RX), [A, B] = rx.r;
          const cA = molar(r), cB = molar(r), v = r.pick([10.0, 20.0, 25.0, 50.0]), LA = v / 1000;
          const nA = LA * cA, nB = (nA * B.n) / A.n, LB = nB / cB, ans = LB * 1000;
          return {
            q: `What volume of ${tn(cB)} M $${ce(B.f)}$ reacts completely with ${ml3(v)} mL of ${tn(cA)} M $${ce(A.f)}$? The reaction is $\\ce{${rx.s}}$. Answer in mL.`,
            answer: ans, unit: 'mL',
            hint: 'In through one door, across with the mole ratio, out through the other door.',
            steps: [
              `<b>In:</b> $${tn(LA)}\\ \\cancel{\\text{L}} \\times \\dfrac{${tn(cA)}\\text{ mol}}{1\\ \\cancel{\\text{L}}} = ${tn(nA, 4)}\\text{ mol }${ce(A.f)}$.`,
              `<b>Across:</b> $${tn(nA, 4)}\\ \\cancel{\\text{mol }${ce(A.f)}} \\times \\dfrac{${B.n}\\text{ mol }${ce(B.f)}}{${A.n}\\ \\cancel{\\text{mol }${ce(A.f)}}} = ${tn(nB, 4)}\\text{ mol }${ce(B.f)}$.`,
              `<b>Out:</b> $${tn(nB, 4)}\\ \\cancel{\\text{mol}} \\times \\dfrac{1\\text{ L}}{${tn(cB)}\\ \\cancel{\\text{mol}}} = ${tn(LB, 4)}\\text{ L}$, which is ${tn(ans)} mL.`,
            ],
          };
        },
      },
      {
        id: 'exam-mixed',
        title: 'Exam style',
        make(r) {
          const kind = r.int(0, 1);
          if (kind === 0) {
            const f = r.pick(['AgNO3', 'BaCl2', 'Na2SO4', 'KCl']);
            const P = { AgNO3: ['AgNO3 + NaCl -> AgCl + NaNO3', 'AgCl'], BaCl2: ['BaCl2 + Na2SO4 -> BaSO4 + 2NaCl', 'BaSO4'], Na2SO4: ['Na2SO4 + BaCl2 -> BaSO4 + 2NaCl', 'BaSO4'], KCl: ['KCl + AgNO3 -> AgCl + KNO3', 'AgCl'] }[f];
            parse(P[0]);
            const c = molar(r), v = r.pick([25.0, 50.0, 100]), L = v / 1000, n = c * L, ans = n * M(P[1]);
            return {
              q: `${ml3(v)} mL of ${tn(c)} M $${ce(f)}$ reacts completely by $\\ce{${P[0]}}$. What mass of solid $${ce(P[1])}$ forms?`,
              answer: ans, unit: 'g',
              hint: 'Liters times molarity gives moles. Check the mole ratio, then multiply by the molar mass of the solid.',
              steps: [
                `<b>In:</b> $${tn(L)}\\ \\cancel{\\text{L}} \\times \\dfrac{${tn(c)}\\text{ mol}}{1\\ \\cancel{\\text{L}}} = ${tn(n, 4)}\\text{ mol}$.`,
                `<b>Across:</b> the ratio is 1 to 1, so that makes ${tn(n, 4)} mol of $${ce(P[1])}$.`,
                `<b>Up:</b> $${tn(n, 4)}\\ \\cancel{\\text{mol}} \\times \\dfrac{${m2(P[1])}\\text{ g}}{1\\ \\cancel{\\text{mol}}} = ${tn(ans)}\\text{ g}$.`,
              ],
            };
          }
          const f = r.pick(['NaCl', 'KCl', 'CaCl2', 'MgCl2', 'CuSO4']), g0 = +r.num(M(f) * 0.1, M(f) * 0.6, 3).toPrecision(3), wAdd = r.pick([100, 250, 500]);
          const n = g0 / M(f);
          let v = r.pick([100, 200, 250, 500]);
          while (n / (v / 1000) > MAX_M) v = r.pick([100, 200, 250, 500]);
          const c1 = n / (v / 1000), v2 = v + wAdd, c2 = n / (v2 / 1000);
          return {
            q: `You dissolve ${tn(g0)} g of $${ce(f)}$ to make ${v}. mL of solution. Then you add ${wAdd}. mL of water. What is the final molarity?`,
            answer: c2, unit: 'M',
            hint: 'Find the first molarity. Then use the dilution equation with the total volume.',
            steps: [
              `Moles: $${tn(g0)} \\div ${m2(f)} = ${tn(n, 4)}$ mol.`,
              `First molarity: $${tn(n, 4)}\\text{ mol} \\div ${tn(v / 1000)}\\text{ L} = ${tn(c1)}\\text{ M}$.`,
              `Total volume: $V_2 = ${v} + ${wAdd} = ${v2}$ mL.`,
              `Dilute: $M_2 = \\dfrac{${tn(c1)}\\text{ M} \\times ${v}\\ \\cancel{\\text{mL}}}{${v2}\\ \\cancel{\\text{mL}}} = ${tn(c2)}\\text{ M}$.`,
            ],
          };
        },
      },
    ],

    cards: [
      { front: 'What are a solute and a solvent?', back: 'The solute gets dissolved. The solvent does the dissolving, and it is usually the larger amount.' },
      { front: 'What does (aq) mean?', back: 'Aqueous: dissolved in water.' },
      { front: 'Why does water dissolve ionic compounds?', back: 'Water is polar. Its slightly negative O end attracts cations and its slightly positive H ends attract anions. This surrounds and carries off each ion.' },
      { front: 'What is hydration?', back: 'Water molecules surrounding a dissolved ion or molecule.' },
      { front: 'What is an electrolyte?', back: 'A substance that gives ions in water, so that the solution conducts electricity.' },
      { front: 'Strong, weak and nonelectrolytes: how do they differ?', back: 'Strong: splits completely. Weak: only a small fraction splits. Non: stays as whole molecules.' },
      { front: 'What is the formula for molarity?', back: '$M = \\text{moles of solute} \\div \\text{liters of solution}$.' },
      { front: 'What is the dilution equation?', back: '$M_1V_1 = M_2V_2$. Moles stay the same, and $V_2$ is the total volume.' },
      { front: 'What are the ion concentrations in 0.10 M $\\ce{Al2(SO4)3}$?', back: '0.20 M $\\ce{Al^3+}$ and 0.30 M $\\ce{SO4^2-}$.' },
    ],

    terms: [
      { term: 'Solution', def: 'An even mixture of two or more substances.' },
      { term: 'Solute', def: 'The substance that gets dissolved in a solution.' },
      { term: 'Solvent', def: 'The substance that does the dissolving, usually the one present in the larger amount.' },
      { term: 'Aqueous', def: 'Dissolved in water. Written (aq).' },
      { term: 'Polar molecule', def: 'A molecule with a slightly positive end and a slightly negative end, such as water.' },
      { term: 'Hydration', def: 'Water molecules surrounding a dissolved ion or molecule.' },
      { term: 'Electrolyte', def: 'A substance that gives ions in water, so that the solution conducts electricity.' },
      { term: 'Strong electrolyte', def: 'A substance that splits completely into ions in water, such as NaCl or HCl.' },
      { term: 'Weak electrolyte', def: 'A substance of which only a small fraction splits into ions in water, such as acetic acid.' },
      { term: 'Nonelectrolyte', def: 'A substance that dissolves as whole molecules and gives no ions, such as sugar.' },
      { term: 'Molarity', def: 'Moles of solute per liter of solution. Symbol M.' },
      { term: 'Stock solution', def: 'A concentrated solution kept on hand and diluted when needed.' },
      { term: 'Dilution', def: 'Adding solvent to lower the concentration. The moles of solute stay the same.' },
    ],
  });
})();
