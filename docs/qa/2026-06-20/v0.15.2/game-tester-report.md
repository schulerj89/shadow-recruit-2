# Shadow Recruit 2 Game Tester Report

Build: v0.15.2
Date: 2026-06-20

## Evidence

- Smoke screenshots: `artifacts/smoke/v0.15.2`
- Browser playthrough: `docs/qa/2026-06-20/v0.15.2/playthrough-report.json` (captured)
- Committed screenshots: `docs/qa/2026-06-20/v0.15.2/screenshots`
- FPS metrics: `docs/qa/2026-06-20/v0.15.2/metrics.json`
- Mission catalog evidence: `docs/qa/2026-06-20/v0.15.2/mission-catalog.json` (captured)
- Screenshot coverage: 16/16 expected captures present (9927.8 KB)
- Metrics available: yes
- Mission catalog: selected=Blacksite Threshold; missions=1; blacksite-threshold(3 objectives, 3 enemies); hero-select brief captured
- Game frame pacing: 56.2 FPS, 17.8 ms median, 18.1 ms latest, 18.2 ms p95, 240 samples
- Browser baseline: 55.9 FPS, 17.9 ms median, 18.1 ms p95, 240 samples
- FPS gate: environment-limited; profile=performance; strictTarget=false; browserCanProve60=false; tracksBaseline=true
- Renderer metrics: 29 draw calls, 96287 triangles, 73 geometries, 16 textures, profile=performance, shadows=false, shadowMap=0
- Loaded assets: 9 total (2 character, 7 static): hero:shadow-operative, sentry, cable-tray, codes, cover-barricade, extraction-beacon, keycard, terminal, wall-machinery
- Runtime asset audit: 9 pass, 0 review, 0 fail; visibleFallbacks=0; sources=repo-generated-glb, sneak-game-seed
- Audio state: gameplay metrics=active=gameplay; muted=false; unlocked=true; completion playthrough=active=complete; muted=false; unlocked=true
- Asset grades: 20 pass, 0 review, 0 fail
- Loading state: 7 steps; latest="starting cinematic tutorial" 100%; captured=loading title hero:18% -> building rotating level preview:62% -> ready:100% -> preloading hero, sentry, objectives, cover:18% -> preloading tactical dressing:42% -> building blacksite threshold:68% -> starting cinematic tutorial:100%
- Tutorial alignment: 5/5 pass; allCadet=true; targets=hero->hero, keycard->access-keycard, terminal->security-terminal, sentry->sentry-lobby, extraction->extraction
- Title composition: heroReadable=true; levelPreview=true; facingDot=0.99; cameraDistance=6.14; screenHeight=44.0%; screenOccupancy=11.0%; screenBounds=x=550.97..921.64, y=289.78..688.63, viewport=1440x900, width=26.0%, height=44.0%, area=11.0%; orbitAngle=0.3; orbitRadius=5.31; heroYaw=1.13; yawToCamera=1.27
- Title treatment: wordmarkReadable=true; text="SHADOW RECRUIT 2"; kicker="OPERATION BLACKGLASS"; bounds=x=160..671.75, y=405.42..661.75, viewport=1440x900, width=36.0%, height=28.0%, area=10.0%; panelOverlap=0.0%; heroOverlap=24.0%
- Geometry diagnostics: 51 object bounds; 3 door checks; 3 wall-run checks; levelDensity=pass (14.0%); aaaReady=no; level=14.0% target=18.0%; weakZones=entry-lobby:12.0%, security-stack:10.0%, server-wing:17.0%, command-extraction:18.0%; zones=entry-lobby:pass:12.0%, security-stack:pass:10.0%, server-wing:pass:17.0%, command-extraction:pass:18.0%
- Completion stats: active=true; objectives=3/3; alerts=0; cue=triumphant; elapsed=14s
- Settings state: debug=false; muted=false; performance=performance

## Coordinate QA

