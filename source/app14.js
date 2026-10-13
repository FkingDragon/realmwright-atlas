
// ================================================================ town layouts (v13)
// Each settlement is laid out in local feet around its market: x runs east, y south.
// Its shape comes from three things: the land (slope, sea, marsh, desert, forest), the folk
// who built it (a founding culture, plus quarters for other peoples), and how it grew
// (along a road, round a green, out from a market, or to a plan).

// shapes: [rectangle, long hall, round, courtyard]
const CULTURES = {
  Human: { adj: 'Human', shapes: [0.84, 0.16, 0, 0], size: 1, pal: null, trees: 0.05, wig: 0.5, wall: 'stone', plaza: 'round', gap: 1, gardens: 0.04, road: null },
  'Half-elf': { adj: 'Half-elven', shapes: [0.62, 0.12, 0.26, 0], size: 1, pal: null, trees: 0.35, wig: 0.65, wall: 'stone', plaza: 'green', gap: 1.15, gardens: 0.15, road: null },
  Dwarf: { adj: 'Dwarven', shapes: [0.5, 0.45, 0, 0.05], size: 1.05, pal: [['#868a92', '#5e626a'], ['#958b7c', '#6e665b'], ['#727780', '#50545b']], trees: 0, wig: 0.06, wall: 'heavy', plaza: 'square', gap: 0.85, gardens: 0, road: ['#9d988e', 'rgba(60,58,54,0.45)'] },
  Elf: { adj: 'Elven', shapes: [0.28, 0.1, 0.62, 0], size: 1, pal: [['#8aa474', '#637d54'], ['#a9b98f', '#81926a'], ['#93a7a6', '#6c8081']], trees: 1.7, wig: 0.95, wall: 'none', plaza: 'green', gap: 1.7, gardens: 0.08, road: ['#bcae86', 'rgba(64,88,46,0.4)'] },
  Halfling: { adj: 'Halfling', shapes: [0.26, 0, 0.74, 0], size: 0.8, pal: [['#97ae68', '#708a4b'], ['#aeb66f', '#888e50'], ['#c7a763', '#9e8146']], trees: 0.6, wig: 0.85, wall: 'hedge', plaza: 'green', gap: 1.3, gardens: 0.85, road: ['#c0a77c', 'rgba(60,96,44,0.65)'] },
  Gnome: { adj: 'Gnomish', shapes: [0.55, 0.05, 0.35, 0.05], size: 0.72, pal: [['#c75f4e', '#9a4633'], ['#648cb9', '#4a6c94'], ['#d6ad49', '#ac8830']], trees: 0.25, wig: 1, wall: 'none', plaza: 'round', gap: 0.8, gardens: 0.35, road: null },
  'Half-orc': { adj: 'Orcish', shapes: [0.28, 0.57, 0.15, 0], size: 1.05, pal: [['#8f6e4d', '#694f35'], ['#7f6954', '#5e4d3c'], ['#a08056', '#795b3c']], trees: 0, wig: 0.3, wall: 'palisade', plaza: 'arena', gap: 1.1, gardens: 0, road: ['#ab9270', 'rgba(70,50,30,0.5)'] },
  Dragonborn: { adj: 'Dragonborn', shapes: [0.4, 0.15, 0, 0.45], size: 1.15, pal: [['#b65942', '#8a3d2d'], ['#c48e4a', '#9a6e33'], ['#924e3d', '#6c382a']], trees: 0.04, wig: 0.1, wall: 'heavy', plaza: 'square', gap: 1, gardens: 0, road: ['#b39e84', 'rgba(80,56,40,0.45)'] },
  Tiefling: { adj: 'Tiefling', shapes: [0.5, 0.15, 0, 0.35], size: 1, pal: [['#714e74', '#513654'], ['#83434a', '#5f2e34'], ['#555162', '#3c3947']], trees: 0.08, wig: 0.25, wall: 'stone', plaza: 'square', gap: 1, gardens: 0.05, road: null }
};
// how strongly each people stamps its own style on the places it builds
const BUILDER = { Dwarf: 1.3, Elf: 1.2, Halfling: 1, Gnome: 1.2, 'Half-orc': 0.95, Dragonborn: 1.2, Tiefling: 1, 'Half-elf': 0.55 };
const ARCH = {
  organic: { name: 'Grown town', d: 'grew outward from its market over the centuries. Streets follow old cart tracks, lanes branch off at odd angles, and a few curving streets half-ring the older core.' },
  ribbon: { name: 'Street settlement', d: 'is strung out along its main road. Houses face the street, with long back gardens and fields behind them.' },
  crossroads: { name: 'Crossroads town', d: 'grew where roads meet. The market sits at the crossing and houses run out along each road.' },
  grid: { name: 'Planned town', d: 'was laid out to a plan: straight streets in a grid around a square market.' },
  hill: { name: 'Hill town', d: 'is built on rising ground. Streets run along the slope in terraces joined by steep stair-lanes, with the strongest building at the top.' },
  green: { name: 'Green village', d: 'is gathered round a village green with a pond: common grazing shared by everyone.' },
  hamlet: { name: 'Scattered hamlet', d: 'is a loose scatter of farmsteads, each with its barn and yard, joined by winding lanes through the fields.' },
  seaward: { name: 'Sea-road town', d: 'turns to face the sea. Its high street runs down toward the harbour road and the town fans out from it.' },
  canal: { name: 'Canal town', d: 'stands on piles above wet ground. Canals do the work of back lanes, and boats are as common as carts.' },
  oasis: { name: 'Courtyard town', d: 'is packed tight against the heat: flat-roofed courtyard houses, narrow shaded alleys and a great well at its heart.' },
  hold: { name: 'Dwarven hold', d: 'was cut by dwarves: square stone halls stepped in terraces, ruler-straight streets and a hold-gate at the top.' },
  grove: { name: 'Elven grove', d: 'was raised by elves among living trees: round homes in clearings, paths that loop between them, and no walls at all.' },
  smial: { name: 'Halfling smials', d: 'is a halfling place: round turf-roofed homes, each with its vegetable garden, along lanes that wander between hedges.' },
  warren: { name: 'Gnomish warren', d: 'is gnome-built: crowded, colourful and winding, with workshops, dead-end lanes and little gardens wherever there is room.' },
  warcamp: { name: 'Orcish war-camp', d: 'is laid out like a war camp: longhouses in rings round a fighting arena.' },
  clanhold: { name: 'Dragonborn clanhold', d: 'is dragonborn work: each clan has its own courtyard compound, set on a broad grid around a great hall.' }
};
function isWalled(s, M) {
  const C0 = CULTURES[M.founder], tier = s.tier;
  return C0.wall !== 'none' && (tier >= 3 || (tier === 2 && (s.pop >= 4000 || C0.wall === 'heavy' || C0.wall === 'palisade' || C0.wall === 'hedge')) || (tier === 1 && s.pop >= 200 && (C0.wall === 'palisade' || C0.wall === 'hedge')));
}
const compass8 = (a) => ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'][((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8];

const metaCache = new Map();
function planKey(s) { return s.x + '|' + s.y + '|' + s.pop + '|' + s.tier + '|' + roadsVer + '|' + strokesVer; }
function planMeta(s) {
  const key = planKey(s), c = metaCache.get(s.id);
  if (c && c.key === key) return c.m;
  const m = computeMeta(s);
  metaCache.set(s.id, { key, m });
  if (metaCache.size > 400) metaCache.delete(metaCache.keys().next().value);
  return m;
}
function computeMeta(s) {
  const h = hashStr(s.id) & 0x7fffffff, tier = s.tier, Rm = settleR(s), R = Rm / FT;
  const P = profile(s), b = P.b;
  // ---- the land around it: regional slope, sea, rivers, mountains, woods
  const e0 = T.natural(s.x, s.y, EVAL_OCT, 1).e;
  let gx = 0, gy = 0, ng = 0;
  for (const d of [1, 2.2]) for (let k = 0; k < 12; k++) {
    const a = k * Math.PI / 6, o = T.natural(s.x + Math.cos(a) * d, s.y + Math.sin(a) * d, EVAL_OCT, 1);
    if (o.b <= 3) continue;
    gx += Math.cos(a) * (o.e - e0) / d; gy += Math.sin(a) * (o.e - e0) / d; ng++;
  }
  if (ng) { gx *= 2 / ng; gy *= 2 / ng; }
  const pz = T.pFor(13), oz = T.octFor(pz);
  const circ5 = circlesIn(s.x - 5.2, s.y - 5.2, s.x + 5.2, s.y + 5.2);
  let seaD = 99, seaA = 0, rivD = 99, rivA = 0, mtnD = 99, mtnA = 0, wood = 0, nw = 0;
  const DS = [0.12, 0.25, 0.4, 0.6, 0.9, 1.3, 1.9, 2.7, 3.8, 5];
  for (let k = 0; k < 16; k++) {
    const a = k * Math.PI / 8, ca = Math.cos(a), sa = Math.sin(a);
    for (const d of DS) {
      const x = s.x + ca * d, y = s.y + sa * d, o = T.natural(x, y, oz, pz);
      const bb = circ5.length ? T.strokeBiome(x, y, o.b, o.b, circ5) : o.b;
      if (d <= 0.6) { nw++; if (bb === 6 || bb === 7 || bb === 8) wood++; }
      if (bb <= 3) { if (d < seaD) { seaD = d; seaA = a; } break; }
      if (bb === 16 && d < rivD) { rivD = d; rivA = a; }
      if ((bb === 14 || bb === 15) && d < mtnD) { mtnD = d; mtnA = a; }
    }
  }
  const g = Math.hypot(gx, gy);
  let upA = Math.atan2(gy, gx);
  if (mtnD < 4 && g < 0.012) upA = mtnA;
  const hill = b === 14 || b === 15 || mtnD < 1.8 || g > 0.03 || e0 > 0.42;
  // ---- roads running into it
  const roads = [], exits = [];
  const stp = ++QSTAMP;
  RGRID.query(s.x - Rm, s.y - Rm, s.x + Rm, s.y + Rm, (r) => {
    if (r._q === stp) return;
    r._q = stp;
    const p = roadGeom(r), w = ROADTYPES[r.type].ft;
    let run = null;
    const flush = () => {
      if (run && run.length >= 4) {
        const ex = [];
        let prev = Math.hypot(run[0], run[1]) - R * 0.6;
        for (let i = 2; i < run.length; i += 2) {
          const cur = Math.hypot(run[i], run[i + 1]) - R * 0.6;
          if (prev * cur <= 0) ex.push(Math.atan2(run[i + 1], run[i]));
          prev = cur;
        }
        roads.push({ pts: run, w, type: r.type, ex });
        for (const a of ex) exits.push([a, r.type]);
      }
      run = null;
    };
    for (let i = 0; i < p.length; i += 2) {
      const lx = (p[i] - s.x) / FT, ly = (p[i + 1] - s.y) / FT;
      const inside = Math.hypot(lx, ly) < R * 1.12;
      if (inside) { if (!run) { run = []; if (i >= 2) run.push((p[i - 2] - s.x) / FT, (p[i - 1] - s.y) / FT); } run.push(lx, ly); }
      else if (run) { run.push(lx, ly); flush(); }
    }
    flush();
  });
  exits.sort((a, c) => a[1] - c[1]);
  // ---- who built it
  const races = P.races;
  let best = null, bw = 0;
  for (const [r, v] of races) if (BUILDER[r] && CULTURES[r]) { const w = v * BUILDER[r]; if (w > bw) { bw = w; best = r; } }
  const div = { 1: 45, 2: 55, 3: 80, 4: 1e9 }[tier], capP = { 1: 0.45, 2: 0.38, 3: 0.22, 4: 0 }[tier];
  const pFound = Math.min(capP, Math.pow(bw / div, 1.5));
  const founder = best && T.hash(h, 3, 1401) < pFound ? best : 'Human';
  const share = Object.fromEntries(races);
  // ---- how it grew
  const u = T.hash(h, 5, 1402);
  const W = {};
  const T1 = tier === 1;
  W.organic = tier >= 2 ? 3 : 0.8;
  W.ribbon = tier <= 2 ? (exits.length ? (T1 ? 2.6 : 1.5) : 0.4) : 0;
  W.crossroads = tier >= 2 && tier <= 3 && exits.length >= 3 ? 1.5 : 0;
  W.grid = tier >= 3 ? 0.9 : tier === 2 ? 0.2 : 0;
  W.hill = hill ? (tier >= 2 ? 3.5 : 2) : 0;
  W.green = T1 && s.pop >= 120 ? 2 : 0;
  W.hamlet = T1 && s.pop < 260 ? 3 : 0;
  W.seaward = seaD < 1.6 ? 3.2 : 0;
  W.canal = b === 9 ? 6 : b === 8 ? 1.2 : 0;
  W.oasis = b === 10 ? 6 : b === 11 ? 1.5 : 0;
  const own = { Dwarf: 'hold', Elf: 'grove', Halfling: 'smial', Gnome: 'warren', 'Half-orc': 'warcamp', Dragonborn: 'clanhold' }[founder];
  if (own) { W[own] = 9; W.organic *= 0.3; W.ribbon *= 0.4; W.hamlet *= 0.3; W.green *= 0.3; }
  if (founder === 'Dwarf' || founder === 'Dragonborn' || founder === 'Tiefling') W.grid = (W.grid || 0.4) * 4;
  if (founder === 'Half-elf') { W.organic *= 1.4; W.green *= 1.5; }
  let tot = 0;
  for (const k in W) tot += W[k];
  let arch = 'organic', acc = 0;
  for (const k in W) { acc += W[k] / tot; if (u < acc && W[k] > 0) { arch = k; break; } }
  // main axis
  let a0;
  if (exits.length) a0 = exits[0][0];
  else if (arch === 'seaward' || seaD < 5) a0 = seaA;
  else if (hill) a0 = upA + Math.PI / 2;
  else a0 = T.hash(h, 9, 1403) * Math.PI * 2;
  if (arch === 'seaward') a0 = seaA;
  let a1 = a0 + Math.PI / 2 + (T.hash(h, 11, 1404) - 0.5) * 0.6;
  for (const [a] of exits) { const d = angDiff(a, a0); if (d > 0.9 && d < 2.3) { a1 = a; break; } }
  // ---- quarters for the other peoples
  const quarters = [];
  if (tier >= 2) {
    const maxQ = tier === 2 ? 1 : tier === 3 ? 2 : 3;
    const cands = races.filter(([r, v]) => r !== founder && r !== 'Half-elf' && CULTURES[r] && v >= (r === 'Human' ? 0 : 7));
    let k = 0;
    for (const [r, v] of cands) {
      if (quarters.length >= maxQ) break;
      let a = r === 'Dwarf' ? upA : r === 'Elf' && wood > 0 ? a0 + Math.PI / 2 : T.hash(h, 20 + k, 1405) * Math.PI * 2;
      for (let t = 0; t < 12 && quarters.some((q) => angDiff(q.a, a) < 1.3); t++) a += 0.7;
      if (quarters.some((q) => angDiff(q.a, a) < 1.1)) continue;
      quarters.push({ race: r, a, w: tier === 4 ? 0.85 : 1.05, pct: v });
      k++;
    }
  }
  return { b, e0, g, upA, hill, seaD, seaA, rivD, rivA, mtnD, mtnA, wood: nw ? wood / nw : 0, roads, exits, a0, a1, founder, share, quarters, arch };
}

