# 05 — Claude Implementation Checklist

## Character architecture

- [ ] Create typed class, appearance, tier, pose, overlay, companion, and VFX configuration.
- [ ] Keep `classId`, `appearanceId`, and `tierId` independent.
- [ ] Select tier from the configured thresholds 1, 8, 16, 28, and 40.
- [ ] Use neutral internal tier IDs.
- [ ] Implement responsive character rendering with a bottom-center anchor.
- [ ] Disable image smoothing and use integer scaling.
- [ ] Implement the eight-frame idle loop and static frame-1 fallback.
- [ ] Pause animation offscreen and when the document is hidden.
- [ ] Implement configurable layer slots and z-index.
- [ ] Implement companion placement separately.
- [ ] Implement a short, skippable level-up sequence.
- [ ] Respect reduced motion.
- [ ] Add optional sound and haptic hooks.
- [ ] Preload current and next tier only.
- [ ] Add missing/corrupt asset fallbacks.

## Crest architecture

- [ ] Treat fixed class crests as immutable app assets.
- [ ] Build a separate modular team-crest composer.
- [ ] Render team crests from saved recipes.
- [ ] Keep team name and text outside raster layers.
- [ ] Provide 192, 96, and 48 px runtime output.
- [ ] Validate palette contrast.
- [ ] Seed randomization.
- [ ] Warn about exact duplicates within a league.
- [ ] Cache composed output without losing the editable recipe.

## Accessibility and QA

- [ ] All names, levels, rewards, and controls are HTML.
- [ ] Class and crest choices have readable accessible names.
- [ ] Color is never the only identifying signal.
- [ ] Keyboard navigation works in class and crest selectors.
- [ ] Test levels 1, 7, 8, 15, 16, 27, 28, 39, and 40.
- [ ] Test slow connection and missing assets.
- [ ] Test mid-range mobile performance.
- [ ] Test overlay alignment at every supported scale.
- [ ] Test reduced motion.
- [ ] Test crest readability at 48 px.

## Analytics

- [ ] `character_class_selected`
- [ ] `character_tier_viewed`
- [ ] `character_levelup_started`
- [ ] `character_levelup_completed`
- [ ] `character_levelup_skipped`
- [ ] `character_cosmetic_equipped`
- [ ] `character_companion_equipped`
- [ ] `class_crest_viewed`
- [ ] `team_crest_randomized`
- [ ] `team_crest_saved`
- [ ] `team_crest_edited`
- [ ] `asset_fallback_shown`

