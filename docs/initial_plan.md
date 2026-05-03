# Stung Eye — Eleventy Migration Spec

## Project Overview

Migrate a long-running personal blog (stungeye.com, live since 2002) from a legacy
PHP/MySQL/CodeIgniter/Tumblr system to an Eleventy static site. The migration must
preserve URL continuity, historical content fidelity, and the full-content tumblelog
reading experience.

---

## Implementation Philosophy

### Prefer

- The smallest design that fully satisfies the spec
- Explicit, readable code over clever or compressed code
- Local reasoning over hidden coupling
- Clear, well-defined seams that make future changes easier
- Simple data flow that is easy to follow end-to-end

### Avoid

- Speculative abstractions
- Unnecessary indirection or layers
- Premature generalization
- Introducing dependencies without clear benefit
- "Magic" behavior that is not immediately obvious from reading the code

### Structural Simplicity Matters

Structural complexity naturally accumulates in a codebase over time. Left unchecked,
that complexity makes every future change slower, riskier, and harder to reason about.
This project should actively resist that drift.

Choose simple, "boring" solutions when they meet the requirements. Favor
straightforward code over flexible or extensible designs that are not currently needed.

Some abstraction is of course required for clean, non-repetitive code. The test for
whether an abstraction earns its place: does it make the code obviously simpler and
easier to follow, or does it introduce indirection that a reader has to mentally
unwrap? If the latter, prefer the direct approach.

Clean structure and simple code improve readability for both humans and AI systems.
This makes the codebase easier to understand, review, debug, and modify safely.

The goal is not elegance through abstraction, but durability through clarity.

---

## Site Identity

- **Site title:** Stung Eye
- **Canonical domain:** https://www.stungeye.com
- **Served from:** domain root (`/`)
- **Web server:** Nginx on Ubuntu droplet
- All sitemap `<loc>` URLs and canonical `<link>` hrefs use `https://www.stungeye.com`

---

## Architecture Decisions

These decisions are final unless a serious implementation problem is discovered.

1. **Eleventy (11ty)** is the static site generator. No database, no CMS, no client-side
   framework required.

2. **One-time migration script** converts exported JSON data into Eleventy-native markdown
   files. After migration, Eleventy builds entirely from markdown — no JSON dependency
   in the build pipeline.

3. **All rendering decisions are made during migration, not at build time.** The migration
   script is responsible for converting every legacy item type into appropriate
   markdown/HTML. Eleventy templates are type-agnostic layouts — they render the already-
   converted content body without needing to know whether a post was a photo, quote, link,
   or video. There is no type-aware item renderer in the Eleventy layer.

4. **Canonical content unit is the day page.** All content is grouped by day.
   Canonical URLs: `/archive/by_date/yyyy/mm/dd/` (trailing slash, Eleventy generates
   `index.html` files).

5. **Homepage and paginated archive pages** paginate over day records (not individual
   items), show full day content, and are self-canonical.

6. **MT legacy URLs** get real HTTP 301 redirects via an Nginx config generated once
   from `redirects.csv`. All MT redirects point to the bare day URL with trailing slash.
   **MT days become real built day pages, with MT entries merged into the day-page
   model.**

7. **No per-entry canonical model.** We do not introduce per-item permanent URLs beyond
   the day page already in use.

8. **h1 stripping is a migration-time operation only.** For `regular`-type CI items the
   migration script always uses `rendered.body_html_without_h1` when writing the markdown
   body. After migration this concept does not exist in templates or new post authoring.

---

## Data Sources

### Export Files

| File                     | Purpose                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------- |
| `export/ci_items.json`   | Flat list of all CI/Tumblr items. Use for media scanning only.                      |
| `export/ci_days.json`    | **Primary source of truth** for CI/Tumblr era day pages. Items are embedded inline. |
| `export/mt_entries.json` | **Secondary source** for MT era (pre-Tumblr) day pages and redirect rules.          |
| `export/redirects.csv`   | Redirect rules for all legacy MT URLs.                                              |
| `export/images/`         | Source directory containing locally archived Tumblr photo-post images.              |

