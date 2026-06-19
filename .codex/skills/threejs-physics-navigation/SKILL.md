---
name: threejs-physics-navigation
description: Design, implement, and review Three.js physics, collision proxies, character controllers, trigger volumes, ray/shape scene queries, navmesh pathfinding, steering, and movement constraints. Use when Codex touches Rapier, physics libraries, collision detection, grounded movement, ramps, stairs, enemy pathing, navigation meshes, or spatial queries.
---

# Three.js Physics Navigation

## Ownership Boundary

Use this skill when movement or spatial truth is the risk. Gameplay collision should be stable, cheap, and debuggable. Render meshes are visual evidence, not the physics source of truth.

## Physics Rules

- Choose a proven physics or navigation library for nontrivial rigid bodies, character controllers, or pathfinding.
- Use simple colliders: capsule for characters, boxes for cover/walls, convex hulls only when needed, triangle meshes only for static world collision.
- Keep physics timestep deterministic and isolated from render frame rate.
- Treat dynamic rigid bodies, kinematic bodies, sensors, and triggers as different contracts. Do not mix them casually.
- Use scene queries for perception and placement checks, but throttle broad AI/path queries.
- Expose a debug overlay for colliders, sensors, contacts, ground normal, velocity, nav path, and blocked movement.

## Character Controller

- Prefer a kinematic character controller for player and humanoid NPC traversal.
- Define slope limit, step height, snap-to-ground, skin width, capsule height/radius, and collision groups as data.
- Feed desired movement into the controller, then apply corrected movement back to simulation state.
- Keep root motion policy explicit. Do not let animation drift the physics body unless that is the intended controller.
- Validate stairs, ramps, door thresholds, moving platforms, corners, and narrow cover gaps.

## Navigation

- Use navmesh or graph data for medium/large enemy navigation; use steering and local avoidance for moment-to-moment motion.
- Bake navmesh from gameplay walkable geometry, not decorative render meshes.
- Author off-mesh links for vaults, ladders, vents, elevators, jumps, and scripted takedown paths.
- Cache paths and update on a fixed cadence. Do not pathfind every frame for every enemy.
- Use AI LOD: distant or hidden NPCs should tick lower-frequency intent/path logic.
- Keep patrol rails as authored data when full pathfinding is unnecessary.

## Handoffs

- Route player verbs and enemy state machines to `$threejs-gameplay-systems`.
- Route level traversal spaces to `$threejs-level-world-builder`.
- Route blockout overlap, bounds, clearance, and authored wall validation to `$threejs-level-geometry-validator`.
- Route visual debugging and renderer overlays to `$threejs-webgpu-webgl-expert`.
- Route memory impact from navmesh, physics worlds, or debug geometry to `$threejs-memory`.

## References

Read `references/sources.md` before selecting or changing physics/navigation libraries.
