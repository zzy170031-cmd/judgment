const fs = require("node:fs");
const path = require("node:path");

const args = process.argv.slice(2);

function argValue(name, fallback) {
  for (let index = args.length - 2; index >= 0; index -= 1) {
    if (args[index] === name && args[index + 1]) return args[index + 1];
  }
  return fallback;
}

function safeId(value) {
  const base = String(value || "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 96);
  return base || `controller-${new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14)}`;
}

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function appendJsonl(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, `${JSON.stringify(value)}\n`, "utf8");
}

function sortByReceivedAt(a, b) {
  return String(a.receivedAt || a.createdAt || "").localeCompare(String(b.receivedAt || b.createdAt || ""));
}

function inferLane(request) {
  const text = `${request.actionType || ""} ${request.actionLabel || ""} ${request.module || ""} ${request.request || ""}`.toLowerCase();
  if (text.includes("555") || text.includes("review") || text.includes("审查")) return "review";
  if (text.includes("qa") || text.includes("test") || text.includes("evidence") || text.includes("测试") || text.includes("证据")) return "qa";
  if (text.includes("frontend") || text.includes("ui") || text.includes("agent office") || text.includes("办公室")) return "frontend";
  if (text.includes("backend") || text.includes("api") || text.includes("git") || text.includes("worktree")) return "backend";
  if (text.includes("split") || text.includes("拆分")) return "splitter";
  if (text.includes("plan") || text.includes("gate") || text.includes("规划")) return "planning";
  return "controller";
}

function isReadOnlyRequest(request) {
  const actionType = String(request.actionType || "");
  return actionType.endsWith(".inspect") ||
    actionType.endsWith(".list.inspect") ||
    actionType.endsWith(".list.request") ||
    new Set([
      "bridge.contract.inspect",
      "runtime.step.inspect",
      "runtime.event.refresh",
      "system.health.inspect",
      "qa.issue-review"
    ]).has(actionType);
}

function classifyRequest(request) {
  const lane = inferLane(request);
  const actionType = String(request.actionType || "freeform-request");
  const actionLabel = request.actionLabel || actionType;
  const targetName = request.target?.name || request.target?.label || request.target?.id || request.module || "Agent Office";

  if (isReadOnlyRequest(request)) {
    return {
      lane,
      node: actionType,
      status: "completed",
      progress: 100,
      tone: "green",
      tag: "controller-inbox-closed",
      statusText: `Controller 已读取并闭环只读请求：${actionLabel} -> ${targetName}`,
      decision: "只读检查已记录，不需要执行文件、Git 或测试动作。",
      delegatesTo: "HTML mirror",
      waitsFor: "无",
      oracle: "request packet + runtime event",
      stopCondition: "只读请求已闭环",
      nextAction: "继续处理下一个 HTML 请求或等待用户发起真实执行需求。"
    };
  }

  if (actionType === "gate.advance.request") {
    const currentGate = request.payload?.currentGate || request.gate || "当前 Gate";
    const requestedGate = request.payload?.nextGate || request.target?.name || targetName;
    return {
      lane: "review",
      node: "gate.advance.review",
      status: "blocked",
      progress: 60,
      tone: "orange",
      tag: "gate-review-required",
      statusText: `Controller 已接收 Gate 申请：${currentGate} -> ${requestedGate}；需要 QA/555/证据墙/Worktree 核验后才能推进`,
      decision: `Gate 申请不能由 HTML 直接改变；${requestedGate} 先进入审查阻塞态，等待证据闭环。`,
      delegatesTo: "QA Agent + 555 Review",
      waitsFor: "QA 通过、555 审查、证据墙和 Git/Worktree 状态",
      oracle: "测试报告、浏览器证据、Git diff、555 verdict",
      stopCondition: "证据不足、Worktree 不干净、555 未通过或用户停止",
      nextAction: "在 Codex 当前线程补齐 QA/555/证据/Git 检查，再回写 Gate 结果。"
    };
  }

  if (actionType === "agent.dispatch" || actionType === "agent.output.refresh") {
    return {
      lane,
      node: actionType,
      status: "completed",
      progress: 100,
      tone: "cyan",
      tag: "controller-inbox-routed",
      statusText: `Controller 已承接 Agent 请求：${actionLabel} -> ${targetName}`,
      decision: "页面派发已转为 Codex 当前线程的路由任务，不启动虚假的 HTML 子代理。",
      delegatesTo: request.selectedAgent?.name || "Judgment Controller",
      waitsFor: "Codex 当前线程执行或用户补充具体目标",
      oracle: "后续命令输出、浏览器证据或测试结果",
      stopCondition: "目标不明确、缺少证据 oracle 或需要人工确认",
      nextAction: "在下方流程入口写清具体修复/验证目标，或由当前 Codex 线程继续执行。"
    };
  }

  return {
    lane,
    node: actionType,
    status: "completed",
    progress: 100,
    tone: "cyan",
    tag: "controller-inbox-routed",
    statusText: `Controller 已读取并路由页面请求：${actionLabel} -> ${targetName}`,
    decision: "请求已从 HTML 队列提升为 Codex Controller 路由事项。",
    delegatesTo: lane === "review" ? "555 Review" : lane === "qa" ? "QA Agent" : "Judgment Controller",
    waitsFor: "明确目标、硬 oracle 和可回写证据",
    oracle: "命令输出、浏览器截图/DOM、测试报告、Git 状态或 555 verdict",
    stopCondition: "缺少权限、目标不清、证据不足或用户停止",
    nextAction: "按 Controller 决策在 Codex 当前线程执行，并用 /codex/event 回写结果。"
  };
}

