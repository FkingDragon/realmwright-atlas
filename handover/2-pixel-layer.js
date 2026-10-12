// ================================================================ pixel battle map: chunks, layout and drawing
// Close in, the map turns into Tilewright pixel art, one 16-px cell per 5-ft square, in chunks of
// 32 × 32 squares. The main thread lays out what the world puts on each square (roads, streets,
// buildings and their walls and doors, town walls) plus anything painted on the battle map; the
// workers work out the natural ground and paint the pixels.
const PX = pixelLib(T);
const CELL = 1056;                 // 5-ft squares per mile
const PCS = 32;                    // squares per chunk side
const PX_ON = 5.5, PX_FULL = 9;    // pixel art fades in between these many screen pixels per square
const pxChunks = new Map();
const PX_LIMIT = (window.matchMedia && matchMedia('(pointer: coarse)').matches) ? 40 : 96;
let pxQueue = [], PXSEQ = 1;
const pxCanvasPool = { 1: [], 0: [] };
const cellOf = (v) => Math.floor(v * CELL);
const pxKey = (cx, cy, half) => cx + ',' + cy + (half ? 'h' : '');
const bmKey = (cx, cy) => Math.floor(cx / PCS) + ',' + Math.floor(cy / PCS);
const bmIdx = (cx, cy) => (cy - Math.floor(cy / PCS) * PCS) * PCS + (cx - Math.floor(cx / PCS) * PCS);
function pxAlpha() { const c = view.s / CELL; return c <= PX_ON ? 0 : c >= PX_FULL ? 1 : T.smooth(PX_ON, PX_FULL, c); }

// ---------- what the battle-map edits say about one square ----------
function bmChunk(cx, cy) { const b = edits.bm; return b ? b[bmKey(cx, cy)] || null : null; }
function bmGet(kind, cx, cy) { const c = bmChunk(cx, cy); if (!c || !c[kind]) return undefined; return c[kind][bmIdx(cx, cy)]; }

// ---------- per-plan index: which buildings and street segments touch which chunk ----------
function planPx(P) {
  if (P._px) return P._px;
  const bBy = new Map(), sBy = new Map();
  const add = (m, x0, y0, x1, y1, v) => {
    const i0 = Math.floor((cellOf(x0) - 3) / PCS), i1 = Math.floor((cellOf(x1) + 3) / PCS), j0 = Math.floor((cellOf(y0) - 3) / PCS), j1 = Math.floor((cellOf(y1) + 3) / PCS);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const k = i + ',' + j; let a = m.get(k); if (!a) { a = []; m.set(k, a); } a.push(v); }
  };
  for (let i = 0; i < P.n; i++) { const r = (P.bw[i] + P.bd[i]) * 0.71; add(bBy, P.bx[i] - r, P.by[i] - r, P.bx[i] + r, P.by[i] + r, i); }
  P.streets.forEach((st, si) => {
    const p = st.pts, hw = st.w / 2;
    for (let j = 2; j < p.length; j += 2) add(sBy, Math.min(p[j - 2], p[j]) - hw, Math.min(p[j - 1], p[j + 1]) - hw, Math.max(p[j - 2], p[j]) + hw, Math.max(p[j - 1], p[j + 1]) + hw, si * 4096 + j);
  });
  P._px = { bBy, sBy, door: new Map() };
  return P._px;
}
// on the battle map every building is squared to the grid: its angle snaps to the nearest quarter turn
function gridFrame(P, i) {
  const q = Math.round(P.ba[i] / (Math.PI / 2)), odd = ((q % 2) + 2) % 2 === 1;
  return { c: Math.round(Math.cos(q * Math.PI / 2)), s: Math.round(Math.sin(q * Math.PI / 2)), hw: (odd ? P.bd[i] : P.bw[i]) / 2, hd: (odd ? P.bw[i] : P.bd[i]) / 2, w: P.bw[i], d: P.bd[i] };
}
// the door sits in the wall that faces the nearest street (or the square)
function doorOf(st, P, X, i) {
  let d = X.door.get(i);
  if (d !== undefined) return d;
  const x = P.bx[i], y = P.by[i], G = gridFrame(P, i);
  let best = Infinity, tx = st.x, ty = st.y;
  const k = Math.floor(cellOf(x) / PCS) + ',' + Math.floor(cellOf(y) / PCS);
  for (const v of X.sBy.get(k) || []) {
    const p = P.streets[Math.floor(v / 4096)].pts, j = v % 4096;
    const ax = p[j - 2], ay = p[j - 1], bx = p[j], by = p[j + 1], dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    let t = l2 > 0 ? ((x - ax) * dx + (y - ay) * dy) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
    const qx = ax + dx * t, qy = ay + dy * t, dd = Math.hypot(qx - x, qy - y);
    if (dd < best) { best = dd; tx = qx; ty = qy; }
  }
  const vx = tx - x, vy = ty - y;
  let ax, ay, half;
  if (Math.abs(vx) / G.hw > Math.abs(vy) / G.hd) { ax = vx >= 0 ? 1 : -1; ay = 0; half = G.hw; }
  else { ax = 0; ay = vy >= 0 ? 1 : -1; half = G.hd; }
  const ix = x + ax * (half - 2.5 * FT), iy = y + ay * (half - 2.5 * FT);
  const cx = cellOf(ix), cy = cellOf(iy);
  if (Math.abs(ax) >= Math.abs(ay)) d = 'v' + (ax > 0 ? cx + 1 : cx) + ',' + cy;
  else d = 'h' + cx + ',' + (ay > 0 ? cy + 1 : cy);
  X.door.set(i, d);
  return d;
}

