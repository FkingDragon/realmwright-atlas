
// ================================================================ settlement street plans
const ROOFS = {
  temperate: [['#b8995c', '#8c7142'], ['#76808c', '#555d68'], ['#8f6a4d', '#6a4c36']],
  warm: [['#c47a50', '#985636'], ['#d6c3a0', '#b19d7b'], ['#b8865a', '#8c623e']],
  cold: [['#6e5a47', '#4f3f31'], ['#7c8691', '#5a636d'], ['#8a7259', '#65523f']],
  wet: [['#7d8058', '#5d6040'], ['#8f7a55', '#6b5a3d'], ['#6f6a60', '#514d45']]
};
const SPECIAL_ROOF = { 1: ['#6f8196', '#4f5e70'], 2: ['#9a958b', '#77736a'], 3: ['#c9a25a', '#a3803f'], 4: ['#a08455', '#7a633c'] };
function roofSetFor(s) {
  const b = s.b != null ? s.b : 5;
  if (b === 10 || b === 11 || b === 8) return ROOFS.warm;
  if (b === 7 || b === 12 || b === 13 || b === 15) return ROOFS.cold;
  if (b === 9) return ROOFS.wet;
  return ROOFS.temperate;
}
const planCache = new Map();
function getPlan(s) {
  const key = s.x + '|' + s.y + '|' + s.pop + '|' + s.tier + '|' + roadsVer + '|' + strokesVer;
  const c = planCache.get(s.id);
  if (c && c.key === key) { planCache.delete(s.id); planCache.set(s.id, c); return c.plan; }
  const plan = makePlan(s);
  planCache.set(s.id, { key, plan });
  if (planCache.size > 80) planCache.delete(planCache.keys().next().value);
  return plan;
}
function angDiff(a, b) { let d = Math.abs(a - b) % (Math.PI * 2); return d > Math.PI ? Math.PI * 2 - d : d; }

