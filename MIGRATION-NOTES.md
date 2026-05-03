# Migration Notes

Technical notes on how the legacy stungeye.com content was migrated to Eleventy.

## Data Sources

| File                     | Purpose                                                       |
| ------------------------ | ------------------------------------------------------------- |
| `export/ci_days.json`    | Primary source for CI/Tumblr era day pages (items embedded)   |
| `export/mt_entries.json` | MT era entries (pre-Tumblr, 2002–2008)                        |
| `export/redirects.csv`   | Legacy MT URL → day page redirect mappings                    |
| `export/images/`         | Locally archived Tumblr photo-post images                     |
| `export/ci_items.json`   | Flat item list, used by scan-media only (not page generation) |

## CI/Tumblr Items → Markdown

Each CI day record from `ci_days.json` becomes one `src/posts/YYYY/MM/DD/index.md`. Items within a day are rendered in descending timestamp order (newest first), separated by `---` horizontal rules.

All rendering decisions are made during migration. Eleventy templates are type-agnostic — they render the pre-converted body without knowing item types.

### Item Type Rendering

| Type      | Output                                                                                              |
| --------- | --------------------------------------------------------------------------------------------------- |
| `photo`   | Markdown image with absolute path. Caption as HTML below. Wrapped in link if `photo_click_url` set. |
| `regular` | `rendered.body_html_without_h1` as HTML passthrough. h1 stripping is migration-only.                |
| `blog`    | `## title` heading + `rendered.body_html` as HTML passthrough.                                      |
| `quote`   | Blockquote + `— source` attribution line.                                                           |
| `link`    | Markdown link (`link_text` / `link_url`) + `link_description` paragraph.                            |
| `video`   | `video_player` HTML preserved as-is + `video_caption` paragraph.                                    |

The `rendered.*` fields from the export are used directly. `item_data` is only a fallback for missing fields.

### Page Titles

- If the day has a `page_title_source` of `"primary-item"`, use `page_title` from the day record.
- Otherwise, fall back to `"Discovered on Month D, YYYY"`.

### Date And Time Semantics

Migrated frontmatter datetimes preserve the legacy platform's local wall-clock
time. For this site, that should be treated as `America/Winnipeg` time, not UTC.

Evidence from the source data:

- MT live page footers match migrated markdown dates to the minute, with
  markdown preserving seconds.
- CI/Tumblr exports include both a local `date` and `date-gmt`; migrated
  markdown uses the local `date`.
- Posts written while the author was in Europe during 2004-2005 often appear in
  Winnipeg night hours, consistent with the publishing platform remaining on
  Winnipeg/site time.

Implementation note: Eleventy/js-yaml parses bare YAML datetimes like
`2005-10-01 02:20:18` as UTC JavaScript `Date` objects. That parse result does
not represent the intended timestamp. Migration now parses legacy timestamps as
`America/Winnipeg` wall time with Luxon and emits explicit-offset ISO
frontmatter such as `2005-10-01T02:20:18.000-05:00`. Eleventy can ingest those
values as real instants, while display, archive grouping, sitemap dates, and RSS
dates use the configured site timezone.

## MT Entries → Day Pages

Each MT entry from `mt_entries.json` becomes (or merges into) a day page. Only entries with `entry_status = 2` (published) are included.

### MT Entry Processing

1. **Body assembly**: `entry_text` + `entry_text_more` concatenated (33 entries have extended content).
2. **Script stripping**: `<script>` and `<noscript>` tags removed (dead Haloscan comment scripts).
3. **Haloscan link removal**: Dead comment service links (`haloscan.com/comments.php`) stripped from body.
4. **BR conversion**: `<BR><BR>` → paragraph break (`\n\n`), single `<BR>` → newline. Applied before HTML normalization to preserve semantic line breaks.
5. **HTML normalization**: Body run through cheerio to lowercase all tags and quote all attributes (e.g., `<A HREF=url target=_blank>` → `<a href="url" target="_blank">`).
6. **Body heading demotion**: Legacy body `<h1>` tags used as section headings are rendered as `<h2>` so they sit below the day page title.
7. **Trailing dash stripping**: Legacy `--------` separators removed (these would otherwise be parsed as setext h2 underlines by markdown).
8. **Title rendering**: `## entry_title` heading, but skipped when the entry title matches the page h1 title (prevents duplication on single-entry days).

