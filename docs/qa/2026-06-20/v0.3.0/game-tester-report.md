# Shadow Recruit 2 Game Tester Report

Build: v0.3.0
Date: 2026-06-20

## Evidence

- Smoke screenshots: `artifacts/smoke/v0.3.0`
- Browser playthrough: `docs/qa/2026-06-20/v0.3.0/playthrough-report.json` (captured)
- Committed screenshots: `docs/qa/2026-06-20/v0.3.0/screenshots`
- FPS metrics: `docs/qa/2026-06-20/v0.3.0/metrics.json`
- Metrics available: yes
- Game frame pacing: 56.2 FPS, 17.8 ms median, 17.6 ms latest, 18.2 ms p95, 240 samples
- Browser baseline: 56.2 FPS, 17.8 ms median, 18.1 ms p95, 240 samples
- FPS gate: environment-limited; strictTarget=false; browserCanProve60=false; tracksBaseline=true
- Renderer metrics: 12 draw calls, 185737 triangles, 24 geometries, 14 textures
- Loaded assets: 5 total (2 character, 3 static): hero:shadow-operative, sentry, codes, keycard, terminal
- Settings state: debug=false; muted=false; performance=balanced

## Tester Feedback

- Title flow: verify logo, rotating level-one preview, hero model, Start, Change Hero, and Settings are visible.
- Tutorial: verify all five General Caldwell screenshots align with hero, keycard, terminal, sentry, and extraction targets, and the final step includes "Good luck, cadet."
- Level: verify keycard, terminal, command codes, sentries, extraction, the command-codes close-up screenshot, and all three door-focus screenshots are readable.
- Playthrough: verify the browser route uses the authored validation route, keyboard interaction, door-focus pauses, and extraction completion without sentry contact.
- Completion: verify triumphant cue starts and level stats appear.
- Performance: game pacing matches the 56.2 FPS browser baseline, but this environment cannot prove strict 16.7 ms frame cadence.

## Required Fixes

- P0: None recorded by generated report.
- P1: Inspect screenshots manually for camera framing and objective readability.
- P1: Inspect title/gameplay screenshots for level readability and hero framing after imported GLB scale changes.
- P1: Current headed browser baseline measured 56.2 FPS / 17.8 ms median and cannot prove strict 16.7 ms. The game tracks that baseline within tolerance, so rerun on a true 60 Hz visible browser before marking the 60 FPS gate fully proven.
- P2: Expand tester notes after the first human play session.
