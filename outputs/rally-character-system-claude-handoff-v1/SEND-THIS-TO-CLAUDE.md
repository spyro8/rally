# Message to Claude

Please use this package as the governing specification for Rally’s character, class, and crest work. It supersedes the earlier painterly and non-pixel Pathfinder handoffs.

Begin with `CLAUDE-MASTER-BRIEF.md`, then review every file in `specs/` and both JSON contracts in `manifests/`.

The locked direction is:

- six wellness classes
- five configurable evolution tiers
- higher-detail handcrafted pixel art
- athletic and outdoor clothing first
- restrained light-fantasy accents
- class, appearance, and evolution tier stored independently
- every accessory, companion, animation, VFX element, and crest rendered in the same pixel language
- six fixed class crests
- a separate modular team-crest builder capable of supporting many teams

The reference images are approved concept boards, not separated runtime assets. Do not crop and ship them.

The earlier full-illustration Pathfinder pilot is obsolete and intentionally excluded. Before ChatGPT regenerates the Pathfinder pilot in the approved pixel style, please confirm:

1. 1000×1400 master canvas
2. 250×350 logical pixel grid scaled 4× with nearest-neighbor
3. bottom-center anchor
4. feet baseline at y=1340
5. pure white production background
6. full-canvas equipment overlays
7. the file-loading locations you want used

After confirmation, ChatGPT will provide only the Pathfinder Adventurer pilot: base, eight idle frames, level-up pose, boots overlay, and fox companion. Please integrate and QA that slice before requesting remaining classes or tiers.

