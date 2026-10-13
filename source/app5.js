
// ================================================================ live market & world events
const MONTHS = ['Deepwinter', 'Thawmoon', 'Seedtime', 'Rainmoon', 'Blossom', 'Highsun', 'Midsummer', 'Haymoon', 'Harvestmoon', 'Leaffall', 'Frostfall', 'Longnight'];
const YEAR0 = 1042;
const market = { day: 240, playing: false, speed: 1500, tab: 'overview', sid: null, form: { type: 'bandits', sev: 'serious', dur: '' } };
let marketTimer = 0;
function dateParts(d) { const r = ((d % 360) + 360) % 360; return { y: YEAR0 + Math.floor(d / 360), m: Math.floor(r / 30), dd: r % 30 + 1 }; }
function dateText(d) { const p = dateParts(d); return p.dd + ' ' + MONTHS[p.m] + ', ' + p.y; }
function shortDate(d) { const p = dateParts(d); return p.dd + ' ' + MONTHS[p.m].slice(0, 3); }

// ---------------------------------------------------------------- goods (Player's Handbook / SRD 5.1 prices in gp)
const CATS = [
  { id: 'food', name: 'Food, drink & lodging', col: '#3987e5' },
  { id: 'stock', name: 'Livestock, mounts & tack', col: '#d95926' },
  { id: 'arms', name: 'Arms & armour', col: '#199e70' },
  { id: 'trade', name: 'Trade goods & gear', col: '#c98500' },
  { id: 'magic', name: 'Magic items', col: '#d55181' }
];
const GOODS = [
  ['Bread, loaf', 0.02, 'food', 'food grain'], ['Cheese, hunk', 0.1, 'food', 'food'], ['Meat, chunk', 0.3, 'food', 'food meat'],
  ['Ale, mug', 0.04, 'food', 'drink'], ['Ale, gallon', 0.2, 'food', 'drink'], ['Wine, common (pitcher)', 0.2, 'food', 'drink wine'],
  ['Wine, fine (bottle)', 10, 'food', 'drink wine luxury', 2], ['Rations (1 day)', 0.5, 'food', 'food travel'], ['Meal, modest', 0.3, 'food', 'food meal'],
  ['Inn stay, modest (night)', 0.5, 'food', 'lodging'], ['Inn stay, comfortable (night)', 0.8, 'food', 'lodging', 2],
  ['Wheat (1 lb)', 0.01, 'food', 'grain'], ['Flour (1 lb)', 0.02, 'food', 'grain'], ['Salt (1 lb)', 0.05, 'food', 'salt trade'],
  ['Chicken', 0.02, 'stock', 'livestock'], ['Goat', 1, 'stock', 'livestock'], ['Sheep', 2, 'stock', 'livestock wool'], ['Pig', 3, 'stock', 'livestock'],
  ['Cow', 10, 'stock', 'livestock cattle'], ['Ox', 15, 'stock', 'livestock cattle draft'], ['Mule', 8, 'stock', 'mount draft'], ['Pony', 30, 'stock', 'mount'],
  ['Draft horse', 50, 'stock', 'mount horse draft'], ['Riding horse', 75, 'stock', 'mount horse'], ['Warhorse', 400, 'stock', 'mount horse war', 2],
  ['Camel', 50, 'stock', 'mount camel'], ['Mastiff', 25, 'stock', 'mount'], ['Elephant', 200, 'stock', 'mount exotic', 3], ['Feed (per day)', 0.05, 'stock', 'feed grain'],
  ['Saddle, riding', 10, 'stock', 'tack crafted'], ['Cart', 15, 'stock', 'vehicle timber'], ['Wagon', 35, 'stock', 'vehicle timber', 2],
  ['Dagger', 2, 'arms', 'weapon crafted'], ['Shortsword', 10, 'arms', 'weapon crafted'], ['Longsword', 15, 'arms', 'weapon crafted', 2], ['Greataxe', 30, 'arms', 'weapon crafted', 2],
  ['Longbow', 50, 'arms', 'weapon bow', 2], ['Crossbow, light', 25, 'arms', 'weapon crafted', 2], ['Arrows (20)', 1, 'arms', 'weapon ammo'], ['Shield', 10, 'arms', 'armor crafted'],
  ['Leather armour', 10, 'arms', 'armor hide'], ['Chain shirt', 50, 'arms', 'armor crafted', 2], ['Chain mail', 75, 'arms', 'armor crafted', 2], ['Plate armour', 1500, 'arms', 'armor crafted', 3],
  ['Torch', 0.01, 'trade', 'gear'], ['Rope, hempen (50 ft)', 1, 'trade', 'gear'], ['Oil (flask)', 0.1, 'trade', 'gear'], ["Healer's kit", 5, 'trade', 'healing gear'],
  ['Antitoxin (vial)', 50, 'trade', 'healing alchemy', 2], ['Tent, two-person', 2, 'trade', 'gear cloth'], ['Iron (1 lb)', 0.1, 'trade', 'metal iron'], ['Copper (1 lb)', 0.5, 'trade', 'metal'],
  ['Silver (1 lb)', 5, 'trade', 'metal precious'], ['Gold (1 lb)', 50, 'trade', 'metal precious', 2], ['Canvas (1 sq yd)', 0.1, 'trade', 'cloth'], ['Cotton cloth (1 sq yd)', 0.5, 'trade', 'cloth'],
  ['Linen (1 sq yd)', 5, 'trade', 'cloth luxury', 2], ['Silk (1 sq yd)', 10, 'trade', 'cloth luxury', 2], ['Ginger (1 lb)', 1, 'trade', 'spice'], ['Cinnamon or pepper (1 lb)', 2, 'trade', 'spice luxury'],
  ['Cloves (1 lb)', 3, 'trade', 'spice luxury', 2], ['Saffron (1 lb)', 15, 'trade', 'spice luxury', 2],
  ['Potion of Healing', 50, 'magic', 'magic healing potion', 2, 'common'], ['Spell scroll (1st level)', 75, 'magic', 'magic scroll', 2, 'common'], ['Potion of Climbing', 75, 'magic', 'magic potion', 2, 'common'],
  ['Potion of Greater Healing', 150, 'magic', 'magic healing potion', 3, 'uncommon'], ['Boots of Elvenkind', 300, 'magic', 'magic wondrous', 3, 'uncommon'], ['Wand of Magic Missiles', 350, 'magic', 'magic wand', 3, 'uncommon'],
  ['Bag of Holding', 400, 'magic', 'magic wondrous', 3, 'uncommon'], ['+1 Weapon', 450, 'magic', 'magic weapon', 3, 'uncommon'], ['Potion of Superior Healing', 550, 'magic', 'magic healing potion', 4, 'rare'],
  ['+2 Weapon', 3000, 'magic', 'magic weapon', 4, 'rare'], ['Ring of Protection', 3500, 'magic', 'magic ring', 4, 'rare'], ['Flame Tongue', 4000, 'magic', 'magic weapon', 4, 'rare'],
  ['Potion of Supreme Healing', 6000, 'magic', 'magic healing potion', 4, 'very rare'], ['+3 Weapon', 24000, 'magic', 'magic weapon', 4, 'very rare']
].map(([name, base, cat, tags, minTier, rarity], i) => ({ i, name, base, cat, tags: tags.split(' '), minTier: minTier || 1, rarity: rarity || null }));
const GBY = Object.fromEntries(GOODS.map((g) => [g.name, g]));
const BASKET = ['Bread, loaf', 'Meat, chunk', 'Ale, gallon', 'Wheat (1 lb)', 'Salt (1 lb)', 'Riding horse', 'Feed (per day)', 'Longsword', 'Chain mail', 'Rope, hempen (50 ft)', "Healer's kit", 'Iron (1 lb)', 'Cotton cloth (1 sq yd)', 'Inn stay, modest (night)'].map((n) => GBY[n].i);
const STOCK_CHANCE = { common: 0.85, uncommon: 0.6, rare: 0.45, 'very rare': 0.18 };

