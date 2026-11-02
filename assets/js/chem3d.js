/* The Mole Hole: 3D viewer built on three.js. Load assets/vendor/three.min.js first, on pages that need it.

     const v = Chem3D.viewer('#host', { height: 420 });
     v.molecule({ atoms:[{el:'O',p:[0,0,0]}, ...], bonds:[[0,1,1], ...], lonePairs:[{at:0, dir:[0,1,0]}] });
     v.shape('tetrahedral', { center:'C', outer:'H', lonePairs:0 });  // ideal VSEPR geometries
     v.orbital(2, 1, 0, 'cloud' | 'balloon');                         // real hydrogen wavefunctions
     v.lattice('fcc' | 'bcc' | 'sc' | 'nacl', { fill:true });
     v.labels([{ p:[x,y,z], text:'109.5°' }]);                        // HTML labels that follow the model

   Drag to rotate, pinch or wheel to zoom when zoom:true. Rendering pauses off screen. If WebGL is
   unavailable, a text note replaces the model so the rest of the page still works. */
(function () {
  'use strict';
  const Chem3D = (window.Chem3D = {});

  const hasGL = () => {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  };

  const RADII = { H: 0.27, C: 0.4, N: 0.38, O: 0.37, F: 0.34, P: 0.46, S: 0.46, Cl: 0.46, Br: 0.5, I: 0.56, Xe: 0.56, B: 0.38, Be: 0.36, Al: 0.46, Si: 0.46, Na: 0.54, K: 0.62 };

  function makeOrbitTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  /* ---------- Hydrogen wavefunctions in atomic units ---------- */
  function radial(n, l, r) {
    // Unnormalized, correct in shape. rho = 2r/n.
    const q = (2 * r) / n, e = Math.exp(-q / 2);
    const key = n * 10 + l;
    switch (key) {
      case 10: return e;
      case 20: return (2 - q) * e;
      case 21: return q * e;
      case 30: return (6 - 6 * q + q * q) * e;
      case 31: return q * (4 - q) * e;
      case 32: return q * q * e;
      case 40: return (24 - 36 * q + 12 * q * q - q * q * q) * e;
      case 41: return q * (20 - 10 * q + q * q) * e;
      case 42: return q * q * (6 - q) * e;
      case 43: return q * q * q * e;
      default: return e;
    }
  }
  /** Real angular functions, named by what students see in textbooks. */
  const ANG = {
    s: () => 1,
    pz: (x, y, z, r) => z / r, px: (x, y, z, r) => x / r, py: (x, y, z, r) => y / r,
    dz2: (x, y, z, r) => (3 * z * z - r * r) / (r * r) * 0.5,
    dxz: (x, y, z, r) => (1.732 * x * z) / (r * r), dyz: (x, y, z, r) => (1.732 * y * z) / (r * r),
    dxy: (x, y, z, r) => (1.732 * x * y) / (r * r), dx2y2: (x, y, z, r) => (0.866 * (x * x - y * y)) / (r * r),
  };
  Chem3D.ANG = ANG;
  /** Map (l, m) to a textbook orbital label. */
  Chem3D.orbitalName = function (n, l, m) {
    if (l === 0) return n + 's';
    if (l === 1) return n + 'p' + { '-1': 'y', 0: 'z', 1: 'x' }[m];
    if (l === 2) return n + 'd' + { '-2': 'xy', '-1': 'yz', 0: 'z²', 1: 'xz', 2: 'x²−y²' }[m];
    return n + 'f';
  };
  function angKey(l, m) {
    if (l === 0) return 's';
    if (l === 1) return { '-1': 'py', 0: 'pz', 1: 'px' }[m];
    return { '-2': 'dxy', '-1': 'dyz', 0: 'dz2', 1: 'dxz', 2: 'dx2y2' }[m];
  }

  /* ---------- VSEPR ideal geometries: unit vectors for bonded + lone positions ---------- */
  const t = 1 / Math.sqrt(3);
  const GEOM = {
    linear: [[1, 0, 0], [-1, 0, 0]],
    trigonal: [[0, 1, 0], [0.866, -0.5, 0], [-0.866, -0.5, 0]],
    tetrahedral: [[t, t, t], [t, -t, -t], [-t, t, -t], [-t, -t, t]],
    tbp: [[0, 1, 0], [0, -1, 0], [1, 0, 0], [-0.5, 0, 0.866], [-0.5, 0, -0.866]],
    octahedral: [[0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]],
  };
  Chem3D.GEOM = GEOM;

  Chem3D.viewer = function (host, opts = {}) {
    host = Lab.$(host);
    host.classList.add('v3d');
    if (!window.THREE || !hasGL()) {
      host.innerHTML = '<p class="v3d-none">This 3D model needs WebGL, which your browser has turned off. The text and practice on this page still cover the same material.</p>';
      const noop = () => api;
      const api = { molecule: noop, shape: noop, orbital: noop, lattice: noop, labels: noop, clear: noop, add: noop, render: noop, scene: null, ok: false };
      return api;
    }
    const height = opts.height || 420;
    host.style.setProperty('--v3d-h', height + 'px');
    const canvas = document.createElement('canvas');
    canvas.className = 'v3d-canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', opts.label || 'Rotatable 3D model. Drag to turn it.');
    canvas.style.touchAction = 'pan-y';
    host.appendChild(canvas);
    const labelLayer = document.createElement('div');
    labelLayer.className = 'v3d-labels';
    host.appendChild(labelLayer);
    if (opts.hint !== false) {
      const hint = document.createElement('div');
      hint.className = 'v3d-hint'; hint.textContent = 'Drag to turn';
      host.appendChild(hint);
    }

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: !!Lab.isAuto });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(opts.background || '#1D1133');
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 400);
    camera.position.set(0, 0, opts.distance || 7);

    scene.add(new THREE.HemisphereLight(0xfff4ff, 0x35205e, 0.95));
    const key = new THREE.DirectionalLight(0xffffff, 1.05); key.position.set(4, 6, 7); scene.add(key);
    const fill = new THREE.DirectionalLight(0x8fd8ff, 0.32); fill.position.set(-6, -2, 3); scene.add(fill);
    const rimL = new THREE.DirectionalLight(0xff77bb, 0.3); rimL.position.set(-2, 4, -6); scene.add(rimL);

    const root = new THREE.Group();
    root.rotation.set(opts.tilt ?? 0.3, opts.spin ?? -0.5, 0);
    scene.add(root);

    const state = { visible: false, auto: opts.autorotate !== false && !Lab.reducedMotion, dragging: false, labels: [], animators: [], dist: opts.distance || 7, needs: true };

    function clearGroup() {
      while (root.children.length) {
        const c = root.children.pop();
        c.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { const m = Array.isArray(o.material) ? o.material : [o.material]; m.forEach((x) => x.dispose()); } });
      }
      state.animators.length = 0;
      state.labels = [];
      labelLayer.innerHTML = '';
    }
    const sphereGeo = (r, seg = 40) => new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75));
    const atomMat = (color, o = {}) => new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(color).convertSRGBToLinear(), roughness: o.roughness ?? 0.32, metalness: 0, clearcoat: 0.75, clearcoatRoughness: 0.28,
      transparent: o.opacity !== undefined, opacity: o.opacity ?? 1, depthWrite: o.opacity === undefined,
    });
    function cylinderBetween(a, b, r, color) {
      const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
      const len = A.distanceTo(B);
      const geo = new THREE.CylinderGeometry(r, r, len, 20);
      const mesh = new THREE.Mesh(geo, atomMat(color, { roughness: 0.45 }));
      mesh.position.copy(A).add(B).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
      return mesh;
    }

    const api = { ok: true, scene, camera, root, renderer, THREE: window.THREE };
    api.clear = () => { clearGroup(); state.needs = true; return api; };
    api.add = (obj) => { root.add(obj); state.needs = true; return api; };
    api.atomMaterial = atomMat;
    /** spec: { atoms:[{el,p:[x,y,z],r?,color?}], bonds:[[i,j,order]], lonePairs:[{at,dir:[x,y,z]}], dipoles:[{from,to,color}] } */
    api.molecule = function (spec) {
      clearGroup();
      const g = new THREE.Group();
      spec.atoms.forEach((a) => {
        const m = new THREE.Mesh(sphereGeo(a.r || RADII[a.el] || 0.42), atomMat(a.color || window.Art.elementColor(a.el)));
        m.position.set(...a.p);
        g.add(m);
      });
      (spec.bonds || []).forEach(([i, j, order = 1]) => {
        const A = new THREE.Vector3(...spec.atoms[i].p), B = new THREE.Vector3(...spec.atoms[j].p);
        const axis = B.clone().sub(A).normalize();
        let side = new THREE.Vector3(0, 0, 1).cross(axis);
        if (side.length() < 0.1) side = new THREE.Vector3(0, 1, 0).cross(axis);
        side.normalize();
        const offs = order === 1 ? [0] : order === 2 ? [-0.1, 0.1] : [-0.16, 0, 0.16];
        const rad = order === 1 ? 0.1 : 0.065;
        offs.forEach((o) => {
          const a = A.clone().addScaledVector(side, o), b = B.clone().addScaledVector(side, o);
          g.add(cylinderBetween(a.toArray(), b.toArray(), rad, '#D9D1EC'));
        });
      });
      (spec.lonePairs || []).forEach((lp) => {
        const C = new THREE.Vector3(...spec.atoms[lp.at].p);
        const d = new THREE.Vector3(...lp.dir).normalize();
        const lobeMat = atomMat('#FFE27A', { opacity: 0.5, roughness: 0.4 });
        lobeMat.emissive = new THREE.Color('#B88A10');
        const lobe = new THREE.Mesh(sphereGeo(0.34, 28), lobeMat);
        lobe.scale.set(0.8, 1.45, 0.8);
        lobe.position.copy(C).addScaledVector(d, 0.86);
        lobe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
        g.add(lobe);
        // Two electrons in the pair.
        const side = new THREE.Vector3(0, 0, 1).cross(d);
        if (side.length() < 0.1) side.set(1, 0, 0);
        side.normalize();
        [-0.11, 0.11].forEach((o) => {
          const e = new THREE.Mesh(sphereGeo(0.05, 12), atomMat('#35E6FF'));
          e.position.copy(C).addScaledVector(d, 0.98).addScaledVector(side, o);
          g.add(e);
        });
      });
      (spec.dipoles || []).forEach((dp) => {
        const A = new THREE.Vector3(...dp.from), B = new THREE.Vector3(...dp.to);
        const len = A.distanceTo(B), dir = B.clone().sub(A).normalize();
        const arrow = new THREE.ArrowHelper(dir, A, len, new THREE.Color(dp.color || '#FF4FA3'), Math.min(0.3, len * 0.3), 0.16);
        g.add(arrow);
      });
      root.add(g);
      state.needs = true;
      return api;
    };
    /** An ideal VSEPR shape. o: { geom:'tetrahedral', center:'C', outer:'H', lone:[indices of positions that are lone pairs], bondLen, doubles:[indices] } */
    api.shape = function (o) {
      const pos = GEOM[o.geom];
      const bondLen = o.bondLen || 1.55;
      const atoms = [{ el: o.center || 'C', p: [0, 0, 0] }];
      const bonds = [], lonePairs = [];
      const lone = new Set(o.lone || []);
      pos.forEach((v, i) => {
        if (lone.has(i)) { lonePairs.push({ at: 0, dir: v }); return; }
        const el = Array.isArray(o.outer) ? o.outer[i % o.outer.length] : (o.outer || 'H');
        atoms.push({ el, p: [v[0] * bondLen, v[1] * bondLen, v[2] * bondLen] });
        bonds.push([0, atoms.length - 1, (o.doubles && o.doubles.includes(i)) ? 2 : 1]);
      });
      return api.molecule({ atoms, bonds, lonePairs, dipoles: o.dipoles });
    };
    /** Real hydrogen orbital. mode 'cloud': sampled probability density. 'balloon': classic textbook lobes. */
    api.orbital = function (n, l, m, mode = 'cloud') {
      clearGroup();
      const fn = ANG[angKey(l, m)];
      const g = new THREE.Group();
      const rMax = n === 1 ? 6 : n === 2 ? 14 : n === 3 ? 26 : 42;
      const scale = 2.3 / (rMax * 0.72);
      camera.position.z = state.dist = Math.max(state.dist, 8.6);
      if (mode === 'cloud') {
        const count = opts.points || 26000;
        const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
        const A = new THREE.Color('#2FD6F2'), B = new THREE.Color('#FF4FA3');
        // Importance scan so rejection sampling works for every orbital.
        let peak = 0;
        for (let i = 0; i < 4000; i++) {
          const r = Math.random() * rMax, u = Math.random() * 2 - 1, ph = Math.random() * 6.283, sq = Math.sqrt(1 - u * u);
          const x = r * sq * Math.cos(ph), y = r * sq * Math.sin(ph), z = r * u;
          const R = radial(n, l, r), a = fn(x, y, z, r || 1e-6);
          const v = R * R * a * a * r * r;
          if (v > peak) peak = v;
        }
        let made = 0, guard = 0;
        while (made < count && guard < count * 400) {
          guard++;
          const r = Math.random() * rMax, u = Math.random() * 2 - 1, ph = Math.random() * 6.283, sq = Math.sqrt(1 - u * u);
          const x = r * sq * Math.cos(ph), y = r * sq * Math.sin(ph), z = r * u;
          const R = radial(n, l, r), a = fn(x, y, z, r || 1e-6);
          const v = R * R * a * a * r * r;
          if (Math.random() * peak * 1.05 > v) continue;
          pos[made * 3] = x * scale; pos[made * 3 + 1] = z * scale; pos[made * 3 + 2] = y * scale;
          const psi = R * a, c = psi >= 0 ? A : B;
          col[made * 3] = c.r; col[made * 3 + 1] = c.g; col[made * 3 + 2] = c.b;
          made++;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos.subarray(0, made * 3), 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col.subarray(0, made * 3), 3));
        const mat = new THREE.PointsMaterial({ size: 0.07, map: makeOrbitTexture(), vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
        g.add(new THREE.Points(geo, mat));
      } else {
        // Balloon: radius follows the angular function, one color per phase.
        const seg = 96;
        const build = (sign, color) => {
          const pts = [], idx = [];
          for (let i = 0; i <= seg; i++) {
            const th = (i / seg) * Math.PI;
            for (let j = 0; j <= seg; j++) {
              const ph = (j / seg) * Math.PI * 2;
              const x = Math.sin(th) * Math.cos(ph), y = Math.sin(th) * Math.sin(ph), z = Math.cos(th);
              const a = fn(x, y, z, 1);
              const rr = sign * a > 0 ? Math.abs(a) : 0;
              const R = l === 0 ? 1.5 : 2.05 * rr;
              pts.push(x * R, z * R, y * R);
            }
          }
          for (let i = 0; i < seg; i++) for (let j = 0; j < seg; j++) {
            const a = i * (seg + 1) + j, b = a + seg + 1;
            idx.push(a, b, a + 1, b, b + 1, a + 1);
          }
          const geo = new THREE.BufferGeometry();
          geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
          geo.setIndex(idx); geo.computeVertexNormals();
          const mesh = new THREE.Mesh(geo, atomMat(color, { opacity: 0.86, roughness: 0.25 }));
          mesh.material.side = THREE.DoubleSide;
          mesh.material.depthWrite = true;
          return mesh;
        };
        g.add(build(1, '#2FD6F2'));
        if (l > 0) g.add(build(-1, '#FF4FA3'));
      }
      // A tiny nucleus and faint axes for orientation.
      const nuc = new THREE.Mesh(sphereGeo(0.06, 16), atomMat('#FFD23F'));
      g.add(nuc);
      if (opts.axes !== false) {
        const axis = (a, b) => {
          const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]);
          g.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.26 })));
        };
        axis([-2.5, 0, 0], [2.5, 0, 0]); axis([0, -2.5, 0], [0, 2.5, 0]); axis([0, 0, -2.5], [0, 0, 2.5]);
      }
      root.add(g);
      api.labels([{ p: [2.66, 0, 0], text: 'x', cls: 'is-axis' }, { p: [0, 2.66, 0], text: 'z', cls: 'is-axis' }, { p: [0, 0, 2.66], text: 'y', cls: 'is-axis' }]);
      state.needs = true;
      return api;
    };
    /** Crystal unit cells. kind: 'sc','bcc','fcc','nacl'. o.fill: show real overlapping sphere sizes. */
    api.lattice = function (kind, o = {}) {
      clearGroup();
      camera.position.z = state.dist = Math.max(state.dist, 9.5);
      const g = new THREE.Group();
      const a = 2.4, h = a / 2;
      const corners = [];
      for (const x of [-h, h]) for (const y of [-h, h]) for (const z of [-h, h]) corners.push([x, y, z]);
      const faces = [[h, 0, 0], [-h, 0, 0], [0, h, 0], [0, -h, 0], [0, 0, h], [0, 0, -h]];
      const edges = [[h, h, 0], [h, -h, 0], [-h, h, 0], [-h, -h, 0], [h, 0, h], [h, 0, -h], [-h, 0, h], [-h, 0, -h], [0, h, h], [0, h, -h], [0, -h, h], [0, -h, -h]];
      const fill = !!o.fill;
      const add = (p, color, r) => {
        const m = new THREE.Mesh(sphereGeo(r, 32), atomMat(color));
        m.position.set(...p); g.add(m);
      };
      if (kind === 'sc') corners.forEach((p) => add(p, o.color || '#FF8A2B', fill ? a * 0.5 : 0.34));
      if (kind === 'bcc') { corners.forEach((p) => add(p, o.color || '#2FD6F2', fill ? a * 0.433 : 0.32)); add([0, 0, 0], o.color2 || '#FF4FA3', fill ? a * 0.433 : 0.36); }
      if (kind === 'fcc') { corners.forEach((p) => add(p, o.color || '#FFD23F', fill ? a * 0.3535 : 0.3)); faces.forEach((p) => add(p, o.color2 || '#FF4FA3', fill ? a * 0.3535 : 0.3)); }
      if (kind === 'nacl') {
        // Cl- on corners and faces, Na+ on edges and center.
        corners.concat(faces).forEach((p) => add(p, window.Art.elementColor('Cl'), 0.44));
        edges.concat([[0, 0, 0]]).forEach((p) => add(p, window.Art.elementColor('Na'), 0.27));
      }
      // The cell outline.
      const box = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(a, a, a)), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }));
      g.add(box);
      root.add(g);
      state.needs = true;
      return api;
    };
    /** HTML labels that track 3D points in root space. */
    api.labels = function (list) {
      labelLayer.innerHTML = '';
      state.labels = list.map((l) => {
        const el = document.createElement('div');
        el.className = 'v3d-label ' + (l.cls || '');
        el.innerHTML = l.text;
        labelLayer.appendChild(el);
        return { el, p: new THREE.Vector3(...l.p) };
      });
      state.needs = true;
      return api;
    };
    /** Add a per-frame callback (dt, t), for custom animated geometry. */
    api.animate = (fn) => { state.animators.push(fn); return api; };
    api.setAuto = (on) => { state.auto = on && !Lab.reducedMotion; return api; };
    api.setDistance = (d) => { state.dist = d; camera.position.z = d; state.needs = true; return api; };
    api.rotateTo = (x, y) => { root.rotation.set(x, y, 0); state.needs = true; return api; };

    /* Interaction */
    let lastX = 0, lastY = 0, vx = 0, vy = 0;
    canvas.addEventListener('pointerdown', (e) => {
      state.dragging = true; lastX = e.clientX; lastY = e.clientY; vx = vy = 0;
      try { canvas.setPointerCapture(e.pointerId); } catch (x) { /* synthetic */ }
      host.classList.add('is-grabbing'); host.classList.add('has-moved');
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!state.dragging) return;
      vy = (e.clientX - lastX) * 0.01; vx = (e.clientY - lastY) * 0.01;
      root.rotation.y += vy; root.rotation.x = Lab.clamp(root.rotation.x + vx, -1.5, 1.5);
      lastX = e.clientX; lastY = e.clientY; state.needs = true;
    });
    const end = () => { state.dragging = false; host.classList.remove('is-grabbing'); };
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);

    /* Size + loop */
    function fit() {
      const w = host.clientWidth || 600;
      const h = opts.aspect ? w * opts.aspect : Math.min(height, Math.max(280, w * 0.9));
      host.style.setProperty('--v3d-h', h + 'px');
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // On narrow screens, pull back so the whole model stays in frame.
      camera.position.z = state.dist * (w / h < 1 ? 1 / Math.max(0.55, w / h) : 1);
      camera.updateProjectionMatrix();
      state.needs = true;
    }
    const v = new THREE.Vector3();
    function placeLabels() {
      if (!state.labels.length) return;
      const w = host.clientWidth, h = host.clientHeight || 1;
      state.labels.forEach((l) => {
        v.copy(l.p).applyMatrix4(root.matrixWorld).project(camera);
        l.el.style.transform = `translate(-50%,-50%) translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px)`;
      });
    }
    let raf = 0, tPrev = 0, clock = 0;
    function draw(now) {
      raf = 0;
      if (!state.visible) return;
      const dt = tPrev ? Math.min(0.05, (now - tPrev) / 1000) : 0;
      tPrev = now; clock += dt;
      if (state.auto && !state.dragging) { root.rotation.y += dt * 0.38; state.needs = true; }
      if (!state.dragging && (Math.abs(vy) > 0.0005 || Math.abs(vx) > 0.0005)) {
        root.rotation.y += vy; root.rotation.x = Lab.clamp(root.rotation.x + vx, -1.5, 1.5);
        vy *= 0.92; vx *= 0.92; state.needs = true;
      }
      if (state.animators.length) { state.animators.forEach((fn) => fn(dt, clock)); state.needs = true; }
      if (state.needs) {
        root.updateMatrixWorld();
        renderer.render(scene, camera);
        placeLabels();
        state.needs = false;
      }
      raf = requestAnimationFrame(draw);
    }
    new IntersectionObserver((es) => {
      state.visible = es[0].isIntersecting;
      if (state.visible && !raf) { tPrev = 0; state.needs = true; raf = requestAnimationFrame(draw); }
    }, { threshold: 0.01 }).observe(host);
    new ResizeObserver(fit).observe(host);
    fit();
    api.render = () => { state.needs = true; root.updateMatrixWorld(); renderer.render(scene, camera); placeLabels(); };
    if (!Chem3D._all) Chem3D._all = [];
    Chem3D._all.push(api);
    return api;
  };
})();
