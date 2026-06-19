# Source Notes

Research date: 2026-06-19.

- Three.js LOD: https://threejs.org/docs/pages/LOD.html
  - LOD switches between objects at specified distances and is useful for world-scale detail control.
- Three.js Layers and Raycaster docs: https://threejs.org/docs/
  - Use layers and raycasts deliberately for camera probes, interaction, and debug views.
- Recast Navigation: https://recastnav.com/
  - Recast constructs navmeshes by rasterizing input triangle meshes into voxels, filtering walkable areas, partitioning regions, and generating navigation polygons.
- recast-navigation-js: https://github.com/isaac-mason/recast-navigation-js
  - Provides WebAssembly Recast/Detour APIs for navmesh generation, querying, and crowds.
- three-pathfinding: https://github.com/donmccurdy/three-pathfinding
  - Provides navigation mesh utilities for Three.js, including path computation, zones, and movement clamping.

Re-check sources before choosing a navmesh library, LOD strategy, or world-streaming pattern.
