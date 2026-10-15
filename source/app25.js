// ================================================================ the full System Reference Document lists
// Every SRD 5.1 item (588) and monster (334), plus the old Market Ledger's 37 everyday prices (meals, drinks,
// lodgings, services and wages). Natural spawns still use only the built-in list (MON), so the
// same seed always makes the same world; the full list adds cards, stat blocks, the Bestiary and the Shop.
const fixType = (t) => t + ((t.match(/\(/g) || []).length > (t.match(/\)/g) || []).length ? ')' : '');
let monCard = null;
market.shop = { q: '', cat: 'all', open: null };
market.inn = { lodge: 'Modest', meal: 'Modest', nights: 1, guests: 4, horses: 0 };
const SRD = { items: null, mons: null, monBy: new Map(), P: {}, failed: {} };
const MON_SRD = {};          // creature cards for SRD monsters the built-in list lacks (never used for natural spawns)
const monInfo = (n) => MON[n] || MON_SRD[n] || null;
const HB_WORDS = { forest: 'Forests', ruins: 'Ruins and dungeons', grass: 'Grasslands', mountain: 'Mountains', urban: 'Towns and cities', planes: 'Other planes', desert: 'Deserts', marsh: 'Marshes', water: 'Seas and rivers', lava: 'Volcanic lands', snow: 'Arctic' };
const crStr = (v) => (v === 0.125 ? '1/8' : v === 0.25 ? '1/4' : v === 0.5 ? '1/2' : String(v));
const cap1 = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);
// the lists are built into the page, so they work offline, on GitHub and on the shared Claude page alike
function srdFetch(kind) {
  if (kind === 'items' && !SRD.items) srdItemsReady((SRD_INLINE.everyday || []).concat(SRD_INLINE.items));
  if (kind === 'mons' && !SRD.mons) srdMonsReady(SRD_INLINE.mons);
  return Promise.resolve();
}
function srdMonsReady(list) {
  SRD.mons = list;
  const have = new Set(Object.keys(MON).map((n) => n.toLowerCase()));
  for (const m of list) {
    SRD.monBy.set(m.n.toLowerCase(), m);
    if (have.has(m.n.toLowerCase())) continue;
    const first = (m.sa && m.sa[0]) || (m.ac2 && m.ac2[0]);
    const trait = first ? first[0] + ': ' + String(first[1]).split('. ')[0].slice(0, 120) : '';
    MON_SRD[m.n] = [m.sz.toLowerCase() + ' ' + m.t + (m.st ? ' (' + m.st + ')' : ''), parseInt(m.ac, 10) || 10, m.hp, m.sp, crStr(m.cr), trait];
  }
}
// ---------- the full stat block on a creature card ----------
function statBlock(m) {
  const ab = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
  const line = (k, v) => (v ? '<p class="sb-l"><b>' + k + '</b> ' + esc(v) + '</p>' : '');
  const list = (title, arr) => (arr && arr.length ? '<h4>' + title + '</h4>' + arr.map(([n, t]) => '<p><b>' + esc(n) + '.</b> ' + esc(t) + '</p>').join('') : '');
  return '<details class="sblock" open><summary>Full stat block</summary><div class="statblock"><p class="sb-name">' + esc(m.n) + '</p>' +
    '<p class="sb-k">' + esc(cap1(m.sz) + ' ' + m.t + (m.st ? ' (' + m.st + ')' : '') + ', ' + m.al) + '</p>' +
    line('Armour class', m.ac) + line('Hit points', m.hp + ' (' + m.hd + ')') + line('Speed', m.sp) +
    '<table class="sb-ab"><tr>' + ab.map((a) => '<th>' + a + '</th>').join('') + '</tr><tr>' + m.ab.map((v) => '<td>' + v + ' <small>(' + sgn(modOf(v)) + ')</small></td>').join('') + '</tr></table>' +
    line('Saving throws', m.sv) + line('Skills', m.sk) + line('Vulnerable to', m.vu) + line('Resists', m.re) + line('Immune to', m.im) + line('Condition immunities', m.ci) + line('Senses', m.se) + line('Languages', m.la) +
    list('Traits', m.sa) + list('Actions', m.ac2) + list('Reactions', m.rx) + list('Legendary actions', m.lg) + '</div></details>';
}

