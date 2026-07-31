# 04 — Crest System

Rally needs two separate crest systems.

## A. Fixed class crests

The six class crests are official, non-editable identity marks:

1. Pathfinder — trail shoe, compass, mountain
2. Vanguard — dumbbell and power bolt
3. Sage — digital book and focus star
4. Monk — lotus and breathing pulse
5. Guardian — crescent and recovery pulse
6. Tidecaller — droplet and endurance wave

Reference: `../references/02-approved-six-class-crests.png`

These appear in:

- class selection
- profile specialization
- class achievements
- class progression
- class-filtered statistics

They do not represent a user’s team.

## B. Modular team crests

Private and public teams need many distinct identities. Do not commission a unique flattened crest for every team. Build a layered crest composer.

### Initial layer library

- 4 outer frame shapes
- 6 border treatments
- 8 field patterns
- 24 central emblems
- 24 approved palettes
- 6 optional accent marks

This creates a large combination space while keeping every crest inside one Rally visual family.

### Recommended team emblems

- wolf
- falcon
- bear
- fox
- stag
- owl
- ram
- turtle
- lion
- mountain
- pine
- wave
- rising sun
- crescent
- comet
- star
- lightning
- flame
- compass
- wildflower
- river
- cloud
- acorn
- summit flag

Avoid weapons, skulls, gore, national flags, real team marks, copyrighted logos, and class-crest symbols.

### Master and runtime sizes

- Source layer canvas: 400×400 PNG, pure white for Claude’s extraction pipeline
- Runtime large: 192×192 WebP/PNG alpha
- Runtime standard: 96×96
- Runtime compact: 48×48
- All layers share one center, safe area, and outer bounds
- Text and team names remain HTML

### Saved team recipe

Store choices, not a flattened bitmap:

```json
{
  "frameId": "frame-02",
  "borderId": "border-gold-01",
  "fieldId": "field-diagonal-03",
  "emblemId": "emblem-fox",
  "paletteId": "palette-teal-copper",
  "accentId": "accent-stars-02"
}
```

This makes crests editable, deterministic, cacheable, and inexpensive to expand.

### Randomization

Claude should offer:

- Randomize
- Edit
- Reset
- Accessible palette descriptions
- Contrast validation
- Duplicate-warning within the same league

Random generation should be seeded so the same recipe always renders the same crest.

### Moderation and uploads

Phase one should use curated modular parts only. Do not allow arbitrary image uploads until moderation, storage, copyright, and content-safety requirements are defined.

## Art expansion

ChatGPT can add new frame, field, emblem, palette, and accent packs later without changing the composer. Seasonal crest parts should remain cosmetic and never affect scoring.

