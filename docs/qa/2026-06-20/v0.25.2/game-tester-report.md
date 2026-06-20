# Shadow Recruit 2 Game Tester Report

Build: v0.25.2
Date: 2026-06-20

## Evidence

- Smoke screenshots: `artifacts/smoke/v0.25.2`
- Browser playthrough: `docs/qa/2026-06-20/v0.25.2/playthrough-report.json` (captured)
- Browser playthrough matrix: `docs/qa/2026-06-20/v0.25.2/playthrough-matrix.json` (2/2 mission browser playthroughs passed)
- Failure/retry route: `docs/qa/2026-06-20/v0.25.2/failure-retry-report.json` (captured)
- Committed screenshots: `docs/qa/2026-06-20/v0.25.2/screenshots`
- FPS metrics: `docs/qa/2026-06-20/v0.25.2/metrics.json`
- Mission catalog evidence: `docs/qa/2026-06-20/v0.25.2/mission-catalog.json` (captured)
- Mission readiness matrix: `docs/qa/2026-06-20/v0.25.2/mission-readiness.json` (2/2 pass; 0 review; 0 fail)
- Operative trait evidence: `docs/qa/2026-06-20/v0.25.2/operative-traits.json` (captured)
- Gameplay view density evidence: `docs/qa/2026-06-20/v0.25.2/gameplay-view-density.json` (captured)
- Mission guidance evidence: `docs/qa/2026-06-20/v0.25.2/mission-guidance.json` (captured)
- Screenshot coverage: 18/18 expected captures present (12216.9 KB)
- Metrics available: yes
- Mission catalog: selected=Blacksite Threshold; missions=2; blacksite-threshold(3 objectives, 3 enemies), relay-vault(3 objectives, 3 enemies); hero-select brief captured
- Operative traits: selected=echo-vanguard; asset=hero:echo-vanguard; traits=echo-dampeners, armored-step, long-reach-interface; changed=moveSpeed, interactRadius, enemyDetectionRadius; probes=3/3 pass; catalogChanged=3/4
- Game frame pacing: 56.2 FPS, 17.8 ms median, 18.0 ms latest, 18.1 ms p95, 240 samples
- Browser baseline: 55.9 FPS, 17.9 ms median, 18.1 ms p95, 240 samples
- FPS gate: environment-limited; profile=performance; strictTarget=false; browserCanProve60=false; tracksBaseline=true; overhead=-0.1 ms median/0.2 ms p95; headroom=-0.7 ms game/-0.8 ms browser
- FPS scene matrix: title=environment-limited (56.2 FPS, 17.8 ms median, 18.3 ms p95, overhead=-0.1 ms/0.2 ms); gameplay=environment-limited (56.2 FPS, 17.8 ms median, 18.1 ms p95, overhead=-0.1 ms/0.0 ms); complete=environment-limited (56.5 FPS, 17.7 ms median, 18.2 ms p95, overhead=-0.2 ms/0.1 ms); caught=environment-limited (56.2 FPS, 17.8 ms median, 18.1 ms p95, overhead=-0.1 ms/0.0 ms)
- Renderer metrics: 676 draw calls, 296698 triangles, 102 geometries, 21 textures, pixelRatio=0.75, profile=performance, shadows=false, shadowMap=0
- Render budget: pass; profile=performance; calls=676/760; triangles=296698/420000; geometries=102/130; textures=21/34; pixelRatio=0.75/0.75; shadows=false/false
- Loaded assets: 9 total (2 character, 7 static): hero:shadow-operative, sentry, cable-tray, codes, cover-barricade, extraction-beacon, keycard, terminal, wall-machinery
- Runtime asset audit: 9 pass, 0 review, 0 fail; visibleFallbacks=0; sources=repo-generated-glb, sneak-game-seed
- Audio state: gameplay metrics=active=gameplay; muted=false; unlocked=true; completion playthrough=active=complete; muted=false; unlocked=true
- Asset grades: 23 pass, 0 review, 0 fail
- Loading state: 4 steps; latest="starting cinematic tutorial" 100%; captured=preloading hero, sentry, objectives, cover:18% -> preloading tactical dressing:42% -> building blacksite threshold:68% -> starting cinematic tutorial:100%
- Tutorial alignment: 5/5 pass; allCadet=true; targets=hero->hero, keycard->access-keycard, terminal->security-terminal, sentry->sentry-lobby, extraction->extraction
- Title composition: heroReadable=true; identityReadable=true; levelPreview=false; doorBackdrop=true; floor=true; facingDot=0.99; cameraDistance=6.17; screenHeight=44.0%; screenOccupancy=11.0%; screenBounds=x=550.65..921.26, y=291.35..688.02, viewport=1440x900, width=26.0%, height=44.0%, area=11.0%; anchors=head:readable, visor:readable, chest:readable, feet:readable; orbitAngle=0.31; orbitRadius=5.36; heroYaw=1.12; yawToCamera=1.26
- Title treatment: wordmarkReadable=true; text="SHADOW RECRUIT 2"; kicker="OPERATION BLACKGLASS"; bounds=x=160..671.75, y=405.42..661.75, viewport=1440x900, width=36.0%, height=28.0%, area=10.0%; panelOverlap=0.0%; heroOverlap=24.0%
- Gameplay camera: readable=true; active=true; cameraDistance=6.23; screenHeight=29.0%; screenOccupancy=4.0%; screenBounds=x=616.53..822.12, y=375.93..633.73, viewport=1440x900, width=14.0%, height=29.0%, area=4.0%
- Gameplay view density: grade=pass; screenshot=gameplay-level-one.png; bands=near:pass:2 objects/2 categories/21.0% occupancy/21.0% negative, mid:pass:4 objects/2 categories/94.0% occupancy/0.0% negative, far:pass:5 objects/2 categories/61.0% occupancy/0.0% negative
- Mission guidance: active=true; target=access-keycard; kind=objective; action="Recover objective"; distance=7m; direction=W; progress=0/3; exitUnlocked=false
- Geometry diagnostics: 72 object bounds; 3 door checks; 3 wall-run checks; levelDensity=pass (22.0%); aaaReady=yes; level=22.0%; minZone>=20.0%; zones=entry-lobby:pass:24.0%, security-stack:pass:22.0%, server-wing:pass:23.0%, command-extraction:pass:22.0%
- Completion stats: active=true; objectives=3/3; alerts=0; cue=triumphant; elapsed=15s
- Failure/retry evidence: level=blacksite-threshold; contactEnemy=sentry-lobby; caughtPhase=caught; caughtAlerts=1; retryPhase=tutorial; retryAlerts=0; retryObjectives=0/3; screenshots=3
- Settings state: debug=false; muted=false; performance=performance

## Coordinate QA

