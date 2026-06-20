# Level Density Gate

Date: 2026-06-20

## Decision

Registered Shadow Recruit levels must pass an automated density gate before release.

The gate checks the runtime `LevelDefinition` registry, not just raw geometry JSON, and requires:

- Whole-level tactical footprint at or above 18%.
- Every authored density zone at or above 20%.
- Every zone has at least one objective, door, or extraction milestone.
- Every expected landmark is present in the zone by authored ID.

## Rationale

The v0.15.3 tester report proved Level 1 can meet the current AAA-readiness target, but future scaffolded missions could still register with sparse zones, missing landmarks, or technically valid geometry that reads as a blockout. The new `level:density` gate makes that failure visible before browser QA.

The scaffold template now starts with enough non-solid GLB set dressing to pass the same gate while keeping collision truth in walls and blockers.

## Validation

- A temporary registered `density-template-check` mission generated from `level:scaffold --register --force` passed `level:doctor`, `level:density`, `test:playthrough`, and `build`.
- The temporary mission was removed after proving the scaffold path, leaving the reusable scaffold and density gate as the shipped change.
