---
name: shadow-recruit-game-designer
description: Review and direct Shadow Recruit 2 title screens, hero staging, cinematic camera language, gameplay camera distance, menu hierarchy, AAA level composition, asset-density readability, and screenshot-driven player perception. Use when Codex needs a game designer pass on title-screen composition, removing weak logo/title treatments, replacing zoomed-out level previews with cinematic scenes, making the title hero face/read toward the camera, improving hero framing, closer gameplay camera tuning, flagging empty large levels that lack AAA tactical detail, or deciding whether a title/menu/gameplay screenshot feels polished enough for the game.
---

# Shadow Recruit Game Designer

## Design Contract

Use this skill before approving player-facing title, menu, camera, or first-impression changes. Treat the title screen as a cinematic game scene, not a UI page over a level preview.

## Review Priorities

Report in this order:

- **P1 first impression:** title screen must immediately communicate stealth, tactical infiltration, and recruit identity. Reject generic zoomed-out map previews, tiny hero staging, weak typography, or logos that look like placeholder art.
- **P1 title hero orientation:** the title hero must read as the recruit. Prefer front or strong three-quarter staging where the face/visor, chest silhouette, gear, and weapon/pose language are visible. Reject shots where the hero mostly faces away, is side-on without readable identity, looks away from the camera without deliberate cinematic reason, or is hidden behind UI. Require tester evidence for facing dot, hero yaw, yaw-to-camera, camera distance, projected hero bounds, screen occupancy, and screenshot name.
- **P1 title hero attention:** the hero must face or read toward the player in the title shot. Reject a title screen where the strongest recruit read is the back, shoulder, side profile, or a figure looking away from screen, even if the camera orbit, menu UI, and level background are functional.
- **P1 title eye-line and identity:** reject a title screen when the player cannot inspect the recruit's front identity in the first frame. The hero can be cinematic or three-quarter, but the face/visor/chest silhouette must read toward the camera; a back-facing or looking-away pose is a failed first impression.
- **P1 title identity anchors:** whole-body yaw is not enough when the face or visor is hidden. Require projected head, chest, visor, or look-at anchors when available, or a screenshot-visible front identity read when those anchors are not instrumented.
- **P1 title subject clarity:** the title must sell the hero and fantasy before it sells the map. If the hero is present but not looking/readable to the player, treat the title screen as failed even when the menu layout, title text, and orbit camera technically work.
- **P1 title first-frame identity:** the first title frame must be a recruit identity shot, not merely a menu scene. Reject any screenshot where the hero is turned away, looking off-screen without a readable face/visor/chest payoff, or only visible as a distant body shape.
- **P1 title shot ownership:** the title camera must be authored as a hero shot, not a repurposed level overview. Reject title screenshots where the camera target, hero yaw, or orbit angle makes the recruit look away from the player, where the face/visor is not the focal payoff, or where the menu title is compensating for weak staging.
- **P1 title identity proof:** do not approve a title screen from composition language alone. Require the tester to prove the recruit is facing the camera enough to show front identity, projected head/chest/visor bounds are visible, and UI does not hide the identity read.
- **P1 composition:** hero, light, background action, and title text must create depth and a clear focal path. Avoid showing only Level 1 from a distant overhead angle.
- **P1 camera:** gameplay camera must keep the hero readable and near enough to judge walls, doors, objectives, sentries, and floor texture. Reject camera framing where the player becomes a tiny marker.
- **P1 gameplay camera proof:** require runtime camera distance, player projected bounds, screen-height ratio, and screen occupancy before accepting a closer gameplay camera. Design feedback should not rely on subjective screenshot scale alone.
- **P1 level believability:** a large level must not feel like a mostly empty blockout. Reject broad rooms/corridors that rely on floor/wall textures alone without cover, functional props, cables, signage, security fixtures, lighting hierarchy, landmarks, or objective dressing. Require coordinate-backed density evidence for the sparse area, not only a screenshot impression.
- **P1 playable-camera production value:** from the active gameplay camera, each primary mission beat should show usable foreground, midground, and background detail. Reject spaces that look AAA only from a debug/flyover camera or from props placed outside the player's normal view.
- **P1 active-camera density:** the designer pass must judge what the player sees from the normal camera, not only the authored level footprint. Reject large empty rooms when near/mid/far bands lack readable cover, props, landmarks, material variation, lighting hierarchy, or objective context.
- **P1 negative-space control:** empty floor and repeated bare walls are design failures when they dominate the active player view. A big level needs readable function, silhouettes, materials, lighting, and narrative/tactical props in the camera bands where the player spends time.
- **P1 route-beat dressing:** every primary route beat needs production detail in the camera bands the player actually sees. Reject screenshots where size is the main improvement but the visible route lacks nearby cover, terminals, keycard readers, door mechanisms, sentry infrastructure, decals, cables, lights, patrol context, or extraction staging.
- **P1 AAA detail credibility:** reject broad spaces that are technically large but lack real production detail: close cover silhouettes, terminals, keycard hardware, cables, vents, rails, security fixtures, decals, lighting fixtures, patrol context, extraction staging, and room-specific material breakup.
- **P1 cover and blocker art read:** collision blockers can be rectangles in data, but player-facing cover must read as intentional world art. Reject visible primitive boxes, under-detailed cover slabs, repeated plain blockers, or cover that lacks believable material scale and anchoring.
- **P2 menu hierarchy:** Start, Change Hero, Settings, and title text must be readable without covering the hero or the scene's strongest subject. Prefer native title typography over a weak logo image; remove or demote placeholder logos that compete with the staged hero.
- **P2 cinematic motion:** title camera should orbit a staged stealth tableau, patrol corridor, door, sentry, extraction light, or hero close-up. Motion should feel intentional, not like a debug camera.
- **P2 asset direction:** title background should hide weak blockout areas and showcase the strongest art: hero GLB, door panel, sentry silhouette, generated character portrait, lighting, fog, and extraction color. Gameplay spaces should layer tactical set dressing and silhouettes rather than repeating empty panels.

