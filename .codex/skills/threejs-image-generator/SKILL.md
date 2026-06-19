---
name: threejs-image-generator
description: Generate and curate GPT Image 2 visual assets for Three.js game development, including concept sheets, orthographic prop references, character turnaround plates, UI art, texture references, and image-to-3D source plates. Use when Codex needs OpenAI image generation for Shadow Recruit 2 or any Three.js game asset workflow.
---

# Three.js Image Generator

## Scope

Use this skill to create bitmap references that improve game production: concept art, orthographic prop plates, character sheets, UI explorations, texture references, and source images for Meshy or Tripo workflows. Do not treat generated images as final 3D assets without follow-up validation.

## Credential Handling

- Prefer `OPENAI_API_KEY`.
- If the environment variable is absent, the helper script may read `OPENAI_API_KEY_FILE`.
- In this workspace, the local fallback path is `C:\Users\joshs\Projects\openai_key.txt`.
- Never print, commit, copy into docs, or include API keys in prompts, logs, metadata, or generated files.

## Generation Workflow

1. Define the production job: concept, source plate, texture reference, UI image, or marketing/screenshot support.
2. Write a prompt with camera, silhouette, material, palette, scale, and constraints.
3. For 3D source plates, request isolated subjects, orthographic views, neutral lighting, no logos, no readable text, and A-pose or T-pose when rigging may follow.
4. Generate into `artifacts/imagegen/` by default. Move only curated, non-secret outputs into committed docs or asset folders.
5. Inspect the image visually before handing it to `$threejs-aaa-asset-builder`.
6. Record the prompt, model, quality, size, and output path in non-secret metadata when the output becomes part of the art pipeline.

## Advanced Prompt Contracts

Use the right prompt contract for the downstream job:

- **Concept sheet:** request multiple labeled design variants only for internal direction. Do not feed text-heavy sheets directly into image-to-3D.
- **3D source plate:** request one isolated subject, neutral lighting, centered composition, clear silhouette, no text, no logos, minimal shadow, and camera angle named explicitly.
- **Character turnaround:** request front, side, and back views with matching scale, consistent outfit, A-pose or T-pose, hands visible, and no perspective distortion.
- **Texture reference:** request flat material swatches or tileable surfaces with scale cues, no baked dramatic lighting, and no UI overlays.
- **UI art:** request exact aspect ratio, safe margins, and export format, then validate legibility in the actual game viewport before committing.

When using image edits or references, preserve the production intent: describe what must remain unchanged and what may change. Reject outputs with ambiguous silhouettes, extra limbs, unreadable topology cues, inconsistent turnarounds, or baked shadows that will fight runtime lighting.

## GPT Image 2 Defaults

- Model: `gpt-image-2`.
- Quality: use `low` for fast iteration, `medium` for normal production references, `high` for final source plates.
- Size: use standard sizes for general work, or custom dimensions divisible by 16 when composition requires it.
- Format: use `png` for source plates and transparent backgrounds, `webp` or `jpeg` for lightweight docs and mood boards.
- Use `output_compression` for webp/jpeg documentation assets, not source plates that need maximum detail.
- Use transparent backgrounds only when the selected GPT image model and output format support them; otherwise request an opaque neutral background and remove it downstream if needed.

## Curation Rules

- Keep at least two rejected outputs during active art direction only if they teach the next prompt; delete stale rejects before commit.
- Store prompt metadata beside accepted images, but never store API responses containing private URLs or credentials.
- Run `$threejs-memory` before promoting large generated images into runtime textures.
- Run `$threejs-aaa-asset-builder` before using any source plate for GLB generation.

## Helper Script

Use `scripts/generate_image_asset.mjs` for deterministic file output:

```powershell
node .codex/skills/threejs-image-generator/scripts/generate_image_asset.mjs --prompt "orthographic front view of a compact cyber stealth drone, isolated, neutral gray background, no text" --out artifacts/imagegen/drone-front.png --size 1024x1024 --quality medium
```

Run with `--help` for all options.

## Handoff Rules

- Use `$threejs-aaa-asset-builder` after generating a model source plate.
- Use `$threejs-webgpu-webgl-expert` before committing images as runtime textures if compression, color space, or shader use matters.
- Use `$threejs-memory` if generated images increase texture payload or decoded texture memory.

## References

Read `references/sources.md` before changing model names, API fields, sizes, or quality options.