function requestSummary(request) {
  return {
    id: request.id,
    status: request.status,
    statusText: request.statusText,
    actionType: request.actionType,
    actionLabel: request.actionLabel,
    module: request.module,
    selectedAgent: request.selectedAgent,
    receivedAt: request.receivedAt || request.createdAt
  };
}

function readRequests(requestsDir, statuses, requestId, limit) {
  if (!fs.existsSync(requestsDir)) return [];
  return fs.readdirSync(requestsDir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      const file = path.join(requestsDir, name);
      try {
        return { file, ...JSON.parse(fs.readFileSync(file, "utf8")) };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .filter((request) => !requestId || request.id === requestId)
    .filter((request) => statuses.has(request.status))
    .sort(sortByReceivedAt)
    .slice(0, limit);
}

function recentRequests(requestsDir, limit = 12) {
  if (!fs.existsSync(requestsDir)) return [];
  return fs.readdirSync(requestsDir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      try {
        return requestSummary(JSON.parse(fs.readFileSync(path.join(requestsDir, name), "utf8")));
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => String(b.receivedAt || "").localeCompare(String(a.receivedAt || "")))
    .slice(0, limit);
}

function defaultRuntimeState() {
  return {
    status: "running",
    activeRun: null,
    currentNode: "controller",
    currentLane: "controller",
    laneProgress: {},
    blockers: [],
    evidence: [],
    updatedAt: new Date().toISOString()
  };
}

function compactTimestamp(now = new Date().toISOString()) {
  return String(now).replace(/[^0-9]/g, "").slice(0, 14);
}

function queueStatsFor(requestsDir, statuses) {
  const recent = recentRequests(requestsDir, 500);
  return {
    matched: recent.filter((item) => statuses.has(item.status)).length,
    statuses: [...statuses],
    recent: recent.slice(0, 12)
  };
}

function buildSessionController(action, session, reason) {
  const isClose = action === "close";
  const nextAction = isClose
    ? "当前项目会话已关闭；如果要继续新项目，在 Codex 运行 --session-action new 创建新的 projectSession。"
    : "新项目会话已创建；HTML 继续提交申请和证据，Codex 运行收件箱脚本读取队列并回写状态。";
  return {
    agentId: "judgment-controller",
    role: "Judgment Controller",
    state: isClose ? "next-or-stop" : "intake",
    sees: ["runtime-state", "projectSession", "Codex Bridge queue", "HTML request packet"],
    decision: isClose
      ? "项目会话由 Codex Controller 关闭，HTML 只展示 closed 状态，不直接终结项目。"
      : "项目会话由 Codex Controller 创建，HTML 只显示新会话和后续推进入口。",
    delegatesTo: isClose ? "Project owner" : "Judgment Controller",
    waitsFor: isClose ? "新项目目标或用户停止" : "HTML 请求、QA/555/证据/Git 校验结果",
    oracle: "runtime-state.json + events.jsonl + request queue",
    stopCondition: isClose ? "用户确认结束或创建新项目" : "目标不清、证据不足、权限缺失或用户停止",
    nextAction,
    session: {
      id: session.id,
      project: session.project,
      gate: session.gate,
      nextGate: session.nextGate,
      lifecycle: session.lifecycle,
      reason
    }
  };
}

function buildSessionEvent(action, session, controller, now) {
  const isClose = action === "close";
  return {
    id: safeId(`project-session-${action}-${session.id}-${now}`),
    time: now,
    source: "Codex",
    agentId: "controller",
    agent: "Judgment Controller",
    lane: "controller",
    module: "Project Session",
    node: `project.session.${action}`,
    status: isClose ? "completed" : "running",
    progress: isClose ? 100 : 10,
    requestId: null,
    text: isClose
      ? `Project session closed: ${session.id}`
      : `Project session started: ${session.id}`,
    tag: `project-session-${action}`,
    tone: isClose ? "green" : "cyan",
    controller,
    projectSession: session,
    loop: {
      readiness: "codex-controller",
      stateSurface: "agent-office/runtime/runtime-state.json",
      stopCondition: controller.stopCondition
    }
  };
}

function previousGateLabel(targetGate) {
  if (String(targetGate || "").includes("XB-6")) return "XB-5 集成与审查";
  if (String(targetGate || "").includes("XB-5")) return "XB-4 开发与验证";
  return "上一 Gate";
}

function gateAdvanceNextAction(session) {
  if (String(session.gate || "").includes("XB-6")) {
    return "已进入 XB-6 发布准备；下一步执行发布候选冻结、最终证据归档和项目关闭确认。";
  }
  if (String(session.gate || "").includes("XB-5")) {
    return "已进入 XB-5 集成与审查；下一步执行集成回归、证据归档和 XB-6 发布准备检查。";
  }
  return `已进入 ${session.gate || "目标 Gate"}；下一步执行 ${session.nextGate || "下一 Gate"} 前置检查。`;
}

function gateAdvanceWaitsFor(session) {
  if (String(session.gate || "").includes("XB-6")) {
    return "发布候选冻结、最终证据归档和项目关闭申请";
  }
  if (String(session.gate || "").includes("XB-5")) {
    return "XB-5 集成回归、审查归档和下一 Gate 申请";
  }
  return `${session.nextGate || "下一 Gate"} 前置条件`;
}

function gateAdvanceStopCondition(session) {
  if (String(session.gate || "").includes("XB-6")) {
    return "发布准备发现阻塞、最终证据缺失或用户停止";
  }
  if (String(session.gate || "").includes("XB-5")) {
    return "XB-5 发现集成阻塞、证据失效或用户停止";
  }
  return "目标 Gate 发现阻塞、证据失效或用户停止";
}

function buildGateController(action, session, evidenceSummary) {
  const isAdvance = action === "advance";
  return {
    agentId: "judgment-controller",
    role: "Judgment Controller",
    state: isAdvance ? "persist" : "review",
    sees: ["runtime-state", "projectSession", "Gate request", "QA evidence", "555 review", "Git working tree"],
    decision: isAdvance
      ? `Gate 推进已由 Codex Controller 接受：当前进入 ${session.gate}。`
      : "Gate 推进仍需补齐证据，不由 HTML 直接改变项目阶段。",
    delegatesTo: isAdvance ? "Integration / QA / Release lanes" : "QA Agent + 555 Review",
    waitsFor: isAdvance ? gateAdvanceWaitsFor(session) : "QA、555、证据墙和 Git/Worktree 结果",
    oracle: evidenceSummary || "QA checks + Browser layout audit + Git/Worktree clean state + 555 verdict",
    stopCondition: isAdvance ? gateAdvanceStopCondition(session) : "证据不足、Worktree 不干净、555 未通过或用户停止",
    nextAction: session.nextAction,
    session: {
      id: session.id,
      project: session.project,
      gate: session.gate,
      nextGate: session.nextGate,
      lifecycle: session.lifecycle,
      status: session.status
    }
  };
}

function buildGateEvent(action, session, controller, now, requestId) {
  const isAdvance = action === "advance";
  return {
    id: safeId(`gate-${action}-${session.id}-${now}`),
    time: now,
    source: "Codex",
    agentId: "controller",
    agent: "Judgment Controller",
    lane: "review",
    module: "Gate",
    node: "gate.advance.review",
    status: isAdvance ? "passed" : "blocked",
    progress: isAdvance ? 100 : 60,
    requestId: requestId || null,
    text: isAdvance
      ? `${session.project} 已通过 ${previousGateLabel(session.gate)} 核验，当前 Gate 推进到 ${session.gate}`
      : `${session.project} Gate 推进仍被阻塞`,
    tag: isAdvance ? "gate-advance-accepted" : "gate-review-required",
    tone: isAdvance ? "green" : "orange",
    controller,
    projectSession: session,
    loop: {
      readiness: "manual-first",
      stateSurface: "agent-office/runtime/runtime-state.json",
      stopCondition: controller.stopCondition
    }
  };
}

function updateRequestRecord(requestsDir, requestId, event, execution) {
  if (!requestId) return null;
  const requestPath = path.join(requestsDir, `${safeId(requestId)}.json`);
  const record = readJson(requestPath, null);
  if (!record) return null;
  const nextRecord = {
    ...record,
    status: event.status,
    statusText: event.text,
    controllerDecision: event.controller,
    execution: {
      ...(record.execution || {}),
      ...execution,
      handledAt: event.time
    },
    lastEventAt: event.time,
    lastEvent: {
      id: event.id,
      status: event.status,
      agent: event.agent,
      lane: event.lane,
      module: event.module,
      node: event.node,
      progress: event.progress,
      tag: event.tag
    }
  };
  writeJson(requestPath, nextRecord);
  return requestSummary(nextRecord);
}

function handleGateAction({ action, root, runtimeDir, requestsDir, statePath, statusPath, eventsPath, dryRun }) {
  const now = new Date().toISOString();
  if (!new Set(["advance", "block"]).has(action)) {
    throw new Error(`Unsupported --gate-action: ${action}`);
  }

  const current = readJson(statePath, defaultRuntimeState());
  const previousSession = current.projectSession || {};
  const gateRequestBlocker = (current.blockers || []).find((item) => item.node === "gate.advance.review");
  const requestId = argValue("--request-id", gateRequestBlocker?.requestId || previousSession.currentRequestId || "");
  const evidenceSummary = argValue("--evidence", "");
  const targetGate = argValue("--target-gate", previousSession.nextGate || "XB-5 集成与审查");
  const followingGate = argValue("--next-gate", targetGate.includes("XB-5") ? "XB-6 发布准备" : previousSession.nextGate || "下一 Gate");
  const queue = queueStatsFor(requestsDir, new Set(["queued", "accepted"]));

  const session = {
    ...previousSession,
    id: previousSession.id || `project-${new Date(now).toISOString().slice(0, 10).replace(/-/g, "")}`,
    project: argValue("--project", previousSession.project || "OpenClaw Platform"),
    branch: argValue("--branch", previousSession.branch || "main"),
    gate: action === "advance" ? targetGate : previousSession.gate || "XB-4 开发与验证",
    nextGate: action === "advance" ? followingGate : previousSession.nextGate || targetGate,
    lifecycle: action === "advance" ? "active" : "blocked",
    status: action === "advance" ? "running" : "review-required",
    currentRequestId: requestId || null,
    currentLane: "review",
    currentNode: "gate.advance.review",
    nextAction: action === "advance"
      ? gateAdvanceNextAction({ gate: targetGate, nextGate: followingGate })
      : "继续补齐 QA、555、证据墙和 Git/Worktree 校验，再重新申请 Gate 推进。",
    queue,
    gateEvidence: evidenceSummary || "QA checks, Browser audit, Git/Worktree status, 555 verdict",
    updatedAt: now
  };

  const controller = buildGateController(action, session, evidenceSummary);
  const event = buildGateEvent(action, session, controller, now, requestId);
  const blockers = action === "advance"
    ? (current.blockers || []).filter((item) => item.node !== "gate.advance.review")
    : [
      {
        id: event.id,
        requestId,
        lane: event.lane,
        node: event.node,
        agent: event.agent,
        text: event.text,
        nextAction: controller.nextAction,
        time: now
      },
      ...(current.blockers || []).filter((item) => item.node !== "gate.advance.review")
    ].slice(0, 8);

  const nextState = {
    ...defaultRuntimeState(),
    ...current,
    status: action === "advance" && blockers.length === 0 ? "running" : "blocked",
    activeRun: {
      requestId: requestId || null,
      agent: event.agent,
      agentId: event.agentId,
      module: event.module,
      node: event.node,
      lane: event.lane,
      status: event.status,
      progress: event.progress,
      text: event.text,
      time: event.time,
      tone: event.tone
    },
    currentNode: event.node,
    currentLane: event.lane,
    laneProgress: {
      ...(current.laneProgress || {}),
      review: {
        progress: event.progress,
        status: event.status,
        tone: event.tone,
        updatedAt: now
      }
    },
    blockers,
    controller,
    projectSession: session,
    updatedAt: now
  };

  let lastRequest = null;
  if (!dryRun) {
    writeJson(statePath, nextState);
    appendJsonl(eventsPath, event);
    lastRequest = updateRequestRecord(requestsDir, requestId, event, {
      kind: "controller-gate",
      status: action === "advance" ? "accepted" : "review-required",
      oracle: controller.oracle,
      nextAction: controller.nextAction
    });
    updateStatusFile(statusPath, root, runtimeDir, requestsDir, lastRequest || undefined);
  }

  console.log(JSON.stringify({
    ok: true,
    action,
    root,
    dryRun,
    requestId,
    projectSession: session,
    event: {
      id: event.id,
      node: event.node,
      status: event.status,
      tag: event.tag
    },
    blockers: nextState.blockers,
    state: dryRun ? nextState : undefined
  }, null, 2));
}

function handleSessionAction({ action, root, runtimeDir, requestsDir, statePath, statusPath, eventsPath, statuses, dryRun }) {
  const now = new Date().toISOString();
  const reason = argValue("--reason", "");
  const current = readJson(statePath, defaultRuntimeState());
  const queue = queueStatsFor(requestsDir, statuses);

  if (action === "status") {
    console.log(JSON.stringify({
      ok: true,
      action,
      root,
      dryRun,
      projectSession: current.projectSession || null,
      controller: current.controller || null,
      activeRun: current.activeRun || null,
      blockers: current.blockers || [],
      queue
    }, null, 2));
    return;
  }

  if (!new Set(["close", "new"]).has(action)) {
    throw new Error(`Unsupported --session-action: ${action}`);
  }

  const previousSession = current.projectSession || {};
  const project = argValue("--project", previousSession.project || "OpenClaw Platform");
  const branch = argValue("--branch", previousSession.branch || "main");
  const gate = argValue("--gate", action === "new" ? "XB-1 需求冻结" : previousSession.gate || "XB-4 开发与验证");
  const nextGate = argValue("--next-gate", action === "new" ? "XB-2 拆分编组" : previousSession.nextGate || "XB-5 集成与审查");
  const sessionId = action === "new"
    ? argValue("--session-id", `project-${compactTimestamp(now)}`)
    : previousSession.id || `project-${compactTimestamp(now)}`;

  const session = {
    ...previousSession,
    id: sessionId,
    project,
    branch,
    gate,
    nextGate,
    lifecycle: action === "close" ? "closed" : "active",
    status: action === "close" ? "closed" : "running",
    currentRequestId: null,
    currentLane: "controller",
    currentNode: `project.session.${action}`,
    nextAction: action === "close"
      ? "当前项目已结束；进入新项目时请运行 --session-action new 创建新的项目会话。"
      : "新项目已建立；在页面流程推进入口提交第一步，或运行 Controller 收件箱消费现有队列。",
    queue,
    reason: reason || (action === "close" ? "project finished" : "project started"),
    createdAt: action === "new" ? now : previousSession.createdAt || now,
    closedAt: action === "close" ? now : null,
    updatedAt: now
  };
  const controller = buildSessionController(action, session, reason);
  const event = buildSessionEvent(action, session, controller, now);
  const nextState = {
    ...defaultRuntimeState(),
    ...(action === "close" ? current : {}),
    status: action === "close" ? "completed" : "running",
    activeRun: {
      requestId: null,
      agent: event.agent,
      agentId: event.agentId,
      module: event.module,
      node: event.node,
      lane: event.lane,
      status: event.status,
      progress: event.progress,
      text: event.text,
      time: event.time,
      tone: event.tone
    },
    currentNode: event.node,
    currentLane: event.lane,
    laneProgress: {
      ...(action === "close" ? current.laneProgress || {} : {}),
      controller: {
        progress: event.progress,
        status: event.status,
        tone: event.tone,
        updatedAt: now
      }
    },
    blockers: action === "close" ? [] : [],
    evidence: action === "close" ? current.evidence || [] : [],
    controller,
    projectSession: session,
    updatedAt: now
  };

  if (!dryRun) {
    writeJson(statePath, nextState);
    appendJsonl(eventsPath, event);
    updateStatusFile(statusPath, root, runtimeDir, requestsDir, undefined);
  }

  console.log(JSON.stringify({
    ok: true,
    action,
    root,
    dryRun,
    projectSession: session,
    event: {
      id: event.id,
      node: event.node,
      status: event.status,
      tag: event.tag
    },
    state: dryRun ? nextState : undefined
  }, null, 2));
}

function buildEvent(request, route, now) {
  return {
    id: safeId(`controller-inbox-${request.id}`),
    time: now,
    source: "Codex",
    agentId: "controller",
    agent: "Judgment Controller",
    lane: route.lane,
    module: request.module || request.payload?.activeNav || "Agent Office",
    node: route.node,
    status: route.status,
    progress: route.progress,
    requestId: request.id,
    text: route.statusText,
    tag: route.tag,
    tone: route.tone,
    controller: {
      agentId: "judgment-controller",
      role: "Judgment Controller",
      state: route.status === "blocked" ? "review" : "route",
      sees: ["HTML request packet", "Codex Bridge queue", "runtime-state", "Git working tree"],
      decision: route.decision,
      delegatesTo: route.delegatesTo,
      waitsFor: route.waitsFor,
      oracle: route.oracle,
      stopCondition: route.stopCondition,
      nextAction: route.nextAction
    },
    loop: {
      readiness: "manual-first",
      stateSurface: "agent-office/runtime/runtime-state.json",
      stopCondition: route.stopCondition
    }
  };
}

function applyEventToState(state, event, route, request, queueStats, now) {
  const next = { ...defaultRuntimeState(), ...state };
  next.status = event.status === "blocked" || event.status === "failed" ? event.status : "running";
  next.currentNode = event.node;
  next.currentLane = event.lane;
  next.activeRun = {
    requestId: request.id,
    agent: event.agent,
    agentId: event.agentId,
    module: event.module,
    node: event.node,
    lane: event.lane,
    status: event.status,
    progress: event.progress,
    text: event.text,
    time: event.time,
    tone: event.tone
  };
  next.controller = event.controller;
  next.projectSession = {
    id: next.projectSession?.id || `project-${new Date(now).toISOString().slice(0, 10).replace(/-/g, "")}`,
    project: request.project || "OpenClaw Platform",
    branch: request.branch || "main",
    gate: request.gate || "XB-4 开发与验证",
    nextGate: request.payload?.nextGate || request.payload?.target?.name || "XB-5 集成与审查",
    lifecycle: "active",
    status: event.status === "blocked" ? "review-required" : "running",
    currentRequestId: request.id,
    currentLane: event.lane,
    currentNode: event.node,
    nextAction: route.nextAction,
    queue: queueStats,
    updatedAt: now
  };
  next.laneProgress = {
    ...(next.laneProgress || {}),
    [event.lane]: {
      progress: event.progress,
      status: event.status,
      tone: event.tone,
      updatedAt: now
    }
  };
  const blockers = (next.blockers || []).filter((item) => item.id !== event.id && item.requestId !== request.id);
  if (event.status === "blocked") {
    blockers.unshift({
      id: event.id,
      requestId: request.id,
      lane: event.lane,
      node: event.node,
      agent: event.agent,
      text: event.text,
      nextAction: route.nextAction,
      time: now
    });
  }
  next.blockers = blockers.slice(0, 8);
  if (next.blockers.length && event.status !== "failed") {
    next.status = "blocked";
    if (next.projectSession) next.projectSession.status = "review-required";
  }
  next.updatedAt = now;
  return next;
}

function updateStatusFile(statusPath, root, runtimeDir, requestsDir, lastRequest) {
  const previous = readJson(statusPath, {});
  writeJson(statusPath, {
    ...previous,
    status: "running",
    service: "judgment-agent-office-bridge",
    root,
    runtimeDir: path.relative(root, runtimeDir).replace(/\\/g, "/"),
    updatedAt: new Date().toISOString(),
    lastRequest,
    recentRequests: recentRequests(requestsDir, 12)
  });
}

function processInbox({
  root,
  runtimeDir,
  requestsDir,
  statePath,
  statusPath,
  eventsPath,
  statuses,
  requestId,
  limit,
  dryRun
}) {
  const requests = readRequests(requestsDir, statuses, requestId, limit);
  const queueStats = {
    matched: requests.length,
    statuses: [...statuses],
    pendingBefore: recentRequests(requestsDir, 500).filter((item) => statuses.has(item.status)).length
  };
  const results = [];
  let state = readJson(statePath, defaultRuntimeState());
  let lastRequest = null;

  for (const request of requests) {
    const now = new Date().toISOString();
    const route = classifyRequest(request);
    const event = buildEvent(request, route, now);
    const nextRequest = {
      ...request,
      status: route.status,
      statusText: route.statusText,
      controllerDecision: event.controller,
      execution: {
        kind: "controller-inbox",
        status: route.status === "blocked" ? "review-required" : "routed",
        lane: route.lane,
        node: route.node,
        oracle: route.oracle,
        nextAction: route.nextAction,
        handledAt: now
      },
      lastEventAt: now,
      lastEvent: {
        id: event.id,
        status: event.status,
        agent: event.agent,
        lane: event.lane,
        module: event.module,
        node: event.node,
        progress: event.progress,
        tag: event.tag
      }
    };

    results.push({
      id: request.id,
      actionType: request.actionType,
      before: request.status,
      after: route.status,
      lane: route.lane,
      node: route.node,
      nextAction: route.nextAction
    });

    if (dryRun) continue;

    const { file, ...recordToWrite } = nextRequest;
    writeJson(request.file, recordToWrite);
    appendJsonl(eventsPath, event);
    state = applyEventToState(state, event, route, request, queueStats, now);
    writeJson(statePath, state);
    lastRequest = requestSummary(recordToWrite);
  }

  if (!dryRun && requests.length && state.projectSession) {
    const queueUpdatedAt = new Date().toISOString();
    const pendingAfter = recentRequests(requestsDir, 500).filter((item) => statuses.has(item.status)).length;
    state.projectSession = {
      ...state.projectSession,
      queue: {
        ...queueStats,
        handled: results.length,
        pendingAfter,
        updatedAt: queueUpdatedAt
      },
      updatedAt: queueUpdatedAt
    };
    writeJson(statePath, state);
  }

  if (!dryRun) {
    updateStatusFile(statusPath, root, runtimeDir, requestsDir, lastRequest || undefined);
  }

  return {
    ok: true,
    root,
    dryRun,
    matched: requests.length,
    results
  };
}

function runOnce(context) {
  const result = processInbox(context);
  console.log(JSON.stringify(result, null, 2));
  return result;
}

function main() {
  const root = path.resolve(argValue("--root", process.cwd()));
  const runtimeDir = path.join(root, "agent-office", "runtime");
  const requestsDir = path.join(runtimeDir, "requests");
  const statePath = path.join(runtimeDir, "runtime-state.json");
  const statusPath = path.join(runtimeDir, "bridge-status.json");
  const eventsPath = path.join(runtimeDir, "events.jsonl");
  const statuses = new Set(argValue("--statuses", "queued,accepted").split(",").map((item) => item.trim()).filter(Boolean));
  const requestId = argValue("--request-id", "");
  const limit = Math.max(1, Number(argValue("--limit", "20")) || 20);
  const dryRun = args.includes("--dry-run");
  const sessionAction = argValue("--session-action", "");
  const gateAction = argValue("--gate-action", "");
  const watch = args.includes("--watch");
  const verbose = args.includes("--verbose");
  const intervalMs = Math.max(1000, Number(argValue("--interval-ms", "5000")) || 5000);

  if (sessionAction) {
    handleSessionAction({
      action: sessionAction,
      root,
      runtimeDir,
      requestsDir,
      statePath,
      statusPath,
      eventsPath,
      statuses,
      dryRun
    });
    return;
  }

  if (gateAction) {
    handleGateAction({
      action: gateAction,
      root,
      runtimeDir,
      requestsDir,
      statePath,
      statusPath,
      eventsPath,
      dryRun
    });
    return;
  }

  const context = {
    root,
    runtimeDir,
    requestsDir,
    statePath,
    statusPath,
    eventsPath,
    statuses,
    requestId,
    limit,
    dryRun
  };

  if (!watch) {
    runOnce(context);
    return;
  }

  console.log(JSON.stringify({
    ok: true,
    watch: true,
    root,
    intervalMs,
    statuses: [...statuses],
    message: "Judgment Controller is watching HTML requests and writing Codex feedback events."
  }, null, 2));

  const tick = () => {
    try {
      const result = processInbox(context);
      if (verbose || result.matched) {
        console.log(JSON.stringify({
          time: new Date().toISOString(),
          matched: result.matched,
          results: result.results
        }, null, 2));
      }
    } catch (error) {
      console.error(error.stack || error.message);
      process.exitCode = 1;
    }
  };

  tick();
  setInterval(tick, intervalMs);
}

main();
