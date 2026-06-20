# Shadow Recruit 2 Game Tester Report

Build: v0.8.0
Date: 2026-06-20

## Evidence

- Smoke screenshots: `artifacts/smoke/v0.8.0`
- Browser playthrough: `docs/qa/2026-06-20/v0.8.0/playthrough-report.json` (captured)
- Committed screenshots: `docs/qa/2026-06-20/v0.8.0/screenshots`
- FPS metrics: `docs/qa/2026-06-20/v0.8.0/metrics.json`
- Screenshot coverage: 14/14 expected captures present (13412.3 KB)
- Metrics available: yes
- Game frame pacing: 56.2 FPS, 17.8 ms median, 17.3 ms latest, 18.2 ms p95, 240 samples
- Browser baseline: 55.9 FPS, 17.9 ms median, 18.2 ms p95, 240 samples
- FPS gate: environment-limited; profile=performance; strictTarget=false; browserCanProve60=false; tracksBaseline=true
- Renderer metrics: 8 draw calls, 96035 triangles, 42 geometries, 29 textures, profile=performance, shadows=false, shadowMap=0
- Loaded assets: 5 total (2 character, 3 static): hero:shadow-operative, sentry, codes, keycard, terminal
- Asset grades: 13 pass, 0 review, 0 fail
- Geometry diagnostics: 50 object bounds; 3 door checks; levelDensity=pass (13.0%)
- Completion stats: active=true; objectives=3/3; alerts=0; cue=triumphant; elapsed=14s
- Settings state: debug=false; muted=false; performance=performance

## Coordinate QA

- PASS door/lobby-door: axis=x; walls=lobby-divider-west, lobby-divider-east; opening=x=-3..3, y=0..3.3, z=-18.4..-17.6; frame=x=-3.32..3.32, y=0..3.66, z=-18.69..-17.31; continuity=x=-3.29..3.29, y=0..3.3, z=-18.66..-17.34; no gaps above 0.08m
- PASS door/server-door: axis=x; walls=server-divider-west, server-divider-east; opening=x=11..17, y=0..3.3, z=4.6..5.4; frame=x=10.68..17.32, y=0..3.66, z=4.31..5.69; continuity=x=10.71..17.29, y=0..3.3, z=4.34..5.66; no gaps above 0.08m
- PASS door/extraction-door: axis=x; walls=command-divider-west, command-divider-east; opening=x=-3..3, y=0..3.3, z=19.6..20.4; frame=x=-3.32..3.32, y=0..3.66, z=19.31..20.69; continuity=x=-3.29..3.29, y=0..3.3, z=19.34..20.66; no gaps above 0.08m
- PASS level-density: floor=6048m2; dressing=788.62m2; ratio=13.0%; blockers=6; setDressing=15; objectives=3; enemies=3. Set-dressing and gameplay footprints cover 13.0% of the level floor.

## Asset Grading

- PASS level-mesh/level-floor: Floor mesh; visible=true; grounded=true. pos=(0,0,0); y=0..0; h=0; xz=84x72 Floor mesh covers the authored level bounds with a generated tactical floor-panel image texture. Floor uses src/assets/generated/tactical-floor-panel.png as a repeated runtime texture.
- PASS level-mesh/level-walls: Wall meshes; visible=true; grounded=true. 12 wall meshes are present and use src/assets/generated/blacksite-wall-panel.png as the repeated generated wall texture.
- PASS door/sliding-doors: Sliding door panels; visible=true; grounded=true. 3 sliding door assemblies are present and use the generated door-panel texture.
- PASS door/door-wall-seams: Door-wall seams; visible=true; grounded=true. 3 sliding-door openings have door frames plus wall/portal continuity meshes behind the door layer, so the door panels visually take priority without reading as missing wall gaps.
- PASS level-mesh/level-set-dressing: Tactical set dressing; visible=true; grounded=true. 15 coordinate-authored non-colliding dressing meshes add cables, wall machinery, racks, consoles, and extraction equipment without blocking the validation route.
- PASS objective/access-keycard: Recover the lobby keycard; visible=true; grounded=true. pos=(-31,0,-25); y=0..0.9; h=0.9; xz=1.49x0.02 keycard GLB is visible, grounded, and available for interaction.
- PASS objective/security-terminal: Hack the security terminal; visible=true; grounded=true. pos=(30,0,-3); y=0..1.55; h=1.55; xz=1.16x2.45 terminal GLB is visible, grounded, and available for interaction.
- PASS objective/command-codes: Copy the command codes; visible=true; grounded=true. pos=(-32,0,14); y=0..1; h=1; xz=1.81x1.28 codes GLB is visible, grounded, and available for interaction.
- PASS enemy/sentry-lobby: Lobby sentry; visible=true; grounded=true. pos=(5.83,0,-24.15); y=0.02..1.57; h=1.55; xz=1.58x1.58 Sentry GLB is visible above the floor and aligned to its patrol route.
- PASS enemy/sentry-server: Server sentry; visible=true; grounded=true. pos=(27,0,14.08); y=0.02..1.57; h=1.55; xz=1.75x1.75 Sentry GLB is visible above the floor and aligned to its patrol route.
- PASS enemy/sentry-command: Command sentry; visible=true; grounded=true. pos=(-4.28,0,25); y=0.02..1.57; h=1.55; xz=1.46x1.46 Sentry GLB is visible above the floor and aligned to its patrol route.
- PASS hero/hero: Playable hero; visible=true; grounded=true. pos=(0,0,-29); y=0.02..1.47; h=1.45; xz=1.17x0.79 Hero GLB is visible and grounded at the current player position.
- PASS extraction/extraction: Extraction point; visible=true; grounded=true. pos=(0,0.08,33); y=0..0.16; h=0.15; xz=4.96x4.96 Extraction marker is visible and readable as the level-completion target.

