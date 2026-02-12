import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import sharp from "sharp";

const OUTPUT_DIR = path.resolve("output/images");
const SESSION_NAME = "html-render";

const TAILWIND_CDN = '<script src="https://cdn.tailwindcss.com"></script>';

interface HtmlToPngOptions {
  width?: number;
  height?: number;
  fullPage?: boolean;
  output?: string;
}

/**
 * Inject Tailwind CDN script into HTML if not already present.
 */
function injectTailwind(html: string): string {
  if (html.includes("tailwindcss") || html.includes("tailwind.css")) {
    return html;
  }
  // Insert before </head> if present, otherwise before first tag
  if (html.includes("</head>")) {
    return html.replace("</head>", `${TAILWIND_CDN}\n</head>`);
  }
  if (html.includes("<head>")) {
    return html.replace("<head>", `<head>\n${TAILWIND_CDN}`);
  }
  return `${TAILWIND_CDN}\n${html}`;
}

/**
 * Run an agent-browser command for the html-render session.
 */
function pw(command: string, ...args: string[]): string {
  const fullArgs = ["--session", SESSION_NAME, command, ...args];
  const result = execFileSync("agent-browser", fullArgs, {
    encoding: "utf-8",
    timeout: 30000,
    stdio: ["pipe", "pipe", "pipe"],
  });
  return result.trim();
}

/**
 * Render an HTML file to a compressed PNG using agent-browser and sharp.
 */
export async function htmlToPng(htmlFile: string, options: HtmlToPngOptions = {}): Promise<string> {
  const width = options.width || 1200;
  const height = options.height || 630;
  const fullPage = options.fullPage || false;

  const resolvedHtml = path.resolve(htmlFile);
  if (!fs.existsSync(resolvedHtml)) {
    throw new Error(`HTML file not found: ${resolvedHtml}`);
  }

  // Read and process HTML
  let html = fs.readFileSync(resolvedHtml, "utf-8");
  html = injectTailwind(html);

  // Write processed HTML to temp file
  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, `html-render-${crypto.randomUUID()}.html`);
  fs.writeFileSync(tmpFile, html);

  // Screenshot temp path
  const tmpScreenshot = path.join(tmpDir, `screenshot-${crypto.randomUUID()}.png`);

  try {
    // Open browser with the HTML file
    const fileUrl = `file:///${tmpFile.replace(/\\/g, "/")}`;
    pw("open", fileUrl);

    // Set viewport size
    pw("set", "viewport", String(width), String(height));

    // Wait for Tailwind CDN and any other resources to load
    pw("eval", "new Promise(r => setTimeout(r, 2000))");

    // Take screenshot
    const screenshotArgs = [tmpScreenshot];
    if (fullPage) screenshotArgs.push("--full");
    pw("screenshot", ...screenshotArgs);

    // Close the session
    pw("close");

    // Compress with sharp
    const outputPath = options.output
      ? path.resolve(options.output)
      : path.join(OUTPUT_DIR, `${crypto.randomUUID()}.png`);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    await sharp(tmpScreenshot).png({ compressionLevel: 9 }).toFile(outputPath);

    return path.resolve(outputPath);
  } finally {
    // Clean up temp files
    try { fs.unlinkSync(tmpFile); } catch {}
    try { fs.unlinkSync(tmpScreenshot); } catch {}
    // Ensure session is closed even on error
    try { pw("close"); } catch {}
  }
}

// CLI
const isMain = process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]));
if (isMain) {
  const args = process.argv.slice(2);
  let htmlFile: string | undefined;
  const opts: HtmlToPngOptions = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--width":
        opts.width = Number(args[++i]);
        break;
      case "--height":
        opts.height = Number(args[++i]);
        break;
      case "--full-page":
        opts.fullPage = true;
        break;
      case "--output":
        opts.output = args[++i];
        break;
      default:
        if (!htmlFile) htmlFile = args[i];
        break;
    }
  }

  if (!htmlFile) {
    console.error(
      "Usage: tsx src/scripts/html-to-png.ts <html-file> [--width 1200] [--height 630] [--full-page] [--output <path>]",
    );
    process.exit(1);
  }

  htmlToPng(htmlFile, opts)
    .then((filePath) => console.log(filePath))
    .catch((err: Error) => {
      console.error(err.message);
      process.exit(1);
    });
}
