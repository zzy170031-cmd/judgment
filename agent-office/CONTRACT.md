# Judgment Agent Office Contract

## 目标

把 Judgment 项目的 Agent 编组、项目拓扑、任务流、证据闭环、555 审查、Git/Worktree 状态，落成一个可本地预览、可维护 mock 数据、可继续接入真实运行数据的静态前端成品。

当前交付页：

- `index.html`：页面入口。
- `mockData.js`：唯一 mock 数据源，暴露 `window.JUDGMENT_OFFICE_DATA`。
- `app.js`：渲染、交互、模式切换、弹窗逻辑。
- `styles.css`：暗色 Agent Office 外壳、俯视办公室、拓扑图、底部证据区样式与动画。
- `assets/reference-office.png`：根据用户参考图裁剪出的中央像素办公室底图，用于确保人物模型、房间、家具、流线与目标图一致。
- `assets/avatar-*.png`：根据参考图裁剪出的右侧 Agent 状态栏像素头像。

本地预览地址：

```text
http://127.0.0.1:8787/agent-office/index.html
```

## 当前 Gate

- 当前 Gate：XB-4 开发与验证
- 下一 Gate：XB-5 集成与审查
- 当前状态：静态可预览成品已实现，使用 mock 数据；真实子代理运行数据尚未接入。

## 上游输入契约

上游输入必须能被整理成以下信息，才能进入页面渲染链路：

- 项目信息：项目名、分支、阶段、运行状态、当前 Gate、下一 Gate、系统状态。
- Agent 编组：Controller、Planner、Splitter、Frontend、Backend、QA、555 Review、Release 等角色。
- 任务泳道：每条泳道的名称、进度、状态、状态色。
- 办公室节点：分区、Agent 坐标、Agent 状态、进度。
- 任务流连线：起点、终点、业务类型、颜色语义。
- 证据项：文件名、类型、来源、时间、状态、筛选类别。
- Git/Worktree：分支名、清洁状态、HEAD、状态色。
- 活动动态：时间、来源 Agent、事件内容、事件状态。

## 下游输出契约

页面必须稳定输出以下可验收内容：

- 顶部阶段栏：显示项目、分支、阶段、状态和全部泳道进度。
- 左侧导航栏：显示 Judgment Agent Office 导航和 Gate 状态。
- 中央办公室模式：显示俯视 Agent 办公室、Agent 卡片、动态任务流连线。
- 中央办公室底图：优先使用 `assets/reference-office.png`，CSS 房间和人物层作为点击热区与备用渲染层。
- 中央任务流：所有主要任务流必须通过 SVG 覆盖层保持流动动画，不能只依赖静态底图。
- 右侧 Agent 状态栏：必须显示像素人物头像，不能退化成字母色块。
- 中央拓扑模式：显示 Agent Graph 节点图和上下游依赖边。
- 中央模块视图：除办公室和拓扑外，其它导航模块必须使用流程节点图展示，不回退为文本堆叠或弹窗占位。
- 右侧 Agent 状态栏：显示 Agent 列表，点击 Agent 后展示详情。
- 右侧 Agent 对话：显示所选 Agent 的运行输出流；当前必须明确标注为 `mock-runtime / 镜像模式`，不能伪装成真实子代理对话。
- 右侧 Codex 需求入口：允许用户在 HTML 输入需求，生成结构化任务包，尝试投递本地桥接端点，并在桥接不可用时保留页面队列。
- 底部活动动态：显示实时事件流样式的项目推进记录。
- 底部 Evidence Wall：显示证据卡片，点击后弹出详情。
- 底部 Git/Worktree：显示各 worktree 状态和管理入口。

## 内部数据契约

`mockData.js` 必须写入：

```js
window.JUDGMENT_OFFICE_DATA = {
  project,
  runtime,
  navItems,
  laneProgress,
  agents,
  agentConversations,
  officeZones,
  flowLines,
  activities,
  evidenceFilters,
  evidence,
  worktrees,
  topologyNodes,
  topologyEdges,
  codexBridge
};
```

字段约束：

