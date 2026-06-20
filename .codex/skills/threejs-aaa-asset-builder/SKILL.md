---
name: threejs-aaa-asset-builder
description: Build game-ready Three.js GLB asset pipelines with Meshy, Tripo, glTF, rigging, retargeting, animation clips, remesh decisions, loader integration, and runtime validation. Use when Codex needs AI 3D generation, GLB authoring, Meshy or Tripo API planning, character rigs, animation retargeting, asset manifests, or cinematic asset upgrades.
---

# Three.js AAA Asset Builder

## Production Goal

Use this skill to turn art direction into runtime-safe GLB assets. Favor reusable, validated GLB files with metadata, explicit provenance, loader support, and no visible primitive stand-ins over one-off meshes hidden inside scene code.

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
9. Validate in the browser with screenshots, animation playback, no-visible-fallback behavior, renderer metrics, and memory scan.

## AAA Environment Dressing

Use this section when a large level reads as empty or blockout-quality:

- Treat size as neutral. A wide room with repeated wall/floor material and no tactical set dressing is a failed art-direction pass, not an AAA improvement.
- Build modular dressing kits around gameplay purpose: cover, terminals, security gates, vents, cable trays, light bars, hazard stripes, crates, wall machinery, surveillance fixtures, extraction equipment, signage, floor decals, and patrol landmarks.
- Require each major zone to have a prop-density and landmark brief before generating assets. Include camera distance, expected silhouette from gameplay view, collision proxy policy, triangle/material budget, and whether the item is interactable or visual dressing.
- Prefer reusable GLB kits and generated texture atlases over unique one-off meshes. Keep repeated props instanced where possible and route budgets to `$threejs-memory`.
- For screenshots that look empty, produce an asset gap list with coordinates/room IDs, not just art adjectives. The level world builder should know where to place the kit, and the tester should be able to verify it later.
- Title-screen hero upgrades must show readable recruit identity: face/visor/front torso, gear silhouette, and pose direction. If the model faces away in title screenshots, request a camera/animation/staging change before generating more decoration.
- Texture upgrades must produce generated image or authored PBR maps that are actually assigned to the wall, floor, door, or prop meshes being reviewed. A strong prompt or source plate does not count if the runtime mesh still renders flat procedural color, stretched panels, missing seams, or obvious repetition at gameplay camera distance.
- Empty-space fixes should ship as reusable kit pieces with coordinates and budgets: terminals, keycard readers, cable trays, wall machinery, floor decals, overhead lights, vents, crates, extraction beacons, sentry bases, and door trim. Prefer instanced repeats and texture atlases so the 60 FPS path survives.
- Build asset assignments from the camera problem: name the screenshot, zone coordinates, missing foreground/midground/background layer, and intended runtime mesh or GLB before spending provider credits. A beautiful close-up asset fails if it does not fix the empty gameplay view that triggered the request.

## Mesh And Rig Rules

- Keep gameplay collision in authored proxies, not high-detail mesh triangles.
- Prefer modular props and kit pieces over monolithic level models.
- Use low-poly or remesh controls for repeated assets and mobile-visible actors.
- For humanoids, require clean pose, rig-check, skeleton metadata, and a minimal locomotion set before runtime integration.
- For retargeting, verify bind pose, scale, bone naming, foot contact, root motion policy, and loop seams.
- For Shadow Recruit production builds, do not approve visible primitive or procedural stand-ins for required gameplay objects. Required GLBs should load through the asset registry or fail QA loudly; optional dressing may be omitted with diagnostics, but the tester must not treat an omitted or placeholder prop as AAA-ready.
- Validate vertex count, material count, texture dimensions, animation clip names, skeleton count, morph targets, and node hierarchy before accepting a GLB.
- Keep pivots consistent: props usually bottom-center or interaction point; characters at ground contact between feet; doors/gates at hinge or path origin.
- Freeze naming contracts for nodes, clips, sockets, and attachment points before gameplay code depends on them.

## Acceptance Checklist

Accept a generated GLB only when:

- It loads through the project GLTFLoader path without console errors.
- It has a documented runtime path, source prompt/reference, provider, task metadata, license/provenance, budget, and explicit no-visible-fallback or authored replacement policy.
- It renders correctly in the gameplay camera and in a close-up debug viewer.
- Required animations loop or transition cleanly and match gameplay root-motion policy.
- Collision proxies, interaction bounds, and nav blockers are authored outside the render mesh.
- `$threejs-memory` confirms payload and decoded texture/geometry pressure fit the current scene budget.
- It improves the relevant gameplay screenshot at the intended camera distance; close-up quality alone is not enough if the asset still reads as clutter or empty space in play.

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
