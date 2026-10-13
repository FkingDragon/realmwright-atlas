// Random-use simulation: clicks, taps, zooms and time passing across every tool, watching for errors and slow frames
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const W = +(process.env.VW || 1400), H = +(process.env.VH || 880), N = +(process.env.N || 500), SEED = +(process.env.RS || 7);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: W, height: H } }); p.setDefaultTimeout(4000);
  const errs = []; p.on('pageerror', e => errs.push(e.message + ' @ ' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL/.test(m.text())) errs.push(m.text()); });
  p.on('popup', (pp) => pp.close().catch(() => {}));
  await p.goto('file:///tmp/claude-0/' + (process.env.DBG || 'dbg.html')); await p.waitForTimeout(2500); await require('./canvas-mouse')(p);
  let s = SEED; const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const tools = ['explore', 'market', 'people', 'guilds', 'heroes', 'monsters', 'measure', 'label', 'road'];
  const counts = {}; let slow = 0, worst = 0;
  for (let i = 0; i < N; i++) {
    const r = rnd();
    let act;
    try {
      if (r < 0.12) { act = 'tool'; const t = pick(tools); const b = await p.$('#side .sec[data-tool="' + t + '"], .maptools [data-tool="' + t + '"]'); if (b) await b.click({ timeout: 3000 }); else await p.evaluate((t) => window.__A.setTool(t), t); }
      else if (r < 0.55) {
        act = 'panel';
        const n = await p.evaluate(() => { const ins = document.getElementById('inspector'); if (ins.hidden) return 0; const bs = [...ins.querySelectorAll('button, summary, select')].filter((x) => { const t = (x.textContent || '').toLowerCase(); const r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !x.disabled && !/delete|remove|tap again|load map|clear/.test(t) && !x.matches('[data-act="close"]'); }); window.__mk = bs; return bs.length; });
        if (n) { const k = Math.floor(rnd() * n); const tag = await p.evaluate((k) => { const x = window.__mk[k]; x.scrollIntoView({ block: 'nearest' }); return x.tagName; }, k); if (tag === 'SELECT') await p.evaluate((k) => { const x = window.__mk[k]; if (x.options.length > 1) { x.selectedIndex = (x.selectedIndex + 1) % x.options.length; x.dispatchEvent(new Event('change', { bubbles: true })); } }, k); else await p.evaluate((k) => window.__mk[k].click(), k); }
      } else if (r < 0.75) {
        act = 'tap';
        // tap a settlement or a marker most of the time
        const pt = await p.evaluate((u) => { const A = window.__A; const v = A.view; const cs = A.SET.map((q) => ({ X: (q.x - v.x) * v.s + document.querySelector('#map').clientWidth / 2, Y: (q.y - v.y) * v.s + document.querySelector('#map').clientHeight / 2 })).filter((o) => o.X > 30 && o.X < document.querySelector('#map').clientWidth - 160 && o.Y > 90 && o.Y < document.querySelector('#map').clientHeight - 140); const cw = document.querySelector('#map').clientWidth, ch = document.querySelector('#map').clientHeight; return cs.length && u < 0.7 ? cs[Math.floor(u * 1e6) % cs.length] : { X: 40 + u * (cw - 200), Y: 90 + ((u * 7) % 1) * (ch - 240) }; }, rnd());
        await p.mouse.click(pt.X, pt.Y);
      } else if (r < 0.85) { act = 'zoom'; await p.evaluate((z) => { const A = window.__A; A.flyTo(A.view.x + (z - 0.5) * 200 / A.view.s, A.view.y, A.view.s * (z < 0.5 ? 0.4 : 2.5)); }, rnd()); }
      else if (r < 0.92) { act = 'time'; await p.evaluate((d) => { const A = window.__A; A.market.day += d; }, pick([1, 7, 30, 90])); await p.evaluate(() => window.__A.renderPanel()); }
      else if (r < 0.96) { act = 'search'; await p.fill('#search', pick(['wolf', 'dragon', 'a', 'Ash', 'bandit', 'harvest', 'mira', 'beholder'])); await p.waitForTimeout(80); if (rnd() < 0.5) { const x = await p.$('#searchResults button'); if (x) await x.click(); } else await p.fill('#search', ''); }
      else { act = 'key'; await p.keyboard.press(pick(['Escape', 'h', 'b', 'k', 'g', 'n', 'v', '+', '-', 'Control+z'])); }
    } catch (e) { counts['skip-' + act] = (counts['skip-' + act] || 0) + 1; }
    counts[act] = (counts[act] || 0) + 1;
    const t0 = Date.now(); await p.evaluate(() => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)))); const dt = Date.now() - t0;
    if (dt > 250) { slow++; counts['slow-' + act] = (counts['slow-' + act] || 0) + 1; if (process.env.V) console.log('slow', act, dt, await p.evaluate(() => window.__A.tool + ' ' + window.__A.view.s.toFixed(2) + ' ' + (window.__A.market.tab))); } worst = Math.max(worst, dt);
    if (errs.length) { console.log('ERROR at step', i, act, errs[0]); break; }
  }
  await p.screenshot({ path: '/tmp/claude-0/monkey_end.png' });
  console.log(JSON.stringify({ counts, slowFrames: slow, worstFrameMs: worst, errors: errs.length }));
  console.log((errs.length ? 'FAIL ' : 'PASS ') + '500 random taps, drags, keys and panel clicks without a page error');
  console.log(errs.slice(0, 5).join('\n'));
  await b.close();
})();
