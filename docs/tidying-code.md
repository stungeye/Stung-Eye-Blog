# Project Code Tidying Rules

The purpose of tidying is to counteract the structural complexity that naturally accumulates in a codebase over time. Left unchecked, that complexity makes every future change slower, riskier, and harder to reason about. Regular, disciplined tidying keeps the code in a state where changes remain straightforward. Clean structure also directly improves readability for both human and AI readers — making the codebase easier to navigate, review, and safely modify by anyone working in it.

## Core Constraint

**Change structure only. Never change behavior.** Do not proceed if a tidying would alter what the program computes or what it does.

---

## The Tidying Rules

1. **Guard Clauses** — Replace nested conditionals with early returns. Eliminate one level of nesting per guard.

2. **Dead Code** — Delete unreachable or unused code entirely. Don't comment it out.

3. **Normalize Symmetries** — When the same pattern appears multiple ways, pick one form and apply it consistently throughout the file.

4. **Cohesion Order** — Move things that change together next to each other — methods, files, folders.

5. **Explaining Variables** — Extract complex sub-expressions into named variables that encode intent.

6. **Explaining Constants** — Replace magic literals with named constants, grouped with related constants. User facing strings should be extracted to the strings.xml file.

7. **Explicit Parameters** — If a function secretly reads from a context or global object, surface those values as named parameters instead.

8. **Extract Helper** — Pull a coherent block of code into a well-named function, especially when call order between two operations is significant.

9. **One Pile** — If over-extraction has fragmented code into vague, hard-to-follow pieces, inline them back into a single readable unit.

10. **Explaining Comments** — Add a comment only to capture a non-obvious _why_ — an edge case, a surprising constraint, or a deliberate tradeoff.

11. **Delete Redundant Comments** — Remove any comment that merely restates what the code already clearly says.

---

## Stop Conditions

- **Do not** chain tidyings indefinitely. One focused pass, then commit.
- **Do not** mix tidyings with behavior changes in the same edit.
