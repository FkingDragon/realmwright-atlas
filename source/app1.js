(() => {
'use strict';
const T = terrainLib();
const W = T.W, H = T.H, BB = T.B;
const FT = 1 / 5280;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtInt = (n) => Math.round(n).toLocaleString('en-GB');
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
function hashStr(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

// ---------------------------------------------------------------- reference data
const TIERS = {
  1: { name: 'Village', ppb: 6, plot: 70, lo: 60, hi: 900, round: 10, plaza: 40, streets: 2 },
  2: { name: 'Town', ppb: 7, plot: 46, lo: 1000, hi: 7500, round: 50, plaza: 70, streets: 5 },
  3: { name: 'City', ppb: 8, plot: 36, lo: 8000, hi: 24000, round: 100, plaza: 105, streets: 7 },
  4: { name: 'Capital', ppb: 9, plot: 34, lo: 25000, hi: 90000, round: 500, plaza: 140, streets: 9 }
};
const ROADTYPES = { 1: { name: 'Highway', ft: 24 }, 2: { name: 'Road', ft: 16 }, 3: { name: 'Trail', ft: 8 } };
const HAB = { 4: 0.7, 5: 1, 6: 0.75, 7: 0.45, 8: 0.45, 9: 0.3, 10: 0.2, 11: 0.6, 12: 0.15, 14: 0.12 };

const PRE = ['Ash', 'Bram', 'Cold', 'Dun', 'Elder', 'Fen', 'Gold', 'Hollow', 'Iron', 'Kings', 'Lark', 'Mill', 'North', 'Oak', 'Raven', 'Stone', 'Thorn', 'Wolf', 'Wyn', 'Black', 'Red', 'Silver', 'Ember', 'Frost', 'High', 'Low', 'Moss', 'Bright', 'Grim', 'Hart', 'Elm', 'Barrow', 'Crow', 'Dusk', 'Fair', 'Glen', 'Heron', 'Ivy', 'Marsh', 'Old', 'Pine', 'Rook', 'Salt', 'Tarn', 'Vale', 'West', 'Willow', 'Yew', 'Copper', 'Hearth',
  'Amber', 'Bell', 'Birch', 'Brook', 'Cinder', 'Clay', 'Deer', 'Dove', 'East', 'Fern', 'Fox', 'Grey', 'Haw', 'Hazel', 'Holly', 'Horn', 'Kettle', 'Lamb', 'Lynd', 'Maple', 'Mead', 'Nettle', 'Otter', 'Pebble', 'Quarry', 'Reed', 'Ridge', 'Rose', 'Rush', 'Sedge', 'Shep', 'Sorrow', 'South', 'Sparrow', 'Stag', 'Swan', 'Thistle', 'Wether', 'Whit', 'Wild', 'Wren', 'Brack', 'Cran', 'Hag', 'Ox', 'Pen', 'Ald', 'Bark', 'Coal', 'Gorse', 'Lea', 'Mar', 'Rye'];
const SUF = ['ford', 'wick', 'ton', 'bury', 'dale', 'holm', 'mere', 'stead', 'gate', 'march', 'fell', 'moor', 'crest', 'brook', 'hall', 'reach', 'watch', 'field', 'well', 'barrow', 'cliff', 'ley', 'thorpe', 'by', 'combe', 'hurst', 'wold', 'den', 'stow', 'garth',
  'worth', 'minster', 'ham', 'ing', 'leigh', 'ock', 'mead', 'wood', 'bridge', 'cross', 'end', 'hollow', 'shaw', 'water', 'beck', 'rigg', 'pool', 'acre', 'fold', 'hithe', 'burn', 'croft', 'ridge', 'thwaite'];
const SUF_COAST = ['port', 'haven', 'mouth', 'strand', 'bay', 'quay', 'sands', 'ness'];
const VIL1 = ['Aber', 'Bryn', 'Caer', 'Dol', 'Glyn', 'Llan', 'Pen', 'Tre', 'Kil', 'Dun', 'Inver', 'Ard', 'Bally', 'Car', 'Strath', 'Tor', 'Mal', 'Ros'];
const VIL2 = ['mor', 'wen', 'gant', 'dyr', 'rith', 'las', 'fach', 'owan', 'ochy', 'nish', 'raith', 'anan', 'evin', 'ellan', 'avon', 'ghal'];
const QUAL = ['Little ', 'Upper ', 'Nether ', 'Great ', 'Old ', 'East ', 'West ', 'North ', 'South ', 'Kings ', 'Long '];
const SYL1 = ['Al', 'Bel', 'Cor', 'Dra', 'Eth', 'Fal', 'Gal', 'Ith', 'Kal', 'Lor', 'Mor', 'Nor', 'Ost', 'Pel', 'Quel', 'Ras', 'Sel', 'Tor', 'Ul', 'Val', 'Wyr', 'Xan', 'Yor', 'Zan', 'Ar', 'Cael', 'Ves', 'Thal'];
const SYL2 = ['a', 'e', 'i', 'o', 'an', 'ar', 'en', 'is', 'or', 'ath', 'eth', 'ion', 'ia', 'ora', 'heim', 'dor', 'mir', 'goth', 'wen', 'ost', 'mund', 'ra', 'vel', 'thas'];
const SYL3 = ['', '', '', 'a', 'is', 'on', 'ar', 'ium', 'ell'];
const REALM_FORMS = ['Kingdom of %', 'Duchy of %', 'The % Marches', 'Free Cities of %', 'Principality of %', 'Theocracy of %', 'Grand Duchy of %', 'The % Protectorate', 'Earldom of %', 'The % League'];

// Shops per population, after S. John Ross, "Medieval Demographics Made Easy" (support values)
const TRADES = [['Shoemakers', 150], ['Furriers', 250], ['Tailors', 250], ['Barbers', 350], ['Jewellers', 400], ['Taverns', 400], ['Pastrycooks', 500], ['Masons', 500], ['Carpenters', 550], ['Weavers', 600], ['Chandlers', 700], ['Mercers', 700], ['Coopers', 700], ['Bakers', 800], ['Water-carriers', 850], ['Scabbard makers', 850], ['Wine-sellers', 900], ['Hatmakers', 950], ['Saddlers', 1000], ['Butchers', 1200], ['Fishmongers', 1200], ['Beer-sellers', 1400], ['Spice merchants', 1400], ['Blacksmiths', 1500], ['Painters', 1500], ['Physicians', 1700], ['Roofers', 1800], ['Locksmiths', 1900], ['Bathhouses', 1900], ['Ropemakers', 1900], ['Inns', 2000], ['Tanners', 2000], ['Copyists', 2000], ['Sculptors', 2000], ['Harness makers', 2000], ['Cutlers', 2300], ['Glovemakers', 2400], ['Woodcarvers', 2400], ['Magic shops', 2800], ['Bookbinders', 3000], ['Illuminators', 3900], ['Booksellers', 6300]];
const EXPORTS = {
  4: ['Fish', 'Salt', 'Shells & pearls'], 5: ['Grain', 'Wool', 'Horses', 'Cattle'], 6: ['Timber', 'Furs', 'Game', 'Charcoal'], 7: ['Furs', 'Timber', 'Amber'],
  8: ['Spices', 'Dyes', 'Exotic hides', 'Hardwoods'], 9: ['Peat', 'Reeds', 'Alchemical herbs', 'Eels'], 10: ['Glass', 'Salt', 'Spices', 'Camels'],
  11: ['Goats', 'Olive oil', 'Hides'], 12: ['Furs', 'Whale oil', 'Ivory'], 13: ['Furs', 'Ivory'], 14: ['Iron', 'Silver', 'Stone', 'Gems'], 15: ['Ice', 'Rare ores']
};
const COAST_EXPORT = ['Fish', 'Salt'];
const RACES = ['Human', 'Halfling', 'Dwarf', 'Elf', 'Gnome', 'Half-elf', 'Half-orc', 'Dragonborn', 'Tiefling'];
const RACE_BASE = [60, 8, 6, 6, 4, 6, 4, 3, 3];
const RACE_BOOST = { 14: { 2: 25, 4: 6 }, 15: { 2: 25, 4: 6 }, 6: { 3: 15, 5: 5 }, 7: { 3: 10, 6: 4 }, 8: { 3: 12, 7: 4 }, 5: { 1: 10 }, 12: { 2: 8, 6: 6 }, 13: { 2: 8, 6: 6 }, 10: { 7: 8, 8: 5 }, 11: { 7: 4, 8: 4, 6: 3 }, 9: { 6: 6, 4: 3 }, 4: { 1: 3 } };
// SRD 5.1 creatures by habitat: [name, CR]
const FAUNA = {
  5: [['Elk', '1/4'], ['Wolf', '1/4'], ['Bandit', '1/8'], ['Gnoll', '1/2'], ['Lion', '1'], ['Ankheg', '2'], ['Griffon', '2'], ['Centaur', '2'], ['Bulette', '5'], ['Hill Giant', '5']],
  6: [['Deer', '0'], ['Boar', '1/4'], ['Wolf', '1/4'], ['Goblin', '1/4'], ['Pixie', '1/4'], ['Dire Wolf', '1'], ['Brown Bear', '1'], ['Giant Spider', '1'], ['Dryad', '1'], ['Owlbear', '3'], ['Werewolf', '3'], ['Green Hag', '3']],
  7: [['Elk', '1/4'], ['Giant Owl', '1/4'], ['Black Bear', '1/2'], ['Dire Wolf', '1'], ['Winter Wolf', '3'], ['Ettin', '4'], ['Werebear', '5']],
  8: [['Panther', '1/4'], ['Ape', '1/2'], ['Lizardfolk', '1/2'], ['Giant Wasp', '1/2'], ['Tiger', '1'], ['Giant Constrictor Snake', '2'], ['Allosaurus', '2'], ['Couatl', '4'], ['Triceratops', '5']],
  9: [['Giant Frog', '1/4'], ['Crocodile', '1/2'], ['Lizardfolk', '1/2'], ['Swarm of Insects', '1/2'], ["Will-o'-Wisp", '2'], ['Green Hag', '3'], ['Shambling Mound', '5'], ['Hydra', '8']],
  10: [['Jackal', '0'], ['Camel', '1/8'], ['Giant Lizard', '1/4'], ['Dust Mephit', '1/2'], ['Gnoll', '1/2'], ['Giant Scorpion', '3'], ['Mummy', '3'], ['Lamia', '4'], ['Purple Worm', '15']],
  11: [['Hyena', '0'], ['Jackal', '0'], ['Gnoll', '1/2'], ['Giant Vulture', '1'], ['Bandit Captain', '2'], ['Ankheg', '2'], ['Manticore', '3'], ['Chimera', '6']],
  12: [['Polar Bear', '2'], ['Ice Mephit', '1/2'], ['Winter Wolf', '3'], ['Yeti', '3'], ['Mammoth', '6'], ['Frost Giant', '8'], ['Remorhaz', '11']],
  14: [['Eagle', '0'], ['Giant Goat', '1/2'], ['Orc', '1/2'], ['Hippogriff', '1'], ['Griffon', '2'], ['Troll', '5'], ['Wyvern', '6'], ['Stone Giant', '7'], ['Roc', '11']],
  4: [['Giant Crab', '1/8'], ['Merfolk', '1/8'], ['Sahuagin', '1/2'], ['Reef Shark', '1/2'], ['Harpy', '1'], ['Sea Hag', '2'], ['Plesiosaurus', '2']]
};
FAUNA[13] = FAUNA[12]; FAUNA[15] = FAUNA[14];
const crNum = (c) => (c.includes('/') ? 1 / +c.split('/')[1] : +c);

// ---------------------------------------------------------------- state
const STORE_KEY = 'atlas-world-v1';
let SEED = 1847;
let WORLD_NAME = '';
let BASE = { settle: [], roads: [] };
const blankEdits = () => ({ ov: {}, del: {}, add: [], rdel: {}, rov: {}, radd: [], strokes: [], labels: [], events: [], evOff: {}, npc: {}, npcRel: [], npcAdd: [], npcMore: {}, guild: { party: { name: '', members: [], gold: 0, log: [] }, q: {}, rep: {}, shift: {}, ag: {}, custom: [] }, monAdd: [], monOff: {}, bm: {}, next: 1 });
let edits = blankEdits();
let history = [], future = [];
let panelMin = false;
const layers = { borders: true, labels: true, grid: true, roads: true, events: true, people: true, monsters: true };

// derived
let SET = [], SBY = new Map(), ROADS = [], RBY = new Map(), CAPS = [], CAPLIST = [], REALMS = [], STROKES = [];
let roadsVer = 0, strokesVer = 0;

// ---------------------------------------------------------------- spatial grid
class Grid {
  constructor(cell) { this.cell = cell; this.m = new Map(); }
  k(i, j) { return i * 65536 + j; }
  add(item, x0, y0, x1, y1) {
    const c = this.cell;
    const i0 = Math.floor(x0 / c), i1 = Math.floor(x1 / c), j0 = Math.floor(y0 / c), j1 = Math.floor(y1 / c);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const key = this.k(i, j); let a = this.m.get(key); if (!a) { a = []; this.m.set(key, a); } a.push(item);
    }
  }
  query(x0, y0, x1, y1, cb) {
    const c = this.cell;
    const i0 = Math.floor(x0 / c), i1 = Math.floor(x1 / c), j0 = Math.floor(y0 / c), j1 = Math.floor(y1 / c);
    if ((i1 - i0 + 1) * (j1 - j0 + 1) > this.m.size * 2) { for (const a of this.m.values()) for (const it of a) cb(it); return; }
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const a = this.m.get(this.k(i, j)); if (a) for (const it of a) cb(it); }
  }
}
let SGRID = new Grid(32), RGRID = new Grid(24);
let QSTAMP = 1;

// ---------------------------------------------------------------- names
function nameGen(rng, tier, coastal, used) {
  const pick = (a) => a[Math.floor(rng() * a.length)];
  let n = '';
  for (let tries = 0; tries < 14; tries++) {
    const r = rng();
    if (tier === 4 || (tier === 3 && r < 0.35)) n = pick(SYL1) + pick(SYL2) + pick(SYL3);
    else if (tier <= 2 && r < 0.18) n = pick(VIL1) + pick(VIL2);
    else n = pick(PRE) + (coastal && rng() < 0.35 ? pick(SUF_COAST) : pick(SUF));
    if (!used || !used.has(n)) { if (used) used.add(n); return n; }
  }
  if (tier <= 2) {
    for (let k = 0; k < 6; k++) { const q = pick(QUAL) + n; if (!used.has(q)) { used.add(q); return q; } }
  }
  return n;
}
function realmNameFor(capName, rng) { return REALM_FORMS[Math.floor(rng() * REALM_FORMS.length)].replace('%', capName); }
function worldNameFor(seed) {
  const r = T.mulberry(seed * 13 + 5);
  const a = ['Shattered', 'Sundered', 'Ember', 'Gilded', 'Hollow', 'Verdant', 'Ashen', 'Tidebound', 'Starfall', 'Iron', 'Silent', 'Wyrmscar'];
  const b = ['Reach', 'Expanse', 'Realms', 'Isles', 'Marches', 'Dominion', 'Wilds', 'Crown', 'Lands', 'Continent'];
  return 'The ' + a[Math.floor(r() * a.length)] + ' ' + b[Math.floor(r() * b.length)];
}

// ---------------------------------------------------------------- site evaluation
const EVAL_OCT = 8;
function siteInfo(x, y) {
  if (x < 30 || y < 30 || x > W - 30 || y > H - 30) return null;
  const o = T.natural(x, y, EVAL_OCT, 1);
  const b = o.b, e = o.e, rdist = o.hw > 0 ? o.rd * o.hw : 99, t = o.t;
  if (b === BB.RIVER) return null;
  const base = HAB[b];
  if (!base) return null;
  let sc = base;
  if (rdist < 4) sc += 0.45 * (1 - rdist / 4);
  sc -= Math.max(0, e - 0.3) * 1.5;
  return { x, y, b, e, t, sc, river: rdist < 2 };
}
function isCoastal(x, y) {
  for (let k = 0; k < 6; k++) {
    const a = k * Math.PI / 3;
    const o = T.natural(x + Math.cos(a) * 5, y + Math.sin(a) * 5, EVAL_OCT, 1);
    if (o.b <= 2) return true;
  }
  return false;
}
function landAtBattle(x, y) { return !T.isWater(T.biomeAt(x, y, 17, null)); }

function popFor(tier, u, sc) {
  const c = TIERS[tier];
  const v = c.lo * Math.pow(c.hi / c.lo, Math.pow(u, 1.7) * clamp(0.75 + sc * 0.25, 0.6, 1));
  return Math.max(c.lo, Math.round(v / c.round) * c.round);
}
function settleR(s) {
  const c = TIERS[s.tier];
  const n = Math.max(4, Math.ceil(s.pop / c.ppb));
  return (Math.sqrt(n * c.plot * c.plot / Math.PI) * 1.2 + c.plaza) * FT;
}

// ---------------------------------------------------------------- world generation
function generateWorld(seed) {
  T.setSeed(seed);
  const rng = T.mulberry(seed * 7 + 3);
  const used = new Set();
  const nodes = [];
  const grid = new Grid(40);
  const layersDef = [
    { tier: 3, cell: 200, need: 0.72, prob: 0.85, minSame: 110, minUp: 0 },
    { tier: 2, cell: 64, need: 0.55, prob: 0.72, minSame: 30, minUp: 40 },
    { tier: 1, cell: 20, need: 0.36, prob: 0.92, minSame: 8, minUp: 9 }
  ];
  for (const L of layersDef) {
    const nx = Math.ceil(W / L.cell), ny = Math.ceil(H / L.cell);
    const salt = L.tier * 1000;
    for (let cy = 0; cy < ny; cy++) for (let cx = 0; cx < nx; cx++) {
      let best = null;
      for (let k = 0; k < 3; k++) {
        const x = (cx + 0.1 + 0.8 * T.hash(cx, cy, salt + k * 2)) * L.cell;
        const y = (cy + 0.1 + 0.8 * T.hash(cx, cy, salt + k * 2 + 1)) * L.cell;
        const si = siteInfo(x, y);
        if (si && (!best || si.sc > best.sc)) best = si;
      }
      if (!best || best.sc < L.need * 0.8) continue;
      const coastal = isCoastal(best.x, best.y);
      if (coastal) best.sc += 0.35;
      if (best.sc < L.need) continue;
      const pr = L.tier === 1 ? Math.min(1, best.sc) * L.prob : L.prob;
      if (T.hash(cx, cy, salt + 99) > pr) continue;
      // spacing
      let ok = true;
      const R = Math.max(L.minSame, L.minUp);
      grid.query(best.x - R, best.y - R, best.x + R, best.y + R, (n) => {
        if (!ok) return;
        const d = Math.hypot(n.x - best.x, n.y - best.y);
        if ((n.tier === L.tier && d < L.minSame) || (n.tier > L.tier && d < L.minUp)) ok = false;
      });
      if (!ok) continue;
      // make sure the centre is dry ground at street scale
      let fx = best.x, fy = best.y, dry = landAtBattle(fx, fy);
      for (let k = 0; k < 8 && !dry; k++) { const a = k * Math.PI / 4; fx = best.x + Math.cos(a) * 0.15; fy = best.y + Math.sin(a) * 0.15; dry = landAtBattle(fx, fy); }
      if (!dry) continue;
      const id = 's' + L.tier + '_' + cx + '_' + cy;
      const u = T.hash(cx, cy, salt + 7);
      const node = { id, x: fx, y: fy, tier: L.tier, pop: popFor(L.tier, u, best.sc), name: '', b: best.b, coastal, sc: best.sc, gen: true };
      node.name = nameGen(T.mulberry(hashStr(id) ^ seed), L.tier, coastal, used);
      nodes.push(node);
      grid.add(node, fx, fy, fx, fy);
    }
  }
  // capitals: the best-placed cities, kept apart
  const cities = nodes.filter((n) => n.tier === 3).sort((a, b) => (b.sc + T.hash(hashStr(b.id), 1, 3) * 0.4) - (a.sc + T.hash(hashStr(a.id), 1, 3) * 0.4));
  const caps = [];
  for (const c of cities) {
    if (caps.length >= 14) break;
    if (caps.every((k) => Math.hypot(k.x - c.x, k.y - c.y) > 640)) caps.push(c);
  }
  for (const c of caps) {
    c.tier = 4;
    const r = T.mulberry(hashStr(c.id) ^ (seed * 3));
    c.pop = popFor(4, r(), c.sc);
    if (!/^[A-Z][a-z]+$/.test(c.name) || c.name.length > 11) { used.delete(c.name); c.name = nameGen(r, 4, c.coastal, used); }
    c.realm = realmNameFor(c.name, r);
  }
  const roads = buildRoads(nodes);
  return { settle: nodes, roads };
}

function landPath(a, b, strict) {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const steps = Math.max(4, Math.ceil(len / 2.5));
  let consec = 0, water = 0, high = 0;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const o = T.natural(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, EVAL_OCT, 1);
    if (o.b <= 3) { consec++; water++; if (consec > 2) return false; } else consec = 0;
    if (o.b === BB.PEAK || o.b === BB.MOUNTAIN) high++;
  }
  if (water / steps > 0.12) return false;
  if (strict && high / steps > 0.35) return false;
  return true;
}

