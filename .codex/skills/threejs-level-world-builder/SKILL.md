---
name: threejs-level-world-builder
description: Plan, build, and review Three.js game levels, mission spaces, encounter layouts, world streaming, traversal readability, LOD placement, nav/collision authoring boundaries, and environmental storytelling. Use when Codex designs Shadow Recruit 2 levels, districts, rooms, stealth routes, patrol spaces, objective layouts, or world-building pipelines.
---

# Three.js Level World Builder

## Level Contract

Use this skill when the playable space is the main risk. A good Shadow Recruit 2 level should read from the gameplay camera, teach the current objective, support stealth decisions, and expose enough debug hooks to iterate quickly.

Start every level slice with:

- Player fantasy and mission verb.
- Start, objective, pressure point, optional route, failure zone, and exit.
- Camera distance, sightline rules, cover language, and traversal scale.
- Required gameplay proxies: navmesh, collision, trigger volumes, patrol rails, objective bounds, and camera blockers.
- Performance budget: visible rooms, active enemies, draw calls, triangles, texture pressure, and streaming boundary.

## Layout Rules

- Block out with primitives first. Do not accept generated art as level geometry until routes, camera, and collision are proven.
- Keep three routes in mind: safe route, fast route, and risky/reward route.
- Use landmark silhouettes and light/value contrast so players can orient without a minimap.
- Fill large spaces with purposeful tactical detail. Empty floor area is acceptable only when it creates stealth timing, sightline risk, combat spacing, or cinematic staging; otherwise add cover, machinery, cables, signage, lights, vents, crates, rails, decals, terminals, patrol landmarks, or extraction equipment.
- For each major room or corridor, keep a coordinate-backed density note: floor area, cover/blocker footprint, visual set-dressing footprint, landmark count, interactable count, repeated-material exposure, enemy/patrol context, and intended screenshot angle. Route sparse zones to asset generation before calling the level AAA-ready.
- Put objectives where the approach, interaction, and escape are all readable from gameplay camera height.
- Keep patrol routes explainable: guard intent, blind spots, cover timing, and alert fallback.
- Design reset paths. A failed stealth attempt should recover into search, chase, combat, or restart without breaking the level.

## World And Streaming

- Split large spaces by district, room, floor, or mission beat. Each slice owns its assets, collision proxies, audio zones, and debug teleport.
- Use LOD for distant set dressing and ring/room streaming for asset payload control.
- Keep navigation and collision authored as low-complexity data, not render mesh triangles.
- Hand wall overlap, bounds containment, corridor clearance, grid tolerance, and blockout math checks to `$threejs-level-geometry-validator`.
- Reserve expensive cinematic GLBs for focal objects. Use reusable kits for walls, trim, cover, doors, terminals, vents, lights, and signage.
- Track set-dressing density by room or encounter beat. A level can pass geometry validation while still failing AAA presentation if screenshots show mostly bare wall/floor texture and no functional props.
- Use generated textures as one layer only. Walls and floors still need geometry silhouettes, seams, decals, panels, pipes, vents, lights, terminals, rails, clutter, and objective staging that read from the gameplay camera.
- Design camera-visible layers. Each important screenshot should have readable foreground, midground, and background detail: cover or equipment near the player, objective or patrol context in the midground, and landmarks, lighting, silhouettes, or signage in the distance.
- Avoid "large but empty" spaces unless the emptiness is a deliberate stealth timing arena with visible purpose. If broad floor area has no cover, machinery, terminals, vents, cables, lighting accents, patrol props, or extraction staging, mark the zone as blockout-quality.
- Hand memory and streaming budget checks to `$threejs-memory`.
- Hand GLB kit generation and registry work to `$threejs-aaa-asset-builder`.

## Encounter Review

Before a level is accepted, verify:

- The player can identify the objective within 3 seconds of entering the space.
- Cover, threats, exits, interactables, and locked gates have consistent visual language.
- Enemy perception matches visual cones, lights, sound cues, and debug overlays.
- Patrol and objective routes survive multiple player speeds and mobile input.
- Debug teleport points exist for start, objective, failure, success, and each encounter beat.
- The room or corridor does not rely on wall/floor textures alone. Use a scorecard from `0` empty blockout to `5` AAA-ready layered scene; any zone below `4` needs specific set-dressing or asset-builder tasks before release.

## References

Read `references/sources.md` when source-backed current docs are needed.
