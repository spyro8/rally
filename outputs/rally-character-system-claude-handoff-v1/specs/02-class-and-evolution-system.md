# 02 — Class and Evolution System

## Class definitions

### Pathfinder

- Core habits: steps, walking, running, outdoor activity
- Palette: forest, charcoal, golden-lime
- Clothing: trail jacket, technical pants, performance sneakers
- Signature equipment: hydration pack, trekking pole, trail boots
- VFX: wind lines, leaves, dust, route pulse
- Companion direction: fox or falcon

### Vanguard

- Core habits: workout, strength, training
- Palette: burgundy, burnt orange, charcoal
- Clothing: training top, leggings/joggers, modern trainers
- Signature equipment: lifting gloves, wrist wraps, reinforced belt
- VFX: controlled shockwave, energy line, metallic spark
- Companion direction: bear cub or ram

### Sage

- Core habits: reading, learning, focus
- Palette: navy, plum, cool cyan
- Clothing: performance streetwear and modern athletic layers
- Signature equipment: digital book/tablet, luminous sport glasses
- VFX: geometric focus star, page/ink line, data glyph
- Companion direction: owl

### Monk

- Core habits: meditation, breathing, mobility, yoga
- Palette: cream, sage, muted green
- Clothing: flexible training attire, wraps, minimalist trainers
- Signature equipment: wrist wraps, breath counter, yoga strap
- VFX: breathing ring, lotus geometry, restrained drifting petal
- Companion direction: spirit rabbit

### Guardian

- Core habits: sleep, recovery, consistency
- Palette: midnight blue, silver-blue, soft cream
- Clothing: recovery tracksuit, cushioned footwear
- Signature equipment: recovery watch, sleep monitor, soft utility pouch
- VFX: crescent glow, recovery pulse, quiet star
- Companion direction: moon rabbit or gentle dog

### Tidecaller

- Core habits: hydration and endurance
- Palette: teal, cyan, deep aqua
- Clothing: endurance running kit, compression layer, running shoes
- Signature equipment: hydration vest, flask, bottle belt
- VFX: water ribbon, droplet pulse, wave loop
- Companion direction: water sprite or turtle

## Tier behavior

Evolution should change:

- confidence of pose
- quality of athletic equipment
- garment construction and trim
- accessory sophistication
- companion availability
- restrained ambient effect

Evolution should not change:

- scoring power
- class advantage
- body identity
- basic contemporary-athlete readability

## Appearance architecture

Use three independent properties:

```text
classId
appearanceId
tierId
```

Do not create identifiers such as `female-sage` or `male-pathfinder`. A class is a wellness specialization; appearance is cosmetic.

## Initial flagship cast

The roster board supplies one flagship example per class and intentionally varies gender presentation, skin tone, hair texture, and silhouette. These examples establish breadth but are not the final limit of available appearances.

