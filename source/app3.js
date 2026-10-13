
// ================================================================ view
const canvas = $('map');
const ctx = canvas.getContext('2d');
let vw = 1, vh = 1, dpr = 1;
const view = { x: W / 2, y: H / 2, s: 0.3 };
let minS = 0.1;
const MAXS = 120 * 1056; // 120 px per 5-ft square
let VB = [0, 0, 0, 0];
const sx = (x) => (x - view.x) * view.s + vw / 2;
const sy = (y) => (y - view.y) * view.s + vh / 2;
const wxOf = (px) => view.x + (px - vw / 2) / view.s;
const wyOf = (py) => view.y + (py - vh / 2) / view.s;
function clampView() {
  view.s = clamp(view.s, minS, MAXS);
  view.x = clamp(view.x, 0, W);
  view.y = clamp(view.y, 0, H);
}
function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  vw = Math.max(1, canvas.clientWidth); vh = Math.max(1, canvas.clientHeight);
  canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
  minS = Math.min(vw / W, vh / H) * 0.92;
  clampView();
  requestRender();
}
let rafPending = false, anim = null;
function requestRender() { if (!rafPending) { rafPending = true; requestAnimationFrame(frame); } }
function frame(ts) {
  rafPending = false;
  if (anim) stepAnim(ts);
  try { render(); } catch (e) { console.error(e); }
}
const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function flyTo(x, y, s, dur) {
  s = clamp(s, minS, MAXS);
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { view.x = x; view.y = y; view.s = s; anim = null; clampView(); requestRender(); return; }
  const dist = Math.hypot(x - view.x, y - view.y) * Math.max(view.s, s);
  if (dist > vw * 4) {
    const mid = Math.min(view.s, s, vw / (Math.hypot(x - view.x, y - view.y) * 1.4));
    anim = { from: { ...view }, to: { x: (view.x + x) / 2, y: (view.y + y) / 2, s: Math.max(minS, mid) }, t0: null, dur: 550, then: { x, y, s, dur: 650 } };
  } else anim = { from: { ...view }, to: { x, y, s }, t0: null, dur: dur || 750 };
  requestRender();
}
function stepAnim(ts) {
  if (anim.t0 == null) anim.t0 = ts;
  const k = clamp((ts - anim.t0) / anim.dur, 0, 1), e = easeIO(k);
  const f = anim.from, t = anim.to;
  const s = Math.exp(Math.log(f.s) + (Math.log(t.s) - Math.log(f.s)) * e);
  let w = e;
  if (Math.abs(Math.log(t.s / f.s)) > 0.05) w = (1 / f.s - 1 / s) / (1 / f.s - 1 / t.s);
  view.s = s; view.x = f.x + (t.x - f.x) * w; view.y = f.y + (t.y - f.y) * w;
  clampView();
  if (k >= 1) {
    const nx = anim.then;
    anim = nx ? { from: { ...view }, to: { x: nx.x, y: nx.y, s: nx.s }, t0: null, dur: nx.dur } : null;
  }
  requestRender();
}
function zoomAt(px, py, factor) {
  const wx = wxOf(px), wy = wyOf(py);
  view.s = clamp(view.s * factor, minS, MAXS);
  view.x = wx - (px - vw / 2) / view.s;
  view.y = wy - (py - vh / 2) / view.s;
  clampView();
  requestRender();
}
function fitScale() { return vw < 760 && vh > vw ? Math.max(minS, Math.min(vw / W * 2.4, vh / H * 0.92)) : minS; }
const fitWorld = (animate) => (animate ? flyTo(W / 2, H / 2, fitScale()) : (view.x = W / 2, view.y = H / 2, view.s = fitScale(), requestRender()));

// ================================================================ rendering
const TIER_VIS = { 4: 0, 3: 0.32, 2: 1.1, 1: 3.2 };
const LABEL_VIS = { 4: 0, 3: 0.45, 2: 1.8, 1: 6 };
const PLAN_S = 260;
let markers = [];   // screen-space hit targets
let labelHits = [];
let plansDrawn = new Set();
let pendingPreview = null;