## Required Checks

- Inspect `title.png`, `hero-select.png`, `gameplay-level-one.png`, and at least one door-focus screenshot.
- Verify title text is native typography or strong UI treatment; remove, replace, or demote the PNG logo if it weakens the screen.
- Verify title camera distance, field of view, and hero rotation place the hero as a first-viewport subject with readable front/three-quarter identity. As a starting target, the hero should occupy enough viewport height to read the face/visor and torso; if projected bounds or screen occupancy are unavailable, request instrumentation before approving.
- Verify the hero is looking into the shot or presented in a deliberate three-quarter stance. If the screenshot shows the hero's back, an unreadable side profile, the hero looking out of frame, or a camera target behind the player, route to camera/staging changes before approving menu polish.
- Verify the first title screenshot sells the recruit without needing the user to rotate the camera. The hero should face the viewer or the camera language enough that the face/visor/chest and gear read immediately; a title shot where the character looks away is a P1 staging failure.
- Verify the title frame would still read if the UI text were hidden. If the shot does not show the recruit's face/visor/chest identity clearly enough to sell the character model, request pose, camera target, focal length, lighting, or title-staging changes before approving.
- Verify the hero's camera-relative facing metric supports the screenshot. Require hero forward/yaw, camera-to-hero vector, yaw-to-camera or facing dot, projected bounds, and UI occlusion status before accepting a title hero shot as readable.
- Verify the hero's identity anchors support the screenshot when available. A root facing dot can still fail when the head, visor, or chest silhouette points away, is occluded by UI, or is too small for the player to read.
- Verify the title screen does not use a distant gameplay-map view as the main subject. A mission-map preview can support the scene, but recruit identity and cinematic staging must remain primary.
- Verify the hero's face/visor/front torso are the visual payoff of the title. A title camera aimed at the hero's back, shoulder, or side profile needs restaging, a different idle pose, or a camera target change before typography/logo polish.
- Verify the title hero appears to look toward the viewer or into the camera language of the shot. A readable menu and a technically visible hero are insufficient when the player cannot inspect the recruit's face/visor/chest silhouette.
- Verify the title composition has a deliberate focal triangle: hero face/visor, title/menu action, and background infiltration detail. If the strongest visual is empty floor, flat wall, or a distant path, redesign the shot before tuning typography.
- Verify gameplay camera distance lets the player read the hero body, nearby walls, door seams, and objectives.
- Verify the gameplay camera has numeric readability evidence from the normal player screenshot: camera distance should stay in the project readability range, player projected height/occupancy should clear threshold, and the hero should not be reduced to a tactical-overview icon.
- Verify the large level has enough asset density and tactical landmarks for each major zone. If a screenshot is mostly empty floor and wall texture, route to `$threejs-level-world-builder` and `$threejs-aaa-asset-builder`.
- Verify each primary gameplay screenshot has near, mid, and far band detail. A large level should show a believable infiltration space at player distance: terminals, keycard readers, security fixtures, door mechanisms, pipes, cable trays, signage, lighting fixtures, cover, decals, extraction staging, or patrol context.
- Verify each primary gameplay screenshot has enough close-range evidence to grade the assets. If the hero/camera is too far away to judge wall texture scale, floor detail, prop quality, sentry grounding, or door seams, request a closer camera pass before calling the environment AAA.
- Require the game tester to back level-density critiques with room coordinates, floor footprint, set-dressing footprint, landmark/objective counts, and screenshots. Do not accept "large level" as a positive design outcome when the camera view reads as a mostly empty blockout.
- Require the game tester to back active-camera density critiques with screenshot name, zone coordinates, near/mid/far band scores, visible asset counts, repeated-material exposure, and any missing instrumentation. Whole-level averages do not override a bad player-view screenshot.
- Require the designer pass to preserve the player's eye-level read. If the active gameplay camera shows wide empty space with props only at the edge of the frame, request foreground/midground/background dressing and a new screenshot rather than accepting the zone by aggregate metrics.
- Require primary gameplay screenshots to prove AAA density in the actual player camera. A large level is a liability when it reads as empty space; the designer should ask for terminals, keycard readers, security fixtures, door hardware, pipes, cables, lighting, cover silhouettes, decals, patrol landmarks, and extraction staging in the visible near/mid/far bands.
- Treat "vastly larger than the first game" as unproven design value until the active player camera shows production detail in the route. Bigger floor area without nearby props, silhouettes, lighting, materials, and tactical landmarks is still a blockout-level failure.
- Require primary gameplay screenshots to prove controlled negative space. Empty floor can support tactical readability only when it is framed by cover, landmarks, lighting, signage, material breakup, patrol context, or objective staging; otherwise it reads as unfinished blockout.
- Require each active-camera route beat to name the visible production categories in near, mid, and far bands. A large room needs foreground silhouettes, midground function, and a far landmark or objective relation; props outside the player's readable camera bands do not solve the screenshot.
- Require sparse-space critiques to name what is missing in the active camera band. Use concrete categories: foreground cover, midground interaction prop, far landmark, lighting hierarchy, wall material breakup, floor decals, cables/pipes, security hardware, patrol context, objective dressing, and extraction visibility.
- Require the title hero to pass both orientation and identity-read checks. If the recruit's face/visor/chest is not visible because the character is turned away, zoomed out, or hidden by UI, redesign the shot before spending time on logo or title-text polish.
- Require the gameplay camera to prove material and prop detail at player distance. If floor/wall texture quality cannot be judged because the camera is too far away, first request a closer player-readable camera pass, then request asset upgrades.
- Require the game tester to back title-facing critiques with screenshot name, hero camera distance, hero forward vector or yaw, yaw-to-camera/facing dot, projected bounds, and screen occupancy. Do not approve the title screen from a UI-only screenshot when the recruit identity is not readable.
- For door/wall or collision-looking defects, require `$shadow-recruit-game-tester` to pair screenshot notes with coordinates and require `$threejs-level-geometry-validator` when wall endpoints, wall-run intervals, door states, bounds, or openings do not prove continuity.
- For wall gaps between doors, require the tester to show the door-to-door ownership row for the shared wall line. The designer should not accept visual reassurance that "frames are present" until a named wall/return/trim/continuity surface owns the coordinate span between adjacent openings.
- For wall gaps that are visible in the screenshot, require a camera-probe or projected-depth row too. The design verdict should know both whether the wall line connects in coordinates and what the player camera sees through the suspect region.
- For screenshots where the user can see a wallop or door-to-door gap, require the tester to produce a pixel-to-world trace from the suspect screen region to the door pair, wall-line span, owner surface, projected coverage, and first-hit result. If the tester cannot produce it, treat missing instrumentation as the design blocker.
- Route generated wall/door texture issues to `$threejs-aaa-asset-builder`.
- Route performance or camera jitter issues to `$threejs-webgpu-webgl-expert`.
- Route UI text fit and controls to `$threejs-ui-accessibility`.

