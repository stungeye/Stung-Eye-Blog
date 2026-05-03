# Issue 2: Archive Nav Link Missing Trailing Slash

**Status:** FIXED 2026/05/03

## Original Problem

The header navigation in `src/_includes/layouts/base.njk` linked to `/archive`
instead of the canonical `/archive/` URL documented by the README and generated
by `src/pages/archive.njk`.

This caused one avoidable redirect when clicking the Archive nav link on servers
that canonicalize directory indexes.

## Repair

- Updated the header Archive nav link to point directly to `/archive/`.
- Left archive page routing, redirects, generated posts, and other archive links
  unchanged.

## Verification

- Ran `rg 'href="/archive"|href="/archive/"' src/_includes src/pages -n` and
  confirmed the header link now uses `/archive/`.
- Ran `source ~/.nvm/nvm.sh && nvm use 24.14.1 >/dev/null && npm run build`.

## Changed Files

- `src/_includes/layouts/base.njk`
