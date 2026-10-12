// ================================================================ pixel battle map (Tilewright renderer)
// Runs in the tile workers as well as here. Everything is drawn from 16 × 16 pixel cells, one per
// 5-ft square, with Tilewright's tiling textures, soft blending between natural ground, wall faces,
// edge walls and doors, and little sprites for props. Needs only the terrain library T.
function pixelLib(T) {
  'use strict';
  const TS = 16, S = 64, EMPTY = 255, CELL = 1056;
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hash2(x, y, s) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
  const sm = (t) => t * t * (3 - 2 * t);
  function vn(x, y, s) {
    const ix = Math.floor(x), iy = Math.floor(y), tx = sm(x - ix), ty = sm(y - iy);
    const a = hash2(ix, iy, s), b = hash2(ix + 1, iy, s), c = hash2(ix, iy + 1, s), d = hash2(ix + 1, iy + 1, s);
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
  }
  function tvn(x, y, cell, s) {
    const L = S / cell, fx = x / cell, fy = y / cell, ix = Math.floor(fx), iy = Math.floor(fy), tx = sm(fx - ix), ty = sm(fy - iy), m = (v) => ((v % L) + L) % L;
    const a = hash2(m(ix), m(iy), s), b = hash2(m(ix + 1), m(iy), s), c = hash2(m(ix), m(iy + 1), s), d = hash2(m(ix + 1), m(iy + 1), s);
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
  }
  function hex(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  const sh = (c, f) => [c[0] * f, c[1] * f, c[2] * f];

  // ---------- 64 × 64 tiling pixel textures ----------
  const newTex = () => new Uint8ClampedArray(S * S * 3);
  function put(t, x, y, c) { x = ((x % S) + S) % S; y = ((y % S) + S) % S; const i = (y * S + x) * 3; t[i] = c[0]; t[i + 1] = c[1]; t[i + 2] = c[2]; }
  function quant(t, cols, cell, seed, jit) {
    const R = mulberry32(seed); cols = cols.map(hex);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      let n = tvn(x, y, cell, seed) * 0.65 + tvn(x, y, cell / 2, seed + 7) * 0.35;
      n = (n - 0.5) * 2.2 + 0.5 + (R() - 0.5) * jit;
      let k = Math.floor(n * cols.length); k = k < 0 ? 0 : k >= cols.length ? cols.length - 1 : k; put(t, x, y, cols[k]);
    }
  }
  function sprinkle(t, seed, p, col, fn) { const R = mulberry32(seed); const c = hex(col); for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (R() < p) { if (fn) fn(x, y, c); else put(t, x, y, c); } }
  function waves(t, seed, n, c1, c2) { const R = mulberry32(seed), a = hex(c1), b = hex(c2); for (let i = 0; i < n; i++) { const x = R() * S | 0, y = R() * S | 0; put(t, x, y + 1, a); put(t, x + 1, y, b); put(t, x + 2, y, a); put(t, x + 3, y + 1, a); } }
  const tuft = (t) => (x, y, c) => { put(t, x, y, c); put(t, x, y - 1, c); };
  function texDeep() { const t = newTex(); quant(t, ['#162d55', '#1a3663', '#1f3f70'], 16, 11, 0.25); waves(t, 12, 12, '#3b66a1', '#5a86bf'); return t; }
  function texShallow() { const t = newTex(); quant(t, ['#2b7893', '#3086a2', '#3994af'], 16, 21, 0.25); waves(t, 22, 11, '#7cc2d2', '#a9e0e8'); return t; }
  function texSand() { const t = newTex(); quant(t, ['#c4a466', '#d0b375', '#dbc085'], 8, 31, 0.35); sprinkle(t, 32, 0.06, '#ad8c52'); sprinkle(t, 33, 0.025, '#ead49c'); return t; }
  function texGrass() { const t = newTex(); quant(t, ['#447c33', '#4d8a3a', '#579742'], 8, 41, 0.4); sprinkle(t, 42, 0.07, '#3a6b2b', tuft(t)); sprinkle(t, 43, 0.03, '#70ad52'); return t; }
  function canopy(seed, base, cols) {
    const t = newTex(); quant(t, base, 8, seed, 0.3);
    const R = mulberry32(seed + 1), cs = [];
    for (let n = 0; n < 18; n++) cs.push({ x: R() * S | 0, y: R() * S | 0, r: 4.5 + R() * 3.5 });
    const [shd, rim, hi, mid, dk] = cols.map(hex);
    for (const c of cs) { const r = Math.ceil(c.r) + 2; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if ((dx - 1) * (dx - 1) + (dy - 2) * (dy - 2) <= c.r * c.r) put(t, c.x + dx, c.y + dy, shd); }
    for (const c of cs) {
      const r = Math.ceil(c.r);
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const d = Math.hypot(dx, dy); if (d > c.r) continue;
        const l = 1 - Math.hypot(dx + c.r * 0.35, dy + c.r * 0.35) / (c.r * 1.5) + (R() - 0.5) * 0.18;
        put(t, c.x + dx, c.y + dy, d > c.r - 1 ? rim : l > 0.6 ? hi : l > 0.38 ? mid : dk);
      }
    }
    return t;
  }
  const texForest = () => canopy(51, ['#1c3d1c', '#214621'], ['#142e15', '#1d3f1d', '#5c9a45', '#47823a', '#356a2f']);
  const texJungle = () => canopy(151, ['#123a1f', '#174426'], ['#0c2a15', '#15401f', '#63b350', '#3f9a3e', '#2a7a31']);
  function texDirt() { const t = newTex(); quant(t, ['#6c4c2f', '#785636', '#83613d'], 8, 61, 0.4); sprinkle(t, 62, 0.025, '#9a7a54', (x, y, c) => { put(t, x, y, c); put(t, x, y + 1, hex('#4c3520')); }); return t; }
  function texFlag() {
    const t = newTex(), R = mulberry32(65), tones = ['#7f7c76', '#8a8780', '#94918a'].map(hex), mortar = hex('#4d4a46');
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      let c;
      if ((x & 7) === 0 || (y & 7) === 0) c = mortar;
      else { c = tones[hash2(x >> 3, y >> 3, 3) * 3 | 0]; if ((y & 7) === 1) c = sh(c, 1.08); if ((x & 7) === 7 || (y & 7) === 7) c = sh(c, 0.9); if (R() < 0.04) c = sh(c, 0.88); }
      put(t, x, y, c);
    }
    const ck = hex('#5a5751'); for (let n = 0; n < 7; n++) { const x = (R() * 8 | 0) * 8 + 2 + (R() * 3 | 0), y = (R() * 8 | 0) * 8 + 2; put(t, x, y, ck); put(t, x + 1, y + 1, ck); put(t, x + 1, y + 2, ck); put(t, x + 2, y + 3, ck); }
    return t;
  }
  function texWall() {
    const t = newTex(), R = mulberry32(91), tones = ['#615b53', '#6b655c', '#757066'].map(hex), mortar = hex('#2e2b28');
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const r = y >> 2, off = (r & 1) * 4; let c;
      if ((y & 3) === 0 || ((x + off) & 7) === 0) c = mortar;
      else { c = tones[hash2(((x + off) >> 3) & 7, r, 5) * 3 | 0]; if ((y & 3) === 1) c = sh(c, 1.12); if ((y & 3) === 3) c = sh(c, 0.88); if (R() < 0.05) c = sh(c, 0.9); }
      put(t, x, y, c);
    }
    return t;
  }
  function texLava() {
    const t = newTex(), R = mulberry32(73); const c1 = hex('#ffd84a'), c2 = hex('#ff8a1f'), h1 = hex('#a42c0e'), h2 = hex('#b8340f'), l1 = hex('#4f150a'), l2 = hex('#5e1a0b');
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const n = tvn(x, y, 16, 71) * 0.6 + tvn(x, y, 8, 72) * 0.4, e = Math.abs(n - 0.5), j = R() < 0.5; put(t, x, y, e < 0.018 ? c1 : e < 0.04 ? c2 : n > 0.5 ? (j ? h1 : h2) : (j ? l1 : l2)); }
    return t;
  }
  function texSnow() { const t = newTex(); quant(t, ['#c9d6e4', '#d8e2ed', '#e6eef6'], 8, 81, 0.35); sprinkle(t, 82, 0.02, '#ffffff'); sprinkle(t, 83, 0.03, '#aebfd3'); return t; }
  function texPlanks() {
    const t = newTex(), tones = ['#8a6034', '#946838', '#7f5830'].map(hex), seam = hex('#3e2914'), nail = hex('#c9b28a');
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const r = y >> 2, off = (r * 5) & 15, bx = ((x + off) >> 4) & 3; let c;
      if ((y & 3) === 0 || ((x + off) & 15) === 0) c = seam;
      else { c = tones[hash2(bx, r, 9) * 3 | 0]; if ((y & 3) === 1) c = sh(c, 1.1); if ((y & 3) === 3) c = sh(c, 0.86); if (hash2(x, y, 4) < 0.04) c = sh(c, 0.9); if (((x + off) & 15) === 2 && (y & 3) === 2) c = nail; }
      put(t, x, y, c);
    }
    return t;
  }
  function texRock() { const t = newTex(); quant(t, ['#6e6a63', '#7b766e', '#88837a'], 8, 101, 0.45); sprinkle(t, 102, 0.04, '#55514b', (x, y, c) => { put(t, x, y, c); put(t, x + 1, y, c); put(t, x, y - 1, hex('#9d978c')); }); sprinkle(t, 103, 0.02, '#a6a095'); return t; }
  function texMarsh() {
    const t = newTex(); quant(t, ['#4a5a32', '#53643a', '#5d6d40'], 8, 111, 0.4);
    const w1 = hex('#3d5f5a'), w2 = hex('#4b7069');
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const n = tvn(x, y, 16, 113) * 0.7 + tvn(x, y, 8, 114) * 0.3; if (n > 0.6) put(t, x, y, n > 0.66 ? w1 : w2); }
    sprinkle(t, 115, 0.05, '#7a8a48', tuft(t)); return t;
  }
  function texIce() {
    const t = newTex(); quant(t, ['#b6d1e0', '#c8dfeb', '#d9eaf3'], 16, 121, 0.3);
    const R = mulberry32(122), k = hex('#8fb2c7'), hi = hex('#f2f8fb');
    for (let n = 0; n < 7; n++) { let x = R() * S | 0, y = R() * S | 0; for (let s = 0; s < 14; s++) { put(t, x, y, k); put(t, x + 1, y - 1, hi); x += R() < 0.6 ? 1 : 0; y += R() < 0.5 ? 1 : -1; } }
    return t;
  }
  function texScrub() { const t = newTex(); quant(t, ['#7c7a43', '#8a874b', '#979353'], 8, 131, 0.45); sprinkle(t, 132, 0.06, '#66652f', tuft(t)); sprinkle(t, 133, 0.03, '#b2a865'); sprinkle(t, 134, 0.015, '#8d6d43'); return t; }
  function texTundra() { const t = newTex(); quant(t, ['#79826b', '#858d75', '#91987f'], 8, 141, 0.4); sprinkle(t, 142, 0.04, '#5f6955', tuft(t)); sprinkle(t, 143, 0.03, '#aab09a'); sprinkle(t, 144, 0.01, '#9b5a4a'); return t; }
  function texFloor() { const t = newTex(); quant(t, ['#2c5223', '#335c28', '#3b672d'], 8, 161, 0.45); sprinkle(t, 162, 0.05, '#25461f', tuft(t)); sprinkle(t, 163, 0.025, '#5c4a2b'); sprinkle(t, 164, 0.02, '#4f8037'); return t; }
  function texNeedles() { const t = newTex(); quant(t, ['#3a3f27', '#43482c', '#4c5131'], 8, 171, 0.45); sprinkle(t, 172, 0.06, '#5f4a2c', (x, y, c) => { put(t, x, y, c); put(t, x + 1, y + 1, c); }); sprinkle(t, 173, 0.03, '#2c3a22'); return t; }

  // ---------- terrain table ----------
  // z = layer height (lower layers draw the edge where they meet higher ones); soft = blends with neighbours.
  const TER = [
    { name: 'Deep water', z: 0, soft: 1, tex: texDeep, edge: ['tint', '#4f7fbf', 0.55] },
    { name: 'Shallows', z: 1, soft: 1, tex: texShallow, edge: ['tint', '#d6f1f3', 0.75] },
    { name: 'Sand', z: 2, soft: 1, tex: texSand, edge: ['dark', 0.8] },
    { name: 'Grass', z: 4, soft: 1, tex: texGrass, edge: ['dark', 0.75] },
    { name: 'Forest', z: 6, soft: 1, tex: texForest, edge: ['dark', 0.7] },
    { name: 'Dirt road', z: 3, soft: 1, tex: texDirt, edge: ['dark', 0.75] },
    { name: 'Flagstone', z: 3, soft: 0, tex: texFlag, edge: ['dark', 0.7] },
    { name: 'Stone wall', z: 9, soft: 0, tex: texWall, edge: null },
    { name: 'Lava', z: 1, soft: 1, tex: texLava, edge: ['tint', '#ffcf4a', 0.8] },
    { name: 'Snow', z: 5, soft: 1, tex: texSnow, edge: ['dark', 0.85] },
    { name: 'Planks', z: 3, soft: 0, tex: texPlanks, edge: ['dark', 0.7] },
    { name: 'Rock', z: 7, soft: 1, tex: texRock, edge: ['dark', 0.78] },
    { name: 'Marsh', z: 2, soft: 1, tex: texMarsh, edge: ['dark', 0.8] },
    { name: 'Ice', z: 2, soft: 1, tex: texIce, edge: ['tint', '#f2f8fb', 0.6] },
    { name: 'Dry grass', z: 4, soft: 1, tex: texScrub, edge: ['dark', 0.78] },
    { name: 'Tundra', z: 4, soft: 1, tex: texTundra, edge: ['dark', 0.8] },
    { name: 'Forest floor', z: 5, soft: 1, tex: texFloor, edge: ['dark', 0.78] },
    { name: 'Pine needles', z: 5, soft: 1, tex: texNeedles, edge: ['dark', 0.8] },
    { name: 'Jungle', z: 6, soft: 1, tex: texJungle, edge: ['dark', 0.7] },
  ];
  const NT = TER.length;
  const DEEP = 0, SHAL = 1, SAND = 2, GRASS = 3, FOREST = 4, ROAD = 5, FLAG = 6, WALL = 7, LAVA = 8, SNOW = 9, PLANKS = 10, ROCK = 11, MARSH = 12, ICE = 13, SCRUB = 14, TUNDRA = 15, FLOOR = 16, NEEDLES = 17, JUNGLE = 18;
  const TEX = TER.map((t) => t.tex());
  TER.forEach((t) => { if (t.edge && t.edge[0] === 'tint') t.edge[1] = hex(t.edge[1]); });
  const ORDER = [...TER.keys()].sort((a, b) => TER[a].z - TER[b].z);
  const SOFT = new Uint8Array(256), ZOF = new Int16Array(256).fill(-1);
  TER.forEach((t, i) => { SOFT[i] = t.soft; ZOF[i] = t.z; });
  const isWet = (t) => t === DEEP || t === SHAL || t === LAVA;

  // ---------- props: 16 × 16 sprites ('s' = cast shadow) ----------
  function sprite(rows, pal) {
    const pix = new Array(256).fill(null);
    for (let y = 0; y < 16; y++) { const row = (rows[y] || '').padEnd(16, '.').slice(0, 16); for (let x = 0; x < 16; x++) { const ch = row[x]; if (ch === '.') continue; if (ch === 's') { pix[y * 16 + x] = 's'; continue; } if (pal[ch]) pix[y * 16 + x] = hex(pal[ch]); } }
    return pix;
  }
  function stairs() {
    const pix = new Array(256).fill(null), stone = hex('#9a958b'), k = hex('#2b2824'), side = hex('#4a4640');
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { let c; if (x === 0 || x === 15 || y === 0 || y === 15) c = k; else if (x === 1 || x === 14) c = side; else { const st = Math.floor((y - 1) / 3), r = (y - 1) % 3; c = sh(stone, (r === 0 ? 1.15 : r === 1 ? 1 : 0.72) * (1 - st * 0.15)); } pix[y * 16 + x] = c; }
    return pix;
  }
  const PROPS = [
    { name: 'Tree', pix: sprite(['................', '......kkkk......', '....kkGGGhkk....', '...kgGGhhGGgk...', '..kggGGGGGGggk..', '..kdgggGGGgggk..', '.kddgggggggggdk.', '.kdddgggggggddk.', '.kdddddggggdddk.', '..kdddddddddkk..', '...kkdddddkk....', '.....kkbBkk.....', '......kbBk......', '....sskbBkss....', '...ssssssssss...', '................'], { k: '#16240f', d: '#2d5a26', g: '#3f7a32', G: '#5c9e44', h: '#7cc05a', b: '#6a4527', B: '#3d2716' }) },
    { name: 'Boulder', pix: sprite(['................', '................', '................', '................', '.....kkkkk......', '...kkLLLLlkk....', '..kLLLlllllldk..', '..kLlllllllddk..', '.kllllllllldddk.', '.klllllllldddk..', '.kdlllllddddddk.', '..kddddddddddk..', '...kkkkkkkkkk...', '..ssssssssssss..', '................', '................'], { L: '#a9a498', l: '#8a857b', d: '#66625a', k: '#2d2a26' }) },
    { name: 'Chest', pix: sprite(['................', '................', '................', '...kkkkkkkkkk...', '..kWWWWWWWWWWk..', '..kwwwwwwwwwwk..', '..kGwwwwwwwwGk..', '..kGGGGyyGGGGk..', '..kGwwwyywwwGk..', '..kxxxxxxxxxxk..', '..kGxxxxxxxxGk..', '..kxxxxxxxxxxk..', '..kkkkkkkkkkkk..', '..ssssssssssss..', '................', '................'], { k: '#2a1a0c', W: '#b7834a', w: '#8e5f30', x: '#6a4321', G: '#8d8f94', y: '#f0c64a' }) },
    { name: 'Barrel', pix: sprite(['................', '................', '.....kkkkkk.....', '....kttttttk....', '...ktWttttWtk...', '...kkttttttkk...', '...kGGGGGGGGk...', '...kwWwwwwxwk...', '...kwWwwwwxwk...', '...kGGGGGGGGk...', '...kwWwwwwxwk...', '...kwWwwwwxwk...', '....kkkkkkkk....', '...ssssssssss...', '................', '................'], { k: '#241608', t: '#c79257', W: '#a8763f', w: '#87592c', x: '#66421f', G: '#6f7378' }) },
    { name: 'Campfire', pix: sprite(['................', '......y.........', '.......y........', '......yoy.......', '.....yooy.y.....', '.....orooy......', '....yorrroy.....', '....orrRrro.....', '...gorRRRrog....', '..gbbBRRRBbbg...', '..gkbbBBBbbkg...', '...gggkkkggg....', '..ssssssssss....', '................', '................', '................'], { y: '#ffe066', o: '#ff9a1f', r: '#e2481a', R: '#b02a10', b: '#6b4423', B: '#4a2d16', g: '#8a8a85', k: '#241608' }) },
    { name: 'Stairs down', pix: stairs() },
    { name: 'Tent', pix: sprite(['................', '................', '................', '.......k........', '......kWk.......', '.....kWWwk......', '....kWWWwwk.....', '...kWWWkwwwk....', '..kWWWkdkwwwk...', '.kWWWWkddkwwwk..', 'kWWWWWkddkwwwwk.', 'kkkkkkkddkkkkkk.', '.ssssssssssssss.', '................', '................', '................'], { k: '#3b2f20', W: '#d8c9a3', w: '#b3a27a', d: '#3a2e1f' }) },
    { name: 'Pine', pix: sprite(['................', '.......kk.......', '......kGgk......', '.....kGggdk.....', '......kgdk......', '.....kGggdk.....', '....kGgggddk....', '.....kggddk.....', '....kGgggddk....', '...kGgggggddk...', '..kGggggggdddk..', '...kkkkbBkkkk...', '......kbBk......', '....sskbBkss....', '...ssssssssss...', '................'], { k: '#0f2016', G: '#4f8a52', g: '#2f6338', d: '#1f4a2a', b: '#6a4527', B: '#3d2716' }) },
    { name: 'Bush', pix: sprite(['................', '................', '................', '................', '................', '......kkkk......', '....kkGGgdkk....', '...kGGgrgggdk...', '...kGgggggrdk...', '..kgggrgggdddk..', '..kgggggdddddk..', '...kdddddddkk...', '....kkkkkkk.....', '...sssssssss....', '................', '................'], { k: '#16240f', G: '#6fae4f', g: '#4a8a38', d: '#2f6328', r: '#c0392b' }) },
    { name: 'Well', pix: sprite(['................', '................', '.....kkkkkk.....', '...kkSSSSSSkk...', '..kSSskkkksSSk..', '..kSskwwWWksSk..', '.kSskwwwwWWksSk.', '.kbbbbbbbbbbbbk.', '.kBBBBBBBBBBBBk.', '.kSskwwwwwwksdk.', '..kSskwwwwksdk..', '..kSssskkkssdk..', '...kkdddddddk...', '.....kkkkkk.....', '....ssssssss....', '................'], { k: '#2b2824', S: '#a8a296', s: '#8a857b', d: '#66625a', w: '#2b6f8a', W: '#4f97b0', b: '#a87842', B: '#6a4321' }) },
    { name: 'Market stall', pix: sprite(['................', '................', '................', '.kkkkkkkkkkkkkk.', '.kRRWWRRWWRRWWk.', '.kRRWWRRWWRRWWk.', '.krrwwrrwwrrwwk.', '.kkkkkkkkkkkkkk.', '.kbyyGbbaaGbbbk.', '.kbbbbbbbbbbbbk.', '.kkkkkkkkkkkkkk.', '.ssssssssssssss.', '................', '................', '................', '................'], { R: '#c0392b', r: '#8e2a20', W: '#efe3c8', w: '#c8bca0', k: '#2a1a0c', b: '#8e5f30', y: '#f0c64a', G: '#6faa45', a: '#d0482f' }) },
    { name: 'Table', pix: sprite(['................', '................', '................', '..kkkkkkkkkkkk..', '..kTTTTTTTTTTk..', '..kTtttttttttk..', '..kTttWWtttttk..', '..kTttWWttyttk..', '..kTttttttttTk..', '..kttttttttttk..', '..kkkkkkkkkkkk..', '..kk........kk..', '..ssssssssssss..', '................', '................', '................'], { T: '#b7834a', t: '#94673a', W: '#e8e3d4', y: '#f0c64a', k: '#2a1a0c' }) },
    { name: 'Bed', pix: sprite(['................', '...kkkkkkkkkk...', '...kWWWWWWWWk...', '...kWwwwwwwWk...', '...kkkkkkkkkk...', '...kBBBBBBBBk...', '...kBbbbbbbBk...', '...kBbbbbbbBk...', '...kBbbbbbbBk...', '...kBbbbbbbBk...', '...kBBBBBBBBk...', '...kffffffffk...', '...kkkkkkkkkk...', '...ssssssssss...', '................', '................'], { W: '#efe8d8', w: '#cfc6b0', B: '#9a3b32', b: '#7d2f28', f: '#8e5f30', k: '#2a1a0c' }) },
    { name: 'Crate', pix: sprite(['................', '................', '................', '...kkkkkkkkkk...', '...kLLLLLLLLk...', '...kLxllllxlk...', '...kLlxllxllk...', '...kLllxxlllk...', '...kLllxxlllk...', '...kLlxllxllk...', '...kLxllllxlk...', '...kddddddddk...', '...kkkkkkkkkk...', '...ssssssssss...', '................', '................'], { L: '#c99a5a', l: '#a87842', x: '#6a4321', d: '#7f5830', k: '#2a1a0c' }) },
    { name: 'Altar', pix: sprite(['................', '................', '....y......y....', '....o......o....', '...kWk....kWk...', '.kkkkkkkkkkkkkk.', '.kSSSSSSSSSSSSk.', '.kSsssssssssssk.', '.kSsssRRRRsssdk.', '.kSsssRRRRsssdk.', '.kddddddddddddk.', '.kkkkkkkkkkkkkk.', '.ssssssssssssss.', '................', '................', '................'], { S: '#c9c3b6', s: '#a8a296', d: '#7d786e', R: '#9a2b2b', W: '#efe3c8', y: '#ffe066', o: '#ff9a1f', k: '#2b2824' }) },
  ];
  const P_TREE = 0, P_BOULDER = 1, P_PINE = 7, P_BUSH = 8;

  // ---------- natural ground from the world's biomes ----------
  // biome ids from the terrain library: 0 deep, 1 sea, 2 shallows, 3 ice, 4 beach, 5 grass, 6 forest, 7 taiga,
  // 8 jungle, 9 swamp, 10 desert, 11 scrub, 12 tundra, 13 snow, 14 mountains, 15 peaks, 16 river
  const BIO = [DEEP, DEEP, SHAL, ICE, SAND, GRASS, FOREST, NEEDLES, JUNGLE, MARSH, SAND, SCRUB, TUNDRA, SNOW, ROCK, SNOW, SHAL];
  function naturalT(cx, cy, circ) {
    const x = (cx + 0.5) / CELL, y = (cy + 0.5) / CELL;
    if (x < 0 || y < 0 || x > T.W || y > T.H) return DEEP;
    const b = T.biomeAt(x, y, 15, circ);
    const t = BIO[b];
    if (b === 6 || b === 8) { // groves of closed canopy with clearings of forest floor between
      const n = T.noise2(cx * 0.045 + 11.3, cy * 0.045 - 7.1) + 0.45 * T.noise2(cx * 0.12 - 3.7, cy * 0.12 + 5.2);
      return n > (b === 8 ? -0.05 : 0.3) ? t : FLOOR;
    }
    return t;
  }
  function autoProp(t, cx, cy, nearCanopy) {
    const h = T.hash(cx, cy, 901);
    switch (t) {
      case GRASS: return h < (nearCanopy ? 0.13 : 0.012) ? P_TREE : h > 0.982 ? P_BUSH : h > 0.979 ? P_BOULDER : -1;
      case FLOOR: return h < 0.24 ? P_TREE : h < 0.31 ? P_BUSH : -1;
      case NEEDLES: return h < 0.3 ? P_PINE : h < 0.33 ? P_BOULDER : -1;
      case SCRUB: return h < 0.05 ? P_BUSH : h < 0.066 ? P_BOULDER : -1;
      case ROCK: return h < 0.06 ? P_BOULDER : -1;
      case TUNDRA: return h < 0.02 ? P_BOULDER : h < 0.032 ? P_BUSH : -1;
      case SNOW: return h < 0.008 ? P_BOULDER : h > 0.995 ? P_PINE : -1;
      case SAND: return h < 0.005 ? P_BOULDER : -1;
      case MARSH: return h < 0.05 ? P_BUSH : -1;
      default: return -1;
    }
  }

  // ---------- the renderer ----------
  // job: N squares a side from (X0, Y0). ov: terrain for the (N+4)² ring (255 natural, 254 road or bridge,
  // 253 paved street or bridge, otherwise a terrain id). pr: props for the N² squares (-2 automatic, -1 none).
  // eh / ev: edges for the (N+2)² ring, along the top and the left of each square (1 wall, 2 door, 3 fence, 4 window).
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const sc = new Float32Array(NT);
  const REACH = 0.5, ROUGH = 0.25;
  function pick(nb, px, py, wx, wy) {
    const u = (px + 0.5) / TS, v = (py + 0.5) / TS; sc.fill(0); let present = 0;
    for (let k = 0; k < 9; k++) {
      const t = nb[k]; if (!SOFT[t]) continue;
      const dx = k % 3 - 1, dy = (k / 3 | 0) - 1;
      const ex = u < dx ? dx - u : (u > dx + 1 ? u - dx - 1 : 0), ey = v < dy ? dy - v : (v > dy + 1 ? v - dy - 1 : 0);
      const d = Math.sqrt(ex * ex + ey * ey); if (d >= REACH) continue;
      let w = 1 - d / REACH; w = w * w * (3 - 2 * w); sc[t] += w; present |= 1 << t;
    }
    let best = nb[4], bs = -1e9;
    for (let t = 0; t < NT; t++) if (present >> t & 1) {
      const n = (vn(wx * 0.2, wy * 0.2, t * 101 + 7) * 0.65 + vn(wx * 0.5, wy * 0.5, t * 101 + 9) * 0.35) * 2 - 1;
      const s = sc[t] + ROUGH * n + ZOF[t] * 0.002; if (s > bs) { bs = s; best = t; }
    }
    return best;
  }
  const WOOD = hex('#8e5f30'), WOOD_D = hex('#6a4321'), WOOD_L = hex('#a87842'), GLASS = hex('#9ccbe0'), GLASS_D = hex('#5f8fa6');
  function drawSprite(d, OW, ox, oy, pix) {
    for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
      const p = pix[y * TS + x]; if (!p) continue; const o = ((oy + y) * OW + ox + x) * 4;
      if (p === 's') { d[o] *= 0.55; d[o + 1] *= 0.55; d[o + 2] *= 0.55; } else { d[o] = p[0]; d[o + 1] = p[1]; d[o + 2] = p[2]; d[o + 3] = 255; }
    }
  }
  function render(job) {
    const N = job.N, X0 = job.X0, Y0 = job.Y0, CW = N + 4, RW = N + 2, ov = job.ov, circ = job.circ;
    const tc = new Uint8Array(CW * CW), natural = new Uint8Array(CW * CW);
    for (let j = 0; j < CW; j++) for (let i = 0; i < CW; i++) {
      const k = j * CW + i; let v = ov[k];
      if (v >= 253) {
        const n = naturalT(X0 - 2 + i, Y0 - 2 + j, circ); natural[k] = 1;
        v = v === 255 ? n : (n === DEEP || n === SHAL || n === MARSH || n === ICE) ? PLANKS : v === 254 ? ROAD : FLAG;
        if (ov[k] !== 255) natural[k] = 0;
      }
      tc[k] = v;
    }
    // props
    const props = new Int8Array(N * N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const k = j * N + i, p = job.pr[k];
      if (p !== -2) { props[k] = p; continue; }
      const ck = (j + 2) * CW + i + 2;
      if (!natural[ck]) { props[k] = -1; continue; }
      let near = false;
      if (tc[ck] === GRASS) for (let q = 0; q < 9 && !near; q++) { const t = tc[ck + ((q / 3 | 0) - 1) * CW + (q % 3 - 1)]; if (t === FOREST || t === FLOOR) near = true; }
      props[k] = autoProp(tc[ck], X0 + i, Y0 + j, near);
    }
    // ground: a one-square ring around the chunk so blending matches across seams
    const SW = (N + 2) * TS, sBase = new Uint8ClampedArray(SW * SW * 3), sIds = new Uint8Array(SW * SW);
    const nb = new Array(9);
    for (let j = 1; j < CW - 1; j++) for (let i = 1; i < CW - 1; i++) {
      const own = tc[j * CW + i], cx = X0 - 2 + i, cy = Y0 - 2 + j, sx0 = (i - 1) * TS, sy0 = (j - 1) * TS;
      let mixed = false;
      for (let k = 0; k < 9; k++) { const t = tc[(j + (k / 3 | 0) - 1) * CW + i + k % 3 - 1]; nb[k] = t; if (t !== own && SOFT[t]) mixed = true; }
      const plain = !SOFT[own] || !mixed;
      for (let py = 0; py < TS; py++) {
        const wy = cy * TS + py;
        for (let px = 0; px < TS; px++) {
          const wx = cx * TS + px;
          const t = plain ? own : pick(nb, px, py, wx, wy), tx = TEX[t], ti = ((wy & 63) * S + (wx & 63)) * 3, si = (sy0 + py) * SW + sx0 + px;
          sBase[si * 3] = tx[ti]; sBase[si * 3 + 1] = tx[ti + 1]; sBase[si * 3 + 2] = tx[ti + 2]; sIds[si] = t;
        }
      }
    }
    const OW = N * TS, d = new Uint8ClampedArray(OW * OW * 4);
    for (let y = 0; y < OW; y++) for (let x = 0; x < OW; x++) {
      const si = (y + TS) * SW + x + TS, t = sIds[si], o = (y * OW + x) * 4;
      let r = sBase[si * 3], g = sBase[si * 3 + 1], b = sBase[si * 3 + 2], f = 1;
      if (t === WALL) { let k = 1; while (k <= 6 && sIds[si + k * SW] === WALL) k++; if (k <= 6) f = k === 1 ? 0.4 : 0.62; else if (sIds[si - SW] !== WALL) f = 1.2; }
      else for (let k = 1; k <= 5; k++) { if (sIds[si - k * SW] === WALL) { f = 0.5 + 0.09 * (k - 1); break; } }
      if (t !== WALL) {
        const z = ZOF[t], e = TER[t].edge;
        if (e && (ZOF[sIds[si - 1]] > z || ZOF[sIds[si + 1]] > z || ZOF[sIds[si - SW]] > z || ZOF[sIds[si + SW]] > z)) {
          if (e[0] === 'tint') { const c = e[1], a = e[2]; r += (c[0] - r) * a; g += (c[1] - g) * a; b += (c[2] - b) * a; } else f *= e[1];
        }
      }
      d[o] = r * f; d[o + 1] = g * f; d[o + 2] = b * f; d[o + 3] = 255;
    }
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const p = props[j * N + i]; if (p >= 0 && PROPS[p]) drawSprite(d, OW, i * TS, j * TS, PROPS[p].pix); }
    edgePass(job, d, OW);
    if (!job.half) return d;
    const HW = OW >> 1, h = new Uint8ClampedArray(HW * HW * 4);
    for (let y = 0; y < HW; y++) for (let x = 0; x < HW; x++) { const o = ((y * 2) * OW + x * 2) * 4, q = (y * HW + x) * 4; h[q] = d[o]; h[q + 1] = d[o + 1]; h[q + 2] = d[o + 2]; h[q + 3] = 255; }
    return h;
  }
  // walls, doors, fences and windows that sit on the grid lines
  function edgePass(job, d, OW) {
    const N = job.N, X0 = job.X0, Y0 = job.Y0, RW = N + 2, X1 = X0 + N, Y1 = Y0 + N;
    const getH = (x, y) => (x < X0 - 1 || y < Y0 - 1 || x > X1 || y > Y1) ? 0 : job.eh[(y - Y0 + 1) * RW + x - X0 + 1];
    const getV = (x, y) => (x < X0 - 1 || y < Y0 - 1 || x > X1 || y > Y1) ? 0 : job.ev[(y - Y0 + 1) * RW + x - X0 + 1];
    const bx = X0 * TS, by = Y0 * TS, OH = OW;
    const at = (X, Y) => (X >= 0 && X < OW && Y >= 0 && Y < OH) ? (Y * OW + X) * 4 : -1;
    const set = (X, Y, c, f) => { const o = at(X, Y); if (o >= 0) { d[o] = c[0] * f; d[o + 1] = c[1] * f; d[o + 2] = c[2] * f; d[o + 3] = 255; } };
    const dim = (X, Y, f) => { const o = at(X, Y); if (o >= 0) { d[o] *= f; d[o + 1] *= f; d[o + 2] *= f; } };
    const tw = TEX[WALL], brick = (X, Y) => { const i = (((Y + by) & 63) * S + ((X + bx) & 63)) * 3; return [tw[i], tw[i + 1], tw[i + 2]]; };
    const H = [], V = [];
    for (let y = Y0 - 1; y <= Y1; y++) for (let x = X0 - 1; x <= X1; x++) { const h = getH(x, y), v = getV(x, y); if (h) H.push([x, y, h]); if (v) V.push([x, y, v]); }
    for (const [x, y, v] of H) { const PX = (x - X0) * TS, PY = (y - Y0) * TS; for (let X = PX; X < PX + TS; X++) { if (v === 3) dim(X, PY + 2, 0.75); else { dim(X, PY + 6, 0.6); dim(X, PY + 7, 0.72); dim(X, PY + 8, 0.85); } } }
    for (const [x, y, v] of V) { const PX = (x - X0) * TS, PY = (y - Y0) * TS; for (let Y = PY; Y < PY + TS; Y++) { if (v === 3) dim(PX + 1, Y, 0.8); else { dim(PX + 2, Y, 0.7); dim(PX + 3, Y, 0.85); } } }
    const post = (X, Y) => { for (let j = -2; j <= 1; j++) for (let i = -1; i <= 1; i++) set(X + i, Y + j, j === -2 ? WOOD_L : WOOD_D, i === 1 ? 0.8 : 1); };
    const pane = (along, a, rim) => (along & 3) === 0 ? WOOD_D : a ? GLASS : GLASS_D;
    for (const [x, y, v] of V) {
      const X0p = (x - X0) * TS, Y0p = (y - Y0) * TS;
      if (v === 3) { for (let Y = Y0p - 1; Y < Y0p + TS + 1; Y++) { set(X0p - 1, Y, WOOD_L, 1); set(X0p, Y, WOOD, 1); } post(X0p, Y0p); post(X0p, Y0p + 8); if (getV(x, y + 1) !== 3) post(X0p, Y0p + TS); continue; }
      for (let Y = Y0p - 2; Y < Y0p + TS + 2; Y++) for (let X = X0p - 2; X < X0p + 2; X++) {
        const rim = (X === X0p - 2 || X === X0p + 1) ? 0.8 : 1, mid = Y >= Y0p + 3 && Y < Y0p + TS - 3;
        if (v === 2 && Y >= Y0p + 2 && Y < Y0p + TS - 2) set(X, Y, ((Y - Y0p) & 3) === 0 ? WOOD_D : WOOD, rim);
        else if (v === 4 && mid) set(X, Y, pane(Y - Y0p, X < X0p, rim), 1);
        else set(X, Y, brick(X, Y), 1.15 * rim);
      }
      if (!getV(x, y + 1)) for (let Y = Y0p + TS + 2; Y < Y0p + TS + 6; Y++) for (let X = X0p - 2; X < X0p + 2; X++) set(X, Y, brick(X, Y), Y === Y0p + TS + 5 ? 0.45 : 0.62);
    }
    for (const [x, y, v] of H) {
      const X0p = (x - X0) * TS, Y0p = (y - Y0) * TS;
      if (v === 3) { for (let X = X0p - 1; X < X0p + TS + 1; X++) { set(X, Y0p - 1, WOOD_L, 1); set(X, Y0p, WOOD, 1); } post(X0p, Y0p); post(X0p + 8, Y0p); if (getH(x + 1, y) !== 3) post(X0p + TS, Y0p); continue; }
      for (let X = X0p - 2; X < X0p + TS + 2; X++) {
        const door = v === 2 && X >= X0p + 2 && X < X0p + TS - 2, win = v === 4 && X >= X0p + 3 && X < X0p + TS - 3;
        for (let Y = Y0p - 2; Y < Y0p + 2; Y++) { const rim = Y === Y0p - 2 ? 0.85 : 1; if (door) set(X, Y, ((X - X0p) & 3) === 0 ? WOOD_D : WOOD, rim); else if (win) set(X, Y, pane(X - X0p, Y < Y0p, rim), 1); else set(X, Y, brick(X, Y), 1.15 * rim); }
        for (let Y = Y0p + 2; Y < Y0p + 6; Y++) { const f = Y === Y0p + 5 ? 0.45 : 0.62; if (door) set(X, Y, ((X - X0p) & 3) === 0 ? WOOD_D : WOOD, f * 1.1); else set(X, Y, brick(X, Y), f); }
      }
    }
  }
  // a 16 × 16 RGBA picture of one terrain or prop, for the editing palette
  function swatch(kind, i) {
    const d = new Uint8ClampedArray(TS * TS * 4);
    if (kind === 't') { const tx = TEX[i]; for (let k = 0; k < TS * TS; k++) { const y = k >> 4, x = k & 15, ti = ((y + 8) * S + x + 8) * 3; d[k * 4] = tx[ti]; d[k * 4 + 1] = tx[ti + 1]; d[k * 4 + 2] = tx[ti + 2]; d[k * 4 + 3] = 255; } }
    else { const tx = TEX[GRASS]; for (let k = 0; k < TS * TS; k++) { const y = k >> 4, x = k & 15, ti = ((y + 8) * S + x + 8) * 3; d[k * 4] = tx[ti] * 0.7 + 30; d[k * 4 + 1] = tx[ti + 1] * 0.7 + 30; d[k * 4 + 2] = tx[ti + 2] * 0.7 + 30; d[k * 4 + 3] = 255; } drawSprite(d, TS, 0, 0, PROPS[i].pix); }
    return d;
  }
  return { TS, NT, TER: TER.map((t) => ({ name: t.name, soft: t.soft })), PROPS: PROPS.map((p) => ({ name: p.name })), ID: { DEEP, SHAL, SAND, GRASS, FOREST, ROAD, FLAG, WALL, LAVA, SNOW, PLANKS, ROCK, MARSH, ICE, SCRUB, TUNDRA, FLOOR, NEEDLES, JUNGLE }, P: { TREE: 0, BOULDER: 1, CHEST: 2, BARREL: 3, CAMPFIRE: 4, STAIRS: 5, TENT: 6, PINE: 7, BUSH: 8, WELL: 9, STALL: 10, TABLE: 11, BED: 12, CRATE: 13, ALTAR: 14 }, naturalT, render, swatch };
}
