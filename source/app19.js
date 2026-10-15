
// ================================================================ campaign: safe saving, backups, stable worlds, DM and player modes, merging (v20)
const GEN_VERSION = 20;          // bump whenever generated content changes
const APP_VERSION = 29;          // the release number shown to people (CHANGELOG.md)
// what changed in generated content at each version, shown when an older world is opened
const GEN_CHANGES = {
  13: 'Town layouts redrawn by terrain and culture.',
  14: 'Roads can be reshaped; nothing generated changed.',
  15: 'Guilds have branches: some towns lost their adventurers\' hall or guilds, and their rosters changed.',
  16: 'Size classes: hamlet leaders and guards renamed, half of towns now held by a lord, higher-level adventurers in metropolises.',
  17: 'Realm borders drawn correctly near close capitals.',
  18: 'Settlements only move in the Settle tool.',
  19: 'Named places; daily routines now happen at real places.',
  20: 'Lasting history: plague and war can kill townsfolk you have not met, and towns remember their losses; more varied routines.'
};
const campaign = { mode: 'dm', lastBackup: 0, savedAt: 0, saveOk: true, saveErr: '', usage: null, unlocked: false };
const isPlayer = () => campaign.mode === 'player';

// ---------------------------------------------------------------- IndexedDB: far more room than browser local storage
const IDB_NAME = 'realmwright', IDB_STORE = 'kv';
let idb = null;
function idbOpen() {
  return new Promise((res) => {
    try {
      const r = indexedDB.open(IDB_NAME, 1);
      r.onupgradeneeded = () => { try { r.result.createObjectStore(IDB_STORE); } catch (e) { /* exists */ } };
      r.onsuccess = () => { idb = r.result; res(true); };
      r.onerror = () => res(false);
      r.onblocked = () => res(false);
      setTimeout(() => res(!!idb), 3000);
    } catch (e) { res(false); }
  });
}
function idbReq(mode, fn) {
  return new Promise((res) => {
    if (!idb) { res(undefined); return; }
    try { const tx = idb.transaction(IDB_STORE, mode), st = tx.objectStore(IDB_STORE), rq = fn(st); rq.onsuccess = () => res(rq.result); rq.onerror = () => res(undefined); tx.onabort = () => res(undefined); } catch (e) { res(undefined); }
  });
}
const idbGet = (k) => idbReq('readonly', (st) => st.get(k));
const idbSet = (k, v) => idbReq('readwrite', (st) => st.put(v, k)).then((r) => r !== undefined);
const idbDel = (k) => idbReq('readwrite', (st) => st.delete(k));
const idbKeys = () => idbReq('readonly', (st) => st.getAllKeys());

