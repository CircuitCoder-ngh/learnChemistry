# Curriculum map

What The Mole Hole has to teach, why, and in what order.

## How this list was chosen

- **Sequence** follows OpenStax *Chemistry 2e* chapters 1-11 (the open textbook used in many first-year courses), with chapters 12-17, 20 and 21 as "next-term" bonus lessons, since some Chem 101 courses reach them.
- **Coverage check** is the ACS General Chemistry First Term exam: chemical formulas and nomenclature; atoms, isotopes and molecules; reactions and equations; moles and stoichiometry (including solution chemistry); thermochemistry; quantum model and periodicity; bonding and molecular properties; gases. Its official study guide adds solutions and aqueous reactions, heat and enthalpy, structure and bonding, and states of matter.
- **The course owner explicitly asked for** combustion equations and solubility rules, so each has its own full lesson.
- **Where to spend the most effort**: Ralph & Lewis (Chem. Educ. Res. Pract., 2018) found at-risk students struggle disproportionately with the **mole concept and stoichiometry**. These lessons get the richest animation. Limiting reactant studies report students believing either that both reactants are always fully used, or that only one is used whatever the proportions, and picking the limiting reactant by smallest mass rather than moles.

## Teaching rules the research gives us

- **Johnstone's three views.** Chemistry happens at three levels: what you can see (macroscopic), the particles (submicroscopic), and the notation (symbolic). Beginners get lost moving between them. Show them together and link them explicitly.
- **Learner-paced segments** (Mayer's segmenting principle). Animations are broken into short steps the learner advances, not a continuous video.
- **Signaling.** Highlight exactly what the caption is talking about.
- **Coherence.** Cut anything decorative that does not teach. Fun belongs in the voice and the characters, not in clutter around the concept.
- **Spatial contiguity.** Labels go on the thing, not in a legend.
- **Pre-training.** Name the parts before the process.
- **Hands-on control** (PhET). Students ask fewer questions and make fewer connections when they only watch. Every lesson gets something to change.
- **Math is a known barrier.** Measures of math preparation are among the strongest predictors of general chemistry grades. Never skip algebra steps, always show units canceling.
- **Retrieval practice.** Every lesson ends in questions that make you produce the answer, with endless fresh numbers.

## Lessons

Each entry lists what must be covered and the visuals that must exist. Builders may add more. Tag lessons with an `exam-chip` matching how often the topic is tested.

---

### Start here

**start: How to see chemistry** (`start.html`)
- What chemistry is. How this site works: watch the story, play with the lab, prove it in the gym, collect elements.
- Johnstone's three views: the same thing (a glass of water, boiling water, burning methane) as macro, particle, symbol. Make this the signature visual that recurs on the whole site.
- Powers of ten zoom: a smooth, scrubbable zoom from a person, to a hair, to a cell, to a molecule, to an atom, to a nucleus. Sizes must be correct.
- Math you will need: a quick self-check (scientific notation, rearranging an equation, ratios, percentages), with links to where each is taught.
- Must have: three-view explorer, powers-of-ten slider.

### Unit 1: Matter and measurement

**matter: What is stuff made of?** (`matter.html`)
- Solid, liquid, gas at the particle level, with a temperature slider. Plasma in one line.
- Elements, compounds, homogeneous and heterogeneous mixtures. Particle pictures of each. A sorting game.
- Physical vs chemical properties, intensive vs extensive. Physical vs chemical change: particle-level proof (melting keeps molecules, burning rearranges atoms). Signs of chemical change.
- Traps: dissolving is not a chemical change; boiling water does not break water molecules into H and O (the bubbles are water vapor).
- Must have: states of matter sim, classify-the-particle-picture game, change sorter.

**measurement: Measuring and significant figures** (`measurement.html`)
- SI base units, prefixes from nano to mega (a visual ladder). Scientific notation with an interactive decimal-point slider.
- Accuracy vs precision on a dartboard the learner throws at. Reading a scale: the meniscus and estimating one extra digit on a graduated cylinder.
- Significant figures: the rules visualized on real numbers (leading zeros, trailing zeros), a tap-to-count tool, the rules for multiplying and for adding, exact numbers.
- Traps: 100 vs 100. vs 1.00 × 10²; adding uses decimal places, multiplying uses sig figs.
- Must have: dartboard, meniscus reader, sig-fig counter, operation rule animator.

**conversions: Unit conversions and density** (`conversions.html`)
- Dimensional analysis as units that physically cancel: animate fractions flipping and crossing out. Chained conversions, squared and cubed units (1 m³ = 10⁶ cm³ shown as a cube of cubes).
- Density: particle spacing, float or sink tank, the rearrangements of d = m/V. Water displacement.
- Temperature: °C, K, °F on three linked thermometers. Absolute zero.
- Traps: flipping the conversion factor; 1 mL = 1 cm³; cubing the conversion.
- Must have: cancel-the-units animator (learner chooses fractions), float or sink tank with draggable objects, linked thermometers.

### Unit 2: Atoms, molecules and ions

**atoms: Inside the atom** (`atoms.html`)
- Law of conservation of mass, Dalton's postulates in brief, law of definite and multiple proportions.
- Thomson's cathode rays and plum pudding. Rutherford gold foil: a real simulator firing alpha particles at both models, deflection counts. Millikan in a line.
- Proton, neutron, electron: mass, charge, location. Scale: if the nucleus were a marble, the atom would be a stadium. Mostly empty space.
- Must have: gold foil simulator with model toggle, to-scale atom zoom, particle comparison.

**isotopes: Build an atom** (`isotopes.html`)
- Build-an-atom with drag or add buttons: protons set the element, neutrons set the isotope, electrons set the charge. Live symbol notation with A, Z and charge.
- Isotopes (hydrogen, carbon-12 and -14, chlorine-35 and -37). Weighted average atomic mass, shown as a mass spectrum and a see-saw balance point. Finding abundance from average mass.
- Traps: mass number vs atomic mass; average mass of Cl is 35.45 but no atom has that mass.
- Must have: atom builder, mass spectrometer animation, weighted average see-saw.

**periodic-intro: Meet the periodic table** (`periodic-intro.html`)
- Why it is arranged this way: Mendeleev's gaps, groups have similar properties. Periods and groups. Metals, nonmetals, metalloids.
- Families: alkali metals, alkaline earths, halogens, noble gases, transition metals, with vivid behavior (sodium and potassium in water, chlorine gas).
- Reading a tile. Predicting ion charge from group. Diatomic elements (H, N, O, F, Cl, Br, I; HONClBrIF).
- Must have: interactive table with highlight modes and tap-to-inspect tile, family reaction animations.

**compounds: Ions and compounds** (`compounds.html`)
- Cations and anions. Ionic vs molecular at particle level. Why ionic formulas are ratios (formula units) and molecular formulas count real molecules.
- Writing ionic formulas: charges must balance, criss-cross animator. Polyatomic ions: table with the ones to memorize (nitrate, sulfate, carbonate, phosphate, hydroxide, ammonium, acetate, and more) and a drill. Empirical vs molecular formula first look.
- Must have: charge-balancing builder where you add ions until net charge is zero, polyatomic ion flash drill.

**naming: Naming compounds** (`naming.html`)
- One flowchart: ionic or molecular or acid? Ionic with fixed charge; Roman numerals for transition metals; polyatomic ions; molecular prefixes (mono- through deca-); acids (hydro-, -ic, -ous; -ate to -ic, -ite to -ous); hydrates.
- Name to formula and formula to name, both directions.
- Must have: interactive flowchart that walks any compound through decisions, naming trainer with typed answers, both directions.

### Unit 3: The mole

**mole** is built already and is the reference for every other lesson.

**composition: Formulas from data** (`composition.html`)
- Percent composition, shown as a pie built from atom masses. Assuming 100 g.
- Empirical formula: percent to grams to moles to divide by smallest to whole numbers, as an animated pipeline. Multiplying when you get 1.5 or 1.33.
- Molecular formula from empirical formula and molar mass.
- Combustion analysis: burn an unknown, trap CO₂ and H₂O, work back to C and H and O. Animate the absorber tubes. This links to the combustion lesson.
- Must have: percent pie builder, empirical formula pipeline with learner-entered data, combustion analysis apparatus.

### Unit 4: Reactions and stoichiometry

**balancing: Balancing equations** (`balancing.html`)
- Conservation of atoms shown with countable atoms on both sides. Coefficients vs subscripts: changing a subscript makes a different substance (H₂O vs H₂O₂). Phase labels.
- Interactive balancer: tap coefficient arrows, atom-count bars and molecule pictures update, a balance tips and settles when correct. A method: leave O and H for last, polyatomics as a unit, clear fractions.
- Must have: the balancer with at least 12 equations and rising difficulty, subscript trap animation.

**reaction-types: The five reaction types** (`reaction-types.html`)
- Combination (synthesis), decomposition, single displacement, double displacement, combustion. Each as an animated dance of particles, with a pattern like A + B → AB.
- Predicting products from the pattern. Link forward to activity series, solubility and combustion lessons.
- Must have: animated pattern for each type, classify-the-equation game, predict-the-products practice.

**combustion: Combustion equations** (`combustion.html`) — **requested by the course owner; flagship lesson**
- What combustion is: a fuel reacting rapidly with O₂, releasing heat and light. Fire triangle.
- Complete combustion of hydrocarbons: products are always CO₂ and H₂O. Particle-level animation of methane burning, with atoms rearranging and counted. Molecular macro, particle, symbol view.
- Balancing method: **C first, then H, then O last**. Step-by-step animator for any hydrocarbon. When O₂ needs a fraction (C₂H₆ needs 7/2 O₂), double everything. Alkanes CₙH₂ₙ₊₂: methane through octane, general formula.
- Oxygen-containing fuels: methanol, ethanol, glucose. Account for O already in the fuel.
- Incomplete combustion: not enough O₂ gives CO and soot (C). The Bunsen burner air-hole slider: blue flame vs yellow sooty flame, with the equation changing. Why CO is dangerous.
- Combustion of non-carbon things: hydrogen, magnesium, sulfur. Combustion stoichiometry and energy preview (links to thermochemistry, combustion analysis).
- Traps: writing H₂ instead of H₂O as a product; forgetting O₂; coefficient fractions left in; counting O from both CO₂ and H₂O when balancing.
- Must have: methane reaction animation, the C-H-O balancer, Bunsen burner air slider, fuel gallery comparing CO₂ produced per fuel, typed practice writing balanced combustion equations.

**stoichiometry: Stoichiometry** (`stoichiometry.html`) — highest priority with `limiting`
- The coefficient is a mole ratio, shown with molecules then moles (recipe analogy first: 2 bread + 1 cheese makes 1 sandwich).
- The map: grams A to moles A to moles B to grams B. Learner walks problems on the map with units cancelling. Mass-to-mass, mass-to-moles, and particles.
- Trap: mole ratios use coefficients, mass ratios do not. Grams are never conserved per-substance, only in total.
- Must have: recipe animation, stoichiometry map walker, reaction visualizer where learner sets the reactant amount and sees product count.

**limiting: Limiting reactants and yield** (`limiting.html`) — highest priority with `stoichiometry`
- Sandwich analogy first, then real molecules. Interactive reactor: sliders for two reactants, particles combine until one runs out, leftover stays. Must directly confront both misconceptions: "everything always gets used up" and "the smaller mass is limiting".
- Two methods: mole-ratio comparison, and product-from-each. Theoretical, actual and percent yield. Excess remaining.
- Must have: molecule-level reactor with before and after tally and ICE-style table, limiting-reactant-by-mass surprise demo, percent yield filler.

### Unit 5: Reactions in water

**solutions: Solutions and molarity** (`solutions.html`)
- Solute, solvent, solution. Water polarity: why NaCl pulls apart, with water molecules turning to surround ions (hydration). Sugar dissolves whole.
- Electrolytes: strong, weak, non, with a conductivity light bulb that really responds. Molarity as particles per volume with a beaker. Dilution M₁V₁ = M₂V₂, adding water keeps the moles. Ion concentration in Al₂(SO₄)₃. Solution stoichiometry intro.
- Must have: dissolving animation at particle level, conductivity tester, molarity beaker with solute and volume sliders, dilution sim.

**solubility: Solubility rules** (`solubility.html`) — **requested by the course owner; flagship lesson**
- What "soluble" and "insoluble" mean at the particle level, and why (ion attraction vs hydration, shown as tug of war). Insoluble does not mean zero; the usual cutoff is about 0.01 M.
- The rules, taught in an order that sticks. **Always soluble:** group 1 ions, ammonium, nitrate, acetate, chlorate, perchlorate. **Usually soluble:** chlorides, bromides, iodides (except Ag⁺, Pb²⁺, Hg₂²⁺); sulfates (except Ba²⁺, Sr²⁺, Pb²⁺, Ca²⁺ and Ag⁺ slightly). **Usually insoluble:** carbonates, phosphates, sulfides, hydroxides (except group 1, ammonium, and Ca²⁺, Sr²⁺, Ba²⁺ moderately).
- Be honest that sources disagree on a few (CaSO₄, Ca(OH)₂, Ag₂SO₄), and to use the table their instructor gives. Mnemonics.
- Giant interactive grid: cation vs anion with every cell tappable, showing the compound and whether a beaker dissolves or forms a solid. Rule highlighter: tap a rule and see which cells it controls. Real precipitate colors where well known (AgCl white, PbI₂ yellow, Cu(OH)₂ blue, Fe(OH)₃ rust, BaSO₄ white).
- "Will it dissolve?" speed game with explanation citing the rule.
- Must have: the grid, the rule highlighter, the tug of war animation, the speed game.

**precipitation: Precipitation and net ionic equations** (`precipitation.html`)
- Mix two clear solutions; ions swap partners. Particle animation: spectators wander, the insoluble pair crashes out.
- Three equations: molecular, complete ionic, net ionic. Stepper that crosses out spectators. Which things to split into ions and which to leave whole (strong electrolytes split; solids, liquids, gases, weak do not).
- Must have: mix-any-two beakers lab using the solubility rules, net ionic stepper.

**acid-base: Acids, bases and titration** (`acid-base.html`)
- Arrhenius and Brønsted-Lowry definitions, proton transfer animated. Strong acids to memorize (HCl, HBr, HI, HNO₃, H₂SO₄, HClO₄) and strong bases. Neutralization: acid + base gives salt + water, net H⁺ + OH⁻ → H₂O.
- Titration: burette and flask sim with phenolphthalein turning pink at the equivalence point; particle view of H⁺ running out. Calculating unknown concentration.
- Must have: proton transfer animation, full titration simulator with data, reaction particle view.

**redox: Oxidation and reduction** (`redox.html`)
- Electron transfer: Zn in Cu²⁺ animated at the particle level with color change and copper forming. OIL RIG, LEO says GER. Oxidizing and reducing agents.
- Oxidation numbers: rules in priority order, tap-any-atom calculator. Activity series as a ladder: will this metal displace that one? Redox in combustion and corrosion. Half-reactions balancing in brief.
- Must have: Zn and Cu animation, oxidation number trainer, activity series lab.

### Unit 6: Energy and heat

**energy: Energy and heat** (`energy.html`)
- Kinetic and potential energy at the particle level. System and surroundings. Heat vs temperature (a bathtub vs a teacup). Exothermic and endothermic, with sign conventions and which way arrows go.
- Specific heat, q = mcΔT: the same heat into water, iron and sand shows different temperature rises. Rearranging for each variable. Units J, kJ, cal.
- Must have: heat-flow animation between system and surroundings, specific heat race, heat vs temperature comparison.

**calorimetry: Calorimetry** (`calorimetry.html`)
- Heat lost equals heat gained. Hot metal in cool water: slider sim with thermometer and particle speeds. Final temperature. Coffee-cup (constant pressure) vs bomb (constant volume). q to ΔH per mole.
- Trap: the sign of q for system vs for water.
- Must have: coffee cup lab with hot metal and reaction modes, bomb calorimeter animation.

**enthalpy: Enthalpy and Hess's law** (`enthalpy.html`)
- Enthalpy as heat at constant pressure. Thermochemical equations; scaling and reversing rules. Energy diagrams.
- Hess's law as a puzzle: reverse, scale and add reactions till they sum to the target. Standard enthalpy of formation, ΔH° = Σ products − Σ reactants. Bond enthalpy estimate: break bonds costs energy, make bonds pays energy. Combustion enthalpies.
- Must have: energy diagram explorer, Hess's law puzzle, formation-enthalpy calculator, break-and-make bond animation.

### Unit 7: Electrons and the periodic table

**light: Light and photons** (`light.html`)
- Waves: wavelength, frequency, amplitude with live slider. c = λν. The EM spectrum as a zoomable band. Planck: E = hν. Photoelectric effect simulator with threshold frequency (a classic). Photons as packets.
- Must have: wave explorer, spectrum band, photoelectric simulator.

**bohr: Line spectra and the Bohr atom** (`bohr.html`)
- Flame tests and neon signs: each element has a fingerprint. Hydrogen: click energy levels, the electron jumps and emits the right color photon, spectrum lines fill in. Rydberg calculation, absorption vs emission. Limits of Bohr.
- de Broglie wavelength and Heisenberg uncertainty in simple terms.
- Must have: Bohr atom jump simulator with real wavelengths, spectrum builder, flame test lab.

**orbitals: Orbitals and quantum numbers** (`orbitals.html`)
- From orbit to cloud: probability. Real 3D orbitals (use Chem3D orbital viewer, both cloud and balloon). n, l, mₗ, mₛ as an address system (building, floor, room, seat). Allowed combinations explorer, nodes, sizes and shapes s, p, d. Counting orbitals and electrons per shell.
- Must have: 3D orbital viewer controlled by quantum number selectors, address analogy, validity checker.

**configurations: Electron configurations** (`configurations.html`)
- Aufbau as a hotel or apartment block with energy floors. Pauli exclusion, Hund's rule on an interactive orbital-box diagram. Periodic table as a map of subshells. Noble-gas shorthand. Valence electrons. Ions (remove from highest n first; transition metals lose 4s first). Exceptions Cr and Cu.
- Must have: interactive orbital box filler for any atom up to Kr or beyond, periodic-block map, ion configuration tool.

**trends: Periodic trends** (`trends.html`)
- Effective nuclear charge and shielding as the explanation for all trends, animated. Atomic radius, ionic radius, ionization energy (and successive IE), electron affinity, electronegativity, metallic character. Real data from the element table as a 3D-feeling bar or tile map with trend arrows. Exceptions (Be to B, N to O).
- Must have: trend map switching between properties using real data, Zeff tug animation, successive ionization energy chart, rank-these game.

### Unit 8: Bonds and molecular shape

**ionic: Ionic bonds** (`ionic.html`)
- Na gives, Cl takes, with faces. Lewis dot notation for ions. Coulomb's law and lattice energy: charge and size slider. 3D NaCl lattice. Why ionic solids are brittle, high melting and conduct only when molten.
- Must have: electron transfer story, Coulomb slider, 3D lattice, brittleness animation.

**covalent: Covalent bonds and polarity** (`covalent.html`)
- H₂ energy well: drag two atoms, watch the energy curve; bond length and bond energy. Single, double, triple: length and strength. Electronegativity tug of war sliding from nonpolar to polar to ionic. Dipole notation. Bond order data.
- Must have: draggable H₂ energy curve, tug of war by element pairs, bond strength compare.

**lewis: Lewis structures** (`lewis.html`)
- The recipe as a stepper: count valence electrons, pick central atom, connect, complete outer octets, central atom, make multiple bonds. Formal charge calculator. Resonance as an average (show bond lengths). Exceptions: incomplete, odd and expanded octets. Interactive builder for many molecules and ions.
- Must have: step-by-step Lewis builder with electron counter, formal charge tool, resonance animation.

**vsepr: VSEPR and molecular shapes** (`vsepr.html`)
- Electron groups repel, balloons model. 3D viewer for every shape: linear, trigonal planar, bent, tetrahedral, trigonal pyramidal, trigonal bipyramidal, seesaw, T-shaped, octahedral, square pyramidal, square planar. Bond angles labeled. Electron geometry vs molecular geometry. Lone pairs squeeze angles. Molecular polarity by vector sum of dipoles (CO₂ vs H₂O).
- Must have: 3D shape explorer selecting groups and lone pairs, polarity vector tool, shape-matching game.

**hybrid: Hybrid orbitals and MO theory** (`hybrid.html`)
- Valence bond overlap, sigma and pi animated. sp, sp², sp³ mixing with 3D lobes. Counting sigma and pi bonds. Molecular orbital diagrams for second-period diatomics: fill electrons, compute bond order, predict paramagnetism (O₂ is magnetic).
- Must have: overlap animation, hybrid orbital 3D, MO diagram filler with bond order.

### Unit 9: Gases

**gas-laws: Pressure and the gas laws** (`gas-laws.html`)
- Pressure as particle collisions, barometer and units (atm, mmHg, torr, kPa). Piston simulator with hit counter. Boyle, Charles, Gay-Lussac, Avogadro, each with a live graph. Kelvin required.
- Must have: real particle sim with piston, temperature, particles, and pressure gauge, live graph, law-by-law challenges.

**ideal-gas: The ideal gas law** (`ideal-gas.html`)
- PV = nRT, with R units; combined gas law; density and molar mass from gas data; STP and molar volume 22.4 L. Gas stoichiometry. Dalton's law of partial pressures with colored particles; mole fraction; collecting a gas over water.
- Must have: PV=nRT solve-for-anything calculator with picture, partial pressure mixing sim, collecting over water animation, airbag stoichiometry story.

**kmt: Kinetic theory and real gases** (`kmt.html`)
- KMT postulates. Maxwell-Boltzmann distribution with live histogram from a real sim. Temperature means average KE. rms speed vs molar mass. Graham's law of effusion race. Diffusion. Real gases: when ideal fails, van der Waals corrections.
- Must have: live speed histogram, effusion race, real vs ideal compare.

### Unit 10: Liquids and solids

**imf: Intermolecular forces** (`imf.html`)
- Intra vs inter (the classic trap: boiling breaks IMFs, not bonds). London dispersion, dipole-dipole, hydrogen bonding, ion-dipole, with animations. Rank boiling points. Surface tension, viscosity, capillary action. Why ice floats.
- Must have: IMF identifier, animated forces at particle level, boiling point ranking game with real data, ice vs water structure.

**phases: Phase changes** (`phases.html`)
- Heating curve lab with real plateaus; calculating total heat with q = mcΔT and q = nΔH. Vapor pressure, evaporation equilibrium, boiling at altitude. Phase diagram of water and CO₂ with draggable state point; triple and critical points. Clausius-Clapeyron idea.
- Must have: heating curve sim linked to particle view, vapor pressure bell jar, draggable phase diagram.

**solids: Solids and crystals** (`solids.html`)
- Four kinds: ionic, molecular, covalent network, metallic with properties. Metallic bonding sea of electrons. 3D unit cells (sc, bcc, fcc) with counting atoms per cell (shared corners and faces), coordination number; density from unit cell. Diamond vs graphite.
- Must have: 3D unit cell viewer with fill toggle, atom-counting animation, solid type classifier.

### Unit 11: Solution properties

**solution-props: Solubility and colligative properties** (`solution-props.html`)
- Like dissolves like with polarity, oil and water animation; enthalpy of solution. Temperature effect on solids vs gases, Henry's law with a soda bottle. Saturated and supersaturated (the crystal drop). Concentration units: molality, mole fraction, mass percent, ppm. Colligative: vapor pressure lowering, boiling point elevation, freezing point depression with van 't Hoff factor, osmosis and osmotic pressure.
- Must have: like-dissolves-like animation, soda Henry's law sim, freezing point depression with ice and salt, osmosis U-tube.

### Going deeper: next-term topics

Keep these shorter than core lessons, at one to two stories and one or two benches each, while still fully correct and exam-ready.

- **kinetics: Reaction rates** (`kinetics.html`): collision theory sim with temperature and concentration, activation energy and catalysts on an energy diagram, rate laws and method of initial rates, integrated first-order and half-life.
- **equilibrium: Chemical equilibrium** (`equilibrium.html`): reversible reaction sim reaching dynamic balance, K and Q, ICE tables, Le Chatelier sim with learner stresses.
- **ph: pH and buffers** (`ph.html`): pH scale with real substances, logarithms made friendly, strong vs weak acids at particle level, Ka and Kb, conjugate pairs, buffer sim, Henderson-Hasselbalch.
- **thermo: Entropy and free energy** (`thermo.html`): spreading out microstates sim, second law, ΔG = ΔH − TΔS four-quadrant chart with temperature slider, spontaneity is not speed.
- **electrochem: Batteries and electrochemistry** (`electrochem.html`): galvanic cell animation with electrons, salt bridge; standard potentials, E°cell; electrolysis; Faraday calculation.
- **nuclear: Nuclear chemistry** (`nuclear.html`): alpha, beta, gamma with a decay equation builder, half-life sim with real dice-like decay, band of stability, fission chain reaction and fusion, E = mc² mass defect.
- **organic: A first look at organic chemistry** (`organic.html`): carbon's four bonds, alkanes to octane, naming, isomers, functional groups gallery in 3D. Connects to combustion.