### Data Shape — ci_days.json

Each day record:

```json
{
  "date": "2008-07-23",
  "canonical_url": "/archive/by_date/2008/07/23",
  "page_title": "Discovered on July 23, 2008",
  "page_title_source": "fallback-date",
  "items": [ ... ]
}
```

Each item embedded in a day:

```json
{
  "id": 12,
  "timestamp": "2008-07-23 16:18:00",
  "day_date": "2008-07-23",
  "type": "photo",
  "tumble_id": "43306524",
  "anchor": "tumblr-43306524",
  "rendered": {
    "title": null,
    "body_html": null,
    "body_html_without_h1": null,
    "caption_html": "Curved Hall in Toronto",
    "image": "02MycoI69brxa7htF7PL4LCH_500.jpg",
    "photo_click_url": "http://www.flickr.com/photos/stungeye/2694235489/",
    ...
  },
  "item_data": { ... }
}
```

**Use `rendered.*` fields in the migration script.** Do not re-derive from `item_data`.
Fall back to `item_data` only for fields missing from `rendered`.

### Data Shape — mt_entries.json

```json
{
  "entry_id": 737,
  "entry_status": 2,
  "entry_title": "Open for business",
  "entry_text": "...",
  "entry_text_more": "...",
  "entry_created_on": "2002-08-18 14:40:01",
  "day_date": "2002-08-18",
  "entry_basename": "open_for_busine",
  "legacy_mt_url": "/archives/2002/08/open_for_busine.php",
  "target_day_url": "/archive/by_date/2002/08/18",
  "redirect_target_url": "/archive/by_date/2002/08/18"
}
```

Only entries with `entry_status = 2` (published) are included.

MT entry processing rules:

- Concatenate `entry_text` and `entry_text_more` as the full body. About 33 entries have extended content in `entry_text_more`.
- Strip `<script>` tags from MT content during migration (dead Haloscan comment scripts and similar).

### Data Shape — redirects.csv

```text
legacy_url,target_url,target_day_url,target_anchor,day_entry_count,uses_anchor,entry_id,entry_title,entry_created_on
/archives/2002/08/open_for_busine.php,/archive/by_date/2002/08/18,/archive/by_date/2002/08/18,open_for_busine,1,0,737,"Open for business (who's??? None of yours)","2002-08-18 14:40:01"
```

The `uses_anchor` column is ignored. All MT redirects point to the bare day URL with
a trailing slash. Anchor-based disambiguation is not used.

---

## Migration Script (One-Time)

`tools/migrate.js` performs a one-time conversion of the exported JSON/CSV data into
the markdown files that power the Eleventy build. After this script runs successfully,
the export files are no longer needed for building.

### What the migration script does

1. Reads `export/ci_days.json` and creates one markdown file per day.
2. Reads `export/mt_entries.json` and creates or merges day markdown files for MT-era
   days. Days present in both sources are merged by timestamp.
3. Copies local archived images into co-located day folders and writes image references
   as absolute paths.
4. Attempts to download and localize Tumblr-hosted images found in legacy content HTML,
   rewriting HTML to local absolute paths when successful. Downloaded Tumblr images are
   saved into the same day folder as the corresponding index.md, following the same
   co-located storage convention as archived images.
5. Reads `export/redirects.csv` and generates `nginx/redirects.conf`.
6. Emits `migration-media-report.md` listing unresolved remote Tumblr image references,
   failed downloads, and other media issues requiring manual follow-up.

### Output: Markdown File Structure

```text
src/posts/
  2002/
    08/
      18/
        index.md
      20/
        index.md
  2008/
    07/
      23/
        index.md
        02MycoI69brxa7htF7PL4LCH_500.jpg
        02MycoI69bs2l3r8WFaqFQ9y_500.jpg
```

