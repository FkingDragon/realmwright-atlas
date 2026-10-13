
// ================================================================ lasting history (v20)
// World events used to vanish without trace once they ended. Now plague, famine and war leave marks that last:
// fewer people for a few years, notable folk who died, and front-line towns held by the winning realm for a year.
// Everything is still worked out from the seed and the date, so nothing extra is stored in the save.
const HIST_TYPES = new Set(['plague', 'famine', 'war', 'boom', 'bandits']);
const HIST_BACK = 1160;      // days of history kept in view (a little over three years)
const RECOVER = 1000;        // days for a town to win back what it lost
let histG = null;
function histEvents(day) {
  const b = Math.floor(day / 30);
  if (histG && histG.b === b && histG.ver === mkVer) return histG.list;
  const d1 = b * 30 + 29;
  const list = genEvents(d1 - HIST_BACK, d1).filter((e) => HIST_TYPES.has(e.type));
  for (const e of list) { e.eh = hashStr(e.id) & 0xffffff; e.mid = Math.floor((e.start + e.end) / 2); }
  list.sort((a, b2) => a.start - b2.start);
  histG = { b, ver: mkVer, list };
  warPow = null;
  return list;
}

// ---------------------------------------------------------------- who won each war
let warPow = null;
function realmPower(i) {
  if (!warPow || warPow.ver !== mkVer) {
    const pw = new Float64Array(CAPLIST.length);
    for (const s of SET) { const r = T.realmAt(s.x, s.y, CAPS).i; if (r >= 0) pw[r] += s.pop; }
    warPow = { ver: mkVer, pw };
  }
  return warPow.pw[i] || 1;
}
const warOutCache = new Map();
function warOutcome(e) {
  const key = e.id + '|' + mkVer;
  let o = warOutCache.get(key);
  if (o) return o;
  const h = hashStr(e.id) & 0x7fffffff;
  if (T.hash(h, 1, 2001) < 0.28) o = { truce: true };
  else {
    const wa = Math.sqrt(realmPower(e.ai)) * (warAgenda(e.a) ? 1.25 : 1), wb = Math.sqrt(realmPower(e.bi)) * (warAgenda(e.b) ? 1.25 : 1);
    const aw = T.hash(h, 2, 2001) < wa / (wa + wb);
    o = { win: aw ? e.ai : e.bi, lose: aw ? e.bi : e.ai };
  }
  warOutCache.set(key, o);
  if (warOutCache.size > 400) warOutCache.delete(warOutCache.keys().next().value);
  return o;
}
const realmName = (i) => (REALMS[i] ? REALMS[i].name : 'a neighbouring realm');
// a town on the losing side, nearer the enemy's seat than its own and hit hard, is held by the winner
function occupiedBy(e, s, ri, f) {
  if (e.type !== 'war' || s.tier === 4 || f < 0.5) return -1;
  const o = warOutcome(e);
  if (o.truce || ri !== o.lose) return -1;
  const own = CAPLIST[o.lose], en = CAPLIST[o.win];
  if (!own || !en) return -1;
  return Math.hypot(s.x - en.x, s.y - en.y) < Math.hypot(s.x - own.x, s.y - own.y) ? o.win : -1;
}
const OCC_DAYS = 360;        // the winner holds the towns for a year after the war ends

