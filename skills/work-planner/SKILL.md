---
name: "work-planner"
description: Complete Codex work planning skill that combines needs clarification, Codex Plan mode alignment, work-splitter decomposition, XA/XB gates, thread strategy, and 555 escalation decisions. Use when the user starts a message with / for planning, or says 计划模式, 需求分析, 需求解析, 需求澄清, 工作拆分, 拆任务, 开发计划, 开发线路, 如何推进, 先规划, 先拆一下, or asks to turn a fuzzy product/game/AI idea into an execution-ready Codex plan.
---

# work-planner

## Purpose

Use `work-planner` as the complete planning entrypoint before execution.

It answers:

```text
What does the user really want, is the need clear enough, how does this map to Codex Plan mode, how should the work be split, and what should happen next?
```

This skill combines three layers:

1. `needs-solution-designer`: clarify fuzzy needs and stabilize the solution blueprint.
2. Codex Plan mode alignment: collect unresolved choices, avoid premature execution, and produce an approval-ready plan.
3. `work-splitter`: split the confirmed work into lanes, Agent groups, gates, thread strategy, and 555 escalation packets.
4. Durable evidence planning: decide whether `rules/durable-evidence-ledger-standard.md` is needed for long-running work, worker reports, QA gates, or release/milestone closure.
5. Tool portfolio planning: decide whether the task needs an existing tool, an extended skill, a new skill, a plugin, an MCP/connector, a script, an automation, or no install.
6. Security and browser-flow planning: decide whether `rules/security-review-standard.md` or `rules/browser-flow-testing-standard.md` must be part of the execution gate.

It does not replace:

- `666`: the upstream router that decides whether this planning skill is needed.
- `555`: the evidence and adversarial assurance loop for high-risk milestones.
- `XA/XB`: the development standards in `~/.codex/rules/xa-xb-standard.md`.
- `rules/durable-evidence-ledger-standard.md`: the lightweight evidence ledger standard for long tasks and acceptance decisions.
- `rules/tool-portfolio-standard.md`: the local standard for plugin, skill, MCP/connector, script, automation, and no-install decisions.
- `rules/security-review-standard.md`: the lightweight threat-model standard for sensitive or side-effecting work.
- `rules/browser-flow-testing-standard.md`: the Browser-visible verification standard for web UI and interactive artifacts.
- `rules/skill-quality-standard.md`: the local standard for creating, splitting, auditing, or improving skills.

## Trigger Policy

Strong trigger:

- User starts a message with `/` and the message is not a clearly built-in Codex slash command. Treat the text after `/` as a `work-planner` request.
- User says 计划模式, 需求分析, 需求解析, 需求澄清, 工作拆分, 拆任务, 分工, 编组, 开发计划, 开发线路, 如何推进, 先规划, 先拆一下.
- User has a fuzzy product/game/AI/workflow idea and wants a reliable path before implementation.
- User asks to align a workflow with Codex Plan mode.
- User asks to decide what should be handled in current thread, worker threads, QA/audit, or 555.
- User asks to combine requirement analysis and work splitting into one complete skill or plugin.

Medium trigger:

- The request contains both "what should we build" and "how should we execute".
- The task crosses product/spec, design, engineering, QA, security, release, ops, AI/Agent, or docs/rules.
- The user is likely to benefit from a Plan-mode-style preflight before file edits.

Do not trigger for:

- A clearly scoped implementation request with obvious acceptance criteria and no decomposition need.
- A pure code review where 555 or normal review is already the right tool.
- A trivial command or one-line answer.

## Codex Plan Mode Alignment

Treat Codex Plan mode as the planning surface for unresolved choices, route selection, and user approval before execution.

Plan-mode-compatible behavior:

- Stay read-only unless the user explicitly opens an execution gate.
- Clarify only material missing choices that change the plan.
- Prefer 1-3 focused questions, not broad interviews.
- When `request_user_input` is available, use it for short mutually exclusive choices.
- When `request_user_input` is unavailable, ask concise plain-text questions instead.
- Do not force the user to switch modes; support the current mode and disclose assumptions.
- Do not use Plan mode as an excuse to stall when a conservative default is safe.
- Produce a plan that can be accepted, corrected, decomposed, or handed off.

