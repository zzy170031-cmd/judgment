# Judgment Agent Office HTML Skill Artifacts

本目录用于单独存放 Judgment skill 相关的 HTML 可视化更新资料。它和可运行页面分离：

- 可运行页面仍在 `agent-office/`
- 本目录只保存 skill 升级、契约沉淀、验收记录和后续接入说明
- 后续更新 Judgment/666/work-planner/work-splitter 等 skill 时，可以直接引用这里的文档

## 当前页面入口

```text
http://127.0.0.1:8787/agent-office/index.html
```

对应源码：

- `agent-office/index.html`
- `agent-office/app.js`
- `agent-office/styles.css`
- `agent-office/mockData.js`
- `scripts/agent-office-bridge.js`

## 本目录文件

- `HTML_UPDATE_SUMMARY.md`：本轮 HTML 页面能力和 UI 更新汇总
- `CODEX_BRIDGE_CONTRACT.md`：HTML 页面和 Codex 线程联动的事件契约
- `VALIDATION_AND_NEXT_STEPS.md`：已验证内容、当前边界和下一步推进清单
- `REQUEST_PACKET.example.json`：从 HTML 发起需求时生成的任务包示例

## 设计定位

这个 HTML 页面的核心用途不是普通 dashboard，而是 Codex 开发过程的可视化运行面板：

1. 用户在 Codex 中发起项目需求。
2. Codex 按 Judgment/666 的 gate、泳道、证据闭环推进任务。
3. Codex 把真实推进事件写入本地 bridge。
4. HTML 页面实时显示当前执行节点、泳道进度、卡点、证据、Agent 镜像输出和 Worktree 状态。
5. 用户也可以在 HTML 页面输入需求，页面生成结构化任务包并进入本地 Codex Bridge 队列。

## 安全边界

HTML 页面不能直接执行任意文件、Git、网络、安装或发布动作。页面只负责生成任务包、展示状态和接收 bridge 返回。真实执行必须仍然由 Codex 线程根据工具权限、测试证据、Git 边界和必要的人类确认推进。
