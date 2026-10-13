
// ================================================================ stable worlds, part two: places and roads in use are frozen too (v21)
// People the DM has dealt with were already frozen (app19). Now every settlement the campaign refers to (where those
// people live, places with DM edits or notes, the party's location, quest towns, heroes' hometowns, DM events) and
// every capital keeps its generated name, position, size and land, and every road the DM reshaped or removed keeps
// its two ends. A future generator can move or rename the rest of the world, never these.
const SET_FIELDS = ['name', 'x', 'y', 'tier', 'pop', 'b', 'coastal', 'realm'];
function usedSettlementIds() {
  const ids = new Set();
  const sidOf = (pid) => { if (!pid || pid.startsWith('cn')) return null; const k = pid.lastIndexOf('#'); return k > 0 ? pid.slice(0, k) : null; };
  for (const id of interactedIds()) { const s = sidOf(id); if (s) ids.add(s); }
  for (const id in edits.npcSnap || {}) { const s = sidOf(id); if (s) ids.add(s); }
  for (const p of edits.npcAdd || []) if (p.sid) ids.add(p.sid);
  for (const id in edits.npcMore || {}) ids.add(id);
  for (const id in edits.ov || {}) ids.add(id);
  for (const e of edits.events || []) if (e.sid) ids.add(e.sid);
  const G = edits.guild || {};
  if (G.party && G.party.at) ids.add(G.party.at);
  for (const id in G.q || {}) { const st = G.q[id]; if (st && st.snap && st.snap.sid) ids.add(st.snap.sid); }
  for (const q of G.custom || []) if (q.sid) ids.add(q.sid);
  for (const h of heroes.list || []) if (h.home) ids.add(h.home);
  for (const c of CAPLIST) ids.add(c.id);
  return ids;
}
let baseById = null, baseFor = null;
function baseSettlement(id) {
  if (baseFor !== BASE) { baseById = new Map(BASE.settle.map((s) => [s.id, s])); baseFor = BASE; }
  return baseById.get(id) || null;
}
function ensureWorldSnaps() {
  if (!SET.length || !BASE.settle.length) return;
  const snap = edits.setSnap || (edits.setSnap = {});
  for (const id of usedSettlementIds()) {
    if (snap[id]) continue;
    const s = baseSettlement(id);
    if (!s) continue;
    const o = {};
    for (const k of SET_FIELDS) if (s[k] !== undefined) o[k] = s[k];
    snap[id] = o;
  }
  const rs = edits.roadSnap || (edits.roadSnap = {});
  for (const id of new Set(Object.keys(edits.rov || {}).concat(Object.keys(edits.rdel || {})))) {
    if (rs[id]) continue;
    const r = BASE.roads.find((x) => x.id === id);
    if (r) rs[id] = { a: r.a, b: r.b, type: r.type };
  }
}
// applyEdits hooks (see app1): frozen settlements override what the generator made, and come back if it stopped making them
function settleWithSnap(s) { const sn = edits.setSnap && edits.setSnap[s.id]; return sn ? Object.assign({}, s, sn) : s; }
function lostSettlements() {
  const out = [];
  if (!edits.setSnap) return out;
  for (const id in edits.setSnap) if (!baseSettlement(id) && !edits.del[id]) out.push(Object.assign({ id, gen: true, sc: 0.5, kept: true }, edits.setSnap[id]));
  return out;
}
// roads the DM reshaped that the generator no longer makes are rebuilt between the same two places
function lostRoads() {
  const out = [];
  for (const id in edits.roadSnap || {}) {
    if (edits.rdel[id] || !edits.rov[id] || BASE.roads.some((r) => r.id === id)) continue;
    const sn = edits.roadSnap[id];
    out.push({ id, a: sn.a, b: sn.b, type: sn.type || 2, gen: true, kept: true });
  }
  return out;
}
// what a newer generator would have changed among the things this campaign uses
function driftReport() {
  const out = { places: 0, people: 0, roads: 0, names: [] };
  for (const id in edits.setSnap || {}) {
    const s = baseSettlement(id), sn = edits.setSnap[id];
    if (!s) { out.places++; continue; }
    if (SET_FIELDS.some((k) => sn[k] !== undefined && (typeof sn[k] === 'number' ? Math.abs(sn[k] - s[k]) > 1e-6 : sn[k] !== s[k]))) { out.places++; if (out.names.length < 4) out.names.push(sn.name); }
  }
  for (const id in edits.npcSnap || {}) {
    const k = id.lastIndexOf('#'), s = SBY.get(id.slice(0, k));
    if (!s) continue;
    const raw = npcRaw(id), sn = edits.npcSnap[id];
    if (!raw || raw.first !== sn.first || raw.last !== sn.last || raw.job !== sn.job || raw.race !== sn.race) out.people++;
  }
  out.roads = lostRoads().length;
  return out;
}
