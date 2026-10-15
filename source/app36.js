// ================================================================ trading in the Market (v29)
// Heroes buy and sell straight from the Market's Shop tab. Each kind of goods has a real seller among the town's
// people, whose feelings about the party move the price; a hero can haggle once a day with each seller; shops hold
// a week's stock that buying uses up (and prices climb as it runs low); members of the Thieves' Guild find a black
// market; and heroes can fund trade caravans between towns. Purchases, haggles and ventures are kept on the hero,
// so in a shared world everyone sees the same stock and each player's device only writes its own heroes.

// ---------- who sells what
const KEEPER_JOBS = {
  Weapons: [/Blacksmith|Weaponsmith|Cutler/, /Smith|Master of the craft guilds/],
  Armor: [/Armourer|Blacksmith/, /Tanner|Smith|Master of the craft guilds/],
  Food: [/Baker|Butcher|Fishmonger|Pastrycook/, /Miller|Spice merchant|Farmer|Fisher/],
  Drink: [/Wine-seller|Beer-seller/, /Tavern keeper|Ale-house keeper|Innkeeper/],
  Lodging: [/Innkeeper/, /Tavern keeper|Ale-house keeper/],
  Services: [/Scribe|Copyist|Physician|Herbalist/, /Barber|Carter/],
  Gear: [/Chandler|Mercer|Merchant$|Ropemaker/, /Pawnbroker|Tanner|Cooper|Master of the merchants/],
  Tools: [/Carpenter|Woodcarver|Locksmith|Mason/, /Blacksmith|Cooper|Master of the craft guilds/],
  'Mounts & travel': [/Horse breeder|Saddler|Harness/, /Carter|Farmer/],
  'Magic items': [/Magic shop owner|City wizard|Royal magus/, /Herbalist|Master of the merchants/]
};
const FALLBACK_SELLER = { Wages: 'the hiring fair', Food: 'the market stalls', Drink: 'the taverns', Lodging: 'the inns', Services: 'the market', 'Mounts & travel': 'the horse market' };
const keeperCache = new Map();
function keeperFor(s, cat) {
  const key = s.id + '|' + cat + '|' + mkVer;
  if (keeperCache.has(key)) return keeperCache.get(key);
  let p = null;
  const res = residents(s).filter((q) => (withOv(q).status || 'Alive') === 'Alive' && q.age >= 16);
  for (const re of KEEPER_JOBS[cat] || []) { p = res.find((q) => re.test(q.job)); if (p) break; }
  const out = p ? { p: withOv(p), key: shopNameOf(p) ? 'shop:' + p.id : null, label: shopNameOf(p) || npcName(p) } : { p: null, key: null, label: FALLBACK_SELLER[cat] || 'a stall in the market' };
  keeperCache.set(key, out);
  if (keeperCache.size > 600) keeperCache.delete(keeperCache.keys().next().value);
  return out;
}
const keeperWord = (K, s) => (K.p ? (K.key ? placeLink(s, K.key, K.label) : esc(K.label)) + ' <small>(' + pLink(K.p) + ', ' + esc(K.p.job.toLowerCase()) + ')</small>' : esc(K.label));
// how the seller's feelings move the price: friendly 5% off, hostile 15% on, and at worst they won't serve the party
function keeperMood(K) {
  if (!K.p) return { f: 1, word: '', refuse: false };
  const d = dispShown(K.p);
  return d <= -70 ? { f: 1, word: 'refuses to serve the party', refuse: true } : d <= -35 ? { f: 1.15, word: 'dislikes the party (+15%)', refuse: false } : d >= 35 ? { f: 0.95, word: 'likes the party (−5%)', refuse: false } : { f: 1, word: '', refuse: false };
}