// ---------- the full item list, priced in each town ----------
const SHOP_CATS = [['all', 'All'], ['Food', 'Food'], ['Drink', 'Drink'], ['Lodging', 'Lodging'], ['Services', 'Services'], ['Wages', 'Wages'], ['Weapons', 'Weapons'], ['Armor', 'Armour'], ['Gear', 'Gear'], ['Tools', 'Tools'], ['Mounts & travel', 'Mounts & travel'], ['Magic items', 'Magic items']];
const MAGIC_BAND = { common: [50, 100], uncommon: [101, 500], rare: [501, 5000], 'very rare': [5001, 50000] };
const MAGIC_TIER = { common: 2, uncommon: 3, rare: 4, 'very rare': 4 };
const ITEM_ALIAS = { 'horse, riding': 'Riding horse', 'horse, draft': 'Draft horse', 'saddle, riding': 'Saddle, riding', 'animal feed (1 day)': 'Feed (per day)', 'leather armor': 'Leather armour', 'chain shirt': 'Chain shirt', 'chain mail': 'Chain mail', 'plate armor': 'Plate armour', 'rope, hempen (50 feet)': 'Rope, hempen (50 ft)', "healer's kit": "Healer's kit", 'arrow': 'Arrows (20)', 'tent, two-person': 'Tent, two-person', 'crossbow, light': 'Crossbow, light' };
const SHIPS = /galley|keelboat|longship|rowboat|sailing ship|warship/i;
const EVERYDAY = new Set(['Food', 'Drink', 'Lodging', 'Services', 'Wages']);
const idSlug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function srdItemsReady(list) {
  const goodsBy = new Map(GOODS.map((g) => [g.name.toLowerCase(), g]));
  const seen = new Set();
  list = list.filter((x) => { const k = x.c + '|' + x.n + '|' + (x.u || ''); if (seen.has(k)) return false; seen.add(k); return true; });
  SRD.items = list.filter((x) => x.c === 'Magic items' || x.p > 0).map((x) => {
    const lname = x.n.toLowerCase(), everyday = EVERYDAY.has(x.c);
    // everyday prices are per meal, mug or night as the ledger listed them, so they follow the town's price level rather than one market good
    const g = everyday ? null : goodsBy.get(lname) || (ITEM_ALIAS[lname] ? GBY[ITEM_ALIAS[lname]] : null);
    let base = x.p / 100, rarity = x.r ? x.r.toLowerCase() : null;
    if (g) base = g.base;
    else if (x.c === 'Magic items') {
      const band = MAGIC_BAND[rarity];
      if (band) { const h = T.hash(hashStr(x.id) & 0xffffff, 17, 5); base = Math.round(band[0] * Math.pow(band[1] / band[0], h)); if (/potion|scroll/i.test(x.t || '') || /^potion|^spell scroll|^ammunition/i.test(x.n)) base = Math.max(band[0] / 2, Math.round(base / 2)); }
      else base = 0;
    }
    return { id: x.id || 'lg-' + idSlug(x.n) + (x.u ? '-' + idSlug(x.u) : ''), name: x.n, cat: x.c, unit: x.u && x.u !== 'each' ? x.u : '', desc: x.d || '', type: x.t || '', rarity, base, g, search: (x.n + ' ' + (x.t || '') + ' ' + (x.r || '')).toLowerCase() };
  });
}
const levelCache = new Map();
function priceLevels(s, day) {
  const key = s.id + '|' + day + '|' + mkVer;
  let v = levelCache.get(key);
  if (v) return v;
  const P = pricesFor(s, day);
  const lvl = (fn) => { let lr = 0, n = 0; for (const g of GOODS) if (fn(g)) { lr += Math.log(P[g.i] / g.base); n++; } return n ? Math.exp(lr / n) : 1; };
  v = {
    arms: lvl((g) => g.cat === 'arms'), gear: lvl((g) => g.tags.includes('gear') || g.tags.includes('healing') && g.cat === 'trade'), crafted: lvl((g) => g.tags.includes('crafted')),
    mount: lvl((g) => g.tags.includes('mount')), tack: lvl((g) => g.tags.includes('tack') || g.tags.includes('vehicle')), feed: lvl((g) => g.tags.includes('feed')), magic: lvl((g) => g.cat === 'magic'),
    lodging: lvl((g) => g.tags.includes('lodging')), meal: lvl((g) => g.tags.includes('meal')), drink: lvl((g) => g.tags.includes('drink')),
    food: lvl((g) => g.cat === 'food' && g.tags.includes('food')), P,
  };
  levelCache.set(key, v);
  if (levelCache.size > 400) levelCache.delete(levelCache.keys().next().value);
  return v;
}
// local price and whether it is on sale here today
function shopItem(it, s, day) {
  const Lv = priceLevels(s, day);
  if (it.g) return { gp: Lv.P[it.g.i], ok: inStock(s, it.g, day), why: s.tier < it.g.minTier ? 'Needs a larger market' : 'None in stock this week' };
  if (it.cat === 'Magic items') {
    if (!it.base) return { gp: 0, ok: false, why: it.rarity === 'artifact' ? 'An artifact: never for sale' : 'Legendary: never for sale' };
    if (s.tier < MAGIC_TIER[it.rarity]) return { gp: it.base * Lv.magic, ok: false, why: 'Needs a ' + (MAGIC_TIER[it.rarity] >= 4 ? 'capital' : 'city') };
    const L = localInfo(s), ok = T.hash(L.h & 0xffffff, (hashStr(it.id) & 0xfffff) + Math.floor(day / 7), 913) < STOCK_CHANCE[it.rarity];
    return { gp: it.base * Lv.magic, ok, why: 'None in stock this week' };
  }
  let f = Lv.gear, ok = true, why = '';
  const n = it.name;
  if (EVERYDAY.has(it.cat)) {
    // services and wages follow what lodging and living cost here
    f = it.cat === 'Food' ? (/^meal|banquet/i.test(n) ? Lv.meal : Lv.food) : it.cat === 'Drink' ? Lv.drink : it.cat === 'Lodging' ? (/stabling/i.test(n) ? Math.sqrt(Lv.feed * Lv.lodging) : Lv.lodging)
      : it.cat === 'Services' ? Math.sqrt(Lv.lodging * Lv.gear) : Math.sqrt(Lv.lodging * Lv.meal);
    if (/aristocratic|wealthy|banquet|wine, fine/i.test(n) && s.tier < 2) { ok = false; why = 'Needs a town'; }
    if (/ship's passage/i.test(n) && !isCoastal(s.x, s.y)) { ok = false; why = 'Only in ports'; }
    if (/within a city/i.test(n) && s.tier < 3) { ok = false; why = 'Only in cities'; }
    return { gp: it.base * f, ok, why };
  }
  if (it.cat === 'Weapons') { f = Lv.arms; if (/Martial/.test(it.desc) && s.tier < 2) { ok = false; why = 'Needs a town'; } }
  else if (it.cat === 'Armor') { f = Lv.arms; if ((/Heavy/.test(it.desc) || it.base >= 200) && s.tier < 2) { ok = false; why = 'Needs a town'; } if (it.base >= 400 && s.tier < 3) { ok = false; why = 'Needs a city'; } }
  else if (it.cat === 'Tools') f = Lv.crafted;
  else if (it.cat === 'Mounts & travel') {
    if (/feed|stabling/i.test(n)) f = Lv.feed;
    else if (/barding|saddle|bit and|saddlebags|carriage|cart|chariot|sled|wagon/i.test(n)) { f = Lv.tack; if (/barding/i.test(n) && s.tier < 2) { ok = false; why = 'Needs a town'; } }
    else if (SHIPS.test(n)) { f = Lv.tack; if (!isCoastal(s.x, s.y)) { ok = false; why = 'Only in ports'; } else if (it.base >= 10000 && s.tier < 3) { ok = false; why = 'Needs a city port'; } }
    else f = Lv.mount;
  }
  return { gp: it.base * f, ok, why };
}
function shopRows() {
  const q = (market.shop.q || '').trim().toLowerCase(), cat = market.shop.cat;
  return SRD.items.filter((it) => (cat === 'all' || it.cat === cat) && (!q || it.search.includes(q)));
}
// the price here, with a picked hero's member price beneath it
function memberCell(it, s, gp) {
  const h = shopHero(), d = h ? memberDisc(h, s, shopKindSrd(it)) : { v: 0 };
  if (!d.v) return coinHtml(gp);
  return d.v >= 1 ? '<s class="was">' + coinHtml(gp) + '</s><small class="gj-disc">free · ' + esc(d.by) + '</small>' : coinHtml(gp * (1 - d.v)) + '<small class="gj-disc">−' + Math.round(d.v * 100) + '% ' + esc(d.by) + '</small>';
}
function shopListHtml(s, day) {
  if (!SRD.items) return SRD.failed.items ? '<p class="meta">The full SRD item list could not load here. Open the atlas from its web address to see every item; the Town tab still prices the everyday goods.</p>' : '<p class="meta">Loading the full SRD item list…</p>';
  const rows = shopRows(), MAX = 160;
  if (!rows.length) return '<p class="meta">Nothing matches "' + esc(market.shop.q) + '".</p>';
  let h = '<p class="small">' + rows.length + ' item' + (rows.length === 1 ? '' : 's') + (rows.length > MAX ? ', first ' + MAX + ' shown. Search to narrow.' : '') + '</p><table class="shop-t"><thead><tr><th>Item</th><th class="num">Book</th><th class="num">Here</th></tr></thead><tbody>';
  let lastCat = '';
  for (const it of rows.slice(0, MAX)) {
    if (market.shop.cat === 'all' && it.cat !== lastCat) { lastCat = it.cat; h += '<tr class="cat"><td colspan="3">' + esc((SHOP_CATS.find((c) => c[0] === it.cat) || [0, it.cat])[1]) + '</td></tr>'; }
    const r = shopItem(it, s, day), open = market.shop.open === it.id;
    const nm = it.cat === 'Magic items' ? extLink(AID.item(it.name), it.name) : esc(it.name);
    h += '<tr class="item' + (r.ok ? '' : ' na') + '" data-shop="open" data-v="' + esc(it.id) + '" tabindex="0" aria-expanded="' + open + '"><td>' + nm + (it.unit ? ' <small>(' + esc(it.unit) + ')</small>' : '') + (it.rarity ? ' <em class="rar rr-' + it.rarity.replace(/\s/g, '') + '">' + esc(it.rarity) + '</em>' : '') +
      (open ? '<small class="note">' + esc(it.type ? fixType(it.type) + '. ' : '') + esc(it.desc) + '</small>' + itemSellerHtml(shopHero(), s, it) : '') + '</td>' +
      '<td class="num">' + (it.base ? coinHtml(it.base) : '—') + '</td><td class="num">' + (shopHero() ? heroPriceCell(shopHero(), s, it) : r.ok ? memberCell(it, s, r.gp) : '<small>' + esc(r.why) + '</small>') + '</td></tr>';
  }
  return h + '</tbody></table>';
}

// ---------- the inn bill ----------
const INN_Q = ['Squalid', 'Poor', 'Modest', 'Comfortable', 'Wealthy', 'Aristocratic'];
const INN_STAY = [0.07, 0.1, 0.5, 0.8, 2, 4], INN_MEAL = [0.03, 0.06, 0.3, 0.5, 0.8, 2], INN_TIER = [1, 1, 1, 2, 3, 3];
function innBill(s, day) {
  const F = market.inn, Lv = priceLevels(s, day);
  const lq = INN_Q.indexOf(F.lodge), mq = INN_Q.indexOf(F.meal);
  const stay = INN_STAY[lq] * Lv.lodging, meal = INN_MEAL[mq] * Lv.meal, stable = 0.5 * Math.sqrt(Lv.feed * Lv.lodging);
  const n = F.nights, g = F.guests, hrs = F.horses;
  const rows = [['Rooms', n * g * stay, g + ' × ' + n + ' night' + (n === 1 ? '' : 's') + ' at ' + money(stay)], ['Meals', n * g * meal, g + ' × ' + n + ' day' + (n === 1 ? '' : 's') + ' at ' + money(meal)]];
  // a picked hero's guild may put them up for free (only the hero: their companions still pay)
  const hero = shopHero(), ML = hero ? memberLodging(hero, s) : null, note = [], hn = hero ? esc(hero.name || 'the hero') : '';
  if (ML && g >= 1 && n >= 1) {
    if (ML.lodge >= lq) { rows[0][1] -= n * stay; rows[0][2] += '; ' + hn + ' stays free'; note.push(hn + ' sleeps free: ' + ML.by.join(', ') + '.'); }
    else if (ML.cot != null && lq <= 1) { rows[0][1] -= n * Math.max(0, stay - ML.cot); rows[0][2] += '; ' + hn + ' takes a cot at ' + money(ML.cot); note.push('A cot in the guild hall\'s bunkroom for ' + hn + '.'); }
    else if (ML.lodge >= 0 && ML.by.length) note.push('Choose ' + INN_Q[ML.lodge].toLowerCase() + ' lodging or simpler for ' + hn + ' to stay free (' + ML.by[0] + ').');
    if (ML.meals >= mq) { rows[1][1] -= n * meal; rows[1][2] += '; ' + hn + ' eats free'; }
  }
  if (hrs) rows.push(['Stabling', n * hrs * stable, hrs + ' × ' + n + ' at ' + money(stable)]);
  const warn = [];
  if (s.tier < INN_TIER[lq]) warn.push(F.lodge + ' rooms are hard to find in a ' + sizeOf(s).name.toLowerCase() + '.');
  if (s.tier < INN_TIER[mq]) warn.push(F.meal + ' meals are hard to find in a ' + sizeOf(s).name.toLowerCase() + '.');
  return { rows, total: rows.reduce((a, r) => a + r[1], 0), warn: warn.concat(note) };
}
function innHtml(s, day) {
  const B = innBill(s, day);
  return '<div class="inn-out"><ul class="breakdown">' + B.rows.map((r) => '<li><span>' + r[0] + ' <small>' + r[2] + '</small></span><b>' + coinHtml(r[1]) + '</b></li>').join('') + '</ul>' +
    '<div class="inn-total"><span>Total bill</span><b>' + coinHtml(B.total) + '</b></div>' + (B.warn.length ? '<p class="meta">' + B.warn.join(' ') + '</p>' : '') + '</div>';
}
function shopTab(day) {
  const s = market.sid ? SBY.get(market.sid) : null;
  if (!s) return '<div class="empty-note"><p>Tap a town or city on the map to open its shops and inn.</p></div>';
  srdFetch('items');
  const F = market.inn, sel1 = (id, cur) => '<select id="' + id + '" data-inn="' + id + '">' + INN_Q.map((q, i) => '<option value="' + q + '"' + (q === cur ? ' selected' : '') + (s.tier < INN_TIER[i] ? ' class="rare"' : '') + '>' + q + '</option>').join('') + '</select>';
  const num = (id, v, max, lab) => '<div class="field"><label class="lab" for="' + id + '">' + lab + '</label><input id="' + id + '" data-inn="' + id + '" type="number" min="0" max="' + max + '" value="' + v + '"></div>';
  let h = '<div class="town-h"><div><div class="eyebrow">' + TIERS[s.tier].name + ' · shops and inn</div><h3 class="town-name">' + tLink(s) + '</h3></div></div>';
  h += shopHeroHtml(s) + shopHeroPanel(shopHero(), s);
  h += '<section><h3>At the inn</h3><div class="row2"><div class="field"><label class="lab" for="inn-l">Lodging</label>' + sel1('inn-l', F.lodge) + '</div><div class="field"><label class="lab" for="inn-m">Meals</label>' + sel1('inn-m', F.meal) + '</div></div>' +
    '<div class="row3">' + num('inn-n', F.nights, 365, 'Nights') + num('inn-g', F.guests, 50, 'Guests') + num('inn-h', F.horses, 50, 'Horses') + '</div><div id="innOut">' + innHtml(s, day) + '</div>' +
    '<p class="hint">Player\'s Handbook lifestyle prices for an inn stay and a day\'s meals, at this town\'s prices today. Stabling is 5 sp a day before local costs.</p></section>';
  h += '<section><h3>Everything for sale</h3><div class="field"><label class="lab" for="shop-q">Search ' + (SRD.items ? SRD.items.length + ' ' : '') + 'items</label><input id="shop-q" type="search" value="' + esc(market.shop.q) + '" placeholder="Rope, longsword, potion…" autocomplete="off"></div>' +
    '<div class="chips">' + SHOP_CATS.map(([k, l]) => '<button type="button" class="chip' + (market.shop.cat === k ? ' on' : '') + '" data-shop="cat" data-v="' + esc(k) + '">' + l + '</button>').join('') + '</div>' +
    '<div id="shopList">' + shopListHtml(s, day) + '</div>' +
    '<p class="hint">Rulebook prices from the System Reference Document 5.1, with food, drink, lodging, services and wages from the old Market Ledger\'s list, all moved by this town\'s supply, season and events like the goods on the Town tab. Magic items without a rulebook price are estimates inside the Dungeon Master\'s Guide rarity bands; legendary items and artifacts are never sold. Tap an item for its description.</p></section>';
  h += blackMarketHtml(shopHero(), s);
  return h;
}
$('inspector').addEventListener('click', (ev) => {
  if (ev.target.closest('a')) return;
  const b = ev.target.closest('[data-shop]');
  if (!b || tool !== 'market') return;
  const a = b.dataset.shop, v = b.dataset.v;
  if (a === 'cat') { market.shop.cat = v; market.shop.open = null; renderPanel(); }
  else if (a === 'open') { market.shop.open = market.shop.open === v ? null : v; const s = market.sid ? SBY.get(market.sid) : null; if (s) $('shopList').innerHTML = shopListHtml(s, market.day); }
});
$('inspector').addEventListener('input', (ev) => {
  const t = ev.target;
  if (tool !== 'market') return;
  const s = market.sid ? SBY.get(market.sid) : null;
  if (!s) return;
  if (t.id === 'shop-q') { market.shop.q = t.value.slice(0, 60); market.shop.open = null; const L = $('shopList'); if (L) L.innerHTML = shopListHtml(s, market.day); return; }
  if (t.dataset && t.dataset.inn) {
    const F = market.inn, k = t.dataset.inn;
    if (k === 'inn-l') F.lodge = t.value; else if (k === 'inn-m') F.meal = t.value;
    else { const v = clamp(Math.round(+t.value || 0), 0, k === 'inn-n' ? 365 : 50); if (k === 'inn-n') F.nights = v; else if (k === 'inn-g') F.guests = v; else F.horses = v; }
    const o = $('innOut'); if (o) o.innerHTML = innHtml(s, market.day);
  }
});
$('inspector').addEventListener('keydown', (ev) => {
  const r = ev.target.closest && ev.target.closest('tr[data-shop]');
  if (r && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); r.click(); }
});

srdFetch('mons');
// the rest of the Challenge Rating table (Dungeon Master's Guide)
Object.assign(XP_CR, { '21': 33000, '22': 41000, '23': 50000, '24': 62000, '25': 75000, '26': 90000, '27': 105000, '28': 120000, '29': 135000, '30': 155000 });
// all creature names the Bestiary and search know
const allMonNames = () => Object.keys(MON).concat(Object.keys(MON_SRD));
function srdHabitat(n) { const m = SRD.monBy.get(n.toLowerCase()); return m && m.hb && m.hb.length ? m.hb.map((k) => HB_WORDS[k] || k).join(', ') : ''; }
