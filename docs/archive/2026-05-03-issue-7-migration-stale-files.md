# Issue 7: Migration Reruns Can Leave Stale `src/posts/` Content

**Status:** FIXED 2026/05/03

## Original Problem

`npm run build` removes `_site`, so stale output is not a normal build risk.
`tools/migrate.js` wrote into `src/posts/` without first clearing the generated
post tree, so rerunning migration against changed export data could leave old
markdown or media files behind.

The issue was low priority while the export was frozen, but more important if
migration needed to be rerun before deploy.

## Repair

- Added a visible generated-post marker to every migrated day page:

  ```yaml
  generatedBy: tools/migrate.js
  ```

- Updated `tools/migrate.js` to scan `src/posts/**/index.md` before regenerating.
- Limited marker detection to exact frontmatter lines, so body text and padded
  marker lines are not treated as cleanup authorization.
- Deleted only marked generated day folders, including co-located generated
  media.
- Left unmarked day folders alone, treating them as handwritten or otherwise
  outside the migration regeneration boundary.
- Added `tools/verify-issue-7.js` and `npm run verify:issue7` for focused marker
  parsing checks.

This gives migration reruns a simple "blow away migrated posts, keep handwritten
posts" behavior without relying on a hidden manifest. If a migrated post is ever
hand-edited and should survive future migration runs, remove the marker first.

## Verification

- Confirmed a temporary stale marked generated day folder under `src/posts/` was
  removed by migration.
- Confirmed a temporary unmarked handwritten day folder under `src/posts/`
  survived migration.
- Confirmed steady-state migration removed and regenerated 970 marked day
  folders.
- Confirmed the regenerated migrated corpus has 970 day pages and 970 generated
  markers.
- Ran `node tools/verify-issue-7.js`.
- Ran `node tools/migrate.js`.
- Ran `node tools/resize-images.js`.
- Ran Eleventy build.
- Ran `node tools/verify-date-time-usage.js`.
- Ran `node tools/verify-issue-1.js`.

## Changed Files

- `tools/migrate.js`
- `tools/verify-issue-7.js`
- `package.json`
- `docs/issues-and-fixes.md`
- `migration-media-report.md`
- `src/posts/**/index.md`
