
// ================================================================ safe saving, a library of worlds, and edits as separate entities (v21)
// Every world has its own campaign id (cid) and its own record in the browser database ('w:<cid>'); 'cur' names the
// one open now. Starting a new world, loading a file or restoring a snapshot never destroys another world: it stays
// in "Your worlds". A tab that falls behind another tab stops saving instead of overwriting newer work.
const newCid = () => 'c' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
const TAB_ID = 't' + Math.random().toString(36).slice(2, 9);
Object.assign(campaign, { cid: '', stale: false, recovered: '', persisted: null, lastJson: '' });

function buildSave() {
  return { v: 3, gen: GEN_VERSION, cid: campaign.cid, title: worldNameFor(SEED), seed: SEED, edits, layers, view: { x: view.x, y: view.y, s: view.s }, market: { day: market.day, speed: market.speed }, mode: campaign.mode, lastBackup: campaign.lastBackup, savedAt: Date.now() };
}
// how much work a world holds, for the worlds list
function editsSize(e) {
  let n = 0;
  for (const k in e || {}) { const v = e[k]; if (Array.isArray(v)) n += v.length; else if (v && typeof v === 'object' && k !== 'guild' && k !== 'npcSnap') n += Object.keys(v).length; }
  const G = (e && e.guild) || {}; n += Object.keys(G.q || {}).length + (G.custom || []).length + ((G.party && G.party.log) || []).length;
  return n;
}
let saveBusy = false, saveAgain = false;
// force: save even if nothing changed, or if another tab saved newer work (the person chose this tab's version)
async function saveAll(force) {
  if (!SET.length || !campaign.cid) return;
  if (saveBusy) { saveAgain = true; return; }
  if (campaign.stale && force !== 'mine') { saveBanner(); return; }
  saveBusy = true;
  try {
    ensureSnaps();
    if (typeof syncPush === 'function') syncPush();
    const S = buildSave(), body = JSON.stringify(Object.assign({}, S, { savedAt: 0 }));
    if (!force && body === campaign.lastJson) return;
    const json = JSON.stringify(S);
    let okLocal = false, okIdb = false, err = '';
    if (idb) {
      okIdb = await idbSet('w:' + campaign.cid, json);
      if (okIdb) { await idbSet('cur', campaign.cid); await indexWorld(S); }
    }
    // a second copy in local storage (just a pointer when the world is too big for it)
    const small = JSON.stringify({ v: 3, inIdb: true, cid: campaign.cid, seed: SEED, savedAt: S.savedAt, gen: GEN_VERSION, mode: campaign.mode });
    try { localStorage.setItem(STORE_KEY, okIdb && json.length > 1500000 ? small : json); okLocal = true; }
    catch (e) { err = e && e.name === 'QuotaExceededError' ? 'full' : 'blocked'; if (okIdb) { try { localStorage.setItem(STORE_KEY, small); } catch (e2) { /* the database copy is enough */ } } }
    const ok = okIdb || okLocal;
    campaign.saveOk = ok; campaign.saveErr = ok ? '' : err || 'blocked';
    if (ok) { campaign.savedAt = S.savedAt; campaign.lastJson = body; tabPost({ t: 'saved', cid: campaign.cid, at: S.savedAt }); if (force === 'mine') campaign.stale = false; }
    saveBanner();
    if (ok && idb) maybeSnapshot(json, S.savedAt, '');
  } finally {
    saveBusy = false;
    if (saveAgain) { saveAgain = false; setTimeout(() => saveAll(), 50); }
  }
}

