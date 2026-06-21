# Judgment Skill Real Use Report

## 本轮实测目标

用 Judgment/666 的推进方式把 Agent Office 页面从静态演示推进到本地可用闭环：

- HTML 可以发起需求并生成任务包。
- Codex 可以把真实推进事件写回页面。
- 页面可以实时显示当前执行节点、泳道进度、卡点、证据和 Agent 对话镜像。
- 过程中验证 skill 的真实使用问题，而不是只写静态文档。

## 已验证可用能力

- 666/Judgment 路由能把需求拆成可执行 gate：页面、bridge、事件契约、验证、报告。
- 安全边界有效：HTML 不直接执行任意文件、Git、网络、安装或发布动作。
- `/codex/request` 已可保存 HTML 任务包，并对 allowlist 安全验证请求自动执行本地静态检查。
- `/codex/event` 已可接收 Codex 运行事件，更新当前节点、泳道进度、卡点和证据。
- `/codex/state` 已可被页面轮询，页面每 2.2 秒同步运行状态。
- `blocked` 事件会形成卡点提醒；`resolved/completed/executed/pass/passed` 会关闭同泳道同节点卡点。
- 右侧运行控制栏已重排为 Agent 状态、当前焦点、Agent 对话、Codex Bridge、Git/Worktree 五个可读区域。

## 实测发现的问题

1. “Judgment skill”不是当前 Codex skill 列表中的显式技能名。
   - 当前可用 skill 名是 `666`、`work-planner`、`work-splitter` 等。
   - 仓库根 `SKILL.md` 的 `name` 是 `666`，README 说明它是兼容入口。
   - 用户说“使用 judgment”时，Codex 需要靠上下文推断这是仓库/套件，而不是系统可直接触发的 skill 名。

2. 根 `SKILL.md` 内容过大。
   - 它适合作为总控路由，但每次完整读取成本高。
   - 更适合拆成 `judgment` 轻入口 + `666` 详细路由 + 子规则引用。

3. bridge 内部二次 spawn Node 会触发 Windows/Codex 权限问题。
   - 实测 `spawnSync E:\coderely\tools\node\node.exe EPERM`。
   - 已修复：allowlist 静态检查从 `node --check` 子进程改为 Node 内置 `vm.Script` 语法解析。

4. HTML 不能也不应该直接驱动 Codex 任意执行。
   - 正确模型是：HTML 发起结构化请求，bridge 入队或执行 allowlist 检查，Codex 线程读取并按权限推进。
   - 自由文本需求必须保持队列/审批语义，避免把网页变成任意命令入口。

5. 右侧状态栏的真实可用性比展示效果更关键。
   - 原布局在真实事件写回后容易挤压 Agent 列表、对话和 Codex 入口。
   - 已改成紧凑 Agent 列表 + 当前焦点卡 + 对话 + Codex Bridge + Worktree 的运行控制栏。

## 建议后续升级

- 增加一个显式 `judgment` skill alias，入口只做触发、边界和路由，不重复整份 666 内容。
- 将 bridge 事件 schema 固化为 `agent-office/runtime-schema.json`，便于后续真实子代理写事件。
- 增加 Codex 侧 helper：`scripts/post-agent-office-event.js`，让每个执行阶段可以一行命令写回页面。
- 增加运行事件清理策略，避免历史失败事件长期影响当前演示。
- 后续真实子代理接入时，先接 transcript 镜像，不让 HTML 直接启动 agent。
