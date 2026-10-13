
// ================================================================ cross-links: towns, realms, organisations, events
const tLink = (s, txt) => (s ? '<button type="button" class="link" data-town="' + esc(s.id) + '">' + esc(txt || s.name) + '</button>' : esc(txt || ''));
const rLink = (R, txt) => (R ? '<button type="button" class="link" data-realm="' + esc(R.cap.id) + '">' + esc(txt || R.name) + '</button>' : '');
const oLink = (key, sid, txt) => (ORGS[key] && orgHere(SBY.get(sid), key) ? '<button type="button" class="link" data-org="' + key + '|' + esc(sid) + '">' + esc(txt || ORGS[key].name) + '</button>' : esc(txt || ''));
const eLink = (e, txt) => (e ? '<button type="button" class="link" data-ev="' + esc(e.id) + '">' + esc(txt || e.name) + '</button>' : '');
const pLink = (p, txt) => (p ? '<button type="button" class="link" data-pp="npc" data-v="' + esc(p.id) + '">' + esc(txt || npcName(p)) + '</button>' : '');
// open an event's page in the Market and swing the map round to it
function openEvent(e) {
  if (!e) { toast('That event is no longer in the records.'); return; }
  if (tool !== 'market') setTool('market', true);
  panelMin = false;
  sel = { kind: 'event', id: e.id }; market.tab = 'events';
  renderPanel(); requestRender();
  const el = $('inspector'); if (el) el.scrollTop = 0;
  flyToEvent(e);
}
const realmOfCap = (id) => REALMS.find((r) => r.cap.id === id) || null;
function eventWhere(e) {
  if (e.type === 'war') {
    const A = SBY.get(e.a), B = SBY.get(e.b), RA = realmOfCap(e.a), RB = realmOfCap(e.b);
    return '<p class="ev-where"><b>Between</b> ' + (RA ? rLink(RA) + ' <small class="meta">(capital ' + tLink(A) + ')</small>' : tLink(A)) + ' and ' + (RB ? rLink(RB) + ' <small class="meta">(capital ' + tLink(B) + ')</small>' : tLink(B)) + '</p>';
  }
  if (e.realm) { const R = realmOfCap(e.realm); return '<p class="ev-where"><b>Across</b> ' + (R ? rLink(R) : '') + ' <small class="meta">celebrated loudest in ' + tLink(SBY.get(e.realm)) + '</small></p>'; }
  const s = SBY.get(e.sid);
  if (!s) return '';
  const R = CAPS.length ? REALMS[T.realmAt(s.x, s.y, CAPS).i] : null;
  return '<p class="ev-where"><b>Centred on</b> ' + tLink(s) + ' <small class="meta">' + sizeOf(s).name.toLowerCase() + (R ? ', ' : '') + '</small>' + (R ? rLink(R) : '') + '</p>';
}
const CENSUS_ORG = { 'The temple': 'temple', 'The watch': 'watch', "Merchants' guild": 'merchants', 'Craft guilds': 'crafts', "Thieves' guild": 'thieves', 'Cutpurses & smugglers': 'thieves', "Mages' circle": 'mages' };
function belongsTo(p, s) {
  const label = (p.group === 'underworld' ? GROUPS.underworld.org + ' (secret)' : GROUPS[p.group] && GROUPS[p.group].org) || 'No organisation';
  if (isPlayer() && p.group === 'underworld') { const g = pubGroup(p); return esc((GROUPS[g] && GROUPS[g].org) || 'No organisation'); }
  const k = GROUP_ORG[p.group];
  if (k === 'watch' && s && !orgHere(s, k)) return 'No watch here (' + esc(label) + ')';
  if (k && s && GUILDS.includes(k) && !orgHere(s, k)) return p.group === 'underworld' ? 'Works alone (no thieves\' guild here)' : p.group === 'adventurer' ? esc(label) : 'Independent (no ' + esc(ORGS[k].name) + ' here)';
  return k && s && orgHere(s, k) ? oLink(k, s.id, label) : esc(label);
}
const TOWN_ZOOM = { 4: 2, 3: 4, 2: 12, 1: 30 };
// since v24 the panel sits beside the map rather than over it, so the target simply goes in the middle of the frame
function flyVis(x, y, s) { flyTo(x, y, s); }
function goTown(id) {
  const s = SBY.get(id);
  if (!s) return;
  panelMin = false;
  market.sid = id; people.sid = id; people.place = null;
  if (tool === 'people') { people.npc = null; if (people.tab === 'tracked') people.tab = 'residents'; }
  else if (tool === 'guilds') { guildUI.q = null; guildUI.org = null; }
  else if (tool === 'market') market.tab = 'town';
  else if (tool !== 'explore') setTool('explore');
  sel = { kind: 'settle', id };
  renderPanel();
  pulseTown(id);
  flyVis(s.x, s.y, view.s > TOWN_ZOOM[s.tier] * 3 && Math.hypot(view.x - s.x, view.y - s.y) * view.s < vw ? view.s : TOWN_ZOOM[s.tier]);
}
function goRealm(capId) {
  const R = REALMS.find((r) => r.cap.id === capId);
  if (!R) return;
  panelMin = false;
  // the realm's page in the side bar lists its places (app30)
  if (tool === 'explore') { navR = capId; navQ = ''; sel = null; renderPanel(); }
  flyVis(R.cx, R.cy, Math.max(minS, 0.9));
}
function goOrg(key, sid) {
  const s = SBY.get(sid);
  if (!s || !ORGS[key]) return;
  if (tool !== 'guilds') setTool('guilds', true);
  panelMin = false;
  market.sid = sid; people.sid = sid;
  guildUI.org = key; guildUI.q = null; guildUI.tab = 'orgs';
  renderPanel();
  const el = $('inspector'); if (el) el.scrollTop = 0;
  if (Math.hypot(view.x - s.x, view.y - s.y) * view.s > vw * 0.6) flyVis(s.x, s.y, Math.max(view.s, TOWN_ZOOM[s.tier]));
}
function flyToEvent(e) {
  if (!e) return;
  if (e.type === 'war') {
    const A = SBY.get(e.a), B = SBY.get(e.b);
    if (A && B) { const d = Math.hypot(A.x - B.x, A.y - B.y); flyVis((A.x + B.x) / 2, (A.y + B.y) / 2, clamp(Math.min(vw, vh) * 0.55 / Math.max(d, 60), minS, 4)); return; }
  }
  if (e.realm) { const R = REALMS.find((r) => r.cap.id === e.realm); if (R) { flyVis(R.cx, R.cy, Math.max(minS, 0.9)); return; } }
  const r = radiusAt(e, clamp(market.day, e.start, e.end - 1));
  const s = SBY.get(e.sid);
  flyVis(e.x, e.y, r > 8 ? clamp(Math.min(vw, vh) * 0.3 / r, minS, 300) : s ? TOWN_ZOOM[s.tier] : 12);
}
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-town],[data-realm],[data-org],[data-ev],[data-orgback]');
  if (!t) return;
  ev.preventDefault();
  if (t.dataset.town) goTown(t.dataset.town);
  else if (t.dataset.realm) goRealm(t.dataset.realm);
  else if (t.dataset.org) { const [k, sid] = t.dataset.org.split('|'); goOrg(k, sid); }
  else if (t.dataset.ev) openEvent(findEvent(t.dataset.ev));
  else if (t.hasAttribute('data-orgback')) { guildUI.org = null; renderPanel(); }
});

