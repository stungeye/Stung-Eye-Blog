# Protocol: Issue Mend

Use this protocol for addressing logged bugs, small repairs, and tightly bounded maintenance issues.

## Objective

Repair one numbered issue from `docs/issues-and-fixes.md` at a time using a compact shared-context process.

---

## Phase 1: Select One Issue

Start with exactly one numbered issue from `docs/issues-and-fixes.md`. If the user does not specify an issue, select the first one that is not marked as fixed or deferred. Select issues in order of high/medium/low priority. Select issues that are not blocked by other issues.

The agent should confirm:

- the issue number and title
- the issue status allows work to begin
- the affected files and future direction are understood

Do not batch multiple issues unless the human explicitly asks for a bundled repair pass.

---

## Phase 2: Micro Context

Read only the context needed to repair the selected issue safely:

1. the selected issue entry in `docs/issues-and-fixes.md`
2. `README.md` and `MIGRATION-NOTES.md` sections relevant to the affected area
3. the files named in the issue entry
4. directly related tests, if available
5. `docs/no-fix-issues.md` if the issue touches previously deferred behavior

The agent should ask clarifying questions when ambiguity could lead to the wrong fix. Keep questions narrow and practical.

Proceed when there are no more open questions.

---

## Phase 3: Mend Brief

Before changing code, the agent should give the human a short mend brief.

Use this shape:

**Target** - The issue number and the defect or maintenance problem being repaired.

**Repair Boundary** - What will change, and what will stay out of scope.

**Acceptance Criteria** - Specific checks that prove the issue is fixed.

**Test Plan** - The smallest useful red/green test approach, or why an automated test is not practical.

Proceed only after the human confirms the mend brief with "make it so".

---

## Phase 4: Red/Green Repair

Prefer a small red/green loop:

1. Write or update the narrowest failing test that proves the issue.
2. Run the relevant test scope and confirm the expected failure.
3. Implement the smallest code change that satisfies the test and acceptance criteria.
4. Re-run the focused test scope.
5. Refactor only after behavior is green and protected.

If a failing automated test is not practical, explain why and use the strongest reasonable alternative, such as a focused manual smoke check or a narrower unit test around the risky logic.

---

## Phase 5: Quality Bar

The repair should be easy to review and safe to modify later.

Aim for:

- simple, readable control flow
- names that explain intent
- changes limited to the selected issue
- modular code only where it reduces real complexity
- tests that describe observable behavior

Avoid:

- speculative abstractions
- unrelated cleanup
- broad rewrites
- changing product behavior outside the issue boundary

If small structural cleanup is needed to make the repair clear, keep it local and explain why it supports the fix.

---

## Phase 6: Verification And Issue Log

Before closing the repair:

- run the focused tests
- run broader tests if the touched code has cross-cutting risk
- compare the result against every acceptance criterion
- sanity-check adjacent behavior that is easy to regress

Environment note: this project includes an `.nvmrc`. In non-interactive shells,
`npm` may not be on `PATH` until nvm is initialized. If a plain `npm ...`
command is not found, rerun it with:

```bash
source ~/.nvm/nvm.sh && nvm use >/dev/null && npm ...
```

Report your findings and ask if the issue should be considered fixed or if further work is required.

Return to Phase 4 for further work.

If the issue is fixed, update and move the issue from `docs/issues-and-fixes.md`:

- move issue to a date-stamped archive file: `docs/archive/YYYY-MM-DD-issue-number-and-brief-description.md`
- mark the issue `FIXED YYYY/MM/DD` when complete
- summarize the repair result concisely
- list changed files when useful for future readers

If there are follow-up issues, log them to `docs/issues-and-fixes.md` as new numbered issues.

---

## Closeout

The final response should report:

- the issue repaired
- the high-level code change
- tests added or updated
- commands run
- any remaining risk or deferred follow-up

The result should fix the selected issue, keep the change well scoped, and leave the surrounding code clear enough for the next repair.

When the user says "commit" commit changes to git with a descriptive commit. Use a "[fix]" prefix.
