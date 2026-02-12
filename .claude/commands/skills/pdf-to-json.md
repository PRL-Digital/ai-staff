---
name: pdf-to-json
description: Extracts form fields from fillable PDFs into structured JSON. Use when the user wants to extract form field names, types, and structure from a fillable PDF. For text extraction, use read-pdf instead.
allowed-tools: Bash(tsx src/scripts/pdf-to-json.ts:*)
---

# PDF Form to JSON

Extract form fields from fillable PDFs into structured, deterministic JSON.

For **text extraction** from PDFs, use `read-pdf` instead.

## Usage

```bash
# Extract form fields from a fillable PDF
tsx src/scripts/pdf-to-json.ts form.pdf

# Save JSON to a file
tsx src/scripts/pdf-to-json.ts form.pdf --output output/form-fields.json

# Compact JSON (no indentation)
tsx src/scripts/pdf-to-json.ts form.pdf --no-pretty

# Skip decryption (try reading encrypted PDF as-is)
tsx src/scripts/pdf-to-json.ts form.pdf --skip-decryption
```

## Options

| Flag | Description |
|------|-------------|
| `--output <path>` | Save JSON to file instead of stdout |
| `--pretty` | Pretty-print JSON (default) |
| `--no-pretty` | Compact JSON output |
| `--skip-decryption` | Attempt to read without decrypting, even if encryption is detected |
| `--help`, `-h` | Show help message |

## Output Format

```json
{
  "type": "form",
  "metadata": {
    "pages": 7,
    "encrypted": false,
    "engine": "pdf-lib",
    "formType": { "hasXFA": false, "hasAcroForm": true }
  },
  "fields": [
    { "name": "form1[0].Page1[0].Part2[0].Line1a_FamilyName[0]", "type": "text", "tooltip": "Your Family Name (Last Name)", "maxLength": 30, "rect": { "x": 36, "y": 580, "width": 200, "height": 14 } },
    { "name": "form1[0].Page1[0].Part2[0].Line3_Yes[0]", "type": "checkbox" }
  ],
  "fieldCount": 156,
  "structure": {
    "pages": {
      "Page1": {
        "Part2": {
          "fields": [
            { "name": "...", "type": "text", "tooltip": "Your Family Name (Last Name)", "maxLength": 30, "rect": { "x": 36, "y": 580, "width": 200, "height": 14 }, "item": "1a", "description": "FamilyName" }
          ]
        }
      }
    }
  }
}
```

Fields may include optional metadata when available:
- `tooltip`: Raw `/TU` tooltip text from the PDF (unprocessed)
- `maxLength`: Maximum character length from `/MaxLen`
- `rect`: Widget rectangle `{ x, y, width, height }` for the first widget

If no form fields are found, `fieldCount` will be `0` and a warning is included suggesting `read-pdf` for text extraction.

## How It Works

1. Reads the PDF file from disk
2. Checks for encryption — decrypts with `qpdf` if needed
3. Detects form type (XFA vs AcroForm) using `pdf-lib`
4. Extracts fields with `pdf-lib`, falls back to `pdftk` for XFA-only PDFs
5. Parses field names into structured hierarchy (page > part > field)
6. Outputs deterministic JSON (same input always produces same output)

## Dependencies

- **pdf-lib** (npm, included): Form field extraction — pure JS, no native dependencies
- **qpdf** (system, optional): Only needed for encrypted PDFs
  - Windows: `choco install qpdf`
  - macOS: `brew install qpdf`
  - Linux: `apt install qpdf`
- **pdftk** (system, optional): Only needed for XFA-only PDFs (rare)
  - Windows: `choco install pdftk-java`
  - macOS: `brew install pdftk-java`
  - Linux: `apt install pdftk`

## Limitations

- **Form fields only**: This script extracts fillable form fields. For text content, use `read-pdf`.
- **XFA-only PDFs require pdftk**: If pdftk is not installed, XFA-only forms will return 0 fields with a warning.
- **Empty-password decryption only**: `qpdf --decrypt` removes empty-password protection. PDFs with actual passwords are not supported.
- **Field name parsing is pattern-based**: The `structure` output works best with USCIS-style field names (`form1[0].PageN[0].PartM[0].Field[0]`). Other naming conventions will still be extracted but may group under `_unknown`.

## Guidelines

- Output is deterministic: no timestamps, no random values. Running twice on the same file produces identical output.
- When saving output, directories are created automatically.
- If the PDF has no fillable fields, the output will include a warning. Use `read-pdf` for text extraction instead.
- For USCIS forms, the `structure` output groups fields by Page and Part, matching the form's visual layout.

## Workflow Examples

```bash
# Analyze a USCIS form to get field names and structure
tsx src/scripts/pdf-to-json.ts forms/i-765.pdf --output output/i-765-fields.json

# Get compact JSON for piping to another tool
tsx src/scripts/pdf-to-json.ts form.pdf --no-pretty

# Check a form PDF's field count quickly
tsx src/scripts/pdf-to-json.ts form.pdf --no-pretty | node src/scripts/json-extract.js "$(cat -)" "o.fieldCount"
```
