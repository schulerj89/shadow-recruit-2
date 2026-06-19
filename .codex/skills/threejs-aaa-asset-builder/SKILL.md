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

## Advanced Provider Workflow

- **Meshy preview/refine:** use preview for shape approval, then refine for texture. Do not refine weak silhouettes.
- **Meshy remesh:** use after generated topology is too dense, uneven, or unsuitable for repeated gameplay props. Preserve the pre-remesh model only as metadata or artifact, not as runtime default.
- **Meshy rigging/animation:** use only for clearly humanoid bipeds with separated limbs and clean pose. Rig first, then apply animation actions.
- **Tripo generation:** poll asynchronous tasks, download expiring model URLs immediately, and keep non-secret task IDs in metadata.
- **Tripo rig/retarget:** run rig-check before rigging, then retarget a minimal locomotion/action set before building code integration.
- **Manual/glTF Transform:** use when fixing, splitting, optimizing, or inspecting GLBs without changing the artistic source.

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
- Validate vertex count, material count, texture dimensions, animation clip names, skeleton count, morph targets, and node hierarchy before accepting a GLB.
- Keep pivots consistent: props usually bottom-center or interaction point; characters at ground contact between feet; doors/gates at hinge or path origin.
- Freeze naming contracts for nodes, clips, sockets, and attachment points before gameplay code depends on them.

## Acceptance Checklist

Accept a generated GLB only when:

- It loads through the project GLTFLoader path without console errors.
- It has a documented runtime path, source prompt/reference, provider, task metadata, license/provenance, budget, and fallback.
- It renders correctly in the gameplay camera and in a close-up debug viewer.
- Required animations loop or transition cleanly and match gameplay root-motion policy.
- Collision proxies, interaction bounds, and nav blockers are authored outside the render mesh.
- `$threejs-memory` confirms payload and decoded texture/geometry pressure fit the current scene budget.

## Three.js Integration

- Load GLB/GLTF through `GLTFLoader`.
- Configure DRACO, KTX2, and meshopt decoders when assets use those extensions.
- Use one `AnimationMixer` per independently animated actor.
- Stop and uncache actions when unloading actors.
- Route renderer compatibility to `$threejs-webgpu-webgl-expert` and memory budget checks to `$threejs-memory`.
- Remember that glTF stores animation data but runtime behavior such as auto-start, looping, and clip mapping is the engine's responsibility.

## Helper Script

Use `scripts/plan_glb_asset_manifest.mjs` to validate a manifest and print provider-specific production steps before spending API credits.

```powershell
node .codex/skills/threejs-aaa-asset-builder/scripts/plan_glb_asset_manifest.mjs path\to\asset-manifest.json
```

## References

Read `references/sources.md` before changing Meshy, Tripo, glTF, loader, rigging, or retarget assumptions.
