// ================================================================ the atlas shell (v24): a docked side panel beside a framed map
// The side panel is a drill-down: World › Realm › Place, and each place opens its own tabs (Overview, Market, People,
// Guilds). It is built on top of the existing tool panels: which page shows is worked out from the same state the tools
// already use (tool, sel, market.sid, people.sid), so map taps, links, search and shortcuts all land in the right place.
let navR = null;            // the realm being browsed (its capital's id), kept while you move between its places
let navQ = '', navSize = 'all', navMore = {};
const realmIdx = (R) => REALMS.indexOf(R);
const realmOfS = (s) => (s ? realmOf(s.x, s.y) : null);
const realmHue = (R) => (hashStr(R.cap.id) >>> 0) % 360;
const sizeWord = (s) => sizeOf(s).name;

// which page the side panel is on
function sideCtx() {
  if (tool === 'market' && market.sid && market.tab !== 'overview' && SBY.get(market.sid)) return { kind: 'place', s: SBY.get(market.sid), tab: 'market' };
  if (tool === 'people' && people.sid && people.tab !== 'tracked' && SBY.get(people.sid)) return { kind: 'place', s: SBY.get(people.sid), tab: 'people' };
  if (tool === 'guilds') { const s = market.sid ? SBY.get(market.sid) : people.sid ? SBY.get(people.sid) : null; if (s) return { kind: 'place', s, tab: 'guilds' }; }
  if (tool === 'explore' && sel && sel.kind === 'settle' && selObj()) return { kind: 'place', s: selObj(), tab: 'overview' };
  const SECT = { market: 'Markets of the world', people: 'Tracked people', guilds: 'Guilds', heroes: 'Heroes', monsters: 'Monsters', settle: 'Editing · Settlements', road: 'Editing · Roads', paint: 'Editing · Terrain', tiles: 'Editing · Battle map', label: 'Editing · Labels', measure: 'Measure' };
  if (tool === 'explore' && sel && sel.kind === 'road') return { kind: 'section', name: 'Road' };
  if (tool === 'explore' && sel && sel.kind === 'label') return { kind: 'section', name: 'Label' };
  if (tool === 'explore' && sel && sel.kind === 'event') return { kind: 'section', name: 'Event' };
  if (tool !== 'explore') return { kind: 'section', name: SECT[tool] || tool, edit: ['settle', 'road', 'paint', 'tiles', 'label', 'measure'].includes(tool) };
  const R = navR ? REALMS.find((r) => r.cap.id === navR) : null;
  return R ? { kind: 'realm', R } : { kind: 'home' };
}

// ---------------------------------------------------------------- the calendar, always at hand
function renderCal() {
  const el = $('calBar');
  if (!el) return;
  const d = market.day, follow = campaign.shared && !campaign.admin;
  el.innerHTML = '<div class="cal-d" id="calDate">' + dateText(d) + '<small>' + (follow ? 'Following your DM' : market.playing ? 'Time is running' : d % 7 === 6 ? 'Rest day' : 'Paused') + '</small></div>' +
    (follow ? '' : '<button type="button" data-cal="-1" aria-label="Previous day">‹</button><button type="button" data-cal="play" class="' + (market.playing ? 'on' : '') + '" aria-pressed="' + market.playing + '">' + (market.playing ? 'Pause' : 'Play') + '</button><button type="button" data-cal="1" aria-label="Next day">Day ›</button><button type="button" data-cal="7" aria-label="Skip a week">Week »</button>');
}
$('calBar').addEventListener('click', (e) => {
  const b = e.target.closest('[data-cal]');
  if (!b) return;
  const v = b.dataset.cal;
  if (v === 'play') setPlaying(!market.playing); else advanceDays(+v);
  renderCal();
  if (tool !== 'market') renderPanelSafe();
});

