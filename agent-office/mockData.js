window.JUDGMENT_OFFICE_DATA = {
  project: {
    name: "OpenClaw Platform",
    branch: "main",
    stage: "XB-4",
    status: "开发中",
    user: "Judgment Controller",
    gate: "XB-4 开发与验证",
    nextGate: "XB-5 集成与审查",
    systemStatus: "所有基础运行正常"
  },
  runtime: {
    source: "mock-runtime",
    mode: "mirror",
    lastUpdated: "18:36:40",
    statusText: "静态 HTML 镜像运行中",
    streamLabel: "镜像流式输出",
    health: [
      { label: "HTML 入口", value: "已加载", tone: "green" },
      { label: "Mock 数据", value: "已加载", tone: "green" },
      { label: "办公室底图", value: "已加载", tone: "green" },
      { label: "Agent 对话", value: "镜像模式", tone: "cyan" },
      { label: "真实后端", value: "未接入", tone: "yellow" }
    ],
    gates: [
      { label: "页面渲染", value: "通过", tone: "green" },
      { label: "办公室模式", value: "通过", tone: "green" },
      { label: "拓扑模式", value: "通过", tone: "green" },
      { label: "证据墙交互", value: "通过", tone: "green" },
      { label: "问题单闭环", value: "3/3 已处理", tone: "green" },
      { label: "真实 Agent 运行", value: "待接入", tone: "yellow" }
    ]
  },
  laneProgress: [
    { id: "controller", label: "Controller", progress: 100, status: "运行中", tone: "cyan" },
    { id: "planning", label: "Planning", progress: 100, status: "已完成", tone: "green" },
    { id: "splitter", label: "Splitter", progress: 100, status: "已完成", tone: "green" },
    { id: "frontend", label: "Frontend", progress: 72, status: "运行中", tone: "blue" },
    { id: "backend", label: "Backend", progress: 68, status: "运行中", tone: "green" },
    { id: "qa", label: "QA", progress: 45, status: "等待中", tone: "yellow" },
    { id: "review", label: "555 Review", progress: 20, status: "审查中", tone: "orange" },
    { id: "release", label: "Release", progress: 0, status: "未开始", tone: "gray" }
  ],
  navItems: [
    "总览",
    "Agent 办公室",
    "项目拓扑",
    "工作拆分",
    "规划中心",
    "测试证据",
    "555 审查",
    "Worktree 管理",
    "项目统计",
    "Git 集成",
    "系统设置"
  ],
  agents: [
    {
      id: "controller",
      name: "Controller",
      role: "全局规划与路由",
      meta: "下一 Gate：XB-4",
      progress: 100,
      status: "运行中",
      tone: "cyan",
      avatar: "C",
      details: "负责全局路线判断、Agent 编组、证据闭环和 Git/worktree 安全边界。"
    },
    {
      id: "planner",
      name: "Work Planner",
      role: "项目规划与路线",
      meta: "版本：v1.2.0",
      progress: 100,
      status: "已完成",
      tone: "green",
      avatar: "P",
      details: "完成 XB-4 当前阶段规划，锁定开发与验证 gate。"
    },
    {
      id: "splitter",
      name: "Work Splitter",
      role: "拆分与 Agent 编组",
      meta: "泳道数量：4",
      progress: 100,
      status: "已完成",
      tone: "green",
      avatar: "S",
      details: "已把项目拆成 Product、Frontend、Backend、QA、555、Release 泳道。"
    },
    {
      id: "frontend-team",
      name: "Frontend Team",
      role: "界面开发与交互",
      meta: "任务进度：72%",
      progress: 72,
      status: "运行中",
      tone: "blue",
      avatar: "F",
      details: "负责暗色 Agent Office 页面、办公室模式、拓扑模式和交互验证。"
    },
    {
      id: "backend-team",
      name: "Backend Team",
      role: "API 与服务开发",
      meta: "任务进度：68%",
      progress: 68,
      status: "运行中",
      tone: "green",
      avatar: "B",
      details: "负责 API、数据结构、状态同步和后续真实拓扑接入准备。"
    },
    {
      id: "qa-team",
      name: "QA Team",
      role: "测试与质量保障",
      meta: "任务进度：45%",
      progress: 45,
      status: "等待中",
      tone: "yellow",
      avatar: "Q",
      details: "等待前后端联调后执行 Browser、响应式、证据墙和交互回归。"
    },
    {
      id: "review-555",
      name: "555 Review",
      role: "五代理审查",
      meta: "待验证据：2项",
      progress: 20,
      status: "审查中",
      tone: "orange",
      avatar: "5",
      details: "负责 Core Challenger、Audit Specialist 和三位 reviewer 的证据闭环。"
    }
  ],
  agentConversations: {
    "controller": [
      { time: "18:36:40", speaker: "Controller", text: "已加载 Judgment Agent Office 运行镜像，等待用户操作。", tone: "cyan" },
      { time: "18:36:31", speaker: "Controller", text: "当前 Gate 固定为 XB-4 开发与验证，禁止把 mock 镜像当作真实执行证据。", tone: "green" },
      { time: "18:36:12", speaker: "Controller", text: "任务流、证据墙、Worktree 状态已进入同一 HTML 视图。", tone: "blue" }
    ],
    "planner": [
      { time: "18:35:58", speaker: "Work Planner", text: "规划泳道已完成，当前输出为 XB-4 页面验收节点。", tone: "green" },
      { time: "18:35:42", speaker: "Work Planner", text: "下一步进入 XB-5 前需要 Browser 证据和交互回归。", tone: "yellow" }
    ],
    "splitter": [
      { time: "18:35:35", speaker: "Work Splitter", text: "已拆分 Product、Frontend、Backend、QA、555、Release 六个办公室区域。", tone: "green" },
      { time: "18:35:18", speaker: "Work Splitter", text: "所有节点必须有上游、下游和证据入口。", tone: "cyan" }
    ],
    "frontend-team": [
      { time: "18:36:21", speaker: "Frontend Team", text: "办公室模式已渲染，右侧 Agent 对话流已接入镜像数据。", tone: "blue" },
      { time: "18:35:44", speaker: "Frontend Team", text: "所有任务流线条保持动态流动，点击热区覆盖办公室底图。", tone: "purple" }
    ],
    "backend-team": [
      { time: "18:35:02", speaker: "Backend Team", text: "API 与运行状态暂未接真实服务，当前使用 mock-runtime 契约。", tone: "green" },
      { time: "18:34:48", speaker: "Backend Team", text: "后续可把 project-runtime-state.json 作为唯一输入源。", tone: "cyan" }
    ],
    "qa-team": [
      { time: "18:35:48", speaker: "QA Team", text: "等待用户完成视觉确认后执行 1440/1920 布局回归。", tone: "yellow" },
      { time: "18:33:16", speaker: "QA Team", text: "证据墙筛选、弹窗、模式切换已列入验收清单。", tone: "green" }
    ],
    "review-555": [
      { time: "18:34:10", speaker: "555 Review", text: "需要补齐 Browser 截图、DOM 检查和 Git diff 证据。", tone: "orange" },
      { time: "18:33:58", speaker: "Core Challenger", text: "当前 HTML 是可视化镜像，不得声称真实子代理已经执行。", tone: "red" }
    ],
    "pm": [
      { time: "18:36:05", speaker: "PM Agent", text: "产品目标已固定：先完成 Agent Office HTML，再讨论 Loop 包装。", tone: "yellow" },
      { time: "18:35:11", speaker: "PM Agent", text: "需要保留中文主文案和英文模块辅助标识。", tone: "green" }
    ],
    "ux": [
      { time: "18:35:55", speaker: "UX Agent", text: "办公室底图作为主视觉，外围保持现代深色 SaaS 外壳。", tone: "purple" },
      { time: "18:35:01", speaker: "UX Agent", text: "右侧对话区用于展示 Agent 对应运行内容。", tone: "blue" }
    ],
    "ui": [
      { time: "18:36:21", speaker: "UI Agent", text: "已完成页面布局和动态图层，继续补齐真实前端反馈。", tone: "purple" },
      { time: "18:35:33", speaker: "UI Agent", text: "上传初版截图，等待 Browser 验收。", tone: "blue" }
    ],
    "api": [
      { time: "18:35:02", speaker: "API Agent", text: "接口开发镜像已完成，等待真实 runtime-state 接口。", tone: "green" },
      { time: "18:34:40", speaker: "API Agent", text: "当前页面所有数据来自 mockData.js。", tone: "cyan" }
    ],
    "db": [
      { time: "18:34:55", speaker: "DB Agent", text: "运行状态结构建议使用 project-runtime-state.json 承载。", tone: "green" },
      { time: "18:34:20", speaker: "DB Agent", text: "证据项、工作树和 Agent 对话需要保留可追溯 ID。", tone: "yellow" }
    ],
    "test": [
      { time: "18:33:16", speaker: "Test Agent", text: "暗色模式、弹窗、筛选和视图切换进入测试清单。", tone: "blue" },
      { time: "18:32:46", speaker: "Test Agent", text: "等待 1440px 和 1920px 浏览器证据。", tone: "yellow" }
    ],
    "core": [
      { time: "18:34:02", speaker: "Core Challenger", text: "请区分可视化镜像和真实执行，不允许把 mock 当证据。", tone: "red" },
      { time: "18:33:50", speaker: "Core Challenger", text: "每个完成声明都需要截图、DOM 或命令证据支撑。", tone: "orange" }
    ],
    "audit": [
      { time: "18:33:48", speaker: "Audit Specialist", text: "正在检查证据包是否覆盖 Browser、Git、测试报告。", tone: "yellow" },
      { time: "18:33:24", speaker: "Audit Specialist", text: "当前证据包进度 2/5。", tone: "orange" }
    ],
    "reviewer-a": [
      { time: "18:33:40", speaker: "Reviewer A", text: "确认办公室模式和拓扑模式需要分别验收。", tone: "purple" }
    ],
    "reviewer-b": [
      { time: "18:33:36", speaker: "Reviewer B", text: "确认 Evidence Wall 必须支持筛选与详情弹窗。", tone: "yellow" }
    ],
    "reviewer-c": [
      { time: "18:33:33", speaker: "Reviewer C", text: "确认 Worktree 面板只读展示，不执行 Git 写操作。", tone: "yellow" }
    ],
    "release-agent": [
      { time: "18:32:58", speaker: "Release Agent", text: "Release Gate 未开始，等待 555 Review 和 QA 证据闭环。", tone: "blue" },
      { time: "18:32:22", speaker: "Release Agent", text: "发布动作当前不可用。", tone: "gray" }
    ]
  },
  officeZones: [
    {
      id: "product",
      label: "PRODUCT 区",
      className: "zone-product",
      agents: [
        { id: "pm", name: "PM Agent", status: "需求梳理中", progress: 74, tone: "yellow", x: 18, y: 28 }
      ]
    },
    {
      id: "frontend",
      label: "FRONTEND 区",
      className: "zone-frontend",
      agents: [
        { id: "ux", name: "UX Agent", status: "设计中", progress: 68, tone: "purple", x: 42, y: 28 },
        { id: "ui", name: "UI Agent", status: "编码中", progress: 72, tone: "purple", x: 62, y: 28 }
      ]
    },
    {
      id: "backend",
      label: "BACKEND 区",
      className: "zone-backend",
      agents: [
        { id: "api", name: "API Agent", status: "开发中", progress: 68, tone: "green", x: 79, y: 28 },
        { id: "db", name: "DB Agent", status: "设计中", progress: 55, tone: "green", x: 92, y: 28 }
      ]
    },
    {
      id: "qa",
      label: "QA 区",
      className: "zone-qa",
      agents: [
        { id: "test", name: "Test Agent", status: "测试中", progress: 45, tone: "blue", x: 18, y: 74 }
      ]
    },
    {
      id: "review-room",
      label: "555 审查室",
      className: "zone-review",
      review: true,
      agents: [
        { id: "core", name: "Core Challenger", status: "质疑中", progress: 20, tone: "red", x: 48, y: 62 },
        { id: "audit", name: "Audit Specialist", status: "审查中", progress: 20, tone: "yellow", x: 68, y: 68 },
        { id: "reviewer-a", name: "Reviewer A", status: "审查中", progress: 20, tone: "purple", x: 41, y: 76 },
        { id: "reviewer-b", name: "Reviewer B", status: "审查中", progress: 20, tone: "yellow", x: 53, y: 84 },
        { id: "reviewer-c", name: "Reviewer C", status: "审查中", progress: 20, tone: "yellow", x: 66, y: 84 }
      ]
    },
    {
      id: "release",
      label: "RELEASE 区",
      className: "zone-release",
      agents: [
        { id: "release-agent", name: "Release Agent", status: "待发布", progress: 0, tone: "blue", x: 88, y: 74 }
      ]
    }
  ],
  flowLines: [
    { points: [[24.8, 31.5], [31.2, 31.5], [32.8, 31.5], [38.2, 31.5]], tone: "blue" },
    { points: [[48.5, 31.5], [55.2, 31.5]], tone: "purple" },
    { points: [[68.2, 31.5], [71.4, 31.5], [72.8, 31.5]], tone: "green" },
    { points: [[62.2, 39.2], [62.2, 45.5], [57.4, 45.5], [57.4, 55.4]], tone: "purple" },
    { points: [[78.8, 39.2], [72.4, 39.2], [72.4, 55.6], [67.8, 55.6], [67.8, 62.6]], tone: "yellow" },
    { points: [[24.2, 75.0], [27.4, 75.0], [27.4, 69.4], [36.6, 69.4], [36.6, 74.8]], tone: "blue" },
    { points: [[42.4, 69.4], [56.0, 69.4], [56.0, 73.8]], tone: "purple" },
    { points: [[68.8, 68.2], [73.2, 68.2], [73.2, 65.8], [81.6, 65.8], [81.6, 74.0]], tone: "red" }
  ],
  activities: [
    { time: "18:36:21", agent: "UI Agent", text: "完成页面布局开发，提交代码到 feature/ui-dashboard", tag: "代码提交", tone: "green" },
    { time: "18:35:48", agent: "QA Agent", text: "3 个交互问题已逐项处理，等待回归复核", tag: "问题已处理", tone: "green" },
    { time: "18:35:02", agent: "Backend Agent", text: "API 接口开发完成，等待前端联调", tag: "代码提交", tone: "green" },
    { time: "18:34:10", agent: "555 审查室", text: "要求补充 Browser 证据", tag: "审查要求", tone: "orange" },
    { time: "18:33:45", agent: "UI Agent", text: "上传初版截图", tag: "证据提交", tone: "blue" },
    { time: "18:32:16", agent: "QA Agent", text: "开始测试暗色模式", tag: "运行中", tone: "green" }
  ],
  issues: [
    {
      id: "AO-ISSUE-001",
      title: "活动动态详情缺少可理解说明",
      severity: "P2",
      owner: "Frontend",
      status: "resolved",
      symptom: "点击活动动态后只看到原始文案、标签和来源，用户无法判断这条事件代表什么。",
      fix: "新增活动详情解释器，按问题、审查、证据、代码提交、Bridge、Git、Gate、运行中等类型生成当前含义、影响范围和建议下一步。",
      evidence: "点击 QA Agent 问题单后可看到当前含义、影响范围、建议下一步和检查项。"
    },
    {
      id: "AO-ISSUE-002",
      title: "问题单没有列出具体缺陷",
      severity: "P2",
      owner: "QA",
      status: "resolved",
      symptom: "页面只写“发现 3 个问题”，没有可展开的问题清单、处理状态或复核证据。",
      fix: "新增 issues 数据源和问题闭环弹窗，问题单会展示每个缺陷的症状、处理动作、证据和状态。",
      evidence: "Activity Feed 的问题单详情和测试证据模块都能打开问题闭环。"
    },
    {
      id: "AO-ISSUE-003",
      title: "弹窗承载长解释时过窄",
      severity: "P3",
      owner: "UX",
      status: "resolved",
      symptom: "活动详情从短字段扩展成长解释后，原 420px 弹窗容易显得拥挤。",
      fix: "把详情弹窗扩展到 560px，并增加最大高度、滚动和长文本行高。",
      evidence: "QA 问题单弹窗能完整显示多行解释，不挤压标签和值。"
    }
  ],
  evidenceFilters: [
    { id: "all", label: "全部" },
    { id: "screenshot", label: "截图" },
    { id: "report", label: "测试报告" },
    { id: "browser", label: "浏览器" },
    { id: "git", label: "Git" },
    { id: "log", label: "日志" },
    { id: "other", label: "其它" }
  ],
  evidence: [
    { id: "dashboard", name: "dashboard.png", type: "浏览器截图", source: "UI Agent", time: "18:35:33", visual: "screen", status: "READY", filter: "screenshot" },
    { id: "report", name: "test-report.html", type: "测试报告", source: "QA Agent", time: "18:35:02", visual: "report", status: "READY", filter: "report" },
    { id: "video", name: "responsive.mp4", type: "交互录屏", source: "UI Agent", time: "18:34:45", visual: "video", status: "READY", filter: "browser" },
    { id: "diff", name: "git-diff.patch", type: "代码变更", source: "Backend Agent", time: "18:34:10", visual: "code", status: "+128 -23", filter: "git" },
    { id: "api", name: "api-test.json", type: "API 测试结果", source: "QA Agent", time: "18:33:22", visual: "json", status: "PASS", filter: "report" },
    { id: "activity-detail-fix", name: "activity-detail-check.json", type: "交互回归", source: "QA Agent", time: "18:38:12", visual: "json", status: "PASS", filter: "report", issueId: "AO-ISSUE-001", description: "活动动态弹窗已显示当前含义、影响范围、建议下一步和检查项。" },
    { id: "issue-board-fix", name: "issue-board-check.json", type: "问题单闭环", source: "QA Agent", time: "18:38:34", visual: "json", status: "PASS", filter: "report", issueId: "AO-ISSUE-002", description: "问题单已能展示 3 个缺陷的症状、处理动作和复核状态。" },
    { id: "modal-readability-fix", name: "modal-readability-check.json", type: "可读性回归", source: "UX Agent", time: "18:38:51", visual: "json", status: "PASS", filter: "browser", issueId: "AO-ISSUE-003", description: "详情弹窗宽度、最大高度和长文本行高已调整。" }
  ],
  worktrees: [
    { name: "main", status: "干净", head: "a1b2c3d", tone: "green" },
    { name: "feature/ui-dashboard", status: "干净", head: "d4e5f6g", tone: "green" },
    { name: "feature/api-user", status: "有修改", head: "h7i8j9k", tone: "yellow" },
    { name: "feature/db-schema", status: "干净", head: "l0m1n2o", tone: "green" }
  ],
  topologyNodes: [
    { id: "controller", label: "Controller", x: 50, y: 12, tone: "cyan" },
    { id: "plan", label: "Planning", x: 22, y: 28, tone: "green" },
    { id: "split", label: "Splitter", x: 50, y: 32, tone: "green" },
    { id: "frontend", label: "Frontend", x: 24, y: 54, tone: "purple" },
    { id: "backend", label: "Backend", x: 68, y: 54, tone: "green" },
    { id: "qa", label: "QA Evidence", x: 42, y: 72, tone: "yellow" },
    { id: "review", label: "555 Review", x: 66, y: 76, tone: "red" },
    { id: "release", label: "Release", x: 84, y: 88, tone: "blue" }
  ],
  topologyEdges: [
    { from: "controller", to: "plan" },
    { from: "controller", to: "split" },
    { from: "split", to: "frontend" },
    { from: "split", to: "backend" },
    { from: "frontend", to: "qa" },
    { from: "backend", to: "qa" },
    { from: "qa", to: "review" },
    { from: "review", to: "release" }
  ],
  codexBridge: {
    endpoint: "/codex/request",
    stateEndpoint: "/codex/state",
    eventEndpoint: "/codex/event",
    statusText: "本地 Codex bridge 未连接",
    mode: "contract-ready",
    capabilities: ["需求投递", "任务包生成", "执行状态回写", "安全审批边界"],
    limits: [
      "HTML 页面只生成结构化请求，不直接执行文件、Git、网络或安装动作",
      "真实执行需要本地 bridge 或 Codex 线程读取任务包",
      "外部动作仍按 Codex 权限、测试和证据 gate 推进"
    ],
    requests: []
  }
};