// --------------------------------------------------------------- the generator
function makePlan(s) {
  const M = planMeta(s);
  const tier = s.tier, cfg = TIERS[tier], arch = M.arch, C0 = CULTURES[M.founder];
  const rng = T.mulberry(hashStr(s.id) ^ 0x9e37);
  const Rm = settleR(s), R = Rm / FT, plaza0 = cfg.plaza;
  const plotB = cfg.plot;
  const target = Math.min(9000, Math.ceil(s.pop / cfg.ppb));
  const circ = circlesIn(s.x - Rm * 1.3, s.y - Rm * 1.3, s.x + Rm * 1.3, s.y + Rm * 1.3);
  // water inside the town? (rare: towns are sited on dry ground, but painted lakes and streams happen)
  let anyWet = false;
  const NS = tier >= 3 ? 41 : 25;
  for (let j = 0; j < NS && !anyWet; j++) for (let i = 0; i < NS; i++) {
    const x = (i / (NS - 1) * 2 - 1) * R * 1.05, y = (j / (NS - 1) * 2 - 1) * R * 1.05;
    if (x * x + y * y > R * R * 1.1) continue;
    if (T.isWater(T.biomeAt(s.x + x * FT, s.y + y * FT, 17, circ))) { anyWet = true; break; }
  }
  const wet = anyWet ? (x, y) => T.isWater(T.biomeAt(s.x + x * FT, s.y + y * FT, 17, circ)) : () => false;
  const seed = rng() * 1000;

  // ---- footprint: the built-up outline, irregular and shaped by how the town grew
  const FPN = 256, fp = new Float64Array(FPN);
  const ell = (th, a, q) => { const c = Math.cos(th - a), sn = Math.sin(th - a); return 1 / Math.sqrt(c * c + sn * sn / (q * q)); };
  const irr = arch === 'warcamp' ? 0.05 : arch === 'grid' || arch === 'clanhold' ? 0.1 : 0.16;
  for (let k = 0; k < FPN; k++) {
    const th = k / FPN * Math.PI * 2;
    let f = 1;
    if (arch === 'ribbon') f = ell(th, M.a0, tier === 1 ? 0.42 : 0.55);
    else if (arch === 'crossroads') f = Math.max(ell(th, M.a0, 0.45), ell(th, M.a1, 0.45));
    else if (arch === 'canal') f = ell(th, M.a0, 0.75);
    else if (arch === 'seaward') f = 0.72 + 0.28 * Math.cos(th - M.seaA);
    else if (arch === 'hill' || arch === 'hold') f = 0.9 - 0.1 * Math.cos(th - M.upA);
    else if (arch === 'oasis') f = 0.8;
    else if (arch === 'warcamp') f = 0.86;
    else if (arch === 'green') f = 0.9;
    const n = T.noise2(Math.cos(th) * 1.3 + seed, Math.sin(th) * 1.3 - seed) * 0.6 + T.noise2(Math.cos(th) * 3.1 - seed, Math.sin(th) * 3.1 + seed) * 0.4;
    fp[k] = Math.max(plaza0 * 1.6, R * 0.95 * f * (1 - irr + irr * n));
  }
  const fpTh = (th) => { let t = (th / (Math.PI * 2)) * FPN; t = ((t % FPN) + FPN) % FPN; const i = Math.floor(t), fr = t - i; return fp[i] * (1 - fr) + fp[(i + 1) % FPN] * fr; };
  const inside = (x, y, f) => { const r = fpTh(Math.atan2(y, x)) * (f || 1); return x * x + y * y < r * r; };
  const inR = (x, y, f) => x * x + y * y < R * R * f * f;

  // ---- styles across the town: the founders' everywhere, other peoples in their quarters
  const quarters = M.quarters.map((q) => ({ ...q, C: CULTURES[q.race] }));
  const styleAt = (x, y) => {
    if (quarters.length && x * x + y * y > R * R * 0.12) { const a = Math.atan2(y, x); for (const q of quarters) if (angDiff(a, q.a) < q.w / 2) return q.C; }
    return C0;
  };
  // palettes: index 0-2 founders, then 3 per quarter, then specials
  const biomeRoofs = roofSetFor(s);
  const pals = (C0.pal || (arch === 'oasis' ? [['#d6c3a0', '#b19d7b'], ['#c9b48e', '#a6916c'], ['#c47a50', '#985636']] : biomeRoofs)).slice();
  const palBase = new Map([[C0, 0]]);
  for (const q of quarters) { if (!palBase.has(q.C)) { palBase.set(q.C, pals.length); for (const p of (q.C.pal || biomeRoofs)) pals.push(p); } }
  const SP = pals.length;
  pals.push(SPECIAL_ROOF[1], SPECIAL_ROOF[2], SPECIAL_ROOF[4]);

  // ---- streets with a spatial index so new lanes stop when they meet old ones
  const streets = [];
  const SG = 40, sidx = new Map();
  const skey = (i, j) => (i + 4096) * 8192 + (j + 4096);
  function addStreet(pts, w, k) {
    if (!pts || pts.length < 4) return -1;
    const id = streets.length;
    streets.push({ pts, w, k });
    for (let i = 2; i < pts.length; i += 2) {
      const ax = pts[i - 2], ay = pts[i - 1], dx = pts[i] - ax, dy = pts[i + 1] - ay, L = Math.hypot(dx, dy);
      const n = Math.max(1, Math.ceil(L / 16)), ang = Math.atan2(dy, dx);
      for (let t = 0; t < n; t++) {
        const x = ax + dx * t / n, y = ay + dy * t / n, key = skey(Math.floor(x / SG), Math.floor(y / SG));
        let a = sidx.get(key);
        if (!a) { a = []; sidx.set(key, a); }
        a.push(x, y, ang, id, w);
      }
    }
    return id;
  }
  const hit = { x: 0, y: 0, a: 0, id: -1, w: 0 };
  function nearStreet(x, y, rad, skip) {
    const i0 = Math.floor((x - rad) / SG), i1 = Math.floor((x + rad) / SG), j0 = Math.floor((y - rad) / SG), j1 = Math.floor((y + rad) / SG);
    let bd = rad * rad, found = false;
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const a = sidx.get(skey(i, j));
      if (!a) continue;
      for (let k = 0; k < a.length; k += 5) {
        if (a[k + 3] === skip) continue;
        const dx = a[k] - x, dy = a[k + 1] - y, d = dx * dx + dy * dy;
        if (d < bd) { bd = d; hit.x = a[k]; hit.y = a[k + 1]; hit.a = a[k + 2]; hit.id = a[k + 3]; hit.w = a[k + 4]; found = true; }
      }
    }
    return found ? hit : null;
  }
  // grow a street step by step: it bends with noise, steers round water and stops at the edge or on meeting another street
  function walk(x, y, a, o) {
    const step = o.step || Math.max(14, plotB * 0.6), pts = [x, y];
    const sd = rng() * 500, lam = o.lam || R * 0.3, wig = o.wig || 0;
    let L = 0;
    while (L < o.len) {
      let aa = a + wig * T.noise2(sd, L / lam) * 1.3;
      if (o.steer) aa = o.steer(x, y, aa, L);
      let nx = x + Math.cos(aa) * step, ny = y + Math.sin(aa) * step;
      if (wet(nx, ny)) {
        let ok = false;
        for (const d of [0.5, -0.5, 1, -1]) { const tx = x + Math.cos(aa + d) * step, ty = y + Math.sin(aa + d) * step; if (!wet(tx, ty)) { nx = tx; ny = ty; a += d * 0.5; ok = true; break; } }
        if (!ok) break;
      }
      if (o.edge ? !inR(nx, ny, o.edge) : !inside(nx, ny)) break;
      if (L > (o.free || 0)) { const hh = nearStreet(nx, ny, o.join || (o.w * 0.5 + 8), o.parent); if (hh) { pts.push(hh.x, hh.y); return pts; } }
      pts.push(nx, ny);
      x = nx; y = ny; L += step;
    }
    return pts.length >= 4 ? pts : null;
  }
  // arcs and straight lines, cut wherever they leave the town or hit water
  function cutPolyline(gen, keep) {
    const out = [];
    let cur = [];
    for (const [x, y] of gen) {
      if (keep(x, y)) cur.push(x, y);
      else { if (cur.length >= 4) out.push(cur); cur = []; }
    }
    if (cur.length >= 4) out.push(cur);
    return out;
  }
  function* arcPts(cx, cy, r, a0, a1, jit, sd, rHint) {
    const n = Math.max(3, Math.ceil(Math.abs(a1 - a0) * (rHint || r) / (plotB * 0.6)));
    for (let k = 0; k <= n; k++) { const a = a0 + (a1 - a0) * k / n; const rr = r * (1 + jit * T.noise2(sd, a * 1.6)); yield [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; }
  }
  function* linePts(x0, y0, a, len, wig, sd) {
    const n = Math.max(2, Math.ceil(len / (plotB * 0.7))), c = Math.cos(a), sn = Math.sin(a);
    for (let k = 0; k <= n; k++) { const t = -len / 2 + len * k / n, off = wig ? wig * R * T.noise2(sd, t / (R * 0.5)) : 0; yield [x0 + c * t - sn * off, y0 + sn * t + c * off]; }
  }
  const dryIn = (f) => (x, y) => inside(x, y, f) && !wet(x, y);
  // lanes branching off a street
  function branch(id, o) {
    const st = streets[id];
    if (!st) return;
    const p = st.pts;
    let acc = 0, next = o.sp * (0.3 + 0.7 * rng()), side = rng() < 0.5 ? 1 : -1;
    for (let i = 2; i < p.length; i += 2) {
      const ax = p[i - 2], ay = p[i - 1], dx = p[i] - ax, dy = p[i + 1] - ay, L = Math.hypot(dx, dy);
      if (L <= 0) continue;
      const ang = Math.atan2(dy, dx);
      while (next <= acc + L) {
        const t = (next - acc) / L, px = ax + dx * t, py = ay + dy * t;
        for (const sg of o.both ? [side, -side] : [side]) {
          if (rng() > o.p || Math.hypot(px, py) < plaza0 * 1.2) continue;
          const a = ang + sg * Math.PI / 2 + (rng() - 0.5) * (o.jit || 0.5);
          const q = walk(px, py, a, { len: o.len * (0.5 + rng()), w: o.w, wig: o.wig, lam: o.lam || o.len, parent: id, free: st.w / 2 + o.w + 6, join: o.w / 2 + 10 });
          const nid = addStreet(q, o.w, 'lane');
          if (nid >= 0 && o.depth > 1) branch(nid, { ...o, depth: o.depth - 1, p: o.p * 0.6, len: o.len * 0.7 });
        }
        side = -side;
        next += o.sp * (0.7 + 0.6 * rng());
      }
      acc += L;
    }
  }
  const sw = (tier >= 3 ? 14 : tier === 2 ? 12 : 9) * (C0 === CULTURES.Dragonborn ? 1.3 : 1);
  const lw = tier >= 3 ? 9 : 8;
  const block = { 1: 300, 2: 230, 3: 190, 4: 175 }[tier] * Math.sqrt(C0.gap);
  const greens = [], labels = [];
  let plazaShape = C0.plaza, plazaR = plaza0;
  let keepAt = null, templeAt = null;
  // real roads count as streets (they are drawn by the road layer)
  const roadIds = [];
  for (const r of M.roads) roadIds.push(addStreet(r.pts, r.w, 'road'));
  const spokesFrom = (angles, len, wig, w, opt) => {
    const ids = [];
    for (const a of angles) {
      const q = walk(Math.cos(a) * plazaR, Math.sin(a) * plazaR, a, { len, w, wig, lam: R * 0.35, free: plazaR * 0.6 + 40, edge: opt && opt.edge });
      const id = addStreet(q, w, 'street');
      if (id >= 0) ids.push(id);
    }
    return ids;
  };
  const freeAngles = (n, taken, minD) => {
    const out = [], all = taken.slice();
    for (let t = 0; t < 80 && out.length < n; t++) { const a = rng() * Math.PI * 2; if (all.every((b) => angDiff(a, b) > minD)) { out.push(a); all.push(a); } }
    return out;
  };
  const exitA = M.exits.map((e) => e[0]);
  const walled = isWalled(s, M);
  const spokeEdge = walled ? 1.03 : null;

  // ---- skeletons
  switch (arch) {
    case 'organic': case 'seaward': {
      const ids = spokesFrom(freeAngles(Math.max(1, cfg.streets - exitA.length + (tier >= 3 ? 1 : 0)), exitA, 0.5), R * 1.1, 0.35 * (C0.wig + 0.3), sw, { edge: spokeEdge });
      if (arch === 'seaward') {
        const hs = walk(0, 0, M.seaA, { len: R * 1.1, w: sw * 1.2, wig: 0.08, edge: 1.02 });
        ids.push(addStreet(hs, sw * 1.2, 'street'));
        const hx = Math.cos(M.seaA) * R * 1.05, hy = Math.sin(M.seaA) * R * 1.05;
        for (const f of tier >= 3 ? [0.55, 0.95, 1.35] : tier === 2 ? [0.6, 1.1] : [0.8]) {
          const sd = rng() * 99;
          for (const pl of cutPolyline(arcPts(hx, hy, R * f, M.seaA + Math.PI - 1.4, M.seaA + Math.PI + 1.4, 0.08, sd), dryIn(1))) { const id = addStreet(pl, sw * 0.85, 'street'); if (id >= 0) ids.push(id); }
        }
        labels.push({ x: hx * 0.86, y: hy * 0.86, t: walled ? 'Harbour Gate' : 'Harbour road' });
      } else {
        // curving streets that half-ring the core, broken where the town never filled in
        const spAng = exitA.concat(ids.map((i) => { const p = streets[i].pts; return Math.atan2(p[p.length - 1], p[p.length - 2]); })).sort((a, c) => a - c);
        const rings = tier === 2 ? [0.55] : tier === 3 ? [0.38, 0.72] : tier === 4 ? [0.3, 0.53, 0.78] : [];
        for (const f of rings) for (let k = 0; k < spAng.length; k++) {
          if (rng() > 0.62) continue;
          const a0 = spAng[k], a1 = k + 1 < spAng.length ? spAng[k + 1] : spAng[0] + Math.PI * 2;
          if (a1 - a0 < 0.25) continue;
          const ff = f * (0.88 + 0.24 * rng()), sd = rng() * 99;
          const gen = (function* () { for (const [x, y] of arcPts(0, 0, 1, a0, a1, 0, sd, R * ff)) { const th = Math.atan2(y, x), r = fpTh(th) * ff * (1 + 0.09 * T.noise2(sd, th * 2)); yield [Math.cos(th) * r, Math.sin(th) * r]; } })();
          for (const pl of cutPolyline(gen, dryIn(1))) { const id = addStreet(pl, sw * 0.85, 'street'); if (id >= 0) ids.push(id); }
        }
      }
      const all = ids.concat(roadIds);
      for (const id of all) branch(id, { sp: block, p: tier === 1 ? 0.35 : 0.72, len: block * 0.9, w: lw, wig: 0.55 * (C0.wig + 0.3), depth: tier >= 3 ? 2 : 1 });
      break;
    }
    case 'ribbon': {
      const through = M.roads.some((r) => r.ex.length >= 2) || (exitA.length >= 2 && angDiff(exitA[0], exitA[1]) > 2.4);
      let main = roadIds.slice();
      if (!through) {
        const q1 = walk(0, 0, M.a0, { len: R * 1.1, w: sw, wig: 0.15 }), q2 = walk(0, 0, M.a0 + Math.PI, { len: R * 1.1, w: sw, wig: 0.15 });
        if (q1 && q2) { const pts = []; for (let i = q2.length - 2; i >= 2; i -= 2) pts.push(q2[i], q2[i + 1]); main.push(addStreet(pts.concat(q1), sw, 'street')); }
        else if (q1 || q2) main.push(addStreet(q1 || q2, sw, 'street'));
      }
      if (tier >= 2 || s.pop > 400) for (const sg of [1, -1]) {
        const off = plotB * 2.5 * sg, ox = -Math.sin(M.a0) * off, oy = Math.cos(M.a0) * off;
        for (const pl of cutPolyline(linePts(ox, oy, M.a0, R * 1.5, 0.04, rng() * 99), dryIn(0.92))) if (rng() < 0.85) main.push(addStreet(pl, lw, 'lane'));
      }
      for (const id of main) branch(id, { sp: block * 1.1, p: 0.55, len: R * 0.5, w: lw, wig: 0.3, depth: 1, jit: 0.3 });
      break;
    }
    case 'crossroads': {
      const ids = roadIds.slice();
      const covered = (a) => exitA.some((b) => angDiff(a, b) < 0.4);
      for (const a of [M.a0, M.a0 + Math.PI, M.a1, M.a1 + Math.PI]) if (!covered(a)) ids.push(addStreet(walk(0, 0, a, { len: R * 1.1, w: sw, wig: 0.12, free: plazaR + 30, edge: spokeEdge }), sw, 'street'));
      for (const id of ids) branch(id, { sp: block, p: 0.6, len: block * 1.1, w: lw, wig: 0.4, depth: tier >= 3 ? 2 : 1 });
      break;
    }
    case 'grid': case 'clanhold': {
      const B = Math.min(R * 0.55, block * (arch === 'clanhold' ? 1.55 : C0 === CULTURES.Dwarf ? 0.95 : 1.1));
      const a = M.a0, sq = Math.min(R * 0.28, Math.max(plaza0 * 1.1, B * 0.55));
      plazaShape = 'square'; plazaR = sq;
      const inPlaza = (x, y) => { const u = x * Math.cos(a) + y * Math.sin(a), v = -x * Math.sin(a) + y * Math.cos(a); return Math.abs(u) < sq * 0.92 && Math.abs(v) < sq * 0.92; };
      const n = Math.ceil(R / B) + 1, wigg = C0 === CULTURES.Tiefling ? 0.015 : 0.004;
      for (const fam of [0, 1]) {
        const aa = a + fam * Math.PI / 2;
        for (let i = -n; i <= n; i++) {
          const off = (i + 0.5) * B + (i ? (rng() - 0.5) * B * 0.12 : 0);
          const ox = -Math.sin(aa) * off, oy = Math.cos(aa) * off;
          const w = Math.abs(i + 0.5) < 1 ? sw * 1.15 : (i % 3 === 0 ? sw : lw + 1);
          for (const pl of cutPolyline(linePts(ox, oy, aa, R * 2.2, wigg, rng() * 99), (x, y) => inside(x, y) && !wet(x, y) && !inPlaza(x, y))) addStreet(pl, w, w > lw + 1 ? 'street' : 'lane');
        }
      }
      break;
    }
    case 'hill': case 'hold': {
      const ua = M.upA, ux = Math.cos(ua), uy = Math.sin(ua), straight = arch === 'hold';
      const Tsp = plotB * (straight ? 2.3 : 2.6) * Math.sqrt(C0.gap);
      if (straight) {
        for (let k = -Math.ceil(R / Tsp); k <= Math.ceil(R / Tsp); k++) {
          const off = k * Tsp + Tsp * 0.5;
          for (const pl of cutPolyline(linePts(ux * off, uy * off, ua + Math.PI / 2, R * 2.2, 0, 0), dryIn(1))) addStreet(pl, k % 3 === 0 ? sw : lw + 1, 'street');
        }
        for (const off of [-0.45, 0.05, 0.5]) { const ox = -uy * R * off, oy = ux * R * off; for (const pl of cutPolyline(linePts(ox, oy, ua, R * 2.2, 0, 0), dryIn(1))) addStreet(pl, sw, 'street'); }
      } else {
        const D = R * 1.7, cx = ux * D, cy = uy * D;
        for (let r = D - R * 1.05; r <= D + R * 1.05; r += Tsp) {
          if (r < R * 0.3) continue;
          const span = Math.min(Math.PI * 0.9, Math.asin(Math.min(1, R * 1.05 / r)) * 1.25);
          for (const pl of cutPolyline(arcPts(cx, cy, r, ua + Math.PI - span, ua + Math.PI + span, 0.025, rng() * 99), dryIn(1))) addStreet(pl, lw + 2, 'street');
        }
        for (const d of [-0.42, 0, 0.42]) {
          const q = walk(cx + Math.cos(ua + Math.PI + d) * (D - R * 1.1), cy + Math.sin(ua + Math.PI + d) * (D - R * 1.1), ua + Math.PI + d, { len: R * 2.4, w: sw, wig: 0.1, edge: 1.25 });
          if (q) for (const pl of cutPolyline((function* () { for (let i = 0; i < q.length; i += 2) yield [q[i], q[i + 1]]; })(), dryIn(1))) addStreet(pl, sw, 'street');
        }
      }
      keepAt = [ux * fpTh(ua) * 0.72, uy * fpTh(ua) * 0.72];
      if (straight) labels.push({ x: keepAt[0], y: keepAt[1] - plotB * 3, t: 'Hold-gate' });
      for (const id of roadIds) branch(id, { sp: block * 1.4, p: 0.4, len: block * 0.8, w: lw, wig: 0.2, depth: 1 });
      break;
    }
    case 'green': case 'smial': {
      const ga = plaza0 * (arch === 'smial' ? 1.7 : 2.1) * (1 + tier * 0.12), gb = ga * 0.58, a = M.a0;
      plazaShape = 'none';
      greens.push({ t: 'ell', x: 0, y: 0, a: ga, b: gb, r: a, c: 0 });
      greens.push({ t: 'ell', x: Math.cos(a) * ga * 0.45, y: Math.sin(a) * ga * 0.45, a: ga * 0.22, b: ga * 0.16, r: a + 0.4, c: 1 });
      const ring = [];
      for (let k = 0; k <= 48; k++) { const t = k / 48 * Math.PI * 2, ex = (ga + 16) * Math.cos(t), ey = (gb + 16) * Math.sin(t); ring.push(ex * Math.cos(a) - ey * Math.sin(a), ex * Math.sin(a) + ey * Math.cos(a)); }
      const rid = addStreet(ring, lw + 2, 'street');
      const out = freeAngles(arch === 'smial' ? 5 + (tier > 1 ? 3 : 0) : 2, exitA, 0.8);
      const ids = [rid];
      for (const oa of out) { const q = walk(Math.cos(oa) * (ga + 16), Math.sin(oa) * (gb + 16), oa, { len: R * 1.1, w: lw + 1, wig: arch === 'smial' ? 0.9 : 0.4, lam: R * 0.25, free: 40 }); const id = addStreet(q, lw + 1, 'street'); if (id >= 0) ids.push(id); }
      for (const id of ids.concat(roadIds)) branch(id, { sp: block * (arch === 'smial' ? 0.9 : 1.3), p: arch === 'smial' ? 0.6 : 0.4, len: block, w: lw - 1, wig: arch === 'smial' ? 0.9 : 0.4, depth: tier >= 2 ? 2 : 1 });
      break;
    }
    case 'hamlet': {
      plazaShape = 'none';
      const k = Math.min(7, 2 + Math.floor(s.pop / 60));
      const angs = freeAngles(k, [], 0.6);
      for (const a of angs) {
        const d = R * (0.35 + 0.4 * rng()), tx = Math.cos(a) * d, ty = Math.sin(a) * d;
        const q = walk(0, 0, a, { len: d, w: lw, wig: 0.6, lam: R * 0.3, steer: (x, y, aa) => { const want = Math.atan2(ty - y, tx - x); return aa + (((want - aa + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * 0.35; }, free: 30 });
        addStreet(q, lw, 'lane');
      }
      break;
    }
    case 'canal': {
      const a = M.a0, cw = tier >= 3 ? 26 : 20;
      const addCanal = (pl, w) => { const id = addStreet(pl, w, 'canal'); if (id < 0) return; for (const sg of [1, -1]) { const p = streets[id].pts, side = []; for (let i = 0; i < p.length; i += 2) { const j = Math.min(i, p.length - 4), dx = p[j + 2] - p[j], dy = p[j + 3] - p[j + 1], L = Math.hypot(dx, dy) || 1; side.push(p[i] - dy / L * (w / 2 + 6) * sg, p[i + 1] + dx / L * (w / 2 + 6) * sg); } addStreet(side, 7, 'lane'); } };
      for (const pl of cutPolyline(linePts(0, 0, a, R * 2.2, 0.05, rng() * 99), dryIn(1))) addCanal(pl, cw);
      const Bc = block * 1.25;
      for (let k = -Math.ceil(R / Bc); k <= Math.ceil(R / Bc); k++) {
        if (k === 0) continue;
        const ox = Math.cos(a) * k * Bc, oy = Math.sin(a) * k * Bc;
        for (const pl of cutPolyline(linePts(ox, oy, a + Math.PI / 2, R * 2.2, 0.04, rng() * 99), dryIn(0.95))) addCanal(pl, cw * 0.65);
      }
      plazaShape = 'square';
      for (const id of roadIds) branch(id, { sp: block, p: 0.5, len: block * 0.8, w: 7, wig: 0.2, depth: 1 });
      break;
    }
    case 'oasis': {
      plazaShape = 'round'; plazaR = plaza0 * 1.15;
      const ids = spokesFrom(freeAngles(Math.max(2, cfg.streets - exitA.length), exitA, 0.7), R, 0.5, 10, { edge: walled ? 1.0 : null });
      for (const id of ids.concat(roadIds)) branch(id, { sp: block * 0.6, p: 0.8, len: block * 0.7, w: 6, wig: 0.7, depth: 3, jit: 0.9 });
      break;
    }
    case 'grove': {
      plazaShape = 'glade'; plazaR = plaza0 * 1.6;
      const ids = [];
      for (const f of tier === 1 ? [0.55] : tier === 2 ? [0.42, 0.78] : [0.35, 0.6, 0.85]) {
        const a0 = rng() * Math.PI * 2, sd = rng() * 99;
        const gen = (function* () { for (const [x, y] of arcPts(0, 0, 1, a0, a0 + Math.PI * 2 * (0.6 + 0.35 * rng()), 0, sd, R * f)) { const th = Math.atan2(y, x), r = fpTh(th) * f * (1 + 0.18 * T.noise2(sd, th * 1.7)); yield [Math.cos(th) * r, Math.sin(th) * r]; } })();
        for (const pl of cutPolyline(gen, dryIn(1))) { const id = addStreet(pl, 7, 'street'); if (id >= 0) ids.push(id); }
      }
      ids.push(...spokesFrom(freeAngles(3 + tier, exitA, 0.9), R * 1.05, 0.9, 7));
      for (const id of ids) branch(id, { sp: block * 1.6, p: 0.35, len: block * 0.8, w: 6, wig: 0.9, depth: 1 });
      break;
    }
    case 'warren': {
      const ids = spokesFrom(freeAngles(6 + tier, exitA, 0.5), R * 1.05, 1.1, lw, { edge: null });
      for (const id of ids.concat(roadIds)) branch(id, { sp: block * 0.55, p: 0.75, len: block * 0.6, w: lw - 2, wig: 1.1, depth: 3, jit: 1 });
      break;
    }
    case 'warcamp': {
      plazaShape = 'arena'; plazaR = plaza0 * 1.35;
      const ids = spokesFrom(exitA.length >= 2 ? [] : freeAngles(4 - exitA.length, exitA, 1.1), R * 1.05, 0.12, 12, { edge: 1.03 });
      const stepR = plotB * 2.6;
      for (let r = plazaR + stepR; r < R * 0.95; r += stepR) {
        const sd = rng() * 99;
        const gen = (function* () { for (const [x, y] of arcPts(0, 0, 1, 0, Math.PI * 2, 0, sd, r)) { const th = Math.atan2(y, x), rr = Math.min(r, fpTh(th) * 0.97) * (1 + 0.03 * T.noise2(sd, th * 2)); yield [Math.cos(th) * rr, Math.sin(th) * rr]; } })();
        for (const pl of cutPolyline(gen, (x, y) => !wet(x, y))) ids.push(addStreet(pl, 9, 'lane'));
      }
      labels.push({ x: 0, y: -plazaR - 30, t: 'Arena' });
      break;
    }
  }

  // ---- occupancy: streets, then buildings, trees, gardens and fields claim ground
  const oc = Math.max(24, plotB);
  const occ = new Map();
  const ok = (x, y) => (Math.floor(x / oc) + 4096) * 8192 + (Math.floor(y / oc) + 4096);
  function occFree(x, y, rad) {
    const m = rad + oc, i0 = Math.floor((x - m) / oc), i1 = Math.floor((x + m) / oc), j0 = Math.floor((y - m) / oc), j1 = Math.floor((y + m) / oc);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const a = occ.get((i + 4096) * 8192 + (j + 4096));
      if (!a) continue;
      for (let k = 0; k < a.length; k += 3) { const dx = a[k] - x, dy = a[k + 1] - y, rr = a[k + 2] + rad; if (dx * dx + dy * dy < rr * rr) return false; }
    }
    return true;
  }
  function occAdd(x, y, rad) { const k = ok(x, y); let a = occ.get(k); if (!a) { a = []; occ.set(k, a); } a.push(x, y, Math.min(rad, oc)); }
  function occAddBig(x, y, rad) { if (rad <= oc) { occAdd(x, y, rad); return; } const n = Math.ceil(rad / (oc * 0.7)); for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) { const px = x + i * rad / n, py = y + j * rad / n; if ((px - x) ** 2 + (py - y) ** 2 <= rad * rad) occAdd(px, py, rad / n * 1.1); } }
  for (const st of streets) {
    const p = st.pts, half = st.w / 2 + (st.k === 'canal' ? 4 : 3);
    for (let i = 2; i < p.length; i += 2) {
      const L = Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1]), n = Math.max(1, Math.ceil(L / (half * 1.2)));
      for (let k = 0; k < n; k++) { const t = k / n; occAdd(p[i - 2] + (p[i] - p[i - 2]) * t, p[i - 1] + (p[i + 1] - p[i - 1]) * t, half); }
    }
  }
  // plaza
  if (plazaShape !== 'none') occAddBig(0, 0, plazaR);
  for (const g of greens) occAddBig(g.x, g.y, Math.max(g.a, g.b) * 0.92);
  const bx = [], by = [], bw = [], bd = [], ba = [], bk = [], bp = [], bs = [];
  function push(x, y, w, d, a, k, pal, shp) { bx.push(x); by.push(y); bw.push(w); bd.push(d); ba.push(a); bk.push(k); bp.push(pal); bs.push(shp); }
  const radOf = (w, d, shp) => (shp === 2 ? w * 0.5 : 0.4 * Math.hypot(w, d));
  function tryPlace(x, y, w, d, a, kind, pal, shp, edge) {
    if (!inR(x, y, edge || 0.97)) return false;
    if (x * x + y * y < (plazaR + Math.max(w, d) * 0.5) ** 2 && plazaShape !== 'none') return false;
    const rad = radOf(w, d, shp);
    if (!occFree(x, y, rad)) return false;
    if (wet(x, y)) return false;
    if (anyWet) for (let q = 0; q < 4; q++) { const qa = a + Math.PI / 4 + q * Math.PI / 2; if (wet(x + Math.cos(qa) * rad * 1.1, y + Math.sin(qa) * rad * 1.1)) return false; }
    push(x, y, w, d, a, kind, pal, shp);
    occAdd(x, y, rad);
    return true;
  }
  const pickShape = (C) => { const u = rng(); let acc = 0; for (let i = 0; i < 4; i++) { acc += C.shapes[i]; if (u < acc) return i; } return 0; };
  // shape codes in the plan: 0 rectangle, 1 round, 2 courtyard (long halls are rectangles)
  function dims(C, sh) {
    const p = plotB * C.size;
    if (sh === 1) return [p * (1 + 0.5 * rng()), p * (0.45 + 0.15 * rng()), 0];
    if (sh === 2) { const dd = p * (0.5 + 0.25 * rng()); return [dd, dd, 1]; }
    if (sh === 3) { const dd = p * (1.1 + 0.4 * rng()); return [dd, dd, 2]; }
    return [p * (0.55 + 0.3 * rng()), p * (0.5 + 0.35 * rng()), 0];
  }
  const palOf = (C) => palBase.get(C) + Math.floor(rng() * 3);

  // landmarks: temple, keep or hall, market stalls
  const tSize = [0, [30, 46], [46, 76], [62, 104], [84, 136]][tier];
  {
    const a = templeAt ? 0 : rng() * Math.PI * 2, d = plazaR + (tSize[1] * 0.5 + 14);
    const x = Math.cos(a) * d, y = Math.sin(a) * d;
    const round = C0 === CULTURES.Elf || arch === 'grove';
    if (!wet(x, y)) { push(x, y, round ? tSize[1] * 0.85 : tSize[1], round ? tSize[1] * 0.85 : tSize[0], a, 1, SP, round ? 1 : 0); occAddBig(x, y, tSize[1] * 0.6); }
    if (tier >= 3 || (tier === 2 && (C0.wall === 'heavy' || C0.wall === 'palisade'))) {
      const ks = (tier === 4 ? 230 : tier === 3 ? 160 : 110) * (C0 === CULTURES.Dragonborn ? 1.15 : 1);
      for (let k = 0; k < 10; k++) {
        let x2, y2, a2;
        if (keepAt && k < 4) { x2 = keepAt[0] * (1 - k * 0.12); y2 = keepAt[1] * (1 - k * 0.12); a2 = M.upA; }
        else { a2 = a + Math.PI + (rng() - 0.5) * 1.5; const d2 = plazaR + (R - plazaR) * (0.22 + rng() * 0.2); x2 = Math.cos(a2) * d2; y2 = Math.sin(a2) * d2; }
        if (!wet(x2, y2) && occFree(x2, y2, ks * 0.6)) { push(x2, y2, ks, ks, a2, 2, SP + 1, C0 === CULTURES.Dragonborn ? 2 : 0); occAddBig(x2, y2, ks * 0.72); break; }
      }
    }
    if (tier >= 2 && (plazaShape === 'round' || plazaShape === 'square')) {
      const n = tier * 6;
      if (plazaShape === 'round') { const rr = plazaR * 0.58; for (let k = 0; k < n; k++) { const a3 = k / n * Math.PI * 2 + rng() * 0.2; push(Math.cos(a3) * rr, Math.sin(a3) * rr, 10, 8, a3 + Math.PI / 2, 3, 0, 0); } }
      else { const a3 = M.a0, c = Math.cos(a3), sn = Math.sin(a3), cols = Math.ceil(Math.sqrt(n)); for (let k = 0; k < n; k++) { const u = ((k % cols) / (cols - 1 || 1) - 0.5) * plazaR * 1.1, v = (Math.floor(k / cols) / (cols - 1 || 1) - 0.5) * plazaR * 1.1; push(u * c - v * sn, u * sn + v * c, 10, 8, a3, 3, 0, 0); } }
    }
  }
  const angCache = new Map(), AC = 50;
  const nearAng = (x, y, def) => {
    const key = (Math.floor(x / AC) + 4096) * 8192 + (Math.floor(y / AC) + 4096);
    let v = angCache.get(key);
    if (v === undefined) { const hh = nearStreet((Math.floor(x / AC) + 0.5) * AC, (Math.floor(y / AC) + 0.5) * AC, plotB * 3, -2); v = hh ? hh.a : NaN; angCache.set(key, v); }
    return Number.isNaN(v) ? def : v;
  };
  // hamlet farmsteads: house, barn and sheds round a yard
  if (arch === 'hamlet') {
    for (const st of streets) {
      if (st.k !== 'lane') continue;
      const p = st.pts, ex = p[p.length - 2], ey = p[p.length - 1], a = Math.atan2(p[p.length - 1] - p[p.length - 3], p[p.length - 2] - p[p.length - 4]);
      const c = Math.cos(a), sn = Math.sin(a);
      tryPlace(ex + c * plotB * 0.6, ey + sn * plotB * 0.6, plotB * 0.8, plotB * 0.6, a, 0, palOf(C0), 0);
      tryPlace(ex - sn * plotB * 0.9, ey + c * plotB * 0.9, plotB * 1.3, plotB * 0.6, a, 4, SP + 2, 0);
      tryPlace(ex + sn * plotB * 0.8, ey - c * plotB * 0.8, plotB * 0.5, plotB * 0.4, a + 0.2, 4, palOf(C0), 0);
    }
  }
  // clanhold compounds: one courtyard house per block
  if (arch === 'clanhold') {
    const B = Math.min(R * 0.55, block * 1.55), a = M.a0, c = Math.cos(a), sn = Math.sin(a), n = Math.ceil(R / B) + 1;
    for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
      const u = i * B, v = j * B, x = u * c - v * sn, y = u * sn + v * c;
      if (!inside(x, y, 0.95) || (i === 0 && j === 0)) continue;
      const S = Math.min(B * (0.42 + 0.1 * rng()), plotB * 2.2);
      tryPlace(x, y, S, S, a, 0, palOf(C0), 2, 0.95);
    }
  }
  // frontage: houses facing every street, in the style of whoever lives there
  const homesBefore = bx.length;
  for (const st of streets) {
    if (st.k === 'canal') continue;
    const p = st.pts;
    let acc = 0, next = plotB * rng();
    for (let i = 2; i < p.length; i += 2) {
      const ax = p[i - 2], ay = p[i - 1], dx = p[i] - ax, dy = p[i + 1] - ay, L = Math.hypot(dx, dy);
      if (L <= 0) continue;
      const ux = dx / L, uy = dy / L, ang = Math.atan2(dy, dx);
      while (next <= acc + L) {
        const t = (next - acc) / L, px = ax + dx * t, py = ay + dy * t;
        const C = styleAt(px, py);
        for (const side of [-1, 1]) {
          if (bx.length >= target) break;
          if (tier === 1) { const dd = Math.hypot(px, py) / R; if (rng() > 1 - 0.6 * dd * dd) continue; }
          if (C.gap > 1.2 && rng() > 1 / C.gap) continue;
          const sh = pickShape(C), [w, d, code] = dims(C, sh);
          const off = st.w / 2 + 3 + d / 2 + (C.gap > 1.2 ? plotB * 0.2 * rng() : 0);
          const a2 = code === 1 ? ang + Math.PI / 2 : ang;
          tryPlace(px - uy * side * off, py + ux * side * off, w, d, a2, 0, palOf(C), code);
          if (tier >= 2 && rng() < (C.gap > 1.2 ? 0.35 : 0.85)) {
            const sh2 = pickShape(C), [w2, d2, c2] = dims(C, sh2), off2 = off + d / 2 + 4 + d2 / 2;
            if (tryPlace(px - uy * side * off2, py + ux * side * off2, w2, d2, c2 === 1 ? ang + Math.PI / 2 : ang, 0, palOf(C), c2) && tier >= 3 && C.gap <= 1.2 && rng() < 0.6) {
              const [w3, d3, c3] = dims(C, pickShape(C)), off3 = off2 + d2 / 2 + 4 + d3 / 2;
              tryPlace(px - uy * side * off3, py + ux * side * off3, w3, d3, c3 === 1 ? ang + Math.PI / 2 : ang, 0, palOf(C), c3);
            }
          }
        }
        next += plotB * (0.85 + 0.25 * rng()) * Math.max(1, C.gap * 0.85) * C.size;
      }
      acc += L;
    }
  }
  // infill: back plots and yards, aligned with the nearest street
  {
    let attempts = 0;
    const maxA = Math.max(80, (target - bx.length) * 9);
    const outskirts = arch === 'hamlet' || tier === 1 ? 0.3 : 0.06;
    let fails = 0;
    while (bx.length < target && attempts < maxA && fails < 900) {
      attempts++; fails++;
      const th = rng() * Math.PI * 2, fr = fpTh(th), out = rng() < outskirts;
      const rr = out ? fr + (R * 0.96 - fr) * rng() : fr * Math.sqrt(rng()) * 0.99;
      const x = Math.cos(th) * rr, y = Math.sin(th) * rr, inFp = !out;
      const C = styleAt(x, y);
      if (rng() > 1 / (C.gap * C.gap)) continue;
      const a = nearAng(x, y, th) + (rng() < 0.5 ? 0 : Math.PI / 2) + (rng() - 0.5) * 0.2;
      const sh = pickShape(C), [w, d, code] = dims(C, sh);
      const barn = !inFp && rng() < 0.5;
      const n0 = bx.length;
      if (!inFp || tier === 1) tryPlace(x, y, barn ? w * 1.2 : w * 0.85, d * 0.8, a, barn ? 4 : 0, barn ? SP + 2 : palOf(C), barn ? 0 : code);
      else tryPlace(x, y, w, d, a, 0, palOf(C), code);
      if (bx.length > n0) fails = 0;
    }
  }
  const nB = bx.length;
  // ---- gardens behind houses
  const gq = [], gc = [];
  const quad = (arr, x, y, w, d, a) => { const c = Math.cos(a), sn = Math.sin(a), ux = c * w / 2, uy = sn * w / 2, vx = -sn * d / 2, vy = c * d / 2; arr.push(x - ux - vx, y - uy - vy, x + ux - vx, y + uy - vy, x + ux + vx, y + uy + vy, x - ux + vx, y - uy + vy); };
  for (let i = homesBefore; i < nB; i++) {
    if (bk[i] !== 0) continue;
    const C = styleAt(bx[i], by[i]);
    if (rng() > C.gardens) continue;
    const a = ba[i], nx = -Math.sin(a), ny = Math.cos(a), off = bd[i] / 2 + 14;
    for (const sg of [1, -1]) {
      const x = bx[i] + nx * off * sg, y = by[i] + ny * off * sg, gw = bw[i] * 0.9, gd = 20 + rng() * 12;
      if (!inR(x, y, 0.97) || !occFree(x, y, Math.min(gw, gd) * 0.45) || wet(x, y)) continue;
      quad(gq, x, y, gw, gd, a); gc.push(Math.floor(rng() * 3)); occAdd(x, y, Math.min(gw, gd) * 0.5);
      break;
    }
  }
  // ---- trees: kept by elves and halflings, planted round wells and squares, left standing in wooded country
  const tx = [], ty = [], tr = [], tk = [];
  const wooded = M.b === 6 || M.b === 7 || M.b === 8;
  const tkBiome = M.b === 7 || M.b === 12 || M.b === 13 || M.b === 14 || M.b === 15 ? 1 : M.b === 8 || M.b === 10 || M.b === 4 ? 2 : 0;
  const addTree = (x, y, r, k) => { if (!inR(x, y, 0.97) || wet(x, y) || !occFree(x, y, r * 0.6)) return false; tx.push(x); ty.push(y); tr.push(r); tk.push(k); occAdd(x, y, r * 0.6); return true; };
  for (let i = 0; i < nB; i++) {
    if (bk[i] === 3) continue;
    const C = styleAt(bx[i], by[i]);
    let want = C.trees + (wooded ? 0.15 : 0) + (arch === 'oasis' ? 0.05 : 0);
    while (want > 0) {
      if (rng() < want) { const a = rng() * Math.PI * 2, d = plotB * (0.6 + 0.8 * rng()); addTree(bx[i] + Math.cos(a) * d, by[i] + Math.sin(a) * d, (C === CULTURES.Elf ? 12 + rng() * 9 : 8 + rng() * 6), C === CULTURES.Elf ? (rng() < 0.3 ? 4 : 0) : arch === 'oasis' ? 2 : tkBiome); }
      want -= 1;
    }
  }
  if (arch === 'grove') { tx.push(0); ty.push(0); tr.push(Math.min(46, plazaR * 0.45)); tk.push(4); for (let k = 0; k < 40; k++) { const a = rng() * Math.PI * 2, d = plazaR * (0.4 + 0.5 * rng()); addTree(Math.cos(a) * d, Math.sin(a) * d, 9 + rng() * 6, 0); } }
  if (arch === 'oasis') for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2, d = plazaR * 0.82; addTree(Math.cos(a) * d, Math.sin(a) * d, 9 + rng() * 3, 2); }
  if (arch === 'green' || arch === 'smial') addTree(-Math.cos(M.a0) * plaza0, -Math.sin(M.a0) * plaza0 * 0.4, 20, 0);
  // ---- fields, pasture and orchards in the ring outside the houses
  const fq = [], fcl = [];
  const noFields = arch === 'grove' || arch === 'warcamp' || arch === 'warren' || arch === 'canal';
  if (!noFields) {
    const tries = tier === 1 ? 70 : tier === 2 ? 60 : 30;
    for (let t = 0; t < tries; t++) {
      const th = rng() * Math.PI * 2, r0 = fpTh(th) * 1.02, r1 = R * 0.95;
      if (r1 - r0 < 50) continue;
      const rr = r0 + (r1 - r0) * rng(), x = Math.cos(th) * rr, y = Math.sin(th) * rr;
      const L = Math.min(r1 - r0 + 40, 120 + rng() * 240) * (tier === 1 ? 0.8 : 1), Wd = 90 + rng() * 170;
      const a = (rng() < 0.6 ? th : th + Math.PI / 2) + (rng() - 0.5) * 0.4;
      if (!occFree(x, y, Math.min(L, Wd) * 0.42) || wet(x, y)) continue;
      const orchard = rng() < (arch === 'smial' ? 0.35 : 0.12);
      if (orchard) {
        const c = Math.cos(a), sn = Math.sin(a);
        for (let u = -L / 2 + 12; u < L / 2; u += 24) for (let v = -Wd / 2 + 12; v < Wd / 2; v += 24) { const px = x + u * c - v * sn, py = y + u * sn + v * c; if (inR(px, py, 0.97) && !wet(px, py)) { tx.push(px); ty.push(py); tr.push(7); tk.push(3); } }
        occAddBig(x, y, Math.min(L, Wd) * 0.5);
        continue;
      }
      const sw2 = 16 + rng() * 18, ns = Math.max(1, Math.floor(Wd / sw2));
      const c = Math.cos(a), sn = Math.sin(a);
      for (let k = 0; k < ns; k++) {
        const v = -Wd / 2 + (k + 0.5) * Wd / ns, px = x - sn * v, py = y + c * v;
        if (!inR(px + c * L / 2, py + sn * L / 2, 0.98) || !inR(px - c * L / 2, py - sn * L / 2, 0.98)) continue;
        if (!occFree(px, py, Wd / ns * 0.3)) continue;
        quad(fq, px, py, L, Wd / ns - 2, a);
        fcl.push(Math.floor(rng() * 5));
      }
      occAddBig(x, y, Math.min(L, Wd) * 0.5);
    }
  }
  // ---- walls that follow the town's real outline, with gates where streets pass
  let wall = null;
  if (walled) {
    const style = arch === 'oasis' ? 'mud' : C0.wall;
    const N = 160, wr = new Float64Array(N + 1), wx = [], wy = [];
    for (let k = 0; k <= N; k++) { const th = k / N * Math.PI * 2; wr[k] = Math.min(R * 1.02, fpTh(th) * 1.04 + 16); wx.push(Math.cos(th) * wr[k]); wy.push(Math.sin(th) * wr[k]); }
    const wrAt = (th) => { let t = ((th / (Math.PI * 2)) * N % N + N) % N; const i = Math.floor(t), f = t - i; return wr[i] * (1 - f) + wr[i + 1] * f; };
    const gates = [];
    for (const st of streets) {
      if (st.k === 'lane') continue;
      const p = st.pts;
      for (let i = 2; i < p.length; i += 2) {
        const r0 = Math.hypot(p[i - 2], p[i - 1]) - wrAt(Math.atan2(p[i - 1], p[i - 2])), r1 = Math.hypot(p[i], p[i + 1]) - wrAt(Math.atan2(p[i + 1], p[i]));
        if (r0 * r1 <= 0) { const th = Math.atan2(p[i + 1], p[i]); gates.push([th, (st.w / 2 + 8) / wrAt(th)]); }
      }
    }
    const isGate = (th, pad) => gates.some((g) => angDiff(th, g[0]) < g[1] + pad);
    const segs = [];
    let cur = [];
    for (let k = 0; k <= N; k++) {
      const th = k / N * Math.PI * 2;
      if (isGate(th, 0) || wet(wx[k], wy[k])) { if (cur.length >= 4) segs.push(cur); cur = []; continue; }
      cur.push(wx[k], wy[k]);
    }
    if (cur.length >= 4) segs.push(cur);
    // gate gaps are narrow: cut the polyline exactly at each gate
    const towers = [];
    if (style === 'stone' || style === 'heavy' || style === 'mud') {
      const stepL = style === 'heavy' ? 120 : 150;
      let accL = 0;
      for (let k = 1; k <= N; k++) {
        accL += Math.hypot(wx[k] - wx[k - 1], wy[k] - wy[k - 1]);
        if (accL < stepL) continue;
        accL = 0;
        const th = k / N * Math.PI * 2;
        if (isGate(th, 20 / wr[k]) || wet(wx[k], wy[k])) continue;
        towers.push(wx[k], wy[k]);
      }
    }
    if (style !== 'hedge') for (const g of gates) for (const sg of [-1, 1]) { const th = g[0] + sg * (g[1] + 8 / wrAt(g[0])), r = wrAt(th); towers.push(Math.cos(th) * r, Math.sin(th) * r); }
    wall = { style, segs, towers, gates };
  }
  // district names in cities and metropolises
  for (const d of districtsOf(s)) { if (d.a == null || d.name === 'Market Ward') continue; const r = fpTh(d.a) * d.r; labels.push({ x: Math.cos(d.a) * r, y: Math.sin(d.a) * r, t: d.name }); }
  // quarter labels
  for (const q of quarters) { const r = fpTh(q.a) * 0.68; labels.push({ x: Math.cos(q.a) * r, y: Math.sin(q.a) * r, t: q.C.adj + ' Quarter' }); }

  // ---- pack it up: world miles for everyone else, local feet for the painter
  const n = bx.length, X = new Float64Array(n), Y = new Float64Array(n), BW = new Float64Array(n), BD = new Float64Array(n);
  for (let i = 0; i < n; i++) { X[i] = s.x + bx[i] * FT; Y[i] = s.y + by[i] * FT; BW[i] = bw[i] * FT; BD[i] = bd[i] * FT; }
  const roadSty = C0.road || null;
  return {
    R: Rm, Rft: R, plazaR: plazaR * FT, plazaFt: plazaR, plazaShape, a0: M.a0, meta: M, arch, founder: M.founder,
    streets: streets.filter((x) => x.k !== 'road'), roofs: biomeRoofs, pals, well: tier <= 2 && plazaShape !== 'arena' && plazaShape !== 'glade' && arch !== 'green' && arch !== 'smial' || arch === 'oasis',
    n, bx: X, by: Y, bw: BW, bd: BD, ba: Float64Array.from(ba), bk: Uint8Array.from(bk), bp: Uint8Array.from(bp), bs: Uint8Array.from(bs),
    lx: Float32Array.from(bx), ly: Float32Array.from(by), lw: Float32Array.from(bw), ld: Float32Array.from(bd),
    trees: { x: Float32Array.from(tx), y: Float32Array.from(ty), r: Float32Array.from(tr), k: Uint8Array.from(tk) },
    fields: Float32Array.from(fq), fcol: Uint8Array.from(fcl), gardens: Float32Array.from(gq), gcol: Uint8Array.from(gc),
    greens, wall, labels, roadSty, hedgeLanes: C0 === CULTURES.Halfling, paved: tier >= 3, b: M.b
  };
}

