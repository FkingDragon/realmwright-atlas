const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await b.newContext({ viewport: { width: 1200, height: 800 } });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///tmp/claude-0/dbg.html'); await p.waitForTimeout(2500);
  const r1 = await p.evaluate(async () => {
    const A = window.__A; const r = A.ROADS.find((q) => q.type === 2 && q.a); const id = r.id;
    // reshape through the same code the drag uses
    const E = A.roadEditable(r); E.pts[E.h[1] * 2] += 0.5;
    const s = A.SET.find((x) => x.id === r.a);
    A.edits.rov[id] = { pts: E.pts, h: E.h };
    return { id, a: r.a, sx: s.x, sy: s.y };
  });
  // commit through a real edit: move the town by setting an override and reapplying via a normal save path
  const r2 = await p.evaluate(async (o) => {
    const A = window.__A; localStorage.setItem('chk', JSON.stringify(o));
    const st = JSON.parse(localStorage.getItem('atlas-world-v1')); st.edits.rov = A.edits.rov; st.edits.ov = st.edits.ov || {}; st.edits.ov[o.a] = { x: o.sx + 0.3, y: o.sy + 0.2 }; localStorage.setItem('atlas-world-v1', JSON.stringify(st));
    return true;
  }, r1);
  const saved = await p.evaluate(() => localStorage.getItem('atlas-world-v1'));
  await p.close();
  const p2 = await ctx.newPage(); p2.on('pageerror', e => errs.push(e.message));
  await p2.addInitScript((sv) => { localStorage.setItem('atlas-world-v1', sv); }, saved);
  await p2.goto('file:///tmp/claude-0/dbg.html'); await p2.waitForTimeout(2500);
  const r3 = await p2.evaluate((o) => { const A = window.__A; const r = A.RBY.get(o.id); const g = A.roadGeom(r); const s = A.SET.find((x) => x.id === o.a); const endA = Math.min(Math.hypot(g[0] - s.x, g[1] - s.y), Math.hypot(g[g.length - 2] - s.x, g[g.length - 1] - s.y)); return { hasPts: !!r.pts, endGap: endA, moved: s.x - o.sx, nb: A.SET.length }; }, r1);
  console.log(JSON.stringify(r3));
  console.log((r3.hasPts && r3.endGap < 0.5 && !r3.moved ? 'PASS ' : 'FAIL ') + 'a reshaped road survives a reload, still tied to its towns');
  console.log('ERR', errs.join('\n'));
  await b.close();
})();
