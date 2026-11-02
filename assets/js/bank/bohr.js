/* Question bank for 7.2 Line spectra and the Bohr atom. */
(function () {
  'use strict';
  const h = 6.626e-34, c = 2.998e8, NA = 6.022e23, RJ = 2.18e-18, R = 1.097e7, me = 9.109e-31;
  function sci(x, sf = 3) {
    let e = Math.floor(Math.log10(Math.abs(x)));
    let m = ((x * (1 + 1e-12)) / Math.pow(10, e)).toFixed(sf - 1); // The nudge stops float error rounding 1.635 down to 1.63.
    if (+m >= 10) { e += 1; m = (x / Math.pow(10, e)).toFixed(sf - 1); }
    return `${m} \\times 10^{${e}}`;
  }
  const bracket = (lo, hi) => 1 / (lo * lo) - 1 / (hi * hi);
  const lamNm = (lo, hi) => 1e9 / (R * bracket(lo, hi));
  const region = (nm) => (nm < 380 ? 'ultraviolet' : nm <= 750 ? 'visible' : 'infrared');

  Bank.add('bohr', {
    quiz: [
      {
        q: 'Why does a heated element give sharp lines instead of a full rainbow?',
        options: ['Its electrons can only have certain energies, so only certain photon energies can come out', 'The prism blocks most colors', 'Hot atoms can only absorb sharp colors from the flame', 'Each electron has its own fixed color'],
        answer: 0,
        why: 'Only certain levels exist, so only certain energy gaps exist. Each gap gives a photon of one exact wavelength.',
      },
      {
        q: 'In a hydrogen atom, which jump emits a photon with the most energy?',
        options: ['$n = 3$ to $n = 2$', '$n = 4$ to $n = 3$', '$n = 2$ to $n = 1$', '$n = 6$ to $n = 5$'],
        answer: 2,
        why: 'The levels crowd together as $n$ rises, so the gap from 2 to 1 is by far the biggest of these.',
      },
      {
        q: 'An electron moves from $n = 2$ to $n = 5$. What must happen?',
        options: ['The atom emits a photon', 'The atom absorbs a photon', 'The atom loses a proton', 'Nothing, since all levels have the same energy'],
        answer: 1,
        why: 'Moving to a higher level costs energy, so the atom must absorb it. Emission happens on the way down.',
      },
      {
        q: 'Why is the energy of a bound electron written as a negative number?',
        options: ['Electrons have negative charge', 'Energy can never be positive', 'A free electron at rest is defined as zero, and a bound electron has less energy than that', 'Negative means the electron is moving backward'],
        answer: 2,
        why: 'You must add energy to reach zero, the point of breaking free. So a bound electron sits below zero. The negative sign has nothing to do with charge.',
      },
      {
        q: 'Compared with its bright emission lines, the dark absorption lines of an element appear:',
        options: ['At exactly the same wavelengths', 'At slightly shorter wavelengths', 'At slightly longer wavelengths', 'At unrelated wavelengths'],
        answer: 0,
        why: 'The same energy gaps are involved, just crossed in the opposite direction.',
      },
      {
        q: 'What did the Bohr model fail to explain?',
        options: ['The visible lines of hydrogen', 'The ionization energy of hydrogen', 'The spectra of atoms with more than one electron', 'The ultraviolet lines of hydrogen'],
        answer: 2,
        why: 'It works beautifully for hydrogen and other one-electron ions. Add a second electron and its predictions fall apart.',
      },
      {
        q: 'Why do we never notice the wavelength of a moving baseball?',
        options: ['Baseballs do not have a wavelength', 'Its mass is so large that $\\lambda = h/mv$ is unimaginably small', 'It moves too slowly to make any wave', 'Only charged objects have wavelengths'],
        answer: 1,
        why: 'Everything has a de Broglie wavelength. With a large $m$, $h/mv$ comes out around $10^{-34}$ m, far smaller than an atom.',
      },
      {
        q: 'What does the Heisenberg uncertainty principle say?',
        options: ['Electrons have no position at all', 'Scientists have not built good enough tools yet', 'Energy cannot be measured', 'You cannot know both the exact position and exact momentum of a particle at once'],
        answer: 3,
        why: 'It is a limit set by nature, not by poor equipment. Pinning down position more tightly makes momentum less certain.',
      },
    ],

    gens: [
      {
        id: 'level',
        title: 'Energy of a level',
        make(r) {
          const n = r.int(1, 7);
          const E = -RJ / (n * n);
          return {
            q: `What is the energy of a hydrogen electron in level $n = ${n}$? Include the sign.`,
            answer: E, unit: 'J',
            hint: 'Use $E_n = -2.18 \\times 10^{-18}\\text{ J}/n^2$.',
            steps: [
              `$E_{${n}} = -\\dfrac{2.18 \\times 10^{-18}\\text{ J}}{${n}^2} = -\\dfrac{2.18 \\times 10^{-18}\\text{ J}}{${n * n}}$.`,
              `$E_{${n}} = -${sci(-E)}\\text{ J}$. It is negative because the electron is bound.`,
            ],
          };
        },
      },
      {
        id: 'delta-e',
        title: 'Photon energy from a jump',
        make(r) {
          const lo = r.int(1, 4), hi = lo + r.int(1, 4);
          const b = bracket(lo, hi), dE = RJ * b;
          return {
            q: `A hydrogen electron falls from $n = ${hi}$ to $n = ${lo}$. What is the energy of the photon emitted?`,
            answer: dE, unit: 'J',
            hint: 'Use $\\Delta E = 2.18 \\times 10^{-18}\\text{ J}(1/n_{\\text{low}}^2 - 1/n_{\\text{high}}^2)$.',
            steps: [
              `Bracket: $\\dfrac{1}{${lo}^2} - \\dfrac{1}{${hi}^2} = ${(1 / (lo * lo)).toFixed(4)} - ${(1 / (hi * hi)).toFixed(4)} = ${b.toFixed(4)}$.`,
              `$\\Delta E = (2.18 \\times 10^{-18}\\text{ J})(${b.toFixed(4)}) = ${sci(dE)}\\text{ J}$.`,
            ],
          };
        },
      },
      {
        id: 'rydberg',
        title: 'Wavelength of a jump',
        make(r) {
          const lo = r.int(1, 3), hi = lo + r.int(1, 4);
          const b = bracket(lo, hi), inv = R * b, nm = 1e9 / inv;
          return {
            q: `A hydrogen electron falls from $n = ${hi}$ to $n = ${lo}$. What is the wavelength of the light, in nm?`,
            answer: nm, unit: 'nm',
            hint: 'Use the Rydberg equation, and remember to flip at the end.',
            steps: [
              `Bracket: $\\dfrac{1}{${lo}^2} - \\dfrac{1}{${hi}^2} = ${b.toFixed(4)}$.`,
              `$\\dfrac{1}{\\lambda} = (1.097 \\times 10^{7}\\text{ m}^{-1})(${b.toFixed(4)}) = ${sci(inv, 4)}\\text{ m}^{-1}$.`,
              `Flip: $\\lambda = ${sci(1 / inv)}\\text{ m}$.`,
              `Convert: $\\lambda = ${nm.toFixed(0)}\\text{ nm}$, which is ${region(nm)}.`,
            ],
          };
        },
      },
      {
        id: 'frequency-of-jump',
        title: 'Energy to frequency',
        make(r) {
          const hi = r.int(3, 6);
          const dE = RJ * bracket(2, hi), nu = dE / h;
          return {
            q: `A hydrogen electron falls from $n = ${hi}$ to $n = 2$. What is the frequency of the photon?`,
            answer: nu, unit: 'Hz',
            hint: 'Find $\\Delta E$ first. Then $\\nu = \\Delta E/h$.',
            steps: [
              `$\\Delta E = (2.18 \\times 10^{-18}\\text{ J})\\left(\\dfrac{1}{4} - \\dfrac{1}{${hi * hi}}\\right) = ${sci(dE)}\\text{ J}$.`,
              `$\\nu = \\dfrac{\\Delta E}{h} = \\dfrac{${sci(dE)}\\text{ J}}{6.626 \\times 10^{-34}\\text{ J}\\cdot\\text{s}} = ${sci(nu)}\\text{ Hz}$.`,
            ],
          };
        },
      },
      {
        id: 'ionize',
        title: 'Ionization from a level',
        make(r) {
          const n = r.int(1, 4);
          const perAtom = RJ / (n * n), kJ = (perAtom * NA) / 1000;
          return {
            q: `How much energy, in kJ per mole, does it take to remove the electron from hydrogen atoms in level $n = ${n}$?`,
            answer: kJ, unit: 'kJ/mol',
            hint: 'Going to $n = \\infty$ means ending at $E = 0$. Then convert per atom to per mole.',
            steps: [
              `$\\Delta E = 0 - E_{${n}} = \\dfrac{2.18 \\times 10^{-18}\\text{ J}}{${n * n}} = ${sci(perAtom)}\\text{ J}$ per atom.`,
              `Per mole: $${sci(perAtom)}\\text{ J} \\times 6.022 \\times 10^{23}\\text{ mol}^{-1} = ${sci(perAtom * NA)}\\text{ J/mol}$.`,
              `Divide by 1000: $${Lab.sig(kJ, 3)}\\text{ kJ/mol}$.`,
            ],
          };
        },
      },
      {
        id: 'which-region',
        title: 'Which kind of light?',
        make(r) {
          const lo = r.int(1, 3), hi = lo + r.int(1, 3);
          const nm = lamNm(lo, hi), ans = region(nm);
          const opts = ['ultraviolet', 'visible', 'infrared'];
          const mc = r.mc(ans, opts.filter((x) => x !== ans));
          return {
            q: `A hydrogen electron falls from $n = ${hi}$ to $n = ${lo}$. What kind of light comes out?`,
            choices: mc.choices, answer: mc.answer,
            steps: [
              'The final level decides the series: falls to $n = 1$ are ultraviolet, falls to $n = 2$ are visible, and falls to $n = 3$ are infrared.',
              `Here, the Rydberg equation gives $\\lambda = ${nm.toFixed(0)}$ nm, which is ${ans}.`,
            ],
          };
        },
      },
      {
        id: 'emit-absorb',
        title: 'Emit or absorb?',
        make(r) {
          let a = r.int(1, 7), b = r.int(1, 7);
          if (a === b) b = a === 7 ? 1 : a + 1;
          const up = b > a;
          const right = up ? 'Absorbs a photon' : 'Emits a photon';
          const mc = r.mc(right, [up ? 'Emits a photon' : 'Absorbs a photon', 'Neither: no energy changes']);
          return {
            q: `A hydrogen electron moves from $n = ${a}$ to $n = ${b}$. What happens?`,
            choices: mc.choices, answer: mc.answer,
            steps: [
              `Level ${b} is ${up ? 'higher' : 'lower'} in energy than level ${a}.`,
              up ? 'Climbing costs energy, so the atom must absorb a photon. $\\Delta E$ is positive.' : 'Falling releases energy, so the atom emits a photon. $\\Delta E$ is negative.',
            ],
          };
        },
      },
      {
        id: 'longest',
        title: 'Rank the jumps',
        make(r) {
          const all = [[2, 1], [3, 1], [4, 1], [3, 2], [4, 2], [5, 2], [6, 2], [4, 3], [5, 3], [6, 3], [5, 4], [6, 5]];
          const picks = r.shuffle(all).slice(0, 4);
          const longest = r.next() < 0.5;
          const sorted = picks.slice().sort((p, q) => lamNm(p[1], p[0]) - lamNm(q[1], q[0]));
          const best = longest ? sorted[3] : sorted[0];
          const txt = (j) => `$n = ${j[0]}$ to $n = ${j[1]}$`;
          const mc = r.mc(txt(best), picks.filter((j) => j !== best).map(txt));
          return {
            q: `Which of these hydrogen falls emits light with the ${longest ? 'longest' : 'shortest'} wavelength: ${picks.map((j) => `${j[0]} to ${j[1]}`).join(', ')}?`,
            choices: mc.choices, answer: mc.answer,
            steps: [
              'A bigger energy gap means a shorter wavelength, since $\\lambda = hc/\\Delta E$.',
              `Wavelengths: ${sorted.map((j) => `${j[0]} to ${j[1]}: ${lamNm(j[1], j[0]).toFixed(0)} nm`).join('; ')}.`,
              `So the answer is ${txt(best)}.`,
            ],
          };
        },
      },
      {
        id: 'de-broglie',
        title: 'de Broglie wavelength',
        make(r) {
          const kind = r.pick(['electron', 'electron', 'baseball', 'proton']);
          let m, v, name;
          if (kind === 'electron') { m = me; v = r.num(1, 9, 1) * Math.pow(10, r.int(5, 6)); name = `An electron (mass $${sci(me, 4)}$ kg)`; }
          else if (kind === 'proton') { m = 1.673e-27; v = r.num(1, 9, 1) * 1e4; name = 'A proton (mass $1.673 \\times 10^{-27}$ kg)'; }
          else { m = r.pick([0.145, 0.142]); v = r.int(25, 45); name = `A baseball (mass ${m} kg)`; }
          const lam = h / (m * v);
          return {
            q: `${name} moves at $${kind === 'baseball' ? v : sci(v, 2)}$ m/s. What is its de Broglie wavelength in meters?`,
            answer: lam, unit: 'm',
            hint: 'Use $\\lambda = h/mv$, with $m$ in kg and $v$ in m/s.',
            steps: [
              `$mv = (${sci(m, 3)}\\text{ kg})(${sci(v, 2)}\\text{ m/s}) = ${sci(m * v)}\\text{ kg}\\cdot\\text{m/s}$.`,
              `$\\lambda = \\dfrac{h}{mv} = \\dfrac{6.626 \\times 10^{-34}}{${sci(m * v)}} = ${sci(lam)}\\text{ m}$.`,
            ],
          };
        },
      },
    ],

    cards: [
      { front: 'What is a line spectrum?', back: 'A set of sharp wavelengths given off by an element, unique to that element.' },
      { front: 'What is the energy of level $n$ in hydrogen?', back: '$E_n = -2.18 \\times 10^{-18}\\text{ J}/n^2$.' },
      { front: 'State the Rydberg equation.', back: '$1/\\lambda = R(1/n_{\\text{low}}^2 - 1/n_{\\text{high}}^2)$, with $R = 1.097 \\times 10^{7}\\text{ m}^{-1}$.' },
      { front: 'What is the ground state?', back: 'The lowest energy level, $n = 1$ in hydrogen. Higher levels are excited states.' },
      { front: 'Emission or absorption: electron falls from high $n$ to low $n$?', back: 'Emission. A photon leaves, carrying the energy gap.' },
      { front: 'Which hydrogen falls give visible light?', back: 'Falls to $n = 2$: 656, 486, 434 and 410 nm. This is the Balmer series.' },
      { front: 'What is the de Broglie wavelength?', back: '$\\lambda = h/mv$. All moving matter has one, but it only matters for tiny masses.' },
      { front: 'What does the uncertainty principle say?', back: 'You cannot know both exact position and exact momentum at once: $\\Delta x \\cdot \\Delta p \\geq h/4\\pi$.' },
      { front: 'What are the flame colors of Li, Na, K and Cu?', back: 'Lithium crimson, sodium yellow, potassium lilac, copper blue-green.' },
    ],

    terms: [
      { term: 'Line spectrum', def: 'The set of sharp wavelengths of light an element emits or absorbs.' },
      { term: 'Continuous spectrum', def: 'A full rainbow with every wavelength present, such as from a hot solid.' },
      { term: 'Flame test', def: 'Heating a salt in a flame, where the flame color identifies the metal.' },
      { term: 'Bohr model', def: 'A model of hydrogen in which the electron orbits only at certain allowed energies.' },
      { term: 'Ground state', def: 'The lowest energy state of an atom.' },
      { term: 'Excited state', def: 'Any state of an atom with more energy than the ground state.' },
      { term: 'Emission spectrum', def: 'Bright lines made when excited atoms fall to lower levels and give off photons.' },
      { term: 'Absorption spectrum', def: 'Dark lines in a rainbow made when atoms take in photons and climb to higher levels.' },
      { term: 'Rydberg equation', def: 'The equation for the wavelength of a hydrogen jump: $1/\\lambda = R(1/n_{\\text{low}}^2 - 1/n_{\\text{high}}^2)$.' },
      { term: 'Balmer series', def: 'Hydrogen lines from falls to $n = 2$. Four are visible: 656, 486, 434 and 410 nm.' },
      { term: 'Lyman series', def: 'Hydrogen lines from falls to $n = 1$, all in the ultraviolet.' },
      { term: 'Paschen series', def: 'Hydrogen lines from falls to $n = 3$, all in the infrared.' },
      { term: 'de Broglie wavelength', def: 'The wavelength of any moving object: $\\lambda = h/mv$.' },
      { term: 'Heisenberg uncertainty principle', def: 'It is impossible to know both the exact position and the exact momentum of a particle at once.' },
    ],
  });
})();
