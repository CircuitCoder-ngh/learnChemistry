/* Question bank for 7.4 Electron configurations, plus the configuration engine the page also uses
   (Bank.all.configurations.lib). The Aufbau routine is tested against the element table. */
(function () {
  'use strict';
  const ORDER = ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p', '6s', '4f', '5d', '6p', '7s', '5f', '6d', '7p'];
  const CAP = { s: 2, p: 6, d: 10, f: 14 };
  const LNUM = { s: 0, p: 1, d: 2, f: 3 };
  const NOBLE = [[2, 'He'], [10, 'Ne'], [18, 'Ar'], [36, 'Kr'], [54, 'Xe'], [86, 'Rn']];
  /* Atoms whose real ground state differs from the simple filling order, as listed in the element table. */
  const EXC = {
    Cr: { '4s': 1, '3d': 5 }, Cu: { '4s': 1, '3d': 10 }, Nb: { '5s': 1, '4d': 4 }, Mo: { '5s': 1, '4d': 5 }, Ru: { '5s': 1, '4d': 7 },
    Rh: { '5s': 1, '4d': 8 }, Pd: { '5s': 0, '4d': 10 }, Ag: { '5s': 1, '4d': 10 }, La: { '4f': 0, '5d': 1 }, Ce: { '4f': 1, '5d': 1 },
    Gd: { '4f': 7, '5d': 1 }, Pt: { '6s': 1, '5d': 9 }, Au: { '6s': 1, '5d': 10 }, Ac: { '5f': 0, '6d': 1 }, Th: { '5f': 0, '6d': 2 },
    Pa: { '5f': 2, '6d': 1 }, U: { '5f': 3, '6d': 1 }, Np: { '5f': 4, '6d': 1 }, Cm: { '5f': 7, '6d': 1 },
  };
  const sup = (k) => String(k).replace(/[0-9]/g, (c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]);
  const nOf = (name) => +name[0], lOf = (name) => LNUM[name[1]], capOf = (name) => CAP[name[1]];

  /** Plain Aufbau filling, ignoring exceptions. Returns { '1s':2, ... }, all in filling order. */
  function idealMap(z) {
    const out = {};
    let left = z;
    for (const s of ORDER) { if (left <= 0) break; const k = Math.min(left, capOf(s)); out[s] = k; left -= k; }
    return out;
  }
  /** The real ground state for atomic number z. */
  function atomMap(z) {
    const m = idealMap(z);
    const sym = window.ELEMENTS[z - 1].sym;
    if (EXC[sym]) Object.keys(EXC[sym]).forEach((k) => { m[k] = EXC[sym][k]; });
    const out = {};
    ORDER.forEach((s) => { if (m[s]) out[s] = m[s]; });
    return out;
  }
  /** Parse a PubChem-style string such as "[Ar]4s2 3d6" into a map, expanding any core. */
  function parseConfig(str) {
    const m = {};
    const core = /\[([A-Z][a-z]?)\]/.exec(str);
    if (core) Object.assign(m, parseConfig(window.EL[core[1]].config));
    const re = /(\d)([spdf])(\d+)/g;
    let t;
    while ((t = re.exec(str))) m[t[1] + t[2]] = +t[3];
    return m;
  }
  const sameMap = (a, b) => {
    const ks = new Set(Object.keys(a).concat(Object.keys(b)));
    for (const k of ks) if ((a[k] || 0) !== (b[k] || 0)) return false;
    return true;
  };
  /** Subshells in filling order, or in shell order (n, then l). */
  const namesFilling = (m) => ORDER.filter((s) => m[s]);
  const namesByShell = (m) => Object.keys(m).filter((s) => m[s]).sort((a, b) => nOf(a) - nOf(b) || lOf(a) - lOf(b));
  const totalE = (m) => Object.values(m).reduce((a, b) => a + b, 0);
  /** Text forms. style 'sup' gives 3d⁶, 'plain' gives 3d6, 'tex' gives 3d^{6}. */
  function writeList(m, names, style = 'sup') {
    return names.map((s) => s + (style === 'sup' ? sup(m[s]) : style === 'tex' ? `^{${m[s]}}` : m[s]));
  }
  /** The largest noble gas below this electron count. */
  function coreFor(e, inclusive) {
    let best = null;
    NOBLE.forEach(([k, sym]) => { if (k < e || (inclusive && k === e)) best = { e: k, sym }; });
    return best;
  }
  /** Noble-gas shorthand as { core:'Ar', rest:{...} }. Works for ions too, when the core is intact. */
  function shorthandMap(m, inclusive) {
    const e = totalE(m);
    let core = coreFor(e, inclusive);
    // Use the biggest noble gas whose whole configuration is really contained in m.
    while (core) {
      const cm = atomMap(core.e);
      if (Object.keys(cm).every((s) => (m[s] || 0) >= cm[s])) break;
      const lower = NOBLE.filter(([k]) => k < core.e).pop();
      core = lower ? { e: lower[0], sym: lower[1] } : null;
    }
    const rest = Object.assign({}, m);
    if (core) Object.keys(atomMap(core.e)).forEach((s) => { rest[s] -= atomMap(core.e)[s]; if (!rest[s]) delete rest[s]; });
    return { core: core ? core.sym : null, rest };
  }
  function shorthandText(m, style = 'sup', order = 'fill', inclusive = false) {
    const sh = shorthandMap(m, inclusive);
    const names = order === 'fill' ? namesFilling(sh.rest) : namesByShell(sh.rest);
    const body = writeList(sh.rest, names, style).join(' ');
    return (sh.core ? `[${sh.core}]` + (body ? ' ' : '') : '') + body;
  }
  /** Real ion from an atom: remove from the highest n first (and highest l within n); add by the filling order. */
  function ionMap(z, charge) {
    const m = Object.assign({}, atomMap(z));
    if (charge > 0) {
      for (let i = 0; i < charge; i++) {
        const names = namesByShell(m);
        const s = names[names.length - 1];
        m[s] -= 1; if (!m[s]) delete m[s];
      }
    } else if (charge < 0) {
      for (let i = 0; i < -charge; i++) {
        const s = ORDER.find((x) => (m[x] || 0) < capOf(x));
        m[s] = (m[s] || 0) + 1;
      }
    }
    return m;
  }
  /** Order in which electrons leave as an ion forms, one entry per electron. */
  function leavingOrder(z, charge) {
    const m = Object.assign({}, atomMap(z)), out = [];
    for (let i = 0; i < charge; i++) { const names = namesByShell(m); const s = names[names.length - 1]; out.push(s); m[s] -= 1; if (!m[s]) delete m[s]; }
    return out;
  }
  /** Unpaired electrons, by Hund's rule within each subshell. */
  function unpaired(m) {
    return Object.keys(m).reduce((sum, s) => {
      const boxes = capOf(s) / 2, e = m[s];
      return sum + (e <= boxes ? e : 2 * boxes - e);
    }, 0);
  }
  /** Valence electrons for a main-group atom: everything in the highest shell. */
  function valenceMain(z) {
    const m = atomMap(z);
    const top = Math.max(...Object.keys(m).map(nOf));
    return Object.keys(m).filter((s) => nOf(s) === top).reduce((a, s) => a + m[s], 0);
  }
  function isoNoble(m) {
    const e = totalE(m);
    const hit = NOBLE.find(([k]) => k === e);
    return hit && sameMap(atomMap(e), m) ? hit[1] : null;
  }
  const lib = { ORDER, CAP, LNUM, EXC, NOBLE, sup, nOf, lOf, capOf, idealMap, atomMap, parseConfig, sameMap, namesFilling, namesByShell, totalE, writeList, coreFor, shorthandMap, shorthandText, ionMap, leavingOrder, unpaired, valenceMain, isoNoble };

  /* ---------- Helpers for the generators ---------- */
  const texText = (txt) => txt.replace(/([0-9])([spdf])([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_, n, l, e) => `${n}${l}^{${e.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c))}}`);
  const texCfg = (txt) => `$\\mathrm{${texText(txt).replace(/\[([A-Za-z]+)\]/, '[$1]\\,').replace(/ /g, '\\,')}}$`;
  const fullFill = (m) => writeList(m, namesFilling(m)).join(' ');
  /** Every way we accept a typed configuration: filling order or shell order, plain or with superscripts. */
  function acceptFor(m, shorthand) {
    const out = new Set();
    const add = (mp, prefix) => {
      [namesFilling(mp), namesByShell(mp)].forEach((names) => {
        out.add(prefix + writeList(mp, names, 'plain').join(' '));
        out.add(prefix + writeList(mp, names, 'sup').join(' '));
      });
    };
    if (shorthand) { const sh = shorthandMap(m); add(sh.rest, sh.core ? `[${sh.core}]` : ''); } else add(m, '');
    return [...out];
  }
  const MAIN_AND_D = () => window.ELEMENTS.slice(0, 36).filter((e) => !EXC[e.sym]);
  const MAIN = () => window.ELEMENTS.slice(0, 56).filter((e) => e.block === 's' || e.block === 'p');
  const COMMON_IONS = [
    ['Na', 1], ['Mg', 2], ['Al', 3], ['K', 1], ['Ca', 2], ['O', -2], ['F', -1], ['S', -2], ['Cl', -1], ['N', -3], ['Br', -1],
    ['Fe', 2], ['Fe', 3], ['Cu', 1], ['Cu', 2], ['Cr', 3], ['Mn', 2], ['Co', 2], ['Co', 3], ['Ni', 2], ['Zn', 2], ['Ti', 4], ['Ag', 1], ['Sc', 3],
  ];
  const ionLabel = (sym, q) => `\\ce{${sym}^{${Math.abs(q) === 1 ? '' : Math.abs(q)}${q > 0 ? '+' : '-'}}}`;

  Bank.add('configurations', {
    lib,
    quiz: [
      {
        q: 'Which subshell fills right after 4s?',
        options: ['4p', '3d', '4d', '5s'],
        answer: 1,
        why: 'The filling order goes 3p, 4s, 3d, 4p. The 3d comes after 4s even though its $n$ is smaller.',
      },
      {
        q: 'What does the Pauli exclusion principle say?',
        options: ['Electrons fill the lowest energy first', 'Electrons in a subshell spread out before they pair up', 'No two electrons in an atom can have the same four quantum numbers', 'Electrons in the same orbital must have the same spin'],
        answer: 2,
        why: 'So an orbital holds at most two electrons, and they must have opposite spins. Two of the other choices describe Aufbau and Hund, and the last has the spins backward.',
      },
      {
        q: 'Which box diagram for the 2p electrons of nitrogen follows Hund\'s rule?',
        options: ['[↑↓] [↑ ] [  ]', '[↑ ] [↑ ] [↑ ]', '[↑ ] [↓ ] [↑ ]', '[↑↓] [↑↓] [  ]'],
        answer: 1,
        why: 'Electrons take empty boxes first, all with the same spin. That gives three singles with parallel spins.',
      },
      {
        q: 'What is the electron configuration of $\\ce{Fe^{2+}}$?',
        options: ['$\\mathrm{[Ar]\\,4s^{2}\\,3d^{4}}$', '$\\mathrm{[Ar]\\,3d^{6}}$', '$\\mathrm{[Ar]\\,4s^{1}\\,3d^{5}}$', '$\\mathrm{[Ar]\\,4s^{2}\\,3d^{6}}$'],
        answer: 1,
        why: 'Transition metals lose their $n = 4$ electrons first. Iron is $\\mathrm{[Ar]\\,4s^{2}\\,3d^{6}}$, so both 4s electrons leave.',
      },
      {
        q: 'Why does chromium have the configuration $\\mathrm{[Ar]\\,4s^{1}\\,3d^{5}}$ instead of $\\mathrm{[Ar]\\,4s^{2}\\,3d^{4}}$?',
        options: ['A half-filled d subshell is especially stable', 'Chromium has an extra proton', 'The 4s subshell can hold only one electron', 'It is a mistake in most textbooks'],
        answer: 0,
        why: 'The 4s and 3d energies are very close, and six unpaired electrons with a half-filled 3d give a lower total energy.',
      },
      {
        q: 'How many valence electrons does a sulfur atom have?',
        options: ['2', '4', '6', '16'],
        answer: 2,
        why: '$\\mathrm{[Ne]\\,3s^{2}\\,3p^{4}}$: the outermost shell, $n = 3$, holds $2 + 4 = 6$ electrons. 16 counts every electron.',
      },
      {
        q: 'Which part of the periodic table does phosphorus belong to?',
        options: ['s block', 'p block', 'd block', 'f block'],
        answer: 1,
        why: 'Its last electrons go into 3p, so it sits in the p block, the right-hand six columns.',
      },
      {
        q: 'Which of these is isoelectronic with neon?',
        options: ['$\\ce{K+}$', '$\\ce{Cl-}$', '$\\ce{Mg^{2+}}$', '$\\ce{Ca^{2+}}$'],
        answer: 2,
        why: 'Isoelectronic means the same number of electrons. $\\ce{Mg^{2+}}$ has $12 - 2 = 10$, the same as neon. The other three have 18.',
      },
      {
        q: 'A substance is paramagnetic when its atoms or ions have:',
        options: ['Only paired electrons', 'At least one unpaired electron', 'A full outer shell', 'More protons than electrons'],
        answer: 1,
        why: 'Unpaired electrons act like tiny magnets that do not cancel, so the substance is pulled into a magnetic field.',
      },
    ],

    gens: [
      {
        id: 'full',
        title: 'Write the full configuration',
        make(r) {
          const e = r.pick(MAIN_AND_D());
          const m = atomMap(e.z);
          return {
            q: `Write the full electron configuration of ${e.name.toLowerCase()} (Z = ${e.z}). Type it like 1s2 2s2 2p3.`,
            accept: acceptFor(m, false), placeholder: 'such as 1s2 2s2 2p3',
            steps: [
              `${e.name} has ${e.z} electrons.`,
              'Fill in order: 1s, 2s, 2p, 3s, 3p, 4s, 3d, 4p. An s holds 2, a p holds 6, and a d holds 10.',
              `The result is ${texCfg(fullFill(m))}.`,
              `Check by adding the superscripts: ${namesFilling(m).map((s) => m[s]).join(' + ')} = ${e.z}.`,
            ],
          };
        },
      },
      {
        id: 'short',
        title: 'Noble-gas shorthand',
        make(r) {
          const e = r.pick(window.ELEMENTS.slice(2, 56).filter((x) => x.block !== 'f' && x.family !== 'Noble gas'));
          const m = atomMap(e.z);
          const sh = shorthandMap(m);
          const txt = shorthandText(m);
          const exception = EXC[e.sym];
          return {
            q: `Write the noble-gas shorthand configuration of ${e.name.toLowerCase()} (Z = ${e.z}). Type it like [Ne] 3s2 3p4.`,
            accept: acceptFor(m, true), placeholder: 'such as [Ne] 3s2 3p4',
            steps: [
              `The noble gas before ${e.sym} is ${sh.core}, which has ${totalE(atomMap(NOBLE.find((x) => x[1] === sh.core)[0]))} electrons.`,
              `That leaves ${totalE(sh.rest)} more electrons to place.`,
              exception ? `${e.name} is an exception to the simple filling order: ${texCfg(txt)}.` : `Keep filling from where ${sh.core} stopped: ${texCfg(txt)}.`,
            ],
          };
        },
      },
      {
        id: 'valence',
        title: 'Count the valence electrons',
        make(r) {
          const e = r.pick(MAIN().filter((x) => x.z > 2));
          const m = atomMap(e.z), v = valenceMain(e.z);
          const top = Math.max(...Object.keys(m).map(nOf));
          return {
            q: `How many valence electrons does a neutral ${e.name.toLowerCase()} atom have?`,
            answer: v, tol: 0.001, unit: 'electrons',
            hint: 'Find the highest $n$ in its configuration. Count everything with that $n$.',
            steps: [
              `${e.name}: ${texCfg(shorthandText(m))}.`,
              `The highest shell is $n = ${top}$. Adding the electrons in it gives ${v}.`,
            ],
          };
        },
      },
      {
        id: 'unpaired',
        title: 'Count the unpaired electrons',
        make(r) {
          const e = r.pick(window.ELEMENTS.slice(0, 36));
          const m = atomMap(e.z), u = unpaired(m);
          const names = namesFilling(shorthandMap(m).rest);
          const lastPart = names.filter((s) => { const k = capOf(s); return m[s] < k; });
          return {
            q: `How many unpaired electrons does a ground-state ${e.name.toLowerCase()} atom have?`,
            answer: u, tol: 0.001, unit: 'electrons',
            hint: 'Only partly filled subshells can have unpaired electrons. Use Hund\'s rule: singles first.',
            steps: [
              `${e.name}: ${texCfg(shorthandText(m))}.`,
              lastPart.length ? `Partly filled: ${lastPart.map((s) => `${s} holds ${m[s]} electron${m[s] === 1 ? '' : 's'} in ${capOf(s) / 2} box${capOf(s) === 2 ? '' : 'es'}`).join(', and ')}.` : 'Every subshell is full, so every electron has a partner.',
              `By Hund's rule, that gives ${u} unpaired.`,
            ],
          };
        },
      },
      {
        id: 'ion',
        title: 'Configuration of an ion',
        make(r) {
          const [sym, q] = r.pick(COMMON_IONS);
          const e = window.EL[sym], z = e.z;
          const m = ionMap(z, q), txt = shorthandText(m, 'sup', 'fill', true);
          const atomTxt = shorthandText(atomMap(z));
          const leave = q > 0 ? leavingOrder(z, q) : null;
          return {
            q: `Write the noble-gas shorthand configuration of $${ionLabel(sym, q)}$. Type it like [Ar] 3d5. For an ion with a noble-gas configuration, type just [Ar].`,
            accept: acceptFor(m, true).concat(isoNoble(m) ? [`[${isoNoble(m)}]`] : []), placeholder: 'such as [Ar] 3d5',
            steps: [
              `Start from the atom: ${sym} is ${texCfg(atomTxt)}.`,
              q > 0 ? `Remove ${q} electron${q === 1 ? '' : 's'}, highest $n$ first: ${[...new Set(leave)].join(', then ')}.` : `Add ${-q} electron${q === -1 ? '' : 's'} to the next open place.`,
              `The result is ${texCfg(txt)}${isoNoble(m) ? `, which is the same as ${isoNoble(m)}` : ''}.`,
            ],
          };
        },
      },
      {
        id: 'identify',
        title: 'Name the element',
        make(r) {
          const e = r.pick(window.ELEMENTS.slice(2, 36).filter((x) => x.family !== 'Noble gas'));
          const m = atomMap(e.z);
          const total = totalE(m);
          const useFull = r.next() < 0.5;
          const shown = useFull ? fullFill(m) : shorthandText(m);
          return {
            q: `Which element has this configuration? ${texCfg(shown)} Type its symbol.`,
            accept: [e.sym], placeholder: 'symbol',
            steps: [
              useFull ? `Add the superscripts: ${namesFilling(m).map((s) => m[s]).join(' + ')} = ${total} electrons.` : `The core has ${NOBLE.find((x) => x[1] === shorthandMap(m).core)[0]} electrons, and the rest add ${totalE(shorthandMap(m).rest)}, for ${total} total.`,
              `A neutral atom has as many electrons as protons, so Z = ${total}, which is ${e.name} (${e.sym}).`,
            ],
          };
        },
      },
      {
        id: 'magnetism',
        title: 'Paramagnetic or diamagnetic?',
        make(r) {
          const useIon = r.next() < 0.5;
          let label, m, sourceTxt;
          if (useIon) {
            const [sym, q] = r.pick(COMMON_IONS);
            m = ionMap(window.EL[sym].z, q); label = `$${ionLabel(sym, q)}$`; sourceTxt = shorthandText(m, 'sup', 'fill', true);
          } else {
            const e = r.pick(window.ELEMENTS.slice(0, 36));
            m = atomMap(e.z); label = `a ${e.name.toLowerCase()} atom`; sourceTxt = shorthandText(m);
          }
          const u = unpaired(m);
          const right = u > 0 ? 'Paramagnetic' : 'Diamagnetic';
          const mc = r.mc(right, [u > 0 ? 'Diamagnetic' : 'Paramagnetic']);
          return {
            q: `Is ${label} paramagnetic or diamagnetic?`,
            choices: mc.choices, answer: mc.answer,
            steps: [
              `Its configuration is ${sourceTxt ? texCfg(sourceTxt) : 'empty'}.`,
              `That leaves ${u} unpaired electron${u === 1 ? '' : 's'}.`,
              u > 0 ? 'Any unpaired electrons make it paramagnetic.' : 'All electrons are paired, so it is diamagnetic.',
            ],
          };
        },
      },
      {
        id: 'block',
        title: 'Which block?',
        make(r) {
          const e = r.pick(window.ELEMENTS.filter((x) => x.z <= 103));
          const ans = `${e.block} block`;
          const mc = r.mc(ans, ['s block', 'p block', 'd block', 'f block'].filter((x) => x !== ans));
          return {
            q: `Which block of the periodic table is ${e.name.toLowerCase()} (${e.sym}) in?`,
            choices: mc.choices, answer: mc.answer,
            steps: [
              'Columns 1 and 2, plus helium, are the s block. Columns 13 to 18 are the p block. Columns 3 to 12 are the d block. The two rows set below the table are the f block.',
              `${e.name} is in the ${e.block} block.`,
            ],
          };
        },
      },
    ],

    cards: [
      { front: 'State the Aufbau principle.', back: 'Electrons fill the lowest energy subshells first.' },
      { front: 'State the Pauli exclusion principle.', back: 'No two electrons in an atom have the same four quantum numbers. An orbital holds at most 2, with opposite spins.' },
      { front: "State Hund's rule.", back: 'In a subshell, electrons take empty orbitals first, with parallel spins, before they pair up.' },
      { front: 'What is the filling order up to 5p?', back: '1s, 2s, 2p, 3s, 3p, 4s, 3d, 4p, 5s, 4d, 5p.' },
      { front: 'What are the configurations of Cr and Cu?', back: 'Cr: $\\mathrm{[Ar]\\,4s^{1}\\,3d^{5}}$. Cu: $\\mathrm{[Ar]\\,4s^{1}\\,3d^{10}}$.' },
      { front: 'Which electrons leave first when a transition metal forms an ion?', back: 'Those with the highest $n$. So 4s leaves before 3d.' },
      { front: 'What are valence electrons?', back: 'The electrons in the outermost shell. They do the chemistry.' },
      { front: 'What does isoelectronic mean?', back: 'Having the same number of electrons, such as $\\ce{Na+}$, $\\ce{Ne}$ and $\\ce{F-}$.' },
      { front: 'Paramagnetic or diamagnetic?', back: 'Paramagnetic has unpaired electrons and is attracted to a magnet. Diamagnetic has all paired electrons and is weakly repelled.' },
    ],

    terms: [
      { term: 'Electron configuration', def: 'A list of the subshells in an atom and how many electrons each holds, such as $\\mathrm{1s^{2}\\,2s^{2}\\,2p^{3}}$.' },
      { term: 'Aufbau principle', def: 'Electrons fill the lowest energy subshells first. Aufbau is German for building up.' },
      { term: 'Pauli exclusion principle', def: 'No two electrons in an atom can share all four quantum numbers, so each orbital holds at most two, with opposite spins.' },
      { term: "Hund's rule", def: 'Electrons in a subshell take empty orbitals with parallel spins before pairing up.' },
      { term: 'Orbital box diagram', def: 'A drawing with one box per orbital and an arrow for each electron.' },
      { term: 'Noble-gas shorthand', def: 'A short configuration that replaces the inner electrons with a noble gas symbol, such as $\\mathrm{[Ne]\\,3s^{1}}$.' },
      { term: 'Core electrons', def: 'The inner electrons, matching the previous noble gas.' },
      { term: 'Valence electrons', def: 'The outermost electrons, which take part in bonding.' },
      { term: 'Block', def: 'A region of the periodic table, s, p, d or f, named after the subshell being filled there.' },
      { term: 'Isoelectronic', def: 'Having the same number of electrons.' },
      { term: 'Paramagnetic', def: 'Attracted to a magnet, because of one or more unpaired electrons.' },
      { term: 'Diamagnetic', def: 'Weakly repelled by a magnet, because all electrons are paired.' },
    ],
  });
})();
