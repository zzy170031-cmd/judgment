# 666 - Hope Workflow Router

## 中文说明

`666` 是一个 Hope 工作流提效总控技能。它不直接替代任何已有技能，而是在任务开始时判断应该使用哪个最小可行路径：直接回答、只读锚定、调用单一专用技能、启用核心质疑者、启用审计者、升级到 `555` 五代理闭环，或生成跨线程调度指令。

### 适合使用的场景

- 需要在多个 Hope 仓库、线程、gate 或工作面之间选择推进路线。
- 用户明确提到 `666`、技能融合、工作流提效、封装工作流、总控路由、如何推进。
- 需要判断是否启动 `555`、Core Challenger、Audit Specialist、automation、handoff 或 worker thread。
- progress-watch 或审查发现 stale evidence、dirty drift、owner blocker、真实 Git 状态冲突。
- 重大验收、release confidence、done claim、架构方向判断需要先做证据路由。

### 它如何提效

- 先锚定真实 Git / 文件 / gate 状态，再决定是否行动。
- 默认选择最小执行层级，避免小任务被包装成重流程。
- 把 Core Challenger、Audit Specialist、`555`、handoff、runtime repair、contract gate 等能力按需组合。
- 在 dirty worktree 中先做 ownership 判断，防止误清理、误提交、误覆盖其他线程或用户改动。

### 与 `555` 的关系

`666` 是上游路由器，负责判断要不要升级；`555` 是下游五代理闭环，负责在重大任务、对抗审查、后端委派、release confidence 等场景中执行完整治理流程。

### 本机安装

本机全局安装路径：

```text
C:\Users\Administrator\.codex\skills\666\SKILL.md
```

Git 源仓库：

```text
E:\codex\codex-skill-666
```

更新后通常需要重启 Codex 或新开线程，才能让技能列表重新加载。

## English

`666` is a Hope workflow efficiency router. It does not replace existing skills. Instead, it decides the smallest useful route before the task becomes heavy: answer directly, anchor live Git state, use one focused skill, invoke Core Challenger behavior, invoke Audit Specialist behavior, escalate to the `555` five-agent loop, or prepare cross-thread dispatch.

### When to use it

- A task spans multiple Hope repositories, threads, gates, or workstreams.
- The user explicitly mentions `666`, skill fusion, workflow efficiency, workflow packaging, routing, or how to proceed.
- The task needs a decision about whether to use `555`, Core Challenger, Audit Specialist, automation, handoff, or worker threads.
- A progress watch or review exposes stale evidence, dirty drift, owner blockers, or contradictions in live Git state.
- A milestone, release-confidence claim, done claim, architecture direction, or acceptance decision needs evidence-based routing first.

### What it improves

- Anchors the task to live Git, file state, and gate boundaries before acting.
- Chooses the smallest execution level by default, so small tasks do not trigger heavyweight workflows.
- Composes existing capabilities such as Core Challenger, Audit Specialist, `555`, handoff, runtime repair, and contract gates only when needed.
- Adds a dirty-worktree ownership checkpoint before cleanup, commit, reset, packaging, or sync actions.

### Relationship with `555`

`666` is the upstream router. It decides whether escalation is necessary. `555` is the downstream closed-loop execution mode for major work, adversarial review, backend delegation, and release-confidence decisions.

## Repository Layout

```text
SKILL.md             # Installable Codex skill entrypoint
README.md            # Bilingual repository description
agents/openai.yaml   # UI-facing skill metadata
```

## Current Scope

This repository is intentionally small. The runtime skill logic lives in `SKILL.md`; the README exists for GitHub presentation and human review.
