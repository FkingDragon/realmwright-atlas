const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  for (const f of ['dbg.html']) {
    const p = await b.newPage({ viewport: { width: 1400, height: 880 } });
    await p.addInitScript(() => { try { localStorage.setItem('atlas-world-v1', JSON.stringify({ v: 2, gen: 20, seed: 777, edits: {}, market: { day: 240 } })); } catch (e) {} });
    await p.goto('file:///tmp/claude-0/' + f); await p.waitForTimeout(2500);
    const r = await p.evaluate(async () => {
      const A = window.__A, out = {};
      const frame = () => new Promise((res) => requestAnimationFrame(() => res()));
      for (const [nm, id, sc] of [['capital-town', null, 330], ['capital-street', null, 1200], ['city-town', 'c', 600], ['village-battle', 'v', 3000]]) {
        const s = id === 'c' ? A.SET.filter((x) => x.tier === 3)[2] : id === 'v' ? A.SET.filter((x) => x.tier === 1)[40] : A.SET.filter((x) => x.tier === 4).sort((a, b) => b.pop - a.pop)[0];
        A.flyTo(s.x, s.y, sc, 0); await new Promise((r) => setTimeout(r, 2000));
        const ts = [];
        for (let i = 0; i < 40; i++) { const t0 = performance.now(); A.view.x += 30 / A.view.s; A.requestRender(); await frame(); await frame(); ts.push(performance.now() - t0); }
        // zoom in and out smoothly
        const tz = [];
        for (let i = 0; i < 30; i++) { const t0 = performance.now(); A.view.s *= i < 15 ? 1.08 : 1 / 1.08; A.requestRender(); await frame(); await frame(); tz.push(performance.now() - t0); }
        ts.sort((a, b) => a - b); tz.sort((a, b) => a - b);
        out[nm] = 'pan median ' + ts[20].toFixed(0) + ' worst ' + ts[39].toFixed(0) + ' | zoom median ' + tz[15].toFixed(0) + ' worst ' + tz[29].toFixed(0);
      }
      return out;
    });
    console.log(f, JSON.stringify(r, null, 1));
    for (const k in r) { const m = /pan median (\d+)/.exec(r[k]); if (m) console.log((+m[1] < 60 ? 'PASS ' : 'FAIL ') + f + ' ' + k + ': panning stays smooth (median ' + m[1] + ' ms per frame)'); }
    await p.close();
  }
  await b.close();
})();
