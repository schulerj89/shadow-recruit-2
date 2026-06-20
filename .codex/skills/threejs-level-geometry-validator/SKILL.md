---
name: threejs-level-geometry-validator
description: Create and validate Three.js level blockouts with math-first boundary checks, wall overlap detection, AABB/OBB reasoning, clearance rules, spawn/objective containment, door-opening validation, collision-proxy sanity checks, and navmesh blocker preparation. Use when Codex acts as a level creator, map layout author, geometry QA agent, or automation loop for Shadow Recruit 2 level data, room bounds, wall kits, doors, blockers, patrol areas, walkable spaces, or any layout where overlapping walls, invalid boundaries, trapped spawns, impossible corridors, or broken collision geometry are risks.
---

# Three.js Level Creator And Geometry Validator

## Geometry Contract

Use this skill when level correctness is the main risk. Level geometry should be authored as data that can be validated before it becomes render meshes, colliders, or navmesh input.

Default assumptions:

- Treat X/Z as the ground plane and Y as height.
- Use meters as gameplay units unless project code defines another unit.
- Keep wall, floor, room, blocker, door, spawn, objective, and nav tags separate.
- Validate collision and navigation proxies before generated art or GLB dressing.
- Preserve the visible 60 FPS path by rejecting needlessly dense collision/nav geometry.

## Level Creator Workflow

Use this workflow before building render meshes or asking asset skills for GLB dressing:

1. Define `bounds`, `metadata`, and authoring units first. Include wall thickness, player capsule radius, NPC capsule radius, minimum door width, minimum corridor width, grid size, and epsilon tolerance.
2. Lay out rooms, corridors, cover, doors, blockers, spawns, objectives, exits, patrol anchors, and debug teleports as data. Keep generated art and decorative meshes out of this source of truth.
3. Reserve doorway and gate openings by splitting walls into named segments. Do not place a door collider on top of a continuous wall unless the wall segment is explicitly removed or marked disabled.
4. Run the validator after every layout edit. Treat overlap errors as blocking. Treat narrow gaps, near-blocker spawns, and rotated-rect warnings as handoff items before accepting the level.
5. Generate render meshes, collision proxies, navmesh blockers, debug overlays, and minimap data from the validated blockout, not the other way around.
6. Re-run validation after art replacement, GLB scale changes, physics collider conversion, or procedural generation changes.

## Door And Wall Continuity Proofs

Use this workflow when screenshots show wall gaps around sliding doors or the tester asks whether a door opening actually connects to the surrounding wall:

1. Convert each relevant wall, door, frame, return, and continuity/back-wall rectangle into min/max coordinates from its center/size. For rendered meshes, request or compute world bounds from the runtime scene.
2. Identify the wall line interrupted by the door. The adjacent wall endpoints, door frame jambs, returns, and continuity/back-wall mesh must touch or intentionally overlap within epsilon. A positive unintended gap is a geometry defect even if the door texture partly hides it.
3. For an `x`-axis door, validate X edge alignment between the door span and adjacent wall ends, then validate Z depth coverage between the wall, frame, door panel, and back-wall continuity. For a `z`-axis door, swap X/Z.
4. When several doors, frame pieces, or wall pieces share a wall line, sort their intervals and inspect every adjacent span. A missing wall segment between two doors is still a defect even if each individual door has a local frame.
5. Produce a wall-run interval ledger for each interrupted wall line. Include every wall, door opening, closed-door surface, open-door swept/priority surface when applicable, frame, return, trim, and continuity/back-wall interval sorted along the interrupted axis, plus each adjacent gap or overlap.
6. Report a machine-readable finding with `doorId`, `wallIds`, compared edges, interval neighbors, gap width, overlap depth, epsilon, and open/closed door state.
7. If the runtime lacks bounds for frame, continuity meshes, or wall-run ledgers, mark an instrumentation failure and route to `$threejs-qa-automation` or `$threejs-webgpu-webgl-expert` for debug overlays.

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

## Math Gates

- Use half-open intent when authoring snapped segments: adjacent wall edges may touch, but positive overlap depth on both axes is a collision.
- Compute overlap depth as `min(a.max, b.max) - max(a.min, b.min)` per axis. Only report overlap when both depths are greater than epsilon.
- Compute corridor clearance only when two blockers overlap on the perpendicular axis. A diagonal distance between unrelated corners is not enough to prove a playable passage.
- Validate every spawn, objective, exit, patrol anchor, and interaction point against inflated blockers using the active capsule radius plus interaction margin.
- For rotated walls or non-axis-aligned props, use OBB/SAT or physics scene queries. A world AABB is only a broad phase and can reject candidates, not approve final placement.
- For polygon rooms, reject self-intersections, duplicate vertices, near-zero edges, reversed winding when the renderer/navmesh expects a convention, and triangulation holes.
- For generated corridors, prove connected walkable space with route sampling or navmesh path queries before accepting the layout.

