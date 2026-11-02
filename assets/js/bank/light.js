/* Question bank for 7.1 Light and photons. */
(function () {
  'use strict';
  const h = 6.626e-34, c = 2.998e8, NA = 6.022e23;

  /** TeX scientific notation, rounding carefully so 9.996 becomes 1.00 x 10^1. */
  function sci(x, sf = 3) {
    let e = Math.floor(Math.log10(Math.abs(x)));
    let m = (x / Math.pow(10, e)).toFixed(sf - 1);
    if (+m >= 10) { e += 1; m = (x / Math.pow(10, e)).toFixed(sf - 1); }
    return `${m} \\times 10^{${e}}`;
  }
  const METALS = [
    { name: 'cesium', phi: 3.4e-19 },
    { name: 'sodium', phi: 3.68e-19 },
    { name: 'calcium', phi: 4.6e-19 },
    { name: 'zinc', phi: 6.9e-19 },
    { name: 'copper', phi: 7.5e-19 },
    { name: 'platinum', phi: 9.0e-19 },
  ];

  Bank.add('light', {
    quiz: [
      {
        q: 'Compared with red light, violet light has:',
        options: ['Longer wavelength and lower frequency', 'Shorter wavelength and higher frequency', 'Shorter wavelength and lower frequency', 'The same frequency but a higher speed'],
        answer: 1,
        why: 'All light travels at $c$, so $\\lambda$ and $\\nu$ trade off. Violet has the shorter wavelength, so it must have the higher frequency.',
      },
      {
        q: 'Which kind of light has the most energy per photon?',
        options: ['Radio waves', 'Microwaves', 'Visible green light', 'X-rays'],
        answer: 3,
        why: '$E = hc/\\lambda$, so the shortest wavelength wins. Of these, X-rays have the shortest wavelength.',
      },
      {
        q: 'What changes when you make a lamp brighter, keeping the color the same?',
        options: ['Each photon has more energy', 'The wavelength gets shorter', 'More photons leave each second', 'The photons move faster'],
        answer: 2,
        why: 'Color sets the energy of each photon. Brightness is how many photons arrive each second. Speed stays $c$.',
      },
      {
        q: 'Bright red light frees no electrons from a metal, but dim violet light does. Why?',
        options: ['Red photons do not have enough energy, and one photon acts on one electron', 'Red light has a lower speed', 'Dim light always carries more energy than bright light', 'The metal reflects all red light'],
        answer: 0,
        why: 'Energy comes in packets. A single red photon has less energy than the work function, and adding more of them does not help, because each electron absorbs just one photon.',
      },
      {
        q: 'Light above the threshold frequency hits a metal. You double the brightness. What happens to the electrons?',
        options: ['Twice as many leave, each with the same kinetic energy', 'The same number leave, with twice the kinetic energy', 'Twice as many leave, with twice the kinetic energy', 'Nothing changes at all'],
        answer: 0,
        why: 'Twice the photons free twice the electrons. Kinetic energy depends only on frequency: $KE = h\\nu - \\phi$.',
      },
      {
        q: 'What does the work function $\\phi$ of a metal measure?',
        options: ['The speed of the electrons that come out', 'The energy needed to free one electron from that metal', 'The number of electrons in the metal', 'The brightness needed to start a current'],
        answer: 1,
        why: 'It is the "escape cost" for one electron. Any energy a photon brings beyond $\\phi$ becomes kinetic energy.',
      },
      {
        q: 'Which statement is true of all electromagnetic waves in a vacuum?',
        options: ['They have the same frequency', 'They have the same wavelength', 'They have the same energy per photon', 'They have the same speed'],
        answer: 3,
        why: 'All travel at $c = 2.998 \\times 10^{8}$ m/s. Everything else varies across the spectrum.',
      },
      {
        q: 'Before plugging 500 nm into $c = \\lambda\\nu$, you must:',
        options: ['Multiply by $10^{9}$ to get meters', 'Multiply by $10^{-9}$ to get meters', 'Divide by Planck\'s constant', 'Nothing, nanometers work fine'],
        answer: 1,
        why: '$c$ is in m/s, so $\\lambda$ must be in meters: $500\\text{ nm} = 500 \\times 10^{-9}\\text{ m} = 5.00 \\times 10^{-7}\\text{ m}$.',
      },
    ],

    gens: [
      {
        id: 'freq',
        title: 'Wavelength to frequency',
        make(r) {
          const nm = r.int(38, 75) * 10;
          const nu = c / (nm * 1e-9);
          return {
            q: `What is the frequency of light with a wavelength of ${nm} nm?`,
            answer: nu, unit: 'Hz',
            hint: 'Convert to meters first, then $\\nu = c/\\lambda$.',
            steps: [
              `Convert: $${nm}\\text{ nm} = ${sci(nm * 1e-9)}\\text{ m}$.`,
              'Rearrange $c = \\lambda\\nu$ to get $\\nu = c/\\lambda$.',
              `$\\nu = \\dfrac{2.998 \\times 10^{8}\\text{ m/s}}{${sci(nm * 1e-9)}\\text{ m}} = ${sci(nu)}\\text{ Hz}$.`,
            ],
          };
        },
      },
      {
        id: 'wavelength',
        title: 'Frequency to wavelength',
        make(r) {
          const m = r.num(4.1, 7.8, 2);
          const nu = m * 1e14;
          const lam = c / nu;
          return {
            q: `A beam of light has a frequency of $${sci(nu)}$ Hz. What is its wavelength in nanometers?`,
            answer: lam * 1e9, unit: 'nm',
            hint: '$\\lambda = c/\\nu$ gives meters. Then convert to nanometers.',
            steps: [
              `$\\lambda = \\dfrac{c}{\\nu} = \\dfrac{2.998 \\times 10^{8}\\text{ m/s}}{${sci(nu)}\\text{ s}^{-1}} = ${sci(lam)}\\text{ m}$.`,
              `Convert: $${sci(lam)}\\text{ m} \\times \\dfrac{10^{9}\\text{ nm}}{1\\text{ m}} = ${(lam * 1e9).toFixed(0)}\\text{ nm}$.`,
            ],
          };
        },
      },
      {
        id: 'photon-energy',
        title: 'Energy of one photon',
        make(r) {
          const nm = r.pick([121.6, 193, 248, 266, 355, 405, 450, 488, 532, 589, 633, 656, 780, 1064]);
          const E = (h * c) / (nm * 1e-9);
          return {
            q: `What is the energy of one photon of light with a wavelength of ${nm} nm?`,
            answer: E, unit: 'J',
            hint: 'Use $E = hc/\\lambda$, with $\\lambda$ in meters.',
            steps: [
              `Convert: $${nm}\\text{ nm} = ${sci(nm * 1e-9, 4)}\\text{ m}$.`,
              `$E = \\dfrac{hc}{\\lambda} = \\dfrac{(6.626 \\times 10^{-34})(2.998 \\times 10^{8})}{${sci(nm * 1e-9, 4)}} = ${sci(E)}\\text{ J}$.`,
            ],
          };
        },
      },
      {
        id: 'hv',
        title: 'Energy from frequency',
        make(r) {
          const nu = r.num(1.5, 50, 1) * 1e14;
          const E = h * nu;
          return {
            q: `A photon has a frequency of $${sci(nu)}$ Hz. What is its energy?`,
            answer: E, unit: 'J',
            hint: 'Use $E = h\\nu$.',
            steps: [
              `$E = h\\nu = (6.626 \\times 10^{-34}\\text{ J}\\cdot\\text{s})(${sci(nu)}\\text{ s}^{-1})$.`,
              `$E = ${sci(E)}\\text{ J}$.`,
            ],
          };
        },
      },
      {
        id: 'per-mole',
        title: 'Energy per mole of photons',
        make(r) {
          const nm = r.int(20, 80) * 10;
          const E = (h * c) / (nm * 1e-9);
          const kJ = (E * NA) / 1000;
          return {
            q: `What is the energy of one mole of photons with a wavelength of ${nm} nm? Give your answer in kJ/mol.`,
            answer: kJ, unit: 'kJ/mol',
            hint: 'Find the energy of one photon, then multiply by Avogadro\'s number and divide by 1000.',
            steps: [
              `One photon: $E = \\dfrac{hc}{\\lambda} = \\dfrac{(6.626 \\times 10^{-34})(2.998 \\times 10^{8})}{${sci(nm * 1e-9)}} = ${sci(E)}\\text{ J}$.`,
              `One mole: $${sci(E)}\\text{ J} \\times 6.022 \\times 10^{23}\\text{ /mol} = ${sci(E * NA)}\\text{ J/mol}$.`,
              `Divide by 1000 to get $${Lab.sig(kJ, 3)}\\text{ kJ/mol}$.`,
            ],
          };
        },
      },
      {
        id: 'count-photons',
        title: 'How many photons?',
        make(r) {
          const nm = r.pick([405, 450, 488, 532, 633, 650, 780]);
          const mJ = r.num(0.5, 9.5, 1);
          const E = (h * c) / (nm * 1e-9);
          const n = (mJ * 1e-3) / E;
          return {
            q: `A laser pulse at ${nm} nm carries ${mJ} mJ of energy. How many photons are in the pulse?`,
            answer: n, unit: 'photons',
            hint: 'Find the energy of one photon, then divide the total energy by it.',
            steps: [
              `One photon: $E = \\dfrac{hc}{\\lambda} = \\dfrac{(6.626 \\times 10^{-34})(2.998 \\times 10^{8})}{${sci(nm * 1e-9)}} = ${sci(E)}\\text{ J}$.`,
              `Total energy: $${mJ}\\text{ mJ} = ${sci(mJ * 1e-3, 2)}\\text{ J}$.`,
              `Photons $= \\dfrac{${sci(mJ * 1e-3, 2)}\\text{ J}}{${sci(E)}\\text{ J/photon}} = ${sci(n)}$ photons.`,
            ],
          };
        },
      },
      {
        id: 'photoelectric-ke',
        title: 'Photoelectric kinetic energy',
        make(r) {
          const metal = r.pick(METALS);
          const E0 = metal.phi;
          const lam0 = (h * c) / E0;
          const nm = Math.round((lam0 * 1e9 * r.num(0.45, 0.85, 2)) / 5) * 5;
          const E = (h * c) / (nm * 1e-9);
          const KE = E - E0;
          return {
            q: `The work function of ${metal.name} is $${sci(E0, 3)}$ J. Light at ${nm} nm hits the metal. What is the kinetic energy of each freed electron?`,
            answer: KE, unit: 'J', tol: 0.04,
            hint: 'Find the photon energy, then subtract the work function.',
            steps: [
              `Photon energy: $E = \\dfrac{hc}{\\lambda} = \\dfrac{(6.626 \\times 10^{-34})(2.998 \\times 10^{8})}{${sci(nm * 1e-9)}} = ${sci(E)}\\text{ J}$.`,
              `$E$ is larger than $\\phi$, so electrons escape.`,
              `$KE = E - \\phi = ${sci(E)} - ${sci(E0)} = ${sci(KE)}\\text{ J}$.`,
            ],
          };
        },
      },
      {
        id: 'threshold',
        title: 'Threshold wavelength',
        make(r) {
          const metal = r.pick(METALS);
          const lam = (h * c) / metal.phi;
          return {
            q: `The work function of ${metal.name} is $${sci(metal.phi, 3)}$ J. What is the longest wavelength of light, in nm, that can free an electron?`,
            answer: lam * 1e9, unit: 'nm',
            hint: 'At the threshold, the photon energy just equals the work function: $hc/\\lambda_0 = \\phi$.',
            steps: [
              'At threshold, all of the photon energy pays the escape cost: $\\dfrac{hc}{\\lambda_0} = \\phi$.',
              'Rearrange: $\\lambda_0 = \\dfrac{hc}{\\phi}$.',
              `$\\lambda_0 = \\dfrac{(6.626 \\times 10^{-34})(2.998 \\times 10^{8})}{${sci(metal.phi)}} = ${sci(lam)}\\text{ m} = ${(lam * 1e9).toFixed(0)}\\text{ nm}$.`,
            ],
          };
        },
      },
      {
        id: 'rank',
        title: 'Which has more energy?',
        make(r) {
          const ladder = ['radio waves', 'microwaves', 'infrared', 'red light', 'green light', 'violet light', 'ultraviolet', 'X-rays', 'gamma rays'];
          const picks = r.shuffle(ladder.map((_, i) => i)).slice(0, 4).sort((a, b) => a - b);
          const ask = r.pick([
            { text: 'the highest energy per photon', high: true },
            { text: 'the highest frequency', high: true },
            { text: 'the shortest wavelength', high: true },
            { text: 'the longest wavelength', high: false },
            { text: 'the lowest frequency', high: false },
            { text: 'the lowest energy per photon', high: false },
          ]);
          const correct = ladder[ask.high ? picks[3] : picks[0]];
          const mc = r.mc(correct, picks.map((i) => ladder[i]).filter((x) => x !== correct));
          const list = r.shuffle(picks.map((i) => ladder[i]));
          return {
            q: `Which has ${ask.text}: ${list.slice(0, 3).join(', ')} or ${list[3]}?`,
            choices: mc.choices, answer: mc.answer,
            steps: [
              'From long wavelength to short: radio, microwave, infrared, red, green, violet, ultraviolet, X-ray, gamma.',
              'Moving along that list, frequency and energy per photon go up while wavelength goes down.',
              `Of these four, ${correct} has ${ask.text}.`,
            ],
          };
        },
      },
    ],

    cards: [
      { front: 'State the relation between wavelength and frequency.', back: '$c = \\lambda\\nu$. As wavelength goes up, frequency goes down.' },
      { front: 'What is the speed of light?', back: '$c = 2.998 \\times 10^{8}$ m/s, for all electromagnetic waves in a vacuum.' },
      { front: 'What is the energy of a photon?', back: '$E = h\\nu = hc/\\lambda$, with $h = 6.626 \\times 10^{-34}$ J·s.' },
      { front: 'List the spectrum from long wavelength to short.', back: 'Radio, microwave, infrared, visible, ultraviolet, X-ray, gamma.' },
      { front: 'What does brightness change?', back: 'The number of photons per second. Not the energy per photon.' },
      { front: 'What is the work function?', back: 'The minimum energy needed to free one electron from a metal. Symbol $\\phi$.' },
      { front: 'What is the photoelectric equation?', back: '$KE = h\\nu - \\phi$. No electrons come out unless $h\\nu > \\phi$.' },
      { front: 'What is 1 nm in meters?', back: '$10^{-9}$ m.' },
    ],

    terms: [
      { term: 'Wavelength', def: 'The distance from one crest of a wave to the next. Symbol $\\lambda$.' },
      { term: 'Frequency', def: 'How many wave crests pass a point each second, in hertz. Symbol $\\nu$.' },
      { term: 'Amplitude', def: 'The height of a wave from its middle line to a crest. For light, it relates to brightness.' },
      { term: 'Hertz', def: 'The unit of frequency. 1 Hz is one cycle per second.' },
      { term: 'Electromagnetic spectrum', def: 'The full range of light, from gamma rays to radio waves.' },
      { term: 'Photon', def: 'One packet of light. Its energy is $E = h\\nu$.' },
      { term: "Planck's constant", def: 'The constant that links photon energy and frequency, $h = 6.626 \\times 10^{-34}$ J·s.' },
      { term: 'Photoelectric effect', def: 'Light above a threshold frequency knocks electrons out of a metal.' },
      { term: 'Work function', def: 'The minimum energy needed to free an electron from a metal surface. Symbol $\\phi$.' },
      { term: 'Threshold frequency', def: 'The lowest frequency of light that can free electrons from a given metal. $\\nu_0 = \\phi/h$.' },
      { term: 'Wave-particle duality', def: 'Light behaves like a wave when it travels and like a particle when it is absorbed.' },
    ],
  });
})();
