# Issue 4: RSS Feed Entity Decoding

**Status:** FIXED 2026/05/03

## Original Problem

RSS feed descriptions were double-encoding existing HTML entities. The
"Reading in 2023" feed item contained `&amp;amp;` in `_site/feed.xml`.

Root cause: `src/pages/feed.njk` stripped tags from rendered HTML content,
leaving existing HTML entities as plain text for Nunjucks to escape again when
rendering XML.

## Repair

- Added a `decodeHtmlEntities` Eleventy filter backed by the `entities`
  package.
- Applied that filter to RSS descriptions after tag stripping and before
  truncation/XML rendering.
- Added `tools/verify-issue-4.js` and `npm run verify:issue4` to check built
  feed output for the regression.
- Declared `entities` as a direct dev dependency because the Eleventy config now
  imports it directly.

## Verification

Commands run:

```bash
npm run build
npm run verify:issue4
npm run verify:dates
```

Results:

- `npm run verify:issue4` passes.
- The "Reading in 2023" description now contains `2022 &amp; 2021`, with exactly
  one XML escape.
- No `&amp;amp;` remains in `_site/feed.xml`.
- Date/time authoring checks still pass.

## Changed Files

- `eleventy.config.js`
- `src/pages/feed.njk`
- `tools/verify-issue-4.js`
- `package.json`
- `package-lock.json`
- `docs/issues-and-fixes.md`
