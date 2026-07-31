# Rally Character Evolution, Classes, and Crests — Master Brief

## Objective

Build a premium visual progression system that makes users feel their real-life habits are developing a personal Rally athlete-adventurer over weeks, months, and years. This is a cosmetic and emotional reward layer over Rally’s wellness systems, not a separate RPG. Habit tracking, personal improvement, team accountability, and friendly competition remain the core product.

The approved art direction is higher-detail handcrafted pixel art with modern athletic and outdoor clothing. Characters should read as contemporary athletes first and light-fantasy specialists second. The class system should give different wellness strengths a recognizable identity without forcing any user into a gender, body type, or play style.

## Six launch classes

1. **Pathfinder** — steps, running, walking, and outdoor exploration
2. **Vanguard** — workouts, strength, and training
3. **Sage** — reading, learning, and focus
4. **Monk** — meditation, breathing, mobility, and yoga
5. **Guardian** — sleep, recovery, and consistency
6. **Tidecaller** — hydration and endurance

The people shown on the approved roster are flagship examples, not restrictions. Gender, skin tone, hair, and body presentation must be independent of class. Phase one may ship one flagship appearance per class, but the architecture must support additional appearance variants later.

## Evolution structure

Every class supports the same five level thresholds:

| Tier | Level | Default display name |
|---|---:|---|
| 1 | 1 | Wanderer |
| 2 | 8 | Trailblazer |
| 3 | 16 | Adventurer |
| 4 | 28 | Wayfinder |
| 5 | 40 | Legend |

The former Level 16 display name “Pathfinder” has been changed to **Adventurer** to avoid colliding with the Pathfinder class name. Internally, Claude should use neutral IDs (`tier-1` through `tier-5`) and keep display names configurable.

At full scope, six classes multiplied by five evolution tiers produces 30 base character states. Do not produce all 30 before the pilot passes.

## Art provider

ChatGPT will provide, package by package:

- Base character sprites
- Eight-frame idle loops
- Celebration and level-up poses
- Equipment and habit-linked cosmetic overlays
- Companion profile art and icons
- Class-specific VFX
- Six fixed class crests
- Modular team-crest parts and preview boards
- UI reward art requested by the production plan
- Later Castle War effect overlays if separately approved
- Naming, manifests, anchor metadata, and preview/contact sheets

All new art must follow Claude’s canvas, baseline, background, separation, and naming requirements as revised in this package.

## Claude’s implementation responsibility

Claude should:

- Treat `manifests/character-system.json` and `manifests/crest-system.json` as the data contracts.
- Build data-driven components; do not hard-code specific classes, tiers, or file paths into UI components.
- Keep class choice separate from character appearance and evolution tier.
- Render base, equipment, companion, and VFX as independently controlled layers.
- Add responsive Profile/Me rendering, class selection, tier selection from level state, and static fallbacks.
- Implement an eight-frame idle player with integer pixel scaling and no interpolation.
- Implement a short, skippable level-up sequence.
- Preload the current tier and next tier; lazy-load distant tiers and unowned cosmetics.
- Pause animation when offscreen or when the page is backgrounded.
- Respect `prefers-reduced-motion`.
- Render all text as accessible HTML.
- Add optional sound and haptic hooks.
- Add asset-failure fallbacks and analytics.
- Implement fixed class crests separately from user/team crests.
- Build team crests from modular layers so Rally can support many teams without commissioning one fully painted crest per team.

## Critical rendering requirements

- Use `image-rendering: pixelated` or the framework-equivalent nearest-neighbor setting.
- Place character layers on integer coordinates.
- Never scale a character by fractional pixels.
- Never apply blur, smoothing, soft drop shadows, or automatic image interpolation.
- Keep all layers on identical source canvases and align from a shared bottom-center anchor.
- Do not crop equipment overlays to the equipment’s local bounds; retain the full character canvas.
- Do not embed names, levels, XP, labels, or buttons in raster art.

## Pilot stop condition

Implement only the Pathfinder pilot first:

1. `01-pathfinder-adventurer-base.png`
2. `02-pathfinder-adventurer-idle-f1.png` through `f8.png`
3. `03-pathfinder-adventurer-levelup.png`
4. `04-pathfinder-adventurer-boots.png`
5. `05-pathfinder-fox-profile.png`

Do not request or implement the remaining 29 character states until the pilot passes:

- identity consistency
- anchor/baseline QA
- overlay alignment
- frame stability
- mobile performance
- reduced-motion behavior
- asset replacement workflow

## Acceptance criteria

- The correct class and tier are derived from configuration.
- A level threshold change does not require component rewrites.
- Class is not inferred from gender or appearance.
- Character scale and baseline do not shift between frames.
- Accessories visually match the approved pixel style.
- Overlays align at every supported viewport.
- The UI remains readable with VFX present.
- Team crests can be composed from modular parts and saved as a compact recipe.
- Class crests cannot be edited as team crests.
- Missing files fail gracefully.
- The system remains smooth on a representative mid-range mobile device.