// ---------------------------------------------------------------- the worlds list
async function readIndex() { const raw = await idbGet('libIndex'); try { const a = raw ? JSON.parse(raw) : []; return Array.isArray(a) ? a : []; } catch (e) { return []; } }
let indexKey = '';
async function indexWorld(S) {
  const entry = { cid: S.cid, title: S.title, seed: S.seed, savedAt: S.savedAt, n: editsSize(S.edits), gen: S.gen };
  const k = entry.cid + '|' + entry.title + '|' + entry.n + '|' + Math.floor(entry.savedAt / 600000);
  if (k === indexKey) return;
  const list = (await readIndex()).filter((x) => x.cid !== entry.cid);
  list.unshift(entry);
  if (await idbSet('libIndex', JSON.stringify(list))) indexKey = k;
}
async function forgetWorld(cid) {
  if (cid === campaign.cid) return false;
  await idbDel('w:' + cid);
  const list = (await readIndex()).filter((x) => x.cid !== cid);
  await idbSet('libIndex', JSON.stringify(list));
  for (const k of ((await idbKeys()) || []).filter((k) => String(k).startsWith('snap:' + cid + ':'))) await idbDel(k);
  return true;
}
// open a world from the library; the one open now stays saved in the list
async function openWorld(cid) {
  const raw = await idbGet('w:' + cid);
  let d = null; try { d = raw ? JSON.parse(raw) : null; } catch (e) { d = null; }
  if (!d || typeof d.seed !== 'number') { toast('That world could not be read. Try one of its snapshots.'); return false; }
  await saveAll(true);
  loadSaveObject(d);
  return true;
}
// put a save (from the library, a snapshot or a file) on screen
function loadSaveObject(d, after) {
  closePopovers();
  campaign.cid = d.cid || newCid(); campaign.lastJson = ''; campaign.stale = false;
  if (d.market && Number.isFinite(+d.market.day)) market.day = Math.max(0, Math.round(+d.market.day));
  else if (Number.isFinite(+d.day)) market.day = Math.max(0, Math.round(+d.day));
  campaign.mode = d.mode === 'player' ? 'player' : 'dm'; campaign.unlocked = false;
  if (typeof d.lastBackup === 'number') campaign.lastBackup = d.lastBackup;
  regenerate(d.seed, false, Object.assign(blankEdits(), d.edits || {}), d.view || null, () => { applyMode(); versionNotice(d.gen); saveAll(true); if (after) after(); });
  if (Array.isArray(d.heroes)) addHeroes(d.heroes);
}
function addHeroes(list) { let n = 0; for (const x of list) if (x && x.id && CLASSES5[x.cls] && raceOk(x.race) && !heroes.list.some((y) => y.id === x.id)) { heroes.list.push(fixHero(x)); n++; } if (n) heroSave(); return n; }
// before anything replaces what is on screen: save it, and keep a snapshot labelled with the reason
async function beforeReplace(why) {
  await saveAll(true);
  if (idb) await maybeSnapshot(JSON.stringify(buildSave()), Date.now(), why || 'Before a change');
}

