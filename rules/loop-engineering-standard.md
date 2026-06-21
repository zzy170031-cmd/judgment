# Loop Engineering Standard

Use this rule when Judgment is asked to turn Codex work into a repeated, visible, stateful, or partially automated development loop.

Judgment's primary runtime is Codex. This rule does not import an external agent runtime, daemon, hook system, tmux team, or hidden state machine. It turns repeatable project-development work into Codex-native surfaces: prompts/threads, rules, skills, scripts, automations, worktrees, Browser evidence, Agent Office events, and 555 review.

## Core Position

- The skill exists to support future Codex project development.
- Codex remains the executor. HTML, dashboards, bridge queues, and state files are observability and request surfaces, not direct execution authority.
- External model/tool practices are inspiration only until translated through `rules/codex-surface-governance-standard.md`.
- A loop is only justified when it improves repeated project work with measurable evidence.
- Every loop has a `Judgment Controller`: the main scheduling agent that reads project state, skill subflows, lane status, evidence, blockers, and Agent Office visibility before deciding the next route.

## Judgment Controller

The `Judgment Controller` is the main agent role for project development. It does not replace implementation workers, planners, splitters, verifiers, or `555`; it coordinates them.

Controller responsibilities:

- keep the full project map: current XA/XB gate, user goal, active branch/worktree, lane ownership, blockers, evidence, and next receiver;
- select the next Codex surface: direct current-thread work, `work-planner`, `work-splitter`, worker packet, script, Browser verification, worktree, automation, or `555`;
- enforce the Loop Readiness Gate before any repeated or automated loop;
- maintain the state surface and write Agent Office events when visibility is active;
- prevent orphaned nodes: every work node needs upstream input, downstream receiver, and test/evidence oracle;
- stop the loop when budget, review, safety, Git ownership, context pressure, or missing oracle requires human/controller intervention;
- accept completion only after verifier/QA/555 evidence is attached when the gate requires it.

The controller should be explicit in reports:

```text
Judgment Controller:
- sees:
- decides:
- delegates to:
- waits for:
- blocks on:
- evidence required:
```

## Loop Readiness Gate

Before allowing a loop, answer all checks:

| Check | Pass Condition | If It Fails |
|---|---|---|
| Repetition | The workflow has repeated before or is clearly likely to recur. | Keep it as direct Codex work or a one-off plan. |
| Automatic oracle | At least one hard detector exists: tests, typecheck, lint, build, Browser flow, screenshot/DOM check, CI check, schema validation, or script output. | First build the oracle; do not loop on confidence language. |
| Codex run/debug access | Codex can run commands, inspect logs, view artifacts, or reproduce the issue inside allowed permissions. | Mark blocked or planning-only. |
| Budget | Time, token, retry, and file-change limits are explicit. | Use manual execution only. |
| Human review | The user, named verifier, QA lane, or `555` will review accepted output. | Do not run unattended. |
| Scope boundary | Allowed files/actions and forbidden files/actions are stated. | Stop at a route packet. |
| State surface | A response ledger or repo artifact records current node, evidence, blockers, and next action. | Add state before continuing. |
| Controller route | The Judgment Controller can name the next receiver and stop condition. | Keep the work manual or planning-only. |
| Safety | Security, privacy, production, external-send, destructive, and AI/tool side effects have a gate. | Route to security review, user decision, or `555`. |

Allowed readiness values:

- `no-loop`: one-off, no oracle, unsafe, too costly, or review missing.
- `manual-first`: repeatable idea exists, but one stable manual run is still needed.
- `skill-ready`: a manual pattern is stable enough to encode as a skill/rule/script.
- `loop-ready`: oracle, state, budget, review, and stop conditions are all present.
- `blocked`: a required permission, target, command, repo state, or human decision is missing.

## Build Order

Do not jump directly to automation. Use this order:

1. Stabilize one manual Codex run.
2. Define the completion oracle.
3. Write or update the narrow rule/skill/script.
4. Add durable state.
5. Add Agent Office visibility if the user benefits from watching progress.
6. Add worktree isolation only when parallel writers or clean verification require it.
7. Add automation or heartbeat only after the manual loop closes reliably.
8. Add `555` review before accepting milestone, release, architecture, backend/shared-surface, AI/Agent safety, or done claims.