// ---------- stock for the week
const UNLIMITED = new Set(['Food', 'Drink', 'Lodging', 'Services', 'Wages']);
const weekOf = (day) => Math.floor(day / 7);
function stockOf(s, it, day) {
  if (UNLIMITED.has(it.cat)) return Infinity;
  const r = T.hash(hashStr(s.id + '|' + it.id) & 0xffffff, weekOf(day), 4101);
  if (it.cat === 'Magic items') return it.rarity === 'common' ? 2 + Math.floor(r * 3) : it.rarity === 'uncommon' ? 1 + Math.floor(r * 2) : 1;
  const base = it.cat === 'Mounts & travel' ? (it.base >= 1000 ? 1 : 2 * s.tier) : it.cat === 'Armor' ? (it.base >= 400 ? 1 : 2 * s.tier) : it.cat === 'Weapons' ? 3 * s.tier : 5 * s.tier;
  return Math.max(1, Math.round(base * (0.6 + r * 0.8)));
}
// how many every hero has bought here this week
function usedOf(s, it, day) {
  const w = weekOf(day);
  let n = 0;
  for (const h of heroes.list || []) for (const b of h.buys || []) if (b.sid === s.id && b.id === it.id && weekOf(b.d) === w) n += b.q || 1;
  return n;
}
// the price for one hero, with every reason: the town's price, member discount, the seller's mood, a haggle, and demand
function heroPrice(h, s, it, day) {
  day = day == null ? market.day : day;
  const r = shopItem(it, s, day);
  const K = keeperFor(s, it.cat), mood = keeperMood(K), md = memberDisc(h, s, shopKindSrd(it));
  const stock = stockOf(s, it, day), used = usedOf(s, it, day), left = stock - used;
  const demand = Number.isFinite(stock) ? 1 + 0.5 * Math.min(1, used / stock) : 1;
  const hg = haggleOf(h, s, K, day);
  const parts = [];
  let gp = r.gp;
  if (md.v) { gp *= 1 - md.v; parts.push((md.v >= 1 ? 'free' : '−' + Math.round(md.v * 100) + '%') + ' ' + md.by); }
  if (mood.f !== 1) { gp *= mood.f; parts.push(K.p ? npcName(K.p).split(' ')[0] + ' ' + (mood.f < 1 ? '−5%' : '+15%') : ''); }
  if (hg && hg.f !== 1) { gp *= hg.f; parts.push('haggled ' + (hg.f < 1 ? '−' : '+') + Math.round(Math.abs(1 - hg.f) * 100) + '%'); }
  if (demand > 1.001) { gp *= demand; parts.push('selling out +' + Math.round((demand - 1) * 100) + '%'); }
  return { ok: r.ok && !mood.refuse && left > 0, why: !r.ok ? r.why : mood.refuse ? K.p ? npcName(K.p) + ' won\'t serve you' : 'Refused' : 'Sold out this week', base: r.gp, gp: Math.round(gp * 100) / 100, K, mood, stock, left, parts };
}

// ---------- haggling: once a day with each seller
function haggleKey(s, K, day) { return s.id + '|' + (K.p ? K.p.id : K.label) + '|' + day; }
function haggleOf(h, s, K, day) { const k = haggleKey(s, K, day); return (h.hag || []).find((x) => x.k === k) || null; }
function doHaggle(h, s, cat) {
  const day = market.day, K = keeperFor(s, cat);
  if (haggleOf(h, s, K, day)) { toast('You have already haggled with ' + (K.p ? npcName(K.p) : K.label) + ' today.'); return null; }
  const D = derive(h), mood = keeperMood(K);
  const dc = 10 + 2 * s.tier + (mood.f > 1 ? 5 : mood.f < 1 ? -3 : 0);
  const roll = 1 + Math.floor(Math.random() * 20), tot = roll + D.skillBonus('Persuasion');
  const by = tot - dc, f = roll === 20 || by >= 5 ? 0.8 : by >= 0 ? 0.9 : by <= -5 || roll === 1 ? 1.1 : 1;
  const x = { k: haggleKey(s, K, day), f, roll, tot, dc };
  h.hag = (h.hag || []).filter((y) => +y.k.split('|').pop() >= day - 1).concat([x]);
  heroLog(h, 'buy', 'Haggled with ' + (K.p ? npcName(K.p) : K.label) + ' in ' + s.name + ': ' + (f < 1 ? Math.round((1 - f) * 100) + '% off today' : f > 1 ? 'insulted them (+10% today)' : 'no change'));
  return x;
}

