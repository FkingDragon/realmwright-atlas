
// ================================================================ tools & interaction state
let tool = 'explore';
let sel = null;            // { kind: 'settle' | 'road' | 'label', id }
let drag = null;           // moving a selected settlement or label
let roadDraft = null;      // { type, pts }
let strokeDraft = null;    // paint stroke in progress
let measure = null;        // { a: [x, y], b: [x, y] | null }
let hover = null;          // pointer position (mouse only)
const paint = { b: 6, px: 26 };
let settleTier = 1, roadType = 2, labelSize = 'm';
let spaceDown = false;

// ---------------------------------------------------------------- commits & undo
function commit(label, mut, inv) {
  const before = JSON.stringify(edits);
  mut();
  const after = JSON.stringify(edits);
  if (before === after) return;
  history.push({ before, after, inv, label });
  feedLocal(label);
  if (history.length > 80) history.shift();
  future = [];
  afterChange(inv);
}
function afterChange(inv) {
  applyEdits();
  marketInvalidate();
  peopleInvalidate();
  if (inv.roads) roadsVer++;
  if (inv.strokes) strokesVer++;
  if (inv.bb) invalidateTiles(inv.bb, inv.z0, inv.z1);
  if (inv.realms) invalidateTiles(null, 0, 9);
  if (inv.bb) pxInvalidate(inv.bb); else if (inv.roads || inv.strokes) pxInvalidate(null);
  if (inv.bm) pxInvalidate(inv.bm);
  if (sel && !selObj()) sel = null;
  renderPanel();
  scheduleSave();
  updateUndo();
  requestRender();
}
function undo() {
  const h = history.pop();
  if (!h) return;
  patchEdits(JSON.parse(h.after), JSON.parse(h.before));
  future.push(h);
  geomCache.clear();
  afterChange(h.inv);
  feedLocal(h.label, 'Undid');
  toast('Undone: ' + h.label);
}
function redo() {
  const h = future.pop();
  if (!h) return;
  patchEdits(JSON.parse(h.before), JSON.parse(h.after));
  history.push(h);
  geomCache.clear();
  afterChange(h.inv);
  feedLocal(h.label, 'Redid');
  toast('Redone: ' + h.label);
}
function updateUndo() { $('btnUndo').disabled = !history.length; $('btnRedo').disabled = !future.length; }
const union = (a, b) => (!a ? b : !b ? a : [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])]);
function settleBB(s) { const R = settleR(s) + 0.02; return [s.x - R, s.y - R, s.x + R, s.y + R]; }
function attachedRoadsBB(id) { let bb = null; for (const r of ROADS) if (r.a === id || r.b === id) bb = union(bb, r._bb); return bb; }
const r5 = (v) => Math.round(v * 1e5) / 1e5;

// ---------------------------------------------------------------- settlement edits
function selObj() {
  if (!sel) return null;
  if (sel.kind === 'settle') return SBY.get(sel.id) || null;
  if (sel.kind === 'road') return RBY.get(sel.id) || null;
  if (sel.kind === 'event') return findEvent(sel.id);
  return edits.labels.find((l) => l.id === sel.id) || null;
}
function addSettlement(x, y, tier) {
  const id = 'u' + edits.next;
  const rng = T.mulberry(hashStr(id) ^ SEED ^ Date.now());
  const used = new Set(SET.map((s) => s.name));
  const coastal = isCoastal(x, y);
  const c = TIERS[tier];
  const s = { id, x: r5(x), y: r5(y), tier, pop: Math.round(Math.sqrt(c.lo * c.hi) / c.round) * c.round, name: nameGen(rng, tier, coastal, used), b: T.biomeAt(x, y, 8, null), coastal, notes: '' };
  if (tier === 4) s.realm = realmNameFor(s.name, rng);
  commit('Found ' + s.name, () => { edits.next++; edits.add.push(s); }, { bb: settleBB(s), z0: 14, z1: 20, roads: true, realms: tier === 4 });
  sel = { kind: 'settle', id };
  renderPanel();
  requestRender();
}
function patchSettlement(id, patch, label) {
  const old = SBY.get(id);
  if (!old) return;
  const nu = Object.assign({}, old, patch);
  if (patch.tier === 4 && !nu.realm) patch.realm = 'Realm of ' + nu.name;
  let bb = union(settleBB(old), settleBB(nu));
  const moved = patch.x != null;
  if (moved) bb = union(bb, attachedRoadsBB(id));
  const realms = old.tier === 4 || nu.tier === 4 ? (patch.tier != null || moved || patch.realm != null) : false;
  commit(label, () => {
    const u = edits.add.find((q) => q.id === id);
    if (u) Object.assign(u, patch);
    else edits.ov[id] = Object.assign(edits.ov[id] || {}, patch);
  }, { bb, z0: 14, z1: 20, roads: true, realms });
  if (moved) { const bb2 = attachedRoadsBB(id); if (bb2) invalidateTiles(bb2, 14, 20); }
}
function deleteSettlement(id) {
  const s = SBY.get(id);
  if (!s) return;
  let n = 0;
  for (const r of ROADS) if (r.a && (r.a === id || r.b === id)) n++;
  const bb = union(settleBB(s), attachedRoadsBB(id));
  commit('Remove ' + s.name, () => {
    const i = edits.add.findIndex((q) => q.id === id);
    if (i >= 0) edits.add.splice(i, 1); else { edits.del[id] = 1; delete edits.ov[id]; }
  }, { bb, z0: 14, z1: 20, roads: true, realms: s.tier === 4 });
  sel = null;
  renderPanel();
  toast('Removed ' + s.name + (n ? ' and ' + n + (n === 1 ? ' road' : ' roads') : '') + '. Undo brings it back.');
}
// ---------------------------------------------------------------- roads
function addRoad(pts, type) {
  const id = 'ur' + edits.next;
  const r = { id, type, pts: pts.map(r5) };
  const bb = roadBBox(r);
  commit('Add ' + ROADTYPES[type].name.toLowerCase(), () => { edits.next++; edits.radd.push(r); }, { bb: [bb[0] - 0.01, bb[1] - 0.01, bb[2] + 0.01, bb[3] + 0.01], z0: 14, z1: 20, roads: true });
  sel = { kind: 'road', id };
}
function patchRoad(id, type) {
  const r = RBY.get(id);
  if (!r) return;
  commit('Change road', () => {
    const u = edits.radd.find((q) => q.id === id);
    if (u) u.type = type; else edits.rov[id] = { type };
  }, { bb: r._bb, z0: 14, z1: 20, roads: true });
}
function deleteRoad(id) {
  const r = RBY.get(id);
  if (!r) return;
  commit('Remove road', () => {
    const i = edits.radd.findIndex((q) => q.id === id);
    if (i >= 0) edits.radd.splice(i, 1); else { edits.rdel[id] = 1; delete edits.rov[id]; }
  }, { bb: r._bb, z0: 14, z1: 20, roads: true });
  sel = null;
  renderPanel();
}
// ---------------------------------------------------------------- labels
function addLabel(x, y) {
  const id = 'l' + edits.next;
  commit('Add label', () => { edits.next++; edits.labels.push({ id, text: 'New label', x: r5(x), y: r5(y), size: labelSize }); }, {});
  sel = { kind: 'label', id };
  renderPanel();
  const f = $('f-ltext');
  if (f) { f.focus(); f.select(); }
}
function patchLabel(id, patch, label) { commit(label, () => { const l = edits.labels.find((q) => q.id === id); if (l) Object.assign(l, patch); }, {}); }
function deleteLabel(id) { commit('Remove label', () => { edits.labels = edits.labels.filter((l) => l.id !== id); }, {}); sel = null; renderPanel(); }

// ---------------------------------------------------------------- hit testing
function hitTest(px, py) {
  for (let i = markers.length - 1; i >= 0; i--) {
    const m = markers[i];
    if (m.kind === 'label' && px >= m.r[0] - 4 && px <= m.r[2] + 4 && py >= m.r[1] - 4 && py <= m.r[3] + 4) return { kind: 'label', id: m.id };
  }
  let np = null, nd = 1e9;
  for (const m of markers) if (m.kind === 'npc') { const d = Math.hypot(m.X - px, m.Y - py); if (d < m.r && d < nd) { nd = d; np = m; } }
  if (np) return { kind: 'npc', id: np.id };
  let nm = null, nmd = 1e9;
  for (const m of markers) if (m.kind === 'mon') { const d = Math.hypot(m.X - px, m.Y - py); if (d < m.r && d < nmd) { nmd = d; nm = m; } }
  if (nm) return { kind: 'mon', id: nm.id };
  for (let i = markers.length - 1; i >= 0; i--) {
    const m = markers[i];
    if (m.kind === 'event' && Math.hypot(m.X - px, m.Y - py) < m.r) return { kind: 'event', id: m.id };
  }
  let npo = null, npd = 1e9;
  for (const m of markers) if (m.kind === 'poi') { const d = Math.hypot(m.X - px, m.Y - py); if (d < m.r && d < npd) { npd = d; npo = m; } }
  if (npo) return { kind: 'poi', id: npo.id };
  const lab = labelAt(px, py);
  if (lab) return lab.kind === 'slabel' ? { kind: 'settle', id: lab.id } : { kind: 'realm', id: lab.id };
  let best = null, bd = 1e9;
  for (const m of markers) {
    if (m.kind !== 'settle') continue;
    const d = Math.hypot(m.X - px, m.Y - py);
    const lim = Math.max(m.r, 12);
    if (d < lim && d / lim < bd) { bd = d / lim; best = { kind: 'settle', id: m.id }; }
  }
  return best;
}
function snapToSettlement(px, py) {
  for (const m of markers) if (m.kind === 'settle' && Math.hypot(m.X - px, m.Y - py) < Math.max(14, Math.min(m.r, 40))) { const s = SBY.get(m.id); if (s) return [s.x, s.y]; }
  return null;
}

