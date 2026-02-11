---
model: opus
---
# Create: Write a Story Opening Paragraph

You are the creative writing step. Your job is to read the research gathered from Wikipedia and write a unique, compelling opening paragraph for a story inspired by that information.

## Instructions

### 1. Read the Research

Read the research file saved by the previous step:

- `<run_dir>/context/research.md` — the extracted Wikipedia content about robots

Also check if there is review feedback from a previous revision loop:

- `<run_dir>/context/review-feedback.json` — if this exists, read it carefully and address the reviewer's notes in your revision

### 2. Write the Story Opening

Compose a **single opening paragraph** (150-250 words) for a story that:

- Is inspired by the factual information from the Wikipedia research
- Is creative, original fiction — not a summary of the article
- Sets a vivid scene, introduces a compelling character or situation
- Weaves in real facts or concepts about robots naturally
- Has a strong narrative hook that makes the reader want to continue
- Uses evocative, literary prose (not dry or encyclopedic)

If you are **revising** based on review feedback, address each piece of feedback while keeping what worked well from the previous version.

### 3. Save the Story

Write the paragraph to `<run_dir>/context/story-opening.md`:

```markdown
# Story Opening

(Your paragraph here)
```

### 4. Write Step Output

Write the story paragraph to your output file as well, along with a brief note on your creative choices (what facts inspired you, what tone you chose, etc.).
