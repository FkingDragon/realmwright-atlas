
// ================================================================ edits as entities, and the live shared world (v21)
// The world's edits are split into small entities (one settlement override, one person's notes, one road, one quest,
// one paint stroke...). Undo and redo change only the entities that step touched, and the shared world sends only the
// entities that changed, so two DMs can work at once without overwriting each other's work.
const ESPEC = [
  ['ov', 'map'], ['del', 'map'], ['rdel', 'map'], ['rov', 'map'], ['evOff', 'map'], ['npc', 'map'], ['npcMore', 'map'], ['npcSnap', 'map'],
  ['monOff', 'map'], ['setSnap', 'map'], ['roadSnap', 'map'], ['bm', 'map'],
  ['add', 'list'], ['radd', 'list'], ['labels', 'list'], ['events', 'list'], ['npcRel', 'list'], ['npcAdd', 'list'], ['monAdd', 'list'], ['strokes', 'list'],
  ['guild.q', 'map'], ['guild.rep', 'map'], ['guild.shift', 'map'], ['guild.ag', 'map'], ['guild.custom', 'list'], ['guild.party.members', 'list'], ['guild.party.log', 'list']
];
const ESPEC_BY = new Map(ESPEC);
const ROOTS = new Set(ESPEC.map(([p]) => p.split('.')[0]));
const LOCAL_ONLY = new Set(['next']);
const ehash = (str) => (hashStr(str) >>> 0).toString(36);
const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
function ensurePath(o, p, list) {
  const ks = p.split('.'); let a = o;
  for (let i = 0; i < ks.length - 1; i++) { if (a[ks[i]] == null || typeof a[ks[i]] !== 'object') a[ks[i]] = {}; a = a[ks[i]]; }
  const last = ks[ks.length - 1];
  if (a[last] == null || typeof a[last] !== 'object') a[last] = list ? [] : {};
  return a[last];
}
// the key of a list item: its id, or for items without one (paint strokes, log lines) a hash of its content
function itemKey(sec, it, seen) {
  if (it && it.id != null) return String(it.id);
  let k = (sec === 'strokes' ? 'st_' : 'h_') + ehash(JSON.stringify(it));
  while (seen.has(k)) k += '+';
  return k;
}
// edits -> Map(key -> JSON text); key = section + '|' + item key ('v|...' for single values)
function flattenEdits(e) {
  const out = new Map();
  for (const [sec, kind] of ESPEC) {
    const o = getPath(e, sec);
    if (!o) continue;
    if (kind === 'map') { for (const k in o) if (o[k] !== undefined) out.set(sec + '|' + k, JSON.stringify(o[k])); }
    else { const seen = new Set(); for (const it of o) { const k = itemKey(sec, it, seen); seen.add(k); out.set(sec + '|' + k, JSON.stringify(it)); } }
  }
  // everything else is a single value: top-level fields, guild fields, party fields
  for (const k in e) if (!ROOTS.has(k) && !LOCAL_ONLY.has(k) && e[k] !== undefined) out.set('v|' + k, JSON.stringify(e[k]));
  const G = e.guild || {};
  for (const k in G) if (!ESPEC_BY.has('guild.' + k) && k !== 'party' && G[k] !== undefined) out.set('v|guild.' + k, JSON.stringify(G[k]));
  const P = G.party || {};
  for (const k in P) if (!ESPEC_BY.has('guild.party.' + k) && P[k] !== undefined) out.set('v|guild.party.' + k, JSON.stringify(P[k]));
  return out;
}
const splitKey = (key) => { const i = key.indexOf('|'); return [key.slice(0, i), key.slice(i + 1)]; };
// set (or with value undefined, remove) one entity in an edits object
function setEntity(e, key, value) {
  const [sec, k] = splitKey(key);
  if (sec === 'v') {
    const ks = k.split('.'), last = ks.pop();
    let a = e; for (const x of ks) { if (a[x] == null || typeof a[x] !== 'object') a[x] = {}; a = a[x]; }
    if (value === undefined) delete a[last]; else a[last] = value;
    return;
  }
  const kind = ESPEC_BY.get(sec);
  if (!kind) return;
  if (kind === 'map') { const o = ensurePath(e, sec, false); if (value === undefined) delete o[k]; else o[k] = value; return; }
  const arr = ensurePath(e, sec, true), seen = new Set();
  let idx = -1;
  for (let i = 0; i < arr.length; i++) { const ik = itemKey(sec, arr[i], seen); seen.add(ik); if (ik === k) { idx = i; break; } }
  if (value === undefined) { if (idx >= 0) arr.splice(idx, 1); }
  else if (idx >= 0) arr[idx] = value;
  else arr.push(value);
}
function edgesFromEntities(map) {
  const e = blankEdits();
  for (const [key, json] of map) setEntity(e, key, JSON.parse(json));
  return e;
}
// apply to the live edits only the entities that differ between two versions (undo: after -> before)
function patchEdits(fromE, toE) {
  const A = flattenEdits(fromE), B = flattenEdits(toE), keys = [];
  for (const [k, v] of B) if (A.get(k) !== v) { setEntity(edits, k, JSON.parse(v)); keys.push(k); }
  for (const k of A.keys()) if (!B.has(k)) { setEntity(edits, k, undefined); keys.push(k); }
  return keys;
}

