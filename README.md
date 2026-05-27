# Judgment Skills Pack

This repository contains general Codex project workflow governance skills. It keeps routing, five-agent review, evidence checks, and dirty-worktree safety under version control for use across projects.

## 中文说明

这个仓库现在是一个通用 Codex 项目双技能包：

- `666`：上游工作流路由器。负责判断当前 Codex 项目任务应该直接回答、只读锚定、调用专用技能、启用审计者、启用核心质疑者、升级到 `555`，还是生成跨线程调度指令。
- `555`：下游五代理闭环。负责重大任务、对抗审查、后端委派、证据验证、progress-watch 升级、上下文压力保护和 release confidence 审查。

两者互补，但运行时保持独立。`666` 不复制 `555` 的全文，也不默认启动 `555`；它只在证据和任务风险达到升级条件时调用 `555`。

### 适合使用的场景

使用 `666`：

- 需要在多个项目仓库、线程、gate 或工作面之间选择推进路线。
- 用户明确提到 `666`、技能融合、工作流提效、封装工作流、总控路由、如何推进。
- 需要判断是否启动 `555`、Core Challenger、Audit Specialist、automation、handoff 或 worker thread。
- progress-watch 或审查发现 stale evidence、dirty drift、owner blocker、真实 Git 状态冲突。
- 线程上下文压力升高，用户提到上下文高、背景信息高、压缩、接力、切线程、7.5/10、70% 或 75%。

使用 `555`：

- 用户明确提到五代理、五代理闭环、对抗审查、红队、Core Challenger、后端代码委派、总控分线程。
- 重大验收、release confidence、done claim、架构方向判断需要完整证据闭环。
- 任务跨 runtime、contracts、storage、schemas、validators、artifacts 或多仓库。
- 需要读写分离的后端委派、二轮裁定、证据验证和最终收口。

### 它如何提效

- 先锚定真实 Git / 文件 / gate 状态，再决定是否行动。
- `666` 默认选择最小执行层级，避免小任务被包装成重流程。
- `555` 在确有必要时提供完整的五席闭环和证据验证。
- Core Challenger、Audit Specialist、handoff、runtime repair、contract gate 等能力按需组合。
- 高上下文时先生成 checkpoint / handoff，再决定是否继续或切线程。
- 在 dirty worktree 中先做 ownership 判断，防止误清理、误提交、误覆盖其他线程或用户改动。

### 上下文压力保护

`666` 和 `555` 不假设自己能控制平台压缩。它们的职责是在压缩或接力前保护连续性：

- `C0 normal`：正常推进。
- `C1 elevated`：保持任务窄，不主动开长任务。
- `C2 high`：先输出 checkpoint / handoff，再继续。
- `C3 critical`：停止新任务，只报告运行状态并生成接力包。

接力包必须包含当前目标、workspace、branch/HEAD/dirty、已完成、未完成、命令/测试结果、约束、风险、下一步，并提醒下一线程以 live Git / file state 为准。

### 安装路径

推荐从子目录安装：

```text
skills/666
skills/555
```

当前仓库根目录也保留了一个兼容入口：

```text
SKILL.md
agents/openai.yaml
```

根目录入口等同于 `666`，用于兼容早期单技能安装方式。后续标准路径以 `skills/666` 和 `skills/555` 为准。

### 本机当前安装

本机全局安装路径：

```text
C:\Users\Administrator\.codex\skills\666\SKILL.md
C:\Users\Administrator\.codex\skills\555\SKILL.md
```

Git 源仓库：

```text
E:\codex\codex-skill-666
```

更新后通常需要重启 Codex 或新开线程，才能让技能列表重新加载。

## English

This repository is now a general Codex project two-skill pack:

- `666`: upstream workflow router. It decides whether a Codex project task should be answered directly, anchored read-only, routed to a narrow skill, sent to an auditor, challenged by Core Challenger behavior, escalated to `555`, or dispatched across threads.
- `555`: downstream five-agent execution loop. It handles major tasks, adversarial review, backend delegation, evidence verification, progress-watch escalation, context-pressure protection, and release-confidence review.

They are designed to work together while staying independent at runtime. `666` does not inline `555` and does not run it by default. It escalates only when the task evidence and risk justify the heavier loop.

### When to use it

Use `666` when:

- A task spans multiple project repositories, threads, gates, or workstreams.
- The user explicitly mentions `666`, skill fusion, workflow efficiency, workflow packaging, routing, or how to proceed.
- The task needs a decision about whether to use `555`, Core Challenger, Audit Specialist, automation, handoff, or worker threads.
- A progress watch or review exposes stale evidence, dirty drift, owner blockers, or contradictions in live Git state.
- The thread has high context pressure, prior compaction, or a handoff/new-thread request.

Use `555` when:

- The user explicitly asks for five-agent flow, adversarial review, red-team review, Core Challenger review, backend delegation, or controller-to-worker routing.
- A milestone, release-confidence claim, done claim, architecture direction, or acceptance decision needs a full evidence loop.
- The task crosses runtime, contracts, storage, schemas, validators, artifacts, or multiple repositories.
- Backend delegation, second-round adjudication, evidence verification, and final closure are required.

### What it improves

- Anchors the task to live Git, file state, and gate boundaries before acting.
- Uses `666` to choose the smallest execution level, so small tasks do not trigger heavyweight workflows.
- Uses `555` only when the evidence supports a full five-agent loop.
- Composes Core Challenger, Audit Specialist, handoff, runtime repair, and contract gates only when needed.
- Produces a checkpoint or handoff before large work when context pressure is high.
- Adds a dirty-worktree ownership checkpoint before cleanup, commit, reset, packaging, or sync actions.

### Context Pressure Guard

The skills do not control platform-level compaction. They protect continuity before compaction or thread transfer:

- `C0 normal`: continue normally.
- `C1 elevated`: keep scope narrow.
- `C2 high`: produce a checkpoint or handoff before continuing.
- `C3 critical`: stop starting new work, report running command state, and generate a handoff.

The handoff must include goal, workspace, branch/HEAD/dirty state, completed work, unfinished work, commands/tests, constraints, risks, next gate, and a reminder to trust live Git/file state over the packet.

## Repository Layout

```text
README.md
SKILL.md                      # Compatibility entrypoint, same role as skills/666
agents/openai.yaml            # Compatibility UI metadata for root 666 entrypoint
skills/
  666/
    SKILL.md                  # Codex project workflow router
    agents/openai.yaml
  555/
    SKILL.md                  # Codex project five-agent evidence loop
    agents/openai.yaml
```

## Install Paths

```text
skills/666
skills/555
```

## Current Scope

The runtime skill logic stays in each `SKILL.md`. The README and `agents/openai.yaml` files are for GitHub presentation and UI metadata.