### Markdown File Format

Each day generates one `index.md`. Frontmatter is minimal. Body is human-readable
markdown. HTML is preserved inline where markdown conversion would be lossy.

**Frontmatter:**

```yaml
---
date: 2008-07-23T18:46:42-05:00
title: Discovered on July 23, 2008
permalink: /archive/by_date/2008/07/23/
---
```

The `permalink` field is always written explicitly with a trailing slash to ensure
Eleventy generates the correct `index.html` path regardless of global config defaults.
The `date` field is now written as an explicit `America/Winnipeg` local-offset
ISO datetime so archive grouping, display, and RSS dates share one date model.

**Body rules:**

- CI/Tumblr items are appended in **descending timestamp order (newest first)**.
- MT entries are appended in **descending timestamp order (newest first)**.
- All CI items and MT entries on a day are merged in descending timestamp order
  (newest first).

**Item type rendering (migration script only):**

These decisions are made once during migration. Eleventy templates do not need to
know item types. When planning the implementation check `export/ci_days.json` to
see which of these types are actually relevant.

| Type      | Rendered output written to markdown                                                                                                                                                                                        |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `photo`   | Markdown image with absolute path. Alt text is `caption_html` with HTML stripped. `caption_html` rendered as HTML passthrough below the image. If `photo_click_url` present, image is wrapped in a link.                   |
| `regular` | Always use `rendered.body_html_without_h1` as HTML passthrough.                                                                                                                                                            |
| `blog`    | `## title` heading + `rendered.body_html` as HTML passthrough.                                                                                                                                                             |
| `quote`   | Blockquote containing `rendered.quote_text` + `— source` attribution line.                                                                                                                                                 |
| `link`    | Markdown link using `rendered.link_text` / `rendered.link_url` + `rendered.link_description` as paragraph.                                                                                                                 |
| `video`   | `rendered.video_player` HTML preserved as-is + `rendered.video_caption` as paragraph.                                                                                                                                      |
| unknown   | Raw content preserved as HTML passthrough with a `<!-- TODO: unknown type: {type} -->` comment. `conversation` and `audio` types do not appear in the export data — the unknown fallback handles them if they ever appear. |

**MT entries:**

```markdown
## Entry Title

Entry HTML content preserved as-is...
```

**Example output — photo item:**

```markdown
[![Curved Hall in Toronto](/archive/by_date/2008/07/23/02MycoI69brxa7htF7PL4LCH_500.jpg)](http://www.flickr.com/photos/stungeye/2694235489/)

Curved Hall in Toronto

---
```

**Example output — quote item:**

```markdown
> The cost of a thing is the amount of life required to be exchanged for it.

— Henry David Thoreau

---
```

**Example output — multi-entry MT day:**

```markdown
## Open for business

Stung Eye is the eye of the beholder...

---

## Second Entry Title

More content here...
```

### Days Present in MT Data But Not in CI Data

These are real content days that need real built pages. The migration script must
create a day markdown file for every MT day — not just a redirect target. The script
reports how many MT-only days were created. If a redirect target URL has no
corresponding built page, the script flags it as an error.

**Title logic for MT-only days (derived by migration script):**

1. Single entry: use `entry_title`
2. Multiple entries: use the first entry's `entry_title`
3. Fallback: `"Entry from Month D, YYYY"`

---

## Image / Media Handling

### Storage Convention

All images — both archived and future — are co-located with their day's `index.md`:

```text
src/posts/2008/07/23/
  index.md
  02MycoI69brxa7htF7PL4LCH_500.jpg
```

There are approximately 300 archived images. Original Tumblr filenames are preserved
exactly during migration.

**Image references use absolute paths** rooted at the site, e.g.:

```text
/archive/by_date/2008/07/23/02MycoI69brxa7htF7PL4LCH_500.jpg
```

