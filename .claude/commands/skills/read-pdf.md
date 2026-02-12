---
name: read-pdf
description: Reads and extracts text from PDF files, with automatic decryption for encrypted PDFs. Use when the user wants to read, extract, or analyze PDF content.
allowed-tools: Bash(tsx src/scripts/read-pdf.ts:*)
---

# PDF Reader & Decryptor

Extract text from PDF files with automatic decryption of password-protected PDFs.

## Usage

```bash
# Basic: extract text from a PDF
tsx src/scripts/read-pdf.ts document.pdf

# Save extracted text to a file
tsx src/scripts/read-pdf.ts document.pdf --output output/text/document.txt

# Extract specific pages only (approximate)
tsx src/scripts/read-pdf.ts document.pdf --pages 1-5
tsx src/scripts/read-pdf.ts document.pdf --pages 1,3,5

# Decrypt an encrypted PDF without extracting text
tsx src/scripts/read-pdf.ts encrypted.pdf --decrypt-only
tsx src/scripts/read-pdf.ts encrypted.pdf --decrypt-only --output output/decrypted.pdf

# Skip decryption (try reading encrypted PDF as-is)
tsx src/scripts/read-pdf.ts document.pdf --skip-decryption
```

## Options

| Flag | Description |
|------|-------------|
| `--output <path>` | Save text (or decrypted PDF) to file instead of stdout |
| `--decrypt-only` | Just decrypt the PDF, save it, and print the output path |
| `--pages <range>` | Page range like `1-5` or `1,3,5` (approximate, see limitations) |
| `--skip-decryption` | Attempt to read without decrypting, even if encryption is detected |
| `--help`, `-h` | Show help message |

## Output Format

When printing to stdout, the output format is:

```
Pages: 10 | Encrypted: Yes (decrypted)
---
[extracted text content]
```

When `--output` is used, the file path is printed instead.

## How It Works

1. Reads the PDF file from disk
2. Checks the first 10KB for an `/Encrypt` marker to detect encryption
3. If encrypted, decrypts using `qpdf --decrypt` via a temp file (30s timeout)
4. Extracts text using `pdf-parse` (pure JS, based on Mozilla's pdf.js)
5. Optionally filters to requested page range
6. Outputs text to stdout or saves to file

## Dependencies

- **pdf-parse** (npm, included): Pure JS text extraction, no native dependencies
- **qpdf** (system, optional): Only needed for encrypted PDFs
  - Windows: `choco install qpdf`
  - macOS: `brew install qpdf`
  - Linux: `apt install qpdf`

## Limitations

- **Page filtering is approximate**: `pdf-parse` returns all text joined together. Page splitting relies on form-feed characters, which may not always align perfectly with visual page boundaries.
- **Text-only extraction**: Images, tables, and complex layouts are not preserved. For structured data, consider OCR or specialized tools.
- **Empty-password decryption only**: `qpdf --decrypt` removes empty-password protection. PDFs with actual passwords require the password to be supplied (not supported).

## Guidelines

- The script auto-detects encryption — no need to check manually.
- If qpdf is not installed and the PDF is encrypted, the error message includes install instructions.
- For large PDFs, use `--pages` to limit extraction and reduce output size.
- Use `--decrypt-only` when you need the decrypted PDF file itself (e.g., for other tools).
- When saving text output, create directories as needed — the script handles `mkdir -p`.

## Workflow Examples

```bash
# Read a PDF and analyze its content
tsx src/scripts/read-pdf.ts report.pdf

# Decrypt a protected PDF, then use it with other tools
tsx src/scripts/read-pdf.ts protected.pdf --decrypt-only --output output/clean.pdf

# Extract just the first 3 pages of a long document
tsx src/scripts/read-pdf.ts long-report.pdf --pages 1-3

# Save extracted text for later processing
tsx src/scripts/read-pdf.ts invoice.pdf --output output/text/invoice.txt
```