// ================================================================ painting town plans
// Geometry is built once per plan in local feet, chunked so deep zooms only touch what is on screen,
// and whole plans are cached as images at power-of-two scales so panning costs one drawImage.
const TREE_TONES = [['#5b7d3d', '#7ea253'], ['#3d684c', '#5b8866'], ['#5c8737', '#8db159'], ['#6a8c43', '#93b25f'], ['#5f805e', '#9bb795']];
const FIELD_COLS = {
  temperate: ['#c8b46b', '#a3b263', '#8d7c57', '#b9be7c', '#86a052'],
  warm: ['#c9a85c', '#aaa258', '#9c7d51', '#d1b97a', '#9aa456'],
  cold: ['#8f9a66', '#7f8a5a', '#8a7a5c', '#a2a674', '#94a06a'],
  wet: ['#7fa45c', '#94b36b', '#71905c', '#a7b779', '#6e8d55']
};
const GARDEN_COLS = ['#6f8f45', '#8a7550', '#93a85a'];
function fieldCols(b) { return b === 10 || b === 11 || b === 8 ? FIELD_COLS.warm : b === 7 || b === 12 || b === 13 || b === 15 || b === 14 ? FIELD_COLS.cold : b === 9 ? FIELD_COLS.wet : FIELD_COLS.temperate; }
function pQuad(p, x, y, w, d, a, ox, oy) {
  const c = Math.cos(a), sn = Math.sin(a), ux = c * w / 2, uy = sn * w / 2, vx = -sn * d / 2, vy = c * d / 2;
  ox = ox || 0; oy = oy || 0;
  p.moveTo(x - ux - vx + ox, y - uy - vy + oy); p.lineTo(x + ux - vx + ox, y + uy - vy + oy); p.lineTo(x + ux + vx + ox, y + uy + vy + oy); p.lineTo(x - ux + vx + ox, y - uy + vy + oy); p.lineTo(x - ux - vx + ox, y - uy - vy + oy);
}
// a gabled roof: two halves split along the ridge, the half facing up-left catches the light
function pRoof(L, D, x, y, w, d, a) {
  const c = Math.cos(a), sn = Math.sin(a), hw = w / 2, hd = d / 2;
  const ux = c * hw, uy = sn * hw, vx = -sn * hd, vy = c * hd;
  let A, B;
  if (hw >= hd) { A = [x - ux - vx, y - uy - vy, x + ux - vx, y + uy - vy, x + ux, y + uy, x - ux, y - uy]; B = [x - ux, y - uy, x + ux, y + uy, x + ux + vx, y + uy + vy, x - ux + vx, y - uy + vy]; }
  else { A = [x - ux - vx, y - uy - vy, x - vx, y - vy, x + vx, y + vy, x - ux + vx, y - uy + vy]; B = [x - vx, y - vy, x + ux - vx, y + uy - vy, x + ux + vx, y + uy + vy, x + vx, y + vy]; }
  const ca = A[0] + A[1] + A[2] + A[3] + A[4] + A[5] + A[6] + A[7], cb = B[0] + B[1] + B[2] + B[3] + B[4] + B[5] + B[6] + B[7];
  const lit = ca < cb ? A : B, dark = ca < cb ? B : A;
  for (const [p, q] of [[L, lit], [D, dark]]) { p.moveTo(q[0], q[1]); p.lineTo(q[2], q[3]); p.lineTo(q[4], q[5]); p.lineTo(q[6], q[7]); }
}
function planGfx(P) {
  if (P.gfx) return P.gfx;
  const R = P.Rft, CH = Math.max(160, R / 3.2), chunks = new Map(), npal = P.pals.length;
  const chunkAt = (x, y) => {
    const i = Math.floor(x / CH), j = Math.floor(y / CH), k = i * 1000 + j;
    let c = chunks.get(k);
    if (!c) { c = { bb: [i * CH - 160, j * CH - 160, (i + 1) * CH + 160, (j + 1) * CH + 160], sh: new Path2D(), roofL: [], roofD: [], out: new Path2D(), stall: new Path2D(), tsh: new Path2D(), tA: [], tB: [], gard: [], has: {} }; for (let q = 0; q < npal; q++) { c.roofL.push(new Path2D()); c.roofD.push(new Path2D()); } for (let q = 0; q < TREE_TONES.length; q++) { c.tA.push(new Path2D()); c.tB.push(new Path2D()); } for (let q = 0; q < 3; q++) c.gard.push(new Path2D()); chunks.set(k, c); }
    return c;
  };
  const SH = 4;
  for (let i = 0; i < P.n; i++) {
    const x = P.lx[i], y = P.ly[i], w = P.lw[i], d = P.ld[i], a = P.ba[i], c = chunkAt(x, y), slot = Math.min(npal - 1, P.bp[i]);
    c.has.b = true;
    if (P.bk[i] === 3) { pQuad(c.stall, x, y, w, d, a); continue; }
    const shp = P.bs[i];
    if (shp === 1) {
      const r = w / 2;
      c.sh.moveTo(x + r + SH, y + SH); c.sh.arc(x + SH, y + SH, r, 0, Math.PI * 2);
      c.roofD[slot].moveTo(x + r, y); c.roofD[slot].arc(x, y, r, 0, Math.PI * 2);
      c.roofL[slot].moveTo(x + r * 0.7071, y - r * 0.7071); c.roofL[slot].arc(x, y, r, -Math.PI / 4, Math.PI * 0.75, true);
      c.out.moveTo(x + r, y); c.out.arc(x, y, r, 0, Math.PI * 2);
      c.roofD[slot].moveTo(x + r * 0.18, y); c.roofD[slot].arc(x, y, r * 0.18, 0, Math.PI * 2);
    } else if (shp === 2) {
      const S = w, dw = S * 0.3, cs = Math.cos(a), sn = Math.sin(a), off = (S - dw) / 2;
      pQuad(c.sh, x, y, S, S, a, SH, SH);
      pRoof(c.roofL[slot], c.roofD[slot], x - sn * -off, y + cs * -off, S, dw, a);
      pRoof(c.roofL[slot], c.roofD[slot], x - sn * off, y + cs * off, S, dw, a);
      pRoof(c.roofL[slot], c.roofD[slot], x + cs * off, y + sn * off, dw, S - dw * 2, a);
      pRoof(c.roofL[slot], c.roofD[slot], x - cs * off, y - sn * off, dw, S - dw * 2, a);
      pQuad(c.out, x, y, S, S, a); pQuad(c.out, x, y, S - dw * 2, S - dw * 2, a);
    } else {
      pQuad(c.sh, x, y, w, d, a, SH, SH);
      pRoof(c.roofL[slot], c.roofD[slot], x, y, w, d, a);
      pQuad(c.out, x, y, w, d, a);
    }
  }
  const t = P.trees;
  for (let i = 0; i < t.x.length; i++) {
    const x = t.x[i], y = t.y[i], r = t.r[i], k = t.k[i], c = chunkAt(x, y);
    c.has.t = true;
    c.tsh.moveTo(x + r + r * 0.3, y + r * 0.35); c.tsh.arc(x + r * 0.3, y + r * 0.35, r, 0, Math.PI * 2);
    c.tA[k].moveTo(x + r, y); c.tA[k].arc(x, y, r, 0, Math.PI * 2);
    c.tB[k].moveTo(x - r * 0.25 + r * 0.6, y - r * 0.28); c.tB[k].arc(x - r * 0.25, y - r * 0.28, r * 0.6, 0, Math.PI * 2);
  }
  const G = P.gardens;
  for (let i = 0; i < G.length; i += 8) {
    const c = chunkAt((G[i] + G[i + 4]) / 2, (G[i + 1] + G[i + 5]) / 2), p = c.gard[P.gcol[i / 8]];
    c.has.g = true;
    p.moveTo(G[i], G[i + 1]); p.lineTo(G[i + 2], G[i + 3]); p.lineTo(G[i + 4], G[i + 5]); p.lineTo(G[i + 6], G[i + 7]);
  }
  // whole-plan layers
  const fcols = fieldCols(P.b), fields = fcols.map(() => new Path2D()), fieldEdge = new Path2D();
  const F = P.fields;
  for (let i = 0; i < F.length; i += 8) {
    const p = fields[P.fcol[i / 8]];
    p.moveTo(F[i], F[i + 1]); p.lineTo(F[i + 2], F[i + 3]); p.lineTo(F[i + 4], F[i + 5]); p.lineTo(F[i + 6], F[i + 7]);
    fieldEdge.moveTo(F[i], F[i + 1]); fieldEdge.lineTo(F[i + 2], F[i + 3]); fieldEdge.lineTo(F[i + 4], F[i + 5]); fieldEdge.lineTo(F[i + 6], F[i + 7]); fieldEdge.lineTo(F[i], F[i + 1]);
  }
  const groups = new Map();
  for (const st of P.streets) {
    const key = st.k + '|' + st.w;
    let g = groups.get(key);
    if (!g) { g = { k: st.k, w: st.w, p: new Path2D() }; groups.set(key, g); }
    const q = st.pts;
    g.p.moveTo(q[0], q[1]);
    for (let i = 2; i < q.length; i += 2) g.p.lineTo(q[i], q[i + 1]);
  }
  const sg = [...groups.values()].sort((a, b) => (a.k === 'canal') - (b.k === 'canal') || a.w - b.w);
  let wallP = null, towersP = null;
  if (P.wall) {
    wallP = new Path2D();
    for (const sgm of P.wall.segs) { wallP.moveTo(sgm[0], sgm[1]); for (let i = 2; i < sgm.length; i += 2) wallP.lineTo(sgm[i], sgm[i + 1]); }
    towersP = new Path2D();
    const sq = P.wall.style === 'heavy' || P.wall.style === 'mud' || P.wall.style === 'palisade', tr = P.wall.style === 'heavy' ? 15 : P.wall.style === 'palisade' ? 9 : 13;
    const tw = P.wall.towers;
    for (let i = 0; i < tw.length; i += 2) { if (sq) pQuad(towersP, tw[i], tw[i + 1], tr * 2, tr * 2, Math.atan2(tw[i + 1], tw[i])); else { towersP.moveTo(tw[i] + tr, tw[i + 1]); towersP.arc(tw[i], tw[i + 1], tr, 0, Math.PI * 2); } }
  }
  P.gfx = { chunks: [...chunks.values()], fields, fcols, fieldEdge, sg, wallP, towersP, ext: R * 1.08 };
  return P.gfx;
}
const WALL_STY = {
  stone: ['rgba(40,36,30,0.7)', '#9d978a', 9, '#aaa395'],
  heavy: ['rgba(34,32,28,0.78)', '#8f8b82', 13, '#a09a8e'],
  mud: ['rgba(70,54,34,0.6)', '#b59c72', 9, '#c2aa80'],
  palisade: ['rgba(48,34,20,0.75)', '#7a5a3a', 6, '#8c6a46'],
  hedge: ['rgba(40,62,30,0.55)', '#5f8344', 8, null]
};
// g is already transformed so 1 unit = 1 foot; k = CSS pixels per foot; vb = visible box in feet (or null for all)
function paintPlan(g, P, k, vb) {
  const G = planGfx(P), px = 1 / k;
  const vis = (bb) => !vb || !(bb[2] < vb[0] || bb[0] > vb[2] || bb[3] < vb[1] || bb[1] > vb[3]);
  g.lineJoin = 'round'; g.lineCap = 'round';
  for (let i = 0; i < G.fields.length; i++) { g.fillStyle = G.fcols[i]; g.fill(G.fields[i]); }
  if (P.fields.length && k > 0.25) { g.strokeStyle = 'rgba(70,84,44,0.35)'; g.lineWidth = Math.max(px, 2); g.stroke(G.fieldEdge); }
  // squares and greens
  const pr = P.plazaFt;
  const paved = P.paved ? '#a8a294' : '#b29f7e';
  g.lineWidth = px;
  if (P.plazaShape === 'round') { g.fillStyle = paved; g.beginPath(); g.arc(0, 0, pr, 0, Math.PI * 2); g.fill(); g.strokeStyle = 'rgba(70,58,40,0.35)'; g.stroke(); }
  else if (P.plazaShape === 'square') { g.fillStyle = paved; const p = new Path2D(); pQuad(p, 0, 0, pr * 1.9, pr * 1.9, P.a0); g.fill(p); g.strokeStyle = 'rgba(70,58,40,0.35)'; g.stroke(p); }
  else if (P.plazaShape === 'arena') { g.fillStyle = '#b39a6c'; g.beginPath(); g.arc(0, 0, pr, 0, Math.PI * 2); g.fill(); g.strokeStyle = 'rgba(90,60,30,0.6)'; g.lineWidth = Math.max(px * 1.5, 4); g.stroke(); }
  else if (P.plazaShape === 'green') { g.fillStyle = '#97b06a'; g.beginPath(); g.arc(0, 0, pr, 0, Math.PI * 2); g.fill(); g.strokeStyle = 'rgba(70,58,40,0.3)'; g.stroke(); }
  else if (P.plazaShape === 'glade') { g.fillStyle = '#9db56e'; g.beginPath(); g.arc(0, 0, pr, 0, Math.PI * 2); g.fill(); }
  for (const gr of P.greens) { g.fillStyle = gr.c === 1 ? '#5a8aa0' : '#97b06a'; g.beginPath(); g.ellipse(gr.x, gr.y, gr.a, gr.b, gr.r, 0, Math.PI * 2); g.fill(); if (gr.c === 1) { g.strokeStyle = 'rgba(60,80,60,0.5)'; g.lineWidth = Math.max(px, 2); g.stroke(); } }
  // streets
  const rs = P.roadSty;
  for (const s of G.sg) {
    const w = Math.max(px, s.w);
    if (s.k === 'canal') { g.strokeStyle = '#8b8577'; g.lineWidth = w + Math.max(2 * px, 6); g.stroke(s.p); g.strokeStyle = '#4f7f92'; g.lineWidth = w; g.stroke(s.p); continue; }
    g.strokeStyle = rs ? rs[1] : 'rgba(86,68,44,0.4)'; g.lineWidth = w + Math.max(1.5 * px, w * (P.hedgeLanes ? 0.7 : 0.2)); g.stroke(s.p);
  }
  for (const s of G.sg) { if (s.k === 'canal') continue; g.strokeStyle = rs ? rs[0] : P.paved ? (s.k === 'lane' ? '#aca594' : '#a49d8e') : (s.k === 'lane' ? '#b8a27c' : '#b39c76'); g.lineWidth = Math.max(px, s.w); g.stroke(s.p); }
  if (P.well) { const r = Math.max(1.5 * px, 5 * (P.arch === 'oasis' ? 2.2 : 1)); g.fillStyle = '#4f7f92'; g.strokeStyle = '#5f594f'; g.lineWidth = Math.max(px, r * 0.4); g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill(); g.stroke(); }
  // buildings, gardens and trees by chunk
  const big = 30 * k > 5, shadow = 4 * k > 0.6;
  const list = G.chunks.filter((c) => vis(c.bb));
  for (const c of list) if (c.has.g) for (let q = 0; q < 3; q++) { g.fillStyle = GARDEN_COLS[q]; g.fill(c.gard[q]); }
  if (shadow) { g.fillStyle = 'rgba(20,18,10,0.28)'; for (const c of list) if (c.has.b) g.fill(c.sh); }
  for (let q = 0; q < P.pals.length; q++) {
    g.fillStyle = P.pals[q][0]; for (const c of list) if (c.has.b) g.fill(c.roofL[q]);
    g.fillStyle = P.pals[q][1]; for (const c of list) if (c.has.b) g.fill(c.roofD[q]);
  }
  g.fillStyle = '#c9a25a';
  for (const c of list) if (c.has.b) g.fill(c.stall);
  if (big) { g.strokeStyle = 'rgba(40,32,22,0.55)'; g.lineWidth = 0.8 * px; for (const c of list) if (c.has.b) { g.stroke(c.out); g.stroke(c.stall); } }
  if (shadow) { g.fillStyle = 'rgba(20,26,12,0.25)'; for (const c of list) if (c.has.t) g.fill(c.tsh); }
  for (let q = 0; q < TREE_TONES.length; q++) {
    g.fillStyle = TREE_TONES[q][0]; for (const c of list) if (c.has.t) g.fill(c.tA[q]);
    g.fillStyle = TREE_TONES[q][1]; for (const c of list) if (c.has.t) g.fill(c.tB[q]);
  }
  // walls
  if (G.wallP) {
    const S = WALL_STY[P.wall.style] || WALL_STY.stone, wpx = Math.max(1.6 * px, S[2]);
    g.strokeStyle = S[0]; g.lineWidth = wpx + 2 * px; g.stroke(G.wallP);
    g.strokeStyle = S[1]; g.lineWidth = wpx; g.stroke(G.wallP);
    if (P.wall.style === 'palisade') { g.setLineDash([3, 4]); g.strokeStyle = '#9b7a52'; g.lineWidth = wpx * 0.5; g.stroke(G.wallP); g.setLineDash([]); }
    if (S[3]) { g.fillStyle = S[3]; g.strokeStyle = S[0]; g.lineWidth = px; g.fill(G.towersP); g.stroke(G.towersP); }
  }
}

