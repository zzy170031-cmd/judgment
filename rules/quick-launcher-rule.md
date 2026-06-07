# Quick Launcher Rule

Use this rule to make the workflow pack easy to call without remembering skill
names.

## Purpose

The user should not need to know whether to call `666`, `work-planner`,
`needs-solution-designer`, `work-splitter`, or `555`.

When the user gives a short launcher phrase, choose the smallest useful route
and say the routing decision briefly before continuing.

## Manual Shortcuts

```text
/      -> open Work Planner routing for the following text
/p     -> planning: use work-planner
/plan  -> planning: use work-planner
/n     -> need clarity: use needs-solution-designer
/need  -> need clarity: use needs-solution-designer
/d     -> decomposition: use work-splitter when the need is clear
/split -> decomposition: use work-splitter when the need is clear
/r     -> review/readiness: use 666 first, escalate to 555 only if risk justifies it
/555   -> use 555 only for explicit assurance, adversarial review, audit, release readiness, or evidence closure
/666   -> use 666 router
```

Chinese equivalents:

```text
/规划 -> work-planner
/计划 -> work-planner
/需求 -> needs-solution-designer
/拆工 -> work-splitter
/拆分 -> work-splitter
/审查 -> 666 first, then 555 if justified
/上线 -> 666 first, then 555 if release-readiness evidence is needed
```

## Auto-Use Phrases

If the user does not use `/`, still route automatically:

| User wording | Route |
|---|---|
| 规划一下, 计划一下, 怎么推进, 怎么做, 开发线路, 先梳理 | `work-planner` |
| 需求看下, 需求分析, 需求解析, 真实需求, 这个想法, 要不要做 | `needs-solution-designer` or `work-planner` if decomposition is also needed |
| 拆一下, 拆任务, 拆工, 分工, 编组, 子任务, 分线程 | `work-splitter` if clear, otherwise `work-planner` |
| 审一下, 检查一下, 是否完成, 是否 ready, 上线前, 对抗审查 | `666`, then `555` only for milestone/release/safety/evidence risk |
| 我不知道该用哪个, 帮我判断怎么用, 应该走哪个流程 | `666` |

## Response Shape

Keep the routing notice short:

```text
自动路由：<skill>
原因：<one short reason>
下一步：<question / plan / split / check>
```

If the next action is obvious and safe, continue after this notice. Do not stop
just to ask the user to name a skill.

## Boundaries

- Do not treat shortcut use as execution approval.
- Do not call `555` just because the user says 审一下; use `666` first unless the request is clearly high-risk.
- Do not execute shell commands, push, deploy, delete, publish, or touch external systems from a launcher phrase alone.
- When a phrase could mean either need clarification or decomposition, prefer `work-planner`.
- If the request is a trivial command, direct answer, or explicitly names a narrower tool, do not force this rule.