- PASS door/lobby-door: axis=x; walls=lobby-divider-west, lobby-divider-east; opening=x=-3..3, y=0..3.3, z=-18.4..-17.6; frame=x=-3.32..3.32, y=0..3.66, z=-18.69..-17.31; continuity=x=-3.29..3.29, y=0..3.3, z=-18.66..-17.34; no gaps above 0.08m
- PASS door/server-door: axis=x; walls=server-divider-west, server-divider-east; opening=x=11..17, y=0..3.3, z=4.6..5.4; frame=x=10.68..17.32, y=0..3.66, z=4.31..5.69; continuity=x=10.71..17.29, y=0..3.3, z=4.34..5.66; no gaps above 0.08m
- PASS door/extraction-door: axis=x; walls=command-divider-west, command-divider-east; opening=x=-3..3, y=0..3.3, z=19.6..20.4; frame=x=-3.32..3.32, y=0..3.66, z=19.31..20.69; continuity=x=-3.29..3.29, y=0..3.3, z=19.34..20.66; no gaps above 0.08m
- PASS set-dressing/south-cable-trench-west: asset=cable-tray; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=-36..-8, y=0..0.16, z=-31.6..-30.4; rendered=x=-36..-8, y=0..0.16, z=-31.6..-30.4; cable-tray GLB loaded and occupies 100.0% of authored footprint south-cable-trench-west.
- PASS set-dressing/south-cable-trench-east: asset=cable-tray; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=8..36, y=0..0.16, z=-31.6..-30.4; rendered=x=8..36, y=0..0.16, z=-31.6..-30.4; cable-tray GLB loaded and occupies 100.0% of authored footprint south-cable-trench-east.
- PASS set-dressing/lobby-wall-machinery-west: asset=wall-machinery; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=-38..-10, y=0..1.15, z=-16.98..-15.73; rendered=x=-38..-10, y=0..1.15, z=-16.98..-15.73; wall-machinery GLB loaded and occupies 100.0% of authored footprint lobby-wall-machinery-west.
- PASS set-dressing/lobby-wall-machinery-east: asset=wall-machinery; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=10..38, y=0..1.15, z=-16.98..-15.73; rendered=x=10..38, y=0..1.15, z=-16.98..-15.73; wall-machinery GLB loaded and occupies 100.0% of authored footprint lobby-wall-machinery-east.
- PASS set-dressing/west-utility-pipe-run: asset=cable-tray; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=-39.7..-38.3, y=0..0.42, z=-28..8; rendered=x=-39.7..-38.3, y=0..0.42, z=-28..8; cable-tray GLB loaded and occupies 100.0% of authored footprint west-utility-pipe-run.
- PASS set-dressing/east-utility-pipe-run: asset=cable-tray; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=38.3..39.7, y=0..0.42, z=-26..10; rendered=x=38.3..39.7, y=0..0.42, z=-26..10; cable-tray GLB loaded and occupies 100.0% of authored footprint east-utility-pipe-run.
- PASS set-dressing/security-floor-cable-spine: asset=cable-tray; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=-17..17, y=0..0.18, z=-2.55..-1.45; rendered=x=-17..17, y=0..0.18, z=-2.55..-1.45; cable-tray GLB loaded and occupies 100.0% of authored footprint security-floor-cable-spine.
- PASS set-dressing/server-cable-run-west: asset=cable-tray; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=-39..-15, y=0..0.2, z=5.77..6.92; rendered=x=-39..-15, y=0..0.2, z=5.77..6.92; cable-tray GLB loaded and occupies 100.0% of authored footprint server-cable-run-west.
- PASS set-dressing/server-cable-run-east: asset=cable-tray; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=18..38, y=0..0.2, z=5.77..6.92; rendered=x=18..38, y=0..0.2, z=5.77..6.92; cable-tray GLB loaded and occupies 100.0% of authored footprint server-cable-run-east.
- PASS set-dressing/server-overhead-rack-west: asset=wall-machinery; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=-39..-19, y=0..0.75, z=16.75..18.05; rendered=x=-39..-19, y=0..0.75, z=16.75..18.05; wall-machinery GLB loaded and occupies 100.0% of authored footprint server-overhead-rack-west.
- PASS set-dressing/server-overhead-rack-east: asset=wall-machinery; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=19..39, y=0..0.75, z=16.75..18.05; rendered=x=19..39, y=0..0.75, z=16.75..18.05; wall-machinery GLB loaded and occupies 100.0% of authored footprint server-overhead-rack-east.
- PASS set-dressing/command-console-west: asset=wall-machinery; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=-35..-11, y=0..0.95, z=21.05..22.55; rendered=x=-35..-11, y=0..0.95, z=21.05..22.55; wall-machinery GLB loaded and occupies 100.0% of authored footprint command-console-west.
- PASS set-dressing/command-console-east: asset=wall-machinery; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=11..35, y=0..0.95, z=21.05..22.55; rendered=x=11..35, y=0..0.95, z=21.05..22.55; wall-machinery GLB loaded and occupies 100.0% of authored footprint command-console-east.
- PASS set-dressing/extraction-machinery-west: asset=extraction-beacon; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=-36..-12, y=0..0.85, z=34..36; rendered=x=-36..-12, y=0..0.85, z=34..36; extraction-beacon GLB loaded and occupies 100.0% of authored footprint extraction-machinery-west.
- PASS set-dressing/extraction-machinery-east: asset=extraction-beacon; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=12..36, y=0..0.85, z=34..36; rendered=x=12..36, y=0..0.85, z=34..36; extraction-beacon GLB loaded and occupies 100.0% of authored footprint extraction-machinery-east.
- PASS set-dressing/north-cable-spine: asset=cable-tray; loaded=true; visible=true; grounded=true; coverage=100.0%; authored=x=-15..15, y=0..0.22, z=35.7..36.7; rendered=x=-15..15, y=0..0.22, z=35.7..36.7; cable-tray GLB loaded and occupies 100.0% of authored footprint north-cable-spine.
- PASS zone/entry-lobby: Entry Lobby; bounds=x=-42..42, z=-34..-18; screenshot=gameplay-level-one.png; floor=1344m2; cover=40m2; dressing=92.4m2; gameplay=26.41m2; total=158.81m2 (12.0%); blockers=2; setDressing=4; objectives=1; enemies=1; interactables=2; landmarks=5/5 (access-keycard, lobby-door, cargo-stack-a, cargo-stack-b, sentry-lobby). Entry Lobby has 11.8% tactical footprint coverage with 5/5 expected landmark(s) present.
- PASS zone/security-stack: Security Stack; bounds=x=-42..42, z=-18..5; screenshot=tutorial-03-terminal.png; floor=1932m2; cover=18m2; dressing=171.8m2; gameplay=9.62m2; total=199.42m2 (10.0%); blockers=1; setDressing=5; objectives=1; enemies=0; interactables=3; landmarks=4/4 (security-terminal, antenna-bank, security-floor-cable-spine, server-door). Security Stack has 10.3% tactical footprint coverage with 4/4 expected landmark(s) present.
- PASS zone/server-wing: Server Wing; bounds=x=-42..42, z=5..20; screenshot=gameplay-command-codes.png; floor=1260m2; cover=80m2; dressing=113.8m2; gameplay=25.64m2; total=219.44m2 (17.0%); blockers=2; setDressing=6; objectives=1; enemies=1; interactables=3; landmarks=4/4 (command-codes, server-bank-a, server-bank-b, sentry-server). Server Wing has 17.4% tactical footprint coverage with 4/4 expected landmark(s) present.
- PASS zone/command-extraction: Command And Extraction; bounds=x=-42..42, z=20..38; screenshot=complete.png; floor=1512m2; cover=33m2; dressing=198m2; gameplay=36.98m2; total=267.98m2 (18.0%); blockers=1; setDressing=5; objectives=0; enemies=1; interactables=2; landmarks=5/5 (extraction, briefing-table, extraction-machinery-west, extraction-machinery-east, sentry-command). Command And Extraction has 17.7% tactical footprint coverage with 5/5 expected landmark(s) present.
- PASS level-density: floor=6048m2; dressing=826.02m2; ratio=14.0%; blockers=6; setDressing=16; objectives=3; enemies=3. Set-dressing and gameplay footprints cover 13.7% of the level floor across 4 named zone(s).

