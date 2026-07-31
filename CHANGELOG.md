# Rally Living Garden — v39: XL Single Plate

## What changed
The three-plate system (base + east annex + west annex, with seam garlands and
patch strips) is **gone**. The garden now renders on ONE 11×11 XL ground plate
(1500×1500), delivered as `ground-xl-grassy` / `ground-xl-tilled`. No seams,
no patches, no plate offsets, no cross-plate special cases.

## Locked geometry (calibration-verified, do not re-derive from artwork)
```
x = 750 + (col − row) × (700/11)     // 63.6364 px per step
y = 220 + (col + row) × (350/11)     // 31.8182 px per step
```
- Plate anchor: (750, 1105) · origin (top vertex): (750, 220)
- Tile diamond: 127.2727 × 63.6364 px · visible bounds x[50,1450] y[220,1105]
- Grassy and tilled alpha channels are byte-identical — swapping never moves
  the silhouette. Delivery verified: SHA-256, alpha bounds, 264/264 lattice
  midpoints against the calibration overlay.

## Sprite scaling
Old tile was 116 px wide; XL tile is 127.27 px. One global factor
`GD_XLK = (700/11)/58 ≈ 1.0972` multiplies every `GD_SCALE` value in
`gdScaleOf()`. Per-element values untouched.

## Layout (solver-verified)
Zones on the 9×9 interior, by unlock day:
- **Center** (day 0): −2 ≤ c−r ≤ 1 — cottage (2,2), stone path (4,4)→(4,5)→(4,6),
  pond+bridge (6,7), grove gA (6,5), flowerbed fA (8,8), habits: steps (4,3),
  reading (7,9), meditation (8,7), workout (9,9)
- **East wing** (day 22): c−r ≥ 2 — flowerbed eA (9,4), grove gB (6,3),
  arbor (5,1), bench (8,5), flowerbed eB (9,7), bamboo (9,2)
- **West wing** (day 40): c−r ≤ −3 — flowerbed wA (1,9), grove gC (2,7),
  cherry tree (2,5), flowerbed wB (4,7), habits: sleep (2,9), journal (5,9)

Gates passed: interior containment; zero tile-footprint overlaps (pond+bridge
paired by design); `gdCheckPlan` on the shipped code = **0 warnings**; path
chain contiguous cottage→pond. Verified by running the actual bundled v39
module at day 21 (12 items, center only) and day 60 (24 items, all zones).

**Note:** the original marathon-session solver was not recoverable; the solver
in `solver/` is a faithful reconstruction against the in-code gate
(`gdCheckPlan`: stage-1 sprite bounds, 18% shrink, >35%-of-smaller fails).
Zone shapes changed from "symmetric thin wings" to the asymmetric bands above
because the thin `|c−r| ≥ 3` wings were infeasible under the pixel gate —
east carries six gated items and needed the larger band.

## Behavioral notes
- `hb-sleep` / `hb-journal` now carry `at: 40`. In v38 they were hidden by the
  west plate not existing yet; one plate made that implicit gate vanish, so it
  is now explicit (`points >= h.at` in `gdDerive`). Same player-visible reveal.
- Smoke anchors to `GD_COTTAGE` (2,2) — moved with the cottage, offsets scaled
  by GD_XLK. Fireflies at (300,560); petals drift keyframes scaled ×1.5.
- `gdDerive` no longer returns `plates`. `GD_PLATES`/`GD_SEAM`/`GD_PATCH` and
  every `pl` field are deleted. App.jsx needs **no changes** (imports only
  `useGarden`, `GardenTablet`, `GardenScreen`).

## Deploy checklist
1. Replace `garden.jsx` and `garden/garden-config.json` in the source project.
2. Add `garden/ground-xl-grassy.webp`, `garden/ground-xl-tilled.webp`.
3. Delete from `garden/`: `ground-grassy.webp`, `ground-tilled.webp`,
   `ground-annex-east.webp`, `ground-annex-west.webp`, `seam-hedge-east.webp`,
   `seam-hedge-west.webp`, `seam-patch-east.webp`, `seam-patch-west.webp`.
4. Rebuild with Vite (the uploaded site zip is a build output — it cannot be
   patched directly; garden.jsx is compiled into `index-*.js`).
5. `ground-xl-calibration.png` is dev-only. Never ship it.

## Shelf (untouched, per handoff)
Corner keystone (obsolete with XL plate) · reading-nook sprite variant ·
Arrange mode (headline feature after the XL plate soaks).

---

# v40: Arrange Mode

## What it is
An "Arrange" toggle in the garden header. Tap an item — it lifts with a glow;
valid tiles light up as tappable diamonds; tap one to set it down. "Reset"
restores the solver composition. Exit with "Done".

## Constitution kept
Layout is a **cosmetic overlay** (`rt1:gd:layout` in localStorage,
`{key:[c,r]}`), applied after `gdDerive`'s pure derivation. Logs still decide
what exists; the overlay only decides where it sits. Delete it and solver
defaults return intact. Progress never touches the layout — no ledger, no
sync drift, nothing to corrupt.

## Placement rules (player gate)
- Anything unlocked can go anywhere in the 9×9 interior — zones were a reveal
  device, not a law.
- **Tile footprints** are the collision rule: if the tiles are free, it fits.
  (We measured the visual-rect alternative: the solver's own defaults carry up
  to 76% visual overlap and read beautifully thanks to depth-sorting, so a
  visual gate was rejected as unfair noise.)
- **Water**: pond tiles reject world objects; the bridge crosses water; path
  stones on pond tiles become stepping stones. The bridge may also stand on
  grass (folly bridge) or over the path.
- **Bridge follows the pond** when the pond moves — unless the player has
  deliberately separated it, then it stays put.
- Stones slide under world objects (a bench can sit beside/over the path);
  stones are tile-exclusive against each other.

## API
`useGarden` now returns `layout`, `moveItem(key,pos)`, `resetLayout()`.
New pure exports: `gdCanPlace(cfg, placed, key, pos)`,
`gdValidTargets(cfg, placed, key)`, `gdLoadLayout`, `gdSaveLayout`.
`gdDerive(logs, score, day, layout?)` gained an optional 4th arg; every
placed item now carries a stable key `k` (slot name or element name).
App.jsx still needs **no changes**.

## Verified
13-case engine suite green (water rules, containment, stone exclusivity,
follow/separate bridge semantics, overlay round-trip, stale-key tolerance,
reset). Every solver-default position self-validates. Target-count audit:
day 21 everything moves freely (cottage 14 spots, pond 19); day 60 is dense
by design — big anchors may need neighbors cleared first, Reset always works.
Demo render: `previews/garden-v40-arranged.jpg` (stepping stone in the pond,
bench by the path, flowerbed in the south meadow).
