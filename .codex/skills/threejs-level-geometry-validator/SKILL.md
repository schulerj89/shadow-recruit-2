---
name: threejs-level-geometry-validator
description: Create and validate Three.js level blockout geometry with math-first boundary checks, wall overlap detection, AABB/OBB reasoning, clearance rules, spawn/objective containment, collision-proxy sanity checks, and navmesh blocker preparation. Use when Codex designs, reviews, or automates Shadow Recruit 2 level data, room bounds, wall kits, doors, blockers, patrol areas, walkable spaces, or any map layout where overlapping walls, invalid boundaries, trapped spawns, impossible corridors, or broken collision geometry are risks.
---

# Three.js Level Geometry Validator

## Geometry Contract

Use this skill when level correctness is the main risk. Level geometry should be authored as data that can be validated before it becomes render meshes, colliders, or navmesh input.

Default assumptions:

- Treat X/Z as the ground plane and Y as height.
- Use meters as gameplay units unless project code defines another unit.
- Keep wall, floor, room, blocker, door, spawn, objective, and nav tags separate.
- Validate collision and navigation proxies before generated art or GLB dressing.
- Preserve the visible 60 FPS path by rejecting needlessly dense collision/nav geometry.

## Validation Pipeline

For every new or modified level blockout:

1. Normalize all rectangles, points, and polygons into one coordinate space.
2. Verify all numeric values are finite and every min/max bound has positive area.
3. Validate the world bounds contain walls, blockers, spawns, objectives, exits, and authored route markers.
4. Use broad-phase AABB checks first; only move to OBB/SAT, polygon intersection, or physics scene queries when rotated or non-rectangular geometry requires it.
5. Treat true wall overlap as an error, edge-touching as acceptable only when intentional, and small unplayable gaps as warnings or errors based on the clearance rule.
6. Verify player and NPC capsules have clearance through doors, corridors, stairs, ramps, vents, and cover gaps.
7. Feed only validated walkable geometry and blockers into navmesh generation.
8. Return machine-readable errors that name the offending IDs and the math used.

## Boundary Rules

- A wall or blocker must not extend outside the declared level bounds unless it is marked as exterior-only dressing.
- Do not use render mesh bounds as gameplay truth for GLB kits; author explicit collision proxies.
- Align modular walls to a grid or declare exact tolerances. Do not mix snapping systems without conversion.
- Keep wall thickness, door width, corridor width, step height, slope angle, and capsule radius in level metadata.
- Use strict overlap tests with epsilon. `intersectsBox`-style checks can include touching edges, so compute overlap depth/area before reporting a wall collision.
- For rotated rectangles, use oriented-box SAT or physics collider queries; do not approve layouts based only on their world AABB.
- For polygon rooms, validate winding, self-intersections, duplicate vertices, and near-zero edges before triangulation or navmesh bake.

## Scripted Check

Use the bundled validator for early JSON blockouts with axis-aligned rectangles:

```powershell
node .codex\skills\threejs-level-geometry-validator\scripts\validate_level_geometry.mjs data\levels\mission-01.json --min-clearance 1.2
```

Supported fields include `bounds`, `walls`, `blockers`, `colliders`, `spawns`, `objectives`, and `exits`. Prefer `center` plus `size` for rectangles and `position` for points.

The script is an early gate, not the final physics proof. If it reports rotated geometry, complex polygons, or clearance ambiguity, route to `$threejs-physics-navigation` for collider queries or navmesh validation.

## Handoffs

- Route mission pacing, cover language, and encounter readability to `$threejs-level-world-builder`.
- Route character capsule, collider groups, physics scene queries, and navmesh behavior to `$threejs-physics-navigation`.
- Route debug visualization overlays to `$threejs-webgpu-webgl-expert`.
- Route release smoke, screenshots, and frame pacing evidence to `$threejs-qa-automation`.
- Route SemVer, changelog, commit, and push work to `$shadow-recruit-release-manager`.

## References

Read `references/sources.md` before changing geometry validation assumptions, overlap math, physics query rules, or navmesh generation guidance.
