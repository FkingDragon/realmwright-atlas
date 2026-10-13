
// ================================================================ map interaction (v14): clickable names, road shaping
let hoverSid = null, pulse = null;
// the town the panel is about, highlighted on the map
function focusTown() {
  if (sel && sel.kind === 'settle') return sel.id;
  if (tool === 'market' || tool === 'guilds') return market.sid || null;
  if (tool === 'people') return people.sid || null;
  return null;
}
function labelAt(px, py) {
  for (let i = markers.length - 1; i >= 0; i--) {
    const m = markers[i];
    if ((m.kind === 'slabel' || m.kind === 'rlabel') && px >= m.r[0] - 3 && px <= m.r[2] + 3 && py >= m.r[1] - 3 && py <= m.r[3] + 3) return m;
  }
  return null;
}
// a brief ring that shows where a town is after following a link to it
function pulseTown(id) { pulse = { id, t: performance.now() }; requestRender(); }
function drawPulse() {
  if (!pulse) return;
  const s = SBY.get(pulse.id), k = (performance.now() - pulse.t) / 1400;
  if (!s || k >= 1) { pulse = null; return; }
  const base = plansDrawn.has(s.id) ? settleR(s) * view.s + 6 : 12;
  for (const off of [0, 0.35]) {
    const q = k - off;
    if (q < 0 || q > 0.65) continue;
    const f = q / 0.65;
    ctx.strokeStyle = 'rgba(227,179,65,' + (0.9 * (1 - f)).toFixed(3) + ')';
    ctx.lineWidth = 3 * (1 - f) + 1;
    ctx.beginPath(); ctx.arc(sx(s.x), sy(s.y), base + 6 + f * 38, 0, Math.PI * 2); ctx.stroke();
  }
  requestRender();
}

