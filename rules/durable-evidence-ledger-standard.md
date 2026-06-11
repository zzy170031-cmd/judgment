# Durable Evidence Ledger Standard

Use this rule when a Judgment workflow needs durable progress tracking, evidence closure, or handoff continuity beyond the current response.

This rule adapts durable-goal and ledger patterns from external workflow systems into Judgment's lighter governance model. It does not require an external runtime, background daemon, tmux session, hook system, or hidden state directory.

## When To Use

Require a ledger when any of these are true:

- the task is long-running, multi-step, or likely to cross context windows;
- the user authorizes an autonomous or repeated loop;
- a milestone, release, done claim, or `go / conditional go / no-go` decision will be made;
- multiple lanes, workers, or threads report evidence to a controller;
- failure recovery depends on knowing which checks ran and what they proved;
- temporary harnesses, generated artifacts, or cleanup decisions must be tracked.

Do not require a ledger for tiny direct answers, one-file docs changes, or read-only status checks that finish in the same response.

## Minimum Ledger Fields

Use Markdown, JSON, or JSONL. Pick the simplest format the repo can inspect and preserve.

```text
objective:
workspace:
branch_head:
gate:
allowed_scope:
forbidden_actions:
current_status: planned / active / blocked / review / accepted / rejected / handed-off
decision_owner:
evidence:
  - command_or_artifact:
    result:
    timestamp_or_commit:
    limitation:
review:
  - reviewer_or_role:
    verdict:
    required_fixes:
temporary_artifacts:
  - path:
    keep_or_cleanup:
    reason:
risks:
next_gate:
```

## Rules

- Store ledger files in the repo or workspace when the user opens a write gate; otherwise report the ledger shape in the response.
- Keep ledger entries factual. Separate command results, reviewer judgments, assumptions, and user decisions.
- Update the ledger at gate transitions, not after every minor observation.
- Do not let the actor who implemented a release or milestone be the only reviewer of readiness.
- Do not claim completion from a ledger entry unless the underlying files, commands, artifacts, or reviewer outputs were inspected in the current gate.
- If actual Git/file state disagrees with the ledger, trust actual state and record the mismatch.

## Closure

Before closing a ledger-backed task, report:

- final status;
- exact evidence checked;
- unresolved risks or user decisions;
- temporary artifacts kept or cleaned;
- next gate or stop reason.
