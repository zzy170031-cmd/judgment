# Controller State Machine Standard

Use this rule when Judgment acts as the main scheduling agent for Codex project development, especially with Loop Engineering, Agent Office visibility, worker packets, worktrees, or 555 review.

The `Judgment Controller` is not a separate runtime. It is the Codex-side role that keeps the project map, selects the next surface, enforces gates, records state, and stops unsafe or unproductive loops.

## State Machine

```text
intake -> orient -> plan -> split -> route -> execute -> verify -> review -> persist -> next-or-stop
```

Each state must have:

- input;
- allowed actions;
- forbidden actions;
- oracle;
- output;
- next receiver;
- stop condition.

## States

### intake

- input: latest user request, current goal, visible Agent Office request, or bridge packet.
- allowed actions: summarize request, detect overrides, classify gate, detect missing facts.
- forbidden actions: edit files, start workers, push, install, deploy.
- oracle: request is restated with scope and write/read gate.
- output: accepted intake packet or clarification/blocker.
- next receiver: `orient` or user.
- stop condition: request is ambiguous in a way that changes permissions, safety, or target.

### orient

- input: intake packet.
- allowed actions: inspect repo, branch, dirty state, relevant rules, active goal, Agent Office state, and evidence.
- forbidden actions: destructive Git, broad cleanup, hidden background execution.
- oracle: live state is recorded or declared unavailable.
- output: orientation snapshot.
- next receiver: `plan`.
- stop condition: ownership conflict, missing workspace, missing permission, or high context risk.

### plan

- input: orientation snapshot.
- allowed actions: choose gate, route, readiness, scope, budget, oracle, and review owner.
- forbidden actions: treating a plan as acceptance.
- oracle: plan names next surface and acceptance evidence.
- output: execution plan or route packet.
- next receiver: `split`, `route`, user, or `555`.
- stop condition: no hard oracle, no budget, no review path, or no safe scope.

### split

- input: plan.
- allowed actions: split into lanes, worker packets, dependencies, tests, and evidence nodes.
- forbidden actions: claiming real workers exist without a real tool/thread id or planned label.
- oracle: every work node has upstream input, downstream receiver, and test/evidence node.
- output: lane graph and worker contracts.
- next receiver: `route`.
- stop condition: unsafe parallelism, branch/worktree conflict, or missing integration owner.

### route

- input: plan or split output.
- allowed actions: choose current-thread work, skill, script, Browser check, worktree, worker thread, automation, or 555.
- forbidden actions: route to an unavailable tool or broad permission surface.
- oracle: route includes allowed files/actions, forbidden actions, budget, and state update target.
- output: dispatch instruction.
- next receiver: `execute`, worker, verifier, user, or `555`.
- stop condition: no available receiver or required approval missing.

### execute

- input: dispatch instruction.
- allowed actions: bounded edits, commands, Browser checks, or script runs inside permissions.
- forbidden actions: uncontrolled loops, unrelated refactors, destructive actions, or unauthorized installs/push/deploy.
- oracle: command output, diff, screenshot, DOM check, schema validation, or other evidence.
- output: implementation evidence and changed state.
- next receiver: `verify`.
- stop condition: failing oracle without clear next fix, budget exhausted, or permission boundary reached.

### verify

- input: implementation evidence.
- allowed actions: run checks, inspect diffs, compare UI, validate schemas, review logs.
- forbidden actions: self-acceptance for milestone/release/high-risk claims.
- oracle: verifier evidence is attached.
- output: pass, conditional pass, fail, or review required.
- next receiver: `review`, `persist`, `execute`, user, or `555`.
- stop condition: evidence is stale, missing, or contradictory.

### review

- input: verification output.
- allowed actions: request user/QA/555 decision, produce acceptance summary, reject weak evidence.
- forbidden actions: accepting release/done claims from implementer self-report.
- oracle: named reviewer or 555 verdict.
- output: accepted, rejected, needs more evidence, or blocked.
- next receiver: `persist`, `execute`, or user.
- stop condition: reviewer decision required.

### persist

- input: accepted or active state.
- allowed actions: update loop-state, activity feed, Evidence Wall, roadmap, report, or handoff.
- forbidden actions: hiding durable state only in chat when future continuation is expected.
- oracle: state artifact or final report names current node and evidence.
- output: saved state or final summary.
- next receiver: `next-or-stop`.
- stop condition: artifact cannot be written or should not be committed.

### next-or-stop

- input: persisted state.
- allowed actions: continue to next node, ask user, escalate, or stop cleanly.
- forbidden actions: continuing after stop condition.
- oracle: next action or stop reason is explicit.
- output: next route or closed loop.
- next receiver: Controller, user, worker, verifier, or 555.
- stop condition: done, blocked, budget exhausted, review required, context risk, or unsafe surface.

## Report Shape

```text
Judgment Controller:
- state:
- sees:
- decides:
- delegates to:
- waits for:
- oracle:
- state update:
- stop condition:
```

## Agent Office Mapping

Agent Office should render:

- current Controller state;
- active lane and node;
- delegated agent;
- expected oracle;
- latest evidence;
- blocker or stop reason;
- next receiver.

## Forbidden

- Do not skip directly from intake to execution when permissions, target, or acceptance are unclear.
- Do not continue a loop after a stop condition.
- Do not let a UI request bypass `intake`, `orient`, and `plan`.
- Do not let a failed verifier become accepted output without review.
