import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const POSTS_DIR = join(ROOT, "src", "posts");
const EXPORT_DIR = join(ROOT, "export");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// Must stay in sync with yamlString() in tools/migrate.js.
// If that function's quoting logic changes, update this copy too.
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

function postPathForDay(dayDate) {
  return join(POSTS_DIR, ...dayDate.split("-"), "index.md");
}

const ciDays = JSON.parse(
  readFileSync(join(EXPORT_DIR, "ci_days.json"), "utf-8"),
);
const mtEntries = JSON.parse(
  readFileSync(join(EXPORT_DIR, "mt_entries.json"), "utf-8"),
);

const ciDates = new Set(ciDays.map((day) => day.date));
const mtByDay = new Map();

for (const entry of mtEntries) {
  if (entry.entry_status !== 2) continue;
  if (!mtByDay.has(entry.day_date)) mtByDay.set(entry.day_date, []);
  mtByDay.get(entry.day_date).push(entry);
}

let checked = 0;

for (const [dayDate, entries] of mtByDay) {
  if (ciDates.has(dayDate) || entries.length < 2) continue;

  const renderedEntries = [...entries].sort((a, b) =>
    b.entry_created_on.localeCompare(a.entry_created_on),
  );
  const pageTitle = renderedEntries[0].entry_title;
  if (!pageTitle) continue;

  const postPath = postPathForDay(dayDate);
  assert(existsSync(postPath), `Missing generated post for ${dayDate}`);

  const markdown = readFileSync(postPath, "utf-8");
  assert(
    markdown.includes(`\ntitle: ${yamlString(pageTitle)}\n`),
    `${dayDate} frontmatter title does not match first rendered MT entry: ${pageTitle}`,
  );

  assert(
    !markdown.includes(`\n## ${pageTitle}\n`),
    `${dayDate} duplicates its page title as a body heading: ${pageTitle}`,
  );

  for (const entry of renderedEntries.slice(1)) {
    if (!entry.entry_title) continue;
    assert(
      markdown.includes(`\n## ${entry.entry_title}\n`),
      `${dayDate} is missing body heading for later MT entry: ${entry.entry_title}`,
    );
  }

  checked++;
}

assert(checked > 0, "No MT-only multi-entry days were checked.");

console.log(`Issue #1 MT heading checks passed for ${checked} days.`);