// ---------------------------------------------------------------- the live shared world (claude.ai shared page only)
// Who is who comes from how the page is shared: the owner and Editors are DMs; Contributors and Viewers are players.
// World data sits under 'w/' (everyone reads), the DM's private notes and secrets under 'dm/' (only DMs can read),
// the calendar and seed in 'world/meta', and each person's heroes in 'heroes/<their id>'.
const share = { localT: new Map(), pathKey: new Map(), unsent: new Map(), offline: typeof navigator !== 'undefined' && navigator.onLine === false, db: null, user: null, room: null, uid: null, admin: false, owner: false, canWrite: false, meta: null, on: false, ready: false, synced: new Map(), pub: new Map(), dmd: new Map(), pending: new Map(), inflight: new Set(), unsub: [], party: new Map(), peers: [], names: {}, err: '', busy: 0, sent: 0, adopting: false, loaded: { w: false, dm: false } };
const DM_FIELDS = { npc: ['notes', 'disp'], ov: ['notes'], add: ['notes'] };
const DM_ONLY = (sec, v) => sec === 'monAdd' || sec === 'monOff' || (sec === 'npcRel' && v && SECRET_REL.has(v.type)) || (sec === 'v' && false);
const docId = (key) => key.replace(/[^A-Za-z0-9_.-]/g, (c) => '~' + c.charCodeAt(0).toString(16).padStart(2, '0')).slice(0, 190) + (key.length > 120 ? '-' + ehash(key) : '');
function partsOf(key, v) {
  const [sec] = splitKey(key);
  if (key === 'v|dmLock') return { pub: undefined, dm: v };
  if (DM_ONLY(sec, v)) return { pub: undefined, dm: v };
  const f = DM_FIELDS[sec];
  if (!f || !v || typeof v !== 'object' || Array.isArray(v)) return { pub: v, dm: undefined };
  const pub = Object.assign({}, v), dm = {};
  for (const x of f) if (pub[x] !== undefined) { dm[x] = pub[x]; delete pub[x]; }
  return { pub, dm: Object.keys(dm).length ? dm : undefined };
}
function mergedValue(key) {
  const id = docId(key), p = share.pub.get(id), d = share.dmd.get(id);
  if (p === undefined && d === undefined) return undefined;
  if (p === undefined) return d.v;
  if (d === undefined) return p.v;
  if (p.v && typeof p.v === 'object' && !Array.isArray(p.v) && d.v && typeof d.v === 'object') return Object.assign({}, p.v, d.v);
  return d.v;
}
async function shareBoot() {
  try {
    if (!window.claude || typeof window.claude.use !== 'function') return;
    const db = await window.claude.use('db');
    if (!db) return;
    const user = await window.claude.use('user');
    share.db = db; share.user = user;
    share.uid = user ? await user.id() : null;
    share.owner = user ? await user.isOwner() : false;
    share.admin = user ? await user.canEdit() : false;
    const cw = user ? await user.can('data.write') : null;
    share.canWrite = share.admin && cw !== false;
    campaign.admin = share.admin;
    db.doc('world/meta').onSnapshot((snap) => metaChanged(snap.exists ? snap.data() : null), (e) => shareFail(e));
    if (share.uid) db.collection('heroes').onSnapshot((qs) => partyChanged(qs), () => {});
    window.claude.use('room').then((room) => { if (!room) return; share.room = room; room.presence({ role: share.admin ? 'dm' : 'player' }).catch(() => {}); room.onPeers((c) => { share.peers = c.peers.filter((p) => !p.isMe); peopleNames(); shareStatus(); }); }).catch(() => {});
    shareStatus();
  } catch (e) { console.error(e); }
}
function shareFail(e) {
  share.err = e && e.code === 'revoked' ? 'Your access to this shared page changed.' : 'The live connection stopped. Reload the page to reconnect.';
  shareStatus();
}
// the calendar, the seed and whether sharing is on all live in one small document
function metaChanged(m) {
  const was = share.meta;
  share.meta = m;
  if (!m) {
    if (share.on) { stopListening(); share.on = false; campaign.shared = false; applyMode(); toast('The DM stopped sharing this world. You keep a copy in your browser.'); }
    shareStatus(); return;
  }
  if (!share.on) { startListening(m); return; }
  if (was && (m.seed !== SEED || m.cid !== campaign.cid)) { adoptWorld(m); return; }
  if (typeof m.day === 'number' && m.day !== market.day && !(share.admin && market.playing)) { market.day = m.day; shareDaySent = m.day; refreshMarket(); }
  shareStatus();
}
function startListening(m) {
  share.on = true; campaign.shared = true;
  if (!share.admin) { campaign.mode = 'player'; }
  share.loaded = { w: false, dm: !share.admin };
  share.unsub.push(share.db.collection('w').onSnapshot((qs) => docsChanged('w', qs), (e) => shareFail(e)));
  if (share.admin) share.unsub.push(share.db.collection('dm').onSnapshot((qs) => docsChanged('dm', qs), (e) => shareFail(e)));
  applyMode(); shareStatus();
}
function stopListening() { for (const u of share.unsub) { try { u(); } catch (e) { /* ignore */ } } share.unsub = []; share.ready = false; share.pub.clear(); share.dmd.clear(); share.synced.clear(); share.pending.clear(); }
function docsChanged(which, qs) {
  const M = which === 'w' ? share.pub : share.dmd, touched = new Set();
  for (const ch of qs.docChanges()) {
    const id = ch.doc.id;
    if (ch.type === 'removed') {
      const old = M.get(id); M.delete(id);
      if (old) {
        touched.add(old.k);
        // the feed remembers removals seen this session (the document itself is gone)
        if (share.ready && !(which === 'w' ? share.dmd : share.pub).has(id) && !FEED_SKIP.has(splitKey(old.k)[0])) {
          const txt = describeKey(old.k, old.v);
          // who removed it is not recorded on the server; this device knows when it was its own removal
          const mine = share.myDel && share.myDel.get(old.k) > Date.now() - 60000;
          if (txt) { (share.gone = share.gone || []).push({ t: Date.now(), by: mine ? share.uid : '', txt: 'Removed or undid: ' + txt }); if (share.gone.length > 40) share.gone.shift(); }
        }
      }
    }
    else {
      const d = ch.doc.data(); if (!d || typeof d.k !== 'string') continue;
      M.set(id, { k: d.k, v: d.v, t: +d.t || 0, by: typeof d.by === 'string' ? d.by : '' }); touched.add(d.k);
      const lt = share.localT.get(d.k);
      if (share.ready && d.by && d.by !== share.uid && lt && (+d.t || 0) > lt && Date.now() - lt < 120000) (share.clash = share.clash || new Map()).set(d.k, d.by);
    }
  }
  if (share.clash && share.clash.size) {
    const [[k, by]] = share.clash, txt = describeKey(k, mergedValue(k));
    const who = share.names[by] || 'Another DM';
    toast(who + ' changed the same thing a moment after you' + (txt ? ' (' + txt.replace(/<[^>]+>/g, '') + ')' : '') + '. Their change is the one kept.');
    share.clash.clear();
  }
  if (!share.ready) {
    share.loaded[which] = true;
    if (share.loaded.w && share.loaded.dm) firstLoad();
    return;
  }
  applyRemote(touched);
  peopleNames();
}
// joining: the shared world replaces what this browser had (which is kept as a snapshot first)
async function firstLoad() {
  const m = share.meta;
  share.ready = true;
  // keep a snapshot of this browser's copy if it differs from the table's
  const R = flattenEdits(remoteEdits()), L = flattenEdits(edits);
  let differs = m.seed !== SEED || R.size !== L.size;
  if (!differs) for (const [k, v] of L) if (R.get(k) !== v) { differs = true; break; }
  if (differs && SET.length) await beforeReplace('Before joining the shared world');
  adoptWorld(m, true);
}
function remoteEdits() {
  const map = new Map();
  for (const { k } of share.pub.values()) { const v = mergedValue(k); if (v !== undefined) map.set(k, JSON.stringify(v)); }
  for (const { k } of share.dmd.values()) if (!map.has(k)) { const v = mergedValue(k); if (v !== undefined) map.set(k, JSON.stringify(v)); }
  const e = edgesFromEntities(map);
  e.next = Math.max(edits.next || 1, deviceBlock());
  return e;
}
function adoptWorld(m, first) {
  share.adopting = true;
  const e = remoteEdits();
  const keep = SEED === m.seed;
  campaign.cid = m.cid || campaign.cid; campaign.lastJson = '';
  if (typeof m.day === 'number') market.day = m.day;
  regenerate(m.seed, keep, e, null, () => {
    share.synced = flattenEdits(edits);
    share.adopting = false;
    if (!share.admin) campaign.mode = 'player';
    applyMode(); saveAll(true);
    if (first) toast(share.admin ? 'Connected: you are a DM of this shared world.' : 'Connected to your DM\'s world. It updates live.');
  });
}
// changes from the other people at the table
function applyRemote(keys) {
  if (share.adopting) return;
  const changed = [];
  for (const k of keys) {
    const v = mergedValue(k), j = v === undefined ? undefined : JSON.stringify(v);
    if (j === share.synced.get(k)) continue;
    if (share.pending.has(docId(k)) || share.inflight.has(docId(k))) continue;
    setEntity(edits, k, v);
    if (j === undefined) share.synced.delete(k); else share.synced.set(k, j);
    changed.push(k);
  }
  if (changed.length) afterRemote(changed);
}
function afterRemote(keys) {
  const secs = new Set(keys.map((k) => splitKey(k)[0]));
  geomCache.clear();
  applyEdits(); marketInvalidate(); peopleInvalidate();
  if (['radd', 'rov', 'rdel', 'add', 'del', 'ov', 'setSnap', 'roadSnap'].some((s) => secs.has(s))) roadsVer++;
  if (secs.has('strokes')) { strokesVer++; invalidateTiles(null, 0, 20); }
  if (['add', 'del', 'ov', 'setSnap'].some((s) => secs.has(s))) invalidateTiles(null, 0, 9);
  // battle map: a painted chunk repaints only itself; anything that moves towns or roads repaints what is cached
  if (['radd', 'rov', 'rdel', 'add', 'del', 'ov', 'setSnap', 'roadSnap', 'strokes'].some((s) => secs.has(s))) pxInvalidate(null);
  else for (const k of keys) { const [sec, id] = splitKey(k); if (sec === 'bm') pxInvalidate(bmBox(id)); }
  if (sel && !selObj()) sel = null;
  renderPanelSafe(); scheduleSave(); updateUndo(); requestRender();
}
// never redraw a panel under someone's typing; wait until they leave the field
let panelDeferred = false;
function renderPanelSafe() {
  const a = document.activeElement;
  if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT') && ($('inspector').contains(a) || ($('worldBody') && $('worldBody').contains(a)))) {
    if (!panelDeferred) { panelDeferred = true; a.addEventListener('blur', () => { panelDeferred = false; setTimeout(renderPanel, 0); }, { once: true }); }
    return;
  }
  renderPanel();
}
// my changes: compare with what the table last agreed and send only the difference
function syncPush() {
  if (!share.on || !share.ready || !share.canWrite || share.adopting) return;
  const cur = flattenEdits(edits);
  for (const [k, v] of cur) if (share.synced.get(k) !== v) { queueEntity(k, JSON.parse(v)); share.synced.set(k, v); }
  for (const k of [...share.synced.keys()]) if (!cur.has(k)) { queueEntity(k, undefined); share.synced.delete(k); }
  pumpWrites();
}
function queueEntity(key, v) {
  const id = docId(key), { pub, dm } = v === undefined ? {} : partsOf(key, v), t = Date.now();
  if (v === undefined) (share.myDel = share.myDel || new Map()).set(key, t);
  share.localT.set(key, t);
  share.pathKey.set('w/' + id, key); share.pathKey.set('dm/' + id, key);
  if (pub !== undefined) share.pending.set('w/' + id, { k: key, v: pub, t, by: share.uid || '' }); else if (share.pub.has(id)) share.pending.set('w/' + id, null);
  if (dm !== undefined) share.pending.set('dm/' + id, { k: key, v: dm, t, by: share.uid || '' }); else if (share.dmd.has(id)) share.pending.set('dm/' + id, null);
}
let pumping = 0, sendErrShown = false;
function pumpWrites() {
  if (share.offline) { shareStatus(); return; }
  while (pumping < 4 && share.pending.size) {
    const path = [...share.pending.keys()].find((p) => !share.inflight.has(p));
    if (!path) break;
    const body = share.pending.get(path); share.pending.delete(path);
    share.inflight.add(path); pumping++;
    const ref = share.db.doc(path);
    const key = share.pathKey.get(path);
    (body === null ? ref.delete() : ref.set(body)).then(() => { share.sent++; share.unsent.delete(path); }, (e) => {
      const c = e && e.code;
      if (c === 'resource_exhausted' || c === 'unavailable' || c === 'deadline_exceeded') { if (!share.pending.has(path)) share.pending.set(path, body); setTimeout(pumpWrites, 1500 + Math.random() * 1500); return; }
      // not sent: forget that it was, so the next sync (on reconnecting, every minute, or Retry) sends it again
      if (key) share.synced.delete(key);
      share.unsent.set(path, { k: key || '', why: c === 'quota_exceeded' ? 'full' : c === 'invalid_argument' ? 'big' : c === 'permission_denied' ? 'denied' : 'error' });
      if (!sendErrShown) { sendErrShown = true; toast(c === 'quota_exceeded' ? 'The shared world is full; some changes were not sent. Your browser still has them.' : c === 'invalid_argument' ? 'One change was too big to share (a very long paint stroke or note). It is kept in your browser.' : 'A change could not be shared. It is kept in your browser and will be tried again.'); }
    }).finally(() => { share.inflight.delete(path); pumping--; shareStatus(); pumpWrites(); });
  }
  shareStatus();
}
// coming back online, and a quiet check every minute, resend anything that did not get through
function shareResync() { if (!share.on || !share.ready || !share.canWrite) return; for (const [p, x] of share.unsent) if (x.why !== 'big' && x.k) share.synced.delete(x.k); syncPush(); }
window.addEventListener('offline', () => { share.offline = true; shareStatus(); });
window.addEventListener('online', () => { share.offline = false; sendErrShown = false; shareResync(); pumpWrites(); shareStatus(); });
setInterval(() => { if (!document.hidden && share.unsent.size) shareResync(); }, 60000);
// per-device id blocks, so two DMs creating places at the same moment never pick the same id
function deviceBlock() {
  let k = 0;
  try { k = +localStorage.getItem('rw-block') || 0; if (!k) { k = 1 + Math.floor(Math.random() * 899); localStorage.setItem('rw-block', String(k)); } } catch (e) { k = 1 + Math.floor(Math.random() * 899); }
  return k * 100000;
}
// the DM's calendar is everyone's calendar
let shareDaySent = -1;
setInterval(() => {
  if (!share.on || !share.ready || !share.canWrite || !share.meta) return;
  if (market.day !== shareDaySent && market.day !== share.meta.day) { shareDaySent = market.day; share.db.doc('world/meta').update({ day: market.day, t: Date.now() }).catch(() => { shareDaySent = -1; }); }
}, 2500);
// starting, replacing and stopping
async function shareStart() {
  if (!share.db || !share.canWrite) return;
  await saveAll(true);
  edits.next = Math.max(edits.next || 1, deviceBlock());
  const m = { seed: SEED, cid: campaign.cid, title: worldNameFor(SEED), day: market.day, gen: GEN_VERSION, by: share.uid || '', t: Date.now() };
  try { await share.db.doc('world/meta').set(m); } catch (e) { toast('Sharing could not start: ' + ((e && e.message) || 'unknown error')); return; }
  share.meta = m; share.on = true; campaign.shared = true; share.ready = true; share.loaded = { w: true, dm: true };
  share.unsub.push(share.db.collection('w').onSnapshot((qs) => docsChanged('w', qs), (e) => shareFail(e)));
  share.unsub.push(share.db.collection('dm').onSnapshot((qs) => docsChanged('dm', qs), (e) => shareFail(e)));
  share.synced = new Map();
  syncPush();
  toast('Your world is live. Share this page from its Share menu: Editors become co-DMs, Contributors and Viewers are players.');
  renderWorldPop(); shareStatus();
}
// a DM started a new world, loaded a file or restored a snapshot: everyone moves to it
function shareAfterRegenerate() {
  if (!share.on || !share.ready || !share.canWrite || share.adopting || !share.meta) return;
  if (share.meta.seed === SEED && share.meta.cid === campaign.cid) return;
  const m = Object.assign({}, share.meta, { seed: SEED, cid: campaign.cid, title: worldNameFor(SEED), day: market.day, t: Date.now(), by: share.uid || '' });
  share.meta = m;
  share.db.doc('world/meta').set(m).then(() => syncPush(), () => toast('The new world could not be shared.'));
}
async function shareStop() {
  if (!share.owner) return;
  const paths = [...share.pub.keys()].map((id) => 'w/' + id).concat([...share.dmd.keys()].map((id) => 'dm/' + id));
  stopListening();
  share.on = false; campaign.shared = false;
  await share.db.doc('world/meta').delete().catch(() => {});
  for (const p of paths) share.pending.set(p, null);
  share.ready = true; share.on = true; pumpWrites(); share.on = false;
  toast('Sharing stopped. The world stays in your browser.');
  renderWorldPop(); shareStatus();
}

