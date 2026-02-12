---
name: html-to-png
description: Renders HTML (with Tailwind CSS support) to a compressed PNG image. Use when the user wants to convert HTML to an image, create social cards, OG images, or any HTML-based visual output as PNG.
allowed-tools: Bash(tsx src/scripts/html-to-png.ts:*)
---

# HTML to PNG Renderer

Render HTML files to compressed PNG images using a real browser (agent-browser) with automatic Tailwind CSS CDN injection.

## Usage

```bash
# Basic: render HTML to PNG at default 1200x630 (OG/social image size)
tsx src/scripts/html-to-png.ts <html-file>

# Custom viewport dimensions
tsx src/scripts/html-to-png.ts <html-file> --width 1080 --height 1080

# Capture full page height (not just viewport)
tsx src/scripts/html-to-png.ts <html-file> --full-page

# Specify output path
tsx src/scripts/html-to-png.ts <html-file> --output output/images/card.png

# All options combined
tsx src/scripts/html-to-png.ts card.html --width 1200 --height 630 --output output/images/og-card.png
```

The script outputs the absolute file path of the saved PNG.

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--width` | `1200` | Viewport width in pixels |
| `--height` | `630` | Viewport height in pixels |
| `--full-page` | off | Capture the full scrollable page, not just the viewport |
| `--output` | auto | Output file path. Defaults to `output/images/<uuid>.png` |

## How It Works

1. Reads the HTML file
2. Injects the Tailwind CSS CDN `<script>` if not already present
3. Opens the HTML in a headless browser via `agent-browser`
4. Waits for styles to load (network idle)
5. Takes a screenshot at the specified viewport dimensions
6. Compresses the PNG with sharp (compression level 9)
7. Outputs the final file path

## Guidelines

- Write the HTML file first (e.g., to `output/images/card.html`), then run this script on it.
- Use Tailwind CSS classes freely — the CDN is injected automatically.
- Default dimensions (1200x630) are standard for OG/social media images.
- For Instagram-style square images, use `--width 1080 --height 1080`.
- The output PNG is max-compressed for smaller file sizes.
- After rendering, read the output path to show the image to the user.
- Chain with `resize-image.ts` for further resizing or format conversion.

## Workflow Example

```bash
# 1. Write HTML with Tailwind classes (done by Claude)
# 2. Render to PNG
tsx src/scripts/html-to-png.ts output/images/card.html --width 1200 --height 630
# 3. Optionally resize/crop the result
tsx src/scripts/resize-image.ts output/images/<uuid>.png --resize 600x315
```