// ---------------------------------------------------------------- pointer input
const ptrs = new Map();
let gest = null, lastTap = null;
function ptOf(e) { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('pointerdown', (e) => {
  closePopovers();
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  const p = ptOf(e);
  ptrs.set(e.pointerId, p);
  anim = null;
  if (ptrs.size === 2) {
    strokeDraft = null;
    if (twOp) twUp(true);
    if (drag) drag = null;
    const [a, b] = [...ptrs.values()];
    const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
    gest = { type: 'pinch', d: Math.max(10, Math.hypot(a.x - b.x, a.y - b.y)), s0: view.s, wx: wxOf(cx), wy: wyOf(cy) };
    requestRender();
    return;
  }
  if (ptrs.size > 2) return;
  const panBtn = e.button === 1 || e.button === 2 || spaceDown;
  gest = { type: 'press', x0: p.x, y0: p.y, lx: p.x, ly: p.y, moved: false, pan: panBtn, touch: e.pointerType === 'touch' };
  if (panBtn || e.button !== 0) return;
  if (tool === 'paint') { gest.type = 'paint'; startStroke(p); }
  else if (tool === 'tiles' && twDown(p)) gest.type = 'tiles';
  else if (roadPress(p)) { gest.type = 'rnode'; requestRender(); }
  else if ((tool === 'settle' && sel && sel.kind === 'settle') || (tool === 'label' && sel && sel.kind === 'label')) {
    // places and labels only move in their own editing tool; everywhere else a drag pans the map
    const h = labelAt(p.x, p.y) ? null : hitTest(p.x, p.y);
    if (h && h.kind === sel.kind && h.id === sel.id) { gest.type = 'drag'; drag = { kind: sel.kind, id: sel.id, X: p.x, Y: p.y, moved: false }; }
  }
});
canvas.addEventListener('pointermove', (e) => {
  const p = ptOf(e);
  if (!ptrs.has(e.pointerId)) {
    if (e.pointerType === 'mouse') { hover = p; hoverInfo(p); interHover(p); if (tool === 'paint' || tool === 'road' || tool === 'measure' || tool === 'tiles') requestRender(); }
    return;
  }
  ptrs.set(e.pointerId, p);
  if (e.pointerType === 'mouse') hover = p;
  if (!gest) return;
  if (gest.type === 'pinch') {
    if (ptrs.size < 2) return;
    const [a, b] = [...ptrs.values()];
    const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
    const d = Math.max(10, Math.hypot(a.x - b.x, a.y - b.y));
    view.s = clamp(gest.s0 * d / gest.d, minS, MAXS);
    view.x = gest.wx - (cx - vw / 2) / view.s;
    view.y = gest.wy - (cy - vh / 2) / view.s;
    clampView(); requestRender();
    return;
  }
  if (!gest.moved && Math.hypot(p.x - gest.x0, p.y - gest.y0) > (gest.touch ? 9 : 4)) gest.moved = true;
  if (gest.type === 'paint') extendStroke(p);
  else if (gest.type === 'tiles') twMove(p);
  else if (gest.type === 'drag' || gest.type === 'rnode') { if (gest.moved && drag) { drag.moved = true; drag.X = p.x; drag.Y = p.y; canvas.style.cursor = 'grabbing'; requestRender(); } }
  else if (gest.moved) {
    view.x -= (p.x - gest.lx) / view.s; view.y -= (p.y - gest.ly) / view.s;
    clampView(); requestRender();
  }
  gest.lx = p.x; gest.ly = p.y;
});
function endPointer(e) {
  const had = ptrs.has(e.pointerId);
  ptrs.delete(e.pointerId);
  if (!had || !gest) return;
  const p = ptOf(e);
  if (gest.type === 'pinch') {
    if (ptrs.size === 1) { const r = [...ptrs.values()][0]; gest = { type: 'press', x0: r.x, y0: r.y, lx: r.x, ly: r.y, moved: true, pan: true }; }
    else if (ptrs.size === 0) gest = null;
    return;
  }
  if (ptrs.size > 0) return;
  const g = gest;
  gest = null;
  if (e.type === 'pointercancel') { strokeDraft = null; drag = null; if (twOp) twUp(true); requestRender(); return; }
  if (g.type === 'paint') { finishStroke(); return; }
  if (g.type === 'tiles') { twUp(false); return; }
  if (g.type === 'rnode') { if (!roadRelease(p)) tap(p); canvas.style.cursor = ''; requestRender(); return; }
  if (g.type === 'drag') {
    const d = drag;
    drag = null;
    if (d && d.moved) {
      const x = r5(clamp(wxOf(p.x), 1, W - 1)), y = r5(clamp(wyOf(p.y), 1, H - 1));
      if (d.kind === 'settle') patchSettlement(d.id, { x, y }, 'Move settlement');
      else patchLabel(d.id, { x, y }, 'Move label');
    } else tap(p);
    canvas.style.cursor = '';
    requestRender();
    return;
  }
  if (!g.moved && !g.pan) tap(p);
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { hover = null; $('hover').hidden = true; requestRender(); } });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  anim = null;
  const p = ptOf(e);
  const dy = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
  zoomAt(p.x, p.y, Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0018)));
}, { passive: false });

