# HTML Update Summary

## 本轮目标

把 Judgment 项目的 Agent 编组、项目拓扑、任务流、证据闭环、555 审查、Git/Worktree 状态，落成一个现代化暗色 Agent Office 页面，并让它具备和 Codex 本地线程双向联动的基础能力。

## 已完成页面能力

### 1. Agent Office 主视图

- 中央主区域使用参考图风格的像素办公室底图。
- 顶部展示项目、分支、阶段、运行状态和各泳道进度。
- 左侧固定 Judgment Agent Office 导航。
- 右侧展示 Agent 状态、当前焦点 Agent、Agent 对话镜像、Codex Bridge 状态和 Git/Worktree。
- 底部展示活动动态、Evidence Wall 和 Codex 需求入口。
- 页面无龙虾标识，左上角只保留 `JUDGMENT / Agent Office`。

### 2. 办公室和拓扑双模式

- `办公室模式`：显示俯视办公室、Agent 节点、房间分区和动态任务流。
- `拓扑模式`：显示 Agent Graph 节点图，用于查看 Controller、Planning、Splitter、Frontend、Backend、QA、555 Review、Release 的上下游依赖。

### 3. 所有导航模块已接入

左侧导航不再是空入口。当前模块都会进入可视化节点视图或对应详情：

- 总览
- Agent 办公室
- 项目拓扑
- 工作拆分
- 规划中心
- 测试证据
- 555 审查
- Worktree 管理
- 项目统计
- Git 集成
- 系统设置

### 4. 右侧栏优化

已处理用户反馈中的右侧堆叠问题：

- Agent 列表压缩为可读的运行摘要。
- 当前选中 Agent 独立成焦点卡片。
- Agent 对话区域独立滚动。
- Codex Bridge 只保留状态和复制任务包入口。
- 需求输入入口从右侧移到主内容底部，避免右栏拥挤。
- Git/Worktree 位于右侧底部，按钮不再覆盖内容。

### 5. Codex 需求入口

当前唯一主入口在办公室下方的横向 `Codex 需求入口`：

- 输入需求文本。
- 选择当前模块和 Agent 上下文。
- 生成结构化任务包。
- 尝试投递到本地 bridge。
- 页面显示最近请求状态。

右侧 `Codex Bridge` 不再提供额外输入框，只显示 bridge 状态、最近请求和复制任务包按钮。

### 6. 动态流转显示

页面可通过 bridge state 更新：

- 顶部当前执行条。
- 顶部泳道进度卡。
- 右侧 Agent 状态列表。
- Agent 对话镜像。
- 活动动态。
- Evidence Wall。
- 卡点提醒。

### 7. 静态资源和视觉验证

已保留关键预览截图用于人工验收：

- `agent-office/preview-right-no-extra-entry-1440.png`
- `agent-office/preview-command-dock-1440.png`
- `agent-office/preview-agent-office-complete-1440.png`
- `agent-office/preview-right-rail-optimized-1920-v2.png`

这些截图用于验证 1440px 和 1920px 宽度下的布局状态。

## 当前实现文件

- 页面入口：`agent-office/index.html`
- 页面逻辑：`agent-office/app.js`
- 样式：`agent-office/styles.css`
- Mock 数据：`agent-office/mockData.js`
- 本地 bridge：`scripts/agent-office-bridge.js`
- 页面契约：`agent-office/CONTRACT.md`
- 页面说明：`agent-office/README.md`
- skill 实测报告：`agent-office/JUDGMENT_SKILL_REAL_USE_REPORT.md`

## 当前边界

- 当前页面仍是 HTML/CSS/JS 单页实现，不依赖 React 或 npm。
- 当前 Agent 对话是运行镜像，不是真实子代理 transcript。
- 当前 HTML 不能直接执行任意 Codex 操作，只能提交任务包到 bridge。
- 真正的项目执行仍由 Codex 线程按 Judgment/666 的 gate、测试、证据和安全规则推进。
