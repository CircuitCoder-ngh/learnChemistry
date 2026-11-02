/* Question bank for lesson 12: Reaction rates. */
(function () {
  'use strict';
  /** A number as TeX, to n significant figures, in scientific notation when it is very big or small. */
  function tx(x, n = 3) {
    if (x === 0) return '0';
    const v = Number(x.toPrecision(n));
    const e = Math.floor(Math.log10(Math.abs(v)));
    if (e >= n + 2 || e < -2) return `${(v / Math.pow(10, e)).toFixed(n - 1)} \\times 10^{${e}}`;
    return Lab.sig(v, n);
  }
  const tableHTML = (head, rows) => `<div class="tbl-wrap" style="position:relative"><table class="tbl"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const pow = (s, m) => (m === 0 ? '' : m === 1 ? `[\\text{${s}}]` : `[\\text{${s}}]^{${m}}`);
  const law = (m, n) => {
    const body = `${pow('A', m)}${pow('B', n)}`;
    return `$\\text{rate} = k${body}$`;
  };

  /** Three runs of an initial-rate experiment, with one reactant changed at a time. */
  function ratesProblem(r) {
    const m = r.int(0, 2), n = r.int(0, 2);
    const a0 = r.pick([0.10, 0.20, 0.050]), b0 = r.pick([0.10, 0.30, 0.050]);
    const fa = r.pick([2, 3]), fb = r.pick([2, 3]);
    const k = r.num(1.1, 9.8, 1) * Math.pow(10, -r.int(1, 3));
    const rate = (a, b) => k * Math.pow(a, m) * Math.pow(b, n);
    const runs = [[a0, b0], [a0 * fa, b0], [a0, b0 * fb]].map(([a, b]) => ({ a, b, v: rate(a, b) }));
    const table = tableHTML(['Run', '$[\\text{A}]$ (M)', '$[\\text{B}]$ (M)', 'Initial rate (M/s)'],
      runs.map((u, i) => [i + 1, u.a.toFixed(3), u.b.toFixed(3), `$${tx(u.v, 3)}$`]));
    const stepFor = (name, f, order, v2, run) => `Compare run 1 and run ${run}: only ${name} changes, by ${f} times. The rate changes by $${tx(v2, 3)} \\div ${tx(runs[0].v, 3)} = ${Lab.sig(Math.pow(f, order), 2).replace(/\.0$/, '')}$ times. Since $${f}^{${order}} = ${Math.pow(f, order)}$, the order in ${name} is ${order}.`;
    return { m, n, k, runs, table, a0, b0, stepA: stepFor('A', fa, m, runs[1].v, 2), stepB: stepFor('B', fb, n, runs[2].v, 3) };
  }

  Bank.add('kinetics', {
    quiz: [
      {
        q: 'Which is the main reason a 10 °C rise speeds up most reactions?',
        options: ['Molecules collide much more often', 'A larger fraction of collisions have at least the activation energy', 'The activation energy gets smaller', 'The reaction becomes more exothermic'],
        answer: 1,
        why: 'Collision frequency rises only slightly with temperature. The number of collisions above $E_a$ rises steeply.',
      },
      {
        q: 'What does a catalyst change?',
        options: ['$\\Delta H$ of the reaction', 'The amount of product at equilibrium', 'The activation energy, by offering another pathway', 'The balanced equation'],
        answer: 2,
        why: 'A catalyst offers a lower-energy path. The reactants and products sit at the same energies, so $\\Delta H$ does not change, and neither does the equilibrium position.',
      },
      {
        q: 'Doubling $[\\text{A}]$ makes the rate go up 4 times. What is the order in A?',
        options: ['Zero', 'First', 'Second', 'Fourth'],
        answer: 2,
        why: '$2^m = 4$, so $m = 2$. The answer is the exponent, not the size of the increase.',
      },
      {
        q: 'The balanced equation is $\\ce{2A + B -> C}$. What is the rate law?',
        options: ['$\\text{rate} = k[\\text{A}]^2[\\text{B}]$', '$\\text{rate} = k[\\text{A}][\\text{B}]$', '$\\text{rate} = k[\\text{C}]$', 'You cannot tell without experimental data'],
        answer: 3,
        why: 'Orders must be measured. They match the coefficients only for an elementary step, and this question does not say the equation is one.',
      },
      {
        q: 'A first-order reaction has a half-life of 20 s. What fraction remains after 60 s?',
        options: ['$\\frac{1}{2}$', '$\\frac{1}{3}$', '$\\frac{1}{8}$', 'None'],
        answer: 2,
        why: '60 s is 3 half-lives: $\\frac{1}{2} \\times \\frac{1}{2} \\times \\frac{1}{2} = \\frac{1}{8}$.',
      },
      {
        q: 'You double the starting concentration of a first-order reactant. What happens to its half-life?',
        options: ['It doubles', 'It halves', 'It stays the same', 'It goes up 4 times'],
        answer: 2,
        why: 'A first-order half-life is $0.693/k$, and concentration does not appear in it.',
      },
      {
        q: 'Which plot gives a straight line for a first-order reaction?',
        options: ['$[\\text{A}]$ against $t$', '$\\ln[\\text{A}]$ against $t$', '$\\frac{1}{[\\text{A}]}$ against $t$', '$[\\text{A}]^2$ against $t$'],
        answer: 1,
        why: 'The integrated law $\\ln[\\text{A}]_t = -kt + \\ln[\\text{A}]_0$ has the shape $y = mx + b$, with a slope of $-k$.',
      },
      {
        q: 'Raising the concentration of a reactant speeds up a reaction because:',
        options: ['The rate constant $k$ gets bigger', 'The activation energy falls', 'There are more collisions per second', 'Each collision becomes harder'],
        answer: 2,
        why: 'More molecules in the same space collide more often. The fraction above $E_a$ and the value of $k$ stay the same.',
      },
    ],

    gens: [
      {
        id: 'half-life',
        title: 'Half-life from k',
        make(r) {
          const k = r.num(1.1, 9.8, 1) * Math.pow(10, -r.int(1, 4));
          const t = Math.LN2 / k;
          return {
            q: `A first-order reaction has $k = ${tx(k, 2)}\\text{ s}^{-1}$. What is its half-life?`,
            answer: t, unit: 's',
            hint: 'For first order, $t_{1/2} = 0.693/k$.',
            steps: [
              'Use the first-order half-life: $t_{1/2} = \\dfrac{0.693}{k}$.',
              `Substitute: $t_{1/2} = \\dfrac{0.693}{${tx(k, 2)}\\text{ s}^{-1}} = ${tx(t, 3)}\\text{ s}$.`,
            ],
          };
        },
      },
      {
        id: 'k-from-half',
        title: 'k from half-life',
        make(r) {
          const unit = r.pick(['s', 'min', 'h']);
          const t = r.num(1.5, 90, 1);
          const k = Math.LN2 / t;
          return {
            q: `A first-order reactant has a half-life of ${t} ${unit}. Find the rate constant in $\\text{${unit}}^{-1}$.`,
            answer: k, unit: `$\\text{${unit}}^{-1}$`,
            hint: 'Rearrange $t_{1/2} = 0.693/k$ to get $k$ alone.',
            steps: [
              'Rearrange: $k = \\dfrac{0.693}{t_{1/2}}$.',
              `Substitute: $k = \\dfrac{0.693}{${t}\\text{ ${unit}}} = ${tx(k, 3)}\\text{ ${unit}}^{-1}$.`,
            ],
          };
        },
      },
      {
        id: 'conc-later',
        title: 'Concentration at a later time',
        make(r) {
          const a0 = r.num(0.10, 2.5, 2);
          const k = r.num(1.0, 9.0, 1) * Math.pow(10, -r.int(2, 3));
          const t = Math.round((r.num(0.2, 2.2, 2) / k) / 5) * 5 || 5;
          const a = a0 * Math.exp(-k * t);
          const kt = k * t;
          return {
            q: `A first-order reactant starts at ${a0.toFixed(2)} M, with $k = ${tx(k, 2)}\\text{ s}^{-1}$. What is its concentration after ${t} s?`,
            answer: a, unit: 'M',
            hint: 'Use $\\ln[\\text{A}]_t = -kt + \\ln[\\text{A}]_0$, then undo the log with $e^x$.',
            steps: [
              `Find $kt$: $(${tx(k, 2)}\\text{ s}^{-1})(${t}\\text{ s}) = ${tx(kt, 3)}$. The seconds cancel.`,
              `Substitute: $\\ln[\\text{A}]_t = -${tx(kt, 3)} + \\ln(${a0.toFixed(2)}) = ${(-kt + Math.log(a0)).toFixed(3)}$.`,
              `Undo the log: $[\\text{A}]_t = e^{${(-kt + Math.log(a0)).toFixed(3)}} = ${tx(a, 3)}\\text{ M}$.`,
            ],
          };
        },
      },
      {
        id: 'time-to-reach',
        title: 'Time to reach a percent',
        make(r) {
          const pct = r.pick([5, 10, 15, 20, 25, 30, 40, 60, 75, 80, 90]);
          const k = r.num(1.0, 9.0, 1) * Math.pow(10, -r.int(2, 4));
          const t = Math.log(100 / pct) / k;
          return {
            q: `A first-order reaction has $k = ${tx(k, 2)}\\text{ s}^{-1}$. How long until only ${pct}% of the reactant remains?`,
            answer: t, unit: 's',
            hint: 'Write the first-order law as $\\ln\\left(\\frac{[\\text{A}]_0}{[\\text{A}]_t}\\right) = kt$.',
            steps: [
              `Rearrange the first-order law: $t = \\dfrac{1}{k}\\ln\\dfrac{[\\text{A}]_0}{[\\text{A}]_t}$.`,
              `With ${pct}% left, $\\dfrac{[\\text{A}]_0}{[\\text{A}]_t} = \\dfrac{100}{${pct}} = ${Lab.sig(100 / pct, 3)}$, whatever the starting amount.`,
              `Substitute: $t = \\dfrac{\\ln(${Lab.sig(100 / pct, 3)})}{${tx(k, 2)}\\text{ s}^{-1}} = \\dfrac{${Math.log(100 / pct).toFixed(3)}}{${tx(k, 2)}\\text{ s}^{-1}} = ${tx(t, 3)}\\text{ s}$.`,
            ],
          };
        },
      },
      {
        id: 'halves',
        title: 'Counting half-lives',
        make(r) {
          const n = r.int(1, 5);
          const half = r.pick([2, 3, 5, 6, 8, 10, 12, 15, 20, 25]);
          const m0 = r.pick([16, 20, 24, 32, 40, 48, 64, 80, 100, 160]);
          const left = m0 / Math.pow(2, n);
          const parts = Array.from({ length: n }, () => '\\tfrac{1}{2}').join(' \\times ');
          return {
            q: `A first-order reactant has a half-life of ${half} min. You start with ${m0} g. How many grams remain after ${half * n} min?`,
            answer: left, unit: 'g', tol: 0.01,
            hint: 'Work out how many half-lives have passed, then halve that many times.',
            steps: [
              `Count half-lives: $${half * n}\\text{ min} \\div ${half}\\text{ min} = ${n}$.`,
              `Halve ${n} time${n > 1 ? 's' : ''}: $${m0}\\text{ g} \\times ${parts} = ${Lab.sig(left, 3)}\\text{ g}$.`,
            ],
          };
        },
      },
      {
        id: 'initial-rates-law',
        title: 'Rate law from data',
        make(r) {
          const P = ratesProblem(r);
          const pairs = [[0, 1], [1, 0], [1, 1], [2, 0], [0, 2], [2, 1], [1, 2], [2, 2], [0, 0]];
          const wrong = r.shuffle(pairs.filter(([a, b]) => !(a === P.m && b === P.n))).slice(0, 3).map(([a, b]) => law(a, b));
          const mc = r.mc(law(P.m, P.n), wrong);
          return {
            q: `Find the rate law for A + B giving products.${P.table}`,
            choices: mc.choices, answer: mc.answer,
            steps: [P.stepA, P.stepB, `Put the two orders together: ${law(P.m, P.n)}.`],
          };
        },
      },
      {
        id: 'initial-rates-k',
        title: 'Rate constant from data',
        make(r) {
          const P = ratesProblem(r);
          const u = P.m + P.n;
          const units = u === 0 ? '$\\text{M/s}$' : u === 1 ? '$\\text{s}^{-1}$' : u === 2 ? '$\\text{M}^{-1}\\text{s}^{-1}$' : `$\\text{M}^{-${u - 1}}\\text{s}^{-1}$`;
          const bottom = [P.m ? `(${P.a0.toFixed(3)})^{${P.m}}` : '', P.n ? `(${P.b0.toFixed(3)})^{${P.n}}` : ''].filter(Boolean).join('') || '1';
          return {
            q: `Use these runs to find the rate constant $k$ for A + B giving products.${P.table}`,
            answer: P.k, unit: units, tol: 0.03,
            hint: 'First find each order by comparing two runs. Then put run 1 into the rate law.',
            steps: [P.stepA, P.stepB,
              `The law is ${law(P.m, P.n)}.`,
              `Put in run 1: $k = \\dfrac{${tx(P.runs[0].v, 3)}}{${bottom}} = ${tx(P.k, 2)}$ ${units}.`],
          };
        },
      },
      {
        id: 'k-units',
        title: 'Units of k',
        make(r) {
          const m = r.int(0, 2), n = r.int(0, 2);
          const all = ['$\\text{M/s}$', '$\\text{s}^{-1}$', '$\\text{M}^{-1}\\text{s}^{-1}$', '$\\text{M}^{-2}\\text{s}^{-1}$', '$\\text{M}^{-3}\\text{s}^{-1}$'];
          const o = m + n;
          const mc = r.mc(all[o], all.filter((_, i) => i !== o).slice(0, 4));
          const body = (m || n) ? `${pow('A', m)}${pow('B', n)}` : '';
          return {
            q: `A reaction has the rate law $\\text{rate} = k${body}$. What are the units of $k$?`,
            choices: mc.choices, answer: mc.answer,
            steps: [
              `The overall order is $${m} + ${n} = ${o}$.`,
              `A rate is always M/s. So $k$ must supply whatever is left over: $k = \\dfrac{\\text{M/s}}{\\text{M}^{${o}}}$, which is ${all[o]}.`,
            ],
          };
        },
      },
      {
        id: 'arrhenius',
        title: 'Arrhenius with two temperatures',
        make(r) {
          const Ea = r.int(30, 120);
          const T1 = r.pick([280, 290, 298, 300, 310]);
          const T2 = T1 + r.pick([10, 20, 25, 30, 40, 50]);
          const ratio = Math.exp((Ea * 1000 / 8.314) * (1 / T1 - 1 / T2));
          const inv = (1 / T1 - 1 / T2);
          return {
            q: `A reaction has $E_a = ${Ea}\\text{ kJ/mol}$. By what factor does the rate constant grow when it warms from ${T1} K to ${T2} K? Give $k_2 / k_1$.`,
            answer: ratio, unit: 'times', tol: 0.04,
            hint: 'Use $\\ln\\frac{k_2}{k_1} = \\frac{E_a}{R}\\left(\\frac{1}{T_1} - \\frac{1}{T_2}\\right)$ with $E_a$ in joules.',
            steps: [
              `Convert the energy: $${Ea}\\text{ kJ/mol} = ${Ea * 1000}\\text{ J/mol}$, to match $R = 8.314\\text{ J/(mol K)}$.`,
              `Find the temperature part: $\\dfrac{1}{${T1}} - \\dfrac{1}{${T2}} = ${tx(inv, 3)}\\text{ K}^{-1}$.`,
              `Multiply: $\\ln\\dfrac{k_2}{k_1} = \\dfrac{${Ea * 1000}}{8.314}(${tx(inv, 3)}) = ${Math.log(ratio).toFixed(3)}$.`,
              `Undo the log: $\\dfrac{k_2}{k_1} = e^{${Math.log(ratio).toFixed(3)}} = ${tx(ratio, 3)}$.`,
            ],
          };
        },
      },
    ],

    cards: [
      { front: 'What three things must a collision have to cause a reaction?', back: 'It must happen, have at least the activation energy, and have the right orientation.' },
      { front: 'What is activation energy, $E_a$?', back: 'The minimum energy a collision needs to get over the energy hill and reach the transition state.' },
      { front: 'What does a catalyst do?', back: 'It offers a path with a lower $E_a$, and speeds both directions. It is not used up, and $\\Delta H$ does not change.' },
      { front: 'Doubling a reactant does nothing to the rate. What is the order?', back: 'Zero order in that reactant.' },
      { front: 'Half-life of a first-order reaction?', back: '$t_{1/2} = 0.693/k$. It does not depend on concentration.' },
      { front: 'Integrated first-order law?', back: '$\\ln[\\text{A}]_t = -kt + \\ln[\\text{A}]_0$. A plot of $\\ln[\\text{A}]$ against $t$ is straight with slope $-k$.' },
      { front: 'Why not read orders from the balanced equation?', back: 'Orders come from experiment. They match coefficients only for a single elementary step.' },
    ],

    terms: [
      { term: 'Reaction rate', def: 'How fast a reactant is used up or a product forms, usually in M/s.' },
      { term: 'Collision theory', def: 'Molecules react when they collide with at least the activation energy, in the right orientation.' },
      { term: 'Activation energy', def: 'The minimum energy needed for a reaction to happen, symbol $E_a$. It is the height of the energy hill.' },
      { term: 'Transition state', def: 'The short-lived, highest-energy arrangement at the top of the energy hill, with old bonds breaking and new ones forming.' },
      { term: 'Catalyst', def: 'A substance that speeds up a reaction by offering a lower-$E_a$ path. It is not used up overall.' },
      { term: 'Rate law', def: 'An equation connecting rate to concentrations, such as $\\text{rate} = k[\\text{A}]^m[\\text{B}]^n$.' },
      { term: 'Rate constant', def: 'The $k$ in a rate law. It depends on temperature and catalysts, not on concentration.' },
      { term: 'Reaction order', def: 'The exponent on a concentration in the rate law. Found by experiment.' },
      { term: 'Method of initial rates', def: 'Finding orders by comparing the starting rates of runs where only one concentration changes.' },
      { term: 'Half-life', def: 'The time for a reactant to fall to half its value. For first order, $t_{1/2} = 0.693/k$.' },
      { term: 'Arrhenius equation', def: '$k = A e^{-E_a/RT}$, which links the rate constant to temperature and activation energy.' },
      { term: 'Elementary step', def: 'A single molecular event in a mechanism. Only here do orders match the coefficients.' },
    ],
  });
})();
