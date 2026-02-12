import { GoogleGenAI } from "@google/genai";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const OUTPUT_DIR = path.resolve("output/images");

const SUPPORTED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};
const MAX_REFERENCE_IMAGES = 10;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // 20 MB

interface ReferenceImage {
  filePath: string;
  mimeType: string;
}

interface GenerateImageOptions {
  outputDir?: string;
  filename?: string;
  referenceImages?: string[];
}

/**
 * Resolve an array of file/folder paths into a flat list of reference images.
 * Directories are scanned for files with supported image extensions.
 */
function resolveReferenceImages(refs: string[]): ReferenceImage[] {
  const images: string[] = [];

  for (const ref of refs) {
    const resolved = path.resolve(ref);
    const stat = fs.statSync(resolved); // throws ENOENT if missing

    if (stat.isDirectory()) {
      const entries = fs.readdirSync(resolved);
      const matched = entries.filter((e) =>
        SUPPORTED_EXTENSIONS.has(path.extname(e).toLowerCase()),
      );
      if (matched.length === 0) {
        throw new Error(`No supported images found in directory: ${resolved}`);
      }
      for (const file of matched) {
        images.push(path.join(resolved, file));
      }
    } else {
      const ext = path.extname(resolved).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.has(ext)) {
        throw new Error(
          `Unsupported image format "${ext}" for: ${resolved}\nSupported formats: ${[...SUPPORTED_EXTENSIONS].join(", ")}`,
        );
      }
      images.push(resolved);
    }
  }

  if (images.length > MAX_REFERENCE_IMAGES) {
    throw new Error(
      `Too many reference images: ${images.length} (maximum is ${MAX_REFERENCE_IMAGES})`,
    );
  }

  return images.map((filePath) => {
    const size = fs.statSync(filePath).size;
    if (size > MAX_IMAGE_BYTES) {
      throw new Error(
        `Image exceeds 20 MB limit: ${filePath} (${(size / 1024 / 1024).toFixed(1)} MB)`,
      );
    }
    const ext = path.extname(filePath).toLowerCase();
    return { filePath, mimeType: MIME_TYPES[ext] };
  });
}

/**
 * Build the contents payload for the Gemini API.
 */
function buildContents(prompt: string, referenceImages?: ReferenceImage[]) {
  if (!referenceImages || referenceImages.length === 0) {
    return prompt;
  }

  const parts: Array<{ inlineData: { mimeType: string; data: string } } | { text: string }> =
    referenceImages.map(({ filePath, mimeType }) => ({
      inlineData: {
        mimeType,
        data: fs.readFileSync(filePath).toString("base64"),
      },
    }));
  parts.push({ text: prompt });

  return [{ role: "user" as const, parts }];
}

/**
 * Generate an image from a text prompt using Gemini.
 */
export async function generateImage(prompt: string, options: GenerateImageOptions = {}): Promise<string> {
  const outputDir = options.outputDir || OUTPUT_DIR;
  const filename = options.filename || crypto.randomUUID();

  const refs = options.referenceImages
    ? resolveReferenceImages(options.referenceImages)
    : undefined;
  const contents = buildContents(prompt, refs);

  fs.mkdirSync(outputDir, { recursive: true });

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents,
  });

  for (const part of response.candidates![0].content!.parts!) {
    if (part.inlineData) {
      const ext = part.inlineData.mimeType?.split("/")[1] || "png";
      const filePath = path.join(outputDir, `${filename}.${ext}`);
      const buffer = Buffer.from(part.inlineData.data!, "base64");
      fs.writeFileSync(filePath, buffer);
      return path.resolve(filePath);
    }
  }

  throw new Error("No image was returned by the model.");
}

// CLI usage: tsx --env-file=.env src/scripts/generate-image.ts "a cat wearing a top hat" [--ref <path>]...
const isMain = process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]));
if (isMain) {
  const args = process.argv.slice(2);
  let prompt: string | undefined;
  const refs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--ref") {
      if (i + 1 >= args.length) {
        console.error("Error: --ref requires a path argument");
        process.exit(1);
      }
      refs.push(args[++i]);
    } else if (!prompt) {
      prompt = args[i];
    }
  }

  if (!prompt) {
    console.error(
      "Usage: tsx src/scripts/generate-image.ts <prompt> [--ref <image-or-folder>]...",
    );
    process.exit(1);
  }

  generateImage(prompt, { referenceImages: refs.length > 0 ? refs : undefined })
    .then((filePath) => console.log(filePath))
    .catch((err: Error) => {
      console.error(err.message);
      process.exit(1);
    });
}
