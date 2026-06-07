# Judgment Skills Pack

This repository contains general Codex project workflow governance skills and local plugin sources. It keeps routing, work decomposition, five-agent review, XA/XB development gates, AI/Agent safety rules, evidence checks, and dirty-worktree safety under version control for use across projects.

## 中文说明

这个仓库现在是一个通用 Codex 项目工作流治理包：

- `666`：上游工作流路由器。负责判断当前 Codex 项目任务应该直接回答、只读锚定、调用专用技能、启用审计者、启用核心质疑者、升级到 `555`、生成跨线程调度指令，还是评估重复工作是否值得封装。
- `slash-work-planner`：`/` 启动器。负责把 `/...` 形式的输入规范化，然后转交给 `work-planner`、`666` 或必要时的 `555`。
- `work-planner`：完整的计划入口。负责把前期需求解析、Codex Plan mode 对齐、拆工、XA/XB Gate、分线程策略和 555 升级判断串成一条稳定链路。
- `needs-solution-designer`：需求分析/需求解析智能体。负责把模糊想法、客户需求或流程痛点澄清成已确认事实、工作假设、复用判断和方案蓝图。
- `work-splitter`：工作拆分智能体。负责把已澄清的任务拆成执行线路、Agent 小组、子任务契约、分线程策略和 555 升级判断。
- `555`：下游五代理闭环。负责重大任务、对抗审查、后端委派、证据验证、progress-watch 升级、上下文压力保护和 release confidence 审查。
- `rules/xa-xb-standard.md`：XA/XB AI-assisted development 本地标准，定义非游戏产品和游戏产品从开发、测试、发布到运营反馈的统一 Gate。
- `plugins/work-splitter`：`work-splitter` 的本地插件源码，包含 `.codex-plugin/plugin.json`。

这些资产互补，但运行时保持独立。`666` 不复制 `555` 的全文，也不默认启动 `555`；它会在需要完整规划时路由到 `work-planner`，由 `work-planner` 判断是否需要 `needs-solution-designer` 或 `work-splitter`，并在证据和任务风险达到升级条件时调用 `555`。

### 适合使用的场景

使用 `666`：

- 需要在多个项目仓库、线程、gate 或工作面之间选择推进路线。
- 用户明确提到 `666`、技能融合、工作流提效、封装工作流、总控路由、如何推进。
- 需要判断是否启动 `555`、Core Challenger、Audit Specialist、automation、handoff 或 worker thread。
- progress-watch 或审查发现 stale evidence、dirty drift、owner blocker、真实 Git 状态冲突。
- 线程上下文压力升高，用户提到上下文高、背景信息高、压缩、接力、切线程、7.5/10、70% 或 75%。
- 用户询问重复流程是否值得封装为 skill、automation、subagent，或是否应该扩展现有资产。

使用 `work-planner`：

- 用户用 `/` 开头发起规划，例如 `/我要做一个产品，先帮我规划开发线路`。
- 用户明确提到计划模式、需求分析、需求解析、需求澄清、工作拆分、拆任务、开发计划、开发线路、如何推进。
- 一个任务同时包含“需求还没完全清楚”和“需要拆成执行线路”。
- 需要把用户想法对齐到 Codex Plan mode，再决定是否进入实现、分线程或 555。

使用 `slash-work-planner`：

- 用户输入 `/`、`/plan`、`/work`、`/work-planner`、`/规划`、`/计划`、`/需求`、`/拆工`、`/666` 或自然语言 `/...`。
- `/` 后没有内容时，只追问要规划或拆分什么任务。
- `/666` 转到 `666`，`/555` 只在明确要求审计、对抗审查、上线信心或证据闭环时转到 `555`。

使用 `needs-solution-designer`：

- 用户有模糊想法、客户需求、流程痛点，但还不能稳定复述目标、范围、优先级和成功标准。
- 需要判断复用现有 skill、轻改现有 skill、新建 skill/agent，还是保持简单流程。

使用 `work-splitter`：