Plan mode is best for:

- fuzzy need clarification;
- choosing XA or XB;
- choosing current thread vs worker thread vs 555;
- setting non-goals and forbidden actions;
- deciding whether implementation is allowed;
- selecting a completion oracle.

Plan mode is not enough for:

- release readiness;
- production deploy;
- app-store submission;
- destructive operations;
- AI/Agent external side effects;
- milestone confidence;
- claims that need evidence verification.

Those require `555` or explicit execution approval.

## Complete Planning Pipeline

Run the smallest sufficient pipeline.

```text
P0 Intake
  -> P1 Need clarity check
  -> P2 Plan-mode preflight
  -> P3 Work split
  -> P4 Ledger / review preflight
  -> P5 Route to execution / worker / 555
  -> P6 Evidence and next gate
```

When planning a skill or plugin improvement, add this gate:

```text
Skill quality gate
  -> primary category
  -> tool form: skill / plugin / MCP-connector / script / automation / no-install
  -> trigger clarity
  -> progressive disclosure
  -> scripts/templates/references needed
  -> gotchas and forbidden actions
  -> verification that can fail
```

When the user asks what to install, use, package, or evolve, add this gate:

```text
Tool portfolio gate
  -> existing coverage
  -> source trust
  -> permissions and side effects
  -> freshness evidence
  -> use existing / extend / install / package / skip
```

When planning web/UI or sensitive side-effecting work, add this gate:

```text
Safety and browser gate
  -> security review: none / focused / 555 / user-decision / block
  -> browser flow: none / required / verified / conditional / block
  -> evidence needed before done
```

### P0 Intake

Identify:

- raw user goal;
- target artifact or project;
- whether the task is XA, XB, or general;
- whether AI/Agent behavior is involved;
- whether the work may outlive the current thread or need durable evidence;
- whether the request is really a tool-selection or tool-packaging decision;
- whether auth, permissions, payments, user data, external-send, production, or destructive actions require a security gate;
- whether web UI, local preview, artifact, screenshot, Figma/design-to-code, or interaction work requires a Browser flow gate;
- whether the user wants planning only or execution after planning.

### P1 Need Clarity Check

Use `needs-solution-designer` when:

- the need cannot be restated in plain language;
- target user, success signal, scope, or must-not-haves are unclear;
- the user does not know whether the answer is a skill, agent, workflow, plugin, or implementation;
- reuse vs adaptation vs new build is unresolved.

Do not proceed to work splitting if the need is still unstable, except for a discovery-only split.

### P2 Plan-Mode Preflight

For material unresolved choices, ask:

- What outcome must v1 prove?
- What is explicitly out of scope?
- Should this stay as planning, or may Codex edit files after the plan?

If the user already gave enough information, state assumptions and continue.

### P3 Work Split

Use `work-splitter` when:

- the need is clear enough to execute;
- multiple lanes or owners exist;
- QA/audit/release/ops should be separate gates;
- thread strategy or worker packets are needed.

### P4 Ledger / Review Preflight

Decide whether the plan needs a durable evidence ledger before execution.

Require it when:

- the work is long-running, repeated, or likely to cross context windows;
- multiple worker lanes will report evidence;
- release, milestone, done, QA, or `go / conditional go / no-go` claims are expected;
- temporary harnesses, generated artifacts, or cleanup decisions need tracking.

Also decide whether acceptance needs independent review:

- no independent review for tiny low-risk planning or docs-only tasks;
- named verifier, QA lane, or `555` for higher-risk work;
- `555` for release/milestone/backend/shared-surface/AI safety claims.

### P5 Route to Execution / Worker / 555

Route after splitting:

- current thread for narrow execution;
- worker thread for bounded lane work;
- `555` for milestone, release, backend/shared surface, architecture, AI/Agent safety, adversarial review, or evidence closure;
- stay planning-only if the user has not opened execution.

### P6 Evidence and Next Gate

End with:

