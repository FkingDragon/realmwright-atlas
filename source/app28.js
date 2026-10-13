// ================================================================ People: households, around town now, the town chronicle (v23)
// Ideas from Sean and Adam's Market Ledger, built on the atlas's own people, places, events and history:
// - the Residents list can be grouped by household ("HOUSE ELWOOD"), from the family ties already generated;
// - "Around town now" says where every notable person is at any hour, using their day from activity();
// - each town keeps a Chronicle, written day by day from its events, deaths, notices, sightings and gossip.
// Everything is worked out from the seed and the calendar, so it costs nothing to save and is the same on every device.
people.view = 'list';
people.hour = 12;
people.chronDays = 7;

// ---------------------------------------------------------------- households
const FAMILY = new Set(['spouse', 'parent', 'sibling']);
function households(s, list) {
  const tp = townPeople(s), byIdx = new Map();
  for (const p of list) if (p.adv == null && !String(p.id).startsWith('cn') && p.idx != null) byIdx.set(p.idx, p);
  const up = new Map();
  const find = (a) => { while (up.get(a) !== a) { up.set(a, up.get(up.get(a))); a = up.get(a); } return a; };
  for (const i of byIdx.keys()) up.set(i, i);
  for (const r of tp.rels) if (FAMILY.has(r.type) && byIdx.has(r.a) && byIdx.has(r.b)) { const a = find(r.a), b = find(r.b); if (a !== b) up.set(a, b); }
  const groups = new Map();
  for (const [i, p] of byIdx) { const k = find(i); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(p); }
  const houses = [], alone = [];
  for (const g of groups.values()) {
    if (g.length < 2) { alone.push(g[0]); continue; }
    g.sort((a, b) => b.age - a.age);
    const names = {};
    for (const p of g) if (p.last) names[p.last] = (names[p.last] || 0) + 1;
    const top = Object.entries(names).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    houses.push({ name: top ? 'House ' + top[0] : 'Household of ' + g[0].first, list: g });
  }
  houses.sort((a, b) => b.list.length - a.list.length || a.name.localeCompare(b.name));
  for (const p of list) if (!byIdx.has(p.idx) || p.adv != null || String(p.id).startsWith('cn')) alone.push(p);
  return { houses, alone };
}
function householdListHtml(s, list, day) {
  const H = households(s, list);
  let h = '';
  for (const g of H.houses) h += '<h4 class="house-h">' + esc(g.name) + ' <small>' + g.list.length + '</small></h4><ul class="evlist people">' + g.list.map((p) => personRow(p, day)).join('') + '</ul>';
  if (H.alone.length) h += '<h4 class="house-h">On their own <small>' + H.alone.length + '</small></h4><ul class="evlist people">' + H.alone.map((p) => personRow(p, day)).join('') + '</ul>';
  return h;
}
function residentsViewToggle() {
  return '<div class="seg sm" role="group" aria-label="Arrange residents">' + [['list', 'List'], ['house', 'Households']].map(([k, l]) => '<button type="button" data-p28="view" data-v="' + k + '" aria-pressed="' + (people.view === k) + '">' + l + '</button>').join('') + '</div>';
}