function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#0f1215';
  ctx.fillRect(0, 0, vw, vh);
  const s = view.s;
  VB = [wxOf(0), wyOf(0), wxOf(vw), wyOf(vh)];
  // the battle map (pixel art) fades in over the map at 5-ft-square zoom; once it covers the view the map underneath is skipped
  const pa = pxAlpha();
  const covered = pa >= 1 && pxCovered();
  if (!covered) drawTiles(); else pxQueueTilesClear();
  if (layers.roads && !covered) drawRoads();
  drawPlans(covered);
  if (pa > 0) drawPixels(pa);   // over the town drawing, so the two cross-fade
  drawHeat();
  if (layers.grid) drawGrid();
  drawTilesOverlay();
  drawNeatline();
  drawEventAreas();
  drawMarkers();
  drawPlaces();
  drawEventIcons();
  drawOccupied();
  drawMonsters();
  drawPeopleBadges();
  drawHeroBadges();
  drawParty();
  drawGuildBadges();
  drawPeoplePins();
  drawOverlay();
  drawPulse();
  updateHud();
}

function drawTiles() {
  const s = view.s;
  const z = clamp(Math.floor(Math.log2(W * s / RES)), 0, ZMAX);
  const TS = W / Math.pow(2, z), nX = Math.pow(2, z), nY = Math.ceil(H / TS);
  const tx0 = clamp(Math.floor(VB[0] / TS), 0, nX - 1), tx1 = clamp(Math.floor(VB[2] / TS), 0, nX - 1);
  const ty0 = clamp(Math.floor(VB[1] / TS), 0, nY - 1), ty1 = clamp(Math.floor(VB[3] / TS), 0, nY - 1);
  ctx.save();
  const X0 = sx(0), Y0 = sy(0);
  ctx.beginPath(); ctx.rect(X0, Y0, W * s, H * s); ctx.clip();
  ctx.fillStyle = '#26506a'; ctx.fillRect(X0, Y0, W * s, H * s);
  ctx.imageSmoothingEnabled = true;
  visibleKeys = new Set();
  const need = [];
  let missing = 0;
  const cx = view.x, cy = view.y;
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    const t = getTile(z, tx, ty);
    visibleKeys.add(t.k);
    tiles.delete(t.k); tiles.set(t.k, t);
    const a = Math.round(sx(tx * TS)), b = Math.round(sx((tx + 1) * TS)), c = Math.round(sy(ty * TS)), d = Math.round(sy((ty + 1) * TS));
    if (t.canvas) ctx.drawImage(t.canvas, a, c, b - a, d - c);
    else { missing++; drawFallback(z, tx, ty, a, c, b - a, d - c); }
    if ((!t.canvas || t.stale) && !t.pend) need.push([Math.hypot((tx + 0.5) * TS - cx, (ty + 0.5) * TS - cy), t]);
  }
  ctx.restore();
  need.sort((p, q) => p[0] - q[0]);
  const pre = [];
  if (missing > 0 && z >= 3) {
    const zc = z - 3, TC = W / Math.pow(2, zc);
    const ncy = Math.ceil(H / TC);
    for (let ty = clamp(Math.floor(VB[1] / TC), 0, ncy - 1); ty <= clamp(Math.floor(VB[3] / TC), 0, ncy - 1); ty++)
      for (let tx = clamp(Math.floor(VB[0] / TC), 0, Math.pow(2, zc) - 1); tx <= clamp(Math.floor(VB[2] / TC), 0, Math.pow(2, zc) - 1); tx++) {
        const t = getTile(zc, tx, ty);
        visibleKeys.add(t.k);
        if (!t.canvas && !t.pend) pre.push(t);
      }
  }
  queue = pre.concat(need.map((n) => n[1]));
  pump();
  evictTiles();
}
function drawFallback(z, tx, ty, X, Y, Wd, Hd) {
  for (let k = 1; k <= Math.min(z, 8); k++) {
    const p = tiles.get(tileKey(z - k, tx >> k, ty >> k));
    if (p && p.canvas) {
      const sub = RES / Math.pow(2, k);
      ctx.drawImage(p.canvas, (tx - ((tx >> k) << k)) * sub, (ty - ((ty >> k) << k)) * sub, sub, sub, X, Y, Wd, Hd);
      return;
    }
  }
  if (z < ZMAX) {
    const ch = [];
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const c = tiles.get(tileKey(z + 1, tx * 2 + dx, ty * 2 + dy));
      if (!c || !c.canvas) return;
      ch.push([c, dx, dy]);
    }
    for (const [c, dx, dy] of ch) ctx.drawImage(c.canvas, X + dx * Wd / 2, Y + dy * Hd / 2, Wd / 2, Hd / 2);
  }
}