## Screenshot Coverage

- PASS screenshot/title.png: captured (685.5 KB)
- PASS screenshot/settings.png: captured (538.5 KB)
- PASS screenshot/hero-select.png: captured (651.6 KB)
- PASS screenshot/tutorial-01-insertion.png: captured (1107.7 KB)
- PASS screenshot/tutorial-02-keycard.png: captured (873.9 KB)
- PASS screenshot/tutorial-03-terminal.png: captured (1110.9 KB)
- PASS screenshot/tutorial-04-sentry.png: captured (1030.5 KB)
- PASS screenshot/tutorial-05-extraction.png: captured (989.7 KB)
- PASS screenshot/gameplay-level-one.png: captured (994.5 KB)
- PASS screenshot/focus-lobby-door.png: captured (1165.1 KB)
- PASS screenshot/focus-server-door.png: captured (1163.8 KB)
- PASS screenshot/gameplay-command-codes.png: captured (1014.9 KB)
- PASS screenshot/focus-extraction-door.png: captured (1161.4 KB)
- PASS screenshot/complete.png: captured (924.2 KB)

## Tester Feedback

- Title flow: verify the native title treatment, cinematic scene, staged hero model, hero-select preview space, Start, Change Hero, and Settings are visible.
- Tutorial: verify all five General Caldwell screenshots align with hero, keycard, terminal, sentry, and extraction targets, and every step ends with "Good luck, cadet."
- Level: verify keycard, terminal, command codes, sentries, extraction, wall/floor meshes, wall/floor texture quality, and all three door-focus screenshots are readable and properly grounded.
- Playthrough: verify the browser route uses the authored validation route, keyboard interaction, door-focus pauses, and extraction completion without sentry contact.
- Coordinate QA: verify door/wall continuity by edge coordinates, not screenshot impression alone. Wall gaps must name door ID, wall IDs, frame/continuity bounds, and measured gap widths.
- Camera QA: verify the normal gameplay screenshot is captured before objective interaction, with debug teleports snapping the gameplay camera to the current player position.
- Asset QA: verify objective GLBs, sentry GLBs, floor/wall meshes, floor/wall/object texture quality, door-panel clarity, wall-door gaps/seams, and extraction marker pass or have explicit review notes.
- Completion: verify triumphant cue starts and level stats appear.
- Performance: game pacing matches the 55.9 FPS browser baseline, but this environment cannot prove strict 16.7 ms frame cadence.

## Required Fixes

- P0: None recorded by generated report.
- P1: Current headed browser baseline measured 55.9 FPS / 17.9 ms median and cannot prove strict 16.7 ms on the performance profile. The game tracks that baseline within tolerance, so rerun on a true 60 Hz visible browser before marking the 60 FPS gate fully proven.
- P1: None from generated asset grading.
- P1: None from generated coordinate geometry diagnostics.
- P1: None from generated screenshot coverage.
