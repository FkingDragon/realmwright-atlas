
// ================================================================ living ecology, price explanations and the party chronicle

// ---------------------------------------------------------------- ecology: creature numbers follow seasons, prey, hunting and world events
const ECO_GROUPS = {
  grazers: ['Game and grazing beasts', '#8a9a7c'], predators: ['Predators', '#d27a32'], scavengers: ['Scavengers', '#a08a5a'],
  raiders: ['Raiders and war bands', '#c8a25a'], undead: ['Undead', '#9b8fbf'], monsters: ['Monsters and lairs', '#c8432f'], sea: ['Sea creatures', '#5f8fb0']
};
const ECO_GRAZE = new Set(['Deer', 'Elk', 'Camel', 'Giant Goat', 'Mammoth', 'Triceratops', 'Boar', 'Giant Boar', 'Giant Lizard', 'Giant Frog', 'Giant Crab']);
const ECO_SCAV = new Set(['Giant Vulture', 'Hyena', 'Jackal', 'Giant Rat', 'Swarm of Insects', 'Ghoul']);
const ECO_BEARS = new Set(['Brown Bear', 'Black Bear', 'Polar Bear', 'Werebear']);
const ecoGroupCache = new Map();
function ecoGroup(name) {
  let g = ecoGroupCache.get(name);
  if (g) return g;
  const ty = (MON[name] || [''])[0];
  g = AQUATIC.has(name) ? 'sea' : ECO_SCAV.has(name) ? 'scavengers' : /undead/.test(ty) ? 'undead' : ECO_GRAZE.has(name) ? 'grazers'
    : (/beast/.test(ty) || name === 'Owlbear' || name === 'Winter Wolf') ? (PEACEFUL.has(name) ? 'grazers' : 'predators') : RAIDERS.has(name) ? 'raiders' : 'monsters';
  ecoGroupCache.set(name, g);
  return g;
}
const ECO_R = 256;
const ecoCache = new Map();
let ecoKills = null, ecoKillsVer = -1;
function killList() {
  if (ecoKillsVer === mkVer && ecoKills) return ecoKills;
  ecoKills = [];
  const off = edits.monOff || {};
  for (const id in off) {
    if (off[id].st !== 'slain') continue;
    const sp = baseSpawn(id.replace(/\+$/, ''));
    if (sp) ecoKills.push({ rx: Math.floor(sp.x / ECO_R), ry: Math.floor(sp.y / ECO_R), g: ecoGroup(sp.name), d: off[id].d, name: sp.name });
  }
  ecoKillsVer = mkVer;
  return ecoKills;
}
// abundance per creature group in a 256-mile region on a given day, with the reasons
function ecoState(rx, ry, day) {
  const key = rx + '|' + ry + '|' + day + '|' + mkVer;
  let st = ecoCache.get(key);
  if (st) return st;
  const A = {}, why = {};
  for (const g in ECO_GROUPS) { A[g] = 1; why[g] = []; }
  const note = (g, f, txt) => { A[g] *= f; if (Math.abs(f - 1) >= 0.04) why[g].push([f, txt]); };
  // natural boom and bust: prey numbers wander over a year or two; predators follow about four months behind
  const ph = (rx * 7.31 + ry * 3.17) % 50;
  const prey = (t) => T.noise2(t / 230 + ph, rx * 1.7 + ry * 2.9 + 11);
  const p0 = prey(day), pLag = prey(day - 120);
  note('grazers', 1 + 0.38 * p0, p0 > 0.15 ? 'A boom year: good grazing and many young' : p0 < -0.15 ? 'A lean year: herds are thin' : 'Ordinary year');
  note('predators', 1 + 0.32 * pLag - 0.08 * p0, pLag > 0.15 ? 'Plenty of prey these past seasons, so more cubs survived' : pLag < -0.15 ? 'Prey was scarce, and fewer young survived' : 'Prey numbers steady');
  const n = (k, s) => T.noise2(day / 310 + ph * (k + 1), rx * 2.3 + ry * 1.1 + k * 17);
  note('raiders', 1 + 0.16 * n(1), 'Tribes and bands shift with the years');
  note('scavengers', 1 + 0.15 * n(2), 'Ordinary numbers');
  note('monsters', 1 + 0.1 * n(3), 'Ordinary numbers');
  note('sea', 1 + 0.18 * n(4), 'Shoals and currents change');
  // seasons
  const mo = Math.floor((((day % 360) + 360) % 360) / 30);
  if (mo >= 3 && mo <= 5) { note('grazers', 1.15, MONTHS[mo] + ': calving and lambing season'); note('predators', 1.08, MONTHS[mo] + ': young are born'); }
  if (mo >= 10 || mo === 0) { note('grazers', 0.85, MONTHS[mo] + ': winter thins the herds'); note('scavengers', 1.1, MONTHS[mo] + ': winter leaves carcasses'); }
  // world events nearby
  const cx = (rx + 0.5) * ECO_R, cy = (ry + 0.5) * ECO_R;
  const ri = CAPS.length ? T.realmAt(cx, cy, CAPS).i : -1;
  for (const e of activeOn(day)) {
    let f = 0;
    if (e.type === 'war') f = (ri === e.ai || ri === e.bi) ? e.I * envelope(e, day) * 0.7 : 0;
    else if (e.type === 'famine' || e.type === 'plague' || e.type === 'boom') { const r = Math.max(radiusAt(e, day), 30) + ECO_R * 0.4; const d = Math.hypot(e.x - cx, e.y - cy); f = d < r ? e.I * envelope(e, day) * (1 - d / r) : 0; }
    if (f < 0.05) continue;
    if (e.type === 'famine') { note('grazers', 1 - 0.38 * f, e.name + ': starving folk hunt the herds'); note('predators', 1 + 0.22 * f, e.name + ': hungry predators raid farms'); }
    if (e.type === 'plague') { note('undead', 1 + 1.6 * f, e.name + ': the unquiet dead walk'); note('scavengers', 1 + 0.6 * f, e.name + ': carrion everywhere'); }
    if (e.type === 'war') { note('scavengers', 1 + 0.9 * f, e.name + ': battlefields draw carrion-eaters'); note('undead', 1 + 0.5 * f, e.name + ': unburied dead'); note('raiders', 1 + 0.35 * f, e.name + ': deserters and opportunists'); note('grazers', 1 - 0.15 * f, e.name + ': armies forage the land'); }
    if (e.type === 'boom') note('raiders', 1 + 0.15 * f, e.name + ': rich caravans tempt raiders');
  }
  // hunting: every group slain lowers its kind's numbers here for half a year; killing predators lets prey recover
  for (const k of killList()) {
    if (k.rx !== rx || k.ry !== ry || k.d > day || day - k.d > 180) continue;
    const w = 1 - (day - k.d) / 180;
    note(k.g, 1 - 0.14 * w, k.name + ' slain on ' + shortDate(k.d));
    if (k.g === 'predators') note('grazers', 1 + 0.05 * w, 'Fewer predators since the ' + k.name.toLowerCase() + ' was slain');
  }
  for (const g in A) A[g] = clamp(A[g], 0.3, 2.6);
  st = { A, why };
  ecoCache.set(key, st);
  if (ecoCache.size > 6000) ecoCache.clear();
  return st;
}
const ecoAt = (x, y, day) => ecoState(Math.floor(x / ECO_R), Math.floor(y / ECO_R), day);
// a natural group after ecology: thinned out, swollen or joined by a second group
function ecoApply(sp, day, out) {
  const E = ecoAt(sp.x, sp.y, day);
  let a = E.A[ecoGroup(sp.name)];
  const mo = Math.floor((((day % 360) + 360) % 360) / 30);
  if (ECO_BEARS.has(sp.name) && (mo >= 10 || mo <= 1)) a *= 0.35;
  if (sp.u == null) { const h = hashStr(sp.id) >>> 0; sp.u = (h % 10007) / 10007; sp.u2 = ((h >>> 7) % 9973) / 9973; }
  if (a < 1) { if (sp.u > a) return; out.push(sp); return; }
  const grow = (a - 1) * 0.6;
  const big = (PACK[sp.name] && sp.count > 1) || sp.count > 2;
  out.push(big && grow > 0.05 ? Object.assign({}, sp, { count: Math.max(sp.count, Math.round(sp.count * (1 + grow))) }) : sp);
  if (sp.kind === 'roam' && sp.u2 < grow) {
    const ang = sp.u * Math.PI * 2, dist = 3 + sp.u2 * 5;
    out.push(Object.assign({}, sp, { id: sp.id + '+', x: Math.round((sp.x + Math.cos(ang) * dist) * 10) / 10, y: Math.round((sp.y + Math.sin(ang) * dist) * 10) / 10, twin: true }));
  }
}
// the live version of a spawn (after ecology) or null if it has dispersed
function spawnLive(id, day) {
  if (id.startsWith('p')) return baseSpawn(id);
  const base = baseSpawn(id.replace(/\+$/, ''));
  if (!base || base.start > day || base.end <= day) return null;
  const out = []; ecoApply(base, day, out);
  return out.find((s) => s.id === id) || null;
}
function ecoHtml(x, y, day, compact) {
  const E = ecoAt(x, y, day);
  const rows = Object.keys(ECO_GROUPS).filter((g) => g !== 'sea' || E.why.sea.length > 1);
  return '<ul class="eco">' + rows.map((g) => {
    const a = E.A[g], reasons = E.why[g].filter((r) => !/^Ordinary|steady$/.test(r[1])).sort((p, q) => Math.abs(Math.log(q[0])) - Math.abs(Math.log(p[0])));
    return '<li><span class="eg"><i style="background:' + ECO_GROUPS[g][1] + '"></i>' + ECO_GROUPS[g][0] + '</span><span class="ebar" aria-hidden="true"><em style="width:' + clamp(a / 2.6 * 100, 4, 100).toFixed(0) + '%"></em><b style="left:' + (100 / 2.6).toFixed(1) + '%"></b></span><span class="ev ' + (a > 1.15 ? 'up' : a < 0.85 ? 'dn' : '') + '">' + Math.round(a * 100) + '%</span>' +
      (reasons.length && !compact ? '<small>' + reasons.slice(0, 3).map((r) => esc(r[1]) + ' (' + (r[0] >= 1 ? '+' : '−') + Math.round(Math.abs(r[0] - 1) * 100) + '%)').join(' · ') + '</small>' : '') + '</li>';
  }).join('') + '</ul>';
}

