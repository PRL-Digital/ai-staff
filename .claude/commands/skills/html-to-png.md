---
name: html-to-png
description: Renders HTML (with Tailwind CSS support) to a compressed PNG image. Use when the user wants to convert HTML to an image, create social cards, OG images, or any HTML-based visual output as PNG.
allowed-tools: Bash(node src/scripts/html-to-png.js:*)
---

# HTML to PNG Renderer

Render HTML files to compressed PNG images using a real browser (Playwright) with automatic Tailwind CSS CDN injection.

## Usage

```bash
# Basic: render HTML to PNG at default 1200x630 (OG/social image size)
node src/scripts/html-to-png.js <html-file>

# Custom viewport dimensions
node src/scripts/html-to-png.js <html-file> --width 1080 --height 1080

# Capture full page height (not just viewport)
node src/scripts/html-to-png.js <html-file> --full-page

# Specify output path
node src/scripts/html-to-png.js <html-file> --output output/images/card.png

# All options combined
node src/scripts/html-to-png.js card.html --width 1200 --height 630 --output output/images/og-card.png
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
3. Opens the HTML in a headless browser via `playwright-cli`
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
- Chain with `resize-image.js` for further resizing or format conversion.

## Workflow Example

```bash
# 1. Write HTML with Tailwind classes (done by Claude)
# 2. Render to PNG
node src/scripts/html-to-png.js output/images/card.html --width 1200 --height 630
# 3. Optionally resize/crop the result
node src/scripts/resize-image.js output/images/<uuid>.png --resize 600x315
```
