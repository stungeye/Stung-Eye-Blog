import { existsSync, readFileSync } from "node:fs";

const FEED_PATH = "_site/feed.xml";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  existsSync(FEED_PATH),
  "Missing _site/feed.xml. Run npm run build before this verifier.",
);

const feed = readFileSync(FEED_PATH, "utf8");
const itemMatch = feed.match(
  /<title>Reading in 2023<\/title>[\s\S]*?<description>([\s\S]*?)<\/description>/,
);

assert(!feed.includes("&amp;amp;"), "RSS feed contains double-encoded &amp;amp;");
assert(itemMatch, "Reading in 2023 feed item was not found");

const description = itemMatch[1];
assert(
  description.includes("2022 &amp; 2021"),
  "Reading in 2023 feed description should XML-escape the decoded ampersand once",
);
assert(
  !description.includes("2022 &amp;amp; 2021"),
  "Reading in 2023 feed description still double-encodes the ampersand",
);
assert(
  !description.includes("2022 & 2021"),
  "Reading in 2023 feed description contains a raw ampersand",
);

console.log("Issue #4 feed encoding verification passed.");