## Tutorial Alignment QA

- PASS tutorial/hero: screenshot=tutorial-01-insertion.png; title="Insertion"; target=hero (hero); targetPoint=0,-29; focusPoint=0,-29; focusDistance=0; cameraDistance=10.24; cadet=true; keywords=cadet, shadow recruit, move quietly. Tutorial step hero targets hero, uses required callout terms, and ends with Good luck, cadet.
- PASS tutorial/keycard: screenshot=tutorial-02-keycard.png; title="First Lock"; target=access-keycard (objective); targetPoint=-31,-25; focusPoint=-31,-25; focusDistance=0; cameraDistance=10.24; cadet=true; keywords=objective, keycard, door. Tutorial step keycard targets access-keycard, uses required callout terms, and ends with Good luck, cadet.
- PASS tutorial/terminal: screenshot=tutorial-03-terminal.png; title="Security Stack"; target=security-terminal (objective); targetPoint=30,-3; focusPoint=30,-3; focusDistance=0; cameraDistance=10.24; cadet=true; keywords=terminal, server-wing door, interact. Tutorial step terminal targets security-terminal, uses required callout terms, and ends with Good luck, cadet.
- PASS tutorial/sentry: screenshot=tutorial-04-sentry.png; title="Avoid Contact"; target=sentry-lobby (enemy); targetPoint=16,-25; focusPoint=16,-25; focusDistance=0; cameraDistance=10.24; cadet=true; keywords=avoid sentries, cover, patrol. Tutorial step sentry targets sentry-lobby, uses required callout terms, and ends with Good luck, cadet.
- PASS tutorial/extraction: screenshot=tutorial-05-extraction.png; title="Extraction"; target=extraction (extraction); targetPoint=0,33; focusPoint=0,33; focusDistance=0; cameraDistance=10.2; cadet=true; keywords=command codes, final door, extraction. Tutorial step extraction targets extraction, uses required callout terms, and ends with Good luck, cadet.

