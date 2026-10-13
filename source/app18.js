
// ================================================================ places in towns, aldermen, activity heat map (v19)
// Every town has named places tied to real buildings on its street plan: the seat of power, the market, temples,
// taverns and inns, the gaol and barracks, guild branches, a bank, docks, every shopkeeper's shop and the districts.
// People's daily routines happen at these places, and any mention of one links to it on the map.
const TAV_A = ['Rusty', 'Golden', 'Prancing', 'Sleeping', 'Drowned', 'Laughing', 'Crooked', 'Silver', 'Black', 'Jolly', 'Wandering', 'Hungry', 'Merry', 'Grey', 'Red', 'Blind', 'Salty', 'Copper', 'Gilded', 'Howling', 'Lucky', 'Weary', 'Painted', 'Dancing'];
const TAV_N = ['Anchor', 'Goose', 'Pony', 'Dragon', 'Rat', 'Stag', 'Lantern', 'Barrel', 'Boar', 'Maiden', 'Owl', 'Kettle', 'Crown', 'Fox', 'Mermaid', 'Hound', 'Wyvern', 'Bell', 'Tankard', 'Griffin', 'Badger', 'Plough', 'Harp', 'Mule'];
const SHOP_NOUN = {
  Baker: 'Bakery', Blacksmith: 'Smithy', Butcher: "Butcher's", Tailor: "Tailor's", Shoemaker: "Cobbler's", Jeweller: 'Jewellery', Miller: 'Mill', Carpenter: 'Workshop', Mason: 'Stoneyard',
  Weaver: 'Weaving Shed', Chandler: 'Chandlery', Cooper: 'Cooperage', Barber: "Barber's", Pastrycook: 'Pastry Shop', Furrier: "Furrier's", Mercer: 'Mercery', 'Spice merchant': 'Spice House',
  'Wine-seller': 'Wine Shop', 'Beer-seller': 'Beer Shop', Fishmonger: 'Fish Stall', Bookseller: 'Bookshop', 'Magic shop owner': 'Curiosities', Physician: 'Surgery', Herbalist: 'Herb Shop',
  Locksmith: "Locksmith's", Saddler: 'Saddlery', Tanner: 'Tannery', 'Bathhouse keeper': 'Bathhouse', Merchant: 'Trading House', Moneylender: 'Countinghouse', Pawnbroker: 'Pawnshop',
  Scribe: 'Scriptorium', Copyist: 'Scriptorium', Hatmaker: "Hatter's", Glovemaker: "Glover's", Cutler: "Cutler's", Painter: 'Studio', Sculptor: 'Studio', Woodcarver: 'Workshop',
  Ropemaker: 'Ropewalk', 'Harness maker': 'Harness Shop', 'Scabbard maker': 'Workshop', Roofer: 'Yard', Bookbinder: 'Bindery', Illuminator: 'Studio', 'Horse breeder': 'Stud Farm', Midwife: 'House'
};
const KEEPER_JOB = /^(Tavern keeper|Ale-house keeper)$/;
function shopNameOf(p) {
  if (!p || KEEPER_JOB.test(p.job) || p.job === 'Innkeeper') return null;
  const noun = SHOP_NOUN[p.job] || (p.group === 'craft' ? 'Workshop' : p.group === 'trade' ? 'Shop' : null);
  return noun ? (p.last || p.first) + "'s " + noun : null;
}
const PLACE_COL = { hall: '#b9483a', market: '#d6b04c', temple: '#efe6c8', tavern: '#d9a441', inn: '#c47a50', law: '#6f87a6', guild: '#3f9a87', money: '#c9a253', work: '#5a8aa0', shop: '#b98a52', district: '#a89a7c' };
const KIND_NAME = { hall: 'Seat of power', market: 'Market', temple: 'Temple', tavern: 'Tavern', inn: 'Inn', law: 'Law and order', guild: 'Guild branch', money: 'Money', work: 'Waterfront', shop: 'Shop', district: 'District' };
const GUILD_PLACE = {
  merchants: ['', 'the Trading Post', "the Merchants' Guildhall", "the Merchants' Exchange"],
  crafts: ['', 'the Craft Lodge', 'the Guild Halls', 'the Hall of Masters'],
  mages: ['', 'the Circle House', "the Mages' Tower", 'the High Tower'],
  thieves: ['', 'the Cell', 'the Den', 'the Shadow Court']
};
const placeCache = new Map();
function placesOf(s) {
  const key = s.id + '|' + s.pop + '|' + s.tier + '|' + s.name + '|' + mkVer;
  const c = placeCache.get(s.id);
  if (c && c.key === key) return c;
  const z = sizeOf(s).k, h = hashStr(s.id) & 0x7fffffff, rng = T.mulberry(h ^ 0x51ac9);
  const pick = (a) => a[Math.floor(rng() * a.length)];
  const list = [], by = new Map();
  const add = (k, name, kind, extra) => { const o = Object.assign({ key: k, name, kind, sid: s.id }, extra || {}); list.push(o); by.set(k, o); return o; };
  const res = residents(s);
  const lead = townPeople(s, LEADERS[s.tier].length).list.map(withOv);
  const lordTown = s.tier === 2 && T.hash(h, 1, 1605) >= 0.5;
  add('hall', { hamlet: "the Elder's House", village: "the Reeve's House", town: lordTown ? 'the Manor' : 'the Town Hall', city: 'the Citadel', metropolis: isCapital(s) ? 'the Royal Palace' : 'the Great Hall' }[z], 'hall', { owner: lead[0] && lead[0].id });
  add('market', z === 'hamlet' || z === 'village' ? 'the Village Green' : 'the Market Square', 'market');
  templesOf(s).forEach((t, i) => add('temple' + i, t.name, 'temple', { god: t.god, dom: t.dom }));
  const P = profile(s), cnt = (n) => (P.trades.find((t) => t[0] === n) || [0, 0])[1];
  const used = new Set();
  const tavName = () => { let n = ''; for (let k = 0; k < 12 && (!n || used.has(n)); k++) n = 'The ' + pick(TAV_A) + ' ' + pick(TAV_N); used.add(n); return n; };
  const keepers = res.filter((p) => KEEPER_JOB.test(p.job)), innk = res.filter((p) => p.job === 'Innkeeper');
  const nT = Math.min(6, Math.max(cnt('Taverns'), keepers.length)), nI = Math.min(3, Math.max(cnt('Inns'), innk.length));
  for (let i = 0; i < nT; i++) add('tav' + i, tavName(), 'tavern', { owner: keepers[i] && keepers[i].id });
  for (let i = 0; i < nI; i++) add('inn' + i, tavName(), 'inn', { owner: innk[i] && innk[i].id });
  if (z === 'village') add('watch', "the Constable's House", 'law');
  if (z === 'town') add('gaol', 'the Gaol', 'law');
  if (z === 'city' || z === 'metropolis') { add('gaol', 'the City Gaol', 'law'); add('barracks', 'the Barracks', 'law'); }
  for (const k of GUILDS) {
    const lv = guildLevel(s, k);
    if (!lv) continue;
    if (k === 'adventurers') { const R = roster(s); add('g:adventurers', R ? R.hall : "the Adventurers' Hall", 'guild', { org: k, owner: R && R.list[0].id }); continue; }
    let name = GUILD_PLACE[k][lv];
    if (k === 'thieves' && isPlayer()) continue;
    if (k === 'thieves' && by.has('tav0')) name += ' (beneath ' + by.get('tav0').name + ')';
    add('g:' + k, name, 'guild', { org: k, secret: k === 'thieves' });
  }
  const rich = res.filter((p) => p.group === 'trade' && p.last).sort((a, b) => b.life - a.life || a.idx - b.idx);
  if ((z === 'city' || z === 'metropolis') && rich.length) add('bank', 'the Bank of ' + rich[0].last + (rich[1] && rich[1].last !== rich[0].last ? ' & ' + rich[1].last : ''), 'money', { owner: rich[0].id });
  else if (z === 'town' && rich.length) add('bank', rich[0].last + "'s Countinghouse", 'money', { owner: rich[0].id });
  if ((z === 'city' || z === 'metropolis') && (s.coastal || planMeta(s).seaD < 5)) { add('docks', 'the Docks', 'work'); if (rich.length) add('warehouse', (rich[rich.length > 2 ? 2 : 0].last) + ' & Sons Warehouse', 'work', { owner: rich[rich.length > 2 ? 2 : 0].id }); }
  districtsOf(s).forEach((d, i) => add('dist' + i, d.name, 'district', { a: d.a, r: d.r, di: i }));
  const out = { key, list, by };
  placeCache.set(s.id, out);
  if (placeCache.size > 200) placeCache.delete(placeCache.keys().next().value);
  return out;
}
function placeGet(s, key) {
  if (!s || !key) return null;
  if (key.startsWith('shop:')) { const p = npcById(key.slice(5)); const n = shopNameOf(p); return n ? { key, name: n, kind: 'shop', sid: s.id, owner: p.id } : null; }
  return placesOf(s).by.get(key) || null;
}
const placeLink = (s, key, label) => { const pl = placeGet(s, key); return pl ? '<button type="button" class="link place" data-place="' + esc(s.id + '|' + key) + '">' + esc(label || pl.name) + '</button>' : esc(label || ''); };
// a person's own workplace, if they run one
function ownPlaceKey(p, s) {
  if (!p || !s) return null;
  const L = placesOf(s).list.find((o) => o.owner === p.id && (o.kind === 'tavern' || o.kind === 'inn' || o.kind === 'money' || o.kind === 'hall' || o.key === 'warehouse' || o.key === 'g:adventurers'));
  if (L) return L.key;
  return shopNameOf(p) ? 'shop:' + p.id : null;
}