- current gate;
- next smallest action;
- evidence required for completion;
- ledger requirement and location, or why no ledger is needed;
- independent review requirement, or why self-review is enough;
- tool portfolio decision, or why no new tool is needed;
- security review requirement, or why it is not applicable;
- browser flow requirement, or why it is not applicable;
- what is not yet authorized;
- next receiver.

## Comparison: Plan Mode, Needs Designer, Work Splitter, 666, 555

| Layer | Main Job | Use When | Output | Stops Before |
|---|---|---|---|---|
| Codex Plan mode | collect choices and produce a non-mutating plan | user needs planning/approval before edits | plan, questions, assumptions | implementation, release, destructive action |
| `needs-solution-designer` | clarify fuzzy need and solution shape | need is not stable enough to restate | confirmed need, assumptions, reuse decision, solution blueprint | work split and implementation |
| `work-splitter` | split clear work into lanes and contracts | need is clear enough but execution is broad | lanes, gates, owners, thread strategy, subtask contracts | actual implementation |
| `666` | route skills and workflow level | decide which skill/gate/route is needed | routing decision | doing heavy assurance itself |
| `555` | adversarial assurance and evidence closure | milestone, release, backend/shared surface, AI safety, done claim | go/conditional go/no-go, evidence verdict | unbounded scope expansion |

## Needs Designer vs Work Splitter Boundary

Use this decision:

```text
If the question is "what do I actually need?" -> needs-solution-designer.
If the question is "how should this already-understood work be divided?" -> work-splitter.
If the question is both -> work-planner.
```

Detailed boundary:

| Question | Skill |
|---|---|
| What is the real problem? | needs-solution-designer |
| Who is this for? | needs-solution-designer |
| What does success look like? | needs-solution-designer |
| Should we reuse, adapt, or build new? | needs-solution-designer |
| What is the v1 scope? | needs-solution-designer first, then work-splitter |
| Which lanes and owners are needed? | work-splitter |
| Which XA/XB gate are we in? | work-splitter |
| Which work can run in parallel? | work-splitter |
| Should this go to worker thread or 555? | work-splitter |
| Is release/done claim trustworthy? | 555 |

## Output Shape

Default:

```text
完整规划结论：
- 需求状态：fuzzy / clear-enough / confirmed
- Codex Plan mode 对齐：planning-only / plan-then-execute / execution-open
- 路由：XA / XB / general
- 当前 Gate：G0 / G1 / G2 / G3 / G4 / G5 / G6 / none
- 是否需要 needs-solution-designer：
- 是否需要 work-splitter：
- 是否需要 555：
- 是否需要分线程：
- Durable ledger：none / response-level / repo artifact / required before execution
- Independent review：none / named verifier / QA gate / 555
- Tool portfolio：none / use-existing / extend-existing / install / package / skip
- Security review：none / focused / 555 / user-decision / block
- Browser flow：none / required / verified / conditional / block
- 不做事项：
- 完成证据：

需求解析：
- 当前理解：
- 已确认：
- 工作假设：
- 未确认：

计划模式决策：
- 需要用户选择：
- 默认假设：
- 执行授权状态：

工作拆分：
- 执行顺序：
- 角色/小组：
- 子任务契约：

下一步最小动作：
```

When the need is too fuzzy:

```text
需求还不适合拆工：
- 当前理解：
- 主要不确定点：
- 为什么现在拆会失真：
- 只问一个最关键问题：
```

When ready for execution:

```text
执行准备完成：
- 当前线程任务：
- 可分线程任务：
- 需要 555 的节点：
- Ledger / review gate：
- 允许动作：
- 禁止动作：
- 第一条执行命令/编辑/检查：
```

## Forbidden

- Do not jump from fuzzy need directly to implementation.
- Do not split work from hidden assumptions.
- Do not force Plan mode if a concise plain-text question is enough.
- Do not call `555` for every planning task.
- Do not let `needs-solution-designer` keep asking forever when the remaining uncertainty is narrow and a bounded plan is safe.
- Do not let `work-splitter` create ownerless lanes without verification.
- Do not publish, deploy, submit, delete, reset, send, or touch production/user data from planning.