function tap(p) {
  const wx = wxOf(p.x), wy = wyOf(p.y);
  const inWorld = wx >= 0 && wy >= 0 && wx <= W && wy <= H;
  const now = performance.now();
  const dbl = lastTap && now - lastTap.t < 320 && Math.hypot(lastTap.x - p.x, lastTap.y - p.y) < 24;
  lastTap = { t: now, x: p.x, y: p.y };
  if (tool === 'monsters') {
    if (dbl && !monUI.place && !monUI.move) { lastTap = null; flyTo(wx, wy, view.s * 2.5, 450); return; }
    let hm = hitTest(p.x, p.y);
    if (hm && hm.kind === 'realm') { goRealm(hm.id); return; }
    if (hm && hm.kind === 'poi') hm = null;
    monTap(hm, wx, wy);
    return;
  }
  if (tool === 'heroes') {
    if (dbl) { lastTap = null; flyTo(wx, wy, view.s * 2.5, 450); return; }
    const h = hitTest(p.x, p.y);
    if (h && h.kind === 'realm') { goRealm(h.id); return; }
    if (h && h.kind === 'settle' && heroTapSettlement(h.id)) return;
    if (h && h.kind === 'npc') { setTool('people', true); openPerson(h.id, true); }
    return;
  }
  switch (tool) {
    case 'explore': case 'market': case 'people': case 'guilds': {
      if (dbl) { lastTap = null; flyTo(wx, wy, view.s * 2.5, 450); return; }
      let h = hitTest(p.x, p.y);
      if (h) panelMin = false;
      if (h && h.kind === 'realm') { if (tool !== 'explore') { market.sid = h.id; people.sid = h.id; if (tool === 'market') market.tab = 'town'; if (tool === 'people') { people.npc = null; people.tab = 'residents'; } if (tool === 'guilds') { guildUI.q = null; guildUI.org = null; } } sel = { kind: 'settle', id: h.id }; goRealm(h.id); renderPanel(); requestRender(); return; }
      if (h && h.kind === 'npc') { if (tool !== 'people') setTool('people', true); openPerson(h.id, true); return; }
      if (h && h.kind === 'poi') { const j = h.id.indexOf('|'); goPlace(h.id.slice(0, j), h.id.slice(j + 1), true); return; }
      if (h && h.kind === 'mon') { openMonster(h.id, false); return; }
      if (tool === 'guilds') {
        if (h && h.kind === 'settle') { market.sid = h.id; people.sid = h.id; guildUI.q = null; const ns = SBY.get(h.id); if (guildUI.org && (!ns || !orgHere(ns, guildUI.org))) guildUI.org = null; }
        else h = null;
      } else if (tool === 'people') {
        if (h && h.kind === 'settle') { people.sid = h.id; people.npc = null; people.place = null; if (people.tab === 'tracked') people.tab = 'residents'; people.q = ''; people.group = 'all'; }
        else h = null;
      } else if (tool === 'market') {
        if (h && h.kind === 'settle') { market.sid = h.id; market.tab = 'town'; }
        else if (h && h.kind === 'event') market.tab = 'events';
        else if (h) h = null;
      } else if (h && h.kind === 'event') { setTool('market', true); market.tab = 'events'; }
      sel = h;
      renderPanel();
      requestRender();
      break;
    }
    case 'settle': {
      const hs = labelAt(p.x, p.y) ? null : hitTest(p.x, p.y);
      if (hs && hs.kind === 'settle') { if (!sel || sel.id !== hs.id) { sel = hs; panelMin = false; renderPanel(); } requestRender(); return; }
      if (sel && sel.kind === 'settle') { sel = null; renderPanel(); requestRender(); return; }
      if (!inWorld) return;
      if (T.isWater(T.biomeAt(wx, wy, clamp(Math.floor(Math.log2(W * view.s / RES)), 0, ZMAX), circlesIn(wx, wy, wx, wy)))) { toast('That spot is under water. Pick dry land.'); return; }
      addSettlement(wx, wy, settleTier);
      break;
    }
    case 'road': {
      if (!inWorld) return;
      // with no road being drawn, a tap on a road selects it for reshaping
      if (!(roadDraft && roadDraft.pts.length)) {
        const onTown = snapToSettlement(p.x, p.y);
        if (sel && sel.kind === 'road') {
          const r = RBY.get(sel.id);
          if (dbl && r) { lastTap = null; roadNodeToggle(r, p); requestRender(); return; }
          const hr = onTown ? null : roadHit(p.x, p.y);
          if (hr) { if (hr.id !== sel.id) { sel = hr; renderPanel(); } requestRender(); return; }
          sel = null; renderPanel(); requestRender();
          if (!onTown) return;
        } else if (!onTown) {
          const hr = roadHit(p.x, p.y);
          if (hr) { sel = hr; panelMin = false; renderPanel(); requestRender(); return; }
        }
      }
      const snap = snapToSettlement(p.x, p.y) || [wx, wy];
      if (!roadDraft) roadDraft = { pts: [] };
      const pts = roadDraft.pts;
      if (pts.length >= 2) {
        const lx = sx(pts[pts.length - 2]), ly = sy(pts[pts.length - 1]);
        if (Math.hypot(lx - p.x, ly - p.y) < 14) { finishRoad(); return; }
      }
      pts.push(snap[0], snap[1]);
      renderPanel(); requestRender();
      break;
    }
    case 'label': {
      const hl = hitTest(p.x, p.y);
      if (hl && hl.kind === 'label') { if (!sel || sel.id !== hl.id) { sel = hl; panelMin = false; renderPanel(); } requestRender(); return; }
      if (sel && sel.kind === 'label') { sel = null; renderPanel(); requestRender(); return; }
      if (!inWorld) return;
      addLabel(wx, wy);
      break;
    }
    case 'measure':
      if (!measure || measure.b) measure = { a: [wx, wy], b: null };
      else measure.b = [wx, wy];
      renderPanel(); requestRender();
      break;
  }
}
function finishRoad() {
  if (!roadDraft || roadDraft.pts.length < 4) { toast('A road needs at least two points.'); return; }
  const pts = roadDraft.pts;
  roadDraft = null;
  addRoad(pts, roadType);
  renderPanel(); requestRender();
  toast('Road added. Drag its dots to reshape it, or tap empty ground to start another.');
}
// ---------------------------------------------------------------- painting
function startStroke(p) {
  const r = paint.px / view.s;
  strokeDraft = { b: paint.b, r, pts: [r5(wxOf(p.x)), r5(wyOf(p.y))] };
  requestRender();
}
function extendStroke(p) {
  if (!strokeDraft) return;
  const pts = strokeDraft.pts, r = strokeDraft.r;
  const x = wxOf(p.x), y = wyOf(p.y);
  const lx = pts[pts.length - 2], ly = pts[pts.length - 1];
  const d = Math.hypot(x - lx, y - ly), step = r * 0.35;
  if (d < step) return;
  const n = Math.min(200, Math.floor(d / step));
  for (let k = 1; k <= n; k++) pts.push(r5(lx + (x - lx) * k / n), r5(ly + (y - ly) * k / n));
  requestRender();
}
function finishStroke() {
  const st = strokeDraft;
  strokeDraft = null;
  if (!st) return;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < st.pts.length; i += 2) { x0 = Math.min(x0, st.pts[i]); x1 = Math.max(x1, st.pts[i]); y0 = Math.min(y0, st.pts[i + 1]); y1 = Math.max(y1, st.pts[i + 1]); }
  const bb = [x0 - st.r, y0 - st.r, x1 + st.r, y1 + st.r];
  const rec = { b: st.b, r: r5(Math.max(st.r, 1e-5)), pts: st.pts };
  commit(st.b < 0 ? 'Restore terrain' : 'Paint ' + T.NAMES[st.b].toLowerCase(), () => { edits.strokes.push(rec); }, { bb, z0: 0, z1: 20, strokes: true });
  pendingPreview = { b: st.b, r: st.r, pts: st.pts, bb, t: performance.now() };
}

// ---------------------------------------------------------------- hover readout
let hoverT = 0;
const elevFt = (e) => Math.round((e <= 0 ? 0 : e < 0.5 ? e * 7000 : 3500 + (e - 0.5) * 30000) / 10) * 10;
function hoverInfo(p) {
  const now = performance.now();
  if (now - hoverT < 60) return;
  hoverT = now;
  const x = wxOf(p.x), y = wyOf(p.y);
  const el = $('hover');
  if (x < 0 || y < 0 || x > W || y > H) { el.hidden = true; return; }
  const z = clamp(Math.floor(Math.log2(W * view.s / RES)), 0, ZMAX);
  const pz = T.pFor(z);
  const o = T.natural(x, y, Math.min(14, T.octFor(pz)), pz);
  const e = o.e;
  const circ = circlesIn(x, y, x, y);
  const b = circ.length ? T.strokeBiome(x, y, o.b, o.b, circ) : o.b;
  let txt = T.NAMES[b];
  if (!T.isWater(b)) txt += ' · ' + fmtInt(elevFt(e)) + ' ft';
  else if (b <= 2 && e < 0) txt += ' · ' + fmtInt(-e * 9000) + ' ft deep';
  const R = !T.isWater(b) ? realmOf(x, y) : null;
  if (R && layers.borders) txt += ' · ' + R.name;
  el.textContent = txt;
  el.hidden = false;
}

// ---------------------------------------------------------------- keyboard
const typing = (e) => { const t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable); };
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (closePopovers()) return;
    if (typing(e)) { e.target.blur(); return; }
    if (roadDraft) { roadDraft = null; renderPanel(); requestRender(); return; }
    if (measure) { measure = null; renderPanel(); requestRender(); return; }
    if (sel) { sel = null; renderPanel(); requestRender(); return; }
    if (tool !== 'explore') setTool('explore');
    return;
  }
  if (typing(e)) return;
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
  if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
  if (mod) return;
  if (e.key === ' ') { spaceDown = true; e.preventDefault(); return; }
  if (e.key === 'Enter' && roadDraft) { finishRoad(); return; }
  if ((e.key === 'Delete' || e.key === 'Backspace') && sel) { e.preventDefault(); deleteSelected(); return; }
  if (e.key === '+' || e.key === '=') { zoomAt(vw / 2, vh / 2, 1.6); return; }
  if (e.key === '-' || e.key === '_') { zoomAt(vw / 2, vh / 2, 1 / 1.6); return; }
  const pan = 120 / view.s;
  if (e.key === 'ArrowLeft') { view.x -= pan; clampView(); requestRender(); e.preventDefault(); }
  else if (e.key === 'ArrowRight') { view.x += pan; clampView(); requestRender(); e.preventDefault(); }
  else if (e.key === 'ArrowUp') { view.y -= pan; clampView(); requestRender(); e.preventDefault(); }
  else if (e.key === 'ArrowDown') { view.y += pan; clampView(); requestRender(); e.preventDefault(); }
  const map = { b: 'monsters', h: 'heroes', g: 'guilds', n: 'people', k: 'market', v: 'explore', s: 'settle', r: 'road', p: 'paint', t: 'tiles', l: 'label', m: 'measure' };
  if (map[e.key.toLowerCase()]) setTool(map[e.key.toLowerCase()]);
});
window.addEventListener('keyup', (e) => { if (e.key === ' ') spaceDown = false; });
function deleteSelected() {
  if (!sel) return;
  if (sel.kind === 'settle') deleteSettlement(sel.id);
  else if (sel.kind === 'road') deleteRoad(sel.id);
  else deleteLabel(sel.id);
}

