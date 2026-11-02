/* Question bank for 8.1 Ionic bonds, plus IonicKit: ion charges, formulas and lattice energy comparisons. */
(function () {
  'use strict';
  const Kit = (window.IonicKit = {});
  /* Ionic radii in pm (Shannon, six-coordinate). Metal charge from its group, nonmetal charge from 8 minus its valence. */
  Kit.RADII = { Li: 76, Na: 102, K: 138, Rb: 152, Mg: 72, Ca: 100, Sr: 118, Ba: 135, Al: 54, F: 133, Cl: 181, Br: 196, I: 220, O: 140, S: 184, N: 146 };
  const val = (e) => { const g = window.EL[e].group; return g <= 2 ? g : g - 10; };
  Kit.gives = (m) => val(m);
  Kit.takes = (x) => 8 - val(x);
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  /** Smallest whole-number ratio of ions: charges must add to zero. */
  Kit.compound = function (m, x) {
    const q = Kit.gives(m), p = Kit.takes(x), l = (q * p) / gcd(q, p);
    const nM = l / q, nX = l / p;
    const f = m + (nM > 1 ? nM : '') + x + (nX > 1 ? nX : '');
    return { m, x, q, p, nM, nX, f, moved: l };
  };
  /* Lattice energies in kJ/mol, typical textbook values rounded to 10. Sources differ by a percent or so. */
  Kit.SALTS = [
    ['LiF', 'Li', 'F', 1040], ['LiCl', 'Li', 'Cl', 850], ['LiBr', 'Li', 'Br', 810], ['LiI', 'Li', 'I', 760],
    ['NaF', 'Na', 'F', 920], ['NaCl', 'Na', 'Cl', 790], ['NaBr', 'Na', 'Br', 750], ['NaI', 'Na', 'I', 700],
    ['KF', 'K', 'F', 820], ['KCl', 'K', 'Cl', 720], ['KBr', 'K', 'Br', 680], ['KI', 'K', 'I', 650],
    ['MgO', 'Mg', 'O', 3800], ['CaO', 'Ca', 'O', 3400], ['SrO', 'Sr', 'O', 3220], ['BaO', 'Ba', 'O', 3030],
    ['MgF2', 'Mg', 'F', 2960], ['CaF2', 'Ca', 'F', 2630], ['MgCl2', 'Mg', 'Cl', 2530], ['CaCl2', 'Ca', 'Cl', 2260],
  ].map(([f, m, x, U]) => {
    const q = Kit.gives(m), p = Kit.takes(x), r = Kit.RADII[m] + Kit.RADII[x];
    return { f, m, x, U, q, p, r, score: (q * p) / r };
  });
  Kit.salt = (f) => Kit.SALTS.find((s) => s.f === f);
  /** Pairs where Coulomb's law gives a clear call and the data agree with it. */
  Kit.duels = function () {
    if (Kit._duels) return Kit._duels;
    const out = [];
    Kit.SALTS.forEach((a, i) => Kit.SALTS.forEach((b, j) => {
      if (j <= i) return;
      const predA = a.score > b.score, realA = a.U > b.U;
      if (predA === realA && Math.abs(a.score - b.score) / Math.max(a.score, b.score) > 0.04 && Math.abs(a.U - b.U) >= 30) out.push([a, b]);
    }));
    return (Kit._duels = out);
  };
  /** Plain words for why one salt beats another. */
  Kit.reason = function (a, b) {
    const w = a.score > b.score ? a : b, l = w === a ? b : a;
    const qw = w.q * w.p, ql = l.q * l.p;
    if (qw !== ql) return `Charges win first: ${w.f} has a charge product of ${w.q} × ${w.p} = ${qw}, and ${l.f} has only ${l.q} × ${l.p} = ${ql}.`;
    return `The charge products tie at ${qw}. So size decides: the ions in ${w.f} sit ${w.r} pm apart, closer than the ${l.r} pm in ${l.f}.`;
  };

  /* ---------- Question bank ---------- */
  const METALS = ['Li', 'Na', 'K', 'Mg', 'Ca', 'Al'];
  const NON = ['F', 'Cl', 'Br', 'O', 'S', 'N'];
  const name = (e) => window.EL[e].name.toLowerCase();
  const supOf = (n, s) => `${n > 1 ? n : ''}${s}`;

  Bank.add('ionic', {
    quiz: [
      {
        q: 'What happens to the electrons in an ionic bond between sodium and chlorine?',
        options: ['They are shared equally', 'Sodium gives one electron to chlorine', 'Chlorine gives one electron to sodium', 'Both atoms lose an electron'],
        answer: 1,
        why: 'Metals have a weak grip on their outer electrons. Sodium loses one and chlorine gains it, making $\\ce{Na+}$ and $\\ce{Cl-}$.',
      },
      {
        q: 'Which ion is bigger than the atom it came from?',
        options: ['$\\ce{Na+}$', '$\\ce{Mg^{2+}}$', '$\\ce{Cl-}$', '$\\ce{Al^{3+}}$'],
        answer: 2,
        why: 'Anions gain electrons, which repel each other and spread out with the same number of protons. Cations lose their whole outer shell and shrink.',
      },
      {
        q: 'Which statement about solid sodium chloride is correct?',
        options: ['It is made of separate NaCl molecules', 'Each $\\ce{Na+}$ is surrounded by 6 $\\ce{Cl-}$ in a repeating lattice', 'Each $\\ce{Na+}$ is bonded to just one $\\ce{Cl-}$', 'The ions are free to move around'],
        answer: 1,
        why: 'There is no NaCl molecule. "NaCl" is the 1 to 1 ratio, called a formula unit. Every ion attracts all of its neighbors in the lattice.',
      },
      {
        q: 'Which has the largest lattice energy?',
        options: ['$\\ce{NaCl}$', '$\\ce{KCl}$', '$\\ce{MgO}$', '$\\ce{NaBr}$'],
        answer: 2,
        why: 'Look at charge first. $\\ce{MgO}$ has $2+$ and $2-$ ions, so its charge product is 4, against 1 for the others. It is also made of small ions.',
      },
      {
        q: 'According to Coulomb\'s law, what happens to the attraction between two ions when the distance between them doubles?',
        options: ['It doubles', 'It halves', 'It drops to one quarter', 'It stays the same'],
        answer: 2,
        why: 'Force goes as $1/r^2$, so doubling $r$ divides the force by $2^2 = 4$. The energy goes as $1/r$, so it would halve.',
      },
      {
        q: 'Why does an ionic crystal shatter when you hit it hard?',
        options: ['The ions are weakly attracted to each other', 'A shift lines up like charges, which then repel', 'The hammer breaks the covalent bonds', 'Electrons fly out of the crystal'],
        answer: 1,
        why: 'Slide one layer by one ion and positive faces positive, negative faces negative. That repulsion splits the crystal along the plane.',
      },
      {
        q: 'Solid NaCl does not conduct electricity, but molten NaCl does. Why?',
        options: ['Melting frees electrons from the ions', 'Melting lets the ions move and carry charge', 'Solid NaCl has no charged particles', 'Molten NaCl turns into metal'],
        answer: 1,
        why: 'The ions are always there, but in a solid they are locked in place. Current in a melt or solution is carried by moving ions, not free electrons.',
      },
      {
        q: 'Transferring an electron from Na to Cl in the gas phase costs energy. So why does NaCl form so readily?',
        options: ['The octet rule forces it to', 'The lattice energy released more than pays for it', 'Chlorine has a very high ionization energy', 'Sodium gains energy by losing electrons'],
        answer: 1,
        why: 'Ionizing Na costs 496 kJ/mol and Cl gives back only 349 kJ/mol. The huge energy released as the ions pack into a lattice is what makes the whole process favorable.',
      },
    ],

    gens: [
      {
        id: 'formula',
        title: 'Write the ionic formula',
        make(r) {
          const c = Kit.compound(r.pick(METALS), r.pick(NON));
          return {
            q: `Write the formula of the ionic compound made from ${name(c.m)} and ${name(c.x)}.`,
            accept: [c.f],
            placeholder: 'for example MgCl2',
            steps: [
              `${c.m} is a metal in group ${window.EL[c.m].group}, so it gives up ${c.q} electron${c.q > 1 ? 's' : ''} and becomes $\\ce{${c.m}^{${supOf(c.q, '+')}}}$.`,
              `${c.x} has ${8 - c.p} valence electrons, so it takes ${c.p} and becomes $\\ce{${c.x}^{${supOf(c.p, '-')}}}$.`,
              `Charges must add to zero: ${c.nM} × (+${c.q}) + ${c.nX} × (−${c.p}) = 0.`,
              `The formula is $\\ce{${c.f}}$.`,
            ],
          };
        },
      },
      {
        id: 'moved',
        title: 'Electrons transferred',
        make(r) {
          const c = Kit.compound(r.pick(METALS), r.pick(NON));
          return {
            q: `How many electrons move in making one formula unit of $\\ce{${c.f}}$?`,
            answer: c.moved, tol: 0, answerText: String(c.moved),
            hint: 'Multiply the number of metal atoms by the number of electrons each one gives.',
            steps: [
              `One formula unit holds ${c.nM} ${c.m} atom${c.nM > 1 ? 's' : ''}, each giving ${c.q} electron${c.q > 1 ? 's' : ''}.`,
              `$${c.nM} \\times ${c.q} = ${c.moved}$ electrons, and ${c.nX} × ${c.p} = ${c.moved} are taken. They match.`,
            ],
          };
        },
      },
      {
        id: 'charge',
        title: 'Ion charge from the group',
        make(r) {
          const e = r.pick(METALS.concat(NON));
          const metal = METALS.includes(e);
          const n = metal ? Kit.gives(e) : -Kit.takes(e);
          return {
            q: `What charge does a ${name(e)} ion usually have? Enter a signed number, like +2 or −1.`,
            answer: n, tol: 0, answerText: (n > 0 ? '+' : '−') + Math.abs(n),
            hint: metal ? 'Metals lose their valence electrons.' : 'Nonmetals gain electrons until they reach 8.',
            steps: [
              `${name(e)[0].toUpperCase() + name(e).slice(1)} is in group ${window.EL[e].group}, so it has ${val(e)} valence electron${val(e) > 1 ? 's' : ''}.`,
              metal ? `Losing ${val(e)} leaves it with a full inner shell, and a charge of +${val(e)}.` : `Gaining ${8 - val(e)} completes the octet, and gives a charge of −${8 - val(e)}.`,
            ],
          };
        },
      },
      {
        id: 'lattice',
        title: 'Which has the larger lattice energy?',
        make(r) {
          const [a, b] = r.pick(Kit.duels());
          const flip = r.pick([true, false]);
          const A = flip ? b : a, B = flip ? a : b;
          return {
            q: `Which has the larger lattice energy, $\\ce{${A.f}}$ or $\\ce{${B.f}}$?`,
            choices: [`$\\ce{${A.f}}$`, `$\\ce{${B.f}}$`], answer: A.U > B.U ? 0 : 1,
            steps: [
              `Coulomb's law: lattice energy grows with charge and shrinks with distance. Compare charges first, then sizes.`,
              Kit.reason(A, B),
              `Typical values: ${A.f} about ${A.U} kJ/mol, ${B.f} about ${B.U} kJ/mol.`,
            ],
          };
        },
      },
      {
        id: 'coulomb',
        title: 'Coulomb scaling',
        make(r) {
          const qf = r.pick([2, 3, 4]);
          const rf = r.pick([2, 3, 0.5]);
          const asksForce = r.pick([true, false]);
          const ans = asksForce ? qf / (rf * rf) : qf / rf;
          const texR = rf === 0.5 ? 'halved' : rf === 2 ? 'doubled' : 'tripled';
          return {
            q: `The product of two ions' charges is multiplied by ${qf}, and the distance between them is ${texR}. By what factor does the ${asksForce ? 'attractive force' : 'attraction energy'} change?`,
            answer: ans, tol: 0.02, answerText: Lab.sig(ans, 3),
            hint: asksForce ? 'Force goes as $q_1 q_2 / r^2$.' : 'Energy goes as $q_1 q_2 / r$.',
            steps: [
              asksForce ? 'Use $F \\propto \\dfrac{q_1 q_2}{r^2}$.' : 'Use $E \\propto \\dfrac{q_1 q_2}{r}$.',
              asksForce ? `New over old: $\\dfrac{${qf}}{(${rf})^2} = \\dfrac{${qf}}{${rf * rf}} = ${Lab.sig(ans, 3)}$.` : `New over old: $\\dfrac{${qf}}{${rf}} = ${Lab.sig(ans, 3)}$.`,
            ],
          };
        },
      },
      {
        id: 'size',
        title: 'Which ion is bigger?',
        make(r) {
          const pair = r.pick([['Na', 'Cl'], ['Li', 'F'], ['K', 'Cl'], ['Mg', 'O'], ['Na', 'F'], ['Al', 'O'], ['Na', 'Mg'], ['F', 'Cl'], ['Cl', 'Br'], ['O', 'S'], ['Li', 'Na'], ['Mg', 'Ca']]);
          const lab = (e) => (METALS.includes(e) || ['Ca', 'Mg'].includes(e) ? `\\ce{${e}^{${supOf(Kit.gives(e), '+')}}}` : `\\ce{${e}^{${supOf(Kit.takes(e), '-')}}}`);
          const [a, b] = r.pick([true, false]) ? pair : [pair[1], pair[0]];
          const big = Kit.RADII[a] > Kit.RADII[b] ? 0 : 1;
          return {
            q: `Which ion is larger, $${lab(a)}$ or $${lab(b)}$?`,
            choices: [`$${lab(a)}$`, `$${lab(b)}$`], answer: big,
            steps: [
              `Ionic radii: ${a} ion ${Kit.RADII[a]} pm, ${b} ion ${Kit.RADII[b]} pm.`,
              'Cations lose their outer shell and shrink, anions gain electrons and swell. Within a family, ions get bigger going down the table.',
            ],
          };
        },
      },
    ],

    cards: [
      { front: 'What is an ionic bond?', back: 'The electrostatic attraction between oppositely charged ions, formed when a metal transfers electrons to a nonmetal.' },
      { front: 'Coulomb\'s law', back: '$F \\propto q_1 q_2 / r^2$ and $E \\propto q_1 q_2 / r$. More charge and less distance mean stronger attraction.' },
      { front: 'What is lattice energy?', back: 'The energy released when gas-phase ions come together to form a solid. Some books define it for the reverse, with a positive sign.' },
      { front: 'How do you rank lattice energies?', back: 'Compare the product of the charges first. If it ties, the smaller ions (shorter distance) win.' },
      { front: 'What does the formula NaCl mean?', back: 'A 1 to 1 ratio of ions, called a formula unit. It is not a molecule.' },
      { front: 'Why are ionic solids brittle?', back: 'A shift lines up like charges, and their repulsion splits the crystal.' },
      { front: 'When do ionic compounds conduct?', back: 'When molten or dissolved, because the ions can move. Never as a solid.' },
    ],

    terms: [
      { term: 'Ionic bond', def: 'Attraction between oppositely charged ions.' },
      { term: 'Cation', def: 'A positive ion, formed when an atom loses electrons.' },
      { term: 'Anion', def: 'A negative ion, formed when an atom gains electrons.' },
      { term: 'Lattice', def: 'A regular, repeating 3D arrangement of ions in a crystal.' },
      { term: 'Lattice energy', def: 'The energy released when separated gas-phase ions form one mole of an ionic solid.' },
      { term: "Coulomb's law", def: 'The force between two charges is proportional to the product of the charges and inversely proportional to the square of the distance.' },
      { term: 'Formula unit', def: 'The smallest whole-number ratio of ions in an ionic compound.' },
      { term: 'Brittle', def: 'Breaking suddenly rather than bending, as ionic crystals do.' },
      { term: 'Electrolyte', def: 'A substance whose ions can move and carry current when molten or dissolved.' },
    ],
  });
})();