- PASS door/lobby-door: axis=x; walls=lobby-divider-west, lobby-divider-east; opening=x=-3..3, y=0..3.3, z=-18.4..-17.6; frame=x=-3.32..3.32, y=0..3.66, z=-18.69..-17.31; continuity=x=-3.29..3.29, y=0..3.3, z=-18.66..-17.34; no gaps above 0.08m
- PASS door/server-door: axis=x; walls=server-divider-west, server-divider-east; opening=x=11..17, y=0..3.3, z=4.6..5.4; frame=x=10.68..17.32, y=0..3.66, z=4.31..5.69; continuity=x=10.71..17.29, y=0..3.3, z=4.34..5.66; no gaps above 0.08m
- PASS door/extraction-door: axis=x; walls=command-divider-west, command-divider-east; opening=x=-3..3, y=0..3.3, z=19.6..20.4; frame=x=-3.32..3.32, y=0..3.66, z=19.31..20.69; continuity=x=-3.29..3.29, y=0..3.3, z=19.34..20.66; no gaps above 0.08m
- PASS set-dressing/south-cable-trench-west: asset=cable-tray; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=-36..-8, y=0..0.16, z=-31.6..-30.4; rendered=x=-36..-8, y=0..0.16, z=-31.6..-30.4; cable-tray GLB loaded and occupies 100.0% of authored footprint south-cable-trench-west.
- PASS set-dressing/south-cable-trench-east: asset=cable-tray; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=8..36, y=0..0.16, z=-31.6..-30.4; rendered=x=8..36, y=0..0.16, z=-31.6..-30.4; cable-tray GLB loaded and occupies 100.0% of authored footprint south-cable-trench-east.
- PASS set-dressing/insertion-floor-power-left: asset=cable-tray; loaded=true; visible=true; grounded=true; coverage=99.0%; authored=x=-8..-1, y=0..0.18, z=-30.82..-29.78; rendered=x=-8..-1, y=0..0.18, z=-30.83..-29.77; cable-tray GLB loaded and occupies 99.0% of authored footprint insertion-floor-power-left.
- PASS set-dressing/insertion-floor-power-right: asset=cable-tray; loaded=true; visible=true; grounded=true; coverage=99.0%; authored=x=1..9, y=0..0.18, z=-28.22..-27.18; rendered=x=1..9, y=0..0.18, z=-28.23..-27.17; cable-tray GLB loaded and occupies 99.0% of authored footprint insertion-floor-power-right.
- PASS set-dressing/entry-south-machinery-west: asset=wall-machinery; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=-27..-3, y=0..0.9, z=-32.85..-31.85; rendered=x=-27..-3, y=0..0.9, z=-32.85..-31.85; wall-machinery GLB loaded and occupies 100.0% of authored footprint entry-south-machinery-west.
- PASS set-dressing/entry-south-machinery-east: asset=wall-machinery; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=3..27, y=0..0.9, z=-32.85..-31.85; rendered=x=3..27, y=0..0.9, z=-32.85..-31.85; wall-machinery GLB loaded and occupies 100.0% of authored footprint entry-south-machinery-east.
- PASS set-dressing/entry-floor-light-spine: asset=cable-tray; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=-21..21, y=0..0.18, z=-21.55..-20.45; rendered=x=-21..21, y=0..0.18, z=-21.55..-20.45; cable-tray GLB loaded and occupies 100.0% of authored footprint entry-floor-light-spine.
- PASS set-dressing/entry-foreground-decal-west: asset=cable-tray; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=-25..-7, y=0..0.16, z=-28.6..-27.4; rendered=x=-25..-7, y=0..0.16, z=-28.6..-27.4; cable-tray GLB loaded and occupies 100.0% of authored footprint entry-foreground-decal-west.
- PASS set-dressing/entry-foreground-decal-east: asset=cable-tray; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=7..25, y=0..0.16, z=-28.6..-27.4; rendered=x=7..25, y=0..0.16, z=-28.6..-27.4; cable-tray GLB loaded and occupies 100.0% of authored footprint entry-foreground-decal-east.
- PASS set-dressing/lobby-wall-machinery-west: asset=wall-machinery; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=-38..-10, y=0..1.15, z=-16.98..-15.73; rendered=x=-38..-10, y=0..1.15, z=-16.98..-15.73; wall-machinery GLB loaded and occupies 100.0% of authored footprint lobby-wall-machinery-west.
- PASS set-dressing/lobby-wall-machinery-east: asset=wall-machinery; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=10..38, y=0..1.15, z=-16.98..-15.73; rendered=x=10..38, y=0..1.15, z=-16.98..-15.73; wall-machinery GLB loaded and occupies 100.0% of authored footprint lobby-wall-machinery-east.
- PASS set-dressing/west-utility-pipe-run: asset=cable-tray; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=-39.7..-38.3, y=0..0.42, z=-28..8; rendered=x=-39.7..-38.3, y=0..0.42, z=-28..8; cable-tray GLB loaded and occupies 100.0% of authored footprint west-utility-pipe-run.
- PASS set-dressing/east-utility-pipe-run: asset=cable-tray; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=38.3..39.7, y=0..0.42, z=-26..10; rendered=x=38.3..39.7, y=0..0.42, z=-26..10; cable-tray GLB loaded and occupies 100.0% of authored footprint east-utility-pipe-run.
- PASS set-dressing/security-floor-cable-spine: asset=cable-tray; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=-17..17, y=0..0.18, z=-2.55..-1.45; rendered=x=-17..17, y=0..0.18, z=-2.55..-1.45; cable-tray GLB loaded and occupies 100.0% of authored footprint security-floor-cable-spine.
- PASS set-dressing/security-west-service-stack: asset=wall-machinery; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=-39.8..-38.6, y=0..1.05, z=-17..1; rendered=x=-39.8..-38.6, y=0..1.05, z=-17..1; wall-machinery GLB loaded and occupies 100.0% of authored footprint security-west-service-stack.
- PASS set-dressing/security-east-service-stack: asset=wall-machinery; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=38.6..39.8, y=0..1.05, z=-17..1; rendered=x=38.6..39.8, y=0..1.05, z=-17..1; wall-machinery GLB loaded and occupies 100.0% of authored footprint security-east-service-stack.
- PASS set-dressing/security-warning-floor-stripe: asset=cable-tray; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=-20..20, y=0..0.16, z=-15.7..-14.7; rendered=x=-20..20, y=0..0.16, z=-15.7..-14.7; cable-tray GLB loaded and occupies 100.0% of authored footprint security-warning-floor-stripe.
- PASS set-dressing/security-ceiling-cable-west: asset=cable-tray; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=-35..-5, y=0..0.2, z=-12.6..-11.4; rendered=x=-35..-5, y=0..0.2, z=-12.6..-11.4; cable-tray GLB loaded and occupies 100.0% of authored footprint security-ceiling-cable-west.
- PASS set-dressing/security-ceiling-cable-east: asset=cable-tray; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=5..35, y=0..0.2, z=-12.6..-11.4; rendered=x=5..35, y=0..0.2, z=-12.6..-11.4; cable-tray GLB loaded and occupies 100.0% of authored footprint security-ceiling-cable-east.
- PASS set-dressing/security-center-server-run: asset=wall-machinery; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=-17..17, y=0..0.95, z=1.25..2.75; rendered=x=-17..17, y=0..0.95, z=1.25..2.75; wall-machinery GLB loaded and occupies 100.0% of authored footprint security-center-server-run.
- PASS set-dressing/security-terminal-power-bus: asset=cable-tray; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=21..33, y=0..0.18, z=-8.6..-7.4; rendered=x=21..33, y=0..0.18, z=-8.6..-7.4; cable-tray GLB loaded and occupies 100.0% of authored footprint security-terminal-power-bus.
- PASS set-dressing/server-cable-run-west: asset=cable-tray; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=-39..-15, y=0..0.2, z=5.77..6.92; rendered=x=-39..-15, y=0..0.2, z=5.77..6.92; cable-tray GLB loaded and occupies 100.0% of authored footprint server-cable-run-west.
- PASS set-dressing/server-cable-run-east: asset=cable-tray; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=18..38, y=0..0.2, z=5.77..6.92; rendered=x=18..38, y=0..0.2, z=5.77..6.92; cable-tray GLB loaded and occupies 100.0% of authored footprint server-cable-run-east.
- PASS set-dressing/server-midfloor-power-tray: asset=cable-tray; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=-15..15, y=0..0.18, z=10.4..11.6; rendered=x=-15..15, y=0..0.18, z=10.4..11.6; cable-tray GLB loaded and occupies 100.0% of authored footprint server-midfloor-power-tray.
- PASS set-dressing/server-north-hazard-strip: asset=cable-tray; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=-15..15, y=0..0.16, z=18.3..19.3; rendered=x=-15..15, y=0..0.16, z=18.3..19.3; cable-tray GLB loaded and occupies 100.0% of authored footprint server-north-hazard-strip.
- PASS set-dressing/server-overhead-rack-west: asset=wall-machinery; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=-39..-19, y=0..0.75, z=16.75..18.05; rendered=x=-39..-19, y=0..0.75, z=16.75..18.05; wall-machinery GLB loaded and occupies 100.0% of authored footprint server-overhead-rack-west.
- PASS set-dressing/server-overhead-rack-east: asset=wall-machinery; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=19..39, y=0..0.75, z=16.75..18.05; rendered=x=19..39, y=0..0.75, z=16.75..18.05; wall-machinery GLB loaded and occupies 100.0% of authored footprint server-overhead-rack-east.
- PASS set-dressing/command-console-west: asset=wall-machinery; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=-35..-11, y=0..0.95, z=21.05..22.55; rendered=x=-35..-11, y=0..0.95, z=21.05..22.55; wall-machinery GLB loaded and occupies 100.0% of authored footprint command-console-west.
- PASS set-dressing/command-console-east: asset=wall-machinery; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=11..35, y=0..0.95, z=21.05..22.55; rendered=x=11..35, y=0..0.95, z=21.05..22.55; wall-machinery GLB loaded and occupies 100.0% of authored footprint command-console-east.
- PASS set-dressing/command-floor-guidance-west: asset=cable-tray; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=-30..-6, y=0..0.16, z=27.4..28.6; rendered=x=-30..-6, y=0..0.16, z=27.4..28.6; cable-tray GLB loaded and occupies 100.0% of authored footprint command-floor-guidance-west.
- PASS set-dressing/command-floor-guidance-east: asset=cable-tray; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=6..30, y=0..0.16, z=27.4..28.6; rendered=x=6..30, y=0..0.16, z=27.4..28.6; cable-tray GLB loaded and occupies 100.0% of authored footprint command-floor-guidance-east.
- PASS set-dressing/extraction-machinery-west: asset=extraction-beacon; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=-36..-12, y=0..0.85, z=34..36; rendered=x=-36..-12, y=0..0.85, z=34..36; extraction-beacon GLB loaded and occupies 100.0% of authored footprint extraction-machinery-west.
- PASS set-dressing/extraction-machinery-east: asset=extraction-beacon; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=12..36, y=0..0.85, z=34..36; rendered=x=12..36, y=0..0.85, z=34..36; extraction-beacon GLB loaded and occupies 100.0% of authored footprint extraction-machinery-east.
- PASS set-dressing/north-cable-spine: asset=cable-tray; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=-15..15, y=0..0.22, z=35.7..36.7; rendered=x=-15..15, y=0..0.22, z=35.7..36.7; cable-tray GLB loaded and occupies 100.0% of authored footprint north-cable-spine.
- PASS zone/entry-lobby: Entry Lobby; bounds=x=-42..42, z=-34..-18; screenshot=gameplay-level-one.png; floor=1344m2; cover=54.3m2; dressing=245.4m2; gameplay=26.41m2; total=326.11m2 (24.0%); blockers=4; setDressing=11; objectives=1; enemies=1; interactables=2; landmarks=12/12 (access-keycard, lobby-door, insertion-route-cover, insertion-cover-right, insertion-floor-power-left, insertion-floor-power-right, cargo-stack-a, cargo-stack-b, sentry-lobby, entry-floor-light-spine, entry-south-machinery-west, entry-south-machinery-east). Entry Lobby has 24.3% tactical footprint coverage with 12/12 expected landmark(s) present.
- PASS zone/security-stack: Security Stack; bounds=x=-42..42, z=-18..5; screenshot=tutorial-03-terminal.png; floor=1932m2; cover=24m2; dressing=392.4m2; gameplay=9.62m2; total=426.02m2 (22.0%); blockers=2; setDressing=12; objectives=1; enemies=0; interactables=3; landmarks=8/8 (security-terminal, antenna-bank, security-stack-cover-left, security-floor-cable-spine, server-door, security-west-service-stack, security-east-service-stack, security-warning-floor-stripe). Security Stack has 22.1% tactical footprint coverage with 8/8 expected landmark(s) present.
- PASS zone/server-wing: Server Wing; bounds=x=-42..42, z=5..20; screenshot=gameplay-command-codes.png; floor=1260m2; cover=80m2; dressing=179.8m2; gameplay=25.64m2; total=285.44m2 (23.0%); blockers=2; setDressing=8; objectives=1; enemies=1; interactables=3; landmarks=6/6 (command-codes, server-bank-a, server-bank-b, sentry-server, server-midfloor-power-tray, server-north-hazard-strip). Server Wing has 22.7% tactical footprint coverage with 6/6 expected landmark(s) present.
- PASS zone/command-extraction: Command And Extraction; bounds=x=-42..42, z=20..38; screenshot=complete.png; floor=1512m2; cover=33m2; dressing=255.6m2; gameplay=36.98m2; total=325.58m2 (22.0%); blockers=1; setDressing=7; objectives=0; enemies=1; interactables=2; landmarks=7/7 (extraction, briefing-table, extraction-machinery-west, extraction-machinery-east, sentry-command, command-floor-guidance-west, command-floor-guidance-east). Command And Extraction has 21.5% tactical footprint coverage with 7/7 expected landmark(s) present.
- PASS level-density: floor=6048m2; dressing=1343.67m2; ratio=22.0%; blockers=9; setDressing=34; objectives=3; enemies=3. Set-dressing and gameplay footprints cover 22.2% of the level floor across 4 named zone(s).

