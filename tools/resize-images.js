/**
 * Resize high-resolution archived images for web publishing.
 *
 * Reads from export/images-hires/, resizes to the configured maxWidth,
 * and writes into the co-located src/posts/YYYY/MM/DD/ directories
 * (using the original 500px filename so markdown references stay valid).
 *
 * Usage: npm run resize-images
 *
 * The max width is read from src/_data/config.js (imageMaxWidth).
 * GIF files are copied without resizing (sharp animated GIF support is limited).
 * Images narrower than maxWidth are copied as-is.
 *
 * Safe to re-run — overwrites existing published images.
 */

import {
  readFileSync,
  readdirSync,
  mkdirSync,
  existsSync,
  copyFileSync,
} from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

const CI_DAYS_PATH = join(ROOT, "export", "ci_days.json");
const HIRES_DIR = join(ROOT, "export", "images-hires");
const POSTS_DIR = join(ROOT, "src", "posts");

// Load config
const config = (await import(join(ROOT, "src", "_data", "config.js"))).default;
const MAX_WIDTH = config.imageMaxWidth;

console.log(`Resizing images to max width: ${MAX_WIDTH}px\n`);

/**
 * Map hires filename back to the original 500px filename used in markdown.
 * _1280.ext → _500.ext (or _400 for the few that were originally _400)
 */
function originalFilename(hiresName, orig500Name) {
  return orig500Name;
}

/** Build the output directory for a day's files. */
function dayOutputDir(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return join(POSTS_DIR, y, m, d);
}

async function main() {
  if (!existsSync(HIRES_DIR)) {
    console.error(
      "export/images-hires/ not found. Run `npm run download-hires` first.",
    );
    process.exit(1);
  }

  const days = JSON.parse(readFileSync(CI_DAYS_PATH, "utf-8"));

  // Build map: original filename → { date, hiresFilename }
  const entries = [];
  for (const day of days) {
    for (const item of day.items) {
      if (item.type !== "photo") continue;
      const orig = item.rendered.image;
      // Derive hires filename (same transform as download-hires.js)
      const hires = orig.replace(/_(?:500|400)\./, "_1280.");
      entries.push({
        date: day.date,
        origFilename: orig,
        hiresFilename: hires,
      });
    }
  }

  let resized = 0;
  let copied = 0;
  let missing = 0;

  for (const entry of entries) {
    const hiresPath = join(HIRES_DIR, entry.hiresFilename);
    const outDir = dayOutputDir(entry.date);
    const destPath = join(outDir, entry.origFilename);

    if (!existsSync(hiresPath)) {
      // No hires version — skip (migration already copied the 500px version)
      missing++;
      continue;
    }

    mkdirSync(outDir, { recursive: true });

    const ext = extname(entry.hiresFilename).toLowerCase();

    // GIFs: copy without resizing
    if (ext === ".gif") {
      copyFileSync(hiresPath, destPath);
      copied++;
      continue;
    }

    // Resize with sharp, preserving format
    const metadata = await sharp(hiresPath).metadata();
    if (metadata.width && metadata.width > MAX_WIDTH) {
      await sharp(hiresPath)
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .toFile(destPath);
      resized++;
    } else {
      // Already within max width — copy as-is
      copyFileSync(hiresPath, destPath);
      copied++;
    }
  }

  console.log(`--- Summary ---`);
  console.log(`Resized to ${MAX_WIDTH}px: ${resized}`);
  console.log(`Copied as-is:             ${copied}`);
  console.log(`No hires version:         ${missing}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