// ---------------------------------------------------------------- where each place stands on the street plan
const spotCache = new WeakMap();
function placePos(s, key) {
  const P = getPlan(s);
  let m = spotCache.get(P);
  if (!m) { m = new Map(); spotCache.set(P, m); }
  if (m.has(key)) return m.get(key);
  // houses by distance from the market, for places that need a spot of their own
  if (!m._houses) { const hs = []; for (let i = 0; i < P.n; i++) if (P.bk[i] === 0) hs.push([Math.hypot(P.bx[i] - s.x, P.by[i] - s.y), i]); hs.sort((a, b) => a[0] - b[0]); m._houses = hs.map((x) => x[1]); m._used = new Set(); }
  const H = m._houses, used = m._used, R = settleR(s);
  const at = (i) => (i >= 0 ? { x: P.bx[i], y: P.by[i], i } : null);
  const band = (lo, hi, salt) => { if (!H.length) return null; const n = H.length; let j = Math.floor((lo + (hi - lo) * T.hash(hashStr(s.id + key) & 0xffff, salt || 0, 1701)) * n); for (let t = 0; t < n; t++) { const i = H[(j + t) % n]; if (!used.has(i)) { used.add(i); return at(i); } } return at(H[0]); };
  const nearPt = (x, y) => { let b = -1, bd = 1e9; for (let i = 0; i < P.n; i++) { if (P.bk[i] !== 0 || used.has(i)) continue; const d = Math.hypot(P.bx[i] - x, P.by[i] - y); if (d < bd) { bd = d; b = i; } } if (b >= 0) used.add(b); return b >= 0 ? at(b) : { x, y, i: -1 }; };
  const dpt = (name) => { const d = placesOf(s).list.find((o) => o.kind === 'district' && o.name === name && o.a != null); if (!d) return null; const r = R * (d.r || 0.6); return [s.x + Math.cos(d.a) * r, s.y + Math.sin(d.a) * r]; };
  const pl = placeGet(s, key);
  let out = null;
  if (!pl) out = { x: s.x, y: s.y, i: -1 };
  else if (key === 'market') out = { x: s.x, y: s.y, i: -1 };
  else if (pl.kind === 'district') { const r = R * (pl.r || 0.6); out = pl.a == null ? { x: s.x, y: s.y, i: -1 } : { x: s.x + Math.cos(pl.a) * r, y: s.y + Math.sin(pl.a) * r, i: -1 }; }
  else if (key === 'hall') { let k = -1; for (let i = 0; i < P.n; i++) if (P.bk[i] === 2) { k = i; break; } out = k >= 0 ? at(k) : pl.owner && npcById(pl.owner) ? (() => { const L = npcLocation(npcById(pl.owner)); return L ? { x: L.x, y: L.y, i: -1 } : band(0, 0.1); })() : band(0, 0.1); }
  else if (key === 'temple0') { let k = -1; for (let i = 0; i < P.n; i++) if (P.bk[i] === 1) { k = i; break; } out = k >= 0 ? at(k) : band(0, 0.2); }
  else if (pl.kind === 'temple') { const d = dpt('Temple Ward'); out = d ? nearPt(d[0] + (T.hash(hashStr(key), 1, 1702) - 0.5) * R * 0.2, d[1] + (T.hash(hashStr(key), 2, 1702) - 0.5) * R * 0.2) : band(0.05, 0.45); }
  else if (pl.owner && (pl.kind === 'tavern' || pl.kind === 'inn' || pl.kind === 'shop' || key === 'g:adventurers')) { const p = npcById(pl.owner); const L = p ? npcLocation(p) : null; out = L ? { x: L.x, y: L.y, i: -1 } : band(0.05, 0.5); }
  else if (key === 'g:thieves') { if (placeBy(s, 'tav0')) out = placePos(s, 'tav0'); else { const d = dpt('The Warrens'); out = d ? nearPt(d[0], d[1]) : band(0.4, 0.8); } }
  else if (key === 'barracks') { const d = dpt('Garrison'); out = d ? nearPt(d[0], d[1]) : band(0.3, 0.6); }
  else if (key === 'bank') { const d = dpt("Merchants' Row") || dpt('Noble Quarter'); out = d ? nearPt(s.x + (d[0] - s.x) * 0.5, s.y + (d[1] - s.y) * 0.5) : band(0, 0.12); }
  else if (key === 'docks' || key === 'warehouse') { const M = planMeta(s), d = dpt('Docks'); const tx = d ? d[0] : s.x + Math.cos(M.seaA) * R * 0.85, ty = d ? d[1] : s.y + Math.sin(M.seaA) * R * 0.85; out = nearPt(tx + (key === 'warehouse' ? R * 0.08 : 0), ty); }
  else if (pl.kind === 'guild') out = band(0.02, 0.3);
  else if (pl.kind === 'law') out = band(0.1, 0.35);
  else out = band(0.05, 0.5);
  if (!out) out = { x: s.x, y: s.y, i: -1 };
  m.set(key, out);
  return out;
}
const placeBy = (s, key) => placesOf(s).by.get(key);
function districtAt(s, x, y) {
  const ds = placesOf(s).list.filter((o) => o.kind === 'district');
  if (!ds.length) return null;
  const R = settleR(s), r = Math.hypot(x - s.x, y - s.y) / R;
  if (r < 0.28) return ds.find((d) => d.a == null && d.name === 'Market Ward') || null;
  const a = Math.atan2(y - s.y, x - s.x);
  let best = null, bd = 9;
  for (const d of ds) if (d.a != null) { const q = angDiff(a, d.a); if (q < bd) { bd = q; best = d; } }
  return best;
}