function buildRoads(nodes) {
  nodes.forEach((n, i) => { n._i = i; });
  const roads = [], seen = new Set();
  function layer(list, range, type) {
    const g = new Grid(range);
    for (const n of list) g.add(n, n.x, n.y, n.x, n.y);
    const cands = new Map();
    for (const a of list) {
      const arr = [];
      g.query(a.x - range, a.y - range, a.x + range, a.y + range, (b) => {
        if (b === a) return;
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        if (d <= range) arr.push([d, b]);
      });
      arr.sort((p, q) => p[0] - q[0]);
      cands.set(a, arr.slice(0, 8).map((p) => p[1]));
    }
    for (const a of list) {
      for (const b of cands.get(a)) {
        const key = a._i < b._i ? a._i + ':' + b._i : b._i + ':' + a._i;
        if (seen.has(key)) continue;
        seen.add(key);
        const dab = Math.hypot(b.x - a.x, b.y - a.y);
        let ok = true;
        for (const c of cands.get(a).concat(cands.get(b))) {
          if (c === a || c === b) continue;
          if (Math.hypot(c.x - a.x, c.y - a.y) < dab && Math.hypot(c.x - b.x, c.y - b.y) < dab) { ok = false; break; }
        }
        if (!ok || !landPath(a, b, type === 3)) continue;
        const ids = a.id < b.id ? [a.id, b.id] : [b.id, a.id];
        roads.push({ id: 'r' + ids[0] + '~' + ids[1], a: ids[0], b: ids[1], type, gen: true });
      }
    }
  }
  layer(nodes.filter((n) => n.tier >= 3), 650, 1);
  layer(nodes.filter((n) => n.tier >= 2), 180, 2);
  layer(nodes, 48, 3);
  return roads;
}

