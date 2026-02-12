---
model: opus
---
# Structure: Organize Raw Fields into Hierarchical Form Schema

You are the structuring step. Your job is to read the raw extracted data and organize it into a clean, hierarchical form schema suitable for rendering a multi-step web form.

## Instructions

### 1. Read Input Data

Read these files:
- `<run_dir>/context/raw-fields.json` — raw form fields with tooltips, types, positions
- `<run_dir>/context/pdf-text.md` — visible text content from the PDF

If `<run_dir>/context/review-feedback.json` exists, read it and address the feedback from the reviewer.

### 2. Organize into Steps

Reorganize the flat field list into a **steps** array. Each step is a logical section of the form (matching the form's visual layout) that will be rendered as one screen in a multi-step wizard.

#### Step-vs-Group Rule (CRITICAL)

- **Steps correspond to `Part N. Title` headings ONLY** — each Part = exactly one step
- **Sub-sections within a Part** (e.g., "Your Full Legal Name", "U.S. Mailing Address", "Other Information") become **groups** inside that step
- **`Part N. Title (continued)` headings are NOT new steps** — they are the same Part continuing on the next page; merge their fields into the existing step

**Mapping table — how PDF headings map to steps vs groups:**

| PDF Heading | Structure |
|---|---|
| "Part 1. Reason for Applying" | Step |
| "Part 2. Information About You" | Step |
| "Your Full Legal Name" (within Part 2) | Group inside Part 2 step |
| "U.S. Mailing Address" (within Part 2) | Group inside Part 2 step |
| "Other Information" (within Part 2) | Group inside Part 2 step |
| "Part 2. Information About You (continued)" | Still Part 2 step (NOT new) |
| "Part 3. Applicant's Statement..." | Step |

> **Common mistake to avoid:** Do NOT split a single Part into multiple steps. If you find yourself creating `part-2-your-name`, `part-2-mailing-address`, etc. as separate steps, STOP — those should be groups inside a single `part-2-info` step.

#### Field Rules

- **Assign semantic names** — field `name` values must be semantic snake_case identifiers (e.g., `last_name`, `mailing_street`), NOT raw PDF field names
- **Derive labels from context** — use tooltip text and PDF visible text to determine proper human-readable labels
- **Use groups for sub-sections within a step** — when a single step contains distinct sub-sections (e.g., "Your Full Legal Name" and "U.S. Mailing Address" within Part 2), wrap related fields in a group object. Groups and ungrouped fields can be freely intermixed in a step's `fields` array.
- **Use message fields for instructional text** — PDF notes, instructions, and guidance text that aren't input fields should be captured as `message` type fields (e.g., "NOTE: If you answered 'No'...")

### 3. Output Schema

The output must be a single JSON object with this structure:

#### Top-level properties

| Property     | Description                                      |
|-------------|--------------------------------------------------|
| `id`        | Kebab-case form identifier (e.g., `"i-765"`)    |
| `title`     | Human-readable form title                         |
| `formNumber`| Official form number (e.g., `"I-765"`)           |
| `revision`  | Form revision date (e.g., `"01/20/25"`)          |
| `steps`     | Array of step objects                             |

#### Step object

| Property      | Description                                         |
|--------------|-----------------------------------------------------|
| `id`         | Kebab-case step identifier (e.g., `"part-1-reason"`) |
| `title`      | Section title                                        |
| `description`| Brief description of this section's purpose          |
| `fields`     | Array of field objects and group objects (intermixed) |

#### Group object

A group is an entry in a step's `fields` array that acts as a visual sub-section container. Groups and regular fields can be freely intermixed and ordered within `fields`.

| Property | Required | Description                                              |
|----------|----------|----------------------------------------------------------|
| `type`   | Yes      | Always `"group"`                                         |
| `id`     | Yes      | Kebab-case group identifier (e.g., `"full-legal-name"`) |
| `title`  | Yes      | Sub-section heading (e.g., `"Your Full Legal Name"`)     |
| `fields` | Yes      | Array of field objects within this group                  |

#### Field object

All fields require `name` and `type`. The `label` property is required for all types except `message` and `group`. Other properties are optional.

| Property      | Required | Description                                                        |
|--------------|----------|--------------------------------------------------------------------|
| `name`       | Yes      | Semantic snake_case identifier (e.g., `last_name`, `mailing_street`) |
| `label`      | Yes      | Human-readable label                                                |
| `type`       | Yes      | One of: `text`, `checkbox`, `radio`, `select`, `date`, `phone`, `email`, `textarea`, `message` |
| `content`    | *        | Display text for instructional notes (*required* when `type` is `message`)           |
| `width`      | No       | Layout hint: `"1-1"` (full), `"1-2"` (half), `"1-3"` (third), `"1-4"` (quarter) |
| `options`    | No       | Array of `{ "value", "label", "pdfField" }` for radio/select/checkbox |
| `direction`  | No       | `"horizontal"` or `"vertical"` for radio/checkbox layout           |
| `placeholder`| No       | Input hint text                                                     |
| `helpText`   | No       | Additional guidance for the user                                    |
| `allowEmpty` | No       | For select fields where a blank option is valid                     |
| `pdfField`  | No       | Raw PDF field path for filling the PDF (see below)                  |

#### `pdfField` format

For text/date/phone/email/textarea fields, `pdfField` is a string on the field object:
```json
"pdfField": "form1[0].Page1[0].Line1a_FamilyName[0]"
```

For radio/checkbox/select fields, `pdfField` goes on each option object instead:
```json
"options": [
  { "value": "initial", "label": "Initial permission to accept employment", "pdfField": "form1[0].Page1[0].Part1_Checkbox[0]" },
  { "value": "replacement", "label": "Replacement of lost, stolen, or damaged employment authorization document", "pdfField": "form1[0].Page1[0].Part1_Checkbox[1]" }
]
```

#### What to EXCLUDE from output

- No `conditional` — conditionals are added by a later step
- No `itemNumber` — do not include PDF item numbers
- No raw PDF field names — use semantic snake_case names only
- No `rect`, `tooltip`, `maxLength`, or other raw extraction metadata

### 4. Example Output

```json
{
  "id": "i-765",
  "title": "Application for Employment Authorization",
  "formNumber": "I-765",
  "revision": "01/20/25",
  "steps": [
    {
      "id": "part-1-reason",
      "title": "Part 1. Reason for Applying",
      "description": "Select the reason you are applying for employment authorization",
      "fields": [
        {
          "name": "reason_for_applying",
          "label": "I am applying for:",
          "type": "radio",
          "width": "1-1",
          "options": [
            { "value": "initial", "label": "Initial permission to accept employment", "pdfField": "form1[0].Page1[0].Part1_Checkbox[0]" },
            { "value": "replacement", "label": "Replacement of lost, stolen, or damaged employment authorization document", "pdfField": "form1[0].Page1[0].Part1_Checkbox[1]" },
            { "value": "renewal", "label": "Renewal of my permission to accept employment", "pdfField": "form1[0].Page1[0].Part1_Checkbox[2]" }
          ],
          "direction": "vertical"
        }
      ]
    },
    {
      "id": "part-2-info",
      "title": "Part 2. Information About You",
      "description": "Enter your personal information including name and address",
      "fields": [
        {
          "type": "group",
          "id": "full-legal-name",
          "title": "Your Full Legal Name",
          "fields": [
            {
              "name": "last_name",
              "label": "Family Name (Last Name)",
              "type": "text",
              "width": "1-3",
              "pdfField": "form1[0].Page1[0].Line1a_FamilyName[0]"
            },
            {
              "name": "first_name",
              "label": "Given Name (First Name)",
              "type": "text",
              "width": "1-3",
              "pdfField": "form1[0].Page1[0].Line1b_GivenName[0]"
            },
            {
              "name": "middle_name",
              "label": "Middle Name",
              "type": "text",
              "width": "1-3",
              "pdfField": "form1[0].Page1[0].Line1c_MiddleName[0]"
            }
          ]
        },
        {
          "type": "group",
          "id": "mailing-address",
          "title": "U.S. Mailing Address",
          "fields": [
            {
              "name": "mailing_street",
              "label": "Street Number and Name",
              "type": "text",
              "width": "1-2",
              "pdfField": "form1[0].Page2[0].Pt2Line4_StreetNumberName[0]"
            },
            {
              "name": "mailing_city",
              "label": "City or Town",
              "type": "text",
              "width": "1-2",
              "pdfField": "form1[0].Page2[0].Pt2Line4_CityOrTown[0]"
            }
          ]
        },
        {
          "name": "mailing_same_as_physical",
          "label": "Is your physical address the same as your mailing address?",
          "type": "radio",
          "width": "1-1",
          "options": [
            { "value": "yes", "label": "Yes", "pdfField": "form1[0].Page2[0].Part2Line5_Checkbox[0]" },
            { "value": "no", "label": "No", "pdfField": "form1[0].Page2[0].Part2Line5_Checkbox[1]" }
          ],
          "direction": "horizontal"
        },
        {
          "type": "group",
          "id": "physical-address",
          "title": "U.S. Physical Address",
          "fields": [
            {
              "name": "note_physical",
              "type": "message",
              "content": "NOTE: If you answered 'No' to the question above, provide your physical address below."
            },
            {
              "name": "physical_street",
              "label": "Street Number and Name",
              "type": "text",
              "width": "1-2",
              "pdfField": "form1[0].Page2[0].Pt2Line7_StreetNumberName[0]"
            }
          ]
        }
      ]
    }
  ]
}
```

### 5. Save Output

Save the structured schema to `<run_dir>/context/structured-form.json`.

### 6. Write Step Output

Write to your output file:
- Total fields structured
- Number of steps identified
- Any fields that were ambiguous or hard to categorize
- Whether this is a revision (and what feedback was addressed)
