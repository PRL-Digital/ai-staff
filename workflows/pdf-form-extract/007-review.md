---
model: opus
---
# Formatting Review: Validate Sections & Layout

You are the formatting review step. Your job is to verify that section restructuring and layout hints (`width`, `direction`) are correct — all fields are preserved, sections are well-sized, layout hints are appropriate, and no structural damage was done to the schema.

## Instructions

### 1. Read All Artifacts

Read these files:
- `<run_dir>/context/structured-form.json` — the structured form with sections and layout hints added
- `<run_dir>/context/raw-fields.json` — the raw extraction for field count comparison

If `<run_dir>/context/sections-feedback.json` exists from a previous loop, read it to check whether your prior feedback was addressed.

### 2. Evaluate Formatting

Check each dimension:

**Field Parity**
- Count all fields by traversing: steps → sections → fields (including fields within groups).
- Compare to the count of fields in raw-fields.json. Every raw field must still appear exactly once.
- No fields should have been added, removed, or duplicated by the sections step.

**Section Structure**
- Every step MUST have a `sections` array with at least one section.
- Steps must NOT have a top-level `fields` property — it should be replaced by `sections`.
- Each section has a valid `id` (kebab-case), `title`, `description`, and non-empty `fields` array.

**Section Sizing**
- Flag any section with more than ~20 input fields (not counting `message` type fields) as too large — it should be split further.
- Flag any step with a single section that has more than ~20 input fields — it should have been split into multiple sections.

**Document Order**
- Fields within each section must follow the same order as they appeared in the step's original `fields` array.
- Across sections within a step, the order must be preserved — section 1's last field should precede section 2's first field in the original document order.

**Group Integrity**
- No group should be split across sections — every group must appear fully within a single section.
- Group contents (fields within a group) must be unchanged.

**Conditional Integrity**
- All `conditional` properties must still be present and unchanged on their fields/groups.
- Spot-check several conditional fields to verify the `conditional` object was not modified or lost during restructuring.
- Conditional `field` references must still point to valid field names in the schema (field names are globally unique across all steps and sections).

**Section Titles**
- Section titles should be descriptive page headers (e.g., "Personal Information", "Address Information").
- Flag generic titles like "Section 1", "Section 2", "Part 2a".

**Layout: `width`**
- Every field (except `message` type) must have a `width` property with a valid value: `"1-1"`, `"1-2"`, `"1-3"`, or `"1-4"`.
- `message` type fields should NOT have a `width` property (they are implicitly full-width).
- Fields within the same group should use widths that logically tile into rows (e.g., three `"1-3"` fields, two `"1-2"` fields).
- Standalone text inputs and radio groups with long labels should generally be `"1-1"`.

**Layout: `direction`**
- Every `radio` and `checkbox` type field must have a `direction` property with value `"horizontal"` or `"vertical"`.
- No other field types should have a `direction` property.
- Yes/No radio pairs with short labels should be `"horizontal"`.
- Radio/checkbox fields with 4+ options or long option labels should be `"vertical"`.

**No Unintended Changes**
- Has the formatting step ONLY added sections, `width`, and `direction`? No other field properties (labels, types, options, conditionals, etc.) should have been modified.

### 3. Make Decision

**PASS:**
- All fields accounted for
- Sections are well-structured and well-sized
- Layout hints are correct and complete
- Document order preserved
- Conditionals intact
- Delete `<run_dir>/context/sections-feedback.json` if it exists (clean up stale feedback)
- Leave `**next_step**` as `auto`

**FAIL:**
- Write detailed feedback to `<run_dir>/context/sections-feedback.json`:
  ```json
  {
    "revision_count": 1,
    "issues": [
      {
        "category": "parity|sizing|order|groups|conditionals|titles|width|direction|unintended_changes",
        "description": "What's wrong",
        "affected_fields": ["field1", "field2"],
        "suggestion": "How to fix it"
      }
    ],
    "summary": "Brief overall assessment"
  }
  ```
- Set `**next_step**` to `006` to send it back to the formatting step
- Increment `revision_count` from any existing sections-feedback.json

**FAIL (structural issues from earlier steps):**
- If you discover a problem that formatting cannot fix (e.g., missing fields, broken conditionals, wrong step assignment), write feedback to the appropriate file:
  - Structure issues → `<run_dir>/context/review-feedback.json`, set `**next_step**` to `002`
  - Conditional issues → `<run_dir>/context/conditional-feedback.json`, set `**next_step**` to `004`

**MAX REVISIONS (revision_count >= 3):**
- After 3 revision loops, PASS regardless
- Note any remaining issues in your output
- Leave `**next_step**` as `auto`

### 4. Write Step Output

Write to your output file:
- Evaluation results for each dimension
- PASS/FAIL decision with reasoning
- If FAIL: specific issues and what needs to change
- If PASS: confirmation that the formatted form is complete and ready for use
- Field count comparison (raw vs structured)
- Section count per step
- Layout hint coverage (fields with width, fields with direction)
