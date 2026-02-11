---
model: opus
---
# Review: Evaluate the Story Opening

You are the quality review step. Your job is to evaluate the story opening paragraph and either approve it or send it back for revision.

## Instructions

### 1. Read All Artifacts

Read these files:

- `<run_dir>/context/research.md` — the original Wikipedia research
- `<run_dir>/context/story-opening.md` — the story paragraph to review

If `<run_dir>/context/review-feedback.json` exists from a previous loop, read it to check whether your prior feedback was addressed.

### 2. Evaluate Quality

Score each dimension 1-10:

**Originality (weight: 30%)**
- Is this clearly original fiction, not a Wikipedia summary?
- Does it offer a fresh, unexpected angle on the subject?
- Would a reader find this opening surprising or intriguing?

**Writing Quality (weight: 30%)**
- Is the prose vivid, well-crafted, and engaging?
- Does it show rather than tell?
- Is the language precise without being overwrought?

**Factual Integration (weight: 20%)**
- Does it weave in real information about robots naturally?
- Are the facts used creatively rather than listed?
- Does the research enhance rather than constrain the story?

**Narrative Hook (weight: 20%)**
- Does the opening make you want to read more?
- Is there a clear character, situation, or question established?
- Does it create tension, mystery, or emotional resonance?

### 3. Make Decision

Calculate weighted score: `total = originality*0.3 + quality*0.3 + factual*0.2 + hook*0.2`

**PASS (score >= 7.0):**
- Leave `**next_step**` as `auto` — the workflow will proceed to the final step
- Write a brief congratulatory note with your scores and any minor suggestions

**FAIL (score < 7.0):**
- Write detailed feedback to `<run_dir>/context/review-feedback.json`:
  ```json
  {
    "revision_count": 1,
    "scores": {
      "originality": 6,
      "writing_quality": 7,
      "factual_integration": 5,
      "narrative_hook": 6,
      "weighted_total": 6.1
    },
    "issues": [
      {
        "dimension": "originality",
        "issue": "The opening reads too much like a summary",
        "suggestion": "Focus on a specific character's experience with robots rather than describing robots in general"
      }
    ],
    "notes": "Good prose but needs a stronger creative angle"
  }
  ```
- Set `**next_step**` to `002` to send it back to the creation step
- Increment `revision_count` from any existing review-feedback.json

**MAX REVISIONS (revision_count >= 3):**
- After 3 revision loops, PASS regardless of score
- Note the caveats in your output
- Leave `**next_step**` as `auto`

### 4. Write Step Output

Write to your output file:
- Scores for each dimension
- Weighted total score
- PASS/FAIL decision with reasoning
- If FAIL: specific issues and suggestions
- If PASS: any minor polish suggestions
