import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import { writeFile, unlink, mkdtemp, rmdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import {
  isPdfEncrypted,
  isQpdfAvailable,
  decryptPdf,
  QPDF_INSTALL_MSG,
} from "./lib/pdf-utils.ts";

const execFileAsync = promisify(execFile);

// =============================================================================
// Types
// =============================================================================

interface FormField {
  name: string;
  type: string;
  options?: string[];
  tooltip?: string;
  maxLength?: number;
  rect?: { x: number; y: number; width: number; height: number };
}

interface FormType {
  hasXFA: boolean;
  hasAcroForm: boolean;
  isXFAOnly: boolean;
}

interface PdfToJsonOptions {
  output?: string;
  pretty?: boolean;
  skipDecryption?: boolean;
}

interface ExtractionResult {
  fields: FormField[];
  warnings: string[];
}

interface ParsedFieldName {
  raw: string;
  page?: string;
  part?: string;
  descriptor: string;
  item?: string;
  description?: string;
}

interface StructuredField {
  name: string;
  type: string;
  options?: string[];
  tooltip?: string;
  maxLength?: number;
  rect?: { x: number; y: number; width: number; height: number };
  item?: string;
  description?: string;
}

// =============================================================================
// Tool availability
// =============================================================================

async function isPdftkAvailable(): Promise<boolean> {
  try {
    await execFileAsync("pdftk", ["--version"]);
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// Form type detection
// =============================================================================

async function detectFormType(pdfBuffer: Buffer): Promise<FormType> {
  const pdfString = pdfBuffer.toString("latin1");
  const hasXFA =
    pdfString.includes("/XFA") ||
    pdfString.includes("<xdp:xdp") ||
    pdfString.includes("xmlns:xfa");

  let hasAcroForm = false;

  try {
    const { PDFDocument } = await import("pdf-lib");
    const pdfDoc = await PDFDocument.load(pdfBuffer, {
      ignoreEncryption: true,
    });

    try {
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      hasAcroForm = fields.length > 0;
    } catch {
      hasAcroForm = false;
    }
  } catch {
    hasAcroForm = false;
  }

  return { hasXFA, hasAcroForm, isXFAOnly: hasXFA && !hasAcroForm };
}

// =============================================================================
// Field type mapping — uses instanceof instead of constructor.name
// =============================================================================

async function getFieldType(field: { constructor: { name: string } }): Promise<string> {
  const {
    PDFTextField,
    PDFCheckBox,
    PDFRadioGroup,
    PDFDropdown,
  } = await import("pdf-lib");

  if (field instanceof PDFTextField) return "text";
  if (field instanceof PDFCheckBox) return "checkbox";
  if (field instanceof PDFRadioGroup) return "radio";
  if (field instanceof PDFDropdown) return "dropdown";
  return "unknown";
}

// =============================================================================
// pdf-lib extraction
// =============================================================================

async function extractFieldsWithPdfLib(pdfBuffer: Buffer): Promise<ExtractionResult> {
  const warnings: string[] = [];
  const fields: FormField[] = [];

  try {
    const { PDFDocument, PDFName, PDFString, PDFHexString, PDFNumber } = await import("pdf-lib");
    const pdfDoc = await PDFDocument.load(pdfBuffer, {
      ignoreEncryption: true,
    });

    const form = pdfDoc.getForm();
    const pdfFields = form.getFields();

    for (const field of pdfFields) {
      const name = field.getName();
      const type = await getFieldType(field);
      const extracted: FormField = { name, type };

      if (type === "radio" || type === "dropdown") {
        try {
          if (typeof (field as unknown as { getOptions?: () => string[] }).getOptions === "function") {
            extracted.options = (field as unknown as { getOptions: () => string[] }).getOptions();
          }
        } catch {
          // ignore options extraction errors
        }
      }

      // Raw tooltip (/TU)
      const tu = field.acroField.dict.get(PDFName.of("TU"));
      if (tu instanceof PDFString || tu instanceof PDFHexString) {
        extracted.tooltip = tu.decodeText();
      }

      // Max length (/MaxLen)
      const maxLen = field.acroField.dict.get(PDFName.of("MaxLen"));
      if (maxLen instanceof PDFNumber) {
        extracted.maxLength = maxLen.asNumber();
      }

      // Widget rectangle
      const widgets = (field.acroField as any).getWidgets?.();
      if (widgets?.length > 0) {
        const r = widgets[0].getRectangle();
        extracted.rect = { x: r.x, y: r.y, width: r.width, height: r.height };
      }

      fields.push(extracted);
    }
  } catch (error) {
    warnings.push(`pdf-lib extraction warning: ${(error as Error).message}`);
  }

  return { fields, warnings };
}

// =============================================================================
// pdftk extraction (fallback for XFA-only PDFs)
// =============================================================================

function parsePdftkFieldType(fieldType: string): string {
  switch (fieldType.toLowerCase()) {
    case "text":
      return "text";
    case "button":
      return "checkbox";
    case "choice":
      return "dropdown";
    default:
      return "unknown";
  }
}

async function extractFieldsWithPdftk(pdfBuffer: Buffer): Promise<ExtractionResult> {
  const warnings: string[] = [];
  const fields: FormField[] = [];

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "pdf-extract-"));
  const inputPdf = path.join(tempDir, "input.pdf");

  try {
    await writeFile(inputPdf, pdfBuffer);

    const { stdout } = await execFileAsync(
      "pdftk",
      [inputPdf, "dump_data_fields"],
      { timeout: 30000, maxBuffer: 10 * 1024 * 1024 },
    );

    const fieldBlocks = stdout.split("---").filter((block) => block.trim());

    for (const block of fieldBlocks) {
      const lines = block.trim().split("\n");
      let name = "";
      let type = "";
      const stateOptions: string[] = [];

      for (const line of lines) {
        const nameMatch = line.match(/^FieldName:\s*(.+)$/);
        if (nameMatch) name = nameMatch[1].trim();

        const typeMatch = line.match(/^FieldType:\s*(.+)$/);
        if (typeMatch) type = typeMatch[1].trim();

        const optionMatch = line.match(/^FieldStateOption:\s*(.+)$/);
        if (optionMatch) stateOptions.push(optionMatch[1].trim());
      }

      if (name) {
        const extracted: FormField = { name, type: parsePdftkFieldType(type) };

        if (
          stateOptions.length > 0 &&
          stateOptions.some((opt) => opt !== "Off")
        ) {
          extracted.options = stateOptions.filter((opt) => opt !== "Off");
        }

        fields.push(extracted);
      }
    }
  } catch (error) {
    warnings.push(`pdftk extraction error: ${(error as Error).message}`);
  } finally {
    await unlink(inputPdf).catch(() => {});
    await rmdir(tempDir).catch(() => {});
  }

  return { fields, warnings };
}

// =============================================================================
// Field name parsing — deterministic regex-based extraction
// =============================================================================

/**
 * Parse a raw PDF field name like:
 *   form1[0].Page1[0].Part2[0].Line1a_FamilyName[0]
 * into structured components.
 */
function parseFieldName(rawName: string): ParsedFieldName {
  const result: ParsedFieldName = { raw: rawName, descriptor: "" };

  // Match Page component: Page1, Page2, etc.
  const pageMatch = rawName.match(/\.?Page(\d+)\[/i);
  if (pageMatch) result.page = `Page${pageMatch[1]}`;

  // Match Part component: Part1, Part2, etc.
  const partMatch = rawName.match(/\.?Part(\d+)\[/i);
  if (partMatch) result.part = `Part${partMatch[1]}`;

  // Extract the last segment (the actual field descriptor)
  const segments = rawName.split(".");
  const lastSegment = segments[segments.length - 1];

  // Strip trailing [0] or [N]
  const descriptor = lastSegment.replace(/\[\d+\]$/, "");
  result.descriptor = descriptor;

  // Try to extract item number from descriptor: Line1a, Line2b, Line10, etc.
  const itemMatch = descriptor.match(/^Line(\d+[a-z]?)/i);
  if (itemMatch) {
    result.item = itemMatch[1];
  }

  // Try to extract human-readable description after underscore
  const descMatch = descriptor.match(/_(.+)$/);
  if (descMatch) {
    result.description = descMatch[1];
  }

  return result;
}

// =============================================================================
// Structure builder — groups flat field list into pages > parts > fields
// =============================================================================

function buildStructure(fields: FormField[]): { pages: Record<string, Record<string, { fields: StructuredField[] }>> } {
  const pages: Record<string, Record<string, { fields: StructuredField[] }>> = {};

  for (const field of fields) {
    const parsed = parseFieldName(field.name);
    const pageName = parsed.page || "_unknown";
    const partName = parsed.part || "_unknown";

    if (!pages[pageName]) pages[pageName] = {};
    if (!pages[pageName][partName]) pages[pageName][partName] = { fields: [] };

    const structured: StructuredField = {
      name: field.name,
      type: field.type,
    };
    if (field.options) structured.options = field.options;
    if (field.tooltip) structured.tooltip = field.tooltip;
    if (field.maxLength) structured.maxLength = field.maxLength;
    if (field.rect) structured.rect = field.rect;
    if (parsed.item) structured.item = parsed.item;
    if (parsed.description) structured.description = parsed.description;

    pages[pageName][partName].fields.push(structured);
  }

  return { pages };
}

// =============================================================================
// Page count helper (uses pdf-lib, avoids pdf-parse dependency)
// =============================================================================

async function getPageCount(pdfBuffer: Buffer): Promise<number | null> {
  try {
    const { PDFDocument } = await import("pdf-lib");
    const pdfDoc = await PDFDocument.load(pdfBuffer, {
      ignoreEncryption: true,
    });
    return pdfDoc.getPageCount();
  } catch {
    return null;
  }
}

// =============================================================================
// Main export
// =============================================================================

/**
 * Extract form fields from a fillable PDF into structured JSON.
 * For text extraction, use read-pdf.ts instead.
 */
export async function pdfToJson(pdfFile: string, options: PdfToJsonOptions = {}): Promise<string> {
  const resolvedPath = path.resolve(pdfFile);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`PDF file not found: ${resolvedPath}`);
  }

  let buffer: Buffer = fs.readFileSync(resolvedPath);
  const encrypted = isPdfEncrypted(buffer);
  let decrypted = false;

  // Handle decryption
  if (encrypted && !options.skipDecryption) {
    const qpdfOk = await isQpdfAvailable();
    if (!qpdfOk) {
      throw new Error(QPDF_INSTALL_MSG);
    }
    buffer = await decryptPdf(buffer);
    decrypted = true;
  }

  const pretty = options.pretty !== false;

  // Detect form type
  const formType = await detectFormType(buffer);
  const totalPages = await getPageCount(buffer);

  const warnings: string[] = [];
  let engine = "none";
  let fields: FormField[] = [];

  if (formType.isXFAOnly) {
    // XFA-only: use pdftk
    warnings.push("XFA-only PDF — using pdftk for extraction");
    const pdftkOk = await isPdftkAvailable();
    if (!pdftkOk) {
      warnings.push(
        "pdftk is not installed. Install it for XFA field extraction:\n" +
          "  Windows:  choco install pdftk-java\n" +
          "  macOS:    brew install pdftk-java\n" +
          "  Linux:    apt install pdftk",
      );
    } else {
      const result = await extractFieldsWithPdftk(buffer);
      fields = result.fields;
      warnings.push(...result.warnings);
      if (fields.length > 0) engine = "pdftk";
    }
  } else if (formType.hasAcroForm) {
    // AcroForm (possibly hybrid): use pdf-lib
    const result = await extractFieldsWithPdfLib(buffer);
    fields = result.fields;
    warnings.push(...result.warnings);
    if (fields.length > 0) engine = "pdf-lib";

    // Fallback to pdftk if pdf-lib returned nothing
    if (fields.length === 0) {
      warnings.push("pdf-lib returned 0 fields, attempting pdftk fallback");
      const pdftkOk = await isPdftkAvailable();
      if (pdftkOk) {
        const pdftkResult = await extractFieldsWithPdftk(buffer);
        fields = pdftkResult.fields;
        warnings.push(...pdftkResult.warnings);
        if (fields.length > 0) engine = "pdftk";
      } else {
        warnings.push("pdftk not available for fallback");
      }
    }
  } else {
    warnings.push(
      "No form fields detected. This PDF may not be fillable. Use read-pdf for text extraction.",
    );
  }

  const structure = buildStructure(fields);

  const output = {
    type: "form",
    metadata: {
      ...(totalPages != null && { pages: totalPages }),
      encrypted,
      ...(decrypted && { decrypted: true }),
      engine,
      formType: { hasXFA: formType.hasXFA, hasAcroForm: formType.hasAcroForm },
    },
    fields,
    fieldCount: fields.length,
    structure,
    ...(warnings.length > 0 && { warnings }),
  };

  const json = JSON.stringify(output, null, pretty ? 2 : undefined);

  if (options.output) {
    const outPath = path.resolve(options.output);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, json, "utf-8");
    return outPath;
  }

  return json;
}

