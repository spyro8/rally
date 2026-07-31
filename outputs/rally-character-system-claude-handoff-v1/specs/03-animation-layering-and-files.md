# 03 — Animation, Layering, and Files

## Pilot file order

Produce one item at a time:

1. `01-pathfinder-adventurer-base.png`
2. `02-pathfinder-adventurer-idle-f1.png` … `f8.png`
3. `03-pathfinder-adventurer-levelup.png`
4. `04-pathfinder-adventurer-boots.png`
5. `05-pathfinder-fox-profile.png`

Stop after these five deliverable groups.

## Idle animation

- 8 frames
- 4–6 FPS
- subtle breathing
- minimal jacket/clothing sway
- small hydration/accessory pulse if present
- frame 1 is the static fallback
- character must not drift horizontally or vertically
- feet remain at y=1340

Large actions do not belong in the idle loop.

## Level-up pose

- Same 1000×1400 canvas
- Same character identity and scale
- Heroic athletic stance
- No baked-in VFX or copy
- HTML displays tier name, level, reward, and button
- Separate VFX layer supplies the premium burst

## Layer stack

Recommended default:

```text
0 background UI
10 rear aura
20 rear companion
30 base character
40 lower-body equipment
50 torso equipment
60 handheld equipment
70 front companion
80 foreground VFX
90 accessible HTML UI
```

Every slot and z-index must remain configurable.

## Runtime formats

ChatGPT supplies PNG masters. Claude may produce:

- WebP runtime sprites
- sprite atlases
- JSON frame maps
- reduced-size thumbnails

Nearest-neighbor scaling must be preserved during every conversion.

## Naming

Use lowercase and hyphens:

```text
{package}-{class}-{tier}-{item}-{variant}.png
```

Examples:

```text
01-pathfinder-adventurer-base.png
02-pathfinder-adventurer-idle-f3.png
04-sage-wayfinder-glasses-tier2.png
05-guardian-moon-rabbit-icon.png
06-tidecaller-water-ribbon-f1.png
```

## Rejection criteria

- non-white production background
- smoothing or antialiasing
- character or baseline drift
- inconsistent face or proportions
- fused base/equipment/VFX
- cropped overlay canvas
- baked-in text
- accessory rendered in a different art style

