---
model: opus
---
# Formatting: Sections & Layout

You are the formatting step. Your job is to take the finalized structured form schema (with conditionals already applied) and apply two UI formatting passes:

1. **Sections** — break large steps into page-sized sub-pages
2. **Layout hints** — add `width` and `direction` properties to fields for responsive rendering

## Context

Each step currently corresponds to one `Part N.` heading. Small Parts (e.g., 5 fields) are fine as a single page, but large Parts (e.g., Part 2 of the I-765 with ~80 fields across 15 groups) are far too much for one screen. Sections subdivide a step into manageable sub-pages without losing the Part hierarchy.

**Before:** `Step > Fields/Groups`
**After:** `Step > Sections > Fields/Groups` (with `width` and `direction` on each field)

## Instructions

### 1. Read Input Data

Read this file:
- `<run_dir>/context/structured-form.json` — the structured form with conditionals

If `<run_dir>/context/sections-feedback.json` exists, read it and address the feedback from the reviewer.

### 2. Add Sections to Every Step (Pass 1)

For each step in the schema, wrap its `fields` array content into a `sections` array. The step's `fields` property is replaced by `sections`.

#### Section Object Schema

| Property      | Required | Description |
|--------------|----------|-------------|
| `id`         | Yes      | Kebab-case identifier (e.g., `"personal-info"`) |
| `title`      | Yes      | Section heading shown as page title in the UI |
| `description`| Yes      | Brief description of this section's purpose |
| `fields`     | Yes      | Array of field objects and group objects (moved from the step) |

#### Rules

- **Every step MUST have a `sections` array** — even small steps get a single section
- **The step's `fields` property is removed** — replaced entirely by `sections`
- **The step's `title` and `description` are unchanged** — they still show the Part heading
- **Document order is preserved** — fields within and across sections must follow the original order from the step
- **Groups are never split** — a group and all its fields must stay together in one section
- **Conditionals travel with their fields** — do NOT modify any `conditional` properties; they move into sections along with their field/group objects
- **Do NOT modify any field properties** — only restructure the containers

#### Sizing Guidelines

- **Target ~8-15 input fields per section** (do not count `message` type fields toward this limit)
- **If a section would exceed ~20 input fields, split it further** into logically related sub-topics
- **Small steps (≤15 input fields) get a single section** wrapping all their fields
- Count input fields within groups toward the section total

#### Section Title Guidelines

- Section titles serve as page headers in the UI — they must be descriptive
- Good: "Personal Information", "Address Information", "Eligibility Category"
- Bad: "Section 1", "Section 2", "Part 2a"
- For small steps with a single section, the section title can echo the step's topic (e.g., step "Part 1. Reason for Applying" → section "Reason for Applying")

#### How to Split Large Steps

1. Walk through the step's `fields` array in order
2. Identify natural topic boundaries — look for groups that belong together (e.g., name groups, address groups, identification groups)
3. Cluster consecutive fields/groups into sections, aiming for ~8-15 input fields each
4. Never reorder fields — sections are just partitions of the existing ordered list
5. Never break a group across sections

### 3. Example

**Small step (single section):**
```json
{
  "id": "part-1-reason",
  "title": "Part 1. Reason for Applying",
  "description": "Select the reason you are applying",
  "sections": [
    {
      "id": "reason",
      "title": "Reason for Applying",
      "description": "Select the reason you are applying for employment authorization",
      "fields": [
        { "type": "group", "id": "attorney-representative", "..." : "..." },
        { "name": "reason_for_applying", "..." : "..." },
        { "name": "note_replacement", "..." : "..." }
      ]
    }
  ]
}
```