// ---------- buying and selling
function buyItem(h, s, it, q) {
  q = Math.max(1, q | 0);
  const P = heroPrice(h, s, it);
  if (!P.ok) { toast(P.why + '.'); return false; }
  if (Number.isFinite(P.left) && q > P.left) { toast('Only ' + P.left + ' left this week.'); return false; }
  const cost = Math.round(P.gp * q * 100) / 100;
  if (cost > goldOf(h) + 1e-9) { toast('Not enough gold: ' + money(cost) + ' needed.'); return false; }
  h.goldDelta -= cost;
  const name = it.name + (it.unit ? ' (' + it.unit + ')' : '');
  const ex = (h.inv || []).find((x) => x.n === name);
  if (ex && !/pack/i.test(it.name)) h.inv = h.inv.map((x) => (x === ex ? Object.assign({}, x, { q: (x.q || 1) + q }) : x)); else h.inv = (h.inv || []).concat([{ n: name, q }]);
  h.buys = (h.buys || []).filter((b) => b.d >= market.day - 60).concat([{ d: market.day, sid: s.id, id: it.id, q, gp: cost }]);
  heroLog(h, 'buy', 'Bought ' + (q > 1 ? q + ' × ' : '') + it.name + ' in ' + s.name + ' for ' + money(cost));
  return true;
}
// the town's price of something a hero carries, by its name
function srdByName(n) { if (!SRD.items) return null; const base = n.replace(/ \([^)]*\)$/, ''); return SRD.items.find((x) => x.name === n || x.name === base) || null; }
function sellPrice(h, s, n) {
  const it = srdByName(n), r = it ? shopItem(it, s, market.day) : null, local = r ? r.gp : (ITEM.get(n) || {}).cost || 0;
  const sr = sellRate(h);
  return { gp: Math.round(local * sr.r * 100) / 100, by: sr.by, rate: sr.r };
}
function sellItem(h, s, i) {
  const x = (h.inv || [])[i];
  if (!x) return false;
  const P = sellPrice(h, s, x.n);
  if (!P.gp) { toast('Nobody here will pay for that.'); return false; }
  h.goldDelta += P.gp;
  h.inv = (x.q || 1) > 1 ? h.inv.map((y, j) => (j === i ? Object.assign({}, y, { q: y.q - 1 }) : y)) : h.inv.filter((_, j) => j !== i);
  heroLog(h, 'buy', 'Sold ' + x.n + ' in ' + s.name + ' for ' + money(P.gp));
  return true;
}

// ---------- the black market, behind the Thieves' Guild
// poisons from the SRD 5.1 (price in gp per dose), and anything a town is too small to stock, at a premium
const POISONS = [['Assassin\'s blood', 150, 'Ingested. Con save DC 10 or 1d12 poison and poisoned for 24 hours.'], ['Burnt othur fumes', 500, 'Inhaled. Con save DC 13 or 3d6 poison, repeated each turn.'],
  ['Carrion crawler mucus', 200, 'Contact. Con save DC 13 or poisoned and paralysed for 1 minute.'], ['Drow poison', 200, 'Injury. Con save DC 13 or poisoned for an hour; unconscious if it fails by 5.'],
  ['Essence of ether', 300, 'Inhaled. Con save DC 15 or poisoned and unconscious for 8 hours.'], ['Malice', 250, 'Inhaled. Con save DC 15 or poisoned and blinded for an hour.'],
  ['Midnight tears', 1500, 'Ingested. At midnight, Con save DC 17 or 9d6 poison.'], ['Oil of taggit', 400, 'Contact. Con save DC 13 or poisoned and unconscious for 24 hours.'],
  ['Pale tincture', 250, 'Ingested. Con save DC 16 or 1d6 poison each day; it can\'t be healed until cured.'], ['Purple worm poison', 2000, 'Injury. Con save DC 19 or 12d6 poison (half on a save).'],
  ['Serpent venom', 200, 'Injury. Con save DC 11 or 3d6 poison (half on a save).'], ['Torpor', 600, 'Ingested. Con save DC 15 or poisoned and incapacitated for 4d6 hours.'],
  ['Truth serum', 150, 'Ingested. Con save DC 11 or poisoned for an hour and unable to lie knowingly.'], ['Wyvern poison', 1200, 'Injury. Con save DC 15 or 7d6 poison (half on a save).']];
