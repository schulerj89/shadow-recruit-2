# Source Notes

Research date: 2026-06-19.

- Rapier JavaScript character controller: https://rapier.rs/docs/user_guides/javascript/character_controller/
  - The character controller computes corrected movement for colliders or kinematic bodies.
- Rapier rigid bodies: https://rapier.rs/docs/user_guides/javascript/rigid_bodies
  - Rigid bodies own solid dynamics and kinematics. Colliders provide contact shapes.
- Rapier colliders: https://rapier.rs/docs/user_guides/javascript/colliders
  - Colliders generate contacts and collision events, and can attach to rigid bodies.
- Rapier scene queries: https://rapier.rs/docs/user_guides/javascript/scene_queries
  - World scene queries support ray casts and geometric queries against colliders.
- Rapier common mistakes: https://rapier.rs/docs/user_guides/javascript/common_mistakes/
  - Triangle-mesh colliders do not automatically compute mass properties for rigid bodies.
- Recast Navigation: https://recastnav.com/
  - Recast builds navmeshes; Detour handles pathfinding and spatial reasoning.
- Yuka: https://mugen87.github.io/yuka/
  - Provides game AI concepts including state-driven agents, steering, navigation, perception, and triggers.

Re-check library docs before adding runtime dependencies or changing simulation contracts.