// ---------------------------------------------------------------- world events
const EVT = {
  war: { name: 'War', col: '#c84235', path: 'M5 5l13 13M19 5L6 18M15 20l5-5M4 15l5 5',
    fx: { weapon: 0.9, armor: 0.8, war: 1.3, horse: 0.6, mount: 0.35, food: 0.35, grain: 0.45, feed: 0.6, healing: 0.7, potion: 0.5, metal: 0.4, iron: 0.55, luxury: -0.25, lodging: -0.2 },
    blurb: 'Weapons, armour and warhorses climb. Food and healing grow dear near the front.', hook: 'Mercenaries are hired at 2 gp a day; requisition officers seize horses and grain.', dur: 120 },
  bandits: { name: 'Bandits', col: '#8a6a3f', path: 'M12 3l2.2 4V15H9.8V7ZM7.5 15.5h9M12 15.5V21',
    fx: { spice: 0.6, luxury: 0.5, cloth: 0.35, crafted: 0.3, metal: 0.3, weapon: 0.35, mount: 0.25, magic: 0.3, salt: 0.4, travel: 0.3 },
    blurb: 'Caravans avoid the roads. Imports, spices and cloth cost more, and travellers risk ambush.', hook: 'The reeve posts a bounty of 10 gp a head; merchants pay for escorts.', dur: 25, r: 40 },
  famine: { name: 'Famine', col: '#b8860b', path: 'M12 21V9M12 9c-2.5-.6-3.6-2.6-3.6-5 2.4.6 3.6 2.6 3.6 5zM12 14c-2.5-.6-3.6-2.6-3.6-5M12 14c2.5-.6 3.6-2.6 3.6-5M4 20L20 4',
    fx: { grain: 2.2, food: 1.4, drink: 0.6, feed: 1.8, meat: 0.4, lodging: 0.3, livestock: -0.35, luxury: -0.35 },
    blurb: 'Grain and bread prices soar. Farmers sell off livestock they can no longer feed.', hook: 'Grain convoys need guards; hungry folk turn to poaching and theft.', dur: 80, r: 140 },
  plague: { name: 'Plague', col: '#6f8f2a', path: 'M7 11.5a5 5 0 1 1 10 0V14h-2v3H9v-3H7zM9.3 11h1.6M13.1 11h1.6',
    fx: { healing: 1.6, alchemy: 1.2, potion: 0.9, food: 0.25, spice: 0.3, lodging: -0.45, luxury: -0.4, livestock: -0.15 },
    blurb: "Healer's kits, antitoxin and healing potions sell out. Inns empty as travellers stay away.", hook: 'The temple pays well for herbs and for anyone who can find the source.', dur: 55, r: 80 },
  festival: { name: 'Festival', col: '#8a5cc7', path: 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z',
    fx: { drink: 0.7, wine: 0.5, food: 0.25, meat: 0.35, lodging: 0.9, luxury: 0.35, spice: 0.25 },
    blurb: 'Ale, wine and rooms are in demand. Crowds bring performers and pickpockets.', hook: 'Contests of skill offer prize purses; a rival guild plans to spoil the day.', dur: 4, r: 18 },
  boom: { name: 'Trade boom', col: '#3b82c4', path: 'M4 17l5-5 4 4 7-7M15 9h5v5',
    fx: { luxury: -0.3, spice: -0.32, cloth: -0.25, metal: -0.22, precious: -0.25, crafted: -0.15, magic: -0.12, lodging: 0.55, drink: 0.2, food: 0.12, mount: 0.18, draft: 0.25, vehicle: 0.3 },
    blurb: 'Merchants pour in. Imported goods get cheaper as stock floods the stalls, while rooms, wagons and draught animals are snapped up.', hook: 'Merchant houses hire guards and factors; a rival town plots to divert the trade.', dur: 40, r: 60 },
  feast: { name: 'Feast', col: '#2f8f8a', path: 'M7 4h10l-1 6a4 4 0 0 1-8 0zM12 14v6M8.5 20h7',
    fx: { meat: 0.6, wine: 0.7, spice: 0.45, drink: 0.3, livestock: 0.25, luxury: 0.2 },
    blurb: 'Meat, wine and spices are bought up for the tables.', hook: 'Servers and entertainers are hired at good wages; someone at the high table has enemies.', dur: 2, r: 6 }
};
const ETYPES = Object.keys(EVT);
const TIDX = Object.fromEntries(ETYPES.map((t, i) => [t, i]));
const GOOD_EFF = GOODS.map((g) => ETYPES.map((t) => { let best = 0; for (const tag of g.tags) { const v = EVT[t].fx[tag]; if (v !== undefined && Math.abs(v) > Math.abs(best)) best = v; } return best; }));
const SEV = { mild: 0.55, serious: 0.78, dire: 1 };
const sevName = (I) => (I < 0.66 ? 'Mild' : I < 0.86 ? 'Serious' : 'Dire');
const GANGS = ['Brigands', 'Outlaws', 'Raiders', 'Hounds', 'Blades', 'Company', 'Reavers'];
const DISEASES = ['the Grey Cough', 'the Sweating Sickness', 'Bloodpox', 'the Shaking Fever', 'Rot-lung', 'the Weeping Pox', 'Marsh Ague', 'the Pale Rot'];
const FESTS = ['Lantern Festival', 'Harvest Fair', 'Midsummer Revels', 'Founding Day', 'Horse Fair', 'Wool Fair', 'Moon Market', 'Spring Fair', 'Tourney'];
const BOOMS = { 14: 'Silver strike', 15: 'Silver strike', 5: 'Wool boom', 4: 'Spice fleet arrives', 6: 'Timber boom', 7: 'Fur rush', 8: 'Spice caravans arrive', 10: 'Caravan season', 11: 'Caravan season', 9: 'Herb market boom', 12: 'Ivory rush', 13: 'Ivory rush' };
const FEASTS = ['wedding feast', 'victory feast', 'name-day feast', 'guild banquet', 'funeral feast'];

// ---------------------------------------------------------------- local economy of a settlement
const BIOME_FX = {
  4: { grain: 0.9, salt: 0.8 }, 5: { grain: 0.8, livestock: 0.85, horse: 0.85, wool: 0.85, feed: 0.8, cattle: 0.85 },
  6: { timber: 0.8, meat: 0.9, bow: 0.85, hide: 0.9 }, 7: { hide: 0.85, timber: 0.85, grain: 1.2, food: 1.1, feed: 1.15 },
  8: { spice: 0.65, exotic: 0.8, grain: 1.2, alchemy: 0.85 }, 9: { alchemy: 0.8, healing: 0.9, grain: 1.15, livestock: 1.1 },
  10: { camel: 0.6, spice: 0.8, food: 1.2, drink: 1.2, grain: 1.3, salt: 0.8, feed: 1.4, horse: 1.15 }, 11: { livestock: 0.9, grain: 1.1, feed: 1.1 },
  12: { food: 1.25, grain: 1.35, hide: 0.8, feed: 1.4, drink: 1.1 }, 13: { food: 1.3, grain: 1.4, hide: 0.8, feed: 1.5 },
  14: { iron: 0.65, metal: 0.75, precious: 0.85, crafted: 0.88, armor: 0.85, grain: 1.25, feed: 1.2 }, 15: { iron: 0.65, metal: 0.75, precious: 0.85, crafted: 0.88, armor: 0.85, grain: 1.3 }
};
const COAST_FX = { salt: 0.6, meat: 0.95, spice: 0.9, cloth: 0.95, luxury: 0.95 };
const TIER_FX = {
  1: { food: 0.88, grain: 0.82, livestock: 0.9, feed: 0.85, lodging: 0.8, crafted: 1.2, armor: 1.25, weapon: 1.2, luxury: 1.3, cloth: 1.1 }, 2: {},
  3: { food: 1.1, grain: 1.08, lodging: 1.3, crafted: 0.95, luxury: 0.95, livestock: 1.08, feed: 1.1 },
  4: { food: 1.18, grain: 1.12, lodging: 1.6, luxury: 0.9, crafted: 0.92, magic: 0.95, livestock: 1.12, feed: 1.15 }
};
const IMPORT_TAGS = new Set(['spice', 'luxury', 'crafted', 'metal', 'magic', 'cloth', 'precious', 'exotic']);
const SEASON = [1.14, 1.2, 1.22, 1.16, 1.06, 1.0, 0.94, 0.88, 0.8, 0.86, 0.96, 1.06];

let mkVer = 0, evWin = null;
const capIdx = new Map();
const localCache = new Map(), priceCache = new Map(), haloCache = new Map(), indexCache = new Map(), activeCache = new Map(), modsCache = new Map();
function marketInvalidate() {
  mkVer++; evWin = null;
  localCache.clear(); priceCache.clear(); haloCache.clear(); indexCache.clear(); activeCache.clear(); modsCache.clear();
  capIdx.clear(); CAPLIST.forEach((c, i) => capIdx.set(c.id, i));
  sampleList = null;
}
function localInfo(s) {
  const key = s.x + '|' + s.y + '|' + s.tier + '|' + mkVer;
  const c = localCache.get(s.id);
  if (c && c.key === key) return c;
  const b = s.b != null ? s.b : 5;
  const coastal = !!s.coastal;
  const ri = CAPS.length ? T.realmAt(s.x, s.y, CAPS).i : -1;
  let remote = 600;
  for (const c2 of SET) if (c2.tier >= 3) { const d = Math.hypot(c2.x - s.x, c2.y - s.y); if (d < remote) remote = d; }
  const tables = [BIOME_FX[b] || {}, coastal ? COAST_FX : {}, TIER_FX[s.tier] || {}];
  const local = new Float64Array(GOODS.length);
  const AF = agendaFx(s);
  for (const g of GOODS) {
    let m = 1, imported = false;
    for (const tag of g.tags) { for (const t of tables) if (t[tag]) m *= t[tag]; if (IMPORT_TAGS.has(tag)) imported = true; }
    if (imported) m *= 1 + Math.min(remote, 600) / 800;
    if (AF.all) m *= AF.all;
    for (const tag of g.tags) if (AF[tag]) m *= AF[tag];
    local[g.i] = clamp(m, 0.45, 2.2);
  }
  const info = { key, h: hashStr(s.id) & 0x7fffffff, ri, b, coastal, remote, local };
  localCache.set(s.id, info);
  if (localCache.size > 8000) localCache.delete(localCache.keys().next().value);
  return info;
}
function seasonMult(g, day) {
  const r = ((day % 360) + 360) % 360, f = r / 30 - 0.5, m0 = Math.floor(f), t = f - m0;
  const a = SEASON[(m0 + 12) % 12], b = SEASON[(m0 + 13) % 12];
  const m = a + (b - a) * t;
  if (g.tags.includes('grain') || g.tags.includes('feed')) return m;
  if (g.tags.includes('food') || g.tags.includes('drink')) return 1 + (m - 1) * 0.45;
  return 1;
}
function fluct(g, L, day) {
  const a = g.cat === 'magic' ? 0.11 : 0.065;
  return Math.exp(a * T.noise2(day / 12 + g.i * 3.13, L.ri * 5.71 + 1.3) + a * 0.45 * T.noise2(day / 3.4 + g.i * 1.91, (L.h % 997) * 0.37 + 9.1));
}