// ---------------------------------------------------------------- the header: breadcrumbs, the place's name and its tabs
function crumbBtn(go, v, label) { return '<button type="button" data-nav="' + go + '"' + (v != null ? ' data-v="' + esc(v) + '"' : '') + '>' + esc(label) + '</button><span class="sep" aria-hidden="true">›</span>'; }
function sideHead(c) {
  let cr = '';
  const world = WORLD_NAME || 'World';
  if (c.kind === 'home') return '<div class="side-head"><nav class="crumbs" aria-label="Where you are"><b>' + esc(world) + '</b></nav></div>';
  cr += crumbBtn('home', null, world);
  if (c.kind === 'realm') return '<div class="side-head"><nav class="crumbs" aria-label="Where you are">' + cr + '<b>' + esc(c.R.name) + '</b></nav></div>';
  if (c.kind === 'section') {
    return '<div class="side-head"><nav class="crumbs" aria-label="Where you are">' + cr + '<b>' + esc(c.name) + '</b></nav>' + (c.edit ? '<div class="editing-bar"><span class="meta">Map tools are along the top of the map.</span><button type="button" class="btn sm primary" data-nav="done">Done</button></div>' : '') + '</div>';
  }
  const s = c.s, R = realmOfS(s);
  if (R) cr += crumbBtn('realm', R.cap.id, R.name);
  const npc = c.tab === 'people' && people.npc ? npcById(people.npc) : null;
  const plc = c.tab === 'people' && people.place ? placeGet(s, people.place) : null;
  if (npc || plc) cr += crumbBtn('place', s.id, s.name) + '<b>' + esc(npc ? npcName(npc) : plc.name) + '</b>';
  else cr += '<b>' + esc(s.name) + '</b>';
  const canRename = !isPlayer() && sel && sel.kind === 'settle' && sel.id === s.id;
  const name = canRename ? '<input id="f-name" class="title-in" value="' + esc(s.name) + '" aria-label="Settlement name" maxlength="40">' : '<h2>' + esc(s.name) + '</h2>';
  const party = gst().party.at === s.id ? ' · the party is here' : '';
  const tabs = [['overview', 'Overview'], ['market', 'Market'], ['people', 'People'], ['guilds', 'Guilds']];
  return '<div class="side-head"><nav class="crumbs" aria-label="Where you are">' + cr + '</nav>' +
    '<div class="ph-row"><div class="grow"><div class="eyebrow">' + esc(sizeWord(s)) + ' · ' + fmtInt(popNow(s, market.day)) + ' people' + party + '</div>' + name + '</div>' +
    '<button type="button" class="x locate" data-nav="fly" data-v="' + esc(s.id) + '" aria-label="Show on map" title="Show on map"><svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>' +
    '<div class="ptabs" role="tablist" aria-label="' + esc(s.name) + '">' + tabs.map(([k, l]) => '<button type="button" role="tab" data-ptab="' + k + '" data-v="' + esc(s.id) + '" aria-pressed="' + (c.tab === k) + '">' + l + '</button>').join('') + '</div></div>';
}