// ---------------------------------------------------------------- prices: danger on the roads and game in the woods
function dangerQ(s, day) {
  const d0 = Math.floor(day / 10) * 10, t = (day - d0) / 10;
  return threatOf(s, d0) * (1 - t) + threatOf(s, d0 + 10) * t;
}
const extraCache = new Map();
function priceExtra(s, day) {
  const key = s.id + '|' + day + '|' + mkVer;
  let x = extraCache.get(key);
  if (x) return x;
  const dz = Math.min(2, dangerQ(s, day));
  const E = ecoAt(s.x, s.y, day);
  x = { road: 1 + 0.05 * dz, dz, game: 1 - 0.1 * (E.A.grazers - 1), stock: 1 + 0.08 * (E.A.predators - 1), G: E.A.grazers, P: E.A.predators };
  extraCache.set(key, x);
  if (extraCache.size > 20000) extraCache.clear();
  return x;
}
function extraMult(g, X) {
  let m = 1;
  if (g.tags.some((t) => IMPORT_TAGS.has(t))) m *= X.road;
  if (g.tags.includes('meat')) m *= clamp(X.game, 0.8, 1.15);
  if (g.tags.includes('livestock') || g.tags.includes('wool')) m *= clamp(X.stock, 0.9, 1.15);
  return m;
}
// every factor behind one good's price in one town on one day
function priceFactors(s, g, day) {
  const L = localInfo(s), mods = modsFor(s, day), F = [];
  const B = BIOME_FX[L.b] || {}, Ct = TIER_FX[s.tier] || {};
  let bm = 1, cm = 1, tm = 1, imp = false;
  for (const t of g.tags) { if (B[t]) bm *= B[t]; if (L.coastal && COAST_FX[t]) cm *= COAST_FX[t]; if (Ct[t]) tm *= Ct[t]; if (IMPORT_TAGS.has(t)) imp = true; }
  if (bm !== 1) F.push({ k: 'biome', m: bm, txt: bm < 1 ? 'Produced locally in the ' + T.NAMES[L.b].toLowerCase() : 'Hard to produce in the ' + T.NAMES[L.b].toLowerCase() });
  if (cm !== 1) F.push({ k: 'coast', m: cm, txt: 'Coastal town: sea trade and salt pans' });
  if (tm !== 1) F.push({ k: 'size', m: tm, txt: s.tier === 1 ? 'Village: food is local, made goods come from afar' : s.tier >= 3 ? 'Large market: many mouths, many makers' : 'Size of the market' });
  if (imp) { const im = 1 + Math.min(L.remote, 600) / 800; if (im > 1.01) F.push({ k: 'distance', m: im, txt: 'Carried ' + Math.round(L.remote) + ' miles from the nearest city' }); }
  for (const a of agendaList(s)) {
    if (!a.A.market) continue;
    let m = 1;
    for (const t in a.A.market) if (t === 'all' || g.tags.includes(t)) m *= 1 + (a.A.market[t] - 1) * a.strength;
    if (m !== 1) F.push({ k: 'agenda:' + a.p.id, m, txt: a.A.label + ' (' + npcName(a.p) + ')', pid: a.p.id });
  }
  const sm = seasonMult(g, day);
  if (Math.abs(sm - 1) > 0.005) { const mo = MONTHS[Math.floor((((day % 360) + 360) % 360) / 30)]; F.push({ k: 'season', m: sm, txt: mo + ': ' + (sm < 1 ? 'the harvest is in and stores are full' : 'last year\'s stores are running low') }); }
  const fl = fluct(g, L, day);
  F.push({ k: 'mood', m: fl, txt: 'Market mood: traders\' guesses, gossip and supply' });
  for (const [ti, f, e] of mods) { const eff = GOOD_EFF[g.i][ti]; if (eff) F.push({ k: 'ev:' + e.id, m: Math.max(0.3, 1 + eff * f), txt: e.name, eid: e.id, type: e.type }); }
  const X = priceExtra(s, day);
  if (imp && X.road > 1.005) F.push({ k: 'road', m: X.road, txt: 'Monsters on the roads: caravans need guards (' + threatWord(X.dz)[0].toLowerCase() + ')' });
  if (g.tags.includes('meat') && Math.abs(X.game - 1) > 0.005) F.push({ k: 'game', m: clamp(X.game, 0.8, 1.15), txt: X.G > 1 ? 'Game is plentiful, so hunters sell cheap meat' : 'Game is scarce this season' });
  if ((g.tags.includes('livestock') || g.tags.includes('wool')) && Math.abs(X.stock - 1) > 0.005) F.push({ k: 'stock', m: clamp(X.stock, 0.9, 1.15), txt: X.P > 1 ? 'Predators are taking flocks and herds' : 'Few predators: herds are safe' });
  return F;
}
const pctTxt = (m) => (m >= 1 ? '+' : '−') + Math.abs((m - 1) * 100).toFixed(Math.abs(m - 1) < 0.1 ? 1 : 0) + '%';
function whyHtml(s, g, day) {
  const F = priceFactors(s, g, day), F7 = priceFactors(s, g, day - 7);
  const now = pricesFor(s, day)[g.i], wk = pricesFor(s, day - 7)[g.i];
  const local = localInfo(s).local[g.i];
  let raw = 1; for (const f of F) if (['biome', 'coast', 'size', 'distance'].includes(f.k) || f.k.startsWith('agenda:')) raw *= f.m;
  const fine = (gp) => (gp < 0.1 ? (gp * 100).toFixed(1).replace(/\.0$/, '') + ' cp' : gp < 1 ? (gp * 10).toFixed(1).replace(/\.0$/, '') + ' sp' : money(gp));
  let h = '<div class="why"><p class="small"><b>' + esc(g.name) + '</b>: ' + fine(g.base) + ' list price → <b>' + fine(now) + '</b> here today (' + pctTxt(now / g.base) + ').</p><table class="whyt"><tbody>';
  const label = (f) => (f.eid ? eLink(findEvent(f.eid), f.txt) : f.pid ? pLink(npcById(f.pid), f.txt) : esc(f.txt));
  for (const f of F.slice().sort((a, b) => Math.abs(Math.log(b.m)) - Math.abs(Math.log(a.m)))) {
    if (Math.abs(f.m - 1) < 0.003) continue;
    h += '<tr><td>' + label(f) + '</td><td class="num ' + (f.m > 1 ? 'up' : 'dn') + '">' + pctTxt(f.m) + '</td></tr>';
  }
  if (Math.abs(raw - local) / local > 0.01) h += '<tr><td class="meta">Local factors are capped at ×0.45–×2.2 of list price</td><td></td></tr>';
  h += '</tbody></table>';
  // what changed this week
  const map7 = new Map(F7.map((f) => [f.k, f.m]));
  const ch = [];
  for (const f of F) { const m0 = map7.get(f.k) || 1; const r = f.m / m0; if (Math.abs(r - 1) > 0.004) ch.push([r, f, map7.has(f.k) ? '' : 'new']); }
  for (const f of F7) if (!F.some((x) => x.k === f.k) && Math.abs(f.m - 1) > 0.004) ch.push([1 / f.m, f, 'ended']);
  ch.sort((a, b) => Math.abs(Math.log(b[0])) - Math.abs(Math.log(a[0])));
  const tot = now / wk;
  h += '<p class="small"><b>This week ' + (Math.abs(tot - 1) < 0.005 ? 'steady' : pctTxt(tot)) + '</b>' + (ch.length ? ': ' + ch.slice(0, 4).map(([r, f, tag]) => (tag === 'ended' ? label(f) + ' ended' : tag === 'new' ? label(f) + ' began' : label(f)) + ' <span class="' + (r > 1 ? 'up' : 'dn') + '">' + pctTxt(r) + '</span>').join(', ') : '') + '.</p></div>';
  return h;
}
// a plain-language summary of what is moving prices in a town this week
function moversHtml(s, day) {
  // the week's biggest real moves, each with its main cause; day-to-day trading swings ("market mood") are folded away
  const picks = BASKET.map((gi) => GOODS[gi]).map((g) => [pricesFor(s, day)[g.i] / pricesFor(s, day - 7)[g.i], g]).filter(([r]) => Math.abs(r - 1) > 0.02).sort((a, b) => Math.abs(Math.log(b[0])) - Math.abs(Math.log(a[0])));
  const why = (r, g) => {
    const F = priceFactors(s, g, day), F7 = new Map(priceFactors(s, g, day - 7).map((f) => [f.k, f]));
    let best = null, bv = 0;
    for (const f of F) { if (f.k === 'mood') continue; const m0 = F7.has(f.k) ? F7.get(f.k).m : 1; const v = Math.log(f.m / m0); if (Math.sign(v) === Math.sign(Math.log(r)) && Math.abs(v) > bv) { bv = Math.abs(v); best = [f, F7.has(f.k) ? '' : ' began']; } }
    for (const [k, f] of F7) if (k !== 'mood' && !F.some((x) => x.k === k)) { const v = -Math.log(f.m); if (Math.sign(v) === Math.sign(Math.log(r)) && Math.abs(v) > bv) { bv = Math.abs(v); best = [f, ' ended']; } }
    return best && bv > 0.01 ? best : null;
  };
  const real = [], noise = [];
  for (const [r, g] of picks) { const b = why(r, g); if (b) real.push([r, g, b]); else noise.push([r, g]); if (real.length >= 3) break; }
  if (!real.length) return '<p class="meta"><b>This week:</b> only small day-to-day swings; nothing big is moving prices here.' + (noise.length ? ' The largest: ' + noise.slice(0, 2).map(([r, g]) => esc(g.name) + ' ' + pctTxt(r)).join(', ') + '.' : '') + '</p>';
  // group the moves by their cause
  const groups = new Map();
  for (const [r, g, b] of real) { const k = b[0].k + b[1]; if (!groups.has(k)) groups.set(k, { b, list: [] }); groups.get(k).list.push([r, g]); }
  return '<section class="movers-why"><h3>Why prices are moving</h3><ul>' + [...groups.values()].map(({ b, list }) => {
    const cause = (b[0].eid ? eLink(findEvent(b[0].eid), b[0].txt) : esc(b[0].txt)) + b[1];
    return '<li><span class="cause">' + cause + '</span><span class="what">' + list.map(([r, g]) => '<button type="button" class="link" data-mk="why" data-v="' + g.i + '">' + esc(g.name) + '</button> <span class="' + (r > 1 ? 'up' : 'dn') + '">' + pctTxt(r) + '</span>').join(' · ') + '</span></li>';
  }).join('') + '</ul>' + (noise.length ? '<p class="hint">Smaller day-to-day swings are left out. </p>' : '') + '<p class="hint">Tap any item on the board below to see everything behind its price.</p></section>';
}