// ---------------------------------------------------------------- snapshots: every half hour, and before every big change
let lastSnapAt = 0;
async function maybeSnapshot(json, at, why) {
  if (!why && at - lastSnapAt < 30 * 60 * 1000) return;
  if (!why) lastSnapAt = at;
  const S = JSON.parse(json);
  const rec = JSON.stringify({ save: S, heroes: heroes.list, why: why || '' });
  const key = 'snap:' + campaign.cid + ':' + at;
  await idbSet(key, rec);
  if (why) { const ix = await snapWhyIndex(); ix[key] = why; await idbSet('snapWhy', JSON.stringify(ix)); }
  const mine = ((await idbKeys()) || []).filter((k) => String(k).startsWith('snap:' + campaign.cid + ':')).sort((a, b) => +String(a).split(':')[2] - +String(b).split(':')[2]);
  for (const k of mine.slice(0, Math.max(0, mine.length - 16))) await idbDel(k);
}
async function snapWhyIndex() { try { return JSON.parse((await idbGet('snapWhy')) || '{}') || {}; } catch (e) { return {}; } }
// this world's snapshots (and any from before v21, which were not kept per world), newest first
async function listSnapshots() {
  const out = [];
  for (const k of (await idbKeys()) || []) {
    const p = String(k).split(':');
    if (p[0] !== 'snap') continue;
    if (p.length === 2) out.push({ key: k, at: +p[1], old: true });
    else if (p[1] === campaign.cid) out.push({ key: k, at: +p[2] });
  }
  return out.sort((a, b) => b.at - a.at);
}
async function readSnapshot(key) {
  const raw = await idbGet(key);
  let d = null; try { d = raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  if (!d) return null;
  if (d.save) return { save: d.save, heroes: d.heroes || [], why: d.why || '' };
  return { save: d, heroes: [], why: '' };
}

// ---------------------------------------------------------------- startup: the open world, with fallbacks if it cannot be read
async function loadBest() {
  const local = loadSaved();
  await idbOpen();
  let best = null, src = '';
  const parse = (raw) => { try { const d = raw ? JSON.parse(raw) : null; return d && typeof d.seed === 'number' ? d : null; } catch (e) { return null; } };
  let damaged = false;
  if (idb) {
    const cur = await idbGet('cur');
    if (cur) { const raw = await idbGet('w:' + cur); best = parse(raw); if (raw && !best) damaged = true; if (best && !best.cid) best.cid = cur; src = best ? 'db' : ''; }
    if (!best) { const raw = await idbGet('world'); const d = parse(raw); if (raw && !d) damaged = true; if (d) { best = d; src = 'legacy'; } }
  }
  const pickL = local && !local.inIdb ? local : null;
  if (pickL && (!best || (pickL.savedAt || 0) > (best.savedAt || 0)) && (!best || !pickL.cid || pickL.cid === best.cid || src === 'legacy')) { best = pickL; src = 'local'; }
  // nothing readable: fall back to the newest snapshot
  if (!best && idb && (damaged || (local && local.inIdb))) {
    const keys = ((await idbKeys()) || []).filter((k) => String(k).startsWith('snap:')).sort((a, b) => +String(b).split(':').pop() - +String(a).split(':').pop());
    for (const k of keys) { const s = await readSnapshot(k); if (s && s.save && typeof s.save.seed === 'number') { best = s.save; src = 'snapshot'; campaign.recovered = 'Your last save could not be read, so the world was restored from the automatic snapshot of ' + new Date(+String(k).split(':').pop()).toLocaleString('en-GB') + '.'; break; } }
  }
  if (damaged && src !== 'snapshot' && best) campaign.recovered = 'Your last save could not be read; the newest copy that could be read was opened instead.';
  if (best) campaign.cid = best.cid || (local && local.cid) || newCid();
  if (idb) { const hr = await idbGet('heroes'); if (hr && (!heroes.list || !heroes.list.length)) { try { const d = JSON.parse(hr); if (d && Array.isArray(d.list)) { heroes.list = d.list.filter((h) => h && h.id && CLASSES5[h.cls] && raceOk(h.race)).map(fixHero); heroes.cur = d.cur; } } catch (e) { /* ignore */ } } }
  return best;
}
// after boot: say if anything was recovered, and nudge towards a backup file now and then
function bootNotices() {
  if (campaign.recovered) { showDialog('Your world was recovered', '<p>' + esc(campaign.recovered) + '</p><p class="meta">Check it looks right, then download a backup file from the World menu.</p>'); return; }
  if (campaign.mode === 'dm' && editsSize(edits) >= 10 && Date.now() - (campaign.lastBackup || 0) > 14 * 86400000) setTimeout(() => toast('Tip: it has been a while since your last backup file. World → Download backup file.'), 4000);
}

// ---------------------------------------------------------------- two tabs on the same world
let tabChan = null;
try { tabChan = new BroadcastChannel('realmwright-tabs'); } catch (e) { tabChan = null; }
function tabPost(m) { try { if (tabChan) tabChan.postMessage(Object.assign({ tab: TAB_ID }, m)); } catch (e) { /* ignore */ } }
function tabHeard(m) {
  if (!m || m.tab === TAB_ID || m.cid !== campaign.cid) return;
  if (m.t === 'saved' && m.at > (campaign.savedAt || 0) && !campaign.shared) { campaign.stale = true; saveBanner(); }
}
if (tabChan) tabChan.onmessage = (e) => tabHeard(e.data);
// browsers without BroadcastChannel still see the local-storage copy change
window.addEventListener('storage', (e) => {
  if (e.key !== STORE_KEY || !e.newValue) return;
  try { const d = JSON.parse(e.newValue); tabHeard({ t: 'saved', tab: 'x', cid: d.cid, at: d.savedAt }); } catch (err) { /* ignore */ }
});
function saveBanner() {
  let el = $('saveWarn');
  if (!el) {
    el = document.createElement('div'); el.id = 'saveWarn'; el.setAttribute('role', 'alert'); document.body.appendChild(el);
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-sw]'); if (!b) return;
      const a = b.dataset.sw;
      if (a === 'dl') downloadBackup();
      else if (a === 'x') el.hidden = true;
      else if (a === 'reload') location.reload();
      else if (a === 'mine') saveAll('mine').then(() => toast('This tab\'s version is saved. The other tab will now ask to reload.'));
    });
  }
  if (campaign.stale) {
    el.innerHTML = '<b>This world was changed in another tab or window.</b> This tab has stopped saving so it does not overwrite that work. <button type="button" class="btn sm primary" data-sw="reload">Reload to get the newer version</button> <button type="button" class="btn sm" data-sw="mine">Keep this tab\'s version instead</button>';
    el.hidden = false; return;
  }
  if (campaign.saveOk) { el.hidden = true; return; }
  el.innerHTML = '<b>Your changes are not being saved.</b> ' + (campaign.saveErr === 'full' ? 'This browser\'s storage is full.' : 'This browser is blocking storage (private window or site data turned off).') + ' Download a backup file now so nothing is lost. <button type="button" class="btn sm primary" data-sw="dl">Download backup</button> <button type="button" class="x sm" data-sw="x" aria-label="Hide">×</button>';
  el.hidden = false;
}