const POISON_ITEMS = POISONS.map(([name, gp, desc]) => ({ id: 'bm-' + idSlug(name), name, cat: 'Contraband', unit: 'dose', desc, base: gp, rarity: null, g: null, search: name.toLowerCase() }));
function blackMarketOpen(h, s) { return !!s && guildLevel(s, 'thieves') >= 1 && (!isPlayer() || (h && gjMember(h, 'thieves') && !gjLapsed(gjMember(h, 'thieves')))); }
function blackPrice(s, it, day) {
  const Lv = priceLevels(s, day == null ? market.day : day);
  if (it.cat === 'Contraband') return { gp: Math.round(it.base * Lv.gear * (0.9 + 0.3 * T.hash(hashStr(s.id + it.id) & 0xffffff, weekOf(market.day), 4111)) * 100) / 100, ok: T.hash(hashStr(s.id + it.id) & 0xffffff, weekOf(market.day), 4112) < 0.35 + 0.15 * guildLevel(s, 'thieves') };
  const r = shopItem(it, s, day == null ? market.day : day);
  return { gp: Math.round(r.gp * 1.5 * 100) / 100, ok: !r.ok && !!it.base && it.rarity !== 'legendary' && it.rarity !== 'artifact' && T.hash(hashStr(s.id + it.id) & 0xffffff, weekOf(market.day), 4113) < 0.25 };
}
function buyBlack(h, s, it) {
  const P = blackPrice(s, it);
  if (!P.ok) { toast('Not to be had this week.'); return false; }
  if (P.gp > goldOf(h) + 1e-9) { toast('Not enough gold: ' + money(P.gp) + ' needed.'); return false; }
  h.goldDelta -= P.gp;
  h.inv = (h.inv || []).concat([{ n: it.name + (it.cat === 'Contraband' ? ' (dose)' : ''), q: 1 }]);
  h.buys = (h.buys || []).filter((b) => b.d >= market.day - 60).concat([{ d: market.day, sid: s.id, id: it.id, q: 1, gp: P.gp, black: true }]);
  heroLog(h, 'buy', 'Bought ' + it.name + ' on the black market in ' + s.name + ' for ' + money(P.gp));
  return true;
}
function blackMarketHtml(h, s) {
  if (!blackMarketOpen(h, s)) return '';
  const den = placesOf(s).list.find((x) => x.org === 'thieves');
  const items = POISON_ITEMS.map((it) => [it, blackPrice(s, it)]).filter(([, P]) => P.ok)
    .concat((SRD.items || []).filter((it) => it.cat === 'Magic items' || it.cat === 'Armor' || it.cat === 'Weapons' || it.cat === 'Mounts & travel').map((it) => [it, blackPrice(s, it)]).filter(([, P]) => P.ok).slice(0, 12));
  let o = '<section class="bm"><h3>Black market <small class="meta">' + (isPlayer() ? 'for members of the guild' : 'DM and guild members') + '</small></h3><p class="small">Through ' + (den ? placeLink(s, den.key, den.name) : 'a contact') + '. Poisons, and goods too rare for ' + esc(s.name) + '\'s shops, at half as much again.' + (h ? '' : ' Pick a hero to buy.') + '</p>';
  o += items.length ? '<ul class="gj-join">' + items.map(([it, P]) => '<li><div><b>' + esc(it.name) + '</b><small>' + esc(it.cat === 'Contraband' ? it.desc : (it.rarity ? it.rarity + ' · ' : '') + 'not sold openly here') + '</small></div><span class="num">' + coinHtml(P.gp) + '</span>' + (h ? '<button type="button" class="btn sm" data-mkbm="' + esc(it.id) + '">Buy</button>' : '') + '</li>').join('') + '</ul>' : '<p class="meta">Nothing worth the risk this week.</p>';
  return o + '</section>';
}

