# Tilewright handover: notes for the main atlas chat

**What this is.** These are the parts of Sean's old Tilewright and Market Ledger tools that the owner chose to bring into Realmwright Atlas. They were built and tested on the **10 October atlas** (the copy first put on GitHub), in a separate Claude session. The owner decided the other chat's copy (v21 and later) stays the main one, so this folder hands the work over to be folded in there.

Everything here worked in the 10 October build. It was tested in Chromium at desktop and phone sizes: no console errors, and one main-thread task over 50 ms while panning a capital's battle map.

| What | File | Size |
|---|---|---|
| Pixel renderer: textures, terrain table, props, blending, walls and doors (runs in workers) | `1-pixel-renderer.js` | 345 lines |
| Pixel layer: chunk layout from roads, towns and edits; cache, queue, drawing, invalidation | `2-pixel-layer.js` | 254 lines |
| Tiles tool: painting, fill, buildings, edge walls, palette panel, overlay | `3-tiles-tool.js` | 240 lines |
| Full SRD lists, creature stat blocks, Market → Shop tab and inn bill | `4-srd-shop-inn.js` | 187 lines |
| Tilewright look: colour tokens, fonts, controls | `5-tilewright-theme.css` | 132 lines |
| Every change against the 10 October page, hooks included | `full-changes.patch` | — |
| The SRD data (CC BY 4.0) | `../data/srd_catalog.json`, `../data/srd_monsters.json` | 118 KB + 430 KB |
| Sean's original map, for reference | `../legacy/tilewright.html` | — |

The owner's picks were these four, in this order of importance:
1. **The UI style.** Tilewright's charcoal panels, lantern gold, Pixelify Sans headings, Atkinson Hyperlegible text, outlined buttons, and gold for whatever is switched on. Map labels keep IM Fell.
2. **A pixel-art battle map.** Below about 9 screen pixels per 5-ft square, the painted map is replaced by Tilewright pixel art. The world's towns, roads and terrain are kept underneath it.
3. **Battle-map editing** with a new **Tiles** tool (shortcut T).
4. **The full SRD lists:** 588 items priced per town, 334 monsters with full stat blocks, and an **inn bill** calculator.

---

## 1. The look (`5-tilewright-theme.css`)

1. Swap the Google Fonts link for:
   `family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=IM+Fell+English+SC&family=IM+Fell+English:ital@0;1&family=Pixelify+Sans:wght@400;500;600;700`
2. Replace the `:root` token block. The variable names are unchanged; only the values differ.
3. Inside the stylesheet, change `rgba(201,162,83,` to `rgba(214,165,72,` and `rgba(226,195,122,` to `rgba(227,179,65,` (brass to gold).
4. Append the override block. It covers panels, headings, the tool rail, segmented tabs, buttons, chips, inputs, the shop table, stat blocks and the Tiles palette.
   - It includes `.inspector { grid-auto-rows: max-content; }`. Without it, grid rows inside a height-limited panel get squashed to nothing.
   - It includes tighter tool-rail breakpoints, because one more tool needs the room.
5. Set the canvas background in `render()` to `#0f1215`, and `<meta name="theme-color">` to `#171a1f`.

v21 has added panels since 10 October. Anything that hard-codes the old colours, such as `#cfc8b6`, still reads fine but may need a glance.

## 2. Pixel battle map (`1-pixel-renderer.js`, `2-pixel-layer.js`)

**The model.**
- One cell is one 5-ft square: `CELL = 1056` squares per mile, so square `cx = floor(x * 1056)`.
- Chunks are 32 × 32 squares, rendered at 16 px per square, or at 8 px (`half`) when zoomed further out.
- The pixel layer fades in between 5.5 and 9 screen px per square (`PX_ON`, `PX_FULL`).
- At full opacity, with every visible chunk ready, the painted tiles, roads and town plans are skipped. `drawPlans(skip)` still fills `plansDrawn`, which the markers use.

