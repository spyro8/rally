# SPYR GYM inside SPYR — host contract (v52.23)

- Single-page app at `./gym/` (`index.html` + `app-bundle.js`; source is `app.js`, `app.css`). Hash routes: `#room=<id>`, `#session=<id>`.
- Opened by `gym-launcher.js` (vertical green tab on Home) in a full-screen same-origin iframe.
- Gym → host messages (same origin, checked by source):
  - `{type:'spyr:gym-exit'}` — back arrow on the rooms screen when embedded; host closes the overlay.
  - `{type:'spyr:gym-complete', record}` — a session reached its result screen. `record`: `logId`, `date`, `title`, `trainer`, `trainerName`, `elapsed` (s), `complete`, `stamp`, `records[]`.
- Host capture until React consumes it: `localStorage['spyr:gym:completions']` (deduped by `logId`, last 200). `window.SPYR_GYM.completions()/.clear()/.open()/.close()`.
- Wiring the Workout habit: on the `spyr:gym-complete` window event or Home mount, add `Math.round(elapsed/60)` workout minutes for that date, then `SPYR_GYM.clear()`.
- Gym-local storage: `spyr-gym:active` (resumable session), `spyr-gym:history`.
- Assets are WebP: scenes lossy q86; sprite sheets lossless (runtime colour keys must stay exact).
- Build: `npm run build` (bundles `app.js`), `npm test`.
