
// ================================================================ settlement size classes and civic life (v16)
// 5th-edition style sizes, by population: hamlet 50-300, village 300-900, town 1,000-8,000, city 8,000+,
// metropolis over 25,000. "Capital" is a role on top of a size: the seat of a realm.
const SIZES = [
  { k: 'hamlet', name: 'Hamlet', lo: 0 },
  { k: 'village', name: 'Village', lo: 300 },
  { k: 'town', name: 'Town', lo: 1000 },
  { k: 'city', name: 'City', lo: 8000 },
  { k: 'metropolis', name: 'Metropolis', lo: 25000 }
];
function sizeOf(s) { let z = SIZES[0]; for (const q of SIZES) if (s.pop >= q.lo) z = q; return z; }
const isCapital = (s) => s.tier === 4;
function placeKind(s) { return sizeOf(s).name + (isCapital(s) ? ' · capital' : ''); }
// the map tier a population belongs to (capitals keep their role whatever their size)
function tierForPop(pop, tier) { if (tier === 4) return 4; return pop >= 8000 ? 3 : pop >= 1000 ? 2 : 1; }

// ---------------------------------------------------------------- faiths: one shrine in a hamlet, competing temples in a city
const DEITIES = [
  ['the Dawnfather', 'Light'], ['the Hearth-Mother', 'Life'], ['the Green Lady', 'Nature'], ['the Stormlord', 'Tempest'],
  ['the Keeper of Scrolls', 'Knowledge'], ['the Laughing Mask', 'Trickery'], ['the Iron Captain', 'War'], ['the Harvest Queen', 'Life'],
  ['the Lantern of the Deep', 'Light'], ['the Old Oak', 'Nature'], ['the Sea Father', 'Tempest'], ['the Silent Judge', 'Knowledge']
];
const TEMPLE_FORMS = ['Temple of %', 'House of %', 'Shrine of %', 'Hall of %', 'Cathedral of %', 'Chapel of %'];
function templesOf(s) {
  const z = sizeOf(s).k, h = hashStr(s.id) & 0x7fffffff;
  const n = { hamlet: 1, village: 1, town: 1 + (s.pop > 4000 ? 1 : 0), city: 2 + (s.pop > 14000 ? 1 : 0) + (T.hash(h, 1, 1601) < 0.4 ? 1 : 0), metropolis: 4 + Math.floor(T.hash(h, 2, 1601) * 3) }[z];
  const order = DEITIES.map((d, i) => [T.hash(h, i, 1602) - (s.coastal && d[1] === 'Tempest' ? 0.3 : 0) - ([6, 7, 8].includes(s.b) && d[1] === 'Nature' ? 0.2 : 0), d]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  const out = [];
  for (let i = 0; i < n; i++) {
    const [god, dom] = order[i];
    const form = z === 'hamlet' ? 'Wayside shrine of %' : z === 'village' ? 'Village temple of %' : i === 0 && z === 'metropolis' ? 'Cathedral of %' : TEMPLE_FORMS[Math.floor(T.hash(h, 10 + i, 1603) * 4)];
    out.push({ name: form.replace('%', god), god, dom });
  }
  return out;
}

// ---------------------------------------------------------------- districts: cities and metropolises are divided into wards
function districtsOf(s) {
  const z = sizeOf(s).k;
  if (z !== 'city' && z !== 'metropolis') return [];
  const M = planMeta(s), h = hashStr(s.id) & 0x7fffffff;
  const want = z === 'metropolis' ? 7 : 4 + (s.pop > 15000 ? 1 : 0);
  const cands = [
    ['Noble Quarter', M.upA, 'on the high ground'],
    M.seaD < 5 ? ['Docks', M.seaA, 'toward the sea road'] : M.rivD < 3 ? ['Riverside', M.rivA, 'toward the river'] : null,
    ['Temple Ward', T.hash(h, 3, 1604) * Math.PI * 2, 'around the great temples'],
    ["Craftsmen's Row", M.a0 + Math.PI, 'along the road out'],
    ["Merchants' Row", M.a0, 'along the main road'],
    ["Tanners' Lane", M.upA + Math.PI + 0.5, 'downhill and downwind'],
    ['Garrison', (M.exits[1] || M.exits[0] || [M.a0 + 2])[0], 'by the main gate'],
    guildLevel(s, 'mages') >= 1 ? ["Scholars' Ward", M.upA + 1.2, 'round the mages\' tower'] : null,
    ['The Warrens', M.upA + Math.PI - 0.6, 'the crowded low ground'],
    ['Old Town', null, 'the oldest streets by the market']
  ].filter(Boolean);
  const taken = M.quarters.map((q) => q.a);
  const out = [{ name: 'Market Ward', a: null, r: 0.18, why: 'the heart of the town' }];
  for (const [name, a, why] of cands) {
    if (out.length >= want) break;
    if (a == null) { out.push({ name, a: M.a0 + 2.6, r: 0.33, why }); continue; }
    let ang = a;
    for (let t = 0; t < 8 && (taken.some((b) => angDiff(b, ang) < 0.75)); t++) ang += 0.55 * (t % 2 ? -1 : 1) * (t + 1);
    if (taken.some((b) => angDiff(b, ang) < 0.6)) continue;
    taken.push(ang);
    out.push({ name, a: ang, r: 0.62, why });
  }
  return out;
}

// ---------------------------------------------------------------- the settlement panel's Civic life section
function civicHtml(s) {
  const z = sizeOf(s), P = profile(s), lead = townPeople(s, LEADERS[s.tier].length).list.map(withOv);
  const nm = (i) => (lead[i] ? pLink(lead[i]) : 'someone');
  const R = P.realm, h = hashStr(s.id) & 0x7fffffff;
  const taverns = (P.trades.find((t) => t[0] === 'Taverns') || [0, 0])[1], inns = (P.trades.find((t) => t[0] === 'Inns') || [0, 0])[1];
  const rows = [];
  const aldList = () => { const al = aldermenOf(s).filter((x) => x.p); return al.length ? ': ' + al.slice(0, 3).map((x) => pLink(x.p) + ' <small>(' + esc(x.d.name) + ')</small>').join(', ') + (al.length > 3 ? ' and ' + (al.length - 3) + ' more under Districts' : '') : ''; };
  // leadership
  let L;
  if (z.k === 'hamlet') L = 'No formal leadership. Folk take disputes to ' + nm(0) + ', a respected elder' + (R ? '; taxes go to the lords of ' + rLink(R) : '') + '.';
  else if (z.k === 'village') L = 'A reeve, ' + nm(0) + ', speaks for the village and answers to the local lord. No town council or charter.';
  else if (z.k === 'town') L = (T.hash(h, 1, 1605) < 0.5 ? 'A mayor, ' + nm(0) + ', and a council of leading townsfolk, under a royal charter.' : nm(0) + ' governs as the local lord, with a council of guild masters to advise.');
  else if (isCapital(s)) L = nm(0) + ' rules ' + (R ? rLink(R) : 'the realm') + ' from ' + placeLink(s, 'hall') + '; the chancellor ' + nm(1) + ' runs the city through its ward aldermen' + aldList() + '.';
  else L = nm(0) + ' holds the ' + z.name.toLowerCase() + ' from ' + placeLink(s, 'hall') + ', with the steward ' + nm(1) + ' and an alderman for each district' + aldList() + '.';
  { const oc = occupation(s); if (oc) L = '<b>Occupied by ' + (REALMS[oc.by] ? rLink(REALMS[oc.by]) : 'a neighbouring realm') + '.</b> A governor from the conquerors gives the orders; the old rulers keep their titles but answer to them. ' + L; }
  rows.push(['Leadership', L]);
  // law and order
  const watch = P.guards, garrison = Math.round(s.pop / 120);
  let W;
  if (z.k === 'hamlet') { const nb = nearestLarger(s); W = 'No guards. Neighbours deal with trouble themselves and send for help' + (nb ? ' to ' + tLink(nb[0]) + ' (' + Math.round(nb[1]) + ' mi)' : '') + '.'; }
  else if (z.k === 'village') W = 'A constable and ' + Math.max(1, watch - 1) + ' watchmen. Serious crimes go to the lord\'s court.';
  else if (z.k === 'town') W = 'A proper watch of ' + fmtInt(watch) + ' under a captain, a gaol, and a magistrate\'s court.';
  else W = 'A full garrison of about ' + fmtInt(garrison) + ' soldiers and a ' + 'city watch of ' + fmtInt(watch) + (z.k === 'metropolis' ? ' with a watch-house in every ward' : '') + '; gaols and courts' + (z.k === 'metropolis' ? ', with high courts of the realm' : ' in several districts') + '.';
  rows.push(['Law', W]);
  // faith
  const tp = templesOf(s);
  let F;
  if (z.k === 'hamlet') F = 'A ' + placeLink(s, 'temple0', 'wayside shrine to ' + tp[0].god) + ' (' + tp[0].dom + '), tended by ' + nm(1) + '; a priest visits on holy days.';
  else if (tp.length === 1) F = placeLink(s, 'temple0') + ' <small>(' + tp[0].dom + ')</small>, served by ' + nm(s.tier === 1 ? 1 : 2) + '.';
  else F = tp.map((t, i) => placeLink(s, 'temple' + i) + ' <small>(' + t.dom + ')</small>').join(', ') + '. ' + (z.k === 'town' ? 'They share the faithful without much fuss.' : 'They compete for worshippers, tithes and the ear of the rulers; ' + esc(tp[0].god) + ' and ' + esc(tp[1].god) + ' are the fiercest rivals.');
  rows.push(['Faith', F]);
  // taverns
  const tavs = placesOf(s).list.filter((o) => o.kind === 'tavern' || o.kind === 'inn'), tavLinks = tavs.length ? ' Among them ' + tavs.slice(0, 4).map((o) => placeLink(s, o.key)).join(', ') + '.' : '';
  rows.push(['Taverns', z.k === 'hamlet' ? (taverns ? 'One ale-house, which doubles as the meeting place.' : 'No tavern: ale is brewed at home, and travellers ask at the elder\'s door.') : (taverns ? fmtInt(taverns) + (taverns === 1 ? ' tavern' : ' taverns') : 'No tavern') + (inns ? ' and ' + fmtInt(inns) + (inns === 1 ? ' inn' : ' inns') : '') + '.' + (z.k === 'hamlet' ? '' : tavLinks)]);
  // trade
  const kinds = P.trades.length;
  rows.push(['Trade', z.k === 'hamlet' ? 'Barter, and a pedlar every few weeks. Market day is in the nearest village or town.' : z.k === 'village' ? 'Basic trade: a weekly market, a smith and a mill; anything fine comes from town.' : z.k === 'town' ? 'Specialised trades (' + kinds + ' kinds of shop), a market several days a week, and craft guilds.' : 'A complex economy: ' + kinds + ' kinds of trade, money-changers' + (z.k === 'metropolis' ? ', banking houses and foreign trading companies' : ' and guild branches') + '.']);
  // districts
  const ds = districtsOf(s);
  if (ds.length) { const ald = aldermenOf(s); rows.push(['Districts', ds.map((d, i) => '<b>' + placeLink(s, 'dist' + i, d.name) + '</b>' + (d.a != null ? ' <small>' + compass8(d.a) + ', ' + esc(d.why) + '</small>' : ' <small>' + esc(d.why) + '</small>') + (ald[i] && ald[i].p ? '<br><small>Alderman: </small>' + pLink(ald[i].p) : '')).join('<br>')]); }
  return '<section><h3>Civic life</h3><p class="meta"><b>' + z.name + '</b>' + (isCapital(s) ? ' · capital' : '') + ' · ' + SIZE_RANGE[z.k] + '</p><ul class="facts civic">' + rows.map(([k, v]) => '<li><span>' + k + '</span><div>' + v + '</div></li>').join('') + '</ul></section>';
}
const SIZE_RANGE = { hamlet: 'under 300 people', village: '300 to 900 people', town: '1,000 to 8,000 people', city: '8,000 to 25,000 people', metropolis: 'over 25,000 people' };
function nearestLarger(s) {
  let best = null, bd = 1e9;
  SGRID.query(s.x - 80, s.y - 80, s.x + 80, s.y + 80, (n) => { if (n === s || n.pop < 300) return; const d = Math.hypot(n.x - s.x, n.y - s.y); if (d < bd) { bd = d; best = n; } });
  return best ? [best, bd] : null;
}
