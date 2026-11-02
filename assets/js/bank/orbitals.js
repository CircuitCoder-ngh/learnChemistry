/* Question bank for 7.3 Orbitals and quantum numbers. */
(function () {
  'use strict';
  const L = ['s', 'p', 'd', 'f', 'g'];
  const half = (s) => (s > 0 ? '+\\tfrac{1}{2}' : '-\\tfrac{1}{2}');
  const fmtM = (m) => (m > 0 ? '+' + m : m < 0 ? '-' + -m : '0');
  const addr = (n, l, m, s) => `$n = ${n},\\ \\ell = ${l},\\ m_\\ell = ${fmtM(m)},\\ m_s = ${half(s)}$`;

  Bank.add('orbitals', {
    quiz: [
      {
        q: 'What is an orbital?',
        options: ['A fixed circular path the electron follows', 'A region of space where an electron is likely to be found', 'A small particle inside the atom', 'The surface the electron moves along'],
        answer: 1,
        why: 'An orbital is a probability cloud from a wave solution. It is not a track, and the electron does not ride on the balloon\'s surface.',
      },
      {
        q: 'Which orbital does not exist?',
        options: ['2s', '3p', '2d', '4f'],
        answer: 2,
        why: 'For $n = 2$, $\\ell$ can only be 0 or 1, so s and p are all there is. A 2d orbital would need $\\ell = 2$, which is not less than $n$.',
      },
      {
        q: 'Which quantum number mainly sets the shape of an orbital?',
        options: ['$n$', '$\\ell$', '$m_\\ell$', '$m_s$'],
        answer: 1,
        why: '$n$ sets size and energy, $\\ell$ sets shape, $m_\\ell$ sets direction in space, and $m_s$ sets spin.',
      },
      {
        q: 'How many orbitals are in the $n = 4$ shell?',
        options: ['4', '8', '16', '32'],
        answer: 2,
        why: 'A shell has $n^2$ orbitals, so $4^2 = 16$. The tempting 32 is the number of electrons, $2n^2$.',
      },
      {
        q: 'What is the maximum number of electrons in a single orbital?',
        options: ['1', '2', '6', 'It depends on the orbital\'s shape'],
        answer: 1,
        why: 'Every orbital has exactly two seats, $m_s = +\\tfrac{1}{2}$ and $m_s = -\\tfrac{1}{2}$, whatever its shape.',
      },
      {
        q: 'A 3s orbital and a 1s orbital are both spheres. How do they differ?',
        options: ['The 3s is larger and has radial nodes', 'The 3s is smaller and has no nodes', 'They differ only in spin', 'The 3s has angular nodes'],
        answer: 0,
        why: 'Higher $n$ means a bigger orbital. A 3s has $n - \\ell - 1 = 2$ radial nodes. Since $\\ell = 0$, it has no angular nodes.',
      },
      {
        q: 'How many values of $m_\\ell$ are possible when $\\ell = 3$?',
        options: ['3', '4', '6', '7'],
        answer: 3,
        why: '$m_\\ell$ runs from $-3$ to $+3$, including 0, which is 7 values: $2\\ell + 1$.',
      },
      {
        q: 'In a picture of a p orbital, the lobes are colored differently. What do the colors mean?',
        options: ['The sign (phase) of the wave', 'Positive and negative electric charge', 'Which lobe holds the electron', 'Higher and lower energy'],
        answer: 0,
        why: 'Colors show the phase of the wavefunction, like the up and down of a wave. Both lobes hold the same negative electron cloud.',
      },
      {
        q: 'What does a node in an orbital mean?',
        options: ['Where the electron spends most of its time', 'A place where the chance of finding the electron is zero', 'The location of the nucleus', 'A place where two orbitals connect'],
        answer: 1,
        why: 'At a node, the wave is zero, so the probability of finding the electron there is exactly zero.',
      },
    ],

    gens: [
      {
        id: 'allowed',
        title: 'Is this address allowed?',
        make(r) {
          const n = r.int(1, 5);
          const kind = r.int(0, 3);
          const s = r.pick([1, -1]);
          let l = r.int(0, n - 1), m = r.int(-l, l), broke = null;
          if (kind === 1) { l = n + r.int(0, 1); m = r.int(-Math.min(l, 2), Math.min(l, 2)); broke = `When $n = ${n}$, $\\ell$ can only go up to $n - 1 = ${n - 1}$. Here $\\ell = ${l}$, so this breaks the rule.`; }
          else if (kind === 2) { l = r.int(0, n - 1); m = (l + r.int(1, 2)) * r.pick([1, -1]); broke = `When $\\ell = ${l}$, $m_\\ell$ can only go from $${-l}$ to $${fmtM(l)}$. Here $m_\\ell = ${fmtM(m)}$, so this breaks the rule.`; }
          const ok = !broke;
          const mc = { choices: ['Allowed', 'Not allowed'], answer: ok ? 0 : 1 };
          return {
            q: `Is this set of quantum numbers allowed? ${addr(n, l, m, s)}`,
            choices: mc.choices, answer: mc.answer,
            steps: [
              `$\\ell$ must be from 0 to $n - 1$, and $m_\\ell$ must be from $-\\ell$ to $+\\ell$.`,
              ok ? `All the rules hold. This is a ${n}${L[l]} electron.${l > 3 ? ' The letter after f is g. No atom fills it in its ground state, but the address is legal.' : ''}` : broke,
            ],
          };
        },
      },
      {
        id: 'subshell-count',
        title: 'Orbitals in a subshell',
        make(r) {
          const l = r.int(0, 3), n = r.int(Math.max(l + 1, 2), 6);
          const asks = r.pick(['orbitals', 'electrons']);
          const orb = 2 * l + 1;
          const ans = asks === 'orbitals' ? orb : 2 * orb;
          return {
            q: `How many ${asks} can the ${n}${L[l]} subshell hold?`,
            answer: ans, tol: 0.001, unit: asks,
            hint: 'Use $2\\ell + 1$ for the orbitals. Each orbital holds 2 electrons.',
            steps: [
              `${L[l]} means $\\ell = ${l}$, so the number of orbitals is $2(${l}) + 1 = ${orb}$.`,
              asks === 'orbitals' ? `The answer is ${orb} orbitals.` : `Each holds 2 electrons, so $2 \\times ${orb} = ${ans}$ electrons.`,
            ],
          };
        },
      },
      {
        id: 'shell-count',
        title: 'Orbitals and electrons in a shell',
        make(r) {
          const n = r.int(1, 7);
          const asks = r.pick(['orbitals', 'electrons']);
          const ans = asks === 'orbitals' ? n * n : 2 * n * n;
          return {
            q: `How many ${asks} can the $n = ${n}$ shell hold?`,
            answer: ans, tol: 0.001, unit: asks,
            hint: 'Shell $n$ has $n^2$ orbitals and holds $2n^2$ electrons.',
            steps: [
              `Number of orbitals: $n^2 = ${n}^2 = ${n * n}$.`,
              asks === 'orbitals' ? `The answer is ${n * n} orbitals.` : `Electrons: $2n^2 = 2(${n * n}) = ${2 * n * n}$.`,
            ],
          };
        },
      },
      {
        id: 'name-it',
        title: 'Name the subshell',
        make(r) {
          const n = r.int(1, 6), l = r.int(0, Math.min(n - 1, 3));
          const name = `${n}${L[l]}`;
          return {
            q: `What is the name of the subshell with $n = ${n}$ and $\\ell = ${l}$?`,
            accept: [name], placeholder: 'such as 3p',
            steps: [`$\\ell = ${l}$ is the letter ${L[l]}, and the number in front is $n$. The name is ${name}.`],
          };
        },
      },
      {
        id: 'nodes',
        title: 'Count the nodes',
        make(r) {
          const l = r.int(0, 3), n = r.int(l + 1, 6);
          const kind = r.pick(['radial', 'angular', 'total']);
          const ans = kind === 'radial' ? n - l - 1 : kind === 'angular' ? l : n - 1;
          return {
            q: `How many ${kind} nodes does a ${n}${L[l]} orbital have?`,
            answer: ans, tol: 0.001, unit: 'nodes',
            hint: 'Total is $n - 1$, angular is $\\ell$, and radial is $n - \\ell - 1$.',
            steps: [
              `${n}${L[l]} means $n = ${n}$ and $\\ell = ${l}$.`,
              kind === 'radial' ? `Radial nodes $= n - \\ell - 1 = ${n} - ${l} - 1 = ${ans}$.` : kind === 'angular' ? `Angular nodes $= \\ell = ${ans}$.` : `Total nodes $= n - 1 = ${n} - 1 = ${ans}$.`,
            ],
          };
        },
      },
      {
        id: 'possible-m',
        title: 'Find a possible set',
        make(r) {
          const l = r.int(1, 3), n = r.int(l + 1, 5);
          const m = r.int(-l, l), s = r.pick([1, -1]);
          const right = addr(n, l, m, s);
          const wrongs = [
            addr(n, l + (n - l), 0, s),
            addr(n, l, l + 1, s),
            addr(n, Math.max(0, l - 1), r.pick([-1, 1]) * l, s),
            addr(n + 1, l, -(l + 1), s),
          ];
          // Keep wrongs that really break a rule.
          const bad = wrongs.filter((_, i) => i !== 2 || l >= 1);
          const mc = r.mc(right, bad.slice(0, 3));
          return {
            q: `Which set of quantum numbers could describe an electron in a ${n}${L[l]} subshell?`,
            choices: mc.choices, answer: mc.answer,
            steps: [
              `${n}${L[l]} means $n = ${n}$ and $\\ell = ${l}$. Any right answer must show those two exactly.`,
              `$m_\\ell$ must then be between $${-l}$ and $${fmtM(l)}$, and $m_s$ must be $\\pm\\tfrac{1}{2}$.`,
              `The set that fits is ${right}.`,
            ],
          };
        },
      },
      {
        id: 'how-many-electrons-same',
        title: 'Electrons sharing numbers (exam style)',
        make(r) {
          const form = r.int(0, 2);
          if (form === 0) {
            const n = r.int(1, 5);
            return {
              q: `What is the maximum number of electrons in one atom that can have $n = ${n}$?`,
              answer: 2 * n * n, tol: 0.001, unit: 'electrons',
              hint: 'Only $n$ is fixed, so count the whole shell.',
              steps: [`Only $n$ is fixed, so this is the whole shell: $2n^2 = 2(${n * n}) = ${2 * n * n}$ electrons.`],
            };
          }
          if (form === 1) {
            const l = r.int(1, 3), n = r.int(l + 1, 5);
            return {
              q: `What is the maximum number of electrons in one atom that can have $n = ${n}$ and $\\ell = ${l}$?`,
              answer: 2 * (2 * l + 1), tol: 0.001, unit: 'electrons',
              hint: 'This is one subshell.',
              steps: [`$n$ and $\\ell$ fix one subshell, ${n}${L[l]}. It has $2\\ell + 1 = ${2 * l + 1}$ orbitals, so it holds $2 \\times ${2 * l + 1} = ${2 * (2 * l + 1)}$ electrons.`],
            };
          }
          const l = r.int(1, 3), n = r.int(l + 1, 5), m = r.int(-l, l);
          return {
            q: `What is the maximum number of electrons in one atom that can have $n = ${n}$, $\\ell = ${l}$ and $m_\\ell = ${fmtM(m)}$?`,
            answer: 2, tol: 0.001, unit: 'electrons',
            hint: 'Those three numbers name one orbital.',
            steps: ['$n$, $\\ell$ and $m_\\ell$ together name a single orbital. Each orbital holds 2 electrons, one with each spin.'],
          };
        },
      },
    ],

    cards: [
      { front: 'What does $n$ tell you?', back: 'The principal quantum number: the shell, its size and energy. $n = 1, 2, 3, \\ldots$' },
      { front: 'What does $\\ell$ tell you?', back: 'The shape, or subshell. $\\ell = 0$ to $n - 1$. 0 is s, 1 is p, 2 is d, 3 is f.' },
      { front: 'What does $m_\\ell$ tell you?', back: 'The orientation in space. $m_\\ell = -\\ell$ to $+\\ell$.' },
      { front: 'What does $m_s$ tell you?', back: 'The spin: $+\\tfrac{1}{2}$ or $-\\tfrac{1}{2}$.' },
      { front: 'How many orbitals in s, p, d and f?', back: '1, 3, 5 and 7. That is $2\\ell + 1$.' },
      { front: 'How many orbitals and electrons in shell $n$?', back: '$n^2$ orbitals and $2n^2$ electrons.' },
      { front: 'How do you count nodes?', back: 'Total $n - 1$. Angular $\\ell$. Radial $n - \\ell - 1$.' },
      { front: 'Name three orbitals that do not exist.', back: '1p, 2d and 3f, since $\\ell$ must be less than $n$.' },
    ],

    terms: [
      { term: 'Orbital', def: 'A region of space, from a wave solution, where an electron is likely to be found. It holds at most 2 electrons.' },
      { term: 'Quantum numbers', def: 'The four numbers, $n$, $\\ell$, $m_\\ell$ and $m_s$, that give an electron its address in an atom.' },
      { term: 'Principal quantum number', def: 'The number $n$. It sets the shell, and so the size and energy of the orbital.' },
      { term: 'Angular momentum quantum number', def: 'The number $\\ell$, from 0 to $n - 1$. It sets the orbital shape: s, p, d or f.' },
      { term: 'Magnetic quantum number', def: 'The number $m_\\ell$, from $-\\ell$ to $+\\ell$. It sets the direction of the orbital in space.' },
      { term: 'Spin quantum number', def: 'The number $m_s$, either $+\\tfrac{1}{2}$ or $-\\tfrac{1}{2}$.' },
      { term: 'Shell', def: 'All orbitals with the same $n$.' },
      { term: 'Subshell', def: 'All orbitals with the same $n$ and $\\ell$, such as 3d.' },
      { term: 'Node', def: 'A place in an orbital where the wave is zero, so the electron has zero chance of being there.' },
      { term: 'Radial node', def: 'A spherical node. An orbital has $n - \\ell - 1$ of them.' },
      { term: 'Angular node', def: 'A flat or cone-shaped node through the nucleus. An orbital has $\\ell$ of them.' },
      { term: 'Phase', def: 'The sign of the wave, plus or minus, in a part of an orbital. It is not an electric charge.' },
      { term: 'Probability density', def: 'The chance of finding an electron per unit of volume at a point, given by $\\psi^2$.' },
    ],
  });
})();