**`pixelLib(T)`** is self-contained and needs only the terrain library.
- **Terrain table.** The 13 Tilewright terrains keep their ids (0–12). Six are added: Ice, Dry grass, Tundra, Forest floor, Pine needles and Jungle canopy.
- **Props.** The 7 Tilewright props (0–6) plus 8 new ones: Pine, Bush, Well, Market stall, Table, Bed, Crate and Altar.
- **`render(job)`** returns RGBA. Inside it:
  - Natural ground comes from `T.biomeAt(x, y, 15, circ)` mapped through `BIO[]`.
  - Forest and jungle get canopy groves with forest-floor clearings.
  - Automatic trees, bushes and boulders are placed by `T.hash`.
- **Edge values:** 1 wall, 2 door, 3 fence, 4 window (new).

**Workers.** The worker source adds `const PXL=(pixelLib.toString())(T)`. Before the tile branch it handles one more case:
`if(d.px){const q=PXL.render(d);postMessage({px:1,k:d.k,ver:d.ver,seed:d.seed,buf:q.buffer},[q.buffer]);return;}`
- `nextJob()` serves `pxQueue` first.
- `jobMsg(t)` returns `pxMsg(t)` for pixel jobs.
- `onTileDone` sends `d.px` results to `pxDone(d)`.
- The main-thread fallback calls `PX.render(d)`.
- `pxDone` shows a newer result even while further edits are pending (`c.shown`), so live painting stays visible.

**Render loop.** Pixel-art chunks only show once these three places in `render()` are changed:
```js
const pa = pxAlpha();
const covered = pa >= 1 && pxCovered();
if (!covered) drawTiles(); else pxQueueTilesClear();
if (pa > 0) drawPixels(pa);
if (layers.roads && !covered) drawRoads();
drawPlans(covered);
```

**Invalidation.**
- In `afterChange(inv)`: `if (inv.bb) pxInvalidate(inv.bb)`, plus a new `inv.bm`, a box in miles.
- `regenerate()` clears `pxChunks` and `pxQueue`.

### ⚠ What v21 changes and needs adapting

**`pxLayout()` reads the 10 October town plan.** It expects:
- `P.n`, and the arrays `bx`, `by`, `bw`, `bd`, `ba` and `bk` (0 house, 1 temple, 2 keep, 3 stall, 4 barn);
- `P.streets[{pts, w}]` and `P.plazaR`;
- `P.well`;
- `P.wall{gates[[angle, halfAngle]], towers[], Rw}`.

v13 rebuilt `makePlan`. It added 16 layouts, round and long-hall buildings, walls that follow the outline, fields, gardens, districts and places. The simplest fix is a small adapter, `planForPixels(P)`, that returns those fields from the new plan:
- **Round buildings:** rasterise them as squares, or test `dx² + dy² < r²` in the building loop.
- **Outline walls:** rasterise the wall polyline the way roads are rasterised, with `segDist` under the half-thickness, instead of using the circle test.
- **Fields, orchards and gardens:** these could become Dirt or Grass with Bush or Tree props, which would be a nice extra.

**Buildings are squared to the grid on the battle map.** `gridFrame()` snaps each angle to the nearest quarter turn, which reads much better than jaggy rotated rasters. Doors face the nearest street. Furniture is placed at fixed spots in each building's frame:
- temple: altar;
- keep: stairs and a table;
- barn: crate and barrel;
- larger houses: bed, table, and a barrel or chest.

## 3. Tiles tool (`3-tiles-tool.js`)

**Saved data.** Everything goes in `edits.bm` (add `bm: {}` to `blankEdits()`). Each chunk key `'cx,cy'` holds `{ t:{i:terrain}, p:{i:prop|-1}, h:{i:edge}, v:{i:edge} }`, where `i = y*32 + x` within the chunk.
- An absent entry means "what the world generates".
- `p: -1` means "no prop".
- Edge `0` means "explicitly no wall".

Old saves without `bm` work unchanged.

