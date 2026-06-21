(function () {
  const data = window.JUDGMENT_OFFICE_DATA;
  const app = document.getElementById("app");

  let activeNav = initialNav();
  let selectedAgent = data.agents[0];
  let activeEvidenceFilter = "all";
  let activeModal = null;
  let activePopover = null;
  let searchQuery = "";
  let codexDraft = "";
  let codexBridgeStatus = data.codexBridge?.statusText || "本地 Codex 桥接未连接";
  let bridgeRuntime = null;
  let officeZoom = 100;
  let isFullscreen = false;
  let toastMessage = "";
  let toastTimer = null;
  let focusSearchAfterRender = false;
  let focusCodexAfterRender = false;
  const activityStream = [...data.activities];
  const agentConversations = JSON.parse(JSON.stringify(data.agentConversations || {}));
  const codexRequests = [...(data.codexBridge?.requests || [])];
  const seenBridgeEventIds = new Set();
  let streamTick = 0;
  let codexRequestSeq = codexRequests.length + 1;

  const runtimeMessages = [
    { agent: "Controller", text: "同步 Agent 状态快照", tag: "心跳", tone: "cyan" },
    { agent: "Frontend Team", text: "刷新办公室模式交互反馈", tag: "运行中", tone: "blue" },
    { agent: "QA Team", text: "检查 Evidence Wall 筛选状态", tag: "测试", tone: "yellow" },
    { agent: "555 Review", text: "等待补充审查证据", tag: "审查", tone: "orange" }
  ];

  const roomRects = [
    { id: "product", label: "PRODUCT 区", x: 2, y: 3, w: 30, h: 39, tone: "yellow" },
    { id: "frontend", label: "FRONTEND 区", x: 32, y: 3, w: 35, h: 39, tone: "purple" },
    { id: "backend", label: "BACKEND 区", x: 67, y: 3, w: 31, h: 39, tone: "green" },
    { id: "qa", label: "QA 区", x: 2, y: 44, w: 24, h: 53, tone: "blue" },
    { id: "review-room", label: "555 审查室", x: 28, y: 44, w: 43, h: 53, tone: "red" },
    { id: "release", label: "RELEASE 区", x: 72, y: 44, w: 26, h: 53, tone: "blue" }
  ];

  const officeAgents = data.officeZones.flatMap((zone) => (
    zone.agents.map((agent) => ({ ...agent, zoneId: zone.id, zoneLabel: zone.label }))
  ));

  const laneAgentMap = {
    controller: "controller",
    planning: "planner",
    splitter: "splitter",
    frontend: "frontend-team",
    backend: "backend-team",
    qa: "qa-team",
    review: "review-555"
  };

  const moduleToneMap = {
    "总览": "cyan",
    "Agent 办公室": "blue",
    "项目拓扑": "purple",
    "工作拆分": "green",
    "规划中心": "cyan",
    "测试证据": "yellow",
    "555 审查": "orange",
    "Worktree 管理": "green",
    "项目统计": "blue",
    "Git 集成": "green",
    "系统设置": "slate"
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function toneClass(tone) {
    return `tone-${tone || "blue"}`;
  }

  function initialNav() {
    const hash = decodeURIComponent(window.location.hash.replace(/^#/, "") || "");
    return data.navItems.includes(hash) ? hash : "Agent 办公室";
  }

  function syncHash() {
    const next = `#${encodeURIComponent(activeNav)}`;
    if (window.location.hash !== next) {
      window.history.replaceState(null, "", next);
    }
  }

  function nowTime() {
    return new Date().toLocaleTimeString("zh-CN", { hour12: false });
  }

  function progressBar(progress, tone) {
    return `
      <div class="progress-track ${toneClass(tone)}">
        <span style="width:${progress}%"></span>
      </div>
    `;
  }

  function statusLabel(status) {
    const map = {
      running: "运行中",
      queued: "排队中",
      accepted: "已接收",
      executed: "已执行",
      completed: "已完成",
      resolved: "已解决",
      pass: "通过",
      passed: "通过",
      blocked: "卡点",
      failed: "失败",
      pending: "等待中"
    };
    return map[status] || status || "运行中";
  }

  function normalizeLaneId(value) {
    const raw = String(value || "").toLowerCase();
    const map = {
      "总览": "controller",
      "agent 办公室": "frontend",
      "项目拓扑": "splitter",
      "工作拆分": "splitter",
      "规划中心": "planning",
      "测试证据": "qa",
      "555 审查": "review",
      "worktree 管理": "backend",
      "项目统计": "controller",
      "git 集成": "backend",
      "系统设置": "controller",
      plan: "planning",
      planning: "planning",
      split: "splitter",
      splitter: "splitter",
      test: "qa",
      qa: "qa",
      review: "review",
      "555": "review",
      release: "release",
      frontend: "frontend",
      backend: "backend",
      controller: "controller"
    };
    return map[value] || map[raw] || raw || "controller";
  }

  function effectiveLane(lane) {
    const runtimeLane = bridgeRuntime?.state?.laneProgress?.[lane.id];
    if (!runtimeLane) return lane;
    const progress = Number.isFinite(Number(runtimeLane.progress)) ? Number(runtimeLane.progress) : lane.progress;
    return {
      ...lane,
      progress,
      status: statusLabel(runtimeLane.status),
      tone: runtimeLane.tone || lane.tone
    };
  }

  function effectiveLanes() {
    return data.laneProgress.map(effectiveLane);
  }

  function runtimeStep() {
    const state = bridgeRuntime?.state;
    const run = state?.activeRun;
    if (!run) {
      return {
        tone: "cyan",
        title: "当前执行：等待 Codex 运行事件",
        meta: "页面已接入本地 bridge，Codex 推进时会回写进度。",
        progress: 0,
        blockerCount: 0,
        status: codexBridgeStatus
      };
    }
    return {
      tone: run.status === "blocked" ? "orange" : run.status === "failed" ? "red" : ["completed", "executed", "resolved", "pass", "passed"].includes(run.status) ? "green" : "cyan",
      title: `当前执行：${run.agent || "Codex"} -> ${run.node || run.module || "运行节点"}`,
      meta: run.text || "Codex 运行中",
      progress: Number.isFinite(Number(run.progress)) ? Number(run.progress) : 0,
      blockerCount: state.blockers?.length || 0,
      status: statusLabel(run.status)
    };
  }

  function currentMode() {
    if (activeNav === "项目拓扑") return "topology";
    return "office";
  }

  function getAgentById(id) {
    return data.agents.find((agent) => agent.id === id);
  }

  function findOfficeAgent(id) {
    return officeAgents.find((agent) => agent.id === id);
  }

  function selectAgentById(id, openDetail) {
    const agent = getAgentById(id);
    const officeAgent = findOfficeAgent(id);
    if (agent) {
      selectedAgent = agent;
    } else if (officeAgent) {
      selectedAgent = officeAgentToAgent(officeAgent);
    }
    if (openDetail) openModal(modalForAgent(selectedAgent));
  }

  function officeAgentToAgent(agent) {
    return {
      id: agent.id,
      name: agent.name,
      role: agent.zoneLabel,
      meta: `进度：${agent.progress}%`,
      progress: agent.progress,
      status: agent.status,
      tone: agent.tone,
      avatar: agent.name.slice(0, 1),
      details: `${agent.name} 当前处于 ${agent.status}，进度 ${agent.progress}%。`
    };
  }

  function setToast(message) {
    toastMessage = message;
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toastMessage = "";
      renderApp();
    }, 1800);
  }

  function pushActivity(agent, text, tag, tone) {
    activityStream.unshift({ time: nowTime(), agent, text, tag, tone });
    if (activityStream.length > 10) activityStream.length = 10;
  }

  function getConversation(agent) {
    const id = agent?.id || "controller";
    if (!agentConversations[id]) {
      agentConversations[id] = [
        {
          time: nowTime(),
          speaker: agent?.name || "Agent",
          text: "当前 Agent 暂无历史输出，已创建镜像对话流。",
          tone: agent?.tone || "blue"
        }
      ];
    }
    return agentConversations[id];
  }

  function addConversationMessage(agent, text, tone) {
    const conversation = getConversation(agent);
    conversation.unshift({
      time: nowTime(),
      speaker: agent.name || "Agent",
      text,
      tone: tone || agent.tone || "blue"
    });
    if (conversation.length > 8) conversation.length = 8;
  }

  function eventTime(value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return nowTime();
    return date.toLocaleTimeString("zh-CN", { hour12: false });
  }

  function agentFromRuntimeEvent(event) {
    const laneId = normalizeLaneId(event?.lane || event?.module);
    const mappedId = event?.agentId || laneAgentMap[laneId] || "controller";
    const found = getAgentById(mappedId) || data.agents.find((agent) => agent.name === event?.agent);
    if (found) return found;
    const progress = Number.isFinite(Number(event?.progress)) ? Number(event.progress) : 0;
    return {
      id: String(mappedId || laneId || "codex-runtime"),
      name: event?.agent || "Codex Runtime",
      role: event?.module || "Codex Bridge",
      meta: event?.node || laneId,
      progress,
      status: statusLabel(event?.status),
      tone: event?.tone || "cyan",
      avatar: (event?.agent || "C").slice(0, 1),
      details: event?.text || "Codex runtime event."
    };
  }

  function mergeBridgeRequest(request) {
    if (!request?.id) return false;
    const existing = codexRequests.find((item) => item.id === request.id);
    const next = {
      ...request,
      statusText: request.statusText || statusLabel(request.status),
      bridgeEndpoint: data.codexBridge?.endpoint || "/codex/request"
    };
    if (!existing) {
      codexRequests.unshift(next);
      if (codexRequests.length > 6) codexRequests.length = 6;
      return true;
    }
    const before = `${existing.status}|${existing.statusText}|${existing.receivedAt || ""}`;
    Object.assign(existing, next);
    const after = `${existing.status}|${existing.statusText}|${existing.receivedAt || ""}`;
    return before !== after;
  }

  function mergeBridgeEvent(event) {
    if (!event?.id || seenBridgeEventIds.has(event.id)) return false;
    seenBridgeEventIds.add(event.id);
    const tone = event.tone || "cyan";
    activityStream.unshift({
      time: eventTime(event.time),
      agent: event.agent || event.source || "Codex",
      text: event.text || "Codex 运行事件已更新",
      tag: event.tag || statusLabel(event.status),
      tone
    });
    if (activityStream.length > 12) activityStream.length = 12;
    const agent = agentFromRuntimeEvent(event);
    addConversationMessage(agent, event.text || "Codex 运行事件已更新", tone);
    return true;
  }

  function applyBridgeSnapshot(payload) {
    if (!payload?.ok) return false;
    const previousUpdatedAt = bridgeRuntime?.state?.updatedAt || "";
    bridgeRuntime = payload;
    const blockerCount = payload.state?.blockers?.length || 0;
    codexBridgeStatus = blockerCount
      ? `Codex bridge 已连接，有 ${blockerCount} 个卡点`
      : "Codex bridge 已连接，运行状态同步中";

    let changed = previousUpdatedAt !== (payload.state?.updatedAt || "");
    (payload.recentRequests || []).forEach((request) => {
      changed = mergeBridgeRequest(request) || changed;
    });
    [...(payload.recentEvents || [])].reverse().forEach((event) => {
      changed = mergeBridgeEvent(event) || changed;
    });
    return changed;
  }

  function shouldDeferRuntimeRender() {
    return document.activeElement?.matches?.("[data-codex-input], [data-search-input]");
  }

  function pollBridgeState() {
    const endpoint = data.codexBridge?.stateEndpoint || "/codex/state";
    fetch(endpoint, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`bridge ${response.status}`);
        return response.json();
      })
      .then((payload) => {
        const changed = applyBridgeSnapshot(payload);
        if (changed && !shouldDeferRuntimeRender()) renderApp();
      })
      .catch(() => {
        const next = "Codex bridge 未连接，页面保留本地镜像";
        if (codexBridgeStatus !== next) {
          codexBridgeStatus = next;
          if (!shouldDeferRuntimeRender()) renderApp();
        }
      });
  }

  function buildCodexRequestPacket(text) {
    const id = `codex-${String(codexRequestSeq++).padStart(3, "0")}`;
    return {
      id,
      createdAt: new Date().toISOString(),
      source: "judgment-agent-office-html",
      project: data.project.name,
      branch: data.project.branch,
      gate: data.project.gate,
      module: activeNav,
      selectedAgent: {
        id: selectedAgent.id,
        name: selectedAgent.name,
        status: selectedAgent.status,
        progress: selectedAgent.progress
      },
      request: text,
      bridgeEndpoint: data.codexBridge?.endpoint || "/codex/request",
      safety: "HTML only creates a request packet. File, Git, network, install, or destructive actions still require Codex-side approval and verification."
    };
  }

  function latestCodexPacketText() {
    const packet = codexRequests[0] || {
      id: "codex-draft",
      source: "judgment-agent-office-html",
      project: data.project.name,
      branch: data.project.branch,
      gate: data.project.gate,
      module: activeNav,
      selectedAgent: selectedAgent.name,
      request: codexDraft || "请在这里填写需求。",
      bridgeEndpoint: data.codexBridge?.endpoint || "/codex/request",
      safety: "HTML only creates a request packet. Codex-side execution still follows tool permissions and verification gates."
    };
    return JSON.stringify(packet, null, 2);
  }

  function submitCodexRequest(text) {
    const trimmed = text.trim();
    if (!trimmed) {
      setToast("请输入要交给 Codex 的需求");
      focusCodexAfterRender = true;
      return;
    }
    const packet = buildCodexRequestPacket(trimmed);
    packet.status = "queued";
    packet.statusText = "本地队列等待桥接";
    codexRequests.unshift(packet);
    if (codexRequests.length > 5) codexRequests.length = 5;
    codexDraft = "";
    codexBridgeStatus = "正在尝试投递到本地 Codex bridge";
    pushActivity("Judgment Office", `提交 Codex 需求 ${packet.id}`, "需求投递", "purple");
    addConversationMessage(selectedAgent, `收到 HTML 需求：${trimmed}`, selectedAgent.tone);

    const endpoint = data.codexBridge?.endpoint || "/codex/request";
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(packet)
    }).then((response) => (
      response.json().catch(() => ({
        ok: response.ok,
        status: response.ok ? "accepted" : "queued",
        statusText: response.ok ? "桥接服务已接收" : `桥接返回 ${response.status}`
      }))
    )).then((payload) => {
      packet.status = payload.status || (payload.ok ? "accepted" : "queued");
      packet.statusText = payload.statusText || (payload.ok ? "桥接服务已接收" : "桥接返回异常");
      packet.execution = payload.execution;
      packet.requestPath = payload.requestPath;
      codexBridgeStatus = packet.statusText;
      if (payload.execution?.status) {
        addConversationMessage(selectedAgent, `${packet.id}：${packet.statusText}（${payload.execution.status}）`, packet.status === "failed" ? "red" : "green");
      }
      pushActivity("Codex Bridge", `${packet.id} ${packet.statusText}`, "桥接反馈", packet.status === "failed" ? "red" : packet.status === "executed" ? "green" : "yellow");
      renderApp();
    }).catch(() => {
      packet.status = "queued";
      packet.statusText = "桥接未连接，已保留页面任务包";
      codexBridgeStatus = packet.statusText;
      addConversationMessage(selectedAgent, `${packet.id} 暂未连接 bridge，任务包已保留在页面队列。`, "yellow");
      pushActivity("Codex Bridge", `${packet.id} 进入本地队列`, "桥接待接入", "yellow");
      renderApp();
    });
  }

  function copyText(text, successMessage) {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setToast(successMessage);
        renderApp();
      }).catch(() => {
        openModal({
          kicker: "Codex Request Packet",
          title: "复制失败",
          body: "浏览器阻止了剪贴板写入，下面展示当前任务包内容。",
          rows: [{ label: "任务包", value: text }]
        });
        renderApp();
      });
      return;
    }
    openModal({
      kicker: "Codex Request Packet",
      title: "当前任务包",
      body: "当前浏览器不支持 Clipboard API，下面展示任务包内容。",
      rows: [{ label: "任务包", value: text }]
    });
  }

  function runtimeToneClass(item) {
    return toneClass(item?.tone || "blue");
  }

  function openModal(modal) {
    activeModal = modal;
    activePopover = null;
  }

  function closeModal() {
    activeModal = null;
  }

  function renderSidebar() {
    const nav = data.navItems.map((item) => `
      <button class="nav-item ${item === activeNav ? "active" : ""}" type="button" data-nav="${escapeHtml(item)}">
        <span class="nav-mark">${navIcon(item)}</span>
        <span>${escapeHtml(item)}</span>
      </button>
    `).join("");

    return `
      <aside class="sidebar">
        <div class="brand">
          <button class="menu-button" type="button" data-action="system-menu" aria-label="menu"><span></span><span></span><span></span></button>
          <div class="wordmark">
            <strong>JUDGMENT</strong>
            <span>Agent Office</span>
          </div>
        </div>
        <nav class="nav-list">${nav}</nav>
        <button class="gate-card" type="button" data-gate>
          <span class="gate-kicker">当前 Gate</span>
          <strong>${escapeHtml(data.project.gate)}</strong>
          <em>查看 Gate 详情</em>
          <span class="gate-kicker">下一 Gate</span>
          <strong>${escapeHtml(data.project.nextGate)}</strong>
        </button>
        <button class="system-card" type="button" data-system>
          <i></i>
          <div>
            <strong>系统状态</strong>
            <span>${escapeHtml(data.project.systemStatus)}</span>
          </div>
        </button>
      </aside>
    `;
  }

  function navIcon(item) {
    const map = {
      "总览": "01",
      "Agent 办公室": "AO",
      "项目拓扑": "TG",
      "工作拆分": "WS",
      "规划中心": "PL",
      "测试证据": "QA",
      "555 审查": "55",
      "Worktree 管理": "WT",
      "项目统计": "ST",
      "Git 集成": "GT",
      "系统设置": "SY"
    };
    return map[item] || "--";
  }

  function renderTopBar() {
    const lanes = effectiveLanes().map((lane) => `
      <button class="lane-card ${toneClass(lane.tone)}" type="button" data-lane="${lane.id}">
        <div>
          <strong>${escapeHtml(lane.label)}</strong>
          <em>${escapeHtml(lane.status)}</em>
        </div>
        ${progressBar(lane.progress, lane.tone)}
        <span>${lane.progress}%</span>
      </button>
    `).join("");

    return `
      <header class="topbar">
        <div class="project-strip">
          <div class="project-meta">
            <span>项目 <strong>${escapeHtml(data.project.name)}</strong></span>
            <span>分支 <strong>${escapeHtml(data.project.branch)}</strong></span>
            <span>阶段 <strong>${escapeHtml(data.project.stage)}</strong></span>
            <span class="status-pill">${escapeHtml(data.project.status)}</span>
          </div>
          <div class="top-actions">
            <div class="mode-toggle">
              <button class="${activeNav === "Agent 办公室" ? "active" : ""}" type="button" data-mode="office">办公室模式</button>
              <button class="${activeNav === "项目拓扑" ? "active" : ""}" type="button" data-mode="topology">拓扑模式</button>
            </div>
            <button class="icon-button search ${activePopover === "search" ? "active" : ""}" type="button" data-popover="search" aria-label="搜索"></button>
            <button class="icon-button bell ${activePopover === "notifications" ? "active" : ""}" type="button" data-popover="notifications" aria-label="通知"><b>${activityStream.length}</b></button>
            <button class="identity" type="button" data-popover="identity">
              <i></i>
              <span>${escapeHtml(data.project.user)}</span>
            </button>
            ${renderPopover()}
          </div>
        </div>
        ${renderRuntimeStepBar()}
        <div class="lane-row">${lanes}</div>
      </header>
    `;
  }

  function renderRuntimeStepBar() {
    const step = runtimeStep();
    return `
      <button class="runtime-step-bar ${toneClass(step.tone)}" type="button" data-action="runtime-step">
        <span class="runtime-pulse"></span>
        <strong>${escapeHtml(step.title)}</strong>
        <em>${escapeHtml(step.meta)}</em>
        <b>${escapeHtml(step.status)} · ${step.progress}%</b>
        <i>${step.blockerCount ? `卡点 ${step.blockerCount}` : "无卡点"}</i>
      </button>
    `;
  }

  function renderPopover() {
    if (activePopover === "search") return renderSearchPopover();
    if (activePopover === "notifications") return renderNotificationPopover();
    if (activePopover === "identity") return renderIdentityPopover();
    return "";
  }

  function renderSearchPopover() {
    const results = getSearchResults();
    const resultRows = results.map((item) => `
      <button class="search-result" type="button" data-search-kind="${item.kind}" data-search-id="${escapeHtml(item.id)}">
        <span>${escapeHtml(item.type)}</span>
        <strong>${escapeHtml(item.title)}</strong>
        <em>${escapeHtml(item.meta)}</em>
      </button>
    `).join("");

    return `
      <section class="floating-panel search-panel">
        <label>
          <span>搜索 Agents、任务、证据、Worktree</span>
          <input type="search" data-search-input value="${escapeHtml(searchQuery)}" placeholder="输入关键词..." />
        </label>
        <div class="search-results">${resultRows || "<p>没有匹配结果</p>"}</div>
      </section>
    `;
  }

  function renderNotificationPopover() {
    const rows = activityStream.slice(0, 6).map((item) => `
      <button class="notify-row" type="button" data-notification="${escapeHtml(item.time)}">
        <time>${escapeHtml(item.time)}</time>
        <strong class="${toneClass(item.tone)}">${escapeHtml(item.agent)}</strong>
        <span>${escapeHtml(item.text)}</span>
      </button>
    `).join("");

    return `
      <section class="floating-panel notification-panel">
        <div class="floating-head">
          <strong>通知中心</strong>
          <button type="button" data-action="simulate-event">模拟新事件</button>
        </div>
        <div class="notify-list">${rows}</div>
      </section>
    `;
  }

  function renderIdentityPopover() {
    return `
      <section class="floating-panel identity-panel">
        <strong>${escapeHtml(data.project.user)}</strong>
        <p>当前权限：Controller / 可查看所有 Agent 镜像状态</p>
        <button type="button" data-action="system-health">查看系统健康</button>
      </section>
    `;
  }

  function getSearchResults() {
    const query = searchQuery.trim().toLowerCase();
    const items = [
      ...data.agents.map((agent) => ({
        kind: "agent",
        id: agent.id,
        type: "Agent",
        title: agent.name,
        meta: `${agent.role} · ${agent.status}`
      })),
      ...officeAgents.map((agent) => ({
        kind: "office-agent",
        id: agent.id,
        type: "办公室",
        title: agent.name,
        meta: `${agent.zoneLabel} · ${agent.status}`
      })),
      ...data.evidence.map((item) => ({
        kind: "evidence",
        id: item.id,
        type: "证据",
        title: item.name,
        meta: `${item.type} · ${item.source}`
      })),
      ...data.worktrees.map((tree) => ({
        kind: "worktree",
        id: tree.name,
        type: "Worktree",
        title: tree.name,
        meta: `${tree.status} · ${tree.head}`
      })),
      ...data.navItems.map((item) => ({
        kind: "nav",
        id: item,
        type: "导航",
        title: item,
        meta: "打开模块"
      }))
    ];

    if (!query) return items.slice(0, 8);
    return items.filter((item) => (
      `${item.type} ${item.title} ${item.meta}`.toLowerCase().includes(query)
    )).slice(0, 12);
  }

  function renderOffice() {
    return `
      <section class="office-panel ${isFullscreen ? "fullscreen-office" : ""}">
        <div class="panel-title">
          <div>
            <h1>Agent 办公室</h1>
            <span class="live-chip"><i></i>实时</span>
          </div>
          <div class="map-tools">
            <span>缩放</span>
            <button type="button" data-zoom="out">-</button>
            <strong>${officeZoom}%</strong>
            <button type="button" data-zoom="in">+</button>
            <button type="button" data-zoom="reset">重置</button>
            <button type="button" data-zoom="fullscreen">${isFullscreen ? "退出" : "全屏"}</button>
          </div>
        </div>
        <div class="office-map reference-office" style="transform:scale(${officeZoom / 100});">
          ${renderOfficeRooms()}
          ${renderFurniture()}
          ${renderFlowLines()}
          ${renderOfficeAgents()}
          <div class="scanline"></div>
        </div>
      </section>
    `;
  }

  function renderOfficeRooms() {
    return roomRects.map((room) => `
      <button class="office-room ${toneClass(room.tone)} room-${room.id}" type="button" data-room="${room.id}"
        style="left:${room.x}%; top:${room.y}%; width:${room.w}%; height:${room.h}%;">
        <div class="room-grid"></div>
        <span class="room-label">${escapeHtml(room.label)}</span>
      </button>
    `).join("");
  }

  function renderFurniture() {
    return `
      <div class="furniture board" style="left:6%;top:9%;"></div>
      <div class="furniture plant" style="left:4%;top:25%;"></div>
      <div class="furniture plant" style="left:61%;top:9%;"></div>
      <div class="furniture shelf" style="left:36%;top:9%;"></div>
      <div class="furniture shelf" style="left:86%;top:12%;"></div>
      <div class="furniture clock" style="left:70%;top:12%;"></div>
      <div class="furniture server" style="left:76%;top:61%;"></div>
      <div class="furniture rocket" style="left:92%;top:61%;"></div>
      <button class="review-table" type="button" data-review-table>
        <span>证据包</span>
        <strong>2/5</strong>
      </button>
    `;
  }

  function renderOfficeAgents() {
    return officeAgents.map((agent) => `
      <button class="desk-agent ${toneClass(agent.tone)} agent-${agent.id} ${selectedAgent.id === agent.id ? "selected" : ""}"
        style="left:${agent.x}%; top:${agent.y}%;" type="button" data-office-agent="${agent.id}">
        <span class="pixel-shadow"></span>
        <span class="pixel-desk"><i></i></span>
        <span class="pixel-person ${toneClass(agent.tone)}" aria-hidden="true">
          <span class="hair"></span>
          <span class="head"></span>
          <span class="face"></span>
          <span class="neck"></span>
          <span class="body"></span>
          <span class="arm left"></span>
          <span class="arm right"></span>
          <span class="legs"></span>
        </span>
        <span class="agent-badge">
          <strong>${escapeHtml(agent.name)}</strong>
          <em>${escapeHtml(agent.status)}</em>
          ${progressBar(agent.progress, agent.tone)}
          <small>${agent.progress}%</small>
        </span>
      </button>
    `).join("");
  }

  function renderFlowLines() {
    const lines = data.flowLines.map((line, index) => {
      const [x1, y1] = line.from;
      const [x2, y2] = line.to;
      const points = line.bend ? `${x1},${y1} ${x1},${y2} ${x2},${y2}` : `${x1},${y1} ${x2},${y2}`;
      return `
        <polyline class="flow-line ${toneClass(line.tone)}" points="${points}" marker-end="url(#arrow-${line.tone})"></polyline>
        <circle class="flow-dot ${toneClass(line.tone)}" r="0.34">
          <animateMotion dur="${4 + index * 0.55}s" repeatCount="indefinite" path="M ${points.replaceAll(" ", " L ")}" />
        </circle>
        <circle class="flow-dot ghost ${toneClass(line.tone)}" r="0.24">
          <animateMotion begin="-${(index + 1) * 0.55}s" dur="${4 + index * 0.55}s" repeatCount="indefinite" path="M ${points.replaceAll(" ", " L ")}" />
        </circle>
      `;
    }).join("");

    const markerTones = ["blue", "purple", "green", "yellow", "red"];
    const markers = markerTones.map((tone) => `
      <marker id="arrow-${tone}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto-start-reverse">
        <path class="arrow-fill ${toneClass(tone)}" d="M 0 0 L 10 5 L 0 10 z"></path>
      </marker>
    `).join("");

    return `
      <svg class="flow-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>${markers}</defs>
        ${lines}
      </svg>
    `;
  }

  function renderTopology() {
    const nodesById = Object.fromEntries(data.topologyNodes.map((node) => [node.id, node]));
    const edges = data.topologyEdges.map((edge) => {
      const start = nodesById[edge.from];
      const end = nodesById[edge.to];
      return `<line class="topology-edge" x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" />`;
    }).join("");
    const nodes = data.topologyNodes.map((node) => `
      <button class="topology-node ${toneClass(node.tone)}" type="button" data-topology-node="${node.id}" style="left:${node.x}%;top:${node.y}%;">
        <span></span>
        <strong>${escapeHtml(node.label)}</strong>
      </button>
    `).join("");

    return `
      <section class="office-panel topology-panel">
        <div class="panel-title">
          <div>
            <h1>项目拓扑</h1>
            <span class="live-chip"><i></i>Agent Graph</span>
          </div>
          <p>展示 Judgment 项目拓扑、证据闭环和 555 审查链路。</p>
        </div>
        <div class="topology-map">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">${edges}</svg>
          ${nodes}
        </div>
      </section>
    `;
  }

  function renderMainSurface() {
    if (activeNav === "Agent 办公室") return renderOffice();
    if (activeNav === "项目拓扑") return renderTopology();
    return renderModuleView(activeNav);
  }

  function renderModuleView(moduleName) {
    const tone = moduleToneMap[moduleName] || "blue";
    const renderers = {
      "总览": renderOverviewModule,
      "工作拆分": renderWorkSplitModule,
      "规划中心": renderPlanningModule,
      "测试证据": renderEvidenceModule,
      "555 审查": renderReviewModule,
      "Worktree 管理": renderWorktreeModule,
      "项目统计": renderStatsModule,
      "Git 集成": renderGitModule,
      "系统设置": renderSettingsModule
    };
    const body = (renderers[moduleName] || renderOverviewModule)();
    return `
      <section class="office-panel module-panel ${toneClass(tone)}">
        <div class="panel-title module-title">
          <div>
            <h1>${escapeHtml(moduleName)}</h1>
            <span class="live-chip"><i></i>已联通</span>
          </div>
          <div class="module-actions">
            <button type="button" data-open-nav="Agent 办公室">办公室</button>
            <button type="button" data-open-nav="项目拓扑">拓扑</button>
            <button type="button" data-action="simulate-event">刷新事件</button>
          </div>
        </div>
        <div class="module-body">${body}</div>
      </section>
    `;
  }

  function moduleNodeAttrs(node) {
    if (node.agentId) return `data-module-agent="${escapeHtml(node.agentId)}"`;
    if (node.officeAgentId) return `data-office-agent="${escapeHtml(node.officeAgentId)}"`;
    if (node.evidenceId) return `data-module-evidence="${escapeHtml(node.evidenceId)}"`;
    if (node.worktreeName) return `data-module-worktree="${escapeHtml(node.worktreeName)}"`;
    if (node.laneId) return `data-lane="${escapeHtml(node.laneId)}"`;
    if (node.nav) return `data-open-nav="${escapeHtml(node.nav)}"`;
    if (node.gate) return "data-gate";
    if (node.reviewPackage) return "data-review-table";
    if (node.action) return `data-action="${escapeHtml(node.action)}"`;
    return `data-module-action="${escapeHtml(node.label)}"`;
  }

  function moduleFlowPath(from, to, edge) {
    if (edge.path) return edge.path;
    const bend = Number.isFinite(edge.bend) ? edge.bend : 0;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const c1x = from.x + dx * 0.46;
    const c2x = to.x - dx * 0.46;
    const c1y = from.y + dy * 0.12 + bend;
    const c2y = to.y - dy * 0.12 + bend;
    return `M ${from.x} ${from.y} C ${c1x} ${c1y} ${c2x} ${c2y} ${to.x} ${to.y}`;
  }

  function renderModuleFlowNode(node) {
    const progress = node.progress !== undefined
      ? progressBar(Math.max(0, Math.min(100, node.progress)), node.tone)
      : "";
    return `
      <button class="module-flow-node ${toneClass(node.tone)} node-${node.kind || "default"}"
        style="left:${node.x}%; top:${node.y}%;" type="button" ${moduleNodeAttrs(node)}>
        <span class="module-node-dot"></span>
        ${node.kicker ? `<small>${escapeHtml(node.kicker)}</small>` : ""}
        <strong>${escapeHtml(node.label)}</strong>
        ${node.meta ? `<em>${escapeHtml(node.meta)}</em>` : ""}
        ${progress}
        ${node.footer ? `<b>${escapeHtml(node.footer)}</b>` : ""}
      </button>
    `;
  }

  function renderModuleGraph(config) {
    const nodes = config.nodes || [];
    const nodeMap = Object.fromEntries(nodes.map((node) => [node.id, node]));
    const edges = (config.edges || []).map((edge, index) => {
      const from = nodeMap[edge.from];
      const to = nodeMap[edge.to];
      if (!from || !to) return "";
      const id = `${config.id || "module"}-edge-${index}`;
      const tone = edge.tone || to.tone || "blue";
      const path = moduleFlowPath(from, to, edge);
      const duration = edge.duration || 4.8;
      return `
        <path id="${id}" class="module-flow-edge ${toneClass(tone)} ${edge.risk ? "is-risk" : ""}" d="${path}"></path>
        <circle class="module-flow-pulse ${toneClass(tone)}" r="0.58">
          <animateMotion dur="${duration}s" begin="${(index * 0.22).toFixed(2)}s" repeatCount="indefinite" path="${path}"></animateMotion>
        </circle>
      `;
    }).join("");

    return `
      <div class="module-flow-layout ${config.className || ""}">
        <div class="module-flow-map">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${edges}</svg>
          ${nodes.map(renderModuleFlowNode).join("")}
          ${config.caption ? `<div class="module-flow-caption">${config.caption}</div>` : ""}
        </div>
        ${config.aside || ""}
      </div>
    `;
  }

  function renderModuleAside(title, rows, actionLabel, actionAttrs) {
    return `
      <aside class="module-flow-aside">
        <div class="module-aside-head">
          <strong>${escapeHtml(title)}</strong>
          ${actionLabel ? `<button type="button" ${actionAttrs || "data-module-action=\"查看详情\""}>${escapeHtml(actionLabel)}</button>` : ""}
        </div>
        <div class="module-aside-list">
          ${rows.map((row) => `
            <button class="module-aside-row ${toneClass(row.tone)}" type="button" ${row.attrs || `data-module-action="${escapeHtml(row.label)}"`}>
              <span>${escapeHtml(row.label)}</span>
              <strong>${escapeHtml(row.value)}</strong>
              ${row.meta ? `<em>${escapeHtml(row.meta)}</em>` : ""}
            </button>
          `).join("")}
        </div>
      </aside>
    `;
  }

  function statCard(label, value, meta, tone) {
    return `
      <button class="module-stat ${toneClass(tone)}" type="button" data-module-action="${escapeHtml(label)}">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
        <em>${escapeHtml(meta)}</em>
      </button>
    `;
  }

  function renderOverviewModule() {
    const lanes = effectiveLanes();
    const avgProgress = Math.round(lanes.reduce((sum, lane) => sum + lane.progress, 0) / lanes.length);
    const blocked = (bridgeRuntime?.state?.blockers?.length || 0) || lanes.filter((lane) => lane.progress < 50).length;
    const step = runtimeStep();
    const runtimeHealth = data.runtime?.health || [];
    return renderModuleGraph({
      id: "overview",
      className: "overview-flow",
      caption: `当前提醒：${step.title}。${step.meta}`,
      nodes: [
        { id: "controller", label: "Controller", kicker: "运行总线", meta: step.meta, progress: step.progress || 100, tone: step.tone, x: 50, y: 18, agentId: "controller", kind: "hub" },
        { id: "agents", label: `活跃 Agent ${data.agents.length + officeAgents.length}`, meta: "右侧状态 + 办公室节点", tone: "cyan", x: 19, y: 40, nav: "Agent 办公室" },
        { id: "progress", label: `平均进度 ${avgProgress}%`, meta: "全部泳道平均", tone: "blue", x: 50, y: 43, nav: "项目统计" },
        { id: "evidence", label: `证据 ${data.evidence.length}`, meta: "Evidence Wall 已接入", tone: "yellow", x: 81, y: 40, nav: "测试证据" },
        { id: "gate", label: data.project.gate, meta: `下一步 ${data.project.nextGate}`, tone: "green", x: 33, y: 63, gate: true, kind: "wide" },
        { id: "worktree", label: "Worktree 安全边界", meta: `${data.worktrees.length} 个分支状态`, tone: blocked ? "orange" : "green", x: 67, y: 63, nav: "Worktree 管理", kind: "wide" },
        { id: "codex", label: "Codex 需求入口", meta: codexBridgeStatus, tone: "purple", x: 50, y: 79, action: "focus-codex-request", kind: "wide" }
      ],
      edges: [
        { from: "controller", to: "agents", tone: "cyan" },
        { from: "controller", to: "progress", tone: "blue" },
        { from: "controller", to: "evidence", tone: "yellow" },
        { from: "progress", to: "gate", tone: "green" },
        { from: "evidence", to: "worktree", tone: "yellow" },
        { from: "gate", to: "codex", tone: "purple" },
        { from: "worktree", to: "codex", tone: blocked ? "orange" : "green" }
      ],
      aside: renderModuleAside("运行健康", runtimeHealth.map((item) => ({
        label: item.label,
        value: item.value,
        tone: item.tone,
        attrs: "data-action=\"system-health\""
      })), "系统健康", "data-action=\"system-health\"")
    });
  }

  function renderWorkSplitModule() {
    const agentNode = (id, x, y) => {
      const agent = findOfficeAgent(id);
      return {
        id,
        label: agent.name,
        meta: agent.status,
        progress: agent.progress,
        tone: agent.tone,
        x,
        y,
        agentId: id
      };
    };
    return renderModuleGraph({
      id: "split",
      className: "split-flow",
      caption: "工作拆分以可验证链路推进：上游输入、Agent 执行、测试证据、555 审查和 Release 依次咬合。",
      nodes: [
        agentNode("pm", 9, 36),
        agentNode("ux", 23, 30),
        agentNode("ui", 37, 30),
        agentNode("api", 52, 36),
        agentNode("test", 66, 52),
        { id: "review-room", label: "555 审查室", meta: "证据包 2/5", progress: 20, tone: "orange", x: 79, y: 52, reviewPackage: true },
        agentNode("release-agent", 88, 76)
      ],
      edges: [
        { from: "pm", to: "ux", tone: "blue" },
        { from: "ux", to: "ui", tone: "purple" },
        { from: "ui", to: "api", tone: "green" },
        { from: "api", to: "test", tone: "yellow" },
        { from: "test", to: "review-room", tone: "orange" },
        { from: "review-room", to: "release-agent", tone: "red", risk: true }
      ],
      aside: renderModuleAside("分区详情", data.officeZones.map((zone) => ({
        label: zone.label,
        value: `${zone.agents.length} Agent`,
        meta: zone.agents.map((agent) => `${agent.name} ${agent.progress}%`).join(" / "),
        tone: zone.agents[0]?.tone || "blue",
        attrs: `data-room="${escapeHtml(zone.id)}"`
      })), "查看拓扑", "data-open-nav=\"项目拓扑\"")
    });
  }

  function renderPlanningModule() {
    const gates = [
      { id: "xb1", label: "XB-1 需求冻结", tone: "green", progress: 100, x: 16, y: 30 },
      { id: "xb2", label: "XB-2 拆分编组", tone: "green", progress: 100, x: 34, y: 30 },
      { id: "xb3", label: "XB-3 原型", tone: "green", progress: 100, x: 52, y: 30 },
      { id: "xb4", label: data.project.gate, tone: "cyan", progress: 72, x: 70, y: 30, gate: true, kind: "hub" },
      { id: "xb5", label: data.project.nextGate, tone: "yellow", progress: 20, x: 45, y: 55, gate: true },
      { id: "xb6", label: "XB-6 发布准备", tone: "gray", progress: 0, x: 64, y: 55 }
    ];
    return renderModuleGraph({
      id: "planning",
      className: "planning-flow",
      caption: "规划中心把 Gate、Controller、Planner、Splitter 三个责任点连成可回溯推进线。",
      nodes: [
        ...gates,
        { id: "controller", label: "Controller", meta: "全局路线判断", progress: 100, tone: "cyan", x: 31, y: 78, agentId: "controller" },
        { id: "planner", label: "Work Planner", meta: "路线已完成", progress: 100, tone: "green", x: 50, y: 78, agentId: "planner" },
        { id: "splitter", label: "Work Splitter", meta: "编组已完成", progress: 100, tone: "green", x: 69, y: 78, agentId: "splitter" }
      ],
      edges: [
        { from: "xb1", to: "xb2", tone: "green" },
        { from: "xb2", to: "xb3", tone: "green" },
        { from: "xb3", to: "xb4", tone: "cyan" },
        { from: "xb4", to: "xb5", tone: "yellow" },
        { from: "xb5", to: "xb6", tone: "gray" },
        { from: "controller", to: "xb4", tone: "cyan", bend: -5 },
        { from: "planner", to: "xb4", tone: "green", bend: -3 },
        { from: "splitter", to: "xb5", tone: "green", bend: -3 }
      ],
      aside: renderModuleAside("当前 Gate", [
        { label: "当前", value: data.project.gate, tone: "cyan", attrs: "data-gate" },
        { label: "下一步", value: data.project.nextGate, tone: "yellow", attrs: "data-gate" },
        { label: "状态", value: data.project.status, tone: "green", attrs: "data-action=\"system-health\"" }
      ], "查看 Gate", "data-gate")
    });
  }

  function renderEvidenceModule() {
    const evidenceNodes = data.evidence.map((item, index) => ({
      id: item.id,
      label: item.name,
      meta: `${item.type} / ${item.source}`,
      footer: item.status,
      tone: item.status === "PASS" ? "green" : item.filter === "git" ? "green" : index % 2 ? "blue" : "yellow",
      x: 44 + (index % 3) * 15,
      y: 25 + Math.floor(index / 3) * 25,
      evidenceId: item.id
    }));
    return renderModuleGraph({
      id: "evidence",
      className: "evidence-flow",
      caption: "测试证据模块把 QA、浏览器截图、测试报告、Git diff 与 555 审查入口连接在同一证据闭环。",
      nodes: [
        { id: "qa", label: "QA Team", meta: "测试与质量保障", progress: 45, tone: "yellow", x: 18, y: 43, agentId: "qa-team", kind: "hub" },
        ...evidenceNodes,
        { id: "review", label: "555 Review", meta: "等待补证据", progress: 20, tone: "orange", x: 83, y: 70, reviewPackage: true }
      ],
      edges: [
        ...evidenceNodes.map((node) => ({ from: "qa", to: node.id, tone: node.tone })),
        ...evidenceNodes.slice(0, 3).map((node) => ({ from: node.id, to: "review", tone: "orange", risk: node.id === "diff" }))
      ],
      aside: renderModuleAside("验收清单", [
        { label: "布局截图", value: "1440 / 1920", tone: "blue", attrs: "data-module-evidence=\"dashboard\"" },
        { label: "模式切换", value: "办公室 / 拓扑", tone: "green", attrs: "data-open-nav=\"Agent 办公室\"" },
        { label: "Agent 对话", value: "镜像流", tone: "cyan", attrs: "data-action=\"stream-agent\"" },
        { label: "证据筛选", value: "可点击", tone: "yellow", attrs: "data-open-nav=\"测试证据\"" }
      ], "记录事件", "data-action=\"simulate-event\"")
    });
  }

  function renderReviewModule() {
    const reviewAgents = ["core", "audit", "reviewer-a", "reviewer-b", "reviewer-c"].map((id) => findOfficeAgent(id)).filter(Boolean);
    const positions = [
      ["core", 50, 22],
      ["audit", 76, 48],
      ["reviewer-a", 24, 48],
      ["reviewer-b", 38, 76],
      ["reviewer-c", 62, 76]
    ];
    const nodes = positions.map(([id, x, y]) => {
      const agent = reviewAgents.find((item) => item.id === id);
      return {
        id,
        label: agent.name,
        meta: agent.status,
        progress: agent.progress,
        tone: agent.tone,
        x,
        y,
        agentId: id
      };
    });
    return renderModuleGraph({
      id: "review",
      className: "review-flow",
      caption: "555 审查室围绕证据包运转：Core Challenger 质疑，Audit Specialist 查证据，Reviewer A/B/C 给出审查意见。",
      nodes: [
        { id: "package", label: "证据包 2/5", meta: "Browser / Test / Git 待闭环", progress: 40, tone: "orange", x: 50, y: 51, reviewPackage: true, kind: "hub" },
        ...nodes,
        { id: "release", label: "Release Gate", meta: "审查通过后解锁", progress: 0, tone: "gray", x: 88, y: 83, nav: "Agent 办公室" }
      ],
      edges: [
        ...nodes.map((node) => ({ from: node.id, to: "package", tone: node.tone })),
        { from: "package", to: "release", tone: "red", risk: true }
      ],
      aside: renderModuleAside("证据缺口", [
        { label: "已收到", value: "dashboard.png", tone: "green", attrs: "data-module-evidence=\"dashboard\"" },
        { label: "已收到", value: "test-report.html", tone: "green", attrs: "data-module-evidence=\"report\"" },
        { label: "待补充", value: "Browser 证据", tone: "orange", attrs: "data-open-nav=\"测试证据\"" },
        { label: "待补充", value: "Git diff", tone: "yellow", attrs: "data-module-evidence=\"diff\"" }
      ], "补证据", "data-open-nav=\"测试证据\"")
    });
  }

  function renderWorktreeModule() {
    const nodes = data.worktrees.map((tree, index) => ({
      id: `tree-${index}`,
      label: tree.name,
      meta: `HEAD ${tree.head}`,
      footer: tree.status === "有修改" ? "需隔离" : "干净可验证",
      tone: tree.tone,
      x: 23 + (index % 2) * 35,
      y: 28 + Math.floor(index / 2) * 30,
      worktreeName: tree.name
    }));
    return renderModuleGraph({
      id: "worktree",
      className: "worktree-flow",
      caption: "Worktree 管理保持只读状态展示：写入任务必须一任务一分支，dirty ownership 不明确时停止。",
      nodes: [
        { id: "controller", label: "Controller", meta: "分支所有权判断", progress: 100, tone: "cyan", x: 50, y: 12, agentId: "controller", kind: "hub" },
        ...nodes,
        { id: "git", label: "Git 集成", meta: "diff / commit / push 边界", tone: "green", x: 83, y: 76, nav: "Git 集成" }
      ],
      edges: [
        ...nodes.map((node) => ({ from: "controller", to: node.id, tone: node.tone, risk: node.tone === "yellow" })),
        ...nodes.map((node) => ({ from: node.id, to: "git", tone: node.tone, risk: node.tone === "yellow" }))
      ],
      aside: renderModuleAside("安全边界", [
        { label: "Git 写操作", value: "页面禁用", tone: "red", attrs: "data-module-action=\"Git 写操作禁用\"" },
        { label: "并行任务", value: "一任务一 worktree", tone: "green", attrs: "data-module-action=\"并行任务边界\"" },
        { label: "Dirty ownership", value: "不明则停止", tone: "yellow", attrs: "data-module-action=\"Dirty ownership\"" }
      ], "管理入口", "data-action=\"worktree-manage\"")
    });
  }

  function renderStatsModule() {
    const laneNodes = effectiveLanes().map((lane, index) => ({
      id: lane.id,
      label: lane.label,
      meta: lane.status,
      progress: lane.progress,
      tone: lane.tone,
      x: 18 + (index % 4) * 21,
      y: 28 + Math.floor(index / 4) * 34,
      laneId: lane.id
    }));
    return renderModuleGraph({
      id: "stats",
      className: "stats-flow",
      caption: "项目统计用泳道节点展示进度，低于 50% 的 QA / 555 / Release 会进入风险观察。",
      nodes: [
        { id: "hub", label: "运行指标 Hub", meta: `${activityStream.length} 实时事件 / ${data.evidence.length} 证据`, tone: runtimeStep().tone, x: 50, y: 12, nav: "总览", kind: "hub" },
        ...laneNodes
      ],
      edges: laneNodes.map((node) => ({ from: "hub", to: node.id, tone: node.tone, risk: node.progress < 50 })),
      aside: renderModuleAside("核心指标", [
        { label: "活动事件", value: `${activityStream.length}`, meta: "实时流", tone: "cyan", attrs: "data-action=\"simulate-event\"" },
        { label: "证据闭环", value: `${data.evidence.length}`, meta: "Evidence Wall", tone: "yellow", attrs: "data-open-nav=\"测试证据\"" },
        { label: "Worktree", value: `${data.worktrees.length}`, meta: "分支状态", tone: "green", attrs: "data-open-nav=\"Worktree 管理\"" },
        { label: "审查进度", value: "20%", meta: "555 Review", tone: "orange", attrs: "data-open-nav=\"555 审查\"" }
      ], "返回总览", "data-open-nav=\"总览\"")
    });
  }

  function renderGitModule() {
    return renderModuleGraph({
      id: "git",
      className: "git-flow",
      caption: "Git 集成模块只做状态和证据编排，不在 HTML 中执行 git add、commit、push 或 reset。",
      nodes: [
        { id: "worktree", label: "Worktree 状态", meta: `${data.worktrees.length} 个分支`, tone: "green", x: 13, y: 42, nav: "Worktree 管理" },
        { id: "diff", label: "git-diff.patch", meta: "+128 -23", tone: "green", x: 33, y: 28, evidenceId: "diff" },
        { id: "test", label: "api-test.json", meta: "PASS", tone: "green", x: 53, y: 28, evidenceId: "api" },
        { id: "review", label: "555 Review", meta: "证据包 2/5", progress: 20, tone: "orange", x: 72, y: 42, reviewPackage: true },
        { id: "release", label: "Release Gate", meta: "未开始", progress: 0, tone: "gray", x: 88, y: 68, nav: "Agent 办公室" },
        { id: "safe", label: "安全边界", meta: "HTML 只读展示", tone: "cyan", x: 42, y: 74, action: "system-health" }
      ],
      edges: [
        { from: "worktree", to: "diff", tone: "green" },
        { from: "diff", to: "test", tone: "green" },
        { from: "test", to: "review", tone: "orange" },
        { from: "review", to: "release", tone: "red", risk: true },
        { from: "worktree", to: "safe", tone: "cyan" },
        { from: "safe", to: "review", tone: "cyan" }
      ],
      aside: renderModuleAside("Git Ledger", data.worktrees.map((tree) => ({
        label: tree.name,
        value: tree.status,
        meta: `HEAD ${tree.head}`,
        tone: tree.tone,
        attrs: `data-module-worktree="${escapeHtml(tree.name)}"`
      })), "Worktree", "data-open-nav=\"Worktree 管理\"")
    });
  }

  function renderSettingsModule() {
    const healthNodes = (data.runtime?.health || []).map((item, index) => ({
      id: `health-${index}`,
      label: item.label,
      meta: item.value,
      tone: item.tone,
      x: 24 + (index % 2) * 31,
      y: 26 + Math.floor(index / 2) * 24,
      action: "system-health"
    }));
    return renderModuleGraph({
      id: "settings",
      className: "settings-flow",
      caption: "系统设置展示当前 runtime 数据源、桥接模式、健康状态和安全控制，不直接执行外部命令。",
      nodes: [
        { id: "source", label: data.runtime?.source || "mock-runtime", meta: data.runtime?.mode || "mirror", tone: "cyan", x: 49, y: 12, action: "system-health", kind: "hub" },
        ...healthNodes,
        { id: "bridge", label: "Codex Bridge", meta: codexBridgeStatus, tone: "purple", x: 78, y: 72, action: "focus-codex-request" },
        { id: "guard", label: "安全边界", meta: "外部动作需人工批准", tone: "yellow", x: 26, y: 78, action: "system-health" }
      ],
      edges: [
        ...healthNodes.map((node) => ({ from: "source", to: node.id, tone: node.tone })),
        { from: "source", to: "bridge", tone: "purple" },
        { from: "source", to: "guard", tone: "yellow" },
        { from: "guard", to: "bridge", tone: "orange", risk: true }
      ],
      aside: renderModuleAside("数据源", [
        { label: "来源", value: data.runtime?.source || "mock", tone: "cyan", attrs: "data-action=\"system-health\"" },
        { label: "模式", value: data.runtime?.mode || "mirror", tone: "purple", attrs: "data-action=\"system-health\"" },
        { label: "更新", value: data.runtime?.lastUpdated || "-", tone: "green", attrs: "data-action=\"system-health\"" },
        { label: "桥接", value: data.codexBridge?.endpoint || "/codex/request", tone: "yellow", attrs: "data-action=\"focus-codex-request\"" }
      ], "返回总览", "data-open-nav=\"总览\"")
    });
  }

  function renderAgentMiniCard(id) {
    const agent = getAgentById(id) || findOfficeAgent(id);
    if (!agent) return "";
    return `
      <section class="module-card agent-mini-card ${toneClass(agent.tone)}">
        <div class="module-card-head">
          <strong>${escapeHtml(agent.name)}</strong>
          <button type="button" data-module-agent="${agent.id}">联动</button>
        </div>
        <p>${escapeHtml(agent.details || agent.status)}</p>
        ${progressBar(agent.progress, agent.tone)}
        <span>${escapeHtml(agent.status)} · ${agent.progress}%</span>
      </section>
    `;
  }

  function renderRightRail() {
    const activeRun = bridgeRuntime?.state?.activeRun;
    const runtimeBadge = activeRun
      ? `${activeRun.agent || "Codex"} · ${statusLabel(activeRun.status)} ${Number.isFinite(Number(activeRun.progress)) ? Number(activeRun.progress) : 0}%`
      : codexBridgeStatus;
    const agentCards = data.agents.map((agent) => `
      <button class="agent-status-card ${toneClass(agent.tone)} ${selectedAgent.id === agent.id ? "selected" : ""}"
        type="button" data-agent="${agent.id}">
        <span class="avatar ${toneClass(agent.tone)} avatar-${agent.id}" aria-hidden="true">
          <i></i>
        </span>
        <span class="agent-copy">
          <strong>${escapeHtml(agent.name)}</strong>
          <em>负责：${escapeHtml(agent.role)}</em>
          <small>${escapeHtml(agent.meta)}</small>
          ${progressBar(agent.progress, agent.tone)}
        </span>
        <span class="agent-state">${escapeHtml(agent.status)}</span>
        <b>${agent.progress}%</b>
      </button>
    `).join("");

    return `
      <aside class="right-rail">
        <section class="side-panel agent-panel">
          <div class="panel-head">
            <h2>Agent 状态</h2>
            <button type="button" data-action="agent-all">查看全部</button>
          </div>
          <div class="rail-runtime-summary">
            <span class="source-dot ${bridgeRuntime ? "live" : "mirror"}"></span>
            <strong>${escapeHtml(runtimeBadge)}</strong>
          </div>
          <div class="agent-list">${agentCards}</div>
          <button class="primary-button" type="button" data-action="agent-all">查看全部 Agent</button>
          <div class="selected-detail focus-card ${toneClass(selectedAgent.tone)}">
            <div>
              <span class="avatar ${toneClass(selectedAgent.tone)} avatar-${selectedAgent.id}" aria-hidden="true"><i></i></span>
              <strong>${escapeHtml(selectedAgent.name)}</strong>
              <em>${escapeHtml(selectedAgent.status)} · ${selectedAgent.progress}%</em>
            </div>
            <p>${escapeHtml(selectedAgent.details)}</p>
          <div class="detail-actions">
            <button type="button" data-action="selected-agent-detail">详情</button>
            <button type="button" data-action="dispatch-agent">派发</button>
          </div>
          </div>
          ${renderAgentConversation(selectedAgent)}
          ${renderCodexBridgeBox()}
        </section>
        ${renderWorktreePanel()}
      </aside>
    `;
  }

  function renderAgentConversation(agent) {
    const rows = getConversation(agent).slice(0, 5).map((item) => `
      <div class="conversation-row ${runtimeToneClass(item)}">
        <time>${escapeHtml(item.time)}</time>
        <strong>${escapeHtml(item.speaker)}</strong>
        <p>${escapeHtml(item.text)}</p>
      </div>
    `).join("");

    return `
      <section class="conversation-box">
        <div class="conversation-head">
          <div>
            <strong>Agent 对话</strong>
            <span>${escapeHtml(data.runtime?.streamLabel || "运行输出")}</span>
          </div>
          <button type="button" data-action="stream-agent">刷新输出</button>
        </div>
        <div class="runtime-source">
          <span class="source-dot ${data.runtime?.mode === "mirror" ? "mirror" : "live"}"></span>
          <em>${escapeHtml(data.runtime?.statusText || "运行状态未知")}</em>
        </div>
        <div class="conversation-list">${rows}</div>
      </section>
    `;
  }

  function renderCodexBridgeBox() {
    const latest = codexRequests[0];
    const requestTone = latest?.status === "accepted" ? "green" : latest ? "yellow" : "purple";
    const activeRun = bridgeRuntime?.state?.activeRun;
    const blockerCount = bridgeRuntime?.state?.blockers?.length || 0;
    const statusTone = blockerCount ? "orange" : activeRun ? "cyan" : requestTone;
    const bridgeFeed = [
      latest ? `
        <div class="codex-feed-row">
          <span>${escapeHtml(latest.id)}</span>
          <strong>${escapeHtml(latest.statusText || latest.status)}</strong>
        </div>
      ` : `
        <div class="codex-feed-row">
          <span>暂无请求</span>
          <strong>等待输入</strong>
        </div>
      `,
      latest?.execution ? `
        <div class="codex-feed-row">
          <span>${escapeHtml(latest.execution.kind || "execution")}</span>
          <strong>${escapeHtml(latest.execution.status || latest.status)}</strong>
        </div>
      ` : "",
      activeRun ? `
        <div class="codex-feed-row live">
          <span>${escapeHtml(activeRun.agent || "Codex")}</span>
          <strong>${escapeHtml(activeRun.node || activeRun.module || "运行节点")}</strong>
          <em>${escapeHtml(statusLabel(activeRun.status))} · ${Number.isFinite(Number(activeRun.progress)) ? Number(activeRun.progress) : 0}%</em>
        </div>
      ` : "",
      blockerCount ? `
        <div class="codex-feed-row blocker">
          <span>卡点</span>
          <strong>当前 ${blockerCount} 个，点击顶部运行条查看</strong>
        </div>
      ` : ""
    ].filter(Boolean).join("");
    return `
      <section class="codex-bridge-box ${toneClass(statusTone)}">
        <div class="codex-bridge-head">
          <div>
            <strong>Codex Bridge</strong>
            <span>${escapeHtml(codexBridgeStatus)}</span>
          </div>
          <button type="button" data-action="copy-codex-packet">复制包</button>
        </div>
        <div class="codex-bridge-feed">${bridgeFeed}</div>
      </section>
    `;
  }

  function renderCodexCommandDock() {
    const latest = codexRequests[0];
    const activeRun = bridgeRuntime?.state?.activeRun;
    return `
      <section class="codex-command-dock ${toneClass(activeRun?.tone || selectedAgent.tone || "cyan")}">
        <div class="dock-head">
          <div>
            <strong>Codex 需求入口</strong>
            <span>在这里发起需求，页面生成任务包并投递本地 Codex bridge。</span>
          </div>
          <button type="button" data-action="focus-codex-request">安全契约</button>
        </div>
        <form class="codex-request-form dock-request-form" data-codex-request>
          <textarea data-codex-input rows="2" placeholder="输入要交给 Codex 推进的需求，例如：继续实现某个模块、验证当前页面、补充证据。">${escapeHtml(codexDraft)}</textarea>
          <div>
            <button type="submit">发起需求</button>
            <button type="button" data-action="copy-codex-packet">复制任务包</button>
          </div>
        </form>
        <div class="dock-status">
          <span>${latest ? escapeHtml(latest.id) : "暂无请求"}</span>
          <strong>${latest ? escapeHtml(latest.statusText || latest.status) : escapeHtml(codexBridgeStatus)}</strong>
          <em>${activeRun ? `${escapeHtml(activeRun.agent || "Codex")} · ${escapeHtml(activeRun.node || activeRun.module || "运行节点")}` : "等待运行事件"}</em>
        </div>
      </section>
    `;
  }

  function renderBottom() {
    return `
      <section class="bottom-stack">
        ${renderCodexCommandDock()}
        <div class="bottom-grid">
          ${renderActivityFeed()}
          ${renderEvidenceWall()}
        </div>
      </section>
    `;
  }

  function renderActivityFeed() {
    const rows = activityStream.map((item, index) => `
      <button class="activity-row" type="button" data-activity="${index}">
        <time>${escapeHtml(item.time)}</time>
        <strong class="${toneClass(item.tone)}">${escapeHtml(item.agent)}</strong>
        <p>${escapeHtml(item.text)}</p>
        <em class="${toneClass(item.tone)}">${escapeHtml(item.tag)}</em>
      </button>
    `).join("");

    return `
      <section class="bottom-card activity-card">
        <div class="panel-head">
          <h2>活动动态</h2>
          <button class="live-chip" type="button" data-action="simulate-event"><i></i>实时</button>
        </div>
        <div class="activity-list">${rows}</div>
      </section>
    `;
  }

  function renderEvidenceWall() {
    const filters = data.evidenceFilters.map((filter) => `
      <button class="${activeEvidenceFilter === filter.id ? "active" : ""}" type="button" data-evidence-filter="${filter.id}">
        ${escapeHtml(filter.label)}
      </button>
    `).join("");

    const evidence = activeEvidenceFilter === "all"
      ? data.evidence
      : data.evidence.filter((item) => item.filter === activeEvidenceFilter);

    const cards = evidence.map((item) => `
      <button class="evidence-card" type="button" data-evidence="${item.id}">
        <span class="evidence-preview ${item.visual}">${renderEvidenceVisual(item)}</span>
        <strong>${escapeHtml(item.name)}</strong>
        <em>${escapeHtml(item.type)}</em>
        <small>${escapeHtml(item.time)}</small>
        <span>${escapeHtml(item.source)}</span>
      </button>
    `).join("");

    return `
      <section class="bottom-card evidence-wall">
        <div class="panel-head evidence-head">
          <h2>证据墙 <span>Evidence Wall</span></h2>
          <div class="filter-tabs">${filters}</div>
        </div>
        <div class="evidence-list">${cards || "<div class='empty-state'>当前筛选下暂无证据</div>"}</div>
      </section>
    `;
  }

  function renderEvidenceVisual(item) {
    if (item.visual === "video") return "<i class='play-mark'></i>";
    if (item.visual === "code") return "<code>+128 -23</code>";
    if (item.visual === "json") return "<code>PASS</code>";
    if (item.visual === "report") return "<span class='report-preview'></span>";
    return "<span class='screen-preview'></span>";
  }

  function renderWorktreePanel() {
    const rows = data.worktrees.map((tree) => `
      <button class="worktree-row" type="button" data-worktree="${escapeHtml(tree.name)}">
        <div>
          <span class="git-dot ${toneClass(tree.tone)}"></span>
          <strong>${escapeHtml(tree.name)}</strong>
        </div>
        <em class="${toneClass(tree.tone)}">${escapeHtml(tree.status)}</em>
        <span>HEAD</span>
        <code>${escapeHtml(tree.head)}</code>
      </button>
    `).join("");

    return `
      <section class="side-panel worktree-panel">
        <div class="panel-head">
          <h2>Git / Worktree</h2>
          <button type="button" data-action="worktree-all">查看全部</button>
        </div>
        <div class="worktree-list">${rows}</div>
        <button class="primary-button" type="button" data-action="worktree-manage">管理 Worktree</button>
      </section>
    `;
  }

  function renderModal() {
    if (!activeModal) return "";
    const rows = (activeModal.rows || []).map((row) => `
      <div class="modal-row">
        <span>${escapeHtml(row.label)}</span>
        <strong>${escapeHtml(row.value)}</strong>
      </div>
    `).join("");
    const list = (activeModal.list || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    return `
      <div class="modal-backdrop" data-close-modal>
        <section class="modal-card" role="dialog" aria-modal="true">
          <button class="modal-close" type="button" data-close-modal>×</button>
          <span class="modal-kicker">${escapeHtml(activeModal.kicker || "Judgment Office")}</span>
          <h2>${escapeHtml(activeModal.title)}</h2>
          ${activeModal.body ? `<p>${escapeHtml(activeModal.body)}</p>` : ""}
          ${rows ? `<div class="modal-rows">${rows}</div>` : ""}
          ${list ? `<ul class="modal-list">${list}</ul>` : ""}
        </section>
      </div>
    `;
  }

  function renderToast() {
    if (!toastMessage) return "";
    return `<div class="toast">${escapeHtml(toastMessage)}</div>`;
  }

  function renderApp() {
    app.innerHTML = `
      <div class="office-shell">
        ${renderSidebar()}
        <main class="main">
          ${renderTopBar()}
          <div class="content-grid">
            <div class="center-stack">
              ${renderMainSurface()}
              ${renderBottom()}
            </div>
            ${renderRightRail()}
          </div>
        </main>
        ${renderModal()}
        ${renderToast()}
      </div>
    `;
    bindEvents();
    focusSearchIfNeeded();
  }

  function focusSearchIfNeeded() {
    if (focusSearchAfterRender) {
      focusSearchAfterRender = false;
      const input = document.querySelector("[data-search-input]");
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }
    if (focusCodexAfterRender) {
      focusCodexAfterRender = false;
      const input = document.querySelector("[data-codex-input]");
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }
  }

  function showModule(item) {
    activeNav = item;
    syncHash();
    pushActivity("Controller", `打开 ${item} 模块`, "模块切换", "cyan");
    setToast(`已打开：${item}`);
  }

  function modalForAgent(agent) {
    return {
      kicker: "Agent Detail",
      title: agent.name,
      body: agent.details || `${agent.name} 当前状态：${agent.status}`,
      rows: [
        { label: "职责", value: agent.role || agent.status },
        { label: "状态", value: agent.status },
        { label: "进度", value: `${agent.progress}%` },
        { label: "元信息", value: agent.meta || "办公室节点" }
      ]
    };
  }

  function openEvidenceDetail(id) {
    const evidence = data.evidence.find((item) => item.id === id);
    if (!evidence) return;
    activeEvidenceFilter = evidence.filter;
    openModal({
      kicker: "Evidence Wall",
      title: evidence.name,
      body: "证据详情已打开。当前为 mock 证据镜像，后续可接真实文件或报告链接。",
      rows: [
        { label: "类型", value: evidence.type },
        { label: "来源", value: evidence.source },
        { label: "时间", value: evidence.time },
        { label: "状态", value: evidence.status }
      ]
    });
    pushActivity(evidence.source, `查看证据 ${evidence.name}`, "证据查看", "blue");
  }

  function openWorktreeDetail(name) {
    const tree = data.worktrees.find((item) => item.name === name);
    if (!tree) return;
    openModal({
      kicker: "Git / Worktree",
      title: tree.name,
      body: "Worktree 状态详情。当前页面只展示状态，不执行 Git 修改。",
      rows: [
        { label: "状态", value: tree.status },
        { label: "HEAD", value: tree.head },
        { label: "安全边界", value: "只读展示" }
      ]
    });
    pushActivity("Git", `查看 worktree ${tree.name}`, "Git 状态", tree.tone);
  }

  function openGateDetail() {
    openModal({
      kicker: "Gate",
      title: "Gate 详情",
      body: "当前阶段进入 XB-4 开发与验证，下一步是 XB-5 集成与审查。",
      rows: [
        { label: "当前 Gate", value: data.project.gate },
        { label: "下一 Gate", value: data.project.nextGate },
        { label: "状态", value: data.project.status }
      ]
    });
    pushActivity("Controller", "查看 Gate 详情", "Gate", "cyan");
  }

  function openReviewPackage() {
    openModal({
      kicker: "555 Review",
      title: "证据包 2/5",
      body: "555 审查室等待补齐 Browser、测试报告和 Git diff 证据。",
      list: ["已收到：dashboard.png", "已收到：test-report.html", "待补充：responsive.mp4", "待补充：git-diff.patch", "待补充：api-test.json"]
    });
    pushActivity("555 Review", "查看证据包 2/5", "审查", "orange");
  }

  function bindEvents() {
    document.querySelectorAll("[data-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        activeNav = button.dataset.mode === "office" ? "Agent 办公室" : "项目拓扑";
        syncHash();
        pushActivity("Controller", `切换到${button.textContent}`, "视图切换", "cyan");
        setToast(`已切换到${button.textContent}`);
        renderApp();
      });
    });

    document.querySelectorAll("[data-nav]").forEach((button) => {
      button.addEventListener("click", () => {
        showModule(button.dataset.nav);
        renderApp();
      });
    });

    document.querySelectorAll("[data-open-nav]").forEach((button) => {
      button.addEventListener("click", () => {
        showModule(button.dataset.openNav);
        renderApp();
      });
    });

    document.querySelectorAll("[data-popover]").forEach((button) => {
      button.addEventListener("click", () => {
        const next = button.dataset.popover;
        activePopover = activePopover === next ? null : next;
        if (activePopover === "search") focusSearchAfterRender = true;
        renderApp();
      });
    });

    const searchInput = document.querySelector("[data-search-input]");
    if (searchInput) {
      searchInput.addEventListener("input", (event) => {
        searchQuery = event.target.value;
        activePopover = "search";
        focusSearchAfterRender = true;
        renderApp();
      });
    }

    document.querySelectorAll("[data-search-kind]").forEach((button) => {
      button.addEventListener("click", () => {
        handleSearchResult(button.dataset.searchKind, button.dataset.searchId);
        renderApp();
      });
    });

    document.querySelectorAll("[data-lane]").forEach((button) => {
      button.addEventListener("click", () => {
        const lane = effectiveLanes().find((item) => item.id === button.dataset.lane);
        if (!lane) return;
        const agent = data.agents.find((item) => item.id === laneAgentMap[lane.id]);
        if (agent) selectedAgent = agent;
        openModal({
          kicker: "泳道状态",
          title: lane.label,
          body: `${lane.label} 当前处于 ${lane.status}，进度 ${lane.progress}%。`,
          rows: [
            { label: "状态", value: lane.status },
            { label: "进度", value: `${lane.progress}%` },
            { label: "绑定 Agent", value: agent ? agent.name : "未绑定" }
          ]
        });
        pushActivity("Controller", `查看 ${lane.label} 泳道`, "泳道检查", lane.tone);
        renderApp();
      });
    });

    document.querySelectorAll("[data-zoom]").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.zoom;
        if (action === "in") officeZoom = Math.min(120, officeZoom + 5);
        if (action === "out") officeZoom = Math.max(90, officeZoom - 5);
        if (action === "reset") officeZoom = 100;
        if (action === "fullscreen") isFullscreen = !isFullscreen;
        setToast(action === "fullscreen" ? (isFullscreen ? "办公室已进入全屏" : "已退出全屏") : `缩放：${officeZoom}%`);
        renderApp();
      });
    });

    document.querySelectorAll("[data-agent]").forEach((button) => {
      button.addEventListener("click", () => {
        selectAgentById(button.dataset.agent, false);
        pushActivity(selectedAgent.name, "打开 Agent 状态详情", "状态查看", selectedAgent.tone);
        setToast(`已选中 ${selectedAgent.name}`);
        renderApp();
      });
    });

    document.querySelectorAll("[data-office-agent]").forEach((button) => {
      button.addEventListener("click", () => {
        const officeAgent = officeAgents.find((agent) => agent.id === button.dataset.officeAgent);
        if (!officeAgent) return;
        selectedAgent = officeAgentToAgent(officeAgent);
        openModal(modalForAgent(selectedAgent));
        pushActivity(officeAgent.name, "打开办公室节点详情", "节点查看", officeAgent.tone);
        renderApp();
      });
    });

    document.querySelectorAll("[data-module-agent]").forEach((button) => {
      button.addEventListener("click", () => {
        selectAgentById(button.dataset.moduleAgent, true);
        addConversationMessage(selectedAgent, `从 ${activeNav} 模块联动打开。`, selectedAgent.tone);
        pushActivity(selectedAgent.name, `从 ${activeNav} 联动 Agent`, "模块联动", selectedAgent.tone);
        renderApp();
      });
    });

    document.querySelectorAll("[data-room]").forEach((button) => {
      button.addEventListener("click", () => {
        const room = roomRects.find((item) => item.id === button.dataset.room);
        if (!room) return;
        const agents = officeAgents.filter((agent) => agent.zoneId === room.id);
        openModal({
          kicker: "Office Zone",
          title: room.label,
          body: "办公室分区已接入可点击反馈。",
          rows: [
            { label: "Agent 数量", value: `${agents.length}` },
            { label: "Agent", value: agents.map((agent) => agent.name).join(", ") || "无" }
          ]
        });
        pushActivity("Controller", `查看 ${room.label}`, "分区", room.tone);
        renderApp();
      });
    });

    document.querySelectorAll("[data-topology-node]").forEach((button) => {
      button.addEventListener("click", () => {
        const node = data.topologyNodes.find((item) => item.id === button.dataset.topologyNode);
        if (!node) return;
        const outgoing = data.topologyEdges.filter((edge) => edge.from === node.id).map((edge) => edge.to);
        const incoming = data.topologyEdges.filter((edge) => edge.to === node.id).map((edge) => edge.from);
        openModal({
          kicker: "Agent Graph",
          title: node.label,
          body: "拓扑节点已接入可点击详情。",
          rows: [
            { label: "上游", value: incoming.join(", ") || "无" },
            { label: "下游", value: outgoing.join(", ") || "无" }
          ]
        });
        pushActivity("Controller", `查看拓扑节点 ${node.label}`, "拓扑", node.tone);
        renderApp();
      });
    });

    document.querySelectorAll("[data-evidence-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        activeEvidenceFilter = button.dataset.evidenceFilter;
        const label = data.evidenceFilters.find((filter) => filter.id === activeEvidenceFilter)?.label || "全部";
        setToast(`证据筛选：${label}`);
        renderApp();
      });
    });

    document.querySelectorAll("[data-evidence]").forEach((button) => {
      button.addEventListener("click", () => {
        openEvidenceDetail(button.dataset.evidence);
        renderApp();
      });
    });

    document.querySelectorAll("[data-module-evidence]").forEach((button) => {
      button.addEventListener("click", () => {
        openEvidenceDetail(button.dataset.moduleEvidence);
        renderApp();
      });
    });

    document.querySelectorAll("[data-worktree]").forEach((button) => {
      button.addEventListener("click", () => {
        openWorktreeDetail(button.dataset.worktree);
        renderApp();
      });
    });

    document.querySelectorAll("[data-module-worktree]").forEach((button) => {
      button.addEventListener("click", () => {
        openWorktreeDetail(button.dataset.moduleWorktree);
        renderApp();
      });
    });

    document.querySelectorAll("[data-activity]").forEach((button) => {
      button.addEventListener("click", () => {
        const item = activityStream[Number(button.dataset.activity)];
        if (!item) return;
        openModal({
          kicker: "Activity Feed",
          title: `${item.time} · ${item.agent}`,
          body: item.text,
          rows: [
            { label: "标签", value: item.tag },
            { label: "来源", value: item.agent }
          ]
        });
        renderApp();
      });
    });

    document.querySelectorAll("[data-module-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const label = button.dataset.moduleAction;
        openModal({
          kicker: activeNav,
          title: label,
          body: `${label} 已接入 ${activeNav} 模块反馈。当前展示 mock-runtime 运行镜像，后续可接真实项目状态源。`,
          rows: [
            { label: "当前 Gate", value: data.project.gate },
            { label: "模块", value: activeNav },
            { label: "运行源", value: data.runtime?.source || "mock" }
          ]
        });
        pushActivity("Controller", `${activeNav} 模块查看 ${label}`, "模块操作", moduleToneMap[activeNav] || "cyan");
        renderApp();
      });
    });

    const codexInput = document.querySelector("[data-codex-input]");
    if (codexInput) {
      codexInput.addEventListener("input", (event) => {
        codexDraft = event.target.value;
      });
    }

    document.querySelectorAll("[data-codex-request]").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const input = form.querySelector("[data-codex-input]");
        submitCodexRequest(input?.value || "");
        renderApp();
      });
    });

    bindActionButtons();
    bindModalClose();
  }

  function bindActionButtons() {
    document.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => {
        handleAction(button.dataset.action);
        renderApp();
      });
    });

    document.querySelectorAll("[data-gate]").forEach((gate) => {
      gate.addEventListener("click", () => {
        openGateDetail();
        renderApp();
      });
    });

    const system = document.querySelector("[data-system]");
    if (system) {
      system.addEventListener("click", () => {
        openSystemHealth();
        renderApp();
      });
    }

    document.querySelectorAll("[data-review-table]").forEach((reviewTable) => {
      reviewTable.addEventListener("click", () => {
        openReviewPackage();
        renderApp();
      });
    });
  }

  function bindModalClose() {
    document.querySelectorAll("[data-close-modal]").forEach((item) => {
      item.addEventListener("click", (event) => {
        if (event.target === item) {
          closeModal();
          renderApp();
        }
      });
    });
  }

  function handleSearchResult(kind, id) {
    if (kind === "agent") {
      const agent = data.agents.find((item) => item.id === id);
      if (agent) {
        selectedAgent = agent;
        openModal(modalForAgent(agent));
      }
    }
    if (kind === "office-agent") {
      const agent = officeAgents.find((item) => item.id === id);
      if (agent) {
        selectedAgent = {
          id: agent.id,
          name: agent.name,
          role: agent.zoneLabel,
          meta: `进度：${agent.progress}%`,
          progress: agent.progress,
          status: agent.status,
          tone: agent.tone,
          details: `${agent.name} 当前处于 ${agent.status}，进度 ${agent.progress}%。`
        };
        openModal(modalForAgent(selectedAgent));
      }
    }
    if (kind === "evidence") {
      openEvidenceDetail(id);
    }
    if (kind === "worktree") {
      openWorktreeDetail(id);
    }
    if (kind === "nav") showModule(id);
    pushActivity("Controller", `搜索打开 ${id}`, "搜索", "cyan");
    setToast(`已打开搜索结果：${id}`);
  }

  function handleAction(action) {
    if (action === "simulate-event") {
      const item = runtimeMessages[Math.floor(Math.random() * runtimeMessages.length)];
      pushActivity(item.agent, item.text, item.tag, item.tone);
      addConversationMessage(selectedAgent, `收到实时事件：${item.text}`, item.tone);
      setToast("已生成一条实时事件");
    }
    if (action === "runtime-step") {
      const step = runtimeStep();
      const state = bridgeRuntime?.state || {};
      const run = state.activeRun || {};
      const blockers = (state.blockers || []).map((item) => `${item.agent || item.lane}: ${item.text}`);
      const recent = (bridgeRuntime?.recentEvents || []).slice(0, 5).map((item) => `${eventTime(item.time)} ${item.agent}: ${item.text}`);
      openModal({
        kicker: "Codex Runtime",
        title: step.title,
        body: step.meta,
        rows: [
          { label: "连接状态", value: codexBridgeStatus },
          { label: "当前 Agent", value: run.agent || "等待 Codex 回写" },
          { label: "当前泳道", value: run.lane || state.currentLane || "controller" },
          { label: "当前节点", value: run.node || state.currentNode || "controller" },
          { label: "进度", value: `${step.progress}%` },
          { label: "状态", value: step.status }
        ],
        list: [...blockers, ...recent].slice(0, 8)
      });
    }
    if (action === "system-menu" || action === "system-health") openSystemHealth();
    if (action === "agent-all") {
      openModal({
        kicker: "Agent 状态",
        title: "全部 Agent",
        body: "当前所有 Agent 状态来自 mock 运行镜像。",
        list: data.agents.map((agent) => `${agent.name} · ${agent.status} · ${agent.progress}%`)
      });
    }
    if (action === "selected-agent-detail") openModal(modalForAgent(selectedAgent));
    if (action === "dispatch-agent") {
      pushActivity(selectedAgent.name, "收到模拟派发任务，等待真实运行接入", "派发", selectedAgent.tone);
      addConversationMessage(selectedAgent, "已收到模拟派发任务。当前为 HTML 镜像反馈，不执行真实外部动作。", selectedAgent.tone);
      setToast(`已向 ${selectedAgent.name} 派发模拟任务`);
    }
    if (action === "stream-agent") {
      streamTick += 1;
      addConversationMessage(
        selectedAgent,
        `镜像输出刷新 #${streamTick}：${selectedAgent.name} 当前 ${selectedAgent.status}，进度 ${selectedAgent.progress}%。`,
        selectedAgent.tone
      );
      pushActivity(selectedAgent.name, "刷新 Agent 对话流", "流式输出", selectedAgent.tone);
      setToast(`已刷新 ${selectedAgent.name} 输出`);
    }
    if (action === "focus-codex-request") {
      focusCodexAfterRender = true;
      openModal({
        kicker: "Codex Bridge",
        title: "HTML 发起需求契约",
        body: "页面会生成结构化任务包并尝试 POST 到本地桥接服务。桥接未启动时，任务留在页面队列；文件、Git、网络、安装、发布等动作仍必须由 Codex 侧按权限和证据 gate 执行。",
        rows: [
          { label: "端点", value: data.codexBridge?.endpoint || "/codex/request" },
          { label: "当前状态", value: codexBridgeStatus },
          { label: "当前模块", value: activeNav }
        ]
      });
    }
    if (action === "copy-codex-packet") {
      copyText(latestCodexPacketText(), "已复制 Codex 任务包");
    }
    if (action === "worktree-all" || action === "worktree-manage") {
      openModal({
        kicker: "Git / Worktree",
        title: action === "worktree-manage" ? "Worktree 管理" : "全部 Worktree",
        body: "当前页面只做状态展示，不执行 Git 写操作。",
        list: data.worktrees.map((tree) => `${tree.name} · ${tree.status} · HEAD ${tree.head}`)
      });
    }
  }

  function openSystemHealth() {
    const healthRows = (data.runtime?.health || []).map((item) => ({
      label: item.label,
      value: item.value
    }));
    const gateRows = (data.runtime?.gates || []).map((item) => `${item.label}：${item.value}`);
    openModal({
      kicker: "System",
      title: "系统健康",
      body: "当前前端运行正常，静态资源、mock 数据和 Agent 对话镜像已加载。",
      rows: [
        { label: "项目", value: data.project.name },
        { label: "分支", value: data.project.branch },
        { label: "阶段", value: data.project.stage },
        { label: "基础状态", value: data.project.systemStatus },
        { label: "运行源", value: data.runtime?.source || "mock" },
        ...healthRows
      ],
      list: gateRows
    });
    pushActivity("Controller", "查看系统健康状态", "系统", "green");
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      activePopover = null;
      activeModal = null;
      isFullscreen = false;
      renderApp();
    }
  });

  window.addEventListener("hashchange", () => {
    const next = initialNav();
    if (next !== activeNav) {
      activeNav = next;
      renderApp();
    }
  });

  renderApp();
  pollBridgeState();
  window.setInterval(pollBridgeState, 2200);
})();
