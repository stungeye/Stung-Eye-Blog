# Tidying Opportunities

Identified from a review of the Eleventy site code (templates, config, CSS, package setup). Migration tooling (`tools/`) is out of scope. Each entry references the relevant tidying rule from `docs/tidying-code.md`.

---

## 1. Dead Code: Unused `nav.njk` partial

**Rule:** Dead Code — Delete unreachable or unused code entirely.

**Location:** `src/_includes/partials/nav.njk`

**Issue:** `base.njk` inlines the nav HTML directly:

```njk
<nav class="site-nav">
  <a href="/" class="site-title">{{ config.siteTitle }}</a>
  <a href="/archive/">Archive</a>
</nav>
```

`partials/nav.njk` contains identical markup but is never included anywhere. No template references it — only docs mention it.

**Action:** Delete `src/_includes/partials/nav.njk`. The nav lives in `base.njk` where it belongs (only one consumer, so a partial adds indirection without benefit — consistent with the One Pile rule).

---

## 2. Explaining Constant: Repeated glob pattern

**Rule:** Explaining Constants — Replace magic literals with named constants.

**Location:** `eleventy.config.js`, lines defining `days`, `daysByYear`, and `daysByMonth` collections.

**Issue:** The string `"src/posts/**/index.md"` appears three times:

```js
collectionApi.getFilteredByGlob("src/posts/**/index.md"); // in days
collectionApi.getFilteredByGlob("src/posts/**/index.md"); // in daysByYear
collectionApi.getFilteredByGlob("src/posts/**/index.md"); // in daysByMonth
```

If the posts directory structure changed, all three would need updating independently.

**Action:** Extract to a constant at the top of the config function:

```js
const POSTS_GLOB = "src/posts/**/index.md";
```

Then reference `POSTS_GLOB` in all three collection definitions.

---

## 3. Normalize Symmetries: Duplicated month-extraction loop in templates

**Rule:** Normalize Symmetries — Pick one form and apply it consistently.

**Location:** `src/pages/archive.njk` (lines 11–17) and `src/pages/year.njk` (lines 16–22).

**Issue:** Both templates contain the same Nunjucks loop to extract unique months from a list of days:

```njk
{% set months = [] %}
{% for day in days %}
  {% set m = day.date | monthFromDate %}
  {% if m not in months %}
    {% set months = (months.push(m), months) %}
  {% endif %}
{% endfor %}
```

This is a data-extraction concern repeated in two presentation templates.

**Action:** Add a custom `uniqueMonths` filter in `eleventy.config.js` that accepts an array of day page objects and returns sorted unique month strings. Both templates would then use:

```njk
{% set months = days | uniqueMonths %}
```

This eliminates the duplication and also removes the non-obvious `(months.push(m), months)` comma-operator hack from templates (see item 4).

---

## 4. Explaining Comment: Non-obvious Nunjucks array-push pattern

**Rule:** Explaining Comments — Add a comment only to capture a non-obvious _why_.

**Location:** `src/pages/archive.njk` and `src/pages/year.njk` (same blocks as item 3).

**Issue:** The expression `{% set months = (months.push(m), months) %}` uses JavaScript's comma operator to work around Nunjucks' inability to mutate arrays in-place. `push()` returns the new length, not the array, so the comma operator is needed to return the array itself. This is non-obvious and would confuse a reader unfamiliar with the workaround.

**Action:** If item 3 is implemented, this goes away entirely. If item 3 is deferred, add a brief comment:

```njk
{# Nunjucks workaround: push() returns length, comma operator returns the array #}
{% set months = (months.push(m), months) %}
```

---

## 5. Dead Code: `reverse: false` in homepage pagination

**Rule:** Dead Code — Delete unreachable or unused code entirely.

**Location:** `src/pages/index.njk`, frontmatter line 7.

**Issue:** `reverse: false` is Eleventy's default pagination behavior. Stating it explicitly has no effect — it's configuration that does nothing.

```yaml
pagination:
  data: collections.days
  size: 10
  alias: days
  reverse: false # ← default, has no effect
```

The design intent (collection is already sorted, no reversal needed) is documented in `docs/eleventy-guide.md` but not communicated by this line.

**Action:** Remove the `reverse: false` line. If the intent needs documenting at the call site, a YAML comment is clearer:

```yaml
pagination:
  data: collections.days
  size: 10
  alias: days
  # collection is pre-sorted newest-first, no reversal needed
```

---

## 6. Explaining Comment: Hidden coupling between pagination size and config

**Rule:** Explaining Comments — Add a comment only to capture a non-obvious _why_.

