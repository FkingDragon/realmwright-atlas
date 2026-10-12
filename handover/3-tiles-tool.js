// ================================================================ battle map editing (Tilewright tools)
// The Tiles tool paints 5-ft squares, props and the walls, doors, windows and fences on grid lines.
// Everything is kept in edits.bm as changes over what the world generates, chunk by chunk:
// edits.bm['cx,cy'] = { t: {i: terrain}, p: {i: prop or -1}, h: {i: edge}, v: {i: edge} }, i = square within the chunk.
const tw = { kind: 't', i: PX.ID.GRASS, mode: 'paint', brush: 1 };
const TW_EDGES = [[1, 'Wall'], [2, 'Door'], [4, 'Window'], [3, 'Fence'], [0, 'Erase']];
const TW_FLOORS = new Set([PX.ID.PLANKS, PX.ID.FLAG, PX.ID.ROCK, PX.ID.SAND, PX.ID.ROAD, PX.ID.SNOW, PX.ID.ICE]);
let twOp = null, twWasActive = false;
const twActive = () => pxAlpha() >= 0.5;
const cellX = (px) => Math.floor(wxOf(px) * CELL), cellY = (py) => Math.floor(wyOf(py) * CELL);
function bmSet(kind, cx, cy, v) {
  if (!edits.bm) edits.bm = {};
  const k = bmKey(cx, cy), i = bmIdx(cx, cy);
  let c = edits.bm[k];
  if (v === undefined) {
    if (!c || !c[kind] || c[kind][i] === undefined) return false;
    delete c[kind][i];
    if (!Object.keys(c[kind]).length) delete c[kind];
    if (!Object.keys(c).length) delete edits.bm[k];
    return true;
  }
  if (!c) c = edits.bm[k] = {};
  if (!c[kind]) c[kind] = {};
  if (c[kind][i] === v) return false;
  c[kind][i] = v;
  return true;
}
// what is on the map now, worked out the same way the pixels are
function twLookup() {
  const m = new Map();
  const lay = (cx, cy) => { const a = Math.floor(cx / PCS), b = Math.floor(cy / PCS), k = a + ',' + b; let L = m.get(k); if (!L) { L = pxLayout(a, b); m.set(k, L); } return L; };
  return {
    t(cx, cy) {
      const L = lay(cx, cy), CW = L.N + 4, v = L.ov[(cy - L.Y0 + 2) * CW + cx - L.X0 + 2];
      if (v < 253) return v;
      const n = PX.naturalT(cx, cy, L.circ);
      if (v === 255) return n;
      return (n === PX.ID.DEEP || n === PX.ID.SHAL || n === PX.ID.MARSH || n === PX.ID.ICE) ? PX.ID.PLANKS : v === 254 ? PX.ID.ROAD : PX.ID.FLAG;
    },
    h(x, y) { const L = lay(x, y); return L.eh[(y - L.Y0 + 1) * (L.N + 2) + x - L.X0 + 1]; },
    v(x, y) { const L = lay(x, y); return L.ev[(y - L.Y0 + 1) * (L.N + 2) + x - L.X0 + 1]; },
  };
}
function twGrow(x0, y0, x1, y1) {
  const o = twOp;
  o.bb = o.bb ? [Math.min(o.bb[0], x0), Math.min(o.bb[1], y0), Math.max(o.bb[2], x1), Math.max(o.bb[3], y1)] : [x0, y0, x1, y1];
  pxInvalidate([(x0 - 1) / CELL, (y0 - 1) / CELL, (x1 + 2) / CELL, (y1 + 2) / CELL]);
}
const twBB = (b) => [(b[0] - 1) / CELL, (b[1] - 1) / CELL, (b[2] + 2) / CELL, (b[3] + 2) / CELL];
function twApply(cx, cy) {
  if (tw.kind === 't') {
    const n = tw.brush, o = -Math.floor((n - 1) / 2);
    let ch = false;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) ch = bmSet('t', cx + o + x, cy + o + y, tw.i === 'nat' ? undefined : tw.i) || ch;
    if (ch) twGrow(cx + o, cy + o, cx + o + n - 1, cy + o + n - 1);
  } else if (tw.kind === 'p') {
    if (bmSet('p', cx, cy, tw.i === 'nat' ? undefined : tw.i === 'none' ? -1 : tw.i)) twGrow(cx, cy, cx, cy);
  }
}
function lineCellsTw(a, b, fn) {
  let [x0, y0] = a; const [x1, y1] = b, dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let e = dx + dy, guard = 0;
  for (;;) { fn(x0, y0); if ((x0 === x1 && y0 === y1) || ++guard > 4000) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}
const vertexAt = (p) => [Math.round(wxOf(p.x) * CELL), Math.round(wyOf(p.y) * CELL)];
function edgeAt(p) {
  const fx = wxOf(p.x) * CELL, fy = wyOf(p.y) * CELL, dv = Math.abs(fx - Math.round(fx)), dh = Math.abs(fy - Math.round(fy));
  return dh < dv ? { h: 1, x: Math.floor(fx), y: Math.round(fy) } : { h: 0, x: Math.round(fx), y: Math.floor(fy) };
}
function edgeRun(a, b) {
  const out = [];
  if (Math.abs(b[0] - a[0]) >= Math.abs(b[1] - a[1])) { for (let x = Math.min(a[0], b[0]); x < Math.max(a[0], b[0]); x++) out.push({ h: 1, x, y: a[1] }); }
  else for (let y = Math.min(a[1], b[1]); y < Math.max(a[1], b[1]); y++) out.push({ h: 0, x: a[0], y });
  return out;
}
function setEdge(e, v) { if (bmSet(e.h ? 'h' : 'v', e.x, e.y, v)) twGrow(e.x - 1, e.y - 1, e.x, e.y); }
function twFill(cx, cy) {
  if (tw.kind !== 't') { twApply(cx, cy); return; }
  const Lk = twLookup(), from = Lk.t(cx, cy), to = tw.i === 'nat' ? null : tw.i;
  if (to === from) return;
  const st = [[cx, cy]], seen = new Set();
  let n = 0, x0 = cx, y0 = cy, x1 = cx, y1 = cy;
  while (st.length && n < 5000) {
    const [x, y] = st.pop(), k = x + ',' + y;
    if (seen.has(k)) continue;
    seen.add(k);
    if (Lk.t(x, y) !== from) continue;
    if (bmSet('t', x, y, to === null ? undefined : to)) n++;
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    const wall = (v) => v === 1 || v === 2 || v === 4;
    if (!wall(Lk.v(x + 1, y))) st.push([x + 1, y]);
    if (!wall(Lk.v(x, y))) st.push([x - 1, y]);
    if (!wall(Lk.h(x, y + 1))) st.push([x, y + 1]);
    if (!wall(Lk.h(x, y))) st.push([x, y - 1]);
  }
  twGrow(x0, y0, x1, y1);
  if (n >= 5000) toast('Filled 5,000 squares, the most at once. Fill again to carry on.');
}
function twBuilding(a, b) {
  const x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]), y0 = Math.min(a[1], b[1]), y1 = Math.max(a[1], b[1]);
  if (x1 - x0 < 1 || y1 - y0 < 1) { toast('Drag out at least 2 × 2 squares for a building.'); return; }
  const floor = tw.kind === 't' && TW_FLOORS.has(tw.i) ? tw.i : PX.ID.PLANKS;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    bmSet('t', x, y, floor); bmSet('p', x, y, -1);
    if (x > x0) bmSet('v', x, y, 0);
    if (y > y0) bmSet('h', x, y, 0);
  }
  for (let x = x0; x <= x1; x++) { bmSet('h', x, y0, 1); bmSet('h', x, y1 + 1, 1); }
  for (let y = y0; y <= y1; y++) { bmSet('v', x0, y, 1); bmSet('v', x1 + 1, y, 1); }
  bmSet('h', Math.floor((x0 + x1) / 2), y1 + 1, 2);
  twGrow(x0 - 1, y0 - 1, x1 + 1, y1 + 1);
}
function twDown(p) {
  if (!twActive()) return false;
  const c = [cellX(p.x), cellY(p.y)];
  twOp = { before: JSON.stringify(edits), bb: null };
  if (tw.kind === 'e') twOp.edge = { a: vertexAt(p), b: vertexAt(p), single: edgeAt(p), moved: false };
  else if (tw.mode === 'building') twOp.rect = { a: c, b: c };
  else if (tw.mode === 'fill') { twFill(c[0], c[1]); twFinish('Fill with ' + twName().toLowerCase()); return true; }
  else { twOp.last = c; twApply(c[0], c[1]); }
  requestRender();
  return true;
}
function twMove(p) {
  if (!twOp) return;
  const c = [cellX(p.x), cellY(p.y)];
  if (twOp.edge) { const b = vertexAt(p); twOp.edge.b = b; if (b[0] !== twOp.edge.a[0] || b[1] !== twOp.edge.a[1]) twOp.edge.moved = true; }
  else if (twOp.rect) twOp.rect.b = c;
  else if (twOp.last && (c[0] !== twOp.last[0] || c[1] !== twOp.last[1])) { lineCellsTw(twOp.last, c, (x, y) => twApply(x, y)); twOp.last = c; }
  requestRender();
}
function twUp(cancel) {
  const o = twOp;
  if (!o) return;
  if (cancel) { edits = JSON.parse(o.before); twOp = null; if (o.bb) pxInvalidate(twBB(o.bb)); requestRender(); return; }
  if (o.edge) {
    const E = o.edge, v = tw.i;
    if (E.moved) for (const e of edgeRun(E.a, E.b)) setEdge(e, v);
    else { const Lk = twLookup(), cur = E.single.h ? Lk.h(E.single.x, E.single.y) : Lk.v(E.single.x, E.single.y); setEdge(E.single, v && cur === v ? 0 : v); }
    twFinish(v ? (E.moved ? 'Build ' : 'Place ') + twName().toLowerCase() : 'Remove wall');
  } else if (o.rect) { twBuilding(o.rect.a, o.rect.b); twFinish('Raise a building'); }
  else twFinish((tw.kind === 'p' ? 'Place ' : 'Paint ') + twName().toLowerCase());
}
function twFinish(label) {
  const o = twOp;
  twOp = null;
  if (!o) return;
  const after = JSON.stringify(edits);
  if (after === o.before || !o.bb) { requestRender(); return; }
  const inv = { bm: twBB(o.bb) };
  history.push({ before: o.before, after, inv, label });
  if (history.length > 80) history.shift();
  future = [];
  afterChange(inv);
}
function twName() {
  if (tw.kind === 't') return tw.i === 'nat' ? 'Natural ground' : PX.TER[tw.i].name;
  if (tw.kind === 'p') return tw.i === 'nat' ? 'Natural props' : tw.i === 'none' ? 'No prop' : PX.PROPS[tw.i].name;
  return (TW_EDGES.find((e) => e[0] === tw.i) || [0, 'Wall'])[1];
}
// little pictures for the palette, drawn once by the same renderer as the map
const twSw = new Map();
function twSwatch(kind, i) {
  const k = kind + i;
  if (twSw.has(k)) return twSw.get(k);
  let url = '';
  try {
    const cv = mkCanvas(16, 16), g = cv.getContext('2d');
    if (kind === 'e') {
      const N = 2, CW = N + 4, RW = N + 2, job = { N, X0: 0, Y0: 0, ov: new Uint8Array(CW * CW).fill(PX.ID.GRASS), pr: new Int8Array(N * N).fill(-1), eh: new Uint8Array(RW * RW), ev: new Uint8Array(RW * RW), circ: new Float64Array(0) };
      if (i) for (let x = 0; x < N; x++) job.eh[2 * RW + x + 1] = i;
      cv.width = cv.height = 32;
      g.putImageData(new ImageData(PX.render(job), 32, 32), 0, 0);
    } else g.putImageData(new ImageData(PX.swatch(kind, i), 16, 16), 0, 0);
    url = cv.toDataURL();
  } catch (e) { url = ''; }
  twSw.set(k, url);
  return url;
}
function twButton(kind, i, name, extra) {
  const on = tw.kind === kind && tw.i === i;
  const img = typeof i === 'number' ? '<img src="' + twSwatch(kind, i) + '" alt="">' : '<span class="tw-x">' + (extra || '') + '</span>';
  return '<button type="button" class="tw-b" data-tw="sel" data-k="' + kind + '" data-v="' + i + '" aria-pressed="' + on + '" title="' + esc(name) + '" aria-label="' + esc(name) + '">' + img + '</button>';
}
function tilesPanel() {
  const T2 = PX.TER, order = [3, 14, 15, 16, 17, 4, 18, 2, 12, 1, 0, 13, 9, 11, 8, 5, 6, 10, 7];
  let html = head('Battle map', 'Paint 5-ft squares, props, walls and doors on the battle map. Your changes save with the world and travel in its map code.');
  if (!twActive()) html += '<p class="hint">Zoom in to the battle map to start painting squares.</p><div class="actions"><button type="button" class="btn primary" data-tw="zoom">Zoom to the battle map</button></div>';
  html += '<div class="seg" role="group" aria-label="Tool">' + [['paint', 'Paint'], ['fill', 'Fill'], ['building', 'Building']].map(([k, l]) => '<button type="button" data-tw="mode" data-v="' + k + '" aria-pressed="' + (tw.mode === k) + '">' + l + '</button>').join('') + '</div>' +
    '<section><h3>Terrain</h3><div class="tw-grid">' + order.map((i) => twButton('t', i, T2[i].name)).join('') + twButton('t', 'nat', 'Natural ground: what the world has here', '↺') + '</div></section>' +
    '<section><h3>Props</h3><div class="tw-grid">' + PX.PROPS.map((p, i) => twButton('p', i, p.name)).join('') + twButton('p', 'none', 'No prop: clears a square', '∅') + twButton('p', 'nat', 'Natural props: trees and rocks as the world grows them', '↺') + '</div></section>' +
    '<section><h3>Edge walls</h3><div class="tw-grid">' + TW_EDGES.map(([v, n]) => v ? twButton('e', v, n) : twButton('e', 0, 'Erase walls, doors and fences', '✕')).join('') + '</div></section>' +
    '<p class="tw-cur">Selected: <b>' + esc(twName()) + '</b></p>';
  if (tw.kind === 't' && tw.mode === 'paint') html += '<div class="field"><span class="lab">Brush</span>' + '<div class="seg">' + [1, 2, 3, 5].map((n) => '<button type="button" data-tw="brush" data-v="' + n + '" aria-pressed="' + (tw.brush === n) + '">' + n + ' × ' + n + '</button>').join('') + '</div></div>';
  const how = tw.kind === 'e' ? 'Drag along the grid lines to build a run of ' + twName().toLowerCase() + 's; tap a line to place or remove one.'
    : tw.mode === 'building' ? 'Drag out a rectangle to raise a building: floor, walls all round and a door on the south side. Pick a floor first if you want stone.'
      : tw.mode === 'fill' ? 'Tap to fill a patch of matching ground. Walls and doors stop the fill.' : 'Drag to paint.';
  html += '<p class="hint">' + how + ' Two fingers, right-drag or Space-drag move the map. Undo with Ctrl+Z.</p>';
  return html;
}
$('inspector').addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-tw]');
  if (!b) return;
  const a = b.dataset.tw, v = b.dataset.v;
  if (a === 'sel') { tw.kind = b.dataset.k; tw.i = v === 'nat' || v === 'none' ? v : +v; if (tw.kind === 'e') tw.mode = 'paint'; if (tw.kind === 'p' && tw.mode === 'building') tw.mode = 'paint'; }
  else if (a === 'mode') { tw.mode = v; if (v === 'building' && tw.kind === 'e') { tw.kind = 't'; tw.i = PX.ID.PLANKS; } if (v === 'fill' && tw.kind !== 't') { tw.kind = 't'; tw.i = PX.ID.GRASS; } }
  else if (a === 'brush') tw.brush = +v;
  else if (a === 'zoom') { flyTo(view.x, view.y, Math.max(view.s, 16 * CELL), 500); }
  renderPanel();
  requestRender();
});
// hover square, brush, edge runs and building outlines
function drawTilesOverlay() {
  if (tool !== 'tiles' || !twActive()) return;
  const q = 1 / CELL, px = (cx) => Math.round(sx(cx * q)), py = (cy) => Math.round(sy(cy * q));
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#e3b341';
  if (twOp && twOp.edge) {
    const E = twOp.edge;
    ctx.beginPath();
    if (E.moved) for (const e of edgeRun(E.a, E.b)) { ctx.moveTo(px(e.x), py(e.y)); ctx.lineTo(e.h ? px(e.x + 1) : px(e.x), e.h ? py(e.y) : py(e.y + 1)); }
    ctx.lineWidth = 4; ctx.stroke();
  } else if (twOp && twOp.rect) {
    const a = twOp.rect.a, b = twOp.rect.b, x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]) + 1, y0 = Math.min(a[1], b[1]), y1 = Math.max(a[1], b[1]) + 1;
    ctx.fillStyle = 'rgba(214,165,72,.18)'; ctx.fillRect(px(x0), py(y0), px(x1) - px(x0), py(y1) - py(y0));
    ctx.setLineDash([6, 4]); ctx.strokeRect(px(x0), py(y0), px(x1) - px(x0), py(y1) - py(y0)); ctx.setLineDash([]);
    ctx.font = '600 12px ' + 'Atkinson Hyperlegible, system-ui, sans-serif'; ctx.fillStyle = '#e3b341';
    ctx.fillText((x1 - x0) * 5 + ' × ' + (y1 - y0) * 5 + ' ft', px(x0), py(y0) - 6);
  } else if (hover) {
    if (tw.kind === 'e') {
      const e = edgeAt(hover);
      ctx.beginPath(); ctx.moveTo(px(e.x), py(e.y)); ctx.lineTo(e.h ? px(e.x + 1) : px(e.x), e.h ? py(e.y) : py(e.y + 1)); ctx.lineWidth = 4; ctx.stroke();
    } else {
      const n = tw.kind === 't' && tw.mode === 'paint' ? tw.brush : 1, o = -Math.floor((n - 1) / 2), cx = cellX(hover.x) + o, cy = cellY(hover.y) + o;
      ctx.strokeRect(px(cx) + 0.5, py(cy) + 0.5, px(cx + n) - px(cx) - 1, py(cy + n) - py(cy) - 1);
    }
  }
  ctx.restore();
}
