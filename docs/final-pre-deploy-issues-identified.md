# Final Pre-Deploy Issues Identified

Review date: 2026-04-12

## What Was Verified (No Issues Found)

- **Day page count:** 970 generated day pages in `src/posts/`, matching the combined CI/Tumblr (548) + MT-only (422) + merged (1) day count.
- **Item count:** 1,252 total items/entries confirmed present (806 CI items + 446 MT entries). Separator count in generated files cross-checks perfectly: 2,222 total `---` lines = 1,940 frontmatter delimiters + 282 inter-item separators = 970 pages + 282 multi-item separators = 1,252 items.
- **Built output matches:** 970 day pages, 25 year pages, 183 month pages, 96 paginated archive pages (/page/2/ through /page/97/) — all present and correct.
- **Image passthrough copy:** 298 images in `src/posts/` → 298 images in `_site/archive/by_date/`. All co-located images copied correctly.
- **No empty or near-empty pages:** Spot-checked posts from every era (2002–2026). All have substantive content.
- **Overlap day (2008-07-23):** Both CI and MT content present and properly merged.
- **MT entry_text_more concatenation:** Extended content from all 33 entries with `entry_text_more` verified present in generated files.
- **Single-entry MT title dedup:** Working correctly — single-entry days have the title in frontmatter only, not duplicated as `##` in the body.
- **YAML special characters in titles:** `yamlString()` correctly quotes titles containing colons, apostrophes, brackets, `@`, `!`, etc.
- **`{{ }}` in legacy content:** `markdownTemplateEngine: false` correctly prevents Nunjucks from processing curly braces in post content. Hundreds of posts contain `{{ }}` without build errors.
- **No unknown item types:** Zero `<!-- TODO: unknown type -->` comments in generated files.
- **All permalinks present:** Every `index.md` has a `permalink:` field in frontmatter.
- **No broken internal archive links:** All `/archive/by_date/` hrefs in the built output resolve to existing pages.
- **Canonical URLs correct:** All pages have correct `<link rel="canonical">` using `https://www.stungeye.com` + `page.url`.
- **Sitemap complete and correct:** 1,276 URLs, no duplicates. Paginated pages /page/2/ through /page/97/ all present.
- **Nginx redirects:** 447 rules (446 MT entries + 1 `/archives/` → `/archive/`), all with `permanent` flag and proper regex escaping.
- **posts.json data file:** Correctly sets `layout: "layouts/day.njk"`.
- **Passthrough copy API:** The two-argument `addPassthroughCopy({ remapping }, { filter })` form is valid in Eleventy 3.x — confirmed against the Eleventy source.
- **RSS feed:** 20 items present, dates in RFC 2822 format, XML well-formed.
- **CSS:** Responsive breakpoints, iframe aspect-ratio rules for all known embed providers, proper image `max-width: 100%` handling.

## Confirmed Issues

### 1. Medium: Multi-entry MT day heading dedup creates orphaned sections

**What:** On multi-entry MT-only days, the page h1 title comes from the chronologically earliest entry (`mtEntries[0]`), but content renders newest-first (descending timestamp sort). The title dedup logic then strips the `##` heading from the earliest entry (since its title matches the page h1), but that entry's content appears at the *bottom* of the page—below other entries that have their own `##` headings.

**Result:** The earliest entry's content appears as a headless section at the bottom of the page. The reader sees:

```
<h1>Earliest Entry Title</h1>       ← page header
<h2>Newer Entry Title</h2>          ← has its heading
Newer entry's content...
---
Earliest entry's content...          ← NO heading, appears orphaned
```

**Scope:** 22 of 23 multi-entry MT days are affected (the 23rd, 2004-12-11, has identical timestamps so stable sort preserves correct ordering). Representative examples:

- [src/posts/2003/01/02/index.md](../src/posts/2003/01/02/index.md) — h1 "Zone Woes" (earliest), but "Zone Woes" content appears second without heading. `## 1825` (newer) appears first.
- [src/posts/2003/02/17/index.md](../src/posts/2003/02/17/index.md) — h1 "A New Home" (earliest) with headless content below `## Balanced` (newer).
- [src/posts/2003/09/11/index.md](../src/posts/2003/09/11/index.md) — h1 "What happened here?" with headless content below `## On a ferry`.

