// ================================================================ guild membership for heroes (v27)
// Any hero can join the organisations of a town: the Adventurers' Guild, the realm's service, the Temple, the Watch,
// the Merchants' Guild, the Craft Guilds, the Mages' Circle, or (if they have the talents) the Thieves' Guild.
// Each has a joining fee and monthly dues, four ranks, and benefits that fit it. Shop discounts and better selling
// prices are applied on the hero's Gear step; the rest are listed on the hero's sheet for the table to use.
// Memberships live on the hero (h.orgs), so players can join from their own device in a shared world.
const GJ = {
  adventurers: { fee: 0, dues: 0, ranks: null, verb: 'Register',
    perks: [[0, 'Quest board', 'Take quests at any guild hall and climb the ranks from Copper to Adamantine.'], [0, 'Hall stores', 'Potions of Healing, packs and adventuring gear 10% cheaper in a town with a guild hall.'], [0, 'Bunkroom', 'A cot in a hall\'s bunkroom for 1 sp a night.'],
      [1, 'Guild healer', 'Healing at the hall at half the temple\'s price (from Bronze).'], [2, 'Known company', 'Clients ask for you by name: one quest a month comes straight to you (from Gold).'], [3, 'Hall rights', 'Free comfortable lodging and meals at any hall (from Platinum).']] },
  rulers: { fee: 0, dues: 0, ranks: ['Retainer', 'Knight of the Realm', 'Envoy', 'Lord of the Realm'], verb: 'Swear service',
    perks: [[0, 'Writ of passage', 'No road or bridge tolls inside the realm; the guard waves you through.'], [0, 'Audience', 'An audience with the ruler or their chancellor within a few days of asking.'],
      [1, 'Crown lodging', 'Free comfortable lodging and meals at the realm\'s castles and manors while on crown business.'], [2, 'Letters of introduction', 'Advantage on Persuasion checks with officials of the realm.'], [3, 'Land and title', 'A small holding and a title of your own, worth 5 gp a week in rents.']] },
  temple: { fee: 0, dues: 1, ranks: ['Lay follower', 'Acolyte', 'Defender of the Faith', 'High Votary'], verb: 'Take the vows',
    perks: [[0, 'Shelter of the faithful', 'Free modest lodging and meals at the temple, and healing spells for the cost of materials.'], [0, 'Temple apothecary', 'Potions of Healing, antitoxin and healer\'s kits 20% cheaper (25% and 30% as you rise); holy symbols at a quarter off.'],
      [1, 'Blessing', 'Once a week a priest casts Bless or Cure Wounds for you without charge.'], [2, 'Sanctuary', 'The temple shelters you from the law for as long as you stay within its walls.'], [3, 'Divine favour', 'Once per adventure the temple casts Raise Dead or Greater Restoration for you, for the cost of components.']] },
  watch: { fee: 0, dues: 0, ranks: ['Recruit', 'Constable', 'Sergeant', 'Captain'], verb: 'Enlist', wage: 0.1,
    perks: [[0, 'Wages', 'Paid 1 sp for each day on duty (one day in ten on patrol).'], [0, 'The armoury', 'Weapons and armour 10% cheaper.'], [0, 'Barracks', 'Free poor lodging at the watch house.'],
      [1, 'Authority', 'You may arrest lawbreakers in the realm and go armed where others may not.'], [2, 'Informants', 'The watch shares what it knows of crimes and wanted people.'], [3, 'Command', 'A squad of 1d4 + 2 guards answers to you.']] },
  merchants: { fee: 10, dues: 2, ranks: ['Associate', 'Member', 'Factor', 'Master Merchant'], verb: 'Join',
    perks: [[0, 'Guild prices', 'Everything 10% cheaper where the guild has a branch (12%, 15% and 20% as you rise).'], [0, 'Fair buyers', 'Sell goods for 60% of their price instead of half (65% from Factor).'],
      [1, 'Market letters', 'Ask the guild which nearby towns pay most for what you carry.'], [2, 'Credit', 'Borrow up to 100 gp per rank from the guild bank at 10% a month.'], [3, 'Caravans', 'Free passage with guild caravans along the roads.']] },
  crafts: { fee: 5, dues: 1, ranks: ['Apprentice', 'Journeyman', 'Master', 'Guild Elder'], verb: 'Join',
    perks: [[0, 'Workshop prices', 'Weapons, armour and tools 15% cheaper (20% from Journeyman, 25% from Master).'], [0, 'Workshop', 'Use the guild\'s workshops for downtime crafting: twice the usual progress each day.'],
      [1, 'Repairs', 'Arms and armour mended at cost.'], [2, 'Commissions', 'Order masterwork items; the guild finds the materials.'], [3, 'Your own mark', 'Things you craft sell for their full price.']] },
  mages: { fee: 25, dues: 5, ranks: ['Initiate', 'Adept', 'Magister', 'Archmage of the Circle'], verb: 'Join',
    perks: [[0, 'The library', 'Advantage on Arcana and History checks to research magic, after a day in the library.'], [0, 'Arcane supplies', 'Spellbooks, foci and component pouches 20% cheaper (25%, 30% and 35% as you rise).'], [0, 'Copying', 'Wizards copy spells into their book for half the gold.'],
      [1, 'Identify', 'The circle identifies magic items for free.'], [2, 'Scrolls', 'Spell scrolls of spells the circle knows at three quarters of the price.'], [3, 'Teleportation circle', 'Use the circle\'s teleportation circle once a month.']] },
  thieves: { fee: 10, dues: 3, ranks: ['Cutpurse', 'Footpad', 'Shadow', 'Guildmaster\'s Hand'], verb: 'Join',
    perks: [[0, 'Fence', 'Sell anything for 60% of its price, no questions asked.'], [0, 'Safehouses', 'Free squalid lodging in the guild\'s safehouses.'], [0, 'Tools of the trade', 'Thieves\' tools and disguise kits 25% cheaper.'],
      [1, 'Rumours', 'Once a week ask about one person: the DM tells you a secret about them.'], [2, 'Hideout', 'The guild hides you from the watch for a week.'], [3, 'Favours', 'Call on the guild for a job or an alibi once a month.']] }
};
const GJ_RIVAL = { watch: 'thieves', thieves: 'watch' };
// what kind of thing an item is, for guild discounts
function itemKind(it) {
  if (it.kind === 'weapon') return 'weapon';
  if (it.kind === 'armor') return 'armor';
  if (it.kind === 'pack') return 'pack';
  const n = it.name;
  if (/^Arcane focus|^Druidic focus|^Spellbook|^Component pouch|^Book \(occult/.test(n)) return 'arcane';
  if (/^Holy symbol/.test(n)) return 'holy';
  if (/Potion of Healing|Antitoxin|Healer's kit/.test(n)) return 'cure';
  if (/Thieves' tools|Disguise kit/.test(n)) return 'shady';
  if (/kit$|tools$|supplies$|^Lute|^Flute|^Drum/.test(n)) return 'tool';
  return 'gear';
}
// the discount each guild gives, by item kind and rank (0 to 3)
const GJ_DISC = {
  adventurers: (k) => (k === 'cure' || k === 'pack' || k === 'gear' ? [0.1, 0.1, 0.1, 0.1] : null),
  temple: (k) => (k === 'cure' ? [0.2, 0.2, 0.25, 0.3] : k === 'holy' ? [0.25, 0.25, 0.25, 0.25] : null),
  watch: (k) => (k === 'weapon' || k === 'armor' ? [0.1, 0.1, 0.1, 0.1] : null),
  merchants: () => [0.1, 0.12, 0.15, 0.2],
  crafts: (k) => (k === 'weapon' || k === 'armor' || k === 'tool' || k === 'shady' ? [0.15, 0.2, 0.25, 0.25] : null),
  mages: (k) => (k === 'arcane' ? [0.2, 0.25, 0.3, 0.35] : null),
  thieves: (k) => (k === 'shady' ? [0.25, 0.25, 0.25, 0.25] : null)
};
const gjMember = (h, k) => (h && h.orgs && h.orgs[k]) || null;
const gjLapsed = (m, day) => !!m && GJ_DUES(m) > 0 && (m.paid || 0) < (day == null ? market.day : day);
function GJ_DUES(m) { return (GJ[m.k] || {}).dues || 0; }
// a member's rank, 0 to 3: the Adventurers' Guild from merit; the rest by time served and level, unless the DM set it
function gjRank(h, k, day) {
  const m = gjMember(h, k); if (!m) return -1;
  if (k === 'adventurers') { const g = heroGuildMember(h), r = g ? rankOf(g.merit || 0) : 0; return r >= 5 ? 3 : r >= 4 ? 2 : r >= 2 ? 1 : 0; }
  if (m.r != null) return clamp(m.r | 0, 0, 3);
  const months = ((day == null ? market.day : day) - (m.day || 0)) / 30, lv = h.level | 0;
  return months >= 12 && lv >= 9 ? 3 : months >= 4 && lv >= 5 ? 2 : months >= 1 ? 1 : 0;
}
function gjRankName(h, k) {
  if (k === 'adventurers') { const g = heroGuildMember(h); return RANKS[g ? rankOf(g.merit || 0) : 0][0]; }
  return GJ[k].ranks[gjRank(h, k)];
}
// can this hero join? '' if so, otherwise the reason
function gjNeed(h, k) {
  const D = derive(h);
  if (GJ_RIVAL[k] && gjMember(h, GJ_RIVAL[k])) return 'Not while you serve the ' + (k === 'watch' ? 'Thieves\' Guild' : 'Watch') + '.';
  if (k === 'rulers' && D.lv < 3 && h.bg !== 'noble') return 'The crown takes proven heroes (level 3 or higher) or the nobly born.';
  if (k === 'crafts' && !D.tools.length) return 'You need to be proficient with a tool.';
  if (k === 'mages' && !D.cast && !D.raceSpells.length && !D.skills.has('Arcana')) return 'The circle takes spellcasters and students of Arcana.';
  if (k === 'thieves' && !thievesFind(h, D)) return 'The guild only approaches those with a thief\'s talents.';
  return '';
}
// the Thieves' Guild is secret: it finds rogues, criminals and the light-fingered
function thievesFind(h, D) { D = D || derive(h); return h.cls === 'rogue' || h.bg === 'criminal' || D.skills.has('Stealth') || D.skills.has('Sleight of Hand') || D.tools.some((t) => /thieves/i.test(t)); }
// where a membership gives shop benefits: the town must have that organisation
function gjAt(s, k) { return !!s && orgHere(s, k); }
// the best guild discount on an item at the hero's home town
function guildDisc(h, it) {
  const s = h && h.home ? SBY.get(h.home) : null, kind = itemKind(it);
  let best = { v: 0, by: '' };
  if (!h || !h.orgs || !s) return best;
  for (const k in h.orgs) {
    const m = h.orgs[k], f = GJ_DISC[k];
    if (!m || !f || gjLapsed(m) || !gjAt(s, k)) continue;
    const t = f(kind); if (!t) continue;
    const v = t[Math.max(0, gjRank(h, k))];
    if (v > best.v) best = { v, by: ORGS[k].short };
  }
  return best;
}
// how much of an item's price the hero gets back when selling
function sellRate(h) {
  const s = h && h.home ? SBY.get(h.home) : null;
  let r = 0.5, by = '';
  if (!h || !h.orgs) return { r, by };
  const mm = gjMember(h, 'merchants'), th = gjMember(h, 'thieves');
  if (mm && !gjLapsed(mm) && gjAt(s, 'merchants')) { const v = gjRank(h, 'merchants') >= 2 ? 0.65 : 0.6; if (v > r) { r = v; by = 'Merchants'; } }
  if (th && !gjLapsed(th) && gjAt(s, 'thieves') && 0.6 > r) { r = 0.6; by = 'Thieves\' fence'; }
  return { r, by };
}
// the town a hero joins in: the town open in the Guilds tab, else the hero's home
function gjTown(h) { const s = (tool === 'guilds' || tool === 'market') && market.sid ? SBY.get(market.sid) : null; return s || (h.home ? SBY.get(h.home) : null); }
// organisations a hero could join in a town (the Thieves' Guild only if it would approach them)
function gjOpen(h, s) { return s ? ORG_KEYS.filter((k) => GJ[k] && orgHere(s, k) && (k !== 'thieves' || !isPlayer() || thievesFind(h))) : []; }
function gjCost(k) { const G = GJ[k]; return G.fee + G.dues; }
// join, leave, pay dues, and (DM) promote or demote
function gjJoin(h, k, s) {
  const why = gjNeed(h, k);
  if (why) { toast(why); return false; }
  if (gjMember(h, k)) { toast('Already a member.'); return false; }
  const cost = gjCost(k);
  if (cost > goldOf(h) + 1e-9) { toast('Joining costs ' + money(cost) + ' (fee and the first month\'s dues). Not enough gold.'); return false; }
  h.orgs = Object.assign({}, h.orgs, { [k]: { k, sid: s ? s.id : h.home || null, day: market.day, paid: GJ[k].dues ? market.day + 30 : null, r: null } });
  if (cost) h.goldDelta -= cost;
  heroLog(h, 'guild', (k === 'rulers' ? 'Swore service to ' + (realmOfS(s) ? realmOfS(s).name : 'the realm') : 'Joined the ' + ORGS[k].name.replace(/^The /, '')) + (s ? ' in ' + s.name : '') + (cost ? ' (' + money(cost) + ')' : ''));
  // the Adventurers' Guild also keeps a roster with merit and ranks: the DM's copy of the world records it
  if (k === 'adventurers' && !isPlayer() && !heroGuildMember(h)) guildCommit('Register ' + (h.name || 'hero'), (g) => { g.party.members.push({ id: 'h:' + h.id, name: h.name || 'Unnamed', cls: CLS(h).name, level: h.level, merit: 0 }); });
  return true;
}
function gjLeave(h, k) {
  if (!gjMember(h, k)) return;
  const o = Object.assign({}, h.orgs); delete o[k]; h.orgs = o;
  heroLog(h, 'guild', 'Left the ' + ORGS[k].name.replace(/^The /, ''));
}
function gjPay(h, k) {
  const m = gjMember(h, k), d = GJ[k].dues;
  if (!m || !d) return;
  if (d > goldOf(h) + 1e-9) { toast('Dues are ' + money(d) + '. Not enough gold.'); return; }
  h.goldDelta -= d;
  h.orgs = Object.assign({}, h.orgs, { [k]: Object.assign({}, m, { paid: Math.max(m.paid || 0, market.day) + 30 }) });
  heroLog(h, 'guild', 'Paid ' + money(d) + ' dues to the ' + ORGS[k].short);
}
function gjSetRank(h, k, d) {
  const m = gjMember(h, k);
  if (!m || k === 'adventurers' || isPlayer()) return;
  h.orgs = Object.assign({}, h.orgs, { [k]: Object.assign({}, m, { r: clamp(gjRank(h, k) + d, 0, 3) }) });
}
// a hero's guilds: the memberships with their ranks, dues and benefits, and what they could join
function heroGuildsHtml(h) {
  const day = market.day, s = gjTown(h), keys = Object.keys(h.orgs || {}).filter((k) => GJ[k]);
  let o = '<section class="hguilds"><h3>Guilds and orders</h3>';
  if (keys.length) o += '<ul class="gj-list">' + keys.map((k) => gjCard(h, k, day)).join('') + '</ul>';
  else o += '<p class="meta">' + esc(h.name || 'Your hero') + ' belongs to no guild yet. Members get discounts, lodging, help and favours that fit each one.</p>';
  const open = gjOpen(h, s).filter((k) => !gjMember(h, k));
  if (s && open.length) o += '<h4>Join in ' + tLink(s) + '</h4><ul class="gj-join">' + open.map((k) => gjJoinRow(h, k, s)).join('') + '</ul>';
  else if (!s) o += '<p class="meta">Choose a hometown on the Basics step, or open a town\'s Guilds tab, to see what you can join.</p>';
  return o + '</section>';
}
function gjCard(h, k, day) {
  const m = gjMember(h, k), G = GJ[k], r = gjRank(h, k), lapsed = gjLapsed(m, day), at = m.sid && SBY.get(m.sid);
  const perks = G.perks.filter(([min]) => min <= r), next = G.perks.filter(([min]) => min === r + 1);
  const dm = !isPlayer() && k !== 'adventurers';
  return '<li' + gcStyle(k) + '><div class="gj-top"><b>' + (at ? oLink(k, at.id) : esc(ORGS[k].name)) + '</b><span class="pill' + (lapsed ? '' : ' on') + '">' + esc(gjRankName(h, k)) + '</span>' + (lapsed ? '<span class="pill">dues owed</span>' : '') + '</div>' +
    '<p class="meta">' + (at ? 'Joined in ' + tLink(at) + ', ' : 'Joined ') + dateText(m.day || 0) + (G.dues ? ' · dues ' + money(G.dues) + ' a month, ' + (lapsed ? '<b>overdue since ' + dateText(m.paid || 0) + '</b>' : 'paid to ' + dateText(m.paid || 0)) : '') + '</p>' +
    (lapsed ? '<p class="small warn-t">Benefits are suspended until the dues are paid.</p>' : '<ul class="gj-perks">' + perks.map(([, n, d]) => '<li><b>' + esc(n) + '</b> ' + esc(d) + '</li>').join('') + '</ul>') +
    (next.length && !lapsed ? '<p class="small">Next rank adds: ' + next.map((p) => esc(p[1])).join(', ') + (k === 'adventurers' ? ' (earn merit on quests)' : m.r == null ? ' (after time served and more levels)' : '') + '.</p>' : '') +
    '<div class="actions">' + (G.dues ? '<button type="button" class="btn sm' + (lapsed ? ' primary' : '') + '" data-gj="pay" data-v="' + esc(h.id) + '|' + k + '">Pay a month (' + money(G.dues) + ')</button>' : '') +
    (dm ? '<button type="button" class="btn sm" data-gj="down" data-v="' + esc(h.id) + '|' + k + '"' + (r <= 0 ? ' disabled' : '') + '>Demote</button><button type="button" class="btn sm" data-gj="up" data-v="' + esc(h.id) + '|' + k + '"' + (r >= 3 ? ' disabled' : '') + '>Promote</button>' : '') +
    '<button type="button" class="btn sm danger" data-gj="leave" data-v="' + esc(h.id) + '|' + k + '">Leave</button></div></li>';
}
function gjJoinRow(h, k, s) {
  const G = GJ[k], why = gjNeed(h, k);
  return '<li' + gcStyle(k) + '><div><b>' + oLink(k, s.id) + '</b><small>' + (G.fee ? money(G.fee) + ' to join' : 'free to join') + (G.dues ? ', then ' + money(G.dues) + ' a month' : G.wage ? '; pays a wage' : '') + '</small>' +
    '<small class="gj-gist">' + G.perks.filter(([m]) => m === 0).map((p) => esc(p[1])).join(' · ') + '</small>' + (why ? '<small class="warn-t">' + esc(why) + '</small>' : '') + '</div>' +
    '<button type="button" class="btn sm' + (why ? '' : ' primary') + '" data-gj="join" data-v="' + esc(h.id) + '|' + k + '|' + esc(s.id) + '"' + (why ? ' disabled' : '') + '>' + G.verb + '</button></li>';
}
// on an organisation's page: what members get, and joining with your heroes
function orgJoinHtml(s, k) {
  const G = GJ[k];
  if (!G) return '';
  let o = '<section class="gj-org"><h3>Membership</h3><p class="meta">' + (G.fee ? money(G.fee) + ' to join' : 'Free to join') + (G.dues ? ', then ' + money(G.dues) + ' a month' : G.wage ? '; it pays a wage' : '') + '. Ranks: ' + (G.ranks ? G.ranks.join(', ') : 'Copper to Adamantine, by merit') + '.</p>';
  o += '<ul class="gj-perks">' + G.perks.map(([m, n, d]) => '<li><b>' + esc(n) + '</b>' + (m ? ' <small>(' + esc(G.ranks ? G.ranks[m] : ['', 'Bronze', 'Gold', 'Platinum'][m]) + ')</small>' : '') + ' ' + esc(d) + '</li>').join('') + '</ul>';
  const hs = heroes.list || [];
  if (hs.length) o += '<ul class="gj-join">' + hs.map((h) => gjMember(h, k) ? '<li><div><b>' + esc(h.name || 'Unnamed hero') + '</b><small>' + esc(gjRankName(h, k)) + (gjLapsed(gjMember(h, k)) ? ' · dues owed' : ' · member') + '</small></div><button type="button" class="btn sm" data-hero="' + esc(h.id) + '">Open hero</button></li>'
    : (k === 'thieves' && isPlayer() && !thievesFind(h)) ? '' : (() => { const r = gjJoinRow(h, k, s); return r.replace('<div><b>' + oLink(k, s.id) + '</b>', '<div><b>' + esc(h.name || 'Unnamed hero') + '</b>'); })()).join('') + '</ul>';
  else o += '<p class="meta">Make a hero in the Heroes section to join.</p>';
  return o + '</section>';
}
// on a person's page: heroes who share an organisation with them
function guildKinHtml(p) {
  const org = GROUP_ORG[p.group] || (!isPlayer() && /thieves/.test(p.secretJob || '') ? 'thieves' : null);
  if (!org || !GJ[org]) return '';
  const kin = (heroes.list || []).filter((h) => gjMember(h, org) && !gjLapsed(gjMember(h, org)));
  if (!kin.length) return '';
  return '<p class="gj-kin"><span class="lab">Fellow member</span> ' + kin.map((h) => '<button type="button" class="link" data-hero="' + esc(h.id) + '">' + esc(h.name || 'Unnamed hero') + '</button> <small>(' + esc(gjRankName(h, org)) + ')</small>').join(' · ') + ' of the ' + esc(ORGS[org].short) + ': expect a warmer welcome.</p>';
}
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-gj]');
  if (!b) return;
  const [hid, k, sid] = (b.dataset.v || '').split('|');
  const h = (heroes.list || []).find((x) => x.id === hid);
  if (!h || !GJ[k]) return;
  const a = b.dataset.gj;
  if (a === 'join') { if (gjJoin(h, k, SBY.get(sid) || gjTown(h))) toast((h.name || 'Your hero') + ' is now ' + (k === 'rulers' ? 'sworn to the realm' : 'a member of the ' + ORGS[k].short) + '.'); }
  else if (a === 'leave') gjLeave(h, k);
  else if (a === 'pay') gjPay(h, k);
  else if (a === 'up') gjSetRank(h, k, 1);
  else if (a === 'down') gjSetRank(h, k, -1);
  heroSave();
  renderPanel();
});

// prices on the hero's Gear step: the town's price, less the best guild discount the hero has there
function shopPrice(h, it) {
  const p = shopPriceLocal(h, it), d = guildDisc(h, it);
  return Object.assign({}, p, { full: p.price, price: d.v ? Math.round(p.price * (1 - d.v) * 100) / 100 : p.price, disc: d.v, by: d.by });
}

// the DM adds a hero who registered from their own sheet to the Adventurers' Guild roster
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-gd-roster]');
  if (!b || isPlayer()) return;
  const h = (heroes.list || []).find((x) => x.id === b.dataset.gdRoster);
  if (!h || heroGuildMember(h)) return;
  guildCommit('Register ' + (h.name || 'hero'), (g) => { g.party.members.push({ id: 'h:' + h.id, name: h.name || 'Unnamed', cls: CLS(h).name, level: h.level, merit: 0 }); });
  renderPanel();
});