// ---------------------------------------------------------------- derived state from edits
function applyEdits() {
  SET = []; SBY = new Map();
  for (const s of BASE.settle) {
    if (edits.del[s.id]) continue;
    const o = edits.ov[s.id], b = settleWithSnap(s);
    const obj = o ? Object.assign({}, b, o) : b;
    SET.push(obj); SBY.set(obj.id, obj);
  }
  // places the campaign uses that a newer generator no longer makes (app23)
  for (const s of lostSettlements()) { const o = edits.ov[s.id]; const obj = o ? Object.assign(s, o) : s; SET.push(obj); SBY.set(obj.id, obj); }
  for (const s of edits.add) { SET.push(s); SBY.set(s.id, s); }
  ROADS = []; RBY = new Map();
  for (const r of BASE.roads) {
    if (edits.rdel[r.id] || !SBY.has(r.a) || !SBY.has(r.b)) continue;
    const ov = edits.rov[r.id];
    const obj = ov ? Object.assign({}, r, ov) : r;
    ROADS.push(obj); RBY.set(obj.id, obj);
  }
  for (const r of lostRoads()) { if (!SBY.has(r.a) || !SBY.has(r.b)) continue; const obj = Object.assign(r, edits.rov[r.id]); ROADS.push(obj); RBY.set(obj.id, obj); }
  for (const r of edits.radd) { ROADS.push(r); RBY.set(r.id, r); }
  // capitals & realms
  CAPLIST = SET.filter((s) => s.tier === 4).sort((a, b) => (a.id < b.id ? -1 : 1));
  CAPS = [];
  for (const c of CAPLIST) CAPS.push(c.x, c.y);
  // strokes with bounding boxes
  STROKES = edits.strokes.map((st) => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < st.pts.length; i += 2) { x0 = Math.min(x0, st.pts[i]); x1 = Math.max(x1, st.pts[i]); y0 = Math.min(y0, st.pts[i + 1]); y1 = Math.max(y1, st.pts[i + 1]); }
    return { b: st.b, r: st.r, pts: st.pts, bb: [x0 - st.r, y0 - st.r, x1 + st.r, y1 + st.r] };
  });
  // indices
  SGRID = new Grid(32);
  for (const s of SET) SGRID.add(s, s.x, s.y, s.x, s.y);
  RGRID = new Grid(24);
  for (const r of ROADS) { r._bb = roadBBox(r); RGRID.add(r, r._bb[0], r._bb[1], r._bb[2], r._bb[3]); }
  computeRealms();
}

