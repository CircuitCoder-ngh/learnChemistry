/* Lesson 7.2: Line spectra and the Bohr atom. Wavelengths are computed from the Rydberg constant, colors from wavelength. */
Lab.ready(function () {
  'use strict';
  const { seg, ease, clamp, lerp, wander, rand } = Lab;
  const C = Art.C;
  const TAU = Math.PI * 2;
  const h = 6.626e-34, c = 2.998e8, RJ = 2.18e-18, R = 1.097e7, eV = 1.602e-19, me = 9.109e-31;

  const levelJ = (n) => -RJ / (n * n);
  const levelEV = (n) => levelJ(n) / eV;
  /** Wavelength of a hydrogen jump between two levels, in nm. */
  const jumpNm = (a, b) => 1e9 / (R * Math.abs(1 / (a * a) - 1 / (b * b)));
  const jumpJ = (a, b) => Math.abs(levelJ(a) - levelJ(b));

  function waveRGB(nm) {
    let r = 0, gr = 0, b = 0;
    if (nm >= 380 && nm < 440) { r = (440 - nm) / 60; b = 1; }
    else if (nm >= 440 && nm < 490) { gr = (nm - 440) / 50; b = 1; }
    else if (nm >= 490 && nm < 510) { gr = 1; b = (510 - nm) / 20; }
    else if (nm >= 510 && nm < 580) { r = (nm - 510) / 70; gr = 1; }
    else if (nm >= 580 && nm < 645) { r = 1; gr = (645 - nm) / 65; }
    else if (nm >= 645 && nm <= 780) { r = 1; }
    let f = 1;
    if (nm >= 380 && nm < 420) f = 0.62 + (0.38 * (nm - 380)) / 40;
    else if (nm > 700 && nm <= 780) f = 0.62 + (0.38 * (780 - nm)) / 80;
    const v = (x) => Math.round(255 * Math.pow(x * f, 0.8));
    return [v(r), v(gr), v(b)];
  }
  function lightColor(nm) {
    if (nm < 380) return '#C9B6FF';
    if (nm > 780) return '#C96A5A';
    const [r, gg, b] = waveRGB(nm);
    return `rgb(${r},${gg},${b})`;
  }
  const textColor = (nm) => Art.mix(lightColor(nm), '#ffffff', nm < 450 ? 0.5 : 0.28);

  /* ---------- Shared art ---------- */
  function photon(g, x, y, nm, o = {}) {
    const len = o.len || 76, amp = o.amp || 15, ang = o.ang || 0, col = lightColor(nm);
    const lam = o.lam || clamp(nm * 0.042, 7, 40);
    g.save();
    g.translate(x, y); g.rotate(ang);
    if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
    Art.glow(g, 0, 0, len * 0.6, col, 0.45);
    g.strokeStyle = col; g.lineWidth = o.w || 4; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath();
    const sd = len * 0.25;
    for (let s = -len / 2; s <= len / 2; s += 1.5) {
      const env = Math.exp(-(s * s) / (2 * sd * sd));
      const yy = amp * env * Math.sin((TAU * s) / lam + (o.phase || 0));
      if (s === -len / 2) g.moveTo(s, yy); else g.lineTo(s, yy);
    }
    g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = (o.w || 4) * 0.3; g.stroke();
    g.restore();
  }
  /** Spectrum strip for wavelengths nm0..nm1. Bright lines on black, or dark lines on a rainbow when o.absorb. */
  function strip(g, x0, x1, y, hgt, lines, o = {}) {
    const a = o.nm0 || 380, b = o.nm1 || 750;
    const X = (nm) => x0 + ((nm - a) / (b - a)) * (x1 - x0);
    g.save();
    Art.round(g, x0, y, x1 - x0, hgt, 7); g.save(); g.clip();
    g.fillStyle = '#07040F'; g.fillRect(x0, y, x1 - x0, hgt);
    if (o.rainbow !== undefined && o.rainbow > 0) {
      g.globalAlpha *= o.rainbow;
      for (let px = 0; px < x1 - x0; px += 2) { g.fillStyle = lightColor(lerp(a, b, px / (x1 - x0))); g.fillRect(x0 + px, y, 2.5, hgt); }
      g.globalAlpha /= o.rainbow;
    }
    lines.forEach((nm, i) => {
      const q = o.q ? o.q(i) : 1;
      if (q <= 0) return;
      const x = X(nm);
      if (o.dark) { g.fillStyle = `rgba(4,2,10,${q})`; g.fillRect(x - (o.w || 2.5), y, (o.w || 2.5) * 2, hgt); }
      else {
        g.globalAlpha = q;
        Art.glow(g, x, y + hgt / 2, 14 + hgt * 0.34, lightColor(nm), 0.55);
        g.fillStyle = lightColor(nm); g.fillRect(x - (o.w || 2), y, (o.w || 2) * 2, hgt);
        g.globalAlpha = 1;
      }
    });
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 2.5; Art.round(g, x0, y, x1 - x0, hgt, 7); g.stroke();
    g.restore();
    return X;
  }
  function prism(g, x, y, s) {
    const gr = g.createLinearGradient(x - s, y, x + s, y);
    gr.addColorStop(0, 'rgba(210,235,255,.55)'); gr.addColorStop(0.5, 'rgba(255,255,255,.26)'); gr.addColorStop(1, 'rgba(170,200,255,.5)');
    g.fillStyle = gr; g.strokeStyle = C.glass; g.lineWidth = 3.5; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s * 0.95, y + s * 0.72); g.lineTo(x - s * 0.95, y + s * 0.72); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(x - s * 0.1, y - s * 0.64); g.lineTo(x - s * 0.62, y + s * 0.44); g.stroke();
  }
  /** A glowing discharge tube between (x, y0) and (x, y1). */
  function gasTube(g, x, y0, y1, col, t, on = 1) {
    if (on > 0) Art.glow(g, x, (y0 + y1) / 2, (y1 - y0) * 0.72, col, 0.5 * on);
    const w = 34;
    g.fillStyle = 'rgba(214,240,255,.08)'; g.strokeStyle = C.glass; g.lineWidth = 3.5;
    Art.round(g, x - w / 2, y0, w, y1 - y0, w / 2); g.fill(); g.stroke();
    if (on > 0) {
      const flick = 0.88 + 0.12 * Math.sin(t * 31) * Math.sin(t * 13);
      const gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
      gr.addColorStop(0, Art.alpha(col, 0.2)); gr.addColorStop(0.5, Art.alpha(Art.mix(col, '#ffffff', 0.45), 0.98 * flick * on)); gr.addColorStop(1, Art.alpha(col, 0.2));
      g.fillStyle = gr; Art.round(g, x - w / 2 + 4, y0 + 16, w - 8, y1 - y0 - 32, 10); g.fill();
    }
    g.fillStyle = '#8F8DA6'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
    Art.round(g, x - 22, y0 - 12, 44, 20, 5); g.fill(); g.stroke();
    Art.round(g, x - 22, y1 - 8, 44, 20, 5); g.fill(); g.stroke();
  }
  /** A flame in any color, for flame tests. */
  function colorFlame(g, x, y, fh, t, col, mix = 1) {
    const f1 = Math.sin(t * 13) * 0.05 + Math.sin(t * 21 + 1) * 0.03;
    const sway = Math.sin(t * 9) * fh * 0.035 + Math.sin(t * 17) * fh * 0.02;
    const c0 = Art.mix('#3D7BFF', col, mix), c1 = Art.mix('#7FD4FF', Art.mix(col, '#ffffff', 0.25), mix), c2 = Art.mix('#CFF4FF', Art.mix(col, '#ffffff', 0.68), mix);
    Art.glow(g, x, y - fh * 0.45, fh * 1.15, c0, 0.42);
    [[1, c0, 0.78], [0.74, c1, 0.92], [0.46, c2, 1]].forEach(([s, cl, a], i) => {
      const hh = fh * s * (1 + f1 * (i + 1) * 0.7), w = fh * 0.34 * s;
      g.fillStyle = Art.alpha(cl, a);
      g.beginPath(); g.moveTo(x, y);
      g.bezierCurveTo(x - w * 1.25, y - hh * 0.12, x - w * 0.95 + sway * 0.3, y - hh * 0.56, x + sway * (1 + i * 0.25), y - hh);
      g.bezierCurveTo(x + w * 0.95 + sway * 0.3, y - hh * 0.56, x + w * 1.25, y - hh * 0.12, x, y);
      g.fill();
    });
  }
  const RING = [0, 44, 72, 100, 128, 156, 184];
  /** Nucleus and allowed rings. rs gives each ring's radius. */
  function bohrAtom(g, cx, cy, rs, top, o = {}) {
    g.save();
    for (let n = 1; n <= top; n++) {
      const a = o.ringAlpha ? o.ringAlpha(n) : 1;
      if (a <= 0) continue;
      g.strokeStyle = o.hi === n ? Art.alpha(C.sun, a) : Art.alpha('#ffffff', 0.34 * a);
      g.lineWidth = o.hi === n ? 3.5 : 2.2;
      g.setLineDash(o.hi === n ? [] : [6, 7]);
      g.beginPath(); g.arc(cx, cy, rs[n], 0, TAU); g.stroke();
    }
    g.restore();
    Art.glow(g, cx, cy, 34, C.proton, 0.4);
    Art.proton(g, cx, cy, 15);
  }
  /** Ladder of real energies. yOf maps n to y. */
  const yOfN = (n, top, bot) => top + (bot - top) / (n * n);
  function electronChar(g, x, y, r, mood, t, look) {
    Art.glow(g, x, y, r * 2, C.electron, 0.4);
    Art.atom(g, x, y, r, 'e', { label: false, face: mood, t, look: look || [0, 0], color: C.electron });
  }

  /** The two close violet labels are nudged apart so they stay readable. */
  const labelDx = (nm) => (nm < 420 ? -9 : nm < 440 ? 9 : 0);

  /* ---------- Flame test and gas tube lab ---------- */
  const SAMPLES = {
    Li: { kind: 'flame', name: 'Lithium', color: '#E8123F', colorName: 'crimson', lines: [460.3, 610.4, 670.8], main: 670.8, salt: '#F3EEF9', note: 'Lithium salts make the deep red in some fireworks.' },
    Na: { kind: 'flame', name: 'Sodium', color: '#FFC400', colorName: 'bright yellow', lines: [589.0, 589.6], main: 589.0, salt: '#F7F5FB', note: 'Almost all of its visible glow is one close pair of lines, near 589 nm. Old orange street lamps use this same light.' },
    K: { kind: 'flame', name: 'Potassium', color: '#C58CFF', colorName: 'lilac', lines: [404.4, 404.7, 766.5, 769.9], main: 766.5, salt: '#EFEAF8', note: 'It glows at both ends of the spectrum, deep red and violet, which your eye blends into lilac.' },
    Ca: { kind: 'flame', name: 'Calcium', color: '#FF6A2A', colorName: 'orange-red', lines: [422.7, 558.9, 612.2, 616.2, 643.9, 646.3], main: 422.7, salt: '#F7F3EC', note: 'Glowing CaOH molecules in the flame also add to the orange color. The lines shown here are from calcium atoms.' },
    Sr: { kind: 'flame', name: 'Strontium', color: '#FF2436', colorName: 'bright red', lines: [460.7, 640.8, 650.4, 687.8, 707.0], main: 460.7, salt: '#F0ECF4', note: 'This is the red of red fireworks and road flares. Glowing molecules such as SrOH add to the red. The lines shown are from strontium atoms.' },
    Ba: { kind: 'flame', name: 'Barium', color: '#B8F05A', colorName: 'pale green', lines: [455.4, 493.4, 553.5, 577.8, 614.2], main: 553.5, salt: '#F4F7EC', note: 'This is the green of green fireworks. Glowing molecules also add to the flame color. The lines shown are from barium atoms and ions.' },
    Cu: { kind: 'flame', name: 'Copper', color: '#2FE0B0', colorName: 'blue-green', lines: [510.6, 515.3, 521.8, 578.2], main: 515.3, salt: '#3FA7E8', note: 'Copper compounds also glow as molecules in the flame, so the color can lean more blue with chloride. The lines shown are from copper atoms.' },
    H: { kind: 'gas', name: 'Hydrogen', color: '#FF62AE', colorName: 'pink', lines: [410.2, 434.0, 486.1, 656.3], main: 656.3, note: 'Only four lines. The rest of this lesson explains exactly where they come from.' },
    He: { kind: 'gas', name: 'Helium', color: '#FFC9A8', colorName: 'peach', lines: [447.1, 471.3, 492.2, 501.6, 587.6, 667.8, 706.5], main: 587.6, note: 'Helium was found on the Sun before Earth, thanks to the line at 587.6 nm.' },
    Ne: { kind: 'gas', name: 'Neon', color: '#FF5A1F', colorName: 'orange-red', lines: [540.1, 585.2, 588.2, 594.5, 603.0, 607.4, 614.3, 616.4, 621.7, 626.6, 633.4, 638.3, 640.2, 650.7, 653.3, 659.9, 692.9, 703.2], main: 640.2, note: 'This is the true color of a neon sign. Signs in other colors usually hold other gases or colored coatings.' },
    Hg: { kind: 'gas', name: 'Mercury', color: '#B9D4FF', colorName: 'blue-white', lines: [404.7, 435.8, 546.1, 577.0, 579.1], main: 546.1, note: 'Fluorescent lamps run on mercury vapor, and a coating turns its light into white.' },
  };
  const DISH = ['Li', 'Na', 'K', 'Ca', 'Sr', 'Ba', 'Cu'];
  const dishX = (i) => 330 + i * 72;
  const fl = { sym: 'Na', prev: 'Na', t0: -5, mystery: null, solved: false };
  const flameSeg = { salt: null, gas: null };
  const flameStage = Lab.stage('#c-flame', {
    bg: 'lab', h: 480,
    label: 'A Bunsen burner or gas tube glows. Its light passes through a prism, which spreads it into bright lines on a strip from 380 to 780 nanometers.',
    onPointer(e) {
      if (e.type === 'hover') {
        const hov = e.y > 380 && DISH.some((_, i) => Math.abs(e.x - dishX(i)) < 34);
        flameStage.canvas.style.cursor = hov ? 'pointer' : 'default'; return;
      }
      if (e.type !== 'down' || e.y < 380 || fl.mystery) return;
      const i = DISH.findIndex((_, k) => Math.abs(e.x - dishX(k)) < 36);
      if (i >= 0) pickSample(DISH[i]);
    },
    draw(g, t) {
      const H = 480, benchY = H - 70;
      const s = SAMPLES[fl.sym], e = Math.max(0, t - fl.t0);
      const hide = !!fl.mystery && !fl.solved;
      const srcX = 158;
      // Spectrum strip, with rays from the prism.
      const sx0 = 306, sx1 = 782, sy = 42, sh = 50;
      const prX = 548, prY = 212;
      const arrive = s.kind === 'gas' ? clamp(e * 2) : seg(e, 1.5, 1.95);
      const flameMix = ease.out(arrive);
      const glowCol = s.kind === 'gas' ? s.color : Art.mix('#3D7BFF', s.color, flameMix);
      // Light beam from the source to the prism.
      const beamY = 212;
      const beam = g.createLinearGradient(srcX, 0, prX, 0);
      beam.addColorStop(0, Art.alpha(glowCol, 0.55)); beam.addColorStop(1, Art.alpha(glowCol, 0.32));
      g.fillStyle = beam;
      g.beginPath(); g.moveTo(srcX + 12, beamY - 26); g.lineTo(prX - 30, prY - 12); g.lineTo(prX - 30, prY + 12); g.lineTo(srcX + 12, beamY + 26); g.closePath(); g.fill();
      const X0 = (nm) => sx0 + ((nm - 380) / 400) * (sx1 - sx0);
      s.lines.forEach((nm) => {
        const col = lightColor(nm);
        g.strokeStyle = Art.alpha(col, 0.55 * arrive); g.lineWidth = 3;
        g.beginPath(); g.moveTo(prX, prY - 22); g.lineTo(X0(nm), sy + sh); g.stroke();
      });
      prism(g, prX, prY, 52);
      Art.text(g, 'prism', prX + 62, prY + 28, { size: 24, color: C.dim, align: 'left' });
      strip(g, sx0, sx1, sy, sh, s.lines, { nm0: 380, nm1: 780, q: () => arrive, w: s.lines.length > 10 ? 1.4 : 2 });
      [400, 500, 600, 700].forEach((nm) => {
        const x = X0(nm);
        g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(x - 1, sy + sh, 2.4, 8);
        Art.text(g, String(nm), x, sy + sh + 24, { size: 21, color: C.dim, halo: true });
      });
      Art.text(g, `${s.main} nm`, Lab.clamp(X0(s.main), sx0 + 40, sx1 - 40), 22, { size: 22, color: textColor(s.main), alpha: arrive, halo: true });
      Art.text(g, 'spectrum', 228, 66, { size: 26, color: C.dim, alpha: 1 });
      // Salt dishes.
      if (s.kind === 'flame') {
        DISH.forEach((sym, i) => {
          const x = dishX(i), S = SAMPLES[sym];
          g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(x, benchY + 7, 33, 7, 0, 0, TAU); g.fill();
          g.fillStyle = '#E8E4F4'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 2.5;
          g.beginPath(); g.ellipse(x, benchY - 6, 32, 11, 0, 0, TAU); g.fill(); g.stroke();
          g.fillStyle = S.salt; g.beginPath(); g.ellipse(x, benchY - 8, 23, 7, 0, 0, TAU); g.fill();
          const on = sym === fl.sym && !hide;
          if (on) Art.ring(g, x, benchY + 34, 22, { color: C.sun, w: 3 });
          Art.text(g, hide ? '?' : sym, x, benchY + 34, { size: 26, font: 'display', color: on ? C.sun : '#fff' });
        });
      }
      // Source.
      if (s.kind === 'flame') {
        const base = Art.bunsen(g, srcX, benchY + 2, 1.14, { air: 1, flame: 0, t });
        const fh = lerp(128, 176, flameMix);
        colorFlame(g, base.flameX, base.flameY, fh, t, s.color, flameMix);
        // The wire loop: to the dish, a dip, then into the flame.
        const dish = hide ? { x: 500, y: benchY - 30 } : { x: dishX(DISH.indexOf(fl.sym)), y: benchY - 18 };
        const flameP = { x: base.flameX + 8, y: base.flameY - 56 };
        const rest = { x: 300, y: 300 };
        let lx, ly;
        if (e < 0.55) { const q = ease.inOut(e / 0.55); lx = lerp(rest.x, dish.x, q); ly = lerp(rest.y, dish.y - 40, q); }
        else if (e < 0.95) { const q = Math.sin(((e - 0.55) / 0.4) * Math.PI); lx = dish.x; ly = lerp(dish.y - 40, dish.y, q); }
        else if (e < 1.6) { const q = ease.inOut((e - 0.95) / 0.65); lx = lerp(dish.x, flameP.x, q); ly = lerp(dish.y - 40, flameP.y, q) - Math.sin(q * Math.PI) * 30; }
        else { lx = flameP.x; ly = flameP.y; }
        g.strokeStyle = '#D9D1EC'; g.lineWidth = 4; g.lineCap = 'round';
        g.beginPath(); g.moveTo(lx + 12, ly + 3); g.lineTo(lx + 136, ly + 58); g.stroke();
        g.strokeStyle = '#5D3B24'; g.lineWidth = 12;
        g.beginPath(); g.moveTo(lx + 124, ly + 53); g.lineTo(lx + 198, ly + 86); g.stroke();
        g.strokeStyle = e > 0.75 && e < 2 ? s.salt : '#D9D1EC'; g.lineWidth = 4;
        g.beginPath(); g.arc(lx, ly, 12, 0, TAU); g.stroke();
      } else {
        // Power supply and tube.
        g.fillStyle = '#4A3F68'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
        Art.round(g, srcX - 70, benchY - 38, 140, 44, 8); g.fill(); g.stroke();
        Art.text(g, '5000 V', srcX, benchY - 15, { size: 24, color: C.sun });
        g.strokeStyle = '#8F8DA6'; g.lineWidth = 6;
        g.beginPath(); g.moveTo(srcX, benchY - 40); g.lineTo(srcX, 342); g.stroke();
        gasTube(g, srcX, 96, 340, s.color, t, arrive);
      }
      const title = hide ? 'Mystery sample' : s.name;
      Art.text(g, title, 548, 306, { size: 38, font: 'display', color: Art.mix(s.color, '#ffffff', 0.2), halo: true });
      Art.text(g, hide ? 'Read its lines to name it' : s.colorName, 548, 344, { size: 26, halo: true });
    },
  });
  function paintFlame() {
    const s = SAMPLES[fl.sym];
    if (fl.mystery && !fl.solved) { Lab.$('#flame-foot').innerHTML = '<p>A real lab trick: compare the lines to known fingerprints. Try each sample above, then come back and guess.</p>'; return; }
    Lab.$('#flame-foot').innerHTML = `<p><b>${s.name}: ${s.colorName}.</b> ${s.note} ${s.lines.length} ${s.kind === 'flame' ? 'atomic lines' : 'lines'} shown. Strong visible lines only.</p>`;
  }
  function pickSample(sym, keep) {
    fl.sym = sym; fl.t0 = flameStage.t;
    if (!keep) {
      if (fl.mystery && !fl.solved) { /* comparing while solving: keep the quest open */ }
    }
    flameSeg.salt.set(SAMPLES[sym].kind === 'flame' ? sym : null, false);
    flameSeg.gas.set(SAMPLES[sym].kind === 'gas' ? sym : null, false);
    paintFlame();
  }
  flameSeg.salt = Lab.segmented('#flame-salt', (v) => { endMystery(); pickSample(v); });
  flameSeg.gas = Lab.segmented('#flame-gas', (v) => { endMystery(); pickSample(v); });
  function endMystery() { fl.mystery = null; fl.solved = false; }
  const guessHost = Lab.$('#flame-guess');
  Lab.$('#flame-mystery').addEventListener('click', () => {
    const syms = Object.keys(SAMPLES);
    const ans = syms[Math.floor(Math.random() * syms.length)];
    fl.mystery = ans; fl.solved = false;
    fl.sym = ans; fl.t0 = flameStage.t;
    flameSeg.salt.set(null, false); flameSeg.gas.set(null, false);
    const others = syms.filter((x) => x !== ans).sort(() => Math.random() - 0.5).slice(0, 3);
    const opts = others.concat(ans).sort();
    guessHost.innerHTML = opts.map((o) => `<button type="button" data-value="${o}" aria-pressed="false">${SAMPLES[o].name}</button>`).join('');
    Lab.$$('button', guessHost).forEach((b) => b.addEventListener('click', () => {
      if (fl.solved) return;
      const msg = Lab.$('#flame-msg');
      if (b.dataset.value === fl.mystery) {
        fl.solved = true;
        b.setAttribute('aria-pressed', 'true');
        msg.textContent = `Yes, ${SAMPLES[fl.mystery].name.toLowerCase()}. Its lines match exactly.`;
        Lab.collection.award(1); Lab.confetti(50);
        paintFlame();
      } else {
        Lab.sound.bad();
        b.disabled = true; b.style.opacity = 0.4;
        msg.textContent = `Not ${SAMPLES[b.dataset.value].name.toLowerCase()}. Those lines would sit elsewhere. Look again.`;
      }
    }));
    Lab.$('#flame-msg').textContent = 'Line positions never lie. Pick the element whose fingerprint fits. Use the Salt and Gas buttons above to compare, then press this button again for a new sample.';
    Lab.$('#flame-quest').hidden = false;
    paintFlame();
  });
  paintFlame();

  /* ---------- Story 1: Bohr's idea ---------- */
  const BALMER = [[3, 2], [4, 2], [5, 2], [6, 2]].map(([a, b]) => jumpNm(a, b));
  Lab.story('#story-bohr', {
    title: "Bohr's energy steps",
    scenes: [
      {
        say: 'Run electricity through hydrogen gas and it glows pink. Through a prism, that glow becomes just <b>four sharp lines</b>: 656, 486, 434 and 410 nm. Why not a rainbow?',
        dur: 4,
        draw(g, p, t) {
          const col = '#FF62AE';
          // Horizontal tube.
          g.save(); g.translate(160, 96); g.rotate(Math.PI / 2);
          gasTube(g, 0, -120, 120, col, t, seg(p, 0, 0.2));
          g.restore();
          const px = 420, py = 96;
          const a = seg(p, 0.15, 0.32);
          g.fillStyle = Art.alpha(col, 0.34 * a);
          g.beginPath(); g.moveTo(280, 76); g.lineTo(px - 30, 88); g.lineTo(px - 30, 104); g.lineTo(280, 116); g.closePath(); g.fill();
          const x0 = 80, x1 = 720, sy = 300, sh = 64;
          const q = (i) => seg(p, 0.34 + i * 0.1, 0.46 + i * 0.1);
          const X = (nm) => x0 + ((nm - 380) / 370) * (x1 - x0);
          BALMER.forEach((nm, i) => {
            const u = q(i);
            if (u <= 0) return;
            const col2 = lightColor(nm);
            g.strokeStyle = Art.alpha(col2, 0.65); g.lineWidth = 3.5;
            g.beginPath(); g.moveTo(px, py + 30); g.lineTo(lerp(px, X(nm), u), lerp(py + 30, sy, u)); g.stroke();
          });
          prism(g, px, py, 56);
          strip(g, x0, x1, sy, sh, BALMER, { q, w: 3 });
          BALMER.forEach((nm, i) => Art.text(g, String(Math.round(nm)), X(nm) + labelDx(nm), sy + sh + 26, { size: 24, color: textColor(nm), alpha: q(i) }));
          Art.text(g, 'wavelength in nm', 560, sy - 26, { size: 22, color: C.dim, alpha: seg(p, 0.7, 0.9), align: 'left' });
          Art.text(g, 'hydrogen tube', 160, 158, { size: 24, color: C.dim });
          Art.moe(g, 700, 240, 120, 'think', { t, flip: true });
        },
      },
      {
        say: 'Old physics said an orbiting electron should keep giving off light of every color, lose energy, and <b>spiral into the nucleus</b> in a split second. But atoms are stable, and their spectra are sharp. Something had to change.',
        dur: 4,
        draw(g, p, t) {
          const cx = 280, cy = 225;
          const u = ease.in(seg(p, 0.04, 0.72));
          const turns = 4.5, N = 140;
          g.lineCap = 'round';
          let lastX = cx + 170, lastY = cy;
          for (let i = 1; i <= N * u; i++) {
            const f = i / N, ang = f * turns * TAU, r = 170 * (1 - f * 0.94);
            const x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r;
            g.strokeStyle = lightColor(lerp(720, 400, f)); g.lineWidth = 4.5;
            g.beginPath(); g.moveTo(lastX, lastY); g.lineTo(x, y); g.stroke();
            lastX = x; lastY = y;
          }
          Art.glow(g, cx, cy, 44, C.proton, 0.45);
          Art.proton(g, cx, cy, 18);
          const crash = seg(p, 0.72, 0.96);
          if (crash <= 0) electronChar(g, lastX, lastY, 16, 'wow', t);
          else Art.burst(g, cx, cy, crash, { r: 110, n: 16 });
          // Rainbow it should give off.
          strip(g, 500, 780, 150, 46, [], { rainbow: seg(p, 0.15, 0.5) });
          Art.text(g, 'A smear of every color', 640, 120, { size: 24, color: C.ink, alpha: seg(p, 0.15, 0.5) });
          const a = seg(p, 0.7, 0.92);
          Art.text(g, 'Atoms would collapse!', 640, 244, { size: 32, font: 'display', color: C.red, alpha: a, halo: true });
          Art.text(g, 'They do not.', 640, 288, { size: 32, font: 'display', color: C.leaf, alpha: seg(p, 0.84, 1), halo: true });
          Art.moe(g, 640, 442, 120, 'oops', { t });
        },
      },
      {
        say: "Bohr's rule: the electron may only have <b>certain energies</b>, numbered by a whole number $n$. Think of rungs on a ladder. It can stand on a rung, never between rungs.",
        dur: 4.2,
        draw(g, p, t) {
          const cx = 200, cy = 225;
          const rs = [0, 48, 84, 124, 164, 200];
          bohrAtom(g, cx, cy, rs, 5, { ringAlpha: (n) => seg(p, 0.05 + n * 0.09, 0.13 + n * 0.09) });
          const top = 40, bot = 380, lx0 = 450, lx1 = 620;
          // Ladder rails.
          g.strokeStyle = '#A97F58'; g.lineWidth = 8; g.lineCap = 'round';
          const a0 = seg(p, 0.1, 0.25);
          g.save(); g.globalAlpha *= a0;
          g.beginPath(); g.moveTo(lx0, bot + 26); g.lineTo(lx0, top - 6); g.moveTo(lx1, bot + 26); g.lineTo(lx1, top - 6); g.stroke();
          g.restore();
          for (let n = 1; n <= 5; n++) {
            const a = seg(p, 0.12 + n * 0.09, 0.2 + n * 0.09);
            if (a <= 0) continue;
            const y = yOfN(n, top, bot);
            g.save(); g.globalAlpha *= a;
            g.strokeStyle = '#E7C89A'; g.lineWidth = 7; g.beginPath(); g.moveTo(lx0, y); g.lineTo(lx1, y); g.stroke();
            g.restore();
            if (n <= 3) Art.text(g, `n = ${n}`, lx1 + 22, y, { size: 26, color: C.sun, align: 'left', alpha: a, font: 'display' });
          }
          Art.text(g, 'and up', lx1 + 22, 44, { size: 22, color: C.dim, align: 'left', alpha: seg(p, 0.6, 0.72) });
          // Electron on the bottom rung.
          const ang = t * 1.6;
          electronChar(g, cx + Math.cos(ang) * rs[1], cy + Math.sin(ang) * rs[1], 16, 'happy', t);
          electronChar(g, (lx0 + lx1) / 2, bot - 22, 18, 'happy', t);
          // Forbidden spot.
          const b = seg(p, 0.76, 0.92);
          if (b > 0) {
            const yy = (yOfN(1, top, bot) + yOfN(2, top, bot)) / 2;
            Art.atom(g, (lx0 + lx1) / 2, yy, 18, 'e', { label: false, face: 'sad', t, color: C.electron, alpha: 0.75 * b });
            Art.strike(g, (lx0 + lx1) / 2 - 28, yy - 28, (lx0 + lx1) / 2 + 28, yy + 28, b, C.red, 7);
            Art.strike(g, (lx0 + lx1) / 2 + 28, yy - 28, (lx0 + lx1) / 2 - 28, yy + 28, b, C.red, 7);
            Art.text(g, 'not allowed', lx1 + 22, yy, { size: 26, color: C.red, align: 'left', alpha: b, halo: true });
          }
          Art.text(g, 'Rungs crowd together at the top', 535, 428, { size: 24, color: C.dim, alpha: seg(p, 0.6, 0.76) });
          Art.text(g, 'Orbits not to scale', 200, 438, { size: 20, color: C.faint, alpha: seg(p, 0.5, 0.7) });
        },
      },
      {
        say: 'The lowest rung, $n = 1$, is the <b>ground state</b>. The electron is happy to stay there. Add energy with heat or electricity and it jumps to a higher rung, an <b>excited state</b>.',
        dur: 3.6,
        draw(g, p, t) {
          const cx = 200, cy = 225, rs = [0, 56, 96, 136, 176];
          const top = 40, bot = 370, lx0 = 450, lx1 = 620;
          const u = ease.inOut(seg(p, 0.42, 0.72));
          const rad = lerp(rs[1], rs[3], u);
          bohrAtom(g, cx, cy, rs, 4, { hi: u < 0.5 ? 1 : 3 });
          const ang = t * lerp(1.4, 0.7, u) + 0.4;
          // Spark of energy coming in.
          const sp = seg(p, 0.22, 0.46);
          if (sp > 0 && sp < 1) {
            const ex = cx + Math.cos(ang) * rs[1], ey = cy + Math.sin(ang) * rs[1];
            for (let i = 0; i < 3; i++) {
              const q = clamp(sp * 1.3 - i * 0.14);
              Art.glow(g, lerp(30, ex, q), lerp(50 + i * 30, ey, q), 18, C.sun, 0.9);
              Art.star(g, lerp(30, ex, q), lerp(50 + i * 30, ey, q), 8, t * 8);
            }
          }
          electronChar(g, cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad, 18, u > 0.5 ? 'wow' : 'sleepy', t);
          g.strokeStyle = '#A97F58'; g.lineWidth = 8; g.lineCap = 'round';
          g.beginPath(); g.moveTo(lx0, bot + 24); g.lineTo(lx0, top - 6); g.moveTo(lx1, bot + 24); g.lineTo(lx1, top - 6); g.stroke();
          for (let n = 1; n <= 4; n++) {
            const y = yOfN(n, top, bot);
            g.strokeStyle = '#E7C89A'; g.lineWidth = 7; g.beginPath(); g.moveTo(lx0, y); g.lineTo(lx1, y); g.stroke();
            if (n <= 3) Art.text(g, `n = ${n}`, lx1 + 20, y, { size: 26, color: C.sun, align: 'left', font: 'display' });
          }
          const y1 = yOfN(1, top, bot), y3 = yOfN(3, top, bot);
          electronChar(g, (lx0 + lx1) / 2, lerp(y1 - 22, y3 - 22, u), 18, u > 0.5 ? 'wow' : 'sleepy', t);
          Art.text(g, 'ground state', 535, 410, { size: 28, font: 'display', color: C.leaf, alpha: 1 - seg(p, 0.5, 0.7) * 0.6 });
          Art.text(g, 'excited state', 410, 72, { size: 28, font: 'display', color: C.pink, align: 'right', alpha: seg(p, 0.6, 0.8), halo: true });
          Art.text(g, 'energy in', 74, 28, { size: 24, color: C.sun, alpha: seg(p, 0.15, 0.3) * (1 - seg(p, 0.6, 0.8)) });
        },
      },
      {
        say: 'It soon falls back. The energy it loses leaves as <b>one photon</b>. The photon energy exactly equals the gap: $|\\Delta E| = h\\nu$. Here, 3 to 2 gives red light at 656 nm.',
        dur: 4.4,
        draw(g, p, t) {
          const cx = 190, cy = 225, rs = [0, 56, 96, 136, 176];
          const top = 40, bot = 370, lx0 = 430, lx1 = 590;
          const u = ease.inOut(seg(p, 0.16, 0.42));
          const nm = jumpNm(3, 2), col = lightColor(nm);
          const rad = lerp(rs[3], rs[2], u);
          bohrAtom(g, cx, cy, rs, 4, { hi: u < 0.5 ? 3 : 2 });
          const ang = t * 0.9 - 0.6;
          electronChar(g, cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad, 18, u > 0.5 ? 'happy' : 'wow', t);
          g.strokeStyle = '#A97F58'; g.lineWidth = 8; g.lineCap = 'round';
          g.beginPath(); g.moveTo(lx0, bot + 24); g.lineTo(lx0, top - 6); g.moveTo(lx1, bot + 24); g.lineTo(lx1, top - 6); g.stroke();
          for (let n = 1; n <= 4; n++) {
            const y = yOfN(n, top, bot);
            g.strokeStyle = '#E7C89A'; g.lineWidth = 7; g.beginPath(); g.moveTo(lx0, y); g.lineTo(lx1, y); g.stroke();
            if (n <= 3) Art.text(g, `n = ${n}`, lx0 - 16, y, { size: 24, color: C.sun, align: 'right', font: 'display', halo: true });
          }
          const y3 = yOfN(3, top, bot), y2 = yOfN(2, top, bot);
          Art.arrow(g, 510, y3, 510, y2, { color: col, w: 8, head: 14, p: seg(p, 0.16, 0.42) });
          // Photon flies out to the right.
          const q = ease.out(seg(p, 0.36, 0.86));
          if (q > 0) {
            const ex = 520, ey = (y3 + y2) / 2;
            photon(g, lerp(ex, 700, q), lerp(ey, 170, q), nm, { len: 130, amp: 30, lam: 36, phase: t * 9, w: 6 });
          }
          const a = seg(p, 0.66, 0.88);
          Art.text(g, '656 nm', 702, 80, { font: 'display', size: 46, color: textColor(nm), alpha: a, halo: true });
          Art.text(g, Lab.sig(jumpJ(3, 2), 3) + ' J', 690, 256, { size: 28, color: C.sun, alpha: a, halo: true });
          Art.text(g, 'exactly the gap', 690, 296, { size: 26, color: C.ink, alpha: a, halo: true });
        },
      },
      {
        say: 'Each drop to $n = 2$ has its own gap, so each gives its own color. A <b>bigger drop</b> means more energy and a shorter wavelength. These four are hydrogen\'s lines, predicted by Bohr\'s math.',
        dur: 5.2,
        draw(g, p, t) {
          const top = 30, bot = 720; // Scaled so n = 2 sits on the stage and n = 1 is off the bottom.
          const yN = (n) => top + (bot - top) / (n * n);
          const lx0 = 70, lx1 = 500;
          for (let n = 2; n <= 6; n++) {
            const y = yN(n);
            g.strokeStyle = '#E7C89A'; g.lineWidth = n === 2 ? 7 : 5; g.lineCap = 'round';
            g.beginPath(); g.moveTo(lx0, y); g.lineTo(lx1, y); g.stroke();
          }
          [2, 3, 4].forEach((n) => Art.text(g, `n = ${n}`, lx1 + 18, yN(n), { size: 24, color: C.sun, align: 'left', font: 'display' }));
          Art.text(g, 'n = 5, 6', lx1 + 18, yN(6) - 4, { size: 24, color: C.sun, align: 'left', font: 'display' });
          const y2 = yN(2);
          const q = (i) => seg(p, 0.08 + i * 0.2, 0.26 + i * 0.2);
          BALMER.forEach((nm, i) => {
            const x = 140 + i * 96, u = q(i), nHi = i + 3;
            Art.arrow(g, x, yN(nHi), x, y2, { color: lightColor(nm), w: 8, head: 14, p: u });
            Art.text(g, `${nHi} to 2`, x, y2 + 26, { size: 22, color: textColor(nm), alpha: seg(u, 0.5, 1) });
          });
          const X = strip(g, 70, 730, 320, 62, BALMER, { q: (i) => seg(q(i), 0.6, 1), w: 3 });
          BALMER.forEach((nm, i) => Art.text(g, String(Math.round(nm)), X(nm) + labelDx(nm) * 1.2, 404, { size: 25, font: 'display', color: textColor(nm), alpha: seg(q(i), 0.6, 1) }));
          Art.text(g, 'nm', 725, 404, { size: 22, color: C.dim, align: 'right', alpha: seg(p, 0.85, 1) });
          Art.moe(g, 680, 310, 120, 'cheer', { t, flip: true });
        },
      },
    ],
  });

  /* ---------- Bench: hydrogen jump simulator ---------- */
  const J = { n: 1, jump: null, photons: [], found: new Set(), last: null, spark: 0, flash: 0, sparkHold: 0 };
  const cxA = 190, cyA = 206, top = 34, bot = 382;
  const lx0 = 428, lx1 = 586;
  const FAN = { 1: bot, 2: yOfN(2, top, bot), 3: 88, 4: 66, 5: 42, 6: 18 };
  const sx0 = 30, sx1 = 770, sy = 428, sh = 46;
  const segU = 150, segI = 150;
  function stripX(nm) {
    if (nm < 380) return sx0 + clamp((nm - 90) / 35, 0, 1) * (segU - 8) + 4;
    if (nm <= 750) return sx0 + segU + ((nm - 380) / 370) * (sx1 - sx0 - segU - segI);
    return sx1 - segI + clamp(Math.log10(nm / 800), 0, 1) * (segI - 8) + 4;
  }
  const seriesOf = (lo) => ({ 1: 'Lyman', 2: 'Balmer', 3: 'Paschen', 4: 'Brackett', 5: 'Pfund' }[lo]);
  const regionOf = (nm) => (nm < 380 ? 'ultraviolet' : nm <= 750 ? 'visible' : 'infrared');
  const lineKey = (a, b) => Math.max(a, b) + '-' + Math.min(a, b);
  function foundVisible() { return [3, 4, 5, 6].filter((n) => J.found.has(n + '-2')).length; }
  let nSeg;
  function setN(n, opts = {}) {
    if (J.jump || n === J.n) return;
    const from = J.n, to = n;
    const down = to < from;
    const nm = jumpNm(from, to);
    J.last = { from, to, nm, down };
    if (opts.silent) {
      J.jump = { from, to, u: 0, silent: true };
    } else {
      J.jump = { from, to, u: 0 };
      if (!down) J.photons.push({ inbound: true, u: 0, nm, ph: Math.random() * 6 });
    }
    if (Lab.reducedMotion || !jumpStage.playing) { finishJump(); }
    Lab.sound.pop();
    paintJump();
  }
  function finishJump() {
    const jm = J.jump;
    if (!jm) return;
    J.n = jm.to;
    if (jm.to < jm.from) {
      if (!Lab.reducedMotion && jumpStage.playing) { /* the photon's landing registers the line */ }
      else registerLine(jm.from, jm.to);
    }
    J.jump = null;
    nSeg.set(String(J.n), false);
    paintJump();
  }
  function registerLine(a, b) {
    const before = foundVisible();
    J.found.add(lineKey(a, b));
    if (foundVisible() === 4 && before === 3) { Lab.collection.award(1); Lab.confetti(60); Lab.toast('You found all four visible lines of hydrogen.'); }
    if (J.found.size === 15 && !J.allDone) { J.allDone = true; Lab.collection.award(1); Lab.toast('All 15 lines found.'); }
    paintJump();
  }
  const jumpStage = Lab.stage('#c-jump', {
    h: 520,
    label: 'A hydrogen atom with six rings, an energy ladder with real spacing, and a spectrum strip. Tap a ring or a level to make the electron jump. Lines appear at their real wavelengths.',
    onPointer(e) {
      if (e.type === 'hover') {
        const d = Math.hypot(e.x - cxA, e.y - cyA);
        const hit = (d < RING[6] + 18) || (e.x > lx0 - 6 && e.x < 660 && e.y < bot + 24);
        jumpStage.canvas.style.cursor = hit ? 'pointer' : 'default';
        return;
      }
      if (e.type !== 'down') return;
      const d = Math.hypot(e.x - cxA, e.y - cyA);
      let pick = null;
      if (d < RING[6] + 18) {
        let best = 99;
        for (let n = 1; n <= 6; n++) { const dd = Math.abs(d - RING[n]); if (dd < best && dd < 16) { best = dd; pick = n; } }
      } else if (e.x > lx0 - 6 && e.x < 660 && e.y < bot + 24) {
        let best = 999;
        for (let n = 1; n <= 6; n++) { const dd = Math.abs(e.y - (e.x > lx1 ? FAN[n] : yOfN(n, top, bot))); if (dd < best) { best = dd; pick = n; } }
      }
      if (pick) setN(pick);
    },
    draw(g, t, dt) {
      // Advance any jump.
      if (J.jump) {
        const speed = J.jump.silent ? 4 : 1.6;
        J.jump.u += dt * speed;
        if (J.jump.u >= 0.12 && !J.jump.spawned && J.jump.to < J.jump.from) {
          J.jump.spawned = true;
          const a = t * 1.2;
          const rr = lerp(RING[J.jump.from], RING[J.jump.to], 0.5);
          J.photons.push({ u: 0, x: cxA + Math.cos(a) * rr, y: cyA + Math.sin(a) * rr, nm: jumpNm(J.jump.from, J.jump.to), from: J.jump.from, to: J.jump.to, ph: Math.random() * 6 });
        }
        if (J.jump.u >= 1) finishJump();
      }
      // Automatic sparks: climb to a random level, then cascade down.
      if (J.spark > 0 && !J.jump && J.photons.length === 0) {
        J.sparkHold -= dt;
        if (J.sparkHold <= 0) {
          J.sparkHold = 0.12;
          if (J.n === 1) {
            J.spark--;
            J.flash = 1;
            setN(2 + Math.floor(Math.random() * 5), { silent: true });
          } else {
            setN(1 + Math.floor(Math.random() * (J.n - 1)));
          }
        }
      }
      J.flash = Math.max(0, J.flash - dt * 2.4);
      // Atom.
      const jm = J.jump;
      const fromN = jm ? jm.from : J.n, toN = jm ? jm.to : J.n, u = jm ? ease.inOut(clamp(jm.u)) : 1;
      if (J.flash > 0) Art.glow(g, cxA, cyA, 210, C.sun, 0.4 * J.flash);
      bohrAtom(g, cxA, cyA, RING, 6, { hi: J.n });
      const rad = lerp(RING[fromN], RING[toN], u);
      const omega = 2.4 / Math.pow(Math.max(1, lerp(fromN, toN, u)), 0.8);
      const ang = t * omega;
      const curN = lerp(fromN, toN, u);
      electronChar(g, cxA + Math.cos(ang) * rad, cyA + Math.sin(ang) * rad, 17, curN < 1.5 ? 'sleepy' : 'wow', t);
      Art.text(g, 'Orbits not to scale', cxA, 402, { size: 20, color: C.faint });
      // Ladder.
      g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 2; g.setLineDash([5, 6]);
      g.beginPath(); g.moveTo(lx0, top); g.lineTo(lx1, top); g.stroke(); g.setLineDash([]);
      Art.text(g, '0 eV', lx0 - 8, top - 8, { size: 20, color: C.dim, align: 'right' });
      for (let n = 1; n <= 6; n++) {
        const y = yOfN(n, top, bot), on = n === J.n;
        g.strokeStyle = on ? C.sun : '#E7C89A'; g.lineWidth = on ? 6 : 4; g.lineCap = 'round';
        g.beginPath(); g.moveTo(lx0, y); g.lineTo(lx1, y); g.stroke();
        g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 1.6;
        g.beginPath(); g.moveTo(lx1, y); g.lineTo(lx1 + 22, FAN[n]); g.stroke();
        Art.text(g, `n = ${n}`, lx1 + 26, FAN[n], { size: 22, color: on ? C.sun : C.ink, align: 'left', font: 'display' });
      }
      [[1, '−13.6 eV'], [2, '−3.4 eV']].forEach(([n, s]) => Art.text(g, s, lx0 - 8, yOfN(n, top, bot), { size: 22, color: C.dim, align: 'right', halo: true }));
      const yEl = lerp(yOfN(fromN, top, bot), yOfN(toN, top, bot), u);
      if (J.last) {
        const col = lightColor(J.last.nm);
        const xArrow = lx0 + 40;
        Art.arrow(g, xArrow, yOfN(J.last.from, top, bot), xArrow, yOfN(J.last.to, top, bot), { color: col, w: 7, head: 13, p: jm ? u : 1 });
      }
      electronChar(g, lx0 + 104, yEl - 18, 16, curN < 1.5 ? 'sleepy' : 'wow', t);
      // Headline on the right.
      if (J.last) {
        const { nm, down, from, to } = J.last;
        const lo = Math.min(from, to);
        const cxT = 722;
        Art.text(g, down ? 'emitted' : 'absorbed', cxT, 150, { size: 24, color: down ? C.leaf : C.pink });
        Art.text(g, nm >= 1000 ? Math.round(nm).toLocaleString('en-US') : Math.round(nm).toString(), cxT, 196, { font: 'display', size: 46, color: textColor(nm), halo: true });
        Art.text(g, 'nm', cxT, 236, { size: 24, color: C.dim });
        Art.text(g, seriesOf(lo), cxT, 282, { size: 26, font: 'display', color: C.sun });
        Art.text(g, regionOf(nm), cxT, 316, { size: 22, color: C.ink });
      } else {
        Art.moe(g, 718, 330, 130, 'point', { t, flip: true });
      }
      // Spectrum strip.
      g.fillStyle = '#07040F'; Art.round(g, sx0, sy, sx1 - sx0, sh, 7); g.fill();
      for (let px = 0; px < sx1 - sx0 - segU - segI; px += 2) {
        const nmx = lerp(380, 750, px / (sx1 - sx0 - segU - segI));
        g.fillStyle = Art.alpha(lightColor(nmx), 0.13);
        g.fillRect(sx0 + segU + px, sy, 2.4, sh);
      }
      g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 2.5; Art.round(g, sx0, sy, sx1 - sx0, sh, 7); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2;
      [sx0 + segU, sx1 - segI].forEach((x) => { g.beginPath(); g.moveTo(x, sy); g.lineTo(x, sy + sh); g.stroke(); });
      J.found.forEach((k) => {
        const [a, b] = k.split('-').map(Number);
        const nm = jumpNm(a, b), x = stripX(nm), col = lightColor(nm);
        const isLast = J.last && lineKey(J.last.from, J.last.to) === k;
        Art.glow(g, x, sy + sh / 2, isLast ? 34 : 20, col, 0.7);
        g.fillStyle = col; g.fillRect(x - 2, sy, 4, sh);
      });
      Art.text(g, 'Ultraviolet', sx0 + segU / 2, sy + sh + 24, { size: 22, color: C.dim });
      Art.text(g, `Visible: ${foundVisible()} of 4 found`, sx0 + segU + (sx1 - sx0 - segU - segI) / 2, sy + sh + 24, { size: 22, color: foundVisible() === 4 ? C.leaf : C.ink });
      Art.text(g, 'Infrared', sx1 - segI / 2, sy + sh + 24, { size: 22, color: C.dim });
      // Photons.
      J.photons = J.photons.filter((ph) => {
        ph.u += dt * (ph.inbound ? 1.6 : 1.0);
        if (ph.inbound) {
          const tx = cxA + Math.cos(t * omega) * RING[fromN], ty = cyA + Math.sin(t * omega) * RING[fromN];
          const x = lerp(-30, tx, ph.u), y = lerp(40, ty, ph.u);
          if (ph.u >= 1) return false;
          photon(g, x, y, ph.nm, { ang: Math.atan2(ty - 40, tx + 30), len: 90, amp: 20, lam: clamp(ph.nm * 0.05, 9, 30), phase: t * 9 + ph.ph, w: 5 });
          return true;
        }
        const tx = stripX(ph.nm), ty = sy + sh / 2;
        const q = ease.inOut(clamp(ph.u));
        const x = lerp(ph.x, tx, q), y = lerp(ph.y, ty, q);
        if (ph.u >= 1) { registerLine(ph.from, ph.to); return false; }
        photon(g, x, y, ph.nm, { ang: Math.atan2(ty - ph.y, tx - ph.x), len: 90, amp: 20, lam: clamp(ph.nm * 0.05, 9, 30), phase: t * 9 + ph.ph, w: 5 });
        return true;
      });
    },
  });
  function paintJump() {
    const L = J.last;
    Lab.$('#jump-c').textContent = `${J.found.size} of 15`;
    if (!L) {
      Lab.$('#jump-foot').innerHTML = Lab.texString('<p>The electron starts in the <b>ground state</b>, $n = 1$. Send it up to $n = 3$, then bring it down to $n = 2$. The math for every jump appears here.</p>');
      return;
    }
    const lo = Math.min(L.from, L.to), hi = Math.max(L.from, L.to);
    const br = 1 / (lo * lo) - 1 / (hi * hi);
    const tex = (x, sf = 3) => {
      const e = Math.floor(Math.log10(x)); const m = ((x * (1 + 1e-12)) / Math.pow(10, e)).toFixed(sf - 1);
      return `${m} \\times 10^{${e}}`;
    };
    Lab.$('#jump-e').textContent = Lab.sig(jumpJ(lo, hi) * (1 + 1e-12), 3) + ' J';
    Lab.$('#jump-l').textContent = (L.nm >= 1000 ? Math.round(L.nm).toLocaleString('en-US') : L.nm.toFixed(0)) + ' nm';
    Lab.$('#jump-foot').innerHTML = Lab.texString(
      `<p>${L.down ? '<b>Fall</b>' : '<b>Climb</b>'} from $n = ${L.from}$ to $n = ${L.to}$. A photon is ${L.down ? 'emitted' : 'absorbed'}. $\\Delta E = ${L.down ? '-' : '+'}${tex(jumpJ(lo, hi))}$ J.</p>` +
      `<div class="calc-line">$$\\frac{1}{\\lambda} = (1.097 \\times 10^{7})\\left(\\frac{1}{${lo}^2} - \\frac{1}{${hi}^2}\\right) = ${tex(R * br)}\\text{ m}^{-1}$$</div>` +
      `<div class="calc-line">$$\\lambda = ${tex(1 / (R * br))}\\text{ m} = ${L.nm >= 1000 ? Math.round(L.nm) : L.nm.toFixed(0)}\\text{ nm}$$</div>`);
  }
  nSeg = Lab.segmented('#jump-n', (v) => { const before = J.n; setN(+v); if (J.jump === null && J.n === before) nSeg.set(String(J.n), false); });
  Lab.$('#jump-spark').addEventListener('click', () => { J.spark = 10; J.sparkHold = 0; if (jumpStage.playing === false) { for (let i = 0; i < 40; i++) { const a = 2 + Math.floor(Math.random() * 5), b = 1 + Math.floor(Math.random() * (a - 1)); J.found.add(lineKey(a, b)); } paintJump(); jumpStage.redraw(); J.spark = 0; } });
  Lab.$('#jump-clear').addEventListener('click', () => { J.found.clear(); J.last = null; J.spark = 0; J.photons.length = 0; if (J.n !== 1 && !J.jump) { J.n = 1; nSeg.set('1', false); } Lab.$('#jump-e').textContent = '—'; Lab.$('#jump-l').textContent = '—'; paintJump(); jumpStage.redraw(); });
  paintJump();

  /* ---------- Story 2: emission and absorption ---------- */
  Lab.story('#story-absorb', {
    title: 'Bright lines and dark lines',
    scenes: [
      {
        say: 'A hot solid, like a lamp filament, gives off every color. Through a prism it makes a <b>continuous spectrum</b>, a full rainbow with no gaps.',
        dur: 3.2,
        draw(g, p, t) {
          Art.bulb(g, 104, 110, 46, 1);
          const a = seg(p, 0.1, 0.3);
          g.fillStyle = `rgba(255,250,210,${0.3 * a})`;
          g.beginPath(); g.moveTo(150, 90); g.lineTo(350, 100); g.lineTo(350, 120); g.lineTo(150, 130); g.closePath(); g.fill();
          prism(g, 395, 112, 60);
          const b = seg(p, 0.3, 0.65);
          for (let i = 0; i <= 18; i++) {
            const nm = lerp(380, 750, i / 18);
            g.strokeStyle = Art.alpha(lightColor(nm), 0.5 * b); g.lineWidth = 3;
            g.beginPath(); g.moveTo(395, 150); g.lineTo(lerp(70, 730, i / 18), 300); g.stroke();
          }
          strip(g, 70, 730, 300, 72, [], { rainbow: b });
          Art.text(g, 'Continuous spectrum', 400, 410, { size: 34, font: 'display', color: C.sun, alpha: seg(p, 0.6, 0.85) });
          void t;
        },
      },
      {
        say: 'Now pass white light through hydrogen gas in the hot outer layer of a star. Some atoms there sit in $n = 2$, and they grab only the photons that match a gap. <b>Dark lines</b> appear at exactly those wavelengths.',
        dur: 4.4,
        draw(g, p, t) {
          // The star's outer layer as a glowing cloud.
          Art.glow(g, 62, 112, 130, '#FFD23F', 0.85);
          g.fillStyle = '#FFE27A'; g.beginPath(); g.arc(24, 112, 72, 0, TAU); g.fill();
          g.fillStyle = 'rgba(255,250,210,.3)';
          g.beginPath(); g.moveTo(90, 92); g.lineTo(350, 100); g.lineTo(350, 124); g.lineTo(90, 132); g.closePath(); g.fill();
          for (let i = 0; i < 12; i++) {
            const x = 130 + rand(i * 2.3 + 1) * 190 + wander(i, t) * 10, y = 34 + rand(i * 3.1 + 5) * 130 + wander(i + 9, t) * 8;
            Art.atom(g, x, y, 13, 'H', { label: false, alpha: seg(p, 0.05, 0.25) * 0.95 });
          }
          Art.text(g, 'hydrogen gas', 215, 188, { size: 24, color: C.ink, alpha: seg(p, 0.1, 0.3), halo: true });
          // A photon being absorbed by an atom, on a loop.
          const cyc = (t * 0.5) % 1;
          if (cyc < 0.5 && p > 0.2) {
            const q = cyc * 2;
            photon(g, lerp(90, 214, q), 112, 656, { len: 60, amp: 12, lam: 18, phase: t * 9, alpha: 1 - q * 0.7 });
          }
          prism(g, 395, 112, 60);
          const b = seg(p, 0.15, 0.45);
          for (let i = 0; i <= 18; i++) {
            const nm = lerp(380, 750, i / 18);
            g.strokeStyle = Art.alpha(lightColor(nm), 0.5 * b); g.lineWidth = 3;
            g.beginPath(); g.moveTo(395, 150); g.lineTo(lerp(70, 730, i / 18), 300); g.stroke();
          }
          const q = (i) => ease.out(seg(p, 0.4 + i * 0.1, 0.52 + i * 0.1));
          const X = strip(g, 70, 730, 300, 72, BALMER, { rainbow: b, dark: true, q, w: 3 });
          BALMER.forEach((nm, i) => Art.text(g, String(Math.round(nm)), X(nm) + labelDx(nm), 396, { size: 24, color: C.ink, alpha: q(i) }));
          Art.text(g, 'Absorption spectrum', 500, 430, { size: 28, font: 'display', color: C.sun, alpha: seg(p, 0.8, 1) });
        },
      },
      {
        say: 'Put the two side by side. The dark lines of <b>absorption</b> sit exactly where the bright lines of <b>emission</b> sit. Same element, same gaps.',
        dur: 3.8,
        draw(g, p) {
          const a = seg(p, 0.05, 0.25), b = seg(p, 0.28, 0.48);
          Art.text(g, 'Emission: bright lines on black', 400, 62, { size: 30, font: 'display', color: C.leaf, alpha: a });
          const X = strip(g, 70, 730, 92, 88, BALMER, { q: () => a, w: 3 });
          strip(g, 70, 730, 258, 88, BALMER, { rainbow: b, dark: true, q: () => b, w: 3 });
          const d = seg(p, 0.55, 0.85);
          BALMER.forEach((nm) => {
            g.save(); g.globalAlpha *= d; g.strokeStyle = C.sun; g.lineWidth = 2.5; g.setLineDash([6, 7]);
            g.beginPath(); g.moveTo(X(nm), 180); g.lineTo(X(nm), 258); g.stroke(); g.restore();
            Art.text(g, String(Math.round(nm)), X(nm) + labelDx(nm), 374, { size: 24, color: C.sun, alpha: d });
          });
          Art.text(g, 'Absorption: dark lines on a rainbow', 400, 228, { size: 30, font: 'display', color: C.pink, alpha: b, halo: true });
          Art.text(g, 'Wavelength in nm', 400, 416, { size: 24, color: C.dim, alpha: d });
        },
      },
      {
        say: 'Why? It is the same ladder, used in opposite directions. <b>Absorption</b> takes in a photon to climb a gap, so $\\Delta E$ is positive. <b>Emission</b> gives one out on the way down, so $\\Delta E$ is negative.',
        dur: 4.4,
        draw(g, p, t) {
          const nm = jumpNm(3, 2), col = lightColor(nm);
          const panel = (cx, up, label, labCol) => {
            const yHi = 110, yLo = 300, w = 140;
            [yHi, yLo].forEach((y) => { g.strokeStyle = '#E7C89A'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx - w, y); g.lineTo(cx + w, y); g.stroke(); });
            Art.text(g, 'n = 3', cx - w - 12, yHi, { size: 24, color: C.sun, align: 'right', font: 'display' });
            Art.text(g, 'n = 2', cx - w - 12, yLo, { size: 24, color: C.sun, align: 'right', font: 'display' });
            const cyc = (t * 0.4 + (up ? 0 : 0.5)) % 1;
            const ey = up ? lerp(yLo, yHi, ease.inOut(seg(cyc, 0.35, 0.7))) : lerp(yHi, yLo, ease.inOut(seg(cyc, 0.1, 0.45)));
            const ax = cx - 10;
            Art.arrow(g, ax - 50, up ? yLo : yHi, ax - 50, up ? yHi : yLo, { color: col, w: 7, head: 13 });
            electronChar(g, ax + 24, ey - 22, 18, 'happy', t, [up ? 0 : 0, up ? -1 : 1]);
            if (up) {
              const q = seg(cyc, 0, 0.35);
              if (q < 1) photon(g, lerp(cx + w + 30, ax + 24, q), lerp(200, yLo - 20, q), nm, { len: 80, amp: 16, lam: 24, phase: t * 9 });
            } else {
              const q = seg(cyc, 0.2, 0.7);
              if (q > 0 && q < 1) photon(g, lerp(ax + 24, cx + w + 30, q), lerp(205, 200, q), nm, { len: 80, amp: 16, lam: 24, phase: t * 9 });
            }
            Art.text(g, label, cx, 54, { size: 30, font: 'display', color: labCol });
          };
          panel(220, true, 'Absorption', C.pink);
          panel(600, false, 'Emission', C.leaf);
          const a = seg(p, 0.25, 0.5), b = seg(p, 0.55, 0.8);
          Art.text(g, 'ΔE is positive', 220, 354, { size: 28, color: C.pink, alpha: a });
          Art.text(g, 'ΔE is negative', 600, 354, { size: 28, color: C.leaf, alpha: b });
          Art.text(g, 'Same gap, same 656 nm photon', 400, 412, { size: 28, color: textColor(nm), alpha: seg(p, 0.8, 1), halo: true });
        },
      },
      {
        say: 'In 1868, astronomers saw a yellow line in sunlight at 587.6 nm that matched no known element. They named the mystery element <b>helium</b>, after the Greek word for Sun. It was found on Earth years later.',
        dur: 4,
        draw(g, p, t) {
          const sg = g.createRadialGradient(150, 150, 20, 150, 150, 170);
          sg.addColorStop(0, '#FFF3B0'); sg.addColorStop(0.5, '#FFC93D'); sg.addColorStop(1, '#FF8A2B');
          Art.glow(g, 150, 150, 230, '#FFB83D', 0.65);
          g.fillStyle = sg; g.beginPath(); g.arc(150, 150, 110, 0, TAU); g.fill();
          Art.atom(g, 150, 150, 42, 'He', { face: 'grin', t, look: [1, 0.2] });
          const nm = 587.6;
          const a = seg(p, 0.15, 0.4);
          const X = strip(g, 310, 770, 120, 66, [nm], { q: () => a, w: 3 });
          Art.text(g, '587.6 nm', X(nm), 90, { size: 30, font: 'display', color: textColor(nm), alpha: a, halo: true });
          Art.text(g, 'A line from no known element', 540, 224, { size: 26, alpha: seg(p, 0.35, 0.55) });
          Art.text(g, 'Helium: found on the Sun first', 400, 340, { size: 38, font: 'display', color: C.sun, alpha: seg(p, 0.6, 0.85), halo: true });
          Art.moe(g, 700, 446, 90, 'wow', { t, flip: true });
        },
      },
    ],
  });

  /* ---------- Story 3: limits of Bohr, de Broglie, Heisenberg ---------- */
  const baseballLam = h / (0.145 * 40), electronLam = h / (me * 2.19e6);
  const HE_LINES = SAMPLES.He.lines;
  function ringWave(g, cx, cy, Rr, A, k, phase, col, o = {}) {
    const N = 360;
    const laps = o.laps || 1;
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (let lap = 0; lap < laps; lap++) {
      const path = new Path2D();
      for (let i = 0; i <= N; i++) {
        const th = (i / N) * TAU + lap * TAU;
        const r = Rr + A * Math.cos(k * th + phase) * (o.env || 1);
        const x = cx + Math.cos(th - Math.PI / 2) * r, y = cy + Math.sin(th - Math.PI / 2) * r;
        if (i === 0) path.moveTo(x, y); else path.lineTo(x, y);
      }
      const col2 = lap === 0 ? col : (o.col2 || C.red);
      const al = lap === 0 ? 1 : Math.max(0.2, 0.7 - lap * 0.18);
      g.strokeStyle = Art.alpha(col2, 0.22 * al); g.lineWidth = (o.w || 6) * 3; g.stroke(path);
      g.strokeStyle = Art.alpha(col2, al); g.lineWidth = o.w || 6; g.stroke(path);
    }
  }
  Lab.story('#story-limits', {
    title: 'From orbits to something stranger',
    scenes: [
      {
        say: "Bohr's math is perfect for hydrogen, with its <b>one electron</b>. Try helium, with two, and it falls apart. Far more lines appear than the model can explain. The electrons affect each other.",
        dur: 3.8,
        draw(g, p, t) {
          const a = seg(p, 0.05, 0.25), b = seg(p, 0.32, 0.55);
          Art.atom(g, 90, 136, 42, 'H', { face: 'grin', t, alpha: a });
          strip(g, 170, 770, 100, 72, BALMER, { q: () => a, w: 3 });
          Art.text(g, 'Hydrogen: 4 lines, Bohr predicts them all', 470, 72, { size: 26, color: C.leaf, alpha: a });
          Art.atom(g, 90, 306, 42, 'He', { face: 'grumpy', t, alpha: b });
          strip(g, 170, 770, 270, 72, HE_LINES, { q: () => b, w: 3 });
          Art.text(g, 'Helium: more lines, and Bohr cannot predict them', 470, 242, { size: 26, color: C.red, alpha: b });
          Art.text(g, 'A better model was needed', 470, 400, { size: 32, font: 'display', color: C.sun, alpha: seg(p, 0.7, 0.9) });
        },
      },
      {
        say: 'In 1924, Louis de Broglie made a wild guess. If light can act like a particle, maybe <b>particles can act like waves</b>. His formula is $\\lambda = h/mv$. For a baseball, the wave is absurdly small. For an electron, it is the size of an atom.',
        dur: 5,
        draw(g, p, t) {
          const a = seg(p, 0.1, 0.3), b = seg(p, 0.45, 0.65);
          // Baseball.
          g.save(); g.globalAlpha *= a;
          g.fillStyle = '#F7F2E8'; g.strokeStyle = '#1A0F2E'; g.lineWidth = 3;
          const bx = 130, by = 120;
          g.beginPath(); g.arc(bx, by, 46, 0, TAU); g.fill(); g.stroke();
          g.strokeStyle = C.red; g.lineWidth = 3;
          g.beginPath(); g.arc(bx - 62, by, 46, -0.65, 0.65); g.stroke();
          g.beginPath(); g.arc(bx + 62, by, 46, Math.PI - 0.65, Math.PI + 0.65); g.stroke();
          g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 3;
          g.beginPath(); g.moveTo(200, by); g.lineTo(770, by); g.stroke();
          g.restore();
          Art.text(g, `A baseball: λ = ${Lab.sig(baseballLam, 3)} m`, 480, 70, { size: 30, font: 'display', color: C.ink, alpha: a });
          Art.text(g, 'Far too small to ever notice', 480, 160, { size: 26, color: C.dim, alpha: a });
          // Electron.
          const ym = 310;
          if (b > 0) {
            g.save(); g.globalAlpha *= b;
            electronChar(g, 130, ym, 24, 'happy', t, [1, 0]);
            const path = new Path2D();
            const lam = 160;
            for (let x = 180; x <= 770; x += 3) {
              const y = ym - 56 * Math.sin(TAU * ((x - 180) / lam - t * 0.8));
              if (x === 180) path.moveTo(x, y); else path.lineTo(x, y);
            }
            g.strokeStyle = 'rgba(53,230,255,.26)'; g.lineWidth = 15; g.stroke(path);
            g.strokeStyle = C.electron; g.lineWidth = 5; g.stroke(path);
            g.restore();
          }
          Art.text(g, `An electron: λ = ${Lab.sig(electronLam, 3)} m`, 480, 234, { size: 30, font: 'display', color: C.cyan, alpha: b });
          Art.text(g, 'As long as an atom is wide', 480, 402, { size: 26, color: C.ink, alpha: seg(p, 0.65, 0.85) });
        },
      },
      {
        say: 'This gives Bohr a reason. An electron wave must close on itself around the ring. So only a <b>whole number</b> of waves fits, and only certain orbits can exist. Here is $n = 3$.',
        dur: 4,
        draw(g, p, t) {
          const cx = 280, cy = 228, Rr = 136;
          g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 2; g.setLineDash([6, 7]);
          g.beginPath(); g.arc(cx, cy, Rr, 0, TAU); g.stroke(); g.setLineDash([]);
          Art.proton(g, cx, cy, 16);
          const reveal = ease.inOut(seg(p, 0.05, 0.5));
          const env = 1 * Math.cos(t * 3);
          if (reveal > 0) ringWave(g, cx, cy, Rr, 36, 3, 0, C.cyan, { env: reveal > 0.99 ? env : reveal * env });
          for (let i = 0; i < 3; i++) {
            const th = (i / 3) * TAU - Math.PI / 2;
            const a = seg(p, 0.45 + i * 0.1, 0.55 + i * 0.1);
            Art.text(g, String(i + 1), cx + Math.cos(th) * (Rr + 56), cy + Math.sin(th) * (Rr + 56), { size: 34, font: 'display', color: C.sun, alpha: a, halo: true });
          }
          Art.text(g, '3 waves fit', 610, 150, { size: 42, font: 'display', color: C.leaf, alpha: seg(p, 0.65, 0.85) });
          Art.text(g, 'so n = 3 is allowed', 610, 206, { size: 28, alpha: seg(p, 0.72, 0.9) });
          Art.text(g, 'A simplified 2D model', 610, 396, { size: 22, color: C.faint, alpha: seg(p, 0.8, 1) });
        },
      },
      {
        say: 'Then Werner Heisenberg found a limit. Picture bouncing a photon off an electron to see it: the photon <b>kicks</b> it. The sharper you know where it is, the less you know how it moves. This is the <b>uncertainty principle</b>. The kick is just a helpful picture. The limit is built into nature, not a flaw in our tools.',
        dur: 5,
        draw(g, p, t) {
          const u = ease.inOut(seg(p, 0.06, 0.4));
          const hitX = 400, hitY = 170;
          if (u < 1) photon(g, lerp(70, hitX - 24, u), lerp(60, hitY, u), 300, { ang: Math.atan2(hitY - 60, hitX - 94), len: 110, amp: 24, lam: 16, phase: t * 9, w: 5 });
          const v = ease.out(seg(p, 0.4, 0.82));
          if (v <= 0) electronChar(g, hitX, hitY, 24, 'sleepy', t);
          else {
            Art.burst(g, hitX, hitY, seg(p, 0.4, 0.62), { r: 70 });
            // Several possible paths: the uncertain outcome.
            const dirs = [-0.42, -0.08, 0.26, 0.6];
            dirs.forEach((d, i) => {
              const ex = hitX + Math.cos(d) * 300 * v, ey = hitY + Math.sin(d) * 190 * v;
              g.save(); g.globalAlpha *= 0.55;
              Art.arrow(g, hitX, hitY, ex, ey, { color: C.cyan, w: 4, dash: [8, 8], head: 11 });
              g.restore();
              Art.atom(g, ex, ey, 16, 'e', { label: false, color: C.electron, alpha: 0.5 + (i === 1 ? 0.5 : 0) });
            });
            g.save(); g.globalAlpha *= seg(p, 0.5, 0.7); Art.ring(g, hitX, hitY, 30, { color: C.sun, w: 4 }); g.restore();
            Art.text(g, 'You know where it was', hitX - 44, hitY, { size: 26, color: C.sun, align: 'right', alpha: seg(p, 0.5, 0.7), halo: true });
            Art.text(g, 'but not where it is going', 580, 62, { size: 28, color: C.cyan, alpha: seg(p, 0.7, 0.86), halo: true });
          }
          Art.text(g, 'photon', 90, 118, { size: 24, color: '#C9B6FF', alpha: seg(p, 0.05, 0.2) * (1 - seg(p, 0.3, 0.42)) });
          const b = ease.back(seg(p, 0.8, 0.98));
          if (b > 0) {
            g.save(); g.translate(240, 384); g.scale(b, b);
            g.fillStyle = C.pink; Art.round(g, -196, -40, 392, 80, 26); g.fill();
            Art.text(g, 'Δx · Δp ≥ h / 4π', 0, 2, { size: 38, font: 'display', color: '#fff' });
            g.restore();
          }
        },
      },
      {
        say: 'So we cannot draw a neat path for the electron. <b>Orbits are out</b>. All we can give is the chance of finding it in each place, a cloud called an <b>orbital</b>. That is the next lesson.',
        dur: 4.2,
        draw(g, p, t) {
          const cx = 400, cy = 216;
          const q = ease.inOut(seg(p, 0.15, 0.75));
          g.save(); g.globalAlpha *= 1 - q;
          g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3;
          g.beginPath(); g.arc(cx, cy, 120, 0, TAU); g.stroke();
          g.restore();
          if (q < 0.8) electronChar(g, cx + Math.cos(t * 1.6) * 120, cy + Math.sin(t * 1.6) * 120, 20, 'happy', t);
          const dots = Math.round(1500 * q);
          for (let i = 0; i < dots; i++) {
            const u1 = rand(i * 1.31 + 1), u2 = rand(i * 2.17 + 3);
            // 1s density: r follows r^2 e^(-2r), sampled with a gamma(3) shortcut.
            const rr = -Math.log((u1 + 1e-4) * (u2 + 1e-4) * (rand(i * 3.7 + 5) + 1e-4)) * 42;
            const th = rand(i * 4.1 + 7) * TAU;
            g.fillStyle = 'rgba(53,230,255,.62)';
            g.fillRect(cx + Math.cos(th) * rr - 1.8, cy + Math.sin(th) * rr - 1.8, 3.6, 3.6);
          }
          Art.glow(g, cx, cy, 30, C.proton, 0.5);
          Art.proton(g, cx, cy, 12);
          Art.text(g, 'orbit', 136, 90, { size: 34, font: 'display', color: C.ink, alpha: 1 - seg(p, 0.3, 0.7) });
          Art.text(g, 'orbital', 664, 90, { size: 34, font: 'display', color: C.cyan, alpha: seg(p, 0.5, 0.85) });
          Art.text(g, 'A cloud of probability', 400, 424, { size: 28, color: C.sun, alpha: seg(p, 0.75, 0.95), halo: true });
        },
      },
    ],
  });

  /* ---------- Bench: fit a wave around a ring ---------- */
  const ring = { k: 2.4 };
  Lab.stage('#c-ring', {
    h: 420,
    label: 'A wave wrapped around a ring. When a whole number of waves fits, the wave closes smoothly. Otherwise it misses its own tail.',
    draw(g, t) {
      const cx = 256, cy = 212, Rr = 136;
      const k = ring.k, near = Math.abs(k - Math.round(k)) < 0.026;
      g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 2; g.setLineDash([6, 7]);
      g.beginPath(); g.arc(cx, cy, Rr, 0, TAU); g.stroke(); g.setLineDash([]);
      Art.glow(g, cx, cy, 30, C.proton, 0.4);
      Art.proton(g, cx, cy, 14);
      if (near) {
        ringWave(g, cx, cy, Rr, 32, Math.round(k), 0, C.leaf, { env: Math.cos(t * 3.2), w: 6 });
        for (let i = 0; i < Math.round(k); i++) {
          const th = (i / Math.round(k)) * TAU - Math.PI / 2;
          Art.text(g, String(i + 1), cx + Math.cos(th) * (Rr + 50), cy + Math.sin(th) * (Rr + 50), { size: 26, font: 'display', color: C.sun, halo: true });
        }
        Art.text(g, `n = ${Math.round(k)}`, 610, 112, { size: 58, font: 'display', color: C.leaf });
        Art.text(g, 'The wave closes', 610, 176, { size: 30 });
        Art.text(g, 'This orbit is allowed', 610, 216, { size: 26, color: C.leaf });
        Art.moe(g, 610, 400, 130, 'cheer', { t });
      } else {
        ringWave(g, cx, cy, Rr, 32, k, 0, C.cyan, { laps: 3, w: 4 });
        const seamY = cy - Rr;
        Art.ring(g, cx, seamY, 42, { color: C.red, w: 5 });
        Art.text(g, `${k.toFixed(2)} waves`, 610, 112, { size: 46, font: 'display', color: C.red });
        Art.text(g, 'It misses its own tail', 610, 176, { size: 30 });
        Art.text(g, 'and cancels itself out', 610, 216, { size: 26, color: C.red });
        Art.moe(g, 610, 400, 130, 'oops', { t });
      }
    },
  });
  Lab.bind('#ring-k', '#ring-k-out', (v) => v.toFixed(2), (v) => { ring.k = v; });
});
