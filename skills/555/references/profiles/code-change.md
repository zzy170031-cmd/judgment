# P01 Code / Change Review

Use for code, configuration, dependencies, APIs, migrations, automation scripts,
or infrastructure changes.

## Criteria And Required Evidence

- Freeze repository, base, candidate, diff range, worktree state, and pre-existing
  dirty changes.
- Prove the implementation exists, is wired into the real entrypoint, and keeps
  caller, contract, state, and error-path invariants.
- Check unchanged but affected consumers, compatibility, permissions, data
  migration, supply chain, rollback, and blast radius.
- Bind tests to the candidate and the changed behavior. Lint, static analysis,
  unrelated tests, or an implementer summary cannot prove runtime outcome.
- Prefer a real target-environment observation when the claim is behavioral.

## Role Seeds

Domain maintainer, caller/integrator, test engineer, operator, security reviewer.

## Boundary

A Judgment pass does not replace project CI, formal code review, migration
approval, release validation, or the user's Git authority.
