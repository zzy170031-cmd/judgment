# Project Agent Topology Standard

Use this rule when a project should run as a coordinated set of Codex agents, worker threads, QA/review gates, tests, evidence nodes, and an inspectable HTML project map.

## Core Rule

Generate agents from the real project state, not from a fixed org chart.

Every project node must bite into adjacent nodes:

- every work node has upstream inputs and downstream consumers;
- every implementation node has a test or evidence node;
- every test node has a pass/fail oracle and an owner;
- every handoff has a receiver;
- every done claim has evidence;
- every blocked node names the missing input, decision, permission, tool, or artifact.

No node may be marked `done` from confidence language alone.

## Codex UI Rule

When real subagents are launched, the live Codex UI is the primary conversation surface.

The topology must record the returned agent identity and where the user can inspect the conversation. The HTML map mirrors and organizes this state; it must not pretend to embed a live subagent chat unless the current Codex app exposes an embeddable conversation surface.

Required behavior:

- If `spawn_agent`, thread creation, or another real delegation tool succeeds, record `agent_id`, nickname/title, status, assigned node, and conversation surface.
- If the Codex UI shows the subagent in a side chat or right-side panel, record `conversation_surface: codex-side-chat`.
- If only a thread id or worker packet exists, record `conversation_surface: thread-link` or `worker-packet`.
- If no real agent was created, mark the agent as `planned` and do not claim it is running.
- The HTML must include a right-side agent conversation rail showing each real or planned agent, its assigned nodes, last known message/summary, status, blocker, and open/follow-up target.
- The HTML must distinguish live conversation state from mirrored summaries.
- Treat `conversation_visible: false` as a visible limitation, not a failure, when Codex does not expose an embeddable conversation surface.

Recommended graph-level fields:

```text
agents:
  - agent_id:
    nickname:
    role:
    status: planned / starting / running / blocked / review / done / failed / closed
    agent_lifecycle: planned / spawned / visible / active / closed / lost
    delegation_tool: spawn_agent / create_thread / worker_packet / manual / none
    delegation_result:
    assigned_nodes:
    conversation_surface: codex-side-chat / thread-link / worker-packet / html-summary / none
    codex_ui_location:
    conversation_visible: true / false
    conversation_ref:
    conversation_open_target:
    last_message:
    last_seen_at:
    last_synced_at:
    next_input:
    read_scope:
    write_scope:
    blocked_by:
    blocking_reason:
    required_human_input:
    claim_level: observed / inferred / planned / user-reported
    evidence:
    evidence_nodes:
```

## When To Build A Topology

Build a topology when any of these are true:

- the user asks for a project runtime, project cockpit, project dashboard, project node map, N agents, agent topology, agent graph, task graph, execution graph, or HTML project map;
- a project spans product/spec, design, frontend, backend, QA, security, release, data, AI/Agent, ops, or Git integration lanes;
- the work will run across multiple Codex threads, worker agents, Git worktrees, or checkpoints;
- every step must be tested and mutually integrated before advancing;
- the user wants visibility into current progress, blockers, evidence, and handoffs.

Do not build a topology for a one-step fix unless the user explicitly asks for the map.

## Agent Generation Rules

Create only the agents needed for the current project gate.

Start from the active XA/XB gate, role-lane responsibility, security/browser/ledger gates, and Git/worktree boundaries. Then generate agents from real ownership:

| Agent Type | Create when | Required verifier |
|---|---|---|
| Controller Agent | Any topology exists. Owns graph integrity, sequencing, blockers, and integration. | User or 555 for major gates. |
| Product/Spec Agent | Goal, scope, acceptance criteria, user flow, or non-goals are not locked. | Product acceptance checklist. |
| UX/Design Agent | Visual flow, interaction, accessibility, or design-source fidelity matters. | Browser/design evidence. |
| Frontend Agent | UI state, rendering, client behavior, accessibility, or browser flow changes. | Browser flow test plus relevant client tests. |
| Backend Agent | APIs, data model, auth enforcement, persistence, jobs, or server integrations change. | Backend tests, contract tests, or API evidence. |
| Fullstack Agent | A narrow vertical slice must cross UI/API/data in one lane. | Both browser/user evidence and backend/test evidence. |
| Platform/DevOps Agent | Build, dependency, CI/CD, runtime, environment, or deployment mechanics change. | Build/CI/runtime smoke evidence. |
| QA Agent | Functional, regression, compatibility, performance, accessibility, or artifact evidence is needed. | Test report and repro steps. |
| Security Agent | Auth, permissions, payments, secrets, privacy, production, external-send, destructive action, or AI tool risk exists. | Threat-model result and mitigation evidence. |
| AI/Agent Agent | Tool boundaries, guardrails, evals, approvals, observability, or agent behavior changes. | Eval/guardrail evidence and human approval gate. |
| Git/Integration Agent | Multiple workers, worktrees, merge sequencing, PR state, conflicts, or shared files exist. | Git status, diff, CI, and integration checklist. |
| Release/Ops Agent | Release, rollout, monitoring, rollback, support, incidents, or postmortems matter. | Release checklist, monitoring, rollback evidence. |
| 555/Core/Audit Agent | Milestone, done, release, backend/shared-surface, or safety confidence is being accepted. | Formal verdict and evidence record. |

If a real multi-agent tool is available and the user has authorized subagents, launch real agents for bounded disjoint tasks. If not, output copy-ready worker packets and mark them `planned`, not `running`.

