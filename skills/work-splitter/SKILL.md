---
name: "work-splitter"
description: Dedicated Codex work decomposition agent for turning vague or large tasks into bounded execution lanes, XA/XB gates, Agent groups, handoff contracts, thread strategy, and 555 escalation decisions. Use when the user says 工作拆分, 拆任务, 拆工, 分工, 编组, 任务切分, 开发线路, 子任务, 分线程, 如何拆, 先做什么后做什么, Agent编组, or asks how to split product/game/AI development work before implementation.
---

# work-splitter

## Purpose

Use `work-splitter` as the dedicated decomposition agent. It answers one question:

```text
How should this work be split so that Codex can execute, review, verify, and hand off it safely?
```

It works with:

- `666`: upstream router for skill choice, Codex-maxxing fit, context pressure, packaging, and whether this skill is needed.
- `needs-solution-designer`: upstream needs-clarification skill for fuzzy ideas, rough customer requests, unclear success criteria, reuse decisions, and solution-blueprint stabilization.
- `555`: five-agent assurance loop for milestone, release, backend/shared-contract, architecture, AI/Agent safety, and adversarial review.
- `XA/XB`: product/game development standards in `~/.codex/rules/xa-xb-standard.md`.
- `rules/durable-evidence-ledger-standard.md`: lightweight ledger rule for long work, worker evidence, QA gates, and temporary artifact disposition.
- `rules/authority-boundary-standard.md`: authority boundary rule for separating Markdown guidance, HTML visibility/request intake, Codex execution, verification, and acceptance.
- `rules/controller-state-machine-standard.md`: Controller state-machine rule for project-level route, verification, persistence, and stop/next decisions.
- `rules/loop-engineering-standard.md`: Codex-only readiness rule for repeated project-development loops, Controller scheduling, hard oracles, state, budget, and stop conditions.
- `rules/project-agent-topology-standard.md`: project runtime topology rule for generating real/planned agents, interlocked node/test/evidence graphs, conversation surfaces, and HTML cockpit artifacts.
- `rules/codex-surface-governance-standard.md`: translation rule for external agent/model/tool patterns into Codex-only surfaces before they become work lanes.
- `rules/role-lane-responsibility-standard.md`: responsibility mapping rule for product, programmer, frontend, backend, fullstack, platform/DevOps, SRE/Ops, QA, security, data, AI/Agent, Git/GitHub, docs/rules, and release lanes.
- `rules/security-review-standard.md`: threat-model rule for sensitive data, permissions, external-send, production, AI/Agent tools, and destructive actions.
- `rules/browser-flow-testing-standard.md`: Browser-visible verification rule for web UI, local previews, artifacts, and interaction flows.

`work-splitter` sits between routing and execution:

```text
666 decides whether needs clarification or decomposition is needed.
needs-solution-designer clarifies fuzzy needs and stabilizes the solution blueprint.
work-splitter creates the work breakdown and contracts.
XA/XB defines the development gates.
555 reviews high-risk plans, milestones, or release gates.
Implementation skills or worker threads execute bounded lanes.
```

## Trigger Policy

Strong trigger:

- User explicitly says 工作拆分, 拆任务, 拆工, 分工, 编组, 任务切分, 子任务, 分线程, 开发线路, 如何拆, 先做什么后做什么, Agent 编组.
- User asks to split a product/game/AI project into roles, lanes, gates, teams, or Agent responsibilities.
- User says an existing skill/rule is too large and should be split, refined, or modularized.
- User asks what should be done in the current thread versus worker threads.
- User asks whether to use testing, audit, red-team, Core Challenger, 555, or implementation workers.

Medium trigger:

- The task has more than one likely lane: product/spec, design, frontend, backend, QA, security, release, operations, docs, data, AI/Agent.
- The work could be parallelized but dependencies are unclear.
- A project has scope creep, unclear completion criteria, or repeated handoff failures.
- A milestone/release/done claim needs a pre-review decomposition before `555`.

Do not trigger for:

- A trivial one-step command or answer.
- A direct implementation request with a clear single file and obvious verification.
- A pure code review request where `555` or normal review is already the right tool.

## First Gate

Before splitting, identify the smallest sufficient context:

1. User intent: implement, review, release, debug, design, document, package, operate, or decide.
2. Product flow: `XA`, `XB`, or non-product/general.
3. Active delivery gate: `G0` through `G6` from the XA/XB standard.
4. Target artifact: code, app, document, local rule, skill, package, PR, release, browser artifact, or operations report.
5. Risk type: data, auth, payment, privacy, production, external-send, AI/Agent tools, destructive action, user-owned files.
6. Existing evidence: files, repo state, tests, builds, screenshots, logs, docs, prior reports.
7. Context strategy: same thread, handoff, worker thread, or `555`.
8. Ledger strategy: none, response-level ledger, repo artifact, or required before execution.
9. Loop readiness strategy: no-loop, manual-first, skill-ready, loop-ready, or blocked, with Judgment Controller route.
10. Authority-boundary strategy: source surface, target surface, permission basis, verifier, acceptor, and stop condition.
11. Controller state strategy: intake, orient, plan, split, route, execute, verify, review, persist, or next/stop.
12. Independent review strategy: none, named verifier, QA lane, or `555`.
13. Project topology strategy: none, graph-required, html-required, agents-planned, agents-running, or blocked.
14. Codex surface strategy: none, existing surface, extend rule/skill, script, automation, connector/MCP, worktree, or 555.
15. Role/lane responsibility strategy: no split, primary lane, supporting lanes, verifier, and handoff receiver.
16. Security review strategy: none, focused, Security/Compliance Lane, `555`, user-decision, or block.
17. Browser flow strategy: none, required, QA Lane, verified, conditional, or block.

If the user's need is still fuzzy, customer-facing, or not stable enough to restate in plain language, route to `needs-solution-designer` before decomposing. Do not split work from an unstable need unless the split is explicitly for discovery.

If a critical fact is missing and cannot be inferred safely, ask one concise question. Otherwise make a conservative assumption and state it.

## Decomposition Levels

Choose the smallest useful decomposition level:

| Level | Use When | Output |
|---|---|---|
| `D0 no split` | One small action can finish safely. | Direct next step and verifier. |
| `D1 sequential` | One lane, multiple ordered steps. | Ordered checklist with gates. |
| `D2 lane split` | Multiple specialties can work in parallel or sequence. | Lanes, owners, dependencies, outputs. |
| `D3 Agent groups` | Work needs Product/Tech/QA/Release/Ops or game groups. | Agent group contracts and handoffs. |
| `D4 555 prep` | Milestone, release, architecture, backend/shared surface, AI safety, or adversarial assurance. | 555-ready packet with risks and evidence requests. |
| `D5 thread dispatch` | Work should be split into worker threads or handoff packets. | Copy-ready controller-to-worker instructions. |

Do not over-split. If `D1` is enough, do not create five teams.

## Split Algorithm

Run this in order:

1. Normalize the task into one sentence.
2. If the need cannot be clearly restated, hand off to `needs-solution-designer`.
3. State non-goals and forbidden actions.
4. Route to `XA`, `XB`, or general workflow.
5. Pick the active `G0-G6` gate if XA/XB applies.
6. Identify the minimum completion oracle.
7. Identify safety boundaries: Git, filesystem, network, production, app-store, external-send, user data, AI tools.
8. If external model/tool/org patterns are being absorbed, translate them through `rules/codex-surface-governance-standard.md` before creating lanes.
9. Map the task through `rules/role-lane-responsibility-standard.md` when product, engineering, fullstack, QA, security, SRE/Ops, AI/Agent, Git/GitHub, docs/rules, or release responsibility matters.
10. If Markdown, HTML, bridge queue, Codex, script/test, or review authority is crossing surfaces, apply `rules/authority-boundary-standard.md`.
11. If Judgment is the project Controller, apply `rules/controller-state-machine-standard.md` and name the current Controller state.
12. If the work is repeated, visible, automated, or loop-like, apply `rules/loop-engineering-standard.md` and identify the Judgment Controller's sees/decides/delegates/waits/stops fields.
13. If N agents, runtime cockpit, or interlocked testing is needed, map lanes into `rules/project-agent-topology-standard.md` nodes before dispatch.
14. Decide whether work can stay in the current thread or needs Git worktree isolation.
15. If worktrees are needed, identify branch owner, base ref, assigned path, setup commands, shared files, commit/push policy, force policy, integration owner, and cleanup policy before dispatch.
16. Split into lanes only where outputs have different owners or verification paths.
15. Define each lane's input, allowed actions, forbidden actions, output, verifier, and next receiver.
16. Define each lane's test/evidence node and downstream receiver. If no test/evidence node exists, the lane is not dispatch-ready.
17. Define whether each lane updates a durable ledger or reports evidence to the controller.
18. Decide whether `555` is required before, during, or after execution.
19. Return a compact plan first; include copy-ready packets only when useful.