## FPS Scene Matrix

- BASELINE browser: 55.9 FPS; median=17.9 ms; p95=18.1 ms; samples=240
- ENVIRONMENT-LIMITED fps/title: label="Title hero and menu"; phase=title; screenshot=docs/qa/2026-06-20/v0.25.2/fps/fps-title.png; frame=56.2 FPS / 17.8 ms median / 18.3 ms p95; strict=false; tracksBaseline=true; overhead=-0.1 ms median/0.2 ms p95; audio=title; renderer=13 calls/96527 tris/7 textures/pixelRatio=0.75; budget=pass; headroom=747 calls/323473 tris/27 tex. titleHero=facingDot=0.99; screenHeight=44.0%; occupancy=10.0%
- ENVIRONMENT-LIMITED fps/gameplay: label="Active gameplay camera"; phase=playing; screenshot=docs/qa/2026-06-20/v0.25.2/fps/fps-gameplay.png; frame=56.2 FPS / 17.8 ms median / 18.1 ms p95; strict=false; tracksBaseline=true; overhead=-0.1 ms median/0.0 ms p95; audio=gameplay; renderer=676 calls/296698 tris/21 textures/pixelRatio=0.75; budget=pass; headroom=84 calls/123302 tris/13 tex.
- ENVIRONMENT-LIMITED fps/complete: label="Mission complete screen"; phase=complete; screenshot=docs/qa/2026-06-20/v0.25.2/fps/fps-complete.png; frame=56.5 FPS / 17.7 ms median / 18.2 ms p95; strict=false; tracksBaseline=true; overhead=-0.2 ms median/0.1 ms p95; audio=complete; renderer=674 calls/208128 tris/22 textures/pixelRatio=0.75; budget=pass; headroom=86 calls/211872 tris/12 tex.
- ENVIRONMENT-LIMITED fps/caught: label="Sentry caught failure screen"; phase=caught; screenshot=docs/qa/2026-06-20/v0.25.2/fps/fps-caught.png; frame=56.2 FPS / 17.8 ms median / 18.1 ms p95; strict=false; tracksBaseline=true; overhead=-0.1 ms median/0.0 ms p95; audio=gameplay; renderer=693 calls/374837 tris/26 textures/pixelRatio=0.75; budget=pass; headroom=67 calls/45163 tris/8 tex.

