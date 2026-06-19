# Source Notes

Research date: 2026-06-19.

- Three.js Box2: https://threejs.org/docs/pages/Box2.html
  - Box2 represents an axis-aligned 2D bounding box and exposes containment, intersection, size, and point-bound methods useful for X/Z blockout validation.
- Three.js Box3: https://threejs.org/docs/pages/Box3.html
  - Box3 represents an axis-aligned 3D bounding box and supports containment, intersection, transform, and point/array/buffer-derived bounds.
- Three.js Raycaster: https://threejs.org/docs/pages/Raycaster.html
  - Raycaster can support debug picking and editor validation, but broad level collision truth should live in authored proxies.
- MDN bounding volume collision with Three.js: https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_collision_detection/Bounding_volume_collision_detection_with_THREE.js
  - Bounding volumes such as boxes and spheres are practical first-pass collision checks.
- Rapier JavaScript scene queries: https://rapier.rs/docs/user_guides/javascript/scene_queries/
  - Scene queries are geometric queries against colliders in the physics world and are appropriate for final placement, clearance, and line-of-sight checks.
- Rapier JavaScript colliders: https://rapier.rs/docs/user_guides/javascript/colliders/
  - Colliders define contact geometry and collision events; level validation should prepare simple stable collider shapes.
- Recast Navigation: https://recastnav.com/
  - Recast builds navmeshes by rasterizing input geometry into voxels, filtering unwalkable areas, and generating walkable polygon regions.
- recast-navigation-js: https://github.com/isaac-mason/recast-navigation-js
  - The JS port supports runtime navmesh generation and Detour queries for procedural or frequently changing environments.

Re-check these sources before changing the level geometry schema, collision proxy assumptions, or navmesh handoff rules.
