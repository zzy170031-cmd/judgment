# Codex Bridge Contract

## 目标

让 Codex 线程和 HTML 页面形成双向联动：

- Codex 推进项目时，页面实时显示当前执行到哪一步。
- 页面发起需求时，生成结构化任务包并进入本地 Codex Bridge 队列。
- 页面只做状态可视化和请求入队，不直接获得任意执行权限。

## Bridge 端点

### POST /codex/request

由 HTML 页面发起，用于提交用户输入的需求。

请求用途：

- 保存 request packet。
- 记录到页面请求队列。
- 对 allowlist 安全检查请求执行本地静态验证。
- 对自由文本需求只入队，不自动执行。

最小字段：

```json
{
  "id": "codex-001",
  "project": "OpenClaw Platform",
  "branch": "main",
  "gate": "XB-4",
  "module": "Agent Office",
  "selectedAgent": "Controller",
  "request": "继续实现某个模块并补充验证证据"
}
```

### POST /codex/event

由 Codex 线程或本地验证脚本写入，用于更新页面运行状态。

推荐字段：

```json
{
  "id": "evt-001",
  "source": "codex",
  "agentId": "controller",
  "agent": "Controller",
  "lane": "frontend",
  "module": "Agent Office",
  "node": "right-rail-layout",
  "status": "running",
  "progress": 76,
  "text": "正在优化右侧 Agent 状态栏布局",
  "tag": "节点执行",
  "tone": "blue",
  "evidenceId": "preview-right-no-extra-entry-1440",
  "requestId": "codex-001"
}
```

### GET /codex/state

由页面定时轮询，用于获取当前运行快照。

页面消费内容：

- `state.activeRun`
- `state.currentLane`
- `state.laneProgress`
- `state.blockers`
- `state.evidence`
- `recentEvents`
- `recentRequests`

## 状态语义

- `running`：当前节点正在推进。
- `blocked`：当前节点存在卡点，写入 blocker。
- `resolved`：同泳道同节点的 blocker 已解决。
- `completed`：节点完成。
- `executed`：请求已被本地 allowlist 执行。
- `pass` / `passed`：验证通过。
- `failed`：验证失败或执行失败，页面只提示，不自动修复。

## 页面显示位置

用户发起需求后，应在这些位置查看进度：

1. 顶部当前执行条：显示当前 lane、节点和是否有卡点。
2. 顶部泳道卡片：显示每条泳道的进度和状态。
3. 右侧 Agent 状态：显示当前负责 Agent 和进度。
4. 底部活动动态：显示实时事件流。
5. Evidence Wall：显示验证截图、测试报告、Git diff、日志等证据。
6. 底部 Codex 需求入口：显示最近提交的任务包状态。
7. 右侧 Codex Bridge：显示 bridge 是否连接、最近请求是否进入队列。

## 安全边界

HTML 页面永远不直接执行以下动作：

- 任意 shell 命令。
- Git 写操作。
- 文件删除、移动或覆盖。
- npm install 或依赖安装。
- 网络请求代理。
- 发布、部署、清理或 reset。
- 真实子代理拉起。

正确流程：

1. HTML 生成结构化任务包。
2. Bridge 保存任务包和状态。
3. Codex 线程读取任务包。
4. Codex 按权限、测试、证据、Git 边界推进。
5. Codex 写回 `/codex/event`。
6. 页面显示推进结果。

## 后续可固化到 skill 的规则

- 每个 Codex 执行阶段必须写入至少一个运行事件。
- 每个完成节点必须关联验证证据或说明为什么不需要证据。
- `blocked` 必须包含卡点文本和建议下一步。
- `completed/pass` 必须能清除同 lane 同 node 的 blocker。
- 页面发起的自由文本需求必须默认进入队列，不自动执行。
