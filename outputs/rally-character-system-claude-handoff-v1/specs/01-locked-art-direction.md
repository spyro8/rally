# 01 — Locked Art Direction

## Governing style

The approved style is the higher-detail pixel treatment shown in:

- `../references/01-approved-six-class-roster.png`
- `../references/05-pixel-detail-reference.png`

The ultra-mini 32×48 direction is rejected.

## Visual balance

- 90–95% modern athletic, training, recovery, running, yoga, or outdoor clothing
- 5–10% restrained light fantasy
- Modern footwear remains visible at every tier
- Fantasy appears through controlled color, small luminous accents, class motifs, companions, and milestone VFX
- Later tiers become more premium and confident, not more medieval

Avoid:

- robes
- capes
- heavy armor
- medieval weapons
- oversized wings
- horns
- superhero silhouettes
- constant giant auras
- generic AI particle noise

## Production canvas

Character-scale art:

- Final master: 1000×1400 PNG
- Logical pixel grid: 250×350
- Final scale: 4× nearest-neighbor
- Anchor: bottom-center
- Feet baseline: y=1340 on the 1000×1400 master
- Pure white background: `#FFFFFF`
- No parchment, shadow, vignette, texture, floor, or gradient

This preserves Claude’s locked 1000×1400 integration canvas while enforcing real pixel construction. All marks must land on the logical grid before 4× scaling.

## Layer rules

- Base character, equipment, companion, and VFX are separate.
- Each equipment overlay retains the full 1000×1400 character canvas.
- Companion profile art uses 600×600.
- Companion icon crops use 200×200.
- VFX uses 800×800.
- Class and team crest masters use 400×400.
- No text is baked into art.

## Identity consistency

Within an appearance variant:

- same face
- same hair
- same body proportions
- same camera
- same scale
- same baseline

Class is independent of appearance. Future variants may change gender presentation, skin tone, hair, and body type without changing class rules or power.

## Pixel QA

- no antialiasing
- no fractional scaling
- no blurred pixels
- no JPEG runtime assets
- no inconsistent outline widths
- no accessory style mismatch
- no frame-to-frame face drift
- frame 1 must work as the static fallback