## Mission Catalog QA

- PASS mission-selected: selected=blacksite-threshold; label=Blacksite Threshold; brief="OPERATION GLASS DAGGER\nBlacksite Threshold\n3 required objectives, 3 sentries, 3 sliding doors, 4 density zones."
- PASS mission/blacksite-threshold: Operation Glass Dagger / Blacksite Threshold; objectives=3; enemies=3

## Wall-Run Interval QA

- PASS wall-run/x:-18: axis=x; line=-18; intervals=lobby-divider-west[wall] -41m..-3m; lobby-door:frame[door-frame] -3.32m..3.32m; lobby-door:wall-continuity[door-continuity] -3.29m..3.29m; lobby-door[door-opening] -3m..3m; lobby-divider-east[wall] 3m..41m; gaps=no unowned spans above 0.08m
- PASS wall-run/x:5: axis=x; line=5; intervals=server-divider-west[wall] -41m..11m; server-door:frame[door-frame] 10.68m..17.32m; server-door:wall-continuity[door-continuity] 10.71m..17.29m; server-door[door-opening] 11m..17m; server-divider-east[wall] 17m..30m; gaps=no unowned spans above 0.08m
- PASS wall-run/x:20: axis=x; line=20; intervals=command-divider-west[wall] -41m..-3m; extraction-door:frame[door-frame] -3.32m..3.32m; extraction-door:wall-continuity[door-continuity] -3.29m..3.29m; extraction-door[door-opening] -3m..3m; command-divider-east[wall] 3m..41m; gaps=no unowned spans above 0.08m

## Asset Grading