async function storageInfo() {
  try { if (navigator.storage && navigator.storage.estimate) { const e = await navigator.storage.estimate(); campaign.usage = { used: e.usage || 0, quota: e.quota || 0 }; } } catch (e) { /* ignore */ }
  try { if (navigator.storage && navigator.storage.persist) campaign.persisted = await navigator.storage.persist(); } catch (e) { /* ignore */ }
}
// ---------------------------------------------------------------- backup files
function campaignFile(player) {
  const e = JSON.parse(JSON.stringify(edits));
  if (player) {
    // a handout keeps what the players know: no DM notes on people or places
    for (const id in e.npc || {}) { if (e.npc[id]) { delete e.npc[id].notes; delete e.npc[id].disp; } }
    for (const id in e.ov || {}) if (e.ov[id]) delete e.ov[id].notes;
    for (const s of e.add || []) delete s.notes;
  }
  return { kind: 'realmwright-campaign', v: 3, gen: GEN_VERSION, cid: campaign.cid, seed: SEED, title: worldNameFor(SEED), edits: e, day: market.day, heroes: player ? [] : heroes.list, mode: player ? 'player' : campaign.mode, savedAt: Date.now() };
}
// inside the claude.ai viewer files are offered through its save prompt; on an ordinary web page (GitHub) a normal download link is used
let dlNs = null;
try { if (window.claude && typeof window.claude.use === 'function') window.claude.use('downloads').then((ns) => { dlNs = ns; }, () => {}); } catch (e) { /* not in the viewer */ }
function downloadJSON(obj, name) {
  const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' });
  if (dlNs) {
    dlNs.save({ filename: name, data: blob }).then(() => toast('Saved ' + name + '.'), (err) => { const c = err && err.code; if (c === 'declined') toast('Not saved.'); else if (c === 'rate_limited') toast('A save prompt is already open.'); else toast('Saving files is not available here. Open the atlas from its own web page to download.'); });
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
const fileStamp = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const slug = (t) => t.toLowerCase().replace(/^the /, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function downloadBackup() {
  downloadJSON(campaignFile(false), slug(worldNameFor(SEED)) + '-backup-' + fileStamp() + '.json');
  campaign.lastBackup = Date.now(); scheduleSave();
  toast('Backup file downloaded. Keep it somewhere safe, or send it to your co-DM.');
  if ($('worldPop') && !$('worldPop').hidden) renderWorldPop();
}
function downloadHandout() {
  if (!edits.dmLock) { toast('Set a DM password first, so players cannot switch to DM mode.'); return; }
  downloadJSON(campaignFile(true), slug(worldNameFor(SEED)) + '-players-' + fileStamp() + '.json');
  toast('Player file downloaded. Players open it with World → Load from file.');
}
function readCampaignFile(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => { try { const d = JSON.parse(r.result); if (!d || typeof d.seed !== 'number' || !d.edits) throw new Error('bad'); res(d); } catch (e) { rej(e); } };
    r.onerror = () => rej(new Error('read'));
    r.readAsText(file);
  });
}
function applyCampaign(d, keepMode) {
  const keep = campaign.mode;
  loadSaveObject({ cid: d.cid || newCid(), seed: d.seed, edits: d.edits, day: d.day, market: d.market, mode: keepMode ? keep : d.mode, gen: d.gen, heroes: d.heroes });
}

// ---------------------------------------------------------------- stable worlds: people you have dealt with are frozen
// When the DM tracks, notes, logs, links, bonds with or takes a quest from someone, their generated details are
// copied into the save. Later versions of the generator can then never change them.
function npcRaw(id) {
  if (!id || id.startsWith('cn')) return null;
  const k = id.lastIndexOf('#'), s = SBY.get(id.slice(0, k));
  if (!s) return null;
  const tail = id.slice(k + 1);
  if (tail.charAt(0) === 'a') { const R = roster(s); return (R && R.list[+tail.slice(1)]) || null; }
  return townPeople(s).list[+tail] || null;
}
function interactedIds() {
  const ids = new Set(Object.keys(edits.npc || {}));
  for (const r of edits.npcRel || []) { ids.add(r.a); ids.add(r.b); }
  for (const h of heroes.list || []) if (h.bond && h.bond.npc) ids.add(h.bond.npc);
  const G = edits.guild || {};
  for (const id in G.q || {}) { const st = G.q[id]; if (st && st.snap && st.snap.client) ids.add(st.snap.client); }
  for (const e of (G.party && G.party.log) || []) if (e.npc) ids.add(e.npc);
  return ids;
}
function ensureSnaps() {
  if (!SET.length) return;
  const snap = edits.npcSnap || (edits.npcSnap = {});
  for (const id of interactedIds()) {
    if (!id || snap[id] || id.startsWith('cn')) continue;
    const p = npcRaw(id);
    if (!p) continue;
    snap[id] = JSON.parse(JSON.stringify(p));
    // someone history had already claimed stays dead once frozen
    const f = fateOf(p, market.day);
    if (f) Object.assign(snap[id], { status: 'Dead', fate: f.text, fateDay: f.day });
  }
  ensureWorldSnaps();
}
function versionNotice(gen) {
  const g = +gen || 12;
  if (g >= GEN_VERSION) return;
  const lines = [];
  for (let v = g + 1; v <= GEN_VERSION; v++) if (GEN_CHANGES[v]) lines.push('<li><b>v' + v + '</b> ' + esc(GEN_CHANGES[v]) + '</li>');
  const n = Object.keys(edits.npcSnap || {}).length, np = Object.keys(edits.setSnap || {}).length, D = driftReport();
  const held = D.places + D.people + D.roads ? '<p><b>Held in place:</b> this version would have changed ' + [D.places ? D.places + ' place' + (D.places > 1 ? 's' : '') + (D.names.length ? ' (' + D.names.map(esc).join(', ') + ')' : '') : '', D.people ? D.people + ' ' + (D.people > 1 ? 'people' : 'person') : '', D.roads ? D.roads + ' road' + (D.roads > 1 ? 's' : '') : ''].filter(Boolean).join(', ') + ' that your campaign uses. They are kept exactly as they were.</p>' : '';
  showDialog('This world was saved with an older version', '<p>It was made with version ' + g + ' of the generator and now opens with version ' + GEN_VERSION + '. Your own edits are untouched' + (n || np ? ', and the ' + (n ? n + ' people' : '') + (n && np ? ' and ' : '') + (np ? np + ' places' : '') + ' your campaign uses are kept exactly as they were' : '') + '. Other generated details may have changed:</p>' + held + '<p class="meta">Changes in this version:</p><ul class="laynotes">' + lines.join('') + '</ul><p class="meta">From now on, anyone you track, note, log, link, bond with or take a quest from, and every place your campaign uses, is frozen in this world, so future updates cannot change them.</p>');
}
function showDialog(title, html) {
  let el = $('atlasDialog');
  if (!el) {
    el = document.createElement('div'); el.id = 'atlasDialog'; el.className = 'dlg-wrap'; document.body.appendChild(el);
    el.addEventListener('click', (e) => { if (e.target === el || e.target.closest('[data-dlg="x"]')) el.hidden = true; });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !el.hidden) { el.hidden = true; e.stopPropagation(); } }, true);
  }
  el.innerHTML = '<div class="dlg" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><div class="ihead"><div><h2>' + esc(title) + '</h2></div><button type="button" class="x" data-dlg="x" aria-label="Close">×</button></div>' + html + '<div class="actions"><button type="button" class="btn primary" data-dlg="x">OK</button></div></div>';
  el.hidden = false;
}