// ================================================================ UI
function setTool(t, keepSel) {
  if (isPlayer() && PLAYER_HIDDEN_TOOLS.includes(t)) { toast('That tool is for the DM.'); return; }
  tool = t;
  panelMin = false;
  if (t !== 'road') { roadDraft = null; if (sel && sel.kind === 'road') sel = null; }
  if (t !== 'measure') measure = null;
  if (!keepSel && t !== 'explore' && t !== 'market' && t !== 'people' && t !== 'guilds' && !(t === 'settle' && sel && sel.kind === 'settle') && !(t === 'label' && sel && sel.kind === 'label')) sel = null;
  if (t !== 'label' && t !== 'explore' && sel && sel.kind === 'label') sel = null;
  if (t === 'guilds' && sel && sel.kind === 'settle') { market.sid = sel.id; people.sid = sel.id; guildUI.q = null; }
  if (t === 'guilds' && sel && sel.kind !== 'settle') sel = null;
  if (t === 'people' && sel && sel.kind === 'settle') { people.sid = sel.id; people.npc = null; }
  if (t === 'market' && !market.sid && people.sid) market.sid = people.sid;
  if (t === 'people' && sel && sel.kind !== 'settle') sel = null;
  if (t === 'market' && sel && sel.kind === 'settle') { market.sid = sel.id; market.tab = 'town'; }
  if (t === 'market' && sel && sel.kind !== 'settle' && sel.kind !== 'event') sel = null;
  if (t === 'explore' && sel && sel.kind === 'event') sel = null;
  for (const b of document.querySelectorAll('.tool[data-tool]')) b.setAttribute('aria-pressed', String(b.dataset.tool === t));
  canvas.dataset.tool = t;
  renderPanel();
  requestRender();
}
let toastTimer = 0;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
}

// ---------------------------------------------------------------- settlement profile
function profile(s) {
  const tier = TIERS[s.tier];
  const circ = circlesIn(s.x, s.y, s.x, s.y);
  let b = T.biomeAt(s.x, s.y, 8, circ);
  if (b === BB.RIVER || T.isWater(b)) b = s.b != null && !T.isWater(s.b) ? s.b : BB.GRASS;
  const coastal = s.coastal != null ? s.coastal : isCoastal(s.x, s.y);
  const pop = s.pop;
  const h = hashStr(s.id);
  const R = settleR(s);
  const trades = [];
  for (const [name, sv] of TRADES) {
    const exact = pop / sv;
    const n = Math.floor(exact) + (T.hash(h & 0xffff, hashStr(name) & 0xffff, 77) < exact % 1 ? 1 : 0);
    if (n >= 1) trades.push([name, n]);
  }
  trades.sort((a, c) => c[1] - a[1]);
  const exp = (EXPORTS[b] || EXPORTS[5]).slice(0, 3);
  if (coastal) for (const x of COAST_EXPORT) if (!exp.includes(x) && exp.length < 4) exp.push(x);
  const w = RACE_BASE.map((v, i) => v + ((RACE_BOOST[b] || {})[i] || 0) + T.hash(h & 0xffff, i, 91) * 6);
  const tot = w.reduce((a, c) => a + c, 0);
  const races = w.map((v, i) => [RACES[i], v / tot * 100]).sort((a, c) => c[1] - a[1]);
  const top = races.slice(0, 4).map(([n, v]) => [n, Math.round(v)]);
  const other = 100 - top.reduce((a, c) => a + c[1], 0);
  const fauna = (FAUNA[b] || FAUNA[5]).slice().sort((a, c) => crNum(a[1]) - crNum(c[1]));
  const pick = fauna.filter((_, i) => T.hash(h & 0xffff, i, 55) < 0.75).slice(0, 6);
  const clergy = Math.max(s.tier >= 2 ? 1 : 0, Math.round(pop / 40));
  return {
    b, coastal, tierName: placeKind(s), buildings: Math.ceil(pop / tier.ppb),
    acres: Math.PI * R * R * 640, farm: pop / 180,
    guards: pop < 300 ? 0 : Math.max(2, Math.round(pop / 150)), nobles: pop < 300 ? 0 : Math.round(pop / 200), clergy, priests: Math.max(clergy ? 1 : 0, Math.round(clergy / 27)),
    trades, exp, races: top, other, fauna: pick.length ? pick : fauna.slice(0, 4), realm: realmOf(s.x, s.y)
  };
}
const rarity = (cr) => { const v = crNum(cr); return v <= 1 ? 'common' : v <= 4 ? 'uncommon' : 'rare'; };