**Location:** `src/pages/index.njk`, frontmatter `size: 10`.

**Issue:** The pagination `size: 10` must stay in sync with `config.daysPerPage` (currently also 10), which is used in `sitemap.njk` to calculate the total number of paginated pages. Eleventy requires pagination size to be a literal in YAML frontmatter — it can't reference a variable. If someone changes `config.daysPerPage` without updating index.njk (or vice versa), the sitemap will generate wrong page URLs.

**Action:** Add a YAML comment:

```yaml
# Must match config.daysPerPage — Eleventy requires a literal here
size: 10
```

---

## 7. Normalize Symmetries: Nearly identical archive layouts

**Rule:** Normalize Symmetries — Pick one form and apply it consistently.

**Location:** `src/_includes/layouts/archive.njk` and `src/_includes/layouts/archive-index.njk`.

**Issue:** These two layouts are 5-line files that differ only in their wrapper CSS class:

```njk
{# archive.njk #}
<div class="archive-page">{{ content | safe }}</div>

{# archive-index.njk #}
<div class="archive-index">{{ content | safe }}</div>
```

Both extend `base.njk`. Two nearly identical files means updating the wrapper structure requires touching both.

**Action:** Merge into a single layout that reads the wrapper class from frontmatter:

```njk
---
layout: layouts/base.njk
---
<div class="{{ wrapperClass | default('archive-page') }}">
  {{ content | safe }}
</div>
```

Pages would set `wrapperClass: archive-index` in frontmatter where needed. This is a borderline change — two tiny files is also perfectly clear. Only worth doing if the layout structure is expected to grow beyond a single wrapper div.

**Caveat:** If the simplicity of "one layout per page type" is valued over DRY, this is fine to skip. The current approach has zero indirection cost.

---

## 8. Cohesion: `cheerio` in wrong dependency group

**Rule:** Cohesion Order — Move things that change together next to each other.

**Location:** `package.json`, `dependencies` section.

**Issue:** `cheerio` is listed under `dependencies` but is only used by `tools/migrate.js` (the one-time migration script). It is not used by the Eleventy build at all. `luxon` correctly remains in `dependencies` since `eleventy.config.js` imports it for date filters.

```json
"dependencies": {
  "cheerio": "^1.0.0",   // ← only used by tools/migrate.js
  "luxon": "^3.7.2"       // ← used by eleventy.config.js (build-time)
}
```

**Action:** Move `cheerio` to `devDependencies`:

```json
"dependencies": {
  "luxon": "^3.7.2"
},
"devDependencies": {
  "@11ty/eleventy": "^3.0.0",
  "cheerio": "^1.0.0"
}
```

This correctly signals that `cheerio` is a development/tooling dependency, not a build dependency.

---

## 9. Explaining Comment: Empty title in homepage frontmatter

**Rule:** Explaining Comments — Add a comment only to capture a non-obvious _why_.

**Location:** `src/pages/index.njk`, frontmatter line 9.

**Issue:** `title: ""` ensures `base.njk`'s title conditional renders just the site name:

```njk
<title>{% if title %}{{ title }} — {{ config.siteTitle }}{% else %}{{ config.siteTitle }}{% endif %}</title>
```

An empty string is falsy in Nunjucks, so the `{% else %}` branch fires. This works correctly but the intent of `title: ""` isn't self-evident — it looks like a placeholder someone forgot to fill in.

**Action:** Add a YAML comment:

```yaml
# Empty title: homepage renders as just "Stung Eye" in <title> tag
title: ""
```

---

## Summary

| #   | Rule                 | File(s)                   | Impact                                    |
| --- | -------------------- | ------------------------- | ----------------------------------------- |
| 1   | Dead Code            | `partials/nav.njk`        | Clear win — delete unused file            |
| 2   | Explaining Constants | `eleventy.config.js`      | Reduces magic strings, prevents drift     |
| 3   | Normalize Symmetries | `archive.njk`, `year.njk` | Eliminates template duplication           |
| 4   | Explaining Comments  | `archive.njk`, `year.njk` | Resolved by item 3, or add comment        |
| 5   | Dead Code            | `index.njk`               | Remove no-op config line                  |
| 6   | Explaining Comments  | `index.njk`               | Prevents future sync bug                  |
| 7   | Normalize Symmetries | `layouts/archive*.njk`    | Borderline — two tiny files is also fine  |
| 8   | Cohesion             | `package.json`            | Minor — correct dependency classification |
| 9   | Explaining Comments  | `index.njk`               | Clarifies non-obvious intent              |
