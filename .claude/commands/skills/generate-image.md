---
name: generate-image
description: Generates an image from a text prompt using Google Gemini. Use when the user asks you to create, generate, draw, or make an image, picture, illustration, or graphic.
allowed-tools: Bash(node --env-file=.env src/scripts/generate-image.js:*)
---

# Image Generation with Gemini

Generate images by running the generate-image script with a descriptive prompt. Optionally pass reference images with `--ref` to maintain visual consistency (same characters, art style, scene elements).

## Usage

```bash
# Text-only prompt
node --env-file=.env src/scripts/generate-image.js "<prompt>"

# With reference images
node --env-file=.env src/scripts/generate-image.js "<prompt>" --ref <image-or-folder> [--ref <image-or-folder>]...
```

The script outputs the absolute file path of the saved image.

## Reference Images (`--ref`)

Use `--ref` to pass one or more reference images (or a folder of images) alongside the prompt. This tells the model to use those images as visual context -- for example to keep a character's appearance consistent or match an art style.

- **Single image**: `--ref output/images/character.png`
- **Multiple images**: `--ref person1.png --ref person2.png`
- **Folder**: `--ref output/images/style-refs/` (all supported images in the folder are included)
- **Supported formats**: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`
- **Limits**: up to 10 images, each under 20 MB

When using `--ref`, write your prompt so it refers to the provided images (e.g. "the same character from the reference image, now sitting in a cafe").

## Guidelines

- Write detailed, descriptive prompts for better results. Include style, mood, colors, composition, and subject details.
- The image is saved to `output/images/` as a JPEG or PNG.
- After generating, read the output file path to display the image to the user.
- If the API returns a rate limit error (429), inform the user and suggest waiting a minute before retrying.
- When generating multiple related images, use `--ref` with earlier outputs to maintain consistency.

## Examples

```bash
# Simple text-only generation
node --env-file=.env src/scripts/generate-image.js "a watercolor painting of a cozy cabin in the woods at sunset, warm golden light, autumn leaves"

# Generate a new scene with a consistent character
node --env-file=.env src/scripts/generate-image.js "the same character from the reference, now sitting in a bustling coffee shop, same art style" --ref output/images/abc123.png

# Use a folder of style reference images
node --env-file=.env src/scripts/generate-image.js "a new landscape in the same artistic style as the references" --ref output/images/style-refs/

# Multiple specific references
node --env-file=.env src/scripts/generate-image.js "group portrait of these two characters together in a park" --ref output/images/char-a.png --ref output/images/char-b.png
```

Then read the returned file path to show the image.
