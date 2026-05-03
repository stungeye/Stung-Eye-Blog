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
  manual authoring example uses a date-only frontmatter value.

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
- Date-only frontmatter remains the safest interim manual convention until the
  repair is complete. After repair, migrated datetimes should carry explicit
  offsets, and future manual/CMS authoring with clock times should use explicit
  local-offset datetimes unless a separate archive-date model or custom
  date-only parsing is added.

## Active Issues

### 1. Medium: Multi-entry MT day heading dedup creates orphaned sections

**Status:** Confirmed. Keep as Medium because the content is present, but the
reading structure is confusing on affected days.

**What:** On multi-entry MT-only days, the page title is taken from the first MT
entry in export order, while body entries render newest-first. The heading dedup
then removes the heading from the title-matching entry even when that entry
renders later on the page.

**Scope:** Confirmed 22 affected pages out of 23 multi-entry MT-only days. The
unaffected day is 2004-12-11, where identical timestamps preserve the expected
order.

Representative examples:

- [src/posts/2003/01/02/index.md](../src/posts/2003/01/02/index.md) - h1
  "Zone Woes"; first rendered section is `## 1825`; "Zone Woes" content appears
  below without a heading.
- [src/posts/2003/02/17/index.md](../src/posts/2003/02/17/index.md) - h1
  "A New Home"; first rendered section is `## Balanced`.
- [src/posts/2003/09/11/index.md](../src/posts/2003/09/11/index.md) - h1
  "What happened here?"; first rendered section is `## On a ferry`.

**Root cause:** `determineDayTitle()` in [tools/migrate.js](../tools/migrate.js)
uses `mtEntries[0]`; `buildDayEntries()` sorts entries descending before
rendering.

**Implementation note:** If `src/posts/` is now the canonical corpus, fixing only
the migration script will not alter the checked-in pages unless migration is
rerun. A repair should either patch the 22 generated markdown files directly or
change migration and intentionally regenerate the corpus.

### 2. Low: Archive nav link missing trailing slash

**Status:** Confirmed. Quick fix.

**What:** [src/\_includes/layouts/base.njk](../src/_includes/layouts/base.njk)
links to `/archive` instead of `/archive/`.

**Impact:** One avoidable redirect when clicking the nav link on servers that
canonicalize directory indexes. No content risk.

**Fix:** Change the nav href to `/archive/`.

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

### 5. High: Date handling mixes UTC, machine-local, and site-local semantics

**Status:** Confirmed. High for archive correctness; no data loss.

**What:** Migrated markdown `date` values are legacy site-local wall-clock
timestamps, effectively `America/Winnipeg`. Eleventy/js-yaml parses bare
frontmatter datetimes as UTC `Date` objects, while
[eleventy.config.js](../eleventy.config.js) currently mixes:

- UTC formatting filters: `readableDate`, `shortDate`, `isoDate`, `rssDate`
- machine-local grouping/filtering: `daysByMonth`, `daysByYear`,
  `yearFromDate`, `monthFromDate`, `uniqueMonths`

This makes archive behavior depend on an accidental reinterpretation of
site-local strings as UTC instants, then sometimes as the build machine's local
date.

**Confirmed current scope:** If Eleventy's already-misparsed UTC `Date` objects
are displayed or grouped in `America/Winnipeg`, 90 of 970 posts shift to the
previous Winnipeg calendar day. Only these 4 cross a month boundary and appear
in the wrong month archive today:

| Day page   | Frontmatter timestamp | Live/export confirmation             | Current wrong grouping | Correct site-time grouping |
| ---------- | --------------------- | ------------------------------------ | ---------------------- | -------------------------- |
| 2005-02-01 | `2005-02-01 05:43:03` | live MT: Feb 1, 2005 @ 05:43 AM      | January 2005           | February 2005              |
| 2005-04-01 | `2005-04-01 01:04:26` | live MT: Apr 1, 2005 @ 01:04 AM      | March 2005             | April 2005                 |
| 2005-10-01 | `2005-10-01 02:20:18` | live MT: Oct 1, 2005 @ 02:20 AM      | September 2005         | October 2005               |
| 2009-02-01 | `2009-02-01 03:20:13` | Tumblr local date: Feb 1, 2009 03:20 | January 2009           | February 2009              |

**Correct model:** Unless one already exists, add a single site timezone setting,
preferably `siteTimeZone: "America/Winnipeg"` in
[src/\_data/config.js](../src/_data/config.js). The migrated corpus should carry
explicit offset datetimes generated from legacy site-local wall time. Eleventy
can then ingest frontmatter dates normally as real instants, while archive
display/grouping should still use the configured site timezone. Do not use
machine-local `getFullYear()`/`getMonth()` and do not use UTC calendar fields
for archive grouping.

**Implementation direction for a fresh repair agent:**

1. Add `siteTimeZone: "America/Winnipeg"` to
   [src/\_data/config.js](../src/_data/config.js).