// ---------------------------------------------------------------- event generation (deterministic from the seed)
// cycle c covers days [c*len, (c+1)*len); every event that starts in a cycle also ends inside it
function cycles(d0, d1, len, cb) { for (let c = Math.floor(d0 / len) - 1; c <= Math.floor(d1 / len); c++) cb(c); }
function genEvents(d0, d1) {
  const out = [];
  const off = edits.evOff || {};
  const add = (e) => { if (e.end > d0 && e.start <= d1 && !off[e.id]) out.push(e); };
  const mk = (type, s, start, dur, hs, r, k) => {
    const id = type + ':' + s.id + ':' + start;
    const rr = T.mulberry(hashStr(id) ^ SEED);
    let name;
    if (type === 'bandits') name = 'The ' + PRE[Math.floor(rr() * PRE.length)] + ' ' + GANGS[Math.floor(rr() * GANGS.length)] + ' near ' + s.name;
    else if (type === 'famine') name = (rr() < 0.5 ? 'Famine in the ' + s.name + ' country' : 'Blight on the ' + s.name + ' harvest');
    else if (type === 'plague') { const dz = DISEASES[Math.floor(rr() * DISEASES.length)]; name = dz.charAt(0).toUpperCase() + dz.slice(1) + ' in ' + s.name; }
    else if (type === 'festival') name = s.name + ' ' + FESTS[Math.floor(T.hash(hashStr(s.id) & 0x7fffffff, k || 0, 207) * FESTS.length)];
    else if (type === 'boom') name = (s.coastal && rr() < 0.5 ? 'Merchant fleet arrives' : BOOMS[s.b] || 'Trade boom') + ' at ' + s.name;
    else name = (rr() < 0.5 ? 'Lord ' : 'Lady ') + SYL1[Math.floor(rr() * SYL1.length)] + SYL2[Math.floor(rr() * SYL2.length)] + "'s " + FEASTS[Math.floor(rr() * FEASTS.length)] + ' at ' + s.name;
    return { id, type, sid: s.id, place: s.name, x: s.x, y: s.y, start, end: start + Math.max(1, dur), I: 0.5 + 0.5 * hs, r, name };
  };
  for (const s of SET) {
    if (s.tier < 2) continue;
    const h = hashStr(s.id) & 0x7fffffff;
    const wild = (s.b === 6 || s.b === 7 || s.b === 11 || s.b === 14) ? 1.6 : 1;
    // each kind of event runs in fixed cycles per place, so the same place never hosts two at once
    // every place runs each kind of event on its own phase, so waves never sweep the whole world at once
    const ph = (len, k) => Math.floor(T.hash(h, k, 909) * len);
    const at = (len, k, c, dur, salt) => c * len + ph(len, k) + Math.floor(T.hash(h, c, salt) * Math.max(1, len - dur));
    cycles(d0 - 60, d1, 60, (c) => {
      if (T.hash(h, c, 101) < 0.05 * wild * (s.tier === 2 ? 1 : 0.6)) { const dur = 12 + Math.floor(T.hash(h, c, 103) * 34);
        add(mk('bandits', s, at(60, 1, c, dur, 102), dur, T.hash(h, c, 104), 25 + 35 * T.hash(h, c, 105))); }
    });
    const dry = (s.b === 10 || s.b === 11 || s.b === 12 || s.b === 13) ? 2.2 : s.b === 9 ? 1.2 : 1;
    cycles(d0 - 180, d1, 180, (c) => {
      if (T.hash(h, c, 111) < 0.0125 * dry * (s.tier >= 3 ? 0.8 : 1)) { const dur = 40 + Math.floor(T.hash(h, c, 113) * 100);
        add(mk('famine', s, at(180, 2, c, dur, 112), dur, T.hash(h, c, 114), 90 + 130 * T.hash(h, c, 115))); }
    });
    cycles(d0 - 120, d1, 120, (c) => {
      if (T.hash(h, c, 121) < (s.tier >= 3 ? 0.048 : 0.0085)) { const dur = 25 + Math.floor(T.hash(h, c, 123) * 65);
        add(mk('plague', s, at(120, 3, c, dur, 122), dur, T.hash(h, c, 124), 35 + 80 * T.hash(h, c, 125))); }
    });
    cycles(d0 - 90, d1, 90, (c) => {
      if (T.hash(h, c, 151) < (s.tier >= 3 ? 0.07 : 0.025) * (s.coastal ? 1.5 : 1)) { const dur = 20 + Math.floor(T.hash(h, c, 153) * 40);
        add(mk('boom', s, at(90, 4, c, dur, 152), dur, T.hash(h, c, 154), 40 + 50 * T.hash(h, c, 155))); }
    });
    cycles(d0 - 10, d1, 10, (c) => {
      if (T.hash(h, c, 131) < ({ 2: 0.015, 3: 0.04, 4: 0.1 })[s.tier]) { const dur = 1 + Math.floor(T.hash(h, c, 133) * 3);
        add(mk('feast', s, at(10, 5, c, dur, 132), dur, 0.3 + 0.7 * T.hash(h, c, 134), 6)); }
    });
    // every town keeps its own annual festival; capitals hold two
    for (let y = Math.floor(d0 / 360) - 1; y <= Math.floor(d1 / 360); y++) {
      for (let k = 0; k < (s.tier === 4 ? 2 : 1); k++) {
        const doy = Math.floor(T.hash(h, k, 201) * 360);
        add(mk('festival', s, y * 360 + doy, 3 + Math.floor(T.hash(h, k, 202) * 4), 0.4 + 0.6 * T.hash(h, k, 203), 18, k));
      }
    }
  }
  // wars between neighbouring realms
  const pairs = new Set();
  CAPLIST.forEach((a) => {
    CAPLIST.filter((b) => b !== a).map((b) => [Math.hypot(a.x - b.x, a.y - b.y), b]).sort((p, q) => p[0] - q[0]).slice(0, 2)
      .forEach(([d, b]) => { if (d < 1500) pairs.add(a.id < b.id ? a.id + '|' + b.id : b.id + '|' + a.id); });
  });
  for (const key of pairs) {
    const [ia, ib] = key.split('|');
    const A = SBY.get(ia), Bc = SBY.get(ib);
    const h = hashStr(key) & 0x7fffffff;
    const wph = Math.floor(T.hash(h, 0, 919) * 300);
    cycles(d0 - 300, d1, 300, (c) => {
      if (T.hash(h, c, 141) < 0.26 * (warAgenda(ia) || warAgenda(ib) ? 1.9 : 1)) {
        const start = c * 300 + wph + Math.floor(T.hash(h, c, 142) * 60), id = 'war:' + key + ':' + start;
        const ra = REALMS[capIdx.get(ia)], rb = REALMS[capIdx.get(ib)];
        add({ id, type: 'war', a: ia, b: ib, ai: capIdx.get(ia), bi: capIdx.get(ib), x: (A.x + Bc.x) / 2, y: (A.y + Bc.y) / 2, start, end: start + 60 + Math.floor(T.hash(h, c, 143) * 180), I: 0.6 + 0.4 * T.hash(h, c, 144), r: 0, name: (ra ? ra.name : A.name) + ' at war with ' + (rb ? rb.name : Bc.name) + ', ' + (YEAR0 + Math.floor(start / 360)), place: A.name + ' and ' + Bc.name });
      }
    });
  }
  // realm-wide harvest festival
  CAPLIST.forEach((c, i) => {
    for (let y = Math.floor(d0 / 360) - 1; y <= Math.floor(d1 / 360); y++) {
      const start = y * 360 + 252;
      add({ id: 'harvest:' + c.id + ':' + start, type: 'festival', realm: c.id, sid: c.id, x: c.x, y: c.y, start, end: start + 4, I: 0.8, r: 0, name: 'Harvest Home across ' + (REALMS[i] ? REALMS[i].name : c.name), place: c.name });
    }
  });
  // events declared by the DM
  for (const ue of edits.events || []) {
    const s = SBY.get(ue.sid);
    if (!s) continue;
    const e = { id: ue.id, type: ue.type, sid: s.id, place: s.name, x: s.x, y: s.y, start: ue.start, end: ue.start + ue.dur, I: ue.sev, r: ue.r, name: ue.name, user: true };
    if (ue.type === 'war') {
      const own = CAPS.length ? T.realmAt(s.x, s.y, CAPS).i : -1;
      let best = -1, bd = 1e9;
      CAPLIST.forEach((c, i) => { if (i === own) return; const d = Math.hypot(c.x - s.x, c.y - s.y); if (d < bd) { bd = d; best = i; } });
      if (own < 0 || best < 0) continue;
      const A = CAPLIST[own], Bc = CAPLIST[best];
      Object.assign(e, { a: A.id, b: Bc.id, ai: own, bi: best, x: (A.x + Bc.x) / 2, y: (A.y + Bc.y) / 2, place: A.name + ' and ' + Bc.name });
    }
    if (e.end > d0 && e.start <= d1) out.push(e);
  }
  return out;
}
function eventsWindow(day) {
  if (!evWin || evWin.ver !== mkVer || day < evWin.d0 + 70 || day > evWin.d1 - 16) {
    const d0 = day - 90, d1 = day + 30;
    evWin = { d0, d1, ver: mkVer, list: genEvents(d0, d1) };
    activeCache.clear(); modsCache.clear();
  }
  return evWin.list;
}
function activeOn(day) {
  let a = activeCache.get(day);
  if (a) return a;
  a = eventsWindow(day).filter((e) => e.start <= day && day < e.end);
  activeCache.set(day, a);
  if (activeCache.size > 200) activeCache.delete(activeCache.keys().next().value);
  return a;
}
function findEvent(id) { if (!evWin) eventsWindow(market.day); return evWin.list.find((e) => e.id === id) || null; }
function radiusAt(e, day) {
  if (e.type !== 'plague') return e.r;
  return 6 + (e.r - 6) * clamp((day - e.start) / ((e.end - e.start) * 0.45), 0, 1);
}
function envelope(e, day) {
  const len = e.end - e.start;
  if (e.type === 'famine' || e.type === 'plague') {
    const t = clamp((day - e.start + 0.5) / len, 0, 1);
    return Math.max(0.25, Math.pow(Math.sin(Math.PI * t), 0.5));
  }
  // news travels: effects build up after the start and fade before the end
  const ramp = e.type === 'war' ? 10 : len > 6 ? 3 : 0;
  if (!ramp) return 1;
  return clamp(Math.min(day - e.start + 1, e.end - day) / ramp, 0.15, 1);
}
// a town's wealth and defences, when the DM sets them (from the old Market Ledger's town settings): wealth softens
// famine and plague, walls and soldiers soften war and bandits. Left on Auto, nothing changes.
const WEALTH_LV = ['Poor', 'Modest', 'Prosperous', 'Rich'], DEFENCE_LV = ['None', 'Town watch', 'Garrison', 'Fortress'];
const WEALTH_F = [1.3, 1, 0.85, 0.7], DEFENCE_F = [1.3, 1, 0.8, 0.6];
const autoWealth = (s) => (s.tier >= 3 ? 2 : 1), autoDefence = (s) => (s.tier >= 4 ? 2 : s.tier >= 2 ? 1 : 0);
function townGuard(s, type) {
  if (s.wealth == null && s.defence == null) return 1;
  if ((type === 'famine' || type === 'plague') && s.wealth != null) return WEALTH_F[s.wealth] / WEALTH_F[autoWealth(s)];
  if ((type === 'war' || type === 'bandits') && s.defence != null) return DEFENCE_F[s.defence] / DEFENCE_F[autoDefence(s)];
  return 1;
}
function impact(e, s, L, day) {
  const f = impactRaw(e, s, L, day);
  return f > 0 ? f * townGuard(s, e.type) : f;
}
function impactRaw(e, s, L, day) {
  if (e.type === 'war') {
    if (L.ri !== e.ai && L.ri !== e.bi) return 0;
    const own = CAPLIST[L.ri], en = CAPLIST[L.ri === e.ai ? e.bi : e.ai];
    if (!own || !en) return 0;
    const dOwn = Math.hypot(s.x - own.x, s.y - own.y), dEn = Math.hypot(s.x - en.x, s.y - en.y);
    return e.I * (0.4 + 0.6 * clamp(1 - (dEn - dOwn) / 450, 0, 1)) * envelope(e, day);
  }
  if (e.realm) { const c = CAPLIST[L.ri]; return c && c.id === e.realm ? e.I * (s.tier >= 2 ? 0.7 : 0.45) : 0; }  // short festival: no ramp
  if (e.sid === s.id) return e.I * envelope(e, day);
  const r = radiusAt(e, day), d = Math.hypot(s.x - e.x, s.y - e.y);
  return d < r ? e.I * (1 - (d / r) * (d / r)) * envelope(e, day) : 0;
}
function modsFor(s, day) {
  const key = s.id + '|' + day;
  let m = modsCache.get(key);
  if (m) return m;
  const L = localInfo(s);
  m = [];
  for (const e of activeOn(day)) { const f = impact(e, s, L, day); if (f > 0.02) m.push([TIDX[e.type], f, e]); }
  modsCache.set(key, m);
  if (modsCache.size > 20000) modsCache.clear();
  return m;
}
function evMult(gi, mods) { let m = 1; for (const [ti, f] of mods) { const eff = GOOD_EFF[gi][ti]; if (eff) m *= Math.max(0.3, 1 + eff * f); } return m; }
function pricesFor(s, day) {
  const key = s.id + '|' + day + '|' + mkVer;
  let p = priceCache.get(key);
  if (p) return p;
  const L = localInfo(s), mods = modsFor(s, day);
  p = new Float64Array(GOODS.length);
  const X = priceExtra(s, day);
  for (const g of GOODS) p[g.i] = g.base * L.local[g.i] * seasonMult(g, day) * fluct(g, L, day) * evMult(g.i, mods) * extraMult(g, X);
  priceCache.set(key, p);
  if (priceCache.size > 3000) priceCache.delete(priceCache.keys().next().value);
  return p;
}
function inStock(s, g, day) {
  if (s.tier < g.minTier) return false;
  if (!g.rarity) return true;
  const L = localInfo(s);
  return T.hash(L.h & 0xffffff, g.i * 131 + Math.floor(day / 7), 911) < STOCK_CHANCE[g.rarity];
}
// how far today's prices sit from normal, ignoring the town's permanent quirks
function basketIndex(s, day) {
  const key = s.id + '|' + day;
  let v = haloCache.get(key);
  if (v !== undefined) return v;
  const L = localInfo(s), mods = modsFor(s, day);
  let sum = 0;
  const X = priceExtra(s, day);
  for (const gi of BASKET) sum += Math.log(fluct(GOODS[gi], L, day) * evMult(gi, mods) * extraMult(GOODS[gi], X));
  v = Math.exp(sum / BASKET.length);
  haloCache.set(key, v);
  if (haloCache.size > 20000) haloCache.clear();
  return v;
}
let sampleList = null;
function sample() {
  if (!sampleList) sampleList = SET.filter((s) => s.tier >= 3 || (s.tier === 2 && hashStr(s.id) % 5 === 0));
  return sampleList;
}
// world price index per category, plus each good's mean log price
function worldIndex(day) {
  let r = indexCache.get(day);
  if (r) return r;
  const S = sample();
  const lg = new Float64Array(GOODS.length);
  for (const s of S) {
    const L = localInfo(s), mods = modsFor(s, day);
    for (const g of GOODS) lg[g.i] += Math.log(seasonMult(g, day) * fluct(g, L, day) * evMult(g.i, mods));
  }
  const n = Math.max(1, S.length);
  for (let i = 0; i < lg.length; i++) lg[i] /= n;
  const cat = CATS.map((c) => { const gs = GOODS.filter((g) => g.cat === c.id); return Math.exp(gs.reduce((a, g) => a + lg[g.i], 0) / gs.length); });
  r = { cat, lg };
  indexCache.set(day, r);
  if (indexCache.size > 400) indexCache.delete(indexCache.keys().next().value);
  return r;
}