// ---------------------------------------------------------------- the World menu: saving, snapshots and your worlds
async function fillSnapList() {
  const el = $('snapList');
  if (!el || !idb) return;
  const s = await listSnapshots(), ix = await snapWhyIndex();
  if (!s.length) { el.innerHTML = '<p class="meta">Snapshots appear here every half hour while you work, and before any big change.</p>'; return; }
  const rows = [];
  for (const x of s.slice(0, 8)) {
    const why = ix[x.key] || '';
    rows.push('<li><button type="button" class="link" data-w="snap" data-v="' + esc(String(x.key)) + '">' + new Date(x.at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</button> <small>' + esc(why || (x.old ? 'older snapshot' : 'automatic')) + '</small></li>');
  }
  el.innerHTML = '<span class="lab">Snapshots of this world</span><ul class="snaps">' + rows.join('') + '</ul>';
}
async function fillWorldList() {
  const el = $('worldList');
  if (!el || !idb) return;
  const list = (await readIndex()).filter((x) => x.cid !== campaign.cid);
  el.innerHTML = '<span class="lab">Your other worlds</span>' + (list.length ? '<ul class="worlds">' + list.slice(0, 20).map((x) => '<li><span><b>' + esc(x.title || 'World ' + x.seed) + '</b><small>seed ' + x.seed + ' · ' + (x.n ? x.n + ' changes' : 'no changes') + ' · saved ' + ago(x.savedAt) + '</small></span><button type="button" class="btn sm" data-w="openw" data-v="' + esc(x.cid) + '">Open</button><button type="button" class="x sm" data-w="forgetw" data-v="' + esc(x.cid) + '" aria-label="Delete ' + esc(x.title || 'world') + '" title="Delete this world from the browser">×</button></li>').join('') + '</ul>' : '<p class="meta">None yet. Starting a new world keeps this one here, so you can come back to it.</p>');
}