// ---------------------------------------------------------------- heroes at the table
let heroPushT = 0;
function shareHeroesPush() {
  if (!share.db || !share.uid || !share.on) return;
  clearTimeout(heroPushT);
  heroPushT = setTimeout(() => {
    const body = { list: heroes.list.map((h) => JSON.parse(JSON.stringify(h))), t: Date.now() };
    if (JSON.stringify(body.list).length > 240000) return;
    share.db.doc('heroes/' + share.uid).set(body).catch(() => {});
  }, 1500);
}
function partyChanged(qs) {
  for (const ch of qs.docChanges()) {
    if (ch.type === 'removed') share.party.delete(ch.doc.id);
    else { const d = ch.doc.data(); if (d && Array.isArray(d.list)) share.party.set(ch.doc.id, d.list); }
  }
  peopleNames();
  if (tool === 'heroes') renderPanelSafe();
}
peopleNames.asked = new Set();
async function peopleNames() {
  if (!share.user || typeof share.user.profiles !== 'function') return;
  const authors = [];
  for (const M of [share.pub, share.dmd]) for (const d of M.values()) if (d.by) authors.push(d.by);
  const ids = [...new Set([...share.party.keys()].concat(share.peers.map((p) => p.by).filter(Boolean), authors))].filter((id) => !(id in share.names) && !peopleNames.asked.has(id));
  for (const id of ids) peopleNames.asked.add(id);
  if (!ids.length) return;
  try { const ps = await share.user.profiles(ids); for (const id of ids) share.names[id] = (ps[id] && ps[id].name) || ''; } catch (e) { /* names are optional */ }
  shareStatus();
}
// other people's heroes, as a compact table for the DM and the party
function partyHtml() {
  const rows = [];
  for (const [uid, list] of share.party) {
    if (uid === share.uid) continue;
    for (const h0 of list) {
      let h, D;
      try { h = fixHero(h0); D = derive(h); } catch (e) { continue; }
      const hp = h.hp == null ? D.hpMax : h.hp;
      rows.push('<li><span><b>' + esc(h.name || 'Unnamed hero') + '</b><small>' + esc(raceName(h)) + ' ' + esc(CLASSES5[h.cls].name) + ' ' + D.lv + (share.names[uid] ? ' · played by ' + esc(share.names[uid]) : '') + '</small></span><span class="pstat">HP <b>' + hp + '/' + D.hpMax + '</b></span><span class="pstat">AC <b>' + D.ac + '</b></span><span class="pstat">PP <b>' + D.passive + '</b></span>' + (h.conds && h.conds.length ? '<small class="pconds">' + esc(h.conds.join(', ')) + '</small>' : '') + '</li>');
    }
  }
  if (!share.on) return '';
  return '<section><h3>At the table</h3>' + (rows.length ? '<ul class="party-live">' + rows.join('') + '</ul><p class="meta">Live from each player\'s own hero sheet.</p>' : '<p class="meta">Heroes your players make on this shared page appear here with their hit points, AC and conditions, when their access lets them save (Contributor).</p>') + '</section>';
}