## Boundary Rules

- A wall or blocker must not extend outside the declared level bounds unless it is marked as exterior-only dressing.
- Do not use render mesh bounds as gameplay truth for GLB kits; author explicit collision proxies.
- Align modular walls to a grid or declare exact tolerances. Do not mix snapping systems without conversion.
- Keep wall thickness, door width, corridor width, step height, slope angle, and capsule radius in level metadata.
- Use strict overlap tests with epsilon. `intersectsBox`-style checks can include touching edges, so compute overlap depth/area before reporting a wall collision.
- For rotated rectangles, use oriented-box SAT or physics collider queries; do not approve layouts based only on their world AABB.
- For polygon rooms, validate winding, self-intersections, duplicate vertices, and near-zero edges before triangulation or navmesh bake.
- When a wall contains an opening, model the remaining wall pieces as separate rectangles so the validator can prove the opening exists.
- When a sliding door overlays a wall opening, also model the frame, returns, and continuity/back-wall pieces as named data or debug bounds. The tester must be able to prove that the door takes visual priority over a still-present wall/portal surface.
- When multiple door openings share one wall run, validate the entire run as a single sorted interval set. Do not approve each door in isolation; the span between two doors must be explicitly owned by wall, frame, return, trim, continuity/back-wall, or a deliberate door-priority surface.
- Keep door state ownership explicit. `closed` intervals should name the visible door surface; `open` intervals should name the wall/portal/continuity surface that remains visible, plus the sliding door's priority surface if it overlaps the wall plane.
- Keep collision proxies simpler than art. Prefer box/capsule/convex proxies for level kits and reserve triangle meshes for static walkable ground that has passed budget review.

## Acceptance Checklist

Accept a level blockout only when:

- Bounds contain every solid wall, door, blocker, collider, spawn, objective, exit, and required route marker.
- No two solid rectangles have positive overlap depth on both axes unless one is marked non-solid dressing and excluded from collision/nav generation.
- Door widths, corridor widths, cover gaps, vents, and stairs satisfy the active player and NPC capsule clearance rules.
- Spawns and objectives are inside walkable space and outside inflated blocker clearance.
- Required objective routes remain connected after every door state: locked, opening, open, alarm, combat, and extraction.
- Debug views can draw bounds, collision proxies, overlap pairs, narrow gaps, capsule clearance, and nav blockers with stable IDs.
- Door continuity reports can prove the edge relationship between wall pieces, door panels, frames, returns, and back-wall surfaces for every door state that QA screenshots capture.
- Multi-door wall-run interval ledgers can prove there is no unowned positive gap between nearby doors, adjacent wall segments, returns, trim, open-door priority surfaces, or continuity pieces.

## Scripted Check

Use the bundled validator for early JSON blockouts with axis-aligned rectangles:

```powershell
node .codex\skills\threejs-level-geometry-validator\scripts\validate_level_geometry.mjs data\levels\mission-01.json --min-clearance 1.2
```

Supported solid rectangle fields include `bounds`, `walls`, `doors`, `blockers`, and `colliders`; `setDressing` is bounds-checked as non-solid visual geometry and excluded from overlap/clearance blocking. Supported point fields include `spawns`, `objectives`, and `exits`. Prefer `center` plus `size` for rectangles and `position` for points.

The script is an early gate, not the final physics proof. If it reports rotated geometry, complex polygons, or clearance ambiguity, route to `$threejs-physics-navigation` for collider queries or navmesh validation.

## Handoffs

- Route mission pacing, cover language, and encounter readability to `$threejs-level-world-builder`.
- Route character capsule, collider groups, physics scene queries, and navmesh behavior to `$threejs-physics-navigation`.
- Route debug visualization overlays to `$threejs-webgpu-webgl-expert`.
- Route release smoke, screenshots, and frame pacing evidence to `$threejs-qa-automation`.
- Route SemVer, changelog, commit, and push work to `$shadow-recruit-release-manager`.

## References

Read `references/sources.md` before changing geometry validation assumptions, overlap math, physics query rules, or navmesh generation guidance.
