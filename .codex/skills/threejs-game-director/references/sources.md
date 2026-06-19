# Source Notes

Research date: 2026-06-19.

Use these sources when the game director pass needs current grounding or citations.

- Three.js WebGPURenderer docs: https://threejs.org/docs/pages/WebGPURenderer.html
  - WebGPURenderer targets WebGPU when available and can fall back to a WebGL 2 backend.
- Three.js WebGLRenderer docs: https://threejs.org/docs/pages/WebGLRenderer.html
  - `renderer.info` exposes render and memory counters useful for monitoring. `setAnimationLoop()` is the recommended loop entry point.
- Three.js GLTFLoader docs: https://threejs.org/docs/pages/GLTFLoader.html
  - GLB loading can require DRACO, KTX2, or meshopt decoder setup.
- Khronos glTF overview: https://www.khronos.org/gltf/
  - glTF/GLB is a runtime delivery format intended to reduce transmission size and runtime processing.
- OpenAI image generation guide: https://developers.openai.com/api/docs/guides/image-generation
  - GPT Image models, including `gpt-image-2`, support image generation and editing workflows.
- Meshy Text to 3D docs: https://docs.meshy.ai/en/api/text-to-3d
  - Text to 3D uses preview for geometry review, then refine for texturing.
- Tripo API quick start: https://developers.tripo3d.ai/en/docs/quick-start
  - Tripo v3 generation returns asynchronous task IDs; successful tasks expose model URLs for download.

Re-check these pages before making dated claims about model names, API fields, renderer support, or provider behavior.
