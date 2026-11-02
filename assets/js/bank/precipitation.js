/* Question bank for 5.3 Precipitation and net ionic equations.
   Every verdict and equation comes from window.Solubility (bank/solubility.js), read inside make()
   because bank files can load in any order. */
(function () {
  'use strict';
  const Sol = () => window.Solubility;
  /** Reagent pairs with a clear textbook answer: no borderline solids and no real-flask surprises. */
  function cleanPairs(kinds) {
    const S = Sol();
    const out = [];
    S.reagents.forEach((a, i) => {
      S.reagents.forEach((b, j) => {
        if (j <= i) return;
        const m = S.mix(a, b);
        if (m.shareIon || m.real || !m.molecular) return;
        if (kinds.includes(m.kind)) out.push(m);
      });
    });
    return out;
  }
  const ce = (t) => `$\\ce{${t}}$`;
  const swapSteps = (m) => {
    const S = Sol();
    const [p1, p2] = m.pairs;
    return [
      `The ions in the mix are ${[m.A.c, m.A.a, m.B.c, m.B.a].map((i) => S.ionTex(i)).join(', ')}.`,
      `Swap partners. The new pairs are $\\ce{${p1.formula}}$ and $\\ce{${p2.formula}}$.`,
      `$\\ce{${p1.formula}}$: ${p1.reason}`,
      `$\\ce{${p2.formula}}$: ${p2.reason}`,
    ];
  };

  Bank.add('precipitation', {
    quiz: [
      {
        q: 'What is a precipitate?',
        options: ['Any liquid that forms in a reaction', 'An insoluble solid that forms when solutions are mixed', 'The water left after a reaction', 'A gas bubbling out of solution'],
        answer: 1,
        why: 'When ions meet a partner they cannot dissolve with, they crash out of the water as a solid. That solid is the precipitate.',
      },
      {
        q: 'What is a spectator ion?',
        options: ['An ion that ends up in the precipitate', 'An ion that gets used up', 'An ion that stays dissolved and unchanged through the reaction', 'An ion that only appears in the net ionic equation'],
        answer: 2,
        why: 'Spectators start in the water and finish in the water, exactly the same. They appear on both sides of the complete ionic equation and cancel out.',
      },
      {
        q: 'Which of these do you split into ions in a complete ionic equation?',
        options: ['$\\ce{AgCl(s)}$', '$\\ce{H2O(l)}$', '$\\ce{KNO3(aq)}$', '$\\ce{CO2(g)}$'],
        answer: 2,
        why: 'Only dissolved strong electrolytes split. Solids, liquids and gases stay whole, because they are not free ions in the water.',
      },
      {
        q: 'Solutions of $\\ce{KNO3}$ and $\\ce{NaCl}$ are mixed. What happens?',
        options: ['A precipitate of $\\ce{KCl}$ forms', 'A precipitate of $\\ce{NaNO3}$ forms', 'Nothing: all four ions stay dissolved', 'Bubbles of chlorine form'],
        answer: 2,
        why: 'Swap partners and you get $\\ce{KCl}$ and $\\ce{NaNO3}$. Both are soluble by rule 1, so all the ions are spectators and there is no reaction.',
      },
      {
        q: 'What is the net ionic equation for $\\ce{Pb(NO3)2(aq)}$ + $\\ce{2KI(aq)}$ $\\rightarrow$ $\\ce{PbI2(s)}$ + $\\ce{2KNO3(aq)}$?',
        options: ['$\\ce{Pb^2+(aq)}$ + $\\ce{2I^-(aq)}$ $\\rightarrow$ $\\ce{PbI2(s)}$', '$\\ce{K+(aq)}$ + $\\ce{NO3^-(aq)}$ $\\rightarrow$ $\\ce{KNO3(aq)}$', '$\\ce{Pb(NO3)2(aq)}$ + $\\ce{2I^-(aq)}$ $\\rightarrow$ $\\ce{PbI2(s)}$ + $\\ce{2NO3^-(aq)}$', '$\\ce{Pb^2+(aq)}$ + $\\ce{I^-(aq)}$ $\\rightarrow$ $\\ce{PbI(s)}$'],
        answer: 0,
        why: 'Potassium and nitrate are spectators. Only lead and iodide change. It takes two $\\ce{I-}$ to balance one $\\ce{Pb^2+}$.',
      },
      {
        q: 'A student writes the net ionic equation $\\ce{Ag+(aq) + S^2-(aq) -> Ag2S(s)}$. What is wrong?',
        options: ['Nothing is wrong', 'It is not balanced: it needs $\\ce{2Ag+}$', 'Silver sulfide is soluble', 'The sulfide ion should have a charge of 1−'],
        answer: 1,
        why: 'Count silver: 1 on the left, 2 on the right. Count charge: −1 on the left, 0 on the right. A correct net ionic equation balances both atoms and charge.',
      },
      {
        q: 'Which pair of solutions gives the same net ionic equation as $\\ce{BaCl2(aq) + Na2SO4(aq)}$?',
        options: ['$\\ce{Ba(NO3)2(aq) + K2SO4(aq)}$', '$\\ce{CaCl2(aq) + Na2CO3(aq)}$', '$\\ce{NaCl(aq) + K2SO4(aq)}$', '$\\ce{BaCl2(aq) + NaNO3(aq)}$'],
        answer: 0,
        why: 'Any soluble barium salt plus any soluble sulfate gives $\\ce{Ba^2+(aq) + SO4^2-(aq) -> BaSO4(s)}$. That is the point of net ionic equations: the spectators do not matter.',
      },
      {
        q: 'Why do we not split $\\ce{HC2H3O2(aq)}$ in a complete ionic equation, even though it is dissolved?',
        options: ['It is a solid', 'It is a weak acid: nearly all of it stays as whole molecules', 'It has no hydrogen to give', 'Acetate is insoluble'],
        answer: 1,
        why: 'Only strong electrolytes split fully. Weak acids and weak bases stay mostly whole, so we write them whole.',
      },
    ],

    gens: [
      {
        id: 'predict',
        title: 'Predict the precipitate',
        make(r) {
          const S = Sol();
          const pool = r.next() < 0.75 ? cleanPairs(['precip']) : cleanPairs(['none']);
          const m = r.pick(pool);
          const [p1, p2] = m.pairs;
          const solid = m.kind === 'none' ? 'No precipitate forms' : `$\\ce{${(m.solids[0].key === 'Ag|OH' ? 'Ag2O' : m.solids[0].formula)}}$`;
          const wrong = [];
          if (m.kind === 'none') wrong.push(ce(p1.formula), ce(p2.formula), ce(m.A.formula));
          else {
            wrong.push('No precipitate forms');
            [p1, p2].forEach((p) => { if (p.soluble) wrong.push(ce(p.formula)); });
            wrong.push(ce(m.A.formula), ce(m.B.formula));
          }
          const mc = r.mc(solid, wrong.slice(0, 3));
          void S;
          return {
            q: `Solutions of $\\ce{${m.A.formula}}$ and $\\ce{${m.B.formula}}$ are mixed. What precipitate forms?`,
            choices: mc.choices,
            answer: mc.answer,
            steps: swapSteps(m).concat([m.kind === 'none' ? 'Both new pairs dissolve, so every ion is a spectator and nothing happens.' : `So the solid is ${solid}.`]),
          };
        },
      },
      {
        id: 'write-solid',
        title: 'Write the solid',
        make(r) {
          const m = r.pick(cleanPairs(['precip']).filter((x) => x.solids[0].key !== 'Ag|OH'));
          const f = m.solids[0].formula;
          return {
            q: `Solutions of $\\ce{${m.A.formula}}$ and $\\ce{${m.B.formula}}$ are mixed, and a solid forms. Type its formula, like PbI2.`,
            accept: [f],
            placeholder: 'Formula',
            hint: 'Swap partners, then use the solubility rules to find which new pair cannot stay dissolved. Balance its charges.',
            steps: swapSteps(m).concat([`The insoluble pair is $\\ce{${f}}$.`]),
          };
        },
      },
      {
        id: 'net-ionic',
        title: 'Pick the net ionic equation',
        make(r) {
          const S = Sol();
          const m = r.pick(cleanPairs(['precip']).filter((x) => x.net.left.length === 2 && x.net.right.length === 1));
          const right = S.eqTex(m.net);
          const [i1, i2] = m.net.left;
          const sol = m.net.right[0];
          const one = (t) => Object.assign({}, t, { n: 1 });
          // Tempting wrong answers: coefficients dropped, the spectators' pair instead, nothing crossed out.
          const flat = { left: [one(i1), one(i2)], right: [one(sol)] };
          const specC = m.spectators.find((x) => x.type === 'cation'), specA = m.spectators.find((x) => x.type === 'anion');
          const specEq = {
            left: m.complete.left.filter((t) => t.ion === specC.id || t.ion === specA.id),
            right: [{ n: 1, f: S.formula(specC, specA), phase: 's', z: 0 }],
          };
          const wrong = [flat, specEq, m.complete, m.molecular].map((eq) => S.eqTex(eq)).filter((w) => w !== right);
          const mc = r.mc(right, wrong.slice(0, 3));
          return {
            q: `Which is the net ionic equation for ${S.eqTex(m.molecular, false)}?`,
            choices: mc.choices,
            answer: mc.answer,
            steps: [
              `Split the dissolved compounds: ${S.eqTex(m.complete)}.`,
              `Cross out ions that appear unchanged on both sides: ${m.spectators.map((x) => S.ionTex(x)).join(' and ')}.`,
              `What remains is ${right}. Check: atoms match, and charge is ${m.checks.net.leftCharge} on both sides.`,
            ],
          };
        },
      },
      {
        id: 'spectators',
        title: 'Spot the spectators',
        make(r) {
          const S = Sol();
          const m = r.pick(cleanPairs(['precip']));
          const pair = (a, b) => `${S.ionTex(a)} and ${S.ionTex(b)}`;
          const specs = m.spectators;
          const good = pair(specs[0], specs[1]);
          const all = [m.A.c, m.A.a, m.B.c, m.B.a];
          const wrong = [];
          for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
            const text = pair(all[i], all[j]);
            const isGood = specs.some((x) => x.id === all[i]) && specs.some((x) => x.id === all[j]);
            if (!isGood) wrong.push(text);
          }
          const mc = r.mc(good, r.shuffle(wrong).slice(0, 3));
          return {
            q: `Solutions of $\\ce{${m.A.formula}}$ and $\\ce{${m.B.formula}}$ are mixed. Which ions are spectators?`,
            choices: mc.choices,
            answer: mc.answer,
            steps: swapSteps(m).concat([`The ions in the solid are used up. The others stay in the water, unchanged: ${good}.`]),
          };
        },
      },
      {
        id: 'mass-excess',
        title: 'Mass of precipitate, excess reagent',
        make(r) {
          const m = r.pick(cleanPairs(['precip']));
          const solidTerm = m.molecular.right.find((t) => t.phase === 's');
          const nA = m.molecular.left[0].n;
          const nS = solidTerm.n;
          const V = r.pick([10, 15, 20, 25, 30, 40, 50, 75, 100]);
          const Mc = r.pick([0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.5]);
          const molA = (V / 1000) * Mc;
          const molS = (molA * nS) / nA;
          const FW = Bank.molarMass(solidTerm.f);
          const mass = molS * FW;
          return {
            q: `A chemist adds excess $\\ce{${m.B.formula}}$ solution to ${V}.0 mL of ${Lab.sig(Mc, 3)} M $\\ce{${m.A.formula}}$. What mass of $\\ce{${solidTerm.f}}$ forms? Assume all of it falls out.`,
            answer: mass,
            unit: 'g',
            tol: 0.02,
            hint: 'Volume in liters times molarity gives moles. Then use the coefficients in the balanced equation.',
            steps: [
              `Balanced equation: ${Sol().eqTex(m.molecular)}.`,
              `Moles of $\\ce{${m.A.formula}}$: $${(V / 1000).toFixed(4)}\\text{ L} \\times ${Lab.sig(Mc, 3)}\\text{ mol/L} = ${Lab.sig(molA, 3).replace(/ × /, ' \\times ')}\\text{ mol}$.`,
              `Mole ratio: $${Lab.sig(molA, 3)} \\times \\dfrac{${nS}\\text{ mol solid}}{${nA}\\text{ mol reagent}} = ${Lab.sig(molS, 3)}\\text{ mol}$.`,
              `Molar mass of $\\ce{${solidTerm.f}}$ is ${FW.toFixed(2)} g/mol.`,
              `Mass: $${Lab.sig(molS, 3)}\\text{ mol} \\times ${FW.toFixed(2)}\\text{ g/mol} = ${Lab.sig(mass, 3)}\\text{ g}$.`,
            ],
          };
        },
      },
      {
        id: 'mass-limiting',
        title: 'Exam style: which reagent runs out?',
        make(r) {
          const m = r.pick(cleanPairs(['precip']));
          const solidTerm = m.molecular.right.find((t) => t.phase === 's');
          const nA = m.molecular.left[0].n, nB = m.molecular.left[1].n, nS = solidTerm.n;
          let Va, Vb, Ma, Mb, molA, molB, guard = 0;
          do {
            Va = r.pick([20, 25, 30, 40, 50]); Vb = r.pick([20, 25, 30, 40, 50]);
            Ma = r.pick([0.1, 0.15, 0.2, 0.25]); Mb = r.pick([0.1, 0.15, 0.2, 0.25]);
            molA = (Va / 1000) * Ma; molB = (Vb / 1000) * Mb;
            guard++;
          } while (Math.abs(molA / nA - molB / nB) / Math.max(molA / nA, molB / nB) < 0.08 && guard < 30);
          const limitA = molA / nA < molB / nB;
          const lim = limitA ? m.A.formula : m.B.formula;
          const molS = limitA ? (molA * nS) / nA : (molB * nS) / nB;
          const FW = Bank.molarMass(solidTerm.f);
          const mass = molS * FW;
          const fmt = (x) => Lab.sig(x, 3).replace(/ × /, ' \\times ').replace(/10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/, (_, e) => `10^{${e.replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => '-0123456789'['⁻⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)])}}`);
          return {
            q: `${Va}.0 mL of ${Ma.toFixed(3)} M $\\ce{${m.A.formula}}$ is mixed with ${Vb}.0 mL of ${Mb.toFixed(3)} M $\\ce{${m.B.formula}}$. What mass of $\\ce{${solidTerm.f}}$ forms? Assume all of it falls out.`,
            answer: mass,
            unit: 'g',
            tol: 0.02,
            hint: 'Find moles of each reagent. Divide each by its coefficient. The smaller answer runs out first.',
            steps: [
              `Balanced equation: ${Sol().eqTex(m.molecular)}.`,
              `Moles of $\\ce{${m.A.formula}}$: $${fmt(molA)}$ mol. Moles of $\\ce{${m.B.formula}}$: $${fmt(molB)}$ mol.`,
              `Divide by the coefficients: $${fmt(molA)} \\div ${nA} = ${fmt(molA / nA)}$ and $${fmt(molB)} \\div ${nB} = ${fmt(molB / nB)}$.`,
              `The smaller one is $\\ce{${lim}}$, so it runs out first.`,
              `Moles of solid: $${fmt(molS)}$ mol. Mass: $${fmt(molS)} \\times ${FW.toFixed(2)} = ${fmt(mass)}$ g.`,
            ],
          };
        },
      },
    ],

    cards: [
      { front: 'What are the three ways to write a precipitation reaction?', back: 'Molecular (whole compounds), complete ionic (dissolved compounds split into ions), net ionic (spectators removed).' },
      { front: 'What is a spectator ion?', back: 'An ion that stays dissolved and unchanged, on both sides of the complete ionic equation.' },
      { front: 'What do you split in a complete ionic equation?', back: 'Strong electrolytes that are dissolved: soluble ionic compounds, strong acids, strong bases.' },
      { front: 'What do you never split?', back: 'Solids, liquids, gases, weak acids, weak bases, and molecular compounds like sugar.' },
      { front: 'What must a net ionic equation balance?', back: 'Both atoms and total charge.' },
      { front: 'How do you predict a precipitate?', back: 'Swap the partners of the two compounds, then check each new pair with the solubility rules.' },
      { front: 'Net ionic for silver nitrate plus sodium chloride?', back: '$\\ce{Ag+(aq) + Cl^-(aq) -> AgCl(s)}$' },
      { front: 'Net ionic for lead(II) nitrate plus potassium iodide?', back: '$\\ce{Pb^2+(aq) + 2I^-(aq) -> PbI2(s)}$, a bright yellow solid.' },
    ],

    terms: [
      { term: 'Precipitation reaction', def: 'A reaction in which mixing two solutions forms an insoluble solid.' },
      { term: 'Molecular equation', def: 'An equation that writes every compound as a whole formula, even if it is dissolved as ions.' },
      { term: 'Complete ionic equation', def: 'An equation that writes every dissolved strong electrolyte as separate ions.' },
      { term: 'Net ionic equation', def: 'A complete ionic equation with the spectator ions removed. It shows only what actually changes.' },
      { term: 'Spectator ion', def: 'An ion that is present but unchanged, appearing the same on both sides of a complete ionic equation.' },
      { term: 'Strong electrolyte', def: 'A substance that splits completely into ions in water.' },
      { term: 'Double displacement', def: 'A reaction in which two compounds swap partners: AB + CD gives AD + CB.' },
    ],
  });
})();