- PASS level-mesh/level-floor: Floor mesh; visible=true; grounded=true. pos=(0,0,0); y=0..0; h=0; xz=84x72 Floor mesh covers the authored level bounds with a generated tactical floor-panel image texture. Floor uses src/assets/generated/tactical-floor-panel.png as a repeated runtime texture.
- PASS level-mesh/level-walls: Wall meshes; visible=true; grounded=true. 12 wall meshes are present and use src/assets/generated/blacksite-wall-panel.png as the repeated generated wall texture.
- PASS door/sliding-doors: Sliding door panels; visible=true; grounded=true. 3 sliding door assemblies are present and use the generated door-panel texture.
- PASS door/door-wall-seams: Door-wall seams; visible=true; grounded=true. 3 sliding-door openings have door frames plus wall/portal continuity meshes behind the door layer, so the door panels visually take priority without reading as missing wall gaps.
- PASS blocker/level-blocker-cover: Blocker cover GLB visuals; visible=true; grounded=true. 6 authored blocker collision proxies are represented by fitted cover-barricade GLB visuals with no primitive stand-ins.
- PASS blocker/cargo-stack-a: cargo-stack-a cover module; visible=true; grounded=true. pos=(-27,0,-25); y=0..1.35; h=1.35; xz=5x4 Required cover-barricade GLB is visible, grounded, and fitted to the authored blocker collision proxy. Collision remains authored from the level blocker rectangle; runtime visual must not be a primitive fallback.
- PASS blocker/cargo-stack-b: cargo-stack-b cover module; visible=true; grounded=true. pos=(27,0,-25); y=0..1.35; h=1.35; xz=5x4 Required cover-barricade GLB is visible, grounded, and fitted to the authored blocker collision proxy. Collision remains authored from the level blocker rectangle; runtime visual must not be a primitive fallback.
- PASS blocker/antenna-bank: antenna-bank cover module; visible=true; grounded=true. pos=(-26,0,-4); y=0..1.75; h=1.75; xz=6x3 Required cover-barricade GLB is visible, grounded, and fitted to the authored blocker collision proxy. Collision remains authored from the level blocker rectangle; runtime visual must not be a primitive fallback.
- PASS blocker/server-bank-a: server-bank-a cover module; visible=true; grounded=true. pos=(25,0,11); y=0..1.9; h=1.9; xz=5x8 Required cover-barricade GLB is visible, grounded, and fitted to the authored blocker collision proxy. Collision remains authored from the level blocker rectangle; runtime visual must not be a primitive fallback.
- PASS blocker/server-bank-b: server-bank-b cover module; visible=true; grounded=true. pos=(-25,0,12); y=0..1.9; h=1.9; xz=5x8 Required cover-barricade GLB is visible, grounded, and fitted to the authored blocker collision proxy. Collision remains authored from the level blocker rectangle; runtime visual must not be a primitive fallback.
- PASS blocker/briefing-table: briefing-table cover module; visible=true; grounded=true. pos=(0,0,26); y=0..1; h=1; xz=11x3 Required cover-barricade GLB is visible, grounded, and fitted to the authored blocker collision proxy. Collision remains authored from the level blocker rectangle; runtime visual must not be a primitive fallback.
- PASS set-dressing/level-set-dressing: Tactical set dressing; visible=true; grounded=true. 16 coordinate-authored non-colliding dressing placements have loaded GLB assets, visible runtime bounds, floor contact, and coordinate footprint coverage without blocking the validation route.
- PASS objective/access-keycard: Recover the lobby keycard; visible=true; grounded=true. pos=(-31,0,-25); y=0..0.9; h=0.9; xz=1.49x0.02 keycard GLB is visible, grounded, and available for interaction.
- PASS objective/security-terminal: Hack the security terminal; visible=true; grounded=true. pos=(30,0,-3); y=0..1.55; h=1.55; xz=1.16x2.45 terminal GLB is visible, grounded, and available for interaction.
- PASS objective/command-codes: Copy the command codes; visible=true; grounded=true. pos=(-32,0,14); y=0..1; h=1; xz=1.81x1.28 codes GLB is visible, grounded, and available for interaction.
- PASS enemy/sentry-lobby: Lobby sentry; visible=true; grounded=true. pos=(5.82,0,-24.15); y=0.02..1.57; h=1.55; xz=1.58x1.58 Sentry GLB is visible above the floor and aligned to its patrol route.
- PASS enemy/sentry-server: Server sentry; visible=true; grounded=true. pos=(27.01,0,14.08); y=0.02..1.57; h=1.55; xz=1.75x1.75 Sentry GLB is visible above the floor and aligned to its patrol route.
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

## Screenshot Coverage