// ---------- the hero's side of the Shop tab: their purse, what they can sell, and their caravans
function shopHeroPanel(h, s) {
  if (!h) return '';
  let o = '<div class="mk-purse"><span>Purse: <b>' + money(goldOf(h)) + '</b></span><button type="button" class="btn sm" data-hero="' + esc(h.id) + '">Open sheet</button></div>';
  const inv = (h.inv || []).map((x, i) => [x, i, sellPrice(h, s, x.n)]).filter(([, , P]) => P.gp > 0);
  if (inv.length) o += '<details class="mk-sell"><summary>Sell from ' + esc(h.name || 'the hero') + '\'s pack <small>' + (sellPrice(h, s, '').by ? Math.round(sellRate(h).r * 100) + '% of the price (' + esc(sellRate(h).by) + ')' : 'half the price') + '</small></summary><ul class="gj-join">' + inv.map(([x, i, P]) => '<li><div><b>' + esc(x.n) + (x.q > 1 ? ' ×' + x.q : '') + '</b></div><span class="num">' + coinHtml(P.gp) + '</span><button type="button" class="btn sm" data-mksell="' + i + '">Sell</button></li>').join('') + '</ul></details>';
  return o;
}
// one row's price cell for the picked hero
function heroPriceCell(h, s, it) {
  const P = heroPrice(h, s, it);
  if (!P.ok) return '<small>' + esc(P.why) + '</small>';
  return coinHtml(P.gp) + (P.parts.length ? '<small class="gj-disc">' + esc(P.parts.filter(Boolean).join(' · ')) + '</small>' : '') + (Number.isFinite(P.left) ? '<small class="stock' + (P.left <= 1 ? ' low' : '') + '">' + P.left + ' left</small>' : '') + '<button type="button" class="btn sm mkbuy" data-mkbuy="' + esc(it.id) + '">Buy</button>';
}
// the seller and haggling, shown when a row is opened
function itemSellerHtml(h, s, it) {
  const K = keeperFor(s, it.cat), mood = keeperMood(K), hg = h ? haggleOf(h, s, K, market.day) : null;
  return '<small class="note seller">Sold by ' + keeperWord(K, s) + (mood.word ? ', who ' + esc(mood.word) : '') + '.' + (h ? ' ' + (hg ? 'Haggled today: ' + hg.roll + ' + ' + (hg.tot - hg.roll) + ' = ' + hg.tot + ' against ' + hg.dc + (hg.f < 1 ? ', ' + Math.round((1 - hg.f) * 100) + '% off.' : hg.f > 1 ? ', and they took offence (+10%).' : ', no change.') : '<button type="button" class="btn sm" data-mkhag="' + esc(it.cat) + '">Haggle</button>') : '') + '</small>';
}
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-mkbuy],[data-mksell],[data-mkhag],[data-mkbm]');
  if (!b) return;
  ev.preventDefault(); ev.stopPropagation();
  const h = shopHero(), s = market.sid ? SBY.get(market.sid) : null;
  if (!h || !s) { toast('Pick a hero under Prices for.'); return; }
  if (b.dataset.mkbuy) { const it = (SRD.items || []).find((x) => x.id === b.dataset.mkbuy); if (it && buyItem(h, s, it, 1)) toast('Bought ' + it.name + '.'); }
  else if (b.dataset.mksell != null) { if (sellItem(h, s, +b.dataset.mksell)) toast('Sold.'); }
  else if (b.dataset.mkhag) { const x = doHaggle(h, s, b.dataset.mkhag); if (x) toast(x.f < 1 ? 'Haggled: ' + Math.round((1 - x.f) * 100) + '% off today.' : x.f > 1 ? 'They took offence: +10% today.' : 'They won\'t budge.'); }
  else if (b.dataset.mkbm) { const it = POISON_ITEMS.concat(SRD.items || []).find((x) => x.id === b.dataset.mkbm); if (it && buyBlack(h, s, it)) toast('Bought ' + it.name + '.'); }
  heroSave();
  renderPanel();
}, true);