// ---------------------------------------------------------------- routines that happen at real places
// "with a place|without one": if no fitting place exists in town the plain version is used
const ROUTINE_AT = {
  leader: ['Holding court at {hall}|Holding court', 'Hearing petitions at {hall}|Hearing petitions', 'Going over the accounts', 'Riding out to inspect the farms', 'Entertaining a visiting envoy at {hall}|Entertaining a visiting envoy'],
  faith: ['Leading prayers at {temple}|Leading prayers', 'Tending the sick', 'Hearing confessions at {temple}|Hearing confessions', 'Blessing the fields', 'Copying scripture at {temple}|Copying scripture'],
  watch: ['On patrol in {district}|On patrol', 'Drilling recruits at {barracks}|Drilling recruits', 'Guarding the gate', 'Investigating a theft at {shop}|Investigating a theft', 'Off duty at {tavern}|Off duty at the tavern'],
  craft: ['At work in {own}|At work in the workshop', 'Haggling over materials at {market}|Haggling over materials', 'Training an apprentice at {own}|Training an apprentice', 'Delivering an order to {shop}|Delivering an order'],
  trade: ['Minding the stall at {market}|Minding the stall', 'Counting stock at {own}|Counting stock', 'Negotiating with a supplier at {tavern}|Negotiating with a supplier', 'Writing letters to trading partners'],
  service: ['Serving customers at {own}|Serving customers', 'Cleaning up after a rowdy night at {own}|Cleaning up after a rowdy night', 'Restocking the cellar at {own}|Restocking the cellar', 'Swapping gossip with regulars at {own}|Swapping gossip with regulars'],
  labour: ['Working the fields', 'Hauling goods at {docks}|Hauling goods', 'Mending fences', 'Looking for work at {market}|Looking for work at the market'],
  arcane: ['Studying in seclusion', 'Gathering spell components at {market}|Gathering spell components', 'Experimenting; coloured smoke from the chimney', 'Meeting a client at {tavern}|Meeting a client'],
  underworld: ['Casing {bank} for a heist|Casing a mark', 'Meeting a contact after dark at {tavern}|Meeting a contact after dark', 'Fencing stolen goods behind {shop}|Fencing stolen goods', 'Lying low at {den}|Lying low', 'Staking out {shop}|Casing a mark'],
  adventurer: ['Training in the yard at {advhall}|Training in the yard', 'Drinking at {advhall}|Drinking at the guild hall', 'Reading the quest board at {advhall}|Reading the quest board', 'Mending gear', 'Resting between jobs'],
  rest: ['At worship at {temple}|At worship', 'Resting at home', 'At {tavern} with friends|At the tavern with friends', 'Visiting family']
};
function resolveToken(tok, p, s, r) {
  const L = placesOf(s), list = L.list;
  const of = (kind) => list.filter((o) => o.kind === kind);
  const choose = (arr) => (arr.length ? arr[Math.floor(r * arr.length) % arr.length].key : null);
  switch (tok) {
    case 'hall': return L.by.has('hall') ? 'hall' : null;
    case 'market': return 'market';
    case 'temple': { const t = of('temple'); return t.length ? t[(p.h || 0) % t.length].key : null; }
    case 'tavern': { const own = list.find((o) => o.owner === p.id && (o.kind === 'tavern' || o.kind === 'inn')); return own ? own.key : choose(of('tavern').concat(of('inn'))); }
    case 'district': return choose(of('district').filter((d) => d.a != null));
    case 'barracks': return L.by.has('barracks') ? 'barracks' : L.by.has('gaol') ? 'gaol' : L.by.has('watch') ? 'watch' : null;
    case 'docks': return L.by.has('docks') ? 'docks' : 'market';
    case 'bank': { if (L.by.has('bank')) return 'bank'; const j = residents(s).find((q) => q.id !== p.id && /Jeweller|Mercer|Merchant|Spice/.test(q.job)); return j ? 'shop:' + j.id : null; }
    case 'den': return L.by.has('g:thieves') ? 'g:thieves' : choose(of('tavern'));
    case 'advhall': return L.by.has('g:adventurers') ? 'g:adventurers' : null;
    case 'own': return ownPlaceKey(p, s);
    case 'shop': { const sh = residents(s).filter((q) => q.id !== p.id && shopNameOf(q)); return sh.length ? 'shop:' + sh[Math.floor(r * sh.length) % sh.length].id : null; }
  }
  return null;
}
function routineAt(p, s, group, r, r2, day) {
  const tpl = routineTpl(group, r, day);
  const [withP, plain] = tpl.split('|');
  const m = /\{(\w+)\}/.exec(withP);
  if (!m || !s) return { text: plain || withP };
  const key = resolveToken(m[1], p, s, r2);
  const pl = key ? placeGet(s, key) : null;
  if (!pl) return { text: plain || withP.replace(/ ?(at|in|to|behind)? ?\{\w+\}/, '') };
  return { text: withP.replace('{' + m[1] + '}', pl.name), place: key };
}
// turn the place's name in an activity line into a link to it
function actHtml(text, s, key) {
  const pl = key && s ? placeGet(s, key) : null;
  if (!pl) return esc(text);
  const i = text.indexOf(pl.name);
  if (i < 0) return esc(text);
  return esc(text.slice(0, i)) + placeLink(s, key) + esc(text.slice(i + pl.name.length));
}

