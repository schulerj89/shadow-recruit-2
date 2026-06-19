---
name: threejs-webgpu-webgl-expert
description: Design, audit, and optimize Three.js WebGPU/WebGL renderer architecture, shader/material paths, postprocessing, lighting, renderer.info instrumentation, and browser fallbacks. Use when Codex touches renderer setup, WebGPURenderer, WebGLRenderer, TSL/node materials, shader portability, frame pacing, GLTF loader decoder setup, or graphics performance.
---

# Three.js WebGPU/WebGL Expert

## Renderer Strategy

Keep WebGL stable as the baseline until the project has explicit WebGPU acceptance tests. Treat WebGPU as an optional path for node materials, compute-oriented future work, or high-instance workloads, and keep fallback behavior visible in code and tests.

1. Measure the current scene before changing renderer behavior: FPS, draw calls, triangles, geometries, textures, pixel ratio, shadow settings, and active postprocessing.
2. Verify browser capability, then choose WebGLRenderer or WebGPURenderer deliberately.
3. Keep material and shader decisions compatible with the selected renderer path.
4. Validate visible output with browser screenshots and renderer counters.

Default target: keep interactive gameplay at 60 FPS. Treat 16.7 ms/frame as the frame budget, and require a lower-cost quality profile before accepting renderer features that exceed it.

## WebGPU Rules

- Probe `navigator.gpu` and adapter/device creation before assuming WebGPU availability.
- Treat adapter failure as expected behavior and provide a WebGL fallback.
- Handle `device.lost` and recreate all device-owned resources when WebGPU is active.
- Log adapter features and limits only as diagnostics; do not require optional features unless the fallback path is tested.
- Prefer Three.js node materials or TSL for new renderer-portable shader work.
- Avoid new WebGL-only `onBeforeCompile` customization unless the feature is explicitly WebGL-only or has a fallback material.
- Record the selected backend in the debug API so smoke tests can assert it.

## WebGL Rules

- Use `renderer.setAnimationLoop()` for the main loop.
- Cap pixel ratio by quality profile; do not bind rendering cost directly to device pixel ratio.
- Use `renderer.info` as a trend counter, not a complete memory accounting system.
- Use `compileAsync()` or staged preload for shader-heavy scene transitions when first-frame hitches matter.
- Prefer opaque or alpha-tested materials before transparent blending.
- Keep shadows, transmission, high sample counts, and postprocessing earned by measured frame budget.

## Advanced Graphics Decisions

- Prefer `InstancedMesh` for many copies of the same geometry/material and `BatchedMesh` for many objects that share one material but use different geometries or transforms.
- Recompute bounds after changing instance transforms or batched geometry visibility so culling remains correct.
- Keep postprocessing passes explicit and budgeted. Every pass should disclose render target size, sample count, and whether it reads depth, normals, velocity, or color.
- Use `compileAsync()` after lighting and environment setup for expensive first-use materials, especially new GLB actors or shader-heavy effects.
- Keep color management stable: document output color space, tone mapping, exposure, environment map, and render target color space when changing materials or post.
- Prefer shader uniforms or node parameters for runtime variation instead of creating new materials per object.
- Treat readbacks, screenshot extraction, and picking buffers as stalls unless they are isolated from gameplay frames.

## Loader And Asset Integration

When loading GLB/GLTF assets, configure decoder support deliberately:

- `GLTFLoader.setDRACOLoader()` for Draco-compressed geometry.
- `GLTFLoader.setKTX2Loader()` and `KTX2Loader.detectSupport(renderer)` for GPU-compressed textures.
- `GLTFLoader.setMeshoptDecoder()` for meshopt-compressed assets.
- Reuse decoder instances instead of creating them per load.

Route GLB generation, rigging, and retargeting to `$threejs-aaa-asset-builder`. Route memory or disposal concerns to `$threejs-memory`.

## QA Gates

- Capture at least one visible browser screenshot after renderer/material changes.
- Assert nonblank canvas pixels for 3D scenes.
- Prove a visible 60 FPS path or document the fallback quality profile that restores it.
- Log or expose draw calls, triangles, geometries, textures, backend, pixel ratio, and asset load errors.
- Test both the preferred backend and fallback when possible.
- Compare one low-end profile and one cinematic profile when a change affects shadows, postprocessing, transparency, or generated assets.
- Include a shader-warmup or first-interaction check for new materials so compile stutter is visible before release.

## References

Read `references/sources.md` for researched primary docs and current links.
