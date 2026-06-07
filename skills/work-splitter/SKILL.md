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
- `XA/XB`: product/game development standards in `/Users/buyu/.codex/rules/xa-xb-standard.md`.

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
8. Decide whether work can stay in the current thread.
9. Split into lanes only where outputs have different owners or verification paths.
10. Define each lane's input, allowed actions, forbidden actions, output, verifier, and next receiver.
11. Decide whether `555` is required before, during, or after execution.
12. Return a compact plan first; include copy-ready packets only when useful.

## Lane Types

Use these lane names consistently:

### Common Lanes

- `Spec Lane`: requirements, acceptance criteria, non-goals, PRD-lite/GDD-lite.
- `Architecture Lane`: system design, interfaces, state/data model, technical risk.
- `Implementation Lane`: code or artifact creation within bounded files/modules.
- `QA Lane`: functional, regression, compatibility, performance, accessibility.
- `Security/Compliance Lane`: privacy, auth, permissions, sensitive data, policy, store review.
- `Release Lane`: release candidate, deploy/store submission, monitoring, rollback.
- `Ops Lane`: incident, support, data monitor, feedback loop, hotfix triage.
- `Docs/Rule Lane`: local rules, skills, handoff docs, runbooks, decision records.
- `AI/Agent Lane`: behavior contract, tool boundary, guardrails/evals, human approval, observability.

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
allowed_actions:
forbidden_actions:
expected_output:
verification:
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
输出要求：
验证命令：
回报格式：
```

## Forbidden

- Do not implement while the user is asking only how to split.
- Do not turn decomposition into broad research unless explicitly requested.
- Do not include market research, competitor research, advertising, or commercial sizing unless explicitly requested.
- Do not open `555` for every small task.
- Do not produce vague ownerless steps such as "optimize", "improve", or "handle later".
- Do not assign a subtask without a verifier.
- Do not allow a worker to publish, deploy, submit, send, delete, reset, or alter user/production data without explicit authorization.