// =============================================================================
// CLI
// =============================================================================

const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const args = process.argv.slice(2);
  let pdfFile: string | undefined;
  const opts: PdfToJsonOptions = {};

  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    console.log(
      `Usage: tsx src/scripts/pdf-to-json.ts <pdf-file> [options]

Extracts form fields from a fillable PDF into structured JSON.
For text extraction, use read-pdf.ts instead.

Options:
  --output <path>     Save JSON to file instead of stdout
  --pretty            Pretty-print JSON (default)
  --no-pretty         Compact JSON output
  --skip-decryption   Attempt to read without decrypting
  --help, -h          Show this help message`,
    );
    process.exit(0);
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--output":
        opts.output = args[++i];
        break;
      case "--pretty":
        opts.pretty = true;
        break;
      case "--no-pretty":
        opts.pretty = false;
        break;
      case "--skip-decryption":
        opts.skipDecryption = true;
        break;
      default:
        if (!pdfFile && !args[i].startsWith("--")) pdfFile = args[i];
        break;
    }
  }

  if (!pdfFile) {
    console.error("Error: No PDF file specified. Use --help for usage.");
    process.exit(1);
  }

  pdfToJson(pdfFile, opts)
    .then((result) => console.log(result))
    .catch((err: Error) => {
      console.error(err.message);
      process.exit(1);
    });
}
