# Agent Notes

Shadow Recruit 2 starts as a repo-local Codex skill package. Before implementing game code, load the relevant skill under `.codex/skills`.

- Start ambiguous feature, design, or review loops with `$threejs-game-director`.
- Use `$threejs-webgpu-webgl-expert` for renderer, material, shader, WebGPU/WebGL, and GLTF loader decisions.
- Use `$threejs-gameplay-systems` for mechanics, collision, AI, camera, input, progression, and testable simulation state.
- Use `$threejs-image-generator` for GPT Image 2 visual references and source plates. Never commit API keys or generated secret metadata.
- Use `$threejs-aaa-asset-builder` for Meshy, Tripo, GLB, rigging, retargeting, animation, and asset registry work.
- Use `$threejs-memory` for asset budgets, resource disposal, renderer.info trends, and scene reset leaks.

Shadow Circuit in `C:\Users\joshs\Projects\sneak-game` is a baseline reference only. Prefer stronger architecture, clearer player feedback, richer asset pipelines, and better debug/verification coverage over copying old patterns.

Secrets stay outside git. Local key files may exist in `C:\Users\joshs\Projects`, but repo files must reference environment variables or ignored local paths only.

Validate skill edits with:

```powershell
python C:\Users\joshs\.codex\skills\.system\skill-creator\scripts\quick_validate.py .codex\skills\<skill-name>
```
