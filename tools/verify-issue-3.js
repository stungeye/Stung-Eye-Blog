import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const POSTS_DIR = join(ROOT, "src", "posts");

const AFFECTED_POSTS = [
  "2004/08/17",
  "2004/08/28",
  "2004/08/31",
  "2005/02/23",
  "2005/07/18",
  "2005/12/16",
  "2007/12/29",
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

for (const dayPath of AFFECTED_POSTS) {
  const postPath = join(POSTS_DIR, ...dayPath.split("/"), "index.md");
  const markdown = readFileSync(postPath, "utf-8");
  const h1Matches = markdown.match(/<\/?h1\b[^>]*>/gi) || [];

  assert(
    h1Matches.length === 0,
    `${dayPath} contains legacy body h1 tags: ${h1Matches.join(", ")}`,
  );
}

console.log(`Issue #3 body heading checks passed for ${AFFECTED_POSTS.length} posts.`);