## Render Budget QA

- PASS render-budget/active: pass; profile=performance; calls=676/760; triangles=296698/420000; geometries=102/130; textures=21/34; pixelRatio=0.75/0.75; shadows=false/false; headroom=84 calls, 123302 triangles, 28 geometries, 13 textures, 0 pixel ratio. performance profile render counters are inside the explicit 60 FPS path budget.
- PASS render-budget/title: pass; profile=performance; calls=13/760; triangles=96527/420000; geometries=11/130; textures=7/34; pixelRatio=0.75/0.75; shadows=false/false; screenshot=docs/qa/2026-06-20/v0.25.2/fps/fps-title.png; headroom=747 calls, 323473 triangles, 119 geometries, 27 textures, 0 pixel ratio.
- PASS render-budget/gameplay: pass; profile=performance; calls=676/760; triangles=296698/420000; geometries=102/130; textures=21/34; pixelRatio=0.75/0.75; shadows=false/false; screenshot=docs/qa/2026-06-20/v0.25.2/fps/fps-gameplay.png; headroom=84 calls, 123302 triangles, 28 geometries, 13 textures, 0 pixel ratio.
- PASS render-budget/complete: pass; profile=performance; calls=674/760; triangles=208128/420000; geometries=101/130; textures=22/34; pixelRatio=0.75/0.75; shadows=false/false; screenshot=docs/qa/2026-06-20/v0.25.2/fps/fps-complete.png; headroom=86 calls, 211872 triangles, 29 geometries, 12 textures, 0 pixel ratio.
- PASS render-budget/caught: pass; profile=performance; calls=693/760; triangles=374837/420000; geometries=113/130; textures=26/34; pixelRatio=0.75/0.75; shadows=false/false; screenshot=docs/qa/2026-06-20/v0.25.2/fps/fps-caught.png; headroom=67 calls, 45163 triangles, 17 geometries, 8 textures, 0 pixel ratio.

## Tutorial Alignment QA

- PASS tutorial/hero: screenshot=tutorial-01-insertion.png; title="Insertion"; target=hero (hero); targetPoint=0,-29; focusPoint=0,-29; focusDistance=0; cameraDistance=10.24; cadet=true; keywords=cadet, shadow recruit, move quietly. Tutorial step hero targets hero, uses required callout terms, and ends with Good luck, cadet.
- PASS tutorial/keycard: screenshot=tutorial-02-keycard.png; title="First Lock"; target=access-keycard (objective); targetPoint=-31,-25; focusPoint=-31,-25; focusDistance=0; cameraDistance=10.24; cadet=true; keywords=objective, keycard, door. Tutorial step keycard targets access-keycard, uses required callout terms, and ends with Good luck, cadet.
- PASS tutorial/terminal: screenshot=tutorial-03-terminal.png; title="Security Stack"; target=security-terminal (objective); targetPoint=30,-3; focusPoint=30,-3; focusDistance=0; cameraDistance=10.24; cadet=true; keywords=terminal, server-wing door, interact. Tutorial step terminal targets security-terminal, uses required callout terms, and ends with Good luck, cadet.
- PASS tutorial/sentry: screenshot=tutorial-04-sentry.png; title="Avoid Contact"; target=sentry-lobby (enemy); targetPoint=16,-25; focusPoint=16,-25; focusDistance=0; cameraDistance=10.24; cadet=true; keywords=avoid sentries, cover, patrol. Tutorial step sentry targets sentry-lobby, uses required callout terms, and ends with Good luck, cadet.
- PASS tutorial/extraction: screenshot=tutorial-05-extraction.png; title="Extraction"; target=extraction (extraction); targetPoint=0,33; focusPoint=0,33; focusDistance=0; cameraDistance=10.2; cadet=true; keywords=command codes, final door, extraction. Tutorial step extraction targets extraction, uses required callout terms, and ends with Good luck, cadet.

## Title Identity QA

- PASS title-identity: identityReadable=true; anchors=head:readable, visor:readable, chest:readable, feet:readable.
- PASS title-anchor/head: Head silhouette; source=bounds-estimate; world=(2.6,1.79,-18); screen=(720,349.76) visible=true; uiOccluded=false. Head silhouette projects into the title screenshot without UI occlusion.
- PASS title-anchor/visor: Face/visor read; source=bounds-estimate; world=(2.6,1.64,-18); screen=(720,373.82) visible=true; uiOccluded=false. Face/visor read projects into the title screenshot without UI occlusion.
- PASS title-anchor/chest: Chest/gear read; source=bounds-estimate; world=(2.6,1.17,-18); screen=(720,443.3) visible=true; uiOccluded=false. Chest/gear read projects into the title screenshot without UI occlusion.
- PASS title-anchor/feet: Foot grounding; source=bounds-estimate; world=(2.6,0.11,-18); screen=(720,586.22) visible=true; uiOccluded=false. Foot grounding projects into the title screenshot without UI occlusion.

## Gameplay Camera QA

- PASS gameplay-camera: active=true; readable=true; cameraDistance=6.23; target=(-24,1.15,-25); camera=(-20.85,3.85,-29.65); screenHeight=29.0%; screenOccupancy=4.0%; screenBounds=x=616.53..822.12, y=375.93..633.73, viewport=1440x900, width=14.0%, height=29.0%, area=4.0%. Gameplay camera keeps the player close enough to read the hero, nearby floor texture, cover, doors, and objectives.

## Active Gameplay View Density QA

