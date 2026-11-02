/* Question bank for 6.3 Enthalpy and Hess's law.
   The page script reads the same tables through Bank.all.enthalpy, so every number has one home. */
(function () {
  /* Standard enthalpies of formation at 25 °C, kJ/mol, from common textbook tables. */
  const HF = {
    'H2O(l)': -285.8, 'H2O(g)': -241.8, 'CO2(g)': -393.5, 'CO(g)': -110.5,
    'CH4(g)': -74.8, 'C2H6(g)': -84.7, 'C2H4(g)': 52.3, 'C2H2(g)': 226.7, 'C3H8(g)': -103.8, 'C8H18(l)': -250.1,
    'CH3OH(l)': -238.7, 'C2H5OH(l)': -277.7, 'C6H12O6(s)': -1273,
    'NH3(g)': -46.1, 'NO(g)': 90.3, 'NO2(g)': 33.2, 'HCN(g)': 135.1, 'HCl(g)': -92.3,
    'SO2(g)': -296.8, 'SO3(g)': -395.7,
    'CaO(s)': -635.1, 'CaCO3(s)': -1206.9, 'Fe2O3(s)': -824.2, 'Al2O3(s)': -1675.7,
    'C(diamond)': 1.9,
    'O2(g)': 0, 'H2(g)': 0, 'N2(g)': 0, 'C(s)': 0, 'C(graphite)': 0, 'S(s)': 0, 'Fe(s)': 0, 'Al(s)': 0, 'Cl2(g)': 0,
  };
  /** Enthalpy of a reaction {r:{species:n}, p:{species:n}} from the table above, rounded to 0.1. */
  const dHof = (rx) => {
    const sum = (side) => Object.keys(side).reduce((a, s) => a + side[s] * HF[s], 0);
    return Math.round((sum(rx.p) - sum(rx.r)) * 10) / 10;
  };
  const rx = (r, p) => ({ r, p });

  /* Average bond enthalpies, kJ/mol. Tables differ a little. */
  const BE = {
    'H–H': 436, 'Cl–Cl': 243, 'H–Cl': 431, 'O=O': 498, 'O–H': 463, 'N≡N': 945, 'N–H': 391, 'C–H': 413, 'C=O': 799, 'C–C': 348, 'C=C': 614,
  };

  /* Hess's law puzzles. sol lists [flip, factor] for each card, and is tested in the page's QA. */
  const PUZZLES = [
    {
      name: 'Your first flip', goal: rx({ 'N2(g)': 1, 'O2(g)': 2 }, { 'NO2(g)': 2 }),
      cards: [rx({ 'N2(g)': 1, 'O2(g)': 1 }, { 'NO(g)': 2 }), rx({ 'NO2(g)': 2 }, { 'NO(g)': 2, 'O2(g)': 1 })],
      sol: [[false, 1], [true, 1]],
      hints: ['N₂ is already on the left, where the goal wants it.', 'The goal wants NO₂ on the right. Flip this card, and watch NO cross out.'],
    },
    {
      name: 'Graphite to diamond', goal: rx({ 'C(graphite)': 1 }, { 'C(diamond)': 1 }),
      cards: [rx({ 'C(graphite)': 1, 'O2(g)': 1 }, { 'CO2(g)': 1 }), rx({ 'C(diamond)': 1, 'O2(g)': 1 }, { 'CO2(g)': 1 })],
      sol: [[false, 1], [true, 1]],
      hints: ['Graphite is already on the left, where the goal wants it.', 'The goal wants diamond on the right. Flip this card, and watch the sign flip too.'],
    },
    {
      name: 'Flip and halve', goal: rx({ 'C(s)': 1, 'O2(g)': 0.5 }, { 'CO(g)': 1 }),
      cards: [rx({ 'C(s)': 1, 'O2(g)': 1 }, { 'CO2(g)': 1 }), rx({ 'CO(g)': 2, 'O2(g)': 1 }, { 'CO2(g)': 2 })],
      sol: [[false, 1], [true, 0.5]],
      hints: ['One C on the left is just what the goal wants.', 'The goal wants one CO on the right. Flip this card, then multiply it by one half.'],
    },
    {
      name: 'Build methane', goal: rx({ 'C(s)': 1, 'H2(g)': 2 }, { 'CH4(g)': 1 }),
      cards: [rx({ 'C(s)': 1, 'O2(g)': 1 }, { 'CO2(g)': 1 }), rx({ 'H2(g)': 1, 'O2(g)': 0.5 }, { 'H2O(l)': 1 }), rx({ 'CH4(g)': 1, 'O2(g)': 2 }, { 'CO2(g)': 1, 'H2O(l)': 2 })],
      sol: [[false, 1], [false, 2], [true, 1]],
      hints: ['One C on the left is just right. Leave it.', 'The goal needs 2 H₂ on the left. Multiply by 2.', 'The goal wants CH₄ on the right. Flip this card.'],
    },
    {
      name: 'Build propane', goal: rx({ 'C(s)': 3, 'H2(g)': 4 }, { 'C3H8(g)': 1 }),
      cards: [rx({ 'C(s)': 1, 'O2(g)': 1 }, { 'CO2(g)': 1 }), rx({ 'H2(g)': 1, 'O2(g)': 0.5 }, { 'H2O(l)': 1 }), rx({ 'C3H8(g)': 1, 'O2(g)': 5 }, { 'CO2(g)': 3, 'H2O(l)': 4 })],
      sol: [[false, 3], [false, 4], [true, 1]],
      hints: ['The goal needs 3 C on the left. Multiply by 3.', 'The goal needs 4 H₂ on the left. Multiply by 4.', 'The goal wants C₃H₈ on the right. Flip this card.'],
    },
    {
      name: 'Build acetylene', goal: rx({ 'C(s)': 2, 'H2(g)': 1 }, { 'C2H2(g)': 1 }),
      cards: [rx({ 'C(s)': 1, 'O2(g)': 1 }, { 'CO2(g)': 1 }), rx({ 'H2(g)': 2, 'O2(g)': 1 }, { 'H2O(l)': 2 }), rx({ 'C2H2(g)': 2, 'O2(g)': 5 }, { 'CO2(g)': 4, 'H2O(l)': 2 })],
      sol: [[false, 2], [false, 0.5], [true, 0.5]],
      hints: ['The goal needs 2 C on the left. Multiply by 2.', 'The goal needs only 1 H₂. Multiply by one half.', 'The goal wants 1 C₂H₂ on the right. Flip this card and multiply by one half.'],
    },
    {
      name: 'Add hydrogen', goal: rx({ 'C2H4(g)': 1, 'H2(g)': 1 }, { 'C2H6(g)': 1 }),
      cards: [rx({ 'C2H4(g)': 1, 'O2(g)': 3 }, { 'CO2(g)': 2, 'H2O(l)': 2 }), rx({ 'H2(g)': 2, 'O2(g)': 1 }, { 'H2O(l)': 2 }), rx({ 'C2H6(g)': 2, 'O2(g)': 7 }, { 'CO2(g)': 4, 'H2O(l)': 6 })],
      sol: [[false, 1], [false, 0.5], [true, 0.5]],
      hints: ['One C₂H₄ on the left is just right.', 'The goal needs 1 H₂. Multiply by one half.', 'The goal wants 1 C₂H₆ on the right. Flip this card and multiply by one half.'],
    },
    {
      name: 'The boss level', goal: rx({ 'CH4(g)': 1, 'NH3(g)': 1 }, { 'HCN(g)': 1, 'H2(g)': 3 }),
      cards: [rx({ 'N2(g)': 1, 'H2(g)': 3 }, { 'NH3(g)': 2 }), rx({ 'C(s)': 1, 'H2(g)': 2 }, { 'CH4(g)': 1 }), rx({ 'H2(g)': 1, 'C(s)': 2, 'N2(g)': 1 }, { 'HCN(g)': 2 })],
      sol: [[true, 0.5], [true, 1], [false, 0.5]],
      hints: ['The goal wants 1 NH₃ on the left. Flip this card and multiply by one half.', 'The goal wants CH₄ on the left. Flip this card.', 'The goal wants 1 HCN on the right. Multiply by one half.'],
    },
  ];

  const ce = (s) => s.replace(/\(graphite\)/, '(gr)').replace(/\(diamond\)/, '(dia)');
  /** Species as mhchem source, such as "2CO2(g)". */
  const coef = (n) => {
    if (n === 1) return '';
    if (Number.isInteger(n)) return String(n);
    if (Number.isInteger(n * 2)) return `${n * 2}/2 `;
    return `${n * 4}/4 `;
  };
  const side = (o) => Object.keys(o).map((s) => coef(o[s]) + ce(s)).join(' + ');
  const eqTex = (r) => `\\ce{${side(r.r)} -> ${side(r.p)}}`;
  const signed = (x, d = 1) => (x > 0 ? '+' : x < 0 ? '-' : '') + Math.abs(x).toFixed(d);
  const paren = (x, d = 1) => (x < 0 ? `(${signed(x, d)})` : x.toFixed(d));

  const COMB = [
    ['methane', 'CH4', 'CH4(g)', rx({ 'CH4(g)': 1, 'O2(g)': 2 }, { 'CO2(g)': 1, 'H2O(l)': 2 })],
    ['propane', 'C3H8', 'C3H8(g)', rx({ 'C3H8(g)': 1, 'O2(g)': 5 }, { 'CO2(g)': 3, 'H2O(l)': 4 })],
    ['ethanol', 'C2H5OH', 'C2H5OH(l)', rx({ 'C2H5OH(l)': 1, 'O2(g)': 3 }, { 'CO2(g)': 2, 'H2O(l)': 3 })],
    ['methanol', 'CH3OH', 'CH3OH(l)', rx({ 'CH3OH(l)': 1, 'O2(g)': 1.5 }, { 'CO2(g)': 1, 'H2O(l)': 2 })],
    ['ethane', 'C2H6', 'C2H6(g)', rx({ 'C2H6(g)': 1, 'O2(g)': 3.5 }, { 'CO2(g)': 2, 'H2O(l)': 3 })],
    ['ethylene', 'C2H4', 'C2H4(g)', rx({ 'C2H4(g)': 1, 'O2(g)': 3 }, { 'CO2(g)': 2, 'H2O(l)': 2 })],
    ['glucose', 'C6H12O6', 'C6H12O6(s)', rx({ 'C6H12O6(s)': 1, 'O2(g)': 6 }, { 'CO2(g)': 6, 'H2O(l)': 6 })],
  ];
  const OTHER = [
    rx({ 'CaCO3(s)': 1 }, { 'CaO(s)': 1, 'CO2(g)': 1 }),
    rx({ 'N2(g)': 1, 'H2(g)': 3 }, { 'NH3(g)': 2 }),
    rx({ 'NH3(g)': 4, 'O2(g)': 5 }, { 'NO(g)': 4, 'H2O(g)': 6 }),
    rx({ 'Al(s)': 2, 'Fe2O3(s)': 1 }, { 'Al2O3(s)': 1, 'Fe(s)': 2 }),
    rx({ 'Fe2O3(s)': 1, 'CO(g)': 3 }, { 'Fe(s)': 2, 'CO2(g)': 3 }),
    rx({ 'NO(g)': 2, 'O2(g)': 1 }, { 'NO2(g)': 2 }),
    rx({ 'SO2(g)': 2, 'O2(g)': 1 }, { 'SO3(g)': 2 }),
    rx({ 'CO(g)': 2, 'O2(g)': 1 }, { 'CO2(g)': 2 }),
  ];

  const BONDQ = [
    { tex: '\\ce{H2 + Cl2 -> 2HCl}', broke: [['H–H', 1], ['Cl–Cl', 1]], made: [['H–Cl', 2]] },
    { tex: '\\ce{2H2 + O2 -> 2H2O}', broke: [['H–H', 2], ['O=O', 1]], made: [['O–H', 4]] },
    { tex: '\\ce{N2 + 3H2 -> 2NH3}', broke: [['N≡N', 1], ['H–H', 3]], made: [['N–H', 6]] },
    { tex: '\\ce{CH4 + 2O2 -> CO2 + 2H2O}', broke: [['C–H', 4], ['O=O', 2]], made: [['C=O', 2], ['O–H', 4]] },
    { tex: '\\ce{C2H4 + H2 -> C2H6}', broke: [['C=C', 1], ['H–H', 1]], made: [['C–C', 1], ['C–H', 2]] },
  ];
  const bondTex = (name) => name.split(/([–=≡])/).map((x) => ({ '–': '{-}', '=': '{=}', '≡': '{\\equiv}' }[x] || `\\mathrm{${x}}`)).join('');

  Bank.add('enthalpy', {
    hf: HF, dHof, BE, PUZZLES, COMB, OTHER,

    quiz: [
      {
        q: 'What is the enthalpy change, $\\Delta H$, of a reaction run at constant pressure?',
        options: ['The heat absorbed or released by the reaction', 'The temperature change of the reaction', 'The total energy of the products', 'The speed of the reaction'],
        answer: 0,
        why: 'At constant pressure, $\\Delta H = q$. It is the heat flow for the reaction, positive when absorbed and negative when released.',
      },
      {
        q: 'On an energy diagram, the products sit lower than the reactants. What does that mean?',
        options: ['Endothermic, $\\Delta H > 0$', 'Exothermic, $\\Delta H < 0$', 'The reaction cannot happen', 'The reaction is slow'],
        answer: 1,
        why: 'Products have less enthalpy than reactants, so the difference left as heat. $\\Delta H$ is products minus reactants, which is negative.',
      },
      {
        q: '$\\ce{2H2(g) + O2(g) -> 2H2O(l)}$ has $\\Delta H = -571.6$ kJ. What is $\\Delta H$ for $\\ce{H2O(l) -> H2(g) + 1/2 O2(g)}$?',
        options: ['$-285.8$ kJ', '$+285.8$ kJ', '$+571.6$ kJ', '$-571.6$ kJ'],
        answer: 1,
        why: 'The new equation is reversed, which flips the sign, and is half as big, which halves the number: $+285.8$ kJ.',
      },
      {
        q: "What does Hess's law say?",
        options: ['Reactions always release heat', 'The total $\\Delta H$ is the same whichever steps you take from reactants to products', '$\\Delta H$ doubles when temperature doubles', 'Only one-step reactions have a $\\Delta H$'],
        answer: 1,
        why: 'Enthalpy is a state function. It depends only on the start and the end, like the height gained on a hike.',
      },
      {
        q: 'Which substance has $\\Delta H_f^\\circ = 0$?',
        options: ['$\\ce{H2O(l)}$', '$\\ce{O2(g)}$', '$\\ce{O3(g)}$', '$\\ce{CO2(g)}$'],
        answer: 1,
        why: 'An element in its standard state has a formation enthalpy of zero. Oxygen\'s standard state is $\\ce{O2(g)}$, not $\\ce{O3}$.',
      },
      {
        q: 'Which equation is the formation reaction for liquid water?',
        options: ['$\\ce{2H2(g) + O2(g) -> 2H2O(l)}$', '$\\ce{H2(g) + 1/2 O2(g) -> H2O(l)}$', '$\\ce{H2O(g) -> H2O(l)}$', '$\\ce{2H(g) + O(g) -> H2O(l)}$'],
        answer: 1,
        why: 'A formation reaction makes exactly 1 mole of product from elements in their standard states. That is why it needs the fraction.',
      },
      {
        q: 'How do you find $\\Delta H^\\circ$ from formation enthalpies?',
        options: ['Sum of reactants minus sum of products', 'Sum of products minus sum of reactants, each times its coefficient', 'Sum of products plus sum of reactants', 'Sum of products minus sum of reactants, ignoring coefficients'],
        answer: 1,
        why: '$\\Delta H^\\circ = \\sum n\\,\\Delta H_f^\\circ(\\text{products}) - \\sum n\\,\\Delta H_f^\\circ(\\text{reactants})$. Do not forget the coefficients.',
      },
      {
        q: 'Which is true of making and breaking bonds?',
        options: ['Breaking costs energy, and making releases energy', 'Breaking releases energy, and making costs energy', 'Both release energy', 'Both cost energy'],
        answer: 0,
        why: 'Pulling atoms apart takes energy. When they snap together, energy comes out. A reaction is exothermic when more comes out than goes in.',
      },
      {
        q: 'How do you estimate $\\Delta H$ from bond enthalpies?',
        options: ['Bonds formed minus bonds broken', 'Bonds broken minus bonds formed', 'Bonds broken plus bonds formed', 'Products minus reactants'],
        answer: 1,
        why: '$\\Delta H \\approx \\sum E(\\text{broken}) - \\sum E(\\text{formed})$. Note that this runs the opposite way from the formation formula, because breaking is the positive part.',
      },
      {
        q: 'Burning 1 mol of methane gives $\\Delta H = -890.3$ kJ. How much heat comes from burning 0.50 mol?',
        options: ['$-445$ kJ', '$-890$ kJ', '$-1780$ kJ', '$+445$ kJ'],
        answer: 0,
        why: '$\\Delta H$ scales with the amount: $0.50 \\times (-890.3) = -445$ kJ.',
      },
    ],

    gens: [
      {
        id: 'scale',
        title: 'Reverse and scale',
        make(r) {
          const base = r.pick(OTHER.concat(COMB.map((c) => c[3])));
          const dH = dHof(base);
          const flip = r.int(0, 1) === 1;
          const k = r.pick([0.5, 1, 2, 3]);
          if (!flip && k === 1) return this.make(r);
          const mult = (o) => { const t = {}; Object.keys(o).forEach((s) => { t[s] = o[s] * k; }); return t; };
          const nr = flip ? mult(base.p) : mult(base.r), np = flip ? mult(base.r) : mult(base.p);
          const ans = (flip ? -1 : 1) * k * dH;
          return {
            q: `Given $${eqTex(base)}$, with $\\Delta H = ${signed(dH)}$ kJ.<br>Find $\\Delta H$ for $${eqTex(rx(nr, np))}$.`,
            answer: ans, unit: 'kJ', tol: 0.005,
            hint: 'Reversing flips the sign. Multiplying the equation multiplies $\\Delta H$ by the same number.',
            steps: [
              flip ? `The new equation runs backward, so flip the sign: ${signed(-dH)} kJ.` : 'The new equation runs in the same direction, so the sign stays.',
              k === 1 ? 'The coefficients did not change, so the size stays.' : `The coefficients are ${k} times the original, so multiply by ${k}.`,
              `$\\Delta H = ${signed(ans)}$ kJ.`,
            ],
          };
        },
      },
      {
        id: 'heat-from-grams',
        title: 'Heat from grams',
        make(r) {
          const [name, f, , re] = r.pick(COMB);
          const dH = dHof(re);
          const M = Bank.molarMass(f);
          const m = r.int(2, 60) * 0.5;
          const n = m / M;
          const q = n * dH;
          return {
            q: `The combustion of ${name}, $${eqTex(re)}$, has $\\Delta H = ${signed(dH)}$ kJ. How much heat is involved when ${m.toFixed(1)} g of ${name} burns? Include the sign.`,
            answer: q, unit: 'kJ',
            hint: 'Grams to moles first. Then use $\\Delta H$ as kilojoules per mole of the fuel.',
            steps: [
              `Grams to moles: $${m.toFixed(1)}\\ \\text{g} \\div ${M.toFixed(2)}\\ \\text{g/mol} = ${n.toFixed(4)}\\ \\text{mol}$.`,
              `Multiply by the heat per mole: $${n.toFixed(4)}\\ \\text{mol} \\times \\dfrac{${signed(dH)}\\ \\text{kJ}}{1\\ \\text{mol}} = ${Lab.sig(q, 3).replace('-', '-')}\\ \\text{kJ}$.`,
              'The sign is negative because burning releases heat.',
            ],
          };
        },
      },
      {
        id: 'hess',
        title: "Hess's law",
        make(r) {
          const P = r.pick(PUZZLES.slice(1));
          const parts = P.cards.map((c, i) => {
            const [flip, k] = P.sol[i];
            return { c, flip, k, dH: dHof(c), val: (flip ? -1 : 1) * k * dHof(c) };
          });
          const ans = parts.reduce((a, x) => a + x.val, 0);
          const given = parts.map((x, i) => `${String.fromCharCode(65 + i)}: $${eqTex(x.c)}$, $\\Delta H = ${signed(x.dH)}$ kJ`).join('<br>');
          return {
            q: `Use these reactions:<br>${given}<br>Find $\\Delta H$ for $${eqTex(P.goal)}$.`,
            answer: ans, unit: 'kJ', tol: 0.01,
            hint: 'Decide which side each substance in the target has to end up on. Flip and scale each given reaction to match, then add the $\\Delta H$ values.',
            steps: parts.map((x, i) => {
              const L = String.fromCharCode(65 + i);
              const how = [x.flip ? 'flip it' : 'keep it', x.k !== 1 ? `multiply by ${x.k}` : ''].filter(Boolean).join(', and ');
              return `Reaction ${L}: ${how}. That gives ${signed(x.val)} kJ.`;
            }).concat([`Add them up: $${parts.map((x) => paren(x.val)).join(' + ')} = ${signed(ans)}$ kJ.`]),
          };
        },
      },
      {
        id: 'formation',
        title: 'ΔH from formation enthalpies',
        make(r) {
          const re = r.pick(OTHER.concat(COMB.map((c) => c[3])));
          const dH = dHof(re);
          const list = Object.keys(re.r).concat(Object.keys(re.p));
          const table = list.map((s) => `$\\ce{${ce(s)}}$: ${HF[s] === 0 ? '0' : signed(HF[s]).replace('-', '−')}`).join(', ');
          const term = (o) => Object.keys(o).map((s) => `${o[s]}(${signed(HF[s])})`).join(' + ');
          const sum = (o) => Object.keys(o).reduce((a, s) => a + o[s] * HF[s], 0);
          return {
            q: `Find $\\Delta H^\\circ$ for $${eqTex(re)}$. Formation enthalpies in kJ/mol are ${table}.`,
            answer: dH, unit: 'kJ', tol: 0.005,
            hint: 'Products minus reactants, multiplying each by its coefficient. Elements count as zero.',
            steps: [
              `Products: $${term(re.p)} = ${signed(sum(re.p))}$ kJ.`,
              `Reactants: $${term(re.r)} = ${signed(sum(re.r))}$ kJ.`,
              `Products minus reactants: $${signed(sum(re.p))} - ${paren(sum(re.r))} = ${signed(dH)}$ kJ.`,
            ],
          };
        },
      },
      {
        id: 'find-hf',
        title: 'Find a formation enthalpy',
        make(r) {
          const [name, , sp, re] = r.pick(COMB);
          const dH = dHof(re);
          const prod = Object.keys(re.p).reduce((a, s) => a + re.p[s] * HF[s], 0);
          const ans = HF[sp];
          return {
            q: `The combustion of ${name}, $${eqTex(re)}$, has $\\Delta H^\\circ = ${signed(dH)}$ kJ. Using $\\Delta H_f^\\circ$ of $\\ce{CO2(g)} = -393.5$ and $\\ce{H2O(l)} = -285.8$ kJ/mol, find $\\Delta H_f^\\circ$ of ${name}.`,
            answer: ans, unit: 'kJ/mol', tol: 0.03,
            hint: 'Write products minus reactants, with $\\ce{O2}$ as zero. The only unknown is the fuel, with a coefficient of 1.',
            steps: [
              `Write the formula: $\\Delta H^\\circ = \\sum(\\text{products}) - \\Delta H_f^\\circ(\\text{${name}}) - 0$.`,
              `The products add up to $${signed(prod)}$ kJ.`,
              `Rearrange: $\\Delta H_f^\\circ(\\text{${name}}) = \\sum(\\text{products}) - \\Delta H^\\circ = ${signed(prod)} - ${paren(dH)} = ${signed(ans)}$ kJ/mol.`,
            ],
          };
        },
      },
      {
        id: 'bonds',
        title: 'Bond enthalpy estimate',
        make(r) {
          const b = r.pick(BONDQ);
          const allNames = [...new Set(b.broke.concat(b.made).map((x) => x[0]))];
          const table = allNames.map((n) => `$${bondTex(n)}$: ${BE[n]}`).join(', ');
          const sumOf = (l) => l.reduce((a, [n, k]) => a + k * BE[n], 0);
          const brk = sumOf(b.broke), mk = sumOf(b.made);
          const line = (l) => l.map(([n, k]) => `${k}(${BE[n]})`).join(' + ');
          return {
            q: `Estimate $\\Delta H$ for $${b.tex}$ from these bond enthalpies, in kJ/mol: ${table}.`,
            answer: brk - mk, unit: 'kJ', tol: 0.01,
            hint: 'Count every bond in the reactants and every bond in the products. Then broken minus formed.',
            steps: [
              `Bonds broken: $${line(b.broke)} = ${brk}$ kJ. This is the energy you pay in.`,
              `Bonds formed: $${line(b.made)} = ${mk}$ kJ. This is the energy you get back.`,
              `Broken minus formed: $${brk} - ${mk} = ${signed(brk - mk, 0)}$ kJ.`,
            ],
          };
        },
      },
      {
        id: 'read-diagram',
        title: 'Read the signs',
        make(r) {
          const kind = r.int(0, 2);
          const v = r.int(4, 90) * 10;
          if (kind === 0) {
            const down = r.int(0, 1) === 1;
            return {
              q: `On an energy diagram, the products sit ${v} kJ ${down ? 'below' : 'above'} the reactants. What is $\\Delta H$?`,
              choices: [`$-${v}$ kJ, exothermic`, `$+${v}$ kJ, endothermic`, `$-${v}$ kJ, endothermic`, `$+${v}$ kJ, exothermic`],
              answer: down ? 0 : 1,
              steps: [`$\\Delta H$ is products minus reactants. Products ${down ? 'below' : 'above'} means $\\Delta H$ is ${down ? 'negative' : 'positive'}, so the reaction ${down ? 'releases' : 'absorbs'} heat.`],
            };
          }
          if (kind === 1) {
            const exo = r.int(0, 1) === 1;
            const eq = exo ? `A + B → C + ${v} kJ` : `A + B + ${v} kJ → C`;
            return {
              q: `A thermochemical equation reads ${eq}. What is $\\Delta H$ for A + B → C?`,
              choices: [`$-${v}$ kJ`, `$+${v}$ kJ`],
              answer: exo ? 0 : 1,
              steps: [exo ? 'Heat written as a product means heat comes out, so $\\Delta H$ is negative.' : 'Heat written as a reactant means heat goes in, so $\\Delta H$ is positive.'],
            };
          }
          const pos = r.int(0, 1) === 1;
          return {
            q: `A reaction has $\\Delta H = ${pos ? '+' : '-'}${v}$ kJ. In a coffee cup, what happens to the water temperature?`,
            choices: ['It goes up', 'It goes down', 'It stays the same'],
            answer: pos ? 1 : 0,
            steps: [pos ? 'Positive $\\Delta H$ means the reaction absorbs heat from the water, so the water cools.' : 'Negative $\\Delta H$ means the reaction releases heat into the water, so the water warms.'],
          };
        },
      },
    ],

    cards: [
      { front: 'What is enthalpy change?', back: '$\\Delta H = H_{\\text{products}} - H_{\\text{reactants}}$. At constant pressure, it equals the heat $q$.' },
      { front: 'What happens to $\\Delta H$ when you reverse a reaction?', back: 'The sign flips. The size stays the same.' },
      { front: 'What happens to $\\Delta H$ when you multiply a reaction by 2?', back: 'It doubles. $\\Delta H$ scales with the coefficients.' },
      { front: "State Hess's law.", back: 'If a reaction is a sum of steps, its $\\Delta H$ is the sum of the steps\' $\\Delta H$ values.' },
      { front: 'What is standard enthalpy of formation?', back: 'The $\\Delta H$ for making 1 mol of a substance from its elements in their standard states.' },
      { front: 'What is $\\Delta H_f^\\circ$ for an element in its standard state?', back: 'Zero. Examples: $\\ce{O2(g)}$, $\\ce{H2(g)}$, $\\ce{C(graphite)}$, $\\ce{Fe(s)}$.' },
      { front: 'What is the formula with formation enthalpies?', back: '$\\Delta H^\\circ = \\sum n\\,\\Delta H_f^\\circ(\\text{products}) - \\sum n\\,\\Delta H_f^\\circ(\\text{reactants})$.' },
      { front: 'What is the formula with bond enthalpies?', back: '$\\Delta H \\approx \\sum E(\\text{broken}) - \\sum E(\\text{formed})$. It is only an estimate.' },
      { front: 'Which goes first, products or reactants, in each formula?', back: 'Formation: products minus reactants. Bonds: reactants (broken) minus products (formed).' },
    ],

    terms: [
      { term: 'Enthalpy', def: 'A property of a system, symbol $H$. Its change at constant pressure equals the heat flow.' },
      { term: 'Enthalpy change', def: '$\\Delta H$, products minus reactants. Negative when heat is released and positive when heat is absorbed.' },
      { term: 'Thermochemical equation', def: 'A balanced equation with phases and its $\\Delta H$.' },
      { term: 'Energy diagram', def: 'A picture with enthalpy on the vertical axis, comparing reactants and products.' },
      { term: 'State function', def: 'A property that depends only on the current state, not on how it got there. Enthalpy is one.' },
      { term: "Hess's law", def: 'If a reaction is a sum of steps, its $\\Delta H$ is the sum of the steps\' $\\Delta H$ values.' },
      { term: 'Standard state', def: 'The most stable form of a substance at 1 bar and, usually, 25 °C.' },
      { term: 'Standard enthalpy of formation', def: 'The $\\Delta H$ for making 1 mol of a substance from its elements in their standard states. Symbol: $\\Delta H_f^\\circ$.' },
      { term: 'Bond enthalpy', def: 'The energy needed to break one mole of a given bond in the gas phase. Always positive.' },
      { term: 'Enthalpy of combustion', def: 'The $\\Delta H$ for burning 1 mol of a substance in oxygen. Always negative for fuels.' },
    ],
  });
})();
