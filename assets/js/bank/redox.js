/* Question bank for 5.5 Oxidation and reduction, plus window.Redox: the oxidation number solver and the
   activity series, so the bench, the problems and the equations all use one copy of the rules. */
(function () {
  'use strict';
  const R = (window.Redox = {});
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);

  /* ---------- Oxidation numbers ---------- */
  const GROUP1 = ['Li', 'Na', 'K', 'Rb', 'Cs'], GROUP2 = ['Be', 'Mg', 'Ca', 'Sr', 'Ba'], HALO = ['Cl', 'Br', 'I'];
  R.RULES = {
    element: 'Rule 1: a free element is 0.',
    mono: 'Rule 2: a one-atom ion equals its charge.',
    g1: 'Rule 3: group 1 metals are +1.',
    g2: 'Rule 3: group 2 metals are +2.',
    al: 'Rule 3: aluminum is +3.',
    F: 'Rule 4: fluorine is −1.',
    H: 'Rule 5: hydrogen is +1.',
    Hm: 'Rule 5: hydrogen is −1 when bonded to a metal.',
    O: 'Rule 6: oxygen is −2.',
    Om: 'Rule 6: oxygen is −1 in a peroxide.',
    X: 'Rule 7: this halogen is −1, since it is not with O or a lighter halogen.',
    sum: 'Rule 8: this one is whatever makes the total come out right.',
  };
  /* f: formula without charge. z: total charge. Only species that need a flag carry one. */
  R.SPECIES = [
    { f: 'H2O' }, { f: 'O2' }, { f: 'Fe' }, { f: 'Na', z: 1 }, { f: 'S', z: -2 }, { f: 'NH3' }, { f: 'CH4' }, { f: 'CO2' }, { f: 'CO' },
    { f: 'H2O2', peroxide: true }, { f: 'NaH', hydride: true }, { f: 'CaH2', hydride: true }, { f: 'OF2' }, { f: 'NaCl' }, { f: 'MgO' },
    { f: 'Al2O3' }, { f: 'Fe2O3' }, { f: 'FeCl3' }, { f: 'CuO' }, { f: 'Cu2O' }, { f: 'MnO2' }, { f: 'SO2' }, { f: 'SO3' }, { f: 'H2S' },
    { f: 'NO' }, { f: 'NO2' }, { f: 'N2O' }, { f: 'N2O5' }, { f: 'PCl5' }, { f: 'HCl' }, { f: 'HNO3' }, { f: 'H2SO4' }, { f: 'H3PO4' },
    { f: 'NO3', z: -1 }, { f: 'NO2', z: -1 }, { f: 'NH4', z: 1 }, { f: 'SO4', z: -2 }, { f: 'SO3', z: -2 }, { f: 'CO3', z: -2 }, { f: 'PO4', z: -3 },
    { f: 'ClO', z: -1 }, { f: 'ClO3', z: -1 }, { f: 'ClO4', z: -1 }, { f: 'MnO4', z: -1 }, { f: 'CrO4', z: -2 }, { f: 'Cr2O7', z: -2 }, { f: 'C2O4', z: -2 },
    { f: 'KMnO4' }, { f: 'K2Cr2O7' }, { f: 'NaClO3' }, { f: 'CH3OH' }, { f: 'C2H6' },
  ];
  /** Text both mhchem and Art.formula understand: 'Cr2O7^2-'. */
  R.speciesText = function (sp) {
    const z = sp.z || 0;
    if (!z) return sp.f;
    const n = Math.abs(z);
    return `${sp.f}^${n > 1 ? n : ''}${z > 0 ? '+' : '-'}`;
  };
  R.signed = (v) => {
    if (Number.isInteger(v)) return v > 0 ? `+${v}` : v < 0 ? `−${-v}` : '0';
    return (v > 0 ? '+' : '−') + Math.abs(v).toFixed(2);
  };
  const paren = (v) => (v < 0 ? `(-${-v})` : `(+${v})`);
  /** Oxidation number of every element in a species, each with its rule, plus the algebra as TeX lines. */
  R.solve = function (sp) {
    const counts = Bank.countAtoms(sp.f), z = sp.z || 0;
    const order = [];
    sp.f.replace(/[A-Z][a-z]?/g, (m) => { if (!order.includes(m)) order.push(m); return m; });
    const has = (e) => order.includes(e);
    const known = {};
    if (order.length === 1) {
      const e = order[0];
      if (!z) known[e] = { v: 0, rule: 'element' };
      else if (counts[e] === 1) known[e] = { v: z, rule: 'mono' };
    } else {
      order.forEach((e) => {
        if (GROUP1.includes(e)) known[e] = { v: 1, rule: 'g1' };
        else if (GROUP2.includes(e)) known[e] = { v: 2, rule: 'g2' };
        else if (e === 'Al') known[e] = { v: 3, rule: 'al' };
        else if (e === 'F') known[e] = { v: -1, rule: 'F' };
        else if (e === 'H') known[e] = sp.hydride ? { v: -1, rule: 'Hm' } : { v: 1, rule: 'H' };
        else if (e === 'O' && !has('F')) known[e] = sp.peroxide ? { v: -1, rule: 'Om' } : { v: -2, rule: 'O' };
        else if (HALO.includes(e) && !has('O') && !has('F')) known[e] = { v: -1, rule: 'X' };
      });
    }
    const unknown = order.filter((e) => !known[e]);
    let target = null;
    if (unknown.length === 1) {
      target = unknown[0];
      const sum = order.filter((e) => known[e]).reduce((s, e) => s + known[e].v * counts[e], 0);
      known[target] = { v: (z - sum) / counts[target], rule: 'sum' };
    } else if (unknown.length > 1) throw new Error('Too many unknowns in ' + sp.f);
    const items = order.map((e) => ({ el: e, n: counts[e], v: known[e].v, rule: known[e].rule, why: R.RULES[known[e].rule] }));
    const total = items.reduce((s, it) => s + it.v * it.n, 0);
    const lines = [];
    if (target) {
      const me = items.find((it) => it.el === target);
      const others = items.filter((it) => it.el !== target);
      const known2 = others.reduce((s, it) => s + it.v * it.n, 0);
      const lhs = order.map((e) => { const it = items.find((x) => x.el === e); return e === target ? `${it.n > 1 ? it.n : ''}x` : `${it.n}${paren(it.v)}`; }).join(' + ');
      lines.push(`$${lhs} = ${z}$`);
      if (others.length) lines.push(`$${me.n > 1 ? me.n : ''}x ${known2 < 0 ? '-' : '+'} ${Math.abs(known2)} = ${z}$`);
      if (me.n > 1) lines.push(`$${me.n}x = ${z - known2}$`);
      lines.push(`$x = ${me.v > 0 ? '+' : ''}${Number.isInteger(me.v) ? me.v : me.v.toFixed(2)}$`);
    }
    return { items, order, target, lines, total, ok: Math.abs(total - z) < 1e-9, z, text: R.speciesText(sp) };
  };

  /* ---------- Activity series ---------- */
  R.LADDER = ['K', 'Ca', 'Na', 'Mg', 'Al', 'Zn', 'Fe', 'Ni', 'Sn', 'Pb', 'H', 'Cu', 'Ag', 'Au'];
  const rank = (s) => R.LADDER.indexOf(s);
  R.rank = rank;
  const elName = { K: 'potassium', Ca: 'calcium', Na: 'sodium', Mg: 'magnesium', Al: 'aluminum', Zn: 'zinc', Fe: 'iron', Ni: 'nickel', Sn: 'tin', Pb: 'lead', H: 'hydrogen', Cu: 'copper', Ag: 'silver', Au: 'gold' };
  R.elName = elName;
  /* Each metal as a strip: the charge of its ion in these reactions, and how it looks. */
  R.METALS = [
    { sym: 'Mg', z: 2, strip: '#CFD3DC' }, { sym: 'Al', z: 3, strip: '#D6D8DE' }, { sym: 'Zn', z: 2, strip: '#A9B3BF' }, { sym: 'Fe', z: 2, strip: '#8C8F96' },
    { sym: 'Ni', z: 2, strip: '#B8B5A2' }, { sym: 'Pb', z: 2, strip: '#737A87' }, { sym: 'Cu', z: 2, strip: '#CE7A42' }, { sym: 'Ag', z: 1, strip: '#E4E8EE' }, { sym: 'Au', z: 3, strip: '#F5C531' },
  ];
  /* Each solution: the ion it offers, its salt formula, its color. coat: how the deposited metal looks. */
  R.IONS = [
    { sym: 'Mg', z: 2, salt: 'MgSO4', coat: '#AEB3BD' },
    { sym: 'Zn', z: 2, salt: 'ZnSO4', coat: '#55595F' },
    { sym: 'Fe', z: 2, salt: 'FeSO4', color: '#BFE7B6', coat: '#3E3F44' },
    { sym: 'Ni', z: 2, salt: 'NiSO4', color: '#4FCB8A', coat: '#4A4B4E' },
    { sym: 'Pb', z: 2, salt: 'Pb(NO3)2', coat: '#4A4F58' },
    { sym: 'H', z: 1, salt: 'HCl', gas: true },
    { sym: 'Cu', z: 2, salt: 'CuSO4', color: '#2A86E8', coat: '#B5602E' },
    { sym: 'Ag', z: 1, salt: 'AgNO3', coat: '#E9EDF2', crystals: true },
  ];
  R.METAL_ION_COLOR = { Cu: '#2A86E8', Fe: '#BFE7B6', Ni: '#4FCB8A' };
  const NOTES = {
    'Al|': 'Real aluminum wears a thin oxide skin, so it starts slowly. The series tells you it can happen, not how fast.',
    'Pb|H': 'In real hydrochloric acid, lead barely reacts: a coat of insoluble $\\ce{PbCl2}$ forms and protects it. The series says it could.',
  };
  R.ionText = (sym, z) => `${sym}^${z > 1 ? z : ''}+`;
  /**
   * What happens when a metal strip meets an ion. All coefficients come from matching electrons,
   * then get checked for atoms, charge and electrons.
   */
  R.react = function (metal, ion) {
    const M = typeof metal === 'string' ? R.METALS.find((m) => m.sym === metal) : metal;
    const N = typeof ion === 'string' ? R.IONS.find((m) => m.sym === ion) : ion;
    const out = { M, N, same: M.sym === N.sym, goes: rank(M.sym) < rank(N.sym) };
    out.note = (M.sym === 'Al' ? NOTES['Al|'] : '') || NOTES[`${M.sym}|${N.sym}`] || '';
    if (!out.goes) return out;
    const e = lcm(M.z, N.z);
    let a = e / M.z, b = e / N.z;
    if (N.gas && b % 2) { a *= 2; b *= 2; }
    const electrons = a * M.z;
    const mIon = R.ionText(M.sym, M.z), nIon = R.ionText(N.sym, N.z);
    const c = (n) => (n > 1 ? n : '');
    const gasN = b / 2;
    const prod = N.gas ? `${c(gasN)}H2` : `${c(b)}${N.sym}`;
    Object.assign(out, {
      a, b, electrons, mIon, nIon,
      oxHalf: `${M.sym} -> ${mIon} + ${c(M.z)}e-`,
      redHalf: N.gas ? '2H+ + 2e- -> H2' : `${nIon} + ${c(N.z)}e- -> ${N.sym}`,
      oxTimes: a,
      redTimes: N.gas ? gasN : b,
      net: `${c(a)}${M.sym}(s) + ${c(b)}${nIon}(aq) -> ${c(a)}${mIon}(aq) + ${prod}(${N.gas ? 'g' : 's'})`,
      netPlain: `${c(a)}${M.sym} + ${c(b)}${nIon} -> ${c(a)}${mIon} + ${prod}`,
    });
    // Check: atoms by construction, then charge and electrons.
    const chargeL = b * N.z, chargeR = a * M.z;
    out.ok = chargeL === chargeR && electrons === b * N.z;
    return out;
  };
  R.selfTest = function () {
    const out = [];
    const want = { 'Zn|Cu': true, 'Cu|Zn': false, 'Cu|Ag': true, 'Ag|Cu': false, 'Mg|H': true, 'Cu|H': false, 'Au|Ag': false, 'Fe|Cu': true };
    for (const k in want) { const [m, i] = k.split('|'); if (R.react(m, i).goes !== want[k]) out.push('activity wrong: ' + k); }
    R.METALS.forEach((m) => R.IONS.forEach((n) => { const r = R.react(m, n); if (r.goes && !r.ok) out.push(`unbalanced ${m.sym} + ${n.sym}`); }));
    const known = { 'SO4': { S: 6 }, 'MnO4': { Mn: 7 }, 'Cr2O7': { Cr: 6 }, NH3: { N: -3 }, 'NH4': { N: -3 }, 'HNO3': { N: 5 }, H2O2: { O: -1 }, NaH: { H: -1 }, OF2: { O: 2 }, ClO4: { Cl: 7 }, Fe2O3: { Fe: 3 }, C2O4: { C: 3 }, CH4: { C: -4 }, PCl5: { P: 5 }, O2: { O: 0 }, H2S: { S: -2 }, CH3OH: { C: -2 } };
    R.SPECIES.forEach((sp) => {
      const s = R.solve(sp);
      if (!s.ok) out.push('does not sum: ' + sp.f);
      const k = known[sp.f];
      if (k) for (const e in k) { const it = s.items.find((x) => x.el === e); if (!it || it.v !== k[e]) out.push(`${sp.f}: ${e} should be ${k[e]}, got ${it && it.v}`); }
    });
    return out;
  };

  /* ---------- Generators ---------- */
  const reacting = () => {
    const list = [];
    R.METALS.forEach((m) => R.IONS.forEach((n) => { const r = R.react(m, n); if (r.goes) list.push(r); }));
    return list;
  };
  const ce = (t) => `$\\ce{${t}}$`;
  const REDOX_YES = [
    ['2Mg + O2 -> 2MgO', 'Mg goes from 0 to +2 and O goes from 0 to −2.'],
    ['Zn + 2HCl -> ZnCl2 + H2', 'Zn goes from 0 to +2 and H goes from +1 to 0.'],
    ['CH4 + 2O2 -> CO2 + 2H2O', 'C goes from −4 to +4 and O goes from 0 to −2.'],
    ['2Na + Cl2 -> 2NaCl', 'Na goes from 0 to +1 and Cl goes from 0 to −1.'],
    ['Fe2O3 + 3CO -> 2Fe + 3CO2', 'Fe goes from +3 to 0 and C goes from +2 to +4.'],
    ['2H2 + O2 -> 2H2O', 'H goes from 0 to +1 and O goes from 0 to −2.'],
  ];
  const REDOX_NO = [
    ['AgNO3 + NaCl -> AgCl + NaNO3', 'a precipitation: no oxidation number changes'],
    ['HCl + NaOH -> NaCl + H2O', 'an acid-base reaction: no oxidation number changes'],
    ['CaCO3 -> CaO + CO2', 'a decomposition with no oxidation number changes: Ca stays +2, C stays +4, O stays −2'],
    ['BaCl2 + Na2SO4 -> BaSO4 + 2NaCl', 'a precipitation: no oxidation number changes'],
    ['CaO + H2O -> Ca(OH)2', 'a combination with no oxidation number changes'],
  ];

  Bank.add('redox', {
    quiz: [
      {
        q: 'What is oxidation, in terms of electrons?',
        options: ['Gaining electrons', 'Losing electrons', 'Gaining oxygen only', 'Gaining protons'],
        answer: 1,
        why: 'OIL RIG: Oxidation Is Loss. The name came from reactions with oxygen, but today it means losing electrons, with or without any oxygen.',
      },
      {
        q: 'In $\\ce{Zn + Cu^2+ -> Zn^2+ + Cu}$, which species is oxidized?',
        options: ['$\\ce{Zn}$', '$\\ce{Cu^2+}$', '$\\ce{Zn^2+}$', '$\\ce{Cu}$'],
        answer: 0,
        why: 'Zinc goes from 0 to +2, losing two electrons. So zinc is oxidized and copper(II) is reduced.',
      },
      {
        q: 'What is the oxidizing agent in $\\ce{Zn + Cu^2+ -> Zn^2+ + Cu}$?',
        options: ['$\\ce{Zn}$', '$\\ce{Cu^2+}$', '$\\ce{Zn^2+}$', '$\\ce{SO4^2-}$'],
        answer: 1,
        why: 'The oxidizing agent takes the electrons and is itself reduced. That is $\\ce{Cu^2+}$.',
      },
      {
        q: 'What is the oxidation number of Mn in $\\ce{KMnO4}$?',
        options: ['+1', '+4', '+7', '−1'],
        answer: 2,
        why: 'K is +1, and four O are −8 in total. The sum must be 0: $+1 + x - 8 = 0$, so $x = +7$.',
      },
      {
        q: 'What is the oxidation number of O in $\\ce{H2O2}$?',
        options: ['−2', '−1', '0', '+1'],
        answer: 1,
        why: 'This is a peroxide, the classic exception. H is +1, so $2(+1) + 2x = 0$ gives $x = -1$.',
      },
      {
        q: 'Copper sits below hydrogen in the activity series. What happens when copper goes into hydrochloric acid?',
        options: ['Copper dissolves, with bubbles of hydrogen', 'Nothing happens', 'Chlorine gas forms', 'The copper turns to hydrogen'],
        answer: 1,
        why: 'A metal only displaces what sits below it. Copper is below hydrogen, so it cannot give electrons to $\\ce{H+}$.',
      },
      {
        q: 'Which reaction is <b>not</b> a redox reaction?',
        options: ['$\\ce{2Mg + O2 -> 2MgO}$', '$\\ce{Zn + 2HCl -> ZnCl2 + H2}$', '$\\ce{HCl + NaOH -> NaCl + H2O}$', '$\\ce{CH4 + 2O2 -> CO2 + 2H2O}$'],
        answer: 2,
        why: 'In acid-base neutralization, H stays +1, O stays −2, and Na and Cl stay as they are. No oxidation number changes.',
      },
      {
        q: 'Why must electrons lost equal electrons gained in a balanced redox equation?',
        options: ['Electrons cannot vanish or appear out of nowhere', 'It is only a convention', 'Only because oxygen is present', 'They do not have to match'],
        answer: 0,
        why: 'Every electron one atom gives up must land on another. In $\\ce{2Al + 3Cu^2+}$, 2 Al lose 6 electrons in total, and 3 $\\ce{Cu^2+}$ gain those 6.',
      },
    ],

    gens: [
      {
        id: 'ox-number',
        title: 'Find the oxidation number',
        make(r) {
          const sp = r.pick(R.SPECIES.filter((s) => R.solve(s).target || r.next() < 0.3));
          const s = R.solve(sp);
          const it = s.target ? s.items.find((x) => x.el === s.target) : r.pick(s.items);
          return {
            q: `What is the oxidation number of ${it.el} in ${ce(R.speciesText(sp))}? Include the sign, like +6 or -2.`,
            answer: it.v,
            answerText: R.signed(it.v),
            placeholder: '+6',
            tol: 0.001,
            hint: 'Assign the easy atoms first, then make the total equal the charge.',
            steps: (s.target ? s.items.filter((x) => x.el !== s.target).map((x) => `${x.el}: ${x.why}`) : [it.why])
              .concat(s.lines.length ? [`Set the total equal to the charge: ${s.lines.join(', so ')}.`] : []),
          };
        },
      },
      {
        id: 'who-oxidized',
        title: 'Oxidized or reduced?',
        make(r) {
          const x = r.pick(reacting());
          const askOx = r.next() < 0.5;
          const mc = r.mc(ce(askOx ? x.M.sym : x.nIon), [ce(askOx ? x.nIon : x.M.sym), ce(x.mIon), ce(x.N.gas ? 'H2' : x.N.sym)]);
          return {
            q: `In ${ce(x.netPlain)}, which species is ${askOx ? 'oxidized' : 'reduced'}?`,
            choices: mc.choices,
            answer: mc.answer,
            steps: [
              `${x.M.sym} goes from 0 to ${R.signed(x.M.z)}. The number goes up, so it loses electrons and is oxidized.`,
              `${x.N.sym} goes from ${R.signed(x.N.z)} to 0. The number goes down, so it gains electrons and is reduced.`,
            ],
          };
        },
      },
      {
        id: 'agents',
        title: 'Name the agent',
        make(r) {
          const x = r.pick(reacting());
          const askOx = r.next() < 0.5;
          const mc = r.mc(ce(askOx ? x.nIon : x.M.sym), [ce(askOx ? x.M.sym : x.nIon), ce(x.mIon), ce(x.N.gas ? 'H2' : x.N.sym)]);
          return {
            q: `In ${ce(x.netPlain)}, what is the ${askOx ? 'oxidizing' : 'reducing'} agent?`,
            choices: mc.choices,
            answer: mc.answer,
            steps: [
              `${ce(x.nIon)} takes electrons and is reduced, so it is the oxidizing agent.`,
              `${ce(x.M.sym)} gives electrons and is oxidized, so it is the reducing agent.`,
            ],
          };
        },
      },
      {
        id: 'activity',
        title: 'Will it react?',
        make(r) {
          const m = r.pick(R.METALS);
          const n = r.pick(R.IONS.filter((x) => x.sym !== m.sym));
          const x = R.react(m, n);
          return {
            q: `A strip of ${elName[m.sym]} goes into ${ce(n.salt)} solution. Using the activity series, does ${elName[m.sym]} displace the ${ce(R.ionText(n.sym, n.z))} ion?`,
            choices: ['Yes, it reacts', 'No, nothing happens'],
            answer: x.goes ? 0 : 1,
            steps: [
              `The series, from most to least active: ${R.LADDER.join(', ')}.`,
              `${m.sym} is ${x.goes ? 'above' : 'below'} ${n.sym}, so ${x.goes ? `it gives electrons to ${ce(R.ionText(n.sym, n.z))}` : 'it cannot give electrons to that ion'}.`,
            ].concat(x.goes ? [`Net equation: ${ce(x.netPlain)}.`] : []),
          };
        },
      },
      {
        id: 'electrons',
        title: 'Count the electrons',
        make(r) {
          const x = r.pick(reacting());
          return {
            q: `Balance $\\ce{${x.M.sym} + ${x.nIon} -> ${x.mIon} + ${x.N.gas ? 'H2' : x.N.sym}}$. How many electrons are transferred in the balanced equation, using the smallest whole numbers?`,
            answer: x.electrons,
            answerText: String(x.electrons),
            tol: 0.001,
            hint: 'Each metal atom loses a set number of electrons. Each ion gains a set number. Find the smallest number that fits both.',
            steps: [
              `Oxidation half: ${ce(x.oxHalf)}.`,
              `Reduction half: ${ce(x.redHalf)}.`,
              `Multiply by ${x.oxTimes} and ${x.redTimes} so that the electrons match: ${x.electrons} lost and ${x.electrons} gained.`,
              `Balanced: ${ce(x.netPlain)}.`,
            ],
          };
        },
      },
      {
        id: 'is-redox',
        title: 'Exam style: is it redox?',
        make(r) {
          const [yes, why] = r.pick(REDOX_YES);
          const nos = r.shuffle(REDOX_NO).slice(0, 3);
          const mc = r.mc(ce(yes), nos.map((n) => ce(n[0])));
          return {
            q: `Which of these is a redox reaction? ${mc.choices.join(', ')}`,
            choices: mc.choices,
            answer: mc.answer,
            steps: [`A reaction is redox if any oxidation number changes.`, `${ce(yes)}: ${why}`].concat(nos.map((n) => `${ce(n[0])} is ${n[1]}.`)),
          };
        },
      },
    ],

    cards: [
      { front: 'What does OIL RIG stand for?', back: 'Oxidation Is Loss of electrons, Reduction Is Gain of electrons.' },
      { front: 'What does LEO says GER stand for?', back: 'Lose Electrons, Oxidation. Gain Electrons, Reduction.' },
      { front: 'What does the oxidizing agent do?', back: 'It takes electrons from something else, and gets reduced.' },
      { front: 'What does the reducing agent do?', back: 'It gives electrons to something else, and gets oxidized.' },
      { front: 'What is the oxidation number of a free element?', back: '0.' },
      { front: 'What is the oxidation number of O in most compounds?', back: '−2, but −1 in peroxides.' },
      { front: 'What is the oxidation number of H in most compounds?', back: '+1, but −1 with metals (hydrides).' },
      { front: 'What must oxidation numbers add up to?', back: 'The total charge of the molecule or ion.' },
      { front: 'What decides if a metal displaces another?', back: 'It must be higher in the activity series.' },
    ],

    terms: [
      { term: 'Oxidation', def: 'Losing electrons. The oxidation number goes up.' },
      { term: 'Reduction', def: 'Gaining electrons. The oxidation number goes down.' },
      { term: 'Redox reaction', def: 'A reaction in which electrons move between species, so oxidation numbers change.' },
      { term: 'Oxidation number', def: 'A bookkeeping number for an atom, found by assigning shared electrons to the more electronegative partner.' },
      { term: 'Oxidizing agent', def: 'The species that takes electrons and gets reduced.' },
      { term: 'Reducing agent', def: 'The species that gives electrons and gets oxidized.' },
      { term: 'Half-reaction', def: 'One side of a redox reaction, showing either the loss or the gain of electrons.' },
      { term: 'Activity series', def: 'A ranking of metals by how readily they give up electrons.' },
      { term: 'Displacement', def: 'A reaction in which a more active metal replaces the ion of a less active metal.' },
      { term: 'Peroxide', def: 'A compound with an oxygen-oxygen single bond, such as $\\ce{H2O2}$. Its oxygen is −1.' },
    ],
  });
})();