// --------------------------------------------------------------- per-frame drawing with image caches
const planRast = new Map();   // key -> { P, L, c, px, used }
let planRastPx = 0, planFrame = 0, lastViewKey = '', lastViewMove = 0;
const PLAN_RAST_MAX = 2048, PLAN_RAST_BUDGET = 36e6;
function rastFor(P, L, build) {
  const key = P.uid + '|' + L;
  let r = planRast.get(key);
  if (r && r.P === P) { r.used = planFrame; return r; }
  if (!build) return null;
  const k = L * FT, N = Math.ceil(P.gfx.ext * 2 * k) + 8;
  if (N > PLAN_RAST_MAX) return null;
  const c = mkCanvas(N, N), g = c.getContext('2d');
  g.setTransform(k, 0, 0, k, N / 2, N / 2);
  paintPlan(g, P, k / dpr, null);
  r = { P, L, c, px: N * N, used: planFrame, N };
  planRast.set(key, r);
  planRastPx += r.px;
  while (planRastPx > PLAN_RAST_BUDGET && planRast.size > 1) {
    let oldK = null, oldU = Infinity;
    for (const [kk, v] of planRast) if (v.used < oldU && v !== r) { oldU = v.used; oldK = kk; }
    if (oldK == null) break;
    planRastPx -= planRast.get(oldK).px; planRast.delete(oldK);
  }
  return r;
}
let planUid = 0;
const planQueue = [];
let planQueueBusy = false;
function pumpPlanQueue() {
  planQueueBusy = false;
  const t0 = performance.now();
  while (planQueue.length && performance.now() - t0 < 12) {
    const st = planQueue.shift();
    const c = planCache.get(st.id);
    if (c && c.key === planKey(st)) continue;
    planGfx(getPlan(st));
  }
  if (planQueue.length) { planQueueBusy = true; setTimeout(pumpPlanQueue, 16); }
}
function queuePlans(list) {
  for (const st of list) if (!planQueue.includes(st)) planQueue.push(st);
  if (planQueue.length > 24) planQueue.splice(0, planQueue.length - 24);
  if (!planQueueBusy && planQueue.length) { planQueueBusy = true; setTimeout(pumpPlanQueue, 30); }
}
function drawPlans(skip) {
  plansDrawn = new Set();
  planFrame++;
  const s = view.s;
  const vk = view.x.toFixed(6) + '|' + view.y.toFixed(6) + '|' + s.toFixed(4);
  const now = performance.now();
  if (vk !== lastViewKey) { lastViewKey = vk; lastViewMove = now; }
  const settled = now - lastViewMove > 140 && !anim;
  if (s < PLAN_S) {
    // getting close: build plans quietly in the background so the first close look does not stutter
    if (s > PLAN_S * 0.35) {
      const want = [];
      SGRID.query(VB[0] - 0.3, VB[1] - 0.3, VB[2] + 0.3, VB[3] + 0.3, (st) => { if (settleR(st) * PLAN_S >= 14) want.push(st); });
      want.sort((a, b) => Math.hypot(a.x - view.x, a.y - view.y) - Math.hypot(b.x - view.x, b.y - view.y));
      queuePlans(want.slice(0, 12).filter((st) => { const c = planCache.get(st.id); return !(c && c.key === planKey(st)); }));
    }
    return;
  }
  let budget = 2, rbudget = 1, missing = false;
  const list = [];
  SGRID.query(VB[0] - 0.5, VB[1] - 0.5, VB[2] + 0.5, VB[3] + 0.5, (st) => list.push(st));
  list.sort((a, b) => Math.hypot(a.x - view.x, a.y - view.y) - Math.hypot(b.x - view.x, b.y - view.y));
  for (const st of list) {
    const R = settleR(st);
    if (R * s < 14) continue;
    if (st.x + R * 1.1 < VB[0] || st.x - R * 1.1 > VB[2] || st.y + R * 1.1 < VB[1] || st.y - R * 1.1 > VB[3]) continue;
    if (drag && drag.kind === 'settle' && drag.id === st.id) continue;
    // the battle map already shows this town square by square
    if (skip) { plansDrawn.add(st.id); continue; }
    const c = planCache.get(st.id);
    if (!(c && c.key === planKey(st))) { if (budget <= 0) { missing = true; continue; } budget--; }
    const P = getPlan(st);
    if (!P.uid) P.uid = ++planUid;
    planGfx(P);
    const X = sx(st.x), Y = sy(st.y), k = s * FT;
    // the sharpest cached image at or above this zoom, else any cached image while moving, else draw directly
    let L = Math.pow(2, Math.ceil(Math.log2(s * dpr)));
    // on sharp screens a very large town drops to one level down (still at least screen resolution) to keep the image cacheable
    if (Math.ceil(P.gfx.ext * 2 * L * FT) + 8 > PLAN_RAST_MAX && L / 2 >= s * 0.99) L /= 2;
    let r = rastFor(P, L, false);
    const fits = Math.ceil(P.gfx.ext * 2 * L * FT) + 8 <= PLAN_RAST_MAX;
    if (!r && fits && (settled || !anyRast(P))) { if (rbudget > 0) { rbudget--; r = rastFor(P, L, true); } else missing = true; }
    if (!r && fits && !settled) missing = true;
    if (!r) { const alt = anyRast(P, s * dpr); if (alt && alt.L * 2.2 > s * dpr) { r = alt; missing = true; } }
    if (r) {
      const f = s / r.L, sz = r.N * f;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(r.c, X - sz / 2, Y - sz / 2, sz, sz);
    } else {
      ctx.save();
      ctx.transform(k, 0, 0, k, X, Y);
      const vb = [(-X) / k, (-Y) / k, (vw - X) / k, (vh - Y) / k];
      paintPlan(ctx, P, k, vb);
      ctx.restore();
    }
    plansDrawn.add(st.id);
    // quarter and landmark names at street zoom
    if (P.labels.length && s > PLAN_S * 1.4 && R * s > 160) {
      ctx.font = 'italic 600 ' + Math.round(clamp(R * s / 22, 11, 17)) + 'px ' + FONT_I;
      ctx.textAlign = 'center';
      for (const lb of P.labels) { const lx = X + lb.x * k, ly = Y + lb.y * k; if (lx > -80 && lx < vw + 80 && ly > -20 && ly < vh + 20) haloText(lb.t, lx, ly, '#3a2c18', 'rgba(244,236,214,0.85)', 3); }
    }
  }
  if (missing || (!settled && s >= PLAN_S)) setTimeout(requestRender, 160);
}
function anyRast(P, want) {
  let best = null;
  for (const v of planRast.values()) if (v.P === P && (!best || (want ? Math.abs(Math.log(v.L / want)) < Math.abs(Math.log(best.L / want)) : v.L > best.L))) best = v;
  if (best) best.used = planFrame;
  return best;
}