// ---------------------------------------------------------------- World: the realms and what spans the whole world
function homeHtml() {
  const day = market.day;
  let pop = 0;
  for (const s of SET) pop += s.pop;
  let h = '<section><p class="meta">' + fmtInt(SET.length) + ' settlements and about ' + fmtInt(pop) + ' people in ' + REALMS.length + ' realm' + (REALMS.length === 1 ? '' : 's') + '. Pick a realm, then a place, or tap the map.</p></section>';
  h += todayHtml();
  const wars = activeOn(day).filter((e) => e.type === 'war');
  h += '<section><div class="navgroup"><h3>Realms</h3><small>' + REALMS.length + '</small></div><ul class="navlist">' + REALMS.map((R) => {
    const st = realmStats(R), atWar = wars.some((e) => REALMS[e.ai] === R || REALMS[e.bi] === R);
    return '<li><button type="button" data-nav="realm" data-v="' + esc(R.cap.id) + '"><i class="sw" style="background:hsl(' + realmHue(R) + ' 45% 52%)"></i><span><b>' + esc(R.name) + '</b><small>Capital ' + esc(R.cap.name) + ' · ' + st.n + ' places' + (atWar ? ' · at war' : '') + '</small></span><span class="num">' + fmtInt(st.pop) + '</span><span class="chev" aria-hidden="true">›</span></button></li>';
  }).join('') + '</ul></section>';
  const tile = (go, v, b, sm) => '<button type="button" data-nav="' + go + '"' + (v ? ' data-v="' + v + '"' : '') + '><b>' + b + '</b><small>' + sm + '</small></button>';
  h += '<section><h3>Across the world</h3><div class="tiles2">' +
    tile('sect', 'markets', 'Markets', 'Prices everywhere, trade routes and what is moving them') +
    tile('sect', 'events', 'Events', 'Wars, plague, famine, festivals and booms') +
    tile('sect', 'tracked', 'Tracked people', 'Everyone the party has dealt with') +
    tile('sect', 'heroes', 'Heroes', 'Your party, characters and the chronicle') +
    (isPlayer() ? '' : tile('sect', 'monsters', 'Monsters', 'Creatures in the wild, lairs and the Bestiary')) +
    tile('sect', 'party', 'The party', gst().party.at && SBY.get(gst().party.at) ? 'In ' + esc(SBY.get(gst().party.at).name) : 'Not placed on the map yet') +
    '</div></section>';
  return h;
}
// every realm's places, worked out in one pass and kept until the world changes
let rstat = null, rstatKey = '';
function realmStats(R) {
  const key = mkVer + '|' + SET.length + '|' + REALMS.length;
  if (!rstat || rstatKey !== key) {
    rstat = new Map(REALMS.map((r) => [r, { list: [], n: 0, pop: 0 }]));
    for (const s of SET) { const r = realmOfS(s), o = r && rstat.get(r); if (o) { o.list.push(s); o.n++; o.pop += s.pop; } }
    rstatKey = key;
  }
  return rstat.get(R) || { list: [], n: 0, pop: 0 };
}