**Root cause:** `determineDayTitle()` in [tools/migrate.js](../tools/migrate.js) line ~695 uses `mtEntries[0]` (chronologically earliest from the JSON). The rendering sort in `buildDayEntries()` is descending, so the earliest entry appears last. The dedup check at line ~748 strips the heading when the entry title matches the page title—but doesn't account for the entry's position in the rendered output.

**Not data loss** — all content is present. The issue is confusing heading hierarchy.

### 2. Low: Archive nav link missing trailing slash

**What:** In [src/_includes/layouts/base.njk](../src/_includes/layouts/base.njk) line 17, the archive link is `<a href="/archive">Archive</a>` instead of `<a href="/archive/">Archive</a>`.

**Impact:** Nginx (or any standards-compliant server) will 301 redirect `/archive` → `/archive/` when `index.html` exists at that path. This causes an unnecessary redirect hop on every click. All other internal links use trailing slashes correctly (e.g. year.njk uses `/archive/`).

### 3. Low: 7 MT posts have `<h1>` tags in body content

**What:** 7 MT-era posts contain `<h1>` tags in their body HTML. Since the day.njk layout already renders a page-level `<h1>` from the frontmatter title, these pages have multiple `<h1>` elements.

**Affected posts:**
- [src/posts/2004/08/17/index.md](../src/posts/2004/08/17/index.md) — `<h1>Music:</h1>`, `<h1>Language:</h1>`, `<h1>Misc:</h1>`
- [src/posts/2004/08/28/index.md](../src/posts/2004/08/28/index.md) — `<h1>Language</h1>`, `<h1>Writing</h1>`, `<h1>Misc</h1>`
- [src/posts/2004/08/31/index.md](../src/posts/2004/08/31/index.md) — `<h1>Playlist</h1>` (from `entry_text_more`)
- [src/posts/2005/02/23/index.md](../src/posts/2005/02/23/index.md) — 4 sub-section `<h1>` tags
- [src/posts/2005/07/18/index.md](../src/posts/2005/07/18/index.md) — `<h1>Anticipation</h1>`
- [src/posts/2005/12/16/index.md](../src/posts/2005/12/16/index.md) — `<h1>A Video Reminder:</h1>`
- [src/posts/2007/12/29/index.md](../src/posts/2007/12/29/index.md) — 3 sub-section `<h1>` tags

**Impact:** Minor SEO/accessibility concern (multiple `<h1>` elements per page). The `<h1>` tags were used as sub-section headers in the original MT entries. The spec's h1-stripping rule applies only to `regular`-type CI items, not MT entries, so this is by-design behavior — but worth noting these could be downgraded to `<h2>` in the migration script if desired.

### 4. Low: RSS feed has one double-encoded entity

**What:** One feed item ("Reading in 2023") contains `&amp;amp;` in its `<description>`. The source content has a literal `&amp;` HTML entity, and the Nunjucks `{{ ... }}` auto-escaping encodes it again when rendering the feed.

**Location:** [_site/feed.xml](_site/feed.xml) line 85.

**Impact:** Most RSS readers handle double-encoded entities correctly. Strict readers may display a literal `&amp;` instead of `&`. Only 1 item affected out of 20. The issue could potentially affect more items as older content rotates into the feed (if it contains HTML entities that survive `striptags`).

### 5. High: Month/year archive misgroups 4 day pages due to local-timezone date methods

**What:** The `daysByYear` and `daysByMonth` collection builders in [eleventy.config.js](../eleventy.config.js) use `getFullYear()` and `getMonth()` — JavaScript local-timezone methods. `js-yaml` parses bare frontmatter datetime strings (e.g. `date: 2005-10-01 02:20:18`) as UTC. On a build machine in CDT (UTC−5), any date whose UTC timestamp falls between midnight and 06:00 UTC will be seen as the previous calendar day (or even previous month) by the local-time methods, and the page gets grouped into the wrong month/year archive.

**Confirmed in built output:** The day page for 2005-10-01 (`/archive/by_date/2005/10/01/`) appears in the September 2005 month archive instead of October 2005.

**All 4 affected day pages (verified against export data):**

