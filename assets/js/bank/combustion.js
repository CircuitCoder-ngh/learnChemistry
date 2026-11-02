/* Question bank for 4.3 Combustion equations.
   Every coefficient on this page is computed by Chem.balance and atom-checked in code. Nothing is hardcoded.
   Chem is also used by the lesson's page script, through Bank.combustionChem. */
(function () {
  'use strict';
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const gcdAll = (list) => list.reduce((a, b) => gcd(a, b));

  /* ---------- The chemistry engine ---------- */
  const NAMES = {
    alkane: ['methane', 'ethane', 'propane', 'butane', 'pentane', 'hexane', 'heptane', 'octane', 'nonane', 'decane'],
    alkene: [null, 'ethene', 'propene', 'butene', 'pentene', 'hexene', 'heptene', 'octene'],
    alkyne: [null, 'ethyne', 'propyne', 'butyne', 'pentyne', 'hexyne', 'heptyne', 'octyne'],
    alcohol: ['methanol', 'ethanol', 'propanol', 'butanol', 'pentanol', 'hexanol', 'heptanol', 'octanol'],
  };
  const sub = (n) => (n === 1 ? '' : String(n));

  /** Build a fuel object. family: alkane, alkene, alkyne, alcohol. n: number of carbons. */
  function fuel(family, n) {
    const H = { alkane: 2 * n + 2, alkene: 2 * n, alkyne: 2 * n - 2, alcohol: 2 * n + 2 }[family];
    const z = family === 'alcohol' ? 1 : 0;
    const flat = `C${sub(n)}H${H}${z ? 'O' : ''}`;
    const f = family === 'alcohol' ? `C${sub(n)}H${2 * n + 1}OH` : flat;
    return { family, n, x: n, y: H, z, f, flat, name: NAMES[family][n - 1] };
  }
  const GLUCOSE = { family: 'sugar', n: 6, x: 6, y: 12, z: 6, f: 'C6H12O6', flat: 'C6H12O6', name: 'glucose' };

  /** Smallest whole numbers for a CxHyOz + b O2 -> c CO2 + d H2O. Throws if the atoms do not match. */
  function balance(x, y, z = 0) {
    // Per one fuel: c = x, d = y / 2, b = x + y / 4 - z / 2. Times 4 makes everything whole.
    const raw = [4, 4 * x + y - 2 * z, 4 * x, 2 * y];
    const k = gcdAll(raw);
    const [a, b, c, d] = raw.map((v) => v / k);
    if (a * x !== c || a * y !== 2 * d || a * z + 2 * b !== 2 * c + d || [a, b, c, d].some((v) => !Number.isInteger(v) || v <= 0)) {
      throw new Error(`Balance failed for C${x}H${y}O${z}`);
    }
    return { a, b, c, d };
  }
  /** The O2 count for exactly one fuel molecule, as num / den in lowest terms. */
  function o2PerFuel(x, y, z = 0) {
    const num = 4 * x + y - 2 * z, den = 4, k = gcd(num, den);
    return { num: num / k, den: den / k, value: num / den };
  }
  /** Smallest whole numbers for a CxHyOz + b O2 -> c CO + d H2O (incomplete, to carbon monoxide). */
  function balanceCO(x, y, z = 0) {
    const raw = [4, 2 * x + y - 2 * z, 4 * x, 2 * y];
    const k = gcdAll(raw);
    const [a, b, c, d] = raw.map((v) => v / k);
    if (a * x !== c || a * y !== 2 * d || a * z + 2 * b !== c + d) throw new Error('CO balance failed');
    return { a, b, c, d };
  }
  /** Parse one side of an equation into [{ coef, f, counts }]. Coef may be 7/2 or 3.5. Returns null when it cannot be read. */
  function parseSide(side) {
    const terms = side.split('+').map((s) => s.trim()).filter(Boolean);
    if (!terms.length) return null;
    const out = [];
    for (const t of terms) {
      const m = /^(\d+\s*\/\s*\d+|\d*\.\d+|\d+)?\s*([A-Za-z(][A-Za-z0-9()]*)$/.exec(t);
      if (!m) return null;
      let coef = 1;
      if (m[1]) {
        if (m[1].includes('/')) { const [p, q] = m[1].split('/').map(Number); coef = q ? p / q : NaN; } else coef = parseFloat(m[1]);
      }
      if (!Number.isFinite(coef) || coef <= 0) return null;
      out.push({ coef, raw: m[1] || '', f: m[2], counts: Bank.countAtoms(m[2]) });
    }
    return out;
  }
  /** Read a typed equation. Accepts ->, -->, =>, =, the arrow character, and subscript digits. */
  function parseEquation(text) {
    const s = String(text).replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (c) => '₀₁₂₃₄₅₆₇₈₉'.indexOf(c)).replace(/[⟶→]/g, '->').replace(/-+>|=+>|=/g, '->');
    const parts = s.split('->');
    if (parts.length !== 2) return { error: 'arrow' };
    const left = parseSide(parts[0]), right = parseSide(parts[1]);
    if (!left || !right) return { error: 'read' };
    return { left, right };
  }
  /** Atom totals for a parsed side. */
  function tally(side) {
    const t = {};
    side.forEach((term) => { for (const e in term.counts) t[e] = (t[e] || 0) + term.coef * term.counts[e]; });
    return t;
  }

  /* ---------- Text helpers ---------- */
  const cf = (n) => (n === 1 ? '' : String(n));
  /** The equation as mhchem source. */
  const eqCe = (fu, k) => `${cf(k.a)}${fu.f} + ${cf(k.b)}O2 -> ${cf(k.c)}CO2 + ${cf(k.d)}H2O`;
  /** Rendered equation that can wrap at the arrow on a narrow phone. */
  const wrapCe = (src) => { const [l, r] = src.split('->'); return `$\\ce{${l.trim()}}$ $\\rightarrow$ $\\ce{${r.trim()}}$`; };
  const eqTex = (fu, k) => wrapCe(eqCe(fu, k));
  const fracTex = (num, den) => (den === 1 ? String(num) : `\\tfrac{${num}}{${den}}`);
  /** Every sensible way to type the same equation, for the practice gym's text matcher. */
  function eqForms(left, right) {
    const arrows = ['->', '→', '=', '-->', '=>', '⟶'];
    const term = ([c, forms]) => forms.flatMap((f) => (c === 1 ? [f, '1' + f] : [c + f]));
    const sideForms = (side) => {
      const a = term(side[0]), b = side[1] ? term(side[1]) : null;
      if (!b) return a;
      return a.flatMap((p) => b.flatMap((q) => [p + '+' + q, q + '+' + p]));
    };
    const L = sideForms(left), R = sideForms(right), out = [];
    arrows.forEach((ar) => L.forEach((l) => R.forEach((r) => out.push(l + ar + r))));
    return out;
  }
  const fuelForms = (fu) => (fu.f === fu.flat ? [fu.f] : [fu.f, fu.flat]);
  const accepts = (fu, k) => eqForms([[k.a, fuelForms(fu)], [k.b, ['O2']]], [[k.c, ['CO2']], [k.d, ['H2O']]]);
  const coefForms = (list) => [list.join(','), list.join(', '), list.join(' ')];

  /** Worked solution using the lesson's method: C, then H, then O last, then clear fractions, then check. */
  function solveSteps(fu) {
    const { x, y, z } = fu;
    const k = balance(x, y, z);
    const h2o = y / 2, rightO = 2 * x + h2o, needO = rightO - z;
    const o2 = o2PerFuel(x, y, z);
    const co2c = cf(x), h2oc = cf(h2o);
    const lines = [
      `Write the skeleton. Products of complete combustion are always $\\ce{CO2}$ and $\\ce{H2O}$: ${wrapCe(`${fu.f} + O2 -> CO2 + H2O`)}.`,
      `<b>Carbon first.</b> The fuel has ${x} C, so write ${x} in front of $\\ce{CO2}$: $\\ce{${co2c}CO2}$.`,
      `<b>Hydrogen next.</b> The fuel has ${y} H. Each water holds 2, so ${y} ÷ 2 = ${h2o}: $\\ce{${h2oc}H2O}$.`,
      `<b>Oxygen last.</b> Count O on the right: $${x} \\times 2 + ${h2o} \\times 1 = ${rightO}$ O atoms.` +
        (z ? ` The fuel already brings ${z}, so $\\ce{O2}$ must supply $${rightO} - ${z} = ${needO}$.` : '') +
        ` Each $\\ce{O2}$ holds 2, so $${needO} \\div 2 = ${fracTex(o2.num, o2.den)}$.`,
    ];
    if (k.a !== 1) {
      lines.push(`That is a fraction, and you cannot have part of a molecule. <b>Multiply every coefficient by ${k.a}</b>: ${eqTex(fu, k)}.`);
    } else {
      lines.push(`All whole numbers already, so you are done: ${eqTex(fu, k)}.`);
    }
    lines.push(`Check by counting. C: ${k.a * x} and ${k.c}. H: ${k.a * y} and ${2 * k.d}. O: ${k.a * z + 2 * k.b} and ${2 * k.c + k.d}. Both sides match.`);
    return lines;
  }

  /* Molar masses come from the element table at call time. */
  const mm = (f) => Bank.molarMass(f);
  const r2 = (v) => v.toFixed(2);

  const writeProblem = (fu) => {
    const k = balance(fu.x, fu.y, fu.z);
    return {
      q: `Write the balanced equation for the complete combustion of ${fu.name}, $\\ce{${fu.f}}$. Use the smallest whole numbers.`,
      accept: accepts(fu, k),
      placeholder: 'like 2C2H6 + 7O2 -> 4CO2 + 6H2O',
      hint: 'Products are CO2 and H2O. Balance C first, then H, then O last. Clear any fraction by doubling everything.',
      steps: solveSteps(fu),
    };
  };

  Bank.combustionChem = { fuel, GLUCOSE, balance, balanceCO, o2PerFuel, parseEquation, tally, eqCe, wrapCe, gcd, NAMES };

  Bank.add('combustion', {
    quiz: [
      {
        q: 'Which three things make up the fire triangle?',
        options: ['Fuel, oxygen and heat', 'Fuel, carbon dioxide and heat', 'Oxygen, water and light', 'Fuel, water and oxygen'],
        answer: 0,
        why: 'Take away any one of fuel, oxygen or heat and the fire goes out. Carbon dioxide and water are what fire makes, not what it needs.',
      },
      {
        q: 'What are the products when a hydrocarbon burns completely?',
        options: ['$\\ce{CO}$ and $\\ce{H2}$', '$\\ce{CO2}$ and $\\ce{H2}$', '$\\ce{CO2}$ and $\\ce{H2O}$', '$\\ce{C}$ and $\\ce{H2O}$'],
        answer: 2,
        why: 'Complete combustion always gives $\\ce{CO2}$ and $\\ce{H2O}$. Hydrogen leaves as water, never as $\\ce{H2}$ gas. $\\ce{CO}$ and $\\ce{C}$ only appear when oxygen runs short.',
      },
      {
        q: 'In what order should you balance a combustion equation?',
        options: ['O, then H, then C', 'C, then H, then O', 'H, then O, then C', 'Any order works just as easily'],
        answer: 1,
        why: 'C and H each appear in only one product, so they are forced. O appears in both products, and $\\ce{O2}$ contains nothing else, so you can set it last without disturbing anything.',
      },
      {
        q: 'When you balance $\\ce{C4H10}$, oxygen comes out as $\\tfrac{13}{2}\\ce{O2}$. What should you do?',
        options: ['Round it up to 7', 'Round it down to 6', 'Multiply every coefficient by 2', 'Double only the $\\ce{O2}$'],
        answer: 2,
        why: 'Every coefficient gets multiplied, giving $\\ce{2C4H10 + 13O2}$ $\\rightarrow$ $\\ce{8CO2 + 10H2O}$. Rounding changes the atom count, and doubling only one term unbalances everything else.',
      },
      {
        q: 'Balancing methanol, $\\ce{CH3OH}$, a student counts 3 H in the fuel. What went wrong?',
        options: ['Nothing, the fuel has 3 H', 'They missed the H in the OH group: there are 4', 'They should have counted 6 H', 'Hydrogen is not counted in alcohols'],
        answer: 1,
        why: '$\\ce{CH3OH}$ has 3 H on the carbon plus 1 on the oxygen, for 4 in total. The equation is $\\ce{2CH3OH + 3O2}$ $\\rightarrow$ $\\ce{2CO2 + 4H2O}$.',
      },
      {
        q: 'Why does ethanol, $\\ce{C2H5OH}$, need less $\\ce{O2}$ per molecule than ethane, $\\ce{C2H6}$?',
        options: ['It has fewer carbon atoms', 'It has fewer hydrogen atoms', 'It already contains one oxygen atom', 'Alcohols do not need oxygen to burn'],
        answer: 2,
        why: 'Both make 2 $\\ce{CO2}$ and 3 $\\ce{H2O}$ per fuel. The O in ethanol counts toward that total, so ethanol needs 3 $\\ce{O2}$ while ethane needs $\\tfrac{7}{2}$.',
      },
      {
        q: 'You close the air hole on a Bunsen burner and the flame turns yellow. What makes it yellow?',
        options: ['Extra oxygen burning', 'Glowing specks of hot soot', 'Carbon dioxide gas', 'Water vapor catching fire'],
        answer: 1,
        why: 'Short of oxygen, some carbon does not fully react. It forms tiny soot particles that glow yellow when hot. That same soot blackens anything held in the flame.',
      },
      {
        q: 'Why is carbon monoxide so dangerous?',
        options: ['It smells so bad you faint', 'It binds to hemoglobin far more tightly than $\\ce{O2}$ does', 'It turns into carbon dioxide inside your lungs', 'It is a very hot gas'],
        answer: 1,
        why: 'CO grabs the oxygen-carrying seats in hemoglobin over 200 times more tightly than $\\ce{O2}$, so your blood cannot carry oxygen. It has no color and no smell, which is why homes need detectors.',
      },
      {
        q: 'What is the product when magnesium burns in oxygen?',
        options: ['$\\ce{MgO}$', '$\\ce{CO2}$ and $\\ce{H2O}$', '$\\ce{MgO2}$', '$\\ce{Mg + O}$'],
        answer: 0,
        why: 'With no carbon or hydrogen in the fuel, $\\ce{CO2}$ and $\\ce{H2O}$ are impossible. The product is the oxide: $\\ce{2Mg + O2}$ $\\rightarrow$ $\\ce{2MgO}$.',
      },
      {
        q: '10 g of methane burns and makes about 27 g of $\\ce{CO2}$. How can more mass come out than the fuel you burned?',
        options: ['Mass is not conserved in fire', 'The extra mass comes from $\\ce{O2}$ in the air', 'Carbon atoms grow when they get hot', 'It cannot, the 27 g must be wrong'],
        answer: 1,
        why: 'Most of the mass of $\\ce{CO2}$ is oxygen taken from the air. Total mass in (fuel plus $\\ce{O2}$) always equals total mass out.',
      },
    ],

    gens: [
      {
        id: 'alkane',
        title: 'Write: alkanes',
        make(r) { return writeProblem(fuel('alkane', r.int(1, 10))); },
      },
      {
        id: 'alkene-alkyne',
        title: 'Write: alkenes and alkynes',
        make(r) { return writeProblem(fuel(r.pick(['alkene', 'alkyne']), r.int(2, 8))); },
      },
      {
        id: 'alcohol',
        title: 'Write: alcohols',
        make(r) { return writeProblem(fuel('alcohol', r.int(1, 8))); },
      },
      {
        id: 'fractions',
        title: 'Clear the fraction',
        make(r) {
          const pool = [];
          ['alkane', 'alkene', 'alkyne', 'alcohol'].forEach((fam) => {
            for (let n = fam === 'alkane' || fam === 'alcohol' ? 1 : 2; n <= 8; n++) {
              const fu = fuel(fam, n);
              if (balance(fu.x, fu.y, fu.z).a !== 1) pool.push(fu);
            }
          });
          const fu = r.pick(pool);
          const k = balance(fu.x, fu.y, fu.z), o = o2PerFuel(fu.x, fu.y, fu.z);
          return {
            q: `After balancing C, H and then O, you reach $\\ce{${fu.f}}$ + $\\tfrac{${o.num}}{${o.den}}\\ce{O2}$ $\\ce{-> ${cf(fu.x)}CO2 + ${cf(fu.y / 2)}H2O}$. Type the four whole-number coefficients in order, separated by commas.`,
            accept: coefForms([k.a, k.b, k.c, k.d]),
            placeholder: 'fuel, O2, CO2, H2O',
            hint: 'Multiply every coefficient by the denominator of the fraction, including the 1 in front of the fuel.',
            steps: [
              `The fraction $\\tfrac{${o.num}}{${o.den}}$ has ${o.den} on the bottom, so multiply every coefficient by ${o.den}.`,
              `Fuel: $1 \\times ${o.den} = ${k.a}$. $\\ce{O2}$: $\\tfrac{${o.num}}{${o.den}} \\times ${o.den} = ${k.b}$. $\\ce{CO2}$: $${fu.x} \\times ${o.den} = ${k.c}$. $\\ce{H2O}$: $${fu.y / 2} \\times ${o.den} = ${k.d}$.`,
              `Result: ${eqTex(fu, k)}.`,
            ],
          };
        },
      },
      {
        id: 'o2-count',
        title: 'How much oxygen?',
        make(r) {
          const fam = r.pick(['alkane', 'alkene', 'alkyne', 'alcohol']);
          const fu = fuel(fam, r.int(fam === 'alkene' || fam === 'alkyne' ? 2 : 1, 8));
          const o = o2PerFuel(fu.x, fu.y, fu.z);
          const rightO = 2 * fu.x + fu.y / 2;
          return {
            q: `How many moles of $\\ce{O2}$ does it take to burn exactly 1 mol of ${fu.name}, $\\ce{${fu.f}}$, completely? Give a decimal if needed.`,
            answer: o.value, unit: 'mol', tol: 0.001, answerText: String(o.value),
            hint: 'Work out the products for 1 fuel. Add up O on the right, subtract any O in the fuel, then divide by 2.',
            steps: [
              `1 mol of fuel makes ${fu.x} mol $\\ce{CO2}$ and ${fu.y / 2} mol $\\ce{H2O}$.`,
              `O needed on the right: $${fu.x} \\times 2 + ${fu.y / 2} = ${rightO}$ mol of O atoms.` + (fu.z ? ` The fuel supplies ${fu.z}, leaving $${rightO - fu.z}$.` : ''),
              `Each $\\ce{O2}$ gives 2 O, so $${rightO - fu.z} \\div 2 = ${o.value}$ mol $\\ce{O2}$.`,
            ],
          };
        },
      },
      {
        id: 'general',
        title: 'General formulas',
        make(r) {
          const fam = r.pick(['alkane', 'alkene', 'alkyne']);
          const n = r.int(2, 12);
          const H = { alkane: 2 * n + 2, alkene: 2 * n, alkyne: 2 * n - 2 }[fam];
          const rule = { alkane: 'C_nH_{2n+2}', alkene: 'C_nH_{2n}', alkyne: 'C_nH_{2n-2}' }[fam];
          const f = `C${n}H${H}`;
          return {
            q: `Write the formula of the ${fam} with ${n} carbon atoms.`,
            accept: [f],
            placeholder: 'like C3H8',
            hint: `The general formula for an ${fam === 'alkane' ? 'alkane' : fam} is $${rule}$.`,
            steps: [`The general formula is $${rule}$.`, `With $n = ${n}$, hydrogen count is ${H}, so the formula is $\\ce{${f}}$.`],
          };
        },
      },
      {
        id: 'spot',
        title: 'Spot the right equation',
        make(r) {
          const fam = r.pick(['alkane', 'alkene', 'alkyne', 'alcohol']);
          const fu = fuel(fam, r.int(fam === 'alkene' || fam === 'alkyne' ? 2 : 1, 6));
          const k = balance(fu.x, fu.y, fu.z);
          const right = eqTex(fu, k);
          const eq = (a, b, c, d) => wrapCe(`${cf(a)}${fu.f} + ${cf(b)}O2 -> ${cf(c)}CO2 + ${cf(d)}H2O`);
          const o = o2PerFuel(fu.x, fu.y, fu.z);
          const wrongs = [
            wrapCe(`${cf(k.a)}${fu.f} + ${cf(k.b)}O2 -> ${cf(k.c)}CO2 + ${cf(k.d)}H2`),
            eq(k.a, k.b + 1, k.c, k.d),
            eq(k.a, k.b, k.c + k.a, k.d),
            wrapCe(`${cf(k.a)}${fu.f} -> ${cf(k.c)}CO2 + ${cf(k.d)}H2O`),
            eq(k.a, k.b, k.c, k.d + k.a),
          ];
          const mc = r.mc(right, r.shuffle(wrongs).slice(0, 3));
          return {
            q: `Which is the correct balanced equation for the complete combustion of ${fu.name}?`,
            choices: mc.choices, answer: mc.answer,
            steps: [
              `Count atoms on each side of the correct one, ${right}: C ${k.a * fu.x} and ${k.c}, H ${k.a * fu.y} and ${2 * k.d}, O ${k.a * fu.z + 2 * k.b} and ${2 * k.c + k.d}.`,
              `The fuel needs $${fracTex(o.num, o.den)}$ $\\ce{O2}$ per molecule. Hydrogen must end up as $\\ce{H2O}$, not $\\ce{H2}$, and $\\ce{O2}$ must be on the left.`,
            ],
          };
        },
      },
      {
        id: 'mass-co2',
        title: 'Grams of CO₂ made',
        make(r) {
          const fam = r.pick(['alkane', 'alkane', 'alkene', 'alcohol']);
          const fu = fuel(fam, r.int(fam === 'alkene' ? 2 : 1, 8));
          const k = balance(fu.x, fu.y, fu.z);
          const M = mm(fu.flat), Mco2 = mm('CO2');
          const g = r.num(5, 150, 1);
          const nF = g / M, nC = (nF * k.c) / k.a, mC = nC * Mco2;
          return {
            q: `What mass of $\\ce{CO2}$ forms when ${g} g of ${fu.name}, $\\ce{${fu.f}}$, burns completely in plenty of oxygen?`,
            answer: mC, unit: 'g',
            hint: 'Balance first. Then go grams of fuel, to moles of fuel, to moles of CO2, to grams of CO2.',
            steps: [
              `Balanced equation: ${eqTex(fu, k)}.`,
              `Moles of fuel: $${g}\\text{ g} \\div ${r2(M)}\\text{ g/mol} = ${Lab.sig(nF, 3)}\\text{ mol}$.`,
              `Mole ratio: $${Lab.sig(nF, 3)}\\text{ mol fuel} \\times \\dfrac{${k.c}\\text{ mol CO}_2}{${k.a}\\text{ mol fuel}} = ${Lab.sig(nC, 3)}\\text{ mol CO}_2$.`,
              `Mass: $${Lab.sig(nC, 3)}\\text{ mol} \\times ${r2(Mco2)}\\text{ g/mol} = ${Lab.sig(mC, 3)}\\text{ g CO}_2$.`,
            ],
          };
        },
      },
      {
        id: 'mass-o2',
        title: 'Grams of O₂ needed',
        make(r) {
          const fam = r.pick(['alkane', 'alkyne', 'alcohol']);
          const fu = fuel(fam, r.int(fam === 'alkyne' ? 2 : 1, 8));
          const k = balance(fu.x, fu.y, fu.z);
          const M = mm(fu.flat), MO = mm('O2');
          const g = r.num(2, 80, 1);
          const nF = g / M, nO = (nF * k.b) / k.a, mO = nO * MO;
          return {
            q: `How many grams of $\\ce{O2}$ are needed to burn ${g} g of ${fu.name}, $\\ce{${fu.f}}$, completely?`,
            answer: mO, unit: 'g',
            hint: 'Use the balanced equation and the mole ratio of O2 to fuel. Mole ratios use coefficients, never masses.',
            steps: [
              `Balanced equation: ${eqTex(fu, k)}.`,
              `Moles of fuel: $${g}\\text{ g} \\div ${r2(M)}\\text{ g/mol} = ${Lab.sig(nF, 3)}\\text{ mol}$.`,
              `Mole ratio: $${Lab.sig(nF, 3)}\\text{ mol fuel} \\times \\dfrac{${k.b}\\text{ mol O}_2}{${k.a}\\text{ mol fuel}} = ${Lab.sig(nO, 3)}\\text{ mol O}_2$.`,
              `Mass: $${Lab.sig(nO, 3)}\\text{ mol} \\times ${r2(MO)}\\text{ g/mol} = ${Lab.sig(mO, 3)}\\text{ g O}_2$.`,
            ],
          };
        },
      },
      {
        id: 'incomplete',
        title: 'Incomplete combustion',
        make(r) {
          const fu = r.pick([fuel('alkane', 1), fuel('alkane', 2), fuel('alkane', 3), fuel('alkane', 4), fuel('alkane', 5), fuel('alkane', 8), fuel('alkene', 2), fuel('alkene', 3), fuel('alkyne', 2), fuel('alcohol', 1), fuel('alcohol', 2)]);
          const k = balanceCO(fu.x, fu.y, fu.z);
          const rightO = fu.x + fu.y / 2, need = rightO - fu.z;
          return {
            q: `Short of oxygen, ${fu.name} makes carbon monoxide instead of carbon dioxide: ${wrapCe(`${fu.f} + O2 -> CO + H2O`)}. Type the four smallest whole-number coefficients in order, separated by commas.`,
            accept: coefForms([k.a, k.b, k.c, k.d]),
            placeholder: 'fuel, O2, CO, H2O',
            hint: 'Same method: C, then H, then O last. But now each carbon carries only one O.',
            steps: [
              `Carbon: ${fu.x} C gives ${fu.x} $\\ce{CO}$. Hydrogen: ${fu.y} H gives ${fu.y / 2} $\\ce{H2O}$.`,
              `Oxygen: the right has $${fu.x} + ${fu.y / 2} = ${rightO}$ O.` + (fu.z ? ` The fuel brings ${fu.z}, leaving ${need}.` : '') + ` Each $\\ce{O2}$ gives 2, so $${need} \\div 2 = ${need / 2}$ $\\ce{O2}$.`,
              `Clear any fraction, then reduce: ${wrapCe(`${cf(k.a)}${fu.f} + ${cf(k.b)}O2 -> ${cf(k.c)}CO + ${cf(k.d)}H2O`)}.`,
              `Check O: left ${k.a * fu.z + 2 * k.b}, right ${k.c + k.d}. Compare with complete combustion, which would need more $\\ce{O2}$.`,
            ],
          };
        },
      },
      {
        id: 'not-carbon',
        title: 'Burning elements',
        make(r) {
          // Element burned, how many of that element in one reactant unit, oxide, atoms of element and of O in one oxide.
          const set = [
            ['hydrogen', 'H2', 'H', 'H2O'], ['magnesium', 'Mg', 'Mg', 'MgO'], ['sulfur', 'S', 'S', 'SO2'], ['carbon', 'C', 'C', 'CO2'],
            ['aluminum', 'Al', 'Al', 'Al2O3'], ['calcium', 'Ca', 'Ca', 'CaO'], ['lithium', 'Li', 'Li', 'Li2O'], ['zinc', 'Zn', 'Zn', 'ZnO'],
          ];
          const [name, react, sym, ox] = r.pick(set);
          const c = Bank.countAtoms(ox), perUnit = Bank.countAtoms(react)[sym];
          // a react + b O2 -> d oxide. Start from 2 oxide so O2 is whole, then reduce.
          let a = (2 * c[sym]) / perUnit, b = c.O, d = 2;
          const k = gcdAll([a, b, d]); a /= k; b /= k; d /= k;
          if (a * perUnit !== d * c[sym] || 2 * b !== d * c.O) throw new Error('Oxide balance failed');
          return {
            q: `${name[0].toUpperCase() + name.slice(1)} burns in oxygen to give $\\ce{${ox}}$. Write the balanced equation with the smallest whole numbers.`,
            accept: eqForms([[a, [react]], [b, ['O2']]], [[d, [ox]]]),
            placeholder: 'like 2Mg + O2 -> 2MgO',
            hint: `There is no carbon or hydrogen pattern here. Count ${sym} and O on each side, then fix them one at a time.`,
            steps: [
              `Skeleton: $\\ce{${react} + O2 -> ${ox}}$.`,
              `Oxygen comes in pairs, and one $\\ce{${ox}}$ holds ${c.O} O. Try coefficients until both elements match.`,
              `Result: $\\ce{${cf(a)}${react} + ${cf(b)}O2 -> ${cf(d)}${ox}}$. Check: ${sym} ${a * perUnit} and ${d * c[sym]}; O ${2 * b} and ${d * c.O}.`,
            ],
          };
        },
      },
      {
        id: 'heat',
        title: 'Heat from burning',
        make(r) {
          const [name, f, dH] = r.pick([['methane', 'CH4', 890], ['propane', 'C3H8', 2220], ['ethanol', 'C2H6O', 1367], ['octane', 'C8H18', 5471], ['methanol', 'CH4O', 726], ['glucose', 'C6H12O6', 2803]]);
          const M = mm(f), g = r.num(5, 200, 1), n = g / M, q = n * dH;
          return {
            q: `Burning 1 mol of ${name}, $\\ce{${f === 'C2H6O' ? 'C2H5OH' : f === 'CH4O' ? 'CH3OH' : f}}$, releases about ${dH} kJ. How much heat is released by burning ${g} g?`,
            answer: q, unit: 'kJ',
            hint: 'Find the moles of fuel first, then multiply by the kJ per mole.',
            steps: [
              `Moles: $${g}\\text{ g} \\div ${r2(M)}\\text{ g/mol} = ${Lab.sig(n, 3)}\\text{ mol}$.`,
              `Heat: $${Lab.sig(n, 3)}\\text{ mol} \\times ${dH}\\text{ kJ/mol} = ${Lab.sig(q, 3)}\\text{ kJ}$.`,
            ],
          };
        },
      },
    ],

    cards: [
      { front: 'What is combustion?', back: 'A rapid reaction of a fuel with oxygen, releasing heat and light.' },
      { front: 'Name the three sides of the fire triangle.', back: 'Fuel, oxygen, heat. Remove any one and the fire goes out.' },
      { front: 'What are the products of complete combustion of a hydrocarbon?', back: '$\\ce{CO2}$ and $\\ce{H2O}$. Always these two, and never $\\ce{H2}$.' },
      { front: 'What order do you balance a combustion equation in?', back: 'C first, then H, then O last.' },
      { front: 'What do you do with a fractional $\\ce{O2}$ coefficient?', back: 'Multiply every coefficient by the denominator, usually 2, to get whole numbers.' },
      { front: 'General formulas of alkanes, alkenes and alkynes', back: 'Alkane $C_nH_{2n+2}$, alkene $C_nH_{2n}$, alkyne $C_nH_{2n-2}$.' },
      { front: 'Balance methane burning.', back: '$\\ce{CH4 + 2O2}$ $\\rightarrow$ $\\ce{CO2 + 2H2O}$' },
      { front: 'Balance ethane burning.', back: '$\\ce{2C2H6 + 7O2}$ $\\rightarrow$ $\\ce{4CO2 + 6H2O}$' },
      { front: 'Balance propane burning.', back: '$\\ce{C3H8 + 5O2}$ $\\rightarrow$ $\\ce{3CO2 + 4H2O}$' },
      { front: 'Balance ethanol burning.', back: '$\\ce{C2H5OH + 3O2}$ $\\rightarrow$ $\\ce{2CO2 + 3H2O}$. The O in the fuel counts.' },
      { front: 'What does incomplete combustion produce?', back: '$\\ce{CO}$ or soot ($\\ce{C}$) plus $\\ce{H2O}$, and less heat. It happens when $\\ce{O2}$ is short.' },
      { front: 'Why is a yellow flame yellow?', back: 'Tiny specks of hot soot glow yellow. A blue flame has enough oxygen and little soot.' },
      { front: 'What does burning an element like Mg or S give?', back: 'Its oxide: $\\ce{2Mg + O2}$ $\\rightarrow$ $\\ce{2MgO}$, $\\ce{S + O2}$ $\\rightarrow$ $\\ce{SO2}$.' },
    ],

    terms: [
      { term: 'Combustion', def: 'A rapid reaction of a substance with oxygen that releases heat and light.' },
      { term: 'Fuel', def: 'A substance burned to release energy.' },
      { term: 'Fire triangle', def: 'The three things a fire needs: fuel, oxygen and heat.' },
      { term: 'Hydrocarbon', def: 'A compound made of only carbon and hydrogen.' },
      { term: 'Complete combustion', def: 'Burning with enough oxygen, so carbon ends up as $\\ce{CO2}$ and hydrogen as $\\ce{H2O}$.' },
      { term: 'Incomplete combustion', def: 'Burning with too little oxygen, so some carbon ends up as $\\ce{CO}$ or soot.' },
      { term: 'Alkane', def: 'A hydrocarbon with only single bonds. General formula $C_nH_{2n+2}$.' },
      { term: 'Alkene', def: 'A hydrocarbon with one carbon-carbon double bond. General formula $C_nH_{2n}$.' },
      { term: 'Alkyne', def: 'A hydrocarbon with one carbon-carbon triple bond. General formula $C_nH_{2n-2}$.' },
      { term: 'Alcohol', def: 'An organic compound with an OH group, such as methanol, $\\ce{CH3OH}$.' },
      { term: 'Soot', def: 'Fine particles of carbon made by incomplete combustion. Hot soot glows yellow in a flame.' },
      { term: 'Carbon monoxide', def: '$\\ce{CO}$, a colorless, odorless, poisonous gas made when carbon burns short of oxygen.' },
    ],
  });
})();
