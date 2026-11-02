/* Question bank for lesson 15: Entropy and free energy. */
(function () {
  'use strict';
  /** A number as TeX, to n significant figures, in scientific notation when very big or small. */
  function tx(x, n = 3) {
    if (x === 0) return '0';
    const v = Number(x.toPrecision(n));
    const e = Math.floor(Math.log10(Math.abs(v)));
    if (e >= n + 2 || e < -2) return `${(v / Math.pow(10, e)).toFixed(n - 1)} \\times 10^{${e}}`;
    return Lab.sig(v, n);
  }
  const sgn = (x, d = 1) => (x < 0 ? '-' : '+') + Math.abs(x).toFixed(d);
  const comb = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); };

  /* Standard values at 298 K, as in common general chemistry tables. Problems always state the values they use. */
  const S0 = { H2: 130.7, O2: 205.1, N2: 191.6, NH3: 192.5, 'H2O(l)': 69.9, CO2: 213.7, CO: 197.7, CH4: 186.3, NO: 210.8, NO2: 240.1, SO2: 248.2, SO3: 256.8, CaCO3: 92.9, CaO: 39.7, Cl2: 223.1, HCl: 186.9 };
  const GF = { NH3: -16.4, 'H2O(l)': -237.1, CO2: -394.4, CO: -137.2, CH4: -50.7, NO: 86.6, NO2: 51.3, SO2: -300.2, SO3: -371.1, CaCO3: -1128.8, CaO: -604.0, HCl: -95.3 };
  const PHASE = { CaCO3: 's', CaO: 's' };
  const RXNS = [
    { l: [['N2', 1], ['H2', 3]], r: [['NH3', 2]] },
    { l: [['H2', 2], ['O2', 1]], r: [['H2O(l)', 2]] },
    { l: [['CH4', 1], ['O2', 2]], r: [['CO2', 1], ['H2O(l)', 2]] },
    { l: [['CaCO3', 1]], r: [['CaO', 1], ['CO2', 1]] },
    { l: [['SO2', 2], ['O2', 1]], r: [['SO3', 2]] },
    { l: [['N2', 1], ['O2', 1]], r: [['NO', 2]] },
    { l: [['H2', 1], ['Cl2', 1]], r: [['HCl', 2]] },
    { l: [['CO', 2], ['O2', 1]], r: [['CO2', 2]] },
    { l: [['NO', 2], ['O2', 1]], r: [['NO2', 2]] },
  ];
  const fName = (k) => k.replace('(l)', '');
  const phaseOf = (k) => (k.includes('(l)') ? 'l' : PHASE[k] || 'g');
  const sideTex = (L) => L.map(([k, c]) => `${c > 1 ? c : ''}${fName(k)}(${phaseOf(k)})`).join(' + ');
  const eqTex = (R) => `\\ce{${sideTex(R.l)} -> ${sideTex(R.r)}}`;
  const given = (R, tbl) => [...R.l, ...R.r].map(([k]) => k).filter((k, i, a) => a.indexOf(k) === i)
    .map((k) => `$\\ce{${fName(k)}(${phaseOf(k)})}$: ${(tbl[k] === undefined ? 0 : tbl[k]).toFixed(1)}`).join(', ');
  const sumOf = (L, tbl) => L.reduce((s, [k, c]) => s + c * (tbl[k] === undefined ? 0 : tbl[k]), 0);
  const sumTex = (L, tbl) => L.map(([k, c]) => `${c > 1 ? c : ''}(${(tbl[k] === undefined ? 0 : tbl[k]).toFixed(1)})`).join(' + ');

  const SIGN_LIST = [
    ['$\\ce{H2O(l) -> H2O(g)}$', 1, 'A gas has far more arrangements than a liquid.'],
    ['$\\ce{H2O(l) -> H2O(s)}$', -1, 'A solid has fewer arrangements than a liquid.'],
    ['$\\ce{NaCl(s) -> Na+(aq) + Cl-(aq)}$', 1, 'Dissolving spreads the ions through the water.'],
    ['$\\ce{N2(g) + 3H2(g) -> 2NH3(g)}$', -1, 'Four gas molecules become two.'],
    ['$\\ce{CaCO3(s) -> CaO(s) + CO2(g)}$', 1, 'A gas forms where there was none.'],
    ['$\\ce{2SO2(g) + O2(g) -> 2SO3(g)}$', -1, 'Three gas molecules become two.'],
    ['$\\ce{N2O4(g) -> 2NO2(g)}$', 1, 'One gas molecule becomes two.'],
    ['$\\ce{CO2(g) -> CO2(s)}$', -1, 'A gas turns into a solid.'],
    ['$\\ce{I2(s) -> I2(g)}$', 1, 'A solid turns into a gas.'],
    ['$\\ce{2H2(g) + O2(g) -> 2H2O(l)}$', -1, 'Three gas molecules become a liquid.'],
    ['Heating a sample of argon from 300 K to 400 K', 1, 'Faster particles have more ways to share their energy.'],
    ['A gas expanding into a larger container', 1, 'There are more places for the particles to be.'],
  ];

  Bank.add('thermo', {
    quiz: [
      {
        q: 'In chemistry, what does spontaneous mean?',
        options: ['It happens quickly', 'It happens without continued outside help', 'It releases heat', 'It starts with no activation energy'],
        answer: 1,
        why: 'Spontaneous only tells you the direction things can go on their own. It says nothing about speed, and some spontaneous processes take in heat.',
      },
      {
        q: 'Which has the highest entropy per mole?',
        options: ['$\\ce{H2O(s)}$', '$\\ce{H2O(l)}$', '$\\ce{H2O(g)}$', 'They are all equal'],
        answer: 2,
        why: 'Gas molecules have by far the most ways to arrange themselves and their energy.',
      },
      {
        q: 'What is the sign of $\\Delta S$ for $\\ce{N2(g) + 3H2(g) -> 2NH3(g)}$?',
        options: ['Positive', 'Negative', 'Zero', 'You need a table to say'],
        answer: 1,
        why: 'Count the gas molecules: 4 on the left and 2 on the right. Fewer gas molecules means less entropy.',
      },
      {
        q: 'A reaction has $\\Delta H < 0$ and $\\Delta S > 0$. When is it spontaneous?',
        options: ['At all temperatures', 'Only at low temperatures', 'Only at high temperatures', 'Never'],
        answer: 0,
        why: '$\\Delta G = \\Delta H - T\\Delta S$ is a negative minus a positive, so it is always negative.',
      },
      {
        q: 'A reaction has $\\Delta H > 0$ and $\\Delta S > 0$. When is it spontaneous?',
        options: ['At all temperatures', 'Only at low temperatures', 'Only at high temperatures', 'Never'],
        answer: 2,
        why: 'The energy term opposes it, and the entropy term favors it. Raising $T$ makes the entropy term win.',
      },
      {
        q: 'Graphite is more stable than diamond, with $\\Delta G^\\circ < 0$ for diamond to graphite. Why do diamonds last?',
        options: ['The calculation is wrong for solids', 'The reaction is at equilibrium', 'The activation energy is enormous', '$\\Delta H$ is positive'],
        answer: 2,
        why: '$\\Delta G$ says it can go. Kinetics says it practically does not, because bonds in diamond are very hard to break.',
      },
      {
        q: 'Water freezes on its own at −10 °C, yet the water loses entropy. Why is this allowed?',
        options: ['The second law does not apply to water', 'The surroundings gain more entropy than the water loses', 'Energy is destroyed', 'Ice really has more entropy than water'],
        answer: 1,
        why: 'The second law counts the universe. The heat released spreads into the surroundings and raises their entropy by more.',
      },
      {
        q: 'A reaction has $\\Delta H = -100$ kJ and $\\Delta S = -200$ J/K. What is $\\Delta G$ at 300 K?',
        options: ['$-40$ kJ', '$-160$ kJ', '$+59{,}900$ kJ', '$-100$ kJ'],
        answer: 0,
        why: 'Convert first: $-200$ J/K is $-0.200$ kJ/K. Then $\\Delta G = -100 - (300)(-0.200) = -100 + 60 = -40$ kJ.',
      },
      {
        q: 'What is $\\Delta G$ for ice melting at exactly 0 °C and 1 atm?',
        options: ['Positive', 'Negative', 'Zero', 'Equal to $\\Delta H$'],
        answer: 2,
        why: 'Ice and water are at equilibrium at the melting point, and $\\Delta G = 0$ at equilibrium.',
      },
      {
        q: 'If $\\Delta G^\\circ$ for a reaction is large and positive, then $K$ is:',
        options: ['Much greater than 1', 'Exactly 1', 'Much less than 1', 'Negative'],
        answer: 2,
        why: '$\\ln K = -\\Delta G^\\circ / RT$ is a large negative number, so $K$ is tiny. $K$ itself can never be negative.',
      },
    ],

    gens: [
      {
        id: 'dg',
        title: 'Calculate ΔG',
        make(r) {
          let H, S, T, G;
          do {
            H = r.num(-400, 400, 1);
            S = r.num(-350, 350, 1);
            T = r.pick([273, 298, 300, 350, 400, 500, 600, 800, 1000]);
            G = H - (T * S) / 1000;
          } while (Math.abs(G) < 8 || Math.abs(S) < 10 || Math.abs(H) < 10);
          const Sk = S / 1000;
          return {
            q: `A reaction has $\\Delta H = ${sgn(H)}$ kJ and $\\Delta S = ${sgn(S)}$ J/K. Calculate $\\Delta G$ at ${T} K.`,
            answer: G, unit: 'kJ', tol: 0.01, answerText: G.toFixed(1),
            hint: 'Convert $\\Delta S$ to kJ/K first by dividing by 1000. Then use $\\Delta G = \\Delta H - T\\Delta S$.',
            steps: [
              `Convert: $\\Delta S = ${sgn(S)}\\text{ J/K} = ${sgn(Sk, 4)}\\text{ kJ/K}$.`,
              `Substitute: $\\Delta G = ${H.toFixed(1)} - (${T})(${Sk.toFixed(4)})$.`,
              `Multiply: $(${T})(${Sk.toFixed(4)}) = ${((T * S) / 1000).toFixed(1)}$ kJ.`,
              `Subtract: $\\Delta G = ${H.toFixed(1)} - (${((T * S) / 1000).toFixed(1)}) = ${G.toFixed(1)}$ kJ. It is ${G < 0 ? 'negative, so spontaneous' : 'positive, so not spontaneous'} at this temperature.`,
            ],
          };
        },
      },
      {
        id: 'flip',
        title: 'Flip temperature',
        make(r) {
          const sign = r.pick([1, -1]);
          const H = sign * r.num(20, 300, 1), S = sign * r.num(60, 320, 1);
          const T = (H * 1000) / S;
          return {
            q: `A reaction has $\\Delta H = ${sgn(H)}$ kJ and $\\Delta S = ${sgn(S)}$ J/K. At what temperature does $\\Delta G = 0$?`,
            answer: T, unit: 'K', tol: 0.01,
            hint: 'Set $\\Delta G = 0$ in $\\Delta G = \\Delta H - T\\Delta S$, and solve for $T$. Watch the units.',
            steps: [
              'Set $\\Delta G = 0$: then $\\Delta H = T\\Delta S$, so $T = \\Delta H / \\Delta S$.',
              `Convert: $\\Delta H = ${sgn(H)}$ kJ $= ${sgn(H * 1000, 0)}$ J.`,
              `Divide: $T = \\dfrac{${(H * 1000).toFixed(0)}\\text{ J}}{${S.toFixed(1)}\\text{ J/K}} = ${tx(T, 3)}$ K.`,
              sign > 0 ? 'Both are positive, so it is spontaneous above this temperature.' : 'Both are negative, so it is spontaneous below this temperature.',
            ],
          };
        },
      },
      {
        id: 'ds-table',
        title: 'ΔS° from a table',
        make(r) {
          const R = r.pick(RXNS);
          const p = sumOf(R.r, S0), q = sumOf(R.l, S0);
          const d = p - q;
          return {
            q: `Calculate $\\Delta S^\\circ$ for $${eqTex(R)}$. $S^\\circ$ values in J/(mol K): ${given(R, S0)}.`,
            answer: d, unit: 'J/K', tol: 0.01, answerText: d.toFixed(1),
            hint: 'Products minus reactants, with each value multiplied by its coefficient. Elements count here.',
            steps: [
              `Products: $${sumTex(R.r, S0)} = ${p.toFixed(1)}$ J/K.`,
              `Reactants: $${sumTex(R.l, S0)} = ${q.toFixed(1)}$ J/K.`,
              `Subtract: $${p.toFixed(1)} - ${q.toFixed(1)} = ${d.toFixed(1)}$ J/K.`,
            ],
          };
        },
      },
      {
        id: 'dg-table',
        title: 'ΔG° from a table',
        make(r) {
          const R = r.pick(RXNS);
          const p = sumOf(R.r, GF), q = sumOf(R.l, GF);
          const d = p - q;
          return {
            q: `Calculate $\\Delta G^\\circ$ for $${eqTex(R)}$. $\\Delta G^\\circ_f$ values in kJ/mol: ${given(R, GF)}.`,
            answer: d, unit: 'kJ', tol: 0.01, answerText: d.toFixed(1),
            hint: 'Products minus reactants, with coefficients. Elements in their standard state are zero.',
            steps: [
              `Products: $${sumTex(R.r, GF)} = ${p.toFixed(1)}$ kJ.`,
              `Reactants: $${sumTex(R.l, GF)} = ${q.toFixed(1)}$ kJ.`,
              `Subtract: $${p.toFixed(1)} - (${q.toFixed(1)}) = ${d.toFixed(1)}$ kJ. It is ${d < 0 ? 'negative, so spontaneous' : 'positive, so not spontaneous'} under standard conditions.`,
            ],
          };
        },
      },
      {
        id: 'ds-sign',
        title: 'Sign of ΔS',
        make(r) {
          const [text, sign, why] = r.pick(SIGN_LIST);
          const mc = r.mc(sign > 0 ? 'Positive: entropy goes up' : 'Negative: entropy goes down', [sign > 0 ? 'Negative: entropy goes down' : 'Positive: entropy goes up', 'Zero: entropy does not change']);
          return {
            q: `What is the sign of $\\Delta S$ for this process? ${text}`,
            choices: mc.choices, answer: mc.answer,
            steps: [why, `So $\\Delta S$ is ${sign > 0 ? 'positive' : 'negative'}.`],
          };
        },
      },
      {
        id: 'quadrant',
        title: 'Which temperatures?',
        make(r) {
          const hs = r.pick([-1, 1]), ss = r.pick([-1, 1]);
          const H = hs * r.num(10, 300, 0), S = ss * r.num(20, 300, 0);
          const A = 'At every temperature', B = 'Never', C_ = 'Only at low temperature', D = 'Only at high temperature';
          const ans = hs < 0 && ss > 0 ? A : hs > 0 && ss < 0 ? B : hs < 0 ? C_ : D;
          const mc = r.mc(ans, [A, B, C_, D].filter((x) => x !== ans));
          const why = hs < 0 && ss > 0 ? 'A negative minus a positive is always negative.'
            : hs > 0 && ss < 0 ? 'A positive minus a negative is always positive.'
              : hs < 0 ? '$\\Delta H$ helps and $-T\\Delta S$ hurts. The hurt grows with $T$, so it must stay cold.'
                : '$\\Delta H$ hurts and $-T\\Delta S$ helps. The help grows with $T$, so it must be hot.';
          return {
            q: `A reaction has $\\Delta H = ${sgn(H, 0)}$ kJ and $\\Delta S = ${sgn(S, 0)}$ J/K. When is it spontaneous?`,
            choices: mc.choices, answer: mc.answer,
            steps: [`Look at the signs in $\\Delta G = \\Delta H - T\\Delta S$. ${why}`],
          };
        },
      },
      {
        id: 'k-from-dg',
        title: 'K from ΔG°',
        make(r) {
          const G = r.pick([-1, 1]) * r.num(2, 40, 1);
          const T = r.pick([298, 298, 310, 350, 400]);
          const lnK = -(G * 1000) / (8.314 * T);
          const K = Math.exp(lnK);
          return {
            q: `A reaction has $\\Delta G^\\circ = ${sgn(G)}$ kJ at ${T} K. Calculate $K$.`,
            answer: K, unit: '', tol: 0.05, sf: 2,
            hint: 'Use $\\ln K = -\\Delta G^\\circ / RT$, with $\\Delta G^\\circ$ in joules. Then undo the log with $e^x$.',
            steps: [
              `Convert: $\\Delta G^\\circ = ${(G * 1000).toFixed(0)}$ J/mol, to match $R = 8.314$ J/(mol K).`,
              `$\\ln K = \\dfrac{-(${(G * 1000).toFixed(0)})}{(8.314)(${T})} = ${lnK.toFixed(2)}$.`,
              `$K = e^{${lnK.toFixed(2)}} = ${tx(K, 2)}$. It is ${K > 1 ? 'above 1, which fits a negative' : 'below 1, which fits a positive'} $\\Delta G^\\circ$.`,
            ],
          };
        },
      },
      {
        id: 'dg-from-k',
        title: 'ΔG° from K',
        make(r) {
          const K = Number((r.num(1.1, 9.8, 1) * Math.pow(10, r.int(-8, 8))).toPrecision(2));
          const T = 298;
          const G = (-8.314 * T * Math.log(K)) / 1000;
          return {
            q: `A reaction has $K = ${tx(K, 2)}$ at ${T} K. Calculate $\\Delta G^\\circ$ in kJ.`,
            answer: G, unit: 'kJ', tol: Math.max(0.015, 0.06 / Math.abs(G)), answerText: G.toFixed(2),
            hint: 'Use $\\Delta G^\\circ = -RT\\ln K$, then divide joules by 1000.',
            steps: [
              `$\\ln(${tx(K, 2)}) = ${Math.log(K).toFixed(2)}$.`,
              `$\\Delta G^\\circ = -(8.314)(${T})(${Math.log(K).toFixed(2)}) = ${(G * 1000).toFixed(0)}$ J.`,
              `In kilojoules, that is ${G.toFixed(2)} kJ.`,
            ],
          };
        },
      },
      {
        id: 'microstates',
        title: 'Counting microstates',
        make(r) {
          const N = r.int(4, 12);
          if (r.int(0, 1)) {
            const total = Math.pow(2, N);
            return {
              q: `${N} particles each sit in the left or right half of a box. What is the chance that they are <b>all</b> on the left? Give the answer as "1 in how many".`,
              answer: total, unit: '', tol: 0.001, answerText: String(total),
              hint: 'Each particle has 2 choices, so multiply 2 by itself once per particle.',
              steps: [
                `Total arrangements: $2^{${N}} = ${total}$.`,
                `Only one of those has every particle on the left, so the chance is 1 in ${total}.`,
              ],
            };
          }
          const k = r.int(1, N - 1);
          const W = comb(N, k);
          return {
            q: `${N} labeled particles sit in a two-part box. In how many ways can exactly ${k} of them be on the left?`,
            answer: W, unit: 'ways', tol: 0.001, answerText: String(W),
            hint: 'This is "N choose k": $\\dfrac{N!}{k!(N-k)!}$.',
            steps: [
              `Use the choosing formula: $W = \\dfrac{${N}!}{${k}!\\,${N - k}!}$.`,
              `That equals ${W} ways. The even split always has the most ways, which is why spreading wins.`,
            ],
          };
        },
      },
    ],

    cards: [
      { front: 'What does spontaneous mean in chemistry?', back: 'It can happen without continued outside help. It says nothing about how fast.' },
      { front: 'What is a microstate?', back: 'One specific arrangement of particles and their energy. More microstates means more entropy.' },
      { front: "Boltzmann's entropy equation?", back: '$S = k\\ln W$, where $W$ is the number of microstates.' },
      { front: 'State the second law of thermodynamics.', back: 'In any spontaneous process, the entropy of the universe increases.' },
      { front: 'State the third law of thermodynamics.', back: 'A perfect crystal at 0 K has zero entropy.' },
      { front: 'Gibbs free energy equation?', back: '$\\Delta G = \\Delta H - T\\Delta S$. Negative means spontaneous, zero means equilibrium.' },
      { front: '$\\Delta H > 0$ and $\\Delta S > 0$: when is it spontaneous?', back: 'Only at high temperature, above $T = \\Delta H / \\Delta S$.' },
      { front: '$\\Delta H < 0$ and $\\Delta S < 0$: when is it spontaneous?', back: 'Only at low temperature, below $T = \\Delta H / \\Delta S$.' },
      { front: 'How do $\\Delta G^\\circ$ and $K$ connect?', back: '$\\Delta G^\\circ = -RT\\ln K$. Negative $\\Delta G^\\circ$ means $K > 1$.' },
      { front: 'Does $\\Delta G$ tell you how fast a reaction is?', back: 'No. That is kinetics. Diamond to graphite has a negative $\\Delta G$ and is far too slow to notice.' },
    ],

    terms: [
      { term: 'Spontaneous process', def: 'A process that can happen without continued outside help. It may be fast or extremely slow.' },
      { term: 'Microstate', def: 'One specific arrangement of the particles in a system and of their energy.' },
      { term: 'Entropy', def: 'A measure of how many microstates a system has, symbol $S$. More ways to arrange means higher entropy.' },
      { term: 'Second law of thermodynamics', def: 'In any spontaneous process, the total entropy of the universe increases.' },
      { term: 'Third law of thermodynamics', def: 'The entropy of a perfect crystal at 0 K is zero.' },
      { term: 'Standard entropy', def: 'The entropy of one mole of a substance in its standard state, symbol $S^\\circ$, in J/(mol K). It is not zero for elements.' },
      { term: 'Gibbs free energy', def: 'The quantity $G$. At constant temperature and pressure, $\\Delta G = \\Delta H - T\\Delta S$ decides whether a process is spontaneous.' },
      { term: 'Standard free energy of formation', def: 'The value $\\Delta G^\\circ_f$: the free energy change to make one mole of a compound from its elements in their standard states.' },
      { term: 'Flip temperature', def: 'The temperature where $\\Delta G = 0$, given by $T = \\Delta H / \\Delta S$. Spontaneity changes direction here.' },
    ],
  });
})();