// ================================================================ sprites for close-up terrain
const sprites = new Map();
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const TREE_COL = {
  oak: [['#7fa457', '#58803c', '#3a5a2a'], ['#8eaa58', '#64873f', '#425f2b'], ['#6f9a52', '#4d7638', '#33522a']],
  pine: [['#5d8a68', '#3f6a4e', '#2a4a37'], ['#668f60', '#466e45', '#2f4d32'], ['#557f6a', '#3a6250', '#284636']],
  palm: [['#8fb35a', '#5f8a38', '#3f6125']],
  bush: [['#8aa85a', '#627f3d', '#455d2c'], ['#9aa35c', '#717a3f', '#50582c']],
  rock: [['#b3ab9c', '#8a8274', '#5f594f'], ['#a7a39b', '#7e7a72', '#57534d'], ['#bbb19d', '#8f8573', '#625a4c']]
};
function sprite(kind, v, r) {
  r = Math.max(2, Math.min(150, Math.round(r)));
  const key = kind + v + '_' + r;
  let c = sprites.get(key);
  if (c) return c;
  const S = Math.ceil(r * 2.8) + 4, m = S / 2;
  c = mkCanvas(S, S);
  const g = c.getContext('2d');
  const col = TREE_COL[kind][v % TREE_COL[kind].length];
  const rnd = T.mulberry(hashStr(kind) + v * 31 + r);
  // shadow
  g.fillStyle = 'rgba(22,26,12,0.30)';
  g.beginPath(); g.ellipse(m + r * 0.3, m + r * 0.34, r * (kind === 'rock' ? 0.85 : 0.95), r * (kind === 'rock' ? 0.7 : 0.88), 0, 0, Math.PI * 2); g.fill();
  const grad = g.createRadialGradient(m - r * 0.35, m - r * 0.4, r * 0.1, m, m, r * 1.1);
  grad.addColorStop(0, col[0]); grad.addColorStop(0.55, col[1]); grad.addColorStop(1, col[2]);
  g.fillStyle = grad;
  g.strokeStyle = 'rgba(25,32,16,0.45)';
  g.lineWidth = Math.max(0.6, r * 0.05);
  if (kind === 'oak' || kind === 'bush') {
    const n = kind === 'oak' ? 7 : 5;
    g.beginPath();
    g.arc(m, m, r * 0.7, 0, Math.PI * 2);
    for (let k = 0; k < n; k++) {
      const a = k / n * Math.PI * 2 + rnd() * 0.5;
      const rr = r * (0.42 + rnd() * 0.12);
      const cx = m + Math.cos(a) * (r - rr), cy = m + Math.sin(a) * (r - rr);
      g.moveTo(cx + rr, cy); g.arc(cx, cy, rr, 0, Math.PI * 2);
    }
    g.fill();
    g.stroke();
    g.fillStyle = 'rgba(255,255,220,0.10)';
    g.beginPath(); g.arc(m - r * 0.3, m - r * 0.32, r * 0.32, 0, Math.PI * 2); g.fill();
  } else if (kind === 'pine') {
    for (const [sc, alpha] of [[1, 1], [0.62, 1]]) {
      g.beginPath();
      const n = 10;
      for (let k = 0; k <= n * 2; k++) {
        const a = k / (n * 2) * Math.PI * 2 + v;
        const rr = r * sc * (k % 2 === 0 ? 1 : 0.62 + rnd() * 0.08);
        const x = m + Math.cos(a) * rr, y = m + Math.sin(a) * rr;
        if (k === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.closePath(); g.globalAlpha = alpha; g.fill(); g.stroke();
    }
    g.globalAlpha = 1;
    g.fillStyle = col[2]; g.beginPath(); g.arc(m, m, r * 0.12, 0, Math.PI * 2); g.fill();
  } else if (kind === 'palm') {
    g.lineCap = 'round';
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * Math.PI * 2 + rnd() * 0.3;
      const ex = m + Math.cos(a) * r, ey = m + Math.sin(a) * r;
      const nx = -Math.sin(a) * r * 0.22, ny = Math.cos(a) * r * 0.22;
      g.beginPath(); g.moveTo(m, m);
      g.quadraticCurveTo(m + Math.cos(a) * r * 0.5 + nx, m + Math.sin(a) * r * 0.5 + ny, ex, ey);
      g.quadraticCurveTo(m + Math.cos(a) * r * 0.5 - nx, m + Math.sin(a) * r * 0.5 - ny, m, m);
      g.fill(); g.stroke();
    }
    g.fillStyle = '#7a5a36'; g.beginPath(); g.arc(m, m, r * 0.12, 0, Math.PI * 2); g.fill();
  } else if (kind === 'rock') {
    g.beginPath();
    const n = 7;
    for (let k = 0; k < n; k++) {
      const a = k / n * Math.PI * 2 + rnd() * 0.4;
      const rr = r * (0.7 + rnd() * 0.3);
      const x = m + Math.cos(a) * rr, y = m + Math.sin(a) * rr * 0.85;
      if (k === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(40,36,30,0.55)'; g.stroke();
    g.fillStyle = 'rgba(255,255,245,0.16)';
    g.beginPath(); g.ellipse(m - r * 0.25, m - r * 0.25, r * 0.35, r * 0.22, -0.6, 0, Math.PI * 2); g.fill();
  }
  sprites.set(key, c);
  if (sprites.size > 900) sprites.delete(sprites.keys().next().value);
  return c;
}

// ================================================================ tiles
const RES = 256, ZMAX = 20;
const tiles = new Map();
const TILE_LIMIT = (window.matchMedia && matchMedia('(pointer: coarse)').matches) ? 120 : 240;
let VERSEQ = 1;
const canvasPool = [];
let queue = [];
const workers = [];
let liveWorkers = 0;
let visibleKeys = new Set();

function tileKey(z, tx, ty) { return z + '/' + tx + '/' + ty; }
function getTile(z, tx, ty) {
  const k = tileKey(z, tx, ty);
  let t = tiles.get(k);
  if (!t) { t = { k, z, tx, ty, canvas: null, ver: ++VERSEQ, stale: true, pend: false }; tiles.set(k, t); }
  return t;
}
function evictTiles() {
  if (tiles.size <= TILE_LIMIT) return;
  for (const [k, t] of tiles) {
    if (tiles.size <= TILE_LIMIT) break;
    if (visibleKeys.has(k) || t.pend) continue;
    if (t.canvas && canvasPool.length < 24) canvasPool.push(t.canvas);
    tiles.delete(k);
  }
}

function initWorkers() {
  try {
    const src = '"use strict";const T=(' + terrainLib.toString() + ')();const PXL=(' + pixelLib.toString() + ')(T);let seed=null;' +
      'onmessage=function(ev){const d=ev.data;if(d.seed!==seed){T.setSeed(d.seed);seed=d.seed;}' +
      'if(d.px){const q=PXL.render(d);postMessage({px:1,k:d.k,ver:d.ver,seed:d.seed,buf:q.buffer},[q.buffer]);return;}' +
      'const px=T.renderTile(d.z,d.tx,d.ty,d.R,d.circ,d.caps,d.borders);postMessage({k:d.k,ver:d.ver,seed:d.seed,buf:px.buffer},[px.buffer]);};';
    const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
    const n = Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 4) - 1));
    for (let i = 0; i < n; i++) {
      const w = new Worker(url);
      w.busy = false; w.job = null; w.dead = false;
      w.onmessage = (ev) => onTileDone(w, ev.data);
      w.onerror = (ev) => {
        if (ev && ev.preventDefault) ev.preventDefault();
        if (w.dead) return;
        w.dead = true; liveWorkers--;
        if (w.job) { w.job.pend = false; w.job = null; }
        w.busy = false;
        try { w.terminate(); } catch (e) { /* ignore */ }
        pump();
      };
      workers.push(w);
      liveWorkers++;
    }
  } catch (e) { liveWorkers = 0; }
}
function nextJob() {
  // battle-map chunks come first: when they are showing, they are what the person is looking at
  while (pxQueue.length) {
    const c = pxQueue.shift();
    if (c.pend || (c.canvas && !c.stale) || pxChunks.get(c.k) !== c || c.failed === c.ver) continue;
    return c;
  }
  while (queue.length) {
    const t = queue.shift();
    if (t.pend || (t.canvas && !t.stale) || tiles.get(t.k) !== t) continue;
    return t;
  }
  return null;
}
function jobMsg(t) {
  if (t.px) return pxMsg(t);
  const TS = W / Math.pow(2, t.z), x0 = t.tx * TS, y0 = t.ty * TS, m = TS / RES * 2;
  return { k: t.k, ver: t.ver, z: t.z, tx: t.tx, ty: t.ty, R: RES, seed: SEED, circ: circlesIn(x0 - m, y0 - m, x0 + TS + m, y0 + TS + m), caps: CAPS.slice(), borders: layers.borders };
}
let mainBusy = false;
function pump() {
  if (liveWorkers > 0) {
    for (const w of workers) {
      if (w.dead || w.busy) continue;
      const t = nextJob();
      if (!t) break;
      let msg;
      try { msg = jobMsg(t); } catch (e) { console.error(e); t.failed = t.ver; continue; }
      t.pend = true;
      w.busy = true; w.job = t;
      w.postMessage(msg);
    }
    return;
  }
  // fallback: render on the main thread, one tile per tick
  if (mainBusy) return;
  const t = nextJob();
  if (!t) return;
  mainBusy = true; t.pend = true;
  setTimeout(() => {
    let d, px;
    try {
      d = jobMsg(t);
      px = t.px ? PX.render(d) : T.renderTile(d.z, d.tx, d.ty, d.R, d.circ, d.caps, d.borders);
    } catch (e) { console.error(e); mainBusy = false; t.pend = false; t.failed = t.ver; return; }
    mainBusy = false;
    onTileDone(null, { px: t.px ? 1 : 0, k: d.k, ver: d.ver, seed: d.seed, buf: px.buffer });
  }, 0);
}
function onTileDone(w, d) {
  if (w) { w.busy = false; w.job = null; }
  if (d.px) { try { pxDone(d); } catch (e) { console.error(e); } pump(); return; }
  const t = d.seed === SEED ? tiles.get(d.k) : null;
  if (t) {
    t.pend = false;
    if (t.ver === d.ver || !t.canvas) {
      const cv = t.canvas || canvasPool.pop() || mkCanvas(RES, RES);
      const g = cv.getContext('2d');
      g.putImageData(new ImageData(new Uint8ClampedArray(d.buf), RES, RES), 0, 0);
      try { decorate(g, t); } catch (e) { console.error(e); }
      t.canvas = cv;
      if (t.ver === d.ver) t.stale = false;
      requestRender();
    }
  }
  pump();
}
function invalidateTiles(bb, zmin, zmax) {
  for (const t of tiles.values()) {
    if (t.z < zmin || t.z > zmax) continue;
    if (bb) {
      const TS = W / Math.pow(2, t.z), x0 = t.tx * TS, y0 = t.ty * TS;
      if (x0 > bb[2] || x0 + TS < bb[0] || y0 > bb[3] || y0 + TS < bb[1]) continue;
    }
    t.stale = true; t.ver = ++VERSEQ;
  }
  requestRender();
}