// ---------------------------------------------------------------- what history did to one town
const tevCache = new Map();
function townEvents(s, day) {
  const b = Math.floor(day / 30), key = b + '|' + mkVer + '|' + s.x + '|' + s.y;
  const c = tevCache.get(s.id);
  if (c && c.key === key) return c;
  const L = localInfo(s), list = [];
  for (const e of histEvents(day)) {
    const f = impact(e, s, L, e.mid);
    if (f < (e.type === 'bandits' ? 0.3 : 0.15)) continue;
    const r = T.hash(e.eh, hashStr(s.id) & 0xffff, 2002);
    const x = { e, f, occ: occupiedBy(e, s, L.ri, f) };
    if (e.type === 'plague') x.loss = (0.03 + 0.09 * r) * f;
    else if (e.type === 'famine') x.loss = (0.01 + 0.04 * r) * f;
    else if (e.type === 'war') x.loss = (0.01 + 0.03 * r) * f + (x.occ >= 0 ? 0.02 : 0);
    else if (e.type === 'boom') x.gain = (0.02 + 0.03 * r) * f;
    list.push(x);
  }
  const out = { key, list };
  tevCache.set(s.id, out);
  if (tevCache.size > 3000) tevCache.delete(tevCache.keys().next().value);
  return out;
}
// share of a loss or gain still felt on a day: builds up during the event, then fades over about three years
function histWeight(e, day) {
  if (day < e.start) return 0;
  if (day < e.end) { const t = (day - e.start + 1) / (e.end - e.start); return t * t * (3 - 2 * t); }
  const u = Math.min(1, (day - e.end) / RECOVER);
  return Math.pow(1 - u, 1.5);
}
// the population on a given day, after recent plague, famine, war and booms (the recorded figure is the norm)
function popNow(s, day) {
  if (day == null) day = market.day;
  let m = 1;
  for (const x of townEvents(s, day).list) {
    const w = histWeight(x.e, day);
    if (!w) continue;
    if (x.loss) m *= 1 - x.loss * w;
    if (x.gain) m *= 1 + x.gain * w;
  }
  return Math.max(1, Math.round(s.pop * m));
}
// the realm holding a town on a day, if it is occupied
function occupation(s, day) {
  if (day == null) day = market.day;
  for (const x of townEvents(s, day).list) if (x.occ >= 0 && day >= x.e.mid && day < x.e.end + OCC_DAYS) return { by: x.occ, e: x.e, until: x.e.end + OCC_DAYS };
  return null;
}
let occAll = null;
const warOccCache = new Map();
// the towns a war's winner takes (fixed for each war, so worked out once)
function warTaken(e) {
  const key = e.id + '|' + mkVer;
  let ids = warOccCache.get(key);
  if (ids) return ids;
  ids = [];
  const o = warOutcome(e);
  if (!o.truce) for (const s of SET) {
    if (s.tier === 4) continue;
    const ri = T.realmAt(s.x, s.y, CAPS).i;
    if (ri === o.lose && occupiedBy(e, s, ri, impact(e, s, localInfo(s), e.mid)) >= 0) ids.push(s.id);
  }
  warOccCache.set(key, ids);
  if (warOccCache.size > 200) warOccCache.delete(warOccCache.keys().next().value);
  return ids;
}
function occupiedTowns(day) {
  if (occAll && occAll.day === day && occAll.ver === mkVer) return occAll.map;
  const map = new Map();
  for (const e of histEvents(day)) {
    if (e.type !== 'war' || day < e.mid || day >= e.end + OCC_DAYS) continue;
    const o = warOutcome(e);
    for (const id of warTaken(e)) if (!map.has(id)) map.set(id, { by: o.win, e, until: e.end + OCC_DAYS });
  }
  occAll = { day, ver: mkVer, map };
  return map;
}

// ---------------------------------------------------------------- notable folk who did not survive
// Rulers, adventurers, people the DM made, and anyone the DM has dealt with are never killed off by history.
const LETHAL = { plague: 0.06, famine: 0.02, war: 0.03 };
function fateOf(p, day) {
  if (!p || !p.id || p.id.startsWith('cn') || p.adv != null || p.id.indexOf('#a') >= 0) return null;
  const s = SBY.get(p.sid);
  if (!s || p.idx == null || p.idx < (LEADERS[s.tier] || []).length) return null;
  if (day == null) day = market.day;
  const ph = (p.h || hashStr(p.id)) & 0x7fffffff;
  for (const x of townEvents(s, day).list) {
    const e = x.e, base = LETHAL[e.type];
    if (!base) continue;
    if (e.start > day) break;
    let pr = base;
    // soldiers die wherever the war is felt; other folk only where the fighting reached
    if (e.type === 'war') { if (p.group === 'watch') pr = x.f >= 0.4 ? 0.08 : 0; else if (x.f < 0.6) pr = 0; }
    if (e.type === 'famine' && p.life <= 2) pr = 0.05;
    if (e.type === 'plague' && (p.group === 'faith' || /Physician|Herbalist|Midwife/.test(p.job))) pr = 0.09;   // they nurse the sick
    if (T.hash(ph, e.eh, 2003) >= pr * x.f) continue;
    const dd = e.start + Math.floor(T.hash(ph, e.eh, 2004) * (e.end - e.start));
    if (dd > day) continue;
    let text;
    if (e.type === 'plague') text = 'Died of ' + e.name.replace(/ in .*/, '').toLowerCase() + ', ' + dateText(dd);
    else if (e.type === 'famine') text = 'Died in the famine of ' + dateParts(dd).y;
    else { const en = realmName(e.ai === localInfo(s).ri ? e.bi : e.ai); text = p.group === 'watch' ? 'Fell in the war with ' + en + ', ' + dateText(dd) : 'Killed when the war with ' + en + ' reached ' + s.name + ', ' + dateText(dd); }
    return { day: dd, e, text };
  }
  return null;
}
// notable residents history has claimed, newest first
function deadOf(s, day) {
  const out = [];
  for (const p of townPeople(s).list) { const q = withOv(p); if (q.fateDay != null && q.status === 'Dead') out.push(q); }
  return out.sort((a, b) => b.fateDay - a.fateDay);
}

