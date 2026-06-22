const fs = require("node:fs");
const path = require("node:path");

const args = process.argv.slice(2);

function argValue(name, fallback) {
  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];
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
    return {
      lane: "review",
      node: "gate.advance.review",
      status: "blocked",
      progress: 60,
      tone: "orange",
      tag: "gate-review-required",
      statusText: "Controller 已接收 XB-5 申请：需要 QA/555/证据墙/Worktree 核验后才能推进 Gate",
      decision: "Gate 申请不能由 HTML 直接改变；先进入审查阻塞态，等待证据闭环。",
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

  if (!dryRun) {
    updateStatusFile(statusPath, root, runtimeDir, requestsDir, lastRequest || undefined);
  }

  console.log(JSON.stringify({
    ok: true,
    root,
    dryRun,
    matched: requests.length,
    results
  }, null, 2));
}

main();