## Node Schema

Represent every project graph node with these fields:

```text
id:
title:
type: agent / task / test / evidence / decision / handoff / blocker / artifact / release
lane:
owner:
agent_id:
agent_nickname:
delegation_tool:
delegation_result:
agent_lifecycle: planned / spawned / visible / active / closed / lost
conversation_surface: codex-side-chat / thread-link / worker-packet / html-summary / none
codex_ui_location:
conversation_visible: true / false
conversation_ref:
conversation_open_target:
last_agent_message:
last_seen_at:
last_synced_at:
claim_level: observed / inferred / planned / user-reported
status: planned / ready / running / blocked / review / done / failed / skipped
gate: G0 / G1 / G2 / G3 / G4 / G5 / G6 / none
inputs:
outputs:
depends_on:
unblocks:
test_or_evidence:
evidence_nodes:
pass_fail_oracle:
allowed_actions:
forbidden_actions:
read_scope:
write_scope:
worktree:
artifacts:
risks:
blocked_by:
blocking_reason:
required_human_input:
next_action:
updated_at:
```

Required invariants:

- `task` and `agent` nodes must have `inputs`, `outputs`, `depends_on`, and `test_or_evidence`.
- `running` or `review` agent nodes created from real delegation must have `agent_id`, `delegation_tool`, `delegation_result`, `conversation_surface`, and an open target or explicit `conversation_visible: false`.
- Agent nodes with `conversation_surface: html-summary` must be marked as mirrored summaries, not live conversations.
- `test` nodes must have `pass_fail_oracle`, `owner`, and `unblocks`.
- `handoff` nodes must have one sender, one receiver, and expected output.
- `blocker` nodes must have a next action or required human decision.
- `blocker` nodes must name `blocked_by`, `blocking_reason`, or `required_human_input`.
- `done` nodes must have evidence artifacts or command/test results.
- Parallel `agent` nodes must have disjoint write scopes or a named `Git/Integration Agent`.
- Node and agent states must not contradict each other. For example, an agent cannot be `done` while all assigned task nodes are still `running` unless the graph explains the handoff.
- Dependency cycles are invalid unless the graph marks the cycle as an intentional iterative loop with a controller stop condition.

## Execution Loop

Run the topology in this loop:

```text
observe real state -> update graph -> choose ready nodes -> dispatch agents or packets -> run tests/evidence -> integrate -> review -> update graph -> continue or stop
```

Before advancing a node:

1. Confirm upstream dependencies are `done` or explicitly waived by the controller.
2. Confirm the node has a test/evidence oracle.
3. Confirm forbidden actions and approval points are clear.
4. Confirm shared files, Git worktree, branch, and integration owner if writing.
5. Confirm downstream receiver.

After a node runs:

1. Record exact changed files, artifacts, commands, screenshots, logs, or decisions.
2. Update status based on evidence, not intention.
3. Route failed tests to the owning implementation node.
4. Route integration conflicts to the Git/Integration Agent.
5. Route milestone/release/safety acceptance to `555` when required.

## HTML Project Map

When the user asks for an HTML project map, generate a standalone HTML file from the graph data.

Default artifact paths:

```text
project-agent-graph.json
project-agent-graph.html
```

The HTML must show:

- project title, current gate, timestamp, controller verdict;
- node counts by status and type;
- lane columns or graph cards with stable visual hierarchy;
- a right-side Agent Conversations rail for real subagents, thread links, worker packets, and summaries;
- a streaming mirror panel that appends agent/node/test events in order so progress can be watched without reading the whole graph at once;
- dependencies and unblocks;
- test/evidence status for every work node;
- blockers and next actions;
- integration risks including overlapping write scopes, Git worktrees, conflict owner, and merge receiver;
- claim levels so observed facts, inferred state, planned packets, and user-reported state are visually distinct;
- artifact links or paths;
- a raw JSON section for auditability.

UI design requirements:

- Use a work-focused cockpit layout, not a marketing page.
- Match the user's working language; use Chinese labels for Chinese users.
- Keep cards compact, scannable, and stable across desktop and mobile.
- Use status color and labels consistently.
- Show missing tests/evidence as warnings, not hidden text.
- Make the right-side agent rail sticky on wide screens and stacked after the board on narrow screens.
- Make streaming output visibly secondary to the source graph and live Codex side chats; it is a mirror, not proof.
- Prefer clear text labels over decorative graphics; the purpose is operations visibility.

The HTML is a visualization of state, not the source of truth. The graph JSON, live Codex side chats, Git state, tests, and ledger are the source of truth.

## Output Shape

```text
Project agent topology:
- project:
- current gate:
- topology source:
- controller:
- generated agents:
- nodes:
- required tests / evidence:
- integration points:
- blockers:
- live Codex conversation surfaces:
- HTML artifact:
- graph JSON:
- next dispatch:
```

## Forbidden

- Do not claim real agents were created unless a real subagent/thread tool was used successfully.
- Do not create N agents just to fill a chart.
- Do not let work nodes skip tests or evidence.
- Do not mark blocked work as done.
- Do not let implementation agents self-approve release, milestone, backend/shared-surface, production, security, or AI/Agent safety outcomes.
- Do not let parallel agents write overlapping files without a named integration owner and conflict policy.
- Do not treat the HTML map as proof; proof lives in test results, artifacts, Git state, and reviewer verdicts.
