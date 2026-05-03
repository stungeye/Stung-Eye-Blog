# Issue 3: Legacy MT Body H1 Headings

**Status:** FIXED 2026/05/03

## Original Problem

Seven MT-era generated markdown files contained body `<h1>` tags that were used
as section headings inside a day page:

- `src/posts/2004/08/17/index.md`
- `src/posts/2004/08/28/index.md`
- `src/posts/2004/08/31/index.md`
- `src/posts/2005/02/23/index.md`
- `src/posts/2005/07/18/index.md`
- `src/posts/2005/12/16/index.md`
- `src/posts/2007/12/29/index.md`

The site header and day page title already use top-level headings. The practical
issue was not merely that multiple `<h1>` elements existed, but that legacy body
subheadings were too high in the article hierarchy.

## Repair

- Added an MT migration transform that demotes legacy body `<h1>` tags to
  `<h2>` after HTML normalization.
- Preserved heading attributes and contents during the demotion.
- Regenerated posts with `npm run migrate`, then restored resized images with
  `npm run resize-images`.
- Added `tools/verify-issue-3.js` and `npm run verify:issue3` to check the
  known affected generated posts.

## Verification

Commands run:

```bash
npm run verify:issue3
npm run migrate
npm run resize-images
npm run verify:issue3
npm run build
npm run verify:dates
node tools/verify-issue-1.js
npm run verify:issue4
rg -n '<h1|</h1>' src/posts --glob 'index.md'
```

Results:

- The new issue #3 verifier failed before the migration fix and passed after
  regeneration.
- `rg -n '<h1|</h1>' src/posts --glob 'index.md'` returns no matches.
- The Eleventy build passes.
- Date/time authoring checks still pass.
- Existing MT heading title-dedup and RSS feed checks still pass.

## Changed Files

- `tools/migrate.js`
- `tools/verify-issue-3.js`
- `package.json`
- `MIGRATION-NOTES.md`
- `docs/issues-and-fixes.md`
- `migration-media-report.md`
- Generated affected post markdown under `src/posts/`
