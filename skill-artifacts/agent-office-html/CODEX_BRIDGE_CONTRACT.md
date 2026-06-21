# Codex Bridge Contract

## 目标

让 Codex 线程和 HTML 页面形成双向联动：

- Codex 推进项目时，页面实时显示当前执行到哪一步。
- 页面发起需求时，生成结构化任务包并进入本地 Codex Bridge 队列。
- 页面只做状态可视化和请求入队，不直接获得任意执行权限。
- Judgment Controller 是主控调度 Agent。页面展示 Controller 对项目、skill 分流程、泳道、证据、卡点和下一接收方的全览判断。

## Markdown / HTML / Loop 关系

- Markdown：规则、skill、契约、计划、拆分、验收口径的来源。它定义 Judgment 应该如何判断和调度。
- HTML：Agent Office 可视化表面。它展示 Controller、泳道、节点、证据、卡点、Worktree 和请求队列，不直接执行项目动作。
- Loop：Codex 内部的真实执行闭环。它由 Judgment Controller 按 `rules/loop-engineering-standard.md` 判断 readiness、oracle、预算、review 和 stop condition。

三者必须保持单向授权边界：

```text
Markdown defines behavior -> Codex executes loop -> Bridge writes state/events -> HTML renders visibility -> User/Codex feeds new requests back to Controller
```

HTML 不得绕过 Markdown 规则，也不得绕过 Codex 权限直接执行。

## Authority Boundary

- Markdown can guide.
- HTML can display and request.
- Codex can execute.
- Scripts, tests, schemas, Browser checks, and CI can verify.
- User, QA, verifier, or 555 can accept.

Related assets:

- `rules/authority-boundary-standard.md`
- `rules/controller-state-machine-standard.md`
- `rules/loop-engineering-standard.md`
- `skill-artifacts/loop-engineering/schemas/`
- `scripts/validate-loop-state.py`

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
  "request": "继续实现某个模块并补充验证证据",
  "controller": {
    "agentId": "judgment-controller",
    "role": "Judgment Controller",
    "sees": ["当前 Gate", "泳道状态", "skill 分流程", "证据", "卡点"],
    "expectedDecision": "route / split / verify / escalate / stop"
  },
  "loop": {
    "readiness": "manual-first",
    "oracle": ["browser-flow"],
    "stopCondition": "需要用户审查或验证失败"
  }
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
  "requestId": "codex-001",
  "controller": {
    "sees": "Frontend lane has implementation output but needs Browser evidence",
    "decision": "route to QA browser verification",
    "delegatesTo": "QA Agent",
    "waitsFor": "screenshot and DOM check",
    "stopCondition": "verification failed or user decision required"
  },
  "loop": {
    "readiness": "loop-ready",
    "status": "running",
    "attempt": 1,
    "maxRetries": 3
  }
}
```

### GET /codex/state

由页面定时轮询，用于获取当前运行快照。

页面消费内容：

- `state.activeRun`
- `state.controller`
- `state.loopReadiness`
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
- `manual-first`：需要先由 Codex 完成一次稳定手动运行。
- `skill-ready`：流程可以沉淀进 skill/rule/script，但还不一定可自动循环。
- `loop-ready`：具备 hard oracle、状态、预算、人审和停止条件，可以进入受控 loop。
- `blocked`：缺少权限、目标、验证、Git 边界、预算或人审，Controller 必须停止推进。

## 页面显示位置

用户发起需求后，应在这些位置查看进度：

1. 顶部当前执行条：显示当前 lane、节点和是否有卡点。
2. 顶部泳道卡片：显示每条泳道的进度和状态。
3. 右侧 Agent 状态：显示 Judgment Controller 的调度判断、当前负责 Agent 和进度。
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
3. Judgment Controller 在 Codex 线程中读取任务包。
4. Controller 按 Markdown skill/rule 判断 route、readiness、oracle、review 和 stop condition。
5. Codex 按权限、测试、证据、Git 边界推进。
6. Codex 写回 `/codex/event`。
7. 页面显示推进结果。

## 后续可固化到 skill 的规则

- 每个 Codex 执行阶段必须写入至少一个运行事件。
- 每个 loop 必须写入 Controller sees / decision / delegatesTo / waitsFor / stopCondition。
- 每个 loop 必须声明 readiness：`no-loop` / `manual-first` / `skill-ready` / `loop-ready` / `blocked`。
- 每个完成节点必须关联验证证据或说明为什么不需要证据。
- `blocked` 必须包含卡点文本和建议下一步。
- `completed/pass` 必须能清除同 lane 同 node 的 blocker。
- 页面发起的自由文本需求必须默认进入队列，不自动执行。
