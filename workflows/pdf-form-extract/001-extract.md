---
model: haiku
---
# Extract: Raw Form Fields and PDF Text

You are the extraction step. Your job is to run two scripts to extract raw data from the PDF.

## Instructions

The initial argument is the path to a PDF file.

### 1. Extract Form Fields

Run the pdf-to-json script to extract all form fields with their raw metadata:

```bash
tsx src/scripts/pdf-to-json.ts "<pdf-path>" --output <run_dir>/context/raw-fields.json
```

Replace `<pdf-path>` with the initial argument (the PDF file path).

### 2. Extract PDF Text

Run the read-pdf script to extract the PDF's visible text content:

```bash
tsx src/scripts/read-pdf.ts "<pdf-path>" --output <run_dir>/context/pdf-text.md
```

### 3. Write Step Output

Write a brief summary to your output file:
- How many form fields were extracted
- How many pages the PDF has
- Whether encryption was detected
- Confirm both files were saved to the context directory
