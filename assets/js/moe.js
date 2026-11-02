/* Moe the mole: one data-driven drawing used both as inline SVG (Moe.svg) and on canvas (Art.moe).
   Coordinates live in a 240 by 260 box. Feet rest on y = 252. */
(function () {
  'use strict';
  const FUR = '#7A58A8', FUR_DARK = '#5E4288', FUR_LIGHT = '#9676C4';
  const PINK = '#FF9EBB', PINK_DARK = '#E86F97', CLAW = '#FFE9C9';
  const COAT = '#FBF9FF', COAT_SHADE = '#DDD4EE', RIM = '#14B8CF', LENS = '#E9FBFF', INK = '#22123A';

  const circle = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
  const ellipse = (x, y, rx, ry) => `M${x - rx} ${y}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0Z`;

  /** A spade-shaped digging paw with four claws, centered on (x, y), rotated by rot degrees. */
  function paw(x, y, rot, s = 1) {
    const T = (px, py) => {
      const a = (rot * Math.PI) / 180, c = Math.cos(a), d = Math.sin(a);
      return `${(x + (px * c - py * d) * s).toFixed(1)} ${(y + (px * d + py * c) * s).toFixed(1)}`;
    };
    const palm = `M${T(-15, 8)}C${T(-20, -6)} ${T(-14, -17)} ${T(0, -18)}C${T(14, -17)} ${T(20, -6)} ${T(15, 8)}C${T(11, 18)} ${T(-11, 18)} ${T(-15, 8)}Z`;
    let claws = '';
    [[-13, -5], [-5, -11], [5, -11], [13, -5]].forEach(([cx, cy]) => {
      const dx = cx * 0.28, tipY = cy - 13;
      claws += `M${T(cx - 3.6, cy)}Q${T(cx + dx - 1.2, cy - 8)} ${T(cx + dx, tipY)}Q${T(cx + dx + 1.8, cy - 8)} ${T(cx + 3.6, cy)}Z`;
    });
    return [{ d: claws, fill: CLAW, stroke: INK, sw: 2 }, { d: palm, fill: PINK, stroke: INK, sw: 3 }];
  }
  const arm = (d) => ({ d, fill: 'none', stroke: FUR_DARK, sw: 20, cap: 'round' });

  const POSES = {
    rest: { left: [arm('M56 166C44 178 38 190 36 202'), ...paw(35, 206, 196)], right: [arm('M184 166C196 178 202 190 204 202'), ...paw(205, 206, 164)] },
    wave: { left: [arm('M56 166C44 178 38 190 36 202'), ...paw(35, 206, 196)], right: [arm('M184 160C204 150 212 128 214 108'), ...paw(215, 98, 14)] },
    cheer: { left: [arm('M56 160C36 148 28 124 26 104'), ...paw(25, 94, -14)], right: [arm('M184 160C204 148 212 124 214 104'), ...paw(215, 94, 14)] },
    point: { left: [arm('M56 166C44 178 38 190 36 202'), ...paw(35, 206, 196)], right: [arm('M184 164C200 164 214 162 226 158'), ...paw(232, 156, 76)] },
    think: { left: [arm('M56 166C44 178 38 190 36 202'), ...paw(35, 206, 196)], right: [arm('M184 172C176 176 164 172 158 160'), ...paw(150, 148, -26, 0.92)] },
    wow: { left: [arm('M56 164C40 160 28 150 22 138'), ...paw(18, 128, -24)], right: [arm('M184 164C200 160 212 150 218 138'), ...paw(222, 128, 24)] },
    oops: { left: [arm('M56 166C44 178 38 190 36 202'), ...paw(35, 206, 196)], right: [arm('M184 158C204 148 206 110 190 92'), ...paw(184, 76, -30, 0.92)] },
  };

  const MOODS = {
    happy: { pose: 'rest', eye: 'open', mouth: 'smile' },
    wave: { pose: 'wave', eye: 'open', mouth: 'smile' },
    cheer: { pose: 'cheer', eye: 'joy', mouth: 'open' },
    point: { pose: 'point', eye: 'right', mouth: 'smile' },
    think: { pose: 'think', eye: 'up', mouth: 'hmm' },
    wow: { pose: 'wow', eye: 'big', mouth: 'o' },
    oops: { pose: 'oops', eye: 'worry', mouth: 'wobble' },
  };

  function eyeParts(kind) {
    const L = 90, R = 150, Y = 82;
    const pupil = (dx, dy, r = 10) => [
      { d: ellipse(L + dx, Y + dy, r, r * 1.14), fill: INK, eye: 1 }, { d: ellipse(R + dx, Y + dy, r, r * 1.14), fill: INK, eye: 1 },
      { d: circle(L + dx + r * 0.32, Y + dy - r * 0.42, r * 0.34), fill: '#fff', eye: 1 }, { d: circle(R + dx + r * 0.32, Y + dy - r * 0.42, r * 0.34), fill: '#fff', eye: 1 },
    ];
    if (kind === 'joy') {
      return [`M${L - 13} ${Y + 5}Q${L} ${Y - 15} ${L + 13} ${Y + 5}`, `M${R - 13} ${Y + 5}Q${R} ${Y - 15} ${R + 13} ${Y + 5}`].map((d) => ({ d, fill: 'none', stroke: INK, sw: 5, cap: 'round' }));
    }
    if (kind === 'right') return pupil(6, 1);
    if (kind === 'up') return pupil(4, -6);
    if (kind === 'big') return pupil(0, 0, 13);
    if (kind === 'worry') {
      return [...pupil(0, 3, 9),
        { d: `M${L - 13} ${Y - 16}L${L + 11} ${Y - 22}`, fill: 'none', stroke: INK, sw: 4, cap: 'round' },
        { d: `M${R + 13} ${Y - 16}L${R - 11} ${Y - 22}`, fill: 'none', stroke: INK, sw: 4, cap: 'round' }];
    }
    return pupil(0, 0);
  }
  function mouthParts(kind) {
    const teeth = { d: 'M113 140h6.5v9a2.6 2.6 0 0 1-2.6 2.6h-1.3a2.6 2.6 0 0 1-2.6-2.6zM120.5 140h6.5v9a2.6 2.6 0 0 1-2.6 2.6h-1.3a2.6 2.6 0 0 1-2.6-2.6z', fill: '#fff', stroke: INK, sw: 2 };
    if (kind === 'open') return [{ d: 'M101 136C108 142 132 142 139 136C138 158 102 158 101 136Z', fill: '#7B1E45', stroke: INK, sw: 3.5 }, { d: 'M112 138.8h7.5v7h-7.5zM120.5 138.8h7.5v7h-7.5z', fill: '#fff' }];
    if (kind === 'o') return [{ d: ellipse(120, 146, 8, 10), fill: '#7B1E45', stroke: INK, sw: 3.5 }];
    if (kind === 'hmm') return [{ d: 'M110 143Q120 139 132 144', fill: 'none', stroke: INK, sw: 3.5, cap: 'round' }];
    if (kind === 'wobble') return [{ d: 'M104 145q5-6 10 0t10 0t10 0', fill: 'none', stroke: INK, sw: 3.5, cap: 'round' }];
    return [teeth, { d: 'M104 136Q120 147 136 136', fill: 'none', stroke: INK, sw: 3.5, cap: 'round' }];
  }

  /** All parts for a mood, back to front. */
  function parts(mood) {
    const m = MOODS[mood] || MOODS.happy;
    const pose = POSES[m.pose];
    const body = 'M120 22C164 22 186 58 188 104C190 132 208 162 206 198C204 238 162 250 120 250C78 250 36 238 34 198C32 162 50 132 52 104C54 58 76 22 120 22Z';
    const coat = 'M64 150C52 170 38 182 36 204C35 240 80 250 120 250C160 250 205 240 204 204C202 182 188 170 176 150C166 164 142 176 120 200C98 176 74 164 64 150Z';
    return [
      { d: ellipse(82, 250, 26, 10), fill: PINK, stroke: INK, sw: 3 },
      { d: ellipse(158, 250, 26, 10), fill: PINK, stroke: INK, sw: 3 },
      { d: body, fill: FUR, stroke: INK, sw: 4 },
      { d: 'M120 22C164 22 186 58 188 104C188 74 170 40 120 40C72 40 54 74 52 104C54 58 76 22 120 22Z', fill: FUR_LIGHT, opacity: 0.55 },
      { d: 'M112 26C110 16 104 12 98 12M122 24C122 14 124 8 130 5M132 27C136 19 142 17 148 18', fill: 'none', stroke: INK, sw: 3.6, cap: 'round' },
      { d: coat, fill: COAT, stroke: INK, sw: 3.5 },
      { d: 'M120 200V250', fill: 'none', stroke: COAT_SHADE, sw: 3 },
      { d: 'M64 150C74 164 98 176 120 200C106 186 92 180 74 178C68 170 66 160 64 150Z', fill: COAT_SHADE },
      { d: 'M176 150C166 164 142 176 120 200C134 186 148 180 166 178C172 170 174 160 176 150Z', fill: COAT_SHADE },
      { d: 'M146 208h34v22a5 5 0 0 1-5 5h-24a5 5 0 0 1-5-5z', fill: '#EFE9FA', stroke: INK, sw: 2.6 },
      { d: 'M155 196h8v28a4 4 0 0 1-8 0z', fill: '#fff', stroke: INK, sw: 2.2 },
      { d: 'M155.8 210h6.4v14a3.2 3.2 0 0 1-6.4 0z', fill: '#F0278F' },
      { d: 'M166 200h7v20h-7z', fill: RIM, stroke: INK, sw: 2.2 },
      ...pose.left, ...pose.right,
      { d: ellipse(68, 118, 14, 9), fill: PINK, opacity: 0.55 },
      { d: ellipse(172, 118, 14, 9), fill: PINK, opacity: 0.55 },
      { d: 'M52 84H66M174 84H188', fill: 'none', stroke: INK, sw: 9, cap: 'round' },
      { d: 'M112 82C116 76 124 76 128 82', fill: 'none', stroke: RIM, sw: 7, cap: 'round' },
      { d: circle(90, 82, 25), fill: LENS, stroke: RIM, sw: 8 },
      { d: circle(150, 82, 25), fill: LENS, stroke: RIM, sw: 8 },
      { d: circle(90, 82, 29.5), fill: 'none', stroke: INK, sw: 2.2 },
      { d: circle(150, 82, 29.5), fill: 'none', stroke: INK, sw: 2.2 },
      ...eyeParts(m.eye),
      { d: 'M76 70L84 64', fill: 'none', stroke: '#fff', sw: 3.4, cap: 'round', opacity: 0.9 },
      { d: 'M136 70L144 64', fill: 'none', stroke: '#fff', sw: 3.4, cap: 'round', opacity: 0.9 },
      { d: 'M74 124L46 118M74 131L46 133M166 124L194 118M166 131L194 133', fill: 'none', stroke: INK, sw: 2.4, cap: 'round', opacity: 0.7 },
      { d: ellipse(120, 121, 22, 16), fill: PINK, stroke: INK, sw: 3.5 },
      { d: ellipse(114, 115, 7, 3.6), fill: '#fff', opacity: 0.75 },
      { d: `${circle(112.5, 124, 2.6)}${circle(127.5, 124, 2.6)}`, fill: PINK_DARK },
      ...mouthParts(m.mouth),
    ];
  }

  const VIEW = '0 0 240 260';
  const Moe = (window.Moe = {
    parts,
    moods: Object.keys(MOODS),
    /** Inline SVG markup. Eyes get a class so CSS can make Moe blink. */
    svg(mood = 'happy', { title } = {}) {
      const list = parts(mood);
      const shape = (p) => `<path d="${p.d}" fill="${p.fill}"${p.stroke ? ` stroke="${p.stroke}" stroke-width="${p.sw}"` : ''}${p.cap ? ' stroke-linecap="round"' : ''}${p.opacity ? ` opacity="${p.opacity}"` : ''} stroke-linejoin="round"/>`;
      let out = '', inEye = false;
      list.forEach((p) => {
        if (p.eye && !inEye) { out += '<g class="moe-eyes">'; inEye = true; }
        if (!p.eye && inEye) { out += '</g>'; inEye = false; }
        out += shape(p);
      });
      if (inEye) out += '</g>';
      return `<svg class="moe-svg" viewBox="${VIEW}" ${title ? `role="img" aria-label="${title}"` : 'aria-hidden="true"'}>${out}</svg>`;
    },
    /** Draw on a canvas with feet centered at (x, y). height is in canvas units. */
    draw(g, x, y, height = 160, mood = 'happy', { flip = false, t = 0, bob = true } = {}) {
      const s = height / 260;
      const list = parts(mood);
      const blink = (t % 3.7) > 3.56;
      g.save();
      g.translate(x, y + (bob ? Math.sin(t * 2.1) * 1.4 : 0));
      g.scale(flip ? -s : s, s * (bob ? 1 + Math.sin(t * 2.1 + 0.6) * 0.006 : 1));
      g.translate(-120, -260);
      g.lineJoin = 'round';
      list.forEach((p) => {
        if (p.eye && blink) return;
        const path = p.path || (p.path = new Path2D(p.d));
        g.globalAlpha = p.opacity || 1;
        if (p.fill && p.fill !== 'none') { g.fillStyle = p.fill; g.fill(path); }
        if (p.stroke) { g.strokeStyle = p.stroke; g.lineWidth = p.sw; g.lineCap = p.cap || 'butt'; g.stroke(path); }
      });
      g.globalAlpha = 1;
      if (blink) {
        g.strokeStyle = INK; g.lineWidth = 5; g.lineCap = 'round';
        g.beginPath(); g.moveTo(78, 84); g.lineTo(102, 84); g.moveTo(138, 84); g.lineTo(162, 84); g.stroke();
      }
      g.restore();
    },
  });
})();
