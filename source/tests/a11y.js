// Accessibility and phone checks for the v24 layout (item 8), plus the version label (item 5)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1366, height: 820 } });
  await ctx.addInitScript(() => { localStorage.setItem('atlas-world-v1', JSON.stringify({ v: 2, gen: 20, seed: 777, edits: {}, market: { day: 300 } })); });
  const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.goto('file:///tmp/claude-0/dbg.html'); await p.waitForTimeout(2600);

  // skip links come first and work
  await p.keyboard.press('Tab');
  const first = await p.evaluate(() => [document.activeElement.className, document.activeElement.textContent, getComputedStyle(document.activeElement).top]);
  ok(first[0] === 'skip' && /atlas panel/i.test(first[1]) && parseInt(first[2]) >= 0, 'the first Tab shows "Skip to the atlas panel"');
  await p.keyboard.press('Enter'); await p.waitForTimeout(100);
  ok(await p.evaluate(() => document.activeElement.id === 'inspector' || document.getElementById('inspector').contains(document.activeElement)), 'it moves focus into the atlas panel');

  // the panel is not a live region; a short announcer says where you are
  ok(await p.evaluate(() => !document.getElementById('inspector').hasAttribute('aria-live') && document.getElementById('srAnnounce').getAttribute('aria-live') === 'polite'), 'the panel is not read out whole on every change; a separate announcer is');
  await p.focus('#inspector [data-nav="realm"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(500);
  let ann = await p.$eval('#srAnnounce', (e) => e.textContent);
  ok(/: places$/.test(ann), 'opening a realm announces it (' + ann + ')');
  await p.focus('#navList [data-nav="place"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(600);
  ann = await p.$eval('#srAnnounce', (e) => e.textContent);
  const foc = await p.evaluate(() => { const a = document.activeElement; return { inHead: !!a.closest('.side-head'), tag: a.tagName, txt: a.value || a.textContent }; });
  ok(/Overview$/.test(ann) && foc.inHead, 'opening a place announces it and puts keyboard focus on its name (' + ann + '; ' + foc.tag + ' ' + foc.txt + ')');
  await p.keyboard.press('Tab');
  // keyboard reaches the place tabs from the name
  let tabbed = false;
  for (let i = 0; i < 6 && !tabbed; i++) { if (await p.evaluate(() => !!document.activeElement.dataset.ptab)) tabbed = true; else await p.keyboard.press('Tab'); }
  ok(tabbed, 'Tab reaches the place tabs');
  await p.keyboard.press('Enter'); await p.waitForTimeout(400);

  // flying to a town puts it in the middle of the framed map
  const off = await p.evaluate(() => { const A = window.__A, s = A.SET.find((x) => x.tier === 3); A.flyTo(s.x, s.y, 4, 0); return s.id; });
  await p.waitForTimeout(300);
  await p.evaluate((id) => { const A = window.__A; const btn = document.createElement('button'); btn.dataset.nav = 'fly'; btn.dataset.v = id; document.getElementById('inspector').appendChild(btn); btn.click(); btn.remove(); }, off);
  await p.waitForTimeout(2200);
  const ctr = await p.evaluate((id) => { const A = window.__A, s = A.SET.find((x) => x.id === id), v = A.view; return [Math.abs(s.x - v.x) * v.s, Math.abs(s.y - v.y) * v.s]; }, off);
  ok(ctr[0] < 3 && ctr[1] < 3, '"Show on map" centres the town in the frame (off by ' + ctr.map((x) => x.toFixed(1)).join(', ') + ' px)');

  // version label
  const ver = await p.$eval('#helpVer', (e) => e.textContent);
  ok(/Realmwright Atlas v\d+/.test(ver) && (await p.evaluate(() => document.documentElement.lang)) === 'en', 'Help shows the version (' + ver + ') and the page language is set');
  await p.click('#btnWorld'); await p.waitForTimeout(300);
  ok(/Realmwright Atlas v\d+/.test(await p.$eval('#worldBody', (e) => e.innerText)), 'the World menu shows the version too');
  await p.keyboard.press('Escape');

  // contrast of the main text colours on the panel background
  const cr = await p.evaluate(() => {
    const lum = (hex) => { const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
    const ratio = (a, b2) => { const x = lum(a), y = lum(b2); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const cs = getComputedStyle(document.documentElement), g = (k) => cs.getPropertyValue(k).trim();
    return { muted: ratio(g('--muted'), g('--bg')), text: ratio(g('--text'), g('--bg')), gold: ratio(g('--brass'), g('--bg')), ink: ratio(g('--ink'), g('--brass')) };
  });
  ok(cr.muted >= 4.5 && cr.text >= 7 && cr.gold >= 4.5 && cr.ink >= 4.5, 'text colours meet WCAG AA contrast (muted ' + cr.muted.toFixed(1) + ', text ' + cr.text.toFixed(1) + ', gold ' + cr.gold.toFixed(1) + ', dark on gold ' + cr.ink.toFixed(1) + ')');

  // phone: targets big enough
  const ph = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ph.addInitScript(() => { localStorage.setItem('atlas-world-v1', JSON.stringify({ v: 2, gen: 20, seed: 777, edits: {}, market: { day: 300 } })); });
  const q = await ph.newPage(); q.on('pageerror', (e) => errs.push(e.message));
  await q.goto('file:///tmp/claude-0/dbg.html'); await q.waitForTimeout(2800);
  await q.tap('#inspector [data-nav="realm"]'); await q.waitForTimeout(400);
  const small = await q.evaluate(() => { const bad = []; for (const el of document.querySelectorAll('#app button, #app select, #app input')) { const r = el.getBoundingClientRect(); if (!r.width || getComputedStyle(el).visibility === 'hidden' || el.closest('[hidden]')) continue; if (el.closest('.crumbs, .calbar, .maptools, .sections, .ptabs, .navlist, .frame-tr, .zoomb, .sheet-handle, .top-actions') && (r.width < 24 || r.height < 24)) bad.push((el.id || el.className || el.tagName) + ' ' + Math.round(r.width) + '×' + Math.round(r.height)); } return bad.slice(0, 6); });
  ok(!small.length, 'on a phone every control in the bars and lists is at least 24 × 24 px ' + JSON.stringify(small));
  // phone held sideways
  const ls = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ls.addInitScript(() => { localStorage.setItem('atlas-world-v1', JSON.stringify({ v: 2, gen: 20, seed: 777, edits: {}, market: { day: 300 } })); });
  const r = await ls.newPage(); r.on('pageerror', (e) => errs.push(e.message));
  await r.goto('file:///tmp/claude-0/dbg.html'); await r.waitForTimeout(2800);
  const L = await r.evaluate(() => { const m = document.querySelector('#map').getBoundingClientRect(), s = document.querySelector('#side').getBoundingClientRect(); return { side: [Math.round(s.left), Math.round(s.width)], map: [Math.round(m.left), Math.round(m.width), Math.round(m.height)], over: document.documentElement.scrollWidth > innerWidth + 1 }; });
  ok(L.map[0] >= L.side[1] - 1 && L.map[2] > 300 && !L.over, 'a phone held sideways puts the atlas beside the map (map ' + L.map[1] + ' × ' + L.map[2] + ')');
  await r.screenshot({ path: '/tmp/claude-0/a11y_landscape.png' });

  console.log('errors', errs.length ? errs.join(' | ') : 'none');
  await b.close();
})();
