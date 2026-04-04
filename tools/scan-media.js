/**
 * scan-media.js — Scan migrated markdown files for remote image references.
 *
 * Run: npm run scan-media
 *
 * Reports remote image/media URLs found in src/posts/ content,
 * grouped by domain. Independent of the migration script.
 */

import fs from "node:fs";
import path from "node:path";
import { load as cheerioLoad } from "cheerio";

const POSTS_DIR = path.resolve("src/posts");

/** Recursively find all index.md files under a directory. */
function findMarkdownFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir.toString(), entry.name);
    if (entry.isDirectory()) {
      results.push(...findMarkdownFiles(full));
    } else if (entry.name === "index.md") {
      results.push(full);
    }
  }
  return results;
}

/** Extract the date portion from a file path like src/posts/2002/08/18/index.md */
function dateFromPath(filePath) {
  const rel = path.relative(POSTS_DIR, filePath);
  const parts = rel.split(path.sep);
  if (parts.length >= 3) {
    return `${parts[0]}-${parts[1]}-${parts[2]}`;
  }
  return rel;
}

/** Strip YAML frontmatter from markdown content. */
function stripFrontmatter(content) {
  const match = content.match(/^---\n[\s\S]*?\n---\n/);
  return match ? content.slice(match[0].length) : content;
}

/**
 * Extract remote image/media URLs from HTML content.
 * Checks <img src>, <img srcset>, background-image in style attributes,
 * and markdown image syntax.
 */
function extractRemoteUrls(body, date) {
  const refs = [];

  // Parse as HTML fragment with cheerio
  const $ = cheerioLoad(body, { xml: false, decodeEntities: false });

  // <img src="...">
  $("img").each((_, el) => {
    const src = $(el).attr("src");
    if (src && /^https?:\/\//i.test(src)) {
      refs.push({ url: src, context: "img src", date });
    }
    // srcset
    const srcset = $(el).attr("srcset");
    if (srcset) {
      for (const part of srcset.split(",")) {
        const url = part.trim().split(/\s+/)[0];
        if (url && /^https?:\/\//i.test(url)) {
          refs.push({ url, context: "img srcset", date });
        }
      }
    }
  });

  // <a href="..."> pointing to image files
  $("a").each((_, el) => {
    const href = $(el).attr("href");
    if (
      href &&
      /^https?:\/\//i.test(href) &&
      /\.(jpg|jpeg|png|gif|webp|svg|bmp|swf)(\?|$)/i.test(href)
    ) {
      refs.push({ url: href, context: "a href (media)", date });
    }
  });

  // onclick handlers with image/media URLs
  $("[onclick]").each((_, el) => {
    const onclick = $(el).attr("onclick");
    const urlMatches = onclick.match(/https?:\/\/[^\s'")\]]+/gi);
    if (urlMatches) {
      for (const url of urlMatches) {
        if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|swf)(\?|$)/i.test(url)) {
          refs.push({ url, context: "onclick", date });
        }
      }
    }
  });

  // Markdown image syntax: ![alt](url)
  const mdImagePattern = /!\[[^\]]*\]\((https?:\/\/[^)]+)\)/gi;
  let match;
  while ((match = mdImagePattern.exec(body)) !== null) {
    refs.push({ url: match[1], context: "markdown image", date });
  }

  return refs;
}

function main() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error(`Posts directory not found: ${POSTS_DIR}`);
    console.error("Run 'npm run migrate' first.");
    process.exit(1);
  }

  const files = findMarkdownFiles(POSTS_DIR);
  console.log(
    `Scanning ${files.length} day pages for remote media references...\n`,
  );

  const allRefs = [];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    const body = stripFrontmatter(content);
    const date = dateFromPath(file);
    const refs = extractRemoteUrls(body, date);
    allRefs.push(...refs);
  }

  // Deduplicate by URL + date
  const seen = new Set();
  const unique = [];
  for (const ref of allRefs) {
    const key = `${ref.date}|${ref.url}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(ref);
    }
  }

  // Group by domain
  const byDomain = {};
  for (const ref of unique) {
    let domain;
    try {
      domain = new URL(ref.url).hostname;
    } catch {
      domain = "unknown";
    }
    if (!byDomain[domain]) byDomain[domain] = [];
    byDomain[domain].push(ref);
  }

  // Report
  const domains = Object.keys(byDomain).sort();
  console.log(
    `Found ${unique.length} unique remote media references across ${domains.length} domains.\n`,
  );

  for (const domain of domains) {
    const refs = byDomain[domain];
    console.log(`## ${domain} (${refs.length})\n`);
    for (const ref of refs.sort((a, b) => a.date.localeCompare(b.date))) {
      console.log(`  ${ref.date}  [${ref.context}]  ${ref.url}`);
    }
    console.log();
  }

  // Summary
  console.log("---");
  console.log("Summary:");
  for (const domain of domains) {
    console.log(`  ${domain}: ${byDomain[domain].length}`);
  }
  console.log(`  Total: ${unique.length}`);
}

main();