2. Update [tools/migrate.js](../tools/migrate.js) so generated frontmatter
   datetimes are ISO strings with explicit Winnipeg offsets. Use Luxon to parse
   legacy timestamps as `America/Winnipeg` wall time and emit ISO, for example
   `2005-02-01T05:43:03.000-06:00`,
   `2005-10-01T02:20:18.000-05:00`, and
   `2009-02-01T03:20:13.000-06:00`. Do not hand-edit offset math; Luxon should
   apply historical DST rules.
3. Intentionally update the checked-in generated corpus under `src/posts/`:
   either rerun migration in the established project workflow, or apply a
   focused script/patch that converts all migrated bare `date:` values using the
   same Luxon logic. Keep date-only manually-authored posts, if any, date-only.
4. Update [eleventy.config.js](../eleventy.config.js) date filters and archive
   grouping helpers to use `config.siteTimeZone` consistently. `page.date` and
   `day.date` should be real instants after explicit offsets are present, but
   year/month/day display and grouping must be computed with
   `DateTime.fromJSDate(date).setZone(config.siteTimeZone)`, not UTC or
   machine-local getters.
5. Keep the visible archive day, folder path, and permalink in agreement with
   the migrated timestamp's `America/Winnipeg` calendar day.

**Acceptance checks:** Under both `TZ=America/Winnipeg` and another timezone
such as `TZ=UTC`, `npm run build` should place the four confirmed boundary pages
in February 2005, April 2005, October 2005, and February 2009 respectively.
Rendered day dates should still show the same calendar dates as the markdown
folders. RSS should render valid RFC 2822 `pubDate` values using the explicit
Winnipeg-derived instants, not hard-coded `+0000` output.

### 6. Medium: Future post authoring needs an explicit date model

**Status:** Reframed. This is less an immediate migration bug and more an
authoring/CMS design decision.

**What:** The current site has one `date` field doing three jobs:

- sorting day pages
- displaying the day-page date
- generating RSS pubDate

That currently sort-of works for migrated content only because the raw
frontmatter date string, folder, and permalink agree. The parsed JavaScript
`Date` does not preserve the intended meaning. The intended meaning before issue
#5 is repaired is: bare migrated datetimes are site-local `America/Winnipeg`
wall time. After issue #5, migrated datetimes should carry explicit Winnipeg
offsets.

**Interim policy now documented in README:** For manually authored posts, use
date-only frontmatter:

```yaml
date: 2026-05-02
```

This preserves the intended archive day and avoids current local/UTC day shifts.
This is an interim convention only. If issue #5 is fixed by adding explicit
offsets to migrated datetimes, future manually authored posts with clock times
should also use explicit local offsets unless the repair explicitly adds custom
date-only parsing semantics.

**Explicit local offsets:** This parses correctly:

```yaml
date: 2026-05-02T14:30:00-05:00
```

It gives an accurate RSS instant. Archive grouping should follow the configured
site-time calendar day unless a future CMS separates archive day from exact
publish instant.

**Pages CMS direction:** If Pages CMS or similar becomes the authoring interface,
prefer separating the canonical archive day from the exact publish instant, for
example:

- `date` or `archiveDate`: the day-page date used for display, URL, and archive
  grouping
- `publishedAt`: optional local datetime with offset used for RSS ordering/time

That avoids making manual UTC entry part of the long-term workflow and keeps
archive URLs independent from timezone conversion surprises.

### 7. Low: Migration reruns can leave stale `src/posts/` content

**Status:** Confirmed, but conditional.

**What:** `npm run build` removes `_site`, so stale output is not a normal build
risk. `tools/migrate.js` writes into `src/posts/` without first clearing the
generated post tree, so rerunning migration against changed export data can leave
old markdown or media files behind.

**Triage:** Low if the export is frozen and `src/posts/` is now the canonical
corpus. More important if migration will be rerun before deploy.

**Additional context:** A naive "delete `src/posts/` before migrate" fix becomes
dangerous once manually authored or CMS-authored posts live there. If this is
fixed, use an explicit regeneration boundary, a manifest of generated files, or
manual documented cleanup for one-time migration reruns.

## Current Priority Order

| Priority | Issue                          | Why                                                               |
| -------- | ------------------------------ | ----------------------------------------------------------------- |
| 1        | #5 Date timezone unification   | Real archive misplacement on 4 pages; bounded config/template fix |
| 2        | #1 MT heading dedup            | Real readability issue on 22 legacy pages                         |
| 3        | #6 Future authoring date model | Needs a decision before regular manual/CMS authoring              |
| 4        | #2 Archive trailing slash      | Tiny polish fix                                                   |
| 5        | #4 RSS double encoding         | Low current impact, likely easy to test                           |
| 6        | #7 Migration stale files       | Conditional on rerunning migration                                |
| 7        | #3 Body `<h1>` tags            | Legacy semantics polish/defer candidate                           |

No data loss or incorrectly migrated entries were found. The main pre-deploy
repair remains the date handling bug, now reframed as unifying the site around
`America/Winnipeg` wall-clock semantics for migrated frontmatter dates.
