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

### 3. High: The build artifact is not cleaned, so stale `/pages/*` routes remain in `_site`

The build script in [package.json](../package.json) line 12 is just `npx @11ty/eleventy`. It does not remove the existing output directory first.

After running a fresh build, `_site` still contains a stale `_site/pages/**` tree alongside the current `_site/page/**` pagination tree, even though current source templates only generate `/page/{{ n }}/` routes. Examples that still exist in the artifact:

- [\_site/pages/index.html](../_site/pages/index.html)
- [\_site/pages/1/index.html](../_site/pages/1/index.html)
- [\_site/pages/96/index.html](../_site/pages/96/index.html)

The current `_site` contains 1676 files. The most recent build reported 1279 written files plus 300 copied files, leaving 97 residual files in the output directory.

If deployment syncs `_site` as-is, the server will publish outdated duplicate content under `/pages/`, which creates SEO noise and makes link validation results misleading.

### 4. High: Several internal archive links 404 because old unpadded day URLs were preserved verbatim

The new Eleventy site only emits zero-padded day URLs such as `/archive/by_date/2019/02/03/`, but some post bodies still link to unpadded variants from the legacy app.

Representative source examples:

- [src/posts/2026/02/22/index.md](../src/posts/2026/02/22/index.md) line 15
- [src/posts/2011/01/03/index.md](../src/posts/2011/01/03/index.md) lines 18, 30, and 72
- [src/posts/2009/03/17/index.md](../src/posts/2009/03/17/index.md) line 11

A built-site audit found 9 unique missing archive targets, repeated 64 times in rendered HTML across `http`, `https`, and relative-link variants:

- `/archive/by_date/2009/03/7`
- `/archive/by_date/2010/03/1`
- `/archive/by_date/2010/03/2`
- `/archive/by_date/2010/06/4`
- `/archive/by_date/2012/01/4`
- `/archive/by_date/2012/10/6`
- `/archive/by_date/2013/03/9`
- `/archive/by_date/2019/02/3`
- `/archive/by_date/2025/02/1`

The existing [nginx/redirects.conf](../nginx/redirects.conf) only covers legacy MT `/archives/YYYY/MM/*.php` URLs, not malformed `/archive/by_date/...` links, so these currently remain broken.

### 5. Medium: `feed.xml` uses ISO 8601 dates instead of RSS date format

The RSS template in [src/pages/feed.njk](../src/pages/feed.njk) uses `isoDate` for both `<lastBuildDate>` and `<pubDate>` on lines 15 and 22.

The generated feed therefore emits values like:

- `2026-02-22T09:39:24.000Z`

That is valid XML, but it is not the normal RSS 2.0 date format. Some validators and feed readers are tolerant, but others expect RFC 822 style values and may sort or parse the feed incorrectly.
