const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
  await p.addInitScript((sd) => { try { localStorage.setItem('atlas-world-v1', JSON.stringify({ v: 2, gen: 20, seed: sd, edits: {}, market: { day: 240 } })); } catch (e) {} }, +(process.env.SEED || 777));
  const errs = []; p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.goto('file:///tmp/claude-0/dbg.html'); await p.waitForTimeout(2500);
  const r = await p.evaluate(() => {
    const A = window.__A; const t0 = performance.now(); const N = A.guildNet(); const ms = Math.round(performance.now() - t0);
    const G = A.GUILDS, out = { ms };
    const groups = { village: (s) => s.tier === 1, town: (s) => s.tier === 2, city: (s) => s.tier === 3, capital: (s) => s.tier === 4 && s.pop < 60000, metropolis: (s) => s.tier === 4 && s.pop >= 60000 };
    for (const [g, f] of Object.entries(groups)) {
      const ss = A.SET.filter(f); const row = { n: ss.length };
      for (const k of G) { const c = [0, 0, 0, 0]; for (const s of ss) c[A.guildLevel(s, k)]++; row[k] = c.map((v) => Math.round(v / Math.max(1, ss.length) * 100)).join('/'); }
      row.avgGuilds = (ss.reduce((a, s) => a + G.filter((k) => A.guildLevel(s, k) >= 1).length, 0) / Math.max(1, ss.length)).toFixed(2);
      out[g] = row;
    }
    // towns with no hall: how far to the nearest
    const far = A.SET.filter((s) => s.tier >= 1 && !A.hallFor(s)).length;
    out.noHallWithin150 = far + ' of ' + A.SET.length;
    out.hq = G.map((k) => k + ':' + A.SET.filter((s) => A.guildLevel(s, k) === 3).length).join(' ');
    out.realms = A.REALMS.map((R) => R.name).join(' | ');
    return out;
  });
  console.log(JSON.stringify(r, null, 1));
  { const m = r.metropolis || (r.groups || {}).metropolis; const avg = m && (m.avgGuilds || m.avg); console.log((!m || +avg === 5 ? 'PASS ' : 'FAIL ') + 'every metropolis has every guild (' + avg + ')'); } console.log(errs.join('\n')); await b.close();
})();