// ---------------------------------------------------------------- aldermen: one notable resident speaks for each district
const aldCache = new Map();
function aldermenOf(s) {
  const ds = districtsOf(s);
  if (!ds.length) return [];
  const key = s.id + '|' + mkVer + '|' + market.day;
  const c = aldCache.get(s.id);
  if (c && c.key === key) return c.list;
  const base = townPeople(s).list.map(withOv);
  const nL = LEADERS[s.tier].length;
  const cands = base.filter((p) => p.idx >= nL && p.group !== 'underworld' && p.group !== 'labour' && (p.status || 'Alive') === 'Alive').sort((a, b) => b.life - a.life || a.idx - b.idx);
  const list = ds.map((d, i) => ({ d, p: cands[i] || null }));
  aldCache.set(s.id, { key, list });
  return list;
}
function aldermanOf(p) {
  const s = SBY.get(p.sid);
  if (!s) return null;
  const a = aldermenOf(s).find((x) => x.p && x.p.id === p.id);
  return a ? a.d : null;
}
// extra lines on a person's card: the district they speak for and the place they run
function placeRoleHtml(p) {
  const s = SBY.get(p.sid);
  if (!s) return '';
  const out = [];
  const d = aldermanOf(p);
  if (d) { const L = placesOf(s).list.find((o) => o.kind === 'district' && o.name === d.name); out.push('Alderman of ' + (L ? placeLink(s, L.key) : esc(d.name)) + ', speaking for the district on the city council'); }
  const own = ownPlaceKey(p, s);
  const gone = (p.status || 'Alive') === 'Dead';
  if (own) out.push((own === 'hall' ? (gone ? 'Was seated at ' : 'Seated at ') : gone ? 'Ran ' : 'Runs ') + placeLink(s, own) + (gone && own !== 'hall' ? ' <small>(now in other hands)</small>' : ''));
  return out.length ? '<p class="meta role-line">' + out.join(' · ') + '</p>' : '';
}

