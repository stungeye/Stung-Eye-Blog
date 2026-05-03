# Issue 6: Single Date Authoring Model

**Status:** FIXED 2026/05/03

## Original Problem

Future manual or CMS authoring needed an explicit date model. The site uses day
pages, but the frontmatter `date` value also drives sorting, visible dates,
sitemap `lastmod`, and RSS `pubDate`. The open question was whether future posts
needed separate calendar-day and publication-instant fields.

## Decision

Keep one canonical `date` field.

All posts use an explicit `America/Winnipeg` local-offset ISO datetime:

```yaml
date: 2026-05-02T12:00:00-05:00
```

Use the actual publish time when it matters, or noon (`12:00:00`) as a neutral
placeholder when there is no meaningful clock time. Date-only frontmatter is not
allowed because Eleventy/js-yaml parses it as UTC midnight before site-time
archive grouping can be applied.

## Repair

- Updated README and Eleventy guide examples to use explicit local-offset ISO
  datetimes.
- Removed the deferred two-date CMS direction from the active issue log.
- Tightened `tools/verify-date-time-usage.js` so every day page must:
  - use an explicit local-offset ISO datetime
  - be written with the configured `America/Winnipeg` offset
  - render to the same site-time calendar day as its folder path
  - use a permalink matching the folder path
- Added `npm run verify:dates` and restored `npm run verify:issue5` as an alias
  to the shared date/time verification.
- Left `src/_data/config.js` unchanged; `siteTimeZone: "America/Winnipeg"` was
  already added during the issue 5 repair.

## Verification

- Confirmed `npm run verify:issue5` failed before the repair because the package
  script referenced the old verifier filename.
- Ran `npm run build`.
- Ran `npm run verify:dates`.
- Ran `npm run verify:issue5`.

## Changed Files

- `README.md`
- `docs/eleventy-guide.md`
- `docs/initial_plan.md`
- `docs/issues-and-fixes.md`
- `tools/verify-date-time-usage.js`
- `package.json`
