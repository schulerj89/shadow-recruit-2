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