// ---------------------------------------------------------------- opening a place: its page in People and its building on the map
let placeHi = null;
function goPlace(sid, key, noFly) {
  const s = SBY.get(sid);
  if (!s || !placeGet(s, key)) return;
  if (tool !== 'people') setTool('people', true);
  people.sid = sid; people.npc = null; people.place = key; panelMin = false;
  placeHi = { sid, key, t: performance.now() };
  renderPanel();
  const el = $('inspector'); if (el) el.scrollTop = 0;
  if (!noFly) {
    const pos = placePos(s, key);
    const target = clamp(Math.min(vw, vh) * 0.42 / (settleR(s) * 0.45), PLAN_S * 2.5, 9000);
    flyVis(pos.x, pos.y, Math.max(view.s < PLAN_S ? target : view.s, PLAN_S * 2.5));
  }
  requestRender();
}
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-place]');
  if (!b) return;
  ev.preventDefault();
  const v = b.dataset.place, i = v.indexOf('|');
  goPlace(v.slice(0, i), v.slice(i + 1));
});
function placeView(s, key, day) {
  const pl = placeGet(s, key);
  if (!pl) return null;
  const pos = placePos(s, key), dist = pl.kind === 'district' ? null : districtAt(s, pos.x, pos.y);
  let h = '<button type="button" class="link back" data-pp="placeback">‹ ' + esc(s.name) + ' residents</button>';
  h += '<div><div class="eyebrow">' + KIND_NAME[pl.kind] + (pl.secret ? ' · secret' : '') + ' · ' + tLink(s) + (dist ? ' · ' + placeLink(s, dist.key) : '') + '</div><h3 class="town-name">' + esc(pl.name) + '</h3></div>';
  const owner = pl.owner ? npcById(pl.owner) : null;
  const desc = {
    hall: 'Where ' + (owner ? pLink(owner) : 'the rulers') + ' ' + (sizeOf(s).k === 'hamlet' ? 'lives and settles disputes' : 'holds court and keeps the records') + '.',
    market: sizeOf(s).k === 'hamlet' || sizeOf(s).k === 'village' ? 'The open green where folk meet, trade and graze their animals.' : 'Stalls, the town well and the busiest crowds in ' + esc(s.name) + '.',
    temple: 'A house of ' + esc(pl.god || 'the gods') + ', a god of ' + (pl.dom || 'many things').toLowerCase() + '.',
    tavern: owner ? 'Run by ' + pLink(owner) + '.' : 'A busy tavern.', inn: owner ? 'Rooms and stabling, run by ' + pLink(owner) + '.' : 'Rooms and stabling for travellers.',
    law: key === 'barracks' ? 'Home of the garrison.' : key === 'gaol' ? 'Cells for debtors, drunks and worse.' : 'Where the constable lives and keeps the stocks.',
    guild: pl.org ? 'The ' + esc(ORGS[pl.org].name) + ' branch in ' + esc(s.name) + ': ' + oLink(pl.org, s.id, BRANCH[pl.org][guildLevel(s, pl.org)].toLowerCase()) + '.' + (owner ? ' Led by ' + pLink(owner) + '.' : '') : '',
    money: owner ? 'Lends, changes money and holds deposits. Owned by ' + pLink(owner) + '.' : 'Money-changers.',
    work: key === 'docks' ? 'Quays, cranes and warehouses on the sea road.' : owner ? 'Owned by ' + pLink(owner) + '.' : '',
    shop: owner ? 'Run by ' + pLink(owner) + ', ' + esc(owner.job.toLowerCase()) + '.' : '',
    district: ''
  }[pl.kind] || '';
  if (desc) h += '<p>' + desc + '</p>';
  if (owner && owner.status === 'Dead') h += '<p class="meta">' + esc(npcName(owner)) + ' is dead' + (owner.fate ? ' (' + esc(owner.fate.charAt(0).toLowerCase() + owner.fate.slice(1)) + ')' : '') + '; family or a partner keeps the place going.</p>';
  if (pl.kind === 'district') {
    const al = aldermenOf(s).find((x) => x.d.name === pl.name);
    if (al && al.p) h += '<p>Alderman: ' + pLink(al.p) + ' <small class="meta">(' + esc(al.p.job) + ')</small></p>';
    const inside = placesOf(s).list.filter((o) => o.kind !== 'district' && o.kind !== 'market').filter((o) => { const q = placePos(s, o.key), d2 = districtAt(s, q.x, q.y); return d2 && d2.key === key; });
    if (inside.length) h += '<section><h3>Places here</h3><p>' + inside.map((o) => placeLink(s, o.key)).join(' · ') + '</p></section>';
  }
  // who is here today
  const here = residents(s).filter((p) => { const a = activity(p, day); return a.place === key || a.secretPlace === key; });
  h += '<section><h3>Here today (' + here.length + ')</h3>' + (here.length ? '<ul class="evlist people">' + here.map((p) => personRow(p, day)).join('') + '</ul>' : '<p class="meta">None of the town\'s notable folk are here today.</p>') + '</section>';
  if (pl.kind === 'temple') { const cl = residents(s).filter((p) => p.group === 'faith'); if (cl.length) h += '<section><h3>Clergy in town</h3><ul class="evlist people">' + cl.slice(0, 8).map((p) => personRow(p, day)).join('') + '</ul></section>'; }
  h += '<div class="actions"><button type="button" class="btn" data-pp="placefly">Show on map</button></div>';
  return h;
}