function computeRealms() {
  REALMS = CAPLIST.map((c) => ({ cap: c, name: c.realm || ('Realm of ' + c.name), sx: 0, sy: 0, n: 0, cx: c.x, cy: c.y }));
  if (!REALMS.length) return;
  for (const s of SET) {
    if (s.tier < 2) continue;
    const r = T.realmAt(s.x, s.y, CAPS);
    const R = REALMS[r.i];
    if (R) { R.sx += s.x; R.sy += s.y; R.n++; }
  }
  for (const R of REALMS) if (R.n > 2) { R.cx = (R.sx + R.cap.x * 2) / (R.n + 2); R.cy = (R.sy + R.cap.y * 2) / (R.n + 2); }
}
function realmOf(x, y) { if (!CAPS.length) return null; const r = T.realmAt(x, y, CAPS); return REALMS[r.i] || null; }

// ---------------------------------------------------------------- road geometry
const geomCache = new Map();
function chaikin(p, it) {
  let a = p;
  for (let k = 0; k < it; k++) {
    if (a.length < 6) break;
    const b = [a[0], a[1]];
    for (let i = 0; i + 3 < a.length; i += 2) {
      const x0 = a[i], y0 = a[i + 1], x1 = a[i + 2], y1 = a[i + 3];
      b.push(0.75 * x0 + 0.25 * x1, 0.75 * y0 + 0.25 * y1, 0.25 * x0 + 0.75 * x1, 0.25 * y0 + 0.75 * y1);
    }
    b.push(a[a.length - 2], a[a.length - 1]);
    a = b;
  }
  return Float64Array.from(a);
}
// the control line of a generated road, before smoothing
function roadRaw(r) {
  const A = SBY.get(r.a), B = SBY.get(r.b);
  const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy) || 1e-9;
  const nx = -dy / len, ny = dx / len;
  const n = Math.max(2, Math.min(64, Math.round(len / (r.type === 1 ? 8 : r.type === 2 ? 3 : 1.2))));
  const h = hashStr(r.id), o1 = (h % 997) * 1.37 + 3, o2 = ((h >>> 10) % 991) * 0.91 + 7;
  const raw = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, env = Math.sin(Math.PI * t);
    const d = len * 0.075 * env * (T.noise2(o1 + t * len / 60, o2) * 0.75 + T.noise2(o2 + t * len / 12, o1) * 0.25);
    raw.push(A.x + dx * t + nx * d, A.y + dy * t + ny * d);
  }
  return raw;
}
function roadGeom(r) {
  const c = geomCache.get(r.id);
  if (r.pts) {
    // a reshaped generated road keeps its ends on its towns, wherever they move
    const A = r.a ? SBY.get(r.a) : null, B = r.b ? SBY.get(r.b) : null;
    const key = A && B ? A.x + ',' + A.y + ',' + B.x + ',' + B.y : '';
    if (c && c.src === r.pts && c.key === key) return c.pts;
    let src = r.pts;
    if (A && B) { src = Array.from(r.pts); src[0] = A.x; src[1] = A.y; src[src.length - 2] = B.x; src[src.length - 1] = B.y; }
    const pts = chaikin(src, 3);
    geomCache.set(r.id, { src: r.pts, key, pts });
    return pts;
  }
  const A = SBY.get(r.a), B = SBY.get(r.b);
  const key = A.x + ',' + A.y + ',' + B.x + ',' + B.y;
  if (c && c.key === key && !c.src) return c.pts;
  const pts = chaikin(roadRaw(r), 3);
  geomCache.set(r.id, { key, pts });
  return pts;
}
function roadBBox(r) {
  if (r.pts) {
    const g = roadGeom(r);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < g.length; i += 2) { x0 = Math.min(x0, g[i]); x1 = Math.max(x1, g[i]); y0 = Math.min(y0, g[i + 1]); y1 = Math.max(y1, g[i + 1]); }
    return [x0, y0, x1, y1];
  }
  const A = SBY.get(r.a), B = SBY.get(r.b);
  const pad = Math.hypot(B.x - A.x, B.y - A.y) * 0.09 + 0.05;
  return [Math.min(A.x, B.x) - pad, Math.min(A.y, B.y) - pad, Math.max(A.x, B.x) + pad, Math.max(A.y, B.y) + pad];
}
function polyLen(p) { let L = 0; for (let i = 2; i < p.length; i += 2) L += Math.hypot(p[i] - p[i - 2], p[i + 1] - p[i - 1]); return L; }
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
  let t = l2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const qx = ax + dx * t - px, qy = ay + dy * t - py;
  return Math.sqrt(qx * qx + qy * qy);
}
function nearRoad(x, y, pad) {
  let hit = false;
  const st = ++QSTAMP;
  RGRID.query(x, y, x, y, (r) => {
    if (hit || r._q === st) return;
    r._q = st;
    const hw = ROADTYPES[r.type].ft * FT * 0.5 + pad;
    const bb = r._bb;
    if (x < bb[0] - hw || x > bb[2] + hw || y < bb[1] - hw || y > bb[3] + hw) return;
    const p = roadGeom(r);
    for (let i = 2; i < p.length; i += 2) {
      const ax = p[i - 2], ay = p[i - 1], bx = p[i], by = p[i + 1];
      if ((ax < x - hw && bx < x - hw) || (ax > x + hw && bx > x + hw) || (ay < y - hw && by < y - hw) || (ay > y + hw && by > y + hw)) continue;
      if (segDist(x, y, ax, ay, bx, by) < hw) { hit = true; return; }
    }
  });
  return hit;
}
function inSettlement(x, y, f) {
  let hit = false;
  SGRID.query(x - 0.6, y - 0.6, x + 0.6, y + 0.6, (s) => {
    if (hit) return;
    const R = settleR(s) * f;
    const dx = s.x - x, dy = s.y - y;
    if (dx * dx + dy * dy < R * R) hit = true;
  });
  return hit;
}
function circlesIn(x0, y0, x1, y1) {
  const out = [];
  for (const st of STROKES) {
    const bb = st.bb;
    if (bb[2] < x0 || bb[0] > x1 || bb[3] < y0 || bb[1] > y1) continue;
    for (let i = 0; i < st.pts.length; i += 2) {
      const x = st.pts[i], y = st.pts[i + 1];
      if (x + st.r < x0 || x - st.r > x1 || y + st.r < y0 || y - st.r > y1) continue;
      out.push(x, y, st.r, st.b);
    }
  }
  return new Float64Array(out);
}
