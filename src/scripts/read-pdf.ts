import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  isPdfEncrypted,
  isQpdfAvailable,
  decryptPdf,
  QPDF_INSTALL_MSG,
} from "./lib/pdf-utils.ts";

interface ReadPdfOptions {
  output?: string;
  decryptOnly?: boolean;
  pages?: string;
  skipDecryption?: boolean;
}

/**
 * Parse a page range string like "1-5" or "1,3,5" into an array of 1-based page numbers.
 */
function parsePageRange(rangeStr: string): number[] {
  const pages = new Set<number>();
  for (const part of rangeStr.split(",")) {
    const trimmed = part.trim();
    if (trimmed.includes("-")) {
      const [start, end] = trimmed.split("-").map(Number);
      if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
        throw new Error(`Invalid page range: ${trimmed}`);
      }
      for (let i = start; i <= end; i++) pages.add(i);
    } else {
      const n = Number(trimmed);
      if (isNaN(n) || n < 1) throw new Error(`Invalid page number: ${trimmed}`);
      pages.add(n);
    }
  }
  return [...pages].sort((a, b) => a - b);
}

/**
 * Filter extracted text to only include specified pages.
 * pdf-parse returns all text joined; we split on form-feed characters
 * which pdf-parse/pdf.js inserts between pages. This is approximate.
 */
function filterPages(text: string, pages: number[], _totalPages: number): string {
  // pdf-parse uses form-feed (\f) or sometimes just whitespace between pages
  // Split on form-feed first; fall back to returning full text if no splits found
  const parts = text.split("\f");
  if (parts.length <= 1) return text;

  return pages
    .filter((p) => p <= parts.length)
    .map((p) => parts[p - 1])
    .join("\n\n");
}

/**
 * Read and extract text from a PDF file, with automatic decryption support.
 */
export async function readPdf(pdfFile: string, options: ReadPdfOptions = {}): Promise<string> {
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

  // Decrypt-only mode: save decrypted PDF and return path
  if (options.decryptOnly) {
    const outPath = options.output
      ? path.resolve(options.output)
      : resolvedPath.replace(/\.pdf$/i, ".decrypted.pdf");
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, buffer);
    return outPath;
  }

  // Extract text with pdf-parse
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);

  let text = data.text;
  const totalPages = data.numpages;

  // Apply page filtering if requested
  if (options.pages) {
    const pageNumbers = parsePageRange(options.pages);
    text = filterPages(text, pageNumbers, totalPages);
  }

  // Build status line
  const encStatus = encrypted
    ? decrypted
      ? "Yes (decrypted)"
      : "Yes (skipped)"
    : "No";
  const header = `Pages: ${totalPages} | Encrypted: ${encStatus}`;

  const output = `${header}\n---\n${text}`;

  // Save to file or return
  if (options.output) {
    const outPath = path.resolve(options.output);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, output, "utf-8");
    return outPath;
  }

  return output;
}

// CLI
const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const args = process.argv.slice(2);
  let pdfFile: string | undefined;
  const opts: ReadPdfOptions = {};

  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    console.log(
      `Usage: tsx src/scripts/read-pdf.ts <pdf-file> [options]

Options:
  --output <path>     Save extracted text to file instead of stdout
  --decrypt-only      Just decrypt the PDF, save it, and print the path
  --pages <range>     Page range, e.g. "1-5" or "1,3,5" (approximate)
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
      case "--decrypt-only":
        opts.decryptOnly = true;
        break;
      case "--pages":
        opts.pages = args[++i];
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

  readPdf(pdfFile, opts)
    .then((result) => console.log(result))
    .catch((err: Error) => {
      console.error(err.message);
      process.exit(1);
    });
}
