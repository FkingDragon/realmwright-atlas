function terrainLib() {
  'use strict';
  // World is measured in miles. 4096 x 2560 miles.
  const W = 4096, H = 2560;
  const B = { DEEP: 0, OCEAN: 1, SHALLOW: 2, ICE: 3, BEACH: 4, GRASS: 5, FOREST: 6, TAIGA: 7, JUNGLE: 8, SWAMP: 9, DESERT: 10, SCRUB: 11, TUNDRA: 12, SNOW: 13, MOUNTAIN: 14, PEAK: 15, RIVER: 16 };
  const NAMES = ['Deep ocean', 'Open sea', 'Shallows', 'Pack ice', 'Beach', 'Grassland', 'Temperate forest', 'Taiga', 'Jungle', 'Swamp', 'Desert', 'Scrubland', 'Tundra', 'Snowfield', 'Mountains', 'Snowcapped peaks', 'River'];
  const isWater = (b) => b <= 3 || b === 16;

  // ---------- noise ----------
  const perm = new Uint8Array(512), pg = new Uint8Array(512);
  const GR = new Float64Array([1, 1, -1, 1, 1, -1, -1, -1, 1, 0, -1, 0, 0, 1, 0, -1]);
  const F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;
  const OX = new Float64Array(24), OY = new Float64Array(24);
  let SEED = 0;

  function mulberry(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function setSeed(s) {
    SEED = s | 0;
    const r = mulberry(SEED ^ 0x5bd1e995);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = p[i]; p[i] = p[j]; p[j] = t; }
    for (let i = 0; i < 512; i++) { perm[i] = p[i & 255]; pg[i] = (perm[i] & 7) * 2; }
    for (let i = 0; i < 24; i++) { OX[i] = r() * 1000 - 500; OY[i] = r() * 1000 - 500; }
  }
  function noise2(xin, yin) {
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s), j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const x0 = xin - (i - t), y0 = yin - (j - t);
    let i1, j1;
    if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2, x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    let n = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 > 0) { t0 *= t0; const g = pg[ii + perm[jj]]; n += t0 * t0 * (GR[g] * x0 + GR[g + 1] * y0); }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 > 0) { t1 *= t1; const g = pg[ii + i1 + perm[jj + j1]]; n += t1 * t1 * (GR[g] * x1 + GR[g + 1] * y1); }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 > 0) { t2 *= t2; const g = pg[ii + 1 + perm[jj + 1]]; n += t2 * t2 * (GR[g] * x2 + GR[g + 1] * y2); }
    return 70 * n;
  }
  // integer hash -> [0,1)
  function hash(x, y, s) {
    let h = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1) ^ Math.imul((s | 0) + SEED, 0x9e3779b1);
    h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  function smooth(a, b, x) { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); }

  // ---------- fields ----------
  // Coarse fields vary slowly; at close zoom they are interpolated across a tile.
  // c: 0 warpX, 1 warpY, 2 bias, 3 mountain mask, 4 moisture, 5 temperature, 6 river strength, 7 rwarpX, 8 rwarpY, 9 beach factor
  function coarse(x, y, c) {
    c[0] = 95 * noise2(x * 0.0011 + 3.1, y * 0.0011 + 1.7) + 22 * noise2(x * 0.0043 + 9.2, y * 0.0043 - 3.3);
    c[1] = 95 * noise2(x * 0.0011 - 5.3, y * 0.0011 + 8.8) + 22 * noise2(x * 0.0043 - 1.1, y * 0.0043 + 6.6);
    let bias = 0.05 + 0.3 * noise2(x * 0.00034 + 20.5, y * 0.00034 - 14.2);
    const edge = Math.min(Math.min(x, W - x), Math.min(y, H - y) * 1.25);
    if (edge < 460) { const k = 1 - Math.max(edge, 0) / 460; bias -= k * k * 1.2; }
    c[2] = bias;
    c[3] = smooth(-0.1, 0.5, noise2(x * 0.0007 + 33.3, y * 0.0007 + 12.1));
    const mo = noise2(x * 0.0016 + 51, y * 0.0016 - 47) * 0.62 + noise2(x * 0.0042 - 17, y * 0.0042 + 23) * 0.25 + noise2(x * 0.011 + 5, y * 0.011 + 8) * 0.1;
    c[4] = clamp01(0.5 + 0.55 * mo);
    const lat = Math.abs(y / H - 0.5) * 2;
    c[5] = 1.06 - lat * 1.18 + 0.12 * noise2(x * 0.0013 + 71, y * 0.0013 - 3);
    c[6] = smooth(-0.25, 0.45, noise2(x * 0.0011 - 90, y * 0.0011 + 40));
    c[7] = 30 * noise2(x * 0.006 + 1.3, y * 0.006 + 2.9);
    c[8] = 30 * noise2(x * 0.006 + 4.1, y * 0.006 - 6.2);
    c[9] = 0.3 + 0.7 * smooth(-0.4, 0.6, noise2(x * 0.005 + 60, y * 0.005 + 60));
  }

  function classify(e, m, t, bf) {
    if (e < 0) {
      if (t < -0.02) return B.ICE;
      if (e < -0.3) return B.DEEP;
      if (e < -0.07) return B.OCEAN;
      return B.SHALLOW;
    }
    if (e > 0.7) return B.PEAK;
    if (e > 0.52) return t < 0.12 ? B.PEAK : B.MOUNTAIN;
    if (t < 0.06) return B.SNOW;
    if (e < 0.006 * bf && t > 0.18) return B.BEACH;
    if (t < 0.2) return B.TUNDRA;
    if (m > 0.68 && e < 0.07 && t > 0.3) return B.SWAMP;
    if (t < 0.42) return m > 0.44 ? B.TAIGA : B.GRASS;
    if (t > 0.74) {
      if (m < 0.34) return B.DESERT;
      if (m < 0.46) return B.SCRUB;
      if (m > 0.62) return B.JUNGLE;
      return B.GRASS;
    }
    if (m < 0.3) return B.SCRUB;
    if (m > 0.55) return B.FOREST;
    return B.GRASS;
  }

  const RG = 0.0084; // river noise gradient per mile (measured)
  const RL = [24, 6, 1.6, 0.42, 0.11, 0.03]; // meander wavelengths in miles
  const ML = [2.4, 0.8, 0.27, 0.09, 0.03];     // climate-edge detail wavelengths in miles

  function fine(x, y, c, oct, p, o) {
    const wx = x + c[0], wy = y + c[1];
    let e = 0, a = 0.55, f = 0.0009;
    for (let i = 0; i < oct; i++) { e += a * noise2(wx * f + OX[i], wy * f + OY[i]); a *= 0.5; f *= 2; }
    e += c[2];
    if (e > -0.05 && c[3] > 0) {
      const r = 1 - Math.abs(noise2(wx * 0.0028 + 7.7, wy * 0.0028 - 2.2));
      const r2 = 1 - Math.abs(noise2(wx * 0.0076 - 4.4, wy * 0.0076 + 5.5));
      e += (r * r * r * 0.5 + r2 * r2 * r * 0.12) * c[3] * smooth(-0.05, 0.14, e);
    }
    // climate detail: each finer octave keeps the same slope, so biome edges stay ragged at every zoom
    let md = 0.07 * noise2(x * 0.04 + 17.7, y * 0.04 - 3.9) + (p < 1 ? 0.035 * noise2(x * 0.16 - 8.8, y * 0.16 + 1.4) : 0);
    for (let k = 0; k < 5; k++) { const lam = ML[k]; if (lam < 2 * p) break; md += 0.005 * lam * noise2(x / lam - 61 + k * 13, y / lam + 37 - k * 5); }
    const m = c[4] + md;
    const t = c[5] - Math.max(0, e) * 0.5 + md * 0.5;
    let b = classify(e, m, t, c[9]);
    let rd = 9, hw = 0;
    if (b >= 4 && b !== B.MOUNTAIN && b !== B.PEAK) {
      const st = c[6] * (1 - smooth(0.2, 0.44, e));
      if (st > 0.02) {
        const rx = x + c[7], ry = y + c[8];
        let n = noise2(rx * 0.0024 + 13.7, ry * 0.0024 - 7.1);
        // meanders: displace the channel by a few octaves of noise, finer ones only when visible
        for (let k = 0; k < 6; k++) { const lam = RL[k]; if (lam < 3 * p) break; n += RG * lam * 0.16 * noise2(x / lam + 40 + k * 11, y / lam - 20 - k * 7); }
        const dmi = Math.abs(n) / RG;
        const hwReal = st * 0.028;
        const minor = 0.12 + 0.36 * smooth(0.5, 12, p);
        hw = st > minor ? Math.max(hwReal, p * 0.9) : hwReal;
        if (hw > 0) { rd = dmi / hw; if (rd < 1) b = B.RIVER; }
      }
    }
    o.e = e; o.m = m; o.t = t; o.b = b; o.rd = rd; o.hw = hw;
  }

  const _c = new Float64Array(10);
  const _o = { e: 0, m: 0, t: 0, b: 0, rd: 9, hw: 0 };
  function pFor(z) { return W / Math.pow(2, z) / 256; }
  function octFor(p) { return Math.max(4, Math.min(20, Math.floor(Math.log2(1111 / (1.5 * p))) + 1)); }
  function natural(x, y, oct, p) { coarse(x, y, _c); fine(x, y, _c, oct, p, _o); return _o; }

  // Painted strokes: flat array [x, y, r, biome, ...]; biome -1 restores natural terrain
  function strokeBiome(x, y, b, nat, circ) {
    for (let k = 0; k < circ.length; k += 4) {
      const dx = x - circ[k], dy = y - circ[k + 1], r = circ[k + 2];
      const d2 = dx * dx + dy * dy;
      if (d2 >= r * r) continue;
      if (d2 > r * r * 0.46) {
        const nz = noise2(x / r * 1.7 + k * 0.37, y / r * 1.7 - k * 0.29);
        if (Math.sqrt(d2) > r * (0.84 + 0.16 * nz)) continue;
      }
      const nb = circ[k + 3];
      b = nb < 0 ? nat : nb;
    }
    return b;
  }
  const EMPTY = new Float64Array(0);
  function biomeAt(x, y, z, circ) {
    const p = pFor(z);
    const o = natural(x, y, octFor(p), p);
    return circ && circ.length ? strokeBiome(x, y, o.b, o.b, circ) : o.b;
  }

  // Realms: nearest capital with warped distance. caps = [x, y, x, y, ...]
  // gap: how much nearer the closest capital is than the next; edge: true distance to the dividing line
  // between their two realms (the perpendicular bisector), which stays a thin line however close two capitals are
  const _r = { i: -1, gap: 1e9, edge: 1e9 };
  function realmAt(x, y, caps) {
    // the wiggle fades out within 90 units of a capital, so a capital always sits in its own realm (v25)
    let d0 = 1e18;
    for (let k = 0; k < caps.length; k += 2) { const dx = x - caps[k], dy = y - caps[k + 1], d = dx * dx + dy * dy; if (d < d0) d0 = d; }
    const f = d0 >= 8100 ? 1 : Math.sqrt(d0) / 90;
    const rx = x + f * (55 * noise2(x * 0.0035 + 200, y * 0.0035 - 100) + 14 * noise2(x * 0.013 - 7, y * 0.013 + 3));
    const ry = y + f * (55 * noise2(x * 0.0035 - 300, y * 0.0035 + 150) + 14 * noise2(x * 0.013 + 9, y * 0.013 - 5));
    let d1 = 1e18, d2 = 1e18, i1 = -1, i2 = -1;
    for (let k = 0; k < caps.length; k += 2) {
      const dx = rx - caps[k], dy = ry - caps[k + 1];
      const d = dx * dx + dy * dy;
      if (d < d1) { d2 = d1; i2 = i1; d1 = d; i1 = k >> 1; } else if (d < d2) { d2 = d; i2 = k >> 1; }
    }
    _r.i = i1; _r.gap = caps.length >= 4 ? Math.sqrt(d2) - Math.sqrt(d1) : 1e9;
    if (i2 >= 0) { const D = Math.hypot(caps[i1 * 2] - caps[i2 * 2], caps[i1 * 2 + 1] - caps[i2 * 2 + 1]); _r.edge = D > 1e-6 ? (d2 - d1) / (2 * D) : 1e9; } else _r.edge = 1e9;
    return _r;
  }

  // ---------- colours ----------
  const COL = [
    [27, 55, 79], [40, 82, 108], [74, 126, 140], [214, 228, 233], [219, 199, 150], [132, 160, 84],
    [70, 108, 58], [60, 94, 78], [42, 102, 56], [94, 106, 72], [221, 192, 136], [178, 166, 106],
    [158, 160, 138], [238, 241, 243], [138, 128, 112], [242, 242, 238], [66, 118, 146]
  ];
  const REALM = [[176, 70, 60], [70, 110, 170], [190, 150, 50], [110, 150, 70], [140, 80, 150], [60, 150, 150], [200, 110, 50], [120, 120, 160], [170, 90, 110], [90, 130, 100], [160, 130, 90], [80, 90, 140]];

  // ---------- tile renderer (runs in workers) ----------
  function renderTile(z, tx, ty, R, circ, caps, borders) {
    const TS = W / Math.pow(2, z), p = TS / R, x0 = tx * TS, y0 = ty * TS;
    const oct = octFor(p);
    const N = R + 2, NN = N * N;
    const E = new Float64Array(NN), BI = new Uint8Array(NN), MO = new Float32Array(NN), TE = new Float32Array(NN), RD = new Float32Array(NN), HW = new Float32Array(NN);
    const hasC = circ && circ.length > 0;
    const o = { e: 0, m: 0, t: 0, b: 0, rd: 9, hw: 0 };
    const c = new Float64Array(10);
    const useGrid = z >= 7;
    const CG = 8, GN = CG + 1;
    let G = null;
    if (useGrid) {
      G = new Float64Array(GN * GN * 10);
      const tmp = new Float64Array(10);
      for (let gj = 0; gj < GN; gj++) for (let gi = 0; gi < GN; gi++) {
        const gx = x0 + (-0.5 + gi * (R + 1) / CG) * p, gy = y0 + (-0.5 + gj * (R + 1) / CG) * p;
        coarse(gx, gy, tmp);
        G.set(tmp, (gj * GN + gi) * 10);
      }
    }
    for (let jj = 0; jj < N; jj++) {
      const y = y0 + (jj - 0.5) * p;
      let vj = 0, fj = 0;
      if (useGrid) { const u = jj * CG / (R + 1); vj = Math.min(CG - 1, Math.floor(u)); fj = u - vj; }
      for (let ii = 0; ii < N; ii++) {
        const x = x0 + (ii - 0.5) * p;
        if (useGrid) {
          const u = ii * CG / (R + 1); const vi = Math.min(CG - 1, Math.floor(u)); const fi = u - vi;
          const a = (vj * GN + vi) * 10, b2 = a + 10, c2 = a + GN * 10, d = c2 + 10;
          const w00 = (1 - fi) * (1 - fj), w10 = fi * (1 - fj), w01 = (1 - fi) * fj, w11 = fi * fj;
          for (let k = 0; k < 10; k++) c[k] = G[a + k] * w00 + G[b2 + k] * w10 + G[c2 + k] * w01 + G[d + k] * w11;
        } else coarse(x, y, c);
        fine(x, y, c, oct, p, o);
        const idx = jj * N + ii;
        E[idx] = o.e; MO[idx] = o.m; TE[idx] = o.t; RD[idx] = o.rd; HW[idx] = o.hw;
        BI[idx] = hasC ? strokeBiome(x, y, o.b, o.b, circ) : o.b;
      }
    }

    const px = new Uint8ClampedArray(R * R * 4);
    const S = 3.4 * Math.pow(16 / p, 0.8);
    const close = z >= 14;             // battle/local scale: trees drawn as sprites, forest floor shows
    const fineTex = p < 0.004;
    const kA = 1 / Math.max(0.012, 2.5 * p), kB = 1 / Math.max(0.0025, 2.5 * p), kS = 1 / Math.max(0.0076, 3 * p);
    const showRealm = borders && caps && caps.length >= 2 && z <= 9;
    const realmMix = z <= 5 ? 0.17 : 0.17 * (1 - (z - 5) / 5);
    const coastInk = z <= 12;
    const foam = p < 0.002;
    const L0 = 0.466, L1 = 0.543, L2 = 0.699;

    for (let j = 0; j < R; j++) {
      const y = y0 + (j + 0.5) * p;
      for (let i = 0; i < R; i++) {
        const x = x0 + (i + 0.5) * p;
        const idx = (j + 1) * N + (i + 1);
        const b = BI[idx], e = E[idx], m = MO[idx], t = TE[idx];
        const col = COL[b];
        let r = col[0], g = col[1], bl = col[2];
        const tA = noise2(x * kA + 31.1, y * kA - 12.7);
        const tB = fineTex ? noise2(x * kB - 5.5, y * kB + 8.8) : 0;
        const water = isWater(b);
        if (b <= 2) {
          if (e < 0) {
            const k = Math.pow(smooth(-0.55, 0, e), 1.6);
            r = 27 + (82 - 27) * k; g = 55 + (134 - 55) * k; bl = 79 + (146 - 79) * k;
            const sh = smooth(-0.035, 0, e) * 0.35;
            r += (128 - r) * sh; g += (176 - g) * sh; bl += (172 - bl) * sh;
          } else { r = 74; g = 126; bl = 140; }
          const rip = tA * 3 + tB * 5; r += rip; g += rip; bl += rip;
          if (foam && e < 0) {
            const gx = (E[idx + 1] - E[idx - 1]) * 0.5 / p, gy = (E[idx + N] - E[idx - N]) * 0.5 / p;
            const gm = Math.sqrt(gx * gx + gy * gy) + 1e-12;
            const dist = -e / gm;
            if (dist < 0.0009) { const f = 0.55 + 0.25 * tB; r += (236 - r) * f; g += (240 - g) * f; bl += (232 - bl) * f; }
            else if (dist < 0.004) { const f = 0.3 * (1 - dist / 0.004); r += (150 - r) * f; g += (196 - g) * f; bl += (188 - bl) * f; }
          }
        } else if (b === 16) {
          const k = clamp01(RD[idx]);
          const d = 1 - k * k;
          r = 104 + (46 - 104) * d; g = 150 + (94 - 150) * d; bl = 150 + (126 - 150) * d;
          const rip = tA * 3 + tB * 6; r += rip; g += rip; bl += rip;
        } else if (b === 3) {
          const v = tA * 6 + tB * 6; r += v; g += v; bl += v;
        } else {
          // land
          switch (b) {
            case 5: { // grass: dry -> lush
              const k = clamp01((m - 0.25) / 0.45);
              r = 160 + (110 - 160) * k; g = 168 + (150 - 168) * k; bl = 96 + (74 - 96) * k;
              if (fineTex) { const pt = noise2(x * kA * 0.3 + 9.1, y * kA * 0.3 - 4.4); r += pt * 12; g += pt * 7; bl += pt * 2; }
              if (t < 0.45) { r -= 6; g -= 2; bl += 4; }
              break;
            }
            case 6: case 7: case 8: {
              if (close) { // forest floor
                if (b === 6) { r = 92; g = 104; bl = 58; } else if (b === 7) { r = 98; g = 96; bl = 70; } else { r = 66; g = 92; bl = 46; }
              } else {
                const sp = noise2(x * kS + 3.3, y * kS - 9.1);
                const f = 1 + 0.16 * sp; r *= f; g *= f; bl *= f;
              }
              break;
            }
            case 9: { // swamp: pools of murky water
              const pool = noise2(x * kA * 0.7 + 77, y * kA * 0.7 - 41) + tB * 0.3;
              if (pool > 0.35) { r = 70; g = 92; bl = 86; } else { r = 98 + tA * 6; g = 108; bl = 70; }
              break;
            }
            case 10: { // desert dunes
              const d = Math.sin((x * kA * 3.1 + 1.6 * noise2(x * kA * 0.4, y * kA * 0.4)) * 1.0 + y * kA * 1.2);
              const f = 1 + 0.035 * d; r *= f; g *= f; bl *= f;
              break;
            }
            case 14: { const v = tA * 8 + tB * 6; r += v; g += v; bl += v; break; }
            case 12: { r += tA * 6; g += tA * 4; break; }
            default: break;
          }
          if (b !== 15 && b !== 13 && e > 0.28) {
            const h = smooth(0.28, 0.54, e) * 0.35;
            r += (150 - r) * h; g += (138 - g) * h; bl += (112 - bl) * h;
          }
          // grain
          const gr = tA * 4 + tB * 5;
          r += gr; g += gr; bl += gr * 0.7;
          // river banks
          const rd = RD[idx];
          if (rd < 1.45 && HW[idx] > p * 1.5 && b !== 4) {
            const f = (1 - (rd - 1) / 0.45) * 0.55;
            r += (150 - r) * f; g += (134 - g) * f; bl += (98 - bl) * f;
          }
          // hillshade
          let dx = (E[idx + 1] - E[idx - 1]) * 0.5 * S, dy = (E[idx + N] - E[idx - N]) * 0.5 * S;
          if (b === 14 || b === 15) { dx *= 1.25; dy *= 1.25; }
          const nl = (dx * L0 + dy * L1 + L2) / Math.sqrt(dx * dx + dy * dy + 1);
          let sh = 1 + (nl / L2 - 1) * 0.85;
          sh = sh < 0.45 ? 0.45 : sh > 1.35 ? 1.35 : sh;
          if (b === 15 || b === 13) { r *= sh; g *= sh; bl *= sh * 1.02 + 0.04 * (1 - sh); } else { r *= sh; g *= sh; bl *= sh; }
          // coast ink
          if (coastInk && (isWater(BI[idx - 1]) || isWater(BI[idx + 1]) || isWater(BI[idx - N]) || isWater(BI[idx + N]))) {
            const isRiv = BI[idx - 1] === 16 || BI[idx + 1] === 16 || BI[idx - N] === 16 || BI[idx + N] === 16;
            const f = isRiv ? 0.2 : 0.42;
            r *= 1 - f; g *= 1 - f; bl *= 1 - f * 0.8;
          }
        }
        // realms
        if (showRealm && !water) {
          const rr = realmAt(x, y, caps);
          if (rr.i >= 0) {
            const rc = REALM[rr.i % REALM.length];
            r += (rc[0] - r) * realmMix; g += (rc[1] - g) * realmMix; bl += (rc[2] - bl) * realmMix;
            if (rr.edge < 1.1 * p) { const f = 0.62; r += (96 - r) * f; g += (34 - g) * f; bl += (36 - bl) * f; }
          }
        }
        const o4 = (j * R + i) * 4;
        px[o4] = r; px[o4 + 1] = g; px[o4 + 2] = bl; px[o4 + 3] = 255;
      }
    }
    return px;
  }

  return { W, H, B, NAMES, isWater, setSeed, noise2, hash, smooth, natural, biomeAt, strokeBiome, realmAt, pFor, octFor, renderTile, mulberry, REALM, EMPTY };
}
if (typeof module !== 'undefined') module.exports = terrainLib;