// ---------------------------------------------------------------- inspector
const BIOME_PAINT = [[5, 'Grassland'], [6, 'Forest'], [7, 'Taiga'], [8, 'Jungle'], [9, 'Swamp'], [10, 'Desert'], [11, 'Scrub'], [12, 'Tundra'], [13, 'Snow'], [14, 'Mountain'], [4, 'Sand'], [2, 'Shallows'], [0, 'Deep sea'], [-1, 'Restore']];
function seg(act, cur, opts) {
  return '<div class="seg" role="group">' + opts.map(([v, l]) => '<button type="button" data-act="' + act + '" data-v="' + v + '" aria-pressed="' + (String(v) === String(cur)) + '">' + esc(l) + '</button>').join('') + '</div>';
}
function renderPanel() {
  const el = $('inspector');
  let html = '';
  const o = selObj();
  if (tool === 'heroes') html = heroPanel();
  else if (tool === 'monsters') html = monPanel();
  else if (tool === 'tiles') html = tilesPanel();
  else if (tool === 'guilds') html = guildPanel();
  else if (tool === 'people') html = peoplePanel();
  else if (tool === 'market') html = marketPanel();
  else if (o && sel.kind === 'settle') html = settlePanel(o);
  else if (o && sel.kind === 'road') html = roadPanel(o);
  else if (o && sel.kind === 'label') html = labelPanel(o);
  else if (tool === 'settle') html = head('Settlements', 'Tap dry land to found a new settlement. Tap an existing one to select it, then drag it to move it.') + '<div class="field"><span class="lab">Size</span>' + seg('tier', settleTier, [[1, 'Village'], [2, 'Town'], [3, 'City'], [4, 'Capital']]) + '</div><p class="hint">A capital starts a new realm, and the borders on the world map redraw around it.</p>';
  else if (tool === 'road') {
    const n = roadDraft ? roadDraft.pts.length / 2 : 0;
    html = head('Draw a road', 'Tap to drop points along the route. Tapping a town snaps to its centre. Tap the last point again, or press Finish, to complete it.') +
      '<div class="field"><span class="lab">Type</span>' + seg('rtype', roadType, [[1, 'Highway'], [2, 'Road'], [3, 'Trail']]) + '</div>' +
      '<p class="meta">' + (n ? n + (n === 1 ? ' point placed' : ' points placed') : 'No points yet') + '</p>' +
      '<div class="actions"><button type="button" class="btn primary" data-act="finish"' + (n < 2 ? ' disabled' : '') + '>Finish road</button><button type="button" class="btn" data-act="cancelroad"' + (n ? '' : ' disabled') + '>Discard</button></div>';
  } else if (tool === 'paint') {
    const world = paint.px * 2 / view.s;
    html = head('Paint terrain', 'Drag across the map to repaint it. On a phone, use two fingers to move the map while this tool is on. With a mouse, right-drag or hold Space to pan.') +
      '<div class="swatches">' + BIOME_PAINT.map(([b, n]) => '<button type="button" class="sw" data-act="biome" data-v="' + b + '" aria-pressed="' + (paint.b === b) + '"><i style="background:' + SWATCH[b] + '"></i><span>' + n + '</span></button>').join('') + '</div>' +
      '<div class="field"><label class="lab" for="f-brush">Brush size</label><input id="f-brush" type="range" min="6" max="90" value="' + paint.px + '"><span class="meta" id="brushInfo">' + fmtDist(world) + ' across at this zoom</span></div>' +
      '<p class="hint">Zoom in before painting fine details such as a clearing or a pond. Restore returns the land to how it was generated.</p>';
  } else if (tool === 'label') html = head('Labels', 'Tap anywhere to pin a note such as "Dragon lair" or "The Weeping Bridge". Tap an existing label to select it, then drag it to move it. Labels stay visible at every zoom.') + '<div class="field"><span class="lab">Size</span>' + seg('lsize', labelSize, [['s', 'Small'], ['m', 'Medium'], ['l', 'Large']]) + '</div>';
  else if (tool === 'measure') {
    let res = '<p class="meta">Tap a start point, then an end point.</p>';
    if (measure && measure.b) { const d = Math.hypot(measure.b[0] - measure.a[0], measure.b[1] - measure.a[1]); res = '<div class="big">' + fmtDist(d) + '</div><p class="meta">' + travelText(d) + '. Fast pace covers 30 mi a day; slow pace 18 mi, but lets the party move stealthily.</p>'; }
    html = head('Measure distance', 'Straight-line distance and overland travel time, using the Player\'s Handbook travel paces.') + res + (measure ? '<div class="actions"><button type="button" class="btn" data-act="clearmeasure">Clear</button></div>' : '');
  }
  // v24: the panel lives in the docked side bar, always open, with breadcrumbs and place tabs (app30)
  panelMin = false;
  el.innerHTML = shellWrap(html);
  el.hidden = false;
  renderCal();
  marketAfterRender();
  peopleAfterRender();
}
const CLOSE_BTN = '<button type="button" class="x" data-act="close" aria-label="Close panel">×</button>';
const MIN_BTN = '<button type="button" class="x mn" data-act="minimise" aria-label="Minimise panel" title="Minimise">–</button>';
// every panel gets a minimise button beside its close button; panels without a header get a slim control bar
function panelControls(html) {
  const i = html.indexOf(CLOSE_BTN);
  if (i >= 0) return html.slice(0, i) + '<span class="xs">' + MIN_BTN + CLOSE_BTN + '</span>' + html.slice(i + CLOSE_BTN.length);
  let lead = '<span></span>', rest = html;
  const m = /^(<div class="mk-body">)?(<button type="button" class="link back"[^>]*>.*?<\/button>)/.exec(html);
  if (m) { lead = m[2]; rest = html.replace(m[2], ''); }
  return '<div class="pbar">' + lead + '<span class="xs">' + MIN_BTN + CLOSE_BTN + '</span></div>' + rest;
}
function minBar(html) {
  const t = document.createElement('div');
  t.innerHTML = html;
  const ti = t.querySelector('.town-name') || t.querySelector('h2') || t.querySelector('.title-in');
  const eb = (ti && ti.parentElement && ti.parentElement.querySelector('.eyebrow')) || t.querySelector('.eyebrow');
  const title = ti ? (ti.value || ti.textContent) : 'Panel';
  return '<div class="minbar"><button type="button" class="mb-open" data-act="restore" aria-label="Expand panel">' + (eb ? '<span class="eyebrow">' + esc(eb.textContent) + '</span>' : '') + '<b>' + esc(title.trim()) + '</b></button><span class="xs"><button type="button" class="x" data-act="restore" aria-label="Expand panel" title="Expand">+</button>' + CLOSE_BTN + '</span></div>';
}
function head(title, sub, eyebrow) {
  return '<div class="ihead"><div>' + (eyebrow ? '<div class="eyebrow">' + eyebrow + '</div>' : '') + '<h2>' + esc(title) + '</h2></div><button type="button" class="x" data-act="close" aria-label="Close panel">×</button></div>' + (sub ? '<p class="sub">' + esc(sub) + '</p>' : '');
}
function settlePanel(s) {
  const P = profile(s);
  const realm = P.realm ? (s.tier === 4 && P.realm.cap.id === s.id ? 'Seat of ' + P.realm.name : P.realm.name) : '';
  let h = '<div class="ihead"><div class="grow"><div class="eyebrow">' + esc(P.tierName) + ' · ' + esc(T.NAMES[P.b]) + (P.coastal ? ' · coastal' : '') + '</div>' +
    '<input id="f-name" class="title-in" value="' + esc(s.name) + '" aria-label="Settlement name" maxlength="40"' + (isPlayer() ? ' readonly' : '') + '></div><button type="button" class="x locate" data-act="locate" aria-label="Show on map" title="Show on map"><svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button><button type="button" class="x" data-act="close" aria-label="Close panel">×</button></div>';
  if (realm) h += '<p class="sub">' + (s.tier === 4 && P.realm.cap.id === s.id ? 'Seat of ' + rLink(P.realm) : rLink(P.realm)) + '</p>';
  h += '<p class="meta orgline"><b>Organisations:</b> ' + orgsShown(s).map((k) => oLink(k, s.id, ORGS[k].short) + branchTag(s, k)).join(' · ') + (guildLevel(s, 'adventurers') < 1 && hallFor(s) ? ' · nearest guild hall in ' + tLink(hallFor(s)) : '') + '</p>';
  h += '<div class="row2 dm-only"><div class="field"><label class="lab" for="f-tier">Size</label><select id="f-tier">' + [1, 2, 3, 4].map((t) => '<option value="' + t + '"' + (t === s.tier ? ' selected' : '') + '>' + ['', 'Hamlet or village', 'Town', 'City', 'Capital (seat of a realm)'][t] + '</option>').join('') + '</select></div>' +
    '<div class="field"><label class="lab" for="f-pop">Population</label><input id="f-pop" type="number" inputmode="numeric" min="10" max="200000" step="10" value="' + s.pop + '"></div></div><p class="meta sizenote">Counts as a <b>' + sizeOf(s).name.toLowerCase() + '</b> (' + SIZE_RANGE[sizeOf(s).k] + ')' + (isCapital(s) ? ' and is the seat of its realm' : '') + '. Changing the population moves it between hamlet, village, town, city and metropolis.</p>';
  if (s.tier === 4) h += '<div class="field"><label class="lab" for="f-realm">Realm name</label><input id="f-realm" value="' + esc(s.realm || '') + '" maxlength="60"></div>';
  if (popNow(s) !== s.pop) h += '<p class="meta"><b>' + fmtInt(popNow(s)) + ' people today</b> (usually ' + fmtInt(s.pop) + '; see History).</p>';
  h += '<dl class="stats">' +
    stat('Buildings', fmtInt(P.buildings)) + stat('Town area', fmtInt(P.acres) + ' acres') + stat('Farmland', (P.farm < 10 ? P.farm.toFixed(1) : fmtInt(P.farm)) + ' sq mi') +
    stat(pop0(s) < 300 ? 'Guards' : pop0(s) < 1000 ? 'Constable & watch' : pop0(s) < 8000 ? 'Watch' : 'Watch (plus garrison)', P.guards ? fmtInt(P.guards) : 'None') + stat('Clergy', fmtInt(P.clergy) + (P.priests ? ' (' + P.priests + ' priests)' : '')) + stat('Noble households', fmtInt(P.nobles)) + '</dl>';
  h += '<section><h3>Trade</h3><p class="meta"><b>Exports:</b> ' + esc(P.exp.join(', ')) + '</p>';
  if (P.trades.length) h += '<ul class="trades">' + P.trades.slice(0, 12).map(([n, c]) => '<li><span>' + esc(n) + '</span><b>' + c + '</b></li>').join('') + '</ul>' + (P.trades.length > 12 ? '<p class="meta">and ' + (P.trades.length - 12) + ' rarer trades</p>' : '');
  else h += '<p class="meta">Too small to support full-time shops. Villagers trade at the nearest town\'s market.</p>';
  h += '</section><section><h3>Folk</h3><ul class="bars">' + P.races.map(([n, v]) => '<li><span>' + n + '</span><i><em style="width:' + v + '%"></em></i><b>' + v + '%</b></li>').join('') + (P.other > 0 ? '<li><span>Others</span><i><em style="width:' + P.other + '%"></em></i><b>' + P.other + '%</b></li>' : '') + '</ul></section>';
  h += civicHtml(s);
  h += historyHtml(s);
  h += layoutHtml(s);
  h += '<section><h3>Wildlife nearby</h3><ul class="fauna">' + P.fauna.map(([n, cr]) => '<li><span>' + monLink(n) + '</span><em class="r-' + rarity(cr) + '">' + rarity(cr) + '</em><b>CR ' + cr + '</b></li>').join('') + '</ul></section>';
  { const ld = townPeople(s, LEADERS[s.tier].length).list.map(withOv); const gmR = roster(s); if (gmR) ld.push(withOv(gmR.list[0])); h += '<section><h3>Notable people</h3><ul class="rels">' + ld.map((p) => '<li><i style="background:' + (GROUP_COL[p.group] || '#999') + '"></i><span><button type="button" class="link" data-pp="npc" data-v="' + esc(p.id) + '">' + esc(npcName(p)) + '</button><small>' + esc(p.job) + '</small></span><span></span></li>').join('') + '</ul></section>'; }
  h += marketSummary(s);
  if (!isPlayer()) {
    const opt = (cur, auto, names) => '<option value=""' + (cur == null ? ' selected' : '') + '>Auto (' + names[auto] + ')</option>' + names.map((n, i) => '<option value="' + i + '"' + (cur === i ? ' selected' : '') + '>' + n + '</option>').join('');
    h += '<div class="row2"><div class="field"><label class="lab" for="f-wealth">Wealth</label><select id="f-wealth">' + opt(s.wealth, autoWealth(s), WEALTH_LV) + '</select></div><div class="field"><label class="lab" for="f-defence">Defence</label><select id="f-defence">' + opt(s.defence, autoDefence(s), DEFENCE_LV) + '</select></div></div>' +
      '<p class="meta">Change how hard hard times hit: wealth softens famine and plague, defences soften war and bandits. Auto leaves the world as generated.</p>';
  }
  if (!isPlayer()) h += '<div class="field"><label class="lab" for="f-notes">Notes</label><textarea id="f-notes" rows="3" placeholder="Rulers, rumours, quest hooks…">' + esc(s.notes || '') + '</textarea></div>';
  h += '<div class="actions"><button type="button" class="btn primary" data-act="zoomto">View streets</button><button type="button" class="btn" data-act="openpeople">Residents</button>' + (gst().party.at === s.id ? '<span class="pill on">The party is here</span>' : '<button type="button" class="btn" data-party="' + esc(s.id) + '">Move the party here</button>') + '' + (isPlayer() ? '' : '<button type="button" class="btn danger" data-act="delete">Delete</button>') + '</div>';
  h += '<p class="hint">' + (tool === 'settle' ? 'Drag the marker to move it. Tap empty land to deselect, then tap again to found a new settlement.' : 'To move it, open the Settle tool and drag it there.') + ' Shop counts follow medieval support values: one shoemaker per 150 people, one bookseller per 6,300.</p>';
  return h;
}
const pop0 = (s) => s.pop;
const stat = (k, v) => '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>';
function roadPanel(r) {
  const len = polyLen(roadGeom(r));
  let ends = '';
  if (r.a) { const a = SBY.get(r.a), b = SBY.get(r.b); if (a && b) ends = tLink(a) + ' to ' + tLink(b); }
  return head(ROADTYPES[r.type].name, '', r.a ? (r.pts ? 'Road · reshaped' : 'Road') : 'Your road') + (ends ? '<p class="sub">' + ends + '</p>' : '') +
    '<div class="field"><span class="lab">Type</span>' + seg('setrtype', r.type, [[1, 'Highway'], [2, 'Road'], [3, 'Trail']]) + '</div>' +
    '<div class="big">' + fmtDist(len) + '</div><p class="meta">' + travelText(len) + '.</p>' +
    '<div class="actions">' + (r.a && r.pts ? '<button type="button" class="btn" data-act="roadreset">Reset shape</button>' : '') + '<button type="button" class="btn danger" data-act="delete">Delete road</button></div>' +
    '<p class="hint">Drag the white dots to reshape the road; the road bends smoothly between them. Double-tap the road to add a dot, or a dot to remove it.' + (r.a ? ' The square ends stay tied to their towns.' : ' Drop an end on a town to join it.') + ' Tap empty ground to finish.</p>';
}
function labelPanel(l) {
  return head('Label', '', 'Map note') +
    '<div class="field"><label class="lab" for="f-ltext">Text</label><input id="f-ltext" value="' + esc(l.text) + '" maxlength="60"></div>' +
    '<div class="field"><span class="lab">Size</span>' + seg('setlsize', l.size, [['s', 'Small'], ['m', 'Medium'], ['l', 'Large']]) + '</div>' +
    '<div class="actions"><button type="button" class="btn danger" data-act="delete">Delete label</button></div><p class="hint">' + (tool === 'label' ? 'Drag the label to move it. Tap empty ground to deselect.' : 'To move it, open the Label tool and drag it there.') + '</p>';
}
$('inspector').addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const act = b.dataset.act, v = b.dataset.v;
  switch (act) {
    case 'close': panelMin = false; if (tool === 'market' || tool === 'people' || tool === 'guilds') { sel = null; setTool('explore'); break; } if (sel) sel = null; else setTool('explore'); renderPanel(); requestRender(); break;
    case 'minimise': panelMin = true; renderPanel(); break;
    case 'restore': panelMin = false; renderPanel(); break;
    case 'tier': settleTier = +v; renderPanel(); break;
    case 'rtype': roadType = +v; renderPanel(); break;
    case 'lsize': labelSize = v; renderPanel(); break;
    case 'biome': paint.b = +v; renderPanel(); break;
    case 'finish': finishRoad(); break;
    case 'cancelroad': roadDraft = null; renderPanel(); requestRender(); break;
    case 'clearmeasure': measure = null; renderPanel(); requestRender(); break;
    case 'delete': deleteSelected(); break;
    case 'setrtype': if (sel) { patchRoad(sel.id, +v); } break;
    case 'setlsize': if (sel) patchLabel(sel.id, { size: v }, 'Resize label'); break;
    case 'openpeople': { const id = sel && sel.kind === 'settle' ? sel.id : market.sid; if (id && SBY.get(id)) { sel = { kind: 'settle', id }; setTool('people', true); people.sid = id; people.npc = null; people.tab = 'residents'; renderPanel(); } break; }
    case 'openmarket': { const s = selObj(); if (s) { setTool('market', true); market.sid = s.id; market.tab = 'town'; renderPanel(); } break; }
    case 'roadreset': if (sel && sel.kind === 'road') resetRoadShape(sel.id); requestRender(); break;
    case 'locate': { const s = selObj(); if (s && sel.kind === 'settle') { flyVis(s.x, s.y, view.s >= TOWN_ZOOM[s.tier] ? view.s : TOWN_ZOOM[s.tier]); pulseTown(s.id); } break; }
    case 'zoomto': { const s = selObj(); if (s) flyTo(s.x, s.y, clamp(Math.min(vw, vh) * 0.42 / settleR(s), PLAN_S * 1.2, MAXS)); break; }
  }
});
$('inspector').addEventListener('change', (e) => {
  const id = e.target.id, s = selObj();
  if (!s) return;
  const v = e.target.value;
  if (id === 'f-name') { const n = v.trim(); if (n) patchSettlement(s.id, { name: n }, 'Rename settlement'); else e.target.value = s.name; }
  else if (id === 'f-tier') patchSettlement(s.id, { tier: +v }, 'Change size');
  else if (id === 'f-pop') { const n = clamp(Math.round(+v || 0), 10, 200000); e.target.value = n; const nt = tierForPop(n, s.tier); patchSettlement(s.id, nt !== s.tier ? { pop: n, tier: nt } : { pop: n }, 'Change population'); }
  else if (id === 'f-realm') { const n = v.trim(); if (n) patchSettlement(s.id, { realm: n }, 'Rename realm'); }
  else if (id === 'f-notes') patchSettlement(s.id, { notes: v.slice(0, 2000) }, 'Edit notes');
  else if (id === 'f-wealth' || id === 'f-defence') { const k = id === 'f-wealth' ? 'wealth' : 'defence', n = v === '' ? undefined : clamp(+v | 0, 0, 3); patchSettlement(s.id, { [k]: n }, (n == null ? 'Auto ' : 'Set ') + k + (n == null ? '' : ': ' + (k === 'wealth' ? WEALTH_LV : DEFENCE_LV)[n].toLowerCase())); }
  else if (id === 'f-ltext') { const n = v.trim(); if (n) patchLabel(s.id, { text: n }, 'Edit label'); }
});
$('inspector').addEventListener('input', (e) => {
  if (e.target.id === 'f-brush') { paint.px = +e.target.value; const i = $('brushInfo'); if (i) i.textContent = fmtDist(paint.px * 2 / view.s) + ' across at this zoom'; requestRender(); }
});
$('inspector').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') e.target.blur(); });