## Research Anchors

- Use Unity Cinemachine shot-composition language for screen position, dead zone, soft zone, damping, and target framing: https://docs.unity3d.com/Packages/com.unity.cinemachine@3.1/manual/CinemachinePositionComposer.html
- Use Unity Cinemachine third-person follow guidance when tuning character offset and camera distance: https://docs.unity3d.com/Packages/com.unity.cinemachine@3.0/manual/CinemachineThirdPersonFollow.html
- Use Unreal cinematic camera guidance as a reminder that title scenes should be staged with an intentional camera, not a debug/gameplay preview camera: https://dev.epicgames.com/documentation/unreal-engine/cinematic-cameras-in-unreal-engine
- Use Unreal level-design content example phase language to separate prototype/blockout from meshing, lighting, and polish; a large graybox is not finished presentation: https://dev.epicgames.com/documentation/unreal-engine/level-design-content-examples
- Use WCAG contrast and images-of-text guidance for title/menu readability and to prefer native text over weak logo images when the visual treatment is not essential: https://www.w3.org/TR/WCAG22/

## Output Shape

```text
Findings
- P1/P2 finding with screenshot name and why it hurts player perception.

Direction
- Title composition change.
- Hero orientation/focal-read change.
- Level asset-density/set-dressing change.
- Camera framing change.
- Coordinate or projection evidence needed.
- QA screenshot to recapture.
```