// ---------------------------------------------------------------- money & small renders
function money(gp) {
  if (!(gp > 0)) return '0 gp';
  const cp = Math.round(gp * 100);
  if (cp >= 100000) return fmtInt(cp / 100) + ' gp';
  if (cp >= 100) { const g = Math.floor(cp / 100), s = Math.floor((cp % 100) / 10); return g.toLocaleString('en-GB') + ' gp' + (s && g < 100 ? ' ' + s + ' sp' : ''); }
  if (cp >= 10) { const s = Math.floor(cp / 10), c = cp % 10; return s + ' sp' + (c ? ' ' + c + ' cp' : ''); }
  return Math.max(1, cp) + ' cp';
}
// prices in their coins: gold, silver and copper, as on the old Market Ledger
function coinHtml(gp) { return esc(money(gp)).replace(/([\d,]+) (gp|sp|cp)/g, '<span class="c-$2"><b>$1</b> $2</span>'); }
const pct = (v) => (v >= 0 ? '+' : '−') + Math.abs(v * 100).toFixed(Math.abs(v) < 0.1 ? 1 : 0) + '%';
function evIcon(type, size) {
  const c = EVT[type];
  return '<svg class="evi" width="' + (size || 22) + '" height="' + (size || 22) + '" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11.5" fill="' + c.col + '"/><path d="' + c.path + '" transform="translate(3.6 3.6) scale(.7)" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}
function spark(vals) {
  const w = 64, h = 18;
  let lo = Infinity, hi = -Infinity;
  for (const v of vals) { if (v < lo) lo = v; if (v > hi) hi = v; }
  if (hi - lo < hi * 0.02) { const m = (hi + lo) / 2; lo = m * 0.99; hi = m * 1.01; }
  const pts = vals.map((v, i) => (i / (vals.length - 1) * (w - 4) + 2).toFixed(1) + ',' + (h - 2 - (v - lo) / (hi - lo) * (h - 4)).toFixed(1));
  const last = pts[pts.length - 1].split(',');
  return '<svg class="spark" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><polyline points="' + pts.join(' ') + '" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="' + last[0] + '" cy="' + last[1] + '" r="2" fill="currentColor"/></svg>';
}
function changeTag(v) {
  if (Math.abs(v) < 0.005) return '<span class="chg flat">steady</span>';
  return '<span class="chg ' + (v > 0 ? 'up' : 'down') + '"><i aria-hidden="true">' + (v > 0 ? '▲' : '▼') + '</i>' + pct(v) + '</span>';
}

// ---------------------------------------------------------------- overview chart
const CHART_DAYS = 60;
let chartState = null;
function overviewChart(day) {
  const W0 = 368, H0 = 180, padL = 34, padR = 8, padT = 10, padB = 22;
  const days = [];
  for (let d = day - CHART_DAYS; d <= day; d++) days.push(d);
  const series = CATS.map((c, k) => ({ c, vals: days.map((d) => worldIndex(d).cat[k] * 100) }));
  let lo = Infinity, hi = -Infinity;
  for (const s of series) for (const v of s.vals) { if (v < lo) lo = v; if (v > hi) hi = v; }
  const step = hi - lo > 60 ? 25 : hi - lo > 24 ? 10 : 5;
  lo = Math.floor((lo - 2) / step) * step; hi = Math.ceil((hi + 2) / step) * step;
  const X = (i) => padL + i / (days.length - 1) * (W0 - padL - padR);
  const Y = (v) => padT + (1 - (v - lo) / (hi - lo)) * (H0 - padT - padB);
  let g = '';
  for (let v = lo; v <= hi + 1e-9; v += step) {
    g += '<line x1="' + padL + '" x2="' + (W0 - padR) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" class="' + (v === 100 ? 'base' : 'grid') + '"/>';
    g += '<text x="' + (padL - 6) + '" y="' + (Y(v) + 3.5).toFixed(1) + '" text-anchor="end">' + v + '%</text>';
  }
  for (const i of [0, 30, 60]) g += '<text x="' + X(i).toFixed(1) + '" y="' + (H0 - 6) + '" text-anchor="' + (i === 0 ? 'start' : i === 60 ? 'end' : 'middle') + '">' + (i === 60 ? 'Today' : shortDate(days[i])) + '</text>';
  let lines = '';
  for (const s of series) lines += '<polyline points="' + s.vals.map((v, i) => X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ') + '" fill="none" stroke="' + s.c.col + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
  chartState = { days, series, X, Y, W0, H0, padL, padR, padT, padB };
  return '<div class="mk-chart" id="mkChart"><svg viewBox="0 0 ' + W0 + ' ' + H0 + '" role="img" aria-label="Price index by category over the last 60 days, 100% is the Player\'s Handbook price">' + g + lines +
    '<line id="mkCross" class="cross" x1="0" x2="0" y1="' + padT + '" y2="' + (H0 - padB) + '" visibility="hidden"/><g id="mkDots"></g><rect id="mkHit" x="' + padL + '" y="0" width="' + (W0 - padL - padR) + '" height="' + H0 + '" fill="transparent"/></svg><div class="mk-tip" id="mkTip" hidden></div></div>' +
    '<ul class="legend">' + series.map((s) => { const v = s.vals[s.vals.length - 1], w = s.vals[s.vals.length - 8]; return '<li><i style="background:' + s.c.col + '"></i><span>' + s.c.name + '</span><b>' + v.toFixed(0) + '%</b>' + changeTag(v / w - 1) + '</li>'; }).join('') + '</ul>';
}
function wireChart() {
  const wrap = $('mkChart');
  if (!wrap || !chartState) return;
  const svg = wrap.querySelector('svg'), hit = $('mkHit'), cross = $('mkCross'), dots = $('mkDots'), tip = $('mkTip');
  const move = (ev) => {
    const r = svg.getBoundingClientRect();
    const vx = (ev.clientX - r.left) / r.width * chartState.W0;
    const n = chartState.days.length;
    const i = clamp(Math.round((vx - chartState.padL) / (chartState.W0 - chartState.padL - chartState.padR) * (n - 1)), 0, n - 1);
    const x = chartState.X(i);
    cross.setAttribute('x1', x); cross.setAttribute('x2', x); cross.setAttribute('visibility', 'visible');
    dots.innerHTML = chartState.series.map((s) => '<circle cx="' + x.toFixed(1) + '" cy="' + chartState.Y(s.vals[i]).toFixed(1) + '" r="4" fill="' + s.c.col + '" stroke="#151a20" stroke-width="2"/>').join('');
    tip.innerHTML = '<b>' + dateText(chartState.days[i]) + '</b>' + chartState.series.map((s) => '<div><i style="background:' + s.c.col + '"></i>' + s.c.name + '<span>' + s.vals[i].toFixed(0) + '%</span></div>').join('');
    tip.hidden = false;
    const px = x / chartState.W0 * r.width;
    tip.style.left = (px > r.width / 2 ? px - tip.offsetWidth - 10 : px + 10) + 'px';
  };
  const leave = () => { cross.setAttribute('visibility', 'hidden'); dots.innerHTML = ''; tip.hidden = true; };
  hit.addEventListener('pointermove', move);
  hit.addEventListener('pointerdown', move);
  hit.addEventListener('pointerleave', leave);
}

// ---------------------------------------------------------------- market panel
function marketHeader() {
  const d = market.day;
  return '<div class="mk-head"><div><div class="eyebrow">Market · ' + (market.playing ? '<span class="live">Live</span>' : 'Paused') + '</div><h2 id="mkDate">' + dateText(d) + '</h2></div>' +
    '<button type="button" class="x" data-act="close" aria-label="Close panel">×</button></div>' +
    (campaign.shared && !campaign.admin ? '<p class="meta">The calendar follows your DM.</p><div hidden>' : '') + '<div class="mk-ctl" role="group" aria-label="Calendar">' +
    '<button type="button" data-mk="day" data-v="-1" aria-label="Previous day">‹ Day</button>' +
    '<button type="button" class="play" data-mk="play" aria-pressed="' + market.playing + '">' + (market.playing ? 'Pause' : 'Play') + '</button>' +
    '<button type="button" data-mk="day" data-v="1" aria-label="Next day">Day ›</button>' +
    '<button type="button" data-mk="day" data-v="7" aria-label="Skip a week">Week »</button></div>' + (campaign.shared && !campaign.admin ? '</div>' : '') +
    (market.playing ? seg('mkspeed', market.speed, [[4000, 'Slow'], [1500, 'Normal'], [400, 'Fast']]).replace(/data-act=/g, 'data-mk=') : '') +
    '<div class="seg mk-tabs" role="tablist">' + [['overview', 'Overview'], ['town', 'Town'], ['shop', 'Shop'], ['events', 'Events'], ['bounties', 'Bounties']].map(([k, l]) => '<button type="button" role="tab" data-mk="tab" data-v="' + k + '" aria-pressed="' + (market.tab === k) + '">' + l + '</button>').join('') + '</div>';
}
function evRow(e, day) {
  const left = e.end - day, startsIn = e.start - day;
  const when = startsIn > 0 ? 'starts in ' + startsIn + (startsIn === 1 ? ' day' : ' days') : left <= 1 ? 'ends today' : left + ' days left';
  return '<li><button type="button" data-mk="event" data-v="' + esc(e.id) + '">' + evIcon(e.type) + '<span class="t"><b>' + esc(e.name) + '</b><small>' + EVT[e.type].name + ' · ' + sevName(e.I) + ' · ' + when + '</small></span></button></li>';
}
const EV_RANK = { war: 6, plague: 5, famine: 4, bandits: 3, boom: 3, feast: 1, festival: 1 };
function sortEvents(list) { return list.slice().sort((a, b) => EV_RANK[b.type] - EV_RANK[a.type] || b.I - a.I); }
function overviewTab(day) {
  let h = '<section><h3>Price index</h3><p class="meta">Average across the realm\'s towns and cities. 100% is the Player\'s Handbook price.</p>' + overviewChart(day) + '</section>';
  const now = worldIndex(day).lg, then = worldIndex(day - 7).lg;
  const mv = GOODS.map((g) => [g, Math.exp(now[g.i] - then[g.i]) - 1]).sort((a, b) => b[1] - a[1]);
  const ups = mv.filter((m) => m[1] > 0.01).slice(0, 4), downs = mv.filter((m) => m[1] < -0.01).slice(-3).reverse();
  if (ups.length || downs.length) h += '<section><h3>Biggest movers this week</h3><ul class="movers">' + ups.concat(downs).map(([g, v]) => '<li><span>' + esc(g.name) + '</span>' + changeTag(v) + '</li>').join('') + '</ul></section>';
  const act = sortEvents(activeOn(day).filter((e) => e.type !== 'festival' && e.type !== 'feast' || (SBY.get(e.sid) || {}).tier >= 3 || e.realm));
  h += '<section><h3>What is happening</h3>' + (act.length ? '<ul class="evlist">' + act.slice(0, 12).map((e) => evRow(e, day)).join('') + '</ul>' + (act.length > 12 ? '<p class="meta">and ' + (act.length - 12) + ' smaller events. See the Events tab.</p>' : '') : '<p class="meta">A quiet season. No wars, plagues or famines anywhere.</p>') + '</section>';
  h += '<p class="hint">Rings around towns on the map show how far prices sit from normal: <span class="key ok">green ▼</span> cheap, <span class="key warn">amber ▲</span> dear, <span class="key bad">red ▲▲</span> very dear. The arrows say the same as the colours, for anyone who finds the colours hard to tell apart. Tap any town for its market board.</p>';
  return h;
}
// road adjacency, rebuilt only when the world changes
let adjVer = -1, ADJ = new Map();
const nbCache = new Map();
function adjacency() {
  if (adjVer === mkVer) return ADJ;
  ADJ = new Map(); nbCache.clear();
  for (const r of ROADS) {
    if (!r.a) continue;
    if (!ADJ.has(r.a)) ADJ.set(r.a, []);
    if (!ADJ.has(r.b)) ADJ.set(r.b, []);
    ADJ.get(r.a).push(r.b); ADJ.get(r.b).push(r.a);
  }
  adjVer = mkVer;
  return ADJ;
}
function neighbours(s) {
  const adj = adjacency();
  const hit = nbCache.get(s.id);
  if (hit) return hit;
  const out = new Map();
  for (const o of adj.get(s.id) || []) { const n = SBY.get(o); if (n) out.set(n.id, n); }
  for (const n of [...out.values()]) for (const o of adj.get(n.id) || []) {
    if (out.size > 14) break;
    const m = o !== s.id ? SBY.get(o) : null;
    if (m && m.tier >= 2) out.set(m.id, m);
  }
  SGRID.query(s.x - 70, s.y - 70, s.x + 70, s.y + 70, (n) => { if (n !== s && n.tier >= 2 && Math.hypot(n.x - s.x, n.y - s.y) < 70) out.set(n.id, n); });
  const res = [...out.values()].map((n) => [n, Math.hypot(n.x - s.x, n.y - s.y) * 1.15]).sort((a, b) => a[1] - b[1]).slice(0, 10);
  nbCache.set(s.id, res);
  return res;
}
function townTab(day) {
  const s = market.sid ? SBY.get(market.sid) : null;
  if (!s) return '<div class="empty-note"><p>Tap a town or city on the map to open its market board.</p><p class="meta">Villages sell food, livestock and basic gear. Towns add weapons and common magic; cities add armour and uncommon magic; capitals carry rare and very rare items.</p></div>';
  const L = localInfo(s), mods = modsFor(s, day);
  const R = L.ri >= 0 ? REALMS[L.ri] : null;
  const idx = basketIndex(s, day);
  let h = '<div class="town-h"><div><div class="eyebrow">' + placeKind(s) + ' · ' + fmtInt(s.pop) + ' people' + (R ? ' · ' + rLink(R) : '') + '</div><h3 class="town-name">' + tLink(s) + '</h3></div>' +
    '<div class="idx ' + (idx < 0.93 ? 'ok' : idx > 1.35 ? 'bad' : idx > 1.1 ? 'warn' : '') + '"><b>' + Math.round(idx * 100) + '%</b><small>' + (idx < 0.93 ? 'cheap' : idx > 1.35 ? 'very dear' : idx > 1.1 ? 'dear' : 'normal') + '</small></div></div>';
  { const ag = agendaList(s).filter((a) => a.A.market); if (ag.length) h += '<p class="meta"><b>Agendas at work:</b> ' + ag.map((a) => esc(a.A.label) + ' (' + pLink(a.p) + (a.scope === 'realm' ? ', from the capital' : '') + ')').join('; ') + '</p>'; }
  if (mods.length) h += '<ul class="evlist compact">' + mods.slice().sort((a, b) => b[1] - a[1]).map(([, , e]) => evRow(e, day)).join('') + '</ul>';
  h += moversHtml(s, day);
  const soon = eventsWindow(day).filter((e) => e.start > day && e.start <= day + 14 && impact(e, s, L, e.start) > 0.05);
  if (soon.length) h += '<p class="meta"><b>Coming up:</b> ' + soon.slice(0, 3).map((e) => eLink(e) + ' in ' + (e.start - day) + 'd').join('; ') + '</p>';
  const here = pricesFor(s, day);
  // price board
  const hist = [];
  for (let d = day - 30; d <= day; d++) hist.push(pricesFor(s, d));
  for (const c of CATS) {
    const gs = GOODS.filter((g) => g.cat === c.id);
    const avail = gs.filter((g) => inStock(s, g, day));
    let ci = 0;
    for (const g of gs) ci += Math.log(here[g.i] / hist[23][g.i]);
    const cchg = Math.exp(ci / gs.length) - 1;
    h += '<details class="board"' + (c.id === 'food' || (market.why != null && GOODS[market.why] && GOODS[market.why].cat === c.id) ? ' open' : '') + '><summary><i style="background:' + c.col + '"></i><span>' + c.name + '</span><small>' + avail.length + ' of ' + gs.length + ' sold</small>' + changeTag(cchg) + '</summary><table><thead><tr><th>Item</th><th>Price</th><th>7 days</th><th><span class="vh">Last 30 days</span></th></tr></thead><tbody>';
    for (const g of gs) {
      const ok = inStock(s, g, day);
      if (!ok) { h += '<tr class="na"><td>' + (g.cat === 'magic' ? extLink(AID.item(g.name), g.name) : esc(g.name)) + (g.rarity ? ' <em class="rar">' + g.rarity + '</em>' : '') + '</td><td colspan="3">' + (s.tier < g.minTier ? 'Needs a larger market' : 'None in stock this week') + '</td></tr>'; continue; }
      h += '<tr class="prow' + (market.why === g.i ? ' on' : '') + '"><td><button type="button" class="link whyb" data-mk="why" data-v="' + g.i + '" aria-expanded="' + (market.why === g.i) + '" title="Why this price?">' + esc(g.name) + '</button>' + (g.cat === 'magic' ? ' ' + extLink(AID.item(g.name), 'AideDD') : '') + (g.rarity ? ' <em class="rar">' + g.rarity + '</em>' : '') + '</td><td class="num">' + coinHtml(here[g.i]) + '</td><td>' + changeTag(here[g.i] / hist[23][g.i] - 1) + '</td><td>' + spark(hist.map((p) => p[g.i])) + '</td></tr>' + (market.why === g.i ? '<tr class="whyrow"><td colspan="4">' + whyHtml(s, g, day) + '</td></tr>' : '');
    }
    h += '</tbody></table></details>';
  }
  // trade with neighbours
  const opps = [], cheaper = [];
  for (const [n, dist] of neighbours(s)) {
    const there = pricesFor(n, day);
    for (const g of GOODS) {
      if (g.cat === 'magic' || g.tags.includes('lodging') || g.tags.includes('meal')) continue;
      if (!inStock(s, g, day) || !inStock(n, g, day)) continue;
      const haul = dist * 0.004;
      const out = there[g.i] / here[g.i] - 1 - haul, inn = here[g.i] / there[g.i] - 1 - haul;
      if (out > 0.18 && !(n.tier === 1 && g.base >= 1)) opps.push([out, g, n, dist, there[g.i]]);
      if (inn > 0.25) cheaper.push([inn, g, n, dist, there[g.i]]);
    }
  }
  const best = (arr) => { arr.sort((a, b) => b[0] - a[0]); const seen = new Set(); return arr.filter((o) => (seen.has(o[1].i) ? false : seen.add(o[1].i))).slice(0, 5); };
  const route = (o, buyHere) => '<li><div><b>' + esc(o[1].name) + '</b><small>' + (buyHere ? 'Buy here ' + money(here[o[1].i]) + ', sell in ' : 'Sells for ' + money(o[4]) + ' in ') + '<button type="button" class="link" data-mk="town" data-v="' + esc(o[2].id) + '">' + esc(o[2].name) + '</button>' + (buyHere ? ' for ' + money(o[4]) : '') + ' · ' + Math.round(o[3]) + ' mi, ' + (o[3] / 24).toFixed(1) + ' days</small></div><span class="chg up">' + pct(o[0]) + '</span></li>';
  const bo = best(opps), bc = best(cheaper);
  h += '<section><h3>Trade runs</h3>' + (bo.length ? '<p class="meta">Profit after carriage costs (about 0.4% per mile by wagon).</p><ul class="routes">' + bo.map((o) => route(o, true)).join('') + '</ul>' : '<p class="meta">No neighbour pays enough more to make a trade run worthwhile today.</p>') +
    (bc.length ? '<h4>Cheaper nearby</h4><ul class="routes">' + bc.map((o) => route(o, false)).join('') + '</ul>' : '') + '</section>';
  h += '<p class="hint">Base prices are from the Player\'s Handbook; magic items use the Dungeon Master\'s Guide rarity price bands. Local supply, season, distance from a city and events move them.</p>';
  h += '<div class="actions"><button type="button" class="btn" data-mk="profile">Settlement profile</button><button type="button" class="btn" data-act="openpeople">Residents</button><button type="button" class="btn" data-mk="declare">Declare an event here</button></div>';
  return h;
}
function eventDetail(e, day) {
  const C = EVT[e.type];
  const total = e.end - e.start, done = clamp(day - e.start, 0, total);
  let h = '<div class="ev-h">' + evIcon(e.type, 34) + '<div><div class="eyebrow">' + C.name + ' · ' + sevName(e.I) + (e.user ? ' · declared by you' : '') + '</div><h3 class="town-name">' + esc(e.name) + '</h3></div></div>';
  h += '<div class="prog"><div style="width:' + (done / total * 100).toFixed(1) + '%"></div></div><p class="meta">' + dateText(e.start) + ' to ' + dateText(e.end - 1) + ' · ' + (day < e.start ? 'starts in ' + (e.start - day) + ' days' : day >= e.end ? 'over' : 'day ' + (done + 1) + ' of ' + total) + '</p>' + eventWhere(e);
  h += '<p>' + C.blurb + '</p><p class="hook"><b>Adventure hook:</b> ' + C.hook + '</p>';
  const ref = clamp(day, e.start, e.end - 1);
  const aff = [];
  const pool = e.type === 'war' || e.realm ? SET.filter((s) => s.tier >= 2) : (() => { const a = []; const r = Math.max(radiusAt(e, ref), 1); SGRID.query(e.x - r, e.y - r, e.x + r, e.y + r, (s) => a.push(s)); return a; })();
  for (const s of pool) { const f = impact(e, s, localInfo(s), ref); if (f > 0.03) aff.push([f, s]); }
  aff.sort((a, b) => b[0] - a[0] || b[1].tier - a[1].tier);
  h += '<section><h3>Settlements affected (' + aff.length + ')</h3>' + (aff.length ? '<ul class="aff">' + aff.slice(0, 14).map(([f, s]) => '<li><button type="button" class="link" data-mk="town" data-v="' + esc(s.id) + '">' + esc(s.name) + '</button><small>' + sizeOf(s).name + '</small><i><em style="width:' + Math.round(f * 100) + '%"></em></i></li>').join('') + '</ul>' : '<p class="meta">No settlements in reach.</p>') + '</section>';
  const top = GOODS.map((g) => [GOOD_EFF[g.i][TIDX[e.type]], g]).filter((x) => x[0]).sort((a, b) => b[0] - a[0]);
  const up = top.filter((x) => x[0] > 0).slice(0, 5), dn = top.filter((x) => x[0] < 0).slice(-3);
  h += '<section><h3>Price pressure at the centre</h3><ul class="movers">' + up.concat(dn).map(([v, g]) => '<li><span>' + esc(g.name) + '</span>' + changeTag(v * e.I) + '</li>').join('') + '</ul></section>';
  h += '<div class="actions"><button type="button" class="btn" data-mk="fly" data-v="' + esc(e.id) + '">Show on map again</button>' + (day < e.end ? '<button type="button" class="btn danger" data-mk="end" data-v="' + esc(e.id) + '">' + (e.user ? 'Remove event' : 'Call it off') + '</button>' : '') + '<button type="button" class="btn" data-mk="back">All events</button></div>';
  return h;
}
function eventsTab(day) {
  if (sel && sel.kind === 'event') { const e = findEvent(sel.id); if (e) return eventDetail(e, day); }
  const win = eventsWindow(day);
  const act = sortEvents(win.filter((e) => e.start <= day && day < e.end));
  const soon = win.filter((e) => e.start > day && e.start <= day + 14 && (e.type !== 'festival' || (SBY.get(e.sid) || {}).tier >= 3 || e.realm)).sort((a, b) => a.start - b.start);
  let h = '<section><h3>Now (' + act.length + ')</h3>' + (act.length ? '<ul class="evlist">' + act.map((e) => evRow(e, day)).join('') + '</ul>' : '<p class="meta">Nothing is happening anywhere today.</p>') + '</section>';
  h += '<section><h3>Next two weeks</h3>' + (soon.length ? '<ul class="evlist">' + soon.slice(0, 15).map((e) => evRow(e, day)).join('') + '</ul>' : '<p class="meta">Nothing on the horizon.</p>') + '</section>';
  // declare form
  const s = market.sid ? SBY.get(market.sid) : null;
  const F = market.form;
  h += '<section class="declare" id="mkDeclare"><h3>Declare an event</h3>';
  if (!s) h += '<p class="meta">Tap a settlement on the map first, then come back here.</p>';
  else {
    h += '<p class="meta">At <b>' + esc(s.name) + '</b>, starting today. A war is declared between its realm and the nearest neighbouring realm.</p>' +
      '<div class="field"><span class="lab">Type</span>' + seg('mktype', F.type, ETYPES.map((t) => [t, t === 'boom' ? 'Boom' : EVT[t].name])).replace(/data-act=/g, 'data-mk=') + '</div>' +
      '<div class="field"><span class="lab">Severity</span>' + seg('mksev', F.sev, [['mild', 'Mild'], ['serious', 'Serious'], ['dire', 'Dire']]).replace(/data-act=/g, 'data-mk=') + '</div>' +
      '<div class="field"><label class="lab" for="mk-dur">Lasts (days)</label><input id="mk-dur" type="number" min="1" max="720" inputmode="numeric" value="' + (F.dur || EVT[F.type].dur) + '"></div>' +
      '<div class="actions"><button type="button" class="btn primary" data-mk="create">Declare ' + EVT[F.type].name.toLowerCase() + '</button></div>';
  }
  return h + '</section>';
}
function marketPanel() {
  const day = market.day;
  let body;
  if (market.tab === 'town') body = townTab(day);
  else if (market.tab === 'events') body = eventsTab(day);
  else if (market.tab === 'bounties') body = bountiesTab(day);
  else if (market.tab === 'shop') body = shopTab(day);
  else body = overviewTab(day);
  return marketHeader() + '<div class="mk-body">' + body + '</div>';
}
function marketAfterRender() { if (tool === 'market' && market.tab === 'overview') wireChart(); }
function refreshMarket() {
  if ($('calDate')) $('calDate').firstChild.nodeValue = dateText(market.day);
  if (tool !== 'market') { requestRender(); return; }
  const a = document.activeElement;
  if (a && $('inspector').contains(a) && (a.tagName === 'INPUT' || a.tagName === 'SELECT' || a.tagName === 'TEXTAREA')) { const d = $('mkDate'); if (d) d.textContent = dateText(market.day); }
  else renderPanel();
  requestRender();
}
function advanceDays(n) {
  const before = market.day;
  market.day = Math.max(0, market.day + n);
  if (n > 0 && layers.events) {
    const fresh = sortEvents(eventsWindow(market.day).filter((e) => e.start > before && e.start <= market.day && (e.type === 'war' || e.type === 'plague' || e.type === 'famine' || ((e.type === 'bandits' || e.type === 'boom') && n <= 1))));
    if (fresh.length) toast(EVT[fresh[0].type].name + ': ' + fresh[0].name + (fresh.length > 1 ? ' (and ' + (fresh.length - 1) + ' more)' : ''));
  }
  scheduleSave();
  refreshMarket();
}
function setPlaying(on) {
  market.playing = on;
  clearInterval(marketTimer);
  if (on) marketTimer = setInterval(() => { if (!document.hidden) advanceDays(1); }, market.speed);
  renderCal();
  if (tool === 'market') renderPanel();
}
function selectTown(id, fly) {
  const s = SBY.get(id);
  if (!s) return;
  if (tool !== 'market') setTool('market', true);
  market.sid = id; market.tab = 'town';
  sel = { kind: 'settle', id };
  renderPanel(); requestRender();
  if (fly) flyTo(s.x, s.y, Math.max(view.s, { 4: 2, 3: 4, 2: 12, 1: 30 }[s.tier]));
}
$('inspector').addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-mk]');
  if (!b) return;
  const k = b.dataset.mk, v = b.dataset.v;
  switch (k) {
    case 'day': advanceDays(+v); break;
    case 'play': setPlaying(!market.playing); break;
    case 'mkspeed': market.speed = +v; setPlaying(true); break;
    case 'tab': if (v === market.tab && !(sel && sel.kind === 'event')) { panelMin = true; renderPanel(); break; } market.tab = v; if (v !== 'events' && sel && sel.kind === 'event') sel = null; if (v === 'town' && market.sid) sel = { kind: 'settle', id: market.sid }; renderPanel(); requestRender(); break;
    case 'event': openEvent(findEvent(v)); break;
    case 'fly': flyToEvent(findEvent(v)); break;
    case 'town': selectTown(v, true); break;
    case 'why': { const gi = +v; market.why = market.why === gi ? null : gi; if (market.tab !== 'town') market.tab = 'town'; const el = $('inspector'), top = el.scrollTop; renderPanel(); el.scrollTop = top; const r = el.querySelector('.whyrow'); if (r && market.why != null) r.scrollIntoView({ block: 'nearest' }); break; }
    case 'back': sel = null; renderPanel(); requestRender(); break;
    case 'profile': if (market.sid) { setTool('explore', false, true); sel = { kind: 'settle', id: market.sid }; renderPanel(); requestRender(); } break;
    case 'declare': market.tab = 'events'; if (sel && sel.kind === 'event') sel = null; renderPanel(); { const f = $('mkDeclare'); if (f) f.scrollIntoView({ block: 'start', behavior: 'smooth' }); } break;
    case 'mktype': market.form.type = v; market.form.dur = ''; renderPanel(); break;
    case 'mksev': market.form.sev = v; renderPanel(); break;
    case 'end': {
      const e = findEvent(v);
      if (!e) break;
      if (e.user) commit('Remove event', () => { edits.events = (edits.events || []).filter((q) => q.id !== e.id); }, {});
      else commit('Call off ' + EVT[e.type].name.toLowerCase(), () => { edits.evOff = Object.assign({}, edits.evOff, { [e.id]: 1 }); }, {});
      sel = null; renderPanel(); requestRender();
      toast(e.name + ' has been called off. Undo brings it back.');
      break;
    }
    case 'create': {
      const s = market.sid ? SBY.get(market.sid) : null;
      if (!s) break;
      const F = market.form, C = EVT[F.type];
      const durIn = $('mk-dur');
      const dur = clamp(Math.round(+(durIn ? durIn.value : C.dur) || C.dur), 1, 720);
      const id = 'ue' + edits.next;
      const rr = T.mulberry(hashStr(id) ^ SEED);
      const name = F.type === 'war' ? 'War declared from ' + s.name : F.type === 'bandits' ? 'The ' + PRE[Math.floor(rr() * PRE.length)] + ' ' + GANGS[Math.floor(rr() * GANGS.length)] + ' near ' + s.name
        : F.type === 'famine' ? 'Famine in the ' + s.name + ' country' : F.type === 'plague' ? DISEASES[Math.floor(rr() * DISEASES.length)].replace(/^the /, 'The ') + ' in ' + s.name
          : F.type === 'festival' ? s.name + ' ' + FESTS[Math.floor(rr() * FESTS.length)] : F.type === 'boom' ? (BOOMS[s.b] || 'Trade boom') + ' at ' + s.name : 'Feast at ' + s.name;
      const ue = { id, type: F.type, sid: s.id, start: market.day, dur, sev: SEV[F.sev], r: (C.r || 0) * (F.sev === 'dire' ? 1.3 : F.sev === 'mild' ? 0.7 : 1), name };
      commit('Declare ' + C.name.toLowerCase(), () => { edits.next++; edits.events = (edits.events || []).concat([ue]); }, {});
      sel = { kind: 'event', id }; market.tab = 'events';
      renderPanel(); requestRender();
      toast(name + ' declared.');
      break;
    }
  }
});
$('inspector').addEventListener('change', (ev) => { if (ev.target.id === 'mk-dur') market.form.dur = ev.target.value; });

