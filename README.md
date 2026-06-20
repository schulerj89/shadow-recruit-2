# Shadow Recruit 2

Shadow Recruit 2 is starting with repo-local Codex skills before gameplay implementation. The goal is to make the next Three.js stealth game a stronger successor to Shadow Circuit through better direction, graphics, systems, asset generation, and memory discipline.

## Skill Set

- `.codex/skills/threejs-game-director`
- `.codex/skills/threejs-webgpu-webgl-expert`
- `.codex/skills/threejs-gameplay-systems`
- `.codex/skills/threejs-image-generator`
- `.codex/skills/threejs-aaa-asset-builder`
- `.codex/skills/threejs-memory`
- `.codex/skills/threejs-level-world-builder`
- `.codex/skills/threejs-level-geometry-validator`
- `.codex/skills/threejs-physics-navigation`
- `.codex/skills/threejs-character-animation`
- `.codex/skills/threejs-audio-haptics`
- `.codex/skills/threejs-ui-accessibility`
- `.codex/skills/threejs-qa-automation`
- `.codex/skills/shadow-recruit-game-tester`
- `.codex/skills/shadow-recruit-release-manager`

See `AGENTS.md` for when to use each skill.

## Validation

Browser commands assume the Vite dev server is available on `http://127.0.0.1:5173/`.

```powershell
npm run verify
npm run playthrough:browser
npm run test:browser
npm run test:fps
npm run screenshots
npm run tester:report
```

`npm run test:fps` measures the low-cost `performance` profile by default. Override with `FPS_PROFILE=balanced` or `FPS_PROFILE=cinematic` when comparing richer profiles on a machine that can prove a visible 60 FPS browser baseline.

Skill edits should also run:

```powershell
python C:\Users\joshs\.codex\skills\.system\skill-creator\scripts\quick_validate.py .codex\skills\threejs-game-director
```

Run the same validator for any edited skill before committing.
