# Issue 1: Multi-Entry MT Heading Dedup

**Status:** FIXED 2026/05/03

## Original Problem

On multi-entry MT-only days, the page title was taken from the first MT entry in
export order, while body entries rendered newest-first. The heading dedup then
removed the heading from the title-matching entry even when that entry rendered
later on the page.

This created orphaned sections on 22 pages. For example,
`src/posts/2003/01/02/index.md` had page title `Zone Woes`, while the first
rendered entry was `1825`; the later `Zone Woes` content appeared without its
own section heading.

## Repair

- Updated `determineDayTitle()` in `tools/migrate.js` to choose the first MT
  entry from the same newest-first sorted order used for rendering.
- Reran migration to update the checked-in `src/posts/` corpus.
- Reran image resizing after migration restored 500px source images.
- Added `tools/verify-issue-1.js` to check MT-only multi-entry page title and
  body-heading alignment.
- Updated migration notes to document that multi-entry MT-only titles come from
  the first rendered entry after sorting.

## Verification

- Confirmed `node tools/verify-issue-1.js` failed before the repair on
  `2003-01-02`.
- Ran `source ~/.nvm/nvm.sh && nvm use >/dev/null && npm run migrate`.
- Ran `source ~/.nvm/nvm.sh && nvm use >/dev/null && npm run resize-images`.
- Ran `source ~/.nvm/nvm.sh && nvm use >/dev/null && node tools/verify-issue-1.js`.
- Ran `source ~/.nvm/nvm.sh && nvm use >/dev/null && npm run build`.
- Ran `source ~/.nvm/nvm.sh && nvm use >/dev/null && node tools/verify-date-time-usage.js`.

## Changed Files

- `tools/migrate.js`
- `tools/verify-issue-1.js`
- `MIGRATION-NOTES.md`
- `src/posts/2003/01/02/index.md`
- `src/posts/2003/02/17/index.md`
- `src/posts/2003/03/26/index.md`
- `src/posts/2003/08/27/index.md`
- `src/posts/2003/09/11/index.md`
- `src/posts/2003/10/16/index.md`
- `src/posts/2003/10/28/index.md`
- `src/posts/2003/11/05/index.md`
- `src/posts/2003/11/18/index.md`
- `src/posts/2004/01/02/index.md`
- `src/posts/2004/01/14/index.md`
- `src/posts/2004/03/11/index.md`
- `src/posts/2004/04/20/index.md`
- `src/posts/2004/05/13/index.md`
- `src/posts/2004/07/07/index.md`
- `src/posts/2004/08/28/index.md`
- `src/posts/2004/10/11/index.md`
- `src/posts/2005/11/10/index.md`
- `src/posts/2006/01/14/index.md`
- `src/posts/2006/04/30/index.md`
- `src/posts/2006/09/27/index.md`
- `src/posts/2006/12/01/index.md`
