---
name: resize-image
description: Resizes, crops, and converts images between formats (PNG, JPEG, WebP). Use when the user wants to resize, crop, compress, or convert an image file.
allowed-tools: Bash(tsx src/scripts/resize-image.ts:*)
---

# Image Resize, Crop & Convert

Resize, crop, and convert images using sharp. Supports PNG, JPEG, and WebP formats with automatic compression.

## Usage

```bash
# Resize (fit within dimensions, preserving aspect ratio)
tsx src/scripts/resize-image.ts <image> --resize 400x400

# Crop to exact dimensions from center
tsx src/scripts/resize-image.ts <image> --crop 1080x1080

# Crop a specific region (WxH at offset +X+Y)
tsx src/scripts/resize-image.ts <image> --crop 400x300+100+50

# Convert format
tsx src/scripts/resize-image.ts <image> --format webp

# Resize + convert + custom quality
tsx src/scripts/resize-image.ts <image> --resize 800x600 --format jpeg --quality 90

# Specify output path
tsx src/scripts/resize-image.ts <image> --resize 400x400 --output output/images/thumb.png
```

The script outputs the absolute file path of the saved image.

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--resize <W>x<H>` | — | Resize to fit within WxH, preserving aspect ratio |
| `--crop <W>x<H>` | — | Center crop to exact WxH dimensions |
| `--crop <W>x<H>+<X>+<Y>` | — | Extract a region of WxH at offset X,Y |
| `--fit <mode>` | `inside` | Sharp fit mode: `cover`, `contain`, `fill`, `inside`, `outside` |
| `--gravity <pos>` | `centre` | Gravity for cover crop: `centre`, `north`, `south`, `east`, `west`, etc. |
| `--format <fmt>` | input format | Output format: `png`, `jpeg`/`jpg`, `webp` |
| `--quality <n>` | `85` | Quality for JPEG/WebP output (1-100) |
| `--output <path>` | auto | Output file path. Defaults to `output/images/<name>-<dims>.<ext>` |

## Compression

- **PNG**: Always uses max compression (level 9)
- **JPEG**: Default quality 85, adjustable with `--quality`
- **WebP**: Default quality 85, adjustable with `--quality`

## Guidelines

- At least one of `--resize`, `--crop`, or `--format` is required.
- `--resize` preserves aspect ratio by fitting inside the given dimensions (won't enlarge).
- `--crop WxH` (without offsets) does a center crop — resizes to cover then extracts.
- `--crop WxH+X+Y` extracts an exact pixel region from the source.
- You can combine `--crop` and `--resize` (crop runs first, then resize).
- Output filenames are auto-generated with dimensions in the name for clarity.

## Examples

```bash
# Create a thumbnail
tsx src/scripts/resize-image.ts output/images/photo.png --resize 200x200

# Square crop for Instagram
tsx src/scripts/resize-image.ts output/images/photo.png --crop 1080x1080

# Convert PNG to compressed JPEG
tsx src/scripts/resize-image.ts output/images/large.png --format jpeg --quality 80

# Resize an OG image down for Twitter
tsx src/scripts/resize-image.ts output/images/og-card.png --resize 600x314

# Extract a region from a screenshot
tsx src/scripts/resize-image.ts output/images/screenshot.png --crop 400x300+100+200
```