// ---------------------------------------------------------------- around town now
const HOUR_PART = (h) => (h < 5 || h >= 22 ? 'night' : h < 8 ? 'dawn' : h < 12 ? 'morning' : h < 14 ? 'midday' : h < 18 ? 'afternoon' : 'evening');
const hourText = (h) => String(h).padStart(2, '0') + ':00';
const lowFirst = (t) => (t ? t.charAt(0).toLowerCase() + t.slice(1) : t);
// where someone is at a given hour: { key: a place key, '~home' or '~away', text, dm: true when only the DM may see it }
function whereAt(p, s, day, hour) {
  if ((p.status || 'Alive') === 'Dead') return null;
  const a = activity(p, day), part = HOUR_PART(hour);
  if ((p.status || 'Alive') !== 'Alive' || /^(Away|On the road)/.test(a.text)) return { key: '~away', text: a.text };
  const ph = p.h || hashStr(p.id), r = (k) => T.hash(ph, day, 2200 + k);
  const own = ownPlaceKey(p, s);
  const pub = (o) => (placeGet(s, o) ? o : null);
  const tavern = () => resolveToken('tavern', p, s, r(9));
  const temple = () => resolveToken('temple', p, s, r(8));
  const barracks = () => resolveToken('barracks', p, s, r(7));
  const ownPl = own ? placesOf(s).list.find((o) => o.key === own) : null;
  const keeper = ownPl && (ownPl.kind === 'tavern' || ownPl.kind === 'inn') ? own : null;
  const day0 = { key: a.place || own || '~about', text: a.text };
  if (/^Sick|^In mourning/.test(a.text)) return { key: '~home', text: a.text };
  if (part === 'night') {
    if (keeper && hour >= 22) return { key: keeper, text: 'Closing up for the night' };
    if (p.group === 'watch' && r(1) < 0.35) { const b = barracks(); if (b) return { key: b, text: 'On the night watch' }; }
    if (a.secret && r(2) < 0.6) return { key: a.secretPlace || '~about', text: a.secret, dm: true };
    return { key: '~home', text: 'Asleep' };
  }
  if (a.ev && part !== 'dawn') return day0;
  if (part === 'dawn') {
    if (p.group === 'faith') { const t = temple(); if (t) return { key: t, text: 'Dawn prayers' }; }
    if (p.group === 'labour' || /Baker|Farmer|Fisher|Miller|Herder|Shepherd/.test(p.job)) return { key: day0.key, text: 'Up early for the day\'s work' };
    return { key: '~home', text: 'Breakfast at home' };
  }
  const child = p.age < 16;
  if (part === 'midday' && !keeper && !child && r(3) < 0.3) { const t = tavern(); if (t) return { key: t, text: 'A midday meal at ' + ((placeGet(s, t) || {}).name || 'the tavern') }; }
  if (part === 'morning' || part === 'midday' || part === 'afternoon') return day0;
  // evening
  if (keeper) return { key: keeper, text: 'Serving the evening crowd' };
  if (p.group === 'faith' && r(4) < 0.6) { const t = temple(); if (t) return { key: t, text: 'Leading the evening service' }; }
  if (p.group === 'watch' && r(4) < 0.5) { const b = barracks(); if (b) return { key: b, text: 'On the evening watch' }; }
  if (!child && r(5) < (day % 7 === 6 ? 0.5 : 0.3)) { const t = tavern(); if (t) return { key: t, text: 'Drinking at ' + ((placeGet(s, t) || {}).name || 'the tavern') }; }
  if (p.group === 'leader' && r(6) < 0.4) return { key: pub('hall') || '~home', text: 'Dining with guests' };
  return { key: '~home', text: 'At home' + (p.group === 'leader' ? '' : ' with family') };
}
function aroundNowHtml(s, day) {
  const hour = people.hour, dm = !isPlayer();
  const at = new Map();
  for (const p of residents(s)) {
    const w = whereAt(p, s, day, hour);
    if (!w || (w.dm && !dm)) continue;
    const k = w.key;
    if (!at.has(k)) at.set(k, []);
    at.get(k).push([p, w]);
  }
  const special = ['~about', '~home', '~away'], LBL = { '~about': 'About town', '~home': 'At home', '~away': 'Away from town' };
  const places = [...at.keys()].filter((k) => !special.includes(k)).sort((a, b) => at.get(b).length - at.get(a).length);
  const row = ([p, w]) => '<li>' + pLink(p) + ' <small>' + (w.dm ? '<em class="dmtag">DM</em> ' : '') + esc(lowFirst(w.text)) + '</small></li>';
  let h = '<p class="meta">' + hourText(hour) + ', ' + HOUR_PART(hour) + ' · ' + dateText(day) + (day % 7 === 6 ? ' (rest day)' : '') + '</p>';
  for (const k of places) h += '<h4 class="house-h">' + placeLink(s, k) + ' <small>' + at.get(k).length + '</small></h4><ul class="actlist">' + at.get(k).map(row).join('') + '</ul>';
  for (const k of special) if (at.has(k)) {
    const L = at.get(k), open = k === '~about' || (k === '~home' && !places.length);
    h += '<details class="around-more"' + (open ? ' open' : '') + '><summary><span class="house-h">' + LBL[k] + '</span> <small>' + L.length + '</small></summary><ul class="actlist">' + L.map(row).join('') + '</ul></details>';
  }
  return h;
}
function aroundNowSection(s, day) {
  return '<section><h3>Around town now</h3><div class="field"><label class="lab" for="pp-hour">Time of day</label><input id="pp-hour" type="range" min="0" max="23" step="1" value="' + people.hour + '" aria-valuetext="' + hourText(people.hour) + ', ' + HOUR_PART(people.hour) + '"></div><div id="aroundNow">' + aroundNowHtml(s, day) + '</div><p class="hint">Where the notable folk are, hour by hour: at work by day, at the tavern, temple or home in the evening, and the night watch after dark.' + (isPlayer() ? '' : ' Lines marked DM are secret business only you can see.') + '</p></section>';
}

