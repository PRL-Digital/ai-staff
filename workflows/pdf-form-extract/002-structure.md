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

- **Group by form parts and sub-sections** — e.g., "Part 1. Reason for Applying", "Part 2 - Your Full Legal Name", "Part 2 - U.S. Mailing Address"
- **Assign semantic names** — field `name` values must be semantic snake_case identifiers (e.g., `last_name`, `mailing_street`), NOT raw PDF field names
- **Derive labels from context** — use tooltip text and PDF visible text to determine proper human-readable labels
- **Identify conditionals** — fields that depend on other answers get a `conditional` array (e.g., physical address fields shown only when mailing address differs)

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
| `fields`     | Array of field objects                               |

#### Field object

All fields require `name`, `label`, and `type`. Other properties are optional.

| Property      | Required | Description                                                        |
|--------------|----------|--------------------------------------------------------------------|
| `name`       | Yes      | Semantic snake_case identifier (e.g., `last_name`, `mailing_street`) |
| `label`      | Yes      | Human-readable label                                                |
| `type`       | Yes      | One of: `text`, `checkbox`, `radio`, `select`, `date`, `phone`, `email`, `textarea` |
| `width`      | No       | Layout hint: `"1-1"` (full), `"1-2"` (half), `"1-3"` (third), `"1-4"` (quarter) |
| `options`    | No       | Array of `{ "value", "label", "pdfField" }` for radio/select/checkbox |
| `direction`  | No       | `"horizontal"` or `"vertical"` for radio/checkbox layout           |
| `placeholder`| No       | Input hint text                                                     |
| `helpText`   | No       | Additional guidance for the user                                    |
| `allowEmpty` | No       | For select fields where a blank option is valid                     |
| `conditional`| No       | Array of condition objects controlling field visibility              |
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

#### Conditional format

```json
"conditional": [
  { "field": "mailing_same_as_physical", "operator": "equals", "value": "no" }
]
```

- `field` — references another field's `name`
- `operator` — one of: `equals`, `notEquals`, `in`, `notIn`
- `value` — the value to compare against
- Multiple entries in the array are ANDed (all must match for the field to be visible)

#### What to EXCLUDE from output

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
      "id": "part-2-mailing-address",
      "title": "Part 2. Information About You - U.S. Mailing Address",
      "description": "Enter your U.S. mailing address",
      "fields": [
        {
          "name": "mailing_same_as_physical",
          "label": "Is your current mailing address the same as your physical address?",
          "type": "radio",
          "width": "1-1",
          "options": [
            { "value": "yes", "label": "Yes", "pdfField": "form1[0].Page2[0].Part2Line5_Checkbox[0]" },
            { "value": "no", "label": "No", "pdfField": "form1[0].Page2[0].Part2Line5_Checkbox[1]" }
          ],
          "direction": "horizontal"
        },
        {
          "name": "physical_street",
          "label": "Physical Address - Street Number and Name",
          "type": "text",
          "width": "1-2",
          "placeholder": "Enter street address",
          "pdfField": "form1[0].Page2[0].Pt2Line7_StreetNumberName[0]",
          "conditional": [
            { "field": "mailing_same_as_physical", "operator": "equals", "value": "no" }
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
