# Source Notes

Research date: 2026-06-19.

## OpenAI Image Generation

- Image generation guide: https://developers.openai.com/api/docs/guides/image-generation
  - The OpenAI API supports generating and editing images with GPT Image models, including `gpt-image-2`.
  - Some organizations may need API organization verification before using GPT Image models.
  - The Image API and Responses API both support customization of quality, size, format, and compression, while transparent background support depends on the model.
- Image create reference: https://developers.openai.com/api/reference/resources/images/methods/generate
  - GPT image models support `background`, `output_format`, `quality`, streaming options, and base64 output.
  - `gpt-image-2` supports custom `WIDTHxHEIGHT` sizes with width/height divisible by 16, aspect ratio limits, and documented maximums.
  - GPT image outputs return base64 data by default rather than long-lived URLs.
- GPT Image 2 model page: https://developers.openai.com/api/docs/models/gpt-image-2
  - `gpt-image-2` is documented as a state-of-the-art image generation and editing model with flexible sizes and image input/output support.
- GPT Image prompting guide: https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide
  - `low` quality is useful for latency-sensitive iterations; `medium` and `high` fit fidelity-focused work.

Re-check the official docs before changing model IDs, size rules, quality choices, endpoint fields, or response handling.