// ---------------------------------------------------------------- a realm: its places by size
function placeRow(s) {
  const party = gst().party.at === s.id;
  return '<li><button type="button" data-nav="place" data-v="' + esc(s.id) + '"><i class="sw" style="background:' + (s.tier >= 4 ? 'var(--brass)' : s.tier === 3 ? '#cfc8b6' : s.tier === 2 ? '#99a0a8' : '#5d666f') + '"></i><span><b>' + esc(s.name) + '</b><small>' + esc(sizeWord(s)) + (s.coastal ? ' · coast' : '') + (party ? ' · <span class="here">party here</span>' : '') + '</small></span><span class="num">' + fmtInt(s.pop) + '</span><span class="chev" aria-hidden="true">›</span></button></li>';
}
function realmHtml(R) {
  const st = realmStats(R), q = navQ.trim().toLowerCase();
  const wars = activeOn(market.day).filter((e) => e.type === 'war' && (REALMS[e.ai] === R || REALMS[e.bi] === R));
  let h = '<section><p class="meta">Capital ' + tLink(R.cap) + ' · ' + st.n + ' places · ' + fmtInt(st.pop) + ' people' + (wars.length ? ' · ' + wars.map((e) => eLink(e)).join(', ') : '') + '</p>' +
    '<div class="navtools"><input id="nav-q" type="search" placeholder="Find a place in ' + esc(R.name) + '" value="' + esc(navQ) + '" aria-label="Find a place in this realm" autocomplete="off"><select id="nav-size" aria-label="Size"><option value="all">All sizes</option>' + [[4, 'Capital'], [3, 'Cities'], [2, 'Towns'], [1, 'Villages']].map(([t, l]) => '<option value="' + t + '"' + (String(navSize) === String(t) ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></div></section>';
  h += '<div id="navList">' + realmListHtml(R, st, q) + '</div>';
  return h;
}
function realmListHtml(R, st, q) {
  const groups = [[4, 'Capital'], [3, 'Cities'], [2, 'Towns'], [1, 'Villages and hamlets']];
  let h = '', any = false;
  for (const [t, label] of groups) {
    if (navSize !== 'all' && +navSize !== t) continue;
    const list = st.list.filter((s) => s.tier === t && (!q || s.name.toLowerCase().includes(q))).sort((a, b) => b.pop - a.pop);
    if (!list.length) continue;
    any = true;
    const max = navMore[R.cap.id + t] ? list.length : 40;
    h += '<section><div class="navgroup"><h3>' + label + '</h3><small>' + list.length + '</small></div><ul class="navlist">' + list.slice(0, max).map(placeRow).join('') + '</ul>' +
      (list.length > max ? '<div class="actions"><button type="button" class="btn sm" data-nav="more" data-v="' + esc(R.cap.id + t) + '">Show all ' + list.length + '</button></div>' : '') + '</section>';
  }
  return any ? h : '<p class="meta">No place matches.</p>';
}

// ---------------------------------------------------------------- wrapping every panel in the shell
// a short line for screen readers whenever the page changes (the panel itself is not a live region, so it is never read out whole)
let lastTitle = '', navFocus = false;
function sideTitle(c) {
  if (c.kind === 'home') return (WORLD_NAME || 'World') + ': realms';
  if (c.kind === 'realm') return c.R.name + ': places';
  if (c.kind === 'section') return c.name;
  const tab = { overview: 'Overview', market: 'Market', people: 'People', guilds: 'Guilds' }[c.tab];
  const npc = c.tab === 'people' && people.npc ? npcById(people.npc) : null;
  return (npc ? npcName(npc) + ', ' : '') + c.s.name + ', ' + tab;
}
function afterShell() {
  const c = sideCtx(), t = sideTitle(c);
  if (c.kind === 'place') noteRecent(c.tab === 'people' && people.npc ? 'p:' + people.npc : c.s.id);
  if (t !== lastTitle) {
    lastTitle = t; const a = $('srAnnounce'); if (a) a.textContent = t;
    // v26: on a phone the whole atlas scrolls, so a new page starts at its own header, with the world's search and calendar just above
    const side = $('side'), box = $('inspector');
    if (side && box && matchMedia('(max-width: 860px)').matches && !matchMedia('(orientation: landscape) and (max-height: 520px)').matches) side.scrollTop = c.kind === 'home' ? 0 : box.offsetTop;
  }
  if (navFocus) {
    navFocus = false;
    const f = document.querySelector('#inspector .side-head h2') || document.querySelector('#inspector .crumbs b');
    if (f) { if (!f.matches('input')) f.setAttribute('tabindex', '-1'); try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } }
  }
}
function shellWrap(html) {
  const c = sideCtx(), el = $('inspector');
  setTimeout(afterShell, 0);
  el.classList.toggle('in-place', c.kind === 'place');
  $('app').classList.toggle('side-wide', tool === 'heroes');
  if (c.kind === 'home') html = homeHtml();
  else if (c.kind === 'realm') html = realmHtml(c.R);
  if (c.kind === 'place') navR = (realmOfS(c.s) || {}).cap ? realmOfS(c.s).cap.id : navR;
  for (const b of document.querySelectorAll('#side .tool.sec')) b.setAttribute('aria-pressed', String(b.dataset.tool === 'explore' ? (tool === 'explore' && !(sel && sel.kind !== 'settle')) || (c.kind === 'place') : b.dataset.tool === tool));
  return sideHead(c) + '<div class="side-body">' + (html || '') + '</div>';
}
function openPlace(sid, tab, fly) {
  const s = SBY.get(sid);
  if (!s) return;
  const R = realmOfS(s);
  if (R) navR = R.cap.id;
  closePopovers();
  sel = { kind: 'settle', id: sid };
  if (tab === 'market') { market.sid = sid; setTool('market', true); if (market.tab === 'overview') market.tab = 'town'; }
  else if (tab === 'people') { people.sid = sid; people.npc = null; people.place = null; if (people.tab === 'tracked') people.tab = 'residents'; setTool('people', true); }
  else if (tab === 'guilds') { market.sid = sid; people.sid = sid; guildUI.q = null; guildUI.org = null; setTool('guilds', true); }
  else setTool('explore', true);
  renderPanel();
  const box = $('inspector'); if (box) box.scrollTop = 0;
  if (fly) { flyVis(s.x, s.y, view.s >= TOWN_ZOOM[s.tier] ? view.s : TOWN_ZOOM[s.tier]); pulseTown(s.id); }
}
function goHome() { navR = null; navQ = ''; sel = null; setTool('explore'); }
function goRealmPage(capId) {
  navR = capId; navQ = '';
  sel = null; setTool('explore');
  const R = REALMS.find((r) => r.cap.id === capId);
  if (R) flyVis(R.cx, R.cy, Math.max(minS, 0.9));
  const box = $('inspector'); if (box) box.scrollTop = 0;
}
$('inspector').addEventListener('click', (e) => {
  const t = e.target.closest('[data-nav],[data-ptab]');
  if (!t) return;
  if (t.dataset.nav !== 'fly' && t.dataset.nav !== 'more') navFocus = true;
  if (t.dataset.ptab) { openPlace(t.dataset.v, t.dataset.ptab, false); return; }
  const go = t.dataset.nav, v = t.dataset.v;
  if (go === 'home') goHome();
  else if (go === 'realm') goRealmPage(v);
  else if (go === 'place') { if (tool === 'people' && people.sid === v && (people.npc || people.place)) { people.npc = null; people.place = null; renderPanel(); } else openPlace(v, 'overview', true); }
  else if (go === 'fly') { const s = SBY.get(v); if (s) { flyVis(s.x, s.y, view.s >= TOWN_ZOOM[s.tier] ? view.s : TOWN_ZOOM[s.tier]); pulseTown(s.id); } }
  else if (go === 'done') { setTool('explore'); }
  else if (go === 'gl') {
    const [sid, tab, sub] = v.split('|');
    if (tab === 'market') market.tab = sub;
    else if (tab === 'guilds') guildUI.tab = sub;
    else if (tab === 'people') people.tab = sub;
    openPlace(sid, tab, false);
    if (tab === 'market' && market.tab !== sub) { market.tab = sub; renderPanel(); }
  }
  else if (go === 'person') { const p = npcById(v); if (p && SBY.get(p.sid)) { openPlace(p.sid, 'people', false); people.npc = p.id; renderPanel(); if (typeof flyToPerson === 'function') flyToPerson(p); } }
  else if (go === 'more') { navMore[v] = true; renderPanel(); }
  else if (go === 'sect') {
    sel = null;
    if (v === 'markets') { setTool('market'); market.tab = 'overview'; market.sid = null; renderPanel(); }
    else if (v === 'events') { setTool('market'); market.sid = null; market.tab = 'events'; renderPanel(); }
    else if (v === 'tracked') { setTool('people'); people.tab = 'tracked'; people.npc = null; renderPanel(); }
    else if (v === 'heroes') setTool('heroes');
    else if (v === 'monsters') setTool('monsters');
    else if (v === 'party') { const at = gst().party.at; if (at && SBY.get(at)) openPlace(at, 'overview', true); else { setTool('heroes'); heroes.step = 'chron'; renderPanel(); } }
  }
});
$('inspector').addEventListener('input', (e) => {
  if (e.target.id !== 'nav-q') return;
  navQ = e.target.value.slice(0, 40);
  const c = sideCtx(), L = $('navList');
  if (c.kind === 'realm' && L) L.innerHTML = realmListHtml(c.R, realmStats(c.R), navQ.trim().toLowerCase());
});
$('inspector').addEventListener('change', (e) => {
  if (e.target.id !== 'nav-size') return;
  navSize = e.target.value; renderPanel();
});

try { document.documentElement.lang = document.documentElement.lang || 'en'; } catch (e) { /* ignore */ }
{ const hv = $('helpVer'); if (hv) hv.textContent = 'Realmwright Atlas v' + APP_VERSION + ' · world generator ' + GEN_VERSION + '.'; }
// ---------------------------------------------------------------- hiding the side panel, and the phone's map/list handle
function setSide(on) {
  $('app').classList.toggle('side-off', !on);
  $('btnSideOpen').hidden = on;
  try { localStorage.setItem('atlas-side', on ? '1' : '0'); } catch (e) { /* only a convenience */ }
}
$('btnSide').addEventListener('click', () => setSide(false));
$('btnSideOpen').addEventListener('click', () => setSide(true));
try { if (localStorage.getItem('atlas-side') === '0' && innerWidth > 860) setSide(false); } catch (e) { /* ignore */ }
$('btnSheet').addEventListener('click', () => {
  const a = $('app'), st = a.classList.contains('sheet-map') ? 'sheet-list' : a.classList.contains('sheet-list') ? '' : 'sheet-map';
  a.classList.remove('sheet-map', 'sheet-list');
  if (st) a.classList.add(st);
});

// v26: while you read down a long page, the search and section row fold away; scrolling back to the top brings them back
{
  const box = $('inspector'), side = $('side');
  let folded = false;
  if (box && side) box.addEventListener('scroll', () => {
    const t = box.scrollTop;
    if (!folded && t > 48) { folded = true; side.classList.add('scrolled'); }
    else if (folded && t < 6) { folded = false; side.classList.remove('scrolled'); }
  }, { passive: true });
}

// ---------------------------------------------------------------- v26: what a DM needs first, without hunting through tabs
// A place's "At a glance": the market, the danger, the quest board and the people, each one tap from the tab that holds it,
// then what is happening there today and who is in charge.
function glanceHtml(s) {
  const day = market.day, sid = esc(s.id);
  const idx = basketIndex(s, day), iw = idx < 0.93 ? ['cheap', 'ok'] : idx > 1.35 ? ['very dear', 'bad'] : idx > 1.1 ? ['dear', 'warn'] : ['normal', ''];
  const hall = hallFor(s), open = hall ? questsFor(hall, day).filter((q) => questState(q, day) === 'open').length : 0;
  const tile = (tab, sub, k, b, sm, cls) => '<button type="button" class="gl-t ' + (cls || '') + '" data-nav="gl" data-v="' + sid + '|' + tab + '|' + sub + '"><span>' + k + '</span><b>' + b + '</b><small>' + sm + '</small></button>';
  let t = tile('market', 'town', 'Market', Math.round(idx * 100) + '%', iw[0], iw[1]);
  if (!isPlayer()) { const th = threatOf(s, day), wk = threatOf(s, day - 7), tw = threatWord(th); t += tile('market', 'bounties', 'Danger', tw[0], th > wk + 0.05 ? 'rising' : th < wk - 0.05 ? 'falling' : 'steady', tw[1]); }
  t += tile('guilds', 'board', 'Quests', open ? String(open) : 'None', hall ? (hall === s ? 'posted here' : 'in ' + esc(hall.name)) : 'no guild near', '');
  t += tile('people', 'residents', 'People', fmtInt(popNow(s, day)), sizeWord(s).toLowerCase(), '');
  let h = '<section class="glance" aria-label="At a glance"><h3>At a glance</h3><div class="gl-tiles">' + t + '</div>';
  const mods = modsFor(s, day);
  if (mods.length) h += '<ul class="evlist compact">' + mods.slice().sort((a, b) => b[1] - a[1]).slice(0, 3).map(([, , e]) => evRow(e, day)).join('') + '</ul>';
  else h += '<p class="meta gl-calm">A quiet day: nothing out of the ordinary is moving prices.</p>';
  // who is in charge, and anyone the party cares about who lives here
  const lead = townPeople(s, Math.min(2, LEADERS[s.tier].length)).list.map(withOv).filter((p) => !/dead/i.test(p.status || ''));
  const R = hall === s ? roster(s) : null, gm = R ? withOv(R.list[0]) : null;
  const who = lead.map((p) => pLink(p) + ' <small>' + esc(p.job) + '</small>').concat(gm ? [pLink(gm) + ' <small>Guildmaster</small>'] : []);
  if (who.length) h += '<p class="gl-who"><span class="lab">In charge</span> ' + who.join(' · ') + '</p>';
  const tr = Object.keys(edits.npc || {}).filter((id) => edits.npc[id].tracked).map(npcById).filter((p) => p && p.sid === s.id);
  if (tr.length) h += '<p class="gl-who"><span class="lab">Tracked here</span> ' + tr.slice(0, 6).map((p) => pLink(withOv(p))).join(' · ') + (tr.length > 6 ? ' and ' + (tr.length - 6) + ' more' : '') + '</p>';
  if (gst().party.at === s.id) h += '<p class="gl-who"><span class="pill on">The party is here</span></p>';
  if (s.notes && !isPlayer()) h += '<p class="gl-note"><span class="lab">Your notes</span> ' + esc(s.notes.length > 180 ? s.notes.slice(0, 180) + '…' : s.notes) + '</p>';
  return h + '</section>';
}
// the World page's "Today": what is happening, where the party is, and the places you opened lately
let recentSeen = [];
try { const r = JSON.parse(localStorage.getItem('atlas-recent') || '[]'); if (Array.isArray(r)) recentSeen = r.filter((x) => typeof x === 'string').slice(0, 8); } catch (e) { /* a private window: start empty */ }
function noteRecent(key) {
  if (!key || recentSeen[0] === key) return;
  recentSeen = [key].concat(recentSeen.filter((k) => k !== key)).slice(0, 8);
  try { localStorage.setItem('atlas-recent', JSON.stringify(recentSeen)); } catch (e) { /* not essential */ }
}
function todayHtml() {
  const day = market.day;
  const ev = sortEvents(activeOn(day));
  let h = '<section class="today"><div class="navgroup"><h3>Today</h3><small>' + dateText(day) + '</small></div>';
  h += ev.length ? '<ul class="evlist compact">' + ev.slice(0, 3).map((e) => evRow(e, day)).join('') + '</ul>' + (ev.length > 3 ? '<button type="button" class="link sm" data-nav="sect" data-v="events">All ' + ev.length + ' events</button>' : '') : '<p class="meta">The world is quiet today.</p>';
  const P = gst().party, at = P.at && SBY.get(P.at);
  const tr = Object.keys(edits.npc || {}).filter((id) => edits.npc[id].tracked).length;
  const chips = [];
  if (at) chips.push('<button type="button" class="chip" data-nav="place" data-v="' + esc(at.id) + '">Party in ' + esc(at.name) + '</button>');
  if (tr) chips.push('<button type="button" class="chip" data-nav="sect" data-v="tracked">' + tr + ' tracked ' + (tr === 1 ? 'person' : 'people') + '</button>');
  for (const k of recentSeen) {
    if (chips.length >= 8) break;
    if (k.startsWith('p:')) { const p = npcById(k.slice(2)); if (p && SBY.get(p.sid)) chips.push('<button type="button" class="chip" data-nav="person" data-v="' + esc(p.id) + '">' + esc(npcName(withOv(p))) + '</button>'); }
    else { const s = SBY.get(k); if (s && !(at && at.id === s.id)) chips.push('<button type="button" class="chip" data-nav="place" data-v="' + esc(s.id) + '">' + esc(s.name) + '</button>'); }
  }
  if (chips.length) h += '<div class="gl-recent"><span class="lab">Jump back to</span><div class="chips">' + chips.join('') + '</div></div>';
  return h + '</section>';
}