// ---------------------------------------------------------------- DM and player modes
async function sha(t) {
  try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('realmwright:' + t)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join(''); }
  catch (e) { let h = 0; for (const c of 'realmwright:' + t) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0; return 'x' + (h >>> 0).toString(16); }
}
const PLAYER_HIDDEN_TOOLS = ['settle', 'road', 'paint', 'tiles', 'label', 'monsters'];
function applyMode() {
  document.body.classList.toggle('player', isPlayer());
  if (!$('modePill')) { const el = document.createElement('div'); el.id = 'modePill'; el.className = 'mode-pill'; el.setAttribute('role', 'status'); el.textContent = 'Player view'; ($('frame') || document.body).appendChild(el); }
  if (isPlayer() && PLAYER_HIDDEN_TOOLS.includes(tool)) setTool('explore');
  if (isPlayer()) { sel = sel && sel.kind === 'settle' ? sel : null; }
  heatRast = null; placeCache.clear();
  renderPanel(); requestRender();
}
async function setMode(m, pw) {
  if (m === 'dm' && isPlayer() && edits.dmLock) {
    if (!pw) { toast('Enter the DM password.'); return false; }
    if ((await sha(pw)) !== edits.dmLock) { toast('That is not the DM password.'); return false; }
  }
  campaign.mode = m;
  applyMode(); saveAll();
  toast(m === 'dm' ? 'DM mode: everything is visible and editable.' : 'Player mode: secrets, monsters and editing tools are hidden.');
  return true;
}
async function setDmPassword(pw) {
  if (!pw || pw.length < 3) { toast('Choose a password of at least 3 characters.'); return; }
  const h = await sha(pw);
  commit('Set DM password', () => { edits.dmLock = h; }, {});
  toast('DM password set. Player files will need it to switch to DM mode.');
}

