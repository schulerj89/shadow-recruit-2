# Agent Notes

Shadow Recruit 2 starts as a repo-local Codex skill package. Before implementing game code, load the relevant skill under `.codex/skills`.

- Start ambiguous feature, design, or review loops with `$threejs-game-director`.
- Use `$threejs-webgpu-webgl-expert` for renderer, material, shader, WebGPU/WebGL, and GLTF loader decisions.
- Use `$threejs-gameplay-systems` for mechanics, collision, AI, camera, input, progression, and testable simulation state.
- Use `$threejs-image-generator` for GPT Image 2 visual references and source plates. Never commit API keys or generated secret metadata.
- Use `$threejs-aaa-asset-builder` for Meshy, Tripo, GLB, rigging, retargeting, animation, and asset registry work.
- Use `$threejs-memory` for asset budgets, resource disposal, renderer.info trends, and scene reset leaks.
- Use `$threejs-level-world-builder` for mission spaces, traversal readability, encounter layout, streaming boundaries, and world authoring.
- Use `$threejs-physics-navigation` for Rapier-style physics, collision proxies, character controllers, navmeshes, pathfinding, triggers, and scene queries.
- Use `$threejs-character-animation` for AnimationMixer state, clip maps, blend timing, root motion policy, retargeted clips, and animation QA.
- Use `$threejs-audio-haptics` for Web Audio graphs, stealth cues, music states, spatial audio, SFX budgets, and gamepad haptics.
- Use `$threejs-ui-accessibility` for HUDs, menus, responsive overlays, control prompts, focus handling, contrast, and accessible input.
- Use `$threejs-qa-automation` for Playwright smoke tests, visual regression, canvas checks, accessibility snapshots, input simulation, and release evidence.
- Use `$shadow-recruit-release-manager` for SemVer bucketing, changelog maintenance, validation gates, version bumps, commits, and pushes.

Shadow Circuit in `C:\Users\joshs\Projects\sneak-game` is a baseline reference only. Prefer stronger architecture, clearer player feedback, richer asset pipelines, and better debug/verification coverage over copying old patterns.

Secrets stay outside git. Local key files may exist in `C:\Users\joshs\Projects`, but repo files must reference environment variables or ignored local paths only.

## Change Workflow

Always use `CHANGELOG.md` for user-visible, workflow, tooling, skill, or game changes. Keep entries concise and grouped by the version they ship in. If a change is not versioned yet, add it under `Unreleased`.

Before implementing a request, split it into discrete changes and assign each change to exactly one SemVer bucket:

- `major`: breaking project, save-data, API, asset-schema, or workflow changes.
- `minor`: new backwards-compatible features, skills, systems, levels, assets, commands, or capabilities.
- `patch`: fixes, docs, rules, tuning, validation, cleanup, or backwards-compatible refinements.

Work one bucketed change at a time. Do not blend unrelated major, minor, and patch work in a single version bump. If a user asks for multiple changes, maintain a todo list, finish the current bucketed change, update version/changelog, validate, commit, and push before moving to the next bucket.

Whenever a version bump is made, commit and push immediately after the bump, even when more todo items remain. The commit must include the version source and `CHANGELOG.md` entry for that bump.

Validate skill edits with:

```powershell
python C:\Users\joshs\.codex\skills\.system\skill-creator\scripts\quick_validate.py .codex\skills\<skill-name>
```
