# Realmwright Atlas: the source

The site's `index.html` is built from these files. Change a module here, rebuild, and the new page appears. You never have to edit the large built file.

## Building

You need Python 3.

```
python3 build.py
```

This writes two pages:
- `atlas.html`, for the shared Claude page;
- `github/index.html`, a complete web page that becomes the site's `index.html`.

It also writes `check.js`. Run `node --check check.js` to catch typing mistakes before you open the page.

## Files

The build joins the modules in the order listed in `build.py`. Each one starts with a comment saying what it does.

| File | What it holds |
|---|---|
| `template.html` | The page: layout, styles and the markup of the panels and map |
| `lib.js` | The terrain library: land, seas, rivers, biomes and drawing. It also runs inside the background workers |
| `app1.js` | Reference data, world generation and applying the DM's edits |
| `app2.js` | Settlement street plans and the background drawing workers |
| `app3.js` | The map view: drawing, zoom and pan |
| `app4.js` | Tools, input, undo and redo, panels and the World menu |
| `app5.js` | The live market and world events |
| `app6.js` | People: residents, relationships and daily activity |
| `app7.js` | The guilds, the Adventurers' Guild, ranks, quests and influence |
| `app8.js` | The rules reference (SRD 5.1) and people on the map |
| `app9.js` | Cross-links between towns, realms, organisations and events |
| `app10.js`, `app11.js` | Character rules and the hero builder and play sheet |
| `app12.js` | Monsters: natural spawns, placement, tracking and bounties |
| `app13.js` | Ecology, price explanations and the party chronicle |
| `app14.js` | Town layouts |
| `app15.js` | Map interaction: clickable names and road shaping |
| `app16.js` | Guild networks |
| `app17.js` | Settlement sizes and civic life |
| `app18.js` | Places in towns, aldermen and the activity heat map |
| `app19.js` | Campaign: saving, backups, stable worlds, DM and player modes, and merging. Holds `APP_VERSION` |
| `app20.js` | Lasting history: wars, plague, famine, occupation, deaths and mourning |
| `app21.js` | The 2024 rules option (SRD 5.2) for species, backgrounds and origin feats |
| `app22.js`, `app23.js` | Safe saving, the worlds library and stable worlds |
| `app24.js` | Edits as separate pieces, and the live shared world |
| `app25.js`, `srd-data.js` | The full SRD lists, the Shop and the inn bill (data compiled by Sean) |
| `app26.js`, `app27.js` | The pixel battle map and the Tiles tool (from Tilewright, by Sean and Adam) |
| `app28.js`, `app29.js` | Households, Around town now, the town Chronicle and Recent changes |
| `app30.js` | The layout: the side panel, the breadcrumbs, place tabs and the framed map |
| `app31.js` | 2024 class features, spellcasting, epic boons, metamagic, invocations and starting equipment |
| `app32.js` | Guild membership for heroes: fees, dues, ranks and benefits |
| `app33.js` | What's happening at each place, hour by hour |
| `app34.js` | The 2024 spell lists (SRD 5.2) and the 26 spells new in it |
| `app35.js` | Downtime: crafting, working, training, research, carousing, temple service and rest |
| `app36.js` | Trading: shopkeepers, hero prices, haggling, weekly stock, the black market, trade caravans and the watch list |

## Rules for changes

- **Same seed, same world.** Generation is worked out from the seed. Never use `Math.random()` for anything generated; use `T.hash` or `T.mulberry` with the seed. If a change alters generated content, raise `GEN_VERSION` in `app19.js`. The stable-world code then keeps the places and people a campaign already uses.
- **The DM's changes live in `edits`.** Change them only through `commit(label, change, whatNeedsRedrawing)`. That gives undo, saving and live sharing for free.
- **Test, then record.** Add a line to `CHANGELOG.md` for every change, and raise `APP_VERSION` for a release.

## Tests

The tests are in `tests/`. They drive a real browser with Playwright:

```
node tests/run.js            # everything
node tests/run.js shell      # one test
```

They expect Chromium and Playwright at the paths written at the top of each test. Change those two paths to match your computer.
