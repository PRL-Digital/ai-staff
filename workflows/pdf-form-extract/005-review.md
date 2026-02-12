---
model: opus
---
# Conditionals Review: Validate Field Visibility Logic

You are the conditionals review step. Your job is to verify that conditional visibility rules have been correctly applied to the structured form schema.

## Instructions

### 1. Read All Artifacts

Read these files:
- `<run_dir>/context/structured-form.json` — the structured form with conditionals added
- `<run_dir>/context/pdf-text.md` — visible text content from the PDF for context

If `<run_dir>/context/conditional-feedback.json` exists from a previous loop, read it to check whether your prior feedback was addressed.

### 2. Evaluate Conditionals

Check each dimension:

**Coverage**
- Are all fields that should be conditional actually marked with a `conditional` property?
- Look for patterns in the PDF text: "If you answered Yes/No", "If applicable", "Only complete if", etc.
- Are there fields that are unconditionally visible but should be hidden based on a prior answer?
- Are `message` fields that accompany conditional sections also marked conditional where appropriate?

**Correctness**
- Does every `field` reference in condition leaves point to a field `name` that actually exists in the schema?
- Are the `operator` and `value` correct for each condition? (e.g., if a section shows when the user answers "No", the condition should be `equals` + `"no"`, not `"yes"`)
- Are logic groups (`and`/`or`) used correctly? Verify the boolean logic matches the PDF's intent.

**Conditional structure**
- Every `conditional` value MUST be a logic group (`{logic, conditions}`) — even single conditions. If you see a bare condition leaf as the top-level value, FAIL.
- Logic groups contain only condition leaves (`{field, operator, value}`) or nested logic groups — no other node types.
- No `conditional` values use the old array format (`[...]`). If you see a bare array, FAIL.

**Completeness of groups**
- When a group of fields all depend on the same condition, are ALL fields in that group marked conditional (not just some)?
- Are there conditional fields that should be grouped together but aren't?

**No unintended changes**
- Has the conditionals step ONLY added `conditional` properties? No other field properties should have been modified.

### 3. Make Decision

**PASS:**
- All conditional relationships are correctly identified
- References are valid and logic is correct
- No unintended modifications
- Delete `<run_dir>/context/conditional-feedback.json` if it exists (clean up stale feedback)
- Leave `**next_step**` as `auto`

**FAIL (conditional issues):**
- Write detailed feedback to `<run_dir>/context/conditional-feedback.json`:
  ```json
  {
    "revision_count": 1,
    "issues": [
      {
        "category": "coverage|correctness|groups|unintended_changes",
        "description": "What's wrong",
        "affected_fields": ["field1", "field2"],
        "suggestion": "How to fix it"
      }
    ],
    "summary": "Brief overall assessment"
  }
  ```
- Set `**next_step**` to `004` to send it back to the conditionals step
- Increment `revision_count` from any existing conditional-feedback.json

**FAIL (structural issues):**
- If you discover a structural problem that conditionals cannot fix (e.g., a missing field, fields in the wrong step, broken group), write feedback to `<run_dir>/context/review-feedback.json` and set `**next_step**` to `002`. The full pipeline (002 → 003 → 004 → 005) will re-run.

**MAX REVISIONS (revision_count >= 3):**
- After 3 revision loops, PASS regardless
- Note any remaining issues in your output
- Leave `**next_step**` as `auto`

### 4. Write Step Output

Write to your output file:
- Evaluation results for each dimension
- PASS/FAIL decision with reasoning
- If FAIL: specific issues and what needs to change
- If PASS: confirmation that the structured form is complete and ready for use
- Count of conditional fields vs total fields