const ROAD_STYLE = {
  1: { map: '#7a3527', w: 2.2, ground: '#a99d88', dash: null },
  2: { map: '#6a4a2c', w: 1.5, ground: '#b69c74', dash: null },
  3: { map: '#6a4a2c', w: 1.1, ground: '#aa936b', dash: [3, 3] }
};
function roadVisible(type) { const s = view.s; return type === 1 || (type === 2 && s >= 0.9) || (type === 3 && s >= 3.5); }
function tracePoly(path, p) {
  const m = 60, xa = -m, xb = vw + m, ya = -m, yb = vh + m;
  let lx = sx(p[0]), ly = sy(p[1]), pen = false, dx = lx, dy = ly;
  for (let i = 2; i < p.length; i += 2) {
    const x = sx(p[i]), y = sy(p[i + 1]);
    const out = (lx < xa && x < xa) || (lx > xb && x > xb) || (ly < ya && y < ya) || (ly > yb && y > yb);
    if (out) { pen = false; lx = x; ly = y; continue; }
    if (!pen) { path.moveTo(lx, ly); pen = true; dx = lx; dy = ly; }
    const last = i === p.length - 2;
    if (last || Math.abs(x - dx) + Math.abs(y - dy) > 1.5) { path.lineTo(x, y); dx = x; dy = y; }
    lx = x; ly = y;
  }
}
function drawRoads() {
  const byType = { 1: [], 2: [], 3: [] };
  const st = ++QSTAMP;
  const pad = 20 / view.s;
  RGRID.query(VB[0] - pad, VB[1] - pad, VB[2] + pad, VB[3] + pad, (r) => {
    if (r._q === st) return;
    r._q = st;
    if (!roadVisible(r.type)) return;
    const bb = r._bb;
    if (bb[2] < VB[0] - pad || bb[0] > VB[2] + pad || bb[3] < VB[1] - pad || bb[1] > VB[3] + pad) return;
    byType[r.type].push(r);
  });
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const type of [3, 2, 1]) {
    const list = byType[type];
    if (!list.length) continue;
    const path = new Path2D();
    for (const r of list) tracePoly(path, roadGeom(r));
    const S = ROAD_STYLE[type];
    const wpx = ROADTYPES[type].ft * FT * view.s;
    if (wpx < 3) {
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(246,238,214,0.45)'; ctx.lineWidth = S.w + 2; ctx.stroke(path);
      ctx.setLineDash(S.dash || []);
      ctx.strokeStyle = S.map; ctx.lineWidth = S.w; ctx.stroke(path);
      ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = 'rgba(86,68,44,0.5)'; ctx.lineWidth = wpx + Math.max(2, wpx * 0.2); ctx.stroke(path);
      ctx.strokeStyle = S.ground; ctx.lineWidth = wpx; ctx.stroke(path);
      if (wpx > 14) {
        ctx.strokeStyle = type === 1 ? 'rgba(80,72,60,0.18)' : 'rgba(110,86,54,0.22)';
        ctx.lineWidth = Math.max(1, wpx * 0.06);
        ctx.setLineDash(type === 1 ? [wpx * 0.5, wpx * 0.25] : [wpx * 0.9, wpx * 0.6]);
        ctx.stroke(path);
        ctx.setLineDash([]);
      }
    }
  }
}

function drawGrid() {
  const step = 5 * FT, sq = step * view.s;
  if (sq < 9) return;
  const alpha = clamp((sq - 9) / 22, 0, 1) * 0.3;
  ctx.save();
  ctx.beginPath(); ctx.rect(sx(0), sy(0), W * view.s, H * view.s); ctx.clip();
  ctx.strokeStyle = 'rgba(28,24,16,' + alpha.toFixed(3) + ')';
  ctx.lineWidth = 1;
  const path = new Path2D();
  const i0 = Math.floor(VB[0] / step), i1 = Math.ceil(VB[2] / step), j0 = Math.floor(VB[1] / step), j1 = Math.ceil(VB[3] / step);
  for (let i = i0; i <= i1; i++) { const X = Math.round(sx(i * step)) + 0.5; path.moveTo(X, 0); path.lineTo(X, vh); }
  for (let j = j0; j <= j1; j++) { const Y = Math.round(sy(j * step)) + 0.5; path.moveTo(0, Y); path.lineTo(vw, Y); }
  ctx.stroke(path);
  ctx.restore();
}
function drawNeatline() {
  const X = sx(0), Y = sy(0), Wd = W * view.s, Hd = H * view.s;
  if (X > 0 || Y > 0 || X + Wd < vw || Y + Hd < vh) {
    ctx.strokeStyle = '#c9a253'; ctx.lineWidth = 1.5; ctx.strokeRect(X - 1, Y - 1, Wd + 2, Hd + 2);
    ctx.strokeStyle = 'rgba(214,165,72,0.45)'; ctx.lineWidth = 1; ctx.strokeRect(X - 6, Y - 6, Wd + 12, Hd + 12);
  }
}

