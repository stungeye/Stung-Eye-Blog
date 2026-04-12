Pre-Deploy Issues Identified

Review date: 2026-04-11

## What Was Verified

- `npm run build` succeeds in WSL with Node available through `nvm`.
- Export-to-content counts line up at the day level: 970 generated day files, matching the combined CI/Tumblr + published MT day count.
- Per-day section counts also matched the export counts, so I did not find evidence of day pages silently dropping whole entries during markdown generation.
- I did not find empty generated day files, and localized `/archive/by_date/...` asset references that point into the Eleventy output resolved correctly.

## Confirmed Issues

### 1. High: MT-era self-hosted media was not migrated into the static output

The migration code only scans CI/Tumblr `regular` and `blog` HTML with `processHtmlImages()` in [tools/migrate.js](../tools/migrate.js) around lines 272-330 and 449-467. MT entries are rendered separately in `renderMtEntry()` starting at line 505, and that path never localizes or even inventories legacy `stungeye.com` media URLs.

That gap is larger than the current report suggests. [migration-media-report.md](../migration-media-report.md) says there are only 10 remaining `stungeye.com` image references (lines 321-334), but the checked-in post corpus still contains:

- 86 live `<img src="https?://(www.)?stungeye.com/...">` references across 38 posts
- 127 self-hosted media URLs total across 42 posts when image/flash/media-style references are included

Representative examples:

- [src/posts/2003/10/26/index.md](../src/posts/2003/10/26/index.md) lines 9-15
- [src/posts/2012/04/08/index.md](../src/posts/2012/04/08/index.md)
- [src/posts/2013/12/17/index.md](../src/posts/2013/12/17/index.md)

The generated `_site` tree does not include legacy top-level `/images/`, `/flash/`, `/processing/`, or `/public/images/` directories. If deployment replaces the old site root with the Eleventy output alone, those historical assets will 404 and the affected posts will lose visible content.

### 2. High: Legacy `display_*` viewer/app links are still rendered, but the new site ships no implementation

Many MT-era posts still rely on inline handlers such as `display_image()`, `display_image_mult()`, `display_flash()`, and `display_processing()`. Example source content is visible in [src/posts/2003/10/26/index.md](../src/posts/2003/10/26/index.md) lines 9-15, and the built page still contains those handlers verbatim in [\_site/archive/by_date/2003/10/26/index.html](../_site/archive/by_date/2003/10/26/index.html).

I searched the repo for implementations and found only content usage, not any shipped JS definitions. The base layout in [src/\_includes/layouts/base.njk](../src/_includes/layouts/base.njk) lines 1-64 includes CSS but no supporting script bundle.

Impact:

- 37 posts still depend on these helper functions
- Many older thumbnails now point to `href="#"` and do nothing when clicked
- Legacy Flash and Processing applet launch links are non-functional even before considering whether the underlying media files still exist

This is a real regression in the MT archive experience, especially for the 2003-2004 art/programming posts where the linked media is the main content.

### 3. ~~High~~ Fixed: The build artifact is not cleaned, so stale `/pages/*` routes remain in `_site`

**Resolution:** The `build` script in [package.json](../package.json) now runs `rm -rf _site` before invoking Eleventy, ensuring a clean output directory on every build. Stale files can no longer accumulate.

### 4. ~~High~~ Fixed: Several internal archive links 404 because old unpadded day URLs were preserved verbatim

**Resolution:** Added `padArchiveUrls()` in [tools/migrate.js](../tools/migrate.js) which zero-pads single-digit month/day segments and ensures a trailing slash on all `/archive/by_date/` URLs in post content. After re-running the migration, all 9 previously broken archive targets are now correct canonical URLs. No nginx workaround is needed.

### 5. ~~Medium~~ Fixed: `feed.xml` uses ISO 8601 dates instead of RSS date format

**Resolution:** Added an `rssDate` filter in [eleventy.config.js](../eleventy.config.js) using Luxon's `toRFC2822()`. Updated [src/pages/feed.njk](../src/pages/feed.njk) to use `rssDate` for `<lastBuildDate>` and `<pubDate>`. Dates now render in RFC 822 format (e.g. `Sun, 22 Feb 2026 09:39:24 +0000`).

### 6. Additional: Responsive iframe sizing

During the fix for issues 3–5, iframe `width`, `height`, and `frameborder` attributes were stripped from all iframes by `normalizeHtml()` in [tools/migrate.js](../tools/migrate.js) (including video embeds via `renderVideoItem()`). Responsive sizing is now handled entirely in CSS in [assets/css/main.css](../assets/css/main.css):

- Base `iframe` rule: `width: 100%; aspect-ratio: 16/9; border: none` (sane default for unmatched providers)
- YouTube, Vimeo, NFB, Kickstarter: 16:9
- Spotify: 5:4
- SoundCloud: 3:1
- Mixcloud: 3.5:1
- Google Maps: 2:1
- SlideShare, OpenProcessing: 4:3