- 用户明确提到工作拆分、拆任务、拆工、分工、编组、任务切分、子任务、分线程、开发线路、如何拆。
- 一个任务同时涉及产品、技术、QA、安全、发布、运营、AI/Agent 或多个线程。
- 需要判断哪些工作留在当前线程，哪些应该分线程，哪些应该进入 555。
- 需要把一个大技能、大流程或大目标拆成更窄的可执行资产。

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
- 先用证据筛选封装候选，只创建高置信、窄范围、可验证的缺失资产。
- 在 dirty worktree 中先做 ownership 判断，防止误清理、误提交、误覆盖其他线程或用户改动。

### 上下文压力保护

`666` 和 `555` 不假设自己能控制平台压缩。它们的职责是在压缩或接力前保护连续性：

- `C0 normal`：正常推进。
- `C1 elevated`：保持任务窄，不主动开长任务。
- `C2 high`：先输出 checkpoint / handoff，再继续。
- `C3 critical`：停止新任务，只报告运行状态并生成接力包。

接力包必须包含当前目标、workspace、branch/HEAD/dirty、已完成、未完成、命令/测试结果、约束、风险、下一步，并提醒下一线程以 live Git / file state 为准。

### 封装候选评估

`666` 在用户询问“是否可以进化/封装/自动化”时先输出候选短名单，而不是直接创建新资产。

行动标准：

- 至少出现两次，或明确会复发且重复成本高。
- 输入稳定、步骤可复现、输出或停止条件清晰。
- 能明显提升速度、质量、一致性或可靠性。
- 现有技能、自动化、子代理、规则或脚本没有充分覆盖。

最小形式：

- `Skill`：可复用流程或 playbook。
- `Automation`：周期检查、报告、提醒或监控。
- `Subagent`：边界明确的专家角色或调查任务。
- `Extend existing`：扩展现有技能、自动化、脚本或规则。
- `Skip`：一次性、模糊、敏感、证据不足或已有覆盖。

### 安装路径

推荐从子目录安装：

```text
skills/666
skills/slash-work-planner
skills/work-planner
skills/needs-solution-designer
skills/work-splitter
skills/555
```

当前仓库根目录也保留了一个兼容入口：

```text
SKILL.md
agents/openai.yaml
```

根目录入口等同于 `666`，用于兼容早期单技能安装方式。后续标准路径以 `skills/666` 和 `skills/555` 为准。

### 本机当前安装

本机 macOS 全局安装路径：

```text
/Users/buyu/.codex/skills/666/SKILL.md
/Users/buyu/.codex/skills/work-planner/SKILL.md
/Users/buyu/.codex/skills/needs-solution-designer/SKILL.md
/Users/buyu/.codex/skills/work-splitter/SKILL.md
/Users/buyu/.codex/skills/555/SKILL.md
/Users/buyu/.codex/rules/xa-xb-standard.md
```

Git 源仓库：

```text
/Users/buyu/Documents/Codex/judgment
```

更新后通常需要重启 Codex 或新开线程，才能让技能列表重新加载。

## English

This repository is now a general Codex project workflow governance pack:

- `666`: upstream workflow router. It decides whether a Codex project task should be answered directly, anchored read-only, routed to a narrow skill, sent to an auditor, challenged by Core Challenger behavior, escalated to `555`, dispatched across threads, or evaluated as a packaging candidate.
- `work-planner`: complete planning entrypoint. It aligns needs clarification, Codex Plan mode, decomposition, XA/XB gates, thread strategy, and 555 escalation decisions.
- `needs-solution-designer`: needs clarification and solution-shaping agent. It turns fuzzy ideas into confirmed facts, assumptions, reuse decisions, and solution blueprints.
- `work-splitter`: dedicated decomposition agent. It turns clear large work into XA/XB gates, lanes, Agent groups, subtask contracts, thread strategy, and 555 escalation decisions.
- `555`: downstream five-agent execution loop. It handles major tasks, adversarial review, backend delegation, evidence verification, progress-watch escalation, context-pressure protection, and release-confidence review.
- `rules/xa-xb-standard.md`: local XA/XB AI-assisted development standard.
- `plugins/work-splitter`: local plugin source for `work-splitter`, including `.codex-plugin/plugin.json`.

