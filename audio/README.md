# Breathe ambient tracks

Five files expected here, referenced by `MUSIC` in App.jsx:

- quiet-dawn.mp3
- forest-breath.mp3
- moon-garden.mp3
- rain-temple.mp3
- ocean-stillness.mp3

Any format `<audio>` supports works (mp3/m4a/ogg), but keep the filenames
matching exactly or update the `file` paths in `MUSIC`. Missing files fail
silently — the picker still shows, playback just doesn't start — so it's
safe to deploy before all five exist and add them incrementally.

Loop-friendliness matters more than length: Suno exports usually aren't
seamless loops, so a few seconds of click/pop at the seam is likely. If it's
audible, trim in any editor to a clean zero-crossing at both ends, or crossfade
the tail into the head.

Suno prompts: see docs/audio-prompts.md
