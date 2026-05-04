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

### Issue A — rsync `--delete` will destroy legacy media referenced in 72 day pages

**Identified:** 2026-05-03

**Severity:** Show-stopper (data loss at deploy time)

The README deploy command is:

```bash
rsync -avz --delete _site/ user@server:/var/www/stungeye.com/
```

The `--delete` flag removes any server file not present in `_site/`. Legacy
`stungeye.com`-hosted media files that are still referenced in migrated content
are **not** included in `_site/`. Running this command will permanently delete
them from the server, breaking 187 media references across 72 day pages:

- 125 `.jpg` images (many 2003–2013 photo posts)
- 36 `.mp3` audio files
- 21 `.swf` Flash files (already non-functional in modern browsers)
- 1 `.gif`, 1 `.png`, 2 `.avi`, 1 `.fla`

`migration-media-report.md` already documents the full list under "stungeye.com
Self-Hosted Media References (187 across 72 days)" and warns: "If deployment
replaces the old site root, these will 404."

**Options before deploying:**

1. Drop `--delete` from rsync and manually clean up only known-safe paths.
2. Copy the legacy media tree into `_site/` (or a parallel deploy target) so
   rsync includes it.
3. Accept the breakage (72 day pages have broken images/audio) and document it
   as a known limitation.

---

### Issue B — README incorrectly said to add `/archives/` redirect manually

**Identified:** 2026-05-03 (corrected same day)

**Severity:** Documentation inaccuracy (now fixed)

The README's "Nginx Redirects" deployment section contained this sentence:

> The legacy archive landing URL `/archives/` should also redirect to `/archive/` — add this manually to your Nginx config if not already present.

This is incorrect. `tools/migrate.js` `generateNginxConfig()` already appends a
hardcoded `rewrite ^/archives/$ /archive/ permanent;` rule to
`nginx/redirects.conf` — it is the source of the 447th rule (446 CSV rows + 1
hardcoded). The manual step is not needed and would produce a duplicate rule.

**Fix applied:** README updated to state that `redirects.conf` includes both the
446 per-entry rules and the catch-all `/archives/` rule. MIGRATION-NOTES body
text updated to clarify the 446-rows-plus-one-hardcoded breakdown.

---

## Current Priority Order

| Priority | Issue   | Why                                                             |
| -------- | ------- | --------------------------------------------------------------- |
| 1        | Issue A | rsync --delete will irreversibly destroy legacy media at deploy |
| —        | Issue B | Documentation inaccuracy — fixed                                |

No data loss or incorrectly migrated entries were found in the built output.
The main pre-deploy date handling repair has been completed and archived.