**Tools.**
- **Paint:** brush 1, 2, 3 or 5 squares.
- **Fill:** up to 5,000 squares; it stops at walls, doors and windows.
- **Building:** drag out a rectangle to get a floor, walls all round and a door on the south side.
- **Edges:** drag along grid lines to build a run; tap a line to place or remove one.
- **"Natural" options** restore the world's own ground or props.

**Panel and input hooks.**
- The panel is `tilesPanel()`. It re-renders when the battle map comes into or out of reach (`twWasActive`).
- The tool button is `data-tool="tiles"`, with the shortcut `t` added to the key map.
- The renderPanel branch is `else if (tool === 'tiles') html = tilesPanel();`.

Pointer hooks:
- On pointerdown with `tool === 'tiles'`: `if (twDown(p)) gest.type = 'tiles'`.
- On move: `twMove(p)`.
- On end: `twUp(false)`.
- On pinch start or pointercancel: `twUp(true)`, which reverts the stroke.

`drawTilesOverlay()` draws the hover square, edge previews and the building rectangle. It sits after `drawGrid()`.

**Undo.** In the 10 October build each stroke pushed one `{before, after, inv: {bm}}` history entry. v21 changed undo to per-step changes and live sync, so:
- make each stroke one step;
- sync `edits.bm[chunkKey]` as one piece per chunk;
- decide whether players see battle-map edits. Probably yes, unless the DM wants hidden rooms.

## 4. SRD lists, Shop and inn (`4-srd-shop-inn.js`)

**Loading.**
- `srdFetch('items' | 'mons')` loads `data/*.json` the first time something needs it.
- If that fails (for example, the page opened from a disk), the built-in lists carry on.
- On the claude.ai page, either inline the JSON (about 550 KB) or keep these features GitHub-only.

**Monsters.**
- SRD-only monsters go in `MON_SRD`, never in `MON`. Natural spawns stay exactly as they were, which keeps the "same seed = same world" rule.
- `monInfo(name)` replaces direct `MON[name]` reads in five places:
  - `monLink`;
  - `showMonster`;
  - `placedMon` and `monStats`;
  - the Bestiary list;
  - the search box.
- Placing an SRD-only creature stores `custom: {cr, ac, hp, type}`, so it survives even without the data file.
- `XP_CR` gains CR 21–30.
- Creature cards show the full stat block (`statBlock()`).

**Market → Shop tab.** The tabs become Overview · Town · **Shop** · Events · Bounties.
- **Inn bill:** lodging and meals by Player's Handbook lifestyle, nights, guests and horses, at today's local prices (`priceLevels()`). Pricier lodging and meals are flagged in small places.
- **Item list:** all 588 SRD items with search and category chips.
- **Prices:** an item that matches a market good uses that good's price. Other items use the town's price level for similar goods.
- **Availability:** martial weapons and heavy armour need towns or cities, ships need a port, and magic items need a city or capital and rotate weekly.
- **Magic items with no rulebook price** get a deterministic estimate inside the Dungeon Master's Guide band, halved for potions and scrolls. Legendary items and artifacts are never sold.

## 5. Help text and docs

- **Help popover:**
  - a Tiles line;
  - a Shop sentence on the Market line;
  - "334 SRD creatures with full stat blocks" on the Monsters line;
  - `T tiles` in the shortcuts.
- **Credits:**
  - Pixelify Sans and Atkinson Hyperlegible (both SIL OFL);
  - pixel textures and sprites adapted from Tilewright, by Sean and Adam;
  - SRD data compiled by Sean (CC BY 4.0).

## 6. Quick checks after folding in

1. Zoom into a capital, a village, a coast and a forest. The pixel art should line up with streets and roads. No console errors.
2. With Tiles: paint, fill, build, add a fence and a window, then undo. Reload: the edits are still there. Copy the map code into a fresh world: the edits come with it.
3. Market → Shop in a village and in a capital: the inn total changes as you type, search filters, and tapping an item opens its description.
4. Monsters → Bestiary: search "aboleth", open its card for the full stat block, place it, reload, and it is still there.
5. Phone width (390 px): the toolbar labels don't overlap, and the Tiles palette fits.
