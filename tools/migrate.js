import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  copyFileSync,
  existsSync,
} from "node:fs";
import { join, dirname, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { load as cheerioLoad } from "cheerio";
import { DateTime } from "luxon";
import config from "../src/_data/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const EXPORT_DIR = join(ROOT, "export");
const IMAGES_DIR = join(EXPORT_DIR, "images");
const POSTS_DIR = join(ROOT, "src", "posts");
const NGINX_DIR = join(ROOT, "nginx");
const CI_DAYS_PATH = join(EXPORT_DIR, "ci_days.json");
const MT_ENTRIES_PATH = join(EXPORT_DIR, "mt_entries.json");
const REDIRECTS_CSV_PATH = join(EXPORT_DIR, "redirects.csv");
const MEDIA_REPORT_PATH = join(ROOT, "migration-media-report.md");

// ---------------------------------------------------------------------------
// Media report accumulator
// ---------------------------------------------------------------------------
const mediaReport = {
  localImagesCopied: [],
  tumblrDownloaded: [],
  tumblrUnresolved: [],
  missingLocalFiles: [],
  failedDownloads: [],
  stungeyeRemoteRefs: [],
  stungeyeMediaRefs: [],
  stungeyePageRefs: [],
  displayFnUsage: [],
  inlineJsUsage: [],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build the absolute image path for a day page. */
function dayImagePath(dateStr, filename) {
  const [y, m, d] = dateStr.split("-");
  return `/archive/by_date/${y}/${m}/${d}/${filename}`;
}

/** Build the output directory for a day's files. */
function dayOutputDir(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return join(POSTS_DIR, y, m, d);
}

/** Format a date string for permalink. */
function dayPermalink(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `/archive/by_date/${y}/${m}/${d}/`;
}

/** Strip HTML tags from a string. */
function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

/** Strip <script> and <noscript> tags and their content from HTML. */
function stripScriptTags(html) {
  if (!html) return "";
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "")
    .trim();
}

/**
 * Normalize legacy HTML: lowercase tags, quote attributes.
 * Uses cheerio to parse and re-serialize the fragment.
 */
function normalizeHtml(html) {
  if (!html) return "";
  const $ = cheerioLoad(html, { xml: false, decodeEntities: false });
  // Unwrap Tumblr NPF layout wrappers, keeping inner content
  $("div.npf_row").each((_, el) => $(el).replaceWith($(el).html()));
  $("figure.tmblr-full").each((_, el) => $(el).replaceWith($(el).html()));
  // Strip Tumblr-specific data attributes from img tags
  $("img").each((_, el) => {
    $(el).removeAttr("data-orig-height");
    $(el).removeAttr("data-orig-width");
  });
  // Strip width, height, and frameborder from iframes (handled by CSS)
  $("iframe").each((_, el) => {
    $(el).removeAttr("width");
    $(el).removeAttr("height");
    $(el).removeAttr("frameborder");
  });
  // cheerio serializes with lowercase tags and quoted attributes
  return $("body").html() || "";
}

/** Escape YAML string value (wrap in quotes if needed). */
function yamlString(str) {
  if (!str) return '""';
  if (
    /[:#\[\]{}&*!|>'"%@`,\n]/.test(str) ||
    str.startsWith(" ") ||
    str.endsWith(" ")
  ) {
    return `"${str.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return str;
}

/** Build the month name from a date string. */
function monthName(dateStr) {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const m = parseInt(dateStr.split("-")[1], 10);
  return months[m - 1];
}

/** Parse a timestamp to extract an ordering key (for descending sort). */
function timestampKey(ts) {
  return ts; // ISO-ish strings sort lexicographically
}

/** Format a legacy site-local wall-clock timestamp with an explicit offset. */
function frontmatterDateTime(timestamp) {
  const dt = DateTime.fromFormat(timestamp, "yyyy-MM-dd HH:mm:ss", {
    zone: config.siteTimeZone,
  });

  if (!dt.isValid) {
    throw new Error(`Invalid legacy timestamp: ${timestamp}`);
  }

  return dt.toISO({ suppressMilliseconds: false });
}

/** Zero-pad month and day and ensure trailing slash in /archive/by_date/ URLs. */
function padArchiveUrls(text) {
  return text.replace(
    /\/archive\/by_date\/(\d{4})\/(\d{1,2})\/(\d{1,2})\/?(?=[)"'\s<]|$)/g,
    (_, y, m, d) =>
      `/archive/by_date/${y}/${m.padStart(2, "0")}/${d.padStart(2, "0")}/`,
  );
}

// Media file extensions for classifying stungeye.com URLs
const MEDIA_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".bmp",
  ".svg",
  ".webp",
  ".swf",
  ".fla",
  ".mp3",
  ".wav",
  ".ogg",
  ".avi",
  ".mov",
  ".mp4",
  ".pde",
]);

/**
 * Scan rendered day page content for self-hosted references and legacy JS.
 * Called once per day page on the final assembled body.
 */
function scanContent(dateStr, body) {
  // --- stungeye.com URLs ---
  const stungeyeUrlRe = /https?:\/\/(?:www\.)?stungeye\.com\/[^\s"'<>)]+/gi;
  const seen = new Set();
  for (const match of body.matchAll(stungeyeUrlRe)) {
    const url = match[0].replace(/[.,;]+$/, ""); // trim trailing punctuation
    if (seen.has(url)) continue;
    seen.add(url);

    // Skip archive/by_date links — those are internal post links, not legacy media
    if (/\/archive\/by_date\//.test(url)) continue;
    // Skip legacy /archives/*.php links — handled by nginx redirects
    if (/\/archives\/.*\.php/.test(url)) continue;

    const pathname = new URL(url).pathname;
    const ext = extname(pathname).toLowerCase();

    if (MEDIA_EXTENSIONS.has(ext)) {
      mediaReport.stungeyeMediaRefs.push({ date: dateStr, url, type: ext });
    } else {
      mediaReport.stungeyePageRefs.push({ date: dateStr, url });
    }
  }

  // --- display_*() function calls ---
  const displayRe = /display_(image_mult|image|flash|processing)\(/g;
  const displayFns = new Set();
  for (const match of body.matchAll(displayRe)) {
    displayFns.add(match[1]);
  }
  if (displayFns.size > 0) {
    mediaReport.displayFnUsage.push({
      date: dateStr,
      functions: [...displayFns].sort(),
    });
  }

  // --- Other inline JS (onclick/onmouseover not part of display_*) ---
  if (/\bon\w+\s*=/.test(body) && !displayRe.test(body)) {
    // Has inline handlers but no display_* — flag separately
    const handlers = [...body.matchAll(/\b(on\w+)\s*=/g)]
      .map((m) => m[1])
      .filter((h) => h !== "onversation"); // false positive from "conversation"
    if (handlers.length > 0) {
      mediaReport.inlineJsUsage.push({
        date: dateStr,
        handlers: [...new Set(handlers)].sort(),
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Image handling
// ---------------------------------------------------------------------------

/**
 * Copy a local archived image into the day's output folder.
 * Returns the absolute path for use in markdown, or null if file not found.
 */
function copyLocalImage(dateStr, filename) {
  const src = join(IMAGES_DIR, filename);
  if (!existsSync(src)) {
    mediaReport.missingLocalFiles.push({ date: dateStr, filename });
    return null;
  }
  const outDir = dayOutputDir(dateStr);
  mkdirSync(outDir, { recursive: true });
  const dest = join(outDir, filename);
  copyFileSync(src, dest);
  mediaReport.localImagesCopied.push({ date: dateStr, filename });
  return dayImagePath(dateStr, filename);
}

/**
 * Attempt to download a remote image.
 * Returns { localPath, filename } on success, null on failure.
 */
async function downloadImage(url, dateStr, itemId) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) {
      mediaReport.failedDownloads.push({
        date: dateStr,
        itemId,
        url,
        status: response.status,
      });
      return null;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    // Derive filename from URL
    const urlPath = new URL(url).pathname;
    const filename = basename(urlPath);
    const outDir = dayOutputDir(dateStr);
    mkdirSync(outDir, { recursive: true });
    const dest = join(outDir, filename);
    writeFileSync(dest, buffer);
    mediaReport.tumblrDownloaded.push({ date: dateStr, itemId, url, filename });
    return { localPath: dayImagePath(dateStr, filename), filename };
  } catch (err) {
    mediaReport.failedDownloads.push({
      date: dateStr,
      itemId,
      url,
      error: err.message,
    });
    return null;
  }
}

/**
 * Check if a URL is a Tumblr-hosted media URL (not just a link to a tumblr blog).
 */
function isTumblrMediaUrl(url) {
  try {
    const hostname = new URL(url).hostname;
    return (
      hostname === "media.tumblr.com" ||
      hostname === "64.media.tumblr.com" ||
      hostname.endsWith(".media.tumblr.com")
    );
  } catch {
    return false;
  }
}

/**
 * Check if a URL is a stungeye.com-hosted reference.
 */
function isStungeyeUrl(url) {
  try {
    const hostname = new URL(url).hostname;
    return hostname === "stungeye.com" || hostname === "www.stungeye.com";
  } catch {
    return false;
  }
}

/**
 * Check if a URL points to an image (by extension).
 */
function isImageUrl(url) {
  try {
    const ext = extname(new URL(url).pathname).toLowerCase();
    return [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp"].includes(
      ext,
    );
  } catch {
    return false;
  }
}

/**
 * Pick the best Tumblr srcset URL — the largest useful size.
 * Tumblr srcset URLs contain size strings like s640x960, s500x750, etc.
 */
function pickBestSrcsetUrl(srcset) {
  const entries = srcset
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const parts = entry.split(/\s+/);
      return { url: parts[0], descriptor: parts[1] || "" };
    })
    .filter((e) => isTumblrMediaUrl(e.url));

  if (entries.length === 0) return null;

  // Try to pick by size in URL path (e.g. s640x960)
  const withSize = entries.map((e) => {
    const match = e.url.match(/\/s(\d+)x(\d+)\//);
    const width = match ? parseInt(match[1], 10) : 0;
    return { ...e, width };
  });

  // Sort by width descending, pick the largest that's <= 1280
  // (avoid unnecessarily huge images)
  withSize.sort((a, b) => b.width - a.width);
  const best = withSize.find((e) => e.width <= 1280) || withSize[0];
  return best.url;
}

/**
 * Scan HTML content for Tumblr-hosted and stungeye.com image references.
 * Attempt to download and localize Tumblr images, rewriting HTML.
 * Log stungeye.com refs for future manual localization.
 * Returns the (possibly rewritten) HTML.
 */
async function processHtmlImages(html, dateStr, itemId) {
  if (!html) return html;

  const $ = cheerioLoad(html, null, false);
  let modified = false;

  // Process <img> elements
  const imgs = $("img").toArray();
  for (const el of imgs) {
    const $el = $(el);
    const src = $el.attr("src") || "";
    const srcset = $el.attr("srcset") || "";

    // Check for stungeye.com image references
    if (isStungeyeUrl(src) && isImageUrl(src)) {
      mediaReport.stungeyeRemoteRefs.push({ date: dateStr, itemId, url: src });
    }

    // Check for Tumblr media in src or srcset
    const hasTumblrSrc = isTumblrMediaUrl(src);
    const hasTumblrSrcset = srcset
      .split(",")
      .some((s) => isTumblrMediaUrl(s.trim().split(/\s+/)[0]));

    if (hasTumblrSrc || hasTumblrSrcset) {
      // Pick the best URL to download
      let downloadUrl = null;
      if (hasTumblrSrcset) {
        downloadUrl = pickBestSrcsetUrl(srcset);
      }
      if (!downloadUrl && hasTumblrSrc) {
        downloadUrl = src;
      }

      if (downloadUrl) {
        const result = await downloadImage(downloadUrl, dateStr, itemId);
        if (result) {
          // Rewrite src to local path
          $el.attr("src", result.localPath);
          // Remove srcset entirely (we've localized the best image)
          $el.removeAttr("srcset");
          // Also remove sizes if present (no longer needed)
          $el.removeAttr("sizes");
          modified = true;
        } else {
          mediaReport.tumblrUnresolved.push({
            date: dateStr,
            itemId,
            urls: [downloadUrl],
          });
        }
      }
    }
  }

  if (modified) {
    return $.html();
  }
  return html;
}

// ---------------------------------------------------------------------------
// Item rendering (CI/Tumblr items)
// ---------------------------------------------------------------------------

async function renderPhotoItem(item, dateStr) {
  const r = item.rendered;
  const filename = r.image;
  const captionHtml = r.caption_html || "";
  const altText =
    stripHtml(captionHtml)
      .replace(/[\[\]]/g, "")
      .replace(/\s+/g, " ")
      .trim() || "Photo";
  const clickUrl = r.photo_click_url || null;

  let imagePath = null;

  if (filename && !filename.startsWith("http")) {
    // Local filename — copy from export/images
    imagePath = copyLocalImage(dateStr, filename);
    if (!imagePath) {
      // File not found — use bare filename as fallback
      imagePath = dayImagePath(dateStr, filename);
    }
  } else if (filename && filename.startsWith("http")) {
    // Remote URL — attempt download
    if (isTumblrMediaUrl(filename)) {
      const result = await downloadImage(filename, dateStr, item.id);
      if (result) {
        imagePath = result.localPath;
      } else {
        // Keep remote URL
        imagePath = filename;
        mediaReport.tumblrUnresolved.push({
          date: dateStr,
          itemId: item.id,
          urls: [filename],
        });
      }
    } else {
      imagePath = filename;
    }
  }

  const lines = [];

  // Image with optional link — skip Tumblr click-through URLs
  const imgMarkdown = `![${altText}](${imagePath})`;
  if (clickUrl && !clickUrl.includes("tumblr.com")) {
    lines.push(`[${imgMarkdown}](${clickUrl})`);
  } else {
    lines.push(imgMarkdown);
  }

  // Caption as HTML passthrough
  if (captionHtml) {
    lines.push("");
    lines.push(captionHtml);
  }

  return lines.join("\n");
}

function renderQuoteItem(item) {
  const r = item.rendered;
  const quoteText = r.quote_text || "";
  const source = r.quote_source || "";

  const lines = [];
  // Split quote into lines and prefix each with >
  const quoteLines = quoteText.split("\n").map((l) => `> ${l}`);
  lines.push(...quoteLines);

  if (source) {
    lines.push("");
    lines.push(`— ${source}`);
  }

  return lines.join("\n");
}

function renderLinkItem(item) {
  const r = item.rendered;
  const linkText = r.link_text || "Link";
  const linkUrl = r.link_url || "#";
  const description = r.link_description || "";

  const lines = [];
  lines.push(`[${linkText}](${linkUrl})`);

  if (description) {
    lines.push("");
    lines.push(description);
  }

  return lines.join("\n");
}

function renderVideoItem(item) {
  const r = item.rendered;
  const player = normalizeHtml(r.video_player || "");
  const caption = r.video_caption || "";

  const lines = [];
  if (player) {
    lines.push(player);
  }

  if (caption) {
    lines.push("");
    lines.push(caption);
  }

  return lines.join("\n");
}

async function renderRegularItem(item, dateStr) {
  const r = item.rendered;
  let body = r.body_html_without_h1 || r.body_html || "";

  body = normalizeHtml(body);
  // Process HTML for Tumblr/stungeye images
  body = await processHtmlImages(body, dateStr, item.id);

  return body;
}

async function renderBlogItem(item, dateStr, { includeTitle = true } = {}) {
  const r = item.rendered;
  const title = r.title || "";
  let body = r.body_html || "";

  body = normalizeHtml(body);
  // Process HTML for Tumblr/stungeye images
  body = await processHtmlImages(body, dateStr, item.id);

  const lines = [];
  if (includeTitle && title) {
    lines.push(`## ${title}`);
    lines.push("");
  }
  lines.push(body);

  return lines.join("\n");
}

async function renderItem(item, dateStr, { includeTitle = true } = {}) {
  switch (item.type) {
    case "photo":
      return renderPhotoItem(item, dateStr);
    case "quote":
      return renderQuoteItem(item);
    case "link":
      return renderLinkItem(item);
    case "video":
      return renderVideoItem(item);
    case "regular":
      return renderRegularItem(item, dateStr);
    case "blog":
      return renderBlogItem(item, dateStr, { includeTitle });
    default:
      // Unknown type — raw HTML with TODO comment
      const body =
        item.rendered?.body_html || item.rendered?.body_html_without_h1 || "";
      return `<!-- TODO: unknown type: ${item.type} -->\n${body}`;
  }
}

// ---------------------------------------------------------------------------
// MT entry rendering
// ---------------------------------------------------------------------------

function renderMtEntry(entry, { includeTitle = false } = {}) {
  const title = entry.entry_title || "";
  let body = (entry.entry_text || "").trim();
  const more = (entry.entry_text_more || "").trim();

  if (more) {
    body = body + "\n\n" + more;
  }

  // Strip <script> and <noscript> tags
  body = stripScriptTags(body);

  // Strip Haloscan comment links (dead commenting service)
  body = body.replace(
    /<BR\s*\/?>\s*<a\s+href="http:\/\/www\.haloscan\.com\/comments\.php[^"]*"[^>]*>Comments?(?:\s*\(\d+\))?<\/a>\s*(?:<BR\s*\/?>)?/gi,
    "",
  );

  // Convert <BR><BR> to paragraph breaks (blank line) and <BR> to newlines
  body = body.replace(/<br\s*\/?>\s*<br\s*\/?>/gi, "\n\n");
  body = body.replace(/<br\s*\/?>/gi, "\n");

  // Normalize legacy HTML (lowercase tags, quote attributes) via cheerio
  body = normalizeHtml(body);

  // Strip trailing separator dashes (legacy MT formatting)
  body = body.replace(/\n?-{4,}\s*$/g, "");

  body = body.trim();

  const lines = [];
  if (includeTitle && title) {
    lines.push(`## ${title}`);
    lines.push("");
  }
  lines.push(body);

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Day page assembly
// ---------------------------------------------------------------------------

/**
 * Merge CI items and MT entries for a single day, sorted by timestamp descending.
 * Returns an array of { timestamp, render() } entries.
 */
function buildDayEntries(ciDay, mtEntries) {
  const entries = [];

  if (ciDay) {
    for (const item of ciDay.items) {
      entries.push({
        timestamp: item.timestamp,
        source: "ci",
        item,
      });
    }
  }

  if (mtEntries) {
    for (const entry of mtEntries) {
      entries.push({
        timestamp: entry.entry_created_on,
        source: "mt",
        entry,
      });
    }
  }

  // Sort descending by timestamp (newest first)
  entries.sort((a, b) =>
    timestampKey(b.timestamp).localeCompare(timestampKey(a.timestamp)),
  );

  return entries;
}

/**
 * Determine the page title for a day.
 * @param {object|null} ciDay
 * @param {object[]|null} mtEntries
 * @param {object[]} dayEntries - Sorted entries from buildDayEntries().
 */
function determineDayTitle(ciDay, mtEntries, dayEntries) {
  // CI page_title always wins on merged days; MT title logic is MT-only.
  if (ciDay && ciDay.page_title) {
    return ciDay.page_title;
  }

  // MT-only day. Match the rendered newest-first order so title dedup skips
  // the first visible entry, not whichever entry appeared first in the export.
  if (mtEntries && mtEntries.length > 0) {
    if (!Array.isArray(dayEntries)) {
      throw new Error("determineDayTitle requires sorted dayEntries");
    }

    const firstRenderedMtEntry =
      dayEntries.find((entry) => entry.source === "mt")?.entry ?? mtEntries[0];
    const firstTitle = firstRenderedMtEntry.entry_title;
    if (firstTitle) return firstTitle;

    // Fallback
    const dateStr = firstRenderedMtEntry.day_date;
    const d = new Date(dateStr + "T00:00:00");
    return `Entry from ${monthName(dateStr)} ${d.getDate()}, ${d.getFullYear()}`;
  }

  return "Untitled";
}

/**
 * Determine the frontmatter date — use the earliest timestamp for the day.
 * For CI days, use the last item's timestamp (items are in day order).
 * Or just use the first item's timestamp as a representative.
 */
function determineDayDate(ciDay, mtEntries) {
  const timestamps = [];

  if (ciDay) {
    for (const item of ciDay.items) {
      timestamps.push(item.timestamp);
    }
  }

  if (mtEntries) {
    for (const entry of mtEntries) {
      timestamps.push(entry.entry_created_on);
    }
  }

  if (timestamps.length === 0) return null;

  // Sort descending — use the newest timestamp as the page date
  timestamps.sort((a, b) => b.localeCompare(a));
  return timestamps[0];
}

async function generateDayPage(dateStr, ciDay, mtEntries) {
  const dayEntries = buildDayEntries(ciDay, mtEntries);
  const title = determineDayTitle(ciDay, mtEntries, dayEntries);
  const dateValue = determineDayDate(ciDay, mtEntries);
  const permalink = dayPermalink(dateStr);

  // Render each entry
  const renderedParts = [];
  let titleUsedInHeader = false;
  for (const entry of dayEntries) {
    let rendered;
    if (entry.source === "ci") {
      // Skip ## title for the blog item whose title matches the page title (already in h1)
      const skipTitle =
        !titleUsedInHeader &&
        entry.item.type === "blog" &&
        entry.item.rendered?.title === title;
      if (skipTitle) titleUsedInHeader = true;
      rendered = await renderItem(entry.item, dateStr, {
        includeTitle: !skipTitle,
      });
    } else {
      // Skip ## title for the MT entry whose title matches the page title (already in h1)
      const skipTitle = !titleUsedInHeader && entry.entry.entry_title === title;
      if (skipTitle) titleUsedInHeader = true;
      rendered = renderMtEntry(entry.entry, { includeTitle: !skipTitle });
    }
    renderedParts.push(rendered);
  }

  // Build markdown with frontmatter
  const frontmatter = [
    "---",
    `date: ${frontmatterDateTime(dateValue)}`,
    `title: ${yamlString(title)}`,
    `permalink: ${permalink}`,
    "---",
  ].join("\n");

  const body = renderedParts.join("\n\n---\n\n");

  // Zero-pad any unpadded /archive/by_date/ URLs in post content
  const paddedBody = padArchiveUrls(body);

  // Scan for self-hosted references and legacy JS
  scanContent(dateStr, paddedBody);

  return frontmatter + "\n\n" + paddedBody + "\n";
}

// ---------------------------------------------------------------------------
// Nginx redirect generation
// ---------------------------------------------------------------------------

function parseRedirectsCsv(csvPath) {
  const content = readFileSync(csvPath, "utf-8");
  const lines = content.trim().split("\n");
  // Skip header
  const redirects = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV — handle quoted fields
    const fields = parseCsvLine(line);
    const legacyUrl = fields[0];
    const targetDayUrl = fields[2]; // target_day_url is column 3

    if (legacyUrl && targetDayUrl) {
      // Normalize to trailing slash
      let target = targetDayUrl.replace(/#.*$/, ""); // strip any anchor
      if (!target.endsWith("/")) target += "/";

      redirects.push({ legacyUrl, target });
    }
  }

  return redirects;
}

/** Simple CSV line parser handling quoted fields. */
function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

function escapeNginxPath(path) {
  // Escape dots for nginx regex
  return path.replace(/\./g, "\\.");
}

function generateNginxConfig(redirects) {
  const lines = ["# Generated from redirects.csv — do not edit manually", ""];

  for (const r of redirects) {
    const escaped = escapeNginxPath(r.legacyUrl);
    lines.push(`rewrite ^${escaped}$ ${r.target} permanent;`);
  }

  // Add legacy /archives/ → /archive/ redirect
  lines.push("");
  lines.push("# Legacy MT archive landing page");
  lines.push("rewrite ^/archives/$ /archive/ permanent;");

  return lines.join("\n") + "\n";
}

// ---------------------------------------------------------------------------
// Media report generation
// ---------------------------------------------------------------------------

function generateMediaReport() {
  const lines = [];
  lines.push("# Migration Media Report");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");

  // Local images copied
  lines.push(
    `## Local Images Copied (${mediaReport.localImagesCopied.length})`,
  );
  lines.push("");
  if (mediaReport.localImagesCopied.length > 0) {
    for (const item of mediaReport.localImagesCopied) {
      lines.push(`- ${item.date}: ${item.filename}`);
    }
  } else {
    lines.push("None.");
  }
  lines.push("");

  // Tumblr images downloaded
  lines.push(
    `## Tumblr Images Downloaded and Localized (${mediaReport.tumblrDownloaded.length})`,
  );
  lines.push("");
  if (mediaReport.tumblrDownloaded.length > 0) {
    for (const item of mediaReport.tumblrDownloaded) {
      lines.push(
        `- ${item.date} (item ${item.itemId}): ${item.url} → ${item.filename}`,
      );
    }
  } else {
    lines.push("None.");
  }
  lines.push("");

  // Unresolved Tumblr references
  lines.push(
    `## Unresolved Remote Tumblr References (${mediaReport.tumblrUnresolved.length})`,
  );
  lines.push("");
  if (mediaReport.tumblrUnresolved.length > 0) {
    for (const item of mediaReport.tumblrUnresolved) {
      lines.push(
        `- ${item.date} (item ${item.itemId}): ${item.urls.join(", ")}`,
      );
    }
  } else {
    lines.push("None.");
  }
  lines.push("");

  // Missing local files
  lines.push(
    `## Missing Local Image Files (${mediaReport.missingLocalFiles.length})`,
  );
  lines.push("");
  if (mediaReport.missingLocalFiles.length > 0) {
    for (const item of mediaReport.missingLocalFiles) {
      lines.push(`- ${item.date}: ${item.filename}`);
    }
  } else {
    lines.push("None.");
  }
  lines.push("");

  // Failed downloads
  lines.push(
    `## Failed Image Downloads (${mediaReport.failedDownloads.length})`,
  );
  lines.push("");
  if (mediaReport.failedDownloads.length > 0) {
    for (const item of mediaReport.failedDownloads) {
      lines.push(
        `- ${item.date} (item ${item.itemId}): ${item.url} — ${item.status || item.error}`,
      );
    }
  } else {
    lines.push("None.");
  }
  lines.push("");

  // stungeye.com remote image references (from processHtmlImages CI scanning)
  lines.push(
    `## stungeye.com Remote Image References — CI Items (${mediaReport.stungeyeRemoteRefs.length})`,
  );
  lines.push("");
  if (mediaReport.stungeyeRemoteRefs.length > 0) {
    lines.push(
      "These are left as remote references for future manual localization.",
    );
    lines.push("");
    for (const item of mediaReport.stungeyeRemoteRefs) {
      lines.push(`- ${item.date} (item ${item.itemId}): ${item.url}`);
    }
  } else {
    lines.push("None.");
  }
  lines.push("");

  // stungeye.com media references (full-content scan)
  const mediaByType = {};
  for (const ref of mediaReport.stungeyeMediaRefs) {
    if (!mediaByType[ref.type]) mediaByType[ref.type] = [];
    mediaByType[ref.type].push(ref);
  }
  lines.push(
    `## stungeye.com Self-Hosted Media References (${mediaReport.stungeyeMediaRefs.length} across ${new Set(mediaReport.stungeyeMediaRefs.map((r) => r.date)).size} days)`,
  );
  lines.push("");
  if (mediaReport.stungeyeMediaRefs.length > 0) {
    lines.push(
      "These URLs reference media files on stungeye.com that are not included in the static site output.",
      "If deployment replaces the old site root, these will 404.",
    );
    lines.push("");
    for (const [ext, refs] of Object.entries(mediaByType).sort()) {
      lines.push(`### ${ext} files (${refs.length})`);
      lines.push("");
      for (const ref of refs) {
        lines.push(`- ${ref.date}: ${ref.url}`);
      }
      lines.push("");
    }
  } else {
    lines.push("None.");
  }
  lines.push("");

  // stungeye.com page/directory references
  lines.push(
    `## stungeye.com Self-Hosted Page/Directory Links (${mediaReport.stungeyePageRefs.length} across ${new Set(mediaReport.stungeyePageRefs.map((r) => r.date)).size} days)`,
  );
  lines.push("");
  if (mediaReport.stungeyePageRefs.length > 0) {
    lines.push(
      "These link to HTML pages, directories, or other non-media resources on stungeye.com.",
      "Includes pages that may auto-load index.html.",
    );
    lines.push("");
    for (const ref of mediaReport.stungeyePageRefs) {
      lines.push(`- ${ref.date}: ${ref.url}`);
    }
  } else {
    lines.push("None.");
  }
  lines.push("");

  // display_*() function usage
  lines.push(
    `## Legacy display_*() JavaScript Usage (${mediaReport.displayFnUsage.length} days)`,
  );
  lines.push("");
  if (mediaReport.displayFnUsage.length > 0) {
    lines.push(
      "These posts depend on `display_image()`, `display_image_mult()`, `display_flash()`, or",
      "`display_processing()` JavaScript functions that are not shipped in the static site.",
      "Clicking these links currently does nothing.",
    );
    lines.push("");
    for (const item of mediaReport.displayFnUsage) {
      const fns = item.functions.map((f) => `display_${f}()`).join(", ");
      lines.push(`- ${item.date}: ${fns}`);
    }
  } else {
    lines.push("None.");
  }
  lines.push("");

  // Other inline JS
  lines.push(
    `## Other Inline JavaScript (${mediaReport.inlineJsUsage.length} days)`,
  );
  lines.push("");
  if (mediaReport.inlineJsUsage.length > 0) {
    lines.push(
      "Posts with inline event handlers (onclick, onmouseover, etc.) not related to display_*() functions.",
    );
    lines.push("");
    for (const item of mediaReport.inlineJsUsage) {
      lines.push(`- ${item.date}: ${item.handlers.join(", ")}`);
    }
  } else {
    lines.push("None.");
  }

  return lines.join("\n") + "\n";
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("Starting migration...\n");

  // Load data
  console.log("Loading export data...");
  const ciDays = JSON.parse(readFileSync(CI_DAYS_PATH, "utf-8"));
  const mtEntries = JSON.parse(readFileSync(MT_ENTRIES_PATH, "utf-8"));
  const redirects = parseRedirectsCsv(REDIRECTS_CSV_PATH);

  console.log(`  CI days: ${ciDays.length}`);
  console.log(`  MT entries: ${mtEntries.length} (published)`);
  console.log(`  Redirects: ${redirects.length}`);

  // Group MT entries by day_date
  const mtByDay = new Map();
  for (const entry of mtEntries) {
    if (entry.entry_status !== 2) continue;
    const key = entry.day_date;
    if (!mtByDay.has(key)) mtByDay.set(key, []);
    mtByDay.get(key).push(entry);
  }

  // Sort MT entries within each day by timestamp descending
  // (will be merged with CI items later)

  // Build set of all day dates
  const allDates = new Set();
  for (const day of ciDays) allDates.add(day.date);
  for (const date of mtByDay.keys()) allDates.add(date);

  // Index CI days by date
  const ciByDate = new Map();
  for (const day of ciDays) ciByDate.set(day.date, day);

  console.log(`  Total unique days: ${allDates.size}`);
  console.log("");

  // Generate day pages
  console.log("Generating day pages...");
  mkdirSync(POSTS_DIR, { recursive: true });
  // Write directory data file for Eleventy layout
  writeFileSync(
    join(POSTS_DIR, "posts.json"),
    JSON.stringify({ layout: "layouts/day.njk" }, null, 2) + "\n",
    "utf-8",
  );
  const sortedDates = [...allDates].sort();
  let ciOnlyCount = 0;
  let mtOnlyCount = 0;
  let mergedCount = 0;
  let totalItems = 0;

  for (const dateStr of sortedDates) {
    const ciDay = ciByDate.get(dateStr) || null;
    const mtDayEntries = mtByDay.get(dateStr) || null;

    if (ciDay && mtDayEntries) mergedCount++;
    else if (ciDay) ciOnlyCount++;
    else mtOnlyCount++;

    const ciItemCount = ciDay ? ciDay.items.length : 0;
    const mtItemCount = mtDayEntries ? mtDayEntries.length : 0;
    totalItems += ciItemCount + mtItemCount;

    const markdown = await generateDayPage(dateStr, ciDay, mtDayEntries);

    const outDir = dayOutputDir(dateStr);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "index.md"), markdown, "utf-8");
  }

  console.log(`  CI-only days: ${ciOnlyCount}`);
  console.log(`  MT-only days: ${mtOnlyCount}`);
  console.log(`  Merged days: ${mergedCount}`);
  console.log(`  Total items/entries: ${totalItems}`);
  console.log("");

  // Validate redirect targets
  console.log("Validating redirect targets...");
  let redirectErrors = 0;
  for (const r of redirects) {
    // Extract date from target URL
    const match = r.target.match(
      /\/archive\/by_date\/(\d{4})\/(\d{2})\/(\d{2})\//,
    );
    if (match) {
      const dateStr = `${match[1]}-${match[2]}-${match[3]}`;
      if (!allDates.has(dateStr)) {
        console.error(
          `  ERROR: Redirect target ${r.target} has no built page (from ${r.legacyUrl})`,
        );
        redirectErrors++;
      }
    }
  }
  if (redirectErrors === 0) {
    console.log("  All redirect targets have corresponding built pages.");
  } else {
    console.log(`  ${redirectErrors} redirect target(s) missing built pages!`);
  }
  console.log("");

  // Generate Nginx config
  console.log("Generating Nginx redirect config...");
  mkdirSync(NGINX_DIR, { recursive: true });
  const nginxConfig = generateNginxConfig(redirects);
  writeFileSync(join(NGINX_DIR, "redirects.conf"), nginxConfig, "utf-8");
  console.log(
    `  Written to nginx/redirects.conf (${redirects.length + 1} rules)`,
  );
  console.log("");

  // Generate media report
  console.log("Generating media report...");
  const report = generateMediaReport();
  writeFileSync(MEDIA_REPORT_PATH, report, "utf-8");
  console.log(`  Local images copied: ${mediaReport.localImagesCopied.length}`);
  console.log(
    `  Tumblr images downloaded: ${mediaReport.tumblrDownloaded.length}`,
  );
  console.log(
    `  Unresolved Tumblr refs: ${mediaReport.tumblrUnresolved.length}`,
  );
  console.log(`  Missing local files: ${mediaReport.missingLocalFiles.length}`);
  console.log(`  Failed downloads: ${mediaReport.failedDownloads.length}`);
  console.log(
    `  stungeye.com remote refs: ${mediaReport.stungeyeRemoteRefs.length}`,
  );
  console.log(
    `  stungeye.com media refs: ${mediaReport.stungeyeMediaRefs.length}`,
  );
  console.log(
    `  stungeye.com page refs: ${mediaReport.stungeyePageRefs.length}`,
  );
  console.log(`  display_*() usage: ${mediaReport.displayFnUsage.length} days`);
  console.log(`  Other inline JS: ${mediaReport.inlineJsUsage.length} days`);
  console.log("");

  console.log("Migration complete!");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
