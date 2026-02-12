import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve("output/images");

interface ResizeImageOptions {
  resize?: string;
  crop?: string;
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
  gravity?: string;
  format?: "png" | "jpeg" | "jpg" | "webp";
  quality?: number;
  output?: string;
}

/**
 * Parse a dimension string like "400x300" into { width, height }.
 */
function parseDimensions(str: string): { width: number; height: number } {
  const match = str.match(/^(\d+)x(\d+)$/);
  if (!match) throw new Error(`Invalid dimensions: "${str}" (expected WxH, e.g. 400x300)`);
  return { width: Number(match[1]), height: Number(match[2]) };
}

/**
 * Parse a crop spec like "400x300" or "400x300+10+20" into extract/resize params.
 */
function parseCropSpec(str: string): { width: number; height: number; left?: number; top?: number } {
  const match = str.match(/^(\d+)x(\d+)(?:\+(\d+)\+(\d+))?$/);
  if (!match)
    throw new Error(
      `Invalid crop spec: "${str}" (expected WxH or WxH+X+Y, e.g. 400x300 or 400x300+10+20)`,
    );
  const result: { width: number; height: number; left?: number; top?: number } = {
    width: Number(match[1]),
    height: Number(match[2]),
  };
  if (match[3] !== undefined) {
    result.left = Number(match[3]);
    result.top = Number(match[4]);
  }
  return result;
}

/**
 * Resize, crop, or convert an image using sharp.
 */
export async function resizeImage(inputPath: string, options: ResizeImageOptions = {}): Promise<string> {
  const resolved = path.resolve(inputPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Input file not found: ${resolved}`);
  }

  let pipeline = sharp(resolved);

  // Apply crop (extract region or center crop)
  if (options.crop) {
    const spec = parseCropSpec(options.crop);
    if (spec.left !== undefined) {
      // Region extract: WxH+X+Y
      pipeline = pipeline.extract({
        left: spec.left,
        top: spec.top!,
        width: spec.width,
        height: spec.height,
      });
    } else {
      // Center crop: resize to cover then extract
      const gravity = options.gravity || "centre";
      pipeline = pipeline.resize(spec.width, spec.height, {
        fit: "cover",
        position: gravity,
      });
    }
  }

  // Apply resize
  if (options.resize) {
    const dims = parseDimensions(options.resize);
    const fit = options.fit || "inside";
    pipeline = pipeline.resize(dims.width, dims.height, {
      fit,
      withoutEnlargement: true,
    });
  }

  // Determine output format
  const inputExt = path.extname(resolved).toLowerCase().replace(".", "");
  let format: string = options.format || inputExt || "png";
  if (format === "jpg") format = "jpeg";

  // Apply format and compression
  if (format === "png") {
    pipeline = pipeline.png({ compressionLevel: 9 });
  } else if (format === "jpeg") {
    pipeline = pipeline.jpeg({ quality: options.quality || 85 });
  } else if (format === "webp") {
    pipeline = pipeline.webp({ quality: options.quality || 85 });
  }

  // Determine output path
  let outputPath: string;
  if (options.output) {
    outputPath = path.resolve(options.output);
  } else {
    const baseName = path.basename(resolved, path.extname(resolved));
    let suffix = "";
    if (options.resize) suffix += `-${options.resize}`;
    if (options.crop) suffix += `-crop${options.crop.replace(/\+/g, "_")}`;
    const ext = format === "jpeg" ? "jpg" : format;
    outputPath = path.join(OUTPUT_DIR, `${baseName}${suffix}.${ext}`);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await pipeline.toFile(outputPath);

  return path.resolve(outputPath);
}

// CLI
const isMain =
  process.argv[1] &&
  (import.meta.url.endsWith(path.basename(process.argv[1])) ||
    import.meta.url.endsWith(path.basename(process.argv[1]).replace(/\.ts$/, ".ts")));
if (isMain) {
  const args = process.argv.slice(2);
  let inputFile: string | undefined;
  const opts: ResizeImageOptions = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--resize":
        opts.resize = args[++i];
        break;
      case "--crop":
        opts.crop = args[++i];
        break;
      case "--fit":
        opts.fit = args[++i] as ResizeImageOptions["fit"];
        break;
      case "--gravity":
        opts.gravity = args[++i];
        break;
      case "--format":
        opts.format = args[++i] as ResizeImageOptions["format"];
        break;
      case "--quality":
        opts.quality = Number(args[++i]);
        break;
      case "--output":
        opts.output = args[++i];
        break;
      default:
        if (!inputFile) inputFile = args[i];
        break;
    }
  }

  if (!inputFile || (!opts.resize && !opts.crop && !opts.format)) {
    console.error(
      "Usage: tsx src/scripts/resize-image.ts <image> --resize <W>x<H> | --crop <W>x<H>[+X+Y] [--fit <mode>] [--gravity <pos>] [--format <fmt>] [--quality <n>] [--output <path>]",
    );
    process.exit(1);
  }

  resizeImage(inputFile, opts)
    .then((filePath) => console.log(filePath))
    .catch((err: Error) => {
      console.error(err.message);
      process.exit(1);
    });
}
