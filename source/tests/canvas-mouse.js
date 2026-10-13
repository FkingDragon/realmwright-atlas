// The map now sits in a frame beside the side panel, so tests that point at map coordinates (sx, sy) add the
// canvas's offset on the page. Call after the page has loaded; call .refresh() if the layout changes.
module.exports = async function canvasMouse(p) {
  const get = () => p.evaluate(() => { const r = document.querySelector('#map').getBoundingClientRect(); return [r.left, r.top]; });
  const m = p.mouse, mv = m.move.bind(m), ck = m.click.bind(m), dc = m.dblclick.bind(m);
  let off = await get();
  m.move = (x, y, o) => mv(x + off[0], y + off[1], o);
  m.click = (x, y, o) => ck(x + off[0], y + off[1], o);
  m.dblclick = (x, y, o) => dc(x + off[0], y + off[1], o);
  m.refresh = async () => { off = await get(); };
  return off;
};
