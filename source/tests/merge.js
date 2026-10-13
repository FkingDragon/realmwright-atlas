const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
  await p.addInitScript(() => { localStorage.setItem('atlas-world-v1', JSON.stringify({ v: 2, gen: 20, seed: 777, edits: {}, market: { day: 240 } })); });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file:///tmp/claude-0/dbg.html'); await p.waitForTimeout(2600);
  const r = await p.evaluate(() => {
    const A = window.__A;
    const base = (o) => Object.assign({ ov: {}, del: {}, add: [], rdel: {}, rov: {}, radd: [], strokes: [], labels: [], events: [], evOff: {}, npc: {}, npcRel: [], npcAdd: [], npcMore: {}, guild: { party: { name: '', members: [], gold: 0, log: [] }, q: {}, rep: {}, shift: {}, ag: {}, custom: [] }, monAdd: [], monOff: {}, next: 1 }, o);
    const s0 = A.SET[100];
    const mine = base({ add: [{ id: 'u5', x: 100, y: 100, tier: 1, pop: 120, name: 'Mineville', b: 5, coastal: false, notes: '' }], labels: [{ id: 'l6', text: 'My cave', x: 1, y: 1, size: 'm' }], npc: { [s0.id + '#3']: { notes: 'Owes me', log: [{ d: 10, t: 'Met' }] } }, next: 7 });
    const theirs = base({ add: [{ id: 'u5', x: 200, y: 200, tier: 1, pop: 150, name: 'Theirtown', b: 5, coastal: false, notes: '' }], labels: [{ id: 'l6', text: 'Their tower', x: 2, y: 2, size: 'm' }], npc: { [s0.id + '#3']: { notes: 'Is a spy', log: [{ d: 12, t: 'Argued' }], tracked: 1 } }, npcAdd: [{ id: 'cn6', sid: 'u5', idx: -1, race: 'Human', fem: true, age: 30, job: 'Hermit', group: 'labour', life: 2, stat: 'Commoner', first: 'Wenna', last: 'Hale' }], guild: { party: { name: '', members: [], gold: 0, log: [] }, q: { 'q:x:1:0': { st: 'done' } }, rep: {}, shift: {}, ag: {}, custom: [] }, next: 7 });
    A.edits.add = mine.add; A.edits.labels = mine.labels; A.edits.npc = mine.npc; A.edits.next = 7;
    const res = A.mergeCampaign({ seed: 777, edits: theirs });
    const e = res.edits;
    return { sum: res.sum, names: e.add.map((x) => x.id + ':' + x.name).join(', '), labels: e.labels.map((x) => x.id + ':' + x.text).join(', '), hermitTown: (e.npcAdd[0] || {}).sid, notes: e.npc[s0.id + '#3'].notes, logs: e.npc[s0.id + '#3'].log.length, tracked: e.npc[s0.id + '#3'].tracked, quest: e.guild.q['q:x:1:0'] && e.guild.q['q:x:1:0'].st, next: e.next, wrong: A.mergeCampaign({ seed: 1, edits: {} }).error };
  });
  console.log(JSON.stringify(r, null, 1));
  const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
  ok(r.names === 'u5:Mineville, u7:Theirtown' && r.labels === 'l6:My cave, l8:Their tower', 'merged settlements and labels get new ids, nothing overwritten');
  ok(r.hermitTown === 'u7', 'people the other DM made follow their renumbered town');
  ok(/Owes me/.test(r.notes) && /Is a spy/.test(r.notes) && r.logs === 2, 'notes and logs about the same person are combined');
  ok(r.quest === 'done', 'a finished quest stays finished');
  ok(/different world/.test(r.wrong), 'a file from a different world is refused');
  console.log('ERR', errs.join('\n'));
  await b.close();
})();