// ---------------------------------------------------------------- the settlement panel's History section
const HIST_ICON = { plague: 'Plague', famine: 'Famine', war: 'War', boom: 'Boom', bandits: 'Bandits' };
function historyHtml(s) {
  const day = market.day, ev = townEvents(s, day).list.filter((x) => x.e.start <= day).slice().reverse();
  const now = popNow(s, day), diff = now - s.pop, occ = occupation(s, day);
  let h = '<section><h3>History</h3>';
  h += '<p class="meta">' + (Math.abs(diff) / s.pop < 0.005 ? 'Population today matches the usual figure of ' + fmtInt(s.pop) + '.' : 'Population today is <b>' + fmtInt(now) + '</b>, ' + (diff < 0 ? fmtInt(-diff) + ' below' : fmtInt(diff) + ' above') + ' the usual ' + fmtInt(s.pop) + (diff < 0 ? ', after the hard times below. Towns win back their losses over about three years.' : ', thanks to recent good times.')) + '</p>';
  if (occ) h += '<p class="occ-line"><b>Occupied</b> by ' + (REALMS[occ.by] ? rLink(REALMS[occ.by]) : 'a neighbouring realm') + ' since ' + dateText(occ.e.mid) + ', after ' + eLinkTxt(occ.e) + '. ' + (day < occ.e.end ? 'The war goes on.' : 'Their garrison is due to leave by ' + dateText(occ.until) + '.') + '</p>';
  if (!ev.length) h += '<p class="meta">No plague, famine, war or trade boom has touched ' + esc(s.name) + ' in the last three years.</p>';
  else {
    h += '<ul class="hist">' + ev.slice(0, 8).map((x) => {
      const e = x.e, going = day < e.end, n = Math.round(s.pop * (x.loss || x.gain || 0));
      let what = '';
      if (e.type === 'plague') what = n ? 'about ' + fmtInt(n) + ' died' + (going ? ' so far, and it is not over' : '') : 'a few fell ill';
      else if (e.type === 'famine') what = n ? 'about ' + fmtInt(n) + ' starved or left' : 'hungry months';
      else if (e.type === 'war') { const o = warOutcome(e), me = localInfo(s).ri; what = (n ? 'about ' + fmtInt(n) + ' lost; ' : '') + (going ? 'still being fought' : o.truce ? 'ended in a truce' : o.win === me ? 'won by ' + esc(realmName(me)) : 'lost by ' + esc(realmName(me))) + (x.occ >= 0 ? '; the town was taken' : ''); }
      else if (e.type === 'boom') what = n ? 'about ' + fmtInt(n) + ' newcomers settled' : 'good trade';
      else what = 'the roads were unsafe';
      return '<li><span class="hd">' + HIST_ICON[e.type] + '</span><div>' + eLinkTxt(e) + ' <small>· ' + (going ? 'since ' + dateText(e.start) : rangeText(e.start, e.end - 1)) + '</small><br><small>' + what + '</small></div></li>';
    }).join('') + '</ul>';
    if (ev.length > 8) h += '<p class="meta">and ' + (ev.length - 8) + ' older events</p>';
  }
  const dead = deadOf(s, day);
  if (dead.length) h += '<p class="meta"><b>Lost:</b> ' + dead.slice(0, 6).map((p) => pLink(p) + ' <small>(' + esc(p.job.toLowerCase()) + ')</small>').join(', ') + (dead.length > 6 ? ' and ' + (dead.length - 6) + ' more' : '') + '.</p>';
  return h + '</section>';
}
// '3 Haymoon to 9 Leaffall, 1045', or with both years when it ran into the next
function rangeText(a, b) { if (b <= a) return dateText(a); const A = dateParts(a), B = dateParts(b); return (A.y === B.y ? A.dd + ' ' + MONTHS[A.m] : dateText(a)) + ' to ' + dateText(b); }
// events still in the market's window can be opened; older ones are plain text
function eLinkTxt(e) { return evWin && evWin.list.some((q) => q.id === e.id) ? '<button type="button" class="link" data-ev="' + esc(e.id) + '">' + esc(e.name) + '</button>' : '<b>' + esc(e.name) + '</b>'; }