- PASS screenshot/title.png: captured (557.4 KB)
- PASS screenshot/title-orbit-preview.png: captured (572.4 KB)
- PASS screenshot/settings.png: captured (459.5 KB)
- PASS screenshot/hero-select.png: captured (527.7 KB)
- PASS screenshot/loading-level-one.png: captured (518.5 KB)
- PASS screenshot/tutorial-01-insertion.png: captured (707.0 KB)
- PASS screenshot/tutorial-02-keycard.png: captured (628.8 KB)
- PASS screenshot/tutorial-03-terminal.png: captured (725.2 KB)
- PASS screenshot/tutorial-04-sentry.png: captured (690.8 KB)
- PASS screenshot/tutorial-05-extraction.png: captured (671.5 KB)
- PASS screenshot/gameplay-level-one.png: captured (655.3 KB)
- PASS screenshot/focus-lobby-door.png: captured (695.0 KB)
- PASS screenshot/focus-server-door.png: captured (667.4 KB)
- PASS screenshot/gameplay-command-codes.png: captured (638.8 KB)
- PASS screenshot/focus-extraction-door.png: captured (666.8 KB)
- PASS screenshot/complete.png: captured (545.5 KB)

## Tester Feedback

- Title flow: verify the native title treatment, cinematic scene, staged hero model, hero-select preview space, Start, Change Hero, and Settings are visible.
- Mission catalog: verify the player-facing mission selector is visible before mission start, reflects the active level, and exposes objective/enemy counts for future big levels.
- Tutorial: verify all five General Caldwell screenshots align with hero, keycard, terminal, sentry, and extraction targets, and every step ends with "Good luck, cadet."
- Level: verify keycard, terminal, command codes, sentries, extraction, wall/floor meshes, wall/floor texture quality, and all three door-focus screenshots are readable and properly grounded.
- Playthrough: verify the browser route uses the authored validation route, keyboard interaction, door-focus pauses, and extraction completion without sentry contact.
- Coordinate QA: verify door/wall continuity by edge coordinates, not screenshot impression alone. Wall gaps must name door ID, wall IDs, frame/continuity bounds, and measured gap widths.
- Camera QA: verify the normal gameplay screenshot is captured before objective interaction, with debug teleports snapping the gameplay camera to the current player position.
- Asset QA: verify objective GLBs, sentry GLBs, cover/blocker GLBs, floor/wall meshes, floor/wall/object texture quality, door-panel clarity, wall-door gaps/seams, and extraction marker pass or have explicit review notes.
- Completion: verify triumphant cue starts and level stats appear.
- Performance: game pacing matches the 55.9 FPS browser baseline, but this environment cannot prove strict 16.7 ms frame cadence.

## Required Fixes

- P0: None recorded by generated report.
- P1: Current headed browser baseline measured 55.9 FPS / 17.9 ms median and cannot prove strict 16.7 ms on the performance profile. The game tracks that baseline within tolerance, so rerun on a true 60 Hz visible browser before marking the 60 FPS gate fully proven.
- P1: None from generated mission catalog diagnostics.
- P1: None from generated loading diagnostics.
- P1: None from generated audio diagnostics.
- P1: None from generated runtime asset provenance audit.
- P1: None from generated tutorial alignment diagnostics.
- P1: None from generated asset grading.
- P1: None from generated title composition diagnostics.
- P1: Zone entry-lobby is not AAA presentation-ready from its mapped gameplay screenshot (gameplay-level-one.png): 12.0% tactical footprint is below the 20% camera-readiness target. Add foreground, midground, and background props, cover silhouettes, decals, lighting fixtures, cables, security equipment, and objective context.
- P1: Zone security-stack is not AAA presentation-ready from its mapped gameplay screenshot (tutorial-03-terminal.png): 10.0% tactical footprint is below the 20% camera-readiness target. Add foreground, midground, and background props, cover silhouettes, decals, lighting fixtures, cables, security equipment, and objective context.
- P1: Zone server-wing is not AAA presentation-ready from its mapped gameplay screenshot (gameplay-command-codes.png): 17.0% tactical footprint is below the 20% camera-readiness target. Add foreground, midground, and background props, cover silhouettes, decals, lighting fixtures, cables, security equipment, and objective context.
- P1: Zone command-extraction is not AAA presentation-ready from its mapped gameplay screenshot (complete.png): 18.0% tactical footprint is below the 20% camera-readiness target. Add foreground, midground, and background props, cover silhouettes, decals, lighting fixtures, cables, security equipment, and objective context.
- P1: Whole-level AAA presentation readiness is not proven: 14.0% tactical footprint is below the 18% readiness target, so the tester should still call out empty floor/wall reads despite functional density passing.
- P1: None from generated screenshot coverage.
