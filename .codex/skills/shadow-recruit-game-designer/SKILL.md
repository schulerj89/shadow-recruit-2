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
- **P1 title subject clarity:** the title must sell the hero and fantasy before it sells the map. If the hero is present but not looking/readable to the player, treat the title screen as failed even when the menu layout, title text, and orbit camera technically work.
- **P1 composition:** hero, light, background action, and title text must create depth and a clear focal path. Avoid showing only Level 1 from a distant overhead angle.
- **P1 camera:** gameplay camera must keep the hero readable and near enough to judge walls, doors, objectives, sentries, and floor texture. Reject camera framing where the player becomes a tiny marker.
- **P1 level believability:** a large level must not feel like a mostly empty blockout. Reject broad rooms/corridors that rely on floor/wall textures alone without cover, functional props, cables, signage, security fixtures, lighting hierarchy, landmarks, or objective dressing. Require coordinate-backed density evidence for the sparse area, not only a screenshot impression.
- **P2 menu hierarchy:** Start, Change Hero, Settings, and title text must be readable without covering the hero or the scene's strongest subject. Prefer native title typography over a weak logo image; remove or demote placeholder logos that compete with the staged hero.
- **P2 cinematic motion:** title camera should orbit a staged stealth tableau, patrol corridor, door, sentry, extraction light, or hero close-up. Motion should feel intentional, not like a debug camera.
- **P2 asset direction:** title background should hide weak blockout areas and showcase the strongest art: hero GLB, door panel, sentry silhouette, generated character portrait, lighting, fog, and extraction color. Gameplay spaces should layer tactical set dressing and silhouettes rather than repeating empty panels.

## Required Checks

- Inspect `title.png`, `hero-select.png`, `gameplay-level-one.png`, and at least one door-focus screenshot.
- Verify title text is native typography or strong UI treatment; remove, replace, or demote the PNG logo if it weakens the screen.
- Verify title camera distance, field of view, and hero rotation place the hero as a first-viewport subject with readable front/three-quarter identity. As a starting target, the hero should occupy enough viewport height to read the face/visor and torso; if projected bounds or screen occupancy are unavailable, request instrumentation before approving.
- Verify the hero is looking into the shot or presented in a deliberate three-quarter stance. If the screenshot shows the hero's back, an unreadable side profile, the hero looking out of frame, or a camera target behind the player, route to camera/staging changes before approving menu polish.
- Verify the title screen does not use a distant gameplay-map view as the main subject. A mission-map preview can support the scene, but recruit identity and cinematic staging must remain primary.
- Verify the hero's face/visor/front torso are the visual payoff of the title. A title camera aimed at the hero's back, shoulder, or side profile needs restaging, a different idle pose, or a camera target change before typography/logo polish.
- Verify gameplay camera distance lets the player read the hero body, nearby walls, door seams, and objectives.
- Verify the large level has enough asset density and tactical landmarks for each major zone. If a screenshot is mostly empty floor and wall texture, route to `$threejs-level-world-builder` and `$threejs-aaa-asset-builder`.
- Require the game tester to back level-density critiques with room coordinates, floor footprint, set-dressing footprint, landmark/objective counts, and screenshots. Do not accept "large level" as a positive design outcome when the camera view reads as a mostly empty blockout.
- Require the designer pass to preserve the player's eye-level read. If the active gameplay camera shows wide empty space with props only at the edge of the frame, request foreground/midground/background dressing and a new screenshot rather than accepting the zone by aggregate metrics.
- Require the game tester to back title-facing critiques with screenshot name, hero camera distance, hero forward vector or yaw, yaw-to-camera/facing dot, projected bounds, and screen occupancy. Do not approve the title screen from a UI-only screenshot when the recruit identity is not readable.
- For door/wall or collision-looking defects, require `$shadow-recruit-game-tester` to pair screenshot notes with coordinates and require `$threejs-level-geometry-validator` when wall endpoints, wall-run intervals, door states, bounds, or openings do not prove continuity.
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
