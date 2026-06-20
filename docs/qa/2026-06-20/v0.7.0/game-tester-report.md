# Shadow Recruit 2 Game Tester Report

Build: v0.7.0
Date: 2026-06-20

## Evidence

- Smoke screenshots: `artifacts/smoke/v0.7.0`
- Browser playthrough: `docs/qa/2026-06-20/v0.7.0/playthrough-report.json` (captured)
- Committed screenshots: `docs/qa/2026-06-20/v0.7.0/screenshots`
- FPS metrics: `docs/qa/2026-06-20/v0.7.0/metrics.json`
- Screenshot coverage: 14/14 expected captures present (4783.6 KB)
- Metrics available: yes
- Game frame pacing: 55.6 FPS, 18.0 ms median, 17.6 ms latest, 18.1 ms p95, 240 samples
- Browser baseline: 55.9 FPS, 17.9 ms median, 18.1 ms p95, 240 samples
- FPS gate: environment-limited; profile=performance; strictTarget=false; browserCanProve60=false; tracksBaseline=true
- Renderer metrics: 5 draw calls, 95999 triangles, 27 geometries, 23 textures, profile=performance, shadows=false, shadowMap=0
- Loaded assets: 5 total (2 character, 3 static): hero:shadow-operative, sentry, codes, keycard, terminal
- Asset grades: 9 pass, 2 review, 1 fail
- Settings state: debug=false; muted=false; performance=performance

## Asset Grading

- REVIEW level-mesh/level-floor: Floor mesh; visible=true; grounded=true. pos=(0,0,0); y=0..0; h=0; xz=84x72 Floor mesh covers the authored level bounds with repeated tactical panel texture detail. Floor still uses a procedural canvas texture; replace with a generated image texture attached to the floor mesh before grading it as AAA-quality art.
- REVIEW level-mesh/level-walls: Wall meshes; visible=true; grounded=true. 12 wall meshes are present, but they use procedural panel texture instead of a generated AAA wall image attached to each wall material.
- PASS door/sliding-doors: Sliding door panels; visible=true; grounded=true. 3 sliding door assemblies are present and use the generated door-panel texture.
- FAIL door/door-wall-seams: Door-wall seams; visible=true; grounded=true. 3 sliding-door openings have trim, but still need wall/portal continuity behind the door so the opening does not read as a missing wall gap; the opening door should visually take priority over that wall surface.
- PASS objective/access-keycard: Recover the lobby keycard; visible=true; grounded=true. pos=(-31,0,-25); y=0..0.9; h=0.9; xz=1.49x0.02 keycard GLB is visible, grounded, and available for interaction.
- PASS objective/security-terminal: Hack the security terminal; visible=true; grounded=true. pos=(30,0,-3); y=0..1.55; h=1.55; xz=1.16x2.45 terminal GLB is visible, grounded, and available for interaction.
- PASS objective/command-codes: Copy the command codes; visible=true; grounded=true. pos=(-32,0,14); y=0..1; h=1; xz=1.81x1.28 codes GLB is visible, grounded, and available for interaction.
- PASS enemy/sentry-lobby: Lobby sentry; visible=true; grounded=true. pos=(5.83,0,-24.15); y=0.02..1.57; h=1.55; xz=1.58x1.58 Sentry GLB is visible above the floor and aligned to its patrol route.
- PASS enemy/sentry-server: Server sentry; visible=true; grounded=true. pos=(27,0,14.08); y=0.02..1.57; h=1.55; xz=1.75x1.75 Sentry GLB is visible above the floor and aligned to its patrol route.
- PASS enemy/sentry-command: Command sentry; visible=true; grounded=true. pos=(-4.28,0,25); y=0.02..1.57; h=1.55; xz=1.46x1.46 Sentry GLB is visible above the floor and aligned to its patrol route.
- PASS hero/hero: Playable hero; visible=true; grounded=true. pos=(0,0,-29); y=0.02..1.47; h=1.45; xz=1.17x0.79 Hero GLB is visible and grounded at the current player position.
- PASS extraction/extraction: Extraction point; visible=true; grounded=true. pos=(0,0.08,33); y=0..0.16; h=0.15; xz=4.96x4.96 Extraction marker is visible and readable as the level-completion target.

## Screenshot Coverage

- PASS screenshot/title.png: captured (285.7 KB)
- PASS screenshot/settings.png: captured (159.4 KB)
- PASS screenshot/hero-select.png: captured (260.8 KB)
- PASS screenshot/tutorial-01-insertion.png: captured (465.2 KB)
- PASS screenshot/tutorial-02-keycard.png: captured (385.0 KB)
- PASS screenshot/tutorial-03-terminal.png: captured (375.3 KB)
- PASS screenshot/tutorial-04-sentry.png: captured (358.5 KB)
- PASS screenshot/tutorial-05-extraction.png: captured (501.1 KB)
- PASS screenshot/gameplay-level-one.png: captured (288.1 KB)
- PASS screenshot/focus-lobby-door.png: captured (306.6 KB)
- PASS screenshot/focus-server-door.png: captured (305.8 KB)
- PASS screenshot/gameplay-command-codes.png: captured (301.7 KB)
- PASS screenshot/focus-extraction-door.png: captured (304.3 KB)
- PASS screenshot/complete.png: captured (486.0 KB)

## Tester Feedback

- Title flow: verify logo, rotating level-one preview, staged hero model, hero-select preview space, Start, Change Hero, and Settings are visible.
- Tutorial: verify all five General Caldwell screenshots align with hero, keycard, terminal, sentry, and extraction targets, and the final step includes "Good luck, cadet."
- Level: verify keycard, terminal, command codes, sentries, extraction, wall/floor meshes, wall/floor texture quality, and all three door-focus screenshots are readable and properly grounded.
- Playthrough: verify the browser route uses the authored validation route, keyboard interaction, door-focus pauses, and extraction completion without sentry contact.
- Camera QA: verify the normal gameplay screenshot is captured before objective interaction, with debug teleports snapping the gameplay camera to the current player position.
- Asset QA: verify objective GLBs, sentry GLBs, floor/wall meshes, floor/wall/object texture quality, door-panel clarity, wall-door gaps/seams, and extraction marker pass or have explicit review notes.
- Completion: verify triumphant cue starts and level stats appear.
- Performance: game pacing matches the 55.9 FPS browser baseline, but this environment cannot prove strict 16.7 ms frame cadence.

## Required Fixes

- P0: None recorded by generated report.
- P1: Current headed browser baseline measured 55.9 FPS / 17.9 ms median and cannot prove strict 16.7 ms on the performance profile. The game tracks that baseline within tolerance, so rerun on a true 60 Hz visible browser before marking the 60 FPS gate fully proven.
- P1: Asset door-wall-seams failed grading: 3 sliding-door openings have trim, but still need wall/portal continuity behind the door so the opening does not read as a missing wall gap; the opening door should visually take priority over that wall surface.
- P2: Asset level-floor needs art/readability review: Floor mesh covers the authored level bounds with repeated tactical panel texture detail. Floor still uses a procedural canvas texture; replace with a generated image texture attached to the floor mesh before grading it as AAA-quality art.
- P2: Asset level-walls needs art/readability review: 12 wall meshes are present, but they use procedural panel texture instead of a generated AAA wall image attached to each wall material.
- P1: None from generated screenshot coverage.
