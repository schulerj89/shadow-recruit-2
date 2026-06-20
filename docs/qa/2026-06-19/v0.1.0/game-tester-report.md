# Shadow Recruit 2 Game Tester Report

Build: v0.1.0
Date: 2026-06-19

## Evidence

- Smoke screenshots: `artifacts/smoke/v0.1.0`
- Committed screenshots: `docs/qa/2026-06-19/v0.1.0/screenshots`
- FPS metrics: `docs/qa/2026-06-19/v0.1.0/metrics.json`
- Metrics available: yes
- Frame pacing: 55.6 FPS, 18.0 ms latest, 18.2 ms p95, 240 samples
- Renderer metrics: 12 draw calls, 185737 triangles, 24 geometries, 14 textures

## Tester Feedback

- Title flow: verify logo, rotating level-one preview, hero model, Start, Change Hero, and Settings are visible.
- Tutorial: verify General Caldwell text aligns with the camera target and final step includes "Good luck, cadet."
- Level: verify keycard, terminal, command codes, sliding doors, sentries, and extraction are readable.
- Completion: verify triumphant cue starts and level stats appear.
- Performance: current artifact is steady but slightly above the strict 16.7 ms frame budget in this Playwright environment.

## Required Fixes

- P0: None recorded by generated report.
- P1: Inspect screenshots manually for camera framing and objective readability.
- P1: Inspect title/gameplay screenshots for level readability and hero framing after imported GLB scale changes.
- P1: Headed FPS artifact measured 55.6 FPS with 18.2 ms p95. This is steady and low-cost (12 draw calls, 185737 triangles), but it needs a stricter 16.7 ms verification pass on a true 60 Hz visible browser before the 60 FPS gate is fully proven.
- P2: Expand tester notes after the first human play session.