// ---------------------------------------------------------------- what the World menu and the status chip say
function shareMenuHtml() {
  if (!share.db) return '';
  let h = '<hr><div class="field"><span class="lab">Play together live</span>';
  if (!share.on) {
    if (share.canWrite) h += '<p class="meta">Share this world live with everyone who has this page. Invite your co-DM as an <b>Editor</b> from the page\'s Share menu, and your players as <b>Viewers</b> (or Contributors, if your plan offers it). Players see the world in player view, without your notes, secrets or monsters, and follow your calendar. Players whose access lets them save (Contributors) also share their heroes with you.</p><div class="actions"><button type="button" class="btn primary" data-w="sharestart">Share this world live</button></div>';
    else h += '<p class="meta">Your DM has not shared a world on this page yet. When they do, it appears here and updates live.</p>';
    return h + '</div>';
  }
  const n = share.pending.size + share.inflight.size;
  h += '<p class="meta save-ok"><b>Live.</b> ' + (share.admin ? 'Everyone with this page sees this world. Editors are DMs; Contributors and Viewers see player view.' : 'You are seeing your DM\'s world in player view. It updates as they work.') + (n ? ' Sending ' + n + ' change' + (n > 1 ? 's' : '') + '…' : '') + '</p>';
  const ppl = share.peers.map((p) => (share.names[p.by] || 'Someone') + ' (' + (p.presence && p.presence.role === 'dm' ? 'DM' : 'player') + ')');
  h += '<p class="meta">At the table now: ' + (ppl.length ? esc(ppl.join(', ')) + ' and you' : 'just you') + '.</p>';
  if (share.err) h += '<p class="meta save-bad">' + esc(share.err) + '</p>';
  if (share.offline) h += '<p class="meta save-bad"><b>Offline.</b> Your changes are kept and will be sent when the connection comes back.</p>';
  if (share.unsent.size) {
    const big = [...share.unsent.values()].filter((x) => x.why === 'big').length, full = [...share.unsent.values()].some((x) => x.why === 'full');
    h += '<p class="meta save-bad">' + share.unsent.size + ' change' + (share.unsent.size > 1 ? 's have' : ' has') + ' not reached the table yet' + (full ? ': the shared world is full' : '') + (big ? (full ? '; ' : ': ') + big + ' too big to share (split a long paint stroke or note)' : '') + '. They are safe in this browser.</p><div class="actions"><button type="button" class="btn" data-w="shareretry">Try again now</button></div>';
  }
  if (share.admin) h += '<p class="meta">Starting a new world, loading a file or restoring a snapshot changes the world for everyone. If two DMs change the same thing at once, the later change wins; everything else merges.</p>';
  if (share.owner) h += '<div class="actions"><button type="button" class="btn danger" data-w="sharestop">Stop sharing</button></div>';
  return h + '</div>';
}
function shareStatus() {
  let el = $('liveChip');
  if (!share.on) { if (el) el.hidden = true; return; }
  if (!el) { el = document.createElement('div'); el.id = 'liveChip'; el.className = 'live-chip'; el.setAttribute('role', 'status'); ($('frame') || document.body).appendChild(el); }
  const n = share.pending.size + share.inflight.size;
  const u = share.unsent.size;
  el.className = 'live-chip' + (share.err || share.offline ? ' bad' : n || u ? ' busy' : '');
  el.textContent = share.offline ? 'Offline · your changes will send when you reconnect' : share.err ? 'Live: disconnected' : (share.admin ? 'Live' : 'Live from your DM') + (share.peers.length ? ' · ' + (share.peers.length + 1) + ' here' : '') + (n ? ' · sending…' : u ? ' · ' + u + ' not sent' : '');
  el.hidden = false;
}