## Runtime State Contract

When a loop needs repo-visible state, use a small artifact such as `.judgment/loop-state.json` or a project-specific equivalent. It should be safe to inspect and commit only when appropriate.

Minimum JSON shape:

```json
{
  "runId": "loop-001",
  "project": "OpenClaw Platform",
  "codexOnly": true,
  "purpose": "support future project development",
  "controller": {
    "agentId": "judgment-controller",
    "role": "Judgment Controller",
    "sees": ["project gate", "skill subflows", "lane status", "evidence", "blockers"],
    "decision": "route frontend node to Browser verification",
    "delegatesTo": "QA Agent",
    "waitsFor": "browser evidence",
    "stopCondition": "QA fails or review required"
  },
  "gate": "XB-4",
  "readiness": "manual-first",
  "status": "running",
  "currentLane": "frontend",
  "currentAgent": "UI Agent",
  "currentNode": "browser-evidence",
  "upstreamInputs": ["task packet", "mock data"],
  "downstreamReceivers": ["QA Agent", "555 Review"],
  "allowedActions": ["edit agent-office files", "run local validation"],
  "forbiddenActions": ["deploy", "delete user files", "push without approval"],
  "oracles": ["browser screenshot", "DOM check", "git diff review"],
  "budget": {
    "maxRetries": 3,
    "maxMinutes": 60,
    "maxChangedFiles": 12
  },
  "worktree": {
    "required": false,
    "path": "",
    "branch": ""
  },
  "evidence": [],
  "blockers": [],
  "nextAction": "run Browser validation",
  "review": {
    "required": true,
    "receiver": "555",
    "status": "pending"
  },
  "metrics": {
    "attempts": 1,
    "acceptedChanges": 0,
    "acceptanceRate": 0
  },
  "updatedAt": "2026-06-22T00:00:00+08:00"
}
```

## Agent Office Visibility

If Agent Office is active, every loop update should be visible in at least one of these surfaces:

- top current-execution strip;
- lane progress cards;
- Agent status rail;
- activity feed;
- Evidence Wall;
- Codex Bridge request queue;
- Git/Worktree panel.

The Agent Office should show the Controller as the primary scheduling agent. Other agents are implementation, planning, verification, or review lanes underneath the Controller, not equal independent authorities.

Codex should write events for:

- node start;
- evidence produced;
- blocker found;
- blocker resolved;
- verification passed/failed;
- human review needed;
- loop stopped.

## Subagent And Verifier Split

Use separate workers only when there is a real delegation surface or copy-ready worker packet.

- Writer: performs bounded implementation inside allowed files/actions.
- Verifier: checks oracle outputs and artifacts.
- Reviewer/555: accepts or rejects milestone, release, backend/shared-surface, AI/Agent safety, or done claims.
- Controller: owns state, scope, blockers, worktree boundaries, and final route.

Do not claim subagents are running unless a real tool returned an agent/thread id or the packet is explicitly marked planned.

## Stop Conditions

Stop the loop and report instead of continuing when:

- the automatic oracle is missing or failing without a clear next fix;
- retry, time, token, or changed-file budget is exhausted;
- the task requires production, deployment, external-send, destructive, auth, payment, user-data, or secret access not explicitly approved;
- Git/worktree ownership is unclear;
- the current thread lacks enough context to continue safely;
- reviewer, QA, or user decision is required;
- accepted-change rate is too low to justify more looping.

## Output Fields

When reporting a loop decision, include:

```text
Loop readiness:
- value: no-loop / manual-first / skill-ready / loop-ready / blocked
- Judgment Controller: sees / decides / delegates / waits-for / stop-condition
- repeated workflow:
- oracle:
- state surface:
- budget:
- human review:
- Codex surface:
- Agent Office visibility:
- stop condition:
- next smallest gate:
```

## Forbidden

- Do not run unattended loops without a hard oracle and human review.
- Do not use an HTML page, bridge queue, or dashboard as an executor.
- Do not import external workflow runtimes into Judgment unless the user opens a separate runtime-design gate.
- Do not create automations for one-off work.
- Do not mark a loop done from implementer self-attestation alone.
- Do not hide state in chat when the work needs to survive handoff or future project development.
