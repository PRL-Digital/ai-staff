---
model: opus
---
# Structure Review: Validate Structured Form Schema

You are the structure review step. Your job is to verify the structured form schema is complete, accurate, and well-organized before conditional logic is added.

**Note:** This review does NOT check conditionals — those are added and reviewed in later steps.

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
- Are instructional notes and guidance text from the PDF captured as `message` type fields where appropriate?

**Label Quality**
- Are labels human-readable and accurate (not raw tooltip dumps or field name fragments)?
- Do labels match what a person reading the form would see?

**Hierarchy**
- **Step-per-Part rule (CRITICAL):** each `Part N.` in the PDF = exactly one step. A Part must NOT be split into multiple steps.
- `Part N. Title (continued)` headings are treated as the same step as `Part N. Title`, not new steps.
- Sub-section headings within a Part (e.g., "Your Full Legal Name", "U.S. Mailing Address") must be groups inside the Part's step, not separate steps.
- Small Parts without sub-sections don't need groups — fields can sit directly in the step's `fields` array.
- Each group has a valid `id`, `title`, and non-empty `fields` array.
- No nested groups (only one level of grouping is allowed).

**Step Count Validation**
- Count distinct `Part N.` headings in the PDF text (treating "Part N. Title" and "Part N. Title (continued)" as the same Part).
- Compare to actual step count in structured-form.json.
- If step count > Part count, a Part was likely split into multiple steps → FAIL.
- Red flag: multiple steps with same part prefix (e.g., `part-2-your-name`, `part-2-mailing-address`) means Part 2 was incorrectly fragmented.

**Checkbox/Radio Groups**
- Are Yes/No checkbox pairs properly associated?
- Are multi-select checkbox groups recognized as related?
- Are radio button groups with their options correctly represented?

### 3. Make Decision

**PASS:**
- All fields accounted for
- Labels are clean and accurate
- Hierarchy is logical
- Delete `<run_dir>/context/review-feedback.json` if it exists (clean up stale feedback)
- Leave `**next_step**` as `auto`

**FAIL:**
- Write detailed feedback to `<run_dir>/context/review-feedback.json`:
  ```json
  {
    "revision_count": 1,
    "issues": [
      {
        "category": "completeness|labels|hierarchy|groups",
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
- If PASS: confirmation that the structure is ready for conditional logic
- Field count comparison (raw vs structured)