// ---------- trade caravans
// Fund a wagon of one good from this town to a neighbour. The route's real dangers set the odds: monsters near
// both towns, bandits working the area, and war. Guards halve the risk for a tenth of the money. The outcome is
// worked out from the venture itself on the day it arrives, so every device agrees; prices on arrival day decide the
// sale.
const VENT_AMOUNTS = [25, 100, 250, 500, 1000];
function ventureRisk(s, n, day) {
  const th = (threatOf(s, day) + threatOf(n, day)) / 2;
  const Ls = localInfo(s), Ln = localInfo(n);
  let band = 0, war = 0;
  const rs = realmOfS(s), rn = realmOfS(n);
  for (const e of activeOn(day)) {
    if (e.type === 'bandits') band = Math.max(band, impact(e, s, Ls, day), impact(e, n, Ln, day));
    if (e.type === 'war') { const a = REALMS[e.ai], b = REALMS[e.bi]; if ((a === rs && b === rn) || (a === rn && b === rs)) war = 1; else if ([a, b].includes(rs) || [a, b].includes(rn)) war = Math.max(war, 0.5); }
  }
  const p = clamp(0.03 + 0.08 * Math.min(2, th) + 0.35 * Math.min(1, band) + 0.2 * war, 0.03, 0.75);
  const why = [th >= 0.6 ? 'monsters on the road' : '', band > 0.15 ? 'bandits about' : '', war >= 1 ? 'the two realms are at war' : war ? 'a war nearby' : ''].filter(Boolean);
  return { p, why };
}
const ventDays = (dist) => Math.max(1, Math.ceil(dist / 24));
// a big load floods a small market: the share of the price it still fetches
const ventSat = (n, gp) => 1 / (1 + 0.6 * gp / Math.max(10, n.pop * 0.08));
function ventureOptions(s, n, dist, day) {
  const here = pricesFor(s, day), there = pricesFor(n, day), haul = dist * 0.004;
  return GOODS.filter((g) => g.cat !== 'magic' && !g.tags.includes('lodging') && !g.tags.includes('meal') && inStock(s, g, day) && inStock(n, g, day) && !(n.tier === 1 && g.base >= 1))
    .map((g) => [g, there[g.i] / here[g.i] - 1 - haul]).sort((a, b) => b[1] - a[1]).slice(0, 8);
}
function sendVenture(h, s, n, dist, gname, gp, guards) {
  const g = GBY[gname];
  if (!g) return false;
  const cost = gp + (guards ? Math.round(gp * 0.1 * 100) / 100 : 0);
  if (cost > goldOf(h) + 1e-9) { toast('Not enough gold: ' + money(cost) + ' needed.'); return false; }
  const day = market.day, R = ventureRisk(s, n, day), buy = pricesFor(s, day)[g.i];
  const v = { id: 'v' + day.toString(36) + Math.floor(Math.random() * 1e6).toString(36), from: s.id, to: n.id, g: g.name, gp, units: gp / buy, dist, start: day, arrive: day + ventDays(dist), p: guards ? R.p / 2 : R.p, guards: !!guards };
  h.goldDelta -= cost;
  h.vent = (h.vent || []).concat([v]);
  heroLog(h, 'buy', 'Sent a caravan of ' + g.name.split(/[,(]/)[0].trim().toLowerCase() + ' from ' + s.name + ' to ' + n.name + ' (' + money(gp) + (guards ? ', with guards' : '') + ')');
  return true;
}
// what happened to a caravan that has arrived
function ventureResult(v) {
  const n = SBY.get(v.to), g = GBY[v.g];
  if (!n || !g) return { payout: 0, lost: 'all', why: 'The road is gone.' };
  const r = T.hash(hashStr(v.id) & 0xffffff, v.arrive, 4242);
  const sale = v.units * pricesFor(n, v.arrive)[g.i] * (1 - v.dist * 0.004) * ventSat(n, v.gp);
  if (r < v.p * 0.5) return { payout: 0, lost: 'all', why: 'The caravan never arrived: the wagons were taken on the road.' };
  if (r < v.p) return { payout: Math.round(sale * 0.5 * 100) / 100, lost: 'half', why: 'Raiders took half the load before it reached ' + n.name + '.' };
  return { payout: Math.round(sale * 100) / 100, lost: '', why: 'Sold in ' + n.name + ' at ' + money(pricesFor(n, v.arrive)[g.i]) + ' each.' };
}
function collectVenture(h, id) {
  const v = (h.vent || []).find((x) => x.id === id);
  if (!v || v.done || market.day < v.arrive) return null;
  const R = ventureResult(v);
  h.goldDelta += R.payout;
  h.vent = h.vent.map((x) => (x === v ? Object.assign({}, x, { done: R }) : x)).filter((x) => !x.done || x.arrive >= market.day - 120);
  heroLog(h, 'buy', 'Caravan to ' + (SBY.get(v.to) || {}).name + ': ' + R.why + ' ' + (R.payout ? money(R.payout) + ' back on ' + money(v.gp) + '.' : 'Lost ' + money(v.gp) + '.'));
  return R;
}
function venturesListHtml(h) {
  const L = (h.vent || []).slice().reverse();
  if (!L.length) return '';
  return '<ul class="gj-join vent">' + L.slice(0, 8).map((v) => {
    const a = SBY.get(v.from), b = SBY.get(v.to), left = v.arrive - market.day;
    const st = v.done ? (v.done.lost === 'all' ? 'Lost: ' : v.done.lost ? 'Half lost: ' : 'Sold: ') + money(v.done.payout) + ' on ' + money(v.gp) : left > 0 ? 'On the road: arrives ' + dateText(v.arrive) + ' (' + left + ' day' + (left === 1 ? '' : 's') + ')' : 'Arrived in ' + (b ? b.name : '?');
    return '<li><div><b>' + esc(v.g.split(/[,(]/)[0].trim()) + ': ' + esc(a ? a.name : '?') + ' → ' + esc(b ? b.name : '?') + '</b><small>' + money(v.gp) + (v.guards ? ' with guards' : '') + ' · ' + Math.round(v.p * 100) + '% risk · ' + esc(st) + '</small></div>' + (!v.done && left <= 0 ? '<button type="button" class="btn sm primary" data-vcollect="' + esc(v.id) + '|' + esc(h.id) + '">Collect</button>' : '') + '</li>';
  }).join('') + '</ul>';
}
const ventUI = { to: '', g: '', gp: 100, guards: false };
// with no destination chosen, start from the one with the best expected return for the money
function bestVentureTo(s, nb, day) {
  let best = nb[0], bv = -Infinity;
  for (const pr of nb) { const [n, d] = pr, o = ventureOptions(s, n, d, day)[0]; if (!o) continue; const v = (1 + o[1]) * ventSat(n, ventUI.gp) * (1 - ventureRisk(s, n, day).p * 0.75); if (v > bv) { bv = v; best = pr; } }
  return best;
}
function caravanHtml(s, day) {
  const h = shopHero();
  let o = '<section class="caravan"><h3>Trade caravans</h3><p class="small">Fund a wagon of goods to a neighbouring town. It sells on arrival at that day\'s price; the road\'s dangers decide whether it gets there.</p>' + shopHeroHtml(s);
  if (!h) return o + (heroes.list && heroes.list.length ? '' : '<p class="meta">Make a hero in the Heroes section to fund caravans.</p>') + '</section>';
  const nb = neighbours(s);
  if (!nb.length) return o + '<p class="meta">No roads lead to other markets from here.</p></section>';
  const pick = nb.find(([n]) => n.id === ventUI.to) || bestVentureTo(s, nb, day), [n, dist] = pick;
  const opts = ventureOptions(s, n, dist, day), g = opts.find(([x]) => x.name === ventUI.g) || opts[0];
  const R = ventureRisk(s, n, day), p = ventUI.guards ? R.p / 2 : R.p;
  o += '<div class="row2">' + fieldSel('vent-to', 'To', nb.map(([t, d]) => [t.id, t.name + ' · ' + Math.round(d) + ' mi, ' + ventDays(d) + ' day' + (ventDays(d) === 1 ? '' : 's') + ', ' + Math.round(ventureRisk(s, t, day).p * 100) + '% risk']), n.id) +
    (opts.length ? fieldSel('vent-g', 'Carrying', opts.map(([x, m]) => [x.name, x.name + ' (' + (m >= 0 ? '+' : '') + Math.round(m * 100) + '% today)']), g[0].name) : '<p class="meta">Nothing sells there that is also on sale here.</p>') + '</div>';
  if (opts.length) {
    const sat = ventSat(n, ventUI.gp), exp = ventUI.gp * (1 + g[1]) * sat * (1 - p * 0.75), spend = ventUI.gp * (ventUI.guards ? 1.1 : 1);
    const bestNb = bestVentureTo(s, nb, day), bo = ventureOptions(s, bestNb[0], bestNb[1], day)[0];
    const bestExp = bo ? (1 + bo[1]) * ventSat(bestNb[0], ventUI.gp) * (1 - ventureRisk(s, bestNb[0], day).p * 0.75) : 0;
    o += '<div class="row2">' + fieldSel('vent-gp', 'Investment', VENT_AMOUNTS.map((a) => [String(a), money(a)]), String(ventUI.gp)) + '<label class="check"><input type="checkbox" id="vent-guards"' + (ventUI.guards ? ' checked' : '') + '><span>Hire guards (+10%, halves the risk)</span></label></div>';
    o += '<p class="small">At today\'s prices the load would fetch ' + (g[1] >= 0 ? '+' : '') + Math.round(g[1] * 100) + '% after carriage' + (sat < 0.95 ? ', but ' + esc(n.name) + ' can only take so much: a load this size sells for ' + Math.round(sat * 100) + '% of the going price' : '') + '. Risk ' + Math.round(p * 100) + '%' + (R.why.length ? ' (' + esc(R.why.join(', ')) + ')' : '') + '. On average you would expect about ' + money(exp) + ' back for ' + money(spend) + ' spent: ' + (exp >= spend * 1.05 ? '<b class="vgain">a likely profit</b>' : exp >= spend * 0.97 ? 'roughly even' : '<b class="vloss">a likely loss</b>') + '.</p>' +
      (bestExp < 1 ? '<p class="note">No road from ' + esc(s.name) + ' pays well this week: prices here are close to those nearby. Watch for a shortage or a festival in a neighbouring town, or try again from a busier market.</p>' : '');
    o += '<div class="actions"><button type="button" class="btn primary" data-vsend="1">Send the caravan</button></div>';
  }
  const L = venturesListHtml(h);
  if (L) o += '<h4>' + esc(h.name || 'The hero') + '\'s caravans</h4>' + L;
  return o + '</section>';
}
document.addEventListener('change', (ev) => {
  const t = ev.target;
  if (!t || !/^vent-/.test(t.id || '')) return;
  if (t.id === 'vent-to') { ventUI.to = t.value; ventUI.g = ''; }
  else if (t.id === 'vent-g') ventUI.g = t.value;
  else if (t.id === 'vent-gp') ventUI.gp = +t.value || 100;
  else if (t.id === 'vent-guards') ventUI.guards = t.checked;
  renderPanel();
});
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-vsend],[data-vcollect]');
  if (!b) return;
  ev.preventDefault();
  if (b.dataset.vcollect) {
    const [vid, hid] = b.dataset.vcollect.split('|'), h = (heroes.list || []).find((x) => x.id === hid);
    if (!h) return;
    const R = collectVenture(h, vid);
    if (R) toast(R.why + (R.payout ? ' ' + money(R.payout) + '.' : ''));
  } else {
    const h = shopHero(), s = market.sid ? SBY.get(market.sid) : null;
    if (!h || !s) return;
    const nb = neighbours(s), pick = nb.find(([n]) => n.id === ventUI.to) || bestVentureTo(s, nb, market.day);
    if (!pick) return;
    const opts = ventureOptions(s, pick[0], pick[1], market.day), g = opts.find(([x]) => x.name === ventUI.g) || opts[0];
    if (g && sendVenture(h, s, pick[0], pick[1], g[0].name, ventUI.gp, ventUI.guards)) toast('The caravan sets out for ' + pick[0].name + '.');
  }
  heroSave();
  renderPanel();
});

