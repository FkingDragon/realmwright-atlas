
// ================================================================ guild networks (v15)
// The Rulers, the Temple and the Watch are everywhere. The five guilds are not: each runs a network of
// branches, and a place only gets one if it can pay for it (people, trade, shops, roads, danger) and,
// for a small branch, if a bigger branch close enough can back it. Each realm's network has a headquarters;
// every metropolis (over 25,000) has every guild.
const GUILDS = ['adventurers', 'merchants', 'crafts', 'mages', 'thieves'];
const BRANCH = {
  adventurers: ['', 'Lodge', 'Guild hall', 'Grand hall'],
  merchants: ['', 'Trading post', 'Guildhall', 'Exchange'],
  crafts: ['', 'Craft lodge', 'Guild halls', 'Hall of Masters'],
  mages: ['', 'Circle house', 'Tower', 'High Tower'],
  thieves: ['', 'Cell', 'Den', 'Shadow court']
};
const LEVEL_NAME = ['Not here', 'Minor branch', 'Major branch', 'Headquarters'];
const LEVEL_SHORT = ['', 'minor', 'major', 'HQ'];
const BACK_MI = { adventurers: 140, merchants: 170, crafts: 110, mages: 230, thieves: 120 };
const MAJOR_AT = 1, MINOR_AT = 0.35;
const TRADE_RATE = TRADES.reduce((a, t) => a + 1 / t[1], 0); // shops per head, from the support values
// where each guild prefers its realm headquarters: thieves keep away from the crown's watch, adventurers lean to the
// frontier, mages to the court; merchants and crafts simply go where trade and workshops are richest
const HQ_AT_CAPITAL = { adventurers: 0.7, merchants: 0.9, crafts: 1, mages: 1.25, thieves: 0.55 };
// how a realm's government treats each guild, read from the kind of realm it is
function realmStance(R) {
  const n = (R && R.name) || '';
  const st = { adventurers: 1, merchants: 1, crafts: 1, mages: 1, thieves: 1, why: {} };
  if (/^Theocracy/.test(n)) { st.mages = 0.3; st.thieves = 0.5; st.why.mages = 'the priesthood distrusts arcane power'; st.why.thieves = 'temple courts are harsh on thieves'; }
  if (/^Free Cities|League$/.test(n)) { st.merchants = 1.35; st.crafts = 1.2; st.why.merchants = 'its free cities are run by merchant councils'; st.why.crafts = 'guild charters are prized here'; }
  if (/Marches$/.test(n)) { st.adventurers = 1.35; st.why.adventurers = 'a frontier march pays well for blades'; }
  if (/Protectorate$/.test(n)) { st.thieves = 0.55; st.why.thieves = 'the protectorate keeps a tight watch'; }
  if (/^Principality|^Grand Duchy/.test(n)) { st.mages = 1.2; st.why.mages = 'its prince keeps court mages'; }
  return st;
}
function realmIndexOf(s) { return CAPS.length ? T.realmAt(s.x, s.y, CAPS).i : -1; }
// what a place can support of each guild, before backing
function guildSupport(s, P, rs, ri, nh, nr) {
  const pop = s.pop, tier = s.tier;
  const hs = hashStr(s.id) & 0xffff;
  const jit = (k) => 0.75 + 0.5 * T.hash(hs, ORG_KEYS.indexOf(k), 1501);
  const capB = tier === 4 ? 1.25 : 1;
  const shops = pop * TRADE_RATE;
  const wild = 1 - (HAB[P.b] || 0.5);
  const st = rs[ri] || realmStance(null);
  const out = {};
  out.adventurers = tier < 2 ? 0 : (pop / 2600) * (1 + 0.8 * wild);
  out.merchants = (pop / 3000) * (1 + (P.coastal ? 0.5 : 0) + 0.22 * nh + 0.08 * nr);
  out.crafts = tier < 2 ? 0 : shops / 115;
  out.mages = tier < 2 ? 0 : pop / 17000;
  out.thieves = tier < 2 ? 0 : (pop / 12500) * (1 + (P.coastal ? 0.3 : 0) + 0.15 * nh);
  for (const k of GUILDS) out[k] *= jit(k) * capB * st[k];
  return out;
}
let NET = null, netSet = null, netKey = '';
function guildNet() {
  if (NET && netSet === SET) return NET;
  const key = SEED + '|' + SET.length + '|' + roadsVer + '|' + JSON.stringify(edits.ov) + '|' + Object.keys(edits.del).length + '|' + edits.add.length + '|' + CAPS.length;
  if (NET && key === netKey) { netSet = SET; return NET; }
  // roads into each place
  const hw = new Map(), rd = new Map();
  for (const r of ROADS) { if (!r.a) continue; const m = r.type === 1 ? hw : rd; m.set(r.a, (m.get(r.a) || 0) + 1); m.set(r.b, (m.get(r.b) || 0) + 1); }
  const rs = REALMS.map((R) => realmStance(R));
  const info = new Map();
  for (const s of SET) {
    const ri = realmIndexOf(s), S = guildSupport(s, { b: s.b != null && !T.isWater(s.b) ? s.b : 5, coastal: !!s.coastal }, rs, ri, hw.get(s.id) || 0, rd.get(s.id) || 0);
    const metro = s.pop >= 25000;
    const lv = {}, back = {};
    for (const k of GUILDS) lv[k] = metro || (s.tier >= 2 && S[k] >= MAJOR_AT) ? 2 : 0;
    info.set(s.id, { s, ri, S, lv, back, metro, serves: {} });
  }
  // each realm's network is headed by its strongest branch
  for (const k of GUILDS) {
    const best = new Map();
    for (const o of info.values()) {
      if (o.lv[k] < 2) continue;
      const sc = o.S[k] * (o.metro ? 1.3 : 1) * (o.s.tier === 4 ? HQ_AT_CAPITAL[k] : 1) * (k === 'adventurers' ? 1 + (1 - (HAB[o.s.b] || 0.5)) * 0.6 : 1);
      const b = best.get(o.ri);
      if (!b || sc > b[0]) best.set(o.ri, [sc, o]);
    }
    for (const [, [, o]] of best) o.lv[k] = 3;
  }
  // small branches need a bigger one within reach to back them
  for (const o of info.values()) {
    const s = o.s;
    for (const k of GUILDS) {
      if (o.lv[k] >= 2) continue;
      if (o.S[k] < MINOR_AT || s.pop < 300) continue;
      const R = BACK_MI[k];
      let best = null, bd = R;
      SGRID.query(s.x - R, s.y - R, s.x + R, s.y + R, (n) => { if (n === s) return; const q = info.get(n.id); if (!q || q.lv[k] < 2) return; const d = Math.hypot(n.x - s.x, n.y - s.y); if (d < bd) { bd = d; best = n; } });
      if (best) { o.lv[k] = 1; o.back[k] = [best.id, bd]; }
    }
  }
  // major branches answer to their realm's headquarters
  const hqOf = {};
  for (const o of info.values()) for (const k of GUILDS) if (o.lv[k] === 3) (hqOf[k] = hqOf[k] || {})[o.ri] = o.s;
  for (const o of info.values()) for (const k of GUILDS) {
    if (o.lv[k] !== 2) continue;
    const h = hqOf[k] && hqOf[k][o.ri];
    if (h) o.back[k] = [h.id, Math.hypot(h.x - o.s.x, h.y - o.s.y)];
  }
  for (const o of info.values()) for (const k of GUILDS) { const b = o.back[k]; if (b) { const q = info.get(b[0]); if (q) (q.serves[k] = q.serves[k] || []).push([o.s.id, b[1]]); } }
  NET = { info, rs }; netSet = SET; netKey = key;
  return NET;
}
function guildLevel(s, k) {
  if (!s) return 0;
  if (!GUILDS.includes(k)) return 2;
  const o = guildNet().info.get(s.id);
  return o ? o.lv[k] : 0;
}
function orgHere(s, k) { if (!s) return false; if (k === 'watch') return s.pop >= 300; return !GUILDS.includes(k) || guildLevel(s, k) >= 1; }
function branchName(s, k) { const l = guildLevel(s, k); return GUILDS.includes(k) && l ? BRANCH[k][l] : ''; }
function branchTag(s, k) { const l = guildLevel(s, k); return GUILDS.includes(k) && l && l !== 2 ? ' <small class="lvl l' + l + '">' + LEVEL_SHORT[l] + '</small>' : ''; }
// nearest branch of a guild that is not in this place
function nearestBranch(s, k, minLevel) {
  let best = null, bd = 1e9;
  const R = 1000;
  SGRID.query(s.x - R, s.y - R, s.x + R, s.y + R, (n) => { if (n === s || guildLevel(n, k) < (minLevel || 1)) return; const d = Math.hypot(n.x - s.x, n.y - s.y); if (d < bd) { bd = d; best = n; } });
  return best ? [best, bd] : null;
}
// the org page section: what kind of branch this is, who backs it and whom it backs
function branchSection(s, k) {
  if (!GUILDS.includes(k)) return '';
  const o = guildNet().info.get(s.id);
  if (!o) return '';
  const l = o.lv[k], st = guildNet().rs[o.ri];
  const lines = [];
  const what = {
    1: 'A small branch: a handful of members working from rented rooms, answering to a bigger branch.',
    2: 'A full branch with its own hall, officers and treasury.',
    3: 'Headquarters of the guild in this realm: it sets dues and rules for every branch here.'
  }[l];
  lines.push('<p><b>' + BRANCH[k][l] + '</b> · ' + LEVEL_NAME[l] + '. ' + what + '</p>');
  if (o.back[k]) { const b = SBY.get(o.back[k][0]); if (b) lines.push('<p class="meta">' + (l === 1 ? 'Backed by the ' + BRANCH[k][guildLevel(b, k)].toLowerCase() + ' in ' : 'Answers to the headquarters in ') + oLink(k, b.id, b.name) + ' (' + Math.round(o.back[k][1]) + ' mi).</p>'); }
  const sv = (o.serves[k] || []).slice().sort((a, b) => a[1] - b[1]);
  if (sv.length) lines.push('<p class="meta">' + (l === 3 ? 'Branches answering here: ' : 'Small branches it backs: ') + sv.slice(0, 10).map(([id, d]) => { const n = SBY.get(id); return n ? oLink(k, n.id, n.name) + ' <small>' + LEVEL_SHORT[guildLevel(n, k)] + ', ' + Math.round(d) + ' mi</small>' : ''; }).join(' · ') + (sv.length > 10 ? ' and ' + (sv.length - 10) + ' more' : '') + '</p>');
  if (st && st[k] !== 1 && st.why[k]) lines.push('<p class="meta">' + (st[k] > 1 ? 'Strong in this realm: ' : 'Held back in this realm: ') + esc(st.why[k]) + '.</p>');
  return '<section><h3>Branch</h3>' + lines.join('') + '</section>';
}
// the Orgs tab: which guilds are here, which are not and where the nearest is
function guildPresenceHtml(s) {
  const rows = GUILDS.filter((k) => !(isPlayer() && ORGS[k].secret)).map((k) => {
    const l = guildLevel(s, k);
    if (l) return '<li' + gcStyle(k) + '><span>' + oLink(k, s.id, ORGS[k].name) + '</span><b>' + BRANCH[k][l] + '</b><small>' + LEVEL_NAME[l] + '</small></li>';
    const nb = nearestBranch(s, k);
    const o = guildNet().info.get(s.id), sup = o ? o.S[k] : 0;
    const why = s.tier < 2 && k !== 'merchants' ? 'too small' : sup >= MINOR_AT ? 'no branch near enough to back one' : 'not enough trade or people to support one';
    return '<li class="off"><span>' + esc(ORGS[k].name) + '</span><b>None</b><small>' + why + (nb ? '; nearest ' + oLink(k, nb[0].id, nb[0].name) + ' ' + Math.round(nb[1]) + ' mi' : '') + '</small></li>';
  }).join('');
  return '<section><h3>Guild branches</h3><ul class="branches">' + rows + '</ul><p class="meta">The Rulers and the Temple are found everywhere, and the Watch everywhere but hamlets. Guilds open branches only where people and trade can pay for them; a small branch also needs a bigger one within reach to back it. Every realm\'s network has a headquarters, and every metropolis (over 25,000 people) has every guild.</p></section>';
}
