# Validation And Next Steps

## 已验证

本轮开发已验证：

```powershell
& 'E:\coderely\tools\node\node.exe' --check .\agent-office\app.js
& 'E:\coderely\tools\node\node.exe' --check .\agent-office\mockData.js
```

并已验证本地 bridge 状态接口曾正常返回：

```text
GET /codex/state -> 200
```

## 当前可用状态

- 页面可以打开完整 Judgment Agent Office。
- 右侧不再出现重复的需求入口。
- 主内容底部保留唯一 `Codex 需求入口`。
- 右侧 Agent 状态栏不再把需求输入、Agent 对话和 Worktree 堆叠在一起。
- 页面可以接收 bridge 事件并更新运行条、泳道进度、活动动态、Evidence Wall 和 Agent 状态。
- 页面契约已经明确 Judgment Controller 是主控调度 Agent；HTML 展示 Controller 的项目全览和决策，不直接执行项目动作。
- Markdown / HTML / Loop 三层关系已经明确：Markdown 定义规则，Codex 执行 loop，HTML 显示状态和请求队列。
- 页面仍保持安全边界：不从 HTML 直接执行任意 Codex/Git/文件动作。

## 人工验收截图

建议优先查看：

- `agent-office/preview-right-no-extra-entry-1440.png`
- `agent-office/preview-command-dock-1440.png`
- `agent-office/preview-agent-office-complete-1440.png`
- `agent-office/preview-right-rail-optimized-1920-v2.png`

## 当前未完成或需要继续推进

### 1. 真实 Codex 事件写回助手

建议新增：

```text
scripts/post-agent-office-event.js
```

目标：让 Codex 在每个阶段可以用一条命令写入 `/codex/event`，减少手写 JSON 的成本。

### 2. Runtime schema 固化

建议新增：

```text
agent-office/runtime-schema.json
```

目标：固定 event、request、state 的字段结构，避免后续真实子代理或其他线程写入不兼容数据。

### 3. 真实子代理 transcript 镜像

当前右侧 Agent 对话仍是镜像模式。后续真实子代理接入时，推荐只接 transcript mirror，不让 HTML 直接拉起 agent。

### 4. Judgment skill alias

当前 Codex skill 列表中没有显式 `judgment` 名称，仓库根 `SKILL.md` 主要是 `666` 总控入口。建议后续增加一个轻量 `judgment` alias：

- 只负责触发、边界、路由。
- 复用 `666`、`work-planner`、`work-splitter`、`555`。
- 不重复大段规则。

### 5. Gate 执行规范

建议把 HTML 联动写入 Judgment skill：

- 每个任务开始时写入 `running`。
- 每个测试完成后写入 `pass` 或 `failed`。
- 每个卡点写入 `blocked`。
- 每个卡点关闭时写入 `resolved`。
- 每个可交付节点写入 Evidence Wall。
- 每个 loop 事件写入 Controller sees / decision / delegatesTo / waitsFor / stopCondition。
- 每个可持续推进的 loop 先通过 `rules/loop-engineering-standard.md` 的 readiness gate。

## 推荐下一步

把本目录作为 Judgment skill 的 HTML 可视化专项归档，再把 `CODEX_BRIDGE_CONTRACT.md` 的关键规则同步回 skill 主入口或子规则文件中。这样之后 Codex 推进任何项目时，都能按同一套事件契约驱动页面实时显示。