// ---------- the watch list: goods you care about, starred on any market board
let watchList = [];
try { const w = JSON.parse(localStorage.getItem('atlas-watch') || '[]'); if (Array.isArray(w)) watchList = w.filter((x) => typeof x === 'string' && GBY[x]).slice(0, 12); } catch (e) { /* a private window: start empty */ }
const isWatched = (name) => watchList.includes(name);
function toggleWatch(name) {
  watchList = isWatched(name) ? watchList.filter((x) => x !== name) : watchList.concat([name]).slice(-12);
  try { localStorage.setItem('atlas-watch', JSON.stringify(watchList)); } catch (e) { /* not essential */ }
}
const watchStar = (g) => '<button type="button" class="wstar" data-watch="' + esc(g.name) + '" aria-pressed="' + isWatched(g.name) + '" aria-label="' + (isWatched(g.name) ? 'Stop watching ' : 'Watch ') + esc(g.name) + '" title="Watch this price">' + (isWatched(g.name) ? '★' : '☆') + '</button>';
// for the World page: each watched good, here and at its cheapest nearby
function watchTodayHtml() {
  if (!watchList.length) return '';
  const at = gst().party.at, h0 = (heroes.list || [])[0];
  const s = (at && SBY.get(at)) || (market.sid && SBY.get(market.sid)) || (h0 && h0.home && SBY.get(h0.home));
  if (!s) return '';
  const day = market.day, here = pricesFor(s, day), wk = pricesFor(s, day - 7), nb = neighbours(s);
  const rows = watchList.map((name) => {
    const g = GBY[name]; if (!g) return '';
    let best = [s, here[g.i]];
    for (const [n] of nb) { if (!inStock(n, g, day)) continue; const v = pricesFor(n, day)[g.i]; if (v < best[1]) best = [n, v]; }
    const chg = here[g.i] / wk[g.i] - 1;
    return '<li><span>' + watchStar(g) + ' ' + esc(name) + '</span><span>' + (inStock(s, g, day) ? coinHtml(here[g.i]) : '<small>not sold</small>') + (Math.abs(chg) >= 0.1 ? ' <em class="' + (chg > 0 ? 'up' : 'dn') + '">' + (chg > 0 ? '▲' : '▼') + Math.round(Math.abs(chg) * 100) + '%</em>' : '') + '</span><small>' + (best[0] !== s ? 'cheapest in <button type="button" class="link" data-nav="place" data-v="' + esc(best[0].id) + '">' + esc(best[0].name) + '</button> at ' + money(best[1]) : 'cheapest here') + '</small></li>';
  }).join('');
  return '<div class="gl-recent"><span class="lab">Watched prices in ' + esc(s.name) + '</span><ul class="watch">' + rows + '</ul></div>';
}
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-watch]');
  if (!b) return;
  ev.preventDefault(); ev.stopPropagation();
  toggleWatch(b.dataset.watch);
  renderPanel();
}, true);