// ---------------------------------------------------------------- toolbar, zoom, ladder
for (const b of document.querySelectorAll('.tool[data-tool]')) b.addEventListener('click', () => {
  // Places goes back to the list (the realm you were in, or the world); everything else opens its tool
  if (b.dataset.go === 'places') { sel = null; setTool('explore'); const box = $('inspector'); if (box) box.scrollTop = 0; return; }
  setTool(b.dataset.tool);
});
$('btnUndo').addEventListener('click', undo);
$('btnRedo').addEventListener('click', redo);
$('zin').addEventListener('click', () => zoomAt(vw / 2, vh / 2, 2));
$('zout').addEventListener('click', () => zoomAt(vw / 2, vh / 2, 0.5));
for (const b of document.querySelectorAll('[data-rung]')) b.addEventListener('click', () => {
  const v = +b.dataset.rung;
  if (v === 0) fitWorld(true); else flyTo(view.x, view.y, v);
});

// ---------------------------------------------------------------- popovers
function closePopovers() {
  let any = false;
  for (const id of ['layersPop', 'worldPop', 'helpPop', 'monPop']) { const el = $(id); if (!el.hidden) { el.hidden = true; any = true; } }
  for (const b of document.querySelectorAll('[aria-expanded]')) b.setAttribute('aria-expanded', 'false');
  if (!$('searchResults').hidden) { $('searchResults').hidden = true; any = true; }
  return any;
}
function togglePop(btn, id) {
  const el = $(id), open = el.hidden;
  closePopovers();
  if (open) { el.hidden = false; btn.setAttribute('aria-expanded', 'true'); }
}
$('btnLayers').addEventListener('click', () => togglePop($('btnLayers'), 'layersPop'));
$('btnWorld').addEventListener('click', () => { togglePop($('btnWorld'), 'worldPop'); renderWorldPop(); });
$('btnHelp').addEventListener('click', () => togglePop($('btnHelp'), 'helpPop'));
for (const k of Object.keys(layers)) {
  const cb = $('lay-' + k);
  cb.checked = layers[k];
  cb.addEventListener('change', () => {
    layers[k] = cb.checked;
    if (k === 'borders') invalidateTiles(null, 0, 9);
    scheduleSave(); requestRender();
  });
}
let worldConfirm = null;
function renderWorldPop() {
  const el = $('worldBody');
  let h = campaignMenuHtml() + '<hr>';
  if (isPlayer()) { el.innerHTML = h + '<p class="meta">World seed and editing are for the DM.</p>'; fillSnapList(); return; }
  h += '<div class="field"><label class="lab" for="f-seed">World seed</label><div class="inline"><input id="f-seed" type="number" inputmode="numeric" value="' + SEED + '"><button type="button" class="btn" data-w="seed">Generate</button></div><p class="meta">The same seed always draws the same world.</p></div>' +
    '<div class="actions"><button type="button" class="btn" data-w="random">New random world</button></div>';
  if (worldConfirm) {
    h += '<div class="confirm"><p>' + esc(worldConfirm.msg) + '</p><div class="actions"><button type="button" class="btn danger" data-w="yes">' + esc(worldConfirm.yes) + '</button><button type="button" class="btn" data-w="no">Keep my map</button></div></div>';
  }
  h += '<hr><div class="field"><span class="lab">Back up or share</span><p class="meta">Your edits save in this browser automatically. Copy the map code to keep a backup or move it to another device.</p><div class="actions"><button type="button" class="btn primary" data-w="copy">Copy map code</button></div>' +
    '<textarea id="f-code" rows="3" placeholder="Paste a map code here to load it"></textarea><div class="actions"><button type="button" class="btn" data-w="load">Load map code</button></div></div>' +
    '<hr><div class="actions"><button type="button" class="btn danger" data-w="clear"' + (JSON.stringify(edits) === JSON.stringify(blankEdits()) ? ' disabled' : '') + '>Clear all my edits</button></div>';
  el.innerHTML = h;
  fillSnapList(); fillWorldList();
}
let fileAction = 'load';
$('worldBody').addEventListener('change', async (e) => {
  if (e.target.id !== 'f-file' || !e.target.files || !e.target.files[0]) return;
  let d;
  try { d = await readCampaignFile(e.target.files[0]); } catch (err) { toast('That file could not be read as a Realmwright campaign.'); return; }
  e.target.value = '';
  if (fileAction === 'merge') {
    const r = mergeCampaign(d);
    if (r.error) { toast(r.error); return; }
    await beforeReplace('Before merging a campaign file');
    commit('Merge campaign file', () => { edits = r.edits; }, { bb: [0, 0, W, H], z0: 0, z1: 20, roads: true, strokes: true, realms: true });
    if (Array.isArray(d.heroes)) r.sum.heroes = addHeroes(d.heroes);
    showDialog('Campaign merged', '<p>' + esc(mergeSummary(r.sum)) + '</p><p class="meta">Undo puts your world back as it was before the merge.</p>');
    saveAll(); renderWorldPop();
    return;
  }
  const same = d.cid && d.cid === campaign.cid;
  const go = async () => { await beforeReplace('Before loading a file'); applyCampaign(d); };
  worldConfirm = { msg: (same ? 'This file is a copy of the world you have open. Loading it replaces your current version with the file\'s; a snapshot is kept first.' : 'Open the world in this file' + (d.mode === 'player' ? ' in player mode' : '') + '? Your current world stays saved under Your other worlds.') + (campaign.shared ? ' Everyone at the table will see the change.' : ''), yes: 'Load file', run: go };
  renderWorldPop();
});
function encodeMap() {
  const json = JSON.stringify({ v: 2, gen: 20, seed: SEED, edits, day: market.day, heroes: heroes.list });
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return 'ATLAS1:' + btoa(bin);
}
function decodeMap(code) {
  const raw = code.trim().replace(/^ATLAS1:/, '');
  const bin = atob(raw.replace(/\s+/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const d = JSON.parse(new TextDecoder().decode(bytes));
  if (!d || typeof d.seed !== 'number' || !d.edits) throw new Error('bad');
  return d;
}
$('worldBody').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-w]');
  if (!b) return;
  const w = b.dataset.w;
  const dirty = history.length > 0 || JSON.stringify(edits) !== JSON.stringify(blankEdits());
  const ask = (msg, yes, run) => { if (!dirty) { run(); return; } worldConfirm = { msg, yes, run }; renderWorldPop(); };
  const shareWarn = campaign.shared ? ' Everyone at the table will see the change.' : '';
  if (w === 'seed') {
    const v = Math.floor(+$('f-seed').value);
    if (!Number.isFinite(v)) { toast('Enter a whole number for the seed.'); return; }
    ask('Start a new world from seed ' + v + '? Your current world stays saved under Your other worlds.' + shareWarn, 'New world', async () => { await beforeReplace('Before starting a new world'); closePopovers(); campaign.cid = newCid(); campaign.lastJson = ''; regenerate(v, false, null, null, () => { applyMode(); saveAll(true); }); });
  } else if (w === 'random') {
    ask('Start a new random world? Your current world stays saved under Your other worlds.' + shareWarn, 'New world', async () => { await beforeReplace('Before starting a new world'); closePopovers(); campaign.cid = newCid(); campaign.lastJson = ''; regenerate(1000 + Math.floor(Math.random() * 900000), false, null, null, () => { applyMode(); saveAll(true); }); });
  } else if (w === 'backup') downloadBackup();
  else if (w === 'file' || w === 'merge') { fileAction = w === 'merge' ? 'merge' : 'load'; const f = $('f-file'); if (f) f.click(); }
  else if (w === 'handout') downloadHandout();
  else if (w === 'setpw') { const v = ($('f-setpw') || {}).value || ''; await setDmPassword(v); renderWorldPop(); }
  else if (w === 'mode') { if (b.dataset.v === 'player') { if (!edits.dmLock) toast('Tip: set a DM password so players cannot switch back without it.'); await setMode('player'); } else if (!isPlayer()) return; else if (!edits.dmLock) await setMode('dm'); else { const f = $('f-dmpw'); if (f) f.focus(); toast('Enter the DM password to switch.'); } renderWorldPop(); }
  else if (w === 'unlock') { const ok = await setMode('dm', ($('f-dmpw') || {}).value || ''); if (ok) renderWorldPop(); }
  else if (w === 'snap') { const key = b.dataset.v; const r = await readSnapshot(key); if (!r || !r.save) { toast('That snapshot could not be read.'); return; } const at = +String(key).split(':').pop(); worldConfirm = { msg: 'Go back to the snapshot from ' + new Date(at).toLocaleString('en-GB') + (r.why ? ' (' + r.why.toLowerCase() + ')' : '') + '? A snapshot of the world as it is now is kept first, so this can be undone.' + shareWarn, yes: 'Restore snapshot', run: async () => { await beforeReplace('Before restoring a snapshot'); const S = Object.assign({}, r.save, { cid: campaign.cid, mode: campaign.mode, view: null }); loadSaveObject(S); if (r.heroes.length) addHeroes(r.heroes); } }; renderWorldPop(); }
  else if (w === 'sharestart') { await shareStart(); }
  else if (w === 'shareretry') { sendErrShown = false; shareResync(); pumpWrites(); toast('Trying again…'); setTimeout(renderWorldPop, 1500); }
  else if (w === 'sharestop') { worldConfirm = { msg: 'Stop sharing this world live? Players and co-DMs keep the copy they have in their browser, but it stops updating. Your world stays here.', yes: 'Stop sharing', run: () => shareStop() }; renderWorldPop(); }
  else if (w === 'openw') { const cid = b.dataset.v; if (campaign.shared) { toast('This page is sharing its world live. Open other worlds from your own copy of the atlas.'); return; } await openWorld(cid); }
  else if (w === 'forgetw') { const cid = b.dataset.v; worldConfirm = { msg: 'Delete this world and its snapshots from this browser? Download its backup first if you might want it again (open it, then Download backup file).', yes: 'Delete world', run: async () => { await forgetWorld(cid); renderWorldPop(); toast('World deleted from this browser.'); } }; renderWorldPop(); }
  else if (w === 'yes') { const r = worldConfirm && worldConfirm.run; worldConfirm = null; if (r) r(); }
  else if (w === 'no') { worldConfirm = null; renderWorldPop(); }
  else if (w === 'copy') {
    const code = encodeMap();
    const ta = $('f-code');
    try { await navigator.clipboard.writeText(code); toast('Map code copied. Paste it somewhere safe.'); }
    catch (err) { ta.value = code; ta.focus(); ta.select(); toast('Copying was blocked. The code is selected below; copy it by hand.'); }
  } else if (w === 'load') {
    const code = $('f-code').value;
    if (!code.trim()) { toast('Paste a map code into the box first.'); return; }
    let d;
    try { d = decodeMap(code); } catch (err) { toast('That map code could not be read. Check it was copied in full.'); return; }
    ask('Open the world in this code? Your current world stays saved under Your other worlds.' + shareWarn, 'Load code', async () => { await beforeReplace('Before loading a map code'); loadSaveObject({ cid: d.cid || newCid(), seed: d.seed, edits: d.edits, day: d.day, gen: d.gen, heroes: d.heroes }); });
  } else if (w === 'clear') {
    worldConfirm = { msg: 'This removes every settlement, road, label and paint stroke you have changed, and restores the generated world. A snapshot is kept first, so you can go back.' + shareWarn, yes: 'Clear edits', run: async () => { await beforeReplace('Before clearing all edits'); closePopovers(); regenerate(SEED, false, null, null, () => saveAll(true)); } };
    renderWorldPop();
  }
});

