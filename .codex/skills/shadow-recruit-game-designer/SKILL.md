---
name: shadow-recruit-game-designer
description: Review and direct Shadow Recruit 2 title screens, hero staging, cinematic camera language, gameplay camera distance, menu hierarchy, and screenshot-driven player readability. Use when Codex needs a game designer pass on title-screen composition, removing weak logo/title treatments, replacing zoomed-out level previews with cinematic scenes, improving hero framing, closer gameplay camera tuning, or deciding whether a title/menu screenshot feels polished enough for the game.
---

# Shadow Recruit Game Designer

## Design Contract

Use this skill before approving player-facing title, menu, camera, or first-impression changes. Treat the title screen as a cinematic game scene, not a UI page over a level preview.

## Review Priorities

Report in this order:

- **P1 first impression:** title screen must immediately communicate stealth, tactical infiltration, and recruit identity. Reject generic zoomed-out map previews, tiny hero staging, weak typography, or logos that look like placeholder art.
- **P1 composition:** hero, light, background action, and title text must create depth and a clear focal path. Avoid showing only Level 1 from a distant overhead angle.
- **P1 camera:** gameplay camera must keep the hero readable and near enough to judge walls, doors, objectives, sentries, and floor texture. Reject camera framing where the player becomes a tiny marker.
- **P2 menu hierarchy:** Start, Change Hero, Settings, and title text must be readable without covering the hero or the scene's strongest subject.
- **P2 cinematic motion:** title camera should orbit a staged stealth tableau, patrol corridor, door, sentry, extraction light, or hero close-up. Motion should feel intentional, not like a debug camera.
- **P2 asset direction:** title background should hide weak blockout areas and showcase the strongest art: hero GLB, door panel, sentry silhouette, generated character portrait, lighting, fog, and extraction color.

## Required Checks

- Inspect `title.png`, `hero-select.png`, `gameplay-level-one.png`, and at least one door-focus screenshot.
- Verify title text is native typography or strong UI treatment; do not require the PNG logo if it weakens the screen.
- Verify title camera distance and field of view place the hero as a first-viewport subject.
- Verify gameplay camera distance lets the player read the hero body, nearby walls, door seams, and objectives.
- Route generated wall/door texture issues to `$threejs-aaa-asset-builder`.
- Route performance or camera jitter issues to `$threejs-webgpu-webgl-expert`.
- Route UI text fit and controls to `$threejs-ui-accessibility`.

## Research Anchors

- Use Unity Cinemachine shot-composition language for screen position, dead zone, soft zone, damping, and target framing: https://docs.unity3d.com/Packages/com.unity.cinemachine@3.1/manual/CinemachinePositionComposer.html
- Use Unity Cinemachine third-person follow guidance when tuning character offset and camera distance: https://docs.unity3d.com/Packages/com.unity.cinemachine@3.0/manual/CinemachineThirdPersonFollow.html
- Use Unreal cinematic camera guidance as a reminder that title scenes should be staged with an intentional camera, not a debug/gameplay preview camera: https://dev.epicgames.com/documentation/unreal-engine/cinematic-cameras-in-unreal-engine
- Use WCAG contrast and images-of-text guidance for title/menu readability and to prefer native text over weak logo images when the visual treatment is not essential: https://www.w3.org/TR/WCAG22/

## Output Shape

```text
Findings
- P1/P2 finding with screenshot name and why it hurts player perception.

Direction
- Title composition change.
- Camera framing change.
- QA screenshot to recapture.
```