// ---------------------------------------------------------------- tile decoration
function decorate(g, t) {
  const z = t.z;
  if (z < 3 || (z > 9 && z < 14)) return;
  const TS = W / Math.pow(2, z), x0 = t.tx * TS, y0 = t.ty * TS, ppm = RES / TS;
  if (z <= 9) glyphTile(g, t, z, TS, x0, y0, ppm);
  else closeTile(g, t, z, TS, x0, y0, ppm);
}
const INK = '#3a3226';
function glyphTile(g, t, z, TS, x0, y0, ppm) {
  const p = T.pFor(z), oct = T.octFor(p);
  const mg = TS * 0.2;
  const circ = circlesIn(x0 - mg, y0 - mg, x0 + TS + mg, y0 + TS + mg);
  const items = [];
  const NM = 8, cm = TS / NM;
  for (let j = -1; j <= NM; j++) for (let i = -1; i <= NM; i++) {
    const gi = t.tx * NM + i, gj = t.ty * NM + j;
    const gx = (gi + 0.15 + 0.7 * T.hash(gi, gj, z * 97 + 11)) * cm, gy = (gj + 0.15 + 0.7 * T.hash(gi, gj, z * 97 + 12)) * cm;
    const o = T.natural(gx, gy, oct, p);
    const e = o.e;
    let b = o.b;
    if (circ.length) b = T.strokeBiome(gx, gy, b, b, circ);
    const hv = T.hash(gi, gj, z * 97 + 13);
    if (b === BB.MOUNTAIN || b === BB.PEAK) { if (T.hash(gi, gj, z * 97 + 15) < 0.72) items.push([gy, 0, gx, clamp(11 + (Math.max(e, 0.52) - 0.52) * 40, 10, 21) * (0.85 + 0.3 * hv), b === BB.PEAK ? 1 : 0]); }
    else if (!T.isWater(b) && b !== BB.SNOW && e > 0.3 && T.hash(gi, gj, z * 97 + 14) < 0.6) items.push([gy, 1, gx, 8 + hv * 4, 0]);
  }
  const NTR = 16, ct = TS / NTR;
  for (let j = -1; j <= NTR; j++) for (let i = -1; i <= NTR; i++) {
    const gi = t.tx * NTR + i, gj = t.ty * NTR + j;
    const gx = (gi + 0.1 + 0.8 * T.hash(gi, gj, z * 89 + 21)) * ct, gy = (gj + 0.1 + 0.8 * T.hash(gi, gj, z * 89 + 22)) * ct;
    const h = T.hash(gi, gj, z * 89 + 23);
    const o = T.natural(gx, gy, oct, p);
    let b = o.b;
    if (circ.length) b = T.strokeBiome(gx, gy, b, b, circ);
    const sz = 5.5 + T.hash(gi, gj, z * 89 + 24) * 2;
    if (b === BB.FOREST && h < 0.85) items.push([gy, 2, gx, sz, 0]);
    else if (b === BB.TAIGA && h < 0.85) items.push([gy, 3, gx, sz, 0]);
    else if (b === BB.JUNGLE && h < 0.9) items.push([gy, 4, gx, sz + 1, 0]);
    else if (b === BB.SWAMP && h < 0.45) items.push([gy, 5, gx, sz, 0]);
    else if (b === BB.GRASS && h < 0.05) items.push([gy, 2, gx, sz * 0.85, 0]);
    else if (b === BB.SCRUB && h < 0.16) items.push([gy, 6, gx, sz * 0.6, 0]);
    else if (b === BB.DESERT && h < 0.1 && z >= 4) items.push([gy, 7, gx, sz * 1.4, 0]);
    else if (b === BB.TUNDRA && h < 0.06) items.push([gy, 5, gx, sz * 0.8, 0]);
  }
  items.sort((a, b) => a[0] - b[0]);
  g.lineJoin = 'round'; g.lineCap = 'round';
  for (const it of items) {
    const X = (it[2] - x0) * ppm, Y = (it[0] - y0) * ppm, s = it[3];
    switch (it[1]) {
      case 0: { // mountain
        const w = s * 1.25;
        g.beginPath(); g.moveTo(X - w / 2, Y); g.lineTo(X, Y - s); g.lineTo(X + w / 2, Y); g.closePath();
        g.fillStyle = '#c4b89e'; g.fill();
        g.beginPath(); g.moveTo(X, Y - s); g.lineTo(X + w / 2, Y); g.lineTo(X + w * 0.08, Y); g.closePath();
        g.fillStyle = '#857a64'; g.fill();
        if (it[4]) { g.beginPath(); g.moveTo(X - w * 0.17, Y - s * 0.66); g.lineTo(X, Y - s); g.lineTo(X + w * 0.17, Y - s * 0.66); g.lineTo(X + w * 0.04, Y - s * 0.72); g.lineTo(X - w * 0.05, Y - s * 0.62); g.closePath(); g.fillStyle = '#f4f3ee'; g.fill(); }
        g.beginPath(); g.moveTo(X - w / 2, Y); g.lineTo(X, Y - s); g.lineTo(X + w / 2, Y);
        g.strokeStyle = INK; g.lineWidth = 1.1; g.stroke();
        break;
      }
      case 1: { // hill
        g.beginPath(); g.moveTo(X - s / 2, Y); g.quadraticCurveTo(X, Y - s * 0.75, X + s / 2, Y);
        g.strokeStyle = 'rgba(58,50,38,0.75)'; g.lineWidth = 1; g.stroke();
        break;
      }
      case 2: case 4: { // broadleaf / jungle tree
        g.strokeStyle = INK; g.lineWidth = 0.9;
        g.beginPath(); g.moveTo(X, Y); g.lineTo(X, Y - s * 0.45); g.stroke();
        g.beginPath(); g.arc(X, Y - s * 0.75, s * 0.42, 0, Math.PI * 2);
        g.fillStyle = it[1] === 4 ? '#3f7a45' : '#5d8a45'; g.fill(); g.stroke();
        break;
      }
      case 3: { // conifer
        g.beginPath(); g.moveTo(X, Y - s * 1.25); g.lineTo(X + s * 0.38, Y - s * 0.15); g.lineTo(X - s * 0.38, Y - s * 0.15); g.closePath();
        g.fillStyle = '#4c7357'; g.fill(); g.strokeStyle = INK; g.lineWidth = 0.9; g.stroke();
        g.beginPath(); g.moveTo(X, Y - s * 0.15); g.lineTo(X, Y); g.stroke();
        break;
      }
      case 5: { // marsh tuft
        g.strokeStyle = 'rgba(52,62,40,0.85)'; g.lineWidth = 0.9;
        g.beginPath(); g.moveTo(X - s * 0.35, Y); g.lineTo(X - s * 0.5, Y - s * 0.6); g.moveTo(X, Y); g.lineTo(X, Y - s * 0.8); g.moveTo(X + s * 0.35, Y); g.lineTo(X + s * 0.5, Y - s * 0.6);
        g.moveTo(X - s * 0.7, Y); g.lineTo(X + s * 0.7, Y); g.stroke();
        break;
      }
      case 6: { g.fillStyle = 'rgba(92,96,52,0.8)'; g.beginPath(); g.arc(X, Y, s * 0.5, 0, Math.PI * 2); g.fill(); break; }
      case 7: { // dune
        g.strokeStyle = 'rgba(150,110,60,0.7)'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(X - s / 2, Y); g.quadraticCurveTo(X - s * 0.1, Y - s * 0.45, X + s / 2, Y - s * 0.05); g.stroke();
        break;
      }
    }
  }
}
function closeTile(g, t, z, TS, x0, y0, ppm) {
  const G = W / Math.pow(2, 20); // ~20.6 ft
  const n = Math.pow(2, 20 - z);
  const mg = G * 1.5;
  const circ = circlesIn(x0 - mg, y0 - mg, x0 + TS + mg, y0 + TS + mg);
  // nearby roads & settlements, once per tile
  const bx0 = x0 - mg, by0 = y0 - mg, bx1 = x0 + TS + mg, by1 = y0 + TS + mg;
  const segs = [];
  const st = ++QSTAMP;
  RGRID.query(bx0, by0, bx1, by1, (r) => {
    if (r._q === st) return;
    r._q = st;
    const hw = ROADTYPES[r.type].ft * FT * 0.5;
    const p = roadGeom(r);
    for (let i = 2; i < p.length; i += 2) {
      const ax = p[i - 2], ay = p[i - 1], cx = p[i], cy = p[i + 1];
      if (Math.max(ax, cx) < bx0 - hw || Math.min(ax, cx) > bx1 + hw || Math.max(ay, cy) < by0 - hw || Math.min(ay, cy) > by1 + hw) continue;
      segs.push(ax, ay, cx, cy, hw);
    }
  });
  const towns = [];
  SGRID.query(bx0 - 0.6, by0 - 0.6, bx1 + 0.6, by1 + 0.6, (s) => {
    const R = settleR(s);
    if (s.x + R < bx0 || s.x - R > bx1 || s.y + R < by0 || s.y - R > by1) return;
    towns.push(s.x, s.y, R * 0.98);
  });
  const blocked = (x, y, pad) => {
    for (let k = 0; k < towns.length; k += 3) { const dx = towns[k] - x, dy = towns[k + 1] - y; if (dx * dx + dy * dy < towns[k + 2] * towns[k + 2]) return true; }
    for (let k = 0; k < segs.length; k += 5) if (segDist(x, y, segs[k], segs[k + 1], segs[k + 2], segs[k + 3]) < segs[k + 4] + pad) return true;
    return false;
  };
  const items = [];
  const i0 = t.tx * n - 1, i1 = (t.tx + 1) * n, j0 = t.ty * n - 1, j1 = (t.ty + 1) * n;
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const gx = (i + 0.1 + 0.8 * T.hash(i, j, 501)) * G, gy = (j + 0.1 + 0.8 * T.hash(i, j, 502)) * G;
    const b = T.biomeAt(gx, gy, z, circ);
    if (T.isWater(b)) continue;
    const h = T.hash(i, j, 503), hs = T.hash(i, j, 504), hv = Math.floor(T.hash(i, j, 505) * 3);
    let kind = null, rft = 0;
    switch (b) {
      case BB.FOREST: if (h < 0.78) { kind = 'oak'; rft = 9 + hs * 8; } break;
      case BB.TAIGA: if (h < 0.74) { kind = 'pine'; rft = 7 + hs * 5; } break;
      case BB.JUNGLE: if (h < 0.9) { kind = h < 0.25 ? 'palm' : 'oak'; rft = 10 + hs * 8; } break;
      case BB.SWAMP: if (h < 0.22) { kind = 'oak'; rft = 7 + hs * 6; } break;
      case BB.GRASS: if (h < 0.045) { kind = 'oak'; rft = 8 + hs * 7; } break;
      case BB.SCRUB: if (h < 0.03) { kind = 'oak'; rft = 6 + hs * 4; } break;
      case BB.TUNDRA: if (h < 0.015) { kind = 'pine'; rft = 5 + hs * 3; } break;
      case BB.BEACH: if (h < 0.02) { kind = 'palm'; rft = 8 + hs * 5; } break;
      case BB.MOUNTAIN: if (h < 0.04) { kind = 'pine'; rft = 6 + hs * 4; } break;
    }
    if (kind && !blocked(gx, gy, rft * FT * 0.6)) items.push([gy, kind, gx, rft, hv]);
    // second layer: bushes & rocks
    const h2 = T.hash(i, j, 506), hs2 = T.hash(i, j, 507);
    let k2 = null, r2 = 0;
    const rockP = { 14: 0.25, 15: 0.12, 12: 0.05, 10: 0.03, 11: 0.03, 5: 0.012, 4: 0.01, 13: 0.03 }[b] || 0;
    const bushP = { 5: 0.08, 11: 0.14, 6: 0.1, 7: 0.05, 10: 0.01, 12: 0.04, 9: 0.12, 8: 0.15 }[b] || 0;
    if (h2 < rockP) { k2 = 'rock'; r2 = 2 + hs2 * (b === 14 || b === 15 ? 7 : 3.5); }
    else if (h2 < rockP + bushP) { k2 = 'bush'; r2 = 2.5 + hs2 * 3; }
    if (k2) {
      const gx2 = (i + 0.1 + 0.8 * T.hash(i, j, 508)) * G, gy2 = (j + 0.1 + 0.8 * T.hash(i, j, 509)) * G;
      if (!blocked(gx2, gy2, r2 * FT)) items.push([gy2, k2, gx2, r2, hv]);
    }
  }
  items.sort((a, b) => a[0] - b[0]);
  for (const it of items) {
    const rp = it[3] * FT * ppm;
    if (rp < 1.2) continue;
    const sp = sprite(it[1], it[4], Math.min(rp, 150));
    const scale = rp > 150 ? rp / 150 : 1;
    const S = sp.width * scale;
    g.drawImage(sp, (it[2] - x0) * ppm - S / 2, (it[0] - y0) * ppm - S / 2, S, S);
  }
}
