/* Question bank for lesson 13: Chemical equilibrium. Every ICE problem is solved here in code. */
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
  const tableHTML = (head, rows) => `<div class="tbl-wrap" style="position:relative"><table class="tbl"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;

  /* Real reactions. c: coefficient, p: phase. dH is the sign of the forward enthalpy change. */
  const RXNS = [
    { l: [['N2', 1, 'g'], ['H2', 3, 'g']], r: [['NH3', 2, 'g']], dH: -1 },
    { l: [['SO2', 2, 'g'], ['O2', 1, 'g']], r: [['SO3', 2, 'g']], dH: -1 },
    { l: [['N2O4', 1, 'g']], r: [['NO2', 2, 'g']], dH: 1 },
    { l: [['NO', 2, 'g'], ['O2', 1, 'g']], r: [['NO2', 2, 'g']], dH: -1 },
    { l: [['N2', 1, 'g'], ['O2', 1, 'g']], r: [['NO', 2, 'g']], dH: 1 },
    { l: [['CaCO3', 1, 's']], r: [['CaO', 1, 's'], ['CO2', 1, 'g']], dH: 1 },
    { l: [['CO', 1, 'g'], ['H2O', 1, 'g']], r: [['CO2', 1, 'g'], ['H2', 1, 'g']], dH: -1 },
    { l: [['PCl5', 1, 'g']], r: [['PCl3', 1, 'g'], ['Cl2', 1, 'g']], dH: 1 },
    { l: [['C', 1, 's'], ['H2O', 1, 'g']], r: [['CO', 1, 'g'], ['H2', 1, 'g']], dH: 1 },
    { l: [['CO', 1, 'g'], ['H2', 2, 'g']], r: [['CH3OH', 1, 'g']], dH: -1 },
  ];
  const side = (list, phase = true) => list.map(([f, c, p]) => `${c > 1 ? c : ''}${f}${phase ? `(${p})` : ''}`).join(' + ');
  const eqTex = (R, phase = true) => `\\ce{${side(R.l, phase)} <=> ${side(R.r, phase)}}`;
  const term = ([f, c]) => `[\\ce{${f}}]${c > 1 ? `^{${c}}` : ''}`;
  const included = (list) => list.filter(([, , p]) => p !== 's' && p !== 'l');
  const prod = (list) => list.map(term).join('') || '1';
  /** K as a TeX fraction, leaving out solids. */
  function kTex(R) {
    const top = prod(included(R.r)), bot = included(R.l);
    return bot.length ? `\\dfrac{${top}}{${prod(bot)}}` : top;
  }
  const gasMoles = (list) => list.reduce((s, [, c, p]) => s + (p === 'g' ? c : 0), 0);

  Bank.add('equilibrium', {
    quiz: [
      {
        q: 'What is true at chemical equilibrium?',
        options: ['Reactants and products have equal concentrations', 'The reaction has stopped', 'The forward and reverse rates are equal', 'All the reactants are used up'],
        answer: 2,
        why: 'Both directions keep running at the same rate, so amounts stay constant. They are rarely equal, and nothing has stopped.',
      },
      {
        q: 'A reaction has $K = 1.0 \\times 10^{6}$. At equilibrium, the mixture is:',
        options: ['Mostly reactants', 'Mostly products', 'About half and half', 'Impossible to say'],
        answer: 1,
        why: '$K$ is products over reactants. A huge $K$ means the top is much bigger than the bottom.',
      },
      {
        q: 'For a reaction with $K = 10$, you measure $Q = 2$. What happens next?',
        options: ['It runs forward', 'It runs in reverse', 'Nothing, since it is at equilibrium', '$K$ falls to 2'],
        answer: 0,
        why: '$Q < K$ means too little product so far. The forward reaction wins until $Q$ rises to 10.',
      },
      {
        q: 'Which is the correct $K$ for $\\ce{CaCO3(s) <=> CaO(s) + CO2(g)}$?',
        options: ['$\\dfrac{[\\ce{CaO}][\\ce{CO2}]}{[\\ce{CaCO3}]}$', '$[\\ce{CO2}]$', '$\\dfrac{[\\ce{CaCO3}]}{[\\ce{CaO}][\\ce{CO2}]}$', '$[\\ce{CaO}][\\ce{CO2}]$'],
        answer: 1,
        why: 'Pure solids are left out of $K$, which leaves only the gas.',
      },
      {
        q: 'You add a catalyst to a reaction at equilibrium. What happens?',
        options: ['It shifts toward products', 'It shifts toward reactants', '$K$ gets bigger', 'Nothing changes in the amounts'],
        answer: 3,
        why: 'A catalyst speeds both directions equally. It helps a mixture reach equilibrium sooner, but does not move it.',
      },
      {
        q: 'An exothermic reaction is at equilibrium. You heat it. What happens?',
        options: ['It shifts forward, and $K$ rises', 'It shifts in reverse, and $K$ falls', 'It shifts in reverse, and $K$ stays the same', 'No change'],
        answer: 1,
        why: 'For an exothermic reaction, heat acts like a product. Adding it pushes the reaction in reverse. Temperature is the one change that alters $K$.',
      },
      {
        q: 'For $\\ce{N2(g) + 3H2(g) <=> 2NH3(g)}$, how does squeezing the gas into less volume shift it?',
        options: ['Toward $\\ce{NH3}$', 'Toward $\\ce{N2}$ and $\\ce{H2}$', 'No shift', 'It depends on the temperature'],
        answer: 0,
        why: 'Squeezing favors the side with fewer gas molecules: 2 on the right against 4 on the left.',
      },
      {
        q: 'A reaction has $K = 4.0$. What is $K$ for the same reaction written in reverse?',
        options: ['$-4.0$', '$4.0$', '$0.25$', '$16$'],
        answer: 2,
        why: 'Reversing flips the fraction, so the new $K$ is $1/4.0 = 0.25$.',
      },
    ],

    gens: [
      {
        id: 'write-k',
        title: 'Write K',
        make(r) {
          const R = r.pick(RXNS);
          const correct = `$K = ${kTex(R)}$`;
          const flipped = included(R.l).length ? `$K = \\dfrac{${prod(included(R.l))}}{${prod(included(R.r))}}$` : `$K = \\dfrac{1}{${prod(included(R.r))}}$`;
          const noExp = (list) => list.map(([f]) => `[\\ce{${f}}]`).join('');
          const wrongExp = included(R.l).length ? `$K = \\dfrac{${noExp(included(R.r))}}{${noExp(included(R.l))}}$` : `$K = ${noExp(R.r)}$`;
          const withSolids = `$K = \\dfrac{${prod(R.r)}}{${prod(R.l)}}$`;
          const sum = `$K = \\dfrac{${included(R.r).map(term).join(' + ')}}{${(included(R.l).length ? included(R.l) : included(R.r)).map(term).join(' + ')}}$`;
          const mc = r.mc(correct, [flipped, wrongExp, withSolids, sum]);
          const hasSolid = [...R.l, ...R.r].some(([, , p]) => p === 's');
          return {
            q: `Which is the correct equilibrium expression for $${eqTex(R)}$?`,
            choices: mc.choices, answer: mc.answer,
            steps: [
              'Put products on top and reactants on the bottom. Multiply terms together, and never add them.',
              'Each coefficient becomes an exponent.',
              hasSolid ? 'Pure solids are left out, because their concentration never changes.' : 'Everything here is a gas, so every species appears.',
              `The result is ${correct}.`,
            ],
          };
        },
      },
      {
        id: 'calc-k',
        title: 'K from concentrations',
        make(r) {
          const R = r.pick(RXNS.filter((x) => x.l.concat(x.r).every(([, , p]) => p === 'g')));
          const all = [...R.l, ...R.r];
          const conc = {};
          all.forEach(([f]) => { conc[f] = r.num(0.10, 2.50, 2); });
          const val = (list) => list.reduce((s, [f, c]) => s * Math.pow(conc[f], c), 1);
          const K = val(R.r) / val(R.l);
          const list = all.map(([f]) => `$[\\ce{${f}}] = ${conc[f].toFixed(2)}$ M`).join(', ');
          const sub = (L) => L.map(([f, c]) => `(${conc[f].toFixed(2)})${c > 1 ? `^{${c}}` : ''}`).join('');
          return {
            q: `$${eqTex(R)}$ is at equilibrium with ${list}. Calculate $K$.`,
            answer: K, unit: '', tol: 0.02,
            hint: 'Products over reactants, with coefficients as exponents.',
            steps: [
              `Write the expression: $K = ${kTex(R)}$.`,
              `Substitute: $K = \\dfrac{${sub(R.r)}}{${sub(R.l)}} = \\dfrac{${tx(val(R.r), 3)}}{${tx(val(R.l), 3)}} = ${tx(K, 3)}$.`,
            ],
          };
        },
      },
      {
        id: 'q-vs-k',
        title: 'Q against K',
        make(r) {
          const a = r.num(0.10, 1.50, 2), b = r.num(0.10, 1.50, 2), c = r.num(0.10, 1.50, 2);
          const Q = (c * c) / (a * b);
          const kind = r.int(0, 2);
          const K = kind === 0 ? Number((Q * r.num(2.5, 8, 1)).toPrecision(2)) : kind === 1 ? Number((Q / r.num(2.5, 8, 1)).toPrecision(2)) : Number(Q.toPrecision(3));
          const answer = kind === 0 ? 'It runs forward' : kind === 1 ? 'It runs in reverse' : 'It is already at equilibrium';
          const mc = r.mc(answer, ['It runs forward', 'It runs in reverse', 'It is already at equilibrium'].filter((x) => x !== answer));
          const cmp = kind === 0 ? '<' : kind === 1 ? '>' : '=';
          const say = kind === 0 ? 'Too little product so far, so it runs forward.' : kind === 1 ? 'Too much product, so it runs in reverse.' : 'They match, so the amounts will not change.';
          return {
            q: `For A(g) + B(g) $\\ce{<=>}$ 2C(g), $K = ${tx(K, kind === 2 ? 3 : 2)}$. Right now, $[\\text{A}] = ${a.toFixed(2)}$ M, $[\\text{B}] = ${b.toFixed(2)}$ M and $[\\text{C}] = ${c.toFixed(2)}$ M. What happens?`,
            choices: mc.choices, answer: mc.answer,
            steps: [
              `Write $Q$: $Q = \\dfrac{[\\text{C}]^2}{[\\text{A}][\\text{B}]} = \\dfrac{(${c.toFixed(2)})^2}{(${a.toFixed(2)})(${b.toFixed(2)})} = ${tx(Q, 3)}$.`,
              `Compare: $Q ${cmp === '<' ? '<' : cmp === '>' ? '>' : '='} K$. ${say}`,
            ],
          };
        },
      },
      {
        id: 'ice-linear',
        title: 'ICE: A to B',
        make(r) {
          const a = r.num(0.20, 2.00, 2);
          const K = r.pick([0.25, 0.50, 1.5, 2.0, 3.0, 4.0, 5.0, 9.0, 12, 19]);
          const x = (K * a) / (1 + K);
          return {
            q: `A $\\ce{<=>}$ B has $K = ${K}$. You start with ${a.toFixed(2)} M of A and no B. Find $[\\text{B}]$ at equilibrium.`,
            answer: x, unit: 'M',
            hint: 'At equilibrium, $[\\text{A}] = a - x$ and $[\\text{B}] = x$. Put those into $K = [\\text{B}]/[\\text{A}]$.',
            verify: Math.abs(x / (a - x) / K - 1),
            steps: [
              `Table: I is ${a.toFixed(2)} and 0. C is $-x$ and $+x$. E is $${a.toFixed(2)} - x$ and $x$.`,
              `Put the bottom row into $K$: $${K} = \\dfrac{x}{${a.toFixed(2)} - x}$.`,
              `Multiply out: $${tx(K * a, 3)} - ${K}x = x$, so $${tx(K * a, 3)} = ${tx(1 + K, 3)}x$.`,
              `Solve: $x = ${tx(x, 3)}$ M. So $[\\text{B}] = ${tx(x, 3)}$ M and $[\\text{A}] = ${tx(a - x, 3)}$ M.`,
              `Check: $${tx(x, 3)} \\div ${tx(a - x, 3)} \\approx ${tx(x / (a - x), 3)}$, which matches $K$.`,
            ],
          };
        },
      },
      {
        id: 'ice-square',
        title: 'ICE: perfect square',
        make(r) {
          const K = r.pick([4.0, 9.0, 16, 25, 36, 49, 50, 64, 81, 100, 2.0, 5.0, 12, 30]);
          const a = r.num(0.10, 2.00, 2);
          const s = Math.sqrt(K);
          const x = (a * s) / (2 + s);
          // H2 + I2 really does have a K of tens to hundreds. Other values use a generic reaction.
          const real = K >= 25;
          const C = real ? '\\ce{HI}' : '\\text{C}';
          const eqn = real ? '\\ce{H2(g) + I2(g) <=> 2HI(g)}' : '\\text{A(g)} + \\text{B(g)} \\rightleftharpoons 2\\text{C(g)}';
          return {
            q: `$${eqn}$ has $K = ${K}$ at some temperature. You start with ${a.toFixed(2)} M of each reactant and no $${C}$. Find $[${C}]$ at equilibrium.`,
            answer: 2 * x, unit: 'M',
            hint: 'The top and bottom are both perfect squares. Take the square root of both sides.',
            verify: Math.abs(((2 * x) * (2 * x)) / ((a - x) * (a - x)) / K - 1),
            steps: [
              `Table: the bottom row is $${a.toFixed(2)} - x$, $${a.toFixed(2)} - x$ and $2x$.`,
              `Put it into $K$: $${K} = \\dfrac{(2x)^2}{(${a.toFixed(2)} - x)^2}$.`,
              `Take the square root: $${tx(s, 3)} = \\dfrac{2x}{${a.toFixed(2)} - x}$.`,
              `Rearrange: $${tx(s * a, 3)} = ${tx(2 + s, 3)}x$, so $x = ${tx(x, 3)}$ M.`,
              `Read the table: $[${C}] = 2x = ${tx(2 * x, 3)}$ M.`,
            ],
          };
        },
      },
      {
        id: 'ice-quadratic',
        title: 'ICE: quadratic',
        make(r) {
          const K = r.pick([0.050, 0.10, 0.15, 0.20, 0.36, 0.50, 0.75, 1.0, 1.5, 2.0, 4.0]);
          const a = r.num(0.10, 1.50, 2);
          const disc = K * K + 16 * K * a;
          const x = (-K + Math.sqrt(disc)) / 8;
          const askDimer = r.int(0, 1) === 1;
          return {
            q: `$\\ce{N2O4(g) <=> 2NO2(g)}$ has $K = ${K}$ at some temperature. You start with ${a.toFixed(2)} M of $\\ce{N2O4}$ and no $\\ce{NO2}$. Find ${askDimer ? '$[\\ce{N2O4}]$' : '$[\\ce{NO2}]$'} at equilibrium.`,
            answer: askDimer ? a - x : 2 * x, unit: 'M',
            hint: 'Set up $K = (2x)^2 / (a - x)$, rearrange into $4x^2 + Kx - Ka = 0$, and use the quadratic formula.',
            verify: Math.abs(((2 * x) * (2 * x)) / (a - x) / K - 1),
            steps: [
              `Table: the bottom row is $[\\ce{N2O4}] = ${a.toFixed(2)} - x$ and $[\\ce{NO2}] = 2x$.`,
              `Put it into $K$: $${K} = \\dfrac{(2x)^2}{${a.toFixed(2)} - x}$.`,
              `Rearrange: $4x^2 + ${K}x - ${tx(K * a, 3)} = 0$.`,
              `Quadratic formula, keeping the positive root: $x = \\dfrac{-${K} + \\sqrt{(${K})^2 + 4(4)(${tx(K * a, 3)})}}{2(4)} = ${tx(x, 3)}$ M.`,
              `Read the table: $[\\ce{NO2}] = 2x = ${tx(2 * x, 3)}$ M and $[\\ce{N2O4}] = ${tx(a - x, 3)}$ M.`,
              `Check: $\\dfrac{(${tx(2 * x, 3)})^2}{${tx(a - x, 3)}} \\approx ${tx(((2 * x) * (2 * x)) / (a - x), 2)}$, which matches $K$.`,
            ],
          };
        },
      },
      {
        id: 'ice-find-k',
        title: 'ICE: find K',
        make(r) {
          const a = r.num(0.40, 2.00, 2), b = r.num(0.40, 2.00, 2);
          const x = Number((Math.min(a, b) * r.num(0.62, 0.92, 2)).toFixed(3));
          const y = 2 * x;
          const K = (y * y) / ((a - x) * (b - x));
          return {
            q: `For $\\ce{H2(g) + I2(g) <=> 2HI(g)}$, you start with ${a.toFixed(2)} M of $\\ce{H2}$ and ${b.toFixed(2)} M of $\\ce{I2}$. At equilibrium, $[\\ce{HI}] = ${y.toFixed(3)}$ M. Calculate $K$.`,
            answer: K, unit: '', tol: 0.03,
            hint: 'HI went up by $2x$, so work out $x$ first. Then fill in the bottom row.',
            steps: [
              `HI started at 0 and rose by $2x$, so $2x = ${y.toFixed(3)}$ and $x = ${x.toFixed(3)}$ M.`,
              `Bottom row: $[\\ce{H2}] = ${a.toFixed(2)} - ${x.toFixed(3)} = ${(a - x).toFixed(3)}$ M and $[\\ce{I2}] = ${b.toFixed(2)} - ${x.toFixed(3)} = ${(b - x).toFixed(3)}$ M.`,
              `Substitute: $K = \\dfrac{(${y.toFixed(3)})^2}{(${(a - x).toFixed(3)})(${(b - x).toFixed(3)})} = ${tx(K, 3)}$.`,
            ],
          };
        },
      },
      {
        id: 'le-chatelier',
        title: 'Le Chatelier',
        make(r) {
          const R = r.pick(RXNS);
          const dn = gasMoles(R.r) - gasMoles(R.l);
          const gl = R.l.filter(([, , p]) => p === 'g'), gr = R.r.filter(([, , p]) => p === 'g');
          const opts = [];
          if (gl.length) opts.push(['add-r'], ['rem-r']);
          if (gr.length) opts.push(['add-p'], ['rem-p']);
          opts.push(['heat'], ['cool'], ['squeeze'], ['expand'], ['cat']);
          const [kind] = r.pick(opts);
          const F = 'It shifts toward the products', B = 'It shifts toward the reactants', N = 'It does not shift';
          let q, ans, why;
          const fL = gl.length ? r.pick(gl)[0] : null, fR = gr.length ? r.pick(gr)[0] : null;
          if (kind === 'add-r') { q = `You add more $\\ce{${fL}}$.`; ans = F; why = 'Extra reactant drops $Q$ below $K$, so the forward reaction uses it up.'; }
          if (kind === 'rem-r') { q = `You remove some $\\ce{${fL}}$.`; ans = B; why = 'Less reactant raises $Q$ above $K$, so the reverse reaction makes more.'; }
          if (kind === 'add-p') { q = `You add more $\\ce{${fR}}$.`; ans = B; why = 'Extra product raises $Q$ above $K$, so the reverse reaction uses it up.'; }
          if (kind === 'rem-p') { q = `You remove some $\\ce{${fR}}$.`; ans = F; why = 'Less product drops $Q$ below $K$, so the forward reaction makes more.'; }
          if (kind === 'heat') { q = 'You raise the temperature.'; ans = R.dH > 0 ? F : B; why = R.dH > 0 ? 'The forward direction is endothermic, so heat acts as a reactant. $K$ rises.' : 'The forward direction is exothermic, so heat acts as a product. $K$ falls.'; }
          if (kind === 'cool') { q = 'You lower the temperature.'; ans = R.dH > 0 ? B : F; why = R.dH > 0 ? 'The forward direction is endothermic, so removing heat takes away a reactant. $K$ falls.' : 'The forward direction is exothermic, so removing heat takes away a product. $K$ rises.'; }
          if (kind === 'squeeze' || kind === 'expand') {
            const squeeze = kind === 'squeeze';
            q = squeeze ? 'You squeeze it into a smaller volume.' : 'You let it expand into a bigger volume.';
            if (dn === 0) { ans = N; why = `There are ${gasMoles(R.l)} gas molecules on each side, so changing the volume gives neither side an advantage.`; }
            else {
              const towardProducts = squeeze ? dn < 0 : dn > 0;
              ans = towardProducts ? F : B;
              why = `Gas molecules: ${gasMoles(R.l)} on the left, ${gasMoles(R.r)} on the right. ${squeeze ? 'Squeezing favors the side with fewer' : 'Expanding favors the side with more'}.`;
            }
          }
          if (kind === 'cat') { q = 'You add a catalyst.'; ans = N; why = 'A catalyst speeds both directions equally. It does not move the equilibrium.'; }
          const mc = r.mc(ans, [F, B, N].filter((x) => x !== ans));
          return {
            q: `$${eqTex(R)}$ is at equilibrium. The forward reaction is ${R.dH > 0 ? 'endothermic' : 'exothermic'}. ${q} What happens?`,
            choices: mc.choices, answer: mc.answer,
            steps: [why, `So: ${ans.toLowerCase()}.`],
          };
        },
      },
      {
        id: 'k-manip',
        title: 'Reverse or scale K',
        make(r) {
          const K = Number((r.num(1.1, 9.8, 1) * Math.pow(10, r.int(-3, 3))).toPrecision(2));
          const mode = r.pick(['reverse', 'double', 'half', 'revdouble']);
          let val, say, how;
          if (mode === 'reverse') { val = 1 / K; say = 'the reaction is written in reverse'; how = `Reversing flips the fraction: $K_{\\text{new}} = \\dfrac{1}{${tx(K, 2)}} = ${tx(val, 3)}$.`; }
          if (mode === 'double') { val = K * K; say = 'all the coefficients are doubled'; how = `Doubling squares the expression: $K_{\\text{new}} = (${tx(K, 2)})^2 = ${tx(val, 3)}$.`; }
          if (mode === 'half') { val = Math.sqrt(K); say = 'all the coefficients are halved'; how = `Halving takes the square root: $K_{\\text{new}} = \\sqrt{${tx(K, 2)}} = ${tx(val, 3)}$.`; }
          if (mode === 'revdouble') { val = 1 / (K * K); say = 'the reaction is reversed and its coefficients are doubled'; how = `Do both: $K_{\\text{new}} = \\dfrac{1}{(${tx(K, 2)})^2} = ${tx(val, 3)}$.`; }
          return {
            q: `A reaction has $K = ${tx(K, 2)}$. What is the new $K$ if ${say}?`,
            answer: val, unit: '', tol: 0.02,
            hint: 'Reversing gives $1/K$. Multiplying the coefficients by $n$ gives $K^n$.',
            steps: [how],
          };
        },
      },
    ],

    cards: [
      { front: 'What does dynamic equilibrium mean?', back: 'Forward and reverse reactions both keep running, at equal rates, so amounts stay constant.' },
      { front: 'Are reactants and products equal at equilibrium?', back: 'Almost never. The rates are equal. The amounts are set by $K$.' },
      { front: 'What goes into $K$?', back: 'Products over reactants, coefficients as exponents. Leave out pure solids and liquids.' },
      { front: '$Q < K$ means what?', back: 'Too little product. The reaction runs forward.' },
      { front: 'What are the rows of an ICE table?', back: 'Initial, Change, Equilibrium. The change row follows the coefficients.' },
      { front: "State Le Chatelier's principle.", back: 'A system at equilibrium shifts to ease any stress placed on it.' },
      { front: 'What is the only thing that changes $K$?', back: 'Temperature.' },
      { front: 'How does heating affect an exothermic reaction at equilibrium?', back: 'Heat acts as a product. It shifts in reverse, and $K$ falls.' },
      { front: 'How does a catalyst affect equilibrium?', back: 'It does not. It speeds both directions equally, so equilibrium arrives sooner.' },
    ],

    terms: [
      { term: 'Reversible reaction', def: 'A reaction whose products can turn back into reactants, written with $\\ce{<=>}$.' },
      { term: 'Dynamic equilibrium', def: 'The state where forward and reverse rates are equal, so amounts stay constant while molecules keep reacting.' },
      { term: 'Equilibrium constant', def: 'The value $K$ of products over reactants at equilibrium, with coefficients as exponents. It depends only on temperature.' },
      { term: 'Reaction quotient', def: 'The value $Q$, the same fraction as $K$ using the concentrations at any moment. Compare it to $K$ to find the direction.' },
      { term: 'ICE table', def: 'A table of Initial, Change and Equilibrium amounts used to solve equilibrium problems.' },
      { term: "Le Chatelier's principle", def: 'A system at equilibrium responds to a stress by shifting in the direction that eases it.' },
      { term: 'Product-favored', def: 'Describes a reaction with a large $K$, whose equilibrium mixture is mostly products.' },
      { term: 'Reactant-favored', def: 'Describes a reaction with a small $K$, whose equilibrium mixture is mostly reactants.' },
    ],
  });
})();