This ensures images resolve correctly from any page depth — day pages, homepage,
paginated archive pages, etc. The migration script must write absolute paths; relative
paths must not be used for images.

Eleventy copies co-located images into the output at the correct absolute path via
passthrough copy. For new posts authored after migration, images live next to
`index.md` and are referenced with absolute paths in the same pattern.

### Migration Script: Image Handling

For each CI `photo`-type item:

1. If `rendered.image` is a bare filename and a matching file exists in the source
   image folder, copy it into the day's folder and write an absolute-path image
   reference.
2. If `rendered.image` is already a site-local path, preserve or normalize it to the
   canonical absolute path pattern.
3. If `rendered.image` is a Tumblr-hosted remote URL, attempt to download it during
   migration, copy it into the day's folder, and rewrite the content to the new local
   absolute path.
4. If no local file exists and remote download fails, preserve the remote reference and
   flag it in the media report as **unresolved remote**.

For `regular`-type items and other HTML blobs:

1. Scan the migrated HTML source (which comes from `rendered.body_html_without_h1` for
   `regular` items) for Tumblr-hosted image references.
2. Detect Tumblr-hosted media not only in `<img src>` but also in `srcset` attributes.
3. When a recognizable Tumblr-hosted image is found, attempt to select the best useful
   source image URL (typically the largest appropriate URL present in `srcset`, if any),
   download it during migration, copy it into the day's folder, and rewrite the HTML to
   the new local absolute path.
4. If rewriting a localized image, rewrite `src` and `srcset` consistently so they no
   longer point to Tumblr.
5. If a download or rewrite is not possible safely, preserve the original remote HTML and
   log it in the media report as **unresolved remote reference** with the post date,
   item id, and original URL(s).
6. Scan content HTML for `stungeye.com`-hosted image references. Leave these as remote
   — do not attempt to download or rewrite them. Log them in the media report as
   **stungeye.com remote reference** (date, item id, URL) for future manual localization.

Implementation Note:

- Use native Node fetch for image downloads in the migration script. Do not install
  third-party fetch libraries unless a serious compatibility issue is discovered.
- For HTML inspection and rewriting, use a DOM/HTML parser such as cheerio rather than
  regular expressions.

### Media Report

The migration script emits `migration-media-report.md` listing:

- All local images successfully copied (count + list)
- All Tumblr-hosted images successfully downloaded and localized during migration
- All unresolved remote Tumblr image references (date, item id, URL)
- Any `rendered.image` filenames where no local file was found
- Any failed image downloads or ambiguous rewrites
- All `stungeye.com`-hosted image references found in content HTML (left as remote, listed for future localization)

This is the TODO list for the post-migration media recovery pass.

### Media Scanner Tool

`tools/scan-media.js` can be run at any time to re-scan the migrated markdown files and
report remaining remote Tumblr references. Independent of the one-time migration, so
it can be re-run after manual fixes.

---

## Eleventy Project Structure

```text
src/
  _data/
    config.js             ← site config (title, domain, pagination size)
  _includes/
    layouts/
      base.njk            ← HTML shell, head, meta, canonical
      day.njk             ← single day page layout
      archive.njk         ← paginated homepage/archive layout
      archive-index.njk   ← year/month/archive landing layout
    partials/
      nav.njk
      pagination.njk
  posts/                  ← generated by migration script
    2002/08/18/index.md
    2008/07/23/index.md
    ...
  pages/
    index.njk             ← homepage (paginated over days)
    archive.njk           ← archive landing page
    sitemap.njk
    robots.njk
assets/
  css/
    main.css
tools/
  migrate.js              ← one-time migration script
  scan-media.js           ← media scanner / reporter
export/                   ← original export files (not used in build)
nginx/
  redirects.conf          ← generated Nginx redirect config
eleventy.config.js
package.json
README.md
MIGRATION-NOTES.md
```

Eleventy builds homepage, paginated archive pages, month pages, year pages, and the archive landing page from the migrated `src/posts/**/index.md` day files — not from `export/*.json`.