// ---------------------------------------------------------------- merging another DM's campaign file into this one
function mergeCampaign(d) {
  if (d.seed !== SEED) return { error: 'That file is a different world (seed ' + d.seed + '; yours is ' + SEED + '). Only files of the same world can be merged.' };
  const mine = JSON.parse(JSON.stringify(edits)), theirs = JSON.parse(JSON.stringify(Object.assign(blankEdits(), d.edits)));
  let next = Math.max(mine.next || 1, theirs.next || 1);
  const sum = { places: 0, roads: 0, labels: 0, strokes: 0, bm: 0, people: 0, notes: 0, rels: 0, quests: 0, monsters: 0, events: 0, heroes: 0, renamed: 0 };
  // ids both DMs made separately get new ids so nothing collides
  const ren = new Map();
  const claim = (list, prefix, mineList) => { for (const it of list || []) { const other = (mineList || []).find((m) => m.id === it.id); if (other && JSON.stringify(other) !== JSON.stringify(it)) { const nid = prefix + (next++); ren.set(it.id, nid); sum.renamed++; } } };
  claim(theirs.add, 'u', mine.add); claim(theirs.radd, 'ur', mine.radd); claim(theirs.labels, 'l', mine.labels); claim(theirs.npcAdd, 'cn', mine.npcAdd);
  claim(theirs.npcRel, 'nr', mine.npcRel); claim(theirs.monAdd, 'p', mine.monAdd); claim(theirs.events, 'ue', mine.events); claim((theirs.guild || {}).custom, 'gq', (mine.guild || {}).custom);
  let tj = JSON.stringify(theirs);
  for (const [a, b] of ren) tj = tj.split('"' + a + '"').join('"' + b + '"').split('"' + a + '#').join('"' + b + '#');
  const T2 = JSON.parse(tj);
  const unionById = (a, b, key) => { const out = (a || []).slice(); for (const it of b || []) if (!out.some((x) => x.id === it.id)) { out.push(it); if (key) sum[key]++; } return out; };
  mine.add = unionById(mine.add, T2.add, 'places');
  mine.radd = unionById(mine.radd, T2.radd, 'roads');
  mine.labels = unionById(mine.labels, T2.labels, 'labels');
  mine.npcAdd = unionById(mine.npcAdd, T2.npcAdd, 'people');
  mine.npcRel = unionById(mine.npcRel, T2.npcRel, 'rels');
  mine.monAdd = unionById(mine.monAdd, T2.monAdd, 'monsters');
  mine.events = unionById(mine.events, T2.events, 'events');
  for (const st of T2.strokes || []) { const j = JSON.stringify(st); if (!mine.strokes.some((x) => JSON.stringify(x) === j)) { mine.strokes.push(st); sum.strokes++; } }
  for (const k of ['del', 'rdel', 'evOff', 'monOff']) mine[k] = Object.assign({}, T2[k] || {}, mine[k] || {});
  for (const k of ['ov', 'rov']) { const o = Object.assign({}, mine[k] || {}); for (const id in T2[k] || {}) o[id] = Object.assign({}, T2[k][id], o[id] || {}); mine[k] = o; }
  // battle map: their painted squares are added; where both of you painted the same square, yours stays
  { const o = mine.bm || {}; for (const ck in T2.bm || {}) { const a = o[ck] || (o[ck] = {}), b2 = T2.bm[ck] || {}, was = JSON.stringify(a); for (const kind of ['t', 'p', 'h', 'v']) if (b2[kind]) a[kind] = Object.assign({}, b2[kind], a[kind] || {}); if (JSON.stringify(a) !== was) sum.bm++; } mine.bm = o; }
  // notes on people: logs combined, notes joined, tracking kept if either tracks
  const npc = Object.assign({}, mine.npc || {});
  for (const id in T2.npc || {}) {
    const a = npc[id], b = T2.npc[id];
    if (!a) { npc[id] = b; sum.notes++; continue; }
    const m = Object.assign({}, b, a);
    if (a.notes && b.notes && a.notes !== b.notes) m.notes = a.notes + '\n— from the other DM —\n' + b.notes;
    else m.notes = a.notes || b.notes;
    const seen = new Set(); m.log = (a.log || []).concat(b.log || []).filter((e) => { const k = e.d + '|' + e.t; if (seen.has(k)) return false; seen.add(k); return true; }).sort((x, y) => x.d - y.d);
    if (b.tracked) m.tracked = 1;
    npc[id] = m; sum.notes++;
  }
  mine.npc = npc;
  mine.npcMore = Object.assign({}, T2.npcMore || {}); for (const id in mine.npcMore) mine.npcMore[id] = Math.max(mine.npcMore[id] || 0, ((edits.npcMore || {})[id]) || 0); for (const id in edits.npcMore || {}) if (mine.npcMore[id] == null) mine.npcMore[id] = edits.npcMore[id];
  mine.npcSnap = Object.assign({}, T2.npcSnap || {}, mine.npcSnap || {});
  mine.setSnap = Object.assign({}, T2.setSnap || {}, mine.setSnap || {});
  mine.roadSnap = Object.assign({}, T2.roadSnap || {}, mine.roadSnap || {});
  // guild: party members, quest states (the further along wins), custom quests, standing kept as mine
  const G = mine.guild = Object.assign(blankEdits().guild, mine.guild || {}), H = Object.assign(blankEdits().guild, T2.guild || {});
  G.party = Object.assign({}, G.party); G.party.members = unionById(G.party.members, H.party.members); G.party.log = (G.party.log || []).concat((H.party.log || []).filter((e) => !(G.party.log || []).some((x) => x.d === e.d && x.t === e.t))).sort((a, b) => a.d - b.d);
  const rank = { abandoned: 0, accepted: 1, failed: 2, done: 3 };
  G.q = Object.assign({}, G.q); for (const id in H.q || {}) { const a = G.q[id], b = H.q[id]; if (!a || (rank[b.st] || 0) > (rank[a.st] || 0)) { G.q[id] = b; sum.quests++; } }
  G.custom = unionById(G.custom, H.custom, 'quests');
  G.ag = Object.assign({}, H.ag || {}, G.ag || {});
  mine.dmLock = mine.dmLock || T2.dmLock;
  mine.next = next + 1;
  return { edits: mine, sum };
}
function mergeSummary(s) {
  const parts = [['places', 'new places'], ['roads', 'roads'], ['labels', 'labels'], ['strokes', 'painted areas'], ['bm', 'battle-map areas'], ['heroes', 'heroes'], ['people', 'new people'], ['notes', 'people with notes or logs'], ['rels', 'relationships'], ['quests', 'quest updates'], ['monsters', 'placed monsters'], ['events', 'events']].filter(([k]) => s[k]).map(([k, n]) => s[k] + ' ' + n);
  return (parts.length ? 'Merged: ' + parts.join(', ') + '.' : 'Nothing new to merge.') + (s.renamed ? ' ' + s.renamed + ' items made by both of you were given new ids so neither is lost.' : '');
}