### MT-Only Days

422 days exist only in MT data (not in CI). These become real built pages, not just redirect targets. Title logic:

- Single entry → use `entry_title`
- Multiple entries → use the first rendered entry's title after newest-first
  sorting
- Fallback → `"Entry from Month D, YYYY"`

### Merged Days

One day (2008-07-23) exists in both CI and MT data. Items and entries are merged in descending timestamp order.

## Multi-Entry Day Separators

Items and entries on the same day are separated by `---` (markdown horizontal rule). The last item on a page has no trailing separator.

## Legacy Redirect Handling

All 446 rows from `redirects.csv` generate Nginx 301 rewrite rules in `nginx/redirects.conf`. Each legacy MT URL (`/archives/YYYY/MM/entry_basename.php`) redirects to its canonical day page URL with trailing slash.

The migration script validates that every redirect target has a corresponding built page. Anchor-based URL disambiguation is not used — all redirects point to bare day URLs.

## Image / Media Handling

### Local Images

295 archived images from `export/images/` are copied into co-located day folders during migration. Original Tumblr filenames are preserved. All image references use absolute paths (`/archive/by_date/YYYY/MM/DD/filename.jpg`).

Eleventy copies co-located images to the output via passthrough copy with path remapping (`src/posts/` → `archive/by_date/`).

**Important:** `npm run migrate` always overwrites `src/posts/` images with the 500px originals from `export/images/`. Run `npm run resize-images` immediately after every migrate to restore the higher-resolution published versions from `export/images-hires/`.

### High-Resolution Image Archive

284 of 295 photos have a 1280px version stored in `export/images-hires/` (downloaded once via `npm run download-hires`). 11 images have no 1280px version available from Tumblr (5 GIFs and 6 new-style images).

`npm run resize-images` reads from `export/images-hires/` and writes images resized to `imageMaxWidth` (default: 800px, configured in `src/_data/config.js`) into `src/posts/`. Images already narrower than `imageMaxWidth` are copied as-is. GIFs are always copied without resizing.

To republish at a different width: update `imageMaxWidth` in `src/_data/config.js`, run `npm run resize-images`, then `npm run build`.

### Tumblr Image Localization

Content HTML is scanned for Tumblr-hosted image references (in `<img src>` and `srcset` attributes). When found, the migration script:

1. Selects the best source URL (largest from `srcset` if available)
2. Downloads the image via native Node fetch
3. Saves it into the day's folder
4. Rewrites `src` and `srcset` to the local absolute path

3 Tumblr images were successfully downloaded and localized during migration.

### Unresolved References

10 `stungeye.com`-hosted image references remain as remote URLs (intentionally not downloaded during migration). These are listed in `migration-media-report.md` for future manual localization.

No unresolved Tumblr references or failed downloads remain.

## Eleventy Configuration

### Key Settings

- `markdownTemplateEngine: false` — legacy content contains `{{ }}` characters that Nunjucks would attempt to parse. Disabling the markdown template engine prevents this.
- Passthrough copy remaps `src/posts/` → `archive/by_date/` for image files only.
- Collections (`days`, `daysByYear`, `daysByMonth`) are returned as arrays (not Maps) because Eleventy pagination requires arrays.

### Pagination

Homepage and archive pages paginate over day records (not individual items), showing full content. 10 days per page. Homepage is `/`, subsequent pages are `/page/2/`, `/page/3/`, etc.

All paginated pages are self-canonical — no canonicalization to page 1 or to individual day pages.

## Known Limitations

- Legacy MT content is HTML preserved as-is (not converted to pure markdown). This is intentional to avoid lossy conversion.
- 10 `stungeye.com`-hosted images are still remote references. See `migration-media-report.md`.
- Video items preserve original Tumblr `video_player` embed HTML, which may no longer function if Tumblr deprecates those embeds.
- No per-entry canonical URLs exist beyond the day page — all content on a given day lives at one URL.

## Statistics

| Metric                  | Count |
| ----------------------- | ----- |
| Total day pages         | 970   |
| CI-only days            | 547   |
| MT-only days            | 422   |
| Merged days             | 1     |
| Total items/entries     | 1,252 |
| Local images copied     | 295   |
| Tumblr images localized | 3     |
| Nginx redirect rules    | 447   |
| Build output files      | 1,278 |