---

## URL Structure

| Page              | URL pattern                    |
| ----------------- | ------------------------------ |
| Homepage          | `/`                            |
| Paginated archive | `/page/2/`, `/page/3/`, ...    |
| Day page          | `/archive/by_date/yyyy/mm/dd/` |
| Month page        | `/archive/by_date/yyyy/mm/`    |
| Year page         | `/archive/by_date/yyyy/`       |
| Archive landing   | `/archive/`                    |

All URLs use trailing slashes. Eleventy generates `index.html` files at each path.

Legacy MT URLs (`/archives/yyyy/mm/entry_basename.php`) are **not** built as pages.
They are handled entirely by Nginx 301 redirects pointing to bare day URLs with
trailing slashes.

---

## Pagination

- Homepage and archive pages paginate over **day records**, sorted newest first.
- Each page shows **full content** for every day — no teasers or excerpts.
- Page size is configurable in `src/_data/config.js`. Default: **10 days per page**.
- Each day block links clearly to its canonical day page.
- Homepage URL is `/`, subsequent pages are `/page/2/`, `/page/3/`, etc.
- Homepage and all paginated pages are self-canonical.

---

## SEO and Canonicalization

- **Day pages** are self-canonical: `/archive/by_date/2004/07/07/` → itself.
- **Homepage and paginated pages** are self-canonical: `/` → `/`, `/page/2/` → `/page/2/`.
- Do **not** canonicalize all paginated pages to page 1.
- Do **not** canonicalize homepage/paginated pages to individual day pages.
- Legacy MT URLs do not appear as content pages and are not in the sitemap.

---

## Sitemap

Generate `sitemap.xml` including:

- Homepage (`/`)
- All paginated archive pages (`/page/2/`, etc.)
- All day pages
- All month pages
- All year pages
- Archive landing page (`/archive/`)

Exclude legacy MT redirect URLs. All `<loc>` values use `https://www.stungeye.com`.

---

## robots.txt

```text
User-agent: *
Allow: /

Sitemap: https://www.stungeye.com/sitemap.xml
```

---

## Legacy Redirect Handling

### Rules

Every row in `redirects.csv` generates one Nginx rewrite rule from `legacy_url` to
`target_day_url` with a trailing slash.

The redirect target must exist as a built page. The migration script flags any
redirect target with no corresponding built markdown file as an error.

Redirect target normalization:

- Treat `target_day_url` from `redirects.csv` as the source of truth for redirect destinations.
- Ignore `target_url` and `uses_anchor` from older exports if present.
- Normalize every redirect destination to the canonical trailing-slash day URL form:
  `/archive/by_date/yyyy/mm/dd/`
- Example:
  `/archive/by_date/2003/01/02` → `/archive/by_date/2003/01/02/`
  `/archive/by_date/2003/01/02#zone_woes_from` → `/archive/by_date/2003/01/02/`

### Nginx Config

The migration script generates `nginx/redirects.conf`:

```nginx
# Generated from redirects.csv — do not edit manually

rewrite ^/archives/2002/08/open_for_busine\.php$ /archive/by_date/2002/08/18/ permanent;
rewrite ^/archives/2002/08/problems_soluti\.php$ /archive/by_date/2002/08/20/ permanent;
```

This file is included in the Nginx server block on the production server. See README
for deployment instructions.

---

## Archive Pages

### Year page (`/archive/by_date/yyyy/`)

A navigation page listing all months in that year that have content, each linking to its month page. Does not render day content inline.
Self-canonical.

### Month page (`/archive/by_date/yyyy/mm/`)

Renders the full content of all day pages in that month, newest first.
Each day block links to its canonical day page.
Self-canonical.

### Archive landing (`/archive/`)

A readable archive index page linking to years and their months.
If a year or a month has no day pages it should not be listed.
This is a navigation page, not a full-content archive page.
Self-canonical.

