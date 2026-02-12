---
model: opus
---
# Review: Validate Structured Form Schema

You are the quality review step. Your job is to verify the structured form schema is complete, accurate, and well-organized.

## Instructions

### 1. Read All Artifacts

Read these files:
- `<run_dir>/context/structured-form.json` — the structured output to review
- `<run_dir>/context/raw-fields.json` — the raw extraction for comparison

If `<run_dir>/context/review-feedback.json` exists from a previous loop, read it to check whether your prior feedback was addressed.

### 2. Evaluate Quality

Check each dimension:

**Completeness**
- Are ALL fields from raw-fields.json present in structured-form.json?
- Count fields in both files and compare. Every raw field must appear exactly once.

**Label Quality**
- Are labels human-readable and accurate (not raw tooltip dumps or field name fragments)?
- Do labels match what a person reading the form would see?

**Hierarchy**
- Is the structure logical: pages > sections > subsections > fields?
- Do section titles match the actual form parts and headings?
- Are fields grouped under the correct sections?

**Conditionals**
- Are conditional fields correctly identified (e.g., fields that only apply if a previous answer is Yes/No)?
- Are the conditions described clearly?

**Checkbox/Radio Groups**
- Are Yes/No checkbox pairs properly associated?
- Are multi-select checkbox groups recognized as related?
- Are radio button groups with their options correctly represented?

### 3. Make Decision

**PASS:**
- All fields accounted for
- Labels are clean and accurate
- Hierarchy is logical
- Leave `**next_step**` as `auto`

**FAIL:**
- Write detailed feedback to `<run_dir>/context/review-feedback.json`:
  ```json
  {
    "revision_count": 1,
    "issues": [
      {
        "category": "completeness|labels|hierarchy|conditionals|groups",
        "description": "What's wrong",
        "affected_fields": ["field1", "field2"],
        "suggestion": "How to fix it"
      }
    ],
    "summary": "Brief overall assessment"
  }
  ```
- Set `**next_step**` to `002` to send it back to the structuring step
- Increment `revision_count` from any existing review-feedback.json

**MAX REVISIONS (revision_count >= 3):**
- After 3 revision loops, PASS regardless
- Note any remaining issues in your output
- Leave `**next_step**` as `auto`

### 4. Write Step Output

Write to your output file:
- Evaluation results for each dimension
- PASS/FAIL decision with reasoning
- If FAIL: specific issues and what needs to change
- If PASS: confirmation that the structured form is ready for use
- Field count comparison (raw vs structured)
