import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, readFile, unlink, rmdir, mkdtemp } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const execFileAsync = promisify(execFile);

export const QPDF_INSTALL_MSG =
  "PDF is encrypted but qpdf is not installed.\n" +
  "Install it:\n" +
  "  Windows:  choco install qpdf\n" +
  "  macOS:    brew install qpdf\n" +
  "  Linux:    apt install qpdf";

/**
 * Check for /Encrypt marker in PDF to detect encryption.
 * Searches the first 10KB — a quick heuristic that avoids running qpdf on unencrypted PDFs.
 */
export function isPdfEncrypted(buffer: Buffer): boolean {
  const searchLength = Math.min(buffer.length, 10000);
  const pdfString = buffer.toString("latin1", 0, searchLength);
  return pdfString.includes("/Encrypt");
}

/**
 * Check if qpdf is available on the system.
 */
export async function isQpdfAvailable(): Promise<boolean> {
  try {
    await execFileAsync("qpdf", ["--version"]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Decrypt a PDF buffer using qpdf (removes empty-password encryption).
 */
export async function decryptPdf(buffer: Buffer): Promise<Buffer> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "pdf-decrypt-"));
  const inputPath = path.join(tempDir, `input-${Date.now()}.pdf`);

  try {
    await writeFile(inputPath, buffer);
    await execFileAsync("qpdf", ["--decrypt", "--replace-input", inputPath], {
      timeout: 30000,
    });
    return await readFile(inputPath);
  } finally {
    await unlink(inputPath).catch(() => {});
    await rmdir(tempDir).catch(() => {});
  }
}
