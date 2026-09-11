# SPYR GYM inside SPYR — host contract (v52.22)

- Mounted at `./gym/` and opened by `gym-launcher.js` (vertical green tab, Home only) in a full-screen same-origin iframe.
- Gym → host messages (same origin, checked by source):
  - `{type:'spyr:gym-exit'}` — user tapped "← Back to SPYR" in the library header; host closes the overlay.
  - `{type:'spyr:gym-complete', record}` — a session reached its result screen. `record` = the player's saved log
    (`logId`, `date`, `title`, `trainer`, `elapsed` seconds, `complete`, `stamp`).
- Host capture (until the React app consumes it directly): `localStorage['spyr:gym:completions']` — array of
  `{logId,date,title,trainer,elapsed,complete,stamp,source:'spyr-gym'}`, de-duplicated by `logId`, last 200 kept.
  `window.SPYR_GYM.completions()` / `.clear()` / `.open()` / `.close()` are exposed for the host.
- To log the Workout habit from React: on the `spyr:gym-complete` window event (detail = entry) or on Home mount,
  read `SPYR_GYM.completions()`, add `Math.round(elapsed/60)` workout minutes for that date, then `SPYR_GYM.clear()`.
- Assets are WebP: scenes lossy q86, sprite sheets lossless (magenta/red/cream keys are applied at runtime and must stay exact).
- Theme: library uses SPYR's light tokens (cream/olive/forest, Plus Jakarta Sans + IM Fell English); players keep the
  scene full-bleed with warm olive chrome. Fonts load from Google Fonts and fall back to Georgia/system when offline.