## Lane Types

Use these lane names consistently:

### Common Lanes

- `Spec Lane`: requirements, acceptance criteria, non-goals, PRD-lite/GDD-lite.
- `Architecture Lane`: system design, interfaces, state/data model, technical risk.
- `Implementation Lane`: code or artifact creation within bounded files/modules.
- `Frontend Lane`: UI state, rendering, accessibility implementation, client tests, Browser-visible flows.
- `Backend Lane`: APIs, data model, persistence, auth enforcement, server workflows, backend tests.
- `Fullstack Lane`: narrow vertical slice across UI, API, data, tests, and user value, with explicit integration ownership.
- `Platform/DevOps Lane`: CI/CD, build/runtime setup, environments, deployments, infrastructure-as-code.
- `SRE/Ops Lane`: availability, latency, monitoring, rollback, incident response, postmortems, operational feedback.
- `QA Lane`: functional, regression, compatibility, performance, accessibility.
- `Security/Compliance Lane`: privacy, auth, permissions, sensitive data, policy, store review.
- `Data/Analytics Lane`: metrics, instrumentation, event definitions, data quality, experiment/readout evidence.
- `Release Lane`: release candidate, deploy/store submission, monitoring, rollback.
- `Ops Lane`: incident, support, data monitor, feedback loop, hotfix triage.
- `Docs/Rule Lane`: local rules, skills, handoff docs, runbooks, decision records.
- `AI/Agent Lane`: behavior contract, tool boundary, guardrails/evals, human approval, observability.
- `Git/Integration Lane`: branch/worktree ownership, conflict policy, merge path, review state, CI status, PR readiness.

### XA Group Mapping

- `XA-1`: Spec Lane + UX/QA/Data/Security scout.
- `XA-2`: Architecture Lane + Implementation Lane + DevOps + Security implementation.
- `XA-3`: QA Lane + Security/Compliance Lane + AI eval if relevant.
- `XA-4`: Release Lane.
- `XA-5`: Ops Lane.

### XB Group Mapping

- `XB-1`: core experience and GDD-lite.
- `XB-2`: prototype validation.
- `XB-3`: production pipeline.
- `XB-4`: content production.
- `XB-5`: stability/release gate.
- `XB-6`: LiveOps.

## When To Use 555

Recommend `555` when any of these are true:

- The user asks for five-agent, Core Challenger, adversarial review, red-team, milestone confidence, or release readiness.
- The task crosses backend/shared contracts, storage, schemas, validators, runners, permissions, or production behavior.
- The result is a milestone, architecture decision, release gate, app-store submission, production deploy, or done claim.
- AI/Agent behavior can affect files, users, external systems, production, payments, permissions, privacy, legal state, or destructive actions.
- Evidence is stale, contradictory, or mostly confidence language.

Do not recommend `555` when:

- A single-file docs update or tiny implementation is enough.
- The user only needs a first-pass work split.
- The missing step is simply defining acceptance criteria.

## Thread Strategy

Use current thread when:

- Work is narrow and can be finished with local edits/tests.
- There is no high context pressure.
- No specialized worker is needed.

Use worker thread when:

- A lane can be isolated with clear inputs, allowed files, forbidden actions, and verification.
- The current thread should remain controller.
- Implementation is larger than the main thread should hold.
- Parallel edits/tests in the same repo would be safer in a separate Git worktree.

Do not use worker threads as a substitute for integration design. If parallel lanes touch shared files, generated artifacts, lockfiles, migrations, registries, prompt catalogs, package manifests, release notes, ports, databases, browser profiles, or build output directories, serialize those files or assign one integration owner.

Use handoff when:

- Context pressure is high.
- The task will outlive the current thread.
- Important decisions or file states must be preserved before continuing.

Use `555` instead of ordinary worker split when:

- The worker result must be adversarially reviewed or evidence-verified before acceptance.

## Subtask Contract

Every subtask must include:

```text
subtask:
owner:
flow: XA / XB / general
gate: G0 / G1 / G2 / G3 / G4 / G5 / G6 / none
purpose:
inputs:
graph_node:
test_node:
evidence_nodes:
codex_surface:
source_pattern:
role_lane:
supporting_lanes:
agent_id:
delegation_tool:
conversation_surface:
conversation_open_target:
claim_level:
worktree:
branch:
base_ref:
setup_commands:
read_scope:
write_scope:
allowed_actions:
forbidden_actions:
allowed_git_actions:
forbidden_git_actions:
expected_output:
verification:
shared_files_policy:
commit_policy:
push_policy:
force_policy:
conflict_policy:
integration_owner:
cleanup_policy:
ledger_update:
independent_review:
security_review:
browser_flow:
downstream_receiver:
handoff_to:
done_when:
```

If any field is unknown, either infer conservatively or mark it as a blocker.

## Output Shape

Default output:

```text
工作拆分结论：
- 路由：
- 需求状态：clear / needs needs-solution-designer / discovery-only
- 当前 Gate：
- 拆分等级：D0 / D1 / D2 / D3 / D4 / D5
- 是否需要 555：
- 是否需要分线程：
- Ledger 策略：none / response-level / repo artifact / required before execution
- Loop readiness：no-loop / manual-first / skill-ready / loop-ready / blocked
- Judgment Controller：sees / decides / delegates-to / waits-for / stop-condition
- Independent review：none / named verifier / QA gate / 555
- Project topology：none / graph-required / html-required / agents-planned / agents-running / blocked
- Codex surface：none / prompt-thread / AGENTS / config-hook / rule / skill / plugin / connector-MCP / script / automation / Browser / Chrome / Computer Use / worktree / 555
- Role lane：none / product-spec / UX-design / frontend / backend / fullstack / platform-DevOps / SRE-Ops / QA / security / data / AI-Agent / Git-integration / docs-rule / release
- Security review：none / focused / Security Lane / 555 / user-decision / block
- Browser flow：none / required / QA Lane / verified / conditional / block
- 不做事项：
- 完成证据：

执行顺序：
1.
2.
3.

角色/小组：
- 小组：
  - 主责：
  - 协作：
  - 输入：
  - 输出：
  - 验收：
  - 交给：

风险和边界：
- 

下一步最小动作：
```

When copy-ready worker packets are needed:

```text
分线程指令：
线程动作：新开
指令发给：新线程
更名线程：
目标：
上下文：
允许：
禁止：
输入文件：
Graph node：
Test node：
Evidence nodes：
Codex surface：
Role lane：
Conversation surface：
输出要求：
验证命令：
Ledger 更新要求：
独立审查要求：
安全审查要求：
浏览器流程验证：
回报格式：
```

For Git worktree-backed worker packets, load `rules/git-worktree-standard.md` and include `controller_worktree`, `assigned_worktree`, `branch`, `base_ref`, `head_at_dispatch`, `merge_target`, `setup_commands`, `shared_files_policy`, `allowed_git_actions`, `forbidden_git_actions`, `verification_commands`, `commit_policy`, `cleanup_policy`, `push_policy`, `force_policy`, `conflict_policy`, and `integration_owner`.

## Forbidden

- Do not implement while the user is asking only how to split.
- Do not turn decomposition into broad research unless explicitly requested.
- Do not include market research, competitor research, advertising, or commercial sizing unless explicitly requested.
- Do not open `555` for every small task.
- Do not produce vague ownerless steps such as "optimize", "improve", or "handle later".
- Do not dispatch a lane without a graph node, test/evidence node, and downstream receiver when project topology is active.
- Do not import external model/tool/org patterns as lanes until they have a Codex surface and responsibility mapping.
- Do not assign a subtask without a verifier.
- Do not assign two writing workers to the same Git branch or worktree.
- Do not split parallel worker lanes without naming shared-file ownership and the integration receiver when shared files or semantic dependencies exist.
- Do not assign a lane that needs durable evidence without saying who records it and where it is recorded.
- Do not let the implementer be the only acceptance reviewer for milestone, release, AI/Agent safety, backend/shared-surface, or done claims.
- Do not split away auth, permission, payment, user-data, external-send, production, AI/Agent tool, or destructive-action work without a security review receiver.
- Do not split away web UI, local preview, design-to-code, screenshot/artifact, or interaction work without a Browser flow verifier when a browser target can exist.
- Do not allow a worker to publish, deploy, submit, send, delete, reset, or alter user/production data without explicit authorization.
- Do not allow a worker to force-add, prune, remove, reset, rebase, delete, or rename worktree-owned branches without explicit authorization and live worktree status.
