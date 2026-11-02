/* The Mole Hole: small physics helpers for canvases. Load this only on pages that need it.

   Sim.Box: hard-disk particles bouncing in a rectangle. Used for gases, solutions and collisions.
     const box = new Sim.Box({ x0:0, y0:0, x1:800, y1:450, speed:120 });
     box.add({ n:40, r:9, kind:'N2', mass:28 });
     box.step(dt);                         // advance
     box.particles.forEach(p => draw(p));  // p.x p.y p.vx p.vy p.r p.kind p.mass
     box.setTemperature(2);                // rescale speeds; 1 keeps the starting speed
     box.wallHits                          // momentum delivered to the walls since last read of box.pressure()
     box.onHit = (a, b) => { ... };        // called on each particle collision
*/
(function () {
  'use strict';
  const Sim = (window.Sim = {});

  class Box {
    constructor(o = {}) {
      this.x0 = o.x0 ?? 0; this.y0 = o.y0 ?? 0; this.x1 = o.x1 ?? 800; this.y1 = o.y1 ?? 450;
      this.speed = o.speed ?? 120; this.temp = o.temperature ?? 1;
      this.particles = [];
      this.collide = o.collide !== false;
      this.gravity = o.gravity || 0;
      this.onHit = null; this.onWall = null;
      this.wallHits = 0; this.pressT = 0; this.pressAvg = 0;
      this.seed = o.seed ?? 1;
    }
    _r() { this.seed = (this.seed * 1664525 + 1013904223) % 4294967296; return this.seed / 4294967296; }
    add({ n = 1, r = 8, kind = 'A', mass = 1, data = null, speed } = {}) {
      for (let i = 0; i < n; i++) {
        const a = this._r() * Math.PI * 2;
        // Speeds scale as 1/sqrt(mass) so heavy particles really do move slower.
        const v = (speed ?? this.speed) * Math.sqrt(this.temp) * (0.6 + this._r() * 0.8) * Math.sqrt(1 / mass);
        let x = 0, y = 0, tries = 0;
        do {
          x = this.x0 + r + this._r() * Math.max(1, this.x1 - this.x0 - 2 * r);
          y = this.y0 + r + this._r() * Math.max(1, this.y1 - this.y0 - 2 * r);
          tries++;
        } while (tries < 30 && this.particles.some((p) => (p.x - x) ** 2 + (p.y - y) ** 2 < (p.r + r) ** 2));
        this.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r, kind, mass, data, id: this.particles.length, rot: this._r() * 6.28, spin: (this._r() - 0.5) * 2 });
      }
      return this;
    }
    clear() { this.particles.length = 0; }
    remove(kindOrFn, count = Infinity) {
      const fn = typeof kindOrFn === 'function' ? kindOrFn : (p) => p.kind === kindOrFn;
      let left = count;
      this.particles = this.particles.filter((p) => { if (left > 0 && fn(p)) { left--; return false; } return true; });
    }
    setBounds(x0, y0, x1, y1) { this.x0 = x0; this.y0 = y0; this.x1 = x1; this.y1 = y1; }
    /** Rescale all speeds to a new temperature factor. Speed goes as the square root of temperature. */
    setTemperature(t) {
      if (t <= 0) t = 0.0001;
      const k = Math.sqrt(t / this.temp);
      this.particles.forEach((p) => { p.vx *= k; p.vy *= k; });
      this.temp = t;
    }
    step(dt) {
      const P = this.particles, n = P.length;
      for (let i = 0; i < n; i++) {
        const p = P[i];
        if (p.frozen) continue;
        if (this.gravity) p.vy += this.gravity * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.spin * dt;
        const m = p.mass;
        if (p.x < this.x0 + p.r) { p.x = this.x0 + p.r; if (p.vx < 0) { this.wallHits += 2 * m * -p.vx; p.vx = -p.vx; if (this.onWall) this.onWall(p); } }
        if (p.x > this.x1 - p.r) { p.x = this.x1 - p.r; if (p.vx > 0) { this.wallHits += 2 * m * p.vx; p.vx = -p.vx; if (this.onWall) this.onWall(p); } }
        if (p.y < this.y0 + p.r) { p.y = this.y0 + p.r; if (p.vy < 0) { this.wallHits += 2 * m * -p.vy; p.vy = -p.vy; if (this.onWall) this.onWall(p); } }
        if (p.y > this.y1 - p.r) { p.y = this.y1 - p.r; if (p.vy > 0) { this.wallHits += 2 * m * p.vy; p.vy = -p.vy; if (this.onWall) this.onWall(p); } }
      }
      if (this.collide) this._collide();
      this.pressT += dt;
    }
    _collide() {
      const P = this.particles, n = P.length;
      if (n < 2) return;
      let maxR = 0;
      for (const p of P) if (p.r > maxR) maxR = p.r;
      const cell = Math.max(8, maxR * 2.2);
      const grid = new Map();
      const key = (cx, cy) => cx * 73856093 ^ cy * 19349663;
      for (let i = 0; i < n; i++) {
        const k = key(Math.floor(P[i].x / cell), Math.floor(P[i].y / cell));
        const list = grid.get(k);
        if (list) list.push(i); else grid.set(k, [i]);
      }
      for (let i = 0; i < n; i++) {
        const a = P[i];
        const cx = Math.floor(a.x / cell), cy = Math.floor(a.y / cell);
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
          const list = grid.get(key(cx + dx, cy + dy));
          if (!list) continue;
          for (const j of list) {
            if (j <= i) continue;
            const b = P[j];
            const ex = b.x - a.x, ey = b.y - a.y, min = a.r + b.r, d2 = ex * ex + ey * ey;
            if (d2 >= min * min || d2 === 0) continue;
            const d = Math.sqrt(d2), nx = ex / d, ny = ey / d;
            const overlap = (min - d) / 2;
            a.x -= nx * overlap; a.y -= ny * overlap; b.x += nx * overlap; b.y += ny * overlap;
            const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
            if (rel <= 0) continue;
            const imp = (2 * rel) / (a.mass + b.mass);
            a.vx -= imp * b.mass * nx; a.vy -= imp * b.mass * ny;
            b.vx += imp * a.mass * nx; b.vy += imp * a.mass * ny;
            if (this.onHit) this.onHit(a, b, rel);
          }
        }
      }
    }
    /** Smoothed wall pressure (arbitrary units): momentum to the walls per unit time and perimeter. */
    pressure() {
      if (this.pressT > 0.25) {
        const perim = 2 * (this.x1 - this.x0 + (this.y1 - this.y0));
        const inst = this.wallHits / this.pressT / Math.max(1, perim);
        this.pressAvg = this.pressAvg ? this.pressAvg * 0.82 + inst * 0.18 : inst;
        this.wallHits = 0; this.pressT = 0;
      }
      return this.pressAvg;
    }
    /** Average kinetic energy per particle (arbitrary units). */
    ke() {
      let s = 0;
      for (const p of this.particles) s += 0.5 * p.mass * (p.vx * p.vx + p.vy * p.vy);
      return s / Math.max(1, this.particles.length);
    }
  }
  Sim.Box = Box;

  /** A stable, deterministic layout of n dots in a circle or rect, handy for scenes. */
  Sim.scatter = function (n, x0, y0, x1, y1, seed = 1, minD = 0) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      let x = 0, y = 0;
      for (let t = 0; t < 40; t++) {
        x = x0 + Lab.rand(seed + i * 3.1 + t * 7.3) * (x1 - x0);
        y = y0 + Lab.rand(seed + i * 5.7 + t * 11.9) * (y1 - y0);
        if (!minD || pts.every((p) => Math.hypot(p[0] - x, p[1] - y) >= minD)) break;
      }
      pts.push([x, y]);
    }
    return pts;
  };
})();
