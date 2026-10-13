// ================================================================ what is happening at a place (v27)
// Every place in a town (the hall, market, temples, taverns, inns, the watch, guild halls, banks, docks, shops and
// districts) gets a short scene for the chosen time of day: how busy it is and who is there, what usually goes on
// at that hour, what the town's events are doing to it, the season, something particular to the place (prices,
// agendas, rooms taken, prisoners, ships in port), a rumour, and what is going on at the places around it.
// Everything is worked out from the day, so a scene reads the same each time it is opened.
const SCENE_PARTS = [['dawn', 6], ['morning', 9], ['midday', 12], ['afternoon', 15], ['evening', 19], ['night', 23]];
const SCENE = {
  hall: { dawn: 'Servants open the shutters and lay the fires before the household wakes.', morning: 'Petitioners queue in the outer hall for a word with {own}.', midday: 'Messengers come and go with sealed letters; clerks copy out writs and tax rolls.',
    afternoon: 'The court hears disputes over boundaries, debts and inheritances.', evening: 'Torches are lit and {own} dines with guests.', night: 'Guards walk the walls; one high window is still lit.' },
  market: { dawn: 'Carts rumble in and stallholders set out their wares.', morning: 'The market is at its busiest: hawkers shout prices over the din.', midday: 'Food sellers do brisk trade as the crowd thins.',
    afternoon: 'Bargain-hunters pick over what is left while traders haggle over the last lots.', evening: 'Stalls are packed away; sweepers and stray dogs take over.', night: 'The square is empty but for the watch on its rounds.' },
  green: { dawn: 'Geese and goats are turned out onto the green.', morning: 'Neighbours trade eggs, cheese and gossip by the well.', midday: 'Children play while their elders rest in the shade.',
    afternoon: 'A pedlar has spread a blanket of needles, ribbons and pots.', evening: 'Folk drift home from the fields across the green.', night: 'The green is dark and still.' },
  temple: { dawn: 'Dawn prayers to {god} are sung.', morning: 'Pilgrims leave offerings while priests hear the troubles of the faithful.', midday: 'The temple is cool, quiet and nearly empty.',
    afternoon: 'Acolytes tend the sick and teach children their letters.', evening: 'The evening service draws a crowd.', night: 'Candles burn before the altar where a lone priest keeps vigil.' },
  tavern: { dawn: 'The shutters are closed while the cellarman rolls in fresh barrels.', morning: 'A few early drinkers nurse their cups.', midday: 'Workers crowd in for bread, stew and a quick ale.',
    afternoon: 'Dice rattle in a corner and travellers swap news.', evening: 'Packed and loud: a fiddler plays and the ale flows.', night: 'Last orders. The keeper turns out the stragglers.' },
  inn: { dawn: 'Guests breakfast before setting out while ostlers saddle their horses.', morning: 'Maids turn the rooms and the stable is mucked out.', midday: 'New arrivals ask after rooms and stabling.',
    afternoon: 'Carts and riders pull into the yard.', evening: 'The common room fills with travellers trading news of the road.', night: 'The yard gate is barred; a lamp burns for late arrivals.' },
  law: { dawn: 'The night watch hands over to the day watch.', morning: 'Last night\'s drunks are let out and fresh charges are read.', midday: 'Guards drill in the yard.',
    afternoon: 'Patrols set out, and a debtor pleads for more time.', evening: 'The evening watch musters for inspection.', night: 'A lantern hangs at the door and prisoners call through the bars.' },
  money: { dawn: 'The strongroom is still locked.', morning: 'Clerks weigh coin and record deposits; a merchant waits to ask for a loan.', midday: 'Money-changers do steady business with travellers.',
    afternoon: 'Bills of exchange are drawn up for distant markets.', evening: 'The day\'s takings are counted and locked away.', night: 'Guards sit up with the strongroom.' },
  work: { dawn: 'Fishing boats slip out on the tide.', morning: 'Stevedores unload cargo while cranes creak overhead.', midday: 'Gulls fight over scraps; porters rest on the bales.',
    afternoon: 'Wagons queue to load for the inland roads.', evening: 'Sailors spill into the harbour taverns.', night: 'The quays are dark and quiet.' },
  shop: { dawn: 'The shutters are still down.', morning: 'The door is open and the first customers drift in.', midday: 'Work goes on at the bench while customers wait.',
    afternoon: 'A steady trickle of customers.', evening: 'The day\'s last orders are wrapped and the shutters go up.', night: 'Closed for the night.' },
  guild: { dawn: 'A clerk unbars the doors and sorts the morning\'s letters.', morning: 'Members come and go on guild business.', midday: 'Officers of the guild meet over a long lunch.',
    afternoon: 'Members come and go on guild business.', evening: 'Members gather to drink and talk shop.', night: 'Shuttered, with a watchman at the door.' },
  district: { dawn: 'Smoke rises from the first cooking fires.', morning: 'Its streets fill with traders, carts and errand-runners.', midday: 'Doorways are full of neighbours trading gossip.',
    afternoon: 'Children run between the carts; washing hangs across the lanes.', evening: 'Lamps are lit and the smells of supper drift out.', night: 'Its streets are dark but for the watch\'s lanterns.' }
};
const GUILD_SCENE = {
  adventurers: 'Adventurers crowd the quest board, and a company boasts of its last job.',
  merchants: 'Factors read prices from distant markets and strike bargains over wine.',
  crafts: 'Masters inspect apprentices\' work, and a dispute over a shoddy batch is being settled.',
  mages: 'Robed students hurry between lectures, and something smells of sulphur.',
  thieves: 'Lookouts loiter outside while the take is divided in a back room.'
};
// how busy a kind of place is at each part of the day (0 to 1)
const BUSY = { hall: [0.2, 0.7, 0.6, 0.6, 0.5, 0.1], market: [0.5, 1, 0.7, 0.6, 0.2, 0], temple: [0.6, 0.4, 0.2, 0.3, 0.8, 0.1], tavern: [0, 0.2, 0.6, 0.5, 1, 0.4], inn: [0.6, 0.3, 0.4, 0.5, 0.9, 0.2],
  law: [0.4, 0.6, 0.5, 0.5, 0.6, 0.3], guild: [0.1, 0.7, 0.6, 0.7, 0.5, 0.1], money: [0, 0.8, 0.7, 0.6, 0.2, 0], work: [0.6, 1, 0.7, 0.8, 0.4, 0.1], shop: [0, 0.7, 0.6, 0.7, 0.3, 0], district: [0.3, 0.8, 0.7, 0.7, 0.6, 0.1] };