// ---------------------------------------------------------------- search
function searchItems(q) {
  q = q.trim().toLowerCase();
  if (!q) return [];
  const out = [];
  for (const R of REALMS) if (R.name.toLowerCase().includes(q)) out.push({ kind: 'realm', name: R.name, sub: 'Realm', x: R.cx, y: R.cy, s: 0.9, rank: 6 });
  for (const s of SET) if (s.name.toLowerCase().includes(q)) out.push({ kind: 'settle', id: s.id, name: s.name, sub: placeKind(s) + ' · ' + fmtInt(s.pop), x: s.x, y: s.y, s: { 4: 4, 3: 9, 2: 26, 1: 60 }[s.tier], rank: s.tier + (s.name.toLowerCase().startsWith(q) ? 1 : 0) });
  for (const l of edits.labels) if (l.text.toLowerCase().includes(q)) out.push({ kind: 'label', id: l.id, name: l.text, sub: 'Your label', x: l.x, y: l.y, s: Math.max(view.s, 20), rank: 5 });
  for (const r of searchPeople(q)) out.push(r);
  for (const p of edits.monAdd || []) if (p.name.toLowerCase().includes(q)) out.push({ kind: 'monp', id: p.id, name: p.name + (p.count > 1 ? ' ×' + p.count : ''), sub: 'Your placed creature', rank: 4 });
  for (const hh of heroes.list) if ((hh.name || '').toLowerCase().includes(q)) out.push({ kind: 'hero', id: hh.id, name: hh.name, sub: 'Your hero · level ' + hh.level + ' ' + CLASSES5[hh.cls].name.toLowerCase(), rank: 8 });
  for (const e of eventsWindow(market.day)) if (e.end > market.day && e.start <= market.day + 14 && e.name.toLowerCase().includes(q)) out.push({ kind: 'event', id: e.id, name: e.name, sub: EVT[e.type].name + (e.start > market.day ? ' · starts in ' + (e.start - market.day) + 'd' : ' · now'), rank: 4.5 });
  out.sort((a, b) => b.rank - a.rank || a.name.localeCompare(b.name));
  const res = out.slice(0, 7);
  if (q.length >= 3) { const mon = allMonNames().find((n) => n.toLowerCase() === q); res.push(mon ? { kind: 'mon', name: mon, sub: 'Creature card', rank: 0 } : { kind: 'ext', url: AID.monster(q), name: 'Look up "' + q + '"', sub: 'Monster Manual on AideDD ↗', rank: 0 }); }
  return res;
}
let searchList = [];
$('search').addEventListener('input', () => {
  searchList = searchItems($('search').value);
  const el = $('searchResults');
  if (!$('search').value.trim()) { el.hidden = true; return; }
  el.innerHTML = searchList.length ? searchList.map((r, i) => '<button type="button" data-i="' + i + '"><span>' + esc(r.name) + '</span><small>' + esc(r.sub) + '</small></button>').join('') : '<p class="meta">Nothing matches.</p>';
  el.hidden = false;
});
$('search').addEventListener('keydown', (e) => { if (e.key === 'Enter' && searchList[0]) goSearch(searchList[0]); });
$('searchResults').addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) goSearch(searchList[+b.dataset.i]); });
function goSearch(r) {
  $('searchResults').hidden = true;
  $('search').value = '';
  $('search').blur();
  panelMin = false;
  if (r.kind === 'npc') { if (tool !== 'people') setTool('people', true); openPerson(r.id); return; }
  if (r.kind === 'event') { openEvent(findEvent(r.id)); return; }
  if (r.kind === 'hero') { openHero(r.id); return; }
  if (r.kind === 'mon') { showMonster(r.name); return; }
  if (r.kind === 'monp') { openMonster(r.id, true); return; }
  if (r.kind === 'ext') { window.open(r.url, '_blank', 'noopener'); return; }
  if (r.kind === 'realm') { const R = REALMS.find((x) => x.name === r.name); if (R) { goRealm(R.cap.id); return; } }
  if (r.kind === 'settle' || r.kind === 'label') { setTool('explore'); sel = { kind: r.kind, id: r.id }; renderPanel(); }
  flyTo(r.x, r.y, r.s);
}