// ---------------------------------------------------------------- places drawn on the street plan
function drawPlaces() {
  if (!layers.labels || view.s < 700) return;
  const now = performance.now();
  const showNames = view.s >= 1500;
  ctx.textAlign = 'center';
  for (const id of plansDrawn) {
    const s = SBY.get(id);
    if (!s || settleR(s) * view.s < 160) continue;
    const L = placesOf(s).list.filter((o) => o.kind !== 'district' && o.kind !== 'market');
    const extra = [];
    if (placeHi && placeHi.sid === id && placeHi.key.startsWith('shop:')) { const pl = placeGet(s, placeHi.key); if (pl) extra.push(pl); }
    if (tool === 'people' && people.place && people.sid === id && people.place.startsWith('shop:') && !extra.length) { const pl = placeGet(s, people.place); if (pl) extra.push(pl); }
    for (const pl of L.concat(extra)) {
      const pos = placePos(s, pl.key), X = sx(pos.x), Y = sy(pos.y);
      if (X < -20 || X > vw + 20 || Y < -20 || Y > vh + 20) continue;
      const hi = (placeHi && placeHi.sid === id && placeHi.key === pl.key) || (tool === 'people' && people.place === pl.key && people.sid === id);
      const r = hi ? 7 : 5;
      ctx.fillStyle = PLACE_COL[pl.kind] || '#ccc'; ctx.strokeStyle = '#1a140c'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (pl.kind === 'temple') { ctx.moveTo(X, Y - r - 1); ctx.lineTo(X + r, Y); ctx.lineTo(X, Y + r + 1); ctx.lineTo(X - r, Y); ctx.lineTo(X, Y - r - 1); }
      else if (pl.kind === 'guild' || pl.kind === 'law' || pl.kind === 'hall') ctx.rect(X - r, Y - r, r * 2, r * 2);
      else ctx.arc(X, Y, r, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      if (pl.secret) { ctx.setLineDash([2, 2]); ctx.strokeStyle = '#e2c37a'; ctx.beginPath(); ctx.arc(X, Y, r + 3, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
      if (hi) {
        const k = ((now - (placeHi ? placeHi.t : now)) % 1600) / 1600;
        ctx.strokeStyle = 'rgba(227,179,65,' + (0.9 * (1 - k)).toFixed(2) + ')'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(X, Y, r + 4 + k * 18, 0, Math.PI * 2); ctx.stroke();
        requestRender();
      }
      if (showNames || hi) {
        ctx.font = (hi ? '700 12.5px ' : '600 11px ') + '"Atkinson Hyperlegible", system-ui, sans-serif';
        const w = ctx.measureText(pl.name).width, ty = Y - r - 5;
        const rr = [X - w / 2 - 2, ty - 11, X + w / 2 + 2, ty + 2];
        if (hi || !rectHit(rr)) { haloText(pl.name, X, ty, hi ? '#7a2414' : '#231c13', 'rgba(246,238,218,0.9)', 3); labelHits.push(rr); }
      }
      markers.push({ kind: 'poi', id: id + '|' + pl.key, X, Y, r: Math.max(9, r + 4) });
    }
  }
}

// ---------------------------------------------------------------- activity heat map (People → Activity)
const HEAT_CATS = {
  work: ['Work and trade', '#d6b04c'], civic: ['Government and law', '#6f87a6'], faith: ['Worship', '#efe6c8'],
  crime: ['Crime', '#c0504a'], leisure: ['Leisure', '#d9a441'], adventure: ['Adventuring', '#3f9a87'], home: ['At home', '#9aa36a']
};
const ACT_CAT = { leader: 'civic', watch: 'civic', faith: 'faith', trade: 'work', craft: 'work', service: 'work', labour: 'work', arcane: 'work', underworld: 'work', adventurer: 'adventure' };
function actCat(p, a) {
  const t = a.text || '';
  if (/worship|prayers|confessions|Tending victims|scripture/i.test(t)) return 'faith';
  if (/tavern|Enjoying|festival|feast|with friends|Drinking|supper|jug of ale|Walking|Picnicking|games|Dancing|Skating|stories/i.test(t) && p.group !== 'service') return 'leisure';
  if (/Resting|home|family|Sick in bed/i.test(t)) return 'home';
  if (/Mustered|patrol|Guarding|Hunting|court|petitions|relief/i.test(t)) return 'civic';
  return ACT_CAT[p.group] || 'work';
}
const heatCache = new Map();
function heatPoints(s, day) {
  const key = s.id + '|' + day + '|' + mkVer;
  const c = heatCache.get(key);
  if (c) return c;
  const pts = [], P = getPlan(s), L = placesOf(s), pop = s.pop, R = settleR(s);
  const put = (x, y, w, cat, pk, r) => { if (w > 0) pts.push({ x, y, w, cat, pk, r: r || 1 }); };
  const atKey = (k, w, cat, r) => { const q = placePos(s, k); put(q.x, q.y, w, cat, k, r || (k === 'market' ? 2.4 : k.startsWith('dist') ? 3 : 1)); };
  const rest = day % 7 === 6;
  const mods = modsFor(s, day), ev = {};
  for (const [ti, f] of mods) ev[ETYPES[ti]] = Math.max(ev[ETYPES[ti]] || 0, f);
  // the notable folk: where each of them is today
  for (const p of residents(s)) {
    const a = activity(p, day);
    if ((p.status || 'Alive') !== 'Alive') continue;
    const cat = actCat(p, a);
    if (a.place) atKey(a.place, 3, cat);
    else { const Lc = npcLocation(p); if (Lc) put(Lc.x, Lc.y, 2, cat, null); }
    if (a.secretPlace) atKey(a.secretPlace, 3, 'crime');
  }
  // the crowds: everyone else, spread by what the town has
  const U = pop / 100;
  atKey('market', U * 0.35 * (rest ? 0.3 : 1) * (ev.boom ? 1.5 : 1) * (ev.famine ? 1.3 : 1), 'work');
  if (ev.festival || ev.feast) atKey('market', U * 0.5 * (ev.festival || ev.feast), 'leisure');
  const tav = L.list.filter((o) => o.kind === 'tavern' || o.kind === 'inn');
  for (const o of tav) atKey(o.key, U * 0.12 / tav.length * (rest ? 1.8 : 1) * (ev.festival ? 1.5 : 1), 'leisure');
  const tem = L.list.filter((o) => o.kind === 'temple');
  tem.forEach((o, i) => atKey(o.key, U * 0.08 / tem.length * (i === 0 ? 1.5 : 1) * (rest ? 3 : 1) * (ev.plague ? 2 : 1), 'faith'));
  for (const k of ['hall', 'gaol', 'barracks', 'watch']) if (L.by.has(k)) atKey(k, U * (k === 'barracks' ? 0.05 * (ev.war ? 2.5 : 1) : 0.025), 'civic');
  const ds = L.list.filter((o) => o.kind === 'district' && o.a != null);
  for (const d of ds) atKey(d.key, U * 0.015, 'civic');
  const thv = guildLevel(s, 'thieves');
  if (L.by.has('g:thieves')) atKey('g:thieves', U * 0.02 * (1 + thv), 'crime');
  const war = ds.find((d) => d.name === 'The Warrens'); if (war) atKey(war.key, U * 0.03 * (1 + thv * 0.5), 'crime');
  atKey('market', U * 0.012 * (1 + thv) * (ev.boom ? 2 : 1), 'crime');
  if (L.by.has('g:adventurers')) { const Rr = roster(s); atKey('g:adventurers', (Rr ? Rr.list.length : 4) * 1.2, 'adventure'); }
  if (L.by.has('docks')) atKey('docks', U * 0.1 * (rest ? 0.3 : 1), 'work');
  // workshops and homes across the town
  const hs = []; for (let i = 0; i < P.n; i++) if (P.bk[i] === 0 || P.bk[i] === 4) hs.push(i);
  const step = Math.max(1, Math.floor(hs.length / 160));
  for (let j = 0; j < hs.length; j += step) {
    const i = hs[j], d = Math.hypot(P.bx[i] - s.x, P.by[i] - s.y) / R;
    put(P.bx[i], P.by[i], U * 0.25 / (hs.length / step) * (rest ? 1.6 : 1) * (ev.plague ? 1.4 : 1), 'home', null);
    if (d < 0.55) put(P.bx[i], P.by[i], U * 0.25 / (hs.length / step) * 1.6 * (rest ? 0.3 : 1), 'work', null);
  }
  heatCache.set(key, pts);
  if (heatCache.size > 40) heatCache.delete(heatCache.keys().next().value);
  return pts;
}
const HEAT_LUT = (() => {
  const stops = [[0, 30, 60, 200], [0.3, 40, 190, 220], [0.55, 240, 230, 70], [0.8, 245, 130, 30], [1, 220, 30, 30]];
  const lut = new Uint8ClampedArray(256 * 4);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let k = 0; while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
    const a = stops[k], b = stops[k + 1], f = (t - a[0]) / (b[0] - a[0]);
    lut[i * 4] = a[1] + (b[1] - a[1]) * f; lut[i * 4 + 1] = a[2] + (b[2] - a[2]) * f; lut[i * 4 + 2] = a[3] + (b[3] - a[3]) * f;
    lut[i * 4 + 3] = Math.min(255, Math.pow(t, 0.7) * 1.5 * 200);
  }
  return lut;
})();
let heatRast = null;
function heatOn() { return tool === 'people' && people.tab === 'activity' && !people.npc && !people.place && people.heat !== false && people.sid; }
function drawHeat() {
  if (!heatOn() || view.s < PLAN_S) return;
  const s = SBY.get(people.sid);
  if (!s || !plansDrawn.has(s.id)) return;
  const cats = (people.hcats || Object.keys(HEAT_CATS)).filter((k) => !(isPlayer() && k === 'crime')), day = market.day;
  const key = s.id + '|' + day + '|' + cats.join(',') + '|' + mkVer + '|' + planKey(s) + '|' + campaign.mode;
  if (!heatRast || heatRast.key !== key) {
    const G = 256, R = settleR(s), span = R * 2.3, cell = span / G, acc = new Float32Array(G * G);
    const rad0 = Math.max(3, (Math.max(35 * FT, R * 0.05)) / cell);
    const kers = new Map();
    const kernel = (m) => { let k = kers.get(m); if (k) return k; k = []; const rad = Math.max(2, Math.round(rad0 * m)); let sum = 0; for (let dy = -rad * 2; dy <= rad * 2; dy++) for (let dx = -rad * 2; dx <= rad * 2; dx++) { const d2 = (dx * dx + dy * dy) / (rad * rad); if (d2 < 4) { const v = Math.exp(-d2 * 1.4); k.push(dx, dy, v); sum += v; } } for (let i = 2; i < k.length; i += 3) k[i] *= 30 / sum; kers.set(m, k); return k; };
    for (const q of heatPoints(s, day)) {
      if (!cats.includes(q.cat)) continue;
      const ker = kernel(q.r || 1);
      const gx = Math.round((q.x - s.x + span / 2) / cell), gy = Math.round((q.y - s.y + span / 2) / cell);
      for (let k = 0; k < ker.length; k += 3) { const x = gx + ker[k], y = gy + ker[k + 1]; if (x >= 0 && y >= 0 && x < G && y < G) acc[y * G + x] += q.w * ker[k + 2]; }
    }
    let mx = 0; for (let i = 0; i < acc.length; i++) if (acc[i] > mx) mx = acc[i];
    const c = mkCanvas(G, G), g = c.getContext('2d'), im = g.createImageData(G, G);
    const kk = mx * 0.04, lg = Math.log(1 + mx / (kk || 1));
    if (mx > 0) for (let i = 0; i < acc.length; i++) { const t = Math.log(1 + acc[i] / kk) / lg, li = Math.round(t * 255) * 4; im.data[i * 4] = HEAT_LUT[li]; im.data[i * 4 + 1] = HEAT_LUT[li + 1]; im.data[i * 4 + 2] = HEAT_LUT[li + 2]; im.data[i * 4 + 3] = acc[i] > mx * 0.004 ? HEAT_LUT[li + 3] : 0; }
    g.putImageData(im, 0, 0);
    heatRast = { key, c, span };
  }
  const X = sx(s.x), Y = sy(s.y), sz = heatRast.span * view.s;
  ctx.save(); ctx.globalAlpha = 0.78; ctx.imageSmoothingEnabled = true;
  ctx.drawImage(heatRast.c, X - sz / 2, Y - sz / 2, sz, sz);
  ctx.restore();
}
function activityTab(s, day) {
  if (!s) return '<div class="empty-note"><p>Tap a settlement on the map to see where its people are and what they are doing today.</p></div>';
  const cats = (people.hcats || Object.keys(HEAT_CATS)).filter((k) => !(isPlayer() && k === 'crime'));
  const pts = heatPoints(s, day);
  const tot = {}; for (const q of pts) tot[q.cat] = (tot[q.cat] || 0) + q.w;
  const all = Object.values(tot).reduce((a, b) => a + b, 0) || 1;
  let h = aroundNowSection(s, day) + '<section><h3>Activity today</h3><p class="meta">' + dateText(day) + (day % 7 === 6 ? ' · a rest day: fewer at work, more at worship and in the taverns' : '') + '. The heat map on the street plan shows where ' + esc(s.name) + '\'s people are; tap the kinds of activity to show or hide them.</p>';
  h += '<div class="heatcats">' + Object.entries(HEAT_CATS).filter(([k]) => !(isPlayer() && k === 'crime')).map(([k, [n, col]]) => '<button type="button" class="chip" data-pp="hcat" data-v="' + k + '" aria-pressed="' + cats.includes(k) + '"><i style="background:' + col + '"></i>' + n + ' <small>' + Math.round((tot[k] || 0) / all * 100) + '%</small></button>').join('') + '</div>';
  h += '<div class="actions"><button type="button" class="btn' + (people.heat !== false ? ' primary' : '') + '" data-pp="heat">' + (people.heat !== false ? 'Heat map on' : 'Heat map off') + '</button><button type="button" class="btn" data-pp="heatfly">View the streets</button></div>';
  h += '<div class="heatkey"><span>Quiet</span><i></i><span>Busy</span></div></section>';
  // hotspots by place
  const byPlace = new Map();
  for (const q of pts) if (q.pk && cats.includes(q.cat)) { const o = byPlace.get(q.pk) || { w: 0, cats: {} }; o.w += q.w; o.cats[q.cat] = (o.cats[q.cat] || 0) + q.w; byPlace.set(q.pk, o); }
  const top = [...byPlace.entries()].filter(([k]) => !k.startsWith('dist')).sort((a, b) => b[1].w - a[1].w).slice(0, 8);
  const mx = top.length ? top[0][1].w : 1;
  if (top.length) h += '<section><h3>Busiest places</h3><ul class="hot">' + top.map(([k, o]) => { const c = Object.entries(o.cats).sort((a, b) => b[1] - a[1])[0][0]; return '<li><span>' + placeLink(s, k) + '</span><i><em style="width:' + Math.round(o.w / mx * 100) + '%;background:' + HEAT_CATS[c][1] + '"></em></i><small>' + HEAT_CATS[c][0].toLowerCase() + '</small></li>'; }).join('') + '</ul></section>';
  // districts
  const dl = placesOf(s).list.filter((o) => o.kind === 'district');
  if (dl.length) {
    const dw = new Map();
    for (const q of pts) { if (!cats.includes(q.cat)) continue; const d = districtAt(s, q.x, q.y); if (d) { const o = dw.get(d.key) || { w: 0, cats: {} }; o.w += q.w; o.cats[q.cat] = (o.cats[q.cat] || 0) + q.w; dw.set(d.key, o); } }
    const rows = [...dw.entries()].sort((a, b) => b[1].w - a[1].w), m2 = rows.length ? rows[0][1].w : 1;
    h += '<section><h3>By district</h3><ul class="hot">' + rows.map(([k, o]) => { const c = Object.entries(o.cats).sort((a, b) => b[1] - a[1])[0][0]; return '<li><span>' + placeLink(s, k) + '</span><i><em style="width:' + Math.round(o.w / m2 * 100) + '%;background:' + HEAT_CATS[c][1] + '"></em></i><small>mostly ' + HEAT_CATS[c][0].toLowerCase() + '</small></li>'; }).join('') + '</ul></section>';
  }
  // the notable folk by what they are up to
  const groups = {};
  for (const p of residents(s)) { if ((p.status || 'Alive') !== 'Alive') continue; const a = activity(p, day), c = a.secret && !isPlayer() ? 'crime' : actCat(p, a); (groups[c] = groups[c] || []).push([p, a]); }
  h += '<section><h3>Notable folk</h3>' + Object.keys(HEAT_CATS).filter((k) => groups[k] && cats.includes(k)).map((k) => '<h4><i class="dotc" style="background:' + HEAT_CATS[k][1] + '"></i>' + HEAT_CATS[k][0] + ' (' + groups[k].length + ')</h4><ul class="actlist">' + groups[k].slice(0, 6).map(([p, a]) => '<li>' + pLink(p) + ' <small>' + (k === 'crime' && a.secret ? actHtml(a.secret, s, a.secretPlace) : actLinks(a, s)) + '</small></li>').join('') + (groups[k].length > 6 ? '<li class="meta">and ' + (groups[k].length - 6) + ' more</li>' : '') + '</ul>').join('') + '</section>';
  return h;
}