// ---------------------------------------------------------------- map layer: event areas, icons and price rings
function eventVisible(e) {
  if (e.type === 'festival' || e.type === 'feast') { if (e.realm) return view.s < 2; const s = SBY.get(e.sid); return !!s && view.s >= TIER_VIS[s.tier] && view.s < 4000; }
  return view.s < 4000;
}
// cut a line to a box so long dashed lines only dash the part on screen (Liang-Barsky)
function clipSeg(x0, y0, x1, y1, xa, ya, xb, yb) {
  let t0 = 0, t1 = 1;
  const dx = x1 - x0, dy = y1 - y0;
  for (const [p, q] of [[-dx, x0 - xa], [dx, xb - x0], [-dy, y0 - ya], [dy, yb - y0]]) {
    if (p === 0) { if (q < 0) return null; continue; }
    const t = q / p;
    if (p < 0) { if (t > t1) return null; if (t > t0) t0 = t; } else { if (t < t0) return null; if (t < t1) t1 = t; }
  }
  return [x0 + dx * t0, y0 + dy * t0, x0 + dx * t1, y0 + dy * t1];
}
function drawEventAreas() {
  if (!layers.events || view.s >= 3000) return;
  const day = market.day;
  ctx.save();
  for (const e of activeOn(day)) {
    if (!eventVisible(e)) continue;
    const C = EVT[e.type];
    const chosen = sel && sel.kind === 'event' && sel.id === e.id;
    if (e.type === 'war') {
      const A = SBY.get(e.a), Bc = SBY.get(e.b);
      if (!A || !Bc) continue;
      ctx.strokeStyle = C.col; ctx.globalAlpha = chosen ? 0.95 : 0.7; ctx.lineWidth = chosen ? 3 : 2; ctx.setLineDash([9, 6]);
      const seg = clipSeg(sx(A.x), sy(A.y), sx(Bc.x), sy(Bc.y), -20, -20, vw + 20, vh + 20);
      if (seg) { ctx.lineDashOffset = Math.hypot(seg[0] - sx(A.x), seg[1] - sy(A.y)); ctx.beginPath(); ctx.moveTo(seg[0], seg[1]); ctx.lineTo(seg[2], seg[3]); ctx.stroke(); ctx.lineDashOffset = 0; }
      ctx.setLineDash([]);
      for (const c of [A, Bc]) { ctx.beginPath(); ctx.arc(sx(c.x), sy(c.y), 15, 0, Math.PI * 2); ctx.stroke(); }
      continue;
    }
    if (e.realm) continue;
    const r = radiusAt(e, day) * view.s;
    if (r < 8 || r > Math.max(vw, vh) * 3) continue;
    const X = sx(e.x), Y = sy(e.y);
    if (X + r < 0 || X - r > vw || Y + r < 0 || Y - r > vh) continue;
    const far = Math.max(Math.hypot(X, Y), Math.hypot(vw - X, Y), Math.hypot(X, vh - Y), Math.hypot(vw - X, vh - Y));
    const peak = (chosen ? 0x55 : 0x38) / 255;
    if (far < r) {
      // the whole view sits inside the area: a flat tint, no off-screen outline to trace
      ctx.globalAlpha = peak * Math.max(0, 1 - Math.hypot(vw / 2 - X, vh / 2 - Y) / r); ctx.fillStyle = C.col; ctx.fillRect(0, 0, vw, vh);
      continue;
    }
    const g = ctx.createRadialGradient(X, Y, 0, X, Y, r);
    g.addColorStop(0, C.col + (chosen ? '55' : '38')); g.addColorStop(1, C.col + '00');
    ctx.globalAlpha = 1; ctx.fillStyle = g;
    if (r > Math.max(vw, vh)) ctx.fillRect(0, 0, vw, vh);
    else { ctx.beginPath(); ctx.arc(X, Y, r, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = C.col; ctx.globalAlpha = chosen ? 0.9 : 0.5; ctx.lineWidth = chosen ? 2 : 1.2; ctx.setLineDash([6, 5]);
    ctx.beginPath();
    if (r > Math.max(vw, vh)) { const a = Math.atan2(vh / 2 - Y, vw / 2 - X), half = Math.min(Math.PI, Math.asin(Math.min(1, Math.hypot(vw, vh) / r)) + 0.15); ctx.arc(X, Y, r, a - half, a + half); }
    else ctx.arc(X, Y, r, 0, Math.PI * 2);
    ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.restore();
}
const EV_PATHS = {};
function evPath(type) { return EV_PATHS[type] || (EV_PATHS[type] = new Path2D(EVT[type].path)); }
function drawEventIcons() {
  const day = market.day;
  // price rings while the market is open
  if (tool === 'market') {
    for (const m of markers) {
      if (m.kind !== 'settle' || m.r > 9) continue;
      const s = SBY.get(m.id);
      if (!s) continue;
      const v = basketIndex(s, day);
      const col = v < 0.93 ? '#5fae6e' : v > 1.35 ? '#e0583f' : v > 1.1 ? '#e0a83b' : null;
      if (!col) continue;
      const rr = s.tier >= 3 ? 11 : s.tier === 2 ? 8.5 : 6.5;
      ctx.strokeStyle = 'rgba(20,16,10,0.7)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(m.X, m.Y, rr, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = 2.6; ctx.stroke();
      // an arrow as well as a colour: up for dear, two for very dear, down for cheap
      const n = v > 1.35 ? 2 : 1, up = v > 1;
      for (let k = 0; k < n; k++) { const ax = m.X + rr * 0.95 + 5 + k * 7, ay = m.Y - rr * 0.95; ctx.beginPath(); if (up) { ctx.moveTo(ax, ay - 4); ctx.lineTo(ax + 3.6, ay + 2.5); ctx.lineTo(ax - 3.6, ay + 2.5); } else { ctx.moveTo(ax, ay + 4); ctx.lineTo(ax + 3.6, ay - 2.5); ctx.lineTo(ax - 3.6, ay - 2.5); } ctx.closePath(); ctx.fillStyle = col; ctx.strokeStyle = 'rgba(20,16,10,0.85)'; ctx.lineWidth = 1.4; ctx.stroke(); ctx.fill(); }
    }
    if (market.sid && sel && sel.kind === 'settle' && sel.id === market.sid) { /* selection ring is drawn by the overlay */ }
  }
  if (!layers.events) return;
  for (const e of activeOn(day)) {
    if (!eventVisible(e)) continue;
    let X = sx(e.x), Y = sy(e.y);
    if (e.type !== 'war') { X += e.realm ? -15 : 14; Y -= 14; }
    if (X < -20 || X > vw + 20 || Y < -20 || Y > vh + 20) continue;
    const C = EVT[e.type];
    const chosen = sel && sel.kind === 'event' && sel.id === e.id;
    ctx.fillStyle = C.col; ctx.strokeStyle = '#f3ead2'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(X, Y, 10.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.translate(X - 7.2, Y - 7.2); ctx.scale(0.6, 0.6);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.stroke(evPath(e.type)); ctx.restore();
    if (chosen) { ctx.strokeStyle = '#e2c37a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X, Y, 15, 0, Math.PI * 2); ctx.stroke(); }
    markers.push({ kind: 'event', id: e.id, X, Y, r: 13 });
  }
}
function marketSummary(s) {
  const day = market.day, mods = modsFor(s, day), v = basketIndex(s, day);
  return '<section><h3>Market today</h3><p class="meta">' + dateText(day) + ' · prices at <b>' + Math.round(v * 100) + '%</b> of normal</p>' +
    (mods.length ? '<ul class="evlist compact">' + mods.slice(0, 3).map(([, , e]) => evRow(e, day)).join('') + '</ul>' : '') +
    '<div class="actions"><button type="button" class="btn" data-act="openmarket">Open market board</button></div></section>';
}
