import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { DateTime } from "luxon";
import config from "../src/_data/config.js";

const ROOT = new URL("..", import.meta.url).pathname;
const POSTS_DIR = join(ROOT, "src", "posts");
const SITE_DIR = join(ROOT, "_site");

const boundaryPosts = [
  {
    path: ["2005", "02", "01"],
    expectedDate: "2005-02-01T05:43:03.000-06:00",
    expectedMonth: "2005/02",
    wrongMonth: "2005/01",
  },
  {
    path: ["2005", "04", "01"],
    expectedDate: "2005-04-01T01:04:26.000-06:00",
    expectedMonth: "2005/04",
    wrongMonth: "2005/03",
  },
  {
    path: ["2005", "10", "01"],
    expectedDate: "2005-10-01T02:20:18.000-05:00",
    expectedMonth: "2005/10",
    wrongMonth: "2005/09",
  },
  {
    path: ["2009", "02", "01"],
    expectedDate: "2009-02-01T03:20:13.000-06:00",
    expectedMonth: "2009/02",
    wrongMonth: "2009/01",
  },
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(existsSync(SITE_DIR), "Run npm run build before verify:dates");

function readPost(pathParts) {
  return readFileSync(join(POSTS_DIR, ...pathParts, "index.md"), "utf-8");
}

function frontmatterDate(markdown) {
  const match = markdown.match(/^date:\s*(.+)$/m);
  assert(match, "Missing frontmatter date");
  return match[1].trim();
}

function frontmatterPermalink(markdown) {
  const match = markdown.match(/^permalink:\s*(.+)$/m);
  assert(match, "Missing frontmatter permalink");
  return match[1].trim();
}

function assertPostDateMatchesFolder(pathParts, dateValue) {
  const expectedDay = pathParts.join("-");
  const dt = DateTime.fromISO(dateValue, { setZone: true });
  assert(dt.isValid, `Invalid ISO date for ${pathParts.join("/")}: ${dateValue}`);
  const siteDt = dt.setZone(config.siteTimeZone);
  assert(
    dt.offset === siteDt.offset,
    `${pathParts.join("/")} date is not written with the ${config.siteTimeZone} offset: ${dateValue}`,
  );
  assert(
    siteDt.toISODate() === expectedDay,
    `${pathParts.join("/")} renders as ${siteDt.toISODate()} in ${config.siteTimeZone}`,
  );
}

function assertPostPermalinkMatchesFolder(pathParts, permalink) {
  const expectedPermalink = `/archive/by_date/${pathParts.join("/")}/`;
  assert(
    permalink === expectedPermalink,
    `${pathParts.join("/")} permalink is ${permalink}, expected ${expectedPermalink}`,
  );
}

function assertBuiltMonthLink(monthPath, postPath) {
  const monthFile = join(SITE_DIR, "archive", "by_date", ...monthPath.split("/"), "index.html");
  assert(existsSync(monthFile), `Missing built month archive ${monthPath}`);
  const html = readFileSync(monthFile, "utf-8");
  const href = `/archive/by_date/${postPath.join("/")}/`;
  assert(html.includes(`href="${href}"`), `${href} missing from ${monthPath}`);
}

function assertBuiltMonthMissing(monthPath, postPath) {
  const monthFile = join(SITE_DIR, "archive", "by_date", ...monthPath.split("/"), "index.html");
  assert(existsSync(monthFile), `Missing built month archive ${monthPath}`);
  const html = readFileSync(monthFile, "utf-8");
  const href = `/archive/by_date/${postPath.join("/")}/`;
  assert(!html.includes(`href="${href}"`), `${href} unexpectedly present in ${monthPath}`);
}

function postPaths(dir = POSTS_DIR, prefix = []) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const childPath = join(dir, entry.name);
    const childPrefix = [...prefix, entry.name];

    if (entry.isDirectory()) {
      return postPaths(childPath, childPrefix);
    }

    if (entry.isFile() && entry.name === "index.md") {
      return [prefix];
    }

    return [];
  });
}

for (const pathParts of postPaths()) {
  const post = readPost(pathParts);
  const dateValue = frontmatterDate(post);
  const permalink = frontmatterPermalink(post);

  assert(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?[+-]\d{2}:\d{2}$/.test(
      dateValue,
    ),
    `${pathParts.join("/")} date must be an explicit local-offset ISO datetime: ${dateValue}`,
  );

  assertPostDateMatchesFolder(pathParts, dateValue);
  assertPostPermalinkMatchesFolder(pathParts, permalink);
}

for (const post of boundaryPosts) {
  const dateValue = frontmatterDate(readPost(post.path));
  assert(
    dateValue === post.expectedDate,
    `${post.path.join("/")} date is ${dateValue}, expected ${post.expectedDate}`,
  );
  assertPostDateMatchesFolder(post.path, dateValue);
  assertBuiltMonthLink(post.expectedMonth, post.path);
  assertBuiltMonthMissing(post.wrongMonth, post.path);
}

const feedPath = join(SITE_DIR, "feed.xml");
assert(existsSync(feedPath), "Missing built feed.xml");
const feed = readFileSync(feedPath, "utf-8");
for (const pubDate of feed.matchAll(/<pubDate>([^<]+)<\/pubDate>/g)) {
  assert(
    /^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} [+-]\d{4}$/.test(
      pubDate[1],
    ),
    `Invalid RSS pubDate: ${pubDate[1]}`,
  );
}

console.log("Date/time authoring checks passed.");
