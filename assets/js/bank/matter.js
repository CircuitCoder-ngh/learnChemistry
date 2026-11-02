/* Question bank for 1.1 What is stuff made of? */
(function () {
  const KINDS = ['Element', 'Compound', 'Homogeneous mixture', 'Heterogeneous mixture'];
  const SAMPLES = [
    ['pure gold', 0, 'Only gold atoms.'],
    ['oxygen gas, $\\ce{O2}$', 0, 'Pairs of atoms, but all of them are oxygen.'],
    ['a diamond', 0, 'Only carbon atoms.'],
    ['a sheet of aluminum foil', 0, 'Only aluminum atoms.'],
    ['nitrogen gas, $\\ce{N2}$', 0, 'Pairs of atoms, but all of them are nitrogen.'],
    ['distilled water', 1, 'Only $\\ce{H2O}$ molecules: two elements bonded in a fixed ratio.'],
    ['table salt, $\\ce{NaCl}$', 1, 'Sodium and chloride ions in a fixed one-to-one ratio.'],
    ['table sugar', 1, 'Only sucrose molecules, each with C, H and O bonded together.'],
    ['carbon dioxide', 1, 'Only $\\ce{CO2}$ molecules: C and O bonded together.'],
    ['baking soda, $\\ce{NaHCO3}$', 1, 'Four elements bonded in a fixed ratio.'],
    ['filtered air', 2, 'Mostly $\\ce{N2}$ and $\\ce{O2}$, unbonded and evenly spread.'],
    ['salt water', 2, 'Salt fully dissolved. Every spoonful is the same.'],
    ['brass, an alloy of copper and zinc', 2, 'Zinc atoms evenly spread among copper atoms.'],
    ['clear apple juice', 2, 'Sugars and other molecules evenly dissolved in water.'],
    ['vinegar', 2, 'Acetic acid evenly dissolved in water.'],
    ['sand in water', 3, 'You can see the sand and the water in separate regions.'],
    ['oil and vinegar dressing', 3, 'It separates into layers you can see.'],
    ['a chocolate chip cookie', 3, 'One bite can have chips, and another bite none.'],
    ['granite rock', 3, 'You can see grains of different minerals.'],
    ['chicken noodle soup', 3, 'Noodles, chicken and broth sit in separate regions.'],
  ];
  const CHANGES = [
    ['Ice melts into water.', true, 'Same $\\ce{H2O}$ molecules.'],
    ['Water boils.', true, 'Whole molecules fly apart from each other. The bubbles are water vapor.'],
    ['Sugar dissolves in coffee.', true, 'Sugar molecules spread out, but they stay whole.'],
    ['Salt dissolves in water.', true, 'The ions separate, but evaporating the water gives the salt back.'],
    ['A glass window shatters.', true, 'A change of shape only.'],
    ['Paper is torn in half.', true, 'Same paper, in two pieces.'],
    ['Rubbing alcohol evaporates from your skin.', true, 'Liquid to gas, with the same molecules.'],
    ['Dry ice turns directly into gas.', true, 'Solid $\\ce{CO2}$ to gaseous $\\ce{CO2}$.'],
    ['Copper is drawn into a wire.', true, 'Still copper atoms in a new shape.'],
    ['Fog forms on a cold mirror.', true, 'Water vapor condenses into liquid water.'],
    ['Wood burns in a campfire.', false, 'Wood turns into carbon dioxide, water and ash.'],
    ['An iron gate rusts.', false, 'Iron and oxygen form iron oxide, a new substance.'],
    ['A cake bakes in the oven.', false, 'Heat drives reactions that make new substances, including carbon dioxide gas.'],
    ['Milk goes sour.', false, 'Bacteria turn lactose into lactic acid.'],
    ['A silver spoon tarnishes.', false, 'Silver reacts with sulfur compounds to form black silver sulfide.'],
    ['Gasoline burns in an engine.', false, 'Hydrocarbons react with oxygen to give carbon dioxide and water.'],
    ['Electric current splits water into hydrogen and oxygen.', false, 'Bonds inside the water molecules break. New substances form.'],
    ['Baking soda fizzes in vinegar.', false, 'They react to make carbon dioxide gas and new dissolved substances.'],
    ['Your cells break down glucose using oxygen.', false, 'Respiration turns glucose and oxygen into carbon dioxide and water.'],
    ['Bleach removes a stain.', false, 'Bleach reacts with the colored molecules and changes them.'],
  ];
  const PROPS = [
    ['Copper is reddish orange.', 'physical', 'You can see color without changing the substance.'],
    ['Water boils at 100 °C at normal pressure.', 'physical', 'Boiling does not change what water is.'],
    ['Gold has a density of 19.3 g/mL.', 'physical', 'Measuring density leaves gold as gold.'],
    ['Sugar dissolves in water.', 'physical', 'Dissolving does not make a new substance.'],
    ['Lead is soft and easy to bend.', 'physical', 'Bending does not change what lead is.'],
    ['Copper conducts electricity.', 'physical', 'Electricity passes through and leaves copper unchanged.'],
    ['Methane burns in air.', 'chemical', 'Burning turns methane into new substances.'],
    ['Iron rusts in damp air.', 'chemical', 'Rusting makes a new substance.'],
    ['Sodium reacts violently with water.', 'chemical', 'The reaction makes new substances.'],
    ['Gold does not react with air.', 'chemical', 'It describes how a substance reacts, or fails to.'],
    ['Helium does not burn.', 'chemical', 'It describes how a substance reacts, or fails to.'],
    ['Silver tarnishes in air.', 'chemical', 'Tarnishing makes silver sulfide, a new substance.'],
  ];
  const EXT = [
    ['mass', 'extensive'], ['volume', 'extensive'], ['length', 'extensive'], ['total heat content', 'extensive'], ['number of atoms', 'extensive'], ['weight', 'extensive'],
    ['density', 'intensive'], ['melting point', 'intensive'], ['boiling point', 'intensive'], ['color', 'intensive'], ['temperature', 'intensive'], ['hardness', 'intensive'],
  ];
  const STATES = [
    ['Has a fixed shape and a fixed volume.', 'Solid', 'Particles are locked in place, so neither shape nor volume changes.'],
    ['Has a fixed volume, but takes the shape of its container.', 'Liquid', 'Particles stay close, but they can slide past each other.'],
    ['Spreads to fill any container completely.', 'Gas', 'Particles are far apart and fly around freely.'],
    ['Particles vibrate in place.', 'Solid', 'Solid particles stay in fixed positions and vibrate.'],
    ['Particles slide past one another, staying close together.', 'Liquid', 'That is why liquids flow.'],
    ['Particles are far apart and move in straight lines between collisions.', 'Gas', 'Gas particles have lots of empty space around them.'],
    ['Can easily be squeezed into a smaller space.', 'Gas', 'There is lots of empty space between gas particles.'],
  ];
  const FORMULAS = [
    ['H2', 'Element', 'Both atoms are hydrogen.'], ['O2', 'Element', 'Both atoms are oxygen.'], ['N2', 'Element', 'Both atoms are nitrogen.'],
    ['Cl2', 'Element', 'Both atoms are chlorine.'], ['S8', 'Element', 'All eight atoms are sulfur.'], ['P4', 'Element', 'All four atoms are phosphorus.'],
    ['O3', 'Element', 'All three atoms are oxygen. Ozone is an element in a different form.'], ['Fe', 'Element', 'One kind of atom.'], ['He', 'Element', 'One kind of atom.'],
    ['H2O', 'Compound', 'It contains H and O.'], ['CO2', 'Compound', 'It contains C and O.'], ['CO', 'Compound', 'Careful! Capital C and capital O means two different elements.'],
    ['NaCl', 'Compound', 'It contains Na and Cl.'], ['HCl', 'Compound', 'It contains H and Cl.'], ['NH3', 'Compound', 'It contains N and H.'], ['CaCO3', 'Compound', 'It contains Ca, C and O.'],
  ];

  Bank.add('matter', {
    quiz: [
      {
        q: 'When ice melts, what happens to the water molecules?',
        options: ['They break into hydrogen and oxygen atoms', 'They get bigger', 'They stay whole, but they leave their fixed positions', 'They turn into a new substance'],
        answer: 2,
        why: 'Melting is a physical change. The molecules stay $\\ce{H2O}$. They only stop being locked in place.',
      },
      {
        q: 'What is inside the bubbles in boiling water?',
        options: ['Air', 'Hydrogen gas and oxygen gas', 'Water vapor, $\\ce{H2O(g)}$', 'Nothing, they are empty'],
        answer: 2,
        why: 'The bubbles are water that has turned to gas. The bonds inside the water molecules never break.',
      },
      {
        q: 'Oxygen gas is made of $\\ce{O2}$ molecules. How do you classify it?',
        options: ['A compound, because each molecule has two atoms', 'An element, because every atom is oxygen', 'A mixture of oxygen atoms', 'A homogeneous mixture'],
        answer: 1,
        why: 'A compound needs two or more different elements. Two oxygen atoms joined together are still only oxygen.',
      },
      {
        q: 'A picture shows two kinds of molecule, evenly scattered and not bonded together. What is it?',
        options: ['An element', 'A compound', 'A homogeneous mixture', 'A heterogeneous mixture'],
        answer: 2,
        why: 'More than one kind of particle means a mixture. Evenly spread means homogeneous.',
      },
      {
        q: 'Which of these is a chemical change?',
        options: ['Sugar dissolving in water', 'A candle wick burning', 'Water freezing', 'A rock being crushed'],
        answer: 1,
        why: 'Burning makes new substances. The others change only the arrangement or the shape.',
      },
      {
        q: 'Salt dissolves in water, and you can no longer see it. What kind of change is this in most chemistry courses?',
        options: ['Chemical, since the salt disappeared', 'Chemical, since ions separated', 'Physical, since evaporating the water gives the salt back', 'Neither one'],
        answer: 2,
        why: 'No new substance forms, and you can get the salt back by evaporating the water. It counts as physical.',
      },
      {
        q: 'Which property is intensive?',
        options: ['Mass', 'Volume', 'Density', 'Number of atoms'],
        answer: 2,
        why: 'Density does not depend on how much you have. The other three grow with the size of the sample.',
      },
      {
        q: 'A liquid fizzes when you mix two solutions. Can you be certain a chemical change happened?',
        options: ['Yes, bubbles always mean a reaction', 'No, a gas forming is only a clue, so you must check for new substances', 'Yes, because the solutions were mixed', 'No, mixing never causes a reaction'],
        answer: 1,
        why: 'Signs like bubbles are clues. A dissolved gas can fizz out without any reaction, as when you open a soda.',
      },
    ],

    gens: [
      {
        id: 'classify',
        title: 'Classify the sample',
        make(r) {
          const [name, k, why] = r.pick(SAMPLES);
          return {
            q: `What kind of matter is ${name}?`,
            choices: KINDS, answer: k,
            steps: [`It is a <b>${KINDS[k].toLowerCase()}</b>. ${why}`, k < 2 ? 'One kind of building block means a pure substance.' : 'More than one kind of particle, not bonded together, means a mixture.'],
          };
        },
      },
      {
        id: 'element-compound',
        title: 'Element or compound?',
        make(r) {
          const [f, a, why] = r.pick(FORMULAS);
          const choices = ['Element', 'Compound'];
          return {
            q: `Is $\\ce{${f}}$ an element or a compound?`,
            choices, answer: choices.indexOf(a),
            steps: [`Count the different capital-letter symbols. ${why} So it is <b>${a.toLowerCase() === 'element' ? 'an element' : 'a compound'}</b>.`],
          };
        },
      },
      {
        id: 'change',
        title: 'Physical or chemical change?',
        make(r) {
          const [text, phys, why] = r.pick(CHANGES);
          const choices = ['Physical change', 'Chemical change'];
          return {
            q: text,
            choices, answer: phys ? 0 : 1,
            steps: [`Ask whether new substances form. ${why}`, `So this is a <b>${phys ? 'physical' : 'chemical'} change</b>.`],
          };
        },
      },
      {
        id: 'property',
        title: 'Physical or chemical property?',
        make(r) {
          const [text, kind, why] = r.pick(PROPS);
          const choices = ['Physical property', 'Chemical property'];
          return {
            q: text,
            choices, answer: kind === 'physical' ? 0 : 1,
            steps: [`${why} So this is a <b>${kind} property</b>.`],
          };
        },
      },
      {
        id: 'intensive',
        title: 'Intensive or extensive?',
        make(r) {
          const [name, kind] = r.pick(EXT);
          const choices = ['Intensive', 'Extensive'];
          return {
            q: `Is ${name} an intensive or an extensive property?`,
            choices, answer: kind === 'intensive' ? 0 : 1,
            steps: [`Imagine cutting the sample in half. ${kind === 'intensive' ? `The ${name} of each half stays the same.` : `The ${name} of each half is smaller.`}`, `So it is <b>${kind}</b>.`],
          };
        },
      },
      {
        id: 'state',
        title: 'Which state?',
        make(r) {
          const [text, s, why] = r.pick(STATES);
          const choices = ['Solid', 'Liquid', 'Gas'];
          return { q: text, choices, answer: choices.indexOf(s), steps: [`This describes a <b>${s.toLowerCase()}</b>. ${why}`] };
        },
      },
    ],

    cards: [
      { front: 'What is the difference between an element and a compound?', back: 'An element has one kind of atom. A compound has two or more different elements bonded in a fixed ratio.' },
      { front: 'Is $\\ce{O2}$ an element or a compound?', back: 'An element. Both atoms are oxygen.' },
      { front: 'Homogeneous or heterogeneous?', back: 'Homogeneous mixtures are the same everywhere. Heterogeneous mixtures have separate regions.' },
      { front: 'What is the test for a chemical change?', back: 'New substances form, because atoms change partners. Signs like bubbles or color are only clues.' },
      { front: 'What is in the bubbles of boiling water?', back: 'Water vapor, $\\ce{H2O(g)}$. Not hydrogen and oxygen.' },
      { front: 'Is dissolving salt a chemical change?', back: 'No. Courses treat it as physical, since evaporating the water gives the salt back.' },
      { front: 'Intensive vs extensive property?', back: 'Extensive depends on the amount, such as mass. Intensive does not, such as density.' },
      { front: 'Describe particles in a solid, a liquid and a gas.', back: 'Solid: close, vibrating in place. Liquid: close, sliding. Gas: far apart, flying freely.' },
      { front: 'Name five signs of a chemical change.', back: 'A gas forms, the color changes, a solid appears, heat or light is given off, and a new smell.' },
    ],

    terms: [
      { term: 'Solid', def: 'A state with fixed shape and volume. Particles are close together and vibrate in place.' },
      { term: 'Liquid', def: 'A state with fixed volume but no fixed shape. Particles are close together and slide past each other.' },
      { term: 'Gas', def: 'A state that fills its container. Particles are far apart and fly around freely.' },
      { term: 'Plasma', def: 'A very hot state in which electrons have been stripped from atoms, such as in the Sun or lightning.' },
      { term: 'Pure substance', def: 'Matter with a fixed composition: just one element or one compound.' },
      { term: 'Compound', def: 'A substance of two or more different elements bonded together in a fixed ratio.' },
      { term: 'Mixture', def: 'Two or more substances sharing a space without being chemically bonded to each other.' },
      { term: 'Homogeneous mixture', def: 'A mixture that is the same everywhere. Also called a solution.' },
      { term: 'Heterogeneous mixture', def: 'A mixture with separate regions that differ from one another.' },
      { term: 'Physical change', def: 'A change in form or state with no new substances. The particles stay the same.' },
      { term: 'Chemical change', def: 'A change in which atoms rearrange and new substances form. Also called a chemical reaction.' },
      { term: 'Physical property', def: 'A property you can measure without changing what the substance is, such as color or density.' },
      { term: 'Chemical property', def: 'A property that describes how a substance can change into other substances, such as flammability.' },
      { term: 'Intensive property', def: 'A property that does not depend on the amount, such as density or melting point.' },
      { term: 'Extensive property', def: 'A property that depends on the amount, such as mass or volume.' },
    ],
  });
})();