- PASS gameplay-view-density: active=true; screenshot=gameplay-level-one.png; camera=(-20.85,3.85,-29.65); player=(-24,-25). Active gameplay camera has measurable foreground, midground, and background tactical detail instead of relying on whole-level density averages.
- PASS gameplay-view/near: near foreground; distance=0..8m; visible=2/2; categories=2/2; occupancy=21.0% target=1.5%; negativeSpace=21.0% max=38.0%; objects=cargo-stack-a[cover] d=3.07m area=20.0% bounds=x=677.18..1329.97, y=272.08..669.18, viewport=1440x900, width=45.0%, height=44.0%, area=20.0%; access-keycard[objective] d=7.01m area=1.0% bounds=x=1171.63..1261.5, y=310.13..408.07, viewport=1440x900, width=6.0%, height=11.0%, area=1.0%. near foreground has 2 visible tactical object(s), 2 category/categories, 21.0% tactical screen occupancy, and controlled negative-space risk of 21.0% from the active gameplay camera.
- PASS gameplay-view/mid: midground objective route; distance=8..18m; visible=4/2; categories=2/2; occupancy=94.0% target=0.6%; negativeSpace=0.0% max=50.0%; objects=lobby-wall-machinery-west[set-dressing] d=8.66m area=42.0% bounds=x=0..1037.62, y=162.46..689, viewport=1440x900, width=72.0%, height=59.0%, area=42.0%; security-ceiling-cable-west[set-dressing] d=13.6m area=26.0% bounds=x=0..806.73, y=191.07..613.36, viewport=1440x900, width=56.0%, height=47.0%, area=26.0%; entry-foreground-decal-west[set-dressing] d=8.54m area=24.0% bounds=x=1065.15..1440, y=0..846.15, viewport=1440x900, width=26.0%, height=94.0%, area=24.0%; security-stack-cover-left[cover] d=11.02m area=2.0% bounds=x=258.59..449.48, y=197.61..302.44, viewport=1440x900, width=13.0%, height=12.0%, area=2.0%. midground objective route has 4 visible tactical object(s), 2 category/categories, 94.0% tactical screen occupancy, and controlled negative-space risk of 0.0% from the active gameplay camera.
- PASS gameplay-view/far: far background landmark; distance=18..34m; visible=5/1; categories=2/1; occupancy=61.0% target=0.2%; negativeSpace=0.0% max=62.0%; objects=security-warning-floor-stripe[set-dressing] d=25.92m area=37.0% bounds=x=82.53..1440, y=0..351.47, viewport=1440x900, width=94.0%, height=39.0%, area=37.0%; west-utility-pipe-run[set-dressing] d=21.21m area=16.0% bounds=x=569.88..1440, y=118.56..349.52, viewport=1440x900, width=60.0%, height=26.0%, area=16.0%; security-west-service-stack[set-dressing] d=22.81m area=3.0% bounds=x=654.77..1087.22, y=114.22..218.34, viewport=1440x900, width=30.0%, height=12.0%, area=3.0%; server-cable-run-west[set-dressing] d=31.49m area=3.0% bounds=x=0..607.73, y=126.45..181.3, viewport=1440x900, width=42.0%, height=6.0%, area=3.0%; antenna-bank[cover] d=21.11m area=2.0% bounds=x=209.12..459.87, y=115.58..208.3, viewport=1440x900, width=17.0%, height=10.0%, area=2.0%. far background landmark has 5 visible tactical object(s), 2 category/categories, 61.0% tactical screen occupancy, and controlled negative-space risk of 0.0% from the active gameplay camera.

## Mission Guidance QA

- PASS mission-guidance: target=access-keycard; kind=objective; label="Recover the lobby keycard"; action="Recover objective"; distance=7m; bearing=270; direction=W; targetPoint=-31,-25; unlocks=lobby-door; progress=0/3; exitUnlocked=false. Guidance targets the next required objective access-keycard.

## Operative Trait QA

- PASS operative-selected: selected=echo-vanguard; asset=hero:echo-vanguard; traits=echo-dampeners, armored-step, long-reach-interface
- PASS operative-scalars/echo-vanguard: base=moveSpeed:8.2, interactRadius:1.62, enemyDetectionRadius:2.4, terminalUseMs:1200, extractionRadius:2.7; effective=moveSpeed:7.54, interactRadius:1.77, enemyDetectionRadius:2.11, terminalUseMs:1200, extractionRadius:2.7; changed=moveSpeed, interactRadius, enemyDetectionRadius
- PASS trait/echo-dampeners: mechanic=stealth; scalar=enemyDetectionRadius; 2.4->2.11; delta=-0.29
- PASS trait/armored-step: mechanic=movement; scalar=moveSpeed; 8.2->7.54; delta=-0.66
- PASS trait/long-reach-interface: mechanic=interaction; scalar=interactRadius; 1.62->1.77; delta=0.15
- PASS trait-probe/echo-vanguard:echo-dampeners: trait=echo-dampeners; mechanic=stealth; expectedDelta=-0.29; actualDelta=-0.29; tolerance=0.01
- PASS trait-probe/echo-vanguard:armored-step: trait=armored-step; mechanic=movement; expectedDelta=-0.66; actualDelta=-0.66; tolerance=0.01
- PASS trait-probe/echo-vanguard:long-reach-interface: trait=long-reach-interface; mechanic=interaction; expectedDelta=0.15; actualDelta=0.15; tolerance=0.01
- PASS operative-catalog/shadow-operative: asset=hero:shadow-operative; traits=balanced-kit; changed=baseline
- PASS operative-catalog/echo-vanguard: asset=hero:echo-vanguard; traits=echo-dampeners, armored-step, long-reach-interface; changed=moveSpeed, interactRadius, enemyDetectionRadius
- PASS operative-catalog/signal-warden: asset=hero:signal-warden; traits=overclocked-servos, signal-bleed; changed=moveSpeed, enemyDetectionRadius
- PASS operative-catalog/circuit-nomad: asset=hero:circuit-nomad; traits=adaptive-interface, exfil-beacon-link, hotwire-stack; changed=interactRadius, terminalUseMs, extractionRadius

## Mission Catalog QA

- PASS mission-selected: selected=blacksite-threshold; label=Blacksite Threshold; brief="OPERATION GLASS DAGGER\nBlacksite Threshold\n3 required objectives, 3 sentries, 3 sliding doors, 4 mission sectors."
- PASS mission/blacksite-threshold: Operation Glass Dagger / Blacksite Threshold; objectives=3; enemies=3
- PASS mission/relay-vault: Operation Night Compass / Relay Vault; objectives=3; enemies=3

## Mission Readiness Matrix

- Mission readiness build=v0.25.2; 2/2 pass; 0 review; 0 fail; densityTargets=level 18.0%, zone 20.0%; wallRunEpsilon=0.08m
- PASS mission-ready/blacksite-threshold: catalogKnown=true; size=84x72m; objectives=3; doors=3; enemies=3; zones=4; setDressing=34; density=pass:22.5%; wallRuns=3/3; playthrough=pass:pass; screenshots=6; route=pass; unlocks=pass; findings=0
- PASS mission-zone/blacksite-threshold/entry-lobby: Entry Lobby; footprint=24.3%; landmarks=12/12; interactables=2; screenshot=gameplay-level-one.png; findings=none
- PASS mission-zone/blacksite-threshold/security-stack: Security Stack; footprint=22.1%; landmarks=8/8; interactables=3; screenshot=tutorial-03-terminal.png; findings=none
- PASS mission-zone/blacksite-threshold/server-wing: Server Wing; footprint=22.7%; landmarks=6/6; interactables=3; screenshot=gameplay-command-codes.png; findings=none
- PASS mission-zone/blacksite-threshold/command-extraction: Command And Extraction; footprint=21.5%; landmarks=7/7; interactables=2; screenshot=complete.png; findings=none
- PASS mission-wall-run/blacksite-threshold/x:-18: doors=lobby-door; walls=lobby-divider-west, lobby-divider-east; gaps=none; spans=no adjacent door pairs
- PASS mission-wall-run/blacksite-threshold/x:5: doors=server-door; walls=server-divider-west, server-divider-east; gaps=none; spans=no adjacent door pairs
- PASS mission-wall-run/blacksite-threshold/x:20: doors=extraction-door; walls=command-divider-west, command-divider-east; gaps=none; spans=no adjacent door pairs
- PASS mission-ready/relay-vault: catalogKnown=true; size=96x84m; objectives=3; doors=3; enemies=3; zones=3; setDressing=28; density=pass:21.7%; wallRuns=3/3; playthrough=pass:pass; screenshots=6; route=pass; unlocks=pass; findings=0
- PASS mission-zone/relay-vault/south-entry: South Entry; footprint=21.9%; landmarks=8/8; interactables=2; screenshot=gameplay-level-one.png; findings=none
- PASS mission-zone/relay-vault/mid-security: Mid Security; footprint=20.6%; landmarks=7/7; interactables=3; screenshot=tutorial-03-terminal.png; findings=none
- PASS mission-zone/relay-vault/north-command: North Command And Extraction; footprint=22.6%; landmarks=8/8; interactables=4; screenshot=complete.png; findings=none
- PASS mission-wall-run/relay-vault/x:-14: doors=entry-door; walls=entry-divider-west, entry-divider-east; gaps=none; spans=no adjacent door pairs
- PASS mission-wall-run/relay-vault/x:14: doors=vault-door; walls=vault-divider-west, vault-divider-east; gaps=none; spans=no adjacent door pairs
- PASS mission-wall-run/relay-vault/x:28: doors=extraction-door; walls=extraction-divider-west, extraction-divider-east; gaps=none; spans=no adjacent door pairs

