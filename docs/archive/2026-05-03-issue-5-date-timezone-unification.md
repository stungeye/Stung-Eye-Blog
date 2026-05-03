# Issue 5: Date Timezone Unification

**Status:** FIXED 2026/05/03

## Original Problem

Migrated markdown `date` values were legacy site-local wall-clock timestamps,
effectively `America/Winnipeg`, but Eleventy/js-yaml parsed bare frontmatter
datetimes as UTC. The build then mixed UTC formatting with machine-local archive
grouping, making archive behavior depend on accidental timezone interpretation.

The known month-boundary failures were:

| Day page   | Old timestamp          | Correct site-time grouping |
| ---------- | ---------------------- | -------------------------- |
| 2005-02-01 | `2005-02-01 05:43:03`  | February 2005              |
| 2005-04-01 | `2005-04-01 01:04:26`  | April 2005                 |
| 2005-10-01 | `2005-10-01 02:20:18`  | October 2005               |
| 2009-02-01 | `2009-02-01 03:20:13`  | February 2009              |

## Repair

- Added `siteTimeZone: "America/Winnipeg"` to site config.
- Updated migration to parse legacy timestamps as Winnipeg wall time with Luxon
  and emit explicit-offset ISO frontmatter.
- Reran migration to update the checked-in `src/posts/` corpus.
- Reran image resizing after migration restored 500px source images.
- Updated Eleventy date filters and archive grouping helpers to use the
  configured site timezone instead of UTC or host-local getters.
- Added `npm run verify:issue5` to check frontmatter offsets, folder/day
  agreement, boundary month placement, and RSS pubDate formatting.

## Verification

- Confirmed `npm run verify:issue5` fails before the repair on bare migrated
  datetimes.
- Ran `TZ=UTC npm run build && npm run verify:issue5`.
- Ran `TZ=America/Winnipeg npm run build && npm run verify:issue5`.
- Spot checked published dates and times for posts from 2002, 2004, 2007, 2015,
  and 2023 against live legacy/Tumblr pages or live date pages:
  - 2002-08-18: `2002-08-18T14:40:01.000-05:00` matches live MT footer
    `Aug 18, 2002 @ 02:40 PM`.
  - 2004-08-17: `2004-08-17T12:28:35.000-05:00` matches live MT footer
    `Aug 17, 2004 @ 12:28 PM`.
  - 2007-05-14: `2007-05-14T13:42:08.000-05:00` matches live MT footer
    `May 14, 2007 @ 01:42 PM`.
  - 2015-07-11: `2015-07-11T09:43:45.000-05:00` matches Tumblr
    `datePublished` `2015-07-11T13:43:45+00:00` and the live day page date.
  - 2023-02-12: `2023-02-12T16:40:40.000-06:00` matches Tumblr
    `datePublished` `2023-02-12T21:40:40+00:00` and the live day page date.

## Changed Files

- `src/_data/config.js`
- `eleventy.config.js`
- `tools/migrate.js`
- `tools/verify-issue-5.js`
- `package.json`
- `README.md`
- `MIGRATION-NOTES.md`
- `src/posts/**/index.md`