// ---------------------------------------------------------------- occupied towns on the map: a small flag in the winner's colours
const REALM_RGB = [[176, 70, 60], [70, 110, 170], [190, 150, 50], [110, 150, 70], [140, 80, 150], [60, 150, 150], [200, 110, 50], [120, 120, 160], [170, 90, 110], [90, 130, 100], [160, 130, 90], [80, 90, 140]];
function drawOccupied() {
  if (!layers.events || !SET.length) return;
  const occ = occupiedTowns(market.day);
  if (!occ.size) return;
  for (const m of markers) {
    if (m.kind !== 'settle') continue;
    const o = occ.get(m.id);
    if (!o) continue;
    const c = REALM_RGB[o.by % REALM_RGB.length], X = m.X + (m.r > 9 ? m.r * 0.7 : 6), Y = m.Y - (m.r > 9 ? m.r * 0.7 : 6);
    ctx.lineWidth = 1.4; ctx.strokeStyle = '#231c13';
    ctx.beginPath(); ctx.moveTo(X, Y + 3); ctx.lineTo(X, Y - 13); ctx.stroke();
    ctx.fillStyle = 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
    ctx.beginPath(); ctx.moveTo(X + 0.5, Y - 13); ctx.lineTo(X + 11, Y - 9.5); ctx.lineTo(X + 0.5, Y - 6); ctx.lineTo(X + 0.5, Y - 13); ctx.fill(); ctx.stroke();
  }
}

// ---------------------------------------------------------------- time spent with friends, family and rivals
// Pairs meet on the same days at the same places, so both sides of a friendship tell the same story.
const SOCIAL = {
  friend: [0.055, ['Having supper with {o} at {tavern}|Having supper with {o}', 'Sharing a jug of ale with {o} at {tavern}|Sharing a jug of ale with {o}', 'Walking out with {o} after work']],
  sibling: [0.045, ['Visiting {o} at home', 'Helping {o} with the chores', 'Squabbling with {o} over an old family matter']],
  parent: [0.045, ['Visiting {o} at home', 'Taking a meal with {o}']],
  spouse: [0.04, ['Out at the market with {o} at {market}|Out at the market with {o}', 'At home with {o}']],
  mentor: [0.05, ['Going over the trade with {o}']],
  rival: [0.045, ['Arguing with {o} at {market}|Arguing with {o}', 'Trying to outdo {o} at {market}|Trying to outdo {o}']],
  enemy: [0.04, ['Exchanging insults with {o} at {tavern}|Exchanging insults with {o}', 'Avoiding {o} in the street']],
  debt: [0.05, ['Settling accounts with {o} at {tavern}|Settling accounts with {o}']],
  lover: [0.05, ['Slipping away to meet {o} in secret']]
};
function socialToday(p, s, day) {
  if (!s || p.group === 'adventurer') return null;
  // of all the meetings due today, the one with the lowest draw wins, so both people usually pick the same one
  let best = null, bv = 1;
  for (const r of relsOf(p)) {
    const S = SOCIAL[r.type];
    if (!S || (r.o.status || 'Alive') !== 'Alive') continue;
    const pk = p.id < r.o.id ? p.id + '~' + r.o.id : r.o.id + '~' + p.id, ph = hashStr(pk) & 0x7fffffff, v = T.hash(ph, day, 2010) / S[0];
    if (v < bv) { bv = v; best = [r, S, ph]; }
  }
  if (!best) return null;
  {
    const [r, S, ph] = best;
    let tpl = S[1][Math.floor(T.hash(ph, day, 2011) * S[1].length) % S[1].length];
    if (r.type === 'debt') tpl = /^Is owed/.test(r.label) ? 'Chasing {o} for the money owed at {market}|Chasing {o} for the money owed' : 'Dodging {o}, who wants paying';
    if (r.type === 'mentor') tpl = /^Mentor/.test(r.label) ? 'Teaching {o} the trade' : 'Learning the trade from {o}';
    const [withP, plain] = tpl.split('|'), name = npcName(r.o);
    // someone living elsewhere: a letter instead of a meeting
    if (r.o.sid !== p.sid) return { text: (r.type === 'lover' ? 'Writing a secret letter to ' : 'Writing a letter to ') + name, with: r.o.id, secret: r.type === 'lover' };
    const m = /\{(tavern|market)\}/.exec(withP);
    let key = null;
    if (m && m[1] === 'market') key = 'market';
    else if (m) { const tv = placesOf(s).list.filter((o) => o.kind === 'tavern' || o.kind === 'inn'); if (tv.length) key = tv[Math.floor(T.hash(ph, day, 2012) * tv.length) % tv.length].key; }
    const pl = key ? placeGet(s, key) : null;
    const text = (pl ? withP.replace('{' + m[1] + '}', pl.name) : (plain || withP)).replace('{o}', name);
    return { text, place: pl ? key : null, with: r.o.id, secret: r.type === 'lover' };
  }
}
// an activity line with links to the place and the other person
function actLinks(a, s) {
  let h = actHtml(a.text, s, a.place);
  if (a.with) {
    const o = npcById(a.with);
    if (o) { const nm = esc(npcName(o)), i = h.lastIndexOf(nm); if (i >= 0) h = h.slice(0, i) + pLink(o) + h.slice(i + nm.length); }
  }
  return h;
}

