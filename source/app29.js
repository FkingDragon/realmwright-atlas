// ================================================================ recent changes: who changed what (v23)
// From the old Market Ledger's change feed. At a shared table every change already travels as one small document
// stamped with its author and time (app24), so the feed simply reads those: it is shared, survives reloads and costs
// no extra writes. Working alone, it lists this session's own steps, undos and redos.
const localFeed = [];
function feedLocal(label, kind) {
  localFeed.unshift({ t: Date.now(), label: (kind ? kind + ': ' : '') + label });
  if (localFeed.length > 60) localFeed.length = 60;
}
const FEED_SKIP = new Set(['setSnap', 'roadSnap', 'npcSnap']);
function nearestTownName(x, y) {
  let best = null, bd = Infinity;
  SGRID.query(x - 4, y - 4, x + 4, y + 4, (s) => { const d = Math.hypot(s.x - x, s.y - y); if (d < bd) { bd = d; best = s; } });
  return best;
}
// one line for one entity of the edits
function describeKey(k, v) {
  const [sec, id] = splitKey(k);
  const o = v && typeof v === 'object' ? v : {};
  const town = (sid) => { const s = SBY.get(sid); return s ? tLink(s) : 'a place'; };
  const person = (pid) => { const p = npcById(pid); return p ? pLink(p) : 'someone'; };
  switch (sec) {
    case 'ov': return 'Edited ' + town(id);
    case 'add': return 'Founded ' + (o.name ? town(id) : 'a new place');
    case 'del': return 'Removed a place';
    case 'radd': return 'Built a road';
    case 'rov': return 'Reshaped a road';
    case 'rdel': return 'Removed a road';
    case 'labels': return 'Label “' + esc(o.t || '') + '”';
    case 'events': return 'Event: ' + esc(o.name || 'a new event');
    case 'evOff': return 'Called off an event';
    case 'npc': return 'Dealings with ' + person(id);
    case 'npcMore': return 'More residents in ' + town(id);
    case 'npcRel': return 'A relationship between ' + person(o.a) + ' and ' + person(o.b);
    case 'npcAdd': return 'New person: ' + esc(((o.first || '') + ' ' + (o.last || '')).trim() || 'someone');
    case 'monAdd': return 'Placed ' + esc(o.name || 'a creature');
    case 'monOff': return 'Marked a creature slain or gone';
    case 'strokes': return 'Painted terrain';
    case 'bm': { const b = bmBox(id), s = b ? nearestTownName((b[0] + b[2]) / 2, (b[1] + b[3]) / 2) : null; return 'Painted the battle map' + (s ? ' near ' + tLink(s) : ''); }
    case 'guild.q': return 'Quest ' + (o.st === 'accepted' ? 'taken' : o.st === 'done' ? 'completed' : o.st === 'failed' ? 'failed' : 'updated') + (o.snap && o.snap.title ? ': ' + esc(o.snap.title) : '');
    case 'guild.custom': return 'New quest: ' + esc(o.title || '');
    case 'guild.rep': case 'guild.shift': case 'guild.ag': return 'Guild standing changed';
    case 'guild.party.members': return 'The party roster';
    case 'guild.party.log': return 'Chronicle: ' + esc(String(o.t || '').slice(0, 80));
    case 'v': return id === 'dmLock' ? null : 'World settings';
  }
  return esc(sec);
}
function initials(name) {
  const w = String(name || '').trim().split(/\s+/).filter(Boolean);
  return w.length ? (w[0][0] + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase() : '?';
}
function avatarHtml(uid, name) {
  const hue = (hashStr(uid || name || '?') >>> 0) % 360;
  return '<i class="ava" style="background:hsl(' + hue + ' 42% 42%)" title="' + esc(name) + '" aria-hidden="true">' + esc(initials(name)) + '</i>';
}
function recentChanges(n) {
  const rows = [];
  if (share.on) {
    const best = new Map();
    for (const M of [share.pub, share.dmd]) for (const d of M.values()) {
      if (!d.t || FEED_SKIP.has(splitKey(d.k)[0])) continue;
      const cur = best.get(d.k);
      if (!cur || d.t > cur.t) best.set(d.k, d);
    }
    for (const d of best.values()) { const txt = describeKey(d.k, mergedValue(d.k)); if (txt) rows.push({ t: d.t, by: d.by, txt }); }
    for (const g of share.gone || []) rows.push(g);
  } else for (const e of localFeed) rows.push({ t: e.t, by: '', txt: esc(e.label), me: true });
  rows.sort((a, b) => b.t - a.t);
  // fold runs of the same thing by the same person (five painted chunks are one line)
  const out = [];
  for (const r of rows) {
    const last = out[out.length - 1];
    if (last && last.by === r.by && last.txt === r.txt && last.t - r.t < 10 * 60000) { last.n = (last.n || 1) + 1; continue; }
    out.push(Object.assign({}, r));
    if (out.length >= n) break;
  }
  return out;
}
function recentChangesHtml() {
  const rows = recentChanges(12);
  const who = (r) => (r.me || (share.uid && r.by === share.uid) ? 'You' : (share.names[r.by] || (r.by ? 'A DM' : 'Someone')));
  let h = '<div class="field"><span class="lab">Recent changes' + (share.on ? '' : ' this session') + '</span>';
  if (!rows.length) return h + '<p class="meta">Nothing yet. ' + (share.on ? 'Changes anyone makes to the shared world appear here with their name.' : 'Your edits appear here as you make them.') + '</p></div>';
  h += '<ul class="feed">' + rows.map((r) => { const nm = who(r); return '<li>' + avatarHtml(r.me ? 'me' : r.by, nm) + '<span><b>' + esc(nm) + '</b> ' + r.txt + (r.n > 1 ? ' <small>×' + r.n + '</small>' : '') + '<small class="when">' + ago(r.t) + '</small></span></li>'; }).join('') + '</ul></div>';
  return h;
}