const BUSY_WORD = (v) => (v >= 0.85 ? 'Crowded' : v >= 0.55 ? 'Busy' : v >= 0.3 ? 'Steady' : v > 0.05 ? 'Quiet' : 'Empty');
// what an event does to a kind of place: [kind or '*', line]
const EV_SCENE = {
  war: { tavern: 'Recruiting sergeants buy rounds for likely young men and women; talk is all of the war with {enemy}.', market: 'Requisition officers seize horses and grain for the war with {enemy}, and arms sell as fast as the smiths can make them.',
    hall: 'Captains report from the front and the war council sits late.', temple: 'Families pray for loved ones fighting {enemy}.', law: 'Half the watch has gone to the war, and those left are stretched thin.',
    inn: 'Officers have taken the best rooms.', '*': 'Talk everywhere is of the war with {enemy}.' },
  plague: { temple: 'The sick fill the nave and the priests work without rest.', tavern: 'Half the benches are empty; people fear the sickness.', market: 'Fewer stalls than usual, and herbs sell at a premium.',
    inn: 'Rooms stand empty as travellers stay away.', '*': 'Doors are marked with chalk, and people keep their distance from one another.' },
  famine: { market: 'Bread queues stretch round the square and tempers flare at the grain stalls.', temple: 'A long line waits for the temple\'s thin soup.', hall: 'An angry crowd outside demands the granaries be opened.',
    tavern: 'No food is served, only weak ale.', '*': 'Thin faces everywhere, and hungry children beg at the doors.' },
  bandits: { inn: 'Merchants hire guards in the yard before risking the roads.', market: 'Imported goods are scarce: the roads aren\'t safe.', law: 'A bounty on the bandits is nailed to the door.',
    '*': 'Travellers arrive in armed groups, with tales of ambushes on the road.' },
  boom: { market: 'Stalls overflow with imported goods and new faces.', inn: 'Every room is taken by merchants and their factors.', money: 'Lenders are busy financing new ventures.', '*': 'New faces and new money are everywhere.' },
  festival: { market: 'Contests and performers fill the square, and pickpockets work the crowd.', tavern: 'Packed from noon to midnight.', temple: 'Processions set out with offerings and garlands.', '*': 'Bunting hangs across the street, with music and laughter.' },
  feast: { hall: 'The great hall is laid for {event}.', tavern: 'Leftovers from {event} feed the poor at the back door.', market: 'Cooks buy up meat, wine and spices for {event}.', '*': 'Servants hurry past with platters for {event}.' }
};
const SCENE_SEASON = [
  [[11, 0, 1], 'Snow lies in the streets and everyone crowds near the fire.', 'A great fire roars and wet cloaks steam by the hearth.'],
  [[2, 3, 4], 'Spring rain puddles the streets; the first green shows in the window boxes.', 'Muddy boots line the door after the spring rain.'],
  [[5, 6, 7], 'Summer heat bakes the streets, with flies and dust everywhere.', 'The windows are thrown open against the summer heat.'],
  [[8, 9, 10], 'Harvest carts creak past, piled high, and the air smells of woodsmoke.', 'Autumn wind rattles the shutters.']
];
const OUTDOOR = new Set(['market', 'green', 'work', 'district']);
function sceneHash(s, key, day, n) { return T.hash(hashStr(s.id + '|' + key) & 0xffffff, day, 7300 + n); }
// who is at a place at an hour, from everyone's daily routine
function presentAt(s, key, day, hour) {
  const out = [];
  for (const p of residents(s)) { const w = whereAt(p, s, day, hour); if (w && w.key === key && !(w.dm && isPlayer())) out.push([p, w]); }
  return out;
}
// the scene at one place, at one hour
function placeScene(s, pl, day, hour) {
  const part = HOUR_PART(hour), pi = SCENE_PARTS.findIndex(([k]) => k === part), key = pl.key;
  const z = sizeOf(s).k, green = pl.kind === 'market' && (z === 'hamlet' || z === 'village');
  const kind = green ? 'green' : pl.kind, owner = pl.owner ? withOv(npcById(pl.owner) || {}) : null;
  const fill = (t) => t.replace(/\{own\}/g, owner && owner.id ? pLink(owner) : 'the household').replace(/\{god\}/g, esc(pl.god || 'the gods'));
  const lines = [];
  // the usual business at this hour
  let base = (SCENE[kind] || SCENE.district)[part];
  if (pl.kind === 'guild' && pl.org && (part === 'morning' || part === 'afternoon')) base = GUILD_SCENE[pl.org] || base;
  if (pl.kind === 'shop' && owner && owner.id) {
    const w = whereAt(owner, s, day, hour);
    base = w && w.key === key ? pLink(owner) + ' is at work here. ' + SCENE.shop[part] : 'Closed for now: ' + pLink(owner) + ' is ' + esc(lowFirst(w ? w.text : 'away')) + '.';
  }
  const rest = day % 7 === 6;
  if (rest && (kind === 'market' || kind === 'shop' || kind === 'money') && (part === 'morning' || part === 'midday' || part === 'afternoon') && pl.kind !== 'shop') base = kind === 'money' ? 'Closed for the rest day.' : 'It is the rest day: only a few stalls are open, selling food and drink.';
  lines.push(fill(base));
  // the town's events
  const L = localInfo(s), mods = modsFor(s, day).slice().sort((a, b) => b[1] - a[1]);
  for (const [, f, e] of mods.slice(0, 2)) {
    const E = EV_SCENE[e.type]; if (!E || f < 0.15) continue;
    let t = E[kind] || E[pl.kind] || E['*'];
    const enemy = e.type === 'war' ? REALMS[e.ai === L.ri ? e.bi : e.ai] : null;
    if (e.type === 'war' && occupiedBy(e, s, L.ri, f) >= 0) t = 'Soldiers of ' + esc(enemy ? enemy.name : 'the enemy') + ' stand guard; the town is under occupation.';
    t = t.replace(/\{enemy\}/g, enemy ? esc(enemy.name) : 'the enemy').replace(/\{event\}/g, esc(e.name));
    // plague, famine and festivals change the whole feel of a place: their own line replaces the usual routine
    if (f >= 0.3 && (E[kind] || E[pl.kind]) && (e.type === 'plague' || e.type === 'famine' || e.type === 'festival') && lines.length === 1 && part !== 'night') lines[0] = t;
    else lines.push(t);
  }
  // the season, and the rest day
  const m = dateParts(day).m, se = SCENE_SEASON.find(([ms]) => ms.includes(m));
  if (se && sceneHash(s, key, day, 1) < 0.6) lines.push(OUTDOOR.has(kind) ? se[1] : se[2]);
  if (rest && kind === 'temple' && (part === 'morning' || part === 'evening')) lines.push('It is the rest day, and the benches are full.');
  // something particular to this place
  const extra = sceneDetail(s, pl, day, part, L, mods);
  if (extra) lines.push(extra);
  // how busy, and who is here
  const here = presentAt(s, key, day, hour);
  const restCut = rest && (kind === 'market' || kind === 'money') ? 0.35 : 1;
  const evBoost = mods.some(([, f, e]) => (e.type === 'festival' || e.type === 'feast' || e.type === 'boom') && f > 0.2) ? 0.2 : mods.some(([, f, e]) => e.type === 'plague' && f > 0.3) ? -0.25 : 0;
  const busy = clamp((BUSY[pl.kind] || BUSY.district)[pi] * (0.7 + 0.15 * s.tier) * restCut + evBoost + here.length * 0.04 + (sceneHash(s, key, day, 2 + pi) - 0.5) * 0.2, 0, 1);
  return { part, busy, word: BUSY_WORD(busy), lines, here };
}
function sceneDetail(s, pl, day, part, L, mods) {
  const r = (n) => sceneHash(s, pl.key, day, 20 + n), war = mods.find(([, f, e]) => e.type === 'war' && f > 0.2);
  switch (pl.kind) {
    case 'market': {
      const now = pricesFor(s, day), then = pricesFor(s, day - 7);
      const mv = BASKET.map((gi) => GOODS[gi]).map((g) => [now[g.i] / then[g.i], g]).filter(([x]) => Math.abs(x - 1) > 0.04).sort((a, b) => Math.abs(Math.log(b[0])) - Math.abs(Math.log(a[0])))[0];
      return mv ? 'Everyone is talking about ' + esc(mv[1].name.split(',')[0].toLowerCase()) + ', ' + (mv[0] > 1 ? 'up ' : 'down ') + Math.round(Math.abs(mv[0] - 1) * 100) + '% on last week.' : 'Prices are steady this week.';
    }
    case 'hall': { const a = agendaList(s).find((x) => x.scope !== 'realm') || agendaList(s)[0]; return a ? pLink(a.p) + ' is pressing on with one aim: ' + esc(lowFirst(a.A.label)) + '.' : ''; }
    case 'temple': return pl.dom ? 'Its priests serve ' + esc(pl.god || 'the gods') + ', a god of ' + esc(pl.dom.toLowerCase()) + '.' : '';
    case 'inn': {
      const rooms = [4, 6, 10, 16, 24][Math.min(4, s.tier)] + Math.floor(r(1) * 4);
      let occ = 0.45 + r(2) * 0.25;
      for (const [, f, e] of mods) { if (e.type === 'boom' || e.type === 'festival') occ += 0.35 * f; if (e.type === 'plague') occ -= 0.5 * f; if (e.type === 'war' && occupiedBy(e, s, L.ri, f) < 0) occ += 0.15 * f; }
      const n = Math.round(rooms * clamp(occ, 0.05, 1));
      return n >= rooms ? 'Every one of its ' + rooms + ' rooms is taken.' : n + ' of its ' + rooms + ' rooms are taken.';
    }
    case 'law': {
      const thieves = guildLevel(s, 'thieves') || 0, n = Math.round((s.pop / 1500 + thieves * 2) * (0.6 + r(3) * 0.8) + (war ? 2 : 0));
      return pl.key === 'barracks' ? (war ? 'Half the bunks are empty; the rest are packing for the front.' : 'The garrison is at full strength.') : n ? n + ' prisoner' + (n === 1 ? ' is' : 's are') + ' held in the cells.' : 'The cells stand empty.';
    }
    case 'money': { const rate = 2 + (war ? 2 : 0) + (mods.some(([, f, e]) => e.type === 'famine' && f > 0.2) ? 1 : 0) - (mods.some(([, f, e]) => e.type === 'boom' && f > 0.2) ? 1 : 0); return 'Loans go out at ' + rate + '% a month' + (war ? ', dearer than usual with the war on' : '') + '.'; }
    case 'work': {
      if (pl.key !== 'docks') return '';
      let ships = Math.round((2 + s.tier * 2) * (0.6 + r(4) * 0.8));
      for (const [, f, e] of mods) { if (e.type === 'boom') ships += Math.round(4 * f); if (e.type === 'war' || e.type === 'plague') ships -= Math.round(3 * f); }
      ships = Math.max(0, ships);
      return ships ? ships + ' ship' + (ships === 1 ? ' is' : 's are') + ' tied up at the quays.' : 'No ships in port.';
    }
    case 'guild': {
      if (!pl.org) return '';
      const others = orgsShown(s).filter((k) => k !== pl.org);
      let worst = null; for (const o of others) { const v = orgRel(pl.org, o, s, day).v; if (!worst || v < worst[1]) worst = [o, v]; }
      const hall = hallFor(s), jobs = hall ? questsFor(hall, day).filter((q) => q.clientOrg === pl.org && questState(q, day) === 'open').length : 0;
      return (worst && worst[1] <= -30 ? 'There is bad blood with the ' + esc(ORGS[worst[0]].short) + ' just now. ' : '') + (jobs ? 'It has ' + jobs + ' job' + (jobs === 1 ? '' : 's') + ' posted at the guild hall.' : '');
    }
    case 'district': {
      const inside = placesOf(s).list.filter((o) => o.kind !== 'district' && o.kind !== 'market').filter((o) => { const q = placePos(s, o.key), d = districtAt(s, q.x, q.y); return d && d.key === pl.key; });
      const al = aldermenOf(s).find((x) => x.d.name === pl.name);
      return (inside.length ? 'Its landmarks include ' + inside.slice(0, 3).map((o) => placeLink(s, o.key)).join(', ') + '. ' : '') + (al && al.p ? 'Its alderman is ' + pLink(al.p) + '.' : '');
    }
  }
  return '';
}
// a rumour heard at the tavern, inn, market or guild hall: an open quest, or the hook of an event nearby
function sceneRumour(s, pl, day) {
  if (!['tavern', 'inn', 'market', 'guild'].includes(pl.kind)) return '';
  const hall = hallFor(s), qs = hall ? questsFor(hall, day).filter((q) => questState(q, day) === 'open') : [];
  const mods = modsFor(s, day), pick = sceneHash(s, pl.key, day, 40);
  if (qs.length && (pick < 0.6 || !mods.length)) { const q = qs[Math.floor(pick * 997) % qs.length]; return 'Word is someone is paying for help: <button type="button" class="link" data-quest="' + esc(q.id) + '|' + esc(hall.id) + '">' + esc(q.title.toLowerCase()) + '</button>' + (hall !== s ? ' (at ' + tLink(hall) + ')' : '') + '.'; }
  if (mods.length) { const e = mods[Math.floor(pick * 991) % mods.length][2]; return esc(EVT[e.type].hook) + ' (' + eLink(e) + ')'; }
  return '';
}
// the places nearest this one, and what is going on at each now
function sceneAround(s, pl, day, hour) {
  const me = placePos(s, pl.key), part = HOUR_PART(hour), pi = SCENE_PARTS.findIndex(([k]) => k === part);
  const list = placesOf(s).list.filter((o) => o.key !== pl.key && o.kind !== 'district' && !(o.secret && isPlayer())).map((o) => { const q = placePos(s, o.key); return [o, Math.hypot(q.x - me.x, q.y - me.y)]; }).sort((a, b) => a[1] - b[1]).slice(0, 3);
  return list.map(([o, d]) => {
    const n = presentAt(s, o.key, day, hour).length, b = clamp((BUSY[o.kind] || BUSY.district)[pi] * (0.7 + 0.15 * s.tier) + n * 0.04, 0, 1);
    return '<li>' + placeLink(s, o.key) + ' <small>' + (d * 5280 < 30 ? 'right here' : fmtDist(d) + ' away') + ' · ' + BUSY_WORD(b).toLowerCase() + (n ? ', ' + n + ' notable' + (n === 1 ? '' : 's') + ' there' : '') + '</small></li>';
  }).join('');
}
function sceneHtml(s, pl, day) {
  const hour = people.hour, sc = placeScene(s, pl, day, hour);
  let h = '<section class="scene"><div class="scene-h"><h3>What\'s happening</h3><span class="pill ' + (sc.busy >= 0.55 ? 'on' : '') + '">' + sc.word + '</span></div>';
  h += '<div class="seg sm scene-t" role="group" aria-label="Time of day">' + SCENE_PARTS.map(([k, hr]) => '<button type="button" data-plhour="' + hr + '" aria-pressed="' + (sc.part === k) + '">' + k.charAt(0).toUpperCase() + k.slice(1) + '</button>').join('') + '</div>';
  h += '<p class="scene-p">' + sc.lines.join(' ') + '</p>';
  if (sc.here.length) h += '<p class="small scene-who"><span class="lab">Here now</span> ' + sc.here.slice(0, 6).map(([p, w]) => pLink(p) + ' <small>' + esc(lowFirst(w.text).replace(' at ' + pl.name, '').replace(' at ' + lowFirst(pl.name), '')) + '</small>').join(' · ') + (sc.here.length > 6 ? ' and ' + (sc.here.length - 6) + ' more' : '') + '</p>';
  const ru = sceneRumour(s, pl, day);
  if (ru) h += '<p class="small scene-rumour"><span class="lab">Overheard</span> ' + ru + '</p>';
  const ar = sceneAround(s, pl, day, hour);
  if (ar) h += '<h4>Around it</h4><ul class="scene-around">' + ar + '</ul>';
  return h + '</section>';
}
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-plhour]');
  if (!b) return;
  people.hour = clamp(+b.dataset.plhour | 0, 0, 23);
  renderPanel();
});