// ---------------------------------------------------------------- seasonal work: the farming year drives what people do
const SEASONAL = {
  labour: [['Chopping firewood', 'Tending the beasts in the byre', 'Mending tools by the fire', 'Clearing snow from {market}|Clearing snow from the lanes'],
    ['Ploughing the fields', 'Sowing the spring barley', 'Lambing with the shepherds', 'Digging drainage ditches'],
    ['Haymaking in the meadows', 'Shearing sheep', 'Weeding the bean rows', 'Carting water to the thirsty fields'],
    ['Bringing in the harvest', 'Threshing grain in the barn', 'Picking apples in the orchards', 'Driving pigs into the woods for acorns']],
  craft: [['Working late by candlelight at {own}|Working late by candlelight', 'Repairing frost-cracked tools'],
    ['Mending ploughshares for the sowing', 'Taking on a new apprentice at {own}|Taking on a new apprentice'],
    ['Working with the shutters open at {own}|Working with the shutters open', 'Selling wares at the summer fair at {market}|Selling wares at the summer fair'],
    ['Making barrels for the harvest', 'Laying in materials before winter']],
  trade: [['Selling firewood and lamp oil at {market}|Selling firewood and lamp oil', 'Waiting for the snowbound roads to clear'],
    ['Sending off the first caravan of the year', 'Restocking after the lean winter at {own}|Restocking after the lean winter'],
    ['Haggling at the summer fair at {market}|Haggling at the summer fair', 'Buying wool from the shearers'],
    ['Buying up the harvest at {market}|Buying up the harvest', 'Salting meat for the winter trade']],
  service: [['Keeping the fires going at {own}|Keeping the fires going', 'Serving mulled wine at {own}|Serving mulled wine'],
    ['Spring cleaning at {own}|Spring cleaning'],
    ['Serving cold ale in the yard at {own}|Serving cold ale in the yard'],
    ['Brewing the autumn ale at {own}|Brewing the autumn ale', 'Feeding the harvest hands at {own}|Feeding the harvest hands']],
  faith: [['Handing out alms in the cold at {temple}|Handing out alms in the cold'], ['Blessing the seed for sowing'], ['Leading a procession through {district}|Leading a procession through the streets'], ['Blessing the harvest at {temple}|Blessing the harvest']],
  watch: [['Huddled by the brazier at the gate'], ['Clearing the winter\'s bandits from the woods'], ['Breaking up a brawl at {tavern}|Breaking up a brawl'], ['Guarding the harvest carts']],
  rest: [['Telling stories by the fire', 'Skating on the frozen pond'], ['Dancing round the maypole at {market}|Dancing round the maypole', 'Walking in the blossoming orchards'],
    ['Picnicking in the meadows', 'Watching the summer games at {market}|Watching the summer games'], ['Gathering nuts and mushrooms in the woods', 'At the harvest supper at {tavern}|At the harvest supper']]
};
const seasonOf = (day) => { const m = dateParts(day).m; return m === 11 || m <= 1 ? 0 : m <= 4 ? 1 : m <= 7 ? 2 : 3; };
// a template for today: a seasonal one about a third of the time, otherwise the everyday list
function routineTpl(group, r, day) {
  const se = SEASONAL[group];
  if (se && day != null) { const list = se[seasonOf(day)], q = (r * 7.31) % 1; if (q < 0.34) return list[Math.floor((q / 0.34) * list.length) % list.length]; }
  const arr = ROUTINE_AT[group] || ROUTINE_AT.labour;
  return arr[Math.floor(r * arr.length) % arr.length];
}