// ---------------------------------------------------------------- persistence
let saveTimer = 0;
function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 500); }
// saving goes to the browser's database with local storage as a second copy, and warns if both fail (see app19)
function saveNow() { saveAll(); }
function loadSaved() {
  try { const raw = localStorage.getItem(STORE_KEY); if (!raw) return null; const d = JSON.parse(raw); return d && typeof d.seed === 'number' ? d : null; }
  catch (e) { return null; }
}
window.addEventListener('pagehide', saveNow);
document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });

// ---------------------------------------------------------------- world lifecycle
function regenerate(seed, keepView, newEdits, restoreView, after) {
  $('loading').hidden = false;
  setTimeout(() => {
    SEED = seed | 0;
    BASE = generateWorld(SEED);
    WORLD_NAME = worldNameFor(SEED);
    edits = newEdits || blankEdits();
    history = []; future = [];
    tiles.clear(); planCache.clear(); geomCache.clear(); planRast.clear(); planRastPx = 0; metaCache.clear(); planQueue.length = 0;
    queue = [];
    pxChunks.clear(); pxQueue = [];
    roadsVer++; strokesVer++;
    sel = null; roadDraft = null; measure = null;
    applyEdits();
    marketInvalidate();
    peopleInvalidate();
    people.sid = null; people.npc = null;
    $('worldName').textContent = WORLD_NAME;
    $('seedLabel').textContent = SEED;
    if (!keepView) fitWorld(false);
    if (restoreView) { view.x = +restoreView.x || W / 2; view.y = +restoreView.y || H / 2; view.s = +restoreView.s || minS; clampView(); }
    renderPanel(); updateUndo(); scheduleSave();
    $('loading').hidden = true;
    if (after) { try { after(); } catch (e) { console.error(e); } }
    if (typeof shareAfterRegenerate === 'function') shareAfterRegenerate();
    requestRender();
  }, 40);
}
async function boot() {
  new ResizeObserver(resize).observe(canvas);
  resize();
  initWorkers();
  const saved = await loadBest();
  if (saved) { campaign.mode = saved.mode === 'player' ? 'player' : 'dm'; campaign.lastBackup = +saved.lastBackup || 0; campaign.savedAt = +saved.savedAt || 0; }
  if (!campaign.cid) campaign.cid = newCid();
  if (saved && saved.layers) for (const k of Object.keys(layers)) if (typeof saved.layers[k] === 'boolean') { layers[k] = saved.layers[k]; $('lay-' + k).checked = layers[k]; }
  const seed = saved ? saved.seed : 1000 + Math.floor(Math.random() * 900000);
  if (saved && saved.market && Number.isFinite(+saved.market.day)) { market.day = Math.max(0, Math.round(+saved.market.day)); if ([400, 1500, 4000].includes(+saved.market.speed)) market.speed = +saved.market.speed; }
  regenerate(seed, false, saved ? Object.assign(blankEdits(), saved.edits || {}) : null, saved && saved.view, () => { applyMode(); if (saved) versionNotice(saved.gen || (saved.v === 1 ? 19 : 0)); bootNotices(); if (typeof shareBoot === 'function') shareBoot(); });
  setTool('explore');
  storageInfo();
  if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('16px "IM Fell English SC"'), document.fonts.load('italic 16px "IM Fell English"')]).then(() => { hudCache = ''; requestRender(); }).catch(() => {});
  setInterval(() => { if (!document.hidden) saveNow(); }, 15000);
}
boot().catch((e) => { console.error(e); });
})();
