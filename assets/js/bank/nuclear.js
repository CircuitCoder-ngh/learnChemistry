/* Question bank for 17 Nuclear chemistry. */
(function () {
  const symOf = (z) => (z >= 1 ? ELEMENTS[z - 1].sym : null);
  const nameOf = (z) => ELEMENTS[z - 1].name.toLowerCase();
  const nuc = (A, Z, sym) => `\\ce{^{${A}}_{${Z}}${sym}}`;
  const nz = (A, Z) => nuc(A, Z, symOf(Z));
  const ALPHA = '\\ce{^{4}_{2}He}', BETA = '\\ce{^{0}_{-1}e}', POS = '\\ce{^{0}_{+1}e}', GAMMA = '\\ce{^{0}_{0}\\gamma}';

  /* Nuclei with real, well-known main decays. */
  const REAL = [
    { A: 238, Z: 92, mode: 'alpha' }, { A: 226, Z: 88, mode: 'alpha' }, { A: 222, Z: 86, mode: 'alpha' }, { A: 210, Z: 84, mode: 'alpha' },
    { A: 241, Z: 95, mode: 'alpha' }, { A: 234, Z: 92, mode: 'alpha' }, { A: 230, Z: 90, mode: 'alpha' },
    { A: 14, Z: 6, mode: 'beta' }, { A: 3, Z: 1, mode: 'beta' }, { A: 60, Z: 27, mode: 'beta' }, { A: 90, Z: 38, mode: 'beta' },
    { A: 131, Z: 53, mode: 'beta' }, { A: 137, Z: 55, mode: 'beta' }, { A: 32, Z: 15, mode: 'beta' }, { A: 234, Z: 90, mode: 'beta' },
    { A: 18, Z: 9, mode: 'positron' }, { A: 11, Z: 6, mode: 'positron' }, { A: 13, Z: 7, mode: 'positron' }, { A: 15, Z: 8, mode: 'positron' },
  ];
  const MODE = {
    alpha: { dA: -4, dZ: -2, tex: ALPHA, name: 'alpha decay', A: 4, Z: 2, particle: 'an alpha particle' },
    beta: { dA: 0, dZ: 1, tex: BETA, name: 'beta decay', A: 0, Z: -1, particle: 'a beta particle' },
    positron: { dA: 0, dZ: -1, tex: POS, name: 'positron emission', A: 0, Z: 1, particle: 'a positron' },
  };
  const sciTex = (x, sf = 3) => {
    const e = Math.floor(Math.log10(Math.abs(x)));
    return `${(x / Math.pow(10, e)).toFixed(sf - 1)} \\times 10^{${e}}`;
  };

  Bank.add('nuclear', {
    quiz: [
      {
        q: 'How is a nuclear reaction different from a chemical reaction?',
        options: ['Only a nuclear reaction can change one element into another', 'Only a chemical reaction releases energy', 'Nuclear reactions only rearrange electrons', 'Chemical reactions change the number of protons'],
        answer: 0,
        why: 'Chemical reactions rearrange electrons and leave every nucleus alone. Nuclear reactions change the nucleus, so the element can change.',
      },
      {
        q: 'What is the product when $\\ce{^{226}_{88}Ra}$ gives off an alpha particle?',
        options: ['$\\ce{^{222}_{86}Rn}$', '$\\ce{^{226}_{89}Ac}$', '$\\ce{^{222}_{88}Ra}$', '$\\ce{^{230}_{90}Th}$'],
        answer: 0,
        why: 'An alpha particle takes 4 from the top and 2 from the bottom: 226 becomes 222, and 88 becomes 86, which is radon. Choosing thorium means you added them.',
      },
      {
        q: 'In beta decay, what happens inside the nucleus?',
        options: ['A neutron becomes a proton, and an electron is shot out', 'A proton becomes a neutron, and an electron is shot out', 'An electron from the outer shell falls in', 'Two protons and two neutrons leave together'],
        answer: 0,
        why: 'A neutron turns into a proton plus an electron. $A$ stays the same and $Z$ rises by 1.',
      },
      {
        q: 'Which is the most penetrating?',
        options: ['Alpha particles', 'Beta particles', 'Gamma rays', 'All three are the same'],
        answer: 2,
        why: 'Alpha is stopped by paper, beta by a few millimeters of aluminum or plastic, and gamma needs thick lead or concrete.',
      },
      {
        q: 'A person breathes in radon gas, an alpha emitter. Why is that a serious hazard?',
        options: ['Alpha particles deposit all their energy in a small region of lung tissue', 'Alpha particles pass straight through the lungs and the body', 'Radon reacts chemically with oxygen in the blood', 'It is not a hazard, because paper stops alpha particles'],
        answer: 0,
        why: 'Skin shields you from alpha outside the body, but nothing shields the lung from the inside. All that energy lands in a tiny volume of living cells.',
      },
      {
        q: 'A sample has a half-life of 10 days. How much is left after 20 days?',
        options: ['None of it', 'One half', 'One quarter', 'One eighth'],
        answer: 2,
        why: 'Twenty days is 2 half-lives, so $\\tfrac{1}{2} \\times \\tfrac{1}{2} = \\tfrac{1}{4}$ is left. Each half-life halves what remains, not the original amount.',
      },
      {
        q: 'A radioactive nucleus has survived for 3 half-lives. What is the chance it decays in the next half-life?',
        options: ['50 percent', '12.5 percent', '87.5 percent', '100 percent, since it is overdue'],
        answer: 0,
        why: 'A nucleus has no memory. It always has a 50 percent chance per half-life, however old it is.',
      },
      {
        q: 'A nucleus lies above the band of stability, with too many neutrons. What kind of decay do you predict?',
        options: ['Beta decay', 'Positron emission', 'Electron capture', 'Fusion'],
        answer: 0,
        why: 'Beta decay turns a neutron into a proton, which lowers the neutron-to-proton ratio and moves it toward the band.',
      },
      {
        q: 'Why do both fission of uranium and fusion of hydrogen release energy?',
        options: ['Both give products with more binding energy per nucleon', 'Both destroy protons', 'Both are chemical reactions with oxygen', 'Both need no starting energy at all'],
        answer: 0,
        why: 'Binding energy per nucleon peaks near iron. Moving toward that peak from either side releases energy, and the products end up slightly lighter.',
      },
    ],

    gens: [
      {
        id: 'product',
        title: 'Find the product',
        make(r) {
          const d = r.pick(REAL), m = MODE[d.mode];
          const A2 = d.A + m.dA, Z2 = d.Z + m.dZ;
          const cand = [[d.A - 4, d.Z - 2], [d.A, d.Z + 1], [d.A, d.Z - 1], [d.A + 4, d.Z + 2], [d.A - 4, d.Z], [d.A - 2, d.Z - 1]]
            .filter(([a, z]) => z >= 1 && a >= z && !(a === A2 && z === Z2));
          const chosen = r.mc(`$${nz(A2, Z2)}$`, cand.slice(0, 5).map(([a, z]) => `$${nz(a, z)}$`));
          return {
            q: `$${nz(d.A, d.Z)}$ undergoes ${m.name}. What is the product?`,
            ...chosen,
            steps: [
              `${m.name[0].toUpperCase() + m.name.slice(1)} gives off $${m.tex}$, so write $${nz(d.A, d.Z)}$ on the left, then the product and $${m.tex}$ on the right.`,
              `Top numbers: $${d.A} = A + ${m.A}$, so $A = ${A2}$.`,
              `Bottom numbers: $${d.Z} = Z + (${m.Z})$, so $Z = ${Z2}$.`,
              `Element ${Z2} is ${nameOf(Z2)}, so the product is $${nz(A2, Z2)}$.`,
            ],
          };
        },
      },
      {
        id: 'blank',
        title: 'Name the missing particle',
        make(r) {
          const d = r.pick(REAL), m = MODE[d.mode];
          const A2 = d.A + m.dA, Z2 = d.Z + m.dZ;
          const opts = [`alpha particle, $${ALPHA}$`, `beta particle, $${BETA}$`, `positron, $${POS}$`, `gamma ray, $${GAMMA}$`];
          const right = d.mode === 'alpha' ? opts[0] : d.mode === 'beta' ? opts[1] : opts[2];
          const chosen = r.mc(right, opts.filter((o) => o !== right));
          return {
            q: `What is the missing particle? $${nz(d.A, d.Z)} \\rightarrow ${nz(A2, Z2)} + \\text{?}$`,
            ...chosen,
            steps: [
              `Top numbers: $${d.A} = ${A2} + A$, so $A = ${m.A}$.`,
              `Bottom numbers: $${d.Z} = ${Z2} + Z$, so $Z = ${d.Z} - ${Z2} = ${m.Z}$.`,
              `A particle with $A = ${m.A}$ and $Z = ${m.Z}$ is ${m.particle}, $${m.tex}$.`,
            ],
          };
        },
      },
      {
        id: 'chain',
        title: 'Decay chains',
        make(r) {
          const starts = [[238, 92], [235, 92], [232, 90], [226, 88], [222, 86], [241, 95]];
          const [A0, Z0] = r.pick(starts);
          const alphas = r.int(1, 4), betas = r.int(1, 3);
          const askA = r.next() < 0.5;
          const A = A0 - 4 * alphas, Z = Z0 - 2 * alphas + betas;
          return {
            q: `$${nz(A0, Z0)}$ gives off ${alphas} alpha particle${alphas > 1 ? 's' : ''} and ${betas} beta particle${betas > 1 ? 's' : ''}. What is the ${askA ? 'mass number' : 'atomic number'} of the final nucleus?`,
            answer: askA ? A : Z, tol: 0, answerText: String(askA ? A : Z),
            hint: 'Each alpha is $A - 4$ and $Z - 2$. Each beta is $Z + 1$ with no change in $A$.',
            steps: [
              `Mass number: only alphas change it. $${A0} - 4(${alphas}) = ${A}$.`,
              `Atomic number: $${Z0} - 2(${alphas}) + 1(${betas}) = ${Z}$.`,
              `The final nucleus is $${nz(A, Z)}$, which is ${nameOf(Z)}-${A}. The ${askA ? 'mass number' : 'atomic number'} is ${askA ? A : Z}.`,
            ],
          };
        },
      },
      {
        id: 'predict',
        title: 'Predict the decay',
        make(r) {
          const set = [
            { A: 14, Z: 6, side: 'beta' }, { A: 3, Z: 1, side: 'beta' }, { A: 24, Z: 11, side: 'beta' }, { A: 60, Z: 27, side: 'beta' }, { A: 90, Z: 38, side: 'beta' }, { A: 131, Z: 53, side: 'beta' }, { A: 137, Z: 55, side: 'beta' },
            { A: 11, Z: 6, side: 'pos' }, { A: 18, Z: 9, side: 'pos' }, { A: 13, Z: 7, side: 'pos' }, { A: 15, Z: 8, side: 'pos' }, { A: 22, Z: 11, side: 'pos' },
            { A: 238, Z: 92, side: 'alpha' }, { A: 226, Z: 88, side: 'alpha' }, { A: 210, Z: 84, side: 'alpha' }, { A: 241, Z: 95, side: 'alpha' },
          ];
          const d = r.pick(set);
          const N = d.A - d.Z;
          const right = d.side === 'beta' ? 'Beta decay' : d.side === 'pos' ? 'Positron emission or electron capture' : 'Alpha decay';
          const chosen = r.mc(right, ['Beta decay', 'Positron emission or electron capture', 'Alpha decay', 'Gamma emission only'].filter((c) => c !== right));
          const why = d.side === 'beta'
            ? 'It has too many neutrons for its size, so it lies above the band. Beta decay turns a neutron into a proton.'
            : d.side === 'pos'
              ? 'It has too few neutrons for its size, so it lies below the band. Positron emission or electron capture turns a proton into a neutron.'
              : 'It is heavier than bismuth ($Z = 83$), and every nucleus past there is unstable. Alpha decay removes the most mass.';
          return {
            q: `Which decay do you predict for $${nz(d.A, d.Z)}$?`,
            ...chosen,
            steps: [
              `Count: $Z = ${d.Z}$ protons and $N = ${d.A} - ${d.Z} = ${N}$ neutrons, so $N/Z = ${(N / d.Z).toFixed(2)}$.`,
              why,
            ],
          };
        },
      },
      {
        id: 'hl-left',
        title: 'Amount left, whole half-lives',
        make(r) {
          const iso = r.pick([['iodine-131', 8.02, 'days'], ['carbon-11', 20.4, 'minutes'], ['fluorine-18', 110, 'minutes'], ['technetium-99m', 6.0, 'hours'], ['phosphorus-32', 14.3, 'days'], ['cobalt-60', 5.27, 'years']]);
          const [name, hl, unit] = iso;
          const n = r.int(2, 6), start = r.pick([16, 20, 40, 64, 80, 96, 120, 160, 200, 320]);
          const t = +(hl * n).toFixed(2), left = start * Math.pow(0.5, n);
          return {
            q: `The half-life of ${name} is ${hl} ${unit}. A sample starts with ${start} mg. How many milligrams are left after ${t} ${unit}?`,
            answer: left, unit: 'mg', tol: 0.01,
            hint: 'First count how many half-lives that is. Then halve the sample that many times.',
            steps: [
              `Number of half-lives: $${t} \\div ${hl} = ${n}$.`,
              `Amount left: $${start} \\times \\left(\\tfrac{1}{2}\\right)^{${n}} = ${start} \\times ${Math.pow(0.5, n)} = ${Lab.sig(left, 3)}$ mg.`,
            ],
          };
        },
      },
      {
        id: 'hl-age',
        title: 'How old is it?',
        make(r) {
          const n = r.int(1, 5);
          const pct = 100 * Math.pow(0.5, n);
          const age = n * 5730;
          return {
            q: `A wooden tool has ${pct}% of the carbon-14 of living wood. The half-life of carbon-14 is 5730 years. How old is the tool?`,
            answer: age, unit: 'years', tol: 0.01, answerText: age.toLocaleString('en-US'),
            hint: 'How many times do you halve 100% to reach that percentage?',
            steps: [
              `Halving from 100%: ${Array.from({ length: n + 1 }, (_, i) => 100 * Math.pow(0.5, i) + '%').join(', then ')}.`,
              `That is ${n} half-li${n > 1 ? 'ves' : 'fe'}.`,
              `Age: $${n} \\times 5730 = ${age}$ years.`,
            ],
          };
        },
      },
      {
        id: 'hl-formula',
        title: 'Half-life with the formula',
        make(r) {
          const name = r.pick([['iodine-131', 8.02, 'days'], ['cobalt-60', 5.27, 'years'], ['strontium-90', 28.8, 'years'], ['carbon-14', 5730, 'years'], ['tritium', 12.3, 'years']]);
          const [iso, hl, unit] = name;
          const askAge = r.next() < 0.5;
          if (askAge) {
            const pct = r.int(11, 89);
            const f = pct / 100, t = hl * Math.log(f) / Math.log(0.5);
            return {
              q: `A sample of ${iso} ($t_{1/2} = ${hl}$ ${unit}) has ${pct}% of its original amount left. How long has it been decaying?`,
              answer: t, unit, tol: 0.02,
              hint: 'Use $t = t_{1/2} \\times \\dfrac{\\log(N/N_0)}{\\log(0.5)}$.',
              steps: [
                `Fraction left: $N/N_0 = ${f.toFixed(2)}$.`,
                `Take logs: $\\log(${f.toFixed(2)}) = \\dfrac{t}{${hl}} \\log(0.5)$.`,
                `Solve: $t = ${hl} \\times \\dfrac{${Math.log10(f).toFixed(4)}}{${Math.log10(0.5).toFixed(4)}} = ${Lab.sig(t, 3)}$ ${unit}.`,
              ],
            };
          }
          const N0 = r.int(20, 500), frac = r.num(0.3, 3.7, 2);
          const t = +(hl * frac).toPrecision(3), N = N0 * Math.pow(0.5, t / hl);
          return {
            q: `A sample of ${iso} ($t_{1/2} = ${hl}$ ${unit}) starts with ${N0} mg. How many milligrams are left after ${t} ${unit}?`,
            answer: N, unit: 'mg', tol: 0.02,
            hint: 'Use $N = N_0(\\tfrac{1}{2})^{t/t_{1/2}}$. Work out the exponent first.',
            steps: [
              `Exponent: $t/t_{1/2} = ${t} \\div ${hl} = ${(t / hl).toFixed(3)}$.`,
              `$N = ${N0} \\times (0.5)^{${(t / hl).toFixed(3)}} = ${N0} \\times ${Math.pow(0.5, t / hl).toFixed(4)} = ${Lab.sig(N, 3)}$ mg.`,
            ],
          };
        },
      },
      {
        id: 'mass-defect',
        title: 'Mass defect and energy',
        make(r) {
          const d = r.pick([
            { name: 'helium-4', A: 4, Z: 2, m: 4.00151 }, { name: 'lithium-7', A: 7, Z: 3, m: 7.01436 }, { name: 'carbon-12', A: 12, Z: 6, m: 11.99671 },
            { name: 'oxygen-16', A: 16, Z: 8, m: 15.99053 }, { name: 'iron-56', A: 56, Z: 26, m: 55.92067 }, { name: 'deuterium (hydrogen-2)', A: 2, Z: 1, m: 2.01355 },
          ]);
          const N = d.A - d.Z, parts = d.Z * 1.00728 + N * 1.00866, dm = parts - d.m, kg = dm * 1.6605e-27, E = kg * 9e16;
          return {
            q: `A ${d.name} nucleus has a mass of ${d.m.toFixed(5)} u. A proton is 1.00728 u and a neutron is 1.00866 u. Find the energy released in forming one nucleus from its parts, in joules. Use 1 u = $1.6605 \\times 10^{-27}$ kg and $c = 3.00 \\times 10^8$ m/s.`,
            answer: E, unit: 'J', tol: 0.03,
            hint: 'Find the mass of the parts, subtract the real nucleus, convert to kg, and then use $E = mc^2$.',
            steps: [
              `Parts: $${d.Z}(1.00728) + ${N}(1.00866) = ${parts.toFixed(5)}$ u.`,
              `Mass defect: $${parts.toFixed(5)} - ${d.m.toFixed(5)} = ${dm.toFixed(5)}$ u.`,
              `In kg: $${dm.toFixed(5)} \\times 1.6605 \\times 10^{-27} = ${sciTex(kg, 4)}$ kg.`,
              `$E = mc^2 = (${sciTex(kg, 4)})(3.00 \\times 10^{8})^2 = ${sciTex(E, 3)}$ J.`,
            ],
          };
        },
      },
    ],

    cards: [
      { front: 'What does alpha decay do to $A$ and $Z$?', back: '$A$ falls by 4 and $Z$ falls by 2. The particle is $\\ce{^{4}_{2}He}$.' },
      { front: 'What does beta decay do to $A$ and $Z$?', back: '$A$ stays the same and $Z$ rises by 1. A neutron becomes a proton. The particle is $\\ce{^{0}_{-1}e}$.' },
      { front: 'What do positron emission and electron capture do to $Z$?', back: 'Both lower $Z$ by 1 and leave $A$ alone. A proton becomes a neutron.' },
      { front: 'What does gamma emission change?', back: 'Neither $A$ nor $Z$. An excited nucleus gives off energy as a high-energy photon.' },
      { front: 'What is a half-life?', back: 'The time for half of the nuclei present to decay. It does not depend on how much you have.' },
      { front: 'What fraction is left after 3 half-lives?', back: '$(\\tfrac{1}{2})^3 = \\tfrac{1}{8}$, or 12.5%.' },
      { front: 'Rank alpha, beta and gamma by penetrating power.', back: 'Gamma is most penetrating, then beta, then alpha. Paper stops alpha, but alpha sources are very dangerous inside the body.' },
      { front: 'What is mass defect?', back: 'The difference between the mass of the separate protons and neutrons and the mass of the nucleus. It becomes binding energy by $E = mc^2$.' },
      { front: 'Fission or fusion: which joins nuclei?', back: 'Fusion joins light nuclei. Fission splits heavy nuclei. Both move toward iron and release energy.' },
    ],

    terms: [
      { term: 'Radioactive decay', def: 'An unstable nucleus changing by itself, giving off particles or energy.' },
      { term: 'Mass number', def: 'The number of protons plus neutrons in a nucleus. Symbol $A$.' },
      { term: 'Nuclide', def: 'One specific nucleus with a set number of protons and neutrons, such as carbon-14.' },
      { term: 'Alpha particle', def: 'A helium nucleus, $\\ce{^{4}_{2}He}$: 2 protons and 2 neutrons.' },
      { term: 'Beta particle', def: 'An electron made in the nucleus when a neutron becomes a proton, $\\ce{^{0}_{-1}e}$.' },
      { term: 'Positron', def: 'A particle like an electron with a positive charge, $\\ce{^{0}_{+1}e}$.' },
      { term: 'Electron capture', def: 'A nucleus pulls in one of its own inner electrons, turning a proton into a neutron.' },
      { term: 'Gamma ray', def: 'A very high-energy photon given off by an excited nucleus.' },
      { term: 'Half-life', def: 'The time for half of the nuclei in a sample to decay. Symbol $t_{1/2}$.' },
      { term: 'Band of stability', def: 'The narrow strip of stable nuclei on a plot of neutrons against protons.' },
      { term: 'Ionizing radiation', def: 'Radiation with enough energy to knock electrons off atoms, which can damage living cells.' },
      { term: 'Mass defect', def: 'How much less a nucleus weighs than its separate protons and neutrons.' },
      { term: 'Binding energy', def: 'The energy needed to pull a nucleus apart into separate protons and neutrons.' },
      { term: 'Fission', def: 'A heavy nucleus splitting into two lighter ones, releasing energy and neutrons.' },
      { term: 'Fusion', def: 'Light nuclei joining to make a heavier one, releasing energy.' },
      { term: 'Chain reaction', def: 'A reaction where neutrons from one fission go on to cause more fissions.' },
      { term: 'Critical mass', def: 'The smallest amount of fissionable material that can sustain a chain reaction.' },
    ],
  });
})();
