/**
 * One-time script to download high-resolution (1280px) versions of Tumblr photo
 * images into export/images-hires/. These serve as the archival originals.
 *
 * Usage: npm run download-hires
 *
 * The script reads export/ci_days.json to find all photo items, constructs the
 * 1280px Tumblr CDN URL for each, and downloads it. Images that fail to download
 * or that return the same size as the 500px version are reported at the end.
 *
 * Safe to re-run — skips images already downloaded.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

const CI_DAYS_PATH = join(ROOT, "export", "ci_days.json");
const IMAGES_500_DIR = join(ROOT, "export", "images");
const HIRES_DIR = join(ROOT, "export", "images-hires");

mkdirSync(HIRES_DIR, { recursive: true });

/**
 * Given a Tumblr photo-url-500, construct the 1280px CDN URL.
 *
 * Handles three patterns:
 * 1. Old-style: http://{n}.media.tumblr.com/{hash}_500.ext
 *    → https://64.media.tumblr.com/{hash}_1280.ext
 * 2. Bare host: http://media.tumblr.com/{hash}_500.ext (or data.tumblr.com)
 *    → https://64.media.tumblr.com/{hash}_1280.ext
 * 3. New-style: https://64.media.tumblr.com/{hash}/s500x750/{filename}
 *    → https://64.media.tumblr.com/{hash}/s1280x1920/{filename}
 */
function buildHiresUrl(url500) {
  const parsed = new URL(url500);

  // New-style path with s500x750 or s640x960
  if (parsed.pathname.includes("/s500x750/") || parsed.pathname.includes("/s640x960/")) {
    const newPath = parsed.pathname
      .replace("/s500x750/", "/s1280x1920/")
      .replace("/s640x960/", "/s1280x1920/");
    return `https://64.media.tumblr.com${newPath}`;
  }

  // Old-style: replace _500 or _400 with _1280 in the path, normalize host
  const newPath = parsed.pathname.replace(/_(?:500|400)\./, "_1280.");
  return `https://64.media.tumblr.com${newPath}`;
}

/**
 * Derive the local hires filename from the original 500px filename.
 * Preserves the extension but swaps _500/_400 for _1280.
 */
function hiresFilename(original500) {
  return original500.replace(/_(?:500|400)\./, "_1280.");
}

async function downloadImage(url, destPath) {
  const response = await fetch(url);
  if (!response.ok) return false;
  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(destPath, buffer);
  return true;
}

async function main() {
  const days = JSON.parse(readFileSync(CI_DAYS_PATH, "utf-8"));

  const entries = [];
  for (const day of days) {
    for (const item of day.items) {
      if (item.type !== "photo") continue;
      entries.push({
        date: day.date,
        itemId: item.id,
        filename: item.rendered.image,
        url500: item.item_data["photo-url-500"],
      });
    }
  }

  console.log(`Found ${entries.length} photo items.\n`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;
  let sameSize = 0;
  const failures = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const hiresName = hiresFilename(entry.filename);
    const destPath = join(HIRES_DIR, hiresName);

    // Skip if already downloaded
    if (existsSync(destPath)) {
      skipped++;
      continue;
    }

    const hiresUrl = buildHiresUrl(entry.url500);
    process.stdout.write(`[${i + 1}/${entries.length}] ${entry.date} ${hiresName}...`);

    const ok = await downloadImage(hiresUrl, destPath);
    if (!ok) {
      process.stdout.write(" FAILED\n");
      failed++;
      failures.push({ date: entry.date, itemId: entry.itemId, filename: entry.filename, url: hiresUrl });
      continue;
    }

    // Check if the hires version is actually larger than the 500px version
    const origPath = join(IMAGES_500_DIR, entry.filename);
    if (existsSync(origPath)) {
      const origSize = statSync(origPath).size;
      const hiresSize = statSync(destPath).size;
      if (hiresSize <= origSize) {
        process.stdout.write(` same size (${hiresSize} bytes)\n`);
        sameSize++;
      } else {
        process.stdout.write(` OK (${origSize} → ${hiresSize} bytes)\n`);
        downloaded++;
      }
    } else {
      process.stdout.write(" OK\n");
      downloaded++;
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Downloaded (larger):  ${downloaded}`);
  console.log(`Same size as 500px:   ${sameSize}`);
  console.log(`Already existed:      ${skipped}`);
  console.log(`Failed:               ${failed}`);
  if (failures.length > 0) {
    console.log(`\nFailed downloads:`);
    for (const f of failures) {
      console.log(`  ${f.date} (item ${f.itemId}): ${f.url}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