// ---------------------------------------------------------------- the aftermath: grief and occupation reach people's days (v25)
// A family member's death stays with people for weeks: the first days in mourning, then visits to the grave and quiet
// days now and then. Under occupation the watch is disarmed, leaders deal with the garrison and traders sell to it.
const FAMILY_T = new Set(['spouse', 'parent', 'sibling']);
function lossesOf(p, day) {
  if (day == null) day = market.day;
  const out = [];
  if (!p || p.adv != null) return out;
  for (const r of relsOf(p)) {
    if (!FAMILY_T.has(r.type)) continue;
    const o = r.o;
    if ((o.status || 'Alive') === 'Dead' && o.fateDay != null && o.fateDay <= day) out.push({ o, label: r.label, days: day - o.fateDay });
  }
  return out.sort((a, b) => a.days - b.days);
}
const kinWord = (label, o) => /Married/.test(label) ? (o.fem ? 'wife' : 'husband') : /Child of/.test(label) ? (o.fem ? 'mother' : 'father') : /Parent of/.test(label) ? (o.fem ? 'daughter' : 'son') : (o.fem ? 'sister' : 'brother');
function griefToday(p, s, day) {
  const L = lossesOf(p, day).filter((x) => x.days <= 60);
  if (!L.length) return null;
  const x = L[0], who = 'their ' + kinWord(x.label, x.o) + ' ' + x.o.first, r = T.hash(p.h || hashStr(p.id), day, 2401);
  if (x.days <= 7) return { text: 'In mourning for ' + who, tone: 'warn', with: x.o.id };
  if (r < (x.days <= 30 ? 0.3 : 0.12)) {
    const t = s ? resolveToken('temple', p, s, r) : null, pl = t ? placeGet(s, t) : null;
    return pl ? { text: 'Visiting the grave of ' + who + ' at ' + pl.name, tone: 'warn', place: t, with: x.o.id } : { text: 'Quiet and grieving for ' + who, tone: 'warn', with: x.o.id };
  }
  return null;
}
function occupiedToday(p, s, day) {
  const occ = s ? occupation(s, day) : null;
  if (!occ) return null;
  const by = REALMS[occ.by] ? REALMS[occ.by].name : 'the occupiers', r = T.hash(p.h || hashStr(p.id), day, 2402);
  if (p.group === 'watch') return { text: r < 0.5 ? 'Disarmed, keeping the peace under the eye of ' + by : 'Ordered about by the garrison of ' + by, tone: 'warn' };
  if (p.group === 'leader') return { text: 'Negotiating with the garrison of ' + by, tone: 'warn' };
  if (p.group === 'trade' && r < 0.45) return { text: 'Selling supplies to the garrison of ' + by, tone: 'warn' };
  if (p.group === 'underworld' && r < 0.4) return { text: 'Smuggling past the occupiers\' patrols', tone: 'warn' };
  if (r < 0.15) return { text: 'Keeping out of the occupiers\' way', tone: 'warn' };
  return null;
}
function lossesHtml(p, day) {
  const L = lossesOf(p, day);
  if (!L.length) return '';
  return '<section><h3>Losses</h3><ul class="rels">' + L.map((x) => '<li><i style="background:#6b7280"></i><span>Lost ' + (/Married/.test(x.label) ? (p.fem ? 'her' : 'his') : 'their') + ' ' + kinWord(x.label, x.o) + ' ' + pLink(x.o) + '<small>' + esc(x.o.fate || 'Died ' + dateText(x.o.fateDay)) + '</small></span><span></span></li>').join('') + '</ul></section>';
}
