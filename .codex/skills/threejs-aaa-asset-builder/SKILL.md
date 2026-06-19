---
name: threejs-aaa-asset-builder
description: Build game-ready Three.js GLB asset pipelines with Meshy, Tripo, glTF, rigging, retargeting, animation clips, remesh decisions, loader integration, and runtime validation. Use when Codex needs AI 3D generation, GLB authoring, Meshy or Tripo API planning, character rigs, animation retargeting, asset manifests, or cinematic asset upgrades.
---

# Three.js AAA Asset Builder

## Production Goal

Use this skill to turn art direction into runtime-safe GLB assets. Favor reusable, validated GLB files with metadata, primitive fallbacks, and loader support over one-off meshes hidden inside scene code.

## Credential Handling

- Prefer `MESHY_API_KEY` and `TRIPO_API_KEY`.
- Local key files may exist in `C:\Users\joshs\Projects\meshy-api-key.txt` and `C:\Users\joshs\Projects\tripo-api-key.txt`.
- Never print, commit, or write secrets into manifests, generated metadata, logs, or docs.

## Provider Selection

Use Meshy when the asset is a prop, environment kit piece, source-image conversion, retexture, remesh, or PBR texture experiment. Meshy Text to 3D uses a preview task for untextured shape review, then a refine task for texture.

Use Tripo when the workflow needs current v3 generation, low-poly game-ready output, rig-check, auto-rig, retargeted animation sets, or model processing in one provider pipeline.

Use `$threejs-image-generator` first when a strong source plate, turnaround, or material reference will materially improve the 3D output.

## Asset Workflow

1. Write an asset brief: role, gameplay use, camera distance, silhouette, size, pivot, collision proxy, animation needs, and memory budget.
2. Create or update a manifest. Use `references/asset-manifest.md` for schema guidance.
3. Generate preview geometry first when the provider supports it.
4. Validate shape, pivot, scale, topology, UVs, texture density, and silhouette before accepting texture/refine work.
5. Request GLB output. Prefer A-pose or T-pose for characters and `target_formats: ["glb"]` when supported.
6. Store final runtime assets under a stable path such as `public/assets/<kit>/<asset-id>.glb` or the repo's existing runtime asset folder.
7. Store non-secret provider task metadata under `tools/<provider>/generated/<kit>/<asset-id>.json`.
8. Add or update a typed asset registry instead of scattering string URLs through gameplay code.
9. Validate in the browser with screenshots, animation playback, fallback behavior, renderer metrics, and memory scan.

## Mesh And Rig Rules

- Keep gameplay collision in authored proxies, not high-detail mesh triangles.
- Prefer modular props and kit pieces over monolithic level models.
- Use low-poly or remesh controls for repeated assets and mobile-visible actors.
- For humanoids, require clean pose, rig-check, skeleton metadata, and a minimal locomotion set before runtime integration.
- For retargeting, verify bind pose, scale, bone naming, foot contact, root motion policy, and loop seams.
- Keep primitive or procedural fallbacks for required gameplay objects.

## Three.js Integration

- Load GLB/GLTF through `GLTFLoader`.
- Configure DRACO, KTX2, and meshopt decoders when assets use those extensions.
- Use one `AnimationMixer` per independently animated actor.
- Stop and uncache actions when unloading actors.
- Route renderer compatibility to `$threejs-webgpu-webgl-expert` and memory budget checks to `$threejs-memory`.

## Helper Script

Use `scripts/plan_glb_asset_manifest.mjs` to validate a manifest and print provider-specific production steps before spending API credits.

```powershell
node .codex/skills/threejs-aaa-asset-builder/scripts/plan_glb_asset_manifest.mjs path\to\asset-manifest.json
```

## References

Read `references/sources.md` before changing Meshy, Tripo, glTF, loader, rigging, or retarget assumptions.