// ---------------------------------------------------------------- the town chronicle, written each day
const EV_START = { plague: (e) => e + ' reaches the town', famine: (e) => e + ': bread grows scarce', war: (e) => e + ': the war is felt here', bandits: (e) => e + ' on the roads nearby', festival: (e) => e + ' begins', feast: (e) => e + ' is held', boom: (e) => e + ': merchants pour in' };
const chronCache = new Map();
function chronDay(s, d) {
  const key = s.id + '|' + d + '|' + mkVer + '|' + editsVerKey();
  const c = chronCache.get(key);
  if (c) return c;
  const out = [];
  // events arriving and ending
  const now = modsFor(s, d).filter((m) => m[1] > 0.15), prev = modsFor(s, d - 1).filter((m) => m[1] > 0.15);
  const ids = (L) => new Set(L.map((m) => m[2].id));
  const pi = ids(prev), ni = ids(now);
  for (const [, , e] of now) if (!pi.has(e.id)) out.push({ k: 'ev', h: (EV_START[e.type] || ((x) => x + ' begins'))(eLink(e)) });
  for (const [, , e] of prev) if (!ni.has(e.id)) out.push({ k: 'ev', h: eLink(e) + ' is over' });
  // deaths
  for (const p of deadOf(s, d)) if (p.fateDay === d) out.push({ k: 'down', h: pLink(p) + ', ' + esc(lowFirst(p.job)) + ', died' + (p.fate ? ': ' + esc(lowFirst(p.fate)) : '') });
  // guild notices
  for (const q of questsFor(s, d)) if (q.post === d && !q.custom) out.push({ k: 'quest', h: 'The guild posts a notice: <button type="button" class="link" data-quest="' + esc(q.id) + '|' + esc(s.id) + '">' + esc(q.title) + '</button>' });
  // sightings (the DM only: placed and roaming monsters stay hidden from players)
  if (!isPlayer()) {
    const seen = new Set();
    for (const { sp, d: dist } of presence(s, d)) if (sp.start > d - 1 && sp.start <= d && dist <= 30 && !seen.has(sp.name)) { seen.add(sp.name); out.push({ k: 'mon', h: 'Travellers report ' + (sp.count > 1 ? sp.count + ' ' : 'a ') + esc(sp.count > 1 ? plural(sp.name) : sp.name.toLowerCase()) + ' about ' + Math.max(1, Math.round(dist)) + ' miles out', dm: true }); }
  }
  // the party, when it was here
  for (const e of chronicle()) if (e.d === d && (e.sid === s.id || e.hall === s.id || e.loc === s.id)) out.push({ k: 'party', h: (e.hero ? esc(e.who) + ': ' : 'The party: ') + esc(e.t) });
  // gossip: who met whom
  const met = new Set();
  const list = residents(s).filter((p) => (p.status || 'Alive') === 'Alive').sort((a, b) => T.hash(a.h || 1, d, 2301) - T.hash(b.h || 1, d, 2301));
  let n = 0;
  for (const p of list) {
    if (n >= 2) break;
    const so = socialToday(p, s, d);
    if (!so || so.secret || !so.with || /^at home/i.test(so.text)) continue;
    const pair = [p.id, so.with].sort().join('~');
    if (met.has(pair)) continue;
    met.add(pair); n++;
    out.push({ k: 'npc', h: pLink(p) + ': ' + esc(lowFirst(so.text)) });
  }
  // the weekly market report
  if (d % 7 === 6) {
    const r = basketIndex(s, d) / basketIndex(s, d - 7) - 1;
    out.push({ k: 'buy', h: Math.abs(r) < 0.03 ? 'Market day: prices hold steady' : 'Market day: prices are ' + (r > 0 ? 'up ' : 'down ') + Math.round(Math.abs(r) * 100) + '% on the week' });
  }
  if (!out.length) out.push({ k: 'quiet', h: 'A quiet day' });
  chronCache.set(key, out);
  if (chronCache.size > 600) chronCache.delete(chronCache.keys().next().value);
  return out;
}
const editsVerKey = () => (edits.npcAdd || []).length + ':' + Object.keys(edits.npc || {}).length + ':' + ((gst().party.log || []).length) + ':' + heroes.list.reduce((a, h) => a + (h.log || []).length, 0);
const plural = (n) => (/(s|x|ch|sh)$/i.test(n) ? n + 'es' : /[^aeiou]y$/i.test(n) ? n.slice(0, -1) + 'ies' : /f$/i.test(n) ? n.slice(0, -1) + 'ves' : n + 's').toLowerCase();
const CHRON_TOWN_ICON = { ev: '◆', down: '✝', quest: '❖', mon: '✶', party: '★', npc: '☉', buy: '¤', quiet: '·' };
function chronicleTab(s, day) {
  if (!s) return '<div class="empty-note"><p>Tap a settlement to read its chronicle.</p></div>';
  const n = people.chronDays;
  let h = '<section><h3>The ' + esc(placeKind(s).toLowerCase()) + ' chronicle</h3><ol class="chron">';
  for (let d = day; d > day - n && d >= 1; d--) {
    h += '<li class="cd">' + dateText(d) + (d === day ? ' · today' : '') + '</li>';
    for (const e of chronDay(s, d)) h += '<li class="ch-' + e.k + '"><i>' + (CHRON_TOWN_ICON[e.k] || '◆') + '</i><span>' + (e.dm ? '<em class="dmtag">DM</em> ' : '') + e.h + '</span></li>';
  }
  h += '</ol>' + (n < 60 ? '<div class="actions"><button type="button" class="btn sm" data-p28="chronmore">Earlier days</button></div>' : '') + '</section>';
  h += '<p class="hint">Written fresh each day from what happens to ' + esc(s.name) + ': news of wars, plague, famine and festivals, deaths, guild notices, who met whom, and the market on rest days.' + (isPlayer() ? '' : ' Monster sightings show only to you.') + ' The party\'s own deeds here appear too.</p>';
  return h;
}

// ---------------------------------------------------------------- input
$('inspector').addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-p28]');
  if (!b || tool !== 'people') return;
  const a = b.dataset.p28;
  if (a === 'view') { people.view = b.dataset.v === 'house' ? 'house' : 'list'; renderPanel(); }
  else if (a === 'chronmore') { people.chronDays = Math.min(60, people.chronDays + 7); renderPanel(); }
});
$('inspector').addEventListener('input', (ev) => {
  const t = ev.target;
  if (t.id !== 'pp-hour' || tool !== 'people') return;
  people.hour = clamp(Math.round(+t.value || 0), 0, 23);
  t.setAttribute('aria-valuetext', hourText(people.hour) + ', ' + HOUR_PART(people.hour));
  const s = people.sid ? SBY.get(people.sid) : null, box = $('aroundNow');
  if (s && box) box.innerHTML = aroundNowHtml(s, market.day);
});