## Browser Playthrough Matrix

- Matrix build=v0.25.2; generatedAt=2026-06-20T17:37:18.268Z; 2/2 mission browser playthroughs passed
- PASS playthrough/blacksite-threshold: status=pass; source=artifacts\playthrough\v0.25.2\playthrough-report.json; committed=docs/qa/2026-06-20/v0.25.2/playthroughs/blacksite-threshold/playthrough-report.json; screenshots=6; missingScreenshots=0; catalogKnown=true
- PASS playthrough/relay-vault: status=pass; source=artifacts\playthrough\v0.25.2\relay-vault\playthrough-report.json; committed=docs/qa/2026-06-20/v0.25.2/playthroughs/relay-vault/playthrough-report.json; screenshots=6; missingScreenshots=0; catalogKnown=true

## Wall-Run Interval QA

- PASS wall-run/x:-18: axis=x; line=-18; intervals=lobby-divider-west[wall] -41m..-3m; lobby-door:frame[door-frame] -3.32m..3.32m; lobby-door:wall-continuity[door-continuity] -3.29m..3.29m; lobby-door[door-opening] -3m..3m; lobby-divider-east[wall] 3m..41m; connections=lobby-divider-west->lobby-door:frame:covered-by-priority-surface owner=lobby-door:frame; lobby-door:frame->lobby-door:wall-continuity:covered-by-priority-surface owner=lobby-door:frame; lobby-door:wall-continuity->lobby-door:covered-by-priority-surface owner=lobby-door:wall-continuity; lobby-door->lobby-divider-east:touches; ownership=no adjacent door pairs on this wall line; probes=lobby-door:active-camera-probe:pass expected=lobby-door/lobby-door:frame/lobby-door:wall-continuity hit=lobby-door:wall-continuity void=false screen=x=329.52..347.52, y=128.89..146.89, viewport=1280x720, width=1.0%, height=3.0%, area=0.0%; gaps=no unowned spans above 0.08m
- PASS wall-run/x:5: axis=x; line=5; intervals=server-divider-west[wall] -41m..11m; server-door:frame[door-frame] 10.68m..17.32m; server-door:wall-continuity[door-continuity] 10.71m..17.29m; server-door[door-opening] 11m..17m; server-divider-east[wall] 17m..30m; connections=server-divider-west->server-door:frame:covered-by-priority-surface owner=server-door:frame; server-door:frame->server-door:wall-continuity:covered-by-priority-surface owner=server-door:frame; server-door:wall-continuity->server-door:covered-by-priority-surface owner=server-door:wall-continuity; server-door->server-divider-east:touches; ownership=no adjacent door pairs on this wall line; probes=server-door:active-camera-probe:review expected=server-door/server-door:frame/server-door:wall-continuity hit=lobby-divider-east void=false screen=x=0..9, y=82.98..100.98, viewport=1280x720, width=1.0%, height=3.0%, area=0.0%; gaps=no unowned spans above 0.08m
- PASS wall-run/x:20: axis=x; line=20; intervals=command-divider-west[wall] -41m..-3m; extraction-door:frame[door-frame] -3.32m..3.32m; extraction-door:wall-continuity[door-continuity] -3.29m..3.29m; extraction-door[door-opening] -3m..3m; command-divider-east[wall] 3m..41m; connections=command-divider-west->extraction-door:frame:covered-by-priority-surface owner=extraction-door:frame; extraction-door:frame->extraction-door:wall-continuity:covered-by-priority-surface owner=extraction-door:frame; extraction-door:wall-continuity->extraction-door:covered-by-priority-surface owner=extraction-door:wall-continuity; extraction-door->command-divider-east:touches; ownership=no adjacent door pairs on this wall line; probes=extraction-door:active-camera-probe:review expected=extraction-door/extraction-door:frame/extraction-door:wall-continuity hit=lobby-door:wall-continuity void=false screen=x=183.89..201.89, y=55.29..73.29, viewport=1280x720, width=1.0%, height=3.0%, area=0.0%; gaps=no unowned spans above 0.08m

## Asset Grading

