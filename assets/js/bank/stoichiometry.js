/* Question bank for 4.4 Stoichiometry. Every equation is checked for balance when this file loads. */
(function () {
  'use strict';
  const parse = (s) => {
    const side = (x) => x.split(' + ').map((t) => { const m = /^(\d*)(.+)$/.exec(t.trim()); return { n: m[1] ? +m[1] : 1, f: m[2] }; });
    const [l, r] = s.split(' -> ');
    const rx = { s, r: side(l), p: side(r) };
    const tally = (list) => { const c = {}; list.forEach(({ n, f }) => { const a = Bank.countAtoms(f); for (const e in a) c[e] = (c[e] || 0) + a[e] * n; }); return c; };
    const a = tally(rx.r), b = tally(rx.p);
    Object.keys(Object.assign({}, a, b)).forEach((e) => { if (a[e] !== b[e]) throw new Error('Unbalanced equation: ' + s); });
    rx.all = rx.r.concat(rx.p);
    return rx;
  };
  /* Reactions with names for word problems. */
  const RX = [
    ['2H2 + O2 -> 2H2O', 'Hydrogen burns to make water.'],
    ['N2 + 3H2 -> 2NH3', 'The Haber process makes ammonia.'],
    ['CH4 + 2O2 -> CO2 + 2H2O', 'Methane, the main gas in a stove, burns.'],
    ['C3H8 + 5O2 -> 3CO2 + 4H2O', 'Propane burns in a barbecue.'],
    ['2C4H10 + 13O2 -> 8CO2 + 10H2O', 'Butane burns in a lighter.'],
    ['2C8H18 + 25O2 -> 16CO2 + 18H2O', 'Octane burns in an engine.'],
    ['C2H6O + 3O2 -> 2CO2 + 3H2O', 'Ethanol burns.'],
    ['C6H12O6 + 6O2 -> 6CO2 + 6H2O', 'Your cells burn glucose.'],
    ['2Mg + O2 -> 2MgO', 'Magnesium burns with a white flash.'],
    ['4Al + 3O2 -> 2Al2O3', 'Aluminum reacts with oxygen.'],
    ['4Fe + 3O2 -> 2Fe2O3', 'Iron rusts to iron(III) oxide.'],
    ['Fe2O3 + 3CO -> 2Fe + 3CO2', 'A blast furnace makes iron from ore.'],
    ['2Al + Fe2O3 -> Al2O3 + 2Fe', 'The thermite reaction makes molten iron.'],
    ['2Na + Cl2 -> 2NaCl', 'Sodium reacts with chlorine.'],
    ['2KClO3 -> 2KCl + 3O2', 'Potassium chlorate releases oxygen when heated.'],
    ['CaCO3 -> CaO + CO2', 'Limestone breaks down in a kiln.'],
    ['2NaN3 -> 2Na + 3N2', 'An airbag fills with nitrogen.'],
    ['2H2O2 -> 2H2O + O2', 'Hydrogen peroxide breaks down.'],
    ['Zn + 2HCl -> ZnCl2 + H2', 'Zinc reacts with hydrochloric acid.'],
    ['2Al + 6HCl -> 2AlCl3 + 3H2', 'Aluminum reacts with hydrochloric acid.'],
    ['Mg(OH)2 + 2HCl -> MgCl2 + 2H2O', 'An antacid neutralizes stomach acid.'],
    ['CaCO3 + 2HCl -> CaCl2 + H2O + CO2', 'Chalk fizzes in acid.'],
    ['4NH3 + 5O2 -> 4NO + 6H2O', 'Ammonia is oxidized to make fertilizer and nitric acid.'],
    ['2SO2 + O2 -> 2SO3', 'Sulfur dioxide is oxidized on the way to sulfuric acid.'],
    ['SiO2 + 2C -> Si + 2CO', 'Sand and carbon make silicon.'],
    ['2AgNO3 + Cu -> Cu(NO3)2 + 2Ag', 'Copper displaces silver from solution.'],
    ['P4 + 5O2 -> P4O10', 'White phosphorus burns.'],
    ['3NO2 + H2O -> 2HNO3 + NO', 'Nitrogen dioxide dissolves to make nitric acid.'],
  ].map(([s, story]) => Object.assign(parse(s), { story }));
  const IONIC = /^(NaCl|MgO|Al2O3|Fe2O3|KCl|KClO3|CaO|CaCO3|NaN3|ZnCl2|AlCl3|MgCl2|CaCl2|Mg\(OH\)2|AgNO3|Cu\(NO3\)2|SiO2|Mg|Al|Fe|Na|Zn|Si|C|Cu|Ag|P4)$/;
  const M = (f) => Bank.molarMass(f);
  const ce = (f) => `\\ce{${f}}`;
  const eqTex = (rx) => `\\ce{${rx.s}}`;
  const m2 = (f) => M(f).toFixed(2);
  /** Number in TeX to n sig figs. */
  const tn = (x, n = 3) => Lab.sig(x, n).replace(/\s*×\s*10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/, (m, e) => ' \\times 10^{' + e.replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => '-0123456789'['⁻⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)]) + '}');
  const g = (f) => `\\text{g }${ce(f)}`;
  const mol = (f) => `\\text{mol }${ce(f)}`;
  const ccel = (x) => `\\cancel{${x}}`;
  const pickPair = (r, onlyReactantFirst) => {
    const rx = r.pick(RX);
    const A = onlyReactantFirst ? r.pick(rx.r) : r.pick(rx.all);
    const others = rx.all.filter((t) => t.f !== A.f);
    const B = r.pick(others);
    return { rx, A, B };
  };
  /* The step strings every generator shares, so students see one method. */
  const down = (x, A) => { const n = x / M(A.f); return { n, s: `<b>Down:</b> grams to moles. $${tn(x)}\\ ${ccel(g(A.f))} \\times \\dfrac{1\\ ${mol(A.f)}}{${m2(A.f)}\\ ${ccel(g(A.f))}} = ${tn(n, 4)}\\ ${mol(A.f)}$.` }; };
  const across = (n, A, B) => { const nb = (n * B.n) / A.n; return { n: nb, s: `<b>Across:</b> use the coefficients, wanted over known. $${tn(n, 4)}\\ ${ccel(mol(A.f))} \\times \\dfrac{${B.n}\\ ${mol(B.f)}}{${A.n}\\ ${ccel(mol(A.f))}} = ${tn(nb, 4)}\\ ${mol(B.f)}$.` }; };
  const up = (n, B) => { const x = n * M(B.f); return { x, s: `<b>Up:</b> moles to grams. $${tn(n, 4)}\\ ${ccel(mol(B.f))} \\times \\dfrac{${m2(B.f)}\\ ${g(B.f)}}{1\\ ${ccel(mol(B.f))}} = ${tn(x)}\\ ${g(B.f)}$.` }; };
  const masses = (A, B) => `Molar masses: $${ce(A.f)}$ is ${m2(A.f)} g/mol and $${ce(B.f)}$ is ${m2(B.f)} g/mol.`;

  Bank.add('stoichiometry', {
    quiz: [
      {
        q: 'In $\\ce{N2 + 3H2 -> 2NH3}$, what do the coefficients 1, 3 and 2 tell you?',
        options: ['The mole ratio of the substances', 'The mass ratio of the substances', 'The number of atoms in each molecule', 'How fast each substance reacts'],
        answer: 0,
        why: 'Coefficients count particles, so they count moles. They say nothing about grams, and subscripts are what tell you the atoms in a molecule.',
      },
      {
        q: 'In $\\ce{2H2 + O2 -> 2H2O}$, you have 3.0 mol of $\\ce{O2}$. How many moles of $\\ce{H2O}$ can form?',
        options: ['1.5 mol', '3.0 mol', '6.0 mol', '9.0 mol'],
        answer: 2,
        why: 'The ratio is 2 mol $\\ce{H2O}$ for every 1 mol $\\ce{O2}$, so $3.0 \\times \\frac{2}{1} = 6.0$ mol.',
      },
      {
        q: 'A student says "10 g of $\\ce{H2}$ reacts with 5 g of $\\ce{O2}$, because the equation $\\ce{2H2 + O2 -> 2H2O}$ says 2 to 1." What is wrong?',
        options: ['Nothing, that is correct', 'Coefficients are mole ratios, so grams must be changed to moles first', 'The ratio should be 1 to 2 in grams', 'Hydrogen does not react with oxygen by mass'],
        answer: 1,
        why: 'The 2 to 1 is in moles. By mass, hydrogen and oxygen react about 1 to 8, because an $\\ce{O2}$ molecule is about 16 times heavier than an $\\ce{H2}$ molecule.',
      },
      {
        q: 'To go from grams of A to grams of B, what is the correct order?',
        options: ['Multiply by the mass ratio of A and B', 'Grams A to grams B to moles B', 'Grams A to moles A to moles B to grams B', 'Grams A to moles B to moles A to grams B'],
        answer: 2,
        why: 'Down, across, up. Grams A to moles A, then the mole ratio to moles B, then moles B to grams B.',
      },
      {
        q: 'Which is always true in a chemical reaction?',
        options: ['The grams of each substance stay the same', 'Total moles of molecules stay the same', 'The total mass stays the same', 'Each product has the same mass as each reactant'],
        answer: 2,
        why: 'Atoms are only rearranged, so total mass stays the same. Moles of molecules can change: in $\\ce{N2 + 3H2 -> 2NH3}$, 4 mol become 2 mol.',
      },
      {
        q: 'To change moles of $\\ce{CH4}$ to moles of $\\ce{O2}$ in $\\ce{CH4 + 2O2 -> CO2 + 2H2O}$, which factor do you multiply by?',
        options: ['$\\dfrac{1\\text{ mol CH}_4}{2\\text{ mol O}_2}$', '$\\dfrac{2\\text{ mol O}_2}{1\\text{ mol CH}_4}$', '$\\dfrac{32.00\\text{ g O}_2}{16.04\\text{ g CH}_4}$', '$\\dfrac{2\\text{ mol CO}_2}{1\\text{ mol CH}_4}$'],
        answer: 1,
        why: 'Put what you want on top and what you have on the bottom, so mol $\\ce{CH4}$ cancels.',
      },
      {
        q: 'You burn some fuel and the $\\ce{CO2}$ made has <b>more</b> mass than the fuel. How can that be?',
        options: ['It cannot. There must be a measuring error', 'The fuel gained mass from the heat', 'Atoms were created during burning', 'The $\\ce{CO2}$ also contains oxygen atoms taken from the air'],
        answer: 3,
        why: 'Every $\\ce{CO2}$ carries two oxygen atoms that came from the air. The mass of the $\\ce{O2}$ used counts too, so total mass is still conserved.',
      },
      {
        q: 'A balanced equation has 4 mol of molecules on the left and 2 mol on the right. What does this mean?',
        options: ['The equation must be wrong', 'Mass was lost', 'Atoms regrouped into fewer, larger molecules', 'Half of the atoms were destroyed'],
        answer: 2,
        why: 'Moles of molecules can change. Atoms stay. In $\\ce{N2 + 3H2 -> 2NH3}$, 8 atoms in 4 molecules regroup into 8 atoms in 2 molecules.',
      },
    ],

    gens: [
      {
        id: 'mole-ratio',
        title: 'Moles to moles',
        make(r) {
          const { rx, A, B } = pickPair(r);
          const n = r.pick([0.25, 0.5, 0.75, 1.2, 1.5, 2.4, 3, 3.6, 4.5, 6]);
          const ans = (n * B.n) / A.n;
          return {
            q: `In $${eqTex(rx)}$, how many moles of $${ce(B.f)}$ go with ${Lab.sig(n, 2)} mol of $${ce(A.f)}$?`,
            answer: ans, unit: 'mol',
            hint: 'Write the mole ratio with what you want on top and what you have on the bottom.',
            steps: [
              `You start in the mole tunnel, so only one leg is needed. Read the coefficients: ${B.n} for $${ce(B.f)}$ and ${A.n} for $${ce(A.f)}$.`,
              `$${tn(n, 2)}\\ ${ccel(mol(A.f))} \\times \\dfrac{${B.n}\\ ${mol(B.f)}}{${A.n}\\ ${ccel(mol(A.f))}} = ${tn(ans)}\\ ${mol(B.f)}$.`,
            ],
          };
        },
      },
      {
        id: 'pick-ratio',
        title: 'Pick the mole ratio',
        make(r) {
          const { rx, A, B } = pickPair(r);
          const fr = (a, fa, b, fb) => `$\\dfrac{${a}\\ ${mol(fa)}}{${b}\\ ${mol(fb)}}$`;
          const right = fr(B.n, B.f, A.n, A.f);
          const wrongs = [fr(A.n, A.f, B.n, B.f), `$\\dfrac{${m2(B.f)}\\ ${g(B.f)}}{${m2(A.f)}\\ ${g(A.f)}}$`, `$\\dfrac{1\\ ${mol(B.f)}}{1\\ ${mol(A.f)}}$`, `$\\dfrac{${B.n * 2}\\ ${mol(B.f)}}{${A.n}\\ ${mol(A.f)}}$`];
          // With equal coefficients, 1 over 1 is the same ratio as the right answer, so it cannot be a wrong option.
          const mc = r.mc(right, wrongs.filter((w, i) => w !== right && !(i === 2 && A.n === B.n)).slice(0, 3));
          return {
            q: `In $${eqTex(rx)}$, which factor changes moles of $${ce(A.f)}$ into moles of $${ce(B.f)}$?`,
            choices: mc.choices, answer: mc.answer,
            steps: [
              `What you want goes on top, $${ce(B.f)}$, with its coefficient, ${B.n}.`,
              `What you know goes on the bottom, $${ce(A.f)}$, with its coefficient, ${A.n}. Then mol $${ce(A.f)}$ cancels.`,
              `Ratios of grams or molar masses never cross the tunnel. Only coefficients do.`,
            ],
          };
        },
      },
      {
        id: 'grams-to-moles',
        title: 'Grams to moles of product',
        make(r) {
          const { rx, A, B } = pickPair(r, true);
          const x = +(M(A.f) * r.num(0.2, 2.5, 3)).toPrecision(3);
          const d = down(x, A), a = across(d.n, A, B);
          return {
            q: `${rx.story} In $${eqTex(rx)}$, how many moles of $${ce(B.f)}$ go with ${Lab.sig(x, 3)} g of $${ce(A.f)}$?`,
            answer: a.n, unit: 'mol',
            hint: 'Two legs of the map: grams to moles, then the mole ratio.',
            steps: [`Molar mass of $${ce(A.f)}$ is ${m2(A.f)} g/mol.`, d.s, a.s],
          };
        },
      },
      {
        id: 'moles-to-grams',
        title: 'Moles to grams',
        make(r) {
          const { rx, A, B } = pickPair(r, true);
          const n = +r.num(0.1, 3, 2).toPrecision(2);
          const a = across(n, A, B), u = up(a.n, B);
          return {
            q: `${rx.story} In $${eqTex(rx)}$, what mass of $${ce(B.f)}$ goes with ${Lab.sig(n, 2)} mol of $${ce(A.f)}$?`,
            answer: u.x, unit: 'g',
            hint: 'You start in the tunnel. Go across with the mole ratio, then up with the molar mass.',
            steps: [`Molar mass of $${ce(B.f)}$ is ${m2(B.f)} g/mol.`, a.s.replace(tn(n, 4), tn(n, 2)), u.s],
          };
        },
      },
      {
        id: 'grams-to-grams',
        title: 'Grams to grams',
        make(r) {
          const { rx, A, B } = pickPair(r, true);
          const x = +(M(A.f) * r.num(0.15, 3, 3)).toPrecision(3);
          const d = down(x, A), a = across(d.n, A, B), u = up(a.n, B);
          return {
            q: `${rx.story} In $${eqTex(rx)}$, what mass of $${ce(B.f)}$ goes with ${Lab.sig(x, 3)} g of $${ce(A.f)}$?`,
            answer: u.x, unit: 'g',
            hint: 'Down, across, up. You cannot go straight from grams to grams.',
            steps: [masses(A, B), d.s, a.s, u.s],
          };
        },
      },
      {
        id: 'how-much-needed',
        title: 'How much reactant is needed?',
        make(r) {
          let rx, A, B;
          do { rx = r.pick(RX); } while (rx.r.length < 2);
          [A, B] = r.shuffle(rx.r);
          const x = +(M(A.f) * r.num(0.2, 2.5, 3)).toPrecision(3);
          const d = down(x, A), a = across(d.n, A, B), u = up(a.n, B);
          return {
            q: `In $${eqTex(rx)}$, what mass of $${ce(B.f)}$ is needed to react completely with ${Lab.sig(x, 3)} g of $${ce(A.f)}$?`,
            answer: u.x, unit: 'g',
            hint: 'Both are reactants, but the map works the same way.',
            steps: [masses(A, B), d.s, a.s, u.s],
          };
        },
      },
      {
        id: 'particles',
        title: 'Particles',
        make(r) {
          let rx, A, B;
          do { rx = r.pick(RX); A = r.pick(rx.r); B = r.pick(rx.all.filter((t) => t.f !== A.f)); } while (IONIC.test(B.f) || IONIC.test(A.f));
          const kind = r.pick(['g-to-n', 'n-to-g']);
          if (kind === 'g-to-n') {
            const x = +(M(A.f) * r.num(0.1, 2.5, 3)).toPrecision(3);
            const d = down(x, A), a = across(d.n, A, B), N = a.n * 6.022e23;
            return {
              q: `In $${eqTex(rx)}$, how many molecules of $${ce(B.f)}$ go with ${Lab.sig(x, 3)} g of $${ce(A.f)}$?`,
              answer: N, unit: 'molecules',
              hint: 'Grams to moles, moles to moles, then multiply by Avogadro\'s number.',
              steps: [`Molar mass of $${ce(A.f)}$ is ${m2(A.f)} g/mol.`, d.s, a.s, `<b>Side room:</b> moles to molecules. $${tn(a.n, 4)}\\ ${ccel(mol(B.f))} \\times \\dfrac{6.022 \\times 10^{23}\\text{ molecules}}{1\\ ${ccel(mol(B.f))}} = ${tn(N)}$ molecules.`],
            };
          }
          const N = +(r.num(1, 9, 1) * Math.pow(10, r.pick([22, 23]))).toPrecision(2);
          const n = N / 6.022e23;
          const a = across(n, A, B), u = up(a.n, B);
          return {
            q: `In $${eqTex(rx)}$, what mass of $${ce(B.f)}$ goes with ${tn(N, 2).includes('times') ? `$${tn(N, 2)}$` : Lab.sig(N, 2)} molecules of $${ce(A.f)}$?`,
            answer: u.x, unit: 'g',
            hint: 'Divide by Avogadro\'s number first to get into the mole tunnel.',
            steps: [`<b>Into the tunnel:</b> molecules to moles. $${tn(N, 2)}\\text{ molecules} \\times \\dfrac{1\\ ${mol(A.f)}}{6.022 \\times 10^{23}\\text{ molecules}} = ${tn(n, 4)}\\ ${mol(A.f)}$.`, a.s, u.s],
          };
        },
      },
      {
        id: 'mass-total',
        title: 'Conservation of mass',
        make(r) {
          const rx = r.pick(RX.filter((x) => x.r.length === 2 && x.p.length === 2));
          const k = r.num(0.2, 2, 2);
          const [R1, R2] = rx.r, [P1, P2] = rx.p;
          // Four sig figs, and the answer comes from the printed numbers. With three, a light product like H2 was swamped by rounding.
          const a = tn(k * R1.n * M(R1.f), 4), b = tn(k * R2.n * M(R2.f), 4), c = tn(k * P1.n * M(P1.f), 4);
          const sum = +a + +b, d = sum - +c;
          return {
            q: `In $${eqTex(rx)}$, ${a} g of $${ce(R1.f)}$ reacts completely with ${b} g of $${ce(R2.f)}$, making ${c} g of $${ce(P1.f)}$. How many grams of $${ce(P2.f)}$ form?`,
            answer: d, unit: 'g', tol: 0.03,
            hint: 'Total mass in equals total mass out. No moles needed.',
            steps: [
              `Atoms are only rearranged, so total mass is the same on both sides.`,
              `Total in: $${a} + ${b} = ${tn(sum, 5)}$ g.`,
              `Subtract the product you know: $${tn(sum, 5)} - ${c} = ${tn(d)}$ g of $${ce(P2.f)}$.`,
            ],
          };
        },
      },
      {
        id: 'exam-word',
        title: 'Exam style word problems',
        make(r) {
          const kind = r.int(0, 3);
          if (kind === 0) {
            const rx = RX.find((x) => x.s.startsWith('2NaN3'));
            const A = rx.r[0], B = rx.p[1];
            const x = r.int(40, 130);
            const d = down(x, A), a = across(d.n, A, B), u = up(a.n, B);
            return {
              q: `A car airbag fills with nitrogen from $${eqTex(rx)}$. How many grams of $${ce('N2')}$ does ${tn(x)} g of $${ce('NaN3')}$ make?`,
              answer: u.x, unit: 'g',
              hint: 'Down, across, up. The ratio is 3 mol $\\ce{N2}$ to 2 mol $\\ce{NaN3}$.',
              steps: [masses(A, B), d.s, a.s, u.s],
            };
          }
          if (kind === 1) {
            const rx = RX.find((x) => x.s.startsWith('Mg(OH)2'));
            const A = rx.r[0], B = rx.r[1];
            const x = +r.num(0.2, 1.2, 2).toPrecision(2);
            const d = down(x, A), a = across(d.n, A, B), u = up(a.n, B);
            return {
              q: `An antacid tablet holds ${Lab.sig(x, 2)} g of $${ce(A.f)}$. What mass of stomach acid, $${ce(B.f)}$, can it neutralize? The reaction is $${eqTex(rx)}$.`,
              answer: u.x, unit: 'g',
              hint: 'Two HCl are needed for each $\\ce{Mg(OH)2}$. Use that ratio in the middle.',
              steps: [masses(A, B), d.s, a.s, u.s],
            };
          }
          if (kind === 2) {
            const rx = RX.find((x) => x.s.startsWith('2C8H18'));
            const A = rx.r[0], B = rx.p[0];
            const x = r.int(2, 40) * 100;
            const d = down(x, A), a = across(d.n, A, B), u = up(a.n, B);
            return {
              q: `A car burns ${x} g of octane by $${eqTex(rx)}$. What mass of $${ce('CO2')}$ comes out of the tailpipe?`,
              answer: u.x, unit: 'g',
              hint: 'Your answer should be about 3 times the mass of the fuel, because oxygen from the air adds mass.',
              steps: [masses(A, B), d.s, a.s, u.s],
            };
          }
          const rx = RX.find((x) => x.s.startsWith('2Al + Fe2O3'));
          const A = rx.r[1], B = rx.p[1];
          const x = r.int(20, 300);
          const d = down(x, A), a = across(d.n, A, B), u = up(a.n, B);
          return {
            q: `Railway welders use the thermite reaction, $${eqTex(rx)}$. What mass of molten iron comes from ${tn(x)} g of $${ce(A.f)}$?`,
            answer: u.x, unit: 'g',
            hint: 'Each $\\ce{Fe2O3}$ gives 2 Fe.',
            steps: [masses(A, B), d.s, a.s, u.s],
          };
        },
      },
    ],

    cards: [
      { front: 'What does a coefficient in a balanced equation tell you?', back: 'The mole ratio. It counts molecules or formula units, and so it counts moles. It never counts grams.' },
      { front: 'What is the path from grams of A to grams of B?', back: 'Grams A to moles A (divide by molar mass), moles A to moles B (mole ratio), moles B to grams B (multiply by molar mass).' },
      { front: 'How do you write a mole ratio?', back: 'What you want on top, what you know on the bottom, using the coefficients as the numbers.' },
      { front: 'What is conserved in every reaction?', back: 'Total mass and the number of atoms of each element. Moles of molecules can change.' },
      { front: 'In $\\ce{2H2 + O2 -> 2H2O}$, what is the mass ratio of $\\ce{H2}$ to $\\ce{O2}$?', back: 'About 1 to 8 (4.03 g to 32.00 g). The 2 to 1 ratio is in moles.' },
      { front: 'Why can burning 1 kg of octane make more than 1 kg of $\\ce{CO2}$?', back: 'The $\\ce{CO2}$ also contains oxygen atoms from the air. 1 kg of octane makes about 3.08 kg of $\\ce{CO2}$.' },
    ],

    terms: [
      { term: 'Stoichiometry', def: 'Using a balanced equation to calculate the amounts of substances that react and form.' },
      { term: 'Coefficient', def: 'The number in front of a formula in a balanced equation. It gives the relative number of particles, and so of moles.' },
      { term: 'Mole ratio', def: 'A conversion factor built from two coefficients in a balanced equation, such as 2 mol H₂O per 1 mol O₂.' },
      { term: 'Conservation of mass', def: 'Total mass does not change in a chemical reaction, because atoms are only rearranged.' },
      { term: 'Reactant', def: 'A substance that gets used up in a reaction. Reactants are written on the left of the arrow.' },
      { term: 'Product', def: 'A substance formed in a reaction. Products are written on the right of the arrow.' },
    ],
  });
})();
