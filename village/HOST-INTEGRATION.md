# Village inside SPYR — host contract (v52.23)

- Mounted at `./village/index.html?embedded=1` by `gym-launcher.js` (VILLAGE side tab on Home). The iframe stays mounted after
  "← SPYR" so reopening is instant; it reloads only on a full page load.
- Saves: every `spyr:village-change` → `localStorage['spyr:village:<profileId>']` (previous snapshot kept at `…:backup`)
  and mirrored to SPYR's KV (`./config.json` → `/rest/v1/kv`, key `spyr:village:<profileId>`). On open, the newer of
  local/remote wins (by event count, then `savedAt`).
- Habit bridge: on open and every 5 minutes while open, the launcher reads `rt1:p:<profileId>` from KV and turns each
  logged habit-day into a completion `id = <profileId>:<YYYY-MM-DD>:<habit>` (sleep counts at ≥7h; journal/fasting when set;
  meals when non-empty; workout when minutes/logged). Completed SPYR GYM sessions add `…:<date>:gym:<logId>`.
  IDs are stable, so re-syncs never double count; a local `…:seen` set avoids re-sending. Completions are credited to
  their own date (core.js `award` now passes `event.at`), so a backlog does not read as today's prosperity.
- Removed from the integrated experience: Frontier/military UI, Work board, Market basket, Professions, Gathering &
  crafting. State fields are retained for save compatibility. Build → Fortifications stays as scenery.
- Atlases are lossless WebP (`art.js` loads `.webp`).
- Still SPYR-side TODO once `App.jsx` is available: replace the Garden tab with this, and move the bridge from polling
  KV to a direct call on each habit log.