- `project.gate` 和 `project.nextGate` 必须存在，用于左侧 Gate 卡和 Gate 弹窗。
- `runtime.source` 必须存在，用于标明当前页面数据来源；静态版本固定为 `mock-runtime`。
- `runtime.mode` 必须存在，用于区分 `mirror` 和未来真实 `live`。
- `runtime.health[]` 必须使用 `{ label, value, tone }`，用于系统健康弹窗。
- `runtime.gates[]` 必须使用 `{ label, value, tone }`，用于当前 HTML 验收状态展示。
- `laneProgress[].progress` 必须是 `0-100` 数字，用于顶部进度条。
- `agents[].id` 必须唯一，用于点击右侧 Agent 卡。
- `agentConversations` 必须以 Agent id 为 key；每条消息使用 `{ time, speaker, text, tone }`。
- 如果办公室 Agent 不在 `agents[]` 中，也必须能在 `agentConversations` 中提供对应镜像对话。
- `officeZones[].agents[].id` 必须唯一，用于办公室 Agent 点击。
- `flowLines[].from` 和 `flowLines[].to` 使用办公室 SVG 坐标百分比，范围 `0-100`。
- `evidenceFilters[]` 必须使用 `{ id, label }`，且 `id="all"` 表示全部证据。
- `evidence[].filter` 必须能匹配 `evidenceFilters[].id`，但不能使用 `all`。
- `topologyEdges[].from` 和 `topologyEdges[].to` 必须对应 `topologyNodes[].id`。
- `codexBridge.endpoint` 必须存在；静态版本默认 `/codex/request`。
- `codexBridge.statusText` 必须明确区分 `未连接`、`已排队`、`已接收` 等状态，不能暗示真实 Codex 已执行。
- `codexBridge.requests[]` 可为空；运行中由页面追加 `{ id, createdAt, module, selectedAgent, request, status, statusText }`。
- 所有 `tone` 值只能使用当前样式支持的语义：`blue`、`cyan`、`green`、`purple`、`yellow`、`orange`、`red`、`gray`、`slate`。

## 组件消费契约

- `Sidebar` 由 `project` 和 `navItems` 驱动。
- `TopStatusBar` 由 `project` 和 `laneProgress` 驱动。
- `OfficeMap` 由 `officeZones` 和 `flowLines` 驱动。
- `TopologyView` 由 `topologyNodes` 和 `topologyEdges` 驱动。
- `AgentStatusPanel` 由 `agents` 驱动。
- `AgentConversation` 由 `agentConversations` 和当前选中 Agent 驱动。
- `ActivityFeed` 由 `activities` 驱动。
- `EvidenceWall` 由 `evidenceFilters` 和 `evidence` 驱动。
- `WorktreePanel` 由 `worktrees` 驱动。
- `CodexBridgeBox` 由 `codexBridge`、当前模块和当前选中 Agent 驱动。
- `DetailModal` 复用证据详情和 Gate 详情数据。

当前静态实现没有拆成 React 组件，但渲染函数已经按以上组件边界组织，后续迁移 React 时可一一拆分。

## 交互契约

- 点击顶部 `办公室模式`：显示俯视 Agent 办公室。
- 点击顶部 `拓扑模式`：显示项目 Agent Graph。
- 点击顶部搜索：打开搜索浮层，可搜索 Agent、办公室节点、证据、Worktree、导航模块。
- 点击顶部通知：打开通知中心，可模拟新增实时事件。
- 点击用户身份：打开当前 Controller 身份和系统入口。
- 点击顶部泳道卡：打开泳道状态详情，并联动右侧 Agent。
- 点击缩放/重置/全屏：改变办公室视图状态。
- 点击左侧导航：高亮当前模块；办公室/拓扑切换真实视图，其它模块打开模块反馈详情。
- 点击办公室分区：打开分区和 Agent 列表详情。
- 点击右侧 Agent 卡片：更新右侧详情区域。
- 点击办公室 Agent 卡片：更新右侧详情区域，并切换右侧 Agent 对话流。
- 点击右侧 `刷新输出`：提交 `agent.output.refresh` action packet 到本地 Codex Bridge 队列；页面保留当前镜像输出作为即时反馈，真实输出由 Codex 回写 `/codex/event`。
- 点击右侧 `派发到 Codex`：提交 `agent.dispatch` action packet 到本地 Codex Bridge 队列；页面不直接启动子代理，由 Judgment Controller 在 Codex 线程中读取队列、路由执行并回写事件。
- 在右侧 `Codex 需求入口` 提交需求：页面生成任务包，追加活动动态和 Agent 对话，尝试 `POST /codex/request`；如果桥接服务不可用，状态显示为页面队列等待接入。
- 点击 `复制包`：复制最近一次 Codex 任务包，便于手动交给 Codex 线程执行。
- 点击拓扑节点：打开节点上下游详情。
- 点击证据卡片：弹出证据详情。
- 点击证据筛选：Evidence Wall 按证据类别过滤。
- 点击左侧 Gate 卡：弹出 Gate 详情。
- 点击活动动态：打开事件详情。
- 点击 Worktree 行/管理按钮：打开只读 Worktree 状态详情。
- 进度条、状态标签、任务流连线必须有轻微动画，不能影响布局稳定性。

## 安全推进契约

