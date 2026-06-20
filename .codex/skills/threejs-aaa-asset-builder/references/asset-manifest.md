# GLB Asset Manifest

Use a manifest before spending Meshy or Tripo credits. Keep it non-secret and commit only production-relevant metadata.

## Shape

```json
{
  "kit": "blacksite-props",
  "runtimeRoot": "public/assets/blacksite-props",
  "metadataRoot": "tools/asset-generation/generated/blacksite-props",
  "assets": [
    {
      "id": "security-terminal-a",
      "provider": "meshy",
      "kind": "prop",
      "prompt": "compact wall-mounted cyber security terminal, chunky silhouette, readable from top-down gameplay camera, no logo, no text",
      "sourceImage": "artifacts/imagegen/security-terminal-a.png",
      "targetFormats": ["glb"],
      "budgetBytes": 6000000,
      "collision": "box proxy 1.2 x 0.2 x 1.6 meters",
      "origin": "bottom-center",
      "scaleMeters": 1.6,
      "runtimePath": "public/assets/blacksite-props/security-terminal-a.glb",
      "notes": "Required objective prop; fail QA if the GLB is missing or replaced by a visible primitive stand-in."
    }
  ]
}
```

## Required Asset Fields

- `id`: lowercase hyphen id, stable in registries and metadata.
- `provider`: `meshy`, `tripo`, or `manual`.
- `kind`: `prop`, `character`, `environment`, `weapon`, `vfx`, `ui-3d`, or project-specific value.
- `prompt` or `sourceImage`: enough direction to reproduce the generation.
- `targetFormats`: include `glb` unless there is a strong reason not to.
- `budgetBytes`: maximum accepted runtime file size.
- `collision`: authored proxy description.
- `runtimePath`: final intended path.

## Optional Character Fields

- `pose`: `a-pose` or `t-pose`.
- `rig`: provider rig type or target skeleton.
- `retargetSpec`: target format such as `mixamo` or project-specific skeleton.
- `animations`: required clip list, for example `idle`, `walk`, `run`, `alert`, `attack`, `hit`, `down`.

Never include API keys, signed URLs, bearer tokens, or private file URLs.
