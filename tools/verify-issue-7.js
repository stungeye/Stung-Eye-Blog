import { hasGeneratedMarker } from "./migrate.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const generatedPost = `---
date: 2026-02-22T09:39:24.000-06:00
generatedBy: tools/migrate.js
title: Reading in 2025
permalink: /archive/by_date/2026/02/22/
---

Body content.
`;

const paddedMarkerPost = `---
date: 2026-02-22T09:39:24.000-06:00
 generatedBy: tools/migrate.js
title: Reading in 2025
permalink: /archive/by_date/2026/02/22/
---

Body content.
`;

const bodyOnlyMarkerPost = `---
date: 2026-02-22T09:39:24.000-06:00
title: Reading in 2025
permalink: /archive/by_date/2026/02/22/
---

generatedBy: tools/migrate.js
`;

const crlfGeneratedPost = generatedPost.replace(/\n/g, "\r\n");

assert(hasGeneratedMarker(generatedPost), "Exact generated marker was not found.");
assert(
  hasGeneratedMarker(crlfGeneratedPost),
  "Exact generated marker was not found with CRLF line endings.",
);
assert(
  !hasGeneratedMarker(paddedMarkerPost),
  "Padded generated marker should not be accepted.",
);
assert(
  !hasGeneratedMarker(bodyOnlyMarkerPost),
  "Generated marker outside frontmatter should not be accepted.",
);
assert(
  !hasGeneratedMarker("generatedBy: tools/migrate.js\n"),
  "Generated marker without frontmatter should not be accepted.",
);

console.log("Issue #7 generated marker checks passed.");
