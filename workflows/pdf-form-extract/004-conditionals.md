---
model: opus
---
# Conditionals: Add Field Visibility Logic

You are the conditionals step. Your job is to analyze the structured form schema and add `conditional` visibility rules to fields that depend on other fields' values.

## Instructions

### 1. Read Input Data

Read these files:
- `<run_dir>/context/structured-form.json` — the structured (and reviewed) form schema
- `<run_dir>/context/pdf-text.md` — visible text content from the PDF for context

If `<run_dir>/context/conditional-feedback.json` exists, read it and address the feedback from the reviewer.

### 2. Analyze Field Dependencies

Walk through every field in the schema (including fields inside groups) and determine which fields should only be visible based on another field's value.

Common patterns to look for:
- **Yes/No gatekeepers** — a radio or checkbox asking a yes/no question, followed by fields that only apply for one answer (e.g., "Is your mailing address the same as your physical address?" → physical address fields only show when "No")
- **Conditional sections** — a group of fields that all depend on the same condition
- **Cascading selects** — a field whose options or visibility depend on a prior selection
- **Instructional notes** — `message` fields that should only appear alongside the conditional fields they describe

Use the PDF text to understand the form's intent — look for phrases like "If you answered Yes", "If applicable", "Only complete if", etc.

### 3. Conditional Format

Add a `conditional` property to any field or group that should have conditional visibility. The value is a **condition tree** — either a single condition (leaf) or a logic group (branch) that can nest arbitrarily.

#### Structure

Every `conditional` is a **logic group** — even for a single condition. This ensures a consistent shape for consumers.

| Property     | Description |
|-------------|-------------|
| `logic`      | `"and"` (all must match) or `"or"` (any must match) |
| `conditions` | Array of condition leaves and/or nested logic groups |

Each entry in `conditions` is either a **condition leaf** or a **nested logic group**:

**Condition leaf:**

| Property   | Description |
|-----------|-------------|
| `field`    | References another field's `name` (must exist in the schema) |
| `operator` | One of: `equals`, `notEquals`, `in`, `notIn` |
| `value`    | The value to compare against (string, or array for `in`/`notIn`) |

#### Examples

Single condition:
```json
"conditional": {
  "logic": "and",
  "conditions": [
    { "field": "mailing_same_as_physical", "operator": "equals", "value": "no" }
  ]
}
```

Multiple conditions (AND):
```json
"conditional": {
  "logic": "and",
  "conditions": [
    { "field": "want_ssn_card", "operator": "equals", "value": "yes" },
    { "field": "consent_for_disclosure", "operator": "equals", "value": "yes" }
  ]
}
```

Nested AND/OR:
```json
"conditional": {
  "logic": "and",
  "conditions": [
    { "field": "eligibility_category_1", "operator": "equals", "value": "(c)" },
    {
      "logic": "or",
      "conditions": [
        { "field": "eligibility_category_2", "operator": "equals", "value": "(35)" },
        { "field": "eligibility_category_2", "operator": "equals", "value": "(36)" }
      ]
    }
  ]
}
```

#### Rules

- **Always** use a logic group as the top-level `conditional` value — never a bare condition leaf
- Always specify `logic` explicitly — never rely on implicit AND/OR
- Do NOT modify any other field properties — only add `conditional` where needed

### 4. Save Output

Save the updated schema (with conditionals added) back to `<run_dir>/context/structured-form.json`.

### 5. Write Step Output

Write to your output file:
- Number of fields with conditionals added
- Summary of each conditional relationship identified
- Any ambiguous cases where visibility logic was unclear
- Whether this is a revision (and what feedback was addressed)