- PASS level-mesh/level-floor: Floor mesh; visible=true; grounded=true. pos=(0,0,0); y=0..0; h=0; xz=84x72 Floor mesh covers the authored level bounds with a generated tactical floor-panel image texture. Floor uses src/assets/generated/tactical-floor-panel.png as a repeated runtime texture.
- PASS level-mesh/level-walls: Wall meshes; visible=true; grounded=true. 12 wall meshes are present and use src/assets/generated/blacksite-wall-panel.png as the repeated generated wall texture.
- PASS door/sliding-doors: Sliding door panels; visible=true; grounded=true. 3 sliding door assemblies are present and use the generated door-panel texture.
- PASS door/door-wall-seams: Door-wall seams; visible=true; grounded=true. 3 sliding-door openings have door frames plus wall/portal continuity meshes behind the door layer, so the door panels visually take priority without reading as missing wall gaps.
- PASS blocker/level-blocker-cover: Blocker cover GLB visuals; visible=true; grounded=true. 9 authored blocker collision proxies are represented by fitted cover-barricade GLB visuals with no primitive stand-ins.
- PASS blocker/insertion-route-cover: insertion-route-cover cover module; visible=true; grounded=true. pos=(0,0,0); y=0..1.1; h=1.1; xz=2.15x0.95 Required cover-barricade GLB is visible, grounded, and fitted to the authored blocker collision proxy. Collision remains authored from the level blocker rectangle; runtime visual must not be a primitive fallback.
- PASS blocker/insertion-cover-right: insertion-cover-right cover module; visible=true; grounded=true. pos=(0,0,0); y=0..1.25; h=1.25; xz=3.1x2.04 Required cover-barricade GLB is visible, grounded, and fitted to the authored blocker collision proxy. Collision remains authored from the level blocker rectangle; runtime visual must not be a primitive fallback.
- PASS blocker/cargo-stack-a: cargo-stack-a cover module; visible=true; grounded=true. pos=(0,0,0); y=0..1.35; h=1.35; xz=4.65x3.36 Required cover-barricade GLB is visible, grounded, and fitted to the authored blocker collision proxy. Collision remains authored from the level blocker rectangle; runtime visual must not be a primitive fallback.
- PASS blocker/cargo-stack-b: cargo-stack-b cover module; visible=true; grounded=true. pos=(0,0,0); y=0..1.35; h=1.35; xz=4.65x3.36 Required cover-barricade GLB is visible, grounded, and fitted to the authored blocker collision proxy. Collision remains authored from the level blocker rectangle; runtime visual must not be a primitive fallback.
- PASS blocker/antenna-bank: antenna-bank cover module; visible=true; grounded=true. pos=(0,0,0); y=0..1.75; h=1.75; xz=5.58x2.04 Required cover-barricade GLB is visible, grounded, and fitted to the authored blocker collision proxy. Collision remains authored from the level blocker rectangle; runtime visual must not be a primitive fallback.
- PASS blocker/security-stack-cover-left: security-stack-cover-left cover module; visible=true; grounded=true. pos=(0,0,0); y=0..1.2; h=1.2; xz=2.58x1.36 Required cover-barricade GLB is visible, grounded, and fitted to the authored blocker collision proxy. Collision remains authored from the level blocker rectangle; runtime visual must not be a primitive fallback.
- PASS blocker/server-bank-a: server-bank-a cover module; visible=true; grounded=true. pos=(0,0,0); y=0..1.9; h=1.9; xz=4.65x6.72 Required cover-barricade GLB is visible, grounded, and fitted to the authored blocker collision proxy. Collision remains authored from the level blocker rectangle; runtime visual must not be a primitive fallback.
- PASS blocker/server-bank-b: server-bank-b cover module; visible=true; grounded=true. pos=(0,0,0); y=0..1.9; h=1.9; xz=4.65x6.72 Required cover-barricade GLB is visible, grounded, and fitted to the authored blocker collision proxy. Collision remains authored from the level blocker rectangle; runtime visual must not be a primitive fallback.
- PASS blocker/briefing-table: briefing-table cover module; visible=true; grounded=true. pos=(0,0,0); y=0..1; h=1; xz=10.49x2.04 Required cover-barricade GLB is visible, grounded, and fitted to the authored blocker collision proxy. Collision remains authored from the level blocker rectangle; runtime visual must not be a primitive fallback.
- PASS set-dressing/level-set-dressing: Tactical set dressing; visible=true; grounded=true. 34 coordinate-authored non-colliding dressing placements have loaded GLB assets, visible runtime bounds, floor contact, and coordinate footprint coverage without blocking the validation route.
- PASS objective/access-keycard: Recover the lobby keycard; visible=true; grounded=true. pos=(-31,0,-25); y=0..0.9; h=0.9; xz=1.49x0.02 keycard GLB is visible, grounded, and available for interaction.
- PASS objective/security-terminal: Hack the security terminal; visible=true; grounded=true. pos=(30,0,-3); y=0..1.55; h=1.55; xz=1.16x2.45 terminal GLB is visible, grounded, and available for interaction.
- PASS objective/command-codes: Copy the command codes; visible=true; grounded=true. pos=(-32,0,14); y=0..1; h=1; xz=1.81x1.28 codes GLB is visible, grounded, and available for interaction.
- PASS enemy/sentry-lobby: Lobby sentry; visible=true; grounded=true. pos=(5.82,0,-24.15); y=0.02..1.57; h=1.55; xz=1.58x1.58 Sentry GLB is visible above the floor and aligned to its patrol route.
- PASS enemy/sentry-server: Server sentry; visible=true; grounded=true. pos=(27,0,14.08); y=0.02..1.57; h=1.55; xz=1.75x1.75 Sentry GLB is visible above the floor and aligned to its patrol route.
- PASS enemy/sentry-command: Command sentry; visible=true; grounded=true. pos=(-4.27,0,25); y=0.02..1.57; h=1.55; xz=1.46x1.46 Sentry GLB is visible above the floor and aligned to its patrol route.
- PASS hero/hero: Playable hero; visible=true; grounded=true. pos=(0,0,-29); y=0.02..1.47; h=1.45; xz=1.17x0.79 Hero GLB is visible and grounded at the current player position.
- PASS extraction/extraction: Extraction point; visible=true; grounded=true. pos=(0,0.08,33); y=0..0.16; h=0.15; xz=4.96x4.96 Extraction marker is visible and readable as the level-completion target.

## Runtime Asset Provenance

- PASS hero/hero:shadow-operative: Shadow Operative; requirement=required; source=sneak-game-seed; format=glb; loaded=true; failed=false; fallbackVisible=false; policy=required-error; path=src/assets/hero/Meshy_AI_a_small_tactical_chib_biped/Meshy_AI_a_small_tactical_chib_biped_Animation_Idle_3_withSkin.glb; src/assets/hero/Meshy_AI_a_small_tactical_chib_biped/Meshy_AI_a_small_tactical_chib_biped_Animation_Run_02_withSkin.glb. Hash-matched against the local Shadow Circuit seed asset during the v0.13.4 provenance audit. Shadow Operative uses separate idle and run GLBs with runtime clip mapping through AnimationMixer. Required playable character model; QA must fail missing or unreadable runtime geometry. Loaded through the runtime GLTFLoader asset path. No visible primitive or placeholder fallback is reported for this asset ID.
- PASS enemy/sentry: Enemy sentry; requirement=required; source=sneak-game-seed; format=glb; loaded=true; failed=false; fallbackVisible=false; policy=required-error; path=src/assets/characters/sentry/enemy_sentry.glb. Hash-matched against the local Shadow Circuit sentry seed asset during the v0.13.4 provenance audit. Required enemy model; QA must fail load or grounding issues instead of accepting primitive stand-ins. Loaded through the runtime GLTFLoader asset path. No visible primitive or placeholder fallback is reported for this asset ID.
- PASS objective/keycard: Access keycard objective; requirement=required; source=sneak-game-seed; format=glb; loaded=true; failed=false; fallbackVisible=false; policy=required-error; path=src/assets/objectives/keycard-cinematic.glb. Hash-matched against the local Shadow Circuit keycard seed asset during the v0.13.4 provenance audit. Required objective model; QA must fail missing or unreadable runtime geometry. Loaded through the runtime GLTFLoader asset path. No visible primitive or placeholder fallback is reported for this asset ID.
- PASS objective/terminal: Security terminal objective; requirement=required; source=sneak-game-seed; format=glb; loaded=true; failed=false; fallbackVisible=false; policy=required-error; path=src/assets/objectives/terminal-cinematic.glb. Hash-matched against the local Shadow Circuit terminal seed asset during the v0.13.4 provenance audit. Required objective model; QA must fail missing or unreadable runtime geometry. Loaded through the runtime GLTFLoader asset path. No visible primitive or placeholder fallback is reported for this asset ID.
- PASS objective/codes: Command codes objective; requirement=required; source=repo-generated-glb; format=glb; loaded=true; failed=false; fallbackVisible=false; policy=required-error; path=src/assets/objectives/command-codes-cinematic.glb. Repo-generated cinematic command-codes GLB. Required objective model; QA must fail missing or unreadable runtime geometry. Loaded through the runtime GLTFLoader asset path. No visible primitive or placeholder fallback is reported for this asset ID.
- PASS cover/cover-barricade: Tactical cover barricade kit; requirement=required; source=repo-generated-glb; format=glb; loaded=true; failed=false; fallbackVisible=false; policy=required-error; path=src/assets/environment/cover-barricade-kit.glb. Repo-generated modular GLB kit for Level 1 blocker and cover visuals. Gameplay collision remains authored in level blocker proxies; QA must fail if primitive blocker stand-ins are visible. Loaded through the runtime GLTFLoader asset path. No visible primitive or placeholder fallback is reported for this asset ID.
- PASS set-dressing/cable-tray: Cable tray dressing kit; requirement=optional; source=repo-generated-glb; format=glb; loaded=true; failed=false; fallbackVisible=false; policy=optional-omit; path=src/assets/environment/cable-tray-kit.glb. Repo-generated modular GLB kit for tactical cable and floor dressing. Loaded through the runtime GLTFLoader asset path. No visible primitive or placeholder fallback is reported for this asset ID.
- PASS set-dressing/extraction-beacon: Extraction beacon dressing kit; requirement=optional; source=repo-generated-glb; format=glb; loaded=true; failed=false; fallbackVisible=false; policy=optional-omit; path=src/assets/environment/extraction-beacon-kit.glb. Repo-generated modular GLB kit for extraction staging and green beacon readability. Loaded through the runtime GLTFLoader asset path. No visible primitive or placeholder fallback is reported for this asset ID.
- PASS set-dressing/wall-machinery: Wall machinery dressing kit; requirement=optional; source=repo-generated-glb; format=glb; loaded=true; failed=false; fallbackVisible=false; policy=optional-omit; path=src/assets/environment/wall-machinery-kit.glb. Repo-generated modular GLB kit for machinery, vents, and wall silhouette breaks. Loaded through the runtime GLTFLoader asset path. No visible primitive or placeholder fallback is reported for this asset ID.

