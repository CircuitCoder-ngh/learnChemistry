/* Question bank for lesson 14: pH and buffers. All pH math is computed here in code. */
(function () {
  'use strict';
  const KW = 1.0e-14;
  /** A number as TeX, to n significant figures, in scientific notation when very big or small. */
  function tx(x, n = 2) {
    if (x === 0) return '0';
    const v = Number(x.toPrecision(n));
    const e = Math.floor(Math.log10(Math.abs(v)));
    if (e >= n + 2 || e < -2) return `${(v / Math.pow(10, e)).toFixed(n - 1)} \\times 10^{${e}}`;
    return Lab.sig(v, n);
  }
  /** A random value with 2 sig figs, such as 3.2e-4, in the given power-of-ten range. */
  const conc = (r, lo, hi) => Number((r.num(1.1, 9.8, 1) * Math.pow(10, -r.int(lo, hi))).toPrecision(2));
  const ph2 = (x) => x.toFixed(2);
  /** Accept a pH within 0.02 either way. The engine's tolerance is relative, so scale it. */
  const phTol = (pH) => 0.02 / Math.max(Math.abs(pH), 0.05);
  /** Positive root of x^2 + Kx - KC = 0, the exact answer for a weak acid or base. */
  const weakRoot = (K, C) => (-K + Math.sqrt(K * K + 4 * K * C)) / 2;

  /* Ka values at 25 °C. Tables differ a little, so problems always state the value they use. */
  const ACIDS = [
    { name: 'hydrofluoric acid', f: 'HF', base: 'F-', Ka: 6.8e-4 },
    { name: 'nitrous acid', f: 'HNO2', base: 'NO2-', Ka: 4.5e-4 },
    { name: 'formic acid', f: 'HCOOH', base: 'HCOO-', Ka: 1.8e-4 },
    { name: 'benzoic acid', f: 'C6H5COOH', base: 'C6H5COO-', Ka: 6.3e-5 },
    { name: 'acetic acid', f: 'CH3COOH', base: 'CH3COO-', Ka: 1.8e-5 },
    { name: 'hypochlorous acid', f: 'HClO', base: 'ClO-', Ka: 3.0e-8 },
    { name: 'hydrocyanic acid', f: 'HCN', base: 'CN-', Ka: 6.2e-10 },
  ];
  const BASES = [
    { name: 'ammonia', f: 'NH3', acid: 'NH4+', Kb: 1.8e-5 },
    { name: 'methylamine', f: 'CH3NH2', acid: 'CH3NH3+', Kb: 4.4e-4 },
    { name: 'pyridine', f: 'C5H5N', acid: 'C5H5NH+', Kb: 1.7e-9 },
  ];
  const BUFFERS = [
    { acid: 'CH3COOH', base: 'CH3COO-', pKa: 4.74 },
    { acid: 'HCOOH', base: 'HCOO-', pKa: 3.74 },
    { acid: 'C6H5COOH', base: 'C6H5COO-', pKa: 4.20 },
    { acid: 'HClO', base: 'ClO-', pKa: 7.52 },
    { acid: 'NH4+', base: 'NH3', pKa: 9.25 },
    { acid: 'H2PO4-', base: 'HPO4^2-', pKa: 7.21 },
  ];

  Bank.add('ph', {
    quiz: [
      {
        q: 'Solution X has pH 3 and solution Y has pH 5. How do their $[\\ce{H3O+}]$ values compare?',
        options: ['X has 2 times more', 'X has 100 times more', 'Y has 2 times more', 'Y has 100 times more'],
        answer: 1,
        why: 'Each pH step is a factor of 10. Two steps is $10 \\times 10 = 100$, and the lower pH has more hydronium.',
      },
      {
        q: 'What is the pH of 0.010 M $\\ce{HNO3}$?',
        options: ['0.010', '1.00', '2.00', '12.00'],
        answer: 2,
        why: '$\\ce{HNO3}$ is strong, so $[\\ce{H3O+}] = 0.010$ M and $\\text{pH} = -\\log(0.010) = 2.00$.',
      },
      {
        q: 'At the same concentration, a weak acid has what pH compared with a strong acid?',
        options: ['A higher pH', 'A lower pH', 'The same pH', 'It cannot be compared'],
        answer: 0,
        why: 'Only a small share of the weak acid ionizes, so there is less $\\ce{H3O+}$, which means a higher pH.',
      },
      {
        q: 'Which acid is strongest?',
        options: ['$\\ce{HCN}$, $K_a = 6.2 \\times 10^{-10}$', '$\\ce{HClO}$, $K_a = 3.0 \\times 10^{-8}$', '$\\ce{CH3COOH}$, $K_a = 1.8 \\times 10^{-5}$', '$\\ce{HF}$, $K_a = 6.8 \\times 10^{-4}$'],
        answer: 3,
        why: 'The bigger $K_a$ is, the more it ionizes. Watch the exponents: $10^{-4}$ is much larger than $10^{-10}$.',
      },
      {
        q: 'What is the conjugate base of $\\ce{H2PO4-}$?',
        options: ['$\\ce{H3PO4}$', '$\\ce{HPO4^2-}$', '$\\ce{PO4^3-}$', '$\\ce{OH-}$'],
        answer: 1,
        why: 'A conjugate base has one less proton, and one more negative charge.',
      },
      {
        q: 'Which mixture makes a buffer?',
        options: ['$\\ce{HCl}$ and $\\ce{NaCl}$', '$\\ce{HNO3}$ and $\\ce{NaNO3}$', '$\\ce{CH3COOH}$ and $\\ce{NaCH3COO}$', '$\\ce{NaOH}$ and $\\ce{NaCl}$'],
        answer: 2,
        why: 'A buffer needs a weak acid and its conjugate base. The others have a strong acid or base, whose partner does nothing.',
      },
      {
        q: 'A buffer has $[\\ce{A-}] = [\\ce{HA}]$. What is its pH?',
        options: ['7.00', 'Equal to $\\text{p}K_a$', 'Equal to $K_a$', '14 minus $\\text{p}K_a$'],
        answer: 1,
        why: '$\\log(1) = 0$, so Henderson-Hasselbalch reduces to $\\text{pH} = \\text{p}K_a$.',
      },
      {
        q: 'You dilute a weak acid 10 times. What happens to its percent ionization?',
        options: ['It goes up', 'It goes down', 'It stays the same', 'It falls to zero'],
        answer: 0,
        why: 'Le Chatelier: diluting favors the side with more dissolved particles, so a larger share ionizes. The pH still rises, since the total $\\ce{H3O+}$ is more dilute.',
      },
      {
        q: 'A strong acid is diluted more and more with pure water. What does its pH approach?',
        options: ['14', '0', '7, from below', 'It rises without limit'],
        answer: 2,
        why: 'Eventually the water\'s own ions take over. An acid never turns basic by dilution, so the pH approaches 7 but stays below it.',
      },
    ],

    gens: [
      {
        id: 'ph-from-h',
        title: 'pH from $[\\ce{H3O+}]$',
        make(r) {
          const h = conc(r, 1, 12);
          const pH = -Math.log10(h);
          return {
            q: `Find the pH of a solution with $[\\ce{H3O+}] = ${tx(h)}$ M.`,
            answer: pH, unit: '', tol: phTol(pH), answerText: ph2(pH),
            hint: 'Use $\\text{pH} = -\\log[\\ce{H3O+}]$. Your calculator needs the base-10 log.',
            steps: [
              `$\\text{pH} = -\\log(${tx(h)}) = ${ph2(pH)}$.`,
              `Two sig figs in the concentration gives two decimal places in the pH. It is ${pH < 7 ? 'below 7, so acidic' : pH > 7 ? 'above 7, so basic' : 'neutral'}.`,
            ],
          };
        },
      },
      {
        id: 'h-from-ph',
        title: '$[\\ce{H3O+}]$ from pH',
        make(r) {
          const pH = r.num(0.5, 13.5, 2);
          const h = Math.pow(10, -pH);
          return {
            q: `A solution has a pH of ${ph2(pH)}. What is $[\\ce{H3O+}]$?`,
            answer: h, unit: 'M', tol: 0.03, sf: 2,
            hint: 'Undo the log: $[\\ce{H3O+}] = 10^{-\\text{pH}}$.',
            steps: [`Undo the log: $[\\ce{H3O+}] = 10^{-${ph2(pH)}} = ${tx(h)}$ M.`],
          };
        },
      },
      {
        id: 'ph-from-oh',
        title: 'pH from $[\\ce{OH-}]$',
        make(r) {
          const oh = conc(r, 1, 11);
          const pOH = -Math.log10(oh), pH = 14 - pOH;
          return {
            q: `A solution has $[\\ce{OH-}] = ${tx(oh)}$ M at 25 °C. What is its pH?`,
            answer: pH, unit: '', tol: phTol(pH), answerText: ph2(pH),
            hint: 'Find pOH first, then subtract it from 14.00.',
            steps: [
              `$\\text{pOH} = -\\log(${tx(oh)}) = ${ph2(pOH)}$.`,
              `$\\text{pH} = 14.00 - ${ph2(pOH)} = ${ph2(pH)}$.`,
            ],
          };
        },
      },
      {
        id: 'strong',
        title: 'Strong acids and bases',
        make(r) {
          const kind = r.pick(['HCl', 'HNO3', 'HBr', 'HClO4', 'NaOH', 'KOH', 'Ca(OH)2', 'Ba(OH)2']);
          const isAcid = kind[0] === 'H';
          const n = kind.includes('(OH)2') ? 2 : 1;
          // Ca(OH)2 and Ba(OH)2 are only moderately soluble, so keep them dilute enough to really dissolve.
          const c = Number(r.pick([1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 8.0]) * Math.pow(10, n === 2 ? -r.int(3, 4) : -r.int(1, 4)));
          if (isAcid) {
            const pH = -Math.log10(c);
            return {
              q: `Find the pH of ${tx(c)} M $\\ce{${kind}}$.`,
              answer: pH, unit: '', tol: phTol(pH), answerText: ph2(pH),
              hint: 'A strong acid ionizes completely, so $[\\ce{H3O+}]$ equals its molarity.',
              steps: [`$\\ce{${kind}}$ is a strong acid, so $[\\ce{H3O+}] = ${tx(c)}$ M.`, `$\\text{pH} = -\\log(${tx(c)}) = ${ph2(pH)}$.`],
            };
          }
          const oh = n * c, pOH = -Math.log10(oh), pH = 14 - pOH;
          return {
            q: `Find the pH of ${tx(c)} M $\\ce{${kind}}$ at 25 °C.`,
            answer: pH, unit: '', tol: phTol(pH), answerText: ph2(pH),
            hint: n === 2 ? 'Each formula unit releases 2 hydroxide ions. Start with $[\\ce{OH-}]$.' : 'A strong base dissociates completely. Start with $[\\ce{OH-}]$.',
            steps: [
              n === 2 ? `Each $\\ce{${kind}}$ gives 2 $\\ce{OH-}$: $[\\ce{OH-}] = 2 \\times ${tx(c)} = ${tx(oh)}$ M.` : `$\\ce{${kind}}$ is a strong base, so $[\\ce{OH-}] = ${tx(oh)}$ M.`,
              `$\\text{pOH} = -\\log(${tx(oh)}) = ${ph2(pOH)}$.`,
              `$\\text{pH} = 14.00 - ${ph2(pOH)} = ${ph2(pH)}$.`,
            ],
          };
        },
      },
      {
        id: 'weak-acid',
        title: 'pH of a weak acid',
        make(r) {
          const A = r.pick(ACIDS);
          const C = r.pick([0.050, 0.10, 0.15, 0.20, 0.25, 0.40, 0.50, 1.0]);
          const Cs = Lab.sig(C, 2);
          const x = weakRoot(A.Ka, C);
          const pH = -Math.log10(x);
          const approx = Math.sqrt(A.Ka * C);
          const pct = (approx / C) * 100;
          const okShort = pct < 5;
          const hStep = okShort
            ? `Since $K_a$ is small, treat $${Cs} - x$ as $${Cs}$: $x = \\sqrt{(${tx(A.Ka)})(${Cs})} = ${tx(approx, 3)}$ M. That is ${pct.toFixed(2)}% of ${Cs}, under 5%, so the shortcut holds.`
            : `The shortcut gives ${pct.toFixed(1)}%, over the 5% limit, so use the quadratic: $x^2 + (${tx(A.Ka)})x - ${tx(A.Ka * C, 3)} = 0$, giving $x = ${tx(x, 3)}$ M.`;
          return {
            q: `Find the pH of ${Cs} M ${A.name}, $\\ce{${A.f}}$, with $K_a = ${tx(A.Ka)}$.`,
            answer: pH, unit: '', tol: phTol(pH), answerText: ph2(okShort ? -Math.log10(approx) : pH),
            hint: 'Set up $K_a = \\dfrac{x^2}{C - x}$, where $x = [\\ce{H3O+}]$.',
            verify: Math.abs((x * x) / (C - x) / A.Ka - 1),
            steps: [
              `ICE table bottom row: $[\\ce{HA}] = ${Cs} - x$, $[\\ce{H3O+}] = [\\ce{A-}] = x$.`,
              `$K_a$: $${tx(A.Ka)} = \\dfrac{x^2}{${Cs} - x}$.`,
              hStep,
              `$\\text{pH} = -\\log(${tx(okShort ? approx : x, 3)}) = ${ph2(okShort ? -Math.log10(approx) : pH)}$.`,
            ],
          };
        },
      },
      {
        id: 'percent',
        title: 'Percent ionization',
        make(r) {
          const A = r.pick(ACIDS);
          const C = r.pick([0.010, 0.050, 0.10, 0.25, 0.50, 1.0]);
          const Cs = Lab.sig(C, 2);
          const x = weakRoot(A.Ka, C);
          const pct = (x / C) * 100;
          return {
            q: `What percent of ${Cs} M $\\ce{${A.f}}$ is ionized? Its $K_a$ is $${tx(A.Ka)}$.`,
            answer: pct, unit: '%', tol: 0.04,
            hint: 'Find $x = [\\ce{H3O+}]$, then divide by the starting concentration.',
            verify: Math.abs((x * x) / (C - x) / A.Ka - 1),
            steps: [
              `Solve $${tx(A.Ka)} = \\dfrac{x^2}{${Cs} - x}$ for $x$, by the shortcut or the quadratic. It gives $x = ${tx(x, 3)}$ M.`,
              `Percent: $\\dfrac{${tx(x, 3)}}{${Cs}} \\times 100 = ${tx(pct, 3)}\\%$.`,
            ],
          };
        },
      },
      {
        id: 'ka-from-ph',
        title: '$K_a$ from pH',
        make(r) {
          const A = r.pick(ACIDS);
          const C = r.pick([0.10, 0.20, 0.25, 0.50, 1.0]);
          const Cs = Lab.sig(C, 2);
          const pH = Number((-Math.log10(weakRoot(A.Ka, C))).toFixed(2));
          const h = Math.pow(10, -pH);
          const Ka = (h * h) / (C - h);
          return {
            q: `A ${Cs} M solution of a weak acid HA has a pH of ${ph2(pH)}. Calculate $K_a$.`,
            answer: Ka, unit: '', tol: 0.04, sf: 2,
            hint: 'The pH gives $[\\ce{H3O+}]$, which is also $[\\ce{A-}]$. Then $[\\ce{HA}] = C - x$.',
            steps: [
              `$[\\ce{H3O+}] = 10^{-${ph2(pH)}} = ${tx(h, 3)}$ M. This is $x$, and $[\\ce{A-}]$ is the same.`,
              `$[\\ce{HA}] = ${Cs} - ${tx(h, 3)} = ${tx(C - h, 3)}$ M.`,
              `$K_a = \\dfrac{(${tx(h, 3)})^2}{${tx(C - h, 3)}} = ${tx(Ka)}$.`,
            ],
          };
        },
      },
      {
        id: 'ka-kb',
        title: '$K_a$ and $K_b$',
        make(r) {
          if (r.int(0, 1)) {
            const A = r.pick(ACIDS);
            const Kb = KW / A.Ka;
            return {
              q: `$\\ce{${A.f}}$ has $K_a = ${tx(A.Ka)}$. What is $K_b$ for its conjugate base, $\\ce{${A.base}}$?`,
              answer: Kb, unit: '', tol: 0.03, sf: 2,
              hint: 'For a conjugate pair, $K_a K_b = K_w = 1.0 \\times 10^{-14}$.',
              steps: [`$K_b = \\dfrac{K_w}{K_a} = \\dfrac{1.0 \\times 10^{-14}}{${tx(A.Ka)}} = ${tx(Kb)}$.`],
            };
          }
          const B = r.pick(BASES);
          const Ka = KW / B.Kb;
          return {
            q: `$\\ce{${B.f}}$ has $K_b = ${tx(B.Kb)}$. What is $K_a$ for its conjugate acid, $\\ce{${B.acid}}$?`,
            answer: Ka, unit: '', tol: 0.03, sf: 2,
            hint: 'For a conjugate pair, $K_a K_b = K_w = 1.0 \\times 10^{-14}$.',
            steps: [`$K_a = \\dfrac{K_w}{K_b} = \\dfrac{1.0 \\times 10^{-14}}{${tx(B.Kb)}} = ${tx(Ka)}$.`],
          };
        },
      },
      {
        id: 'weak-base',
        title: 'pH of a weak base',
        make(r) {
          const B = r.pick(BASES);
          const C = r.pick([0.050, 0.10, 0.20, 0.25, 0.50, 1.0]);
          const Cs = Lab.sig(C, 2);
          const x = weakRoot(B.Kb, C);
          const pOH = -Math.log10(x), pH = 14 - pOH;
          return {
            q: `Find the pH of ${Cs} M ${B.name}, $\\ce{${B.f}}$, with $K_b = ${tx(B.Kb)}$, at 25 °C.`,
            answer: pH, unit: '', tol: phTol(pH), answerText: ph2(pH),
            hint: 'Here $x$ is $[\\ce{OH-}]$. Find pOH first, then subtract from 14.00.',
            verify: Math.abs((x * x) / (C - x) / B.Kb - 1),
            steps: [
              `$K_b = \\dfrac{x^2}{${Cs} - x}$, with $x = [\\ce{OH-}]$. Solving gives $x = ${tx(x, 3)}$ M.`,
              `$\\text{pOH} = -\\log(${tx(x, 3)}) = ${ph2(pOH)}$.`,
              `$\\text{pH} = 14.00 - ${ph2(pOH)} = ${ph2(pH)}$.`,
            ],
          };
        },
      },
      {
        id: 'hh',
        title: 'Buffer pH',
        make(r) {
          const B = r.pick(BUFFERS);
          const a = r.num(0.05, 0.80, 2), b = r.num(0.05, 0.80, 2);
          const pH = B.pKa + Math.log10(b / a);
          return {
            q: `A buffer holds ${a.toFixed(2)} M $\\ce{${B.acid}}$ and ${b.toFixed(2)} M $\\ce{${B.base}}$. The $\\text{p}K_a$ of the acid is ${B.pKa.toFixed(2)}. What is the pH?`,
            answer: pH, unit: '', tol: phTol(pH), answerText: ph2(pH),
            hint: 'Use $\\text{pH} = \\text{p}K_a + \\log\\frac{[\\ce{A-}]}{[\\ce{HA}]}$, with the base on top.',
            steps: [
              `$\\text{pH} = ${B.pKa.toFixed(2)} + \\log\\dfrac{${b.toFixed(2)}}{${a.toFixed(2)}}$.`,
              `$\\log(${tx(b / a, 3)}) = ${Math.log10(b / a).toFixed(2)}$, so $\\text{pH} = ${ph2(pH)}$.`,
            ],
          };
        },
      },
      {
        id: 'hh-ratio',
        title: 'Buffer ratio for a target pH',
        make(r) {
          const B = r.pick(BUFFERS);
          const target = Number((B.pKa + r.num(-0.8, 0.8, 1)).toFixed(2));
          const ratio = Math.pow(10, target - B.pKa);
          return {
            q: `You want a pH ${target.toFixed(2)} buffer from $\\ce{${B.acid}}$ and $\\ce{${B.base}}$, with $\\text{p}K_a = ${B.pKa.toFixed(2)}$. What ratio $[\\text{base}]/[\\text{acid}]$ do you need?`,
            answer: ratio, unit: '', tol: 0.03,
            hint: 'Rearrange Henderson-Hasselbalch, then undo the log.',
            steps: [
              `$${target.toFixed(2)} = ${B.pKa.toFixed(2)} + \\log(\\text{ratio})$, so $\\log(\\text{ratio}) = ${(target - B.pKa).toFixed(2)}$.`,
              `$\\text{ratio} = 10^{${(target - B.pKa).toFixed(2)}} = ${tx(ratio, 3)}$.`,
            ],
          };
        },
      },
      {
        id: 'buffer-add',
        title: 'Buffer after adding acid or base',
        make(r) {
          const na = r.pick([0.10, 0.15, 0.20, 0.25, 0.30, 0.40, 0.50]), nb = r.pick([0.10, 0.15, 0.20, 0.25, 0.30, 0.40, 0.50]);
          const add = r.pick([0.010, 0.020, 0.025, 0.030, 0.040, 0.050]);
          const isAcid = r.int(0, 1) === 1;
          const pKa = 4.74;
          const a2 = isAcid ? na + add : na - add, b2 = isAcid ? nb - add : nb + add;
          const pH = pKa + Math.log10(b2 / a2);
          return {
            q: `One liter of buffer holds ${na.toFixed(2)} mol of acetic acid and ${nb.toFixed(2)} mol of acetate ($\\text{p}K_a = 4.74$). You add ${add.toFixed(3)} mol of ${isAcid ? '$\\ce{HCl}$' : '$\\ce{NaOH}$'}. Assume the volume stays the same. Find the new pH.`,
            answer: pH, unit: '', tol: phTol(pH), answerText: ph2(pH),
            hint: 'Do the neutralization in moles first. Strong acid uses up the base partner, and strong base uses up the acid partner.',
            steps: [
              isAcid ? `The acid reacts with acetate: $\\ce{H3O+ + CH3COO- -> CH3COOH + H2O}$.` : `The base reacts with acetic acid: $\\ce{OH- + CH3COOH -> CH3COO- + H2O}$.`,
              `New moles: acetic acid is ${na.toFixed(2)} ${isAcid ? '+' : '−'} ${add.toFixed(3)} = ${a2.toFixed(3)} mol. Acetate is ${nb.toFixed(2)} ${isAcid ? '−' : '+'} ${add.toFixed(3)} = ${b2.toFixed(3)} mol.`,
              `$\\text{pH} = 4.74 + \\log\\dfrac{${b2.toFixed(3)}}{${a2.toFixed(3)}} = ${ph2(pH)}$.`,
            ],
          };
        },
      },
      {
        id: 'conjugate',
        title: 'Conjugate pairs',
        make(r) {
          const set = [
            ['HF', 'F-', 'H2F+'], ['HCl', 'Cl-', 'H2Cl+'], ['H2O', 'OH-', 'H3O+'], ['H3O+', 'H2O', 'H2O2'], ['NH4+', 'NH3', 'NH2-'], ['NH3', 'NH2-', 'NH4+'],
            ['H2SO4', 'HSO4-', 'H3SO4+'], ['HSO4-', 'SO4^2-', 'H2SO4'], ['H2CO3', 'HCO3-', 'H3CO3+'], ['HCO3-', 'CO3^2-', 'H2CO3'], ['H3PO4', 'H2PO4-', 'H4PO4+'], ['H2PO4-', 'HPO4^2-', 'H3PO4'], ['CH3COOH', 'CH3COO-', 'CH3COOH2+'],
          ];
          const [acid, base, up] = r.pick(set);
          const askBase = r.int(0, 3) > 0;
          const wrongDrop = (f) => f.replace(/[+-]$|\^\d[+-]$/, '');
          const ans = askBase ? base : acid;
          const given = askBase ? acid : base;
          const pool = askBase ? [up, wrongDrop(base), 'OH-', 'H2O', 'H3O+'] : [base, wrongDrop(acid) === acid ? 'H3O+' : wrongDrop(acid), 'H3O+', 'OH-', 'H2O'];
          const list = pool.filter((x) => x !== ans && x !== given);
          const wrong = list.filter((x, i) => list.indexOf(x) === i).slice(0, 3);
          const show = (f) => `$\\ce{${f}}$`;
          const mc = r.mc(show(ans), wrong.map(show));
          return {
            q: askBase ? `What is the conjugate base of $\\ce{${acid}}$?` : `What is the conjugate acid of $\\ce{${base}}$?`,
            choices: mc.choices, answer: mc.answer,
            steps: [askBase
              ? `A conjugate base is the acid with one proton removed: one less H, and one more negative charge. That gives $\\ce{${base}}$.`
              : `A conjugate acid is the base with one proton added: one more H, and one more positive charge. That gives $\\ce{${acid}}$.`],
          };
        },
      },
    ],

    cards: [
      { front: 'What does pH count?', back: 'Hydronium ions on a log scale: $\\text{pH} = -\\log[\\ce{H3O+}]$. One step is a factor of 10.' },
      { front: 'What is $K_w$ at 25 °C?', back: '$[\\ce{H3O+}][\\ce{OH-}] = 1.0 \\times 10^{-14}$, so $\\text{pH} + \\text{pOH} = 14.00$.' },
      { front: 'Name the common strong acids.', back: '$\\ce{HCl}$, $\\ce{HBr}$, $\\ce{HI}$, $\\ce{HNO3}$, $\\ce{H2SO4}$, $\\ce{HClO4}$.' },
      { front: 'Strong versus concentrated?', back: 'Strong is the share of molecules that ionize. Concentrated is how much acid is present.' },
      { front: 'What does a larger $K_a$ mean?', back: 'A stronger acid, and so a weaker conjugate base.' },
      { front: 'How are $K_a$ and $K_b$ related?', back: 'For a conjugate pair, $K_a K_b = K_w$.' },
      { front: 'What makes a buffer?', back: 'A weak acid and its conjugate base (or a weak base and its conjugate acid), both in good amounts.' },
      { front: 'Henderson-Hasselbalch equation?', back: '$\\text{pH} = \\text{p}K_a + \\log\\frac{[\\ce{A-}]}{[\\ce{HA}]}$.' },
      { front: 'What happens to percent ionization when a weak acid is diluted?', back: 'It goes up, even as the pH rises too.' },
    ],

    terms: [
      { term: 'pH', def: 'A log measure of acidity: $\\text{pH} = -\\log[\\ce{H3O+}]$. Below 7 is acidic at 25 °C.' },
      { term: 'pOH', def: 'A log measure of hydroxide: $\\text{pOH} = -\\log[\\ce{OH-}]$. At 25 °C, $\\text{pH} + \\text{pOH} = 14.00$.' },
      { term: 'Hydronium ion', def: 'The ion $\\ce{H3O+}$, a proton attached to a water molecule. Often written $\\ce{H+}$ for short.' },
      { term: 'Autoionization of water', def: 'Two water molecules exchanging a proton to make $\\ce{H3O+}$ and $\\ce{OH-}$.' },
      { term: 'Ion product of water', def: 'The value $K_w = [\\ce{H3O+}][\\ce{OH-}]$, equal to $1.0 \\times 10^{-14}$ at 25 °C.' },
      { term: 'Strong acid', def: 'An acid that ionizes completely in water.' },
      { term: 'Weak acid', def: 'An acid that ionizes only partly in water, reaching an equilibrium.' },
      { term: 'Acid ionization constant', def: 'The value $K_a$, the equilibrium constant for a weak acid giving up a proton to water.' },
      { term: 'Base ionization constant', def: 'The value $K_b$, the equilibrium constant for a weak base taking a proton from water.' },
      { term: 'Conjugate pair', def: 'An acid and the base it becomes after losing one proton, such as $\\ce{HF}$ and $\\ce{F-}$.' },
      { term: 'Percent ionization', def: 'The share of a weak acid that has ionized, as a percent of its starting concentration.' },
      { term: 'Buffer', def: 'A solution of a weak acid and its conjugate base that resists changes in pH.' },
      { term: 'Henderson-Hasselbalch equation', def: 'The buffer equation, $\\text{pH} = \\text{p}K_a + \\log\\frac{[\\ce{A-}]}{[\\ce{HA}]}$.' },
      { term: 'Universal indicator', def: 'A dye mixture whose color changes across the pH range.' },
    ],
  });
})();