- 当前交付不启动真实子代理，不伪造真实执行结果。
- 当前交付不修改 Git worktree，不执行提交、清理、reset 或 checkout。
- 真实子代理接入前，页面只展示 `mock-runtime` 运行镜像，并在右侧对话区明确标注。
- HTML 发起需求不是执行权限。真实 Codex 执行仍必须经过 Codex 线程、工具权限、测试命令、证据记录和必要的人类批准。
- 本地 Codex bridge 若接入，只能接收结构化 request packet；文件、Git、网络、安装、发布、破坏性动作不得由页面直接执行。
- 真实子代理接入后，必须先定义 worker packet：输入、输出、阻塞条件、证据、下游接收者。
- 555 Review 只在证据包、测试结果、发布候选或阻塞争议进入审查时升级为真实审查链路。

## 测试与验收契约

最低验收：

- `node --check agent-office/app.js` 通过。
- `node --check agent-office/mockData.js` 通过。
- `GET /agent-office/index.html` 返回 200。
- `GET /agent-office/styles.css` 返回 200。
- `GET /agent-office/mockData.js` 返回 200。
- `GET /agent-office/app.js` 返回 200。

人工或 Browser 验收：

- 1440px 宽度下布局完整，不出现横向遮挡。
- 1920px 宽度下中央办公室为主视觉，右侧 Agent 状态栏可见。
- 办公室模式和拓扑模式可切换。
- Agent 详情、Evidence 弹窗、Gate 弹窗可点击展示。
- 页面无龙虾标识。
- 页面文案以中文为主，关键模块保留英文辅助。

## 已知边界

- 当前是静态 HTML/CSS/JS 成品，不依赖 React、Tailwind 或后端服务。
- 当前没有真实 Agent 对话流，只展示项目运行镜像和可交互 mock 数据。
- 当前不做自动截图，因为本机内置 Browser 控制通道返回沙箱元数据错误；服务级验收已经覆盖资源可访问性。
- 后续如果接入真实子代理，需要新增运行事件总线和 Agent transcript 数据源。

## Codex Bridge 运行事件契约

页面和 Codex 的双向联动通过本地 bridge 完成：

- `POST /codex/request`：由 HTML 页面发起。输入是结构化 request packet，至少包含 `id`、`project`、`branch`、`gate`、`module`、`selectedAgent`、`request`；按钮联动还必须包含 `actionType`、`actionLabel`、`target`、`payload`。输出包含 `status`、`statusText`、`execution`、`requestPath`。
- `POST /codex/event`：由 Codex 线程或本地验证脚本发起。输入事件字段为 `id`、`source`、`agentId`、`agent`、`lane`、`module`、`node`、`status`、`progress`、`text`、`tag`、`tone`、可选 `evidenceId` 和 `requestId`。
- `GET /codex/state`：由页面轮询。输出包含 `state.activeRun`、`state.currentLane`、`state.laneProgress`、`state.blockers`、`state.evidence`、`recentEvents` 和 `recentRequests`。
- `GET /codex/requests`：由 Codex 线程读取，用于消费 HTML 提交的 action/request 队列。支持 `?status=queued&limit=20`。

Codex 侧辅助脚本：

- `scripts/list-agent-office-requests.js`：读取 `agent-office/runtime/requests` 中的 HTML 请求队列。
- `scripts/post-agent-office-event.js`：把 Codex 执行、阻塞、完成或验证结果写回 `/codex/event`，页面在下一次轮询或自动刷新时显示。

运行状态约定：

- `running`：当前节点正在推进，顶部运行条显示为运行中。
- `blocked`：当前节点存在卡点，写入 `state.blockers`，顶部运行条和右侧 Codex Bridge 必须显著提醒。
- `resolved`、`completed`、`executed`、`pass`、`passed`：表示节点通过或卡点关闭；同泳道同节点的 blocker 应清除。
- `failed`：表示验证失败或执行失败，页面必须显示失败状态，但不能自动执行修复动作。

泳道归一化：

- bridge 必须把 `Agent Office`、`frontend`、`ui`、`ux` 归一到 `frontend`。
- `测试证据`、`qa`、`test` 归一到 `qa`。
- `555 审查`、`555 Review`、`review` 归一到 `review`。
- `Git`、`Worktree` 归一到 `backend`，只显示状态，不执行 Git 写操作。

右侧运行控制栏验收：

- 右侧必须优先显示实时 Agent 状态摘要。
- Agent 列表、当前焦点、Agent 对话、Codex Bridge、Git/Worktree 之间不能互相遮挡。
- 1440px 和 1920px 宽度下，右侧列表和底部 Worktree 按钮不得出现内容覆盖。
