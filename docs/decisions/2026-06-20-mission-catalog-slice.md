# Mission Catalog Slice

Date: 2026-06-20

## Context

Subagent Curie audited the current v0.13.4 repo against the persistent game objective and identified three remaining gaps: strict 60 FPS proof on a true 60 Hz browser, persisted subagent evidence, and partial future big-level architecture.

## Decision

Ship the next change as a minor mission-catalog slice. The current code already has level data, a catalog, scaffold scripts, and debug mission selection, but the player-facing ready-room flow still implied one level. Adding a mission selector in the pre-mission screen makes the existing catalog visible to players and gives future big levels a stable UI path without changing Level 1 content.

## Out Of Scope

- Strict 60 FPS proof remains a separate patch/evidence task because the current local browser baseline cannot prove 16.7 ms cadence.
- Runtime modularization beyond the player-facing catalog remains a later minor/refactor slice.
- New level content remains separate from the selector plumbing.
