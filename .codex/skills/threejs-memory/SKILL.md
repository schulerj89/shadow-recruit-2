---
name: threejs-memory
description: Audit and control Three.js browser memory, GPU resource lifetime, GLB and texture payload budgets, renderer.info trends, scene reset leaks, loader caches, and asset disposal. Use when Codex investigates memory pressure, mobile crashes, rising renderer.info counts, large assets, scene streaming, or cleanup after renderer/gameplay changes.
---

# Three.js Memory

## Measurement First

Use this skill when memory or resource lifetime can affect browser stability. Start from observed counters and asset inventory, not guesses.

Track:

- `renderer.info.render.calls`, triangles, points, and lines.
- `renderer.info.memory.geometries` and textures.
- App-owned counts for loaded asset IDs, live actors, live chunks, pooled objects, mixers, render targets, and active effects.
- File payload totals for GLB, textures, audio, and generated assets.
- Browser heap when `performance.memory` is available, treating it as browser-specific telemetry.

## Disposal Rules

- Removing an object from the scene does not dispose GPU resources.
- Dispose `BufferGeometry`, `Material`, `Texture`, render targets, and custom GPU resources when their owner unloads.
- Handle material arrays and texture properties explicitly.
- Stop animation actions before `AnimationMixer.uncacheAction`, `uncacheClip`, or `uncacheRoot`.
- Do not dispose shared resources without ownership, reference counting, or an asset-cache release API.
- Reuse geometries, materials, loaders, decoder instances, and textures for repeated props.

## Asset Budget Rules

- GLB file size is not decoded runtime memory. Track both payload and expected decoded texture/geometry pressure.
- Draco and meshopt can reduce transfer size, but decoded geometry still consumes runtime memory.
- KTX2/Basis textures can reduce GPU texture memory and bandwidth compared with PNG/JPEG runtime uploads.
- Mipmaps add memory overhead but usually improve 3D texture sampling and distant rendering quality.
- Large generated images should be resized or compressed before runtime use.
- Required gameplay assets need primitive fallbacks so cinematic assets can fail or unload gracefully.

## Workflow

1. Inventory current assets with `scripts/scan_asset_budget.mjs`.
2. Capture renderer and app-owned counters before the feature/change.
3. Exercise scene load, interaction, reset, and unload loops.
4. Capture the same counters after each loop.
5. Fix ownership or cache-release bugs before reducing visual quality.
6. Add smoke checks for count regressions and asset load failures.

## Helper Script

```powershell
node .codex/skills/threejs-memory/scripts/scan_asset_budget.mjs public/assets --max-total-mb 80 --largest 20
```

Use `--json` for machine-readable output.

## References

Read `references/sources.md` for current Three.js and WebGL memory/disposal sources.