**Large step (multiple sections):**
```json
{
  "id": "part-2-info",
  "title": "Part 2. Information About You",
  "description": "Enter your personal information",
  "sections": [
    {
      "id": "personal-info",
      "title": "Personal Information",
      "description": "Your legal name, other names, and basic details",
      "fields": [
        { "type": "group", "id": "full-legal-name", "..." : "..." },
        { "type": "group", "id": "other-names-used", "..." : "..." },
        { "name": "date_of_birth", "..." : "..." }
      ]
    },
    {
      "id": "address-info",
      "title": "Address Information",
      "description": "Your U.S. mailing and physical addresses",
      "fields": [
        { "type": "group", "id": "us-mailing-address", "..." : "..." },
        { "name": "mailing_same_as_physical", "..." : "..." },
        { "type": "group", "id": "us-physical-address", "..." : "..." }
      ]
    },
    {
      "id": "other-details",
      "title": "Identification & Social Security",
      "description": "Your identification numbers and Social Security information",
      "fields": [
        { "type": "group", "id": "other-information", "..." : "..." },
        { "type": "group", "id": "father-name", "..." : "..." },
        { "type": "group", "id": "mother-name", "..." : "..." }
      ]
    },
    {
      "id": "citizenship-birth",
      "title": "Citizenship & Place of Birth",
      "description": "Your country of citizenship and birth information",
      "fields": [
        { "type": "group", "id": "citizenship-nationality", "..." : "..." },
        { "type": "group", "id": "place-of-birth", "..." : "..." }
      ]
    },
    {
      "id": "immigration-travel",
      "title": "Immigration & Travel Documents",
      "description": "Information about your last arrival and travel documents",
      "fields": [
        { "type": "group", "id": "last-arrival-info", "..." : "..." }
      ]
    },
    {
      "id": "eligibility",
      "title": "Eligibility Category",
      "description": "Your employment authorization eligibility category",
      "fields": [
        { "type": "group", "id": "eligibility-category", "..." : "..." },
        { "type": "group", "id": "stem-opt", "..." : "..." },
        { "type": "group", "id": "c26-eligibility", "..." : "..." },
        { "type": "group", "id": "c8-eligibility", "..." : "..." },
        { "type": "group", "id": "c35-c36-eligibility", "..." : "..." }
      ]
    }
  ]
}
```

### 4. Add Layout Hints to Every Field (Pass 2)

After sections are in place, walk through every field in the schema (steps → sections → fields, including fields inside groups) and add `width` and `direction` properties.

#### `width` — Column Layout Hint

Add a `width` property to every field (except `message` type fields, which are always full-width). The value controls how much horizontal space the field occupies in the form grid.

| Value  | Meaning  | When to use |
|--------|----------|-------------|
| `"1-1"` | Full width | Textareas, radio groups with long labels, standalone yes/no questions, message fields |
| `"1-2"` | Half width | Most text fields in a group (e.g., city + state, street + apt) |
| `"1-3"` | Third width | Name fields in a group (first, middle, last), date components |
| `"1-4"` | Quarter width | Short fields like state abbreviation, ZIP code, unit number |

**Guidelines:**
- Fields within the same group should use widths that add up to a full row (e.g., three `"1-3"` fields, or one `"1-2"` + one `"1-2"`)
- When in doubt, prefer `"1-2"` — it works well for most text inputs
- Select/radio/checkbox fields with long option text should be `"1-1"`
- Stand-alone fields not in a group are typically `"1-1"` or `"1-2"`

#### `direction` — Radio/Checkbox Layout Direction

Add a `direction` property to every `radio` and `checkbox` type field. This controls whether options are stacked or side-by-side.

| Value          | When to use |
|---------------|-------------|
| `"horizontal"` | Short option labels (e.g., Yes/No, Male/Female), 2-4 options |
| `"vertical"`   | Long option labels, 4+ options, or options that need explanation |

**Guidelines:**
- Yes/No radio pairs → `"horizontal"`
- Lists of eligibility categories, reasons, or descriptions → `"vertical"`
- If any single option label exceeds ~40 characters → `"vertical"`

#### Rules

- **Add `width` to every field** except `message` type (messages are implicitly full-width)
- **Add `direction` to every `radio` and `checkbox` field** — no other types get this property
- **Do NOT modify any other field properties** — only add `width` and `direction`

### 5. Save Output

Save the updated schema (with sections and layout hints added) back to `<run_dir>/context/structured-form.json`.

### 6. Write Step Output

Write to your output file:
- Number of steps processed
- Sections created per step (e.g., "Part 1: 1 section, Part 2: 6 sections, ...")
- Total field count before and after (must be identical — no fields lost or added)
- Summary of layout hints applied (fields with width, fields with direction)
- Whether this is a revision (and what feedback was addressed)