| Day page | Frontmatter timestamp | Should appear in | Actually grouped into |
|---|---|---|---|
| 2005-02-01 | `05:43:03 UTC` → Jan 31 CST | February 2005 | January 2005 |
| 2005-04-01 | `01:04:26 UTC` → Mar 31 CDT | April 2005 | March 2005 |
| 2005-10-01 | `02:20:18 UTC` → Sep 30 CDT | October 2005 | September 2005 ← confirmed |
| 2009-02-01 | `03:20:13 UTC` → Jan 31 CDT | February 2009 | January 2009 |

**Root cause:** `getFullYear()`/`getMonth()` are local-timezone methods. The display filters (`readableDate`, `isoDate`, `rssDate`) all use Luxon with `zone: "utc"`, so they are unaffected. Only the collection grouping logic is broken.

**Fix:** Replace all `getFullYear()`/`getMonth()` calls in `eleventy.config.js` with `getUTCFullYear()`/`getUTCMonth()`. Also replace `getMonth()` in the `monthFromDate` and `uniqueMonths` filters for consistency. This makes grouping UTC-throughout, matching how every other part of the system interprets dates, regardless of build server timezone.

**RSS dates are unaffected.** The `rssDate` filter goes through Luxon's UTC path — `DateTime.fromJSDate(dateObj, { zone: "utc" }).toRFC2822()` — so pubDates render the correct calendar date. RSS readers display pubDate in the reader's local timezone, which means e.g. a post with `00:30:00 +0000` will show as the previous evening in Winnipeg, but this is a cosmetic time-of-day issue only; the linked day page is always correct.

### 6. Medium: Timezone handling for future post authoring is undocumented

**What:** There is no documented convention for how to write `date:` values in frontmatter when authoring new posts after deploy. The legacy timestamps were stored in Central Time but written without a timezone suffix. The entire pipeline (js-yaml, Luxon filters, collection builders after the fix above) is internally consistent only if dates are written as UTC or with an explicit offset.

**Two viable conventions for new posts:**

**Option A — Explicit offset (recommended for accurate RSS times):**
```yaml
date: 2026-04-12T14:30:00-05:00  # CDT (mid-March to early November)
date: 2027-01-08T14:30:00-06:00  # CST (early November to mid-March)
```
js-yaml understands YAML 1.1 ISO 8601 timestamps with offsets and converts to a UTC Date correctly. Display, archive grouping (after fix), and RSS pubDates all work correctly. RSS readers in Winnipeg show the right local time. The friction is remembering the current offset when writing a post.

**Option B — Date-only (simplest, avoids time-of-day issues entirely):**
```yaml
date: 2026-04-12
```
js-yaml parses as `2026-04-12T00:00:00Z` (UTC midnight). Archive grouping is always correct (midnight UTC is safe for `getUTCMonth()`). RSS pubDate shows `00:00:00 +0000`, which RSS readers display as the previous evening in Winnipeg — a minor cosmetic issue.

**Pages CMS note:** If Pages CMS is integrated in the future, its `datetime` field type can inject the Winnipeg local time with the correct offset automatically from the browser timezone, eliminating manual offset selection entirely. Verify that Pages CMS writes YAML 1.1 ISO 8601 format with offset (not a plain string) so js-yaml parses it as a Date object rather than a string, which would break the date filters.

**Action required before authoring any new posts:** Choose Option A or B and document it in `MIGRATION-NOTES.md` or a new `AUTHORING.md`.

## Summary

| # | Severity | Category | Description |
|---|----------|----------|-------------|
| 1 | Medium | Migration logic | Multi-entry MT heading dedup orphans 22 day pages |
| 2 | Low | Template | Archive nav link missing trailing slash |
| 3 | Low | Content | 7 MT posts have `<h1>` in body (multiple h1 per page) |
| 4 | Low | Feed | One double-encoded `&amp;amp;` entity in RSS |
| 5 | High | Build config | `getMonth()`/`getFullYear()` misgroups 4 pages into wrong month archives |
| 6 | Medium | Authoring | No documented timezone convention for new post frontmatter dates |

No data loss or incorrectly migrated entries were found. All 1,252 items across 970 day pages are present and accounted for.