// ---------------------------------------------------------------- roads: selecting and reshaping in the Road tool
function roadHit(px, py) {
  if (!layers.roads) return null;
  const tol = 8 / view.s, wx = wxOf(px), wy = wyOf(py);
  let rb = null, rd = 1e9;
  const st = ++QSTAMP;
  RGRID.query(wx - tol, wy - tol, wx + tol, wy + tol, (r) => {
    if (r._q === st) return;
    r._q = st;
    if (!roadVisible(r.type)) return;
    const p = roadGeom(r);
    const lim = tol + ROADTYPES[r.type].ft * FT / 2;
    for (let i = 2; i < p.length; i += 2) {
      const d = segDist(wx, wy, p[i - 2], p[i - 1], p[i], p[i + 1]);
      if (d < lim && d < rd) { rd = d; rb = r; }
    }
  });
  return rb ? { kind: 'road', id: rb.id } : null;
}
// the editable form of a road: its control points and which of them carry a draggable dot
function roadEditable(r) {
  const gen = !!r.a;
  const pts = r.pts ? Array.from(r.pts) : Array.from(roadRaw(r));
  if (gen) { const A = SBY.get(r.a), B = SBY.get(r.b); if (A && B) { pts[0] = A.x; pts[1] = A.y; pts[pts.length - 2] = B.x; pts[pts.length - 1] = B.y; } }
  const n = pts.length / 2;
  let h = r.h ? r.h.filter((i) => i >= 0 && i < n) : null;
  if (!h || h.length < 2) {
    if (!gen) h = Array.from({ length: n }, (_, i) => i);
    else {
      const k = Math.min(n, clamp(2 + Math.round(polyLen(pts) / 15), 3, 10)), set = new Set();
      for (let i = 0; i < k; i++) set.add(Math.round(i * (n - 1) / (k - 1)));
      h = [...set].sort((a, b) => a - b);
    }
  }
  if (h[0] !== 0) h.unshift(0);
  if (h[h.length - 1] !== n - 1) h.push(n - 1);
  return { pts, h, gen };
}
// move one dot; the road between it and its neighbouring dots bends smoothly with it
function bendRoad(E, j, dx, dy) {
  const pts = E.pts.slice(), hi = E.h[j], hp = j > 0 ? E.h[j - 1] : null, hn = j < E.h.length - 1 ? E.h[j + 1] : null;
  pts[hi * 2] += dx; pts[hi * 2 + 1] += dy;
  const ease = (t) => t * t * (3 - 2 * t);
  if (hp != null) for (let i = hp + 1; i < hi; i++) { const w = ease((i - hp) / (hi - hp)); pts[i * 2] += dx * w; pts[i * 2 + 1] += dy * w; }
  if (hn != null) for (let i = hi + 1; i < hn; i++) { const w = ease((hn - i) / (hn - hi)); pts[i * 2] += dx * w; pts[i * 2 + 1] += dy * w; }
  return pts;
}
const fixedEnd = (E, j) => E.gen && (j === 0 || j === E.h.length - 1);
function nodeAt(r, p) {
  const E = roadEditable(r);
  let best = -1, bd = 13;
  for (let j = 0; j < E.h.length; j++) {
    const i = E.h[j], d = Math.hypot(sx(E.pts[i * 2]) - p.x, sy(E.pts[i * 2 + 1]) - p.y);
    if (d < bd) { bd = d; best = j; }
  }
  return best;
}
function saveRoadShape(id, pts, h, label) {
  const r = RBY.get(id);
  if (!r) return;
  const p = pts.map(r5);
  let bb = [Infinity, Infinity, -Infinity, -Infinity];
  for (let i = 0; i < p.length; i += 2) bb = [Math.min(bb[0], p[i]), Math.min(bb[1], p[i + 1]), Math.max(bb[2], p[i]), Math.max(bb[3], p[i + 1])];
  bb = union(bb, r._bb);
  commit(label, () => {
    const u = edits.radd.find((q) => q.id === id);
    if (u) { u.pts = p; u.h = h.slice(); }
    else edits.rov[id] = Object.assign({}, edits.rov[id], { pts: p, h: h.slice() });
  }, { bb: [bb[0] - 0.02, bb[1] - 0.02, bb[2] + 0.02, bb[3] + 0.02], z0: 14, z1: 20, roads: true });
}
function resetRoadShape(id) {
  const r = RBY.get(id);
  if (!r || !r.a || !edits.rov[id] || !edits.rov[id].pts) return;
  commit('Reset road shape', () => { const o = Object.assign({}, edits.rov[id]); delete o.pts; delete o.h; if (Object.keys(o).length) edits.rov[id] = o; else delete edits.rov[id]; }, { bb: r._bb, z0: 14, z1: 20, roads: true });
}
// double-tap: on a dot removes it, on the road adds one
function roadNodeToggle(r, p) {
  const E = roadEditable(r), j = nodeAt(r, p);
  if (j >= 0) {
    if (fixedEnd(E, j)) { toast('The ends of this road are tied to its towns. Move a town to move them.'); return; }
    const hi = E.h[j];
    if (!E.gen) {
      if (E.pts.length <= 4) { toast('A road needs at least two points.'); return; }
      E.pts.splice(hi * 2, 2);
      const h = E.h.filter((x) => x !== hi).map((x) => (x > hi ? x - 1 : x));
      saveRoadShape(r.id, E.pts, h, 'Remove road point');
    } else saveRoadShape(r.id, E.pts, E.h.filter((x) => x !== hi), 'Remove road point');
    return;
  }
  // nearest stretch of the control line
  let bi = -1, bd = 16, bt = 0;
  for (let i = 0; i + 1 < E.pts.length / 2; i++) {
    const ax = sx(E.pts[i * 2]), ay = sy(E.pts[i * 2 + 1]), bx = sx(E.pts[i * 2 + 2]), by = sy(E.pts[i * 2 + 3]);
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
    const t = clamp(((p.x - ax) * dx + (p.y - ay) * dy) / L2, 0, 1), d = Math.hypot(ax + dx * t - p.x, ay + dy * t - p.y);
    if (d < bd) { bd = d; bi = i; bt = t; }
  }
  if (bi < 0) return;
  if (E.gen) {
    const idx = bt < 0.5 ? bi : bi + 1;
    if (!E.h.includes(idx)) saveRoadShape(r.id, E.pts, E.h.concat(idx).sort((a, b) => a - b), 'Add road point');
    return;
  }
  const x = E.pts[bi * 2] + (E.pts[bi * 2 + 2] - E.pts[bi * 2]) * bt, y = E.pts[bi * 2 + 1] + (E.pts[bi * 2 + 3] - E.pts[bi * 2 + 1]) * bt;
  E.pts.splice(bi * 2 + 2, 0, x, y);
  const h = E.h.map((v) => (v > bi ? v + 1 : v));
  h.push(bi + 1);
  saveRoadShape(r.id, E.pts, h.sort((a, b) => a - b), 'Add road point');
}
function roadPreviewPts() {
  if (!drag || drag.kind !== 'rnode' || !drag.moved) return null;
  return bendRoad(drag.E, drag.j, (drag.X - drag.x0) / view.s, (drag.Y - drag.y0) / view.s);
}
// selected road: highlight, live preview while dragging, and its dots in the Road tool
function drawRoadEdit(r) {
  const s = view.s;
  const prev = roadPreviewPts();
  const geom = prev ? chaikin(prev, 3) : roadGeom(r);
  const path = new Path2D(); tracePoly(path, geom);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(227,179,65,0.45)'; ctx.lineWidth = Math.max(8, ROADTYPES[r.type].ft * FT * s + 8); ctx.stroke(path);
  if (prev) { ctx.strokeStyle = ROAD_STYLE[r.type].map; ctx.lineWidth = Math.max(2, ROADTYPES[r.type].ft * FT * s); ctx.stroke(path); }
  if (tool !== 'road') return;
  const E = roadEditable(r), pts = prev || E.pts;
  for (let j = 0; j < E.h.length; j++) {
    const i = E.h[j], X = sx(pts[i * 2]), Y = sy(pts[i * 2 + 1]);
    if (X < -20 || X > vw + 20 || Y < -20 || Y > vh + 20) continue;
    if (fixedEnd(E, j)) { ctx.fillStyle = '#3b2a14'; ctx.fillRect(X - 3.5, Y - 3.5, 7, 7); continue; }
    const on = drag && drag.kind === 'rnode' && drag.j === j;
    ctx.fillStyle = on ? '#e2c37a' : '#f6eed8'; ctx.strokeStyle = '#3b2a14'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(X, Y, on ? 8 : 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
}
// pointer: grabbing a dot of the selected road in the Road tool
function roadPress(p) {
  if (tool !== 'road' || (roadDraft && roadDraft.pts.length) || !sel || sel.kind !== 'road') return false;
  const r = RBY.get(sel.id);
  if (!r) return false;
  const j = nodeAt(r, p);
  if (j < 0) return false;
  const E = roadEditable(r);
  if (fixedEnd(E, j)) return false;
  drag = { kind: 'rnode', id: r.id, j, E, x0: p.x, y0: p.y, X: p.x, Y: p.y, moved: false };
  return true;
}
function roadRelease(p) {
  const d = drag;
  drag = null;
  if (!d || !d.moved) return false;
  let pts = bendRoad(d.E, d.j, (p.x - d.x0) / view.s, (p.y - d.y0) / view.s);
  const hi = d.E.h[d.j];
  // an end of a hand-drawn road dropped on a town snaps to its centre
  if (!d.E.gen && (hi === 0 || hi === pts.length / 2 - 1)) { const sn = snapToSettlement(p.x, p.y); if (sn) { pts[hi * 2] = sn[0]; pts[hi * 2 + 1] = sn[1]; } }
  saveRoadShape(d.id, pts, d.E.h, 'Reshape road');
  return true;
}
// hover: hand cursor over names and roads you can pick, and a highlight on the name
function interHover(p) {
  let cur = '', sid = null;
  const drafting = roadDraft && roadDraft.pts.length;
  if (tool === 'road' && !drafting) {
    if (sel && sel.kind === 'road') { const r = RBY.get(sel.id); if (r) { const j = nodeAt(r, p); if (j >= 0 && !fixedEnd(roadEditable(r), j)) cur = 'grab'; } }
    if (!cur && !snapToSettlement(p.x, p.y) && roadHit(p.x, p.y)) cur = 'pointer';
  } else if ((tool === 'settle' || tool === 'label') && sel && (sel.kind === 'settle' || sel.kind === 'label')) {
    const h = labelAt(p.x, p.y) ? null : hitTest(p.x, p.y);
    if (h && h.kind === sel.kind && h.id === sel.id) cur = 'grab';
    else if (h && (h.kind === 'settle' || h.kind === 'label')) cur = 'pointer';
  } else if (tool === 'settle' || tool === 'label') {
    const h = labelAt(p.x, p.y) ? null : hitTest(p.x, p.y);
    if (h && h.kind === (tool === 'settle' ? 'settle' : 'label')) cur = 'pointer';
  } else if (tool === 'explore' || tool === 'market' || tool === 'people' || tool === 'guilds' || tool === 'heroes' || tool === 'monsters') {
    const m = labelAt(p.x, p.y);
    if (m) { cur = 'pointer'; sid = m.kind === 'slabel' ? m.id : 'R:' + m.id; }
    else if (tool !== 'monsters' && markers.some((q) => q.kind === 'poi' && Math.hypot(q.X - p.x, q.Y - p.y) < q.r)) cur = 'pointer';
  }
  if (canvas.style.cursor !== cur) canvas.style.cursor = cur;
  if (sid !== hoverSid) { hoverSid = sid; requestRender(); }
}