## Failure And Retry QA

- PASS caught-state: enemy=sentry-lobby; pos=(15.476813476921437,-24.956401123076795); radius=2.45; phase=caught; alerts=1; player=(15.476813476921437,-24.956401123076795); sentryAssetLoaded=true; enemyQualityPasses=3; panel="OPERATION FAILED Sentry contact You were too close to a sentry. Reset the mission and use cover timing. Retry Title"; doors=lobby-door:closed:0, server-door:closed:0, extraction-door:closed:0
- PASS retry-reset: phase=tutorial; alerts=0; startDistance=0; objectives=0/3; exitUnlocked=false; audio=active=gameplay; muted=false; unlocked=true; loadingHistory=4; doors=lobby-door:closed:0, server-door:closed:0, extraction-door:closed:0
- PASS failure-route-console: pageErrors=0; consoleIssues=0
- PASS failure-route-screenshots: artifacts/failure-retry/v0.25.2/01-sentry-contact.png, artifacts/failure-retry/v0.25.2/02-retry-loading.png, artifacts/failure-retry/v0.25.2/03-retry-tutorial-reset.png

## Screenshot Coverage

- PASS screenshot/title.png: captured (682.9 KB)
- PASS screenshot/settings.png: captured (471.6 KB)
- PASS screenshot/hero-select.png: captured (583.6 KB)
- PASS screenshot/loading-level-one.png: captured (514.9 KB)
- PASS screenshot/tutorial-01-insertion.png: captured (782.0 KB)
- PASS screenshot/tutorial-02-keycard.png: captured (684.9 KB)
- PASS screenshot/tutorial-03-terminal.png: captured (794.5 KB)
- PASS screenshot/tutorial-04-sentry.png: captured (808.0 KB)
- PASS screenshot/tutorial-05-extraction.png: captured (722.2 KB)
- PASS screenshot/gameplay-level-one.png: captured (648.6 KB)
- PASS screenshot/focus-lobby-door.png: captured (735.7 KB)
- PASS screenshot/focus-server-door.png: captured (674.3 KB)
- PASS screenshot/gameplay-command-codes.png: captured (610.2 KB)
- PASS screenshot/focus-extraction-door.png: captured (732.5 KB)
- PASS screenshot/complete.png: captured (585.6 KB)
- PASS screenshot/caught-sentry.png: captured (619.7 KB)
- PASS screenshot/retry-loading.png: captured (782.8 KB)
- PASS screenshot/retry-tutorial-reset.png: captured (782.8 KB)

## Tester Feedback

- Title flow: verify the native title treatment, cinematic scene, staged hero model, hero-select preview space, Start, Change Hero, and Settings are visible.
- Mission catalog: verify the player-facing mission selector is visible before mission start, reflects the active level, and exposes objective/enemy counts for future big levels.
- Tutorial: verify all five General Caldwell screenshots align with hero, keycard, terminal, sentry, and extraction targets, and every step ends with "Good luck, cadet."
- Level: verify keycard, terminal, command codes, sentries, extraction, wall/floor meshes, wall/floor texture quality, and all three door-focus screenshots are readable and properly grounded.
- Playthrough: verify the browser route uses the authored validation route, keyboard interaction, door-focus pauses, and extraction completion without sentry contact.
- Failure/retry: verify intentional sentry contact shows the operation-failed overlay, increments alerts, keeps the sentry GLB proven, and Retry returns to a clean mission start without carrying objectives, open doors, or alert count forward.
- Coordinate QA: verify door/wall continuity by edge coordinates, not screenshot impression alone. Wall gaps must name door ID, wall IDs, frame/continuity bounds, and measured gap widths.
- Screenshot-to-coordinate QA: verify any wallop, visible door-to-door hole, or odd wall patch is resolved to nearest adjacent door IDs, shared wall-line ID, between-door span, owner surface, projected coverage, and first-hit probe before approval.
- Camera QA: verify the normal gameplay screenshot is captured before objective interaction, with debug teleports snapping the closer gameplay camera to the current player position, proving player screen occupancy, and proving active-camera near/mid/far tactical density.
- Title and AAA design QA: verify the title hero faces or reads toward the player with projected face/visor/chest evidence, and verify large rooms contain player-camera AAA detail rather than broad empty floor and repeated walls.
- Guidance QA: verify the active HUD names the next required objective or extraction, exposes a distance and compass direction, and updates after each objective handoff.
- Asset QA: verify objective GLBs, sentry GLBs, cover/blocker GLBs, floor/wall meshes, floor/wall/object texture quality, door-panel clarity, wall-door gaps/seams, and extraction marker pass or have explicit review notes.
- Completion: verify triumphant cue starts and level stats appear.
- Performance: 4 scene samples match the 55.9 FPS browser baseline with -0.1 ms median / 0.2 ms p95 overhead, but this environment cannot prove strict 16.7 ms frame cadence.
- Render budget: performance profile render counters are inside explicit draw-call, triangle, geometry, texture, pixel-ratio, and shadow budgets.

## Required Fixes

- P0: None recorded by generated report.
- P1: Current headed browser baseline measured 55.9 FPS / 17.9 ms median and cannot prove strict 16.7 ms on the performance profile. The game tracks that baseline within the calibrated overhead budget across 4 scene sample(s): title=environment-limited, gameplay=environment-limited, complete=environment-limited, caught=environment-limited (-0.1 ms median / 0.2 ms p95), so rerun on a true 60 Hz visible browser before marking the 60 FPS gate fully proven.
- P1: None from generated render-budget diagnostics.
- P1: None from generated operative trait diagnostics.
- P1: None from generated mission catalog diagnostics.
- P1: None from generated mission readiness matrix.
- P1: None from generated browser playthrough matrix.
- P1: None from generated loading diagnostics.
- P1: None from generated audio diagnostics.
- P1: None from generated failure/retry diagnostics.
- P1: None from generated runtime asset provenance audit.
- P1: None from generated tutorial alignment diagnostics.
- P1: None from generated asset grading.
- P1: None from generated title composition diagnostics.
- P1: None from generated gameplay camera diagnostics.
- P1: None from generated active gameplay-view density diagnostics.
- P1: None from generated mission guidance diagnostics.
- P1: None from generated coordinate geometry diagnostics.
- P1: None from generated screenshot coverage.