// ---------------------------------------------------------------- markers & labels
const FONT_D = '"IM Fell English SC", "IM Fell English", Georgia, serif';
const FONT_I = '"IM Fell English", Georgia, serif';
function rectHit(r) { for (const q of labelHits) if (r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1]) return true; return false; }
function haloText(txt, x, y, fill, halo, lw) {
  ctx.lineJoin = 'round';
  ctx.strokeStyle = halo; ctx.lineWidth = lw; ctx.strokeText(txt, x, y);
  ctx.fillStyle = fill; ctx.fillText(txt, x, y);
}
function spacedText(txt, x, y, spacing, fill, halo) {
  let total = 0;
  const ws = [];
  for (const ch of txt) { const w = ctx.measureText(ch).width; ws.push(w); total += w + spacing; }
  total -= spacing;
  let cx = x - total / 2;
  const chars = [...txt];
  ctx.textAlign = 'left';
  for (let i = 0; i < chars.length; i++) { haloText(chars[i], cx, y, fill, halo, 3); cx += ws[i] + spacing; }
  ctx.textAlign = 'center';
  return total;
}
function drawIcon(tier, X, Y) {
  ctx.lineWidth = 1.5;
  if (tier === 4) {
    ctx.fillStyle = '#f3ead2'; ctx.strokeStyle = '#231c13';
    ctx.beginPath(); ctx.arc(X, Y, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8e2f25'; ctx.beginPath();
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 2.2 : 5; const x = X + Math.cos(a) * r, y = Y + Math.sin(a) * r; if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.closePath(); ctx.fill();
  } else if (tier === 3) {
    ctx.fillStyle = '#231c13'; ctx.strokeStyle = '#f3ead2';
    ctx.beginPath(); ctx.rect(X - 5, Y - 5, 10, 10); ctx.fill(); ctx.stroke();
  } else if (tier === 2) {
    ctx.fillStyle = '#f3ead2'; ctx.strokeStyle = '#231c13';
    ctx.beginPath(); ctx.arc(X, Y, 4.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#231c13'; ctx.beginPath(); ctx.arc(X, Y, 1.5, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = '#231c13'; ctx.strokeStyle = 'rgba(243,234,210,0.85)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(X, Y, 2.8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
}
function drawRealmLabels() {
  const s = view.s;
  if (!layers.labels || s >= 0.95 || !REALMS.length) return;
  const a = 1 - T.smooth(0.5, 0.95, s);
  ctx.font = '19px ' + FONT_D;
  ctx.textAlign = 'center';
  for (const R of REALMS) {
    const X = sx(R.cx), Y = sy(R.cy) + 34;
    if (X < -200 || X > vw + 200 || Y < -40 || Y > vh + 40) continue;
    const txt = R.name.toUpperCase();
    const tw = ctx.measureText(txt).width + txt.length * 3;
    const r = [X - tw / 2, Y - 18, X + tw / 2, Y + 4];
    if (rectHit(r)) continue;
    ctx.globalAlpha = hoverSid === 'R:' + R.cap.id ? 1 : a * 0.85;
    spacedText(txt, X, Y, 3, '#6e221d', 'rgba(246,238,218,0.55)');
    ctx.globalAlpha = 1;
    labelHits.push(r);
    markers.push({ kind: 'rlabel', id: R.cap.id, r });
  }
}
function drawMarkers() {
  const s = view.s;
  markers = []; labelHits = [];
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  // user labels first: they have priority
  for (const l of edits.labels) {
    if (drag && drag.kind === 'label' && drag.id === l.id) continue;
    const X = sx(l.x), Y = sy(l.y);
    if (X < -300 || X > vw + 300 || Y < -60 || Y > vh + 60) continue;
    const fs = l.size === 'l' ? 24 : l.size === 's' ? 13 : 17;
    ctx.font = 'italic ' + fs + 'px ' + FONT_I;
    const w = ctx.measureText(l.text).width;
    ctx.fillStyle = '#c9a253'; ctx.strokeStyle = '#231c13'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(X, Y - 4); ctx.lineTo(X + 4, Y); ctx.lineTo(X, Y + 4); ctx.lineTo(X - 4, Y); ctx.closePath(); ctx.fill(); ctx.stroke();
    haloText(l.text, X, Y - 9, '#3b1d12', 'rgba(246,238,218,0.92)', 3.5);
    const r = [X - w / 2 - 3, Y - 9 - fs, X + w / 2 + 3, Y + 5];
    labelHits.push(r);
    markers.push({ kind: 'label', id: l.id, r });
  }
  const list = [];
  const pad = 40 / s;
  SGRID.query(VB[0] - pad, VB[1] - pad, VB[2] + pad, VB[3] + pad, (st) => { if (s >= TIER_VIS[st.tier]) list.push(st); });
  list.sort((a, b) => b.tier - a.tier || b.pop - a.pop);
  // icons
  for (const st of list) {
    const moving = drag && drag.kind === 'settle' && drag.id === st.id;
    const X = moving ? drag.X : sx(st.x), Y = moving ? drag.Y : sy(st.y);
    if (X < -20 || X > vw + 20 || Y < -20 || Y > vh + 20) { if (!plansDrawn.has(st.id)) continue; }
    const plan = plansDrawn.has(st.id);
    if (!plan) { drawIcon(st.tier, X, Y); if (st.tier >= 3) labelHits.push([X - 8, Y - 8, X + 8, Y + 8]); }
    markers.push({ kind: 'settle', id: st.id, X, Y, r: plan ? settleR(st) * s : 9 });
  }
  if (!layers.labels) return;
  const focusId = focusTown();
  let realmsDone = false;
  for (const st of list) {
    if (!realmsDone && st.tier < 4) { realmsDone = true; drawRealmLabels(); }
    if (s < LABEL_VIS[st.tier]) continue;
    const moving = drag && drag.kind === 'settle' && drag.id === st.id;
    const X = moving ? drag.X : sx(st.x), Y = moving ? drag.Y : sy(st.y);
    const plan = plansDrawn.has(st.id);
    const fs = plan ? 22 : st.tier === 4 ? 17 : st.tier === 3 ? 15 : st.tier === 2 ? 13 : 11.5;
    ctx.font = fs + 'px ' + FONT_D;
    const w = ctx.measureText(st.name).width;
    let tx, ty, r;
    if (plan) { tx = X; ty = Y - settleR(st) * s - 10; r = [tx - w / 2, ty - fs, tx + w / 2, ty + 4]; ctx.textAlign = 'center'; }
    else if (st.tier >= 3) { tx = X; ty = Y - 11; r = [tx - w / 2, ty - fs, tx + w / 2, ty + 3]; ctx.textAlign = 'center'; }
    else { tx = X + (st.tier === 2 ? 8 : 6); ty = Y + fs * 0.35; r = [tx, ty - fs, tx + w, ty + 3]; ctx.textAlign = 'left'; }
    if (r[2] < 0 || r[0] > vw || r[3] < 0 || r[1] > vh) continue;
    if (rectHit(r)) continue;
    const hot = hoverSid === st.id, foc = focusId === st.id;
    haloText(st.name, tx, ty, foc || hot ? '#7a2414' : '#231c13', foc ? 'rgba(250,236,196,0.95)' : 'rgba(246,238,218,0.88)', foc ? 4 : 3);
    if (hot) { ctx.fillStyle = '#7a2414'; ctx.fillRect(r[0], ty + 2.5, r[2] - r[0], Math.max(1.2, fs / 14)); }
    labelHits.push(r);
    markers.push({ kind: 'slabel', id: st.id, r });
  }
  ctx.textAlign = 'center';
  if (!realmsDone) drawRealmLabels();
}

// ---------------------------------------------------------------- tool overlays
const SWATCH = { 5: '#86a054', 6: '#466c3a', 7: '#3c5e4e', 8: '#2a6638', 9: '#5e6a48', 10: '#ddc088', 11: '#b2a66a', 12: '#9ea08a', 13: '#eef1f3', 14: '#8a8070', 4: '#dbc796', 2: '#4a7e8c', 0: '#1b374f', '-1': '#c9a253' };
function drawStrokeCircles(st, alpha) {
  ctx.fillStyle = SWATCH[st.b] || '#c9a253';
  ctx.globalAlpha = alpha;
  const path = new Path2D();
  for (let i = 0; i < st.pts.length; i += 2) { const X = sx(st.pts[i]), Y = sy(st.pts[i + 1]), r = st.r * view.s; path.moveTo(X + r, Y); path.arc(X, Y, r, 0, Math.PI * 2); }
  ctx.fill(path);
  ctx.globalAlpha = 1;
}
function drawOverlay() {
  const s = view.s;
  // selection
  if (sel) {
    ctx.strokeStyle = '#e2c37a'; ctx.lineWidth = 2;
    if (sel.kind === 'settle') {
      const st = SBY.get(sel.id);
      if (st && !(drag && drag.id === st.id)) {
        const r = plansDrawn.has(st.id) ? settleR(st) * s + 6 : 12;
        ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.arc(sx(st.x), sy(st.y), r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      }
    } else if (sel.kind === 'road') {
      const r = RBY.get(sel.id);
      if (r) drawRoadEdit(r);
    } else if (sel.kind === 'label') {
      const m = markers.find((q) => q.kind === 'label' && q.id === sel.id);
      if (m) { ctx.setLineDash([4, 3]); ctx.strokeRect(m.r[0] - 3, m.r[1] - 3, m.r[2] - m.r[0] + 6, m.r[3] - m.r[1] + 6); ctx.setLineDash([]); }
    }
  }
  // drag ghost
  if (drag && drag.moved) {
    ctx.fillStyle = 'rgba(227,179,65,0.9)'; ctx.strokeStyle = '#231c13'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(drag.X, drag.Y, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (drag.kind === 'label') { const l = edits.labels.find((q) => q.id === drag.id); if (l) { ctx.font = 'italic 17px ' + FONT_I; haloText(l.text, drag.X, drag.Y - 12, '#3b1d12', 'rgba(246,238,218,0.92)', 3.5); } }
  }
  // paint previews
  if (pendingPreview) {
    const bb = pendingPreview.bb;
    let stale = false;
    for (const k of visibleKeys) { const t = tiles.get(k); if (!t) continue; const TS = W / Math.pow(2, t.z); if (t.tx * TS > bb[2] || (t.tx + 1) * TS < bb[0] || t.ty * TS > bb[3] || (t.ty + 1) * TS < bb[1]) continue; if (t.stale || !t.canvas) { stale = true; break; } }
    if (stale && performance.now() - pendingPreview.t < 8000) drawStrokeCircles(pendingPreview, 0.5); else pendingPreview = null;
  }
  if (strokeDraft) drawStrokeCircles(strokeDraft, 0.55);
  if (tool === 'paint' && hover && !strokeDraft) {
    ctx.strokeStyle = 'rgba(255,248,230,0.9)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(hover.x, hover.y, paint.px, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(20,16,10,0.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(hover.x, hover.y, paint.px + 1.5, 0, Math.PI * 2); ctx.stroke();
  }
  // road draft
  if (tool === 'road' && roadDraft && roadDraft.pts.length) {
    const p = roadDraft.pts;
    ctx.strokeStyle = '#e2c37a'; ctx.lineWidth = 2.5; ctx.setLineDash([7, 5]);
    ctx.beginPath(); ctx.moveTo(sx(p[0]), sy(p[1]));
    for (let i = 2; i < p.length; i += 2) ctx.lineTo(sx(p[i]), sy(p[i + 1]));
    if (hover) ctx.lineTo(hover.x, hover.y);
    ctx.stroke(); ctx.setLineDash([]);
    for (let i = 0; i < p.length; i += 2) { ctx.fillStyle = i === p.length - 2 ? '#e2c37a' : '#f3ead2'; ctx.strokeStyle = '#231c13'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(sx(p[i]), sy(p[i + 1]), 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  }
  // measure
  if (tool === 'measure' && measure) {
    const a = measure.a, b = measure.b || (hover ? [wxOf(hover.x), wyOf(hover.y)] : null);
    if (b) {
      ctx.strokeStyle = '#231c13'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sx(a[0]), sy(a[1])); ctx.lineTo(sx(b[0]), sy(b[1])); ctx.stroke();
      ctx.strokeStyle = '#e2c37a'; ctx.lineWidth = 2; ctx.setLineDash([8, 5]); ctx.stroke(); ctx.setLineDash([]);
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      ctx.font = '600 14px "Atkinson Hyperlegible", system-ui, sans-serif';
      haloText(fmtDist(d), (sx(a[0]) + sx(b[0])) / 2, (sy(a[1]) + sy(b[1])) / 2 - 10, '#231c13', 'rgba(246,238,218,0.95)', 4);
    }
    for (const q of [a, measure.b]) if (q) { ctx.fillStyle = '#e2c37a'; ctx.strokeStyle = '#231c13'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(sx(q[0]), sy(q[1]), 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  }
}
function fmtDist(mi) {
  if (mi < 0.1) return fmtInt(mi * 5280) + ' ft';
  if (mi < 10) return mi.toFixed(2) + ' mi';
  return fmtInt(mi) + ' mi';
}
function travelText(mi) {
  const hrs = mi / 3;
  const t = hrs < 8 ? (hrs < 1 ? Math.max(1, Math.round(hrs * 60)) + ' min' : hrs.toFixed(1) + ' hours') : (mi / 24).toFixed(1) + ' days';
  return t + ' on foot at a normal pace (3 mph, 24 mi a day)';
}

// ---------------------------------------------------------------- HUD
const LADDER = [['World', 0], ['Realm', 1.2], ['Region', 14], ['Town', 900], ['Battle', 24000]];
function zoomName(s) { return s < 0.6 ? 'World' : s < 5 ? 'Realm' : s < 70 ? 'Region' : s < 4000 ? 'Town & countryside' : 'Battle map · 5 ft squares'; }
let hudCache = '';
let rungPos = null, rungRetry = 0;
window.addEventListener('resize', () => { rungPos = null; hudCache = ''; });
function updateHud() {
  const s = view.s;
  const key = s.toFixed(4);
  if (key === hudCache) return;
  hudCache = key;
  $('zoomName').textContent = zoomName(s);
  // scale bar
  const target = 110 / s;
  let label, mi;
  if (target < 0.2) {
    const ftv = [5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
    let f = ftv[0]; for (const v of ftv) if (v * FT <= target) f = v;
    mi = f * FT; label = f + ' ft';
  } else {
    const miv = [0.25, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 250, 500, 1000];
    let m = miv[0]; for (const v of miv) if (v <= target) m = v;
    mi = m; label = m + (m === 1 ? ' mile' : ' miles');
  }
  $('scaleBar').style.width = Math.round(mi * s) + 'px';
  $('scaleText').textContent = label;
  // the ladder's rung positions are measured once (and again after a resize), not every frame: reading layout while
  // the map flies would force the browser to lay out the whole page each frame
  if (!rungPos) {
    const rungs = [...document.querySelectorAll('[data-rung]')];
    const box = rungs.length ? rungs[0].parentElement.clientHeight : 0;
    rungPos = box ? rungs.map((el) => [Math.log(+el.dataset.rung || minS), box - el.offsetTop - el.offsetHeight / 2]).sort((p, q) => p[0] - q[0]) : [];
    if (!box && !rungRetry) rungRetry = setTimeout(() => { rungRetry = 0; rungPos = null; hudCache = ''; }, 2000);   // hidden (phones) or not laid out yet: look again later
  }
  if (rungPos.length) {
    const pos = rungPos;
    const ls = Math.log(s);
    let y = pos[0][1];
    if (ls >= pos[pos.length - 1][0]) y = pos[pos.length - 1][1];
    else for (let i = 1; i < pos.length; i++) if (ls < pos[i][0]) { const f = clamp((ls - pos[i - 1][0]) / (pos[i][0] - pos[i - 1][0]), 0, 1); y = pos[i - 1][1] + (pos[i][1] - pos[i - 1][1]) * f; break; }
    $('ladderMark').style.bottom = y.toFixed(1) + 'px';
  }
}
