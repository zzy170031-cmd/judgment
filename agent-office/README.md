# Judgment Agent Office

## Runtime Contract Tools

The Agent Office bridge now has an explicit runtime contract layer:

```powershell
npm run agent-office:event -- --agent "Controller" --status running --text "Controller accepted the next task"
npm run agent-office:trajectory -- --controller-decision "continue" --agent "Controller" --lane "control" --action "verify gate" --result "passed" --next "advance"
npm run agent-office:trajectory:summary -- --format markdown
npm run check:runtime-contract
```

- `scripts/post-agent-office-event.js` writes visible `/codex/event` packets.
- `scripts/record-agent-office-trajectory.js` appends a durable local trajectory ledger for Codex-side work.
- `scripts/summarize-agent-office-trajectory.js` turns the raw trajectory ledger into a compact Controller summary.
- `agent-office/runtime-state.schema.json` fixes the bridge runtime snapshot shape.
- `skill-artifacts/loop-engineering/schemas/*.schema.json` fixes worker packets, 555 verdicts, trajectory entries, loop state, request packets, events, and evidence.

HTML remains a request and observability surface. Codex remains responsible for execution, validation, Gate advancement, Git/Worktree mutation, and final project closure.

静态可预览版本的 Judgment Agent Office 页面，用于展示 Agent 编组、办公室运行态、项目拓扑、证据闭环、555 审查、Git/Worktree 状态。

## 入口

```text
http://127.0.0.1:8787/agent-office/index.html
```

## 文件

- `index.html`：静态入口。
- `mockData.js`：页面唯一数据源。
- `app.js`：渲染与交互逻辑。
- `styles.css`：页面布局、暗色视觉、办公室地图、动画。
- `assets/reference-office.png`：参考图裁剪出的中央办公室底图。
- `assets/avatar-*.png`：参考图裁剪出的右侧 Agent 像素头像。
- `CONTRACT.md`：上下游链路、内部数据模型、验收契约。

## 验收命令

```powershell
& 'E:\coderely\tools\node\node.exe' --check agent-office\app.js
& 'E:\coderely\tools\node\node.exe' --check agent-office\mockData.js
```

页面不依赖 npm 安装，不需要构建步骤。

## 已接入交互

- 导航模块、办公室/拓扑模式、搜索、通知、身份状态。
- 总览、工作拆分、规划中心、测试证据、555 审查、Worktree 管理、项目统计、Git 集成、系统设置都使用流程节点图展示。
- 泳道状态、办公室分区、Agent 详情、拓扑节点。
- 右侧 Agent 对话流、镜像输出刷新、模拟派发反馈。
- 右侧 Codex 需求入口：生成结构化任务包，尝试 `POST /codex/request`，桥接未连接时保留页面队列。
- 证据筛选与详情、活动动态详情、Gate 详情。
- Git / Worktree 只读详情、缩放、重置、全屏、toast 反馈。

## 当前边界

- 当前页面使用 `mock-runtime`，不会启动真实子代理。
- 右侧 Agent 对话是运行镜像，用于预览未来真实对话区域。
- 派发、刷新输出、实时事件都会改变前端状态，但不调用后端、不执行 Git 写操作。
- HTML 发起需求只创建任务包；真实文件、Git、网络、安装或发布动作仍由 Codex 线程按权限、测试和证据 gate 执行。

## 本地 Codex Bridge

启动本地预览和 bridge：

```powershell
Start-Process -FilePath 'E:\coderely\tools\node\node.exe' -ArgumentList @('scripts\agent-office-bridge.js','--root','C:\Users\Administrator\Documents\日常杂项\judgment','--port','8787') -WorkingDirectory 'C:\Users\Administrator\Documents\日常杂项\judgment' -WindowStyle Hidden
```

当前页面已接入三类本地端点：

- `POST /codex/request`：HTML 发起需求，bridge 保存任务包；安全 allowlist 请求会执行本地静态验证。
- `POST /codex/event`：Codex 推进项目时写入运行事件，页面会同步当前节点、泳道进度、活动流和右侧 Agent 对话。
- `GET /codex/state`：页面每 2.2 秒轮询一次，显示当前执行到哪一步、是否存在卡点、最新证据和最近请求。

Codex 侧承接 HTML 队列：

```powershell
node scripts\controller-agent-office-inbox.js --limit 20
npm run agent-office:feedback
npm run agent-office:watch
```

这个脚本是 Judgment Controller 的收件箱。它读取 `queued/accepted` 请求，按 `intake -> orient -> route -> persist` 写回 Controller 决策、项目会话、下一步、oracle 和 stop condition。`agent-office:feedback` 是单次接收反馈，适合用户刚点完 HTML 按钮后由当前 Codex 线程执行；`agent-office:watch` 是持续监听模式，适合演示或项目推进时让页面请求自动进入 Controller 反馈流。它不会由 HTML 触发文件、Git、安装、发布或删除动作。

Codex 侧项目会话入口：

```powershell
npm run agent-office:session:status
npm run agent-office:session:close -- --reason "当前项目验收结束"
npm run agent-office:session:new -- --project "OpenClaw Platform" --gate "XB-1 需求冻结" --next-gate "XB-2 拆分编组"
npm run agent-office:gate:advance -- --target-gate "XB-5 集成与审查" --next-gate "XB-6 发布准备"
```

项目会话是项目制边界：一个项目结束后由 Codex Controller 写入 `projectSession.lifecycle=closed`；进入下一个项目时创建新的 `projectSession.id`，并清空当前阻塞态与运行焦点。HTML 页面只展示和提交申请，不直接关闭或创建项目。

Gate 推进是 Codex Controller 的验收动作：页面只能提交 `gate.advance.request`；Codex 完成 QA、555、证据墙和 Git/Worktree 核验后，运行 `agent-office:gate:advance` 写回当前 Gate、清除 Gate blocker，并把原请求标记为通过。

HTML 点击后的 Codex 反馈顺序：

1. HTML 按钮提交 `/codex/request`，页面显示“已进入 Codex Bridge”。
2. Codex 侧运行 `npm run agent-office:feedback` 或保持 `npm run agent-office:watch`，Controller 读取请求并写回“已接收 / 等待核验 / 已路由”。
3. Codex 当前线程执行真实核验或修复，用 `scripts/post-agent-office-event.js` 或 Gate/session 命令写回结果。
4. 页面通过 `/codex/state` 展示到顶部执行条、右侧 Bridge、活动动态、Agent 对话和 Gate 卡片。

安全边界：HTML 不能直接执行任意文件、Git、网络、安装或发布动作。自由文本需求只进入队列；真实执行仍由 Codex 线程按权限、测试和证据 gate 推进。
