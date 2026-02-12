#!/usr/bin/env node
// Parse and validate a JSON initial argument for workflow steps.
//
// Usage:
//   tsx src/scripts/parse-input.ts <json-string> <output-path> <required-field> [required-field...]
//
// Examples:
//   tsx src/scripts/parse-input.ts '{"query":"shoes","wp_post_url":"...","content_type":"service"}' \
//     output/seo-keyword-content/run-id/context/input.json query wp_post_url content_type
//
// Exit codes:
//   0 — success, clean JSON written to output path
//   1 — invalid JSON or missing required fields (error printed to stderr)

import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";

const [jsonString, outputPath, ...requiredFields] = process.argv.slice(2);

if (!jsonString || !outputPath) {
  console.error(
    "Usage: parse-input.ts <json-string> <output-path> <required-field> [...]",
  );
  process.exit(1);
}

// Parse JSON
let data: Record<string, unknown>;
try {
  data = JSON.parse(jsonString) as Record<string, unknown>;
} catch (e) {
  console.error(`Invalid JSON: ${(e as Error).message}`);
  process.exit(1);
}

if (typeof data !== "object" || data === null || Array.isArray(data)) {
  console.error("Input must be a JSON object");
  process.exit(1);
}

// Validate required fields
const missing = requiredFields.filter(
  (f) => !(f in data) || data[f] === "" || data[f] === null,
);

if (missing.length > 0) {
  console.error(`Missing required fields: ${missing.join(", ")}`);
  process.exit(1);
}

// Write clean JSON
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(data, null, 2) + "\n");

// Print summary to stdout for the caller
const fields = Object.entries(data)
  .map(([k, v]) => `  ${k}: ${v ?? "(not set)"}`)
  .join("\n");
console.log(`Parsed input (${Object.keys(data).length} fields):\n${fields}`);
