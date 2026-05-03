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

### 6. Medium: Future post authoring needs an explicit date model

**Status:** Reframed. This is less an immediate migration bug and more an
authoring/CMS design decision.

**What:** The current site has one `date` field doing three jobs:

- sorting day pages
- displaying the day-page date
- generating RSS pubDate

Migrated content now carries explicit `America/Winnipeg` offsets after the issue
#5 repair, but the site still has one `date` field doing both calendar-day and
publication-instant work.

**Policy now documented in README:** All manually authored posts must use an
explicit local-offset ISO datetime. Date-only frontmatter is not allowed.

```yaml
date: 2026-05-02T14:30:00-05:00
```

Use the actual publish time, or noon (`12:00:00`) as a neutral placeholder when
there is no meaningful clock time. Archive grouping follows the configured
site-time calendar day.

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
| 1        | #1 MT heading dedup            | Real readability issue on 22 legacy pages            |
| 2        | #6 Future authoring date model | Needs a decision before regular manual/CMS authoring |
| 3        | #2 Archive trailing slash      | Tiny polish fix                                      |
| 4        | #4 RSS double encoding         | Low current impact, likely easy to test              |
| 5        | #7 Migration stale files       | Conditional on rerunning migration                   |
| 6        | #3 Body `<h1>` tags            | Legacy semantics polish/defer candidate              |

No data loss or incorrectly migrated entries were found. The main pre-deploy
date handling repair has been completed and archived.
