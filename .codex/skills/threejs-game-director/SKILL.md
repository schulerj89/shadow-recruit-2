---
name: threejs-game-director
description: Direct Shadow Recruit 2 and other Three.js game feature loops with production priorities, player-readability reviews, cross-skill routing, and concrete next patches. Use when Codex needs a game director pass, feature-slice plan, screenshot or gameplay review, production triage, or a decision about which Three.js specialist skill to invoke next.
---

# Three.js Game Director

## Core Loop

Use this skill as the top-level loop controller for Shadow Recruit 2. Keep the game moving toward a richer, clearer, more replayable successor to Shadow Circuit rather than a collection of isolated demos.

1. State the player-facing fantasy and the current feature slice in one sentence.
2. Inspect current repo code, docs, screenshots, test output, and debug metrics before giving direction.
3. Separate blocking readability and feel issues from optional polish.
4. Route specialist work deliberately.
5. Return a short implementation plan with verification steps.

## Specialist Routing

Invoke or recommend these repo-local skills when the task crosses their boundary:

- `$threejs-webgpu-webgl-expert`: renderer setup, WebGPU/WebGL fallback, shaders, postprocessing, lighting, materials, performance instrumentation, frame pacing.
- `$threejs-gameplay-systems`: stealth rules, combat, input, AI, collision, state machines, camera controllers, progression systems, save/state flows.
- `$threejs-image-generator`: GPT Image 2 concept sheets, reference plates, UI art, texture references, orthographic character or prop sheets.
- `$threejs-aaa-asset-builder`: GLB production, Meshy or Tripo generation, remesh, rigging, retargeting, animation sets, GLTFLoader integration.
- `$threejs-memory`: asset budgets, runtime memory pressure, renderer.info trends, disposal leaks, loading/unloading, texture and GLB payload limits.
- `$threejs-level-world-builder`: level slices, mission spaces, traversal readability, encounter layouts, world streaming, LOD boundaries, environmental storytelling.
- `$threejs-level-geometry-validator`: level blockout math, wall overlaps, bounds containment, grid tolerances, corridor clearance, collision proxy sanity, navmesh blocker preparation.
- `$threejs-physics-navigation`: physics worlds, collision proxies, Rapier-style character controllers, triggers, ray/shape queries, navmesh generation, pathfinding.
- `$threejs-character-animation`: AnimationMixer state, clip maps, locomotion blends, action crossfades, root motion policy, hit reactions, retargeted clip QA.
- `$threejs-audio-haptics`: Web Audio graphs, spatial cues, stealth sound propagation, music states, SFX pooling, compression budgets, gamepad haptics.
- `$threejs-ui-accessibility`: HUDs, menus, overlays, touch controls, gamepad prompts, focus management, contrast, accessibility semantics.
- `$threejs-qa-automation`: Playwright browser smoke tests, screenshots, visual regression, canvas-pixel checks, debug metric assertions, trace artifacts.
- `$shadow-recruit-game-tester`: gameplay evidence review, screenshot feedback, player-readability findings, FPS artifact review, tester reports.
- `$shadow-recruit-release-manager`: SemVer buckets, changelog entries, validation gates, version source updates, commits, pushes.

If several apply, start with the skill that owns the riskiest decision, then loop back here for production prioritization.

## Review Lens

Evaluate in this order:

- Player readability: goal, threat, interactable, cover, exit, current state, and next state are visible from the gameplay camera.
- Feel: movement, camera, hit/reveal timing, stealth consequence, and animation timing are legible before adding content volume.
- Production leverage: prefer reusable systems, debug controls, authoring data, and repeatable asset pipelines over one-off scene edits.
- Technical fit: keep render meshes, collision proxies, gameplay state, and asset metadata separate.
- Verification: every slice needs tests, browser smoke, screenshots, or debug metrics that make regressions visible.

## Shadow Recruit 2 Bar

Treat Shadow Circuit as a useful baseline, not a template to copy. Shadow Recruit 2 should improve on it through clearer mission pacing, stronger third-person/camera language, better asset pipelines, richer NPC and enemy behaviors, more deliberate memory budgets, and more cinematic presentation without sacrificing browser stability.

## Advanced Production Triage

Use this triage before approving a feature slice:

- **Playable first:** prove the core loop with primitives, debug toggles, and fallback art before committing cinematic assets.
- **Signal over volume:** prefer one readable encounter with clear camera, animation, sound, and UI feedback over many thin levels.
- **Evidence gate:** require at least one artifact for any visual claim: screenshot, short capture, debug overlay numbers, or browser smoke result.
- **Regression gate:** require a repeatable way to enter, reset, and replay the new state before adding adjacent content.
- **Geometry gate:** ask `$threejs-level-geometry-validator` before accepting new rooms, walls, collision proxies, nav blockers, or generated modular level kits.
- **60 FPS gate:** require visible gameplay to keep a 60 FPS path, or require an explicit lower-cost quality profile before approving the slice.
- **Budget gate:** ask `$threejs-memory` before accepting heavier GLBs, generated textures, extra postprocessing, or more live actors.
- **Renderer gate:** ask `$threejs-webgpu-webgl-expert` before approving WebGPU-only effects, custom shaders, transparency-heavy passes, or postprocessing stacks.
- **QA gate:** ask `$threejs-qa-automation` for smoke, visual, input, accessibility, and frame pacing evidence before release.

## Feature Slice Rubric

Classify every proposed slice before routing work:

- **Foundation:** build missing architecture, debug hooks, test harnesses, loading, or registry support.
- **Feel:** tune camera, input, animation timing, hit reactions, stealth feedback, VFX, and audio timing.
- **Content:** add levels, props, characters, enemies, encounters, cutscenes, or missions after foundation and feel hold.
- **Polish:** improve fidelity, transitions, lighting, UI, and screenshots after core readability is stable.

If a slice spans multiple classes, split it and land the foundation or feel piece first.

## Director QA Shots

For a meaningful director pass, request or capture:

- Gameplay camera view at start, peak tension, objective interaction, failure, and success.
- Debug view showing collision proxies, line of sight, active state, FPS, draw calls, and memory counters.
- Close-up asset/animation view for any new hero, enemy, rig, or generated prop.
- Mobile or narrow viewport shot if UI, touch, camera, or performance changes.

## Output Shape

Lead with findings or direction, then next patches:

```text
Direction
- Target player result.
- Biggest blocker.
- Specialist skill to use next, if any.

Next patches
- System/file: concrete change.
- Art/assets: concrete change.
- QA: exact test, screenshot, or metric to capture.
```

## References

Read `references/sources.md` when source-backed current context is needed.
