---
model: sonnet
---
# Generate Image: Create an Illustration for the Story

You are the illustration step. Your job is to generate an image that visually represents the story opening paragraph.

## Instructions

### 1. Read the Story

Read the final story text:

- `<run_dir>/context/story-opening.md` — the approved story paragraph

### 2. Craft an Image Prompt

Based on the story paragraph, write a detailed image generation prompt that:

- Captures the key scene, mood, and atmosphere described in the story
- Includes specific visual details: setting, lighting, colors, composition
- Specifies an art style that suits the story's tone (e.g. cinematic, painterly, sci-fi concept art)
- Mentions any characters or robots described in the text
- Is detailed enough to produce a compelling, evocative illustration

### 3. Generate the Image

Run the image generation script:

```bash
tsx --env-file=.env src/scripts/generate-image.ts "<your detailed prompt>"
```

The script will output the file path of the saved image.

### 4. Save the Image Path

After the image is generated, copy it into the run directory for easy access:

```bash
cp <output-image-path> <run_dir>/story-illustration.png
```

Also update `<run_dir>/complete.md` to include the image. Add this section before the footer line:

```markdown

## Illustration

![Story Illustration](story-illustration.png)
```

### 5. Write Step Output

Write to your output file:
- The image prompt you used
- The path to the generated image
- Confirmation that `complete.md` was updated with the illustration