// ---------------------------------------------------------------- the World menu sections for saving, modes and sharing
const ago = (t) => { if (!t) return 'never'; const s = (Date.now() - t) / 1000; return s < 60 ? 'just now' : s < 3600 ? Math.round(s / 60) + ' min ago' : s < 86400 ? Math.round(s / 3600) + ' h ago' : Math.round(s / 86400) + ' days ago'; };
const mb = (b) => (b >= 1e9 ? (b / 1e9).toFixed(1) + ' GB' : (b / 1e6).toFixed(1) + ' MB');
function campaignMenuHtml() {
  const u = campaign.usage;
  let h = '<p class="meta appver">Realmwright Atlas v' + APP_VERSION + ' · world generator ' + GEN_VERSION + '</p><div class="field"><span class="lab">Saving</span><p class="meta save-' + (campaign.saveOk && !campaign.stale ? 'ok' : 'bad') + '">' + (campaign.stale ? '<b>Paused</b>: this world was changed in another tab' : campaign.saveOk ? 'Saved ' + ago(campaign.savedAt) + ' in this browser' + (idb ? ' (database storage)' : '') : '<b>Not saving</b>: storage is ' + (campaign.saveErr === 'full' ? 'full' : 'blocked')) + (u && u.quota ? ' · using ' + mb(u.used) + ' of ' + mb(u.quota) : '') + '.' +
    (campaign.persisted === true ? ' Protected from automatic clearing.' : campaign.persisted === false ? ' The browser may clear it if space runs low, so keep backup files.' : '') + '</p>' +
    '<p class="meta">Last backup file: ' + ago(campaign.lastBackup) + (campaign.lastBackup && Date.now() - campaign.lastBackup < 7 * 86400000 ? '' : ' <b>· download one now and then; browser storage can be wiped</b>') + '.</p>' +
    '<div class="actions"><button type="button" class="btn primary" data-w="backup">Download backup file</button><button type="button" class="btn" data-w="file">Load from file…</button><input type="file" id="f-file" accept=".json,application/json" hidden></div>' +
    '<div id="snapList" class="meta"></div>' + (isPlayer() ? '' : '<div id="worldList" class="meta"></div>') + '</div>';
  if (typeof shareMenuHtml === 'function') h += shareMenuHtml();
  if (share.on || localFeed.length) h += '<hr>' + recentChangesHtml();
  if (campaign.shared && !campaign.admin) return h;
  h += '<hr><div class="field"><span class="lab">Mode</span>' + '<div class="seg" role="group" aria-label="Mode"><button type="button" data-w="mode" data-v="dm" aria-pressed="' + !isPlayer() + '">Dungeon Master</button><button type="button" data-w="mode" data-v="player" aria-pressed="' + isPlayer() + '">Player</button></div>' +
    (isPlayer() ? (edits.dmLock && !campaign.shared ? '<div class="inline"><input id="f-dmpw" type="password" placeholder="DM password" aria-label="DM password"><button type="button" class="btn" data-w="unlock">Switch to DM</button></div>' : '') + '<p class="meta">Player mode hides NPC secrets and motives, the thieves\' guild, monster positions and the editing tools.</p>'
      : '<p class="meta">Player mode hides NPC secrets and motives, the thieves\' guild, monster positions and the editing tools.' + (campaign.shared ? ' Use it to preview what your players see.' : '') + '</p>' + (campaign.shared ? '' : '<div class="inline"><input id="f-setpw" type="password" placeholder="' + (edits.dmLock ? 'New DM password' : 'Set a DM password') + '" aria-label="DM password"><button type="button" class="btn" data-w="setpw">' + (edits.dmLock ? 'Change' : 'Set') + '</button></div>' +
        '<div class="actions"><button type="button" class="btn" data-w="handout">Make a player file</button></div><p class="meta">The player file opens in player mode, without your notes, and needs the DM password to switch back.</p>')) + '</div>';
  if (!isPlayer() && !campaign.shared) h += '<hr><div class="field"><span class="lab">Running the campaign with another DM</span><p class="meta">Send each other backup files. Merging adds their places, roads, labels, painted land, people, notes, logs and quest progress to yours without overwriting anything of yours.</p><div class="actions"><button type="button" class="btn" data-w="merge">Merge a campaign file…</button></div></div>';
  return h;
}
// ---------------------------------------------------------------- what players see
// the group someone shows the world: thieves and smugglers appear as their cover trade
const pubGroup = (p) => (isPlayer() && p.group === 'underworld' ? (GROUP_FROM_COVER[p.job] || 'labour') : p.group);
const orgsShown = (s) => orgsIn(s).filter((k) => !(isPlayer() && ORGS[k].secret));
const SECRET_REL = new Set(['lover', 'blackmail']);