// ---------------------------------------------------------------- the party chronicle and where the party is
function chronAdd(entry) {
  const g = gst();
  g.party.log = (g.party.log || []).concat([Object.assign({ d: market.day }, entry)]);
}
function heroLog(h, k, t) { h.log = (h.log || []).concat([{ d: market.day, k, t }]); if (h.log.length > 400) h.log = h.log.slice(-400); }
function chronicle() {
  const out = [];
  for (const e of gst().party.log || []) out.push(Object.assign({ who: 'Party' }, e));
  for (const h of heroes.list) for (const e of h.log || []) out.push(Object.assign({ who: h.name || 'Hero', hero: h.id }, e));
  const npcs = edits.npc || {};
  for (const id in npcs) for (const e of npcs[id].log || []) if (!/^The party (completed|failed)/.test(e.t)) out.push({ d: e.d, t: e.t, k: 'npc', npc: id, who: 'Party' });
  out.forEach((e, i) => { e.i = i; });
  out.sort((a, b) => b.d - a.d || b.i - a.i);
  return out;
}
const CHRON_ICON = { quest: '◆', mon: '✶', travel: '➜', hero: '★', buy: '¤', npc: '☉', down: '✝', guild: '⚑', dt: '☾' };
function chronPanel() {
  const P = gst().party, at = P.at ? SBY.get(P.at) : null, day = market.day;
  let h = '<div class="mk-head"><div><div class="eyebrow">Heroes · Chronicle</div><h2>' + esc(P.name || 'The party') + '</h2></div>' + CLOSE_BTN + '</div>';
  h += '<button type="button" class="link back" data-hr="step" data-v="sheet">‹ Back to heroes</button>';
  h += '<div class="mk-body hero-body"><section><h3>Where the party is</h3>' + (at ? '<p>' + tLink(at) + ' <small class="meta">' + TIERS[at.tier].name + (P.atDay != null ? ' · since ' + dateText(P.atDay) : '') + '</small></p>' : '<p class="meta">Not set. Put the party on the map to track their travels.</p>') +
    '<div class="actions"><button type="button" class="btn sm' + (heroes.pickParty ? ' primary' : '') + '" data-hr="pickparty">' + (heroes.pickParty ? 'Now tap a settlement…' : at ? 'Travel: tap the destination' : 'Place on the map') + '</button>' + (at ? '<button type="button" class="btn sm" data-hr="partyfly">Show on map</button>' : '') + '</div>' +
    '<label class="check"><input type="checkbox" id="hc-pass"' + (P.pass ? ' checked' : '') + '><span>Travelling passes the days<small>Moves the calendar on by the journey (24 miles a day on roads, slower off them), so events, prices and monsters move with you.</small></span></label></section>';
  const all = chronicle();
  const f = heroes.chronFilter || 'all';
  const kinds = [['all', 'All'], ['quest', 'Quests'], ['mon', 'Monsters'], ['travel', 'Travel'], ['hero', 'Heroes'], ['npc', 'People']];
  h += '<section><h3>Chronicle (' + all.length + ')</h3><div class="chips">' + kinds.map(([k, l]) => chip('chronf', k, l, f === k)).join('') + '</div>';
  const list = all.filter((e) => f === 'all' || (e.k || 'quest') === f || (f === 'hero' && (e.k === 'buy' || e.k === 'down')));
  if (!list.length) h += '<p class="meta">Nothing recorded yet. Quests taken and finished, monsters slain, journeys, purchases, level-ups and close calls all appear here as they happen.</p>';
  let last = null;
  h += '<ol class="chron">';
  for (const e of list.slice(0, 200)) {
    const dd = dateText(e.d);
    if (dd !== last) { h += '<li class="cd">' + dd + '</li>'; last = dd; }
    let txt = esc(e.t);
    if (e.sid && SBY.get(e.sid)) txt = txt.replace(esc(SBY.get(e.sid).name), tLink(SBY.get(e.sid)));
    if (e.npc) { const p = npcById(e.npc); if (p) txt = pLink(p) + ': ' + txt; }
    if (e.spawn) txt += ' <button type="button" class="link" data-mon-spawn="' + esc(e.spawn) + '">where</button>';
    if (e.q && e.hall) txt += ' <button type="button" class="link" data-quest="' + esc(e.q) + '|' + esc(e.hall) + '">quest</button>';
    h += '<li><i>' + (CHRON_ICON[e.k] || '◆') + '</i><span>' + (e.hero ? '<button type="button" class="link" data-hero="' + esc(e.hero) + '">' + esc(e.who) + '</button>: ' : '') + txt + '</span></li>';
  }
  h += '</ol></section>';
  h += '<div class="field"><label class="lab" for="hc-chronnote">Add a note to the chronicle</label><div class="inrow"><input id="hc-chronnote" maxlength="200" placeholder="The party swore vengeance on the Red Hand"><button type="button" class="btn sm" data-hr="chronnote">Add</button></div></div>';
  return h + '</div>';
}
function travelDays(a, b) {
  const d = Math.hypot(a.x - b.x, a.y - b.y);
  const road = neighbours(a).some(([n]) => n === b);
  return { miles: Math.round(d * (road ? 1.15 : 1.35)), days: Math.max(1, Math.round(d * (road ? 1.15 : 1.35) / (road ? 24 : 18))) };
}
function partyTravel(sid) {
  const P = gst().party, from = P.at ? SBY.get(P.at) : null, to = SBY.get(sid);
  if (!to) return;
  heroes.pickParty = false;
  if (from && from.id === to.id) { toast('The party is already in ' + to.name + '.'); renderPanel(); return; }
  const tr = from ? travelDays(from, to) : null;
  commit('Party travels', () => { const g = gst(); g.party.at = to.id; g.party.atDay = market.day + (tr && g.party.pass ? tr.days : 0); chronAdd({ k: 'travel', sid: to.id, t: from ? 'Travelled from ' + from.name + ' to ' + to.name + ' (' + tr.miles + ' miles, about ' + tr.days + ' day' + (tr.days > 1 ? 's' : '') + ')' : 'The party is in ' + to.name, d: market.day }); }, {});
  if (tr && gst().party.pass) { advanceDays(tr.days); toast('The party reaches ' + to.name + ' after ' + tr.days + ' day' + (tr.days > 1 ? 's' : '') + ' on the road.'); }
  else toast('The party is now in ' + to.name + '.');
  renderPanel(); requestRender();
}
function drawParty() {
  const P = edits.guild && edits.guild.party, s = P && P.at ? SBY.get(P.at) : null;
  if (!s) return;
  const X = sx(s.x), Y = sy(s.y);
  if (X < -30 || X > vw + 30 || Y < -40 || Y > vh + 30) return;
  ctx.save();
  ctx.strokeStyle = '#1a140c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X - 2, Y - 6); ctx.lineTo(X - 2, Y - 30); ctx.stroke();
  ctx.fillStyle = '#e2c37a'; ctx.strokeStyle = '#1a140c'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(X - 1, Y - 30); ctx.lineTo(X + 15, Y - 26); ctx.lineTo(X - 1, Y - 20); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}
document.addEventListener('click', (ev) => { const t = ev.target.closest('[data-party]'); if (!t) return; ev.preventDefault(); partyTravel(t.dataset.party); });