For example (where the years and months link to the year and month pages):

2026 : January February
2025 : January February March
2024 : February March
2023 : February
...

### Legacy MT archive page (`/archives/`)

The legacy MT archive landing URL /archives/ should not be rebuilt as a content page.
It should 301 redirect to /archive/ via nginx redirect.

Implementation Note: Build year and month archive pages from a custom Eleventy
collection over the migrated day files. Eleventy does not natively paginate
by year or month.

---

## Configuration

`src/_data/config.js`:

```js
module.exports = {
  siteTitle: "Stung Eye",
  siteUrl: "https://www.stungeye.com",
  daysPerPage: 10,
};
```

---

## CSS

- Simple, durable, hand-written CSS in `assets/css/main.css`.
- No CSS framework, no preprocessor required.
- Readable, archival, minimal — faithful successor to the old blog.
- Responsive for mobile.
- No client-side JavaScript required for core functionality.

---

## Local Development

```bash
npm install
npm run dev      # Eleventy dev server with live reload
```

## Production Build

```bash
npm run build    # builds to _site/
```

## Deployment

```bash
rsync -avz --delete _site/ user@server:/var/www/stungeye.com/
```

`nginx/redirects.conf` is deployed separately and included in the Nginx server block.
See README for full deployment instructions.

---

## Implementation Constraints

1. Keep it simple. No unnecessary frameworks, bundlers, or client-side systems.
2. No database in the new system.
3. No CMS required for the initial implementation. Pages CMS may be added later.
4. All rendering decisions for legacy content are made in the migration script, not in
   Eleventy templates. Templates are type-agnostic layouts.
5. Image references must use absolute paths — never relative paths.
6. Be careful with dates and URL generation. All archive URLs use trailing slashes.
7. Preserve legacy HTML where practical. Do not aggressively sanitize historical content.
8. Leave clear `TODO` comments where migration edge cases remain.
9. Attempt to localize Tumblr-hosted images during migration. Do not default to leaving
   them remote if they can be safely downloaded and rewritten.
10. Surface all unresolved remote Tumblr image references, failed downloads, and ambiguous
    rewrites in the media report. Do not silently leave them in place.
11. `ci_items.json` is for media scanning tooling only. Page generation uses
    `ci_days.json` which embeds all items inline.

Prefer:

- the smallest design that fully satisfies the spec
- explicit, readable code over clever or compressed code
- local reasoning over hidden coupling
- safe seams that make future changes easier

The agent should avoid:

- speculative abstractions
- unneeded complexity

---

## Success Criteria

- `npm install && npm run build` completes without errors.
- The generated `_site/` includes homepage, paginated archive pages, day pages,
  month pages, year pages, sitemap, and robots.txt.
- The migration script converts all exported data to markdown without data loss.
- MT redirect rules are generated as a working Nginx config with trailing slashes.
- All legacy content types are rendered into markdown during migration.
- Co-located images are copied into the correct day folders and referenced with
  absolute paths.
- Tumblr-hosted images are localized during migration when safely possible.
- The media report identifies all unresolved remote Tumblr references and failed
  localization attempts.
- The code is understandable and maintainable.
- The result feels like a faithful static successor to the old blog.

---

## Deliverables

1. Eleventy site code (`src/`, `assets/`, `eleventy.config.js`, `package.json`)
2. Migration script (`tools/migrate.js`) converting export JSON to markdown
3. Media scanner tool (`tools/scan-media.js`)
4. Nginx redirect config (`nginx/redirects.conf`) generated from `redirects.csv`
5. `README.md` covering setup, local dev, build, rsync deployment, and GitHub Actions
   notes
6. `MIGRATION-NOTES.md` covering:
   - How CI items map to Eleventy markdown (including always using `body_html_without_h1` for `regular` items)
   - How MT entries map to day pages and redirect rules
   - How homepage/archive pagination works
   - How media/image localization is handled
   - Known limitations and TODOs
