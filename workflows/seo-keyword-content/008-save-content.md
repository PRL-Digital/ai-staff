---
model: haiku
---
# Save Final Content

You are the save step. Your job is to finalize the optimized content as the deliverable and write a summary.

## Instructions

### 1. Read Optimized Content
- Read `<run_dir>/context/optimized-content.md`
- Read `<run_dir>/context/seo-report.json` for meta suggestions

### 2. Save Final Content
- Copy the optimized content to `<run_dir>/context/final-content.md` — this is the deliverable the user will use
- The content should be ready to copy into WordPress ACF fields

### 3. Write Summary
Write to your output file:
- Confirmation that `<run_dir>/context/final-content.md` has been saved
- The suggested meta title and character count
- The suggested meta description and character count
- Total word count of the final content
- A note reminding the user to review `<run_dir>/context/field-map.json` to understand which sections map to which ACF fields
- Schema markup suggestions from the SEO report, if any