// ---------- lay out one chunk ----------
function pxLayout(cxc, cyc) {
  const N = PCS, X0 = cxc * N, Y0 = cyc * N, CW = N + 4, RW = N + 2;
  const ov = new Uint8Array(CW * CW).fill(255), bid = new Int32Array(CW * CW).fill(-1);
  const pr = new Int8Array(N * N).fill(-2), eh = new Uint8Array(RW * RW), ev = new Uint8Array(RW * RW);
  const x0 = (X0 - 2) / CELL, y0 = (Y0 - 2) / CELL, x1 = (X0 + N + 2) / CELL, y1 = (Y0 + N + 2) / CELL;
  const doors = new Set(), furn = [];
  const cellsIn = (ax0, ay0, ax1, ay1, fn) => {
    const i0 = Math.max(0, cellOf(ax0) - X0 + 2), i1 = Math.min(CW - 1, cellOf(ax1) - X0 + 2), j0 = Math.max(0, cellOf(ay0) - Y0 + 2), j1 = Math.min(CW - 1, cellOf(ay1) - Y0 + 2);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) fn(j * CW + i, (X0 - 2 + i + 0.5) / CELL, (Y0 - 2 + j + 0.5) / CELL, i, j);
  };
  const noAuto = (i, j) => { if (i >= 2 && j >= 2 && i < N + 2 && j < N + 2) pr[(j - 2) * N + i - 2] = -1; };
  // roads between places
  const stamp = ++QSTAMP;
  RGRID.query(x0, y0, x1, y1, (r) => {
    if (r._q === stamp) return; r._q = stamp;
    const hw = ROADTYPES[r.type].ft * FT * 0.5, bb = r._bb;
    if (bb && (x1 < bb[0] - hw || x0 > bb[2] + hw || y1 < bb[1] - hw || y0 > bb[3] + hw)) return;
    const p = roadGeom(r);
    for (let k = 2; k < p.length; k += 2) {
      const ax = p[k - 2], ay = p[k - 1], bx = p[k], by = p[k + 1];
      const sx0 = Math.min(ax, bx) - hw, sx1 = Math.max(ax, bx) + hw, sy0 = Math.min(ay, by) - hw, sy1 = Math.max(ay, by) + hw;
      if (sx1 < x0 || sx0 > x1 || sy1 < y0 || sy0 > y1) continue;
      cellsIn(Math.max(sx0, x0), Math.max(sy0, y0), Math.min(sx1, x1), Math.min(sy1, y1), (q, x, y, i, j) => { if (segDist(x, y, ax, ay, bx, by) < hw) { ov[q] = 254; noAuto(i, j); } });
    }
  });
  // settlements: square, streets, buildings, walls
  const near = [];
  SGRID.query(x0 - 0.7, y0 - 0.7, x1 + 0.7, y1 + 0.7, (s) => { const R = settleR(s) * 1.12; if (s.x + R >= x0 && s.x - R <= x1 && s.y + R >= y0 && s.y - R <= y1) near.push(s); });
  let bseq = 0;
  for (const s of near) {
    const P = getPlan(s), X = planPx(P), R = P.R, paved = s.tier >= 3 ? 253 : 254;
    cellsIn(Math.max(s.x - R, x0), Math.max(s.y - R, y0), Math.min(s.x + R, x1), Math.min(s.y + R, y1), (q, x, y, i, j) => { const dx = x - s.x, dy = y - s.y; if (dx * dx + dy * dy < R * R * 0.9) noAuto(i, j); });
    const pr2 = P.plazaR;
    cellsIn(Math.max(s.x - pr2, x0), Math.max(s.y - pr2, y0), Math.min(s.x + pr2, x1), Math.min(s.y + pr2, y1), (q, x, y) => { const dx = x - s.x, dy = y - s.y; if (dx * dx + dy * dy < pr2 * pr2) ov[q] = paved; });
    if (P.well) { const i = cellOf(s.x) - X0, j = cellOf(s.y) - Y0; if (i >= 0 && j >= 0 && i < N && j < N) pr[j * N + i] = PX.P.WELL; }
    const ck = cxc + ',' + cyc;
    for (const v of X.sBy.get(ck) || []) {
      const st = P.streets[Math.floor(v / 4096)], p = st.pts, k = v % 4096, hw = st.w / 2;
      const ax = p[k - 2], ay = p[k - 1], bx = p[k], by = p[k + 1];
      cellsIn(Math.max(Math.min(ax, bx) - hw, x0), Math.max(Math.min(ay, by) - hw, y0), Math.min(Math.max(ax, bx) + hw, x1), Math.min(Math.max(ay, by) + hw, y1), (q, x, y) => { if (segDist(x, y, ax, ay, bx, by) < hw) ov[q] = paved; });
    }
    for (const i of X.bBy.get(ck) || []) {
      const kind = P.bk[i], bx = P.bx[i], by = P.by[i], G = gridFrame(P, i), c = G.c, sn = G.s, hw = G.w / 2, hd = G.d / 2, rr = Math.max(G.hw, G.hd) + 3 * FT;
      if (kind === 3) { // market stall: a sprite on the square it stands on
        const i2 = cellOf(bx) - X0, j2 = cellOf(by) - Y0;
        if (i2 >= 0 && j2 >= 0 && i2 < N && j2 < N) pr[j2 * N + i2] = PX.P.STALL;
        continue;
      }
      const id = ++bseq, floor = kind === 1 || kind === 2 ? PX.ID.FLAG : PX.ID.PLANKS;
      cellsIn(Math.max(bx - rr, x0), Math.max(by - rr, y0), Math.min(bx + rr, x1), Math.min(by + rr, y1), (q, x, y) => {
        if (Math.abs(x - bx) <= G.hw && Math.abs(y - by) <= G.hd) { ov[q] = floor; bid[q] = id; }
      });
      doors.add(doorOf(s, P, X, i));
      // furnishings at fixed spots in the building's own frame
      const spot = (fu, fw, prop) => furn.push([cellOf(bx + c * fu * hw - sn * fw * hd), cellOf(by + sn * fu * hw + c * fw * hd), prop, id]);
      if (kind === 1) spot(0, -0.55, PX.P.ALTAR);
      else if (kind === 2) { spot(-0.6, -0.6, PX.P.STAIRS); spot(0.4, 0.2, PX.P.TABLE); }
      else if (kind === 4) { spot(-0.5, -0.4, PX.P.CRATE); spot(0.5, 0.4, PX.P.BARREL); }
      else if (hw * hd * 4 > 260 * FT * FT) { const h = hashStr(s.id + i); spot(-0.55, -0.45, PX.P.BED); spot(0.35, 0.25, PX.P.TABLE); if (h % 3 === 0) spot(0.6, -0.55, PX.P.BARREL); else if (h % 3 === 1) spot(0.6, -0.55, PX.P.CHEST); }
    }
    if (P.wall) {
      const wl = P.wall, Rw = wl.Rw, half = 6 * FT;
      cellsIn(Math.max(s.x - Rw - half, x0), Math.max(s.y - Rw - half, y0), Math.min(s.x + Rw + half, x1), Math.min(s.y + Rw + half, y1), (q, x, y) => {
        const dx = x - s.x, dy = y - s.y, d = Math.hypot(dx, dy);
        if (Math.abs(d - Rw) > half) return;
        const ang = Math.atan2(dy, dx);
        if (wl.gates.some((g) => angDiff(ang, g[0]) < g[1])) return;
        ov[q] = PX.ID.WALL; bid[q] = -1;
      });
      const tr = 13 * FT;
      for (let k = 0; k < wl.towers.length; k += 2) {
        const tx = wl.towers[k], ty = wl.towers[k + 1];
        if (tx + tr < x0 || tx - tr > x1 || ty + tr < y0 || ty - tr > y1) continue;
        cellsIn(tx - tr, ty - tr, tx + tr, ty + tr, (q, x, y) => { if (Math.hypot(x - tx, y - ty) < tr) { ov[q] = PX.ID.WALL; bid[q] = -1; } });
      }
    }
  }
  // walls between a building and anything else, with one door
  const B = (x, y) => bid[(y - Y0 + 2) * CW + x - X0 + 2];
  for (let y = Y0 - 1; y <= Y0 + N; y++) for (let x = X0 - 1; x <= X0 + N; x++) {
    const a = B(x, y), up = B(x, y - 1), lf = B(x - 1, y), r = (y - Y0 + 1) * RW + x - X0 + 1;
    if (a !== up && (a > 0 || up > 0)) eh[r] = doors.has('h' + x + ',' + y) ? 2 : 1;
    if (a !== lf && (a > 0 || lf > 0)) ev[r] = doors.has('v' + x + ',' + y) ? 2 : 1;
  }
  for (const [fx, fy, prop, id] of furn) { const i = fx - X0, j = fy - Y0; if (i >= 0 && j >= 0 && i < N && j < N && B(fx, fy) === id) pr[j * N + i] = prop; }
  // anything painted on the battle map
  const bm = edits.bm;
  if (bm) {
    for (let j = 0; j < CW; j++) for (let i = 0; i < CW; i++) {
      const cx = X0 - 2 + i, cy = Y0 - 2 + j, c = bm[bmKey(cx, cy)];
      if (!c) continue;
      const k = bmIdx(cx, cy);
      if (c.t && c.t[k] !== undefined) ov[j * CW + i] = c.t[k];
      if (i >= 2 && j >= 2 && i < N + 2 && j < N + 2) { if (c.p && c.p[k] !== undefined) pr[(j - 2) * N + i - 2] = c.p[k]; }
      if (i >= 1 && j >= 1 && i < N + 3 && j < N + 3) { const r = (j - 1) * RW + i - 1; if (c.h && c.h[k] !== undefined) eh[r] = c.h[k]; if (c.v && c.v[k] !== undefined) ev[r] = c.v[k]; }
    }
  }
  return { N, X0, Y0, ov, pr, eh, ev, circ: circlesIn(x0 - 0.01, y0 - 0.01, x1 + 0.01, y1 + 0.01) };
}