// ---------------------------------------------------------------- the inner workings of each organisation
const ORG_TIERS = {
  rulers: ['Ruler', 'Councillor', 'Official', 'Clerk'], temple: ['High priest', 'Priest', 'Acolyte', 'Lay servant'], watch: ['Captain', 'Sergeant', 'Guard', 'Recruit'],
  merchants: ['Guildmaster', 'Master merchant', 'Member', 'Journeyman'], crafts: ['Guildmaster', 'Master', 'Journeyman', 'Apprentice'], mages: ['Archmage', 'Magus', 'Adept', 'Apprentice'],
  thieves: ['Guildmaster', 'Lieutenant', 'Cutpurse', 'Runner']
};
const WORKINGS = {
  adventurers: { what: 'Posts contracts from anyone who can pay, keeps the rank registry, vouches for members to clients and the law, and settles disputes between companies.', money: 'Takes a tenth of every reward as its fee. Membership is free; promotion depends on merit.', power: 'Licences to carry arms within town walls; first refusal on monster bounties.' },
  rulers: { what: 'Levy taxes and tolls, keep the courts and the peace, grant charters to guilds, and raise the levy in war.', money: 'Taxes on land and trade, market tolls, fines, and the revenues of crown lands.', power: 'Law, land and the right to make war.' },
  temple: { what: 'Leads worship, marks births, marriages and burials, runs the almshouse, and tends the sick.', money: 'A tithe of a tenth from the faithful, donations for healing and blessings, and rents from temple lands.', power: 'The loyalty of the common folk and the right to sanctuary.' },
  watch: { what: 'Keeps the gates and the curfew, patrols the streets, runs the gaol and hunts criminals. In war its veterans train the levy.', money: 'Paid from the rulers\' taxes, about one guard for every 150 people. Bribes are common and officially forbidden.', power: 'Arrest, the gaol, and the keys to the gates.' },
  merchants: { what: 'Sets weights and measures, collects market tolls, licenses traders and stalls, and lobbies the rulers on taxes and roads.', money: 'Dues of about 2 gp a year, a share of stall tolls (1 cp a stall a day), and fines on cheats.', power: 'Who may trade in the market, and at what weights.' },
  crafts: { what: 'Each craft has its own masters. Apprentices serve about seven years, then journeymen must make a masterpiece to join the masters.', money: 'Dues of about 1 gp a year, entry fees for new masters, and fines for shoddy work.', power: 'The right to practise a trade within the walls.' },
  mages: { what: 'Licenses spellcasting and the sale of magic items, keeps a library of spellbooks, and polices dangerous magic.', money: 'Licence fees, tuition from apprentices, and commissions for enchantments.', power: 'Who may sell magic, and the knowledge in its library.' },
  thieves: { what: 'Organises theft, smuggling and fencing, licenses pickpockets to particular streets, and keeps the peace among criminals.', money: 'Takes a cut of every job, about a tenth, and sells protection to shopkeepers.', power: 'Information, the black market, and favours owed by people in high places.' }
};
function orgEstimate(s, key) {
  const P = profile(s), pop = s.pop, shops = P.trades.reduce((a, t) => a + t[1], 0);
  const lf = [0, 0.3, 1, 1.25][guildLevel(s, key)];
  if (GUILDS.includes(key) && key !== 'adventurers') return Math.max(key === 'mages' ? 1 : 2, Math.round(({ merchants: shops * 0.35, crafts: shops * 0.6, mages: Math.max(2, pop / 3000), thieves: Math.max(3, pop / (s.tier >= 3 ? 400 : 700)) })[key] * lf));
  return {
    rulers: Math.max(3, Math.round(pop / 500)), temple: Math.max(1, Math.round(pop / 40)), watch: Math.max(1, Math.round(pop / 150)),
    merchants: Math.round(shops * 0.35), crafts: Math.round(shops * 0.6), mages: Math.max(2, Math.round(pop / 3000)),
    thieves: Math.max(3, Math.round(pop / (s.tier >= 3 ? 400 : 700))), adventurers: (roster(s) || { list: [] }).list.length
  }[key];
}
function orgMembers(s, key) {
  if (key === 'adventurers') return [];
  return residents(s).filter((p) => GROUP_ORG[p.group] === key && p.group !== 'adventurer')
    .sort((a, b) => (b.life - a.life) || ((a.idx < 0 ? 999 : a.idx) - (b.idx < 0 ? 999 : b.idx)));
}
function orgView(s, key, day) {
  const O = ORGS[key], W = WORKINGS[key];
  const others = orgsShown(s).filter((k) => k !== key);
  let h = '<button type="button" class="link back" data-orgback>‹ All organisations in ' + esc(s.name) + '</button>';
  h += '<div class="org-head"' + gcStyle(key) + '><div class="eyebrow">' + (O.secret ? 'Secret organisation · ' : 'Organisation · ') + tLink(s) + '</div><h3 class="town-name">' + esc(O.name) + '</h3></div>';
  const mem = orgMembers(s, key);
  const est = orgEstimate(s, key);
  const lead = key === 'adventurers' ? (roster(s) ? withOv(roster(s).list[0]) : null) : mem[0] || null;
  h += '<dl class="stats">' + stat('Members', fmtInt(est)) + stat('Notables here', key === 'adventurers' ? fmtInt(est) : mem.length) + stat('Party standing', (partyRep(key) > 0 ? '+' : '') + partyRep(key)) + '</dl>';
  h += branchSection(s, key);
  if (lead) h += '<p class="meta">Led here by <button type="button" class="link" data-pp="npc" data-v="' + esc(lead.id) + '">' + esc(npcName(lead)) + '</button> <small>(' + esc(lead.job) + ')</small></p>';
  h += orgJoinHtml(s, key);
  h += '<section><h3>How it works</h3><p>' + esc(W.what) + '</p><ul class="facts"><li><span>Money</span><div>' + esc(W.money) + '</div></li><li><span>Holds</span><div>' + esc(W.power) + '</div></li></ul></section>';
  // what its powerful members want
  const pw = powerful(s).filter((p) => GROUP_ORG[p.group] === key);
  if (pw.length) h += '<section><h3>What its leaders want</h3><ul class="infl-list">' + pw.map((p) => '<li><div class="oc-top"><button type="button" class="link" data-pp="npc" data-v="' + esc(p.id) + '">' + esc(npcName(p)) + '</button><small>' + esc(p.job) + '</small></div><p class="meta">Wants: ' + esc(p.motive) + '</p>' + influenceBlock(p, true) + '</li>').join('') + '</ul></section>';
  // relations
  h += '<section><h3>Relations in ' + esc(s.name) + '</h3><ul class="relrows">' + others.map((o) => {
    const r = orgRel(key, o, s, day), wk = orgRel(key, o, s, day - 7);
    return '<li><span>' + oLink(o, s.id) + '</span><span class="rw" style="' + relCell(r.v) + '">' + relWord(r.v) + ' ' + (r.v > 0 ? '+' : '') + r.v + '</span>' + changeTag((r.v - wk.v) / 100).replace(/%/, ' pts').replace(/\.0 pts/, ' pts') + '</li>';
  }).join('') + '</ul></section>';
  // jobs it has posted, and jobs against it
  const hall = hallFor(s);
  if (hall) {
    const qs = questsFor(hall, day).filter((q) => { const st = questState(q, day); return st === 'open' || st === 'accepted'; });
    const by = qs.filter((q) => q.clientOrg === key), vs = qs.filter((q) => q.against === key);
    if (by.length) h += '<section><h3>Jobs it is paying for</h3><ul class="evlist quests">' + by.map((q) => questRow(q, day)).join('') + '</ul></section>';
    if (vs.length) h += '<section><h3>Jobs against it</h3><ul class="evlist quests">' + vs.map((q) => questRow(q, day)).join('') + '</ul></section>';
  }
  // world events that touch it
  const evs = modsFor(s, day).filter(([ti]) => (EV_REL[ETYPES[ti]] || []).some(([x, y]) => x === key || y === key)).map((m) => m[2]);
  if (evs.length) h += '<section><h3>Pressures on it now</h3><ul class="evlist compact">' + evs.map((e) => evRow(e, day)).join('') + '</ul></section>';
  // members
  if (key === 'adventurers') {
    const R = roster(s);
    if (R) {
      h += '<section><h3>Members</h3>';
      const row = (p) => '<li><button type="button" data-pp="npc" data-v="' + esc(p.id) + '">' + (p.level ? rankBadge(rankOf(p.merit), true) : '<span class="rank sm" style="--rk:#7d868c">Staff</span>') + '<span class="t"><b>' + esc(npcName(p)) + '</b><small>' + esc(p.job) + '</small></span></button></li>';
      h += '<h4>Hall staff</h4><ul class="evlist people">' + R.list.slice(0, 2).map(withOv).map(row).join('') + '</ul>';
      for (const c of R.companies) h += '<h4>' + esc(c.name) + ' <small class="meta">· around level ' + c.level + '</small></h4><ul class="evlist people">' + c.members.map((i) => withOv(R.list[i])).map(row).join('') + '</ul>';
      const solo = R.list.slice(2).filter((p) => !p.company).map(withOv);
      if (solo.length) h += '<h4>Working alone</h4><ul class="evlist people">' + solo.map(row).join('') + '</ul>';
      h += '<div class="actions"><button type="button" class="btn" data-gd="tab" data-v="board">Open the quest board</button></div></section>';
    }
  } else if (mem.length) {
    const T4 = ORG_TIERS[key];
    h += '<section><h3>Members you can meet</h3><p class="meta">The notable folk of ' + esc(s.name) + ' who belong. Generate more residents in People to find more.</p><ul class="evlist people">' + mem.map((p, i) => {
      const t = i === 0 ? T4[0] : p.life >= 4 ? T4[1] : p.life >= 2 ? T4[2] : T4[3];
      return '<li><button type="button" data-pp="npc" data-v="' + esc(p.id) + '"><span class="rank sm" style="--rk:#a89a7c">' + esc(t) + '</span><span class="t"><b>' + esc(npcName(p)) + '</b><small>' + esc(p.secretJob ? p.secretJob + ' (posing as ' + p.job.toLowerCase() + ')' : p.job) + '</small></span></button></li>';
    }).join('') + '</ul></section>';
  }
  // chapters elsewhere
  const near = [];
  SGRID.query(s.x - 220, s.y - 220, s.x + 220, s.y + 220, (n) => { if (n !== s && orgHere(n, key)) near.push([Math.hypot(n.x - s.x, n.y - s.y), n]); });
  near.sort((a, b) => a[0] - b[0]);
  if (near.length) h += '<section><h3>' + (GUILDS.includes(key) ? 'Branches nearby' : 'Chapters nearby') + '</h3><ul class="movers">' + near.slice(0, 6).map(([d, n]) => '<li><span>' + oLink(key, n.id, n.name) + ' <small class="meta">' + (GUILDS.includes(key) ? BRANCH[key][guildLevel(n, key)] : sizeOf(n).name) + '</small></span><span>' + Math.round(d) + ' mi</span></li>').join('') + '</ul></section>';
  return h;
}
