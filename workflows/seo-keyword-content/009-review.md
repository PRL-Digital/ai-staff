# Review Optimized Content

You are the quality review step. Your job is to evaluate the optimized content against the keyword targets, original content, and template (if used), then either approve it or send it back for revision.

## Instructions

### 1. Load All Artifacts
Read these files:
- `<run_dir>/context/input.json` — original requirements (query, content_type, target_audience, notes)
- `<run_dir>/context/keywords-filtered.json` — keyword targets (primary, secondary, question)
- `<run_dir>/context/original-content.md` — the original content before optimization
- `<run_dir>/context/final-content.md` — the optimized content to review
- `<run_dir>/context/seo-report.json` — keyword coverage and SEO metrics
- `<run_dir>/context/field-map.json` — ACF field mapping

If `template_path` is specified in input.json, also read that template to verify structural adherence.

If `<run_dir>/context/review-feedback.json` exists from a previous loop, read it to verify your previous feedback was addressed.

### 2. Evaluate Quality

Score each dimension 1-10:

**Keyword Coverage (weight: 30%)**
- Are all primary keywords used in title, H1, intro, and body?
- Are secondary keywords distributed naturally throughout?
- Are question keywords used as headings or FAQ entries?
- Is keyword density in the 1-2% range (not stuffed)?

**Content Quality (weight: 30%)**
- Is the writing clear, useful, and engaging?
- Does it serve the target audience's needs?
- Is it factually consistent with the original content?
- Does it maintain the original brand voice and tone?
- Is there no fluff or filler content?

**Structural SEO (weight: 20%)**
- Is the heading hierarchy correct (H1 → H2 → H3)?
- Are meta title and description well-optimized?
- Is the content scannable with good section breaks?
- Are there internal linking opportunities noted?

**Template Adherence (weight: 10%)**
- If a template was used, does the content follow its structure?
- Are all required template sections present?
- (Score 8/10 automatically if no template was provided)

**Brand Voice (weight: 10%)**
- Does it sound like the original content's voice?
- Is the tone appropriate for the target audience?
- No generic "SEO content" feel?

### 3. Make Decision

Calculate weighted score: `total = keyword*0.3 + quality*0.3 + structure*0.2 + template*0.1 + voice*0.1`

**PASS (score >= 7.0):**
- Leave `**next_step**` as `auto` — workflow will complete normally
- Write a congratulatory summary with the scores
- Note any minor improvements the user could make manually

**FAIL (score < 7.0):**
- Write detailed feedback to `<run_dir>/context/review-feedback.json`:
  ```json
  {
    "revision_count": 1,
    "scores": {
      "keyword_coverage": 6,
      "content_quality": 7,
      "structural_seo": 5,
      "template_adherence": 8,
      "brand_voice": 7,
      "weighted_total": 6.4
    },
    "issues": [
      {
        "dimension": "keyword_coverage",
        "issue": "Primary keyword 'best running shoes' missing from H1",
        "suggestion": "Rewrite H1 to naturally include the primary keyword"
      }
    ],
    "previous_feedback_addressed": true,
    "notes": "Overall good but needs better primary keyword placement"
  }
  ```
- Set `**next_step**` to `007` to loop back to the optimization step
- Increment `revision_count` from any existing review-feedback.json

**MAX REVISIONS (revision_count >= 3):**
- After 3 revision loops, PASS regardless of score
- Note the caveats and remaining issues in your output
- Recommend the user manually address outstanding problems
- Leave `**next_step**` as `auto` to complete the workflow

### 4. Write Summary
Write to your output file:
- Scores for each dimension
- Weighted total score
- PASS/FAIL decision with reasoning
- If FAIL: the specific issues and what needs to change
- If PASS: any minor suggestions for manual improvement
- Revision count (if applicable)