They are designed to work together while staying independent at runtime. `666` routes, `work-planner` plans the full path, `needs-solution-designer` clarifies fuzzy needs, `work-splitter` decomposes clear work, XA/XB defines the development gates, and `555` provides evidence assurance when risk justifies the heavier loop.

### When to use it

Use `666` when:

- A task spans multiple project repositories, threads, gates, or workstreams.
- The user explicitly mentions `666`, skill fusion, workflow efficiency, workflow packaging, routing, or how to proceed.
- The task needs a decision about whether to use `555`, Core Challenger, Audit Specialist, automation, handoff, or worker threads.
- A progress watch or review exposes stale evidence, dirty drift, owner blockers, or contradictions in live Git state.
- The thread has high context pressure, prior compaction, or a handoff/new-thread request.
- The user asks whether repeated work should become a skill, automation, subagent, extension, or skip.

Use `work-planner` when:

- The user asks for Plan mode alignment, needs analysis, work splitting, development lines, or how to proceed.
- The task is fuzzy enough to need clarification and broad enough to need decomposition.

Use `needs-solution-designer` when:

- The real need, success criteria, scope, or reuse/adapt/build decision is unclear.

Use `work-splitter` when:

- The user asks how to split, assign, sequence, or thread work.
- A task spans multiple lanes such as product/spec, architecture, implementation, QA, release, ops, docs, or AI/Agent safety.
- A large skill/rule/process needs to be modularized before implementation.

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
- Filters packaging candidates by evidence before creating or extending assets.
- Adds a dirty-worktree ownership checkpoint before cleanup, commit, reset, packaging, or sync actions.

### Context Pressure Guard

The skills do not control platform-level compaction. They protect continuity before compaction or thread transfer:

- `C0 normal`: continue normally.
- `C1 elevated`: keep scope narrow.
- `C2 high`: produce a checkpoint or handoff before continuing.
- `C3 critical`: stop starting new work, report running command state, and generate a handoff.

The handoff must include goal, workspace, branch/HEAD/dirty state, completed work, unfinished work, commands/tests, constraints, risks, next gate, and a reminder to trust live Git/file state over the packet.

### Packaging Candidate Gate

When the user asks whether a workflow can be evolved, packaged, automated, or delegated, `666` first produces a compact shortlist instead of creating new assets immediately.

Act only when the candidate:

- occurred at least twice, or is clearly likely to recur and costly to repeat;
- has stable inputs, repeatable steps, and a clear output or stopping condition;
- materially improves speed, quality, consistency, or reliability;
- is not already adequately covered.

Choose the smallest form: `Skill`, `Automation`, `Subagent`, `Extend existing`, or `Skip`.

## Repository Layout

```text
README.md
AGENTS.md                       # Local global-rule snapshot
SKILL.md                      # Compatibility entrypoint, same role as skills/666
agents/openai.yaml            # Compatibility UI metadata for root 666 entrypoint
rules/
  xa-xb-standard.md           # XA/XB AI-assisted development standard
skills/
  666/
    SKILL.md                  # Codex project workflow router
    agents/openai.yaml
  work-planner/
    SKILL.md                  # Complete planning entrypoint
    agents/openai.yaml
  needs-solution-designer/
    SKILL.md                  # Needs clarification and solution blueprint
    agents/openai.yaml
    references/
  work-splitter/
    SKILL.md                  # Work decomposition agent
    agents/openai.yaml
  555/
    SKILL.md                  # Codex project five-agent evidence loop
    agents/openai.yaml
plugins/
  work-splitter/
    .codex-plugin/plugin.json # Local plugin manifest
    README.md
    skills/work-splitter/
```

## Install Paths

```text
skills/666
skills/work-planner
skills/needs-solution-designer
skills/work-splitter
skills/555
```

## Current Scope

The runtime skill logic stays in each `SKILL.md`. The README and `agents/openai.yaml` files are for GitHub presentation and UI metadata.