// ---------- chunk cache, queue and drawing ----------
function pxGet(cx, cy, half) {
  const k = pxKey(cx, cy, half);
  let c = pxChunks.get(k);
  if (!c) { c = { k, px: true, cx, cy, half, canvas: null, ver: ++PXSEQ, pend: false, stale: false }; pxChunks.set(k, c); }
  return c;
}
function pxMsg(c) {
  const L = pxLayout(c.cx, c.cy);
  return { px: 1, k: c.k, ver: c.ver, seed: SEED, half: c.half, N: L.N, X0: L.X0, Y0: L.Y0, ov: L.ov, pr: L.pr, eh: L.eh, ev: L.ev, circ: L.circ };
}
function pxDone(d) {
  const c = d.seed === SEED ? pxChunks.get(d.k) : null;
  if (!c) return;
  c.pend = false;
  if (c.canvas && c.shown >= d.ver) return;
  const n = PCS * PX.TS >> (c.half ? 1 : 0);
  const cv = c.canvas || pxCanvasPool[c.half ? 1 : 0].pop() || mkCanvas(n, n);
  cv.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(d.buf), n, n), 0, 0);
  c.canvas = cv; c.shown = d.ver;
  if (c.ver === d.ver) c.stale = false;
  requestRender();
}
function pxEvict() {
  if (pxChunks.size <= PX_LIMIT) return;
  for (const [k, c] of pxChunks) {
    if (pxChunks.size <= PX_LIMIT) break;
    if (pxVisible.has(k) || c.pend) continue;
    if (c.canvas) pxCanvasPool[c.half ? 1 : 0].length < 8 && pxCanvasPool[c.half ? 1 : 0].push(c.canvas);
    pxChunks.delete(k);
  }
}
let pxVisible = new Set();
// returns true when every square in view has its pixels
function drawPixels(alpha) {
  const cpx = view.s / CELL, half = cpx < 9.5, span = PCS / CELL;
  const cx0 = Math.floor(Math.max(0, VB[0]) / span), cx1 = Math.floor(Math.min(W, VB[2]) / span);
  const cy0 = Math.floor(Math.max(0, VB[1]) / span), cy1 = Math.floor(Math.min(H, VB[3]) / span);
  const need = [];
  let ready = true;
  pxVisible = new Set();
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = alpha;
  const mx = view.x / span, my = view.y / span;
  for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
    const c = pxGet(cx, cy, half);
    pxVisible.add(c.k);
    pxChunks.delete(c.k); pxChunks.set(c.k, c);
    const a = Math.round(sx(cx * span)), b = Math.round(sx((cx + 1) * span)), t = Math.round(sy(cy * span)), u = Math.round(sy((cy + 1) * span));
    let cv = c.canvas;
    if (!cv) { const o = pxChunks.get(pxKey(cx, cy, !half)); if (o && o.canvas && !o.stale) cv = o.canvas; }
    if (cv) ctx.drawImage(cv, a, t, b - a, u - t); else ready = false;
    if ((!c.canvas || c.stale) && !c.pend) need.push([Math.hypot(cx + 0.5 - mx, cy + 0.5 - my), c]);
  }
  ctx.restore();
  need.sort((p, q) => p[0] - q[0]);
  pxQueue = need.map((n) => n[1]);
  pump();
  pxEvict();
  return ready;
}
// every square in view already has pixels (either level of detail)
function pxCovered() {
  const cpx = view.s / CELL, half = cpx < 9.5, span = PCS / CELL;
  const cx0 = Math.floor(Math.max(0, VB[0]) / span), cx1 = Math.floor(Math.min(W, VB[2]) / span);
  const cy0 = Math.floor(Math.max(0, VB[1]) / span), cy1 = Math.floor(Math.min(H, VB[3]) / span);
  for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
    const c = pxChunks.get(pxKey(cx, cy, half)), o = pxChunks.get(pxKey(cx, cy, !half));
    if (!(c && c.canvas) && !(o && o.canvas && !o.stale)) return false;
  }
  return true;
}
function pxQueueTilesClear() { queue = []; }
// mark chunks touching a box (in miles) for repainting
function pxInvalidate(bb) {
  const span = PCS / CELL, m = 3 / CELL;
  for (const c of pxChunks.values()) {
    if (bb) { const ax = c.cx * span, ay = c.cy * span; if (ax - m > bb[2] || ax + span + m < bb[0] || ay - m > bb[3] || ay + span + m < bb[1]) continue; }
    c.stale = true; c.ver = ++PXSEQ;
  }
  requestRender();
}