// --------------------------------------------------------------- the settlement panel: why it looks like this
function layoutHtml(s) {
  const M = planMeta(s), A = ARCH[M.arch], C = CULTURES[M.founder];
  const notes = [];
  if (M.founder !== 'Human') notes.push('Founded by ' + (M.founder === 'Half-orc' ? 'half-orcs' : M.founder === 'Dwarf' ? 'dwarves' : M.founder === 'Elf' ? 'elves' : M.founder === 'Half-elf' ? 'half-elves' : M.founder.toLowerCase() + 's') + ' (' + Math.round(M.share[M.founder] || 0) + '% of folk today), so the ' + C.adj.toLowerCase() + ' way of building shapes the whole place.');
  if (M.arch === 'seaward') notes.push('The sea is ' + fmtDist(M.seaD) + ' to the ' + compass8(M.seaA) + '.');
  else if (M.seaD < 5) notes.push('Faces the coast, ' + fmtDist(M.seaD) + ' to the ' + compass8(M.seaA) + '.');
  if (M.arch === 'hill' || M.arch === 'hold') notes.push('The ground rises to the ' + compass8(M.upA) + (M.mtnD < 6 ? ', toward mountains ' + fmtDist(M.mtnD) + ' away' : '') + '.');
  else if (M.hill) notes.push('Upland country: the ground climbs to the ' + compass8(M.upA) + '.');
  if (M.rivD < 3) notes.push('A river runs ' + fmtDist(M.rivD) + ' to the ' + compass8(M.rivA) + '.');
  if (M.exits.length) notes.push(M.exits.length === 1 ? 'One road leads in, from the ' + compass8(M.exits[0][0]) + '.' : M.exits.length + ' roads lead in.');
  if (M.wood > 0.5 && M.arch !== 'grove') notes.push('Woodland all round, so many trees were left standing.');
  if (M.b === 9 && M.arch !== 'canal') notes.push('Marshy ground: houses stand on raised plots.');
  if (isWalled(s, M)) { const w = M.arch === 'oasis' ? 'mud' : C.wall; notes.push(w === 'heavy' ? 'Ringed by thick stone walls with square towers.' : w === 'palisade' ? 'Ringed by a sharpened timber palisade.' : w === 'hedge' ? 'A thick hedge rather than a wall keeps the livestock in and strangers out.' : w === 'mud' ? 'Mud-brick walls follow the edge of the houses.' : 'Stone walls follow the edge of the houses, with gates where the roads come in.'); }
  const QF = { Human: 'timber-framed houses', Dwarf: 'square stone halls', Elf: 'round homes among trees', Halfling: 'round turf-roofed smials with gardens', Gnome: 'bright little houses and workshops', 'Half-orc': 'longhouses', Dragonborn: 'courtyard compounds', Tiefling: 'dark-roofed courtyard houses' };
  for (const x of M.quarters) notes.push('<b>' + CULTURES[x.race].adj + ' quarter</b> to the ' + compass8(x.a) + ': ' + QF[x.race] + ' (' + Math.round(x.pct) + '% of folk).');
  return '<section><h3>Layout</h3><p class="meta"><b>' + A.name + '</b> · ' + C.adj + ' style</p><p class="lay">' + esc(s.name) + ' ' + A.d + '</p>' +
    (notes.length ? '<ul class="laynotes">' + notes.map((n) => '<li>' + n + '</li>').join('') + '</ul>' : '') + '</section>';
}
