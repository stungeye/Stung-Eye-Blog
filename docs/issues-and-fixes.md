# Final Pre-Deploy Issues Identified

Original review date: 2026-04-12
Re-triage date: 2026-05-02
Date model research update: 2026-05-03

This file was rechecked against the current README, migration script, Eleventy
config, generated post corpus, and a fresh `npm run build` using nvm Node
v24.14.1.

## What Still Looks Sound

- **Day page count:** 970 generated day pages in `src/posts/`, spanning
  2002-2026.
- **Item count:** 1,252 total items/entries remain accounted for.
- **Built output:** A fresh build completed successfully and produced the
  expected archive/page/feed output.
- **Overlap day (2008-07-23):** Both CI/Tumblr and MT content are present.
- **MT `entry_text_more` concatenation:** Extended MT content is present.
- **Single-entry MT title dedup:** Still working as intended.
- **YAML title quoting:** The migration helper still handles titles with YAML
  special characters.
- **`{{ }}` in legacy content:** `markdownTemplateEngine: false` still prevents
  Nunjucks from processing curly braces inside posts.
- **Permalinks:** Every post has an explicit `/archive/by_date/YYYY/MM/DD/`
  permalink.
- **RSS:** Feed XML builds and dates render in RFC 2822 format.
  **Manual authoring:** README requires explicit local-offset ISO datetimes;
  date-only frontmatter is not allowed.

## Re-Triage Notes

- The date/archive issue is real, but the better framing changed after
  timestamp research on 2026-05-03: migrated markdown datetimes are legacy
  site-local wall-clock timestamps, not UTC publication instants. The best
  operational timezone for the site is `America/Winnipeg`.
- Evidence: MT live page footers match migrated markdown dates to the minute
  while markdown preserves seconds. Example: live "May 14, 2007 @ 01:42 PM"
  matches `src/posts/2007/05/14/index.md` frontmatter
  `2007-05-14 13:42:08`. CI/Tumblr exports contain both a local `date` and a
  `date-gmt`; migrated markdown uses the local `date`, not `date-gmt`. Example:
  `src/posts/2009/02/01/index.md` uses `2009-02-01 03:20:13`, matching Tumblr's
  local `Sun, 01 Feb 2009 03:20:13` while the export GMT value is
  `2009-02-01 08:20:13 GMT`.
- The human author also confirmed that posts during the 2004-2005 Europe period
  often fall in Winnipeg night hours because the publishing platform remained on
  Winnipeg/site time. This supports interpreting migrated datetimes as platform
  wall time rather than author-location time.
- `js-yaml` parses bare frontmatter datetimes such as
  `2005-10-01 02:20:18` as UTC `Date` objects. It also parses `YYYY-MM-DD` as
  UTC midnight and ISO datetimes with offsets as the corresponding UTC instant.
- Important repair warning: do not simply format Eleventy's already-parsed
  `Date` in `America/Winnipeg`. That would turn `2005-10-01 02:20:18` into
  September 30, 2005 21:20 in Winnipeg because the value has already been
  misread as UTC. The preferred fix is to make the migrated frontmatter explicit
  by emitting ISO datetimes with historical `America/Winnipeg` offsets.
- Repair is complete. Migrated datetimes carry explicit Winnipeg offsets.
  All manually authored posts must use explicit local-offset ISO datetimes.
  Date-only frontmatter is not allowed: Eleventy/js-yaml parses bare dates as
  UTC midnight, which shifts the archive day in Winnipeg time.

## Active Issues

### 3. Low: Legacy MT body content contains section-level `<h1>` tags

**Status:** Confirmed, but lower practical risk than originally implied.

**What:** 7 MT-era markdown files contain body `<h1>` tags that are being used as
sub-section headings:

- [src/posts/2004/08/17/index.md](../src/posts/2004/08/17/index.md)
- [src/posts/2004/08/28/index.md](../src/posts/2004/08/28/index.md)
- [src/posts/2004/08/31/index.md](../src/posts/2004/08/31/index.md)
- [src/posts/2005/02/23/index.md](../src/posts/2005/02/23/index.md)
- [src/posts/2005/07/18/index.md](../src/posts/2005/07/18/index.md)
- [src/posts/2005/12/16/index.md](../src/posts/2005/12/16/index.md)
- [src/posts/2007/12/29/index.md](../src/posts/2007/12/29/index.md)

**Additional context:** The site header in `base.njk` already uses an `<h1>` for
the site title and the day layout uses another `<h1>` for the post title, so the
issue is not simply "more than one h1 exists." The real concern is that legacy
body subheadings are semantically too high in the article hierarchy.

**Triage:** Low/defer candidate. Convert to `<h2>` during a broader semantic HTML
pass, or leave alone if preserving legacy markup is preferred.

### 4. Low: RSS feed has double-encoded HTML entities in descriptions

**Status:** Confirmed.

**What:** The "Reading in 2023" feed item currently contains `&amp;amp;` in
`_site/feed.xml`.

**Root cause:** `feed.njk` strips tags from HTML content, leaving existing HTML
entities as text, and Nunjucks then escapes that text again while rendering XML.

**Impact:** One current feed item is affected, but the pattern can recur whenever
a feed item includes literal HTML entities in content.

**Fix direction:** Add or use an entity-decoding step for feed descriptions
before XML escaping, with a focused feed regression check.

## Current Priority Order

| Priority | Issue                    | Why                                     |
| -------- | ------------------------ | --------------------------------------- |
| 1        | #4 RSS double encoding   | Low current impact, likely easy to test |
| 2        | #3 Body `<h1>` tags      | Legacy semantics polish/defer candidate |

No data loss or incorrectly migrated entries were found. The main pre-deploy
date handling repair has been completed and archived.
